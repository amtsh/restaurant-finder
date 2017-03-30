function setUserLocation(location) {
  userManager.setLocation(location);
}

var detectUserLocation = function(success_cb) {
  // Try HTML5 geolocation.
  if (!navigator.geolocation) {
    // Browser doesn't support Geolocation
    handleLocationError(false);
  }

  navigator.geolocation.getCurrentPosition(
    function(position) {
      var coordinates = { lat: position.coords.latitude, lng: position.coords.longitude }
      success_cb(coordinates);
    },
    function() { handleLocationError(true); }
  );
}

var handleLocationError = function (browserHasGeolocation) {
  console.log("Couldnt detect location");
  showNearbyRestaurants();
}

function showNearbyRestaurants() {
  placeServiceMgr.search(mapManager.getCenter(), placeResultsHandler);
}

function placeResultsHandler(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      placeServiceMgr.getPlace(results[i].place_id, placeDetailsResultHandler);
    }
  }
}

function placeDetailsResultHandler(place, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    console.log(place)
    restaurantManager.addRestaurant(place);
    createMarker(mapManager.getMap(), place, mapManager.getInfoWindow());
    }
}

function createMarker(map, place, infowindow) {

  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });
  mapManager.getBounds().extend(marker.position);
  mapManager.getMap().fitBounds(mapManager.getBounds());

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}
