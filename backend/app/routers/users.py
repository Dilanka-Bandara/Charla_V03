from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from pathlib import Path
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse, UserUpdate
from ..core.security import get_current_user
from ..config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    if user_data.avatar_url is not None:
        current_user.avatar_url = user_data.avatar_url
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path(settings.upload_dir) / "avatars"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_extension = file.filename.split(".")[-1]
    file_name = f"{current_user.id}_{current_user.username}.{file_extension}"
    file_path = upload_dir / file_name
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user avatar URL
    current_user.avatar_url = f"/uploads/avatars/{file_name}"
    db.commit()
    
    return {"avatar_url": current_user.avatar_url}

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
