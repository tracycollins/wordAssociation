/*jslint node: true */
"use strict";

// require('longjohn');

var DEFAULT_INTERVAL = 10; // ms
var statsCountsComplete = false;
var maxTopTerms = 20;
var compactDateTimeFormat = "YYYYMMDD HHmmss";

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
// var ONE_HOUR = ONE_MINUTE * 60;
// var ONE_DAY = ONE_HOUR * 24;
// var quitOnErrorFlag = false;

var wordsApiKey = "RWwyknmI1OmshYkPUYAQyHVv1Cbup1ptubzjsn2F19wbnAlSEf";
var wapiUrlRoot = "https://wordsapiv1.p.mashape.com/words/";

var primarySessionObj;

var configuration = {};
configuration.enableStdin = process.env.WA_ENABLE_STDIN;
configuration.quitOnError = false;

var languageServer = {};
var tssServer = {};
tssServer.connected = false;
tssServer.user = {};
tssServer.socket = {};

var tmsServer = {};
tmsServer.connected = false;
tmsServer.user = {};
tmsServer.socket = {};

var numberUsersTotal = 0;
var numberViewersTotal = 0;

var DEFAULT_KEYWORD_VALUE = 100; // on scale of 1-100
var MIN_WORD_METER_COUNT = 10;
var MIN_METRIC_VALUE = 5;

var twitterYamlConfigFile = process.env.DEFAULT_TWITTER_CONFIG;

var CUSTOM_GOOGLE_APIS_PREFIX = "custom.googleapis.com";

var enableGoogleMetrics = (process.env.ENABLE_GOOGLE_METRICS !== undefined) ? process.env.ENABLE_GOOGLE_METRICS : false;

var Monitoring = require("@google-cloud/monitoring");
var googleMonitoringClient = Monitoring.v3().metricServiceClient();

var defaults = require("object.defaults");
var chalk = require("chalk");
var moment = require("moment");
var Measured = require("measured");

var rateQinterval;
var internetCheckInterval;
var updateTrendsInterval;
var statsInterval;
var sessionViewQueueInterval;
var sessionEventHandlerInterval;
var rxWordQueueInterval;
var dbUpdaterMessageRxQueueInterval;
var sorterMessageRxQueueInterval;
var updaterMessageQueueInterval;
var dbUpdateEntityQueueInterval;
var dbUpdateGroupQueueInterval;
var dbUpdateWordQueueInterval;

var entityStats = Measured.createCollection();
var entityStats = new Measured.Gauge(function() {
  return process.memoryUsage().rss;
});
var wordMeter = {};

var wordStats = Measured.createCollection();
wordStats.meter("wordsPerSecond", {rateUnit: 1000, tickInterval: 1000});
wordStats.meter("wordsPerMinute", {rateUnit: 60000, tickInterval: 1000});
wordStats.meter("obamaPerSecond", {rateUnit: 1000, tickInterval: 1000});
wordStats.meter("obamaPerMinute", {rateUnit: 60000, tickInterval: 1000});
wordStats.meter("trumpPerSecond", {rateUnit: 1000, tickInterval: 1000});
wordStats.meter("trumpPerMinute", {rateUnit: 60000, tickInterval: 1000});

// MONGO DB doesn"t like indexes/keys > 1024 characters
var MAX_DB_KEY_LENGTH = 200;

var wapiSearchEnabled = false;
var wapiForceSearch = true;
var dmOnUnknownSession = false;
var ioReady = false;
var groupsUpdateComplete = false;
var entitiesUpdateComplete = false;
var keywordsUpdateComplete = false;
var updateComplete = groupsUpdateComplete && entitiesUpdateComplete && keywordsUpdateComplete;

var tweetsPerMinute = 0.0;
// var tweetsPerSecond = 0.0;
var maxTweetsPerMin = 0;
var maxTweetsPerMinTime = moment.utc();

var wordsPerMinute = 0.0;
var wordsPerSecond = 0.0;
var maxWordsPerMin = 0;
var maxWordsPerMinTime = moment.utc();

var obamaPerMinute = 0.0;
var maxObamaPerMin = 0;
var maxObamaPerMinTime = moment.utc();

var trumpPerMinute = 0.0;
var maxTrumpPerMin = 0;
var maxTrumpPerMinTime = moment.utc();


var config = require("./config/config");
var util = require("util");
var fs = require("fs");
var os = require("os");
var async = require("async");
var HashMap = require("hashmap").HashMap;
var Dropbox = require("dropbox");
var unirest = require("unirest");
var debug = require("debug")("wa");
var debugKeyword = require("debug")("kw");
var debugWapi = require("debug")("wapi");
var debugAppGet = require("debug")("appGet");
var commandLineArgs = require("command-line-args");

var cp = require("child_process");
var updater;
var dbUpdater;
var sorter;

var Twit = require("twit");
var twit;
var twitterStream;
var twitterDMenabled = false;

var express = require("./config/express");
var mongoose = require("./config/mongoose");
// var request = require("request");
var yaml = require("yamljs");
var EventEmitter2 = require("eventemitter2").EventEmitter2;
var EventEmitter = require("events").EventEmitter;
var NodeCache = require("node-cache");

var db = mongoose();

var Admin = require("mongoose").model("Admin");
var Viewer = require("mongoose").model("Viewer");
var User = require("mongoose").model("User");
var Group = require("mongoose").model("Group");
var Entity = require("mongoose").model("Entity");
var Session = require("mongoose").model("Session");
var Word = require("mongoose").model("Word");

var groupServer = require("./app/controllers/group.server.controller");
var entityServer = require("./app/controllers/entity.server.controller");
var wordServer = require("./app/controllers/word.server.controller");

var app = express();

var http = require("http");
var httpServer = http.createServer(app);

var io;
var dns = require("dns");
var path = require("path");
var net = require("net");
var Queue = require("queue-fifo");

var rxWordQueue = new Queue();
var sessionQueue = new Queue();
var dbUpdateGroupQueue = new Queue();
var dbUpdateEntityQueue = new Queue();
var dbUpdateWordQueue = new Queue();
var updaterMessageQueue = new Queue();
var dbUpdaterMessageRxQueue = new Queue();
var dbUpdaterMessageTxQueue = new Queue();
var sorterMessageRxQueue = new Queue();

var updateSessionViewQueue = [];

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

var DB_UPDATE_INTERVAL = 100;
var GROUP_UPDATE_INTERVAL = 15000;
var MAX_RESPONSE_QUEUE_SIZE = 1000;
var OFFLINE_MODE = false;
var internetReady = false;
var pollTwitterFriendsIntervalTime = 5*ONE_MINUTE;

var TOPTERMS_CACHE_DEFAULT_TTL = 300;
var TRENDING_CACHE_DEFAULT_TTL = 300; // seconds
var ADMIN_CACHE_DEFAULT_TTL = 300; // seconds
var VIEWER_CACHE_DEFAULT_TTL = 300; // seconds
var UTIL_CACHE_DEFAULT_TTL = 300; // seconds
var USER_CACHE_DEFAULT_TTL = 300; // seconds
var GROUP_CACHE_DEFAULT_TTL = 300; // seconds
var ENTITY_CACHE_DEFAULT_TTL = 300; // seconds
var SESSION_CACHE_DEFAULT_TTL = 0; // seconds
var WORD_CACHE_TTL = 300; // seconds
var IP_ADDRESS_CACHE_DEFAULT_TTL = 300;

var MAX_WORDCHAIN_LENGTH = 10;
var SESSION_WORDCHAIN_REQUEST_LIMIT = 25;

var ignoreWordsArray = [
  "r",
  "y",
  "se",
  "que",
  "el",
  "en",
  "la",
  "por",
  "que",
  "es",
  "los",
  "las",
  "y",
  "в",
  "'",
  "-",
  "...",
  "a",
  "about",
  "across",
  "after",
  "all",
  "also",
  "an",
  "and",
  "ao",
  "aos",
  "applause",
  "are",
  "as",
  "at",
  "b",
  "be",
  "because",
  "been",
  "before",
  "being",
  "but",
  "by",
  "can",
  "can",
  "could",
  "could",
  "da",
  "day",
  "de",
  "did",
  "do",
  "dont",
  "e",
  "else",
  "em",
  "for",
  "from",
  "get",
  "go",
  "going",
  "had",
  "has",
  "hasnt",
  "have",
  "havent",
  "he",
  "her",
  "here",
  "him",
  "his",
  "how",
  "htt...",
  "i",
  "if",
  "im",
  "in",
  "into",
  "is",
  "isnt",
  "it",
  "its",
  "just",
  "less",
  "like",
  "lot",
  "m",
  "may",
  "me",
  "more",
  "my",
  "nas",
  "new",
  "no",
  "nos",
  "not",
  "of",
  "old",
  "on",
  "or",
  "os",
  "ou",
  "our",
  "out",
  "over",
  "rt",
  "s",
  "said",
  "say",
  "saying",
  "she",
  "should",
  "so",
  "some",
  "than",
  "that",
  "thats",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "though",
  "to",
  "too",
  "upon",
  "us",
  "ve",
  "want",
  "was",
  "wasnt",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "whose",
  "why",
  "will",
  "with",
  "wont",
  "would",
  "you",
  "your",
  "|",
  "é",
  "–"
];

// ==================================================================
// SESSION MODES: STREAM  ( session.config.mode )
// ==================================================================

var chalkSorter = chalk.green;
var chalkRedBold = chalk.bold.red;
var chalkTwitter = chalk.blue;
var chalkWapi = chalk.red;
var chalkViewer = chalk.cyan;
var chalkUser = chalk.green;
var chalkUtil = chalk.blue;
var chalkRed = chalk.red;
var chalkAdmin = chalk.bold.cyan;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.red;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkSession = chalk.blue;
var chalkResponse = chalk.blue;
var chalkBht = chalk.gray;
// var chalkMw = chalk.yellow;
var chalkDb = chalk.gray;

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

debug("DB\n" + db);

function quit(message) {
  console.log("\n... QUITTING ...");
  // if (sorter !== undefined) { sorter.kill("SIGHUP"); }
  // if (updater !== undefined) { updater.kill("SIGHUP"); }
  // if (dbUpdater !== undefined) { dbUpdater.kill("SIGHUP"); }
  var msg = "";
  if (message) {msg = message;}
  console.log("QUIT MESSAGE\n" + msg);
  process.exit();
}

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

process.on("exit", function() {
  if (sorter !== undefined) { sorter.kill("SIGINT"); }
  if (updater !== undefined) { updater.kill("SIGINT"); }
  if (dbUpdater !== undefined) { dbUpdater.kill("SIGINT"); }
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

function getTimeNow() {
  var d = new Date();
  return d.getTime();
}

function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

var statsObj = {};

statsObj.hostname = hostname;
statsObj.name = "Word Association Server Status";
statsObj.startTime = moment().valueOf();
statsObj.timeStamp = moment().format(compactDateTimeFormat);
statsObj.upTime = os.uptime() * 1000;
statsObj.runTime = 0;
statsObj.runTimeArgs = process.argv;

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
  statsObj.memory.maxHeap = Math.max(statsObj.memory.maxHeap, statsObj.memory.heap);
  statsObj.memory.memoryUsage = process.memoryUsage();

  statsObj.queues.rxWordQueue = rxWordQueue.size();
  statsObj.queues.sessionQueue = sessionQueue.size();
  statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.size();
  statsObj.queues.dbUpdateWordQueue = dbUpdateWordQueue.size();
  statsObj.queues.dbUpdaterMessageRxQueue = dbUpdaterMessageRxQueue.size();
  statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
  statsObj.queues.dbUpdateEntityQueue = dbUpdateEntityQueue.size();
  statsObj.queues.updateSessionViewQueue = updateSessionViewQueue.length;

  if (options) {
    console.log(chalkAlert("STATS\n" + jsonPrint(statsObj)));
  }
  else {
    console.log(chalkLog("S"
      // + " | " + statsObj.socketId
      + " | ELAPSED: " + statsObj.elapsed
      + " | START: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | HEAP: " + statsObj.memory.heap.toFixed(0) + " MB"
      + " | MAX HEAP: " + statsObj.memory.maxHeap.toFixed(0)
    ));
  }
}


var stdin;

var enableStdin = { name: "enableStdin", alias: "i", type: Boolean, defaultValue: false};
var quitOnError = { name: "quitOnError", alias: "q", type: Boolean, defaultValue: false};
var testMode = { name: "testMode", alias: "T", type: Boolean, defaultValue: false};

var optionDefinitions = [enableStdin, quitOnError, testMode];
var commandLineConfig = commandLineArgs(optionDefinitions);

console.log(chalkInfo("COMMAND LINE CONFIG\n" + jsonPrint(commandLineConfig)));
console.log("COMMAND LINE OPTIONS\n" + jsonPrint(commandLineConfig));

// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================
var groupHashMap = new HashMap();
var serverGroupHashMap = new HashMap(); // server specific keywords

var entityChannelGroupHashMap = new HashMap();
var serverEntityChannelGroupHashMap = new HashMap();

var ignoreWordHashMap = new HashMap();
var keywordHashMap = new HashMap();
var topicHashMap = new HashMap();

var serverGroupsJsonObj = {};
var serverKeywordsJsonObj = {};

// ==================================================================
// SERVER STATUS
// ==================================================================

var tempDateTime = moment();

var heartbeatsSent = 0;

var numberUsersMax = 0;
var numberUsersMaxTime = moment().valueOf();

var numberTestUsersMax = 0;
var numberTestUsersMaxTime = moment().valueOf();

var numberUsersTotalMax = 0;
var numberUsersTotalMaxTime = moment().valueOf();

var numberUtilsMax = 0;
var numberUtilsMaxTime = moment().valueOf();

var numberViewersMax = 0;
var numberViewersMaxTime = moment().valueOf();

var numberTestViewersMax = 0;
var numberTestViewersMaxTime = moment().valueOf();

var numberViewersTotalMax = 0;
var numberViewersTotalMaxTime = moment().valueOf();

console.log(
  "\n\n====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nHOST           " + hostname
  + "\nPROCESS ID     " + process.pid 
  + "\nSTARTED        " + moment().format(compactDateTimeFormat)
  + "\nGOOGLE METRICS " + enableGoogleMetrics
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n\n"
);

console.log("OFFLINE_MODE: " + OFFLINE_MODE);



var serverSessionConfig = {};

var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

var numberAdmins = 0;

var numberUtils = 0;
var numberUsers = 0;
var numberViewers = 0;
var numberTestViewers = 0;
var numberTestUsers = 0;

var dnsHostHashMap = new HashMap();
var localHostHashMap = new HashMap();


var adminNameSpace;
var utilNameSpace;
var userNameSpace;
var viewNameSpace;
// var testUsersNameSpace;
// var testViewersNameSpace;

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

var monitorHashMap = {};

// ==================================================================
// WAPI WAPI_REQ_RESERVE_PRCNT
// ==================================================================
// var wapiReqReservePercent = process.env.WAPI_REQ_RESERVE_PRCNT;

// if (wapiReqReservePercent === undefined) {wapiReqReservePercent = WAPI_REQ_RESERVE_PRCNT;}
// console.log("WAPI_REQ_RESERVE_PRCNT: " + wapiReqReservePercent);

// ==================================================================
// TOP TERM WPM  CACHE
// ==================================================================
var wordsPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (wordsPerMinuteTopTermTtl === undefined) {wordsPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;}
console.log("TOP TERMS WPM CACHE TTL: " + wordsPerMinuteTopTermTtl + " SECONDS");

// ==================================================================
// ADMIN ADDRESS CACHE
// ==================================================================
var adminCacheTtl = process.env.ADMIN_CACHE_DEFAULT_TTL;
if (adminCacheTtl === undefined) {adminCacheTtl = ADMIN_CACHE_DEFAULT_TTL;}
console.log("ADMIN CACHE TTL: " + adminCacheTtl + " SECONDS");

// ==================================================================
// IP ADDRESS CACHE
// ==================================================================
var ipAddressCacheTtl = process.env.IP_ADDRESS_CACHE_DEFAULT_TTL;
if (ipAddressCacheTtl === undefined) {ipAddressCacheTtl = IP_ADDRESS_CACHE_DEFAULT_TTL;}
console.log("IP ADDRESS CACHE TTL: " + ipAddressCacheTtl + " SECONDS");

// ==================================================================
// TWITTER TRENDING TOPIC CACHE
// ==================================================================
var trendingCacheTtl = process.env.TRENDING_CACHE_DEFAULT_TTL;
if (trendingCacheTtl === undefined) {trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL;}
console.log("TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

// ==================================================================
// UTIL CACHE
// ==================================================================
var utilCacheTtl = process.env.UTIL_CACHE_DEFAULT_TTL;
if (utilCacheTtl === undefined) {utilCacheTtl = UTIL_CACHE_DEFAULT_TTL;}
console.log("UTIL CACHE TTL: " + utilCacheTtl + " SECONDS");

// ==================================================================
// VIEWER CACHE
// ==================================================================
var viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
if (viewerCacheTtl === undefined) {viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL;}
console.log("VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

// ==================================================================
// USER CACHE
// ==================================================================
var userCacheTtl = process.env.USER_CACHE_DEFAULT_TTL;
if (userCacheTtl === undefined) {userCacheTtl = USER_CACHE_DEFAULT_TTL;}
console.log("USER CACHE TTL: " + userCacheTtl + " SECONDS");

// ==================================================================
// GROUP CACHE
// ==================================================================
var groupCacheTtl = process.env.GROUP_CACHE_DEFAULT_TTL;
if (groupCacheTtl === undefined) {groupCacheTtl = GROUP_CACHE_DEFAULT_TTL;}
console.log("GROUP CACHE TTL: " + groupCacheTtl + " SECONDS");

// ==================================================================
// ENTITY CACHE
// ==================================================================
var entityCacheTtl = process.env.ENTITY_CACHE_DEFAULT_TTL;
if (entityCacheTtl === undefined) {entityCacheTtl = ENTITY_CACHE_DEFAULT_TTL;}
console.log("ENTITY CACHE TTL: " + entityCacheTtl + " SECONDS");

// ==================================================================
// SESSION CACHE
// ==================================================================
var sessionCacheTtl = process.env.SESSION_CACHE_DEFAULT_TTL;
if (sessionCacheTtl === undefined) {sessionCacheTtl = SESSION_CACHE_DEFAULT_TTL;}
console.log("SESSION CACHE TTL: " + sessionCacheTtl + " SECONDS");

// ==================================================================
// WORD CACHE
// ==================================================================
var wordCacheTtl = process.env.WORD_CACHE_TTL;
if (wordCacheTtl === undefined) {wordCacheTtl = WORD_CACHE_TTL;}
console.log("WORD CACHE TTL: " + wordCacheTtl + " SECONDS");

var wordsPerMinuteTopTermCache = new NodeCache({
  stdTTL: wordsPerMinuteTopTermTtl,
  checkperiod: 10
});

var adminCache = new NodeCache({
  stdTTL: adminCacheTtl,
  checkperiod: 10
});

var utilCache = new NodeCache({
  stdTTL: utilCacheTtl,
  checkperiod: 10
});

var viewerCache = new NodeCache({
  stdTTL: viewerCacheTtl,
  checkperiod: 10
});

var userCache = new NodeCache({
  stdTTL: userCacheTtl,
  checkperiod: 10
});

var trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: 10
});

var wordCache = new NodeCache({
  stdTTL: wordCacheTtl,
  checkperiod: 10
});

var sessionCache = new NodeCache({
  // useClones: false,
  // stdTTL: sessionCacheTtl,
  // checkperiod: 10
});

var entityCache = new NodeCache({
  stdTTL: entityCacheTtl,
  checkperiod: 10
});

var groupCache = new NodeCache({
  stdTTL: groupCacheTtl,
  checkperiod: 10
});

var ipAddressCache = new NodeCache({
  stdTTL: ipAddressCacheTtl,
  checkperiod: 10
});

// ==================================================================
// WORDS API
// ==================================================================
var wapiEvents = new EventEmitter();
var wapiRequests = 0;
var wapiOverLimits = 0;

var wapiOverLimitTime = moment.utc().endOf("day");
var wapiLimitResetTime = moment.utc().endOf("day");
var wapiTimeToReset = moment.utc().endOf("day").valueOf() - moment.utc().valueOf();
var wapiOverLimitFlag = false;

debug("WAPI OVER LIMIT TIME:  " + wapiOverLimitTime.format(compactDateTimeFormat));
debug("WAPI OVER LIMIT RESET: " + wapiOverLimitTime.format(compactDateTimeFormat));
debug("WAPI TIME TO RESET: " + msToTime(wapiTimeToReset));

var wapiOverLimitTimeOut = setTimeout(function() {
  wapiEvents.emit("WAPI_OVER_LIMIT_TIMEOUT");
}, wapiTimeToReset);

// ==================================================================
// CACHE HANDLERS
// ==================================================================
entityCache.on("set", function(userId, entityObj) {
    debug(chalkSession("ENT $"
      + " | " + moment().format(compactDateTimeFormat) 
      + " | ID: " + userId 
      + " \n" + jsonPrint(entityObj)
    ));
});

sessionCache.on("set", function(sessionId, sessionObj) {
  debug(chalkSession("SES $"
    + " | " + moment().format(compactDateTimeFormat) 
    + " | ID: " + sessionId 
    // + " | U: " + sessionObj.userId
    // + " \n" + jsonPrint(sessionObj)
  ));

  if (sessionObj.user && (sessionObj.user.mode === "SUBSTREAM")){
    entityCache.set(sessionObj.user.userId, sessionObj.user);
  }
});

sessionCache.on("expired", function(sessionId, sessionObj) {
  debug(chalkInfo("... SESS $ XXX"
    + " | " + sessionId
  ));
  sessionQueue.enqueue({
    sessionEvent: "SESSION_EXPIRED",
    sessionId: sessionId,
    session: sessionObj
  });

  io.of(sessionObj.namespace).to(sessionId).emit("SESSION_EXPIRED", sessionId);

  sessionObj.sessionEvent = "SESSION_DELETE";

  adminNameSpace.emit("SESSION_DELETE", sessionId);
  viewNameSpace.emit("SESSION_DELETE", sessionId);

  debug(chalkInfo("... $ SESS EXPIRED"
    + " | " + sessionObj.sessionId 
    + " | LS: " + moment(parseInt(sessionObj.lastSeen)).format(compactDateTimeFormat)
    + " | " + msToTime(moment().valueOf() - sessionObj.lastSeen) 
    + " | WCL: " + sessionObj.wordChain.length 
  ));
});

wordCache.on("set", function(word, wordObj) {
  if (wordObj.tags === undefined) {
    console.log(chalkInfo("wordCache SET"
      + " | " + word
      // + "\n" + jsonPrint(wordObj)
    ));
    if (configuration.quitOnError) { quit("wordCache SET TAGS UNDEFINED"); }
  }
});


userCache.on("expired", function(userId, userObj) {
  if (wordMeter[userId] !== undefined) {
    wordMeter[userId] = {};
    delete wordMeter[userId];
    console.log(chalkWarn("XXX WORD METER USER"
      + " | Ks: " + Object.keys(wordMeter).length
      + " | " + userId
    ));
  }
});

wordCache.on("expired", function(word, wordObj) {
  if (wordMeter[word] !== undefined) {
    wordMeter[word] = {};
    delete wordMeter[word];
    debug(chalkWarn("XXX WORD METER WORD"
      + " | Ks: " + Object.keys(wordMeter).length
      + " | " + word
    ));
  }
});

trendingCache.on( "expired", function(topic, topicObj){
  debug("CACHE TOPIC EXPIRED\n" + jsonPrint(topicObj));
  debug("CACHE TOPIC EXPIRED | " + topic + " | " + topicObj.name);
});


function updateWordMeter(wordObj, callback){

  var meterWordId;

  if ((wordObj.nodeType === "media") 
    || (wordObj.nodeType === "url")
    || (wordObj.nodeType === "keepalive")
    ) {
    callback(null, wordObj);
    return;
  }

  if (wordObj.tags === undefined) {
    console.log(chalkAlert("updateWordMeter\n" + jsonPrint(wordObj)));
    console.trace("UNDEFINED WORD TAGS updateWordMeter");
  }

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
    wordCache.set(meterWordId, wordObj);
    if (callback !== undefined) { callback(null, wordObj)};
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
    var meterObj = wordMeter[meterWordId].toJSON();
    wordObj.rate = meterObj["1MinuteRate"];
    wordCache.set(meterWordId, wordObj, function(){
      debug(chalkAlert("updateWordMeter MISS"
        + " | " + meterWordId
        + " | " + meterObj["1MinuteRate"].toFixed(2) + " WPM"
        // + "\n" + jsonPrint(wordObj)
      ));
      if (callback !== undefined) { callback(null, wordObj)};
    });
  }
  else {
    wordMeter[meterWordId].mark();
    var meterObj = wordMeter[meterWordId].toJSON();
    wordObj.rate = meterObj["1MinuteRate"];
    wordCache.set(meterWordId, wordObj, function(){
      debug(chalkAlert("updateWordMeter HIT "
        + " | " + meterWordId
        + " | " + meterObj["1MinuteRate"].toFixed(2) + " WPM"
        // + "\n" + jsonPrint(wordObj)
      ));
      if (callback !== undefined) { callback(null, wordObj)};
    });
  }

}

// ==================================================================
// ENV INIT
// ==================================================================

if (debug.enabled) {
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("NODE_ENV : " + process.env.NODE_ENV);
console.log("CLIENT HOST + PORT: " + "http://localhost:" + config.port);

// ==================================================================
// OFFLINE MODE
// ==================================================================
var OFFLINE_WORD_ASSO_STATS_FILE = process.env.OFFLINE_WORD_ASSO_STATS_FILE || "wordAssociationStats.json";
console.log("OFFLINE_WORD_ASSO_STATS_FILE :" + OFFLINE_WORD_ASSO_STATS_FILE);
var offlineStatsFile = hostname + "_" + OFFLINE_WORD_ASSO_STATS_FILE;
console.log("offlineStatsFile: " + offlineStatsFile);

// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
var WA_STATS_FILE = process.env.WA_STATS_FILE;
var DROPBOX_WA_STATS_FILE = process.env.DROPBOX_WA_STATS_FILE || "wordAssoServerStats.json";

var statsFolder = "/stats/" + hostname;
var statsFile = DROPBOX_WA_STATS_FILE;

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var serverGroupsFile = hostname + "_groups.json";
var serverKeywordsFile = hostname + "_keywords.json";

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

function loadYamlConfig(yamlFile, callback){
  console.log(chalkInfo("LOADING YAML CONFIG FILE: " + yamlFile));
  fs.exists(yamlFile, function(exists) {
    if (exists) {
      var cnf = yaml.load(yamlFile);
      console.log(chalkInfo("FOUND FILE " + yamlFile));
      callback(null, cnf);
    }
    else {
      var err = "FILE DOES NOT EXIST: " + yamlFile ;
      callback(err, null);
    }
  });
}

function saveFile (path, file, jsonObj, callback){

  var fullPath = path + "/" + file;

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + fullPath));

  var options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("... SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE"
        + " | PATH: " + path 
        + " | FILE: " + file 
        + " | FULL PATH: " + fullPath 
        + " | ERROR: " + error 
        + "\nERROR\n" + jsonPrint(error)
        + "\njsonObj\n" + jsonPrint(jsonObj) 
      ));
      callback(error, null);
    });
}

function saveStats(statsFile, statsObj, callback) {
  if (OFFLINE_MODE) {

    fs.exists(statsFile, function(exists) {
      if (exists) {
        fs.stat(statsFile, function(error, stats) {
          if (error) { return(callback(error, stats)); }
          fs.open(statsFile, "w", function(error, fd) {
            if (error) { return(callback(error, fd)); }
            fs.writeFile(path, statsObj, function(error) {
              if (error) { return(callback(error, path)); }
              callback("OK");
              fs.close(fd);
            });
          });
        });
      }
    });
  } else {

  var options = {};

  options.contents = JSON.stringify(statsObj, null, 2);
  options.path = statsFile;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(){
      debug(chalkLog("... SAVED DROPBOX JSON | " + options.path));
      callback("OK");
    })
    .catch(function(error){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + options.path 
        + " ERROR: " + error.error_summary
      ));
      callback(error);
    });

  }
}

function initStatsInterval(interval){

  console.log(chalkInfo("INIT STATS INTERVAL"
    + " | " + interval + " MS"
    + " | FILE: " + statsFolder + "/" + statsFile
  ));

  clearInterval(statsInterval);

  statsInterval = setInterval(function() {

    statsObj.serverTime = moment().valueOf();
    statsObj.timeStamp = moment().format(compactDateTimeFormat);
    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;

    statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);
    statsObj.memory.maxHeap = Math.max(statsObj.memory.maxHeap, process.memoryUsage().heapUsed/(1024*1024));
    statsObj.memory.memoryAvailable = os.freemem();
    statsObj.memory.memoryTotal = os.totalmem();
    statsObj.memory.memoryUsage = process.memoryUsage();

    statsObj.entity.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.user.connected = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;

    saveFile(statsFolder, statsFile, statsObj, function(){
      showStats();
    });

  }, interval);
}

function checkKeyword(w, callback) {

  debug(chalkAlert("checkKeyword\n" + jsonPrint(w)));

  var wordObj = {};
  wordObj = w;
  wordObj.rate = 0;
  wordObj.isKeyword = false;    
  wordObj.keywords = {};
  var kwObj = {};  
  
  if ((wordObj.nodeType === "user") 
    && (wordObj.name !== undefined) 
    && (wordObj.name) 
    && keywordHashMap.has(wordObj.name.toLowerCase())) {
    debug(chalkAlert("HIT USER NAME"));
    kwObj = keywordHashMap.get(wordObj.name.toLowerCase());
    wordObj.isKeyword = true;
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if ((wordObj.nodeType === "user") 
    && (wordObj.screenName !== undefined) 
    && (wordObj.screenName) 
    && keywordHashMap.has(wordObj.screenName.toLowerCase())) {
    debug(chalkAlert("HIT USER SNAME"));
    kwObj = keywordHashMap.get(wordObj.screenName.toLowerCase());
    wordObj.isKeyword = true;
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if ((wordObj.nodeType === "place") 
    && keywordHashMap.has(wordObj.name.toLowerCase())) {
    debug(chalkAlert("HIT PLACE NAME"));
    kwObj = keywordHashMap.get(wordObj.name.toLowerCase());
    wordObj.isKeyword = true;
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if (wordObj.nodeId && keywordHashMap.has(wordObj.nodeId.toLowerCase())) {
    debug(chalkAlert("HIT NODE ID"));
    kwObj = keywordHashMap.get(wordObj.nodeId.toLowerCase());
    wordObj.isKeyword = true;
    wordObj.keywords = kwObj;    
    if ((wordObj.nodeType === "user") 
      && (wordObj.name === undefined) 
      && (wordObj.screenName === undefined)) {
      wordObj.screenName = wordObj.nodeId;
    }
    callback(wordObj);
  }
  else if (wordObj.text && keywordHashMap.has(wordObj.text.toLowerCase())) {
    debug(chalkAlert("HIT TEXT"));
    kwObj = keywordHashMap.get(wordObj.text.toLowerCase());
    wordObj.isKeyword = true;
    wordObj.keywords = kwObj;    
    if ((wordObj.nodeType === "user") 
      && (wordObj.name === undefined) 
      && (wordObj.screenName === undefined)) {
      wordObj.screenName = wordObj.nodeId;
    }
    callback(wordObj);
  }
  else {
    callback(wordObj);
  }
}

function findSessionById(sessionId, callback) {

  var query = {
    sessionId: sessionId
  };

  Session.findOne(
    query,
    function(err, session) {
      if (err) {
        console.log(chalkError("!!! SESSION FINDONE ERROR: " 
          + moment().format(compactDateTimeFormat) 
          + "\nSESSION ID: " + sessionId 
          + "\n" + err
        ));
        callback(err, null);
      } else if (session) {
        debug(chalkInfo(moment().format(compactDateTimeFormat) 
          + " | SESSION FOUND\n" + jsonPrint(session)));
        callback(null, session);
      } else {
        debug(chalkAlert(moment().format(compactDateTimeFormat) 
          + " | SESSION NOT FOUND"));
        callback(null, null);
      }
    }
  );
}

function userReadyHandler(request, callback){

  debug(chalkAlert("userReadyHandler\n" + jsonPrint(request)));

  var socketId = request.socketId;
  var sessionId = request.sessionId;
  var userObj = request.userObj;

  debug(chalkUser("USER RDY HANDLER"
    + " | " + moment().format(compactDateTimeFormat) 
    + " | " + sessionId
    + " | NID " + userObj.nodeId
    + "  ID " + userObj.userId
    + "  N " + userObj.name
    + "  E " + userObj.tags.entity
    + "  C " + userObj.tags.channel
    + "  M (tags) " + userObj.tags.mode
    + "  T " + userObj.type
    + "  M " + userObj.mode
    // + "\nU " + userObj.url
    // + "\nP " + userObj.profileImageUrl
  ));

  sessionCache.get(socketId, function(err, sObj){
    if (err){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | ??? SESSION CACHE ERROR ON USER READY"
        + " | " + err
        + "\n" + jsonPrint(userObj)
      ));
      callback(err, request);
    }
    else if (sObj === undefined) {
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON USER READY"
        + " | SOC: " + socketId
        + "\n" + jsonPrint(request)
      ));
      callback("SESSION NOT FOUND ON USER READY", request);
    }
    else {
      primarySessionObj = sObj;

      var sessionCacheKey = sessionId ;

      statsObj.socket.USER_READYS += 1;

      debug(chalk.black("userReadyHandler R< U RDY"
        + " | " + moment().format(compactDateTimeFormat) 
        + "  " + userObj.nodeId
        + "  ID " + userObj.userId
        + "  N " + userObj.name
        + "  E " + userObj.tags.entity
        + "  C " + userObj.tags.channel
        + "  M (tags) " + userObj.tags.mode
        + "  T " + userObj.type
        + "  M " + userObj.mode
        // + "\nU " + userObj.url
        // + "\nP " + userObj.profileImageUrl
      ));

      if ((userObj.tags !== undefined)
        && (userObj.tags.entity !== undefined) 
        && (userObj.tags.mode !== undefined) 
        && (userObj.tags.mode.toLowerCase() === "substream")) {

        sessionCacheKey = socketId + "#" + userObj.tags.entity;

        debug(chalkInfo("USER_READY SUBSTREAM sessionCacheKey: " + sessionCacheKey));

        sessionUpdateDbCache({sessionCacheKey: sessionCacheKey, socketId: sessionId, userObj: userObj}, function(err, sObj){
          callback(err, sObj);
        });
      }
      else {
        debug(chalkInfo("USER_READY sessionCacheKey: " + sessionCacheKey));
        sessionUpdateDbCache({sessionCacheKey: sessionCacheKey, socketId: sessionId, userObj: userObj}, function(err, sObj){
          callback(err, sObj);
        });
      }

    }
  });
}

function sessionUpdateDbCache(request, callback){
  // sessionCacheKey, socket, userObj,
  var sessionCacheKey = request.sessionCacheKey;
  var socketId = request.socketId;
  var userObj = request.userObj;

  sessionCache.get(sessionCacheKey, function(err, sObj){
    if (err){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | ??? SESSION CACHE ERROR ON USER READY | " + err
      ));
      callback(err, request);
    }
    else {
      if (sObj === undefined) {

        sObj = new Session({
          sessionId: sessionCacheKey,
          tags: {},
          config: {},
          namespace: "util",
          url: userObj.url,
          profileImageUrl: userObj.profileImageUrl,
          createAt: moment().valueOf(),
          lastSeen: moment().valueOf(),
          connected: true,
          connectTime: moment().valueOf(),
          disconnectTime: 0
        });

        debug(chalkSession("SES $ MISS USR RDY"
          + " | " + sessionCacheKey
          + " | " + moment().format(compactDateTimeFormat) 
        ));

        if (!primarySessionObj) {
          console.log(chalkError(moment().format(compactDateTimeFormat) 
            + " | ??? PRIMARY SESSION NOT FOUND ON USER READY"
            + " | " + sessionCacheKey
            + " | SKIPPING "
          ));
          if (callback !== undefined) {
            callback("PRIMARY SESSION NOT FOUND ON USER READY", sessionCacheKey);
          }
        }
        else if (userObj.tags.mode.toLowerCase() === "substream") {

          if (userObj.type !== undefined) {
            sObj.config.type = userObj.type;
            sObj.type = userObj.type;
          }
          if (userObj.mode !== undefined) {
            sObj.config.mode = userObj.mode;
            sObj.mode = userObj.mode;
          }

          sObj.namespace = "util";
          sObj.socketId = socketId;
          sObj.tags.entity = userObj.tags.entity.toLowerCase();
          sObj.tags.channel = userObj.tags.channel.toLowerCase();

          sObj.url = (userObj.url !== undefined) ? userObj.url : "http://www.threeceemedia.com";
          sObj.profileImageUrl = (userObj.profileImageUrl !== undefined) ? userObj.profileImageUrl : null ;

          sessionCache.set(sessionCacheKey, sObj);

          // callback(null, sObj);
        }
      }
      else {
        sObj.url = (userObj.url !== undefined) ? userObj.url : "http://www.threeceemedia.com";
        sObj.profileImageUrl = (userObj.profileImageUrl !== "undefined") ? userObj.profileImageUrl : null ;
        sessionCache.set(sessionCacheKey, sObj);
        // callback(null, sObj);
      }

      if (userObj.tags !== undefined) {

        if (sObj.tags === undefined) {
          console.log(chalkRed("sObj.tags UNDEFINED"));
          sObj.tags = {};
          sObj.tags.entity = userObj.tags.entity.toLowerCase();
          sObj.tags.channel = userObj.tags.channel.toLowerCase();
          sObj.tags.mode = userObj.tags.mode.toLowerCase();
        }
        else {
          if (sObj.tags.entity !== undefined) {

            sObj.tags.entity = sObj.tags.entity.toLowerCase();

            if (entityChannelGroupHashMap.has(sObj.tags.entity)){
              debug(chalkInfo("### E CH HM HIT"
                + " | " + sObj.tags.entity
                + " > " + entityChannelGroupHashMap.get(sObj.tags.entity).groupId
              ));
            }
            else {
              debug(chalkInfo("-0- E CH HM MISS"
                + " | " + sObj.tags.entity
              ));

              configEvents.emit("HASH_MISS", {type: "entity", value: sObj.tags.entity.toLowerCase()});
            }
          }
          else {
            sObj.tags.entity = userObj.tags.entity.toLowerCase();
          }
          if (sObj.tags.channel !== undefined) {
            sObj.tags.channel = sObj.tags.channel.toLowerCase();
          }
          else {
            sObj.tags.channel = userObj.tags.channel.toLowerCase();
          }
          if (sObj.tags.mode !== undefined) {
            sObj.tags.mode = sObj.tags.mode.toLowerCase();
          }
          else {
            sObj.tags.mode = userObj.tags.mode.toLowerCase();
          }
        }
      }
      if (userObj.type !== undefined) {
        sObj.config.type = userObj.type;
      }
      if (userObj.mode !== undefined) {
        sObj.config.mode = userObj.mode;
      }

      debug(chalkSession("--- USER READY"
        + " | " + userObj.userId 
        + " | SID: " + sObj.sessionId 
        + " | TYPE: " + sObj.config.type 
        + " | MODE: " + sObj.config.mode 
        + " | " + moment().format(compactDateTimeFormat) 
        // + "\nSESSION OBJ\n" + jsonPrint(sObj) 
        // + "\nUSER OBJ\n" + jsonPrint(userObj)
      ));

      sessionQueue.enqueue({
        sessionEvent: "USER_READY",
        session: sObj,
        user: userObj
      });

      callback(null, sObj);
    }
  });
}

function createSession(newSessionObj) {

  statsObj.session.totalCreated++;

      // createSession({
      //   namespace: "admin",
      //   socket: socket,
      //   type: "admin",
      //   tags: {}
      // });

  console.log(chalkSession("CREATE SESSION"
    + " | " + moment().format(compactDateTimeFormat)
    + " | NS: " + newSessionObj.namespace
    + " | SID: " + newSessionObj.socket.id
    + " | TYPE: " + newSessionObj.type
  ));

  var namespace = newSessionObj.namespace;
  var socket = newSessionObj.socket;
  var socketId = newSessionObj.socket.id;
  var ipAddress = newSessionObj.socket.handshake.headers["x-real-ip"] || newSessionObj.socket.client.conn.remoteAddress;

  statsObj.entity.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
  statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
  statsObj.entity.user.connected = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
  statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;

  var sessionObj = new Session({
    socketId: newSessionObj.socket.id,
    sessionId: newSessionObj.socket.id,
    tags: {},
    ip: ipAddress,
    namespace: namespace,
    url: newSessionObj.url,
    profileImageUrl: newSessionObj.profileImageUrl,
    createAt: moment().valueOf(),
    lastSeen: moment().valueOf(),
    connected: true,
    connectTime: moment().valueOf(),
    disconnectTime: 0
  });

  if (newSessionObj.tags) { 
    sessionObj.tags = newSessionObj.tags;
    sessionObj.userId = newSessionObj.tags.entity;
  }

  if (newSessionObj.user) { 
    sessionObj.userId = newSessionObj.user.userId;
  }

  sessionObj.config.type = newSessionObj.type;
  sessionObj.config.mode = newSessionObj.mode;

  sessionCache.set(newSessionObj.socket.id, sessionObj, function(err, results){

    if (err) {
      console.error("SESSION CACHE ERROR\n" + err);
      quit();
    }

    initSessionSocketHandler(sessionObj, socket);

    debug(chalkSession("\nNEW SESSION\n" + util.inspect(sessionObj, {
      showHidden: false,
      depth: 1
    })));

    sessionQueue.enqueue({
      sessionEvent: "SESSION_CREATE",
      session: sessionObj
    });

  });

}

function initSessionSocketHandler(sessionObj, socket) {

  var ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  socket.on("reconnect_error", function(errorObj) {
    statsObj.socket.reconnect_errors += 1;
    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("reconnect_failed", function(errorObj) {
    statsObj.socket.reconnect_fails += 1;
    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT FAILED: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_error", function(errorObj) {
    statsObj.socket.connect_errors += 1;
    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_timeout", function(errorObj) {
    statsObj.socket.connect_timeouts += 1;
    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT TIMEOUT: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function(error) {
    statsObj.socket.errors += 1;
    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | *** SOCKET ERROR" + " | " + socket.id + " | " + error));
    sessionQueue.enqueue({
      sessionEvent: "SOCKET_ERROR",
      sessionId: socket.id,
      error: error
    });
  });

  socket.on("reconnect", function() {
    statsObj.socket.reconnects += 1;
    sessionObj.connected = true;
    console.log(chalkConnect(moment().format(compactDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
    sessionQueue.enqueue({
      sessionEvent: "SOCKET_RECONNECT",
      sessionId: socket.id
    });
  });

  socket.on("disconnect", function(status) {
    statsObj.socket.disconnects += 1;

    console.log(chalkDisconnect(moment().format(compactDateTimeFormat) 
      + " | SOCKET DISCONNECT: " + socket.id + "\nstatus\n" + jsonPrint(status)
    ));

    sessionCache.get(socket.id, function(err, sObj){
      if (err){
        console.log(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION CACHE ERROR ON SOCKET DISCONNECT | " + err
        ));
      }
      else if (sObj !== undefined) {
        sObj.connected = false;
        sessionQueue.enqueue({
          sessionEvent: "SOCKET_DISCONNECT",
          sessionId: socket.id,
          session: sObj
        });
        debug(chalkDisconnect("\nDISCONNECTED SOCKET\n" + jsonPrint(sObj)));
      } 
      else {
        debug(chalkWarn("??? DISCONNECTED SOCKET NOT IN CACHE ... TIMED OUT? | " + socket.id));
      }
    });
  });

  socket.on("REQ_ADMIN_SESSION", function(options) {
    debug(chalkAdmin(moment().format(compactDateTimeFormat) 
      + " | REQ_ADMIN_SESSION: " + socket.id 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_ADMIN_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("REQ_USER_SESSION", function(options) {
    debug(chalkUser(moment().format(compactDateTimeFormat) 
      + " | REQ_USER_SESSION: " + socket.id
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | NSP: " + sessionObj.namespace 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_USER_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("REQ_VIEWER_SESSION", function(options) {
    debug(chalkViewer(moment().format(compactDateTimeFormat) 
      + " | REQ_VIEWER_SESSION: " + socket.id 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_VIEWER_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("REQ_UTIL_SESSION", function(options) {
    debug(chalkUtil(moment().format(compactDateTimeFormat) 
      + " | REQ_UTIL_SESSION: " + socket.id 
      + " | IP: " + ipAddress 
      + " | SID: " + sessionObj.sessionId 
      + " | OPTIONS: " + jsonPrint(options)));

    sessionQueue.enqueue({
      sessionEvent: "REQ_UTIL_SESSION",
      session: sessionObj,
      options: options
    });
  });

  socket.on("ADMIN_READY", function(adminObj) {

    debug(chalkAdmin("ADMIN READY\n" + jsonPrint(adminObj)));

    sessionCache.get(socket.id, function(err, sObj){
      if (err){
        console.log(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION CACHE ERROR ON ADMIN ADMIN_READY | " + err
        ));
      }
      else if (sObj === undefined) {
        debug(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION NOT FOUND ON ADMIN READY | " + socket.id));
      }
      else {
        debug(chalkConnect("--- ADMIN READY   | " + adminObj.adminId 
          + " | SID: " + sObj.sessionId + " | " + moment().format(compactDateTimeFormat)));

        sessionQueue.enqueue({
          sessionEvent: "ADMIN_READY",
          session: sObj,
          admin: adminObj
        });
      }

    });
  });

  socket.on("VIEWER_READY", function(viewerObj) {

    console.log(chalkViewer("VIEWER READY\n" + jsonPrint(viewerObj)));

    sessionCache.get(socket.id, function(err, sObj){
      if (err){
        console.log(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION CACHE ERROR ON VIEWER READY | " + err
        ));
      }
      else if (sObj === undefined) {
        debug(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION NOT FOUND ON VIEWER READY | " + socket.id));
      }
      else {
        debug(chalkConnect("--- VIEWER READY   | " + viewerObj.userId 
          + " | SID: " + sObj.sessionId 
          + " | " + moment().format(compactDateTimeFormat)));

        sessionQueue.enqueue({
          sessionEvent: "VIEWER_READY",
          session: sObj,
          viewer: viewerObj
        });
      }
    });
  });

  socket.on("SESSION_KEEPALIVE", function(userObj) {

    if (statsObj.utilities[userObj.userId] === undefined) {
      statsObj.utilities[userObj.userId] = {};
    }

    statsObj.socket.keepalives += 1;

    debug(chalkUser("SESSION_KEEPALIVE | " + userObj.userId));
    debug(chalkUser("SESSION_KEEPALIVE\n" + jsonPrint(userObj)));

    if (userObj.stats) {statsObj.utilities[userObj.userId] = userObj.stats;}

    if (userObj.userId.match(/LA_/g)){
      userObj.isServer = true;

      languageServer.connected = true;
      languageServer.user = userObj;
      languageServer.socket = socket;

      console.log(chalkSession("K-LA" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    if (userObj.userId.match(/TMS_/g)){
      userObj.isServer = true;

      tmsServer.connected = true;
      tmsServer.user = userObj;
      tmsServer.socket = socket;

      debug(chalkSession("K-TMS" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + userObj.stats.tweetsPerMinute.toFixed(0) + " TPM"
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    if (userObj.userId.match(/TSS_/g)){
      userObj.isServer = true;

      tssServer.connected = true;
      tssServer.user = userObj;
      tssServer.socket = socket;

      debug(chalkSession("K-TSS" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + userObj.stats.tweetsPerMinute.toFixed(0) + " TPM"
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    var sessionCacheKey = socket.id;

    if ((userObj.tags !== undefined)
      && (userObj.tags.mode !== undefined) 
      && (userObj.tags.mode.toLowerCase() === "substream")) {
      debug(chalkRedBold("KEEPALIVE socket.id: " + socket.id));
      sessionCacheKey = socket.id + "#" + userObj.tags.entity.toLowerCase();
    }

    sessionCache.get(sessionCacheKey, function(err, sObj){
      if (err){
        console.log(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION CACHE ERROR ON KEEPALIVE | " + err
        ));
      }
      else if (sObj === undefined) {
        debug(chalkError(moment().format(compactDateTimeFormat) 
          + " | ??? SESSION NOT FOUND ON SESSION_KEEPALIVE | " + socket.id
          // + " | CREATING SESSION" + "\n" + jsonPrint(userObj)
        ));

        sObj = {
          namespace: userObj.namespace,
          socket: socket,
          type: userObj.type,
          mode: userObj.mode,
          user: userObj,
          tags: {}
        };

        if (userObj.tags !== undefined) {

          var tagKeys = Object.keys(userObj.tags);
          var i = 0;

          for (i=0; i<tagKeys.length; i += 1){
            sObj.tags[tagKeys[i]] = userObj.tags[tagKeys[i]].toLowerCase();
            debug(chalkRed("sObj " + tagKeys[i] + " > " + sObj.tags[tagKeys[i]]));
          }

          if (i === tagKeys.length) {
            debug(chalkInfo("SESSION_KEEPALIVE"));
          }
        }
        else {
          debug(chalkInfo("SESSION_KEEPALIVE"));
         }

      }
      else {
        debug(chalkLog("@@@ SESSION_KEEPALIVE"
          + " | " + userObj.userId 
          + " | " + sObj.sessionId 
          + " | " + moment().format(compactDateTimeFormat)));

        if (userObj.userId !== undefined) {
          sObj.userId = userObj.userId;
        }

        if (userObj.tags !== undefined) {
          sObj.tags = userObj.tags;
        }

       if (userObj.mode !== undefined) {
          debug("USER MODE: " + userObj.mode);
          sObj.config.type = userObj.mode;
        }

        sessionQueue.enqueue({
          sessionEvent: "SESSION_KEEPALIVE",
          session: sObj,
          user: userObj
        });

      }

    });
  });

  socket.on("USER_READY", function(userObj) {

    debug("USER_READY\n" + jsonPrint(userObj));

    userObj.socketId = socket.id;

    if (userObj.mode) {
      if (userObj.mode === "substream") { 
        userObj.sessionId = socket.id + "#" + userObj.tags.entity;
      }
      else {
        userObj.sessionId = socket.id;
      }
    }

    userReadyHandler({socketId: socket.id, sessionId: userObj.sessionId, userObj: userObj}, function(err, sObj){
      if (err && configuration.quitOnError) {
        quit(err);
      }
    });
  });

  socket.on("node", function(rxNodeObj) {

    rxNodeObj.sessionId = socket.id;

    if (!rxNodeObj.nodeId) {

      console.log(chalkError("UNDEFINED RX NODE NODEID\n" + jsonPrint(rxNodeObj)));

      if (configuration.quitOnError) {
        quit("UNDEFINED RX NODE NODEID");
      }
      else {
        switch (rxNodeObj.nodeType){
          case "user":
            if (rxNodeObj.screenName) {
              rxNodeObj.nodeId = rxNodeObj.screenName.toLowerCase();
              console.log(chalkWarn("UNDEFINED RX NODE NODEID SET TO: " + rxNodeObj.nodeId));
            }
            else if (rxNodeObj.name) {
              rxNodeObj.nodeId = rxNodeObj.name.toLowerCase();
              console.log(chalkWarn("UNDEFINED RX NODE NODEID SET TO: " + rxNodeObj.nodeId));
            }
          break;
          default:
            rxNodeObj.nodeId = "undefined_" + moment().valueOf();
            console.log(chalkWarn("UNDEFINED RX NODE NODEID SET TO: " + rxNodeObj.nodeId));
        }
      }
    }

    // usually output from twitterSearchStream (TSS)

    debug(chalkInfo("RX NODE"
      + " | " + rxNodeObj.nodeType 
      + " | NID " + rxNodeObj.nodeId 
      + " | Ms " + rxNodeObj.mentions
      + " | KWs " + jsonPrint(rxNodeObj.keywords)
      // + "\n" + jsonPrint(rxNodeObj)
    ));

    checkKeyword(rxNodeObj, function(nodeObj){

      var scienceMarchHit = false;
      var obamaHit = false;
      var trumpHit = false;

      switch (nodeObj.nodeType) {

        case "tweet":

          // console.log(chalkAlert("TWEET | checkKeyword\n" + jsonPrint(nodeObj)));

          if (nodeObj.text.toLowerCase().includes("sciencemarch") || nodeObj.text.toLowerCase().includes("marchforscience")) {
            scienceMarchHit = nodeObj.text;
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
            if (!nodeObj.keywords.left){
              nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            }
            else {
              delete nodeObj.keywords.right;
            }
            debug(chalkError("TRUMP: " + nodeObj.text));
          }
          viewNameSpace.emit("node", nodeObj);
        break;

        case "user":

          // console.log(chalkAlert("USER | checkKeyword\n" + jsonPrint(nodeObj)));

          if (!nodeObj.name && !nodeObj.screenName) {
            console.log(chalkError("NODE NAME & SCREEN NAME UNDEFINED?\n" + jsonPrint(nodeObj)));
          }
          else if (nodeObj.screenName){
            nodeObj.isTwitterUser = true;
            wordsPerMinuteTopTermCache.get(nodeObj.screenName.toLowerCase(), function(err, screenName) {
              if (screenName) {
                nodeObj.isTopTerm = true;
              }
              if (nodeObj.screenName.toLowerCase().includes("obama")) {
                obamaHit = nodeObj.screenName;
                nodeObj.isKeyword = true;
                if (!nodeObj.keywords.right){
                  nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
                }
                else {
                  delete nodeObj.keywords.left;
                }
              }
              if (nodeObj.screenName.toLowerCase().includes("trump")) {
                trumpHit = nodeObj.screenName;
                nodeObj.isKeyword = true;
                if (!nodeObj.keywords.left){
                  nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
                }
                else {
                  delete nodeObj.keywords.right;
                }
              }
              updateWordMeter(nodeObj, function(err, uNodeObj){
                viewNameSpace.emit("node", uNodeObj);
                if (languageServer.connected) {
                  languageServer.socket.emit("LANG_ANALIZE_WORD", uNodeObj);
                }
              });
            });
          }
          else if (nodeObj.name) {
            nodeObj.isTwitterUser = true;
            wordsPerMinuteTopTermCache.get(nodeObj.name.toLowerCase(), function(err, name) {
              if (name) {
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
              updateWordMeter(nodeObj, function(err, uNodeObj){
                viewNameSpace.emit("node", uNodeObj);
                if (languageServer.connected) {
                  languageServer.socket.emit("LANG_ANALIZE_WORD", uNodeObj);
                }
              });
            });
          }
        break;

        case "hashtag":

          // console.log(chalkAlert("HASHTAG | checkKeyword\n" + jsonPrint(nodeObj)));

          wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function(err, nodeId) {
            if (nodeId) {
              nodeObj.isTopTerm = true;
            }
            if (nodeObj.nodeId.toLowerCase().includes("sciencemarch") || nodeObj.nodeId.toLowerCase().includes("marchforscience")) {
              scienceMarchHit = nodeObj.nodeId;
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
              if (!nodeObj.keywords.left){
                nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
              }
              else {
                delete nodeObj.keywords.right;
              }
            }
            updateWordMeter(nodeObj, function(err, uNodeObj){
              viewNameSpace.emit("node", uNodeObj);
              if (languageServer.connected) {
                languageServer.socket.emit("LANG_ANALIZE_WORD", uNodeObj);
              }
            });
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
            if (nodeId) {
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
            updateWordMeter(nodeObj, function(err, uNodeObj){
              viewNameSpace.emit("node", uNodeObj);
              if (languageServer.connected) {
                languageServer.socket.emit("LANG_ANALIZE_WORD", uNodeObj);
              }
            });
          });
        break;

        case "word":

          // console.log(chalkAlert("WORD | checkKeyword\n" + jsonPrint(nodeObj)));

          wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function(err, nodeId) {
            if (nodeId) {
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
            updateWordMeter(nodeObj, function(err, uNodeObj){
              viewNameSpace.emit("node", uNodeObj);
              if (languageServer.connected) {
                languageServer.socket.emit("LANG_ANALIZE_WORD", uNodeObj);
              }
            });
          });
        break;

        case "media":
        case "url":
          viewNameSpace.emit("node", nodeObj);
        break;

        default:
          console.log(chalkAlert("DEFAULT | checkKeyword\n" + jsonPrint(nodeObj)));
          viewNameSpace.emit("node", nodeObj);
      }

      if (obamaHit) {

        wordStats.meter("obamaPerSecond").mark();
        wordStats.meter("obamaPerMinute").mark();

        var wsObj = wordStats.toJSON();

        debug(chalkAlert("OBAMA"
          + " | " + nodeObj.nodeType
          + " | " + nodeObj.nodeId
          + " | " + wsObj.obamaPerSecond["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.obamaPerSecond.currentRate.toFixed(0) 
          + " | " + wsObj.obamaPerMinute["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.obamaPerMinute.currentRate.toFixed(0) 
          + " | " + obamaHit
        ));
      }

      if (trumpHit) {

        wordStats.meter("trumpPerSecond").mark();
        wordStats.meter("trumpPerMinute").mark();

        var wsObj = wordStats.toJSON();

        debug(chalkAlert("TRUMP"
          + " | " + nodeObj.nodeType
          + " | " + nodeObj.nodeId
          + " | " + wsObj.trumpPerSecond["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.trumpPerSecond.currentRate.toFixed(0) 
          + " | " + wsObj.trumpPerMinute["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.trumpPerMinute.currentRate.toFixed(0) 
          + " | " + trumpHit
        ));
      }

    });
  });

  socket.on("word", function(rxWobj) {

    var rxWordObj = {};
    rxWordObj = rxWobj;

    if (!rxWordObj.nodeId) {
      console.log(chalkAlert("*** RX NULL RESPONSE_WORD_OBJ NODEID ... SKIPPING"
        + "\n" + jsonPrint(rxWordObj)
      ));
      return;
    }

    rxWordObj.nodeId = rxWordObj.nodeId.toLowerCase();
    rxWordObj.nodeType = "word";
    rxWordObj.tags = rxWordObj.tags || {};

    wordStats.meter("wordsPerSecond").mark();
    wordStats.meter("wordsPerMinute").mark();

    wordsPerMinuteTopTermCache.get(rxWordObj.nodeId.toLowerCase(), function(err, nodeRate) {
      if (nodeRate) {
        rxWordObj.isTopTerm = true;
        debug(chalkRed("TOP TERM"
          + " | " + rxWordObj.nodeId
          + " | " + rxWordObj.isTopTerm
          + " | " + nodeRate.toFixed(2)
        ));
      }
      else {
        rxWordObj.isTopTerm = false;
      }

      if (rxWordObj.nodeId.includes("obama")) {
   
        wordStats.meter("obamaPerSecond").mark();
        wordStats.meter("obamaPerMinute").mark();

        const wsObj = wordStats.toJSON();

        debug(chalkAlert("OBAMA"
          + " | " + wsObj.obamaPerSecond["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.obamaPerSecond.currentRate.toFixed(0) 
          + " | " + wsObj.obamaPerMinute["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.obamaPerMinute.currentRate.toFixed(0) 
          + " | " + rxWordObj.nodeId
        ));
      }

      if (rxWordObj.nodeId.includes("trump")) {
   
        wordStats.meter("trumpPerSecond").mark();
        wordStats.meter("trumpPerMinute").mark();

        const wsObj = wordStats.toJSON();

        debug(chalkAlert("TRUMP"
          + " | " + wsObj.trumpPerSecond["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.trumpPerSecond.currentRate.toFixed(0) 
          + " | " + wsObj.trumpPerMinute["1MinuteRate"].toFixed(0) 
          + " | " + wsObj.trumpPerMinute.currentRate.toFixed(0) 
          + " | " + rxWordObj.nodeId
        ));
      }

      if (rxWordQueue.size() < MAX_RESPONSE_QUEUE_SIZE) {

        if (rxWordObj.tags.mode.toLowerCase() === "substream") {
          rxWordObj.socketId = socket.id + "#" + rxWordObj.tags.entity.toLowerCase();
          rxWordObj.sessionId = socket.id + "#" + rxWordObj.tags.entity.toLowerCase();
          debug("SUBS" 
            + "\n" + jsonPrint(rxWordObj.tags)
          );
        }
        else {
          rxWordObj.socketId = socket.id;
          rxWordObj.sessionId = socket.id;
        }

        rxWordQueue.enqueue(rxWordObj);

        debug(chalkRed("RX W Q"
          + " | Q: " + rxWordQueue.size()
          + " | " + rxWordObj.nodeId
        ));
      }
    });
  });

  socket.on("GET_SESSION", function(sessionId) {

    debug(chalkTest("RX GET_SESSION | " + sessionId 
      + " | CHAIN LIMIT: " + SESSION_WORDCHAIN_REQUEST_LIMIT));
    findSessionById(sessionId, function(err, sessionObj) {
      if (err) {
        console.log(chalkError("findSessionById ERROR\n" + jsonPrint(err)));
      } 
      else if (sessionObj) {

        var wordChainSegment = sessionObj.wordChain.slice(-SESSION_WORDCHAIN_REQUEST_LIMIT);

        async.forEachOf(

          wordChainSegment, // iterate over wordChain array

          function(word, wordChainIndex, callback) {

            Word.find({
              nodeId: word
            }, function(err, wordArray) {
              if (err) {
                console.log("ERROR\n" + err);
                callback(err);
              } 
              else if (!wordArray) {
                callback(null);
              }
              debug("FOUND CHAIN WORD[" + wordChainIndex + "]: " + wordArray[0].nodeId);
              var sessionUpdateObj = {
                sessionId: sessionObj.sessionId,
                wordChainIndex: wordChainIndex,
                wordChainLength: sessionObj.wordChain.length,
                wordChainSegmentLength: wordChainSegment.length,
                word: wordArray[0]
              };
              socket.emit("SESSION", sessionUpdateObj);
              callback(null);
            });

          },

          function(err) {
            if (!err) {debug("TX SESSION COMPLETE: " + sessionId);}
          }
        );
      }
    });
  });

  socket.on("SOCKET_TEST_MODE", function(testMode) {

    debug(chalkTest("RX SOCKET_TEST_MODE: " + testMode));
    serverSessionConfig.testMode = testMode;
    serverSessionConfig.socketId = socket.id;
    // testUsersNameSpace.emit("SOCKET_TEST_MODE", serverSessionConfig);
  });
}

function setWordCacheTtl(value) {
  debug(chalkWarn("SET WORD CACHE TTL: PREV: " + wordCacheTtl + " | NOW: " + value));
  wordCacheTtl = parseInt(value);
}


function initSocketNamespaces(callback){

  console.log(chalkInfo("INIT SOCKET NAMESPACES"));

  io = require("socket.io")(httpServer, { reconnection: false });

  adminNameSpace = io.of("/admin");
  utilNameSpace = io.of("/util");
  userNameSpace = io.of("/user");
  viewNameSpace = io.of("/view");

  adminNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    debug(chalkAdmin("ADMIN CONNECT"));
    createSession({
      namespace: "admin",
      socket: socket,
      type: "admin",
      tags: {}
    });
    socket.on("SET_WORD_CACHE_TTL", function(value) {
      setWordCacheTtl(value);
    });
  });

  utilNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    debug(chalkAdmin("UTIL CONNECT"));
    createSession({
      namespace: "util",
      socket: socket,
      type: "util",
      mode: "unknown",
      tags: {}
    });
  });

  userNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    debug(chalkAdmin("USER CONNECT"));
    createSession({
      namespace: "user",
      socket: socket,
      type: "util",
      mode: "unknown",
      tags: {}
    });
  });

  viewNameSpace.on("connect", function(socket) {
    socket.setMaxListeners(0);
    console.log(chalkAdmin("VIEWER CONNECT"));
    createSession({
      namespace: "view",
      socket: socket,
      type: "viewer",
      mode: "unknown",
      tags: {}
    });
  });

  ioReady = true;
  callback();
}

function dnsReverseLookup(ip, callback) {

  var domains = [];

  if (localHostHashMap.has(ip)) {
    debug("dnsReverseLookup: DEVELOPMENT HOST: " + hostname + " | " + ip);
    domains.push(localHostHashMap.get(ip));
    callback(null, domains);
  } 
  else if (dnsHostHashMap.has(ip)) {
    domains = dnsHostHashMap.get(ip);
    debug("dnsReverseLookup: HOST IN HASHMAP : " + hostname + " | " + ip + " | " + domains);
    callback(null, domains);
  } 
  else {
    dns.reverse(ip, function(err, domains) {
      if (err) {
        console.log("\n\n***** ERROR: DNS REVERSE IP: " + ip + "\n" + err + "\n");
        callback(err, null);
      } else {
        debug("DNS REVERSE IP: " + ip);
        dnsHostHashMap.set(ip, domains);
        domains.forEach(function(domain) {
          debug("DOMAIN: " + domain);
        });
        callback(null, domains);
      }
    });
  }
}

// var statsCountsComplete = true;

// function updateStatsCounts(callback) {

//   if (statsCountsComplete) {

//     statsCountsComplete = false;

//     async.parallel({
//       totalAdmins: function (cb) {
//         Admin.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB ADMIN COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalAdmins = count;
//             cb(null, count);
//           }
//         });
//       },
//       totalUsers: function (cb) {
//         User.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalUsers = count;
//             cb(null, count);
//           }
//         });
//       },
//       totalViewers: function (cb) {
//         Viewer.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB VIEWER COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalViewers = count;
//             cb(null, count);
//           }
//         });
//       },
//       totalSessions: function (cb) {
//         Session.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalSessions = count;
//             cb(null, count);
//           }
//         });
//       },
//       totalWords: function (cb) {
//         Word.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalWords = count;
//             cb(null, count);
//           }
//         });
//       },
//       totalGroups: function (cb) {
//         Group.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalGroups = count;
//             cb(null, count);
//           }
//         });
//       },
//       totalEntities: function (cb) {
//         Entity.count({}, function(err, count) {
//           if (err) {
//             console.log(chalkError("DB USER COUNTER ERROR\n" + jsonPrint(err)));
//             cb(err, null);
//           }
//           else {
//             statsObj.db.totalEntities = count;
//             cb(null, count);
//           }
//         });
//       }
//     },
//     function(err, results) { //async.parallel callback
//       if (err) {
//         console.log(chalkError("\n" + moment().format(compactDateTimeFormat) 
//           + "!!! UPDATE STATS COUNTS ERROR: " + err));
//         statsCountsComplete = true;
//         if (callback !== undefined) { callback(err, null); }
//       } 
//       else {
//         console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | UPDATE STATS COUNTS COMPLETE"
//          + "\n" + jsonPrint(results)
//         ));
//         configEvents.emit("UPDATE_STATS_COUNTS_COMPLETE", moment().format(compactDateTimeFormat));
//         statsCountsComplete = true;
//         if (callback !== undefined) { callback(null, "UPDATE_STATS_COUNTS_COMPLETE"); }
//       }
//     });

//   }
// }


var updateSessionViewReady = true;

function createSmallSessionUpdateObj (updateObj, callback){

  var sessionSmallObj = {};

  if (updateObj.action === "KEEPALIVE") {

    sessionSmallObj.tags = {};
    sessionSmallObj.action = updateObj.action;
    sessionSmallObj.userId = updateObj.userId;
    sessionSmallObj.profileImageUrl = updateObj.profileImageUrl;
    sessionSmallObj.url = updateObj.url;
    sessionSmallObj.sessionId = updateObj.sessionId;
    sessionSmallObj.wordChainIndex = updateObj.wordChainIndex;
    sessionSmallObj.mentions = updateObj.wordChainIndex;
    sessionSmallObj.source = {};
    sessionSmallObj.target = null;

    if (updateObj.tags !== undefined) {
      sessionSmallObj.tags = updateObj.tags;
    }

    sessionSmallObj.source = {
      nodeId: updateObj.userId,
      nodeType: "keepalive",
      rate: 0,
      wordChainIndex: updateObj.wordChainIndex,
      links: {},
      mentions: updateObj.wordChainIndex
    };

    return(callback(sessionSmallObj));
  } 
  else {
    sessionSmallObj.tags = {};
    sessionSmallObj.action = updateObj.action;
    sessionSmallObj.userId = updateObj.userId;
    sessionSmallObj.profileImageUrl = updateObj.profileImageUrl;
    sessionSmallObj.url = updateObj.url;
    sessionSmallObj.profileImageUrl = updateObj.profileImageUrl;
    sessionSmallObj.sessionId = updateObj.sessionId;
    sessionSmallObj.wordChainIndex = updateObj.wordChainIndex;
    sessionSmallObj.mentions = updateObj.wordChainIndex;
    sessionSmallObj.source = {};
    sessionSmallObj.target = {};

    if (updateObj.tags !== undefined) {
      sessionSmallObj.tags = updateObj.tags;
      sessionSmallObj.source.tags = {};
      sessionSmallObj.source.tags = updateObj.tags;
    }

    sessionSmallObj.source.nodeId = updateObj.source.nodeId;
    sessionSmallObj.source.nodeType = updateObj.source.nodeType;
    sessionSmallObj.source.raw = updateObj.source.raw;
    sessionSmallObj.source.rate = updateObj.source.rate || 0;
    sessionSmallObj.source.isIgnored = updateObj.source.isIgnored;
    sessionSmallObj.source.isTrendingTopic = updateObj.source.isTrendingTopic;
    sessionSmallObj.source.isTopTerm = updateObj.source.isTopTerm;
    sessionSmallObj.source.isKeyword = updateObj.source.isKeyword;
    sessionSmallObj.source.keywords = {};
    sessionSmallObj.source.url = updateObj.source.url;
    sessionSmallObj.source.wordChainIndex = updateObj.source.wordChainIndex;
    sessionSmallObj.source.links = {};
    sessionSmallObj.source.mentions = updateObj.source.mentions;

    if (keywordHashMap.has(updateObj.source.nodeId)) {
      sessionSmallObj.source.keywords = keywordHashMap.get(updateObj.source.nodeId);
    }

    if (updateObj.source.antonym) {
      sessionSmallObj.source.antonym = updateObj.source.antonym;
    }

    if (updateObj.target !== undefined) {

      sessionSmallObj.target.nodeId = updateObj.target.nodeId;
      sessionSmallObj.target.nodeType = updateObj.target.nodeType;
      sessionSmallObj.target.raw = updateObj.target.raw;
      sessionSmallObj.target.rate = updateObj.target.rate || 0;
      sessionSmallObj.target.isIgnored = updateObj.target.isIgnored;
      sessionSmallObj.target.isTrendingTopic = updateObj.target.isTrendingTopic;
      sessionSmallObj.target.isKeyword = updateObj.target.isKeyword;
      sessionSmallObj.target.isTopTerm = updateObj.target.isTopTerm;
      sessionSmallObj.target.keywords = {};
      sessionSmallObj.target.url = updateObj.target.url;
      sessionSmallObj.target.wordChainIndex = updateObj.target.wordChainIndex;
      sessionSmallObj.target.links = {};
      sessionSmallObj.target.mentions = updateObj.target.mentions;

      if (updateObj.tags !== undefined) {
        sessionSmallObj.target.tags = {};
        sessionSmallObj.target.tags = updateObj.tags;
      }

      if (updateObj.target.keywords) {
        sessionSmallObj.target.keywords = updateObj.target.keywords;
        return(callback(sessionSmallObj));
      }
      else{
        return(callback(sessionSmallObj));
      }
    }
    else {
      sessionSmallObj.target = null;
      return(callback(sessionSmallObj));
    }

  }
}

function initSessionViewQueueInterval(interval){

  clearInterval(sessionViewQueueInterval);

  sessionViewQueueInterval = setInterval(function() {

    if (updateSessionViewReady && (updateSessionViewQueue.length > 0)) {

      updateSessionViewReady = false;

      var sessionUpdateObj = updateSessionViewQueue.shift();

      createSmallSessionUpdateObj(sessionUpdateObj, function(sessionSmallObj){

        var key = sessionSmallObj.tags.entity.toLowerCase() + "_" + sessionSmallObj.tags.channel.toLowerCase();

        if (monitorHashMap[key] && sessionSmallObj.action === "WORD"){
          debug(chalkInfo("R< M"
            + " | " + monitorHashMap[key].session.sessionId
            + " | " + sessionSmallObj.source.nodeId
            + " | " + sessionSmallObj.source.raw
            // + " | " + jsonPrint(monitorHashMap[key])
          ));
          utilNameSpace.to(monitorHashMap[key].session.sessionId).emit("SESSION_UPDATE",sessionSmallObj);
        }

        if (sessionSmallObj.target){ 
          if (sessionSmallObj.target.mentions === undefined){
            // KLUDGE ??????
            console.log(chalkError("sessionSmallObj.target.mentions UNDEFINED | SETTING = 1" 
              + " | " + sessionSmallObj.target.nodeId
            ));
            sessionSmallObj.target.mentions = 1;
          }
        }

        updateWordMeter(sessionSmallObj.source, function(err, sNodeObj){

          debug(chalkRed("sessionSmallObj sNodeObj\n" + jsonPrint(sNodeObj)));
          sessionSmallObj.source = sNodeObj;

          if (sessionSmallObj.target) {

            updateWordMeter(sessionSmallObj.target, function(err, tNodeObj){

              sessionSmallObj.target = tNodeObj;
              viewNameSpace.emit("SESSION_UPDATE", sessionSmallObj);

              if (languageServer.connected) {
                languageServer.socket.emit("LANG_ANALIZE_WORD", sessionSmallObj.target);
              }

              // testViewersNameSpace.emit("SESSION_UPDATE", sessionSmallObj);

              statsObj.session.updatesSent += 1;

              updateSessionViewReady = true;

            });

          }
          else {

            viewNameSpace.emit("SESSION_UPDATE", sessionSmallObj);

            if (languageServer.connected) {
              languageServer.socket.emit("LANG_ANALIZE_WORD", sessionSmallObj.source);
            }

            // testViewersNameSpace.emit("SESSION_UPDATE", sessionSmallObj);

            statsObj.session.updatesSent += 1;
            updateSessionViewReady = true;

          }
        });
      });

    }
  }, interval);
}


function updateSessionViews(sessionUpdateObj) {

  var obj = {};
  obj = sessionUpdateObj;

  if (obj.source !== undefined) {
    // obj.source.mwEntry = null;
    obj.source.noun = null;
    obj.source.verb = null;
    obj.source.adverb = null;
    obj.source.adjective = null;
  }
  if (obj.target !== undefined) {
    // obj.target.mwEntry = null;
    obj.target.noun = null;
    obj.target.verb = null;
    obj.target.adverb = null;
    obj.target.adjective = null;
  }

  if (obj.tags.entity !== undefined) {
    if (entityChannelGroupHashMap.has(obj.tags.entity.toLowerCase())){
      obj.tags.group = entityChannelGroupHashMap.get(obj.tags.entity.toLowerCase());
      updateSessionViewQueue.push(obj);
    }
  }
  else {
    console.log(chalkError("ERROR updateSessionViews | ENTITY TAG UNDEFINED\n" + jsonPrint(obj)));
  }
}

var wordTypes = ["noun", "verb", "adjective", "adverb"];

function dbUpdateGroup(groupObj, incMentions, callback) {

  if ((groupObj.groupId === null) || (groupObj.groupId === undefined)) {
    console.log(chalkError("\n***** dbUpdateGroup: NULL OR UNDEFINED groupId\n" + jsonPrint(groupObj)));
    callback("NULL OR UNDEFINED groupId", groupObj);
    return;
  }

  groupServer.findOneGroup(groupObj, incMentions, function(err, group) {
    if (err) {
      console.log(chalkError("dbUpdateGroup -- > findOneGroup ERROR" 
        + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(groupObj, null, 2)));
      callback(err, groupObj);
    } 
    else {
      debug(chalkInfo("->- DB GR" 
        + " | " + group.groupId 
        + " | NAME: " + group.name 
        + " | CREATED: " + moment(parseInt(group.createdAt)).format(compactDateTimeFormat)
        + " | LAST: " + moment(parseInt(group.lastSeen)).format(compactDateTimeFormat)
        + " | MNS: " + group.mentions 
        + "\nCHANNELS: " + group.channels
        + "\nENTITIES: " + group.entities
        // + "\nTAGS: " + jsonPrint(group.tags)
      ));

      callback(null, group);
    }
  });
}

function dbUpdateEntity(entityObj, incMentions, callback) {

  if ((entityObj.entityId === null) || (entityObj.entityId === undefined)) {
    console.log(chalkError("\n***** dbUpdateEntity: NULL OR UNDEFINED entityId\n" + jsonPrint(entityObj)));
    callback("NULL OR UNDEFINED entityId", entityObj);
    return;
  }

  entityServer.findOneEntity(entityObj, incMentions, function(err, entity) {
    if (err) {
      console.log(chalkError("dbUpdateEntity -- > findOneEntity ERROR" 
        + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(entityObj, null, 2)));
      callback(err, entityObj);
    } 
    else {
      debug(chalkAlert("->- DB EN" 
        + " | " + entity.entityId 
        + " | " + entity.name 
        // + " | SN: " + entity.screenName 
        + " | G: " + entity.groupId
        + " | C: " + entity.tags.channel
        + " | S: " + entity.sessions 
        + " | Ws: " + entity.words 
        + " | CR: " + moment(parseInt(entity.createdAt)).format(compactDateTimeFormat)
        + " | L: " + moment(parseInt(entity.lastSeen)).format(compactDateTimeFormat)
        + " | Ms: " + entity.mentions 
      ));

      callback(null, entity);
    }
  });
}

function dbUpdateWord(wObj, incMentions, callback) {

  debug(chalkAlert("dbUpdateWord wObj\n" + jsonPrint(wObj)));

  if ((wObj.nodeId === null) || (wObj.nodeId === undefined)) {
    console.log(chalkError("\n***** dbUpdateWord: NULL OR UNDEFINED nodeId\n" + jsonPrint(wObj)));
    return(callback("NULL OR UNDEFINED nodeId", wObj));
  }

  checkKeyword(wObj, function(wordObj){

    dbUpdater.send({
      op: "UPDATE",
      updateType: "word",
      mode: "return",
      incMentions: incMentions,
      word: wordObj
    });

    callback(null, wordObj);
  });
}

function sessionUpdateDb(sessionObj, callback) {

  debug(chalkSession("sessionUpdateDb"
    + " | UID: " + sessionObj.userId
    + " | WCI: " + sessionObj.wordChainIndex
    + " | WCL: " + sessionObj.wordChain.length
  ));

  var query = {
    sessionId: sessionObj.sessionId
  };

  var update = {
    "$set": {
      "socketId": sessionObj.socketId,
      "config": sessionObj.config,
      "userId": sessionObj.userId,
      "tags": sessionObj.tags,
      "user": sessionObj.user,
      "url": sessionObj.url,
      "profileImageUrl": sessionObj.profileImageUrl,
      "namespace": sessionObj.namespace,
      "ip": sessionObj.ip,
      "domain": sessionObj.domain,
      "lastSeen": sessionObj.lastSeen,
      "connected": sessionObj.connected,
      "wordChainIndex": sessionObj.wordChainIndex,
      "wordChain": sessionObj.wordChain
    },
    "$max": {
      "connectTime": sessionObj.connectTime || 0,
      "disconnectTime": sessionObj.disconnectTime || 0
    }
  };

  var options = {
    upsert: true,
    new: true
  };

  Session.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ses) {
      if (err) {
        console.log("!!! SESSION FINDONE ERROR: " + moment().format(compactDateTimeFormat) 
          + " | " + sessionObj.sessionId + "\n" + err);
        if (callback !== undefined) { callback(err, sessionObj); }
      } 
      else {
        debug(chalkSession("SESSION UPDATED" 
          + " | SOC: " + ses.socketId 
          + " | SES: " + ses.sessionId 
          + " | NSP: " + ses.namespace 
          + " | UID: " + ses.userId 
          + " | IP: " + ses.ip 
          + " | DOM: " + ses.domain 
          + " | CON: " + ses.connected 
          + " | WCI: " + ses.wordChainIndex 
          // + " | WCL: " + ses.wordChain.length 
          + "\nTAGS\n" + jsonPrint(ses.tags)
          + "\nCONFIG\n" + jsonPrint(ses.config)
        ));
        if (callback !== undefined) { callback(null, ses); }
      }
    }
  );
}

function groupFindAllDb(options, callback) {

  debug("\n=============================\nGROUPS IN DB\n----------");
  if (options) {debug("OPTIONS\n" + jsonPrint(options));}

  var query = {};

  Group.find(query, options, function(err, groups) {
    if (err) {
      callback(err, null);
      return;
    }
    if (groups) {

      async.forEach(

        groups,

        function(group, cb) {

          debug(chalkDb("GID: " + group.groupId 
            + " | N: " + group.name 
            + " | LS: " + moment(parseInt(group.lastSeen)).format(compactDateTimeFormat)
            + "\n" + jsonPrint(group)
          ));

          groupHashMap.set(group.groupId, group);
          cb(null);

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  groupFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            console.log("FOUND " + groups.length + " GROUPS");
            callback(null, groups.length);
            return;
          }
        }
      );

    } else {
      console.log("NO GROUPS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function groupUpdateDb(userObj, callback){

  debug(chalkRed("groupUpdateDb\n" + jsonPrint(userObj)));

  var groupUpdateObj = new Group();

  if (entityChannelGroupHashMap.has(userObj.tags.entity.toLowerCase())) {

    var entityObj = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase());

    if ((entityObj !== undefined) && groupHashMap.has(entityObj.groupId)) {

      var groupObj = groupHashMap.get(entityObj.groupId);

      groupObj.groupId = entityObj.groupId;
      groupObj.lastSeen = moment().valueOf();

      groupUpdateObj.groupId = entityObj.groupId;
      groupUpdateObj.name = groupObj.name;
      groupUpdateObj.colors = groupObj.colors;
      groupUpdateObj.tags = userObj.tags;

      groupUpdateObj.addEntityArray = [];
      groupUpdateObj.addEntityArray.push(userObj.tags.entity.toLowerCase());
      groupUpdateObj.addChannelArray = [];
      groupUpdateObj.addChannelArray.push(userObj.tags.channel.toLowerCase());

      debug(chalkDb("GROUP HASH HIT"
        + " | " + userObj.tags.entity.toLowerCase()
        + " | " + groupUpdateObj.groupId
        + " | " + groupUpdateObj.name
        + " | +ENT: " + groupUpdateObj.addEntityArray
        + " | +CH: " + groupUpdateObj.addChannelArray
      ));

      dbUpdateGroupQueue.enqueue(groupUpdateObj);

      callback(null, entityObj);
    }
    else if (
      (entityObj !== undefined) 
      && (entityObj.groupId) 
      && !entityObj.groupId.match(hostname)) {

      debug(chalkError("*** GROUP HASH MISS ... SKIPPING DB GROUP UPDATE"
        + " | GROUP HASH MISS"
        + " | " + entityObj.groupId
        + " | " + userObj.tags.entity.toLowerCase()
      ));

      // statsObj.group.hashMiss[entityObj.groupId] = 1;
      // statsObj.group.allHashMisses[entityObj.groupId] = 1;

      configEvents.emit("HASH_MISS", {type: "group", value: entityObj.groupId});

      callback(null, entityObj);
    }
    else if (entityObj.groupId && entityObj.groupId.match(hostname)) {
      debug(chalkError("GROUP HIT ON HOSTNAME"
        + " | GID: " + entityObj.groupId
        + " | HOSTNAME: " + hostname
      ));
      callback(null, entityObj);
    }
    else {
      debug(chalkRed("*0* ENTITY HASH MISS ... SKIPPING DB GROUP UPDATE"
        + " | ENTITY HASH MISS"
        + " | " + userObj.tags.entity.toLowerCase()
        + "\nuserObj\n" + jsonPrint(userObj)
        + "\nentityObj\n" + jsonPrint(entityObj)
      ));
      configEvents.emit("HASH_MISS", {type: "entity", value: userObj.tags.entity.toLowerCase()});
      callback(null, userObj);
    }
  }
  else {
    userObj.groupId = userObj.tags.entity.toLowerCase();
    configEvents.emit("HASH_MISS", {type: "entity", value: userObj.tags.entity.toLowerCase()});
    debug(chalkError("*1* ENTITY HASH MISS ... SKIPPING DB GROUP UPDATE"
      + " | " + userObj.tags.entity.toLowerCase()
    ));
    callback(null, userObj);
  }  
}

function entityFindAllDb(options, callback) {

  debug("\n=============================\nENTITIES IN DB\n----------");
  if (options) {debug("OPTIONS\n" + jsonPrint(options));}

  var query = {};

  Entity.find(query, options, function(err, entities) {
    if (err) {
      callback(err, null);
      return;
    }
    if (entities) {

      async.forEach(

        entities,

        function(entity, cb) {
          entityChannelGroupHashMap.set(entity.entityId.toLowerCase(), entity);
          cb(null);
        },

        function(err) {
          if (err) {
            console.log("*** ERROR  entityFindAllDb\n" + err);
            callback(err, null);
            return;
          } else {
            console.log("FOUND " + entities.length + " ENTITIES");
            callback(null, entities.length);
            return;
          }
        }
      );
    } else {
      console.log("NO ENTITIES FOUND");
      callback(null, 0);
      return;
    }
  });
}

function entityUpdateDb(userObj, callback){

  debug(chalkRed("entityUpdateDb\n" + jsonPrint(userObj)));

  entityCache.get(userObj.tags.entity.toLowerCase(), function(err, entityObj){
    if (err){
      console.log(chalkError("ENTITY CACHE DB ERROR: " + err));
    }

    if (entityObj === undefined) {

      entityObj = new Entity();
      entityObj.entityId = userObj.tags.entity.toLowerCase();
      entityObj.groupId = (userObj.userId !== undefined) ? userObj.userId : userObj.tags.entity.toLowerCase();
      entityObj.name = userObj.userId;
      entityObj.screenName = userObj.screenName;
      entityObj.words = 0;
      entityObj.sessions = 0;
      entityObj.tags = userObj.tags;
      entityObj.lastSeen = moment().valueOf();

      if (entityChannelGroupHashMap.has(userObj.tags.entity.toLowerCase())){
        entityObj.name = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).name;
        entityObj.groupId = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).groupId;
      }

      debug(chalkDb("ENTITY CACHE MISS ON USER READY"
        + " | EID: " + entityObj.entityId
        + " | GID: " + entityObj.groupId
        + " | N: " + entityObj.name
        + " | SN: " + entityObj.screenName
      ));

      dbUpdateEntityQueue.enqueue(entityObj);
      callback(null, entityObj);
    }
    else {
      entityObj.entityId = userObj.tags.entity.toLowerCase();
      entityObj.name = userObj.userId;
      entityObj.screenName = userObj.screenName;
      entityObj.lastSeen = moment().valueOf();
      entityObj.sessions = (entityObj.sessions === undefined) ? 0 : entityObj.sessions;
      entityObj.words = (entityObj.words === undefined) ? 0 : entityObj.words;

      if (entityChannelGroupHashMap.has(userObj.tags.entity.toLowerCase())){
        entityObj.name = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).name;
        entityObj.groupId = entityChannelGroupHashMap.get(userObj.tags.entity.toLowerCase()).groupId;
      }

      debug(chalkDb("ENTITY CACHE HIT ON USER READY"
        + " | EID: " + entityObj.entityId
        + " | GID: " + entityObj.groupId
        + " | N: " + entityObj.name
        + " | SN: " + entityObj.screenName
      ));

      dbUpdateEntityQueue.enqueue(entityObj);
      callback(null, entityObj);
    }

  });
}

function adminUpdateDb(adminObj, callback) {

  if (adminObj.ip && (adminObj.domain === undefined)) {
    dnsReverseLookup(adminObj.ip, function(err, domains) {
      if (err) {
        adminObj.domain = "DOMAIN NOT FOUND";
        console.log("adminUpdateDb: DOMAIN NOT FOUND"
          + " | " + adminObj.ip 
          + " | " + adminObj.userId
        );
      } else if (domains[0]) {
        adminObj.domain = domains[0];
        debug("adminUpdateDb: UPDATED DOMAIN"
          + " | " + adminObj.userId 
          + " | " + adminObj.domain
        );
      }
    });
  }

  var query = {
    adminId: adminObj.adminId
  };
  var update = {
    "$set": {
      "screenName": adminObj.screenName,
      "domain": adminObj.domain,
      "namespace": adminObj.namespace,
      "ip": adminObj.ip,
      "sessionId": adminObj.lastSession,
      "description": adminObj.description,
      "url": adminObj.url,
      "profileUrl": adminObj.profileUrl,
      "profileImageUrl": adminObj.profileImageUrl,
      "verified": adminObj.verified,
      "lastSeen": adminObj.lastSeen,
      "lastSession": adminObj.lastSession,
      "connected": adminObj.connected
    },
    "$max": {
      "connectTime": adminObj.connectTime,
      "disconnectTime": adminObj.disconnectTime
    },
    "$push": {
      "sessions": adminObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  Admin.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ad) {
      if (err) {
        console.log("!!! ADMIN FINDONE ERROR: " 
          + moment().format(compactDateTimeFormat) 
          + " | " + adminObj.adminId 
          + "\nQUERY: " + jsonPrint(query) 
          + "\nUPDATE: " + jsonPrint(update) 
          + "\nOPTIONS: " + jsonPrint(options) 
          + "\nERROR: " + jsonPrint(err)
        );
        callback(err, adminObj);
        return;
      } else {
        debug(">>> ADMIN UPDATED" 
          + " | " + ad.adminId 
          + " | IP: " + ad.ip 
          + " | DOM: " + ad.domain 
          + " | SID: " + ad.sessionId 
          + " | SN: " + ad.screenName
          + " | VER: " + ad.verified 
          + " | LS: " + moment(parseInt(ad.lastSeen)).format(compactDateTimeFormat)
          + " | SES: " + ad.sessions.length 
          + " | LSES: " + ad.lastSession 
          + " | CON: " + ad.connected
        );
        callback(null, ad);
        return;
      }
    }
  );
}

function viewerUpdateDb(viewerObj, callback) {

  console.log(chalkViewer("viewerUpdateDb\n" + jsonPrint(viewerObj)));

  var query = {
    userId: viewerObj.userId
  };
  var update = {
    "$set": {
      "viewerId": viewerObj.userId,
      "namespace": viewerObj.namespace,
      "domain": viewerObj.domain,
      "ip": viewerObj.ip,
      "sessionId": viewerObj.lastSession,
      "screenName": viewerObj.screenName,
      "description": viewerObj.description,
      "url": viewerObj.url,
      "profileUrl": viewerObj.profileUrl,
      "profileImageUrl": viewerObj.profileImageUrl,
      "verified": viewerObj.verified,
      "lastSeen": moment(),
      "lastSession": viewerObj.lastSession,
      "connected": viewerObj.connected
    },
    "$max": {
      "connectTime": viewerObj.connectTime,
      "disconnectTime": viewerObj.disconnectTime
    },
    "$push": {
      "sessions": viewerObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  Viewer.findOneAndUpdate(
    query,
    update,
    options,
    function(err, vw) {
      if (err) {
        console.log("!!! VIEWER FINDONE ERROR: " 
          + moment().format(compactDateTimeFormat) 
          + " | " + viewerObj.userId 
          + "\n" + err
        );
        callback(err, viewerObj);
      } else {
        console.log(chalkViewer(">>> VIEWER UPDATED" 
          + " | VID: " + vw.viewerId 
          + " | UID: " + vw.userId 
          + " | SN: " + vw.screenName 
          + " | NSP: " + vw.namespace 
          + " | IP: " + vw.ip 
          + " | DOM: " + vw.domain 
          + " | SID: " + vw.sessionId
          + " | VER: " + vw.verified 
          + " | LS: " + moment(parseInt(vw.lastSeen)).format(compactDateTimeFormat)
          + " | SES: " + vw.sessions.length 
          + " | LSES: " + vw.lastSession
        ));
        callback(null, vw);
      }
    }
  );
}

function userUpdateDb(userObj, callback) {

  if (userObj.ip && (userObj.domain === undefined)) {
    dnsReverseLookup(userObj.ip, function(err, domains) {
      if (err) {
        console.log(chalkError("*** dnsReverseLookup ERROR\n" + err));
      } else {
        if (domains[0]) {
          userObj.domain = domains[0];
          debug("userUpdateDb: UPDATED DOMAIN | " + userObj.userId + " | " + userObj.domain);
        }
      }
    });
  }

  userObj.mentions = userObj.mentions || 0;
  userObj.followersCount = userObj.followersCount || 0;
  userObj.friendsCount = userObj.friendsCount || 0;
  userObj.statusesCount = userObj.statusesCount || 0;

  var query = {
    userId: userObj.userId
  };
  var update = {
    "$set": {
      "namespace": userObj.namespace,
      "domain": userObj.domain,
      "ip": userObj.ip,
      "sessionId": userObj.lastSession,
      "name": userObj.name,
      "screenName": userObj.screenName,
      "description": userObj.description,
      "url": userObj.url,
      "profileUrl": userObj.profileUrl,
      "profileImageUrl": userObj.profileImageUrl,
      "verified": userObj.verified,
      "tags": userObj.tags,
      "lastSeen": userObj.lastSeen,
      "lastSession": userObj.lastSession,
      "connected": userObj.connected
    },
    "$max": {
      "connectTime": userObj.connectTime,
      "disconnectTime": userObj.disconnectTime,
      "mentions": userObj.mentions,
      "followersCount": userObj.followersCount,
      "friendsCount": userObj.friendsCount,
      "statusesCount": userObj.statusesCount
    },
    "$push": {
      "sessions": userObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  User.findOneAndUpdate(
    query,
    update,
    options,
    function(err, us) {
      if (err) {
        console.log("!!! USER FINDONE ERROR: " 
          + moment().format(compactDateTimeFormat) 
          + " | " + userObj.userId 
          + "\n" + err
        );
        callback(err, userObj);
      } else {
        debug(chalkUser(">>> USER UPDATED" 
          + " | " + us.userId 
          + " | N: " + us.name 
          + " | SN:   " + us.screenName 
          + " | NSP:  " + us.namespace 
          + " | IP:   " + us.ip 
          + " | DOM:  " + us.domain 
          + "\nSID:  " + us.sessionId
          + " | VER:  " + us.verified 
          + " | LS:   " + moment(parseInt(us.lastSeen)).format(compactDateTimeFormat)
          + " | SES:  " + us.sessions.length 
          + " | LSES: " + us.lastSession 
          + " | CON:  " + us.connected
          // + " \nTAGS: " + jsonPrint(us.tags) 
        ));
        callback(null, us);
      }
    }
  );
}

function utilUpdateDb(utilObj, callback) {

  if (utilObj.ip && (utilObj.domain === undefined)) {
    dnsReverseLookup(utilObj.ip, function(err, domains) {
      if (err) {
        console.log(chalkError("*** dnsReverseLookup ERROR\n" + err));
      } else {
        if (domains[0]) {
          utilObj.domain = domains[0];
          debug("utilUpdateDb: UPDATED DOMAIN | " + utilObj.userId + " | " + utilObj.domain);
        }
      }
    });
  }

  utilObj.mentions = utilObj.mentions || 0;
  utilObj.followersCount = utilObj.followersCount || 0;
  utilObj.friendsCount = utilObj.friendsCount || 0;
  utilObj.statusesCount = utilObj.statusesCount || 0;

  var query = {
    userId: utilObj.userId
  };
  var update = {
    "$set": {
      "namespace": utilObj.namespace,
      "domain": utilObj.domain,
      "ip": utilObj.ip,
      "sessionId": utilObj.lastSession,
      "name": utilObj.name,
      "screenName": utilObj.screenName,
      "description": utilObj.description,
      "url": utilObj.url,
      "profileUrl": utilObj.profileUrl,
      "profileImageUrl": utilObj.profileImageUrl,
      "verified": utilObj.verified,
      "tags": utilObj.tags,
      "lastSeen": utilObj.lastSeen,
      "lastSession": utilObj.lastSession,
      "connected": utilObj.connected
    },
    "$max": {
      "connectTime": utilObj.connectTime,
      "disconnectTime": utilObj.disconnectTime,
      "mentions": utilObj.mentions,
      "followersCount": utilObj.followersCount,
      "friendsCount": utilObj.friendsCount,
      "statusesCount": utilObj.statusesCount
    },
    "$push": {
      "sessions": utilObj.lastSession
    }
  };
  var options = {
    upsert: true,
    new: true
  };

  User.findOneAndUpdate(
    query,
    update,
    options,
    function(err, us) {
      if (err) {
        console.log("!!! USER FINDONE ERROR: " 
          + moment().format(compactDateTimeFormat) 
          + " | " + utilObj.userId 
          + "\n" + err
        );
        callback(err, utilObj);
      } else {
        debug(chalkUser(">>> USER UPDATED" 
          + " | " + us.userId 
          + " | N: " + us.name 
          + " | SN:   " + us.screenName 
          + " | NSP:  " + us.namespace 
          + " | IP:   " + us.ip 
          + " | DOM:  " + us.domain 
          + "\nSID:  " + us.sessionId
          + " | VER:  " + us.verified 
          + " | LS:   " + moment(parseInt(us.lastSeen)).format(compactDateTimeFormat)
          + " | SES:  " + us.sessions.length 
          + " | LSES: " + us.lastSession 
          + " | CON:  " + us.connected
          // + " \nTAGS: " + jsonPrint(us.tags) 
        ));
        callback(null, us);
      }
    }
  );
}

function adminFindAllDb(options, callback) {

  debug("\n=============================\nADMINS IN DB\n----------");
  if (options) {debug("OPTIONS\n" + jsonPrint(options));}

  var query = {};
  var projections = {
    adminId: true,
    namespace: true,
    sessionId: true,
    ip: true,
    domain: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true
  };

  Admin.find(query, projections, options, function(err, admins) {
    if (err) {
      console.log(err, null);
      callback(err);
      return;
    }
    if (admins) {

      async.forEach(

        admins,

        function(adminObj, callback) {

          debug(chalkAdmin("UID: " + adminObj.adminId 
            + " | SN: " + adminObj.screenName 
            + " | LS: " + moment(parseInt(adminObj.lastSeen)).format(compactDateTimeFormat)
          ));

          if (!adminObj.adminId || (adminObj.adminId === undefined) || adminObj.adminId === null) {
            debug(chalkError("*** ERROR: adminFindAllDb: ADMIN ID UNDEFINED *** | SKIPPING ADD TO CACHE"));
            callback("ERROR: ADMIN ID UNDEFINED", null);
          } 
          else {
            adminCache.set(adminObj.adminId, adminObj, function(err, result){
              callback(err, result);
            });
          }

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  adminFindAllDb: " + err);
            callback(err, null);
          } 
          else {
            debug("FOUND " + admins.length + " ADMINS");
            callback(null, admins.length);
          }
        }
      );

    } else {
      debug("NO ADMINS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function handleSessionEvent(sesObj, callback) {

  if (sesObj.sessionEvent !== "SESSION_KEEPALIVE") {
    console.log(chalkSession("SES Q" 
      + " | " + sessionQueue.size()
      + " | " + sesObj.sessionEvent
      + " | " + sesObj.session.sessionId 
    ));
  }

  var socketId;
  var entityRegEx = /#(\w+)$/ ;
  var namespaceRegEx = /^\/(\w+)#/ ;
  var namespace;
  var namespaceMatchArray;
  var currentUser;
  var currentUtil;
  var currentViewer;
  var adminSessionObj;
  var userSessionObj;
  var viewerSessionObj;
  var utilSessionObj;
  var sessionUpdateObj;
  var currentSession;
  var adminSessionKey;
  var viewerSessionKey;
  var sessionId;
  var key;
  var sessionCacheKey;

  switch (sesObj.sessionEvent) {

    case "SESSION_CREATE":

      if (sesObj.session.tags === undefined) {
        sesObj.session.tags = {};
        sesObj.session.tags.entity = "UNKNOWN_ENTITY";
        sesObj.session.tags.channel = "UNKNOWN_CHANNEL";
      }

      console.log(chalkSession(
        "+ SES" 
        + " | " + moment().format(compactDateTimeFormat) 
        // + " | NSP: " + sesObj.session.namespace 
        + " | " + sesObj.session.sessionId 
        + " | T " + sesObj.session.config.type 
        + " | M " + sesObj.session.config.mode 
        + " | E " + sesObj.session.tags.entity
        + " | C " + sesObj.session.tags.channel
        // + " | SIP: " + sesObj.session.ip
      ));

      switch (sesObj.session.config.type) {
        case "admin":
        case "control":
          break;
        case "user":
          break;
        case "util":
          break;
        case "stream":
          break;
        case "viewer":
          break;
        case "test_user":
          break;
        case "test_viewer":
          break;
        default:
          console.log(chalkError("??? UNKNOWN SESSION TYPE SESSION_CREATE handleSessionEvent"
            + "\n" + jsonPrint(sesObj)
          ));
          // quit(" 1 ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type);
      }

      dnsReverseLookup(sesObj.session.ip, function(err, domains) {

        if (!err && domains.length > 0) {
          sesObj.session.domain = domains[0];
          debug(chalkSession("... SESSION CREATE | IP: " + sesObj.session.ip 
            + " | DOMAINS: " + domains.length + " | " + domains[0]));
        } else {
          sesObj.session.domain = "UNKNOWN";
          debug(chalkSession("... SESSION CREATE | IP: " + sesObj.session.ip 
            + " | DOMAINS: UNKNOWN"));
        }

        sesObj.session.connected = true;
        sesObj.session.lastSeen = moment().valueOf();

        sessionUpdateDb(sesObj.session, function(err, sessionUpdatedObj) {
          if (!err) {
            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
          }
        });
      });
      break;

    case "SESSION_ABORT":

      console.log(chalkRed("SESSION_ABORT sesObj\n" + jsonPrint(sesObj)));
      namespaceMatchArray = sesObj.sessionId.match(namespaceRegEx);

      if (namespaceMatchArray[1] !== undefined) {namespace = namespaceMatchArray[1];}

      if (sesObj.sessionId.match(entityRegEx)) {
        socketId = sesObj.sessionId.replace(entityRegEx, "");
      }
      else {
        socketId = sesObj.sessionId;
      }

      utilNameSpace.to(sesObj.sessionId.replace(entityRegEx, "")).emit("SESSION_ABORT", sesObj.sessionId);

      console.log(chalkWarn("ABORT SESSION"
        + " | NSP: " + namespace 
        + " | TX SOCKET: " + socketId 
        // + " | ENTITY: " + entity 
        + " | SESS ID: " + sesObj.sessionId 
      ));

      sesObj.sessionEvent = "SESSION_DELETE";
      adminNameSpace.emit("SESSION_DELETE", socketId);
      viewNameSpace.emit("SESSION_DELETE", socketId);
      // testViewersNameSpace.emit("SESSION_DELETE", socketId);
      break;

    case "SESSION_KEEPALIVE":

      debug("KEEPALIVE\n" + jsonPrint(sesObj));

      if (sesObj.session.wordChain.length > MAX_WORDCHAIN_LENGTH) {
        debug(chalkSession("SHORTEN WC TO " + MAX_WORDCHAIN_LENGTH
          + " | UID: " + sesObj.session.userId
          + " | CURR LEN: " + sesObj.session.wordChain.length
          + " | FIRST WORD: " + sesObj.session.wordChain[0].nodeId
          + " | LAST WORD: " + sesObj.session.wordChain[sesObj.session.wordChain.length-1].nodeId
        ));
        sesObj.session.wordChain = sesObj.session.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
        debug(chalkSession("NEW WC"
          + " | UID: " + sesObj.session.userId
          + " | CURR LEN: " + sesObj.session.wordChain.length
          + " | FIRST WORD: " + sesObj.session.wordChain[0].nodeId
          + " | LAST WORD: " + sesObj.session.wordChain[sesObj.session.wordChain.length-1].nodeId
        ));

        if (sesObj.session.subSessionId !== undefined) {
          sessionCache.set(sesObj.session.subSessionId, sesObj.session);
        }
        sessionCache.set(sesObj.session.sessionId, sesObj.session);
      }
      else {
        if (sesObj.session.subSessionId !== undefined) {
          sessionCache.set(sesObj.session.subSessionId, sesObj.session);
        }
        sessionCache.set(sesObj.session.sessionId, sesObj.session);
      }

      if (!sesObj.session.userId) {
        console.log(chalkError("SESSION_KEEPALIVE: UNDEFINED USER ID" 
          + "\nsesObj.session\n" + jsonPrint(sesObj.session)));
        console.log(chalkError("SESSION_KEEPALIVE: UNDEFINED USER ID" 
          + "\nsesObj\n" + jsonPrint(sesObj)));
        if (configuration.quitOnError) { quit("UNDEFINED USER ID: " + sesObj.session.sessionId); }
      }

      utilCache.set(sesObj.session.userId, sesObj.session.user, function(err, success) {
        if (err) {
          console.log(chalkError("UTIL CACHE ERROR"
            + " | " + success
            + "\n" + jsonPrint(err)
          ));
        }
      });

      if (sesObj.session.config.type === "viewer") {
        viewerCache.set(sesObj.session.userId, sesObj.session);
        debug(chalkViewer("$ VIEWER: " + sesObj.session.userId + "\n" + jsonPrint(sesObj.session)));
      }

      debug(chalkLog(
        "K>" + " | " + sesObj.session.userId 
        + " | SID " + sesObj.session.sessionId 
        + " | T " + sesObj.session.config.type 
        + " | M " + sesObj.session.config.mode 
        + " | NS " + sesObj.session.namespace 
        + " | SID " + sesObj.session.sessionId 
        + " | WCI " + sesObj.session.wordChainIndex 
        + " | IP " + sesObj.session.ip
        // + "\n" + jsonPrint(sesObj.session)
      ));

      if (sesObj.session.namespace !== "view") {
        sessionUpdateObj = {
          action: "KEEPALIVE",
          nodeId: sesObj.session.tags.entity + "_" + sesObj.session.tags.channel,
          tags: sesObj.session.tags,
          userId: sesObj.session.userId,
          url: sesObj.session.url,
          profileImageUrl: sesObj.session.profileImageUrl,
          sessionId: sesObj.session.sessionId,
          wordChainIndex: sesObj.session.wordChainIndex
        };


        io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit("KEEPALIVE_ACK", sesObj.session.nodeId);

        updateSessionViews(sessionUpdateObj);
      }
      break;

    case "SESSION_EXPIRED":
    case "SOCKET_ERROR":
    case "SOCKET_DISCONNECT":

      debug(chalkSession(
        "X " + sesObj.sessionEvent
        // + "\n" + jsonPrint(sesObj)
        + " | " + moment().format(compactDateTimeFormat) 
        + " | " + sesObj.session.namespace 
        + " | " + sesObj.session.sessionId 
        + " | " + sesObj.session.userId 
        // + " | IP: " + sesObj.session.ip 
        // + " | DOMAIN: " + sesObj.session.domain
      ));

      debug(chalkSession("SESSION\n" + jsonPrint(sesObj)));

      sesObj.sessionEvent = "SESSION_DELETE";
      viewNameSpace.emit("SESSION_DELETE", sesObj.session.sessionId);
      adminNameSpace.emit("SESSION_DELETE", sesObj.session.sessionId);

      if (sesObj.session) {

        sessionCache.del(sesObj.session.sessionId, function(err){
          if (err) {console.log(chalkError("SESS DELETE ERROR " + err));}
          debug(chalkSession("XXX SESS DELETE " + sesObj.session.sessionId));
        });

        var sessKeys = sessionCache.keys();

        sessKeys.forEach(function(sId){
          if (sId.indexOf(sesObj.session.sessionId) > -1) {
            adminNameSpace.emit("SESSION_DELETE", sId);
            sessionCache.del(sId);
            console.log(chalkRed("XXX SESS " + sId));
          }
        });

        debug(sesObj.sessionEvent + "\n" + jsonPrint(sesObj));

        sesObj.session.disconnectTime = moment().valueOf();
        sessionUpdateDb(sesObj.session);

        adminCache.get(sesObj.session.userId, function(err, currentAdmin){
          if (err){
            console.log(chalkError("ADMIN CACHE ERR\n" + jsonPrint(err)));
          }
          if (currentAdmin) {
            debug("currentAdmin\n" + jsonPrint(currentAdmin));
            adminCache.del(currentAdmin.adminId);

            currentAdmin.lastSeen = moment().valueOf();
            currentAdmin.disconnectTime = moment().valueOf();
            currentAdmin.connected = false;
            currentAdmin.connectTime = currentAdmin.connectTime || moment().valueOf();

            console.log(chalkLog("CONNECTION DURATION: " + currentAdmin.adminId 
              + " | " + msToTime(moment().valueOf() - currentAdmin.connectTime)));

            adminUpdateDb(currentAdmin, function(err, updatedAdminObj) {
              if (!err) {
                debug(chalkRed("TX ADMIN SESSION (DISCONNECT): " 
                  + updatedAdminObj.lastSession + " TO ADMIN NAMESPACE"));

                adminNameSpace.emit("ADMIN_SESSION", updatedAdminObj);
              }
            });
          }
        });

        userCache.get(sesObj.session.userId, function(err, currentUser){
          if (err){
            console.log(chalkError("USER CACHE ERR\n" + jsonPrint(err)));
          }
          if (currentUser) {
            debug("currentUser\n" + jsonPrint(currentUser));
            userCache.del(currentUser.userId);

            currentUser.lastSeen = moment().valueOf();
            currentUser.connected = false;
            currentUser.disconnectTime = moment().valueOf();

            debug(chalkRed("CONNECTION DURATION: " + currentUser.userId 
              + " | " + msToTime(moment().valueOf() - currentUser.connectTime)));

            userUpdateDb(currentUser, function(err, updatedUserObj) {
              if (!err) {

                updatedUserObj.sessionId = updatedUserObj.lastSession;

                console.log(chalkLog("TX USER SESSION (" + sesObj.sessionEvent + "): " + updatedUserObj.lastSession 
                  + " TO ADMIN NAMESPACE"));

                adminNameSpace.emit("UTIL_SESSION", updatedUserObj); // KLUDGE: need to work out what"s a USER and what"s a UTIL
                adminNameSpace.emit("USER_SESSION", updatedUserObj);
              }
            });
          }
        });

        utilCache.get(sesObj.session.userId, function(err, currentUtil){
          if (err){
            console.log(chalkError("UTIL CACHE ERR\n" + jsonPrint(err)));
          }
          if (currentUtil) {
            debug("currentUtil\n" + jsonPrint(currentUtil));
            userCache.del(currentUtil.userId);
            currentUtil.lastSeen = moment().valueOf();
            currentUtil.connected = false;
            currentUtil.disconnectTime = moment().valueOf();

            debug(chalkRed("CONNECTION DURATION: " + currentUtil.userId 
              + " | " + msToTime(moment().valueOf() - currentUtil.connectTime)));

            userUpdateDb(currentUtil, function(err, updatedUtilObj) {
              if (!err) {

                updatedUtilObj.sessionId = updatedUtilObj.lastSession;

                debug(chalkLog("TX UTIL SESSION (DISCONNECT): " 
                  + updatedUtilObj.lastSession + " TO ADMIN NAMESPACE"));

                adminNameSpace.emit("UTIL_SESSION", updatedUtilObj);
                adminNameSpace.emit("USER_SESSION", updatedUtilObj);
              }
            });
          }
        });

        viewerCache.get(sesObj.session.userId, function(err, currentViewer){
          if (err){
            console.log(chalkError("VIEWER CACHE ERR\n" + jsonPrint(err)));
          }
          if (currentViewer) {
            console.log(chalkViewer("currentViewer\n" + jsonPrint(currentViewer)));
            viewerCache.del(currentViewer.userId);

            currentViewer.lastSession = sesObj.session.sessionId;
            currentViewer.lastSeen = moment().valueOf();
            currentViewer.connected = false;
            currentViewer.disconnectTime = moment().valueOf();

            debug(chalkRed("CONNECTION DURATION: " + currentViewer.userId 
              + " | " + msToTime(moment().valueOf() - currentViewer.connectTime)));

            viewerUpdateDb(currentViewer, function(err, updatedViewerObj) {
              if (!err) {

                updatedViewerObj.sessionId = updatedViewerObj.lastSession;

                debug(chalkRed("TX VIEWER SESSION (DISCONNECT): " + updatedViewerObj.lastSession 
                  + " TO ADMIN NAMESPACE"));

                adminNameSpace.emit("VIEWER_SESSION", updatedViewerObj);
              }
            });
          }
        });
      }

      break;

    case "SOCKET_RECONNECT":

      debug(chalkSession(
        "<-> SOCKET RECONNECT" 
        + " | " + moment().format(compactDateTimeFormat) 
        + " | NSP: " + sesObj.session.namespace 
        + " | SID: " + sesObj.session.sessionId 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      sessionCache.set(sesObj.session.sessionId, sesObj.session);
      sessionUpdateDb(sesObj.session, function(err, updatedSesObj) {
        if (err) {
          console.log(chalkError("SESSION UPDATE ERROR\n" + jsonPrint(err)));
        }
        else {
          debug(chalkInfo("SESSION UPDATE\n" + jsonPrint(updatedSesObj)));
        }
      });

      currentUser = userCache.get(sesObj.session.userId);
      currentViewer = viewerCache.get(sesObj.session.userId);
      currentUtil = utilCache.get(sesObj.session.userId);

      if (currentUtil) {
        currentUtil.connected = true;

        utilUpdateDb(currentUtil, function(err, updatedUtilObj) {
          if (!err) {
            debug(chalkRed("TX UTIL SESSION (SOCKET ERROR): " + updatedUtilObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit("UTIL_SESSION", updatedUtilObj);
          }
        });
      } else if (currentUser) {
        currentUser.connected = true;

        userUpdateDb(currentUser, function(err, updatedUserObj) {
          if (!err) {
            debug(chalkRed("TX USER SESSION (SOCKET ERROR): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit("USER_SESSION", updatedUserObj);
          }
        });
      } else if (currentViewer) {
        currentViewer.connected = true;

        viewerUpdateDb(currentViewer, function(err, updatedViewerObj) {
          if (!err) {
            debug(chalkRed("TX VIEWER SESSION (SOCKET ERROR): " + updatedViewerObj.lastSession + " TO ADMIN NAMESPACE"));

            adminNameSpace.emit("VIEWER_SESSION", updatedViewerObj);
          }
        });
      }
      break;

    case "REQ_ADMIN_SESSION":
      Object.keys(adminNameSpace.connected).forEach(function(adminSessionKey) {
        adminSessionObj = sessionCache.get(adminSessionKey);
        if (adminSessionObj) {
          debug("FOUND ADMIN SESSION: " + adminSessionObj.sessionId);
          debug("TX ADMIN SESSION: " + adminSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace 
            + "#" + sesObj.options.requestSocketId);
          adminNameSpace.to(sesObj.session.sessionId).emit("ADMIN_SESSION", adminSessionObj);
        }
      });
      break;

    case "REQ_USER_SESSION":
      debug(chalkAlert("RX REQ_USER_SESSION\n" + jsonPrint(sesObj)));
      Object.keys(userNameSpace.connected).forEach(function(userSessionKey) {
        userSessionObj = sessionCache.get(userSessionKey);
        if (userSessionObj) {
          debug("FOUND USER SESSION: " + userSessionObj.sessionId);
          debug(chalkRed("TX USER SESSION: " + userSessionObj.sessionId
            + " TO " + sesObj.session.namespace + "#" + sesObj.session.sessionId));
          delete userSessionObj.wordChain;

          if (sesObj.session.namespace === "view") {
            viewNameSpace.to(sesObj.session.sessionId).emit("USER_SESSION", userSessionObj);
          }
          adminNameSpace.to(sesObj.session.sessionId).emit("USER_SESSION", userSessionObj);
        }
      });
      break;

    case "REQ_VIEWER_SESSION":
      debug(chalkAlert("RX REQ_VIEWER_SESSION\n" + jsonPrint(sesObj)));
      Object.keys(viewNameSpace.connected).forEach(function(viewerSessionKey) {
        viewerSessionObj = sessionCache.get(viewerSessionKey);
        if (viewerSessionObj) {
          debug("FOUND VIEWER SESSION: " + viewerSessionObj.sessionId);
          debug(chalkRed("TX VIEWER SESSION: " + viewerSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
          delete viewerSessionObj.wordChain;

          adminNameSpace.to(sesObj.session.sessionId).emit("VIEWER_SESSION", viewerSessionObj);
        }
      });
      break;

    case "REQ_UTIL_SESSION":
      debug(chalkAlert("RX REQ_UTIL_SESSION\n" + jsonPrint(sesObj)));

      Object.keys(utilNameSpace.connected).forEach(function(utilSessionKey) {

        utilSessionObj = sessionCache.get(utilSessionKey);

        if (utilSessionObj) {
          debug("FOUND UTIL SESSION: " + utilSessionObj.sessionId);
          debug(chalkRed("TX UTIL SESSION: " + utilSessionObj.sessionId 
            + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
          delete utilSessionObj.wordChain;

          adminNameSpace.to(sesObj.session.sessionId).emit("UTIL_SESSION", utilSessionObj);
        }

      });
      break;

    case "ADMIN_READY":

      // ????? ADMIN VERIFICATION SHOULD HAPPEN HERE

      if (sesObj.session.ip !== undefined) {
        if (dnsHostHashMap.has(sesObj.session.ip)) {
          sesObj.admin.domain = dnsHostHashMap.get(sesObj.session.ip);
          sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
        }
      }

      debug("ADMIN_READY\n" + jsonPrint(sesObj));

      debug(chalkSession(
        ">>> SESSION ADMIN READY" 
        + " | " + moment().format(compactDateTimeFormat) 
        + " | SID: " + sesObj.session.sessionId 
        + " | UID: " + sesObj.admin.adminId 
        + " | NSP: " + sesObj.session.namespace 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      currentSession = sessionCache.get(sesObj.session.sessionId);


      if (!currentSession) {
        debug(chalkWarn("??? ADMIN SESSION NOT IN CACHE\n" + jsonPrint(sesObj)));
      } else {
        currentSession.userId = sesObj.admin.adminId;

        sesObj.admin.ip = sesObj.session.ip;
        sesObj.admin.domain = sesObj.session.domain;
        sesObj.admin.lastSession = sesObj.session.sessionId;
        sesObj.admin.lastSeen = moment().valueOf();
        sesObj.admin.connectTime = moment().valueOf();
        sesObj.admin.disconnectTime = moment().valueOf();
        sesObj.admin.connected = true;

        console.log("adminUpdateDb\n" + jsonPrint(sesObj));

        adminUpdateDb(sesObj.admin, function(err, adminObj) {
          if (!err) {

            adminSessionKey = randomInt(1000000, 1999999);

            currentSession.adminSessionKey = adminObj.adminId + "-" + adminSessionKey;
            currentSession.connected = true;

            sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
              if (!err) {
                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                debug(chalkInfo("-S- DB UPDATE" + " | " + sessionUpdatedObj.sessionId));
                debug("TX ADMIN_ACK", adminSessionKey);
                io.of(currentSession.namespace).to(currentSession.sessionId).emit("ADMIN_ACK", adminSessionKey);
              } else {
                debug(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
              }
            });
          }
        });
      }

      break;

    case "VIEWER_READY":

      if (sesObj.session.ip !== undefined) {
        if (dnsHostHashMap.has(sesObj.session.ip)) {
          sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
          sesObj.viewer.domain = dnsHostHashMap.get(sesObj.session.ip);
        }
      }

      debug("VIEWER_READY\n" + jsonPrint(sesObj));

      debug(chalkSession(
        ">>> SESSION VIEWER READY" 
        + " | " + moment().format(compactDateTimeFormat) 
        + " | SID: " + sesObj.session.sessionId 
        + " | UID: " + sesObj.viewer.userId 
        + " | NSP: " + sesObj.session.namespace 
        + " | IP: " + sesObj.session.ip 
        + " | DOMAIN: " + sesObj.session.domain
      ));

      currentSession = sessionCache.get(sesObj.session.sessionId);

      if (currentSession === undefined) {
        currentSession = sesObj.session;
      }

      currentSession.userId = sesObj.viewer.userId;
      currentSession.viewerId = sesObj.viewer.viewerId;

      sesObj.viewer.ip = sesObj.session.ip;
      sesObj.viewer.domain = sesObj.session.domain;
      sesObj.viewer.namespace = sesObj.session.namespace;
      sesObj.viewer.lastSession = sesObj.session.sessionId;
      sesObj.viewer.lastSeen = moment().valueOf();
      sesObj.viewer.connected = true;
      sesObj.viewer.connectTime = moment().valueOf();
      sesObj.viewer.disconnectTime = 0;

      viewerCache.set(sesObj.viewer.userId, sesObj.viewer);

      viewerUpdateDb(sesObj.viewer, function(err, updatedViewerObj) {
        if (err) {
          console.log(chalkError("*** ERROR viewerUpdateDb\n" + jsonPrint(err)));
        } 
        else {
          viewerSessionKey = randomInt(1000000, 1999999);
          currentSession.viewerSessionKey = viewerSessionKey;
          updatedViewerObj.viewerSessionKey = viewerSessionKey;
          sessionUpdateDb(currentSession, function(err, sessionUpdatedObj) {
            if (err) {
              console.log(chalkError("*** ERROR sessionUpdateDb\n" + jsonPrint(err)));
            } 
            else {
              sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
              debug(chalkInfo("-S- DB UPDATE" 
                + " | " + sessionUpdatedObj.sessionId 
                + " | " + sessionUpdatedObj.userId 
                + "\n" + jsonPrint(sessionUpdatedObj)));
              debug("TX VIEWER_ACK", viewerSessionKey);
              io.of(currentSession.namespace).to(currentSession.sessionId).emit("VIEWER_ACK", viewerSessionKey);
              debug(chalkRed("TX VIEWER SESSION (VIEWER READY): " + updatedViewerObj.lastSession + " TO ADMIN NAMESPACE"));
              adminNameSpace.emit("VIEWER_SESSION", updatedViewerObj);
            }
          });
        }
      });
      break;

    case "USER_READY":

      if (sesObj.session.ip !== undefined) {
        if (dnsHostHashMap.has(sesObj.session.ip)) {
          sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
          sesObj.user.domain = dnsHostHashMap.get(sesObj.session.ip);
          debug(chalkUser("@@@ USER_READY SET DOMAIN: " + dnsHostHashMap.get(sesObj.session.ip)));
        }
      }

      debug(chalkSession("> USR RDY" 
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + sesObj.session.sessionId 
        + " | U " + sesObj.user.userId 
        + " | N " + sesObj.user.name 
        + " | M " + sesObj.session.config.mode 
        + " | G " + sesObj.user.tags.group 
        + " | E " + sesObj.user.tags.entity 
        + " | C " + sesObj.user.tags.channel 
      ));

      sessionId = sesObj.session.sessionId;

      if (sesObj.session.config.mode === "muxstream"){
        debug(chalkInfo("MUXSTREAM"
          + " | " + sesObj.session.sessionId
        ));
      }

      if (sesObj.session.config.mode === "substream"){
        sessionId = sesObj.session.sessionId + "#" + sesObj.user.tags.entity;
        debug(chalkInfo("SUBSTREAM"
          + " | " + sesObj.session.sessionId
        ));
      }

      if (sesObj.session.config.mode === "monitor"){
        key = sesObj.user.tags.entity + "_" + sesObj.user.tags.channel;
        monitorHashMap[key] = sesObj;
        debug(chalkRed("ADDDED MONITOR"
          + " | " + key
          + " | " + sesObj.session.sessionId
        ));
      }

      userCache.set(sesObj.user.userId, sesObj.user, function(err, success) {
        debug(chalkLog("USER CACHE RESULTS" + "\n" + err + "\n" + success));
      });

      currentSession = sessionCache.get(sessionId);

      if (currentSession !== undefined) {
        currentSession.config.type = sesObj.session.config.type;
        currentSession.config.mode = sesObj.session.config.mode;
        currentSession.nodeId = sesObj.user.tags.entity.toLowerCase() + "_" + sesObj.user.tags.channel.toLowerCase();
        currentSession.sessionId = sesObj.session.sessionId;
        currentSession.entity = sesObj.user.tags.entity.toLowerCase();
        currentSession.userId = sesObj.user.userId;
        currentSession.user = sesObj.user;
        currentSession.profileImageUrl = sesObj.session.profileImageUrl;
      } else {
        currentSession = {};
        currentSession = sesObj.session;
        currentSession.config.type = sesObj.session.config.type;
        currentSession.config.mode = sesObj.session.config.mode;
        currentSession.nodeId = sesObj.user.tags.entity.toLowerCase() + "_" + sesObj.user.tags.channel.toLowerCase();
        currentSession.sessionId = sesObj.session.sessionId;
        currentSession.entity = sesObj.user.tags.entity.toLowerCase();
        currentSession.userId = sesObj.user.userId;
        currentSession.user = sesObj.user;
        currentSession.profileImageUrl = sesObj.session.profileImageUrl;
      }

      sesObj.user.ip = sesObj.session.ip;
      sesObj.user.profileImageUrl = sesObj.session.profileImageUrl;
      sesObj.user.namespace = sesObj.session.namespace;
      sesObj.user.domain = sesObj.session.domain;
      sesObj.user.lastSession = sesObj.session.sessionId;
      sesObj.user.lastSeen = moment().valueOf();
      sesObj.user.connectTime = moment().valueOf();
      sesObj.user.disconnectTime = moment().valueOf();
      sesObj.user.connected = true;

      userUpdateDb(sesObj.user, function(err, updatedUserObj) {

        if (!err) {

          debug(chalkError("userUpdateDb CALLBACK\nERR\n"
           + jsonPrint(err) 
           + "\nUSEROBJ\n" + jsonPrint(updatedUserObj)
          ));

          groupUpdateDb(updatedUserObj, function(err, entityObj){

            debug(chalkError("groupUpdateDb CALLBACK\nERR\n" + jsonPrint(err)
             + "\nentityObj\n" + jsonPrint(entityObj)
             ));

            if (err){
              console.log(chalkError("GROUP UPDATE DB ERROR: " + err));
            }
            else if ((updatedUserObj.tags.mode !== undefined) 
              && (updatedUserObj.tags.mode === "substream")) {

              var muxedSessionId = sesObj.session.sessionId.replace(/#\w+$/, "");

              updatedUserObj.isMuxed = true;
              debug(chalkInfo("TX UTIL SESSION (UTIL READY)"
                + " | " + updatedUserObj.lastSession
                + " | " + updatedUserObj.userId + " TO ADMIN NAMESPACE"
              ));
              adminNameSpace.emit("UTIL_SESSION", updatedUserObj);

              debug(chalkSession("TX USER_READY_ACK"
                + " | muxedSessionId: " + muxedSessionId
                + " | " + sesObj.session.sessionId
                + " | U: " + updatedUserObj.userId
                // + "\n" + jsonPrint(updatedUserObj)
              ));

              io.of(sesObj.session.namespace).to(muxedSessionId).emit("USER_READY_ACK", updatedUserObj.userId);
            }
            else {
              if (updatedUserObj.groupId === undefined) {
                if (sesObj.user.tags.group !== undefined) {
                  updatedUserObj.groupId = sesObj.user.tags.group.toLowerCase();
                }
                else {
                  updatedUserObj.groupId = "unknown_group";
                }
              }

              entityUpdateDb(updatedUserObj, function(err, entityObj){
                if (err){
                  console.log(chalkError("ENTITY UPDATE DB ERROR: " + err));
                }
                else {

                  debug(chalkInfo("ENTITY UPDATE"
                    + " | " + entityObj.entityId
                    // + "\n" + jsonPrint(entityObj)
                  ));

                  if (sesObj.session.config.type === "user") {
                    console.log(chalkInfo("TX USER SESSION (USER READY)"
                      + " | LAST SEEN: " + moment(parseInt(entityObj.lastSeen)).format(compactDateTimeFormat)
                      + " | N: " + entityObj.name
                      + " | SN: " + entityObj.screenName
                    ));
                    adminNameSpace.emit("USER_SESSION", entityObj);
                  } 
                  else if (sesObj.session.config.type === "util") {
                    debug(chalkInfo("TX USER SESSION (UTIL READY)"
                      + " | LAST SEEN: " + moment(parseInt(entityObj.lastSeen)).format(compactDateTimeFormat)
                      + " | UID: " + entityObj.entityId
                      + " | N: " + entityObj.name
                      + " | SN: " + entityObj.screenName
                    ));
                    adminNameSpace.emit("UTIL_SESSION", entityObj);
                  }

                  console.log(chalkSession("TX USER_READY_ACK"
                    + " | " + sesObj.session.sessionId
                    + " | E: " + entityObj.entityId
                  ));
                  io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit("USER_READY_ACK", entityObj.entityId);
                }
              });
            }
          });
        } 
        else {
          console.log(chalkError("*** USER UPDATE DB ERROR\n" + jsonPrint(err)));
          if (configuration.quitOnError) {
            quit(err);
          }
        }
      });

      /*
          ROUTING OF PROMPT/RESPONSE BASED ON SESSION TYPE
      */

      sessionCacheKey = currentSession.sessionId;

      sessionCache.set(sessionCacheKey, currentSession, function(err, success) {
        if (!err && success) {

          userCache.set(currentSession.userId, sesObj.user, function(err, success) {
            if (!err && success) {
              switch (sesObj.session.config.type) {
                case "viewer":
                  break;
                case "control":
                case "admin":
                  break;
                case "util":
                  break;
                case "test_viewer":
                  break;
                case "substream":
                case "stream":
                  break;
                default:
                  console.log(chalkError("??? UNKNOWN SESSION TYPE USER_READY handleSessionEvent"
                    + "\n" + jsonPrint(sesObj)
                  ));
              }
            }
          });
        }
      });
      break;

    default:
      console.log(chalkError("??? UNKNOWN SESSION EVENT handleSessionEvent"
        + "\n" + jsonPrint(sesObj)
      ));
  }

  if (callback !== undefined) { callback(null, sesObj); }
}

var sessionEventHandlerReady = true;
function initSessionEventHandlerInterval(interval){

  console.log(chalkInfo("INIT SESSION EVENT HANDLER INTERVAL | " + interval + " MS"));
  clearInterval(sessionEventHandlerInterval);

  sessionEventHandlerReady = true;

  sessionEventHandlerInterval = setInterval(function() {
    var sesObj;
    if (!sessionQueue.isEmpty() && sessionEventHandlerReady) {
      sessionEventHandlerReady = false;
      sesObj = sessionQueue.dequeue();
      handleSessionEvent(sesObj, function(){
        sessionEventHandlerReady = true;
      });
    }
  }, interval);
}

function getTags(wObj, callback){

  debug(chalkInfo("getTags\n" + jsonPrint(wObj)));

  wordsPerMinuteTopTermCache.get(wObj.nodeId.toLowerCase(), function(err, wordRate) {
    if (wordRate) {
      wObj.isTopTerm = true;
    }
    else {
      wObj.isTopTerm = false;
    }

    checkKeyword(wObj, function(wordObj){

      debug(chalkInfo("checkKeyword\n" + jsonPrint(wordObj)));

      if (!wordObj.tags || (wordObj.tags === undefined)) {
        wordObj.tags = {};
        wordObj.tags.entity = "unknown_entity";
        wordObj.tags.channel = "unknown_channel";
        wordObj.tags.group = "unknown_group";

        console.log(chalkError("SET UNKNOWN WORDOBJ TAGS\n" + jsonPrint(wordObj)));
        entityChannelGroupHashMap.set("unknown_entity", { groupId: "unknown_group", name: "UNKNOWN GROUP"});

        if (configuration.quitOnError) { quit("UNKNOWN WORDOBJ TAGS"); }

        callback(wordObj);
      } 
      else {
        if (!wordObj.tags.entity || (wordObj.tags.entity === undefined)) {
          wordObj.tags.entity = "unknown_entity";
          console.log(chalkError("SET UNKNOWN WORDOBJ ENTITY\n" + jsonPrint(wordObj)));
        }
        else {
          wordObj.tags.entity = wordObj.tags.entity.toLowerCase();
        }

        if (!wordObj.tags.channel || (wordObj.tags.channel === undefined)) {
          wordObj.tags.channel = "unknown_channel";
          console.log(chalkError("SET UNKNOWN WORDOBJ CHANNEL\n" + jsonPrint(wordObj)));
        }
        else {
          wordObj.tags.channel = wordObj.tags.channel.toLowerCase();
        }

        if (entityChannelGroupHashMap.has(wordObj.tags.entity.toLowerCase())){
          wordObj.tags.group = entityChannelGroupHashMap.get(wordObj.tags.entity.toLowerCase()).groupId;
          callback(wordObj);
        }
        else {
          debug(chalkError("entityChannelGroupHashMap MISS \n" + jsonPrint(wordObj)));
          wordObj.tags.group = wordObj.tags.entity.toLowerCase();
          entityChannelGroupHashMap.set(
            wordObj.tags.entity.toLowerCase(), 
            { groupId: wordObj.tags.group, 
              name: wordObj.tags.entity.toLowerCase() 
            } 
          );
          callback(wordObj);
        }
      }
    });
  });
}


function sendUpdated(updatedObj, callback){

  // console.log(chalkInfo("sendUpdated"
  //   + " | " + updatedObj.word.sessionId
  //   + " | " + updatedObj.word.nodeId
  // ));

  if (updatedObj.word.sessionId === undefined) {
    console.log(chalkError("UNDEFINED SESSION ID\n" + jsonPrint(updatedObj)));
    if (configuration.quitOnError) { quit("sendUpdated UNDEFINED SESSION ID"); }
  }

  getTags(updatedObj.word, function(uWordObj){

    debug(chalkInfo("uWordObj\n" + jsonPrint(uWordObj)));
    
    updateWordMeter(uWordObj, function(err, updatedWordObj){
      if (updatedWordObj.tags){

        if (!updatedWordObj.tags.group || (updatedWordObj.tags.group === undefined)) {
          updatedWordObj.tags.group = updatedWordObj.tags.entity;
        }

        debug(chalkInfo("R<" 
          + " G " + updatedWordObj.tags.group 
          + " E " + updatedWordObj.tags.entity 
          + " C " + updatedWordObj.tags.channel 
          + " | " + updatedWordObj.nodeId 
          + " | " + updatedWordObj.raw 
        ));

        wordCache.set(updatedWordObj.nodeId, updatedWordObj, function(err, success){
          if (err) {
            console.log(chalkError("WORD CACHE SET ERROR\n" + jsonPrint(err)));
          }
          sessionCache.get(updatedWordObj.sessionId, function(err, currentSessionObj) {
            if (!err && currentSessionObj) {
              var sessionUpdateObj = {
                action: "WORD",
                userId: currentSessionObj.userId,
                url: currentSessionObj.url,
                profileImageUrl: currentSessionObj.profileImageUrl,
                sessionId: currentSessionObj.sessionId,
                wordChainIndex: updatedWordObj.wordChainIndex,
                source: updatedWordObj,
                tags: updatedWordObj.tags
              };

              debug(chalkInfo("R<" 
                + " | " + sessionUpdateObj.source.nodeId 
                + " | RATE: " + sessionUpdateObj.source.rate 
                + " | Ms: " + sessionUpdateObj.source.mentions 
              ));

              updateSessionViews(sessionUpdateObj);
              callback(null, sessionUpdateObj);
            } 
            else if (currentSessionObj === undefined) {
              console.log(chalkAlert("??? SESSION NOT IN CACHE" 
                + " | " + moment().format(compactDateTimeFormat)
                + " | NID: " + updatedWordObj.nodeId
                + " | SID: " + updatedWordObj.sessionId
                + " | E: " + updatedWordObj.tags.entity
                + "\n" + jsonPrint(updatedWordObj)
              ));

              if (configuration.quitOnError) { quit("SESSION NOT IN CACHE"); }

              var unknownSession = {};
              unknownSession.sessionId = updatedWordObj.sessionId;
              unknownSession.socketId = updatedWordObj.socketId;
              unknownSession.userObj = {};
              unknownSession.userObj.name = updatedWordObj.tags.entity;
              unknownSession.userObj.tags = {};
              unknownSession.userObj.tags = updatedWordObj.tags;
              unknownSession.userObj.userId = updatedWordObj.tags.entity;
              unknownSession.userObj.url = updatedWordObj.tags.url;
              unknownSession.userObj.profileImageUrl = null;
              unknownSession.userObj.screenName = updatedWordObj.tags.entity;
              unknownSession.userObj.namespace = "util";
              unknownSession.userObj.type = "util";
              unknownSession.userObj.mode = updatedWordObj.tags.mode || "UNDEFINED";
              unknownSession.userObj.nodeId = updatedWordObj.tags.entity + "_" + updatedWordObj.tags.channel;
              unknownSession.wordObj = {};
              unknownSession.wordObj = updatedWordObj;
              unknownSession.wordChain = [];
              unknownSession.wordChainIndex = 0;

              configEvents.emit("UNKNOWN_SESSION", unknownSession);

              var sessionUpdateObj = {
                action: "WORD",
                userId: unknownSession.userId,
                url: unknownSession.url,
                profileImageUrl: unknownSession.profileImageUrl,
                sessionId: unknownSession.sessionId,
                wordChainIndex: updatedWordObj.wordChainIndex,
                source: updatedWordObj,
                tags: updatedWordObj.tags
              };

              updateSessionViews(sessionUpdateObj);
              callback(null, sessionUpdateObj);
            }
            else {
              console.log(chalkError("*** SESSION CACHE SET ERROR" + "\n" + jsonPrint(err)));
              callback(err, currentSessionObj);
            }
          });
        });
      }
      else {
        debug(chalkInfo("R<" 
          + " G " + updatedWordObj.tags.group 
          + " E " + updatedWordObj.tags.entity 
          + " C " + updatedWordObj.tags.channel 
          + " | " + updatedWordObj.nodeId 
          + " | " + updatedWordObj.raw 
          + "\n" + jsonPrint(updatedWordObj) 
        ));

        wordCache.set(updatedWordObj.nodeId, updatedWordObj, function(err, success){
         if (err) {
            console.log(chalkError("WORD CACHE SET ERROR\n" + jsonPrint(err)));
          }

          sessionCache.get(updatedObj.sessionId, function(err, currentSessionObj){
            if (err){
              console.log(chalkError("*** ERROR SESSION CACHE GET " + updatedObj.sessionId + "\n" + jsonPrint(err)));
              if (configuration.quitOnError) { quit("ERROR SESSION CACHE GET"); }
            }
            else if (currentSessionObj === undefined) {
              console.log(chalkError("*** SESSION CACHE GET UNDEFINED" + updatedObj.sessionId + "\n" + jsonPrint(err)));
              if (configuration.quitOnError) { quit("SESSION CACHE GET UNDEFINED"); }
            }
            else {
              var sessionUpdateObj = {
                action: "WORD",
                userId: currentSessionObj.userId,
                url: currentSessionObj.url,
                profileImageUrl: currentSessionObj.profileImageUrl,
                sessionId: currentSessionObj.sessionId,
                wordChainIndex: currentSessionObj.wordChainIndex,
                source: updatedWordObj,
                tags: updatedWordObj.tags
              };
              updateSessionViews(sessionUpdateObj);
              callback(null, sessionUpdateObj);
            }
          });

        });
      }

    });
  });
}

var rxWordQueueReady = true;
var trendingTopicsArray = [];
var trendingTopicHitArray = [];

function initRxWordQueueInterval(interval){

  console.log(chalkInfo("INIT RX WORD QUEUE INTERVAL | " + interval + " MS"));
  clearInterval(rxWordQueueInterval);
  rxWordQueueReady = true;

  rxWordQueueInterval = setInterval(function() {

    if (rxWordQueueReady && !rxWordQueue.isEmpty()) {

      rxWordQueueReady = false;

      var wordObj = rxWordQueue.dequeue();

      debug(chalkInfo("RX WORD Q" 
        + "\n" + jsonPrint(wordObj)
      ));

      if ((wordObj.nodeId === undefined) 
        || (typeof wordObj.nodeId !== "string"
        || (wordObj.nodeId.length >  MAX_DB_KEY_LENGTH)
        )) {

        console.log(chalkError("*** ILLEGAL RESPONSE ... SKIPPING" 
          + " | NODE ID LEN: " + wordObj.nodeId.length
          + " | TYPE: " + typeof wordObj.nodeId 
          + "\n" + jsonPrint(wordObj)
        ));


        statsObj.session.error += 1;
        statsObj.session.wordError += 1;
        statsObj.session.wordErrorType.NODE_ID_MAX = (statsObj.session.wordErrorType.NODE_ID_MAX === undefined) 
          ? 1 
          : statsObj.session.wordErrorType.NODE_ID_MAX + 1;

        rxWordQueueReady = true;
        return;
      }

      // var socketId = wordObj.socketId;
      var sessionId = wordObj.sessionId;

      sessionCache.get(sessionId, function(err, currentSessionObj){
        if (err){
          console.log(chalkError("*** ERROR SESSION CACHE GET " + sessionId + "\n" + jsonPrint(err)));
          if (configuration.quitOnError) { quit("ERROR SESSION CACHE GET"); }
          rxWordQueueReady = true;
        }
        else if (currentSessionObj === undefined) {

          console.log(chalkAlert("??? SESSION NOT IN CACHE ON RESPONSE Q READ" 
            + " | rxWordQueue: " + rxWordQueue.size() 
            + " | " + sessionId
            + " | ENTITY: " + wordObj.tags.entity
            + " | NODEID: " + wordObj.nodeId
            + "\n" + jsonPrint(wordObj)
          ));

          var unknownSession = {};
          unknownSession.sessionId = wordObj.sessionId;
          unknownSession.socketId = wordObj.socketId;
          unknownSession.userObj = {};
          unknownSession.userObj.name = wordObj.userId;
          unknownSession.userObj.tags = {};
          unknownSession.userObj.tags = wordObj.tags;
          unknownSession.userObj.userId = wordObj.tags.entity;
          unknownSession.userObj.url = wordObj.tags.url;
          unknownSession.userObj.profileImageUrl = null;
          unknownSession.userObj.screenName = wordObj.userId;
          unknownSession.userObj.namespace = "util";
          unknownSession.userObj.type = "util";
          unknownSession.userObj.mode = wordObj.tags.mode || "UNDEFINED";
          unknownSession.userObj.nodeId = wordObj.tags.entity + "_" + wordObj.tags.channel;
          unknownSession.wordObj = {};
          unknownSession.wordObj = wordObj;
          unknownSession.wordChainIndex = 0;
          unknownSession.wordChain = [];


          configEvents.emit("UNKNOWN_SESSION", unknownSession);
          rxWordQueueReady = true;
        }
        else {
          debug(chalkInfo("currentSessionObj\n" + jsonPrint(currentSessionObj)));

          wordObj.isTopTerm = wordObj.isTopTerm || false;
          wordObj.isKeyword = wordObj.isKeyword || false;
          wordObj.isTrendingTopic = wordObj.isTrendingTopic || false;

          trendingTopicsArray = trendingCache.keys();
          trendingTopicHitArray = [];

          async.each(trendingTopicsArray, function(topic, cb) {

            if (wordObj.nodeId.toLowerCase().includes(topic.toLowerCase())){

              var topicObj = trendingCache.get(topic);
              trendingTopicHitArray.push(topic);

              if (topicObj !== undefined){ // may have expired out of cache, so check
                console.log(chalkTwitter("TOPIC HIT: " + topic));
                topicObj.hit = true;
                trendingCache.set(topic, topicObj);
                topicHashMap.set(topic.toLowerCase(), true);
                wordObj.isTrendingTopic = true;
              }

              cb();

            }
            else {
              cb();
            }

          }, function(err) {

            if (err) { console.log(chalkError("ERROR: " + jsonPrint(err))); }

            debug(chalkBht(">>> RESPONSE (before replace): " + wordObj.nodeId));
            wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, " ");
            wordObj.nodeId = wordObj.nodeId.replace(/[\n\r\[\]{}<>\/;:"”’`~?!@#$%\^&*()_+=]+/g, "");
            wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, " ");
            wordObj.nodeId = wordObj.nodeId.replace(/^\s+|\s+$/g, "");
            wordObj.nodeId = wordObj.nodeId.replace(/^,+|,+$/g, "");
            wordObj.nodeId = wordObj.nodeId.replace(/^\.+|\.+$/g, "");
            wordObj.nodeId = wordObj.nodeId.replace(/^\-*|\-+$/g, "");
            wordObj.nodeId = wordObj.nodeId.toLowerCase();
            debug(chalkBht(">>> RESPONSE: " + wordObj.nodeId));

            if (wordObj.nodeId === "") {
              debug("EMPTY RESPONSE: " + wordObj.nodeId);
              rxWordQueueReady = true;
              return;
            }

            if (!wordObj.mentions) { wordObj.mentions = 1; }

            statsObj.socket.wordsReceived += 1;

            currentSessionObj.lastSeen = moment().valueOf();

            wordCache.get(wordObj.nodeId, function(err, wordCacheObj){
              if (err){
                console.log(chalkError(moment().format(compactDateTimeFormat) 
                  + " | ??? WORD CACHE ERROR ON RX WORD"
                  + " | " + err
                  + "\n" + jsonPrint(wordObj)
                ));
                rxWordQueueReady = true;
              }
              else if (wordCacheObj === undefined) { // RX WORD MISS

                if (currentSessionObj.sessionId === undefined) {
                  console.log(chalkError("UNDEFINED SESSION ID\n" + jsonPrint(currentSessionObj)));
                }
                wordObj.socketId = currentSessionObj.socketId;
                wordObj.sessionId = currentSessionObj.sessionId;
                wordObj.wordChainIndex = currentSessionObj.wordChainIndex;
                currentSessionObj.wordChain.push({nodeId: wordObj.nodeId, timeStamp:moment().valueOf()});
                currentSessionObj.wordChainIndex += 1;

                sessionCache.set(currentSessionObj.sessionId, currentSessionObj, function(err, success) {
                  dbUpdateWordQueue.enqueue(wordObj);
                  rxWordQueueReady = true;
                });

                // dbUpdateWord(wordObj, true, function(status, updatedWordObj) {
                //   rxWordQueueReady = true;
                // });
              }
              else { // RX WORD HIT
                wordCacheObj.socketId = currentSessionObj.socketId;
                wordCacheObj.sessionId = currentSessionObj.sessionId;
                wordCacheObj.mentions++;
                wordCacheObj.lastSeen = moment().valueOf();

                debug(chalkInfo(moment().format(compactDateTimeFormat) 
                  + " | RX WORD HIT"
                  + " | " + wordCacheObj.nodeId
                  + " | Ms: " + wordCacheObj.mentions
                  // + "\n" + jsonPrint(wordCacheObj)
                ));

                wordCacheObj.wordChainIndex = currentSessionObj.wordChainIndex;
                currentSessionObj.wordChain.push({nodeId: wordCacheObj.nodeId, timeStamp:moment().valueOf()});
                currentSessionObj.wordChainIndex += 1;

                sessionCache.set(currentSessionObj.sessionId, currentSessionObj, function(err, success) {
                  dbUpdateWordQueue.enqueue(wordCacheObj);
                  rxWordQueueReady = true;
                });

                // dbUpdateWord(wordCacheObj, true, function(status, updatedWordObj) {
                //   rxWordQueueReady = true;
                // });
              }
            });

          });
        }

      });

     }
  }, interval);
}

function keywordUpdateDb(updateObj, callback){

  debugKeyword(chalkAlert("keywordUpdateDb\n" + jsonPrint(updateObj)));
  // updateObj = {
  //  "keywordId": "obama",
  //  "positive": 10, 
  //  "left": 7
  // };

  var wordObj = new Word();

  wordObj.nodeId = updateObj.keywordId.toLowerCase();
  wordObj.isKeyword = true;
  wordObj.keywords[updateObj.keywordId.toLowerCase()] = updateObj;

  keywordHashMap.set(wordObj.nodeId, updateObj);
  // serverKeywordHashMap.set(wordObj.nodeId, updateObj);

  wordServer.findOneWord(wordObj, false, function(err, updatedWordObj) {
    if (err){
      console.log(chalkError("ERROR: UPDATING KEYWORD | " + wordObj.nodeId + "\n" + jsonPrint(wordObj)));
      callback(err, wordObj);
    }
    else {
      debugKeyword(chalkAlert("+ KEYWORD"
        + " | " + updatedWordObj.nodeId 
        + " | " + updatedWordObj.raw 
        + " | M " + updatedWordObj.mentions 
        + " | I " + updatedWordObj.isIgnored 
        + " | K " + updatedWordObj.isKeyword 
        + "\nK " + jsonPrint(updatedWordObj.keywords) 
      ));
      callback(null, updatedWordObj);
    }
  });
}

function sendDirectMessage(user, message, callback) {
  
  twit.post("direct_messages/new", {screen_name: user, text:message}, function(error, response){

    if(error) {
      debug(chalkError("!!!!! TWITTER SEND DIRECT MESSAGE ERROR: " 
        + moment().format(compactDateTimeFormat) 
        + "\nERROR\n"  + jsonPrint(error)
        + "\nRESPONSE\n"  + jsonPrint(response)
      ));
      callback(error, message) ;
    }
    else{
      debug(chalkTwitter(moment().format(compactDateTimeFormat) + " | SENT TWITTER DM TO " + user + ": " + response.text));
      callback(null, message) ;
    }

  });
}

function queryDb(queryObj, callback){
  console.log(chalkLog("QUERY | " + queryObj.query));

  var wordObj = new Word();

  wordObj.nodeId = queryObj.query.toLowerCase();
 
  wordServer.findOneWord(wordObj, false, function(err, queryWordObj) {
    if (err){
      console.log(chalkError("ERROR: QUERY\n" + jsonPrint(queryObj)));
      callback(err, wordObj);
    }
    else {
      console.log(chalkLog("... QUERY KEYWORD"
        + " | " + queryWordObj.nodeId 
        + " | " + queryWordObj.raw 
        + " | M " + queryWordObj.mentions 
        + " | I " + queryWordObj.isIgnored 
        + " | K " + queryWordObj.isKeyword 
        + " | K " + jsonPrint(queryWordObj.keywords) 
      ));
      callback(null, queryWordObj);
    }
  });
}

var sorterMessageRxReady = true; 

function initSorterMessageRxQueueInterval(interval){

  console.log(chalkInfo("INIT SORTER RX MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  sorterMessageRxQueueInterval = setInterval(function() {

    if (sorterMessageRxReady && !sorterMessageRxQueue.isEmpty()) {

      sorterMessageRxReady = false;

      var sorterObj = sorterMessageRxQueue.dequeue();

      switch (sorterObj.op){
        case "SORTED":
          console.log(chalkSorter("SORT ---------------------"));
          for (var i=0; i<sorterObj.sortedKeys.length; i += 1){
            if (wordMeter[sorterObj.sortedKeys[i]] !== undefined) {
              console.log(chalkSorter(wordMeter[sorterObj.sortedKeys[i]].toJSON()[sorterObj.sortKey].toFixed(3)
                + " | "  + sorterObj.sortedKeys[i] 
              ));
            }
          }

          var sortedKeys = sorterObj.sortedKeys;
          var endIndex = Math.min(maxTopTerms, sortedKeys.length);

          var index;
          var wmObj;
          var topTermDataPoint = {};
          var wordsPerMinuteTopTerm = {};

          for (index=0; index < endIndex; index += 1){

            var node = sortedKeys[index].toLowerCase();

            if (wordMeter[node] !== undefined) {

              wmObj = wordMeter[node].toJSON();

              wordsPerMinuteTopTermCache.set(node, wmObj["1MinuteRate"]);

              wordsPerMinuteTopTerm[node] = wmObj["1MinuteRate"];

              if (index === endIndex-1) {
                adminNameSpace.emit("TWITTER_TOPTERM_1MIN", wordsPerMinuteTopTerm);
                viewNameSpace.emit("TWITTER_TOPTERM_1MIN", wordsPerMinuteTopTerm);
              }

              if (enableGoogleMetrics && (wmObj["1MinuteRate"] > MIN_METRIC_VALUE)) {
     
                topTermDataPoint.displayName = node;
                topTermDataPoint.metricType = "word/top10/" + node;
                topTermDataPoint.value = wmObj["1MinuteRate"];
                topTermDataPoint.metricLabels = {server_id: "WORD"};

                addMetricDataPoint(topTermDataPoint);
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

var dbUpdaterMessageRxReady = true; 

function initDbUpdaterMessageRxQueueInterval(interval){

  console.log(chalkInfo("INIT DB UPDATER MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  dbUpdaterMessageRxQueueInterval = setInterval(function() {

    if (dbUpdaterMessageRxReady && !dbUpdaterMessageRxQueue.isEmpty()) {

      dbUpdaterMessageRxReady = false;

      var dbUpdaterObj = dbUpdaterMessageRxQueue.dequeue();

      switch (dbUpdaterObj.op){
        case "UPDATED":
          debug(chalkLog("DB UPDATED" 
            + " | " + dbUpdaterObj.updateType
            + " | " + dbUpdaterObj.word.sessionId
            + " | " + dbUpdaterObj.word.nodeId
            + " | Ms: " + dbUpdaterObj.word.mentions
            // + "\n" + jsonPrint(dbUpdaterObj)
          ));
          sendUpdated(dbUpdaterObj, function(err, results){
            dbUpdaterMessageRxReady = true; 
          });
        break;
        default:
          console.log(chalkError("??? DB UPDATER UNKNOWN TYPE\n" + jsonPrint(dbUpdaterObj)));
          dbUpdaterMessageRxReady = true; 
      }
    }
  }, interval);
}

var updaterMessageReady = true;

function initUpdaterMessageQueueInterval(interval){

  console.log(chalkInfo("INIT UPDATER MESSAGE QUEUE INTERVAL | " + interval + " MS"));
  
  updaterMessageQueueInterval = setInterval(function() {
    if (updaterMessageReady && !updaterMessageQueue.isEmpty()) {

      updaterMessageReady = false;

      var updaterObj = updaterMessageQueue.dequeue();

      switch (updaterObj.type){
        case "stats":
          console.log(chalkLog("UPDATE STATS COMPLETE"
            + " | DB\n" + jsonPrint(updaterObj.db)
          ));
          updaterMessageReady = true;
          statsCountsComplete = true;
          statsObj.db.totalAdmins = updaterObj.db.totalAdmins;
          statsObj.db.totalUsers = updaterObj.db.totalUsers;
          statsObj.db.totalViewers = updaterObj.db.totalViewers;
          statsObj.db.totalGroups = updaterObj.db.totalGroups;
          statsObj.db.totalSessions = updaterObj.db.totalSessions;
          statsObj.db.totalWords = updaterObj.db.totalWords;
        break;

        case "sendGroupsComplete":
          console.log(chalkLog("UPDATE GROUPS COMPLETE | " + moment().format(compactDateTimeFormat)));
          updaterMessageReady = true;
          groupsUpdateComplete = true;
        break;

        case "sendEntitiesComplete":
          console.log(chalkLog("UPDATE ENTITIES COMPLETE | " + moment().format(compactDateTimeFormat)));
          updaterMessageReady = true;
          entitiesUpdateComplete = true;
        break;

        case "sendKeywordsComplete":
          console.log(chalkLog("UPDATE KEYWORDS COMPLETE | " + moment().format(compactDateTimeFormat)));
          updaterMessageReady = true;
          keywordsUpdateComplete = true;
        break;

        case "group":

          if ((updaterObj.target !== undefined) && (updaterObj.target === "server")) {
            console.log(chalkLog("UPDATER GROUP\n" + jsonPrint(updaterObj)));
            serverGroupHashMap.set(updaterObj.groupId, updaterObj.group);
            serverGroupsJsonObj[updaterObj.groupId] = updaterObj.group;
          }
          else {
            groupHashMap.set(updaterObj.groupId, updaterObj.group);
          }

          debug(chalkLog("UPDATE GROUP\n" + jsonPrint(updaterObj)));
          debug(chalkLog("UPDATE GROUP | " + updaterObj.groupId));
          updaterMessageReady = true;
        break;

        case "entity":
          entityChannelGroupHashMap.set(updaterObj.entityId.toLowerCase(), updaterObj.entity);
          debug(chalkLog("UPDATE ENTITIY\n" + jsonPrint(updaterObj)));
          debug(chalkLog("UPDATE ENTITIY | " + updaterObj.entityId));
          updaterMessageReady = true;
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

          // updaterObj = {
          //  "type" : "keyword",
          //  "target" : "server",
          //  "keyword: {
          //    "keywordId": obama",
          //    "positive": 10, 
          //    "left": 7
          //   }
          // };

          debugKeyword(chalkLog("KEYWORD: " + jsonPrint(updaterObj)));
          debugKeyword(chalkLog("UPDATE KEYWORD\n" + jsonPrint(updaterObj.keyword)));
          keywordHashMap.set(updaterObj.keyword.keywordId, updaterObj.keyword);

          keywordUpdateDb(updaterObj.keyword, function(err, updatedWordObj){
            if (err) { console.log(chalkError("KEYWORD UPDATE ERR\n" + jsonPrint(err))); }
            if (updaterObj.twitter) {
              var dmString = "KEYWORD"
                + " | " + hostname 
                + "\n" + updatedWordObj.nodeId 
                + "\n" + updatedWordObj.mentions + " Ms" 
                + "\n" + jsonPrint(updatedWordObj.keyword);

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
            }
          });
          
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

      updateComplete = groupsUpdateComplete && entitiesUpdateComplete && keywordsUpdateComplete;
    }
  }, interval);
}

var dbUpdateGroupReady = true; 

function initDbUpdateGroupQueueInterval(interval){

  console.log(chalkInfo("INIT DB UPDATE GROUP QUEUE INTERVAL | " + interval + " MS"));

  dbUpdateGroupQueueInterval = setInterval(function() {

    if (dbUpdateGroupReady && !dbUpdateGroupQueue.isEmpty()) {

      dbUpdateGroupReady = false;

      var groupObj = dbUpdateGroupQueue.dequeue();

      dbUpdateGroup(groupObj, true, function(status, updatedGroupObj) {

        debug(chalkInfo("DB UPDATE GROUP STATUS\n" + jsonPrint(status)));

        groupCache.set(updatedGroupObj.groupId, updatedGroupObj, function(err, success) {
          if (!err && success) {

            dbUpdateGroupReady = true;

          } else {
            debug(chalkError("*** GROUP CACHE SET ERROR" + "\n" + jsonPrint(err)));

            dbUpdateGroupReady = true;
          }
        });

      });
    }
  }, interval);
}

var dbUpdateEntityReady = true; 

function initDbUpdateEntityQueueInterval(interval){

  console.log(chalkInfo("INIT DB UPDATE ENTITY QUEUE INTERVAL | " + interval + " MS"));

  dbUpdateEntityQueueInterval = setInterval(function() {

    if (dbUpdateEntityReady && !dbUpdateEntityQueue.isEmpty()) {

      dbUpdateEntityReady = false;

      var entityObj = dbUpdateEntityQueue.dequeue();

      dbUpdateEntity(entityObj, true, function(status, updatedEntityObj) {

        debug(chalkInfo("dbUpdateEntity status\n" + jsonPrint(status)));

        entityCache.set(updatedEntityObj.entityId, updatedEntityObj, function(err, success) {
          if (!err && success) {
            dbUpdateEntityReady = true;
          } 
          else {
            debug(chalkError("*** ENTITY CACHE SET ERROR" + "\n" + jsonPrint(err)));
            dbUpdateEntityReady = true;
          }
        });

      });
    }
  }, interval);
}

var dbUpdateWordReady = true;

function initDbUpdateWordQueueInterval(interval){

  console.log(chalkInfo("INIT DB UPDATE ENTITY QUEUE INTERVAL | " + interval + " MS"));

  dbUpdateWordQueueInterval = setInterval(function() {

    if (dbUpdateWordReady && !dbUpdateWordQueue.isEmpty()) {

      dbUpdateWordReady = false;

      var wordObj = dbUpdateWordQueue.dequeue();

      dbUpdateWord(wordObj, true, function(status, updatedWordObj) {
        debug(chalkDb("DB WORD"
          + " | Q: " + dbUpdateWordQueue.size()
          + " | " + updatedWordObj.nodeId
        ));
        dbUpdateWordReady = true;
        // quit();
      });

    }
  }, interval);
}

function initInternetCheckInterval(interval, callback){

  console.log(chalkInfo("... INIT INTERNET CHECK INTERVAL | " + interval + " MS"));

  var serverStatus;
  var serverError;
  var callbackInterval;

  clearInterval(internetCheckInterval)
  internetCheckInterval = setInterval(function(){
    var testClient = net.createConnection(80, "www.google.com");

    testClient.on("connect", function() {
      statsObj.socket.connects += 1;
      console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | CONNECTED TO GOOGLE: OK"));
      debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SEND SERVER_READY"));
      internetReady = true;
      configEvents.emit("SERVER_READY");
      testClient.destroy();
      serverStatus = "SERVER_READY";
      clearInterval(internetCheckInterval);
      // callback(null, "SERVER_READY");
    });

    testClient.on("error", function(err) {
      statsObj.socket.errors += 1;
      console.log(chalkError(moment().format(compactDateTimeFormat) + " | **** GOOGLE CONNECT ERROR ****\n" + err));
      debug(chalkError(moment().format(compactDateTimeFormat) + " | **** SERVER_NOT_READY ****"));
      internetReady = false;
      testClient.destroy();
      configEvents.emit("SERVER_NOT_READY");
      serverError = err;
      serverStatus = "SERVER_NOT_READY";
      // callback(err, null);
    });
  }, interval);

  callbackInterval = setInterval(function(){
    if (serverStatus || serverError) {
      console.log(chalkAlert("RETURN INIT INTERNET CHECK INTERVAL"
        + " | ERROR: "  + serverError
        + " | STATUS: " + serverStatus
      ));
      clearInterval(callbackInterval);
      callback(serverError, serverStatus);
    }
  }, interval);
}

//=================================
// INIT APP ROUTING
//=================================

// app.use(express.static('public'));

function initAppRouting(callback) {

  debugAppGet(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT APP ROUTING"));

  app.get("/js/require.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/require.js"));
    res.sendFile(__dirname + "/js/require.js", function (err) {
      if (err) {
        console.log(chalkAlert('GET:', __dirname + "/js/require.js"));
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/require.js"));
      }
    });
  });

  app.get("/session.js", function(req, res) {
    // console.log(chalkInfo("get req\n" + req));
    console.log("LOADING FILE: /session.js");

    fs.readFile(__dirname + "/session.js", function(error, data) {

      if (error) { 
        console.log(chalkError("ERROR FILE OPEN\n" + jsonPrint(error)));
      }

      var newData;
      if (hostname.includes("google")){
        newData = data.toString().replace("==SOURCE==", "http://word.threeceelabs.com");
      }
      else {
        newData = data.toString().replace("==SOURCE==", "http://localhost:9997");
      }
      res.send(newData);
      res.end();
    });
  });

  app.get("/", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /sessionModular.html"));
    res.sendFile(__dirname + "/sessionModular.html", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/sessionModular.html");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/sessionModular.html"));
      }
    });
  });

  app.get("/session", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /sessionModular.html"));
    res.sendFile(__dirname + "/sessionModular.html", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/sessionModular.html");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/sessionModular.html"));
      }
    });
  });

  app.get("/js/libs/sessionViewTicker.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewTicker.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewTicker.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewTicker.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewTicker.js"));
      }
    });
  });

  app.get("/js/libs/sessionViewFlow.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewFlow.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewFlow.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewFlow.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewFlow.js"));
      }
    });
  });

  app.get("/js/libs/sessionViewTreemap.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewTreemap.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewTreemap.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewTreemap.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewTreemap.js"));
      }
    });
  });

  app.get("/js/libs/sessionViewTreepack.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewTreepack.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewTreepack.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewTreepack.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewTreepack.js"));
      }
    });
  });

  app.get("/js/libs/sessionViewHistogram.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewHistogram.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewHistogram.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewHistogram.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewHistogram.js"));
      }
    });
  });

  app.get("/js/libs/sessionViewMedia.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewMedia.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewMedia.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewMedia.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewMedia.js"));
      }
    });
  });

  app.get("/js/libs/sessionViewForce.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionViewForce.js"));
    res.sendFile(__dirname + "/js/libs/sessionViewForce.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionViewForce.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionViewForce.js"));
      }
    });
  });

  app.get("/js/libs/sessionView.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /js/libs/sessionView.js"));
    res.sendFile(__dirname + "/js/libs/sessionView.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/sessionView.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/sessionView.js"));
      }
    });
  });

  app.get("/node_modules/panzoom/dist/panzoom.min.js", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /node_modules/panzoom/dist/panzoom.min.js"));
    res.sendFile(__dirname + "/node_modules/panzoom/dist/panzoom.min.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/node_modules/panzoom/dist/panzoom.min.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/node_modules/panzoom/dist/panzoom.min.js"));
      }
    });
  });

  app.get("/css/base.css", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /css/base.css"));
    res.sendFile(__dirname + "/css/base.css", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/css/base.css");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/css/base.css"));
      }
    });
  });

  app.get("/css/main.css", function(req, res, next) {
    console.log(chalkRedBold("LOADING PAGE: /css/main.css"));
    res.sendFile(__dirname + "/css/main.css", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/css/main.css");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/css/main.css"));
      }
    });
  });

  app.get("/favicon.png", function(req, res, next) {
    console.log(chalkRedBold("LOADING PAGE: /favicon.png"));
    res.sendFile(__dirname + "/favicon.png", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/favicon.png");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/favicon.png"));
      }
    });
  });

  app.get("/favicon.ico", function(req, res, next) {
    console.log(chalkRedBold("LOADING PAGE: /favicon.ico (alias favicon.png)"));
    res.sendFile(__dirname + "/favicon.png", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/favicon.png");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/favicon.png"));
      }
    });
  });

  app.get("/assets/images/userBackgroundBorder.png", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /public/assets/images/userBackgroundBorder.png"));
    res.sendFile(__dirname + "/public/assets/images/userBackgroundBorder.png", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/public/assets/images/userBackgroundBorder.png");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/public/assets/images/userBackgroundBorder.png"));
      }
    });
  });

  app.get("/assets/images/mediaBackgroundBorder.png", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /public/assets/images/mediaBackgroundBorder.png"));
    res.sendFile(__dirname + "/public/assets/images/mediaBackgroundBorder.png", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/public/assets/images/mediaBackgroundBorder.png");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/public/assets/images/mediaBackgroundBorder.png"));
      }
    });
  });

  app.get("/controlPanel.html", function(req, res, next) {
    // console.log(chalkRedBold("get req\n" + jsonPrint(req.params)));
    console.log(chalkRedBold("LOADING PAGE: /controlPanel.html"));
    res.sendFile(__dirname + "/controlPanel.html", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/controlPanel.html");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/controlPanel.html"));
      }
    });
  });

  app.get("/js/libs/controlPanel.js", function(req, res) {
    console.log("LOADING PAGE: /js/libs/controlPanel.js");

    fs.open(__dirname + "/js/libs/controlPanel.js", "r", function(error, fd) {

      if (error) { debug(chalkInfo("ERROR FILE OPEN\n" + jsonPrint(error))); }

      fs.readFile(__dirname + "/js/libs/controlPanel.js", function(error, data) {

        if (error) { debug(chalkInfo("ERROR FILE READ\n" + jsonPrint(error))); }

        var newData;
        if (hostname.includes("google")){
          newData = data.toString().replace("==SOURCE==", "http://word.threeceelabs.com");
          console.log(chalkRed("UPDATE DEFAULT_SOURCE controlPanel.js: " + "http://word.threeceelabs.com"));
        }
        else {
          newData = data.toString().replace("==SOURCE==", "http://localhost:9997");
          console.log(chalkRed("UPDATE DEFAULT_SOURCE controlPanel.js: " + "http://localhost:9997"));
        }
        res.send(newData);
        res.end();
        fs.close(fd);
      });
    });
    
    return;
  });

  app.get("/admin", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log(chalkInfo("LOADING PAGE: /admin/admin.html"));
    res.sendFile(__dirname + "/admin/admin.html", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/admin/admin.html");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/admin/admin.html"));
      }
    });
  });

  app.get("/admin/admin.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log(chalkInfo("LOADING PAGE: /admin/admin.js"));
    res.sendFile(__dirname + "/admin/admin.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/admin/admin.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/admin/admin.js"));
      }
    });
  });

  app.get("/js/libs/progressbar.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/js/libs/progressbar.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/progressbar.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/progressbar.js"));
      }
    });
  });

  app.get("/js/libs/progressbar.min.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/js/libs/progressbar.min.js", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/js/libs/progressbar.min.js");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/js/libs/progressbar.min.js"));
      }
    });
  });

  app.get("/css/progressbar.css", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/css/progressbar.css", function (err) {
      if (err) {
        console.error('GET:', __dirname + "/css/progressbar.css");
      } 
      else {
        console.log(chalkInfo('SENT:', __dirname + "/css/progressbar.css"));
      }
    });
  });

  configEvents.emit("INIT_APP_ROUTING_COMPLETE");
  callback(null, "INIT_APP_ROUTING_COMPLETE");
}


function initializeConfiguration(cnf, callback) {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | initializeConfiguration ..."));

  var commandArgs = Object.keys(commandLineConfig);

  commandArgs.forEach(function(arg){
    cnf[arg] = commandLineConfig[arg];
    console.log("--> COMMAND LINE CONFIG | " + arg + ": " + cnf[arg]);
  });

  // cnf.enableStdin = cnf.enableStdin || process.env.WA_ENABLE_STDIN ;

  var configArgs = Object.keys(cnf);
  configArgs.forEach(function(arg){
    console.log("FINAL CONFIG | " + arg + ": " + cnf[arg]);
  });

  if (cnf.quitOnError) { 
    // quitOnErrorFlag = true;
    console.log(chalkAlert("===== QUIT ON ERROR SET ====="));
  }

  if (cnf.enableStdin){

    console.log("STDIN ENABLED");

    stdin = process.stdin;
    if (stdin.setRawMode !== undefined) { stdin.setRawMode(true); }
    stdin.resume();
    stdin.setEncoding( "utf8" );
    stdin.on( "data", function( key ){

      switch (key) {
        case "\u0003":
          process.exit();
        break;
        case "q":
          quit("STDIN");
        break;
        case "Q":
          quit("STDIN");
        break;
        case "s":
          showStats();
        break;
        case "S":
          showStats(true);
        break;
        default:
          console.log(
            "\n" + "q/Q: quit"
            + "\n" + "s: showStats"
            + "\n" + "S: showStats verbose"
          );
      }
    });
  }

  async.series([
      // DATABASE INIT
      function(callbackSeries) {
        debug(chalkInfo(moment().format(compactDateTimeFormat) + " | START DATABASE INIT"));

        async.parallel(
          [
            
            function(callbackParallel) {
              debug(chalkInfo(moment().format(compactDateTimeFormat) + " | GROUP HASHMAP INIT"));
              groupFindAllDb(null, function(err, numberOfGroups) {
                if (err){
                  console.log(chalkError(moment().format(compactDateTimeFormat) 
                    + " | *** groupFindAllDb ERROR: " + err));
                  callbackParallel();
                }
                else {
                  console.log(chalkInfo(moment().format(compactDateTimeFormat) 
                    + " | GROUPS IN DB: " + numberOfGroups));
                  callbackParallel();
                }
               });
            },
            
            function(callbackParallel) {
              debug(chalkInfo(moment().format(compactDateTimeFormat) + " | ENTITIY HASHMAP INIT"));
              entityFindAllDb(null, function(err, numberOfEntities) {
                if (err){
                  console.log(chalkError(moment().format(compactDateTimeFormat) 
                    + " | *** entityFindAllDb ERROR: " + err));
                  callbackParallel();
                }
                else {
                  console.log(chalkInfo(moment().format(compactDateTimeFormat) 
                    + " | ENTITIES IN DB: " + numberOfEntities));
                  callbackParallel();
                }
               });
            }
            
          ],
          function(err, results) { //async.parallel callback
            if (err) {
              console.log(chalkError("\n" + moment().format(compactDateTimeFormat) 
                + "!!! DATABASE INIT ERROR: " + err));
              callbackSeries(err, null);
            } 
            else {
              debug(chalkInfo(moment().format(compactDateTimeFormat) + " | DATABASE INIT COMPLETE"
               + "\n" + jsonPrint(results)
              ));
              configEvents.emit("INIT_DATABASE_COMPLETE", moment().format(compactDateTimeFormat));
              callbackSeries(null, "INIT_DATABASE_COMPLETE");
            }
          }
        ); // async.parallel
      },

      // APP ROUTING INIT
      function(callbackSeries) {
        debug(chalkInfo(moment().format(compactDateTimeFormat) + " | APP ROUTING INIT"));
        initAppRouting(function(err, results) {
          callbackSeries(err, results);
        });
      },

      // CONFIG EVENT
      function(callbackSeries) {
        debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT CONFIG COMPLETE"));
        var sConfig = {
          configOrigin: "SERVER",
          testMode: testMode
        };
        debug("SESSION CONFIGURATION\n" + JSON.stringify(sConfig, null, 3) + "\n");
        callbackSeries(null, sConfig);
      },

      // SERVER READY
      function(callbackSeries) {

        if (OFFLINE_MODE) {
          console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | OFFLINE MODE ... SKIPPING SERVER READY"));
          console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | SEND SERVER_NOT_READY"));
          internetReady = true;
          configEvents.emit("SERVER_READY");
          callbackSeries(null, "SERVER_READY");
          return;
        }

        console.log(chalkInfo("... START INTERNET CONNECTION CHECK INTERVAL TO GOOGLE.COM ..."));

        initSocketNamespaces(function(){
          initInternetCheckInterval(10*ONE_SECOND, function(err, status){
            callbackSeries(err, status);
          });
        });

      },

      // TWIT FOR DM INIT
      function(callbackSeries) {

        loadYamlConfig(twitterYamlConfigFile, function(err, twitterConfig){
          if (err) {
            console.log(chalkError("*** LOADED TWITTER YAML CONFIG ERROR: FILE:  " + twitterYamlConfigFile));
            console.log(chalkError("*** LOADED TWITTER YAML CONFIG ERROR: ERROR: " + err));
            callbackSeries(null, "INIT_TWIT_FOR_DM_ERROR");
          }
          else {
            console.log(chalkTwitter("LOADED TWITTER YAML CONFIG\n" + jsonPrint(twitterConfig)));

            twit = new Twit({
              consumer_key: twitterConfig.CONSUMER_KEY,
              consumer_secret: twitterConfig.CONSUMER_SECRET,
              access_token: twitterConfig.TOKEN,
              access_token_secret: twitterConfig.TOKEN_SECRET
            });

            twitterStream = twit.stream("user");

            twitterStream.on("follow", function(followEvent){

              debug(chalkTwitter("FOLLOW EVENT\n" + jsonPrint(followEvent)));

              var entityObj = new Entity();

              entityObj.entityId = followEvent.target.screen_name.toLowerCase();
              entityObj.name = followEvent.target.name;
              entityObj.userId = followEvent.target.screen_name.toLowerCase();
              entityObj.groupId = entityObj.entityId;
              entityObj.screenName = entityObj.entityId;
              entityObj.url = followEvent.target.url;
              entityObj.tags = {};
              entityObj.tags.entity = entityObj.entityId;
              entityObj.tags.channel = "twitter";
              entityObj.tags.mode = "substream";
              entityObj.tags.group = "";

              entityUpdateDb(entityObj, function(err, updatedEntityObj){
                if (err){
                  console.log(chalkError("ENTITY UPDATE DB ERROR: " + err));
                }
              });
            });

            twitterStream.on("direct_message", function (message) {

              console.log(chalkTwitter("R< TWITTER DIRECT MESSAGE"
                + " | " + message.direct_message.sender_screen_name
                + " | " + message.direct_message.entities.hashtags.length + " Hs"
                + " | " + message.direct_message.text
                // + "\nMESSAGE\n" + jsonPrint(message)
              ));

              if (message.direct_message.sender_screen_name === "threecee" 
                || message.direct_message.sender_screen_name === "ninjathreecee") {

                if (message.direct_message.entities.hashtags.length > 0) {

                  var hashtags = message.direct_message.entities.hashtags;

                  var op = hashtags[0].text;
                  var keyWordType;
                  var kwt;
                  var keyword;
                  var updateObj = {};
                  var query;

                  switch (op) {
                    case "k":
                    case "key":
                      if (hashtags.length === 3) {
                        kwt = hashtags[1].text.toLowerCase();
                        keyword = hashtags[2].text.toLowerCase();

                        switch(kwt) {
                          case "p":
                          case "pos":
                          case "positive":
                            keyWordType = "positive";
                          break;
                          case "n":
                          case "neg":
                          case "negative":
                            keyWordType = "negative";
                          break;
                          case "o":
                          case "neu":
                          case "neutral":
                            keyWordType = "neutral";
                          break;
                          case "l":
                          case "left":
                            keyWordType = "left";
                          break;
                          case "r":
                          case "right":
                            keyWordType = "right";
                          break;
                          default:
                            keyWordType = kwt;
                            console.log(chalkWarn("??? UNKNOWN KEYWORD TYPE: " + kwt));
                        }

                       // updateObj = {
                        //  "type" : "keyword",
                        //  "target" : "server",
                        //  "keyword: { 
                        //    "keywordId": "obama",
                        //    "positive": 10, 
                        //    "left": 7
                        //  }
                        // };

                        updateObj.type = "keyword";
                        updateObj.target = "twitter";
                        updateObj.keyword = {};
                        updateObj.keyword.keywordId = keyword; 
                        updateObj.keyword[keyWordType] = DEFAULT_KEYWORD_VALUE; 

                        updaterMessageQueue.enqueue(updateObj);
                        console.log(chalkTwitter("ADD KEYWORD"
                          + " [" + updaterMessageQueue.size() + "]"
                          + "\n" + jsonPrint(updateObj) 
                        ));
                      }
                      break;
                    case "q":
                    case "query":
                      if (hashtags.length === 2) {
                        query = hashtags[1].text.toLowerCase();
                        console.log(chalkTwitter("QUERY: " + query));
                        updaterMessageQueue.enqueue({ twitter: true, type: "query", query: query});
                      }
                      break;
                    default:
                      console.log(chalkTwitter("??? UNKNOWN DM OP: " + op));
                  }
                }
              }
              else {
                console.log(chalkAlert("UNKNOWN TWITTER DM SENDER: " + message.direct_message.sender_screen_name));
              }
            });

            twit.get("account/settings", function(err, data, response) {

              debug(chalkInfo("twit account/settings response\n" + jsonPrint(response)));

              if (err){
                console.log("!!!!! TWITTER ACCOUNT ERROR | " + moment().format(compactDateTimeFormat) + "\n" + jsonPrint(err));
                callbackSeries(null, "INIT_TWIT_FOR_DM_ERROR");
              }
              else {
                console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | TWITTER ACCOUNT: " + data.screen_name));
                console.log(chalkTwitter("TWITTER ACCOUNT SETTINGS\n" 
                  + jsonPrint(data)));

                twit.get("application/rate_limit_status", function(err, data, response) {

                  debug(chalkInfo("twit application/rate_limit_status response\n" + jsonPrint(response)));

                  if (err){
                    console.log("!!!!! TWITTER ACCOUNT ERROR | " + moment().format(compactDateTimeFormat) 
                      + "\n" + jsonPrint(err));
                    callbackSeries(null, "INIT_TWIT_FOR_DM_ERROR");
                  }
                  else{
                    debug(chalkInfo("twit application/rate_limit_status data\n" + jsonPrint(data)));
                    callbackSeries(null, "INIT_TWIT_FOR_DM_COMPLETE");
                    configEvents.emit("INIT_TWIT_FOR_DM_COMPLETE");
                  }
                });
              }
            });

            twitterStream.on("error", function(err){
              console.log(chalkError("*** TWITTER ERROR\n" + jsonPrint(err)));
            });
          }
        });
      }
    ],
    function(err, results) {

      if (err) {
        console.log(chalkError("\n*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err) + "\n"));
        callback(err, null);
      } else {
        debug(chalkLog("\nINITIALIZE CONFIGURATION RESULTS\n" + jsonPrint(results) + "\n"));
        callback(null, results);
      }
    });
}

function wapiSearch(word, variation, callback){

  if (wapiOverLimitFlag 
    || (statsObj.wapi.requestsRemaining < wapiReqReservePercent * statsObj.wapi.requestLimit)) {
    if (!wapiOverLimitFlag) {
      wapiOverLimitFlag = true;
      wapiEvents.emit("WAPI_OVER_LIMIT", wapiRequests);
    }
    return(callback(
      {
        err: "WAPI_OVER_LIMIT", 
        totalRequests: statsObj.wapi.totalRequests, 
        requestsRemaining: statsObj.wapi.requestsRemaining, 
        requestLimit: statsObj.wapi.requestLimit
      }
    ));
  }

  var wapiUrl;

  if (variation === "ALL"){
    wapiUrl = wapiUrlRoot + word.toLowerCase();
  }
  else {
    wapiUrl = wapiUrlRoot + word.toLowerCase() + "/" + variation;
  }

  unirest.get(wapiUrl)
  .header("X-Mashape-Key", wordsApiKey)
  .header("Accept", "application/json")
  .end(function (response) {

    debugWapi(chalkWapi("WAPI RESPONSE\n" + jsonPrint(response.headers)));

    if (response.headers !== undefined){
      if (response.headers["x-ratelimit-requests-limit"] !== undefined){
        statsObj.wapi.requestLimit = parseInt(response.headers["x-ratelimit-requests-limit"]);
        statsObj.wapi.requestsRemaining = parseInt(response.headers["x-ratelimit-requests-remaining"]);
        if (statsObj.wapi.requestsRemaining > 0) {
          statsObj.wapi.totalRequests = statsObj.wapi.requestLimit - statsObj.wapi.requestsRemaining;
        }
        else {
          statsObj.wapi.totalRequests = statsObj.wapi.requestLimit + statsObj.wapi.requestsRemaining;
        }
      }
    }

    if (statsObj.wapi.requestsRemaining < wapiReqReservePercent * statsObj.wapi.requestLimit) {
      return(callback({
        err: "WAPI_OVER_LIMIT", 
        totalRequests: statsObj.wapi.totalRequests, 
        requestsRemaining: statsObj.wapi.requestsRemaining,
        requestLimit: statsObj.wapi.requestLimit
      }));
    }

    var results = {};

    if (response.statusCode === 404){
      results.word = word;
      results.variation = variation;
      results.wapiSearched = true;
      results.wapiFound = false;

      debugWapi(chalkWapi("WAPI"
        + " [ " + statsObj.wapi.totalRequests 
        + " / " + statsObj.wapi.requestLimit 
        // + " | " + (100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit)).toFixed(2) + "% ]"
      ));
      callback(results);
    }
    else {
      results.word = word;
      results.body = response.body;
      results.variation = variation;
      results.wapiSearched = true;
      results.wapiFound = true;

      debugWapi(chalkWapi("WAPI"
        + " [ " + statsObj.wapi.totalRequests 
        + " / " + statsObj.wapi.requestLimit 
        // + " | " + (100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit)).toFixed(2) + "% ]"
      ));
      callback(results);
    }
  });
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

function updateGroupEntity(entityObj, callback){

  debug("updateGroupEntity\n" + jsonPrint(entityObj));

  groupUpdateDb(entityObj, function(err, updatedEntityObj){
    if (err){
      console.log(chalkError("GROUP UPDATE DB ERROR: " + err));
      callback(err, entityObj);
    }
    else {

      debug("updateGroupEntity updatedEntityObj\n" + jsonPrint(updatedEntityObj));

      if (updatedEntityObj.tags === undefined){
        updatedEntityObj.tags = {};
        updatedEntityObj.tags.entity = entityObj.entityId;
        updatedEntityObj.tags.name = entityObj.name;
      }
      else if (updatedEntityObj.tags.entity === undefined){
        console.log(chalkError("ENTITY TAG UNDEFINED\n" + jsonPrint(updatedEntityObj.tags)
        ));
      }

      entityUpdateDb(updatedEntityObj, function(err, updatedEntity2Obj){
        if (err){
          console.log(chalkError("ENTITY UPDATE DB ERROR: " + err));
          callback(err, updatedEntityObj);
        }
        else {
          // console.log(chalkInfo("TX UTIL SES (UTIL RDY): " + updatedEntity2Obj.lastSession + " TO ADMIN NAMESPACE"));
          // adminNameSpace.emit("UTIL_SESSION", updatedEntity2Obj);
          callback(null, updatedEntity2Obj);
        }
      });

    }

  });
}

var followerUpdateQueueReady = true;

function initUpdateTrendsInterval(interval){
  clearInterval(updateTrendsInterval);
  updateTrendsInterval = setInterval(function () {
    updateTrends();
  }, interval);
}

// ==================================================================
// CONNECT TO INTERNET, START SERVER HEARTBEAT
// ==================================================================

configEvents.on("TWITTER_FOLLOW", function(entityObj){

  console.log(chalkTwitter("TWITTER FOLLOW"
    + " | " + entityObj.screenName
    + " | " + entityObj.name
    // + "\n" + jsonPrint(entityObj)
  ));

});

configEvents.on("INIT_TWIT_FOR_DM_COMPLETE", function() {

  var dmString = hostname 
    + "\nSTARTED wordAssoServer"
    + "\n" + moment().format(compactDateTimeFormat)
    + "\nPID: " + process.pid
    + "\n" + "http://threeceemedia.com";

  sendDirectMessage("threecee", dmString, function(err, res){
    if (!err) {
      console.log(chalkTwitter("SENT TWITTER DM: " + dmString));
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
});

var directMessageHash = {};
var createUnknownSessionFlag = true;

configEvents.on("UNKNOWN_SESSION", function(sesObj) {

  if (createUnknownSessionFlag) {

    sessionCache.set(sesObj.sessionId, sesObj, function(err, results){
      userReadyHandler({socketId: sesObj.socketId, sessionId: sesObj.sessionId, userObj: sesObj.userObj}, function(err, sObj){
        if (err) {
          if (configuration.quitOnError) { quit("userReadyHandler UNKNOWN_SESSION"); }
        }
        else {
          rxWordQueue.enqueue(sesObj.wordObj);
        }
      });
    });

  }

  if (dmOnUnknownSession) {
    var dmString = hostname + "\nwordAssoServer\nPID: " + process.pid + "\nUNKNOWN SESSION: " + socketId;

    if (directMessageHash[socketId] === undefined) {

      directMessageHash[socketId] = socketId;

      sendDirectMessage("threecee", dmString, function(err, res){
        if (!err) {
          console.log(chalkTwitter("SENT TWITTER DM\n" + dmString + "\n" + jsonPrint(res)));
          debug(chalkInfo("SEND DM RES\n" + jsonPrint(res)));
        }
        else {
          console.log(chalkError("DM SEND ERROR:" + err));
        }
      });
    }
    else {
      console.log(chalkError("SKIP DM ... PREV SENT UNKNOWN_SESSION | " + socketId));
    }
  }
});


configEvents.on("HASH_MISS", function(missObj) {

  debug(chalkError("CONFIG EVENT - HASH_MISS\n" + jsonPrint(missObj)));

  var dmString = hostname
  + " | wordAssoServer"
  + "\nMISS " + missObj.type.toUpperCase()
  + " @" + missObj.value;

  var sendDirectMessageHashKey = missObj.type + "-" + missObj.value;

  if (!twitterDMenabled){
    debug(chalkTwitter("... SKIP TWITTER DM\n" + dmString));
  }
  else if (directMessageHash[sendDirectMessageHashKey] === undefined) {
    directMessageHash[sendDirectMessageHashKey] = missObj;
    sendDirectMessage("threecee", dmString, function(err, res){
      if (!err) {
        console.log(chalkTwitter("SENT TWITTER DM\n" + dmString + "\n" + jsonPrint(res)));
        debug(chalkInfo("SEND DM RES\n" + jsonPrint(res)));
      }
      else if (err.code === 226) {
        console.log(chalkError("DM SEND ERROR: AUTOMATED TX"));
      }
      else {
        console.log(chalkError("DM SEND ERROR: " + err));
      }
    });
  }
  else {
    console.log(chalkError("SKIP DM ... PREV SENT | " + missObj.type + " | " + sendDirectMessageHashKey));
  }
});

configEvents.on("SERVER_READY", function() {

  // serverReady = true;

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SERVER_READY EVENT"));

  httpServer.on("reconnect", function() {
    internetReady = true;
    console.log(chalkConnect(moment().format(compactDateTimeFormat) + " | PORT RECONNECT: " + config.port));
  });

  httpServer.on("connect", function() {
    statsObj.socket.connects += 1;
    internetReady = true;
    console.log(chalkConnect(moment().format(compactDateTimeFormat) + " | PORT CONNECT: " + config.port));

    httpServer.on("disconnect", function() {
      internetReady = false;
      console.log(chalkError("\n***** PORT DISCONNECTED | " + moment().format(compactDateTimeFormat) 
        + " | " + config.port));
    });
  });

  httpServer.listen(config.port, function() {
    console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | LISTENING ON PORT " + config.port));
  });

  httpServer.on("error", function(err) {
    statsObj.socket.errors += 1;
    internetReady = false;
    console.log(chalkError("??? HTTP ERROR | " + moment().format(compactDateTimeFormat) + "\n" + err));
    if (err.code === "EADDRINUSE") {
      console.log(chalkError("??? HTTP ADDRESS IN USE: " + config.port + " ... RETRYING..."));
      setTimeout(function() {
        httpServer.listen(config.port, function() {
          debug("LISTENING ON PORT " + config.port);
        });
      }, 5000);
    }
  });


  //----------------------
  //  SERVER HEARTBEAT
  //----------------------

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

    statsObj.queues.sessionQueue = sessionQueue.size();
    statsObj.queues.dbUpdateWordQueue = dbUpdateWordQueue.size();
    statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
    statsObj.queues.dbUpdateEntityQueue = dbUpdateEntityQueue.size();
    statsObj.queues.updateSessionViewQueue = updateSessionViewQueue.length;

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
        console.log(chalkError("!!!! INTERNET DOWN?? !!!!! " 
          + moment().format(compactDateTimeFormat)
          + " | INTERNET READY: " + internetReady
          + " | I/O READY: " + ioReady
        ));
      }
    }
  }, 1000);

  configEvents.emit("CONFIG_CHANGE", serverSessionConfig);
});

// ==================================================================
// CONFIGURATION CHANGE HANDLER
// ==================================================================
configEvents.on("CONFIG_CHANGE", function(serverSessionConfig) {

  debug(chalkAlert(moment().format(compactDateTimeFormat) + " | CONFIG_CHANGE EVENT"));
  debug("==> CONFIG_CHANGE EVENT: " + JSON.stringify(serverSessionConfig, null, 3));

  if (serverSessionConfig.testMode !== undefined) {
    debug(chalkAlert("--> CONFIG_CHANGE: testMode: " + serverSessionConfig.testMode));
    io.of("/admin").emit("CONFIG_CHANGE", {
      testMode: serverSessionConfig.testMode
    });
    io.of("/util").emit("CONFIG_CHANGE", {
      testMode: serverSessionConfig.testMode
    });
    io.emit("CONFIG_CHANGE", {
      testMode: serverSessionConfig.testMode
    });
    io.of("/test-user").emit("CONFIG_CHANGE", {
      testMode: serverSessionConfig.testMode
    });
    io.of("/test-view").emit("CONFIG_CHANGE", {
      testMode: serverSessionConfig.testMode
    });
  }

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | >>> SENT CONFIG_CHANGE"));
});

//=================================
//  SERVER READY
//=================================
configEvents.on("INIT_DATABASE_COMPLETE", function() {
  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | DATABASE ENABLED"));
});


//=================================
//  METRICS INTERVAL
//=================================
var cacheObj = {
  "adminCache": adminCache,
  "entityCache": entityCache,
  "groupCache": groupCache,
  "ipAddressCache": ipAddressCache,
  "sessionCache": sessionCache,
  "userCache": userCache,
  "utilCache": utilCache,
  "wordCache": wordCache,
  "viewerCache": viewerCache,
  "trendingCache": trendingCache,
  "wordsPerMinuteTopTermCache": wordsPerMinuteTopTermCache
};

var cacheObjKeys = Object.keys(statsObj.caches);

setInterval(function() {

  cacheObjKeys.forEach(function(cacheName){
    statsObj.caches[cacheName].stats.keys = cacheObj[cacheName].getStats().keys;
    if (statsObj.caches[cacheName].stats.keys > statsObj.caches[cacheName].stats.keysMax) {
      statsObj.caches[cacheName].stats.keysMax = statsObj.caches[cacheName].stats.keys;
      statsObj.caches[cacheName].stats.keysMaxTime = moment().valueOf();
      console.log(chalkInfo("MAX"
        + " | " + cacheName
        + " | Ks: " + statsObj.caches[cacheName].stats.keys
      ));
    }
  });

  statsObj.queues.rxWordQueue = rxWordQueue.size();
  statsObj.queues.sessionQueue = sessionQueue.size();
  statsObj.queues.dbUpdateWordQueue = dbUpdateWordQueue.size();
  statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
  statsObj.queues.dbUpdateEntityQueue = dbUpdateEntityQueue.size();
  statsObj.queues.updateSessionViewQueue = updateSessionViewQueue.length;

  if (adminNameSpace) {
    statsObj.entity.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    if (statsObj.entity.admin.connected > statsObj.entity.admin.connectedMax) {
      statsObj.entity.admin.connectedMaxTime = moment().valueOf();
      statsObj.entity.admin.connectedMax = statsObj.entity.admin.connected;
      console.log(chalkInfo("MAX ADMINS"
       + " | " + statsObj.entity.admin.connected
       + " | " + moment().format(compactDateTimeFormat)
      ));
    }
  }

  if (utilNameSpace) {
    statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    if (statsObj.entity.util.connected > statsObj.entity.util.connectedMax) {
      statsObj.entity.util.connectedMaxTime = moment().valueOf();
      statsObj.entity.util.connectedMax = statsObj.entity.util.connected;
      console.log(chalkInfo("MAX UTILS"
       + " | " + statsObj.entity.util.connected
       + " | " + moment().format(compactDateTimeFormat)
      ));
    }
  }
  if (userNameSpace) {
    statsObj.entity.user.connected = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
    if (statsObj.entity.user.connected > statsObj.entity.user.connectedMax) {
      statsObj.entity.user.connectedMaxTime = moment().valueOf();
      statsObj.entity.user.connectedMax = statsObj.entity.user.connected;
      console.log(chalkInfo("MAX USERS"
       + " | " + statsObj.entity.user.connected
       + " | " + moment().format(compactDateTimeFormat)
      ));
    }
  }
  if (adminNameSpace) {
    statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
    if (statsObj.entity.viewer.connected > statsObj.entity.viewer.connectedMax) {
      statsObj.entity.viewer.connectedMaxTime = moment().valueOf();
      statsObj.entity.viewer.connectedMax = statsObj.entity.viewer.connected;
      console.log(chalkInfo("MAX VIEWERS"
       + " | " + statsObj.entity.viewer.connected
       + " | " + moment().format(compactDateTimeFormat)
      ));
    }
  }
}, 1000);


var updateTimeSeriesCount = 0;

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

function initRateQinterval(interval){

  var wsObj;
  console.log(chalkInfo("INIT RATE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(rateQinterval);

  obamaPerMinute = 0.0;
  trumpPerMinute = 0.0;
  wordsPerMinute = 0.0;
  wordsPerSecond = 0.0;
  maxWordsPerMin = 0.0;
  maxTweetsPerMin = 0.0;

  var prevTestValue = 47;

  rateQinterval = setInterval(function () {

    wsObj = wordStats.toJSON();
    if (!wsObj) {return;}

    wordsPerSecond = wsObj.wordsPerSecond["1MinuteRate"];
    wordsPerMinute = wsObj.wordsPerMinute["1MinuteRate"];

    // obamaPerSecond = wsObj.obamaPerSecond["1MinuteRate"];
    obamaPerMinute = wsObj.obamaPerMinute["1MinuteRate"];

    // trumpPerSecond = wsObj.trumpPerSecond["1MinuteRate"];
    trumpPerMinute = wsObj.trumpPerMinute["1MinuteRate"];

    debug(chalkWarn(moment.utc().format(compactDateTimeFormat)
      + " | WPS: " + wordsPerSecond.toFixed(2)
      + " | WPM: " + wordsPerMinute.toFixed(0)
      + " | OPM: " + obamaPerMinute.toFixed(0)
      + " | TrPM: " + trumpPerMinute.toFixed(0)
    ));

    statsObj.wordsPerSecond = wordsPerSecond;
    statsObj.wordsPerMinute = wordsPerMinute;
    statsObj.obamaPerMinute = obamaPerMinute;
    statsObj.trumpPerMinute = trumpPerMinute;

    if (wordsPerMinute > maxWordsPerMin) {
      maxWordsPerMin = wordsPerMinute;
      maxWordsPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX WPM: " + wordsPerMinute.toFixed(0)));
      statsObj.maxWordsPerMin = wordsPerMinute;
      statsObj.maxWordsPerMinTime = moment().valueOf();
    }

    if (obamaPerMinute > maxObamaPerMin) {
      maxObamaPerMin = obamaPerMinute;
      maxObamaPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX OPM: " + obamaPerMinute.toFixed(0)));
      statsObj.maxObamaPerMin = obamaPerMinute;
      statsObj.maxObamaPerMinTime = moment().valueOf();
    }

    if (trumpPerMinute > maxTrumpPerMin) {
      maxTrumpPerMin = trumpPerMinute;
      maxTrumpPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX TrPM: " + trumpPerMinute.toFixed(0)));
      statsObj.maxTrumpPerMin = trumpPerMinute;
      statsObj.maxTrumpPerMinTime = moment().valueOf();
    }

    if (updateTimeSeriesCount === 0){

      var params = {};
      params.op = "SORT";
      params.sortKey = "1MinuteRate";
      params.max = maxTopTerms;
      params.obj = {};
      params.obj = wordMeter;

      sorter.send(params);

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
      }

      if (enableGoogleMetrics) {

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
        dataPointWpm.value = wordsPerMinute;
        dataPointWpm.metricLabels = {server_id: "WORD"};
        addMetricDataPoint(dataPointWpm);
      }
      // word/obama_per_minute
      if (enableGoogleMetrics) {
        var dataPointOpm = {};
        dataPointOpm.metricType = "word/obama_per_minute";
        dataPointOpm.value = obamaPerMinute;
        dataPointOpm.metricLabels = {server_id: "WORD"};
        addMetricDataPoint(dataPointOpm);
      }
      // word/trump_per_minute
      if (enableGoogleMetrics) {
        var dataPointOTrpm = {};
        dataPointOTrpm.metricType = "word/trump_per_minute";
        dataPointOTrpm.value = trumpPerMinute;
        dataPointOTrpm.metricLabels = {server_id: "WORD"};
        addMetricDataPoint(dataPointOTrpm);
      }
      // util/global/number_of_utils
      if (enableGoogleMetrics) {
        var dataPointUtils = {};
        dataPointUtils.metricType = "util/global/number_of_utils";
        dataPointUtils.value = Object.keys(utilNameSpace.connected).length;
        dataPointUtils.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointUtils);
      }
      // user/global/number_of_viewers
      if (enableGoogleMetrics) {
        var dataPointViewers = {};
        dataPointViewers.metricType = "user/global/number_of_viewers";
        dataPointViewers.value = statsObj.caches.viewerCache.stats.keys;
        dataPointViewers.metricLabels = {server_id: "USER"};
        addMetricDataPoint(dataPointViewers);
      }
      // user/global/number_of_users
      if (enableGoogleMetrics) {
        var dataPointUsers = {};
        dataPointUsers.metricType = "user/global/number_of_users";
        dataPointUsers.value = statsObj.caches.userCache.stats.keys;
        dataPointUsers.metricLabels = {server_id: "USER"};
        addMetricDataPoint(dataPointUsers);
      }
      // util/global/number_of_groups
      if (enableGoogleMetrics) {
        var dataPointGroups = {};
        dataPointGroups.metricType = "util/global/number_of_groups";
        dataPointGroups.value = statsObj.caches.groupCache.stats.keys;
        dataPointGroups.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointGroups);
      }
      // util/global/number_of_entities
      if (enableGoogleMetrics) {
        var dataPointEntities = {};
        dataPointEntities.metricType = "util/global/number_of_entities";
        dataPointEntities.value = statsObj.caches.entityCache.stats.keys;
        dataPointEntities.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointEntities);
      }
      // user/global/number_of_sessions
      if (enableGoogleMetrics) {
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

var DROPBOX_WA_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_GROUPS_CONFIG_FILE || "groups.json";
var DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE = process.env.DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE || "entityChannelGroups.json";

var defaultDropboxGroupsConfigFile = DROPBOX_WA_GROUPS_CONFIG_FILE;
var defaultDropboxKeywordFile = "keywords.json";
var defaultDropboxEntityChannelGroupsConfigFile = DROPBOX_WA_ENTITY_CHANNEL_GROUPS_CONFIG_FILE;

//=================================
// PROCESS HANDLERS
//=================================

process.on("message", function(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    debug("\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n");
    debug("... SAVING STATS");

    clearInterval(initInternetCheckInterval);
    clearInterval(statsInterval);
    clearInterval(rateQinterval);
    clearInterval(updateTrendsInterval);
    clearInterval(sessionViewQueueInterval);
    clearInterval(dbUpdateEntityQueueInterval);
    clearInterval(dbUpdateWordQueueInterval);
    clearInterval(dbUpdateGroupQueueInterval);

    saveStats(statsFile, statsObj, function(status) {
      if (status !=="OK") {
        debug("!!! ERROR: saveStats " + status);
      } 
      else {
        debug(chalkLog("UPDATE STATUS OK"));
      }
    });

    setTimeout(function() {
      debug("**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n");
      process.exit(0);
    }, 300);

  }
});

function initIgnoreWordsHashMap(callback) {
  async.each(ignoreWordsArray, function(ignoreWord, cb) {
    ignoreWordHashMap.set(ignoreWord, true);
    cb();
  }, function(err) {
    if (callback) { callback(err); }
  });
}


//=================================
// BEGIN !!
//=================================
initializeConfiguration(configuration, function(err, results) {

  if (err) {
    console.log(chalkError("*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err)));
  } 
  else {
    console.log(chalkLog("INITIALIZE CONFIGURATION COMPLETE\n" + jsonPrint(results)));

    // updateStatsCounts();
    // initSocketNamespaces();

    initIgnoreWordsHashMap();
    updateTrends();

    initSorterMessageRxQueueInterval(DEFAULT_INTERVAL);
    initDbUpdateEntityQueueInterval(DEFAULT_INTERVAL);
    initDbUpdateGroupQueueInterval(DEFAULT_INTERVAL);
    initDbUpdateWordQueueInterval(DEFAULT_INTERVAL);
    initRateQinterval(1000);
    initRxWordQueueInterval(DEFAULT_INTERVAL);
    initSessionEventHandlerInterval(DEFAULT_INTERVAL);
    initSessionViewQueueInterval(DEFAULT_INTERVAL);
    initStatsInterval(ONE_MINUTE);
    initUpdaterMessageQueueInterval(DEFAULT_INTERVAL);
    initDbUpdaterMessageRxQueueInterval(DEFAULT_INTERVAL)
    initUpdateTrendsInterval(15*ONE_MINUTE);


    // ================================
    sorter = cp.fork(`${__dirname}/js/libs/sorter.js`);

    sorter.on("message", function(m){
      debug(chalkWarn("SORTER RX"
        + " | " + m.op
        // + "\n" + jsonPrint(m)
      ));
      sorterMessageRxQueue.enqueue(m);
    });

    sorter.send({
      op: "INIT",
      interval: DB_UPDATE_INTERVAL
    });

    sorter.on("error", function(err){
      console.log(chalkError("*** SORTER ERROR ***\n" + jsonPrint(err)));
      quit(err);
    });

    sorter.on("exit", function(err){
      console.log(chalkError("*** SORTER EXIT ***\n" + jsonPrint(err)));
      quit(err);
    });

    sorter.on("close", function(code){
      console.log(chalkError("*** SORTER CLOSE *** | " + code));
      quit(code);
    });

    // ================================
    dbUpdater = cp.fork(`${__dirname}/js/libs/dbUpdater.js`);

    dbUpdater.on("message", function(m){
      debug(chalkWarn("DB UPDATER RX\n" + jsonPrint(m)));
      dbUpdaterMessageRxQueue.enqueue(m);
    });

    dbUpdater.send({
      op: "INIT",
      interval: DB_UPDATE_INTERVAL
    });

    dbUpdater.on("error", function(err){
      console.log(chalkError("*** DB UPDATER ERROR ***\n" + jsonPrint(err)));
      quit(err);
    });

    dbUpdater.on("exit", function(err){
      console.log(chalkError("*** DB UPDATER EXIT ***\n" + jsonPrint(err)));
      quit(err);
    });

    dbUpdater.on("close", function(code){
      console.log(chalkError("*** DB UPDATER CLOSE *** | " + code));
      quit(code);
    });


    // ================================
    updater = cp.fork(`${__dirname}/js/libs/updateGroupsEntitiesChannels.js`);

    updater.on("error", function(err){
      console.log(chalkError("*** UPDATER ERROR ***\n" + jsonPrint(err)));
      quit(err);
    });

    updater.on("exit", function(err){
      console.log(chalkError("*** UPDATER EXIT ***\n" + jsonPrint(err)));
      quit(err);
    });

    updater.on("close", function(code){
      console.log(chalkError("*** UPDATER CLOSE *** | " + code));
      quit(code);
    });

    updater.on("message", function(m){
      debug(chalkWarn("UPDATER RX\n" + jsonPrint(m)));
      updaterMessageQueue.enqueue(m);
    });

    updater.send({
      op: "INIT",
      folder: ".",
      groupsConfigFile: defaultDropboxGroupsConfigFile,
      entityChannelGroupsConfigFile: defaultDropboxEntityChannelGroupsConfigFile,
      keywordFile: defaultDropboxKeywordFile,
      interval: GROUP_UPDATE_INTERVAL
    });
  }
});

// GEN UNCAUGHT ERROR TO TEST KILL OF CHILD PROCESS
// setTimeout(function(){
//   console.log("CRASH!");
//   console.log("OOPS!" + updater.thisdoesntexist.toLowerCase());
// }, 5000);

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
