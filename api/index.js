require("dotenv").config();
const express = require("express");
const cors = require("cors");
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
// let PrismaClient;
// try {
//     PrismaClient = require('@prisma/client').PrismaClient;
//     console.log('✅ Prisma client loaded successfully');
// } catch (error) {
//     console.error('❌ Prisma client loading failed:', error.message);
//     try {
//         const { execSync } = require('child_process');
//         console.log('🔄 Attempting to generate Prisma client...');
//         execSync('yarn prisma generate', { stdio: 'inherit' });
//         PrismaClient = require('@prisma/client').PrismaClient;
//         console.log('✅ Prisma client generated and loaded');
//     } catch (genError) {
//         console.error('❌ Prisma generation failed:', genError.message);
//     }
// }

const prisma = require("../utils/prisma"); // ✅ Singleton import

const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
// ✅ 404 handler

app.get("/", (req, res) => {
    res.json({ msg: "Express on Vercel ✅ works!" });
});

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Server is healthy 🚀",
        environment: process.env.NODE_ENV || 'development'
    });
});


// ✅ Get users
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// if (require.main === module) {
//     const PORT = process.env.PORT || 8080;

//     app.listen(PORT, () => {
//         console.log(`🚀 InReal Server running on port ${PORT}`);
//         console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
//     });
// }

// --- ✅ Export for Vercel ---
module.exports = app;