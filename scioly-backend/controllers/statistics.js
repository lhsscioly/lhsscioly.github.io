const statisticsRouter = require("express").Router();
const Submission = require("../models/submission");
const User = require("../models/user");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, sanitizeInput } = require("../utils/security");

statisticsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  try {
    const schoolYears = await Submission.distinct("schoolYear");
    
    const sanitizedQuery = sanitizeInput(request.query);
    const requestedYear = sanitizedQuery.schoolYear || schoolYears.sort().reverse()[0];
    
    if (!requestedYear) {
      return response.json({
        availableSchoolYears: [],
        selectedSchoolYear: null,
        eventStatistics: []
      });
    }

    const submissions = await Submission.find({
      schoolYear: requestedYear,
      graded: true,
      maxScore: { $gt: 0 }
    }).populate("test", "event")
      .populate("users", "firstName lastName");

    const eventStats = {};
    
    submissions.forEach(submission => {
      const event = submission.test.event;
      const percentage = (submission.totalScore / submission.maxScore) * 100;
      
      if (!eventStats[event]) {
        eventStats[event] = {
          event,
          totalSubmissions: 0,
          totalPercentage: 0,
          scores: []
        };
      }
      
      eventStats[event].totalSubmissions++;
      eventStats[event].totalPercentage += percentage;
      eventStats[event].scores.push(percentage);
    });

    const eventStatistics = Object.values(eventStats).map(stat => ({
      event: stat.event,
      averagePercentage: Math.round((stat.totalPercentage / stat.totalSubmissions) * 100) / 100,
      totalSubmissions: stat.totalSubmissions,
      highestScore: Math.round(Math.max(...stat.scores) * 100) / 100,
      lowestScore: Math.round(Math.min(...stat.scores) * 100) / 100
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    return response.json({
      availableSchoolYears: schoolYears.sort().reverse(),
      selectedSchoolYear: requestedYear,
      eventStatistics
    });
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve statistics');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

statisticsRouter.get("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  const { id } = request.params;

  try {
    const student = await User.findById(id);
    if (!student) {
      return response.status(404).json({ error: "student not found" });
    }

    const submissions = await Submission.find({
      users: id,
      graded: true,
      maxScore: { $gt: 0 }
    }).populate("test", "event")
      .populate("team", "name schoolYear")
      .sort({ submittedAt: -1 });

    if (submissions.length === 0) {
      return response.json({
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
        },
        eventStatistics: [],
        schoolYearStatistics: [],
        bestPerformingEvent: null,
        totalTests: 0
      });
    }

    const eventGroups = {};
    const schoolYearGroups = {};
    
    submissions.forEach(submission => {
      const event = submission.test.event;
      const schoolYear = submission.schoolYear;
      const percentage = (submission.totalScore / submission.maxScore) * 100;

      if (!eventGroups[event]) {
        eventGroups[event] = {
          event,
          submissions: [],
          totalScore: 0,
          count: 0
        };
      }
      
      eventGroups[event].submissions.push({
        id: submission.id,
        percentage: Math.round(percentage * 100) / 100,
        totalScore: submission.totalScore,
        maxScore: submission.maxScore,
        submittedAt: submission.submittedAt,
        teamName: submission.team?.name || "Unknown Team",
        schoolYear: submission.schoolYear
      });
      eventGroups[event].totalScore += percentage;
      eventGroups[event].count++;
      
      if (!schoolYearGroups[schoolYear]) {
        schoolYearGroups[schoolYear] = {
          schoolYear,
          events: {},
          totalTests: 0
        };
      }
      
      if (!schoolYearGroups[schoolYear].events[event]) {
        schoolYearGroups[schoolYear].events[event] = {
          event,
          tests: 0,
          totalPercentage: 0
        };
      }
      
      schoolYearGroups[schoolYear].events[event].tests++;
      schoolYearGroups[schoolYear].events[event].totalPercentage += percentage;
      schoolYearGroups[schoolYear].totalTests++;
    });

    const eventStatistics = Object.values(eventGroups).map(group => {
      const sortedSubmissions = group.submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      
      return {
        event: group.event,
        averagePercentage: Math.round((group.totalScore / group.count) * 100) / 100,
        mostRecentScore: sortedSubmissions[0].percentage,
        mostRecentTest: {
          id: sortedSubmissions[0].id,
          submittedAt: sortedSubmissions[0].submittedAt,
          teamName: sortedSubmissions[0].teamName,
          schoolYear: sortedSubmissions[0].schoolYear
        },
        totalTests: group.count,
        highestScore: Math.round(Math.max(...group.submissions.map(s => s.percentage)) * 100) / 100,
        allSubmissions: sortedSubmissions
      };
    }).sort((a, b) => b.averagePercentage - a.averagePercentage);

    const schoolYearStatistics = Object.values(schoolYearGroups).map(group => ({
      schoolYear: group.schoolYear,
      totalTests: group.totalTests,
      events: Object.values(group.events).map(event => ({
        event: event.event,
        tests: event.tests,
        averagePercentage: Math.round((event.totalPercentage / event.tests) * 100) / 100
      })).sort((a, b) => b.averagePercentage - a.averagePercentage)
    })).sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));

    const bestPerformingEvent = eventStatistics.length > 0 ? {
      event: eventStatistics[0].event,
      averagePercentage: eventStatistics[0].averagePercentage,
      totalTests: eventStatistics[0].totalTests
    } : null;

    return response.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      eventStatistics,
      schoolYearStatistics,
      bestPerformingEvent,
      totalTests: submissions.length
    });
  } catch (error) {
    console.error("Error getting student statistics:", error);
    return response.status(500).json({ error: "internal server error" });
  }
});

module.exports = statisticsRouter;
