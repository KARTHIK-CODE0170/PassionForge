# PassionForge - Backend

This is the simple Flask backend for the **PassionForge** project.  
It provides basic API routes for user registration, login, and fetching users.

---

## 📁 Files

| File | Purpose |
|---|---|
| `app.py` | Main backend file with all routes |
| `requirements.txt` | Python packages needed to run this backend |

---

## 🚀 How to Run

### Step 1: Install the required packages
```bash
pip install -r requirements.txt
```

### Step 2: Start the server
```bash
python app.py
```

The server will start at: **http://localhost:5000**

---

## 📡 API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/` | Check if the server is running |
| POST | `/register` | Register a new user |
| POST | `/login` | Login with email and password |
| GET | `/users` | Get all registered users |
| GET | `/users/<id>` | Get a single user by their ID |
| PUT | `/users/<id>/hobbies` | Update a user's hobbies |

---

## 🗄️ Database Integration (For the Database Developer)

Currently, this backend uses a **Python list** (`users = []`) as a temporary in-memory storage.  
Every time the server restarts, this data is lost.

When connecting a real database, search the `app.py` file for `# TODO: DATABASE` comments.  
Each comment explains exactly what database query to write there.

### Expected `users` Table Structure

```sql
CREATE TABLE users (
    id         INTEGER PRIMARY KEY AUTO_INCREMENT,
    username   VARCHAR(100) NOT NULL UNIQUE,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,   -- store HASHED passwords only!
    hobbies    TEXT,                    -- comma-separated or JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚠️ Notes

- This backend is for **development only**. Do not use it in production as-is.
- Passwords are stored in plain text in this version. Use `werkzeug.security.generate_password_hash` before going live.
- `debug=True` is enabled. Turn it off in production.
