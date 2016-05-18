/*ver 0.47*/
/*jslint node: true */
"use strict";

requirejs(["http://d3js.org/d3.v3.min.js"], function(d3) {
    console.log("d3 LOADED");
    initialize();
  },
  function(error) {
    console.log('REQUIREJS ERROR handler', error);
    //error.requireModules : is Array of all failed modules
    var failedId = error.requireModules && error.requireModules[0];
    console.log(failedId);
    console.log(error.message);
  });

var DEFAULT_SESSION_VIEW = 'force';
var currentSessionView;

var pageLoadedTimeIntervalFlag = true;

var config = {};

config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
config.maxWords = 100;
config.testMode = false;
config.showStatsFlag = false;
config.removeDeadNodes = true;
config.disableLinks = false;

var statsObj = {};
statsObj.socketId = null;

var ignoreWordsArray = [
  "a",
  "about",
  "across",
  "all",
  "also",
  "an",
  "and",
  "are",
  "as",
  "at",
  "b",
  "be",
  "been",
  "but",
  "by",
  "can",
  "could",
  "do",
  "dont",
  "else",
  "for",
  "from",
  "had",
  "has",
  "hasnt",
  "have",
  "havent",
  "here",
  "how",
  "if",
  "in",
  "into",
  "is",
  "isnt",
  "it",
  "its",
  "not",
  "of",
  "on",
  "or",
  "should",
  "so",
  "than",
  "that",
  "thats",
  "the",
  "then",
  "there",
  "these",
  "this",
  "those",
  "though",
  "to",
  "too",
  "upon",
  "was",
  "wasnt",
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
];

var debug = false;
var MAX_RX_QUEUE = 250;
var QUEUE_MAX = 200;
var MAX_WORDCHAIN_LENGTH = 100;
var DEFAULT_MAX_AGE = 30000;
var FORCE_MAX_AGE = 5347;
var DEFAULT_AGE_RATE = 1.0;

var dateNow = moment().valueOf();
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";


var DEFAULT_CHARGE = -350;
var DEFAULT_GRAVITY = 0.05;
var DEFAULT_LINK_STRENGTH = 0.1;
var DEFAULT_FRICTION = 0.75;

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
  document.getElementById('controlSliderDiv').style.visibility = v;
}

function displayInfo(isVisible) {
  var v = 'hidden';
  if (isVisible) v = 'visible';
  document.getElementById('infoDiv').style.visibility = v;
}

var mouseMoveTimeout;
var mouseMovingFlag = false;
var mouseMoveTimeoutInterval = 1000;

var mouseMoveTimeout = setTimeout(function() {
  // console.warn("mouseMoveTimeout");
  d3.select("body").style("cursor", "none");
  if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
    displayInfo(false);
  }
  displayControl(false);
}, mouseMoveTimeoutInterval);

function resetMouseMoveTimer() {
  // console.warn("resetMouseMoveTimer");
  clearTimeout(mouseMoveTimeout);

  displayControl(true);
  displayInfo(true);

  mouseMoveTimeout = setTimeout(function() {
    d3.select("body").style("cursor", "none");

    if (!config.showStatsFlag && !pageLoadedTimeIntervalFlag) {
      displayInfo(false);
      displayControl(false);
    }

    mouseMovingFlag = false;
  }, mouseMoveTimeoutInterval);
}

document.addEventListener("mousemove", function() {
  // console.warn("mousemove");
  resetMouseMoveTimer();
  mouseMovingFlag = true;
}, true);

var dragEndPosition = { 'id': 'ID', 'x': 47, 'y': 147};

document.addEventListener("dragEnd", function(e) {
  console.error("DRAG END: " + jsonPrint(dragEndPosition));
  var dragSession = sessionHashMap.get(dragEndPosition.id);
  dragSession.initialPosition.x = dragEndPosition.x;
  dragSession.initialPosition.y = dragEndPosition.y;
  dragSession.node.x = dragEndPosition.x;
  dragSession.node.y = dragEndPosition.y;
  sessionHashMap.set(dragSession.sessionId, dragSession);
  nodeHashMap.set(dragSession.node.nodeId, dragSession.node);
  console.log("dragSession\n" + jsonPrint(dragSession));
});

var sessionDragEndEvent = new CustomEvent(
  'dragEnd', { 
    'detail': dragEndPosition
  } 
);


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
        // var td2 = td.insertCell();
        td.appendChild(document.createTextNode(content));
        td.style.color = tdTextColor;
        td.style.backgroundColor = tdBgColor;
      } else if (content.type == 'TEXT') {
        // console.warn("tableCreateRow\n" + content);
        // var td2 = td.insertCell();
        td.className = content.class;
        td.setAttribute('id', content.id);
        // td.appendChild(document.createTextNode(content.text));
        td.style.color = tdTextColor;
        td.style.backgroundColor = tdBgColor;
        td.innerHTML = content.text;
      } else if (content.type == 'BUTTON') {
        var buttonElement = document.createElement("BUTTON");
        buttonElement.className = content.class;
        buttonElement.setAttribute('id', content.id);
        buttonElement.setAttribute('onclick', content.onclick);
        buttonElement.innerHTML = content.text;
        td.appendChild(buttonElement);
      } else if (content.type == 'SLIDER') {
        var sliderElement = document.createElement("INPUT");
        sliderElement.type = 'range';
        sliderElement.className = content.class;
        sliderElement.setAttribute('id', content.id);
        sliderElement.setAttribute('min', content.min);
        sliderElement.setAttribute('max', content.max);
        sliderElement.setAttribute('oninput', content.oninput);
        sliderElement.value = content.value;
        td.appendChild(sliderElement);
      }
    });
  }
}

function reset() {
  console.error("*** RESET ***");
  if (config.sessionViewType == 'force') {

    currentSessionView.resetDefaultForce();

    setLinkStrengthSliderValue(DEFAULT_LINK_STRENGTH);
    setFrictionSliderValue(DEFAULT_FRICTION);
    setGravitySliderValue(DEFAULT_GRAVITY);
    setChargeSliderValue(DEFAULT_CHARGE);
    setMaxAgeSliderValue(DEFAULT_MAX_AGE);
  }
}

function setLinkStrengthSliderValue(value) {
  document.getElementById("linkStrengthSlider").value = value * 1000;
  currentSessionView.updateLinkStrength(value);
  // document.getElementById("linkStrengthSliderText").innerHTML = value.toFixed(3);
}

function setFrictionSliderValue(value) {
  document.getElementById("frictionSlider").value = value * 1000;
  currentSessionView.updateFriction(value);
  // document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
}

function setGravitySliderValue(value) {
  document.getElementById("gravitySlider").value = value * 1000;
  currentSessionView.updateGravity(value);
  // document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
}

function setChargeSliderValue(value) {
  document.getElementById("chargeSlider").value = value;
  currentSessionView.updateCharge(value);
  // document.getElementById("chargeSliderText").innerHTML = value;
}

function setMaxAgeSliderValue(value) {
  document.getElementById("maxAgeSlider").value = value;
  currentSessionView.setNodeMaxAge(value);
  // document.getElementById("chargeSliderText").innerHTML = value;
}


function updateControlPanel() {
  if (config.showStatsFlag) {
    document.getElementById("statsToggleButton").style.color = "red";
    document.getElementById("statsToggleButton").style.border = "2px solid red";
  } else {
    document.getElementById("statsToggleButton").style.color = "#888888";
    document.getElementById("statsToggleButton").style.border = "1px solid white";
  }
  if (config.testModeEnabled) {
    document.getElementById("testModeButton").style.color = "red";
    document.getElementById("testModeButton").style.border = "2px solid red";
  } else {
    document.getElementById("testModeButton").style.color = "#888888";
    document.getElementById("testModeButton").style.border = "1px solid white";
  }
  if (config.removeDeadNodes) {
    document.getElementById("removeDeadNodeButton").style.color = "red";
    document.getElementById("removeDeadNodeButton").style.border = "2px solid red";
  } else {
    document.getElementById("removeDeadNodeButton").style.color = "#888888";
    document.getElementById("removeDeadNodeButton").style.border = "1px solid white";
  }
  if (config.sessionViewType == 'force'){  
    if (config.disableLinks) {
      document.getElementById("disableLinksButton").style.color = "red";
      document.getElementById("disableLinksButton").style.border = "2px solid red";
    } else {
      document.getElementById("disableLinksButton").style.color = "#888888";
      document.getElementById("disableLinksButton").style.border = "1px solid white";
    }
  }
}

function createControlPanel() {
  var controlTableHead = document.getElementById('controlTableHead');
  var controlTableBody = document.getElementById('controlTableBody');

  var optionsHead = {
    headerFlag: true,
    textColor: '#CCCCCC',
    backgroundColor: '#222222'
  };

  var optionsBody = {
    headerFlag: false,
    textColor: '#BBBBBB',
    backgroundColor: '#111111'
  };

  var fullscreenButton = {
    type: 'BUTTON',
    id: 'fullscreenToggleButton',
    class: 'button',
    onclick: 'toggleFullScreen()',
    text: 'FULLSCREEN'
  }

  var statsButton = {
    type: 'BUTTON',
    id: 'statsToggleButton',
    class: 'button',
    onclick: 'toggleStats()',
    text: 'STATS'
  }

  var testModeButton = {
    type: 'BUTTON',
    id: 'testModeButton',
    class: 'button',
    onclick: 'toggleTestMode()',
    text: 'TEST'
  }

  var status = {
    type: 'TEXT',
    id: 'statusSessionId',
    class: 'statusText',
    text: 'SESSION ID: ' + statsObj.socketId
  }

  var resetButton = {
    type: 'BUTTON',
    id: 'resetButton',
    class: 'button',
    onclick: 'reset()',
    text: 'RESET'
  }

  var disableLinksButton = {
    type: 'BUTTON',
    id: 'disableLinksButton',
    class: 'button',
    onclick: 'toggleDisableLinks()',
    text: 'LINKS'
  }

  var removeDeadNodeButton = {
    type: 'BUTTON',
    id: 'removeDeadNodeButton',
    class: 'button',
    onclick: 'toggleRemoveDeadNode()',
    text: 'DEAD'
  }

  var nodeCreateButton = {
    type: 'BUTTON',
    id: 'nodeCreateButton',
    class: 'button',
    onclick: 'currentSessionView.addRandomNode()',
    text: 'NODE'
  }

  var maxAgeSlider = {
    type: 'SLIDER',
    id: 'maxAgeSlider',
    class: 'slider',
    oninput: 'setMaxAgeSliderValue(this.value)',
    min: 1000,
    max: 60000,
    value: DEFAULT_MAX_AGE,
  }

  var chargeSlider = {
    type: 'SLIDER',
    id: 'chargeSlider',
    class: 'slider',
    oninput: 'setChargeSliderValue(this.value)',
    min: -1000,
    max: 1000,
    value: -300,
  }

  var gravitySlider = {
    type: 'SLIDER',
    id: 'gravitySlider',
    class: 'slider',
    oninput: 'setGravitySliderValue(this.value/1000)',
    min: -100,
    max: 100,
    value: 50,
  }

  var frictionSlider = {
    type: 'SLIDER',
    id: 'frictionSlider',
    class: 'slider',
    oninput: 'setFrictionSliderValue(this.value/1000)',
    min: 0,
    max: 1000,
    value: 300,
  }

  var linkStrengthSlider = {
    type: 'SLIDER',
    id: 'linkStrengthSlider',
    class: 'slider',
    oninput: 'setLinkStrengthSliderValue(this.value/1000)',
    min: 0,
    max: 1000,
    value: 747,
  }

  switch (config.sessionViewType) {
    case 'force':
      // tableCreateRow(controlTableHead, optionsHead, ['FORCE VIEW CONROL TABLE']);
      // tableCreateRow(controlTableBody, optionsBody, ['FULLSCREEN', 'STATS', 'TEST', 'RESET', 'NODE', 'LINK']);
      tableCreateRow(controlTableBody, optionsBody, [status]);
      tableCreateRow(controlTableBody, optionsBody, [fullscreenButton, statsButton, testModeButton, nodeCreateButton, removeDeadNodeButton, disableLinksButton]);
      tableCreateRow(controlSliderTable, optionsBody, [resetButton]);
      tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider]);
      tableCreateRow(controlSliderTable, optionsBody, ['CHARGE', chargeSlider]);
      tableCreateRow(controlSliderTable, optionsBody, ['GRAVITY', gravitySlider]);
      tableCreateRow(controlSliderTable, optionsBody, ['FRICTION', frictionSlider]);
      tableCreateRow(controlSliderTable, optionsBody, ['LINK STRENGTH', linkStrengthSlider]);
      break;
    case 'histogram':
      // tableCreateRow(controlTableHead, optionsHead, ['HISTOGRAM VIEW CONROL TABLE']);
      tableCreateRow(controlTableBody, optionsBody, [status]);
      tableCreateRow(controlTableBody, optionsBody, [fullscreenButton, statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
      tableCreateRow(controlSliderTable, optionsBody, [resetButton]);
      tableCreateRow(controlSliderTable, optionsBody, ['MAX AGE', maxAgeSlider]);

      break;
    default:
      // tableCreateRow(controlTableHead, optionsHead, ['CONROL TABLE HEAD']);
      tableCreateRow(controlTableBody, optionsBody, [status]);
      tableCreateRow(controlTableBody, optionsBody, [fullscreenButton, statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
      break;
  }

  updateControlPanel(config.sessionViewType);
}

function toggleRemoveDeadNode() {
  config.removeDeadNodes = !config.removeDeadNodes;
  currentSessionView.removeDeadNodes = config.removeDeadNodes;
  console.warn("TOGGLE REMOVE DEAD NODES: " + config.removeDeadNodes);
  updateControlPanel(config.sessionViewType);
}

function toggleDisableLinks() {
  config.disableLinks = !config.disableLinks;
  currentSessionView.disableLinks = config.disableLinks;
  console.warn("TOGGLE DISABLE LINKS: " + config.disableLinks);
  updateControlPanel(config.sessionViewType);
}

function toggleStats() {
  config.showStatsFlag = !config.showStatsFlag;

  if (config.showStatsFlag) {
    displayInfo(1);
  } else {
    displayInfo(0);
  }
  console.warn("TOGGLE STATS: " + config.showStatsFlag);
  updateControlPanel(config.sessionViewType);
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

  updateControlPanel(config.sessionViewType);
}

var serverConnected = false;
var serverHeartbeatTimeout = 30000;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 10000;

var linkHashMap = new HashMap();
var nodeHashMap = new HashMap();
var sessionHashMap = new HashMap();
var sessionDeleteHashMap = new HashMap();
var ignoreWordHashMap = new HashMap();

var rxSessionUpdateQueue = [];
var rxSessionDeleteQueue = [];
var sessionCreateQueue = [];
var sessionsCreated = 0;

var nodeCreateQueue = [];
var linkCreateQueue = [];
var nodeDeleteQueue = []; // gets a hash of nodes deleted by sessionViewForce for each d3 timer cycle.


var urlRoot = "http://localhost:9997/session?session=";

var currentSession = {};
var sessionId;
var namespace;
var sessionMode = false;
var monitorMode = false;

// var config = DEFAULT_CONFIG;
// var previousConfig = [];


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
var initialPositionArray = [];
var radiusX = 0.5 * window.innerWidth * 1;
var radiusY = 0.5 * window.innerHeight * 1;

this.initialPositionArrayShift = function() {
  return initialPositionArray.shift();
}

function computeInitialPosition(index) {
  var pos = {
    x: (radiusX + (radiusX * Math.cos(index))),
    y: (radiusY - (radiusY * Math.sin(index)))
  };

  return pos;
}

var randomColorQueue = [];
var randomNumber360 = randomIntFromInterval(0, 360);
var startColor = "hsl(" + randomNumber360 + ",100%,50%)";
var endColor = "hsl(" + randomNumber360 + ",50%,25%)";

randomColorQueue.push({
  "startColor": startColor,
  "endColor": endColor
});

setInterval(function() { // randomColorQueue

  randomNumber360 += randomIntFromInterval(60, 120);
  startColor = "hsl(" + randomNumber360 + ",100%,50%)";
  endColor = "hsl(" + randomNumber360 + ",50%,25%)";

  if (randomColorQueue.length < 50) {
    randomColorQueue.push({
      "startColor": startColor,
      "endColor": endColor
    });
    initialPositionArray.push(computeInitialPosition(initialPositionIndex++));
  }
}, 50);



function getSortedKeys(hmap, sortProperty) {
  var keys = [];
  hmap.forEach(function(value, key) {
    if (value.isSessionNode) {
      // console.error("isSessionNode " + value.nodeId);
    } else {
      keys.push(key);
    }
  });
  // return keys.sort(function(a,b){return hmap.get(b).mentions-hmap.get(a).mentions});
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


setInterval(function() {
  dateNow = moment().valueOf();
}, 100);

var viewerSessionKey;
var socket = io('/view');

socket.on("VIEWER_ACK", function(vSesKey) {

  serverConnected = true;

  console.log("RX VIEWER_ACK | SESSION KEY: " + vSesKey);

  viewerSessionKey = vSesKey;

  var statusSessionId = document.getElementById("statusSessionId");

  if (typeof statusSessionId !== 'undefined') {
    statusSessionId.innerHTML = 'SOCKET: ' + statsObj.socketId;
  } else {
    console.warn("statusSessionId element is undefined");
  }

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

  serverConnected = true;

  socket.emit("VIEWER_READY", viewerObj);
  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    document.getElementById("statusSessionId").innerHTML = 'SOCKET: ' + statsObj.socketId;
    socket.emit("GET_SESSION", currentSession.sessionId);
  } else {
    // socket.emit("REQ_USER_SESSION");
  }
});

socket.on("connect", function() {
  statsObj.socketId = socket.id;
  serverConnected = true;
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
  // document.getElementById("statusSessionId").innerHTML = socket.id;
});

socket.on("reconnect", function() {
  statsObj.socketId = socket.id;
  serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);
  // document.getElementById("statusSessionId").innerHTML = socket.id;
});

socket.on("disconnect", function() {
  serverConnected = false;
  statsObj.socketId = null;
  displayInfo(1.0, 'red');
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  deleteAllSessions(function() {
    console.log("DELETED ALL SESSIONS");
    updateSessionsReady = true;
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
    updateSessionsReady = true;
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
    updateSessionsReady = true;
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
    updateSessionsReady = true;
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
    currentSessionView.resize();
  } else {
    windowVisible = false;
    currentSessionView.reset();
    nodeHashMap.clear();
    linkHashMap.clear();
    deleteAllSessions(function() {
      console.log("DELETED ALL SESSIONS ON WINDOW HIDDEN");
      sessionDeleteHashMap.clear();
      currentSessionView.resize();
    });
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
            console.warn("SESSION MODE | urlSessionId: " + urlSessionId);
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

    console.log("results\n" + results);

    var urlConfig = {};

    // results is an array of objs:  results = [ {key0: val0}, ... {keyN: valN} ];
    async.each(results, function(urlVarObj, cb1) {

      console.warn("urlVarObj\n" + jsonPrint(urlVarObj));

      var urlVarKeys = Object.keys(urlVarObj);

      async.each(urlVarKeys, function(key, cb2) {


        urlConfig[key] = urlVarObj[key];

        console.warn("key: " + key + " > urlVarObj[key]: " + urlVarObj[key]);

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
    console.log("SESSION_KEEPALIVE | " + moment());
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

function deleteSession(sessionId, callback) {

  if (!sessionHashMap.has(sessionId)) {
    console.error("deleteSession: SID NOT IN HASH: " + sessionId + " ... SKIPPING DELETE");
    return (callback(sessionId));
  }

  if (currentSessionView == 'force') currentSessionView.force.stop();

  var deletedSession = sessionHashMap.get(sessionId);

  console.log("XXX DELETE SESSION"
    // + " [" + currentSessionView.getSessionsLength() + "]"
    + " | " + deletedSession.sessionId + " | " + deletedSession.userId
  );

  var sessionLinks = deletedSession.linkHashMap.keys();

  async.each(sessionLinks, function(sessionLinkId, cb) {
      linkHashMap.remove(sessionLinkId);
      cb();
    },
    function(err) {
      sessionHashMap.remove(sessionId);

      // nodeHashMap.remove(deletedSession.node.nodeId);
      // var sessionNode = nodeHashMap.get(deletedSession.userId);
      // sessionNode.isDead = true;
      // nodeHashMap.set(deletedSession.userId, sessionNode);
      nodeHashMap.remove(deletedSession.node.nodeId);

      sessionDeleteHashMap.set(sessionId, 1);

      currentSessionView.deleteSessionLinks(sessionId);
      currentSessionView.deleteNode(deletedSession.node.nodeId);

      return (callback(sessionId));
    }
  );
}

function deleteAllSessions(callback) {

  var sessionIds = sessionHashMap.keys();

  async.each(sessionIds, function(sessionId, cb) {
      deleteSession(sessionId, function(sId) {
        console.log("XXX DELETED SESSION " + sId);
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

  console.log("\n-----------------------\nRX CONFIG_CHANGE\n" + JSON.stringify(rxConfig, null, 3) + "\n------------------------\n");

  if (rxConfig.testMode !== 'undefined') {
    config.testMode = rxConfig.testMode;
    console.log("\n*** ENV CHANGE: TEST_MODE:  WAS: " + previousConfig.testMode + " | NOW: " + config.testMode + "\n");
    previousConfig.testMode = config.testMode;
  }

  if (rxConfig.testSendInterval !== 'undefined') {
    config.testSendInterval = rxConfig.testSendInterval;
    console.log("\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " + previousConfig.testSendInterval + " | NOW: " + config.testSendInterval + "\n");
    previousConfig.testSendInterval = config.testSendInterval;
  }

  if (rxConfig.nodeMaxAge !== 'undefined') {
    config.nodeMaxAge = rxConfig.nodeMaxAge;
    console.log("\n*** ENV CHANGE: NODE_MAX_AGE: WAS: " + previousConfig.nodeMaxAge + " | NOW: " + config.nodeMaxAge + "\n");
    nodeMaxAge = config.nodeMaxAge;
    currentSessionView.setMaxAge(rxConfig.nodeMaxAge);
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }

  // resetMouseMoveTimer();
});

socket.on("SESSION_ABORT", function(rxSessionObject) {
  console.error("RX SESSION_ABORT" + " | " + rxSessionObject.sessionId + " | " + rxSessionObject.sessionEvent);
  if (rxSessionObject.sessionId == socket.id) {
    console.error("SESSION_ABORT" + " | " + rxSessionObject.sessionId + " | " + rxSessionObject.sessionEvent);
    serverConnected = false;
    statsObj.socketId = 'ABORTED';
    socket.disconnect();
  }
});

socket.on("SESSION_DELETE", function(rxSessionObject) {
  var rxObj = rxSessionObject;
  if (sessionHashMap.has(rxObj.sessionId)) {
    console.log("SESSION_DELETE" + " | " + rxSessionObject.sessionId + " | " + rxSessionObject.sessionEvent
      // + "\n" + jsonPrint(rxSessionObject)
    );
    var session = sessionHashMap.get(rxObj.sessionId);
    sessionDeleteHashMap.set(rxObj.sessionId, 1);
    session.sessionEvent = "SESSION_DELETE";
    rxSessionDeleteQueue.push(session);
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
  } else if (sessionDeleteHashMap.has(rxObj.sessionId)) {
    console.warn("... SKIP SESSION_UPDATE ... DELETED SESSION: " + rxObj.sessionId);
  } else if (sessionMode && (rxObj.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("SKIP SESSION_UPDATE: " + rxObj.sessionId + " | CURRENT: " + currentSession.sessionId);
    }
  } else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

    rxSessionUpdateQueue.push(rxSessionObject);

    if (rxObj.action == 'KEEPALIVE') {
      console.log("KEEPALIVE" + " | " + rxObj.userId);
    } else {
      console.log(
        rxObj.userId 
        + " | " + rxObj.wordChainIndex 
        + " | " + rxObj.source.nodeId 
        + " > " + rxObj.target.nodeId
      );
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
  hm.remove(key);
  callback(key);
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
    sessionCreateQueue.push(session);
    return (callback(null, session.sessionId));
  }
}

var processNodeDeleteQueue = function(callback) {
  if (nodeDeleteQueue.length == 0) {
    return (callback(null, "processNodeDeleteQueue"));
  } else {

    var deletedNodeId = nodeDeleteQueue.shift();

    // console.error("processNodeDeleteQueue: DELETE NODE: " + deletedNodeId);

    removeFromHashMap(nodeHashMap, deletedNodeId, function() {
      // console.error("processNodeDeleteQueue: DELETED: " + deletedNodeId);
      return (callback(null, "processNodeDeleteQueue"));
    });

  }
}

var createSession = function(callback) {

  var currentSession = {};

  if (sessionCreateQueue.length == 0) {
    return (callback(null, null));
  } else {

    var sessUpdate = sessionCreateQueue.shift();

    if (sessionDeleteHashMap.has(sessUpdate.sessionId)) {

      console.warn("createSession: " + sessUpdate.userId + " SESSION IN DELETE HASH MAP ... SKIPPING");
      return (callback(null, null));

    } else if (sessionHashMap.has(sessUpdate.sessionId)) {

      currentSession = sessionHashMap.get(sessUpdate.sessionId);

      if (nodeHashMap.has(currentSession.node.nodeId)) {
        currentSession.node = nodeHashMap.get(currentSession.node.nodeId);
      }

      var prevLatestNodeId = currentSession.latestNodeId;
      var prevSessionLinkId = currentSession.node.nodeId + "_" + prevLatestNodeId;

      removeFromHashMap(linkHashMap, prevSessionLinkId, function() {
        currentSessionView.deleteLink(prevSessionLinkId);
      });

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
      currentSession.node.interpolateColor = currentSession.interpolateColor;
      currentSession.node.x = currentSession.initialPosition.x;
      currentSession.node.y = currentSession.initialPosition.y;

      var sessionLinkId = currentSession.node.nodeId + "_" + sessUpdate.source.nodeId;
      currentSession.node.links = {};
      currentSession.node.links[sessionLinkId] = 1;

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {});

      addToHashMap(sessionHashMap, currentSession.sessionId, currentSession, function(cSession) {
        nodeCreateQueue.push(cSession);
        removeFromHashMap(linkHashMap, sessionId, function() {
          return (callback(null, cSession.sessionId));
        });
      });
    } else {

      sessionsCreated += 1;

      console.log("CREATE SESS" + " [" + sessUpdate.wordChainIndex + "]" 
        + " | UID: " + sessUpdate.userId 
        + " | " + sessUpdate.source.nodeId 
        + " > " + sessUpdate.target.nodeId
        // + "\n" + jsonPrint(sessUpdate)
      );

      currentSession.rank = -1;
      currentSession.isSession = true;
      currentSession.sessionId = sessUpdate.sessionId;
      currentSession.nodeId = sessUpdate.userId;
      currentSession.userId = sessUpdate.userId;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.text = sessUpdate.userId;
      currentSession.source = sessUpdate.source;
      currentSession.target = sessUpdate.target;
      currentSession.latestNodeId = sessUpdate.source.nodeId;

      currentSession.node = {};
      currentSession.age = 0;
      currentSession.linkHashMap = new HashMap();
      currentSession.initialPosition = initialPositionArray.shift();
      currentSession.x = currentSession.initialPosition.x;
      currentSession.y = currentSession.initialPosition.y;
      currentSession.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.colors = {};
      currentSession.colors = randomColorQueue.shift();

      var interpolateNodeColor = d3.interpolateHcl(currentSession.colors.endColor, currentSession.colors.startColor);
      currentSession.interpolateColor = interpolateNodeColor;

      // CREATE SESSION NODE
      var sessionNode = {};

      currentSession.node.isSessionNode = true;
      currentSession.node.nodeId = sessUpdate.userId;
      currentSession.node.userId = sessUpdate.userId;
      currentSession.node.sessionId = sessUpdate.sessionId;
      currentSession.node.age = 0;
      currentSession.node.ageUpdated = dateNow;
      currentSession.node.lastSeen = dateNow;
      currentSession.node.wordChainIndex = sessUpdate.wordChainIndex;
      currentSession.node.mentions = sessUpdate.wordChainIndex;
      currentSession.node.text = sessUpdate.userId;
      currentSession.node.x = currentSession.initialPosition.x;
      currentSession.node.y = currentSession.initialPosition.y;
      currentSession.node.fixed = true;
      currentSession.node.colors = currentSession.colors;
      currentSession.node.interpolateColor = currentSession.interpolateColor;

      currentSession.node.links = {};

      var sessionLinkId = sessUpdate.userId + "_" + currentSession.latestNodeId;
      currentSession.node.links[sessionLinkId] = 1;
      currentSession.node.link = sessionLinkId;

      currentSession.source.lastSeen = dateNow;
      if (typeof currentSession.target !== 'undefined') {
        currentSession.target.lastSeen = dateNow;
      }

      addToHashMap(nodeHashMap, currentSession.node.nodeId, currentSession.node, function(sesNode) {
        console.log("NEW SESSION NODE " + " | " + sesNode.nodeId
          // + "\n" + jsonPrint(sesNode) 
        );

        currentSessionView.addNode(sesNode);

        addToHashMap(sessionHashMap, currentSession.sessionId, currentSession, function(cSession) {
          console.log("NEW SESSION " + cSession.userId + " | " + cSession.sessionId + " | SNID: " + cSession.node.nodeId
            // + "\n" + jsonPrint(cSession) 
          );
          currentSessionView.addSession(cSession);
          nodeCreateQueue.push(cSession);
          return (callback(null, cSession.sessionId));
        });
      });
    }
  }
}

var createNode = function(callback) {

  if (nodeCreateQueue.length > 0) {

    var dateNow = moment().valueOf();

    var session = nodeCreateQueue.shift();

    // console.warn("createNode: SESSION" + " | NID: " + session.nodeId + " | UID: " + session.userId + " | SID: " + session.sessionId + "\n" + jsonPrint(session));

    // if (nodeHashMap.has(sessionId)) {
    if (nodeHashMap.has(session.node.nodeId)) {

      var sessionNode = nodeHashMap.get(session.node.nodeId);

      // console.warn("createNode: SESSION NODE IN HASH" 
      // + " | SNID: " + sessionNode.nodeId 
      // + " | SNUID: " + sessionNode.userId 
      // + " | SNSID: " + sessionNode.sessionId 
      // + "\n" + jsonPrint(sessionNode));

      sessionNode.age = 0;
      sessionNode.wordChainIndex = session.wordChainIndex;
      sessionNode.x = session.x;
      sessionNode.y = session.y;
      sessionNode.fixed = true;
      sessionNode.colors = session.colors;
      sessionNode.interpolateColor = session.interpolateColor;

      addToHashMap(nodeHashMap, session.node.nodeId, sessionNode, function(sNode) {
        // currentSessionView.addNode(sNode);
        // console.error("EXIST SESSION NODE" 
        //   + " | " + sNode.nodeId 
        //   + "\n" + jsonPrint(sNode) 
        // );
      });
    } else {

      // var sessionNode = nodeHashMap.get(session.node.nodeId);

      session.node.nodeId = session.userId;
      session.node.userId = session.userId;
      session.node.sessionId = session.sessionId;
      session.node.age = 0;
      session.node.wordChainIndex = session.wordChainIndex;
      session.node.x = session.x;
      session.node.y = session.y;
      session.node.fixed = true;
      session.node.colors = session.colors;
      session.node.interpolateColor = session.interpolateColor;

      addToHashMap(nodeHashMap, session.node.nodeId, session.node, function(sNode) {
        currentSessionView.addNode(sNode);
        // console.log("CREATE SESSION NODE" 
        //   + " | " + sNode.nodeId 
        //   // + "\n" + jsonPrint(sNode) 
        // );
      });
    }


    var sourceNodeId = session.source.nodeId;
    var targetNodeId = session.target.nodeId;
    var targetNode = {};
    var sourceNode = {};


    async.parallel({
        source: function(cb) {
          if (ignoreWordHashMap.has(sourceNodeId)) {
            console.warn("sourceNodeId IGNORED: " + sourceNodeId);
            cb(null, {
              node: sourceNodeId,
              isIgnored: true,
              isNew: false
            });
          } else if (nodeHashMap.has(sourceNodeId)) {
            sourceNode = nodeHashMap.get(sourceNodeId);
            sourceNode.newFlag = false;
            sourceNode.userId = session.userId;
            sourceNode.sessionId = session.sessionId;
            sourceNode.age = 0;
            sourceNode.ageUpdated = dateNow;
            sourceNode.lastSeen = dateNow;
            sourceNode.mentions = session.source.mentions;
            // sourceNode.text = session.wordChainIndex + ' | ' + sourceNodeId;
            sourceNode.text = sourceNodeId;
            sourceNode.latestNode = true;
            sourceNode.colors = session.colors;
            sourceNode.interpolateColor = session.interpolateColor;

            addToHashMap(nodeHashMap, sourceNodeId, sourceNode, function(sNode) {
              cb(null, {
                node: sNode,
                isIgnored: false,
                isNew: false
              });
            });
          } else {
            sourceNode = session.source;
            sourceNode.newFlag = true;
            sourceNode.x = session.initialPosition.x + (100 * Math.random());
            sourceNode.y = session.initialPosition.y + 100;
            sourceNode.userId = session.userId;
            sourceNode.sessionId = session.sessionId;
            sourceNode.links = {};
            sourceNode.rank = -1;
            sourceNode.age = 0;
            sourceNode.lastSeen = dateNow;
            sourceNode.ageUpdated = dateNow;
            sourceNode.colors = session.colors;
            sourceNode.interpolateColor = session.interpolateColor;
            // sourceNode.text = session.wordChainIndex + ' | ' + sourceNodeId;
            sourceNode.text = sourceNodeId;
            sourceNode.latestNode = true;

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
          if (typeof targetNodeId === 'undefined') {
            console.warn("targetNodeId UNDEFINED ... SKIPPING CREATE NODE");
            cb("TARGET UNDEFINED", null);
          } else if (ignoreWordHashMap.has(targetNodeId)) {
            console.warn("targetNodeId IGNORED: " + targetNodeId);
            cb(null, {
              node: targetNodeId,
              isIgnored: true,
              isNew: false
            });
          } else if (nodeHashMap.has(targetNodeId)) {
            targetNode = nodeHashMap.get(targetNodeId);
            targetNode.newFlag = false;
            targetNode.userId = session.userId;
            targetNode.sessionId = session.sessionId;
            targetNode.age = 0;
            targetNode.ageUpdated = dateNow;
            targetNode.lastSeen = dateNow;
            targetNode.mentions = session.target.mentions;
            // targetNode.text = session.wordChainIndex + ' | ' + targetNodeId;
            targetNode.text = targetNodeId;
            targetNode.colors = session.colors;
            targetNode.interpolateColor = session.interpolateColor;
            targetNode.latestNode = false;

            addToHashMap(nodeHashMap, targetNodeId, targetNode, function(tNode) {
              cb(null, {
                node: tNode,
                isIgnored: false,
                isNew: false
              });
            });
          } else {
            targetNode = session.target;
            targetNode.newFlag = true;
            targetNode.x = session.initialPosition.x - (100 - 100 * Math.random());
            targetNode.y = session.initialPosition.y - (100 - 100 * Math.random());
            targetNode.userId = session.userId;
            targetNode.sessionId = session.sessionId;
            targetNode.links = {};
            targetNode.rank = -1;
            targetNode.age = 0;
            targetNode.lastSeen = dateNow;
            targetNode.ageUpdated = dateNow;
            targetNode.colors = session.colors;
            targetNode.interpolateColor = session.interpolateColor;
            // targetNode.text = session.wordChainIndex + ' | ' + targetNodeId;
            targetNode.text = targetNodeId;
            targetNode.latestNode = false;

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
        // console.warn("CREATE NODE RESULTS\n" + jsonPrint(results));

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

        addToHashMap(sessionHashMap, session.sessionId, session, function(cSession) {
          // if (!cSession.source.isNew && !cSession.target.isNew){
          //   console.error("BOTH NOT NEW");
          // }
          // console.warn("CREATE NODE UPDATED SESSION " 
          //   + " | " + cSession.userId 
          //   + " | " + cSession.sessionId 
          //   + " | SNID: " + cSession.node.nodeId 
          //   + " | " + cSession.source.nodeId + " (" + cSession.source.isNew + ")"
          //   + " > " + cSession.target.nodeId  + " (" + cSession.target.isNew + ")"
          //   // + "\n" + jsonPrint(cSession) 
          // );
          if (!results.source.isIgnored) linkCreateQueue.push(cSession);
        });
      });
  }
  return (callback(null, sessionId));
}

var createLink = function(callback) {

  if (!config.disableLinks && (linkCreateQueue.length > 0)) {
    var session = linkCreateQueue.shift();

    var sessionLinkId = session.node.nodeId + "_" + session.latestNodeId;

    var newSessionLink = {
      linkId: sessionLinkId,
      userId: session.userId,
      sessionId: session.sessionId,
      age: 0,
      source: session.node,
      target: session.source,
      isSessionLink: true
    };

    addToHashMap(linkHashMap, sessionLinkId, newSessionLink, function(sesLink) {
      currentSessionView.addLink(sesLink);
    });

    var sourceWordId = session.source.nodeId;
    var sourceWord = nodeHashMap.get(sourceWordId);
    if (!sourceWord) {
      console.error("SOURCE UNDEFINED ... SKIPPING CREATE LINK");
      return (callback(null, sessionId));
    }
    else if (typeof sourceWord.links === 'undefined') {
      sourceWord.links = {};
      sourceWord.links[sessionId] = 1;
    }

    var newLink;

    if (typeof session.target !== 'undefined') {

      var targetWordId = session.target.nodeId;
      var targetWord;

      if (nodeHashMap.has(targetWordId)) {
        targetWord = nodeHashMap.get(targetWordId);
        if (typeof targetWord.links !== 'undefined') {
          // console.warn("XXX targetWord.links[sessionId]"
          //   + " | " + sessionId
          //   + "\n" + jsonPrint(targetWord.links)
          //   );
          delete targetWord.links[sessionId];
        }

        var linkId = generateLinkId();

        newLink = {
          linkId: linkId,
          sessionId: session.sessionId,
          userId: session.userId,
          age: 0,
          source: sourceWord,
          target: targetWord
        };

        sourceWord.links[linkId] = 1;
        targetWord.links[linkId] = 1;

        addToHashMap(nodeHashMap, targetWordId, targetWord, function() {});
        addToHashMap(nodeHashMap, sourceWordId, sourceWord, function() {});

        addToHashMap(linkHashMap, linkId, newLink, function(nLink) {
          currentSessionView.addLink(nLink);
        });
      } else {
        console.warn("SESSION TARGET UNDEFINED" + " | " + sessionId)
        console.warn("??? TARGET " + targetWordId + " NOT IN HASH MAP ... SKIPPING NEW LINK: SOURCE: " + sourceWordId);
      }
    } else {
      console.warn("SESSION TARGET UNDEFINED" + " | " + sessionId)
    }


    addToHashMap(sessionHashMap, session.sessionId, session, function(sess) {});
  }
  return (callback(null, sessionId));
}

var ageSessions = function(callback) {

  var dateNow = moment().valueOf();

  var ageSession;

  var ageSessionsLength = currentSessionView.getSessionsLength() - 1;
  var ageSessionsIndex = currentSessionView.getSessionsLength() - 1;

  for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex >= 0; ageSessionsIndex -= 1) {

    // ageSession = sessions[ageSessionsIndex];
    ageSession = currentSessionView.getSession(ageSessionsIndex);

    if (!sessionHashMap.has(ageSession.sessionId)) {
      // if (!forceStopped) {
      //   forceStopped = true;
      //   force.stop();
      // }
      console.warn("XXX SESSION" + sessionId);
      if (typeof currentSessionView.sessions === 'undefined'){
        console.error("???? currentSessionView.sessions UNDEFINED");
      }
      else {
        currentSessionView.sessions.splice(ageSessionsIndex, 1);
      }
    }
  }

  if (ageSessionsIndex < 0) {
    return (callback(null, sessionId));
  }
}

var updateSessionsReady = true;

function updateSessions() {

  updateSessionsReady = false;

  async.series(
    [
      processNodeDeleteQueue,
      processSessionQueues,
      // rankSessions,
      // rankNodes,
      createSession,
      createNode,
      createLink,
      // updateSessionsArray,
      // updateNodesArray,
      // updateLinksArray,
      ageSessions,
    ],

    function(err, result) {
      if (err) {
        console.error("*** ERROR: createSessionNodeLink *** \nERROR: " + err);
      }
      updateSessionsReady = true;
    }
  );
}

function toggleFullScreen() {
  if (!document.fullscreenElement &&
    !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {

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
  console.log(err.requireType);
  if (err.requireType === 'timeout') {
    console.log('modules: ' + err.requireModules);
  }

  throw err;
};

function loadViewType(svt, callback) {

  console.warn("LOADING SESSION VIEW TYPE: " + svt);

  switch (svt) {
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

function initialize() {

  console.log("initialize");


  getUrlVariables(function(err, urlVariablesObj) {

    document.dispatchEvent(sessionDragEndEvent);

    console.warn("URL VARS\n" + jsonPrint(urlVariablesObj));

    var sessionId;
    var namespace;
    // var sessionViewType;

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

          if (config.sessionViewType == 'histogram') {
            initIgnoreWordsHashMap(function() {
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }

          loadViewType(config.sessionViewType, function() {

            if (config.sessionViewType == 'histogram') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'force') {
              currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
            }

            currentSessionView.initD3timer();
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);
            createControlPanel(config.sessionViewType);

            setTimeout(function() {
              console.log("END PAGE LOAD TIMEOUT");
              pageLoadedTimeIntervalFlag = false;
              displayInfo(false);
              displayControl(false);
            }, 5000);
          });
        } else {

          config.sessionViewType = DEFAULT_SESSION_VIEW;

          loadViewType(config.sessionViewType, function() {

            if (config.sessionViewType == 'histogram') {
              currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
            }
            if (config.sessionViewType == 'force') {
              currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
            }

            currentSessionView.initD3timer();
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);
            createControlPanel(config.sessionViewType);

            setTimeout(function() {
              console.log("END PAGE LOAD");
              pageLoadedTimeIntervalFlag = false;
              displayInfo(false);
              displayControl(false);
            }, 5000);
          });
        }
      } else {

        config.sessionViewType = DEFAULT_SESSION_VIEW;

        loadViewType(config.sessionViewType, function() {

          if (config.sessionViewType == 'histogram') {
            currentSessionView.setNodeMaxAge(DEFAULT_MAX_AGE);
          }
          if (config.sessionViewType == 'force') {
            currentSessionView.setNodeMaxAge(FORCE_MAX_AGE);
          }

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initUpdateSessionsInterval(50);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
          socket.emit("VIEWER_READY", viewerObj);
          createControlPanel(config.sessionViewType);

          setTimeout(function() {
            console.error("END PAGE LOAD TIMEOUT");
            pageLoadedTimeIntervalFlag = false;
            displayInfo(false);
            displayControl(false);
          }, 5000);
        });

      }
    } else {
      console.error("GET URL VARIABLES ERROR\n" + jsonPrint(err));
    }
  });
};
