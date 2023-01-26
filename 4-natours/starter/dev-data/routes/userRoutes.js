const express = require('express');

const router = express.Router();
const tourController = require('../controllers/userController');
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router
  .route('/')
  .get(tourController.getAllUsers)
  .post(tourController.createUser);

router
  .route('/:id')
  .get(tourController.getUser)
  .patch(tourController.updateUser)
  .delete(tourController.deleteUser);

module.exports = router;
