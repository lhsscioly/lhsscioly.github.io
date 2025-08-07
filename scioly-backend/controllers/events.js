const Event = require("../models/event");
const eventsRouter = require("express").Router();
const { userExtractor } = require("../utils/middleware");
const { handleError, createErrorResponse, isValidObjectId, sanitizeInput } = require("../utils/security");

/**
 * GET /api/events - Get all events with conditional access based on authentication and verification
 * - Unauthenticated users: Get public event data (no resources)
 * - Authenticated but unverified users: Get public event data (no resources) 
 * - Verified users: Get full event data including resources
 */
eventsRouter.get("/", userExtractor, async (request, response) => {
  try {
    const events = await Event.find({});
    
    // If user is authenticated AND verified, return all event data including resources
    if (request.user && request.user.verified) {
      return response.json(events);
    }
    
    // If user is not authenticated OR not verified, return event data without resources
    const publicEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      group: event.group,
      block: event.block,
      description: event.description,
      // resources field omitted for unauthenticated/unverified users
    }));
    
    return response.json(publicEvents);
  } catch (error) {
    const errorResponse = handleError(error, 'Failed to retrieve events');
    return response.status(errorResponse.error.statusCode).json(errorResponse);
  }
});

/**
 * POST /api/events - Create new event (Admin only, must be verified)
 * Creates a new event with proper validation and security checks
 */
eventsRouter.post("/", userExtractor, async (request, response) => {
  // Ensure user is authenticated, verified, and is admin
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  // Sanitize and validate input
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

/**
 * PUT /api/events/:id - Update event (Admin only, must be verified)
 * Updates an existing event with proper validation and security checks
 */
eventsRouter.put("/:id", userExtractor, async (request, response) => {
  // Ensure user is authenticated, verified, and is admin
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  // Validate ObjectId format
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json(createErrorResponse('Invalid event ID format', 400, 'INVALID_ID'));
  }

  // Sanitize and validate input
  const sanitizedBody = sanitizeInput(request.body);
  const { name, group, block, description, resources } = sanitizedBody;

  try {
    const eventObject = await Event.findById(request.params.id);
    
    if (!eventObject) {
      return response.status(404).json(createErrorResponse('Event not found', 404, 'NOT_FOUND'));
    }

    // Update event fields with sanitized data
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

/**
 * DELETE /api/events/:id - Delete event (Admin only, must be verified)
 * Deletes an event with proper validation and security checks
 */
eventsRouter.delete("/:id", userExtractor, async (request, response) => {
  // Ensure user is authenticated, verified, and is admin
  if (!request.user || !request.user.verified || !request.user.admin) {
    return response.status(401).json(createErrorResponse('Admin access required and email must be verified', 401, 'UNAUTHORIZED'));
  }

  // Validate ObjectId format
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
