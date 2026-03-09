const Feedback = require("../models/Feedback");
const MechanicRequest = require("../models/Mechanicrequest");
const FuelRequest = require("../models/Fuelrequest");

exports.createFeedback = async (req, res) => {
  try {
    const {
      requestId,
      requestType,
      serviceType,
      serviceProviderId,
      rating,
      comment,
      categories,
      isPublic = true,
    } = req.body;

    if (!["MechanicRequest", "FuelRequest"].includes(requestType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid requestType" });
    }

    if (!["Mechanic", "FuelStation"].includes(serviceType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid serviceType" });
    }

    const RequestModel =
      requestType === "MechanicRequest" ? MechanicRequest : FuelRequest;
    const request = await RequestModel.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Linked request not found" });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own requests",
      });
    }

    if (requestType === "MechanicRequest" && request.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Feedback allowed only for completed mechanic requests",
      });
    }

    if (requestType === "FuelRequest" && request.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Feedback allowed only for delivered fuel orders",
      });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      serviceProvider: serviceProviderId,
      serviceType,
      request: requestId,
      requestType,
      rating,
      comment,
      categories,
      isPublic,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProviderFeedback = async (req, res) => {
  try {
    const { providerId } = req.params;
    const feedback = await Feedback.getProviderFeedback(providerId, {
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? Number(req.query.maxRating) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });

    const [distribution, categoryAverages] = await Promise.all([
      Feedback.getRatingDistribution(providerId),
      Feedback.getAverageCategoryRatings(providerId),
    ]);

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
      meta: {
        distribution,
        categoryAverages: categoryAverages[0] || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.getUserFeedback(req.user._id);
    res
      .status(200)
      .json({ success: true, count: feedback.length, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleHelpfulVote = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found" });
    }

    const alreadyVoted = feedback.helpfulVotes.some(
      (vote) => vote.user.toString() === req.user._id.toString(),
    );

    if (alreadyVoted) {
      await feedback.removeHelpfulVote(req.user._id);
    } else {
      await feedback.voteHelpful(req.user._id);
    }

    res
      .status(200)
      .json({ success: true, data: feedback, voted: !alreadyVoted });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.respondToFeedback = async (req, res) => {
  try {
    const { response } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found" });
    }

    if (req.userRole === "mechanic" && feedback.serviceType !== "Mechanic") {
      return res.status(403).json({
        success: false,
        message: "Not allowed to respond to this feedback",
      });
    }

    if (
      req.userRole === "fuelStation" &&
      feedback.serviceType !== "FuelStation"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to respond to this feedback",
      });
    }

    if (feedback.serviceProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only respond to feedback on your profile",
      });
    }

    await feedback.addResponse(response);

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
