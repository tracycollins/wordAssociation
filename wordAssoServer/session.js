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
var controlTableHead;
var controlTableBody;
var controlSliderTable;

var statusSessionId;
var statusSession2Id;

var initializedFlag = false;

// requirejs(["http://d3js.org/d3.v4.min.js"], function(d3Loaded) {
requirejs(["https://cdnjs.cloudflare.com/ajax/libs/d3/4.3.0/d3.min.js"], function(d3Loaded) {
    console.log("d3 LOADED");
    d3 = d3Loaded;
    initialize(function(){
      initializedFlag = true;
      addControlButton();
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

var DEFAULT_SESSION_VIEW = 'force';
var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var pageLoadedTimeIntervalFlag = true;

var debug = false;
var MAX_RX_QUEUE = 250;
var QUEUE_MAX = 200;
var MAX_WORDCHAIN_LENGTH = 100;
var DEFAULT_MAX_AGE = 40000;
var FORCE_MAX_AGE = 10347;
var DEFAULT_AGE_RATE = 1.0;

var DEFAULT_CHARGE = -30;
var DEFAULT_GRAVITY = 0.006;
var DEFAULT_VELOCITY_DECAY = 0.965;
var DEFAULT_LINK_DISTANCE = 10.0;
var DEFAULT_LINK_STRENGTH = 0.80;

var DEFAULT_NODE_RADIUS = 20.0;

var config = {};

config.antonymFlag = false;
config.pauseFlag = false;
config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
config.maxWords = 100;
config.testMode = false;
config.showStatsFlag = false;
config.removeDeadNodesFlag = true;

config.defaultMultiplier = 1000.0;
config.defaultCharge = DEFAULT_CHARGE;
config.defaultGravity = DEFAULT_GRAVITY;
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
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

function displayControl(isVisible) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  document.getElementById('controlDiv').style.visibility = v;
}

function displayInfo(isVisible) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  // controlPanel.document.getElementById('infoDiv').style.visibility = v;
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

    if (!config.pauseFlag) currentSessionView.simulationControl('RESUME');

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayInfo(false);
      displayControl(false);
    }

  }, mouseMoveTimeoutInterval);
}

document.addEventListener("mousemove", function() {
  currentSessionView.simulationControl('PAUSE');
  mouseMovingFlag = true;
  displayControl(true);
  displayInfo(true);
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


var controlPanelWindow; 
var controlPanelFlag = false;

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
  var controlPanelButton = document.createElement("BUTTON");
  controlPanelButton.className = 'button';
  controlPanelButton.setAttribute('id', 'controlPanelButton');
  controlPanelButton.setAttribute('onclick', 'toggleControlPanel()');
  controlPanelButton.innerHTML = controlPanelFlag ? 'HIDE CONTROL' : 'SHOW CONTROL';
  controlDiv.appendChild(controlPanelButton);
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

  // lsbridge.subscribe('controlPanel', function(data) {

  window.addEventListener("message", controlPanelComm, false);

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

  if (config.showStatsFlag) {
    displayInfo(1);
  } else {
    displayInfo(0);
  }
  console.warn("TOGGLE STATS: " + config.showStatsFlag);
  controlPanel.updateControlPanel(config);
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

var serverConnected = false;
var serverHeartbeatTimeout = 30000;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 10000;

var groupHashMap = new HashMap();
var groupDeleteHashMap = new HashMap();

var sessionHashMap = new HashMap();
var sessionDeleteHashMap = new HashMap();

var linkHashMap = new HashMap();
var nodeHashMap = new HashMap();

var ignoreWordHashMap = new HashMap();

var keywordColorHashMap = new HashMap();

keywordColorHashMap.set("positive", palette.lightgreen);
keywordColorHashMap.set("left", palette.blue);
keywordColorHashMap.set("negative", palette.red);
keywordColorHashMap.set("right", palette.red);
keywordColorHashMap.set("neutral", palette.white);


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

function computeInitialPosition(index) {
  var radiusX = 0.01 * window.innerWidth;
  var radiusY = 0.4 * window.innerHeight;
  var pos = {
    x: (0.85*window.innerWidth + (radiusX * Math.cos(index))),
    y: (0.5*window.innerHeight + (radiusY * Math.sin(index)))
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

  serverConnected = true;

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
  serverConnected = true;
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
  serverConnected = true;
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function() {
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
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
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
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
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
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
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
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
  // currentSessionView.reset();
  // nodeHashMap.clear();
  // linkHashMap.clear();
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS ON WINDOW HIDDEN");
    sessionCreateQueue = [];
    // groupHashMap.clear();
    sessionDeleteHashMap.clear();
    // currentSe÷ssionView.resize();
    // currentSessionView.reset();
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
  console.log("visibilityEvent");
  if (!document[hidden]) {
    windowVisible = true;
    currentSessionView.setPause(false);
  } else {
    windowVisible = false;
    currentSessionView.setPause(true);
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


//  KEEPALIVE
setInterval(function() {
  if (serverConnected) {
    socket.emit("SESSION_KEEPALIVE", viewerObj);
    // console.log("SESSION_KEEPALIVE | " + moment());
  }
}, serverKeepaliveInteval);

var lastHeartbeatReceived = 0;

// CHECK FOR SERVER HEARTBEAT
setInterval(function() {
  if (!serverConnected) {
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
    console.error("deleteSession: SID NOT IN HASH: " + nodeId + " ... SKIPPING DELETE");
    return (callback(nodeId));
  }

  var deletedSession = sessionHashMap.get(nodeId);
  var groupLinkId = deletedSession.groupId + "_" + deletedSession.node.nodeId;

  console.log("XXX DELETE SESSION"
    // + " [" + currentSessionView.getSessionsLength() + "]"
    + " | GID: " + deletedSession.groupId 
    + " | NID: " + deletedSession.nodeId 
    + " | SID: " + deletedSession.sessionId 
    + " | UID: " + deletedSession.userId
    + " | SNID: " + deletedSession.linkHashMap.keys()
    + " | SNID: " + deletedSession.node.nodeId
    + " | LINKS: " + jsonPrint(deletedSession.node.links)
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
        console.log("XXX DELETED SESSION " + nId);
        cb();
      });
    },
    function(err) {
      sessionDeleteHashMap.clear();
      callback();
    }
  );
}

var heartBeatsReceived = 0;

socket.on("HEARTBEAT", function(heartbeat) {
  heartBeatsReceived++;
  serverConnected = true;
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

  // resetMouseMoveTimer();
});

socket.on("SESSION_ABORT", function(rxSessionObject) {
  console.error("RX SESSION_ABORT" 
    + " | " + rxSessionObject.sessionId 
    + " | " + rxSessionObject.sessionEvent);
  if (rxSessionObject.sessionId == socket.id) {
    console.error("SESSION_ABORT" 
      + " | " + rxSessionObject.sessionId 
      + " | " + rxSessionObject.sessionEvent);
    serverConnected = false;
    statsObj.socketId = 'ABORTED';
    socket.disconnect();
    store.set('stats', statsObj);
  }
});

socket.on("SESSION_DELETE", function(rxSessionObject) {

  var rxObj = rxSessionObject;

  if (typeof rxObj.session.user !== 'undefined'){

    rxObj.session.nodeId = rxObj.session.user.tags.entity.toLowerCase() + "_" + rxObj.session.user.tags.channel.toLowerCase();

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
  // } else if (sessionDeleteHashMap.has(rxObj.sessionId)) {

  //   console.warn("... SKIP SESSION_UPDATE ... DELETED SESSION: " + rxObj.sessionId);
    
  } else if (sessionMode && (rxObj.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("SKIP SESSION_UPDATE: " + rxObj.sessionId 
        + " | CURRENT: " + currentSession.sessionId);
    }
  } else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

    // rxSessionUpdateQueue.push(rxSessionObject);

    if (rxObj.action == 'KEEPALIVE') {
      // console.log("KEEPALIVE" + " | " + rxObj.userId);
    } else {
      rxSessionUpdateQueue.push(rxSessionObject);
      // console.log("UID: " + rxObj.userId 
      //   // + " | " + jsonPrint(rxObj.tags) 
      //   + " | G: " + rxObj.tags.group
      //   + " | ENT: " + rxObj.tags.entity
      //   + " | CH: " + rxObj.tags.channel
      //   + " | " + rxObj.wordChainIndex 
      //   + " | " + rxObj.source.nodeId 
      //   + " > " + rxObj.target.nodeId
      // );
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
      // sessionHashMap.remove(sessionId);
      return (callback(null, null));
    });
  } else if (rxSessionUpdateQueue.length == 0) {
    // console.log("sessionObject\n");
    return (callback(null, null));
  } else {
    var session = rxSessionUpdateQueue.shift();

    session.nodeId = session.tags.entity.toLowerCase() + "_" + session.tags.channel.toLowerCase();
    session.tags.entity = session.tags.entity.toLowerCase();
    session.tags.channel = session.tags.channel.toLowerCase();

    switch (session.tags.channel){
      case "twitter":
        session.tags.url = "https://twitter.com/" + session.tags.entity.toLowerCase();
        session.tags.group.url = "https://twitter.com/" + session.tags.entity.toLowerCase();
      break;
      case "livestream":
        if (session.tags.entity == 'cspan'){
          session.tags.group.url = "https://www.c-span.org/networks/";          
        }
      break;
    }

    if (typeof session.tags.group !== 'undefined') {
      groupCreateQueue.push(session);
    }
    else {
      console.error("??? GROUP UNDEFINED ... SKIPPING"
        + " | " + session.nodeId
        + "\nTAGS\n" + jsonPrint(session.tags)
      );
    }

    // if (typeof session.tags.url === 'undefined') {
    //   session.tags.url = "http://threeceemedia.com";
    //   groupCreateQueue.push(session);
    // }
    // console.log("R< | " + "\n" + jsonPrint(session));

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
  console.debug("keywordsObj: " + jsonPrint(keywordsObj));
  console.debug("keywordsObj: " + keywordsObj);
  return keywordColorHashMap.get(keywordsObj);
  // for( var kw in keywordsObj ) {
  //   console.debug("kw: " + kw);
  //   if( keywordsObj.hasOwnProperty( kw ) ) {
  //     return keywordColorHashMap.get(kw);
  //   }
  // }
}

var createGroup = function(callback) {
  if (groupCreateQueue.length == 0) {
    return (callback(null, null));
  } 
  else {

    var dateNow = moment().valueOf();
    var sessUpdate = groupCreateQueue.shift();

    // var groupId = sessUpdate.tags.group.toLowerCase();
    var groupId = sessUpdate.tags.group.groupId;
    var groupName = sessUpdate.tags.group.name;
    var groupUrl = sessUpdate.tags.group.url;

    // console.warn("createGroup" + " | " + groupId);

    // var currentGroup = {};
    // var currentSession = {};

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

      // console.warn("FOUND GROUP" + " [" + sessUpdate.wordChainIndex + "]" 
      //   + " | G: " + sessUpdate.tags.group 
      //   + " | C: " + sessUpdate.tags.channel 
      //   + " | E: " + sessUpdate.tags.entity 
      //   + " | U: " + sessUpdate.userId 
      //   + " | " + sessUpdate.source.nodeId 
      //   + " > " + sessUpdate.target.nodeId
      //   // + "\n" + jsonPrint(currentGroup)
      // );

      currentGroup.url = groupUrl;
      currentGroup.mentions++;
      currentGroup.age = 1e-6;
      currentGroup.ageMaxRatio = 1e-6;
      currentGroup.lastSeen = dateNow;
      // currentGroup.text = groupId;
      currentGroup.text = groupName;
      currentGroup.wordChainIndex = sessUpdate.wordChainIndex;


      // GROUP NODE
      currentGroup.node.text = groupId;
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

      var nodeStartColor = "hsl(" + randomNumber360 + ",0%,100%)";
      var nodeEndColor = "hsl(" + randomNumber360 + ",0%,0%)";

      var currentGroup = {};
      var currentSession = {};

      // console.log("CREATE GROUP" + " [" + sessUpdate.wordChainIndex + "]" 
      //   + " | G: " + groupId 
      //   + " | C: " + sessUpdate.tags.channel 
      //   + " | E: " + sessUpdate.tags.entity 
      //   + " | U: " + sessUpdate.userId 
      //   + " | " + sessUpdate.source.nodeId 
      //   + " > " + sessUpdate.target.nodeId
      //   // + "\n" + jsonPrint(sessUpdate)
      // );

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
      currentGroup.node.text = groupId;
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

        console.log("NEW GROUP NODE" 
          + " | " + grpNode.nodeId
          + " | " + grpNode.groupId
          + " | isGroupNode: " + grpNode.isGroupNode
          + " | isSessionNode: " + grpNode.isSessionNode
          // + "\n" + jsonPrint(grpNode)
        );

        currentSessionView.addNode(grpNode);

        addToHashMap(groupHashMap, currentGroup.groupId, currentGroup, function(cGroup) {
          console.log("NEW GROUP " + cGroup.groupId 
            + " | GNID: " + cGroup.node.nodeId
          );
          sessionCreateQueue.push(sessUpdate);
          currentSessionView.addGroup(cGroup);
          // nodeCreateQueue.push(cGroup);
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
    var currentSession = {};

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

      currentSession = sessionHashMap.get(sessUpdate.nodeId);

      // console.log("UPDATE SESS" 
      //   + " [" + sessUpdate.wordChainIndex + "]" 
      //   // + " [" + sessUpdate.mentions + "]" 
      //   + " | UID: " + sessUpdate.userId 
      //   + " | ENT: " + sessUpdate.tags.entity 
      //   + " | CH: " + sessUpdate.tags.channel 
      //   + " | " + sessUpdate.source.nodeId 
      //   + " > " + sessUpdate.target.nodeId
      //   // + "\n" + jsonPrint(sessUpdate)
      // );

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

      currentSession.node.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
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
          // removeFromHashMap(linkHashMap, sessionId, function() {
            // return (callback(null, cSession.sessionId));
          // });
        });
      });

      
    } else {

      sessionsCreated += 1;

      console.log("CREATE SESS" 
        + " [" + sessUpdate.wordChainIndex + "]" 
        // + " [" + sessUpdate.mentions + "]" 
        + " | UID: " + sessUpdate.userId 
        + " | ENT: " + sessUpdate.tags.entity 
        + " | CH: " + sessUpdate.tags.channel 
        + " | URL: " + sessUpdate.tags.url 
        + " | " + sessUpdate.source.nodeId 
        + " > " + sessUpdate.target.nodeId
        // + "\n" + jsonPrint(sessUpdate)
      );

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
      currentSession.node.text = sessUpdate.tags.entity + "[" + sessUpdate.tags.channel + "]";
      currentSession.node.r = config.defaultNodeRadius;
      currentSession.node.x = currentGroup.initialPosition.x + randomIntFromInterval(-10,-20);
      currentSession.node.y = currentGroup.initialPosition.y + randomIntFromInterval(-10,10);

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
        // console.log("NEW SESSION NODE" 
        //   + " | " + sesNode.nodeId
        //   + " | " + sesNode.text
        //   + " | WCI: " + sesNode.wordChainIndex
        //   + " | M: " + sesNode.wordChainIndex
        // );

        currentSessionView.addNode(sesNode);

        addToHashMap(sessionHashMap, currentSession.nodeId, currentSession, function(cSession) {
          // console.log("\nNEW SESSION"
          //   + "\nGRP: " + currentGroup.groupId
          //   + "\nGRPN: " + currentGroup.name
          //   + "\nUID: " + cSession.userId 
          //   + "\nNID: " + cSession.nodeId 
          //   + "\nSID: " + cSession.sessionId 
          //   + "\nSNID: " + cSession.node.nodeId
          //   + "\nLNID: " + cSession.latestNodeId
          //   + "\nWCI:" + cSession.wordChainIndex 
          //   + "\nM:" + cSession.mentions 
          //   // + "\n" + jsonPrint(cSession) 
          // );
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

      // console.log("FOUND NODE" 
      //   + " | " + session.node.nodeId
      //   // + "\n" + jsonPrint(session)
      // );

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

      console.log("CREATE SESSION NODE" 
        + " | " + session.node.nodeId
        // + "\n" + jsonPrint(session)
      );

      session.node.bboxWidth = 1e-6;
      session.node.isSessionNode = true;
      session.node.isGroupNode = false;
      session.node.nodeId = session.tags.entity + "_" + session.tags.channel;
      session.node.entity = session.tags.entity;
      session.node.channel = session.tags.channel;
      session.node.url = session.tags.url;
      session.node.text = session.tags.entity + "[" + session.tags.channel + "]";
      session.node.userId = session.userId;
      session.node.sessionId = session.sessionId;
      session.node.age = 1e-6;
      session.node.ageMaxRatio = 1e-6;
      session.node.isDead = false;
      session.node.wordChainIndex = session.wordChainIndex;
      session.node.mentions = session.wordChainIndex+1;
      session.node.r = config.defaultNodeRadius;
      session.node.x = session.initialPosition.x + randomIntFromInterval(-10,-20);
      session.node.y = session.initialPosition.y + randomIntFromInterval(-10,10);

      // session.node.colors = {};
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
          if (session.source.isIgnored) {
            console.debug("IGNORED SOURCE: " + sourceText);
          }
          if (session.source.isKeyword) {
            console.debug("KEYWORD SOURCE: " + sourceText + ": " + jsonPrint(session.source.keywords));
          }
          if ((config.sessionViewType != 'ticker') && (config.sessionViewType != 'flow') && session.source.isIgnored) {
            // if (ignoreWordHashMap.has(sourceText)) {
            // console.warn("sourceNodeId IGNORED: " + sourceNodeId);
            cb(null, {
              node: sourceNodeId,
              isIgnored: true,
              isNew: false
            });
          } 
          else if (nodeHashMap.has(sourceNodeId)) {
            sourceNode = nodeHashMap.get(sourceNodeId);
            sourceNode.isKeyword = session.source.isKeyword;
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
              sourceNode.text = session.tags.entity + "[" + session.tags.channel + "]";
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
              sourceNode.text = session.tags.entity + "[" + session.tags.channel + "]";
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

          if (session.target.isIgnored) {
            console.debug("IGNORED TARGET: " + targetText);
          }

          if (typeof targetNodeId === 'undefined' || (config.sessionViewType == 'ticker') || (config.sessionViewType == 'flow')) {
          // if (typeof targetNodeId === 'undefined') {
            // console.warn("targetNodeId UNDEFINED ... SKIPPING CREATE NODE");
            cb("TARGET UNDEFINED", null);
          } else if (session.target.isIgnored) {
            // console.warn("targetNodeId IGNORED: " + targetNodeId);
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
              targetNode.text = session.tags.entity + "[" + session.tags.channel + "]";
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
              targetNode.text = session.tags.entity + "[" + session.tags.channel + "]";
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

        // console.warn("results\n" + jsonPrint(results));

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
    // console.warn("cSession\n" + jsonPrint(session));
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
    // && (config.sessionViewType !== 'flow') 
    && !config.disableLinks 
    && (linkCreateQueue.length > 0)) {

    var session = linkCreateQueue.shift();

    // console.warn("createLink session\n" + jsonPrint(session));

    var currentGroup = groupHashMap.get(session.tags.group.groupId);

    // console.warn("createLink currentGroup\n" + jsonPrint(currentGroup));

    var groupLinkId;
    var sessionLinkId;

    // if (!session.node.isGroupNode && (currentGroup.node.nodeId != session.node.nodeId)){
    // if (session.node.isSessionNode && (currentGroup.node.nodeId != session.node.nodeId)){
    if (typeof currentGroup === 'undefined'){
    }
    else if (currentGroup.node.nodeId != session.node.nodeId){

      var groupLinkId = currentGroup.node.nodeId + "_" + session.node.nodeId;

      currentGroup.node.links[groupLinkId] = 1;
      session.node.links[groupLinkId] = 1;

      if (!linkHashMap.has(groupLinkId)){
        // console.error("-M- GROUP LINK HASH MISS | " + groupLinkId);
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
          // console.log("grpLink\n" + jsonPrint(grpLink));
          currentSessionView.addLink(grpLink);
        });
      }
      else {
        var groupLink = linkHashMap.get(groupLinkId);
        // console.log("*** GROUP LINK HASH HIT | " + groupLinkId);
        groupLink.age = 1e-6;
        groupLink.ageMaxRatio = 1e-6;
        addToHashMap(linkHashMap, groupLinkId, groupLink, function(grpLink) {
          // console.log("grpLink\n" + jsonPrint(grpLink));
          // currentSessionView.addLink(grpLink);
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
      requirejs(["js/libs/sessionViewTicker_v4"], function() {
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
      requirejs(["js/libs/sessionViewForce_v4"], function() {
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
              if (!config.showStatsFlag) displayInfo(false);
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

            store.set('config', config);

            currentSessionView.simulationControl('START');
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              console.log("END PAGE LOAD");
              pageLoadedTimeIntervalFlag = false;
              if (!config.showStatsFlag) displayInfo(false);
              if (!config.showStatsFlag) displayControl(false);
            }, 5000);

            callback();

          });
        }
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

          store.set('config', config);

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initUpdateSessionsInterval(50);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
          socket.emit("VIEWER_READY", viewerObj);

          setTimeout(function() {
            console.error("END PAGE LOAD TIMEOUT");
            pageLoadedTimeIntervalFlag = false;
            if (!config.showStatsFlag) displayInfo(false);
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
