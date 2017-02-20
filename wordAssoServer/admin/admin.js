/*ver 0.47*/
/*jslint node: true */
"use strict";

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
var MAX_TIMELINE = 300;

var tpmData =[];
var wpmData =[];
var trpmData =[];
var tLimitData = [];


requirejs(["https://d3js.org/d3.v4.min.js"], function(d3Loaded) {
    console.debug("d3 LOADED");
    initialize(function(){
      initializeComplete = true;

      setInterval(function(){
        MG.data_graphic({
            title: "TPM",
            description: "TWEETS/MIN",
            data: tpmData,
            width: 500,
            height: 200,
            // right: 20,
            target: '#tpmDiv',
            x_accessor: 'date',
            y_accessor: 'value',
            min_y_from_data: true,
            animate_on_load: false,
            transition_on_update: false,
            missing_is_zero: true
        });
        MG.data_graphic({
            title: "T LIMIT",
            description: "TWITTER LIMIT",
            data: tLimitData,
            width: 500,
            height: 200,
            // right: 20,
            target: '#tlimitDiv',
            x_accessor: 'date',
            y_accessor: 'value',
            min_y_from_data: true,
            animate_on_load: false,
            transition_on_update: false,
            missing_is_zero: true
        });
        MG.data_graphic({
            title: "WPM",
            description: "WORDS/MIN",
            data: wpmData,
            width: 500,
            height: 200,
            // right: 20,
            target: '#wpmDiv',
            x_accessor: 'date',
            y_accessor: 'value',
            min_y_from_data: true,
            animate_on_load: false,
            transition_on_update: false
        });
        MG.data_graphic({
            title: "TrPM",
            description: "TRUMP/MIN",
            data: trpmData,
            width: 500,
            height: 200,
            // right: 20,
            target: '#trpmDiv',
            x_accessor: 'date',
            y_accessor: 'value',
            min_y_from_data: true,
            animate_on_load: false,
            transition_on_update: false
        });
      }, 1000);

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
// var utilSessionHashMapKeys = [];
var userIpHashMapKeys = [];
var userSessionHashMapKeys = [];
var adminIpHashMapKeys = [];
var adminSocketIdHashMapKeys = [];

var numberUtilIpAddresses = 0;
var numberUtilSessions = 0;
var numberTestUtilSessions = 0;
var numberAdminsConnected = 0;

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
  userId: USER_ID,
  screenName: SCREEN_NAME,
  type: "UTIL",
  mode: "STREAM"
};

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

var socket = io.connect('/admin');

var googleOauthUrl = 0;


var memoryBar;
var deltaResponsesMax = 1;
var wordsPerMinBar;
var userIpTableBody;
var userSessionTableBody;
var showConnectedUsers = true;
var showDisconnectedUsers = false;
var showIpUsers = true;
var showTestUsers = true;
var showBotUsers = true;
var numberAdminIpAddresses = adminIpHashMap.count();
var showConnectedAdmins = true;
var showDisconnectedAdmins = false;
var showIpAdmins = true;
var numberUserSessions = 0;
var numberTestUserSessions = 0;
var numberUserIpAddresses = userIpHashMap.count();

var userConnectedColor = "#00aa00";
var testUserConnectedColor = "#888888";
var userDisconnectedColor = "#aa0000";
var testUserDisonnectedColor = "#880000";
var showConnectedViewers = true;
var showDisconnectedViewers = false;
var showIpViewers = true;
var showTestViewers = true;
var showBotViewers = true;

var viewerIpHashMapKeys = [];
var viewerSessionHashMapKeys = [];

var numberViewerSessions = 0;
var numberTestViewerSessions = 0;
var numberViewerIpAddresses = viewerIpHashMap.count();

var viewerConnectedColor = "#00aa00";
var testViewerConnectedColor = "#888888";
var viewerDisconnectedColor = "#aa0000";
var testViewerDisonnectedColor = "#880000";
var showConnectedViewers = true;
var showDisconnectedViewers = false;
var viewerIpTableBody;
var viewerSessionTableBody;
var viewerSessionTableHead;
var viewersBar;
var testViewersBar;
var testViewersBar;
var usersBar;
var userIpTableHead;
var userSessionTableHead;
var usersTotalTotalBar;
var utilConnectedColor = "#00aa00";
var testUtilConnectedColor = "#888888";
var utilDisconnectedColor = "#aa0000";
var testUtilDisonnectedColor = "#880000";
var showConnectedUtils = true;
var showDisconnectedUtils = false;
var showIpUtils = true;
var deltaTweetsMax = 1;

var utilSessionTableHead;
var utilIpTableHead;

var utilIpTableBody;
var utilSessionTableBody;

var utilsBarDiv;
var utilsBar;
var utilsBarText;

var usersBarDiv;
var usersBarText;

var usersTotalBarDiv;
var usersTotalBar;
var usersTotalBarText;

var testUsersBarDiv;
var testUsersBar;
var testUsersBarText;

var viewerIpTableHead;
var viewersBarDiv;
var viewersBar;
var viewersBarText;

var viewersTotalBarDiv;
var viewersTotalBar;
var viewersTotalBarText;

var testViewersBarDiv;
var testViewersBar;
var testViewersBarText;

var memoryBarDiv;
var memoryBarText;

var bhtRequestsBarDiv;
var bhtRequestsBar;
var bhtRequestsBarText;
var bhtRequestsBarPercent;

var mwRequestsBar;
var mwRequestsBarDiv;
var mwRequestsBarText;
var mwRequestsBarPercent;

var wordsPerMinBar;
var wordsPerMinBarDiv;
var wordsPerMinBarText;

var tweetsPerMinBar;
var tweetsPerMinBarDiv;
var tweetsPerMinBarText;

var twitterLimitBar;
var twitterLimitBarDiv;
var twitterLimitBarText;

function initBars(callback){
 
  console.debug("INIT BARS ...");

  // USERS ===============================

  userSessionTableHead = document.getElementById('user_session_table_head');
  userSessionTableBody = document.getElementById('user_session_table_body');

  userIpTableHead = document.getElementById('user_ip_table_head');
  userIpTableBody = document.getElementById('user_ip_table_body');

  usersBarDiv = document.getElementById('users-bar');
  usersBar = new ProgressBar.Line(usersBarDiv, {});
  usersBar.animate(0);
  usersBarText = document.getElementById('users-bar-text');

  testUsersBarDiv = document.getElementById('test-users-bar');
  testUsersBar = new ProgressBar.Line(testUsersBarDiv, {});
  testUsersBar.animate(0);
  testUsersBarText = document.getElementById('test-users-bar-text');

  usersTotalBarDiv = document.getElementById('users-total-bar');
  usersTotalBar = new ProgressBar.Line(usersTotalBarDiv, {});
  usersTotalBar.animate(0);
  usersTotalBarText = document.getElementById('users-total-bar-text');


  // VIEWERS ===============================

  viewerSessionTableHead = document.getElementById('viewer_session_table_head');
  viewerSessionTableBody = document.getElementById('viewer_session_table_body');

  viewerIpTableHead = document.getElementById('viewer_ip_table_head');
  viewerIpTableBody = document.getElementById('viewer_ip_table_body');

  viewersBarDiv = document.getElementById('viewers-bar');
  viewersBar = new ProgressBar.Line(viewersBarDiv, {});
  viewersBar.animate(0);
  viewersBarText = document.getElementById('viewers-bar-text');

  testViewersBarDiv = document.getElementById('test-viewers-bar');
  testViewersBar = new ProgressBar.Line(testViewersBarDiv, {});
  testViewersBar.animate(0);
  testViewersBarText = document.getElementById('test-viewers-bar-text');

  viewersTotalBarDiv = document.getElementById('viewers-total-bar');
  viewersTotalBar = new ProgressBar.Line(viewersTotalBarDiv, {});
  viewersTotalBar.animate(0);
  viewersTotalBarText = document.getElementById('viewers-total-bar-text');


  // UTILS ===============================

  numberUtilSessions = 0;
  numberTestUtilSessions = 0;
  numberUtilIpAddresses = utilIpHashMap.count();


  utilSessionTableHead = document.getElementById('util_session_table_head');
  utilSessionTableBody = document.getElementById('util_session_table_body');

  utilIpTableHead = document.getElementById('util_ip_table_head');
  utilIpTableBody = document.getElementById('util_ip_table_body');

  utilsBarDiv = document.getElementById('utils-bar');
  utilsBar = new ProgressBar.Line(utilsBarDiv, {});
  utilsBar.animate(0);
  utilsBarText = document.getElementById('utils-bar-text');

  memoryBarDiv = document.getElementById('memory-bar');
  memoryBarText = document.getElementById('memory-bar-text');
  memoryBar = new ProgressBar.Line(memoryBarDiv, {});
  memoryBar.animate(0);

  bhtRequestsBar;
  bhtRequestsBarPercent = 0;
  bhtRequestsBarDiv = document.getElementById('bht-requests-bar');
  bhtRequestsBarText = document.getElementById('bht-requests-bar-text');
  bhtRequestsBar = new ProgressBar.Line(bhtRequestsBarDiv, {});
  bhtRequestsBar.animate(0);

  mwRequestsBar;
  mwRequestsBarPercent = 0;
  mwRequestsBarDiv = document.getElementById('mw-requests-bar');
  mwRequestsBarText = document.getElementById('mw-requests-bar-text');
  mwRequestsBar = new ProgressBar.Line(mwRequestsBarDiv, {});
  mwRequestsBar.animate(0);

  wordsPerMinBarDiv = document.getElementById('delta-response-bar');
  wordsPerMinBarText = document.getElementById('delta-response-bar-text');
  wordsPerMinBar = new ProgressBar.Line(wordsPerMinBarDiv, { duration: 200 });
  wordsPerMinBar.animate(0);

  tweetsPerMinBarDiv = document.getElementById('delta-tweet-bar');
  tweetsPerMinBarText = document.getElementById('delta-tweet-bar-text');
  tweetsPerMinBar = new ProgressBar.Line(tweetsPerMinBarDiv, { duration: 200 });
  tweetsPerMinBar.animate(0);

  twitterLimitBarDiv = document.getElementById('twitter-limit-bar');
  twitterLimitBarText = document.getElementById('twitter-limit-bar-text');
  twitterLimitBar = new ProgressBar.Line(twitterLimitBarDiv, { duration: 200 });
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
var tweetsPerMinServer;
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

  if (typeof inputTime === 'undefined') {
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

  if (serverConnected && initializeComplete) updateServerHeartbeat(heartBeat, heartBeatTimeoutFlag, lastTimeoutHeartBeat);
}

function updateAdminConfig(config) {

  console.log("ADMIN CONFIG CHANGE\n" + jsonPrint(config));

  if (typeof config.testMode !== 'undefined') {
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

    if (typeof sessionObj.seen === 'undefined'){
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
    if (typeof adminConfig !== 'undefined') {
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
  console.log("RXCD VIEWER IP  " + ipObj.ip + " | " + ipObj.domain);
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

  updateUserConnect(userSessionObj);
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

  if (serverConnected && initializeComplete) updateViewerConnect(viewerSessionObj);
});

socket.on('UTIL_SESSION', function(utilSessionObj) {

  // console.log("utilSessionObj\n" + jsonPrint(utilSessionObj, {
  //     ignore: ['wordChain', 'sessions']
  // }));


  utilIpHashMap.set(utilSessionObj.ip, utilSessionObj);
  // utilIpHashMapKeys = utilIpHashMap.keys();
  // utilIpHashMapKeys.sort();
  numberUtilIpAddresses = utilIpHashMapKeys.length;
  utilSessionHashMap.set(utilSessionObj.sessionId, utilSessionObj);
  // utilSessionHashMapKeys = utilSessionHashMap.keys();
  // utilSessionHashMapKeys.sort();
  numberUtilSessions = utilSessionHashMap.keys().length;

  console.log("RX UTIL SESSION[" + utilSessionHashMap.keys().length + "]: " + utilSessionObj.sessionId 
    + " | C: " + utilSessionObj.connected
    + " | UID: " + utilSessionObj.userId
    );

  // console.debug("UTIL SESSION\n" + jsonPrint( utilSessionHashMap.get(utilSessionObj.sessionId), {ignore: ["sessions"]} ));

  if (utilSessionObj.connected && utilSessionObj.userId.match(/TSS_/g)) {
    console.info("UTIL SERVER CONNECTED: " + utilSessionObj.userId);
    tweetsPerMinServer = utilSessionObj.userId;
  } else if (!utilSessionObj.connected && utilSessionObj.userId.match(/TSS_/g)) {
    console.info("UTIL SERVER DISCONNECTED: " + utilSessionObj.userId);
    tweetsPerMinServer = false;
    tweetsPerMin = 0;
  }

  updateUtilConnect(utilSessionObj);
});

socket.on("SESSION_DELETE", function(sessionObject) {
  console.debug("> RX DEL SESS | " + sessionObject.sessionId);
  if (utilSessionHashMap.has(sessionObject.sessionId)){
    console.info("* UTIL HM HIT " + sessionObject.sessionId);
  } 
  if (userSessionHashMap.has(sessionObject.sessionId)){
    console.info("* USER HM HIT " + sessionObject.sessionId);
  } 
});


socket.on('HEARTBEAT', function(rxHeartbeat) {
  heartBeatTimeoutFlag = false;
  hbIndex++;
  heartBeat = rxHeartbeat;

  if (tweetsPerMinServer && heartBeat.utilities[tweetsPerMinServer]) {
    tweetsPerMin = heartBeat.utilities[tweetsPerMinServer].tweetsPerMinute;
    tweetsPerMinMax = heartBeat.utilities[tweetsPerMinServer].maxTweetsPerMin;
    tweetsPerMinMaxTime = heartBeat.utilities[tweetsPerMinServer].maxTweetsPerMinTime;

    twitterLimit = heartBeat.utilities[tweetsPerMinServer].twitterLimit;
    twitterLimitMax = heartBeat.utilities[tweetsPerMinServer].twitterLimitMax;
    twitterLimitMaxTime = heartBeat.utilities[tweetsPerMinServer].twitterLimitMaxTime;

    tpmData.push({date: new Date(), value: tweetsPerMin});
    if (tpmData.length > MAX_TIMELINE) tpmData.shift();

    tLimitData.push({date: new Date(), value: twitterLimit});
    if (tLimitData.length > MAX_TIMELINE) tLimitData.shift();

  }

  // console.log("... HB | " + tweetsPerMin + "\n" + jsonPrint(heartBeat));
  if (rxHeartbeat.deltaResponsesReceived > deltaResponsesMax) deltaResponsesMax = rxHeartbeat.deltaResponsesReceived;

  if (rxHeartbeat.wordsPerMinute > wordsPerMinuteMax) wordsPerMinuteMax = rxHeartbeat.wordsPerMinute;

  heartBeatTimeoutFlag = false;
  updateUserConnect();
  updateViewerConnect();
  updateUtilConnect();

  tpmData.push({date: new Date(), value: tweetsPerMin});
  if (tpmData.length > MAX_TIMELINE) tpmData.shift();

  tLimitData.push({date: new Date(), value: twitterLimit});
  if (tLimitData.length > MAX_TIMELINE) tLimitData.shift();

  wpmData.push({date: new Date(), value: rxHeartbeat.wordsPerMinute});
  if (wpmData.length > MAX_TIMELINE) wpmData.shift();

  trpmData.push({date: new Date(), value: rxHeartbeat.trumpPerMinute});
  if (trpmData.length > MAX_TIMELINE) trpmData.shift();
});

// updateServerHeartbeat
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
  updateServerHeartbeat(heartBeat, heartBeatTimeoutFlag, lastTimeoutHeartBeat);
}, serverCheckInterval);;

function setTestMode(inputTestMode) {

  var serverConfigUpdateFlag = false;

  if (typeof inputTestMode !== 'undefined') {
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

  if ((typeof e === 'undefined') || (e.keyCode == 13)) {
    if (configHasValues) {
      console.log("***> SENT CONFIG: " + JSON.stringify(config, null, 3));
      socket.emit('CONFIG', JSON.stringify(config));
      return false;
    } else {
      console.log("sendServerConfig: NO VALUES SET ... SKIPPING ...");
    }
  }
}

function setWordCacheTtl() {
  var newWordCacheTtl = document.getElementById("setWordCacheTtl").value;
  console.log("SET WORD CACHE TTL: " + newWordCacheTtl);
  socket.emit("SET_WORD_CACHE_TTL", newWordCacheTtl);
}

function updateBhtReqs() {
  var newBhtRequests = document.getElementById("updateBhtReqs").value;
  console.log("UPDATE BHT REQS: " + newBhtRequests);
  socket.emit("UPDATE_BHT_REQS", newBhtRequests);
}

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
  updateUserConnect({
    showIp: "toggle"
  });
}

function toggleConnectedUsers() {
  updateUserConnect({
    showConnected: "toggle"
  });
}

function toggleDisconnectedUsers() {
  updateUserConnect({
    showDisconnected: "toggle"
  });
}

function toggleHideTestUsers() {
  updateUserConnect({
    showTestUsers: "toggle"
  });
}

function toggleHideBotUsers() {
  updateUserConnect({
    showBotUsers: "toggle"
  });
}

function toggleIpViewers() {
  updateViewerConnect({
    showIp: "toggle"
  });
}

function toggleConnectedViewers() {
  updateViewerConnect({
    showConnected: "toggle"
  });
}

function toggleDisconnectedViewers() {
  updateViewerConnect({
    showDisconnected: "toggle"
  });
}

function toggleHideTestViewers() {
  updateViewerConnect({
    showTestViewers: "toggle"
  });
}

function toggleHideBotViewers() {
  updateViewerConnect({
    showBotViewers: "toggle"
  });
}

function toggleIpUtils() {
  updateUtilConnect({
    showIp: "toggle"
  });
}

function toggleConnectedUtils() {
  updateUtilConnect({
    showConnected: "toggle"
  });
}

function toggleDisconnectedUtils() {
  updateUtilConnect({
    showDisconnected: "toggle"
  });
}

function updateAdminConnect(req) {

  numberAdminsConnected = 0;

  if (typeof req === 'undefined') {} else {
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

function updateUserConnect(req) {

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

  if (typeof req === 'undefined') {} else {
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
    if (req.showTestUsers == 'toggle') {
      showTestUsers = !showTestUsers;
      console.log("showTestUsers " + showTestUsers);
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

      } else if (!showTestUsers && value.namespace && (value.namespace == 'test-user')) {

      } else {

        if (value.namespace && (value.namespace == 'test-user')) {
          userIpTableBodyOptions.tdTextColor = testUserConnectedColor;
        } else {
          userIpTableBodyOptions.tdTextColor = userConnectedColor;
        }

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

      if (typeof sessionObj.referer === 'undefined') {
        sessionObj.referer = '';
      }


      if (!showTestUsers && sessionObj.namespace && (sessionObj.namespace == 'test-user')) {

      } else if (!showBotUsers && ((sessionObj.domain.indexOf("googlebot") >= 0))) {

      } else {
        if (sessionObj.connected == true) {

          numberConnected++;

          if (sessionObj.namespace && (sessionObj.namespace == 'test-user')) {
            userSessionTableBodyOptions.tdTextColor = testUserConnectedColor;
          } else if (sessionObj.domain.indexOf("googlebot") >= 0) {
            userSessionTableBodyOptions.tdTextColor = testUserConnectedColor;
          } else if (sessionObj.domain.indexOf("googleusercontent") >= 0) {
            userSessionTableBodyOptions.tdTextColor = testUserConnectedColor;
          } else {
            userSessionTableBodyOptions.tdTextColor = userConnectedColor;
          }

          // console.log("sessionId: " + sessionId + "\n" + jsonPrint(sessionObj));
          // console.log("heartBeat.timeStamp: " + heartBeat.timeStamp + " | " + sessionObj.connectTime);
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

      if (!showTestUsers && value.namespace && (value.namespace == 'test-user')) {} else {
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
  }
}

function updateViewerConnect(req) {

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

  if (typeof req === 'undefined') {} else {
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
    if (req.showTestViewers == 'toggle') {
      showTestViewers = !showTestViewers;
      console.log("showTestViewers " + showTestViewers);
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
      else if (!showTestViewers && value.namespace && (value.namespace == 'test-viewer')) {
      } 
      else {

        if (value.namespace && (value.namespace == 'test-viewer')) {
          viewerIpTableBodyOptions.textColor = testViewerConnectedColor;
        } 
        else {
          viewerIpTableBodyOptions.textColor = viewerConnectedColor;
        }

        numberUniqueViewers++;

        if (value.connected == true) {
          elapsedSinceLastSeen = 0;
        } else if (value.lastSeen > currentTime) {
          elapsedSinceLastSeen = 0;
        } else {
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

      if (typeof sessionObj.referer === 'undefined') {
        sessionObj.referer = '';
      }


      if (!showTestViewers && sessionObj.namespace && (sessionObj.namespace == 'test-viewer')) {

      } else if (!showBotViewers && ((sessionObj.domain.indexOf("googlebot") >= 0))) {

      } else {
        if (sessionObj.connected == true) {

          numberConnected++;

          if (sessionObj.namespace && (sessionObj.namespace == 'test-viewer')) {
            viewerSessionTableBodyOptions.textColor = testViewerConnectedColor;
          } else if (sessionObj.domain.indexOf("googlebot") >= 0) {
            viewerSessionTableBodyOptions.textColor = testViewerConnectedColor;
          } else if (sessionObj.domain.indexOf("googleviewercontent") >= 0) {
            viewerSessionTableBodyOptions.textColor = testViewerConnectedColor;
          } else {
            viewerSessionTableBodyOptions.textColor = viewerConnectedColor;
          }

          // console.log("sessionId: " + sessionId + "\n" + jsonPrint(sessionObj));
          // console.log("heartBeat.timeStamp: " + heartBeat.timeStamp + " | " + sessionObj.connectTime);
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

      if (!showTestViewers && value.namespace && (value.namespace == 'test-viewer')) {

      } else {
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
  }
}

function updateUtilConnect(req) {

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

  if (typeof req === 'undefined') {} else {
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

      if (typeof sessionObj.referer === 'undefined') {
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
}
 var memoryAvailable = 0;
 var memoryUsed = 0;

function updateServerHeartbeat(heartBeat, timeoutFlag, lastTimeoutHeartBeat) {

  if (!initializeComplete) return;

  // console.log("updateServerHeartbeat: timeoutFlag: " + timeoutFlag);

  memoryAvailable = heartBeat.memoryAvailable / heartBeat.memoryTotal;
  memoryUsed = (heartBeat.memoryTotal - heartBeat.memoryAvailable) / heartBeat.memoryTotal;
  if (memoryBar) memoryBar.animate(memoryUsed);

  if (100 * memoryUsed >= ALERT_LIMIT_PERCENT) {
    memoryBar.path.setAttribute('stroke', endColor);
  } else if (100 * memoryUsed >= WARN_LIMIT_PERCENT) {
    memoryBar.path.setAttribute('stroke', midColor);
  } else {
    memoryBar.path.setAttribute('stroke', startColor);
  }

  memoryBarText.innerHTML =
    'MEMORY (GB)' + ' | ' + (heartBeat.memoryTotal / ONE_GB).toFixed(2) + ' TOT' + ' | ' + ((heartBeat.memoryTotal - heartBeat.memoryAvailable) / ONE_GB).toFixed(2) + ' USED' + ' (' + (100 * memoryUsed).toFixed(1) + ' %)' + ' | ' + (heartBeat.memoryAvailable / ONE_GB).toFixed(2) + ' AVAIL' + ' (' + (100 * memoryAvailable).toFixed(2) + ' %)';


  bhtRequestsBar.animate(heartBeat.bhtRequests / heartBeat.bhtRequestLimit);

  if (100 * heartBeat.bhtRequests / heartBeat.bhtRequestLimit >= ALERT_LIMIT_PERCENT) {
    bhtRequestsBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.bhtRequests / heartBeat.bhtRequestLimit >= WARN_LIMIT_PERCENT) {
    bhtRequestsBar.path.setAttribute('stroke', midColor);
  } else {
    bhtRequestsBar.path.setAttribute('stroke', startColor);
  }

  bhtRequestsBarText.innerHTML =
    'BHT REQS' + ' | USED: ' + heartBeat.bhtRequests + ' (' + (heartBeat.bhtRequests / heartBeat.bhtRequestLimit * 100).toFixed(0) + ' %)' + ' | REMAIN: ' + (heartBeat.bhtRequestLimit - heartBeat.bhtRequests) + ' (' + ((heartBeat.bhtRequestLimit - heartBeat.bhtRequests) / heartBeat.bhtRequestLimit * 100).toFixed(0) + ' %)';


  mwRequestsBar.animate(heartBeat.mwRequests / heartBeat.mwRequestLimit);

  if (100 * heartBeat.mwRequests / heartBeat.mwRequestLimit >= ALERT_LIMIT_PERCENT) {
    mwRequestsBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.mwRequests / heartBeat.mwRequestLimit >= WARN_LIMIT_PERCENT) {
    mwRequestsBar.path.setAttribute('stroke', midColor);
  } else {
    mwRequestsBar.path.setAttribute('stroke', startColor);
  }

  mwRequestsBarText.innerHTML =
    'MW REQS' + ' | USED: ' + heartBeat.mwRequests + ' (' + (heartBeat.mwRequests / heartBeat.mwRequestLimit * 100).toFixed(0) + ' %)' + ' | REMAIN: ' + (heartBeat.mwRequestLimit - heartBeat.mwRequests) + ' (' + ((heartBeat.mwRequestLimit - heartBeat.mwRequests) / heartBeat.mwRequestLimit * 100).toFixed(0) + ' %)';


  // TEST VIEWERS ==========================
  testViewersBar.animate(heartBeat.numberTestViewers / heartBeat.numberTestViewersMax);

  if (100 * heartBeat.numberTestViewers / heartBeat.numberTestViewersMax >= ALERT_LIMIT_PERCENT) {
    testViewersBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberTestViewers / heartBeat.numberTestViewersMax >= WARN_LIMIT_PERCENT) {
    testViewersBar.path.setAttribute('stroke', midColor);
  } else {
    testViewersBar.path.setAttribute('stroke', startColor);
  }

  testViewersBarText.innerHTML = (heartBeat.numberTestViewers) + ' TEST VIEWERS | ' + (heartBeat.numberTestViewersMax) + ' MAX | ' + moment(heartBeat.numberTestViewersMaxTime).format(defaultDateTimeFormat);


  // VIEWERS ==========================
  viewersTotalBar.animate(heartBeat.numberViewersTotal / heartBeat.numberViewersTotalMax);

  if (100 * heartBeat.numberViewersTotal / heartBeat.numberViewersTotalMax >= ALERT_LIMIT_PERCENT) {
    viewersTotalBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberViewersTotal / heartBeat.numberViewersTotalMax >= WARN_LIMIT_PERCENT) {
    viewersTotalBar.path.setAttribute('stroke', midColor);
  } else {
    viewersTotalBar.path.setAttribute('stroke', startColor);
  }

  viewersTotalBarText.innerHTML = (heartBeat.numberViewersTotal) + ' TOTAL VIEWERS | ' + (heartBeat.numberViewersTotalMax) + ' MAX | ' + moment(heartBeat.numberViewersTotalMaxTime).format(defaultDateTimeFormat);


  viewersBar.animate(heartBeat.numberViewers / heartBeat.numberViewersMax);

  if (100 * heartBeat.numberViewers / heartBeat.numberViewersMax >= ALERT_LIMIT_PERCENT) {
    viewersBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberViewers / heartBeat.numberViewersMax >= WARN_LIMIT_PERCENT) {
    viewersBar.path.setAttribute('stroke', midColor);
  } else {
    viewersBar.path.setAttribute('stroke', startColor);
  }

  viewersBarText.innerHTML = (heartBeat.numberViewers) + ' VIEWERS | ' + (heartBeat.numberViewersMax) + ' MAX | ' + moment(heartBeat.numberViewersMaxTime).format(defaultDateTimeFormat);


  // TEST USERS ==========================
  testUsersBar.animate(heartBeat.numberTestUsers / heartBeat.numberTestUsersMax);

  if (100 * heartBeat.numberTestUsers / heartBeat.numberTestUsersMax >= ALERT_LIMIT_PERCENT) {
    testUsersBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberTestUsers / heartBeat.numberTestUsersMax >= WARN_LIMIT_PERCENT) {
    testUsersBar.path.setAttribute('stroke', midColor);
  } else {
    testUsersBar.path.setAttribute('stroke', startColor);
  }

  testUsersBarText.innerHTML = (heartBeat.numberTestUsers) + ' TEST USERS | ' + (heartBeat.numberTestUsersMax) + ' MAX | ' + moment(heartBeat.numberTestUsersMaxTime).format(defaultDateTimeFormat);


  // USERS ==========================
  usersTotalBar.animate(heartBeat.numberUsersTotal / heartBeat.numberUsersTotalMax);

  if (100 * heartBeat.numberUsersTotal / heartBeat.numberUsersTotalMax >= ALERT_LIMIT_PERCENT) {
    usersTotalBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberUsersTotal / heartBeat.numberUsersTotalMax >= WARN_LIMIT_PERCENT) {
    usersTotalBar.path.setAttribute('stroke', midColor);
  } else {
    usersTotalBar.path.setAttribute('stroke', startColor);
  }

  usersTotalBarText.innerHTML = (heartBeat.numberUsersTotal) + ' TOTAL USERS | ' + (heartBeat.numberUsersTotalMax) + ' MAX | ' + moment(heartBeat.numberUsersTotalMaxTime).format(defaultDateTimeFormat);


  usersBar.animate(heartBeat.numberUsers / heartBeat.numberUsersMax);

  if (100 * heartBeat.numberUsers / heartBeat.numberUsersMax >= ALERT_LIMIT_PERCENT) {
    usersBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberUsers / heartBeat.numberUsersMax >= WARN_LIMIT_PERCENT) {
    usersBar.path.setAttribute('stroke', midColor);
  } else {
    usersBar.path.setAttribute('stroke', startColor);
  }

  usersBarText.innerHTML = (heartBeat.numberUsers) + ' USERS | ' + (heartBeat.numberUsersMax) + ' MAX | ' + moment(heartBeat.numberUsersMaxTime).format(defaultDateTimeFormat);


  // TEST USERS ==========================
  testUsersBar.animate(heartBeat.numberTestUsers / heartBeat.numberTestUsersMax);

  if (100 * heartBeat.numberTestUsers / heartBeat.numberTestUsersMax >= ALERT_LIMIT_PERCENT) {
    testUsersBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberTestUsers / heartBeat.numberTestUsersMax >= WARN_LIMIT_PERCENT) {
    testUsersBar.path.setAttribute('stroke', midColor);
  } else {
    testUsersBar.path.setAttribute('stroke', startColor);
  }

  testUsersBarText.innerHTML = (heartBeat.numberTestUsers) + ' TEST USERS | ' + (heartBeat.numberTestUsersMax) + ' MAX | ' + moment(heartBeat.numberTestUsersMaxTime).format(defaultDateTimeFormat);


  // UTILS=========================
  utilsBar.animate(heartBeat.numberUtils / heartBeat.numberUtilsMax);

  if (100 * heartBeat.numberUtils / heartBeat.numberUtilsMax >= ALERT_LIMIT_PERCENT) {
    utilsBar.path.setAttribute('stroke', endColor);
  } else if (100 * heartBeat.numberUtils / heartBeat.numberUtilsMax >= WARN_LIMIT_PERCENT) {
    utilsBar.path.setAttribute('stroke', midColor);
  } else {
    utilsBar.path.setAttribute('stroke', startColor);
  }

  utilsBarText.innerHTML = (heartBeat.numberUtils) + ' UTILS | ' + (heartBeat.numberUtilsMax) + ' MAX | ' + moment(heartBeat.numberUtilsMaxTime).format(defaultDateTimeFormat);


  wordsPerMinBar.animate(heartBeat.wordsPerMinute / heartBeat.maxWordsPerMin);

  if (heartBeat.wordsPerMinute >=  0.01*ALERT_LIMIT_PERCENT * heartBeat.maxWordsPerMin) {
    wordsPerMinBar.path.setAttribute('stroke', endColor);
  } else if (heartBeat.wordsPerMinute >= 0.01*WARN_LIMIT_PERCENT * heartBeat.maxWordsPerMin) {
    wordsPerMinBar.path.setAttribute('stroke', midColor);
  } else {
    wordsPerMinBar.path.setAttribute('stroke', startColor);
  }

  wordsPerMinBarText.innerHTML = parseInt(heartBeat.wordsPerMinute) + ' WPM | ' + parseInt(heartBeat.maxWordsPerMin) + ' MAX' + ' | ' + moment(heartBeat.maxWordsPerMinTime).format(defaultDateTimeFormat);


  tweetsPerMinBar.animate(tweetsPerMin / tweetsPerMinMax);

  if (tweetsPerMin >= 0.01*ALERT_LIMIT_PERCENT * tweetsPerMinMax) {
    tweetsPerMinBar.path.setAttribute('stroke', endColor);
  } else if (tweetsPerMin >= 0.01*WARN_LIMIT_PERCENT * tweetsPerMinMax) {
    tweetsPerMinBar.path.setAttribute('stroke', midColor);
  } else {
    tweetsPerMinBar.path.setAttribute('stroke', startColor);
  }

  tweetsPerMinBarText.innerHTML = parseInt(tweetsPerMin) + ' TPM | ' + parseInt(tweetsPerMinMax) + ' MAX' + ' | ' + moment(tweetsPerMinMaxTime).format(defaultDateTimeFormat);


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

  var bhtOLTmoment;

  if (heartBeat.bhtOverLimitTime == 0) {
    bhtOLTmoment = "";
  } else {
    bhtOLTmoment = moment(heartBeat.bhtOverLimitTime).format("YYYY-MM-DD HH:mm:ss ZZ");
  }
  var bhtLRTmoment = moment(heartBeat.bhtLimitResetTime).format("YYYY-MM-DD HH:mm:ss ZZ");

  var bhtOptions = false;

  tableCreateRow(heatbeatTable, false, ['SERVER TIME', getTimeStamp(heartBeat.timeStamp)]);
  tableCreateRow(heatbeatTable, false, ['SERVER UPTIME', msToTime(heartBeat.upTime)]);
  tableCreateRow(heatbeatTable, false, ['APP START TIME', getTimeStamp(heartBeat.startTime)]);
  tableCreateRow(heatbeatTable, false, ['APP RUNTIME', msToTime(heartBeat.runTime)]);

  if (typeof heartBeat.wordCacheStats !== 'undefined') {

    var hmr = (heartBeat.wordCacheStats.hits / (1 + heartBeat.wordCacheStats.misses));

    tableCreateRow(heatbeatTable, false, ['WORD CACHE',
      'TTL: ' + heartBeat.wordCacheTtl + ' | K: ' + heartBeat.wordCacheStats.keys + ' | H: ' + heartBeat.wordCacheStats.hits + ' | M: ' + heartBeat.wordCacheStats.misses + ' | HMR: ' + hmr.toFixed(2)
    ]);

  }

  tableCreateRow(heatbeatTable, false, ['TOTAL SESSIONS', heartBeat.totalSessions]);
  tableCreateRow(heatbeatTable, false, ['TOTAL WORDS', heartBeat.totalWords]);
  tableCreateRow(heatbeatTable, false, ['TOTAL PROMPTS', heartBeat.promptsSent]);
  tableCreateRow(heatbeatTable, false, ['TOTAL REPONSES', heartBeat.responsesReceived]);

  if (heartBeat.bhtOverLimitFlag) {
    var now = moment.utc();
    now.utcOffset("-08:00");

    bhtOptions = {
      tdTextColor: "black",
      backgroundColor: "#999947"
    };

    tableCreateRow(heatbeatTable, bhtOptions, ['*** BHT OVER LIMIT ***',
      (msToTime(now.diff(heartBeat.bhtOverLimitTime))) + ' AGO | ' + (msToTime(moment(heartBeat.bhtLimitResetTime).diff(now))) + ' REMAIN'
    ]);
  }

  // tableCreateRow(heatbeatTable, bhtOptions, ['TOTAL BHT REQS', heartBeat.bhtRequests]);
  tableCreateRow(heatbeatTable, bhtOptions, ['BHT OVER LIMIT', bhtOLTmoment]);
  tableCreateRow(heatbeatTable, bhtOptions, ['BHT LIMIT RESET',
    bhtLRTmoment + ' | ' + (msToTime(moment(heartBeat.bhtLimitResetTime).diff(now))) + ' REMAIN'
  ]);

  tableCreateRow(heatbeatTable, false, ['TOTAL MW REQS', heartBeat.mwRequests]);

  tableCreateRow(heatbeatTable, false, ['ADMINS', heartBeat.numberAdmins]);
  tableCreateRow(heatbeatTable, false, ['UTILS', heartBeat.numberUtils]);

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
    .createTextNode(numberUserIpAddresses + " USER UNIQUE IP " + " | " + heartBeat.numberUsers + " USERS" + " | " + heartBeat.numberTestUsers + " TEST USERS")
  );


  serverHeartbeatElement = document.getElementById("server_viewers");

  while (serverHeartbeatElement.childNodes.length >= 1) {
    serverHeartbeatElement.removeChild(serverHeartbeatElement.firstChild);
  }
  serverHeartbeatElement.appendChild(serverHeartbeatElement.ownerDocument
    .createTextNode(numberViewerIpAddresses + " VIEWER UNIQUE IP " + " | " + heartBeat.numberViewers + " VIEWERS" + " | " + heartBeat.numberTestViewers + " TEST VIEWERS")
  );
}

function initTimelineData(numDataPoints, callback){

  var ts;

  var currentMillis = moment().valueOf();

  for (var i=0; i<numDataPoints; i++){
    tpmData.unshift({date: new Date(parseInt(currentMillis-(1000*i))), value: 0});
    wpmData.unshift({date: new Date(parseInt(currentMillis-(1000*i))), value: 0});
    tLimitData.unshift({date: new Date(parseInt(currentMillis-(1000*i))), value: 0});
  }

  callback();
}

function initialize(callback){

  console.debug("INITIALIZE...");

  initTimelineData(MAX_TIMELINE, function(){
    initBars(function(){
      callback();
    });
  });


}