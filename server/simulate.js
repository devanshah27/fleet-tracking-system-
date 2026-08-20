const axios = require("axios");

// Fetch real road route using OSRM (Free industry-standard routing API)
const getRoute = async (startLng, startLat, endLng, endLat) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  try {
    const res = await axios.get(url);
    const coords = res.data.routes[0].geometry.coordinates;
    // OSRM gives [lng, lat], convert to [lat, lng]
    return coords.map(c => [c[1], c[0]]);
  } catch (error) {
    console.error(`Error fetching route: ${error.message}`);
    return [[startLat, startLng], [endLat, endLng]]; // Fallback
  }
};

async function startSimulation() {
  console.log("Fetching routes for vehicles...");
  
  // Define 3 distinct routes across Ahmedabad
  const route1 = await getRoute(72.5714, 23.0225, 72.5800, 23.0300); // City center
  const route2 = await getRoute(72.5000, 23.0100, 72.5200, 23.0500); // Thaltej area
  const route3 = await getRoute(72.6000, 22.9900, 72.6300, 23.0200); // Maninagar area

  const vehicles = [
    { id: "Truck-101", route: route1, index: 0 },
    { id: "Truck-202", route: route2, index: 0 },
    { id: "Truck-303", route: route3, index: 0 }
  ];

  console.log("Routes fetched. Starting simulation...");

  setInterval(() => {
    vehicles.forEach(v => {
      if (v.index < v.route.length) {
        const [lat, lng] = v.route[v.index];
        
        axios.post("http://localhost:5005/location", {
          vehicleId: v.id,
          latitude: lat,
          longitude: lng
        }).catch(() => { /* ignore connection errors */ });

        v.index++;
      } else {
        // Loop back to start
        v.index = 0;
      }
    });

    console.log("Sent route updates for all vehicles");
  }, 2000);
}

startSimulation();
