
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
    # 'badges'  = JSON string like: '["First Step", "Post Master"]'
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER  PRIMARY KEY AUTOINCREMENT,
            username   TEXT     NOT NULL UNIQUE,
            email      TEXT     NOT NULL UNIQUE,
            password   TEXT     NOT NULL,
            bio        TEXT     DEFAULT '',
            hobbies    TEXT     DEFAULT '[]',
            points     INTEGER  DEFAULT 0,
            badges     TEXT     DEFAULT '[]',
            is_new_user INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Migration: Add is_new_user column if it doesn't exist (for existing DBs)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_new_user INTEGER DEFAULT 1")
    except sqlite3.OperationalError:
        # Column already exists
        pass

    # Ensure existing users with hobbies are not treated as new users
    cursor.execute("UPDATE users SET is_new_user = 0 WHERE hobbies IS NOT NULL AND hobbies != '[]'")
    conn.commit()

    # ── communities table ───────────────────────────────────────
    # Groups that users can create and join.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS communities (
            id          INTEGER  PRIMARY KEY AUTOINCREMENT,
            name        TEXT     NOT NULL UNIQUE,
            description TEXT     DEFAULT '',
            category    TEXT     DEFAULT 'General',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── user_communities table (Junction) ───────────────────────
    # Tracks which users follow which communities.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_communities (
            user_id      INTEGER NOT NULL,
            community_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, community_id)
        )
    """)

    # ── messages table ──────────────────────────────────────────
    # Simple message store for chat.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id           INTEGER  PRIMARY KEY AUTOINCREMENT,
            sender_id    INTEGER  NOT NULL,
            recipient    TEXT     NOT NULL,
            content      TEXT     NOT NULL,
            timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── posts table ─────────────────────────────────────────────
    # ... (existing posts table)
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
    safe_add_column(cursor, "users", "bio",           "TEXT DEFAULT ''")
    safe_add_column(cursor, "users", "points",        "INTEGER DEFAULT 0")
    safe_add_column(cursor, "users", "badges",        "TEXT DEFAULT '[]'")
    safe_add_column(cursor, "posts", "user_initials", "TEXT DEFAULT '??'")
    safe_add_column(cursor, "posts", "comments",      "TEXT DEFAULT '[]'")
    safe_add_column(cursor, "posts", "likes",         "INTEGER DEFAULT 0")

    conn.commit()
    conn.close()
    print("Database ready.")


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
