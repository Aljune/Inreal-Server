const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");
const QRCode = require("qrcode");

const { v4: uuidv4 } = require("uuid");

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { sendVerificationCode, sendVerificationSuccess } = require("../modules/mailer");

const prisma = new PrismaClient();
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 👈 Attach user data to request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// POST /users - Create a new user
router.post("/create", async (req, res) => {
  const { first_name, last_name, email, place, user_type, password } = req.body;

  if (!first_name || !last_name || !email || !password || !place) {
    return res
      .status(400)
      .json({
        error: "Required fields: first_name, last_name, email, password, place",
      });
  }

  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create verification token
  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Generate QR code for benefits (encode email + verification token)
  const qrData = `${email}|${verificationCode}`;
  const qrCodeBase64 = await QRCode.toDataURL(qrData, {
    width: 400,
    color: {
      dark: "#000000", // QR code dots
      light: "#00000000", // transparent background (RGBA hex with alpha)
    },
  });

  console.log(qrCodeBase64, "qrCodeBase64");
  const createdAt = new Date();

  const user = await prisma.users.create({
    data: {
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
    },
  });

  await sendVerificationCode(
    email,
    verificationCode,
    user.first_name,
    user.last_name
  );

  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

// POST /users/resend-code - Resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if (user.verify) {
    //   return res.status(400).json({ message: 'Account already verified' });
    // }

    const newCode = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.users.update({
      where: { email },
      data: { verification_token: newCode },
    });

    await sendVerificationCode(email, newCode, user.first_name, user.last_name);

    res.status(200).json({ message: "Verification code resent successfully" });
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Failed to resend verification code",
        details: err.message,
      });
  }
});

// GET /users - List all users
router.get("/", async (req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      place: true,
      user_type: true,
      preferences: true,
      verify: true,
      verification_token: true,
      verified_at: true,
      image: true,
      qr_code: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });
  res.json(users);
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        place: true,
        user_type: true,
        preferences: true,
        verify: true,
        verification_token: true,
        verified_at: true,
        image: true,
        qr_code: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message });
  }
});

router.put("/edit/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, place } = req.body;

    let imageUrl = null;

    // Upload to Cloudinary (wrap in Promise)
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "user-profiles" },
          (error, result) => {
            if (error) return reject(error);
            if (result && result.secure_url) return resolve(result.secure_url);
            reject(new Error("No secure_url returned from Cloudinary"));
          }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    };

    // If image uploaded, process upload
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);

      const updatedUser = await prisma.users.update({
        where: { id },
        data: {
          first_name,
          last_name,
          place,
          image: imageUrl,
        },
      });

      return res.json(updatedUser);
    }

    // No image: update without image field
    const updatedUser = await prisma.users.update({
      where: { id },
      data: { first_name, last_name, place },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed", detail: err.message });
  }
});

// POST /users/verify - Verify account with 4-digit code
router.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required" });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (user.verification_token !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const verifiedUser = await prisma.users.update({
      where: { email },
      data: {
        verify: true,
        verified_at: new Date(),
        verification_token: null,
      },
    });

    await sendVerificationSuccess(email, user.first_name, user.last_name);

    res
      .status(200)
      .json({ message: "Account verified successfully", user: verifiedUser });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Verification failed", details: err.message });
  }
});

module.exports = router;
