import os
import json
import time
import sqlite3
from typing import List, Optional, Dict
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uvicorn

# ── Import database helpers ──────────────────────────────────────
from database import get_db_connection, init_db

# ── Paths ────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR  = os.path.join(BASE_DIR, "..", "Frontend")
IMG_DIR       = os.path.join(BASE_DIR, "..", "Img sources")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── FastAPI App Setup ─────────────────────────────────────────────
app = FastAPI(title="PassionForge API", version="2.0")

# CORS handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── WebSocket Manager ─────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, username: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[username] = websocket

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]

    async def send_personal_message(self, message: dict, username: str):
        if username in self.active_connections:
            await self.active_connections[username].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

# ── Models ─────────────────────────────────────────────────────────
class MessageCreate(BaseModel):
    sender_id: int
    recipient: str
    content: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

# ── Database Initialization ────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    init_db()

# ── Static File Routes ─────────────────────────────────────────────
# We prioritize exact routes first, then fall back to StaticFiles

@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve the landing page."""
    return FileResponse(os.path.join(FRONTEND_DIR, "html", "landing.html"))

@app.get("/Img sources/{filename}")
async def serve_img_sources(filename: str):
    return FileResponse(os.path.join(IMG_DIR, filename))

@app.get("/uploads/{filename}")
async def serve_uploads(filename: str):
    return FileResponse(os.path.join(UPLOAD_FOLDER, filename))

# Custom route for HTML files to avoid .html in URL if desired, 
# but here we follow the directory structure
@app.get("/{filename}.html", response_class=HTMLResponse)
async def serve_html(filename: str):
    path = os.path.join(FRONTEND_DIR, "html", f"{filename}.html")
    if os.path.isfile(path):
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Page not found")

# Serve CSS and JS (mounted under /css and /javascript)
app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
app.mount("/javascript", StaticFiles(directory=os.path.join(FRONTEND_DIR, "javascript")), name="js")

# ── CHAT API ENDPOINTS ─────────────────────────────────────────────

@app.get("/messages")
async def get_messages(user_id: int = Query(...), peer: str = Query(...)):
    """Fetch conversation history between user and peer."""
    conn = get_db_connection()
    try:
        # Get current user's username
        u = conn.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()
        if not u: return []
        u_name = u["username"]

        msgs = conn.execute("""
            SELECT * FROM messages 
            WHERE (sender_id = ? AND recipient = ?) 
               OR (recipient = ? AND sender_id = (SELECT id FROM users WHERE username = ?))
            ORDER BY timestamp ASC
        """, (user_id, peer, u_name, peer)).fetchall()
        
        return [dict(m) for m in msgs]
    finally:
        conn.close()

@app.post("/messages")
async def send_message(msg: MessageCreate):
    """Save message and notify recipient via WebSocket if online."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (sender_id, recipient, content) VALUES (?, ?, ?)",
            (msg.sender_id, msg.recipient, msg.content)
        )
        conn.commit()
        msg_id = cursor.lastrowid
        
        # Get sender username for the real-time notification
        u = conn.execute("SELECT username FROM users WHERE id = ?", (msg.sender_id,)).fetchone()
        sender_name = u["username"] if u else "Unknown"

        # Prepare payload for WebSocket
        payload = {
            "type": "new_message",
            "id": msg_id,
            "sender": sender_name,
            "content": msg.content,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Real-time Broadcast: Notify the recipient
        await manager.send_personal_message(payload, msg.recipient)
        
        return {"status": "sent", "id": msg_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ── WEBSOCKETS ────────────────────────────────────────────────────────

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(username, websocket)
    try:
        while True:
            # We just keep the connection alive. 
            # Real-time messages are pushed from the POST endpoint.
            data = await websocket.receive_text()
            # Optional: handle pings or incoming WS messages here
    except WebSocketDisconnect:
        manager.disconnect(username)

# ── AUTH & OTHER ENDPOINTS (Basic Migration from app.py) ───────────────

@app.post("/login")
async def login(data: UserLogin):
    conn = get_db_connection()
    # Support login by either email or username
    user = conn.execute(
        "SELECT * FROM users WHERE email = ? OR username = ?", 
        (data.email, data.email)
    ).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password"], data.password):
        raise HTTPException(status_code=401, detail="Invalid email/username or password")

    uname = user["username"]
    
    # Safely parse hobbies
    try:
        hobbies = json.loads(user["hobbies"] or "[]")
    except:
        hobbies = []

    return {
        "user": {
            "id":       user["id"],
            "username": uname,
            "name":     f"u/{uname}",
            "initials": uname[:2].upper(),
            "email":    user["email"],
            "bio":      user["bio"] or "",
            "hobbies":  hobbies,
            "is_new_user": bool(user["is_new_user"]),
            "created_at": user["created_at"]
        }
    }

@app.post("/register", status_code=201)
async def register(data: UserRegister):
    conn = get_db_connection()
    try:
        hashed = generate_password_hash(data.password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, password, is_new_user) VALUES (?, ?, ?, 1)",
            (data.username, data.email, hashed)
        )
        user_id = cursor.lastrowid
        conn.commit()
        return {
            "message": "User created",
            "user": {
                "id": user_id,
                "username": data.username,
                "email": data.email,
                "is_new_user": True,
                "hobbies": []
            }
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    finally:
        conn.close()

class HobbyUpdate(BaseModel):
    hobbies: List[str]

@app.put("/users/{user_id}/hobbies")
async def update_hobbies(user_id: int, data: HobbyUpdate):
    conn = get_db_connection()
    try:
        hobbies_json = json.dumps(data.hobbies)
        conn.execute(
            "UPDATE users SET hobbies = ?, is_new_user = 0 WHERE id = ?",
            (hobbies_json, user_id)
        )
        conn.commit()
        return {"message": "Hobbies updated"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/posts")
async def get_posts():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM posts ORDER BY created_at DESC").fetchall()
    conn.close()
    
    posts = []
    for r in rows:
        posts.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "userName": r["username"],
            "userInitials": r["user_initials"],
            "type": r["type"],
            "caption": r["caption"],
            "mediaUrl": r["media_url"] or "",
            "mediaIsVideo": bool(r["media_is_video"]),
            "likes": r["likes"] or 0,
            "timestamp": r["created_at"]
        })
    return posts

# (Other endpoints like /upload, /communities etc. could be added here)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
