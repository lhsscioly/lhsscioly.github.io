const teamsRouter = require("express").Router();
const Team = require("../models/team");
const User = require("../models/user");
const { userExtractor } = require("../utils/middleware");

teamsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const teams = await Team.find({}).populate("students");
  return response.json(teams);
});

teamsRouter.get("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const team = await Team.findOne({ _id: id }).populate("students");
  if (team) {
    return response.json(team);
  } else {
    return response.status(404).json({ error: "team not found" });
  }
});

teamsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }
  const { event, name, students, schoolYear } = request.body;

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
