const mongoose = require('mongoose');

// Input sanitization to prevent NoSQL injection
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential NoSQL injection operators
    return input.replace(/[${}]/g, '');
  } else if (typeof input === 'object' && input !== null) {
    // Recursively sanitize objects
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Standardized error response format
const createErrorResponse = (message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  return {
    error: {
      message,
      code,
      statusCode
    }
  };
};

// Safe error handler that doesn't expose internal details
const handleError = (error, customMessage = null) => {
  console.error('Error occurred:', error);
  
  // Handle specific known errors
  if (error.name === 'ValidationError') {
    return createErrorResponse('Invalid data provided', 400, 'VALIDATION_ERROR');
  }
  
  if (error.name === 'CastError') {
    return createErrorResponse('Invalid ID format', 400, 'INVALID_ID');
  }
  
  if (error.name === 'MongoServerError' && error.code === 11000) {
    return createErrorResponse('Resource already exists', 409, 'DUPLICATE_RESOURCE');
  }
  
  if (error.name === 'JsonWebTokenError') {
    return createErrorResponse('Invalid token', 401, 'INVALID_TOKEN');
  }
  
  if (error.name === 'TokenExpiredError') {
    return createErrorResponse('Token expired', 401, 'TOKEN_EXPIRED');
  }
  
  // Default to generic error message for security
  return createErrorResponse(
    customMessage || 'An error occurred while processing your request',
    500,
    'INTERNAL_ERROR'
  );
};

// Middleware to check resource ownership
const checkResourceOwnership = (getResourceOwner) => {
  return async (request, response, next) => {
    try {
      if (!request.user) {
        return response.status(401).json(createErrorResponse('Authentication required', 401, 'UNAUTHORIZED'));
      }
      
      const resourceId = request.params.id;
      if (!isValidObjectId(resourceId)) {
        return response.status(400).json(createErrorResponse('Invalid resource ID', 400, 'INVALID_ID'));
      }
      
      const resourceOwner = await getResourceOwner(resourceId, request.user);
      
      if (!resourceOwner) {
        return response.status(404).json(createErrorResponse('Resource not found', 404, 'NOT_FOUND'));
      }
      
      if (resourceOwner !== request.user.id && !request.user.admin) {
        return response.status(403).json(createErrorResponse('Access denied', 403, 'FORBIDDEN'));
      }
      
      next();
    } catch (error) {
      const errorResponse = handleError(error);
      return response.status(errorResponse.error.statusCode).json(errorResponse);
    }
  };
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Strict rate limiting for auth endpoints
const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  sanitizeInput,
  isValidObjectId,
  createErrorResponse,
  handleError,
  checkResourceOwnership,
  rateLimitConfig,
  authRateLimitConfig
};
