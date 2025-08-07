const answersRouter = require("express").Router();
const Answer = require("../models/answer");
const Test = require("../models/test");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, sanitizeInput } = require("../utils/security");

/**
 * POST /api/answers - Create initial answer document for a team taking a test (Verified users only)
 * Creates a new answer document with proper validation and security checks
 */
answersRouter.post("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated and verified
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  // Sanitize and validate input
  const sanitizedBody = sanitizeInput(request.body);
  const { testId, teamId, answers = {}, drawings = {}, timeLeft = 0 } = sanitizedBody;

  // Validate required fields
  if (!testId || !teamId) {
    return response.status(400).json(createErrorResponse('testId and teamId are required', 400, 'MISSING_REQUIRED_FIELDS'));
  }

  // Validate ObjectId formats
  if (!isValidObjectId(testId) || !isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid ID format', 400, 'INVALID_ID'));
  }

  try {
    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return response.status(404).json(createErrorResponse('Test not found', 404, 'TEST_NOT_FOUND'));
    }

    // Check if answers already exist for this team/test combination
    const existingAnswers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (existingAnswers) {
      return response.status(409).json(createErrorResponse('Answers already exist for this team/test combination', 409, 'ANSWERS_EXIST'));
    }

    // Create new answer document with validated data
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
    const errorResponse = handleError(error, 'Failed to create answer document');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/answers/:testId/:teamId - Get answers for a specific team taking a test (Verified users only)
 * Retrieves answer document with real-time calculation and proper validation
 */
answersRouter.get("/:testId/:teamId", userExtractor, async (request, response) => {
  // Ensure user is authenticated and verified
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  const { testId, teamId } = request.params;

  // Validate ObjectId formats
  if (!isValidObjectId(testId) || !isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid ID format', 400, 'INVALID_ID'));
  }

  try {
    const answers = await Answer.findOne({
      team: teamId,
      test: testId,
    }).populate("test", "event school year")
      .populate("team", "name schoolYear")
      .populate("user", "username");

    if (!answers) {
      return response.status(404).json(createErrorResponse('Answers not found', 404, 'ANSWERS_NOT_FOUND'));
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
    const errorResponse = handleError(error, 'Failed to retrieve answers');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * PUT /api/answers/:testId/:teamId - Update answers for a specific team taking a test (Verified users only)
 * Updates answer document with timestamp tracking and proper validation
 */
answersRouter.put("/:testId/:teamId", userExtractor, async (request, response) => {
  // Ensure user is authenticated and verified
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  const { testId, teamId } = request.params;

  // Validate ObjectId formats
  if (!isValidObjectId(testId) || !isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid ID format', 400, 'INVALID_ID'));
  }

  // Sanitize input data
  const sanitizedBody = sanitizeInput(request.body);
  const { answers = {}, drawings = {}, timeLeft } = sanitizedBody;

  try {
    const existingAnswers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (!existingAnswers) {
      return response.status(404).json(createErrorResponse('Answers not found', 404, 'ANSWERS_NOT_FOUND'));
    }

    // Update the answers with sanitized data
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
    const errorResponse = handleError(error, 'Failed to update specific answer');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/answers - Get all answers (Admin only, must be verified)
 * Returns all answer documents in the system
 */
answersRouter.get("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated, verified, and is admin
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  try {
    const answers = await Answer.find({})
      .populate("user", "username email")
      .populate("test", "event school year")
      .populate("team", "name schoolYear");

    return response.json(answers);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve all answers');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

module.exports = answersRouter;
