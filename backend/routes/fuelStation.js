const express = require("express");
const {
  getNearbyFuelStations,
  getFuelStationProfile,
  updateFuelStationProfile,
  updateFuelTypes,
  getFuelStationRequests,
  updateFuelRequestStatus,
} = require("../controllers/fuelStationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/nearby", getNearbyFuelStations);

router.use(protect, authorize("fuelStation"));
router.get("/me", getFuelStationProfile);
router.put("/me", updateFuelStationProfile);
router.patch("/fuel-types", updateFuelTypes);
router.get("/requests", getFuelStationRequests);
router.patch("/requests/:id/status", updateFuelRequestStatus);

module.exports = router;
