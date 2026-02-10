const broadcastService = require("../services/broadcastService");
const { ResponseError } = require("../error/responseError");

const createBroadcast = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, message, segments, scheduleTime } = req.body;

    if (!name || !message) {
        throw new ResponseError(400, "Name and message are required");
    }

    const result = await broadcastService.createBroadcast({
        name,
        message,
        segments,
        scheduleTime
    }, {
        id: user.id || user.userId,
        cabangId: user.cabangId
    });

    res.status(201).json({
        success: true,
        message: "Broadcast created successfully",
        data: result
    });
  } catch (error) {
    next(error);
  }
};

const getBroadcastHistory = async (req, res, next) => {
  try {
    const user = req.user;
    const cabangId = user.cabangId;

    const result = await broadcastService.getBroadcastHistory(cabangId);

    // Format for frontend
    const formatted = result.map(campaign => ({
        id: campaign.id,
        name: campaign.nama,
        status: campaign.status,
        sent: campaign._count?.interactions || 0, // Approximate sent count based on interactions
        success: 0, // Need to aggregate from interactions if detailed stats needed
        failed: 0, 
        createdAt: campaign.createdAt
    }));

    res.status(200).json({
        success: true,
        data: formatted
    });
  } catch (error) {
    next(error);
  }
};

const getSegments = async (req, res, next) => {
    try {
        // Return hardcoded segments for now, or fetch from DB if dynamic
        const segments = [
            { id: 'all', name: 'Semua Pelanggan' },
            { id: 'vip', name: 'Pelanggan VIP' },
            { id: 'grosir', name: 'Pelanggan Grosir' },
            { id: 'retail', name: 'Pelanggan Retail' },
            { id: 'inactive_30d', name: 'Tidak Aktif > 30 Hari' } // Logic to be implemented
        ];

        res.status(200).json({
            success: true,
            data: segments
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  createBroadcast,
  getBroadcastHistory,
  getSegments
};
