const express = require("express");
const Submission = require("../models/submission");
const Answer = require("../models/answer");
const Test = require("../models/test");
const Team = require("../models/team");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, checkResourceOwnership, sanitizeInput } = require("../utils/security");

const submissionsRouter = express.Router();

/**
 * Helper function to calculate Multiple Choice Question (MCQ) scores
 * @param {Object} test - The test object containing questions
 * @param {Object} answers - The answers object containing user responses
 * @returns {Object} Object containing score and breakdown of correct/incorrect answers
 */
const calculateMCQScore = (test, answers) => {
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let mcqQuestions = 0;

  test.questions.forEach(question => {
    if (question.type === "mcq") {
      mcqQuestions++;
      const userAnswer = answers[question._id];
      if (userAnswer && userAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
        score += question.points || 1;
        correct++;
      } else {
        incorrect++;
      }
    }
  });

  return {
    score,
    correct,
    incorrect,
    mcqQuestions
  };
};

/**
 * Helper function to calculate total possible score for a test
 * @param {Object} test - The test object containing questions
 * @returns {number} Total possible points for the test
 */
const calculateTotalPossibleScore = (test) => {
  return test.questions.reduce((total, question) => {
    return total + (question.points || 1);
  }, 0);
};

/**
 * Helper function to determine submission ownership for resource validation
 * Used by checkResourceOwnership middleware to verify access rights
 * @param {string} submissionId - The ID of the submission to check
 * @param {Object} user - The current user object
 * @returns {Promise<boolean>} True if user has access to the submission
 */
const getSubmissionOwner = async (submissionId, user) => {
  try {
    const submission = await Submission.findById(submissionId)
      .populate({
        path: "team",
        populate: {
          path: "students",
          select: "_id"
        }
      })
      .populate("users", "_id");

    if (!submission) {
      return false;
    }

    // Admin users can access any submission
    if (user.admin) {
      return true;
    }

    // Check if user is the original submitter
    if (submission.user && submission.user.toString() === user.id) {
      return true;
    }

    // Check if user is in the users array (participated in submission)
    if (submission.users && submission.users.some(u => u._id.toString() === user.id)) {
      return true;
    }

    // Check if user is member of the team that made the submission
    if (submission.team && submission.team.students) {
      return submission.team.students.some(student => student._id.toString() === user.id);
    }

    return false;
  } catch (error) {
    console.error("Error checking submission ownership:", error);
    return false;
  }
};

/**
 * GET /api/submissions - Get all submissions (Admin only)
 * Returns all submissions in the system with populated related data
 */
submissionsRouter.get("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  // Only admins can view all submissions
  if (!request.user.admin) {
    return response.status(403).json(createErrorResponse('Admin access required', 403, 'FORBIDDEN'));
  }

  try {
    const submissions = await Submission.find({})
      .populate("answer")
      .populate("test", "event school year")
      .populate({
        path: "team",
        select: "name schoolYear students",
        populate: {
          path: "students",
          select: "firstName lastName email"
        }
      })
      .populate("user", "firstName lastName email")
      .populate("users", "firstName lastName email");

    response.json(submissions);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve submissions');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/submissions/:id - Get specific submission with ownership validation
 * Users can only access submissions they participated in, admins can access any
 */
submissionsRouter.get("/:id", userExtractor, checkResourceOwnership(getSubmissionOwner), async (request, response) => {
  // Validate ObjectId format
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid submission ID format', 400, 'INVALID_ID'));
  }

  try {
    const submission = await Submission.findById(request.params.id)
      .populate("answer")
      .populate({
        path: "test",
        populate: {
          path: "questions",
          model: "Question"
        }
      })
      .populate({
        path: "team",
        select: "name schoolYear students",
        populate: {
          path: "students",
          select: "firstName lastName email"
        }
      })
      .populate("user", "firstName lastName email")
      .populate("users", "firstName lastName email");

    if (!submission) {
      return response.status(404).json(createErrorResponse('Submission not found', 404, 'NOT_FOUND'));
    }

    response.json(submission);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve submission');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * POST /api/submissions - Create new submission from answers object (Authenticated users only)
 * Creates a new test submission with score calculation, validation, and team membership checks
 * @body {string} testId - The ID of the test being submitted
 * @body {string} teamId - The ID of the team making the submission
 * @body {number} finalTimeLeft - Time remaining when submission was made (default: 0)
 */
submissionsRouter.post("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  // Sanitize and validate input
  const sanitizedBody = sanitizeInput(request.body);
  const { testId, teamId, finalTimeLeft = 0 } = sanitizedBody;

  // Validate required fields
  if (!testId || !teamId) {
    return response.status(400).json(createErrorResponse('testId and teamId are required', 400, 'MISSING_REQUIRED_FIELDS'));
  }

  // Validate ObjectId formats
  if (!isValidObjectId(testId) || !isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid ID format', 400, 'INVALID_ID'));
  }

  try {
    // Find the answers object for this team/test combination
    const answers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (!answers) {
      return response.status(404).json(createErrorResponse('Answers not found - team must take test first', 404, 'ANSWERS_NOT_FOUND'));
    }

    // Check if submission already exists for this combination
    const existingSubmission = await Submission.findOne({
      answer: answers._id,
      test: testId,
      team: teamId,
    });

    if (existingSubmission) {
      return response.status(409).json(createErrorResponse('Submission already exists', 409, 'SUBMISSION_EXISTS'));
    }

    // Get the test with questions to calculate MCQ score
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return response.status(404).json(createErrorResponse('Test not found', 404, 'TEST_NOT_FOUND'));
    }

    // Get the team to access students list and validate membership
    const team = await Team.findById(teamId).populate('students');
    if (!team) {
      return response.status(404).json(createErrorResponse('Team not found', 404, 'TEAM_NOT_FOUND'));
    }

    // Verify user is member of the team (unless admin)
    if (!request.user.admin) {
      const isMember = team.students.some(student => student.id === request.user.id);
      if (!isMember) {
        return response.status(403).json(createErrorResponse('User is not a member of this team', 403, 'FORBIDDEN'));
      }
    }

    // Calculate MCQ score automatically using helper function
    const mcqScore = calculateMCQScore(test, answers.answers);
    const totalPossibleScore = calculateTotalPossibleScore(test);

    // Ensure schoolYear is set - use team's schoolYear or current school year as fallback
    const { getCurrentSchoolYear } = require("../utils/schoolYear");
    const submissionSchoolYear = team.schoolYear || getCurrentSchoolYear();

    // Create submission with calculated MCQ score and proper validation
    const submission = new Submission({
      answer: answers._id,
      test: testId,
      team: teamId,
      user: request.user.id,
      users: team.students, // All team members who participated in the test
      schoolYear: submissionSchoolYear, // School year from team with fallback
      finalTimeLeft,
      totalScore: mcqScore.score, // Start with MCQ score, manual scoring will be added later
      maxScore: totalPossibleScore,
    });

    const savedSubmission = await submission.save();
    
    // Populate the saved submission with related data for response
    const populatedSubmission = await Submission.findById(savedSubmission._id)
      .populate("answer")
      .populate("test", "event school year")
      .populate({
        path: "team",
        select: "name schoolYear students",
        populate: {
          path: "students",
          select: "firstName lastName email"
        }
      })
      .populate("user", "firstName lastName email")
      .populate("users", "firstName lastName email");

    response.status(201).json(populatedSubmission);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to create submission');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/submissions/team/:teamId - Get all submissions for a team with ownership validation
 * Team members can view their team's submissions, admins can view any team's submissions
 */
submissionsRouter.get("/team/:teamId", userExtractor, async (request, response) => {
  // Ensure user is authenticated
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const { teamId } = request.params;

  // Validate ObjectId format
  if (!isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid team ID format', 400, 'INVALID_ID'));
  }

  try {
    // Verify team exists and user has access
    const team = await Team.findById(teamId).populate('students');
    if (!team) {
      return response.status(404).json(createErrorResponse('Team not found', 404, 'TEAM_NOT_FOUND'));
    }

    // Check ownership - user must be team member or admin
    if (!request.user.admin) {
      const isMember = team.students.some(student => student.id === request.user.id);
      if (!isMember) {
        return response.status(403).json(createErrorResponse('User is not a member of this team', 403, 'FORBIDDEN'));
      }
    }

    const teamSubmissions = await Submission.find({ team: teamId })
      .populate("answer")
      .populate("test", "event school year random")
      .populate({
        path: "team",
        select: "name schoolYear students",
        populate: {
          path: "students",
          select: "firstName lastName email"
        }
      })
      .populate("user", "firstName lastName email")
      .populate("users", "firstName lastName email")
      .sort({ submittedAt: -1 }); // Most recent submissions first

    response.json(teamSubmissions);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve team submissions');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/submissions/check/:testId/:teamId - Check if submission exists for test/team combination
 * Returns submission status to prevent duplicate submissions
 */
submissionsRouter.get("/check/:testId/:teamId", userExtractor, async (request, response) => {
  // Ensure user is authenticated
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const { testId, teamId } = request.params;

  // Validate ObjectId formats
  if (!isValidObjectId(testId) || !isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid ID format', 400, 'INVALID_ID'));
  }

  try {
    const existingSubmission = await Submission.findOne({
      test: testId,
      team: teamId,
    });

    response.json({ submitted: !!existingSubmission, submission: existingSubmission });
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to check submission status');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * PUT /api/submissions/:id - Update submission for self-grading with ownership validation
 * Allows users to update their own submissions with self-graded scores
 */
submissionsRouter.put("/:id", userExtractor, checkResourceOwnership(getSubmissionOwner), async (request, response) => {
  // Validate ObjectId format
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid submission ID format', 400, 'INVALID_ID'));
  }

  // Sanitize input data
  const sanitizedBody = sanitizeInput(request.body);
  const { selfGradedScores, totalScore, maxScore, graded } = sanitizedBody;

  try {
    const submission = await Submission.findById(request.params.id);
    
    if (!submission) {
      return response.status(404).json(createErrorResponse('Submission not found', 404, 'NOT_FOUND'));
    }

    // Update submission fields with validated data
    if (selfGradedScores !== undefined) submission.selfGradedScores = selfGradedScores;
    if (totalScore !== undefined) submission.totalScore = totalScore;
    if (maxScore !== undefined) submission.maxScore = maxScore;
    if (graded !== undefined) submission.graded = graded;

    const updatedSubmission = await submission.save();
    
    // Populate the updated submission with related data for response
    const populatedSubmission = await Submission.findById(updatedSubmission._id)
      .populate("answer")
      .populate({
        path: "test",
        populate: {
          path: "questions",
          model: "Question"
        }
      })
      .populate({
        path: "team",
        select: "name schoolYear students",
        populate: {
          path: "students",
          select: "firstName lastName email"
        }
      })
      .populate("user", "firstName lastName email")
      .populate("users", "firstName lastName email");

    response.json(populatedSubmission);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to update submission');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/submissions/user/:userId - Get submissions for a specific user across all teams
 * Users can only access their own submissions unless they are admin
 */
submissionsRouter.get("/user/:userId", userExtractor, async (request, response) => {
  // Ensure user is authenticated
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const { userId } = request.params;

  // Validate ObjectId format
  if (!isValidObjectId(userId)) {
    return response.status(400).json(createErrorResponse('Invalid user ID format', 400, 'INVALID_ID'));
  }

  // Users can only access their own submissions unless they're admin
  if (request.user.id !== userId && !request.user.admin) {
    return response.status(403).json(createErrorResponse('Not authorized to view other user submissions', 403, 'FORBIDDEN'));
  }

  try {
    const userSubmissions = await Submission.find({ users: userId })
      .populate("answer")
      .populate("test", "event school year random")
      .populate({
        path: "team",
        select: "name schoolYear students",
        populate: {
          path: "students",
          select: "firstName lastName email"
        }
      })
      .populate("user", "firstName lastName email")
      .populate("users", "firstName lastName email")
      .sort({ submittedAt: -1 }); // Most recent submissions first

    response.json(userSubmissions);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve user submissions');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

module.exports = submissionsRouter;
