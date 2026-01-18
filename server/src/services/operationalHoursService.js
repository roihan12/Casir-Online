const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

const DAYS_OF_WEEK = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

const getOperationalHours = async (cabangId) => {
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
    include: {
      operationalHours: true,
    },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Convert to frontend format
  const hours = {};
  cabang.operationalHours.forEach((hour) => {
    const dayName = Object.keys(DAYS_OF_WEEK).find(
      (key) => DAYS_OF_WEEK[key] === hour.dayOfWeek
    );
    if (dayName) {
      hours[dayName] = {
        buka: hour.isOpen,
        jamBuka: hour.openTime,
        jamTutup: hour.closeTime,
      };
    }
  });

  // Ensure all days are present with default values if missing
  Object.keys(DAYS_OF_WEEK).forEach((day) => {
    if (!hours[day]) {
      hours[day] = {
        buka: true,
        jamBuka: "08:00",
        jamTutup: "21:00",
      };
    }
  });

  return hours;
};

const updateOperationalHours = async (cabangId, hours) => {
  const cabang = await prisma.cabang.findUnique({
    where: { id: cabangId },
  });

  if (!cabang) {
    throw new ResponseError(404, "Cabang tidak ditemukan");
  }

  // Delete existing hours
  await prisma.operationalHours.deleteMany({
    where: { cabangId },
  });

  // Create new hours
  const createPromises = Object.entries(hours).map(([day, config]) => {
    return prisma.operationalHours.create({
      data: {
        cabangId,
        dayOfWeek: DAYS_OF_WEEK[day],
        isOpen: config.buka,
        openTime: config.jamBuka,
        closeTime: config.jamTutup,
      },
    });
  });

  await Promise.all(createPromises);

  return getOperationalHours(cabangId);
};

module.exports = {
  getOperationalHours,
  updateOperationalHours,
};
