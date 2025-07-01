const teamsRouter = require("express").Router();
const Team = require("../models/team");
const { userExtractor } = require("../utils/middleware");

teamsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const teams = await Team.find({}).populate();
  return response.json(teams);
});

teamsRouter.get("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const team = await Team.findOne({ _id: id }).populate();
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
  const { event, name, students } = request.body;

  try {
    const teamObject = new Team({
      event,
      name,
      students,
    });

    const savedTeam = await teamObject.save();

    return response.status(201).json(savedTeam);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

teamsRouter.put("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  const { students } = request.body;

  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const team = await Team.findOne({ _id: id });
  if (!team) {
    return response.status(404).json({ error: "team not found" });
  }

  team.students = students;

  const savedTeam = await team.save();
  return response.status(201).json(savedTeam);
});

module.exports = questionsRouter;
