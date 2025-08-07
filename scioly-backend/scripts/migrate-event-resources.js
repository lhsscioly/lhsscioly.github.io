#!/usr/bin/env node

/**
 * Migration script to convert event resources from string arrays to object arrays
 * with name and url properties.
 * 
 * Usage: node scripts/migrate-event-resources.js
 */

const mongoose = require("mongoose");
require("../utils/config");

const Event = require("../models/event");

const migrateEventResources = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scioly");
    console.log("Connected successfully");

    console.log("Finding events with string-based resources...");
    const events = await Event.find({});
    
    let migrationCount = 0;
    
    for (const event of events) {
      let needsUpdate = false;
      const newResources = [];
      
      if (event.resources && Array.isArray(event.resources)) {
        for (const resource of event.resources) {
          if (typeof resource === 'string') {
            // Convert string to object format
            newResources.push({
              name: resource.length > 50 ? resource.substring(0, 50) + "..." : resource,
              url: resource
            });
            needsUpdate = true;
          } else if (resource && typeof resource === 'object' && resource.name && resource.url) {
            // Already in new format
            newResources.push(resource);
          }
        }
      }
      
      if (needsUpdate) {
        await Event.findByIdAndUpdate(event._id, { resources: newResources });
        console.log(`Migrated resources for event: ${event.name}`);
        migrationCount++;
      }
    }
    
    console.log(`\nMigration completed successfully!`);
    console.log(`Total events migrated: ${migrationCount}`);
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the migration
if (require.main === module) {
  migrateEventResources();
}

module.exports = migrateEventResources;
