const mongoose = require("mongoose");

const submissionSchema = mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  submittedAt: Date,
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      response: String,
      correct: Boolean,
      pointsEarned: Number,
    },
  ],
  graded: { type: Boolean, default: false },
  totalScore: Number,
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
