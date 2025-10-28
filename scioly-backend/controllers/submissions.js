const express = require("express");
const Submission = require("../models/submission");
const Answer = require("../models/answer");
const Test = require("../models/test");
const Team = require("../models/team");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, checkResourceOwnership, sanitizeInput } = require("../utils/security");

const submissionsRouter = express.Router();

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

const calculateTotalPossibleScore = (test) => {
  return test.questions.reduce((total, question) => {
    return total + (question.points || 1);
  }, 0);
};

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

    if (user.admin) {
      return true;
    }

    if (submission.user && submission.user.toString() === user.id) {
      return true;
    }

    if (submission.users && submission.users.some(u => u._id.toString() === user.id)) {
      return true;
    }

    if (submission.team && submission.team.students) {
      return submission.team.students.some(student => student._id.toString() === user.id);
    }

    return false;
  } catch (error) {
    console.error("Error checking submission ownership:", error);
    return false;
  }
};

submissionsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

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

submissionsRouter.get("/:id", userExtractor, checkResourceOwnership(getSubmissionOwner), async (request, response) => {
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

submissionsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const sanitizedBody = sanitizeInput(request.body);
  const { testId, teamId, finalTimeLeft = 0 } = sanitizedBody;

  if (!testId || !teamId) {
    return response.status(400).json(createErrorResponse('testId and teamId are required', 400, 'MISSING_REQUIRED_FIELDS'));
  }

  if (!isValidObjectId(testId) || !isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid ID format', 400, 'INVALID_ID'));
  }

  try {
    const answers = await Answer.findOne({
      team: teamId,
      test: testId,
    });

    if (!answers) {
      return response.status(404).json(createErrorResponse('Answers not found - team must take test first', 404, 'ANSWERS_NOT_FOUND'));
    }

    const existingSubmission = await Submission.findOne({
      answer: answers._id,
      test: testId,
      team: teamId,
    });

    if (existingSubmission) {
      return response.status(409).json(createErrorResponse('Submission already exists', 409, 'SUBMISSION_EXISTS'));
    }

    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return response.status(404).json(createErrorResponse('Test not found', 404, 'TEST_NOT_FOUND'));
    }

    const team = await Team.findById(teamId).populate('students');
    if (!team) {
      return response.status(404).json(createErrorResponse('Team not found', 404, 'TEAM_NOT_FOUND'));
    }

    if (!request.user.admin) {
      const isMember = team.students.some(student => student.id === request.user.id);
      if (!isMember) {
        return response.status(403).json(createErrorResponse('User is not a member of this team', 403, 'FORBIDDEN'));
      }
    }

    const mcqScore = calculateMCQScore(test, answers.answers);
    const totalPossibleScore = calculateTotalPossibleScore(test);

    const { getCurrentSchoolYear } = require("../utils/schoolYear");
    const submissionSchoolYear = team.schoolYear || getCurrentSchoolYear();

    const submission = new Submission({
      answer: answers._id,
      test: testId,
      team: teamId,
      user: request.user.id,
      users: team.students,
      schoolYear: submissionSchoolYear,
      finalTimeLeft,
      totalScore: mcqScore.score,
      maxScore: totalPossibleScore,
    });

    const savedSubmission = await submission.save();
    
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

// Gets submissions for a team as opposed to the submission id
submissionsRouter.get("/team/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const { teamId } = request.params;

  if (!isValidObjectId(teamId)) {
    return response.status(400).json(createErrorResponse('Invalid team ID format', 400, 'INVALID_ID'));
  }

  try {
    const team = await Team.findById(teamId).populate('students');
    if (!team) {
      return response.status(404).json(createErrorResponse('Team not found', 404, 'TEAM_NOT_FOUND'));
    }

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
      .sort({ submittedAt: -1 });

    response.json(teamSubmissions);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve team submissions');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

// Checks for existing submissions given a test and a team
submissionsRouter.get("/check/:testId/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const { testId, teamId } = request.params;

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

submissionsRouter.put("/:id", userExtractor, checkResourceOwnership(getSubmissionOwner), async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid submission ID format', 400, 'INVALID_ID'));
  }

  const sanitizedBody = sanitizeInput(request.body);
  const { selfGradedScores, totalScore, maxScore, graded } = sanitizedBody;

  try {
    const submission = await Submission.findById(request.params.id);
    
    if (!submission) {
      return response.status(404).json(createErrorResponse('Submission not found', 404, 'NOT_FOUND'));
    }

    if (selfGradedScores !== undefined) submission.selfGradedScores = selfGradedScores;
    if (totalScore !== undefined) submission.totalScore = totalScore;
    if (maxScore !== undefined) submission.maxScore = maxScore;
    if (graded !== undefined) submission.graded = graded;

    const updatedSubmission = await submission.save();
    
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

// Similar to getting submissions for team, but instead by user
submissionsRouter.get("/user/:userId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const { userId } = request.params;

  if (!isValidObjectId(userId)) {
    return response.status(400).json(createErrorResponse('Invalid user ID format', 400, 'INVALID_ID'));
  }

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
      .sort({ submittedAt: -1 });

    response.json(userSubmissions);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve user submissions');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

module.exports = submissionsRouter;
