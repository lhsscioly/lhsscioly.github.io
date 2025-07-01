const mongoose = require("mongoose");

const testSchema = mongoose.Schema({
  event: {
    type: String,
    required: true,
  },
  random: {
    type: Boolean,
    required: true,
  },
  school: {
    type: String,
  },
  year: {
    type: Number,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  assignees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  ],
});

testSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Test = mongoose.model("Test", testSchema);

module.exports = Test;
