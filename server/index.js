// index.js (серверный)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Загружаем .env ДО всего остального
dotenv.config();

// Проверяем, что JWT_SECRET загружен
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT_SECRET value:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');

const path = require('path');
const app = express();

// Middleware — CLIENT_ORIGIN: comma-separated list (Vercel URL + localhost)
const corsOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключение к MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/support', require('./routes/support'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/push', require('./routes/push'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/link-preview', require('./routes/linkPreview'));
app.use('/api/browse', require('./routes/browse'));
app.use('/api/og', require('./routes/og'));

const { sendTonConnectManifest } = require('./tonConnectManifest');
app.get('/tonconnect-manifest.json', sendTonConnectManifest);

// Test route
app.get('/', (req, res) => {
  res.send('AlphaSpace Backend is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});