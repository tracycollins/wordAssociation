/*jslint node: true */
"use strict";

const MAX_Q = 1000;
const OFFLINE_MODE = false;

const slackOAuthAccessToken = "xoxp-3708084981-3708084993-206468961315-ec62db5792cd55071a51c544acf0da55";
const slackChannel = "#was";
const Slack = require("slack-node");

let slack = new Slack(slackOAuthAccessToken);

console.log("\n\n============== START ==============\n\n");

console.log("PROCESS PID: " + process.pid);

let quitOnError = true;

let HEAPDUMP_THRESHOLD = process.env.HEAPDUMP_THRESHOLD || 300;

const heapdump = require("heapdump");
const memwatch = require("memwatch-next");

let HEAPDUMP_ENABLED = false;
let HEAPDUMP_MODULO = process.env.HEAPDUMP_MODULO || 10;

// ==================================================================
// GLOBAL letIABLES
// ==================================================================
let statsObj = {};

const ONE_MINUTE = 60000;
const compactDateTimeFormat = "YYYYMMDD HHmmss";
const tinyDateTimeFormat = "YYYYMMDDHHmmss";

const MIN_METRIC_VALUE = 5.0;
const MIN_MENTIONS_VALUE = 1000;

const RATE_QUEUE_INTERVAL = 1000; // 1 second
const RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const KEYWORDS_UPDATE_INTERVAL = 30000;
const TWEET_PARSER_INTERVAL = 10;
const TWITTER_RX_QUEUE_INTERVAL = 10;
const TRANSMIT_NODE_QUEUE_INTERVAL = 10;
const TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 10;
const UPDATE_TRENDS_INTERVAL = 15*ONE_MINUTE;
const STATS_UPDATE_INTERVAL = 60000;

const DEFAULT_INTERVAL = 10;

const TOPTERMS_CACHE_DEFAULT_TTL = 60;
const TOPTERMS_CACHE_CHECK_PERIOD = 5;

const TRENDING_CACHE_DEFAULT_TTL = 300;
const TRENDING_CACHE_CHECK_PERIOD = 60;

const NODE_CACHE_DEFAULT_TTL = 60;
const NODE_CACHE_CHECK_PERIOD = 5;

let ignoreWordsArray = [
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

let metricsRate = "5MinuteRate";
const CUSTOM_GOOGLE_APIS_PREFIX = "custom.googleapis.com";

const util = require("util");
const Measured = require("measured");
const defaults = require("object.defaults");
const omit = require("object.omit");
const pick = require("object.pick");
const moment = require("moment");
const config = require("./config/config");
const os = require("os");
const fs = require("fs");
const path = require("path");
const async = require("async");
const yaml = require("yamljs");
const debug = require("debug")("wa");
const debugCache = require("debug")("cache");
const debugKeyword = require("debug")("kw");

const Queue = require("queue-fifo");
const express = require("./config/express");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Dropbox = require("dropbox");
const Monitoring = require("@google-cloud/monitoring").v3();

let googleMonitoringClient;

const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");

const metricsHashmap = new HashMap();
const deletedMetricsHashmap = new HashMap();

const Twit = require("twit");
let twit;
let twitterYamlConfigFile = process.env.ALTTHREECEE00_TWITTER_CONFIG;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

const chalk = require("chalk");
// const chalkAdmin = chalk.bold.black;
const chalkWarn = chalk.red;
const chalkTwitter = chalk.blue;
const chalkConnect = chalk.black;
const chalkSession = chalk.black;
const chalkDisconnect = chalk.black;
const chalkSocket = chalk.black;
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;

let languageServer = {};

let tmsServers = {};
let tssServers = {};

let currentTssServer = {};
currentTssServer.connected = false;
currentTssServer.user = {};
currentTssServer.socket = {};

let tmsServer = {};
tmsServer.connected = false;
tmsServer.user = {};
tmsServer.socket = {};

let wordMeter = {};

let tweetRxQueueInterval;
const tweetParserQueue = new Queue();
const tweetParserMessageRxQueue = new Queue();
const tweetRxQueue = new Queue();

let statsInterval;

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


let GOOGLE_METRICS_ENABLED = false;

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
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

const statsFolder = "/stats/" + hostname;
const statsFile = "wordAssoServer02Stats" 
  + "_" + moment().format(tinyDateTimeFormat) 
  + ".json";

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

const configFolder = "/config/utility/" + hostname;
const deletedMetricsFile = "deletedMetrics.json";

function jsonPrint(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } 
  else {
    return obj;
  }
}

function msToTime(duration) {
  let seconds = parseInt((duration / 1000) % 60);
  let minutes = parseInt((duration / (1000 * 60)) % 60);
  let hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  let days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

function slackPostMessage(channel, text, callback){

  debug(chalkInfo("SLACK POST: " + text));

  slack.api("chat.postMessage", {
    text: text,
    channel: channel
  }, function(err, response){
    if (err){
      console.error(chalkError("*** SLACK POST MESSAGE ERROR\n" + err));
    }
    else {
      debug(response);
    }
    if (callback !== undefined) { callback(err, response); }
  });
}

let nodeCacheTtl = process.env.NODE_CACHE_DEFAULT_TTL;
if (nodeCacheTtl === undefined) { nodeCacheTtl = NODE_CACHE_DEFAULT_TTL;}
console.log("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

let nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
if (nodeCacheCheckPeriod === undefined) { nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD;}
console.log("NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS");


const nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: nodeCacheCheckPeriod
});

function nodeCacheExpired(nodeCacheId, nodeObj) {

  debugCache(chalkLog("XXX $ NODE"
    + " | " + nodeObj.nodeType
    + " | " + nodeCacheId
  ));

  if (wordMeter[nodeCacheId] || (wordMeter[nodeCacheId] !== undefined)) {

    wordMeter[nodeCacheId].end();
    wordMeter[nodeCacheId] = null;

    wordMeter = omit(wordMeter, nodeCacheId);
    delete wordMeter[nodeCacheId];

    debugCache(chalkLog("XXX NODE METER WORD"
      + " | Ks: " + Object.keys(wordMeter).length
      + " | " + nodeCacheId
    ));


    if (statsObj.wordMeterEntries > statsObj.wordMeterEntriesMax) {
      statsObj.wordMeterEntriesMax = statsObj.wordMeterEntries;
      statsObj.wordMeterEntriesMaxTime = moment().valueOf();
      debugCache(chalkLog("NEW MAX WORD METER ENTRIES"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.wordMeterEntries.toFixed(0)
      ));
    }
  }
}

nodeCache.on("expired", nodeCacheExpired);

// ==================================================================
// TWITTER TRENDING TOPIC CACHE
// ==================================================================
let updateTrendsInterval;

let trendingCacheTtl = process.env.TRENDING_CACHE_DEFAULT_TTL;
if (trendingCacheTtl === undefined) {trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL;}
console.log("TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

const trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: TRENDING_CACHE_CHECK_PERIOD
});

let wordsPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (wordsPerMinuteTopTermTtl === undefined) {wordsPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;}
console.log("TOP TERMS WPM CACHE TTL: " + wordsPerMinuteTopTermTtl + " SECONDS");

let wordsPerMinuteTopTermCheckPeriod = process.env.TOPTERMS_CACHE_CHECK_PERIOD;
if (wordsPerMinuteTopTermCheckPeriod === undefined) {wordsPerMinuteTopTermCheckPeriod = TOPTERMS_CACHE_CHECK_PERIOD;}
console.log("TOP TERMS WPM CACHE CHECK PERIOD: " + wordsPerMinuteTopTermCheckPeriod + " SECONDS");

const wordsPerMinuteTopTermCache = new NodeCache({
  stdTTL: wordsPerMinuteTopTermTtl,
  checkperiod: TOPTERMS_CACHE_CHECK_PERIOD
});

function wordCacheExpired(word, wordRate) {
  debugCache(chalkInfo("XXX $ WPM TOPTERM | " + wordRate.toFixed(3) + " | " + word));
}

wordsPerMinuteTopTermCache.on("expired", wordCacheExpired);


let updateMetricsInterval;

let defaultDropboxKeywordFile = "keywords.json";

let internetReady = false;
let ioReady = false;

let configuration = {};
configuration.quitOnError = false;
configuration.maxTopTerms = process.env.WA_MAX_TOP_TERMS || 100;
configuration.metrics = {};
configuration.metrics.wordMeterEnabled = true;

if (process.env.NODE_WORD_METER_ENABLED !== undefined) {
  if (process.env.NODE_WORD_METER_ENABLED === "true") {
    configuration.metrics.wordMeterEnabled = true;
  }
  else if (process.env.NODE_WORD_METER_ENABLED === "false") {
    configuration.metrics.wordMeterEnabled = false;
  }
  else {
    configuration.metrics.wordMeterEnabled = true;
  }
}


let internetCheckInterval;

const app = express();

const http = require("http");
const httpServer = http.createServer(app);

let io;
const net = require("net");

const cp = require("child_process");
let updater;
const updaterMessageQueue = new Queue();
let sorter;
const sorterMessageRxQueue = new Queue();


const ignoreWordHashMap = new HashMap();
const keywordHashMap = new HashMap();

const localHostHashMap = new HashMap();

let tweetParser;

function initStats(callback){
  console.log(chalkAlert("INIT STATS"));
  statsObj = {};
  statsObj.memwatch = {};
  statsObj.memwatch.snapshotTaken = false;
  statsObj.memwatch.leak = {};
  statsObj.memwatch.stats = {};

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
  statsObj.twitter.tweetsPerMin = 0;
  statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();

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

  statsObj.caches = {};
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
  statsObj.memory.memoryUsage = {};
  statsObj.memory.memoryUsage = process.memoryUsage();
  // statsObj.memory.memoryUsage.heapUsed = process.memoryUsage().heapUsed/(1024*1024);
  // statsObj.memory.memoryUsage.heapTotal = process.memoryUsage().heapTotal/(1024*1024);
  // statsObj.memory.memoryUsage.rss = process.memoryUsage().rss/(1024*1024);

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

  callback();
}

function quit(message) {
  debug("\n... QUITTING ...");
  let msg = "";
  if (message) {msg = message;}
  debug("QUIT MESSAGE: " + msg);
  process.exit();
}

function getTimeStamp(inputTime) {
  let currentTimeStamp ;

  if (inputTime === undefined) {
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

function loadFile(path, file, callback) {

  console.log(chalkInfo("LOAD FOLDER " + path));
  console.log(chalkInfo("LOAD FILE " + file));
  console.log(chalkInfo("FULL PATH " + path + "/" + file));

  let fileExists = false;

  dropboxClient.filesDownload({path: path + "/" + file})
    .then(function(data) {
      console.log(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE: " + path + "/" + file
      ));

      let payload = data.fileBinary;
      debug(payload);

      if (file.match(/\.json$/gi)) {
        let fileObj = JSON.parse(payload);
        return(callback(null, fileObj));
      }
      else {
        return(callback(null, payload));
      }
    })
    .catch(function(error) {
      console.log(chalkError("DROPBOX loadFile ERROR: " + file + "\n" + error));
      console.log(chalkError("!!! DROPBOX READ " + file + " ERROR"));
      console.log(chalkError(jsonPrint(error)));

      if (error.status === 404) {
        console.error(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return(callback(null, null));
      }
      if (error.status === 0) {
        console.error(chalkError("!!! DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      return(callback(error, null));
    })
    .catch(function(err) {
      console.log(chalkError("*** ERROR DROPBOX LOAD FILE\n" + err));
      callback(err, null);
    });
}

function loadYamlConfig(yamlFile, callback){
  console.log(chalkInfo("LOADING YAML CONFIG FILE: " + yamlFile));
  fs.exists(yamlFile, function yamlCheckFileExists(exists) {
    if (exists) {
      let cnf = yaml.load(yamlFile);
      console.log(chalkInfo("FOUND FILE " + yamlFile));
      callback(null, cnf);
    }
    else {
      let err = "FILE DOES NOT EXIST: " + yamlFile ;
      callback(err, null);
    }
  });
}

function saveStats(statsFile, statsObj, callback) {

  let fullPath = statsFolder + "/" + statsFile;

  if (OFFLINE_MODE) {

    fs.exists(fullPath, function saveStatsCheckFileExists (exists) {
      if (exists) {
        fs.stat(fullPath, function saveStatsFileStats(error, stats) {
          if (error) { 
            return(callback(error, stats)); 
          }
          fs.open(fullPath, "w", function saveStatsFileOpen(error, fd) {
            if (error) { 
              fs.close(fd);
              return(callback(error, fd));
            }
            fs.writeFile(path, statsObj, function saveStatsFileWrite(error) {
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

  let options = {};

  options.contents = JSON.stringify(statsObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function dropboxFilesUpload(){
      debug(chalkLog(moment().format(compactDateTimeFormat)
        + " | SAVED DROPBOX JSON | " + options.path
      ));
      callback("OK");
    })
    .catch(function dropboxFilesUploadError(err){
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
  statsObj.twitter.tweetsPerMin = parseInt(tweetMeter.toJSON()[metricsRate]);

  if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin){
    statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
    statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
  }

  if (options) {
    console.log(chalkLog("STATS\n" + jsonPrint(statsObj)));
  }

  console.log(chalkLog("S"
    + " | " + moment().format(compactDateTimeFormat)
    + " | E: " + statsObj.elapsed
    + " | S: " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
    + " | AD: " + statsObj.entity.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    // + " | US: " + statsObj.entity.user.connected
    + " | VW: " + statsObj.entity.viewer.connected
    + " | TwRxPM: " + statsObj.twitter.tweetsPerMin
    + " | TwRXQ: " + tweetRxQueue.size()
    + " | TwPRQ: " + tweetParserQueue.size()
    + " | RSS: " + statsObj.memory.rss.toFixed(2) + " MB"
    + " - MAX: " + statsObj.memory.maxRss.toFixed(2)
    + " - " + moment(parseInt(statsObj.memory.maxRssTime)).format(compactDateTimeFormat)
    // + " | H: " + statsObj.memory.heap.toFixed(2) + " MB"
    // + " - MAX: " + statsObj.memory.maxHeap.toFixed(2)
    // + " - " + moment(parseInt(statsObj.memory.maxHeapTime)).format(compactDateTimeFormat)
  ));
}

function initDeletedMetricsHashmap(callback){
  loadFile(configFolder, deletedMetricsFile, function deleteMetricFileLoad(err, deletedMetricsObj){
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
      async.each(Object.keys(deletedMetricsObj), function deleteMetricHashmapEntry(metricName, cb){
        deletedMetricsHashmap.set(metricName, deletedMetricsObj[metricName]);
        debug(chalkLog("+ DELETED METRIC | " + metricName ));
        cb();
      }, function deleteMetricComplete(err){
        if (err) {
          console.error(chalkError("ERROR INIT DELETED METRICS  HASHMAP | " + deletedMetricsFile + "\n" + err ));
        }
        debug(chalkLog("LOADED DELETED METRICS | " + deletedMetricsHashmap.count() ));
        if (callback !== undefined) { callback(null, null); }
      });
    }
   });
}

process.on("exit", function processExit() {
  if (tweetParser !== undefined) { tweetParser.kill("SIGINT"); }
  if (updater !== undefined) { updater.kill("SIGINT"); }
  if (sorter !== undefined) { sorter.kill("SIGINT"); }
});

process.on("message", function processMessageRx(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    debug("\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n");
    debug("... SAVING STATS");

    clearInterval(internetCheckInterval);

    saveStats(statsFile, statsObj, function processMessageSaveStats(status) {
      if (status !=="OK") {
        debug("!!! ERROR: saveStats " + status);
      } 
      else {
        debug(chalkLog("UPDATE STATUS OK"));
      }
    });

    setTimeout(function quitTimeout() {
      showStats(true);
      debug("**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n");
      quit(msg);
    }, 300);
  }
});

let configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function configEventsNewListener(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

let adminNameSpace;
let utilNameSpace;
let userNameSpace;
let viewNameSpace;


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

const tweetMeter = new Measured.Meter({rateUnit: 60000});
 
function socketRxTweet(tw) {

  statsObj.twitter.tweetsReceived += 1;
  tweetMeter.mark();
  // statsObj.twitter.tweetsPerMinute = parseFloat(tweetMeter.toJSON()[metricsRate]);

  debug(chalkSocket("tweet" 
    + " [" + statsObj.twitter.tweetsReceived + "]"
    + " | " + tw.id_str
    + " | " + tw.user.id_str
    + " | " + tw.user.screen_name
    + " | " + tw.user.name
  ));

  if (tweetRxQueue.size() > MAX_Q){

    statsObj.errors.twitter.maxRxQueue += 1;

    if (statsObj.errors.twitter.maxRxQueue % 100 === 0) {
      console.log(chalkError("*** TWEET RX MAX QUEUE [" + tweetRxQueue.size() + "]"
        + " | " + getTimeStamp()
        + " | MAX Q EVENTS: " + statsObj.errors.twitter.maxRxQueue
        + " | " + tw.id_str
        + " | " + tw.user.screen_name
      ));
    }
  }
  else if (tw.user) {

    tw.inc = true;

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
}

function initSocketHandler(socketObj) {

  const socket = socketObj.socket;

  const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  const socketConnectText = "\n*SOCKET CONNECT*"
    // + " | " + socket.id
    + "\n" + hostname
    + " | " + socketObj.namespace
    + " | " + ipAddress
    + "\nAD: " + statsObj.entity.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | US: " + statsObj.entity.user.connected
    + " | VW: " + statsObj.entity.viewer.connected;

  console.log(chalkAlert("SOCKET CONNECT"
    + " | " + ipAddress
    + " | " + socketObj.namespace
    + " | " + socket.id
    + " | AD: " + statsObj.entity.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | US: " + statsObj.entity.user.connected
    + " | VW: " + statsObj.entity.viewer.connected
  ));

  slackPostMessage(slackChannel, socketConnectText);

  socket.emit("SERVER_READY", {connected: hostname});

  socket.on("reconnect_error", function reconnectError(errorObj) {
    statsObj.socket.reconnect_errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("reconnect_failed", function reconnectFailed(errorObj) {
    statsObj.socket.reconnect_fails += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT FAILED: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_error", function connectError(errorObj) {
    statsObj.socket.connect_errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_timeout", function connectTimeout(errorObj) {
    statsObj.socket.connect_timeouts += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT TIMEOUT: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function socketError(error) {
    statsObj.socket.errors += 1;
    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | *** SOCKET ERROR" + " | " + socket.id + " | " + error));
  });

  socket.on("reconnect", function socketReconnect() {
    statsObj.socket.reconnects += 1;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
  });

  socket.on("disconnect", function socketDisconnect(status) {
    statsObj.socket.disconnects += 1;

    console.log(chalkAlert("SOCKET CONNECT " + socket.id));

    debug(chalkDisconnect(moment().format(compactDateTimeFormat) 
      + " | SOCKET DISCONNECT: " + socket.id + "\nstatus\n" + jsonPrint(status)
    ));

    if (tmsServers[socket.id] !== undefined) { 
      console.error(chalkSession("XXX DELETED TMS SERVER" 
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + tmsServers[socket.id].user.userId
        + " | " + socket.id
      ));
      delete tmsServers[socket.id];
    }
    if (tssServers[socket.id] !== undefined) { 
      console.error(chalkSession("XXX DELETED TSS SERVER" 
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + tssServers[socket.id].user.userId
        + " | " + socket.id
      ));
      delete tssServers[socket.id];
      currentTssServer.connected = false;
    }
  });

  socket.on("SESSION_KEEPALIVE", function sessionKeepalive(userObj) {

    if (statsObj.utilities[userObj.userId] === undefined) {
      statsObj.utilities[userObj.userId] = {};
    }

    statsObj.socket.keepalives += 1;

    if (userObj.stats) {statsObj.utilities[userObj.userId] = userObj.stats;}

    if (userObj.userId.match(/LA_/g)){
      userObj.isServer = true;

      languageServer.connected = true;
      languageServer.user = userObj;

      debug(chalkSession("K-LA" 
        + " | " + userObj.userId
        + " | " + socket.id
        + " | " + moment().format(compactDateTimeFormat)
        // + "\n" + jsonPrint(userObj)
      ));
    }
 
    if (userObj.userId.match(/TMS_/g)){
      userObj.isServer = true;

      if (tmsServers[socket.id] === undefined) { 
        tmsServers[socket.id] = {};
        console.error(chalkSession("+++ ADDED TMS SERVER" 
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + userObj.userId
          + " | " + socket.id
        ));
      }

      tmsServers[socket.id].connected = true;
      tmsServers[socket.id].user = userObj;
    }
 
    if (userObj.userId.match(/TSS_/g)){
      userObj.isServer = true;

      if (tssServers[socket.id] === undefined) {
        tssServers[socket.id] = {};
        console.error(chalkSession("+++ ADDED TSS SERVER" 
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + userObj.userId
          + " | " + socket.id
        ));
      }

      tssServers[socket.id].connected = true;
      tssServers[socket.id].user = userObj;
      currentTssServer = tssServers[socket.id];
    }
  });

  socket.on("USER_READY", function userReady(userObj) {
    console.log(chalkSocket("USER READY"
      + " | " + getTimeStamp()
      + " | " + userObj.userId
      + " | SENT " + moment(parseInt(userObj.timeStamp)).format(compactDateTimeFormat)
      // + "\n" + jsonPrint(userObj)
    ));

    socket.emit("USER_READY_ACK", 
      {
        userId: userObj.userId,
        timeStamp: moment().valueOf()
      }
    );
  });

  socket.on("VIEWER_READY", function viewerReady(viewerObj) {
    console.log(chalkSocket("VIEWER READY"
      + " | " + getTimeStamp()
      + " | " + viewerObj.viewerId
      + " | SENT AT " + moment(parseInt(viewerObj.timeStamp)).format(compactDateTimeFormat)
    ));

    socket.emit("VIEWER_READY_ACK", 
      {
        userId: viewerObj.viewerId,
        timeStamp: moment().valueOf(),
        viewerSessionKey: moment().valueOf()
      }
    );
  });

  socket.on("tweet", socketRxTweet);
}

function initSocketNamespaces(callback){

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT SOCKET NAMESPACES"));

  io = require("socket.io")(httpServer, { reconnection: true });

  adminNameSpace = io.of("/admin");
  utilNameSpace = io.of("/util");
  userNameSpace = io.of("/user");
  viewNameSpace = io.of("/view");

  adminNameSpace.on("connect", function adminConnect(socket) {
    console.log(chalkAlert("ADMIN CONNECT " + socket.id));
    statsObj.entity.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "admin", socket: socket});
  });

  utilNameSpace.on("connect", function utilConnect(socket) {
    console.log(chalkAlert("UTIL CONNECT " + socket.id));
    statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "util", socket: socket});
  });

  userNameSpace.on("connect", function userConnect(socket) {
    console.log(chalkAlert("USER CONNECT " + socket.id));
    statsObj.entity.user.connected = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "user", socket: socket});
  });

  viewNameSpace.on("connect", function viewConnect(socket) {
    console.log(chalkAlert("VIEWER CONNECT " + socket.id));
    statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "view", socket: socket});
  });

  ioReady = true;

  if (callback !== undefined) { callback(); }
}

function checkKeyword(nodeObj, callback) {

  debug(chalkLog("checkKeyword"
    + " | " + nodeObj.nodeType
    + " | " + nodeObj.nodeId
    + "\n" + jsonPrint(nodeObj)
  ));
  
  if ((nodeObj.nodeType === "user") 
    && (nodeObj.screenName !== undefined) 
    && (nodeObj.screenName) 
    && keywordHashMap.has(nodeObj.screenName.toLowerCase())) {
    debug(chalkLog("HIT USER SNAME"));
    nodeObj.isKeyword = true;
    nodeObj.keywords = keywordHashMap.get(nodeObj.screenName.toLowerCase());
  }
  else if ((nodeObj.nodeType === "user") 
    && (nodeObj.name !== undefined) 
    && (nodeObj.name) 
    && keywordHashMap.has(nodeObj.name.toLowerCase())) {
    debug(chalkLog("HIT USER NAME"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.name.toLowerCase());
    nodeObj.isKeyword = true;
  }
  else if ((nodeObj.nodeType === "place") 
    && keywordHashMap.has(nodeObj.name.toLowerCase())) {
    debug(chalkLog("HIT PLACE NAME"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.name.toLowerCase());
    nodeObj.isKeyword = true;
  }
  else if (nodeObj.nodeId && keywordHashMap.has(nodeObj.nodeId.toLowerCase())) {
    debug(chalkLog("HIT NODE ID"));
    nodeObj.keywords = keywordHashMap.get(nodeObj.nodeId.toLowerCase());
    nodeObj.isKeyword = true;
    if ((nodeObj.nodeType === "user") 
      && (nodeObj.name === undefined) 
      && (nodeObj.screenName === undefined)) {
      nodeObj.screenName = nodeObj.nodeId;
    }
  }
  else if (nodeObj.text && keywordHashMap.has(nodeObj.text.toLowerCase())) {
    debug(chalkLog("HIT TEXT"));
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

        wordsPerMinuteTopTermCache.get(nodeObj.screenName.toLowerCase(), function topTermScreenName(err, screenName) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (screenName !== undefined) {
            debug(chalkLog("TOP TERM: " + screenName));
            nodeObj.isTopTerm = true;
          }
          callback(nodeObj);
        });
      }
      else if (nodeObj.name) {
        nodeObj.isTwitterUser = true;
        nodeObj.screenName = nodeObj.name;
        wordsPerMinuteTopTermCache.get(nodeObj.name.toLowerCase(), function topTermName(err, name) {
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
      wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function topTermHashtag(err, nodeId) {
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

      debug(chalkLog("PLACE | checkKeyword\n" + jsonPrint(nodeObj)));
      debug(chalkInfo("PLACE | checkKeyword"
        + " | " + nodeObj.name
        + " | " + nodeObj.fullName
        + " | " + nodeObj.country
      ));

      wordsPerMinuteTopTermCache.get(nodeObj.name.toLowerCase(), function topTermPlace(err, nodeId) {
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
      wordsPerMinuteTopTermCache.get(nodeObj.nodeId.toLowerCase(), function topTermWord(err, nodeId) {
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
  twit.get("trends/place", {id: 1}, function updateTrendsWorldWide (err, data, response){

    debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));

    if (err){
      console.log(chalkError("*** TWITTER GET trends/place ID=1 ERROR ***"
        + " | " + err
      ));
    }
    else if (data){
      debug(chalkInfo("LOAD TWITTER TREND - WORLDWIDE"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function trendingCacheSetWorldWide(element){
        element.trends.forEach(function trendElementWorldWide(topic){
          debug(chalkInfo(
            topic.name
          ));
          trendingCache.set(topic.name, topic);
        });
      });
    }
  });
  
  twit.get("trends/place", {id: 23424977}, function updateTrendsUs (err, data, response){

    debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));

    if (err){
      console.log(chalkError("*** TWITTER GET trends/place ID=23424977 ERROR ***"
        + " | " + err
      ));
    }
    else if (data){

      trendingCache.set("america", {name: "america"});

      debug(chalkInfo("LOAD TWITTER TREND - US"
        // + "\n" + jsonPrint(data)
      ));
      data.forEach(function trendingCacheSetUs(element){
        element.trends.forEach(function trendElementUs(topic){
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

  console.log(chalkLog("INIT UPDATE TRENDS INTERVAL: " + interval + " MS"));

  clearInterval(updateTrendsInterval);

  if (twit !== undefined) { updateTrends(); }

  updateTrendsInterval = setInterval(function updateTrendsIntervalCall () {
    if (twit !== undefined) { updateTrends(); }
  }, interval);
}

function updateWordMeter(wordObj, callback){


  if (!configuration.metrics.wordMeterEnabled
    || (wordObj.nodeType === "media") 
    || (wordObj.nodeType === "url")
    || (wordObj.nodeType === "keepalive")
    ) {
    callback(null, wordObj);
    return;
  }

  let meterWordId;

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

    debug(chalkLog("updateWordMeter IGNORE " + meterWordId));

    wordObj.isIgnored = true;
    wordMeter[meterWordId] = null;
    delete wordMeter[meterWordId];

    if (callback !== undefined) { callback(null, wordObj); }
  }
  else {
    if (/TSS_/.test(meterWordId) || wordObj.isServer){
      debug(chalkLog("updateWordMeter\n" + jsonPrint(wordObj)));
      if (callback !== undefined) { callback(null, wordObj); }
    }
    else if (!wordMeter[meterWordId] 
      || (Object.keys(wordMeter[meterWordId]).length === 0)
      || (wordMeter[meterWordId] === undefined) ){

      wordMeter[meterWordId] = null;

      const newMeter = new Measured.Meter({rateUnit: 60000});

      newMeter.mark();
      wordObj.rate = parseFloat(newMeter.toJSON()[metricsRate]);

      wordMeter[meterWordId] = newMeter;

      nodeCache.set(meterWordId, wordObj);

      statsObj.wordMeterEntries = Object.keys(wordMeter).length;

      if (statsObj.wordMeterEntries > statsObj.wordMeterEntriesMax) {
        statsObj.wordMeterEntriesMax = statsObj.wordMeterEntries;
        statsObj.wordMeterEntriesMaxTime = moment().valueOf();
        debug(chalkLog("NEW MAX WORD METER ENTRIES"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + statsObj.wordMeterEntries.toFixed(0)
        ));
      }

      if (callback !== undefined) { callback(null, wordObj); }
    }
    else {
      wordMeter[meterWordId].mark();
      wordObj.rate = parseFloat(wordMeter[meterWordId].toJSON()[metricsRate]);

      nodeCache.set(meterWordId, wordObj);

      if (callback !== undefined) { callback(null, wordObj); }
    }
  }
}

let transmitNodeQueueReady = true;
let transmitNodeQueueInterval;
const transmitNodeQueue = new Queue();

function initTransmitNodeQueueInterval(interval){

  console.log(chalkLog("INIT TRANSMIT NODE QUEUE INTERVAL: " + interval + " MS"));

  clearInterval(transmitNodeQueueInterval);
  let nodeObj;

  transmitNodeQueueInterval = setInterval(function txNodeQueue () {

    if (transmitNodeQueueReady && (!transmitNodeQueue.isEmpty())){

      transmitNodeQueueReady = false;

      nodeObj = transmitNodeQueue.dequeue();

      if (!nodeObj) {
        console.error(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q"));
        transmitNodeQueueReady = true;
      }
      else {
        checkKeyword(nodeObj, function checkKeywordCallback(node){
          updateWordMeter(node, function updateWordMeterCallback(err, n){
            if (!err) {
              viewNameSpace.volatile.emit("node", n);
            }
            transmitNodeQueueReady = true;
          });
        });
      }

    }
  }, interval);
}

function transmitNodes(tw, callback){
  debug("TX NODES");

  tw.userMentions.forEach(function userMentionsTxNodeQueue(user){
    if (user) {transmitNodeQueue.enqueue(user);}
  });

  tw.hashtags.forEach(function hashtagsTxNodeQueue(hashtag){
    if (hashtag) {transmitNodeQueue.enqueue(hashtag);}
  });

  // tw.media.forEach(function(media){
  //   if (media) {transmitNodeQueue.enqueue(media);}
  // });

  tw.urls.forEach(function urlsTxNodeQueue(url){
    if (url) {transmitNodeQueue.enqueue(url);}
  });

  if (tw.place) {transmitNodeQueue.enqueue(tw.place);}

  if (tw.user) {transmitNodeQueue.enqueue(tw.user);}

  callback();
}

const metricsDataPointQueue = new Queue();
let metricsDataPointQueueReady = true;
let metricsDataPointQueueInterval;

function initMetricsDataPointQueueInterval(interval){

  console.log(chalkLog("INIT METRICS DATA POINT QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(metricsDataPointQueueInterval);

  let googleRequest = {};

  if (GOOGLE_METRICS_ENABLED) {
    googleRequest.name = googleMonitoringClient.projectPath(process.env.GOOGLE_PROJECT_ID);
    googleRequest.timeSeries = [];
  }


  metricsDataPointQueueInterval = setInterval(function metricsInterval() {

    initDeletedMetricsHashmap();

    if (GOOGLE_METRICS_ENABLED && !metricsDataPointQueue.isEmpty() && metricsDataPointQueueReady) {

      metricsDataPointQueueReady = false;

      debug(chalkLog("METRICS TIME SERIES"
        + "\n" + jsonPrint(googleRequest.timeSeries)
      ));

      googleRequest.timeSeries.length = 0;

      async.each(metricsDataPointQueue, function metricsGoogleRequest(dataPoint, cb){

        googleRequest.timeSeries.push(dataPoint);
        cb();

      }, function metricsGoogleRequestError(err){

        if (err) {
          console.error(chalkError("ERROR INIT METRICS DATAPOINT QUEUE INTERVAL\n" + err ));
        }

        metricsDataPointQueue.clear();

        googleMonitoringClient.createTimeSeries(googleRequest)
          .then(function createTimeSeries(){
            debug(chalkInfo("METRICS"
              + " | DATA POINTS: " + googleRequest.timeSeries.length 
              // + " | " + options.value
            ));
            metricsDataPointQueueReady = true;
          })
          .catch(function createTimeSeriesError(err){
            if (statsObj.errors.google[err.code] === undefined) {
              statsObj.errors.google[err.code] = 0;
            }
            statsObj.errors.google[err.code] += 1;
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
            // googleRequest.timeSeries.forEach(function(dataPoint){
            //   debug(chalkLog(dataPoint.metric.type + " | " + dataPoint.points[0].value.doubleValue));
            // });
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

  debug(chalkLog("addMetricDataPoint"
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

  debug(chalkLog("addMetricDataPoint AFTER\n" + jsonPrint(options)));

  let dataPoint = {
    interval: { endTime: { seconds: options.endTime } },
    value: {}
  };

  dataPoint.value[options.dataType] = parseFloat(options.value);

  let timeSeriesData = {
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

  nodeCache.get(node, function nodeCacheGet(err, nodeObj){
    if (err) {
      console.error(chalkInfo("ERROR addTopTermMetricDataPoint " + err
        // + " | " + node
      ));
    }
    else if (nodeObj === undefined) {
      console.error(chalkError("?? SORTED NODE NOT IN WORD $"
        + " | " + node
      ));
    }
    else if (parseInt(nodeObj.mentions) > MIN_MENTIONS_VALUE) {

      debug(chalkInfo("+++ TOP TERM METRIC"
        + " | " + node
        + " | Ms: " + nodeObj.mentions
        + " | RATE: " + nodeRate.toFixed(2)
      ));

      const topTermDataPoint = {
        displayName: node,
        metricTyp: "word/top10/" + node,
        value: parseFloat(nodeRate),
        metricLabels: {server_id: "WORD"}
      };

      addMetricDataPoint(topTermDataPoint);
    }
  });
}


let heartbeatsSent = 0;
let memoryAvailableMB;
let memoryTotalMB;
let memoryAvailablePercent;

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

configEvents.on("SERVER_READY", function serverReady() {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SERVER_READY EVENT"));

  httpServer.on("reconnect", function serverReconnect() {
    internetReady = true;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | PORT RECONNECT: " + config.port));
  });

  httpServer.on("connect", function serverConnect() {
    statsObj.socket.connects += 1;
    internetReady = true;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | PORT CONNECT: " + config.port));

    httpServer.on("disconnect", function serverDisconnect() {
      internetReady = false;
      console.log(chalkError("\n***** PORT DISCONNECTED | " + moment().format(compactDateTimeFormat) 
        + " | " + config.port));
    });
  });

  httpServer.listen(config.port, function serverListen() {
    debug(chalkInfo(moment().format(compactDateTimeFormat) + " | LISTENING ON PORT " + config.port));
  });

  httpServer.on("error", function serverError(err) {
    statsObj.socket.errors += 1;
    internetReady = false;
    debug(chalkError("??? HTTP ERROR | " + moment().format(compactDateTimeFormat) + "\n" + err));
    if (err.code === "EADDRINUSE") {
      debug(chalkError("??? HTTP ADDRESS IN USE: " + config.port + " ... RETRYING..."));
      setTimeout(function serverErrorTimeout() {
        httpServer.listen(config.port, function serverErrorListen() {
          debug("LISTENING ON PORT " + config.port);
        });
      }, 5000);
    }
  });

  memoryAvailableMB = (statsObj.memory.memoryAvailable/(1024*1024));
  memoryTotalMB = (statsObj.memory.memoryTotal/(1024*1024));
  memoryAvailablePercent = (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal);

  setInterval(function hearbeatInterval() {

    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;
    statsObj.memory.memoryTotal = os.totalmem();
    statsObj.memory.memoryAvailable = os.freemem();
    statsObj.memory.memoryUsage = process.memoryUsage();

    if (internetReady && ioReady) {

      heartbeatsSent += 1;

      statsObj.configuration = configuration;

      utilNameSpace.volatile.emit("HEARTBEAT", statsObj);
      adminNameSpace.volatile.emit("HEARTBEAT", statsObj);
      userNameSpace.volatile.emit("HEARTBEAT", statsObj);
      viewNameSpace.volatile.emit("HEARTBEAT", statsObj);

      if (heartbeatsSent % 60 === 0) { logHeartbeat(); }

    } 
    else {
      if (moment().seconds() % 10 === 0) {
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

  const exp = require("express");

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT APP ROUTING"));

  app.use(function requestLog(req, res, next) {
    // console.log("REQ\n" + util.inspect(req, {showHidden:false, depth:1}));
    console.log(chalkAlert("R>"
      + " | " + moment().format(compactDateTimeFormat)
      + " | IP: " + req.ip
      // + " | IPS: " + req.ips
      + " | HOST: " + req.hostname
      // + " | BASE URL: " + req.baseUrl
      + " | METHOD: " + req.method
      + " | PATH: " + req.path
      // + " | RES: " + util.inspect(res, {showHidden:false, depth:1})
      // + " | ROUTE: " + req.route
      // + " | PROTOCOL: " + req.protocol
      // + "\nQUERY: " + jsonPrint(req.query)
      // + "\nPARAMS: " + jsonPrint(req.params)
      // + "\nCOOKIES: " + jsonPrint(req.cookies)
      // + "\nBODY: " + jsonPrint(req.baseUrl)
    ));
    if (req.path === "/") {
      console.log(chalkAlert("R> REDIRECT /session")); 
      res.redirect("/session");
    }
    else if (req.path === "/slack_event"){
      if (req.body.type === "url_verification") {
        console.log(chalkAlert("R> SLACK EVENT"
          + " | TOKEN: " + req.body.token
          + " | CHALLENGE: " + req.body.challenge
        ));
        res.send(req.body.challenge);
      }
      else {
        console.log(chalkAlert("R> SLACK EVENT"));
        console.log(chalkAlert(util.inspect(req.body, {showHidden:false, depth:1})));
      }
    }
    else {
      next();
    }
  });

  app.use(exp.static("./"));
  app.use(exp.static("./js"));
  app.use(exp.static("./css"));
  app.use(exp.static("./node_modules"));
  app.use(exp.static("./public/assets/images"));

  const adminHtml = __dirname + "/admin/admin.html";
  app.get("/admin", function requestAdmin(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log(chalkAlert("LOADING PAGE"
      + " | REQ: " + req.url
      + " | RES: " + adminHtml
      // + "\n" + jsonPrint(req.query)
      // + "\n" + util.inspect(req, {showHidden:false, depth:4})
    ));
    res.sendFile(adminHtml, function responseAdmin(err) {
      if (err) {
        console.error("GET /session ERROR:"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + req.url
          + " | " + adminHtml
          + " | " + err
        );
      } 
      else {
        debug(chalkInfo("SENT:", adminHtml));
      }
    });
  });

  const sessionHtml = __dirname + "/sessionModular.html";

  app.get("/session", function requestSession(req, res, next) {
    debug(chalkInfo("get next\n" + next));
    console.log(chalkAlert("LOADING PAGE"
      + " | REQ: " + req.url
      + " | RES: " + sessionHtml
      // + "\n" + jsonPrint(req.query)
      // + "\n" + util.inspect(req, {showHidden:false, depth:4})
    ));
    res.sendFile(sessionHtml, function responseSession(err) {
      if (err) {
        console.error("GET /session ERROR:"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + req.url
          + " | " + sessionHtml
          + " | " + err
        );
      } 
      else {
        debug(chalkInfo("SENT:", sessionHtml));
      }
    });
  });

  callback(null);
}

function initInternetCheckInterval(interval){

  debug(chalkInfo(moment().format(compactDateTimeFormat) 
    + " | INIT INTERNET CHECK INTERVAL | " + interval + " MS"));

  let serverStatus;
  let serverError;
  let callbackInterval;
  let testClient;

  clearInterval(internetCheckInterval);

  internetCheckInterval = setInterval(function internetCheck(){

    testClient = net.createConnection(80, "www.google.com");

    testClient.on("connect", function testConnect() {
      internetReady = true;
      statsObj.socket.connects += 1;
      debug(chalkInfo(moment().format(compactDateTimeFormat) + " | CONNECTED TO GOOGLE: OK"));
      debug(chalkInfo(moment().format(compactDateTimeFormat) + " | SEND SERVER_READY"));
      configEvents.emit("SERVER_READY");
      testClient.destroy();
      serverStatus = "SERVER_READY";
      clearInterval(internetCheckInterval);
    });

    testClient.on("error", function testError(err) {
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

  callbackInterval = setInterval(function checkInterval(){
    if (serverStatus || serverError) {
      debug(chalkLog("INIT INTERNET CHECK INTERVAL"
        + " | ERROR: "  + serverError
        + " | STATUS: " + serverStatus
      ));
      clearInterval(callbackInterval);
    }
  }, interval);
}

function initTwitterRxQueueInterval(interval){

  let tweet;

  console.log(chalkLog("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

    if (!tweetRxQueue.isEmpty()) {

      tweet =  tweetRxQueue.dequeue();

      debug(chalkInfo("TPQ<"
        + " [" + tweetRxQueue.size() + "]"
        // + " | " + socket.id
        + " | " + tweet.id_str
        + " | " + tweet.user.id_str
        + " | " + tweet.user.screen_name
        + " | " + tweet.user.name
      ));

      tweetParser.send({ op: "tweet", tweetStatus: tweet }, function sendTweetParser(err){
        if (err) {
          // pmx.emit("ERROR", "TWEET PARSER SEND ERROR");
          console.error(chalkError("*** TWEET PARSER SEND ERROR"
            + " | " + err
          ));
          if (quitOnError) {
            quit("TWEET PARSER SEND ERROR");
          }
        }
      });

    }
  }, interval);
}

let tweetParserMessageRxQueueReady = true;
let tweetParserMessageRxQueueInterval;
function initTweetParserMessageRxQueueInterval(interval){

  console.log(chalkLog("INIT TWEET PARSER MESSAGE RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetParserMessageRxQueueInterval);

  let tweetParserMessage;
  let tweetObj;

  tweetParserMessageRxQueueInterval = setInterval(function tweetParserMessageRxQueueDequeue() {

    if (!tweetParserMessageRxQueue.isEmpty() && tweetParserMessageRxQueueReady) {

      tweetParserMessageRxQueueReady = false;

      tweetParserMessage = tweetParserMessageRxQueue.dequeue();

      debug(chalkLog("TWEET PARSER RX MESSAGE"
        + " | OP: " + tweetParserMessage.op
        // + "\n" + jsonPrint(m)
      ));

      if (tweetParserMessage.op === "parsedTweet") {

        tweetObj = tweetParserMessage.tweetObj;

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
            transmitNodes(tweetObj, function transmitNode(err){
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

let sorterMessageRxReady = true; 
let sorterMessageRxQueueInterval;
function initSorterMessageRxQueueInterval(interval){

  console.log(chalkLog("INIT SORTER RX MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(sorterMessageRxQueueInterval);

  let sortedKeys;
  let endIndex;
  let index;
  // let i;
  let node;
  let nodeRate;
  let sorterObj;

  sorterMessageRxQueueInterval = setInterval(function sorterMessageRxQueueDequeue() {

    if (sorterMessageRxReady && !sorterMessageRxQueue.isEmpty()) {

      sorterMessageRxReady = false;

      sorterObj = sorterMessageRxQueue.dequeue();
      // let sortedKeys;
      // let endIndex;
      // let index;
      // // let i;
      // let node;
      // let nodeRate;

      switch (sorterObj.op){

        case "SORTED":

          debug(chalkLog("SORT ---------------------"));

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

let updaterPingInterval;
let updaterPingOutstanding = 0;
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

  const u = cp.fork(`${__dirname}/js/libs/updater.js`);

  u.on("error", function updaterError(err){
    // pmx.emit("ERROR", "UPDATER ERROR");
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER ERROR ***"
      + " \n" + jsonPrint(err)
    ));

    clearInterval(updaterPingInterval);

    configEvents.emit("CHILD_ERROR", { name: "updater" });
    initUpdater();
  });

  u.on("exit", function updaterExit(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER EXIT ***"
      + " | EXIT CODE: " + code
    ));

    clearInterval(updaterPingInterval);

    if (code > 0) { configEvents.emit("CHILD_ERROR", { name: "updater" }); }

  });

  u.on("close", function updaterClose(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER CLOSE ***"
      + " | EXIT CODE: " + code
    ));

    clearInterval(updaterPingInterval);
  });

  u.on("message", function updaterMessage(m){
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
  }, function updaterSendError(err){
    if (err) {
      // pmx.emit("ERROR", "UPDATER INIT SEND ERROR");
      console.error(chalkError("*** UPDATER SEND ERROR"
        + " | " + err
      ));
      initUpdater();
    }
  });

  updater = u;

  if (callback !== undefined) { callback(null, u); }
}

function initUpdaterPingInterval(interval){

  console.log(chalkLog("INIT UPDATER PING INTERVAL"
    + " | " + interval + " MS"
  ));

  clearInterval(updaterPingInterval);

  updaterPingInterval = setInterval(function updaterPing() {

    if (updaterPingOutstanding > 0) {
      console.error(chalkError("PING OUTSTANDING | " + updaterPingOutstanding));
      updaterPingOutstanding = 0;
      initUpdater();
      slackPostMessage(slackChannel, "\n*UPDATER PING TIMEOUT*\nOUTSTANDING PINGS: " + updaterPingOutstanding + "\n");
    }

    updaterPingOutstanding = moment().format(compactDateTimeFormat);

    if (updater !== undefined){
      updater.send({
        op: "PING",
        message: hostname + "_" + process.pid,
        timeStamp: updaterPingOutstanding
      }, function updaterPingError(err){
        if (err) {
          // pmx.emit("ERROR", "PING ERROR");
          console.error(chalkError("*** UPDATER SEND ERROR"
            + " | " + err
          ));
          slackPostMessage(slackChannel, "\n*UPDATER SEND ERROR*\n" + err);
          initUpdater();
        }
      });

      debug(chalkLog(">UPDATER PING"
      ));

    }
    else {
      console.log(chalkError("!!! NO UPDATER PING ... UNDEFINED"
      ));
    }
  }, interval);

}

let updaterMessageReady = true;
let updaterMessageQueueInterval;
function initUpdaterMessageQueueInterval(interval){

  console.log(chalkInfo("INIT UPDATER MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(updaterMessageQueueInterval);

  let updaterObj;

  updaterMessageQueueInterval = setInterval(function updaterMessageRx() {

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
          debug(chalkLog("UPDATE STATS COMPLETE"
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
          keywordHashMap.remove(updaterObj.keyword);
          keywordHashMap.remove(updaterObj.keyword.toLowerCase());
          console.log(chalkLog("KEYWORD REMOVE: " + updaterObj.keyword.toLowerCase()));
          updaterMessageReady = true;
        break;

        case "keyword":
          debugKeyword(chalkLog("KEYWORD: " + jsonPrint(updaterObj)));
          debugKeyword(chalkLog("UPDATE KEYWORD\n" + jsonPrint(updaterObj.keyword)));

          if (typeof updaterObj.keyword.keywordId !== "string") {
            console.error("KEYWORD IS NOT A STRING: " + updaterObj.keyword.keywordId);
            quit();
          }

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

  const s = cp.fork(`${__dirname}/js/libs/sorter.js`);

  s.on("message", function sorterMessageRx(m){
    debug(chalkLog("SORTER RX"
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
  }, function sorterMessageRxError(err){
    if (err) {
      // pmx.emit("ERROR", "SORTER SEND ERROR");
      console.error(chalkError("*** SORTER SEND ERROR"
        + " | " + err
      ));
    }
  });

  s.on("error", function sorterError(err){
    // pmx.emit("ERROR", "SORTER ERROR");
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER ERROR ***"
      + " \n" + jsonPrint(err)
    ));

    configEvents.emit("CHILD_ERROR", { name: "sorter" });
  });

  s.on("exit", function sorterExit(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER EXIT ***"
      + " | PID: " + s.pid
      + " | EXIT CODE: " + code
    ));

    if (code > 0) { configEvents.emit("CHILD_ERROR", { name: "sorter" }); }
  });

  s.on("close", function sorterClose(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER CLOSE ***"
      + " | PID: " + s.pid
      + " | EXIT CODE: " + code
    ));
  });

  sorter = s;

  if (callback !== undefined) { callback(null, sorter); }
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

  const twp = cp.fork(`${__dirname}/js/libs/tweetParser.js`);

  twp.on("message", function tweetParserMessageRx(m){
    debug(chalkLog("TWEET PARSER RX MESSAGE"
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
  }, function tweetParserMessageRxError(err){
    if (err) {
      // pmx.emit("ERROR", "TWEET PARSER INIT SEND ERROR");
      console.error(chalkError("*** TWEET PARSER SEND ERROR"
        + " | " + err
      ));
    }
  });

  twp.on("error", function tweetParserError(err){
    // pmx.emit("ERROR", "TWEET PARSER ERROR");
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER ERROR ***"
      + " \n" + jsonPrint(err)
    ));
  });

  twp.on("exit", function tweetParserExit(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER EXIT ***"
      + " | EXIT CODE: " + code
    ));
  });

  twp.on("close", function tweetParserClose(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER CLOSE ***"
      + " | EXIT CODE: " + code
    ));
  });

  tweetParser = twp;

  if (callback !== undefined) { callback(null, twp); }
}

function getCustomMetrics(){

  let googleRequest = {
    name: googleMonitoringClient.projectPath("graphic-tangent-627")
  };

  googleMonitoringClient.listMetricDescriptors(googleRequest)

    .then(function listMetricDescriptors(results){

      const descriptors = results[0];

      console.log(chalkLog("TOTAL METRICS: " + descriptors.length ));

      async.each(descriptors, function metricsHashmapSet(descriptor, cb) {
        if (descriptor.name.includes("custom.googleapis.com")) {

          let nameArray = descriptor.name.split("/");
          let descriptorName = nameArray.pop().toLowerCase();

          debug(chalkInfo("METRIC"
            + " | " + descriptorName
            // + "\n" + jsonPrint(descriptor)
          ));

          metricsHashmap.set(descriptorName, descriptor.name);
        }
        cb();
      }, function metricsHashmapSetComplete() {
        console.log(chalkLog("METRICS: "
          + " | TOTAL: " + descriptors.length
          + " | CUSTOM: " + metricsHashmap.count()
        ));
        // callback(null, null);
      });
    })
    .catch(function metricsHashmapSetError(err){
      if (err.code !== 8) {
        // pmx.emit("ERROR", "GOOGLE METRICS ERROR");
        console.log(chalkError("*** ERROR GOOGLE METRICS"
          + " | ERR CODE: " + err.code
          + " | META DATA: " + err.metadata
          + " | META NODE: " + err.note
        ));
        console.log(chalkError(err));
      }
      // callback(err, null);
    });
}

const cacheObj = {
  "nodeCache": nodeCache,
  "wordsPerMinuteTopTermCache": wordsPerMinuteTopTermCache,
  "trendingCache": trendingCache
};

let cacheObjKeys;

function initRateQinterval(interval){

  if (GOOGLE_METRICS_ENABLED) {
    // googleMonitoringClient = Monitoring.v3().metricServiceClient();
    googleMonitoringClient = Monitoring.metricServiceClient();

    getCustomMetrics();
  }

  // let wsObj = {};

  console.log(chalkLog("INIT RATE QUEUE INTERVAL | " + interval + " MS"));

  // console.log(chalkError("GOOGLE METRICS ENABLED" + GOOGLE_METRICS_ENABLED));
  if (GOOGLE_METRICS_ENABLED) { console.log(chalkAlert("*** GOOGLE METRICS ENABLED ***")); }
  

  clearInterval(updateMetricsInterval);

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

  // statsObj.memory.memoryUsage.rss = process.memoryUsage().rss/(1024*1024);
  // statsObj.memory.memoryUsage.heapUsed = process.memoryUsage().heap_used/(1024*1024);
  // statsObj.memory.memoryUsage.heapTotal = process.memoryUsage().heap_total/(1024*1024);

  cacheObjKeys.forEach(function statsCachesUpdate(cacheName){
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
  let queueNames;

  let memoryRssDataPoint = {};
  memoryRssDataPoint.metricType = "memory/rss";
  memoryRssDataPoint.metricLabels = {server_id: "MEM"};

  let memoryHeapUsedDataPoint = {};
  memoryHeapUsedDataPoint.metricType = "memory/heap_used";
  memoryHeapUsedDataPoint.metricLabels = {server_id: "MEM"};

  let memoryHeapTotalDataPoint = {};
  memoryHeapTotalDataPoint.metricType = "memory/heap_total";
  memoryHeapTotalDataPoint.metricLabels = {server_id: "MEM"};

  let dataPointTssTpm = {};
  dataPointTssTpm.metricType = "twitter/tweets_per_minute";
  dataPointTssTpm.metricLabels = {server_id: "TSS"};

  let dataPointTssTpm2 = {};
  dataPointTssTpm2.metricType = "twitter/tweet_limit";
  dataPointTssTpm2.metricLabels = {server_id: "TSS"};

  let dataPointTmsTpm = {};
  dataPointTmsTpm.metricType = "twitter/tweets_per_minute";
  dataPointTmsTpm.metricLabels = {server_id: "TMS"};

  let dataPointWpm = {};
  dataPointWpm.metricType = "word/words_per_minute";
  dataPointWpm.metricLabels = {server_id: "WORD"};

  let dataPointOpm = {};
  dataPointOpm.metricType = "word/obama_per_minute";
  dataPointOpm.metricLabels = {server_id: "WORD"};
  
  let dataPointOTrpm = {};
  dataPointOTrpm.metricType = "word/trump_per_minute";
  dataPointOTrpm.metricLabels = {server_id: "WORD"};

  let dataPointUtils = {};
  dataPointUtils.metricType = "util/global/number_of_utils";
  dataPointUtils.metricLabels = {server_id: "UTIL"};

  let dataPointViewers = {};
  dataPointViewers.metricType = "user/global/number_of_viewers";
  dataPointViewers.metricLabels = {server_id: "USER"};

  let dataPointUsers = {};
  dataPointUsers.metricType = "user/global/number_of_users";
  dataPointUsers.metricLabels = {server_id: "USER"};

  let dataPointNodeCache = {};
  dataPointNodeCache.metricType = "cache/node/keys";
  dataPointNodeCache.metricLabels = {server_id: "CACHE"};

  let updateTimeSeriesCount = 0;
  let paramsSorter = {};

  updateMetricsInterval = setInterval(function updateMetrics () {

    statsObj.queues.transmitNodeQueue = transmitNodeQueue.size();
    statsObj.queues.tweetRxQueue = tweetRxQueue.size();
    statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
    statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.size();
    statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.size();

    updateTimeSeriesCount += 1;

    if (updateTimeSeriesCount % RATE_QUEUE_INTERVAL_MODULO === 0){

      paramsSorter.op = "SORT";
      paramsSorter.sortKey = metricsRate;
      paramsSorter.max = configuration.maxTopTerms;
      paramsSorter.obj = {};

      async.each(Object.keys(wordMeter), function sorterParams(meterId, cb){

        if (!wordMeter[meterId]) {
          console.error(chalkError("*** ERROR NULL wordMeter[meterId]: " + meterId));
        }

        paramsSorter.obj[meterId] = pick(wordMeter[meterId].toJSON(), paramsSorter.sortKey);

        cb();

      }, function(err){

        // console.log(chalkAlert("paramsSorter\n" + jsonPrint(paramsSorter)));

        if (err) {
          console.error(chalkError("ERROR RATE QUEUE INTERVAL\n" + err ));
        }

        if (sorter !== undefined) {
          sorter.send(paramsSorter, function sendSorterError(err){
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

        let queueDataPoint = {};

        queueNames.forEach(function metricsQueues(queueName){
          queueDataPoint.metricType = "word/queues/" + queueName;
          queueDataPoint.value = statsObj.queues[queueName];
          queueDataPoint.metricLabels = {server_id: "QUEUE"};
          addMetricDataPoint(queueDataPoint);
        }); 

        // memoryRssDataPoint.value = statsObj.memory.memoryUsage.rss;
        // addMetricDataPoint(memoryRssDataPoint);

        // memoryHeapUsedDataPoint.value = statsObj.memory.memoryUsage.heapUsed;
        // addMetricDataPoint(memoryHeapUsedDataPoint);

        // memoryHeapTotalDataPoint.value = statsObj.memory.memoryUsage.heapTotal;
        // addMetricDataPoint(memoryHeapTotalDataPoint);

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

        if (currentTssServer.connected) {
          dataPointTssTpm.value = statsObj.utilities[currentTssServer.user.userId].tweetsPerMinute;
          addMetricDataPoint(dataPointTssTpm);

          dataPointTssTpm2.value = statsObj.utilities[currentTssServer.user.userId].twitterLimit;
          addMetricDataPoint(dataPointTssTpm2);
        }

        if (tmsServer.connected) {
          dataPointTmsTpm.value = statsObj.utilities[tmsServer.user.userId].tweetsPerMinute;
          addMetricDataPoint(dataPointTmsTpm);
          
          if (statsObj.utilities[tmsServer.user.userId].twitterLimit) {
            let dataPointTmsTpm2 = {};
            dataPointTmsTpm2.metricType = "twitter/tweet_limit";
            dataPointTmsTpm2.value = statsObj.utilities[tmsServer.user.userId].twitterLimit;
            dataPointTmsTpm2.metricLabels = {server_id: "TMS"};
            addMetricDataPoint(dataPointTmsTpm2);
          }
        }
      }
    }

  }, interval);
}

function initialize(cnf, callback) {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INITIALIZE"));

  let configArgs = Object.keys(cnf);
  configArgs.forEach(function finalConfigs(arg){
    debug("FINAL CONFIG | " + arg + ": " + cnf[arg]);
  });

  if (cnf.quitOnError) { 
    debug(chalkAlert("===== QUIT ON ERROR SET ====="));
  }

  loadYamlConfig(twitterYamlConfigFile, function initTwit(err, twitterConfig){
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

  initAppRouting(function initAppRoutingComplete() {
    initDeletedMetricsHashmap(function initDeletedMetricsHashmapComplete(){
      initSocketNamespaces();
      callback();
    });
  });
}

configEvents.on("CHILD_ERROR", function childError(childObj){

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
  async.each(ignoreWordsArray, function ignoreWordHashMapSet(ignoreWord, cb) {
    ignoreWordHashMap.set(ignoreWord, true);
    ignoreWordHashMap.set(ignoreWord.toLowerCase(), true);
    cb();
  }, function ignoreWordHashMapError(err) {
    if (callback) { callback(err); }
  });
}

let memStatsInterval;

function initStatsInterval(interval){

  let statsUpdated = 0;
  let heapdumpFileName;

  console.log(chalkInfo("INIT STATS INTERVAL"
    + " | " + interval + " MS"
    + " | FILE: " + statsFolder + "/" + statsFile
  ));

  showStats(true);

  clearInterval(statsInterval);
  clearInterval(memStatsInterval);

  memStatsInterval = setInterval(function updateMemStats() {
    statsObj.memory.rss = process.memoryUsage().rss/(1024*1024);

    if (statsObj.memory.rss > statsObj.memory.maxRss) {
      statsObj.memory.maxRss = statsObj.memory.rss;
      statsObj.memory.maxRssTime = moment().valueOf();
      console.error(chalkAlert("NEW MAX RSS"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.memory.rss.toFixed(0) + " MB"
      ));
    }
  }, 1000);

  statsInterval = setInterval(function updateStats() {

    statsObj.serverTime = moment().valueOf();
    statsObj.timeStamp = moment().format(compactDateTimeFormat);
    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;

    statsObj.wordMeterEntries = Object.keys(wordMeter).length;

    if (statsObj.wordMeterEntries > statsObj.wordMeterEntriesMax) {
      statsObj.wordMeterEntriesMax = statsObj.wordMeterEntries;
      statsObj.wordMeterEntriesMaxTime = moment().valueOf();
      debug(chalkLog("NEW MAX WORD METER ENTRIES"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.wordMeterEntries.toFixed(0)
      ));
    }

    statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);

    if (statsObj.memory.heap > statsObj.memory.maxHeap) {
      statsObj.memory.maxHeap = statsObj.memory.heap;
      statsObj.memory.maxHeapTime = moment().valueOf();
      console.log(chalkLog("NEW MAX HEAP"
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

    saveStats(statsFile, statsObj, function saveStatsComplete(status){
      debug(chalkLog("SAVE STATS " + status));
    });

    showStats();

    statsUpdated += 1;

    if ((HEAPDUMP_ENABLED || (statsObj.memory.maxRss > HEAPDUMP_THRESHOLD)) 
      && (statsUpdated > 1) 
      && (statsUpdated % HEAPDUMP_MODULO === 0)) {

      heapdumpFileName = "was2" 
        + "_" + hostname 
        + "_" + moment().format(tinyDateTimeFormat) 
        + "_" + process.pid 
        + ".heapsnapshot";

      console.log(chalkError("***** HEAPDUMP *****"
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

// function sendDirectMessage(user, message, callback) {
  
//   twit.post("direct_messages/new", {screen_name: user, text:message}, function twitPostComplete(error, response){

//     if(error) {
//       console.log(chalkError("!!!!! TWITTER SEND DIRECT MESSAGE ERROR: " 
//         + moment().format(compactDateTimeFormat) 
//         + "\nERROR\n"  + jsonPrint(error)
//         + "\nRESPONSE\n"  + jsonPrint(response)
//       ));
//       if (callback !== undefined) { callback(error, message); }
//     }
//     else{
//       console.log(chalkTwitter(moment().format(compactDateTimeFormat)
//         + " | SENT TWITTER DM TO " + user
//         + ": " + response.text
//       ));
//       if (callback !== undefined) { callback(null, message); }
//     }

//   });
// }

let hd;

initStats(function setCacheObjKeys(){
  cacheObjKeys = Object.keys(statsObj.caches);
});

initialize(configuration, function initializeComplete(err) {
  if (err) {
    console.log(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
    console.error(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
  } 
  else {
    debug(chalkLog("INITIALIZE COMPLETE"));
    initUpdaterMessageQueueInterval(DEFAULT_INTERVAL);
    initSorterMessageRxQueueInterval(2*DEFAULT_INTERVAL);

    initUpdater(function initUpdaterComplete(err, udtr){
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
        initUpdaterPingInterval(60000);
      }
    });
    
    initSorter(function initSorterComplete(err, srtr){
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
    initTransmitNodeQueueInterval(TRANSMIT_NODE_QUEUE_INTERVAL);
    initStatsInterval(STATS_UPDATE_INTERVAL);
    initIgnoreWordsHashMap();
    initUpdateTrendsInterval(UPDATE_TRENDS_INTERVAL);
    initRateQinterval(RATE_QUEUE_INTERVAL);
    initMetricsDataPointQueueInterval(60000);
    initTwitterRxQueueInterval(TWITTER_RX_QUEUE_INTERVAL);
    initTweetParserMessageRxQueueInterval(TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL);
    console.log(chalkInfo("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS"));

    console.log(chalkAlert("CONFIGURATION\n" + jsonPrint(configuration)));

    if (!configuration.metrics.wordMeterEnabled) {
      console.log(chalkAlert("*** WORD RATE METER DISABLED ***"));
    }

    statsObj.configuration = configuration;

    memwatch.on("leak", function memwatchLeak(info) {

      const diff = hd.end();

      statsObj.memwatch.snapshotTaken = false;
      statsObj.memwatch.leak = info;

      console.error(chalkError("MEM LEAK"
        + " | " + getTimeStamp()
        + " | RSS" + info.growth
        + " | GROWTH: " + info.growth
        + " | " + info.reason
       ));

      console.log(chalkError("*** MEM DIFF *** \n" + util.inspect(diff, {showHidden:false, depth:4})));

      const heapdumpFileName = "was2" 
        + "_" + hostname 
        + "_" + moment().format(tinyDateTimeFormat) 
        + "_" + process.pid 
        + "_LEAK"
        + ".heapsnapshot";

      console.log(chalkError("***** HEAPDUMP MEMORY LEAK *****"
        + " | " + getTimeStamp()
        + " | FILE: " +  heapdumpFileName
      ));

      heapdump.writeSnapshot(heapdumpFileName);

      const growth = info.growth/(1024*1024);

      const dmString = "\n*MEM LEAK*"
        + " | " + hostname 
        + "\nGRW: " + growth.toFixed(3) + " MB"
        + "\nRSS: " + statsObj.memory.rss.toFixed(3) + " MB"
        + "\nMAX: " + statsObj.memory.maxRss.toFixed(3) + " MB"
        + " | " + moment(parseInt(statsObj.memory.maxRssTime)).format(compactDateTimeFormat) + " MB"
        + "\n" + info.reason;

      // sendDirectMessage("threecee", dmString);
      slackPostMessage(slackChannel, dmString);

    });

    memwatch.on("stats", function memwatchStats(stats) {
      if(statsObj.memwatch.snapshotTaken ===false) {
        hd = new memwatch.HeapDiff();
        console.error(chalkAlert(getTimeStamp() + " | MEM SNAPSHOT TAKEN"));
        statsObj.memwatch.snapshotTaken = true;
      }
      statsObj.memwatch.stats = stats;
      statsObj.memwatch.stats.estimated_base = stats.estimated_base/(1024*1024);
      statsObj.memwatch.stats.current_base = stats.current_base/(1024*1024);
      statsObj.memwatch.stats.min = stats.min/(1024*1024);
      statsObj.memwatch.stats.max = stats.max/(1024*1024);

      debug(chalkInfo("MEM"
        + " | " + getTimeStamp()
        + " | FGCs: " + stats.num_full_gc
        + " | IGCs: " + stats.num_inc_gc
        + " | TREND: " + stats.usage_trend
        + " | EBASE: " + statsObj.memwatch.stats.estimated_base.toFixed(3) + " MB"
        + " | CBASE: " + statsObj.memwatch.stats.current_base.toFixed(3) + " MB"
        + " | MIN: " + statsObj.memwatch.stats.min.toFixed(3) + " MB"
        + " | MAX: " + statsObj.memwatch.stats.max.toFixed(3) + " MB"
        // + "\n" + jsonPrint(info)
       ));
      // console.log(chalkInfo("MEM STATS\n" + jsonPrint(stats)));
    });

    // sendDirectMessage("threecee", "INIT " + hostname + " | " + moment().format(compactDateTimeFormat));
    slackPostMessage(slackChannel, "\n*INIT* | " + hostname + "\n");

  }
});

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
