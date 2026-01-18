const productMasterDashboard = require("../services/productMasterDashboard");

const getProductDashboardStats = async (req, res, next) => {
  try {
    const dashboardStats = await productMasterDashboard.getProductDashboardStats();
    
    res.status(200).json({
      status: true,
      message: "Successfully get product dashboard stats",
      data: dashboardStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductDashboardStats
};