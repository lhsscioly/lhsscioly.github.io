const testsRouter = require("express").Router();
const Question = require("../models/question");
const Test = require("../models/test");
const Team = require("../models/team");
const Submission = require("../models/submission");
const { userExtractor } = require("../utils/middleware");

testsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const tests = await Test.find({})
    .populate("questions")
    .populate("assignees", "name");
  return response.json(tests);
});

testsRouter.get("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const test = await Test.findOne({ _id: id })
    .populate("questions")
    .populate("assignees", "name");
  if (test) {
    return response.json(test);
  } else {
    return response.status(404).json({ error: "test not found" });
  }
});

testsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const { event, random, school, year, questions } = request.body;

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
    return response.status(400).json({ error: error.message });
  }
});

testsRouter.put("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  const { assignees } = request.body;

  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const test = await Test.findOne({ _id: id });
  if (!test) {
    return response.status(404).json({ error: "test not found" });
  }

  // Check if any of the teams already have submissions for this test
  if (assignees && assignees.length > 0) {
    try {
      const existingSubmissions = await Submission.find({
        team: { $in: assignees },
        test: id,
      }).populate('team', 'name');

      if (existingSubmissions.length > 0) {
        const teamNames = existingSubmissions.map(sub => sub.team.name).join(', ');
        return response.status(409).json({ 
          error: `Team(s) have already submitted tests for event ${test.event}: ${teamNames}` 
        });
      }
    } catch (error) {
      console.error("Error checking existing submissions:", error);
      return response.status(500).json({ error: "internal server error" });
    }
  }

  test.assignees = assignees;

  try {
    const savedTest = await test.save();
    const populatedTest = await Test.findById(savedTest._id)
      .populate("questions")
      .populate("assignees", "name");

    return response.status(201).json(populatedTest);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

module.exports = testsRouter;
