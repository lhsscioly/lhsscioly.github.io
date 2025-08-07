const jwt = require("jsonwebtoken");
const User = require("../models/user");

const tokenExtractor = (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    request.token = authorization.replace("Bearer ", "");
  } else {
    request.token = null;
  }

  next();
};

const userExtractor = async (request, response, next) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      request.user = null;
      return response.status(401).json({ error: "token invalid" });
    }

    request.user = await User.findById(decodedToken.id);
  } catch (error) {
    return response.status(401).json({ error: "token invalid" });
  }

  next();
};

// Like userExtractor, but does not return 401 if no/invalid token; just sets request.user = null
const optionalUserExtractor = async (request, response, next) => {
  try {
    if (!request.token) {
      request.user = null;
      return next();
    }
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      request.user = null;
      return next();
    }
    request.user = await User.findById(decodedToken.id);
  } catch (error) {
    request.user = null;
  }
  next();
};

module.exports = { tokenExtractor, userExtractor, optionalUserExtractor };
