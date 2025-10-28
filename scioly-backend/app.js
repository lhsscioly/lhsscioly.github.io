const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const config = require("./utils/config");
const logger = require("./utils/logger");
const middleware = require("./utils/middleware");
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const eventsRouter = require("./controllers/events");
const questionsRouter = require("./controllers/questions");
const testsRouter = require("./controllers/tests");
const teamsRouter = require("./controllers/teams");
const answersRouter = require("./controllers/answers");
const submissionsRouter = require("./controllers/submissions");
const statisticsRouter = require("./controllers/statistics");

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

// Uses CORS to only allow requests from the official domain
app.use(cors({
  origin: ['https://lhsscioly.github.io'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(middleware.tokenExtractor);
//app.use(express.static("dist"));
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use("/api/events", eventsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/tests", testsRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/answers", answersRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/statistics", statisticsRouter);

/*
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});
*/

module.exports = app;
