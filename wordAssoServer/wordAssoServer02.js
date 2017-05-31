/*jslint node: true */
"use strict";

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var compactDateTimeFormat = "YYYYMMDD HHmmss";

var internetReady = false;
var ioReady = false;

var configuration = {};
configuration.quitOnError = false;

var chalk = require("chalk");
var moment = require("moment");

var internetCheckInterval;

var config = require("./config/config");
var os = require("os");
var HashMap = require("hashmap").HashMap;
var debug = require("debug")("wa");

var express = require("./config/express");
var EventEmitter2 = require("eventemitter2").EventEmitter2;

var app = express();

var http = require("http");
var httpServer = http.createServer(app);

var io;
var net = require("net");

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

var chalkAdmin = chalk.bold.cyan;
var chalkConnect = chalk.black;
var chalkSession = chalk.black;
var chalkDisconnect = chalk.black;
var chalkSocket = chalk.black;
var chalkInfo = chalk.gray;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkLog = chalk.gray;

var localHostHashMap = new HashMap();


var jsonPrint = function (obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

function quit(message) {
  debug("\n... QUITTING ...");
  var msg = "";
  if (message) {msg = message;}
  debug("QUIT MESSAGE: " + msg);
  process.exit();
}

process.on("message", function(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    debug("\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n");
    debug("... SAVING STATS");

    clearInterval(initInternetCheckInterval);

    setTimeout(function() {
      debug("**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n");
      quit(msg);
    }, 300);

  }
});

// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  var seconds = parseInt((duration / 1000) % 60);
  var minutes = parseInt((duration / (1000 * 60)) % 60);
  var hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  var days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

var statsObj = {};

statsObj.hostname = hostname;
statsObj.name = "Word Association Server Status";
statsObj.startTime = moment().valueOf();
statsObj.timeStamp = moment().format(compactDateTimeFormat);
statsObj.upTime = os.uptime() * 1000;
statsObj.runTime = 0;
statsObj.runTimeArgs = process.argv;

statsObj.wordsPerMin = 0;
statsObj.maxWordsPerMin = 0;
statsObj.maxWordsPerMinTime = moment().valueOf();

statsObj.caches = {};
statsObj.caches.adminCache = {};
statsObj.caches.adminCache.stats = {};
statsObj.caches.adminCache.stats.keys = 0;
statsObj.caches.adminCache.stats.keysMax = 0;
statsObj.caches.entityCache = {};
statsObj.caches.entityCache.stats = {};
statsObj.caches.entityCache.stats.keys = 0;
statsObj.caches.entityCache.stats.keysMax = 0;
statsObj.caches.groupCache = {};
statsObj.caches.groupCache.stats = {};
statsObj.caches.groupCache.stats.keys = 0;
statsObj.caches.groupCache.stats.keysMax = 0;
statsObj.caches.ipAddressCache = {};
statsObj.caches.ipAddressCache.stats = {};
statsObj.caches.ipAddressCache.stats.keys = 0;
statsObj.caches.ipAddressCache.stats.keysMax = 0;
statsObj.caches.sessionCache = {};
statsObj.caches.sessionCache.stats = {};
statsObj.caches.sessionCache.stats.keys = 0;
statsObj.caches.sessionCache.stats.keysMax = 0;
statsObj.caches.userCache = {};
statsObj.caches.userCache.stats = {};
statsObj.caches.userCache.stats.keys = 0;
statsObj.caches.userCache.stats.keysMax = 0;
statsObj.caches.utilCache = {};
statsObj.caches.utilCache.stats = {};
statsObj.caches.utilCache.stats.keys = 0;
statsObj.caches.utilCache.stats.keysMax = 0;
statsObj.caches.viewerCache = {};
statsObj.caches.viewerCache.stats = {};
statsObj.caches.viewerCache.stats.keys = 0;
statsObj.caches.viewerCache.stats.keysMax = 0;
statsObj.caches.wordCache = {};
statsObj.caches.wordCache.stats = {};
statsObj.caches.wordCache.stats.keys = 0;
statsObj.caches.wordCache.stats.keysMax = 0;
statsObj.caches.wordsPerMinuteTopTermCache = {};
statsObj.caches.wordsPerMinuteTopTermCache.stats = {};
statsObj.caches.wordsPerMinuteTopTermCache.stats.keys = 0;
statsObj.caches.wordsPerMinuteTopTermCache.stats.keysMax = 0;

statsObj.db = {};
statsObj.db.errors = 0;
statsObj.db.totalAdmins = 0;
statsObj.db.totalUsers = 0;
statsObj.db.totalViewers = 0;
statsObj.db.totalGroups = 0;
statsObj.db.totalSessions = 0;
statsObj.db.totalWords = 0;
statsObj.db.wordsUpdated = 0;

statsObj.entity = {};

statsObj.entity.admin = {};
statsObj.entity.admin.connected = 0;
statsObj.entity.admin.connectedMax = 0.1;
statsObj.entity.admin.connectedMaxTime = moment().valueOf();

statsObj.entity.user = {};
statsObj.entity.user.connected = 0;
statsObj.entity.user.connectedMax = 0.1;
statsObj.entity.user.connectedMaxTime = moment().valueOf();

statsObj.entity.util = {};
statsObj.entity.util.connected = 0;
statsObj.entity.util.connectedMax = 0.1;
statsObj.entity.util.connectedMaxTime = moment().valueOf();

statsObj.entity.viewer = {};
statsObj.entity.viewer.connected = 0;
statsObj.entity.viewer.connectedMax = 0.1;
statsObj.entity.viewer.connectedMaxTime = moment().valueOf();

statsObj.group = {};
statsObj.group.errors = 0;

statsObj.memory = {};
statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.memory.maxHeap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.memory.maxHeapTime = moment().valueOf();
statsObj.memory.memoryAvailable = os.freemem();
statsObj.memory.memoryTotal = os.totalmem();
statsObj.memory.memoryUsage = process.memoryUsage();

statsObj.queues = {};
statsObj.queues.sorterMessageRxQueue = 0;
statsObj.queues.dbUpdateEntityQueue = 0;
statsObj.queues.dbUpdaterMessageRxQueue = 0;
statsObj.queues.dbUpdateWordQueue = 0;
statsObj.queues.rxWordQueue = 0;
statsObj.queues.sessionQueue = 0;
statsObj.queues.updaterMessageQueue = 0;
statsObj.queues.updateSessionViewQueue = 0;

statsObj.session = {};
statsObj.session.errors = 0;
statsObj.session.numberSessions = 0;
statsObj.session.previousPromptNotFound = 0;
statsObj.session.totalCreated = 0;
statsObj.session.wordError = 0;
statsObj.session.wordErrorType = {};

statsObj.socket = {};
statsObj.socket.connects = 0;
statsObj.socket.disconnects = 0;
statsObj.socket.errors = 0;
statsObj.socket.reconnects = 0;
statsObj.socket.wordsReceived = 0;

statsObj.utilities = {};

function showStats(options){

  statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
  statsObj.timeStamp = moment().format(compactDateTimeFormat);

  statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);
  if (statsObj.memory.heap > statsObj.memory.maxHeap) {
    statsObj.memory.maxHeap = statsObj.memory.heap;
    statsObj.memory.maxHeapTime = moment().valueOf();
    debug(chalkAlert("NEW MAX HEAP"
      + " | " + moment().format(compactDateTimeFormat)
      + " | " + statsObj.memory.heap.toFixed(0) + " MB"
    ));
  }
  statsObj.memory.memoryUsage = process.memoryUsage();

  if (options) {
    debug(chalkLog("S"
      // + " | " + statsObj.socketId
      + " | ELAPSED: " + statsObj.elapsed
      + " | START: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | NOW: " + moment().format(compactDateTimeFormat)
      + " | HEAP: " + statsObj.memory.heap.toFixed(0) + " MB"
      + " | MAX HEAP: " + statsObj.memory.maxHeap.toFixed(0)
      + " | MAX HEAP TIME: " + moment(parseInt(statsObj.memory.maxHeapTime)).format(compactDateTimeFormat)
    ));
    debug(chalkAlert("STATS\n" + jsonPrint(statsObj)));
  }
  else {
    debug(chalkLog("S"
      // + " | " + statsObj.socketId
      + " | ELAPSED: " + statsObj.elapsed
      + " | START: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | NOW: " + moment().format(compactDateTimeFormat)
      + " | HEAP: " + statsObj.memory.heap.toFixed(0) + " MB"
      + " | MAX HEAP: " + statsObj.memory.maxHeap.toFixed(0)
      + " | MAX HEAP TIME: " + moment(parseInt(statsObj.memory.maxHeapTime)).format(compactDateTimeFormat)
    ));
  }
}

// ==================================================================
// SERVER STATUS
// ==================================================================


var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});


var adminNameSpace;
var utilNameSpace;
var userNameSpace;
var viewNameSpace;


// ==================================================================
// ADMIN
// ==================================================================

localHostHashMap.set("::ffff:127.0.0.1", "threeceelabs.com");
localHostHashMap.set("127.0.0.1", "threeceelabs.com");
localHostHashMap.set("::1", "threeceelabs.com");
localHostHashMap.set("::1", "threeceelabs.com");

localHostHashMap.set("macpro.local", "threeceelabs.com");
localHostHashMap.set("macpro2.local", "threeceelabs.com");
localHostHashMap.set("mbp.local", "threeceelabs.com");
localHostHashMap.set("mbp2.local", "threeceelabs.com");
localHostHashMap.set("macminiserver0.local", "threeceelabs.com");
localHostHashMap.set("macminiserver1.local", "threeceelabs.com");
localHostHashMap.set("macminiserver2.local", "threeceelabs.com");
localHostHashMap.set("mms0.local", "threeceelabs.com");
localHostHashMap.set("mms1.local", "threeceelabs.com");
localHostHashMap.set("mms2.local", "threeceelabs.com");

localHostHashMap.set("::ffff:10.0.1.4", "threeceelabs.com");
localHostHashMap.set("::ffff:10.0.1.10", "threeceelabs.com");
localHostHashMap.set("::ffff:10.0.1.27", "threeceelabs.com");
localHostHashMap.set("::ffff:10.0.1.45", "threeceelabs.com");
localHostHashMap.set("10.0.1.4", "threeceelabs.com");
localHostHashMap.set("10.0.1.10", "threeceelabs.com");
localHostHashMap.set("10.0.1.27", "threeceelabs.com");

localHostHashMap.set("104.197.93.13", "threeceelabs.com");

if (debug.enabled) {
  debug("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

debug("NODE_ENV : " + process.env.NODE_ENV);
debug("CLIENT HOST + PORT: " + "http://localhost:" + config.port);

function initSocketNamespaces(callback){

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT SOCKET NAMESPACES"));

  io = require("socket.io")(httpServer, { reconnection: true });

  adminNameSpace = io.of("/admin");
  utilNameSpace = io.of("/util");
  userNameSpace = io.of("/user");
  viewNameSpace = io.of("/view");

  adminNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    debug(chalkAdmin("ADMIN CONNECT"));
    initSocketHandler(socket);
  });

  utilNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    debug(chalkAdmin("UTIL CONNECT"));
    initSocketHandler(socket);
  });

  userNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    debug(chalkAdmin("USER CONNECT"));
    initSocketHandler(socket);
  });

  viewNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    var ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;
    debug(chalkAdmin("VIEWER CONNECT"
      + " | " + socket.id
      + " | " + ipAddress
    ));
    initSocketHandler(socket);
  });

  ioReady = true;

  if (callback !== undefined) { callback(); }
}


var heartbeatsSent = 0;
configEvents.on("SERVER_READY", function() {

  // serverReady = true;

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SERVER_READY EVENT"));

  httpServer.on("reconnect", function() {
    internetReady = true;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | PORT RECONNECT: " + config.port));
  });

  httpServer.on("connect", function() {
    statsObj.socket.connects += 1;
    internetReady = true;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | PORT CONNECT: " + config.port));

    httpServer.on("disconnect", function() {
      internetReady = false;
      debug(chalkError("\n***** PORT DISCONNECTED | " + moment().format(compactDateTimeFormat) 
        + " | " + config.port));
    });
  });

  httpServer.listen(config.port, function() {
    debug(chalkInfo(moment().format(compactDateTimeFormat) + " | LISTENING ON PORT " + config.port));
  });

  httpServer.on("error", function(err) {
    statsObj.socket.errors += 1;
    internetReady = false;
    debug(chalkError("??? HTTP ERROR | " + moment().format(compactDateTimeFormat) + "\n" + err));
    if (err.code === "EADDRINUSE") {
      debug(chalkError("??? HTTP ADDRESS IN USE: " + config.port + " ... RETRYING..."));
      setTimeout(function() {
        httpServer.listen(config.port, function() {
          debug("LISTENING ON PORT " + config.port);
        });
      }, 5000);
    }
  });

  var tempDateTime;

  function logHeartbeat() {
    debug(chalkLog("HB " + heartbeatsSent 
      + " | " + moment(parseInt(statsObj.timeStamp)).format(compactDateTimeFormat) 
      + " | ST: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat) 
      + " | UP: " + msToTime(statsObj.upTime) 
      + " | RN: " + msToTime(statsObj.runTime) 
      + " | MEM: " + statsObj.memory.memoryAvailable 
      + "/" + statsObj.memory.memoryTotal));
  }

  setInterval(function() {

    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;
    statsObj.memory.memoryTotal = os.totalmem();
    statsObj.memory.memoryAvailable = os.freemem();
    statsObj.memory.memoryUsage = process.memoryUsage();

    //
    // SERVER HEARTBEAT
    //

    if (internetReady && ioReady) {

      heartbeatsSent += 1;

      statsObj.configuration = configuration;

      io.emit("HEARTBEAT", statsObj);

      utilNameSpace.emit("HEARTBEAT", statsObj);
      adminNameSpace.emit("HEARTBEAT", statsObj);
      userNameSpace.emit("HEARTBEAT", statsObj);
      viewNameSpace.emit("HEARTBEAT", statsObj);

      if (heartbeatsSent % 60 === 0) { logHeartbeat(); }

    } 
    else {
      tempDateTime = moment();
      if (tempDateTime.seconds() % 10 === 0) {
        debug(chalkError("!!!! INTERNET DOWN?? !!!!! " 
          + moment().format(compactDateTimeFormat)
          + " | INTERNET READY: " + internetReady
          + " | I/O READY: " + ioReady
        ));
      }
    }
  }, 1000);
});

//=================================
// INIT APP ROUTING
//=================================

function initAppRouting(callback) {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT APP ROUTING"));

  app.use(function (req, res, next) {
    debug(chalkAlert("R>"
      + " | " + moment().format(compactDateTimeFormat)
      + " | IP: " + req.ip
      // + " | IPS: " + req.ips
      + " | HOST: " + req.hostname
      // + " | BASE URL: " + req.baseUrl
      + " | METHOD: " + req.method
      + " | PATH: " + req.path
      // + " | ROUTE: " + req.route
      // + " | PROTOCOL: " + req.protocol
      // + "\nQUERY: " + jsonPrint(req.query)
      // + "\nPARAMS: " + jsonPrint(req.params)
      // + "\nCOOKIES: " + jsonPrint(req.cookies)
      // + "\nBODY: " + jsonPrint(req.baseUrl)
    ));
    next();
  });

  app.get("/admin", function(req, res) {
    debug(chalkInfo("LOADING PAGE: /admin/admin.html"));
    res.sendFile(__dirname + "/admin/admin.html", function (err) {
      if (err) {
        console.error("GET:", __dirname + "/admin/admin.html");
      } 
      else {
        debug(chalkInfo("SENT:", __dirname + "/admin/admin.html"));
      }
    });
  });

  app.get("/session", function(req, res, next) {
    debug(chalkInfo("LOADING PAGE: /sessionModular.html"));
    res.sendFile(__dirname + "/sessionModular.html", function (err) {
      if (err) {
        console.error("GET /session ERROR:"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + __dirname + "/sessionModular.html"
          + " | " + err
          // + " | " + req
        );
      } 
      else {
        debug(chalkInfo("SENT:", __dirname + "/sessionModular.html"));
      }
    });
  });

  app.get("/", function(req, res, next) {
    debug(chalkInfo("LOADING PAGE: /sessionModular.html"));
    res.sendFile(__dirname + "/sessionModular.html", function (err) {
      if (err) {
        console.error("GET / ERROR:"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + __dirname + "/sessionModular.html"
          + " | " + err
          // + " | REQ: " + jsonPrint(req)
        );
      } 
      else {
        debug(chalkInfo("SENT:", __dirname + "/sessionModular.html"));
      }
    });
  });


  app.get("/js/require.js", function(req, res, next) {
    debug(chalkInfo("LOADING PAGE: /js/require.js"));
    res.sendFile(__dirname + "/js/require.js", function (err) {
      if (err) {
        debug(chalkAlert("GET:", __dirname + "/js/require.js"));
      } 
      else {
        debug(chalkInfo("SENT:", __dirname + "/js/require.js"));
      }
    });
  });

  // configEvents.emit("INIT_APP_ROUTING_COMPLETE");
  callback(null);
}

function initInternetCheckInterval(interval){

  debug(chalkInfo(moment().format(compactDateTimeFormat) 
    + " | INIT INTERNET CHECK INTERVAL | " + interval + " MS"));

  var serverStatus;
  var serverError;
  var callbackInterval;

  clearInterval(internetCheckInterval);

  internetCheckInterval = setInterval(function(){
    var testClient = net.createConnection(80, "www.google.com");

    testClient.on("connect", function() {
      internetReady = true;
      statsObj.socket.connects += 1;
      debug(chalkInfo(moment().format(compactDateTimeFormat) + " | CONNECTED TO GOOGLE: OK"));
      debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SEND SERVER_READY"));
      configEvents.emit("SERVER_READY");
      testClient.destroy();
      serverStatus = "SERVER_READY";
      clearInterval(internetCheckInterval);
    });

    testClient.on("error", function(err) {
      if (err) {
        debug(chalkError("testClient ERROR " + err));
      }
      internetReady = false;
      statsObj.socket.errors += 1;
      debug(chalkError(moment().format(compactDateTimeFormat) + " | **** GOOGLE CONNECT ERROR ****\n" + err));
      debug(chalkError(moment().format(compactDateTimeFormat) + " | **** SERVER_NOT_READY ****"));
      testClient.destroy();
      configEvents.emit("SERVER_NOT_READY");
      serverError = err;
      serverStatus = "SERVER_NOT_READY";
    });
  }, interval);

  callbackInterval = setInterval(function(){
    if (serverStatus || serverError) {
      debug(chalkAlert("INIT INTERNET CHECK INTERVAL"
        + " | ERROR: "  + serverError
        + " | STATUS: " + serverStatus
      ));
      clearInterval(callbackInterval);
    }
  }, interval);
}

var tmsServers = {};
var tssServers = {};

function initSocketHandler(socket) {

  var ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  socket.emit("SERVER_READY", {connected: hostname});

  socket.on("reconnect_error", function(errorObj) {
    statsObj.socket.reconnect_errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("reconnect_failed", function(errorObj) {
    statsObj.socket.reconnect_fails += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT FAILED: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_error", function(errorObj) {
    statsObj.socket.connect_errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_timeout", function(errorObj) {
    statsObj.socket.connect_timeouts += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT TIMEOUT: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function(error) {
    statsObj.socket.errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | *** SOCKET ERROR" + " | " + socket.id + " | " + error));
  });

  socket.on("reconnect", function() {
    statsObj.socket.reconnects += 1;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
  });

  socket.on("disconnect", function(status) {
    statsObj.socket.disconnects += 1;

    debug(chalkDisconnect(moment().format(compactDateTimeFormat) 
      + " | SOCKET DISCONNECT: " + socket.id + "\nstatus\n" + jsonPrint(status)
    ));
  });

  socket.on("ADMIN_READY", function(adminObj) {
    debug(chalkSocket("ADMIN READY\n" + jsonPrint(adminObj)));
  });

  socket.on("VIEWER_READY", function(viewerObj, cb) {
    debug(chalkSocket("VIEWER READY\n" + jsonPrint(viewerObj)));
    cb("YO");
  });

  socket.on("SESSION_KEEPALIVE", function(userObj) {

    if (statsObj.utilities[userObj.userId] === undefined) {
      statsObj.utilities[userObj.userId] = {};
    }

    statsObj.socket.keepalives += 1;

    // debug(chalkSession("SESSION_KEEPALIVE | " + userObj.userId));
    // debug(chalkSession("SESSION_KEEPALIVE\n" + jsonPrint(userObj)));

    if (userObj.stats) {statsObj.utilities[userObj.userId] = userObj.stats;}

    if (userObj.userId.match(/LA_/g)){
      userObj.isServer = true;

      languageServer.connected = true;
      languageServer.user = userObj;
      languageServer.socket = socket;

      debug(chalkSession("K-LA" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    if (userObj.userId.match(/TMS_/g)){
      userObj.isServer = true;

      if (tmsServers[socket.id] === undefined) { tmsServers[socket.id] = {}; }
      tmsServers[socket.id].connected = true;
      tmsServers[socket.id].user = userObj;
      tmsServers[socket.id].socket = socket;

      // debug(chalkSession("K-TMS" 
      //   + " | " + userObj.userId
      //   + " | " + socket.id
      //   + " | " + userObj.stats.tweetsPerMinute.toFixed(0) + " TPM"
      //   + " | " + moment().format(compactDateTimeFormat)
      //   // + "\n" + jsonPrint(userObj)
      // ));
    }
 
    if (userObj.userId.match(/TSS_/g)){
      userObj.isServer = true;

      if (tssServers[socket.id] === undefined) { tssServers[socket.id] = {}; }
      tssServers[socket.id].connected = true;
      tssServers[socket.id].user = userObj;
      tssServers[socket.id].socket = socket;

      // debug(chalkSession("K-TSS" 
      //   + " | " + userObj.userId
      //   + " | " + socket.id
      //   + " | " + userObj.stats.tweetsPerMinute.toFixed(0) + " TPM"
      //   + " | " + moment().format(compactDateTimeFormat)
      //   // + "\n" + jsonPrint(userObj)
      // ));
    }
  });

  socket.on("USER_READY", function(userObj, cb) {
    debug(chalkSocket("USER READY"
      + " | " + userObj.userId
      // + "\n" + jsonPrint(userObj)
    ));
    cb(userObj.userId);
  });

  socket.on("node", function(rxNodeObj) {
    // debug(chalkSocket("node" 
    //   + " | " + rxNodeObj.nodeType
    //   + " | " + rxNodeObj.nodeId
    //   // + jsonPrint(rxNodeObj)
    // ));
    viewNameSpace.emit("node", rxNodeObj);
  });

  socket.on("word", function(rxWordObj) {
    // debug(chalkSocket("node" 
    //   + " | " + rxWordObj.nodeType
    //   + " | " + rxWordObj.nodeId
    //   // + jsonPrint(rxNodeObj)
    // ));
    viewNameSpace.emit("node", rxWordObj);
  });

}

function initialize(cnf, callback) {

  // debug(chalkInfo(moment().format(compactDateTimeFormat) + " | initialize ..."));
  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INITIALIZE"));

  var configArgs = Object.keys(cnf);
  configArgs.forEach(function(arg){
    debug("FINAL CONFIG | " + arg + ": " + cnf[arg]);
  });

  if (cnf.quitOnError) { 
    debug(chalkAlert("===== QUIT ON ERROR SET ====="));
  }

  initInternetCheckInterval(10000);

  initAppRouting(function(err) {
    initSocketNamespaces();
    callback(err);
  });
}

//=================================
// BEGIN !!
//=================================
initialize(configuration, function(err) {
  if (err) {
    debug(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
  } 
  else {
    debug(chalkLog("INITIALIZE COMPLETE"));
  }
});



// GEN UNCAUGHT ERROR TO TEST KILL OF CHILD PROCESS
// setTimeout(function(){
//   debug("CRASH!");
//   debug("OOPS!" + updater.thisdoesntexist.toLowerCase());
// }, 5000);

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
