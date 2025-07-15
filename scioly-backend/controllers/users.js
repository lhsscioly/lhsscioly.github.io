const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");
const config = require("../utils/config");
const nodemailer = require("nodemailer");
const { userExtractor } = require("../utils/middleware");
const { randomUUID } = require("crypto");

usersRouter.get("/", async (request, response) => {
  const users = await User.find({ verified: true }).populate("teams");
  return response.json(users);
});

usersRouter.get("/verify", async (request, response) => {
  const { token } = request.query;

  const user = await User.findOne({ verificationToken: token }).populate(
    "teams",
  );

  if (!user) {
    return response.status(400).json({ error: "Invalid or expired token" });
  }

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  response.send("Email verified successfully! You can now log in.");
});

usersRouter.post("/", async (request, response) => {
  const { email, firstName, lastName, password, adminKey } = request.body;

  if (!password) {
    return response.status(400).json({ error: "Path `password` is required" });
  } else if (password.length < 8) {
    return response.status(400).json({
      error: "Path `password` is shorter than the minimum allowed length (8)",
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  let admin = false;
  if (adminKey) {
    if (adminKey === config.ADMIN_KEY) {
      admin = true;
    } else {
      return response.status(400).json({ error: "Invalid admin key" });
    }
  }

  let user = await User.find({ firstName, lastName });
  if (user) {
    return response.status(400).json({ error: "expected `name` to be unique" });
  }

  const verificationToken = randomUUID();

  try {
    const userObject = new User({
      email,
      firstName,
      lastName,
      admin,
      passwordHash,
      verified: false,
      verificationToken,
    });

    const savedUser = await userObject.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: config.EMAIL_USER,
        pass: "rkhpsbfxkgsbqpow",
      },
    });

    try {
      await transporter.sendMail({
        from: `"LHS Scioly" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your email address",
        html: `
                    <p>Hello ${firstName},</p>
                    <p>Please verify your email by clicking the link below:</p>
                    <a href="https://shubhvarshney.github.io/lhsscioly/verify?token=${verificationToken}">Verify Email</a>
                `,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      return response
        .status(500)
        .json({ error: "Failed to send verification email" });
    }

    return response.status(201).json(savedUser);
  } catch (error) {
    if (error.name === "ValidationError") {
      return response.status(400).json({ error: error.message });
    } else if (
      error.name === "MongoServerError" &&
      error.message.includes("E11000 duplicate key error")
    ) {
      return response
        .status(400)
        .json({ error: "expected `email` to be unique" });
    } else {
      return response.status(400).json({ error: error.message });
    }
  }
});

usersRouter.post("/forgot", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: "No user with that email" });
  }

  const token = crypto.randomUUID();
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
  await user.save();

  const resetLink = `https://shubhvarshney.github.io/lhsscioly/reset?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"LHS Scioly" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <a href="${resetLink}">Click here to reset</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });
    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

usersRouter.post("/reset", async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  if (!password) {
    return res.status(400).json({ error: "Path `password` is required" });
  }

  if (password.length < 8) {
    return response.status(400).json({
      error: "Path `password` is shorter than the minimum allowed length (8)",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});

usersRouter.put("/reset/:id", userExtractor, async (request, response) => {
  const id = request.params.id;
  const { password } = request.body;

  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  if (request.user.id.toString() !== id.toString()) {
    return response
      .status(403)
      .json({ error: "unauthorized to change this user" });
  }

  const user = await User.findOne({ _id: id });
  if (!user) {
    return response.status(404).json({ error: "user not found" });
  }

  if (!password) {
    return response.status(400).json({ error: "Path `password` is required" });
  } else if (password.length < 8) {
    return response.status(400).json({
      error: "Path `password` is shorter than the minimum allowed length (8)",
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  user.passwordHash = passwordHash;
  const savedUser = await user.save();
  return response.status(201).json(savedUser);
});

module.exports = usersRouter;
