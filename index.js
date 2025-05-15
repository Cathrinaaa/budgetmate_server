import express from 'express';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import cors from 'cors';
import db from './db.js';



const app = express();
const port = 3000;

app.use(cors()); 
app.use(bodyParser.json());

// REGISTER USER
app.post('/add-user', async (req, res) => {
  const { username, password, fname, lname } = req.body;

  if (!username || !password || !fname || !lname) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const checkQuery = "SELECT * FROM accounts WHERE username = $1";
    const existingUser = await db.query(checkQuery, [username]);

    if (existingUser.rowCount > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = "INSERT INTO accounts (username, password, fname, lname) VALUES ($1, $2, $3, $4)";
    await db.query(insertQuery, [username, hashedPassword, fname, lname]);

    res.json({ success: true, message: 'User successfully added' });
  } catch (err) {
    console.error("Error during sign up:", err);
    res.status(500).json({ success: false, message: 'Server error while signing up' });
  }
});

// Login User 
app.post('/check-user', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.json({ exist: false, message: "Both username and password are required" });
  }

  const query = "SELECT * FROM accounts WHERE username = $1";
  try {
      const result = await db.query(query, [username]);

      if (result.rowCount === 0) {
          return res.json({ exist: false, message: "Invalid username or password" });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
          res.json({ exist: true, message: "Login successful" });
      } else {
          res.json({ exist: false, message: "Invalid username or password" });
      }
  } catch (error) {
      console.error("Error checking user:", error);
      res.status(500).json({ exist: false, message: "Server error" });
  }
});


//dash
//GET /get-transactions Fetch all transactions or by userId query parameter
app.get('/get-transactions', async (req, res) => {
  try {
    const userId = req.query.userId;
    let result;
    if (userId) {
      result = await db.query(
        `SELECT id, category AS description, amount, type
         FROM budget
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
    } else {
      result = await db.query(
        `SELECT id, category AS description, amount, type
         FROM budget
         ORDER BY created_at DESC`
      );
    }
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error while fetching transactions' });
  }
});

// POST /delete-transaction Delete a transaction by ID
app.post('/delete-transaction', async (req, res) => {
  const { transaction_id } = req.body;
  if (!transaction_id) {
    return res.status(400).json({ success: false, message: 'Transaction ID is required' });
  }

  try {
    const deleteQuery = 'DELETE FROM budget WHERE id = $1 RETURNING *';
    const result = await db.query(deleteQuery, [transaction_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting transaction' });
  }
});

//POST /update-transaction Update the amount of a transaction
app.post('/update-transaction', async (req, res) => {
  const { transaction_id, amount } = req.body;
  if (!transaction_id || amount === undefined) {
    return res.status(400).json({ success: false, message: 'Transaction ID and new amount are required' });
  }

  try {
    const formattedAmount = parseFloat(amount).toFixed(2);
    const updateQuery = `
      UPDATE budget
      SET amount = $1
      WHERE id = $2
      RETURNING id, category AS description, amount, type
    `;
    const result = await db.query(updateQuery, [formattedAmount, transaction_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, message: 'Server error while updating transaction' });
  }
});

//jy Addmodal
//POST /add-transaction Add a new transaction
app.post('/add-transaction', async (req, res) => {
  // Use provided userId or default to 1 (replace when auth is added)
  const userId = req.body.userId || 1;
  const { description, amount, type } = req.body;

  // Validate inputs
  if (!description || amount === undefined || !type) {
    return res.status(400).json({ success: false, message: 'Description, amount, and type are required' });
  }

  try {
    const formattedAmount = parseFloat(amount).toFixed(2);
    // Insert using description as category
    const insertQuery = `
      INSERT INTO budget (user_id, category, amount, type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category AS description, amount, type
    `;
    const result = await db.query(insertQuery, [userId, description, formattedAmount, type]);
    res.status(201).json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ success: false, message: 'Server error while adding transaction' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          return res.status(500).json({ error: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
  });
});

// Start the server
app.listen(port, () => {
    console.log(`BudgetMate app listening at http://localhost:${port}`);
});
