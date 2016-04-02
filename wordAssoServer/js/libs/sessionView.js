/*ver 0.47*/
/*jslint node: true */
"use strict";

if(typeof(Worker) !== "undefined") {
  console.log("Worker!");
} else {
  console.log("NO Worker!");
}

var serverConnected = false ;
var serverHeartbeatTimeout = 30000 ;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 15047;

var debug = true;
var MAX_RX_QUEUE = 250;

var forceStopped = false;
var mouseMovingFlag = false;

var sessionsCreated = 0;

var mouseMoveTimeoutInterval = 1000; 
var mouseFreezeEnabled = true;
var mouseOverRadius = 10;
var mouseHoverFlag = false;
var mouseHoverNodeId;

var MAX_WORDCHAIN_LENGTH = 100;

var DEFAULT_MAX_AGE = 10000.0;
var DEFAULT_AGE_RATE = 1.0;

var ageRate = DEFAULT_AGE_RATE;
var nodeMaxAge = DEFAULT_MAX_AGE;

var DEFAULT_CHARGE = -350;
var DEFAULT_GRAVITY = 0.05;
var DEFAULT_LINK_STRENGTH = 0.4;
var DEFAULT_FRICTION = 0.75;

var DEFAULT_SESSION_CONFIG = {
    'charge': DEFAULT_CHARGE,
    'friction': DEFAULT_FRICTION,
    'linkStrength': DEFAULT_LINK_STRENGTH,
    'gravity': DEFAULT_GRAVITY,
    'ageRate': DEFAULT_AGE_RATE,
    'sessionMode': false,
    'sessionModeId': '',
    'monitorMode': false,
    'monitorModeId': ''  // will be used to select which session to monitor
};

var charge = DEFAULT_CHARGE;
var gravity = DEFAULT_GRAVITY;
var linkStrength = DEFAULT_LINK_STRENGTH;
var friction = DEFAULT_FRICTION;


var SESSION_CONFIG = {};
SESSION_CONFIG = DEFAULT_SESSION_CONFIG;

var QUEUE_MAX = 200;

var sessionHashMap = {};

var urlRoot = "http://localhost:9997/session?session=";

var nodeHashMap = {};
var deadNodeHashMap = new StringMap();

var dateNow = moment().valueOf();
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var currentSession = {};
var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

var defaultFadeDuration = 250;

var width = window.innerWidth * 1;
var height = window.innerHeight * 1;

var currentScale = 0.7 ;
var translate = [0,0] ;

var zoomWidth = (width - currentScale * width)/2  ;
var zoomHeight =  (height - currentScale * height)/2  ;

var D3_LAYOUT_WIDTH_RATIO = 1.0;
var D3_LAYOUT_HEIGHT_RATIO = 1.0;

var FORCE_LAYOUT_WIDTH_RATIO = 1.0;
var FORCE_LAYOUT_HEIGHT_RATIO = 1.0;

var d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO;
var d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO;

var radiusX = 0.4*width;
var radiusY = 0.4*height;
console.log("width: " + width + " | height: " + height);

var showStatsFlag = false;
var pageLoadedTimeIntervalFlag = true;

var DEFAULT_CONFIG = { 'nodeMaxAge': DEFAULT_MAX_AGE };

var config = DEFAULT_CONFIG;
var previousConfig = [];

var DEFAULT_ADMIN_OVERLAY0_X = 0.95;
var DEFAULT_ADMIN_OVERLAY0_Y = 0.10;

var DEFAULT_ADMIN_OVERLAY1_X = 0.95;
var DEFAULT_ADMIN_OVERLAY1_Y = 0.08;

var DEFAULT_ADMIN_OVERLAY2_X = 0.95;
var DEFAULT_ADMIN_OVERLAY2_Y = 0.12;

var DEFAULT_ADMIN_OVERLAY3_X = 0.95;
var DEFAULT_ADMIN_OVERLAY3_Y = 0.06;

var DEFAULT_STATS_OVERLAY1_X = 0.05;
var DEFAULT_STATS_OVERLAY1_Y = 0.84;

var DEFAULT_STATS_OVERLAY2_X = 0.05;
var DEFAULT_STATS_OVERLAY2_Y = 0.86;

var DEFAULT_STATS_OVERLAY3_X = 0.05;
var DEFAULT_STATS_OVERLAY3_Y = 0.88;

var DEFAULT_STATS_OVERLAY4_X = 0.05;
var DEFAULT_STATS_OVERLAY4_Y = 0.90;

var DEFAULT_DATE_TIME_OVERLAY_X = 0.95;
var DEFAULT_DATE_TIME_OVERLAY_Y = 0.04;

var ADMIN_OVERLAY0_X;
var ADMIN_OVERLAY0_Y;

var ADMIN_OVERLAY1_X;
var ADMIN_OVERLAY1_Y;

var ADMIN_OVERLAY2_X;
var ADMIN_OVERLAY2_Y;

var ADMIN_OVERLAY3_X;
var ADMIN_OVERLAY3_Y;

var STATS_OVERLAY1_X;
var STATS_OVERLAY1_Y;

var STATS_OVERLAY2_X;
var STATS_OVERLAY2_Y;

var STATS_OVERLAY3_X;
var STATS_OVERLAY3_Y;

var STATS_OVERLAY4_X;
var STATS_OVERLAY4_Y;

var DATE_TIME_OVERLAY_X;
var DATE_TIME_OVERLAY_Y;

STATS_OVERLAY1_X = DEFAULT_STATS_OVERLAY1_X * width;
STATS_OVERLAY1_Y = DEFAULT_STATS_OVERLAY1_Y * height;

STATS_OVERLAY2_X = DEFAULT_STATS_OVERLAY2_X * width;
STATS_OVERLAY2_Y = DEFAULT_STATS_OVERLAY2_Y * height;

STATS_OVERLAY3_X = DEFAULT_STATS_OVERLAY3_X * width;
STATS_OVERLAY3_Y = DEFAULT_STATS_OVERLAY3_Y * height;

STATS_OVERLAY4_X = DEFAULT_STATS_OVERLAY4_X * width;
STATS_OVERLAY4_Y = DEFAULT_STATS_OVERLAY4_Y * height;

DATE_TIME_OVERLAY_X = DEFAULT_DATE_TIME_OVERLAY_X * width;
DATE_TIME_OVERLAY_Y = DEFAULT_DATE_TIME_OVERLAY_Y * height;


var defaultTextFill = "#888888";

console.log("@@@@@@@ CLIENT @@@@@@@@");

function jsonPrint(obj) {
  if ((obj) || (obj === 0)) {
    var jsonString = JSON.stringify(obj, null, 2);
    return jsonString;
  }
  else {
    return "UNDEFINED";
  }
}

function setLinkstrengthSliderValue(value){
  document.getElementById("linkstrengthSlider").value = value * 1000;
  document.getElementById("linkstrengthSliderText").innerHTML = value.toFixed(3);
}

function setFrictionSliderValue(value){
  document.getElementById("frictionSlider").value = value * 1000;
  document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
}

function setGravitySliderValue(value){
  document.getElementById("gravitySlider").value = value * 1000;
  document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
}

function setChargeSliderValue(value){
  document.getElementById("chargeSlider").value = value;
  document.getElementById("chargeSliderText").innerHTML = value;
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

function displayInfoOverlay(opacity, color) {


  d3.select("#adminOverlay0").select("text").style("opacity", opacity);
  d3.select("#adminOverlay1").select("text").style("opacity", opacity);
  d3.select("#adminOverlay2").select("text").style("opacity", opacity);
  d3.select("#adminOverlay3").select("text").style("opacity", opacity);

  d3.select("#dateTimeOverlay").select("text").style("opacity", opacity);

  d3.select("#statsOverlay1").style("opacity", opacity);
  d3.select("#statsOverlay2").style("opacity", opacity);
  d3.select("#statsOverlay3").style("opacity", opacity);
  d3.select("#statsOverlay4").style("opacity", opacity);

  if (color) {

  console.warn("displayInfoOverlay", opacity, color);

    d3.select("#adminOverlay0").select("text").style("fill", color);
    d3.select("#adminOverlay1").select("text").style("fill", color);
    d3.select("#adminOverlay2").select("text").style("fill", color);
    d3.select("#adminOverlay3").select("text").style("fill", color);

    d3.select("#dateTimeOverlay").select("text").style("fill", color);

    d3.select("#statsOverlay1").style("fill", color);
    d3.select("#statsOverlay2").style("fill", color);
    d3.select("#statsOverlay3").style("fill", color);
    d3.select("#statsOverlay4").style("fill", color);
  }
}

var randomIntFromInterval = function (min,max) {
  var random = Math.random();
  var randomInt = Math.floor((random*(max-min+1))+min);
  return randomInt;
};

var randomId = randomIntFromInterval(1000000000,9999999999);

var viewerObj = {
  userId: 'VIEWER_RANDOM_' + randomId,
  viewerId: 'VIEWER_RANDOM_' + randomId,
  screenName: 'VIEWER RANDOM ' + randomId,
  type: "VIEWER",
};

var mouseMoveTimeout = setTimeout(function(){
  d3.select("body").style("cursor", "none");
  if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
    displayInfoOverlay(1);
  }
  displayControlOverlay(true);
}, mouseMoveTimeoutInterval);



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

    mouseMovingFlag = false;
  }, mouseMoveTimeoutInterval);
}

function getTimeStamp(inputTime) {
  var options = {
    weekday: "long", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit"
  };

  var currentDate;
  var currentTime;

  if (inputTime === 'undefined') {
    currentDate = new Date().toDateString("en-US", options);
    currentTime = new Date().toTimeString('en-US', options);
  }
  else {
    currentDate = new Date(inputTime).toDateString("en-US", options);
    currentTime = new Date(inputTime).toTimeString('en-US', options);
  }
  return currentDate + " - " + currentTime;
}

function getBrowserPrefix() {
  // Check for the unprefixed property.
  // if ('hidden' in document) {
  if (document.hidden !== 'undefined') {
    return null;
  }
  // All the possible prefixes.
  var browserPrefixes = ['moz', 'ms', 'o', 'webkit'];
  var prefix;

  browserPrefixes.forEach(function(p){
    prefix = p + 'Hidden';
    if (document[prefix] !== 'undefined') {
      return p;
    }
  });

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

function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + 'visibilitychange';
  } else {
    return 'visibilitychange';
  }
}

var socket = io('/view');

socket.on("VIEWER_ACK", function(viewerSessionKey){

  serverConnected = true;

  console.log("RX VIEWER_ACK | SESSION KEY: " + viewerSessionKey);

  updateStatsOverlay4(socket.id + " | " + viewerSessionKey);

  if (sessionMode) {
    console.log("SESSION MODE"
      + " | SID: " + sessionId
      + " | NSP: " + namespace
    );
    var tempSessionId = "/" + namespace + "#" + sessionId ;
    currentSession.sessionId = tempSessionId;
    console.log("TX GET_SESSION | " + currentSession.sessionId);
    socket.emit("GET_SESSION", currentSession.sessionId);
  }
});

socket.on("reconnect", function(){

  serverConnected = true ;

  socket.emit("VIEWER_READY", viewerObj);
  if (sessionMode) {
    console.log("SESSION MODE"
      + " | SID: " + sessionId
      + " | NSP: " + namespace
    );
    var tempSessionId = "/" + namespace + "#" + sessionId ;
    currentSession.sessionId = tempSessionId;
    socket.emit("GET_SESSION", currentSession.sessionId);
  }
});

socket.on("connect", function(){
  serverConnected = true;
  displayInfoOverlay(1.0, defaultTextFill);
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
  updateStatsOverlay4(socket.id);

});

socket.on("disconnect", function(){
  serverConnected = false;
  displayInfoOverlay(1.0, 'red');
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  deleteAllSessions(function(){
    console.log("DELETED ALL SESSIONS");
  });
});

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
var visibilityEvent = getVisibilityEvent(prefix);

document.addEventListener(visibilityEvent, function() {
  console.log("visibilityEvent");
  if (!document[hidden]) {
    windowVisible = true;
  } else {
    windowVisible = false;
  }
});


d3.select("body").style("cursor", "default");

function getUrlVariables(callbackMain){

  var urlSessionId;
  var urlNamespace;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split('&');

  var asyncTasks = [];

  variableArray.forEach(

    function(variable, callback){

      asyncTasks.push(function(callback2){

        var keyValuePair = variable.split('=');

        if (keyValuePair[1] !== 'undefined'){

          console.warn("'" + variable + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);

          if (keyValuePair[0] === 'monitor') {
            monitorMode = keyValuePair[1];
            console.log("MONITOR MODE | monitorMode: " + monitorMode);
            return(callback2(null, {monitorMode: monitorMode}));
          }
          if (keyValuePair[0] === 'session') {
            urlSessionId = keyValuePair[1];
            console.warn("SESSION MODE | urlSessionId: " + urlSessionId);
            return(callback2(null, {sessionMode: true, sessionId: urlSessionId}));
            // return(callback2(null, {sessionMode: sessionMode}));
          }
          if (keyValuePair[0] === 'nsp') {
            urlNamespace = keyValuePair[1];
            console.log("namespace: " + urlNamespace);
            return(callback2(null, {namespace: urlNamespace}));
          }
        }
        else {
          console.log("NO URL VARIABLES");
          return(callback2(null, null));
        }

      });
    }
  );

  async.parallel(asyncTasks, function(err, results){
    console.log("results\n" + jsonPrint(results));
    results.forEach(function(resultObj){
      console.warn("resultObj\n" + jsonPrint(resultObj));

      // KLUDGE ?????? should set global var here (not in asyncTasks above)
      if (resultObj.sessionMode) {
        sessionMode = true ;
        currentSession.sessionId = "/" + urlNamespace + "#" + urlSessionId;
        console.warn("SESSION MODE"
          + " | SID: " + urlSessionId
          + " | NSP: " + urlNamespace
          + " | SID (full): " + currentSession.sessionId
        );
      }
    });
    callbackMain(err, {sessionMode: sessionMode, sessionId: urlSessionId, namespace: urlNamespace});
  });
}

function launchSessionView(sessionId) {
  var namespacePattern = new RegExp(/^\/(\S*)#(\S*)$/);
  var sessionIdParts = namespacePattern.exec(sessionId);
  console.log("sessionId: " + sessionId + " | nsp: " + sessionIdParts[1] + " | id: " + sessionIdParts[2]);

  // var sessionIdNameSpace = sessionId.replace(/^\/(\S*)#/, "");
  // var sessionIdNameSpace = sessionId.replace(/#/, "");

  var url = urlRoot + sessionIdParts[2] + "&nsp=" + sessionIdParts[1];
  console.log("launchSessionView: " + sessionId + " | " + url);
  window.open(url, 'SESSION VIEW', '_new');
}

var adjustedAgeRateScale = d3.scale.pow().domain([1,500]).range([1.0,100.0]);
var fontSizeScale = d3.scale.log().domain([1,100000]).range([1.6,3.2]);

var defaultRadiusScale = d3.scale.log().domain([1,2000000]).range([1.0,40.0]);

var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

var linkColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);


var sessions = [];

var nodes = [];
var maxNumberNodes = 0;

var links = [];


var svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO;
var svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO;

var INITIAL_X_RATIO = 0.5;
var INITIAL_Y_RATIO = 0.5;

var nodeInitialX = INITIAL_X_RATIO * svgForceLayoutAreaWidth;
var nodeInitialY = INITIAL_Y_RATIO * svgForceLayoutAreaHeight;

console.log("nodeInitialX: " + nodeInitialX + " | nodeInitialY: " + nodeInitialY);

function zoomHandler() {
  // console.log("zoomHandler: TRANSLATE: " + d3.event.translate + " | SCALE: " + d3.event.scale);
  svgForceLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}


var d3image = d3.select("#d3group");

var SVGCANVAS_WIDTH_RATIO = 1.0;
var SVGCANVAS_HEIGHT_RATIO = 1.0;

var svgcanvas = d3image.append("svg:svg")
  .attr("id", "svgcanvas")
  // .attr("width", SVGCANVAS_WIDTH_RATIO * width)
  // .attr("height", SVGCANVAS_HEIGHT_RATIO * height)
  // .attr("x", 0)
  // .attr("y", 0);
  .attr("x", 0)
  .attr("y", 0)
  .call(d3.behavior.zoom()
  .scale(currentScale)
  .scaleExtent([0.1, 10])
  .on("zoom", zoomHandler));

var svgForceLayoutArea = svgcanvas.append("g")
  .attr("id", "svgForceLayoutArea")
  // .attr("width", svgForceLayoutAreaWidth)
  // .attr("height", svgForceLayoutAreaHeight)
  // .attr("viewbox", 0, 0, d3LayoutWidth, d3LayoutHeight)
  // .attr("preserveAspectRatio", "none")
  // .attr("x", 0)
  // .attr("y", 0)
  // .call(d3.behavior.zoom()
  // .scale(currentScale)
  // .scaleExtent([0.1, 10])
  // .on("zoom", zoomHandler));

var zoomListener = d3.behavior.zoom()
  .scaleExtent([0.4, 4])
  .on("zoom", zoomHandler) ;


zoomListener.translate([zoomWidth,zoomHeight]).scale(currentScale);//translate and scale to whatever value you wish
zoomListener.event(svgcanvas.transition().duration(1000));//does a zoom


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
  .style("text-anchor", "end")
  .style("fill", defaultTextFill);

var statsOverlay1 = svgcanvas.append("svg:g") // user screenname
  .attr("id", "statsOverlay1")
  .attr("class", "statsOverlay")
  .append("svg:a")
  .attr("id", "userUrl")
  .attr("xlink:show", "new")
  .attr("xlink:href", "http://word.threeceemedia.com/")
  .attr("x", STATS_OVERLAY1_X)
  .attr("y", STATS_OVERLAY1_Y)
  .append("text")
  .attr("id", "userScreenName")
  .attr("class", "userScreenName")
  .text("word association")
  .style("opacity", 0.8)
  .style("font-size", "1.4vmin")
  .style("fill", palette.blue);

var statsOverlay2 = svgcanvas.append("svg:g")  // tweet createdAt
  .attr("id", "statsOverlay2")
  .attr("class", "statsOverlay")
  .append("text")
  .attr("id", "tweetCreatedAt")
  .text("threecee")
  .attr("x", STATS_OVERLAY2_X)
  .attr("y", STATS_OVERLAY2_Y)
  .style("opacity", 0.8)
  .style("font-size", "1.4vmin")
  .style("fill", palette.blue);

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
  .text("threeceemedia.com")
  .style("opacity", 0.8)
  .style("font-size", "1.4vmin")
  .style("fill", palette.blue);

var statsOverlay4 = svgcanvas.append("svg:g") // tweet text
  .attr("id", "statsOverlay4")
  .attr("class", "statsOverlay")
  .append("svg:a")
  .attr("id", "sessionId")
  .attr("x", STATS_OVERLAY4_X)
  .attr("y", STATS_OVERLAY4_Y)
  .append("text")
  .attr("id", "sessionIdText")
  .attr("class", "sessionIdText")
  .text("SESSION ID")
  .style("opacity", 0.8)
  .style("font-size", "1.4vmin")
  .style("fill", palette.gray);

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
  .style("fill", defaultTextFill);

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
  .style("fill", defaultTextFill);

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
  .style("fill", defaultTextFill);

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
  .style("fill", defaultTextFill);


var sessionSvgGroup = svgForceLayoutArea.append("svg:g")
  .attr("id", "sessionSvgGroup");

var sessionLabelSvgGroup = svgForceLayoutArea.append("svg:g")
  .attr("id", "sessionLabelSvgGroup");


// d3.select("#statsOverlay3")

var linkSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

var nodeSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");

var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

var session = sessionSvgGroup.selectAll("g.session");
var sessionCircles = sessionSvgGroup.selectAll("circle");
var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");

var node = nodeSvgGroup.selectAll("g.node");
var nodeCircles = nodeSvgGroup.selectAll("circle");
var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

var link = linkSvgGroup.selectAll("line");

var sessionUpdateQueue = [];
var rxSessionUpdateQueue = [];
var sessionUpdateQueueMaxInQ = 0;

//
// FORCE LAYOUT DECLARATION
//

function tick() {
  session
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  node
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  sessionCircles
    .attr("r", function(d) { return d.r; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  nodeCircles
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  nodeLabels
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) {
      var shiftY = -1.8 * (fontSizeScale(d.mentions + 1) + defaultRadiusScale(d.mentions + 1));
      return d.y + shiftY;
    });
}

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .gravity(gravity)
    .friction(friction)
    .charge(charge)
    .linkStrength(linkStrength)
    .size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight])
    .on("tick", tick);

function updateLinkstrength(value) {
  document.getElementById("linkstrengthSliderText").innerHTML = value.toFixed(3);
  linkStrength = value;
  force.linkStrength(linkStrength);
}

function updateFriction(value) {
  document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
  friction = value;
  force.friction(friction);
}

function updateGravity(value) {
  document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
  gravity = value;
  force.gravity(gravity);
}

function updateCharge(value) {
  document.getElementById("chargeSliderText").innerHTML = value;
  charge = value;
  force.charge(charge);
}

function resetDefaultForce(){
  console.log("RESET FORCE LAYOUT DEFAULTS");
  updateCharge(DEFAULT_CHARGE);
  setChargeSliderValue(DEFAULT_CHARGE);
  updateFriction(DEFAULT_FRICTION);
  setFrictionSliderValue(DEFAULT_FRICTION);
  updateGravity(DEFAULT_GRAVITY);
  setGravitySliderValue(DEFAULT_GRAVITY);
  updateLinkstrength(DEFAULT_LINK_STRENGTH);
  setLinkstrengthSliderValue(DEFAULT_LINK_STRENGTH);
  SESSION_CONFIG = DEFAULT_SESSION_CONFIG;
  console.log("SESSION_CONFIG\n" + jsonPrint(SESSION_CONFIG));
}

function updateStatsOverlay4(stringIn){
  statsOverlay4 = d3.select("#statsOverlay4").select("text").text(stringIn);
}


//  CLOCK
setInterval (function () {
  dateTimeOverlay = d3.select("#dateTimeOverlay").select("text").text("SERVER TIME: " + moment().format(defaultDateTimeFormat));
}, 1000 );

//  KEEPALIVE
setInterval (function () {
  if (serverConnected){
    socket.emit("SESSION_KEEPALIVE", viewerObj);
    console.log("SESSION_KEEPALIVE | " + moment());
  }
}, serverKeepaliveInteval );

d3.select('#statsToggleButton').on("click", function() {  // STATS BUTTON

  showStatsFlag = !showStatsFlag;

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

var lastHeartbeatReceived = 0;

// CHECK FOR SERVER HEARTBEAT
setInterval(function () {
  if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.error(chalkError("\n????? SERVER DOWN ????? | " + targetServer 
      + " | LAST HEARTBEAT: " + getTimeStamp(lastHeartbeatReceived)
      + " | " + moment().format(defaultDateTimeFormat)
      + " | AGO: " + msToTime(moment().valueOf()-lastHeartbeatReceived)
    ));
    socket.connect(targetServer, {reconnection: false});
  }
}, serverCheckInterval);

function deleteSession(sessionId, callback){

  // force.stop();

  var deletedSession = {};
  var index = -1;

  for (index=sessions.length-1; index >= 0; index -= 1) {
    if (sessions[index].sessionId == sessionId){
      deletedSession = sessionHashMap[sessionId];
      sessions.splice(index, 1);
      console.warn("XXX DELETE SESSION"
        + " [" + sessions.length + "]"
        + " | " + deletedSession.sessionId
        + " | " + deletedSession.userId
        // + "\n" + jsonPrint(deletedSession.linkHashMap)
      );
      var sessionLinks = Object.keys(deletedSession.linkHashMap);
      // console.warn("SESSION " + sessionId + " | " + jsonPrint(deletedSession));
      sessionLinks.forEach(function(nodeId){
        // console.warn("SESSION " + sessionId
        //  + " | " + nodeId
        //  + " | " + jsonPrint(deletedSession.linkHashMap[nodeId])
        // );
        deletedSession.linkHashMap[nodeId].forEach(function(targetNodeId){
          var linksLength = links.length-1;
          var linksIndex = links.length-1;
          
          for (linksIndex = linksLength; linksIndex >= 0; linksIndex -= 1) {

            var currentLinkObject = links[linksIndex];

            if (nodeId === currentLinkObject.target.nodeId) {
              links.splice(linksIndex, 1); 
            }
            else if (nodeId === currentLinkObject.source.nodeId) {
              links.splice(linksIndex, 1); 
            }
          }
        });
      });
      delete sessionHashMap[sessionId];
    }
  }

  if (index == 0) {
    return(callback(sessionId));
  }
}

function deleteAllSessions(callback){
  var sessionIds = Object.keys(sessionHashMap);
  sessionIds.forEach(function(sessionId){
    deleteSession(sessionId, function(sId){
      console.warn("XXX DELETED SESSION " + sId);
      delete sessionHashMap[sessionId];
    });
  });
  callback();
}

var heartBeatsReceived = 0;

socket.on("HEARTBEAT", function(heartbeat){

  heartBeatsReceived++;

  serverConnected = true;

  d3.select("#adminOverlay0").select("text")
    .text(
      heartbeat.totalWords + " TOTAL WORDS"
      + " | " + heartbeat.wordCacheStats.keys + " WORDS IN CACHE"
      + " | " + heartbeat.bhtRequests + " BHT REQS"
      + " | " + heartbeat.promptsSent + " PROMPTS"
      + " | " + heartbeat.responsesReceived + " RESPONSES"
      );

  d3.select("#adminOverlay1").select("text")
    .text(
      heartbeat.numberUsers + " USERS"
      + " | " + heartbeat.numberTestUsers + " TEST USERS"
      + " | " + "SERVER HEARTBEAT: " + getTimeStamp(heartbeat.timeStamp)
      );
});

// adminOverlay2 update
setInterval (function () {
  d3.select("#adminOverlay2").select("text")
    .text(nodes.length + " NODES"
      + " | " + maxNumberNodes + " MAX NODES"
      + " | " + (Math.round( ageRate * 10 ) / 10) + " AGE RATE"
      + " | " + sessionUpdateQueueMaxInQ + " MAX NODES IN Q"
      );

  d3.select("#adminOverlay3").select("text")
    .text("LOCAL TIME: " + moment().format(defaultDateTimeFormat));
}, 1000 );


socket.on("CONFIG_CHANGE", function(rxConfig){

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n"
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");

  if ( rxConfig.testMode !== 'undefined') {
    config.testMode = rxConfig.testMode;
    console.log("\n*** ENV CHANGE: TEST_MODE:  WAS: " + previousConfig.testMode + " | NOW: " + config.testMode + "\n");
    previousConfig.testMode = config.testMode;
  }

  if ( rxConfig.testSendInterval !== 'undefined') {
    config.testSendInterval = rxConfig.testSendInterval;
    console.log("\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " + previousConfig.testSendInterval
      + " | NOW: " + config.testSendInterval + "\n");
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if ( rxConfig.nodeMaxAge !== 'undefined') {
    config.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log("\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " + previousConfig.nodeMaxAge
      + " | NOW: " + config.nodeMaxAge + "\n");
    nodeMaxAge = config.nodeMaxAge;
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }

  resetMouseMoveTimer();
});



socket.on("SESSION_DELETE", function(rxSessionObject){
  var rxObj = rxSessionObject ;
  if (sessionHashMap[rxObj.sessionId]) {
    console.warn("SESSION_DELETE"
      + " | " + rxSessionObject.sessionId
      + " | " + rxSessionObject.sessionEvent
      // + "\n" + jsonPrint(rxSessionObject)
    );
    var session = sessionHashMap[rxObj.sessionId];
    session.sessionEvent = "SESSION_DELETE";
    rxSessionUpdateQueue.push(session);
  }
});

socket.on("SESSION_UPDATE", function(rxSessionObject){

  var rxObj = rxSessionObject ;

  if (!windowVisible){
    if (debug) {
      console.log("... SKIP SESSION_UPDATE ... WINDOW NOT VISIBLE");
    }
  }
  else if (sessionMode && (rxObj.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("SKIP SESSION_UPDATE: " + rxObj.sessionId + " | CURRENT: " + currentSession.sessionId);
    }
  }
  else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

    rxSessionUpdateQueue.push(rxObj);

    console.log(
      rxObj.userId
      // + " | " + rxObj.sessionId
      + " | " + rxObj.source.nodeId + " > " + rxObj.target.nodeId
    );

  }
});

//=============================
// TICK
//=============================

var age;

var initialPosition = {};
initialPosition.x = 10;
initialPosition.y = 10;


//================================
// GET NODES FROM QUEUE
//================================

function computeInitialPosition(index) {
  var pos = {
    x: ((0.4 * width) + (radiusX * Math.cos(index))),
    y: ((0.5 * height) - (radiusY * Math.sin(index)))
  };

  return pos;
}

var nodeIndex = 0;
var tempMentions;

var numberSessionsUpdated = 0;

var randomColorQueue = [];
var randomNumber360 = randomIntFromInterval(0,360);
var startColor = "hsl(" + randomNumber360 + ",100%,50%)";
var endColor = "hsl(" + randomNumber360 + ",0%,0%)";
randomColorQueue.push({ "startColor": startColor, "endColor": endColor});

setInterval(function(){ // randomColorQueue

  randomNumber360 += randomIntFromInterval(60,120);
  startColor = "hsl(" + randomNumber360 + ",100%,50%)";
  endColor = "hsl(" + randomNumber360 + ",0%,0%)";

  if (randomColorQueue.length < 50) {
    randomColorQueue.push({ "startColor": startColor, "endColor": endColor});
  }

}, 50);

function createSession (callback){

  if (rxSessionUpdateQueue.length == 0){
    callback(null, null);
  }
  else {
    var dateNow = moment().valueOf();

    var sessionObject = rxSessionUpdateQueue.shift();

    // console.log("sessionObject\n" + jsonPrint(sessionObject));

    if (sessionObject.sessionEvent == 'SESSION_DELETE'){
      sessionHashMap[sessionObject.sessionId] = sessionObject;
      callback(null, sessionObject.sessionId);
    }
    else if (sessionHashMap[sessionObject.sessionId]){

      var currentSession = sessionHashMap[sessionObject.sessionId];

      currentSession.age = 0;
      currentSession.userId = sessionObject.userId;
      currentSession.source = sessionObject.source;
      currentSession.source.lastSeen = dateNow;
      currentSession.target = sessionObject.target;
      currentSession.target.lastSeen = dateNow;
      currentSession.node.age = 0;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;

      // console.log("sessionObject.source: " + sessionObject.source.nodeId);

      sessionHashMap[sessionObject.sessionId] = currentSession;

      callback(null, currentSession.sessionId);
    }
    else {

      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }

      sessionsCreated += 1;

      var currentSession = sessionObject;

      currentSession.age = 0;
      currentSession.linkHashMap = {};

      currentSession.text =  sessionObject.userId;

      currentSession.initialPosition = computeInitialPosition(sessionsCreated);
      currentSession.x = currentSession.initialPosition.x;
      currentSession.y = currentSession.initialPosition.y;
      currentSession.r = 50;

      currentSession.colors = {};
      currentSession.colors = randomColorQueue.shift();

      var interpolateNodeColor = d3.interpolateHcl(currentSession.colors.endColor, currentSession.colors.startColor);
      currentSession.interpolateColor = interpolateNodeColor;

      var sessionNode = {};

      sessionNode.isSessionNode = true;
      sessionNode.nodeId = currentSession.userId;
      sessionNode.userId = currentSession.userId;
      sessionNode.sessionId = currentSession.sessionId;
      sessionNode.age = 0;
      sessionNode.ageUpdated = dateNow;
      sessionNode.lastSeen = dateNow;
      sessionNode.mentions = 0;
      // sessionNode.text = currentSession.userId;
      sessionNode.text = '';
      sessionNode.x = currentSession.initialPosition.x;
      sessionNode.y = currentSession.initialPosition.y;
      sessionNode.fixed = true;
      // sessionNode.latestNode = true;
      sessionNode.links = {};
      sessionNode.colors = currentSession.colors;
      sessionNode.interpolateColor = currentSession.interpolateColor;

      currentSession.node = sessionNode;

      nodeHashMap[session.nodeId] = sessionNode;
      nodes.push(sessionNode);

      console.log("NEW SESSION " 
        + currentSession.userId 
        + " | " + currentSession.sessionId 
        + "\n" + jsonPrint(currentSession.node) 
        // + "\ncolors: " + jsonPrint(session.colors)
        );

      // console.log("session"
        // + " | " + session.sessionId
        // + " | " + session.source.nodeId
        // + " | fixed: " + session.source.fixed
        // + " | colors\n" + jsonPrint(session.colors)
        // + "\n" + jsonPrint(session)
      // );

      currentSession.source.lastSeen = dateNow;
      if (typeof currentSession.target !== 'undefined') {
        currentSession.target.lastSeen = dateNow;
      }

      sessionHashMap[currentSession.sessionId] = currentSession;

      sessions.push(currentSession);
      console.log("sessions: " + sessions.length);

      callback(null, currentSession.sessionId);
    }
  }
}

function createNode (sessionId, callback) {

  if (sessionId === null){
    return(callback(null, null));
  }
  else if (sessionHashMap[sessionId].sessionEvent == 'SESSION_DELETE'){
    return(callback(null, sessionId));
  }
  else {
    var session = sessionHashMap[sessionId];

    if (nodeHashMap[session.userId]) {
      var sessionNode = nodeHashMap[session.userId];
      sessionNode.age = 0;
      nodeHashMap[sessionNode.nodeId] = sessionNode;
    }

    var dateNow = moment().valueOf();

    var wordObject = {};
    var nodeId = session.source.nodeId;

    if (nodeHashMap[nodeId]) {

      wordObject = nodeHashMap[nodeId];
      wordObject.userId = session.userId;
      wordObject.sessionId = sessionId;
      wordObject.age = 0;
      wordObject.ageUpdated = dateNow;
      wordObject.lastSeen = dateNow;
      wordObject.mentions = session.source.mentions;
      wordObject.text = nodeId;
      // wordObject.fixed = true;
      wordObject.latestNode = true;
      wordObject.colors = session.colors;
      wordObject.interpolateColor = session.interpolateColor;

      nodeHashMap[nodeId] = wordObject;

      // session.fixedNodeId = '' ;
      session.latestNodeId = nodeId ;
      session.source = wordObject ;
      sessionHashMap[session.sessionId].session = session;

      return(callback (null, sessionId));
    }
    else {

      wordObject = session.source ;

      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }

      // wordObject.x = session.initialPosition.x + (0.1 * session.initialPosition.x * Math.random());
      wordObject.y = session.initialPosition.y + (0.1 * session.initialPosition.y * Math.random());

      wordObject.x = session.initialPosition.x;
      // wordObject.y = session.initialPosition.y;

      if (( wordObject.mentions === 'undefined') || (wordObject.mentions === null)) {
        console.log("wordObject\n" + JSON.stringify(wordObject));
        wordObject.mentions = 1;
        console.log("wordObject\n" + JSON.stringify(wordObject));
      }

      wordObject.userId = session.userId;
      wordObject.sessionId = sessionId;
      wordObject.links = {};
      wordObject.age = 0;
      wordObject.lastSeen = dateNow;
      wordObject.ageUpdated = dateNow;

      wordObject.colors = session.colors;
      wordObject.interpolateColor = session.interpolateColor;
      wordObject.text = nodeId ;

      // wordObject.fixed = true;
      wordObject.latestNode = true;
      nodeHashMap[nodeId] = wordObject;

      session.source = wordObject ;
      // session.fixedNodeId = nodeId ;
      session.latestNodeId = nodeId ;

      sessionHashMap[session.sessionId].session = session;

      nodes.push(wordObject);

      // console.log("men\n" + jsonPrint(wordObject));

      if (nodes.length > maxNumberNodes) {
        maxNumberNodes = nodes.length;
      }

      // force.nodes(nodes);
      return(callback (null, sessionId));
    }
  }
}

function pauseForNodes (sessionId, callback) {  

  var pauseInterval ;

  if (sessionId === null){
    callback(null, null);
  }
  else {
    var session = sessionHashMap[sessionId].session;

    var sourceWordId = session.source.nodeId;
    var targetWordId = session.target.nodeId;

    for (var i=0; i<100; i++){
      if (typeof nodeHashMap[sourceWordId] !== 'undefined') {
        console.warn("FOUND SOURCE IN HASH PAUSE: " + sourceWordId);
        return callback(null, sessionId);
        break;
      }
    }
  }
}

function createLink (sessionId, callback) {

  if (sessionId === null){
    callback(null, null);
  }
  else if (sessionHashMap[sessionId].sessionEvent == 'SESSION_DELETE'){
    return(callback(null, sessionId));
  }
  else {
    var session = sessionHashMap[sessionId];

    var newLink;

    var sourceWordId = session.source.nodeId;
    var targetWordId = session.target.nodeId;

    var sourceWord = nodeHashMap[sourceWordId];
    var targetWord;

    if ((session.latestNodeId == sourceWordId) || (session.latestNodeId == targetWordId)){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }

      var latestWord = nodeHashMap[session.latestNodeId];

      var newSessionLink = {
        sessionId: session.sessionId,
        age: 0,
        source: session.node,
        target: latestWord
      };

      links.push(newSessionLink);

      latestWord.links[session.node.nodeId] = 1;
      session.node.links[latestWord.nodeId] = 1;

      nodeHashMap[latestWord.nodeId] = sourceWord ;
      nodeHashMap[session.node.nodeId] = session.node ;

      if (!session.linkHashMap[latestWord.nodeId]){
        session.linkHashMap[latestWord.nodeId] = []
      }
      if (!session.linkHashMap[session.node.nodeId]){
        session.linkHashMap[session.node.nodeId] = [];
      }

      session.linkHashMap[latestWord.nodeId].push(session.node.nodeId);
      session.linkHashMap[session.node.nodeId].push(latestWord.nodeId);

      sessionHashMap[session.sessionId] = session;
  
      // console.log("CREATED LINK TO SESSION NODE"
      //   + " | " + session.sessionId
      //   + " | " + session.node.nodeId + " > " + latestWord.nodeId
      // );
    }

    
    if (typeof session.target === 'undefined'){
      console.warn("??? SESSION TARGET UNDEFINED"
        + " | " + sessionId
        + " | " + session.userId
        + " | SKIPPING CREATE LINKS"
      );
      return(callback (null, sessionId));
    }
    else if (typeof session.target.nodeId !== 'string') {
      console.warn("??? TARGET NODE ID NOT A STRING (NEW SESSION?)"
        + " | " + sessionId
        + " | " + session.userId
        + " | SKIPPING CREATE LINKS"
      );
      return(callback (null, sessionId));
    }
    else if (nodeHashMap[targetWordId]){
      targetWord = nodeHashMap[targetWordId];
    }

    if (typeof nodeHashMap[sourceWordId] === 'undefined') {
      console.warn("sourceWordId " + sourceWordId + " NOT IN nodeHashMap"
        + " | " + sessionId
        + " | " + session.userId
       + " | SKIPPING CREATE LINKS"
       );
      return(callback (null, sessionId));
    }
    else if (!nodeHashMap[targetWordId]){
      console.warn("targetWordId " + targetWordId + " NOT IN nodeHashMap"
        + " | " + sessionId
        + " | " + session.userId
       + " | SKIPPING CREATE LINKS"
       );
      return(callback (null, sessionId));
    }
    
    if (!forceStopped){
      forceStopped = true ;
      force.stop();
    }

    // console.log("LINK | " + sourceWord.nodeId + " > " + targetWordId);

    var newLink = {
      sessionId: session.sessionId,
      age: 0,
      source: sourceWord,
      target: targetWord
    };

    links.push(newLink);
    newLink = newLink.source.nodeId + " > " + newLink.target.nodeId;

    sourceWord.links[targetWordId] = 1;
    targetWord.links[sourceWordId] = 1;

    nodeHashMap[sourceWordId] = sourceWord ;
    nodeHashMap[targetWordId] = targetWord ;

    if (!session.linkHashMap[sourceWordId]){
      session.linkHashMap[sourceWordId] = []
    }
    if (!session.linkHashMap[targetWordId]){
      session.linkHashMap[targetWordId] = [];
    }

    session.linkHashMap[sourceWordId].push(targetWordId);
    session.linkHashMap[targetWordId].push(sourceWordId);

    sessionHashMap[session.sessionId] = session;


    // console.log("createLink: session\n" + jsonPrint(session.linkHashMap));

    return(callback (null, sessionId));
  } 
}

function calcNodeAges (callback){

  // console.warn("calcNodeAges");

  if (nodes.length === 0) {
    ageRate = DEFAULT_AGE_RATE;
  }
  else if (nodes.length > 100) {
    ageRate = adjustedAgeRateScale(nodes.length-100);
  }
  else {
    ageRate = DEFAULT_AGE_RATE;
  }

  var deadNodesFlag = false;

  var currentNodeObject = {};
  var currentLinkObject = {};

  var dateNow = moment().valueOf();

  // var ageNodesIndex = nodeHashMap.size();
  var ageNodesIndex =  nodeHashMap.length-1;
  var ageLinksLength = links.length-1;
  var ageLinksIndex = links.length-1;

  var nodeHashMapKeys = Object.keys(nodeHashMap);

  // nodeHashMap.forEach(function(currentNodeObject, nodeId){
  nodeHashMapKeys.forEach(function(nodeId){

    var currentNodeObject = nodeHashMap[nodeId];

    age = currentNodeObject.age + (ageRate * (dateNow - currentNodeObject.ageUpdated));
 
    if (!currentNodeObject.isSessionNode && (age >= nodeMaxAge)) {
      deadNodesFlag = true;
      deadNodeHashMap.set(nodeId,1);

      ageLinksLength = links.length-1;
      ageLinksIndex = links.length-1;
      
      for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

        currentLinkObject = links[ageLinksIndex];

        if (currentNodeObject.nodeId === currentLinkObject.target.nodeId) {
          links.splice(ageLinksIndex, 1); 
        }
        else if (currentNodeObject.nodeId === currentLinkObject.source.nodeId) {
          links.splice(ageLinksIndex, 1); 
        }
      }

    }
    else {
      currentNodeObject.ageUpdated = dateNow;
      currentNodeObject.age = age;
      // nodeHashMap.set(nodeId, currentNodeObject);
      nodeHashMap[nodeId] = currentNodeObject;

      ageLinksLength = links.length-1;
      ageLinksIndex = links.length-1;

      for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

        currentLinkObject = links[ageLinksIndex];

        if (nodeId === currentLinkObject.target.nodeId) {
          if (currentLinkObject.age < age){
            links[ageLinksIndex].age = age; 
          }
         }
        else if (nodeId === currentLinkObject.source.nodeId) {
          if (currentLinkObject.age < age){
            links[ageLinksIndex].age = age; 
          }
        }
      }

    }

    ageNodesIndex--;

  });

  if (ageNodesIndex == 0) {
    return(callback(null, deadNodesFlag));
  }
}

function ageNodes (sessionId, callback){

  var ageNodesLength = nodes.length-1;
  var ageNodesIndex = nodes.length-1;
  var ageLinksLength;
  var ageLinksIndex;

  var deadNodesFlag = false;

  var currentNodeId ;
  var currentNodeObject = {};

  var ageSession;

  var dateNow = moment().valueOf();


  for (ageNodesIndex = ageNodesLength; ageNodesIndex>=0; ageNodesIndex -= 1) {  

    currentNodeObject = nodes[ageNodesIndex];
    currentNodeId = currentNodeObject.nodeId;
    ageSession = sessionHashMap[currentNodeObject.sessionId];

    if (typeof currentNodeId !== 'string') {
      console.error("*** SKIPPING currentNodeId NOT STRING"
        + " | TYPE: " + typeof currentNodeId
        + " | currentNodeId: " + currentNodeId
        + " | jsonPrint(currentNodeId)\n" + jsonPrint(currentNodeId)
      );
      continue;
    }
    else {
      if ((typeof ageSession !== 'undefined') && (ageSession.sessionEvent == 'SESSION_DELETE')){
        console.warn("ageNodes: DELETE SESSION: " + ageSession.sessionId + " | " + currentNodeId);
        deleteSession(currentNodeObject.sessionId, function(sessionId){
          delete sessionHashMap[sessionId];
        });
        // delete sessionHashMap[currentNodeObject.sessionId];
      }

      if (((typeof ageSession !== 'undefined') && (ageSession.sessionEvent == 'SESSION_DELETE'))
        || (deadNodeHashMap.has(currentNodeId))){

        deadNodeHashMap.remove(currentNodeId);
        // nodeHashMap.remove(currentNodeId);
        delete nodeHashMap[currentNodeId];

        deadNodesFlag = true;

        if (!forceStopped){
          forceStopped = true ;
          force.stop();
        }

        nodes.splice(ageNodesIndex, 1); 
      }
      else {
   
        nodes[ageNodesIndex].age = currentNodeObject.age;
        nodes[ageNodesIndex].ageUpdated = currentNodeObject.ageUpdated;
   
        if ((typeof ageSession !== 'undefined') && (currentNodeId == ageSession.latestNodeId)) {
          currentNodeObject.latestNode = true;
        }
        else {

          currentNodeObject.latestNode = false;

          if ((typeof ageSession !== 'undefined') && (currentNodeObject.links[ageSession.node.nodeId])) {
            // console.warn("XXX DELETE currentNodeObject.links[" + ageSession.node.nodeId + "]");

            delete currentNodeObject.links[ageSession.node.nodeId];

            ageLinksLength = links.length-1;
            ageLinksIndex = links.length-1;
            var currentLinkObject;

            for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

              currentLinkObject = links[ageLinksIndex];

              if (currentNodeObject.nodeId === currentLinkObject.target.nodeId) {
                if (ageSession.node.nodeId === currentLinkObject.source.nodeId){
                  // console.warn("XXX DELETE LINK: " + links[ageLinksIndex].source.nodeId + " > " + links[ageLinksIndex].target.nodeId);
                  links.splice(ageLinksIndex, 1); 
                }
               }
              else if (currentNodeObject.nodeId === currentLinkObject.source.nodeId) {
                if (ageSession.node.nodeId === currentLinkObject.target.nodeId){
                  // console.warn("XXX DELETE LINK: " + links[ageLinksIndex].source.nodeId + " > " + links[ageLinksIndex].target.nodeId);
                  links.splice(ageLinksIndex, 1); 
                }
              }
            }
          }
        }

        nodeHashMap[currentNodeId] = currentNodeObject;
      }
    }

  }

  if (ageNodesIndex < 0) {
    return(callback(null, sessionId));
  }
}

function updateNodes (sessionId, callback) {

  node = node.data(force.nodes(), function(d) { return d.nodeId;})
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("lastSeen", function(d) { return d.lastSeen; });

  node.enter()
    .append("svg:g")
    .attr("class", "node")
    .attr("nodeId", function(d) { return d.nodeId; })
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("lastSeen", function(d) { return d.lastSeen; });

  node
    .exit()
    .remove();

  callback(null, sessionId);
} 

function updateLinks(sessionId, callback) {

  link = linkSvgGroup.selectAll("line").data(force.links(), 
    function(d) { return d.source.nodeId + "-" + d.target.nodeId; });

  link
    .style('stroke', function(d){ return linkColorScale(d.age);})
    .style('opacity', function(d){
        return 0.1+((nodeMaxAge - d.age) / nodeMaxAge);
    });

  link.enter()
    .append("svg:line", "g.node")
    .attr("class", "link")
    .style('stroke', function(d){ return linkColorScale(d.age);})
    .style('stroke-width', 1.5)
    .style('opacity', 1e-6)
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', function(d){
        return 0.1+((nodeMaxAge - d.age) / nodeMaxAge);
      });

  link
    .exit()
    .remove();
    // .transition()
    //   .duration(defaultFadeDuration)      
    //   .style("opacity", 1e-6)
    

  callback(null, sessionId);
}

function updateSessionCircles (sessionId, callback) {

  sessionCircles = sessionSvgGroup.selectAll("circle")
    .data(sessions, function(d) {
      return d.sessionId;
    });

  sessionCircles
    .attr("r", function(d) { 
      return d.r;
    })    
    .style('opacity', function(d){
      return 1;
    });

  sessionCircles
    .enter()
    .append("svg:circle")
    .attr("id", function(d) { return d.sessionId; })
    .attr("class", "sessionCircleClass")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", 1e-6)
    .style("visibility", "visible") 
    // .style("fill", function(d) { 
    //   return d.interpolateColor(0.05);
    // })
    .style("opacity", 1e-6)
    .style('stroke', function(d){
      return d.interpolateColor(0.5);
    })
    .style("stroke-width", 2.5)
    .transition()
      .duration(defaultFadeDuration)      
      .attr("r", function(d) { return d.r;})
      .style('opacity', 1.0);

  sessionCircles
  .exit()
    // .transition()
    //   .duration(defaultFadeDuration)
    //   .attr("r", 0.5)
    //   .style("opacity", 1e-6)
      .remove();

 
  sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel")
    .data(sessions, function(d) { return d.sessionId; })
    .text(function(d) { return d.text; })
    .style("font-size", function(d) { 
      return fontSizeScale(1000.1) + "vmin"; 
    })
    .style('opacity', 1.0);

  sessionLabels.enter()
    .append("svg:text")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y - 1.5*d.r; })
    .attr("class", "sessionLabel")
    .attr("id", function(d) { return d.sessionId; })
    .attr("sessionId", function(d) { return d.sessionId; })
    .text(function(d) { return d.text; })
    .style("text-anchor", "middle")
    .style("opacity", 1e-6)
    .style('fill', function(d){
      return d.interpolateColor(0.8);
    })
    .style("font-size", function(d) { 
      return fontSizeScale(1000.1) + "vmin"; 
    })
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", 1.0);

  sessionLabels
    .exit().remove();
    // .transition()
    //   .duration(defaultFadeDuration)      
    //   .style("opacity", 1e-6)


  callback(null, sessionId);
}

function updateNodeCircles (sessionId, callback) {

  nodeCircles = nodeSvgGroup.selectAll("circle")
    .data(force.nodes(), function(d) {
      return d.nodeId;
    });

  nodeCircles
     .attr("r", function(d) { 
      // console.log("MENTIONS: " + d.mentions);
      return defaultRadiusScale(d.mentions + 1); 
    })
    .style("fill", function(d) { 
      return d.interpolateColor((nodeMaxAge - d.age) / nodeMaxAge);
    })
    .style('opacity', function(d){
      return 1;
    })
    .style('stroke', function(d){ return strokeColorScale(d.age); })
    .style('stroke-opacity', function(d){
      return (nodeMaxAge - d.age) / nodeMaxAge;
    });

  nodeCircles
    .enter()
    .append("svg:circle")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("mouseover", 0)
    .on("mouseover", nodeMouseOver)
    .on("mouseout", nodeMouseOut)
    .on("dblclick", nodeClick)
    .call(force.drag)
    .attr("r", function(d) { 
      return defaultRadiusScale(100);
    })
    .style("visibility", "visible") 
    .style("opacity", 1e-6)
    .style('stroke', function(d){ return strokeColorScale(d.age);})
    .style("stroke-width", 2.5)
    .style("fill", function(d) { 
      return d.interpolateColor((nodeMaxAge - d.age) / nodeMaxAge);
    })
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', 1.0);

  nodeCircles
    .exit().remove();
    // .transition()
    //   .duration(defaultFadeDuration)      
    //   .style('opacity', 1e-6);

  callback(null, sessionId);
}

function updateNodeLabels (sessionId, callback) {
  
  nodeLabels = nodeLabelSvgGroup.selectAll(".nodeLabel").data(force.nodes(), 
    function(d) { return d.nodeId; })
    .text(function(d) { return d.text; })
    .style("font-size", function(d) { 
      return fontSizeScale(d.mentions + 1.1) + "vmin"; 
    })
    .style('opacity', function(d){
      return (nodeMaxAge - d.age) / nodeMaxAge;
    });

  nodeLabels.enter()
    .append("svg:text")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("class", "nodeLabel")
    .attr("id", function(d) { return d.nodeId; })
    .attr("nodeId", function(d) { return d.nodeId; })
    .text(function(d) { return d.text; })
    .style("text-anchor", "middle")
    .style("opacity", 1e-6)
    .style("fill", "#eeeeee")
    .style("font-size", function(d) { 
      return fontSizeScale(d.mentions + 1.1) + "vmin"; 
    })
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", 1.0);

  nodeLabels
    .exit().remove();
    // .transition()
    //   .duration(defaultFadeDuration)      
    //   .style("opacity", 1e-6)
      

  callback(null, sessionId);
}

var createSessionNodeLinkReady = true;

function createSessionNodeLink() {

  createSessionNodeLinkReady = false;

  async.waterfall(
    [ 
      createSession,
      updateSessionCircles,
      createNode,
      createLink,
      ageNodes,
      updateNodes,
      updateNodeCircles,
      updateNodeLabels,
      updateLinks
    ], 
    
    function(err, result){
      if (err) { 
        console.error("*** ERROR: createSessionNodeLink *** \nERROR: " + err); 
      }

      if (forceStopped) {
        force.start(); 
        forceStopped = false ;
      }

      createSessionNodeLinkReady = true;
    }
  );
}

// function updateNodesLinks() {

//   async.waterfall(
//     [ 
//       updateNodes,
//       updateNodeCircles,
//       updateNodeLabels,
//       updateLinks
//     ], 
    
//     function(err, result){
//       if (err) { 
//         console.error("*** ERROR: createSessionNodeLink *** \nERROR: " + err); 
//       }
//     }
//   );
// }

function nodeFill (age) { 
  return fillColorScale(age);
}

function nodeMouseOver(d) { 

  mouseHoverFlag = true;
  mouseHoverNodeId = d.nodeId;

  var nodeId = d.nodeId;
  var sId = d.sessionId;
  var uId = d.userId;
  var mentions = d.mentions;
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
    .style("opacity", 1.0);

  var tooltipString =  "<bold>" + nodeId + "</bold>" + "<br>MENTIONS: " + mentions + "<br>" + uId + "<br>" + sId;

  divTooltip.html(tooltipString) 
    .style("left", (d3.event.pageX - 40) + "px")   
    .style("top", (d3.event.pageY - 50) + "px");  
}

function nodeMouseOut() {

  mouseHoverFlag = false;

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

function resize() {
  console.log("resize");

  if (window.innerWidth !== 'undefined') {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)

  else if (document.documentElement !== 'undefined'
   && document.documentElement.clientWidth !=='undefined' && document.documentElement.clientWidth !== 0) {
     width = document.documentElement.clientWidth;
     height = document.documentElement.clientHeight;
  }

  // older versions of IE

  else {
     width = document.getElementsByTagName('body')[0].clientWidth;
     height = document.getElementsByTagName('body')[0].clientHeight;
  }

  console.log("width: " + width + " | height: " + height);

  radiusX = 0.5*width;
  radiusY = 0.5*height;

  d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO; // double the width for now
  d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO;

  svgcanvas
    .attr("width", SVGCANVAS_WIDTH_RATIO * width)
    .attr("height", SVGCANVAS_HEIGHT_RATIO * height);

  svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO;
  svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO;


  svgForceLayoutArea.attr("width", svgForceLayoutAreaWidth)
  .attr("height", svgForceLayoutAreaHeight);
  
  svgForceLayoutArea.attr("x", 0);
  svgForceLayoutArea.attr("y", 0);


  force.size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight]);

  ADMIN_OVERLAY0_X = DEFAULT_ADMIN_OVERLAY0_X * width;
  ADMIN_OVERLAY0_Y = DEFAULT_ADMIN_OVERLAY0_Y * height;

  ADMIN_OVERLAY1_X = DEFAULT_ADMIN_OVERLAY1_X * width;
  ADMIN_OVERLAY1_Y = DEFAULT_ADMIN_OVERLAY1_Y * height;

  ADMIN_OVERLAY2_X = DEFAULT_ADMIN_OVERLAY2_X * width;
  ADMIN_OVERLAY2_Y = DEFAULT_ADMIN_OVERLAY2_Y * height;

  ADMIN_OVERLAY3_X = DEFAULT_ADMIN_OVERLAY3_X * width;
  ADMIN_OVERLAY3_Y = DEFAULT_ADMIN_OVERLAY3_Y * height;

  STATS_OVERLAY1_X = DEFAULT_STATS_OVERLAY1_X * width;
  STATS_OVERLAY1_Y = DEFAULT_STATS_OVERLAY1_Y * height;

  STATS_OVERLAY2_X = DEFAULT_STATS_OVERLAY2_X * width;
  STATS_OVERLAY2_Y = DEFAULT_STATS_OVERLAY2_Y * height;

  STATS_OVERLAY3_X = DEFAULT_STATS_OVERLAY3_X * width;
  STATS_OVERLAY3_Y = DEFAULT_STATS_OVERLAY3_Y * height;

  STATS_OVERLAY4_X = DEFAULT_STATS_OVERLAY4_X * width;
  STATS_OVERLAY4_Y = DEFAULT_STATS_OVERLAY4_Y * height;

  DATE_TIME_OVERLAY_X = DEFAULT_DATE_TIME_OVERLAY_X * width;
  DATE_TIME_OVERLAY_Y = DEFAULT_DATE_TIME_OVERLAY_Y * height;

  adminOverlay0.attr("x", ADMIN_OVERLAY0_X).attr("y",ADMIN_OVERLAY0_Y);
  adminOverlay1.attr("x", ADMIN_OVERLAY1_X).attr("y",ADMIN_OVERLAY1_Y);
  adminOverlay2.attr("x", ADMIN_OVERLAY2_X).attr("y",ADMIN_OVERLAY2_Y);
  adminOverlay3.attr("x", ADMIN_OVERLAY3_X).attr("y",ADMIN_OVERLAY3_Y);

  dateTimeOverlay.attr("x", DATE_TIME_OVERLAY_X).attr("y", DATE_TIME_OVERLAY_Y);
  statsOverlay1.attr("x", STATS_OVERLAY1_X).attr("y", STATS_OVERLAY1_Y);
  statsOverlay2.attr("x", STATS_OVERLAY2_X).attr("y", STATS_OVERLAY2_Y);
  statsOverlay3.attr("x", STATS_OVERLAY3_X).attr("y", STATS_OVERLAY3_Y);
  statsOverlay4.attr("x", STATS_OVERLAY4_X).attr("y", STATS_OVERLAY4_Y);

  nodeInitialX = INITIAL_X_RATIO * svgForceLayoutAreaWidth;
  nodeInitialY = INITIAL_Y_RATIO * svgForceLayoutAreaHeight;
}

window.onload = function () {
  resize();
  displayInfoOverlay(1.0);
  displayControlOverlay(true);
  getUrlVariables(function(err, urlVariablesObj){
    if (!err) {
      console.log("ON LOAD getUrlVariables\n" + jsonPrint(urlVariablesObj));
      if (urlVariablesObj.sessionId) {
        sessionId = urlVariablesObj.sessionId;
      }
      if (urlVariablesObj.namespace) {
        namespace = urlVariablesObj.namespace;
      }
    }
  });

  resetDefaultForce();

  console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
  socket.emit("VIEWER_READY", viewerObj);

  setTimeout(function(){
    pageLoadedTimeIntervalFlag = false;
    displayControlOverlay(false);
    displayInfoOverlay(0);
  }, 5000);
};

function toggleFullScreen() {
  if (!document.fullscreenElement &&
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {

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

document.addEventListener("mousemove", function() {
  if (mouseHoverFlag) {
    d3.select("body").style("cursor", "pointer");
  }
  else {
    d3.select("body").style("cursor", "default");
  }

  resetMouseMoveTimer();
  mouseMovingFlag = true ;

  if (mouseFreezeEnabled) {
    force.stop();
  }
}, true);

d3.select(window).on("resize", resize);


// d3.timer(function () {
//   dateNow = moment().valueOf();
//   createSessionNodeLink();
// });

// setInterval (function () {
//   calcNodeAges(function(deadNodes){
//     if (deadNodes) {
//       console.warn("DEAD NODES");
//       deadNodeHashMap.forEach(function(nodeObj, nodeId){
//         deadNodeHashMap.remove(nodeId);
//       });
//     }
//   });
// }, 1000 );

// setInterval (function () {
//   dateNow = moment().valueOf();
//   calcNodeAges(function(deadNodes){});
//   createSessionNodeLink();
// }, 60 );


d3.timer(function () {
  dateNow = moment().valueOf();
  calcNodeAges(function(deadNodes){});
  if (!mouseMovingFlag && createSessionNodeLinkReady) createSessionNodeLink();
  // createSessionNodeLink();
  // updateNodesLinks();
});
