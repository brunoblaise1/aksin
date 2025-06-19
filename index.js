require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
//const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
const Pool = require('pg').Pool;


const devConfig = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;


const proConfig = process.env.DATABASE_URL; //heroku addons

const pool = new Pool({
  connectionString:
    process.env.NODE_ENV === 'production' ? proConfig : devConfig,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ✅ Create table if it doesn't exist
const createTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

pool.query(createTable)
  .then(() => console.log("✅ Users table ready"))
  .catch(err => console.error("❌ Table creation failed", err));

// ✅ API to receive login info and save to DB
app.post('/save-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);
    res.status(200).json({ message: 'User saved successfully.' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already exists.' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
