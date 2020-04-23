CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE
);

ALTER TABLE tasks
  ADD COLUMN user_id INT;

INSERT INTO users (username)
VALUES ('keith');

UPDATE tasks SET user_id = 1;

ALTER TABLE tasks ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id) REFERENCES users(id);
