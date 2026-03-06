const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Service provider is required'],
    refPath: 'serviceType'
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['Mechanic', 'FuelStation']
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Request reference is required'],
    refPath: 'requestType'
  },
  requestType: {
    type: String,
    required: true,
    enum: ['MechanicRequest', 'FuelRequest']
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  categories: {
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  response: {
    type: String,
    trim: true,
    maxlength: [300, 'Response cannot exceed 300 characters']
  },
  respondedAt: {
    type: Date
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: true 
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other']
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  flaggedAt: {
    type: Date
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: {
    type: [String],
    validate: {
      validator: function(images) {
        return images.length <= 3;
      },
      message: 'Cannot upload more than 3 images'
    }
  }
}, {
  timestamps: true
});

feedbackSchema.index({ serviceProvider: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ serviceType: 1, rating: -1 });
feedbackSchema.index({ request: 1 }, { unique: true });  
feedbackSchema.index({ isPublic: 1, isApproved: 1 });

feedbackSchema.index({ serviceProvider: 1, isPublic: 1, isApproved: 1, createdAt: -1 });

feedbackSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingFeedback = await this.constructor.findOne({
      request: this.request,
      user: this.user
    });
    
    if (existingFeedback) {
      return next(new Error('Feedback already submitted for this request'));
    }
  }
  next();
});

feedbackSchema.post('save', async function() {
  try {
    const Model = mongoose.model(this.serviceType);
    const provider = await Model.findById(this.serviceProvider);
    
    if (provider && provider.calculateAverageRating) {
      provider.calculateAverageRating(this.rating);
      await provider.save();
    }
  } catch (error) {
    console.error('Error updating provider rating:', error);
  }
});

feedbackSchema.post('remove', async function() {
  try {
    const Model = mongoose.model(this.serviceType);
    const provider = await Model.findById(this.serviceProvider);
    
    if (provider) {
      const allFeedback = await this.constructor.find({
        serviceProvider: this.serviceProvider,
        isApproved: true
      });
      
      if (allFeedback.length > 0) {
        const totalRating = allFeedback.reduce((sum, fb) => sum + fb.rating, 0);
        provider.rating = Math.round((totalRating / allFeedback.length) * 10) / 10;
        provider.totalRatings = allFeedback.length;
      } else {
        provider.rating = 0;
        provider.totalRatings = 0;
      }
      
      await provider.save();
    }
  } catch (error) {
    console.error('Error updating provider rating after deletion:', error);
  }
});

feedbackSchema.methods.addResponse = async function(responseText) {
  this.response = responseText;
  this.respondedAt = new Date();
  return await this.save();
};

feedbackSchema.methods.flag = async function(reason, flaggedBy) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flaggedBy = flaggedBy;
  this.flaggedAt = new Date();
  return await this.save();
};

feedbackSchema.methods.voteHelpful = async function(userId) {
  const alreadyVoted = this.helpfulVotes.some(
    vote => vote.user.toString() === userId.toString()
  );
  
  if (alreadyVoted) {
    throw new Error('You have already voted this feedback as helpful');
  }
  
  this.helpfulVotes.push({ user: userId });
  this.helpfulCount = this.helpfulVotes.length;
  return await this.save();
};

feedbackSchema.methods.removeHelpfulVote = async function(userId) {
  this.helpfulVotes = this.helpfulVotes.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  this.helpfulCount = this.helpfulVotes.length;
  return await this.save();
};

feedbackSchema.statics.getProviderFeedback = function(providerId, options = {}) {
  const query = {
    serviceProvider: providerId,
    isPublic: true,
    isApproved: true
  };
  
  if (options.minRating) {
    query.rating = { $gte: options.minRating };
  }
  
  if (options.maxRating) {
    query.rating = { ...query.rating, $lte: options.maxRating };
  }
  
  return this.find(query)
    .populate('user', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20);
};

feedbackSchema.statics.getRatingDistribution = async function(providerId) {
  return this.aggregate([
    {
      $match: {
        serviceProvider: mongoose.Types.ObjectId(providerId),
        isPublic: true,
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

feedbackSchema.statics.getAverageCategoryRatings = async function(providerId) {
  return this.aggregate([
    {
      $match: {
        serviceProvider: mongoose.Types.ObjectId(providerId),
        isPublic: true,
        isApproved: true
      }
    },
    {
      $group: {
        _id: null,
        avgTimeliness: { $avg: '$categories.timeliness' },
        avgProfessionalism: { $avg: '$categories.professionalism' },
        avgQuality: { $avg: '$categories.quality' },
        avgCommunication: { $avg: '$categories.communication' },
        avgValue: { $avg: '$categories.value' }
      }
    }
  ]);
};

feedbackSchema.statics.getUserFeedback = function(userId) {
  return this.find({ user: userId })
    .populate('serviceProvider', 'name stationName profilePicture')
    .sort({ createdAt: -1 });
};

feedbackSchema.statics.getRecentFeedback = function(limit = 10) {
  return this.find({
    isPublic: true,
    isApproved: true
  })
  .populate('user', 'name profilePicture')
  .populate('serviceProvider', 'name stationName profilePicture')
  .sort({ createdAt: -1 })
  .limit(limit);
};

feedbackSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' year' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' month' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' day' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago';
  
  return 'Just now';
});

feedbackSchema.set('toJSON', { virtuals: true });
feedbackSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Feedback', feedbackSchema);