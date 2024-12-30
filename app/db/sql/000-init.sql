CREATE TABLE users (
  uuid varchar(100) PRIMARY KEY,
  full_name varchar(500) NOT NULL,
  email varchar(500) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status varchar(50) NOT NULL, -- active / inactive
  password_reset_code varchar(100),
  password_reset_expiry DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE sessions (
  uuid varchar(100) PRIMARY KEY,
  user varchar(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY(user) REFERENCES users(uuid)
);