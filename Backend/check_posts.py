
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "passionforge.db")

def check_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, caption, type, media_url, media_is_video, created_at FROM posts ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row['id']} | User: {row['username']} | Type: {row['type']} | MediaUrl: '{row['media_url']}' | CreatedAt: {row['created_at']}")
    conn.close()

if __name__ == "__main__":
    check_db()
