/*jslint node: true */
"use strict";

var urlRoot = "http://word.threeceelabs.com/session?session=";
var nodesCreated = 0;
// var dateNow = Date.now();
var dateNow = (new Date).getTime();
var d3TimerCount = 1 ;

var currentSession;
var sessionMode = false;

var DEFAULT_AGE_RATE =  1.0;
var ageRate = DEFAULT_AGE_RATE ;
var nodeMaxAge = 60000 ;

var QUEUE_MAX = 200 ;

var defaultFadeDuration = 100 ;

var currentScale = 0.7 ;
var translate = [0,0] ;
var width = window.innerWidth * 1 ;
var height = window.innerHeight * 1 ;

var zoomWidth = (width - currentScale * width)/2  ;
var zoomHeight =  (height - currentScale * height)/2  ;

console.log("width: " + width + " | height: " + height);

var fullscreenFlag = false ;
var showStatsFlag = false ;
var pageLoadedTimeIntervalFlag = true;

var DEFAULT_MAX_AGE = 60000.0 ;

var DEFAULT_CHARGE = -5000;
var DEFAULT_GRAVITY = 0.1 ;
var DEFAULT_LINK_STRENGTH = 0.3 ;
var DEFAULT_FRICTION = 0.5;

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


var randomIntFromInterval = function (min,max) {
  var random = Math.random() ;
  var randomInt = Math.floor((random*(max-min+1))+min) ;
  return randomInt;
}

function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);

  displayInfoOverlay(1);
  displayControlOverlay(1);

  mouseMoveTimeout = setTimeout(function(){
    d3.select("body").style("cursor", "none");

    if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
      displayInfoOverlay(1e-6);
      displayControlOverlay(1e-6);
    }

    mouseMovingFlag = false ;
  }, mouseMoveTimeoutInterval);
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

  d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO ;
  d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO ;

  svgForceLayoutAreaWidth = d3LayoutWidth * FORCE_LAYOUT_WIDTH_RATIO ;
  svgForceLayoutAreaHeight = d3LayoutHeight * FORCE_LAYOUT_HEIGHT_RATIO ;

  svgcanvas.attr("width", SVGCANVAS_WIDTH_RATIO * width).attr("height", SVGCANVAS_HEIGHT_RATIO * height);

  svgForceLayoutArea.attr("width", svgForceLayoutAreaWidth).attr("height", svgForceLayoutAreaHeight);
  svgForceLayoutArea.attr("viewbox", 1e-6, 1e-6, d3LayoutWidth, d3LayoutHeight);
  svgForceLayoutArea.attr("x", 1e-6);
  svgForceLayoutArea.attr("y", 1e-6);

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

var socket = io();

socket.on("connect", function(){
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function(){
  console.log("*** DISCONNECTED FROM HOST");
});

var data = [] ;

// var fill = d3.scale.category10();
// var color = d3.scale.category10();
// var stroke = d3.scale.category10();

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
  force.stop();
  resetMouseMoveTimer();
}, true);


function getUrlVariables(config){

  var searchString = window.location.search.substring(1);
  var variableArray = searchString.split('&');

  for(var i = 0; i < variableArray.length; i++){
    var keyValuePair = variableArray[i].split('=');
    if (typeof keyValuePair[1] !== 'undefined'){
      // configHashMap.set(keyValuePair[0], keyValuePair[1]) ;
      console.log("'" + variableArray[i] + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);  
      if (keyValuePair[0] == 'monitor') {
        monitorMode = keyValuePair[1] ;
      }    
      if (keyValuePair[0] == 'session') {
        currentSession = keyValuePair[1] ;
        sessionMode = true ;
        socket.emit("GET_SESSION", currentSession);
      }    
    } 
    else {
      console.log("NO URL VARIABLES");      
      // configHashMap.set('monitor', false) ;
    }
  }
}



var mouseMoveTimeoutInterval = 1000; // 1 second

var mouseMoveTimeout = setTimeout(function(){
  d3.select("body").style("cursor", "none");
  if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
    displayInfoOverlay(1);
  }
  displayControlOverlay(1);
  mouseMovingFlag = false ;
}, mouseMoveTimeoutInterval);

function showInfo() {
  window.open("http://www.threeCeeMedia.com/", '_blank');
}

function launchSessionView(sessionId) {
  console.log("launchSessionView: " + sessionId);
  window.open(urlRoot + sessionId, 'SESSION VIEW', '_new');
}


function displayControlOverlay(opacity) {
  d3.select("#infoButton").style("opacity", opacity);
  d3.select("#statsToggleButton").style("opacity", opacity);
  d3.select("#fullscreenToggleButton").style("opacity", opacity);
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
var fontSizeScale =      d3.scale.log().domain([1,100000000]).range([1.5,15]);

var defaultRadiusScale = d3.scale.log().domain([1,10000000]).range([10,100]);
var defaultChargeScale =  d3.scale.log().domain([1,10000000]).range([-1000,-1500]);

function interpolateHsl(a, b) {
    var i = d3.interpolateString(a, b);
    return function(t) {
        return d3.hsl(i(t));
    }
}

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

var FORCE_LAYOUT_WIDTH_RATIO = 0.6;
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
  .attr("id", "svgcanvas")
  .attr("width", SVGCANVAS_WIDTH_RATIO * width)
  .attr("height", SVGCANVAS_HEIGHT_RATIO * height)
  .attr("x", 0)
  .attr("y", 0)
  .call(d3.behavior.zoom()
    .scale(currentScale)
    .scaleExtent([0.1, 10])
    .on("zoom", zoomHandler));

var zoomListener = d3.behavior.zoom()
  .scaleExtent([0.4, 4])
  .on("zoom", zoomHandler) ;

function zoomHandler() {
  svgForceLayoutArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

zoomListener.translate([zoomWidth,zoomHeight]).scale(currentScale);//translate and scale to whatever value you wish
zoomListener.event(svgcanvas.transition().duration(1000));//does a zoom

var svgForceLayoutArea = svgcanvas.append("g")
  .attr("id", "svgForceLayoutArea")
  .attr("width", svgForceLayoutAreaWidth)
  .attr("height", svgForceLayoutAreaHeight)
  .attr("viewbox", 1e-6, 1e-6, d3LayoutWidth, d3LayoutHeight)
  .attr("preserveAspectRatio", "none")
  .attr("x", 1e-6)
  .attr("y", 1e-6);

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
    .gravity(DEFAULT_GRAVITY)
    .friction(DEFAULT_FRICTION)
    .charge(DEFAULT_CHARGE)
    .linkStrength(DEFAULT_LINK_STRENGTH)
    .size([svgForceLayoutAreaWidth, svgForceLayoutAreaHeight])
    .on("tick", tick);

window.onload = function () {
  resize();
  displayInfoOverlay(1.0);
  getUrlVariables();

  setTimeout(function(){
    pageLoadedTimeIntervalFlag = false ;
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
      heartbeat["numberClients"] + " USERS"
      + " | " +  "SERVER HEARTBEAT: " + getTimeStamp(heartbeat["timeStamp"])
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


  for (var i=0; i<sessionObject.wordChain.length-1; i++) {

    var sessionUpdateObj = {};

    sessionUpdateObj.sessionId = sessionObject.sessionId;

    console.log("WORD: " + sessionObject.wordChain[i].nodeId);

    sessionUpdateObj.sourceWord = sessionObject.wordChain[i];
    sessionUpdateObj.targetWord = sessionObject.wordChain[i+1];

    sessionUpdateObj.sourceWord.lastSeen = moment();
    sessionUpdateObj.targetWord.lastSeen = moment();

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

  console.log("> RX SESSION\n" + jsonPrint(sessionObject));
  displaySession(sessionObject);

});

socket.on("SESSION_UPDATE", function(sessionObject){

  sessionObject.sourceWord.lastSeen = moment();
  sessionObject.targetWord.lastSeen = moment();

  // console.log("> RX " + JSON.stringify(sessionObject)); ;
  // console.log(getTimeStamp() + ">>> RX SESSION_UPDATE\n" + JSON.stringify(sessionObject, null, 3)) ;

  if (!windowVisible) {
    return ;
  }

  if (sessionMode && (sessionObject.sessionId !== currentSession)) {
    console.log("... SKIP SESSION_UPDATE: ID: " + sessionObject.sessionId + " | CURRENT SESSION: " + currentSession);
    return;
  }

  console.log("> RX | CL TYPE " + sessionObject.client.type 
    + " | " + sessionObject.sourceWord.nodeId 
    + " > " + sessionObject.targetWord.nodeId
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
    sessionUpdateQueue.enqueue(sessionObject);
    if (sessionUpdateQueue.getLength() > sessionUpdateQueueMaxInQ) { 
      sessionUpdateQueueMaxInQ = sessionUpdateQueue.getLength(); 
    }
  }
});


//=============================
// TICK
//=============================

function tick() {
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

var radius = height * 0.05;

function computeInitialPosition(index) {
  return { 
    // x: (Math.random() * nodeInitialX), 
    // y: (Math.random() * nodeInitialY) 
    x: (nodeInitialX + (radius * Math.cos(index * 0.1))), 
    y: (nodeInitialY - (radius * Math.sin(index * 0.1)))
    // x: nodeInitialX, 
    // y: nodeInitialY
  };
}

var nodesLength, nodeIndex = 0, chainIndex = 0 ;
var tempMentions ;

var createNode = function (sessionId, wordObject, callback) {


  console.log("createNode: SID: " + sessionId + " | " + wordObject.nodeId);

  var err = null ;
  var forceStopped = false ;

  force.stop();

  if (wordObject.nodeId in nodeHashMap) {

    var currentNodeObject = nodeHashMap[wordObject.nodeId];

    currentNodeObject.sessionId = sessionId ;
    currentNodeObject.age = moment() - wordObject.lastSeen;
    currentNodeObject.lastSeen = wordObject.lastSeen;
    currentNodeObject.mentions = wordObject.mentions ;
    currentNodeObject.text = wordObject.nodeId ;

    nodesLength = nodes.length ;

    for (nodeIndex = 0; nodeIndex < nodesLength; nodeIndex++){

      if (nodes[nodeIndex].nodeId == currentNodeObject.nodeId) { 

        tempMentions = nodes[nodeIndex].mentions;
        nodes[nodeIndex].mentions = currentNodeObject.mentions > tempMentions ? 
          currentNodeObject.mentions : tempMentions ;

        nodes[nodeIndex].age = moment() - currentNodeObject.lastSeen;
        nodes[nodeIndex].lastSeen = currentNodeObject.lastSeen;
        break;
      }
    }
  }
  else {

    nodesCreated++;
    newNodesFlag = true ;

    if ((typeof wordObject.mentions === 'undefined') || (wordObject.mentions == null)) {
      console.log("wordObject\n" + JSON.stringify(wordObject));
      wordObject.mentions = 1;
      console.log("wordObject\n" + JSON.stringify(wordObject));
    }

    wordObject.sessionId = sessionId;
    wordObject.age = moment() - wordObject.lastSeen ;
    wordObject.lastSeen = moment();
    wordObject.ageUpdated = moment();
    wordObject.text = wordObject.nodeId ;

    var initialPosition = computeInitialPosition(nodesCreated);

    wordObject.x = initialPosition.x ;
    wordObject.y = initialPosition.y ;

    nodeHashMap[wordObject.nodeId] = wordObject;
    nodes.push(wordObject);

    console.log(">>> ADDED NODE TO HASH MAP"
      + " | " + nodes.length 
      + " | " + wordObject.nodeId
      + " | MN: " + wordObject.mentions
      + " | x: " + wordObject.x
      + " | y: " + wordObject.y
      );
  }

  callback (null, newNodesFlag, deadNodesFlag);
}

var createLinks = function (sessionObject, callback) {

  var err = null ;
  newLinksFlag = false ;

  console.log("createLinks | " + sessionObject.sourceWord.nodeId + " > " + sessionObject.targetWord.nodeId);

  links.push({
    sessionId: sessionObject.sessionId,
    source: nodeHashMap[sessionObject.sourceWord.nodeId], 
    target: nodeHashMap[sessionObject.targetWord.nodeId], 
  });

  callback (null, newNodesFlag, deadNodesFlag);
}


var numberSessionsUpdated = 0 ;
var MAX_UPDATES_PER_CYCLE = 5 ;

var getNodeFromQueue = function (callback) {

  newNodesFlag = false ;
  deadNodesFlag = false ;

  // var dateNow = Date.now();

  //========================
  // CHECK QUEUE
  //========================

  numberSessionsUpdated = 0;

  // while ((numberSessionsUpdated < MAX_UPDATES_PER_CYCLE) && (sessionUpdateQueue.getLength() > 0)) {
  while (sessionUpdateQueue.getLength() > 0){
    numberSessionsUpdated++ ;
    // newNodesFlag = true ;

    if (sessionUpdateQueue.getLength() > QUEUE_MAX) {
      sessionUpdateQueue.dequeue();
    }

    var sessionObject = sessionUpdateQueue.dequeue();

    // sessionObject.lastSeen = dateNow;
    // sessionObject.age = 0;
    // sessionObject.ageUpdated = dateNow;

    createNode(sessionObject.sessionId, sessionObject.sourceWord, function(newNodesFlag, deadNodesFlag){
      createNode(sessionObject.sessionId, sessionObject.targetWord, function(newNodesFlag, deadNodesFlag){
        createLinks(sessionObject, function(newNodesFlag, deadNodesFlag){
        });
      });
    });

  }

  callback(null, newNodesFlag, deadNodesFlag);
}

var lastD3TimeCount = 0;
var ageNodes = function (newNodesFlag, deadNodesFlag, callback){

  // var localDateNow = Date.now()

  if (nodes.length === 0) {
    ageRate = DEFAULT_AGE_RATE ;
  }
  else if (nodes.length > 100) {
    ageRate = adjustedAgeRateScale(nodes.length-100);
  }
  else {
    ageRate = DEFAULT_AGE_RATE ;
  }

  var ageNodesLength = nodes.length-1 ;
  var ageNodesIndex = nodes.length-1 ;
  // var dateNow = Date.now();

  for (ageNodesIndex = ageNodesLength; ageNodesIndex>=0; ageNodesIndex--) {  

    var linkExists = false ;

    var currentNodeObject = {} ;

    currentNodeObject = nodes[ageNodesIndex];

    age = currentNodeObject.age + (ageRate * (moment() - currentNodeObject.ageUpdated));
    // var age = moment() - currentNodeObject.lastSeen;
    // age = currentNodeObject.age + ageRate * (d3TimerCount - lastD3TimeCount);
    // console.log(
    //   "id: " + currentNodeObject.nodeId
    //   + " | AGE: " + age
    //   + " | NOW: " + moment()
    //   + " | LS: " + currentNodeObject.lastSeen
    //   );

    if (age > nodeMaxAge) {

      deadNodesFlag = true ;

      // console.log("XXX DEAD NODE: " + nodeHashMap[currentNodeObject.nodeId].nodeId
      //   + " | AGE " + nodeHashMap[currentNodeObject.nodeId].age
      //   + " | LS " + nodeHashMap[currentNodeObject.nodeId].lastSeen
      //   + " | NOW " + dateNow
      //   );
      delete nodeHashMap[currentNodeObject.nodeId];

      var ageLinksLength = links.length-1;
      var ageLinksIndex = links.length-1;

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
    }
    else {

      currentNodeObject.age = age;
      currentNodeObject.ageUpdated = moment();

      nodes[ageNodesIndex].age = age;
      nodes[ageNodesIndex].ageUpdated = moment();

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
    .style('stroke', function(d){ return linkColorScale(d.target.age) ;})
    // .style('opacity', function(d){ return (nodeMaxAge - d.target.age) / nodeMaxAge; });
    .style('opacity', function(d){ return 1.0; });

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
    // .on("mouseover", nodeMouseover)
    // .on("mouseout", nodeMouseout)
    // .on("click", nodeClick)
    .attr("r", function(d) { 
      // console.log(d.nodeId + " | M: " + d.mentions);
      return defaultRadiusScale(d.mentions + 1); 
    })
    .style("visibility", "visible") 
    .style("fill", function(d) { return fillColorScale(d.age) ; })
    .style('stroke', function(d){ return strokeColorScale(d.age) ;})
    .style('opacity', function(d){
      // return (nodeMaxAge - d.age) / nodeMaxAge ;
      return 1.0 ;
    });

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
    .on("click", nodeClick)
    .call(force.drag)
    .attr("nodeId",function(d) { return d.nodeId;} )
    .attr("nodeType", function(d) { return d.nodeType; })
    .attr("lastSeen", function(d) { return d.lastSeen; })
    .attr("mentions", function(d) { return d.mentions; })
    .attr("nodeText", function(d) { return d.text; })
    .attr("r", function(d) { 
      // console.log(d.nodeId + " | M: " + d.mentions);
      return defaultRadiusScale(d.mentions + 1); 
    })
    .style("opacity", 1e-6)
    .style('stroke', function(d){ return strokeColorScale(d.age) ;})
    .style("stroke-width", 2.5)
    .style("fill", function(d) { return fillColorScale(d.age) ;})
    .transition()
      .duration(defaultFadeDuration)      
      .style('opacity', function(d){
        // return defaultOpacityAgeScale(d.age) ;
        return 1.0 ;
      });

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

  // console.log("ageNodesCheckQueue");

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
      
      // if (newNodesFlag || deadNodesFlag) {
      //   force.nodes(nodes);
      //   force.links(links);
      //   force.start(); 
      // }

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
  lastD3TimeCount = d3TimerCount ;
  d3TimerCount += 100 ;
  // console.log("d3TimerCount " + d3TimerCount + "| lastD3TimeCount: " + lastD3TimeCount);
  dateNow = parseInt((new Date).getTime());
  if (!mouseMovingFlag) ageNodesCheckQueue();
});
