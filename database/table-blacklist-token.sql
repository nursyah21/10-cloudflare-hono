-- DROP TABLE users;
CREATE TABLE IF NOT EXISTS blacklist_token (
    id INTEGER PRIMARY KEY,
    username TEXT,
    token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_blacklist_token_timestamp
AFTER UPDATE ON blacklist_token
BEGIN
  UPDATE blacklist_token
  SET updated_at = datetime('now')
  WHERE rowid = NEW.rowid;
END;