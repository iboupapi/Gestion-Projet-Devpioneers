const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function uuid() {
  return crypto.randomUUID();
}

function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = { signToken, verifyToken, uuid, generateInviteToken };
