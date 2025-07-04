const testsRouter = require("express").Router();
const Question = require("../models/question");
const Test = require("../models/test");
const { userExtractor } = require("../utils/middleware");

testsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const tests = await Test.find({}).populate("questions");
  return response.json(tests);
});

testsRouter.get("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const test = await Test.findOne({ _id: id }).populate("questions");
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
    const populatedTest = await Test.findById(savedTest._id).populate("questions");

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
    return response.status(404).json({ error: "question not found" });
  }

  test.assignees = assignees;

  try {
    const savedTest = await test.save();
    const populatedTest = await Test.findById(savedTest._id).populate("questions");

    return response.status(201).json(populatedTest);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

module.exports = testsRouter;
