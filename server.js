const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const oracledb = require('oracledb');
oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_23_7' });
const dbConfig = require('./dbconfig');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Signup route: Save user to Oracle DB
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const check = await connection.execute(
      `SELECT * FROM ELearnHub WHERE email = :email`,
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).send('User already exists. Please use a different email or log in.');
    }

    await connection.execute(
      `INSERT INTO ELearnHub (name, email, password) VALUES (:name, :email, :password)`,
      [name, email, password],
      { autoCommit: true }
    );

    console.log('✅ New user added:', { name, email });
    res.redirect('/auth.html');

  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.close();
  }
});

// Login route: Authenticate using Oracle DB
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT * FROM ELearnHub WHERE email = :email AND password = :password`,
      [email, password]
    );

    if (result.rows.length > 0) {
      console.log('✅ Login successful for:', email);
      res.redirect('/index.html');
    } else {
      console.log('❌ Invalid login attempt for:', email);
      res.status(401).send('Invalid email or password.');
    }

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.close();
  }
});

// Test Oracle DB connection (optional, for debugging)
async function testConnection() {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Connected to Oracle DB');
  } catch (err) {
    console.error('❌ Database connection error:', err);
  } finally {
    if (connection) await connection.close();
  }
}

testConnection();  // Call this function to test the DB connection

app.get('/users', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM ELearnHub`);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch users error:', err);
    res.status(500).send('Error fetching users');
  } finally {
    if (connection) await connection.close();
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
