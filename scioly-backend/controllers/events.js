const Event = require("../models/event");
const eventsRouter = require("express").Router();
const { userExtractor } = require("../utils/middleware");

eventsRouter.get("/", async (request, response) => {
  const events = await Event.find({});
  return response.json(events);
});

eventsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }
  const { name, group, block, description, resources } = request.body;
  const eventObject = new Event({
    name,
    group,
    block,
    description,
    resources,
  });

  try {
    const savedEvent = await eventObject.save();
    return response.status(201).json(savedEvent);
  } catch (error) {
    if (
      error.name === "MongoServerError" &&
      error.message.includes("E11000 duplicate key error")
    ) {
      return response
        .status(400)
        .json({ error: "expected `event name` to be unique" });
    }
    return response.status(400).json({ error: error.message });
  }
});

eventsRouter.put("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }
  const { name, group, block, description, resources } = request.body;
  const id = request.params.id;
  const eventObject = await Event.findOne({ _id: id });
  eventObject.name = name;
  eventObject.group = group;
  eventObject.block = block;
  eventObject.description = description;
  eventObject.resources = resources;

  try {
    const updatedEvent = await eventObject.save();
    return response.status(201).json(updatedEvent);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

eventsRouter.delete("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.admin) {
    return response.status(401).json({ error: "unauthorized" });
  }

  const id = request.params.id;
  try {
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return response.status(404).json({ error: "event not found" });
    }

    return response.status(204).end();
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

module.exports = eventsRouter;
