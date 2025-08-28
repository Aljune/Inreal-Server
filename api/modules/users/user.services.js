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

const updateUserProfile = async (id, updateData) =>
  User.findByIdAndUpdate(id, { ...updateData, updated_at: new Date() }, { new: true });

const listUsers = async () => User.find();

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateVerificationCode,
  verifyUser,
  updateUserProfile,
  listUsers,
};
