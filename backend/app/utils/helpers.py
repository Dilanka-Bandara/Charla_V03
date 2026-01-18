from typing import Optional
from datetime import datetime, timedelta
import hashlib
import secrets

def generate_unique_id() -> str:
    """Generate a unique ID"""
    return secrets.token_urlsafe(16)

def hash_string(text: str) -> str:
    """Hash a string using SHA256"""
    return hashlib.sha256(text.encode()).hexdigest()

def format_timestamp(dt: datetime) -> str:
    """Format datetime to readable string"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days == 0:
        if diff.seconds < 60:
            return "just now"
        elif diff.seconds < 3600:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.days == 1:
        return "yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    else:
        return dt.strftime("%b %d, %Y")

def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """Validate file extension"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed_extensions

def get_file_size_mb(size_bytes: int) -> float:
    """Convert bytes to MB"""
    return size_bytes / (1024 * 1024)
