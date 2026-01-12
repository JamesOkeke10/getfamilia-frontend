// Entrypoint that forwards to backend/server.js
require('dotenv').config({ path: './backend/.env' });
require('./backend/server');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./backend/config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/submissions", require("./backend/routes/submissions"));

// Health check
app.get("/", (req, res) => {
  res.send("Get Familia API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
