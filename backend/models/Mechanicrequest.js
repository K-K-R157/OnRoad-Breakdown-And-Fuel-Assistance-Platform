const mongoose = require("mongoose");

const mechanicRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mechanic",
      required: [true, "Mechanic is required"],
    },
    problemDescription: {
      type: String,
      required: [true, "Please provide a problem description"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
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
    address: {
      type: String,
      required: [true, "Please provide an address"],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "en-route",
        "arrived",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    estimatedCost: {
      type: Number,
      min: [0, "Cost cannot be negative"],
      default: 0,
    },
    actualCost: {
      type: Number,
      min: [0, "Cost cannot be negative"],
      default: 0,
    },
    images: {
      type: [String],
      validate: {
        validator: function (images) {
          return images.length <= 5;
        },
        message: "Cannot upload more than 5 images",
      },
    },
    mechanicNotes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    cancellationReason: {
      type: String,
      maxlength: [200, "Reason cannot exceed 200 characters"],
    },
    cancelledBy: {
      type: String,
      enum: ["user", "mechanic", "admin"],
    },
    acceptedAt: {
      type: Date,
    },
    enRouteAt: {
      type: Date,
    },
    arrivedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    estimatedArrivalTime: {
      type: Date,
    },
    responseTime: {
      type: Number,
    },
    serviceTime: {
      type: Number,
    },
    distance: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

mechanicRequestSchema.index({ user: 1, createdAt: -1 });
mechanicRequestSchema.index({ mechanic: 1, status: 1 });
mechanicRequestSchema.index({ status: 1, createdAt: -1 });
mechanicRequestSchema.index({ location: "2dsphere" });

mechanicRequestSchema.pre("save", function () {
  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case "accepted":
        if (!this.acceptedAt) {
          this.acceptedAt = now;
          this.responseTime = Math.floor((now - this.createdAt) / 60000);
        }
        break;
      case "en-route":
        if (!this.enRouteAt) this.enRouteAt = now;
        break;
      case "arrived":
        if (!this.arrivedAt) this.arrivedAt = now;
        break;
      case "in-progress":
        if (!this.startedAt) this.startedAt = now;
        break;
      case "completed":
        if (!this.completedAt) {
          this.completedAt = now;
          if (this.startedAt) {
            this.serviceTime = Math.floor((now - this.startedAt) / 60000);
          }
        }
        break;
      case "cancelled":
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
});

mechanicRequestSchema.pre("save", function () {
  if (this.isModified("status") && !this.isNew) {
    const validTransitions = {
      pending: ["accepted", "cancelled"],
      accepted: ["en-route", "cancelled"],
      "en-route": ["arrived", "cancelled"],
      arrived: ["in-progress", "cancelled"],
      "in-progress": ["completed", "cancelled"],
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

mechanicRequestSchema.post("init", function () {
  this._original = this.toObject();
});

mechanicRequestSchema.methods.updateStatus = async function (
  newStatus,
  notes = "",
) {
  this.status = newStatus;
  if (notes) {
    this.mechanicNotes = notes;
  }
  return await this.save();
};

mechanicRequestSchema.methods.cancelRequest = async function (
  reason,
  cancelledBy,
) {
  this.status = "cancelled";
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  return await this.save();
};

mechanicRequestSchema.statics.getActiveRequests = function (userId) {
  return this.find({
    user: userId,
    status: {
      $in: ["pending", "accepted", "en-route", "arrived", "in-progress"],
    },
  })
    .populate("mechanic", "name phone profilePicture rating")
    .sort({ createdAt: -1 });
};

mechanicRequestSchema.statics.getPendingRequests = function (mechanicId) {
  return this.find({
    mechanic: mechanicId,
    status: "pending",
  })
    .populate("user", "name phone profilePicture")
    .sort({ createdAt: -1 });
};

mechanicRequestSchema.statics.getMechanicActiveRequests = function (
  mechanicId,
) {
  return this.find({
    mechanic: mechanicId,
    status: { $in: ["accepted", "en-route", "arrived", "in-progress"] },
  })
    .populate("user", "name phone profilePicture")
    .sort({ createdAt: -1 });
};

mechanicRequestSchema.virtual("totalTime").get(function () {
  if (this.completedAt) {
    return Math.floor((this.completedAt - this.createdAt) / 60000); //
  }
  return null;
});

mechanicRequestSchema.set("toJSON", { virtuals: true });
mechanicRequestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("MechanicRequest", mechanicRequestSchema);
