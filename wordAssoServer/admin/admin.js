
/*ver 0.47*/
/*jslint node: true */
"use strict";

var socket = io('/admin');

var memoryAvailable = 0;
var memoryUsed = 0;
var memoryUsage = {};

var serverConnected = false;
var sentAdminReady = false;
var initializeComplete = false;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var startColor = '#008000';
var midColor = '#F9CD2B';
var endColor = '#CC0000';

var WARN_LIMIT_PERCENT = 80;
var ALERT_LIMIT_PERCENT = 95;

var ONE_MB = 1024 * 1024;
var ONE_GB = ONE_MB * 1024;
var TIMELINE_WIDTH = 600;
var TIMELINE_HEIGHT = 250;
var MAX_TIMELINE = 600;

var tpmData =[];
var wpmData =[];
var trpmData =[];
var tLimitData = [];


requirejs(["https://d3js.org/d3.v5.min.js"], function(d3Loaded) {
// requirejs([], function(d3Loaded) {
    console.debug("d3 LOADED");
    initialize(function(){
      initializeComplete = true;
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

var heartbeatElement;

var serverTypeHashMap = new HashMap();
var serverSocketHashMap = new HashMap();

var viewerIpHashMap = new HashMap();
var viewerSessionHashMap = new HashMap();
var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();

var adminIpHashMapKeys = [];
var adminSocketIdHashMapKeys = [];

var randomIntFromInterval = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

function getTimeNow() {
  var d = new Date();
  return d.getTime();
}

function getMillis() {
  var d = new Date();
  return d.getMilliseconds();
}

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
var wordsPerMinuteMax = 1;

console.log("ADMIN PAGE");

var adminConfig = {};

var testMode = false;

adminConfig['testMode'] = testMode;

var searchByDateTimeEnable = false;
var searchByDateTimeContinueEnable = false;

var googleOauthUrl = 0;

var deltaResponsesMax = 1;

var numberAdminIpAddresses = adminIpHashMap.count();
var numberAdminsConnected = 0;

var showConnectedAdmins = true;
var showDisconnectedAdmins = false;
var showIpAdmins = true;

var showConnectedViewers = true;
var showIpViewers = true;
var showBotViewers = true;

var viewerIpHashMapKeys = [];
var viewerSessionHashMapKeys = [];

var numberViewerSessions = 0;
var numberViewerIpAddresses = viewerIpHashMap.count();

var viewerConnectedColor = "#00aa00";
var viewerDisconnectedColor = "#aa0000";
var showDisconnectedViewers = false;
var viewerIpTableBody;
var viewerSessionTableBody;
var viewerSessionTableHead;

var deltaTweetsMax = 1;

var serverTableHead;
var serverTableBody;

var viewerIpTableHead;

var memoryBar;
var memoryBarDiv;
var memoryBarText;

var tweetsPerMinBar;
var tweetsPerMinBarDiv;
var tweetsPerMinBarText;

var twitterLimitBar;
var twitterLimitBarDiv;
var twitterLimitBarText;

var serversBar;
var serversBarDiv;
var serversBarText;

var viewersBar;
var viewersBarDiv;
var viewersBarText;

var rawDiv;
var rawDivText;

function updateRawText(text){
  rawDivText = document.getElementById("rawDivText");
  rawDivText.innerHTML = text;
}

function initBars(callback){
 
  console.debug("INIT BARS ...");

  // VIEWERS ===============================

  viewerSessionTableHead = document.getElementById('viewer_session_table_head');
  viewerSessionTableBody = document.getElementById('viewer_session_table_body');

  viewerIpTableHead = document.getElementById('viewer_ip_table_head');
  viewerIpTableBody = document.getElementById('viewer_ip_table_body');

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

  twitterLimitBarDiv = document.getElementById('twitter-limit-bar');
  twitterLimitBarText = document.getElementById('twitter-limit-bar-text');
  twitterLimitBar = new ProgressBar.Line(twitterLimitBarDiv, { duration: 100 });
  twitterLimitBar.animate(0);

  var options = {
    headerFlag: true,
    thTextColor: '#CCCCCC',
    backgroundColor: '#222222'
  };

  tableCreateRow(viewerIpTableHead, options, ['VIEWERS', 'IP', 'DOMAIN', 'LAST SEEN', 'AGO', 'SESSIONS']); // 2nd arg is headerFlag
  tableCreateRow(viewerSessionTableHead, options, ['SESSIONS', 'IP', 'DOMAIN', 'USER', 'SESSION', 'CONNECT', 'DISCONNECT', 'TIME CONNECTED']); // 2nd arg is headerFlag
  tableCreateRow(serverTableHead, options, ['SERVER ID', 'TYPE', 'SOCKET', 'LAST SEEN', 'AGO']); // 2nd arg is headerFlag

  callback();
}

var heartBeat = {};
var lastTimeoutHeartBeat = null;

var hbIndex = 0;
var tweetsPerMin = 0;
var tweetsPerMinMax = 1;
var tweetsPerMinMaxTime = 0;

var twitterLimit = 0;
var twitterLimitMax = 1;
var twitterLimitMaxTime = 0;


function setValue(id, newvalue) {
  var s = document.getElementById(id);
  s.value = newvalue;
}

var jsonPrint = function(obj, options) {

  if (options) {
    if (options.ignore) {

      var tempObj = obj;
      // var i = 0;
      // var ignoreWord;

      async.each(options.ignore.length, function(ignoreWord, cb){
        if (tempObj.hasOwnProperty(ignoreWord)) {
          tempObj[ignoreWord] = [];
        }
        cb();
      }, function(){
        return JSON.stringify(tempObj, null, 3);
      });
      // for (i = 0; i < options.ignore.length; i += 1) {

      //   ignoreWord = options.ignore[i];

      //   if (tempObj.hasOwnProperty(ignoreWord)) {
      //     tempObj[ignoreWord] = [];
      //   }

      // }

      // if (i == options.ignore.length) { return JSON.stringify(tempObj, null, 3); }
    }
  }
  else {
    return JSON.stringify(obj, null, 3);
  }
}

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
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24),
    days = parseInt(duration / (1000 * 60 * 60 * 24));

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

function sortIpHashMapByConnectTime(ipHashMap) {}

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
    testMode = config.testMode;
    setTestMode(config.testMode);
  }
}

function tableCreateRow(parentTable, options, cells) {

  var tr = parentTable.insertRow();
  var thTextColor = options.thTextColor;
  var tdTextColor = options.tdTextColor;

  if (options.textColor) {
    thTextColor = options.textColor;
    tdTextColor = options.textColor;
  }
  var tdBgColor = options.backgroundColor || '#222222';

  if (options.trClass) {
    tr.setAttribute("class", options.trClass);
  }

  if (options.headerFlag) {
    cells.forEach(function(content) {
      var th = tr.insertCell();
      th.appendChild(document.createTextNode(content));
      th.style.fontSize = "1em";
      th.style.color = thTextColor;
      th.style.backgroundColor = tdBgColor;
    });
  } else {
    cells.forEach(function(content) {
      var td = tr.insertCell();
      // var td2 = td.insertCell();
      td.appendChild(document.createTextNode(content));
      td.style.fontSize = "1em";
      td.style.color = tdTextColor;
      td.style.backgroundColor = tdBgColor;
    });
  }
}

var dateNow = moment().valueOf();

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
  console.log("\n***** SERVER DISCONECTED *****\n" + getTimeStamp());
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

  numberAdminIpAddresses = adminIpHashMap.count();
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
  numberViewerIpAddresses = viewerIpHashMap.count();
  viewerIpHashMapKeys = viewerIpHashMap.keys();
  viewerIpHashMapKeys.sort();
});


socket.on('ADMIN_ACK', function(adminSessionKey) {

  console.log("RXCD ADMIN ACK: " + socket.id + " | KEY: " + adminSessionKey);

  var reqSessionsOptions = {
    requestSocketId: socket.id,
    requestNamespace: '/admin',
    sessionType: 'ALL',
    sessionState: 'CONNECTED',
    maxSessions: 10
  }

  requestSessions(reqSessionsOptions);
});

socket.on('ADMIN_SESSION', function(adminSessionObj) {

  // console.log("adminSessionObj\n" + jsonPrint(adminSessionObj, {
  //     ignore: ['wordChain', 'sessions']
  // }));

  console.log("RX ADMIN SESSION: " + adminSessionObj.sessionId + " | UID: " + adminSessionObj.userId);

  var adminIpObj = {};
  adminIpObj.ip = adminSessionObj.ip;
  adminIpObj.domain = adminSessionObj.domain;
  adminIpObj.sessions = {};

  adminIpObj.sessions[adminSessionObj.sessionId] = adminSessionObj;

  adminIpHashMap.set(adminIpObj.ip, adminIpObj);

  numberAdminIpAddresses = adminIpHashMap.count();

  adminSocketIdHashMap.set(adminSessionObj.sessionId, adminIpObj);
  adminSocketIdHashMapKeys = adminSocketIdHashMap.keys();
  adminSocketIdHashMapKeys.sort();
  updateAdminConnect(adminSessionObj);
});

socket.on('VIEWER_SESSION', function(viewerSessionObj) {

  console.log("viewerSessionObj\n" + jsonPrint(viewerSessionObj, {
    ignore: ['wordChain', 'sessions']
  }));

  console.log("RX VIEWER SESSION: " + viewerSessionObj.sessionId + " | UID: " + viewerSessionObj.userId);

  viewerIpHashMap.set(viewerSessionObj.ip, viewerSessionObj);
  viewerIpHashMapKeys = viewerIpHashMap.keys();
  viewerIpHashMapKeys.sort();
  numberViewerIpAddresses = viewerIpHashMapKeys.length;

  viewerSessionHashMap.set(viewerSessionObj.sessionId, viewerSessionObj);
  viewerSessionHashMapKeys = viewerSessionHashMap.keys();
  viewerSessionHashMapKeys.sort();
  numberViewerSessions = viewerSessionHashMapKeys.length;

  if (serverConnected && initializeComplete) { updateViewerConnect(viewerSessionObj, null) };
});

var serverSessionQueue = [];
socket.on('SERVER_SESSION', function(rxSession) {
  serverSessionQueue.push(rxSession);
});


socket.on('TWITTER_TOPTERM_1MIN', function(top10array) {
  console.debug("TWITTER_TOPTERM_1MIN\n" + jsonPrint(top10array));
});


socket.on('SERVER_DELETE', function(serverObj) {
  console.debug("SERVER_DELETE\n" + jsonPrint(serverObj));
  serverSocketHashMap.delete(serverObj.socketId);
});

socket.on('SERVER_ADD', function(serverObj) {
  console.debug("SERVER_ADD\n" + jsonPrint(serverObj));
  serverSocketHashMap.set(serverObj.socketId, serverObj);
});

socket.on('KEEPALIVE', function(serverObj) {
  console.debug("KEEPALIVE | " + serverObj.type + " | " + serverObj.user.nodeId);

  if (serverSocketHashMap.has(serverObj.socketId)){
    serverObj.connected = true;
    serverSocketHashMap.set(serverObj.socketId, serverObj);
  }
  else {
    console.warn("KEEPALIVE SERVER NOT IN HASHMAP\n" + jsonPrint(serverObj));
  }
});



var heartBeatQueue = [];
socket.on('HEARTBEAT', function(rxHeartbeat) {
  heartBeatQueue.push(rxHeartbeat);
});

var heartBeatQueueReady = true;
setInterval(function(){

  if (heartBeatQueueReady && (heartBeatQueue.length > 0)){

    heartBeat = heartBeatQueue.shift();

    heartBeatQueueReady = false;
    heartBeatTimeoutFlag = false;
    hbIndex++;

    if (heartBeat.twitter) {
      tweetsPerMin = heartBeat.twitter.tweetsPerMin;
      tweetsPerMinMax = heartBeat.twitter.maxTweetsPerMin;
      tweetsPerMinMaxTime = heartBeat.twitter.maxTweetsPerMinTime;

      // twitterLimit = heartBeat.twitter.twitterLimit;
      // twitterLimitMax = heartBeat.twitter.twitterLimitMax;
      // twitterLimitMaxTime = heartBeat.twitter.twitterLimitMaxTime;
    }

    if (heartBeat.deltaResponsesReceived > deltaResponsesMax) {deltaResponsesMax = heartBeat.deltaResponsesReceived;}

    if (heartBeat.wordsPerMinute > wordsPerMinuteMax) {wordsPerMinuteMax = heartBeat.wordsPerMinute;}

    heartBeatTimeoutFlag = false;

    updateRawText(jsonPrint(heartBeat));
  }
}, 1000);

var serverCheckTimeout = setInterval(function() {
  numberAdminIpAddresses = adminIpHashMap.count();
  numberViewerIpAddresses = viewerIpHashMap.count();

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
  }

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

function sendServerConfig(e) {

  var config = {
    testMode: testMode
  }

  var configHasValues = false;

  if ((e === undefined) || (e.keyCode == 13)) {
    if (configHasValues) {
      console.log("***> SENT CONFIG: " + JSON.stringify(config, null, 3));
      socket.emit('CONFIG', JSON.stringify(config));
      return false;
    } else {
      console.log("sendServerConfig: NO VALUES SET ... SKIPPING ...");
    }
  }
}

function toggleTestMode() {
  testMode = !testMode;
  console.log("SOCKET_TEST_MODE: " + testMode);
  socket.emit("SOCKET_TEST_MODE", testMode);
}


let serverRatio = 0;
let totalServers = 0;

function updateServerHeartbeat(heartBeat, timeoutFlag, lastTimeoutHeartBeat) {

  if (!initializeComplete) return;

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

  // VIEWERS ==========================

  var viewerRatio = 0;

  if (heartBeat.entity) {
    viewerRatio = heartBeat.entity.viewer.connected / heartBeat.entity.viewer.connectedMax;
  }

  viewersBar.animate(viewerRatio);

  if (100 * viewerRatio >= ALERT_LIMIT_PERCENT) {
    viewersBar.path.setAttribute('stroke', endColor);
  } else if (100 * viewerRatio >= WARN_LIMIT_PERCENT) {
    viewersBar.path.setAttribute('stroke', midColor);
  } else {
    viewersBar.path.setAttribute('stroke', startColor);
  }

  if (heartBeat.entity) {
    viewersBarText.innerHTML = (heartBeat.entity.viewer.connected) + ' VIEWERS | ' 
    + (heartBeat.entity.viewer.connectedMax) + ' MAX | ' 
    + moment(heartBeat.entity.viewer.connectedMaxTime).format(defaultDateTimeFormat);
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

  if (heartBeat.servers && serverTableBody) {

    while (serverTableBody.childNodes.length >= 1) {
      serverTableBody.removeChild(serverTableBody.firstChild);
    }

    async.forEach(heartBeat.servers, function(serverSocketEntry, cb){

      const serverSocketId = serverSocketEntry[0];
      const currentServer = serverSocketEntry[1];

      serverTypeHashMap.set(currentServer.user.type, currentServer);
      serverSocketHashMap.set(serverSocketId, currentServer);

      tableCreateRow(
        serverTableBody, 
        false, 
        [
          currentServer.user.nodeId, 
          currentServer.user.type, 
          serverSocketId, 
          moment(currentServer.timeStamp).format(defaultDateTimeFormat), 
          msToTime(moment().diff(moment(currentServer.timeStamp)))
        ]
      ); // 2nd arg is headerFlag

      cb();

    }, function(err){


      totalServers = serverSocketHashMap.size;

      serverRatio = totalServers / 6;

      serversBarText.innerHTML = totalServers + ' SERVERS | 6 MAX | ' 
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
    tableCreateRow(heatbeatTable, false, ['*** SERVER TIMEOUT ***', (msToTime(Date.now() - heartBeat.timeStamp)) + ' AGO']);
    var x = heatbeatTable.getElementsByTagName("td");
    x[2].style.color = "white";
    x[2].style.backgroundColor = "red";
  } else if (lastTimeoutHeartBeat) {

    tableCreateRow(
      heatbeatTable,
      false, [
        '* SERVER TIMEOUT *',
        getTimeStamp(lastTimeoutHeartBeat.timeStamp),
        msToTime(Date.now() - lastTimeoutHeartBeat.timeStamp) + ' AGO'
      ]);

    var x = heatbeatTable.getElementsByTagName("td");
    x[2].style.color = "white";
    x[2].style.backgroundColor = '#880000';
  }

  tableCreateRow(heatbeatTable, false, ['SERVER TIME', getTimeStamp(heartBeat.serverTime)]);
  tableCreateRow(heatbeatTable, false, ['SERVER UPTIME', msToTime(heartBeat.upTime)]);
  tableCreateRow(heatbeatTable, false, ['APP START TIME', getTimeStamp(heartBeat.startTime)]);
  tableCreateRow(heatbeatTable, false, ['APP RUNTIME', msToTime(heartBeat.runTime)]);

  heartbeatElement = document.getElementById("admins_ip_list");

  while (heartbeatElement.childNodes.length >= 1) {
    heartbeatElement.removeChild(heartbeatElement.firstChild);
  }

  heartbeatElement.appendChild(heartbeatElement.ownerDocument
    .createTextNode(numberAdminIpAddresses + " ADMINS UNIQUE IP " + " | " + heartBeat.numberAdmins + " CONNECTED")
  );

  heartbeatElement = document.getElementById("viewers_ip_list");
  while (heartbeatElement.childNodes.length >= 1) {
    heartbeatElement.removeChild(heartbeatElement.firstChild);
  }
  heartbeatElement.appendChild(heartbeatElement.ownerDocument
    .createTextNode(numberViewerIpAddresses + " VIEWER UNIQUE IP " + " | " + heartBeat.numberViewers + " VIEWERS")
  );
}

function initialize(callback){

  console.debug("INITIALIZE...");

  serverCheckTimeout;

  // initTimelineData(MAX_TIMELINE, function(){
    initBars(function(){
      callback();
    });
  // });


}