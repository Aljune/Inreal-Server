const userService = require("./user.services");
const mailerService = require("../mailer/mailer.service");
const { connectDB, isConnectionReady } = require("../../db/connect");
const mongoose = require("mongoose");
const streamifier = require('streamifier');
const cloudinary = require("../../../utils/cloudinary");

const createUser = async (req, res) => {
  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    const user = await userService.createUser(req.body);
    await mailerService.sendVerificationCode(user.email, user.verification_token, user.first_name, user.last_name);
    const { password, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const user = await userService.findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    await userService.updateVerificationCode(email, newCode);
    await mailerService.sendVerificationCode(email, newCode, user.first_name, user.last_name);
    res.json({ message: "Verification code resent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const verifyUser = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code required" });

  try {
   if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const user = await userService.findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.verify) return res.status(400).json({ error: "Account already verified" });
    if (user.verification_token !== code) return res.status(400).json({ error: "Invalid code" });

    const verifiedUser = await userService.verifyUser(email);
    await mailerService.sendVerificationSuccess(email, user.first_name, user.last_name);
    res.json({ message: "Account verified successfully", user: verifiedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const user = await userService.findUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getUserById = async (req, res) => {
  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
  const { id } = req.params;

    const user = await userService.findUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// In user.controller.js - Add validation
const updateProfile = async (req, res) => {
  try {
    // Check database connection
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const { id } = req.params;
    console.log('Updating user ID:', id);
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const updateData = { ...req.body };
    
    // Validate input data
    if (updateData.first_name !== undefined && !updateData.first_name.trim()) {
      return res.status(400).json({ error: 'First name cannot be empty' });
    }
    if (updateData.last_name !== undefined && !updateData.last_name.trim()) {
      return res.status(400).json({ error: 'Last name cannot be empty' });
    }
    
    // Upload to Cloudinary (wrap in Promise)
    const uploadToCloudinary = (buffer, folder = "user-profiles") => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder,
            resource_type: "auto", // Auto-detect file type
            transformation: [
              { width: 500, height: 500, crop: "limit" }, // Resize large images
              { quality: "auto:good" } // Optimize quality
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            }
            if (result && result.secure_url) {
              console.log('Image uploaded successfully:', result.secure_url);
              return resolve({
                url: result.secure_url,
                publicId: result.public_id
              });
            }
            reject(new Error("No secure_url returned from Cloudinary"));
          }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    };

    // If image uploaded, process upload
    if (req.file) {
      try {
        console.log('Processing image upload...');
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        updateData.image = uploadResult.url;
        
        // Optional: Store public_id for future deletion
        if (uploadResult.publicId) {
          updateData.image_public_id = uploadResult.publicId;
        }
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to upload image',
          details: uploadError.message 
        });
      }
    }

    // Update user profile
    const updatedUser = await userService.updateUserProfile(id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User profile updated successfully');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  }
};

const istUsersWithAuth = async (req, res) => {
  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    const users = await userService.istUsersWithAuth();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listUsers = async (req, res) => {
  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🆕 Password Reset Controllers
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const { user, resetCode } = await userService.generatePasswordResetCode(email);
    await mailerService.sendPasswordResetCode(email, resetCode, user.first_name, user.last_name);
    
    res.json({ 
      message: "Password reset code sent to your email",
      _id: user._id,
      email: user.email,
      password_reset_token: user.password_reset_token,
    });
  } catch (err) {
    // Don't reveal if email exists or not for security
    if (err.message === "User not found") {
      return res.json({ 
        message: "If this email exists, a password reset code has been sent" 
      });
    }
    res.status(500).json({ error: err.message });
  }
};

const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const user = await userService.verifyPasswordResetCode(email, code);
    
    res.json({ 
      message: "Reset code verified successfully",
      canResetPassword: true,
      email: email // Frontend needs this for the password reset step
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, password, confirmPassword } = req.body;
  
  if (!email || !code || !password || !confirmPassword) {
    return res.status(400).json({ 
      error: "Email, code, password, and confirm password are required" 
    });
  }

  try {
    if (!isConnectionReady()) {
      console.log("🔄 Database not ready, connecting...");
      await connectDB();
    }
    
    const updatedUser = await userService.resetPassword(email, code, password, confirmPassword);
    await mailerService.sendPasswordResetSuccess(email, updatedUser.first_name, updatedUser.last_name);
    
    res.json({ 
      message: "Password reset successfully",
      success: true
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createUser,
  resendVerificationCode,
  verifyUser,
  getProfile,
  getUserById,
  updateProfile,
  listUsers,
  istUsersWithAuth,
  // 🆕 Password reset exports
  forgotPassword,
  verifyResetCode,
  resetPassword,
};