const Event = require("../models/event");
const eventsRouter = require("express").Router();
const { userExtractor, optionalUserExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, sanitizeInput } = require("../utils/security");

eventsRouter.get("/", optionalUserExtractor, async (request, response) => {
  try {
    const events = await Event.find({});
    
    if (request.user && request.user.verified) {
      return response.json(events);
    }
    
    const publicEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      group: event.group,
      block: event.block,
      description: event.description,
    }));
    
    return response.json(publicEvents);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve events');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

eventsRouter.post("/", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  const sanitizedBody = sanitizeInput(request.body);
  const { name, group, block, description, resources } = sanitizedBody;

  try {
    const eventObject = new Event({
      name,
      group,
      block,
      description,
      resources,
    });

    const savedEvent = await eventObject.save();
    return response.status(201).json(savedEvent);
  } catch (error) {
    if (
      error.name === "MongoServerError" &&
      error.message.includes("E11000 duplicate key error")
    ) {
      return response.status(400).json(createErrorResponse('Event name must be unique', 400, 'DUPLICATE_EVENT_NAME'));
    }
    const errorResponse = handleError(error, 'Failed to create event');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

eventsRouter.put("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid event ID format', 400, 'INVALID_ID'));
  }

  const sanitizedBody = sanitizeInput(request.body);
  const { name, group, block, description, resources } = sanitizedBody;

  try {
    const eventObject = await Event.findById(request.params.id);
    
    if (!eventObject) {
      return response.status(404).json(createErrorResponse('Event not found', 404, 'NOT_FOUND'));
    }

    eventObject.name = name;
    eventObject.group = group;
    eventObject.block = block;
    eventObject.description = description;
    eventObject.resources = resources;

    const updatedEvent = await eventObject.save();
    return response.status(200).json(updatedEvent);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to update event');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

eventsRouter.delete("/:id", userExtractor, async (request, response) => {
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid event ID format', 400, 'INVALID_ID'));
  }

  try {
    const deletedEvent = await Event.findByIdAndDelete(request.params.id);
    
    if (!deletedEvent) {
      return response.status(404).json(createErrorResponse('Event not found', 404, 'NOT_FOUND'));
    }

    return response.status(204).end();
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to delete event');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

module.exports = eventsRouter;
