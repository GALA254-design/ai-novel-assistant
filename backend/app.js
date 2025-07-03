require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database'); // Your Sequelize database connection
const cors = require('cors'); // Import cors for cross-origin requests

// Import your existing routes
const storyRoutes = require('./routes/storyRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const llmRoutes = require('./routes/llm.js');
const fileRoutes = require('./routes/fileRoutes');

// Import the new authentication routes
const authRoutes = require('./routes/authRoutes'); // Assuming you've created this file as discussed

const app = express();
app.use(cors());

// Body parser for JSON requests. This is essential for handling POST/PUT request bodies.
app.use(express.json());
// Body parser for URL-encoded form data (less common for APIs, but good to have).
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
// Health check endpoint
app.get('/', (req, res) => res.send('AI Novel Assistant API Running!'));

// Mount your API routes
app.use('/api/stories', storyRoutes);
app.use('/api/users', userRoutes); // User management (e.g., creating users via registration)
app.use('/api/projects', projectRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/files', fileRoutes);

// NEW: Mount your authentication routes.
// We're mounting it under '/api' so your login endpoint becomes '/api/login'.
app.use('/api', authRoutes);

module.exports = app;