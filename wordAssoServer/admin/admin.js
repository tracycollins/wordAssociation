
/*ver 0.47*/
/*jslint node: true */

/* jshint undef: true, unused: true */
/* globals document, io, requirejs, moment, HashMap, async, ProgressBar */

"use strict";

var socket = io('/admin');

var memoryAvailable = 0;
var memoryUsed = 0;
// var memoryUsage = {};

var serverConnected = false;
var sentAdminReady = false;
var initializeComplete = false;

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
// var defaultTimePeriodFormat = "HH:mm:ss";

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
  "blue": "#4808FF",
  "green": "#00E540",
  "darkergreen": "#008200",
  "lightgreen":  "#35A296",
  "yellowgreen": "#738A05"
};

const DEFAULT_TABLE_TEXT_COLOR = palette.lightgray ;
const DEFAULT_TABLE_BG_COLOR = palette.darkgray;
const DEFAULT_TABLE_FONT_SIZE = "1.5em";


var startColor = palette.green;
var midColor = palette.yellow;
var endColor = palette.red;

var WARN_LIMIT_PERCENT = 80;
var ALERT_LIMIT_PERCENT = 95;

var ONE_MB = 1024 * 1024;
var ONE_GB = ONE_MB * 1024;

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
adminConfig.showDisconnectedServers = false;
adminConfig.showDisconnectedViewers = false;

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

  viewersBarDiv = document.getElementById('viewers-bar');
  viewersBar = new ProgressBar.Line(viewersBarDiv, { duration: 100 });
  viewersBar.animate(0);
  viewersBarText = document.getElementById('viewers-bar-text');

  // SERVER ===============================

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

  // console.debug("SERVER_STATS\n" + jsonPrint(serverObj));
  console.debug("SERVER_STATS | " + serverObj.socketId + " | " + serverObj.user.userId);

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

  // let currentServerTableRow = document.getElementById(serverObj.socketId);

  // if (currentServerTableRow) {

  //   console.debug("UPDATE TABLE ROW: " + currentServerTableRow.id);

  //   document.getElementById(serverObj.socketId + "_nodeId").innerHTML = sObj.user.nodeId;
  //   document.getElementById(serverObj.socketId + "_type").innerHTML = sObj.type;
  //   document.getElementById(serverObj.socketId + "_socketId").innerHTML = sObj.socketId;
  //   document.getElementById(serverObj.socketId + "_status").innerHTML = sObj.status;
  //   document.getElementById(serverObj.socketId + "_timeStamp").innerHTML = moment(sObj.timeStamp).format(defaultDateTimeFormat);
  //   document.getElementById(serverObj.socketId + "_ago").innerHTML = msToTime(moment().diff(moment(sObj.timeStamp)));
  // }

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

});

socket.on('VIEWER_DISCONNECT', function(viewerObj) {

  console.debug("VIEWER_DISCONNECT\n" + jsonPrint(viewerObj));

  if (!viewerSocketHashMap.has(viewerObj.socketId)) {
    console.debug("VIEWER_DISCONNECT | VIEWER NOT FOUND IN HM\n" + jsonPrint(viewerObj));
    return;
  }

  var sObj = viewerSocketHashMap.get(viewerObj.socketId);

  sObj.status = "DISCONNECTED";
  sObj.timeStamp = viewerObj.timeStamp;
  sObj.type = viewerObj.type;
  sObj.user = viewerObj.user;

  viewerSocketHashMap.set(sObj.socketId, sObj);

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

});

socket.on('SERVER_ADD', function(serverObj) {
  console.debug("SERVER_ADD\n" + jsonPrint(serverObj));
  serverSocketHashMap.set(serverObj.socketId, serverObj);
});

socket.on('VIEWER_ADD', function(viewerObj) {
  console.debug("VIEWER_ADD\n" + jsonPrint(viewerObj));
  viewerSocketHashMap.set(viewerObj.socketId, viewerObj);
});

socket.on('KEEPALIVE', function(serverObj) {
  console.debug("KEEPALIVE | " + serverObj.type + " | " + serverObj.user.nodeId);

  if (serverObj.socketId === socket.id){
    console.warn("KEEPALIVE LOOPBACK "  + serverObj.socketId + " | " + serverObj.user.nodeId);
  }
  else if (serverSocketHashMap.has(serverObj.socketId)){

    let sObj = serverSocketHashMap.get(serverObj.socketId);
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
    document.getElementById("testModeButton").style.color = palette.red;
    document.getElementById("testModeButton").style.border = "2px solid " + palette.red;
  } else {
    document.getElementById("testModeButton").style.color = "white";
    document.getElementById("testModeButton").style.border = "1px solid " + palette.gray;
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

  const toggleButtonEnabledStyle = {
    border: "2px solid " + palette.green,
    color: palette.green
  };
  
  const toggleButtonDisabledStyle = {
    border: "2px solid " + palette.lightgray,
    color: palette.lightgray
  };
  
  var toggleButtonHandler = function (e){


    var currentButton = document.getElementById(e.target.id);

    const state = (currentButton.getAttribute("state") === "disabled") ? "enabled" : "disabled";

    currentButton.setAttribute("state", state);

    if (state === "enabled") { 
      // currentButton.style.color = "green";
      // currentButton.style.border = "2px solid green";
      currentButton.style.color = toggleButtonEnabledStyle.color;
      currentButton.style.border = toggleButtonEnabledStyle.border;
    }
    else {
      currentButton.style.color = toggleButtonDisabledStyle.color;
      currentButton.style.border = toggleButtonDisabledStyle.border;
      // currentButton.style.color = "#888888";
      // currentButton.style.border = "2px solid white";
    }

    switch (e.target.id) {
      case "toggleButtonServerDisconnected":
        adminConfig.showDisconnectedServers = (state === "enabled") ? true : false;
      break;

      case "toggleButtonViewerDisconnected":
        adminConfig.showDisconnectedViewers = (state === "enabled") ? true : false;
      break;

      default:
        console.error("toggleButtonHandler: UNKNOWN BUTTON ID: " + e.target.id);
        return;
    }

    console.warn("TOGGLE BUTTON"
     + " | ID: " + e.target.id
     + " | STATE: " + state
    );

  };

function createServerTable(){

  var serverPanelButtonsDiv = document.getElementById("server_panel_buttons");

  var buttonElement = document.createElement("BUTTON");
  buttonElement.className = "button";
  buttonElement.setAttribute("id", "toggleButtonServerDisconnected");
  buttonElement.setAttribute("mode", "toggle");
  buttonElement.setAttribute("state", "disabled");
  buttonElement.addEventListener("click", function(e){ toggleButtonHandler(e); }, false);
  buttonElement.innerHTML = "SHOW DISCONNECTED";
  buttonElement.style.color = toggleButtonDisabledStyle.color;
  buttonElement.style.border = toggleButtonDisabledStyle.border;
  serverPanelButtonsDiv.appendChild(buttonElement);


  //create Tabulator on DOM element with id "example-table"
  $("#servers").tabulator({
    ajaxURL: false,
    height: 240, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout: "fitData", //fit columns to width of table (optional)
    rowFormatter:function(row){
      var data = row.getData();

      switch (data.status) {
        case "DISCONNECTED":
          row.getElement().css({"color": palette.red});
        break;
        case "STATS":
          row.getElement().css({"color": palette.green });
        break;
        case "KEEPALIVE":
          row.getElement().css({"color": palette.lightgray });
        break;
        default:
          row.getElement().css({"color": palette.gray });
      }
    },      
    columns:[ //Define Table Columns
      {title:"SERVER ID", field:"serverId", align:"left"},
      {title:"TYPE", field:"serverType", align:"left"},
      {title:"SOCKET", field:"socket", align:"left"},
      {title:"IP", field:"ipAddress", align:"left"},
      {title:"STATUS", field:"status", align:"left"},
      {title:"LAST SEEN", field:"lastSeen", align:"left"},
      {title:"AGO", field:"ago", align:"right"},
      {title:"UPTIME", field:"upTime", align:"right"}
    ]
  });
}

function createViewerTable(){

  var viewerPanelButtonsDiv = document.getElementById("viewer_panel_buttons");

  var buttonElement = document.createElement("BUTTON");
  buttonElement.className = "button";
  buttonElement.setAttribute("id", "toggleButtonViewerDisconnected");
  buttonElement.setAttribute("mode", "toggle");
  buttonElement.setAttribute("state", "disabled");
  buttonElement.addEventListener("click", function(e){ toggleButtonHandler(e); }, false);
  buttonElement.innerHTML = "SHOW DISCONNECTED";
  buttonElement.style.color = toggleButtonDisabledStyle.color;
  buttonElement.style.border = toggleButtonDisabledStyle.border;
  viewerPanelButtonsDiv.appendChild(buttonElement);

  //create Tabulator on DOM element with id "example-table"
  $("#viewers").tabulator({
    ajaxURL: false,
    height: 240, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout: "fitData", //fit columns to width of table (optional)
    rowFormatter:function(row){
      var data = row.getData();

      switch (data.status) {
        case "DISCONNECTED":
          row.getElement().css({"color":palette.red });
        break;
        case "STATS":
          row.getElement().css({"color": palette.green });
        break;
        case "KEEPALIVE":
          row.getElement().css({"color": palette.lightgray });
        break;
        default:
          row.getElement().css({"color": palette.gray });
      }
    },      
    columns:[ //Define Table Columns
      {title:"VIEWER ID", field:"viewerId", align:"left"},
      {title:"TYPE", field:"viewerType", align:"left"},
      {title:"SOCKET", field:"socket", align:"left"},
      {title:"IP", field:"ipAddress", align:"left"},
      {title:"STATUS", field:"status", align:"left"},
      {title:"LAST SEEN", field:"lastSeen", align:"left"},
      {title:"AGO", field:"ago", align:"right"},
      {title:"UPTIME", field:"upTime", align:"right"}
    ]
  });
}


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

  let viewerTableData = [];

  if (heartBeat.viewers) {

    if (heartBeat.viewers.length === 0){
      viewerSocketHashMap.forEach(function(viewerObj, viewerSocketId){
        viewerObj.status = "UNKNOWN";
        viewerObj.connected = false;
        viewerObj.deleted = true;
        viewerSocketHashMap.set(viewerSocketId, viewerObj);
      });
    }

    let i=0;

    async.eachSeries(heartBeat.viewers, function(viewerSocketEntry, cb){

      const viewerSocketId = viewerSocketEntry[0];
      const currentViewer = viewerSocketEntry[1];

      viewerTypeHashMap.set(currentViewer.type, currentViewer);
      viewerSocketHashMap.set(viewerSocketId, currentViewer);

      totalViewers += 1;
      i += 1;

      if (!adminConfig.showDisconnectedViewers && currentViewer.status === "DISCONNECTED") {
        return async.setImmediate(function() { cb(); });
      }

      viewerTableData.push(
        {
          id: viewerSocketId, 
          viewerId: currentViewer.user.userId,
          viewerType: currentViewer.type,
          socket: currentViewer.socketId,
          ipAddress: currentViewer.ip,
          status: currentViewer.status,
          lastSeen: moment(currentViewer.timeStamp).format(defaultDateTimeFormat),
          ago: msToTime(moment().diff(moment(currentViewer.timeStamp))),
          // upTime: msToTime(currentViewer.user.stats.elapsed)
        }
      );

      async.setImmediate(function() { cb(); });

    }, function(){

      $("#viewers").tabulator("setData", viewerTableData);

      maxViewers = Math.max(maxViewers, totalViewers);
      viewerRatio = totalViewers / maxViewers;
      viewersBarText.innerHTML = totalViewers + " VIEWERS | " + maxViewers + " MAX | " 
        + moment().format(defaultDateTimeFormat);
    });
  }

  // $("#viewers").tabulator("setData", viewerTableData);

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

  let serverTableData = [];

  if (heartBeat.servers) {

    if (heartBeat.servers.length === 0){
      serverSocketHashMap.forEach(function(serverObj, serverSocketId){
        serverObj.status = "UNKNOWN";
        serverObj.connected = false;
        serverObj.deleted = true;
        serverSocketHashMap.set(serverSocketId, serverObj);
      });
    }

    let i=0;

    async.eachSeries(heartBeat.servers, function(serverSocketEntry, cb){

      const serverSocketId = serverSocketEntry[0];
      const currentServer = serverSocketEntry[1];

      serverTypeHashMap.set(currentServer.type, currentServer);
      serverSocketHashMap.set(serverSocketId, currentServer);

      totalServers += 1;
      i += 1;

      if (!adminConfig.showDisconnectedServers && currentServer.status === "DISCONNECTED") {
        return async.setImmediate(function() { cb(); });
      }

      serverTableData.push(
        {
          id: serverSocketId, 
          serverId: currentServer.user.nodeId,
          serverType: currentServer.type,
          socket: serverSocketId,
          ipAddress: currentServer.ip,
          status: currentServer.status,
          lastSeen: moment(currentServer.timeStamp).format(defaultDateTimeFormat),
          ago: msToTime(moment().diff(moment(currentServer.timeStamp))),
          upTime: msToTime(currentServer.user.stats.elapsed)
        }
      );

      async.setImmediate(function() { cb(); });

    }, function(){

      $("#servers").tabulator("setData", serverTableData);

      maxServers = Math.max(maxServers, totalServers);
      serverRatio = totalServers / maxServers;
      serversBarText.innerHTML = totalServers + " SERVERS | " + maxServers + " MAX | " 
        + moment().format(defaultDateTimeFormat);
    });
  }

  // $("#servers").tabulator("setData", null);

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

    tdTimeout[2].style.color = palette.white;
    tdTimeout[2].style.backgroundColor = palette.red;

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

    tdLastTimeout[2].style.color = palette.white;
    tdLastTimeout[2].style.backgroundColor = palette.red;
  }

  tableCreateRow(heatbeatTable, false, ['SERVER TIME', getTimeStamp(heartBeat.serverTime)]);
  tableCreateRow(heatbeatTable, false, ['SERVER UPTIME', msToTime(heartBeat.upTime)]);
  tableCreateRow(heatbeatTable, false, ['APP START TIME', getTimeStamp(heartBeat.startTime)]);
  tableCreateRow(heatbeatTable, false, ['APP RUNTIME', msToTime(heartBeat.runTime)]);


}

function initialize(callback){

  console.debug("INITIALIZE...");

  initBars(function(){
    createServerTable();
    createViewerTable();
    callback();
  });

}