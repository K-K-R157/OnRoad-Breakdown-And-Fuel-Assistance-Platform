const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const FuelStation = require("../models/FuelStation");

exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header first, then fall back to cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "user") {
      req.user = await User.findById(decoded.id);
    } else if (decoded.role === "mechanic") {
      req.user = await Mechanic.findById(decoded.id);
    } else if (decoded.role === "fuelStation") {
      req.user = await FuelStation.findById(decoded.id);
    } else if (decoded.role === "admin") {
      req.user = await User.findById(decoded.id);
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found or token is stale",
      });
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token is invalid",
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: "User role is not authorized to access this route",
      });
    }
    next();
  };
};
