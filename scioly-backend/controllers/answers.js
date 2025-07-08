const answersRouter = require("express").Router();
const Answer = require("../models/answer");
const Test = require("../models/test");
const { userExtractor } = require("../utils/middleware");

// POST /api/answers - Create initial answer document for a team taking a test
answersRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { testId, teamId, answers = {}, drawings = {}, timeLeft = 0 } = request.body;

  if (!testId || !teamId) {
    return response.status(400).json({ error: "testId and teamId are required" });
  }

  try {
    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return response.status(404).json({ error: "test not found" });
    }

    // Check if answers already exist for this team/test combination
    const existingAnswers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (existingAnswers) {
      return response.status(409).json({ error: "answers already exist for this team/test" });
    }

    // Create new answer document
    const answerObject = new Answer({
      user: request.user.id,
      test: testId,
      team: teamId,
      answers: new Map(Object.entries(answers)),
      drawings: new Map(Object.entries(drawings)),
      timeLeft: timeLeft || 50 * 60, // Default to 50 minutes
      startedAt: new Date(),
    });

    const savedAnswer = await answerObject.save();
    return response.status(201).json(savedAnswer);
  } catch (error) {
    console.error("Error creating answers:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// GET /api/answers/:testId/:teamId - Get answers for a specific team taking a test
answersRouter.get("/:testId/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { testId, teamId } = request.params;

  try {
    const answers = await Answer.findOne({
      team: teamId,
      test: testId,
    }).populate("test", "event school year")
      .populate("team", "name")
      .populate("user", "username");

    if (!answers) {
      return response.status(404).json({ error: "answers not found" });
    }

    // Calculate actual time left based on elapsed time
    const now = new Date();
    const elapsed = Math.floor((now - answers.startedAt) / 1000); // seconds elapsed
    const initialTime = 50 * 60; // 50 minutes in seconds
    const actualTimeLeft = Math.max(0, initialTime - elapsed);

    // Update the timeLeft to reflect actual time
    answers.timeLeft = actualTimeLeft;

    return response.json(answers);
  } catch (error) {
    console.error("Error getting answers:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// PUT /api/answers/:testId/:teamId - Update answers for a specific team taking a test
answersRouter.put("/:testId/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { testId, teamId } = request.params;
  const { answers = {}, drawings = {}, timeLeft } = request.body;

  try {
    const existingAnswers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (!existingAnswers) {
      return response.status(404).json({ error: "answers not found" });
    }

    // Update the answers
    const currentTime = new Date();
    existingAnswers.answers = new Map(Object.entries(answers));
    existingAnswers.drawings = new Map(Object.entries(drawings));
    
    // Update timestamps for all answers and drawings
    const answerTimestamps = new Map();
    const drawingTimestamps = new Map();
    
    for (const [questionId, answer] of Object.entries(answers)) {
      answerTimestamps.set(questionId, currentTime);
    }
    
    for (const [questionId, drawing] of Object.entries(drawings)) {
      drawingTimestamps.set(questionId, currentTime);
    }
    
    existingAnswers.answerTimestamps = answerTimestamps;
    existingAnswers.drawingTimestamps = drawingTimestamps;
    existingAnswers.submittedAt = currentTime;
    existingAnswers.user = request.user.id; // Update the user making the change
    
    if (timeLeft !== undefined) {
      existingAnswers.timeLeft = timeLeft;
    }

    const updatedAnswers = await existingAnswers.save();
    return response.json(updatedAnswers);
  } catch (error) {
    console.error("Error updating answers:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// PATCH /api/answers/:testId/:teamId - Update specific answer/drawing for a team taking a test
answersRouter.patch("/:testId/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { testId, teamId } = request.params;
  const { questionId, answer, drawing } = request.body;

  try {
    const existingAnswers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (!existingAnswers) {
      return response.status(404).json({ error: "answers not found" });
    }

    let hasChanges = false;

    // Update specific answer if provided
    if (questionId && answer !== undefined) {
      const currentAnswer = existingAnswers.answers.get(questionId);
      if (currentAnswer !== answer) {
        existingAnswers.answers.set(questionId, answer);
        existingAnswers.answerTimestamps.set(questionId, new Date());
        hasChanges = true;
      }
    }

    // Update specific drawing if provided
    if (questionId && drawing !== undefined) {
      const currentDrawing = existingAnswers.drawings.get(questionId);
      if (drawing === null) {
        if (existingAnswers.drawings.has(questionId)) {
          existingAnswers.drawings.delete(questionId);
          existingAnswers.drawingTimestamps.delete(questionId);
          hasChanges = true;
        }
      } else {
        // Compare drawing data (simplified comparison)
        const drawingStr = JSON.stringify(drawing);
        const currentDrawingStr = JSON.stringify(currentDrawing);
        if (drawingStr !== currentDrawingStr) {
          existingAnswers.drawings.set(questionId, drawing);
          existingAnswers.drawingTimestamps.set(questionId, new Date());
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      existingAnswers.submittedAt = new Date();
      existingAnswers.user = request.user.id; // Update the user making the change
      await existingAnswers.save();
    }

    // Calculate actual time left for response
    const now = new Date();
    const elapsed = Math.floor((now - existingAnswers.startedAt) / 1000);
    const initialTime = 50 * 60;
    const actualTimeLeft = Math.max(0, initialTime - elapsed);
    existingAnswers.timeLeft = actualTimeLeft;

    return response.json(existingAnswers);
  } catch (error) {
    console.error("Error updating specific answer:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// GET /api/answers - Get all answers
answersRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  try {
    const answers = await Answer.find({})
      .populate("user", "username email")
      .populate("test", "event school year")
      .populate("team", "name");

    return response.json(answers);
  } catch (error) {
    console.error("Error getting all answers:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

module.exports = answersRouter;
