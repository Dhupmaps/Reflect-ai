import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = "chat_history.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create chats table
    c.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create messages table
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT,
            sender TEXT,
            content TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def create_chat(chat_id: str, title: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('INSERT INTO chats (id, title) VALUES (?, ?)', (chat_id, title))
    conn.commit()
    conn.close()

def update_chat_title(chat_id: str, title: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE chats SET title = ? WHERE id = ?', (title, chat_id))
    conn.commit()
    conn.close()

def add_message(chat_id: str, sender: str, content: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('INSERT INTO messages (chat_id, sender, content) VALUES (?, ?, ?)', 
              (chat_id, sender, content))
    conn.commit()
    conn.close()

def get_chats():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM chats ORDER BY created_at DESC')
    chats = [dict(row) for row in c.fetchall()]
    conn.close()
    return chats

def get_chat_messages(chat_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC', (chat_id,))
    messages = [dict(row) for row in c.fetchall()]
    conn.close()
    return messages

def delete_chat(chat_id: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('DELETE FROM messages WHERE chat_id = ?', (chat_id,))
    c.execute('DELETE FROM chats WHERE id = ?', (chat_id,))
    conn.commit()
    conn.close()

# Initialize DB on module load
init_db()
