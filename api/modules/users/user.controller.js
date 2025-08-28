const userService = require("./user.services");
const mailerService = require("../mailer/mailer.service");
const connectDB = require("./../../db/connect");

const createUser = async (req, res) => {
  try {
    
    await connectDB();
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
    await connectDB();

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
    await connectDB();

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
    await connectDB();

    const user = await userService.findUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
        await connectDB();

    const { id } = req.params;
    const updateData = req.body;
    if (req.file) {
      updateData.image = await require("../utils/cloudinary").uploadBuffer(req.file.buffer, "user-profiles");
    }
    const updatedUser = await userService.updateUserProfile(id, updateData);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const istUsersWithAuth = async (req, res) => {
  try {
    await connectDB();
    const users = await userService.istUsersWithAuth();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listUsers = async (req, res) => {
  try {
    await connectDB();
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createUser,
  resendVerificationCode,
  verifyUser,
  getProfile,
  updateProfile,
  listUsers,
  istUsersWithAuth,
};
