const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const addressDecoder = require('../util/location');
const Place = require('../models/place');
const HttpError = require('../models/http-error');
const User = require('../models/user');

//Get place by place ID
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not find a place',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Could not find place with the id', 404);
    return next(error);
  }

  console.log(place);
  res.json({ place: place.toObject({ getters: true }) });
};

//Get places by creator
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not find a place',
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError('Could not find place for the provided user id', 404)
    );
  }
  console.log(places);
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

//Create a place
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('Invalid inputs passed', 422));
  }
  const { title, description, address, creator } = req.body;

  let latitude;
  let longitude;

  const coordinates = await addressDecoder.forwardGeocoding(
    address,
    async (body) => {
      console.log('BODY: ', body);
      latitude = body.center[1];
      longitude = body.center[0];

      const createdPlace = new Place({
        title: title,
        description: description,
        address: address,
        latitude: latitude,
        longitude: longitude,
        image: req.file.path,
        creator: creator,
      });

      let user;

      try {
        user = await User.findById(creator);
      } catch (err) {
        console.log(err);
        const error = new HttpError(
          'Creating place failed, please try again',
          500
        );
        return next(error);
      }

      if (!user) {
        const error = new HttpError(
          'Could not find user for the provided id',
          404
        );
        return next(error);
      }

      //session and transaction
      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
      } catch (err) {
        console.log(err);
        const error = new HttpError(
          'Creating place failed, please try again.',
          500
        );
        return next(error);
      }

      console.log('Created Place: ', createdPlace);
      res.status(201).json({ place: createdPlace });
    }
  );
};

//Update a place
const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('Invalid inputs passed', 422));
  }
  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    console.log(err);
    const error = new HttpError('Something went wrong', 500);
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this place', 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

//Delete a place
const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('could not find a place with the id', 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this place',
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: 'Deleted place' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
