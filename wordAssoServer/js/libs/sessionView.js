/*jslint node: true */
"use strict";

var d3 = window.d3;

if(typeof(Worker) !== "undefined") {
  console.log("Worker!");
} else {
  console.log("NO Worker!");
}
var createSessionNodeLinkReady = true;

var serverConnected = false ;
var serverHeartbeatTimeout = 30000 ;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 15047;

var debug = true;
var MAX_RX_QUEUE = 250;

var forceStopped = false;
var mouseMovingFlag = false;

var createNodeQueue = [];
var createLinkQueue = [];

var newNodes = [];
var newLinks = [];

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

var DEFAULT_CHARGE = -250;
var DEFAULT_GRAVITY = 0.05;
var DEFAULT_LINK_STRENGTH = 0.3;
var DEFAULT_FRICTION = 0.75;

var DEFAULT_SESSION_CONFIG = {
    'charge': DEFAULT_CHARGE,
    'friction': DEFAULT_FRICTION,
    'linkStrength': DEFAULT_LINK_STRENGTH,
    'gravity': DEFAULT_GRAVITY,
    'ageRate': DEFAULT_AGE_RATE,
    'sessionType': '',
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

var urlRoot = "http://localhost:9997/session?session=";

// var linkHashMap = new StringMap();
// var nodeHashMap  = new StringMap();
// var sessionHashMap = new StringMap();
// var deleteSessionHashMap = new StringMap();

var linkHashMap = new HashMap();
var nodeHashMap  = new HashMap();
var sessionHashMap = new HashMap();
var deleteSessionHashMap = new HashMap();

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

function jp(s, obj){
  console.warn(s + "\n" + jsonPrint(obj));
}

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

  console.log("displayInfoOverlay", opacity, color);

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
  type: "VIEWER"
};

var mouseMoveTimeout = setTimeout(function(){
  d3.select("body").style("cursor", "none");
  // if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
  //   displayInfoOverlay(1);
  // }
  displayControlOverlay(true);
}, mouseMoveTimeoutInterval);



function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);

  // displayInfoOverlay(1);
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
  // displayInfoOverlay(1.0, defaultTextFill);
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
  updateStatsOverlay4(socket.id);

});

socket.on("disconnect", function(){
  serverConnected = false;
  // displayInfoOverlay(1.0, 'red');
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
  var sessionType;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split('&');

  var asyncTasks = [];

  variableArray.forEach(

    function(variable, callback){

      asyncTasks.push(function(callback2){

        var keyValuePair = variable.split('=');

        if (keyValuePair[1] !== 'undefined'){

          console.log("'" + variable + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);

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
          if (keyValuePair[0] === 'type') {
            sessionType = keyValuePair[1];
            console.log("SESSION TYPE | sessionType: " + sessionType);
            return(callback2(null, {sessionType: sessionType}));
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

      if (resultObj.sessionType) {
        console.warn("SESSION TYPE"
          + " | " + sessionType
        );
      }



    });

    var returnObj = {
      sessionType: sessionType,
      sessionMode: sessionMode,
      sessionId: urlSessionId,
      namespace: urlNamespace
    };

    callbackMain(err, returnObj);
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

var adjustedAgeRateScale = d3.scalePow().domain([1,500]).range([1.0,100.0]);
var fontSizeScale = d3.scaleLog().domain([1,100000]).range([1.6,3.2]);

var sessionCircleRadiusScale = d3.scaleLog().domain([1,2000000]).range([40.0,100.0]);  // uses wordChainIndex
var defaultRadiusScale = d3.scaleLog().domain([1,2000000]).range([1.0,40.0]);

var fillColorScale = d3.scaleLinear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

var strokeColorScale = d3.scaleLinear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

var linkColorScale = d3.scaleLinear()
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
  console.log("zoomHandler: TRANSLATE: " + d3.event.translate + " | SCALE: " + d3.event.scale);
  // svgForceLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  if (!mouseHoverFlag) {
    svgForceLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
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
  .scaleExtent([0.1, 10])
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

var sessionGnode = sessionSvgGroup.selectAll("g.session");
var sessionCircles = sessionSvgGroup.selectAll(".sessionCircle");
var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");

var node = nodeSvgGroup.selectAll("g.node");
var nodeCircles = nodeSvgGroup.selectAll("circle");
var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

var link = linkSvgGroup.selectAll("line");

var sessionUpdateQueue = [];
var rxSessionUpdateQueue = [];
var sessionUpdateQueueMaxInQ = 0;


function sessionCircleDragMove(d) {
  var x = d3.event.x;
  var y = d3.event.y;

  var dX = 1 * (-d.x + x);
  var dY = 1 * (-d.y + y);

  d3.select(this).attr("transform", "translate(" + dX + "," + dY + ")");
  nodeSvgGroup.selectAll('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");
  sessionGnode.select('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");
  sessionCircles.select('#' + d.userId).attr("transform", "translate(" + dX + "," + dY + ")");
  // sessionSvgGroup.selectAll('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");
  sessionLabelSvgGroup.select('#' + d.nodeId).attr("transform", "translate(" + dX + "," + dY + ")");

  // console.log("dragmove\n" + d.sessionId +  " | " + d.nodeId + " | currentScale: " + currentScale + " x: " + x + " y: " + y);
}

// Define drag beavior
var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("drag", sessionCircleDragMove);

drag.on("dragstart", function() {
  d3.event.sourceEvent.stopPropagation(); // silence other listeners
});

drag.on("dragend", function(d) {
  d3.event.sourceEvent.stopPropagation(); // silence other listeners

  console.warn("DRAG END"
    + " | " + d.nodeId
    + " | " + d.x + " " + d.y
  );
});

var globalLinkIndex = 0;

function generateLinkId(callback){
  globalLinkIndex++ ;
  return "LNK" + globalLinkIndex ;
}

//
// FORCE LAYOUT DECLARATION
//

function tick() {
  sessionGnode
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  node
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  sessionCircles
    .attr("r", function(d) { 
      return sessionCircleRadiusScale(d.wordChainIndex + 1); 
    })
    // .attr("r", function(d) { return d.r; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  sessionLabels
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) {
      var shiftY = -1.4 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
      return d.y + shiftY;
    });

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
    // displayInfoOverlay(1.0);
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

  if (!sessionHashMap.has(sessionId)) {
    console.warn("deleteSession: SID NOT IN HASH: " + sessionId + " ... SKIPPING DELETE");
    return(callback(sessionId));
  }

  force.stop();

  var deletedSession = sessionHashMap.get(sessionId);

  console.warn("XXX DELETE SESSION"
    + " [" + sessions.length + "]"
    + " | " + deletedSession.sessionId
    + " | " + deletedSession.userId
  );

  var sessionLinks = deletedSession.linkHashMap.keys();

  async.each(sessionLinks, function(sessionLinkId, cb){
    linkHashMap.remove(sessionLinkId);
    cb();
  },
    function(err){
      sessionHashMap.remove(sessionId);

      // nodeHashMap.remove(deletedSession.node.nodeId);
      var sessionNode = nodeHashMap.get(deletedSession.userId);
      sessionNode.isDead = true;
      nodeHashMap.set(deletedSession.userId, sessionNode);
      nodeHashMap.remove(deletedSession.sessionId);

      deleteSessionHashMap.set(sessionId, 1);

      callback(sessionId);
    }
  );

}

function deleteAllSessions(callback){

  var sessionIds = sessionHashMap.keys();

  async.each(sessionIds, function(sessionId, cb){
    deleteSession(sessionId, function(sId){
      console.warn("XXX DELETED SESSION " + sId);
      cb();
    });
  },
    function(err){
      callback();
    }
  );
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
  if (sessionHashMap.has(rxObj.sessionId)) {
    console.warn("SESSION_DELETE"
      + " | " + rxSessionObject.sessionId
      + " | " + rxSessionObject.sessionEvent
      // + "\n" + jsonPrint(rxSessionObject)
    );
    var session = sessionHashMap.get(rxObj.sessionId);
    session.sessionEvent = "SESSION_DELETE";
    rxSessionUpdateQueue.push(session);
  }
});

socket.on("SESSION_UPDATE", function(rxSessionObject){

  var rxObj = rxSessionObject ;

  if (!windowVisible){
    rxSessionUpdateQueue = [];
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

    rxSessionUpdateQueue.push(rxSessionObject);

    console.log(
      rxObj.userId
      + " | " + rxSessionUpdateQueue.length
      + " | " + rxObj.source.nodeId + " > " + rxObj.target.nodeId
    );

  }
});

//=============================
// TICK
//=============================

var age;


//================================
// GET NODES FROM QUEUE
//================================

var initialPositionIndex = 0;
var initialPositionArray = [];

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
    initialPositionArray.push(computeInitialPosition(initialPositionIndex++));
  }

}, 50);

function addToHashMap(hm, key, value, callback){
  hm.set(key, value);
  var v = hm.get(key);
  callback(v);
}

function removeFromHashMap(hm, key, callback){
  hm.remove(key);
  callback(key);
}

function createSession (callback){

  var currentSession = {};
  var currentSessionNode = {};
  // console.log("rxSessionUpdateQueue: " + rxSessionUpdateQueue.length);

  if (rxSessionUpdateQueue.length == 0){
    // console.log("sessionObject\n");
    callback(null, null);
  }
  else {

    var dateNow = moment().valueOf();

    var sessUpdate = rxSessionUpdateQueue.shift();

    // console.log("sessUpdate\n" + jsonPrint(sessUpdate));

    if (sessUpdate.sessionEvent == 'SESSION_DELETE'){
      console.warn("DELETE SESSION: " + sessUpdate.sessionId);
      deleteSession(sessUpdate.sessionId, function(sessionId){
        callback(null,null);
      });
    }
    else if (deleteSessionHashMap.has(sessUpdate.sessionId)){
      return(callback(null, null));
    }
    else if (sessionHashMap.has(sessUpdate.sessionId)){

      currentSession = sessionHashMap.get(sessUpdate.sessionId);

      if (nodeHashMap.has(currentSession.node.nodeId)) {
        currentSession.node = nodeHashMap.get(currentSession.node.nodeId);
      }

      var prevLatestNodeId = currentSession.latestNodeId;
      var prevSessionLinkId = currentSession.userId + "_" + prevLatestNodeId;

      removeFromHashMap(linkHashMap, prevSessionLinkId, function(){});

      currentSession.age = 0;
      currentSession.userId = sessUpdate.userId;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.source = sessUpdate.source;
      currentSession.source.lastSeen = dateNow;
      currentSession.target = sessUpdate.target;
      currentSession.target.lastSeen = dateNow;
      currentSession.latestNodeId = sessUpdate.source.nodeId;
      currentSession.node.age = 0;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;

      var sessionLinkId = sessUpdate.userId + "_" + sessUpdate.source.nodeId;
      currentSession.node.links = {};
      currentSession.node.links[sessionLinkId] = 1;

      // sessionHashMap.set(sessionObject.sessionId, currentSession);
      addToHashMap(sessionHashMap, currentSession.sessionId, currentSession, function(cSession){
        createNodeQueue.push(cSession);
        removeFromHashMap(linkHashMap, sessionId, function(){
          callback(null, cSession.sessionId);
        });
      });

    }
    else {

      sessionsCreated += 1;

      currentSession.sessionId = sessUpdate.sessionId;
      currentSession.nodeId = sessUpdate.userId;
      currentSession.userId = sessUpdate.userId;
      currentSession.text =  sessUpdate.userId;
      currentSession.url =  sessUpdate.url;
      currentSession.source = sessUpdate.source;
      currentSession.target = sessUpdate.target;
      currentSession.latestNodeId = sessUpdate.source.nodeId;

      currentSession.node = {};
      currentSession.age = 0;
      currentSession.linkHashMap = new HashMap();
      currentSession.initialPosition = initialPositionArray.shift();
      currentSession.x = currentSession.initialPosition.x;
      currentSession.y = currentSession.initialPosition.y;
      // currentSession.r = 50;
      // currentSession.mentions = sessUpdate.wordChainIndex;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.colors = {};
      currentSession.colors = randomColorQueue.shift();

      var interpolateNodeColor = d3.interpolateHcl(currentSession.colors.endColor, currentSession.colors.startColor);
      currentSession.interpolateColor = interpolateNodeColor;

      // CREATE SESSION NODE
      var sessionNode = {};

      sessionNode.isSessionNode = true;
      sessionNode.nodeId = sessUpdate.userId;
      sessionNode.userId = sessUpdate.userId;
      sessionNode.sessionId = sessUpdate.sessionId;
      sessionNode.age = 0;
      sessionNode.ageUpdated = dateNow;
      sessionNode.lastSeen = dateNow;
      sessionNode.mentions = 5000;
      sessionNode.text = '';
      sessionNode.x = currentSession.initialPosition.x;
      sessionNode.y = currentSession.initialPosition.y;
      sessionNode.fixed = true;
      sessionNode.colors = currentSession.colors;
      sessionNode.interpolateColor = currentSession.interpolateColor;

      sessionNode.links = {};

      var sessionLinkId = sessUpdate.userId + "_" + currentSession.latestNodeId;
      sessionNode.links[sessionLinkId] = 1;
      sessionNode.link = sessionLinkId;

      currentSession.node = sessionNode;
      currentSession.source.lastSeen = dateNow;
      if (typeof currentSession.target !== 'undefined') {
        currentSession.target.lastSeen = dateNow;
      }

      addToHashMap(nodeHashMap, sessionNode.nodeId, sessionNode, function(sesNode){

        newNodes.push(sesNode.nodeId);

        addToHashMap(sessionHashMap, currentSession.sessionId, currentSession, function(cSession){
          console.log("NEW SESSION " 
            + cSession.userId 
            + " | " + cSession.sessionId 
            + " | " + cSession.node.nodeId 
            // + "\n" + jsonPrint(cSession) 
          );
          sessions.push(cSession);
          createNodeQueue.push(cSession);
          return(callback (null, cSession.sessionId));
        });
      });
    }
  }
}

function createNode (sessionId, callback) {

  while (createNodeQueue.length > 0) {

    var session = createNodeQueue.shift();

    if (nodeHashMap.has(sessionId)) {
      var sessionNode = nodeHashMap.get(sessionId);
      sessionNode.age = 0;

      addToHashMap(nodeHashMap, sessionId, session.node, function(sNode){
        // console.log("EXIST SESSION NODE" 
        //   + " | " + sNode.nodeId 
        //   // + "\n" + jsonPrint(sNode) 
        // );
      });
    }
    else {
      addToHashMap(nodeHashMap, sessionId, session.node, function(sNode){
        newNodes.push(sNode.nodeId);
        // console.log("CREATE SESSION NODE" 
        //   + " | " + sNode.nodeId 
        //   // + "\n" + jsonPrint(sNode) 
        // );
      });
    }

    var dateNow = moment().valueOf();

    var sourceNodeId = session.source.nodeId;
    var targetNodeId = session.target.nodeId;
    var targetNode = {};
    var sourceNode = {};


    async.parallel({
      source: function (cb) {
        if (nodeHashMap.has(sourceNodeId)) {
          sourceNode = nodeHashMap.get(sourceNodeId);
          sourceNode.userId = session.userId;
          sourceNode.sessionId = sessionId;
          sourceNode.age = 0;
          sourceNode.ageUpdated = dateNow;
          sourceNode.lastSeen = dateNow;
          sourceNode.mentions = session.source.mentions;
          if (typeof session.source.url !== 'undefined') sourceNode.url = session.source.url;
          sourceNode.text = sourceNodeId;
          sourceNode.latestNode = true;
          sourceNode.colors = session.colors;
          sourceNode.interpolateColor = session.interpolateColor;

          addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode){
            cb(null, {node: sNode, isNew: false});
          });
        }
        else {
          sourceNode = session.source ;
          sourceNode.x = session.initialPosition.x + (100 - 100 * Math.random());
          sourceNode.y = session.initialPosition.y;
          sourceNode.userId = session.userId;
          sourceNode.sessionId = sessionId;
          sourceNode.links = {};
          sourceNode.age = 0;
          sourceNode.lastSeen = dateNow;
          sourceNode.ageUpdated = dateNow;
          sourceNode.colors = session.colors;
          sourceNode.interpolateColor = session.interpolateColor;
          if (typeof session.source.url !== 'undefined') sourceNode.url = session.source.url;
          sourceNode.text = sourceNodeId ;
          sourceNode.latestNode = true;

          addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode){
            cb(null, {node: sNode, isNew: true});
          });
        }
      },

      target: function (cb) {
        if (typeof targetNodeId === 'undefined'){
          console.warn("targetNodeId UNDEFINED ... SKIPPING CREATE NODE");
          (cb("TARGET UNDEFINED", null));
        }
        else if (nodeHashMap.has(targetNodeId)) {
          targetNode = nodeHashMap.get(targetNodeId);
          targetNode.userId = session.userId;
          targetNode.sessionId = sessionId;
          targetNode.age = 0;
          targetNode.ageUpdated = dateNow;
          targetNode.lastSeen = dateNow;
          targetNode.mentions = session.target.mentions;
          targetNode.text = targetNodeId;
          if (typeof session.target.url !== 'undefined') targetNode.url = session.target.url;
          targetNode.colors = session.colors;
          targetNode.interpolateColor = session.interpolateColor;
          targetNode.latestNode = false;

          addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode){
            cb(null, {node: tNode, isNew: false});
          });
        }
        else {
          targetNode = session.target ;
          targetNode.x = session.initialPosition.x - (100 - 100 * Math.random());
          targetNode.y = session.initialPosition.y - (100 - 100 * Math.random());
          targetNode.userId = session.userId;
          targetNode.sessionId = sessionId;
          targetNode.links = {};
          targetNode.age = 0;
          targetNode.lastSeen = dateNow;
          targetNode.ageUpdated = dateNow;
          targetNode.colors = session.colors;
          targetNode.interpolateColor = session.interpolateColor;
          if (typeof session.target.url !== 'undefined') targetNode.url = session.target.url;
          targetNode.text = targetNodeId ;
          targetNode.latestNode = false;

          addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode){
            cb(null, {node: tNode, isNew: true});
          });
        }
      }
    },
    function(err, results){
      // console.warn("CREATE NODE RESULTS\n" + jsonPrint(results));

      session.source = results.source.node;
      if (results.source.isNew) newNodes.push(results.source.node.nodeId);

      if (results.target) {
        session.target = results.target.node;
        if (results.target.isNew) newNodes.push(results.target.node.nodeId);
      }

      addToHashMap(sessionHashMap, session.sessionId, session, function(cSession){
        // console.log("CREATE NODE UPDATED SESSION " 
        //   + " | " + cSession.userId 
        //   + " | " + cSession.sessionId 
        //   + " | " + cSession.node.nodeId 
        //   // + "\n" + jsonPrint(cSession) 
        // );
        createLinkQueue.push(cSession);
      });
   });
  }
  return(callback (null, sessionId));
}

function createLink (sessionId, callback) {

  while (createLinkQueue.length > 0) {

    // linkHashMap.remove(sessionId);

    var session = createLinkQueue.shift();

    // console.log("createLink"
    //   + " | SID: " + session.sessionId
    //   + " | " + session.source.nodeId
    //   + " > " + session.target.nodeId
    // );

    // session.linkHashMap.remove(sessionId);
    // linkHashMap.remove(sessionId);

    var sessionLinkId = session.userId + "_" + session.latestNodeId;

    var newSessionLink = {
      linkId: sessionLinkId,
      sessionId: sessionId,
      age: 0,
      source: session.node,
      target: session.source,
      isSessionLink: true
    };

    addToHashMap(linkHashMap, sessionLinkId, newSessionLink, function(sesLink){
      newLinks.push(sesLink.linkId);
      // console.log("NEW SESSION LINK"
      //   + " | " + newLinks.length
      //   + " | " + sesLink.linkId
      //   + " | " + sesLink.source.nodeId
      //   + " > " + sesLink.target.nodeId
      // );
    });

    var sourceWordId = session.source.nodeId;
    var sourceWord = nodeHashMap.get(sourceWordId);
    sourceWord.links[sessionId] = 1;

    var newLink;

    if (typeof session.target !== 'undefined') {

      var targetWordId = session.target.nodeId;
      var targetWord;

      if (nodeHashMap.has(targetWordId)) {
        targetWord = nodeHashMap.get(targetWordId);
        if (typeof targetWord.links !== 'undefined') delete targetWord.links[sessionId];
      
        var linkId = generateLinkId();

        targetWord.links[linkId] = 1;

        newLink = {
          linkId: linkId,
          sessionId: session.sessionId,
          age: 0,
          source: sourceWord,
          target: targetWord
        };

        sourceWord.links[linkId] = 1;
        addToHashMap(nodeHashMap, targetWordId, targetWord, function(){});
      }
    }

    addToHashMap(nodeHashMap, sourceWordId, sourceWord, function(){});


    if (newLink) addToHashMap(linkHashMap, linkId, newLink, function(nLink){
      newLinks.push(nLink.linkId);
      // console.log("NEW LINK"
      //   + " | " + newLinks.length
      //   + " | " + nLink.linkId
      //   + " | " + nLink.source.nodeId
      //   + " > " + nLink.target.nodeId
      // );
    });

    addToHashMap(sessionHashMap, session.sessionId, session, function(sess){
      // console.log("createLink END\n" + jsonPrint(sess));
    });

  }
  return(callback (null, sessionId));
}

function updateNodesArray (sessionId, callback) {
  var nodeId;
  var newNode;
  while (newNodes.length > 0){
    if (!forceStopped) {
      force.stop(); 
      forceStopped = true ;
    }
    nodeId = newNodes.shift();
    newNode = nodeHashMap.get(nodeId);
    nodes.push(newNode);
  }
  return(callback (null, sessionId));
}

function updateLinksArray (sessionId, callback) {
  while (newLinks.length > 0){
    var linkId = newLinks.shift();
    var newLink = linkHashMap.get(linkId);
    if (typeof newLink !== 'undefined'){
      if (!forceStopped) {
        force.stop(); 
        forceStopped = true ;
      }
      links.push(newLink);
    }
    else {
      console.warn("updateLinksArray: NEW LINK NOT IN HM? SKIPPING | linkId: " + linkId);
    }
  }
  return(callback (null, sessionId));
}

function calcNodeAges (callback){

  if (nodes.length === 0) {
    ageRate = DEFAULT_AGE_RATE;
  }
  else if (nodes.length > 100) {
    ageRate = adjustedAgeRateScale(nodes.length-100);
  }
  else {
    ageRate = DEFAULT_AGE_RATE;
  }

  var dateNow = moment().valueOf();

  var nodeIds = nodeHashMap.keys();
  // var nodeIds = Object.keys(nodeHashMap);

  async.each(nodeIds, function(nodeId, cb){

    var node = nodeHashMap.get(nodeId);

    age = node.age + (ageRate * (dateNow - node.ageUpdated));

    if (!node.isSessionNode && (age >= nodeMaxAge)) {
      node.isDead = true;
      addToHashMap(nodeHashMap, nodeId, node, function(node){
        cb();
      });
    }
    else {
      node.ageUpdated = dateNow;
      node.age = age;
      addToHashMap(nodeHashMap, nodeId, node, function(node){
        cb();
      });
    }

  },
    function(err){
      return(callback());
    }
  )
}

function ageSessions (sessionId, callback){

  var dateNow = moment().valueOf();

  var ageSession;

  var ageSessionsLength = sessions.length-1;
  var ageSessionsIndex =  sessions.length-1;

  for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex>=0; ageSessionsIndex -= 1) {  

    ageSession = sessions[ageSessionsIndex];

    if (!sessionHashMap.has(ageSession.sessionId)){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }
      sessions.splice(ageSessionsIndex, 1); 
    }
  }

  if (ageSessionsIndex < 0) {
    return(callback(null, sessionId));
  }
}

function ageNodes (sessionId, callback){

  var dateNow = moment().valueOf();

  var ageNodesLength = nodes.length-1;
  var ageNodesIndex =  nodes.length-1;

  var currentNodeObject;
  var currentNodeId;

  for (ageNodesIndex = ageNodesLength; ageNodesIndex>=0; ageNodesIndex -= 1) {  

    currentNodeObject = nodes[ageNodesIndex];
    currentNodeId = currentNodeObject.nodeId;

    if (currentNodeObject.isDead){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }
      removeFromHashMap(nodeHashMap, currentNodeId, function(){
        nodes.splice(ageNodesIndex, 1);

        // jp("currentNodeObject.links", currentNodeObject.links);

      });
    }
    else {
      nodes[ageNodesIndex].age = currentNodeObject.age;
      nodes[ageNodesIndex].ageUpdated = currentNodeObject.ageUpdated;
      addToHashMap(nodeHashMap, currentNodeId, currentNodeObject, function(node){
      });
    }
  }

  if (ageNodesIndex < 0) {
    return(callback(null, sessionId));
  }
}

function ageLinks (sessionId, callback){

  var ageLinksIndex = links.length-1;

  var currentSession;
  var currentLinkObject = {};
  var dateNow = moment().valueOf();

  for (ageLinksIndex = links.length-1; ageLinksIndex >= 0; ageLinksIndex -= 1) {

    currentLinkObject = links[ageLinksIndex];

    // console.log("currentLinkObject\n" + jsonPrint(currentLinkObject));

    if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.isDead){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }
      removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
        links.splice(ageLinksIndex, 1); 
      });
    }
    else if ((typeof currentLinkObject !== 'undefined') 
      && (currentLinkObject.source.isDead || currentLinkObject.target.isDead)){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }
      removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
        links.splice(ageLinksIndex, 1); 
      });
    }
    else if ((typeof currentLinkObject !== 'undefined') && !linkHashMap.has(currentLinkObject.linkId)){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }
      removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
        links.splice(ageLinksIndex, 1); 
      });
    }
    else if (!nodeHashMap.has(currentLinkObject.source.nodeId) || !nodeHashMap.has(currentLinkObject.target.nodeId)){
      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }
      removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
        links.splice(ageLinksIndex, 1); 
      });
    }
    else {
      if (currentLinkObject.source.age < currentLinkObject.target.age) {
        currentLinkObject.age = currentLinkObject.source.age;
      }
      else {
        currentLinkObject.age = currentLinkObject.target.age;
      }
      addToHashMap(linkHashMap, currentLinkObject.linkId, currentLinkObject, function(link){
      });
    }
  }

  if (ageLinksIndex < 0) {
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
    .attr("id", function(d) { return d.nodeId; })
    .attr("nodeId", function(d) { return d.nodeId; })
    .attr("sessionId", function(d) { return d.sessionId; })
    .attr("userId", function(d) { return d.userId; })
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
    // .append("svg:line", "g.node")
    .append("svg:line")
    .attr("class", "link")
    .attr("id", function(d) { return d.linkId; })
    .attr("sourceNodeId", function(d) { return d.source.nodeId; })
    .attr("targetNodeId", function(d) { return d.target.nodeId; })
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
      return sessionCircleRadiusScale(d.wordChainIndex + 1); 
    })
    .style("fill", function(d) { 
      return d.interpolateColor(0.25);
    })
    .style('opacity', 0.5)
    .style('stroke', function(d){
      return d.interpolateColor(0.95);
    })
    .style("stroke-opacity", 0.8);


  sessionCircles
    .enter()
    .append("svg:circle")
    .attr("id", function(d) { return d.nodeId; })
    .attr("class", "sessionCircle")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("mouseover", 0)
    // .on("mousedrag", drag)
    .on("mouseover", sessionCircleMouseOver)
    .on("mouseout", sessionCircleMouseOut)
    .on("dblclick", sessionCircleClick)
    .call(drag)
    .attr("r", 1e-6)
    .style("visibility", "visible") 
    .style("fill", function(d) { 
      return d.interpolateColor(0.5);
    })
    .style("opacity", 1e-6)
    .style('stroke', function(d){
      return d.interpolateColor(0.75);
    })
    .style("stroke-width", 2.5)
    .style("stroke-opacity", 0.8)
    .transition()
      .duration(defaultFadeDuration)      
      .attr("r", function(d) { 
        return sessionCircleRadiusScale(d.wordChainIndex + 1); 
      })
      .style('opacity', 0.5);

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
    .attr("y", function(d) { return d.y; })
    .attr("class", "sessionLabel")
    .attr("id", function(d) { return d.nodeId; })
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

  callback(null, sessionId);
}

function updateNodeCircles (sessionId, callback) {

  nodeCircles = nodeSvgGroup.selectAll("circle")
    .data(force.nodes(), function(d) {
      return d.nodeId;
    });

  nodeCircles
    .attr("r", function(d) { 
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
    .attr("id", function(d) { return d.nodeId; })
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("mouseover", 0)
    .on("mouseover", nodeMouseOver)
    .on("mouseout", nodeMouseOut)
    .on("dblclick", nodeClick)
    // .call(force.drag)
      .attr("r", function(d) { 
        return defaultRadiusScale(d.mentions + 1); 
      })
    .style("visibility", "visible") 
    .style("opacity", 1.0)
    .style('stroke', function(d){ return strokeColorScale(d.age);})
    .style("stroke-width", 2.5)
    .style("fill", "#FFFFFF")
    .transition()
      .duration(defaultFadeDuration)      
      .style("fill", "#ffffff")
      // .attr("r", function(d) { 
      //   return defaultRadiusScale(d.mentions + 1); 
      // })
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

function createSessionNodeLink() {

  createSessionNodeLinkReady = false;

  async.waterfall(
    [ 
      createSession,
      createNode,
      createLink,
      updateNodesArray,
      updateLinksArray,
      ageSessions,
      ageNodes,
      ageLinks,
      updateNodes,
      updateSessionCircles,
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

function nodeFill (age) { 
  return fillColorScale(age);
}

function nodeMouseOver(d) {

  console.warn("MOUSE OVER"
    // + "\n" + jsonPrint(d)
  );

  if (d.links) {
    var linkNodeIds = Object.keys(d.links);

    linkNodeIds.forEach(function(nId){
      var cNode = nodeHashMap.get(nId);
      console.log("CONNECTED NODES | " + d.nodeId
        + "\n" + jsonPrint(cNode)
        );
    });
  }

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

  d3.select(this)
    .style("fill", fillColor)
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

function nodeFill (age) { 
  return fillColorScale(age);
}

// SESSION CIRCLE
function sessionCircleMouseOver(d) {

  console.log("MOUSE OVER"
    + " | ID: " + d.id
    // + " | NID: " + d.nodeId
    // + " | UID: " + d.userId
    // + jsonPrint(d)
  );

  mouseHoverFlag = true;
  mouseHoverNodeId = d.sessionId;

  // var nodeId = d.nodeId;
  var sId = d.sessionId;
  var uId = d.userId;
  var wordChainIndex = d.wordChainIndex;
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

  var tooltipString =  "<bold>" + uId + "<br>" + sId + "</bold>" + "<br>WORDS: " + wordChainIndex;

  divTooltip.html(tooltipString) 
    .style("left", (d3.event.pageX - 40) + "px")   
    .style("top", (d3.event.pageY - 50) + "px");  
}

function sessionCircleMouseOut() {

  mouseHoverFlag = false;

  d3.select("body").style("cursor", "default");

  d3.select(this)
    .style("fill", function(d) { 
      return d.interpolateColor(0.25);
    })
    .style("opacity", 0.5)
    .style('stroke', function(d){
      return d.interpolateColor(0.95);
    })
    .style("stroke-width", 2.5)
    .attr("mouseover", 0)
    .attr("r", function(d) {       
      return sessionCircleRadiusScale(d.wordChainIndex + 1); 
     });

  divTooltip.transition()   
    .duration(defaultFadeDuration)    
    .style("opacity", 1e-6); 
}

function sessionCircleClick(d) {
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
  // displayInfoOverlay(1.0);
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

d3.timer(function () {
  dateNow = moment().valueOf();
  calcNodeAges(function(){});
  if (createSessionNodeLinkReady && !mouseMovingFlag) createSessionNodeLink();
});

// setInterval(function () {
//   dateNow = moment().valueOf();
//   calcNodeAges(function(){});
//   if (createSessionNodeLinkReady && !mouseMovingFlag) createSessionNodeLink();
// }, 50);
