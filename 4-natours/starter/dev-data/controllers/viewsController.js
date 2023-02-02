const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // 1. Get tour datas from collection
  const tours = await Tour.find();
  // 2. Build template
  // 2. Render that template using tour data from 1.

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  // get data for requested tour (including reviews & guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  // build template

  // render template
  res.status(200).render('tour', {
    title: tour.slug,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

// const user = await Tour.findOne({ email: req.body.email });
// if (user.password !== req.body.password) return;
// render template
