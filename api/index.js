require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connect");
const userRoutes = require("./modules/users/user.routes");

const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
// ✅ 404 handler

app.get("/", (req, res) => {
    res.json({ msg: "Express on Vercel ✅ works!" });
});


// Routes
app.use("/api/users", userRoutes);

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


// // ✅ GET /users - List all users
// app.get("/api/users", async (req, res) => {
//     try {
//         const users = await prisma.users.findMany({
//             select: {
//                 id: true,
//                 first_name: true,
//                 last_name: true,
//                 email: true,
//                 place: true,
//                 user_type: true,
//                 preferences: true,
//                 verify: true,
//                 verification_token: true,
//                 verified_at: true,
//                 image: true,
//                 qr_code: true,
//                 created_at: true,
//                 updated_at: true,
//                 deleted_at: true,
//             },
//         });
//         res.json(users);
//     } catch (error) {
//         console.error("❌ Error fetching users:", error);
//         res.status(500).json({ error: "Failed to fetch users" });
//     }
// });


// if (require.main === module) {
//     const PORT = process.env.PORT || 8080;

//     app.listen(PORT, () => {
//         console.log(`🚀 InReal Server running on port ${PORT}`);
//         console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
//     });
// }

// --- ✅ Export for Vercel ---
module.exports = app;