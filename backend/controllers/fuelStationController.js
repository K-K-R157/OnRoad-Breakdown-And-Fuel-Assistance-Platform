const FuelStation = require("../models/FuelStation");
const FuelRequest = require("../models/Fuelrequest");
const { emitRequestStatusUpdate } = require("../utils/socketEvents");

exports.getNearbyFuelStations = async (req, res) => {
  try {
    const longitude = Number(req.query.longitude);
    const latitude = Number(req.query.latitude);

    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid longitude and latitude are required",
        });
    }

    const stations = await FuelStation.findNearby(
      longitude,
      latitude,
      Number(req.query.maxDistance) || 5000,
      {
        fuelType: req.query.fuelType,
        deliveryOnly: req.query.deliveryOnly === "true",
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

exports.getFuelStationProfile = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

exports.updateFuelStationProfile = async (req, res) => {
  try {
    const allowed = [
      "stationName",
      "ownerName",
      "phone",
      "address",
      "location",
      "openingHours",
      "deliveryAvailable",
      "deliveryRadius",
      "deliveryCharges",
      "minimumOrderQuantity",
      "stationImages",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const station = await FuelStation.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateFuelTypes = async (req, res) => {
  try {
    const { fuelTypes } = req.body;
    if (!Array.isArray(fuelTypes) || fuelTypes.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "fuelTypes must be a non-empty array",
        });
    }

    const station = await FuelStation.findByIdAndUpdate(
      req.user._id,
      { fuelTypes },
      { new: true, runValidators: true },
    );

    res.status(200).json({ success: true, data: station });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getFuelStationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { fuelStation: req.user._id };
    if (status) filter.status = status;

    const requests = await FuelRequest.find(filter)
      .populate("user", "name phone profilePicture")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFuelRequestStatus = async (req, res) => {
  try {
    const { status, deliveryPerson, deliveryProof, cancellationReason } =
      req.body;

    const request = await FuelRequest.findOne({
      _id: req.params.id,
      fuelStation: req.user._id,
    });
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (status === "cancelled") {
      await request.cancelRequest(
        cancellationReason || "Cancelled by fuel station",
        "fuelStation",
      );
    } else {
      await request.updateStatus(status, { deliveryPerson, deliveryProof });
    }

    emitRequestStatusUpdate(req.app.get("io"), "fuel", request);

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
