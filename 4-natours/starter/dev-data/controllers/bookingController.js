const Tour = require('../models/tourModel');
const AppError = require('../utils/appErros');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
// Below we automtically log with our secretKey from our stripe website:
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(tour);
  // 2. Create checkout session
  // (NPM I STRIPE)
  // Problème to fix
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}.jpg`],
        price: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3. Create session as response
  res.status(200).json({
    status: success,
    session,
  });
});
