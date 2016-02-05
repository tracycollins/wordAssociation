/*jslint node: true */
"use strict";

var debug = true ;
var mouseFreezeEnabled = false;

var sessionHashMap = new HashMap();
var sessionIds = {};

var urlRoot = "http://word.threeceelabs.com/session?session=";
// var urlRoot = "http://localhost:9997/session?session=";

var socketNamespace = "/user";

var nodesCreated = 0;
// var dateNow = Date.now();
var dateNow = (new Date).getTime();
var d3TimerCount = 1 ;

var currentSession;
var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

var currentNodeObject = {} ;


var DEFAULT_AGE_RATE =  1.0;
var ageRate = DEFAULT_AGE_RATE ;
var nodeMaxAge = 30000 ;

var QUEUE_MAX = 200 ;

var defaultFadeDuration = 100 ;

var currentScale = 1.0 ;
var width = window.innerWidth * 1 ;
var height = window.innerHeight * 1 ;
// var translate = [0.5*width,0.5*height] ;

var DEFAULT_TRANSLATE = [width,0]; 

// var translate = DEFAULT_TRANSLATE ;

var zoomWidth = (width - (currentScale * width))/2  ;
var zoomHeight =  (height - (currentScale * height))/2  ;

console.log("width: " + width + " | height: " + height);

var fullscreenFlag = false ;
var showStatsFlag = false ;
var pageLoadedTimeIntervalFlag = true;

var DEFAULT_MAX_AGE = 60000.0 ;

var DEFAULT_CHARGE = -300;
var charge = DEFAULT_CHARGE;

var DEFAULT_GRAVITY = 0.02;
var gravity = DEFAULT_GRAVITY;

var DEFAULT_LINK_STRENGTH = 0.5;
var linkStrength = DEFAULT_LINK_STRENGTH;

var DEFAULT_FRICTION = 0.5;
var friction = DEFAULT_FRICTION;

var DEFAULT_CONFIG = {
  'nodeMaxAge' : DEFAULT_MAX_AGE
};

var config = DEFAULT_CONFIG ;
var previousConfig = [] ;

var DEFAULT_ADMIN_OVERLAY0_X = 0.95 ;
var DEFAULT_ADMIN_OVERLAY0_Y = 0.10 ;

var DEFAULT_ADMIN_OVERLAY1_X = 0.95 ;
var DEFAULT_ADMIN_OVERLAY1_Y = 0.08 ;

var DEFAULT_ADMIN_OVERLAY2_X = 0.95 ;
var DEFAULT_ADMIN_OVERLAY2_Y = 0.12 ;

var DEFAULT_ADMIN_OVERLAY3_X = 0.95 ;
var DEFAULT_ADMIN_OVERLAY3_Y = 0.06 ;

var DEFAULT_STATS_OVERLAY1_X = 0.05 ;
var DEFAULT_STATS_OVERLAY1_Y = 0.84 ;

var DEFAULT_STATS_OVERLAY2_X = 0.05 ;
var DEFAULT_STATS_OVERLAY2_Y = 0.86 ;

var DEFAULT_STATS_OVERLAY3_X = 0.05 ;
var DEFAULT_STATS_OVERLAY3_Y = 0.88 ;

var DEFAULT_TEXT_TITLE_OVERLAY1_X = 0.05 ;
var DEFAULT_TEXT_TITLE_OVERLAY1_Y = 0.80 ;

var DEFAULT_TEXT_TITLE_OVERLAY2_X = 0.5 ;
var DEFAULT_TEXT_TITLE_OVERLAY2_Y = 0.90 ;

var DEFAULT_DATE_TIME_OVERLAY_X = 0.05 ;
var DEFAULT_DATE_TIME_OVERLAY_Y = 0.90 ;

var DEFAULT_MEDIA_OVERLAY1_X = 0.55 ;
var DEFAULT_MEDIA_OVERLAY1_Y = 0.25 ;

var DEFAULT_MEDIA_OVERLAY1_WIDTH_RATIO = 0.3 ;
var DEFAULT_MEDIA_OVERLAY1_HEIGHT_RATIO = 0.4  ;

var ADMIN_OVERLAY0_X ;
var ADMIN_OVERLAY0_Y ;

var ADMIN_OVERLAY1_X ;
var ADMIN_OVERLAY1_Y ;

var ADMIN_OVERLAY2_X ;
var ADMIN_OVERLAY2_Y ;

var ADMIN_OVERLAY3_X ;
var ADMIN_OVERLAY3_Y ;

var STATS_OVERLAY1_X ;
var STATS_OVERLAY1_Y ;

var STATS_OVERLAY2_X ;
var STATS_OVERLAY2_Y ;

var STATS_OVERLAY3_X ;
var STATS_OVERLAY3_Y ;

var TEXT_TITLE_OVERLAY1_X  ;
var TEXT_TITLE_OVERLAY1_Y  ;

var TEXT_TITLE_OVERLAY2_X  ;
var TEXT_TITLE_OVERLAY2_Y  ;

var DATE_TIME_OVERLAY_X  ;
var DATE_TIME_OVERLAY_Y  ;

var DEFAULT_MEDIA_OVERLAY1_WIDTH = DEFAULT_MEDIA_OVERLAY1_WIDTH_RATIO * width ;
var DEFAULT_MEDIA_OVERLAY1_HEIGHT = DEFAULT_MEDIA_OVERLAY1_HEIGHT_RATIO * height ;

STATS_OVERLAY1_X = DEFAULT_STATS_OVERLAY1_X * width ;
STATS_OVERLAY1_Y = DEFAULT_STATS_OVERLAY1_Y * height ;

STATS_OVERLAY2_X = DEFAULT_STATS_OVERLAY2_X * width ;
STATS_OVERLAY2_Y = DEFAULT_STATS_OVERLAY2_Y * height ;

STATS_OVERLAY3_X = DEFAULT_STATS_OVERLAY3_X * width ;
STATS_OVERLAY3_Y = DEFAULT_STATS_OVERLAY3_Y * height ;

TEXT_TITLE_OVERLAY1_X = DEFAULT_TEXT_TITLE_OVERLAY1_X * width ;
TEXT_TITLE_OVERLAY1_Y = DEFAULT_TEXT_TITLE_OVERLAY2_Y * height ;

TEXT_TITLE_OVERLAY2_X = DEFAULT_TEXT_TITLE_OVERLAY2_X * width ;
TEXT_TITLE_OVERLAY2_Y = DEFAULT_TEXT_TITLE_OVERLAY2_Y * height ;

DATE_TIME_OVERLAY_X = DEFAULT_DATE_TIME_OVERLAY_X * width ;
DATE_TIME_OVERLAY_Y = DEFAULT_DATE_TIME_OVERLAY_Y * height ;

var MEDIA_OVERLAY1_X = DEFAULT_MEDIA_OVERLAY1_X * width ;
var MEDIA_OVERLAY1_Y = DEFAULT_MEDIA_OVERLAY1_Y * height ;

console.log("@@@@@@@ CLIENT @@@@@@@@");


var jsonPrint = function (obj){
  if (obj) {
    return JSON.stringify(obj, null, 2);
  }
  else {
    return "UNDEFINED";
  }
}

function setLinkstrengthSliderValue(value){
  document.getElementById("linkstrengthSlider").value = value * 1000;
  document.getElementById("linkstrengthSliderText").innerHTML = value.toFixed(3);
}

function updateLinkstrength(value) {
  document.getElementById("linkstrengthSliderText").innerHTML = value.toFixed(3);
  linkStrength = value;
  force.linkStrength(linkStrength);
}

function setFrictionSliderValue(value){
  document.getElementById("frictionSlider").value = value * 1000;
  document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
}

function updateFriction(value) {
  document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
  friction = value;
  force.friction(friction);
}

function setGravitySliderValue(value){
  document.getElementById("gravitySlider").value = value * 1000;
  document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
}

function updateGravity(value) {
  document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
  gravity = value;
  force.gravity(gravity);
}

function setChargeSliderValue(value){
  document.getElementById("chargeSlider").value = value;
  document.getElementById("chargeSliderText").innerHTML = value;
}

function updateCharge(value) {
  document.getElementById("chargeSliderText").innerHTML = value;
  charge = value;
  force.charge(charge);
}

function resetDefaultForce(){
  updateCharge(DEFAULT_CHARGE);
  setChargeSliderValue(DEFAULT_CHARGE);
  updateFriction(DEFAULT_FRICTION);
  setFrictionSliderValue(DEFAULT_FRICTION);
  updateGravity(DEFAULT_GRAVITY);
  setGravitySliderValue(DEFAULT_GRAVITY);
  updateLinkstrength(DEFAULT_LINK_STRENGTH);
  setLinkstrengthSliderValue(DEFAULT_LINK_STRENGTH);
}

var randomIntFromInterval = function (min,max) {
  var random = Math.random() ;
  var randomInt = Math.floor((random*(max-min+1))+min) ;
  return randomInt;
}

var randomId = randomIntFromInterval(1000000000,9999999999);

var viewerObj = { 
  viewerId: 'VIEWER_RANDOM_' + randomId,
  screenName: 'VIEWER RANDOM ' + randomId
};

function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);

  displayInfoOverlay(1);
  displayControlOverlay(true);

  mouseMoveTimeout = setTimeout(function(){
    d3.select("body").style("cursor", "none");

    if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
      displayInfoOverlay(1e-6);
      displayControlOverlay(false);
    }

    mouseMovingFlag = false ;
  }, mouseMoveTimeoutInterval);
}

function tableCreateRow(parentTable, options, cells){

  var tr = parentTable.insertRow();
  var tdTextColor = options.textColor;
  var tdBgColor = options.backgroundColor || '#222222';

  if (options.trClass) {
    tr.setAttribute("class", options.trClass);
  }

  if (options.headerFlag){
    cells.forEach(function(content){
      var th = tr.insertCell();
      th.appendChild(document.createTextNode(content));
      th.style.color = tdTextColor ;
      th.style.backgroundColor = tdBgColor ;
    });       
  }
  else {
    cells.forEach(function(content){
      var td = tr.insertCell();
      // var td2 = td.insertCell();
      td.appendChild(document.createTextNode(content));
      td.style.color = tdTextColor ;
      td.style.backgroundColor = tdBgColor ;
    });
  }
}

function resize() {
  console.log("resize");

  if (typeof window.innerWidth !== 'undefined') {
    width = window.innerWidth; 
    height = window.innerHeight;
  }
  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)

  else if (typeof document.documentElement !== 'undefined'
   && typeof document.documentElement.clientWidth !=='undefined' && document.documentElement.clientWidth !== 0) {
     width = document.documentElement.clientWidth; 
     height = document.documentElement.clientHeight; 
  }

  // older versions of IE

  else {
     width = document.getElementsByTagName('body')[0].clientWidth;
     height = document.getElementsByTagName('body')[0].clientHeight;
  }

  console.log("width: " + width + " | height: " + height);

  radiusX = 0.4*width;
  radiusY = 0.4*height;

  d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO ; // double the width for now
  d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO ;

  svgcanvas
    .attr("width", SVGCANVAS_WIDTH_RATIO * width)
    .attr("height", SVGCANVAS_HEIGHT_RATIO * height)
    // .attr("viewbox", 100, 100, 0.5*d3LayoutWidth, 0.5*d3LayoutHeight);
    // .attr("x", 0)
    // .attr("y", 0);


  svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO ;
  svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO ;


  svgForceLayoutArea.attr("width", svgForceLayoutAreaWidth).attr("height", svgForceLayoutAreaHeight);
  // svgForceLayoutArea.attr("width", d3LayoutWidth).attr("height", d3LayoutHeight);
  // svgForceLayoutArea.attr("viewbox", 0, 0, d3LayoutWidth, d3LayoutHeight);
  // svgForceLayoutArea.attr("viewbox", 0, 0, svgForceLayoutAreaWidth, svgForceLayoutAreaHeight);
  svgForceLayoutArea.attr("x", 0);
  svgForceLayoutArea.attr("y", 0);

  force.size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight]) ;

  ADMIN_OVERLAY0_X = DEFAULT_ADMIN_OVERLAY0_X * width ;
  ADMIN_OVERLAY0_Y = DEFAULT_ADMIN_OVERLAY0_Y * height ;

  ADMIN_OVERLAY1_X = DEFAULT_ADMIN_OVERLAY1_X * width ;
  ADMIN_OVERLAY1_Y = DEFAULT_ADMIN_OVERLAY1_Y * height ;

  ADMIN_OVERLAY2_X = DEFAULT_ADMIN_OVERLAY2_X * width ;
  ADMIN_OVERLAY2_Y = DEFAULT_ADMIN_OVERLAY2_Y * height ;

  ADMIN_OVERLAY3_X = DEFAULT_ADMIN_OVERLAY3_X * width ;
  ADMIN_OVERLAY3_Y = DEFAULT_ADMIN_OVERLAY3_Y * height ;

  STATS_OVERLAY1_X = DEFAULT_STATS_OVERLAY1_X * width ;
  STATS_OVERLAY1_Y = DEFAULT_STATS_OVERLAY1_Y * height ;

  STATS_OVERLAY2_X = DEFAULT_STATS_OVERLAY2_X * width ;
  STATS_OVERLAY2_Y = DEFAULT_STATS_OVERLAY2_Y * height ;

  STATS_OVERLAY3_X = DEFAULT_STATS_OVERLAY3_X * width ;
  STATS_OVERLAY3_Y = DEFAULT_STATS_OVERLAY3_Y * height ;

  TEXT_TITLE_OVERLAY1_X = DEFAULT_TEXT_TITLE_OVERLAY1_X * width ;
  TEXT_TITLE_OVERLAY1_Y = DEFAULT_TEXT_TITLE_OVERLAY1_Y * height ;

  TEXT_TITLE_OVERLAY2_X = DEFAULT_TEXT_TITLE_OVERLAY2_X * width ;
  TEXT_TITLE_OVERLAY2_Y = DEFAULT_TEXT_TITLE_OVERLAY2_Y * height ;

  DATE_TIME_OVERLAY_X = DEFAULT_DATE_TIME_OVERLAY_X * width ;
  DATE_TIME_OVERLAY_Y = DEFAULT_DATE_TIME_OVERLAY_Y * height ;

  MEDIA_OVERLAY1_X = DEFAULT_MEDIA_OVERLAY1_X * width ;
  MEDIA_OVERLAY1_Y = DEFAULT_MEDIA_OVERLAY1_Y * height ;

  DEFAULT_MEDIA_OVERLAY1_WIDTH = DEFAULT_MEDIA_OVERLAY1_WIDTH_RATIO * width ;
  DEFAULT_MEDIA_OVERLAY1_HEIGHT = DEFAULT_MEDIA_OVERLAY1_HEIGHT_RATIO * height ;

  adminOverlay0.attr("x", ADMIN_OVERLAY0_X).attr("y",ADMIN_OVERLAY0_Y);
  adminOverlay1.attr("x", ADMIN_OVERLAY1_X).attr("y",ADMIN_OVERLAY1_Y);
  adminOverlay2.attr("x", ADMIN_OVERLAY2_X).attr("y",ADMIN_OVERLAY2_Y);
  adminOverlay3.attr("x", ADMIN_OVERLAY3_X).attr("y",ADMIN_OVERLAY3_Y);

  dateTimeOverlay.attr("x", DATE_TIME_OVERLAY_X).attr("y", DATE_TIME_OVERLAY_Y);
  statsOverlay1.attr("x", STATS_OVERLAY1_X).attr("y", STATS_OVERLAY1_Y);
  statsOverlay2.attr("x", STATS_OVERLAY2_X).attr("y", STATS_OVERLAY2_Y);
  statsOverlay3.attr("x", STATS_OVERLAY3_X).attr("y", STATS_OVERLAY3_Y);

  nodeInitialX = INITIAL_X_RATIO * svgForceLayoutAreaWidth ;
  nodeInitialY = INITIAL_Y_RATIO * svgForceLayoutAreaHeight ;

  resizeFlag = true ;
}

function getTimeStamp(inputTime) {
  var options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit"
  };

  var currentDate;
  var currentTime;

  if (typeof inputTime === 'undefined') {
    currentDate = new Date().toDateString("en-US", options);
    currentTime = new Date().toTimeString('en-US', options);
  }
  else {
    currentDate = new Date(inputTime).toDateString("en-US", options);
    currentTime = new Date(inputTime).toTimeString('en-US', options);
  }
  return currentDate + " - " + currentTime;
}

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {

    fullscreenFlag = true ;

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      resize();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
      resize();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
      resize();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      resize();
    }
  } else {

    fullscreenFlag = false ;

    if (document.exitFullscreen) {
      document.exitFullscreen();
      resize();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      resize();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      resize();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      resize();
    }
  }
}

function getBrowserPrefix() {
   
  // Check for the unprefixed property.
  if ('hidden' in document) {
    return null;
  }
 
  // All the possible prefixes.
  var browserPrefixes = ['moz', 'ms', 'o', 'webkit'];
  var prefixIndex = 0;
 
  for (prefixIndex = 0; prefixIndex < browserPrefixes.length; prefixIndex++) {
    var prefix = browserPrefixes[prefixIndex] + 'Hidden';
    if (prefix in document) {
      return browserPrefixes[prefixIndex];
    }
  }
 
  // The API is not supported in browser.
  return null;
}
 
function hiddenProperty(prefix) {
  if (prefix) {
    return prefix + 'Hidden';
  } else {
    return 'hidden';
  }
}
 
function getVisibilityState(prefix) {
  if (prefix) {
    return prefix + 'VisibilityState';
  } else {
    return 'visibilityState';
  }
}
 
function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + 'visibilitychange';
  } else {
    return 'visibilitychange';
  }
}

var socket = io('/view');

socket.on("VIEWER_ACK", function(viewerSessionKey){
  console.log("RX VIEWER_ACK | SESSION KEY: " + viewerSessionKey);
  if (sessionMode) {
    console.log("SESSION MODE"
      + " | SID: " + sessionId
      + " | NSP: " + namespace
    );
    currentSession = "/" + namespace + "#" + sessionId;
    console.log("TX GET_SESSION | " + currentSession);
    socket.emit("GET_SESSION", currentSession);
  }
});

socket.on("reconnect", function(){
  socket.emit("VIEWER_READY", viewerObj);
  if (sessionMode) {
    console.log("SESSION MODE"
      + " | SID: " + sessionId
      + " | NSP: " + namespace
    );
    currentSession = "/" + namespace + "#" + sessionId;
    socket.emit("GET_SESSION", currentSession);
  }
});

socket.on("connect", function(){
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function(){
  console.log("*** DISCONNECTED FROM HOST");
});

var data = [] ;

var palette = {
  "black": "#000000",
  "white": "#FFFFFF",
  "lightgray": "#819090",
  "gray": "#708284",
  "mediumgray": "#536870",
  "darkgray": "#475B62",
  "darkblue": "#0A2933",
  "darkerblue": "#042029",
  "paleryellow": "#FCF4DC",
  "paleyellow": "#EAE3CB",
  "yellow": "#A57706",
  "orange": "#BD3613",
  "red": "#D11C24",
  "pink": "#C61C6F",
  "purple": "#595AB7",
  "blue": "#2176C7",
  "green": "#259286",
  "yellowgreen": "#738A05"
};

var windowVisible = true;

document.title = "Word Association";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityState = getVisibilityState(prefix);
var visibilityEvent = getVisibilityEvent(prefix);
 
document.addEventListener(visibilityEvent, function(event) {
  console.log("visibilityEvent");
  if (!document[hidden]) {
    windowVisible = true ;
  } else {
    windowVisible = false ;
    mouseMovingFlag = false;
  }
});


document.addEventListener("keydown", function(e) {
  // if (e.keyCode == 84) { // 't'
  //   enableRandomNodeGenerator = !enableRandomNodeGenerator ;
  //   console.log("enableRandomNodeGenerator: " + enableRandomNodeGenerator);
  //   socket.emit("TEST_MODE", enableRandomNodeGenerator);
  // }
}, false);

d3.select("body").style("cursor", "default");

document.addEventListener("mousemove", function() {
  if (mouseHoverFlag) {
    d3.select("body").style("cursor", "pointer");
  }
  else {
    d3.select("body").style("cursor", "default");
  }
  
  mouseMovingFlag = true ;
    resetMouseMoveTimer();

  if (mouseFreezeEnabled) {
    force.stop();
  }
}, true);


function getUrlVariables(callback){

  var urlSessionId;
  var urlNamespace ;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split('&');

  var asyncTasks = [];

  variableArray.forEach(

    function(variable, callback){

      asyncTasks.push(function(callback2){

        var keyValuePair = variable.split('=');

        if (typeof keyValuePair[1] !== 'undefined'){
          // configHashMap.set(keyValuePair[0], keyValuePair[1]) ;
          console.log("'" + variable + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);  
          if (keyValuePair[0] == 'monitor') {
            monitorMode = keyValuePair[1] ;
            callback2(null, {namespace: urlNamespace, sessionId: urlSessionId, sessionMode: sessionMode, monitorMode: monitorMode});
          }    
          if (keyValuePair[0] == 'session') {
            urlSessionId = keyValuePair[1] ;
            console.log("urlSessionId: " + urlSessionId);
            sessionMode = true ;
            callback2(null, {sessionId: urlSessionId});
          }    
          if (keyValuePair[0] == 'nsp') {
            urlNamespace = keyValuePair[1] ;
            console.log("namespace: " + urlNamespace);
            callback2(null, {namespace: urlNamespace});
          }    
        } 
        else {
          console.log("NO URL VARIABLES");      
          callback2(null, null);
        }

      });
    }
  )

  async.parallel(asyncTasks, function(err, results){
    console.log("results\n" + jsonPrint(results));
    if (sessionMode) {
      console.log("SESSION MODE"
        + " | SID: " + urlSessionId
        + " | NSP: " + urlNamespace
      );
      currentSession = "/" + urlNamespace + "#" + urlSessionId;
    }
    callback(err, {sessionId: urlSessionId, namespace: urlNamespace});
  });

}



var mouseMoveTimeoutInterval = 1000; // 1 second

var mouseMoveTimeout = setTimeout(function(){
  d3.select("body").style("cursor", "none");
  if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
    displayInfoOverlay(1);
  }
  displayControlOverlay(true);
  mouseMovingFlag = false ;
}, mouseMoveTimeoutInterval);

function showInfo() {
  window.open("http://www.threeCeeMedia.com/", '_blank');
}

function launchSessionView(sessionId) {
  var namespacePattern = new RegExp(/^\/(\S*)#(\S*)$/);
  var sessionIdParts = namespacePattern.exec(sessionId);
  console.log("sessionId: " + sessionId + " | nsp: " + sessionIdParts[1] + " | id: " + sessionIdParts[2]);

  // var sessionIdNameSpace = sessionId.replace(/^\/(\S*)#/, "");
  // var sessionIdNameSpace = sessionId.replace(/#/, "");

  var url = urlRoot + sessionIdParts[2] + "&nsp=" + sessionIdParts[1] ;
  console.log("launchSessionView: " + sessionId + " | " + url);
  window.open(url, 'SESSION VIEW', '_new');
}

function displayControlOverlay(vis) {

  var visible = "visible";

  if (vis) {
    visible = "visible";
  }
  else {
    visible = "hidden";
  }

  d3.select("#sliderDiv").style("visibility", visible);

  d3.select("#infoButton").style("visibility", visible);
  d3.select("#statsToggleButton").style("visibility", visible);
  d3.select("#fullscreenToggleButton").style("visibility", visible);
}

function displayInfoOverlay(opacity) {

  d3.select("#adminOverlay0").select("text").style("opacity", opacity);
  d3.select("#adminOverlay1").select("text").style("opacity", opacity);
  d3.select("#adminOverlay2").select("text").style("opacity", opacity);
  d3.select("#adminOverlay3").select("text").style("opacity", opacity);

  d3.select("#dateTimeOverlay").select("text").style("opacity", opacity);

  d3.select("#statsOverlay1").style("opacity", opacity);
  d3.select("#statsOverlay2").style("opacity", opacity);
  d3.select("#statsOverlay3").style("opacity", opacity);
}

var adjustedAgeRateScale = d3.scale.pow().domain([1,500]).range([1.0,100.0]);  // number of nodes > 100 ; 
var fontSizeScale = d3.scale.log().domain([1,1000000]).range([1.8,3.6]);

var defaultRadiusScale = d3.scale.log().domain([1,1000000]).range([4,24]);
var defaultChargeScale =  d3.scale.log().domain([1,1000000]).range([-100,-150]);

function interpolateHsl(a, b) {
    var i = d3.interpolateString(a, b);
    return function(t) {
        return d3.hsl(i(t));
    }
}

function interpolateColorFull(startColor, endColor){
  return d3.interpolateHcl(endColor, startColor);
}


// var interpolateColor = interpolateColorFull("white", "black");


// var colorScale = d3.scale.linear()
//     .range(["hsl(0, 100%, 100%)", "hsl(100, 100%, 100%)"])
//     // .range(["black", "red"])
//     .interpolate(interpolateHsl);

var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);

var linkColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);


var nodeHashMap = {};
var reqNodeHashMap = {};

var nodes = [];
var maxNumberNodes = 0;

var links = [];

var D3_LAYOUT_WIDTH_RATIO = 1.0;
var D3_LAYOUT_HEIGHT_RATIO = 1.0 ;

var FORCE_LAYOUT_WIDTH_RATIO = 1.0;
var FORCE_LAYOUT_HEIGHT_RATIO = 1.0 ;

var TIMELINE_WIDTH_RATIO = 0.2;
var TIMELINE_HEIGHT_RATIO = 0.2;

var d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO ;
var d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO ;

var svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO ;
var svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO ;

var INITIAL_X_RATIO = 0.5;
var INITIAL_Y_RATIO = 0.5;

var nodeInitialX = INITIAL_X_RATIO * svgForceLayoutAreaWidth ;
var nodeInitialY = INITIAL_Y_RATIO * svgForceLayoutAreaHeight ;

console.log("nodeInitialX: " + nodeInitialX + " | nodeInitialY: " + nodeInitialY);

var resizeFlag = false ;
d3.select(window).on("resize", resize); 

var d3image = d3.select("#d3group");

var SVGCANVAS_WIDTH_RATIO = 1.0 ;
var SVGCANVAS_HEIGHT_RATIO = 1.0 ;

var svgcanvas = d3image.append("svg:svg")
  .attr("id", "svgcanvas");
  // .attr("width", SVGCANVAS_WIDTH_RATIO * width)
  // .attr("height", SVGCANVAS_HEIGHT_RATIO * height)
  // .attr("x", 0)
  // .attr("y", 0);

// zoomListener.translate([zoomWidth,zoomHeight]).scale(currentScale);//translate and scale to whatever value you wish
// zoomListener.event(svgcanvas.transition().duration(1000));//does a zoom

var svgForceLayoutArea = svgcanvas.append("g")
  .attr("id", "svgForceLayoutArea");
  // .attr("width", svgForceLayoutAreaWidth)
  // .attr("height", svgForceLayoutAreaHeight)
  // .attr("viewbox", 0, 0, d3LayoutWidth, d3LayoutHeight)
  // .attr("preserveAspectRatio", "none")
  // .attr("x", 0)
  // .attr("y", 0);
  // .call(d3.behavior.zoom()
  //   .scale(currentScale)
  //   .scaleExtent([0.1, 10])
  //   .on("zoom", zoomHandler));

// var zoomListener = d3.behavior.zoom()
//   .scaleExtent([0.4, 4])
//   .on("zoom", zoomHandler) ;

// function zoomHandler() {
//   svgForceLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
// }

// zoomListener.translate([zoomWidth,zoomHeight]).scale(currentScale);//translate and scale to whatever value you wish
// zoomListener.event(svgcanvas.transition().duration(1000));//does a zoom

// var svgForceLayoutArea = svgcanvas.append("g")
//   .attr("id", "svgForceLayoutArea")
//   .attr("width", svgForceLayoutAreaWidth)
//   .attr("height", svgForceLayoutAreaHeight)
//   .attr("viewbox", 1e-6, 1e-6, d3LayoutWidth, d3LayoutHeight)
//   .attr("preserveAspectRatio", "none")
//   .attr("x", 1e-6)
//   .attr("y", 1e-6);

var divTooltip = d3.select("body").append("div") 
  .attr("class", "tooltip")       
  .style("opacity", 1e-6);

var dateTimeOverlay = svgcanvas.append("svg:g")
  .attr("class", "admin")
  .attr("id", "dateTimeOverlay")
  .append("text")
  .text("../../..  --:--:--")    
  .attr("x", DATE_TIME_OVERLAY_X)
  .attr("y", DATE_TIME_OVERLAY_Y)
  .style("opacity", 1e-6)
  .style("font-size", "1.4vmin")
  .style("text-anchor", "start")
  .style("fill", "#888888");       

var statsOverlay1 = svgcanvas.append("svg:g") // user screenname
  .attr("id", "statsOverlay1")
  .attr("class", "statsOverlay")
  .append("svg:a")
  .attr("id", "userUrl")
  .attr("xlink:show", "new")
  .attr("xlink:href", "http://threeceemedia.com/blacklivesmatter")
  .attr("x", STATS_OVERLAY1_X)
  .attr("y", STATS_OVERLAY1_Y)
  .append("text")
  .attr("id", "userScreenName")
  .attr("class", "userScreenName")
  .style("opacity", 0.4)
  .style("font-size", "1.4vmin")
  .style("fill", palette.white);

var statsOverlay2 = svgcanvas.append("svg:g")  // tweet createdAt
  .attr("id", "statsOverlay2")
  .attr("class", "statsOverlay")
  .append("text")
  .attr("id", "tweetCreatedAt")
  .text("...")    
  .attr("x", STATS_OVERLAY2_X)
  .attr("y", STATS_OVERLAY2_Y)
  .style("opacity", 0.4)
  .style("font-size", "1.4vmin")
  .style("fill", palette.white);       

var statsOverlay3 = svgcanvas.append("svg:g") // tweet text
  .attr("id", "statsOverlay3")
  .attr("class", "statsOverlay")
  .append("svg:a")
  .attr("id", "tweetUrl")
  .attr("class", "tweetUrl")
  .attr("xlink:show", "new")
  .attr("xlink:href", "http://threeceemedia.com")
  .attr("x", STATS_OVERLAY3_X)
  .attr("y", STATS_OVERLAY3_Y)
  .append("text")
  .attr("id", "tweetText")
  .attr("class", "tweetText")
  .style("opacity", 1)
  .style("font-size", "1.5vmin")
  .style("fill", "#aaaaaa");

var adminOverlay0 = svgcanvas.append("svg:g")
  .attr("class", "admin")
  .attr("id", "adminOverlay0")
  .append("text")
  .attr("id", "heartBeat")
  .text("...")    
  .attr("x", ADMIN_OVERLAY0_X)
  .attr("y", ADMIN_OVERLAY0_Y)
  .style("text-anchor", "end")
  .style("opacity", 1e-6)
  .style("font-size", "1.4vmin")
  .style("fill", "#888888");

var adminOverlay1 = svgcanvas.append("svg:g")
  .attr("class", "admin")
  .attr("id", "adminOverlay1")
  .append("text")
  .attr("id", "heartBeat")
  .text("...")    
  .attr("x", ADMIN_OVERLAY1_X)
  .attr("y", ADMIN_OVERLAY1_Y)
  .style("text-anchor", "end")
  .style("opacity", 1e-6)
  .style("font-size", "1.4vmin")
  .style("fill", "#888888");       

var adminOverlay2 = svgcanvas.append("svg:g")
  .attr("class", "admin")
  .attr("id", "adminOverlay2")
  .append("text")
  .attr("id", "heartBeat")
  .text("...")    
  .attr("x", ADMIN_OVERLAY2_X)
  .attr("y", ADMIN_OVERLAY2_Y)
  .style("text-anchor", "end")
  .style("opacity", 1e-6)
  .style("font-size", "1.4vmin")
  .style("fill", "#888888");       

var adminOverlay3 = svgcanvas.append("svg:g")
  .attr("class", "admin")
  .attr("id", "adminOverlay3")
  .append("text")
  .attr("id", "heartBeat")
  .text("LOCAL TIME: " + getTimeStamp())    
  .attr("x", ADMIN_OVERLAY3_X)
  .attr("y", ADMIN_OVERLAY3_Y)
  .style("text-anchor", "end")
  .style("opacity", 1e-6)
  .style("font-size", "1.4vmin")
  .style("fill", "#888888");


var linkSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

var nodeSvgGroup = svgForceLayoutArea.append("svg:g")
  .attr("id", "nodeSvgGroup");

var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g")
  .attr("id", "nodeLabelSvgGroup");

var node = nodeSvgGroup.selectAll("g.node");
var link = linkSvgGroup.selectAll("line");
var nodeCircles = nodeSvgGroup.selectAll("circle");
var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

var sessionUpdateQueue = new Queue();
var sessionUpdateQueueMaxInQ = 0;

//
// FORCE LAYOUT DECLARATION
//

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .gravity(gravity)
    .friction(friction)
    .charge(charge)
    .linkStrength(linkStrength)
    .size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight])
    .on("tick", tick);

window.onload = function () {
  resize();
  displayInfoOverlay(1.0);
  displayControlOverlay(true);
  getUrlVariables(function(err, urlVariablesObj){
    if (!err) {
      console.log("ON LOAD getUrlVariables\n" + jsonPrint(urlVariablesObj));
      if (urlVariablesObj.sessionId) sessionId = urlVariablesObj.sessionId;
      if (urlVariablesObj.namespace) namespace = urlVariablesObj.namespace;
    }
  });

  resetDefaultForce();

  console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
  socket.emit("VIEWER_READY", viewerObj);

  setTimeout(function(){
    pageLoadedTimeIntervalFlag = false ;
    displayControlOverlay(false);
    displayInfoOverlay(0);
  }, 5000);
};

//  CLOCK
setInterval (function () { 
  var dateTimeOverlay = d3.select("#dateTimeOverlay").select("text").text(getTimeStamp());  }, 
  1000 );

d3.select('#statsToggleButton').on("click", function() {  // STATS BUTTON

  showStatsFlag = !showStatsFlag ;

  console.log("@@@ STATS BUTTON: showStatsFlag: " + showStatsFlag);

  if (showStatsFlag || pageLoadedTimeIntervalFlag) {
    d3.select("#statsToggleButton").text("hide stats");
    displayInfoOverlay(1.0);
  }
  else {
    d3.select("#statsToggleButton").text("show stats");
    displayInfoOverlay(0);
  }
});


socket.on("HEARTBEAT", function(heartbeat){

  var overlay = d3.select("#adminOverlay0").select("text")
    .text(
      heartbeat["totalWords"] + " TOTAL WORDS"
      + " | " + heartbeat["wordCacheStats"]["keys"] + " WORDS IN CACHE"
      + " | " + heartbeat["bhtRequests"] + " BHT REQS"
      + " | " + heartbeat["promptsSent"] + " PROMPTS"
      + " | " + heartbeat["responsesReceived"] + " RESPONSES"
      );

  var overlay = d3.select("#adminOverlay1").select("text")
    .text( 
      heartbeat["numberUsers"] + " USERS"
      + " | " + heartbeat["numberTestUsers"] + " TEST USERS"
      + " | " + "SERVER HEARTBEAT: " + getTimeStamp(heartbeat["timeStamp"])
      );
});

// adminOverlay2 update
setInterval (function () {
  var overlay = d3.select("#adminOverlay2").select("text")
    .text(nodes.length + " NODES" 
      + " | " + maxNumberNodes + " MAX NODES" 
      + " | " + (Math.round( ageRate * 10 ) / 10) + " AGE RATE" 
      + " | " + sessionUpdateQueue.getLength() + " NODES IN Q"
      + " | " + sessionUpdateQueueMaxInQ + " MAX NODES IN Q"
      );

  var overlay = d3.select("#adminOverlay3").select("text")
    .text("LOCAL TIME: " + getTimeStamp());
}, 1000 );


socket.on("CONFIG_CHANGE", function(rxConfig){

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" 
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");

  if (typeof rxConfig.testMode !== 'undefined') { 
    config.testMode = rxConfig.testMode;
    console.log("\n*** ENV CHANGE: TEST_MODE:  WAS: " + previousConfig.testMode + " | NOW: " + config.testMode + "\n");
    previousConfig.testMode = config.testMode;
    testMode = config.testMode ;
  }

  if (typeof rxConfig.testSendInterval !== 'undefined') { 
    config.testSendInterval = rxConfig.testSendInterval;
    console.log("\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " + previousConfig.testSendInterval 
      + " | NOW: " + config.testSendInterval + "\n");
    testSendInterval = config.testSendInterval ;
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if (typeof rxConfig.nodeMaxAge !== 'undefined') { 
    config.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log("\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " + previousConfig.nodeMaxAge 
      + " | NOW: " + config.nodeMaxAge + "\n");
    nodeMaxAge = config.nodeMaxAge ;
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }

  resetMouseMoveTimer();
});

function displaySession(sessionObject){


  for (var i=0; i<sessionObject.wordChain.length; i++) {

    var sessionUpdateObj = {};

    sessionUpdateObj.sessionId = sessionObject.sessionId;

    console.log("WORD: " + sessionObject.wordChain[i]);

    sessionUpdateObj.sourceWord = sessionObject.wordChain[i];

    if (sessionObject.wordChain.length == 1){  // no link created is source == target
      sessionUpdateObj.targetWord = sessionObject.wordChain[i];
    }
    else if (i == sessionObject.wordChain.length-1){  // no link created is source == target
      sessionUpdateObj.targetWord = sessionObject.wordChain[i];
    }
    else {
      sessionUpdateObj.targetWord = sessionObject.wordChain[i+1];
    }

    sessionUpdateObj.sourceWord.lastSeen = dateNow;
    sessionUpdateObj.targetWord.lastSeen = dateNow;

    // console.log("> RX " + JSON.stringify(sessionObject)); ;
    console.log("> SESSION UPDATE " + sessionObject.sessionId
      + " | " + sessionUpdateObj.sourceWord.nodeId 
      + " > " + sessionUpdateObj.targetWord.nodeId
    ) ;

    if (sessionUpdateQueue.getLength() >= QUEUE_MAX) {
      console.log(">>> RX sessionObject: [Q: " 
        + sessionUpdateQueue.getLength() 
      );
      console.error(getTimeStamp() + " -- !!! Q FULL --- DROPPING SESSION UPDATE !!! " 
        + sessionUpdateQueue.getLength() + "\n\n"
      );
    }
    else {
      sessionUpdateQueue.enqueue(sessionUpdateObj);
      console.log("SESSION Q: " + sessionUpdateQueue.getLength());
      if (sessionUpdateQueue.getLength() > sessionUpdateQueueMaxInQ) { 
        sessionUpdateQueueMaxInQ = sessionUpdateQueue.getLength(); 
      }
    }
    
  }
}

socket.on("SESSION", function(sessionObject){

  if (!windowVisible) {
    return ;
  }

  console.log("> RX SESSION"
    + " | SID: " + sessionObject.sessionId
    + " | WCL: " + sessionObject.wordChainLength
    + " | WCSL: " + sessionObject.wordChainSegmentLength
    + " | WCI: " + sessionObject.wordChainIndex
    + " | " + sessionObject.word.nodeId
  );

  // var currentSession;

  if (sessionHashMap.has(sessionObject.sessionId)){
    currentSession = sessionHashMap.get(sessionObject.sessionId);
  }
  else {

    sessionsCreated++;
    var startColor = "hsl(" + Math.random() * 360 + ",100%,50%)";
    var endColor = "hsl(" + Math.random() * 360 + ",0%,0%)";
    var interpolateNodeColor = d3.interpolateHcl(endColor, startColor);

    sessionObject.colors = {'startColor': startColor, 'endColor': endColor};
    sessionObject.interpolateColor = interpolateNodeColor;
    currentSession = sessionObject ;
    currentSession.wordChain = [];
    currentSession.initialPosition = computeInitialPosition(sessionsCreated);

    console.log("NEW SESSION " + currentSession.sessionId + " POS: " + jsonPrint(currentSession.initialPosition));

  }

  currentSession.lastSeen = dateNow;

  currentSession.wordChain[sessionObject.wordChainIndex] = sessionObject.word;
  
  sessionHashMap.set(currentSession.sessionId, currentSession);

  createNode(currentSession.sessionId, sessionObject.word, function(){
    if (currentSession.wordChain[sessionObject.wordChainIndex-1]) {
      if (nodeHashMap[currentSession.wordChain[sessionObject.wordChainIndex-1].nodeId]) {
        console.log("@@@ < CREATE PREV LINNK");
        createLinks(
          { sessionId: sessionObject.sessionId, 
            sourceWord: currentSession.wordChain[sessionObject.wordChainIndex-1],
            targetWord: sessionObject.word
          },
          function(){});
      }
    }
    if (currentSession.wordChain[sessionObject.wordChainIndex+1]) {
      if (nodeHashMap[currentSession.wordChain[sessionObject.wordChainIndex+1].nodeId]) {
        console.log("@@@ > CREATE NEXT LINNK");
        createLinks(
          { sessionId: sessionObject.sessionId, 
            sourceWord: sessionObject.word,
            targetWord: currentSession.wordChain[sessionObject.wordChainIndex+1]
          },
          function(){});
      }
    }
  });

  // if (sessionObject.wordChainSegmentLength == sessionObject.wordChainIndex+1){
  //   console.log("CHAIN COMPLETE: " + sessionObject.wordChainLength);
  //   displaySession(currentSession);
  // }
});

var sessionsCreated = 0;

socket.on("SESSION_UPDATE", function(sessionObject){

  if (!windowVisible) {
    return ;
  }

  if (sessionMode && (sessionObject.sessionId !== currentSession.sessionId)) {
    if (debug)  console.log("... SKIP SESSION_UPDATE: ID: " + sessionObject.sessionId + " | CURRENT SESSION: " + currentSession.sessionId);
    return;
  }

  // var currentSession;

  if (sessionHashMap.has(sessionObject.sessionId)){
    currentSession = sessionHashMap.get(sessionObject.sessionId);
    currentSession.sourceWord = sessionObject.sourceWord;
    currentSession.targetWord = sessionObject.targetWord;
    currentSession.sourceWord.fixed = true;
    currentSession.targetWord.fixed = false;
    currentSession.sourceWord.lastSeen = dateNow;
    if (currentSession.targetWord) sessionObject.targetWord.lastSeen = dateNow;
  }
  else {

    sessionsCreated++;
    currentSession = sessionObject ;
    currentSession.initialPosition = computeInitialPosition(sessionsCreated);

    currentSession.sourceWord.fixed = true;
    currentSession.targetWord.fixed = false;

    var startColor = "hsl(" + Math.random() * 360 + ",100%,50%)";
    var endColor = "hsl(" + Math.random() * 360 + ",0%,0%)";
    var interpolateNodeColor = d3.interpolateHcl(endColor, startColor);

    currentSession.colors = {'startColor': startColor, 'endColor': endColor};
    currentSession.interpolateColor = interpolateNodeColor;

    // currentSession.colors = {'startColor': startColor, 'endColor': endColor},
    // sessionHashMap.set(sessionObject.sessionId, sessionObject);

    console.log("NEW SESSION " + sessionObject.sessionId + " POS: " + jsonPrint(sessionObject.initialPosition));
  }

  currentSession.sourceWord.lastSeen = dateNow;


  // console.log("> RX " + JSON.stringify(sessionObject)); ;
  // console.log(getTimeStamp() + ">>> RX SESSION_UPDATE\n" + JSON.stringify(sessionObject, null, 3)) ;

    sessionHashMap.set(sessionObject.sessionId, currentSession);



  if (sessionObject.targetWord) {
    console.log("> RX"
      + " | " + sessionObject.sessionId
      + " | " + sessionObject.sourceWord.nodeId 
      + " > " + sessionObject.targetWord.nodeId
    ) ;
  }
  else {
    console.log("> RX"
      + " | " + sessionObject.sessionId
      + " | " + sessionObject.sourceWord.nodeId 
    ) ;
  }

  if (sessionUpdateQueue.getLength() >= QUEUE_MAX) {
    console.log(">>> RX sessionObject: [Q: " 
      + sessionUpdateQueue.getLength() 
    );
    console.error(getTimeStamp() + " -- !!! Q FULL --- DROPPING SESSION UPDATE !!! " 
      + sessionUpdateQueue.getLength() + "\n\n"
    );
  }
  else {
    sessionUpdateQueue.enqueue(sessionObject);
    if (sessionUpdateQueue.getLength() > sessionUpdateQueueMaxInQ) { 
      sessionUpdateQueueMaxInQ = sessionUpdateQueue.getLength(); 
    }
  }
});


//=============================
// TICK
//=============================

function tick(e) {

  // var k = 2 * e.alpha;
  // nodes.forEach(function(o, i) {
  //   // o.y += i & 1 ? k : -k;
  //   o.x += (0.1 + Math.abs(0.00001 * o.x * k));
  // });

  node
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" });

  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; })

  nodeCircles
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  nodeLabels
    .attr("x", function(d) { return d.x ; })
    .attr("y", function(d) { 
      var shiftY = -1.8 * (fontSizeScale(d.mentions + 1) + defaultRadiusScale(d.mentions + 1));
      return d.y + shiftY ; 
    });
}

var age ;

var initialPosition = {};
initialPosition.x = 10;
initialPosition.y = 10;

var nodeObject = {} ;
var newNodesFlag = false ;
var deadNodesFlag = false ;
var newLinksFlag = false ;

var mouseOverRadiusMultiplier = 2.0 ;
var mouseOverRadius = 10 ;
var mouseMovingFlag = false ;
var mouseHoverFlag = false ;
var mouseHoverNodeId ;
var mouse = {} ;

//================================
// GET NODES FROM QUEUE
//================================

var radiusX = 0.4*width;
var radiusY = 0.4*height;

function computeInitialPosition(index) {
  return { 
    // x: (Math.random() * nodeInitialX), 
    // y: (Math.random() * nodeInitialY) 
    x: ((0.5 * width) + (radiusX * Math.cos(index))), 
    y: ((0.5 * height) - (radiusY * Math.sin(index)))
    // x: (0.8 * width)- (0.6 * width * Math.random()), 
    // y: (0.8 * height)- (0.6 * height * Math.random())
    // y: translate[1] + (height * Math.random()), 
    // x: translate[0] + -(width * (0.4 * Math.random()))
  };
}

var nodesLength, nodeIndex = 0, chainIndex = 0 ;
var tempMentions ;

var sessionLatestNode = {};

var currentNodeId ;
var currentNodeIndex = 0;

var createNode = function (sessionId, wordObject, callback) {

  if (!wordObject) {
    callback (null, newNodesFlag, deadNodesFlag);
    return;
  }

  currentNodeId = wordObject.nodeId ;

  // console.log("createNode: SID: " + sessionId + " | " + wordObject.nodeId + " | M: " + wordObject.mentions);

  wordObject.fixed = true;

  if (typeof sessionLatestNode[sessionId] !== 'undefined'){
    sessionLatestNode[sessionId].fixed = false ;
    sessionLatestNode[sessionId] = wordObject ;
  }
  else {
    sessionLatestNode[sessionId] = wordObject ;
  }

  var err = null ;
  var forceStopped = false ;

  force.stop();

  if (currentNodeId in nodeHashMap) {
    // console.log("@@@--- NODE IN HM: " + sessionId + " | " + wordObject.nodeId);

    currentNodeObject = nodeHashMap[currentNodeId];

    currentNodeObject.sessionId = sessionId ;
    // currentNodeObject.fixed = false;
    currentNodeObject.age = dateNow - wordObject.lastSeen;
    currentNodeObject.lastSeen = wordObject.lastSeen;
    currentNodeObject.mentions = wordObject.mentions ;
    currentNodeObject.text = currentNodeId ;
    // currentNodeObject.fixed = wordObject.fixed ;

    nodesLength = nodes.length ;

    currentNodeIndex = currentNodeObject.nodeIndex ;

    console.log("currentNodeObject: " + currentNodeObject.nodeId + " | currentNodeIndex: " + currentNodeIndex + " | nodes: " + nodesLength);

    if (currentNodeIndex >= nodesLength){
      console.error("!!! currentNodeIndex >= nodesLength: " + currentNodeIndex + " v. " + nodesLength);

      for (nodeIndex = 0; nodeIndex < nodesLength; nodeIndex++){

        currentNodeObject.nodeIndex = nodeIndex ;
        nodeHashMap[currentNodeId] = currentNodeObject ;

        if (nodes[nodeIndex].nodeId == currentNodeId) { 

          tempMentions = nodes[nodeIndex].mentions;
          nodes[nodeIndex].mentions = currentNodeObject.mentions > tempMentions ? 
            currentNodeObject.mentions : tempMentions ;

          nodes[nodeIndex].age = dateNow - currentNodeObject.lastSeen;
          nodes[nodeIndex].lastSeen = currentNodeObject.lastSeen;
          nodes[nodeIndex].fixed = currentNodeObject.fixed;
          break;
        }
      }

    }
    else {

      tempMentions = nodes[currentNodeIndex].mentions;
      nodes[currentNodeIndex].mentions = currentNodeObject.mentions > tempMentions ? 
        currentNodeObject.mentions : tempMentions ;

      nodes[currentNodeIndex].age = dateNow - currentNodeObject.lastSeen;
      nodes[currentNodeIndex].lastSeen = currentNodeObject.lastSeen;
      nodes[currentNodeIndex].fixed = currentNodeObject.fixed;
    }

    // for (nodeIndex = 0; nodeIndex < nodesLength; nodeIndex++){

    //   if (nodes[nodeIndex].nodeId == currentNodeId) { 

    //     tempMentions = nodes[nodeIndex].mentions;
    //     nodes[nodeIndex].mentions = currentNodeObject.mentions > tempMentions ? 
    //       currentNodeObject.mentions : tempMentions ;

    //     nodes[nodeIndex].age = dateNow - currentNodeObject.lastSeen;
    //     nodes[nodeIndex].lastSeen = currentNodeObject.lastSeen;
    //     nodes[nodeIndex].fixed = currentNodeObject.fixed;
    //     break;
    //   }
    // }
  }
  else {
    // console.log("@@@--- NODE *NOT* IN HM: " + sessionId + " | " + wordObject.nodeId);

    nodesCreated++;
    newNodesFlag = true ;

    if (sessionIds[sessionId]) {
      sessionIds[sessionId]++;
    }
    else {
      sessionIds[sessionId] = 1;
    }

    if (!sessionHashMap.has(sessionId)){
      console.warn("??? SESSION NOT IN HASH ??? " + sessionId + " ... SKIPPING");
      callback (null, newNodesFlag, deadNodesFlag);
      return;
    }

    currentSession = sessionHashMap.get(sessionId);

    wordObject.x = currentSession.initialPosition.x + (0.1 * currentSession.initialPosition.x * Math.random());  // avoid creating nodes onto of each other
    wordObject.y = currentSession.initialPosition.y;


    if ((typeof wordObject.mentions === 'undefined') || (wordObject.mentions == null)) {
      console.log("wordObject\n" + JSON.stringify(wordObject));
      wordObject.mentions = 1;
      console.log("wordObject\n" + JSON.stringify(wordObject));
    }

    wordObject.sessionId = sessionId;
    wordObject.age = dateNow - wordObject.lastSeen ;
    wordObject.lastSeen = dateNow;
    wordObject.ageUpdated = dateNow;
    wordObject.text = wordObject.nodeId ;

    wordObject.colors = currentSession.colors ;
    wordObject.interpolateColor = currentSession.interpolateColor ;

    wordObject.nodeIndex = nodes.length-1;  // to find node in nodes array later

    nodeHashMap[wordObject.nodeId] = wordObject;
    nodes.push(wordObject);
  }

  callback (null, newNodesFlag, deadNodesFlag);
}

var createLinks = function (sessionObject, callback) {

  newLinksFlag = false ;

  if (!sessionObject.targetWord) {
    console.log("createLinks | NO LINK CREATED | NO TARGET: " + sessionObject.sourceWord.nodeId);
    callback (null, newNodesFlag, deadNodesFlag);
    return;
  }

  links.push({
    sessionId: sessionObject.sessionId,
    source: nodeHashMap[sessionObject.sourceWord.nodeId], 
    target: nodeHashMap[sessionObject.targetWord.nodeId], 
  });

  callback (null, newNodesFlag, deadNodesFlag);
}


var numberSessionsUpdated = 0 ;
var MAX_UPDATES_PER_CYCLE = 5 ;

var sessionDeQobject = {};

var getNodeFromQueue = function (callback) {

  newNodesFlag = false ;
  deadNodesFlag = false ;

  //========================
  // CHECK QUEUE
  //========================

  numberSessionsUpdated = 0;

  // while ((numberSessionsUpdated < MAX_UPDATES_PER_CYCLE) && (sessionUpdateQueue.getLength() > 0)) {
  // while (sessionUpdateQueue.getLength() > 0){
  if (sessionUpdateQueue.getLength() > 0){
    numberSessionsUpdated++ ;

    if (sessionUpdateQueue.getLength() > QUEUE_MAX) {
      sessionUpdateQueue.dequeue();
    }

    sessionDeQobject = sessionUpdateQueue.dequeue();

    createNode(sessionDeQobject.sessionId, sessionDeQobject.sourceWord, function(newNodesFlag, deadNodesFlag){
      createNode(sessionDeQobject.sessionId, sessionDeQobject.targetWord, function(newNodesFlag, deadNodesFlag){
        createLinks(sessionDeQobject, function(newNodesFlag, deadNodesFlag){
        });
      });
    });

  }

  callback(null, newNodesFlag, deadNodesFlag);
}

var lastD3TimeCount = 0;

var ageNodesLength = 0;
var ageNodesIndex = 0;
var linkExists = false;
var ageLinksLength = 0;
var ageLinksIndex = 0;

var sessionIdKeys = [];

var ageNodes = function (newNodesFlag, deadNodesFlag, callback){

  if (nodes.length === 0) {
    ageRate = DEFAULT_AGE_RATE ;
  }
  else if (nodes.length > 100) {
    ageRate = adjustedAgeRateScale(nodes.length-100);
  }
  else {
    ageRate = DEFAULT_AGE_RATE ;
  }

  ageNodesLength = nodes.length-1 ;
  ageNodesIndex = nodes.length-1 ;


  for (ageNodesIndex = ageNodesLength; ageNodesIndex>=0; ageNodesIndex--) {  

    linkExists = false ;

    currentNodeObject = nodes[ageNodesIndex];
    currentNodeObject.nodeIndex = ageNodesIndex ;

    age = currentNodeObject.age + (ageRate * (dateNow - currentNodeObject.ageUpdated));
 
    if (age > nodeMaxAge) {

      deadNodesFlag = true ;

      delete nodeHashMap[currentNodeObject.nodeId];

      ageLinksLength = links.length-1;
      ageLinksIndex = links.length-1;

      for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex--) {
        if (currentNodeObject.nodeId == links[ageLinksIndex].target.nodeId) {
          links.splice(ageLinksIndex, 1); 
          force.links(links);
        }
        else if (currentNodeObject.nodeId == links[ageLinksIndex].source.nodeId) {
          links.splice(ageLinksIndex, 1); 
          force.links(links);
        }
      }

      nodes.splice(ageNodesIndex, 1); 
      console.warn("><>< REMOVED DEAD NODE " + currentNodeObject.nodeId + " | ANI: " + ageNodesIndex + " | nodes " + nodes.length);

      var newCurrentNodeObject = nodes[nodes.length-1];
      newCurrentNodeObject.nodeIndex = nodes.length-1 ;
      nodeHashMap[newCurrentNodeObject.nodeId] = newCurrentNodeObject;

      sessionIds[currentNodeObject.sessionId]--;

      if (sessionIds[currentNodeObject.sessionId] < 1) {
        sessionIdKeys = Object.keys(sessionIds) ;
        console.log("XXXX SESSION EXPIRED: " + currentNodeObject.sessionId + " | " + sessionIds[currentNodeObject.sessionId]);
        delete sessionIds[currentNodeObject.sessionId] ;
        delete sessionLatestNode[currentNodeObject.sessionId];
        sessionHashMap.remove(currentNodeObject.sessionId) ;
      }

    }
    else {

      currentNodeObject.age = age;
      currentNodeObject.ageUpdated = dateNow;

      nodes[ageNodesIndex].age = age;
      nodes[ageNodesIndex].ageUpdated = dateNow;

      currentNodeObject.nodeIndex = ageNodesIndex;

      nodeHashMap[currentNodeObject.nodeId] = currentNodeObject;
    }
  }

  if (nodes.length > maxNumberNodes) { 
    maxNumberNodes = nodes.length; 
  }  

  callback(null, newNodesFlag, deadNodesFlag);
}

var updateNodes = function (newNodesFlag, deadNodesFlag, callback) {

  node = node.data(force.nodes(), function(d) { return d.nodeId;})
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("mentions", function(d) { return nodeHashMap[d.nodeId].mentions; })
    .attr("lastSeen", function(d) { return d.lastSeen; });

  node.enter()
    .append("svg:g")
    .attr("class", "node")
    .attr("nodeType", function(d) { return d.nodeType; })
    .attr("nodeId", function(d) { return d.nodeId; })
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("lastSeen", function(d) { return d.lastSeen; });

  node.exit()
    .remove();

  callback(null, newNodesFlag, deadNodesFlag);
} 

var updateLinks = function (newNodesFlag, deadNodesFlag, callback) {

  link = linkSvgGroup.selectAll("line").data(force.links(), 
    function(d) { return d.source.nodeId + "-" + d.target.nodeId; });

  link
    .style('stroke', function(d){ return linkColorScale(d.target.age) ;});
    // .style('opacity', function(d){ return 1.0; });

  link.enter()
    .append("svg:line", "g.node")
    .attr("class", "link")
    .style('stroke', function(d){ return linkColorScale(d.target.age) ;})
    .style('stroke-width', 1.5)
    .style('opacity', 1e-6)
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', function(d){
        return (nodeMaxAge - d.target.age) / nodeMaxAge ;
      });

  link
    .exit()
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", 1e-6)
    .remove();

  callback(null, newNodesFlag, deadNodesFlag);
}

var updateNodeCircles = function (newNodesFlag, deadNodesFlag, callback) {

  nodeCircles = nodeSvgGroup.selectAll("circle").data(force.nodes(), 
    function(d) { return d.nodeId; })

  nodeCircles
    .attr("lastSeen", function(d) { return d.lastSeen; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("r", function(d) { return defaultRadiusScale(d.mentions + 1); })
    .style("fill", function(d) { return d.interpolateColor((nodeMaxAge - d.age) / nodeMaxAge) ;})
    .style('stroke', function(d){ return strokeColorScale(d.age); });

  nodeCircles
    .enter()
    .append("svg:circle")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("mouseover", 0)
    .on("mouseover", nodeMouseover)
    .on("mouseout", nodeMouseout)
    .on("dblclick", nodeClick)
    .call(force.drag)
    .attr("nodeId",function(d) { return d.nodeId;} )
    .attr("nodeType", function(d) { return d.nodeType; })
    .attr("lastSeen", function(d) { return d.lastSeen; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("nodeText", function(d) { return d.text; })
    .attr("r", function(d) { 
      return defaultRadiusScale(d.mentions + 1); 
    })
    .style("visibility", "visible") 
    .style("opacity", 1e-6)
    .style('stroke', function(d){ return strokeColorScale(d.age) ;})
    .style("stroke-width", 2.5)
    .style("fill", function(d) { 
      return d.interpolateColor((nodeMaxAge - d.age) / nodeMaxAge) ;
    })
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', function(d){ return 1.0; });

  nodeCircles
    .exit()
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', 1e-6)
    .remove();

  callback(null, newNodesFlag, deadNodesFlag);
}

var updateNodeLabels = function (newNodesFlag, deadNodesFlag, callback) {
  
  nodeLabels = nodeLabelSvgGroup.selectAll(".nodeLabel").data(force.nodes(), 
    function(d) { return d.nodeId; })
    .text(function(d) { return d.text; })
    // .text(function(d) { return (d.text + " | " + d.age); })
    .style("font-size", function(d) { 
      return fontSizeScale(nodeHashMap[d.nodeId].mentions + 1.1) + "vmin"; 
    })
    .style('opacity', function(d){
      return (nodeMaxAge - d.age) / nodeMaxAge ;
      // return 1 ;
    });

  nodeLabels.enter()
    .append("svg:text")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("class", "nodeLabel")
    .attr("nodeType", function(d) { return d.nodeType; })
    .attr("id", function(d) { return d.nodeId; })
    .attr("nodeId", function(d) { return d.nodeId; })
    // .text(function(d) { return (d.text + " | " + d.age); })
    .text(function(d) { return d.text; })
    .style("text-anchor", "middle")
    .style("opacity", 1e-6)
    .style("fill", "#eeeeee")
    .style("font-size", function(d) { return fontSizeScale(nodeHashMap[d.nodeId].mentions + 1.1) + "vmin"; })
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", function(d) { 
        return (nodeMaxAge - d.age) / nodeMaxAge ;
      });

  nodeLabels.exit()
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", 1e-6)
      .remove();

  callback(null, newNodesFlag, deadNodesFlag);
}

function ageNodesCheckQueue() {
  async.waterfall([ 
      getNodeFromQueue,
      ageNodes,
      updateLinks,
      updateNodes,
      updateNodeCircles,
      updateNodeLabels
    ], 
    
    function(err, newNodesFlag, deadNodesFlag){
      if (err) { 
        console.error("*** ERROR: ageNodesCheckQueue *** \nERROR: " + error + "\nRESULT: " + result); 
      }
      force.start(); 
    }
  );
}

function nodeFill (age) { 
  var fillColor ;
  return fillColorScale(age) ;
}

function nodeMouseover(d) { 

  mouseHoverFlag = true ;
  mouseHoverNodeId = d.nodeId ;

  var nodeId = d.nodeId ;
  var sessionId = d.sessionId ;
  var mentions = d.mentions ;
  var currentR = d3.select(this).attr("r");

  d3.select("body").style("cursor", "pointer");

  d3.select(this)
    .attr("mouseover", 1)
    .style("fill", palette.blue)
    .style("opacity", 1)
    .style("stroke", palette.red)
    .style("stroke-width", 3)
    .attr("r", function() {
      return Math.max(mouseOverRadius, currentR);
    });


  divTooltip.transition()    
    .duration(defaultFadeDuration)    
    .style("opacity", 1);

  var tooltipString =  "<bold>" + nodeId + "</bold>" + "<br>MENTIONS: " + mentions + "<br>" + sessionId;

  divTooltip.html(tooltipString) 
    .style("left", (d3.event.pageX - 40) + "px")   
    .style("top", (d3.event.pageY - 50) + "px");  
}

function nodeMouseout() {

  mouseHoverFlag = false ;

  var nodeId = d3.select(this).attr("nodeId") ;
  var mentions = d3.select(this).attr("mentions") ;
  var age = d3.select(this).attr("age") ;

  var fillColor = nodeFill(age);

  d3.select("body").style("cursor", "default");

  d3.select(this).style("fill", fillColor)
    .style("stroke", "#eeeeee")
    .style("stroke-width", 1.5)
    .attr("mouseover", 0)
    .attr("r", function(d) {       
      return defaultRadiusScale(d.mentions + 1); 
     });

    divTooltip.transition()   
      .duration(defaultFadeDuration)    
      .style("opacity", 1e-6); 
}

function nodeClick(d) {
  launchSessionView(d.sessionId);
}

d3.timer(function () {
  dateNow = moment().valueOf();
  if (!(mouseMovingFlag && mouseFreezeEnabled)) ageNodesCheckQueue();
});
