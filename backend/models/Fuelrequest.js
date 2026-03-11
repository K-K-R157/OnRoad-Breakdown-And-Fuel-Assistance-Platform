// models/FuelRequest.js
const mongoose = require("mongoose");

const fuelRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    fuelStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FuelStation",
      required: [true, "Fuel station is required"],
    },
    fuelType: {
      type: String,
      required: [true, "Please specify fuel type"],
      enum: ["Petrol", "Diesel", "CNG"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Please specify quantity"],
      min: [1, "Quantity must be at least 1 liter"],
      max: [500, "Quantity cannot exceed 500 liters"],
    },
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
    pricePerLiter: {
      type: Number,
      required: [true, "Price per liter is required"],
      min: [0, "Price cannot be negative"],
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: [0, "Delivery charges cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
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
    deliveryPersonName: {
      type: String,
      trim: true,
    },
    deliveryPersonPhone: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    preferredDeliveryTime: {
      type: Date,
    },
    scheduledDeliveryTime: {
      type: Date,
    },
    deliveryTime: {
      type: Date,
    },
    specialInstructions: {
      type: String,
      maxlength: [200, "Instructions cannot exceed 200 characters"],
    },
    cancellationReason: {
      type: String,
      maxlength: [200, "Reason cannot exceed 200 characters"],
    },
    cancelledBy: {
      type: String,
      enum: ["user", "fuelStation", "admin"],
    },
    confirmedAt: {
      type: Date,
    },
    preparingAt: {
      type: Date,
    },
    dispatchedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    preparationTime: {
      type: Number,
    },
    deliveryDuration: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    deliveryProofImage: {
      type: String,
    },
    receiverName: {
      type: String,
      trim: true,
    },
    receiverSignature: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

fuelRequestSchema.index({ user: 1, createdAt: -1 });
fuelRequestSchema.index({ fuelStation: 1, status: 1 });
fuelRequestSchema.index({ status: 1, createdAt: -1 });
fuelRequestSchema.index({ deliveryLocation: "2dsphere" });
fuelRequestSchema.index({ paymentStatus: 1 });

fuelRequestSchema.pre("save", function () {
  if (
    this.isModified("quantity") ||
    this.isModified("pricePerLiter") ||
    this.isModified("deliveryCharges")
  ) {
    this.totalPrice = this.quantity * this.pricePerLiter + this.deliveryCharges;
  }
});

fuelRequestSchema.pre("save", function () {
  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case "confirmed":
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case "preparing":
        if (!this.preparingAt) {
          this.preparingAt = now;
          if (this.confirmedAt) {
            this.preparationTime = Math.floor((now - this.confirmedAt) / 60000);
          }
        }
        break;
      case "out-for-delivery":
        if (!this.dispatchedAt) this.dispatchedAt = now;
        break;
      case "delivered":
        if (!this.deliveredAt) {
          this.deliveredAt = now;
          if (this.dispatchedAt) {
            this.deliveryDuration = Math.floor(
              (now - this.dispatchedAt) / 60000,
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

fuelRequestSchema.pre("save", function () {
  if (this.isModified("status") && !this.isNew) {
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["out-for-delivery", "cancelled"],
      "out-for-delivery": ["delivered", "cancelled"],
      delivered: [],
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

fuelRequestSchema.post("init", function () {
  this._original = this.toObject();
});

fuelRequestSchema.methods.updateStatus = async function (
  newStatus,
  additionalData = {},
) {
  this.status = newStatus;

  if (newStatus === "out-for-delivery" && additionalData.deliveryPerson) {
    this.deliveryPersonName = additionalData.deliveryPerson.name;
    this.deliveryPersonPhone = additionalData.deliveryPerson.phone;
    this.vehicleNumber = additionalData.deliveryPerson.vehicleNumber;
  }

  if (newStatus === "delivered" && additionalData.deliveryProof) {
    this.deliveryProofImage = additionalData.deliveryProof.image;
    this.receiverName = additionalData.deliveryProof.receiverName;
  }

  return await this.save();
};

fuelRequestSchema.methods.cancelRequest = async function (reason, cancelledBy) {
  this.status = "cancelled";
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;

  if (this.paymentStatus === "paid") {
    this.paymentStatus = "refunded";
  }

  return await this.save();
};

fuelRequestSchema.methods.processPayment = async function (
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

fuelRequestSchema.statics.getActiveOrders = function (userId) {
  return this.find({
    user: userId,
    status: { $in: ["pending", "confirmed", "preparing", "out-for-delivery"] },
  })
    .populate("fuelStation", "stationName phone address")
    .sort({ createdAt: -1 });
};

fuelRequestSchema.statics.getPendingOrders = function (fuelStationId) {
  return this.find({
    fuelStation: fuelStationId,
    status: "pending",
  })
    .populate("user", "name phone profilePicture")
    .sort({ createdAt: -1 });
};

fuelRequestSchema.statics.getStationActiveOrders = function (fuelStationId) {
  return this.find({
    fuelStation: fuelStationId,
    status: { $in: ["confirmed", "preparing", "out-for-delivery"] },
  })
    .populate("user", "name phone profilePicture")
    .sort({ createdAt: -1 });
};

fuelRequestSchema.statics.getDailySales = function (fuelStationId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        fuelStation: new mongoose.Types.ObjectId(fuelStationId),
        status: "delivered",
        deliveredAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: "$fuelType",
        totalQuantity: { $sum: "$quantity" },
        totalRevenue: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);
};

fuelRequestSchema.virtual("totalTime").get(function () {
  if (this.deliveredAt) {
    return Math.floor((this.deliveredAt - this.createdAt) / 60000);
  }
  return null;
});

fuelRequestSchema.set("toJSON", { virtuals: true });
fuelRequestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("FuelRequest", fuelRequestSchema);
