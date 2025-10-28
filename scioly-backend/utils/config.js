require("dotenv").config();

// All important environmental variables

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_KEY = process.env.ADMIN_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_PORT = process.env.FRONTEND_PORT;

module.exports = {
  FRONTEND_PORT,
  MONGODB_URI,
  PORT,
  ADMIN_KEY,
  EMAIL_USER,
  EMAIL_PASS,
};
