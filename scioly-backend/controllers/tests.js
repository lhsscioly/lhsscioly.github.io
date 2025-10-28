const testsRouter = require("express").Router();
const Question = require("../models/question");
const Test = require("../models/test");
const Team = require("../models/team");
const Submission = require("../models/submission");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, sanitizeInput } = require("../utils/security");

testsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  try {
    const tests = await Test.find({})
      .populate("questions")
      .populate("assignees", "name");
    
    return response.json(tests);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve tests');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

testsRouter.get("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid test ID format', 400, 'INVALID_ID'));
  }

  try {
    const test = await Test.findById(request.params.id)
      .populate("questions")
      .populate("assignees", "name");
    
    if (!test) {
      return response.status(404).json(createErrorResponse('Test not found', 404, 'NOT_FOUND'));
    }
    
    return response.json(test);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve test');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

testsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required', 401, 'UNAUTHORIZED'));
  }

  const sanitizedBody = sanitizeInput(request.body);
  const { event, random, school, year, questions } = sanitizedBody;

  try {
    const testObject = new Test({
      event,
      random,
      school,
      year,
      questions,
      assignees: [],
    });

    const savedTest = await testObject.save();
    const populatedTest = await Test.findById(savedTest._id)
      .populate("questions")
      .populate("assignees", "name");

    return response.status(201).json(populatedTest);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to create test');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

testsRouter.put("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid test ID format', 400, 'INVALID_ID'));
  }

  const sanitizedBody = sanitizeInput(request.body);
  const { assignees } = sanitizedBody;

  try {
    const test = await Test.findById(request.params.id);
    if (!test) {
      return response.status(404).json(createErrorResponse('Test not found', 404, 'NOT_FOUND'));
    }

    if (assignees && assignees.length > 0) {
      try {
        const testsForEvent = await Test.find({ 
          event: test.event 
        }, '_id');

        const testIds = testsForEvent.map(t => t._id);

        const existingSubmissions = await Submission.find({
          team: { $in: assignees },
          test: { $in: testIds }
        }).populate('team', 'name');

        if (existingSubmissions.length > 0) {
          const teamNames = existingSubmissions.map(sub => sub.team.name).join(', ');
          return response.status(409).json(createErrorResponse(
            `Team(s) have already submitted tests for event ${test.event}: ${teamNames}`,
            409,
            'SUBMISSION_CONFLICT'
          ));
        }
      } catch (error) {
        const errorResponse = handleError(error, 'Failed to check existing submissions');
        return response.status(errorResponse.error.statusCode).json(errorResponse);
      }
    }

    test.assignees = assignees;

    const savedTest = await test.save();
    const populatedTest = await Test.findById(savedTest._id)
      .populate("questions")
      .populate("assignees", "name");

    return response.status(200).json(populatedTest);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to update test');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

module.exports = testsRouter;
