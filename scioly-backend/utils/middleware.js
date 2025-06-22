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

module.exports = { tokenExtractor, userExtractor };
