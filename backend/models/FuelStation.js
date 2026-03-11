const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const fuelTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Petrol", "Diesel", "CNG"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide fuel price"],
      min: [0, "Price cannot be negative"],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const fuelStationSchema = new mongoose.Schema(
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
    fuelTypes: {
      type: [fuelTypeSchema],
      required: [true, "Please specify at least one fuel type"],
      validate: {
        validator: function (fuels) {
          return fuels.length > 0;
        },
        message: "At least one fuel type must be available",
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
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryRadius: {
      type: Number,
      min: 0,
      default: 0, // in kilometers
    },
    deliveryCharges: {
      type: Number,
      min: 0,
      default: 0,
    },
    minimumOrderQuantity: {
      type: Number,
      min: 0,
      default: 5, // in liters
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

fuelStationSchema.index({ location: "2dsphere" });

fuelStationSchema.index({ isApproved: 1 });
fuelStationSchema.index({ rating: -1 });
fuelStationSchema.index({ email: 1 });
fuelStationSchema.index({ "fuelTypes.type": 1 });

fuelStationSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

fuelStationSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

fuelStationSchema.methods.calculateAverageRating = function (newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.rating * this.totalRatings;
  const newAverage = (currentTotal + newRating) / totalRatings;

  this.rating = Math.round(newAverage * 10) / 10;
  this.totalRatings = totalRatings;

  return this.rating;
};

fuelStationSchema.methods.updateFuelPrice = function (fuelType, newPrice) {
  const fuel = this.fuelTypes.find((f) => f.type === fuelType);
  if (fuel) {
    fuel.price = newPrice;
    return true;
  }
  return false;
};

fuelStationSchema.methods.toggleFuelAvailability = function (fuelType) {
  const fuel = this.fuelTypes.find((f) => f.type === fuelType);
  if (fuel) {
    fuel.available = !fuel.available;
    return fuel.available;
  }
  return null;
};

fuelStationSchema.methods.toJSON = function () {
  const station = this.toObject();
  delete station.password;
  return station;
};

fuelStationSchema.statics.findNearby = function (
  longitude,
  latitude,
  maxDistance = 5000,
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

  if (options.fuelType) {
    query["fuelTypes.type"] = options.fuelType;
    query["fuelTypes.available"] = true;
  }

  if (options.deliveryOnly) {
    query.deliveryAvailable = true;
  }

  if (options.minRating) {
    query.rating = { $gte: options.minRating };
  }

  return this.find(query)
    .select("-password")
    .limit(options.limit || 20);
};

fuelStationSchema.statics.findByFuelType = function (fuelType) {
  return this.find({
    "fuelTypes.type": fuelType,
    "fuelTypes.available": true,
    isApproved: true,
  }).select("-password");
};

module.exports = mongoose.model("FuelStation", fuelStationSchema);
