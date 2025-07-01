const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
  event: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

teamSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
