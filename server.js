require("dotenv").config();
const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "bookhaven-api", database: "connected" });
  } catch (e) {
    res.status(503).json({ status: "degraded", service: "bookhaven-api", database: "unavailable" });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    let sql = `SELECT b.id,b.title,b.author,b.description,b.price,b.old_price,b.cover_url,b.rating,b.stock,c.name AS category
               FROM books b JOIN categories c ON c.id=b.category_id WHERE 1=1`;
    const params = [];
    if (q) {
      sql += " AND (b.title LIKE ? OR b.author LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      sql += " AND c.slug = ?";
      params.push(category);
    }
    sql += " ORDER BY b.id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load books" });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id,b.title,b.author,b.description,b.price,b.old_price,b.cover_url,b.rating,b.stock,c.name AS category,c.slug
       FROM books b JOIN categories c ON c.id=b.category_id WHERE b.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Book not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Could not load book" });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id,name,slug FROM categories ORDER BY name");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Could not load categories" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ error: "Name, email and password (6+ chars) are required" });
    const [exists] = await pool.query("SELECT id FROM users WHERE email=?", [email.toLowerCase()]);
    if (exists.length) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)",
      [name.trim(), email.toLowerCase(), hash]
    );
    const token = jwt.sign({ id: result.insertId, name: name.trim(), email: email.toLowerCase() }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: result.insertId, name: name.trim(), email: email.toLowerCase() } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT id,name,email,password_hash FROM users WHERE email=?", [String(email || "").toLowerCase()]);
    if (!rows.length || !(await bcrypt.compare(password || "", rows[0].password_hash)))
      return res.status(401).json({ error: "Invalid email or password" });
    const user = rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/cart", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.book_id,ci.quantity,b.title,b.author,b.price,b.cover_url
       FROM cart_items ci JOIN books b ON b.id=ci.book_id WHERE ci.user_id=?`,
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Could not load cart" });
  }
});

app.post("/api/cart", auth, async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;
    const qty = Math.max(1, Number(quantity));
    await pool.query(
      `INSERT INTO cart_items (user_id,book_id,quantity) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)`,
      [req.user.id, bookId, qty]
    );
    res.json({ message: "Added to cart" });
  } catch {
    res.status(500).json({ error: "Could not update cart" });
  }
});

app.delete("/api/cart/:bookId", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id=? AND book_id=?", [req.user.id, req.params.bookId]);
    res.json({ message: "Removed" });
  } catch {
    res.status(500).json({ error: "Could not remove item" });
  }
});

app.post("/api/orders", auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query(
      `SELECT ci.book_id,ci.quantity,b.price,b.stock FROM cart_items ci JOIN books b ON b.id=ci.book_id WHERE ci.user_id=?`,
      [req.user.id]
    );
    if (!items.length) return res.status(400).json({ error: "Cart is empty" });
    let total = 0;
    for (const item of items) {
      if (item.quantity > item.stock) throw new Error("Insufficient stock");
      total += Number(item.price) * item.quantity;
    }
    const [order] = await conn.query(
      "INSERT INTO orders (user_id,total_amount,status) VALUES (?,?,?)",
      [req.user.id, total, "PLACED"]
    );
    for (const item of items) {
      await conn.query(
        "INSERT INTO order_items (order_id,book_id,quantity,unit_price) VALUES (?,?,?,?)",
        [order.insertId, item.book_id, item.quantity, item.price]
      );
      await conn.query("UPDATE books SET stock=stock-? WHERE id=?", [item.quantity, item.book_id]);
    }
    await conn.query("DELETE FROM cart_items WHERE user_id=?", [req.user.id]);
    await conn.commit();
    res.status(201).json({ message: "Order placed", orderId: order.insertId, total });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ error: e.message || "Could not place order" });
  } finally {
    conn.release();
  }
});

app.get("/api/orders", auth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT id,total_amount,status,created_at FROM orders WHERE user_id=? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Could not load orders" });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`BookHaven running on http://localhost:${PORT}`));
