const express = require("express");
const {
  createFeedback,
  getProviderFeedback,
  getMyFeedback,
  toggleHelpfulVote,
  respondToFeedback,
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/provider/:providerId", getProviderFeedback);

router.use(protect);
router.post("/", authorize("user"), createFeedback);
router.get("/me", authorize("user"), getMyFeedback);
router.post("/:id/helpful", toggleHelpfulVote);
router.post(
  "/:id/respond",
  authorize("mechanic", "fuelStation"),
  respondToFeedback,
);

module.exports = router;
