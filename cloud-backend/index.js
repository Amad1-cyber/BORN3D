const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Initialize app FIRST
const app = express();

// 2. Middleware Configuration
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SECRET_KEY = "born3d_secret_key";
const ROOT_DIR = path.resolve(__dirname, "..");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

// Persisted storage for users and character data.
const store = loadStore();
const users = store.users;
const characters = store.characters;
const globalChatMessages = store.globalChatMessages;
const presenceBySession = {};
let nextChatMessageId = store.nextChatMessageId || 1;
const PRESENCE_TTL_MS = 15000;

function createDefaultStore() {
  return {
    users: [],
    characters: {},
    globalChatMessages: [],
    nextChatMessageId: 1
  };
}

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const defaults = createDefaultStore();
    return {
      users: Array.isArray(parsed.users) ? parsed.users : defaults.users,
      characters: parsed.characters && typeof parsed.characters === "object" ? parsed.characters : defaults.characters,
      globalChatMessages: Array.isArray(parsed.globalChatMessages) ? parsed.globalChatMessages : defaults.globalChatMessages,
      nextChatMessageId: Number.isFinite(parsed.nextChatMessageId) ? parsed.nextChatMessageId : defaults.nextChatMessageId
    };
  } catch (error) {
    return createDefaultStore();
  }
}

function persistStore() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = JSON.stringify(
      {
        users,
        characters,
        globalChatMessages,
        nextChatMessageId
      },
      null,
      2
    );
    fs.writeFileSync(DATA_FILE, payload, "utf8");
  } catch (error) {
    console.error("Failed to persist Born 3D backend store:", error.message);
  }
}

function cleanupPresence() {
  const now = Date.now();
  Object.keys(presenceBySession).forEach((sessionId) => {
    const entry = presenceBySession[sessionId];
    const updatedAt = entry && entry.updatedAt ? Date.parse(entry.updatedAt) : 0;
    if (!updatedAt || now - updatedAt > PRESENCE_TTL_MS) {
      delete presenceBySession[sessionId];
    }
  });
}

// 3. Route Definitions
app.get('/', (req, res) => {
  res.redirect(302, '/play');
});

app.post('/api/register', (req, res) => {
  const username = String(req.body && req.body.username ? req.body.username : "").trim();
  const pin = String(req.body && req.body.pin ? req.body.pin : "").trim();
  const { avatarGender, deviceId } = req.body;
  if (!username || !pin) return res.status(400).json({ error: "Username and pin required" });
  const accountId = crypto.randomUUID();
  users.push({
    accountId,
    username,
    pin,
    avatarGender: typeof avatarGender === 'string' ? avatarGender.trim().toLowerCase().slice(0, 16) : '',
    deviceId: typeof deviceId === 'string' ? deviceId.trim().slice(0, 64) : '',
    createdAt: new Date().toISOString()
  });
  persistStore();
  res.json({ success: true, accountId });
});

app.post('/api/login', (req, res) => {
  const username = String(req.body && req.body.username ? req.body.username : "").trim();
  const pin = String(req.body && req.body.pin ? req.body.pin : "").trim();
  const { accountId: requestedAccountId, avatarGender: requestedAvatarGender, deviceId: requestedDeviceId } = req.body;
  const avatarGender = typeof requestedAvatarGender === 'string'
    ? requestedAvatarGender.trim().toLowerCase().slice(0, 16)
    : '';
  const deviceId = typeof requestedDeviceId === 'string'
    ? requestedDeviceId.trim().slice(0, 64)
    : '';
  let user = null;

  if (requestedAccountId) {
    user = users.find((entry) => entry.accountId === requestedAccountId);
    if (user && (user.username !== username || user.pin !== pin)) {
      return res.status(401).json({ error: "Invalid username or pin" });
    }
  }

  if (!user) {
    const matchingUsers = users.filter(u => String(u.username || "").trim() === username && String(u.pin || "").trim() === pin);
    if (matchingUsers.length > 1 && deviceId) {
      user = matchingUsers.find((entry) => entry.deviceId && entry.deviceId === deviceId) || null;
    }
    if (matchingUsers.length > 1 && avatarGender) {
      user = matchingUsers.find((entry) => {
        const storedCharacter = characters[entry.accountId] || characters[entry.username] || null;
        const storedGender = storedCharacter && typeof storedCharacter.avatarGender === 'string'
          ? storedCharacter.avatarGender.trim().toLowerCase()
          : entry.avatarGender || '';
        return storedGender === avatarGender;
      }) || null;
    }
    if (!user) {
      user = matchingUsers.sort((a, b) => {
        const aTime = Date.parse(a.createdAt || "") || 0;
        const bTime = Date.parse(b.createdAt || "") || 0;
        return bTime - aTime;
      })[0] || null;
    }
  }

  if (!user) return res.status(401).json({ error: "Invalid username or pin" });
  if (deviceId && !user.deviceId) {
    user.deviceId = deviceId;
  }
  const sessionId = crypto.randomUUID();
  const token = jwt.sign({ username, accountId: user.accountId, sessionId }, SECRET_KEY);
  res.json({ token, sessionId, accountId: user.accountId });
});

app.get('/api/login', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => res.json({ success: true }));

// Authentication middleware
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('Unauthorized');
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res.status(401).send('Invalid Token');
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
  } catch (err) {
    req.user = null;
  }
  next();
};

app.post('/api/save', auth, (req, res) => {
  const { character } = req.body;
  const characterKey = req.user.accountId || req.user.username;
  characters[characterKey] = character;
  const matchingUser = users.find((entry) => entry.accountId === req.user.accountId || entry.username === req.user.username);
  if (matchingUser && character && typeof character === 'object') {
    if (typeof character.avatarGender === 'string') {
      matchingUser.avatarGender = character.avatarGender.trim().toLowerCase().slice(0, 16);
    }
    if (typeof character.avatarPath === 'string') {
      matchingUser.avatarPath = character.avatarPath.trim().slice(0, 256);
    }
    if (typeof character.avatarName === 'string') {
      matchingUser.avatarName = character.avatarName.trim().slice(0, 64);
    }
  }
  persistStore();
  res.json({ success: true });
});

app.get('/api/character', auth, (req, res) => {
  const characterKey = req.user.accountId || req.user.username;
  let character = characters[characterKey] || null;
  if (!character && req.user && req.user.username) {
    const sameNameUsers = users.filter((entry) => entry.username === req.user.username);
    if (sameNameUsers.length <= 1) {
      character = characters[req.user.username] || null;
    }
  }
  res.json({ character: character || null });
});

app.get('/api/chat', (req, res) => {
  res.json({
    messages: globalChatMessages.slice(-80)
  });
});

app.post('/api/chat', auth, (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const chatMessage = {
    id: nextChatMessageId++,
    accountId: req.user.accountId || '',
    username: req.user.username,
    message: message.slice(0, 280),
    createdAt: new Date().toISOString()
  };

  globalChatMessages.push(chatMessage);
  if (globalChatMessages.length > 200) {
    globalChatMessages.splice(0, globalChatMessages.length - 200);
  }
  persistStore();

  res.json({ success: true, message: chatMessage });
});

app.get('/api/presence', (req, res) => {
  cleanupPresence();
  const shard = typeof req.query.shard === 'string' ? req.query.shard : '';
  const level = typeof req.query.level === 'string' ? req.query.level : '';

  const players = Object.values(presenceBySession).filter((entry) => {
    if (!entry) {
      return false;
    }
    if (shard && entry.shard !== shard) {
      return false;
    }
    if (level && entry.level !== level) {
      return false;
    }
    return true;
  });

  res.json({ players });
});

app.post('/api/presence', optionalAuth, (req, res) => {
  const body = req.body || {};
  const sessionId =
    (req.user && req.user.sessionId) ||
    (typeof body.sessionId === 'string' ? body.sessionId.trim() : '');
  if (!sessionId) {
    return res.status(400).json({ error: 'Session id is required' });
  }

  const guestUsername =
    typeof body.username === 'string' && body.username.trim()
      ? body.username.trim().slice(0, 32)
      : 'Guest';

  const avatarPath = typeof body.avatarPath === 'string' ? body.avatarPath.trim().slice(0, 256) : '';
  const avatarGender = typeof body.avatarGender === 'string' ? body.avatarGender.trim().toLowerCase().slice(0, 16) : '';
  const avatarName = typeof body.avatarName === 'string' ? body.avatarName.trim().slice(0, 64) : '';
  const accountId =
    (req.user && req.user.accountId) ||
    (typeof body.accountId === 'string' ? body.accountId.trim().slice(0, 64) : '');

  presenceBySession[sessionId] = {
    sessionId,
    accountId,
    username: req.user && req.user.username ? req.user.username : guestUsername,
    shard: typeof body.shard === 'string' ? body.shard : '',
    level: typeof body.level === 'string' ? body.level : '',
    avatarPath,
    avatarGender,
    avatarName,
    position: body.position && typeof body.position === 'object'
      ? {
          x: Number.isFinite(body.position.x) ? body.position.x : 0,
          y: Number.isFinite(body.position.y) ? body.position.y : 0,
          z: Number.isFinite(body.position.z) ? body.position.z : 0
        }
      : { x: 0, y: 0, z: 0 },
    rotationY: Number.isFinite(body.rotationY) ? body.rotationY : 0,
    updatedAt: new Date().toISOString()
  };

  cleanupPresence();
  persistStore();
  res.json({ success: true, player: presenceBySession[sessionId] });
});

app.post('/api/presence/leave', optionalAuth, (req, res) => {
  const sessionId =
    (req.user && req.user.sessionId) ||
    (req.body && typeof req.body.sessionId === 'string' ? req.body.sessionId.trim() : '');
  if (sessionId) {
    delete presenceBySession[sessionId];
  }
  persistStore();
  res.json({ success: true });
});

function serveRootFile(relativePath) {
  return (req, res) => {
    res.sendFile(path.join(ROOT_DIR, relativePath));
  };
}

app.get("/", (req, res) => {
  res.redirect(302, "/play");
});
app.get("/editor", serveRootFile("index.html"));
app.get("/index.html", serveRootFile("index.html"));
app.get("/play", serveRootFile("play.html"));
app.get("/play.html", serveRootFile("play.html"));
app.get("/game", serveRootFile("game.html"));
app.get("/game.html", serveRootFile("game.html"));

// Static assets for the game and editor.
app.use(express.static(ROOT_DIR, {
  dotfiles: "ignore",
  index: false
}));

app.listen(PORT, () => {
  console.log(`Backend server listening at http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
    console.error(`Run this command to fix it: kill -9 $(lsof -t -i:${PORT})\n`);
    process.exit(1);
  }
});
