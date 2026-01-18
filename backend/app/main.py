from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .database import engine, Base
from .routers import auth, users, messages, rooms, websocket
from .config import get_settings

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory
Path(settings.upload_dir).mkdir(exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    description="A modern real-time chat application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(websocket.router, tags=["WebSocket"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to ChatFlow API 🚀",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
