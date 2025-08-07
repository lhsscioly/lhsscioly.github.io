// Handles user login and JWT token generation
// Expects: { email, password } in request body
// Returns: JWT token and user info if successful

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/user");

// POST /api/login
// Authenticates user and returns JWT token if credentials are valid
loginRouter.post("/", async (request, response) => {
  const { email, password } = request.body;

  // Find user by email
  const user = await User.findOne({ email });

  // Check password
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid username or password",
    });
  }

  // Require email verification before login
  if (!user.verified) {
    return response
      .status(403)
      .json({ error: "Please verify your email before logging in." });
  }

  // Prepare payload for JWT
  const userForToken = {
    email: user.email,
    id: user.id,
  };

  // Sign and return JWT token
  const token = jwt.sign(userForToken, process.env.SECRET);

  return response.status(200).json({
    token: token,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    id: user.id,
    admin: user.admin,
  });
});

// Export the login router
module.exports = loginRouter;
