const User = require('../models/userModel');
const AppError = require('../utils/appErros');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
// NPM I MULTER
const multer = require('multer');
const sharp = require('sharp');

/// CI DESSOUS ON NOMME LE FICHIER, ET ON INFORME LA DESTINATION
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-76767555-665356.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

/// on modifie le multerStorage car on va redéfinir la size dans le prochain middleware avant de sauvegarder le fichier
/// l'image will be saved as a buffer
const multerStorage = multer.memoryStorage();
/// CI FILTRE POUR S'ASSURER DU TYPE DE FICHIER
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
// below uploadUserPhoto est le middleware exporté aux routes
exports.uploadUserPhoto = upload.single('photo');

// below middleware to resize the picture
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1.Create an error if user change the POST password (there is an other road for that in authentification)
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('No update of password on this pagre', 400));
  // 2. Filter our unwanted fieldsname not allowed
  const fliteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) fliteredBody.photo = req.file.filename;
  // 3.Update user's document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, fliteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
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
    message: 'this road is not defined! Please use /signUp instead',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do not update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
