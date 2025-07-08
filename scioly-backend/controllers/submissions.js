const submissionsRouter = require("express").Router();
const Submission = require("../models/submission");
const Answer = require("../models/answer");
const { userExtractor } = require("../utils/middleware");

// GET /api/submissions - Get all submissions
submissionsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  try {
    const submissions = await Submission.find({})
      .populate("answer")
      .populate("test", "event school year")
      .populate("team", "name")
      .populate("user", "username email");

    response.json(submissions);
  } catch (error) {
    console.error("Error getting submissions:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// GET /api/submissions/:id - Get specific submission
submissionsRouter.get("/:id", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  try {
    const submission = await Submission.findById(request.params.id)
      .populate("answer")
      .populate("test", "event school year")
      .populate("team", "name")
      .populate("user", "username email");

    if (!submission) {
      return response.status(404).json({ error: "submission not found" });
    }

    response.json(submission);
  } catch (error) {
    console.error("Error getting submission:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// POST /api/submissions - Create submission from answers object
submissionsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { testId, teamId, finalTimeLeft = 0 } = request.body;

  if (!testId || !teamId) {
    return response.status(400).json({ error: "testId and teamId are required" });
  }

  try {
    // Find the answers object for this team/test
    const answers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (!answers) {
      return response.status(404).json({ error: "answers not found - team must take test first" });
    }

    // Check if submission already exists
    const existingSubmission = await Submission.findOne({
      answer: answers._id,
      test: testId,
      team: teamId,
    });

    if (existingSubmission) {
      return response.status(409).json({ error: "submission already exists" });
    }

    // Create submission
    const submission = new Submission({
      answer: answers._id,
      test: testId,
      team: teamId,
      user: request.user.id,
      finalTimeLeft,
    });

    const savedSubmission = await submission.save();
    const populatedSubmission = await Submission.findById(savedSubmission._id)
      .populate("answer")
      .populate("test", "event school year")
      .populate("team", "name")
      .populate("user", "username email");

    response.status(201).json(populatedSubmission);
  } catch (error) {
    console.error("Error creating submission:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// GET /api/submissions/check/:testId/:teamId - Check if submission exists for test/team
submissionsRouter.get("/check/:testId/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { testId, teamId } = request.params;

  try {
    const existingSubmission = await Submission.findOne({
      test: testId,
      team: teamId,
    });

    response.json({ submitted: !!existingSubmission, submission: existingSubmission });
  } catch (error) {
    console.error("Error checking submission:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

module.exports = submissionsRouter;
