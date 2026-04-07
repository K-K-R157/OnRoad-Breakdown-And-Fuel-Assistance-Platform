const Mechanic = require("../models/Mechanic");
const MechanicRequest = require("../models/Mechanicrequest");
const { emitRequestStatusUpdate } = require("../utils/socketEvents");

exports.getNearbyMechanics = async (req, res) => {
  try {
    const longitude = Number(req.query.longitude);
    const latitude = Number(req.query.latitude);

    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid longitude and latitude are required",
      });
    }

    const mechanics = await Mechanic.findNearby(
      longitude,
      latitude,
      Number(req.query.maxDistance) || 5000,
      {
        mechanicType: req.query.mechanicType,
        service: req.query.service,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      },
    );

    res
      .status(200)
      .json({ success: true, count: mechanics.length, data: mechanics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMechanicProfile = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

exports.updateMechanicProfile = async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "address",
      "location",
      "mechanicType",
      "servicesOffered",
      "experience",
      "availability",
      "profilePicture",
      "serviceRadius",
    ];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const mechanic = await Mechanic.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: mechanic });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMechanicRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { mechanic: req.user._id };
    if (status) filter.status = status;

    const requests = await MechanicRequest.find(filter)
      .populate("user", "name phone profilePicture")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMechanicRequestStatus = async (req, res) => {
  try {
    const { status, notes, cancellationReason } = req.body;
    const request = await MechanicRequest.findOne({
      _id: req.params.id,
      mechanic: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (status === "cancelled") {
      await request.cancelRequest(
        cancellationReason || "Cancelled by mechanic",
        "mechanic",
      );
    } else {
      await request.updateStatus(status, notes || "");
    }

    emitRequestStatusUpdate(req.app.get("io"), "mechanic", request);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMechanicStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    const [pendingCount, activeCount, completedToday, totalCompleted] =
      await Promise.all([
        MechanicRequest.countDocuments({
          mechanic: req.user._id,
          status: "pending",
        }),
        MechanicRequest.countDocuments({
          mechanic: req.user._id,
          status: { $in: ["accepted", "en-route", "arrived", "in-progress"] },
        }),
        MechanicRequest.countDocuments({
          mechanic: req.user._id,
          status: "completed",
          completedAt: { $gte: startOfToday },
        }),
        MechanicRequest.countDocuments({
          mechanic: req.user._id,
          status: "completed",
        }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        pending: pendingCount,
        active: activeCount,
        completedToday,
        totalCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
