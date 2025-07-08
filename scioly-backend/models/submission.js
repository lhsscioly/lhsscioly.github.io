const mongoose = require("mongoose");

const submissionSchema = mongoose.Schema({
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Answer",
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  finalTimeLeft: {
    type: Number,
    default: 0,
  },
  graded: { 
    type: Boolean, 
    default: false 
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  maxScore: {
    type: Number,
    default: 0,
  },
});

submissionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
