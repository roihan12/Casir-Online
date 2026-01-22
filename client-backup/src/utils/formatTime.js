/**
 * Formats a date string or Date object to display time in 24-hour format (HH:MM)
 * @param {string|Date} dateString - The date to extract time from
 * @returns {string} Formatted time string
 */
const formatTime = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "-";
  }
};

export default formatTime;
