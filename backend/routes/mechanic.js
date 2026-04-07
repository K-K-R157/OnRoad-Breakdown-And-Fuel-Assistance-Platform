const express = require("express");
const {
  getNearbyMechanics,
  getMechanicProfile,
  updateMechanicProfile,
  getMechanicRequests,
  updateMechanicRequestStatus,
  getMechanicStats,
} = require("../controllers/mechanicController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/nearby", getNearbyMechanics);

router.use(protect, authorize("mechanic"));
router.get("/me", getMechanicProfile);
router.put("/me", updateMechanicProfile);
router.get("/requests", getMechanicRequests);
router.patch("/requests/:id/status", updateMechanicRequestStatus);
router.get("/stats", getMechanicStats);

module.exports = router;
