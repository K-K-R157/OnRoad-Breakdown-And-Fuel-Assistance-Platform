const express = require("express");
const {
  getDashboard,
  getPendingMechanics,
  reviewMechanic,
  getPendingFuelStations,
  reviewFuelStation,
  getAllUsers,
  getAllMechanics,
  getAllFuelStations,
  revokeMechanic,
  revokeFuelStation,
  getActiveMechanicRequests,
  getActiveFuelRequests,
  getAllFeedback,
} = require("../controllers/adminController");
const { getProfile, updateProfile } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/me", getProfile);
router.put("/me", updateProfile);

router.get("/dashboard", getDashboard);

router.get("/users", getAllUsers);

router.get("/mechanics/pending", getPendingMechanics);
router.get("/mechanics/all", getAllMechanics);
router.patch("/mechanics/:id/review", reviewMechanic);
router.patch("/mechanics/:id/revoke", revokeMechanic);

router.get("/fuel-stations/pending", getPendingFuelStations);
router.get("/fuel-stations/all", getAllFuelStations);
router.patch("/fuel-stations/:id/review", reviewFuelStation);
router.patch("/fuel-stations/:id/revoke", revokeFuelStation);

router.get("/mechanic-requests/active", getActiveMechanicRequests);
router.get("/fuel-requests/active", getActiveFuelRequests);
router.get("/feedback/all", getAllFeedback);

module.exports = router;
