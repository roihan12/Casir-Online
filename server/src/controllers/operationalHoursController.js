const operationalHoursService = require("../services/operationalHoursService");
const { ResponseError } = require("../error/responseError");

const getOperationalHours = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const hours = await operationalHoursService.getOperationalHours(cabangId);
    res.status(200).json({
      status: "success",
      data: hours,
    });
  } catch (error) {
    next(error);
  }
};

const updateOperationalHours = async (req, res, next) => {
  try {
    const { cabangId } = req.params;
    const hours = req.body;
    const updatedHours = await operationalHoursService.updateOperationalHours(
      cabangId,
      hours
    );
    res.status(200).json({
      status: "success",
      data: updatedHours,
      message: "Jam operasional berhasil diperbarui",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOperationalHours,
  updateOperationalHours,
};
