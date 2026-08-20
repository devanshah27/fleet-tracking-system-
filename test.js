const http = require('http');

const data = JSON.stringify({
  vehicleId: 'Truck-101',
  latitude: 40.7128,
  longitude: -74.0060
});

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/location',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
