const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json()); // penting untuk parsing body JSON

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD value:', process.env.DB_PASSWORD);
