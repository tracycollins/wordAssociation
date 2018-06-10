/*ver 0.47*/

/* jshint undef: true, unused: true */
/* globals ViewTreepack, clearTimeout, setTimeout, setInterval, window, document, console, store, io, requirejs, moment, HashMap, async, ProgressBar */

"use strict";

// var DEFAULT_SOURCE = "http://localhost:9997";
var DEFAULT_SOURCE = "https://word.threeceelabs.com";

var config = {};
var previousConfig = {};

config.displayNodeHashMap = {};
config.displayNodeHashMap.emoji = "show";
config.displayNodeHashMap.hashtag = "show";
config.displayNodeHashMap.place = "show";
config.displayNodeHashMap.url = "hide";
config.displayNodeHashMap.user = "show";
config.displayNodeHashMap.word = "hide";

const RX_NODE_QUEUE_INTERVAL = 10;
const RX_NODE_QUEUE_MAX = 100;

const STATS_UPDATE_INTERVAL = 1000;

var statsServerTimeElement;
var statsServerUpTimeElement;
var statsServerStartTimeElement;
var statsServerRunTimeElement;
var statsServerTweetsPerMinElement;
var statsServerMaxTweetsPerMinElement;
var statsClientNumberNodesElement;
var statsClientNumberMaxNodesElement;
var statsClientAddNodeQElement;
var statsClientMaxAddNodeQElement;
var statsClientAgeRateElement;
var statsClientMaxAgeRateElement;
var statsClientSessionIdElement;

function jp(s, obj) {
  console.warn(s + "\n" + jsonPrint(obj));
}

function jsonPrint(obj) {
  if ((obj) || (obj === 0)) {
    return JSON.stringify(obj, null, 2);
  } else {
    return "UNDEFINED";
  }
}

var randomIntFromInterval = function(min, max) {
  return (Math.floor((Math.random() * (max - min + 1)) + min));
};

var randomId = randomIntFromInterval(1000000000, 9999999999);
var VIEWER_ID = "viewer_" + randomId;
var USER_ID = "viewer_" + randomId;

var DEFAULT_VIEWER_OBJ = {
  nodeId: USER_ID,
  userId: USER_ID,
  viewerId: VIEWER_ID,
  screenName: USER_ID,
  type: "viewer",
  namespace: "view",
  timeStamp: moment().valueOf(),
  tags: {}
};

DEFAULT_VIEWER_OBJ.tags.type = "viewer";
DEFAULT_VIEWER_OBJ.tags.mode = "stream";
DEFAULT_VIEWER_OBJ.tags.entity = USER_ID;

var viewerObj = {};
viewerObj = DEFAULT_VIEWER_OBJ;

console.log("viewerObj\n" + jsonPrint(viewerObj));

var DEFAULT_AUTH_URL = "http://word.threeceelabs.com/auth/twitter";

var categoryTypes = ["left", "neutral", "right", "positive", "negative"];

var debug = true;

var twitterUserThreecee = {
    nodeId : "14607119",
    userId : "14607119",
    profileImageUrl : "http://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
    profileUrl : "http://twitter.com/threecee",
    url : "http://threeCeeMedia.com",
    name : "Tracy Collins",
    screenName : "threecee",
    nodeType : "user",
    following : null,
    description : "photography + animation + design",
    isTwitterUser : true,
    screenNameLower : "threecee",
    category: "left"
};

var PARENT_ID = "0047";

var storedConfigName;
var storedConfig;

var PAGE_LOAD_TIMEOUT = 1000;

var DEFAULT_FORCEVIEW_MODE = "web";
var DEFAULT_SESSION_VIEW = "treepack";

var useStoredConfig = false;
var globalStoredConfigName = "config_" + DEFAULT_SESSION_VIEW;

var enableUserNodes = true;

var d3;
var controlPanel;
var controlPanelWindow; 
var controlPanelFlag = false;

var statsTableFlag = false;

requirejs(["https://d3js.org/d3.v5.min.js"], function(d3Loaded) {
    console.log("d3 LOADED");
    d3 = d3Loaded;
    initialize(function(){

      PARENT_ID = config.sessionViewType;

      createStatsTable(function(){
        statsTableFlag = true;
      });
      addControlButton();
      addLoginButton();
      addFullscreenButton();
      addMetricButton();
      addStatsButton();
      addCategoryButton();

      resetMouseMoveTimer();
      
      document.addEventListener("mousemove", function() {
        if (currentSessionView) { 
          if (config.pauseOnMouseMove) {
            currentSessionView.simulationControl("PAUSE"); 
          }
          mouseMovingFlag = true;
          currentSessionView.mouseMoving(true);
          displayControl(true);
          resetMouseMoveTimer();
        }
      }, true);

    });
  },
  function(error) {
    console.log("REQUIREJS ERROR handler", error);
    console.log(error.requireModules && error.requireModules[0]);
    console.log(error.message);
  }
);

var currentGroup = {};
var currentSession = {};
var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var pageLoadedTimeIntervalFlag = true;

// var DEFAULT_BLAH_MODE = true;
var MAX_RX_QUEUE = 250;
// var MAX_WORDCHAIN_LENGTH = 100;

var DEFAULT_METRIC_MODE = "rate";
var DEFAULT_MAX_AGE = 60000;
// var FLOW_MAX_AGE = 20000;
// var FORCE_MAX_AGE = 60000;
// var HISTOGRAM_MAX_AGE = 60000;
var TREEMAP_MAX_AGE = 15000;
var TREEPACK_MAX_AGE = 15000;
// var MEDIA_MAX_AGE = 60000;

var DEFAULT_AGE_RATE = 1.0;

var DEFAULT_TRANSITION_DURATION = 40;
var DEFAULT_CHARGE = -50;
var DEFAULT_GRAVITY = 0.001;
var DEFAULT_FORCEX_MULTIPLIER = 25.0;
var DEFAULT_FORCEX_SESSION_MULTIPLIER = 50.0;
var DEFAULT_FORCEY_MULTIPLIER = 25.0;
var DEFAULT_NODE_RADIUS_MIN_RATIO = 0.0075;
var DEFAULT_NODE_RADIUS_MAX_RATIO = 0.1000;
var DEFAULT_VELOCITY_DECAY = 0.35;
var DEFAULT_LINK_DISTANCE = 100.0;
var DEFAULT_LINK_STRENGTH = 0.50;
var DEFAULT_COLLISION_RADIUS_MULTIPLIER = 1.0;
var DEFAULT_COLLISION_ITERATIONS = 1;
var DEFAULT_FONT_SIZE_MIN = 16;
var DEFAULT_FONT_SIZE_MAX = 60;

var DEFAULT_FONT_SIZE_MIN_RATIO = 0.01;
var DEFAULT_FONT_SIZE_MAX_RATIO = 0.025;
var DEFAULT_FONT_SIZE_TOPTERM_RATIO = 0.0225;

var DEFAULT_NODE_RADIUS = 20.0;

var TREEPACK_DEFAULT = {};
TREEPACK_DEFAULT.TRANSITION_DURATION = 50;
TREEPACK_DEFAULT.MAX_AGE = TREEPACK_MAX_AGE;
TREEPACK_DEFAULT.CHARGE = DEFAULT_CHARGE;
TREEPACK_DEFAULT.GRAVITY = 0.001;
TREEPACK_DEFAULT.FORCEX_MULTIPLIER = 0.01;
TREEPACK_DEFAULT.FORCEY_MULTIPLIER = 0.1;
TREEPACK_DEFAULT.VELOCITY_DECAY = 0.25;
TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER = 1;
TREEPACK_DEFAULT.COLLISION_ITERATIONS = 1;
TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO = 0.01;
TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO = 0.025;
TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO = 0.0075;
TREEPACK_DEFAULT.NODE_RADIUS_MAX_RATIO = 0.1000;


config.twitterUser = {};
config.twitterUser.userId = "";
config.fullscreenMode = false;

if (useStoredConfig) {
  console.debug("LOADING STORED CONFIG: " + globalStoredConfigName);
  config = store.get(globalStoredConfigName);
  config.fullscreenMode = false;
  config.pauseFlag = false;
  config.pauseOnMouseMove = true;
  if (config.authenticationUrl === undefined) {
    config.authenticationUrl = DEFAULT_AUTH_URL;
    config.twitterUser = {};
    config.twitterUser.userId = "";
  }
  if (config.twitterUser === undefined) {
    config.twitterUser = {};
    config.twitterUser.userId = "";
  }
  if (config.defaultNodeRadiusMinRatio === undefined) {
    config.defaultNodeRadiusMinRatio = DEFAULT_NODE_RADIUS_MIN_RATIO;
  }
  if (config.defaultNodeRadiusMaxRatio === undefined) {
    config.defaultNodeRadiusMaxRatio = DEFAULT_NODE_RADIUS_MAX_RATIO;
  }
}
else {
  config.authenticationUrl = DEFAULT_AUTH_URL;
  config.twitterUser = {};
  config.twitterUser.userId = "";
  config.autoCategoryFlag = false;
  config.metricMode = DEFAULT_METRIC_MODE;
  config.enableAgeNodes = true;
  config.defaultAgeRate = 1.0;
  config.forceViewMode = DEFAULT_FORCEVIEW_MODE;
  config.fullscreenMode = false;
  config.pauseOnMouseMove = true;
  config.showStatsFlag = false;
  config.pauseFlag = false;
  config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
  config.maxWords = 100;
  config.testMode = false;
  config.removeDeadNodesFlag = true;

  config.defaultTransitionDuration = DEFAULT_TRANSITION_DURATION;
  config.defaultMaxAge = DEFAULT_MAX_AGE;
  config.defaultMultiplier = 1000.0;
  config.defaultMetricMode = DEFAULT_METRIC_MODE;
  config.defaultCharge = DEFAULT_CHARGE;
  config.defaultGravity = DEFAULT_GRAVITY;
  config.defaultForceXmultiplier = DEFAULT_FORCEX_MULTIPLIER;
  config.defaultForceXsessionMultiplier = DEFAULT_FORCEX_SESSION_MULTIPLIER;
  config.defaultForceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
  config.defaultCollisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
  config.defaultCollisionIterations = DEFAULT_COLLISION_ITERATIONS;
  config.defaultLinkStrength = DEFAULT_LINK_STRENGTH;
  config.defaultLinkDistance = DEFAULT_LINK_DISTANCE;

  config.defaultNodeRadiusMinRatio = DEFAULT_NODE_RADIUS_MIN_RATIO;
  config.defaultNodeRadiusMaxRatio = DEFAULT_NODE_RADIUS_MAX_RATIO;
  config.defaultNodeRadius = DEFAULT_NODE_RADIUS;

  config.defaultVelocityDecay = DEFAULT_VELOCITY_DECAY;

  config.defaultFontSizeMinRatio = DEFAULT_FONT_SIZE_MIN_RATIO;
  config.defaultFontSizeMaxRatio = DEFAULT_FONT_SIZE_MAX_RATIO;
  config.defaultFontSizeTopTermRatio = DEFAULT_FONT_SIZE_TOPTERM_RATIO;

  if (config.sessionViewType === "ticker") {
    config.disableLinks = true;
  }
  else{
    config.disableLinks = false;
  }
}

var statsObj = {};
statsObj.isAuthenticated = false;
statsObj.socketId = 0;
statsObj.socketErrors = 0;
statsObj.maxNodes = 0;
statsObj.maxNodeAddQ = 0;
statsObj.serverConnected = false;

statsObj.heartbeat = {};
statsObj.heartbeat.tweetsPerMin = 0;
statsObj.heartbeat.maxTweetsPerMin = 0;
statsObj.heartbeat.nodesPerMin = 0;
statsObj.heartbeat.maxNodesPerMin = 0;
statsObj.heartbeat.serverTime = 0;
statsObj.heartbeat.startTime = 0;
statsObj.heartbeat.runTime = 0;
statsObj.heartbeat.upTime = 0;
statsObj.heartbeat.elapsed = 0;

statsObj.heartbeat.memory = {};

statsObj.heartbeat.nodesPerMin = 0;
statsObj.heartbeat.maxNodesPerMin = 0;
statsObj.heartbeat.maxNodesPerMinTime = 0;

statsObj.heartbeat.twitter = {};
statsObj.heartbeat.twitter.tweetsPerMin = 0;
statsObj.heartbeat.twitter.maxTweetsPerMin = 0;
statsObj.heartbeat.twitter.maxTweetsPerMinTime = 0;

var serverHeartbeatTimeout = 30000;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 10000;

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
  "green": "#25C286",
  "lightgreen": "#35F096",
  "yellowgreen": "#738A05"
};

var ignoreWordsArray = [
  "в",
  "e",
  "o",
  "del",
  "un",
  "en",
  "'",
  "-",
  "...",
  "a",
  "about",
  "across",
  "after",
  "all",
  "also",
  "an",
  "and",
  "ao",
  "aos",
  "applause",
  "are",
  "as",
  "at",
  "b",
  "be",
  "because",
  "been",
  "before",
  "being",
  "but",
  "by",
  "can",
  "can",
  "could",
  "could",
  "da",
  "day",
  "de",
  "did",
  "do",
  "dont",
  "e",
  "else",
  "em",
  "for",
  "from",
  "get",
  "go",
  "going",
  "had",
  "has",
  "hasnt",
  "have",
  "havent",
  "he",
  "her",
  "here",
  "him",
  "his",
  "how",
  "htt...",
  "i",
  "if",
  "im",
  "in",
  "into",
  "is",
  "isnt",
  "it",
  "its",
  "just",
  "less",
  "like",
  "lot",
  "m",
  "may",
  "me",
  "more",
  "my",
  "nas",
  "new",
  "no",
  "nos",
  "not",
  "of",
  "old",
  "on",
  "or",
  "os",
  "ou",
  "our",
  "out",
  "over",
  "rt",
  "s",
  "said",
  "say",
  "saying",
  "she",
  "should",
  "so",
  "some",
  "than",
  "that",
  "thats",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "though",
  "to",
  "too",
  "upon",
  "us",
  "ve",
  "want",
  "was",
  "wasnt",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "whose",
  "why",
  "will",
  "with",
  "wont",
  "would",
  "you",
  "your",
  "|",
  "é",
  "–"
];

ignoreWordsArray.push("'");
ignoreWordsArray.push("`");

var hashtagHashMap = new HashMap();



var ignoreWordHashMap = new HashMap();

var categoryColorHashMap = new HashMap();

categoryColorHashMap.set("positive", palette.green);
categoryColorHashMap.set("negative", palette.red);
categoryColorHashMap.set("neutral", palette.lightgray);

categoryColorHashMap.set("left", palette.blue);
categoryColorHashMap.set("right", palette.yellow);



var rxSessionUpdateQueue = [];
var rxSessionDeleteQueue = [];
var nodeCreateQueue = [];

var urlRoot = DEFAULT_SOURCE + "/session?session=";

var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

var socket = io("/view");

var milliseconds;
var seconds;
var minutes;
var hours;
var days;

function msToTime(duration) {
  milliseconds = parseInt((duration % 1000) / 1000);
  seconds = parseInt((duration / 1000) % 60);
  minutes = parseInt((duration / (1000 * 60)) % 60);
  hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

function saveConfig(){
  storedConfigName = "config_" + config.sessionViewType;
  store.set(storedConfigName, config);
  console.debug("STORED CONFIG"
    + " | " + storedConfigName
    + "\n" + jsonPrint(store.get(storedConfigName))
  );
}

var controlDivElement = document.getElementById("controlDiv");
var topTermsDivElement = document.getElementById("topTermsDiv");
var statsDivElement = document.getElementById("statsDiv");

function displayControl(isVisible) {
  controlDivElement.style.visibility = (isVisible) ? "visible" : "hidden";
  topTermsDivElement.style.visibility = (isVisible) ? "visible" : "hidden";
}

function displayStats(isVisible, dColor) {
  statsDivElement.style.visibility = (isVisible) ? "visible" : "hidden";
  if (dColor !== undefined) {statsDivElement.style.color = dColor;}
}

var mouseMoveTimeoutEventObj = new CustomEvent("mouseMoveTimeoutEvent");
var mouseMoveTimeout;
var mouseMovingFlag = false;
var mouseMoveTimeoutInterval = 2000;

function resetMouseMoveTimer() {

  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function() {

    mouseMovingFlag = false;
    displayControl(false);

    d3.select("body").style("cursor", "none");

    currentSessionView.toolTipVisibility(false);
    currentSessionView.mouseMoving(false);

    if (config.pauseOnMouseMove && !config.pauseFlag) { 
      currentSessionView.simulationControl("RESUME"); 
    }

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayStats(false, palette.white);
    }

    document.dispatchEvent(mouseMoveTimeoutEventObj);

  }, mouseMoveTimeoutInterval);
}

var serverActiveTimeoutEventObj = new CustomEvent("serverActiveTimeoutEvent");
var serverActiveTimeout;
var serverActiveFlag = false;
var serverActiveTimeoutInterval = 1000;

function resetServerActiveTimer() {

  serverActiveFlag = true;
  if (currentSessionView !== undefined) { currentSessionView.setEnableAgeNodes(true); }

  clearTimeout(serverActiveTimeout);

  serverActiveTimeout = setTimeout(function() {

    serverActiveFlag = false;
    if (currentSessionView !== undefined) { currentSessionView.setEnableAgeNodes(false); }

    document.dispatchEvent(serverActiveTimeoutEventObj);

  }, serverActiveTimeoutInterval);
}

// document.addEventListener("dragEnd", function(e) {
//   console.log("DRAG END: " + jsonPrint(dragEndPosition));
//   if (sessionHashMap.has(dragEndPosition.id)){
//     var dragSession = sessionHashMap.get(dragEndPosition.id);
//     dragSession.initialPosition.x = dragEndPosition.x;
//     dragSession.initialPosition.y = dragEndPosition.y;
//     dragSession.node.px = dragEndPosition.x;
//     dragSession.node.py = dragEndPosition.y;
//     sessionHashMap.set(dragSession.nodeId, dragSession);
//     nodeHashMap.set(dragSession.node.nodeId, dragSession.node);
//     // console.error("dragSession\n" + jsonPrint(dragSession));
//   }
// });

// var sessionDragEndEvent = new CustomEvent(
//   "dragEnd", { 
//     "detail": dragEndPosition
//   } 
// );

window.onbeforeunload = function() {
  if (controlPanelFlag) { controlPanelWindow.close(); }
  controlPanelFlag = false;
};

function toggleControlPanel(){

  // var cnf = config;

  console.warn("toggleControlPanel config\n" + jsonPrint(config));

  if (controlPanelFlag){
    controlPanelWindow.close();
    controlPanelFlag = false;
    controlPanelReadyFlag = false;
    updateControlButton(controlPanelFlag);
    console.debug("toggleControlPanel: " + controlPanelFlag);
  }
  else {

    var controlPanelInitWaitInterval;

    createPopUpControlPanel(config, function(){

      console.warn("createPopUpControlPanel toggleControlPanel: " + controlPanelFlag);

      controlPanelInitWaitInterval = setInterval(function(){
        if (controlPanelReadyFlag) {
          clearInterval(controlPanelInitWaitInterval);
          updateControlButton(controlPanelFlag);
          console.debug("TX> CONTROL PANEL INIT | SOURCE: " + DEFAULT_SOURCE);
          controlPanelWindow.postMessage({op: "INIT", config: config}, DEFAULT_SOURCE);
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: twitterUserThreecee}, DEFAULT_SOURCE);
        }
      }, 500);

    });
  }
}

function updateControlButton(controlPanelFlag){
  // var cpButtonElement = document.getElementById("controlPanelButton");
  document.getElementById("controlPanelButton").innerHTML = controlPanelFlag ? "HIDE CONTROL" : "SHOW CONTROL";
}

function addControlButton(){
  controlDivElement.style.visibility = "hidden";
  var controlPanelButton = document.createElement("BUTTON");
  controlPanelButton.className = "button";
  controlPanelButton.setAttribute("id", "controlPanelButton");
  controlPanelButton.setAttribute("onclick", "toggleControlPanel()");
  controlPanelButton.innerHTML = controlPanelFlag ? "HIDE CONTROL" : "SHOW CONTROL";
  controlDivElement.appendChild(controlPanelButton);
}

function addStatsText(){
  var statsText = document.createTextNode("STATS");
  statsDivElement.appendChild(statsText);
}

function updateStatsText(statsText){
  statsDivElement.innerHTML = statsText;
}

function addCategoryButton(){
  var categoryButton = document.createElement("BUTTON");
  categoryButton.className = "button";
  categoryButton.setAttribute("id", "categoryButton");
  categoryButton.setAttribute("onclick", "toggleCategory()");
  categoryButton.innerHTML = config.autoCategoryFlag ? "AUTO CATEGORY" : "MANUAL CATEGORY";
  controlDivElement.appendChild(categoryButton);
}

function updateCategoryButton(){
  document.getElementById("categoryButton").innerHTML = config.autoCategoryFlag ? "AUTO CATEGORY" : "MANUAL CATEGORY";
}

function addStatsButton(){
  var statsButton = document.createElement("BUTTON");
  statsButton.className = "button";
  statsButton.setAttribute("id", "statsButton");
  statsButton.setAttribute("onclick", "toggleStats()");
  statsButton.innerHTML = config.showStats ? "HIDE STATS" : "SHOW STATS";
  controlDivElement.appendChild(statsButton);
}

var statsButtonElement = document.getElementById("statsButton");

function updateStatsButton(){
  statsButtonElement.innerHTML = config.showStatsFlag ? "HIDE STATS" : "SHOW STATS";
}

function updateMetricButton(){
  document.getElementById("metricButton").innerHTML = config.metricMode.toUpperCase() + " RADIUS";
}

function addMetricButton(){
  var metricButton = document.createElement("BUTTON");
  if (config.metricMode === undefined) { config.metricMode = "rate"; }
  metricButton.className = "button";
  metricButton.setAttribute("id", "metricButton");
  metricButton.setAttribute("onclick", "toggleMetric()");
  metricButton.innerHTML = config.metricMode.toUpperCase() + " RADIUS";
  controlDivElement.appendChild(metricButton);
}

function updateLoginButton(){
  document.getElementById("loginButton").innerHTML = statsObj.isAuthenticated ? "LOG OUT" : "LOG IN";
}

socket.on("unauthorized", function(response) {
  statsObj.isAuthenticated = false;
  console.log("UNAUTHORIZED | " + socket.id + " | " + jsonPrint(response));
});

socket.on("authenticated", function() {
  console.log("AUTHENTICATED | " + socket.id);
  statsObj.isAuthenticated = true;
  console.log( "CONNECTED TO HOST" 
    + " | ID: " + socket.id 
  );
});

function login() {
  console.warn("LOGIN: AUTH: " + statsObj.isAuthenticated + " | URL: " + config.authenticationUrl);
  window.open(config.authenticationUrl, "LOGIN", "_new");
  socket.emit("login", viewerObj);
}

function addLoginButton(){
  var loginButton = document.createElement("BUTTON");
  loginButton.className = "button";
  loginButton.setAttribute("id", "loginButton");
  loginButton.setAttribute("onclick", "login()");
  loginButton.innerHTML = statsObj.isAuthenticated ? "LOG OUT" : "LOG IN";
  controlDivElement.appendChild(loginButton);
}

function updateFullscreenButton(){
  document.getElementById("fullscreenButton").innerHTML = config.fullscreenMode ? "EXIT FULLSCREEN" : "FULLSCREEN";
}

function addFullscreenButton(){
  var fullscreenButton = document.createElement("BUTTON");
  fullscreenButton.className = "button";
  fullscreenButton.setAttribute("id", "fullscreenButton");
  fullscreenButton.setAttribute("onclick", "toggleFullScreen()");
  fullscreenButton.innerHTML = config.fullscreenMode ? "EXIT FULLSCREEN" : "FULLSCREEN";
  controlDivElement.appendChild(fullscreenButton);
}

var configUpdateTimeOut;
var configUpdateTimeOutInverval = 3000;

function resetConfigUpdateTimeOut() {

  storedConfigName = "config_" + config.sessionViewType;

  clearTimeout(configUpdateTimeOut);

  configUpdateTimeOut = setTimeout(function() {

    console.debug("STORE CONFIG\n" + jsonPrint(config));
    saveConfig();

  }, configUpdateTimeOutInverval);
}

function controlPanelComm(event) {

  console.debug("CONTROL PANEL: " + event.origin); // prints: { message: "Hello world!"} 

  if (event.data === "DisableHTML5Autoplay_Initialize") {
    console.info("RX> CONTROL PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ...");
    return;
  }

  switch (event.data.op) {
    case "READY" :
      console.warn("R< CONTROL PANEL READY");
      controlPanelReadyFlag = true;
    break;
    case "FOLLOW" :
      console.warn("R< CONTROL FOLLOW"
        + " | UID: " + event.data.user.userId
        + " | @" + event.data.user.screenName
      );
      socket.emit("TWITTER_FOLLOW", event.data.user);
    break;
    case "NODE_SEARCH" :
      console.warn("R< CONTROL NODE_SEARCH\n" + jsonPrint(event.data.input));
      socket.emit("TWITTER_SEARCH_NODE", event.data.input);
    break;
    case "CLOSE" :
      console.warn("R< CONTROL PANEL CLOSING...");
    break;
    case "MOMENT" :
      console.warn("R< CONTROL PANEL MOMENT...");
      switch (event.data.id) {
        case "resetButton" :
          reset();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN MOMENT BUTTON");
      }
    break;
    case "TOGGLE" :
      console.warn("R< CONTROL PANEL TOGGLE");
      switch (event.data.id) {
        case "metricToggleButton" :
          toggleMetric();
        break;
        case "fullscreenToggleButton" :
          toggleFullScreen();
        break;
        case "pauseToggleButton" :
          togglePause();
        break;
        case "statsToggleButton" :
          toggleStats();
        break;
        case "testModeToggleButton" :
          toggleTestMode();
        break;
        case "removeDeadNodeToogleButton" :
          toggleRemoveDeadNode();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN TOGGLE BUTTON");
      }
      resetConfigUpdateTimeOut();
    break;
    case "UPDATE" :
      console.warn("R< CONTROL PANEL UPDATE");
      switch (event.data.id) {
        case "transitionDurationSlider" :
          currentSessionView.updateTransitionDuration(event.data.value);
          config.defaultTransitionDuration = event.data.value;
        break;
        case "velocityDecaySlider" :
          currentSessionView.updateVelocityDecay(event.data.value);
        break;
        case "gravitySlider" :
          currentSessionView.updateGravity(event.data.value);
        break;
        case "chargeSlider" :
          currentSessionView.updateCharge(event.data.value);
        break;
        case "maxAgeSlider" :
          currentSessionView.setNodeMaxAge(event.data.value);
        break;
        case "fontSizeMinRatioSlider" :
          currentSessionView.updateFontSizeMinRatio(event.data.value);
        break;
        case "fontSizeMaxRatioSlider" :
          currentSessionView.updateFontSizeMaxRatio(event.data.value);
        break;
        case "nodeRadiusMinRatioSlider" :
          currentSessionView.updateNodeRadiusMinRatio(event.data.value);
        break;
        case "nodeRadiusMaxRatioSlider" :
          currentSessionView.updateNodeRadiusMaxRatio(event.data.value);
        break;
        default:
          console.error("UNKNOWN CONTROL PANEL ID: " + event.data.id + "\n" + jsonPrint(event.data));
      }
      resetConfigUpdateTimeOut();
    break;
    case "INIT":
      console.info("R< CONTROL PANEL LOOPBACK? | INIT ... IGNORING ...");
      break;
    case "CATEGORIZE":
      if (statsObj.isAuthenticated) {

        if (event.data.node.nodeType === "user"){
          console.info("R< CONTROL PANEL CATEGORIZE"
            + " | " + event.data.node.nodeId
            + " | @" + event.data.node.screenName
            + " | C: " + event.data.category
          );
          socket.emit("TWITTER_CATEGORIZE_NODE", 
            { twitterUser: config.twitterUser,
            category: event.data.category,
            node: event.data.node}
          );
        }
        else if (event.data.node.nodeType === "hashtag"){
          console.info("R< CONTROL PANEL CATEGORIZE"
            + " | #" + event.data.node.nodeId
            + " | C: " + event.data.category
          );
          socket.emit("TWITTER_CATEGORIZE_NODE", 
            { twitterUser: config.twitterUser,
            category: event.data.category,
            node: event.data.node}
          );
        }
      }
      else {
        window.open(config.authenticationUrl, "_blank");
      }
    break;
    case "SET_TWITTER_USER":
      // console.info("R< CONTROL PANEL LOOPBACK? | SET_TWITTER_USER ... IGNORING ...");
    break;
    case "SET_TWITTER_HASHTAG":
      // console.info("R< CONTROL PANEL LOOPBACK? | SET_TWITTER_HASHTAG ... IGNORING ...");
    break;

    case "DISPLAY_NODE_TYPE":
      config.displayNodeHashMap[event.data.nodeType] = event.data.value;
      console.warn("R<DISPLAY_NODE_TYPE | " + event.data.nodeType + " | " + event.data.value);
      console.warn("config.displayNodeHashMap\n" + jsonPrint(config.displayNodeHashMap));
      resetConfigUpdateTimeOut();
    break;

    default :
      if (event.data["twttr.button"] !== undefined){
        console.log("R< CONTROL PANEL TWITTER" 
          + " | " + event.data["twttr.button"].method
        );
      }
      else if (event.data.settings !== undefined){
        console.log("R< CONTROL PANEL SETTINGS" 
          + "\n" + jsonPrint(event.data.settings)
        );
      }
      else {
        console.warn("R< ??? CONTROL PANEL OP UNDEFINED\n" + jsonPrint(event.data));
      }
  }
}

var controlPanelReadyFlag = false;

function createPopUpControlPanel (cnf, callback) {

  console.debug("createPopUpControlPanel\ncnf\n" + jsonPrint(cnf));

  controlPanelWindow = window.open(
    "controlPanel.html", 
    "CONTROL",
    "width=800,height=600"
  );

  controlPanelWindow.addEventListener("message", controlPanelComm, false);
  window.addEventListener("message", controlPanelComm, false);

  controlPanelWindow.addEventListener("beforeunload", function(){
    console.log("CONTROL POP UP CLOSING...");
    controlPanelFlag = false;
    updateControlButton(controlPanelFlag);
  }, false);

  controlPanelWindow.addEventListener("load", function(cnf){
    controlPanel = new controlPanelWindow.ControlPanel(cnf);
    controlPanelFlag = true;
    callback(controlPanelWindow);
  }, false);
}

function toggleMetric() {
  if (config.metricMode === "rate") { config.metricMode = "mentions"; }
  else { config.metricMode = "rate"; }
  currentSessionView.setMetricMode(config.metricMode);
  console.warn("SET RADIUS MODE: " + config.metricMode);
  updateMetricButton();
  if (controlPanelFlag) { controlPanel.updateControlPanel(config); }
}

function togglePause() {
  config.pauseFlag = !config.pauseFlag;
  currentSessionView.setPause(config.pauseFlag);
  console.warn("TOGGLE PAUSE: " + config.pauseFlag);
  controlPanel.updateControlPanel(config);
}

function toggleRemoveDeadNode() {
  config.removeDeadNodesFlag = !config.removeDeadNodesFlag;
  currentSessionView.setRemoveDeadNodesFlag(config.removeDeadNodesFlag);
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.removeDeadNodesFlag);
  controlPanel.updateControlPanel(config);
}

function toggleCategory() {
  config.autoCategoryFlag = !config.autoCategoryFlag;
  currentSessionView.setAutoCategoryFlag(config.autoCategoryFlag);
  console.warn("AUTO CATEGORY: " + config.autoCategoryFlag);

  updateCategoryButton();
  if (controlPanelFlag) { controlPanel.updateControlPanel(config); }
}

function toggleStats() {
  config.showStatsFlag = !config.showStatsFlag;
  console.warn("TOGGLE STATS: " + config.showStatsFlag);

  if (config.showStatsFlag) { displayStats(config.showStatsFlag); }
  else { displayStats(false, palette.white); }

  if (statsButtonElement) { updateStatsButton(); }
  if (controlPanelFlag) { controlPanel.updateControlPanel(config); }
}

function toggleTestMode() {
  config.testMode = !config.testMode;
  config.testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + config.testModeEnabled);
  currentSessionView.setTestMode(config.testModeEnabled);
  controlPanel.updateControlPanel(config);
}

var initialPosition;
function computeInitialPosition() {
  initialPosition = {
    x: randomIntFromInterval(0.95 * currentSessionView.getWidth(), 1.0 * currentSessionView.getWidth()),
    y: randomIntFromInterval(0.3 * currentSessionView.getHeight(), 0.7 * currentSessionView.getHeight())
  };

  if (!initialPosition.x || !initialPosition.y) {
    console.error("POS " + jsonPrint(initialPosition));
  }
  return initialPosition;
}

var keysForSortedKeys = [];
function getSortedKeys(hmap, sortProperty) {
  // var keys = [];
  hmap.forEach(function(value, key) {
    if (!value.isSessionNode) { keysForSortedKeys.push(key); }
  });
  return keysForSortedKeys.sort(function(a, b) {
    return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty];
  });
}

var optionsTimeStamp = {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit"
};

var currentDate;
var currentTime;

function getTimeStamp(inputTime) {

  if (inputTime === undefined) {
    currentDate = new Date().toDateString("en-US", optionsTimeStamp);
    currentTime = new Date().toTimeString("en-US", optionsTimeStamp);
  } 
  else {
    currentDate = new Date(inputTime).toDateString("en-US", optionsTimeStamp);
    currentTime = new Date(inputTime).toTimeString("en-US", optionsTimeStamp);
  }
  return currentDate + " - " + currentTime;
}

function getBrowserPrefix() {
  // Check for the unprefixed property.
  // if ("hidden" in document) {
  if (document.hidden !== undefined) {
    return null;
  }
  // All the possible prefixes.
  var browserPrefixes = ["moz", "ms", "o", "webkit"];
  var prefix;

  browserPrefixes.forEach(function(p) {
    prefix = p + "Hidden";
    if (document[prefix] !== undefined) {
      return p;
    }
  });

  // The API is not supported in browser.
  return null;
}

function hiddenProperty(prefix) {
  if (prefix) { return prefix + "Hidden"; } 
  else { return "hidden"; }
}

function getVisibilityEvent(prefix) {
  if (prefix) {return prefix + "visibilitychange"; } 
  else { return "visibilitychange"; }
}

socket.on("SERVER_READY", function(serverAck) {
  console.log("RX SERVER_READY | SERVER ACK: " + jsonPrint(serverAck));
});

socket.on("VIEWER_READY_ACK", function(vSesKey) {

  statsObj.serverConnected = true;

  console.log("RX VIEWER_READY_ACK | SESSION KEY: " + vSesKey);

  statsObj.viewerSessionKey = vSesKey;
  viewerObj.viewerSessionKey = vSesKey;

  if (config.VIEWER_OBJ === undefined) {
    config.VIEWER_OBJ = {};
  }

  config.VIEWER_OBJ = viewerObj;

  console.debug("STORE CONFIG ON VIEWER_READY_ACK\n" + jsonPrint(config));
  saveConfig();

  if (!config.pauseFlag) {
    currentSessionView.simulationControl("RESUME");
  }
});

socket.on("reconnect", function() {
  viewerObj.socketId = socket.id;
  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

  viewerObj.timeStamp = moment().valueOf();

  socket.emit("authentication", viewerObj);

});

socket.on("connect", function() {
  viewerObj.socketId = socket.id;

  socket.emit("authentication", viewerObj);
  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  if (currentSessionView !== undefined) { currentSessionView.setEnableAgeNodes(true); }
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function() {
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  if (currentSessionView !== undefined) { currentSessionView.setEnableAgeNodes(false); }
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  if (currentSessionView !== undefined) { currentSessionView.resize(); }
});

socket.on("error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors += 1;
  console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET ERROR\n" + error);
  if (currentSessionView !== undefined) { currentSessionView.resize(); }
});

socket.on("connect_error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors += 1;
  console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET CONNECT ERROR\n" + error);
  if (currentSessionView !== undefined) { currentSessionView.resize(); }
});

socket.on("reconnect_error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors += 1;
  console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET RECONNECT ERROR\n" + error);
  if (currentSessionView !== undefined) { currentSessionView.resize(); }
});


var windowVisible = true;

document.title = "Word Association";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityEvent = getVisibilityEvent(prefix);

function reset(){
  windowVisible = true;
  if (currentSessionView !== undefined) { 
    currentSessionView.simulationControl("RESET");
    currentSessionView.resetDefaultForce();
    currentSessionView.simulationControl("START");
  }
}

window.addEventListener("resize", function() { currentSessionView.resize(); });

document.addEventListener(visibilityEvent, function() {
  if (!document[hidden]) {
    windowVisible = true;
    resetMouseMoveTimer();
    if (currentSessionView !== undefined) { currentSessionView.setPause(false); }
    console.info("visibilityEvent: " + windowVisible);
  } 
  else {
    windowVisible = false;
    if (currentSessionView !== undefined) { currentSessionView.setPause(true); }
    console.info("visibilityEvent: " + windowVisible);
  }
});

function getUrlVariables(callbackMain) {

  var urlSessionId;
  var urlNamespace;
  var sessionType;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split("&");

  var asyncTasks = [];

  variableArray.forEach(

    function(variable) {

      asyncTasks.push(function(callback2) {

        var keyValuePair = variable.split("=");

        if ((keyValuePair[0] !== "") && (keyValuePair[1] !== undefined)) {
          console.log(variable + " >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);
          if (keyValuePair[0] === "monitor") {
            monitorMode = keyValuePair[1];
            console.log("MONITOR MODE | monitorMode: " + monitorMode);
            return (callback2(null, {
              monitorMode: monitorMode
            }));
          }
          if (keyValuePair[0] === "session") {
            urlSessionId = keyValuePair[1];
            console.log("SESSION MODE | urlSessionId: " + urlSessionId);
            return (callback2(null, {
              sessionMode: true,
              sessionId: urlSessionId
            }));
          }
          if (keyValuePair[0] === "nsp") {
            urlNamespace = keyValuePair[1];
            console.log("namespace: " + urlNamespace);
            return (callback2(null, {
              namespace: urlNamespace
            }));
          }
          if (keyValuePair[0] === "type") {
            sessionType = keyValuePair[1];
            console.log("SESSION TYPE | sessionType: " + sessionType);
            return (callback2(null, {
              sessionType: sessionType
            }));
          }
          if (keyValuePair[0] === "viewtype") {
            config.sessionViewType = keyValuePair[1];
            console.info("SESSION VIEW TYPE | sessionViewType: " + config.sessionViewType);
            return (callback2(null, {
              sessionViewType: config.sessionViewType
            }));
          }
        } else {
          console.log("NO URL VARIABLES");
          return (callback2(null, []));
        }
      });
    }
  );

  async.parallel(asyncTasks, function(err, results) {
    var urlConfig = {};

    // results is an array of objs:  results = [ {key0: val0}, ... {keyN: valN} ];
    async.each(results, function(urlVarObj, cb1) {

      console.log("urlVarObj\n" + jsonPrint(urlVarObj));

      var urlVarKeys = Object.keys(urlVarObj);

      async.each(urlVarKeys, function(key, cb2) {
        urlConfig[key] = urlVarObj[key];
        console.log("key: " + key + " > urlVarObj[key]: " + urlVarObj[key]);
        cb2();
      }, function(err) {
        cb1();
      });

    }, function(err) {
      callbackMain(err, urlConfig);
    });

  });
}

var globalLinkIndex = 0;

function generateLinkId() {
  globalLinkIndex += 1;
  return "LNK" + globalLinkIndex;
}

var tableRow;
var tableHead;
var tableCell;
var tableButton;
var tableSlider;
var tdTextColor;
var tdBgColor;

function tableCreateRow(parentTable, options, cells) {

  tableRow = parentTable.insertRow();
  tdTextColor = options.textColor;
  tdBgColor = options.backgroundColor || "#222222";

  if (options.trClass) {
    tableRow.className = options.trClass;
  }

  if (options.headerFlag) {
    cells.forEach(function(content) {
      tableHead = tableRow.insertCell();
      tableHead.appendChild(document.createTextNode(content));
      tableHead.style.color = tdTextColor;
      tableHead.style.backgroundColor = tdBgColor;
    });
  } 
  else {
    cells.forEach(function(content) {
      tableCell = tableRow.insertCell();
      if (content.type === undefined) {
        tableCell.appendChild(document.createTextNode(content));
        tableCell.style.color = tdTextColor;
        tableCell.style.backgroundColor = tdBgColor;
      } 
      else if (content.type === "TEXT") {
        tableCell.className = content.class;
        tableCell.setAttribute("id", content.id);
        tableCell.style.color = tdTextColor;
        tableCell.style.backgroundColor = tdBgColor;
        tableCell.innerHTML = content.text;
      } 
      else if (content.type === "BUTTON") {
        tableButton = document.createElement("BUTTON");
        tableButton.className = content.class;
        tableButton.setAttribute("id", content.id);
        tableButton.setAttribute("mode", content.mode);
        tableButton.addEventListener("click", function(e){ buttonHandler(e); }, false);
        tableButton.innerHTML = content.text;
        tableCell.appendChild(tableButton);
        // controlIdHash[content.id] = content;
      } 
      else if (content.type === "SLIDER") {
        tableSlider = document.createElement("INPUT");
        tableSlider.type = "range";
        tableSlider.className = content.class;
        tableSlider.setAttribute("id", content.id);
        tableSlider.setAttribute("min", content.min);
        tableSlider.setAttribute("max", content.max);
        tableSlider.setAttribute("multiplier", content.multiplier);
        tableSlider.setAttribute("oninput", content.oninput);
        tableSlider.value = content.value;
        tableCell.appendChild(tableSlider);
        // controlIdHash[content.id] = content;
      }
    });
  }
}

function createStatsTable(callback) {

  console.log("CREATE STATS TABLE");

  statsDivElement.style.visibility = "hidden";
  statsDivElement.style.border = "2px solid black ";
  statsDivElement.style.backgroundColor = palette.white;
  statsDivElement.style.textColor = palette.black;
  var statsTableServer = document.createElement("TABLE");
  var statsTableClient = document.createElement("TABLE");
  var br = document.createElement("br");

  statsTableServer.className = "table";
  statsTableServer.setAttribute("id", "statsTableServer");
  statsTableServer.style.border = "1px solid black ";

  statsDivElement.appendChild(statsTableServer);
  statsDivElement.appendChild(br);

  statsTableClient.className = "table";
  statsTableClient.setAttribute("id", "statsTableClient");
  statsDivElement.appendChild(statsTableClient);

  var optionsHead = {
    headerFlag: true,
    textColor: palette.black,
    backgroundColor: palette.white
  };

  var optionsBody = {
    headerFlag: false,
    textColor: palette.black,
    border: "2px solid red",
    backgroundColor: palette.white
  };

  var statsClientSessionIdLabel = {
    type: "TEXT",
    id: "statsClientSessionIdLabel",
    class: "statsTableText",
    text: "SESSION"
  };

  var statsClientSessionId = {
    type: "TEXT",
    id: "statsClientSessionId",
    class: "statsTableText",
    text: statsObj.socketId
  };

  var statsClientNumberNodesLabel = {
    type: "TEXT",
    id: "statsClientNumberNodesLabel",
    class: "statsTableText",
    text: "NODES"
  };

  var statsClientNumberNodes = {
    type: "TEXT",
    id: "statsClientNumberNodes",
    class: "statsTableText",
    text: "---"
  };

  var statsClientNumberMaxNodesLabel = {
    type: "TEXT",
    id: "statsClientNumberMaxNodesLabel",
    class: "statsTableText",
    text: "MAX"
  };

  var statsClientNumberMaxNodes = {
    type: "TEXT",
    id: "statsClientNumberMaxNodes",
    class: "statsTableText",
    text: "---"
  };

  var statsClientAddNodeQLabel = {
    type: "TEXT",
    id: "statsClientAddNodeQLabel",
    class: "statsTableText",
    text: "NODE ADD Q"
  };

  var statsClientAddNodeQ = {
    type: "TEXT",
    id: "statsClientAddNodeQ",
    class: "statsTableText",
    text: "---"
  };

  var statsClientAgeRateLabel = {
    type: "TEXT",
    id: "statsClientAgeRateLabel",
    class: "statsTableText",
    text: "AGE RATE"
  };

  var statsClientAgeRate = {
    type: "TEXT",
    id: "statsClientAgeRate",
    class: "statsTableText",
    text: "---"
  };

  var statsClientMaxAgeRateLabel = {
    type: "TEXT",
    id: "statsClientMaxAgeRateLabel",
    class: "statsTableText",
    text: "MAX"
  };

  var statsClientMaxAgeRate = {
    type: "TEXT",
    id: "statsClientMaxAgeRate",
    class: "statsTableText",
    text: "---"
  };

  var statsClientMaxAddNodeQLabel = {
    type: "TEXT",
    id: "statsClientMaxAddNodeQLabel",
    class: "statsTableText",
    text: "MAX"
  };

  var statsClientMaxAddNodeQ = {
    type: "TEXT",
    id: "statsClientMaxAddNodeQ",
    class: "statsTableText",
    text: "---"
  };

  var statsServerTimeLabel = {
    type: "TEXT",
    id: "statsServerTimeLabel",
    class: "statsTableText",
    text: "TIME"
  };

  var statsServerTime = {
    type: "TEXT",
    id: "statsServerTime",
    class: "statsTableText",
    text: moment(parseInt(statsObj.heartbeat.serverTime)).format(defaultDateTimeFormat)
  };

  var statsServerUpTimeLabel = {
    type: "TEXT",
    id: "statsServerTimeLabel",
    class: "statsTableText",
    text: "UPTIME"
  };

  var statsServerUpTime = {
    type: "TEXT",
    id: "statsServerUpTime",
    class: "statsTableText",
    text: moment(parseInt(statsObj.heartbeat.upTime)).format(defaultDateTimeFormat)
  };

  var statsServerStartTimeLabel = {
    type: "TEXT",
    id: "statsServerStartTimeLabel",
    class: "statsTableText",
    text: "START"
  };

  var statsServerStartTime = {
    type: "TEXT",
    id: "statsServerStartTime",
    class: "statsTableText",
    text: moment(parseInt(statsObj.heartbeat.startTime)).format(defaultDateTimeFormat)
  };

  var statsServerRunTimeLabel = {
    type: "TEXT",
    id: "statsServerRunTimeLabel",
    class: "statsTableText",
    text: "RUN TIME"
  };

  var statsServerRunTime = {
    type: "TEXT",
    id: "statsServerRunTime",
    class: "statsTableText",
    text: msToTime(statsObj.heartbeat.runTime)
  };

  var statsServerTweetsPerMinLabel = {
    type: "TEXT",
    id: "statsServerTweetsPerMinLabel",
    class: "statsTableText",
    text: "TWEETS/MIN"
  };

  var statsServerTweetsPerMin = {
    type: "TEXT",
    id: "statsServerTweetsPerMin",
    class: "statsTableText",
    text: "0.00"
  };

  var statsServerMaxTweetsPerMinLabel = {
    type: "TEXT",
    id: "statsServerMaxTweetsPerMinLabel",
    class: "statsTableText",
    text: "MAX"
  };

  var statsServerMaxTweetsPerMin = {
    type: "TEXT",
    id: "statsServerMaxTweetsPerMin",
    class: "statsTableText",
    text: "---"
  };

  tableCreateRow(statsTableServer, optionsHead, ["SERVER"]);
  tableCreateRow(statsTableServer, optionsBody, [statsServerTimeLabel, statsServerTime]);
  tableCreateRow(statsTableServer, optionsBody, [statsServerUpTimeLabel, statsServerUpTime]);
  tableCreateRow(statsTableServer, optionsBody, [statsServerStartTimeLabel, statsServerStartTime]);
  tableCreateRow(statsTableServer, optionsBody, [statsServerRunTimeLabel, statsServerRunTime]);
  tableCreateRow(statsTableServer, optionsBody, [statsServerTweetsPerMinLabel, statsServerTweetsPerMin, statsServerMaxTweetsPerMinLabel, statsServerMaxTweetsPerMin]);
  tableCreateRow(statsTableClient, optionsHead, ["CLIENT"]);
  tableCreateRow(statsTableClient, optionsBody, [statsClientSessionIdLabel, statsClientSessionId]);
  tableCreateRow(statsTableClient, optionsBody, [statsClientNumberNodesLabel, statsClientNumberNodes, statsClientNumberMaxNodesLabel, statsClientNumberMaxNodes]);
  tableCreateRow(statsTableClient, optionsBody, [statsClientAgeRateLabel, statsClientAgeRate, statsClientMaxAgeRateLabel, statsClientMaxAgeRate]);
  tableCreateRow(statsTableClient, optionsBody, [statsClientAddNodeQLabel, statsClientAddNodeQ, statsClientMaxAddNodeQLabel, statsClientMaxAddNodeQ]);
  
  statsServerTimeElement = document.getElementById("statsServerTime");
  statsServerUpTimeElement = document.getElementById("statsServerUpTime");
  statsServerStartTimeElement = document.getElementById("statsServerStartTime");
  statsServerRunTimeElement = document.getElementById("statsServerRunTime");
  statsServerTweetsPerMinElement = document.getElementById("statsServerTweetsPerMin");
  statsServerMaxTweetsPerMinElement = document.getElementById("statsServerMaxTweetsPerMin");
  statsClientNumberNodesElement = document.getElementById("statsClientNumberNodes");
  statsClientNumberMaxNodesElement = document.getElementById("statsClientNumberMaxNodes");
  statsClientAddNodeQElement = document.getElementById("statsClientAddNodeQ");
  statsClientMaxAddNodeQElement = document.getElementById("statsClientMaxAddNodeQ");
  statsClientAgeRateElement = document.getElementById("statsClientAgeRate");
  statsClientMaxAgeRateElement = document.getElementById("statsClientMaxAgeRate");
  statsClientSessionIdElement = document.getElementById("statsClientSessionId");

  if (callback) { callback(); }
}

//  STATS UPDATE
function initStatsUpdate(interval){
  setInterval(function() {
    if (statsTableFlag) { updateStatsTable(statsObj); }
  }, interval);
}

//  KEEPALIVE
setInterval(function() {
  if (statsObj.serverConnected) {
    socket.emit("SESSION_KEEPALIVE", viewerObj);
  }
}, serverKeepaliveInteval);

var lastHeartbeatReceived = 0;

// CHECK FOR SERVER HEARTBEAT
setInterval(function() {
  if (!statsObj.serverConnected) {
    console.error("\n????? SERVER DOWN ????? | | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(moment().valueOf() - lastHeartbeatReceived));
    socket.connect();
    if (currentSessionView !== undefined) {
      currentSessionView.setEnableAgeNodes(false);
    }
  }
  else if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.error("\n????? SERVER DOWN ????? | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(moment().valueOf() - lastHeartbeatReceived));
    socket.connect();
    if (currentSessionView !== undefined) {
      currentSessionView.setEnableAgeNodes(false);
    }
  }
  else {
    currentSessionView.setEnableAgeNodes(true);
  }
}, serverCheckInterval);

function updateStatsTable(statsObj){
  statsServerTimeElement.innerHTML = moment(statsObj.heartbeat.timeStamp).format(defaultDateTimeFormat);
  statsServerUpTimeElement.innerHTML = msToTime(statsObj.heartbeat.upTime);
  statsServerStartTimeElement.innerHTML = moment(statsObj.heartbeat.startTime).format(defaultDateTimeFormat);
  statsServerRunTimeElement.innerHTML = msToTime(statsObj.heartbeat.runTime);
  statsServerTweetsPerMinElement.innerHTML = statsObj.heartbeat.twitter.tweetsPerMin.toFixed(0);
  statsServerMaxTweetsPerMinElement.innerHTML = statsObj.heartbeat.twitter.maxTweetsPerMin.toFixed(0);
  statsClientNumberNodesElement.innerHTML = currentSessionView.getNodesLength();
  statsClientNumberMaxNodesElement.innerHTML = currentSessionView.getMaxNodes();
  statsClientAddNodeQElement.innerHTML = currentSessionView.getNodeAddQlength();
  statsClientMaxAddNodeQElement.innerHTML = currentSessionView.getMaxNodeAddQ();
  statsClientAgeRateElement.innerHTML = currentSessionView.getAgeRate().toFixed(2);
  statsClientMaxAgeRateElement.innerHTML = currentSessionView.getMaxAgeRate().toFixed(2);

  if (statsObj.serverConnected) {
    statsClientSessionIdElement.innerHTML = statsObj.socketId;
  }
  else {
    statsClientSessionIdElement.innerHTML = "*** CANNOT CONNECT TO SERVER ***";
  }
}

var heartBeatsReceived = 0;

socket.on("HEARTBEAT", function(heartbeat) {

  resetServerActiveTimer();

  statsObj.maxNodes = ( currentSessionView === undefined) ? 0 : currentSessionView.getMaxNodes();
  statsObj.maxNodeAddQ = ( currentSessionView === undefined) ? 0 : currentSessionView.getMaxNodeAddQ();

  statsObj.heartbeat = heartbeat;

  heartBeatsReceived += 1;
  statsObj.serverConnected = true;
  lastHeartbeatReceived = moment().valueOf();
});

socket.on("CONFIG_CHANGE", function(rxConfig) {

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" 
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");

  if (rxConfig.testMode !== undefined) {
    config.testMode = rxConfig.testMode;
    console.log("\n*** ENV CHANGE: TEST_MODE:  WAS: " 
      + previousConfig.testMode + " | NOW: " + config.testMode + "\n");
    previousConfig.testMode = config.testMode;
  }

  if (rxConfig.testSendInterval !== undefined) {
    config.testSendInterval = rxConfig.testSendInterval;
    console.log("\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " 
      + previousConfig.testSendInterval + " | NOW: " + config.testSendInterval + "\n");
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if (rxConfig.nodeMaxAge !== undefined) {
    config.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log("\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " 
      + previousConfig.nodeMaxAge + " | NOW: " + config.nodeMaxAge + "\n");
    // nodeMaxAge = config.nodeMaxAge;
    currentSessionView.setMaxAge(rxConfig.nodeMaxAge);
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }
});

socket.on("SET_TWITTER_USER", function(twitterUser) {

  if (!twitterUser) { return; }
  if (!twitterUser || (twitterUser.notFound !== undefined)) {

    console.log("SET_TWITTER_USER | NOT FOUND" 
      + " | @" + twitterUser.screenName 
    );
    
    currentSessionView.setTwitterUser(twitterUser);
    return;
  }

  console.log("SET_TWITTER_USER" 
    + " | " + twitterUser.nodeId 
    + " | @" + twitterUser.screenName 
    + " | CR: " + twitterUser.createdAt 
    + " | FLWRs: " + twitterUser.followersCount 
    + " | FRNDs: " + twitterUser.friendsCount 
    + " | Ts: " + twitterUser.statusesCount 
    + " | Ms: " + twitterUser.mentions 
    + " | C: " + twitterUser.category
    + " | CA: " + twitterUser.categoryAuto
  );

  if (twitterUser.nodeId === twitterUserThreecee.nodeId) {
    twitterUserThreecee = twitterUser;
    config.twitterUser = twitterUser;
  }

  currentSessionView.setTwitterUser(twitterUser);
});

socket.on("SET_TWITTER_HASHTAG", function(twitterHashtag) {

  console.log("SET_TWITTER_HASHTAG" 
    + " | " + twitterHashtag.hashtagId 
    + " | #" + twitterHashtag.text 
    + " | C: " + twitterHashtag.category
    + " | CA: " + twitterHashtag.categoryAuto
  );

  currentSessionView.setTwitterHashtag(twitterHashtag);
});

socket.on("TWITTER_TOPTERM_1MIN", function(top10obj) {
  console.debug("TWITTER_TOPTERM_1MIN\n" + jsonPrint(top10obj));
});

var rxNodeQueueReady = false;
var rxNodeQueue = [];

var rxNode = function(node){
  if ((rxNodeQueue.length < RX_NODE_QUEUE_MAX)
  ){
    if (config.displayNodeHashMap[node.nodeType] === "show") {
      rxNodeQueue.push(node);
    }
  }
};

function initSocketSessionUpdateRx(){

  socket.on("node", rxNode);

  rxNodeQueueReady = true;

  var newNode = {};

  setInterval(function(){

    if (rxNodeQueueReady && (rxNodeQueue.length > 0)) {

      rxNodeQueueReady = false;

      newNode = rxNodeQueue.shift();

      var category;
      if (config.autoCategoryFlag &&  newNode.categoryAuto){
        category = newNode.categoryAuto;
      }
      else {
        category = newNode.category;
      }

      if (category === undefined) { 
        newNode.categoryColor = palette.white; 
      }
      else {
        newNode.categoryColor = categoryColorHashMap.get(category);
      }
 
      newNode.age = 1e-6;
      newNode.ageMaxRatio = 1e-6;
      newNode.mouseHoverFlag = false;
      newNode.isDead = false;
      newNode.r = 0;
      newNode.links = [];
      newNode.mentions = (newNode.mentions) ? newNode.mentions : 1;

      if (newNode.nodeType === "user"){
        newNode.userId = newNode.userId;
        newNode.nodeId = newNode.userId;
        newNode.text = newNode.screenName.toLowerCase();
        newNode.screenName = newNode.screenName.toLowerCase();
      }
      if (newNode.nodeType === "hashtag"){
        newNode.nodeId = newNode.text;
      }

      newNode.categoryMismatch = newNode.category && newNode.categoryAuto && (newNode.category !== newNode.categoryAuto);
      newNode.categoryMatch = newNode.category && newNode.categoryAuto && (newNode.category === newNode.categoryAuto);

      if (((config.sessionViewType === "treemap") || (config.sessionViewType === "treepack"))
        && ((newNode.nodeType !== "user") || (enableUserNodes && (newNode.nodeType === "user")))) {
        currentSessionView.addNode(newNode);
      }
      else if ((config.sessionViewType === "histogram")
        && ((newNode.nodeType !== "user") || (enableUserNodes && (newNode.nodeType === "user")))) {
        currentSessionView.addNode(newNode);
      }
      else if ((config.sessionViewType !== "treemap") 
        && (config.sessionViewType !== "treepack") 
        && (config.sessionViewType !== "histogram")) {
        currentSessionView.addNode(newNode);
      }
      rxNodeQueueReady = true;

    }
  }, RX_NODE_QUEUE_INTERVAL);

  // socket.on("STATS_HASHTAG", function(htStatsObj){
  //     console.log(">>> RX STATS_HASHTAG");

  //     var htObjArray = [];

  //     Object.keys(htStatsObj).forEach(function(key) {
  //       if (htStatsObj.hasOwnProperty(key)) {

  //         var htObj = htStatsObj[key];
  //         var mntns = htObj.mentions.toString() ;
  //         var numPadSpaces = 10 - mntns.length;
  //         htObj.displaytext = new Array(numPadSpaces).join("xa0") + mntns + " " + key ;
  //         htObj.barlabel = key ;

  //         getTimeNow(function(t){
  //           htObj.seen = t ;
  //           htObj.topHashtag = true ;
  //           htObj.newFlag = false ;
  //           htObjArray.push(htObj);
  //           hashtagHashMap.set(key, htObj);
  //         });
  //       }
  //     });
  // });
}

//================================
// GET NODES FROM QUEUE
//================================

function sum( obj ) {

  var s = 0;
  var props = Object.keys(obj);

  async.each(props, function(prop, cb) {

    if( obj.hasOwnProperty(prop) ) {
      s += parseFloat( obj[prop] );
    }
    cb();

  }, function(){
    return s;
  });
}

var randomNumber360 = 180;

function toggleFullScreen() {

  console.warn("toggleFullScreen");

  if (!document.fullscreenElement &&
    !document.mozFullScreenElement && 
    !document.webkitFullscreenElement && 
    !document.msFullscreenElement) {

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } 
  else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

requirejs.onError = function(err) {
  console.error("*** REQUIRE ERROR\n" + err);
  if (err.requireType === "timeout") {
    console.log("modules: " + err.requireModules);
  }
  throw err;
};

function loadViewType(svt, callback) {

  console.log("LOADING SESSION VIEW TYPE: " + svt);

  storedConfigName = "config_" + svt;
  storedConfig = store.get(storedConfigName);

  if (storedConfig) {
    console.debug("STORED CONFIG"
      + " | " + storedConfigName
      + "\nCURRENT CONFIG\n" + jsonPrint(config)
      + "\nSTORED CONFIG\n" + jsonPrint(storedConfig)
    );

    var storedConfigArgs = Object.keys(storedConfig);

    storedConfigArgs.forEach(function(arg){
      config[arg] = storedConfig[arg];
      if (arg === "VIEWER_OBJ") {
      }
      console.log("--> STORED CONFIG | " + arg + ": ", config[arg]);
    });
  }

  config.sessionViewType = "treepack";
  requirejs(["js/libs/sessionViewTreepack"], function() {
    console.debug("sessionViewTreepack LOADED");
    DEFAULT_TRANSITION_DURATION = TREEPACK_DEFAULT.TRANSITION_DURATION;
    DEFAULT_MAX_AGE = TREEPACK_DEFAULT.MAX_AGE;
    DEFAULT_COLLISION_RADIUS_MULTIPLIER = TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
    DEFAULT_COLLISION_ITERATIONS = TREEPACK_DEFAULT.COLLISION_ITERATIONS;
    DEFAULT_CHARGE = TREEPACK_DEFAULT.CHARGE;
    DEFAULT_GRAVITY = TREEPACK_DEFAULT.GRAVITY;
    DEFAULT_NODE_RADIUS_MIN_RATIO = TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO;
    DEFAULT_NODE_RADIUS_MAX_RATIO = TREEPACK_DEFAULT.NODE_RADIUS_MAX_RATIO;
    DEFAULT_VELOCITY_DECAY = TREEPACK_DEFAULT.VELOCITY_DECAY;
    DEFAULT_FORCEX_MULTIPLIER = TREEPACK_DEFAULT.FORCEX_MULTIPLIER;
    DEFAULT_FORCEY_MULTIPLIER = TREEPACK_DEFAULT.FORCEY_MULTIPLIER;
    DEFAULT_FONT_SIZE_MIN_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO;
    DEFAULT_FONT_SIZE_MAX_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO;

    currentSessionView = new ViewTreepack();
    initSocketSessionUpdateRx();

    callback();
  });
}

function onFullScreenChange() {
  var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
  // if in fullscreen mode fullscreenElement wont be null
  currentSessionView.resize();
  config.fullscreenMode = (fullscreenElement) ? true : false;
  console.log("FULLSCREEN: " + config.fullscreenMode);
  updateFullscreenButton();
}

var loginCallBack = function(data) {
  console.warn("LOGIN CALLBACK\n" + jsonPrint(data));
};

function initialize(callback) {

  console.log("INITIALIZE ...");

  document.addEventListener("fullscreenchange", onFullScreenChange, false);
  document.addEventListener("webkitfullscreenchange", onFullScreenChange, false);
  document.addEventListener("mozfullscreenchange", onFullScreenChange, false);


  getUrlVariables(function(err, urlVariablesObj) {

    // document.dispatchEvent(sessionDragEndEvent);

    console.log("URL VARS\n" + jsonPrint(urlVariablesObj));

    if (!err) {

      console.log("ON LOAD getUrlVariables\n" + jsonPrint(urlVariablesObj));

      if (urlVariablesObj !== undefined) {
        if (urlVariablesObj.sessionId) {
          sessionId = urlVariablesObj.sessionId;
        }
        if (urlVariablesObj.namespace) {
          namespace = urlVariablesObj.namespace;
        }
        if (urlVariablesObj.sessionViewType) {

          config.sessionViewType = urlVariablesObj.sessionViewType;

          console.log("ON LOAD getUrlVariables: sessionViewType:" + config.sessionViewType);

          loadViewType(config.sessionViewType, function() {

            console.warn("SESSION VIEW TYPE: " + config.sessionViewType);
            currentSessionView.resize();

            storedConfigName = "config_" + config.sessionViewType;
            storedConfig = store.get(storedConfigName);

            if (storedConfig) {

              console.debug("STORED CONFIG"
                + " | " + storedConfigName
                + "\nCURRENT CONFIG\n" + jsonPrint(config)
                + "\n" + jsonPrint(storedConfig)
              );

              var storedConfigArgs = Object.keys(storedConfig);

              storedConfigArgs.forEach(function(arg){
                config[arg] = storedConfig[arg];
                if (arg === "VIEWER_OBJ") {
                }
                console.log("--> STORED CONFIG | " + arg + ": ", config[arg]);
              });

              config.authenticationUrl = DEFAULT_AUTH_URL;

              if (config.sessionViewType === "treepack") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
            }
            else {
              console.debug("STORED CONFIG NOT FOUND: " + storedConfigName);

              if (config.sessionViewType === "treepack") {
                // initUpdateSessionsInterval(50);
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
              }
            }

            currentSessionView.initD3timer();

            initStatsUpdate(STATS_UPDATE_INTERVAL);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

            viewerObj.timeStamp = moment().valueOf();
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) { displayStats(false, palette.white); }
            }, PAGE_LOAD_TIMEOUT);

            callback();
          });
        }
        else {

          console.warn("DEFAULT_SESSION_VIEW: " + DEFAULT_SESSION_VIEW);

          config.sessionViewType = DEFAULT_SESSION_VIEW;

          loadViewType(config.sessionViewType, function() {

            storedConfigName = "config_" + config.sessionViewType;
            storedConfig = store.get(storedConfigName);

            if (storedConfig) {

              console.debug("STORED CONFIG"
                + " | " + storedConfigName
                + "\nCURRENT CONFIG\n" + jsonPrint(config)
                + "\n" + jsonPrint(storedConfig)
              );

              var storedConfigArgs = Object.keys(storedConfig);

              storedConfigArgs.forEach(function(arg){
                config[arg] = storedConfig[arg];
                if (arg === "VIEWER_OBJ") {
                }
                console.log("--> STORED CONFIG | " + arg + ": ", config[arg]);
              });

              config.authenticationUrl = DEFAULT_AUTH_URL;
              currentSessionView.setNodeMaxAge(config.defaultMaxAge);
            }
            else {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }

            currentSessionView.simulationControl("START");
            currentSessionView.resize();

            initStatsUpdate(STATS_UPDATE_INTERVAL);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

            viewerObj.timeStamp = moment().valueOf();
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) {displayStats(false, palette.white);}
            }, PAGE_LOAD_TIMEOUT);

            callback();

          });
        }
      } 
      else {

        console.warn("DEFAULT_SESSION_VIEW *");

        config.sessionViewType = DEFAULT_SESSION_VIEW;

        loadViewType(config.sessionViewType, function() {

            storedConfigName = "config_" + config.sessionViewType;
            storedConfig = store.get(storedConfigName);

            if (storedConfig) {

              console.debug("STORED CONFIG"
                + " | " + storedConfigName
                + "\nCURRENT CONFIG\n" + jsonPrint(config)
                + "\n" + jsonPrint(storedConfig)
              );

              var storedConfigArgs = Object.keys(storedConfig);

              storedConfigArgs.forEach(function(arg){
                config[arg] = storedConfig[arg];
                if (arg === "VIEWER_OBJ") {
                }
                console.log("--> STORED CONFIG | " + arg + ": ", config[arg]);
              });

              config.authenticationUrl = DEFAULT_AUTH_URL;

              currentSessionView.setNodeMaxAge(config.defaultMaxAge);
            }
            else {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initStatsUpdate(STATS_UPDATE_INTERVAL);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

          viewerObj.timeStamp = moment().valueOf();
          socket.emit("VIEWER_READY", viewerObj);

          setTimeout(function() {
            console.error("END PAGE LOAD TIMEOUT");
            pageLoadedTimeIntervalFlag = false;
            if (!config.showStatsFlag) { displayStats(false, palette.white); }
          }, PAGE_LOAD_TIMEOUT);
        });

        callback();
      }
    } 
    else {
      console.error("GET URL VARIABLES ERROR\n" + jsonPrint(err));
      callback(err);
    }
  });
}