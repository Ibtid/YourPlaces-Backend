const express = require('express');
const { check } = require('express-validator');

const router = express.Router();

const placesController = require('../controllers/places-controllers');

router.get('/:pid', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

router.post(
  '/',
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placesController.createPlace
);

router.patch(
  '/:pid',
  [check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
  placesController.updatePlaceById
);

router.delete('/:pid', placesController.deletePlaceById);

module.exports = router;
