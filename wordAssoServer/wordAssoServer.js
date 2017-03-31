/*jslint node: true */
"use strict";

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
// var ONE_HOUR = ONE_MINUTE * 60;
// var ONE_DAY = ONE_HOUR * 24;
var quitOnErrorFlag = false;

var wordsApiKey = "RWwyknmI1OmshYkPUYAQyHVv1Cbup1ptubzjsn2F19wbnAlSEf";
var wapiUrlRoot = "https://wordsapiv1.p.mashape.com/words/";
// var wordsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";

var primarySessionObj;

// ==================================================================
// TEST CONFIG
// ==================================================================
var bhtOverLimitTestFlag = false;

var configuration = {};

var tssServer;
var tmsServer;

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

var wapiForceSearch = true;
var dmOnUnknownSession = false;
var ioReady = false;
var groupsUpdateComplete = false;
var entitiesUpdateComplete = false;
var keywordsUpdateComplete = false;
var updateComplete = groupsUpdateComplete && entitiesUpdateComplete && keywordsUpdateComplete;

var rateQinterval;

var tweetsPerMinute = 0.0;
// var tweetsPerSecond = 0.0;
var maxTweetsPerMin = 0;
var maxTweetsPerMinTime = moment.utc();

var wordsPerMinute = 0.0;
var wordsPerSecond = 0.0;
var maxWordsPerMin = 0;
var maxWordsPerMinTime = moment.utc();

// var obamaPerSecond = 0.0;
var obamaPerMinute = 0.0;
var maxObamaPerMin = 0;
var maxObamaPerMinTime = moment.utc();

// var trumpPerSecond = 0.0;
var trumpPerMinute = 0.0;
var maxTrumpPerMin = 0;
var maxTrumpPerMinTime = moment.utc();

// var serverHeartbeatInterval;
// var pollGetTwitterFriendsInterval;

var config = require("./config/config");
var util = require("util");
var fs = require("fs");
// var S = require("string");
var os = require("os");
// var clone = require("clone");
var async = require("async");
var HashMap = require("hashmap").HashMap;
var Dropbox = require("dropbox");
// var deepcopy = require("deepcopy");
var unirest = require("unirest");
var debug = require("debug")("wa");
var debugKeyword = require("debug")("kw");
var debugWapi = require("debug")("wapi");
var debugAppGet = require("debug")("appGet");
var commandLineArgs = require("command-line-args");

var cp = require("child_process");
var updater;

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

// var IpAddress = require("mongoose").model("IpAddress");
var Admin = require("mongoose").model("Admin");
var Viewer = require("mongoose").model("Viewer");
var User = require("mongoose").model("User");
var Group = require("mongoose").model("Group");
var Entity = require("mongoose").model("Entity");
var Session = require("mongoose").model("Session");
var Word = require("mongoose").model("Word");
// var Oauth2credential = require("mongoose").model("Oauth2credential");

var groupServer = require("./app/controllers/group.server.controller");
var entityServer = require("./app/controllers/entity.server.controller");
var wordServer = require("./app/controllers/word.server.controller");

var app = express();

var http = require("http");
var httpServer = require("http").Server(app);
var io;
var dns = require("dns");
var path = require("path");
var net = require("net");
var Queue = require("queue-fifo");

var GROUP_UPDATE_INTERVAL = 60000;
var MAX_RESPONSE_QUEUE_SIZE = 250;
var OFFLINE_MODE = false;
var internetReady = false;
var pollTwitterFriendsIntervalTime = 5*ONE_MINUTE;

var TRENDING_CACHE_DEFAULT_TTL = 300; // seconds
var ADMIN_CACHE_DEFAULT_TTL = 120; // seconds
var VIEWER_CACHE_DEFAULT_TTL = 120; // seconds
var UTIL_CACHE_DEFAULT_TTL = 120; // seconds
var USER_CACHE_DEFAULT_TTL = 120; // seconds
var GROUP_CACHE_DEFAULT_TTL = 120; // seconds
var ENTITY_CACHE_DEFAULT_TTL = 120; // seconds
var SESSION_CACHE_DEFAULT_TTL = 120; // seconds
var WORD_CACHE_TTL = 300; // seconds
// var MONITOR_CACHE_TTL = 120; // seconds
var IP_ADDRESS_CACHE_DEFAULT_TTL = 120;

var MAX_WORDCHAIN_LENGTH = 10;
// var MIN_CHAIN_FREEZE_LENGTH = 20;
// var MIN_CHAIN_FREEZE_UNIQUE_NODES = 10;

var BHT_REQUEST_LIMIT = 1000;
var MW_REQUEST_LIMIT = 250000;
// var WAPI_REQUEST_LIMIT = 25000;
var WAPI_REQ_RESERVE_PRCNT = 0.30;

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
var chalkMw = chalk.yellow;
var chalkDb = chalk.gray;

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};

function quit(message) {
  console.log("\n... QUITTING ...");
  if (updater !== undefined) { updater.kill("SIGHUP"); }
  var msg = "";
  if (message) {msg = message;}
  console.log("QUIT MESSAGE\n" + msg);
  process.exit();
}

process.on("SIGINT", function() {
  quit("SIGINT");
});

// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  // var milliseconds = parseInt((duration % 1000) / 1000);
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

// function msToMinutes(duration) {
//   var minutes = parseInt((duration / (1000 * 60)) % 60);
//   return minutes;
// }

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


var compactDateTimeFormat = "YYYYMMDD HHmmss";
// var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
// var defaultTimePeriodFormat = "HH:mm:ss";

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
var groupHashMap = new HashMap();
var serverGroupHashMap = new HashMap(); // server specific keywords

var entityChannelGroupHashMap = new HashMap();
var serverEntityChannelGroupHashMap = new HashMap();

var ignoreWordHashMap = new HashMap();
var keywordHashMap = new HashMap();
var serverKeywordHashMap = new HashMap(); // server specific keywords
var topicHashMap = new HashMap();

var serverGroupsJsonObj = {};
var serverKeywordsJsonObj = {};

// ==================================================================
// SERVER STATUS
// ==================================================================

// var currentTime = moment();

// var currentTimeInteval = setInterval(function() {
//   // currentTime = moment();
// }, 100);

var tempDateTime = moment();

var txHeartbeat = {};

txHeartbeat.wordStats = {};

var heartbeatsSent = 0;

// var numberIpAddresses = 0;

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


// ==================================================================
// WORD ASSO STATUS
// ==================================================================
var totalSessions = 0;
var totalUsers = 0;
// var totalClients = 0;
var totalWords = 0;
var totalEntities = 0;
var totalGroups = 0;

var promptsSent = 0;
var responsesReceived = 0;
var sessionUpdatesSent = 0;

var bhtWordsMiss = {};
var bhtWordsNotFound = {};

// var mwDictWordsMiss = {};
// var mwDictWordsNotFound = {};

// var mwThesWordsMiss = {};
// var mwThesWordsNotFound = {};

var statsObj = {

  "name": "Word Association Server Status",
  "host": hostname,
  "timeStamp": moment().format(compactDateTimeFormat),
  "runTimeArgs": process.argv,

  "startTime": moment().valueOf(),
  "runTime": 0,

  "totalClients": 0,
  "totalUsers": 0,
  "totalSessions": 0,
  "totalWords": 0,

  "socket": {},

  "promptsSent": 0,
  "responsesReceived": 0,
  "deltaResponsesReceived": 0,
  "sessionUpdatesSent": 0,

  "bhtRequests": 0,
  "bhtWordsNotFound": {},

  "mwRequests": 0,
  "mwDictWordsMiss": {},
  "mwDictWordsNotFound": {},
  "mwThesWordsMiss": {},
  "mwThesWordsNotFound": {},

  "session": {},

  "chainFreezes": 0,

  "heartbeat": txHeartbeat
};

statsObj.upTime = os.uptime() * 1000;
statsObj.memoryTotal = os.totalmem();
statsObj.memoryAvailable = os.freemem();

statsObj.caches = {};
statsObj.utilities = {};

statsObj.wapi = {};
statsObj.wapi.totalRequests = 0;
statsObj.wapi.requestLimit = 25000;
statsObj.wapi.requestsRemaining = 25000;

statsObj.group = {};
statsObj.group.errors = 0;
statsObj.group.hashMiss = {};
statsObj.group.allHashMisses = {};

statsObj.session.errors = 0;
statsObj.session.previousPromptNotFound = 0;
statsObj.session.responseError = 0;
statsObj.session.responseErrorType = {};

statsObj.socket.connects = 0;
statsObj.socket.reconnects = 0;
statsObj.socket.disconnects = 0;
statsObj.socket.errors = 0;


statsObj.entityChannelGroup = {};
statsObj.entityChannelGroup.hashMiss = {};
statsObj.entityChannelGroup.allHashMisses = {};
// ==================================================================
// LOGS, STATS
// ==================================================================

var serverSessionConfig = {};

var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});


// var adminIpHashMap = new HashMap();
// var adminSocketIdHashMap = new HashMap();
// 
// var numberAdminsTotal = 0;
var numberAdmins = 0;

var numberUtils = 0;
var numberUsers = 0;
var numberViewers = 0;
var numberTestViewers = 0;
var numberTestUsers = 0;

var dnsHostHashMap = new HashMap();
var localHostHashMap = new HashMap();


// var socketQueue = new Queue();
var sessionQueue = new Queue();
var dbUpdateGroupQueue = new Queue();
var dbUpdateEntityQueue = new Queue();
// var dbUpdateSessionQueue = new Queue();
var dbUpdateWordQueue = new Queue();
var wapiSearchQueue = new Queue();
var updaterMessageQueue = new Queue();
var followerUpdateQueue = new Queue();

var promptQueue = new Queue();
var responseQueue = new Queue();
var responseRate1minQ = new Queue();

var dnsReverseLookupQueue = new Queue();

var adminNameSpace;
var utilNameSpace;
var userNameSpace;
var viewNameSpace;
var testUsersNameSpace;
var testViewersNameSpace;

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
var wapiReqReservePercent = process.env.WAPI_REQ_RESERVE_PRCNT;

if (wapiReqReservePercent === undefined) {wapiReqReservePercent = WAPI_REQ_RESERVE_PRCNT;}
console.log("WAPI_REQ_RESERVE_PRCNT: " + wapiReqReservePercent);

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
  useClones: false,
  stdTTL: sessionCacheTtl,
  checkperiod: 10
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
    + " | U: " + sessionObj.userId
    + " \n" + jsonPrint(sessionObj)
  ));

  if (sessionObj.user && (sessionObj.user.mode === "SUBSTREAM")){
    entityCache.set(sessionObj.user.userId, sessionObj.user);
  }
});

sessionCache.on("expired", function(sessionId, sessionObj) {
  sessionQueue.enqueue({
    sessionEvent: "SESSION_EXPIRED",
    sessionId: sessionId,
    session: sessionObj
  });

  io.of(sessionObj.namespace).to(sessionId).emit("SESSION_EXPIRED", sessionId);

  sessionObj.sessionEvent = "SESSION_DELETE";

  viewNameSpace.emit("SESSION_DELETE", sessionObj);
  testViewersNameSpace.emit("SESSION_DELETE", sessionObj);

  debug("CACHE SESSION EXPIRED\n" + jsonPrint(sessionObj));
  debug(chalkInfo("... CACHE SESS EXPIRED"
    + " | " + sessionObj.sessionId 
    + " | LS: " + moment(parseInt(sessionObj.lastSeen)).format(compactDateTimeFormat)
    + " | " + msToTime(moment().valueOf() - sessionObj.lastSeen) 
    + " | WCL: " + sessionObj.wordChain.length 
  ));
});

wordCache.on("set", function(word, wordObj) {

  debug(chalkWapi("WORD CACHE SET"
    + " | " + word 
    + " | " + wordObj.raw
  ));

  if (!wapiOverLimitFlag && (wapiForceSearch || !wordObj.wapiSearched)){
    wapiSearchQueue.enqueue(wordObj);
  }
});

wordCache.on("expired", function(word, wordObj) {

  wordMeter[wordObj.nodeId] = {};
  delete wordMeter[wordObj.nodeId];

  if (wordObj !== undefined) {
    debug("... CACHE WORD EXPIRED"
      + " | " + word
      + " | " + wordObj.raw 
      + " | LS: " + moment(wordObj.lastSeen).format(compactDateTimeFormat)
      + " | " + msToTime(moment().valueOf() - wordObj.lastSeen) 
      + " | M: " + wordObj.mentions 
      + " | K: " + wordCache.getStats().keys 
      + " | H: " + wordCache.getStats().hits 
      + " | M: " + wordCache.getStats().misses);
  } else {
    debug(chalkError("??? UNDEFINED wordObj on wordCache expired ???"));
  }
});

trendingCache.on( "expired", function(topic, topicObj){
  debug("CACHE TOPIC EXPIRED\n" + jsonPrint(topicObj));
  debug("CACHE TOPIC EXPIRED | " + topic + " | " + topicObj.name);
});


function updateWordMeter(wordObj){

  if (ignoreWordHashMap.has(wordObj.nodeId)) {
    debug(chalkInfo("IGNORE " + wordObj.nodeId));
    wordCache.set(wordObj.nodeId, wordObj);
    return;
  }

  if (!wordMeter[wordObj.nodeId] 
    || (wordMeter[wordObj.nodeId] === undefined) 
    || (typeof wordMeter[wordObj.nodeId].mark !== "function")) {
    wordMeter[wordObj.nodeId] = {};
    wordMeter[wordObj.nodeId] = new Measured.Meter({rateUnit: 60000});
    wordMeter[wordObj.nodeId].mark();
    wordCache.set(wordObj.nodeId, wordObj);
  }
  else {
    wordMeter[wordObj.nodeId].mark();
    wordCache.set(wordObj.nodeId, wordObj);
  }

  if (wordMeter[wordObj.nodeId].toJSON().count > MIN_WORD_METER_COUNT) {

    var meterObj = wordMeter[wordObj.nodeId].toJSON();

    debug(chalkAlert("WM"
      + " | W: " + Object.keys(wordMeter).length
      + " | C: " + meterObj.count
      + " | 5: " + meterObj["5MinuteRate"].toFixed(2)
      + " | 1: " + meterObj["1MinuteRate"].toFixed(2)
      + " | " + wordObj.nodeId
    ));
  }
}



// ==================================================================
// BIG HUGE THESAURUS
// ==================================================================
var bigHugeLabsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";
var bhtEvents = new EventEmitter();
var bhtErrors = 0;
var bhtRequests = 0;
var bhtOverLimits = 0;

var bhtOverLimitTime = moment.utc().utcOffset("-07:00").endOf("day");
var bhtLimitResetTime = moment.utc().utcOffset("-07:00").endOf("day");
var bhtTimeToReset = moment.utc().utcOffset("-07:00").endOf("day").valueOf() - moment.utc().utcOffset("-07:00").valueOf();
var bhtOverLimitFlag = false;

debug("BHT OVER LIMIT TIME:  " + bhtOverLimitTime.format(compactDateTimeFormat));
debug("BHT OVER LIMIT RESET: " + bhtOverLimitTime.format(compactDateTimeFormat));
debug("BHT TIME TO RESET: " + msToTime(bhtTimeToReset));

var bhtOverLimitTimeOut = setTimeout(function() {
  bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
}, bhtTimeToReset);


// ==================================================================
// MERRIAM-WEBSTER
// ==================================================================
var mwEvents = new EventEmitter();
var mwErrors = 0;
var mwRequests = 0;
// var mwRequestLimit = MW_REQUEST_LIMIT;
// var mwOverLimits = 0;

var mwOverLimitTime = moment.utc().utcOffset("-05:00").endOf("day");
var mwLimitResetTime = moment.utc().utcOffset("-05:00").endOf("day");
var mwTimeToReset = moment.utc().utcOffset("-05:00").endOf("day").valueOf() - moment.utc().utcOffset("-05:00").valueOf();
var mwOverLimitFlag = false;

debug("MW OVER LIMIT TIME:  " + mwOverLimitTime.format(compactDateTimeFormat));
debug("MW OVER LIMIT RESET: " + mwOverLimitTime.format(compactDateTimeFormat));
debug("MW TIME TO RESET: " + msToTime(mwTimeToReset));

setTimeout(function() {
  mwEvents.emit("MW_OVER_LIMIT_TIMEOUT");
}, mwTimeToReset);



// ==================================================================
// ENV INIT
// ==================================================================

if (debug.enabled) {
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("NODE_ENV : " + process.env.NODE_ENV);
console.log("CLIENT HOST + PORT: " + "http://localhost:" + config.port);

var statsFile;

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

var dropboxHostStatsFile = "/stats/" + hostname + "/" + hostname + "_" + process.pid + "_" + WA_STATS_FILE;

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var serverGroupsFile = hostname + "_groups.json";
// var serverEntitiesFile = hostname + "_entities.json";
var serverKeywordsFile = hostname + "_keywords.json";

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

if (OFFLINE_MODE) {
  statsFile = offlineStatsFile;
} 
else {
  statsFile = dropboxHostStatsFile;
}

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
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + " ERROR: " + error.error_summary
      ));
      callback(error, null);
    });
}

// function dropboxWriteArrayToFile(filePath, dataArray, callback) {

//   if (filePath === undefined) {
//     console.log(chalkError(moment().format(compactDateTimeFormat) 
//       + " | !!! DROPBOX WRITE FILE ERROR: FILE PATH UNDEFINED"));
//     callback("FILE PATH UNDEFINED", null);
//   }

//   var dataString = dataArray.join("\n");

//   var options = {};

//   options.contents = dataString;
//   options.path = filePath;
//   options.mode = "overwrite";
//   options.autorename = false;

//   dropboxClient.filesUpload(options)
//     .then(function(response){
//       debug(chalkLog("... SAVED DROPBOX JSON | " + options.path));
//       callback(null, response);
//     })
//     .catch(function(error){
//       console.log(chalkError(moment().format(compactDateTimeFormat) 
//         + " | !!! ERROR DROBOX JSON WRITE | FILE: " + file 
//         + " ERROR: " + error.error_summary
//       ));
//       callback(error, null);
//     });
// }

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

function updateStats(updateObj) {
  var keys = Object.keys(updateObj);
  // for (var key in updateObj) {
  keys.forEach(function(key){
    if (updateObj.hasOwnProperty(key)) {
      // debug("UPDATING WORD ASSO STATUS | " + key + ": " + updateObj[key]);
      statsObj[key] = updateObj[key];
    }
  });
}

var statsInterval;

function updateStatsInterval(interval){

  clearInterval(statsInterval);

  statsInterval = setInterval(function() {

    statsObj.upTime = os.uptime() * 1000;
    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.memoryTotal = os.totalmem();
    statsObj.memoryAvailable = os.freemem();

    updateStats({
      timeStamp: moment().format(compactDateTimeFormat),
      upTime: msToTime(statsObj.upTime),
      runTime: msToTime(statsObj.runTime),
      heartbeat: txHeartbeat,

      numberAdmins: numberAdmins,

      numberUtils: numberUtils,
      numberUtilsMax: numberUtilsMax,
      numberUtilsMaxTime: numberUtilsMaxTime,

      numberUsers: numberUsers,
      numberUsersMax: numberUsersMax,
      numberUsersMaxTime: numberUsersMaxTime,

      numberTestUsers: numberTestUsers,
      numberTestUsersMax: numberTestUsersMax,
      numberTestUsersMaxTime: numberTestUsersMaxTime,

      numberUsersTotal: numberUsersTotal,
      numberUsersTotalMax: numberUsersTotalMax,
      numberUsersTotalMaxTime: numberUsersTotalMaxTime,

      numberViewers: numberViewers,
      numberViewersMax: numberViewersMax,
      numberViewersMaxTime: numberViewersMaxTime,

      numberTestViewers: numberTestViewers,
      numberTestViewersMax: numberTestViewersMax,
      numberTestViewersMaxTime: numberTestViewersMaxTime,

      numberViewersTotal: numberViewersTotal,
      numberViewersTotalMax: numberViewersTotalMax,
      numberViewersTotalMaxTime: numberViewersTotalMaxTime,

      promptsSent: promptsSent,
      responsesReceived: responsesReceived,

      bhtErrors: bhtErrors,
      bhtRequests: bhtRequests,
      bhtOverLimitFlag: bhtOverLimitFlag,

      mwErrors: mwErrors,
      mwRequests: mwRequests,

      totalEntities: totalEntities,
      entityCacheTtl: entityCacheTtl,

      totalGroups: totalGroups,
      groupCacheTtl: groupCacheTtl,

      totalSessions: totalSessions,
      sessionUpdatesSent: sessionUpdatesSent,
      sessionCacheTtl: sessionCacheTtl,

      totalWords: totalWords,
      wordCacheHits: wordCache.getStats().hits,
      wordCacheMisses: wordCache.getStats().misses,
      wordCacheTtl: wordCacheTtl
    });

    if (groupsUpdateComplete) {
      var gKeys = serverGroupHashMap.keys();

      async.each(gKeys, function(groupId, cb){
        serverGroupsJsonObj[groupId] = serverGroupHashMap.get(groupId);
        cb();
      },
        function(err){
          if (err) { console.log(chalkError("ERROR: " + jsonPrint(err))); }
          if (gKeys.length > 0) {
            saveFile("", serverGroupsFile, serverGroupsJsonObj, function(err, results){
              if (err){
                console.log(chalkError("SAVE SERVER GROUP FILE ERROR " + serverGroupsFile 
                  + "\n" + jsonPrint(err)
                  + "\n" + jsonPrint(results)
                ));
              }
              else {
                console.log(chalkLog("SAVE SERVER GROUP FILE " 
                  + serverGroupsFile 
                  + " | " + gKeys.length + " GROUPS"
                  // + "\n" + jsonPrint(results)
                ));
              }
            });
          }
          else {
            console.log(chalkLog("SKIPPED SAVE SERVER GROUP FILE " 
              + serverGroupsFile 
              + " | " + gKeys.length + " GROUPS"
              // + "\n" + jsonPrint(results)
            ));
          }

        }
      );
    }

    if (entitiesUpdateComplete) {
      var hmKeys = serverKeywordHashMap.keys();

      async.each(hmKeys, function(keyword, cb){
        serverKeywordsJsonObj[keyword] = serverKeywordHashMap.get(keyword);
        cb();
      },
        function(err){
          if (err) { console.log(chalkError("ERROR: " + jsonPrint(err))); }
          if (hmKeys.length > 0) {
            saveFile("", serverKeywordsFile, serverKeywordsJsonObj, function(err, results){
              if (err){
                console.log(chalkError("SAVE SERVER KEYWORD FILE ERROR " + serverKeywordsFile));
                if (err.status === 429) {
                  console.log(chalkError("SAVE SERVER KEYWORD FILE ERROR: TOO MANY WRITES"));
                }
                else {
                  console.log(chalkError(
                    jsonPrint(err)
                    + "\n" + jsonPrint(results)
                  ));
                }
              }
              else {
                console.log(chalkInfo("SAVE SERVER KEYWORD FILE " 
                  + serverKeywordsFile 
                  + " | " + hmKeys.length + " KEYWORDS"
                  // + "\n" + jsonPrint(results)
                ));
              }
            });
          }
          else {
            console.log(chalkLog("SKIPPED SAVE SERVER KEYWORDS FILE " 
              + serverKeywordsFile 
              + " | " + hmKeys.length + " KEYWORDS"
              // + "\n" + jsonPrint(results)
            ));
          }

        }
      );
    }
  }, interval);
}

// ==================================================================
// MONGO DATABASE CONFIG
// ==================================================================


// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================


// var MAX_WORD_HASH_MAP_COUNT = 20;
// var wordArray = []; // used to keep wordHashMap.count() < MAX_WORD_HASH_MAP_COUNT

// var promptArray = ["black"];


// ==================================================================
// GOOGLE
// ==================================================================

// var adminNameSpace;
// var utilNameSpace;
// var userNameSpace;
// var viewNameSpace;
// var testUsersNameSpace;
// var testViewersNameSpace;

function checkKeyword(w, callback) {

  debug(chalkAlert("checkKeyword\n" + jsonPrint(w)));

  var wordObj = {};
  wordObj = w;
  wordObj.isKeyword = false;    
  wordObj.keywords = {};
  var kwObj = {};  

  if ((wordObj.nodeType === "user") 
    && (wordObj.name !== undefined) 
    && (wordObj.name) 
    && serverKeywordHashMap.has(wordObj.name.toLowerCase())) {
    debug(chalkAlert("HIT SRVR USER NAME"));
    kwObj = serverKeywordHashMap.get(wordObj.name.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.name.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if ((wordObj.nodeType === "user") 
    && (wordObj.screenName !== undefined)  
    && (wordObj.screenName) 
    && serverKeywordHashMap.has(wordObj.screenName.toLowerCase())) {
    debug(chalkAlert("HIT SRVR USER SNAME"));
    kwObj = serverKeywordHashMap.get(wordObj.screenName.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.screenName.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if (wordObj.nodeId && serverKeywordHashMap.has(wordObj.nodeId.toLowerCase())) {
    debug(chalkAlert("HIT SRVR NODE ID"));
    kwObj = serverKeywordHashMap.get(wordObj.nodeId.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.nodeId.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if (wordObj.text && serverKeywordHashMap.has(wordObj.text.toLowerCase())) {
    debug(chalkAlert("HIT SRVR TEXT"));
    kwObj = serverKeywordHashMap.get(wordObj.text.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.text.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if ((wordObj.nodeType === "user") 
    && (wordObj.name !== undefined) 
    && (wordObj.name) 
    && keywordHashMap.has(wordObj.name.toLowerCase())) {
    debug(chalkAlert("HIT USER NAME"));
    kwObj = keywordHashMap.get(wordObj.name.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.name.toLowerCase()] = kwObj;    
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
    // wordObj.keywords[wordObj.screenName.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if (wordObj.nodeId && keywordHashMap.has(wordObj.nodeId.toLowerCase())) {
    debug(chalkAlert("HIT NODE ID"));
    kwObj = keywordHashMap.get(wordObj.nodeId.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.nodeId.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
    callback(wordObj);
  }
  else if (wordObj.text && keywordHashMap.has(wordObj.text.toLowerCase())) {
    debug(chalkAlert("HIT TEXT"));
    kwObj = keywordHashMap.get(wordObj.text.toLowerCase());
    wordObj.isKeyword = true;
    // wordObj.keywords[wordObj.text.toLowerCase()] = kwObj;    
    wordObj.keywords = kwObj;    
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

var deltaPromptsSent = 0;
var deltaResponsesReceived = 0;
var deltaBhtRequests = 0;
var deltaMwRequests = 0;

function incrementDeltaBhtReqs(delta) {
  var d = parseInt(delta);
  if (d === 0) {
    deltaBhtRequests = 0;
  } 
  else {
    deltaBhtRequests += d;
  }
}

function incrementDeltaMwReqs(delta) {
  var d = parseInt(delta);
  if (d === 0) {
    deltaMwRequests = 0;
  } 
  else {
    deltaMwRequests += d;
  }
}

function incrementSocketBhtReqs(delta) {

  if ((bhtRequests >= BHT_REQUEST_LIMIT) || ((bhtRequests + delta) > BHT_REQUEST_LIMIT)) {
    debug(chalkInfo("!!! incrementSocketBhtReqs: AT BHT_REQUEST_LIMIT: " + bhtRequests 
      + " | NOW: " + BHT_REQUEST_LIMIT));
    bhtRequests = BHT_REQUEST_LIMIT;
    io.of(adminNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
    io.of(utilNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
    io.of(testUsersNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
    io.of(userNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
  } 
  else if (delta > 0) {
    bhtRequests += delta;
    var remain = BHT_REQUEST_LIMIT - bhtRequests;
    debug(chalkInfo("-#- BHT REQS: " + bhtRequests 
      + " | DELTA: " + delta 
      + " | LIMIT: " + BHT_REQUEST_LIMIT 
      + " | REMAIN: " + remain
    ));
    incrementDeltaBhtReqs(delta);
  }
}

function incrementSocketMwReqs(delta) {

  if ((mwRequests > MW_REQUEST_LIMIT) || ((mwRequests + delta) > MW_REQUEST_LIMIT)) {
    debug(chalkInfo("!!! incrementSocketMwReqs: AT MW_REQUEST_LIMIT: " + mwRequests 
      + " | NOW: " + MW_REQUEST_LIMIT));
    mwRequests = MW_REQUEST_LIMIT;
  } 
  else if (delta > 0) {
    mwRequests += delta;
    var remain = MW_REQUEST_LIMIT - mwRequests;
    debug(chalkInfo("-#- MW  REQS: " + mwRequests 
      + " | DELTA: " + delta 
      + " | LIMIT: " + MW_REQUEST_LIMIT 
      + " | REMAIN: " + remain
    ));
    incrementDeltaMwReqs(delta);
  }
}

function sessionUpdateDbCache(sessionCacheKey, socket, userObj){
  sessionCache.get(sessionCacheKey, function(err, sObj){
    if (err){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | ??? SESSION CACHE ERROR ON USER READY | " + err
      ));
    }
    else {
      if (!sObj) {

        sObj = new Session({
          sessionId: sessionCacheKey,
          tags: {},
          // ip: ipAddress,
          namespace: "util",
          url: userObj.url,
          profileImageUrl: userObj.profileImageUrl,
          createAt: moment().valueOf(),
          lastSeen: moment().valueOf(),
          connected: true,
          connectTime: moment().valueOf(),
          disconnectTime: 0
        });

        sObj.config = {};

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
          callback("PRIMARY SESSION NOT FOUND ON USER READY", sessionCacheKey);
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
          sObj.socket = socket;
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
        }
        else {
          if (sObj.tags.entity !== undefined) {

            sObj.tags.entity = sObj.tags.entity.toLowerCase();

            if (entityChannelGroupHashMap.has(sObj.tags.entity)){

              delete statsObj.entityChannelGroup.hashMiss[sObj.tags.entity];

              debug(chalkInfo("### E CH HM HIT"
                + " | " + sObj.tags.entity
                + " > " + entityChannelGroupHashMap.get(sObj.tags.entity).groupId
              ));
            }
            else {
              statsObj.entityChannelGroup.hashMiss[sObj.tags.entity] = 1;
              statsObj.entityChannelGroup.allHashMisses[sObj.tags.entity] = 1;
              debug(chalkInfo("-0- E CH HM MISS"
                + " | " + sObj.tags.entity
                // + "\n" + jsonPrint(statsObj.entityChannelGroup.hashMiss)
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
    }
  });
}

function createSession(newSessionObj) {

  debug(chalkSession("\nCREATE SESSION\n" + util.inspect(newSessionObj, {
    showHidden: false,
    depth: 1
  })));

  var namespace = newSessionObj.namespace;
  var socket = newSessionObj.socket;
  var socketId = newSessionObj.socket.id;
  var ipAddress = newSessionObj.socket.handshake.headers["x-real-ip"] || newSessionObj.socket.client.conn.remoteAddress;
  // var clientHostname = newSessionObj.socket.handshake.headers.host;
  // var domain = "UNKNOWN";

  numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;

  var sessionObj = new Session({
    sessionId: socketId,
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

  if (newSessionObj.tags) { sessionObj.tags = newSessionObj.tags; }

  if (newSessionObj.user) { sessionObj.userId = newSessionObj.user.userId; }

  sessionObj.config.type = newSessionObj.type;
  sessionObj.config.mode = newSessionObj.mode;

  sessionCache.set(sessionObj.sessionId, sessionObj);

  debug(chalkSession("\nNEW SESSION\n" + util.inspect(sessionObj, {
    showHidden: false,
    depth: 1
  })));

  sessionQueue.enqueue({
    sessionEvent: "SESSION_CREATE",
    session: sessionObj
  });

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
    sessionQueue.enqueue({
      sessionEvent: "SOCKET_ERROR",
      sessionId: socket.id,
      error: error
    });
  });

  socket.on("reconnect", function() {
    statsObj.socket.reconnects += 1;
    sessionObj.connected = true;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
    sessionQueue.enqueue({
      sessionEvent: "SOCKET_RECONNECT",
      sessionId: socket.id
    });
  });

  socket.on("disconnect", function(status) {
    statsObj.socket.disconnects += 1;

    debug(chalkDisconnect(moment().format(compactDateTimeFormat) 
      + " | SOCKET DISCONNECT: " + socket.id + "\nstatus\n" + jsonPrint(status)
    ));

    var sObj = sessionCache.get(socket.id);

    if (sObj) {
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

  socket.on("REQ_ADMIN_SESSION", function(options) {
    debug(chalkAdmin(moment().format(compactDateTimeFormat) 
      + " | REQ_ADMIN_SESSION: " + socketId 
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
      + " | REQ_USER_SESSION: " + socketId 
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
      + " | REQ_VIEWER_SESSION: " + socketId 
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
      + " | REQ_UTIL_SESSION: " + socketId 
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

    var sObj = sessionCache.get(socket.id);

    if (!sObj) {
      debug(chalkError(moment().format(compactDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON ADMIN READY | " + socket.id));
      return;
    }

    debug(chalkConnect("--- ADMIN READY   | " + adminObj.adminId 
      + " | SID: " + sObj.sessionId + " | " + moment().format(compactDateTimeFormat)));

    sessionQueue.enqueue({
      sessionEvent: "ADMIN_READY",
      session: sObj,
      admin: adminObj
    });
  });

  socket.on("VIEWER_READY", function(viewerObj) {

    console.log(chalkViewer("VIEWER READY\n" + jsonPrint(viewerObj)));

    var sObj = sessionCache.get(socket.id);

    if (!sObj) {
      debug(chalkError(moment().format(compactDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON VIEWER READY | " + socket.id));
      return;
    }
    debug(chalkConnect("--- VIEWER READY   | " + viewerObj.userId 
      + " | SID: " + sObj.sessionId 
      + " | " + moment().format(compactDateTimeFormat)));

    sessionQueue.enqueue({
      sessionEvent: "VIEWER_READY",
      session: sObj,
      viewer: viewerObj
    });
  });

  socket.on("SESSION_KEEPALIVE", function(userObj) {

    if (statsObj.utilities[userObj.userId] === undefined) {
      statsObj.utilities[userObj.userId] = {};
    }

    statsObj.socket.SESSION_KEEPALIVES += 1;

    debug(chalkUser("SESSION_KEEPALIVE | " + userObj.userId));
    debug(chalkUser("SESSION_KEEPALIVE\n" + jsonPrint(userObj)));

    if (userObj.stats) {statsObj.utilities[userObj.userId] = userObj.stats;}

    if (userObj.userId.match(/TMS_/g)){
      tmsServer = userObj.userId;
      debug(chalkSession("K-" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + userObj.stats.tweetsPerMinute.toFixed(0) + " TPM"
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    if (userObj.userId.match(/TSS_/g)){
      tssServer = userObj.userId;
      debug(chalkSession("K-" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + userObj.stats.tweetsPerMinute.toFixed(0) + " TPM"
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    var sObj;

    if ((userObj.tags !== undefined)
      && (userObj.tags.mode !== undefined) 
      && (userObj.tags.mode === "substream")) {
      debug(chalkRedBold("KEEPALIVE socket.id: " + socket.id));
      sObj = sessionCache.get(socket.id + "#" + userObj.tags.entity);
    }
    else {
      debug(chalkRedBold("KEEPALIVE socket.id: " + socket.id));
      sObj = sessionCache.get(socket.id);
    }

    if (!sObj) {
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
          return;
        }

      }
      else {
        debug(chalkInfo("SESSION_KEEPALIVE"));
        return;
       }

    }

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
  });

  socket.on("USER_READY", function(userObj) {

    primarySessionObj = sessionCache.get(socket.id);

    var sessionCacheKey = socket.id ;

    statsObj.socket.USER_READYS += 1;

    console.log(chalkUser("R< U RDY"
      + " | " + moment().format(compactDateTimeFormat) 
      + "  " + userObj.nodeId
      + "  ID " + userObj.userId
      + "  N " + userObj.name
      + "  E " + userObj.tags.entity
      + "  C " + userObj.tags.channel
      + "  T " + userObj.type
      + "  M " + userObj.mode
      // + "\nU " + userObj.url
      // + "\nP " + userObj.profileImageUrl
    ));

    if ((userObj.tags !== undefined)
      && (userObj.tags.entity !== undefined) 
      && (userObj.tags.mode !== undefined) 
      && (userObj.tags.mode.toLowerCase() === "substream")) {

      sessionCacheKey = socket.id + "#" + userObj.tags.entity;

      debug(chalkRedBold("USER_READY SUBSTREAM sessionCacheKey: " + sessionCacheKey));

      sessionUpdateDbCache(sessionCacheKey, socket, userObj);
    }
    else {
      debug(chalkRedBold("USER_READY sessionCacheKey: " + sessionCacheKey));
      sessionUpdateDbCache(sessionCacheKey, socket, userObj);
    }

  });

  socket.on("node", function(rxNodeObj) {

    debug("TW< " + rxNodeObj.nodeType 
      + " | NID " + rxNodeObj.nodeId 
      + " | Ms " + rxNodeObj.mentions
      + " | KWs " + jsonPrint(rxNodeObj.keywords)
    );

    checkKeyword(rxNodeObj, function(nodeObj){

      debug(chalkAlert("NODE | checkKeyword\n" + jsonPrint(nodeObj)));

      var obamaHit = false;
      var trumpHit = false;
      var wsObj;

      switch (nodeObj.nodeType) {

        case "tweet":
          if (nodeObj.text.toLowerCase().includes("obama")) {
            obamaHit = nodeObj.text;
            nodeObj.isKeyword = true;
            // nodeObj.keywords[nodeObj.text.toLowerCase()].left = DEFAULT_KEYWORD_VALUE;
            nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
            debug(chalkError("OBAMA: " + nodeObj.text));
          }
          if (nodeObj.text.toLowerCase().includes("trump")) {
            trumpHit = nodeObj.text;
            nodeObj.isKeyword = true;
            // nodeObj.keywords[nodeObj.text.toLowerCase()].right = DEFAULT_KEYWORD_VALUE;
            nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            debug(chalkError("TRUMP: " + nodeObj.text));
          }
          viewNameSpace.emit("node", nodeObj);
        break;

        case "user":
          if (!nodeObj.name && !nodeObj.screenName) {
            console.log(chalkError("NODE NAME & SCREEN NAME UNDEFINED?\n" + jsonPrint(nodeObj)));
          }
          else if (nodeObj.name) {
            nodeObj.isTwitterUser = true;
            if (nodeObj.name.toLowerCase().includes("obama")) {
              obamaHit = nodeObj.name;
              nodeObj.isKeyword = true;
              // nodeObj.keywords[nodeObj.name.toLowerCase()] = {};
              nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
            }
            if (nodeObj.name.toLowerCase().includes("trump")) {
              trumpHit = nodeObj.name;
              nodeObj.isKeyword = true;
              // nodeObj.keywords[nodeObj.name.toLowerCase()] = {};
              nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            }
            viewNameSpace.emit("node", nodeObj);
          }
          else if (nodeObj.screenName){

            if (nodeObj.screenName.toLowerCase().includes("obama")) {
              obamaHit = nodeObj.screenName;
              nodeObj.isKeyword = true;
              // nodeObj.keywords[nodeObj.screenName.toLowerCase()] = {};
              nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
            }
            if (nodeObj.screenName.toLowerCase().includes("trump")) {
              trumpHit = nodeObj.screenName;
              nodeObj.isKeyword = true;
              // nodeObj.keywords[nodeObj.screenName.toLowerCase()] = {};
              nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            }
            viewNameSpace.emit("node", nodeObj);
          }
        break;

        case "hashtag":
          if (nodeObj.nodeId.toLowerCase().includes("obama")) {
            obamaHit = nodeObj.nodeId;
            nodeObj.isKeyword = true;
            // nodeObj.keywords[nodeObj.nodeId.toLowerCase()] = {};
            nodeObj.keywords.left = DEFAULT_KEYWORD_VALUE;
            debug(chalkError("OBAMA HT: " + nodeObj.nodeId));
          }
          if (nodeObj.nodeId.toLowerCase().includes("trump")) {
            trumpHit = nodeObj.nodeId;
            nodeObj.isKeyword = true;
            // nodeObj.keywords[nodeObj.nodeId.toLowerCase()] = {};
            nodeObj.keywords.right = DEFAULT_KEYWORD_VALUE;
            debug(chalkError("TRUMP HT: " + nodeObj.nodeId));
          }
          updateWordMeter({nodeId: nodeObj.nodeId.toLowerCase()});
          viewNameSpace.emit("node", nodeObj);
        break;

        default:
          viewNameSpace.emit("node", nodeObj);
      }

      if (obamaHit) {

        wordStats.meter("obamaPerSecond").mark();
        wordStats.meter("obamaPerMinute").mark();

        wsObj = wordStats.toJSON();

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

        wsObj = wordStats.toJSON();

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

  socket.on("RESPONSE_WORD_OBJ", function(rxInObj) {

    var wsObj;

    debug("rxInObj\n" + jsonPrint(rxInObj));

    wordStats.meter("wordsPerSecond").mark();
    wordStats.meter("wordsPerMinute").mark();

    if (rxInObj.nodeId.includes("obama")) {
 
      wordStats.meter("obamaPerSecond").mark();
      wordStats.meter("obamaPerMinute").mark();

      wsObj = wordStats.toJSON();

      debug(chalkAlert("OBAMA"
        + " | " + wsObj.obamaPerSecond["1MinuteRate"].toFixed(0) 
        + " | " + wsObj.obamaPerSecond.currentRate.toFixed(0) 
        + " | " + wsObj.obamaPerMinute["1MinuteRate"].toFixed(0) 
        + " | " + wsObj.obamaPerMinute.currentRate.toFixed(0) 
        + " | " + rxInObj.nodeId
      ));

    }

    if (rxInObj.nodeId.includes("trump")) {
 
      wordStats.meter("trumpPerSecond").mark();
      wordStats.meter("trumpPerMinute").mark();

      wsObj = wordStats.toJSON();

      debug(chalkAlert("TRUMP"
        + " | " + wsObj.trumpPerSecond["1MinuteRate"].toFixed(0) 
        + " | " + wsObj.trumpPerSecond.currentRate.toFixed(0) 
        + " | " + wsObj.trumpPerMinute["1MinuteRate"].toFixed(0) 
        + " | " + wsObj.trumpPerMinute.currentRate.toFixed(0) 
        + " | " + rxInObj.nodeId
      ));

    }

    if (responseQueue.size() < MAX_RESPONSE_QUEUE_SIZE) {

      var responseInObj = rxInObj;

      if (rxInObj.tags.mode === "substream") {
        responseInObj.socketId = socket.id + "#" + rxInObj.tags.entity;
        debug("SUBS" 
          + "\n" + jsonPrint(rxInObj.tags)
        );
      }
      else {
        responseInObj.socketId = socket.id;
      }

      responseQueue.enqueue(responseInObj);
    }
  });

  socket.on("GET_SESSION", function(sessionId) {

    // var getSessionSession = sessionCache.get(socket.id);

    debug(chalkTest("RX GET_SESSION | " + sessionId 
      + " | CHAIN LIMIT: " + SESSION_WORDCHAIN_REQUEST_LIMIT));
    findSessionById(sessionId, function(err, sessionObj) {
      if (err) {
        console.log(chalkError("findSessionById ERROR\n" + jsonPrint(err)));
      } 
      else if (sessionObj) {

        // var wordChainIndex = 0;
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

  socket.on("BHT_REQUESTS", function(deltaReqs) {
    console.log(chalkBht("RX BHT_REQUESTS"
    + " | " + socket.id
    + " | DELTA: " + deltaReqs
    ));
    incrementSocketBhtReqs(deltaReqs);
  });

  socket.on("MW_REQUESTS", function(deltaReqs) {
    console.log(chalkMw("RX MW_REQUESTS"
    + " | " + socket.id
    + " | DELTA: " + deltaReqs
    ));
    incrementSocketMwReqs(deltaReqs);
  });

  socket.on("SOCKET_TEST_MODE", function(testMode) {

    debug(chalkTest("RX SOCKET_TEST_MODE: " + testMode));
    serverSessionConfig.testMode = testMode;
    serverSessionConfig.socketId = socket.id;
    testUsersNameSpace.emit("SOCKET_TEST_MODE", serverSessionConfig);
  });
}

function setWordCacheTtl(value) {
  debug(chalkWarn("SET WORD CACHE TTL: PREV: " + wordCacheTtl + " | NOW: " + value));
  wordCacheTtl = parseInt(value);
  updateStats({
    wordCacheTtl: wordCacheTtl
  });
}

setTimeout(function(){
  if (true) {

    console.log(chalkInfo("INIT SOCKET NAMESPACES"));

    io = require("socket.io")(httpServer, { reconnection: false });

    adminNameSpace = io.of("/admin");
    utilNameSpace = io.of("/util");
    userNameSpace = io.of("/user");
    viewNameSpace = io.of("/view");
    testUsersNameSpace = io.of("/test-user");
    testViewersNameSpace = io.of("/test-view");

    adminNameSpace.on("connect", function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("ADMIN CONNECT"));
      createSession({
        namespace: "admin",
        socket: socket,
        type: "ADMIN",
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
        type: "UTIL",
        mode: "UNKNOWN",
        tags: {}
      });
    });

    userNameSpace.on("connect", function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("USER CONNECT"));
      createSession({
        namespace: "user",
        socket: socket,
        type: "UTIL",
        mode: "UNKNOWN",
        tags: {}
      });
    });

    viewNameSpace.on("connect", function(socket) {
      socket.setMaxListeners(0);
      console.log(chalkAdmin("VIEWER CONNECT"));
      createSession({
        namespace: "view",
        socket: socket,
        type: "VIEWER",
        tags: {}
      });
    });

    testUsersNameSpace.on("connect", function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("TEST USER CONNECT"));
      createSession({
        namespace: "test-user",
        socket: socket,
        type: "TEST_USER",
        tags: {}
      });
    });

    testViewersNameSpace.on("connect", function(socket) {
      socket.setMaxListeners(0);
      debug(chalkAdmin("TEST VIEWER CONNECT"));
      createSession({
        namespace: "test-view",
        socket: socket,
        type: "TEST_VIEWER",
        tags: {}
      });
    });

    ioReady = true;
  }
}, 500);

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

function updatePromptResponseMetric(sessionUpdateObj) {
  debug("PROMPT-RESPONSE RATE FIFO PUSH: NOW: " + getTimeNow() 
    + " | PROMPT-RESPONSE SESSION: " + sessionUpdateObj.sessionId);
  responseRate1minQ.enqueue(moment.utc());
}

var statsCountsComplete = true;

function updateStatsCounts() {

  if (statsCountsComplete) {

    statsCountsComplete = false;

    User.count({}, function(err, count) {
      if (!err) {
        // debug("TOTAL USERS: " + count);
        totalUsers = count;
        updateStats({
          totalUsers: totalUsers
        });

        Session.count({}, function(err, count) {
          if (!err) {
            // debug("TOTAL SESSIONS: " + count);
            totalSessions = count;
            updateStats({
              totalSessions: totalSessions
            });

            Word.count({}, function(err, count) {
              statsCountsComplete = true;
              if (!err) {
                // debug("TOTAL WORDS: " + count);
                totalWords = count;
                updateStats({
                  totalWords: totalWords
                });

                Group.count({}, function(err, count) {
                  statsCountsComplete = true;
                  if (!err) {
                    // debug("TOTAL WORDS: " + count);
                    totalGroups = count;
                    updateStats({
                      totalGroups: totalGroups
                    });

                    Entity.count({}, function(err, count) {
                      statsCountsComplete = true;
                      if (!err) {
                        // debug("TOTAL WORDS: " + count);
                        totalEntities = count;
                        updateStats({
                          totalEntities: totalEntities
                        });
                        return;
                      } else {
                        debug(chalkError("\n*** DB Entity.count ERROR *** | " 
                          + moment().format(compactDateTimeFormat) + "\n" + err));
                        return;
                      }
                    });

                  } else {
                    debug(chalkError("\n*** DB Group.count ERROR *** | " 
                      + moment().format(compactDateTimeFormat) + "\n" + err));
                    return;
                  }
                });

              } else {
                debug(chalkError("\n*** DB Word.count ERROR *** | " 
                  + moment().format(compactDateTimeFormat) + "\n" + err));
                return;
              }
            });

          } else {
            debug(chalkError("\n*** DB Session.count ERROR *** | " 
              + moment().format(compactDateTimeFormat) + "\n" + err));
            return;
          }
        });
      } else {
        debug(chalkError("\n*** DB User.count ERROR *** | " 
          + moment().format(compactDateTimeFormat) + "\n" + err));
        return;
      }
    });

  }
}

var updateSessionViewQueue = [];

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
      // console.log("readUpdateSessionViewQueue | sessionSmallObj.tags\n" + jsonPrint(sessionSmallObj.tags));
    }

    sessionSmallObj.source.nodeId = updateObj.source.nodeId;
    sessionSmallObj.source.raw = updateObj.source.raw;
    sessionSmallObj.source.isIgnored = updateObj.source.isIgnored;
    sessionSmallObj.source.isTrendingTopic = updateObj.source.isTrendingTopic;
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
      sessionSmallObj.target.raw = updateObj.target.raw;
      sessionSmallObj.target.isIgnored = updateObj.target.isIgnored;
      sessionSmallObj.target.isTrendingTopic = updateObj.target.isTrendingTopic;
      sessionSmallObj.target.isKeyword = updateObj.target.isKeyword;
      sessionSmallObj.target.keywords = {};
      sessionSmallObj.target.url = updateObj.target.url;
      sessionSmallObj.target.wordChainIndex = updateObj.target.wordChainIndex;
      sessionSmallObj.target.links = {};
      sessionSmallObj.target.mentions = updateObj.target.mentions;

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

setInterval(function() {

  if (updateSessionViewReady && (updateSessionViewQueue.length > 0)) {

    updateSessionViewReady = false;

    var sessionUpdateObj = updateSessionViewQueue.shift();

    updateStatsCounts();

    // var sessionSmallObj;

    createSmallSessionUpdateObj(sessionUpdateObj, function(sessionSmallObj){

      var key = sessionSmallObj.tags.entity + "_" + sessionSmallObj.tags.channel;

      if (monitorHashMap[key] && sessionSmallObj.action === "RESPONSE"){
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

      viewNameSpace.emit("SESSION_UPDATE", sessionSmallObj);
      testViewersNameSpace.emit("SESSION_UPDATE", sessionSmallObj);

      updateStats({ sessionUpdatesSent: sessionUpdatesSent });
      updatePromptResponseMetric(sessionSmallObj);

      sessionUpdatesSent += 1;
      updateSessionViewReady = true;

    });

  }
}, 20);


function updateSessionViews(sessionUpdateObj) {

  var obj = {};
  obj = sessionUpdateObj;

  if (obj.source !== undefined) {
    obj.source.mwEntry = null;
    obj.source.noun = null;
    obj.source.verb = null;
    obj.source.adverb = null;
    obj.source.adjective = null;
  }
  if (obj.target !== undefined) {
    obj.target.mwEntry = null;
    obj.target.noun = null;
    obj.target.verb = null;
    obj.target.adverb = null;
    obj.target.adjective = null;
  }

  if (entityChannelGroupHashMap.has(obj.tags.entity)){
    obj.tags.group = entityChannelGroupHashMap.get(obj.tags.entity);
    updateSessionViewQueue.push(obj);
  }
  else if (obj.tags.entity !== undefined) {
    statsObj.entityChannelGroup.hashMiss[obj.tags.entity] = 1;
    statsObj.entityChannelGroup.allHashMisses[obj.tags.entity] = 1;
  }
}

// BHT
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
        + " | CREATED: " + moment(group.createdAt).format(compactDateTimeFormat)
        + " | LAST: " + moment(group.lastSeen).format(compactDateTimeFormat)
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
      debug("->- DB EN" 
        + " | " + entity.entityId 
        + " | " + entity.name 
        // + " | SN: " + entity.screenName 
        + " | G: " + entity.groupId
        + " | C: " + entity.tags.channel
        + " | S: " + entity.sessions 
        + " | Ws: " + entity.words 
        + " | CR: " + moment(entity.createdAt).format(compactDateTimeFormat)
        + " | L: " + moment(entity.lastSeen).format(compactDateTimeFormat)
        + " | Ms: " + entity.mentions 
      );

      callback(null, entity);
    }
  });
}

function bhtHttpGet(host, path, wordObj, callback) {

  http.get({
    host: host,
    path: path
  }, function(response) {

    debug("bhtHttpGet: " + host + "/" + path);

    response.on("error", function(err) {
      bhtErrors += 1;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage 
        + "\n" + util.inspect(err, {
          showHidden: false,
          depth: 3
        })
      ));
      callback("BHT_ERROR | " + err, wordObj);
      return;
    });

    var body = "";
    var status = "";

    if ((response.statusCode === 500) && (response.statusMessage === "Usage Exceeded")) {
      bhtErrors += 1;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage
        // + "\n" + util.inspect(response, {showHidden: false, depth: 3})
      ));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
    } 
    else if ((response.statusCode === 500) && (response.statusMessage === "Inactive key")) {
      bhtErrors += 1;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage 
        + "\n" + util.inspect(response, {
        showHidden: false,
        depth: 3
      })));
      bhtEvents.emit("BHT_INACTIVE_KEY", bhtRequests);
      callback("BHT_INACTIVE_KEY", wordObj);
    } 
    else if (bhtOverLimitTestFlag) {
      debug(chalkBht("BHT OVER LIMIT TEST FLAG SET"));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
    } 
    else if (response.statusCode === 404) {
      debug("bhtHttpGet: \"" + wordObj.nodeId + "\" NOT FOUND");
      wordObj.bhtSearched = true;
      wordObj.bhtFound = false;
      wordServer.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
        if (err) { console.log(chalkError("WORD FINDONE ERROR\n" + jsonPrint(err))); }
        debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " + wordUpdatedObj.nodeId 
          + " | MNS: " + wordUpdatedObj.mentions));
        debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
        callback("BHT_NOT_FOUND", wordUpdatedObj);
      });
    } 
    else if (response.statusCode === 303) {
      wordObj.bhtAlt = response.statusMessage;
      debug(chalkBht("BHT REDIRECT" + " | WORD: " + wordObj.nodeId 
      + " | ALT: " + response.statusMessage // alternative word
        + " | " + response.headers.location
      ));
      wordServer.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
        if (err) {
          console.log(chalkError("bhtHttpGet: findOneWord: DB ERROR\n" + "\n" + util.inspect(err, {
            showHidden: false,
            depth: 3
          })));
          callback("BHT_ERROR | " + err, wordObj);
        } 
        else {
          debug(chalkBht("bhtHttpGet: ->- DB ALT UPDATE | " + wordUpdatedObj.nodeId 
          + " | ALT: " + wordUpdatedObj.bhtAlt // alternative word
            + " | MNS: " + wordUpdatedObj.mentions
          ));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback("BHT_REDIRECT", wordUpdatedObj);
        }
      });
    } 
    else if (response.statusCode !== 200) {
      bhtErrors += 1;
      debug(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors 
        + " | WORD: " + wordObj.nodeId 
        + " | STATUS CODE: " + response.statusCode 
        + " | STATUS MESSAGE: " + response.statusMessage 
        + "\n" + util.inspect(response, {
        showHidden: false,
        depth: 3
      })));
      bhtEvents.emit("BHT_UNKNOWN_STATUS", bhtRequests);
      callback("BHT_UNKNOWN_STATUS", wordObj);
    } 
    else {
      response.on("data", function(d) {
        body += d;
      });

      response.on("end", function() {

        if (body !== "") {
          var parsed = JSON.parse(body);
          debug("bhtHttpGet: " + JSON.stringify(parsed, null, 3));
          if (parsed.noun !== null) {wordObj.noun = parsed.noun;}
          if (parsed.verb !== null) {wordObj.verb = parsed.verb;}
          if (parsed.adjective !== null) {wordObj.adjective = parsed.adjective;}
          if (parsed.adverb !== null) {wordObj.adverb = parsed.adverb;}
          status = "BHT_HIT";
          wordObj.bhtSearched = true;
          wordObj.bhtFound = true;
        } else {
          debug("bhtHttpGet: \"" + wordObj.nodeId + "\" NOT FOUND");
          status = "BHT_MISS";
          wordObj.bhtSearched = true;
          wordObj.bhtFound = false;
        }

        wordServer.findOneWord(wordObj, true, function(err, wordUpdatedObj) {
          if (err) { console.log(chalkError("WORD FINDONE ERROR\n" + jsonPrint(err))); }
          debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " + wordUpdatedObj.nodeId 
            + " | MNS: " + wordUpdatedObj.mentions));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback(status, wordUpdatedObj);
        });
      });
    }
  }).on("error", function(e) {
    bhtErrors += 1;
    debug(chalkError("BHT ERROR" 
      + " | TOTAL ERRORS: " + bhtErrors 
      + " | WORD: " + wordObj.nodeId
      // + " | STATUS CODE: " + response.statusCode
      // + " | STATUS MESSAGE: " + response.statusMessage
      + "\n" + util.inspect(e, {
        showHidden: false,
        depth: 3
      })
    ));
    callback("BHT_ERROR", wordObj);
  });
}

function bhtSearchWord(wordObj, callback) {

  if (wordObj.bhtFound) {
    callback("BHT_FOUND", wordObj);
  } 
  else if (bhtOverLimitFlag) {
    var now = moment.utc();
    now.utcOffset("-07:00");
    debug(chalkBht("*** BHT OVER LIMIT" 
      + " | LIMIT: " + BHT_REQUEST_LIMIT 
      + " | REQS: " + bhtRequests 
      + " | OVER: " + bhtOverLimitTime.format(compactDateTimeFormat) 
      + " | RESET: " + bhtLimitResetTime.format(compactDateTimeFormat) 
      + " | REMAIN: " + msToTime(bhtLimitResetTime.diff(now))
    ));
    callback("BHT_OVER_LIMIT", wordObj);
  } 
  else {
    incrementSocketBhtReqs(1);
    debug(chalkBht(">>> BHT SEARCH (before replace): " + wordObj.nodeId));
    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, " ");
    wordObj.nodeId = wordObj.nodeId.replace(/[\n\r{}<>\/;:"`~?!@#$%\^&*()_+=.,]+/g, "");
    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, " ");
    wordObj.nodeId = wordObj.nodeId.replace(/^-+|-+$/g, "");
    wordObj.nodeId = wordObj.nodeId.replace(/^\s+|\s+$/g, "");
    wordObj.nodeId = wordObj.nodeId.replace(/^"+/g, "");
    wordObj.nodeId = wordObj.nodeId.replace(/"+/g, "'");
    wordObj.nodeId = wordObj.nodeId.toLowerCase();
    debug(chalkBht(">>> BHT SEARCH (after replace):  " + wordObj.nodeId));

    var bhtHost = "words.bighugelabs.com";
    var bhtPath = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(wordObj.nodeId) + "/json";

    bhtHttpGet(bhtHost, bhtPath, wordObj, function(status, bhtResponseObj) {
      if (status === "BHT_REDIRECT") {
        var pathRedirect = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(bhtResponseObj.bhtAlt) + "/json";
        bhtHttpGet(bhtHost, pathRedirect, bhtResponseObj, function(statusRedirect, responseRedirectObj) {
          callback(statusRedirect, responseRedirectObj);
        });
      } 
      else {
        callback(status, bhtResponseObj);
      }
    });
  }
}

function dbUpdateWord(wObj, incMentions, callback) {

  if ((wObj.nodeId === null) || (wObj.nodeId === undefined)) {
    debug(chalkError("\n***** dbUpdateWord: NULL OR UNDEFINED nodeId\n" + jsonPrint(wObj)));
    return(callback("NULL OR UNDEFINED nodeId", wObj));
  }

  checkKeyword(wObj, function(wordObj){

    wordServer.findOneWord(wordObj, incMentions, function(err, word) {
      if (err) {
        console.log(chalkError("dbUpdateWord -- > findOneWord ERROR" 
          + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
        callback(err, wordObj);
      } 
      else {

        debug("> DB UPDATE | " 
          + word.nodeId 
          + " | I " + word.isIgnored 
          + " | K " + word.isKeyword 
          + " | TT " + word.isTrendingTopic 
          + " | M " + word.mentions 
          + "\nKW: " + jsonPrint(word.keywords) 
        );

        debug(JSON.stringify(word, null, 3));

        if (!word.bhtSearched) { // not yet bht searched
          debug("word.bhtSearched: " + word.bhtSearched);

          bhtSearchWord(word, function(status, bhtResponseObj) {
            if (status.indexOf("BHT_OVER_LIMIT") >= 0) {
              debug(chalkError("bhtSearchWord BHT OVER LIMI"));
              debug("Word CACHE SET1: " + word.nodeId);
              wordCache.set(word.nodeId, word);
              callback("BHT_OVER_LIMIT", word);
            } 
            else if (status.indexOf("BHT_ERROR") >= 0) {
              debug(chalkError("bhtSearchWord dbUpdateWord findOneWord ERROR\n" + JSON.stringify(status)));
              debug("Word CACHE SET2: " + word.nodeId);
              wordCache.set(word.nodeId, word);
              callback("BHT_ERROR", word);
            } 
            else if (bhtResponseObj.bhtFound) {
              debug(chalkBht("-*- BHT HIT   | " + bhtResponseObj.nodeId));
              debug("Word CACHE SET3: " + bhtResponseObj.nodeId);
              wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
              callback("BHT_HIT", bhtResponseObj);
            } 
            else if (status === "BHT_REDIRECT") {
              debug(chalkBht("-A- BHT REDIRECT  | " + wordObj.nodeId));
              debug("Word CACHE SET4: " + bhtResponseObj.nodeId);
              wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
              callback("BHT_REDIRECT", bhtResponseObj);
            } 
            else {
              debug(chalkBht("-O- BHT MISS  | " + wordObj.nodeId));
              debug("Word CACHE SET5: " + bhtResponseObj.nodeId);
              wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
              bhtWordsMiss[word.nodeId] = word.nodeId;
              callback("BHT_MISS", bhtResponseObj);
            }
          });
        } 
        else if (word.bhtFound) {
          debug(chalkBht("-F- BHT FOUND | " + word.nodeId));
          debug("Word CACHE SET6: " + word.nodeId);
          wordCache.set(word.nodeId, word);
          callback("BHT_FOUND", word);
        } 
        else {
          debug(chalkBht("-N- BHT NOT FOUND  | " + word.nodeId));
          debug("Word CACHE SET7: " + word.nodeId);
          wordCache.set(word.nodeId, word);
          bhtWordsNotFound[word.nodeId] = word.nodeId;
          callback("BHT_NOT_FOUND", word);
        }
      }
    });
  });
}


wapiEvents.on("WAPI_OVER_LIMIT_TIMEOUT", function() {
  if (wapiOverLimitFlag) {
    debug(chalkWapi("*** WAPI_OVER_LIMIT_TIMEOUT END *** | " 
      + moment().format(compactDateTimeFormat)));
  } 
  else {
    debug(chalkWapi(" WAPI_OVER_LIMIT_TIMEOUT END (NO OVER LIMIT) | " 
      + moment().format(compactDateTimeFormat)));
  }

  wapiOverLimitFlag = false;
  wapiOverLimitTime = moment.utc();

  wapiLimitResetTime = moment.utc();
  wapiLimitResetTime.endOf("day");

  updateStats({
    wapiRequests: wapiRequests,
    wapiOverLimitTime: wapiOverLimitTime,
    wapiLimitResetTime: wapiLimitResetTime,
    wapiOverLimitFlag: wapiOverLimitFlag
  });

  wapiTimeToReset = wapiLimitResetTime.valueOf() - wapiOverLimitTime.valueOf();

  clearTimeout(wapiOverLimitTimeOut);

  wapiOverLimitTimeOut = setTimeout(function() {
    wapiEvents.emit("WAPI_OVER_LIMIT_TIMEOUT");
  }, wapiTimeToReset);
});

wapiEvents.on("WAPI_OVER_LIMIT", function() {

  io.of(adminNameSpace).emit("WAPI_OVER_LIMIT", wapiRequests);
  io.of(utilNameSpace).emit("WAPI_OVER_LIMIT", wapiRequests);
  io.of(testUsersNameSpace).emit("WAPI_OVER_LIMIT", wapiRequests);
  io.of(userNameSpace).emit("WAPI_OVER_LIMIT", wapiRequests);

  wapiOverLimits += 1;
  wapiOverLimitFlag = true;
  wapiOverLimitTime = moment.utc();
  wapiLimitResetTime = moment.utc();
  wapiLimitResetTime.endOf("day");

  wapiTimeToReset = wapiLimitResetTime.valueOf() - wapiOverLimitTime.valueOf();

  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | " + wapiRequests + " REQUESTS"));
  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | WAPI OVER LIMIT TIME:      " + wapiOverLimitTime.format(compactDateTimeFormat)));
  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | WAPI LIMIT RESET TIME:     " + wapiLimitResetTime.format(compactDateTimeFormat)));
  debug(chalkWapi("wapiSearchWord: *** OVER LIMIT *** | WAPI OVER LIMIT REMAINING: " + msToTime(wapiTimeToReset)));

  debug("SET WAPI REQUESTS TO LIMIT: " + statsObj.wapi.requestLimit);
  wapiRequests = statsObj.wapi.requestLimit;
  debug("SET wapiOverLimitTimeOut = " + msToTime(wapiTimeToReset) + " | " + wapiTimeToReset + " ms");

  updateStats({
    "wapiOverLimits": wapiOverLimits,
    "wapiOverLimitTime": wapiOverLimitTime,
    "wapiOverLimitFlag": wapiOverLimitFlag,
    "wapiRequests": statsObj.wapi.requestLimit
  });

  clearTimeout(wapiOverLimitTimeOut);

  wapiOverLimitTimeOut = setTimeout(function() {
    wapiEvents.emit("WAPI_OVER_LIMIT_TIMEOUT");
  }, wapiTimeToReset);
});

function setBhtReqs(value) {
  debug(chalkInfo("SET BHT REQS: PREV: " + bhtRequests + " | NOW: " + value));
  bhtRequests = parseInt(value);
  updateStats({
    bhtRequests: bhtRequests
  });
}

bhtEvents.on("BHT_OVER_LIMIT_TIMEOUT", function() {
  if (bhtOverLimitFlag) {
    debug(chalkBht("*** BHT_OVER_LIMIT_TIMEOUT END *** | " 
      + moment().format(compactDateTimeFormat)));
  } 
  else {
    debug(chalkBht(" BHT_OVER_LIMIT_TIMEOUT END (NO OVER LIMIT) | " 
      + moment().format(compactDateTimeFormat)));
  }

  bhtOverLimitFlag = false;
  bhtOverLimitTestFlag = false;
  setBhtReqs(0);

  bhtOverLimitTime = moment.utc();
  bhtOverLimitTime.utcOffset("-07:00");

  bhtLimitResetTime = moment.utc();
  bhtLimitResetTime.utcOffset("-07:00");
  bhtLimitResetTime.endOf("day");

  updateStats({
    bhtRequests: bhtRequests,
    bhtOverLimitTime: bhtOverLimitTime,
    bhtLimitResetTime: bhtLimitResetTime,
    bhtOverLimitFlag: bhtOverLimitFlag
  });

  bhtTimeToReset = bhtLimitResetTime.valueOf() - bhtOverLimitTime.valueOf();

  clearTimeout(bhtOverLimitTimeOut);

  bhtOverLimitTimeOut = setTimeout(function() {
    bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
  }, bhtTimeToReset);
});

bhtEvents.on("BHT_OVER_LIMIT", function() {

  io.of(adminNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
  io.of(utilNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
  io.of(testUsersNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);
  io.of(userNameSpace).emit("BHT_OVER_LIMIT", bhtRequests);

  bhtOverLimits += 1;
  bhtOverLimitFlag = true;
  bhtOverLimitTestFlag = false;

  bhtOverLimitTime = moment.utc();
  bhtOverLimitTime.utcOffset("-07:00");

  bhtLimitResetTime = moment.utc();
  bhtLimitResetTime.utcOffset("-07:00");
  bhtLimitResetTime.endOf("day");

  // bhtTimeToReset = moment(bhtLimitResetTime);
  // bhtTimeToReset.subtract(bhtOverLimitTime);
  bhtTimeToReset = bhtLimitResetTime.valueOf() - bhtOverLimitTime.valueOf();

  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | " + bhtRequests + " REQUESTS"));
  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT OVER LIMIT TIME:      " + bhtOverLimitTime.format(compactDateTimeFormat)));
  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT LIMIT RESET TIME:     " + bhtLimitResetTime.format(compactDateTimeFormat)));
  debug(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT OVER LIMIT REMAINING: " + msToTime(bhtTimeToReset)));

  debug("SET BHT REQUESTS TO LIMIT: " + BHT_REQUEST_LIMIT);
  bhtRequests = BHT_REQUEST_LIMIT;
  debug("SET bhtOverLimitTimeOut = " + msToTime(bhtTimeToReset) + " | " + bhtTimeToReset + " ms");

  updateStats({
    "bhtOverLimits": bhtOverLimits,
    "bhtOverLimitTime": bhtOverLimitTime,
    "bhtOverLimitFlag": bhtOverLimitFlag,
    "bhtRequests": BHT_REQUEST_LIMIT
  });

  clearTimeout(bhtOverLimitTimeOut);

  bhtOverLimitTimeOut = setTimeout(function() {
    bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
  }, bhtTimeToReset);
});

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
      "connectTime": sessionObj.connectTime,
      "disconnectTime": sessionObj.disconnectTime
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
          + " | " + ses.sessionId 
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
            + " | LS: " + moment(group.lastSeen).format(compactDateTimeFormat)
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

      statsObj.group.hashMiss[entityObj.groupId] = 1;
      statsObj.group.allHashMisses[entityObj.groupId] = 1;

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
      ));
      statsObj.entityChannelGroup.hashMiss[userObj.tags.entity.toLowerCase()] = 1;
      statsObj.entityChannelGroup.allHashMisses[userObj.tags.entity.toLowerCase()] = 1;
      configEvents.emit("HASH_MISS", {type: "entity", value: userObj.tags.entity.toLowerCase()});
      callback(null, entityObj);
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

  var entityObj = entityCache.get(userObj.tags.entity.toLowerCase());

  if (!entityObj) {

    entityObj = new Entity();
    entityObj.entityId = userObj.tags.entity.toLowerCase();
    entityObj.groupId = (userObj.userId !== undefined) ? userObj.userId : userObj.tags.entity.toLowerCase();
    entityObj.name = userObj.userId;
    entityObj.screenName = userObj.screenName;
    entityObj.words = 0;
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
          + " | LS: " + moment(ad.lastSeen).format(compactDateTimeFormat)
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
      "viewerId": viewerObj.viewerId,
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
          + " | LS: " + moment(vw.lastSeen).format(compactDateTimeFormat)
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
          + " | LS:   " + moment(us.lastSeen).format(compactDateTimeFormat)
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
          + " | LS:   " + moment(us.lastSeen).format(compactDateTimeFormat)
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
            + " | LS: " + moment(adminObj.lastSeen).format(compactDateTimeFormat)
          ));

          if (!adminObj.adminId || (adminObj.adminId === undefined) || adminObj.adminId === null) {
            debug(chalkError("*** ERROR: adminFindAllDb: ADMIN ID UNDEFINED *** | SKIPPING ADD TO CACHE"));
            callback("ERROR: ADMIN ID UNDEFINED", null);
            return;
          } else {
            var addCacheResult = adminCache.set(adminObj.adminId, adminObj);
            callback(null, addCacheResult);
            return;
          }

        },

        function(err) {
          if (err) {
            console.log("*** ERROR  adminFindAllDb: " + err);
            callback(err, null);
            return;
          } else {
            debug("FOUND " + admins.length + " ADMINS");
            callback(null, admins.length);
            return;
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

function sortedObjectValues(obj, k, callback) {

  var keys = Object.keys(obj);

  var sortedKeys = keys.sort(function(a,b){
    var objA = obj[a].toJSON();
    var objB = obj[b].toJSON();
    return objB[k] - objA[k];
  });

  var endIndex = sortedKeys.length < 10 ? sortedKeys.length : 10;
  var i;
  for (i=0; i<endIndex; i += 1){
    console.log("SORT"
      + " | "  + obj[sortedKeys[i]].toJSON()[k].toFixed(3)
      + " | "  + sortedKeys[i] 
    );
  }

  callback(sortedKeys);
}

function updateMetrics() {

  if (heartbeatsSent % 100 === 0) { updateStatsCounts(); }

  debug(moment().format(compactDateTimeFormat) 
    + " | updateMetrics USERS: " + numberUsers 
    + " | PTX: " + promptsSent 
    + " | RRX: " + responsesReceived 
    + " | STX: " + sessionUpdatesSent 
    + " | BHTR: " + bhtRequests);

  // name: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers
  // label key: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers

  updateStats({
    deltaResponsesReceived: deltaResponsesReceived
  });

  deltaPromptsSent = 0;
  deltaResponsesReceived = 0;
  incrementDeltaBhtReqs(0);
  incrementDeltaMwReqs(0);
}

setInterval(function() {

  if (!dnsReverseLookupQueue.isEmpty()) {

    var sessionObj = dnsReverseLookupQueue.dequeue();

    dnsReverseLookup(sessionObj.ip, function(err, domains) {
      if (err) {
        console.log(chalkError("\n\n***** ERROR: dnsReverseLookup: " + sessionObj.ip + " ERROR: " + err));
      } else {
        debug("DNS REVERSE LOOKUP: " + sessionObj.ip + " | DOMAINS: " + domains);
        sessionObj.domain = domains[0];
      }

    });

  }
}, 20);

var unpairedUserHashMap = new HashMap();
var sessionRouteHashMap = new HashMap();

function handleSessionEvent(sesObj, callback) {

  var socketId;
  var entityRegEx = /#(\w+)$/ ;
  var namespaceRegEx = /^\/(\w+)#/ ;
  var namespace;
  var namespaceMatchArray;
  var currentAdmin;
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
      viewNameSpace.emit("SESSION_DELETE", sesObj);
      testViewersNameSpace.emit("SESSION_DELETE", sesObj);
      break;

    case "SESSION_EXPIRED":
    case "SOCKET_ERROR":
    case "SOCKET_DISCONNECT":

      console.log(chalkSession(
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
      viewNameSpace.emit("SESSION_DELETE", sesObj);
      adminNameSpace.emit("SESSION_DELETE", sesObj);
      testViewersNameSpace.emit("SESSION_DELETE", sesObj);

      if (sesObj.session) {

        sessionCache.del(sesObj.session.sessionId);

        debug(sesObj.sessionEvent + "\n" + jsonPrint(sesObj));

        currentAdmin = adminCache.get(sesObj.session.userId);
        currentUser = userCache.get(sesObj.session.userId);
        currentUtil = utilCache.get(sesObj.session.userId);
        currentViewer = viewerCache.get(sesObj.session.userId);

        sesObj.session.disconnectTime = moment().valueOf();
        sessionUpdateDb(sesObj.session);

        sesObj.session.wordChain.forEach(function(wordObj) {
          debug(chalkSession(">T< SET WORD " + wordObj.nodeId + " TTL: " + wordCacheTtl));
          wordCache.ttl(wordObj, wordCacheTtl);
        });


        unpairedUserHashMap.remove(sesObj.session.config.userA);
        unpairedUserHashMap.remove(sesObj.session.config.userB);

        if (sessionRouteHashMap.has(sesObj.session.sessionId)) {
          debug(chalkWarn("FOUND SESSION IN ROUTE HASH: " + sesObj.session.sessionId 
            + "\n" + jsonPrint(sesObj) 
            + "\n" + jsonPrint(sessionRouteHashMap.get(sesObj.session.sessionId))));

          if (sesObj.session.sessionId === sesObj.session.config.userA) {
            // unpairedSessionObj = sessionCache.get(sesObj.session.config.userB);
            debug(chalkWarn(">>> TX PAIRED_USER_END TO USER B: " + sesObj.session.config.userB));
            io.of(sesObj.session.namespace).to(sesObj.session.config.userB).emit("PAIRED_USER_END", sesObj.session.config.userA);
          } else {
            // unpairedSessionObj = sessionCache.get(sesObj.session.config.userA);
            debug(chalkWarn(">>> TX PAIRED_USER_END TO USER A: " + sesObj.session.config.userA));
            io.of(sesObj.session.namespace).to(sesObj.session.config.userA).emit("PAIRED_USER_END", sesObj.session.config.userB);
          }

        }

        sessionRouteHashMap.remove(sesObj.session.config.userA);
        sessionRouteHashMap.remove(sesObj.session.config.userB);

        if (currentAdmin) {
          debug("currentAdmin\n" + jsonPrint(currentAdmin));
          adminCache.del(currentAdmin.adminId);

          currentAdmin.lastSeen = moment().valueOf();
          currentAdmin.disconnectTime = moment().valueOf();
          currentAdmin.connected = false;

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

              console.log(chalkLog("TX UTIL SESSION (DISCONNECT): " 
                + updatedUtilObj.lastSession + " TO ADMIN NAMESPACE"));

              adminNameSpace.emit("UTIL_SESSION", updatedUtilObj);
              adminNameSpace.emit("USER_SESSION", updatedUtilObj);
            }
          });
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
          if (sesObj.session.namespace === "test-view") {
            testViewersNameSpace.to(sesObj.session.sessionId).emit("USER_SESSION", userSessionObj);
          }
          adminNameSpace.to(sesObj.session.sessionId).emit("USER_SESSION", userSessionObj);
        }
      });
      Object.keys(testUsersNameSpace.connected).forEach(function(userSessionKey) {
        userSessionObj = sessionCache.get(userSessionKey);
        if (userSessionObj) {
          debug("FOUND TEST USER SESSION: " + userSessionObj.sessionId);
          debug(chalkRed("TX USER SESSION: " + userSessionObj.sessionId
            + " TO " + sesObj.session.namespace + "#" + sesObj.session.sessionId));
          delete userSessionObj.wordChain;

          if (sesObj.session.namespace === "view") {
            viewNameSpace.to(sesObj.session.sessionId).emit("USER_SESSION", userSessionObj);
          }
          if (sesObj.session.namespace === "test-view") {
            testViewersNameSpace.to(sesObj.session.sessionId).emit("USER_SESSION", userSessionObj);
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
      Object.keys(testViewersNameSpace.connected).forEach(function(viewerSessionKey) {
        viewerSessionObj = sessionCache.get(viewerSessionKey);
        if (viewerSessionObj) {
          debug("FOUND TEST VIEWER SESSION: " + viewerSessionObj.sessionId);
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

    case "SESSION_KEEPALIVE":

      debug("KEEPALIVE\n" + jsonPrint(sesObj));

      sessionUpdateDb(sesObj.session, function(err, sessionUpdatedObj) {
        if (err) {
          console.log(chalkError(
            "*** SESSION KEEPALIVE ERROR" 
            + " | SID: " + sessionUpdatedObj.sessionId 
            + " | IP: " + sessionUpdatedObj.ip + "\n" + jsonPrint(err)
          ));
        } 
        else {

          if (sessionUpdatedObj.wordChain.length > MAX_WORDCHAIN_LENGTH) {
            debug(chalkSession("SHORTEN WC TO " + MAX_WORDCHAIN_LENGTH
              + " | UID: " + sessionUpdatedObj.userId
              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
            ));
            sessionUpdatedObj.wordChain = sessionUpdatedObj.wordChain.slice(-MAX_WORDCHAIN_LENGTH);
            debug(chalkSession("NEW WC"
              + " | UID: " + sessionUpdatedObj.userId
              + " | CURR LEN: " + sessionUpdatedObj.wordChain.length
              + " | FIRST WORD: " + sessionUpdatedObj.wordChain[0].nodeId
              + " | LAST WORD: " + sessionUpdatedObj.wordChain[sessionUpdatedObj.wordChain.length-1].nodeId
            ));

            if (sessionUpdatedObj.subSessionId !== undefined) {
              sessionCache.set(sessionUpdatedObj.subSessionId, sessionUpdatedObj);
            }
            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
          }
          else {
            if (sessionUpdatedObj.subSessionId !== undefined) {
              sessionCache.set(sessionUpdatedObj.subSessionId, sessionUpdatedObj);
            }
            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
          }

          if (!sessionUpdatedObj.userId) {
            console.log(chalkError("SESSION_KEEPALIVE: UNDEFINED USER ID" 
              + "\nsessionUpdatedObj\n" + jsonPrint(sessionUpdatedObj)));
            console.log(chalkError("SESSION_KEEPALIVE: UNDEFINED USER ID" 
              + "\nsesObj\n" + jsonPrint(sesObj)));
            quit("UNDEFINED USER ID: " + sessionUpdatedObj.sessionId);
          }

          utilCache.set(sessionUpdatedObj.userId, sessionUpdatedObj.user, function(err, success) {
            if (err) {
              console.log(chalkError("UTIL CACHE ERROR"
                + " | " + success
                + "\n" + jsonPrint(err)
              ));
            }
          });

          if (sessionUpdatedObj.config.type === "VIEWER") {
            viewerCache.set(sessionUpdatedObj.userId, sessionUpdatedObj);
            debug(chalkViewer("$ VIEWER: " + sessionUpdatedObj.userId + "\n" + jsonPrint(sessionUpdatedObj)));
          }

          debug(chalkLog(
            "K>" + " | " + sessionUpdatedObj.userId 
            + " | SID " + sessionUpdatedObj.sessionId 
            + " | T " + sessionUpdatedObj.config.type 
            + " | M " + sessionUpdatedObj.config.mode 
            + " | NS " + sessionUpdatedObj.namespace 
            + " | SID " + sessionUpdatedObj.sessionId 
            + " | WCI " + sessionUpdatedObj.wordChainIndex 
            + " | IP " + sessionUpdatedObj.ip
            // + "\n" + jsonPrint(sessionUpdatedObj)
          ));

          if (sessionUpdatedObj.namespace !== "view") {
            sessionUpdateObj = {
              action: "KEEPALIVE",
              nodeId: sessionUpdatedObj.tags.entity + "_" + sessionUpdatedObj.tags.channel,
              tags: {},
              userId: sessionUpdatedObj.userId,
              url: sessionUpdatedObj.url,
              profileImageUrl: sessionUpdatedObj.profileImageUrl,
              sessionId: sessionUpdatedObj.sessionId,
              wordChainIndex: sessionUpdatedObj.wordChainIndex
              // source: {}
            };

            sessionUpdateObj.tags = sessionUpdatedObj.tags;

            io.of(sessionUpdatedObj.namespace).to(sessionUpdatedObj.sessionId).emit("KEEPALIVE_ACK", sessionUpdatedObj.nodeId);

            updateSessionViews(sessionUpdateObj);
          }
        }
      });

      break;

    case "SESSION_CREATE":

      if (sesObj.session.tags === undefined) {
        sesObj.session.tags = {};
        sesObj.session.tags.entity = "UNKNOWN_ENTITY";
        sesObj.session.tags.channel = "UNKNOWN_CHANNEL";
      }

      console.log(chalkSession(
        "+ SES" 
        // + " | " + moment().format(compactDateTimeFormat) 
        // + " | NSP: " + sesObj.session.namespace 
        + " | " + sesObj.session.sessionId 
        + " | T " + sesObj.session.config.type 
        + " | M " + sesObj.session.config.mode 
        + " | E " + sesObj.session.tags.entity
        + " | C " + sesObj.session.tags.channel
        // + " | SIP: " + sesObj.session.ip
      ));

      switch (sesObj.session.config.type) {
        case "ADMIN":
          break;
        case "USER":
          break;
        case "UTIL":
          break;
        case "STREAM":
          break;
        case "VIEWER":
          break;
        case "TEST_USER":
          break;
        case "TEST_VIEWER":
          break;
        default:
          console.log(chalkError("??? UNKNOWN SESSION EVENT handleSessionEvent\n" + jsonPrint(sesObj)));
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

        sessionUpdateDb(sesObj.session, function(err, sessionUpdatedObj) {
          if (!err) {
            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
          }
        });
      });
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
        + " | " + sesObj.session.sessionId 
        + " | U " + sesObj.user.userId 
        + " | N " + sesObj.user.name 
        + " | M " + sesObj.session.config.mode 
        + " | G " + sesObj.user.tags.group 
        + " | E " + sesObj.user.tags.entity 
        + " | C " + sesObj.user.tags.channel 
      ));

       sessionId = sesObj.session.sessionId;

      if (sesObj.session.config.mode === "MUXSTREAM"){
        debug(chalkInfo("MUXSTREAM"
          + " | " + sesObj.session.sessionId
        ));
      }

      if (sesObj.session.config.mode === "SUBSTREAM"){
        sessionId = sesObj.session.sessionId + "#" + sesObj.user.tags.entity;
        debug(chalkInfo("SUBSTREAM"
          + " | " + sesObj.session.sessionId
        ));
      }

      if (sesObj.session.config.mode === "MONITOR"){
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
          debug(chalkError("userUpdateDb CALLBACK\nERR\n" + jsonPrint(err) + "\nUSEROBJ\n" + jsonPrint(updatedUserObj)));
          groupUpdateDb(updatedUserObj, function(err, entityObj){

            debug(chalkError("groupUpdateDb CALLBACK\nERR\n" + jsonPrint(err) + "\nentityObj\n" + jsonPrint(entityObj)));
            if (err){
              console.log(chalkError("GROUP UPDATE DB ERROR: " + err));
            }
            else if ((updatedUserObj.tags.mode !== undefined) && (updatedUserObj.tags.mode === "substream")) {
              updatedUserObj.isMuxed = true;
              debug(chalkInfo("TX UTIL SESSION (UTIL READY): " + updatedUserObj.lastSession  + " | " + updatedUserObj.userId + " TO ADMIN NAMESPACE"));
              adminNameSpace.emit("UTIL_SESSION", updatedUserObj);
              io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit("USER_READY_ACK", updatedUserObj.userId);
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
                  debug(console.log(chalkInfo("ENTITY UPDATE\n" + jsonPrint(entityObj))));
                  if (sesObj.session.config.type === "USER") {
                    console.log(chalkInfo("TX USER SESSION (USER READY): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
                    adminNameSpace.emit("USER_SESSION", updatedUserObj);
                  } else if (sesObj.session.config.type === "UTIL") {
                    console.log(chalkInfo("TX UTIL SESSION (UTIL READY): " + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
                    adminNameSpace.emit("UTIL_SESSION", updatedUserObj);
                  }

                  io.of(sesObj.session.namespace).to(sesObj.session.sessionId).emit("USER_READY_ACK", updatedUserObj.userId);
                }
              });
            }
          });
        } 
        else {
          console.log(chalkError("*** USER UPDATE DB ERROR\n" + jsonPrint(err)));
          if (quitOnErrorFlag) {
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
                case "VIEWER":
                  break;
                case "ADMIN":
                  break;
                case "UTIL":
                  break;
                case "TEST_VIEWER":
                  break;
                case "SUBSTREAM":
                case "STREAM":
                  break;
                default:
                  console.log(chalkError("??? UNKNOWN SESSION EVENT handleSessionEvent\n" + jsonPrint(sesObj)));
                  // quit("???? UNKNOWN SESSION TYPE: " + sesObj.session.config.type);
              }
            }
          });
        }
      });
      break;

    default:
      console.log(chalkError("??? UNKNOWN SESSION EVENT handleSessionEvent\n" + jsonPrint(sesObj)));
  }

  if (callback !== undefined) { callback(null, sesObj); }
}

setInterval(function() {
  var sesObj;
  if (!sessionQueue.isEmpty()) {
    sesObj = sessionQueue.dequeue();
    handleSessionEvent(sesObj);
  }
}, 20);

function getTags(wObj, callback){

  checkKeyword(wObj, function(wordObj){

    if (!wordObj.tags || (wordObj.tags === undefined)) {
      wordObj.tags = {};
      wordObj.tags.entity = "unknown_entity";
      wordObj.tags.channel = "unknown_channel";
      wordObj.tags.group = "unknown_group";

      console.log(chalkError("SET UNKNOWN WORDOBJ TAGS\n" + jsonPrint(wordObj)));
      entityChannelGroupHashMap.set("unknown_entity", { groupId: "unknown_group", name: "UNKNOWN GROUP"});

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
}

var responseQueueReady = true;
var trendingTopicsArray = [];
var trendingTopicHitArray = [];

setInterval(function() {

  if (responseQueueReady && !responseQueue.isEmpty()) {

    responseQueueReady = false;

    var responseInObj = responseQueue.dequeue();

    debug(chalkWarn("responseInObj\n" + jsonPrint(responseInObj)));

    if ((responseInObj.nodeId === undefined) 
      || (typeof responseInObj.nodeId !== "string"
      || (responseInObj.nodeId.length >  MAX_DB_KEY_LENGTH)
      )) {

      console.log(chalkError("*** ILLEGAL RESPONSE ... SKIPPING" 
        + " | NODE ID LEN: " + responseInObj.nodeId.length
        + " | TYPE: " + typeof responseInObj.nodeId 
        + "\n" + jsonPrint(responseInObj)
      ));

      responseQueueReady = true;
      statsObj.session.error += 1;
      statsObj.session.responseError += 1;
      statsObj.session.responseErrorType.NODE_ID_MAX = (statsObj.session.responseErrorType.NODE_ID_MAX === undefined) 
        ? 1 
        : statsObj.session.responseErrorType.NODE_ID_MAX + 1;

      return;
    }

    var socketId = responseInObj.socketId;

    sessionCache.get(socketId, function(err, currentSessionObj){
      if (err){
        console.log(chalkError("*** ERROR SESSION CACHE GET " + socketId + "\n" + jsonPrint(err)));
        quit("ERROR SESSION CACHE GET");
      }
      else if (currentSessionObj === undefined) {

        console.log(chalkWarn("??? SESSION NOT IN CACHE ON RESPONSE Q READ" 
          + " | responseQueue: " + responseQueue.size() 
          + " | " + socketId + " | ABORTING SESSION"
          + "\n" + jsonPrint(responseInObj)
        ));

        configEvents.emit("UNKNOWN_SESSION", socketId);

        sessionQueue.enqueue({
          sessionEvent: "SESSION_ABORT",
          sessionId: socketId
        });
        responseQueueReady = true;
        quit();
      }
      else {
        debug(chalkError("currentSessionObj\n" + jsonPrint(currentSessionObj)));

        responseInObj.isKeyword = (responseInObj.isKeyword !== undefined) ? responseInObj.isKeyword : false;
        responseInObj.isTrendingTopic = (responseInObj.isTrendingTopic !== undefined) ? responseInObj.isTrendingTopic : false;


        trendingTopicsArray = trendingCache.keys();
        trendingTopicHitArray = [];

        async.each(trendingTopicsArray, function(topic, cb) {

          if (responseInObj.nodeId.toLowerCase().includes(topic.toLowerCase())){

            var topicObj = trendingCache.get(topic);
            trendingTopicHitArray.push(topic);

            if (topicObj !== undefined){ // may have expired out of cache, so check
              console.log(chalkTwitter("TOPIC HIT: " + topic));
              topicObj.hit = true;
              trendingCache.set(topic, topicObj);
              topicHashMap.set(topic.toLowerCase(), true);
              responseInObj.isTrendingTopic = true;
            }

            cb();

          }
          else {
            cb();
          }

        }, function(err) {

          if (err) { console.log(chalkError("ERROR: " + jsonPrint(err))); }

          debug(chalkBht(">>> RESPONSE (before replace): " + responseInObj.nodeId));
          responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, " ");
          responseInObj.nodeId = responseInObj.nodeId.replace(/[\n\r\[\]{}<>\/;:"”’`~?!@#$%\^&*()_+=]+/g, "");
          responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, " ");
          responseInObj.nodeId = responseInObj.nodeId.replace(/^\s+|\s+$/g, "");
          responseInObj.nodeId = responseInObj.nodeId.replace(/^,+|,+$/g, "");
          responseInObj.nodeId = responseInObj.nodeId.replace(/^\.+|\.+$/g, "");
          responseInObj.nodeId = responseInObj.nodeId.replace(/^\-*|\-+$/g, "");
          responseInObj.nodeId = responseInObj.nodeId.toLowerCase();
          debug(chalkBht(">>> RESPONSE: " + responseInObj.nodeId));

          if (responseInObj.nodeId === "") {
            debug("EMPTY RESPONSE: " + responseInObj.nodeId);
            responseQueueReady = true;
            return;
          }

          if (!responseInObj.mentions) {responseInObj.mentions = 1;}

          responsesReceived += 1;
          deltaResponsesReceived += 1;

          updateStats({
            responsesReceived: responsesReceived,
            deltaResponsesReceived: deltaResponsesReceived
          });

          currentSessionObj.lastSeen = moment().valueOf();

          var previousPrompt;
          var previousPromptObj;

          if ((currentSessionObj.wordChain !== undefined) && (currentSessionObj.wordChainIndex > 0)) {

            previousPrompt = currentSessionObj.wordChain[currentSessionObj.wordChain.length - 1].nodeId;
            previousPromptObj = wordCache.get(previousPrompt);

            if (!previousPromptObj) {
              debug(chalkAlert("PREV PROMPT $ MISS"
                + " | " + socketId 
                + " | " + currentSessionObj.userId 
                + " | WCI: " + currentSessionObj.wordChainIndex 
                + " | WCL: " + currentSessionObj.wordChain.length
                + " | " + responseInObj.nodeId 
                + " > " + previousPrompt 
              ));

              statsObj.session.error += 1;
              statsObj.session.previousPromptNotFound += 1;

              previousPromptObj = {
                nodeId: previousPrompt,
                mentions: 1 // !!!!!! KLUDGE !!!!!!
              };

              wordCache.set(previousPromptObj.nodeId, previousPromptObj);

            } else {
              debug(chalkResponse("... previousPromptObj: " + previousPromptObj.nodeId));
            }
          } 
          else if (currentSessionObj.config.mode === "STREAM") {
            previousPromptObj = {
              nodeId: "STREAM"
            };
            debug(chalkWarn("STREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
          } 
          else if (currentSessionObj.config.mode === "MUXSTREAM") {
            previousPromptObj = {
              nodeId: "MUXSTREAM"
            };
            debug(chalkWarn("MUXSTREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
          } 
          else if (currentSessionObj.config.mode === "SUBSTREAM") {
            previousPromptObj = {
              nodeId: "SUBSTREAM"
            };
            debug(chalkWarn("SUBSTREAM WORD CHAIN\n" + jsonPrint(currentSessionObj.wordChain)));
          } 
          else {
            console.log(chalkError("??? EMPTY WORD CHAIN ... PREVIOUS PROMPT NOT IN CACHE ... ABORTING SESSION" 
              + " | " + socketId
              + "\nresponseInObj" + jsonPrint(responseInObj)
            ));

            responseQueueReady = true;

            return;
          }

          // updateWordMeter(responseInObj);
     
          getTags(responseInObj, function(updatedWordObj){
            
            updateWordMeter(updatedWordObj);

            var dbUpdateObj = {};
            dbUpdateObj.word = updatedWordObj;
            dbUpdateObj.session = currentSessionObj;
            dbUpdateObj.tags = {};

            if (updatedWordObj.tags){

              if (!updatedWordObj.tags.group || (updatedWordObj.tags.group === undefined)) {
                updatedWordObj.tags.group = updatedWordObj.tags.entity;
                dbUpdateObj.tags.group = updatedWordObj.tags.entity;
              }

              dbUpdateObj.tags.entity = updatedWordObj.tags.entity;
              dbUpdateObj.tags.channel = updatedWordObj.tags.channel;
              dbUpdateObj.tags.group = updatedWordObj.tags.group;

              debug(chalkInfo("R<" 
                + " G " + updatedWordObj.tags.group 
                + " E " + updatedWordObj.tags.entity 
                + " C " + updatedWordObj.tags.channel 
                + " | " + updatedWordObj.nodeId 
                + " | " + updatedWordObj.raw 
              ));

              dbUpdateWordQueue.enqueue(dbUpdateObj);
              responseQueueReady = true;

            }
            else {
              debug(chalkInfo("R<" 
                + " G " + updatedWordObj.tags.group 
                + " E " + updatedWordObj.tags.entity 
                + " C " + updatedWordObj.tags.channel 
                + " | " + updatedWordObj.nodeId 
                + " | " + updatedWordObj.raw 
              ));

              dbUpdateWordQueue.enqueue(dbUpdateObj);
              responseQueueReady = true;

            }

          });

        });
      }

    });

   }
}, 20);

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
  serverKeywordHashMap.set(wordObj.nodeId, updateObj);

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

var updaterMessageReady = true; 

setInterval(function() {

  if (updaterMessageReady && !updaterMessageQueue.isEmpty()) {

    updaterMessageReady = false;

    var updaterObj = updaterMessageQueue.dequeue();

    switch (updaterObj.type){
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
        serverKeywordHashMap.remove(updaterObj.keyword.toLowerCase());
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

        // var keywords = Object.keys(updaterObj.keywords);

      // keywords.forEach(function(kw){
        if ((updaterObj.target !== undefined) && (updaterObj.target === "server")) {
          debugKeyword(chalkLog("UPDATE SERVER KEYWORD\n" + jsonPrint(updaterObj.keyword)));
          serverKeywordHashMap.set(updaterObj.keyword.keywordId, updaterObj.keyword);
        }
        else if ((updaterObj.target !== undefined) && (updaterObj.target === "twitter")) {
          console.log(chalkLog("UPDATE SERVER KEYWORD TWITTER\n" + jsonPrint(updaterObj.keyword)));
          serverKeywordHashMap.set(updaterObj.keyword.keywordId, updaterObj.keyword);
        }
        else {
          debugKeyword(chalkLog("UPDATE KEYWORD\n" + jsonPrint(updaterObj.keyword)));
          keywordHashMap.set(updaterObj.keyword.keywordId, updaterObj.keyword);
        }

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
        // });
        
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
}, 10);

var dbUpdateGroupReady = true; 
setInterval(function() {

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
}, 50);

var dbUpdateEntityReady = true; 

setInterval(function() {

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
}, 50);

function updatePreviousPrompt(sessionObj, wordObj, callback){

  var previousPromptNodeId;
  var previousPromptObj;

  if (wordObj.word.wordChainIndex === 0) {
    previousPromptObj = null;
    debug(chalkRed("CHAIN START"));
    callback(previousPromptObj);
  } 
  else if (sessionObj.wordChain.length > 1) {

    previousPromptNodeId = sessionObj.wordChain[sessionObj.wordChain.length - 2].nodeId;
    previousPromptObj = wordCache.get(previousPromptNodeId);

    if (previousPromptObj === undefined) {
      debug(chalkWarn("quitOnErrorFlag: " + quitOnErrorFlag));
      console.log(chalkWarn("??? PREVIOUS PROMPT NOT IN CACHE: " + previousPromptNodeId));
      if (quitOnErrorFlag) {
        quit("??? PREVIOUS PROMPT NOT IN CACHE: " + previousPromptNodeId);
      }
      callback(previousPromptObj);
    } else {
      previousPromptObj.wordChainIndex = wordObj.word.wordChainIndex - 1;
      debug(chalkRed("CHAIN previousPromptObj: " + previousPromptNodeId));
      callback(previousPromptObj);
    }

  }
  else {
    callback(previousPromptObj);
  }
}

var dbUpdateWordReady = true;
setInterval(function() {

  if (dbUpdateWordReady && !dbUpdateWordQueue.isEmpty()) {

    dbUpdateWordReady = false;
    var dbUpdateObj = dbUpdateWordQueue.dequeue();
    var currentSessionObj = dbUpdateObj.session;
    dbUpdateObj.word.wordChainIndex = currentSessionObj.wordChainIndex;
    currentSessionObj.wordChain.push({nodeId: dbUpdateObj.word.nodeId, timeStamp:moment().valueOf()});
    currentSessionObj.wordChainIndex += 1;

    if (entityChannelGroupHashMap.has(dbUpdateObj.tags.entity)){
      currentSessionObj.tags.entity = dbUpdateObj.tags.entity;
      currentSessionObj.tags.channel = dbUpdateObj.tags.channel;
      currentSessionObj.tags.group = entityChannelGroupHashMap.get(dbUpdateObj.tags.entity).groupId;
    }

    dbUpdateWord(dbUpdateObj.word, true, function(status, updatedWordObj) {

      if (status === "BHT_FOUND"){
        wordTypes.forEach(function(wordType){
          if (updatedWordObj[wordType]){
            if (updatedWordObj[wordType].ant){
              updatedWordObj.antonym = updatedWordObj[wordType].ant[randomIntInc(0,updatedWordObj[wordType].ant.length-1)];
              updatedWordObj[wordType].ant.forEach(function(antonym){
                debug("updatedWordObj"
                  + " | " + updatedWordObj.nodeId
                  + " | TYPE: " + wordType
                  + " | ANT: " + antonym
                );
              });
            }
          }
        });
      }

      updatedWordObj.wordChainIndex = dbUpdateObj.word.wordChainIndex;

      updatePreviousPrompt(currentSessionObj, dbUpdateObj, function(previousPromptObj){

        if (previousPromptObj === undefined) {
          console.log(chalkError("previousPromptObj UNDEFINED"));
        }

        sessionCache.set(currentSessionObj.sessionId, currentSessionObj, function(err, success) {
          if (!err && success) {

            promptQueue.enqueue(currentSessionObj.sessionId);

            var sessionUpdateObj = {
              action: "RESPONSE",
              userId: currentSessionObj.userId,
              url: currentSessionObj.url,
              profileImageUrl: currentSessionObj.profileImageUrl,
              sessionId: currentSessionObj.sessionId,
              wordChainIndex: dbUpdateObj.word.wordChainIndex,
              source: updatedWordObj,
              tags: dbUpdateObj.tags
            };

            if (previousPromptObj) {sessionUpdateObj.target = previousPromptObj;}

            updateSessionViews(sessionUpdateObj);

            dbUpdateWordReady = true;

          } else {
            debug(chalkError("*** SESSION CACHE SET ERROR" + "\n" + jsonPrint(err)));

            dbUpdateWordReady = true;
          }
        });
      });
    });

  }
}, 20);


var getTwitterFriendsInterval;

function getTwitterFriends(callback){

  var nextCursorValid = false;
  var totalFriends = 0;
  var nextCursor = false;
  var count = 250;

  clearInterval(getTwitterFriendsInterval);

  getTwitterFriendsInterval = setInterval(function() {

    var params = {};
    params.count = count;
    if (nextCursorValid) {params.cursor = parseInt(nextCursor);}

    twit.get("friends/list", params, function(err, data, response){

      debug(chalkInfo("twit friends/list response\n" + jsonPrint(response)));

      if (err) {
        console.log(chalkError("*** ERROR GET TWITTER FRIENDS: " + err));
        clearInterval(getTwitterFriendsInterval);
        return;
      }

      nextCursor = data.next_cursor_str;

      console.log(chalkLog("\nFRIENDS"
        + " | COUNT: " + count
        + " | TOTAL: " + totalFriends
        + " | NEXT CURSOR VALID: " + nextCursorValid
        + " | NEXT CURSOR: " + nextCursor
        + "\nparams: " + jsonPrint(params)
      ));

      var friends = data.users;

      if (data.next_cursor_str > 0) {
        nextCursorValid = true;
      }
      else {
        nextCursorValid = false;
      }

      friends.forEach(function(friend){

        totalFriends += 1;

        console.log(chalkTwitter("FRIEND"
          + "[" + totalFriends + "]"
          + " " + friend.screen_name
          + " | " + friend.name
        ));

        var entityObj = new Entity();

        entityObj.entityId = friend.screen_name.toLowerCase();
        entityObj.name = friend.name;
        entityObj.userId = friend.screen_name.toLowerCase();
        entityObj.groupId = entityObj.entityId;
        entityObj.screenName = entityObj.entityId;
        entityObj.url = friend.url;
        entityObj.tags = {};
        entityObj.tags.entity = entityObj.entityId;
        entityObj.tags.channel = "twitter";
        entityObj.tags.mode = "substream";
        entityObj.tags.group = "";

        followerUpdateQueue.enqueue(entityObj);

      });

      if (!nextCursorValid) {
        console.log(chalkTwitter("END GET FRIENDS"
          + "[" + totalFriends + "]"
        ));
        console.log("FRIENDS NEXT CURSOR: " + nextCursor);
        clearInterval(getTwitterFriendsInterval);
        if (callback !== undefined) { callback(err, totalFriends); }
        return;
      }

    });

  }, 1000);
}

//=================================
// INIT APP ROUTING
//=================================

function initAppRouting(callback) {

  debugAppGet(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT APP ROUTING"));

  app.get("/js/require.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /js/require.js");
    res.sendFile(__dirname + "/js/require.js");
    return;
  });

  app.get("/node_modules/util/util.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /node_modules/util/util.js");
    res.sendFile(__dirname + "/node_modules/util/util.js");
    return;
  });

  app.get("/js/libs/d3.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /js/libs/d3.jss");
    res.sendFile(__dirname + "/js/libs/d3.js");
    return;
  });

  app.get("/js/libs/stringmap.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /js/libs/stringmap.jss");
    res.sendFile(__dirname + "/js/libs/stringmap.js");
    return;
  });

  app.get("/node_modules/moment/moment.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /node_modules/moment/moment.js");
    res.sendFile(__dirname + "/node_modules/moment/moment.js");
    return;
  });

  app.get("/node_modules/moment/min/moment.min.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /node_modules/moment/min/moment.min.js");
    res.sendFile(__dirname + "/node_modules/moment/min/moment.min.js");
    return;
  });

  app.get("/node_modules/node-cache/lib/node_cache.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /node_modules/node-cache/lib/node_cache.js");
    res.sendFile(__dirname + "/node_modules/node-cache/lib/node_cache.js");
    return;
  });

  app.get("/node_modules/socket.io/lib/socket.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /node_modules/socket.io/lib/socket.js");
    res.sendFile(__dirname + "/node_modules/socket.io/lib/socket.js");
    return;
  });

  app.get("/threecee.pem", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: threecee.pem");
    res.sendFile(__dirname + "/threecee.pem");
    return;
  });

  // app.get("/instagram", function(req, res) {
  //   debug(chalkInfo("get req\n" + req));
  //   debugAppGet("LOADING PAGE: /instagram");
  //   return;
  // });

  app.get("/", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING PAGE: /");
    debugAppGet("LOADING FILE: /sessionModular.html");
    res.sendFile(__dirname + "/sessionModular.html");
    return;
  });

  app.get("/controlPanel.html", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING PAGE: /controlPanel.html");
    res.sendFile(__dirname + "/controlPanel.html");
    return;
  });

  app.get("/js/libs/controlPanel.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
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
        fs.close(fd);
      });
    });
    
    return;
  });

  app.get("/admin", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.warn("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + "/admin/admin.html");
    return;
  });

  app.get("/admin/admin.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.warn("LOADING PAGE: /admin/admin.js");
    res.sendFile(__dirname + "/admin/admin.js");
    return;
  });

  app.get("/admin/admin.html", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.warn("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + "/admin/admin.html");
    return;
  });

  app.get("/admin/data/fake_users1.json", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.warn("LOADING PAGE: /admin/data/fake_users1.json");
    res.sendFile(__dirname + "/admin/data/fake_users1.json");
    return;
  });

  app.get("/js/libs/progressbar.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/js/libs/progressbar.js");
    return;
  });

  app.get("/js/libs/progressbar.min.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/js/libs/progressbar.min.js");
    return;
  });

  app.get("/node_modules/crosstab/src/crosstab.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/crosstab/src/crosstab.js");
    return;
  });

  app.get("/node_modules/lsbridge/src/lsbridge.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/lsbridge/src/lsbridge.js");
    return;
  });

  app.get("/css/rangeslider.css", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/css/rangeslider.css");
    return;
  });

  app.get("/css/progressbar.css", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/css/progressbar.css");
    return;
  });

  app.get("/node_modules/debug/node_modules/debug.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/debug/node_modules/debug.js");
    return;
  });

  app.get("/util", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet(chalkAlert("UTIL PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + "/index.html");
    return;
  });

  app.get("/test-user", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet(chalkAlert("TEST USER PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + "/index.html");
    return;
  });

  app.get("/wordAssoClient.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING PAGE: /wordAssoClient.js");
    res.sendFile(__dirname + "/wordAssoClient.js");
    return;
  });

  app.get("/session.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log("LOADING FILE: /session.js");

    fs.open(__dirname + "/session.js", "r", function(error, fd) {

      if (error) { debug(chalkInfo("ERROR FILE OPEN\n" + jsonPrint(error))); }

      fs.readFile(__dirname + "/session.js", function(error, data) {

        if (error) { debug(chalkInfo("ERROR FILE OPEN\n" + jsonPrint(error))); }

        var newData;
        if (hostname.includes("google")){
          newData = data.toString().replace("==SOURCE==", "http://word.threeceelabs.com");
        }
        else {
          newData = data.toString().replace("==SOURCE==", "http://localhost:9997");
        }
        res.send(newData);
        fs.close(fd);
      });
    });

    return;
  });

  app.get("/session", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /sessionModular.html");
    res.sendFile(__dirname + "/sessionModular.html");
    return;
  });

  app.get("/sessionModular", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: /sessionModular.html");
    res.sendFile(__dirname + "/sessionModular.html");
    return;
  });

  app.get("/js/libs/sessionViewTicker.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewTicker.js");
    res.sendFile(__dirname + "/js/libs/sessionViewTicker.js");
    return;
  });

  app.get("/js/libs/sessionViewFlow.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewFlow.js");
    res.sendFile(__dirname + "/js/libs/sessionViewFlow.js");
    return;
  });

  app.get("/js/libs/sessionViewTreemap.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewTreemap.js");
    res.sendFile(__dirname + "/js/libs/sessionViewTreemap.js");
    return;
  });

  app.get("/js/libs/sessionViewTreepack.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewTreepack.js");
    res.sendFile(__dirname + "/js/libs/sessionViewTreepack.js");
    return;
  });

  app.get("/js/libs/sessionViewHistogram.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewHistogram.js");
    res.sendFile(__dirname + "/js/libs/sessionViewHistogram.js");
    return;
  });

  app.get("/js/libs/sessionViewMedia.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewMedia.js");
    res.sendFile(__dirname + "/js/libs/sessionViewMedia.js");
    return;
  });

  app.get("/js/libs/sessionViewForce.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionViewForce.js");
    res.sendFile(__dirname + "/js/libs/sessionViewForce.js");
    return;
  });

  app.get("/js/libs/sessionView3d.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionView3d.js");
    res.sendFile(__dirname + "/js/libs/sessionView3d.js");
    return;
  });

  app.get("/js/libs/sessionView.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING FILE: sessionView.js");
    res.sendFile(__dirname + "/js/libs/sessionView.js");
    return;
  });

  app.get("/css/main.css", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/css/main.css");
    return;
  });

  app.get("/css/style.css", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/css/style.css");
    return;
  });

  app.get("/css/base.css", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/css/base.css");
    return;
  });

  app.get("/node_modules/panzoom/dist/panzoom.min.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/panzoom/dist/panzoom.min.js");
    return;
  });

  app.get("/node_modules/panzoom/dist/panzoom.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/panzoom/dist/panzoom.js");
    return;
  });

  app.get("/node_modules/async/lib/async.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/async/lib/async.js");
    return;
  });

  app.get("/js/libs/Queue.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/js/libs/Queue.js");
    return;
  });

  app.get("/node_modules/hashmap/hashmap.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    res.sendFile(__dirname + "/node_modules/hashmap/hashmap.js");
    return;
  });

  app.get("/favicon.ico", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING PAGE: /favicon.ico");
    res.sendFile(__dirname + "/favicon.png");
    return;
  });

  app.get("/favicon.png", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    debugAppGet("LOADING PAGE: /favicon.png");
    res.sendFile(__dirname + "/favicon.png");
    return;
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

  var configArgs = Object.keys(cnf);
  configArgs.forEach(function(arg){
    console.log("FINAL CONFIG | " + arg + ": " + cnf[arg]);
  });

  if (cnf.quitOnError) { quitOnErrorFlag = true; }

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
          quit();
        break;
        case "Q":
          quit();
        break;
        case "s":
          // showStats();
        break;
        case "S":
          // showStats(true);
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
              debug(chalkInfo(moment().format(compactDateTimeFormat) + " | ADMIN IP INIT"));
              adminFindAllDb(null, function(numberOfAdminIps) {
                debug(chalkInfo(moment().format(compactDateTimeFormat) 
                  + " | ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps));
                callbackParallel();
              });
            },
            
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

        debug("... CHECKING INTERNET CONNECTION ...");

        // var testClient = new net.Socket();
        var testClient = net.createConnection(80, "www.google.com");

        testClient.on("connect", function() {
          statsObj.socket.connects += 1;
          debug(chalkInfo(moment().format(compactDateTimeFormat) + " | CONNECTED TO GOOGLE: OK"));
          debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SEND SERVER_READY"));
          internetReady = true;
          configEvents.emit("SERVER_READY");
          testClient.destroy();
          callbackSeries(null, "SERVER_READY");
        });

        testClient.on("error", function(err) {
          statsObj.socket.errors += 1;
          debug(chalkError(moment().format(compactDateTimeFormat) + " | **** GOOGLE CONNECT ERROR ****\n" + err));
          debug(chalkError(moment().format(compactDateTimeFormat) + " | **** SERVER_NOT_READY ****"));
          internetReady = false;
          testClient.destroy();
          configEvents.emit("SERVER_NOT_READY");
          callbackSeries(err, null);
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

            getTwitterFriends();

            setInterval(function(){
              getTwitterFriends(function(err, totalFriends){
                if (err) {
                  console.log(chalkError("*** GET TWITTER FRIENDS ERROR: " + err));
                }
                else {
                  console.log(chalkError("TWITTER FRIENDS: " + totalFriends));
                }
              });
            }, pollTwitterFriendsIntervalTime);

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

              followerUpdateQueue.enqueue(entityObj);
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

      updateStatsInterval(ONE_MINUTE);

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


var wapiSearchQueueReady = true;

setInterval(function() {

  if (!wapiOverLimitFlag && wapiSearchQueueReady && !wapiSearchQueue.isEmpty()) {

    wapiSearchQueueReady = false;

    var wordObj = wapiSearchQueue.dequeue();

    wapiSearch(wordObj.nodeId, "ALL", function(results){

      var wapiRemainingRatio = 100*(statsObj.wapi.totalRequests/statsObj.wapi.requestLimit);

      if (results.err){
        console.log(chalkError("WAPI ERROR:"
          // + " | " + word.toLowerCase() 
          + " | " + results.err
          // + " | " + results.variation
          + "\n" + jsonPrint(results)
        ));

        wapiSearchQueueReady = true;
      }
      else if (results.wapiFound) {

        debug(chalkWapi("* WAPI HIT"
          + " [ " + statsObj.wapi.totalRequests
          + " / " + statsObj.wapi.requestLimit
          + " | " + wapiRemainingRatio.toFixed(2) + "% ]"
          // + " | " + word.toLowerCase() 
          + " | " + results.word
          + " | " + results.variation
          // + "\n" + jsonPrint(results.body)
        ));

        wordObj.wapiSearched = true;
        wordObj.wapiResults = results;
        wordObj.wapiFound = results.found ;

        wordServer.findOneWord(wordObj, false, function(err, word) {

          wapiSearchQueueReady = true;

          if (err) {
            console.log(chalkError("wapiSearch -- > findOneWord ERROR" 
              + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
            // callback(err, wordObj);
          } 
          else {
            debug("WAPI > DB | " 
              + word.nodeId 
              + " | I: " + word.isIgnored 
              + " | K: " + word.isKeyword 
              + " | MNS: " + word.mentions 
              // + " | URL: " + word.url 
              + " | WAPI S: " + word.wapiSearched 
              + " F: " + word.wapiFound
              + " | BHT S: " + word.bhtSearched 
              + " F: " + word.bhtFound
              + " | MWD S: " + word.mwDictSearched 
              + " F: " + word.mwDictFound
              // + "\nKWs: " + jsonPrint(word.keywords) 
            );
          }
        });
      }
      else {
        debug(chalkWapi("- WAPI MISS"
          + " [ " + statsObj.wapi.totalRequests
          + " / " + statsObj.wapi.requestLimit
          + " | " + wapiRemainingRatio.toFixed(2) + "% ]"
          // + " | " + word.toLowerCase() 
          + " | " + results.word
          + " | " + results.variation
        ));

        wordObj.wapiSearched = true;
        wordObj.wapiFound = false ;

        wordServer.findOneWord(wordObj, false, function(err, word) {

          wapiSearchQueueReady = true;

          if (err) {
            console.log(chalkError("wapiSearch -- > findOneWord ERROR" 
              + "\n" + JSON.stringify(err) + "\n" + JSON.stringify(wordObj, null, 2)));
          } 
          else {
            debug("WAPI > DB | " 
              + word.nodeId 
              + " | I: " + word.isIgnored 
              + " | K: " + word.isKeyword 
              + " | MNS: " + word.mentions 
              // + " | URL: " + word.url 
              + " | WAPI S: " + word.wapiSearched 
              + " F: " + word.wapiFound
              + " | BHT S: " + word.bhtSearched 
              + " F: " + word.bhtFound
              + " | MWD S: " + word.mwDictSearched 
              + " F: " + word.mwDictFound
              // + "\nKWs: " + jsonPrint(word.keywords) 
            );
          }
        });
        wapiSearchQueueReady = true;
      }
    });
  }

}, 50);

function updateTrends(){
  twit.get("trends/place", {id: 1}, function (err, data, response){

    debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));

    if (err){
      console.log(chalkError("*** TWITTER ERROR ***"
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
      console.log(chalkError("*** TWITTER ERROR ***"
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

      entityUpdateDb(updatedEntityObj, function(err, updatedEntity2Obj){
        if (err){
          console.log(chalkError("ENTITY UPDATE DB ERROR: " + err));
          callback(err, updatedEntityObj);
        }
        else {
          console.log(chalkInfo("TX UTIL SES (UTIL RDY): " + updatedEntity2Obj.lastSession + " TO ADMIN NAMESPACE"));
          adminNameSpace.emit("UTIL_SESSION", updatedEntity2Obj);
          callback(null, updatedEntity2Obj);
        }
      });

    }

  });
}

var followerUpdateQueueReady = true;

function initFollowerUpdateQueueInterval(interval){

  console.log(chalkInfo("INIT FOLLOWER UPDATE QUEUE INTERVAL: " + interval + " ms"));

  setInterval(function () {

    if (followerUpdateQueueReady && !followerUpdateQueue.isEmpty()) {

      followerUpdateQueueReady = false;

      var entityObj = followerUpdateQueue.dequeue();

      console.log(chalkInfo("FOLLOWER"
        + " [ Q: " + followerUpdateQueue.size() + "]"
        + " | " + entityObj.screenName
        + " | " + entityObj.name
      ));

      var groupObj = new Group();

      async.waterfall([

        function(cb){

          var group;

          if (entityChannelGroupHashMap.has(entityObj.entityId)) {

            debug(chalkInfo("### E CH GRP HM HIT"
              + " | " + entityObj.entityId
              + " | " + entityObj.name
              + " | G " + entityObj.groupId
            ));


            if (groupHashMap.has(entityObj.groupId)) {

              group = groupHashMap.get(entityObj.groupId);

              groupObj.groupId = group.groupId;
              groupObj.name = group.name;
              groupObj.colors = group.colors;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = "twitter";
              groupObj.tags.mode = "substream";

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push("twitter");

              debug(chalkDb("G HM HIT"
                + " | E " + entityObj.entityId
                + " | G " + groupObj.groupId
                + " | GN " + groupObj.name
                + " | +E " + groupObj.addEntityArray
                + " | +C " + groupObj.addChannelArray
              ));

              debug(chalkInfo("### G HM HIT"
                + " | " + groupObj.groupId
                + " | " + groupObj.name
              ));

              cb(null, entityObj, groupObj);
            }
            else {

              debug(chalkInfo("--- G HM MISS"
                + " | " + entityObj.entityId
                + " | " + entityObj.name
              ));

              debug(chalkInfo("+ G"
                + " | " + entityObj.entityId
                + " | " + entityObj.name
              ));

              groupObj.groupId = entityObj.entityId;
              groupObj.name = entityObj.name;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = "twitter";
              groupObj.tags.mode = "substream";

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push("twitter");

              groupHashMap.set(entityObj.entityId, groupObj);
              serverGroupHashMap.set(entityObj.entityId, groupObj);

              cb(null, entityObj, groupObj);

            }
          }
          else {
            debug(chalkInfo("--- E CH G HM MISS"
              + " | " + entityObj.entityId
              + " | " + entityObj.name
            ));

            debug(chalkInfo("+ E"
              + " | NEW E " + entityObj.entityId
              + " | " + entityObj.name
            ));

            entityChannelGroupHashMap.set(entityObj.entityId.toLowerCase(), entityObj);
            serverEntityChannelGroupHashMap.set(entityObj.entityId.toLowerCase(), entityObj);

            if (groupHashMap.has(entityObj.groupId)) {

              group = groupHashMap.get(entityObj.groupId);

              entityObj.tags.group = group.groupId;

              groupObj.groupId = group.groupId;
              groupObj.name = group.name;
              groupObj.colors = group.colors;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = "twitter";
              groupObj.tags.mode = "substream";

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push("twitter");

              debug(chalkDb("G HM HIT"
                + " | E " + entityObj.entityId
                + " | G " + groupObj.groupId
                + " | GN " + groupObj.name
                + " | +E " + groupObj.addEntityArray
                + " | +C " + groupObj.addChannelArray
              ));

              debug(chalkInfo("### G HM HIT"
                + " | " + groupObj.groupId
                + " | " + groupObj.name
              ));

              cb(null, entityObj, groupObj);

            }
            else {

              debug(chalkInfo("--- G HM MISS"
                + " | " + entityObj.entityId
                + " | " + entityObj.name
              ));

              debug(chalkInfo("+ G"
                + " | NEW G " + entityObj.entityId
                + " | " + entityObj.name
              ));

              entityObj.tags.group = entityObj.entityId;

              groupObj.groupId = entityObj.entityId;
              groupObj.name = entityObj.name;
              groupObj.tags.entity = entityObj.entityId;
              groupObj.tags.channel = "twitter";
              groupObj.tags.mode = "substream";

              groupObj.addEntityArray = [];
              groupObj.addEntityArray.push(entityObj.entityId);
              groupObj.addChannelArray = [];
              groupObj.addChannelArray.push("twitter");

              groupHashMap.set(entityObj.entityId, groupObj);
              serverGroupHashMap.set(entityObj.entityId, groupObj);

              cb(null, entityObj, groupObj);

            }
          }

        },
        function(entityObj, groupObj, cb){

          updateGroupEntity(entityObj, function(err, updatedEntityObj){
            cb(null, "done");
          });

        }
      ],
        function(err, results){
          if (err) { 
            console.log(chalkError("ERROR"
              + "RESULTS\n" + jsonPrint(results)
              + "ERROR\n" + jsonPrint(err)
            ));
          }
          debug(chalkTwitter("TWITTER_FOLLOW UPDATE COMPLETE"));

          followerUpdateQueueReady = true;

        }
      );


    }
  }, interval);
}

function initUpdateTrendsInterval(interval){
  setInterval(function () {
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

configEvents.on("UNKNOWN_SESSION", function(socketId) {

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
      + " | " + moment(parseInt(txHeartbeat.timeStamp)).format(compactDateTimeFormat) 
      + " | ST: " + moment(parseInt(txHeartbeat.startTime)).format(compactDateTimeFormat) 
      + " | UP: " + msToTime(txHeartbeat.upTime) 
      + " | RN: " + msToTime(txHeartbeat.runTime) 
      + " | MWR: " + txHeartbeat.mwRequests 
      + " | BHTR: " + txHeartbeat.bhtRequests 
      + " | MEM: " + txHeartbeat.memoryAvailable 
      + "/" + txHeartbeat.memoryTotal));
  }

  setInterval(function() {

    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;
    statsObj.memoryTotal = os.totalmem();
    statsObj.memoryAvailable = os.freemem();

    bhtTimeToReset = moment.utc().utcOffset("-07:00").endOf("day").valueOf() - moment.utc().utcOffset("-07:00").valueOf();

    //
    // SERVER HEARTBEAT
    //

    if (internetReady && ioReady) {

      heartbeatsSent += 1;

      txHeartbeat = {

        serverHostName: hostname,
        timeStamp: getTimeNow(),
        startTime: statsObj.startTime,
        upTime: statsObj.upTime,
        runTime: statsObj.runTime,

        heartbeatsSent: heartbeatsSent,

        tweetsPerMinute: tweetsPerMinute,
        maxTweetsPerMin: maxTweetsPerMin,
        maxTweetsPerMinTime: maxTweetsPerMinTime.valueOf(),

        wordsPerMinute: wordsPerMinute,
        maxWordsPerMin: maxWordsPerMin,
        maxWordsPerMinTime: maxWordsPerMinTime.valueOf(),

        obamaPerMinute: obamaPerMinute,
        maxObamaPerMin: maxObamaPerMin,
        maxObamaPerMinTime: maxObamaPerMinTime.valueOf(),

        trumpPerMinute: trumpPerMinute,
        maxTrumpPerMin: maxTrumpPerMin,
        maxTrumpPerMinTime: maxTrumpPerMinTime.valueOf(),

        wordStats: wordStats.toJSON(),

        memoryAvailable: statsObj.memoryAvailable,
        memoryTotal: statsObj.memoryTotal,

        // wordCacheStats: wordCache.getStats(),
        // wordCacheTtl: wordCacheTtl,

        numberAdmins: numberAdmins,

        numberUtils: numberUtils,
        numberUtilsMax: numberUtilsMax,
        numberUtilsMaxTime: numberUtilsMaxTime,

        numberViewers: numberViewers,
        numberViewersMax: numberViewersMax,
        numberViewersMaxTime: numberViewersMaxTime,

        numberTestViewers: numberTestViewers,
        numberTestViewersMax: numberTestViewersMax,
        numberTestViewersMaxTime: numberTestViewersMaxTime,

        numberViewersTotal: numberViewersTotal,
        numberViewersTotalMax: numberViewersTotalMax,
        numberViewersTotalMaxTime: numberViewersTotalMaxTime,

        numberUsersTotal: numberUsersTotal,
        numberUsersTotalMax: numberUsersTotalMax,
        numberUsersTotalMaxTime: numberUsersTotalMaxTime,

        numberUsers: numberUsers,
        numberUsersMax: numberUsersMax,
        numberUsersMaxTime: numberUsersMaxTime,

        numberTestUsers: numberTestUsers,
        numberTestUsersMax: numberTestUsersMax,
        numberTestUsersMaxTime: numberTestUsersMaxTime,

        totalWords: totalWords,

        // mwRequestLimit: MW_REQUEST_LIMIT,
        mwRequests: mwRequests,
        mwOverLimitFlag: mwOverLimitFlag,
        mwLimitResetTime: mwLimitResetTime,
        mwOverLimitTime: mwOverLimitTime,
        mwTimeToReset: mwTimeToReset,

        bhtRequestLimit: BHT_REQUEST_LIMIT,
        bhtRequests: bhtRequests,
        bhtOverLimitFlag: bhtOverLimitFlag,
        bhtLimitResetTime: bhtLimitResetTime,
        bhtOverLimitTime: bhtOverLimitTime,
        bhtTimeToReset: bhtTimeToReset,

        totalSessions: totalSessions,
        totalUsers: totalUsers,

        caches: {},

        promptsSent: promptsSent,
        deltaPromptsSent: deltaPromptsSent,
        deltaResponsesReceived: statsObj.deltaResponsesReceived,
        responsesReceived: responsesReceived,

        utilities: {}

      };

      txHeartbeat.utilities = statsObj.utilities;
      txHeartbeat.caches = statsObj.caches;

      io.emit("HEARTBEAT", txHeartbeat);

      utilNameSpace.emit("HEARTBEAT", txHeartbeat);
      adminNameSpace.emit("HEARTBEAT", txHeartbeat);
      userNameSpace.emit("HEARTBEAT", txHeartbeat);
      viewNameSpace.emit("HEARTBEAT", txHeartbeat);
      testUsersNameSpace.emit("HEARTBEAT", txHeartbeat);
      testViewersNameSpace.emit("HEARTBEAT", txHeartbeat);

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

setInterval(function() {

  statsObj.caches.adminCache = adminCache.getStats();
  statsObj.caches.entityCache = entityCache.getStats();
  statsObj.caches.groupCache = groupCache.getStats();
  statsObj.caches.ipAddressCache = ipAddressCache.getStats();
  statsObj.caches.sessionCache = sessionCache.getStats();
  statsObj.caches.trendingCache = trendingCache.getStats();
  statsObj.caches.userCache = userCache.getStats();
  statsObj.caches.utilCache = utilCache.getStats();
  statsObj.caches.viewerCache = viewerCache.getStats();
  statsObj.caches.wordCache = wordCache.getStats();

  if (updateComplete) {
    numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
    numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;
  }

  numberUsersTotal = numberUsers + numberTestUsers;
  numberViewersTotal = numberViewers + numberTestViewers;

  if (numberViewersTotal > numberViewersTotalMax) {
    numberViewersTotalMaxTime = moment().valueOf();
    numberViewersTotalMax = numberViewersTotal;
    debug(chalkAlert("... NEW TOTAL MAX VIEWERS" + " | " + moment().format(compactDateTimeFormat)));
  }

  if (numberViewers > numberViewersMax) {
    numberViewersMaxTime = moment().valueOf();
    numberViewersMax = numberViewers;
    debug(chalkAlert("... NEW MAX VIEWERS" + " | " + moment().format(compactDateTimeFormat)));
  }

  if (numberUsersTotal > numberUsersTotalMax) {
    numberUsersTotalMaxTime = moment().valueOf();
    numberUsersTotalMax = numberUsersTotal;
    debug(chalkAlert("... NEW TOTAL MAX USERS" + " | " + moment().format(compactDateTimeFormat)));
  }

  if (numberUsers > numberUsersMax) {
    numberUsersMaxTime = moment().valueOf();
    numberUsersMax = numberUsers;
    debug(chalkAlert("... NEW MAX USERS" + " | " + moment().format(compactDateTimeFormat)));
  }

  if (numberTestUsers > numberTestUsersMax) {
    numberTestUsersMaxTime = moment().valueOf();
    numberTestUsersMax = numberTestUsers;
    debug(chalkAlert("... NEW MAX TEST USERS" + " | " + moment().format(compactDateTimeFormat)));
  }

  if (numberUtils > numberUtilsMax) {
    numberUtilsMaxTime = moment().valueOf();
    numberUtilsMax = numberUtils;
    debug(chalkAlert("... NEW MAX UTILS" + " | " + moment().format(compactDateTimeFormat)));
  }

  updateMetrics(enableGoogleMetrics);

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
          + " | META DATA: " + results.metadata
          + " | META NODE: " + results.note
        ));
      }
    });

  if (callback) { callback(null,options); }
}

function initRateQinterval(interval){

  var wsObj;

  console.log(chalkInfo("INIT RATE QUEUE INTERVAL"));

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
      statsObj.maxWordsPerMinTime = moment.utc();
    }

    if (obamaPerMinute > maxObamaPerMin) {
      maxObamaPerMin = obamaPerMinute;
      maxObamaPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX OPM: " + obamaPerMinute.toFixed(0)));
      statsObj.maxObamaPerMin = obamaPerMinute;
      statsObj.maxObamaPerMinTime = moment.utc();
    }

    if (trumpPerMinute > maxTrumpPerMin) {
      maxTrumpPerMin = trumpPerMinute;
      maxTrumpPerMinTime = moment.utc();
      console.log(chalkLog("NEW MAX TrPM: " + trumpPerMinute.toFixed(0)));
      statsObj.maxTrumpPerMin = trumpPerMinute;
      statsObj.maxTrumpPerMinTime = moment.utc();
    }

    if (updateTimeSeriesCount === 0){

      var wordsPerMinuteTop10 = {};

      sortedObjectValues(wordMeter, "1MinuteRate", function(sortedKeys){

        if (enableGoogleMetrics) {

          var endIndex = (sortedKeys.length >= 10) ? 10 : sortedKeys.length;

          var index;
          var wmObj;
          var top10dataPoint = {};

          for (index=0; index<endIndex; index += 1){

            wmObj = wordMeter[sortedKeys[index]].toJSON();

            if (wmObj["1MinuteRate"] > MIN_METRIC_VALUE) {
              wordsPerMinuteTop10[sortedKeys[index]] = wmObj["1MinuteRate"];

              top10dataPoint.metricType = "word/top10/" + sortedKeys[index];
              top10dataPoint.value = wmObj["1MinuteRate"];
              top10dataPoint.metricLabels = {server_id: "WORD"};

              addMetricDataPoint(top10dataPoint);
            }

          }
        }

      });

      if (enableGoogleMetrics) {
        var testDataPoint = {};
        testDataPoint.metricType = "word/test/random";
        testDataPoint.value = prevTestValue + randomInt(-20,20);
        testDataPoint.metricLabels = {server_id: "TEST"};
        addMetricDataPoint(testDataPoint);
      }

      if (enableGoogleMetrics && tssServer) {
        var dataPointTssTpm = {};
        dataPointTssTpm.metricType = "twitter/tweets_per_minute";
        dataPointTssTpm.value = statsObj.utilities[tssServer].tweetsPerMinute;
        dataPointTssTpm.metricLabels = {server_id: "TSS"};
        addMetricDataPoint(dataPointTssTpm);

        var dataPoint2 = {};
        dataPoint2.metricType = "twitter/tweet_limit";
        dataPoint2.value = statsObj.utilities[tssServer].twitterLimit;
        dataPoint2.metricLabels = {server_id: "TSS"};
        addMetricDataPoint(dataPoint2);
      }

      if (enableGoogleMetrics && tmsServer) {
        var dataPointTmsTpm = {};
        dataPointTmsTpm.metricType = "twitter/tweets_per_minute";
        dataPointTmsTpm.value = statsObj.utilities[tmsServer].tweetsPerMinute;
        dataPointTmsTpm.metricLabels = {server_id: "TMS"};
        addMetricDataPoint(dataPointTmsTpm);
        
        if (statsObj.utilities[tmsServer].twitterLimit) {
          var dataPointTmsTpm2 = {};
          dataPointTmsTpm2.metricType = "twitter/tweet_limit";
          dataPointTmsTpm2.value = statsObj.utilities[tmsServer].twitterLimit;
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
        dataPointViewers.value = statsObj.caches.viewerCache.keys;
        dataPointViewers.metricLabels = {server_id: "USER"};
        addMetricDataPoint(dataPointViewers);
      }
      // user/global/number_of_users
      if (enableGoogleMetrics) {
        var dataPointUsers = {};
        dataPointUsers.metricType = "user/global/number_of_users";
        dataPointUsers.value = statsObj.caches.userCache.keys;
        dataPointUsers.metricLabels = {server_id: "USER"};
        addMetricDataPoint(dataPointUsers);
      }
      // util/global/number_of_groups
      if (enableGoogleMetrics) {
        var dataPointGroups = {};
        dataPointGroups.metricType = "util/global/number_of_groups";
        dataPointGroups.value = statsObj.caches.groupCache.keys;
        dataPointGroups.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointGroups);
      }
      // util/global/number_of_entities
      if (enableGoogleMetrics) {
        var dataPointEntities = {};
        dataPointEntities.metricType = "util/global/number_of_entities";
        dataPointEntities.value = statsObj.caches.entityCache.keys;
        dataPointEntities.metricLabels = {server_id: "UTIL"};
        addMetricDataPoint(dataPointEntities);
      }
      // user/global/number_of_sessions
      if (enableGoogleMetrics) {
        var dataPointSessions = {};
        dataPointSessions.metricType = "util/global/number_of_sessions";
        dataPointSessions.value = statsObj.caches.sessionCache.keys;
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
    updateTrends();
    initUpdateTrendsInterval(ONE_MINUTE);
    initFollowerUpdateQueueInterval(100);
    initRateQinterval(1000);
    initIgnoreWordsHashMap();
    updater = cp.fork(`${__dirname}/js/libs/updateGroupsEntitiesChannels.js`);
    updater.on("message", function(m){
      debug(chalkWarn("UPDATER RX\n" + jsonPrint(m)));
      updaterMessageQueue.enqueue(m);
    });

    updater.send({
      folder: ".",
      groupsConfigFile: defaultDropboxGroupsConfigFile,
      entityChannelGroupsConfigFile: defaultDropboxEntityChannelGroupsConfigFile,
      keywordFile: defaultDropboxKeywordFile,
      interval: GROUP_UPDATE_INTERVAL
    });
  }
});

updateStatsCounts();

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
