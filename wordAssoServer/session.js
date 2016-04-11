/*ver 0.47*/
/*jslint node: true */
"use strict";

requirejs(["http://d3js.org/d3.v3.min.js"], function(d3) {
  console.log("d3 LOADED");
  initialize();
  // requirejs(["js/libs/sessionViewHistogram"], function(histogramView) {
  //   console.log("sessionViewHistogram LOADED");
  //     displayControlOverlay(false);
  // });
  // requirejs(["js/libs/sessionViewForce"], function(forceView) {
  //   console.log("sessionViewForce LOADED");
  //   initialize();
  //     // displayControlOverlay(false);
  // });
});

var config = {};
config.maxWords = 100;
config.testMode = false;

var ignoreWordsArray = [
  "a",
  "about",
  "across",
  "all",
  "an",
  "also",
  "too",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "do",
  "dont",
  "for",
  "from",
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
  "the",
  "there",
  "these",
  "thats",
  "this",
  "those",
  "though",
  "to",
  "upon",
  "was",
  "wasnt",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "wont",
  "would",
];

var DEFAULT_SESSION_VIEW = 'force';
config.sessionViewType = DEFAULT_SESSION_VIEW; // options: force, histogram ??

var currentSessionView;

var debug = true;
var MAX_RX_QUEUE = 250;
var QUEUE_MAX = 200;
var MAX_WORDCHAIN_LENGTH = 100;
var DEFAULT_MAX_AGE = 30000;
var DEFAULT_AGE_RATE = 1.0;

var dateNow = moment().valueOf();
var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var removeDeadNodes = true;
function toggleRemoveDeadNode(){
  removeDeadNodes = !removeDeadNodes;
  console.warn("TOGGLE REMOVE DEAD NODES: " + removeDeadNodes);
}


function toggleTestMode() {
  config.testMode = !config.testMode;
  testModeEnabled = config.testMode;
  console.warn("TEST MODE: " + testModeEnabled);

  if (testModeEnabled) {
    setTimeout(initTestAddNodeInterval(1000), 1047);
    setTimeout(initTestAddLinkInterval(1000), 2047);
    setTimeout(initTestDeleteNodeInterval(1000), 5047);
  }
  else {
    clearTestAddNodeInterval();
    clearTestAddLinkInterval();
    clearTestDeleteNodeInterval();
  }
}

var serverConnected = false;
var serverHeartbeatTimeout = 30000;
var serverCheckInterval = 30000;
var serverKeepaliveInteval = 60000;
var pageLoadedTimeIntervalFlag = true;

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
  }
  else {
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
var radiusX = 0.4 * window.innerWidth * 1;
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
var endColor = "hsl(" + randomNumber360 + ",0%,0%)";
randomColorQueue.push({
  "startColor": startColor,
  "endColor": endColor
});

setInterval(function() { // randomColorQueue

  randomNumber360 += randomIntFromInterval(60, 120);
  startColor = "hsl(" + randomNumber360 + ",100%,50%)";
  endColor = "hsl(" + randomNumber360 + ",0%,0%)";

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
    }
    else {
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
  }
  else {
    return 'hidden';
  }
}

function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + 'visibilitychange';
  }
  else {
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


  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    console.log("TX GET_SESSION | " + currentSession.sessionId);
    socket.emit("GET_SESSION", currentSession.sessionId);
  }
});

socket.on("reconnect", function() {

  serverConnected = true;

  socket.emit("VIEWER_READY", viewerObj);
  if (sessionMode) {
    console.log("SESSION MODE" + " | SID: " + sessionId + " | NSP: " + namespace);
    var tempSessionId = "/" + namespace + "#" + sessionId;
    currentSession.sessionId = tempSessionId;
    socket.emit("GET_SESSION", currentSession.sessionId);
  }
});

socket.on("connect", function() {
  serverConnected = true;
  // displayInfoOverlay(1.0, defaultTextFill);
  console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);
  // updateStatsOverlay4(socket.id);

});

socket.on("disconnect", function() {
  serverConnected = false;
  // displayInfoOverlay(1.0, 'red');
  console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  deleteAllSessions(function() {
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
  }
  else {
    windowVisible = false;
  }
});

function getUrlVariables(callbackMain) {

  var urlSessionId;
  var urlNamespace;
  var sessionType;
  var sessionViewType;

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
            sessionViewType = keyValuePair[1];
            console.log("SESSION VIEW TYPE | sessionViewType: " + sessionViewType);
            return (callback2(null, {
              sessionViewType: sessionViewType
            }));
          }
        }
        else {
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
  if ((lastHeartbeatReceived > 0) && (lastHeartbeatReceived + serverHeartbeatTimeout) < moment()) {
    console.error(chalkError("\n????? SERVER DOWN ????? | " + targetServer + " | LAST HEARTBEAT: " + getTimeStamp(lastHeartbeatReceived) + " | " + moment().format(defaultDateTimeFormat) + " | AGO: " + msToTime(moment().valueOf() - lastHeartbeatReceived)));
    socket.connect(targetServer, {
      reconnection: false
    });
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
      nodeHashMap.remove(deletedSession.userId);

      // sessionDeleteHashMap.set(sessionId, 1);
      currentSessionView.deleteSessionLinks(sessionId);
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
    previousConfig.nodeMaxAge = config.nodeMaxAge;
  }

  // resetMouseMoveTimer();
});

socket.on("SESSION_ABORT", function(rxSessionObject) {
  if (rxSessionObject.sessionId == socket.id) {
    console.error("SESSION_ABORT" + " | " + rxSessionObject.sessionId + " | " + rxSessionObject.sessionEvent);
    serverConnected = false;
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
    // sessionDeleteHashMap.set(rxObj.sessionId, 1);
    session.sessionEvent = "SESSION_DELETE";
    rxSessionDeleteQueue.push(session);
  }
});

socket.on("SESSION_UPDATE", function(rxSessionObject) {

  var rxObj = rxSessionObject;

  if (!windowVisible) {
    rxSessionUpdateQueue = [];
    if (debug) {
      console.log("... SKIP SESSION_UPDATE ... WINDOW NOT VISIBLE");
    }
  }
  else if (sessionDeleteHashMap.has(rxObj.sessionId)) {
    console.log("... SKIP SESSION_UPDATE ... DELETED SESSION: " + rxObj.sessionId);
  }
  else if (sessionMode && (rxObj.sessionId !== currentSession.sessionId)) {
    if (debug) {
      console.log("SKIP SESSION_UPDATE: " + rxObj.sessionId + " | CURRENT: " + currentSession.sessionId);
    }
  }
  else if (rxSessionUpdateQueue.length < MAX_RX_QUEUE) {

    rxSessionUpdateQueue.push(rxSessionObject);

    console.log(
      rxObj.userId + " | " + rxObj.wordChainIndex + " | " + rxObj.source.nodeId + " > " + rxObj.target.nodeId
    );

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

function processSessionQueues(callback) {
  if (rxSessionDeleteQueue.length > 0) {
    var deleteSessUpdate = rxSessionDeleteQueue.shift();
    console.log("DELETE SESSION: " + deleteSessUpdate.sessionId);
    deleteSession(deleteSessUpdate.sessionId, function(sessionId) {
      // sessionHashMap.remove(sessionId);
      return (callback(null, null));
    });
  }
  else if (rxSessionUpdateQueue.length == 0) {
    // console.log("sessionObject\n");
    return (callback(null, null));
  }
  else {
    var session = rxSessionUpdateQueue.shift();
    sessionCreateQueue.push(session);
    return (callback(null, session.sessionId));
  }
}

function processNodeDeleteQueue(callback) {
  if (nodeDeleteQueue.length == 0) {
    return (callback());
  }
  else {

    var deletedNodeId = nodeDeleteQueue.shift();

    // console.error("processNodeDeleteQueue: DELETE NODE: " + deletedNodeId);

    removeFromHashMap(nodeHashMap, deletedNodeId, function() {
      // console.error("processNodeDeleteQueue: DELETED: " + deletedNodeId);
      return (callback());
    });

  }
}

function createSession(session, callback) {

  var currentSession = {};
  var currentSessionNode = {};
  // console.log("rxSessionUpdateQueue: " + rxSessionUpdateQueue.length);

  if (sessionCreateQueue.length == 0) {
    // console.log("sessionObject\n");
    return (callback(null, null));
  }
  else {


    var sessUpdate = sessionCreateQueue.shift();

    if (sessionDeleteHashMap.has(sessUpdate.sessionId)) {
      return (callback(null, null));
    }
    else if (sessionHashMap.has(sessUpdate.sessionId)) {
      currentSession = sessionHashMap.get(sessUpdate.sessionId);
      if (nodeHashMap.has(currentSession.node.nodeId)) {
        currentSession.node = nodeHashMap.get(currentSession.node.nodeId);
      }

      var prevLatestNodeId = currentSession.latestNodeId;
      var prevSessionLinkId = currentSession.userId + "_" + prevLatestNodeId;

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

      var sessionLinkId = sessUpdate.userId + "_" + sessUpdate.source.nodeId;
      currentSession.node.links = {};
      currentSession.node.links[sessionLinkId] = 1;

      addToHashMap(sessionHashMap, currentSession.sessionId, currentSession, function(cSession) {
        nodeCreateQueue.push(cSession);
        removeFromHashMap(linkHashMap, sessionId, function() {
          return (callback(null, cSession.sessionId));
        });
      });
    }
    else {

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

      sessionNode.isSessionNode = true;
      sessionNode.nodeId = sessUpdate.userId;
      sessionNode.userId = sessUpdate.userId;
      sessionNode.sessionId = sessUpdate.sessionId;
      sessionNode.age = 0;
      sessionNode.ageUpdated = dateNow;
      sessionNode.lastSeen = dateNow;
      sessionNode.wordChainIndex = sessUpdate.wordChainIndex;
      sessionNode.mentions = sessUpdate.wordChainIndex;
      sessionNode.text = sessUpdate.userId;
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

      addToHashMap(nodeHashMap, sessionNode.nodeId, sessionNode, function(sesNode) {

        addToHashMap(sessionHashMap, currentSession.sessionId, currentSession, function(cSession) {
          console.log("NEW SESSION " + cSession.userId + " | " + cSession.sessionId + " | " + cSession.node.nodeId
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

function createNode(sessionId, callback) {

  if (nodeCreateQueue.length > 0) {

    var dateNow = moment().valueOf();

    var session = nodeCreateQueue.shift();

    if (nodeHashMap.has(sessionId)) {
      var sessionNode = nodeHashMap.get(sessionId);
      sessionNode.age = 0;
      sessionNode.wordChainIndex = session.wordChainIndex;

      addToHashMap(nodeHashMap, sessionId, session.node, function(sNode) {
        // console.log("EXIST SESSION NODE" 
        //   + " | " + sNode.nodeId 
        //   // + "\n" + jsonPrint(sNode) 
        // );
      });
    }
    else {
      addToHashMap(nodeHashMap, sessionId, session.node, function(sNode) {
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
          if (ignoreWordHashMap.has(sourceNodeId)){
            console.warn("sourceNodeId IGNORED: " + sourceNodeId);
            cb(null, {
              node: sourceNodeId,
              isIgnored: true,
              isNew: false
            });
          }
          else if (nodeHashMap.has(sourceNodeId)) {
            sourceNode.newFlag = false;
            sourceNode = nodeHashMap.get(sourceNodeId);
            sourceNode.userId = session.userId;
            sourceNode.sessionId = sessionId;
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
          }
          else {
            sourceNode = session.source;
            sourceNode.newFlag = true;
            sourceNode.x = session.initialPosition.x + (100 * Math.random());
            sourceNode.y = session.initialPosition.y + 100;
            sourceNode.userId = session.userId;
            sourceNode.sessionId = sessionId;
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
          }
          else if (ignoreWordHashMap.has(targetNodeId)){
            console.warn("targetNodeId IGNORED: " + targetNodeId);
            cb(null, {
              node: targetNodeId,
              isIgnored: true,
              isNew: false
            });
          }
          else if (nodeHashMap.has(targetNodeId)) {
            targetNode = nodeHashMap.get(targetNodeId);
            targetNode.newFlag = false;
            targetNode.userId = session.userId;
            targetNode.sessionId = sessionId;
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
          }
          else {
            targetNode = session.target;
            targetNode.newFlag = true;
            targetNode.x = session.initialPosition.x - (100 - 100 * Math.random());
            targetNode.y = session.initialPosition.y - (100 - 100 * Math.random());
            targetNode.userId = session.userId;
            targetNode.sessionId = sessionId;
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

        if (!results.source.isIgnored){
          session.source = results.source.node;
          session.source.isNew = results.source.isNew;
          if (results.source.isNew) {
            currentSessionView.addNode(results.source.node);
          }
        }

        if (results.target  && !results.target.isIgnored) {
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

function createLink(sessionId, callback) {

  if (linkCreateQueue.length > 0) {
    var session = linkCreateQueue.shift();

    var sessionLinkId = session.userId + "_" + session.latestNodeId;

    var newSessionLink = {
      linkId: sessionLinkId,
      sessionId: sessionId,
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
    sourceWord.links[sessionId] = 1;

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
      }
      else {
        console.warn("SESSION TARGET UNDEFINED" + " | " + sessionId)
        console.warn("??? TARGET " + targetWordId + " NOT IN HASH MAP ... SKIPPING NEW LINK: SOURCE: " + sourceWordId);
      }
    }
    else {
      console.warn("SESSION TARGET UNDEFINED" + " | " + sessionId)
    }


    addToHashMap(sessionHashMap, session.sessionId, session, function(sess) {});

  }
  return (callback(null, sessionId));
}

function ageSessions(sessionId, callback) {

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
      currentSessionView.sessions.splice(ageSessionsIndex, 1);
    }
  }

  if (ageSessionsIndex < 0) {
    return (callback(null, sessionId));
  }
}

function rankSessions(sessionId, callback) {
  var sortedSessionIds = getSortedKeys(sessionHashMap, "wordChainIndex");
  // console.error("RANKING " + sortedSessionIds.length + " sessions");
  var session;
  async.forEachOf(sortedSessionIds, function(sessionId, rank, cb) {
    session = sessionHashMap.get(sessionId);
    session.rank = rank;
    sessionHashMap.set(sessionId, session);
    // console.error("RANK " + rank + " | " + session.wordChainIndex + " | " + sessionId);
    cb();
  }, function(err) {
    // console.warn("RANKING COMPLETE | " + sortedSessionIds.length + " sessions");
    return (callback(null, sessionId));
  });
}

var updateSessionsReady = true;

function updateSessions() {

  updateSessionsReady = false;

  async.waterfall(
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
      resize();
    }
    else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
      resize();
    }
    else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
      resize();
    }
    else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      resize();
    }
  }
  else {

    if (document.exitFullscreen) {
      document.exitFullscreen();
      resize();
    }
    else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      resize();
    }
    else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      resize();
    }
    else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      resize();
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

function loadViewType(svt, callback) {

  console.warn("LOADING SESSION VIEW TYPE: " + svt);

  switch (svt) {
    case 'histogram':
      config.sessionViewType = 'histogram';
      requirejs(["js/libs/sessionViewHistogram"], function() {

        console.log("sessionViewHistogram LOADED");

        currentSessionView = new ViewHistogram();

        // currentSessionView.initD3timer();
        // currentSessionView.resize();

        // initUpdateSessionsInterval(50);

        // console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
        // socket.emit("VIEWER_READY", viewerObj);

        // setTimeout(function() {
        //   pageLoadedTimeIntervalFlag = false;
        //   currentSessionView.displayInfoOverlay(1e-6);
        //   currentSessionView.displayControlOverlay(false);
        // }, 5000);

        callback();
      });
      break;
    default:
      config.sessionViewType = 'force';
      requirejs(["js/libs/sessionViewForce"], function() {

        console.log("sessionViewForce LOADED");

        currentSessionView = new ViewForce();

        // currentSessionView.initD3timer();
        // currentSessionView.resize();

        // initUpdateSessionsInterval(50);

        // console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
        // socket.emit("VIEWER_READY", viewerObj);

        // setTimeout(function() {
        //   pageLoadedTimeIntervalFlag = false;
        //   currentSessionView.displayInfoOverlay(1e-6);
        //   currentSessionView.displayControlOverlay(false);
        // }, 5000);

        callback();
      });
      break;
  }
}

function initIgnoreWordsHashMap(callback){
  async.each(ignoreWordsArray, function(ignoreWord, cb){
    addToHashMap(ignoreWordHashMap, ignoreWord, true, function(){
      cb();
    });
  }, function (err){
    callback();
  });
}

function initialize() {

  console.log("initialize");


  getUrlVariables(function(err, urlVariablesObj) {

    console.warn("URL VARS\n" + jsonPrint(urlVariablesObj));

    var sessionId;
    var namespace;
    var sessionViewType;

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

          sessionViewType = urlVariablesObj.sessionViewType;

          console.log("ON LOAD getUrlVariables: sessionViewType:" + sessionViewType);

          if (sessionViewType == 'histogram') {
            initIgnoreWordsHashMap(function(){
              console.warn("INIT IGNORE WORD HASH MAP: " + ignoreWordsArray.length + " WORDS");
            });
          }

          loadViewType(sessionViewType, function() {

            currentSessionView.initD3timer();
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              pageLoadedTimeIntervalFlag = false;
              currentSessionView.displayInfoOverlay(1e-6);
              currentSessionView.displayControlOverlay(false);
            }, 5000);
          });
        }
        else {
          loadViewType(DEFAULT_SESSION_VIEW, function() {

            currentSessionView.initD3timer();
            currentSessionView.resize();

            initUpdateSessionsInterval(50);

            console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
            socket.emit("VIEWER_READY", viewerObj);

            setTimeout(function() {
              pageLoadedTimeIntervalFlag = false;
              currentSessionView.displayInfoOverlay(1e-6);
              currentSessionView.displayControlOverlay(false);
            }, 5000);
          });
        }
      }
      else {
        loadViewType(DEFAULT_SESSION_VIEW, function() {

          currentSessionView.initD3timer();
          currentSessionView.resize();

          initUpdateSessionsInterval(50);

          console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));
          socket.emit("VIEWER_READY", viewerObj);

          setTimeout(function() {
            pageLoadedTimeIntervalFlag = false;
            currentSessionView.displayInfoOverlay(1e-6);
            currentSessionView.displayControlOverlay(false);
          }, 5000);
        });

      }



    }
    else {
      console.error("GET URL VARIABLES ERROR\n" + jsonPrint(err));
    }
  });
};