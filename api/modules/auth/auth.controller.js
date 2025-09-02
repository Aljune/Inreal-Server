const authService = require("./auth.service");     // <-- filename must match
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { email, password } = req.body;           // <-- req.body now safe
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const { user, token } = await authService.loginUser(email, password);
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        place: user.place,
        user_type: user.user_type,
        preferences: user.preferences,
        verify: user.verify,
        verification_token: user.verification_token,
        verified_at: user.verified_at,
        image: user.image,
        qr_code: user.qr_code,
        password_reset_token: user.password_reset_token,
        password_reset_expires: user.password_reset_expires,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
      },
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token missing" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { login, verifyToken };
