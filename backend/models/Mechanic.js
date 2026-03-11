const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const mechanicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
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
    servicesOffered: {
      type: [String],
      required: [true, "Please specify at least one service"],
      validate: {
        validator: function (services) {
          return services.length > 0;
        },
        message: "At least one service must be offered",
      },
    },
    experience: {
      type: Number,
      required: [true, "Please provide years of experience"],
      min: [0, "Experience cannot be negative"],
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
    profilePicture: {
      type: String,
      default: "default-mechanic.jpg",
    },
    serviceRadius: {
      type: Number,
      min: 0,
      default: 10, // in kilometers
    },
    availability: {
      type: Boolean,
      default: true,
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

mechanicSchema.index({ location: "2dsphere" });

mechanicSchema.index({ isApproved: 1, availability: 1 });
mechanicSchema.index({ rating: -1 });
mechanicSchema.index({ email: 1 });

mechanicSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

mechanicSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

mechanicSchema.methods.calculateAverageRating = function (newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.rating * this.totalRatings;
  const newAverage = (currentTotal + newRating) / totalRatings;

  this.rating = Math.round(newAverage * 10) / 10;
  this.totalRatings = totalRatings;

  return this.rating;
};

mechanicSchema.methods.toJSON = function () {
  const mechanic = this.toObject();
  delete mechanic.password;
  return mechanic;
};

mechanicSchema.statics.findNearby = function (
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
    availability: true,
  };

  if (options.service) {
    query.servicesOffered = { $in: [options.service] };
  }

  if (options.minRating) {
    query.rating = { $gte: options.minRating };
  }

  return this.find(query)
    .select("-password")
    .limit(options.limit || 20);
};

module.exports = mongoose.model("Mechanic", mechanicSchema);
