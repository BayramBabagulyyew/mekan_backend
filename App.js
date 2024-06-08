const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5005;
const SECRET_KEY = "your_secret_key";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mekan",
  password: "visualcode",
  port: 5432,
});

// Create tables if they don't exist
const createTables = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255)
        )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    text TEXT,
    image_path VARCHAR(255)
    )
 `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(100),
    teacher VARCHAR(100),
    teacher_number VARCHAR(100),
    price INTEGER,
    startsAt DATE,
    endsAt DATE,
    language VARCHAR(100)
    )
`);
};

createTables().catch((err) => console.log(err));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Routes
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (user.rows.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }
  const isValid = await bcrypt.compare(password, user.rows[0].password);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid password" });
  }
  res.json();
});

app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  const newUser = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );
  res.json(newUser.rows[0]);
});

app.post("/api/news", async (req, res) => {
  const { title, text } = req.body;
  const imagePath = req.file.path;
  const newUser = await pool.query(
    "INSERT INTO news (title, text,image_path) VALUES ($1, $2, $3) RETURNING *",
    [title, text, imagePath]
  );
  res.json(newUser.rows[0]);
});

app.post("/api/course", async (req, res) => {
  const {
    subject,
    teacher,
    teacher_number,
    price,
    startsAt,
    endsAt,
    language,
  } = req.body;

  const newCourse = await pool.query(
    "INSERT INTO courses (subject, teacher, teacher_number,  price, startsAt, endsAt, language) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [subject, teacher, teacher_number, price, startsAt, endsAt, language]
  );
  res.json(newCourse.rows[0]);
});

app.get("/api/users", async (req, res) => {
  const users = await pool.query("SELECT * FROM users");
  res.json(users.rows);
});

app.get("/api/news", async (req, res) => {
  const news = await pool.query("SELECT * FROM news");
  res.json(news.rows);
});

app.get("/api/news/:id", async (req, res) => {
  const id = req.params.id;
  const news = await pool.query(`SELECT * FROM news WHERE id=${id}`);
  res.json(news.rows[0]);
});

app.delete("/api/news/:id", async (req, res) => {
  const id = req.params.id;
  const news = await pool.query(`DELETE FROM news WHERE id=${id}`);
  res.json(news.rows[0]);
});

app.get("/api/courses", async (req, res) => {
  const videos = await pool.query("SELECT * FROM courses");
  res.json(videos.rows);
});

app.delete("/api/course/:id", async (req, res) => {
  const id = req.params.id;
  const course = await pool.query(`SELECT * FROM courses WHERE id=${id}`);
  await pool.query(`DELETE FROM courses WHERE id=${id}`);
  res.json({ mes: "Success" });
});

app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
