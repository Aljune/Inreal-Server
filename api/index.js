require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connect");
const userRoutes = require("./modules/users/user.routes");
const authRoutes = require("./modules/auth/auth.routes");
const missionRoutes = require("./modules/mission/mission.routes"); // Add this line

const app = express();
// Middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 404 handler

app.get("/", (req, res) => {
    res.json({ msg: "Express on Vercel ✅ works!" });
});


// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/missions", missionRoutes); // Add this line

// ✅ Health check endpoint
app.get("/api/health", async (req, res) => {
    try {
        await connectDB();
        res.json({
            status: "OK",
            environment: process.env.NODE_ENV,
            db: "connected",
        });
    } catch (err) {
        res.status(500).json({
            status: "ERROR",
            message: err.message,
        });
    }
});


if (require.main === module) {
    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
        console.log(`🚀 InReal Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// --- ✅ Export for Vercel ---
module.exports = app;