'use strict';

var summary = void 0;
var title = void 0;

$(function () {

  // Global variables
  var $main = $('main');
  var $popup = $('.popup');
  var $popupContent = $('.popupContent');
  var $popupWarp = $('.popupWarp');
  var $popupContentWarp = $('.popupContentWarp');
  var $mapDiv = $('#map');
  var $change = $('#change-map');
  var counter = 0;

  var periods = void 0;
  var allEvents = [];
  var map = void 0;
  var myLocation = void 0;
  var markers = [];
  var portals = void 0;
  var currentEvent = void 0;
  var homeLocation = null;
  var icons = void 0;
  var zoom = void 0;

  $popupWarp.hide();

  navigator.geolocation.getCurrentPosition(function (position) {
    homeLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  });

  // click event handlers
  $('.register').on('click', showRegisterForm);
  $('.login').on('click', showLoginForm);
  $popupContent.on('submit', 'form', handleForm);
  $change.on('click', showMap);
  $popup.on('click', 'button.delete', deleteHistEvent);
  $popup.on('click', 'button.edit', getHistEvent);
  $('.histEventsIndex').on('click', showHistEvents);
  $('.createHistEvent').on('click', showCreateForm);
  $('.logout').on('click', logout);
  $('.close').on('click', menuHandler);
  $popupContent.on('click', '#start', function () {
    $popup.hide();
    $('.blacktop').hide();
    showMap();
  });

  $('.dropdown-toggle0').on('click', function () {
    $('.dropdown-menu0').slideToggle();
  });

  $('.dropdown-toggle3').on('click', function () {
    $('.dropdown-menu3').slideToggle();
  });

  $('.dropdown-toggleclues').on('click', function () {
    $('.dropdown-menuclues').slideToggle();
  });

  $('.dropdown-toggleevents').on('click', function () {
    $('.dropdown-menuevents').slideToggle();
  });

  $('.dropdown-togglelocation').on('click', function () {
    $('.dropdown-menulocation').slideToggle();
  });

  // login functions
  function isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  if (isLoggedIn()) {
    imIn();
  } else {
    $mapDiv.hide();
    $('.loggedIn').hide();
    $('.loggedOut').show();
    showLoginForm();
  }

  function imIn() {
    $('.popup').hide();
    $('.loggedIn').show();
    $('.loggedOut').hide();
    $change.show();
    preGame();
  }

  function logout() {
    if (event) event.preventDefault();
    localStorage.removeItem('token');
    $mapDiv.hide();
    $('.loggedIn').hide();
    $('.loggedOut').show();
    counter = 0;
    $('.blacktop').show();
    showLoginForm();
  }

  function menuHandler() {
    $('.popup').hide();
  }

  // runs pre-game popup
  function preGame() {
    $popup.show();
    $popupContent.show();
    $popupContent.html('\n      <h1>Welcome, Time Travlr</h1>\n      <br>\n      <p>Uh oh, you have fallen through a time portal, how will you find your way back to the present day?</p>\n      <p>Each time period you visit will have a portal but they are quite well hidden!\n      Get clues to their location by exploring the places and events marked on each map.</p>\n      <button class="btn btn-primary" id="start">Ready?</button>\n    ');
  }

  //runs help popup
  $('.help').on('click', function () {
    $popup.show();
    $popupContent.html('<p>Uh oh, you have fallen through a time portal, how will you find your way back to the present day?</p>\n      <p>Each time period you visit will have a portal but they are quite well hidden! Get clues to their location by exploring the places and events marked on each map.</p>\n      <p>After clicking on a marker, your events and clues will be stored in their respective tabs</p>\n      ');
  });

  // adds click event to markers
  function markerClick(data) {
    var data2 = void 0;
    $(markers).each(function (i) {
      markers[i].addListener('click', function () {
        if (this.infowindow) return this.infowindow.open(map, this);
        var markerNumber = markers.indexOf(this);
        displayWindow(data[markerNumber], this);
      });
    });
  }

  // opens infowindow, links in wikipedia api
  function displayWindow(data, marker) {
    currentEvent = data;
    var wikiSearch = data.histEvent;
    $.ajax({
      url: "/wikipedia",
      method: "GET",
      data: {
        prop: 'pageimages|extracts',
        titles: wikiSearch
      }
    }).done(function (data) {
      updateData(data, marker);
    }).fail();
  }

  // populates infowindow with data from wikipedia api
  function updateData(data, marker) {
    var obj = data.query.pages;
    var key = Object.keys(obj);
    var image = void 0;
    var imgHtml = '';

    title = data.query.pages[key].title;
    summary = data.query.pages[key].extract;

    // if wikipedia article has no image, this if statement stops it trying to find one
    if (data.query.pages[key].thumbnail) {
      image = data.query.pages[key].thumbnail.source;
      imgHtml = '<img src="' + image + '">';
    }

    // adds the title, image and first 500 characters of wikipedia article to infowindow. provides link to wikipedia page
    var url = data.query.pages[key].pageid;
    var intro = summary.substring(0, 500);
    var contentString = '\n      <div id="content">\n        <div id="siteNotice"></div>\n        <h1 id="firstHeading" class="firstHeading">' + title + '</h1>\n        <div id="bodyContent">\n          ' + imgHtml + '\n          <p>' + intro + '<a href="https://en.wikipedia.org/wiki/?curid=' + url + '" target="_blank">...read more</a></p>\n        </div>\n      </div>\n      ';

    // places info from contentString variable into the infowindow
    marker.infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    // when infowindow closed, adds relevant event data to events and clues list. stops duplicating info
    marker.infowindow.open(map, marker);
    google.maps.event.addListener(marker.infowindow, 'closeclick', function () {

      if (this.hasBeenAppended) return;
      console.log(this.hasBeenAppended);
      $('.cluelistcontent').append('\n        <p>' + currentEvent.clue + '</p>\n      ');
      $('.eventlistcontent').append('\n        <p><strong>' + currentEvent.histEvent + ' ' + currentEvent.year + '</strong></p>\n        <p>' + currentEvent.description + '</p>\n      ');
      this.hasBeenAppended = true;
      console.log(this.hasBeenAppended);
    });
  }

  function showMap() {

    //clears events/clues list when new map loads
    $(".cluelistcontent").html("");
    $(".eventlistcontent").html("");

    // if in last time period, warp to user's current location and reset the game
    if (periods === 'WW2') {
      var home = new google.maps.Map($mapDiv[0], {
        center: homeLocation,
        zoom: 14
      });

      map.panTo(homeLocation);
      map.setZoom(16);

      var marker = new google.maps.Marker({
        position: homeLocation,
        map: map
      });

      //clears the location period when game is finished
      $(".locationtitle").html("");

      // popup to show that game is finished
      $popup.show();
      $popupContent.html('\n        <h1>Congratulations!</h1>\n        <br>\n        <p>You have successfully travelled through time and found your way back to the present day.</p>\n        <br>\n        <p>Watch out for those pesky portals!</p>');
      setTimeout(function () {
        reset();
      }, 5000);

      // runs if not last time period
    } else {

      // shows different maps
      $mapDiv.show();

      // array of snazzy maps
      var locations = [{
        "name": "Roman Empire",
        "center": { lat: 41.8922, lng: 12.4852 },
        "period": "Rome",
        // style from snazzymaps.com
        "styles": [{ "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#787878" }] }, { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "gamma": 0.01 }, { "lightness": 20 }] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "saturation": -31 }, { "lightness": -33 }, { "weight": 2 }, { "gamma": 0.8 }] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "lightness": 30 }, { "saturation": 30 }] }, { "featureType": "landscape.natural", "elementType": "geometry.fill", "stylers": [{ "visibility": "on" }, { "color": "#ff0000" }, { "saturation": "-50" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "saturation": 20 }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "lightness": 20 }, { "saturation": -20 }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 10 }, { "saturation": -30 }] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "saturation": 25 }, { "lightness": 25 }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "lightness": -20 }] }],
        // location user is looking for to move to next time period
        "portal": { lat: 41.895, lng: 12.474 },
        "zoom": 18,
        "icon": { url: "https://cdn1.iconfinder.com/data/icons/arms-and-armor/100/01-512.png", scaledSize: new google.maps.Size(30, 30) }
      }, {
        "name": "London",
        "center": { lat: 51.5076, lng: -0.1278 },
        "period": "Tudor",
        "styles": [{ "featureType": "all", "elementType": "geometry", "stylers": [{ "color": "#eead2a" }] }, { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "gamma": 0.01 }, { "lightness": 20 }] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "saturation": -31 }, { "lightness": -33 }, { "weight": 2 }, { "gamma": 0.8 }] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "lightness": 30 }, { "saturation": 30 }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "saturation": 20 }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "lightness": 20 }, { "saturation": -20 }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 10 }, { "saturation": -30 }] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "saturation": 25 }, { "lightness": 25 }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "lightness": -20 }] }],
        "portal": { lat: 51.508076, lng: -0.097194 },
        "zoom": 12,
        "icon": { url: "https://sites.create-cdn.net/siteimages/24/5/0/245079/7896020.gif?1389956032", scaledSize: new google.maps.Size(30, 30) }
      }, {
        "name": "Kingston",
        "center": { lat: 18.0179, lng: -76.8099 },
        "period": "Colonial",
        "styles": [{ "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#675a4b" }] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#ffebc5" }, { "lightness": "-10" }] }, { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#675a4b" }] }, { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#b70046" }] }, { "featureType": "administrative.province", "elementType": "geometry.fill", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#675a4b" }, { "weight": "0.50" }] }, { "featureType": "administrative.province", "elementType": "labels.text.fill", "stylers": [{ "color": "#675a4b" }] }, { "featureType": "administrative.locality", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#ff850a" }] }, { "featureType": "administrative.neighborhood", "elementType": "geometry", "stylers": [{ "visibility": "on" }] }, { "featureType": "administrative.neighborhood", "elementType": "labels", "stylers": [{ "visibility": "off" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] }, { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "saturation": "-71" }, { "lightness": "-2" }, { "color": "#ffebc5" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#70bfaf" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }, { "visibility": "simplified" }] }, { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#675a4c" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#675a4b" }] }, { "featureType": "road.arterial", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#675a4b" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "road.local", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#7ccff0" }, { "visibility": "on" }] }, { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#cfeae4" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#109579" }] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] }],
        "portal": { lat: 18.2287687, lng: -77.7615045 },
        "zoom": 14,
        "icon": { url: "http://cdn.shopify.com/s/files/1/0185/5092/products/objects-0226.png?v=1369543834", scaledSize: new google.maps.Size(30, 30) }
      }, {
        "name": "Berlin",
        "center": { lat: 52.5076, lng: 13.3904 },
        "period": "WW2",
        "styles": [{ "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "saturation": 36 }, { "color": "#000000" }, { "lightness": 40 }] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#000000" }, { "lightness": 16 }] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }, { "lightness": 20 }] }, { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 17 }, { "weight": 1.2 }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 20 }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 21 }] }, { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }, { "lightness": 17 }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 29 }, { "weight": 0.2 }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 18 }] }, { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 16 }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#000000" }, { "lightness": 19 }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f252e" }, { "lightness": 17 }] }],
        "portal": { lat: 52.5076, lng: 13.3904 },
        "zoom": 14,
        "icon": { url: "https://lh3.googleusercontent.com/erfTSG0iqvytXPzAD5zG5VpJtMSAc3L1I0kHqHL3N8rUNa4b6bhIHu_L3ySxIluPglQ=w300", scaledSize: new google.maps.Size(30, 30) }
      }];

      // variables storing info from maps array
      myLocation = locations[counter].center;
      var styles = locations[counter].styles;
      var name = locations[counter].name;
      periods = locations[counter].period;
      portals = locations[counter].portal;
      icons = locations[counter].icon;
      zoom = locations[counter].zoom;

      // displays what time period user is in
      $(".locationtitle").html('Your location: ' + periods + ', ' + name);

      map = new google.maps.Map($mapDiv[0], {
        center: myLocation,
        zoom: zoom,
        styles: styles,
        mapTypeId: 'terrain',
        disableDefaultUI: true
      });

      // adds click event to the whole map
      google.maps.event.addListener(map, 'click', function (event) {

        var lat = event.latLng.lat();
        var lng = event.latLng.lng();

        var portal = new google.maps.LatLng(portals);
        var userClick = new google.maps.LatLng(lat, lng);

        // checks distance between portal and user click
        function calcDistance(portal, userClick) {
          return google.maps.geometry.spherical.computeDistanceBetween(portal, userClick).toFixed(0);
        }

        // win condition: if user clicks within 200m of portal, runs the next map and shows warp popup
        if (calcDistance(portal, userClick) < 200) {
          $(".locationtracker2").html("");
          $popupWarp.show();
          $popupWarp.css("color", "white");
          $popupContentWarp.html("WOOOOOOOAAAAAAAAAH");
          $popupWarp.css("background-image", "url('/images/warp.gif')");
          setTimeout(function () {
            $popupWarp.hide();
          }, 1500);
          showMap();

          // displays distance from portal
        } else if (calcDistance(portal, userClick) < 800) {
          $(".locationtracker2").html('\n              <p>Getting warmer, ' + calcDistance(portal, userClick) + ' metres away');
        } else {
          $(".locationtracker2").html('\n              <p>Pretty cold, ' + calcDistance(portal, userClick) + ' metres away');
        }
      });

      // clears markers and events when new map is run
      markers = [];
      currentEvent = undefined;

      getHistEvents();
      counter++;
    }
  }

  function showRegisterForm() {
    if (event) event.preventDefault();
    $popup.show();
    $popupContent.html('\n      <h2>Register</h2>\n      <form method="post" action="/register">\n        <div class="form-group">\n          <input class="form-control" name="username" placeholder="Username">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="email" placeholder="Email">\n        </div>\n        <div class="form-group">\n          <input class="form-control" type="password" name="password" placeholder="Password">\n        </div>\n        <div class="form-group">\n          <input class="form-control" type="password" name="passwordConfirmation" placeholder="Password Confirmation">\n        </div>\n        <button class="btn btn-primary">Register</button>\n      </form>\n    ');
  }

  function showLoginForm() {
    if (event) event.preventDefault();
    $popup.show();
    $popupContent.html('\n      <h1>Welcome back, Time Travlr</h1>\n      <br>\n      <p>Login in to carry on travelling through time.</p>\n      <form method="post" action="/login">\n        <div class="form-group">\n          <input class="form-control" name="email" placeholder="Email">\n        </div>\n        <div class="form-group">\n          <input class="form-control" type="password" name="password" placeholder="Password">\n        </div>\n        <button class="btn btn-primary">Login</button>\n      </form>\n    ');
  }

  function showCreateForm() {
    if (event) event.preventDefault();
    $('.popup').show();
    $popupContent.html('\n      <h2>Create</h2>\n      <form method="post" action="/histEvents">\n        <div class="form-group">\n          <input class="form-control" name="histEvent" placeholder="histEvent">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="description" placeholder="description">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="image" placeholder="image url">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="year" placeholder="year">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="location" placeholder="location">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="lat" placeholder="latitude">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="lng" placeholder="longitude">\n        </div>\n        <div class="form-group">\n          <input class="form-control" name="period" placeholder="period">\n        </div>\n        <button class="btn btn-primary">Create</button>\n      </form>\n    ');
  }

  function showEditForm(histEvent) {
    if (event) event.preventDefault();
    $popup.show();
    $popupContent.html('\n      <h2>Edit HistEvent</h2>\n      <form method="put" action="/histEvents/' + histEvent._id + '">\n        <div class="form-group">\n          <input class="form-control" name="histEvent" value="' + histEvent.histEvent + '">\n          <input class="form-control" name="description" value="' + histEvent.description + '">\n          <input class="form-control" name="image" value="' + histEvent.image + '">\n          <input class="form-control" name="year" value="' + histEvent.year + '">\n          <input class="form-control" name="location" value="' + histEvent.location + '">\n          <input class="form-control" name="lat" value="' + histEvent.lat + '">\n          <input class="form-control" name="lng" value="' + histEvent.lng + '">\n          <input class="form-control" name="period" value="' + histEvent.period + '">\n        </div>\n        <button class="btn btn-primary">Update</button>\n      </form>\n    ');
  }

  function handleForm() {
    if (event) event.preventDefault();
    var token = localStorage.getItem('token');
    var $form = $(this);

    var url = $form.attr('action');
    var method = $form.attr('method');
    var data = $form.serialize();

    $.ajax({
      url: url,
      method: method,
      data: data,
      beforeSend: function beforeSend(jqXHR) {
        if (token) return jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    }).done(function (data) {
      if (data.token) localStorage.setItem('token', data.token);
      if (url === '/login' || url === '/register') {
        imIn();
      } else {
        showHistEvents();
      }
    }).fail(showLoginForm);
  }

  // if logged in, runs createHistEventMarker function
  function getHistEvents() {
    if (event) event.preventDefault();

    var token = localStorage.getItem('token');
    $.ajax({
      url: '/histEvents?period=' + periods,
      method: "GET",
      beforeSend: function beforeSend(jqXHR) {
        if (token) return jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    }).done(function (data) {
      allEvents = data;
      $(data).each(function (i) {
        data[i].number = i;
        createHistEventMarker(data[i]);
      });
      markerClick(data);
    }).fail(showLoginForm);
  }

  // displays list of events in time period
  function showHistEvents() {
    var Events = allEvents;
    var $row = $('<div class="row"></div>');
    Events.forEach(function (histEvent) {
      $row.append('\n        <div class="col-md-4">\n          <div class="card">\n            <img class="card-img-top" src="' + histEvent.image + '" alt="Card image cap">\n            <div class="card-block">\n              <h4 class="card-title">' + histEvent.histEvent + '</h4>\n              <h5 class="card-title">' + histEvent.year + '</h5>\n              <h5 class="card-title">' + histEvent.location + '</h5>\n              <p class="card-text">' + histEvent.description + '</p>\n            </div>\n          </div>\n          <button class="btn btn-danger delete" data-id="' + histEvent._id + '">Delete</button>\n          <button class="btn btn-primary edit" data-id="' + histEvent._id + '">Edit</button>\n        </div>\n      ');
    });
    $popup.show();
    $popupContent.html($row);
  }

  function deleteHistEvent() {
    var id = $(this).data('id');
    var token = localStorage.getItem('token');

    $.ajax({
      url: '/histEvents/' + id,
      method: "DELETE",
      beforeSend: function beforeSend(jqXHR) {
        if (token) return jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    }).done(getHistEvents).fail(showLoginForm);
  }

  function getHistEvent() {
    var id = $(this).data('id');
    var token = localStorage.getItem('token');

    $.ajax({
      url: '/histEvents/' + id,
      method: "GET",
      beforeSend: function beforeSend(jqXHR) {
        if (token) return jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    }).done(showEditForm).fail(showLoginForm);
  }

  // creates a marker with relevant icon for each event in time period
  function createHistEventMarker(histEvent) {
    var latLng = { lat: histEvent.lat, lng: histEvent.lng };
    markers.push(new google.maps.Marker({
      position: latLng,
      icon: icons,
      map: map
    }));
  }

  // runs when game is complete
  function reset() {
    counter = 0;
    allEvents = [];
    markers = [];
    currentEvent = undefined;
    periods = undefined;
    $('.blacktop').show();
    $mapDiv.hide();
    preGame();
  }
});