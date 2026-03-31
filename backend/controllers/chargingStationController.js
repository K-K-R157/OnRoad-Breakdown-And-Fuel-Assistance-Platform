const ChargingStation = require("../models/ChargingStation");
const ChargingRequest = require("../models/ChargingRequest");
const { emitRequestStatusUpdate } = require("../utils/socketEvents");

exports.getNearbyChargingStations = async (req, res) => {
  try {
    const longitude = Number(req.query.longitude);
    const latitude = Number(req.query.latitude);

    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid longitude and latitude are required",
      });
    }

    const stations = await ChargingStation.findNearby(
      longitude,
      latitude,
      Number(req.query.maxDistance) || 25000,
      {
        vehicleType: req.query.vehicleType,
        connectorType: req.query.connectorType,
        mobileOnly: req.query.mobileOnly === "true",
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      },
    );

    res
      .status(200)
      .json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getChargingStationProfile = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

exports.updateChargingStationProfile = async (req, res) => {
  try {
    const allowed = [
      "stationName",
      "ownerName",
      "phone",
      "address",
      "location",
      "openingHours",
      "mobileChargingAvailable",
      "serviceRadius",
      "serviceCharges",
      "estimatedResponseTime",
      "stationImages",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const station = await ChargingStation.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateChargingTypes = async (req, res) => {
  try {
    const { chargingTypes } = req.body;
    if (!Array.isArray(chargingTypes) || chargingTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "chargingTypes must be a non-empty array",
      });
    }

    const station = await ChargingStation.findByIdAndUpdate(
      req.user._id,
      { chargingTypes },
      { new: true, runValidators: true },
    );

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getChargingStationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { chargingStation: req.user._id };
    if (status) filter.status = status;

    const requests = await ChargingRequest.find(filter)
      .populate("user", "name phone profilePicture")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateChargingRequestStatus = async (req, res) => {
  try {
    const {
      status,
      technician,
      chargingDetails,
      cancellationReason,
      estimatedArrivalTime,
    } = req.body;

    const request = await ChargingRequest.findOne({
      _id: req.params.id,
      chargingStation: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (status === "cancelled") {
      await request.cancelRequest(
        cancellationReason || "Cancelled by charging station",
        "chargingStation",
      );
    } else {
      await request.updateStatus(status, {
        technician,
        chargingDetails,
        estimatedArrivalTime,
      });
    }

    // Emit real-time update via socket
    emitRequestStatusUpdate(req.app.get("io"), "charging", request);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get station statistics
exports.getChargingStationStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    const [
      pendingCount,
      activeCount,
      completedToday,
      totalCompleted,
      dailyStats,
    ] = await Promise.all([
      ChargingRequest.countDocuments({
        chargingStation: req.user._id,
        status: "pending",
      }),
      ChargingRequest.countDocuments({
        chargingStation: req.user._id,
        status: { $in: ["confirmed", "dispatched", "arrived", "charging"] },
      }),
      ChargingRequest.countDocuments({
        chargingStation: req.user._id,
        status: "completed",
        completedAt: { $gte: startOfToday },
      }),
      ChargingRequest.countDocuments({
        chargingStation: req.user._id,
        status: "completed",
      }),
      ChargingRequest.getDailyStats(req.user._id, new Date()),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending: pendingCount,
        active: activeCount,
        completedToday,
        totalCompleted,
        dailyStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
