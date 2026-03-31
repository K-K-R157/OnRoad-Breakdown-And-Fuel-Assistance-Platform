const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const FuelStation = require("../models/FuelStation");
const ChargingStation = require("../models/ChargingStation");
const MechanicRequest = require("../models/Mechanicrequest");
const FuelRequest = require("../models/Fuelrequest");
const ChargingRequest = require("../models/ChargingRequest");
const { emitRequestStatusUpdate } = require("../utils/socketEvents");

exports.getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "phone", "address", "profilePicture"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createMechanicRequest = async (req, res) => {
  try {
    const {
      mechanicId,
      problemDescription,
      address,
      location,
      estimatedCost = 0,
      images = [],
    } = req.body;

    const mechanic = await Mechanic.findOne({
      _id: mechanicId,
      isApproved: true,
      availability: true,
    });
    if (!mechanic) {
      return res
        .status(404)
        .json({ success: false, message: "Mechanic not found or unavailable" });
    }

    const request = await MechanicRequest.create({
      user: req.user._id,
      mechanic: mechanicId,
      problemDescription,
      address,
      location,
      estimatedCost,
      images,
    });

    emitRequestStatusUpdate(req.app.get("io"), "mechanic", request);

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyMechanicRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const requests = await MechanicRequest.find(filter)
      .populate("mechanic", "name phone rating servicesOffered availability")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelMyMechanicRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await MechanicRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (!["pending", "accepted"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending/accepted requests can be cancelled by user",
      });
    }

    await request.cancelRequest(reason || "Cancelled by user", "user");
    emitRequestStatusUpdate(req.app.get("io"), "mechanic", request);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createFuelRequest = async (req, res) => {
  try {
    const {
      fuelStationId,
      fuelType,
      quantity,
      deliveryLocation,
      address,
      paymentMethod = "cash",
      specialInstructions = "",
    } = req.body;

    const station = await FuelStation.findOne({
      _id: fuelStationId,
      isApproved: true,
    });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Fuel station not found or unavailable",
      });
    }

    const selectedFuel = station.fuelTypes.find(
      (fuel) => fuel.type === fuelType && fuel.available,
    );
    if (!selectedFuel) {
      return res.status(400).json({
        success: false,
        message: "Selected fuel type is not available at this station",
      });
    }

    const deliveryCharges = station.deliveryAvailable
      ? station.deliveryCharges
      : 0;

    const request = await FuelRequest.create({
      user: req.user._id,
      fuelStation: fuelStationId,
      fuelType,
      quantity,
      deliveryLocation,
      address,
      pricePerLiter: selectedFuel.price,
      deliveryCharges,
      totalPrice: quantity * selectedFuel.price + deliveryCharges,
      paymentMethod,
      specialInstructions,
    });

    emitRequestStatusUpdate(req.app.get("io"), "fuel", request);

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyFuelRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const requests = await FuelRequest.find(filter)
      .populate(
        "fuelStation",
        "stationName ownerName phone fuelTypes deliveryAvailable deliveryCharges",
      )
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelMyFuelRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await FuelRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!["pending", "confirmed"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending/confirmed orders can be cancelled by user",
      });
    }

    await request.cancelRequest(reason || "Cancelled by user", "user");
    emitRequestStatusUpdate(req.app.get("io"), "fuel", request);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════ CHARGING REQUESTS ═══════════════════════ */

// Default battery capacities by vehicle type (in kWh)
const DEFAULT_BATTERY_CAPACITIES = {
  "2-wheeler": 3,
  "3-wheeler": 7,
  "4-wheeler": 50,
  commercial: 200,
};

exports.createChargingRequest = async (req, res) => {
  try {
    const {
      chargingStationId,
      vehicleType,
      connectorType,
      currentBatteryPercent,
      targetBatteryPercent = 80,
      batteryCapacity,
      deliveryLocation,
      address,
      paymentMethod = "cash",
      specialInstructions = "",
    } = req.body;

    // Find the charging station
    const station = await ChargingStation.findOne({
      _id: chargingStationId,
      isApproved: true,
    });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Charging station not found or unavailable",
      });
    }

    // Find the matching charging type
    const selectedCharging = station.chargingTypes.find(
      (c) =>
        c.vehicleType === vehicleType &&
        c.connectorType === connectorType &&
        c.available,
    );
    if (!selectedCharging) {
      return res.status(400).json({
        success: false,
        message:
          "Selected vehicle/connector type is not available at this station",
      });
    }

    // Calculate energy needed and price
    const capacity =
      batteryCapacity || DEFAULT_BATTERY_CAPACITIES[vehicleType] || 50;
    const percentNeeded = targetBatteryPercent - currentBatteryPercent;
    const estimatedEnergyNeeded = Math.max(0, (percentNeeded / 100) * capacity);
    const totalPrice =
      estimatedEnergyNeeded * selectedCharging.pricePerKwh +
      station.serviceCharges;

    const request = await ChargingRequest.create({
      user: req.user._id,
      chargingStation: chargingStationId,
      vehicleType,
      connectorType,
      currentBatteryPercent,
      targetBatteryPercent,
      batteryCapacity: capacity,
      estimatedEnergyNeeded: Math.round(estimatedEnergyNeeded * 100) / 100,
      pricePerKwh: selectedCharging.pricePerKwh,
      serviceCharges: station.serviceCharges,
      totalPrice: Math.round(totalPrice * 100) / 100,
      deliveryLocation,
      address,
      paymentMethod,
      specialInstructions,
    });

    emitRequestStatusUpdate(req.app.get("io"), "charging", request);

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyChargingRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const requests = await ChargingRequest.find(filter)
      .populate(
        "chargingStation",
        "stationName ownerName phone chargingTypes mobileChargingAvailable serviceCharges",
      )
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelMyChargingRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await ChargingRequest.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (!["pending", "confirmed"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending/confirmed requests can be cancelled by user",
      });
    }

    await request.cancelRequest(reason || "Cancelled by user", "user");
    emitRequestStatusUpdate(req.app.get("io"), "charging", request);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
