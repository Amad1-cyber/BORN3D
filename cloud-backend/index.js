require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User and Character Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  pin: String, // hashed
  character: {
    name: String,
    skinTone: String,
    clothes: {
      top: String,
      bottom: String,
      hat: String,
    },
    lastPosition: {
      x: Number,
      y: Number,
      z: Number,
    },
    inventory: Array,
    stats: Object,
    updatedAt: { type: Date, default: Date.now },
  },
});

const User = mongoose.model('User', userSchema);

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
app.post('/api/register', async (req, res) => {
  const { username, pin, character } = req.body;
  if (!username || !pin) return res.status(400).json({ error: 'Missing username or pin' });
  try {
    const hash = await bcrypt.hash(pin, 10);
    const user = new User({ username, pin: hash, character });
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Username taken or invalid.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, pin } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(pin, user.pin);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, character: user.character });
});

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Save character (on logout or save point)
app.post('/api/save', auth, async (req, res) => {
  const { character } = req.body;
  await User.updateOne({ username: req.user.username }, { character, 'character.updatedAt': new Date() });
  res.json({ success: true });
});

// Load character
app.get('/api/character', auth, async (req, res) => {
  const user = await User.findOne({ username: req.user.username });
  res.json({ character: user.character });
});

// Logout (just a placeholder, client should delete token)
app.post('/api/logout', auth, (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Born 3D Cloud Backend running on port ${PORT}`);
});
