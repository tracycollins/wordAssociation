/*jslint node: true */
"use strict";

console.log("\n\n============== START ==============\n\n");

console.log("PROCESS PID: " + process.pid);

var quitOnError = true;


var heapdump = require('heapdump');
// var memwatch = require('memwatch');

// var pmx = require('pmx').init({
//   http          : true, // HTTP routes logging (default: true)
//   ignore_routes : [/socket\.io/, /notFound/], // Ignore http routes with this pattern (Default: [])
//   errors        : true, // Exceptions logging (default: true)
//   custom_probes : true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
//   network       : true, // Network monitoring at the application level
//   ports         : true  // Shows which ports your app is listening on (default: false)
// });

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var ONE_MINUTE = 60000;
var compactDateTimeFormat = "YYYYMMDD HHmmss";
var tinyDateTimeFormat = "YYYYMMDDHHmmss";

var OFFLINE_MODE = false;

var MAX_Q = 500;

var MIN_METRIC_VALUE = 5.0;
var MIN_MENTIONS_VALUE = 1000;

var KEYWORDS_UPDATE_INTERVAL = 30000;
var TWEET_PARSER_INTERVAL = 10;
var TWITTER_RX_QUEUE_INTERVAL = 10;
var TRANSMIT_NODE_QUEUE_INTERVAL = 10;
var TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 10;
var UPDATE_TRENDS_INTERVAL = 15*ONE_MINUTE;
var STATS_UPDATE_INTERVAL = 60000;

var DEFAULT_KEYWORD_VALUE = 100;

var DEFAULT_INTERVAL = 10;

var TOPTERMS_CACHE_DEFAULT_TTL = 60;
var TOPTERMS_CACHE_CHECK_PERIOD = 5;

var TRENDING_CACHE_DEFAULT_TTL = 300;
var TRENDING_CACHE_CHECK_PERIOD = 60;

var NODE_CACHE_DEFAULT_TTL = 60;
var NODE_CACHE_CHECK_PERIOD = 5;

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

var metricsRate = "5MinuteRate";
var CUSTOM_GOOGLE_APIS_PREFIX = "custom.googleapis.com";

var deepcopy = require('deep-copy');
var defaults = require("object.defaults");
var omit = require("object.omit");
var pick = require('object.pick');
var moment = require("moment");
var config = require("./config/config");
var os = require("os");
var fs = require("fs");
var path = require("path");
var async = require("async");
var yaml = require("yamljs");
var debug = require("debug")("wa");
var debugKeyword = require("debug")("kw");

var Queue = require("queue-fifo");

var express = require("./config/express");
var EventEmitter2 = require("eventemitter2").EventEmitter2;

var Dropbox = require("dropbox");

var Monitoring = require('@google-cloud/monitoring').v3();

var googleMonitoringClient;

var HashMap = require("hashmap").HashMap;
var NodeCache = require("node-cache");

var metricsHashmap = new HashMap();
var deletedMetricsHashmap = new HashMap();

var Twit = require("twit");
var twit;
var twitterYamlConfigFile = process.env.DEFAULT_TWITTER_CONFIG;

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

var chalk = require("chalk");
var chalkAdmin = chalk.bold.cyan;
var chalkWarn = chalk.red;
var chalkTwitter = chalk.blue;
var chalkConnect = chalk.black;
var chalkSession = chalk.black;
var chalkDisconnect = chalk.black;
var chalkSocket = chalk.black;
var chalkInfo = chalk.gray;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkLog = chalk.gray;

var tmsServers = {};
var tssServers = {};

var languageServer = {};
var tssServer = {};
tssServer.connected = false;
tssServer.user = {};
tssServer.socket = {};

var tmsServer = {};
tmsServer.connected = false;
tmsServer.user = {};
tmsServer.socket = {};

var wordMeter = {};

var tweetRxQueueInterval;
var tweetParserQueue = new Queue();
var tweetParserMessageRxQueue = new Queue();
var tweetRxQueue = new Queue();

var statsInterval;



var HEAPDUMP_ENABLED = false;
var HEAPDUMP_MODULO = process.env.HEAPDUMP_MODULO || 10;

if (process.env.HEAPDUMP_ENABLED !== undefined) {

  console.log(chalkError("DEFINED process.env.HEAPDUMP_ENABLED: " + process.env.HEAPDUMP_ENABLED));

  if (process.env.HEAPDUMP_ENABLED === "true") {
    HEAPDUMP_ENABLED = true;
    console.log(chalkError("TRUE process.env.HEAPDUMP_ENABLED: " + process.env.HEAPDUMP_ENABLED));
    console.log(chalkError("TRUE HEAPDUMP_ENABLED: " + HEAPDUMP_ENABLED));
  }
  else if (process.env.HEAPDUMP_ENABLED === "false") {
    HEAPDUMP_ENABLED = false;
    console.log(chalkError("FALSE process.env.HEAPDUMP_ENABLED: " + process.env.HEAPDUMP_ENABLED));
    console.log(chalkError("FALSE HEAPDUMP_ENABLED: " + HEAPDUMP_ENABLED));
  }

  console.log(chalkError("HEAPDUMP_MODULO: " + HEAPDUMP_MODULO));
}


var GOOGLE_METRICS_ENABLED = false;

if (process.env.GOOGLE_METRICS_ENABLED !== undefined) {

  console.log(chalkError("DEFINED process.env.GOOGLE_METRICS_ENABLED: " + process.env.GOOGLE_METRICS_ENABLED));

  if (process.env.GOOGLE_METRICS_ENABLED === "true") {
    GOOGLE_METRICS_ENABLED = true;
    console.log(chalkError("TRUE process.env.GOOGLE_METRICS_ENABLED: " + process.env.GOOGLE_METRICS_ENABLED));
    console.log(chalkError("TRUE GOOGLE_METRICS_ENABLED: " + GOOGLE_METRICS_ENABLED));
  }
  else if (process.env.GOOGLE_METRICS_ENABLED === "false") {
    GOOGLE_METRICS_ENABLED = false;
    console.log(chalkError("FALSE process.env.GOOGLE_METRICS_ENABLED: " + process.env.GOOGLE_METRICS_ENABLED));
    console.log(chalkError("FALSE GOOGLE_METRICS_ENABLED: " + GOOGLE_METRICS_ENABLED));
  }
}



// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
// var WA_STATS_FILE = process.env.WA_STATS_FILE;
var DROPBOX_WA_STATS_FILE = process.env.DROPBOX_WA_STATS_FILE || "wordAssoServer02Stats.json";

var statsFolder = "/stats/" + hostname;
var statsFileDefault = DROPBOX_WA_STATS_FILE;
var statsFile = "wordAssoServer02Stats" 
  + "_" + moment().format(tinyDateTimeFormat) 
  + ".json";

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

var configFolder = "/config/utility/" + hostname;
var deletedMetricsFile = "deletedMetrics.json";

var jsonPrint = function (obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
};


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

var nodeCacheTtl = process.env.NODE_CACHE_DEFAULT_TTL;
if (nodeCacheTtl === undefined) { nodeCacheTtl = NODE_CACHE_DEFAULT_TTL;}
console.log("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

var nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
if (nodeCacheCheckPeriod === undefined) { nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD;}
console.log("NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS");


var nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: nodeCacheCheckPeriod
});

nodeCache.on("expired", function(nodeCacheId, nodeObj) {

  debug(chalkAlert("XXX $ NODE"
    + " | " + nodeObj.nodeType
    + " | " + nodeCacheId
  ));

  if (wordMeter[nodeCacheId] || (wordMeter[nodeCacheId] !== undefined)) {

    wordMeter[nodeCacheId].end();
    wordMeter[nodeCacheId] = null;

    wordMeter = omit(wordMeter, nodeCacheId);
    delete wordMeter[nodeCacheId];

    debug(chalkAlert("XXX NODE METER WORD"
      + " | Ks: " + Object.keys(wordMeter).length
      + " | " + nodeCacheId
    ));

    statsObj.wordMeterEntries = Object.keys(wordMeter).length;

    if (statsObj.wordMeterEntries > statsObj.wordMeterEntriesMax) {
      statsObj.wordMeterEntriesMax = statsObj.wordMeterEntries;
      statsObj.wordMeterEntriesMaxTime = moment().valueOf();
      console.log(chalkAlert("NEW MAX WORD METER ENTRIES"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.wordMeterEntries.toFixed(0)
      ));
    }
  }
});

// ==================================================================
// TWITTER TRENDING TOPIC CACHE
// ==================================================================
var updateTrendsInterval;

var trendingCacheTtl = process.env.TRENDING_CACHE_DEFAULT_TTL;
if (trendingCacheTtl === undefined) {trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL;}
console.log("TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

var trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: TRENDING_CACHE_CHECK_PERIOD
});

// trendingCache.on( "expired", function(topic, topicObj){
//   // debug("CACHE TOPIC EXPIRED\n" + jsonPrint(topicObj));
//   debug(chalkInfo("XXX $ TREND | " + topic + " | " + topicObj.name));
// });

var wordsPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (wordsPerMinuteTopTermTtl === undefined) {wordsPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;}
console.log("TOP TERMS WPM CACHE TTL: " + wordsPerMinuteTopTermTtl + " SECONDS");

var wordsPerMinuteTopTermCheckPeriod = process.env.TOPTERMS_CACHE_CHECK_PERIOD;
if (wordsPerMinuteTopTermCheckPeriod === undefined) {wordsPerMinuteTopTermCheckPeriod = TOPTERMS_CACHE_CHECK_PERIOD;}
console.log("TOP TERMS WPM CACHE CHECK PERIOD: " + wordsPerMinuteTopTermCheckPeriod + " SECONDS");

var wordsPerMinuteTopTermCache = new NodeCache({
  stdTTL: wordsPerMinuteTopTermTtl,
  checkperiod: TOPTERMS_CACHE_CHECK_PERIOD
});

// wordsPerMinuteTopTermCache.on( "expired", function(word, wordRate){
//   // debug("$ WPM TOPTERM XXX\n" + jsonPrint(wpmObj));
//   debug(chalkInfo("XXX $ WPM TOPTERM | " + wordRate.toFixed(3) + " | " + word));
// });


var rateQinterval;
var Measured = require("measured");

// var wordStats = Measured.createCollection();

// wordStats.meter("wordsPerSecond", {rateUnit: 1000, tickInterval: 1000});
// wordStats.meter("wordsPerMinute", {rateUnit: 60000, tickInterval: 1000});
// wordStats.meter("obamaPerSecond", {rateUnit: 1000, tickInterval: 1000});
// wordStats.meter("obamaPerMinute", {rateUnit: 60000, tickInterval: 1000});
// wordStats.meter("trumpPerSecond", {rateUnit: 1000, tickInterval: 1000});
// wordStats.meter("trumpPerMinute", {rateUnit: 60000, tickInterval: 1000});



var defaultDropboxKeywordFile = "keywords.json";

var internetReady = false;
var ioReady = false;

var configuration = {};
configuration.quitOnError = false;
configuration.maxTopTerms = process.env.WA_MAX_TOP_TERMS || 100;


var internetCheckInterval;

var app = express();

var http = require("http");
var httpServer = http.createServer(app);

var io;
var net = require("net");

var cp = require("child_process");
var updater;
var updaterMessageQueue = new Queue();
var sorter;
var sorterMessageRxQueue = new Queue();


var ignoreWordHashMap = new HashMap();
var keywordHashMap = new HashMap();

var localHostHashMap = new HashMap();

var tweetParser;

var statsObj = {};

statsObj.errors = {};
statsObj.errors.google = {};
statsObj.errors.twitter = {};
statsObj.errors.twitter.maxRxQueue = 0;

statsObj.wordMeterEntries = 0;
statsObj.wordMeterEntriesMax = 0;
statsObj.wordMeterEntriesMaxTime = moment().valueOf();

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

// statsObj.obamaPerMinute = 0.0;
// statsObj.trumpPerMinute = 0.0;
statsObj.wordsPerMin = 0.0;
statsObj.wordsPerSecond = 0.0;
statsObj.maxWordsPerMin = 0.0;
statsObj.maxTweetsPerMin = 0.0;

// statsObj.caches = {};
// statsObj.caches.nodeCache = {};
// statsObj.caches.nodeCache.stats = {};
// statsObj.caches.nodeCache.stats.keys = 0;
// statsObj.caches.nodeCache.stats.keysMax = 0;
// statsObj.caches.wordsPerMinuteTopTermCache = {};
// statsObj.caches.wordsPerMinuteTopTermCache.stats = {};
// statsObj.caches.wordsPerMinuteTopTermCache.stats.keys = 0;
// statsObj.caches.wordsPerMinuteTopTermCache.stats.keysMax = 0;

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

console.log("process.memoryUsage()\n"+ jsonPrint(process.memoryUsage()));
statsObj.memory = {};
statsObj.memory.rss = process.memoryUsage().rss/(1024*1024);
statsObj.memory.maxRss = process.memoryUsage().heapUsed/(1024*1024);
statsObj.memory.maxRssTime = moment().valueOf();
statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.memory.maxHeap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.memory.maxHeapTime = moment().valueOf();
statsObj.memory.memoryAvailable = os.freemem();
statsObj.memory.memoryTotal = os.totalmem();
statsObj.memory.memoryUsage = process.memoryUsage();
statsObj.memory.memoryUsage.heapUsed = process.memoryUsage().heapUsed/(1024*1024);
statsObj.memory.memoryUsage.heapTotal = process.memoryUsage().heapTotal/(1024*1024);
statsObj.memory.memoryUsage.rss = process.memoryUsage().rss/(1024*1024);

statsObj.queues = {};
statsObj.queues.metricsDataPointQueue = 0;
statsObj.queues.sorterMessageRxQueue = 0;
statsObj.queues.transmitNodeQueue = 0;
statsObj.queues.tweetParserMessageRxQueue = 0;
statsObj.queues.tweetParserQueue = 0;
statsObj.queues.tweetRxQueue = 0;
statsObj.queues.updaterMessageQueue = 0;

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

function quit(message) {
  debug("\n... QUITTING ...");
  var msg = "";
  if (message) {msg = message;}
  debug("QUIT MESSAGE: " + msg);
  process.exit();
}

function getTimeStamp(inputTime) {
  var currentTimeStamp ;

  if (typeof inputTime === 'undefined') {
    currentTimeStamp = moment().format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment(inputTime).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else {
    currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
}

function loadFile(folder, file, callback) {

  debug(chalkInfo("LOAD FOLDER " + folder));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + folder + "/" + file));

  var fileExists = false;
  var payload;
  var fileObj;
  var err = {};

  dropboxClient.filesListFolder({path: folder})
    .then(function(response) {

        async.each(response.entries, function(folderFile, cb) {

          debug("FOUND FILE " + folderFile.name);

          if (folderFile.name == file) {
            debug(chalkAlert("SOURCE FILE EXISTS: " + file));
            fileExists = true;
          }

          cb();

        }, function(err) {

          if (fileExists) {


            dropboxClient.filesDownload({path: folder + "/" + file})
              .then(function(data) {
                console.log(chalkLog(getTimeStamp()
                  + " | LOADING FILE FROM DROPBOX: " + folder + "/" + file
                  // + "\n" + jsonPrint(data)
                ));

                payload = data.fileBinary;

                debug(payload);

                if (file.match(/\.json$/gi)) {
                  debug("FOUND JSON FILE: " + file);
                  fileObj = JSON.parse(payload);
                  callback(null, fileObj);
                }
                else if (file.match(/\.yml/gi)) {
                  fileObj = yaml.load(payload);
                  debug(chalkAlert("FOUND YAML FILE: " + file));
                  debug("FOUND YAML FILE\n" + jsonPrint(fileObj));
                  debug("FOUND YAML FILE\n" + jsonPrint(payload));
                  callback(null, fileObj);
                }
                else {
                  callback(null, null);
                }

               })
              .catch(function(error) {
                console.log(chalkAlert("DROPBOX loadFile ERROR: " + file + "\n" + error));
                console.log(chalkError("!!! DROPBOX READ " + file + " ERROR"));
                console.log(chalkError(jsonPrint(error)));

                if (error["status"] === 404) {
                  console.error(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND ... SKIPPING ..."));
                  callback(null, null);
                }
                else if (error["status"] === 0) {
                  console.error(chalkError("!!! DROPBOX NO RESPONSE ... NO INTERNET CONNECTION? ... SKIPPING ..."));
                  callback(null, null);
                }
                else {
                  callback(error, null);
                }
              });
          }
          else {
            console.error(chalkError("*** FILE DOES NOT EXIST: " + folder + "/" + file));
            console.log(chalkError("*** FILE DOES NOT EXIST: " + folder + "/" + file));
            err.code = 404;
            err.status = "FILE DOES NOT EXIST";
            callback(err, null);
          }
        });
    })
    .catch(function(error) {
      console.error("DROPBOX LOAD FILE ERROR\n" + jsonPrint(error));
      callback(error, null);
    });
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

function saveStats(statsFile, statsObj, callback) {

  var fullPath = statsFolder + "/" + statsFile;

  if (OFFLINE_MODE) {

    fs.exists(fullPath, function(exists) {
      if (exists) {
        fs.stat(fullPath, function(error, stats) {
          if (error) { 
            fs.close(fd);
            return(callback(error, stats)); 
          }
          fs.open(fullPath, "w", function(error, fd) {
            if (error) { 
              fs.close(fd);
              return(callback(error, fd));
            }
            fs.writeFile(path, statsObj, function(error) {
              if (error) { 
                fs.close(fd);
                return(callback(error, path)); 
              }
              callback("OK");
              fs.close(fd);
              return(callback(null, path)); 
            });
          });
        });
      }
    });
  } 
  else {

  var options = {};

  options.contents = JSON.stringify(statsObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(){
      debug(chalkLog(moment().format(compactDateTimeFormat)
        + " | SAVED DROPBOX JSON | " + options.path
      ));
      callback("OK");
    })
    .catch(function(err){
      console.log(chalkError(moment().format(compactDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + options.path 
        + " ERROR: " + err.error_summary
      ));
      callback(err);
    });

  }
}

function showStats(options){

  statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
  statsObj.timeStamp = moment().format(compactDateTimeFormat);
  // statsObj.caches.nodeCache.stats.keys = nodeCache.getStats().keys;
  // statsObj.caches.wordsPerMinuteTopTermCache.stats.keys = nodeCache.getStats().keys;

  // if (statsObj.caches.wordsPerMinuteTopTermCache.stats.keys > statsObj.caches.wordsPerMinuteTopTermCache.stats.keysMax) {
  //   statsObj.caches.wordsPerMinuteTopTermCache.stats.keysMax = statsObj.caches.wordsPerMinuteTopTermCache.stats.keys;
  //   statsObj.caches.wordsPerMinuteTopTermCache.stats.keysMaxTime = moment().valueOf();
  //   console.log(chalkAlert("NEW MAX WPM TT $ KEYS"
  //     + " | " + moment().format(compactDateTimeFormat)
  //     + " | KEYS: " + statsObj.caches.wordsPerMinuteTopTermCache.stats.keys
  //   ));
  // }

  // if (statsObj.caches.nodeCache.stats.keys > statsObj.caches.nodeCache.stats.keysMax) {
  //   statsObj.caches.nodeCache.stats.keysMax = statsObj.caches.nodeCache.stats.keys;
  //   statsObj.caches.nodeCache.stats.keysMaxTime = moment().valueOf();
  //   console.log(chalkAlert("NEW MAX NODE $ KEYS"
  //     + " | " + moment().format(compactDateTimeFormat)
  //     + " | KEYS: " + statsObj.caches.nodeCache.stats.keys
  //   ));
  // }

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
    console.log(chalkLog("S"
      // + " | " + statsObj.socketId
      + " | E: " + statsObj.elapsed
      + " | S: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | N: " + moment().format(compactDateTimeFormat)
      + " | NODE $: Ks:" + nodeCache.getStats().keys + " KS: " + nodeCache.getStats().ksize + " VS: " + nodeCache.getStats().vsize
      + " | RSS: " + statsObj.memory.rss.toFixed(0) + " MB"
      + " | MAX RSS: " + statsObj.memory.maxRss.toFixed(0)
      + " | MAX RSS TIME: " + moment(parseInt(statsObj.memory.maxRssTime)).format(compactDateTimeFormat)
      + " | H: " + statsObj.memory.heap.toFixed(0) + " MB"
      + " | MAX H: " + statsObj.memory.maxHeap.toFixed(0)
      + " | MAX H TIME: " + moment(parseInt(statsObj.memory.maxHeapTime)).format(compactDateTimeFormat)
    ));
    console.log(chalkAlert("STATS\n" + jsonPrint(statsObj)));
  }
  else {
    console.log(chalkLog("S"
      // + " | " + statsObj.socketId
      + " | E: " + statsObj.elapsed
      + " | S: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | N: " + moment().format(compactDateTimeFormat)
      + " | NODE $: Ks:" + nodeCache.getStats().keys + " KS: " + nodeCache.getStats().ksize + " VS: " + nodeCache.getStats().vsize
      + " | RSS: " + statsObj.memory.rss.toFixed(0) + " MB"
      + " | MAX RSS: " + statsObj.memory.maxRss.toFixed(0)
      + " | MAX RSS TIME: " + moment(parseInt(statsObj.memory.maxRssTime)).format(compactDateTimeFormat)
      + " | H: " + statsObj.memory.heap.toFixed(0) + " MB"
      + " | MAX H: " + statsObj.memory.maxHeap.toFixed(0)
      + " | MAX H TIME: " + moment(parseInt(statsObj.memory.maxHeapTime)).format(compactDateTimeFormat)
    ));
  }
}

function initDeletedMetricsHashmap(callback){
  loadFile(configFolder, deletedMetricsFile, function(err, deletedMetricsObj){
    if (err) {
      if (err.code !== 404) {
        console.error("LOAD DELETED METRICS FILE ERROR\n" + err);
        // pmx.emit("ERROR", "LOAD DELETED METRICS FILE ERROR");
        if (callback !== undefined) { callback(err, null); }
      }
      else {
        if (callback !== undefined) { callback(null, null); }
      }
    }
    else {
      // Object.keys(deletedMetricsObj).forEach(function(metricName){
      async.each(Object.keys(deletedMetricsObj), function(metricName, cb){
        deletedMetricsHashmap.set(metricName, deletedMetricsObj[metricName]);
        debug(chalkAlert("+ DELETED METRIC | " + metricName ));
        cb();
      }, function(err){
        console.log(chalkAlert("LOADED DELETED METRICS | " + deletedMetricsHashmap.count() ));
        if (callback !== undefined) { callback(null, null); }
      });
    }
   });
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

    clearInterval(internetCheckInterval);

    saveStats(statsFile, statsObj, function(status) {
      if (status !=="OK") {
        debug("!!! ERROR: saveStats " + status);
      } 
      else {
        debug(chalkLog("UPDATE STATUS OK"));
      }
    });

    setTimeout(function() {
      showStats(true);
      debug("**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n");
      quit(msg);
    }, 300);
  }

});

// ==================================================================
// FUNCTIONS
// ==================================================================



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

function initSocketHandler(socket) {

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

  socket.on("VIEWER_READY", function(viewerObj) {
    debug(chalkSocket("VIEWER READY\n" + jsonPrint(viewerObj)));
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
    }
 
    if (userObj.userId.match(/TSS_/g)){
      userObj.isServer = true;

      if (tssServers[socket.id] === undefined) { tssServers[socket.id] = {}; }
      tssServers[socket.id].connected = true;
      tssServers[socket.id].user = userObj;
      tssServers[socket.id].socket = socket;

    }
  });

  socket.on("USER_READY", function(userObj, cb) {
    debug(chalkSocket("USER READY"
      + " | " + userObj.userId
    ));
    if ((cb !== undefined) && (typeof cb === "function")) { cb(userObj.userId); }
  });

  socket.on("tweet", function(tw) {
    statsObj.twitter.tweetsReceived += 1;
    debug(chalkSocket("tweet" 
      + " [" + statsObj.twitter.tweetsReceived + "]"
      + " | " + tw.id_str
      + " | " + tw.user.id_str
      + " | " + tw.user.screen_name
      + " | " + tw.user.name
    ));

    if (tweetRxQueue.size() > MAX_Q){

      statsObj.errors.twitter.maxRxQueue += 1;

      console.log(chalkError("*** TWEET RX MAX QUEUE [" + tweetRxQueue.size() + "] | T<"
        + " | " + tw.id_str
        + " | " + tw.user.screen_name
      ));
    }
    else if (tw.user) {

      tweetRxQueue.enqueue(tw);
      statsObj.queues.tweetRxQueue = tweetRxQueue.size();

      debug(chalkLog("T<"
        + " [ RXQ: " + tweetRxQueue.size() + "]"
        + " [ TPQ: " + tweetParserQueue.size() + "]"
        + " | " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }
    else{
      console.log(chalkAlert("NULL USER T*<"
        + " [ RXQ: " + tweetRxQueue.size() + "]"
        + " [ TPQ: " + tweetParserQueue.size() + "]"
        + " | " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }

  });

  socket.on("node", function(rxNodeObj) {
    viewNameSpace.emit("node", rxNodeObj);
  });

  socket.on("word", function(rxWordObj) {
    viewNameSpace.emit("node", rxWordObj);
  });
}

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

  debug(chalkAlert("checkKeyword"
    + " | " + nodeObj.nodeType
    + " | " + nodeObj.nodeId
    + "\n" + jsonPrint(nodeObj)
  ));
  
  if ((nodeObj.nodeType === "user") 
    && (nodeObj.screenName !== undefined) 
    && (nodeObj.screenName) 
    && keywordHashMap.has(nodeObj.screenName.toLowerCase())) {
    debug(chalkAlert("HIT USER SNAME"));
    nodeObj.isKeyword = true;
    nodeObj.keywords = keywordHashMap.get(nodeObj.screenName.toLowerCase());
  }
  else if ((nodeObj.nodeType === "user") 
    && (nodeObj.name !== undefined) 
    && (nodeObj.name) 
    && keywordHashMap.has(nodeObj.name.toLowerCase())) {
    debug(chalkAlert("HIT USER NAME"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.name.toLowerCase());
    nodeObj.isKeyword = true;
  }
  else if ((nodeObj.nodeType === "place") 
    && keywordHashMap.has(nodeObj.name.toLowerCase())) {
    debug(chalkAlert("HIT PLACE NAME"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.name.toLowerCase());
    nodeObj.isKeyword = true;
  }
  else if (nodeObj.nodeId && keywordHashMap.has(nodeObj.nodeId.toLowerCase())) {
    debug(chalkAlert("HIT NODE ID"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.nodeId.toLowerCase());
    nodeObj.isKeyword = true;
    if ((nodeObj.nodeType === "user") 
      && (nodeObj.name === undefined) 
      && (nodeObj.screenName === undefined)) {
      nodeObj.screenName = nodeObj.nodeId;
    }
  }
  else if (nodeObj.text && keywordHashMap.has(nodeObj.text.toLowerCase())) {
    debug(chalkAlert("HIT TEXT"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.text.toLowerCase());
    nodeObj.isKeyword = true;
    if ((nodeObj.nodeType === "user") 
      && (nodeObj.name === undefined) 
      && (nodeObj.screenName === undefined)) {
      nodeObj.screenName = nodeObj.nodeId;
    }
  }
  else if (nodeObj.keywords === undefined) {
    nodeObj.keywords = {};
    nodeObj.isKeyword = false;
  }
  else {
    nodeObj.keywords = {};
    nodeObj.isKeyword = false;
  }

  switch (nodeObj.nodeType) {

    case "tweet":
    case "media":
    case "url":
      callback(nodeObj);
    break;

    case "user":
      if (!nodeObj.name && !nodeObj.screenName) {
        console.log(chalkError("NODE NAME & SCREEN NAME UNDEFINED?\n" + jsonPrint(nodeObj)));
        callback(nodeObj);
      }
      else if (nodeObj.screenName){

        nodeObj.isTwitterUser = true;

        wordsPerMinuteTopTermCache.get(nodeObj.screenName.toLowerCase(), function(err, screenName) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (screenName !== undefined) {
            debug(chalkAlert("TOP TERM: " + screenName));
            nodeObj.isTopTerm = true;
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
          }
          if (name !== undefined) {
            nodeObj.isTopTerm = true;
          }

          callback(nodeObj);
        });
      }
      else {
        callback(nodeObj);
      }
    break;

    case "hashtag":
      wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function(err, nodeId) {
        if (err){
          console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
        }
        if (nodeId !== undefined) {
          nodeObj.isTopTerm = true;
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
        }
        if (nodeId !== undefined) {
          nodeObj.isTopTerm = true;
        }
        callback(nodeObj);
      });
    break;

    case "word":
      wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function(err, nodeId) {
        if (err){
          console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
        }
        if (nodeId !== undefined) {
          nodeObj.isTopTerm = true;
        }
        callback(nodeObj);
      });
    break;

    default:
      console.log(chalkAlert("DEFAULT | checkKeyword\n" + jsonPrint(nodeObj)));
      callback(nodeObj);
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
      console.log(chalkInfo("LOAD TWITTER TREND - WORLDWIDE"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function(element){
        element.trends.forEach(function(topic){
          debug(chalkInfo(
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

      console.log(chalkInfo("LOAD TWITTER TREND - US"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function(element){
        element.trends.forEach(function(topic){
          debug(chalkInfo(
            topic.name
          ));
          trendingCache.set(topic.name, topic);
        });
      });
    }
  });
}

function initUpdateTrendsInterval(interval){

  console.log(chalkAlert("INIT UPDATE TRENDS INTERVAL: " + interval + " MS"));

  clearInterval(updateTrendsInterval);

  if (twit !== undefined) { updateTrends(); }

  updateTrendsInterval = setInterval(function () {
    if (twit !== undefined) { updateTrends(); }
  }, interval);
}

function updateWordMeter(wordObj, callback){


  if ((wordObj.nodeType === "media") 
    || (wordObj.nodeType === "url")
    || (wordObj.nodeType === "keepalive")
    ) {
    callback(null, wordObj);
    return;
  }

  var meterWordId;

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

    // nodeCache.set(meterWordId, wordObj);

    if (callback !== undefined) { callback(null, wordObj); }
  }
  else {
    if (/TSS_/.test(meterWordId) || wordObj.isServer){
      console.log(chalkAlert("updateWordMeter\n" + jsonPrint(wordObj)));
    }

    if (!wordMeter[meterWordId] 
      || (wordMeter[meterWordId] === {})
      || (wordMeter[meterWordId] === undefined) ){

      wordMeter[meterWordId] = null;

      var newMeter = new Measured.Meter({rateUnit: 60000});

      newMeter.mark();
      wordObj.rate = parseFloat(newMeter.toJSON()[metricsRate]);

      wordMeter[meterWordId] = newMeter;

      nodeCache.set(meterWordId, wordObj);

      statsObj.wordMeterEntries = Object.keys(wordMeter).length;

      if (statsObj.wordMeterEntries > statsObj.wordMeterEntriesMax) {
        statsObj.wordMeterEntriesMax = statsObj.wordMeterEntries;
        statsObj.wordMeterEntriesMaxTime = moment().valueOf();
        console.log(chalkAlert("NEW MAX WORD METER ENTRIES"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + statsObj.wordMeterEntries.toFixed(0)
        ));
      }

      if (callback !== undefined) { callback(null, wordObj); }
    }
    else {
      wordMeter[meterWordId].mark();
      // meterObj = wordMeter[meterWordId].toJSON();
      wordObj.rate = parseFloat(wordMeter[meterWordId].toJSON()[metricsRate]);

      nodeCache.set(meterWordId, wordObj);

      if (callback !== undefined) { callback(null, wordObj); }
    }
  }
}

var transmitNodeQueueReady = true;
var transmitNodeQueueInterval;
var transmitNodeQueue = new Queue();

function initTransmitNodeQueueInterval(interval){

  console.log(chalkAlert("INIT TRANSMIT NODE QUEUE INTERVAL: " + interval + " MS"));

  clearInterval(transmitNodeQueueInterval);

  transmitNodeQueueInterval = setInterval(function () {

    if (transmitNodeQueueReady && (!transmitNodeQueue.isEmpty())){

      transmitNodeQueueReady = false;

      var nodeObj = transmitNodeQueue.dequeue();

      checkKeyword(nodeObj, function(node){
        updateWordMeter(node, function(err, n){
          if (!err) {
            viewNameSpace.volatile.emit("node", n);
          }
          transmitNodeQueueReady = true;
        });
      });
    }
  }, interval);
}


function transmitNodes(tw, callback){
  debug("TX NODES");

  tw.userMentions.forEach(function(user){
    transmitNodeQueue.enqueue(user);
  });

  tw.hashtags.forEach(function(hashtag){
    transmitNodeQueue.enqueue(hashtag);
  });

  tw.media.forEach(function(media){
    transmitNodeQueue.enqueue(media);
  });

  tw.urls.forEach(function(url){
    transmitNodeQueue.enqueue(url);
  });

  transmitNodeQueue.enqueue(tw.user);

  if (tw.place){
    transmitNodeQueue.enqueue(tw.place);
  }

  transmitNodeQueue.enqueue(tw.user);

  callback();
}

var metricsDataPointQueue = new Queue();
var metricsDataPointQueueReady = true;
var metricsDataPointQueueInterval;

function initMetricsDataPointQueueInterval(interval){

  console.log(chalkLog("INIT METRICS DATA POINT QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(metricsDataPointQueueInterval);

  var googleRequest = {};

  if (GOOGLE_METRICS_ENABLED) {
    googleRequest.name = googleMonitoringClient.projectPath(process.env.GOOGLE_PROJECT_ID);
    googleRequest.timeSeries = [];
  }


  metricsDataPointQueueInterval = setInterval(function () {

    initDeletedMetricsHashmap();

    if (GOOGLE_METRICS_ENABLED && !metricsDataPointQueue.isEmpty() && metricsDataPointQueueReady) {

      metricsDataPointQueueReady = false;

      debug(chalkAlert("METRICS TIME SERIES"
        + "\n" + jsonPrint(googleRequest.timeSeries)
      ));

      googleRequest.timeSeries.length = 0;

      async.each(metricsDataPointQueue, function(dataPoint, cb){

        googleRequest.timeSeries.push(dataPoint);
        cb();

      }, function(err){

        metricsDataPointQueue.clear();

        googleMonitoringClient.createTimeSeries(googleRequest)
          .then(function(){
            console.log(chalkInfo("METRICS"
              + " | DATA POINTS: " + googleRequest.timeSeries.length 
              // + " | " + options.value
            ));
            metricsDataPointQueueReady = true;
          })
          .catch(function(err){
            statsObj.errors.google[err.code] = (statsObj.errors.google[err.code] === undefined) ? 1 : statsObj.errors.google[err.code] += 1;
            // if (err.code !== 8) {
            // pmx.emit("ERROR", "GOOGLE METRICS ERROR");
            console.error(chalkError(moment().format(compactDateTimeFormat)
              + " | *** ERROR GOOGLE METRICS"
              // + " | GOOGLE_METRICS_ENABLED: " + GOOGLE_METRICS_ENABLED
              // + " | SRVR: " + options.metricLabels.server_id 
              // + " | V: " + options.value
              + " | DATA POINTS: " + googleRequest.timeSeries.length 
              + "\n*** ERR:  " + err
              + "\n*** NOTE: " + err.note
              + "\nERR\n" + jsonPrint(err)
              // + "\nREQUEST\n" + jsonPrint(googleRequest)
              // + "\nMETA DATA\n" + jsonPrint(err.metadata)
            ));
            googleRequest.timeSeries.forEach(function(dataPoint){
              console.error(chalkAlert(dataPoint.metric.type + " | " + dataPoint.points[0].value.doubleValue));
            });
            metricsDataPointQueueReady = true;
        });

      });

    }

  }, interval);
}

function addMetricDataPoint(options, callback){

  if (!GOOGLE_METRICS_ENABLED) {
    console.trace("***** GOOGLE_METRICS_ENABLED FALSE? " + GOOGLE_METRICS_ENABLED);
    if (callback) { callback(null,options); }
    return;
  }

  debug(chalkAlert("addMetricDataPoint"
    + " | GOOGLE_METRICS_ENABLED: " + GOOGLE_METRICS_ENABLED
    + "\n" + jsonPrint(options)
  ));

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

  dataPoint.value[options.dataType] = parseFloat(options.value);

  var timeSeriesData = {
    metric: {
      type: options.metricTypePrefix + "/" + options.metricType,
      labels: options.metricLabels
    },
    resource: {
      type: options.resourceType,
      labels: { project_id: options.projectId }
    },
    // points: [ dataPoint ]
    points: []
  };

  timeSeriesData.points.push(dataPoint);

  metricsDataPointQueue.enqueue(timeSeriesData);

  if (callback) { callback(null, { q: metricsDataPointQueue.size()} ); }
}

function addTopTermMetricDataPoint(node, nodeRate){

  nodeCache.get(node, function(err, nodeObj){
    if (err) {
      console.error(chalkInfo("ERROR addTopTermMetricDataPoint " + err
        // + " | " + node
      ));
    }
    else if (nodeObj === undefined) {
      debug(chalkInfo("?? SORTED NODE NOT IN WORD $"
        // + " | " + node
      ));
    }
    else if (parseInt(nodeObj.mentions) > MIN_MENTIONS_VALUE) {

      console.log(chalkInfo("+++ TOP TERM METRIC"
        + " | " + node
        + " | Ms: " + nodeObj.mentions
        + " | RATE: " + nodeRate.toFixed(2)
      ));

      var topTermDataPoint = {};

      topTermDataPoint.displayName = node;
      topTermDataPoint.metricType = "word/top10/" + node;
      topTermDataPoint.value = parseFloat(nodeRate);
      topTermDataPoint.metricLabels = {server_id: "WORD"};

      addMetricDataPoint(topTermDataPoint);
    }
  });
}


var heartbeatsSent = 0;
var tempDateTime;
var memoryAvailableMB;
var memoryTotalMB;
var memoryAvailablePercent;

function logHeartbeat() {

  memoryAvailableMB = (statsObj.memory.memoryAvailable/(1024*1024));
  memoryTotalMB = (statsObj.memory.memoryTotal/(1024*1024));
  memoryAvailablePercent = (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal);

  debug(chalkLog("HB " + heartbeatsSent 
    + " | " + moment(parseInt(statsObj.timeStamp)).format(compactDateTimeFormat) 
    + " | ST: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat) 
    + " | UP: " + msToTime(statsObj.upTime) 
    + " | RN: " + msToTime(statsObj.runTime) 
    + " | MEM: " + memoryAvailableMB.toFixed(0) + " AVAIL"
    + " / " + memoryTotalMB.toFixed(0) + " TOTAL MB"
    + " - " + memoryAvailablePercent.toFixed(3) + " %"
  ));
}

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

  tempDateTime;
  memoryAvailableMB = (statsObj.memory.memoryAvailable/(1024*1024));
  memoryTotalMB = (statsObj.memory.memoryTotal/(1024*1024));
  memoryAvailablePercent = (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal);

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
      + " | RES: " + res
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
    debug(chalkInfo("get req\n" + req));
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
    debug(chalkInfo("get next\n" + next));
    debug(chalkInfo("LOADING PAGE: /sessionModular.html | " + req));
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



  app.get("/session.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log("LOADING FILE: /session.js");

    fs.readFile(__dirname + "/session.js", function(err, data) {

      if (err) { 
        console.log(chalkError("ERROR FILE OPEN\n" + jsonPrint(err)));
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


  app.get("/js/libs/controlPanel.js", function(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log("LOADING PAGE: /js/libs/controlPanel.js");

    fs.open(__dirname + "/js/libs/controlPanel.js", "r", function(err, fd) {

      if (err) { debug(chalkInfo("ERROR FILE OPEN\n" + jsonPrint(err))); }

      fs.readFile(__dirname + "/js/libs/controlPanel.js", function(err2, data) {

        if (err2) { debug(chalkInfo("ERROR FILE READ\n" + jsonPrint(err2))); }

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


  app.get("/", function(req, res, next) {
    debug(chalkInfo("get next\n" + next));
    debug(chalkInfo("LOADING PAGE: /sessionModular.html | " + req));
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
    debug(chalkInfo("get next\n" + next));
    debug(chalkInfo("LOADING PAGE: /js/require.js | " + req));
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
  var testClient;

  clearInterval(internetCheckInterval);

  internetCheckInterval = setInterval(function(){

    testClient = net.createConnection(80, "www.google.com");

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

var tweetParserReady = false;

function initTwitterRxQueueInterval(interval){

  var tweet;

  console.log(chalkLog("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function () {

    // if (tweetParserReady && !tweetRxQueue.isEmpty()) {
    if (!tweetRxQueue.isEmpty()) {

      // tweetParserReady = false;

      tweet =  tweetRxQueue.dequeue();

      debug(chalkInfo("TPQ<"
        + " [" + tweetParserQueue.size() + "]"
        // + " | " + socket.id
        + " | " + tweet.id_str
        + " | " + tweet.user.id_str
        + " | " + tweet.user.screen_name
        + " | " + tweet.user.name
      ));

      tweetParser.send({ op: "tweet", tweetStatus: tweet }, function(err){
        if (err) {
          // pmx.emit("ERROR", "TWEET PARSER SEND ERROR");
          console.error(chalkError("*** TWEET PARSER SEND ERROR"
            + " | " + err
          ));
          if (quitOnError) {
            quit("TWEET PARSER SEND ERROR");
          }
        }
        // tweetParserReady = true;
      });

    }
  }, interval);
}


var tweetParserMessageRxQueueReady = true;
var tweetParserMessageRxQueueInterval;

function initTweetParserMessageRxQueueInterval(interval){

  console.log(chalkLog("INIT TWEET PARSER MESSAGE RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetParserMessageRxQueueInterval);

  // var tweetParserMessage;
  // var tweetObj;

  tweetParserMessageRxQueueInterval = setInterval(function () {

    if (!tweetParserMessageRxQueue.isEmpty() && tweetParserMessageRxQueueReady) {

      tweetParserMessageRxQueueReady = false;

      var tweetParserMessage = tweetParserMessageRxQueue.dequeue();

      debug(chalkAlert("TWEET PARSER RX MESSAGE"
        + " | OP: " + tweetParserMessage.op
        // + "\n" + jsonPrint(m)
      ));

      if (tweetParserMessage.op === "parsedTweet") {

        var tweetObj = tweetParserMessage.tweetObj;

        if (!tweetObj.user) {
          console.log(chalkAlert("parsedTweet -- TW USER UNDEFINED"
            + " | " + tweetObj.tweetId
          ));
          tweetParserMessageRxQueueReady = true;
        }
        else {

          debug(chalkInfo("PARSED TW"
            + " [ TPMRQ: " + tweetParserMessageRxQueue.size() + "]"
            + " | " + tweetObj.tweetId
            + " | USR: " + tweetObj.user.screenName
            + " | Ms: " + tweetObj.mentions
            + " | Hs: " + tweetObj.hashtags.length
            + " | UMs: " + tweetObj.userMentions.length
            + " | M: " + tweetObj.media.length
            + " | URLs: " + tweetObj.url.length
            + " | PL: " + (tweetObj.place ? tweetObj.place.fullName : "")
          ));

          if (transmitNodeQueue.size() < MAX_Q) {
            transmitNodes(tweetObj, function(err){
              if (err) {
                // pmx.emit("ERROR", "TRANSMIT NODES ERROR");
                console.error(chalkError("TRANSMIT NODES ERROR\n" + err));
              }
              tweetParserMessageRxQueueReady = true;
            });
          }
          else {
            tweetParserMessageRxQueueReady = true;
          }
        }
      }
      else {
        console.error(chalkError("*** TWEET PARSER UNKNOWN OP"
          + " | INTERVAL: " + tweetParserMessage.op
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

  var sorterObj;
  var sortedKeys;
  var endIndex;
  var index;
  var i;
  var node;
  var nodeRate;

  sorterMessageRxQueueInterval = setInterval(function() {

    if (sorterMessageRxReady && !sorterMessageRxQueue.isEmpty()) {

      sorterMessageRxReady = false;

      sorterObj = sorterMessageRxQueue.dequeue();

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

          for (index=0; index < endIndex; index += 1){

            node = sortedKeys[index].toLowerCase();

            if (wordMeter[node]) {

              nodeRate = parseFloat(wordMeter[node].toJSON()[metricsRate]);

              wordsPerMinuteTopTermCache.set(node, nodeRate);

              if (!deletedMetricsHashmap.has(node) 
                && GOOGLE_METRICS_ENABLED 
                && (nodeRate > MIN_METRIC_VALUE)) {
                addTopTermMetricDataPoint(node, nodeRate);
              }
              else {
                debug(chalkLog("SKIP ADD METRIC | " + node + " | " + nodeRate.toFixed(3)));
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

  clearInterval(updaterMessageQueueInterval);

  var updaterObj;

  updaterMessageQueueInterval = setInterval(function() {

    if (updaterMessageReady && !updaterMessageQueue.isEmpty()) {

      updaterMessageReady = false;

      updaterObj = updaterMessageQueue.dequeue();

      switch (updaterObj.type){

        case "pong":
          debug(chalkLog("<UPDATER PONG"
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + updaterObj.timeStamp
          ));
          updaterMessageReady = true;
        break;

        case "stats":
          console.log(chalkLog("UPDATE STATS COMPLETE"
            + " | DB\n" + jsonPrint(updaterObj.db)
          ));
          if (updaterObj.db) {
            statsObj.db.totalAdmins = updaterObj.db.totalAdmins;
            statsObj.db.totalUsers = updaterObj.db.totalUsers;
            statsObj.db.totalViewers = updaterObj.db.totalViewers;
            statsObj.db.totalGroups = updaterObj.db.totalGroups;
            statsObj.db.totalSessions = updaterObj.db.totalSessions;
            statsObj.db.totalWords = updaterObj.db.totalWords;
          }
          updaterMessageReady = true;
        break;

        case "sendKeywordsComplete":
          console.log(chalkLog("UPDATE KEYWORDS COMPLETE"
            + " [ Q: " + updaterMessageQueue.size() + " ]"
            + " | " + moment().format(compactDateTimeFormat)
            + " | PID: " + updaterObj.pid
            + " | NUM KEYWORDS: " + updaterObj.keywords
          ));
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
          debugKeyword(chalkLog("KEYWORD: " + jsonPrint(updaterObj)));
          debugKeyword(chalkLog("UPDATE KEYWORD\n" + jsonPrint(updaterObj.keyword)));

          keywordHashMap.set(updaterObj.keyword.keywordId.toLowerCase(), updaterObj.keyword);
          updaterMessageReady = true;
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
    // if (sorterMessageRxQueue.length < MAX_Q){
      sorterMessageRxQueue.enqueue(m);
    // }
  });

  s.send({
    op: "INIT",
    interval: 2*DEFAULT_INTERVAL
  }, function(err){
    if (err) {
      // pmx.emit("ERROR", "SORTER SEND ERROR");
      console.error(chalkError("*** SORTER SEND ERROR"
        + " | " + err
      ));
    }
  });

  s.on("error", function(err){
    // pmx.emit("ERROR", "SORTER ERROR");
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
var updaterPingOutstanding = 0;

function initUpdaterPingInterval(interval){

  console.log(chalkAlert("INIT UPDATER PING INTERVAL"
    + " | " + interval + " MS"
  ));

  clearInterval(updaterPingInterval);

  updaterPingInterval = setInterval(function() {

    if (updaterPingOutstanding > 0) {
      console.error(chalkError("PING OUTSTANDING | " + updaterPingOutstanding));
      updaterPingOutstanding = 0;
      initUpdater();
    }

    updaterPingOutstanding = moment().format(compactDateTimeFormat);

    if (updater !== undefined){
      updater.send({
        op: "PING",
        message: hostname + "_" + process.pid,
        timeStamp: updaterPingOutstanding
      }, function(err){
        if (err) {
          // pmx.emit("ERROR", "PING ERROR");
          console.error(chalkError("*** UPDATER SEND ERROR"
            + " | " + err
          ));
        }
      });

      debug(chalkAlert(">UPDATER PING"
      ));

    }
    else {
      console.log(chalkError("!!! NO UPDATER PING ... UNDEFINED"
      ));
    }
  }, interval);
}

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
    // pmx.emit("ERROR", "UPDATER ERROR");
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
    // if (updaterMessageQueue.length < MAX_Q){
      updaterMessageQueue.enqueue(m);
    // }
  });

  u.send({
    op: "INIT",
    folder: ".",
    keywordFile: defaultDropboxKeywordFile,
    interval: KEYWORDS_UPDATE_INTERVAL
  }, function(err){
    if (err) {
      // pmx.emit("ERROR", "UPDATER INIT SEND ERROR");
      console.error(chalkError("*** UPDATER SEND ERROR"
        + " | " + err
      ));
    }
  });

  initUpdaterPingInterval(60000);

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
    if (tweetParserMessageRxQueue.size() < MAX_Q){
      tweetParserMessageRxQueue.enqueue(m);
    }
  });

  twp.send({
    op: "INIT",
    interval: TWEET_PARSER_INTERVAL
  }, function(err){
    if (err) {
      // pmx.emit("ERROR", "TWEET PARSER INIT SEND ERROR");
      console.error(chalkError("*** TWEET PARSER SEND ERROR"
        + " | " + err
      ));
    }
  });

  twp.on("error", function(err){
    // pmx.emit("ERROR", "TWEET PARSER ERROR");
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

function getCustomMetrics(callback){

  var googleRequest = {
    name: googleMonitoringClient.projectPath("graphic-tangent-627")
  };

  googleMonitoringClient.listMetricDescriptors(googleRequest)

    .then(function(results){

      const descriptors = results[0];

      console.log(chalkAlert("TOTAL METRICS: " + descriptors.length ));

      async.each(descriptors, function(descriptor, cb) {
        if (descriptor.name.includes("custom.googleapis.com")) {

          var nameArray = descriptor.name.split("/");
          var descriptorName = nameArray.pop().toLowerCase();

          console.log(chalkInfo("METRIC"
            + " | " + descriptorName
            // + "\n" + jsonPrint(descriptor)
          ));

          metricsHashmap.set(descriptorName, descriptor.name);
        }
        cb();
      }, function() {
        console.log(chalkAlert("METRICS: "
          + " | TOTAL: " + descriptors.length
          + " | CUSTOM: " + metricsHashmap.count()
        ));
        callback(null, null);
      });
    })
    .catch(function(err){
      if (err.code !== 8) {
        // pmx.emit("ERROR", "GOOGLE METRICS ERROR");
        console.log(chalkError("*** ERROR GOOGLE METRICS"
          + " | ERR CODE: " + err.code
          + " | META DATA: " + err.metadata
          + " | META NODE: " + err.note
        ));
        console.log(chalkError(err));
      }
      callback(err, null);
    });

}

var updateTimeSeriesCount = 0;

function initRateQinterval(interval){

  if (GOOGLE_METRICS_ENABLED) {
    // googleMonitoringClient = Monitoring.v3().metricServiceClient();
    googleMonitoringClient = Monitoring.metricServiceClient();

    getCustomMetrics(function(err, metrics){

    });
  }

  var wsObj = {};

  console.log(chalkLog("INIT RATE QUEUE INTERVAL | " + interval + " MS"));

  console.log(chalkError("GOOGLE METRICS ENABLED" + GOOGLE_METRICS_ENABLED));
  console.error(chalkError("GOOGLE METRICS ENABLED" + GOOGLE_METRICS_ENABLED));

  clearInterval(rateQinterval);

  // statsObj.obamaPerMinute = 0.0;
  // statsObj.trumpPerMinute = 0.0;
  statsObj.wordsPerMin = 0.0;
  statsObj.wordsPerSecond = 0.0;
  statsObj.maxWordsPerMin = 0.0;
  statsObj.maxTweetsPerMin = 0.0;

  statsObj.queues.transmitNodeQueue = transmitNodeQueue.size();
  statsObj.queues.tweetRxQueue = tweetRxQueue.size();
  statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
  statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.size();
  statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.size();

  statsObj.memory.memoryUsage.rss = process.memoryUsage().rss/(1024*1024);
  statsObj.memory.memoryUsage.heapUsed = process.memoryUsage().heap_used/(1024*1024);
  statsObj.memory.memoryUsage.heapTotal = process.memoryUsage().heap_total/(1024*1024);

  var queueNames;

  // var paramsSorter = {};

  // paramsSorter.obj = {};
  // paramsSorter.op = "SORT";
  // paramsSorter.sortKey = metricsRate;
  // paramsSorter.max = configuration.maxTopTerms;
  // // paramsSorter.obj = wordMeter;

  var memoryRssDataPoint = {};
  memoryRssDataPoint.metricType = "memory/rss";
  memoryRssDataPoint.metricLabels = {server_id: "MEM"};

  var memoryHeapUsedDataPoint = {};
  memoryHeapUsedDataPoint.metricType = "memory/heap_used";
  memoryHeapUsedDataPoint.metricLabels = {server_id: "MEM"};

  var memoryHeapTotalDataPoint = {};
  memoryHeapTotalDataPoint.metricType = "memory/heap_total";
  memoryHeapTotalDataPoint.metricLabels = {server_id: "MEM"};

  var dataPointTssTpm = {};
  dataPointTssTpm.metricType = "twitter/tweets_per_minute";
  dataPointTssTpm.metricLabels = {server_id: "TSS"};

  var dataPointTssTpm2 = {};
  dataPointTssTpm2.metricType = "twitter/tweet_limit";
  dataPointTssTpm2.metricLabels = {server_id: "TSS"};

  var dataPointTmsTpm = {};
  dataPointTmsTpm.metricType = "twitter/tweets_per_minute";
  dataPointTmsTpm.metricLabels = {server_id: "TMS"};

  var dataPointWpm = {};
  dataPointWpm.metricType = "word/words_per_minute";
  dataPointWpm.metricLabels = {server_id: "WORD"};

  var dataPointOpm = {};
  dataPointOpm.metricType = "word/obama_per_minute";
  dataPointOpm.metricLabels = {server_id: "WORD"};
  
  var dataPointOTrpm = {};
  dataPointOTrpm.metricType = "word/trump_per_minute";
  dataPointOTrpm.metricLabels = {server_id: "WORD"};

  var dataPointUtils = {};
  dataPointUtils.metricType = "util/global/number_of_utils";
  dataPointUtils.metricLabels = {server_id: "UTIL"};

  var dataPointViewers = {};
  dataPointViewers.metricType = "user/global/number_of_viewers";
  dataPointViewers.metricLabels = {server_id: "USER"};

  var dataPointUsers = {};
  dataPointUsers.metricType = "user/global/number_of_users";
  dataPointUsers.metricLabels = {server_id: "USER"};

  var dataPointNodeCache = {};
  dataPointNodeCache.metricType = "cache/node/keys";
  dataPointNodeCache.metricLabels = {server_id: "CACHE"};

  rateQinterval = setInterval(function () {

    statsObj.queues.transmitNodeQueue = transmitNodeQueue.size();
    statsObj.queues.tweetRxQueue = tweetRxQueue.size();
    statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
    statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.size();
    statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.size();

    // wsObj = wordStats.toJSON();

    // if (wsObj === undefined) {return;}

    // statsObj.wordsPerSecond = wsObj.wordsPerSecond[metricsRate];
    // statsObj.wordsPerMin = wsObj.wordsPerMinute[metricsRate];

    // debug(chalkLog(moment.utc().format(compactDateTimeFormat)
    //   + " | WPS: " + statsObj.wordsPerSecond.toFixed(2)
    //   + " | WPM: " + statsObj.wordsPerMin.toFixed(0)
    //   // + " | OPM: " + statsObj.obamaPerMinute.toFixed(0)
    //   // + " | TrPM: " + statsObj.trumpPerMinute.toFixed(0)
    // ));

    // if (statsObj.wordsPerMin > statsObj.maxWordsPerMin) {
    //   console.log(chalkLog("NEW MAX WPM: " + statsObj.wordsPerMin.toFixed(0)));
    //   statsObj.maxWordsPerMin = statsObj.wordsPerMin;
    //   statsObj.maxWordsPerMinTime = moment().valueOf();
    // }

    if (updateTimeSeriesCount === 0){

      var paramsSorter = {};

      paramsSorter.op = "SORT";
      paramsSorter.sortKey = metricsRate;
      paramsSorter.max = configuration.maxTopTerms;
      paramsSorter.obj = {};

      async.each(Object.keys(wordMeter), function(meterId, cb){

        debug(meterId + "\n" + jsonPrint(wordMeter[meterId].toJSON()));

        paramsSorter.obj[meterId] = pick(wordMeter[meterId].toJSON(), paramsSorter.sortKey);

        cb();

      }, function(err){

        debug("paramsSorter\n" + jsonPrint(paramsSorter));

        if (sorter !== undefined) {
          sorter.send(paramsSorter, function(err){
            if (err) {
              console.error(chalkError("SORTER SEND ERROR"
                + " | " + err
              ));
            }
          });
        }

      });

      if (GOOGLE_METRICS_ENABLED) {

        queueNames = Object.keys(statsObj.queues);

        var queueDataPoint = {};

        queueNames.forEach(function(queueName){
          queueDataPoint.metricType = "word/queues/" + queueName;
          queueDataPoint.value = statsObj.queues[queueName];
          queueDataPoint.metricLabels = {server_id: "QUEUE"};
          addMetricDataPoint(queueDataPoint);
        }); 

        memoryRssDataPoint.value = statsObj.memory.memoryUsage.rss;
        addMetricDataPoint(memoryRssDataPoint);

        memoryHeapUsedDataPoint.value = statsObj.memory.memoryUsage.heapUsed;
        addMetricDataPoint(memoryHeapUsedDataPoint);

        memoryHeapTotalDataPoint.value = statsObj.memory.memoryUsage.heapTotal;
        addMetricDataPoint(memoryHeapTotalDataPoint);

        dataPointWpm.value = statsObj.wordsPerMin;
        addMetricDataPoint(dataPointWpm);

        // dataPointOpm.value = statsObj.obamaPerMinute;
        // addMetricDataPoint(dataPointOpm);

        // dataPointOTrpm.value = statsObj.trumpPerMinute;
        // addMetricDataPoint(dataPointOTrpm);

        dataPointUtils.value = Object.keys(utilNameSpace.connected).length;
        addMetricDataPoint(dataPointUtils);

        // dataPointNodeCache.value = statsObj.caches.nodeCache.stats.keys;
        // addMetricDataPoint(dataPointNodeCache);

        if (tssServer.connected) {
          dataPointTssTpm.value = statsObj.utilities[tssServer.user.userId].tweetsPerMinute;
          addMetricDataPoint(dataPointTssTpm);

          dataPointTssTpm2.value = statsObj.utilities[tssServer.user.userId].twitterLimit;
          addMetricDataPoint(dataPointTssTpm2);
        }

        if (tmsServer.connected) {
          dataPointTmsTpm.value = statsObj.utilities[tmsServer.user.userId].tweetsPerMinute;
          addMetricDataPoint(dataPointTmsTpm);
          
          if (statsObj.utilities[tmsServer.user.userId].twitterLimit) {
            var dataPointTmsTpm2 = {};
            dataPointTmsTpm2.metricType = "twitter/tweet_limit";
            dataPointTmsTpm2.value = statsObj.utilities[tmsServer.user.userId].twitterLimit;
            dataPointTmsTpm2.metricLabels = {server_id: "TMS"};
            addMetricDataPoint(dataPointTmsTpm2);
          }
        }
      }
    }

    updateTimeSeriesCount += 1;

    if (updateTimeSeriesCount > 120) { updateTimeSeriesCount = 0; }

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

  loadYamlConfig(twitterYamlConfigFile, function(err, twitterConfig){
    if (err) {
      console.log(chalkError("*** LOADED TWITTER YAML CONFIG ERROR: FILE:  " + twitterYamlConfigFile));
      console.log(chalkError("*** LOADED TWITTER YAML CONFIG ERROR: ERROR: " + err));
    }
    else {
      console.log(chalkTwitter("LOADED TWITTER YAML CONFIG\n" + jsonPrint(twitterConfig)));

      twit = new Twit({
        consumer_key: twitterConfig.CONSUMER_KEY,
        consumer_secret: twitterConfig.CONSUMER_SECRET,
        access_token: twitterConfig.TOKEN,
        access_token_secret: twitterConfig.TOKEN_SECRET
      });

      updateTrends();
    }
  });

  initTweetParser();
  initInternetCheckInterval(10000);

  initAppRouting(function(err) {
    initDeletedMetricsHashmap(function(err, results){
      initSocketNamespaces();
      callback(err);
    });
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
      initTweetParser();
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

function initIgnoreWordsHashMap(callback) {
  async.each(ignoreWordsArray, function(ignoreWord, cb) {
    ignoreWordHashMap.set(ignoreWord, true);
    cb();
  }, function(err) {
    if (callback) { callback(err); }
  });
}

function initStatsInterval(interval){

  var statsUpdated = 0;
  var heapdumpFileName;

  console.log(chalkInfo("INIT STATS INTERVAL"
    + " | " + interval + " MS"
    + " | FILE: " + statsFolder + "/" + statsFile
  ));

  showStats(true);

  clearInterval(statsInterval);

  statsInterval = setInterval(function() {

    statsObj.serverTime = moment().valueOf();
    statsObj.timeStamp = moment().format(compactDateTimeFormat);
    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;

    statsObj.wordMeterEntries = Object.keys(wordMeter).length;

    if (statsObj.wordMeterEntries > statsObj.wordMeterEntriesMax) {
      statsObj.wordMeterEntriesMax = statsObj.wordMeterEntries;
      statsObj.wordMeterEntriesMaxTime = moment().valueOf();
      console.log(chalkAlert("NEW MAX WORD METER ENTRIES"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.wordMeterEntries.toFixed(0)
      ));
    }

    statsObj.memory.rss = process.memoryUsage().rss/(1024*1024);

    if (statsObj.memory.rss > statsObj.memory.maxRss) {
      statsObj.memory.maxRss = statsObj.memory.rss;
      statsObj.memory.maxRssTime = moment().valueOf();
      console.log(chalkAlert("NEW MAX RSS"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.memory.rss.toFixed(0) + " MB"
      ));
    }

    statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);

    if (statsObj.memory.heap > statsObj.memory.maxHeap) {
      statsObj.memory.maxHeap = statsObj.memory.heap;
      statsObj.memory.maxHeapTime = moment().valueOf();
      console.log(chalkAlert("NEW MAX HEAP"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.memory.heap.toFixed(0) + " MB"
      ));
    }

    statsObj.memory.memoryAvailable = os.freemem();
    statsObj.memory.memoryTotal = os.totalmem();
    statsObj.memory.memoryUsage = process.memoryUsage();

    statsObj.entity.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.user.connected = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;

    saveStats(statsFile, statsObj, function(status){
      debug(chalkAlert("SAVE STATS " + status));
    });

    showStats();

    statsUpdated += 1;

    if (HEAPDUMP_ENABLED && (statsUpdated > 1) && (statsUpdated % HEAPDUMP_MODULO == 0)) {

      heapdumpFileName = "was2" 
        + "_" + hostname 
        + "_" + process.pid 
        + "_" + moment().format(tinyDateTimeFormat) 
        + ".heapsnapshot";

      console.error(chalkError("***** HEAPDUMP *****"
        + " | STATS UPDATED: " +  statsUpdated
        + " | FILE: " +  heapdumpFileName
      ));

      heapdump.writeSnapshot(heapdumpFileName);
    }

  }, interval);
}

//=================================
// BEGIN !!
//=================================
initialize(configuration, function(err) {
  if (err) {
    console.log(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
    console.error(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
  } 
  else {
    debug(chalkLog("INITIALIZE COMPLETE"));
    initUpdaterMessageQueueInterval(DEFAULT_INTERVAL);
    initSorterMessageRxQueueInterval(2*DEFAULT_INTERVAL);

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
    initTransmitNodeQueueInterval(TRANSMIT_NODE_QUEUE_INTERVAL)
    initStatsInterval(STATS_UPDATE_INTERVAL);
    initIgnoreWordsHashMap();
    initUpdateTrendsInterval(UPDATE_TRENDS_INTERVAL);
    initRateQinterval(1000);
    initMetricsDataPointQueueInterval(60000);
    initTwitterRxQueueInterval(TWITTER_RX_QUEUE_INTERVAL);
    initTweetParserMessageRxQueueInterval(TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL);
    console.error("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");
    // pmx.emit("INIT_COMPLETE", process.pid);
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
