CREATE DATABASE IF NOT EXISTS bookhaven;

USE bookhaven;

-- =========================
-- Categories
-- =========================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Books
-- =========================
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cover_url VARCHAR(500),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

-- =========================
-- Users
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Cart
-- =========================
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_cart_item (user_id, book_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);

-- =========================
-- Orders
-- =========================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================
-- Order Items
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);

-- =========================
-- Categories Seed Data
-- =========================
INSERT IGNORE INTO categories (name) VALUES
('Programming'),
('Technology'),
('Self Improvement'),
('Business'),
('Fiction');

-- =========================
-- Books Seed Data
-- =========================
INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'The Midnight Library',
    'Matt Haig',
    'A novel about choices, possibilities and the lives we could have lived.',
    499.00,
    '/images/midnight-library.svg',
    25
FROM categories c
WHERE c.name = 'Fiction'
AND NOT EXISTS (
    SELECT 1 FROM books WHERE title = 'The Midnight Library'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'Clean Code',
    'Robert C. Martin',
    'A practical guide to writing clean, maintainable software.',
    699.00,
    '/images/clean-code.svg',
    20
FROM categories c
WHERE c.name = 'Programming'
AND NOT EXISTS (
    SELECT 1 FROM books WHERE title = 'Clean Code'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'Designing Data-Intensive Applications',
    'Martin Kleppmann',
    'A detailed guide to reliable, scalable and maintainable data systems.',
    899.00,
    '/images/data-intensive.svg',
    15
FROM categories c
WHERE c.name = 'Technology'
AND NOT EXISTS (
    SELECT 1 FROM books
    WHERE title = 'Designing Data-Intensive Applications'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'The Psychology of Money',
    'Morgan Housel',
    'Lessons about wealth, investing and financial decision making.',
    399.00,
    '/images/psychology-money.svg',
    30
FROM categories c
WHERE c.name = 'Business'
AND NOT EXISTS (
    SELECT 1 FROM books
    WHERE title = 'The Psychology of Money'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'Atomic Habits',
    'James Clear',
    'A practical framework for building good habits and breaking bad ones.',
    449.00,
    '/images/atomic-habits.svg',
    35
FROM categories c
WHERE c.name = 'Self Improvement'
AND NOT EXISTS (
    SELECT 1 FROM books WHERE title = 'Atomic Habits'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'Computer Networks',
    'Andrew S. Tanenbaum',
    'Fundamentals of computer networking and communication systems.',
    799.00,
    '/images/computer-networks.svg',
    18
FROM categories c
WHERE c.name = 'Technology'
AND NOT EXISTS (
    SELECT 1 FROM books WHERE title = 'Computer Networks'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'The Alchemist',
    'Paulo Coelho',
    'A classic story about dreams, purpose and following your journey.',
    299.00,
    '/images/alchemist.svg',
    40
FROM categories c
WHERE c.name = 'Fiction'
AND NOT EXISTS (
    SELECT 1 FROM books WHERE title = 'The Alchemist'
);

INSERT INTO books
(category_id, title, author, description, price, cover_url, stock)
SELECT
    c.id,
    'Zero to One',
    'Peter Thiel',
    'Notes on startups, innovation and building something new.',
    499.00,
    '/images/zero-to-one.svg',
    22
FROM categories c
WHERE c.name = 'Business'
AND NOT EXISTS (
    SELECT 1 FROM books WHERE title = 'Zero to One'
);
