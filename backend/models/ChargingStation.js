const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Charging type sub-schema for different vehicle/connector combinations
const chargingTypeSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: true,
      enum: ["2-wheeler", "3-wheeler", "4-wheeler", "commercial"],
      trim: true,
    },
    connectorType: {
      type: String,
      required: true,
      enum: ["Type2", "CCS2", "CHAdeMO", "GBT"],
      trim: true,
    },
    pricePerKwh: {
      type: Number,
      required: [true, "Please provide price per kWh"],
      min: [0, "Price cannot be negative"],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const chargingStationSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: [true, "Please provide station name"],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Please provide owner name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please provide an address"],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Please provide location coordinates"],
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
    chargingTypes: {
      type: [chargingTypeSchema],
      required: [true, "Please specify at least one charging type"],
      validate: {
        validator: function (types) {
          return types.length > 0;
        },
        message: "At least one charging type must be available",
      },
    },
    licenseNumber: {
      type: String,
      required: [true, "Please provide license number"],
      unique: true,
      trim: true,
    },
    licenseCopy: {
      type: String,
      required: [true, "Please upload license document"],
    },
    stationImages: {
      type: [String],
      default: [],
    },
    openingHours: {
      type: String,
      required: [true, "Please provide opening hours"],
      default: "24 Hours",
    },
    // Mobile charging service (send charging vehicle to user)
    mobileChargingAvailable: {
      type: Boolean,
      default: true,
    },
    serviceRadius: {
      type: Number,
      min: 0,
      default: 25, // in kilometers
    },
    serviceCharges: {
      type: Number,
      min: 0,
      default: 150, // base service fee in rupees
    },
    // Estimated response time in minutes
    estimatedResponseTime: {
      type: Number,
      min: 0,
      default: 30,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
chargingStationSchema.index({ location: "2dsphere" });
chargingStationSchema.index({ isApproved: 1 });
chargingStationSchema.index({ rating: -1 });
chargingStationSchema.index({ email: 1 });
chargingStationSchema.index({ "chargingTypes.vehicleType": 1 });
chargingStationSchema.index({ "chargingTypes.connectorType": 1 });

// Hash password before saving
chargingStationSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
chargingStationSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate average rating
chargingStationSchema.methods.calculateAverageRating = function (newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.rating * this.totalRatings;
  const newAverage = (currentTotal + newRating) / totalRatings;

  this.rating = Math.round(newAverage * 10) / 10;
  this.totalRatings = totalRatings;

  return this.rating;
};

// Update charging price
chargingStationSchema.methods.updateChargingPrice = function (
  vehicleType,
  connectorType,
  newPrice,
) {
  const charging = this.chargingTypes.find(
    (c) => c.vehicleType === vehicleType && c.connectorType === connectorType,
  );
  if (charging) {
    charging.pricePerKwh = newPrice;
    return true;
  }
  return false;
};

// Toggle charging type availability
chargingStationSchema.methods.toggleChargingAvailability = function (
  vehicleType,
  connectorType,
) {
  const charging = this.chargingTypes.find(
    (c) => c.vehicleType === vehicleType && c.connectorType === connectorType,
  );
  if (charging) {
    charging.available = !charging.available;
    return charging.available;
  }
  return null;
};

// Remove password from JSON output
chargingStationSchema.methods.toJSON = function () {
  const station = this.toObject();
  delete station.password;
  return station;
};

// Find nearby charging stations
chargingStationSchema.statics.findNearby = function (
  longitude,
  latitude,
  maxDistance = 25000,
  options = {},
) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isApproved: true,
  };

  if (options.vehicleType) {
    query["chargingTypes.vehicleType"] = options.vehicleType;
    query["chargingTypes.available"] = true;
  }

  if (options.connectorType) {
    query["chargingTypes.connectorType"] = options.connectorType;
  }

  if (options.mobileOnly) {
    query.mobileChargingAvailable = true;
  }

  if (options.minRating) {
    query.rating = { $gte: options.minRating };
  }

  return this.find(query)
    .select("-password")
    .limit(options.limit || 20);
};

// Find stations by vehicle type
chargingStationSchema.statics.findByVehicleType = function (vehicleType) {
  return this.find({
    "chargingTypes.vehicleType": vehicleType,
    "chargingTypes.available": true,
    isApproved: true,
  }).select("-password");
};

module.exports = mongoose.model("ChargingStation", chargingStationSchema);
