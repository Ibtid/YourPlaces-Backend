const request = require('request');
var ACCESS_TOKEN =
  'pk.eyJ1IjoiaWJ0aWRyYWhtYW4iLCJhIjoiY2tibzZ1dmJoMXptMzM1cXZmZWl6c2d3YyJ9.MQFAvX513awEJnETltcXEQ';

const forwardGeocoding = async (address, cb) => {
  var url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    encodeURIComponent(address) +
    '.json?access_token=' +
    ACCESS_TOKEN +
    '&limit=1';

  const response = await request(
    { url: url, json: true },
    function (error, response) {
      if (error) {
        callback('Unable to connect to Geocode API', undefined);
      } else if (response.body.features.length == 0) {
        callback(
          'Unable to find location. Try to ' + 'search another location.'
        );
      } else {
        var longitude = response.body.features[0].center[0];
        var latitude = response.body.features[0].center[1];
        var location = response.body.features[0].place_name;

        console.log('Latitude :', latitude);
        console.log('Longitude :', longitude);
        console.log('Location :', location);
        cb(response.body.features[0]);
      }
    }
  );
};

exports.forwardGeocoding = forwardGeocoding;
