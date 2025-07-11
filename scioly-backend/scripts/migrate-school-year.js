const mongoose = require("mongoose");
const Team = require("../models/team");
const Submission = require("../models/submission");
const { getCurrentSchoolYear } = require("../utils/schoolYear");

// Migration script to add schoolYear to existing teams and submissions
// Run this script after updating the schemas

async function migrateSchoolYear() {
  try {
    // Connect to database (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scioly");
    
    console.log("Starting migration...");
    
    // Update teams without schoolYear
    const teamsWithoutSchoolYear = await Team.find({ schoolYear: { $exists: false } });
    console.log(`Found ${teamsWithoutSchoolYear.length} teams without schoolYear`);
    
    for (const team of teamsWithoutSchoolYear) {
      team.schoolYear = getCurrentSchoolYear(); // Calculate current school year automatically
      await team.save();
      console.log(`Updated team: ${team.name}`);
    }
    
    // Update submissions without users array or schoolYear
    const submissionsToUpdate = await Submission.find({
      $or: [
        { users: { $exists: false } },
        { schoolYear: { $exists: false } }
      ]
    }).populate('team');
    
    console.log(`Found ${submissionsToUpdate.length} submissions to update`);
    
    for (const submission of submissionsToUpdate) {
      if (!submission.users) {
        // If team still exists, use its students
        if (submission.team && submission.team.students) {
          submission.users = submission.team.students;
        } else {
          // If team is deleted, keep the user who submitted
          submission.users = [submission.user];
        }
      }
      
      if (!submission.schoolYear) {
        // Use team's school year if available, otherwise calculate current
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

// Run migration if this file is executed directly
if (require.main === module) {
  migrateSchoolYear();
}

module.exports = migrateSchoolYear;
