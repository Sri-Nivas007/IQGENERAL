CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50)  NOT NULL,
    password VARCHAR(255) NOT NULL,
   phone_number VARCHAR(20),
    auth_key VARCHAR(100),
    logincount INT DEFAULT 0,
    mislogin INT DEFAULT 0,
    logintime TIMESTAMP,
    nextlogin TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE bank_accounts (
    account_id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00
);


CREATE TABLE profiles (
    profile_id SERIAL PRIMARY KEY,
    profile_fname VARCHAR(50)  NOT NULL,
    profile_lname VARCHAR(50)  NOT NULL,
    access varchar (50) NOT NULL
);


CREATE TABLE user_activities (
    activity_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    profile_id INT[] NOT NULL,
    account_id INT NOT NULL,
 
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  
    FOREIGN KEY (account_id) REFERENCES bank_accounts (account_id)
    
)




