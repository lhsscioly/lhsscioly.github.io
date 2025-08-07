const mongoose = require("mongoose");
const Event = require("../models/event");
const { MONGODB_URI } = require("../utils/config");

const migrateEventResources = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all events with string-based resources
    const events = await Event.find({});
    console.log(`Found ${events.length} events`);

    let migratedCount = 0;
    
    for (const event of events) {
      let needsUpdate = false;
      const migratedResources = [];

      if (event.resources && Array.isArray(event.resources)) {
        for (const resource of event.resources) {
          if (typeof resource === 'string') {
            // Convert string URL to object format
            migratedResources.push({
              name: extractNameFromUrl(resource),
              url: resource
            });
            needsUpdate = true;
          } else if (resource && typeof resource === 'object' && resource.name && resource.url) {
            // Keep existing object format
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

// Helper function to extract a readable name from URL
function extractNameFromUrl(url) {
  try {
    // Try to extract domain name or filename
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // If it's a common domain, use the domain name
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
    
    // Try to get filename from path
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      // Remove file extension and clean up
      const name = filename.split('.')[0].replace(/[-_]/g, ' ');
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    // Fall back to hostname
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch (error) {
    // If URL parsing fails, use a generic name with part of the URL
    const shortened = url.length > 30 ? url.substring(0, 30) + '...' : url;
    return `Resource (${shortened})`;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateEventResources();
}

module.exports = migrateEventResources;
