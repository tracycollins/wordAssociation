/* jshint undef: true, unused: true */
/* globals
*/

"use strict";

const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";

const DEFAULT_SOURCE = REPLACE_SOURCE;

var DEFAULT_AUTH_URL = "http://word.threeceelabs.com/auth/twitter";

const ONE_SECOND = 1000;
const ONE_MINUTE = 60*ONE_SECOND;

const DEFAULT_KEEPALIVE_INTERVAL = ONE_MINUTE;

var MAX_RX_QUEUE = 250;

var MAX_READY_ACK_WAIT_COUNT = 10;

var config = {};
var previousConfig = {};

config.keepaliveInterval = 60000;
config.viewerReadyInterval = 10000;

var statsObj = {};

statsObj.isAuthenticated = false;
statsObj.maxNodes = 0;
statsObj.maxNodeAddQ = 0;
statsObj.serverConnected = false;

statsObj.socket = {};
statsObj.socket.errors = 0;
statsObj.socket.error = false;
statsObj.socket.connected = true;
statsObj.socket.connects = 0;
statsObj.socket.reconnects = 0;

var RX_NODE_QUEUE_INTERVAL = 10;
var RX_NODE_QUEUE_MAX = 100;

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

var DEFAULT_VIEWER_OBJ = {
  nodeId: VIEWER_ID,
  userId: VIEWER_ID,
  viewerId: VIEWER_ID,
  screenName: VIEWER_ID,
  type: "viewer",
  namespace: "view",
  timeStamp: Date.now(),
  tags: {}
};

DEFAULT_VIEWER_OBJ.tags.type = "viewer";
DEFAULT_VIEWER_OBJ.tags.mode = "stream";
DEFAULT_VIEWER_OBJ.tags.entity = VIEWER_ID;

var viewerObj = {};
viewerObj = DEFAULT_VIEWER_OBJ;

console.log("viewerObj\n" + jsonPrint(viewerObj));

var PARENT_ID = "0047";

var PAGE_LOAD_TIMEOUT = 1000;

var DEFAULT_SESSION_VIEW = "template";

requirejs(["/onload.js"], function() {

    console.log("LOADED");

    initialize(function(){
      PARENT_ID = config.sessionViewType;
    });

  },
  function(error) {
    console.log("REQUIREJS ERROR handler", error);
    console.log(error.requireModules && error.requireModules[0]);
    console.log(error.message);
  }
);

var currentSessionView;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

var pageLoadedTimeIntervalFlag = true;

var DEFAULT_MAX_NODES = 100;

config.fullscreenMode = false;

config.authenticationUrl = DEFAULT_AUTH_URL;
config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??
config.testMode = false;

var serverHeartbeatTimeout = 120000;
var serverCheckInterval = 120000;

var socket = io("/view");

var seconds;
var minutes;
var hours;
var days;

function msToTime(duration) {
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

var serverActiveTimeoutEventObj = new CustomEvent("serverActiveTimeoutEvent");
var serverActiveTimeout;
var serverActiveFlag = false;
var serverActiveTimeoutInterval = 90*ONE_SECOND;

function resetServerActiveTimer() {

  serverActiveFlag = true;

  clearTimeout(serverActiveTimeout);

  serverActiveTimeout = setTimeout(function() {

    serverActiveFlag = false;

    document.dispatchEvent(serverActiveTimeoutEventObj);

  }, serverActiveTimeoutInterval);
}

window.onbeforeunload = function() {
};

function toggleTestMode() {
  config.testMode = !config.testMode;
  config.testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + config.testModeEnabled);
  currentSessionView.setTestMode(config.testModeEnabled);
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
  if (prefix) { return prefix + "visibilitychange"; } 
  else { return "visibilitychange"; }
}

var viewerReadyInterval;

function initViewerReadyInterval(interval){

  console.log("INIT VIEWER READY INTERVAL");

  clearInterval(viewerReadyInterval);

  viewerReadyInterval = setInterval(function(){

    if (statsObj.serverConnected && !statsObj.viewerReadyTransmitted && !statsObj.viewerReadyAck){

      viewerObj.timeStamp = Date.now();

      console.log("T> VIEWER_READY"
        + " | " + viewerObj.userId
        + " | CONNECTED: " + statsObj.serverConnected
        + " | READY TXD: " + statsObj.viewerReadyTransmitted
        + " | READY ACK RXD: " + statsObj.viewerReadyAck
        + " | " + getTimeStamp()
      );

      statsObj.viewerReadyTransmitted = true; 

      socket.emit("VIEWER_READY", {userId: viewerObj.userId, timeStamp: Date.now()}, function(){
        statsObj.viewerReadyTransmitted = true;
      }); 

      clearInterval(viewerReadyInterval);

    }

    else if (statsObj.serverConnected && statsObj.viewerReadyTransmitted && !statsObj.viewerReadyAck) {

      if (statsObj.userReadyAckWait > MAX_READY_ACK_WAIT_COUNT){
        statsObj.viewerReadyTransmitted = false;
        console.log("*** RESENDING _READY AFTER " + MAX_READY_ACK_WAIT_COUNT + " WAIT CYCLES");
      }
      else {
        statsObj.userReadyAckWait += 1;
        console.log("... WAITING FOR VIEWER_READY_ACK"
          + " | " + MAX_READY_ACK_WAIT_COUNT + " WAIT CYCLES"
        );
      }

    }
    else if (!statsObj.serverConnected) {
      console.log("... WAITING FOR SERVER CONNECTION ...");
    }

  }, interval);
}

function sendKeepAlive(viewerObj, callback){

  if (statsObj.viewerReadyAck && statsObj.serverConnected){

    var statsObjSmall = statsObj;
    delete statsObjSmall.heartBeat;

    socket.emit(
      "SESSION_KEEPALIVE", 
      {
        user: viewerObj, 
        stats: statsObjSmall, 
        results: {}
      }
    );

    callback(null);
  }
  else {
    console.error("!!!! CANNOT TX KEEPALIVE"
      + " | " + viewerObj.userId
      + " | CONNECTED: " + statsObj.serverConnected
      + " | READY TXD: " + statsObj.viewerReadyTransmitted
      + " | READY ACK RXD: " + statsObj.viewerReadyAck
      + " | " + moment().format(defaultDateTimeFormat)
    );
    callback("ERROR");
  }
}

var socketKeepaliveInterval;

function initKeepalive(viewerObj, interval){

  var keepaliveIndex = 0;

  clearInterval(socketKeepaliveInterval);

  console.log("START KEEPALIVE"
    + " | READY ACK: " + statsObj.viewerReadyAck
    + " | SERVER CONNECTED: " + statsObj.serverConnected
    + " | INTERVAL: " + interval + " ms"
  );

  sendKeepAlive(viewerObj, function(err){
    if (err) {
      console.error("KEEPALIVE ERROR: " + err);
    }
  });

  socketKeepaliveInterval = setInterval(function(){ // TX KEEPALIVE

    statsObj.elapsed = Date.now() - statsObj.startTime;

    viewerObj.stats = statsObj;

    sendKeepAlive(viewerObj, function(err){
      if (err) {
        console.error("KEEPALIVE ERROR: " + err);
      }
    });

    keepaliveIndex += 1;

  }, interval);
}

var lastHeartbeatReceived = 0;

// CHECK FOR SERVER HEARTBEAT
setInterval(function() {
  if (!statsObj.serverConnected) {
    console.error("\n????? SERVER DOWN ????? | | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(Date.now() - lastHeartbeatReceived));
    socket.connect();
  }
  else if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.error("\n????? SERVER DOWN ????? | LAST HEARTBEAT: " 
      + getTimeStamp(lastHeartbeatReceived) 
      + " | " + moment().format(defaultDateTimeFormat) 
      + " | AGO: " + msToTime(Date.now() - lastHeartbeatReceived));
    socket.connect();
  }
}, serverCheckInterval);

var heartBeatsReceived = 0;

socket.on("connect", function() {

  viewerObj.socketId = socket.id;

  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);

  statsObj.socket.connects += 1;

  viewerObj.timeStamp = Date.now();

  socket.emit("authentication", { namespace: "view", userId: viewerObj.userId, password: "0123456789" });
});

socket.on("SERVER_READY", function(serverAck) {
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  console.log("RX SERVER_READY | SERVER ACK: " + jsonPrint(serverAck));
});

socket.on("VIEWER_READY_ACK", function(vSesKey) {

  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  statsObj.viewerReadyAck = true;


  console.log("RX VIEWER_READY_ACK | SESSION KEY: " + vSesKey);

  statsObj.viewerSessionKey = vSesKey;
  viewerObj.viewerSessionKey = vSesKey;

  if (config.VIEWER_OBJ === undefined) {
    config.VIEWER_OBJ = {};
  }

  config.VIEWER_OBJ = viewerObj;

  initKeepalive(viewerObj, DEFAULT_KEEPALIVE_INTERVAL);
});

socket.on("USER_AUTHENTICATED", function(userObj) {
  statsObj.isAuthenticated = true;
  statsObj.socket.connected = true;
  console.log("RX USER_AUTHENTICATED | USER: @" + userObj.screenName);
});

socket.on("reconnect", function() {

  viewerObj.socketId = socket.id;

  statsObj.serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

  statsObj.socket.reconnects += 1;
  statsObj.socket.connected = true;

  viewerObj.timeStamp = Date.now();

  socket.emit("VIEWER_READY", viewerObj, function(){
    statsObj.viewerReadyTransmitted = true;
    socket.emit("authentication", { namespace: "view", userId: viewerObj.userId, password: "0123456789" });
  }); 
});

socket.on("disconnect", function() {

  statsObj.serverConnected = false;

  statsObj.socket.connected = false;

  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
});

var socketErrorTimeout;

socket.on("error", function(error) {

  statsObj.socket.errors += 1;
  statsObj.socket.error = error;

  console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET ERROR\n" + error);

  socket.disconnect(true); // full disconnect, not just namespace

  clearTimeout(socketErrorTimeout);

  socketErrorTimeout = setTimeout(function(){
    socket.connect();
  }, 5000);
});

socket.on("connect_error", function(error) {

  statsObj.socket.errors += 1;
  statsObj.socket.error = error;

  console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET CONNECT ERROR\n" + error);
});

socket.on("reconnect_error", function(error) {

  statsObj.socket.errors += 1;
  statsObj.socket.error = error;

  console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
  console.error("*** SOCKET RECONNECT ERROR\n" + error);
});

socket.on("unauthorized", function(err){

  statsObj.serverConnected = true;

  console.error("TSS | *** UNAUTHORIZED *** "
    + " | ID: " + socket.id
    + " | VIEWER ID: " + viewerObj.userId
    + " | " + err.message
  );
});

socket.on("authenticated", function() {

  console.debug("AUTHENTICATED | " + socket.id);

  statsObj.socketId = socket.id;
  statsObj.serverConnected = true;
  statsObj.userReadyTransmitted = false;
  statsObj.userReadyAck = false;

  console.log( "CONNECTED TO HOST" 
    + " | ID: " + socket.id 
  );

  initViewerReadyInterval(config.viewerReadyInterval);
});

const sSmall = {};
sSmall.bestNetwork = {};

socket.on("HEARTBEAT", function(hb) {

  resetServerActiveTimer();

  statsObj.bestNetwork = hb.bestNetwork;

  heartBeatsReceived += 1;
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  lastHeartbeatReceived = Date.now();

  sSmall.bestNetwork = hb.bestNetwork;
});

socket.on("STATS", function(message) {

  statsObj.serverConnected = true;
  statsObj.socket.connected = true;

  console.log("<R STATS" 
    + "\n" + jsonPrint(message.stats)
  );
});

var windowVisible = true;

document.title = "template_title";

var prefix = getBrowserPrefix();
var hidden = hiddenProperty(prefix);
var visibilityEvent = getVisibilityEvent(prefix);

function reset(){
  windowVisible = true;
  if (currentSessionView !== undefined) { currentSessionView.reset(); }
}

document.addEventListener(visibilityEvent, function() {
  if (!document[hidden]) {
    windowVisible = true;
    console.info("visibilityEvent: " + windowVisible);
  } 
  else {
    windowVisible = false;
    console.info("visibilityEvent: " + windowVisible);
  }
});

var rxNodeQueueReady = false;
var rxNodeQueue = [];

var rxNode = function(node){
  statsObj.serverConnected = true;
  statsObj.socket.connected = true;
  if (rxNodeQueue.length < RX_NODE_QUEUE_MAX){ rxNodeQueue.push(node); }
};

var rxNodeQueueInterval;

function initRxNodeQueueInterval(){

  socket.on("node", rxNode);

  rxNodeQueueReady = true;

  var newNode = {};

  clearInterval(rxNodeQueueInterval);

  rxNodeQueueInterval = setInterval(function(){
    if (rxNodeQueueReady && (rxNodeQueue.length > 0)) {
      rxNodeQueueReady = false;
      newNode = rxNodeQueue.shift();
      currentSessionView.addNode(newNode);
      rxNodeQueueReady = true;
    }
  }, RX_NODE_QUEUE_INTERVAL);

}

//================================
// GET NODES FROM QUEUE
//================================

requirejs.onError = function(err) {
  console.error("*** REQUIRE ERROR\n" + err);
  if (err.requireType === "timeout") {
    console.log("modules: " + err.requireModules);
  }
  throw err;
};

function loadViewType(svt, callback) {

  console.log("LOADING SESSION VIEW TYPE: " + svt);

  config.sessionViewType = "template";

  requirejs(["js/libs/sessionView_template"], function() {

    currentSessionView = new View(config.sessionViewType);
    console.debug("sessionView_template LOADED | TYPE: " + config.sessionViewType);

    initRxNodeQueueInterval();

    callback();
  });
}

function onFullScreenChange() {
  var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
  config.fullscreenMode = Boolean(fullscreenElement);
  console.log("FULLSCREEN: " + config.fullscreenMode);
}

function initialize(callback) {

  console.log("INITIALIZE ...");

  document.addEventListener("fullscreenchange", onFullScreenChange, false);
  document.addEventListener("webkitfullscreenchange", onFullScreenChange, false);
  document.addEventListener("mozfullscreenchange", onFullScreenChange, false);

  console.warn("DEFAULT_SESSION_VIEW *");

  config.sessionViewType = DEFAULT_SESSION_VIEW;

  loadViewType(config.sessionViewType, function() {

    currentSessionView.resize();

    console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

    viewerObj.timeStamp = Date.now();

    socket.emit("VIEWER_READY", viewerObj, function(){
      statsObj.viewerReadyTransmitted = true;
    }); 

    setTimeout(function() {
      console.log("END PAGE LOAD TIMEOUT");

      pageLoadedTimeIntervalFlag = false;

    }, PAGE_LOAD_TIMEOUT);
  });

  callback();
}
