var restaurantManager = (function() {
  var restaurants = [];

  return {
    addRestaurant: function(restaurant) {
      restaurants.push(restaurant);
    },
    getCount: function() {
      return restaurants.length;
    },
    deleteRestaurant: function(restaurantId) {
      restaurants = restaurants.filter(function(r) { return r.restaurantId !== restaurantId })
    }
  }
})();

var userManager = (function() {
  var currentLocation = {};

  return {
    getLocation: function() {
      return currentLocation;
    },
    setLocation: function(location) {
      currentLocation = location
    }
  }
})();

var mapManager = (function() {
  var map;
  var bounds;
  var infowindow;

  return {
    init: function(options) {
      map = new google.maps.Map(options.element,
        { center: options.location, zoom: 11 });
      bounds = new google.maps.LatLngBounds();
      infowindow = new google.maps.InfoWindow();
      return this;
    },
    getMap: function() {
      return map;
    },
    getBounds: function() {
      return bounds;
    },
    getInfoWindow: function() {
      return infowindow;
    },
    setCenter: function(location) {
      map.setCenter(location);
    },
    getCenter: function(location) {
      return map.getCenter();
    }
  }
})();

var placeServiceMgr = (function() {
  var service;

  return {
    init: function(map) {
      service = new google.maps.places.PlacesService(map);
    },
    search: function(location, success_cb) {
      var request = {
        location: location,
        radius: '600',
        types: ['restaurant']
      };
      service.nearbySearch(request, success_cb);
    },
    getPlace: function(placeID, success_cb) {
      service.getDetails({placeId: placeID}, success_cb);
    }
  }
})();
