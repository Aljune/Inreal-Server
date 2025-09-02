const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
  deleted_at: { type: mongoose.Schema.Types.Mixed, default: null },
  email: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  image: { type: String, default: null },
  last_name: { type: String, required: true },
  password: { type: String, required: true },
  place: { type: String, required: true },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  qr_code: { type: String, required: true },
  updated_at: { type: mongoose.Schema.Types.Mixed, default: null },
  user_type: { type: String, required: true },
  verification_token: { type: mongoose.Schema.Types.Mixed, default: null },
  verified_at: { type: Date, default: null },
  verify: { type: Boolean, default: false },
  
  // 🆕 Password reset fields
  password_reset_token: { type: String, default: null },
  password_reset_expires: { type: Date, default: null },
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);