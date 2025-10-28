const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/user");

// JWT is used for logging rather than sessions for simplicity and convenience of logging in

loginRouter.post("/", async (request, response) => {
  const { email, password } = request.body;

  const user = await User.findOne({ email });

  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid username or password",
    });
  }

  if (!user.verified) {
    return response
      .status(403)
      .json({ error: "Please verify your email before logging in." });
  }

  const userForToken = {
    email: user.email,
    id: user.id,
  };

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

module.exports = loginRouter;
