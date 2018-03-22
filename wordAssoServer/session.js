/*ver 0.47*/
/*jslint node: true */
"use strict";

// var DEFAULT_SOURCE = "http://localhost:9997";
var DEFAULT_SOURCE = "http://word.threeceelabs.com";
// var DEFAULT_SOURCE = "==SOURCE==";  // will be updated by wordAssoServer.js on app.get

const RX_NODE_QUEUE_INTERVAL = 10;
const RX_NODE_QUEUE_MAX = 100;

function jp(s, obj) {
  console.warn(s + "\n" + jsonPrint(obj));
}

function jsonPrint(obj) {
  if ((obj) || (obj === 0)) {
    var jsonString = JSON.stringify(obj, null, 2);
    return jsonString;
  } else {
    return "UNDEFINED";
  }
}

var randomIntFromInterval = function(min, max) {
  var random = Math.random();
  var randomInt = Math.floor((random * (max - min + 1)) + min);
  return randomInt;
};

var randomId = randomIntFromInterval(1000000000, 9999999999);
var VIEWER_ID = "viewer_random_" + randomId;
var USER_ID = "viewer_random_" + randomId;

var DEFAULT_VIEWER_OBJ = {
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
    userId : "14607119",
    profileImageUrl : "http://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
    profileUrl : "http://twitter.com/threecee",
    url : "http://threeCeeMedia.com",
    name : "Tracy Collins",
    screenName : "threecee",
    nodeId : "14607119",
    nodeType : "user",
    following : null,
    description : "photography + animation + design",
    isTwitterUser : true,
    screenNameLower : "threecee"
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

// requirejs(["https://cdnjs.cloudflare.com/ajax/libs/d3/4.8.0/d3.min.js"], function(d3Loaded) {
requirejs(["https://d3js.org/d3.v4.min.js"], function(d3Loaded) {
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
    var failedId = error.requireModules && error.requireModules[0];
    console.log(failedId);
    console.log(error.message);
  }
);

var currentGroup = {};
var currentSession = {};
var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var pageLoadedTimeIntervalFlag = true;

var DEFAULT_BLAH_MODE = true;
var MAX_RX_QUEUE = 250;
var MAX_WORDCHAIN_LENGTH = 100;

var DEFAULT_METRIC_MODE = "rate";
var DEFAULT_MAX_AGE = 60000;
var FLOW_MAX_AGE = 20000;
var FORCE_MAX_AGE = 60000;
var HISTOGRAM_MAX_AGE = 60000;
var TREEMAP_MAX_AGE = 15000;
var TREEPACK_MAX_AGE = 15000;
var MEDIA_MAX_AGE = 60000;

var DEFAULT_AGE_RATE = 1.0;

var DEFAULT_TRANSITION_DURATION = 40;
var DEFAULT_CHARGE = -15;
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
var DEFAULT_FONT_SIZE_TOPTERM_RATIO = 0.02;

var DEFAULT_NODE_RADIUS = 20.0;

var TREEMAPVIEW_DEFAULT = {};
TREEMAPVIEW_DEFAULT.MAX_AGE = TREEMAP_MAX_AGE;

var HISTOGRAMVIEW_DEFAULT = {};
HISTOGRAMVIEW_DEFAULT.MAX_AGE = HISTOGRAM_MAX_AGE;

var FLOW_DEFAULT = {};
FLOW_DEFAULT.MAX_AGE = FLOW_MAX_AGE;
FLOW_DEFAULT.CHARGE = -10.0;
FLOW_DEFAULT.GRAVITY = 0.01;
FLOW_DEFAULT.FORCEX_MULTIPLIER = 0.5;
FLOW_DEFAULT.FORCEX_SESSION_MULTIPLIER = 5;
FLOW_DEFAULT.FORCEY_MULTIPLIER = 0.5;
FLOW_DEFAULT.VELOCITY_DECAY = 0.85;
FLOW_DEFAULT.COLLISION_RADIUS_MULTIPLIER = 0.4;
FLOW_DEFAULT.COLLISION_ITERATIONS = 1;
FLOW_DEFAULT.FONT_SIZE_MIN = 16;
FLOW_DEFAULT.FONT_SIZE_MAX = 60;
FLOW_DEFAULT.NODE_RADIUS_MIN_RATIO = 0.0075;

var FORCEVIEW_DEFAULT = {};
FORCEVIEW_DEFAULT.MAX_AGE = FORCE_MAX_AGE;
FORCEVIEW_DEFAULT.CHARGE = -400;
FORCEVIEW_DEFAULT.GRAVITY = 0.1;
FORCEVIEW_DEFAULT.FORCEY_MULTIPLIER = 1.0;
FORCEVIEW_DEFAULT.VELOCITY_DECAY = 0.75;
FORCEVIEW_DEFAULT.LINK_DISTANCE = 5;
FORCEVIEW_DEFAULT.LINK_STRENGTH = 0.95;
FORCEVIEW_DEFAULT.COLLISION_RADIUS_MULTIPLIER = 2.50;
FORCEVIEW_DEFAULT.COLLISION_ITERATIONS = 1;
FORCEVIEW_DEFAULT.NODE_RADIUS_MIN_RATIO = 0.0075;

var TREEPACK_DEFAULT = {};
TREEPACK_DEFAULT.TRANSITION_DURATION = 50;
TREEPACK_DEFAULT.MAX_AGE = TREEPACK_MAX_AGE;
TREEPACK_DEFAULT.CHARGE = -50.0;
TREEPACK_DEFAULT.GRAVITY = 0.001;
TREEPACK_DEFAULT.FORCEX_MULTIPLIER = 0.01;
TREEPACK_DEFAULT.FORCEY_MULTIPLIER = 0.1;
TREEPACK_DEFAULT.VELOCITY_DECAY = 0.25;
TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER = 1;
TREEPACK_DEFAULT.COLLISION_ITERATIONS = 1;
TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO = 0.01;
TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO = 0.025;
TREEPACK_DEFAULT.NODE_RADIUS_MIN_RATIO = 0.0075;

var MEDIAVIEW_DEFAULT = {};
MEDIAVIEW_DEFAULT.MAX_AGE = MEDIA_MAX_AGE;
MEDIAVIEW_DEFAULT.CHARGE = -400;
MEDIAVIEW_DEFAULT.GRAVITY = 0.1;
MEDIAVIEW_DEFAULT.FORCEY_MULTIPLIER = 1.0;
MEDIAVIEW_DEFAULT.VELOCITY_DECAY = 0.75;
MEDIAVIEW_DEFAULT.LINK_DISTANCE = 5;
MEDIAVIEW_DEFAULT.LINK_STRENGTH = 0.95;
MEDIAVIEW_DEFAULT.COLLISION_RADIUS_MULTIPLIER = 2.50;
MEDIAVIEW_DEFAULT.COLLISION_ITERATIONS = 1;
MEDIAVIEW_DEFAULT.NODE_RADIUS_MIN_RATIO = 0.0075;
MEDIAVIEW_DEFAULT.NODE_RADIUS_MAX_RATIO = 0.1000;

var config = {};

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
    // config.authenticationUrl = "http://localhost:9997/auth/twitter";
    config.twitterUser = {};
    config.twitterUser.userId = "";
  }
  if (config.twitterUser === undefined) {
    config.twitterUser = {};
    config.twitterUser.userId = "";
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
  config.blahMode = DEFAULT_BLAH_MODE;
  config.antonymFlag = false;
  config.pauseFlag = false;
  config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
  config.maxWords = 100;
  config.testMode = false;
  config.removeDeadNodesFlag = true;

  config.defaultTransitionDuration = DEFAULT_TRANSITION_DURATION;
  config.defaultMaxAge = DEFAULT_MAX_AGE;
  config.defaultMultiplier = 1000.0;
  config.defaultMetricMode = DEFAULT_METRIC_MODE;
  config.defaultBlahMode = DEFAULT_BLAH_MODE;
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
statsObj.socketId = null;
statsObj.socketErrors = 0;
statsObj.maxNodes = 0;
statsObj.maxNodeAddQ = 0;
statsObj.heartbeat = {};
statsObj.heartbeat.wordsPerMin = 0;
statsObj.heartbeat.maxWordsPerMin = 0;
statsObj.serverConnected = false;

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

var groupHashMap = new HashMap();
var groupDeleteHashMap = new HashMap();

// var maxSessions = 0;
var sessionHashMap = new HashMap();
var sessionDeleteHashMap = new HashMap();

var linkHashMap = new HashMap();
var nodeHashMap = new HashMap();

var ignoreWordHashMap = new HashMap();

var categoryColorHashMap = new HashMap();

categoryColorHashMap.set("positive", palette.green);
categoryColorHashMap.set("negative", palette.red);
categoryColorHashMap.set("neutral", palette.lightgray);

categoryColorHashMap.set("left", palette.blue);
categoryColorHashMap.set("right", palette.yellow);


var rxSessionUpdateQueue = [];
var rxSessionDeleteQueue = [];

var groupCreateQueue = [];
var groupsCreated = 0;

var sessionCreateQueue = [];
var sessionsCreated = 0;

var nodeCreateQueue = [];
var linkCreateQueue = [];

var groupDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.
var nodeDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.
var linkDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.

var urlRoot = DEFAULT_SOURCE + "/session?session=";

var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

var maxHashtagRows = 25;
var maxPlaceRows = 25;
var maxHashtagBarRows = 100;

var tweetNodeQueue = [];
var tweetNodeQueueMaxInQ = 0;
var tweetNodeQueueMaxLength = 500 ;

var hashtagNodeQueue = [];
var hashtagNodeQueueMaxInQ = 0;
var hashtagNodeQueueMaxLength = 500 ;
var hashtagHashMap = nodeHashMap.hashtag;
var maxRecentHashtags = maxHashtagRows ;
var hashtagArray = [] ;
var recentHashtagArray = [] ;
var hashtagMentionsArray = [] ;
var recentHashtagMentionsArray = [] ;

var placeNodeQueue = [];
var placeNodeQueueMaxInQ = 0;
var placeNodeQueueMaxLength = 500 ;
var placeHashMap = nodeHashMap.place;
var maxRecentPlaces = maxPlaceRows ;
var placeArray = [] ;
var recentPlaceArray = [] ;
var placeMentionsArray = [] ;
var recentPlaceMentionsArray = [] ;

var mediaNodeQueue = [];
var mediaNodeQueueMaxInQ = 0;
var mediaNodeQueueMaxLength = 500 ;
var mediaHashMap = nodeHashMap.media;
var mediaArray = [] ;
var recentMediaArray = [] ;
var latestMediaArray = [] ; // 1-element array
var mediaMentionsArray = [] ;
var recentMediaMentionsArray = [] ;

var viewerSessionKey;
var socket = io("/view");

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 1000);
  var seconds = parseInt((duration / 1000) % 60);
  var minutes = parseInt((duration / (1000 * 60)) % 60);
  var hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  var days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

function getCategoryColor(c, callback){

  if (c === undefined) {
    return(callback(palette.white));
  }
  callback(categoryColorHashMap.get(c));
}

function saveConfig(){
  storedConfigName = "config_" + config.sessionViewType;
  store.set(storedConfigName, config);
  var sc = store.get(storedConfigName);
  console.debug("STORED CONFIG"
    + " | " + storedConfigName
    + "\n" + jsonPrint(sc)
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

    d3.select("body").style("cursor", "none");

    currentSessionView.toolTipVisibility(false);
    currentSessionView.mouseMoving(false);

    if (config.pauseOnMouseMove && !config.pauseFlag) { 
      currentSessionView.simulationControl("RESUME"); 
    }

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayStats(false, palette.white);
      displayControl(false);
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


var dragEndPosition = { "id": "ID", "x": 47, "y": 147};

document.addEventListener("dragEnd", function(e) {
  console.log("DRAG END: " + jsonPrint(dragEndPosition));
  if (sessionHashMap.has(dragEndPosition.id)){
    var dragSession = sessionHashMap.get(dragEndPosition.id);
    dragSession.initialPosition.x = dragEndPosition.x;
    dragSession.initialPosition.y = dragEndPosition.y;
    dragSession.node.px = dragEndPosition.x;
    dragSession.node.py = dragEndPosition.y;
    sessionHashMap.set(dragSession.nodeId, dragSession);
    nodeHashMap.set(dragSession.node.nodeId, dragSession.node);
    // console.error("dragSession\n" + jsonPrint(dragSession));
  }
});

var sessionDragEndEvent = new CustomEvent(
  "dragEnd", { 
    "detail": dragEndPosition
  } 
);

window.onbeforeunload = function() {
  if (controlPanelFlag) { controlPanelWindow.close(); }
  controlPanelFlag = false;
};

function toggleControlPanel(){

  var cnf = config;

  console.warn("toggleControlPanel config\n" + jsonPrint(cnf));

  if (controlPanelFlag){
    controlPanelWindow.close();
    controlPanelFlag = false;
    controlPanelReadyFlag = false;
    updateControlButton(controlPanelFlag);
    console.debug("toggleControlPanel: " + controlPanelFlag);
  }
  else {

    var controlPanelInitWaitInterval;

    createPopUpControlPanel(cnf, function(cpw){

      console.warn("createPopUpControlPanel toggleControlPanel: " + controlPanelFlag);

      controlPanelInitWaitInterval = setInterval(function(){
        if (controlPanelReadyFlag) {
          clearInterval(controlPanelInitWaitInterval);
          updateControlButton(controlPanelFlag);
          console.debug("TX> CONTROL PANEL INIT | SOURCE: " + DEFAULT_SOURCE);
          controlPanelWindow.postMessage({op: "INIT", config: cnf}, DEFAULT_SOURCE);
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: twitterUserThreecee}, DEFAULT_SOURCE);
        }
      }, 500);

    });
  }
}

function updateControlButton(controlPanelFlag){
  var cpButtonElement = document.getElementById("controlPanelButton");
  cpButtonElement.innerHTML = controlPanelFlag ? "HIDE CONTROL" : "SHOW CONTROL";
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

var categoryButtonElement = document.getElementById("categoryButton");

function updateCategoryButton(){
  categoryButtonElement.innerHTML = config.autoCategoryFlag ? "AUTO CATEGORY" : "MANUAL CATEGORY";
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
  var bButton = document.getElementById("metricButton");
  bButton.innerHTML = config.metricMode.toUpperCase() + " RADIUS";
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

function updateBlahButton(){
  var bButton = document.getElementById("blahButton");
  bButton.innerHTML = config.blahMode ? "HIDE BLAH" : "SHOW BLAH";
}

function addBlahButton(){
  // var controlDiv = document.getElementById("controlDiv");
  var blahButton = document.createElement("BUTTON");
  blahButton.className = "button";
  blahButton.setAttribute("id", "blahButton");
  blahButton.setAttribute("onclick", "toggleBlah()");
  blahButton.innerHTML = config.blahMode ? "HIDE BLAH" : "SHOW BLAH";
  controlDivElement.appendChild(blahButton);
}

function updateLoginButton(){
  var lButton = document.getElementById("loginButton");
  lButton.innerHTML = statsObj.isAuthenticated ? "LOG OUT" : "LOG IN";
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
  // socket.emit("authentication", viewerObj);
  socket.emit("login", viewerObj);
  // updateLoginButton();
  // if (controlPanelFlag) {controlPanel.updateControlPanel(config);}
  // saveConfig();
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
  var bButton = document.getElementById("fullscreenButton");
  bButton.innerHTML = config.fullscreenMode ? "EXIT FULLSCREEN" : "FULLSCREEN";
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
    // store.set(storedConfigName, config);

  }, configUpdateTimeOutInverval);
}

function controlPanelComm(event) {

  console.debug("CONTROL PANEL: " + event.origin); // prints: { message: "Hello world!"} 

  var data = event.data;

  if (data === "DisableHTML5Autoplay_Initialize") {
    console.info("RX> CONTROL PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ...");
    return;
  }

  // Do we trust the sender of this message?
  // if (event.origin !== "http://example.com:8080")
  //   return;

  switch (data.op) {
    case "READY" :
      console.warn("R< CONTROL PANEL READY");
      controlPanelReadyFlag = true;
    break;
    case "NODE_SEARCH" :
      console.warn("R< CONTROL NODE_SEARCH\n" + jsonPrint(data.input));
      socket.emit("TWITTER_SEARCH_NODE", data.input);
    break;
    case "CLOSE" :
      console.warn("R< CONTROL PANEL CLOSING...");
    break;
    case "MOMENT" :
      console.warn("R< CONTROL PANEL MOMENT...");
      switch (data.id) {
        case "resetButton" :
          reset();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN MOMENT BUTTON");
      }
    break;
    case "TOGGLE" :
      console.warn("R< CONTROL PANEL TOGGLE");
      switch (data.id) {
        case "metricToggleButton" :
          toggleMetric();
          resetConfigUpdateTimeOut();
        break;
        case "blahToggleButton" :
          toggleBlah();
          resetConfigUpdateTimeOut();
        break;
        case "fullscreenToggleButton" :
          toggleFullScreen();
          resetConfigUpdateTimeOut();
        break;
        case "pauseToggleButton" :
          togglePause();
          resetConfigUpdateTimeOut();
        break;
        case "statsToggleButton" :
          toggleStats();
        break;
        case "testModeToggleButton" :
          toggleTestMode();
          resetConfigUpdateTimeOut();
        break;
        case "disableLinksToggleButton" :
          toggleDisableLinks();
          resetConfigUpdateTimeOut();
        break;
        case "nodeCreateButton" :
          // createTextNode;
        break;
        case "antonymToggleButton" :
          toggleAntonym();
          resetConfigUpdateTimeOut();
        break;
        case "removeDeadNodeToogleButton" :
          toggleRemoveDeadNode();
          resetConfigUpdateTimeOut();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN TOGGLE BUTTON");
      }
    break;
    case "UPDATE" :
      console.warn("R< CONTROL PANEL UPDATE");
      switch (data.id) {
        case "transitionDurationSlider" :
          currentSessionView.updateTransitionDuration(data.value);
          config.defaultTransitionDuration = data.value;
          resetConfigUpdateTimeOut();
        break;
        case "linkStrengthSlider" :
          currentSessionView.updateLinkStrength(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "linkDistanceSlider" :
          currentSessionView.updateLinkDistance(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "velocityDecaySlider" :
          currentSessionView.updateVelocityDecay(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "gravitySlider" :
          currentSessionView.updateGravity(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "chargeSlider" :
          currentSessionView.updateCharge(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "maxAgeSlider" :
          currentSessionView.setNodeMaxAge(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "fontSizeMinRatioSlider" :
          currentSessionView.updateFontSizeMinRatio(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "fontSizeMaxRatioSlider" :
          currentSessionView.updateFontSizeMaxRatio(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "nodeRadiusMinRatioSlider" :
          currentSessionView.updateNodeRadiusMinRatio(data.value);
          resetConfigUpdateTimeOut();
        break;
        case "nodeRadiusMaxRatioSlider" :
          currentSessionView.updateNodeRadiusMaxRatio(data.value);
          resetConfigUpdateTimeOut();
        break;
        default:
          console.error("UNKNOWN CONTROL PANEL ID: " + data.id + "\n" + jsonPrint(data));
      }
    break;
    case "INIT":
      console.info("R< CONTROL PANEL LOOPBACK? | INIT ... IGNORING ...");
      break;
    case "CATEGORIZE":

      if (statsObj.isAuthenticated) {

        if (data.node.nodeType === "user"){
          console.info("R< CONTROL PANEL CATEGORIZE"
            + " | " + data.node.nodeId
            + " | " + data.node.screenName
            + " | " + data.category
          );
          socket.emit("TWITTER_CATEGORIZE_NODE", 
            { twitterUser: config.twitterUser,
            category: data.category,
            node: data.node}
          );
        }
        else if (data.node.nodeType === "hashtag"){
          console.info("R< CONTROL PANEL CATEGORIZE"
            + " | " + data.node.nodeId
            + " | " + data.category
          );
          socket.emit("TWITTER_CATEGORIZE_NODE", 
            { twitterUser: config.twitterUser,
            category: data.category,
            node: data.node}
          );
        }

      }
      else {
        window.open(config.authenticationUrl, "_blank");
      }


      break;
    case "SET_TWITTER_USER":
      console.info("R< CONTROL PANEL LOOPBACK? | SET_TWITTER_USER ... IGNORING ...");
      break;
    case "SET_TWITTER_HASHTAG":
      console.info("R< CONTROL PANEL LOOPBACK? | SET_TWITTER_HASHTAG ... IGNORING ...");
      break;
    default :
      if (data["twttr.button"] !== undefined){
        console.log("R< CONTROL PANEL TWITTER" 
          + " | " + data["twttr.button"].method
        );
      }
      else if (data["settings"] !== undefined){
        console.log("R< CONTROL PANEL SETTINGS" 
          + "\n" + jsonPrint(data["settings"])
        );
      }
      else {
        console.warn("R< ??? CONTROL PANEL OP UNDEFINED\n" + jsonPrint(data));
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
  if (config.metricMode === "rate") {
    config.metricMode = "mentions";
  }
  else {
    config.metricMode = "rate";
  }
  currentSessionView.setMetricMode(config.metricMode);
  console.warn("SET RADIUS MODE: " + config.metricMode);
  updateMetricButton();
  if (controlPanelFlag) {controlPanel.updateControlPanel(config);}
  saveConfig();
}

function toggleBlah() {
  config.blahMode = !config.blahMode;
  currentSessionView.setBlah(config.blahMode);
  console.warn("TOGGLE BLAH: " + config.blahMode);
  updateBlahButton();
  if (controlPanelFlag) {controlPanel.updateControlPanel(config);}
  saveConfig();
}

function toggleAntonym() {
  config.antonymFlag = !config.antonymFlag;
  currentSessionView.setAntonym(config.antonymFlag);
  console.warn("TOGGLE ANT: " + config.antonymFlag);
  controlPanel.updateControlPanel(config);
  saveConfig();
}

function togglePause() {
  config.pauseFlag = !config.pauseFlag;
  currentSessionView.setPause(config.pauseFlag);
  console.warn("TOGGLE PAUSE: " + config.pauseFlag);
  controlPanel.updateControlPanel(config);
  saveConfig();
}

function toggleRemoveDeadNode() {
  config.removeDeadNodesFlag = !config.removeDeadNodesFlag;
  currentSessionView.setRemoveDeadNodesFlag(config.removeDeadNodesFlag);
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.removeDeadNodesFlag);
  controlPanel.updateControlPanel(config);
  saveConfig();
}

function toggleDisableLinks() {
  config.disableLinks = !config.disableLinks;
  currentSessionView.disableLinks = config.disableLinks;
  if (config.disableLinks) { linkHashMap.clear(); }
  console.warn("TOGGLE DISABLE LINKS: " + config.disableLinks);
  controlPanel.updateControlPanel(config);
  saveConfig();
}

function toggleCategory() {
  config.autoCategoryFlag = !config.autoCategoryFlag;
  currentSessionView.setAutoCategoryFlag(config.autoCategoryFlag);
  console.warn("AUTO CATEGORY: " + config.autoCategoryFlag);

  updateCategoryButton();
  if (controlPanelFlag) { controlPanel.updateControlPanel(config); }
  saveConfig();
}

function toggleStats() {
  config.showStatsFlag = !config.showStatsFlag;
  console.warn("TOGGLE STATS: " + config.showStatsFlag);

  if (config.showStatsFlag) {
    displayStats(config.showStatsFlag);
  } else {
    displayStats(false, palette.white);
  }

  updateStatsButton();
  if (controlPanelFlag) { controlPanel.updateControlPanel(config); }
}

function toggleTestMode() {
  config.testMode = !config.testMode;
  config.testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + config.testModeEnabled);
  currentSessionView.setTestMode(config.testModeEnabled);
  controlPanel.updateControlPanel(config);
  saveConfig();
}




// var initialXpositionRatio = 0.0;
// var initialYpositionRatio = 0.5;

function computeInitialPosition(index) {
  var pos = {
    x: randomIntFromInterval(0.95 * currentSessionView.getWidth(), 1.0 * currentSessionView.getWidth()),
    y: randomIntFromInterval(0.3 * currentSessionView.getHeight(), 0.7 * currentSessionView.getHeight())
  };

  if (!pos.x || !pos.y) {
    console.error("POS " + jsonPrint(pos));
  }
  return pos;
}

function getSortedKeys(hmap, sortProperty) {
  var keys = [];
  hmap.forEach(function(value, key) {
    if (!value.isSessionNode) {
      keys.push(key);
    }
  });
  return keys.sort(function(a, b) {
    return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty];
  });
}

function getTimeStamp(inputTime) {
  var options = {
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

  if (inputTime === undefined) {
    currentDate = new Date().toDateString("en-US", options);
    currentTime = new Date().toTimeString("en-US", options);
  } else {
    currentDate = new Date(inputTime).toDateString("en-US", options);
    currentTime = new Date(inputTime).toTimeString("en-US", options);
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
  if (prefix) {
    return prefix + "Hidden";
  } else {
    return "hidden";
  }
}

function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + "visibilitychange";
  } else {
    return "visibilitychange";
  }
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
  // store.set(storedConfigName, config);

  if (sessionMode) {
    console.debug("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    console.debug("TX GET_SESSION | " + currentSession.sessionId);
    socket.emit("GET_SESSION", currentSession.sessionId);
  } 
  else {
    console.debug("TX REQ_USER_SESSION\nVIEWER OBJ\n" + jsonPrint(viewerObj));
    socket.emit("REQ_USER_SESSION", viewerObj);
  }

  if (!config.pauseFlag) {
    currentSessionView.simulationControl("RESUME");
  }
});

socket.on("reconnect", function() {
  viewerObj.userId = socket.id;
  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

  viewerObj.timeStamp = moment().valueOf();

  socket.emit("authentication", viewerObj);

  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    controlPanel.document.getElementById("statusSessionId").innerHTML = "SOCKET: " + statsObj.socketId;
    socket.emit("GET_SESSION", currentSession.sessionId);
  } 
});

socket.on("connect", function() {
  viewerObj.userId = socket.id;

  socket.emit("authentication", viewerObj);
  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  if (currentSessionView !== undefined) {
    currentSessionView.setEnableAgeNodes(true);
  }
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function() {
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  if (currentSessionView !== undefined) {
    currentSessionView.setEnableAgeNodes(false);
  }
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
  });
});

socket.on("error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors++;
  console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
  });
});

socket.on("connect_error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors++;
  console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET CONNECT ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    if (currentSessionView !== undefined) { currentSessionView.resize(); }
    updateSessionsReady = true;
  });
});

socket.on("reconnect_error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors++;
  console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET RECONNECT ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
  });
});


var windowVisible = true;

document.title = "Word Association";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityEvent = getVisibilityEvent(prefix);


function reset(){
  currentSessionView.simulationControl("RESET");
  windowVisible = true;
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS ON WINDOW HIDDEN");
    sessionCreateQueue = [];
    sessionDeleteHashMap.clear();
    if ((config.sessionViewType == "force") 
      || (config.sessionViewType == "ticker")
      || (config.sessionViewType == "flow")
      || (config.sessionViewType == "media")
    ) {
      currentSessionView.resetDefaultForce();
    }
    currentSessionView.simulationControl("START");
    updateSessionsReady = true;
  });  
}

window.addEventListener("resize", function() {
  currentSessionView.resize();
});

document.addEventListener(visibilityEvent, function() {
  if (!document[hidden]) {
    windowVisible = true;
    resetMouseMoveTimer();
    if (currentSessionView !== undefined) {
      currentSessionView.setPause(false);
    }
    console.info("visibilityEvent: " + windowVisible);
  } 
  else {
    windowVisible = false;
    if (currentSessionView !== undefined) {
      currentSessionView.setPause(true);
    }
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

    function(variable, callback) {

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

function launchSessionView(sessionId) {
  var namespacePattern = new RegExp(/^\/(\S*)#(\S*)$/);
  var sessionIdParts = namespacePattern.exec(sessionId);
  console.log("sessionId: " + sessionId + " | nsp: " + sessionIdParts[1] + " | id: " + sessionIdParts[2]);
  var url = urlRoot + sessionIdParts[2] + "&nsp=" + sessionIdParts[1];
  console.log("launchSessionView: " + sessionId + " | " + url);
  window.open(url, "SESSION VIEW", "_new");
}


var globalLinkIndex = 0;

function generateLinkId(callback) {
  globalLinkIndex++;
  return "LNK" + globalLinkIndex;
}

function tableCreateRow(parentTable, options, cells) {

  var tr = parentTable.insertRow();
  var tdTextColor = options.textColor;
  var tdBgColor = options.backgroundColor || "#222222";

  if (options.trClass) {
    tr.className = options.trClass;
  }

  if (options.headerFlag) {
    cells.forEach(function(content) {
      var th = tr.insertCell();
      th.appendChild(document.createTextNode(content));
      th.style.color = tdTextColor;
      th.style.backgroundColor = tdBgColor;
    });
  } else {
    cells.forEach(function(content) {

      // console.warn("tableCreateRow\n" + jsonPrint(content));

      var td = tr.insertCell();
      if (content.type === undefined) {

        td.appendChild(document.createTextNode(content));
        td.style.color = tdTextColor;
        td.style.backgroundColor = tdBgColor;

      } 
      else if (content.type == "TEXT") {

        td.className = content.class;
        td.setAttribute("id", content.id);
        td.style.color = tdTextColor;
        td.style.backgroundColor = tdBgColor;
        td.innerHTML = content.text;

      } 
      else if (content.type == "BUTTON") {

        var buttonElement = document.createElement("BUTTON");
        buttonElement.className = content.class;
        buttonElement.setAttribute("id", content.id);
        buttonElement.setAttribute("mode", content.mode);
        buttonElement.addEventListener("click", function(e){ buttonHandler(e); }, false);
        buttonElement.innerHTML = content.text;
        td.appendChild(buttonElement);
        controlIdHash[content.id] = content;

      } 
      else if (content.type == "SLIDER") {

      console.warn("tableCreateRow\n" + jsonPrint(content));

        var sliderElement = document.createElement("INPUT");
        sliderElement.type = "range";
        sliderElement.className = content.class;
        sliderElement.setAttribute("id", content.id);
        sliderElement.setAttribute("min", content.min);
        sliderElement.setAttribute("max", content.max);
        sliderElement.setAttribute("multiplier", content.multiplier);
        sliderElement.setAttribute("oninput", content.oninput);
        sliderElement.value = content.value;
        td.appendChild(sliderElement);
        controlIdHash[content.id] = content;

      }
    });
  }
}

function createStatsTable(callback) {

  // console.log("CREATE STATS TABLE\n" + jsonPrint(config));
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
    text: statsObj.heartbeat.timeStamp
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
    text: statsObj.heartbeat.upTime
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
    text: statsObj.heartbeat.startTime
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
    text: statsObj.heartbeat.runTime
  };

  switch (config.sessionViewType) {

    case "media":
    case "force":
    case "flow":
    case "ticker":
    case "histogram":
    case "treemap":
    case "treepack":
      tableCreateRow(statsTableServer, optionsHead, ["SERVER"]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerTimeLabel, statsServerTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerUpTimeLabel, statsServerUpTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerStartTimeLabel, statsServerStartTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerRunTimeLabel, statsServerRunTime]);
      tableCreateRow(statsTableClient, optionsHead, ["CLIENT"]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientSessionIdLabel, statsClientSessionId]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientNumberNodesLabel, statsClientNumberNodes, statsClientNumberMaxNodesLabel, statsClientNumberMaxNodes]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientAgeRateLabel, statsClientAgeRate, statsClientMaxAgeRateLabel, statsClientMaxAgeRate]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientAddNodeQLabel, statsClientAddNodeQ, statsClientMaxAddNodeQLabel, statsClientMaxAddNodeQ]);
      break;
  }

  statsServerTimeElement = document.getElementById("statsServerTime");
  statsServerUpTimeElement = document.getElementById("statsServerUpTime");
  statsServerStartTimeElement = document.getElementById("statsServerStartTime");
  statsServerRunTimeElement = document.getElementById("statsServerRunTime");
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
    // console.log("SESSION_KEEPALIVE | " + moment());
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

function deleteSession(nodeId, callback) {

  if (!sessionHashMap.has(nodeId)) {
    // console.warn("deleteSession: SID NOT IN HASH: " + nodeId + " ... SKIPPING DELETE");
    return (callback(nodeId));
  }

  // console.warn("deleteSession: " + nodeId);

  var deletedSession = sessionHashMap.get(nodeId);
  var groupLinkId = deletedSession.groupId + "_" + deletedSession.node.nodeId;
  var sessionLinks = deletedSession.linkHashMap.keys();

  async.each(sessionLinks, function(sessionLinkId, cb) {
      linkHashMap.remove(sessionLinkId);
      cb();
    },
    function(err) {

      linkHashMap.remove(groupLinkId);
      sessionHashMap.remove(nodeId);
      nodeHashMap.remove(deletedSession.node.nodeId);
      sessionDeleteHashMap.set(sessionId, 1);

      currentSessionView.deleteSessionLinks(sessionId);
      currentSessionView.deleteNode(deletedSession.node.nodeId);

      return (callback(sessionId));
    }
  );
}

function deleteAllSessions(callback) {

  var nodeIds = sessionHashMap.keys();

  async.each(nodeIds, function(nodeId, cb) {
      deleteSession(nodeId, function(nId) {
        // console.log("X SES " + nId);
        cb();
      });
    },
    function(err) {
      sessionDeleteHashMap.clear();
      callback();
    }
  );
}

let statsServerTimeElement;
let statsServerUpTimeElement;
let statsServerStartTimeElement;
let statsServerRunTimeElement;
let statsClientNumberNodesElement;
let statsClientNumberMaxNodesElement;
let statsClientAddNodeQElement;
let statsClientMaxAddNodeQElement;
let statsClientAgeRateElement;
let statsClientMaxAgeRateElement;
let statsClientSessionIdElement;

function updateStatsTable(statsObj){
  statsServerTimeElement.innerHTML = moment(statsObj.heartbeat.timeStamp).format(defaultDateTimeFormat);
  statsServerUpTimeElement.innerHTML = msToTime(statsObj.heartbeat.upTime);
  statsServerStartTimeElement.innerHTML = moment(statsObj.heartbeat.startTime).format(defaultDateTimeFormat);
  statsServerRunTimeElement.innerHTML = msToTime(statsObj.heartbeat.runTime);
  statsClientNumberNodesElement.innerHTML = currentSessionView.getNodesLength();
  statsClientNumberMaxNodesElement.innerHTML = statsObj.maxNodes;
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

  var nodesLength = ( currentSessionView === undefined) ? 0 : currentSessionView.getNodesLength();
  statsObj.maxNodes = ( currentSessionView === undefined) ? 0 : currentSessionView.getMaxNodes();
  var nodeAddQLength = ( currentSessionView === undefined) ? 0 : currentSessionView.getNodeAddQlength();
  statsObj.maxNodeAddQ = ( currentSessionView === undefined) ? 0 : currentSessionView.getMaxNodeAddQ();

  statsObj.heartbeat = heartbeat;

  heartBeatsReceived++;
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
    nodeMaxAge = config.nodeMaxAge;
    currentSessionView.setMaxAge(rxConfig.nodeMaxAge);
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }
});

socket.on("SESSION_ABORT", function(rxSessionObject) {
  console.error("RX SESSION_ABORT" 
    + " | " + rxSessionObject.sessionId 
    + " | " + rxSessionObject.sessionEvent);
  if (rxSessionObject.sessionId == socket.id) {
    console.error("SESSION_ABORT" 
      + " | " + rxSessionObject.sessionId 
      + " | " + rxSessionObject.sessionEvent);
    statsObj.serverConnected = false;
    statsObj.socketId = "ABORTED";
    socket.disconnect();
  }
});

socket.on("SESSION_DELETE", function(rxSessionObject) {

  if (( rxSessionObject.session !== undefined) && ( rxSessionObject.session.tags !== undefined)){

    rxSessionObject.session.nodeId = (config.forceViewMode == "web") 
      ? rxSessionObject.session.tags.entity.toLowerCase() 
      : rxSessionObject.session.tags.entity.toLowerCase() + "_" + rxSessionObject.session.tags.channel.toLowerCase();

    if (sessionHashMap.has(rxSessionObject.session.nodeId)) {

      var session = sessionHashMap.get(rxSessionObject.session.nodeId);
      sessionDeleteHashMap.set(rxSessionObject.session.nodeId, 1);
      session.sessionEvent = "SESSION_DELETE";
      rxSessionDeleteQueue.push(session);

      console.log("SESSION_DELETE" 
        + " | " + rxSessionObject.session.nodeId
        // + " | " + rxSessionObject.sessionId 
        + " | " + rxSessionObject.sessionEvent
        // + "\n" + jsonPrint(rxSessionObject)
      );

    }

  }
});

socket.on("USER_SESSION", function(rxSessionObject) {
  console.debug("USER_SESSION" 
    + " | SID: " + rxSessionObject.sessionId 
    + " | UID: " + rxSessionObject.userId 
    + " | NSP: " + rxSessionObject.namespace 
    + " | WCI: " + rxSessionObject.wordChainIndex 
    + " | CONN: " + rxSessionObject.connected);
});

socket.on("SET_TWITTER_USER", function(twitterUser) {

  if (twitterUser.notFound !== undefined) {

    console.log("SET_TWITTER_USER | NOT FOUND" 
      + " | @" + twitterUser.screenName 
    );
    
    currentSessionView.setTwitterUser(twitterUser);
    return;
  }

  console.log("SET_TWITTER_USER" 
    + " | " + twitterUser.userId 
    + " | @" + twitterUser.screenName 
    + " | FLWRs: " + twitterUser.followersCount 
    + " | FRNDs: " + twitterUser.friendsCount 
    + " | Ts: " + twitterUser.statusesCount 
    + " | C: " + twitterUser.category
    + " | CA: " + twitterUser.categoryAuto
  );

  if (twitterUser.userId === twitterUserThreecee.userId) {
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

let rxNodeQueueReady = false;
let rxNodeQueue = [];

function initSocketSessionUpdateRx(){

  // socket.on("SESSION_UPDATE", function(rxSessionObject) {

  //   console.info("SES " + rxSessionObject.action + " | " + rxSessionObject.sessionId);

  //   if (rxSessionObject.action == "KEEPALIVE") {
  //     // console.debug("KEEPALIVE"
  //     //   + "\n" + jsonPrint(rxSessionObject)
  //     // );
  //     currentSessionView.sessionKeepalive(rxSessionObject);
  //   } 
  //   else if (!windowVisible || config.pauseFlag) {
  //     rxSessionUpdateQueue = [];
  //     if (debug) {
  //       console.log("... SKIP SESSION_UPDATE ... WINDOW NOT VISIBLE");
  //     }
      
  //   } 
  //   else if (sessionMode && (rxSessionObject.sessionId !== currentSession.sessionId)) {
  //     if (debug) {
  //       console.log("SKIP SESSION_UPDATE: " + rxSessionObject.sessionId 
  //         + " | CURRENT: " + currentSession.sessionId);
  //     }
  //   } 
  //   else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

  //     rxSessionUpdateQueue.push(rxSessionObject);

  //     if ((rxSessionObject.tags.trending !== undefined) 
  //       && (rxSessionObject.tags.trending.length > 0)) {
  //       console.info("TTT" 
  //         + " | " + rxSessionObject.source.nodeId 
  //         + " | T: " + rxSessionObject.tags.trending
  //         // + " | T: " + jsonPrint(rxSessionObject.tags)
  //       );
  //     }

  //   }
  // });

  socket.on("node", function(nNode) {
    if ((rxNodeQueue.length < RX_NODE_QUEUE_MAX)
      &&((nNode.nodeType === "user") || (nNode.nodeType === "hashtag") || (nNode.nodeType === "place"))
    ){
      rxNodeQueue.push(nNode);
    }
  });

  rxNodeQueueReady = true;

  let newNode = {};

  setInterval(function(){

    if (rxNodeQueueReady && (rxNodeQueue.length > 0)) {

      rxNodeQueueReady = false;

      newNode = rxNodeQueue.shift();

      newNode.isTopTerm = newNode.isTopTerm || false;

      var category;
      if (config.autoCategoryFlag &&  newNode.categoryAuto){
        category = newNode.categoryAuto;
      }
      else {
        category = newNode.category;
      }

      getCategoryColor(category, function(color){
        newNode.categoryColor = color;
      });

      newNode.age = 1e-6;
      newNode.ageMaxRatio = 1e-6;
      newNode.mouseHoverFlag = false;
      newNode.isDead = false;
      newNode.r = 0;
      newNode.links = [];
      newNode.mentions = (newNode.mentions > 0) ? newNode.mentions : 10;

      if (newNode.nodeType === "user"){
        newNode.nodeId = newNode.screenName.toLowerCase();
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

  socket.on("STATS_HASHTAG", function(htStatsObj){
      console.log(">>> RX STATS_HASHTAG");

      var htObjArray = [];

      Object.keys(htStatsObj).forEach(function(key) {
        if (htStatsObj.hasOwnProperty(key)) {

          var htObj = htStatsObj[key];
          var mntns = htObj.mentions.toString() ;
          var numPadSpaces = 10 - mntns.length;
          htObj.displaytext = new Array(numPadSpaces).join("xa0") + mntns + " " + key ;
          htObj.barlabel = key ;

          getTimeNow(function(t){
            htObj.seen = t ;
            htObj.topHashtag = true ;
            htObj.newFlag = false ;
            htObjArray.push(htObj);
            hashtagHashMap.set(key, htObj);
          });
        }
      });
  });
}

function initSocketNodeRx(){

  socket.on("node", function(nNode) {

    if ((nNode.nodeType !== "user") 
      && (nNode.nodeType !== "hashtag") 
      && (nNode.nodeType !== "place") 
      ) {
      return;
    }

    nNode.isTopTerm = nNode.isTopTerm || false;

    var category;
    if (config.autoCategoryFlag && nNode.categoryAuto){
      category = nNode.categoryAuto;
    }
    else {
      category = nNode.category;
    }

    getCategoryColor(category, function(color){
      nNode.categoryColor = color;
    });

    nNode.age = 1e-6;
    nNode.ageMaxRatio = 1e-6;
    nNode.mouseHoverFlag = false;
    nNode.isDead = false;
    nNode.r = 0;
    nNode.links = [];
    nNode.mentions = (nNode.mentions > 0) ? nNode.mentions : 10;

    if (nNode.nodeType === "user"){
      newNode.nodeId = nNode.screenName.toLowerCase();
      newNode.text = nNode.screenName.toLowerCase();
      newNode.screenName = nNode.screenName.toLowerCase();
    }
    if (nNode.nodeType === "hashtag"){
      newNode.nodeId = nNode.text;
    }

    newNode.categoryMismatch = nNode.category && nNode.categoryAuto && (nNode.category !== nNode.categoryAuto);
    newNode.categoryMatch = nNode.category && nNode.categoryAuto && (nNode.category === nNode.categoryAuto);

    if (((config.sessionViewType === "treemap") || (config.sessionViewType === "treepack"))
      && ((nNode.nodeType !== "user") || (enableUserNodes && (nNode.nodeType === "user")))) {
      currentSessionView.addNode(newNode);
    }
    else if ((config.sessionViewType === "histogram")
      && ((nNode.nodeType !== "user") || (enableUserNodes && (nNode.nodeType === "user")))) {
      currentSessionView.addNode(newNode);
    }
    else if ((config.sessionViewType !== "treemap") 
      && (config.sessionViewType !== "treepack") 
      && (config.sessionViewType !== "histogram")) {
      currentSessionView.addNode(newNode);
    }

  });

  socket.on("STATS_HASHTAG", function(htStatsObj){
      console.log(">>> RX STATS_HASHTAG");

      var htObjArray = [];

      Object.keys(htStatsObj).forEach(function(key) {
        if (htStatsObj.hasOwnProperty(key)) {

          var htObj = htStatsObj[key];
          var mntns = htObj.mentions.toString() ;
          var numPadSpaces = 10 - mntns.length;
          htObj.displaytext = new Array(numPadSpaces).join("xa0") + mntns + " " + key ;
          htObj.barlabel = key ;

          getTimeNow(function(t){
            htObj.seen = t ;
            htObj.topHashtag = true ;
            htObj.newFlag = false ;
            htObjArray.push(htObj);
            hashtagHashMap.set(key, htObj);
          });
        }
      });
  });
}

//================================
// GET NODES FROM QUEUE
//================================

var nodeIndex = 0;
var tempMentions;

var numberSessionsUpdated = 0;

function addToHashMap(hm, key, value, callback) {
  if ( key === undefined) {
    console.error("*** ERROR addToHashMap KEY UNDEFINED ***\nVALUE\n" + jsonPrint(value));
    console.trace();
  }
  hm.set(key, value);
  var v = hm.get(key);
  callback(v);
}

function removeFromHashMap(hm, key, callback) {
  if (hm.has(key)){
    var value = hm.get(key);
    hm.remove(key);

    if (callback !== undefined) { callback(value); }
  }
  else{
    if (callback !== undefined) { callback(false); }
  }
}

var processSessionQueues = function(callback) {

  if (rxSessionDeleteQueue.length > 0) {
    var deleteSessUpdate = rxSessionDeleteQueue.shift();
    // console.log("DELETE SESSION: " + deleteSessUpdate.sessionId);
    sessionDeleteHashMap.set(deleteSessUpdate.sessionId, 1);
    deleteSession(deleteSessUpdate.sessionId, function(sessionId) {
      return (callback(null, null));
    });
  } 
  else if (rxSessionUpdateQueue.length == 0) {
    return (callback(null, null));
  } 
  else {
    var session = rxSessionUpdateQueue.shift();

    if ((config.sessionViewType === "treemap") 
      || (config.sessionViewType === "treepack") 
      || (config.sessionViewType === "histogram") 
      || (config.forceViewMode === "web")) {
      session.tags.entity = session.tags.entity.toLowerCase();
      session.tags.channel = session.tags.channel.toLowerCase();
    }
    else {
      session.nodeId = session.tags.entity.toLowerCase() + "_delete+ session.tags.channel.toLowerCase()"; // KLUDGE???
      session.tags.entity = session.tags.entity.toLowerCase();
      session.tags.channel = session.tags.channel.toLowerCase();
    }

    switch (session.tags.channel){
      case "twitter":
        session.tags.url = "https://twitter.com/" + session.tags.entity.toLowerCase();
        if ( session.tags.group.url !== undefined) {
          session.tags.group.url = "https://twitter.com/" + session.tags.entity.toLowerCase();
        }
      break;
      case "livestream":
        if (session.tags.entity == "cspan"){
          if ( session.tags.group.url !== undefined) {
            session.tags.group.url = "https://www.c-span.org/networks/"; 
          }         
        }
      break;
    }

    if ( session.tags.group.groupId !== undefined) {
      groupCreateQueue.push(session);
    }
    else if (session.tags.group.entityId){

      if (!groupHashMap.has(session.tags.group.entityId)) {
        session.tags.group.groupId = session.tags.group.entityId;
        groupCreateQueue.push(session);
      }
      else {
        session.tags.group.groupId = groupHashMap.get(session.tags.group.entityId);
      }
    }
    else {
      console.error("??? GROUP & ENTITY IDs UNDEFINED ... SKIPPING"
        + " | " + session.nodeId
        + "\nTAGS\n" + jsonPrint(session.tags)
      );
    }

    return (callback(null, session.sessionId));
  }
};

var processNodeDeleteQueue = function(callback) {
  
  async.each(nodeDeleteQueue, function(deletedNodeId, cb) {

    removeFromHashMap(nodeHashMap, deletedNodeId);
    removeFromHashMap(sessionHashMap, deletedNodeId);
    removeFromHashMap(groupHashMap, deletedNodeId);
    cb();

  }, function(){
    nodeDeleteQueue.length = 0;
    return (callback(null, "processNodeDeleteQueue"));
  });
};

var processLinkDeleteQueue = function(callback) {

  async.each(linkDeleteQueue, function(deletedLinkId, cb) {

    removeFromHashMap(linkHashMap, deletedLinkId);
    cb();

  }, function(){
    linkDeleteQueue.length = 0;
    return (callback(null, "processLinkDeleteQueue"));
  });
};

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

var createGroup = function(callback) {

  if (groupCreateQueue.length == 0) {
    callback(null, null);
  } 
  else {

    var dateNow = moment().valueOf();
    var sessUpdate = groupCreateQueue.shift();

    var groupId = sessUpdate.tags.group.groupId;
    var groupName = sessUpdate.tags.group.name;
    var groupUrl = sessUpdate.tags.group.url;

    if (groupDeleteHashMap.has(groupId)) {
      console.warn("createGroup: " 
        + groupId + " | " + groupName + " | "
        + " GROUP IN DELETE HASH MAP ... SKIPPING"
      );
      callback(null, null);
    } 
    else if (groupHashMap.has(groupId)) {

      currentGroup = {};
      currentSession = {};

      currentGroup = groupHashMap.get(groupId);

      if (nodeHashMap.has(currentGroup.node.nodeId)) {
        currentGroup.node = nodeHashMap.get(currentGroup.node.nodeId);
      }

      currentGroup.url = groupUrl;
      currentGroup.mentions++;
      currentGroup.age = 1e-6;
      currentGroup.ageMaxRatio = 1e-6;
      currentGroup.lastSeen = dateNow;
      currentGroup.text = groupName;
      currentGroup.wordChainIndex = sessUpdate.wordChainIndex;

      // GROUP NODE
      currentGroup.node.nodeType = "group";
      currentGroup.node.text = groupName;
      currentGroup.node.url = groupUrl;

      currentGroup.node.age = 1e-6;
      currentGroup.node.ageMaxRatio = 1e-6;
      currentGroup.node.ageUpdated = dateNow;
      currentGroup.node.lastSeen = dateNow;
      currentGroup.node.isDead = false;

      currentGroup.node.mentions++;

      currentGroup.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.node.sessionWordChainIndex[sessUpdate.nodeId] = sessUpdate.wordChainIndex; 
      currentGroup.node.totalWordChainIndex = sum(currentGroup.node.sessionWordChainIndex);

      // update group totalWordChainIndex
      currentGroup.totalWordChainIndex = currentGroup.node.totalWordChainIndex;

      if (sessionHashMap.has(sessUpdate.nodeId)) {
        currentSession = sessionHashMap.get(sessUpdate.nodeId);
        var groupLinkId = currentGroup.node.nodeId + "_" + currentSession.node.nodeId;
        currentGroup.node.links = {};
        currentGroup.node.links[groupLinkId] = 1;
      }

      addToHashMap(nodeHashMap, currentGroup.node.nodeId, currentGroup.node, function(grpNode) {

        addToHashMap(groupHashMap, currentGroup.groupId, currentGroup, function(cGroup) {
          sessionCreateQueue.push(sessUpdate);
          return (callback(null, cGroup.groupId));
        });
      });

    } 
    else {

      groupsCreated += 1;

      var currentInitialPosition = computeInitialPosition(randomIntFromInterval(0,359));

      randomNumber360 = (randomNumber360 + randomIntFromInterval(61, 117))%360;

      var groupStartColor = "hsl(" + randomNumber360 + ",0%,10%)";
      var groupEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var sessionStartColor = "hsl(" + randomNumber360 + ",0%,10%)";
      var sessionEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var nodeStartColor = "hsl(" + randomNumber360 + ",0%,0%)";
      var nodeEndColor = "hsl(" + randomNumber360 + ",0%,100%)";

      currentGroup = {};
      currentSession = {};

      currentGroup.groupId = groupId;
      currentGroup.url = groupUrl;
      currentGroup.name = groupName;
      currentGroup.nodeId = groupId;
      currentGroup.age = 1e-6;
      currentGroup.ageUpdated = dateNow;
      currentGroup.ageMaxRatio = 1e-6;
      currentGroup.lastSeen = dateNow;
      currentGroup.nodeType = "group";
      currentGroup.isGroup = true;
      currentGroup.isSession = false;
      currentGroup.mentions = 1;
      currentGroup.wordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.totalWordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.tags = {};
      currentGroup.tags = sessUpdate.tags;
      currentGroup.text = groupName;
      currentGroup.source = sessUpdate.source;
      currentGroup.source.lastSeen = dateNow;
      currentGroup.target = sessUpdate.target;
      if (currentGroup.target) { currentGroup.target.lastSeen = dateNow; }

      currentGroup.node = {};
      currentGroup.linkHashMap = new HashMap();
      currentGroup.initialPosition = currentInitialPosition;
      currentGroup.x = currentInitialPosition.x;
      currentGroup.y = currentInitialPosition.y;

      currentGroup.groupColors = {};
      currentGroup.groupColors = {"startColor": groupStartColor, "endColor": groupEndColor};
      currentGroup.sessionColors = {};
      currentGroup.sessionColors = {"startColor": sessionStartColor, "endColor": sessionEndColor};
      currentGroup.nodeColors = {};
      currentGroup.nodeColors = {"startColor": nodeStartColor, "endColor": nodeEndColor};

      var interpolateGroupColor = d3.interpolateHsl(groupStartColor, groupEndColor);
      currentGroup.interpolateGroupColor = interpolateGroupColor;

      var interpolateSessionColor = d3.interpolateHsl(sessionStartColor, sessionEndColor);
      currentGroup.interpolateSessionColor = interpolateSessionColor;

      var interpolateNodeColor = d3.interpolateHsl(nodeStartColor, nodeEndColor);
      currentGroup.interpolateNodeColor = interpolateNodeColor;

      currentGroup.interpolateColor = interpolateNodeColor;

      // CREATE GROUP NODE

      currentGroup.node.nodeType = "group"; // KLUDGE
      currentGroup.node.isGroupNode = true;
      currentGroup.node.isSessionNode = false;
      currentGroup.node.groupId = groupId;
      currentGroup.node.nodeId = groupId;
      currentGroup.node.url = groupUrl;
      currentGroup.node.age = 1e-6;
      currentGroup.node.ageMaxRatio = 1e-6;
      currentGroup.node.isDead = false;
      currentGroup.node.ageUpdated = dateNow;
      currentGroup.node.lastSeen = dateNow;

      currentGroup.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentGroup.node.sessionWordChainIndex = {};  // per session wci
      currentGroup.node.sessionWordChainIndex[sessUpdate.nodeId] = sessUpdate.wordChainIndex; 
      currentGroup.node.totalWordChainIndex = sum(currentGroup.node.sessionWordChainIndex);  

      currentGroup.node.mentions = 1;
      currentGroup.node.text = groupName;
      currentGroup.node.r = config.defaultNodeRadius;
      currentGroup.node.x = currentInitialPosition.x;
      currentGroup.node.y = currentInitialPosition.y;
      currentGroup.node.fixed = false;

      currentGroup.node.groupColors = {};
      currentGroup.node.groupColors = currentGroup.groupColors;
      currentGroup.node.interpolateGroupColor = interpolateGroupColor;

      currentGroup.interpolateColor = interpolateGroupColor;

      currentGroup.node.links = {};

      if (sessionHashMap.has(sessUpdate.nodeId)) {
        currentSession = sessionHashMap.get(sessUpdate.nodeId);
        groupLinkId = currentGroup.node.nodeId + "_" + currentSession.node.nodeId;
        currentGroup.node.links[groupLinkId] = 1;
      }

      addToHashMap(nodeHashMap, currentGroup.node.nodeId, currentGroup.node, function(grpNode) {

        // console.info("+ G" 
        //   + " | " + grpNode.nodeId
        //   + " | " + grpNode.groupId
        //   // + " | " + grpNode.url
        //   + " | isGroupNode: " + grpNode.isGroupNode
        //   + " | isSessionNode: " + grpNode.isSessionNode
        // );

        addToHashMap(groupHashMap, currentGroup.groupId, currentGroup, function(cGroup) {
          // console.log("+ G " + cGroup.groupId 
          //   + " | GNID: " + cGroup.node.nodeId
          // );
          sessionCreateQueue.push(sessUpdate);
          currentSessionView.addGroup(cGroup);
          return (callback(null, cGroup.groupId));
        });
      });
    }
  }
};

var createSession = function(callback) {

  if (sessionCreateQueue.length == 0) {
    callback(null, null);
  } 
  else {

    var dateNow = moment().valueOf();
    var sessUpdate = sessionCreateQueue.shift();
    currentGroup = {};

    var currentSessionNodeId = sessUpdate.tags.entity.toLowerCase() + "_" + sessUpdate.tags.channel.toLowerCase();

    // console.warn("sessUpdate\n" + jsonPrint(sessUpdate));

    if (groupHashMap.has(sessUpdate.tags.group.groupId)) {
      currentGroup = groupHashMap.get(sessUpdate.tags.group.groupId);
    }
    else {
      console.error("currentGroup\n" + jsonPrint(currentGroup)); 
    }

    if (sessionDeleteHashMap.has(sessUpdate.sessionId)) {
      // console.log("createSession: " 
      //   + sessUpdate.userId 
      //   + " | " + sessUpdate.tags.entity 
      //   + " SESSION IN DELETE HASH MAP ... SKIPPING"
      // );
      callback(null, null);
    } 
    // else if (sessionHashMap.has(sessUpdate.nodeId)) {
    else if (sessionHashMap.has(currentSessionNodeId)) {

      currentSession = sessionHashMap.get(currentSessionNodeId);

      if (currentSession.wordChainIndex === undefined){
        console.error("*** currentSession.wordChainIndex UNDEFINED");
      }

      if (currentSession.tags === undefined) { currentSession.tags = {}; }
      currentSession.tags = sessUpdate.tags;

      currentSession.colors = currentGroup.sessionColors;

      if (nodeHashMap.has(currentSession.node.nodeId)) {
        currentSession.node = nodeHashMap.get(currentSession.node.nodeId);
      }
      if (nodeHashMap.has(sessUpdate.tags.group.groupId)) {
        currentGroup.node = nodeHashMap.get(sessUpdate.tags.group.groupId);
      }

      currentSession.groupId = currentGroup.groupId;
      currentSession.age = 1e-6;
      currentSession.ageUpdated = dateNow;
      currentSession.ageMaxRatio = 1e-6;
      currentSession.mentions++;
      currentSession.lastSeen = dateNow;
      currentSession.userId = sessUpdate.userId;
      currentSession.url = sessUpdate.url;
      currentSession.text = sessUpdate.tags.entity + " | " + sessUpdate.tags.channel;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.source = sessUpdate.source;
      currentSession.source.lastSeen = dateNow;
      if (sessUpdate.target) {currentSession.target = sessUpdate.target;}
      if (sessUpdate.target) {currentSession.target.lastSeen = dateNow;}
      currentSession.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.node.url = sessUpdate.url;
      currentSession.node.entity = sessUpdate.tags.entity;
      currentSession.node.text = sessUpdate.tags.entity + "|" + sessUpdate.tags.channel;
      currentSession.node.age = 1e-6;
      currentSession.node.ageMaxRatio = 1e-6;
      currentSession.node.isGroupNode = false;
      currentSession.node.isSessionNode = true;
      currentSession.node.nodeType = "session"; // KLUDGE
      currentSession.node.isDead = false;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;
      currentSession.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.node.mentions = sessUpdate.wordChainIndex;

      currentSession.node.groupColors = {};
      currentSession.node.groupColors = currentGroup.groupColors;
      currentSession.node.interpolateGroupColor = currentGroup.interpolateGroupColor;
      currentSession.node.interpolateColor = currentGroup.interpolateGroupColor;
      
      currentSession.node.sessionColors = {};
      currentSession.node.sessionColors = currentGroup.sessionColors;
      currentSession.node.interpolateSessionColor = currentGroup.interpolateSessionColor;
      
      currentSession.node.nodeColors = {};
      currentSession.node.nodeColors = currentGroup.nodeColors;
      currentSession.node.interpolateNodeColor = currentGroup.interpolateNodeColor;
      
      var sessionLinkId = (config.forceViewMode == "web") ? currentSession.node.nodeId : currentSession.node.nodeId + "_" + sessUpdate.source.nodeId;
      
      currentSession.node.links = {};
      currentSession.node.links[sessionLinkId] = 1;

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.nodeId));
        });
      });      
    } 
    else {

      sessionsCreated += 1;

      var tarNodId = "<null>";

      if (sessUpdate.target) {tarNodId = sessUpdate.target.nodeId;}

      console.log("+ SES" 
        + " [" + sessUpdate.wordChainIndex + "]" 
        + " U: " + sessUpdate.userId 
        // + " P: " + sessUpdate.profileImageUrl 
        + " E: " + sessUpdate.tags.entity 
        + " C: " + sessUpdate.tags.channel 
        // + " URL: " + sessUpdate.url 
        + " " + sessUpdate.source.nodeId 
        + " > " + tarNodId
      );

      currentSession = {};

      currentSession.tags = {};

      currentSession.groupColors = {};
      currentSession.sessionColors = {};
      currentSession.nodeColors = {};

      // currentSession.node = {};
      // currentSession.node.sessionColors = {};
      // currentSession.node.groupColors = {};
      // currentSession.node.nodeColors = {};
      // currentSession.node.links = {};

      currentSession.groupId = currentGroup.groupId;
      currentSession.url = sessUpdate.url;
      currentSession.age = 1e-6;
      currentSession.ageMaxRatio = 1e-6;
      currentSession.mentions = 1;
      currentSession.lastSeen = dateNow;
      currentSession.rank = -1;
      currentSession.isSession = true;
      // currentSession.nodeId = sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.nodeId = (config.forceViewMode == "web") ? sessUpdate.tags.entity : sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.sessionId = sessUpdate.sessionId;
      currentSession.tags = sessUpdate.tags;
      currentSession.userId = sessUpdate.userId;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
      currentSession.source = sessUpdate.source;
      currentSession.target = sessUpdate.target;
      currentSession.linkHashMap = new HashMap();
      currentSession.initialPosition = currentGroup.initialPosition;
      currentSession.x = currentGroup.initialPosition.x;
      currentSession.y = currentGroup.initialPosition.y;

      currentSession.sessionColors = currentGroup.sessionColors;
      currentSession.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.groupColors = currentGroup.groupColors;
      currentSession.interpolateGroupColor = currentGroup.interpolateGroupColor;

      currentSession.nodeColors = currentGroup.nodeColors;
      currentSession.interpolateNodeColor = currentGroup.interpolateNodeColor;

      // CREATE SESSION NODE

      currentSession.node = {};
      currentSession.node.sessionColors = {};
      currentSession.node.groupColors = {};
      currentSession.node.nodeColors = {};
      currentSession.node.links = {};
      currentSession.node.nodeType = "session";
      currentSession.node.isSessionNode = true;
      currentSession.node.isGroupNode = false;
      currentSession.node.isDead = false;
      // currentSession.node.nodeId = sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.node.nodeId = currentSessionNodeId;

      currentSession.node.entity = sessUpdate.tags.entity;
      currentSession.node.channel = sessUpdate.tags.channel;
      currentSession.node.userId = sessUpdate.userId;
      currentSession.node.sessionId = sessUpdate.sessionId;
      currentSession.node.url = sessUpdate.url;
      currentSession.node.imageUrl = sessUpdate.imageUrl;
      currentSession.node.profileImageUrl = sessUpdate.profileImageUrl;
      currentSession.node.age = 1e-6;
      currentSession.node.ageMaxRatio = 1e-6;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;
      currentSession.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.node.mentions = sessUpdate.wordChainIndex;
      currentSession.node.text = sessUpdate.tags.entity + "|" + sessUpdate.tags.channel;
      currentSession.node.r = config.defaultNodeRadius;
      currentSession.node.x = currentGroup.initialPosition.x;
      currentSession.node.y = currentGroup.initialPosition.y;

      currentSession.node.sessionColors = currentGroup.sessionColors;
      currentSession.node.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.node.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.node.groupColors = currentGroup.groupColors;
      currentSession.node.interpolateGroupColor = currentGroup.interpolateGroupColor;

      currentSession.node.nodeColors = currentGroup.nodeColors;
      currentSession.node.interpolateNodeColor = currentGroup.interpolateNodeColor;


      currentSession.source.lastSeen = dateNow;
      if (currentSession.target) {
        currentSession.target.lastSeen = dateNow;
      }

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
 
        currentSessionView.addNode(sesNode);

        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          currentSessionView.addSession(cSession);
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.nodeId));
        });
      });
    }
  }
};

var createNode = function(callback) {

  if (nodeCreateQueue.length > 0) {

    var dateNow = moment().valueOf();

    var session = nodeCreateQueue.shift();

    if (nodeHashMap.has(session.node.nodeId)) {

      var sessionNode = nodeHashMap.get(session.node.nodeId);
      sessionNode.isTopTerm = session.node.isTopTerm;
      sessionNode.age = 1e-6;
      sessionNode.ageMaxRatio = 1e-6;
      sessionNode.isDead = false;
      sessionNode.wordChainIndex = session.wordChainIndex;
      sessionNode.mentions = session.wordChainIndex;

      session.node = sessionNode;

      addToHashMap(nodeHashMap, session.node.nodeId, sessionNode, function(sNode) {
        // currentSessionView.addNode(sNode);
      });

    } 
    else {

      console.info("+ SES" 
        + " | " + session.node.nodeId
        + " | Ms: " + session.node.mentions
      );

      session.node.bboxWidth = 1e-6;
      session.node.nodeType = "session";
      session.node.isSessionNode = true;
      session.node.isGroupNode = false;
      // session.node.nodeId = session.tags.entity + "_" + session.tags.channel;
      session.node.nodeId = (config.forceViewMode == "web") ? session.tags.entity : session.tags.entity + "_" + session.tags.channel;
      session.node.entity = session.tags.entity;
      session.node.channel = session.tags.channel;
      session.node.url = session.url;
      session.node.text = session.tags.entity + "|" + session.tags.channel;
      session.node.userId = session.userId;
      session.node.sessionId = session.sessionId;
      session.node.age = 1e-6;
      session.node.ageMaxRatio = 1e-6;
      session.node.isDead = false;
      session.node.wordChainIndex = session.wordChainIndex;
      session.node.mentions = session.wordChainIndex+1;
      session.node.r = config.defaultNodeRadius;
      session.node.x = session.initialPosition.x;
      session.node.y = session.initialPosition.y;

      session.node.groupColors = session.groupColors;
      session.node.sessionColors = session.sessionColors;
      session.node.nodeColors = session.nodeColors;
      session.node.interpolateGroupColor = session.interpolateGroupColor;
      session.node.interpolateNodeColor = session.interpolateNodeColor;
      session.node.interpolateSessionColor = session.interpolateSessionColor;
      session.node.interpolateColor = session.interpolateSessionColor;

      addToHashMap(nodeHashMap, session.node.nodeId, session.node, function(sNode) {
        currentSessionView.addNode(sNode);
      });
    }

    var sourceNodeId;
    var targetNodeId;

    if (config.sessionViewType == "force") {
      sourceNodeId = session.source.nodeId;
      if (session.target) {
        targetNodeId = session.target.nodeId;
      }
    }
    else if (config.sessionViewType === "treemap"){
      sourceNodeId = session.source.nodeId;
    }
    else if (config.sessionViewType === "treepack"){
      sourceNodeId = session.source.nodeId;
    }
    else if (config.sessionViewType === "histogram"){
      sourceNodeId = session.source.nodeId;
    }
    else if ((config.sessionViewType === "ticker") 
      || (config.sessionViewType === "flow")
      ){
      sourceNodeId = session.source.nodeId + "_" + moment().valueOf();
      if (session.target) {
        targetNodeId = session.target.nodeId + "_" + moment().valueOf();
      }
    }
    else {
      sourceNodeId = session.source.nodeId;
      targetNodeId = session.target.nodeId;
    }

    var sourceText = session.source.nodeId;
    var targetText = session.target ? session.target.nodeId : null;

    var targetNode = {};
    var sourceNode = {};

    async.parallel({
        source: function(cb) {
          if ((config.sessionViewType !== "ticker") 
            && (config.sessionViewType !== "treemap") 
            && (config.sessionViewType !== "treepack") 
            && (config.sessionViewType !== "histogram") 
            && (config.sessionViewType !== "flow") 
            && (config.sessionViewType !== "force") 
            && (config.sessionViewType !== "media") 
            && session.source.isIgnored) {
            cb(null, {
              node: sourceNodeId,
              isIgnored: true,
              isNew: false
            });
          } 
          else if (nodeHashMap.has(sourceNodeId)) {
            sourceNode = nodeHashMap.get(sourceNodeId);
            sourceNode.sessionNodeId = session.node.nodeId;
            sourceNode.isTopTerm = session.source.isTopTerm;
            sourceNode.isTrendingTopic = session.source.isTrendingTopic;

            sourceNode.category = session.source.category;
            sourceNode.categoryAuto = session.source.categoryAuto;

            var category;
            if (config.autoCategoryFlag && session.source.categoryAuto){
              category = session.source.categoryAuto;
            }
            else {
              category = session.source.category;
            }

            getCategoryColor(category, function(color){
              sourceNode.categoryColor = color;
            });

            sourceNode.latestNode = true;
            sourceNode.newFlag = false;
            sourceNode.userId = session.userId;
            sourceNode.sessionId = session.sessionId;
            sourceNode.groupId = session.groupId;
            sourceNode.channel = session.tags.channel;
            sourceNode.entity = session.tags.entity;
            sourceNode.url = session.url;
            sourceNode.age = 1e-6;
            sourceNode.ageMaxRatio = 1e-6;
            sourceNode.isDead = false;
            sourceNode.ageUpdated = dateNow;
            sourceNode.lastSeen = dateNow;

            if (ignoreWordHashMap.has(sourceText)) {
              sourceNode.isIgnored = true;
            }

            sourceNode.groupColors = session.groupColors;
            sourceNode.sessionColors = session.sessionColors;
            sourceNode.nodeColors = session.nodeColors;
            sourceNode.interpolateGroupColor = session.interpolateGroupColor;
            sourceNode.interpolateNodeColor = session.interpolateNodeColor;
            sourceNode.interpolateSessionColor = session.interpolateSessionColor;
            sourceNode.interpolateColor = session.interpolateSessionColor;

            if (sourceNode.isSessionNode){
              sourceNode.nodeType = "session";
              sourceNode.text = session.tags.entity + "|" + session.tags.channel;
              sourceNode.wordChainIndex = session.source.wordChainIndex;
              sourceNode.mentions = session.source.wordChainIndex;
            }
            else {
              sourceNode.nodeType = "word"; // KLUDGE. really not hashtag
              sourceNode.text = sourceText;
              sourceNode.mentions = session.source.mentions;
            }

            addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode) {
              cb(null, {
                node: sNode,
                isIgnored: false,
                isNew: false
              });
            });
          } 
          else {
            sourceNode = session.source;
            sourceNode.nodeId = sourceNodeId;
            sourceNode.sessionNodeId = session.node.nodeId;
            sourceNode.bboxWidth = 1e-6;
            sourceNode.isIgnored = session.source.isIgnored;
            if (ignoreWordHashMap.has(sourceText)) {
              sourceNode.isIgnored = true;
            }
            sourceNode.isTopTerm = session.source.isTopTerm;

            var category;
            if (config.autoCategoryFlag && session.source.categoryAuto){
              category = session.source.categoryAuto;
            }
            else {
              category = session.source.category;
            }

            if (category) {
              getCategoryColor(category, function(color){
                sourceNode.categoryColor = color;
              });
            }
            else {
              console.error("KEWORDS UNDEFINED");
              sourceNode.categoryColor = palette.black;
            }

            sourceNode.isTrendingTopic = session.source.isTrendingTopic;
            sourceNode.newFlag = true;
            sourceNode.latestNode = true;
            sourceNode.nodeType = "word"; // KLUDGE
            sourceNode.isSessionNode = false;
            sourceNode.isGroupNode = false;
            sourceNode.userId = session.userId;
            sourceNode.groupId = session.groupId;
            sourceNode.channel = session.tags.channel;
            sourceNode.entity = session.tags.entity;
            sourceNode.sessionId = session.sessionId;
            sourceNode.url = session.url;
            sourceNode.links = {};
            sourceNode.rank = -1;
            sourceNode.age = 1e-6;
            sourceNode.ageMaxRatio = 1e-6;
            sourceNode.isDead = false;
            sourceNode.lastSeen = dateNow;
            sourceNode.ageUpdated = dateNow;

            sourceNode.groupColors = session.groupColors;
            sourceNode.sessionColors = session.sessionColors;
            sourceNode.nodeColors = session.nodeColors;

            sourceNode.interpolateGroupColor = session.interpolateGroupColor;
            sourceNode.interpolateNodeColor = session.interpolateNodeColor;
            sourceNode.interpolateSessionColor = session.interpolateSessionColor;
            sourceNode.interpolateColor = session.interpolateSessionColor;

            sourceNode.r = config.defaultNodeRadius;
            sourceNode.x = session.node.x+randomIntFromInterval(-20,-30);
            sourceNode.y = session.node.y+randomIntFromInterval(-10,10);

            sourceNode.text = sourceText;
            sourceNode.mentions = session.source.mentions;

            addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode) {
              cb(null, {
                node: sNode,
                isIgnored: false,
                isNew: true
              });
            });
          }

        },

        target: function(cb) {

          if (targetNodeId === undefined 
            || (config.sessionViewType === "media") 
            || (config.sessionViewType === "flow") 
            || (config.sessionViewType === "treemap") 
            || (config.sessionViewType === "treepack") 
            || (config.sessionViewType === "histogram") 
            || (config.sessionViewType === "ticker")) {
            cb("TARGET UNDEFINED", null);
          } 
          else if (session.target.isIgnored) {
            cb(null, {
              node: targetNodeId,
              isIgnored: true,
              isNew: false
            });
          } 
          else if (nodeHashMap.has(targetNodeId)) {
            targetNode = nodeHashMap.get(targetNodeId);
            targetNode.sessionNodeId = session.node.nodeId;
            targetNode.newFlag = false;
            if (ignoreWordHashMap.has(targetText)) {
              targetNode.isIgnored = true;
            }
            targetNode.nodeType = "word"; // KLUDGE
            targetNode.isTrendingTopic = session.target.isTrendingTopic;
            targetNode.isTopTerm = session.target.isTopTerm;
            targetNode.userId = session.userId;
            targetNode.sessionId = session.sessionId;
            targetNode.groupId = session.groupId;
            targetNode.channel = session.tags.channel;
            targetNode.entity = session.tags.entity;
            targetNode.url = session.url;
            targetNode.age = 1e-6;
            targetNode.ageMaxRatio = 1e-6;
            targetNode.isDead = false;
            targetNode.ageUpdated = dateNow;
            targetNode.lastSeen = dateNow;

            targetNode.groupColors = session.groupColors;
            targetNode.sessionColors = session.sessionColors;
            targetNode.nodeColors = session.nodeColors;
            targetNode.interpolateGroupColor = session.interpolateGroupColor;
            targetNode.interpolateNodeColor = session.interpolateNodeColor;
            targetNode.interpolateSessionColor = session.interpolateSessionColor;
            targetNode.interpolateColor = session.interpolateSessionColor;

            targetNode.latestNode = false;

            if (targetNode.isSessionNode){
              targetNode.nodeType = "session"; // KLUDGE
              targetNode.text = session.tags.entity + "|" + session.tags.channel;
              targetNode.wordChainIndex = session.target.wordChainIndex;
              targetNode.mentions = session.target.wordChainIndex;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x;
              targetNode.y = session.node.y;
            }
            else {
              targetNode.text = targetText;
              if (session.target.mentions !== undefined) {
                console.info("--- TARGET MENTIONS: " + session.target.mentions);
                targetNode.mentions = session.target.mentions;
              }
              else {
                console.debug("??? TARGET MENTIONS UNDEFINED\n" + jsonPrint(session.target));
                targetNode.mentions = 1;
              } 
            }

            addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode) {
              cb(null, {
                node: tNode,
                isIgnored: false,
                isNew: false
              });
            });
          } 
          else {
            targetNode = session.target;
            targetNode.nodeId = targetNodeId;
            targetNode.sessionNodeId = session.node.nodeId;
            targetNode.bboxWidth = 1e-6;
            targetNode.newFlag = true;
            targetNode.nodeType = "word"; // KLUDGE
            targetNode.isSessionNode = false;
            targetNode.isGroupNode = false;
            if (ignoreWordHashMap.has(targetText)) {
              targetNode.isIgnored = true;
            }
            targetNode.isTrendingTopic = session.target.isTrendingTopic;
            targetNode.isTopTerm = session.target.isTopTerm;

            var category;
            if (config.autoCategoryFlag && session.target.categoryAuto){
              category = session.target.categoryAuto;
            }
            else {
              category = session.target.category;
            }

            if (category) {
              getCategoryColor(category, function(color){
                targetNode.categoryColor = color;
              });
            }
            else {
              console.error("KEWORDS UNDEFINED");
              targetNode.categoryColor = palette.black;
            }

            targetNode.userId = session.userId;
            targetNode.groupId = session.groupId;
            targetNode.channel = session.tags.channel;
            targetNode.entity = session.tags.entity;
            targetNode.url = session.url;
            targetNode.sessionId = session.sessionId;
            targetNode.links = {};
            targetNode.rank = -1;
            targetNode.age = 1e-6;
            targetNode.ageMaxRatio = 1e-6;
            targetNode.isDead = false;
            targetNode.lastSeen = dateNow;
            targetNode.ageUpdated = dateNow;

            targetNode.groupColors = session.groupColors;
            targetNode.sessionColors = session.sessionColors;
            targetNode.nodeColors = session.nodeColors;
            targetNode.interpolateGroupColor = session.interpolateGroupColor;
            targetNode.interpolateNodeColor = session.interpolateNodeColor;
            targetNode.interpolateSessionColor = session.interpolateSessionColor;
            targetNode.interpolateColor = session.interpolateSessionColor;

            targetNode.latestNode = false;
            
            targetNode.text = targetText;
            if (session.target.mentions === undefined) {console.error("session.target.mentions UNDEFINED");}
            targetNode.mentions = session.target.mentions;
            targetNode.r = config.defaultNodeRadius;
            targetNode.x = session.node.x - (100 * Math.random());
            targetNode.y = session.node.y - (20 - 20 * Math.random());

            addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode) {
              cb(null, {
                node: tNode,
                isIgnored: false,
                isNew: true
              });
            });
          }
        }
      },
      function(err, results) {

        // console.debug("createNode\n" + jsonPrint(results));
        if (results.source.isIgnored) {
          console.debug("createNode IGNORE SOURCE: " + results.source.node.nodeId);
        }

        if (results.target && results.target.isIgnored) {
          console.debug("createNode IGNORE TARGET: " + results.target.node.nodeId);
        }


        if (!results.source.isIgnored) {
          session.source = results.source.node;
          session.source.isNew = results.source.isNew;
          if (results.source.isNew) {
            if (results.source.node.mentions === undefined) {
              console.error("source MENTIONS UNDEFINED\n" + jsonPrint(results.source.node));
            }
            currentSessionView.addNode(results.source.node);
          }
        }

        if (results.target && !results.target.isIgnored) {
          session.target = results.target.node;
          session.target.isNew = results.target.isNew;
          if (results.target.isNew) {
            if (results.target.node.mentions === undefined) {
              console.error("target MENTIONS UNDEFINED\n" + jsonPrint(results.target.node));
            }
            currentSessionView.addNode(results.target.node);
          }
        }

        addToHashMap(sessionHashMap, session.nodeId, session, function(cSession) {
          if (!results.source.isIgnored 
            && (config.sessionViewType !== "media") 
            && (config.sessionViewType !== "ticker") 
            && (config.sessionViewType !== "treemap") 
            && (config.sessionViewType !== "treepack") 
            && (config.sessionViewType !== "histogram") 
            && (config.sessionViewType !== "flow")) {
            linkCreateQueue.push(cSession);
          }
        });
      });
  }
  return (callback(null, sessionId));
};

var prevSessionLinkIdHash = {};

var createLink = function(callback) {

  if ((config.sessionViewType !== "ticker") 
    && (config.sessionViewType !== "flow") 
    && (config.sessionViewType !== "treemap") 
    && (config.sessionViewType !== "treepack") 
    && (config.sessionViewType !== "histogram") 
    && (config.sessionViewType !== "media") 
    && !config.disableLinks 
    && (linkCreateQueue.length > 0)) {

    var session = linkCreateQueue.shift();

    currentGroup = groupHashMap.get(session.tags.group.groupId);

    var groupLinkId;
    var sessionLinkId;

    if (config.sessionViewType == "force") {

      sessionLinkId = session.node.nodeId + "_" + session.source.nodeId;

      console.info("sessionLinkId: " + sessionLinkId);

      session.node.links[sessionLinkId] = 1;
      session.source.links[sessionLinkId] = 1;

      if (!linkHashMap.has(sessionLinkId)){

        var newSessionLink = {
          linkId: sessionLinkId,
          sessionId: session.node.nodeId,
          age: 0,
          isDead: false,
          source: session.node,
          target: session.source,
          isGroupLink: false,
          isSessionLink: true
        };

        addToHashMap(linkHashMap, sessionLinkId, newSessionLink, function(sesLink) {
          currentSessionView.addLink(sesLink);
          prevSessionLinkIdHash[session.node.nodeId] = sessionLinkId;
        });
      }
      else {
        var sessionLink = linkHashMap.get(sessionLinkId);
        sessionLink.age = 0;
        sessionLink.isDead = false;

        addToHashMap(linkHashMap, sessionLinkId, sessionLink, function(sesLink) {
          currentSessionView.addLink(sesLink);
          prevSessionLinkIdHash[session.node.nodeId] = sessionLinkId;
        });
      }

      if (session.target){

        // console.debug("TARGET: " + session.target.nodeId);

        var sourceTargetLinkId = session.source.nodeId + "_" + session.target.nodeId;

        if (session.target.links === undefined) {session.target.links = {};}

        session.source.links[sourceTargetLinkId] = 1;
        session.target.links[sourceTargetLinkId] = 1;

        if (!linkHashMap.has(sourceTargetLinkId)){

          var newSourceTargetLink = {
            linkId: sourceTargetLinkId,
            sessionId: session.node.nodeId,
            age: 0,
            isDead: false,
            source: session.source,
            target: session.target,
            isGroupLink: false,
            isSessionLink: false
          };

          addToHashMap(linkHashMap, sourceTargetLinkId, newSourceTargetLink, function(srcTgtLink) {
            currentSessionView.addLink(srcTgtLink);
          });
        }
        else {
          var sourceTargetLink = linkHashMap.get(sourceTargetLinkId);
          sourceTargetLink.age = 0;
          sourceTargetLink.isDead = false;

          addToHashMap(linkHashMap, sourceTargetLinkId, sourceTargetLink, function(srcTgtLink) {
            currentSessionView.addLink(srcTgtLink);
          });
        }
      }
    }
    else if (currentGroup === undefined){
      console.warn("currentGroup UNDEFINED");
    }
    else {
      console.warn("SOURCE == TARGET ?"
        + " | " + currentGroup.node.nodeId
        + " | " + session.node.nodeId
      );
    }

    addToHashMap(sessionHashMap, session.nodeId, session, function(sess) {});
  }
  return (callback(null, sessionId));
};

var updateSessionsReady = true;

function updateSessions() {

  updateSessionsReady = false;

  if (config.forceViewMode === "web") {
  }
  else {
    async.series(
      [
        processLinkDeleteQueue,
        processNodeDeleteQueue,
        processSessionQueues,
        createGroup,
        createSession,
        createNode,
        createLink
      ],

      function(err, result) {
        if (err) {
          console.error("*** ERROR: updateSessions *** \nERROR: " + err);
        }
        updateSessionsReady = true;

      }
    );
  }
}

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

  // if (currentSessionView) currentSessionView.resize();
}

var updateSessionsInterval;

function clearUpdateSessionsInterval() {
  clearInterval(updateSessionsInterval);
}

function initUpdateSessionsInterval(interval) {

  console.debug("initUpdateSessionsInterval: " + interval);

  clearInterval(updateSessionsInterval);

  updateSessionsInterval = setInterval(function() {
    if (updateSessionsReady) {updateSessions();}
  }, interval);
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

  switch (svt) {
    case "ticker":
      config.sessionViewType = "ticker";
      config.forceViewMode = "flow";
      requirejs(["js/libs/sessionViewTicker"], function() {
        console.debug("sessionViewTicker LOADED");

        currentSessionView = new ViewTicker();
        initSocketSessionUpdateRx();

        callback();
      });
      break;
    case "media":
      config.sessionViewType = "media";
      requirejs(["js/libs/sessionViewMedia"], function() {
        console.debug("sessionViewMedia LOADED");
        DEFAULT_COLLISION_RADIUS_MULTIPLIER = MEDIAVIEW_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
        DEFAULT_COLLISION_ITERATIONS = MEDIAVIEW_DEFAULT.COLLISION_ITERATIONS;
        DEFAULT_MAX_AGE = MEDIAVIEW_DEFAULT.MAX_AGE;
        DEFAULT_CHARGE = MEDIAVIEW_DEFAULT.CHARGE;
        DEFAULT_GRAVITY = MEDIAVIEW_DEFAULT.GRAVITY;
        DEFAULT_NODE_RADIUS_MIN_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MIN_RATIO;
        DEFAULT_NODE_RADIUS_MAX_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MAX_RATIO;
        DEFAULT_VELOCITY_DECAY = MEDIAVIEW_DEFAULT.VELOCITY_DECAY;
        DEFAULT_LINK_DISTANCE= MEDIAVIEW_DEFAULT.LINK_DISTANCE;
        DEFAULT_LINK_STRENGTH = MEDIAVIEW_DEFAULT.LINK_STRENGTH;
        DEFAULT_FORCEY_MULTIPLIER = MEDIAVIEW_DEFAULT.FORCEY_MULTIPLIER;

        currentSessionView = new ViewMedia();
        initSocketNodeRx();
        initSocketSessionUpdateRx();

        callback();
      });
      break;
    case "flow":
      config.sessionViewType = "flow";
      config.forceViewMode = "flow";
      requirejs(["js/libs/sessionViewFlow"], function() {
        console.debug("sessionViewFlow LOADED");

        DEFAULT_COLLISION_RADIUS_MULTIPLIER = FLOW_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
        DEFAULT_COLLISION_ITERATIONS = FLOW_DEFAULT.COLLISION_ITERATIONS;
        DEFAULT_MAX_AGE = FLOW_DEFAULT.MAX_AGE;
        DEFAULT_CHARGE = FLOW_DEFAULT.CHARGE;
        DEFAULT_GRAVITY = FLOW_DEFAULT.GRAVITY;
        DEFAULT_NODE_RADIUS_MIN_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MIN_RATIO;
        DEFAULT_NODE_RADIUS_MAX_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MAX_RATIO;
        DEFAULT_VELOCITY_DECAY = FLOW_DEFAULT.VELOCITY_DECAY;
        DEFAULT_FORCEX_MULTIPLIER = FLOW_DEFAULT.FORCEX_MULTIPLIER;
        DEFAULT_FORCEX_SESSION_MULTIPLIER = FLOW_DEFAULT.FORCEX_SESSION_MULTIPLIER;
        DEFAULT_FORCEY_MULTIPLIER = FLOW_DEFAULT.FORCEY_MULTIPLIER;
        DEFAULT_FONT_SIZE_MIN_RATIO = FLOW_DEFAULT.FONT_SIZE_MIN_RATIO;
        DEFAULT_FONT_SIZE_MAX_RATIO = FLOW_DEFAULT.FONT_SIZE_MAX_RATIO;

        currentSessionView = new ViewFlow();
        initSocketSessionUpdateRx();

        callback();
      });
      break;
    case "treepack":
      config.sessionViewType = "treepack";
      config.forceViewMode = "flow";
      requirejs(["js/libs/sessionViewTreepack"], function() {
        console.debug("sessionViewTreepack LOADED");
        DEFAULT_TRANSITION_DURATION = TREEPACK_DEFAULT.TRANSITION_DURATION;
        DEFAULT_MAX_AGE = TREEPACK_DEFAULT.MAX_AGE;
        DEFAULT_COLLISION_RADIUS_MULTIPLIER = TREEPACK_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
        DEFAULT_COLLISION_ITERATIONS = TREEPACK_DEFAULT.COLLISION_ITERATIONS;
        DEFAULT_CHARGE = TREEPACK_DEFAULT.CHARGE;
        DEFAULT_GRAVITY = TREEPACK_DEFAULT.GRAVITY;
        DEFAULT_NODE_RADIUS_MIN_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MIN_RATIO;
        DEFAULT_NODE_RADIUS_MAX_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MAX_RATIO;
        DEFAULT_VELOCITY_DECAY = TREEPACK_DEFAULT.VELOCITY_DECAY;
        DEFAULT_FORCEX_MULTIPLIER = TREEPACK_DEFAULT.FORCEX_MULTIPLIER;
        DEFAULT_FORCEY_MULTIPLIER = TREEPACK_DEFAULT.FORCEY_MULTIPLIER;
        DEFAULT_FONT_SIZE_MIN_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MIN_RATIO;
        DEFAULT_FONT_SIZE_MAX_RATIO = TREEPACK_DEFAULT.FONT_SIZE_MAX_RATIO;

        currentSessionView = new ViewTreepack();
        initSocketSessionUpdateRx();

        callback();
      });
      break;
    case "treemap":
      config.sessionViewType = "treemap";
      config.forceViewMode = "flow";
      requirejs(["js/libs/sessionViewTreemap"], function() {
        console.debug("sessionViewTreemap LOADED");
        DEFAULT_MAX_AGE = TREEMAPVIEW_DEFAULT.MAX_AGE;

        currentSessionView = new ViewTreemap();
        initSocketNodeRx();
        initSocketSessionUpdateRx();

        callback();
      });
      break;
    case "histogram":
      config.sessionViewType = "histogram";
      config.forceViewMode = "flow";
      requirejs(["js/libs/sessionViewHistogram"], function() {
        console.debug("sessionViewHistogram LOADED");
        DEFAULT_MAX_AGE = HISTOGRAMVIEW_DEFAULT.MAX_AGE;
        DEFAULT_FONT_SIZE_MIN_RATIO = HISTOGRAMVIEW_DEFAULT.FONT_SIZE_MIN_RATIO;
        DEFAULT_FONT_SIZE_MAX_RATIO = HISTOGRAMVIEW_DEFAULT.FONT_SIZE_MAX_RATIO;

        currentSessionView = new ViewHistogram();
        initSocketNodeRx();
        initSocketSessionUpdateRx();

        callback();
      });
      break;
    default:
      config.sessionViewType = "force";
      config.forceViewMode = "web";
      requirejs(["js/libs/sessionViewForce"], function() {
        console.debug("sessionViewForce LOADED");
        DEFAULT_COLLISION_RADIUS_MULTIPLIER = FORCEVIEW_DEFAULT.COLLISION_RADIUS_MULTIPLIER;
        DEFAULT_COLLISION_ITERATIONS = FORCEVIEW_DEFAULT.COLLISION_ITERATIONS;
        DEFAULT_MAX_AGE = FORCEVIEW_DEFAULT.MAX_AGE;
        DEFAULT_CHARGE = FORCEVIEW_DEFAULT.CHARGE;
        DEFAULT_GRAVITY = FORCEVIEW_DEFAULT.GRAVITY;
        DEFAULT_NODE_RADIUS_MIN_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MIN_RATIO;
        DEFAULT_NODE_RADIUS_MAX_RATIO = MEDIAVIEW_DEFAULT.NODE_RADIUS_MAX_RATIO;
        DEFAULT_VELOCITY_DECAY = FORCEVIEW_DEFAULT.VELOCITY_DECAY;
        DEFAULT_LINK_DISTANCE= FORCEVIEW_DEFAULT.LINK_DISTANCE;
        DEFAULT_LINK_STRENGTH = FORCEVIEW_DEFAULT.LINK_STRENGTH;
        DEFAULT_FORCEY_MULTIPLIER = FORCEVIEW_DEFAULT.FORCEY_MULTIPLIER;
        DEFAULT_FONT_SIZE_MIN_RATIO = FORCEVIEW_DEFAULT.FONT_SIZE_MIN_RATIO;
        DEFAULT_FONT_SIZE_MAX_RATIO = FORCEVIEW_DEFAULT.FONT_SIZE_MAX_RATIO;

        currentSessionView = new ViewForce();
        initSocketNodeRx();
        initSocketSessionUpdateRx();

        callback();
      });
  }
}

function initIgnoreWordsHashMap(callback) {
  async.each(ignoreWordsArray, function(ignoreWord, cb) {
    addToHashMap(ignoreWordHashMap, ignoreWord, true, function() {
      cb();
    });
  }, function(err) {
    callback();
  });
}

function onFullScreenChange() {
  var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
  // if in fullscreen mode fullscreenElement won"t be null
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

    document.dispatchEvent(sessionDragEndEvent);

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

          if (config.sessionViewType === "force") {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType === "ticker") {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType === "flow") {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType === "treemap") {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType === "treepack") {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType === "histogram") {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }

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
              config = storedConfig;
              config.authenticationUrl = DEFAULT_AUTH_URL;

              if (config.sessionViewType === "ticker") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
              if (config.sessionViewType === "flow") {
                initUpdateSessionsInterval(50);
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
              if (config.sessionViewType === "treemap") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
              if (config.sessionViewType === "treepack") {
                initUpdateSessionsInterval(50);
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
              if (config.sessionViewType === "histogram") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
              if (config.sessionViewType === "force") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initUpdateSessionsInterval(50);
              }
              if (config.sessionViewType === "media") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
              }
            }
            else {
              console.debug("STORED CONFIG NOT FOUND: " + storedConfigName);

              if (config.sessionViewType === "ticker") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
              }
              if (config.sessionViewType === "flow") {
                initUpdateSessionsInterval(50);
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
              }
              if (config.sessionViewType === "treemap") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
              }
              if (config.sessionViewType === "treepack") {
                initUpdateSessionsInterval(50);
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
              }
              if (config.sessionViewType === "histogram") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
              }
              if (config.sessionViewType === "force") {
                currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
                initUpdateSessionsInterval(50);
              }
              if (config.sessionViewType === "media") {
                currentSessionView.setNodeMaxAge(MEDIA_MAX_AGE);
              }
            }

            currentSessionView.initD3timer();

            initStatsUpdate(5000);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

            viewerObj.timeStamp = moment().valueOf();
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) { displayStats(false, palette.white); }
              if (!config.showStatsFlag) { displayControl(false); }
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

              config = storedConfig;
              config.authenticationUrl = DEFAULT_AUTH_URL;

              if (config.sessionViewType === "force") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                  initUpdateSessionsInterval(50);
                });
              }
              if (config.sessionViewType === "ticker") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "flow") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treemap") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treepack") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "histogram") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
            }
            else {
              if (config.sessionViewType === "force") {
                currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                  initUpdateSessionsInterval(50);
                });
              }
              if (config.sessionViewType === "ticker") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "flow") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treemap") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treepack") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType == "histogram") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
            }

            currentSessionView.simulationControl("START");
            currentSessionView.resize();

            initStatsUpdate(5000);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

            viewerObj.timeStamp = moment().valueOf();
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) {displayStats(false, palette.white);}
              if (!config.showStatsFlag) {displayControl(false);}
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

              config = storedConfig;
              config.authenticationUrl = DEFAULT_AUTH_URL;

              if (config.sessionViewType === "force") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "ticker") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "flow") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treemap") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treepack") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "histogram") {
                currentSessionView.setNodeMaxAge(config.defaultMaxAge);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
            }
            else {
              if (config.sessionViewType === "force") {
                currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "ticker") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "flow") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treemap") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "treepack") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initUpdateSessionsInterval(50);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
              if (config.sessionViewType === "histogram") {
                currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
                initIgnoreWordsHashMap(function() {
                  console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
                });
              }
            }

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initStatsUpdate(5000);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

          viewerObj.timeStamp = moment().valueOf();
          socket.emit("VIEWER_READY", viewerObj);

          setTimeout(function() {
            console.error("END PAGE LOAD TIMEOUT");
            pageLoadedTimeIntervalFlag = false;
            if (!config.showStatsFlag) { displayStats(false, palette.white); }
            if (!config.showStatsFlag) { displayControl(false); }
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
