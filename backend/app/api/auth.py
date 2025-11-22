from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, PasswordChange, TwoFactorSetup, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.token import Token
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_reset_token,
)
from app.core.config import settings
from app.core.validation import validate_email, validate_password_strength
from app.api.deps import get_current_user, require_superadmin

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """Register a new user. First user becomes superadmin automatically."""
    # Validate email format
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format",
        )
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if this is the first user - if so, make them superadmin
    user_count = db.query(User).count()
    role = user_data.role if user_count > 0 else "superadmin"
    
    # If not first user, require superadmin to create users
    if user_count > 0:
        # This would require auth, but for MVP we'll allow it
        # In production, uncomment: current_user: User = Depends(require_superadmin)
        pass
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=role,
        tenant_id=user_data.tenant_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT token."""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "tenant_id": str(user.tenant_id) if user.tenant_id else None},
        expires_delta=access_token_expires,
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    # Ensure two_factor_enabled is always a string, defaulting to "false" if None
    if not hasattr(current_user, 'two_factor_enabled') or current_user.two_factor_enabled is None:
        current_user.two_factor_enabled = "false"
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile. Email cannot be changed after account creation."""
    # Update name if provided
    if user_data.name is not None:
        if len(user_data.name.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be empty",
            )
        if len(user_data.name) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be longer than 100 characters",
            )
        current_user.name = user_data.name.strip()
    
    # Email cannot be changed after account creation for security reasons
    # This is intentional - email is tied to authentication
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/me/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change user password."""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    
    # Validate new password strength
    is_valid, error_msg = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    
    # Check that new password is different
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/me/2fa/setup")
def get_2fa_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get 2FA setup QR code and secret (if not enabled)."""
    import pyotp
    from io import BytesIO
    import qrcode
    import base64
    
    # If already enabled, don't allow re-setup without disabling first
    if current_user.two_factor_enabled == "true":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled. Disable it first to set up a new secret.",
        )
    
    # Generate a new secret
    secret = pyotp.random_base32()
    
    # Create TOTP URI
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="S3ntraCS"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    # Store secret temporarily (but don't enable yet)
    current_user.two_factor_secret = secret
    db.commit()
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{img_str}",
        "manual_entry_key": secret
    }


@router.post("/me/2fa/verify")
def verify_2fa(
    verification_data: TwoFactorSetup,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify and enable 2FA."""
    import pyotp
    
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No 2FA setup found. Please generate a setup first.",
        )
    
    # Verify the code
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(verification_data.verification_code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your authenticator app.",
        )
    
    # Enable 2FA
    current_user.two_factor_enabled = "true"
    db.commit()
    db.refresh(current_user)
    
    return {"message": "2FA enabled successfully"}


@router.post("/me/2fa/disable")
def disable_2fa(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disable 2FA (requires password verification)."""
    # Verify password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect",
        )
    
    # Disable 2FA
    current_user.two_factor_enabled = "false"
    current_user.two_factor_secret = None
    db.commit()
    
    return {"message": "2FA disabled successfully"}


@router.post("/forgot-password")
def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Request password reset. Generates a reset token and sends email (if email service is configured)."""
    from datetime import datetime, timedelta
    
    # Find user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    # Always return success message (don't reveal if email exists)
    if not user:
        return {"message": "If that email exists, a password reset link has been sent."}
    
    # Generate reset token
    reset_token = generate_reset_token()
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
    
    # Store token in database
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    
    # Send email with reset link
    try:
        from app.services.notification_service import send_password_reset_email
        from app.core.app_config import WEBSITE_URL
        
        reset_url = f"{WEBSITE_URL}/reset-password?token={reset_token}"
        send_password_reset_email(db, user, reset_url)
    except Exception as e:
        # Log error but don't fail the request (security: don't reveal if email exists)
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email: {e}", exc_info=True)
        # In development, still return token if email fails
        if settings.DEBUG:
            return {
                "message": "If that email exists, a password reset link has been sent.",
                "reset_token": reset_token,  # Only in DEBUG mode
                "error": f"Email sending failed: {str(e)}"
            }
    
    return {
        "message": "If that email exists, a password reset link has been sent.",
        # Only return token in DEBUG mode for development
        "reset_token": reset_token if settings.DEBUG else None,
    }


@router.post("/reset-password")
def reset_password(
    request_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Reset password using a valid reset token."""
    from datetime import datetime
    
    # Find user by reset token
    user = db.query(User).filter(User.reset_token == request_data.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    
    # Check if token has expired
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one.",
        )
    
    # Validate new password strength
    is_valid, error_msg = validate_password_strength(request_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    
    # Update password and clear reset token
    user.password_hash = get_password_hash(request_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}

