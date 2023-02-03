const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErros');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // below: remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  //   passwordChangedAt: req.body.passwordChangedAt,
  // });

  // creating a token with NPM jsonwebtoken
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1 Check if email & password exist
  if (!email || !password) {
    return next(new AppError('Please provide email & password', 400));
  }
  // 2 Check if user exist & password correct
  // le '+' permet d'accèder à une valeur caché de la DB
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or Password', 401));
  }
  // 3 If all good, send token to client
  createAndSendToken(user, 200, res);
});

// On créé un cookie éphémère pour le logOut (sans token) qui ecrasera le cookie du login (qui lui est protégé)
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get the token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError('You are not logged in', 401));
  // 2. Verification the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log('1', decoded);
  // 3. Check if user still exists (optionnal?)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('User no longer exists', 401));
  // 4. Check if user changed password after the token was issued (optionnal?)
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password', 401));
  }
  // grant acces to protected road -
  // on permet l'accès aux infos de l'user au middleweare suivant (grace à req.user)
  // console.log('2', currentUser);
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rended pages, no error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1/verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 2. Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 3. Check if user changed password after the token was issued (optionnal?)
      if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Technique pour ajouter des paramètres à un middleweare
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // Roles ['admin', 'lead-guide']
    // console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Acces refused', 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email adress'), 404);
  }
  //2 Generate the randomn reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3 Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and password confirm to ${resetURL}.
  If you didn't forgert your password, please ignore`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset Token (valid 10mn)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending an email'), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on token
  // on crypte le token reçu via le url pour le comparer avec celui de la DB
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // ci dessous: l'user ne sera pas créé si la condition n'est pas correcte
    passwordResetExpires: { $gt: Date.now() },
  });
  //2 Set new password if token not expired & user exists
  if (!user) return next(new AppError('Token is invalid or expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3 Update changedPasswordAt property for the current user

  //4 Log the user in, send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  //2. Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect Password', 401));
  }
  // 3. If password correct, update it
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will not works as intended! (we loose pre-middleweare & password's validator)

  //4. Log user in, send JWT
  createAndSendToken(user, 200, res);

  next();
});
