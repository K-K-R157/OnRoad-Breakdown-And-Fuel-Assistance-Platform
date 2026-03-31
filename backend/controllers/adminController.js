const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const FuelStation = require("../models/FuelStation");
const ChargingStation = require("../models/ChargingStation");
const MechanicRequest = require("../models/Mechanicrequest");
const FuelRequest = require("../models/Fuelrequest");
const ChargingRequest = require("../models/ChargingRequest");
const Feedback = require("../models/Feedback");

exports.getDashboard = async (req, res) => {
  try {
    const [
      users,
      mechanics,
      fuelStations,
      chargingStations,
      pendingMechanics,
      pendingFuelStations,
      pendingChargingStations,
      activeMechanicRequests,
      activeFuelRequests,
      activeChargingRequests,
      feedbackCount,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Mechanic.countDocuments(),
      FuelStation.countDocuments(),
      ChargingStation.countDocuments(),
      Mechanic.countDocuments({ isApproved: false }),
      FuelStation.countDocuments({ isApproved: false }),
      ChargingStation.countDocuments({ isApproved: false }),
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
      ChargingRequest.countDocuments({
        status: {
          $in: ["pending", "confirmed", "dispatched", "arrived", "charging"],
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
        chargingStations,
        pendingMechanics,
        pendingFuelStations,
        pendingChargingStations,
        activeMechanicRequests,
        activeFuelRequests,
        activeChargingRequests,
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
      return res.status(400).json({
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
      return res.status(400).json({
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

/* ── List all registered users ── */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── List ALL mechanics (approved + pending) ── */
exports.getAllMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: mechanics.length, data: mechanics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── List ALL fuel stations (approved + pending) ── */
exports.getAllFuelStations = async (req, res) => {
  try {
    const stations = await FuelStation.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── Revoke (un-approve) an approved mechanic ── */
exports.revokeMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic)
      return res
        .status(404)
        .json({ success: false, message: "Mechanic not found" });

    mechanic.isApproved = false;
    mechanic.isVerified = false;
    mechanic.rejectionReason = "Revoked by admin";
    await mechanic.save();

    res.status(200).json({ success: true, data: mechanic });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── Revoke (un-approve) an approved fuel station ── */
exports.revokeFuelStation = async (req, res) => {
  try {
    const station = await FuelStation.findById(req.params.id);
    if (!station)
      return res
        .status(404)
        .json({ success: false, message: "Fuel station not found" });

    station.isApproved = false;
    station.isVerified = false;
    station.rejectionReason = "Revoked by admin";
    await station.save();

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── Active mechanic requests ── */
exports.getActiveMechanicRequests = async (req, res) => {
  try {
    const requests = await MechanicRequest.find({
      status: {
        $in: ["pending", "accepted", "en-route", "arrived", "in-progress"],
      },
    })
      .populate("user", "name email phone")
      .populate("mechanic", "name email phone specialization")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── Active fuel requests ── */
exports.getActiveFuelRequests = async (req, res) => {
  try {
    const requests = await FuelRequest.find({
      status: {
        $in: ["pending", "confirmed", "preparing", "out-for-delivery"],
      },
    })
      .populate("user", "name email phone")
      .populate("fuelStation", "stationName name email phone")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── All feedback ── */
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email")
      .populate("serviceProvider", "name stationName email")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: feedback.length, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════ CHARGING STATIONS ═══════════════════════ */

exports.getPendingChargingStations = async (req, res) => {
  try {
    const stations = await ChargingStation.find({ isApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewChargingStation = async (req, res) => {
  try {
    const { action, rejectionReason = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be either 'approve' or 'reject'",
      });
    }

    const station = await ChargingStation.findById(req.params.id);
    if (!station) {
      return res
        .status(404)
        .json({ success: false, message: "Charging station not found" });
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

/* ── List ALL charging stations (approved + pending) ── */
exports.getAllChargingStations = async (req, res) => {
  try {
    const stations = await ChargingStation.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── Revoke (un-approve) an approved charging station ── */
exports.revokeChargingStation = async (req, res) => {
  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station)
      return res
        .status(404)
        .json({ success: false, message: "Charging station not found" });

    station.isApproved = false;
    station.isVerified = false;
    station.rejectionReason = "Revoked by admin";
    await station.save();

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ── Active charging requests ── */
exports.getActiveChargingRequests = async (req, res) => {
  try {
    const requests = await ChargingRequest.find({
      status: {
        $in: ["pending", "confirmed", "dispatched", "arrived", "charging"],
      },
    })
      .populate("user", "name email phone")
      .populate("chargingStation", "stationName ownerName email phone")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
