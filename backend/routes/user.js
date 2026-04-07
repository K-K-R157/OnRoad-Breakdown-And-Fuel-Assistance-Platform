const express = require("express");
const {
  getProfile,
  updateProfile,
  createMechanicRequest,
  getMyMechanicRequests,
  cancelMyMechanicRequest,
  createFuelRequest,
  getMyFuelRequests,
  cancelMyFuelRequest,
  createChargingRequest,
  getMyChargingRequests,
  cancelMyChargingRequest,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("user", "admin"));

router.get("/me", getProfile);
router.put("/me", updateProfile);

router.post("/requests/mechanic", createMechanicRequest);
router.get("/requests/mechanic", getMyMechanicRequests);
router.patch("/requests/mechanic/:id/cancel", cancelMyMechanicRequest);

router.post("/requests/fuel", createFuelRequest);
router.get("/requests/fuel", getMyFuelRequests);
router.patch("/requests/fuel/:id/cancel", cancelMyFuelRequest);

router.post("/requests/charging", createChargingRequest);
router.get("/requests/charging", getMyChargingRequests);
router.patch("/requests/charging/:id/cancel", cancelMyChargingRequest);

module.exports = router;
