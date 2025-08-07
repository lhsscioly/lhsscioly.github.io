const questionsRouter = require("express").Router();
const Question = require("../models/question");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, sanitizeInput } = require("../utils/security");

/**
 * GET /api/questions - Get all questions (Verified users only)
 * Returns all questions in the system
 */
questionsRouter.get("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated and verified
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  try {
    const questions = await Question.find({});
    return response.json(questions);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve questions');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * POST /api/questions - Create new question (Admin only, must be verified)
 * Creates a new question with proper validation and security checks
 */
questionsRouter.post("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated, verified, and is admin
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  // Sanitize and validate input
  const sanitizedBody = sanitizeInput(request.body);
  const {
    event,
    school,
    year,
    type,
    question,
    points,
    choices,
    answer,
    imageUrl,
  } = sanitizedBody;

  try {
    const questionObject = new Question({
      event,
      school,
      year,
      type,
      question,
      points,
      choices,
      answer,
      imageUrl,
    });

    const savedQuestion = await questionObject.save();

    return response.status(201).json(savedQuestion);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to create question');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * PUT /api/questions/:id - Update question (Admin only, must be verified)
 * Updates an existing question with proper validation and security checks
 */
questionsRouter.put("/:id", userExtractor, async (request, response) => {
  // Ensure user is authenticated, verified, and is admin
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  // Validate ObjectId format
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid question ID format', 400, 'INVALID_ID'));
  }

  // Sanitize and validate input
  const sanitizedBody = sanitizeInput(request.body);
  const {
    event,
    school,
    year,
    type,
    question,
    points,
    choices,
    answer,
    imageUrl,
  } = sanitizedBody;

  try {
    const questionObject = await Question.findById(request.params.id);
    if (!questionObject) {
      return response.status(404).json(createErrorResponse('Question not found', 404, 'NOT_FOUND'));
    }

    // Update question fields with sanitized data
    questionObject.event = event;
    questionObject.school = school;
    questionObject.year = year;
    questionObject.type = type;
    questionObject.question = question;
    questionObject.points = points;
    questionObject.choices = choices;
    questionObject.answer = answer;
    questionObject.imageUrl = imageUrl;

    const savedQuestion = await questionObject.save();
    return response.status(200).json(savedQuestion);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to update question');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

module.exports = questionsRouter;

module.exports = questionsRouter;
