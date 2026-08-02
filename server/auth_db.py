import sqlite3
import os
import bcrypt
import json
from pathlib import Path
import config

DB_PATH = config.INDEX_PATH / "users.db"

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the users and chats tables."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Operative (Users) table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Sessions (Chats) table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            messages TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def register_user(username: str, password: str):
    """Register a new operative."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return None, "Operative designation already exists."
            
        hashed = hash_password(password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed))
        user_id = cursor.lastrowid
        conn.commit()
        return {"id": user_id, "username": username}, None
    except Exception as e:
        return None, str(e)
    finally:
        conn.close()

def authenticate_user(username: str, password: str):
    """Authenticate an operative."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, password_hash FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            return None, "Invalid operative designation."
            
        if verify_password(password, row["password_hash"]):
            return {"id": row["id"], "username": row["username"]}, None
        else:
            return None, "Invalid security key."
    finally:
        conn.close()

def save_chat(chat_id: str, user_id: int, title: str, messages: list):
    """Upsert a chat session."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        msg_str = json.dumps(messages)
        # SQLite Upsert
        cursor.execute("""
            INSERT INTO chats (id, user_id, title, messages, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                messages=excluded.messages,
                updated_at=CURRENT_TIMESTAMP
        """, (chat_id, user_id, title, msg_str))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving chat: {e}")
        return False
    finally:
        conn.close()

def load_user_chats(user_id: int):
    """Retrieve all chats for a user."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, title, messages, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
        rows = cursor.fetchall()
        chats = []
        for row in rows:
            chats.append({
                "id": row["id"],
                "title": row["title"],
                "messages": json.loads(row["messages"]),
                "updated_at": row["updated_at"]
            })
        return chats
    finally:
        conn.close()

def delete_chat(chat_id: str, user_id: int):
    """Delete a specific chat session."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM chats WHERE id = ? AND user_id = ?", (chat_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

# Ensure the DB is initialized when this module is loaded
init_db()
