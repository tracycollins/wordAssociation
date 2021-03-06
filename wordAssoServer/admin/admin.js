
/*ver 0.47*/
/*jslint node: true */

/* jshint undef: true, unused: true */
/* globals $, _, document, io, requirejs, moment, HashMap, async, ProgressBar */

"use strict";

const socket = io("/admin");

let memoryAvailable = 0;
let memoryUsed = 0;
// let memoryUsage = {};

let sentAdminReady = false;
let initializeComplete = false;

// const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD_HHmmss";

const palette = {
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
const DEFAULT_TABLE_BG_COLOR = palette.black;
const DEFAULT_TABLE_FONT_SIZE = "1.5em";


let startColor = palette.green;
let midColor = palette.yellow;
let endColor = palette.red;

let colorKeepalive = palette.gray;
let colorStats = palette.lightgray;

const WARN_LIMIT_PERCENT = 80;
const ALERT_LIMIT_PERCENT = 95;

const ONE_MB = 1024 * 1024;
const ONE_GB = ONE_MB * 1024;

// requirejs(
//   ["https://d3js.org/d3.v5.min.js"], 
//   function() {
//     console.debug("d3 LOADED");
//     initialize(function(){
//       initializeComplete = true;
//     });
//   },
//   function(error) {
//     console.log("REQUIREJS ERROR handler", error);
//     let failedId = error.requireModules && error.requireModules[0];
//     console.log(failedId);
//     console.log(error.message);
//   }
// );

let statsObj = {};

statsObj.isAuthenticated = false;

statsObj.socket = {};

statsObj.socket.errors = 0;
statsObj.socket.error = false;
statsObj.socket.errorMoment = moment();

statsObj.socket.connected = true;
statsObj.socket.connects = 0;
statsObj.socket.connectMoment = moment();

statsObj.socket.reconnectMoment = moment();
statsObj.socket.reconnects = 0;

statsObj.socket.disconnectMoment = moment();

const serverSocketHashMap = new HashMap();

const viewerSocketHashMap = new HashMap();

const adminSocketHashMap = new HashMap();

function isObject(obj) {
  return obj === Object(obj);
}

let USER_ID = "ADMIN_" + moment().valueOf();
const SCREEN_NAME = USER_ID;

let mainAdminObj = {};

mainAdminObj.namespace = "admin";
mainAdminObj.adminId = USER_ID;
mainAdminObj.nodeId = USER_ID;
mainAdminObj.userId = USER_ID;
mainAdminObj.screenName = SCREEN_NAME;
mainAdminObj.password = "this is a very weak password";
mainAdminObj.type = "admin";
mainAdminObj.mode = "control";
mainAdminObj.stats = statsObj;

mainAdminObj.tags = {};
mainAdminObj.tags.mode = "control";
mainAdminObj.tags.type = "admin";
mainAdminObj.tags.entity = USER_ID;
mainAdminObj.tags.channel = "admin";

let heartBeatTimeoutFlag = false;
let serverCheckInterval = 1000;
let maxServerHeartBeatWait = 30000;

console.log("ADMIN PAGE");

let adminConfig = {};

let testMode = false;

adminConfig.testMode = testMode;
adminConfig.showDisconnectedServers = false;
adminConfig.showDisconnectedAdmins = false;
adminConfig.showDisconnectedViewers = false;

let memoryBar;
let memoryBarDiv;
let memoryBarText;

let tweetsPerMinBar;
let tweetsPerMinBarDiv;
let tweetsPerMinBarText;

let adminsBar;
let adminsBarDiv;
let adminsBarText;

let serversBar;
let serversBarDiv;
let serversBarText;

let viewersBar;
let viewersBarDiv;
let viewersBarText;

function initBars(callback){
 
  console.debug("INIT BARS ...");

  // VIEWERS ===============================

  viewersBarDiv = document.getElementById("viewers-bar");
  viewersBar = new ProgressBar.Line(viewersBarDiv, { duration: 100 });
  viewersBar.animate(0);
  viewersBarText = document.getElementById("viewers-bar-text");

  // ADMIN ===============================

  adminsBarDiv = document.getElementById("admins-bar");
  adminsBar = new ProgressBar.Line(adminsBarDiv, { duration: 100 });
  adminsBar.animate(0);
  adminsBarText = document.getElementById("admins-bar-text");

  // SERVER ===============================

  serversBarDiv = document.getElementById("servers-bar");
  serversBar = new ProgressBar.Line(serversBarDiv, { duration: 100 });
  serversBar.animate(0);
  serversBarText = document.getElementById("servers-bar-text");

  // MEMORY ===============================

  memoryBarDiv = document.getElementById("memory-bar");
  memoryBarText = document.getElementById("memory-bar-text");
  memoryBar = new ProgressBar.Line(memoryBarDiv, { duration: 100 });
  memoryBar.animate(0);

  tweetsPerMinBarDiv = document.getElementById("delta-tweet-bar");
  tweetsPerMinBarText = document.getElementById("delta-tweet-bar-text");
  tweetsPerMinBar = new ProgressBar.Line(tweetsPerMinBarDiv, { duration: 100 });
  tweetsPerMinBar.animate(0);

  callback();
}

let heartBeat = {};
let lastTimeoutHeartBeat = null;

let hbIndex = 0;
let tweetsPerMin = 0;
let tweetsPerMinMax = 1;
let tweetsPerMinMaxTime = 0;

const jsonPrint = function(obj, options) {

  if (options) {
    if (options.ignore) {

      let tempObj = obj;

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
  let cDate, cTime;
  const options = {
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
    cTime = new Date().toTimeString("en-US", options);
  } else {
    cDate = new Date(inputTime).toDateString("en-US", options);
    cTime = new Date(inputTime).toTimeString("en-US", options);
  }
  return cDate + " - " + cTime;
}

function msToTime(duration) {
  // let milliseconds = parseInt((duration % 1000) / 100);
  let seconds = parseInt((duration / 1000) % 60);
  let minutes = parseInt((duration / (1000 * 60)) % 60);
  let hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  let days = parseInt(duration / (1000 * 60 * 60 * 24));

  let daysInt = days;
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

  if (statsObj.socket.connected && initializeComplete) {
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

  let tr = parentTable.insertRow();

  const textColor = options.textColor || DEFAULT_TABLE_TEXT_COLOR;
  const bgColor = options.bgColor || DEFAULT_TABLE_BG_COLOR;
  const fontSize = options.fontSize || DEFAULT_TABLE_FONT_SIZE;
  
  if (options.class) {
    tr.setAttribute("class", options.class);
  }

  if (options.id) {
    tr.setAttribute("id", options.id);
  }


  cellContentArray.forEach(function(content) {

    let cell = tr.insertCell();

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

  mainAdminObj.stats = statsObj;

  if (statsObj.socket.connected && initializeComplete) {
  }
  if (initializeComplete && !sentAdminReady) {
    socket.emit("ADMIN_READY", mainAdminObj);
    sentAdminReady = true;
    console.debug("TX ADMIN_READY\n" + jsonPrint(mainAdminObj));
  }
}, 1000);


setInterval(function() {

  mainAdminObj.stats = statsObj;

  if (statsObj.socket.connected && sentAdminReady) {
    // socket.emit("SESSION_KEEPALIVE", mainAdminObj);
    socket.emit(
      "SESSION_KEEPALIVE", 
      {
        user: mainAdminObj, 
        stats: {}, 
        results: {}
      }
    );
  }
}, 10000);


socket.on("error", function(err) {

  console.log("\n===== ADMIN SERVER SOCKET ERROR =====\n" + getTimeStamp());

  statsObj.socket.errors += 1;
  statsObj.socket.error = err;
  statsObj.socket.errorMoment = moment();
});

socket.on("connect", function() {

  console.log("\n===== ADMIN SERVER CONNECTED =====\n" + getTimeStamp());

  statsObj.socket.connected = true;
  statsObj.socket.connects += 1;
  statsObj.socket.connectMoment = moment();

  socket.emit("authentication", mainAdminObj);

});

socket.on("reconnect", function() {

  console.log("\n===== ADMIN SERVER RECONNECTED =====\n" + getTimeStamp());

  // serverClear();
  // socket.emit("ADMIN_READY", mainAdminObj);

  // console.log("TX ADMIN_READY\n" + jsonPrint(mainAdminObj));

  // sentAdminReady = true;
  // statsObj.socket.connected = true;
  // statsObj.socket.reconnects += 1;
  // statsObj.socket.reconnectMoment = moment();

  mainAdminObj.socketId = socket.id;

  statsObj.serverConnected = true;
  console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

  statsObj.socket.reconnectMoment = moment();
  statsObj.socket.reconnects += 1;

  mainAdminObj.timeStamp = moment().valueOf();
  mainAdminObj.stats = statsObj;

  socket.emit("authentication", mainAdminObj);

});

socket.on("disconnect", function() {
  console.log("\n***** SERVER DISCONNECTED *****\n" + getTimeStamp());
  serverClear();
  sentAdminReady = false;

  statsObj.socket.connected = false;
  statsObj.socket.disconnectMoment = moment();
});

socket.on("unauthorized", function(response) {
  statsObj.isAuthenticated = false;
  console.log("UNAUTHORIZED | " + socket.id + " | " + jsonPrint(response));
});

socket.on("authenticated", function() {
  console.log("AUTHENTICATED | " + socket.id);
  statsObj.isAuthenticated = true;
  console.log( "CONNECTED TO HOST" 
    + " | ID: " + socket.id 
  );
});

socket.on("ADMIN_CONFIG", function(rxAdminConfig) {
  console.log("\n*** RX ADMIN CONFIG ***\n" + JSON.stringify(rxAdminConfig, null, 3));
  updateAdminConfig(rxAdminConfig);
});

socket.on("DROPBOX_CHANGE", function(dataObj) {
  console.log("\n*** RX DROPBOX_CHANGE ***\n" + JSON.stringify(dataObj, null, 3));
});

socket.on("CONFIG_CHANGE", function(rxAdminConfig) {
  let previousProperty;

  console.log("\n*** RX ADMIN CONFIG CHANGE ***\n" + JSON.stringify(rxAdminConfig, null, 3));

  console.log("\nPREVIOUS ADMIN CONFIG:\n" + JSON.stringify(adminConfig, null, 3));
  for (const configPropertyName in rxAdminConfig) {
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

socket.on("ADMIN IP", function(rxIpObj) {

  const adminSessionObj = JSON.parse(rxIpObj);

  console.log("RXCD ADMIN IP  " + adminSessionObj.ip + " | " + adminSessionObj.domain);

  let adminIpObj = {};
  adminIpObj.ip = adminSessionObj.ip;
  adminIpObj.domain = adminSessionObj.domain;
  adminIpObj.sessions = {};

  adminIpObj.sessions[adminSessionObj.sessionId] = adminSessionObj;

  adminSocketHashMap.set(adminSessionObj.sessionId, adminIpObj);
});

socket.on("ADMIN_ACK", function(adminSessionKey) {

  console.log("RXCD ADMIN ACK: " + socket.id + " | KEY: " + adminSessionKey);
});

socket.on("ADMIN_SESSION", function(adminSessionObj) {

  console.log("RX ADMIN SESSION: " + adminSessionObj.sessionId + " | UID: " + adminSessionObj.userId);

  let adminIpObj = {};
  adminIpObj.ip = adminSessionObj.ip;
  adminIpObj.domain = adminSessionObj.domain;
  adminIpObj.sessions = {};

  adminIpObj.sessions[adminSessionObj.sessionId] = adminSessionObj;

  adminSocketHashMap.set(adminSessionObj.sessionId, adminIpObj);
});

socket.on("SERVER_EXPIRED", function(serverObj) {
  console.log("SERVER_EXPIRED | " + serverObj.socketId + " | " + serverObj.user.userId);

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.warn("SERVER_EXPIRED | SERVER NOT FOUND IN HM | " + serverObj.user.userId);
  }

  let sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "EXPIRED";

  serverSocketHashMap.set(sObj.socketId, sObj);
});

socket.on("SERVER_STATS", function(serverObj) {

  // console.debug("SERVER_STATS\n" + jsonPrint(serverObj));
  console.debug("SERVER_STATS | " + serverObj.socketId + " | " + serverObj.user.userId);

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_STATS | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  let sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "STATS";
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;
  sObj.stats = serverObj.stats;
  sObj.timeStamp = serverObj.timeStamp;

  serverSocketHashMap.set(sObj.socketId, sObj);
});

socket.on("TWITTER_TOPTERM_1MIN", function(top10array) {
  console.debug("TWITTER_TOPTERM_1MIN\n" + jsonPrint(top10array));
});

socket.on("SERVER_ERROR", function(serverObj) {

  console.debug("SERVER_ERROR\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_ERROR | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  let sObj = serverSocketHashMap.get(serverObj.socketId);

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
    document.getElementById(serverObj.socketId + "_timeStamp").innerHTML = moment(sObj.timeStamp).format(compactDateTimeFormat);
    document.getElementById(serverObj.socketId + "_ago").innerHTML = msToTime(moment().diff(moment(sObj.timeStamp)));
  }
});

socket.on("SERVER_DISCONNECT", function(serverObj) {

  console.debug("SERVER_DISCONNECT\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_DISCONNECT | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  let sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "DISCONNECTED";
  sObj.timeStamp = serverObj.timeStamp;
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;

  serverSocketHashMap.set(sObj.socketId, sObj);
});

socket.on("VIEWER_DISCONNECT", function(viewerObj) {

  console.debug("VIEWER_DISCONNECT\n" + jsonPrint(viewerObj));

  if (!viewerSocketHashMap.has(viewerObj.socketId)) {
    console.debug("VIEWER_DISCONNECT | VIEWER NOT FOUND IN HM\n" + jsonPrint(viewerObj));
    return;
  }

  let sObj = viewerSocketHashMap.get(viewerObj.socketId);

  sObj.status = "DISCONNECTED";
  sObj.timeStamp = viewerObj.timeStamp;
  sObj.type = viewerObj.type;
  sObj.user = viewerObj.user;

  viewerSocketHashMap.set(sObj.socketId, sObj);
});

socket.on("SERVER_DELETE", function(serverObj) {

  console.debug("SERVER_DELETE\n" + jsonPrint(serverObj));

  if (!serverSocketHashMap.has(serverObj.socketId)) {
    console.debug("SERVER_DELETE | SERVER NOT FOUND IN HM\n" + jsonPrint(serverObj));
    return;
  }

  let sObj = serverSocketHashMap.get(serverObj.socketId);

  sObj.status = "DELETED";
  sObj.timeStamp = serverObj.timeStamp;
  sObj.type = serverObj.type;
  sObj.user = serverObj.user;

  serverSocketHashMap.set(sObj.socketId, sObj);
});

socket.on("SERVER_ADD", function(serverObj) {
  console.debug("SERVER_ADD\n" + jsonPrint(serverObj));
  serverSocketHashMap.set(serverObj.socketId, serverObj);
});

socket.on("VIEWER_ADD", function(viewerObj) {
  console.debug("VIEWER_ADD\n" + jsonPrint(viewerObj));
  viewerSocketHashMap.set(viewerObj.socketId, viewerObj);
});

socket.on("KEEPALIVE", function(serverObj) {
  console.debug("KEEPALIVE | " + serverObj.type + " | " + serverObj.user.nodeId);

  if (serverObj.socketId === socket.id){
    // console.warn("KEEPALIVE LOOPBACK "  + serverObj.socketId + " | " + serverObj.user.nodeId);
  }
  else if (adminSocketHashMap.has(serverObj.socketId)){

    let sObj = adminSocketHashMap.get(serverObj.socketId);
    sObj.timeStamp = serverObj.timeStamp;
    sObj.type = serverObj.type;
    sObj.user = serverObj.user;
    sObj.status = serverObj.status;

    adminSocketHashMap.set(serverObj.socketId, sObj);
  }
  else if (serverSocketHashMap.has(serverObj.socketId)){

    let sObj = serverSocketHashMap.get(serverObj.socketId);
    sObj.timeStamp = serverObj.timeStamp;
    sObj.type = serverObj.type;
    sObj.user = serverObj.user;
    sObj.status = serverObj.status;

    serverSocketHashMap.set(serverObj.socketId, sObj);
  }
  else if (viewerSocketHashMap.has(serverObj.socketId)){

    let sObj = viewerSocketHashMap.get(serverObj.socketId);
    sObj.status = serverObj.status;
    sObj.timeStamp = serverObj.timeStamp;
    sObj.type = serverObj.type;
    sObj.user = serverObj.user;
    sObj.status = serverObj.status;

    viewerSocketHashMap.set(serverObj.socketId, sObj);
  }
  else {
    console.warn("KEEPALIVE SERVER NOT IN HASHMAP | " + serverObj.socketId + " | " + serverObj.type);
  }
});

let heartBeatQueue = [];

socket.on("HEARTBEAT", function(rxHeartbeat) {

  heartBeatQueue.push(rxHeartbeat);

  while (heartBeatQueue.length > 60) {
    heartBeatQueue.shift();
  }
});

let heartBeatQueueReady = true;

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

setInterval(function() {

  if (Date.now() > (heartBeat.timeStamp + maxServerHeartBeatWait)) {
    heartBeatTimeoutFlag = true;
    lastTimeoutHeartBeat = heartBeat;
    console.error("***** SERVER HEARTBEAT TIMEOUT ***** " + getTimeStamp() + " | LAST SEEN: " + getTimeStamp(heartBeat.timeStamp) + msToTime(Date.now() - heartBeat.timeStamp) + " AGO");
  }
  if (heartBeat !== undefined) { updateServerHeartbeat(heartBeat, heartBeatTimeoutFlag, lastTimeoutHeartBeat); }

}, serverCheckInterval);

function setTestMode(inputTestMode) {

  let serverConfigUpdateFlag = false;

  if (inputTestMode !== undefined) {
    serverConfigUpdateFlag = true;
    testMode = inputTestMode;
  } else {
    testMode = !testMode;
  }

  console.log("testMode: " + testMode);

  const config = {
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

  function disconnectedFilter(data){
    return data.status !== "DISCONNECTED";
  }
  
  const toggleButtonHandler = function (e){


    const currentButton = document.getElementById(e.target.id);

    const state = (currentButton.getAttribute("state") === "disabled") ? "enabled" : "disabled";

    currentButton.setAttribute("state", state);

    if (state === "enabled") { 
      currentButton.style.color = toggleButtonEnabledStyle.color;
      currentButton.style.border = toggleButtonEnabledStyle.border;
    }
    else {
      currentButton.style.color = toggleButtonDisabledStyle.color;
      currentButton.style.border = toggleButtonDisabledStyle.border;
    }

    switch (e.target.id) {
      case "toggleButtonAdminDisconnected":

        adminConfig.showDisconnectedAdmins = (state === "enabled") ? true : false;

        if (!adminConfig.showDisconnectedAdmins) {
          $("#admins").tabulator("setFilter", disconnectedFilter);
        }
        else {
          $("#admins").tabulator("removeFilter", disconnectedFilter);
        }

      break;

      case "toggleButtonServerDisconnected":

        adminConfig.showDisconnectedServers = (state === "enabled") ? true : false;

        if (!adminConfig.showDisconnectedServers) {
          $("#servers").tabulator("setFilter", disconnectedFilter);
        }
        else {
          $("#servers").tabulator("removeFilter", disconnectedFilter);
        }

      break;

      case "toggleButtonViewerDisconnected":

        adminConfig.showDisconnectedViewers = (state === "enabled") ? true : false;

        if (!adminConfig.showDisconnectedViewers) {
          $("#viewers").tabulator("setFilter", disconnectedFilter);
        }
        else {
          $("#viewers").tabulator("removeFilter", disconnectedFilter);
        }

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

function createAdminTable(){

  let adminPanelButtonsDiv = document.getElementById("admin_panel_buttons");

  let buttonElement = document.createElement("BUTTON");
  buttonElement.className = "button";
  buttonElement.setAttribute("id", "toggleButtonAdminDisconnected");
  buttonElement.setAttribute("mode", "toggle");
  buttonElement.setAttribute("state", "disabled");
  buttonElement.addEventListener("click", function(e){ toggleButtonHandler(e); }, false);
  buttonElement.innerHTML = "SHOW DISCONNECTED";
  buttonElement.style.color = toggleButtonDisabledStyle.color;
  buttonElement.style.border = toggleButtonDisabledStyle.border;
  adminPanelButtonsDiv.appendChild(buttonElement);

  $("#admins").tabulator({
    index: "socket",
    ajaxURL: false,
    height: 120, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout: "fitData", //fit columns to width of table (optional)
    layoutColumnsOnNewData:true,
    rowFormatter:function(row){
      const data = row.getData();

      switch (data.status) {
        case "DISCONNECTED":
          row.getElement().css({"color": palette.red});
        break;
        case "STATS":
          row.getElement().css({"color": palette.green });
        break;
        case "KEEPALIVE":
          row.getElement().css({"color": colorKeepalive });
        break;
        default:
          row.getElement().css({"color": palette.gray });
      }
    },      
    columns:[ //Define Table Columns
      {title:"ADMIN ID", field:"adminId", align:"left"},
      {title:"TYPE", field:"adminType", align:"left"},
      {title:"SOCKET", field:"socket", align:"left"},
      {title:"IP", field:"ipAddress", align:"left"},
      {title:"STATUS", field:"status", align:"left"},
      {title:"LAST SEEN", field:"lastSeen", align:"left"},
      {title:"AGO", field:"ago", align:"right"},
      {title:"CONNECT", field:"connect", align:"right"}
    ]
  });

  if (!adminConfig.showDisconnectedAdmins) {
    $("#admins").tabulator("setFilter", disconnectedFilter);
  }
  else {
    $("#admins").tabulator("removeFilter", disconnectedFilter);
  }
}

function createServerTable(){

  let serverPanelButtonsDiv = document.getElementById("server_panel_buttons");

  let buttonElement = document.createElement("BUTTON");
  buttonElement.className = "button";
  buttonElement.setAttribute("id", "toggleButtonServerDisconnected");
  buttonElement.setAttribute("mode", "toggle");
  buttonElement.setAttribute("state", "disabled");
  buttonElement.addEventListener("click", function(e){ toggleButtonHandler(e); }, false);
  buttonElement.innerHTML = "SHOW DISCONNECTED";
  buttonElement.style.color = toggleButtonDisabledStyle.color;
  buttonElement.style.border = toggleButtonDisabledStyle.border;
  serverPanelButtonsDiv.appendChild(buttonElement);

  $("#servers").tabulator({
    index: "socket",
    ajaxURL: false,
    height: 240, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout: "fitData", //fit columns to width of table (optional)
    layoutColumnsOnNewData:true,
    rowFormatter:function(row){
      const data = row.getData();

      switch (data.status) {
        case "DISCONNECTED":
          row.getElement().css({"color": palette.red});
        break;
        case "STATS":
          row.getElement().css({"color": colorStats });
        break;
        case "KEEPALIVE":
          row.getElement().css({"color": colorKeepalive });
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

  if (!adminConfig.showDisconnectedServers) {
    $("#servers").tabulator("setFilter", disconnectedFilter);
  }
  else {
    $("#servers").tabulator("removeFilter", disconnectedFilter);
  }
}

function createViewerTable(){

  let viewerPanelButtonsDiv = document.getElementById("viewer_panel_buttons");

  let buttonElement = document.createElement("BUTTON");
  buttonElement.className = "button";
  buttonElement.setAttribute("id", "toggleButtonViewerDisconnected");
  buttonElement.setAttribute("mode", "toggle");
  buttonElement.setAttribute("state", "disabled");
  buttonElement.addEventListener("click", function(e){ toggleButtonHandler(e); }, false);
  buttonElement.innerHTML = "SHOW DISCONNECTED";
  buttonElement.style.color = toggleButtonDisabledStyle.color;
  buttonElement.style.border = toggleButtonDisabledStyle.border;
  viewerPanelButtonsDiv.appendChild(buttonElement);

  $("#viewers").tabulator({
    index: "socket",
    ajaxURL: false,
    height: 240, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout: "fitData", //fit columns to width of table (optional)
    layoutColumnsOnNewData: true,
    rowFormatter:function(row){
      const data = row.getData();

      switch (data.status) {
        case "DISCONNECTED":
          row.getElement().css({"color": palette.red });
        break;
        case "STATS":
          row.getElement().css({"color": colorStats });
        break;
        case "KEEPALIVE":
          row.getElement().css({"color": colorKeepalive });
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
      {title:"CONNECT", field:"connect", align:"right"}
    ]
  });

  if (!adminConfig.showDisconnectedViewers) {
    $("#viewers").tabulator("setFilter", disconnectedFilter);
  }
  else {
    $("#viewers").tabulator("removeFilter", disconnectedFilter);
  }
}


let adminRatio = 0;
let totalAdmins = 0;
let maxAdmins = 0;

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
      "HEAP (GB)" 
        + " | " + (heartBeat.memory.memoryUsage.rss / ONE_GB).toFixed(2) + " TOT" 
        + " | " + (heartBeat.memory.memoryUsage.heapUsed / ONE_GB).toFixed(2) + " USED" + " (" + (100 * memoryUsed).toFixed(1) + " %)" 
        + " | " + ((heartBeat.memory.memoryUsage.rss - heartBeat.memory.memoryUsage.heapUsed) / ONE_GB).toFixed(2) + " AVAIL" + " (" + (100 * memoryAvailable).toFixed(2) + " %)";
  }

  if (memoryBar) { memoryBar.animate(memoryUsed); }

  if (100 * memoryUsed >= ALERT_LIMIT_PERCENT) {
    memoryBar.path.setAttribute("stroke", endColor);
  } else if (100 * memoryUsed >= WARN_LIMIT_PERCENT) {
    memoryBar.path.setAttribute("stroke", midColor);
  } else {
    memoryBar.path.setAttribute("stroke", startColor);
  }

  // // ADMINS ==========================

  adminsBar.animate(adminRatio);

  if (100 * adminRatio >= ALERT_LIMIT_PERCENT) {
    adminsBar.path.setAttribute("stroke", endColor);
  } else if (100 * adminRatio >= WARN_LIMIT_PERCENT) {
    adminsBar.path.setAttribute("stroke", midColor);
  } else {
    adminsBar.path.setAttribute("stroke", startColor);
  }

  totalAdmins = 0;

  if (heartBeat.admins) {

    if (heartBeat.admins.length === 0){
      adminSocketHashMap.forEach(function(adminObj, adminSocketId){
        adminObj.status = "UNKNOWN";
        adminObj.connected = false;
        adminObj.deleted = true;
        adminSocketHashMap.set(adminSocketId, adminObj);
      });
    }

    let tableEntry = {};

    async.each(heartBeat.admins, function(adminSocketEntry, cb){

      const adminSocketId = adminSocketEntry[0];
      let currentAdmin = adminSocketEntry[1];

      if (!currentAdmin || (currentAdmin === undefined)) {
        console.warn("UNDEFINED ADMIN: " + adminSocketId);
        currentAdmin.type = "UNKNOWN";
      }

      const connectTime = _.has(currentAdmin, "user.stats.socket.connectMoment") ? moment().diff(moment(currentAdmin.user.stats.socket.connectMoment)) : 0;

      tableEntry = {
        id: adminSocketId, 
        adminId: currentAdmin.user.nodeId,
        adminType: currentAdmin.type,
        socket: adminSocketId,
        ipAddress: currentAdmin.ip,
        status: currentAdmin.status,
        lastSeen: moment(currentAdmin.timeStamp).format(compactDateTimeFormat),
        ago: msToTime(moment().diff(moment(currentAdmin.timeStamp))),
        connect: msToTime(connectTime)
      };

      if (adminSocketHashMap.has(adminSocketId)) {
        $("#admins").tabulator("updateOrAddData", [tableEntry]);
      }
      else {
        $("#admins").tabulator("addData", [tableEntry], true);
      }

      adminSocketHashMap.set(adminSocketId, currentAdmin);

      async.setImmediate(function() { cb(); });

    }, function(){

      maxAdmins = Math.max(maxAdmins, totalAdmins);

      adminRatio = totalAdmins / maxAdmins;

      adminsBarText.innerHTML = totalAdmins + " ADMINS | " + maxAdmins + " MAX | " + moment().format(compactDateTimeFormat);

      $("#admins").tabulator("redraw");

    });
  }

  // // VIEWERS ==========================

  viewersBar.animate(viewerRatio);

  if (100 * viewerRatio >= ALERT_LIMIT_PERCENT) {
    viewersBar.path.setAttribute("stroke", endColor);
  } else if (100 * viewerRatio >= WARN_LIMIT_PERCENT) {
    viewersBar.path.setAttribute("stroke", midColor);
  } else {
    viewersBar.path.setAttribute("stroke", startColor);
  }

  totalViewers = 0;

  if (heartBeat.viewers) {

    if (heartBeat.viewers.length === 0){
      viewerSocketHashMap.forEach(function(viewerObj, viewerSocketId){
        viewerObj.status = "UNKNOWN";
        viewerObj.connected = false;
        viewerObj.deleted = true;
        viewerSocketHashMap.set(viewerSocketId, viewerObj);
      });
    }

    let tableEntry = {};

    async.each(heartBeat.viewers, function(viewerSocketEntry, cb){

      const viewerSocketId = viewerSocketEntry[0];
      let currentViewer = viewerSocketEntry[1];

      if (!currentViewer || (currentViewer === undefined)) {
        console.warn("UNDEFINED VIEWER: " + viewerSocketId);
        currentViewer.type = "UNKNOWN";
      }

      const connectTime = _.has(currentViewer, "user.stats.socket.connectMoment") ? moment().diff(moment(currentViewer.user.stats.socket.connectMoment)) : 0;

      tableEntry = {
        id: viewerSocketId, 
        viewerId: currentViewer.user.nodeId,
        viewerType: currentViewer.type,
        socket: viewerSocketId,
        ipAddress: currentViewer.ip,
        status: currentViewer.status,
        lastSeen: moment(currentViewer.timeStamp).format(compactDateTimeFormat),
        ago: msToTime(moment().diff(moment(currentViewer.timeStamp))),
        connect: msToTime(connectTime)
      };

      if (viewerSocketHashMap.has(viewerSocketId)) {
        $("#viewers").tabulator("updateOrAddData", [tableEntry]);
      }
      else {
        $("#viewers").tabulator("addData", [tableEntry], true);
      }

      viewerSocketHashMap.set(viewerSocketId, currentViewer);

      async.setImmediate(function() { cb(); });

    }, function(){

      maxViewers = Math.max(maxViewers, totalViewers);

      viewerRatio = totalViewers / maxViewers;

      viewersBarText.innerHTML = totalViewers + " VIEWERS | " + maxViewers + " MAX | " + moment().format(compactDateTimeFormat);

      $("#viewers").tabulator("redraw");

    });
  }

  // SERVERS =========================

  serversBar.animate(serverRatio);

  if (100 * serverRatio >= ALERT_LIMIT_PERCENT) {
    serversBar.path.setAttribute("stroke", endColor);
  } else if (100 * serverRatio >= WARN_LIMIT_PERCENT) {
    serversBar.path.setAttribute("stroke", midColor);
  } else {
    serversBar.path.setAttribute("stroke", startColor);
  }

  totalServers = 0;

  if (heartBeat.servers) {

    if (heartBeat.servers.length === 0){
      serverSocketHashMap.forEach(function(serverObj, serverSocketId){
        serverObj.status = "UNKNOWN";
        serverObj.connected = false;
        serverObj.deleted = true;
        serverSocketHashMap.set(serverSocketId, serverObj);
      });
    }

    let tableEntry = {};

    async.each(heartBeat.servers, function(serverSocketEntry, cb){

      const serverSocketId = serverSocketEntry[0];
      let currentServer = serverSocketEntry[1];

      if (!currentServer || (currentServer === undefined)) {
        console.warn("UNDEFINED SERVER: " + serverSocketId);
        currentServer.type = "UNKNOWN";
      }

      tableEntry = {
        id: serverSocketId, 
        serverId: currentServer.user.nodeId,
        serverType: currentServer.type,
        socket: serverSocketId,
        ipAddress: currentServer.ip,
        status: currentServer.status,
        lastSeen: moment(currentServer.timeStamp).format(compactDateTimeFormat),
        ago: msToTime(moment().diff(moment(currentServer.timeStamp))),
        // upTime: msToTime(currentServer.user.stats.elapsed)
        upTime: msToTime(currentServer.stats.elapsed)
      };

      if (serverSocketHashMap.has(serverSocketId)) {
        $("#servers").tabulator("updateOrAddData", [tableEntry]);
      }
      else {
        $("#servers").tabulator("addData", [tableEntry], true);
      }

      serverSocketHashMap.set(serverSocketId, currentServer);

      async.setImmediate(function() { cb(); });

    }, function(){

      maxServers = Math.max(maxServers, totalServers);

      serverRatio = totalServers / maxServers;

      serversBarText.innerHTML = totalServers + " SERVERS | " + maxServers + " MAX | " + moment().format(compactDateTimeFormat);

      $("#servers").tabulator("redraw");

    });
  }


  // WORDS =========================
  
  tweetsPerMinBar.animate(tweetsPerMin / tweetsPerMinMax);

  if (tweetsPerMin >= 0.01*ALERT_LIMIT_PERCENT * tweetsPerMinMax) {
    tweetsPerMinBar.path.setAttribute("stroke", endColor);
  } 
  else if (tweetsPerMin >= 0.01*WARN_LIMIT_PERCENT * tweetsPerMinMax) {
    tweetsPerMinBar.path.setAttribute("stroke", midColor);
  } 
  else {
    tweetsPerMinBar.path.setAttribute("stroke", startColor);
  }

  tweetsPerMinBarText.innerHTML = parseInt(tweetsPerMin) + " TPM | " 
    + parseInt(tweetsPerMinMax) + " MAX" + " | " 
    + moment(tweetsPerMinMaxTime).format(compactDateTimeFormat);

  let heatbeatTable = document.getElementById("heartbeat_table");

  while (heatbeatTable.childNodes.length > 0) {
    heatbeatTable.removeChild(heatbeatTable.firstChild);
  }

  tableCreateRow(heatbeatTable, false, ["LOCAL TIME", getTimeStamp()]);

  if (timeoutFlag) {

    tableCreateRow(
      heatbeatTable, 
      false, 
      [
        "*** SERVER TIMEOUT ***", 
        (msToTime(Date.now() - heartBeat.timeStamp)) + " AGO"
      ]
    );

    let tdTimeout = heatbeatTable.getElementsByTagName("td");

    tdTimeout[2].style.color = palette.white;
    tdTimeout[2].style.backgroundColor = palette.red;

  } 
  else if (lastTimeoutHeartBeat) {

    tableCreateRow(
      heatbeatTable,
      false, 
      [
        "* SERVER TIMEOUT *",
        getTimeStamp(lastTimeoutHeartBeat.timeStamp),
        msToTime(Date.now() - lastTimeoutHeartBeat.timeStamp) + " AGO"
      ]);

    let tdLastTimeout = heatbeatTable.getElementsByTagName("td");

    tdLastTimeout[2].style.color = palette.white;
    tdLastTimeout[2].style.backgroundColor = palette.red;
  }

  tableCreateRow(heatbeatTable, false, ["SERVER TIME", getTimeStamp(heartBeat.serverTime)]);
  tableCreateRow(heatbeatTable, false, ["SERVER UPTIME", msToTime(heartBeat.upTime)]);
  tableCreateRow(heatbeatTable, false, ["APP START TIME", getTimeStamp(heartBeat.startTime)]);
  tableCreateRow(heatbeatTable, false, ["APP RUNTIME", msToTime(heartBeat.runTime)]);
}

function initialize(callback){

  console.debug("INITIALIZE...");

  initBars(function(){

    createAdminTable();

    createServerTable();

    createViewerTable();

    callback();
  });
}

requirejs(
  ["https://d3js.org/d3.v5.min.js"], 
  function() {
    console.debug("d3 LOADED");
    initialize(function(){
      initializeComplete = true;
    });
  },
  function(error) {
    console.log("REQUIREJS ERROR handler", error);
    const failedId = error.requireModules && error.requireModules[0];
    console.log(failedId);
    console.log(error.message);
  }
);
