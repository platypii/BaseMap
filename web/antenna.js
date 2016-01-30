// Generated by CoffeeScript 1.10.0

/*
Antenna Map
 */

(function() {
  var addMarker, algorithmiaClient, boundsChanged, closeAllMarkers, geoMarker, icons, init, lastChange, lastQuery, map, markers, meters2feet, query, querying, updateMap;

  map = null;

  geoMarker = null;

  markers = {};

  querying = false;

  lastChange = null;

  lastQuery = null;

  algorithmiaClient = Algorithmia.client("simAKghMFZNPxZjkZ4PoxbpuXUW1");

  icons = ["icons/A-16.png", "icons/A-20.png", "icons/A-24.png", "icons/A-28.png", "icons/A-32.png", "icons/A-36.png", "icons/A-40.png"];

  init = function() {
    var center_lat, center_lon, geoZoom, zoom;
    center_lat = 39;
    center_lon = -100;
    zoom = 5;
    geoZoom = 11;
    google.maps.event.addDomListener(window, 'load', function() {
      var mapOptions;
      mapOptions = {
        zoom: zoom,
        center: new google.maps.LatLng(center_lat, center_lon),
        mapTypeId: google.maps.MapTypeId.HYBRID
      };
      map = new google.maps.Map(document.getElementById('map'), mapOptions);
      if (navigator.geolocation) {
        geoMarker = new GeolocationMarker;
        google.maps.event.addListenerOnce(geoMarker, 'position_changed', function() {
          map.setZoom(geoZoom);
          map.setCenter(this.getPosition());
        });
        google.maps.event.addListener(geoMarker, 'geolocation_error', function(e) {
          console.error('There was an error obtaining your position.\n\nMessage: ' + e.message);
        });
        geoMarker.setMap(map);
      }
      map.addListener('bounds_changed', boundsChanged);
      map.addListener('click', closeAllMarkers);
    });
  };

  boundsChanged = function() {
    var bounds, ne, sw;
    lastChange = new Date();
    bounds = map.getBounds();
    if (bounds) {
      ne = bounds.getNorthEast();
      sw = bounds.getSouthWest();
      if (!querying) {
        querying = true;
        lastQuery = lastChange;
        query(sw.lat(), ne.lat(), sw.lng(), ne.lng(), function(antennas) {
          console.log("got " + antennas.length + " antennas");
          updateMap(antennas);
          querying = false;
          if (lastQuery < lastChange) {
            boundsChanged();
          }
        });
      }
    }
  };

  updateMap = function(antennas) {
    var antenna, i, id, j, len, len1, marker, newIds, oldIds;
    oldIds = Object.keys(markers);
    newIds = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = antennas.length; i < len; i++) {
        antenna = antennas[i];
        results.push(antenna.id);
      }
      return results;
    })();
    for (i = 0, len = oldIds.length; i < len; i++) {
      id = oldIds[i];
      if (newIds.indexOf(id) === -1) {
        marker = markers[id];
        marker.setMap(null);
        delete markers[id];
      }
    }
    for (j = 0, len1 = antennas.length; j < len1; j++) {
      antenna = antennas[j];
      if (markers[antenna.id] === void 0) {
        addMarker(antenna);
      }
    }
  };

  addMarker = function(antenna) {
    var alpha, iconSize, marker, url;
    url = "http://wireless2.fcc.gov/UlsApp/AsrSearch/asrRegistration.jsp?regKey=" + antenna.id;
    iconSize = Math.floor(antenna.height / 100);
    alpha = (antenna.height / 610) * 0.4 + 0.6;
    marker = new google.maps.Marker({
      position: {
        lat: antenna.latitude,
        lng: antenna.longitude
      },
      map: map,
      title: meters2feet(antenna.height),
      icon: icons[iconSize],
      opacity: alpha
    });
    marker.info = new google.maps.InfoWindow({
      content: "<div>" + (antenna.latitude.toFixed(6)) + "," + (antenna.longitude.toFixed(6)) + "</div>\n<div>" + (meters2feet(antenna.height)) + "</div>\n<div><a href=\"https://maps.google.com/?q=" + antenna.latitude + "," + antenna.longitude + "&t=h\">Map</a>\n<div><a href=\"" + url + "\">Details</a><div>"
    });
    marker.info.isOpen = false;
    marker.addListener('click', function() {
      var shouldOpen;
      shouldOpen = !marker.info.isOpen;
      closeAllMarkers();
      if (shouldOpen) {
        marker.info.open(map, marker);
        marker.info.isOpen = true;
      }
    });
    markers[antenna.id] = marker;
  };

  closeAllMarkers = function() {
    var id, marker;
    for (id in markers) {
      marker = markers[id];
      if (marker.info.isOpen) {
        marker.info.close();
        marker.info.isOpen = false;
      }
    }
  };

  meters2feet = function(m) {
    return Math.floor(3.28084 * m) + "ft";
  };

  query = function(minLatitude, maxLatitude, minLongitude, maxLongitude, cb) {
    var densityLimit, limit, lowerLimit, request, upperLimit, windowSize;
    windowSize = window.innerWidth * window.innerHeight;
    lowerLimit = 16;
    upperLimit = 50;
    densityLimit = windowSize / 25000;
    limit = Math.floor(Math.max(lowerLimit, Math.min(densityLimit, upperLimit)));
    if (map.getZoom() <= 5) {
      limit += 15;
    }
    if (map.getZoom() <= 7) {
      limit += 5;
    }
    request = {
      minLatitude: minLatitude,
      maxLatitude: maxLatitude,
      minLongitude: minLongitude,
      maxLongitude: maxLongitude,
      limit: limit
    };
    algorithmiaClient.algo("baseline/antennas").pipe(request).then(function(algorithmResult) {
      cb(algorithmResult.result);
    });
  };

  init();

}).call(this);