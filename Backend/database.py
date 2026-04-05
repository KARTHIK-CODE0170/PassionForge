
# ============================================================
# PassionForge - Database Setup
# File: database.py
#
# What this file does:
#   - Creates the database tables if they don't exist
#   - Called once when app.py starts up (safe to call every time)
#
# Database file: Backend/passionforge.db (SQLite)
# ============================================================

import sqlite3
import os

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "passionforge.db")


def get_db_connection():
    """
    Open a connection to the SQLite database.
    row_factory lets us access columns by name like row['username']
    instead of by number like row[1].
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Create all tables if they don't exist yet.
    This is safe to run every time the server starts — it won't
    delete or overwrite existing data.
    """
    conn   = get_db_connection()
    cursor = conn.cursor()

    # ── users table ─────────────────────────────────────────────
    # Stores all registered accounts.
    # 'hobbies' = JSON string like: '["Music", "Dance"]'
    # 'bio'     = short description (optional)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            username   TEXT     NOT NULL UNIQUE,
            email      TEXT     NOT NULL UNIQUE,
            password   TEXT     NOT NULL,
            bio        TEXT     DEFAULT '',
            hobbies    TEXT     DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── posts table ─────────────────────────────────────────────
    # Stores all posts created by users.
    # 'hobbies', 'hashtags', 'comments' are stored as JSON strings.
    # 'media_url' is the path to an uploaded file, or empty string.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id             INTEGER  PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER  NOT NULL,
            username       TEXT     NOT NULL,
            user_initials  TEXT     NOT NULL DEFAULT '??',
            type           TEXT     NOT NULL DEFAULT 'text',
            caption        TEXT     DEFAULT '',
            media_url      TEXT     DEFAULT '',
            media_is_video INTEGER  DEFAULT 0,
            hobbies        TEXT     DEFAULT '[]',
            hashtags       TEXT     DEFAULT '[]',
            comments       TEXT     DEFAULT '[]',
            likes          INTEGER  DEFAULT 0,
            created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── Add any missing columns safely (for existing databases) ──
    # This handles the case where someone already has an older DB
    safe_add_column(cursor, "users", "bio",           "TEXT DEFAULT ''")
    safe_add_column(cursor, "posts", "user_initials", "TEXT DEFAULT '??'")
    safe_add_column(cursor, "posts", "comments",      "TEXT DEFAULT '[]'")
    safe_add_column(cursor, "posts", "likes",         "INTEGER DEFAULT 0")

    conn.commit()
    conn.close()
    print("✅ Database ready.")


def safe_add_column(cursor, table, column, column_def):
    """
    Try to add a column to an existing table.
    If the column already exists, SQLite will throw an error — we just ignore it.
    This is a simple way to evolve the schema without breaking existing data.
    """
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_def}")
    except Exception:
        pass  # Column already exists — that's fine
