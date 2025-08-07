const teamsRouter = require("express").Router();
const Team = require("../models/team");
const User = require("../models/user");
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, sanitizeInput, checkResourceOwnership } = require("../utils/security");

/**
 * Helper function to determine team ownership for resource validation
 * Used by checkResourceOwnership middleware to verify access rights
 * @param {string} teamId - The ID of the team to check
 * @param {Object} user - The current user object
 * @returns {Promise<boolean>} True if user has access to the team
 */
const getTeamOwner = async (teamId, user) => {
  try {
    const team = await Team.findById(teamId).populate('students', '_id');
    
    if (!team) {
      return false;
    }

    // Admin users can access any team
    if (user.admin) {
      return true;
    }

    // Check if user is a member of the team
    return team.students.some(student => student._id.toString() === user.id);
  } catch (error) {
    console.error("Error checking team ownership:", error);
    return false;
  }
};

/**
 * GET /api/teams - Get all teams (Verified users only)
 * Returns all teams in the system with populated student data
 */
teamsRouter.get("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated and verified
  if (!request.user || !request.user.verified) {
    return response.status(401).json(createErrorResponse('Authentication and email verification required', 401, 'UNAUTHORIZED'));
  }

  try {
    const teams = await Team.find({}).populate("students");
    return response.json(teams);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve teams');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * GET /api/teams/:id - Get specific team by ID with ownership validation
 * Team members can view their own team, admins can view any team
 */
teamsRouter.get("/:id", userExtractor, checkResourceOwnership(getTeamOwner), async (request, response) => {
  // Validate ObjectId format
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid team ID format', 400, 'INVALID_ID'));
  }

  try {
    const team = await Team.findById(request.params.id).populate("students");
    
    if (!team) {
      return response.status(404).json(createErrorResponse('Team not found', 404, 'NOT_FOUND'));
    }
    
    return response.json(team);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve team');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * POST /api/teams - Create new team (Admin only)
 * Creates a new team and updates user records with team membership
 */
teamsRouter.post("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated and is admin
  if (!request.user || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required', 401, 'UNAUTHORIZED'));
  }

  // Sanitize and validate input
  const sanitizedBody = sanitizeInput(request.body);
  const { event, name, students, schoolYear } = sanitizedBody;

  try {
    const teamObject = new Team({
      event,
      name,
      students,
      schoolYear,
    });

    const savedTeam = await teamObject.save();

    savedTeam.students.forEach(async (studentId) => {
      const user = await User.findById(studentId);
      if (user) {
        user.teams.push(savedTeam._id);
        await user.save();
      }
    });

    await savedTeam.populate("students");
    return response.status(201).json(savedTeam);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

teamsRouter.put("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  const { students, schoolYear } = request.body;

  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const team = await Team.findOne({ _id: id });
  if (!team) {
    return response.status(404).json({ error: "team not found" });
  }

  team.students.forEach(async (studentId) => {
    const user = await User.findById(studentId);
    if (user) {
      user.teams = user.teams.filter(
        (teamId) => teamId.toString() !== team._id.toString(),
      );
      await user.save();
    }
  });

  team.students = students;
  if (schoolYear !== undefined) {
    team.schoolYear = schoolYear;
  }

  const savedTeam = await team.save();

  savedTeam.students.forEach(async (studentId) => {
    const user = await User.findById(studentId);
    if (user) {
      user.teams.push(savedTeam._id);
      await user.save();
    }
  });

  await savedTeam.populate("students");
  return response.status(201).json(savedTeam);
});

teamsRouter.delete("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const team = await Team.findOne({ _id: id });
  if (!team) {
    return response.status(404).json({ error: "team not found" });
  }

  team.students.forEach(async (studentId) => {
    const user = await User.findById(studentId);
    if (user) {
      user.teams = user.teams.filter(
        (teamId) => teamId.toString() !== team._id.toString(),
      );
      await user.save();
    }
  });

  await Team.deleteOne({ _id: id });
  return response.status(204).end();
});

module.exports = teamsRouter;
