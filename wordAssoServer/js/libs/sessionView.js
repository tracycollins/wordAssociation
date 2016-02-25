/*ver 0.47*/
/*jslint node: true */
"use strict";

if(typeof(Worker) !== "undefined") {
  console.log("Worker!");
} else {
  console.log("NO Worker!");
}

var debug = false;

var forceStopped = false;

var sessionsCreated = 0;

var mouseMoveTimeoutInterval = 1000; 
var mouseFreezeEnabled = false;
var mouseOverRadius = 10;
var mouseHoverFlag = false;
var mouseHoverNodeId;

var DEFAULT_MAX_AGE = 20000.0;
var DEFAULT_AGE_RATE = 1.0;

var ageRate = DEFAULT_AGE_RATE;
var nodeMaxAge = DEFAULT_MAX_AGE;

var DEFAULT_CHARGE = -350;
var DEFAULT_GRAVITY = 0.05;
var DEFAULT_LINK_STRENGTH = 0.4;
var DEFAULT_FRICTION = 0.9;

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

// var sessionHashMap = new HashMap();
var sessionHashMap = {};

var urlRoot = "http://localhost:9997/session?session=";

// var nodeHashMap = {};
var nodeHashMap = new StringMap();

var nodesCreated = 0;

var dateNow = moment().valueOf();
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var currentSession;
var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

var defaultFadeDuration = 100;

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

var DATE_TIME_OVERLAY_X;
var DATE_TIME_OVERLAY_Y;

STATS_OVERLAY1_X = DEFAULT_STATS_OVERLAY1_X * width;
STATS_OVERLAY1_Y = DEFAULT_STATS_OVERLAY1_Y * height;

STATS_OVERLAY2_X = DEFAULT_STATS_OVERLAY2_X * width;
STATS_OVERLAY2_Y = DEFAULT_STATS_OVERLAY2_Y * height;

STATS_OVERLAY3_X = DEFAULT_STATS_OVERLAY3_X * width;
STATS_OVERLAY3_Y = DEFAULT_STATS_OVERLAY3_Y * height;

DATE_TIME_OVERLAY_X = DEFAULT_DATE_TIME_OVERLAY_X * width;
DATE_TIME_OVERLAY_Y = DEFAULT_DATE_TIME_OVERLAY_Y * height;

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

var randomIntFromInterval = function (min,max) {
  var random = Math.random();
  var randomInt = Math.floor((random*(max-min+1))+min);
  return randomInt;
};

var randomId = randomIntFromInterval(1000000000,9999999999);

var viewerObj = {
  viewerId: 'VIEWER_RANDOM_' + randomId,
  screenName: 'VIEWER RANDOM ' + randomId
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

    // mouseMovingFlag = false;
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
          console.log("'" + variable + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);
          if (keyValuePair[0] === 'monitor') {
            monitorMode = keyValuePair[1];
            callback2(null, {namespace: urlNamespace, sessionId: urlSessionId, sessionMode: sessionMode, monitorMode: monitorMode});
          }
          if (keyValuePair[0] === 'session') {
            urlSessionId = keyValuePair[1];
            console.log("urlSessionId: " + urlSessionId);
            sessionMode = true;
            callback2(null, {sessionId: urlSessionId});
          }
          if (keyValuePair[0] === 'nsp') {
            urlNamespace = keyValuePair[1];
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
  );

  async.parallel(asyncTasks, function(err, results){
    console.log("results\n" + jsonPrint(results));
    if (sessionMode) {
      console.log("SESSION MODE"
        + " | SID: " + urlSessionId
        + " | NSP: " + urlNamespace
      );
      currentSession = "/" + urlNamespace + "#" + urlSessionId;
    }
    callbackMain(err, {sessionId: urlSessionId, namespace: urlNamespace});
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
var fontSizeScale = d3.scale.log().domain([1,1000000]).range([1.6,3.2]);

var defaultRadiusScale = d3.scale.log().domain([1,1000000]).range([3.2,32]);

var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);

var linkColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#666666", "#444444"]);


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
  .style("fill", "#888888");

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

// var sessionUpdateQueue = new Queue();
var sessionUpdateQueue = [];
var rxSessionUpdateQueue = new Queue();
var sessionUpdateQueueMaxInQ = 0;

//
// FORCE LAYOUT DECLARATION
//

function tick() {
  node
    .attr("transform", function(d) {
      if (isNaN(d.x)) console.error("**** NODE POS NaN: " + d.nodeId
        + " | TYPE OF " + typeof d.x
        + " | " + d.x
      );
      return "translate(" + d.x + "," + d.y + ")";
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

//  CLOCK
setInterval (function () {
  // dateTimeOverlay = d3.select("#dateTimeOverlay").select("text").text(getTimeStamp());
  dateTimeOverlay = d3.select("#dateTimeOverlay").select("text").text("SERVER TIME: " + moment().format(defaultDateTimeFormat));
}, 1000 );

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


socket.on("HEARTBEAT", function(heartbeat){

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
      // + " | " + sessionUpdateQueue.getLength() + " NODES IN Q"
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


socket.on("SESSION", function(sessionObject){

  if (!windowVisible) {
    return;
  }

  console.log("> RX SESSION"
    + " | SID: " + sessionObject.sessionId
    + " | WCL: " + sessionObject.wordChainLength
    + " | WCSL: " + sessionObject.wordChainSegmentLength
    + " | WCI: " + sessionObject.wordChainIndex
    + " | " + sessionObject.word.nodeId
  );

  // if (sessionHashMap.has(sessionObject.sessionId)){
  if (sessionHashMap[sessionObject.sessionId]){
    // currentSession = sessionHashMap.get(sessionObject.sessionId);
    currentSession = sessionHashMap[sessionObject.sessionId];
  }
  else {
    sessionsCreated += 1;
    var startColor = "hsl(" + Math.random() * 360 + ",100%,40%)";
    var endColor = "hsl(" + Math.random() * 360 + ",0%,0%)";
    var interpolateNodeColor = d3.interpolateHcl(endColor, startColor);

    sessionObject.colors = {'startColor': startColor, 'endColor': endColor};
    sessionObject.interpolateColor = interpolateNodeColor;
    currentSession = sessionObject;
    currentSession.wordChain = [];
    currentSession.initialPosition = computeInitialPosition(sessionsCreated);

    console.log("NEW SESSION " + currentSession.sessionId + " POS: " + jsonPrint(currentSession.initialPosition));
  }

  currentSession.lastSeen = dateNow;

  currentSession.wordChain[sessionObject.wordChainIndex] = sessionObject.word;

  // sessionHashMap.set(currentSession.sessionId, currentSession);
  sessionHashMap[currentSession.sessionId] = currentSession;

  createNode(currentSession.sessionId, sessionObject.word, function(){
    if (currentSession.wordChain[sessionObject.wordChainIndex-1]) {
      // if (nodeHashMap[currentSession.wordChain[sessionObject.wordChainIndex-1].nodeId]) {
      if (nodeHashMap.has(currentSession.wordChain[sessionObject.wordChainIndex-1].nodeId)) {
        var sourceWord = nodeHashMap.get(currentSession.wordChain[sessionObject.wordChainIndex-1].nodeId);
        console.log("@@@ < CREATE PREV LINK");
        createLinks(
          { sessionId: sessionObject.sessionId,
            sourceWord: sourceWord,
            targetWord: sessionObject.word
          },
          function(){
            console.log("@@@ ... CREATED PREV LINK");
          });
      }
    }
    if (currentSession.wordChain[sessionObject.wordChainIndex+1]) {
      if (nodeHashMap.has(currentSession.wordChain[sessionObject.wordChainIndex+1].nodeId)) {
        var targetWord = nodeHashMap.get(currentSession.wordChain[sessionObject.wordChainIndex+1].nodeId);
        console.log("@@@ > CREATE NEXT LINK");
        createLinks(
          { sessionId: sessionObject.sessionId,
            sourceWord: sessionObject.word,
            targetWord: targetWord
          },
          function(){
            console.log("@@@ ... CREATED NEXT LINK");
          });
      }
    }
  });
});

socket.on("SESSION_UPDATE", function(rxSessionObject){
  if (!windowVisible){
    if (debug) {
      console.log("... SKIP SESSION_UPDATE ... WINDOW NOT VISIBLE");
    }
  }
  else if (sessionMode && (rxSessionObject.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("... SKIP SESSION_UPDATE: ID: " + rxSessionObject.sessionId + " | CURRENT SESSION: " + currentSession.sessionId);
    }
  }
  else {

    rxSessionUpdateQueue.enqueue(rxSessionObject);


    console.log("SESSION_UPDATE | " + rxSessionObject.sessionId
      + " | " + rxSessionObject.source.nodeId
      + " [" + rxSessionObject.source.wordChainIndex + "]"
      + " -> " + rxSessionObject.target.nodeId
      + " [" + rxSessionObject.target.wordChainIndex + "]"
      + " | WCI: " + rxSessionObject.wordChainIndex
      + " | Q: " + rxSessionUpdateQueue.getLength()
    // + "\n" + jsonPrint(rxSessionObject.source)
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
    x: ((0.5 * width) + (radiusX * Math.cos(index))),
    y: ((0.5 * height) - (radiusY * Math.sin(index)))
  };

  return pos;
}

var nodesLength;
var nodeIndex = 0;
var tempMentions;

function createNode (sessionId, wordObject, callback) {

  // force.stop();

  var dateNow = moment().valueOf();


  var newNodesFlag = false;

  // if (!sessionHashMap.has(sessionId)) {
  if (!sessionHashMap[sessionId]) {
    console.error("??? SESSION NOT IN HASH ??? " + sessionId + " ... SKIPPING");
    callback (null);
  }
  else if (!wordObject) {
    console.error("??? NO WORD OBJECT ??? " + sessionId + " ... SKIPPING");
    callback (null);
  }
  else {

    // var createNodeSession = sessionHashMap.get(sessionId);
    var createNodeSession = sessionHashMap[sessionId];
    var currentNodeObject = {};
    var currentNodeId = wordObject.nodeId;

    if (nodeHashMap.has(currentNodeId)) {

      console.log("@@@ NODE IN HM: " + sessionId 
        + " | " + currentNodeId 
        + " | " + createNodeSession.source.nodeId 
        + " -> " + createNodeSession.target.nodeId 
        + " | WCSI: " + createNodeSession.wordChainSegmentIndex
      );
      
      currentNodeObject = nodeHashMap.get(currentNodeId);

      currentNodeObject.sessionId = sessionId;
      currentNodeObject.wordChainSegmentIndex = createNodeSession.wordChainSegmentIndex;
      currentNodeObject.age = 0;
      currentNodeObject.ageUpdated = dateNow;
      currentNodeObject.lastSeen = dateNow;
      currentNodeObject.mentions = wordObject.mentions;

      currentNodeObject.text = currentNodeObject.nodeId + " | " + wordObject.wordChainIndex;

      currentNodeObject.fixed = true;
      createNodeSession.fixedNodeId = currentNodeObject.nodeId ;

      nodesLength = nodes.length;

      nodeHashMap.set(currentNodeId, currentNodeObject);
      // console.warn("nodeHashMap set " + currentNodeId + " > " + jsonPrint(currentNodeObject));

    }
    else {

      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }

      nodesCreated += 1;
      newNodesFlag = true;

      wordObject.x = createNodeSession.initialPosition.x + (0.2 * createNodeSession.initialPosition.x * Math.random());
      // avoid creating nodes on top of each other
      wordObject.y = createNodeSession.initialPosition.y + (0.2 * createNodeSession.initialPosition.y * Math.random());

      if (( wordObject.mentions === 'undefined') || (wordObject.mentions === null)) {
        console.log("wordObject\n" + JSON.stringify(wordObject));
        wordObject.mentions = 1;
        console.log("wordObject\n" + JSON.stringify(wordObject));
      }

      wordObject.sessionId = sessionId;
      wordObject.links = {};
      wordObject.wordChainSegmentIndex = createNodeSession.wordChainSegmentIndex;
      wordObject.age = 0;
      wordObject.lastSeen = dateNow;
      wordObject.ageUpdated = dateNow;

      wordObject.colors = createNodeSession.colors;
      wordObject.interpolateColor = createNodeSession.interpolateColor;
      wordObject.text = wordObject.nodeId + " | " + wordObject.wordChainIndex;

      wordObject.fixed = true;

      createNodeSession.fixedNodeId = wordObject.nodeId ;

      nodeHashMap.set(wordObject.nodeId, wordObject);

      nodes.push(wordObject);

      // force.nodes(nodes);

      if (nodes.length > maxNumberNodes) {
        maxNumberNodes = nodes.length;
      }

      callback (null, newNodesFlag);
    }
  }
}

var linkHashMap = {};

var linkExists = function(nodeIdA, nodeIdB){

  var linkIdAB = nodeIdA + '_' + nodeIdB ;
  var linkIdBA = nodeIdB + '_' + nodeIdA ;

  if (linkHashMap[linkIdAB] || linkHashMap[linkIdBA]){
    return true ;
  }

};

function createLinks (sessionObject, callback) {

  var currentWord ;
  var previousWord ;

  var wcIndex = 0;
  var wcLength = sessionObject.wordChain.length;
  var nodeId ;
  var prevNodeId ;

  var newLinkFlag = false ;
  var newLinks = [];

  var sourceWordId = sessionObject.source.nodeId;
  var targetWordId = sessionObject.target.nodeId;

  var sourceWord = nodeHashMap.get(sessionObject.source.nodeId);
  var targetWord;

  if (typeof sessionObject.target === 'undefined'){
    callback (null, newLinks);
    return;
  }
  else{
    if (typeof sessionObject.target.nodeId !== 'string') {
      console.warn("??? TARGET NODE ID NOT A STRING (NEW SESSION?) ... SKIPPING CREATE LINKS\nSESSION OBJECT TARGET\n" 
        + jsonPrint(sessionObject.target));
      callback (null, newLinks);
      return;
    }
    else if (nodeHashMap.has(sessionObject.target.nodeId)){
      targetWord = nodeHashMap.get(sessionObject.target.nodeId);
    }
  }

  if (!nodeHashMap.has(sessionObject.source.nodeId)) {
    console.error("sourceWordId " + sourceWordId + " NOT IN nodeHashMap ... SKIPPING createLinks");
    callback (null, newLinks);
    return;
  }
  else if (!nodeHashMap.has(sessionObject.target.nodeId)) {
    console.error("targetWordId " + targetWordId + " NOT IN nodeHashMap ... SKIPPING createLinks");
    callback (null, newLinks);
    return;
  }
  else if (typeof sourceWord.links[targetWord.nodeId] !== 'undefined') {
    console.warn("sourceWord.links[targetWord.nodeId] " + sourceWord.links[targetWord.nodeId] + " EXISTS ... SKIPPING createLinks");
    callback (null, newLinks);
    return;
  }
  else if (typeof targetWord.links[sourceWord.nodeId] !== 'undefined') {
    console.warn("targetWord.links[sourceWord.nodeId] " + targetWord.links[sourceWord.nodeId] + " EXISTS ... SKIPPING createLinks");
    callback (null, newLinks);
    return;
  }
  else {

    force.stop();

    newLinkFlag = true ;

    // targetWord = nodeHashMap.get(sessionObject.target.nodeId);

    console.log("LINK | " + sourceWord.nodeId + " > " + targetWord.nodeId);
    var newLink = {
      sessionId: sessionObject.sessionId,
      // wordChainIndex: wcIndex,
      age: 0,
      source: sourceWord,
      target: targetWord
    };

    links.push(newLink);
    newLinks.push(newLink.source.nodeId + " > " + newLink.target.nodeId);

    sourceWord.links[targetWord.nodeId] = 1;
    targetWord.links[sourceWord.nodeId] = 1;

    nodeHashMap.set(sourceWord.nodeId, sourceWord) ;
    nodeHashMap.set(targetWord.nodeId, targetWord) ;

    // force.links(links);

    callback (null, newLinks);
    return;
  }

};

var numberSessionsUpdated = 0;

// var sessionDeQobject = {};
var randomNumber360 = Math.random() * 360;

function checkRxSessionUpdateQueue (callback){

  if (rxSessionUpdateQueue.isEmpty()){
    callback(null, 0);
    return;
  }
  else {
    // while (rxSessionUpdateQueue.getLength() > 0){

    // force.stop();
    var dateNow = moment().valueOf();

    // var currentSess = {};
    var sessionObject = rxSessionUpdateQueue.dequeue();

    console.log("checkRxSessionUpdateQueue DE-Q | " + sessionObject.sessionId
      + " | " + sessionObject.source.nodeId
      + " [" + sessionObject.source.wordChainIndex + "]"
      + " -> " + sessionObject.target.nodeId
      + " [" + sessionObject.target.wordChainIndex + "]"
      + " | WCI: " + sessionObject.wordChainIndex
      + " | Q: " + rxSessionUpdateQueue.getLength()
    // + "\n" + jsonPrint(rxSessionObject.source)
    );

    // randomNumber360 = Math.random() * 360;

    // if (sessionHashMap.has(sessionObject.sessionId)){
    if (sessionHashMap[sessionObject.sessionId]){
      // currentSess = sessionHashMap.get(sessionObject.sessionId);

      var currentSess = sessionHashMap[sessionObject.sessionId];

      currentSess.wordChainIndex = sessionObject.wordChainIndex;
      currentSess.wordChainSegmentIndex = sessionObject.wordChainIndex - currentSess.wordChainOffset;
      currentSess.source = sessionObject.source;
      currentSess.source.lastSeen = dateNow;
      currentSess.target = sessionObject.target;
      currentSess.target.lastSeen = dateNow;

      if (currentSess.wordChainIndex < currentSess.wordChainOffset){
        console.log("??? OUT-OF-ORDER SESSION wordChainIndex ???"
          + " INDEX " + currentSess.wordChainIndex
          + " < OFFSET " + currentSess.wordChainOffset
          + " | SETTING OFFSET = INDEX "
        );
        // earlier word in chain arrives after initial word received (out of order tx)
        currentSess.wordChainOffset = currentSess.wordChainIndex;
        currentSess.wordChainSegmentIndex = 0;
        currentSess.wordChain[currentSess.wordChainSegmentIndex] = currentSess.source.nodeId;
      }
      else {
        currentSess.wordChain[currentSess.wordChainSegmentIndex] = currentSess.source.nodeId;
      }

      // sessionHashMap.set(sessionObject.sessionId, currentSess);
      sessionHashMap[sessionObject.sessionId] = currentSess;

      if (sessionUpdateQueue.length >= QUEUE_MAX) {
        console.log(">>> RX sessionObject: [Q: "
          + sessionUpdateQueue.length
        );
        console.warn(getTimeStamp() + " -- !!! Q FULL --- DROPPING SESSION UPDATE !!! "
          + sessionUpdateQueue.length + "\n\n"
        );
      }
      else {

        // var peek = sessionUpdateQueue.peek() ;
        // if (peek) console.warn("sessionUpdateQueue B4 EN-Q | PEEK: " + peek.source.nodeId);

        console.log("sessionUpdateQueue B4 EN-Q | " + currentSess.sessionId
          + " | " + currentSess.source.nodeId
          + " [" + currentSess.source.wordChainIndex + "]"
          + " -> " + currentSess.target.nodeId
          + " [" + currentSess.target.wordChainIndex + "]"
          + " | WCI: " + currentSess.wordChainIndex
          + " | Q: " + sessionUpdateQueue.length
        // + "\n" + jsonPrint(rxSessionObject.source)
        );

        // var currentSessEnQ = sessionUpdateQueue.enqueue(currentSess);
        sessionUpdateQueue.push(currentSess);

      }

      callback(null, sessionsCreated);
      return;

    }
    else {
      sessionsCreated += 1;

      var currentSess = sessionObject;

      currentSess.wordChainOffset = sessionObject.wordChainIndex;
      currentSess.wordChainSegmentIndex = 0;
      currentSess.wordChain = [];
      currentSess.initialPosition = computeInitialPosition(sessionsCreated);

      randomNumber360 = Math.random() * 360;

      var startColor = "hsl(" + randomNumber360 + ",100%,50%)";
      var endColor = "hsl(" + randomNumber360 + ",0%,0%)";
      var interpolateNodeColor = d3.interpolateHcl(endColor, startColor);

      currentSess.colors = {'startColor': startColor, 'endColor': endColor};
      currentSess.interpolateColor = interpolateNodeColor;

      currentSess.wordChain[currentSess.wordChainSegmentIndex] = currentSess.source.nodeId;

      console.log("NEW SESSION " + sessionObject.sessionId + " POS: " + jsonPrint(sessionObject.initialPosition));

      console.log("currentSess"
        + " | " + currentSess.sessionId
        + " | " + currentSess.source.nodeId
        + " | fixed: " + currentSess.source.fixed
        + " | WCI: " + currentSess.wordChainIndex
        + " | WCO: " + currentSess.wordChainOffset
        + " | WCSI: " + currentSess.wordChainSegmentIndex
        + " | WCL: " + currentSess.wordChain.length
        // + "\nWC: " + currentSess.wordChain
      );

      currentSess.source.lastSeen = dateNow;
      if (currentSess.target) {
        currentSess.target.lastSeen = dateNow;
      }

      // sessionHashMap.set(sessionObject.sessionId, currentSess);
      sessionHashMap[sessionObject.sessionId] = currentSess;

      if (sessionUpdateQueue.length >= QUEUE_MAX) {
        console.log(">>> RX sessionObject: [Q: " 
          + sessionUpdateQueue.length
        );
        console.warn(getTimeStamp() + " -- !!! Q FULL --- DROPPING SESSION UPDATE !!! " 
          + sessionUpdateQueue.length + "\n\n"
        );
      }
      else {
        console.log("sessionUpdateQueue NEW SESS | B4 EN-Q | " + currentSess.sessionId
          + " | " + currentSess.source.nodeId
          + " [" + currentSess.source.wordChainIndex + "]"
          + " -> " + currentSess.target.nodeId
          + " [" + currentSess.target.wordChainIndex + "]"
          + " | WCI: " + currentSess.wordChainIndex
          + " | Q: " + sessionUpdateQueue.length
        // + "\n" + jsonPrint(rxSessionObject.source)
        );

        // var currentSessEnQ = sessionUpdateQueue.enqueue(currentSess);
        sessionUpdateQueue.push(currentSess);
       }

      callback(null, sessionsCreated);
      return;
    }

    // callback(null, sessionsCreated);
    // return;
  }

}

function getNodeFromQueue (callback) {

  //========================
  // CHECK QUEUE
  //========================

  numberSessionsUpdated = 0;

  if (sessionUpdateQueue.length == 0) {
    callback (null, numberSessionsUpdated);
    return;
  }

  else {

    numberSessionsUpdated += 1;

    var sessionDeQobject = {};
 
    // sessionDeQobject = sessionUpdateQueue.dequeue();
    sessionDeQobject = sessionUpdateQueue.shift();

    console.log("sessionUpdateQueue DE-Q" 
      + " [" + sessionUpdateQueue.length + "]"
      + " | " + sessionDeQobject.sessionId
      + " | " + sessionDeQobject.source.nodeId
      + " [ " + sessionDeQobject.source.wordChainIndex
      + " | " + sessionDeQobject.wordChainOffset
      + " | " + sessionDeQobject.wordChainSegmentIndex + " ]"
    );

    createNode(sessionDeQobject.sessionId, sessionDeQobject.source, function(err, newNodesFlag){
      console.log("SOURCE" 
        + " | " + sessionDeQobject.sessionId
        + " | " + sessionDeQobject.source.nodeId
        + " [ " + sessionDeQobject.source.wordChainIndex
        + " | " + sessionDeQobject.wordChainOffset
        + " | " + sessionDeQobject.wordChainSegmentIndex + " ]"
      );
      createLinks(sessionDeQobject, function(err, newLinks){
        if (newLinks.length > 0) {
          console.log("NEW LINKS\n" + jsonPrint(newLinks));
          // if (sessionUpdateQueue.isEmpty()) {
            callback (null, numberSessionsUpdated);
          // }
        }
        // callback(null, "link");
      });
      // callbackSeries(null, "source");
    });
  }

}

function ageNodes (callback){

  if (nodes.length === 0) {
    ageRate = DEFAULT_AGE_RATE;
  }
  else if (nodes.length > 100) {
    ageRate = adjustedAgeRateScale(nodes.length-100);
  }
  else {
    ageRate = DEFAULT_AGE_RATE;
  }

  var ageNodesLength = nodes.length-1;
  var ageNodesIndex = nodes.length-1;
  var ageLinksLength;
  var ageLinksIndex;

  var deadNodesFlag = false;
  var currentNodeObject = {};

  var ageSession;

  var dateNow = moment().valueOf();

  for (ageNodesIndex = ageNodesLength; ageNodesIndex>=0; ageNodesIndex -= 1) {  

    currentNodeObject = nodes[ageNodesIndex];


    // ageSession = sessionHashMap.get(currentNodeObject.sessionId);
    ageSession = sessionHashMap[currentNodeObject.sessionId];

    age = nodes[ageNodesIndex].age + (ageRate * (dateNow - nodes[ageNodesIndex].ageUpdated));
 
    if (age > nodeMaxAge) {

      deadNodesFlag = true;

      if (!forceStopped){
        forceStopped = true ;
        force.stop();
      }

      nodeHashMap.remove(currentNodeObject.nodeId);

      ageLinksLength = links.length-1;
      ageLinksIndex = links.length-1;

      for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {
        if (currentNodeObject.nodeId === links[ageLinksIndex].target.nodeId) {
          links.splice(ageLinksIndex, 1); 
        }
        else if (currentNodeObject.nodeId === links[ageLinksIndex].source.nodeId) {
          links.splice(ageLinksIndex, 1); 
        }
        // force.links(links);
      }

      console.log("XXX DEAD | " + nodes[ageNodesIndex].nodeId);

      nodes.splice(ageNodesIndex, 1); 
        // force.nodes(nodes);

    }
    else {
      currentNodeObject.ageUpdated = dateNow;
      currentNodeObject.age = age;

      nodes[ageNodesIndex].age = age;
      nodes[ageNodesIndex].ageUpdated = dateNow;
 
      if (currentNodeObject.nodeId == ageSession.fixedNodeId) {
        currentNodeObject.fixed = true;
      }
      else {
        currentNodeObject.fixed = false;
      }

      ageLinksLength = links.length-1;
      ageLinksIndex = links.length-1;

      for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {
        if (currentNodeObject.nodeId === links[ageLinksIndex].target.nodeId) {
          links[ageLinksIndex].age = currentNodeObject.age; 
        }
        else if (currentNodeObject.nodeId === links[ageLinksIndex].source.nodeId) {
          links[ageLinksIndex].age = currentNodeObject.age; 
        }
      }

      nodeHashMap.set(currentNodeObject.nodeId, currentNodeObject);
    }
  }

  if (ageNodesIndex < 0) {
    // if (forceStopped){
    //   forceStopped = false ;
    //   force.start();
    // }
    callback(null, deadNodesFlag);
  }
}

function updateNodes (callback) {

  node = node.data(force.nodes(), function(d) { return d.nodeId;})
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("lastSeen", function(d) { return d.lastSeen; });
    // .attr("age", function(d){ d.age = computeNodeAge(d); })
    // .attr("ageUpdated", function(d){ d.ageUpdated = dateNow; });

  node.enter()
    .append("svg:g")
    .attr("class", "node")
    // .attr("nodeType", function(d) { return d.nodeType; })
    .attr("nodeId", function(d) { return d.nodeId; })
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("lastSeen", function(d) { return d.lastSeen; });
    // .attr("age", function(d){ d.age = 0; })
    // .attr("ageUpdated", function(d){ d.ageUpdated = dateNow; });

  node.exit()
    .remove();

  callback(null);
} 

function updateLinks(callback) {

  link = linkSvgGroup.selectAll("line").data(force.links(), 
    function(d) { return d.source.nodeId + "-" + d.target.nodeId; });

  link
    .style('stroke', function(d){ return linkColorScale(d.age);})
    .style('opacity', function(d){
      return (nodeMaxAge - d.age) / nodeMaxAge;
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
        return (nodeMaxAge - d.age) / nodeMaxAge;
      });

  link
    .exit()
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", 1e-6)
    .remove();

  callback(null);
}

function updateNodeCircles (callback) {

  nodeCircles = nodeSvgGroup.selectAll("circle")
    .data(force.nodes(), function(d) {
      return d.nodeId;
    });

  nodeCircles
    // .attr("lastSeen", function(d) { return d.lastSeen; })
    // .attr("mentions", function(d) { return d.mentions; })
    .attr("r", function(d) { 
      return defaultRadiusScale(d.mentions + 1); 
      // return defaultRadiusScale(100);
    })
    .style("fill", function(d) { 
      return d.interpolateColor((nodeMaxAge - d.age) / nodeMaxAge);
      // return d.interpolateColor(1);
    })
    .style('stroke', function(d){ return strokeColorScale(d.age); })
    .style('opacity', function(d){
      return (nodeMaxAge - d.age) / nodeMaxAge;
      // return 1;
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
    // .attr("nodeId",function(d) { return d.nodeId;} )
    // .attr("nodeType", function(d) { return d.nodeType; })
    // .attr("lastSeen", function(d) { return d.lastSeen; })
    // .attr("mentions", function(d) { return d.mentions; })
    // .attr("nodeText", function(d) { return d.text; })
    .attr("r", function(d) { 
      // return defaultRadiusScale(d.mentions + 1); 
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
      .style('opacity', function(d){ return 1.0; });

  nodeCircles
    .exit()
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', 1e-6)
    .remove();

  callback(null);
}

function updateNodeLabels (callback) {
  
  nodeLabels = nodeLabelSvgGroup.selectAll(".nodeLabel").data(force.nodes(), 
    function(d) { return d.nodeId; })
    .text(function(d) { return d.text; })
    .style("font-size", function(d) { 
      // return fontSizeScale(nodeHashMap[d.nodeId].mentions + 1.1) + "vmin"; 
      return fontSizeScale(d.mentions + 1.1) + "vmin"; 
    })
    .style('opacity', function(d){
      return (nodeMaxAge - d.age) / nodeMaxAge;
      // return 1;
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
      // return fontSizeScale(nodeHashMap[d.nodeId].mentions + 1.1) + "vmin"; 
      return fontSizeScale(d.mentions + 1.1) + "vmin"; 
      // return "1vmin";
    })
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", function(d) { 
        // return (nodeMaxAge - d.age) / nodeMaxAge;
        return 1;
      });

  nodeLabels.exit()
    .transition()
      .duration(defaultFadeDuration)      
      .style("opacity", 1e-6)
      .remove();

  callback(null);
}

function ageNodesCheckQueue() {

  async.series([ 

      function(callbackSeries){
        checkRxSessionUpdateQueue(function(err, sessionsCreated){
          callbackSeries(null, sessionsCreated);
        });
      },

      function(callbackSeries){
        getNodeFromQueue(function(err, numberSessionsUpdated){
          callbackSeries(null, numberSessionsUpdated);
        });
      },

      function(callbackSeries){
        ageNodes(function(err, deadNodesFlag){
          callbackSeries(null, deadNodesFlag);
        });
      },

      function(callbackSeries){
        updateNodes(function(err){
          callbackSeries(null, "nodes");
        });
      },

      function(callbackSeries){
        updateNodeCircles(function(err){
          callbackSeries(null, "nodeCircles");
        });
      },

      function(callbackSeries){
        updateNodeLabels(function(err){
          callbackSeries(null, "nodeLabels");
        });
      },

      function(callbackSeries){
        updateLinks(function(err){
          callbackSeries(null, "links");
        });
      }
    ], 
    
    function(err, results){
      if (err) { 
        console.error("*** ERROR: ageNodesCheckQueue *** \nERROR: " + err); 
      }

      if (forceStopped) {
        force.nodes(nodes);
        force.links();
        force.start(); 
        forceStopped = false ;
      }
    }
  );
}

function nodeFill (age) { 
  return fillColorScale(age);
}

function nodeMouseOver(d) { 

  mouseHoverFlag = true;
  mouseHoverNodeId = d.nodeId;

  var nodeId = d.nodeId;
  var sId = d.sessionId;
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
    .style("opacity", 1);

  var tooltipString =  "<bold>" + nodeId + "</bold>" + "<br>MENTIONS: " + mentions + "<br>" + sId;

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

  radiusX = 0.4*width;
  radiusY = 0.4*height;

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

  if (mouseFreezeEnabled) {
    force.stop();
  }
}, true);

d3.select(window).on("resize", resize);


// d3.timer(function () {
//   dateNow = moment().valueOf();
//   ageNodesCheckQueue();
// });

setInterval (function () {
  dateNow = moment().valueOf();
  ageNodesCheckQueue();
}, 200 );
