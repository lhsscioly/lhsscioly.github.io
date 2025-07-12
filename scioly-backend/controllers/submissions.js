const submissionsRouter = require("express").Router();
const Submission = require("../models/submission");
const Answer = require("../models/answer");
const Test = require("../models/test");
const Team = require("../models/team");
const User = require("../models/user");
const { userExtractor } = require("../utils/middleware");

// Helper function to calculate MCQ score
const calculateMCQScore = (test, userAnswers) => {
  if (!test.questions || !userAnswers) return { score: 0, total: 0 };
  
  const mcqQuestions = test.questions.filter(q => q.type === 'mcq');
  let correctCount = 0;
  let totalPoints = 0;
  
  mcqQuestions.forEach(question => {
    totalPoints += question.points || 1;
    const userAnswer = userAnswers.get ? userAnswers.get(question._id.toString()) : userAnswers[question._id.toString()];
    const correctAnswer = question.answer;
    
    if (correctAnswer && correctAnswer.includes(", ")) {
      // Multiple choice
      const correctAnswers = correctAnswer.split(", ").map(a => a.trim()).sort();
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer.sort() : [];
      if (JSON.stringify(correctAnswers) === JSON.stringify(userAnswerArray)) {
        correctCount += question.points || 1;
      }
    } else {
      // Single choice
      if (userAnswer === correctAnswer) {
        correctCount += question.points || 1;
      }
    }
  });
  
  return { score: correctCount, total: totalPoints };
};

// Helper function to calculate total possible score
const calculateTotalPossibleScore = (test) => {
  if (!test.questions) return 0;
  
  return test.questions.reduce((total, question) => {
    return total + (question.points || 1);
  }, 0);
};

// GET /api/submissions - Get all submissions
submissionsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
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

    // Get the test with questions to calculate MCQ score
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return response.status(404).json({ error: "test not found" });
    }

    // Get the team to access students list and schoolYear
    const team = await Team.findById(teamId).populate('students');
    if (!team) {
      return response.status(404).json({ error: "team not found" });
    }

    console.log('Team data:', {
      id: team.id,
      name: team.name,
      schoolYear: team.schoolYear,
      students: team.students?.length
    });

    // Calculate MCQ score automatically
    const mcqScore = calculateMCQScore(test, answers.answers);
    const totalPossibleScore = calculateTotalPossibleScore(test);

    // Ensure schoolYear is set - use team's schoolYear or current school year as fallback
    const { getCurrentSchoolYear } = require("../utils/schoolYear");
    const submissionSchoolYear = team.schoolYear || getCurrentSchoolYear();

    // Create submission with MCQ score
    const submission = new Submission({
      answer: answers._id,
      test: testId,
      team: teamId,
      user: request.user.id,
      users: team.students, // All team members who took the test
      schoolYear: submissionSchoolYear, // School year from team with fallback
      finalTimeLeft,
      totalScore: mcqScore.score, // Start with MCQ score, SAQ/LEQ will be added later
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
    console.error("Error creating submission:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// GET /api/submissions/team/:teamId - Get all submissions for a team
submissionsRouter.get("/team/:teamId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { teamId } = request.params;

  try {
    const submissions = await Submission.find({ team: teamId })
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
      .sort({ submittedAt: -1 }); // Most recent first

    response.json(submissions);
  } catch (error) {
    console.error("Error getting team submissions:", error);
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

// PUT /api/submissions/:id - Update submission (for self-grading)
submissionsRouter.put("/:id", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { id } = request.params;
  const { selfGradedScores, totalScore, maxScore, graded } = request.body;

  try {
    const submission = await Submission.findById(id);
    
    if (!submission) {
      return response.status(404).json({ error: "submission not found" });
    }

    // Update submission fields
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
    console.error("Error updating submission:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

// GET /api/submissions/user/:userId - Get submissions for a specific user across all teams
submissionsRouter.get("/user/:userId", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { userId } = request.params;

  // Users can only access their own submissions unless they're admin
  if (request.user.id !== userId && !request.user.admin) {
    return response.status(403).json({ error: "not authorized to view other user's submissions" });
  }

  try {
    const submissions = await Submission.find({ users: userId })
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
      .sort({ submittedAt: -1 }); // Most recent first

    response.json(submissions);
  } catch (error) {
    console.error("Error getting user submissions:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

module.exports = submissionsRouter;
