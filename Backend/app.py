
# ============================================================
# PassionForge - Flask Backend
# File: app.py
#
# How to run: python app.py  (from the Backend/ folder)
# Then open:  http://localhost:5000
#
# All data is stored in passionforge.db (SQLite)
# Uploaded images/videos go into Backend/uploads/
# ============================================================

import os
import json
import time

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from database import init_db, get_db_connection

# ── Path Setup ──────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR  = os.path.join(BASE_DIR, "..", "Frontend")
IMG_DIR       = os.path.join(BASE_DIR, "..", "Img sources")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

# Make sure uploads folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── Flask App Setup ──────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024 # Limit: 100 MB

# Allow all origins (needed because frontend and backend share the same port via Flask)
@app.after_request
def add_cors_headers(response):
    # This lets the browser talk to this server from any origin
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

# Handle preflight OPTIONS requests (browsers send these before real requests)
@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    return "", 204

# ── Database Startup ─────────────────────────────────────────────────────────
init_db()

# Fix any posts saved before the username was corrected
def fix_old_posts():
    """One-time fix: update posts where username was 'u/you' or blank."""
    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE posts
            SET
                username      = (SELECT 'u/' || username FROM users WHERE users.id = posts.user_id),
                user_initials = (SELECT UPPER(SUBSTR(username, 1, 2)) FROM users WHERE users.id = posts.user_id)
            WHERE username = 'u/you' OR username = 'you' OR username IS NULL
        """)
        conn.commit()
        print("[OK] Post identities verified.")
    except Exception as e:
        print(f"[WARN] Post fix skipped: {e}")
    finally:
        conn.close()

fix_old_posts()


# ============================================================
# STATIC FILE SERVING
# Flask serves the entire frontend so the app works from
# http://localhost:5000 without needing a separate web server
# ============================================================

@app.route("/")
def home():
    """Landing page — login/signup."""
    return send_from_directory(os.path.join(FRONTEND_DIR, "html"), "landing.html")

@app.route("/Img sources/<path:filename>")
def serve_img_sources(filename):
    """Serve original project images (logo, etc.) from the Img sources folder."""
    return send_from_directory(IMG_DIR, filename)

@app.route("/<path:filename>")
def serve_frontend(filename):
    """
    Catch-all route that serves HTML, CSS, JS, and images.
    1. First checks the Frontend/ root (for css/ and javascript/ folders)
    2. Then checks Frontend/html/ (for .html pages)
    """
    # Try Frontend/ root first (css, javascript subdirectories)
    full_path = os.path.join(FRONTEND_DIR, filename)
    if os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIR, filename)

    # Try Frontend/html/ (for HTML page navigations)
    html_path = os.path.join(FRONTEND_DIR, "html", filename)
    if os.path.isfile(html_path):
        return send_from_directory(os.path.join(FRONTEND_DIR, "html"), filename)

    return "File not found", 404

@app.route("/Img sources/<path:filename>")
def serve_images(filename):
    """Serve project images like the logo."""
    return send_from_directory(IMG_DIR, filename)

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    """Serve user-uploaded images and videos stored in Backend/uploads/."""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============================================================
# ROUTE: Upload File
# POST /upload
# Used by: post.js when user attaches an image or video
# Saves file to Backend/uploads/ and returns the URL path
# ============================================================

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file sent"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    # Use a timestamp prefix to avoid name collisions
    unique_name = f"{int(time.time())}_{file.filename}"
    save_path   = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(save_path)

    # Return the path so the frontend can build the full URL
    return jsonify({"url": f"/uploads/{unique_name}"}), 200


# ============================================================
# ROUTE: Register (Sign Up)
# POST /register
# Body: { "username": "...", "email": "...", "password": "..." }
# Used by: landing.html Sign Up button
# ============================================================

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received"}), 400

    username = data.get("username", "").strip()
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "").strip()

    # Basic validation
    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Never store plain-text passwords — always hash them
    hashed = generate_password_hash(password)

    conn   = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check for duplicate email
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            return jsonify({"error": "An account with this email already exists."}), 409

        # Check for duplicate username
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return jsonify({"error": "Username is already taken. Please choose another."}), 409

        # Insert the new user
        cursor.execute(
            "INSERT INTO users (username, email, password, hobbies) VALUES (?, ?, ?, ?)",
            (username, email, hashed, json.dumps([]))
        )
        conn.commit()

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Account created! Please log in."}), 201


# ============================================================
# ROUTE: Login
# POST /login
# Body: { "email": "...", "password": "..." }
# Returns: user object → stored in localStorage as pf_user
# Used by: landing.html Login button
# ============================================================

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received"}), 400

    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()
    # Check both email and username (so we don't break the UI functionality)
    cursor.execute("SELECT * FROM users WHERE email = ? OR username = ?", (email, email))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "No account found with that email."}), 401

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password. Please try again."}), 401

    # Parse hobbies JSON string back to a list
    try:
        hobbies = json.loads(user["hobbies"]) if user["hobbies"] else []
    except:
        hobbies = []

    uname = user["username"]
    return jsonify({
        "message": "Login successful!",
        "user": {
            "id":       user["id"],
            "username": uname,
            "name":     "u/" + uname,           # shown on posts as "u/username"
            "initials": uname[:2].upper(),       # shown in avatar circle
            "email":    user["email"],
            "bio":      user["bio"] if user["bio"] else "",
            "hobbies":  hobbies,
            "created_at": user["created_at"]
        }
    }), 200


# ============================================================
# ROUTE: Update Hobbies
# PUT /users/<id>/hobbies
# Body: { "hobbies": ["Music", "Dance", ...] }
# Used by: hobby_selection.js after user picks interests
# ============================================================

@app.route("/users/<int:user_id>/hobbies", methods=["PUT"])
def update_hobbies(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400

    hobbies_str = json.dumps(data.get("hobbies", []))

    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))

    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "User not found"}), 404

    cursor.execute("UPDATE users SET hobbies = ? WHERE id = ?", (hobbies_str, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Hobbies saved!"}), 200


# ============================================================
# ROUTE: Update Profile (username + bio)
# PUT /users/<id>/profile
# Body: { "username": "...", "bio": "..." }
# Used by: account_settings.js "Save Profile" button
# ============================================================

@app.route("/users/<int:user_id>/profile", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400

    new_username = data.get("username", "").strip()
    new_bio      = data.get("bio", "").strip()

    if not new_username:
        return jsonify({"error": "Username cannot be empty"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()

    # Make sure the new username isn't already taken by a different user
    cursor.execute("SELECT id FROM users WHERE username = ? AND id != ?", (new_username, user_id))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Username already taken"}), 409

    cursor.execute(
        "UPDATE users SET username = ?, bio = ? WHERE id = ?",
        (new_username, new_bio, user_id)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message":  "Profile updated!",
        "name":     "u/" + new_username,
        "initials": new_username[:2].upper()
    }), 200


# ============================================================
# ROUTE: Change Password
# PUT /users/<id>/password
# Body: { "current_password": "...", "new_password": "..." }
# Used by: account_settings.js "Update Password" button
# ============================================================

@app.route("/users/<int:user_id>/password", methods=["PUT"])
def change_password(user_id):
    data       = request.get_json()
    current_pw = data.get("current_password", "")
    new_pw     = data.get("new_password", "")

    if not current_pw or not new_pw:
        return jsonify({"error": "Both passwords required"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(row["password"], current_pw):
        conn.close()
        return jsonify({"error": "Current password is incorrect"}), 401

    cursor.execute(
        "UPDATE users SET password = ? WHERE id = ?",
        (generate_password_hash(new_pw), user_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Password changed!"}), 200


# ============================================================
# ROUTE: Get All Posts (Feed)
# GET /posts
# Returns: list of all posts, newest first
# Used by: post.js on page load to populate the feed
# ============================================================

@app.route("/posts", methods=["GET"])
def get_posts():
    """Retrieve posts with optional filtering and sorting."""
    cat  = request.args.get("category", "all")
    sort = request.args.get("sort", "new") # new or hot

    conn = get_db_connection()
    query = "SELECT * FROM posts"
    params = []

    if cat != "all":
        # Search for category within the JSON string/list stored in 'hobbies' or content
        query += " WHERE LOWER(hobbies) LIKE ? OR LOWER(caption) LIKE ?"
        params.append(f'%{cat}%'); params.append(f'%{cat}%')

    if sort == "hot":
        query += " ORDER BY likes DESC, created_at DESC"
    else:
        query += " ORDER BY created_at DESC"

    rows = conn.execute(query, params).fetchall()
    conn.close()

    posts = []
    for r in rows:
        # JSON fields were stored as strings — parse them back to lists
        try:
            hobbies  = json.loads(r["hobbies"])  if r["hobbies"]  else []
        except:
            hobbies  = []
        try:
            hashtags = json.loads(r["hashtags"]) if r["hashtags"] else []
        except:
            hashtags = []
        try:
            comments = json.loads(r["comments"]) if r["comments"] else []
        except:
            comments = []

        posts.append({
            "id":           r["id"],
            "user_id":      r["user_id"],
            "userName":     r["username"],        # matches what post.js expects
            "userInitials": r["user_initials"],
            "type":         r["type"],
            "caption":      r["caption"],
            "mediaUrl":     r["media_url"] or "",
            "mediaIsVideo": bool(r["media_is_video"]),
            "hobbies":      hobbies,
            "hashtags":     hashtags,
            "comments":     comments,
            "likes":        r["likes"] or 0,
            "timestamp":    r["created_at"]
        })

    return jsonify(posts), 200


# ============================================================
# ROUTE: Create Post
# POST /posts
# Body: { user_id, userName, userInitials, type, caption,
#         mediaUrl, mediaIsVideo, hobbies, hashtags }
# Used by: post.js when user clicks "🚀 Post"
# ============================================================

@app.route("/posts", methods=["POST"])
def create_post():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400

    user_id       = data.get("user_id")
    username      = data.get("userName",     "u/unknown")
    user_initials = data.get("userInitials", "??")
    p_type        = data.get("type",         "text")
    caption       = data.get("caption",      "")
    media_url     = data.get("mediaUrl",     "")
    is_video      = 1 if data.get("mediaIsVideo") else 0
    hobbies_str   = json.dumps(data.get("hobbies",  []))
    hashtags_str  = json.dumps(data.get("hashtags", []))

    # Must be logged in to post
    if not user_id:
        return jsonify({"error": "Not logged in"}), 400

    if not caption and not media_url:
        return jsonify({"error": "Post must have a caption or media"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO posts
              (user_id, username, user_initials, type, caption,
               media_url, media_is_video, hobbies, hashtags, comments, likes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 0)
        """, (user_id, username, user_initials, p_type, caption,
              media_url, is_video, hobbies_str, hashtags_str))
        conn.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Post created!", "post_id": new_id}), 201


# ============================================================
# ROUTE: Delete Post
# DELETE /posts/<id>
# Used by: post.js "My Posts" panel delete button
# ============================================================

@app.route("/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM posts WHERE id = ?", (post_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    cursor.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Post deleted!"}), 200


# ============================================================
# ROUTE: Vote on Post (Like / Dislike)
# PUT /posts/<id>/vote
# Body: { "action": "+1" or "-1" }
# Used by: post.js up/down vote buttons
# ============================================================

@app.route("/posts/<int:post_id>/vote", methods=["PUT"])
def vote_post(post_id):
    data   = request.get_json()
    action = data.get("action")

    if action not in ["+1", "-1"]:
        return jsonify({"error": "Invalid action"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT likes FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    current = row["likes"] or 0
    current = current + 1 if action == "+1" else max(0, current - 1)

    cursor.execute("UPDATE posts SET likes = ? WHERE id = ?", (current, post_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Vote saved", "likes": current}), 200


# ============================================================
# ROUTE: Add Comment to Post
# POST /posts/<id>/comment
# Body: { "text": "...", "username": "u/yourname" }
# Used by: post.js "Post Comment" button
# ============================================================

@app.route("/posts/<int:post_id>/comment", methods=["POST"])
def add_comment(post_id):
    data     = request.get_json()
    text     = data.get("text", "").strip()
    username = data.get("username", "Anon")

    if not text:
        return jsonify({"error": "Comment is empty"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT comments FROM posts WHERE id = ?", (post_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    try:
        current = json.loads(row["comments"]) if row["comments"] else []
    except:
        current = []

    # Add the new comment to the list
    current.append({
        "user": username,
        "text": text,
        "time": "Just now"
    })

    cursor.execute("UPDATE posts SET comments = ? WHERE id = ?", (json.dumps(current), post_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Comment added!", "comments": current}), 200


# ============================================================
# ROUTE: Get Single User
# GET /users/<id>
# Used by: account settings page to load existing data
# ============================================================

@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, hobbies, bio, created_at FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        hobbies = json.loads(user["hobbies"]) if user["hobbies"] else []
    except:
        hobbies = []

    return jsonify({
        "id":         user["id"],
        "username":   user["username"],
        "email":      user["email"],
        "bio":        user["bio"] if user["bio"] else "",
        "hobbies":    hobbies,
        "created_at": user["created_at"]
    }), 200


# ============================================================
# ROUTE: Delete User Account
# DELETE /users/<id>
# Used by: account settings "Delete Account" button
# ============================================================

@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn   = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # Also delete all posts by this user
    cursor.execute("DELETE FROM posts WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Account deleted."}), 200


# ── SEARCH ──────────────────────────────────────────────────────────────────

@app.route("/search")
def global_search():
    """Simple search across posts and usernames."""
    q = request.args.get("q", "").lower()
    if not q: return jsonify({"posts": [], "users": []})

    conn = get_db_connection()
    # 1. Search posts
    posts = conn.execute("""
        SELECT * FROM posts WHERE LOWER(caption) LIKE ? OR LOWER(username) LIKE ?
        ORDER BY created_at DESC LIMIT 20
    """, (f'%{q}%', f'%{q}%')).fetchall()
    
    # 2. Search users (minimal fix to prevent undefined users error)
    users = conn.execute("SELECT id, username, bio, hobbies FROM users WHERE LOWER(username) LIKE ? LIMIT 10", (f'%{q}%',)).fetchall()
    
    # Process results to match the expected frontend structure
    posts_list = []
    for r in posts:
        try: hobbies  = json.loads(r["hobbies"]) if r["hobbies"] else []
        except: hobbies = []
        try: hashtags = json.loads(r["hashtags"]) if r["hashtags"] else []
        except: hashtags = []
        try: comments = json.loads(r["comments"]) if r["comments"] else []
        except: comments = []

        posts_list.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "userName": r["username"],
            "userInitials": r["user_initials"] if "user_initials" in r.keys() else "??",
            "type": r["type"],
            "caption": r["caption"],
            "mediaUrl": r["media_url"] or "",
            "mediaIsVideo": bool(r["media_is_video"]),
            "hobbies": hobbies,
            "hashtags": hashtags,
            "comments": comments,
            "likes": r["likes"] or 0,
            "timestamp": r["created_at"]
        })

    return jsonify({
        "posts": posts_list,
        "users": [dict(u) for u in users]
    })


# ── COMMUNITIES ──────────────────────────────────────────────────────────────

@app.route("/communities", methods=["GET"])
def list_communities():
    """List all available communities."""
    conn = get_db_connection()
    comms = conn.execute("SELECT * FROM communities ORDER BY name ASC").fetchall()
    conn.close()
    return jsonify([dict(c) for c in comms])

@app.route("/communities", methods=["POST"])
def create_community():
    """Create a new community."""
    data = request.get_json()
    name = data.get("name")
    desc = data.get("description", "")
    cat  = data.get("category", "General")

    if not name: return jsonify({"error": "Name is required"}), 400

    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO communities (name, description, category) VALUES (?, ?, ?)",
                     (name, desc, cat))
        conn.commit()
        return jsonify({"message": "Community created!"}), 201
    except:
        return jsonify({"error": "Name already exists"}), 400
    finally:
        conn.close()

@app.route("/communities/join", methods=["POST"])
def join_community():
    """Join a community."""
    data = request.get_json()
    u_id = data.get("user_id")
    c_n  = data.get("community_name")

    if not u_id or not c_n: return jsonify({"error": "Missing info"}), 400

    conn = get_db_connection()
    try:
        # Get community ID by name first
        c = conn.execute("SELECT id FROM communities WHERE name = ?", (c_n,)).fetchone()
        if not c:
            # If it doesn't exist, create it (simple behavior for student project)
            cursor = conn.execute("INSERT INTO communities (name) VALUES (?)", (c_n,))
            c_id = cursor.lastrowid
        else:
            c_id = c["id"]

        conn.execute("INSERT OR IGNORE INTO user_communities (user_id, community_id) VALUES (?, ?)", (u_id, c_id))
        conn.commit()
        return jsonify({"message": "Joined!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# ── MESSAGING ───────────────────────────────────────────────────────────────

@app.route("/messages", methods=["GET"])
def get_messages():
    """Get message history between current user and another user."""
    u_id = request.args.get("user_id")
    peer = request.args.get("peer") # peer username

    if not u_id or not peer: return jsonify([])

    conn = get_db_connection()
    # Get current user's username
    u = conn.execute("SELECT username FROM users WHERE id = ?", (u_id,)).fetchone()
    if not u: return jsonify([])
    u_name = u["username"]

    msgs = conn.execute("""
        SELECT * FROM messages 
        WHERE (sender_id = ? AND recipient = ?) 
           OR (recipient = ? AND sender_id = (SELECT id FROM users WHERE username = ?))
        ORDER BY timestamp ASC
    """, (u_id, peer, u_name, peer)).fetchall()
    conn.close()
    return jsonify([dict(m) for m in msgs])

@app.route("/messages", methods=["POST"])
def send_message():
    """Save a new chat message."""
    data = request.get_json()
    s_id = data.get("sender_id")
    rcpt = data.get("recipient")
    cont = data.get("content")

    if not s_id or not rcpt or not cont: return jsonify({"error": "Incomplete"}), 400

    conn = get_db_connection()
    conn.execute("INSERT INTO messages (sender_id, recipient, content) VALUES (?, ?, ?)",
                 (s_id, rcpt, cont))
    conn.commit()
    conn.close()
    return jsonify({"message": "Sent"}), 201


# ── REWARDS SYNC ────────────────────────────────────────────────────────────

@app.route("/users/rewards", methods=["PUT"])
def sync_rewards():
    """Persist user points and badges."""
    data = request.get_json()
    u_id = data.get("user_id")
    pts  = data.get("points")
    bdgs = json.dumps(data.get("badges", []))

    if not u_id: return jsonify({"error": "No user ID"}), 400

    conn = get_db_connection()
    conn.execute("UPDATE users SET points = ?, badges = ? WHERE id = ?", (pts, bdgs, u_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Rewards synced"})


# ============================================================
# START SERVER
# debug=True = auto-restarts when you change the code (dev only)
# Set debug=False before presenting to faculty
# ============================================================

if __name__ == "__main__":
    print("\n[START] PassionForge backend starting...")
    print("Open in browser: http://localhost:5000\n")
    app.run(host="0.0.0.0", debug=True, port=5000)
