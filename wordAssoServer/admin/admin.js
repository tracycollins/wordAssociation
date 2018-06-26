
/*ver 0.47*/
/*jslint node: true */

/* jshint undef: true, unused: true */
/* globals document, io, requirejs, moment, HashMap, async, ProgressBar */

"use strict";

const DEFAULT_TABLE_TEXT_COLOR = "#CCCCCC";
const DEFAULT_TABLE_BG_COLOR = "#222222";
const DEFAULT_TABLE_FONT_SIZE = "1.5em";

var socket = io('/admin');

var memoryAvailable = 0;
var memoryUsed = 0;
// var memoryUsage = {};

var serverConnected = false;
var sentAdminReady = false;
var initializeComplete = false;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
// var defaultTimePeriodFormat = "HH:mm:ss";

var startColor = '#008000';
var midColor = '#F9CD2B';
var endColor = '#CC0000';

var WARN_LIMIT_PERCENT = 80;
var ALERT_LIMIT_PERCENT = 95;

var ONE_MB = 1024 * 1024;
var ONE_GB = ONE_MB * 1024;
// var TIMELINE_WIDTH = 600;
// var TIMELINE_HEIGHT = 250;
// var MAX_TIMELINE = 600;

// var tpmData =[];
// var wpmData =[];
// var trpmData =[];
// var tLimitData = [];

requirejs(
  ["https://d3js.org/d3.v5.min.js"], 
  function() {
    console.debug("d3 LOADED");
    initialize(function(){
      initializeComplete = true;
    });
  },
  function(error) {
    console.log('REQUIREJS ERROR handler', error);
    var failedId = error.requireModules && error.requireModules[0];
    console.log(failedId);
    console.log(error.message);
  }
);

// var heartbeatElement;

var serverTypeHashMap = new HashMap();
var serverSocketHashMap = new HashMap();

var viewerTypeHashMap = new HashMap();
var viewerSocketHashMap = new HashMap();
var viewerIpHashMap = new HashMap();
var viewerSessionHashMap = new HashMap();

var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();

var adminIpHashMapKeys = [];
var adminSocketIdHashMapKeys = [];

function isObject(obj) {
  return obj === Object(obj);
}

function getTimeNow() {
  var d = new Date();
  return d.getTime();
}

// function getMillis() {
//   var d = new Date();
//   return d.getMilliseconds();
// }

var USER_ID = 'ADMIN_' + moment().valueOf();
var SCREEN_NAME = USER_ID;

var mainAdminObj = {
  adminId: USER_ID,
  nodeId: USER_ID,
  userId: USER_ID,
  screenName: SCREEN_NAME,
  type: "admin",
  mode: "control",
  tags: {}
};

mainAdminObj.tags.mode = "control";
mainAdminObj.tags.type = "admin";
mainAdminObj.tags.entity = USER_ID;
mainAdminObj.tags.channel = "admin";

var currentTime = getTimeNow();

var heartBeatTimeoutFlag = false;
var serverCheckInterval = 1000;
var maxServerHeartBeatWait = 30000;

console.log("ADMIN PAGE");

var adminConfig = {};

var testMode = false;

adminConfig.testMode = testMode;
adminConfig.hideDisconnectedServers = false;

var serverTableHead;
var serverTableBody;

var viewerTableHead;
var viewerTableBody;

var memoryBar;
var memoryBarDiv;
var memoryBarText;

var tweetsPerMinBar;
var tweetsPerMinBarDiv;
var tweetsPerMinBarText;

var serversBar;
var serversBarDiv;
var serversBarText;

var viewersBar;
var viewersBarDiv;
var viewersBarText;

function initBars(callback){
 
  console.debug("INIT BARS ...");

  // VIEWERS ===============================

  viewerTableHead = document.getElementById('viewer_table_head');
  viewerTableBody = document.getElementById('viewer_table_body');

  viewersBarDiv = document.getElementById('viewers-bar');
  viewersBar = new ProgressBar.Line(viewersBarDiv, { duration: 100 });
  viewersBar.animate(0);
  viewersBarText = document.getElementById('viewers-bar-text');

  // SERVER ===============================

  serverTableHead = document.getElementById('server_table_head');
  serverTableBody = document.getElementById('server_table_body');

  serversBarDiv = document.getElementById('servers-bar');
  serversBar = new ProgressBar.Line(serversBarDiv, { duration: 100 });
  serversBar.animate(0);
  serversBarText = document.getElementById('servers-bar-text');

  // MEMORY ===============================

  memoryBarDiv = document.getElementById('memory-bar');
  memoryBarText = document.getElementById('memory-bar-text');
  memoryBar = new ProgressBar.Line(memoryBarDiv, { duration: 100 });
  memoryBar.animate(0);

  tweetsPerMinBarDiv = document.getElementById('delta-tweet-bar');
  tweetsPerMinBarText = document.getElementById('delta-tweet-bar-text');
  tweetsPerMinBar = new ProgressBar.Line(tweetsPerMinBarDiv, { duration: 100 });
  tweetsPerMinBar.animate(0);

  var options = {
    isHeaderRow: true,
    textColor: '#CCCCCC',
    bgColor: '#222222'
  };

  tableCreateRow(
    serverTableHead, 
    options, 
    ['SERVER ID', 'TYPE', 'SOCKET', 'IP', 'STATUS', 'LAST SEEN', 'AGO', 'UPTIME']
  ); // 2nd arg is headerFlag

  tableCreateRow(
    viewerTableHead, 
    options, 
    ['VIEWER ID', 'TYPE', 'SOCKET', 'IP', 'STATUS', 'LAST SEEN', 'AGO']
  ); // 2nd arg is headerFlag

  callback();
}

var heartBeat = {};
var lastTimeoutHeartBeat = null;

var hbIndex = 0;
var tweetsPerMin = 0;
var tweetsPerMinMax = 1;
var tweetsPerMinMaxTime = 0;

var jsonPrint = function(obj, options) {

  if (options) {
    if (options.ignore) {

      var tempObj = obj;

      async.each(options.ignore.length, function(ignoreWord, cb){
        if (tempObj.hasOwnProperty(ignoreWord)) {
          tempObj[ignoreWord] = [];
        }
        cb();
      }, function(){
        return JSON.stringify(tempObj, null, 3);
      });
    }
  }
  else {
    return JSON.stringify(obj, null, 3);
  }
};

function getTimeStamp(inputTime) {
  var cDate, cTime;
  var options = {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  };

  if (inputTime === undefined) {
    cDate = new Date().toDateString("en-US", options);
    cTime = new Date().toTimeString('en-US', options);
  } else {
    cDate = new Date(inputTime).toDateString("en-US", options);
    cTime = new Date(inputTime).toTimeString('en-US', options);
  }
  return cDate + " - " + cTime;
}

function msToTime(duration) {
  // var milliseconds = parseInt((duration % 1000) / 100);
  var seconds = parseInt((duration / 1000) % 60);
  var minutes = parseInt((duration / (1000 * 60)) % 60);
  var hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  var days = parseInt(duration / (1000 * 60 * 60 * 24));

  var daysInt = days;
  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  if (daysInt > 0) {
    return days + " DAYS | " + hours + ":" + minutes + ":" + seconds;
  } else {
    return hours + ":" + minutes + ":" + seconds;
  }
}

function serverClear() {
  console.log("... CLEARING SERVER INFO ...\n");

  heartBeatTimeoutFlag = false;

  adminIpHashMap.clear();
  adminSocketIdHashMap.clear();

  serverTypeHashMap.clear();
  serverSocketHashMap.clear();

  viewerIpHashMap.clear();
  viewerSessionHashMap.clear();

  if (serverConnected && initializeComplete) {
    updateServerHeartbeat(heartBeat, heartBeatTimeoutFlag, lastTimeoutHeartBeat);
  }
}

function updateAdminConfig(config) {

  console.log("ADMIN CONFIG CHANGE\n" + jsonPrint(config));

  if (config.testMode !== undefined) {
    console.log("   ---> CONFIG_CHANGE: testMode: " + config.testMode);
    adminConfig.testMode = config.testMode;
    setTestMode(config.testMode);
  }
}


function tableCreateRow(parentTable, options, cellContentArray) {

  var tr = parentTable.insertRow();

  var textColor = options.textColor || DEFAULT_TABLE_TEXT_COLOR;
  var bgColor = options.bgColor || DEFAULT_TABLE_BG_COLOR;
  var fontSize = options.fontSize || DEFAULT_TABLE_FONT_SIZE;
  
  if (options.class) {
    tr.setAttribute("class", options.class);
  }

  if (options.id) {
    tr.setAttribute("id", options.id);
  }


  cellContentArray.forEach(function(content) {

    var cell = tr.insertCell();

    if (isObject(content)) {
      if (content.id) {
        cell.setAttribute("id", content.id);
      }
      cell.appendChild(document.createTextNode(content.text));
      cell.style.fontSize = content.fontSize || fontSize;
      cell.style.color = content.thTextColor || textColor;
      cell.style.backgroundColor = content.tdBgColor || bgColor;
    }
    else {
      cell.appendChild(document.createTextNode(content));
      cell.style.fontSize = fontSize;
      cell.style.color = textColor;
      cell.style.backgroundColor = bgColor;
    }
  });

}

setInterval(function() {
  currentTime = getTimeNow();
  if (serverConnected && initializeComplete) {
  }
  if (initializeComplete && !sentAdminReady) {
    socket.emit("ADMIN_READY", mainAdminObj);
    sentAdminReady = true;
    console.debug("TX ADMIN_READY\n" + jsonPrint(mainAdminObj));
  }
}, 1000);


setInterval(function() {
  if (serverConnected && sentAdminReady) {
    socket.emit("SESSION_KEEPALIVE", mainAdminObj);
  }
}, 10000);


socket.on('connect', function() {
  serverConnected = true;
  console.log("\n===== ADMIN SERVER CONNECTED =====\n" + getTimeStamp());

});

socket.on('reconnect', function() {
  serverConnected = true;
  console.log("\n===== ADMIN SERVER RECONNECTED =====\n" + getTimeStamp());
  serverClear();
  socket.emit("ADMIN_READY", mainAdminObj);
  console.log("TX ADMIN_READY\n" + jsonPrint(mainAdminObj));
  sentAdminReady = true;
});

socket.on('disconnect', function() {
  serverConnected = false;
  console.log("\n***** SERVER DISCONNECTED *****\n" + getTimeStamp());
  serverClear();
  sentAdminReady = false;
});

socket.on("ADMIN_CONFIG", function(rxAdminConfig) {
  console.log("\n*** RX ADMIN CONFIG ***\n" + JSON.stringify(rxAdminConfig, null, 3));
  updateAdminConfig(rxAdminConfig);
});

socket.on("CONFIG_CHANGE", function(rxAdminConfig) {
  var previousProperty;

  console.log("\n*** RX ADMIN CONFIG CHANGE ***\n" + JSON.stringify(rxAdminConfig, null, 3));

  console.log("\nPREVIOUS ADMIN CONFIG:\n" + JSON.stringify(adminConfig, null, 3));
  for (var configPropertyName in rxAdminConfig) {
    console.log("configPropertyName: " + configPropertyName + " | " + rxAdminConfig[configPropertyName]);
    if (adminConfig !== undefined) {
      previousProperty = adminConfig[configPropertyName];
    }
    adminConfig[configPropertyName] = rxAdminConfig[configPropertyName];
    console.log(configPropertyName + " was: " + previousProperty + " | now: " + adminConfig[configPropertyName]);
  }
  console.log("\nNEW ADMIN CONFIG:\n" + JSON.stringify(adminConfig, null, 3));
  updateAdminConfig(adminConfig);
});

socket.on('ADMIN IP', function(rxIpObj) {

  var adminSessionObj = JSON.parse(rxIpObj);

  console.log("RXCD ADMIN IP  " + adminSessionObj.ip + " | " + adminSessionObj.domain);

  var adminIpObj = {};
  adminIpObj.ip = adminSessionObj.ip;
  adminIpObj.domain = adminSessionObj.domain;
  adminIpObj.sessions = {};

  adminIpObj.sessions[adminSessionObj.sessionId] = adminSessionObj;

  adminIpHashMap.set(adminIpObj.ip, adminIpObj);

  adminIpHashMapKeys = adminIpHashMap.keys();
  adminIpHashMapKeys.sort();

  adminSocketIdHashMap.set(adminSessionObj.sessionId, adminIpObj);
  adminSocketIdHashMapKeys = adminSocketIdHashMap.keys();
  adminSocketIdHashMapKeys.sort();
});

socket.on('VIEWER IP', function(rxIpObj) {
  var ipObj = JSON.parse(rxIpObj);
  console.debug("RXCD VIEWER IP  " + ipObj.ip + " | " + ipObj.domain);
  viewerIpHashMap.set(ipObj.ip, ipObj);
});


socket.on('ADMIN_ACK', function(adminSessionKey) {

  console.log("RXCD ADMIN ACK: " + socket.id + " | KEY: " + adminSessionKey);

});

socket.on('ADMIN_SESSION', function(adminSessionObj) {

  console.log("RX ADMIN SESSION: " + adminSessionObj.sessionId + " | UID: " + adminSessionObj.userId);

  var adminIpObj = {};
  adminIpObj.ip = adminSessionObj.ip;
  adminIpObj.domain = adminSessionObj.domain;
  adminIpObj.sessions = {};

  adminIpObj.sessions[adminSessionObj.sessionId] = adminSessionObj;

  adminIpHashMap.set(adminIpObj.ip, adminIpObj);

  adminSocketIdHashMap.set(adminSessionObj.sessionId, adminIpObj);
  adminSocketIdHashMapKeys = adminSocketIdHashMap.keys();
  adminSocketIdHashMapKeys.sort();

});

socket.on('SERVER_STATS', function(serverObj) {

  console.debug("SERVER_STATS\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_STATS | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  var sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "STATS";
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;
  sObj.stats = serverObj.stats;
  sObj.timeStamp = serverObj.timeStamp;

  serverSocketHashMap.set(sObj.socketId, sObj);

  let currentServerTableRow = document.getElementById(serverObj.socketId);

  if (currentServerTableRow) {

    console.debug("UPDATE TABLE ROW: " + currentServerTableRow.id);

    document.getElementById(serverObj.socketId + "_nodeId").innerHTML = sObj.user.nodeId;
    document.getElementById(serverObj.socketId + "_type").innerHTML = sObj.type;
    document.getElementById(serverObj.socketId + "_socketId").innerHTML = sObj.socketId;
    document.getElementById(serverObj.socketId + "_status").innerHTML = sObj.status;
    document.getElementById(serverObj.socketId + "_timeStamp").innerHTML = moment(sObj.timeStamp).format(defaultDateTimeFormat);
    document.getElementById(serverObj.socketId + "_ago").innerHTML = msToTime(moment().diff(moment(sObj.timeStamp)));
  }

});

socket.on('TWITTER_TOPTERM_1MIN', function(top10array) {
  console.debug("TWITTER_TOPTERM_1MIN\n" + jsonPrint(top10array));
});

socket.on('SERVER_ERROR', function(serverObj) {

  console.debug("SERVER_ERROR\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_ERROR | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  var sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "ERROR";
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;
  sObj.timeStamp = serverObj.timeStamp;

  serverSocketHashMap.set(sObj.socketId, sObj);

  let currentServerTableRow = document.getElementById(serverObj.socketId);

  if (currentServerTableRow) {

    console.debug("UPDATE TABLE ROW: " + currentServerTableRow.id);

    document.getElementById(serverObj.socketId + "_nodeId").innerHTML = sObj.user.nodeId;
    document.getElementById(serverObj.socketId + "_type").innerHTML = sObj.type;
    document.getElementById(serverObj.socketId + "_socketId").innerHTML = sObj.socketId;
    document.getElementById(serverObj.socketId + "_status").innerHTML = sObj.status;
    document.getElementById(serverObj.socketId + "_timeStamp").innerHTML = moment(sObj.timeStamp).format(defaultDateTimeFormat);
    document.getElementById(serverObj.socketId + "_ago").innerHTML = msToTime(moment().diff(moment(sObj.timeStamp)));
  }

});

socket.on('SERVER_DISCONNECT', function(serverObj) {

  console.debug("SERVER_DISCONNECT\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_DISCONNECT | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  var sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "DISCONNECTED";
  sObj.timeStamp = serverObj.timeStamp;
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;

  serverSocketHashMap.set(sObj.socketId, sObj);

  let currentServerTableRow = document.getElementById(serverObj.socketId);

  if (currentServerTableRow) {

    console.debug("UPDATE TABLE ROW: " + currentServerTableRow.id);

    document.getElementById(serverObj.socketId + "_nodeId").innerHTML = sObj.user.nodeId;
    document.getElementById(serverObj.socketId + "_type").innerHTML = sObj.type;
    document.getElementById(serverObj.socketId + "_socketId").innerHTML = serverObj.socketId;
    document.getElementById(serverObj.socketId + "_status").innerHTML = sObj.status;
    document.getElementById(serverObj.socketId + "_timeStamp").innerHTML = moment(sObj.timeStamp).format(defaultDateTimeFormat);
    document.getElementById(serverObj.socketId + "_ago").innerHTML = msToTime(moment().diff(moment(sObj.timeStamp)));
  }

});

socket.on('SERVER_DELETE', function(serverObj) {

  console.debug("SERVER_DELETE\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_DELETE | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  var sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "DELETED";
  sObj.timeStamp = serverObj.timeStamp;
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;

  serverSocketHashMap.set(sObj.socketId, sObj);

  let currentServerTableRow = document.getElementById(serverObj.socketId);

  if (currentServerTableRow) {

    console.debug("UPDATE TABLE ROW: " + currentServerTableRow.id);

    document.getElementById(serverObj.socketId + "_nodeId").innerHTML = sObj.user.nodeId;
    document.getElementById(serverObj.socketId + "_type").innerHTML = sObj.type;
    document.getElementById(serverObj.socketId + "_socketId").innerHTML = sObj.socketId;
    document.getElementById(serverObj.socketId + "_status").innerHTML = sObj.status;
    document.getElementById(serverObj.socketId + "_timeStamp").innerHTML = moment(sObj.timeStamp).format(defaultDateTimeFormat);
    document.getElementById(serverObj.socketId + "_ago").innerHTML = msToTime(moment().diff(moment(sObj.timeStamp)));
  }

});

socket.on('SERVER_ADD', function(serverObj) {
  console.debug("SERVER_ADD\n" + jsonPrint(serverObj));
  serverSocketHashMap.set(serverObj.socketId, serverObj);
});

socket.on('KEEPALIVE', function(serverObj) {
  console.debug("KEEPALIVE | " + serverObj.type + " | " + serverObj.user.nodeId);

  if (serverObj.socketId === socket.id){
    console.warn("KEEPALIVE LOOPBACK "  + serverObj.socketId + " | " + serverObj.user.nodeId);
  }
  else if (serverSocketHashMap.has(serverObj.socketId)){

    let sObj = serverSocketHashMap.get(serverObj.socketId);
    // sObj.status = serverObj.status;
    sObj.timeStamp = serverObj.timeStamp;
    sObj.type = serverObj.type;
    sObj.user = serverObj.user;

    serverSocketHashMap.set(serverObj.socketId, sObj);
  }
  else if (viewerSocketHashMap.has(serverObj.socketId)){

    let sObj = viewerSocketHashMap.get(serverObj.socketId);
    sObj.status = serverObj.status;
    sObj.timeStamp = serverObj.timeStamp;
    sObj.type = serverObj.type;
    sObj.user = serverObj.user;

    viewerSocketHashMap.set(serverObj.socketId, sObj);
  }
  else {
    console.warn("KEEPALIVE SERVER NOT IN HASHMAP\n" + jsonPrint(serverObj));
  }
});

var heartBeatQueue = [];

socket.on('HEARTBEAT', function(rxHeartbeat) {

  heartBeatQueue.push(rxHeartbeat);

  while (heartBeatQueue.length > 60) {
    heartBeatQueue.shift();
  }

});

var heartBeatQueueReady = true;

setInterval(function(){

  if (heartBeatQueue.length > 0){

    heartBeat = heartBeatQueue.shift();

    heartBeatQueueReady = false;
    heartBeatTimeoutFlag = false;
    hbIndex++;

    if (heartBeat.twitter) {
      tweetsPerMin = heartBeat.twitter.tweetsPerMin;
      tweetsPerMinMax = heartBeat.twitter.maxTweetsPerMin;
      tweetsPerMinMaxTime = heartBeat.twitter.maxTweetsPerMinTime;
    }

    heartBeatTimeoutFlag = false;

  }
}, 1000);

var serverCheckTimeout = setInterval(function() {

  if (Date.now() > (heartBeat.timeStamp + maxServerHeartBeatWait)) {
    heartBeatTimeoutFlag = true;
    lastTimeoutHeartBeat = heartBeat;
    console.error("***** SERVER HEARTBEAT TIMEOUT ***** " + getTimeStamp() + " | LAST SEEN: " + getTimeStamp(heartBeat.timeStamp) + msToTime(Date.now() - heartBeat.timeStamp) + " AGO");
  }
  if (heartBeat !== undefined) { updateServerHeartbeat(heartBeat, heartBeatTimeoutFlag, lastTimeoutHeartBeat); }
}, serverCheckInterval);

function setTestMode(inputTestMode) {

  var serverConfigUpdateFlag = false;

  if (inputTestMode !== undefined) {
    serverConfigUpdateFlag = true;
    testMode = inputTestMode;
  } else {
    testMode = !testMode;
  }

  console.log("testMode: " + testMode);

  var config = {
    testMode: testMode
  };

  if (testMode) {
    document.getElementById("testModeButton").style.color = "red";
    document.getElementById("testModeButton").style.border = "2px solid red";
  } else {
    document.getElementById("testModeButton").style.color = "white";
    document.getElementById("testModeButton").style.border = "1px solid gray";
  }

  if (!serverConfigUpdateFlag) {
    console.log("***> SENT CONFIG: " + JSON.stringify(config, null, 3));
  } else {
    console.log("---> UPDATED CONFIG: " + JSON.stringify(config, null, 3));
  }
}

// function toggleTestMode() {
//   testMode = !testMode;
//   console.log("SOCKET_TEST_MODE: " + testMode);
//   socket.emit("SOCKET_TEST_MODE", testMode);
// }


let serverRatio = 0;
let totalServers = 0;
let maxServers = 0;

let viewerRatio = 0;
let totalViewers = 0;
let maxViewers = 0;

function updateServerHeartbeat(heartBeat, timeoutFlag, lastTimeoutHeartBeat) {

  if (!initializeComplete) { return; }

  if (heartBeat.memory !== undefined) {
    memoryUsed = heartBeat.memory.memoryUsage.heapUsed / heartBeat.memory.memoryUsage.rss;
    memoryAvailable = (heartBeat.memory.memoryUsage.rss - heartBeat.memory.memoryUsage.heapUsed) / heartBeat.memory.memoryUsage.rss;

    memoryBarText.innerHTML =
      'HEAP (GB)' 
        + ' | ' + (heartBeat.memory.memoryUsage.rss / ONE_GB).toFixed(2) + ' TOT' 
        + ' | ' + (heartBeat.memory.memoryUsage.heapUsed / ONE_GB).toFixed(2) + ' USED' + ' (' + (100 * memoryUsed).toFixed(1) + ' %)' 
        + ' | ' + ((heartBeat.memory.memoryUsage.rss - heartBeat.memory.memoryUsage.heapUsed) / ONE_GB).toFixed(2) + ' AVAIL' + ' (' + (100 * memoryAvailable).toFixed(2) + ' %)';
  }

  if (memoryBar) { memoryBar.animate(memoryUsed); }

  if (100 * memoryUsed >= ALERT_LIMIT_PERCENT) {
    memoryBar.path.setAttribute('stroke', endColor);
  } else if (100 * memoryUsed >= WARN_LIMIT_PERCENT) {
    memoryBar.path.setAttribute('stroke', midColor);
  } else {
    memoryBar.path.setAttribute('stroke', startColor);
  }

  // // VIEWERS ==========================

  viewersBar.animate(viewerRatio);

  if (100 * viewerRatio >= ALERT_LIMIT_PERCENT) {
    viewersBar.path.setAttribute('stroke', endColor);
  } else if (100 * viewerRatio >= WARN_LIMIT_PERCENT) {
    viewersBar.path.setAttribute('stroke', midColor);
  } else {
    viewersBar.path.setAttribute('stroke', startColor);
  }

  totalViewers = 0;

  if (heartBeat.viewers && viewerTableBody) {

    if (heartBeat.viewers.length === 0){
      viewerSocketHashMap.forEach(function(viewerObj, viewerSocketId){
        viewerObj.status = "UNKNOWN";
        viewerObj.connected = false;
        viewerObj.deleted = true;
        viewerSocketHashMap.set(viewerSocketId, viewerObj);
      });
    }

    async.eachSeries(heartBeat.viewers, function(viewerSocketEntry, cb){

      const viewerSocketId = viewerSocketEntry[0];
      let currentViewer = viewerSocketEntry[1];

      if (currentViewer.status === undefined) { currentViewer.status = "UNKNOWN"; }

      viewerTypeHashMap.set(currentViewer.type, currentViewer);
      viewerSocketHashMap.set(viewerSocketId, currentViewer);

      let currentViewerTableRow = document.getElementById(viewerSocketId);

      if (currentViewerTableRow) {
        if (currentViewer.status.toUpperCase() === "DISCONNECTED") {
          if (adminConfig.hideDisconnectedViewers) {
            currentViewerTableRow.parentNode.removeChild(currentViewerTableRow);
            return cb();
          }
          else {
            currentViewerTableRow.style.backgroundColor = "red";
            document.getElementById(viewerSocketId + "_nodeId").style.color = "red";
            document.getElementById(viewerSocketId + "_nodeId").style.backgroundColor = "black";
            document.getElementById(viewerSocketId + "_status").style.color = "red";
            document.getElementById(viewerSocketId + "_status").style.backgroundColor = "black";
          }
        }
        else {
          totalViewers += 1;
        }
        document.getElementById(viewerSocketId + "_nodeId").innerHTML = currentViewer.user.nodeId;
        document.getElementById(viewerSocketId + "_type").innerHTML = currentViewer.type;
        document.getElementById(viewerSocketId + "_socketId").innerHTML = viewerSocketId;
        document.getElementById(viewerSocketId + "_ip").innerHTML = currentViewer.ip;
        document.getElementById(viewerSocketId + "_status").innerHTML = currentViewer.status.toUpperCase();
        document.getElementById(viewerSocketId + "_timeStamp").innerHTML = moment(currentViewer.timeStamp).format(defaultDateTimeFormat);
        document.getElementById(viewerSocketId + "_ago").innerHTML = msToTime(moment().diff(moment(currentViewer.timeStamp)));
        // document.getElementById(viewerSocketId + "_elapsed").innerHTML = msToTime(currentViewer.user.stats.elapsed);
      }
      else if (!adminConfig.hideDisconnectedViewers || (currentViewer.status.toUpperCase() !== "DISCONNECTED")) {

        totalViewers += 1;

        tableCreateRow(
          viewerTableBody, 
          {id: viewerSocketId}, 
          [
            { id: viewerSocketId + "_nodeId", text: currentViewer.user.nodeId }, 
            { id: viewerSocketId + "_type", text: currentViewer.type }, 
            { id: viewerSocketId + "_socketId", text: viewerSocketId }, 
            { id: viewerSocketId + "_ip", text: currentViewer.ip }, 
            { id: viewerSocketId + "_status", text: currentViewer.status.toUpperCase() }, 
            { id: viewerSocketId + "_timeStamp", text: moment(currentViewer.timeStamp).format(defaultDateTimeFormat) }, 
            { id: viewerSocketId + "_ago", text: msToTime(moment().diff(moment(currentViewer.timeStamp))) },
            // { id: viewerSocketId + "_elapsed", text: msToTime(currentViewer.user.stats.elapsed) }
          ]
        );
      }

      async.setImmediate(function() { cb(); });

    }, function(){
      maxViewers = Math.max(maxViewers, totalViewers);
      viewerRatio = totalViewers / maxViewers;
      viewersBarText.innerHTML = totalViewers + " VIEWERS | " + maxViewers + " MAX | " 
        + moment().format(defaultDateTimeFormat);
    });
  }


  // SERVERS =========================

  serversBar.animate(serverRatio);

  if (100 * serverRatio >= ALERT_LIMIT_PERCENT) {
    serversBar.path.setAttribute('stroke', endColor);
  } else if (100 * serverRatio >= WARN_LIMIT_PERCENT) {
    serversBar.path.setAttribute('stroke', midColor);
  } else {
    serversBar.path.setAttribute('stroke', startColor);
  }

  totalServers = 0;

  if (heartBeat.servers && serverTableBody) {

    if (heartBeat.servers.length === 0){
      serverSocketHashMap.forEach(function(serverObj, serverSocketId){
        serverObj.status = "UNKNOWN";
        serverObj.connected = false;
        serverObj.deleted = true;
        serverSocketHashMap.set(serverSocketId, serverObj);
      });
    }

    async.eachSeries(heartBeat.servers, function(serverSocketEntry, cb){

      const serverSocketId = serverSocketEntry[0];
      const currentServer = serverSocketEntry[1];

      serverTypeHashMap.set(currentServer.type, currentServer);
      serverSocketHashMap.set(serverSocketId, currentServer);

      let currentServerTableRow = document.getElementById(serverSocketId);

      if (currentServerTableRow) {
        if (currentServer.status.toUpperCase() === "DISCONNECTED") {
          if (adminConfig.hideDisconnectedServers) {
            currentServerTableRow.parentNode.removeChild(currentServerTableRow);
            return cb();
          }
          else {
            currentServerTableRow.style.backgroundColor = "red";
            document.getElementById(serverSocketId + "_nodeId").style.color = "red";
            document.getElementById(serverSocketId + "_nodeId").style.backgroundColor = "black";
            document.getElementById(serverSocketId + "_status").style.color = "red";
            document.getElementById(serverSocketId + "_status").style.backgroundColor = "black";
          }
        }
        else {
          totalServers += 1;
        }
        document.getElementById(serverSocketId + "_nodeId").innerHTML = currentServer.user.nodeId;
        document.getElementById(serverSocketId + "_type").innerHTML = currentServer.type;
        document.getElementById(serverSocketId + "_socketId").innerHTML = serverSocketId;
        document.getElementById(serverSocketId + "_ip").innerHTML = currentServer.ip;
        document.getElementById(serverSocketId + "_status").innerHTML = currentServer.status.toUpperCase();
        document.getElementById(serverSocketId + "_timeStamp").innerHTML = moment(currentServer.timeStamp).format(defaultDateTimeFormat);
        document.getElementById(serverSocketId + "_ago").innerHTML = msToTime(moment().diff(moment(currentServer.timeStamp)));
        document.getElementById(serverSocketId + "_elapsed").innerHTML = msToTime(currentServer.user.stats.elapsed);
      }
      else if (!adminConfig.hideDisconnectedServers || (currentServer.status.toUpperCase() !== "DISCONNECTED")) {

        totalServers += 1;

        tableCreateRow(
          serverTableBody, 
          {id: serverSocketId}, 
          [
            { id: serverSocketId + "_nodeId", text: currentServer.user.nodeId }, 
            { id: serverSocketId + "_type", text: currentServer.type }, 
            { id: serverSocketId + "_socketId", text: serverSocketId }, 
            { id: serverSocketId + "_ip", text: currentServer.ip }, 
            { id: serverSocketId + "_status", text: currentServer.status.toUpperCase() }, 
            { id: serverSocketId + "_timeStamp", text: moment(currentServer.timeStamp).format(defaultDateTimeFormat) }, 
            { id: serverSocketId + "_ago", text: msToTime(moment().diff(moment(currentServer.timeStamp))) },
            { id: serverSocketId + "_elapsed", text: msToTime(currentServer.user.stats.elapsed) }
          ]
        );
      }



      async.setImmediate(function() { cb(); });

    }, function(){
      maxServers = Math.max(maxServers, totalServers);
      serverRatio = totalServers / maxServers;
      serversBarText.innerHTML = totalServers + " SERVERS | " + maxServers + " MAX | " 
        + moment().format(defaultDateTimeFormat);
    });
  }

  // WORDS =========================
  
  tweetsPerMinBar.animate(tweetsPerMin / tweetsPerMinMax);

  if (tweetsPerMin >= 0.01*ALERT_LIMIT_PERCENT * tweetsPerMinMax) {
    tweetsPerMinBar.path.setAttribute('stroke', endColor);
  } 
  else if (tweetsPerMin >= 0.01*WARN_LIMIT_PERCENT * tweetsPerMinMax) {
    tweetsPerMinBar.path.setAttribute('stroke', midColor);
  } 
  else {
    tweetsPerMinBar.path.setAttribute('stroke', startColor);
  }

  tweetsPerMinBarText.innerHTML = parseInt(tweetsPerMin) + ' TPM | ' 
    + parseInt(tweetsPerMinMax) + ' MAX' + ' | ' 
    + moment(tweetsPerMinMaxTime).format(defaultDateTimeFormat);

  var heatbeatTable = document.getElementById('heartbeat_table');

  while (heatbeatTable.childNodes.length > 0) {
    heatbeatTable.removeChild(heatbeatTable.firstChild);
  }

  tableCreateRow(heatbeatTable, false, ['LOCAL TIME', getTimeStamp()]);

  if (timeoutFlag) {

    tableCreateRow(
      heatbeatTable, 
      false, 
      [
        '*** SERVER TIMEOUT ***', 
        (msToTime(Date.now() - heartBeat.timeStamp)) + ' AGO'
      ]
    );

    var tdTimeout = heatbeatTable.getElementsByTagName("td");

    tdTimeout[2].style.color = "white";
    tdTimeout[2].style.backgroundColor = "red";

  } 
  else if (lastTimeoutHeartBeat) {

    tableCreateRow(
      heatbeatTable,
      false, 
      [
        '* SERVER TIMEOUT *',
        getTimeStamp(lastTimeoutHeartBeat.timeStamp),
        msToTime(Date.now() - lastTimeoutHeartBeat.timeStamp) + ' AGO'
      ]);

    var tdLastTimeout = heatbeatTable.getElementsByTagName("td");

    tdLastTimeout[2].style.color = "white";
    tdLastTimeout[2].style.backgroundColor = '#880000';

  }

  tableCreateRow(heatbeatTable, false, ['SERVER TIME', getTimeStamp(heartBeat.serverTime)]);
  tableCreateRow(heatbeatTable, false, ['SERVER UPTIME', msToTime(heartBeat.upTime)]);
  tableCreateRow(heatbeatTable, false, ['APP START TIME', getTimeStamp(heartBeat.startTime)]);
  tableCreateRow(heatbeatTable, false, ['APP RUNTIME', msToTime(heartBeat.runTime)]);

}

function initialize(callback){

  console.debug("INITIALIZE...");

  initBars(function(){
    callback();
  });

}