const User = require("./user.model");
const bcrypt = require("bcrypt");
const QRCode = require("qrcode");

const createUser = async ({ first_name, last_name, email, place, user_type, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 12);
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const qrData = `${email}|${verificationCode}`;

  const qrCodeBase64 = await QRCode.toDataURL(qrData,
    {
      width: 400,
      color: {
        dark: "#000000", // QR code dots
        light: "#00000000", // transparent background (RGBA hex with alpha)
      },
    }
  );

  const createdAt = new Date();

  const user = await User.create({
    first_name,
    last_name,
    email,
    place,
    user_type,
    password: hashedPassword,
    preferences: {},
    verify: false,
    verification_token: verificationCode,
    verified_at: null,
    image: null,
    qr_code: qrCodeBase64, // Save QR code in DB
    created_at: createdAt,
    updated_at: null,
    deleted_at: null,
      // 🆕 Password reset fields
    password_reset_token: null,
    password_reset_expires: null,
  });

  return user;
};

const findUserByEmail = async (email) => User.findOne({ email });

const findUserById = async (id) => User.findById(id);

const updateVerificationCode = async (email, code) =>
  User.findOneAndUpdate({ email }, { verification_token: code }, { new: true });

const verifyUser = async (email) =>
  User.findOneAndUpdate(
    { email },
    { verify: true, verified_at: new Date(), verification_token: null },
    { new: true }
  );

// In user.services.js - Better error handling
const updateUserProfile = async (id, updateData) => {
  try {
    // Remove sensitive fields that shouldn't be updated
    const { password, email, user_type, verify, verification_token, verified_at, ...safeUpdateData } = updateData;
    
    console.log(safeUpdateData, 'safeUpdateData');
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { 
        ...safeUpdateData, 
        updated_at: new Date() 
      }, 
      { 
        new: true,
        runValidators: true, // Run mongoose validations
        select: '-password' // Don't return password
      }
    );
    
    return updatedUser;
  } catch (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

const listUsers = async () => User.find();

const istUsersWithAuth = async () => User.find();

// 🆕 Password Reset Functions
const generatePasswordResetCode = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  
  await User.findOneAndUpdate(
    { email },
    { 
      password_reset_token: resetCode,
      password_reset_expires: expiresAt,
      updated_at: new Date()
    },
    { new: true }
  );
  
  return { user, resetCode };
};

const verifyPasswordResetCode = async (email, code) => {
  const user = await User.findOne({ 
    email,
    password_reset_token: code,
    password_reset_expires: { $gt: new Date() } // Check if not expired
  });
  
  if (!user) {
    throw new Error("Invalid or expired reset code");
  }
  
  return user;
};

const resetPassword = async (email, code, newPassword, confirmPassword) => {
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
  
  // Validate password strength
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }
  
  // Verify the reset code is valid and not expired
  const user = await verifyPasswordResetCode(email, code);
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update user with new password and clear reset token
  const updatedUser = await User.findOneAndUpdate(
    { email },
    {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date()
    },
    { new: true }
  );
  
  return updatedUser;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateVerificationCode,
  verifyUser,
  updateUserProfile,
  listUsers,
  istUsersWithAuth,
  // 🆕 Password reset exports
  generatePasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
};