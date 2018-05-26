
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
var ALERT_LIMIT_PERCENT = 95

var ONE_MB = 1024 * 1024;
var ONE_GB = ONE_MB * 1024;
var TIMELINE_WIDTH = 600;
var TIMELINE_HEIGHT = 250;
var MAX_TIMELINE = 600;

var tpmData =[];
var wpmData =[];
var trpmData =[];
var tLimitData = [];


requirejs(["https://d3js.org/d3.v4.min.js"], function(d3Loaded) {
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

var serverHeartbeatElement;

var viewerIpHashMap = new HashMap();
var viewerSessionHashMap = new HashMap();
var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();
var userIpHashMap = new HashMap();
var userSessionHashMap = new HashMap();
var utilIpHashMap = new HashMap();
var utilSessionHashMap = new HashMap();

var utilIpHashMapKeys = [];
var userIpHashMapKeys = [];
var userSessionHashMapKeys = [];
var adminIpHashMapKeys = [];
var adminSocketIdHashMapKeys = [];

var randomIntFromInterval = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

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
var userIpTableBody;
var userSessionTableBody;
var showConnectedUsers = true;
var showDisconnectedUsers = false;
var showIpUsers = true;
var showBotUsers = true;

var numberAdminIpAddresses = adminIpHashMap.count();
var numberAdminsConnected = 0;

var showConnectedAdmins = true;
var showDisconnectedAdmins = false;
var showIpAdmins = true;
var numberUserSessions = 0;
var numberUserIpAddresses = userIpHashMap.count();

var userConnectedColor = "#00aa00";
var userDisconnectedColor = "#aa0000";
var showConnectedViewers = true;
var showDisconnectedViewers = false;
var showIpViewers = true;
var showBotViewers = true;

var numberUtilSessions = 0;
var numberUtilIpAddresses = 0;

var viewerIpHashMapKeys = [];
var viewerSessionHashMapKeys = [];

var numberViewerSessions = 0;
var numberViewerIpAddresses = viewerIpHashMap.count();

var viewerConnectedColor = "#00aa00";
var viewerDisconnectedColor = "#aa0000";
var showConnectedViewers = true;
var showDisconnectedViewers = false;
var viewerIpTableBody;
var viewerSessionTableBody;
var viewerSessionTableHead;

var userIpTableHead;
var userSessionTableHead;

var utilConnectedColor = "#00aa00";
var utilDisconnectedColor = "#aa0000";
var showConnectedUtils = true;
var showDisconnectedUtils = false;
var showIpUtils = true;

var deltaTweetsMax = 1;

var utilSessionTableHead;
var utilIpTableHead;
var utilIpTableBody;
var utilSessionTableBody;

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

var usersBar;
var usersBarDiv;
var usersBarText;

var utilsBar;
var utilsBarDiv;
var utilsBarText;

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

  // USERS ===============================

  userSessionTableHead = document.getElementById('user_session_table_head');
  userSessionTableBody = document.getElementById('user_session_table_body');

  userIpTableHead = document.getElementById('user_ip_table_head');
  userIpTableBody = document.getElementById('user_ip_table_body');

  usersBarDiv = document.getElementById('users-bar');
  usersBar = new ProgressBar.Line(usersBarDiv, { duration: 100 });
  usersBar.animate(0);
  usersBarText = document.getElementById('users-bar-text');

  // VIEWERS ===============================

  viewerSessionTableHead = document.getElementById('viewer_session_table_head');
  viewerSessionTableBody = document.getElementById('viewer_session_table_body');

  viewerIpTableHead = document.getElementById('viewer_ip_table_head');
  viewerIpTableBody = document.getElementById('viewer_ip_table_body');

  viewersBarDiv = document.getElementById('viewers-bar');
  viewersBar = new ProgressBar.Line(viewersBarDiv, { duration: 100 });
  viewersBar.animate(0);
  viewersBarText = document.getElementById('viewers-bar-text');

  // UTILS ===============================

  numberUtilSessions = 0;
  numberUtilIpAddresses = utilIpHashMap.count();

  utilSessionTableHead = document.getElementById('util_session_table_head');
  utilSessionTableBody = document.getElementById('util_session_table_body');

  utilIpTableHead = document.getElementById('util_ip_table_head');
  utilIpTableBody = document.getElementById('util_ip_table_body');

  utilsBarDiv = document.getElementById('utils-bar');
  utilsBar = new ProgressBar.Line(utilsBarDiv, { duration: 100 });
  utilsBar.animate(0);
  utilsBarText = document.getElementById('utils-bar-text');

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

  tableCreateRow(userIpTableHead, options, ['USERS', 'IP', 'DOMAIN', 'LAST SEEN', 'AGO', 'SESSIONS']); // 2nd arg is headerFlag
  tableCreateRow(userSessionTableHead, options, ['SESSIONS', 'IP', 'DOMAIN', 'USER', 'SESSION', 'CONNECT', 'DISCONNECT', 'TIME CONNECTED']); // 2nd arg is headerFlag
  tableCreateRow(viewerIpTableHead, options, ['VIEWERS', 'IP', 'DOMAIN', 'LAST SEEN', 'AGO', 'SESSIONS']); // 2nd arg is headerFlag
  tableCreateRow(viewerSessionTableHead, options, ['SESSIONS', 'IP', 'DOMAIN', 'USER', 'SESSION', 'CONNECT', 'DISCONNECT', 'TIME CONNECTED']); // 2nd arg is headerFlag
  tableCreateRow(utilIpTableHead, options, ['UTILS', 'IP', 'DOMAIN', 'LAST SEEN', 'AGO', 'SESSIONS']); // 2nd arg is headerFlag
  tableCreateRow(utilSessionTableHead, options, ['SESSIONS', 'IP', 'DOMAIN', 'USER', 'SESSION', 'CONNECT', 'DISCONNECT', 'TIME CONNECTED']); // 2nd arg is headerFlag

  callback();
}

var heartBeat = {};
var lastTimeoutHeartBeat = null;

var hbIndex = 0;
// var tweetsPerMinServer;
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
      // console.debug("ignore: " + options.ignore);
      var tempObj = obj;
      var i = 0;
      var ignoreWord;
      for (i = 0; i < options.ignore.length; i++) {
        ignoreWord = options.ignore[i];
        if (tempObj.hasOwnProperty(ignoreWord)) {
          // console.error("delete: " + ignoreWord);
          tempObj[ignoreWord] = [];
        }
      }
      // options.ignore.forEach(function(ignoreWord) {
      // });
      if (i == options.ignore.length) return JSON.stringify(tempObj, null, 3);
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

  userIpHashMap.clear();
  userSessionHashMap.clear();

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

function requestSessions(reqSessionsOptions) {
  console.log("TX REQ ADMIN SESSION\n" + JSON.stringify(reqSessionsOptions, null, 3));
  socket.emit('REQ_ADMIN_SESSION', reqSessionsOptions);

  console.log("TX REQ USER SESSION\n" + JSON.stringify(reqSessionsOptions, null, 3));
  socket.emit('REQ_USER_SESSION', reqSessionsOptions);

  console.log("TX REQ VIEWER SESSION\n" + JSON.stringify(reqSessionsOptions, null, 3));
  socket.emit('REQ_VIEWER_SESSION', reqSessionsOptions);

  console.log("TX REQ UTIL SESSION\n" + JSON.stringify(reqSessionsOptions, null, 3));
  socket.emit('REQ_UTIL_SESSION', reqSessionsOptions);
}

var MAX_SESSION_AGE = 60000;
var dateNow = moment().valueOf();

function ageHashMapEntries(hm, callback){

  dateNow = moment().valueOf();

  var keys = hm.keys();

  async.each(keys, function(sessionId, cb) {

    var sessionObj = hm.get(sessionId);

    if (sessionObj.seen === undefined){
      sessionObj.seen = dateNow;
      console.debug("NEW SESSION | " + sessionId
        + " | " + sessionObj.userId
      );
      hm.set(sessionId, sessionObj);
    }
    else if ((dateNow - sessionObj.seen) > MAX_SESSION_AGE){
      console.debug("XXX SESSION | " + sessionId
        + " | " + sessionObj.userId
      );
      hm.remove(sessionId);
    }

    cb();

  }, function(err) {
    callback();
  });
  
}

setInterval(function() {
  currentTime = getTimeNow();
  if (serverConnected && initializeComplete) {
    ageHashMapEntries(utilSessionHashMap, function(){
      updateAdminConnect();
      updateUserConnect();
    })
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
    // console.debug("SESSION_KEEPALIVE");
  }
}, 10000);


socket.on('connect', function() {
  serverConnected = true;
  console.log("\n===== ADMIN SERVER CONNECTED =====\n" + getTimeStamp());
  // if (initializeComplete && !sentAdminReady) {
  //   serverClear();
  //   socket.emit("ADMIN_READY", mainAdminObj);
  //   console.log("TX ADMIN_READY\n" + jsonPrint(mainAdminObj));
  //   sentAdminReady = true;
  // }
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

socket.on('USER IP', function(rxIpObj) {
  var ipObj = JSON.parse(rxIpObj);
  console.log("RXCD USER IP  " + ipObj.ip + " | " + ipObj.domain);
  userIpHashMap.set(ipObj.ip, ipObj);
  numberUserIpAddresses = userIpHashMap.count();
  userIpHashMapKeys = userIpHashMap.keys();
  userIpHashMapKeys.sort();
});

socket.on('VIEWER IP', function(rxIpObj) {
  var ipObj = JSON.parse(rxIpObj);
  console.debug("RXCD VIEWER IP  " + ipObj.ip + " | " + ipObj.domain);
  viewerIpHashMap.set(ipObj.ip, ipObj);
  numberViewerIpAddresses = viewerIpHashMap.count();
  viewerIpHashMapKeys = viewerIpHashMap.keys();
  viewerIpHashMapKeys.sort();
});

socket.on('UTIL IP', function(rxIpObj) {
  var ipObj = JSON.parse(rxIpObj);
  console.log("RXCD UTIL IP  " + ipObj.ip + " | " + ipObj.domain);
  utilIpHashMap.set(ipObj.ip, ipObj);
  numberUtilIpAddresses = utilIpHashMap.count();
  utilIpHashMapKeys = utilIpHashMap.keys();
  utilIpHashMapKeys.sort();
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

socket.on('USER_SESSION', function(userSessionObj) {

  // console.log("userSessionObj\n" + jsonPrint(userSessionObj, {
  //     ignore: ['wordChain', 'sessions']
  // }));

  console.log("RX USER SESSION: " + userSessionObj.sessionId + " | UID: " + userSessionObj.userId);

  userIpHashMap.set(userSessionObj.ip, userSessionObj);
  userIpHashMapKeys = userIpHashMap.keys();
  userIpHashMapKeys.sort();
  numberUserIpAddresses = userIpHashMapKeys.length;

  userSessionHashMap.set(userSessionObj.sessionId, userSessionObj);
  userSessionHashMapKeys = userSessionHashMap.keys();
  userSessionHashMapKeys.sort();
  numberUserSessions = userSessionHashMapKeys.length;

  updateUserConnect(userSessionObj, null);
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

var utilSessionQueue = [];
socket.on('UTIL_SESSION', function(rxSession) {
  utilSessionQueue.push(rxSession);
});

var utilSessionQueueReady = true;
setInterval(function(){

  if (utilSessionQueueReady && (utilSessionQueue.length > 0)){

    var utilSessionObj = utilSessionQueue.shift();

    utilIpHashMap.set(utilSessionObj.ip, utilSessionObj);
    numberUtilIpAddresses = utilIpHashMapKeys.length;
    utilSessionHashMap.set(utilSessionObj.sessionId, utilSessionObj);
    numberUtilSessions = utilSessionHashMap.keys().length;

    console.log("RX UTIL SESSION[" + utilSessionHashMap.keys().length + "]: " + utilSessionObj.sessionId 
      + " | C: " + utilSessionObj.connected
      + " | UID: " + utilSessionObj.userId
      );


    if (utilSessionObj.userId
      && utilSessionObj.connected 
      && utilSessionObj.userId.match(/TSS_/g)) {
      console.info("UTIL SERVER CONNECTED: " + utilSessionObj.userId);
      // tweetsPerMinServer = utilSessionObj.userId;
    } 
    else if (utilSessionObj.userId
      && !utilSessionObj.connected 
      && utilSessionObj.userId.match(/TSS_/g)) {
      console.info("UTIL SERVER DISCONNECTED: " + utilSessionObj.userId);
      // tweetsPerMinServer = false;
      tweetsPerMin = 0;
    }

    updateUtilConnect(utilSessionObj, function(){
      utilSessionQueueReady = true;
    });
  }

}, 100);


socket.on("SESSION_DELETE", function(sessionId) {
  // console.log("sessionObject\" + jsonPrint(sessionObject));
  console.debug("> RX DEL SESS | " + sessionId);
  if (utilSessionHashMap.has(sessionId)){
    console.info("* UTIL HM HIT " + sessionId);
  } 
  if (userSessionHashMap.has(sessionId)){
    console.info("* USER HM HIT " + sessionId);
  } 
});

socket.on('TWITTER_TOPTERM_1MIN', function(top10array) {
  console.debug("TWITTER_TOPTERM_1MIN\n" + jsonPrint(top10array));
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
      // tweetsPerMin = heartBeat.twitter.tweetsPerMinute;
      tweetsPerMin = heartBeat.twitter.tweetsPerMin;
      tweetsPerMinMax = heartBeat.twitter.maxTweetsPerMin;
      tweetsPerMinMaxTime = heartBeat.twitter.maxTweetsPerMinTime;

      twitterLimit = heartBeat.twitter.twitterLimit;
      twitterLimitMax = heartBeat.twitter.twitterLimitMax;
      twitterLimitMaxTime = heartBeat.twitter.twitterLimitMaxTime;
    }

    if (heartBeat.deltaResponsesReceived > deltaResponsesMax) {deltaResponsesMax = heartBeat.deltaResponsesReceived;}

    if (heartBeat.wordsPerMinute > wordsPerMinuteMax) {wordsPerMinuteMax = heartBeat.wordsPerMinute;}

    heartBeatTimeoutFlag = false;

    updateRawText(jsonPrint(heartBeat));
    updateUserConnect(null, function(){
      heartBeatQueueReady = true;
    });
    updateViewerConnect(null, null);
    updateUtilConnect(null, null);
  }
}, 1000);

var serverCheckTimeout = setInterval(function() {
  numberAdminIpAddresses = adminIpHashMap.count();
  numberUserIpAddresses = userIpHashMap.count();
  numberViewerIpAddresses = viewerIpHashMap.count();
  numberUtilIpAddresses = utilIpHashMap.count();

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

// function setWordCacheTtl() {
//   var newWordCacheTtl = document.getElementById("setWordCacheTtl").value;
//   console.log("SET WORD CACHE TTL: " + newWordCacheTtl);
//   socket.emit("SET_WORD_CACHE_TTL", newWordCacheTtl);
// }

function toggleTestMode() {
  testMode = !testMode;
  console.log("SOCKET_TEST_MODE: " + testMode);
  socket.emit("SOCKET_TEST_MODE", testMode);
}

function toggleIpAdmins() {
  updateAdminConnect({
    showIp: "toggle"
  });
}

function toggleConnectedAdmins() {
  updateAdminConnect({
    showConnected: "toggle"
  });
}

function toggleDisconnectedAdmins() {
  updateAdminConnect({
    showDisconnected: "toggle"
  });
}

function toggleIpUsers() {
  updateUserConnect({showIp: "toggle"}, null);
}

function toggleConnectedUsers() {
  updateUserConnect({ showConnected: "toggle" }, null);
}

function toggleDisconnectedUsers() {
  updateUserConnect({ showDisconnected: "toggle" }, null);
}

function toggleHideBotUsers() {
  updateUserConnect({ showBotUsers: "toggle" }, null);
}

function toggleIpViewers() {
  updateViewerConnect({ showIp: "toggle" },  null);
}

function toggleConnectedViewers() {
  updateViewerConnect({ showConnected: "toggle" });
}

function toggleDisconnectedViewers() {
  updateViewerConnect({
    showDisconnected: "toggle"
  });
}

function toggleHideBotViewers() {
  updateViewerConnect({ showBotViewers: "toggle" }, null);
}

function toggleIpUtils() {
  updateUtilConnect({ showIp: "toggle" }, null);
}

function toggleConnectedUtils() {
  updateUtilConnect({ showConnected: "toggle"}, null);
}

function toggleDisconnectedUtils() {
  updateUtilConnect({ showDisconnected: "toggle" }, null);
}

function updateAdminConnect(req) {

  numberAdminsConnected = 0;

  if (req === undefined) {} else {
    if (req.showConnected == 'toggle') {
      showConnectedAdmins = !showConnectedAdmins;
    }
    if (req.showDisconnected == 'toggle') {
      showDisconnectedAdmins = !showDisconnectedAdmins;
    }
    if (req.showIp == 'toggle') {
      showIpAdmins = !showIpAdmins;
    }
  }

  var adminIpListElement = document.getElementById("admin_ip_list");
  var adminSessionListElement = document.getElementById("admin_session_list");

  while (adminIpListElement.childNodes.length >= 1) {
    adminIpListElement.removeChild(adminIpListElement.firstChild);
  }

  while (adminSessionListElement.childNodes.length >= 1) {
    adminSessionListElement.removeChild(adminSessionListElement.firstChild);
  }

  if (showIpAdmins) {
    adminIpHashMap.forEach(function(value, key) {
      var adminIpListItem = document.createElement('li');
      adminIpListItem.style.color = userConnectedColor;

      adminIpListElement.appendChild(adminIpListItem);
      adminIpListItem.innerHTML = adminIpListItem.innerHTML + (
        key + ' | ' + value.domain + ' | LAST SEEN: ' + getTimeStamp(value.lastSeen) + ' | CONNECTIONS: ' + Object.keys(value.sessions).length
      );
    });
  }

  if (showConnectedAdmins) {
    adminSocketIdHashMap.forEach(function(value, key) {

      // console.log("showConnectedAdmins\n" + JSON.stringify(value));

      if (value.connected == true) {

        var adminSessionListItem = document.createElement('li');
        adminSessionListItem.style.color = userConnectedColor;
        adminSessionListElement.appendChild(adminSessionListItem);
        adminSessionListItem.innerHTML = adminSessionListItem.innerHTML + (value.ip + ' | ' + value.domain + ' | ' + key + ' | CONNECT: ' + getTimeStamp(value.connectTime) + ' | DISCONNECT: ' + getTimeStamp(value.disconnectTime) + ' | CONNECT TIME: ' + msToTime(heartBeat.timeStamp - value.connectTime));
      }
    });
  }

  if (showDisconnectedAdmins) {
    adminSocketIdHashMap.forEach(function(value, key) {
      if (value.connected == false) {

        var adminSessionListItem = document.createElement('li');
        adminSessionListItem.style.color = userDisconnectedColor;
        var timeConnected = value.disconnectTime - value.connectTime;
        adminSessionListElement.appendChild(adminSessionListItem);
        adminSessionListItem.innerHTML = adminSessionListItem.innerHTML + (value.ip + ' | ' + value.domain + ' | ' + key + ' | CONNECT: ' + getTimeStamp(value.connectTime) + ' | DISCONNECT: ' + getTimeStamp(value.disconnectTime) + ' | CONNECT TIME: ' + msToTime(value.disconnectTime - value.connectTime));
      }
    });
  }
}

function updateUserConnect(req, callback) {

  if (!initializeComplete) return;

  var userIpTableBodyOptions = {
    headerFlag: false,
    tdTextColor: '#BBBBBB',
    backgroundColor: 'black'
  };

  var userSessionTableBodyOptions = {
    headerFlag: false,
    tdTextColor: '#BBBBBB',
    backgroundColor: 'black'
  };

  while (userIpTableBody && (userIpTableBody.childNodes.length > 1)) {
    userIpTableBody.removeChild(userIpTableBody.lastChild);
  }

  while (userSessionTableBody && (userSessionTableBody.childNodes.length > 1)) {
    userSessionTableBody.removeChild(userSessionTableBody.lastChild);
  }

  if (req) {
    if (req.showConnected == 'toggle') {
      showConnectedUsers = !showConnectedUsers;
      console.log("showConnectedUsers: " + showConnectedUsers);
    }
    if (req.showDisconnected == 'toggle') {
      showDisconnectedUsers = !showDisconnectedUsers;
      console.log("showDisconnectedUsers: " + showDisconnectedUsers);
    }
    if (req.showIp == 'toggle') {
      showIpUsers = !showIpUsers;
      console.log("showIpUsers " + showIpUsers);
    }
    if (req.showBotUsers == 'toggle') {
      showBotUsers = !showBotUsers;
      console.log("showBotUsers " + showBotUsers);
    }
  }

  if (showIpUsers) {

    var numberUniqueUsers = 0;
    var elapsedSinceLastSeen = 0;
    var key;
    var value = {};

    var ipHmKeys = userIpHashMap.keys();

    for (var i = 0; i < ipHmKeys.length; i++) {

      key = ipHmKeys[i];
      value = userIpHashMap.get(ipHmKeys[i]);

      if (!showBotUsers && ((value.domain.indexOf("googlebot") >= 0))) {

      } 
      else {

        userIpTableBodyOptions.tdTextColor = userConnectedColor;

        numberUniqueUsers++;

        if (value.connected == true) {
          elapsedSinceLastSeen = 0;
        } else if (value.lastSeen > currentTime) {
          elapsedSinceLastSeen = 0;
        } else {
          elapsedSinceLastSeen = heartBeat.timeStamp - value.lastSeen;
        }

        tableCreateRow(userIpTableBody, userIpTableBodyOptions, [
          numberUniqueUsers,
          key,
          value.domain,
          getTimeStamp(value.lastSeen),
          msToTime(elapsedSinceLastSeen),
          // value.sessions.length
        ]);
      }
    }
  }

  if (showConnectedUsers) {

    userSessionTableBodyOptions.tdTextColor = userConnectedColor;

    var numberConnected = 0;
    var connectTime = 0;
    var sessionId;
    var sessionObj = {};

    var hmKeys = userSessionHashMap.keys();

    for (var j = 0; j < hmKeys.length; j++) {

      sessionId = hmKeys[j];
      sessionObj = userSessionHashMap.get(sessionId);

      if (sessionObj.referer === undefined) {
        sessionObj.referer = '';
      }


      if (!showBotUsers && ((sessionObj.domain.indexOf("googlebot") >= 0))) {

      } 
      else {
        if (sessionObj.connected == true) {

          numberConnected++;

          if (sessionObj.domain.indexOf("googlebot") >= 0) {
            userSessionTableBodyOptions.tdTextColor = testUserConnectedColor;
          } else if (sessionObj.domain.indexOf("googleusercontent") >= 0) {
            userSessionTableBodyOptions.tdTextColor = testUserConnectedColor;
          } else {
            userSessionTableBodyOptions.tdTextColor = userConnectedColor;
          }

          connectTime = heartBeat.timeStamp - sessionObj.connectTime;

          tableCreateRow(userSessionTableBody, userSessionTableBodyOptions, [
            numberConnected,
            sessionObj.ip,
            sessionObj.domain,
            sessionObj.userId,
            sessionId,
            getTimeStamp(sessionObj.connectTime),
            '',
            msToTime(connectTime)
          ]);
        }
      }
    }
  }

  if (showDisconnectedUsers) {

    userSessionTableBodyOptions.textColor = userDisconnectedColor;

    var numberDisconnected = 0;
    var connectedTime = 0;

    for (var k = 0; k < userSessionHashMapKeys.length; k++) {

      var key = userSessionHashMapKeys[k];
      var value = userSessionHashMap.get(userSessionHashMapKeys[k]);

      if (value.connected == false) {

        numberDisconnected++;

        connectedTime = value.disconnectTime - value.connectTime;

        tableCreateRow(userSessionTableBody, userSessionTableBodyOptions, [
          numberDisconnected,
          value.ip,
          value.domain,
          value.userId,
          key,
          getTimeStamp(value.connectTime),
          getTimeStamp(value.disconnectTime),
          msToTime(connectedTime)
        ]);

      }
    }
  }

  if (callback) { callback(); }
}

function updateViewerConnect(req, callback) {

  var viewerIpTableBodyOptions = {
    headerFlag: false,
    textColor: '#BBBBBB',
    backgroundColor: 'black'
  };

  var viewerSessionTableBodyOptions = {
    headerFlag: false,
    textColor: '#BBBBBB',
    backgroundColor: 'black'
  };

  while (viewerIpTableBody && (viewerIpTableBody.childNodes.length > 1)) {
    viewerIpTableBody.removeChild(viewerIpTableBody.lastChild);
  }

  while (viewerSessionTableBody && (viewerSessionTableBody.childNodes.length > 1)) {
    viewerSessionTableBody.removeChild(viewerSessionTableBody.lastChild);
  }

  if (req) {
    if (req.showConnected == 'toggle') {
      showConnectedViewers = !showConnectedViewers;
      console.log("showConnectedViewers: " + showConnectedViewers);
    }
    if (req.showDisconnected == 'toggle') {
      showDisconnectedViewers = !showDisconnectedViewers;
      console.log("showDisconnectedViewers: " + showDisconnectedViewers);
    }
    if (req.showIp == 'toggle') {
      showIpViewers = !showIpViewers;
      console.log("showIpViewers " + showIpViewers);
    }
    if (req.showBotViewers == 'toggle') {
      showBotViewers = !showBotViewers;
      console.log("showBotViewers " + showBotViewers);
    }
  }

  if (showIpViewers) {

    var numberUniqueViewers = 0;
    var elapsedSinceLastSeen = 0;
    var key;
    var value = {};

    for (var i = 0; i < viewerIpHashMapKeys.length; i++) {

      key = viewerIpHashMapKeys[i];
      value = viewerIpHashMap.get(viewerIpHashMapKeys[i]);

      if (!showBotViewers && ((value.domain.indexOf("googlebot") >= 0))) {
      } 
      else {

        viewerIpTableBodyOptions.textColor = viewerConnectedColor;

        numberUniqueViewers++;

        if (value.connected == true) {
          elapsedSinceLastSeen = 0;
        } 
        else if (value.lastSeen > currentTime) {
          elapsedSinceLastSeen = 0;
        } 
        else {
          elapsedSinceLastSeen = heartBeat.timeStamp - value.lastSeen;
        }

        tableCreateRow(viewerIpTableBody, viewerIpTableBodyOptions, [
          numberUniqueViewers,
          key,
          value.domain,
          getTimeStamp(value.lastSeen),
          msToTime(elapsedSinceLastSeen),
          // value.sessions.length
        ]);
      }
    }
  }

  if (showConnectedViewers) {

    viewerSessionTableBodyOptions.tdTextColor = viewerConnectedColor;

    var numberConnected = 0;
    var connectTime = 0;
    var sessionId;
    var sessionObj = {};


    for (var j = 0; j < viewerSessionHashMapKeys.length; j++) {

      sessionId = viewerSessionHashMapKeys[j];
      sessionObj = viewerSessionHashMap.get(viewerSessionHashMapKeys[j]);

      if (sessionObj.referer === undefined) {
        sessionObj.referer = '';
      }


      if (!showBotViewers && ((sessionObj.domain.indexOf("googlebot") >= 0))) {

      } 
      else {
        if (sessionObj.connected == true) {

          numberConnected++;

          if (sessionObj.domain.indexOf("googlebot") >= 0) {
            viewerSessionTableBodyOptions.textColor = testViewerConnectedColor;
          } else if (sessionObj.domain.indexOf("googleviewercontent") >= 0) {
            viewerSessionTableBodyOptions.textColor = testViewerConnectedColor;
          } else {
            viewerSessionTableBodyOptions.textColor = viewerConnectedColor;
          }

          connectTime = heartBeat.timeStamp - sessionObj.connectTime;

          tableCreateRow(viewerSessionTableBody, viewerSessionTableBodyOptions, [
            numberConnected,
            sessionObj.ip,
            sessionObj.domain,
            (sessionObj.viewerId || sessionObj.userId),
            sessionId,
            getTimeStamp(sessionObj.connectTime),
            '',
            msToTime(connectTime)
          ]);
        }
      }
    }
  }

  if (showDisconnectedViewers) {

    viewerSessionTableBodyOptions.tdTextColor = viewerDisconnectedColor;

    var numberDisconnected = 0;
    var connectedTime = 0;

    for (var k = 0; k < viewerSessionHashMapKeys.length; k++) {

      var key = viewerSessionHashMapKeys[k];
      var value = viewerSessionHashMap.get(viewerSessionHashMapKeys[k]);

      if (value.connected == false) {

        numberDisconnected++;

        connectedTime = value.disconnectTime - value.connectTime;

        tableCreateRow(viewerSessionTableBody, viewerSessionTableBodyOptions, [
          numberDisconnected,
          value.ip,
          value.domain,
          value.userId,
          key,
          getTimeStamp(value.connectTime),
          getTimeStamp(value.disconnectTime),
          msToTime(connectedTime)
        ]);

      }
    }
  }
  if (callback) { callback(); }
}

function updateUtilConnect(req, callback) {

  if (!initializeComplete) return;

  var keys = utilSessionHashMap.keys();

  var utilIpTableBodyOptions = {
    headerFlag: false,
    textColor: '#BBBBBB',
    backgroundColor: 'black'
  };

  var utilSessionTableBodyOptions = {
    headerFlag: false,
    textColor: '#BBBBBB',
    backgroundColor: 'black'
  };

  while (utilIpTableBody && (utilIpTableBody.childNodes.length > 1)) {
    utilIpTableBody.removeChild(utilIpTableBody.lastChild);
  }

  while (utilSessionTableBody && (utilSessionTableBody.childNodes.length > 1)) {
    utilSessionTableBody.removeChild(utilSessionTableBody.lastChild);
  }

  if (req) {
    if (req.showConnected == 'toggle') {
      showConnectedUtils = !showConnectedUtils;
      console.log("showConnectedUtils: " + showConnectedUtils);
    }
    if (req.showDisconnected == 'toggle') {
      showDisconnectedUtils = !showDisconnectedUtils;
      console.log("showDisconnectedUtils: " + showDisconnectedUtils);
    }
    if (req.showIp == 'toggle') {
      showIpUtils = !showIpUtils;
      console.log("showIpUtils " + showIpUtils);
    }
  }

  if (showIpUtils) {

    var numberUniqueUtils = 0;
    var elapsedSinceLastSeen = 0;
    var key;
    var value = {};

    for (var i = 0; i < utilIpHashMapKeys.length; i++) {

      key = utilIpHashMapKeys[i];
      value = utilIpHashMap.get(utilIpHashMapKeys[i]);

      utilIpTableBodyOptions.textColor = utilConnectedColor;

      numberUniqueUtils++;

      if (value.connected == true) {
        elapsedSinceLastSeen = 0;
      } else if (value.lastSeen > currentTime) {
        elapsedSinceLastSeen = 0;
      } else {
        elapsedSinceLastSeen = heartBeat.timeStamp - value.lastSeen;
      }

      tableCreateRow(utilIpTableBody, utilIpTableBodyOptions, [
        numberUniqueUtils,
        key,
        value.domain,
        getTimeStamp(value.lastSeen),
        msToTime(elapsedSinceLastSeen),
        // value.sessions.length
      ]);
    }
  }

  if (showConnectedUtils) {

    utilSessionTableBodyOptions.textColor = utilConnectedColor;

    var numberConnected = 0;
    var connectTime = 0;
    var sessionId;
    var sessionObj = {};

    for (var j = 0; j < keys.length; j++) {

      sessionId = keys[j];
      sessionObj = utilSessionHashMap.get(sessionId);

      if (sessionObj.referer === undefined) {
        sessionObj.referer = '';
      }


      if (sessionObj.connected == true) {

        numberConnected++;

        utilSessionTableBodyOptions.textColor = utilConnectedColor;

        // console.log("sessionId: " + sessionId + "\n" + jsonPrint(sessionObj));
        // console.log("heartBeat.timeStamp: " + heartBeat.timeStamp + " | " + sessionObj.connectTime);
        connectTime = heartBeat.timeStamp - sessionObj.connectTime;

        tableCreateRow(utilSessionTableBody, utilSessionTableBodyOptions, [
          numberConnected,
          sessionObj.ip,
          sessionObj.domain,
          sessionObj.userId,
          sessionId,
          getTimeStamp(sessionObj.connectTime),
          '',
          msToTime(connectTime)
        ]);
      } else {
        delete heartBeat.utilities[sessionObj.userId];
      }
    }
  }

  if (showDisconnectedUtils) {

    utilSessionTableBodyOptions.textColor = utilDisconnectedColor;

    var numberDisconnected = 0;
    var connectedTime = 0;

    for (var k = 0; k < keys.length; k++) {

      var key = keys[k];
      var value = utilSessionHashMap.get(key);

      if (value.connected == false) {

        numberDisconnected++;

        connectedTime = value.disconnectTime - value.connectTime;

        tableCreateRow(utilSessionTableBody, utilSessionTableBodyOptions, [
          numberDisconnected,
          value.ip,
          value.domain,
          value.userId,
          key,
          getTimeStamp(value.connectTime),
          getTimeStamp(value.disconnectTime),
          msToTime(connectedTime)
        ]);
      }
    }
  }
  if (callback) { callback(); }
}

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


  // SESSION CACHE ==========================

 //  var sessionCacheKeysRatio = 0;
  
 //  if (heartBeat.caches) {
 //    sessionCacheKeysRatio = heartBeat.caches.sessionCache.stats.keys / heartBeat.caches.sessionCache.stats.keysMax;
 //  }

 //  sessionCacheBar.animate(sessionCacheKeysRatio);

 //  if (100 * sessionCacheKeysRatio >= ALERT_LIMIT_PERCENT) {
 //    sessionCacheBar.path.setAttribute('stroke', endColor);
 //  } else if (100 * sessionCacheKeysRatio >= WARN_LIMIT_PERCENT) {
 //    sessionCacheBar.path.setAttribute('stroke', midColor);
 //  } else {
 //    sessionCacheBar.path.setAttribute('stroke', startColor);
 //  }

 //  if (heartBeat.caches) {
 // sessionCacheBarText.innerHTML = (heartBeat.caches.sessionCache.stats.keys) + ' SESSIONS | ' 
 //  + heartBeat.caches.sessionCache.stats.keysMax + ' MAX | ' 
 //  + moment(heartBeat.caches.sessionCache.stats.keysMaxTime).format(defaultDateTimeFormat);
 //  }
 

  // WORD CACHE ==========================

  // var wordCacheKeysRatio = 0;

  // if (heartBeat.caches) {
  //   wordCacheKeysRatio = heartBeat.caches.wordCache.stats.keys / heartBeat.caches.wordCache.stats.keysMax;
  // }

  // wordCacheBar.animate(wordCacheKeysRatio);

  // if (100 * wordCacheKeysRatio >= ALERT_LIMIT_PERCENT) {
  //   wordCacheBar.path.setAttribute('stroke', endColor);
  // } else if (100 * wordCacheKeysRatio >= WARN_LIMIT_PERCENT) {
  //   wordCacheBar.path.setAttribute('stroke', midColor);
  // } else {
  //   wordCacheBar.path.setAttribute('stroke', startColor);
  // }

  // if (heartBeat.caches) {
  //   wordCacheBarText.innerHTML = (heartBeat.caches.wordCache.stats.keys) + ' WORDS | ' 
  //   + heartBeat.caches.wordCache.stats.keysMax + ' MAX | ' 
  //   + moment(heartBeat.caches.wordCache.stats.keysMaxTime).format(defaultDateTimeFormat);
  // }

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


  // USERS ==========================

  var userRatio = 0;

  if (heartBeat.entity) {
    userRatio = heartBeat.entity.user.connected / heartBeat.entity.user.connectedMax;
  }

  usersBar.animate(userRatio);

  if (100 * userRatio >= ALERT_LIMIT_PERCENT) {
    usersBar.path.setAttribute('stroke', endColor);
  } else if (100 * userRatio >= WARN_LIMIT_PERCENT) {
    usersBar.path.setAttribute('stroke', midColor);
  } else {
    usersBar.path.setAttribute('stroke', startColor);
  }

  if (heartBeat.entity) {
    usersBarText.innerHTML = (heartBeat.entity.user.connected) + ' USERS | ' 
    + (heartBeat.entity.user.connectedMax) + ' MAX | ' 
    + moment(heartBeat.entity.user.connectedMaxTime).format(defaultDateTimeFormat);
  }

  // UTILS=========================

  var utilRatio = 0;

  if (heartBeat.entity) {
    utilRatio = heartBeat.entity.util.connected / heartBeat.entity.util.connectedMax;
  }

  utilsBar.animate(utilRatio);

  if (100 * utilRatio >= ALERT_LIMIT_PERCENT) {
    utilsBar.path.setAttribute('stroke', endColor);
  } else if (100 * utilRatio >= WARN_LIMIT_PERCENT) {
    utilsBar.path.setAttribute('stroke', midColor);
  } else {
    utilsBar.path.setAttribute('stroke', startColor);
  }

  if (heartBeat.entity) {
    utilsBarText.innerHTML = (heartBeat.entity.util.connected) + ' UTILS | ' 
    + (heartBeat.entity.util.connectedMax) + ' MAX | ' 
    + moment(heartBeat.entity.util.connectedMaxTime).format(defaultDateTimeFormat);
  }


  // // WORDS =========================
  // wordsPerMinBar.animate(heartBeat.wordsPerMinute / heartBeat.maxWordsPerMin);

  // if (heartBeat.wordsPerMinute >=  0.01*ALERT_LIMIT_PERCENT * heartBeat.maxWordsPerMin) {
  //   wordsPerMinBar.path.setAttribute('stroke', endColor);
  // } 
  // else if (heartBeat.wordsPerMinute >= 0.01*WARN_LIMIT_PERCENT * heartBeat.maxWordsPerMin) {
  //   wordsPerMinBar.path.setAttribute('stroke', midColor);
  // } 
  // else {
  //   wordsPerMinBar.path.setAttribute('stroke', startColor);
  // }

  // wordsPerMinBarText.innerHTML = parseInt(heartBeat.wordsPerMinute) + ' WPM | ' 
  // + parseInt(heartBeat.maxWordsPerMin) + ' MAX' 
  // + ' | ' + moment(heartBeat.maxWordsPerMinTime).format(defaultDateTimeFormat);



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


  twitterLimitBar.animate(twitterLimit / twitterLimitMax);

  if (twitterLimit >= 0.01*ALERT_LIMIT_PERCENT * twitterLimitMax) {
    twitterLimitBar.path.setAttribute('stroke', endColor);
  } else if (twitterLimit >= 0.01*WARN_LIMIT_PERCENT * twitterLimitMax) {
    twitterLimitBar.path.setAttribute('stroke', midColor);
  } else {
    twitterLimitBar.path.setAttribute('stroke', startColor);
  }

  twitterLimitBarText.innerHTML = parseInt(twitterLimit) + ' LIMIT | ' + parseInt(twitterLimitMax) + ' MAX' + ' | ' + moment(twitterLimitMaxTime).format(defaultDateTimeFormat);


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

  // if (heartBeat.wordCacheStats !== undefined) {

  //   var hmr = (heartBeat.wordCacheStats.hits / (1 + heartBeat.wordCacheStats.misses));

  //   tableCreateRow(heatbeatTable, false, ['WORD CACHE',
  //     'TTL: ' + heartBeat.wordCacheTtl + ' | K: ' + heartBeat.wordCacheStats.keys + ' | H: ' + heartBeat.wordCacheStats.hits + ' | M: ' + heartBeat.wordCacheStats.misses + ' | HMR: ' + hmr.toFixed(2)
  //   ]);

  // }

  // tableCreateRow(heatbeatTable, false, ['TOTAL SESSIONS', heartBeat.db.totalSessions]);
  // if (heartBeat.db) { 
  //   if (heartBeat.db.totalWords) { tableCreateRow(heatbeatTable, false, ['TOTAL WORDS', heartBeat.db.totalWords]); }
  // }
  // tableCreateRow(heatbeatTable, false, ['TOTAL WORD UPDATES', heartBeat.db.wordsUpdated]);

  // tableCreateRow(heatbeatTable, false, ['QUEUES',
  //   'RX: ' + heartBeat.queues.rxWordQueue 
  //   + ' | S: ' + heartBeat.queues.sessionQueue
  //   + ' | DBW: ' + heartBeat.queues.dbUpdateWordQueue
  //   + ' | DBE: ' + heartBeat.queues.dbUpdateEntityQueue 
  //   + ' | V: ' + heartBeat.queues.updateSessionViewQueue
  // ]);

  // tableCreateRow(heatbeatTable, false, ['TOTAL ADMINS', heartBeat.db.totalAdmins]);
  // tableCreateRow(heatbeatTable, false, ['TOTAL USERS', heartBeat.db.totalUsers]);
  // tableCreateRow(heatbeatTable, false, ['TOTAL ENTITIES', heartBeat.db.totalEntities]);
  // tableCreateRow(heatbeatTable, false, ['TOTAL VIEWERS', heartBeat.db.totalViewers]);

  serverHeartbeatElement = document.getElementById("server_admins");

  while (serverHeartbeatElement.childNodes.length >= 1) {
    serverHeartbeatElement.removeChild(serverHeartbeatElement.firstChild);
  }

  serverHeartbeatElement.appendChild(serverHeartbeatElement.ownerDocument
    .createTextNode(numberAdminIpAddresses + " ADMINS UNIQUE IP " + " | " + heartBeat.numberAdmins + " CONNECTED")
  );


  serverHeartbeatElement = document.getElementById("server_users");

  while (serverHeartbeatElement.childNodes.length >= 1) {
    serverHeartbeatElement.removeChild(serverHeartbeatElement.firstChild);
  }
  serverHeartbeatElement.appendChild(serverHeartbeatElement.ownerDocument
    .createTextNode(numberUserIpAddresses + " USER UNIQUE IP " + " | " + heartBeat.entity.user.connected + " USERS")
  );


  serverHeartbeatElement = document.getElementById("server_viewers");

  while (serverHeartbeatElement.childNodes.length >= 1) {
    serverHeartbeatElement.removeChild(serverHeartbeatElement.firstChild);
  }
  serverHeartbeatElement.appendChild(serverHeartbeatElement.ownerDocument
    .createTextNode(numberViewerIpAddresses + " VIEWER UNIQUE IP " + " | " + heartBeat.numberViewers + " VIEWERS")
  );
}

function initialize(callback){

  console.debug("INITIALIZE...");

  // initTimelineData(MAX_TIMELINE, function(){
    initBars(function(){
      callback();
    });
  // });


}