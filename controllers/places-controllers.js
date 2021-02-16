const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const addressDecoder = require('../util/location');

const HttpError = require('../models/http-error');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous sky scrappers in the world!',
    lat: 40,
    lng: -73,
    address: '20 w 34th st, New York, NY 10001',
    creator: 'u1',
  },
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => {
    return p.id === placeId;
  });
  if (!place) {
    throw new HttpError('Could not find place with the id', 404);
  }
  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const places = DUMMY_PLACES.filter((p) => {
    return p.creator === userId;
  });
  if (!places || places.length === 0) {
    return next(
      new HttpError('Could not find place for the provided user id', 404)
    );
  }
  res.json({ places });
};

//Create a place
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    next(new HttpError('Invalid inputs passed', 422));
  }
  const { title, description, address, creator } = req.body;

  let lattitude;
  let longitude;

  const coordinates = await addressDecoder.forwardGeocoding(address, (body) => {
    console.log('BODY: ', body);
    lattitude = body.center[1];
    longitude = body.center[0];

    var createdPlace = {
      id: uuidv4(),
      title: title,
      description: description,
      lat: lattitude,
      lng: longitude,
      address: address,
      creator: creator,
    };

    DUMMY_PLACES.push(createdPlace);
    res.status(201).json({ place: createdPlace });
  });

  /*console.log('SAy', lattitude);

  var createdPlace = {
    id: uuidv4(),
    title: title,
    description: description,
    lat: lattitude,
    lng: longitude,
    address: address,
    creator: creator,
  };

  DUMMY_PLACES.push(createdPlace);
  res.status(201).json({ place: createdPlace });*/
};

//Update a place
const updatePlaceById = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError('Invalid inputs passed', 422);
  }
  const placeId = req.params.pid;
  const { title, description } = req.body;

  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);

  updatedPlace.title = title;
  updatedPlace.description = description;

  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ place: updatedPlace });
};

//Delete a place
const deletePlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
    throw new HttpError('Could not find a place for that id.', 404);
  }
  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);

  res.status(200).json({ message: 'Deleted place' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
