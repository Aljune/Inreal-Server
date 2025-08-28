const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const userController = require("./user.controller");
const { verifyToken } = require("../auth/auth.controller");

router.post("/create", userController.createUser);
router.post("/resend-code", userController.resendVerificationCode);
router.post("/verify", userController.verifyUser);
router.get("/me", verifyToken, userController.getProfile);
router.put("/edit/:id", verifyToken, upload.single("image"), userController.updateProfile);
router.get("/withAuth", verifyToken, userController.listUsers);
router.get("/", userController.istUsersWithAuth);

module.exports = router;
