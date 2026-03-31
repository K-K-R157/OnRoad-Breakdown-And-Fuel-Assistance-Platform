const express = require("express");
const {
  getNearbyChargingStations,
  getChargingStationProfile,
  updateChargingStationProfile,
  updateChargingTypes,
  getChargingStationRequests,
  updateChargingRequestStatus,
  getChargingStationStats,
} = require("../controllers/chargingStationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public route - search nearby charging stations
router.get("/nearby", getNearbyChargingStations);

// Protected routes - charging station owner only
router.use(protect, authorize("chargingStation"));
router.get("/me", getChargingStationProfile);
router.put("/me", updateChargingStationProfile);
router.patch("/charging-types", updateChargingTypes);
router.get("/requests", getChargingStationRequests);
router.patch("/requests/:id/status", updateChargingRequestStatus);
router.get("/stats", getChargingStationStats);

module.exports = router;
