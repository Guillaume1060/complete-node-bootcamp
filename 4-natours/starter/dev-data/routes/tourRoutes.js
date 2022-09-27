const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();

router.param('id', tourController.checkID);

// create a checkBody function
// check if body contains the name and the price property
// if not, send back 400 (bad request)
// add it to the post handler stack


router
    .route('/')
    .get(tourController.getAllTour)
    .post(tourController.checkBody, tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(tourController.deleteTour)

module.exports = router;