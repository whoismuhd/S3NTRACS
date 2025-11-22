"""
WebSocket endpoints for real-time scan progress updates.
"""
import json
import logging
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.user import User
from app.models.scan_run import ScanRun
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        # tenant_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, tenant_id: str):
        """Add a WebSocket connection for a tenant."""
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = set()
        self.active_connections[tenant_id].add(websocket)
        logger.info(f"WebSocket connected for tenant {tenant_id}. Total connections: {len(self.active_connections.get(tenant_id, set()))}")
    
    def disconnect(self, websocket: WebSocket, tenant_id: str):
        """Remove a WebSocket connection."""
        if tenant_id in self.active_connections:
            self.active_connections[tenant_id].discard(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]
        logger.info(f"WebSocket disconnected for tenant {tenant_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
    
    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        """Broadcast a message to all connections for a tenant."""
        if tenant_id not in self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections[tenant_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection, tenant_id)


manager = ConnectionManager()


@router.websocket("/scan-progress/{tenant_id}")
async def websocket_scan_progress(
    websocket: WebSocket,
    tenant_id: str,
):
    """
    WebSocket endpoint for real-time scan progress updates.
    
    Client should connect with a JWT token in query params:
    ws://host/ws/scan-progress/{tenant_id}?token=JWT_TOKEN
    """
    try:
        # Get token from query params
        query_params = dict(websocket.query_params)
        token = query_params.get("token")
        
        # Authenticate user
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Decode JWT token
        payload = decode_access_token(token)
        if payload is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Get database session
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            current_user = db.query(User).filter(User.email == email).first()
            if current_user is None:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            
            # Check tenant access
            if current_user.role != "superadmin" and (
                current_user.role != "tenant_admin" or str(current_user.tenant_id) != tenant_id
            ):
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            # Connect after authentication
            await manager.connect(websocket, tenant_id)
            
            # Send initial scan status
            latest_scan = (
                db.query(ScanRun)
                .filter(ScanRun.tenant_id == UUID(tenant_id))
                .order_by(ScanRun.started_at.desc())
                .first()
            )
            
            if latest_scan:
                await manager.send_personal_message({
                    "type": "scan_status",
                    "scan_id": str(latest_scan.id),
                    "status": latest_scan.status,
                    "started_at": latest_scan.started_at.isoformat() if latest_scan.started_at else None,
                    "summary": latest_scan.summary,
                }, websocket)
            
            # Keep connection alive and listen for messages
            while True:
                try:
                    data = await websocket.receive_text()
                    # Echo back or handle client messages if needed
                    message = json.loads(data) if data else {}
                    if message.get("type") == "ping":
                        await manager.send_personal_message({"type": "pong"}, websocket)
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    logger.error(f"Error in WebSocket loop: {e}")
                    break
        finally:
            db.close()
            manager.disconnect(websocket, tenant_id)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        try:
            await websocket.close()
        except:
            pass
        manager.disconnect(websocket, tenant_id)


async def notify_scan_update(tenant_id: UUID, scan_run: ScanRun, db: Session):
    """
    Notify all WebSocket connections for a tenant about a scan update.
    Call this from the scan service when scan status changes.
    """
    message = {
        "type": "scan_update",
        "scan_id": str(scan_run.id),
        "status": scan_run.status,
        "started_at": scan_run.started_at.isoformat() if scan_run.started_at else None,
        "finished_at": scan_run.finished_at.isoformat() if scan_run.finished_at else None,
        "summary": scan_run.summary,
    }
    
    await manager.broadcast_to_tenant(str(tenant_id), message)

