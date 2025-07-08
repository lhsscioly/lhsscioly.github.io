const mongoose = require("mongoose");

const answerSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  timeLeft: {
    type: Number,
    default: 0,
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  drawings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  answerTimestamps: {
    type: Map,
    of: Date,
    default: {},
  },
  drawingTimestamps: {
    type: Map,
    of: Date,
    default: {},
  },
});

answerSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;

    if (returnedObject.answers instanceof Map) {
      returnedObject.answers = Object.fromEntries(returnedObject.answers);
    }
    
    if (returnedObject.drawings instanceof Map) {
      returnedObject.drawings = Object.fromEntries(returnedObject.drawings);
    }
    
    if (returnedObject.answerTimestamps instanceof Map) {
      returnedObject.answerTimestamps = Object.fromEntries(returnedObject.answerTimestamps);
    }
    
    if (returnedObject.drawingTimestamps instanceof Map) {
      returnedObject.drawingTimestamps = Object.fromEntries(returnedObject.drawingTimestamps);
    }
  },
});

const Answer = mongoose.model("Answer", answerSchema);

module.exports = Answer;
