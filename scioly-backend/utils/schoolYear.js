/**
 * Calculate the current school year based on the date
 * School year runs from August to May
 * New school year starts after June (July/August)
 * @param {Date} date - The date to calculate school year for (defaults to current date)
 * @returns {string} - School year in format "YYYY-YYYY"
 */
function getCurrentSchoolYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11 (0 = January)
  
  // If it's July (6) or later, we're in the new school year
  // Otherwise, we're still in the previous school year
  if (month >= 6) { // July (6) or later
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

module.exports = {
  getCurrentSchoolYear
};
