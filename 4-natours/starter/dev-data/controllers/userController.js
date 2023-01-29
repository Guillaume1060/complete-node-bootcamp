const User = require('../models/userModel');
const AppError = require('../utils/appErros');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.Create an error if user change the POST password (there is an other road for that in authentification)
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('No update of password on this pagre', 400));
  // 2. Filter our unwanted fieldsname not allowed
  const fliteredBody = filterObj(req.body, 'name', 'email');
  // 3.Update user's document
  console.log(req.user.id);
  const updatedUser = await User.findByIdAndUpdate(req.user._id, fliteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'succes',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this road is not yet completed',
  });
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this road is not yet completed',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this road is not yet completed',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this road is not yet completed',
  });
};
