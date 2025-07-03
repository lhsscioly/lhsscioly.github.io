const express = require("express");
const mongoose = require("mongoose");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const eventsRouter = require("./controllers/events");
const questionsRouter = require("./controllers/questions");
const testsRouter = require("./controllers/tests");
const teamsRouter = require("./controllers/teams");

const app = express();

logger.info("connecting to", config.MONGODB_URI);

const mongoUrl = config.MONGODB_URI;
mongoose
  .connect(mongoUrl)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error.message);
  });

app.use(express.json());
app.use(middleware.tokenExtractor);
app.use(static("dist"))
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use("/api/events", eventsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/tests", testsRouter);
app.use("/api/teams", teamsRouter);

module.exports = app;
