var restaurantManager = (function() {
  var restaurants = [];
  var visitStore = {};

  return {
    addRestaurant: function(restaurant) {
      restaurants.push(restaurant);
    },
    getVisitCount: function(placeID) {
      return visitStore[placeID];
    },
    deleteRestaurant: function(restaurantId) {
      restaurants = restaurants.filter(function(r) { return r.restaurantId !== restaurantId })
    },
    setVisitStore: function(data) {
      visitStore = data;
    },
    showNearby: function(query) {
      mapManager.showPlaces(userManager.getLocation(), 'location', query);
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
    detectUserLocation: function(success_cb, failed_cb) {
      if (!navigator.geolocation) failed_cb();

      var that = this;
      navigator.geolocation.getCurrentPosition(
        function(position) {
          currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude }
          success_cb(currentLocation);
        },
        failed_cb
      );
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
    addMarker: function(location, infoContent, isCurrentLocation) {
      var marker_options = {
        map: map,
        position: location
      }
      if (isCurrentLocation) {
        marker_options.icon = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          strokeColor: "#33C3F0"
        }
      }
      var marker = new google.maps.Marker(marker_options);
      bounds.extend(marker.position);
      map.fitBounds(mapManager.getBounds());
      this.addInfoWindow(marker, infoContent);
      if (!isCurrentLocation) markers.push(marker);
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
      var visits = restaurantManager.getVisitCount(place.place_id);

      return '<div class="content" style="min-width:22em;">' +
      '<h5>' + place.name + '</h5>' +
      '<b>Ratings: </b>' + (place.rating || '-') + '<br>' +
       '<b>Place visits: </b>' + (visits || '-') + '<br>' +
        '<br><p>' +
          '<a target="_blank" href="'+ place.url +'">View Restaurant Details</a> <br>' +
          '<a onclick="placeVisited(' + "\'" + place.place_id + "\'" + ')" target="_blank" href="'+ mapsDirUrl +'">Get Directions</a>' +
        '</p>'
      '</div>';
    },
    showPlaces: function(location, searchBy, query) {
      var options = {
        searchBy: searchBy,
        location: location,
        query: query
      }
      placeServiceMgr.search(options, this.placeResultsHandler);
    },
    placeResultsHandler: function(results, status) {
      if (results && !results.length) {
        notificationManager.showNotification('No results found in that area. Please select again.', 3000)
      }

      if (status == google.maps.places.PlacesServiceStatus.OK) {
        mapManager.removeAllMarkers(null);
        for (var i = 0; i < results.length; i++) {
          placeServiceMgr.getPlace(results[i].place_id, mapManager.placeDetailsResultHandler);
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

var placeServiceMgr = (function() {
  var service;
  var radius = '600'

  return {
    init: function(map) {
      service = new google.maps.places.PlacesService(map);
    },
    search: function(options, success_cb) {
      var request = { types: ['restaurant'] };
      var searchBy = options.searchBy;
      var location = options.location;
      var query = options.query || null;

      if (searchBy == 'bounds') {
          request.bounds = location
      }
      if (searchBy == 'location') {
          request.location = location
          request.radius = radius
      }
      if (query) {
        request.query = query;
        service.textSearch(request, success_cb);
      }
      else {
        service.nearbySearch(request, success_cb);
      }
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
      mapManager.showPlaces(rectangle.getBounds(), 'bounds', cuisineFilterManager.getCuisine());
    }
  }
})();

var firebaseManager = (function() {
  var database;
  var firebase;
  var config = {
    apiKey: "AIzaSyCgc5Es2L9OXGkUUs0isgMR9llyC3i3dJE",
    authDomain: "restaurant-finder-fffe2.firebaseapp.com",
    databaseURL: "https://restaurant-finder-fffe2.firebaseio.com",
    projectId: "restaurant-finder-fffe2",
    storageBucket: "restaurant-finder-fffe2.appspot.com",
    messagingSenderId: "372801752957"
  };

  return {
    init: function(f) {
      firebase = f
      firebase.initializeApp(config);
      database = firebase.database();

      this.getAll(function(data) {
        restaurantManager.setVisitStore(data);
      });
    },
    getAll: function(success_cb) {
      firebase.database().ref('/visited').once('value').then(function(snapshot) {
        success_cb(snapshot.val());
      });
    },
    increment: function(key){
      var databaseRef = firebase.database().ref('/visited').child(key);
        databaseRef.transaction(function(val) {
          return (val || 0) + 1;
        });
    }
  }
})();

var notificationManager = (function() {
  var el;

  return {
    init: function(element) {
      el = element;
      this.hideNotification();
    },
    showNotification: function(text, timeout) {
      if (text) { this.setNotificationText(text) }
      document.getElementById(el).style.visibility = "visible";
      if (timeout) { this.hideAfter(timeout); }
    },
    hideNotification: function() {
      document.getElementById(el).style.visibility = "hidden";
    },
    setNotificationText: function(text) {
      document.getElementById(el).textContent = text;
    },
    hideAfter: function(t) {
      var that = this;
      setTimeout(function () { that.hideNotification() }, t);
    }
  }
})();

var cuisineFilterManager = (function() {
  var ul;
  var cuisine;
  var isFilterOn;
  var cuisines = ['African', 'Asian', 'Barbecue', 'Brazilian',
    'Breakfast', 'Cafe', 'Chinese', 'Hawaii',
    'Doughnut', 'European', 'Fast food', 'Hamburger',
    'Ice cream', 'Indian', 'Indonesian', 'Irish', 'Italian', 'Jamaican',
    'Japanese', 'Jewish', 'Korean', 'Malaysian', 'Mediterranean',
    'Mexican', 'Moroccan', 'Peruvian', 'Philippine',
    'Polish', 'Portuguese', 'Russian', 'Sausage', 'Seafood', 'Soul food',
    'Spanish Cuisine', 'Sri Lankan', 'Steak', 'Street food', 'Sushi', 'Swiss',
    'Tapas', 'Thai', 'Tunisian', 'Turkish', 'Vegetarian', 'Vietnamese']

  return {
    init: function(ul) {
      this.ul = ul;
      return this;
    },
    getCuisine: function() {
      return this.cuisine;
    },
    addCuisines: function() {
      for (var i = 0; i < cuisines.length; i++) {
        var cuisineVal = cuisines[i].replace(/ /g,'').toLowerCase();

        var li = document.createElement('li');
        li.setAttribute("class", "cuisine");

        var checkbox = document.createElement('input');
        checkbox.type = "radio";
        checkbox.name = "cuisine";
        checkbox.value = cuisineVal;
        checkbox.id = cuisineVal;

        var label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(cuisines[i]));

        li.appendChild(label);
        this.ul.appendChild(li);
      }
    },
    enableFilter: function(on_off, cuisine) {
      this.isFilterOn = on_off;
      this.cuisine = cuisine;
    }
  }
})();
