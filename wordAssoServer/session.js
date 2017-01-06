/*ver 0.47*/
/*jslint node: true */
"use strict";

/*
to create links in ticker view, need a way to track which words are the same in all streams/groups/sessions.
then just create links between the common words in each stream
should all instances of the word to be linked to all of the others? 
hashmap
word -> array of nodes
when new instance of word arrives, iterate thru array of nodes and create linkskk
*/

// var DEFAULT_SOURCE = "http://localhost:9997";
// var DEFAULT_SOURCE = "http://word.threeceelabs.com";
var DEFAULT_SOURCE = "==SOURCE==";  // will be updated by wordAssoServer.js on app.get

var d3;
var controlPanel;
var controlPanelWindow; 
var controlPanelFlag = false;

var statsTable ;

var initializedFlag = false;
var statsTableFlag = false;

// requirejs(["http://d3js.org/d3.v4.min.js"], function(d3Loaded) {
requirejs(["https://cdnjs.cloudflare.com/ajax/libs/d3/4.4.0/d3.min.js"], function(d3Loaded) {
    console.log("d3 LOADED");
    d3 = d3Loaded;
    initialize(function(){
      initializedFlag = true;
      createStatsTable(function(){
        statsTableFlag = true;
      });
      addControlButton();
      addBlahButton();
      addStatsButton();
      if (!config.pauseFlag) currentSessionView.simulationControl('RESUME');
    });
  },
  function(error) {
    console.log('REQUIREJS ERROR handler', error);
    //error.requireModules : is Array of all failed modules
    var failedId = error.requireModules && error.requireModules[0];
    console.log(failedId);
    console.log(error.message);
  }
);

var DEFAULT_SESSION_VIEW = 'flow';
var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var pageLoadedTimeIntervalFlag = true;

var debug = false;
var DEFAULT_BLAH_MODE = true;
var MAX_RX_QUEUE = 250;
var QUEUE_MAX = 200;
var MAX_WORDCHAIN_LENGTH = 100;
var DEFAULT_MAX_AGE = 30000;
var FORCE_MAX_AGE = 10347;
var DEFAULT_AGE_RATE = 1.0;

var DEFAULT_CHARGE = 0.0;
var DEFAULT_GRAVITY = 0.008;
var DEFAULT_FORCEY_MULTIPLIER = 10.0;
var DEFAULT_VELOCITY_DECAY = 0.965;
var DEFAULT_LINK_DISTANCE = 10.0;
var DEFAULT_LINK_STRENGTH = 0.80;
var DEFAULT_COLLISION_RADIUS_MULTIPLIER = 0.6;
var DEFAULT_COLLISION_ITERATIONS = 1;

var DEFAULT_NODE_RADIUS = 20.0;

var config = {};

config.pauseOnMouseMove = false;
config.showStatsFlag = false;
config.blahMode = DEFAULT_BLAH_MODE;
config.antonymFlag = false;
config.pauseFlag = false;
config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
config.maxWords = 100;
config.testMode = false;
config.removeDeadNodesFlag = true;

config.defaultMultiplier = 1000.0;
config.defaultBlahMode = DEFAULT_BLAH_MODE;
config.defaultCharge = DEFAULT_CHARGE;
config.defaultGravity = DEFAULT_GRAVITY;
config.defaultForceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
config.defaultCollisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
config.defaultCollisionIterations = DEFAULT_COLLISION_ITERATIONS;
config.defaultLinkStrength = DEFAULT_LINK_STRENGTH;
config.defaultLinkDistance = DEFAULT_LINK_DISTANCE;
config.defaultVelocityDecay = DEFAULT_VELOCITY_DECAY;
config.defaultNodeRadius = DEFAULT_NODE_RADIUS;


if ((config.sessionViewType == 'ticker') 
  // || (config.sessionViewType == 'flow')
  ) {
  config.disableLinks = true;
}
else{
  config.disableLinks = false;
}

var statsObj = {};
statsObj.socketId = null;
statsObj.socketErrors = 0;
statsObj.maxNodes = 0;
statsObj.maxNodeAddQ = 0;
statsObj.heartbeat = {};
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
  "green": "#259286",
  "lightgreen": "#35F096",
  "yellowgreen": "#738A05"
};

var ignoreWordsArray = [
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
  "–",
];

ignoreWordsArray.push('"');
ignoreWordsArray.push("'");

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 1000),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24),
    days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

function displayControl(isVisible) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  document.getElementById('controlDiv').style.visibility = v;
}

function displayStats(isVisible, dColor) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  document.getElementById('statsDiv').style.visibility = v;
  if (typeof dColor !== 'undefined') document.getElementById('statsDiv').style.color = dColor;
}

var mouseMoveTimeout;
var mouseMovingFlag = false;
var mouseMoveTimeoutInterval = 2000;

var mouseMoveTimeout;

function resetMouseMoveTimer() {

  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function() {

    mouseMovingFlag = false;
    d3.select("body").style("cursor", "none");

    currentSessionView.toolTipVisibility(false);

    if (config.pauseOnMouseMove && !config.pauseFlag) currentSessionView.simulationControl('RESUME');

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayStats(false, palette.white);
      displayControl(false);
    }

  }, mouseMoveTimeoutInterval);
}

document.addEventListener("mousemove", function() {
  if (config.pauseOnMouseMove) currentSessionView.simulationControl('PAUSE');
  mouseMovingFlag = true;
  displayControl(true);
  displayStats(true, palette.blue);
  resetMouseMoveTimer();
}, true);

var dragEndPosition = { 'id': 'ID', 'x': 47, 'y': 147};

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
  'dragEnd', { 
    'detail': dragEndPosition
  } 
);


function setLinkStrengthSliderValue(value) {
  controlPanel.document.getElementById("linkStrengthSlider").value = value * controlPanel.document.getElementById("linkStrengthSlider").getAttribute("multiplier");
  currentSessionView.updateLinkStrength(value);
}

function setvelocityDecaySliderValue(value) {
  controlPanel.document.getElementById("velocityDecaySlider").value = value;
  currentSessionView.updateVelocityDecay(value);
}

function setGravitySliderValue(value) {
  controlPanel.document.getElementById("gravitySlider").value = value;
  currentSessionView.updateGravity(value);
}

function setChargeSliderValue(value) {
  controlPanel.document.getElementById("chargeSlider").value = value;
  currentSessionView.updateCharge(value);
}

function setMaxAgeSliderValue(value) {
  controlPanel.document.getElementById("maxAgeSlider").value = value;
  currentSessionView.setNodeMaxAge(value);
}

window.onbeforeunload = function() {
  controlPanelFlag = false;
  controlPanelWindow.close();
}

function toggleControlPanel(){
  // console.warn("toggleControlPanel: " + controlPanelFlag);

  if (controlPanelFlag){
    controlPanelWindow.close();
    controlPanelFlag = false;
    updateControlButton(controlPanelFlag);
    console.debug("toggleControlPanel: " + controlPanelFlag);
  }
  else {

    var cnf = {};

    cnf.defaultMaxAge = DEFAULT_MAX_AGE;
    cnf.defaultGravity = DEFAULT_GRAVITY;
    cnf.defaultForceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
    cnf.defaultCollisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
    cnf.defaultCollisionIterations = DEFAULT_COLLISION_ITERATIONS;
    cnf.defaultCharge = DEFAULT_CHARGE;
    cnf.defaultLinkStrength = DEFAULT_LINK_STRENGTH;
    cnf.defaultLinkDistance = DEFAULT_LINK_DISTANCE;
    cnf.defaultVelocityDecay = DEFAULT_VELOCITY_DECAY;
    cnf.defaultNodeRadius = DEFAULT_NODE_RADIUS;

    createPopUpControlPanel(cnf, function(cpw){
      controlPanelFlag = true;
      updateControlButton(controlPanelFlag);
      console.debug("createPopUpControlPanel toggleControlPanel: " + controlPanelFlag);
      setTimeout(function(){
        cpw.postMessage({op: 'INIT', config: cnf}, DEFAULT_SOURCE);
      }, 200);
    });
  }

}

function updateControlButton(controlPanelFlag){
  var cpButton = document.getElementById('controlPanelButton');
  cpButton.innerHTML = controlPanelFlag ? 'HIDE CONTROL' : 'SHOW CONTROL';
}

function addControlButton(){
  var controlDiv = document.getElementById('controlDiv');
  controlDiv.style.visibility = 'hidden';
  var controlPanelButton = document.createElement("BUTTON");
  controlPanelButton.className = 'button';
  controlPanelButton.setAttribute('id', 'controlPanelButton');
  controlPanelButton.setAttribute('onclick', 'toggleControlPanel()');
  controlPanelButton.innerHTML = controlPanelFlag ? 'HIDE CONTROL' : 'SHOW CONTROL';
  controlDiv.appendChild(controlPanelButton);
}

function addStatsText(){
  var statsDiv = document.getElementById('statsDiv');
  var statsText = document.createTextNode("STATS");
  statsDiv.appendChild(statsText);
}

function updateStatsText(statsText){
  var statsDiv = document.getElementById('statsDiv');
  statsDiv.innerHTML = statsText;
}

function addStatsButton(){
  var controlDiv = document.getElementById('controlDiv');
  var statsButton = document.createElement("BUTTON");
  statsButton.className = 'button';
  statsButton.setAttribute('id', 'statsButton');
  statsButton.setAttribute('onclick', 'toggleStats()');
  statsButton.innerHTML = config.showStats ? 'HIDE STATS' : 'SHOW STATS';
  controlDiv.appendChild(statsButton);
}

function updateStatsButton(){
  var statsButton = document.getElementById('statsButton');
  statsButton.innerHTML = config.showStatsFlag ? 'HIDE STATS' : 'SHOW STATS';
}

function updateBlahButton(){
  var bButton = document.getElementById('blahButton');
  bButton.innerHTML = config.blahMode ? 'HIDE BLAH' : 'SHOW BLAH';
}

function addBlahButton(){
  var controlDiv = document.getElementById('controlDiv');
  var blahButton = document.createElement("BUTTON");
  blahButton.className = 'button';
  blahButton.setAttribute('id', 'blahButton');
  blahButton.setAttribute('onclick', 'toggleBlah()');
  blahButton.innerHTML = config.blahMode ? 'HIDE BLAH' : 'SHOW BLAH';
  controlDiv.appendChild(blahButton);
}


function createPopUpControlPanel (cnf, callback) {

  console.debug("createPopUpControlPanel\ncnf\n" + jsonPrint(cnf));


  controlPanelWindow = window.open("controlPanel.html", "CONTROL", "width=800,height=600");

  controlPanelWindow.addEventListener('beforeunload', function(){
    console.log("CONTROL POP UP CLOSING...");
    controlPanelFlag = false;
    updateControlButton(controlPanelFlag);
  }, false);

  controlPanelWindow.addEventListener('load', function(cnf){
    controlPanel = new controlPanelWindow.ControlPanel(cnf);
    initControlPanelComm(cnf);
    controlPanelFlag = true;
    callback(controlPanelWindow);
  }, false);
};

function controlPanelComm(event) {
  // console.debug("CONTROL PANEL: " + jsonPrint(event)); // prints: { message: 'Hello world!'} 

  var data = event.data;

  // Do we trust the sender of this message?
  // if (event.origin !== "http://example.com:8080")
  //   return;

  switch (data.op) {
    case 'READY' :
      console.warn("CONTROL PANEL READY");
    break;
    case 'CLOSE' :
      console.warn("CONTROL PANEL CLOSING...");
    break;
    case 'MOMENT' :
      console.warn("CONTROL PANEL MOMENT...");
      switch (data.id) {
        case 'resetButton' :
          reset();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN MOMENT BUTTON");
        break;
      }
    break;
    case 'TOGGLE' :
      console.warn("CONTROL PANEL TOGGLE");
      switch (data.id) {
        case 'blahToggleButton' :
          toggleBlah();
        break;
        case 'fullscreenToggleButton' :
          toggleFullScreen();
        break;
        case 'pauseToggleButton' :
          togglePause();
        break;
        case 'statsToggleButton' :
          toggleStats();
        break;
        case 'testModeToggleButton' :
          toggleTestMode();
        break;
        case 'disableLinksToggleButton' :
          toggleDisableLinks();
        break;
        case 'nodeCreateButton' :
          // createTextNode;
        break;
        case 'antonymToggleButton' :
          toggleAntonym();
        break;
        case 'removeDeadNodeToogleButton' :
          toggleRemoveDeadNode();
        break;
        default:
          console.error("CONTROL PANEL UNKNOWN TOGGLE BUTTON");
        break;
      }
    break;
    case 'UPDATE' :
      console.warn("CONTROL PANEL UPDATE");
      switch (data.id) {
        case 'linkStrengthSlider' :
          currentSessionView.updateLinkStrength(data.value);
        break;
        case 'linkDistanceSlider' :
          currentSessionView.updateLinkDistance(data.value);
        break;
        case 'velocityDecaySlider' :
          currentSessionView.updateVelocityDecay(data.value);
        break;
        case 'gravitySlider' :
          currentSessionView.updateGravity(data.value);
        break;
        case 'chargeSlider' :
          currentSessionView.updateCharge(data.value);
        break;
        case 'maxAgeSlider' :
          currentSessionView.setNodeMaxAge(data.value);
        break;
      }
    break;
    default :
      console.error("CONTROL PANEL OP UNDEFINED: " + jsonPrint(data));
    break;
  }
}

function initControlPanelComm(cnf){
  window.addEventListener("message", controlPanelComm, false);
}

function toggleBlah() {
  config.blahMode = !config.blahMode;
  currentSessionView.setBlah(config.blahMode);
  console.warn("TOGGLE BLAH: " + config.blahMode);
  updateBlahButton();
  if (controlPanelFlag) controlPanel.updateControlPanel(config);
}

function toggleAntonym() {
  config.antonymFlag = !config.antonymFlag;
  currentSessionView.setAntonym(config.antonymFlag);
  console.warn("TOGGLE ANT: " + config.antonymFlag);
  controlPanel.updateControlPanel(config);
}

function togglePause() {
  config.pauseFlag = !config.pauseFlag;
  currentSessionView.setPause(config.pauseFlag);
  console.warn("TOGGLE PAUSE: " + config.pauseFlag);
  controlPanel.updateControlPanel(config);
}

function toggleRemoveDeadNode() {
  config.removeDeadNodesFlag = !config.removeDeadNodesFlag;
  currentSessionView.removeDeadNodesFlag = config.removeDeadNodesFlag;
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.removeDeadNodesFlag);
  controlPanel.updateControlPanel(config);
}

function toggleDisableLinks() {
  config.disableLinks = !config.disableLinks;
  currentSessionView.disableLinks = config.disableLinks;
  if (config.disableLinks) linkHashMap.clear();
  console.warn("TOGGLE DISABLE LINKS: " + config.disableLinks);
  controlPanel.updateControlPanel(config);
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
  if (controlPanelFlag) controlPanel.updateControlPanel(config);
}

function toggleTestMode() {
  config.testMode = !config.testMode;
  config.testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + config.testModeEnabled);

  if (config.testModeEnabled) {
    setTimeout(currentSessionView.initTestAddNodeInterval(1000), 1047);
    setTimeout(currentSessionView.initTestAddLinkInterval(1000), 2047);
    setTimeout(currentSessionView.initTestDeleteNodeInterval(1000), 5047);
  } else {
    currentSessionView.clearTestAddNodeInterval();
    currentSessionView.clearTestAddLinkInterval();
    currentSessionView.clearTestDeleteNodeInterval();
  }

  controlPanel.updateControlPanel(config);
}

var groupHashMap = new HashMap();
var groupDeleteHashMap = new HashMap();

var maxSessions = 0;
var sessionHashMap = new HashMap();
var sessionDeleteHashMap = new HashMap();

var linkHashMap = new HashMap();
var nodeHashMap = new HashMap();

var ignoreWordHashMap = new HashMap();

var keywordColorHashMap = new HashMap();

keywordColorHashMap.set("positive", palette.green);
keywordColorHashMap.set("negative", palette.red);
keywordColorHashMap.set("neutral", palette.black);

keywordColorHashMap.set("left", palette.blue);
keywordColorHashMap.set("right", palette.red);


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

var currentSession = {};
var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

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

var viewerObj = {
  userId: 'VIEWER_RANDOM_' + randomId,
  viewerId: 'VIEWER_RANDOM_' + randomId,
  screenName: 'VIEWER RANDOM ' + randomId,
  type: "VIEWER",
};

var initialPositionIndex = 0;

var initialXpositionRatio = 0.9;
var initialYpositionRatio = 0.5;

function computeInitialPosition(index) {
  var radiusX = 0.01 * window.innerWidth;
  var radiusY = 0.4 * window.innerHeight;
  var pos = {
    x: (initialXpositionRatio * window.innerWidth + (radiusX * Math.cos(index))),
    y: (initialYpositionRatio * window.innerHeight + (radiusY * Math.sin(index)))
  };

  return pos;
}

function getSortedKeys(hmap, sortProperty) {
  var keys = [];
  hmap.forEach(function(value, key) {
    if (value.isSessionNode) {
    } else {
      keys.push(key);
    }
  });
  return keys.sort(function(a, b) {
    return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty]
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

  if (inputTime === 'undefined') {
    currentDate = new Date().toDateString("en-US", options);
    currentTime = new Date().toTimeString('en-US', options);
  } else {
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

  browserPrefixes.forEach(function(p) {
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

var viewerSessionKey;
var socket = io('/view');

socket.on("VIEWER_ACK", function(vSesKey) {

  statsObj.serverConnected = true;

  console.log("RX VIEWER_ACK | SESSION KEY: " + vSesKey);

  statsObj.viewerSessionKey = vSesKey;

  store.set('stats', statsObj);

  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    console.log("TX GET_SESSION | " + currentSession.sessionId);
    socket.emit("GET_SESSION", currentSession.sessionId);
  } else {
    socket.emit("REQ_USER_SESSION");
  }
});

socket.on("reconnect", function() {
  statsObj.socketId = socket.id;
  store.set('stats', statsObj);
  statsObj.serverConnected = true;
  // displayStats(true, 'white');
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);
  socket.emit("VIEWER_READY", viewerObj);
  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    controlPanel.document.getElementById("statusSessionId").innerHTML = 'SOCKET: ' + statsObj.socketId;
    socket.emit("GET_SESSION", currentSession.sessionId);
  } 
});

socket.on("connect", function() {
  statsObj.socketId = socket.id;
  store.set('stats', statsObj);
  statsObj.serverConnected = true;
  // displayStats(true, 'white');
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function() {
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  displayStats(true, 'red');
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
    store.set('stats', statsObj);
  });
});

socket.on("error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors++;
  displayStats(true, 'red');
  console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
    store.set('stats', statsObj);
  });
});

socket.on("connect_error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors++;
  displayStats(true, 'red');
  console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET CONNECT ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    updateSessionsReady = true;
    store.set('stats', statsObj);
  });
});

socket.on("reconnect_error", function(error) {
  socket.disconnect();
  statsObj.serverConnected = false;
  statsObj.socketId = null;
  statsObj.socketErrors++;
  displayStats(true, 'red');
  console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET RECONNECT ERROR\n" + error);
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    sessionCreateQueue = [];
    groupHashMap.clear();
    sessionDeleteHashMap.clear();
    currentSessionView.resize();
    store.set('stats', statsObj);
    updateSessionsReady = true;
  });
});


var windowVisible = true;

document.title = "Word Association";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityEvent = getVisibilityEvent(prefix);


function reset(){
  currentSessionView.simulationControl('RESET');
  windowVisible = true;
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS ON WINDOW HIDDEN");
    sessionCreateQueue = [];
    sessionDeleteHashMap.clear();
    if ((config.sessionViewType == 'force') 
      || (config.sessionViewType == 'ticker')
      || (config.sessionViewType == 'flow')
    ) {
      currentSessionView.resetDefaultForce();
    }
    currentSessionView.simulationControl('START');
    updateSessionsReady = true;
  });  
}


document.addEventListener(visibilityEvent, function() {
  if (!document[hidden]) {
    windowVisible = true;
    currentSessionView.setPause(false);
    console.debug("visibilityEvent: " + windowVisible);
  } else {
    windowVisible = false;
    currentSessionView.setPause(true);
    console.debug("visibilityEvent: " + windowVisible);
  }
});

function getUrlVariables(callbackMain) {

  var urlSessionId;
  var urlNamespace;
  var sessionType;

  var searchString = window.location.search.substring(1);
  console.log("searchString: " + searchString);

  var variableArray = searchString.split('&');

  var asyncTasks = [];

  variableArray.forEach(

    function(variable, callback) {

      asyncTasks.push(function(callback2) {

        var keyValuePair = variable.split('=');

        if ((keyValuePair[0] !== '') && (keyValuePair[1] !== 'undefined')) {
          console.log("'" + variable + "' >>> URL config: " + keyValuePair[0] + " : " + keyValuePair[1]);
          if (keyValuePair[0] === 'monitor') {
            monitorMode = keyValuePair[1];
            console.log("MONITOR MODE | monitorMode: " + monitorMode);
            return (callback2(null, {
              monitorMode: monitorMode
            }));
          }
          if (keyValuePair[0] === 'session') {
            urlSessionId = keyValuePair[1];
            console.log("SESSION MODE | urlSessionId: " + urlSessionId);
            return (callback2(null, {
              sessionMode: true,
              sessionId: urlSessionId
            }));
            // return(callback2(null, {sessionMode: sessionMode}));
          }
          if (keyValuePair[0] === 'nsp') {
            urlNamespace = keyValuePair[1];
            console.log("namespace: " + urlNamespace);
            return (callback2(null, {
              namespace: urlNamespace
            }));
          }
          if (keyValuePair[0] === 'type') {
            sessionType = keyValuePair[1];
            console.log("SESSION TYPE | sessionType: " + sessionType);
            return (callback2(null, {
              sessionType: sessionType
            }));
          }
          if (keyValuePair[0] === 'viewtype') {
            config.sessionViewType = keyValuePair[1];
            console.log("SESSION VIEW TYPE | sessionViewType: " + config.sessionViewType);
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

    // console.log("results\n" + results);

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
  window.open(url, 'SESSION VIEW', '_new');
}


var globalLinkIndex = 0;

function generateLinkId(callback) {
  globalLinkIndex++;
  return "LNK" + globalLinkIndex;
}

function tableCreateRow(parentTable, options, cells) {

  var tr = parentTable.insertRow();
  var tdTextColor = options.textColor;
  var tdBgColor = options.backgroundColor || '#222222';

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
      if (typeof content.type === 'undefined') {

        td.appendChild(document.createTextNode(content));
        td.style.color = tdTextColor;
        td.style.backgroundColor = tdBgColor;

      } else if (content.type == 'TEXT') {

        td.className = content.class;
        td.setAttribute('id', content.id);
        td.style.color = tdTextColor;
        td.style.backgroundColor = tdBgColor;
        td.innerHTML = content.text;

      } else if (content.type == 'BUTTON') {

        var buttonElement = document.createElement("BUTTON");
        buttonElement.className = content.class;
        buttonElement.setAttribute('id', content.id);
        buttonElement.setAttribute('mode', content.mode);
        buttonElement.addEventListener('click', function(e){ buttonHandler(e); }, false);
        buttonElement.innerHTML = content.text;
        td.appendChild(buttonElement);
        controlIdHash[content.id] = content;

      } else if (content.type == 'SLIDER') {

      console.warn("tableCreateRow\n" + jsonPrint(content));

        var sliderElement = document.createElement("INPUT");
        sliderElement.type = 'range';
        sliderElement.className = content.class;
        sliderElement.setAttribute('id', content.id);
        sliderElement.setAttribute('min', content.min);
        sliderElement.setAttribute('max', content.max);
        sliderElement.setAttribute('multiplier', content.multiplier);
        sliderElement.setAttribute('oninput', content.oninput);
        sliderElement.value = content.value;
        td.appendChild(sliderElement);
        controlIdHash[content.id] = content;

      }
    });
  }
}

function createStatsTable(callback) {

  console.log("CREATE STATS TABLE\n" + jsonPrint(config));

  var statsDiv = document.getElementById('statsDiv');
  statsDiv.style.visibility = 'hidden';
  statsDiv.style.border = "2px solid black ";
  statsDiv.style.backgroundColor = palette.white;
  statsDiv.style.textColor = palette.black;
  var statsTableServer = document.createElement('TABLE');
  var statsTableClient = document.createElement('TABLE');
  var br = document.createElement('br');

  statsTableServer.className = 'table';
  statsTableServer.setAttribute('id', 'statsTableServer');
  statsTableServer.style.border = "1px solid black ";

  statsDiv.appendChild(statsTableServer);
  statsDiv.appendChild(br);

  statsTableClient.className = 'table';
  statsTableClient.setAttribute('id', 'statsTableClient');
  statsDiv.appendChild(statsTableClient);

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
    type: 'TEXT',
    id: 'statsClientSessionIdLabel',
    class: 'statsTableText',
    text: 'SESSION'
  };

  var statsClientSessionId = {
    type: 'TEXT',
    id: 'statsClientSessionId',
    class: 'statsTableText',
    text: statsObj.socketId
  };

  var statsClientNumberNodesLabel = {
    type: 'TEXT',
    id: 'statsClientNumberNodesLabel',
    class: 'statsTableText',
    text: 'NODES'
  };

  var statsClientNumberNodes = {
    type: 'TEXT',
    id: 'statsClientNumberNodes',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientNumberMaxNodesLabel = {
    type: 'TEXT',
    id: 'statsClientNumberMaxNodesLabel',
    class: 'statsTableText',
    text: 'MAX'
  };

  var statsClientNumberMaxNodes = {
    type: 'TEXT',
    id: 'statsClientNumberMaxNodes',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientAddNodeQLabel = {
    type: 'TEXT',
    id: 'statsClientAddNodeQLabel',
    class: 'statsTableText',
    text: 'NODE ADD Q'
  };

  var statsClientAddNodeQ = {
    type: 'TEXT',
    id: 'statsClientAddNodeQ',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientAgeRateLabel = {
    type: 'TEXT',
    id: 'statsClientAgeRateLabel',
    class: 'statsTableText',
    text: 'AGE RATE'
  };

  var statsClientAgeRate = {
    type: 'TEXT',
    id: 'statsClientAgeRate',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientMaxAgeRateLabel = {
    type: 'TEXT',
    id: 'statsClientMaxAgeRateLabel',
    class: 'statsTableText',
    text: 'MAX'
  };

  var statsClientMaxAgeRate = {
    type: 'TEXT',
    id: 'statsClientMaxAgeRate',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientMaxAddNodeQLabel = {
    type: 'TEXT',
    id: 'statsClientMaxAddNodeQLabel',
    class: 'statsTableText',
    text: 'MAX'
  };

  var statsClientMaxAddNodeQ = {
    type: 'TEXT',
    id: 'statsClientMaxAddNodeQ',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientNumberEntitiesLabel = {
    type: 'TEXT',
    id: 'statsClientNumberEntitiesLabel',
    class: 'statsTableText',
    text: 'ENTITIES'
  };

  var statsClientNumberEntities = {
    type: 'TEXT',
    id: 'statsClientNumberEntities',
    class: 'statsTableText',
    text: '---'
  };

  var statsClientNumberMaxEntitiesLabel = {
    type: 'TEXT',
    id: 'statsClientNumberMaxEntitiesLabel',
    class: 'statsTableText',
    text: 'MAX'
  };

  var statsClientNumberMaxEntities = {
    type: 'TEXT',
    id: 'statsClientNumberMaxEntities',
    class: 'statsTableText',
    text: '---'
  };

  var statsServerTimeLabel = {
    type: 'TEXT',
    id: 'statsServerTimeLabel',
    class: 'statsTableText',
    text: 'TIME'
  };

  var statsServerTime = {
    type: 'TEXT',
    id: 'statsServerTime',
    class: 'statsTableText',
    text: statsObj.heartbeat.timeStamp
  };

  var statsServerUpTimeLabel = {
    type: 'TEXT',
    id: 'statsServerTimeLabel',
    class: 'statsTableText',
    text: 'UPTIME'
  };

  var statsServerUpTime = {
    type: 'TEXT',
    id: 'statsServerUpTime',
    class: 'statsTableText',
    text: statsObj.heartbeat.upTime
  };

  var statsServerStartTimeLabel = {
    type: 'TEXT',
    id: 'statsServerStartTimeLabel',
    class: 'statsTableText',
    text: 'START'
  };

  var statsServerStartTime = {
    type: 'TEXT',
    id: 'statsServerStartTime',
    class: 'statsTableText',
    text: statsObj.heartbeat.startTime
  };

  var statsServerRunTimeLabel = {
    type: 'TEXT',
    id: 'statsServerRunTimeLabel',
    class: 'statsTableText',
    text: 'RUN TIME'
  };

  var statsServerRunTime = {
    type: 'TEXT',
    id: 'statsServerRunTime',
    class: 'statsTableText',
    text: statsObj.heartbeat.runTime
  };

  var statsServerTotalWordsLabel = {
    type: 'TEXT',
    id: 'statsServerTotalWordsLabel',
    class: 'statsTableText',
    text: 'TOTAL UNIQUE WORDS'
  };

  var statsServerTotalWords = {
    type: 'TEXT',
    id: 'statsServerTotalWords',
    class: 'statsTableText',
    text: statsObj.heartbeat.totalWords
  };


  var statsServerWordsReceivedLabel = {
    type: 'TEXT',
    id: 'statsServerWordsReceivedLabel',
    class: 'statsTableText',
    text: 'WORDS RCVD'
  };

  var statsServerWordsReceived = {
    type: 'TEXT',
    id: 'statsServerWordsReceived',
    class: 'statsTableText',
    text: statsObj.heartbeat.responsesReceived
  };

  var statsServerWordsPerMinLabel = {
    type: 'TEXT',
    id: 'statsServerWordsPerMinLabel',
    class: 'statsTableText',
    text: 'WPM'
  };

  var statsServerWordsPerMin = {
    type: 'TEXT',
    id: 'statsServerWordsPerMin',
    class: 'statsTableText',
    text: statsObj.heartbeat.wordsPerMinute
  };

  var statsServerMaxWordsPerMinLabel = {
    type: 'TEXT',
    id: 'statsServerMaxWordsPerMinLabel',
    class: 'statsTableText',
    text: 'MAX'
  };

  var statsServerMaxWordsPerMin = {
    type: 'TEXT',
    id: 'statsServerMaxWordsPerMin',
    class: 'statsTableText',
    text: statsObj.heartbeat.maxWordsPerMin
  };

  var statsServerMaxWordsPerMinTime = {
    type: 'TEXT',
    id: 'statsServerMaxWordsPerMinTime',
    class: 'statsTableText',
    text: moment(statsObj.heartbeat.maxWordsPerMinTime).format(defaultDateTimeFormat)
  };

  switch (config.sessionViewType) {

    case 'force':
    case 'flow':
    case 'ticker':
    case 'histogram':
      tableCreateRow(statsTableServer, optionsHead, ['SERVER']);
      tableCreateRow(statsTableServer, optionsBody, [statsServerTimeLabel, statsServerTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerUpTimeLabel, statsServerUpTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerStartTimeLabel, statsServerStartTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerRunTimeLabel, statsServerRunTime]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerTotalWordsLabel, statsServerTotalWords]);
      tableCreateRow(statsTableServer, optionsBody, [statsServerWordsReceivedLabel, statsServerWordsReceived]);
      tableCreateRow(statsTableServer, optionsBody, 
        [
          statsServerWordsPerMinLabel, 
          statsServerWordsPerMin, 
          statsServerMaxWordsPerMinLabel, 
          statsServerMaxWordsPerMin, 
          statsServerMaxWordsPerMinTime
        ]);
      tableCreateRow(statsTableClient, optionsHead, ['CLIENT']);
      tableCreateRow(statsTableClient, optionsBody, [statsClientSessionIdLabel, statsClientSessionId]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientNumberNodesLabel, statsClientNumberNodes, statsClientNumberMaxNodesLabel, statsClientNumberMaxNodes]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientAgeRateLabel, statsClientAgeRate, statsClientMaxAgeRateLabel, statsClientMaxAgeRate]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientAddNodeQLabel, statsClientAddNodeQ, statsClientMaxAddNodeQLabel, statsClientMaxAddNodeQ]);
      tableCreateRow(statsTableClient, optionsBody, [statsClientNumberEntitiesLabel, statsClientNumberEntities, statsClientNumberMaxEntitiesLabel, statsClientNumberMaxEntities]);
      break;

    default:
      break;
  }


  if (callback) callback(statsTable);
}

//  STATS UPDATE
setInterval(function() {
  if (sessionHashMap.count() > maxSessions) maxSessions = sessionHashMap.count();
  if (statsTableFlag) updateStatsTable(statsObj);
}, 1000);

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
  }
  else if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.error("\n????? SERVER DOWN ????? | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(moment().valueOf() - lastHeartbeatReceived));
    socket.connect();
  }
}, serverCheckInterval);

function deleteSession(nodeId, callback) {

  if (!sessionHashMap.has(nodeId)) {
    console.warn("deleteSession: SID NOT IN HASH: " + nodeId + " ... SKIPPING DELETE");
    return (callback(nodeId));
  }

  var deletedSession = sessionHashMap.get(nodeId);
  var groupLinkId = deletedSession.groupId + "_" + deletedSession.node.nodeId;

  console.log("X SES"
    // + " [" + currentSessionView.getSessionsLength() + "]"
    + " G: " + deletedSession.groupId 
    + " N: " + deletedSession.nodeId 
    + " S: " + deletedSession.sessionId 
    + " U: " + deletedSession.userId
    + " SN: " + deletedSession.linkHashMap.keys()
    + " SN: " + deletedSession.node.nodeId
    + " Ls: " + jsonPrint(deletedSession.node.links)
  );

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
        console.log("X SES " + nId);
        cb();
      });
    },
    function(err) {
      sessionDeleteHashMap.clear();
      callback();
    }
  );
}

function updateStatsTable(statsObj){
  document.getElementById("statsServerTime").innerHTML = moment(statsObj.heartbeat.timeStamp).format(defaultDateTimeFormat);
  document.getElementById("statsServerUpTime").innerHTML = msToTime(statsObj.heartbeat.upTime);
  document.getElementById("statsServerStartTime").innerHTML = moment(statsObj.heartbeat.startTime).format(defaultDateTimeFormat);
  document.getElementById("statsServerRunTime").innerHTML = msToTime(statsObj.heartbeat.runTime);
  document.getElementById("statsServerTotalWords").innerHTML = statsObj.heartbeat.totalWords;
  document.getElementById("statsServerWordsReceived").innerHTML = statsObj.heartbeat.responsesReceived;
  document.getElementById("statsServerWordsPerMin").innerHTML = statsObj.heartbeat.wordsPerMinute.toFixed(2);
  document.getElementById("statsServerMaxWordsPerMin").innerHTML = statsObj.heartbeat.maxWordsPerMin.toFixed(2);
  document.getElementById("statsServerMaxWordsPerMinTime").innerHTML = moment(statsObj.heartbeat.maxWordsPerMinTime).format(defaultDateTimeFormat);
  document.getElementById("statsClientNumberNodes").innerHTML = currentSessionView.getNodesLength();
  document.getElementById("statsClientNumberMaxNodes").innerHTML = statsObj.maxNodes;
  document.getElementById("statsClientNumberEntities").innerHTML = sessionHashMap.count();
  document.getElementById("statsClientNumberMaxEntities").innerHTML = maxSessions;
  document.getElementById("statsClientAddNodeQ").innerHTML = currentSessionView.getNodeAddQlength();
  document.getElementById("statsClientMaxAddNodeQ").innerHTML = currentSessionView.getMaxNodeAddQ();
  document.getElementById("statsClientAgeRate").innerHTML = currentSessionView.getAgeRate().toFixed(2);
  document.getElementById("statsClientMaxAgeRate").innerHTML = currentSessionView.getMaxAgeRate().toFixed(2);

  if (statsObj.serverConnected) {
    document.getElementById("statsClientSessionId").innerHTML = statsObj.socketId;
  }
  else {
    document.getElementById("statsClientSessionId").innerHTML = "*** CANNOT CONNECT TO SERVER ***";
  }
}

var heartBeatsReceived = 0;

socket.on("HEARTBEAT", function(heartbeat) {

  var nodesLength = (typeof currentSessionView === 'undefined') ? 0 : currentSessionView.getNodesLength();
  statsObj.maxNodes = (typeof currentSessionView === 'undefined') ? 0 : currentSessionView.getMaxNodes();
  var nodeAddQLength = (typeof currentSessionView === 'undefined') ? 0 : currentSessionView.getNodeAddQlength();
  statsObj.maxNodeAddQ = (typeof currentSessionView === 'undefined') ? 0 : currentSessionView.getMaxNodeAddQ();

  statsObj.heartbeat = heartbeat;

  heartBeatsReceived++;
  statsObj.serverConnected = true;
  lastHeartbeatReceived = moment().valueOf();
});

socket.on("CONFIG_CHANGE", function(rxConfig) {

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" 
    + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");

  if (rxConfig.testMode !== 'undefined') {
    config.testMode = rxConfig.testMode;
    console.log("\n*** ENV CHANGE: TEST_MODE:  WAS: " 
      + previousConfig.testMode + " | NOW: " + config.testMode + "\n");
    previousConfig.testMode = config.testMode;
  }

  if (rxConfig.testSendInterval !== 'undefined') {
    config.testSendInterval = rxConfig.testSendInterval;
    console.log("\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " 
      + previousConfig.testSendInterval + " | NOW: " + config.testSendInterval + "\n");
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if (rxConfig.nodeMaxAge !== 'undefined') {
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
    statsObj.socketId = 'ABORTED';
    socket.disconnect();
    store.set('stats', statsObj);
  }
});

socket.on("SESSION_DELETE", function(rxSessionObject) {

  var rxObj = rxSessionObject;

  console.log("X SES" 
    // + " | " + rxObj.session.nodeId
    + " " + rxSessionObject.sessionId 
    // + " | " + rxObj.sessionEvent
    // + "\n" + jsonPrint(rxSessionObject)
  );

  if ((typeof rxObj.session !== 'undefined') && (typeof rxObj.session.tags !== 'undefined')){

    // rxObj.session.nodeId = rxObj.session.user.tags.entity.toLowerCase() + "_" + rxObj.session.user.tags.channel.toLowerCase();
    rxObj.session.nodeId = rxObj.session.tags.entity.toLowerCase() + "_" + rxObj.session.tags.channel.toLowerCase();

    if (sessionHashMap.has(rxObj.session.nodeId)) {

      console.log("SESSION_DELETE" 
        + " | " + rxObj.session.nodeId
        // + " | " + rxSessionObject.sessionId 
        + " | " + rxObj.sessionEvent
        // + "\n" + jsonPrint(rxSessionObject)
      );

      var session = sessionHashMap.get(rxObj.session.nodeId);
      sessionDeleteHashMap.set(rxObj.session.nodeId, 1);
      session.sessionEvent = "SESSION_DELETE";
      rxSessionDeleteQueue.push(session);
      store.set('stats', statsObj);

    }

  }
});

socket.on("USER_SESSION", function(rxSessionObject) {
  var rxObj = rxSessionObject;
  console.log("USER_SESSION" 
    + " | SID: " + rxObj.sessionId 
    + " | UID: " + rxObj.userId 
    + " | NSP: " + rxObj.namespace 
    + " | WCI: " + rxObj.wordChainIndex 
    + " | CONN: " + rxObj.connected);
});

socket.on("SESSION_UPDATE", function(rxSessionObject) {

  var rxObj = rxSessionObject;

  if (!windowVisible) {
    rxSessionUpdateQueue = [];
    if (debug) {
      console.log("... SKIP SESSION_UPDATE ... WINDOW NOT VISIBLE");
    }
    
  } else if (sessionMode && (rxObj.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("SKIP SESSION_UPDATE: " + rxObj.sessionId 
        + " | CURRENT: " + currentSession.sessionId);
    }
  } else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

    if (rxObj.action == 'KEEPALIVE') {
    } else {
      rxSessionUpdateQueue.push(rxSessionObject);

      if (rxObj.tags.trending) {
        console.debug("TTT" + rxObj.source.nodeId 
          + " | T: " + rxObj.tags.trending
        );
      }
    }
  }
});


//================================
// GET NODES FROM QUEUE
//================================


var nodeIndex = 0;
var tempMentions;

var numberSessionsUpdated = 0;

function addToHashMap(hm, key, value, callback) {
  hm.set(key, value);
  var v = hm.get(key);
  callback(v);
}

function removeFromHashMap(hm, key, callback) {
  if (hm.has(key)){
    var value = hm.get(key);
    hm.remove(key);
    callback(value);
  }
  else{
    callback(false);
  }
}

var processSessionQueues = function(callback) {
  if (rxSessionDeleteQueue.length > 0) {
    var deleteSessUpdate = rxSessionDeleteQueue.shift();
    console.log("DELETE SESSION: " + deleteSessUpdate.sessionId);
    sessionDeleteHashMap.set(deleteSessUpdate.sessionId, 1);
    deleteSession(deleteSessUpdate.sessionId, function(sessionId) {
      return (callback(null, null));
    });
  } 
  else if (rxSessionUpdateQueue.length == 0) {
    // console.log("sessionObject\n");
    return (callback(null, null));
  } 
  else {
    var session = rxSessionUpdateQueue.shift();

    session.nodeId = session.tags.entity.toLowerCase() + "_" + session.tags.channel.toLowerCase();
    session.tags.entity = session.tags.entity.toLowerCase();
    session.tags.channel = session.tags.channel.toLowerCase();

    switch (session.tags.channel){
      case "twitter":
        session.tags.url = "https://twitter.com/" + session.tags.entity.toLowerCase();
        if (typeof session.tags.group.url !== 'undefined') session.tags.group.url = "https://twitter.com/" + session.tags.entity.toLowerCase();
      break;
      case "livestream":
        if (session.tags.entity == 'cspan'){
          session.tags.group.url = "https://www.c-span.org/networks/";          
        }
      break;
    }

    if (typeof session.tags.group.groupId !== 'undefined') {
      console.log("G"
        + " | " + session.nodeId
        + " | " + session.tags.group.groupId
        // + "\nTAGS\n" + jsonPrint(session.tags)
      );
      groupCreateQueue.push(session);
    }
    else if (session.tags.group.entityId){

      if (!groupHashMap.has(session.tags.group.entityId)) {
        session.tags.group.groupId = session.tags.group.entityId;
        console.warn("+ G FROM ENT ID"
          + " | N: " + session.nodeId
          + " | E: " + session.tags.group.entityId
          // + "\nTAGS\n" + jsonPrint(session.tags)
        );
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
}

var processNodeDeleteQueue = function(callback) {
  
  while (nodeDeleteQueue.length > 0) {
  //   return (callback(null, "processNodeDeleteQueue"));
  // } else {

    var deletedNodeId = nodeDeleteQueue.shift();

    // console.error("processNodeDeleteQueue: DELETE NODE: " + deletedNodeId);

    removeFromHashMap(nodeHashMap, deletedNodeId, function(deletedNode) {
      if (deletedNode) {
        // console.error("processNodeDeleteQueue: DELETED NODE: " + deletedNodeId);
      // return (callback(null, "processNodeDeleteQueue"));
      }
    });
    removeFromHashMap(sessionHashMap, deletedNodeId, function(deletedSession) {
      // if (deletedSession) {
      //   console.error("processNodeDeleteQueue: DELETED SESSION: " + deletedNodeId);
      //   // return (callback(null, "processNodeDeleteQueue"));
      // }
    });
    removeFromHashMap(groupHashMap, deletedNodeId, function(deletedGroup) {
      // if (deletedGroup) {
        // console.error("processNodeDeleteQueue: DELETED GROUP: " + deletedNodeId);
        // var linkKeys = Object.keys(deletedGroup.node.links);
        // linkKeys.forEach(function(deadLinkId){
        //   removeFromHashMap(linkHashMap, deadLinkId, function(deletedLink) {
        //     console.error("processNodeDeleteQueue: DELETED GROUP LINK"
        //       + " | " + deadLinkId
        //       + "\n" + + jsonPrint(deletedLink)
        //     );
        //   });
        // });
      // }
    });

  }
  return (callback(null, "processNodeDeleteQueue"));
}

var processLinkDeleteQueue = function(callback) {
  
  while (linkDeleteQueue.length > 0) {
  //   return (callback(null, "processNodeDeleteQueue"));
  // } else {

    var deletedLinkId = linkDeleteQueue.shift();

    // console.error("processNodeDeleteQueue: DELETE NODE: " + deletedNodeId);

    removeFromHashMap(linkHashMap, deletedLinkId, function() {
      // console.error("processNodeDeleteQueue: DELETED: " + deletedNodeId);
      // return (callback(null, "processNodeDeleteQueue"));
    });

  }
  return (callback(null, "processNodeDeleteQueue"));
}

function sum( obj ) {
  var sum = 0;
  for( var el in obj ) {
    if( obj.hasOwnProperty( el ) ) {
      sum += parseFloat( obj[el] );
    }
  }
  return sum;
}

var randomNumber360 = 180;

var getKeywordColor = function(keywordsObj){
  return keywordColorHashMap.get(keywordsObj);
}

var createGroup = function(callback) {

  if (groupCreateQueue.length == 0) {
    return (callback(null, null));
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
      return (callback(null, null));
    } 
    else if (groupHashMap.has(groupId)) {

      var currentGroup = {};
      var currentSession = {};

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

      var currentInitialPosition = computeInitialPosition(initialPositionIndex);
      initialPositionIndex++;

      randomNumber360 = (randomNumber360 + randomIntFromInterval(61, 117))%360;

      var groupStartColor = "hsl(" + randomNumber360 + ",0%,10%)";
      var groupEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var sessionStartColor = "hsl(" + randomNumber360 + ",0%,10%)";
      var sessionEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var nodeStartColor = "hsl(" + randomNumber360 + ",0%,0%)";
      var nodeEndColor = "hsl(" + randomNumber360 + ",0%,100%)";

      var currentGroup = {};
      var currentSession = {};

      currentGroup.groupId = groupId;
      currentGroup.url = groupUrl;
      currentGroup.name = groupName;
      currentGroup.nodeId = groupId;
      currentGroup.age = 1e-6;
      currentGroup.ageUpdated = dateNow;
      currentGroup.ageMaxRatio = 1e-6;
      currentGroup.lastSeen = dateNow;
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
      currentGroup.target.lastSeen = dateNow;

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
      currentGroup.node.x = currentGroup.initialPosition.x;
      currentGroup.node.y = currentGroup.initialPosition.y;
      currentGroup.node.fixed = false;

      currentGroup.node.groupColors = {};
      currentGroup.node.groupColors = currentGroup.groupColors;
      currentGroup.node.interpolateGroupColor = interpolateGroupColor;

      currentGroup.interpolateColor = interpolateGroupColor;

      currentGroup.node.links = {};

      if (sessionHashMap.has(sessUpdate.nodeId)) {
        currentSession = sessionHashMap.get(sessUpdate.nodeId);
        var groupLinkId = currentGroup.node.nodeId + "_" + currentSession.node.nodeId;
        currentGroup.node.links[groupLinkId] = 1;
      }

      addToHashMap(nodeHashMap, currentGroup.node.nodeId, currentGroup.node, function(grpNode) {

        console.debug("+ G" 
          + " | " + grpNode.nodeId
          + " | " + grpNode.groupId
          + " | isGroupNode: " + grpNode.isGroupNode
          + " | isSessionNode: " + grpNode.isSessionNode
        );

        currentSessionView.addNode(grpNode);

        addToHashMap(groupHashMap, currentGroup.groupId, currentGroup, function(cGroup) {
          console.log("+ G " + cGroup.groupId 
            + " | GNID: " + cGroup.node.nodeId
          );
          sessionCreateQueue.push(sessUpdate);
          currentSessionView.addGroup(cGroup);
          return (callback(null, cGroup.groupId));
        });
      });
    }
  }
}

var createSession = function(callback) {

  if (sessionCreateQueue.length == 0) {
    return (callback(null, null));
  } 
  else {

    var dateNow = moment().valueOf();
    var sessUpdate = sessionCreateQueue.shift();

    var currentGroup = {};

    if (groupHashMap.has(sessUpdate.tags.group.groupId)) {
      currentGroup = groupHashMap.get(sessUpdate.tags.group.groupId);
      // console.warn("currentGroup\n" + jsonPrint(currentGroup)); 
    }
    else {
      console.error("currentGroup\n" + jsonPrint(currentGroup)); 
    }

    if (sessionDeleteHashMap.has(sessUpdate.sessionId)) {
      console.log("createSession: " 
        + sessUpdate.userId 
        + " | " + sessUpdate.tags.entity 
        + " SESSION IN DELETE HASH MAP ... SKIPPING"
      );
      return (callback(null, null));
    } 
    else if (sessionHashMap.has(sessUpdate.nodeId)) {

      var currentSession = sessionHashMap.get(sessUpdate.nodeId);

      if (typeof currentSession.wordChainIndex === 'undefined'){
        console.error("*** currentSession.wordChainIndex UNDEFINED");
      }

      if (typeof currentSession.tags === 'undefined') currentSession.tags = {};

      currentSession.tags = sessUpdate.tags;

      currentSession.colors = currentGroup.sessionColors;

      if (nodeHashMap.has(currentSession.node.nodeId)) {
        currentSession.node = nodeHashMap.get(currentSession.node.nodeId);
      }
      if (nodeHashMap.has(sessUpdate.tags.group.groupId)) {
        currentGroup.node = nodeHashMap.get(sessUpdate.tags.group.groupId);
      }

      var prevLatestNodeId = currentSession.latestNodeId;
      currentSession.prevLatestNodeId = prevLatestNodeId;
      var prevSessionLinkId = currentSession.node.nodeId + "_" + prevLatestNodeId;

      // console.warn("REMOVE LINK " + prevSessionLinkId);
      removeFromHashMap(linkHashMap, prevSessionLinkId, function() {
        currentSessionView.deleteLink(prevSessionLinkId);
      });

      currentSession.groupId = currentGroup.groupId;
      currentSession.age = 1e-6;
      currentSession.ageUpdated = dateNow;
      currentSession.ageMaxRatio = 1e-6;
      currentSession.mentions++;
      currentSession.lastSeen = dateNow;
      currentSession.userId = sessUpdate.userId;
      currentSession.text = sessUpdate.tags.entity + " | " + sessUpdate.tags.channel;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.source = sessUpdate.source;
      currentSession.source.lastSeen = dateNow;
      currentSession.target = sessUpdate.target;
      currentSession.target.lastSeen = dateNow;
      currentSession.latestNodeId = sessUpdate.source.nodeId;
      currentSession.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.node.text = sessUpdate.tags.entity + "|" + sessUpdate.tags.channel;
      currentSession.node.age = 1e-6;
      currentSession.node.ageMaxRatio = 1e-6;
      currentSession.node.isGroupNode = false;
      currentSession.node.isSessionNode = true;
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
      
      var sessionLinkId = currentSession.node.nodeId + "_" + sessUpdate.source.nodeId;
      
      currentSession.node.links = {};
      currentSession.node.links[sessionLinkId] = 1;

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.nodeId));
        });
      });

      
    } else {

      sessionsCreated += 1;

      console.log("+ SES" 
        + " [" + sessUpdate.wordChainIndex + "]" 
        + " U: " + sessUpdate.userId 
        + " E: " + sessUpdate.tags.entity 
        + " C: " + sessUpdate.tags.channel 
        + " URL: " + sessUpdate.tags.url 
        + " " + sessUpdate.source.nodeId 
        + " > " + sessUpdate.target.nodeId
      );

      var currentSession = {};
      currentSession.groupId = currentGroup.groupId;
      currentSession.url = sessUpdate.tags.url;
      currentSession.age = 1e-6;
      currentSession.ageMaxRatio = 1e-6;
      currentSession.mentions = 1;
      currentSession.lastSeen = dateNow;
      currentSession.rank = -1;
      currentSession.isSession = true;
      currentSession.nodeId = sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.sessionId = sessUpdate.sessionId;
      currentSession.tags = {};
      currentSession.tags = sessUpdate.tags;
      currentSession.userId = sessUpdate.userId;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
      currentSession.source = sessUpdate.source;
      currentSession.target = sessUpdate.target;
      currentSession.latestNodeId = sessUpdate.source.nodeId;
      currentSession.linkHashMap = new HashMap();
      currentSession.initialPosition = currentGroup.initialPosition;
      currentSession.x = currentGroup.x;
      currentSession.y = currentGroup.y;

      currentSession.sessionColors = {};
      currentSession.sessionColors = currentGroup.sessionColors;
      currentSession.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.groupColors = {};
      currentSession.groupColors = currentGroup.groupColors;
      currentSession.interpolateGroupColor = currentGroup.interpolateGroupColor;

      currentSession.nodeColors = {};
      currentSession.nodeColors = currentGroup.nodeColors;
      currentSession.interpolateNodeColor = currentGroup.interpolateNodeColor;

      // CREATE SESSION NODE

      currentSession.node = {};
      currentSession.node.isSessionNode = true;
      currentSession.node.isGroupNode = false;
      currentSession.node.isDead = false;
      currentSession.node.nodeId = sessUpdate.tags.entity + "_" + sessUpdate.tags.channel;
      currentSession.node.entity = sessUpdate.tags.entity;
      currentSession.node.channel = sessUpdate.tags.channel;
      currentSession.node.userId = sessUpdate.userId;
      currentSession.node.sessionId = sessUpdate.sessionId;
      currentSession.node.url = sessUpdate.tags.url;
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

      currentSession.node.sessionColors = {};
      currentSession.node.sessionColors = currentGroup.sessionColors;
      currentSession.node.interpolateSessionColor = currentGroup.interpolateSessionColor;
      currentSession.node.interpolateColor = currentGroup.interpolateSessionColor;

      currentSession.node.groupColors = {};
      currentSession.node.groupColors = currentGroup.groupColors;
      currentSession.node.interpolateGroupColor = currentGroup.interpolateGroupColor;

      currentSession.node.nodeColors = {};
      currentSession.node.nodeColors = currentGroup.nodeColors;
      currentSession.node.interpolateNodeColor = currentGroup.interpolateNodeColor;

      currentSession.node.links = {};

      var sessionLinkId = currentSession.node.nodeId + "_" + currentSession.latestNodeId;
      currentSession.node.links[sessionLinkId] = 1;
      currentSession.node.link = sessionLinkId;

      currentSession.source.lastSeen = dateNow;
      if (typeof currentSession.target !== 'undefined') {
        currentSession.target.lastSeen = dateNow;
      }

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
        console.log("+ SES" 
          + " " + sesNode.nodeId
          + " " + sesNode.text
          + " WCI: " + sesNode.wordChainIndex
          + " M: " + sesNode.wordChainIndex
        );

        currentSessionView.addNode(sesNode);

        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          console.log("+ SES"
            + " G: " + currentGroup.groupId
            + " GN: " + currentGroup.name
            + " U: " + cSession.userId 
            + " Ms:" + cSession.mentions 
          );

          currentSessionView.addSession(cSession);
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.nodeId));
        });
      });
    }
  }
}

var createNode = function(callback) {

  if (nodeCreateQueue.length > 0) {

    var dateNow = moment().valueOf();

    var session = nodeCreateQueue.shift();

    if (nodeHashMap.has(session.node.nodeId)) {

      var sessionNode = nodeHashMap.get(session.node.nodeId);
      sessionNode.age = 1e-6;
      sessionNode.ageMaxRatio = 1e-6;
      sessionNode.isDead = false;
      sessionNode.wordChainIndex = session.wordChainIndex;
      sessionNode.mentions = session.wordChainIndex;

      session.node = sessionNode;

      addToHashMap(nodeHashMap, session.node.nodeId, sessionNode, function(sNode) {
      });

    } 
    else {

      console.log("+ SES" 
        + " " + session.node.nodeId
      );

      session.node.bboxWidth = 1e-6;
      session.node.isSessionNode = true;
      session.node.isGroupNode = false;
      session.node.nodeId = session.tags.entity + "_" + session.tags.channel;
      session.node.entity = session.tags.entity;
      session.node.channel = session.tags.channel;
      session.node.url = session.tags.url;
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

    if ((config.sessionViewType == 'ticker') || (config.sessionViewType == 'flow')){
      sourceNodeId = session.source.nodeId + "_" + moment().valueOf();
      targetNodeId = session.target.nodeId + "_" + moment().valueOf();
    }
    else {
      sourceNodeId = session.source.nodeId;
      targetNodeId = session.target.nodeId;
    }

    var sourceText = session.source.nodeId;
    var targetText = session.target.nodeId;

    var targetNode = {};
    var sourceNode = {};

    async.parallel({
        source: function(cb) {
          // if (session.source.isIgnored) {
          //   console.debug("IGNORED SOURCE: " + sourceText);
          // }
          // if (session.source.isKeyword) {
          //   console.info("KEY S: " + sourceText);
          // }
          // if (session.source.isTrendingTopic) {
          //   console.debug("TT S: " + sourceText);
          // }
          if ((config.sessionViewType != 'ticker') && (config.sessionViewType != 'flow') && session.source.isIgnored) {
            cb(null, {
              node: sourceNodeId,
              isIgnored: true,
              isNew: false
            });
          } 
          else if (nodeHashMap.has(sourceNodeId)) {
            sourceNode = nodeHashMap.get(sourceNodeId);
            sourceNode.isKeyword = session.source.isKeyword;
            sourceNode.isTrendingTopic = session.source.isTrendingTopic;
            sourceNode.keywordColor = getKeywordColor(session.source.keywords);
            sourceNode.latestNode = true;
            sourceNode.newFlag = false;
            sourceNode.userId = session.userId;
            sourceNode.sessionId = session.sessionId;
            sourceNode.groupId = session.groupId;
            sourceNode.channel = session.tags.channel;
            sourceNode.url = session.tags.url;
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
              sourceNode.text = session.tags.entity + "|" + session.tags.channel;
              sourceNode.wordChainIndex = session.source.wordChainIndex;
              sourceNode.mentions = session.source.wordChainIndex;
            }
            else {
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
            sourceNode.bboxWidth = 1e-6;
            sourceNode.isIgnored = session.source.isIgnored;
            if (ignoreWordHashMap.has(sourceText)) {
              sourceNode.isIgnored = true;
            }
            sourceNode.isKeyword = session.source.isKeyword;
            sourceNode.isTrendingTopic = session.source.isTrendingTopic;
            sourceNode.keywordColor = getKeywordColor(session.source.keywords);
            sourceNode.newFlag = true;
            sourceNode.latestNode = true;
            sourceNode.isSessionNode = false;
            sourceNode.isGroupNode = false;
            sourceNode.userId = session.userId;
            sourceNode.groupId = session.groupId;
            sourceNode.channel = session.tags.channel;
            sourceNode.sessionId = session.sessionId;
            sourceNode.url = session.tags.url;
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
            sourceNode.x = session.node.x+randomIntFromInterval(-10,-20);
            sourceNode.y = session.node.y+randomIntFromInterval(-10,10);

            if (sourceNode.isSessionNode){
              sourceNode.text = session.tags.entity + "|" + session.tags.channel;
              sourceNode.wordChainIndex = session.source.wordChainIndex;
              sourceNode.mentions = session.source.wordChainIndex;
            }
            else {
              sourceNode.text = sourceText;
              sourceNode.mentions = session.source.mentions;
            }

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

          // if (session.target.isIgnored) {
          //   console.debug("IGNORED TARGET: " + targetText);
          // }
          // if (session.target.isKeyword) {
          //   console.info("KEY T: " + sourceText);
          // }
          // if (session.target.isTrendingTopic) {
          //   console.debug("TT T: " + sourceText);
          // }
          if (typeof targetNodeId === 'undefined' || (config.sessionViewType == 'ticker') || (config.sessionViewType == 'flow')) {
            cb("TARGET UNDEFINED", null);
          } else if (session.target.isIgnored) {
            cb(null, {
              node: targetNodeId,
              isIgnored: true,
              isNew: false
            });
          } else if (nodeHashMap.has(targetNodeId)) {
            targetNode = nodeHashMap.get(targetNodeId);
            targetNode.newFlag = false;
            if (ignoreWordHashMap.has(targetText)) {
              targetNode.isIgnored = true;
            }
            targetNode.isTrendingTopic = session.target.isTrendingTopic;
            targetNode.isKeyword = session.target.isKeyword;
            targetNode.keywordColor = getKeywordColor(session.target.keywords);
            targetNode.userId = session.userId;
            targetNode.sessionId = session.sessionId;
            targetNode.groupId = session.groupId;
            targetNode.channel = session.tags.channel;
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
              targetNode.text = session.tags.entity + "|" + session.tags.channel;
              targetNode.wordChainIndex = session.target.wordChainIndex;
              targetNode.mentions = session.target.wordChainIndex;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x;
              targetNode.y = session.node.y;
            }
            else {
              targetNode.text = targetText;
              targetNode.mentions = session.target.mentions;
            }

            addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode) {
              cb(null, {
                node: tNode,
                isIgnored: false,
                isNew: false
              });
            });
          } else {
            targetNode = session.target;
            targetNode.nodeId = targetNodeId;
            targetNode.bboxWidth = 1e-6;
            targetNode.newFlag = true;
            targetNode.isSessionNode = false;
            targetNode.isGroupNode = false;
            if (ignoreWordHashMap.has(targetText)) {
              targetNode.isIgnored = true;
            }
            targetNode.isTrendingTopic = session.target.isTrendingTopic;
            targetNode.isKeyword = session.target.isKeyword;
            targetNode.keywordColor = getKeywordColor(session.target.keywords);
            targetNode.userId = session.userId;
            targetNode.groupId = session.groupId;
            targetNode.channel = session.tags.channel;
            targetNode.url = session.tags.url;
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
            if (targetNode.isSessionNode){
              targetNode.text = session.tags.entity + "|" + session.tags.channel;
              targetNode.wordChainIndex = session.target.wordChainIndex;
              targetNode.mentions = session.target.wordChainIndex;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x;
              targetNode.y = session.node.y;
            }
            else {
              targetNode.text = targetText;
              targetNode.mentions = session.target.mentions;
              targetNode.r = config.defaultNodeRadius;
              targetNode.x = session.node.x - (100 * Math.random());
              targetNode.y = session.node.y - (20 - 20 * Math.random());
            }

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

        if (!results.source.isIgnored) {
          session.source = results.source.node;
          session.source.isNew = results.source.isNew;
          if (results.source.isNew) {
            currentSessionView.addNode(results.source.node);
          }
        }

        if (results.target && !results.target.isIgnored) {
          session.target = results.target.node;
          session.target.isNew = results.target.isNew;
          if (results.target.isNew) {
            currentSessionView.addNode(results.target.node);
          }
        }

        addToHashMap(sessionHashMap, session.nodeId, session, function(cSession) {
          if (!results.source.isIgnored && (config.sessionViewType != 'ticker')) {
            linkCreateQueue.push(cSession);
          }
        });
      });
  }
  return (callback(null, sessionId));
}

var createLink = function(callback) {

  if ((config.sessionViewType !== 'ticker') 
    && !config.disableLinks 
    && (linkCreateQueue.length > 0)) {

    var session = linkCreateQueue.shift();

    var currentGroup = groupHashMap.get(session.tags.group.groupId);

    var groupLinkId;
    var sessionLinkId;

    if (typeof currentGroup === 'undefined'){
    }
    else if (currentGroup.node.nodeId != session.node.nodeId){

      var groupLinkId = currentGroup.node.nodeId + "_" + session.node.nodeId;

      currentGroup.node.links[groupLinkId] = 1;
      session.node.links[groupLinkId] = 1;

      if (!linkHashMap.has(groupLinkId)){
        var newGroupLink = {
          linkId: groupLinkId,
          groupId: currentGroup.groupId,
          age: 0,
          isDead: false,
          source: currentGroup.node,
          target: session.node,
          isGroupLink: true
        };

        addToHashMap(linkHashMap, groupLinkId, newGroupLink, function(grpLink) {
          currentSessionView.addLink(grpLink);
        });
      }
      else {
        var groupLink = linkHashMap.get(groupLinkId);
        groupLink.age = 1e-6;
        groupLink.ageMaxRatio = 1e-6;
        addToHashMap(linkHashMap, groupLinkId, groupLink, function(grpLink) {
        });
      }
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
}

var updateSessionsReady = true;
function updateSessions() {

  updateSessionsReady = false;

  async.series(
    [
      processLinkDeleteQueue,
      processNodeDeleteQueue,
      processSessionQueues,
      createGroup,
      createSession,
      createNode,
      createLink,
    ],

    function(err, result) {
      if (err) {
        console.error("*** ERROR: updateSessions *** \nERROR: " + err);
      }
      updateSessionsReady = true;

    }
  );
}

function toggleFullScreen() {

  console.warn("toggleFullScreen");

  if (!document.fullscreenElement &&
    !document.mozFullScreenElement && 
    !document.webkitFullscreenElement && 
    !document.msFullscreenElement) {

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      currentSessionView.resize();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
      currentSessionView.resize();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
      currentSessionView.resize();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      currentSessionView.resize();
    }
  } else {

    if (document.exitFullscreen) {
      document.exitFullscreen();
      currentSessionView.resize();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      currentSessionView.resize();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      currentSessionView.resize();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      currentSessionView.resize();
    }
  }
}

var updateSessionsInterval;

function clearUpdateSessionsInterval() {
  clearInterval(updateSessionsInterval);
}

function initUpdateSessionsInterval(interval) {
  clearInterval(updateSessionsInterval);
  updateSessionsInterval = setInterval(function() {
    if (updateSessionsReady) updateSessions();
  }, interval);
}

requirejs.onError = function(err) {
  console.error("*** REQUIRE ERROR\n" + err);
  if (err.requireType === 'timeout') {
    console.log('modules: ' + err.requireModules);
  }
  throw err;
};

function loadViewType(svt, callback) {

  console.log("LOADING SESSION VIEW TYPE: " + svt);

  switch (svt) {
    case 'ticker':
      config.sessionViewType = 'ticker';
      requirejs(["js/libs/sessionViewTicker"], function() {
        console.log("sessionViewTicker LOADED");
        currentSessionView = new ViewTicker();
        callback();
      });
      break;
    case 'flow':
      config.sessionViewType = 'flow';
      requirejs(["js/libs/sessionViewFlow"], function() {
        console.log("sessionViewFlow LOADED");
        currentSessionView = new ViewFlow();
        callback();
      });
      break;
    case 'histogram':
      config.sessionViewType = 'histogram';
      requirejs(["js/libs/sessionViewHistogram"], function() {
        console.log("sessionViewHistogram LOADED");
        currentSessionView = new ViewHistogram();
        callback();
      });
      break;
    default:
      config.sessionViewType = 'force';
      requirejs(["js/libs/sessionViewForce"], function() {
        console.log("sessionViewForce LOADED");
        currentSessionView = new ViewForce();
        callback();
      });
      break;
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

function initialize(callback) {

  console.log("INITIALIZE ...");

  getUrlVariables(function(err, urlVariablesObj) {

    document.dispatchEvent(sessionDragEndEvent);

    console.log("URL VARS\n" + jsonPrint(urlVariablesObj));

    var sessionId;
    var namespace;

    if (!err) {

      console.log("ON LOAD getUrlVariables\n" + jsonPrint(urlVariablesObj));

      if (typeof urlVariablesObj !== 'undefined') {
        if (urlVariablesObj.sessionId) {
          sessionId = urlVariablesObj.sessionId;
        }
        if (urlVariablesObj.namespace) {
          namespace = urlVariablesObj.namespace;
        }
        if (urlVariablesObj.sessionViewType) {

          config.sessionViewType = urlVariablesObj.sessionViewType;

          console.log("ON LOAD getUrlVariables: sessionViewType:" + config.sessionViewType);

          if (config.sessionViewType == 'ticker') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType == 'flow') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType == 'histogram') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }

          loadViewType(config.sessionViewType, function() {

            console.warn(config.sessionViewType);

            if (config.sessionViewType == 'ticker') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'flow') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'histogram') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'force') {
              currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
            }

            store.set('config', config);

            currentSessionView.initD3timer();
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) displayStats(false, palette.white);
              if (!config.showStatsFlag) displayControl(false);
            }, 5000);

            callback();
          });
        }
        else {

          console.warn("DEFAULT_SESSION_VIEW");

          config.sessionViewType = DEFAULT_SESSION_VIEW;

          loadViewType(config.sessionViewType, function() {

            if (config.sessionViewType == 'ticker') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'flow') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'histogram') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'force') {
              currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
            }

            if (config.sessionViewType == 'ticker') {
              initIgnoreWordsHashMap(function() {
                console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
              });
            }
            if (config.sessionViewType == 'flow') {
              initIgnoreWordsHashMap(function() {
                console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
              });
            }
            if (config.sessionViewType == 'histogram') {
              initIgnoreWordsHashMap(function() {
                console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
              });
            }

            store.set('config', config);

            currentSessionView.simulationControl('START');
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) displayStats(false, palette.white);
              if (!config.showStatsFlag) displayControl(false);
            }, 5000);

            callback();

          });
        }
      } 
      else {

        console.warn("DEFAULT_SESSION_VIEW *");

        config.sessionViewType = DEFAULT_SESSION_VIEW;

        loadViewType(config.sessionViewType, function() {

          if (config.sessionViewType == 'ticker') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'flow') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'histogram') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'force') {
            currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
          }

          if (config.sessionViewType == 'ticker') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType == 'flow') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }
          if (config.sessionViewType == 'histogram') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }

          store.set('config', config);

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initUpdateSessionsInterval(50);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
          socket.emit("VIEWER_READY", viewerObj);

          setTimeout(function() {
            console.error("END PAGE LOAD TIMEOUT");
            pageLoadedTimeIntervalFlag = false;
            if (!config.showStatsFlag) displayStats(false, palette.white);
            if (!config.showStatsFlag) displayControl(false);
          }, 5000);
        });

        callback();

      }

    } 
    else {
      console.error("GET URL VARIABLES ERROR\n" + jsonPrint(err));
      callback(err);
    }
  });
};
