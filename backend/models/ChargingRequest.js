// models/ChargingRequest.js
const mongoose = require("mongoose");

// Default battery capacities by vehicle type (in kWh)
const DEFAULT_BATTERY_CAPACITIES = {
  "2-wheeler": 3, // 2-4 kWh typical
  "3-wheeler": 7, // 5-10 kWh typical
  "4-wheeler": 50, // 30-100 kWh typical
  commercial: 200, // 100-400 kWh typical
};

const chargingRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    chargingStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChargingStation",
      required: [true, "Charging station is required"],
    },
    vehicleType: {
      type: String,
      required: [true, "Please specify vehicle type"],
      enum: ["2-wheeler", "3-wheeler", "4-wheeler", "commercial"],
      trim: true,
    },
    connectorType: {
      type: String,
      required: [true, "Please specify connector type"],
      enum: ["Type2", "CCS2", "CHAdeMO", "GBT"],
      trim: true,
    },
    // Battery information
    currentBatteryPercent: {
      type: Number,
      required: [true, "Please specify current battery percentage"],
      min: [0, "Battery percentage cannot be negative"],
      max: [100, "Battery percentage cannot exceed 100"],
    },
    targetBatteryPercent: {
      type: Number,
      required: [true, "Please specify target battery percentage"],
      min: [1, "Target battery percentage must be at least 1%"],
      max: [100, "Target battery percentage cannot exceed 100"],
      default: 80,
    },
    // User can optionally provide actual battery capacity
    batteryCapacity: {
      type: Number,
      min: [0, "Battery capacity cannot be negative"],
    },
    // Calculated energy needed (kWh)
    estimatedEnergyNeeded: {
      type: Number,
      min: [0, "Energy needed cannot be negative"],
    },
    // Pricing
    pricePerKwh: {
      type: Number,
      required: [true, "Price per kWh is required"],
      min: [0, "Price cannot be negative"],
    },
    serviceCharges: {
      type: Number,
      default: 0,
      min: [0, "Service charges cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    // Location
    deliveryLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Please provide delivery location coordinates"],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message:
            "Coordinates must be [longitude, latitude] with valid ranges",
        },
      },
    },
    address: {
      type: String,
      default: "GPS Location",
      trim: true,
    },
    // Status workflow
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "dispatched",
        "arrived",
        "charging",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "card", "upi"],
      default: "cash",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    // Technician/Driver details
    technicianName: {
      type: String,
      trim: true,
    },
    technicianPhone: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    // Charging details (actual values after completion)
    actualEnergyDelivered: {
      type: Number,
      min: 0,
    },
    chargingStartTime: {
      type: Date,
    },
    chargingEndTime: {
      type: Date,
    },
    chargingDuration: {
      type: Number, // in minutes
    },
    // Special instructions
    specialInstructions: {
      type: String,
      maxlength: [200, "Instructions cannot exceed 200 characters"],
    },
    // Cancellation
    cancellationReason: {
      type: String,
      maxlength: [200, "Reason cannot exceed 200 characters"],
    },
    cancelledBy: {
      type: String,
      enum: ["user", "chargingStation", "admin"],
    },
    // Timestamps for each status
    confirmedAt: {
      type: Date,
    },
    dispatchedAt: {
      type: Date,
    },
    arrivedAt: {
      type: Date,
    },
    chargingStartedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    // Distance and ETA
    distance: {
      type: Number, // in km
    },
    estimatedArrivalTime: {
      type: Number, // in minutes
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
chargingRequestSchema.index({ user: 1, createdAt: -1 });
chargingRequestSchema.index({ chargingStation: 1, status: 1 });
chargingRequestSchema.index({ status: 1, createdAt: -1 });
chargingRequestSchema.index({ deliveryLocation: "2dsphere" });
chargingRequestSchema.index({ paymentStatus: 1 });

// Calculate energy needed and total price before saving
chargingRequestSchema.pre("save", function () {
  if (
    this.isModified("currentBatteryPercent") ||
    this.isModified("targetBatteryPercent") ||
    this.isModified("batteryCapacity") ||
    this.isModified("pricePerKwh") ||
    this.isModified("serviceCharges")
  ) {
    // Use provided battery capacity or default based on vehicle type
    const capacity =
      this.batteryCapacity ||
      DEFAULT_BATTERY_CAPACITIES[this.vehicleType] ||
      50;

    // Calculate energy needed
    const percentNeeded =
      this.targetBatteryPercent - this.currentBatteryPercent;
    this.estimatedEnergyNeeded = Math.max(0, (percentNeeded / 100) * capacity);

    // Calculate total price
    this.totalPrice =
      this.estimatedEnergyNeeded * this.pricePerKwh +
      (this.serviceCharges || 0);

    // Round to 2 decimal places
    this.estimatedEnergyNeeded =
      Math.round(this.estimatedEnergyNeeded * 100) / 100;
    this.totalPrice = Math.round(this.totalPrice * 100) / 100;
  }
});

// Update timestamps based on status changes
chargingRequestSchema.pre("save", function () {
  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case "confirmed":
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case "dispatched":
        if (!this.dispatchedAt) this.dispatchedAt = now;
        break;
      case "arrived":
        if (!this.arrivedAt) this.arrivedAt = now;
        break;
      case "charging":
        if (!this.chargingStartedAt) {
          this.chargingStartedAt = now;
          this.chargingStartTime = now;
        }
        break;
      case "completed":
        if (!this.completedAt) {
          this.completedAt = now;
          this.chargingEndTime = now;
          if (this.chargingStartTime) {
            this.chargingDuration = Math.floor(
              (now - this.chargingStartTime) / 60000,
            );
          }
        }
        break;
      case "cancelled":
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
});

// Validate status transitions
chargingRequestSchema.pre("save", function () {
  if (this.isModified("status") && !this.isNew) {
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["dispatched", "cancelled"],
      dispatched: ["arrived", "cancelled"],
      arrived: ["charging", "cancelled"],
      charging: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const oldStatus = this._original?.status || "pending";
    const newStatus = this.status;

    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${oldStatus} to ${newStatus}`,
      );
    }
  }
});

// Store original document for status transition validation
chargingRequestSchema.post("init", function () {
  this._original = this.toObject();
});

// Instance methods
chargingRequestSchema.methods.updateStatus = async function (
  newStatus,
  additionalData = {},
) {
  this.status = newStatus;

  if (newStatus === "dispatched" && additionalData.technician) {
    this.technicianName = additionalData.technician.name;
    this.technicianPhone = additionalData.technician.phone;
    this.vehicleNumber = additionalData.technician.vehicleNumber;
    if (additionalData.estimatedArrivalTime) {
      this.estimatedArrivalTime = additionalData.estimatedArrivalTime;
    }
  }

  if (newStatus === "completed" && additionalData.chargingDetails) {
    this.actualEnergyDelivered = additionalData.chargingDetails.energyDelivered;
  }

  return await this.save();
};

chargingRequestSchema.methods.cancelRequest = async function (
  reason,
  cancelledBy,
) {
  this.status = "cancelled";
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;

  if (this.paymentStatus === "paid") {
    this.paymentStatus = "refunded";
  }

  return await this.save();
};

chargingRequestSchema.methods.processPayment = async function (
  method,
  transactionId,
) {
  this.paymentMethod = method;
  this.paymentStatus = "paid";
  if (transactionId) {
    this.transactionId = transactionId;
  }
  return await this.save();
};

// Static methods
chargingRequestSchema.statics.getActiveOrders = function (userId) {
  return this.find({
    user: userId,
    status: {
      $in: ["pending", "confirmed", "dispatched", "arrived", "charging"],
    },
  })
    .populate("chargingStation", "stationName phone address")
    .sort({ createdAt: -1 });
};

chargingRequestSchema.statics.getPendingOrders = function (chargingStationId) {
  return this.find({
    chargingStation: chargingStationId,
    status: "pending",
  })
    .populate("user", "name phone profilePicture")
    .sort({ createdAt: -1 });
};

chargingRequestSchema.statics.getStationActiveOrders = function (
  chargingStationId,
) {
  return this.find({
    chargingStation: chargingStationId,
    status: { $in: ["confirmed", "dispatched", "arrived", "charging"] },
  })
    .populate("user", "name phone profilePicture")
    .sort({ createdAt: -1 });
};

chargingRequestSchema.statics.getDailyStats = function (
  chargingStationId,
  date,
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        chargingStation: new mongoose.Types.ObjectId(chargingStationId),
        status: "completed",
        completedAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: "$vehicleType",
        totalEnergy: { $sum: "$actualEnergyDelivered" },
        totalRevenue: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);
};

// Virtual for total service time
chargingRequestSchema.virtual("totalServiceTime").get(function () {
  if (this.completedAt) {
    return Math.floor((this.completedAt - this.createdAt) / 60000);
  }
  return null;
});

chargingRequestSchema.set("toJSON", { virtuals: true });
chargingRequestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ChargingRequest", chargingRequestSchema);
