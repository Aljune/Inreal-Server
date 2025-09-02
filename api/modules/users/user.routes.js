const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const userController = require("./user.controller");
const { verifyToken } = require("../auth/auth.controller");

// 👤 User Registration & Verification
router.post("/create", userController.createUser);
router.post("/resend-code", userController.resendVerificationCode);
router.post("/verify", userController.verifyUser);

// 🔐 Password Reset Flow
router.post("/forgot-password", userController.forgotPassword);
router.post("/verify-reset-code", userController.verifyResetCode);
router.post("/reset-password", userController.resetPassword);

// 👤 User Profile (Protected routes)
router.get("/me", verifyToken, userController.getProfile);
router.put("/edit/:id", upload.single("image"), userController.updateProfile);
router.get("/:id", userController.getUserById);

// 📋 User Lists
router.get("/with-auth", verifyToken, userController.listUsers);
router.get("/", userController.istUsersWithAuth);

module.exports = router;