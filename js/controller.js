function initMap() {
  // set default location in case user doesnt allow to detect their location
  var Tokyo = { lat: 35.689487, lng: 139.691706 };
  userManager.setLocation(Tokyo);

  var options = {
    element: document.getElementById('map'),
    location: userManager.getLocation()
  }
  mapManager.init(options)

  userManager.detectUserLocation(locationDetected);
  initializeServices();

  document.getElementById('start_drawing').addEventListener('click', startDrawing);
  document.getElementById('stop_drawing').addEventListener('click', stopDrawing);
}

function locationDetected(coordinates) {
  userManager.setLocation(coordinates);
  mapManager.setCenter(coordinates);
  restaurantManager.showPlacesNearLocation(mapManager.getCenter());
}

function initializeServices() {
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
  alert("offline");
}
