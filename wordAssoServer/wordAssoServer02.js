/*jslint node: true */
"use strict";

var quitOnError = true;
// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var KEYWORDS_UPDATE_INTERVAL = 60000;
var TWEET_PARSER_INTERVAL = 5;
var TWITTER_RX_QUEUE_INTERVAL = 5;
var TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 5;
var DEFAULT_INTERVAL = 5;
var TOPTERMS_CACHE_DEFAULT_TTL = 60;
var TRENDING_CACHE_DEFAULT_TTL = 60;
var DEFAULT_KEYWORD_VALUE = 100;
var NODE_CACHE_TTL = 60;

var metricsRate = "5MinuteRate";
var enableGoogleMetrics = false;
var CUSTOM_GOOGLE_APIS_PREFIX = "custom.googleapis.com";

var enableGoogleMetrics = (process.env.ENABLE_GOOGLE_METRICS !== undefined) ? process.env.ENABLE_GOOGLE_METRICS : false;

var defaults = require("object.defaults");

var languageServer = {};
var tssServer = {};
tssServer.connected = false;
tssServer.user = {};
tssServer.socket = {};

var tmsServer = {};
tmsServer.connected = false;
tmsServer.user = {};
tmsServer.socket = {};

var Monitoring = require("@google-cloud/monitoring");
var googleMonitoringClient = Monitoring.v3().metricServiceClient();

var nodeCacheTtl = process.env.NODE_CACHE_TTL;
if (nodeCacheTtl === undefined) {nodeCacheTtl = NODE_CACHE_TTL;}
console.log("WORD CACHE TTL: " + nodeCacheTtl + " SECONDS");

var NodeCache = require("node-cache");
var nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: 10
});

nodeCache.on("set", function(nodeCacheId, nodeObj) {
  debug(chalkAlert("SET NODE $"
    + " | " + nodeObj.nodeType
    + " | " + nodeCacheId
  ));
});

nodeCache.on("expired", function(nodeCacheId, nodeObj) {
  console.log(chalkAlert("XXX NODE $"
    + " | " + nodeObj.nodeType
    + " | " + nodeCacheId
  ));
  if (wordMeter[nodeCacheId] !== undefined) {
    wordMeter[nodeCacheId] = {};
    delete wordMeter[nodeCacheId];
    console.log(chalkAlert("XXX NODE METER WORD"
      + " | Ks: " + Object.keys(wordMeter).length
      + " | " + nodeCacheId
    ));
  }
});

// ==================================================================
// TWITTER TRENDING TOPIC CACHE
// ==================================================================
var trendingCacheTtl = process.env.TRENDING_CACHE_DEFAULT_TTL;
if (trendingCacheTtl === undefined) {trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL;}
console.log("TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

var trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: 10
});

trendingCache.on( "expired", function(topic, topicObj){
  debug("CACHE TOPIC EXPIRED\n" + jsonPrint(topicObj));
  debug("CACHE TOPIC EXPIRED | " + topic + " | " + topicObj.name);
});

var wordsPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (wordsPerMinuteTopTermTtl === undefined) {wordsPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;}
console.log("TOP TERMS WPM CACHE TTL: " + wordsPerMinuteTopTermTtl + " SECONDS");

var wordsPerMinuteTopTermCache = new NodeCache({
  stdTTL: wordsPerMinuteTopTermTtl,
  checkperiod: 10
});

var wordMeter = {};

var rateQinterval;
var Measured = require("measured");
var wordStats = Measured.createCollection();
wordStats.meter("wordsPerSecond", {rateUnit: 1000, tickInterval: 1000});
wordStats.meter("wordsPerMinute", {rateUnit: 60000, tickInterval: 1000});
wordStats.meter("obamaPerSecond", {rateUnit: 1000, tickInterval: 1000});
wordStats.meter("obamaPerMinute", {rateUnit: 60000, tickInterval: 1000});
wordStats.meter("trumpPerSecond", {rateUnit: 1000, tickInterval: 1000});
wordStats.meter("trumpPerMinute", {rateUnit: 60000, tickInterval: 1000});

var compactDateTimeFormat = "YYYYMMDD HHmmss";


var defaultDropboxKeywordFile = "keywords.json";

var internetReady = false;
var ioReady = false;

var configuration = {};
configuration.quitOnError = false;
configuration.maxTopTerms = process.env.WA_MAX_TOP_TERMS || 100;

var chalk = require("chalk");
var moment = require("moment");

var internetCheckInterval;

var config = require("./config/config");
var os = require("os");
var HashMap = require("hashmap").HashMap;
var debug = require("debug")("wa");
var debugKeyword = require("debug")("kw");

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

var cp = require("child_process");
var updater;
var updaterMessageQueue = [];
var sorter;
var sorterMessageRxQueue = [];

var chalkAdmin = chalk.bold.cyan;
var chalkConnect = chalk.black;
var chalkSession = chalk.black;
var chalkDisconnect = chalk.black;
var chalkSocket = chalk.black;
var chalkInfo = chalk.gray;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkLog = chalk.gray;

var ignoreWordHashMap = new HashMap();
var keywordHashMap = new HashMap();
var topicHashMap = new HashMap();

var localHostHashMap = new HashMap();

var tweetParser;

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

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


process.on("exit", function() {
  if (tweetParser !== undefined) { tweetParser.kill("SIGINT"); }
  if (updater !== undefined) { updater.kill("SIGINT"); }
  if (sorter !== undefined) { sorter.kill("SIGINT"); }
});

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

statsObj.children = {};

statsObj.twitter = {};
statsObj.twitter.tweetsReceived = 0;


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
statsObj.caches.nodeCache = {};
statsObj.caches.nodeCache.stats = {};
statsObj.caches.nodeCache.stats.keys = 0;
statsObj.caches.nodeCache.stats.keysMax = 0;
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
statsObj.queues.tweetParserMessageRxQueue = 0;
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

var MAX_Q = 1000;
var tweetRxQueue = [];

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

function checkKeyword(nodeObj, callback) {

  var obamaHit = false;
  var trumpHit = false;

  debug(chalkAlert("checkKeyword"
    + " | " + nodeObj.nodeType
    + " | " + nodeObj.nodeId
    + "\n" + jsonPrint(nodeObj)
  ));
  
  var kwObj = {};  

  if ((nodeObj.nodeType === "user") 
    && (nodeObj.screenName !== undefined) 
    && (nodeObj.screenName) 
    && keywordHashMap.has(nodeObj.screenName.toLowerCase())) {
    debug(chalkAlert("HIT USER SNAME"));
    kwObj = keywordHashMap.get(nodeObj.screenName.toLowerCase());
    nodeObj.isKeyword = true;
    nodeObj.keywords = kwObj;    
    // callback(nodeObj);
  }
  else if ((nodeObj.nodeType === "user") 
    && (nodeObj.name !== undefined) 
    && (nodeObj.name) 
    && keywordHashMap.has(nodeObj.name.toLowerCase())) {
    debug(chalkAlert("HIT USER NAME"));
    kwObj = keywordHashMap.get(nodeObj.name.toLowerCase());
    nodeObj.isKeyword = true;
    nodeObj.keywords = kwObj;    
    // callback(nodeObj);
  }
  else if ((nodeObj.nodeType === "place") 
    && keywordHashMap.has(nodeObj.name.toLowerCase())) {
    debug(chalkAlert("HIT PLACE NAME"));
    kwObj = keywordHashMap.get(nodeObj.name.toLowerCase());
    nodeObj.isKeyword = true;
    nodeObj.keywords = kwObj;    
    // callback(nodeObj);
  }
  else if (nodeObj.nodeId && keywordHashMap.has(nodeObj.nodeId.toLowerCase())) {
    debug(chalkAlert("HIT NODE ID"));
    kwObj = keywordHashMap.get(nodeObj.nodeId.toLowerCase());
    nodeObj.isKeyword = true;
    nodeObj.keywords = kwObj;    
    if ((nodeObj.nodeType === "user") 
      && (nodeObj.name === undefined) 
      && (nodeObj.screenName === undefined)) {
      nodeObj.screenName = nodeObj.nodeId;
    }
    // callback(nodeObj);
  }
  else if (nodeObj.text && keywordHashMap.has(nodeObj.text.toLowerCase())) {
    debug(chalkAlert("HIT TEXT"));
    kwObj = keywordHashMap.get(nodeObj.text.toLowerCase());
    nodeObj.isKeyword = true;
    nodeObj.keywords = kwObj;    
    if ((nodeObj.nodeType === "user") 
      && (nodeObj.name === undefined) 
      && (nodeObj.screenName === undefined)) {
      nodeObj.screenName = nodeObj.nodeId;
    }
    // callback(nodeObj);
  }
  else if (nodeObj.keywords === undefined) {
    nodeObj.keywords = {};
    // callback(nodeObj);
  }

  switch (nodeObj.nodeType) {

    case "tweet":

      // console.log(chalkAlert("TWEET | checkKeyword\n" + jsonPrint(nodeObj)));

      if (nodeObj.text.toLowerCase().includes("sciencemarch") || nodeObj.text.toLowerCase().includes("marchforscience")) {
        // scienceMarchHit = nodeObj.text;
        nodeObj.isKeyword = true;
        nodeObj.keywords.positive = DEFAULT_KEYWORD_VALUE;
        debug(chalkError("SCIENCEMARCH: " + nodeObj.text));
      }
      if (nodeObj.text.toLowerCase().includes("obama")) {
        obamaHit = nodeObj.text;
        nodeObj.isKeyword = true;
        if (!nodeObj.keywords.right){
          nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
        }
        else {
          delete nodeObj.keywords.left;
        }
        debug(chalkError("OBAMA: " + nodeObj.text));
      }
      if (nodeObj.text.toLowerCase().includes("trump")) {
        trumpHit = nodeObj.text;
        nodeObj.isKeyword = true;
        if (!nodeObj.keywords || !nodeObj.keywords.left){
          nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
        }
        else {
          delete nodeObj.keywords.right;
        }
        debug(chalkError("TRUMP: " + nodeObj.text));
      }
      callback(nodeObj);
    break;

    case "user":

      // console.log(chalkAlert("USER | checkKeyword\n" + jsonPrint(nodeObj)));

      if (!nodeObj.name && !nodeObj.screenName) {
        console.log(chalkError("NODE NAME & SCREEN NAME UNDEFINED?\n" + jsonPrint(nodeObj)));
      }
      else if (nodeObj.screenName){
        nodeObj.isTwitterUser = true;
        wordsPerMinuteTopTermCache.get(nodeObj.screenName.toLowerCase(), function(err, screenName) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
            quit();
          }
          if (screenName !== undefined) {
            debug(chalkAlert("TOP TERM: " + screenName));
            nodeObj.isTopTerm = true;
          }
          if (nodeObj.screenName.toLowerCase().includes("obama")) {
            obamaHit = nodeObj.screenName;
            nodeObj.isKeyword = true;
          if (!nodeObj.keywords || !nodeObj.keywords.right){
              nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
            }
            else {
              delete nodeObj.keywords.left;
            }
          }
          if (nodeObj.screenName.toLowerCase().includes("trump")) {
            trumpHit = nodeObj.screenName;
            nodeObj.isKeyword = true;
            if (!nodeObj.keywords || !nodeObj.keywords.left){
              nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            }
            else {
              delete nodeObj.keywords.right;
            }
          }
          callback(nodeObj);
        });
      }
      else if (nodeObj.name) {
        nodeObj.isTwitterUser = true;
        nodeObj.screenName = nodeObj.name;
        wordsPerMinuteTopTermCache.get(nodeObj.name.toLowerCase(), function(err, name) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
            quit();
          }
          if (name !== undefined) {
            nodeObj.isTopTerm = true;
          }
          if (nodeObj.name.toLowerCase().includes("obama")) {
            obamaHit = nodeObj.name;
            nodeObj.isKeyword = true;
            if (!nodeObj.keywords.right){
              nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
            }
            else {
              delete nodeObj.keywords.left;
            }
          }
          if (nodeObj.name.toLowerCase().includes("trump")) {
            trumpHit = nodeObj.name;
            nodeObj.isKeyword = true;
            if (!nodeObj.keywords.left){
              nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            }
            else {
              delete nodeObj.keywords.right;
            }
          }
          callback(nodeObj);
        });
      }
    break;

    case "hashtag":

      // console.log(chalkAlert("HASHTAG | checkKeyword\n" + jsonPrint(nodeObj)));

      wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function(err, nodeId) {
        if (err){
          console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          quit();
        }
        if (nodeId !== undefined) {
          nodeObj.isTopTerm = true;
        }
        if (nodeObj.nodeId.toLowerCase().includes("sciencemarch") || nodeObj.nodeId.toLowerCase().includes("marchforscience")) {
          // scienceMarchHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          nodeObj.keywords.positive = DEFAULT_KEYWORD_VALUE;
        }
        if (nodeObj.nodeId.toLowerCase().includes("obama")) {
          obamaHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          if (!nodeObj.keywords.right){
            nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
          }
          else {
            delete nodeObj.keywords.left;
          }
        }
        if (nodeObj.nodeId.toLowerCase().includes("trump")) {
          trumpHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          if (!nodeObj.keywords || !nodeObj.keywords.left){
            nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
          }
          else {
            delete nodeObj.keywords.right;
          }
        }
        callback(nodeObj);
      });
    break;

    case "place":

      debug(chalkAlert("PLACE | checkKeyword\n" + jsonPrint(nodeObj)));
      debug(chalkInfo("PLACE | checkKeyword"
        + " | " + nodeObj.name
        + " | " + nodeObj.fullName
        + " | " + nodeObj.country
      ));

      wordsPerMinuteTopTermCache.get(nodeObj.name.toLowerCase(), function(err, nodeId) {
        if (err){
          console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          quit();
        }
        if (nodeId !== undefined) {
          nodeObj.isTopTerm = true;
        }
        if (nodeObj.name.toLowerCase().includes("obama")) {
          obamaHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          if (!nodeObj.keywords.right){
            nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
          }
          else {
            delete nodeObj.keywords.left;
          }
        }
        if (nodeObj.name.toLowerCase().includes("trump")) {
          trumpHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          if (!nodeObj.keywords.left){
            nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
          }
          else {
            delete nodeObj.keywords.right;
          }
        }
        callback(nodeObj);
      });
    break;

    case "word":

      // console.log(chalkAlert("WORD | checkKeyword\n" + jsonPrint(nodeObj)));

      wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function(err, nodeId) {
        if (err){
          console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          quit();
        }
        if (nodeId !== undefined) {
          nodeObj.isTopTerm = true;
        }
        if (nodeObj.nodeId.toLowerCase().includes("obama")) {
          obamaHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          if (!nodeObj.keywords.right){
            nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
          }
          else {
            delete nodeObj.keywords.left;
          }
        }
        if (nodeObj.nodeId.toLowerCase().includes("trump")) {
          trumpHit = nodeObj.nodeId;
          nodeObj.isKeyword = true;
          if (!nodeObj.keywords.left){
            nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
          }
          else {
            delete nodeObj.keywords.right;
          }
        }
        callback(nodeObj);
      });
    break;

    case "media":
    case "url":
      callback(nodeObj);
    break;

    default:
      console.log(chalkAlert("DEFAULT | checkKeyword\n" + jsonPrint(nodeObj)));
      callback(nodeObj);
  }

  if (obamaHit) {

    wordStats.meter("obamaPerSecond").mark();
    wordStats.meter("obamaPerMinute").mark();

    var wsObamaObj = wordStats.toJSON();

    debug(chalkAlert("OBAMA"
      + " | " + nodeObj.nodeType
      + " | " + nodeObj.nodeId
      + " | " + wsObamaObj.obamaPerSecond[metricsRate].toFixed(0) 
      + " | " + wsObamaObj.obamaPerSecond.currentRate.toFixed(0) 
      + " | " + wsObamaObj.obamaPerMinute[metricsRate].toFixed(0) 
      + " | " + wsObamaObj.obamaPerMinute.currentRate.toFixed(0) 
      + " | " + obamaHit
    ));
  }

  if (trumpHit) {

    wordStats.meter("trumpPerSecond").mark();
    wordStats.meter("trumpPerMinute").mark();

    var wsTrumpObj = wordStats.toJSON();

    debug(chalkAlert("TRUMP"
      + " | " + nodeObj.nodeType
      + " | " + nodeObj.nodeId
      + " | " + wsTrumpObj.trumpPerSecond[metricsRate].toFixed(0) 
      + " | " + wsTrumpObj.trumpPerSecond.currentRate.toFixed(0) 
      + " | " + wsTrumpObj.trumpPerMinute[metricsRate].toFixed(0) 
      + " | " + wsTrumpObj.trumpPerMinute.currentRate.toFixed(0) 
      + " | " + trumpHit
    ));
  }
}

function updateTrends(){
  twit.get("trends/place", {id: 1}, function (err, data, response){

    debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));

    if (err){
      console.log(chalkError("*** TWITTER GET trends/place ID=1 ERROR ***"
        + " | " + err
      ));
    }
    else if (data){
      console.log(chalkInfo("... TWITTER TREND - WORLDWIDE"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function(element){
        // console.log(chalkError("... TWITTER TREND - US"
          // + " | element\n" + jsonPrint(element)
        // ));
        element.trends.forEach(function(topic){
          console.log(chalkInfo(
            topic.name
          ));
          trendingCache.set(topic.name, topic);
        });
      });
    }
  });
  
  twit.get("trends/place", {id: 23424977}, function (err, data, response){

    debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));

    if (err){
      console.log(chalkError("*** TWITTER GET trends/place ID=23424977 ERROR ***"
        + " | " + err
      ));
    }
    else if (data){

      trendingCache.set("america", {name: "america"});

      console.log(chalkInfo("... TWITTER TREND - US"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function(element){
        // console.log(chalkError("... TWITTER TREND - US"
          // + " | element\n" + jsonPrint(element)
        // ));
        element.trends.forEach(function(topic){
          console.log(chalkInfo(
            topic.name
          ));
          trendingCache.set(topic.name, topic);
        });
      });
    }
  });
}

function updateWordMeter(wordObj, callback){

  var meterWordId;
  var meterObj;

  if ((wordObj.nodeType === "media") 
    || (wordObj.nodeType === "url")
    || (wordObj.nodeType === "keepalive")
    ) {
    callback(null, wordObj);
    return;
  }

  // if (wordObj.tags === undefined) {
  //   console.log(chalkAlert("UNDEFINED WORD TAGS updateWordMeter\n" + jsonPrint(wordObj)));
  //   console.trace("UNDEFINED WORD TAGS updateWordMeter");
  // }

  if (wordObj.isTwitterUser || (wordObj.nodeType === "user")) {
    if (wordObj.screenName !== undefined) {
      meterWordId = wordObj.screenName.toLowerCase();
    }
    else if (wordObj.name !== undefined) {
      meterWordId = wordObj.name.toLowerCase();
    }
    else {
      debug(chalkWarn("updateWordMeter WARN: TWITTER USER UNDEFINED NAME & SCREEN NAME"
        + " | USING NODEID: " + wordObj.nodeId
        // + "\n" + jsonPrint(wordObj)
      ));

      meterWordId = wordObj.nodeId;
      // if (callback !== undefined) { callback("TWITTER USER UNDEFINED NAME & SCREEN NAME", wordObj)};
      // return;
    }
  }
  else if (wordObj.nodeType === "place") {
    meterWordId = wordObj.name.toLowerCase();
  }
  else {
    meterWordId = wordObj.nodeId.toLowerCase();
  }

  if (ignoreWordHashMap.has(meterWordId)) {
    debug(chalkAlert("updateWordMeter IGNORE " + meterWordId));
    wordObj.isIgnored = true;
    nodeCache.set(meterWordId, wordObj);
    if (callback !== undefined) { callback(null, wordObj); }
    return;
  }


  if (/TSS_/.test(meterWordId) || wordObj.isServer){
    console.log(chalkAlert("updateWordMeter\n" + jsonPrint(wordObj)));
  }

  if (!wordMeter[meterWordId] 
    || (wordMeter[meterWordId] === undefined) 
    || (typeof wordMeter[meterWordId].mark !== "function")) {

    wordMeter[meterWordId] = {};
    wordMeter[meterWordId] = new Measured.Meter({rateUnit: 60000});
    wordMeter[meterWordId].mark();

    meterObj = wordMeter[meterWordId].toJSON();

    wordObj.rate = meterObj[metricsRate];

    nodeCache.set(meterWordId, wordObj, function(){
      debug(chalkInfo("updateWordMeter MISS"
        + " | " + meterObj[metricsRate].toFixed(2) + " WPM"
        + " | " + meterWordId
        // + "\n" + jsonPrint(wordObj)
      ));
      if (callback !== undefined) { callback(null, wordObj); }
    });
  }
  else {
    wordMeter[meterWordId].mark();
    meterObj = wordMeter[meterWordId].toJSON();
    wordObj.rate = meterObj[metricsRate];
    nodeCache.set(meterWordId, wordObj, function(){
      debug(chalkInfo("updateWordMeter HIT "
        + " | " + meterObj[metricsRate].toFixed(2) + " WPM"
        + " | " + meterWordId
        // + "\n" + jsonPrint(wordObj)
      ));
      if (callback !== undefined) { callback(null, wordObj); }
    });
  }
}

function transmitNodes(tw, callback){
  debug("TX NODES");

  tw.userMentions.forEach(function(user){
    checkKeyword(user, function(us){
      updateWordMeter(us, function(err, us2){
        if (!err) {
          viewNameSpace.emit("node", us2);
        }
      });
    });
  });

  tw.hashtags.forEach(function(hashtag){
    checkKeyword(hashtag, function(ht){
      viewNameSpace.emit("node", ht);
    });
  });

  tw.media.forEach(function(media){
    checkKeyword(media, function(me){
      viewNameSpace.emit("node", me);
    });
  });

  tw.urls.forEach(function(url){
    checkKeyword(url, function(ul){
      viewNameSpace.emit("node", ul);
    });
  });

  checkKeyword(tw.user, function(us){
    viewNameSpace.emit("node", us);
  });

  if (tw.place){
    checkKeyword(tw.place, function(pl){
      viewNameSpace.emit("node", pl);
    });
  }

  viewNameSpace.emit("node", tw);
  callback();
}

function addMetricDataPoint(options, callback){

  debug(chalkAlert("addMetricDataPoint\n" + jsonPrint(options)));

  defaults(options, {
    endTime: (Date.now() / 1000),
    dataType: "doubleValue",
    resourceType: "global",
    projectId: process.env.GOOGLE_PROJECT_ID,
    metricTypePrefix: CUSTOM_GOOGLE_APIS_PREFIX
  });

  debug(chalkAlert("addMetricDataPoint AFTER\n" + jsonPrint(options)));

  var dataPoint = {
    interval: { endTime: { seconds: options.endTime } },
    value: {}
  };

  dataPoint.value[options.dataType] = options.value;

  var timeSeriesData = {
    metric: {
      type: options.metricTypePrefix + "/" + options.metricType,
      labels: options.metricLabels
    },
    resource: {
      type: options.resourceType,
      labels: { project_id: options.projectId }
    },
    points: [ dataPoint ]
  };

  var googleRequest = {
    name: googleMonitoringClient.projectPath(options.projectId),
    timeSeries: [
      timeSeriesData
    ]
  };

  googleMonitoringClient.createTimeSeries(googleRequest)
    // .then((results) => {
    .then(function(){
      debug(chalkTwitter("METRICS"
        + " | " + options.metricLabels.server_id 
        + " | " + options.value
      ));
    })
    .catch(function(results){
      if (results.code !== 8) {
        console.log(chalkError("*** ERROR GOOGLE METRICS"
          + " | " + options.metricLabels.server_id 
          + " | " + options.value
          + " | ERR CODE: " + results.code
          + " | META NODE: " + results.note
          + "\nMETA DATA\n" + jsonPrint(results.metadata)
        ));
      }
    });

  if (callback) { callback(null,options); }
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
      + " | MEM: " + (statsObj.memory.memoryAvailable/(1024*1024)).toFixed(0) + " AVAIL"
      + " / " + (statsObj.memory.memoryTotal/(1024*1024)).toFixed(0) + " TOTAL MB"
      + " - " + (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal).toFixed(3) + " %"
    ));
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

var tweetRxQueueInterval;
var tweetParserQueue = [];
var tweetParserMessageRxQueue = [];
var tweetParserReady = false;
var tweetParserMessageRxQueueReady = true;

function initTwitterRxQueueInterval(interval){

  console.log(chalkLog("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  tweetRxQueueInterval = setInterval(function () {

    // if ((tweetRxQueue.length > 0) && tweetParserReady) {
    if (tweetRxQueue.length > 0) {

      tweetParserReady = false;

      var tw =  tweetRxQueue.shift();

      debug(chalkInfo("TPQ<"
        + " [" + tweetParserQueue.length + "]"
        // + " | " + socket.id
        + " | " + tw.id_str
        + " | " + tw.user.id_str
        + " | " + tw.user.screen_name
        + " | " + tw.user.name
      ));

      tweetParser.send({
        op: "tweet",
        tweetStatus: tw
      }, function(err){
        if (err) {
          console.error(chalkError("*** TWEET PARSER SEND ERROR"
            + " | " + err
          ));
          if (quitOnError) {
            quit("TWEET PARSER SEND ERROR");
          }
          tweetParserReady = true;
        }
        else {
          tweetParserReady = true;
        }
      });

    }
  }, interval);
}


var tweetParserMessageRxQueueInterval;
function initTweetParserMessageRxQueueInterval(interval){

  console.log(chalkLog("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  tweetParserMessageRxQueueInterval = setInterval(function () {

    if ((tweetParserMessageRxQueue.length > 0) && tweetParserMessageRxQueueReady) {
    // if (tweetParserMessageRxQueue.length > 0) {

      tweetParserMessageRxQueueReady = false;

      var m =  tweetParserMessageRxQueue.shift();

      debug(chalkAlert("TWEET PARSER RX MESSAGE"
        + " | OP: " + m.op
        // + "\n" + jsonPrint(m)
      ));

      switch (m.op) {

        case "parsedTweet":
          var tweetObj = m.tweetObj;
          if (!tweetObj.user) {
            console.log(chalkAlert("parsedTweet -- TW USER UNDEFINED"
              + " | " + tweetObj.tweetId
            ));
          }
          else {

            debug(chalkInfo("PARSED TW"
              + " [ TPMRQ: " + tweetParserMessageRxQueue.length + "]"
              + " | " + tweetObj.tweetId
              + " | USR: " + tweetObj.user.screenName
              + " | Ms: " + tweetObj.mentions
              + " | Hs: " + tweetObj.hashtags.length
              + " | UMs: " + tweetObj.userMentions.length
              + " | M: " + tweetObj.media.length
              + " | URLs: " + tweetObj.url.length
              + " | PL: " + (tweetObj.place ? tweetObj.place.fullName : "")
            ));

            transmitNodes(tweetObj, function(err){
              tweetParserMessageRxQueueReady = true;
            });

          }

        break;

        default:
          console.error(chalkError("*** TWEET PARSER UNKNOWN OP"
            + " | INTERVAL: " + m.op
          ));
          tweetParserMessageRxQueueReady = true;
      }

    }
  }, interval);
}

var sorterMessageRxReady = true; 
var sorterMessageRxQueueInterval;
function initSorterMessageRxQueueInterval(interval){

  console.log(chalkLog("INIT SORTER RX MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(sorterMessageRxQueueInterval);

  sorterMessageRxQueueInterval = setInterval(function() {

    if (sorterMessageRxReady && (sorterMessageRxQueue.length > 0)) {

      sorterMessageRxReady = false;

      var sorterObj = sorterMessageRxQueue.shift();

      var sortedKeys;
      var endIndex;
      var index;
      var wmObj;
      var topTermDataPoint = {};
      var wordsPerMinuteTopTerm = {};
      var i;
      var node;

      switch (sorterObj.op){
        case "SORTED":
          debug(chalkAlert("SORT ---------------------"));
          for (i=0; i<sorterObj.sortedKeys.length; i += 1){
            if (wordMeter[sorterObj.sortedKeys[i]] !== undefined) {
              debug(chalkInfo(wordMeter[sorterObj.sortedKeys[i]].toJSON()[sorterObj.sortKey].toFixed(3)
                + " | "  + sorterObj.sortedKeys[i] 
              ));
            }
          }

          sortedKeys = sorterObj.sortedKeys;
          endIndex = Math.min(configuration.maxTopTerms, sortedKeys.length);

          // var index;
          // var wmObj;
          // var topTermDataPoint = {};
          // var wordsPerMinuteTopTerm = {};

          for (index=0; index < endIndex; index += 1){

            node = sortedKeys[index].toLowerCase();

            // if (wordMeter[node] !== undefined) {
            if (wordMeter[node]) {

              wmObj = wordMeter[node].toJSON();

              wordsPerMinuteTopTermCache.set(node, wmObj[metricsRate]);

              wordsPerMinuteTopTerm[node] = wmObj[metricsRate];

              if (index === endIndex-1) {
                adminNameSpace.emit("TWITTER_TOPTERM_1MIN", wordsPerMinuteTopTerm);
                viewNameSpace.emit("TWITTER_TOPTERM_1MIN", wordsPerMinuteTopTerm);
              }

              nodeCache.get(node, function(err, nodeObj){});

              if (enableGoogleMetrics && (wmObj[metricsRate] > MIN_METRIC_VALUE)) {
     
                nodeCache.get(node, function(err, nodeObj){

                  if (nodeObj === undefined) {
                    debug(chalkInfo("?? SORTED NODE NOT IN WORD $"
                      + " | " + node
                    ));
                  }
                  else if (nodeObj.mentions > MIN_MENTIONS_VALUE) {

                    debug(chalkInfo("TOP TERM METRIC"
                      + " | " + node
                      + " | Ms: " + nodeObj.mentions
                      + " | RATE: " + wmObj[metricsRate]
                    ));

                    topTermDataPoint.displayName = node;
                    topTermDataPoint.metricType = "word/top10/" + node;
                    topTermDataPoint.value = wmObj[metricsRate];
                    topTermDataPoint.metricLabels = {server_id: "WORD"};

                    addMetricDataPoint(topTermDataPoint);
                  }
                });
              }
            }
          }
          sorterMessageRxReady = true; 
        break;

        default:
          console.log(chalkError("??? SORTER UNKNOWN OP\n" + jsonPrint(sorterObj)));
          sorterMessageRxReady = true; 
      }
    }
  }, interval);
}

var updaterMessageReady = true;
var updaterMessageQueueInterval;
function initUpdaterMessageQueueInterval(interval){

  console.log(chalkInfo("INIT UPDATER MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  updaterMessageQueueInterval = setInterval(function() {
    if (updaterMessageReady && (updaterMessageQueue.length > 0)) {

      updaterMessageReady = false;

      var updaterObj = updaterMessageQueue.shift();

      switch (updaterObj.type){

        case "pong":
          console.log(chalkLog("<UPDATER PONG"
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + updaterObj.timeStamp
          ));
          updaterPingOutstanding = 0;
          updaterMessageReady = true;
        break;

        case "stats":
          console.log(chalkLog("UPDATE STATS COMPLETE"
            + " | DB\n" + jsonPrint(updaterObj.db)
          ));
          updaterMessageReady = true;
          if (updaterObj.db) {
            statsObj.db.totalAdmins = updaterObj.db.totalAdmins;
            statsObj.db.totalUsers = updaterObj.db.totalUsers;
            statsObj.db.totalViewers = updaterObj.db.totalViewers;
            statsObj.db.totalGroups = updaterObj.db.totalGroups;
            statsObj.db.totalSessions = updaterObj.db.totalSessions;
            statsObj.db.totalWords = updaterObj.db.totalWords;
          }
        break;

        case "sendKeywordsComplete":
          console.log(chalkLog("UPDATE KEYWORDS COMPLETE | " + moment().format(compactDateTimeFormat)));
          updaterMessageReady = true;
          // keywordsUpdateComplete = true;
        break;

        case "keywordHashMapClear":
          keywordHashMap.clear();
          console.log(chalkLog("KEYWORD HASHMAP CLEAR"));
          updaterMessageReady = true;
        break;

        case "keywordRemove":
          keywordHashMap.remove(updaterObj.keyword.toLowerCase());
          console.log(chalkLog("KEYWORD REMOVE: " + updaterObj.keyword.toLowerCase()));
          updaterMessageReady = true;
        break;

        case "keyword":
          debugKeyword(chalkLog("KEYWORD: " + jsonPrint(updaterObj)));
          debugKeyword(chalkLog("UPDATE KEYWORD\n" + jsonPrint(updaterObj.keyword)));

          keywordHashMap.set(updaterObj.keyword.keywordId.toLowerCase(), updaterObj.keyword);
          updaterMessageReady = true;
        break;

        case "query":
          queryDb(updaterObj, function(err, queryWordObj){

              if (err){
                console.log(chalkError("QUERY DB ERROR\n" + jsonPrint(err)));
              }

              var dmString = "QUERY"
                + " | " + hostname 
                + "\n" + queryWordObj.nodeId 
                + "\n" + queryWordObj.mentions + " Ms" 
                + "\nCREATED: " + moment(parseInt(queryWordObj.createdAt)).format(compactDateTimeFormat) 
                + "\nLAST: " + moment(parseInt(queryWordObj.lastSeen)).format(compactDateTimeFormat)
                + "\n" + jsonPrint(queryWordObj.keywords);

              console.log(chalkLog(dmString));

              sendDirectMessage("threecee", dmString, function(err, res){
                if (!err) {
                  console.log(chalkLog("SENT TWITTER DM: " + dmString));
                  debug(chalkInfo("SEND DM RES\n" + jsonPrint(res)));
                }
                else {
                  switch (err.code) {
                    case 226:
                      console.log(chalkError("*** TWITTER DM SEND ERROR: LOOKS LIKE AUTOMATED TX: CODE: " + err.code));

                      setTimeout(function(){
                        console.log(chalkError("... RETRY #1 TWITTER DM " + dmString));
                        sendDirectMessage("threecee", dmString, function(err, res){
                          if (!err) {
                            console.log(chalkLog("SENT TWITTER DM: " + dmString));
                            debug(chalkInfo("SEND DM RES\n" + jsonPrint(res)));
                          }
                          else {
                            switch (err.code) {
                              case 226:
                                console.log(chalkError("*** TWITTER DM SEND ERROR: LOOKS LIKE AUTOMATED TX: CODE: " + err.code));

                                setTimeout(function(){
                                  console.log(chalkError("... RETRY #2 TWITTER DM " + dmString));
                                  sendDirectMessage("threecee", dmString, function(err, res){
                                    if (!err) {
                                      console.log(chalkLog("SENT TWITTER DM: " + dmString));
                                      debug(chalkInfo("SEND DM RES\n" + jsonPrint(res)));
                                    }
                                    else {
                                      switch (err.code) {
                                        case 226:
                                          console.log(chalkError("*** TWITTER DM SEND ERROR: LOOKS LIKE AUTOMATED TX: CODE: " + err.code));
                                        break;
                                        default:
                                          console.log(chalkError("*** TWITTER DM SEND ERROR: " + jsonPrint(err)));
                                      }
                                    }

                                  });
                                }, randomInt(14700,34470));
                              break;
                              default:
                                console.log(chalkError("*** TWITTER DM SEND ERROR: " + jsonPrint(err)));
                            }
                          }
                        });
                      }, randomInt(14700,34470));
                    break;
                    default:
                      console.log(chalkError("*** TWITTER DM SEND ERROR: " + jsonPrint(err)));
                  }
                }
              });

          });
        break;

        default:
          console.log(chalkError("??? UPDATE UNKNOWN TYPE\n" + jsonPrint(updaterObj)));
          updaterMessageReady = true;
      }

    }
  }, interval);
}

function initSorter(callback){

  if (statsObj.children.sorter === undefined){
    statsObj.children.sorter = {};
    statsObj.children.sorter.errors = 0;
  }

  if (sorter !== undefined) {
    console.error("KILLING PREVIOUS SORTER | " + sorter.pid);
    sorter.kill("SIGINT");
  }

  var s = cp.fork(`${__dirname}/js/libs/sorter.js`);

  s.on("message", function(m){
    debug(chalkAlert("SORTER RX"
      + " | " + m.op
      // + "\n" + jsonPrint(m)
    ));
    sorterMessageRxQueue.push(m);
  });

  s.send({
    op: "INIT",
    interval: DEFAULT_INTERVAL
  }, function(err){
    if (err) {
      console.error(chalkError("*** SORTER SEND ERROR"
        + " | " + err
      ));
    }
  });

  s.on("error", function(err){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER ERROR ***"
      + " \n" + jsonPrint(err)
    ));

    configEvents.emit("CHILD_ERROR", { name: "sorter" });
  });

  s.on("exit", function(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER EXIT ***"
      + " | PID: " + s.pid
      + " | EXIT CODE: " + code
    ));

    if (code > 0) { configEvents.emit("CHILD_ERROR", { name: "sorter" }); }
  });

  s.on("close", function(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER CLOSE ***"
      + " | PID: " + s.pid
      + " | EXIT CODE: " + code
    ));
  });

  sorter = s;

  if (callback !== undefined) { callback(null, sorter); }
}

var updaterPingInterval;
function initUpdater(callback){

  clearInterval(updaterPingInterval);

  if (updater !== undefined) {
    console.error("KILLING PREVIOUS UPDATER | " + updater.pid);
    updater.kill("SIGINT");
  }

  if (statsObj.children.updater === undefined){
    statsObj.children.updater = {};
    statsObj.children.updater.errors = 0;
  }

  var u = cp.fork(`${__dirname}/js/libs/updater.js`);

  u.on("error", function(err){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER ERROR ***"
      + " \n" + jsonPrint(err)
    ));

    clearInterval(updaterPingInterval);

    configEvents.emit("CHILD_ERROR", { name: "updater" });
    
  });

  u.on("exit", function(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER EXIT ***"
      + " | EXIT CODE: " + code
    ));

    clearInterval(updaterPingInterval);

    if (code > 0) { configEvents.emit("CHILD_ERROR", { name: "updater" }); }

  });

  u.on("close", function(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER CLOSE ***"
      + " | EXIT CODE: " + code
    ));

    clearInterval(updaterPingInterval);
  });

  u.on("message", function(m){
    debug(chalkInfo("UPDATER RX\n" + jsonPrint(m)));
    updaterMessageQueue.push(m);
  });

  u.send({
    op: "INIT",
    folder: ".",
    keywordFile: defaultDropboxKeywordFile,
    interval: KEYWORDS_UPDATE_INTERVAL
  }, function(err){
    if (err) {
      console.error(chalkError("*** UPDATER SEND ERROR"
        + " | " + err
      ));
    }
  });

  // initUpdaterPingInterval(60000);

  updater = u;

  if (callback !== undefined) { callback(null, u); }
}

function initTweetParser(callback){

  if (tweetParser !== undefined) {
    console.error("KILLING PREVIOUS UPDATER | " + tweetParser.pid);
    tweetParser.kill("SIGINT");
  }

  if (statsObj.children.tweetParser === undefined){
    statsObj.children.tweetParser = {};
    statsObj.children.tweetParser.errors = 0;
  }

  var twp = cp.fork(`${__dirname}/js/libs/tweetParser.js`);

  twp.on("message", function(m){
    debug(chalkAlert("TWEET PARSER RX MESSAGE"
      + " | OP: " + m.op
      // + "\n" + jsonPrint(m)
    ));
    tweetParserMessageRxQueue.push(m);
  });

  twp.send({
    op: "INIT",
    interval: TWEET_PARSER_INTERVAL
  }, function(err){
    if (err) {
      console.error(chalkError("*** TWEET PARSER SEND ERROR"
        + " | " + err
      ));
      tweetParserReady = true;
    }
  });

  twp.on("error", function(err){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER ERROR ***"
      + " \n" + jsonPrint(err)
    ));
  });

  twp.on("exit", function(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER EXIT ***"
      + " | EXIT CODE: " + code
    ));
  });

  twp.on("close", function(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER CLOSE ***"
      + " | EXIT CODE: " + code
    ));
  });

  tweetParser = twp;

  if (callback !== undefined) { callback(null, twp); }
}

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

  socket.on("tweet", function(tw) {
    statsObj.twitter.tweetsReceived += 1;
    debug(chalkSocket("tweet" 
      + " [" + statsObj.twitter.tweetsReceived + "]"
      // + " | " + socket.id
      + " | " + tw.id_str
      + " | " + tw.user.id_str
      + " | " + tw.user.screen_name
      + " | " + tw.user.name
      // + jsonPrint(rxNodeObj)
    ));

    if (tweetRxQueue.length > MAX_Q){
      console.log(chalkError("*** MAX QUEUE [" + tweetRxQueue.length + "] | T<"
        + " | " + tw.id_str
        + " | " + tw.user.screen_name
      ));
    }
    else if (tw.user) {
      tweetRxQueue.push(tw);
      debug(chalkLog("T<"
        + " [ RXQ: " + tweetRxQueue.length + "]"
        + " [ TPQ: " + tweetParserQueue.length + "]"
        + " | " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }
    else{
      console.log(chalkAlert("NULL USER T*<"
        + " [ RXQ: " + tweetRxQueue.length + "]"
        + " [ TPQ: " + tweetParserQueue.length + "]"
        + " | " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }

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

var updateTimeSeriesCount = 0;
function initRateQinterval(interval){

  var wsObj;
  console.log(chalkLog("INIT RATE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(rateQinterval);

  statsObj.obamaPerMinute = 0.0;
  statsObj.trumpPerMinute = 0.0;
  statsObj.wordsPerMin = 0.0;
  statsObj.wordsPerSecond = 0.0;
  statsObj.maxWordsPerMin = 0.0;
  statsObj.maxTweetsPerMin = 0.0;

  var prevTestValue = 47;

  rateQinterval = setInterval(function () {

    wsObj = wordStats.toJSON();
    if (!wsObj) {return;}

    statsObj.wordsPerSecond = wsObj.wordsPerSecond[metricsRate];
    statsObj.wordsPerMin = wsObj.wordsPerMinute[metricsRate];

    statsObj.obamaPerMinute = wsObj.obamaPerMinute[metricsRate];
    statsObj.trumpPerMinute = wsObj.trumpPerMinute[metricsRate];

    debug(chalkLog(moment.utc().format(compactDateTimeFormat)
      + " | WPS: " + statsObj.wordsPerSecond.toFixed(2)
      + " | WPM: " + statsObj.wordsPerMin.toFixed(0)
      + " | OPM: " + statsObj.obamaPerMinute.toFixed(0)
      + " | TrPM: " + statsObj.trumpPerMinute.toFixed(0)
    ));

    if (statsObj.wordsPerMin > statsObj.maxWordsPerMin) {
      // maxWordsPerMin = wordsPerMinute;
      // maxWordsPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX WPM: " + statsObj.wordsPerMin.toFixed(0)));
      statsObj.maxWordsPerMin = statsObj.wordsPerMin;
      statsObj.maxWordsPerMinTime = moment().valueOf();
    }

    if (statsObj.obamaPerMinute > statsObj.maxObamaPerMin) {
      // maxObamaPerMin = obamaPerMinute;
      // maxObamaPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX OPM: " + statsObj.obamaPerMinute.toFixed(0)));
      statsObj.maxObamaPerMin = statsObj.obamaPerMinute;
      statsObj.maxObamaPerMinTime = moment().valueOf();
    }

    if (statsObj.trumpPerMinute > statsObj.maxTrumpPerMin) {
      // maxTrumpPerMin = trumpPerMinute;
      // maxTrumpPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX TrPM: " + statsObj.trumpPerMinute.toFixed(0)));
      statsObj.maxTrumpPerMin = statsObj.trumpPerMinute;
      statsObj.maxTrumpPerMinTime = moment().valueOf();
    }

    if (updateTimeSeriesCount === 0){

      var params = {};
      params.op = "SORT";
      params.sortKey = metricsRate;
      params.max = configuration.maxTopTerms;
      params.obj = {};
      params.obj = wordMeter;

      if (sorter !== undefined) {
        sorter.send(params, function(err){
          if (err) {
            console.error(chalkError("SORTER SEND ERROR"
              + " | " + err
            ));
          }
        });
      }

      if (enableGoogleMetrics) {

        var testDataPoint = {};
        testDataPoint.metricType = "word/test/random";
        testDataPoint.value = prevTestValue + randomInt(-20,20);
        testDataPoint.metricLabels = {server_id: "TEST"};
        addMetricDataPoint(testDataPoint);
        
        var queueNames = Object.keys(statsObj.queues);

        queueNames.forEach(function(queueName){
          var queueDataPoint = {};
          queueDataPoint.metricType = "word/queues/" + queueName;
          queueDataPoint.value = statsObj.queues[queueName];
          queueDataPoint.metricLabels = {server_id: "QUEUE"};
          addMetricDataPoint(queueDataPoint);
        }); 

        var memoryRssDataPoint = {};
        memoryRssDataPoint.metricType = "memory/rss";
        memoryRssDataPoint.value = statsObj.memory.memoryUsage.rss;
        memoryRssDataPoint.metricLabels = {server_id: "MEM"};
        addMetricDataPoint(memoryRssDataPoint);

        var memoryHeapUsedDataPoint = {};
        memoryHeapUsedDataPoint.metricType = "memory/heap_used";
        memoryHeapUsedDataPoint.value = statsObj.memory.memoryUsage.heapUsed;
        memoryHeapUsedDataPoint.metricLabels = {server_id: "MEM"};
        addMetricDataPoint(memoryHeapUsedDataPoint);

        var memoryHeapTotalDataPoint = {};
        memoryHeapTotalDataPoint.metricType = "memory/heap_total";
        memoryHeapTotalDataPoint.value = statsObj.memory.memoryUsage.heapTotal;
        memoryHeapTotalDataPoint.metricLabels = {server_id: "MEM"};
        addMetricDataPoint(memoryHeapTotalDataPoint);
      }

      if (enableGoogleMetrics && tssServer.connected) {
        var dataPointTssTpm = {};
        dataPointTssTpm.metricType = "twitter/tweets_per_minute";
        dataPointTssTpm.value = statsObj.utilities[tssServer.user.userId].tweetsPerMinute;
        dataPointTssTpm.metricLabels = {server_id: "TSS"};
        addMetricDataPoint(dataPointTssTpm);

        var dataPoint2 = {};
        dataPoint2.metricType = "twitter/tweet_limit";
        dataPoint2.value = statsObj.utilities[tssServer.user.userId].twitterLimit;
        dataPoint2.metricLabels = {server_id: "TSS"};
        addMetricDataPoint(dataPoint2);
      }

      if (enableGoogleMetrics && tmsServer.connected) {
        var dataPointTmsTpm = {};
        dataPointTmsTpm.metricType = "twitter/tweets_per_minute";
        dataPointTmsTpm.value = statsObj.utilities[tmsServer.user.userId].tweetsPerMinute;
        dataPointTmsTpm.metricLabels = {server_id: "TMS"};
        addMetricDataPoint(dataPointTmsTpm);
        
        if (statsObj.utilities[tmsServer.user.userId].twitterLimit) {
          var dataPointTmsTpm2 = {};
          dataPointTmsTpm2.metricType = "twitter/tweet_limit";
          dataPointTmsTpm2.value = statsObj.utilities[tmsServer.user.userId].twitterLimit;
          dataPointTmsTpm2.metricLabels = {server_id: "TMS"};
          addMetricDataPoint(dataPointTmsTpm2);
        }
      }

      // word/words_per_minute
      if (enableGoogleMetrics) {
        var dataPointWpm = {};
        dataPointWpm.metricType = "word/words_per_minute";
        dataPointWpm.value = statsObj.wordsPerMin;
        dataPointWpm.metricLabels = {server_id: "WORD"};
        addMetricDataPoint(dataPointWpm);
        // word/obama_per_minute
        var dataPointOpm = {};
        dataPointOpm.metricType = "word/obama_per_minute";
        dataPointOpm.value = statsObj.obamaPerMinute;
        dataPointOpm.metricLabels = {server_id: "WORD"};
        addMetricDataPoint(dataPointOpm);
        // word/trump_per_minute
        var dataPointOTrpm = {};
        dataPointOTrpm.metricType = "word/trump_per_minute";
        dataPointOTrpm.value = statsObj.trumpPerMinute;
        dataPointOTrpm.metricLabels = {server_id: "WORD"};
        addMetricDataPoint(dataPointOTrpm);
        // util/global/number_of_utils
        var dataPointUtils = {};
        dataPointUtils.metricType = "util/global/number_of_utils";
        dataPointUtils.value = Object.keys(utilNameSpace.connected).length;
        dataPointUtils.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointUtils);
        // user/global/number_of_viewers
        var dataPointViewers = {};
        dataPointViewers.metricType = "user/global/number_of_viewers";
        dataPointViewers.value = statsObj.caches.viewerCache.stats.keys;
        dataPointViewers.metricLabels = {server_id: "USER"};
        addMetricDataPoint(dataPointViewers);
        // user/global/number_of_users
        var dataPointUsers = {};
        dataPointUsers.metricType = "user/global/number_of_users";
        dataPointUsers.value = statsObj.caches.userCache.stats.keys;
        dataPointUsers.metricLabels = {server_id: "USER"};
        addMetricDataPoint(dataPointUsers);
        // util/global/number_of_groups
        var dataPointGroups = {};
        dataPointGroups.metricType = "util/global/number_of_groups";
        dataPointGroups.value = statsObj.caches.groupCache.stats.keys;
        dataPointGroups.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointGroups);
        // util/global/number_of_entities
        var dataPointEntities = {};
        dataPointEntities.metricType = "util/global/number_of_entities";
        dataPointEntities.value = statsObj.caches.entityCache.stats.keys;
        dataPointEntities.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointEntities);
        // user/global/number_of_sessions
        var dataPointSessions = {};
        dataPointSessions.metricType = "util/global/number_of_sessions";
        dataPointSessions.value = statsObj.caches.sessionCache.stats.keys;
        dataPointSessions.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointSessions);
      }
    }

    updateTimeSeriesCount += 1;

    if (updateTimeSeriesCount > 5) {updateTimeSeriesCount = 0;}
  }, interval);
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

  initTweetParser();
  initInternetCheckInterval(10000);

  initAppRouting(function(err) {
    initSocketNamespaces();
    callback(err);
  });
}

configEvents.on("CHILD_ERROR", function(childObj){

  console.error(chalkError("CHILD_ERROR"
    + " | " + childObj.name
  ));

  if (statsObj.children[childObj.name] === undefined){
    statsObj.children[childObj.name] = {};
    statsObj.children[childObj.name].errors = 0;
  }

  statsObj.children[childObj.name].errors += 1;

  switch(childObj.name){
    case "tweetParser":
      console.error("KILL TWEET PARSER");
      if (tweetParser !== undefined) { tweetParser.kill("SIGINT"); }
      initDbUpdater();
    break;
    case "updater":
      console.error("KILL UPDATER");
      if (updater !== undefined) { updater.kill("SIGINT"); }
      initUpdater();
    break;
    case "sorter":
      console.error("KILL SORTER");
      if (sorter !== undefined) { sorter.kill("SIGINT"); }
      initSorter();
    break;
  }
});

//=================================
// BEGIN !!
//=================================
initialize(configuration, function(err) {
  if (err) {
    debug(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
  } 
  else {
    debug(chalkLog("INITIALIZE COMPLETE"));
    initUpdaterMessageQueueInterval(DEFAULT_INTERVAL);
    initSorterMessageRxQueueInterval(DEFAULT_INTERVAL);

    initUpdater(function(err, udtr){
      if (err) {
        console.error(chalkError("INIT UPDATER ERROR: " + err));
        if (udtr !== undefined) { 
          udtr.kill("SIGKILL"); 
        }
        if (updater !== undefined) { 
          updater.kill("SIGKILL"); 
        }
      }
      else {
        updater = udtr;
      }
    });
    
    initSorter(function(err, srtr){
      if (err) {
        console.error(chalkError("INIT UPDATER ERROR: " + err));
        if (srtr !== undefined) { 
          srtr.kill("SIGKILL"); 
        }
        if (updater !== undefined) { 
          sorter.kill("SIGKILL"); 
        }
      }
      else {
        sorter = srtr;
      }
    });
    
    initRateQinterval(1000);
    initTwitterRxQueueInterval(TWITTER_RX_QUEUE_INTERVAL);
    initTweetParserMessageRxQueueInterval(TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL);
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
