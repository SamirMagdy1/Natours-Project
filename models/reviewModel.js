const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// compound index to avoid duplicated reviews form the same user
// all compination of tour and user must be unique
// each user have only one review on each tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   })
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// CountReviews & Calculating averageRating for each tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this here refere to the model, we want to apply aggregate to it, return promise so we need to await, store it
  const stats = await this.aggregate([
    //first stage to get the tour
    {
      $match: { tour: tourId },
    },
    {
      // second stage,
      $group: {
        _id: '$tour', //grouping all reviews with common field "sameTourID"
        nRating: { $sum: 1 }, // conunting reviews
        avgRating: { $avg: '$rating' }, // calculate averageRating using rating property
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    // save and update the tour with last stats
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// MiddleWare that call calcAverageRatings after review being created and saved in db
reviewSchema.post('save', function () {
  // this points to current review, constructor points to model who created that document "Review", we cannot use Review here because it does not decrealed yet
  this.constructor.calcAverageRatings(this.tour); // this.tour have tour id only
});

//findByIdAndUpdate
//findByIdAndDelete
// we need to get access to the current review document but all we have here is the query, so we will excute the qurey and it will give us the current document being accessed, by hooking "detecting" any query starts with findOneAnd "findByIdAnd"

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // pre => before excute the original query
  // this points to original query,
  this.r = await this.findOne(); // retriving the current document form db by excute the query using findOne and store the document with the query to have access on that document
  // console.log(this.r);
  next();
});

// post => after excuteing the original query
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does not work here, query has already excuted
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
