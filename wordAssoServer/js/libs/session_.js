/*ver 0.47*/
/*jslint node: true */
"use strict";

var serverConnected = false ;
var serverHeartbeatTimeout = 30000 ;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 15047;
var pageLoadedTimeIntervalFlag = true;

var debug = true;
var MAX_RX_QUEUE = 250;
var QUEUE_MAX = 200;


var createNodeQueue = [];
var createLinkQueue = [];

var sessionsCreated = 0;

var MAX_WORDCHAIN_LENGTH = 100;

var DEFAULT_MAX_AGE = 10000.0;
var DEFAULT_AGE_RATE = 1.0;


var urlRoot = "http://localhost:9997/session?session=";

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

var config = DEFAULT_CONFIG;
var previousConfig = [];


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
  type: "VIEWER",
};

// var mouseMoveTimeout = setTimeout(function(){
//   d3.select("body").style("cursor", "none");
//   if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
//     displayInfoOverlay(1);
//   }
//   displayControlOverlay(true);
// }, mouseMoveTimeoutInterval);



// function resetMouseMoveTimer() {
//   clearTimeout(mouseMoveTimeout);

//   displayInfoOverlay(1);
//   displayControlOverlay(true);

//   mouseMoveTimeout = setTimeout(function(){
//     d3.select("body").style("cursor", "none");

//     if (!showStatsFlag && !pageLoadedTimeIntervalFlag){
//       displayInfoOverlay(1e-6);
//       displayControlOverlay(false);
//     }

//     mouseMovingFlag = false;
//   }, mouseMoveTimeoutInterval);
// }

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

  // updateStatsOverlay4(socket.id + " | " + viewerSessionKey);

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
  // updateStatsOverlay4(socket.id);

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


// d3.select("body").style("cursor", "default");

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


var sessionUpdateQueue = [];
var rxSessionUpdateQueue = [];
var sessionUpdateQueueMaxInQ = 0;

var globalLinkIndex = 0;

function generateLinkId(callback){
  globalLinkIndex++ ;
  return "LNK" + globalLinkIndex ;
}


//  KEEPALIVE
setInterval (function () {
  if (serverConnected){
    socket.emit("SESSION_KEEPALIVE", viewerObj);
    console.log("SESSION_KEEPALIVE | " + moment());
  }
}, serverKeepaliveInteval );

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

  // force.stop();

  var deletedSession = sessionHashMap.get(sessionId);

  console.warn("XXX DELETE SESSION"
    // + " [" + sessions.length + "]"
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
});



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

  // resetMouseMoveTimer();
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


//================================
// GET NODES FROM QUEUE
//================================


var nodeIndex = 0;
var tempMentions;

var numberSessionsUpdated = 0;

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
        // sessionHashMap.remove(sessionId);
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
      currentSession.source = sessUpdate.source;
      currentSession.target = sessUpdate.target;
      currentSession.latestNodeId = sessUpdate.source.nodeId;

      currentSession.node = {};
      currentSession.age = 0;
      currentSession.linkHashMap = new HashMap();
      currentSession.Position = initialPositionArray.shift();
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
          // createSessionQueue.push(cSession);
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



// NEED TO CREATE SESSION IF ONE DOES NOT EXIST




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

  // NOW TO BE HANDLED BY sessionView module


  // var nodeId;
  // var newNode;
  // while (newNodes.length > 0){
  //   if (!forceStopped) {
  //     force.stop(); 
  //     forceStopped = true ;
  //   }
  //   nodeId = newNodes.shift();
  //   newNode = nodeHashMap.get(nodeId);
  //   nodes.push(newNode);
  // }
  return(callback (null, sessionId));
}

function updateLinksArray (sessionId, callback) {

  // NOW TO BE HANDLED BY sessionView module


  // while (newLinks.length > 0){
  //   var linkId = newLinks.shift();
  //   var newLink = linkHashMap.get(linkId);
  //   if (typeof newLink !== 'undefined'){
  //     if (!forceStopped) {
  //       force.stop(); 
  //       forceStopped = true ;
  //     }
  //     links.push(newLink);
  //   }
  //   else {
  //     console.warn("updateLinksArray: NEW LINK NOT IN HM? SKIPPING | linkId: " + linkId);
  //   }
  // }
  return(callback (null, sessionId));
}

// function calcNodeAges (callback){

//   if (nodes.length === 0) {
//     ageRate = DEFAULT_AGE_RATE;
//   }
//   else if (nodes.length > 100) {
//     ageRate = adjustedAgeRateScale(nodes.length-100);
//   }
//   else {
//     ageRate = DEFAULT_AGE_RATE;
//   }

//   var dateNow = moment().valueOf();

//   var nodeIds = nodeHashMap.keys();
//   // var nodeIds = Object.keys(nodeHashMap);

//   async.each(nodeIds, function(nodeId, cb){

//     var node = nodeHashMap.get(nodeId);

//     age = node.age + (ageRate * (dateNow - node.ageUpdated));

//     if (!node.isSessionNode && (age >= nodeMaxAge)) {
//       node.isDead = true;
//       addToHashMap(nodeHashMap, nodeId, node, function(node){
//         cb();
//       });
//     }
//     else {
//       node.ageUpdated = dateNow;
//       node.age = age;
//       addToHashMap(nodeHashMap, nodeId, node, function(node){
//         cb();
//       });
//     }

//   },
//     function(err){
//       return(callback());
//     }
//   )
// }

function ageSessions (sessionId, callback){

  var dateNow = moment().valueOf();

  var ageSession;

  var ageSessionsLength = sessions.length-1;
  var ageSessionsIndex =  sessions.length-1;

  for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex>=0; ageSessionsIndex -= 1) {  

    ageSession = sessions[ageSessionsIndex];

    if (!sessionHashMap.has(ageSession.sessionId)){
      // if (!forceStopped){
      //   forceStopped = true ;
      //   force.stop();
      // }
      sessions.splice(ageSessionsIndex, 1); 
    }
  }

  if (ageSessionsIndex < 0) {
    return(callback(null, sessionId));
  }
}

// function ageNodes (sessionId, callback){

//   var dateNow = moment().valueOf();

//   var ageNodesLength = nodes.length-1;
//   var ageNodesIndex =  nodes.length-1;

//   var currentNodeObject;
//   var currentNodeId;

//   for (ageNodesIndex = ageNodesLength; ageNodesIndex>=0; ageNodesIndex -= 1) {  

//     currentNodeObject = nodes[ageNodesIndex];
//     currentNodeId = currentNodeObject.nodeId;

//     if (currentNodeObject.isDead){
//       if (!forceStopped){
//         forceStopped = true ;
//         force.stop();
//       }
//       removeFromHashMap(nodeHashMap, currentNodeId, function(){
//         nodes.splice(ageNodesIndex, 1);

//         // jp("currentNodeObject.links", currentNodeObject.links);

//       });
//     }
//     else {
//       nodes[ageNodesIndex].age = currentNodeObject.age;
//       nodes[ageNodesIndex].ageUpdated = currentNodeObject.ageUpdated;
//       addToHashMap(nodeHashMap, currentNodeId, currentNodeObject, function(node){
//       });
//     }
//   }

//   if (ageNodesIndex < 0) {
//     return(callback(null, sessionId));
//   }
// }

// function ageLinks (sessionId, callback){

//   var ageLinksIndex = links.length-1;

//   var currentSession;
//   var currentLinkObject = {};
//   var dateNow = moment().valueOf();

//   for (ageLinksIndex = links.length-1; ageLinksIndex >= 0; ageLinksIndex -= 1) {

//     currentLinkObject = links[ageLinksIndex];

//     // console.log("currentLinkObject\n" + jsonPrint(currentLinkObject));

//     if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.isDead){
//       if (!forceStopped){
//         forceStopped = true ;
//         force.stop();
//       }
//       removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
//         links.splice(ageLinksIndex, 1); 
//       });
//     }
//     else if ((typeof currentLinkObject !== 'undefined') 
//       && (currentLinkObject.source.isDead || currentLinkObject.target.isDead)){
//       if (!forceStopped){
//         forceStopped = true ;
//         force.stop();
//       }
//       removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
//         links.splice(ageLinksIndex, 1); 
//       });
//     }
//     else if ((typeof currentLinkObject !== 'undefined') && !linkHashMap.has(currentLinkObject.linkId)){
//       if (!forceStopped){
//         forceStopped = true ;
//         force.stop();
//       }
//       removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
//         links.splice(ageLinksIndex, 1); 
//       });
//     }
//     else if (!nodeHashMap.has(currentLinkObject.source.nodeId) || !nodeHashMap.has(currentLinkObject.target.nodeId)){
//       if (!forceStopped){
//         forceStopped = true ;
//         force.stop();
//       }
//       removeFromHashMap(linkHashMap, currentLinkObject.linkId, function(){
//         links.splice(ageLinksIndex, 1); 
//       });
//     }
//     else {
//       if (currentLinkObject.source.age < currentLinkObject.target.age) {
//         currentLinkObject.age = currentLinkObject.source.age;
//       }
//       else {
//         currentLinkObject.age = currentLinkObject.target.age;
//       }
//       addToHashMap(linkHashMap, currentLinkObject.linkId, currentLinkObject, function(link){
//       });
//     }
//   }

//   if (ageLinksIndex < 0) {
//     return(callback(null, sessionId));
//   }
// }



function updateSessions() {

  updateSessionsReady = false;

  async.waterfall(
    [ 
      createSession,
      createNode,
      createLink,
      updateNodesArray,
      updateLinksArray,
      ageSessions,
    ], 
    
    function(err, result){
      if (err) { 
        console.error("*** ERROR: createSessionNodeLink *** \nERROR: " + err); 
      }
      updateSessionsReady = true;
    }
  );
}

window.onload = function () {
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
};
