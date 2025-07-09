const questionsRouter = require("express").Router();
const Question = require("../models/question");
const { userExtractor } = require("../utils/middleware");

questionsRouter.get("/", userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const questions = await Question.find({});
  return response.json(questions);
});

questionsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }
  const {
    event,
    school,
    year,
    type,
    question,
    points,
    choices,
    answer,
    imageUrl,
  } = request.body;

  try {
    const questionObject = new Question({
      event,
      school,
      year,
      type,
      question,
      points,
      choices,
      answer,
      imageUrl,
    });

    const savedQuestion = await questionObject.save();

    return response.status(201).json(savedQuestion);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

questionsRouter.put("/:id", userExtractor, async (request, response) => {
  const id = request.params.id;

  const {
    event,
    school,
    year,
    type,
    question,
    points,
    choices,
    answer,
    imageUrl,
  } = request.body;

  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const questionObject = await Question.findOne({ _id: id });
  if (!questionObject) {
    return response.status(404).json({ error: "question not found" });
  }

  questionObject.event = event;
  questionObject.school = school;
  questionObject.year = year;
  questionObject.type = type;
  questionObject.question = question;
  questionObject.points = points;
  questionObject.choices = choices;
  questionObject.answer = answer;
  questionObject.imageUrl = imageUrl;

  const savedQuestion = await questionObject.save();
  return response.status(201).json(savedQuestion);
});

module.exports = questionsRouter;
