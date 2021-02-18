const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

//routes
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route', 404);
  throw error;
});

//middleware function that executes when there is an error
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  console.log(error);
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occured!' });
});

mongoose
  .connect(
    'mongodb://Ibtid:g0198tid12@cluster0-shard-00-00.uc1oq.mongodb.net:27017,cluster0-shard-00-01.uc1oq.mongodb.net:27017,cluster0-shard-00-02.uc1oq.mongodb.net:27017/places?ssl=true&replicaSet=atlas-703f7a-shard-0&authSource=admin&retryWrites=true&w=majority'
  )
  .then(() => {
    app.listen(5000, () => {
      console.log('Server running in port 5000');
    });
  })
  .catch((err) => {
    console.log(err);
  });
