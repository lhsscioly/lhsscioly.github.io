const mongoose = require("mongoose");
const Event = require("../models/event");
const { MONGODB_URI } = require("../utils/config");

// Helped move event resources into new format during testing

const migrateEventResources = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const events = await Event.find({});
    console.log(`Found ${events.length} events`);

    let migratedCount = 0;
    
    for (const event of events) {
      let needsUpdate = false;
      const migratedResources = [];

      if (event.resources && Array.isArray(event.resources)) {
        for (const resource of event.resources) {
          if (typeof resource === 'string') {
            migratedResources.push({
              name: extractNameFromUrl(resource),
              url: resource
            });
            needsUpdate = true;
          } else if (resource && typeof resource === 'object' && resource.name && resource.url) {
            migratedResources.push(resource);
          }
        }
      }

      if (needsUpdate) {
        event.resources = migratedResources;
        await event.save();
        migratedCount++;
        console.log(`Migrated event: ${event.name} (${migratedResources.length} resources)`);
      }
    }

    console.log(`Migration completed. Migrated ${migratedCount} events.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
};

function extractNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'YouTube Video';
    } else if (hostname.includes('docs.google.com')) {
      return 'Google Docs';
    } else if (hostname.includes('drive.google.com')) {
      return 'Google Drive';
    } else if (hostname.includes('wikipedia.org')) {
      return 'Wikipedia';
    } else if (hostname.includes('.edu')) {
      return 'Educational Resource';
    } else if (hostname.includes('.gov')) {
      return 'Government Resource';
    }
    
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      const name = filename.split('.')[0].replace(/[-_]/g, ' ');
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch (error) {
    const shortened = url.length > 30 ? url.substring(0, 30) + '...' : url;
    return `Resource (${shortened})`;
  }
}

if (require.main === module) {
  migrateEventResources();
}

module.exports = migrateEventResources;
