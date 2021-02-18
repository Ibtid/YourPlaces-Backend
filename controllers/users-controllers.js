const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    console.log(err);
    const error = new HttpError('Fetching failed', 500);
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('Invalid inputs passed', 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log(err);
    const error = new HttpError('Signing up failed, try again', 500);
    return next(error);
  }

  console.log(existingUser);
  if (existingUser) {
    const error = new HttpError('User Already Exist', 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password,
    image: 'www.google.com',
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Sign up failed, please try again.', 500);
    return next(error);
  }

  console.log('Created Place: ', createdUser);
  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    console.log(err);
    const error = new HttpError('Logging in failed, try again', 500);
    return next(error);
  }
  console.log('Existing user: ', existingUser);
  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError('Invalid Credentials', 401);
    return next(error);
  }

  res.json({ message: 'Logged in' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
