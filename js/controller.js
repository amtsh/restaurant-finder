function initMap() {
  // set default location in case user doesnt allow to detect their location
  var Tokyo = { lat: 35.681333, lng: 139.766290 };
  userManager.setLocation(Tokyo);

  var options = {
    element: document.getElementById('map'),
    location: userManager.getLocation()
  }
  mapManager.init(options)
  initializeServices();

  userManager.detectUserLocation(locationDetected, handleLocationError);
  document.getElementById('start_drawing').addEventListener('click', startDrawing);
  document.getElementById('stop_drawing').addEventListener('click', stopDrawing);
}

function locationDetected(coordinates) {
  notificationManager.showNotification("Location detected.", 3000);
  userManager.setLocation(coordinates);
  mapManager.setCenter(coordinates);
  mapManager.addMarker(coordinates, 'Your Location', true);
  restaurantManager.showNearby()
}

function handleLocationError() {
  notificationManager.showNotification("Couldnt detect location", 3000);
  mapManager.addMarker(mapManager.getCenter(), 'Default Location', true);
  userManager.setLocation(mapManager.getCenter())
  restaurantManager.showNearby()
}

function initializeServices() {
  notificationManager.init('notification');
  placeServiceMgr.init(mapManager.getMap());
  drawingManager.init();
}

function startDrawing() {
  drawingManager.enableDrawing(mapManager.getMap());
}

function stopDrawing() {
  drawingManager.disableDrawing();
}

document.addEventListener('offline', handleOffline);

function handleOffline() {
  notificationManager.showNotification("Offline", 3000);
}

function placeVisited(placeID) {
  firebaseManager.increment(placeID);
}

function firebase_init() {
  firebaseManager.init(firebase);
}
