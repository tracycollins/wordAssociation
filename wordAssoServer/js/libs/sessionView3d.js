/*ver 0.47*/
/*jslint node: true */
"use strict";

if(typeof(Worker) !== "undefined") {
  console.log("Worker!");
} else {
  console.log("NO Worker!");
}

var scene = new THREE.Scene(); 
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 500 ); 
var renderer = new THREE.WebGLRenderer(); 


var serverConnected = false ;
var serverHeartbeatTimeout = 30000 ;
var serverCheckInterval = 30000;

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

// var sessionHashMap = new HashMap();
var sessionHashMap = {};

var urlRoot = "http://localhost:9997/session?session=";

var nodeHashMap = {};
// var nodeHashMap = new StringMap();
// var nodeHashMap = new StringMap();
var deadNodeHashMap = new StringMap();

var nodesCreated = 0;

var dateNow = moment().valueOf();
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var currentSession = {};
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

var THREED_LAYOUT_WIDTH_RATIO = 1.0;
var THREED_LAYOUT_HEIGHT_RATIO = 1.0;

var FORCE_LAYOUT_WIDTH_RATIO = 1.0;
var FORCE_LAYOUT_HEIGHT_RATIO = 1.0;

var threeDLayoutWidth = width * FORCE_LAYOUT_WIDTH_RATIO;
var threeDLayoutHeight = height * FORCE_LAYOUT_HEIGHT_RATIO;

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


var randomIntFromInterval = function (min,max,format) {
  var random = Math.random();
  var randomInt = Math.floor((random*(max-min+1))+min);
  if (format) {
    return randomInt.toString(16);
  }
  else {
    return randomInt;
  }
};

var randomColorHex = function () {
  var randomRed = randomIntFromInterval(0,256,"hex");
  var randomGreen = randomIntFromInterval(0,256,"hex");
  var randomBlue = randomIntFromInterval(0,256,"hex");
  return '#' + randomRed + randomGreen + randomBlue;
};

var randomId = randomIntFromInterval(1000000000,9999999999);

var viewerObj = {
  viewerId: 'VIEWER_RANDOM_' + randomId,
  screenName: 'VIEWER RANDOM ' + randomId
};

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
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
});

socket.on("disconnect", function(){
  serverConnected = false;
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

// var sessionUpdateQueue = new Queue();
var sessionUpdateQueue = [];
// var rxSessionUpdateQueue = new Queue();
var rxSessionUpdateQueue = [];
var sessionUpdateQueueMaxInQ = 0;


function updateLinkstrength(value) {
  document.getElementById("linkstrengthSliderText").innerHTML = value.toFixed(3);
  linkStrength = value;
}

function updateFriction(value) {
  document.getElementById("frictionSliderText").innerHTML = value.toFixed(3);
  friction = value;
}

function updateGravity(value) {
  document.getElementById("gravitySliderText").innerHTML = value.toFixed(3);
  gravity = value;
}

function updateCharge(value) {
  document.getElementById("chargeSliderText").innerHTML = value;
  charge = value;
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
}


//  CLOCK
setInterval (function () {
}, 1000 );

var lastHeartbeatReceived = 0;

// CHECK FOR SERVER HEARTBEAT
setInterval(function () {
  if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.warn(chalkError("\n????? SERVER DOWN ????? | " + targetServer 
      + " | LAST HEARTBEAT: " + getTimeStamp(lastHeartbeatReceived)
      + " | " + moment().format(defaultDateTimeFormat)
      + " | AGO: " + msToTime(moment().valueOf()-lastHeartbeatReceived)
    ));
    socket.connect(targetServer, {reconnection: false});
  }
}, serverCheckInterval);



var heartBeatsReceived = 0;

socket.on("HEARTBEAT", function(heartbeat){

  heartBeatsReceived++;

  serverConnected = true;

});

// adminOverlay2 update
setInterval (function () {
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
initialPosition.z = 10;


//================================
// GET NODES FROM QUEUE
//================================

var radiusX, radiusY, radiusZ;

function computeInitialPosition(index) {
  var pos = {
    x: radiusX * Math.cos(index),
    y: radiusY * Math.sin(index),
    z: radiusZ * Math.cos(index)
  };

  return pos;
}

var nodeIndex = 0;
var tempMentions;

var numberSessionsUpdated = 0;

var randomColorQueue = [];
randomColorQueue.push(randomColorHex());

setInterval(function(){
  if (randomColorQueue.length < 20) {
    var c = randomColorHex();
    // console.log("ADD RANDOM COLOR HEX: " + c)
    randomColorQueue.push(c);
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

    if (sessionHashMap[sessionObject.sessionId]){

      var session = sessionHashMap[sessionObject.sessionId];

      session.userId = sessionObject.userId;
      session.source = sessionObject.source;
      session.source.lastSeen = dateNow;
      session.target = sessionObject.target;
      session.target.lastSeen = dateNow;

      // console.log("sessionObject.source: " + sessionObject.source.nodeId);

      sessionHashMap[sessionObject.sessionId] = session;

      callback(null, session.sessionId);
    }
    else {
      sessionsCreated += 1;

      var session = sessionObject;
      session.linkHashMap = {};

      session.initialPosition = computeInitialPosition(sessionsCreated);
      session.color = randomColorQueue.shift();

      console.log("NEW SESSION " 
        + sessionObject.userId 
        + " | " + sessionObject.sessionId 
        );

      session.source.lastSeen = dateNow;
      if (typeof session.target !== 'undefined') {
        session.target.lastSeen = dateNow;
      }

      sessionHashMap[session.sessionId] = session;

      callback(null, session.sessionId);
    }
  }
}

var theta = 0;
var radius = 100;

function render() { 
  requestAnimationFrame( render ); 
  theta += 0.1;

  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
  camera.lookAt( scene.position );

  camera.updateMatrixWorld();  renderer.render( scene, camera ); 
} 

function createNode (sessionId, callback) {

  if (sessionId === null){
    callback(null, null);
  }
  else {
    var session = sessionHashMap[sessionId];

    var dateNow = moment().valueOf();

    var newNodesFlag = false;

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

      nodeHashMap[nodeId] = wordObject;

      session.source = wordObject ;
      sessionHashMap[session.sessionId] = session;

      callback (null, sessionId);
    }
    else {

      wordObject = session.source ;

      nodesCreated += 1;
      newNodesFlag = true;


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
      wordObject.text = nodeId ;


      session.source = wordObject ;

      sessionHashMap[session.sessionId] = session;

      var nodeWidth = 1 + wordObject.mentions * 0.2;
      var nodeHeight = 1 + wordObject.mentions * 0.2;
      var nodeDepth = 1 + wordObject.mentions * 0.2;

      var geometry = new THREE.BoxGeometry( nodeWidth, nodeHeight, nodeDepth ); 
      var material = new THREE.MeshLambertMaterial( { color: session.color, transparent: true } ); 
      var cube = new THREE.Mesh( geometry, material );

      var initialVector3 = new THREE.Vector3();

      var tx = 0.5*session.initialPosition.x - (1 * session.initialPosition.x * Math.random());
      var ty = 0.5*session.initialPosition.y - (1 * session.initialPosition.y * Math.random());
      var tz = 0.5*session.initialPosition.z - (1 * session.initialPosition.z * Math.random());

      initialVector3.set(tx, ty, tz);

      console.log("cube position: ", initialVector3.x, initialVector3.y, initialVector3.z);
      cube.position.set(initialVector3.x, initialVector3.y, initialVector3.z);

      wordObject.cube = cube;

      var sprite = makeTextSprite(wordObject.nodeId, 100);
      sprite.position.set(initialVector3.x, initialVector3.y, initialVector3.z + nodeDepth);
      wordObject.sprite = sprite;

      nodeHashMap[nodeId] = wordObject;

      scene.add(wordObject.cube);
      scene.add(wordObject.sprite);

      // console.log("men\n" + jsonPrint(wordObject));

      callback (null, sessionId);
    }
  }
}

function pauseForNodes (sessionId, callback) {  

  var pauseInterval ;

  if (sessionId === null){
    // console.error("NULL SESSION ID ");
    callback(null, null);
  }
  else {
    var session = sessionHashMap[sessionId];

    var sourceWordId = session.source.nodeId;
    var targetWordId = session.target.nodeId;

    for (var i=0; i<100; i++){
      if (typeof nodeHashMap[sourceWordId] !== 'undefined') {
        console.warn("FOUND SOURCE IN HASH PAUSE: " + sourceWordId);
        return callback(null, sessionId);
        break;
      }
    }

    // pauseInterval = setInterval(function(){
    //   if (typeof nodeHashMap[sourceWordId] !== 'undefined') {
    //     console.warn("FOUND SOURCE IN HASH PAUSE: " + sourceWordId);
    //     clearInterval(pauseInterval);
    //     return callback(null, sessionId);
    //   }
    // }, 100);
  }
}

function createLink (sessionId, callback) {

  if (sessionId === null){
    callback(null, null);
  }
  else {
    var session = sessionHashMap[sessionId];

    var newLinkFlag = false ;
    var newLink;

    var sourceWordId = session.source.nodeId;
    var targetWordId = session.target.nodeId;

    var sourceWord = nodeHashMap[sourceWordId];
    var targetWord;

    if (typeof session.target === 'undefined'){
      console.error("??? SESSION TARGET UNDEFINED"
        + " | " + sessionId
        // + "\nSESSION OBJECT TARGET\n" 
      );
      return(callback (null, sessionId));
    }
    else if (typeof session.target.nodeId !== 'string') {
      console.warn("??? TARGET NODE ID NOT A STRING (NEW SESSION?)"
        + " | " + sessionId
        + " | SKIPPING CREATE LINKS"
        // + " \nSESSION OBJECT TARGET\n" 
        // + jsonPrint(session.target)
      );
      return(callback (null, sessionId));
    }
    else if (nodeHashMap[targetWordId]){
      targetWord = nodeHashMap[targetWordId];
    }

    if (typeof nodeHashMap[sourceWordId] === 'undefined') {
      console.error("sourceWordId " + sourceWordId + " NOT IN nodeHashMap"
        + " | " + sessionId
       + " | SKIPPING CREATE LINKS"
       );
      return(callback (null, sessionId));
    }
    else if (!nodeHashMap[targetWordId]){
      console.error("targetWordId " + targetWordId + " NOT IN nodeHashMap"
        + " | " + sessionId
       + " | SKIPPING CREATE LINKS"
       );
      return(callback (null, sessionId));
    }
    
    if (session.linkHashMap[sourceWordId]) {
      if (session.linkHashMap[sourceWordId][targetWordId]) {
        console.warn("LINK EXISTS" 
          + " | " + sourceWordId
          + " -> " + targetWordId
          + " EXISTS ... SKIPPING createLinks"
          );
        return(callback (null, sessionId));
      }
    }
    
    if (session.linkHashMap[targetWordId]) {
      if (session.linkHashMap[targetWordId][sourceWordId]) {
        console.warn("LINK EXISTS" 
          + " | " + sourceWordId
          + " -> " + targetWordId
          + " EXISTS ... SKIPPING createLinks"
          );
        return(callback (null, sessionId));
      }
    }

    newLinkFlag = true ;

    // console.log("LINK | " + sourceWord.nodeId + " > " + targetWordId);

    var newLink = {
      sessionId: session.sessionId,
      age: 0,
      source: sourceWord,
      target: targetWord
    };

    newLink = newLink.source.nodeId + " > " + newLink.target.nodeId;

    sourceWord.links[targetWordId] = 1;
    targetWord.links[sourceWordId] = 1;

    nodeHashMap[sourceWordId] = sourceWord ;
    nodeHashMap[targetWordId] = targetWord ;

    if (!session.linkHashMap[sourceWordId]){
      session.linkHashMap[sourceWordId] = {};
    }
    if (!session.linkHashMap[targetWordId]){
      session.linkHashMap[targetWordId] = {};
    }

    session.linkHashMap[sourceWordId][targetWordId] = dateNow ;
    session.linkHashMap[targetWordId][sourceWordId] = dateNow ;

    sessionHashMap[session.sessionId] = session;

    callback (null, sessionId);
  } 
}

function calcNodeAges (callback){

  // console.warn("calcNodeAges");

  var deadNodesFlag = false;

  var currentNodeObject = {};
  var currentLinkObject = {};

  var dateNow = moment().valueOf();

  var nodeHashMapKeys = Object.keys(nodeHashMap);

  nodeHashMapKeys.forEach(function(nodeId){

    var currentNodeObject = nodeHashMap[nodeId];

    age = currentNodeObject.age + (ageRate * (dateNow - currentNodeObject.ageUpdated));
 
    if (age >= nodeMaxAge) {
      deadNodesFlag = true;
      deadNodeHashMap.set(nodeId,1);
      scene.remove( currentNodeObject.cube );
      scene.remove( currentNodeObject.sprite );
      delete nodeHashMap[nodeId];
      console.log("DEAD " + nodeId);
    }
    else {
      currentNodeObject.ageUpdated = dateNow;
      currentNodeObject.age = age;
      nodeHashMap[nodeId] = currentNodeObject;
      currentNodeObject.cube.material.opacity = 1.0-(age/nodeMaxAge);
      currentNodeObject.sprite.material.opacity = 1.0-(age/nodeMaxAge);
    }

  });

  return(callback(null, deadNodesFlag));
}

function ageNodes (sessionId, callback){

return(callback(null, sessionId));
}

function createSessionNodeLink() {

  createSessionNodeLinkReady = false;

  async.waterfall(
    [ 
      createSession,
      createNode,
      createLink,
      ageNodes
    ], 
    
    function(err, result){
      if (err) { 
        console.error("*** ERROR: createSessionNodeLink *** \nERROR: " + err); 
      }

      createSessionNodeLinkReady = true;
    }
  );
}

var sessionUpdateInterval = setInterval(function(){
  dateNow = moment().valueOf();
  calcNodeAges(function(deadNodes){});
  if (!mouseMovingFlag && createSessionNodeLinkReady) createSessionNodeLink();
  // render();
}, 100);

var createSessionNodeLinkReady = true;

window.onload = function () {

  radiusX = 0.1*width;
  radiusY = 0.1*height;
  radiusZ = 0.1*width;

  renderer.setSize( window.innerWidth, window.innerHeight ); 
  document.body.appendChild( renderer.domElement );   

  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );

  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
  hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
  hemiLight.position.set( 0, 500, 0 );
  scene.add( hemiLight );

  render();

  createSessionNodeLinkReady = true;

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

  console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
  socket.emit("VIEWER_READY", viewerObj);

  setTimeout(function(){
    pageLoadedTimeIntervalFlag = false;
  }, 5000);

  sessionUpdateInterval;
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

function makeTextSprite (message, fontsize) {
  var ctx, texture, sprite, spriteMaterial, 
      canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  ctx.font = fontsize + "px Arial";

  // setting canvas width/height before ctx draw, else canvas is empty
  canvas.width = ctx.measureText(message).width;
  canvas.height = fontsize * 2; // fontsize * 1.5

  // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
  ctx.font = fontsize + "px Arial";        
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillText(message, 0, fontsize);

  texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter; // NearestFilter;
  texture.needsUpdate = true;

  spriteMaterial = new THREE.SpriteMaterial({map : texture});
  sprite = new THREE.Sprite(spriteMaterial);
  return sprite;   
}