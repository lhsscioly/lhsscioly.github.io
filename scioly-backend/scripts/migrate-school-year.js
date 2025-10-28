const mongoose = require("mongoose");
const Team = require("../models/team");
const Submission = require("../models/submission");
const { getCurrentSchoolYear } = require("../utils/schoolYear");

// Helped incorporate school years into data during testing

async function migrateSchoolYear() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scioly");
    
    console.log("Starting migration...");
    
    const teamsWithoutSchoolYear = await Team.find({ schoolYear: { $exists: false } });
    console.log(`Found ${teamsWithoutSchoolYear.length} teams without schoolYear`);
    
    for (const team of teamsWithoutSchoolYear) {
      team.schoolYear = getCurrentSchoolYear(); // Calculate current school year automatically
      await team.save();
      console.log(`Updated team: ${team.name}`);
    }
    
    const submissionsToUpdate = await Submission.find({
      $or: [
        { users: { $exists: false } },
        { schoolYear: { $exists: false } }
      ]
    }).populate('team');
    
    console.log(`Found ${submissionsToUpdate.length} submissions to update`);
    
    for (const submission of submissionsToUpdate) {
      if (!submission.users) {
        if (submission.team && submission.team.students) {
          submission.users = submission.team.students;
        } else {
          submission.users = [submission.user];
        }
      }
      
      if (!submission.schoolYear) {
        submission.schoolYear = submission.team?.schoolYear || getCurrentSchoolYear();
      }
      
      await submission.save();
      console.log(`Updated submission: ${submission._id}`);
    }
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migrateSchoolYear();
}

module.exports = migrateSchoolYear;
