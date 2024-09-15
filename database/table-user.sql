DROP TABLE users;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_timestamp
AFTER UPDATE ON users
BEGIN
  UPDATE users
  SET updated_at = datetime('now')
  WHERE rowid = NEW.rowid;
END;