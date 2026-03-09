const express = require("express");
const {
  getDashboard,
  getPendingMechanics,
  reviewMechanic,
  getPendingFuelStations,
  reviewFuelStation,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/mechanics/pending", getPendingMechanics);
router.patch("/mechanics/:id/review", reviewMechanic);
router.get("/fuel-stations/pending", getPendingFuelStations);
router.patch("/fuel-stations/:id/review", reviewFuelStation);

module.exports = router;
