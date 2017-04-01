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
    },
    showPlacesNearLocation: function(location) {
      placeServiceMgr.search(location, 'location', this.placeResultsHandler);
    },
    showPlacesInArea: function(bounds) {
      placeServiceMgr.search(bounds, 'bounds', this.placeResultsHandler);
    },
    placeResultsHandler: function(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          placeServiceMgr.getPlace(results[i].place_id, restaurantManager.placeDetailsResultHandler);
        }
      }
      if (status === 'UNKNOWN_ERROR') {
        document.dispatchEvent(new Event('offline'));
      }
    },
    placeDetailsResultHandler: function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        restaurantManager.addRestaurant(place);
        mapManager.addMarker(place.geometry.location, mapManager.getInfoContent(place));
      }
      if (status === 'UNKNOWN_ERROR') {
        document.dispatchEvent(new Event('offline'));
      }
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
    },
    detectUserLocation: function(success_cb) {
      if (!navigator.geolocation) this.handleLocationError(false);

      var that = this;
      navigator.geolocation.getCurrentPosition(
        function(position) {
          currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude }
          success_cb(currentLocation);
        },
        function() { that.handleLocationError(true); }
      );
    },
    handleLocationError: function(browserHasGeolocation) {
      console.log("Couldnt detect location");
      restaurantManager.showPlacesNearLocation(mapManager.getCenter());
    }
  }
})();

var mapManager = (function() {
  var map;
  var bounds;
  var infowindow;
  var markers = [];

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
    },
    addMarker: function(location, infoContent) {
      var marker = new google.maps.Marker({
        map: map,
        position: location
      });
      bounds.extend(marker.position);
      map.fitBounds(mapManager.getBounds());

      this.addInfoWindow(marker, infoContent);
      markers.push(marker);
    },
    addInfoWindow(marker, content) {
      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(content);
        infowindow.open(map, this);
      });
    },
    showMarkers: function(map) {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
      }
    },
    removeAllMarkers: function() {
      this.showMarkers(null);
      markers = []
    },
    getInfoContent: function(place) {
      var origin = userManager.getLocation().lat + ',' + userManager.getLocation().lng;
      var destination = place.formatted_address + ' ' + place.name
      var mapsDirUrl = 'https://www.google.co.jp/maps/dir/' +
        origin + '/' + destination;

      return '<div class="content" style="min-width:22em;">' +
      '<h5>' + place.name + '</h5>' +
        '<p>' +
          '<a target="_blank" href="'+ place.url +'">View Place</a> <br>' +
          '<a target="_blank" href="'+ mapsDirUrl +'">Get Directions</a> <br>' +
        '</p>'
      '</div>';
    }
  }
})();

var placeServiceMgr = (function() {
  var service;

  return {
    init: function(map) {
      service = new google.maps.places.PlacesService(map);
    },
    search: function(location, searchBy, success_cb) {
      var request = { types: ['restaurant'] };

      if (searchBy == 'bounds') {
          request.bounds = location
      }
      if (searchBy == 'location') {
          request.location = location
          request.radius = '600'
      }
      service.nearbySearch(request, success_cb);
    },
    getPlace: function(placeID, success_cb) {
      service.getDetails({placeId: placeID}, success_cb);
    }
  }
})();

var drawingManager = (function() {
  var drawService;
  var rectangle = null;

  return {
    init: function(onRectangleComplete) {
      drawService = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: ['rectangle']
        },
      });
      drawService.addListener('overlaycomplete', this.onRectangleComplete);
      return this;
    },
    enableDrawing: function(map) {
      drawService.setMap(map);
    },
    disableDrawing: function() {
      if (drawService.map) {
          if (rectangle) {rectangle.setMap(null);}
          drawService.setMap(null);
      }
    },
    onRectangleComplete: function(event) {
      // on rectangular draw
      if (event) {
        if (rectangle) rectangle.setMap(null);
        rectangle = event.overlay;
        rectangle.setEditable(true);
        rectangle.addListener('bounds_changed', drawingManager.onRectangleComplete);
      }
      mapManager.removeAllMarkers(null);
      drawService.setDrawingMode(null);
      restaurantManager.showPlacesInArea(rectangle.getBounds());
    }
  }
})();
