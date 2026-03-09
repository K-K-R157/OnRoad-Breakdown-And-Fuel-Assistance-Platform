const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const FuelStation = require("../models/FuelStation");
const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = async (req, res) => {
  try {
    const {
      role = "user",
      name,
      stationName,
      ownerName,
      email,
      password,
      phone,
      address,
      location,
      servicesOffered,
      experience,
      licenseNumber,
      licenseCopy,
      fuelTypes,
      openingHours,
      deliveryAvailable,
      deliveryRadius,
      deliveryCharges,
      minimumOrderQuantity,
    } = req.body;

    const existingMatches = await Promise.all([
      User.findOne({ email }),
      Mechanic.findOne({ email }),
      FuelStation.findOne({ email }),
    ]);

    const existingUser = existingMatches.find(Boolean);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const normalizedLocation =
      location && Array.isArray(location.coordinates)
        ? { type: "Point", coordinates: location.coordinates }
        : location;

    let user;
    let tokenRole = role;

    if (role === "mechanic") {
      user = await Mechanic.create({
        name,
        email,
        password,
        phone,
        address,
        location: normalizedLocation,
        servicesOffered,
        experience,
        licenseNumber,
        licenseCopy,
      });
    } else if (role === "fuelStation") {
      user = await FuelStation.create({
        stationName,
        ownerName,
        email,
        password,
        phone,
        address,
        location: normalizedLocation,
        fuelTypes,
        licenseNumber,
        licenseCopy,
        openingHours,
        deliveryAvailable,
        deliveryRadius,
        deliveryCharges,
        minimumOrderQuantity,
      });
    } else {
      // Only allow admin creation if an existing admin is making the request
      // (i.e., the requester is authenticated and has admin role).
      // Public registration always creates a "user" role.
      let userRole = "user";
      if (role === "admin") {
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith("Bearer")
        ) {
          try {
            const decoded = jwt.verify(
              req.headers.authorization.split(" ")[1],
              process.env.JWT_SECRET,
            );
            if (decoded.role === "admin") {
              userRole = "admin";
            }
          } catch {
            // invalid token — fall back to regular user
          }
        }
      }
      user = await User.create({
        name,
        email,
        password,
        phone,
        address,
        role: userRole,
      });
      tokenRole = userRole;
    }

    const token = generateToken(user._id, tokenRole);
    const displayName = user.name || user.stationName || user.ownerName;

    // Set JWT as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: displayName,
        email: user.email,
        role: tokenRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const roleToModel = {
      user: User,
      admin: User,
      mechanic: Mechanic,
      fuelStation: FuelStation,
    };

    let user = null;
    let resolvedRole = role;

    if (role && roleToModel[role]) {
      user = await roleToModel[role].findOne({ email }).select("+password");
    } else {
      user = await User.findOne({ email }).select("+password");
      resolvedRole = user?.role;

      if (!user) {
        user = await Mechanic.findOne({ email }).select("+password");
        if (user) resolvedRole = "mechanic";
      }

      if (!user) {
        user = await FuelStation.findOne({ email }).select("+password");
        if (user) resolvedRole = "fuelStation";
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (
      (resolvedRole === "mechanic" || resolvedRole === "fuelStation") &&
      !user.isApproved
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval",
      });
    }

    const token = generateToken(user._id, resolvedRole || "user");
    const displayName = user.name || user.stationName || user.ownerName;

    // Set JWT as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: displayName,
        email: user.email,
        role: resolvedRole || "user",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

exports.logout = async (req, res) => {
  // Clear the token cookie and destroy the session
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  if (req.session) {
    req.session.destroy(() => {});
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
