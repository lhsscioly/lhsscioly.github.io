const submissionsRouter = require("express").Router();
const Submission = require("../models/submission");
const { userExtractor } = require("../utils/middleware");

submissionsRouter.get("/", userExtractor, async (request, response) => {});

submissionsRouter.get("/:id", userExtractor, async (request, response) => {});

submissionsRouter.post("/", userExtractor, async (request, response) => {});

submissionsRouter.put("/:id", userExtractor, async (request, response) => {});

module.exports = testsRouter;
