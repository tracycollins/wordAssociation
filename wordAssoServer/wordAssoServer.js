/*jslint node: true */
"use strict";

const bestRuntimeNetworkFileName = "bestRuntimeNetwork.json";
const bestNetworkFolder = "/config/utility/best/neuralNetworks";
let bestRuntimeNetworkId = false;
let bestNetworkObj = {};

let tweetParserReady = false;
let previousBestNetworkId = "";

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const MAX_SESSION_AGE = ONE_DAY/1000;
const MAX_Q = 200;
const OFFLINE_MODE = false;

// const oauthConfig = require("./oauth.js");
const passport = require("passport");
// const authStrategies = require("./authentication.js");

// const heapdumpThresholdEnabled = true;
// let hd;

let twitterUserThreecee = {
    userId : "14607119",
    profileImageUrl : "http://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
    profileUrl : "http://twitter.com/threecee",
    url : "http://threeCeeMedia.com",
    name : "Tracy Collins",
    screenName : "threecee",
    nodeId : "14607119",
    nodeType : "user",
    following : null,
    description : "photography + animation + design",
    isTwitterUser : true,
    screenNameLower : "threecee"
};

let defaultTwitterUser = twitterUserThreecee;

let metricsRate = "1MinuteRate";

const exp = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const deepcopy = require("deep-copy");
const MongoDBStore = require("express-session-mongo");

// const sessionStore = new MongoDBStore({
//   uri: "mongodb://127.0.0.1/wordAsso?replicaSet=rs0",
//   collection: "oauthSessions"
// });

// const sessionStore = new MongoDBStore({
//   uri: "mongodb://127.0.0.1/wordAsso?replicaSet=rs0",
//   collection: "oauthSessions"
// });

// sessionStore.on("error", function(error) {
//   console.log(chalkError("MONGO SESSION STORE ERROR\n" + jsonPrint(error))); 
// });

const slackOAuthAccessToken = "xoxp-3708084981-3708084993-206468961315-ec62db5792cd55071a51c544acf0da55";
const slackChannel = "#was";
const Slack = require("slack-node");

const slack = new Slack(slackOAuthAccessToken);

console.log("\n\n============== START ==============\n\n");

console.log("PROCESS PID: " + process.pid);

let quitOnError = true;

// let HEAPDUMP_THRESHOLD = process.env.HEAPDUMP_THRESHOLD || 2048;

// const heapdump = require("heapdump");
// const memwatch = require("memwatch-next");

// let HEAPDUMP_ENABLED = false;
// let HEAPDUMP_MODULO = process.env.HEAPDUMP_MODULO || 10;

// ==================================================================
// GLOBAL letIABLES
// ==================================================================
let statsObj = {};
statsObj.bestNetwork = {};

const compactDateTimeFormat = "YYYYMMDD HHmmss";
const tinyDateTimeFormat = "YYYYMMDDHHmmss";

const MIN_METRIC_VALUE = 5.0;
const MIN_MENTIONS_VALUE = 1000;
const MIN_FOLLOWERS = 25000;

const RATE_QUEUE_INTERVAL = 1000; // 1 second
const RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const KEYWORDS_UPDATE_INTERVAL = 30000;
const TWEET_PARSER_INTERVAL = 5;
const TWITTER_RX_QUEUE_INTERVAL = 5;
const TRANSMIT_NODE_QUEUE_INTERVAL = 5;
const TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 5;
const UPDATE_TRENDS_INTERVAL = 15*ONE_MINUTE;
const STATS_UPDATE_INTERVAL = 60000;

const DEFAULT_INTERVAL = 5;

const AUTH_USER_CACHE_DEFAULT_TTL = MAX_SESSION_AGE;
const AUTH_USER_CACHE_CHECK_PERIOD = ONE_HOUR/1000; // seconds

const AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL = 60000;
const AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD = 1000;

const TOPTERMS_CACHE_DEFAULT_TTL = 60;
const TOPTERMS_CACHE_CHECK_PERIOD = 5;

const TRENDING_CACHE_DEFAULT_TTL = 300;
const TRENDING_CACHE_CHECK_PERIOD = 60;

const NODE_CACHE_DEFAULT_TTL = 60;
const NODE_CACHE_CHECK_PERIOD = 5;

const ignoreWordsArray = [
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

// const Queue = require("queue-fifo");
const express = require("./config/express");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
require("isomorphic-fetch");
// const Dropbox = require("dropbox");
const Dropbox = require('dropbox').Dropbox;
// const Dropbox = require("./js/libs/dropbox").Dropbox;

const Monitoring = require("@google-cloud/monitoring");

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
// const chalkNetwork = chalk.blue;

const tweetMeter = new Measured.Meter({rateUnit: 60000});

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
// const tweetParserQueue = new Queue();
// const tweetParserMessageRxQueue = new Queue();
// const tweetRxQueue = new Queue();
const tweetParserQueue = [];
const tweetParserMessageRxQueue = [];
const tweetRxQueue = [];

let statsInterval;

// if (process.env.HEAPDUMP_ENABLED !== undefined) {

//   console.log(chalkError("DEFINED process.env.HEAPDUMP_ENABLED: " + process.env.HEAPDUMP_ENABLED));

//   if (process.env.HEAPDUMP_ENABLED === "true") {
//     HEAPDUMP_ENABLED = true;
//     console.log(chalkError("TRUE process.env.HEAPDUMP_ENABLED: " + process.env.HEAPDUMP_ENABLED));
//     console.log(chalkError("TRUE HEAPDUMP_ENABLED: " + HEAPDUMP_ENABLED));
//   }
//   else if (process.env.HEAPDUMP_ENABLED === "false") {
//     HEAPDUMP_ENABLED = false;
//     console.log(chalkError("FALSE process.env.HEAPDUMP_ENABLED: " + process.env.HEAPDUMP_ENABLED));
//     console.log(chalkError("FALSE HEAPDUMP_ENABLED: " + HEAPDUMP_ENABLED));
//   }

//   console.log(chalkError("HEAPDUMP_MODULO: " + HEAPDUMP_MODULO));
// }


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
const statsFile = "wordAssoServerStats" 
  + "_" + moment().format(tinyDateTimeFormat) 
  + ".json";

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

const configFolder = "/config/utility/" + hostname;
const deletedMetricsFile = "deletedMetrics.json";

const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const dbConnection = wordAssoDb();

let Hashtag;
let Media;
let Place;
let Tweet;
let Url;
let User;
let Word;

dbConnection.on("error", console.error.bind(console, "connection error:"));
dbConnection.once("open", function() {
  console.log("CONNECT: wordAssoServer Mongo DB default connection open to " + config.wordAssoDb);
  Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
  Media = mongoose.model("Media", mediaModel.MediaSchema);
  Place = mongoose.model("Place", placeModel.PlaceSchema);
  Tweet = mongoose.model("Tweet", tweetModel.TweetSchema);
  Url = mongoose.model("Url", urlModel.UrlSchema);
  User = mongoose.model("User", userModel.UserSchema);
  Word = mongoose.model("Word", wordModel.WordSchema);
});

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const hashtagServer = require("@threeceelabs/hashtag-server-controller");
const userServer = require("@threeceelabs/user-server-controller");

function toMegabytes(sizeInBytes) {
  return sizeInBytes/ONE_MEGABYTE;
}

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

// ==================================================================
// AUTH USER CACHE
// ==================================================================
let authenticatedUserCacheTtl = process.env.AUTH_USER_CACHE_DEFAULT_TTL;
if (authenticatedUserCacheTtl === undefined) { authenticatedUserCacheTtl = AUTH_USER_CACHE_DEFAULT_TTL;}
console.log("AUTHENTICATED USER CACHE TTL: " + authenticatedUserCacheTtl + " SECONDS");

let authenticatedUserCacheCheckPeriod = process.env.AUTH_USER_CACHE_CHECK_PERIOD;
if (authenticatedUserCacheCheckPeriod === undefined) { authenticatedUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;}
console.log("AUTHENTICATED USER CACHE CHECK PERIOD: " + authenticatedUserCacheCheckPeriod + " SECONDS");

const authenticatedUserCache = new NodeCache({
  stdTTL: authenticatedUserCacheTtl,
  checkperiod: authenticatedUserCacheCheckPeriod
});

// ==================================================================
// AUTH USER CACHE
// ==================================================================
let authInProgressCacheTtl = process.env.AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;
if (authInProgressCacheTtl === undefined) { authInProgressCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;}
console.log("AUTH IN PROGRESS CACHE TTL: " + authInProgressCacheTtl + " SECONDS");

let authInProgressCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (authInProgressCacheCheckPeriod === undefined) { authInProgressCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;}
console.log("AUTH IN PROGRESS CACHE CHECK PERIOD: " + authInProgressCacheCheckPeriod + " SECONDS");

const authInProgressCache = new NodeCache({
  stdTTL: authInProgressCacheTtl,
  checkperiod: authInProgressCacheCheckPeriod
});

function authenticatedUserCacheExpired(userId, userObj) {

  console.log(chalkLog("XXX $ AUTH USER"
    + " | " + userId
    + " | @" + userObj.screenName
  ));

}

authenticatedUserCache.on("expired", authenticatedUserCacheExpired);


// ==================================================================
// NODE CACHE
// ==================================================================
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
if (wordsPerMinuteTopTermCheckPeriod === undefined) {
  wordsPerMinuteTopTermCheckPeriod = TOPTERMS_CACHE_CHECK_PERIOD;
}
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
configuration.socketIoAuthTimeout = 30*ONE_SECOND;
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
const updaterMessageQueue = [];
let sorter;
const sorterMessageRxQueue = [];


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

let updaterPingInterval;
let updaterPingOutstanding = 0;

function quit(message) {
  clearInterval(updaterPingInterval);
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

function dropboxLongPoll(last_cursor, callback) {
  dropboxClient.filesListFolderLongpoll({cursor: last_cursor, timeout: 30})
    .then((results) => {
      // console.log(chalkAlert("dropboxLongpoll FOLDER: " + lastCursorTruncated + "\n" + jsonPrint(result)));
      callback(null, results);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    });
}


function dropboxFolderGetLastestCursor(folder, callback) {

  let lastCursorTruncated = "";

  debug(chalkLog("dropboxFolderGetLastestCursor FOLDER: " + folder));

  let optionsGetLatestCursor = {
    path: folder,
    recursive: true,
    include_media_info: false,
    include_deleted: true,
    include_has_explicit_shared_members: false
  };

  dropboxClient.filesListFolderGetLatestCursor(optionsGetLatestCursor)
  .then((last_cursor) => {

    lastCursorTruncated = last_cursor.cursor.substring(0,20);

    debug(chalkLog("lastCursorTruncated: " + lastCursorTruncated));

    dropboxLongPoll(last_cursor.cursor, function(err, results){

      // debug(chalkInfo("dropboxLongPoll CURSOR: " + lastCursorTruncated + "| CHANGES: " + results.changes));

      if (results.changes) {

        dropboxClient.filesListFolderContinue({ cursor: last_cursor.cursor})
        .then(function(response){
          debug(chalkLog("filesListFolderContinue: " + jsonPrint(response)));
          // if (response.entries.length > 0) {
          //   console.log(chalkAlert(">>> DROPBOX CHANGE"
          //     + " | " + getTimeStamp()
          //     + " | FOLDER: " + folder
          //   ));
          //   response.entries.forEach(function(entry){
          //     console.log(chalkAlert(">>> DROPBOX CHANGE | ENTRY"
          //       + " | TYPE: " + entry[".tag"]
          //       + " | PATH: " + entry.path_lower
          //       + " | NAME: " + entry.name
          //     ));
          //   });
          // }
          callback(null, response);
        })
        .catch(function(err){
          console.log(chalkError("dropboxFolderGetLastestCursor filesListFolder *** DROPBOX FILES LIST FOLDER ERROR"
            + "\nERROR: " + err 
            + "\nERROR: " + jsonPrint(err)
          ));
          callback(err, last_cursor.cursor);
        });
      }
      else {
        console.log(chalkLog("... FOLDER NO CHANGE | " + folder));
        callback(null, null);
      }
    });
  })
  .catch((err) => {
    console.log(err);
    callback(err, folder);
  });
}


// function loadFile(path, file, callback) {

//   debug(chalkInfo("LOAD FOLDER " + path));
//   debug(chalkInfo("LOAD FILE " + file));
//   debug(chalkInfo("FULL PATH " + path + "/" + file));

//   dropboxClient.filesDownload({path: path + "/" + file})
//     .then(function(data) {
//       debug(chalkLog(getTimeStamp()
//         + " | LOADING FILE FROM DROPBOX FILE: " + path + "/" + file
//       ));

//       let payload = data.fileBinary;
//       debug(payload);

//       if (file.match(/\.json$/gi)) {
//         let fileObj = JSON.parse(payload);
//         return(callback(null, fileObj));
//       }
//       else {
//         // return(callback(null, payload));
//         return(callback(null, data));
//       }
//     })
//     .catch(function(error) {
//       console.log(chalkError("DROPBOX LOAD FILE ERROR: " + path + "/" + file + "\n" + error));
//       console.log(chalkError("!!! DROPBOX READ " + file + " ERROR"));
//       console.log(chalkError(jsonPrint(error)));

//       if (error.status === 404) {
//         console.error(chalkError("!!! DROPBOX READ FILE " + file + " NOT FOUND"
//           + " ... SKIPPING ...")
//         );
//         return(callback(null, null));
//       }
//       if (error.status === 0) {
//         console.error(chalkError("!!! DROPBOX NO RESPONSE"
//           + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
//         return(callback(null, null));
//       }
//       return(callback(error, null));
//     })
//     .catch(function(err) {
//       console.log(chalkError("*** ERROR DROPBOX LOAD FILE\n" + err));
//       callback(err, null);
//     });
// }

function loadFile(path, file, callback) {

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + path + "/" + file));

  let fullPath = path + "/" + file;

  if (OFFLINE_MODE) {
    if (hostname === "mbp2") {
      fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + path + "/" + file;
      debug(chalkInfo("OFFLINE_MODE: FULL PATH " + fullPath));
    }
    fs.readFile(fullPath, "utf8", function(err, data) {

      if (err) {
        console.log("NNT"
          + " | " + chalkError(getTimeStamp()
          + " | *** ERROR LOADING FILE FROM DROPBOX FILE"
          + " | " + fullPath
        ));
        return(callback(err, null));
      }

      debug("NNT"
        + " | " + chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE"
        + " | " + fullPath
      ));

      if (file.match(/\.json$/gi)) {
        try {
          let fileObj = JSON.parse(data);
          callback(null, fileObj);
        }
        catch(e){
          console.trace(chalkError("NNT | JSON PARSE ERROR: " + e));
          callback(e, null);
        }
      }
      else if (file.match(/\.txt$/gi)) {
        callback(null, data);
      }
      else {
        callback(null, null);
      }
    });
   }
  else {
    dropboxClient.filesDownload({path: fullPath})
    .then(function(data) {

      debug("NNT"
        + " | " + chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX: [" + toMegabytes(data.size).toFixed(3) + " MB] | " + fullPath
      ));

      let payload = data.fileBinary;
      debug(payload);

      if (file.match(/\.json$/gi)) {
        try {
          let fileObj = JSON.parse(payload);
          callback(null, fileObj);
        }
        catch(e){
          console.trace(chalkError("NNT | JSON PARSE ERROR: " + fullPath  + " | ERROR: " + e + "\n" + jsonPrint(e)));
          callback(e, null);
        }
      }
      else if (file.match(/\.txt$/gi)) {
        callback(null, data);
      }
      else {
        console.log(chalkLog("NNT"
          + " | " + getTimeStamp()
          + " | ??? LOADING FILE FROM DROPBOX FILE | NOT .json OR .txt: " + fullPath
        ));
        callback(null, null);
      }
    })
    .catch(function(error) {
      console.log(chalkError("NNT | DROPBOX loadFile ERROR: " + fullPath + "\n" + error));
      console.log(chalkError("NNT | !!! DROPBOX READ " + fullPath + " ERROR"));
      console.log(chalkError("NNT | " + jsonPrint(error.error)));

      if (error.status === 404) {
        console.error(chalkError("NNT | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return(callback(null, null));
      }
      if (error.status === 409) {
        console.error(chalkError("NNT | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"));
        return(callback(error, null));
      }
      if (error.status === 0) {
        console.error(chalkError("NNT | !!! DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      callback(error, null);
    });
  }
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
    // + " | TwRXQ: " + tweetRxQueue.size()
    // + " | TwPRQ: " + tweetParserQueue.size()
    + " | TwRXQ: " + tweetRxQueue.length
    + " | TwPRQ: " + tweetParserQueue.length
    // + " | RSS: " + statsObj.memory.rss.toFixed(2) + " MB"
    // + " - MAX: " + statsObj.memory.maxRss.toFixed(2)
    // + " - " + moment(parseInt(statsObj.memory.maxRssTime)).format(compactDateTimeFormat)
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
  clearInterval(updaterPingInterval);
  if (tweetParser !== undefined) { tweetParser.kill("SIGINT"); }
  if (updater !== undefined) { updater.kill("SIGINT"); }
  if (sorter !== undefined) { sorter.kill("SIGINT"); }
});

process.on("message", function processMessageRx(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    debug("\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n");
    debug("... SAVING STATS");

    clearInterval(internetCheckInterval);
    clearInterval(updaterPingInterval);

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

    if (code > 0) { configEvents.emit("CHILD_ERROR", { name: "updater" }); }

  });

  u.on("close", function updaterClose(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** UPDATER CLOSE ***"
      + " | EXIT CODE: " + code
    ));
  });

  u.on("message", function updaterMessage(m){
    debug(chalkInfo("UPDATER RX\n" + jsonPrint(m)));
    // updaterMessageQueue.enqueue(m);
    updaterMessageQueue.push(m);
  });

  u.send({
    op: "INIT",
    folder: ".",
    keywordFile: defaultDropboxKeywordFile,
    interval: KEYWORDS_UPDATE_INTERVAL
  }, function updaterSendError(err){
    if (err) {
      console.error(chalkError("*** UPDATER SEND ERROR"
        + " | " + err
      ));
      initUpdater();
    }
  });

  updater = u;

  initUpdaterPingInterval(60000);

  if (callback !== undefined) { callback(null, u); }
}

function categorizeNode(categorizeObj) {

  if (categorizeObj.twitterUser && categorizeObj.twitterUser.userId) {

    let user = authenticatedUserCache.get(categorizeObj.twitterUser.userId);

    if (!user && (categorizeObj.twitterUser.userId !== "14607119") && (categorizeObj.twitterUser.userId !== "848591649575927810")) {
      console.log(chalkAlert("*** AUTH USER NOT IN CACHE\n" + jsonPrint(categorizeObj.twitterUser)));
      return;
    }
  }

  debug(chalkSocket("categorizeNode" 
    + " | categorizeObj\n" + jsonPrint(categorizeObj)
  ));

  switch (categorizeObj.node.nodeType){
    case "user":

      debug(chalkSocket("categorizeNode USER"
        + " | " + categorizeObj.node.userId
        + " | " + categorizeObj.node.screenName
        + "\n" + jsonPrint(categorizeObj.keywords)
      ));

      keywordHashMap.set(categorizeObj.node.nodeId.toLowerCase(), categorizeObj.keywords);
      keywordHashMap.set(categorizeObj.node.screenName.toLowerCase(), categorizeObj.keywords);

      userServer.updateKeywords({user: categorizeObj.node, keywords: categorizeObj.keywords}, function(err, updatedUser){

        if (err) {
          console.log(chalkError("*** USER UPDATE KEYWORDS ERROR: " + jsonPrint(err)));
        }
        else {
          if (updater !== undefined){

            updater.send({
              op: "UPDATE_KEYWORD",
              word: categorizeObj.node.screenName.toLowerCase(),
              keywords: categorizeObj.keywords
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

            const text = "CATEGORIZE"
              + "\n@" + categorizeObj.node.screenName 
              + ": " + Object.keys(categorizeObj.keywords);

            slackPostMessage(slackChannel, text);


            debug(chalkLog(">UPDATER UPDATE_KEYWORD USER | @" + updatedUser.screenName ));
          }
          else {
            console.log(chalkError("!!! NO UPDATER UPDATE_KEYWORD ... UNDEFINED"
            ));
          }
        }
      });

    break;
    case "hashtag":

      debug(chalkSocket("categorizeNode HASHTAG"
        + " | " + categorizeObj.node.nodeId
        + "\n" + jsonPrint(categorizeObj.keywords)
      ));

      keywordHashMap.set(categorizeObj.node.nodeId.toLowerCase(), categorizeObj.keywords);

      hashtagServer.updateKeywords({hashtag: categorizeObj.node, keywords: categorizeObj.keywords}, function(err, updatedHashtag){

        if (err) {
          console.log(chalkError("*** HASHTAG UPDATE KEYWORDS ERROR: " + jsonPrint(err)));
        }
        else {

          if (updater !== undefined){

            updater.send({
              op: "UPDATE_KEYWORD",
              word: categorizeObj.node.nodeId.toLowerCase(),
              keywords: categorizeObj.keywords
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

            const text = "CATEGORIZE"
              + "\n#" + categorizeObj.node.nodeId.toLowerCase() + ": " + Object.keys(categorizeObj.keywords);

            slackPostMessage(slackChannel, text);

            debug(chalkLog(">UPDATER UPDATE_KEYWORD HASHTAG | #" + updatedHashtag.text ));
          }
          else {
            console.log(chalkError("!!! NO UPDATER UPDATE_KEYWORD ... UNDEFINED"
            ));
          }

        }

      });
    break;
  }
  
}

function socketRxTweet(tw) {

  statsObj.twitter.tweetsReceived += 1;
  tweetMeter.mark();

  debug(chalkSocket("tweet" 
    + " [" + statsObj.twitter.tweetsReceived + "]"
    + " | " + tw.id_str
    + " | " + tw.user.id_str
    + " | " + tw.user.screen_name
    + " | " + tw.user.name
  ));

  // if (tweetRxQueue.size() > MAX_Q){
  if (tweetRxQueue.length > MAX_Q){

    statsObj.errors.twitter.maxRxQueue += 1;

    if (statsObj.errors.twitter.maxRxQueue % 100 === 0) {
      // console.log(chalkError("*** TWEET RX MAX QUEUE [" + tweetRxQueue.size() + "]"
      console.log(chalkError("*** TWEET RX MAX QUEUE [" + tweetRxQueue.length + "]"
        + " | " + getTimeStamp()
        + " | MAX Q EVENTS: " + statsObj.errors.twitter.maxRxQueue
        + " | " + tw.id_str
        + " | " + tw.user.screen_name
      ));
    }
  }
  else if (tw.user) {

    tw.inc = true;

    // tweetRxQueue.enqueue(tw);
    tweetRxQueue.push(tw);
    // statsObj.queues.tweetRxQueue = tweetRxQueue.size();
    statsObj.queues.tweetRxQueue = tweetRxQueue.length;

    debug(chalkLog("T<"
      // + " [ RXQ: " + tweetRxQueue.size() + "]"
      // + " [ TPQ: " + tweetParserQueue.size() + "]"
      + " [ RXQ: " + tweetRxQueue.length + "]"
      + " [ TPQ: " + tweetParserQueue.length + "]"
      + " | " + tw.id_str
      + " | @" + tw.user.screen_name
      + " | " + tw.user.name
    ));
  }
  else{
    console.log(chalkAlert("NULL USER T*<"
      // + " [ RXQ: " + tweetRxQueue.size() + "]"
      // + " [ TPQ: " + tweetParserQueue.size() + "]"
      + " [ RXQ: " + tweetRxQueue.length + "]"
      + " [ TPQ: " + tweetParserQueue.length + "]"
      + " | " + tw.id_str
      + " | @" + tw.user.screen_name
      + " | " + tw.user.name
    ));
  }
}


// ???? KLUDGE: will this create a mem leak by creating socket objs on each connect?

function initSocketHandler(socketObj) {

  const socket = socketObj.socket;

  const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  const socketConnectText = "\nSOCKET CONNECT"
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

  // socket.emit("SERVER_READY", {connected: hostname});

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

    console.log(chalkAlert("SOCKET DISCONNECT " + socket.id));

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

  socket.on("TWITTER_SEARCH_NODE", function twitterSearchNode(sn) {

    const searchNode = sn.toLowerCase();

    console.log(chalkSocket("TWITTER_SEARCH_NODE"
      + " | " + getTimeStamp()
      + " | SID: " + socket.id
      + " | " + searchNode
    ));

    if (searchNode.startsWith("#")) {

      let searchNodeHashtag = { text: searchNode.substring(1) };

      hashtagServer.findOne({hashtag: searchNodeHashtag}, function(err, hashtag){
        if (err) {
          console.log(chalkError("TWITTER_SEARCH_NODE HASHTAG ERROR\n" + jsonPrint(err)));
          // socket.emit("SET_TWITTER_USER", defaultTwitterUser);
        }
        else {
          console.log(chalkTwitter("TWITTER_SEARCH_NODE HASHTAG FOUND\n" + jsonPrint(hashtag)));
          socket.emit("SET_TWITTER_HASHTAG", hashtag);
        }
    
      });
    }
    else {

      let searchNodeUser;

      if (searchNode.startsWith("@")) {
        searchNodeUser = { screenName: searchNode.substring(1) };
        if (searchNodeUser === "?") {
          console.log(chalkInfo("SEARCH FOR UNCATEGORIZED USER"));
        }
        if (searchNodeUser === "?mm") {
          console.log(chalkInfo("SEARCH FOR MISMATCHED USER"));
        }
      }
      else {
        searchNodeUser = { screenName: searchNode };
      }

      userServer.findOne({user: searchNodeUser}, function(err, user){
        if (err) {
          console.log(chalkError("TWITTER_SEARCH_NODE USER ERROR\n" + jsonPrint(err)));
        }
        else if (user) {
          console.log(chalkTwitter("+++ TWITTER_SEARCH_NODE USER FOUND\n" + jsonPrint(user)));
          twit.get("users/show", {user_id: user.userId, include_entities: true}, function usersShow (err, rawUser, response){
            if (err) {
              console.log(chalkError("ERROR users/show rawUser" + err));
              socket.emit("SET_TWITTER_USER", user);
            }
            else if (rawUser) {
              console.log(chalkTwitter("FOUND users/show rawUser" + jsonPrint(rawUser)));

              user.isTwitterUser = true;
              user.nodeType = "user";
              user.name = rawUser.name;
              user.screenName = rawUser.screen_name.toLowerCase();
              user.screenNameLower = rawUser.screen_name.toLowerCase();
              user.url = rawUser.url;
              user.profileUrl = "http://twitter.com/" + rawUser.screen_name;
              user.profileImageUrl = rawUser.profile_image_url;
              user.bannerImageUrl = rawUser.profile_banner_url;
              user.verified = rawUser.verified;
              user.following = rawUser.following;
              user.description = rawUser.description;
              user.lastTweetId = (rawUser.status !== undefined) ? rawUser.status.id_str : false;
              user.statusesCount = rawUser.statuses_count;
              user.friendsCount = rawUser.friends_count;
              user.followersCount = rawUser.followers_count;
              user.status = rawUser.status;

              userServer.findOneUser(user, {noInc: true}, function(err, updatedUser){

                if (err) {
                  console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                }
                else {
                  console.log(chalkTwitter("UPDATED updatedUser" + jsonPrint(updatedUser)));
                  socket.emit("SET_TWITTER_USER", updatedUser);
                }
              });


            }
            else {
              console.log(chalkTwitter("NOT FOUND users/show data"));
              socket.emit("SET_TWITTER_USER", user);
            }
          });
        }
        else {
          console.log(chalkTwitter("--- TWITTER_SEARCH_NODE USER *NOT* FOUND\n" + jsonPrint(searchNodeUser)));
          socket.emit("SET_TWITTER_USER", {notFound: 1, userId: 0, screenName: searchNodeUser.screenName});
        }
    
      });
    }

  });

  socket.on("TWITTER_CATEGORIZE_NODE", function twitterCategorizeNode(dataObj) {

    if (dataObj.node.nodeType === "user") {
      console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
        + " | " + getTimeStamp()
        + " | SID: " + socket.id
        + " | @" + dataObj.node.screenName
        + " | KWs: " + Object.keys(dataObj.keywords)
        // + "\n" + jsonPrint(dataObj)
      ));
    }
    if (dataObj.node.nodeType === "hashtag") {
      console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
        + " | " + getTimeStamp()
        + " | SID: " + socket.id
        + " | #" + dataObj.node.text
        + " | KWs: " + Object.keys(dataObj.keywords)
        // + "\n" + jsonPrint(dataObj)
      ));
    }

    categorizeNode(dataObj);
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


    userServer.findOne({user: defaultTwitterUser}, function(err, user){
      if (err) {
        socket.emit("SET_TWITTER_USER", defaultTwitterUser);
      }
      else {
        socket.emit("SET_TWITTER_USER", user);
      }

      socket.emit("VIEWER_READY_ACK", 
        {
          userId: viewerObj.viewerId,
          timeStamp: moment().valueOf(),
          viewerSessionKey: moment().valueOf()
        }
      );
  
    });
  });

  socket.on("tweet", socketRxTweet);

  socket.on("categorize", categorizeNode);

  // side channel twitter auth in process...
  socket.on("login", function socketLogin(viewerObj){
    console.log(chalkAlert("LOGIN"
      + " | SID: " + socket.id
      + "\n" + jsonPrint(viewerObj)
    ));
    authInProgressCache.set(viewerObj.userId, viewerObj);
  });

}

function initSocketNamespaces(callback){

  console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT SOCKET NAMESPACES"));

  // io = require("socket.io")(httpServer, { reconnection: true });


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

function printKeyword(keywords) {
  if (keywords === undefined) { return "FALSE"; }
  if (!keywords) { return "FALSE"; }
  if (keywords.left !== undefined) { return "left"; }
  if (keywords.right !== undefined) { return "right"; }
  if (keywords.neutral !== undefined) { return "neutral"; }
  if (keywords.positive !== undefined) { return "positive"; }
  if (keywords.negative !== undefined) { return "negative"; }
  return "FALSE";
}

function checkKeyword(nodeObj, callback) {

  const kws = printKeyword(nodeObj.keywords);
  const kwas = printKeyword(nodeObj.keywordsAuto);

  debugKeyword(chalkLog("checkKeyword"
    + " | " + nodeObj.nodeType
    + " | " + nodeObj.nodeId
    + " | KWs: " + kws
    + " | KWAs: " + kwas
    // + "\n" + jsonPrint(nodeObj)
  ));

  switch (nodeObj.nodeType) {

    case "tweet":
    case "media":
    case "url":
      callback(nodeObj);
    break;

    case "user":

      if (!nodeObj.name && !nodeObj.screenName) {
        console.log(chalkError("*** ERROR: checkKeyword: NODE NAME & SCREEN NAME UNDEFINED?"
          + "\n" + jsonPrint(nodeObj)));
        return(callback(nodeObj));
      }

      if ((nodeObj.screenName !== undefined) 
        && (nodeObj.screenName) 
        && keywordHashMap.has(nodeObj.screenName.toLowerCase())) {

        nodeObj.keywords = keywordHashMap.get(nodeObj.screenName.toLowerCase());
        nodeObj.isKeyword = true;
        nodeObj.isTwitterUser = true;

        wordsPerMinuteTopTermCache.get(nodeObj.screenName.toLowerCase(), 
          function topTermScreenName(err, rate) {

          debugKeyword(chalkAlert("KW HIT USER SNAME"
            + " | " + nodeObj.userId
            + " | @" + nodeObj.screenName
            + " | KWs: " + printKeyword(nodeObj.keywords)
            + " | KWAs: " + printKeyword(nodeObj.keywordsAuto)
            + "\n" + jsonPrint(keywordHashMap.get(nodeObj.screenName.toLowerCase()))
          ));

          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (rate !== undefined) {
            debugKeyword(chalkLog("TOP TERM USER SNAME"
              + " | @" + nodeObj.screenName
              + " | RATE: " + rate.toFixed(2)
              + " | NODE RATE: " + nodeObj.rate.toFixed(2)
            ));
            nodeObj.isTopTerm = true;
          }
          callback(nodeObj);
        });
      }
      else if ((nodeObj.name !== undefined) 
        && (nodeObj.name) 
        && keywordHashMap.has(nodeObj.name.toLowerCase())) {

        nodeObj.keywords = {};
        nodeObj.keywords = keywordHashMap.get(nodeObj.name.toLowerCase());
        nodeObj.isKeyword = true;
        nodeObj.isTwitterUser = true;

        debugKeyword(chalkAlert("KW HIT USER NAME"
          + " | " + nodeObj.name
          + " | KWs: " + printKeyword(nodeObj.keywords)
          + " | KWAs: " + printKeyword(nodeObj.keywordsAuto)
        ));

        wordsPerMinuteTopTermCache.get(nodeObj.name.toLowerCase(), 
          function topTermName(err, name) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (name !== undefined) {
            debugKeyword(chalkLog("TOP TERM USER NAME: " + name));
            nodeObj.isTopTerm = true;
          }
          callback(nodeObj);
        });
      }
      // will probably never be true
      else if (keywordHashMap.has(nodeObj.userId)) {

        nodeObj.keywords = {};
        nodeObj.keywords = keywordHashMap.get(nodeObj.userId);
        nodeObj.isKeyword = true;
        nodeObj.isTwitterUser = true;

        debugKeyword(chalkAlert("KW HIT USER ID"
          + " | " + nodeObj.userId
          + " | KWs: " + printKeyword(nodeObj.keywords)
          + " | KWAs: " + printKeyword(nodeObj.keywordsAuto)
        ));

        wordsPerMinuteTopTermCache.get(nodeObj.userId,
          function topTermUserId(err, userId) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (userId !== undefined) {
            debugKeyword(chalkLog("TOP TERM USER USERID: " + userId));
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

      if (keywordHashMap.has(nodeObj.nodeId)) {

        nodeObj.keywords = {};
        nodeObj.keywords = keywordHashMap.get(nodeObj.nodeId);
        nodeObj.isKeyword = true;

        debugKeyword(chalkAlert("KW HIT HASHTAG NODEID"
          + " | " + nodeObj.nodeId
          + " | KWs: " + printKeyword(nodeObj.keywords)
          + " | KWAs: " + printKeyword(nodeObj.keywordsAuto)
        ));

        wordsPerMinuteTopTermCache.get(nodeObj.nodeId,
          function topTermNodeId(err, nodeId) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (nodeId !== undefined) {
            debugKeyword(chalkLog("TOP TERM HASHTAG NODEID: " + nodeId));
            nodeObj.isTopTerm = true;
          }
          callback(nodeObj);
        });

      }
      else {
        callback(nodeObj);
      }
    break;

    case "place":

      if (keywordHashMap.has(nodeObj.name.toLowerCase())) {

        nodeObj.keywords = {};
        nodeObj.keywords = keywordHashMap.get(nodeObj.name.toLowerCase());
        nodeObj.isKeyword = true;

        debugKeyword(chalkAlert("KW HIT PLACE NAME"
          + " | " + nodeObj.nodeId
          + " | NAME: " + nodeObj.name
          + " | KWs: " + printKeyword(nodeObj.keywords)
          + " | KWAs: " + printKeyword(nodeObj.keywordsAuto)
        ));

        wordsPerMinuteTopTermCache.get(nodeObj.name,
          function topTermPlaceNameId(err, name) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (name !== undefined) {
            debugKeyword(chalkLog("TOP TERM PLACE NAME: " + name));
            nodeObj.isTopTerm = true;
          }
          callback(nodeObj);
        });
      }
      else {
        callback(nodeObj);
      }
    break;

    case "word":

      if (keywordHashMap.has(nodeObj.nodeId)) {

        nodeObj.keywords = {};
        nodeObj.keywords = keywordHashMap.get(nodeObj.nodeId);
        nodeObj.isKeyword = true;

        debugKeyword(chalkAlert("KW HIT WORD NODEID"
          + " | " + nodeObj.nodeId
          + " | KWs: " + printKeyword(nodeObj.keywords)
          + " | KWAs: " + printKeyword(nodeObj.keywordsAuto)
        ));

        wordsPerMinuteTopTermCache.get(nodeObj.nodeId,
          function topTermWordNodeId(err, nodeId) {
          if (err){
            console.log(chalkError("wordsPerMinuteTopTermCache GET ERR: " + err));
          }
          if (nodeId !== undefined) {
            debugKeyword(chalkLog("TOP TERM HASHTAG NODEID: " + nodeId));
            nodeObj.isTopTerm = true;
          }
          callback(nodeObj);
        });

      }
      else {
        callback(nodeObj);
      }
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
const transmitNodeQueue = [];

function initTransmitNodeQueueInterval(interval){

  console.log(chalkLog("INIT TRANSMIT NODE QUEUE INTERVAL: " + interval + " MS"));

  clearInterval(transmitNodeQueueInterval);
  // let nodeObj;

  transmitNodeQueueInterval = setInterval(function txNodeQueue () {

    // if (transmitNodeQueueReady && (!transmitNodeQueue.isEmpty())){
    if (transmitNodeQueueReady && (transmitNodeQueue.length > 0)) {

      transmitNodeQueueReady = false;

      // let nodeObj = transmitNodeQueue.dequeue();
      let nodeObj = transmitNodeQueue.shift();

      if (!nodeObj) {
        console.error(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q"));
        transmitNodeQueueReady = true;
      }
      else {

        const kws = printKeyword(nodeObj.keywords);
        const kwas = printKeyword(nodeObj.keywordsAuto);

        debugKeyword(chalkAlert("TX NODE DE-Q"
          + " | NID: " + nodeObj.nodeId
          + " | " + nodeObj.nodeType
          + " | KWs: " + kws
          + " | KWAs: " + kwas
        ));

        checkKeyword(nodeObj, function checkKeywordCallback(node){
          updateWordMeter(node, function updateWordMeterCallback(err, n){
            if (!err) {
              if ((n.nodeType === "user") && n.isTopTerm && (n.followersCount === 0)){
                twit.get("users/show", {user_id: n.userId, include_entities: true}, function usersShow (err, rawUser, response){
                  if (err) {
                    console.log(chalkError("ERROR users/show rawUser" + err));
                    viewNameSpace.volatile.emit("node", n);
                    transmitNodeQueueReady = true;
                  }
                  else if (rawUser) {
                    debug(chalkTwitter("FOUND users/show rawUser" + jsonPrint(rawUser)));

                    n.isTwitterUser = true;
                    n.name = rawUser.name;
                    n.screenName = rawUser.screen_name.toLowerCase();
                    n.screenNameLower = rawUser.screen_name.toLowerCase();
                    n.url = rawUser.url;
                    n.profileUrl = "http://twitter.com/" + rawUser.screen_name;
                    n.profileImageUrl = rawUser.profile_image_url;
                    n.bannerImageUrl = rawUser.profile_banner_url;
                    n.verified = rawUser.verified;
                    n.following = rawUser.following;
                    n.description = rawUser.description;
                    n.lastTweetId = (rawUser.status !== undefined) ? rawUser.status.id_str : null;
                    n.statusesCount = rawUser.statuses_count;
                    n.friendsCount = rawUser.friends_count;
                    n.followersCount = rawUser.followers_count;
                    n.status = rawUser.status;

                    if (n.followersCount > MIN_FOLLOWERS) {
                      userServer.findOneUser(n, {noInc: true}, function(err, updatedUser){
                        if (err) {
                          console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                          viewNameSpace.volatile.emit("node", n);
                          transmitNodeQueueReady = true;
                        }
                        else {
                          debug(chalkTwitter("UPDATED updatedUser" + jsonPrint(updatedUser)));
                          viewNameSpace.volatile.emit("node", updatedUser);
                          transmitNodeQueueReady = true;
                        }
                      });
                    }
                    else {
                      debug(chalkTwitter("LESS THAN MIN_FOLLOWERS users/show data"));
                      viewNameSpace.volatile.emit("node", n);
                      transmitNodeQueueReady = true;
                    }
                  }
                  else {
                    console.log(chalkTwitter("NOT FOUND users/show data"));
                    viewNameSpace.volatile.emit("node", n);
                    transmitNodeQueueReady = true;
                  }
                });
              }
              else {
                viewNameSpace.volatile.emit("node", n);
                transmitNodeQueueReady = true;
              }
            }
            // transmitNodeQueueReady = true;
          });
        });
      }

    }
  }, interval);
}

function transmitNodes(tw, callback){
  debug("TX NODES");

  tw.userMentions.forEach(function userMentionsTxNodeQueue(user){
    // if (user) {transmitNodeQueue.enqueue(user);}
    if (user) {transmitNodeQueue.push(user);}
  });

  tw.hashtags.forEach(function hashtagsTxNodeQueue(hashtag){
    // if (hashtag) {transmitNodeQueue.enqueue(hashtag);}
    if (hashtag) {transmitNodeQueue.push(hashtag);}
  });

  // tw.media.forEach(function(media){
    // if (media) {transmitNodeQueue.enqueue(media);}
  //   if (media) {transmitNodeQueue.push(media);}
  // });

  tw.urls.forEach(function urlsTxNodeQueue(url){
    // if (url) {transmitNodeQueue.enqueue(url);}
    if (url) {transmitNodeQueue.push(url);}
  });

  // if (tw.place) {transmitNodeQueue.enqueue(tw.place);}
  if (tw.place) {transmitNodeQueue.push(tw.place);}

  // if (tw.user) {transmitNodeQueue.enqueue(tw.user);}
  if (tw.user) {transmitNodeQueue.push(tw.user);}

  callback();
}

const metricsDataPointQueue = [];
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

    // if (GOOGLE_METRICS_ENABLED && !metricsDataPointQueue.isEmpty() && metricsDataPointQueueReady) {
    if (GOOGLE_METRICS_ENABLED && (metricsDataPointQueue.length > 0) && metricsDataPointQueueReady) {

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

  // metricsDataPointQueue.enqueue(timeSeriesData);
  metricsDataPointQueue.push(timeSeriesData);

  // if (callback) { callback(null, { q: metricsDataPointQueue.size()} ); }
  if (callback) { callback(null, { q: metricsDataPointQueue.length} ); }
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
function slackMessageHandler(messageObj){
  console.error(chalkAlert("R> SLACK MSG"
    + " | CH: " + messageObj.channel
    + " | USER: " + messageObj.user
    + " | " + messageObj.text
  ));

  const textArray = messageObj.text.split(":");
  const op = textArray[0];

  let val;

  switch(op){
    case "mr":
      if (textArray.length > 1) {
        val = textArray[1];
        if (val === "c") { metricsRate = "currentRate"; }
        if (val === "1") { metricsRate = "1MinuteRate"; }
        if (val === "5") { metricsRate = "5MinuteRate"; }
        if (val === "15") { metricsRate = "15MinuteRate"; }
        console.log(chalkAlert("METRICS RATE: " + metricsRate));
      }
    break;
    default:
      console.log(chalkError("UNKNOWN SLACK OP: " + op));
  }
}



// function onAuthorizeSuccess(data, accept){
//   console.log(chalk.green("onAuthorizeSuccess"
//     + " | SID: " + data.sessionID
//     + "\nUSER" + jsonPrint(data.user)
//     + "\nCOOKIE" + jsonPrint(data.cookie)
//   ));
//   debug(util.inspect(data, { showHidden: true, depth: 1 }));
//   return accept();
// }

// function onAuthorizeFail(data, message, error, accept){
//   console.log(chalkAlert("onAuthorizeFail"
//     + " | SID: " + data.sessionID
//     + " | MESSAGE: " + message
//     + "\nUSER: " + jsonPrint(data.user)
//     + "\nCOOKIE: " + jsonPrint(data.cookie)
//     + "\nERROR: " + jsonPrint(error)
//   ));
//   debug(util.inspect(data, { showHidden: true, depth: 1 }));

//   // error indicates whether the fail is due to an error or just a unauthorized client
//   if (error)  { throw new Error(message); }
//   // send the (not-fatal) error-message to the client and deny the connection
//   return accept(new Error(message));
// }


function initAppRouting(callback) {

  // const exp = require("express");
  // const bodyParser = require("body-parser");
  // const methodOverride = require("method-override");
  // const session = require("express-session");
  // const MongoDBStore = require("connect-mongodb-session")(session);

  // const sessionStore = new MongoDBStore({
  //   uri: "mongodb://127.0.0.1/wordAsso?replicaSet=rs0",
  //   collection: "oauthSessions"
  // });

  // store.on("error", function(error) {
  //   console.log(chalkError("MONGO STORE ERROR\n" + jsonPrint(error))); 
  // });

  // require("socketio-auth")(io, {
  //   authenticate: function (socket, data, callback) {
  //     //get credentials sent by the client
  //     const userId = data.userId;
  //     const password = data.password;

  //     userServer.findOne({ user: { userId: userId }}, function(err, user){

  //       debug(chalkInfo("DESERIALIZED USER: @" + user.screenName));

  //       if (err || !user) { return callback(new Error("User not found")); }
  //       return callback(null, user.password == password);

  //     });

  //   }
  // });

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT APP ROUTING"));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(session({
    // key: "express.sid",
    secret: "my_precious",
    resave: false,
    // store: sessionStore,
    store: new MongoDBStore({ mongooseConnection: dbConnection }),
    saveUninitialized: true,
    cookie: { 
      secure: false,
      maxAge: MAX_SESSION_AGE
     }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(exp.static(__dirname + "/public"));

  // io.use(passportSocketIo.authorize({
  //   cookieParser: require("cookie-parser"),       // the same middleware you registrer in express
  //   key:          "express.sid",       // the name of the cookie where express/connect stores its session_id
  //   secret:       "my_precious",    // the session_secret to parse the cookie
  //   store:        sessionStore,        // we NEED to use a sessionstore. no memorystore please
  //   success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
  //   fail:         onAuthorizeFail     // *optional* callback on fail/error - read more below
  // }));

  app.use(function requestLog(req, res, next) {

    console.log(chalkAlert("R>"
      + " | " + moment().format(compactDateTimeFormat)
      + " | IP: " + req.ip
      + " | HOST: " + req.hostname
      + " | METHOD: " + req.method
      + " | PATH: " + req.path
    ));

    if (req.path === "/dropbox_webhook") {

      debug(chalkAlert("R> dropbox_webhook"
        + "\nreq.query: " + jsonPrint(req.query)
        + "\nreq.params: " + jsonPrint(req.params)
        + "\nreq.body: " + jsonPrint(req.body)
      )); 

      res.send(req.query.challenge);

      dropboxFolderGetLastestCursor(bestNetworkFolder, function(err, response){

        if (response && (response.entries.length > 0)) {

          utilNameSpace.emit("DROPBOX_CHANGE", response);
          adminNameSpace.emit("DROPBOX_CHANGE", response);

          console.log(chalkAlert(">>> DROPBOX CHANGE"
            + " | " + getTimeStamp()
            + " | FOLDER: " + bestNetworkFolder
          ));
          
          response.entries.forEach(function(entry){
            console.log(chalkAlert(">>> DROPBOX CHANGE | ENTRY"
              + " | TYPE: " + entry[".tag"]
              + " | PATH: " + entry.path_lower
              + " | NAME: " + entry.name
            ));
          });
        }
      });
    }
    else if (req.path === "/googleccd19766bea2dfd2.html") {
      console.log(chalkAlert("R> googleccd19766bea2dfd2.html")); 

      const googleVerification = __dirname + "/googleccd19766bea2dfd2.html";

      res.sendFile(googleVerification, function googleVerify(err) {
        if (err) {
          console.error("GET /googleccd19766bea2dfd2.html ERROR:"
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + req.url
            + " | " + googleVerification
            + " | " + err
          );
        } 
        else {
          console.log(chalkInfo("SENT:", googleVerification));
        }
      });
    }
    else if (req.path === "/") {
      console.log(chalkAlert("R> REDIRECT /session")); 
      res.redirect("/session");
    }
    else if (req.path === "/categorize"){
      console.log(chalkAlert("R> CATEGORIZE"
        + " | req.query: " + jsonPrint(req.query)
        + " | req.params: " + jsonPrint(req.params)
      ));
      res.sendStatus(200);
    }
    else if (req.path === "/slack_event"){
      if (req.body.type === "url_verification") {
        console.log(chalkAlert("R> SLACK URL VERIFICATION"
          + " | TOKEN: " + req.body.token
          + " | CHALLENGE: " + req.body.challenge
        ));
        res.send(req.body.challenge);
      }
      else {
        switch (req.body.event.type) {
          case "message":
            slackMessageHandler(req.body.event);
          break;
          default:
          console.log(chalkAlert("R> ??? UNKNOWN SLACK EVENT TYPE\n" + util.inspect(req.body, {showHidden:false, depth:1})));
        }
        res.sendStatus(200);
      }
    }
    else {
      next();
    }
  });

  // serialize and deserialize
  passport.serializeUser(function(userId, done) {
    debug(chalkAlert("SERIALIZE USER: " + userId));
    done(null, userId);
  });

  passport.deserializeUser(function(userObj, done) {

    debug(chalkAlert("DESERIALIZE USER: @" + userObj.screenName));

    userServer.findOne({ user: userObj}, function(err, user){

      debug(chalkInfo("DESERIALIZED USER: @" + user.screenName));

      if (!err) {
        done(null, user);
      }
      else {
        done(err, null);
      }

    });
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

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
      console.log(chalkAlert("PASSPORT TWITTER AUTHENTICATED"));
      slackPostMessage(slackChannel, "PASSPORT TWITTER AUTHENTICATED");
      return next();
    }
    console.log(chalkAlert("*** PASSPORT TWITTER *NOT* AUTHENTICATED ***"));
    slackPostMessage(slackChannel, "PASSPORT TWITTER AUTHENTICATION FAILED");
    // res.redirect("/session");
  }

  app.get("/account", ensureAuthenticated, function(req, res){

    debug(chalkError("PASSPORT TWITTER AUTH USER\n" + jsonPrint(req.session.passport.user)));  // handle errors
    console.log(chalkError("PASSPORT TWITTER AUTH USER"
      // + " | SID: " + util.inspect(req, {showHidden:false, depth:1})
      + " | @" + req.session.passport.user.screenName
      + " | UID" + req.session.passport.user.userId
    ));  // handle errors

    slackPostMessage(slackChannel, "PASSPORT TWITTER AUTH USER: @" + req.session.passport.user.screenName);

    userServer.findOne({ user: req.session.passport.user}, function(err, user) {
      if(err) {
        console.log(chalkError("*** ERROR TWITTER AUTHENTICATION: " + jsonPrint(err)));  // handle errors
        res.redirect("/504.html");
      } 
      else {
        console.log(chalkAlert("TWITTER USER AUTHENTICATED: @" + user.screenName));  // handle errors
        slackPostMessage(slackChannel, "USER AUTH: @" + user.screenName);
        authenticatedUserCache.set(user.userId, user);
        res.redirect("/after-auth.html");

      }
    });
  });


  app.get("/auth/twitter/error", function(req, res){
    console.log(chalkAlert("PASSPORT AUTH TWITTER ERROR"));
  });

  app.get("/auth/twitter",
    passport.authenticate("twitter"),
    function(req, res){
      console.log(chalkAlert("PASSPORT AUTH TWITTER"
        + " | req.query: " + jsonPrint(req.query)
        + " | req.params: " + jsonPrint(req.params)
      ));
    });

  app.get("/auth/twitter/callback",
    passport.authenticate("twitter", { successRedirect: "/account", failureRedirect: "/auth/twitter/error" }),
    function(req, res) {
      console.log(chalkAlert("PASSPORT AUTH TWITTER CALLBACK"));
      // res.redirect("/account");
      // res.sendStatus(200);
    });


  app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
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

  let tweetParserSendReady = true;

  console.log(chalkLog("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

    if ((tweetRxQueue.length > 0) && tweetParserReady && tweetParserSendReady) {

      tweetParserSendReady = false;

      const tweet = tweetRxQueue.shift();

      debug(chalkInfo("TPQ<"
        // + " [" + tweetRxQueue.size() + "]"
        + " [" + tweetRxQueue.length + "]"
        // + " | " + socket.id
        + " | " + tweet.id_str
        + " | " + tweet.user.id_str
        + " | " + tweet.user.screen_name
        + " | " + tweet.user.name
      ));

      tweetParser.send({ op: "tweet", tweetStatus: tweet }, function sendTweetParser(err){

        tweetParserSendReady = true;

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

  tweetParserMessageRxQueueInterval = setInterval(function tweetParserMessageRxQueueDequeue() {

    if ((tweetParserMessageRxQueue.length > 0) && tweetParserMessageRxQueueReady) {

      tweetParserMessageRxQueueReady = false;

      const tweetParserMessage = tweetParserMessageRxQueue.shift();

      debug(chalkLog("TWEET PARSER RX MESSAGE"
        + " | OP: " + tweetParserMessage.op
        // + "\n" + jsonPrint(m)
      ));

      if (tweetParserMessage.op === "parsedTweet") {

        const tweetObj = tweetParserMessage.tweetObj;

        if (!tweetObj.user) {
          console.log(chalkAlert("parsedTweet -- TW USER UNDEFINED"
            + " | " + tweetObj.tweetId
          ));
          tweetParserMessageRxQueueReady = true;
        }
        else {

          debug(chalkInfo("PARSED TW"
            // + " [ TPMRQ: " + tweetParserMessageRxQueue.size() + "]"
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

          if (transmitNodeQueue.length < MAX_Q) {
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
  // let index;
  // let i;
  let node;
  let nodeRate;
  let sorterObj;

  sorterMessageRxQueueInterval = setInterval(function sorterMessageRxQueueDequeue() {

    // if (sorterMessageRxReady && !sorterMessageRxQueue.isEmpty()) {
    if (sorterMessageRxReady && (sorterMessageRxQueue.length > 0)) {

      sorterMessageRxReady = false;

      // sorterObj = sorterMessageRxQueue.dequeue();
      sorterObj = sorterMessageRxQueue.shift();
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

          // for (index=0; index < endIndex; index += 1){

          async.times(endIndex, function(index, next) {

            node = sortedKeys[index].toLowerCase();

            if (wordMeter[node]) {

              nodeRate = parseFloat(wordMeter[node].toJSON()[metricsRate]);

              wordsPerMinuteTopTermCache.set(node, nodeRate);

              if (!deletedMetricsHashmap.has(node) 
                && GOOGLE_METRICS_ENABLED 
                && (nodeRate > MIN_METRIC_VALUE)) {
                addTopTermMetricDataPoint(node, nodeRate);
                next();
              }
              else {
                debug(chalkLog("SKIP ADD METRIC | " + node + " | " + nodeRate.toFixed(3)));
                next();
              }

            }

          }, function(){

            sorterMessageRxReady = true; 

          });

        break;

        default:
          console.log(chalkError("??? SORTER UNKNOWN OP\n" + jsonPrint(sorterObj)));
          sorterMessageRxReady = true; 
      }
    }
  }, interval);
}


// function initUpdaterPingInterval(interval){

//   console.log(chalkLog("INIT UPDATER PING INTERVAL"
//     + " | " + interval + " MS"
//   ));

//   clearInterval(updaterPingInterval);

//   updaterPingInterval = setInterval(function updaterPing() {

//     if (updaterPingOutstanding > 0) {
//       console.error(chalkError("PING OUTSTANDING | " + updaterPingOutstanding));
//       updaterPingOutstanding = 0;
//       initUpdater();
//       slackPostMessage(slackChannel, "\n*UPDATER PING TIMEOUT*\nOUTSTANDING PINGS: " + updaterPingOutstanding + "\n");
//     }

//     updaterPingOutstanding = moment().format(compactDateTimeFormat);

//     if (updater !== undefined){
//       updater.send({
//         op: "PING",
//         message: hostname + "_" + process.pid,
//         timeStamp: updaterPingOutstanding
//       }, function updaterPingError(err){
//         if (err) {
//           // pmx.emit("ERROR", "PING ERROR");
//           console.error(chalkError("*** UPDATER SEND ERROR"
//             + " | " + err
//           ));
//           slackPostMessage(slackChannel, "\n*UPDATER SEND ERROR*\n" + err);
//           initUpdater();
//         }
//       });

//       debug(chalkLog(">UPDATER PING"
//       ));

//     }
//     else {
//       console.log(chalkError("!!! NO UPDATER PING ... UNDEFINED"
//       ));
//     }
//   }, interval);
// }



let updaterMessageReady = true;
let updaterMessageQueueInterval;
function initUpdaterMessageQueueInterval(interval){

  console.log(chalkInfo("INIT UPDATER MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(updaterMessageQueueInterval);

  let updaterObj;

  updaterMessageQueueInterval = setInterval(function updaterMessageRx() {

    // if (updaterMessageReady && !updaterMessageQueue.isEmpty()) {
    if (updaterMessageReady && (updaterMessageQueue.length > 0)) {

      updaterMessageReady = false;

      // updaterObj = updaterMessageQueue.dequeue();
      updaterObj = updaterMessageQueue.shift();

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
            // + " [ Q: " + updaterMessageQueue.size() + " ]"
            + " [ Q: " + updaterMessageQueue.length + " ]"
            + " | " + moment().format(compactDateTimeFormat)
            + " | PID: " + updaterObj.pid
            + " | NUM KEYWORDS: " + updaterObj.keywords
          ));
          updaterMessageReady = true;
        break;

        case "keywordHashMapClear":
          keywordHashMap.clear();
          console.log(chalkAlert("KEYWORD HASHMAP CLEAR"));
          updaterMessageReady = true;
        break;

        case "keywordRemove":
          keywordHashMap.remove(updaterObj.keyword);
          keywordHashMap.remove(updaterObj.keyword.toLowerCase());
          console.log(chalkAlert("KEYWORD REMOVE: " + updaterObj.keyword.toLowerCase()));
          updaterMessageReady = true;
        break;

        case "keyword":
          // debugKeyword(chalkLog("KEYWORD: " + jsonPrint(updaterObj)));
          debugKeyword(chalkLog("UPDATE KEYWORD\n" + jsonPrint(updaterObj.keyword)));

          if (typeof updaterObj.keyword.keywordId !== "string") {
            console.error("KEYWORD IS NOT A STRING: " + updaterObj.keyword.keywordId);
            quit();
          }

          // const kw = omit(updaterObj.keyword, "keywordId");
          keywordHashMap.set(updaterObj.keyword.keywordId.toLowerCase(), omit(updaterObj.keyword, "keywordId"));
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
      // sorterMessageRxQueue.enqueue(m);
      sorterMessageRxQueue.push(m);
    // }
  });

  s.send({
    op: "INIT",
    interval: DEFAULT_INTERVAL
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

  tweetParserReady = false;

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
    // if (tweetParserMessageRxQueue.size() < MAX_Q){
    if (tweetParserMessageRxQueue.length < MAX_Q){
      // tweetParserMessageRxQueue.enqueue(m);
      tweetParserMessageRxQueue.push(m);
    }
  });

  twp.send({
    op: "INIT",
    networkObj: bestNetworkObj,
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

  tweetParserReady = true;

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

  statsObj.wordsPerMin = 0.0;
  statsObj.wordsPerSecond = 0.0;
  statsObj.maxWordsPerMin = 0.0;
  statsObj.maxTweetsPerMin = 0.0;

  // statsObj.queues.transmitNodeQueue = transmitNodeQueue.size();
  // statsObj.queues.tweetRxQueue = tweetRxQueue.size();
  // statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
  // statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.size();
  // statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.size();

  statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
  statsObj.queues.tweetRxQueue = tweetRxQueue.length;
  statsObj.queues.updaterMessageQueue = updaterMessageQueue.length;
  statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.length;
  statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.length;

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

  // let memoryHeapUsedDataPoint = {};
  // memoryHeapUsedDataPoint.metricType = "memory/heap_used";
  // memoryHeapUsedDataPoint.metricLabels = {server_id: "MEM"};

  // let memoryHeapTotalDataPoint = {};
  // memoryHeapTotalDataPoint.metricType = "memory/heap_total";
  // memoryHeapTotalDataPoint.metricLabels = {server_id: "MEM"};

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

    // statsObj.queues.transmitNodeQueue = transmitNodeQueue.size();
    // statsObj.queues.tweetRxQueue = tweetRxQueue.size();
    // statsObj.queues.updaterMessageQueue = updaterMessageQueue.size();
    // statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.size();
    // statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.size();

    statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
    statsObj.queues.tweetRxQueue = tweetRxQueue.length;
    statsObj.queues.updaterMessageQueue = updaterMessageQueue.length;
    statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.length;
    statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.length;

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

let loadBestNetworkInterval;

function initLoadBestNetworkInterval(interval){

  clearInterval(loadBestNetworkInterval);

  loadBestNetworkInterval = setInterval(function(){

    loadFile(bestNetworkFolder, bestRuntimeNetworkFileName, function(err, bRtNnObj){

      if (err) {
        console.trace(chalkError("LOAD BEST NETWORK ERROR"
          + " | PATH: " + bestNetworkFolder + "/" + bestRuntimeNetworkFileName 
          + " | ERROR: " + err
        ));
      }
      else {

        bRtNnObj.matchRate = (bRtNnObj.matchRate !== undefined) ? bRtNnObj.matchRate : 0;

        console.log(chalkInfo("LOAD BEST NETWORK RUNTIME ID"
          + " | " + bRtNnObj.networkId
          + " | SUCCESS: " + bRtNnObj.successRate.toFixed(2) + "%"
          + " | MATCH: " + bRtNnObj.matchRate.toFixed(2) + "%"
          // + " | " + nnObj.successRate.toFixed(2)
          // + "\n" + jsonPrint(nnObj)
        ));

        statsObj.bestNetwork.networkId = bRtNnObj.networkId;
        statsObj.bestNetwork.successRate = bRtNnObj.successRate;
        statsObj.bestNetwork.matchRate = bRtNnObj.matchRate;

        let file = bRtNnObj.networkId + ".json";

        loadFile(bestNetworkFolder, file, function(err, nnObj){

          if (err) {
            console.trace(chalkError("LOAD BEST NETWORK ERROR"
              + " | PATH: " + bestNetworkFolder + "/" + file 
              + " | ERROR" + err
            ));
          }

          bestNetworkObj = deepcopy(nnObj);

          if (tweetParser === undefined) {
            initTweetParser();
          }

          if ((tweetParser !== undefined) && (previousBestNetworkId !== bestNetworkObj.networkId)) {

            previousBestNetworkId = bestNetworkObj.networkId;

            nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;

            console.log(chalkAlert("NEW BEST NETWORK"
              + " | " + nnObj.networkId
              + " | " + nnObj.successRate.toFixed(2)
              + " | " + nnObj.matchRate.toFixed(2)
              // + "\n" + jsonPrint(nnObj)
            ));

            statsObj.bestNetwork.networkId = nnObj.networkId;
            statsObj.bestNetwork.successRate = nnObj.successRate;
            statsObj.bestNetwork.matchRate = nnObj.matchRate;

            tweetParser.send({ op: "NETWORK", networkObj: bestNetworkObj }, function twpNetwork(err){
              if (err) {
                // pmx.emit("ERROR", "TWEET PARSER INIT SEND ERROR");
                console.error(chalkError("*** TWEET PARSER SEND NETWORK ERROR"
                  + " | " + err
                ));
              }
            });
          }

        });

      }
    });
  
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

  initLoadBestNetworkInterval(ONE_MINUTE+1);

  initInternetCheckInterval(10000);

  io = require("socket.io")(httpServer, { reconnection: true });

  function postAuthenticate(socket, data) {
    console.log(chalkAlert("postAuthenticate\n" + jsonPrint(data)));
  }

  function disconnect(socket) {
    console.log(chalkAlert("POST AUTHENTICATE DISCONNECT | " + socket.id));
  }

  const socketIoAuth = require("@threeceelabs/socketio-auth")(io, {

    authenticate: function (socket, data, callback) {

      console.log(chalkAlert("SOCKET IO AUTHENTICATE | " + socket.id + jsonPrint(data)));
      //get credentials sent by the client
      const namespace = data.namespace;
      const userId = data.userId.toLowerCase();
      const password = data.password;

      if (namespace === "view") {
        console.log(chalkAlert("VIEWER AUTHENTICATED | " + userId));
        return callback(null, true);
      }

      if ((namespace === "util") && (password === "0123456789")) {
        console.log(chalkAlert("UTL AUTHENTICATED | " + userId));
        return callback(null, true);
      }

      // userServer.findOne({ user: { userId: userId }}, function(err, user){

      //   console.log(chalkAlert("DESERIALIZED USER\n" + jsonPrint(user)));

      //   if (err) { 
      //     console.log(chalkError("!!! USER AUTHENTICATION ERROR !!!\n" + jsonPrint(err)));
      //     callback(err);
      //   }
      //   else if (!user) { 
      //     console.log(chalkError("!!! USER AUTHENTICATION FAILED !!! | USER NOT FOUND: " + userId));
      //     callback(new Error("User not found"));
      //   }
      //   else {
      //     console.log(chalkAlert("AUTHENTICATION: USER FOUND\n" + jsonPrint(user)));
      //     callback(null, user.password === password);
      //   }

      // });
    },
    postAuthenticate: postAuthenticate,
    disconnect: disconnect,
    timeout: cnf.socketIoAuthTimeout
  });


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

  slackPostMessage(slackChannel, "\n*CHILD ERROR*\n" + childObj.name + "\n");

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
  // let heapdumpFileName;

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
      console.log(chalkInfo("NEW MAX RSS"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.memory.rss.toFixed(1) + " MB"
      ));
    }
  }, 15000);

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
      debug(chalkLog("NEW MAX HEAP"
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

    // if ((HEAPDUMP_ENABLED || (heapdumpThresholdEnabled && (statsObj.memory.maxRss > HEAPDUMP_THRESHOLD))) 
    //   && (statsUpdated > 1) 
    //   && (statsUpdated % HEAPDUMP_MODULO === 0)) {

    //   heapdumpFileName = "was2" 
    //     + "_" + hostname 
    //     + "_" + moment().format(tinyDateTimeFormat) 
    //     + "_" + process.pid 
    //     + ".heapsnapshot";

    //   console.log(chalkError("***** HEAPDUMP *****"
    //     + " | STATS UPDATED: " +  statsUpdated
    //     + " | FILE: " +  heapdumpFileName
    //   ));

    //   heapdump.writeSnapshot(heapdumpFileName);
    // }

  }, interval);
}

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
    initSorterMessageRxQueueInterval(DEFAULT_INTERVAL);

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

    // memwatch.on("leak", function memwatchLeak(info) {

    //   const diff = hd.end();

    //   statsObj.memwatch.snapshotTaken = false;
    //   statsObj.memwatch.leak = info;

    //   console.error(chalkError("MEM LEAK"
    //     + " | " + getTimeStamp()
    //     + " | RSS" + info.growth
    //     + " | GROWTH: " + info.growth
    //     + " | " + info.reason
    //    ));

    //   console.log(chalkError("*** MEM DIFF *** \n" + util.inspect(diff, {showHidden:false, depth:4})));

    //   const heapdumpFileName = "was2" 
    //     + "_" + hostname 
    //     + "_" + moment().format(tinyDateTimeFormat) 
    //     + "_" + process.pid 
    //     + "_LEAK"
    //     + ".heapsnapshot";

    //   console.log(chalkError("***** HEAPDUMP MEMORY LEAK *****"
    //     + " | " + getTimeStamp()
    //     + " | FILE: " +  heapdumpFileName
    //   ));

    //   heapdump.writeSnapshot(heapdumpFileName);

    //   const growth = info.growth/(1024*1024);

    //   const dmString = "\nMEM LEAK"
    //     + " | " + hostname 
    //     + "\nGRW: " + growth.toFixed(3) + " MB"
    //     + "\nRSS: " + statsObj.memory.rss.toFixed(3) + " MB"
    //     + "\nMAX: " + statsObj.memory.maxRss.toFixed(3) + " MB"
    //     + " | " + moment(parseInt(statsObj.memory.maxRssTime)).format(compactDateTimeFormat) + " MB"
    //     + "\n" + info.reason;

    //   slackPostMessage(slackChannel, dmString);
    // });

    // memwatch.on("stats", function memwatchStats(stats) {
    //   if(statsObj.memwatch.snapshotTaken ===false) {
    //     hd = new memwatch.HeapDiff();
    //     console.error(chalkAlert(getTimeStamp() + " | MEM SNAPSHOT TAKEN"));
    //     statsObj.memwatch.snapshotTaken = true;
    //   }
    //   statsObj.memwatch.stats = stats;
    //   statsObj.memwatch.stats.estimated_base = stats.estimated_base/(1024*1024);
    //   statsObj.memwatch.stats.current_base = stats.current_base/(1024*1024);
    //   statsObj.memwatch.stats.min = stats.min/(1024*1024);
    //   statsObj.memwatch.stats.max = stats.max/(1024*1024);

    //   debug(chalkInfo("MEM"
    //     + " | " + getTimeStamp()
    //     + " | FGCs: " + stats.num_full_gc
    //     + " | IGCs: " + stats.num_inc_gc
    //     + " | TREND: " + stats.usage_trend
    //     + " | EBASE: " + statsObj.memwatch.stats.estimated_base.toFixed(3) + " MB"
    //     + " | CBASE: " + statsObj.memwatch.stats.current_base.toFixed(3) + " MB"
    //     + " | MIN: " + statsObj.memwatch.stats.min.toFixed(3) + " MB"
    //     + " | MAX: " + statsObj.memwatch.stats.max.toFixed(3) + " MB"
    //     // + "\n" + jsonPrint(info)
    //    ));
    //   // console.log(chalkInfo("MEM STATS\n" + jsonPrint(stats)));
    // });

    // sendDirectMessage("threecee", "INIT " + hostname + " | " + moment().format(compactDateTimeFormat));
    slackPostMessage(slackChannel, "\n*INIT* | " + hostname + "\n");

  }
});

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
