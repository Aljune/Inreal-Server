const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    console.log("🔄 Connecting to MongoDB...");

    // Modern Mongoose no longer needs legacy options
    connectionPromise = mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,          // 45 seconds
      bufferCommands: false            // disable mongoose buffering
      // ❌ bufferMaxEntries removed
      // ❌ useNewUrlParser / useUnifiedTopology unnecessary
    });

    await connectionPromise;

    isConnected = true;
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Connection state:", mongoose.connection.readyState);
    console.log("🏠 Database name:", mongoose.connection.name);

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
      isConnected = false;
      connectionPromise = null;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
      isConnected = false;
      connectionPromise = null;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      isConnected = true;
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("🔗 Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");

    isConnected = false;
    connectionPromise = null;

    throw new Error(`Database connection failed: ${err.message}`);
  }
}

function isConnectionReady() {
  return isConnected && mongoose.connection.readyState === 1;
}

async function reconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    isConnected = false;
    connectionPromise = null;
    await connectDB();
  } catch (error) {
    console.error("❌ Reconnection failed:", error.message);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    isConnected = false;
    connectionPromise = null;
    console.log("👋 MongoDB disconnected gracefully");
  } catch (error) {
    console.error("❌ Error during disconnect:", error.message);
  }
}

module.exports = {
  connectDB,
  isConnectionReady,
  reconnectDB,
  disconnectDB
};
