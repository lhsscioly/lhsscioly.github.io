const mongoose = require("mongoose");

const questionSchema = mongoose.Schema({
  event: {
    type: String,
    required: true,
  },
  school: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["mcq", "saq", "leq"],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  points: Number,
  choices: [
    {
      type: String,
    },
  ],
  answer: String,
  imageUrl: String,
});

questionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
