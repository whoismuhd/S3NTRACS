"""
Rate limiting middleware (placeholder for future implementation).
In production, consider using slowapi or implementing Redis-based rate limiting.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict

# Simple in-memory rate limiter (for development only)
# In production, use Redis or a proper rate limiting library
_request_counts = defaultdict(list)
_CLEANUP_INTERVAL = 60  # Clean up old entries every 60 seconds
_LAST_CLEANUP = time.time()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple rate limiting middleware.
    Limits requests per IP address.
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/health/simple", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Clean up old entries periodically
        global _LAST_CLEANUP
        current_time = time.time()
        if current_time - _LAST_CLEANUP > _CLEANUP_INTERVAL:
            self._cleanup_old_entries()
            _LAST_CLEANUP = current_time
        
        # Check rate limit
        current_time = time.time()
        minute_ago = current_time - 60
        
        # Filter requests from the last minute
        _request_counts[client_ip] = [
            timestamp for timestamp in _request_counts[client_ip]
            if timestamp > minute_ago
        ]
        
        # Check if limit exceeded
        if len(_request_counts[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                headers={"Retry-After": "60"},
            )
        
        # Record this request
        _request_counts[client_ip].append(current_time)
        
        # Process request
        response = await call_next(request)
        return response
    
    def _cleanup_old_entries(self):
        """Remove entries older than 2 minutes."""
        current_time = time.time()
        two_minutes_ago = current_time - 120
        for ip in list(_request_counts.keys()):
            _request_counts[ip] = [
                timestamp for timestamp in _request_counts[ip]
                if timestamp > two_minutes_ago
            ]
            if not _request_counts[ip]:
                del _request_counts[ip]

