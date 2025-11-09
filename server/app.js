const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Connect to MongoDB
mongoose.connect('mongodb+srv://dheemanthhariharapura_db_user:bhattu1143@cluster0.fbfzzqa.mongodb.net/Marathon_Event?retryWrites=true&w=majority')
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ API Routes
app.use('/api/runners', require('./routes/runners'));
console.log("📦 Mounted /api/runners routes");// 🔧 Commented out unused route to avoid error
// app.use('/api/queries', require('./routes/queries'));

// ✅ Health check (optional)
app.get('/health', (req, res) => {
  res.send('✅ Server is healthy');
});

// ✅ Fallback route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
