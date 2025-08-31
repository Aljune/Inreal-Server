const User = require("../users/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { connectDB, isConnectionReady } = require("../../db/connect");

const loginUser = async (email, password) => {
  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }

    console.log("🔍 Searching for user with email:", email);
    const user = await User.findOne({ email }).maxTimeMS(5000); // 5 seconds

    if (!user) throw new Error("Invalid email or password");
    if (!user.verify) throw new Error("Account not verified");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid email or password");

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { user, token };
  } catch (error) {
    console.error("❌ Login error:", error.message);
    if (error.name === "MongooseError" || error.message.includes("buffering timed out")) {
      throw new Error("Database connection timeout. Please try again.");
    }
    if (error.name === "MongoNetworkError") {
      throw new Error("Database network error. Please check your connection.");
    }
    throw error;
  }
};

module.exports = { loginUser };
