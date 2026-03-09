const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const FuelStation = require("../models/FuelStation");
const MechanicRequest = require("../models/Mechanicrequest");
const FuelRequest = require("../models/Fuelrequest");
const Feedback = require("../models/Feedback");

exports.getDashboard = async (req, res) => {
  try {
    const [
      users,
      mechanics,
      fuelStations,
      pendingMechanics,
      pendingFuelStations,
      activeMechanicRequests,
      activeFuelRequests,
      feedbackCount,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Mechanic.countDocuments(),
      FuelStation.countDocuments(),
      Mechanic.countDocuments({ isApproved: false }),
      FuelStation.countDocuments({ isApproved: false }),
      MechanicRequest.countDocuments({
        status: {
          $in: ["pending", "accepted", "en-route", "arrived", "in-progress"],
        },
      }),
      FuelRequest.countDocuments({
        status: {
          $in: ["pending", "confirmed", "preparing", "out-for-delivery"],
        },
      }),
      Feedback.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        mechanics,
        fuelStations,
        pendingMechanics,
        pendingFuelStations,
        activeMechanicRequests,
        activeFuelRequests,
        feedbackCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ isApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: mechanics.length, data: mechanics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewMechanic = async (req, res) => {
  try {
    const { action, rejectionReason = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "action must be either 'approve' or 'reject'",
        });
    }

    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res
        .status(404)
        .json({ success: false, message: "Mechanic not found" });
    }

    if (action === "approve") {
      mechanic.isApproved = true;
      mechanic.isVerified = true;
      mechanic.approvedBy = req.user._id;
      mechanic.approvedAt = new Date();
      mechanic.rejectionReason = undefined;
    } else {
      mechanic.isApproved = false;
      mechanic.isVerified = false;
      mechanic.rejectionReason = rejectionReason || "Rejected by admin";
    }

    await mechanic.save();

    res.status(200).json({ success: true, data: mechanic });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getPendingFuelStations = async (req, res) => {
  try {
    const stations = await FuelStation.find({ isApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewFuelStation = async (req, res) => {
  try {
    const { action, rejectionReason = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "action must be either 'approve' or 'reject'",
        });
    }

    const station = await FuelStation.findById(req.params.id);
    if (!station) {
      return res
        .status(404)
        .json({ success: false, message: "Fuel station not found" });
    }

    if (action === "approve") {
      station.isApproved = true;
      station.isVerified = true;
      station.approvedBy = req.user._id;
      station.approvedAt = new Date();
      station.rejectionReason = undefined;
    } else {
      station.isApproved = false;
      station.isVerified = false;
      station.rejectionReason = rejectionReason || "Rejected by admin";
    }

    await station.save();

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
