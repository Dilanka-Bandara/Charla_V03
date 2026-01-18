import sqlite3
from pathlib import Path

# Path to database
db_path = Path("chatflow.db")

print("Updating database schema...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Add file columns to messages table if they don't exist
    print("\n1. Updating messages table...")
    cursor.execute("PRAGMA table_info(messages)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'file_url' not in columns:
        cursor.execute('ALTER TABLE messages ADD COLUMN file_url TEXT')
        print("   ✓ Added file_url column")
    else:
        print("   ✓ file_url column already exists")
    
    if 'file_name' not in columns:
        cursor.execute('ALTER TABLE messages ADD COLUMN file_name TEXT')
        print("   ✓ Added file_name column")
    else:
        print("   ✓ file_name column already exists")
    
    # Create room_invites table if it doesn't exist
    print("\n2. Creating room_invites table...")
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS room_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        invited_by INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
    )
    ''')
    print("   ✓ room_invites table created/verified")
    
    # Check rooms table structure
    print("\n3. Checking rooms table...")
    cursor.execute("PRAGMA table_info(rooms)")
    room_columns = [col[1] for col in cursor.fetchall()]
    print(f"   Rooms table has columns: {room_columns}")
    
    # Commit all changes
    conn.commit()
    print("\n✅ Database updated successfully!")
    
except Exception as e:
    print(f"\n❌ Error updating database: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nYou can now start the backend server.")
