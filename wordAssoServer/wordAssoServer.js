/*jslint node: true */
"use strict";

const shell = require("shelljs");

var DEFAULT_NODE_TYPES = ["emoji", "hashtag", "media", "place", "url", "user", "word"];

let dbConnection;
let dbConnectionReady = false;
let statsObj = {};

let unfollowableUserFile = "unfollowableUser.json";

let followableSearchTermSet = new Set();

followableSearchTermSet.add("trump");
followableSearchTermSet.add("obama");
followableSearchTermSet.add("clinton");
followableSearchTermSet.add("reagan");
followableSearchTermSet.add("#maga");
followableSearchTermSet.add("#kag");
followableSearchTermSet.add("#nra");
followableSearchTermSet.add("@nra");
followableSearchTermSet.add("pence");
followableSearchTermSet.add("ivanka");
followableSearchTermSet.add("mueller");
followableSearchTermSet.add("bluewave");
followableSearchTermSet.add("#resist");
followableSearchTermSet.add("#dem");
followableSearchTermSet.add("liberal");
followableSearchTermSet.add("conservative");
followableSearchTermSet.add("#imwithher");
followableSearchTermSet.add("#metoo");
followableSearchTermSet.add("#blm");
followableSearchTermSet.add("livesmatter");
followableSearchTermSet.add("hanity");

let followableSearchTermString = "";

let followableRegEx;

const DEFAULT_SORTER_CHILD_ID = "wa_node_sorter";
const DEFAULT_TWEET_PARSER_CHILD_ID = "wa_node_tweetParser";

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const DEFAULT_INTERVAL = 10;
const DEFAULT_PING_INTERVAL = 5000;
const DROPBOX_LIST_FOLDER_LIMIT = 50;
const DEFAULT_MIN_FOLLOWERS_AUTO = 50000;
const RATE_QUEUE_INTERVAL = 1000; // 1 second
const RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const TWEET_PARSER_INTERVAL = 5;
const TWITTER_RX_QUEUE_INTERVAL = 5;
const TRANSMIT_NODE_QUEUE_INTERVAL = 5;
const TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 5;
const UPDATE_TRENDS_INTERVAL = 15*ONE_MINUTE;
const STATS_UPDATE_INTERVAL = 60000;
const CATEGORY_UPDATE_INTERVAL = 5*ONE_MINUTE;
const HASHTAG_LOOKUP_QUEUE_INTERVAL = 2;

const moment = require("moment");

let dropboxConfigDefaultFolder = "/config/utility/default";
let dropboxConfigTwitterFolder = "/config/twitter";

const DEFAULT_TWITTER_CONFIG_FILE = "ninjathreecee.json";
const DEFAULT_TWITTER_AUTO_FOLLOW_CONFIG_FILE = "threeceeinfo.json";

let defaultTwitterConfigFile = DEFAULT_TWITTER_CONFIG_FILE;
let twitterAutoFollowConfigFile = DEFAULT_TWITTER_AUTO_FOLLOW_CONFIG_FILE;

if (process.env.DEFAULT_TWITTER_CONFIG_FILE !== undefined) {
  defaultTwitterConfigFile = process.env.DEFAULT_TWITTER_CONFIG_FILE;
}

if (process.env.DEFAULT_TWITTER_AUTO_FOLLOW_CONFIG_FILE !== undefined) {
  twitterAutoFollowConfigFile = process.env.DEFAULT_TWITTER_AUTO_FOLLOW_CONFIG_FILE;
}

const bestNetworkFolder = "/config/utility/best/neuralNetworks";
const bestRuntimeNetworkFileName = "bestRuntimeNetwork.json";

let dropboxConfigDefaultTrainingSetsFolder = dropboxConfigDefaultFolder + "/trainingSets";

let maxInputHashMapFile = "maxInputHashMap.json";

let nodeSearchType = false;
let nodeSearchBy = "lastSeen";
let previousUserUncategorizedId = "1";
let previousUserUncategorizedCreated = moment();
let previousUserUncategorizedLastSeen = moment();
let previousUserMismatchedId = "1";

const categorizedFolder = dropboxConfigDefaultFolder + "/categorized";
const categorizedUsersFile = "categorizedUsers.json";
const categorizedHashtagsFile = "categorizedHashtags.json";

const fieldsExclude = {
  histograms: 0,
  countHistory: 0,
  friends: 0
};

let childrenHashMap = {};

let bestNetworkObj = {};
let maxInputHashMap = {};
let normalization = {};

let tweetParserReady = false;
let tweetParserSendReady = false;
let previousBestNetworkId = "";

const MAX_SESSION_AGE = ONE_DAY/1000;
const MAX_Q = 200;
const OFFLINE_MODE = false;

const passport = require("passport");

let twitterUserThreecee = {
    nodeId : "14607119",
    userId : "14607119",
    profileImageUrl : "http://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
    profileUrl : "http://twitter.com/threecee",
    url : "http://threeCeeMedia.com",
    name : "Tracy Collins",
    screenName : "threecee",
    // nodeId : "14607119",
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
const deepcopy = require("deep-copy");
const sizeof = require("object-sizeof");
const writeJsonFile = require("write-json-file");

const session = require("express-session");
const MongoDBStore = require("express-session-mongo");
// const MongoDBStore = require("connect-mongostore")(session);

const slackOAuthAccessToken = "xoxp-3708084981-3708084993-206468961315-ec62db5792cd55071a51c544acf0da55";
const slackChannel = "#was";
const slackChannelAutoFollow = "#wasAuto";
const slackErrorChannel = "#wasError";
const Slack = require("slack-node");

const slack = new Slack(slackOAuthAccessToken);

let unfollowableUserSet = new Set();

process.title = "node_wordAssoServer";
console.log("\n\n============== START ==============\n\n");

console.log("PROCESS PID:   " + process.pid);
console.log("PROCESS TITLE: " + process.title);

let quitOnError = true;

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================


const compactDateTimeFormat = "YYYYMMDD HHmmss";
const tinyDateTimeFormat = "YYYYMMDDHHmmss";


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
  "null",
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

const util = require("util");
const Measured = require("measured");
const omit = require("object.omit");
const pick = require("object.pick");
const config = require("./config/config");
const os = require("os");
const fs = require("fs");
const path = require("path");
const async = require("async");
const yaml = require("yamljs");
const debug = require("debug")("wa");
const debugCache = require("debug")("cache");
const debugCategory = require("debug")("kw");

const express = require("./config/express");
const app = express();

const EventEmitter2 = require("eventemitter2").EventEmitter2;
require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

const Monitoring = require("@google-cloud/monitoring");

let googleMonitoringClient;

const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");

const categorizedUserHashMap = new HashMap();
const categorizedWordHashMap = new HashMap();
const categorizedHashtagHashMap = new HashMap();
const metricsHashmap = new HashMap();
const deletedMetricsHashmap = new HashMap();

const Twit = require("twit");
let twit;
let twitAutoFollow;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

const chalk = require("chalk");
const chalkTwitter = chalk.blue;
const chalkConnect = chalk.black;
const chalkSession = chalk.black;
const chalkDisconnect = chalk.black;
const chalkSocket = chalk.black;
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;

const tweetMeter = new Measured.Meter({rateUnit: 60000});

let languageServer = {};


let adminHashMap = new HashMap();
let serverHashMap = new HashMap();
let viewerHashMap = new HashMap();

let nodeMeter = {};
let nodeMeterType = {};

DEFAULT_NODE_TYPES.forEach(function(nodeType){
  nodeMeterType[nodeType] = {};
});

let tweetRxQueueInterval;
let tweetParserQueue = [];
let tweetParserMessageRxQueue = [];
let tweetRxQueue = [];

let hashtagLookupQueueInterval;
let hashtagLookupQueue = [];

let keySortQueue = [];

let sorterPingInterval;
let sorterPongReceived = false;
let pingId = false;


let categoryHashmapsInterval;
let statsInterval;


function quit(message) {
  debug("\n... QUITTING ...");
  let msg = "";
  if (message) {msg = message;}
  debug("QUIT MESSAGE: " + msg);
  process.exit();
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
const statsFile = "wordAssoServerStats" 
  + "_" + moment().format(tinyDateTimeFormat) 
  + ".json";

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

const configFolder = "/config/utility/" + hostname;
const deletedMetricsFile = "deletedMetrics.json";

const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const emojiModel = require("@threeceelabs/mongoose-twitter/models/emoji.server.model");
const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

const mongoose = require("mongoose");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
// const wordAssoDb = require("../../mongooseTwitter");

let NeuralNetwork;
let Emoji;
let Hashtag;
let Media;
let Place;
let Tweet;
let Url;
let User;
let Word;

let hashtagServerController;
let userServerController;
let wordServerController;

wordAssoDb.connect("WAS_" + process.pid, function(err, dbCon){
  if (err) {
    console.log(chalkError("*** MONGO DB CONNECTION ERROR: " + err));
    quit("MONGO DB CONNECTION ERROR");
  }
  else {

    dbConnection = dbCon;

    dbConnectionReady = true;

    dbConnection.on("error", function(){
      console.error.bind(console, "*** TFE | MONGO DB CONNECTION ERROR ***\n");
      console.log(chalkError("*** TFE | MONGO DB CONNECTION ERROR ***\n"));
      dbConnectionReady = false;
    });

    dbConnection.on("disconnected", function(){
      console.error.bind(console, "*** TFE | MONGO DB CONNECTION DISCONNECTED ***\n");
      console.log(chalkAlert("*** TFE | MONGO DB CONNECTION DISCONNECTED ***\n"));
      dbConnectionReady = false;
    });

    console.log(chalk.blue("WORD ASSO SERVER | MONGOOSE DEFAULT CONNECTION OPEN"));
    NeuralNetwork = mongoose.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
    Emoji = mongoose.model("Emoji", emojiModel.EmojiSchema);
    Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
    Media = mongoose.model("Media", mediaModel.MediaSchema);
    Place = mongoose.model("Place", placeModel.PlaceSchema);
    Tweet = mongoose.model("Tweet", tweetModel.TweetSchema);
    Url = mongoose.model("Url", urlModel.UrlSchema);
    User = mongoose.model("User", userModel.UserSchema);
    Word = mongoose.model("Word", wordModel.WordSchema);

    hashtagServerController = require("@threeceelabs/hashtag-server-controller");
    userServerController = require("@threeceelabs/user-server-controller");
    wordServerController = require("@threeceelabs/word-server-controller");
    // userServerController = require("../../userServerController");
  }

});

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

function printUser(params) {
  let text;
  if (params.verbose) {
    return jsonPrint(params.user);
  } 
  else {
    text = params.user.nodeId 
      + " | @" + params.user.screenName 
      + " | N: " + params.user.name 
      + " | CR: " + params.user.createdAt 
      + " | LS: " + params.user.lastSeen 
      + " | ULS: " + params.user.updateLastSeen 
      + "\nFLWg: " + params.user.following 
      + " | 3C: " + params.user.threeceeFollowing 
      + "\nTs: " + params.user.statusesCount 
      + " | FRNDs: " + params.user.friendsCount 
      + " | FLWRs: " + params.user.followersCount 
      + " | LAd: " + params.user.languageAnalyzed 
      + "\nCAT MAN: " + params.user.category
      + " | CAT AUTO: " + params.user.categoryAuto;
    return text;
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

function authenticatedUserCacheExpired(nodeId, userObj) {

  console.log(chalkLog("XXX $ AUTH USER"
    + " | " + nodeId
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

  if (nodeMeter[nodeCacheId] || (nodeMeter[nodeCacheId] !== undefined)) {

    nodeMeter[nodeCacheId].end();
    nodeMeter[nodeCacheId] = null;

    nodeMeter = omit(nodeMeter, nodeCacheId);
    delete nodeMeter[nodeCacheId];

    debugCache(chalkLog("XXX NODE METER"
      + " | Ks: " + Object.keys(nodeMeter).length
      + " | " + nodeCacheId
    ));


    if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
      statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
      statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
      debugCache(chalkLog("NEW MAX NODE METER ENTRIES"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.nodeMeterEntries.toFixed(0)
      ));
    }
  }

  if (nodeMeterType[nodeObj.nodeType][nodeCacheId] || (nodeMeterType[nodeObj.nodeType][nodeCacheId] !== undefined)) {

    nodeMeterType[nodeObj.nodeType][nodeCacheId].end();
    nodeMeterType[nodeObj.nodeType][nodeCacheId] = null;

    nodeMeterType[nodeObj.nodeType] = omit(nodeMeterType[nodeObj.nodeType], nodeCacheId);
    delete nodeMeterType[nodeObj.nodeType][nodeCacheId];

    debug(chalkLog("XXX NODE TYPE METER | " + nodeObj.nodeType
      + " | Ks: " + Object.keys(nodeMeterType[nodeObj.nodeType]).length
      + " | " + nodeCacheId
    ));
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

let nodesPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (nodesPerMinuteTopTermTtl === undefined) {nodesPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;}
console.log("TOP TERMS WPM CACHE TTL: " + nodesPerMinuteTopTermTtl + " SECONDS");

let nodesPerMinuteTopTermCheckPeriod = process.env.TOPTERMS_CACHE_CHECK_PERIOD;
if (nodesPerMinuteTopTermCheckPeriod === undefined) {
  nodesPerMinuteTopTermCheckPeriod = TOPTERMS_CACHE_CHECK_PERIOD;
}
console.log("TOP TERMS WPM CACHE CHECK PERIOD: " + nodesPerMinuteTopTermCheckPeriod + " SECONDS");

const nodesPerMinuteTopTermCache = new NodeCache({
  stdTTL: nodesPerMinuteTopTermTtl,
  checkperiod: TOPTERMS_CACHE_CHECK_PERIOD
});

let nodesPerMinuteTopTermNodeTypeCache = {};

DEFAULT_NODE_TYPES.forEach(function(nodeType){
  nodesPerMinuteTopTermNodeTypeCache[nodeType] = new NodeCache({
    stdTTL: nodesPerMinuteTopTermTtl,
    checkperiod: TOPTERMS_CACHE_CHECK_PERIOD
  });
});


let updateMetricsInterval;


let internetReady = false;
let ioReady = false;

let saveFileQueue = [];


let configuration = {};

configuration.keySortInterval = DEFAULT_INTERVAL;

configuration.enableTransmitUser = true;
configuration.enableTransmitWord = false;
configuration.enableTransmitPlace = false;
configuration.enableTransmitHashtag = true;
configuration.enableTransmitEmoji = false;
configuration.enableTransmitUrl = false;
configuration.enableTransmitMedia = false;

configuration.saveFileQueueInterval = ONE_SECOND;
configuration.socketIoAuthTimeout = 30*ONE_SECOND;
configuration.quitOnError = false;
configuration.maxTopTerms = process.env.WA_MAX_TOP_TERMS || 100;
configuration.metrics = {};
configuration.metrics.nodeMeterEnabled = true;
configuration.minFollowersAuto = DEFAULT_MIN_FOLLOWERS_AUTO;

if (process.env.MIN_FOLLOWERS_AUTO !== undefined) {
  configuration.minFollowersAuto = parseInt(process.env.MIN_FOLLOWERS_AUTO);
}

if (process.env.NODE_METER_ENABLED !== undefined) {
  if (process.env.NODE_METER_ENABLED === "true") {
    configuration.metrics.nodeMeterEnabled = true;
  }
  else if (process.env.NODE_METER_ENABLED === "false") {
    configuration.metrics.nodeMeterEnabled = false;
  }
  else {
    configuration.metrics.nodeMeterEnabled = true;
  }
}

let internetCheckInterval;

const http = require("http");
const httpServer = http.createServer(app);
const ioConfig = {
  pingInterval: 40000,
  pingTimeout: 25000,
  reconnection: true
};

let io;
const net = require("net");

const cp = require("child_process");
let sorter;
let sorterMessageRxQueue = [];

const ignoreWordHashMap = new HashMap();
const localHostHashMap = new HashMap();

let tweetParser;

// function updateDbStats(callback){
//   if (dbConnectionReady) {

//     async.each({}, function(){

//       User
//       .find({"category": { $nin: [ 'left', 'right', 'neutral', 'positive', 'negative' ] } })
//       .count()
//       .exec(function(err, numUncatUsers){
//         if (!err) { 
//           statsObj.nodes.user.uncategorized = numUncatUsers;
//           console.log("USER NODES"
//             + " | UNCATEGORIZED: " + statsObj.nodes.user.uncategorized
//           );
//         }
//       });
      
//       User
//       .find({"category": { $in: [ 'left', 'right', 'neutral', 'positive', 'negative' ] } })
//       .count()
//       .exec(function(err, numCatUsers){
//         if (!err) { 
//           statsObj.nodes.user.categorized = numCatUsers;
//           console.log("USER NODES"
//             + " | CATEGORIZED: " + statsObj.nodes.user.categorized
//           );
//         }
//       });
//     }, function(){

//     });
//   }
// }

function initStats(callback){
  console.log(chalk.blue("INIT STATS"));
  statsObj = {};

  statsObj.dbConnection = dbConnectionReady;
  statsObj.nodes = {};
  statsObj.nodes.user = {};
  statsObj.nodes.user.total = 0;
  statsObj.nodes.user.categorized = 0;
  statsObj.nodes.user.uncategorized = 0;

  statsObj.bestNetwork = {};

  statsObj.memwatch = {};
  statsObj.memwatch.snapshotTaken = false;
  statsObj.memwatch.leak = {};
  statsObj.memwatch.stats = {};

  statsObj.errors = {};
  statsObj.errors.google = {};
  statsObj.errors.twitter = {};
  statsObj.errors.twitter.maxRxQueue = 0;

  statsObj.nodeMeterEntries = 0;
  statsObj.nodeMeterEntriesMax = 0;
  statsObj.nodeMeterEntriesMaxTime = moment().valueOf();

  childrenHashMap = {};

  statsObj.twitter = {};
  statsObj.twitter.tweetsReceived = 0;
  statsObj.twitter.tweetsPerMin = 0;
  statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
  statsObj.hostname = hostname;
  statsObj.name = "Word Association Server Status";
  statsObj.startTime = moment().valueOf();
  statsObj.timeStamp = moment().format(compactDateTimeFormat);
  statsObj.serverTime = moment().valueOf();
  statsObj.upTime = os.uptime() * 1000;
  statsObj.runTime = 0;
  statsObj.runTimeArgs = process.argv;
  statsObj.nodesPerMin = 0;
  statsObj.maxNodesPerMin = 0;
  statsObj.maxNodesPerMinTime = moment().valueOf();
  statsObj.nodesPerMin = 0.0;
  statsObj.nodesPerSec = 0.0;
  statsObj.maxNodesPerMin = 0.0;
  statsObj.caches = {};
  statsObj.caches.nodeCache = {};
  statsObj.caches.nodeCache.stats = {};
  statsObj.caches.nodeCache.stats.keys = 0;
  statsObj.caches.nodeCache.stats.keysMax = 0;
  statsObj.caches.nodesPerMinuteTopTermCache = {};
  statsObj.caches.nodesPerMinuteTopTermCache.stats = {};
  statsObj.caches.nodesPerMinuteTopTermCache.stats.keys = 0;
  statsObj.caches.nodesPerMinuteTopTermCache.stats.keysMax = 0;

  statsObj.caches.nodesPerMinuteTopTermNodeTypeCache = {};

  DEFAULT_NODE_TYPES.forEach(function(nodeType){
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType] = {};
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType].stats = {};
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType].stats.keys = 0;
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType].stats.keysMax = 0;
  });

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

  statsObj.admin = {};
  statsObj.admin.connected = 0;
  statsObj.admin.connectedMax = 0.1;
  statsObj.admin.connectedMaxTime = moment().valueOf();

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

  statsObj.session = {};
  statsObj.session.errors = 0;
  statsObj.session.numberSessions = 0;
  statsObj.session.previousPromptNotFound = 0;
  statsObj.session.totalCreated = 0;
  statsObj.session.wordError = 0;
  statsObj.session.wordErrorType = {};

  statsObj.socket = {};
  statsObj.socket.connects = 0;
  statsObj.socket.reconnects = 0;
  statsObj.socket.disconnects = 0;
  statsObj.socket.errors = {};
  statsObj.socket.errors.reconnect_errors = 0;
  statsObj.socket.errors.connect_errors = 0;
  statsObj.socket.errors.reconnect_fails = 0;
  statsObj.socket.errors.connect_timeouts = 0;
  statsObj.socket.wordsReceived = 0;

  statsObj.utilities = {};

  callback();
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
    .then(function(results){
      // console.log(chalkAlert("dropboxLongpoll FOLDER: " + lastCursorTruncated + "\n" + jsonPrint(result)));
      callback(null, results);
    })
    .catch(function(err){
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
  .then(function(last_cursor) {

    lastCursorTruncated = last_cursor.cursor.substring(0,20);

    debug(chalkLog("lastCursorTruncated: " + lastCursorTruncated));

    dropboxLongPoll(last_cursor.cursor, function(err, results){

      if (results.changes) {

        dropboxClient.filesListFolderContinue({ cursor: last_cursor.cursor})
        .then(function(response){
          debug(chalkLog("filesListFolderContinue: " + jsonPrint(response)));
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
  .catch(function(err){
    console.log(err);
    callback(err, folder);
  });
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
    + " | AD: " + statsObj.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | VW: " + statsObj.entity.viewer.connected
    + " | TwRxPM: " + statsObj.twitter.tweetsPerMin
    + " | MaxTwRxPM: " + statsObj.twitter.maxTweetsPerMin
    + " | TwRXQ: " + tweetRxQueue.length
    + " | TwPRQ: " + tweetParserQueue.length
  ));
}

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
        console.log("WAS"
          + " | " + chalkError(getTimeStamp()
          + " | *** ERROR LOADING FILE FROM DROPBOX FILE"
          + " | " + fullPath
        ));
        return(callback(err, null));
      }

      debug("WAS"
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
          console.trace(chalkError("WAS | JSON PARSE ERROR: " + e));
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

      debug("WAS"
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
          console.trace(chalkError("WAS | JSON PARSE ERROR: " + fullPath  + " | ERROR: " + e + "\n" + jsonPrint(e)));
          callback(e, null);
        }
      }
      else if (file.match(/\.txt$/gi)) {
        callback(null, data);
      }
      else {
        console.log(chalkLog("WAS"
          + " | " + getTimeStamp()
          + " | ??? LOADING FILE FROM DROPBOX FILE | NOT .json OR .txt: " + fullPath
        ));
        callback(null, null);
      }
    })
    .catch(function(error) {

      console.log(chalkError("WAS | !!! DROPBOX READ " + fullPath + " ERROR"));

      if (error.status === 404) {
        console.error(chalkError("WAS | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return(callback(null, null));
      }
      if (error.status === 409) {
        console.error(chalkError("WAS | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"));
        return(callback(null, null));
      }
      if (error.status === 0) {
        console.error(chalkError("WAS | !!! DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      callback(error, null);
    });
  }
}

function loadMaxInputHashMap(params, callback){
  loadFile(params.folder, params.file, function(err, dataObj){
    if (err){
      console.log(chalkError("ERROR: loadMaxInputHashMap: loadFile: " + err));
      return(callback(err));
    }
    if (dataObj.maxInputHashMap === undefined) {
      console.log(chalkError("ERROR: loadMaxInputHashMap: loadFile: maxInputHashMap UNDEFINED"));
      return(callback("dataObj.maxInputHashMap UNDEFINED"));
    }
    if (dataObj.normalization === undefined) {
      console.log(chalkError("ERROR: loadMaxInputHashMap: loadFile: normalization UNDEFINED"));
      return(callback("dataObj.normalization UNDEFINED"));
    }
    maxInputHashMap = {};
    maxInputHashMap = dataObj.maxInputHashMap;
    normalization = {};
    normalization = dataObj.normalization;
    callback();
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

function saveFile (params, callback){

  const fullPath = params.folder + "/" + params.file;

  debug(chalkInfo("LOAD FOLDER " + params.folder));
  debug(chalkInfo("LOAD FILE " + params.file));
  debug(chalkInfo("FULL PATH " + fullPath));

  let options = {};

  if (params.localFlag) {

    options.access_token = configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
    options.file_size = sizeof(params.obj);
    options.destination = params.dropboxFolder + "/" + params.file;
    options.autorename = true;
    options.mode = params.mode || "overwrite";
    options.mode = "overwrite";

    const objSizeMBytes = options.file_size/ONE_MEGABYTE;

    showStats();
    console.log(chalk.blue("WAS | ... SAVING LOCALLY"
      + " | " + objSizeMBytes.toFixed(2) + " MB | " + fullPath
    ));

    writeJsonFile(fullPath, params.obj)
    .then(function() {

      console.log(chalk.blue("WAS | SAVED LOCALLY"
        + " | " + objSizeMBytes.toFixed(2) + " MB | " + fullPath
      ));
      console.log(chalk.blue("WAS | ... PAUSE 5 SEC TO FINISH FILE SAVE"
        + " | " + objSizeMBytes.toFixed(2) + " MB | " + fullPath
        ));

      setTimeout(function(){

        console.log(chalk.blue("WAS | ... DROPBOX UPLOADING"
          + " | " + objSizeMBytes.toFixed(2) + " MB | " 
          + fullPath + " > " + options.destination
        ));

        // const source = fs.createReadStream(fullPath);

        const stats = fs.statSync(fullPath);
        const fileSizeInBytes = stats.size;
        const savedSize = fileSizeInBytes/ONE_MEGABYTE;

        console.log(chalkLog("WAS | ... SAVING DROPBOX JSON"
          + " | " + getTimeStamp()
          + " | " + savedSize.toFixed(2) + " MBYTES"
          + "\n SRC: " + fullPath
          + "\n DST: " + options.destination
          // + " successMetadata\n" + jsonPrint(successMetadata)
          // + " successMetadata\n" + jsonPrint(successMetadata)
        ));

        const drbx = require("@davvo/drbx")({
          token: configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN
        });

        let localReadStream = fs.createReadStream(fullPath);
        let remoteWriteStream = drbx.file(options.destination).createWriteStream();


        let bytesRead = 0;
        let chunksRead = 0;
        let mbytesRead = 0;
        let percentRead = 0;

        localReadStream.pipe(remoteWriteStream);

        localReadStream.on("data", function(chunk){
          bytesRead += chunk.length;
          mbytesRead = bytesRead/ONE_MEGABYTE;
          percentRead = 100 * bytesRead/fileSizeInBytes;
          chunksRead += 1;
          if (chunksRead % 100 === 0){
            console.log(chalkInfo("WAS | LOCAL READ"
              + " | " + mbytesRead.toFixed(2) + " / " + savedSize.toFixed(2) + " MB"
              + " (" + percentRead.toFixed(2) + "%)"
            ));
          }
        });

        localReadStream.on("close", function(){
          console.log(chalkAlert("WAS | LOCAL STREAM READ CLOSED | SOURCE: " + fullPath));
        });

        remoteWriteStream.on("close", function(){
          console.log(chalkAlert("WAS | REMOTE STREAM WRITE CLOSED | DEST: " + options.destination));
        });

        localReadStream.on("end", function(){
          console.log(chalkInfo("WAS | LOCAL READ COMPLETE"
            + " | SOURCE: " + fullPath
            + " | " + mbytesRead.toFixed(2) + " / " + savedSize.toFixed(2) + " MB"
            + " (" + percentRead.toFixed(2) + "%)"
          ));
          localReadStream.close();
        });

        localReadStream.on("error", function(err){
          console.error("WAS | *** LOCAL STREAM READ ERROR | " + err);
          if (callback !== undefined) { return callback(err); }
        });

        remoteWriteStream.on("end", function(){
          console.log(chalkAlert("WAS | REMOTE STREAM WRITE END | DEST: " + options.destination));
          if (callback !== undefined) { return callback(null); }
        });

        remoteWriteStream.on("error", function(err){
          console.error("WAS | *** REMOTE STREAM WRITE ERROR | DEST: " + options.destination + "\n" + err);
          if (callback !== undefined) { return callback(err); }
        });

      }, 5000);

    })
    .catch(function(error){
      console.trace(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + " | ERROR: " + error
        + " | ERROR\n" + jsonPrint(error)
        // + " ERROR\n" + jsonPrint(params)
      ));
      if (callback !== undefined) { return callback(error); }
    });
  }
  else {

    options.contents = JSON.stringify(params.obj, null, 2);
    options.autorename = params.autorename || false;
    options.mode = params.mode || "overwrite";
    options.path = fullPath;

    const dbFileUpload = function () {

      dropboxClient.filesUpload(options)
      .then(function(){
        debug(chalkLog("SAVED DROPBOX JSON | " + options.path));
        if (callback !== undefined) { return callback(null); }
      })
      .catch(function(error){
        if (error.status === 413){
          console.error(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: 413"
            // + " ERROR\n" + jsonPrint(error.error)
          ));
          if (callback !== undefined) { return callback(error.error_summary); }
        }
        else if (error.status === 429){
          console.error(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: TOO MANY WRITES"
            // + " ERROR\n" + "jsonPrint"(error.error)
          ));
          if (callback !== undefined) { return callback(error.error_summary); }
        }
        else if (error.status === 500){
          console.error(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: DROPBOX SERVER ERROR"
            // + " ERROR\n" + jsonPrint(error.error)
          ));
          if (callback !== undefined) { return callback(error.error_summary); }
        }
        else {
          console.trace(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: " + error
            + " | ERROR\n" + jsonPrint(error)
            // + " ERROR\n" + jsonPrint(params)
          ));
          if (callback !== undefined) { return callback(error); }
        }
      });
    };

    if (options.mode === "add") {

      dropboxClient.filesListFolder({path: params.folder, limit: DROPBOX_LIST_FOLDER_LIMIT})
      .then(function(response){

        debug(chalkLog("DROPBOX LIST FOLDER"
          + " | ENTRIES: " + response.entries.length
          + " | CURSOR (trunc): " + response.cursor.substr(-10)
          + " | MORE: " + response.has_more
          + " | PATH:" + options.path
        ));

        let fileExits = false;

        async.each(response.entries, function(entry, cb){

          console.log(chalkInfo("WAS | DROPBOX FILE"
            + " | " + params.folder
            + " | LAST MOD: " + moment(new Date(entry.client_modified)).format(compactDateTimeFormat)
            + " | " + entry.name
          ));

          if (entry.name === params.file) {
            fileExits = true;
          }

          cb();

        }, function(err){
          if (err) {
            console.log(chalkError("WAS | *** ERROR DROPBOX SAVE FILE: " + err));
            if (callback !== undefined) { 
              return(callback(err, null));
            }
            return;
          }
          if (fileExits) {
            console.log(chalk.blue("WAS | ... DROPBOX FILE EXISTS ... SKIP SAVE | " + fullPath));
            if (callback !== undefined) { callback(err, null); }
          }
          else {
            console.log(chalk.blue("WAS | ... DROPBOX DOES NOT FILE EXIST ... SAVING | " + fullPath));
            dbFileUpload();
          }
        });
      })
      .catch(function(err){
        console.log(chalkError("WAS | *** DROPBOX FILES LIST FOLDER ERROR: " + err));
        console.log(chalkError("WAS | *** DROPBOX FILES LIST FOLDER ERROR\n" + jsonPrint(err)));
        if (callback !== undefined) { callback(err, null); }
      });
    }
    else {
      dbFileUpload();
    }
  }
}

let saveFileQueueInterval;
let saveFileBusy = false;

function initSaveFileQueue(cnf){

  console.log(chalkInfo("WAS | INIT DROPBOX SAVE FILE INTERVAL | " + cnf.saveFileQueueInterval + " MS"));

  clearInterval(saveFileQueueInterval);

  saveFileQueueInterval = setInterval(function () {

    if (!saveFileBusy && saveFileQueue.length > 0) {

      saveFileBusy = true;

      const saveFileObj = saveFileQueue.shift();

      saveFile(saveFileObj, function(err){
        if (err) {
          console.log(chalkError("WAS | *** SAVE FILE ERROR ... RETRY | " + saveFileObj.folder + "/" + saveFileObj.file));
          saveFileQueue.push(saveFileObj);
        }
        else {
          console.log(chalkInfo("WAS | SAVED FILE | " + saveFileObj.folder + "/" + saveFileObj.file));
        }
        saveFileBusy = false;
      });
    }

  }, cnf.saveFileQueueInterval);
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

function initDeletedMetricsHashmap(callback){
  loadFile(configFolder, deletedMetricsFile, function deleteMetricFileLoad(err, deletedMetricsObj){
    if (err) {
      if (err.code !== 404) {
        console.error("LOAD DELETED METRICS FILE ERROR\n" + err);
        if (callback !== undefined) { callback(err, null); }
      }
      else {
        if (callback !== undefined) { callback(null, null); }
      }
    }
    else {
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


function killChild(params, callback){

  let pid = false;
  let command;

  if (params.title !== undefined) {
    command = "pkill -f " + params.title;
  }
  else if (params.pid !== undefined) {
    pid = params.pid;
    command = "kill " + pid;
  }
  else if (params.childId !== undefined) {
    if (childrenHashMap[params.childId] === undefined) {
      console.log(chalkError("KILL CHILD ERROR: CHILD NOT IN HM: " + params.childId));
      if (callback !== undefined) { 
        return callback("ERROR: CHILD NOT IN HM: " + params.childId, null);
      }
      else {
        return;
      }
    }
    else {
      pid = childrenHashMap[params.childId].pid;
      command = "kill " + pid;
    }
  }


  shell.exec(command, function(code, stdout, stderr){

    console.log(chalkAlert("KILL CHILD"
      + "\nPARAMS\n " + jsonPrint(params)
      + "\nCOMMAND: " + command
      + "\nCODE:    " + code
      + "\nSTDOUT:  " + stdout
      + "\nSTDERR:  " + stderr
    )); 

    slackPostMessage(
      slackErrorChannel, 
      "\n*KILL CHILD*"
      + "\nPARAMS\n " + jsonPrint(params)
      + "\nCOMMAND: " + command
      + "\nCODE:    " + code
      + "\nSTDOUT:  " + stdout
      + "\nSTDERR:  " + stderr
    );

    if (callback !== undefined) { return callback(stderr, { code: code, stdout: stdout }); }

  });
}


function getChildProcesses(params, callback){

  let command;

  if ((params.searchTerm === undefined) || (params.searchTerm === "ALL")){
    command = "pgrep " + "wa_";
  }
  else {
    command = "pgrep " + params.searchTerm;
  }

  debug(chalkAlert("getChildProcesses | command: " + command));

  let numChildren = 0;
  let childPidArray = [];

  shell.exec(command, {silent: true}, function(code, stdout, stderr){

    if (code === 0) {

      let soArray = stdout.trim();

      let stdoutArray = soArray.split("\n");

      async.eachSeries(stdoutArray, function(pidRaw, cb){

        const pid = pidRaw.trim();

        if (parseInt(pid) > 0) {

          const c = "ps -o command= -p " + pid;

          shell.exec(c, {silent: true}, function(code, stdout, stderr){

            const childId = stdout.trim();

            numChildren += 1;

            console.log(chalk.blue("NNT | FOUND CHILD PROCESS"
              + " | NUM: " + numChildren
              + " | PID: " + pid
              + " | " + childId
            ));

            if (childrenHashMap[childId] === undefined) {

              childrenHashMap[childId] = {};
              childrenHashMap[childId].status = "ZOMBIE";

              console.log(chalkError("NNT | ??? CHILD ZOMBIE ???"
                + " | NUM: " + numChildren
                + " | PID: " + pid
                + " | " + childId
                + " | STATUS: " + childrenHashMap[childId].status
              ));

              killChild({pid: pid}, function(err, numKilled){
                console.log(chalkAlert("NNT | XXX ZOMBIE CHILD KILLED | PID: " + pid + " | CH ID: " + childId));
              });

            }
            else {
              console.log(chalkInfo("NNT | CHILD"
                + " | PID: " + pid
                + " | " + childId
                + " | STATUS: " + childrenHashMap[childId].status
              ));
            }

            childPidArray.push({ pid: pid, childId: childId});

            cb();
          });
        }
        else {
          cb();
        }

      }, function(err){

        if (callback !== undefined) { callback(null, childPidArray); }

      });

    }

    if (code === 1) {
      console.log(chalkInfo("NNT | NO NN CHILD PROCESSES FOUND"));
        if (callback !== undefined) { callback(null, []); }
    }

    if (code > 1) {
      console.log(chalkAlert("SHELL : NNT | ERROR *** KILL CHILD"
        + "\nSHELL :: NNT | COMMAND: " + command
        + "\nSHELL :: NNT | EXIT CODE: " + code
        + "\nSHELL :: NNT | STDOUT\n" + stdout
        + "\nSHELL :: NNT | STDERR\n" + stderr
      ));
      if (callback !== undefined) { callback(stderr, command); }
    }

  });
}


function killAll(callback){

  getChildProcesses({searchTerm: "ALL"}, function(err, childPidArray){

    debug(chalkAlert("getChildProcesses childPidArray\n" + jsonPrint(childPidArray)));

    if (childPidArray && (childPidArray.length > 0)) {

      async.eachSeries(childPidArray, function(childObj, cb){

        killChild({pid: childObj.pid}, function(err, numKilled){
          console.log(chalkAlert("NNT | KILL ALL | KILLED | PID: " + childObj.pid + " | CH ID: " + childObj.childId));
          cb();
        });

      }, function(err){

        if (callback !== undefined) { callback(err, childPidArray); }

      });
    }
    else {

      console.log(chalkAlert("NNT | KILL ALL | NO CHILDREN"));

      if (callback !== undefined) { callback(err, childPidArray); }
    }
  });
}


process.on("exit", function processExit() {
  killAll();
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

configEvents.on("CHILD_ERROR", function childError(childObj){

  console.error(chalkError("CHILD_ERROR"
    + " | " + childObj.childId
    + " | ERROR: " + jsonPrint(childObj.err)
  ));

  // if (childrenHashMap[childObj.childId] === undefined){
  //   childrenHashMap[childObj.childId] = {};
  //   childrenHashMap[childObj.childId].errors = 0;
  //   childrenHashMap[childObj.childId].status = "UNKNOWN";
  // }

  if (childrenHashMap[childObj.childId] !== undefined){
    childrenHashMap[childObj.childId].errors += 1;
    childrenHashMap[childObj.childId].status = "UNKNOWN";
  }


  slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\n" + childObj.childId + "\n" + childObj.err);

  switch(childObj.childId){

    case DEFAULT_TWEET_PARSER_CHILD_ID:

      console.error("KILL TWEET PARSER");

      killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
        initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
      });

    break;

    case DEFAULT_SORTER_CHILD_ID:
      console.log(chalkError("KILL SORTER"));

      killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
        initSorter({childId: DEFAULT_SORTER_CHILD_ID});
      });

    break;

  }
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

function categorizeNode(categorizeObj, callback) {

  if (categorizeObj.twitterUser && categorizeObj.twitterUser.nodeId) {

    let user = authenticatedUserCache.get(categorizeObj.twitterUser.nodeId);

    if (!user 
      && (categorizeObj.twitterUser.nodeId !== "14607119") 
      && (categorizeObj.twitterUser.nodeId !== "848591649575927810")) 
    {
      console.log(chalkAlert("*** AUTH USER NOT IN CACHE\n" + jsonPrint(categorizeObj.twitterUser)));

      if (callback !== undefined) {
        return(callback("AUTH USER NOT IN CACHE", categorizeObj.twitterUser));
      }
      return;
    }
  }

  debug(chalkSocket("categorizeNode" 
    + " | categorizeObj\n" + jsonPrint(categorizeObj)
  ));

  let cObj = {};
  cObj.manual = false;
  cObj.auto = false;

  let nCacheObj;

  switch (categorizeObj.node.nodeType){
    case "user":

      debug(chalkSocket("categorizeNode USER"
        + " | NID: " + categorizeObj.node.nodeId
        + " | @" + categorizeObj.node.screenName
        + " | C: " + categorizeObj.category
      ));

      cObj.manual = categorizeObj.category;

      if (categorizedUserHashMap.has(categorizeObj.node.nodeId)){
        cObj.auto = categorizedUserHashMap.get(categorizeObj.node.nodeId.toLowerCase()).auto || false;
      }

      categorizedHashtagHashMap.set(categorizeObj.node.nodeId.toLowerCase(), cObj);

      nCacheObj = nodeCache.get(categorizeObj.node.nodeId.toLowerCase());

      if (nCacheObj) {
        categorizeObj.node.mentions = Math.max(categorizeObj.node.mentions, nCacheObj.mentions);
      }


      userServerController.updateCategory(
        {user: categorizeObj.node, category: categorizeObj.category}, 
        function(err, updatedUser){

        if (err) {
          console.log(chalkError("*** USER UPDATE CATEGORY ERROR: " + jsonPrint(err)));
          if (callback !== undefined) {
            callback(err, categorizeObj);
          }
        }
        else {

          categorizedUserHashMap.set(updatedUser.nodeId, {manual: updatedUser.category, auto: updatedUser.categoryAuto});

          saveFileQueue.push(
            {
              localFlag: false, 
              folder: categorizedFolder, 
              file: categorizedUsersFile, 
              obj: categorizedUserHashMap.entries()
            });

          const text = "CATEGORIZE"
            + "\n@" + categorizeObj.node.screenName 
            + ": " + categorizeObj.category;

          slackPostMessage(slackChannel, text);

          debug(chalkLog("UPDATE_CATEGORY USER | @" + updatedUser.screenName ));
          if (callback !== undefined) {
            callback(null, updatedUser);
          }
        }
      });
    break;
    case "hashtag":

      debug(chalkSocket("categorizeNode HASHTAG"
        + " | " + categorizeObj.node.nodeId
        + " | " + categorizeObj.category
      ));

      cObj.manual = categorizeObj.category;

      if (categorizedHashtagHashMap.has(categorizeObj.node.nodeId.toLowerCase())){
        cObj.auto = categorizedHashtagHashMap.get(categorizeObj.node.nodeId.toLowerCase()).auto || false;
      }

      categorizedHashtagHashMap.set(categorizeObj.node.nodeId.toLowerCase(), cObj);

      nCacheObj = nodeCache.get(categorizeObj.node.nodeId.toLowerCase());

      if (nCacheObj) {
        categorizeObj.node.mentions = Math.max(categorizeObj.node.mentions, nCacheObj.mentions);
      }

      saveFileQueue.push(
        {
          localFlag: false, 
          folder: categorizedFolder, 
          file: categorizedHashtagsFile, 
          obj: categorizedHashtagHashMap.entries()
        });

      hashtagServerController.updateCategory(
        {hashtag: categorizeObj.node, category: categorizeObj.category}, 
        function(err, updatedHashtag){
        if (err) {
          console.log(chalkError("*** HASHTAG UPDATE CATEGORY ERROR: " + jsonPrint(err)));
          if (callback !== undefined) {
            callback(err, categorizeObj);
          }
        }
        else {

          categorizedHashtagHashMap.set(
            updatedHashtag.nodeId, 
            {manual: updatedHashtag.category, auto: updatedHashtag.categoryAuto});

          const text = "CATEGORIZE"
            + "\n#" + categorizeObj.node.nodeId.toLowerCase() + ": " + categorizeObj.category;

          slackPostMessage(slackChannel, text);

          debug(chalkLog("UPDATE_CATEGORY HASHTAG | #" + updatedHashtag.nodeId ));
          if (callback !== undefined) {
            callback(null, updatedHashtag);
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

  if (tweetRxQueue.length > MAX_Q){

    statsObj.errors.twitter.maxRxQueue += 1;

    if (statsObj.errors.twitter.maxRxQueue % 1000 === 0) {
      console.log(chalkAlert("*** TWEET RX MAX QUEUE [" + tweetRxQueue.length + "]"
        + " | " + getTimeStamp()
        + " | TWP READY: " + tweetParserReady
        + " | TWP SEND READY: " + tweetParserSendReady
        + " | MAX Q EVENTS: " + statsObj.errors.twitter.maxRxQueue
        + " | " + tw.id_str
        + " | " + tw.user.screen_name
      ));
    }
  }
  else if (tw.user) {

    tw.inc = true;

    if (categorizedUserHashMap.has(tw.user.screen_name.toLowerCase())){
      tw.user.category = categorizedUserHashMap.get(tw.user.screen_name.toLowerCase()).manual;
      tw.user.categoryAuto = categorizedUserHashMap.get(tw.user.screen_name.toLowerCase()).auto;
      debug(chalkLog("T< HM HIT"
        + " [ RXQ: " + tweetRxQueue.length + "]"
        + " [ TPQ: " + tweetParserQueue.length + "]"
        + " | C: " + tw.user.category
        + " | " + tw.user.name
        + " | " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }

    tweetRxQueue.push(tw);
    statsObj.queues.tweetRxQueue = tweetRxQueue.length;

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
}

function follow(params, callback) {

  console.log(chalk.blue("+++ FOLLOW | @" + params.user.screenName));

  adminNameSpace.emit("FOLLOW", params.user);
  utilNameSpace.emit("FOLLOW", params.user);

  if (callback !== undefined) { callback(); }
}

function initUnfollowableUserSet(){
  loadFile(dropboxConfigDefaultFolder, unfollowableUserFile, function(err, unfollowableUserSetArray){
    if (err) {
      console.log(chalkAlert("ERROR  INIT UNFOLLOWABLE USERS | " + err));
    }
    else if (unfollowableUserSetArray) {
      unfollowableUserSet = new Set(unfollowableUserSetArray);
      console.log(chalkAlert("INIT UNFOLLOWABLE USERS | " + unfollowableUserSet.size + " USERS"));
    }
  });
}

function unfollow(params, callback) {

  console.log(chalk.blue("+++ UNFOLLOW | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    unfollowableUserSet.add(params.user.nodeId);

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: unfollowableUserFile, 
      obj: [...unfollowableUserSet]
    });

  } 

  adminNameSpace.emit("UNFOLLOW", params.user);
  utilNameSpace.emit("UNFOLLOW", params.user);

  let user = new User(params.user);

  user.following = false;
  user.threeceeFollowing = false;
  user.updateLastSeen = false;

  userServerController.findOneUser(user, {}, function(err, u){
    if (err) {
      console.log(chalkError("UNFOLLOW ERROR: " + err));
    }
    else {
      console.log(chalkAlert("UNFOLLOW USER: @" + user.screenName));
    }

    if (callback !== undefined) { callback(); }
  });

}


function initSocketHandler(socketObj) {

  const socket = socketObj.socket;

  let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  const socketConnectText = "\nSOCKET CONNECT"
    // + " | " + socket.id
    + "\n" + hostname
    + " | " + socketObj.namespace
    + " | " + ipAddress
    + "\nAD: " + statsObj.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | VW: " + statsObj.entity.viewer.connected;

  console.log(chalk.blue("SOCKET CONNECT"
    + " | " + ipAddress
    + " | " + socketObj.namespace
    + " | " + socket.id
    + " | AD: " + statsObj.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | VW: " + statsObj.entity.viewer.connected
  ));

  slackPostMessage(slackChannel, socketConnectText);

  socket.on("reconnect_error", function reconnectError(errorObj) {
    statsObj.socket.errors.reconnect_errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("reconnect_failed", function reconnectFailed(errorObj) {
    statsObj.socket.errors.reconnect_fails += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET RECONNECT FAILED: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_error", function connectError(errorObj) {
    statsObj.socket.errors.connect_errors += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT ERROR: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_timeout", function connectTimeout(errorObj) {
    statsObj.socket.errors.connect_timeouts += 1;
    debug(chalkError(moment().format(compactDateTimeFormat) 
      + " | SOCKET CONNECT TIMEOUT: " + socket.id + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function socketError(error) {

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    statsObj.socket.errors.errors += 1;

    console.log(chalkError(moment().format(compactDateTimeFormat) 
      + " | *** SOCKET ERROR" + " | " + socket.id + " | " + error));

    if (serverHashMap.has(socket.id)) { 

      let currentServer = serverHashMap.get(socket.id);

      currentServer.timeStamp = moment().valueOf();
      currentServer.ip = ipAddress;
      currentServer.status = "ERROR";

      console.error(chalkAlert("SERVER ERROR" 
        + " | " + moment(currentServer.timeStamp).format(compactDateTimeFormat)
        + " | " + currentServer.user.type.toUpperCase()
        + " | " + currentServer.user.nodeId
        + " | " + currentServer.status
        + " | " + currentServer.ip
        + " | " + socket.id
      ));

      serverHashMap.set(socket.id, currentServer);

      adminNameSpace.emit("SERVER_ERROR", currentServer);
    }

    if (viewerHashMap.has(socket.id)) { 

      let currentViewer = viewerHashMap.get(socket.id);

      currentViewer.timeStamp = moment().valueOf();
      currentViewer.ip = ipAddress;
      currentViewer.status = "ERROR";

      console.error(chalkAlert("VIEWER ERROR" 
        + " | " + moment(currentViewer.timeStamp).format(compactDateTimeFormat)
        + " | " + currentViewer.user.type.toUpperCase()
        + " | " + currentViewer.user.nodeId
        + " | " + currentViewer.status
        + " | " + currentViewer.ip
        + " | " + socket.id
      ));

      viewerHashMap.set(socket.id, currentViewer);

      adminNameSpace.emit("VIEWER_ERROR", currentViewer);
    }
  });

  socket.on("reconnect", function socketReconnect() {
    statsObj.socket.reconnects += 1;
    debug(chalkConnect(moment().format(compactDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
  });

  socket.on("disconnect", function socketDisconnect(status) {
    statsObj.socket.disconnects += 1;

    console.log(chalk.blue("SOCKET DISCONNECT"
      + " | " + moment().format(compactDateTimeFormat)
      + " | " + socket.id
    ));

    debug(chalkDisconnect(moment().format(compactDateTimeFormat) 
      + " | SOCKET DISCONNECT: " + socket.id + "\nstatus\n" + jsonPrint(status)
    ));

    if (adminHashMap.has(socket.id)) { 
      console.error(chalkAlert("XXX DELETED ADMIN" 
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + adminHashMap.get(socket.id).user.type.toUpperCase()
        + " | " + adminHashMap.get(socket.id).user.nodeId
        + " | " + socket.id
      ));
      adminNameSpace.emit("ADMIN_DELETE", {socketId: socket.id, nodeId: adminHashMap.get(socket.id).user.nodeId});
      adminHashMap.delete(socket.id);
    }

    if (serverHashMap.has(socket.id)) { 

      let currentServer = serverHashMap.get(socket.id);

      currentServer.status = "DISCONNECTED";

      console.error(chalk.blue("SERVER DISCONNECTED" 
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + currentServer.user.type.toUpperCase()
        + " | " + currentServer.user.nodeId
        + " | " + socket.id
      ));
 
      adminNameSpace.emit("SERVER_DISCONNECT", currentServer);

      serverHashMap.set(socket.id, currentServer);

    }

    if (viewerHashMap.has(socket.id)) { 

      let currentViewer = viewerHashMap.get(socket.id);
      currentViewer.status = "DISCONNECTED";

      console.error(chalk.blue("VIEWER DISCONNECTED" 
        + " | " + moment(currentViewer.timeStamp).format(compactDateTimeFormat)
        + " | " + currentViewer.user.type.toUpperCase()
        + " | " + currentViewer.user.nodeId
        + " | " + currentViewer.ip
        + " | " + socket.id
      ));

      viewerHashMap.set(socket.id, currentViewer);

      adminNameSpace.emit("VIEWER_DISCONNECT", currentViewer);
    }
  });

  socket.on("SESSION_KEEPALIVE", function sessionKeepalive(userObj) {

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    if (statsObj.utilities[userObj.userId] === undefined) {
      statsObj.utilities[userObj.userId] = {};
    }

    statsObj.socket.keepalives += 1;

    if (userObj.stats) {statsObj.utilities[userObj.userId] = userObj.stats;}

    const serverRegex = /^(.+)_/i;

    const currentSessionType = serverRegex.exec(userObj.userId) ? serverRegex.exec(userObj.userId)[1].toUpperCase() : "NULL";

    let sessionObj = {};

    sessionObj.ip = ipAddress;
    sessionObj.socketId = socket.id;
    sessionObj.type = currentSessionType;
    sessionObj.status = "KEEPALIVE";
    sessionObj.timeStamp = moment().valueOf();
    sessionObj.user = userObj;
    sessionObj.isAdmin = false;
    sessionObj.isServer = false;
    sessionObj.isViewer = false;

    switch (currentSessionType) {

      case "ADMIN" :

        sessionObj.isAdmin = true;

        console.log(chalk.blue(currentSessionType 
          + " | " + moment().format(compactDateTimeFormat)
          + " | TYPE: " + userObj.type
          + " | ID: " + userObj.userId
          + " | @" + userObj.screenName
          + " | " + sessionObj.ip
          + " | " + socket.id
        ));

        if (!adminHashMap.has(socket.id)) { 

          console.log(chalkAlert("+++ ADD " + currentSessionType 
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + userObj.userId
            + " | " + sessionObj.ip
            + " | " + socket.id
          ));

          adminNameSpace.emit("ADMIN_ADD", sessionObj);
        }
        else {
          adminNameSpace.emit("KEEPALIVE", sessionObj);
        }

        adminHashMap.set(socket.id, sessionObj);
      break;

      case "TFE" :
      case "TNN" :
      case "TSS" :
      case "TUS" :
      case "LA" :

        sessionObj.isServer = true;

        debug(chalkLog(currentSessionType + " SERVER" 
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + userObj.userId
          + " | " + socket.id
        ));

        sessionObj.socketId = socket.id;
        sessionObj.ip = ipAddress;
        sessionObj.type = currentSessionType;
        sessionObj.timeStamp = moment().valueOf();
        sessionObj.user = userObj;

        if (!serverHashMap.has(socket.id)) { 
          console.log(chalkAlert("+++ ADD " + currentSessionType + " SERVER" 
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + userObj.userId
            + " | " + sessionObj.ip
            + " | " + socket.id
          ));
          adminNameSpace.emit("SERVER_ADD", sessionObj);
        }
        else {
          adminNameSpace.emit("KEEPALIVE", sessionObj);
        }

        serverHashMap.set(socket.id, sessionObj);
      break;

      case "VIEWER" :
        sessionObj.isViewer = true;

        debug(chalkLog(currentSessionType 
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + userObj.userId
          + " | " + socket.id
        ));

        sessionObj.socketId = socket.id;
        sessionObj.ip = ipAddress;
        sessionObj.type = currentSessionType;
        sessionObj.timeStamp = moment().valueOf();
        sessionObj.user = userObj;

        if (!viewerHashMap.has(socket.id)) { 
          console.log(chalkAlert("+++ ADD " + currentSessionType + " SESSION" 
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + userObj.userId
            + " | " + sessionObj.ip
            + " | " + socket.id
          ));
          adminNameSpace.emit("VIEWER_ADD", sessionObj);
        }
        else {
          adminNameSpace.emit("KEEPALIVE", sessionObj);
        }

        viewerHashMap.set(socket.id, sessionObj);

      break;

      default:
        console.log(chalkAlert("**** NOT SERVER ****"
          + " | SESSION TYPE: " + currentSessionType
          + "\n" + jsonPrint(userObj)
        ));
    }
  });

  socket.on("TWITTER_FOLLOW", function twitterFollow(u) {

    console.log(chalkSocket("TWITTER_FOLLOW"
      + " | " + getTimeStamp()
      + " | SID: " + socket.id
      + " | UID: " + u.userId
      + " | @" + u.screenName
    ));

    follow({user: u}, function(err, results){
      if (err) {
        console.log(chalkAlert("TWITTER_FOLLOW ERROR: " + err));
        return;
      }

      console.log(chalk.blue("+++ TWITTER_FOLLOW"
        + " | @" + u.screenName
      ));

    });
  });

  socket.on("TWITTER_UNFOLLOW", function twitterUnfollow(u) {

    console.log(chalkSocket("TWITTER_UNFOLLOW"
      + " | " + getTimeStamp()
      + " | SID: " + socket.id
      + " | UID: " + u.userId
      + " | @" + u.screenName
    ));

    unfollow({user: u}, function(err, results){
      if (err) {
        console.log(chalkAlert("TWITTER_UNFOLLOW ERROR: " + err));
        return;
      }

      console.log(chalk.blue("+++ TWITTER_UNFOLLOW"
        + " | @" + u.screenName
      ));

    });
  });

  socket.on("TWITTER_SEARCH_NODE", function twitterSearchNode(sn) {

    const searchNode = sn.toLowerCase();

    console.log(chalkSocket("TWITTER_SEARCH_NODE"
      + " | " + getTimeStamp()
      + " | SID: " + socket.id
      + " | " + searchNode
    ));

    if (searchNode.startsWith("#")) {

      nodeSearchType = "HASHTAG_UNCATEGORIZED";

      let searchNodeHashtag = { nodeId: searchNode.substring(1) };

      hashtagServerController.findOne({hashtag: searchNodeHashtag}, function(err, hashtag){
        if (err) {
          console.log(chalkError("TWITTER_SEARCH_NODE HASHTAG ERROR\n" + jsonPrint(err)));
        }
        else if (hashtag) { 
          console.log(chalkTwitter("TWITTER_SEARCH_NODE HASHTAG FOUND\n" + jsonPrint(hashtag)));

          socket.emit("SET_TWITTER_HASHTAG", hashtag);

          if (hashtag.category) { 
            let htCatObj = {};
            htCatObj.manual = hashtag.category;
            htCatObj.auto = false;
            if (categorizedHashtagHashMap.has(hashtag.nodeId.toLowerCase())) {
              htCatObj.auto = categorizedHashtagHashMap.get(hashtag.nodeId.toLowerCase()).auto || false ;
            }
            categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), htCatObj);
          }
        }
        else {
          console.log(chalkTwitter("TWITTER_SEARCH_NODE HASHTAG NOT FOUND: #" + searchNodeHashtag.nodeId));
          console.log(chalkTwitter("+++ CREATE NEW HASHTAG: #" + searchNodeHashtag.nodeId));

          new Hashtag({
            nodeId: searchNodeHashtag.nodeId.toLowerCase(), 
            text: searchNodeHashtag.nodeId.toLowerCase()})
          .save(function(err, newHt){
            if (err) {
              console.log(chalkError("ERROR:  SAVE NEW HASHTAG"
                + " | #" + searchNodeHashtag.nodeId.toLowerCase()
                + " | ERROR: " + err
              ));
              return;
            }

            console.log(chalk.blue("+++ SAVED NEW HASHTAG"
              + " | #" + newHt.nodeId
            ));

            socket.emit("SET_TWITTER_HASHTAG", newHt);
          });
        }
    
      });
    }
    else {

      let searchNodeUser;
      let searchQuery = {};

      if (searchNode.startsWith("@")) {

        searchNodeUser = { screenName: searchNode.substring(1) };

        if ((searchNodeUser.screenName === "?") && (nodeSearchBy === "createdAt")) {
          console.log(chalkInfo("SEARCH FOR UNCATEGORIZED USER | CREATED AT"));
          nodeSearchType = "USER_UNCATEGORIZED";
          searchNodeUser = { createdAt: previousUserUncategorizedCreated };
        }
        else if ((searchNodeUser.screenName === "?") && (nodeSearchBy === "lastSeen")) {
          console.log(chalkInfo("SEARCH FOR UNCATEGORIZED USER | LAST SEEN"));
          nodeSearchType = "USER_UNCATEGORIZED";
          searchNodeUser = { lastSeen: previousUserUncategorizedLastSeen };
        }
        else if (searchNodeUser.screenName === "?mm") {
          console.log(chalkInfo("SEARCH FOR MISMATCHED USER"));
          nodeSearchType = "USER_MISMATCHED";
          searchNodeUser = { nodeId: previousUserMismatchedId };
        }
        else {
          console.log(chalkInfo("SEARCH FOR SPECIFIC USER"));
          nodeSearchType = "USER_SPECIFIC";
        }
      }
      else {
        searchNodeUser = { screenName: searchNode };
        nodeSearchType = "USER_SPECIFIC";
      }

      userServerController.findOne(
        {
          nodeSearchType: nodeSearchType,
          nodeSearchBy: nodeSearchBy,
          user: searchNodeUser, 
          fields: fieldsExclude
        }, 
        function(err, user){
          if (err) {
            console.log(chalkError("TWITTER_SEARCH_NODE USER ERROR\n" + jsonPrint(err)));
          }
          else if (user) {

            console.log(chalkTwitter("+++ TWITTER_SEARCH_NODE USER FOUND"
              + " | NODE SEARCH: " + nodeSearchType
              + "\n" + printUser({user:user})
            ));
            
            twit.get("users/show", 
              {user_id: user.nodeId, include_entities: true}, function usersShow (err, rawUser, response){
              if (err) {
                console.log(chalkError("ERROR users/show rawUser | @" + user.screenName + " | " + err));
                if (nodeSearchType === "USER_UNCATEGORIZED") { 
                  if ((nodeSearchBy !== undefined) && (nodeSearchBy === "createdAt")) {
                    previousUserUncategorizedCreated = moment(user.createdAt);
                  }
                  else if ((nodeSearchBy !== undefined) && (nodeSearchBy === "lastSeen")) {
                    previousUserUncategorizedLastSeen = moment(user.lastSeen);
                  }
                  else {
                    previousUserUncategorizedId = user.nodeId;
                  }
                }
                if (nodeSearchType === "USER_MISMATCHED") { previousUserMismatchedId = user.nodeId; }
                socket.emit("SET_TWITTER_USER", user);
              }
              else if (rawUser) {

                userServerController.convertRawUser({user:rawUser}, function(err, cUser){

                  if (err) {
                    console.log(chalkError("*** TWITTER_SEARCH_NODE | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
                    return;
                  }

                  console.log(chalkTwitter("FOUND users/show rawUser"
                    + "\n" + printUser({user:cUser})
                  ));

                  user.followersCount = cUser.followersCount;
                  user.friendsCount = cUser.friendsCount;
                  user.statusesCount = cUser.statusesCount;
                  user.createdAt = cUser.createdAt;
                  user.updateLastSeen = true;
                  user.lastSeen = cUser.status.created_at;

                  let nCacheObj = nodeCache.get(user.nodeId);

                  if (nCacheObj) {
                    user.mentions = Math.max(user.mentions, nCacheObj.mentions);
                    user.setMentions = true;
                  }

                  userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

                    if (err) {
                      console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                      socket.emit("SET_TWITTER_USER", user);
                    }
                    else {

                      console.log(chalk.blue("UPDATED updatedUser"
                        + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
                        + " | USER CR: " + moment(updatedUser.createdAt).format(compactDateTimeFormat)
                        + "\n" + printUser({user:updatedUser})
                      ));

                      if (nodeSearchType === "USER_UNCATEGORIZED") {
                        if ((nodeSearchBy !== undefined) && (nodeSearchBy === "createdAt")) {
                          // previousUserUncategorizedCreated = moment(updatedUser.createdAt);
                        }
                        else if ((nodeSearchBy !== undefined) && (nodeSearchBy === "lastSeen")) {
                          previousUserUncategorizedLastSeen = moment(updatedUser.lastSeen);
                        }
                        else {
                          previousUserUncategorizedId = updatedUser.userId;
                        }
                      }

                      if (nodeSearchType === "USER_MISMATCHED") {
                        previousUserMismatchedId = updatedUser.userId;
                      }

                      socket.emit("SET_TWITTER_USER", updatedUser);
                    }
                  });
                });
              }
              else {
                console.log(chalkTwitter("NOT FOUND users/show data"));
                socket.emit("SET_TWITTER_USER", user);
              }
            });
          }
          else {
            console.log(chalkTwitter("--- TWITTER_SEARCH_NODE USER *NOT* FOUND"
              + "\n" + jsonPrint(searchNodeUser)
            ));

            if (nodeSearchType === "USER_UNCATEGORIZED") {

              if ((nodeSearchBy !== undefined) && (nodeSearchBy === "createdAt")) {
                previousUserUncategorizedCreated = moment();
                return;
              }
              
              if ((nodeSearchBy !== undefined) && (nodeSearchBy === "lastSeen")) {
                previousUserUncategorizedLastSeen = moment();
                return;
              }

              previousUserUncategorizedId = "1";
            }

            let twitQuery;

            if (searchNodeUser.nodeId) {
              twitQuery = {user_id: searchNodeUser.nodeId, include_entities: true};
            }
            else if (searchNodeUser.screenName){
              twitQuery = {screen_name: searchNodeUser.screenName, include_entities: true};
            }

            twit.get("users/show", twitQuery, function usersShow (err, rawUser, response){
              if (err) {
                console.log(chalkError("ERROR users/show rawUser" + err));
                console.log(chalkError("ERROR users/show rawUser\n" + jsonPrint(err)));
                console.log(chalkError("ERROR users/show searchNodeUser:\n" + jsonPrint(searchNodeUser)));
              }
              else if (rawUser) {

                userServerController.convertRawUser({user:rawUser}, function(err, cUser){

                  if (err) {
                    console.log(chalkError("*** TWITTER_SEARCH_NODE | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
                    return;
                  }

                  console.log(chalkTwitter("FOUND users/show rawUser"
                    + "\n" + printUser({user:cUser})
                  ));

                  user.updateLastSeen = true;
                  user.lastSeen = cUser.status.created_at;

                  let nCacheObj = nodeCache.get(cUser.nodeId);

                  if (nCacheObj) {
                    cUser.mentions = Math.max(cUser.mentions, nCacheObj.mentions);
                    cUser.setMentions = true;
                  }

                  userServerController.findOneUser(cUser, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

                    if (err) {
                      console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                      socket.emit("SET_TWITTER_USER", cUser);
                    }
                    else {
                      console.log(chalkTwitter("UPDATED updatedUser"
                        + "\n" + printUser({user:updatedUser})
                      ));
                      socket.emit("SET_TWITTER_USER", updatedUser);
                    }
                  });
                });
              }
              else {
                console.log(chalkTwitter("NOT FOUND users/show data"
                  + " | nodeSearchType: " + nodeSearchType
                  + " | previousUserUncategorizedId: " + previousUserUncategorizedId
                  + " | previousUserMismatchedId: " + previousUserMismatchedId
                  + " | searchNode: " + searchNode
                  + "\nsearchNodeUser\n" + jsonPrint(searchNodeUser)
                ));
              }
            });
          }
        }
      );
    }
  });

  socket.on("TWITTER_CATEGORIZE_NODE", function twitterCategorizeNode(dataObj) {

    if (dataObj.node.nodeType === "user") {
      console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
        + " | " + getTimeStamp()
        + " | SID: " + socket.id
        + " | @" + dataObj.node.screenName
        + " | CAT: " + dataObj.category
      ));
    }
    if (dataObj.node.nodeType === "hashtag") {
      console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
        + " | " + getTimeStamp()
        + " | SID: " + socket.id
        + " | #" + dataObj.node.nodeId
        + " | CAT: " + dataObj.category
      ));
    }

    categorizeNode(dataObj, function(err, updatedNodeObj){
      if (err) {
        console.log(chalkError("CAT NODE ERROR: " + err));
      }
      else if (updatedNodeObj) {
        if (updatedNodeObj.nodeType === "user") {
          socket.emit("SET_TWITTER_USER", updatedNodeObj);
          console.log(chalkSocket("TX> SET_TWITTER_USER"
            + " | " + getTimeStamp()
            + " | SID: " + socket.id
            + "\nNID: " + updatedNodeObj.nodeId
            + " | UID: " + updatedNodeObj.userId
            + " | @" + updatedNodeObj.screenName
            + " | NAME: " + updatedNodeObj.name
            + "\nFLWRs: " + updatedNodeObj.followersCount
            + " | FRNDs: " + updatedNodeObj.friendsCount
            + " | Ms: " + updatedNodeObj.mentions
            + " | Ts: " + updatedNodeObj.statusesCount
            + " | CAT: M: " + updatedNodeObj.category + " | A: " + updatedNodeObj.categoryAuto
          ));
        }
        if (updatedNodeObj.nodeType === "hashtag") {
          socket.emit("SET_TWITTER_HASHTAG", updatedNodeObj);
          console.log(chalkSocket("TX> SET_TWITTER_HASHTAG"
            + " | " + getTimeStamp()
            + " | SID: " + socket.id
            + " | #" + updatedNodeObj.nodeId
            + " | Ms: " + updatedNodeObj.mentions
            + " | CAT: M: " + updatedNodeObj.category + " | A: " + updatedNodeObj.categoryAuto
          ));
        }
      }
    });
  });

  socket.on("USER_READY", function userReady(userObj) {
    console.log(chalkSocket("USER READY"
      + " | " + getTimeStamp()
      + " | " + userObj.userId
      + " | SENT " + moment(parseInt(userObj.timeStamp)).format(compactDateTimeFormat)
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


    userServerController.findOne({user: defaultTwitterUser}, function(err, user){
      if (err) {
        socket.emit("SET_TWITTER_USER", defaultTwitterUser);
      }
      else {
        socket.emit("SET_TWITTER_USER", user);
      }

      socket.emit("VIEWER_READY_ACK", 
        {
          nodeId: viewerObj.viewerId,
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
    authInProgressCache.set(viewerObj.nodeId, viewerObj);
  });
}

function initSocketNamespaces(callback){

  console.log(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT SOCKET NAMESPACES"));

  adminNameSpace = io.of("/admin");
  utilNameSpace = io.of("/util");
  userNameSpace = io.of("/user");
  viewNameSpace = io.of("/view");

  adminNameSpace.on("connect", function adminConnect(socket) {
    console.log(chalk.blue("ADMIN CONNECT " + socket.id));
    statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "admin", socket: socket});
  });

  utilNameSpace.on("connect", function utilConnect(socket) {
    console.log(chalk.blue("UTIL CONNECT " + socket.id));
    statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "util", socket: socket});
  });

  userNameSpace.on("connect", function userConnect(socket) {
    console.log(chalk.blue("USER CONNECT " + socket.id));
    initSocketHandler({namespace: "user", socket: socket});
  });

  viewNameSpace.on("connect", function viewConnect(socket) {
    console.log(chalk.blue("VIEWER CONNECT " + socket.id));
    statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
    initSocketHandler({namespace: "view", socket: socket});
  });

  ioReady = true;

  if (callback !== undefined) { callback(); }
}

function printCat(c){
  if (c === "left") { return "L"; }
  if (c === "neutral") { return "N"; }
  if (c === "right") { return "R"; }
  if (c === "positive") { return "+"; }
  if (c === "negative") { return "-"; }
  if (c === "none") { return "0"; }
  return ".";
}

function processCheckCategory(nodeObj, callback){

  let categorizedNodeHashMap;

  switch (nodeObj.nodeType) {
    case "hashtag":
      categorizedNodeHashMap = categorizedHashtagHashMap;
    break;
    case "user":
      categorizedNodeHashMap = categorizedUserHashMap;
    break;
    case "word":
      categorizedNodeHashMap = categorizedWordHashMap;
    break;
    default:
      return callback("NO CATEGORY HASHMAP: " + nodeObj.nodeType, null);
  }

  if (categorizedNodeHashMap.has(nodeObj.nodeId)) {

    nodeObj.category = categorizedNodeHashMap.get(nodeObj.nodeId).manual;
    nodeObj.categoryAuto = categorizedNodeHashMap.get(nodeObj.nodeId).auto;

    debugCategory(chalk.blue("KW HIT WORD NODEID"
      + " | " + nodeObj.nodeId
      + " | CAT: " + nodeObj.category
      + " | CATA: " + nodeObj.categoryAuto
    ));

    async.parallel({
      overall: function(cb){
        nodesPerMinuteTopTermCache.get(nodeObj.nodeId,
          function topTermNodeId(err, nodeId) {
          if (err){
            console.log(chalkError("nodesPerMinuteTopTermCache GET ERR: " + err));
          }
          if (nodeId !== undefined) {
            debugCategory(chalkLog("TOP TERM WORD NODEID: " + nodeId));
            nodeObj.isTopTerm = true;
          }
          else {
            nodeObj.isTopTerm = false;
          }
        });
        cb();
      },
      nodeType: function(cb){
        nodesPerMinuteTopTermNodeTypeCache[nodeObj.nodeType].get(nodeObj.nodeId,
          function topTermNodeId(err, nodeId) {
          if (err){
            console.log(chalkError("nodesPerMinuteTopTermNodeTypeCache" + nodeObj.nodeType + " GET ERR: " + err));
          }
          if (nodeId !== undefined) {
            debugCategory(chalkLog("TOP TERM NODETYPE " + nodeObj.nodeType + " NODEID: " + nodeId));
            nodeObj.isTopTermNodeType = true;
          }
          else {
            nodeObj.isTopTermNodeType = false;
          }
        });    
        cb();        
      }
    },
    function(err, results){
      callback(null, nodeObj);
    });   
  }
  else {
    callback(null, nodeObj);
  }

}

function checkCategory(nodeObj, callback) {

  debugCategory(chalkLog("checkCategory"
    + " | " + nodeObj.nodeType
    + " | " + nodeObj.nodeId
    + " | CAT: " + nodeObj.category
    + " | CATA: " + nodeObj.categoryAuto
  ));

  switch (nodeObj.nodeType) {

    case "tweet":
    case "emoji":
    case "media":
    case "url":
    case "place":
      callback(null, nodeObj);
    break;

    case "hashtag":
    case "word":
    case "user":
      processCheckCategory(nodeObj, function(err, updatedNodeObj){
        if (err) {
          return callback(err, null);
        }
        callback(null, updatedNodeObj);
      });
    break;

    default:
      console.log(chalk.blue("DEFAULT | checkCategory\n" + jsonPrint(nodeObj)));
      callback(null, nodeObj);
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

function updateNodeMeter(nodeObj, callback){

  const nodeType = nodeObj.nodeType;

  if (!configuration.metrics.nodeMeterEnabled
    || (
      (nodeObj.nodeType !== "user") 
      && (nodeType !== "hashtag") 
      && (nodeType !== "emoji") 
      && (nodeType !== "word") 
      && (nodeType !== "url") 
      && (nodeType !== "media") 
      && (nodeType !== "place"))
    ) 
  {
    callback(null, nodeObj);
    return;
  }

  if (nodeObj.nodeId === undefined) {
    console.log(chalkError("NODE ID UNDEFINED\n" + jsonPrint(nodeObj)));
    callback("NODE ID UNDEFINED", nodeObj);
  }

  let meterNodeId;
  meterNodeId = nodeObj.nodeId;

  if (nodeMeterType[nodeType] === undefined) {
    nodeMeterType[nodeType] = {};
    nodeMeterType[nodeType][meterNodeId] = {};
  }

  if (nodeMeterType[nodeType][meterNodeId] === undefined) {
    nodeMeterType[nodeType][meterNodeId] = {};
  }


  if (ignoreWordHashMap.has(meterNodeId)) {

    debug(chalkLog("updateNodeMeter IGNORE " + meterNodeId));

    nodeObj.isIgnored = true;

    nodeMeter[meterNodeId] = null;
    nodeMeterType[nodeType][meterNodeId] = null;

    delete nodeMeter[meterNodeId];
    delete nodeMeterType[nodeType][meterNodeId];

    if (callback !== undefined) { callback(null, nodeObj); }
  }
  else {
    if (/TSS_/.test(meterNodeId) || nodeObj.isServer){
      debug(chalkLog("updateNodeMeter\n" + jsonPrint(nodeObj)));
      if (callback !== undefined) { callback(null, nodeObj); }
    }
    else if (!nodeMeter[meterNodeId] 
      || (Object.keys(nodeMeter[meterNodeId]).length === 0)
      || (nodeMeter[meterNodeId] === undefined) ){

      nodeMeter[meterNodeId] = null;
      nodeMeterType[nodeType][meterNodeId] = null;

      const newMeter = new Measured.Meter({rateUnit: 60000});
      const newNodeTypeMeter = new Measured.Meter({rateUnit: 60000});

      newMeter.mark();
      newNodeTypeMeter.mark();
      
      nodeObj.rate = parseFloat(newMeter.toJSON()[metricsRate]);
      nodeObj.mentions += 1;

      nodeMeter[meterNodeId] = newMeter;
      nodeMeterType[nodeType][meterNodeId] = newNodeTypeMeter;

      nodeCache.set(meterNodeId, nodeObj);

      statsObj.nodeMeterEntries = Object.keys(nodeMeter).length;

      if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
        statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
        statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
        debug(chalkLog("NEW MAX NODE METER ENTRIES"
          + " | " + moment().format(compactDateTimeFormat)
          + " | " + statsObj.nodeMeterEntries.toFixed(0)
        ));
      }

      if (callback !== undefined) { callback(null, nodeObj); }
    }
    else {

      nodeMeter[meterNodeId].mark();


      if (!nodeMeterType[nodeType][meterNodeId] 
        || (Object.keys(nodeMeterType[nodeType][meterNodeId]).length === 0)
        || (nodeMeterType[nodeType][meterNodeId] === undefined) ){

        const ntMeter = new Measured.Meter({rateUnit: 60000});
        ntMeter.mark();
        nodeMeterType[nodeType][meterNodeId] = ntMeter;
      }
      else {
        nodeMeterType[nodeType][meterNodeId].mark();
      }


      nodeObj.rate = parseFloat(nodeMeter[meterNodeId].toJSON()[metricsRate]);

      let nCacheObj = nodeCache.get(meterNodeId);

      if (nCacheObj) {
        nodeObj.mentions = Math.max(nodeObj.mentions, nCacheObj.mentions);
      }

      nodeObj.mentions += 1;

      nodeCache.set(meterNodeId, nodeObj);

      if (callback !== undefined) { callback(null, nodeObj); }
    }
  }
}

let transmitNodeQueueReady = true;
let transmitNodeQueueInterval;
let transmitNodeQueue = [];

let twitUserShowReady = true;

let startTwitUserShowRateLimitTimeoutDuration = ONE_MINUTE;

function startTwitUserShowRateLimitTimeout(){

  console.log(chalkAlert("TWITTER USER SHOW TIMEOUT START"
    + " | INTERVAL: " + msToTime(startTwitUserShowRateLimitTimeoutDuration)
    + " | " + getTimeStamp()
  ));

  setTimeout(function(){
    console.log(chalkAlert("TWITTER USER SHOW TIMEOUT END"
      + " | INTERVAL: " + msToTime(startTwitUserShowRateLimitTimeoutDuration)
      + " | " + getTimeStamp()
    ));
    twitUserShowReady = true;
  }, startTwitUserShowRateLimitTimeoutDuration);

}

function initFollowableSearchTerms(){
  const termsArray = Array.from(followableSearchTermSet);
  followableSearchTermString = termsArray.join("|");
  followableRegEx = new RegExp(followableSearchTermString, "gi");
  console.log(chalkAlert("followableRegEx: " + followableRegEx));
}

let userFollowable = function(user){

  if (user.nodeType !== "user") { return false; }
  if (user.following !== undefined && user.following) { return false; }
  if (user.category !== undefined && user.category) { return false; }
  if (unfollowableUserSet.has(user.nodeId)) { return false; }

  if ((user.description === undefined) || !user.description) { user.description = ""; }
  if ((user.screenName === undefined) || !user.screenName) { user.screenName = ""; }
  if ((user.name === undefined) || !user.name) { user.name = ""; }

  return followableRegEx.test(user.description)
    || followableRegEx.test(user.screenName) 
    || followableRegEx.test(user.name);
};

function autoFollowUser(params, callback){
  follow({user: params.user}, function(err, results){
    if (err) {
      if (callback !== undefined) { return callback(err, params); }
      return;
    }

    console.log(chalk.blue("+++ AUTO FOLLOW"
      + " | UID: " + params.user.userId
      + " | @" + params.user.screenName
      + " | NAME: " + params.user.name
      + " | FOLLOWING: " + params.user.following
      + " | 3C FOLLOW: " + params.user.threeceeFollowing
      + " | FLWRs: " + params.user.followersCount
      + "\nDESCRIPTION: " + params.user.description
    ));

    const text = "*WAS | AUTO FOLLOW*"
      + "\n@" + params.user.screenName
      + "\nNAME: " + params.user.name
      + "\nID: " + params.user.userId
      + "\nFLWRs: " + params.user.followersCount
      + "\n3C @" + params.user.threeceeFollowing
      + "\nDESC: " + params.user.description;

    slackPostMessage(slackChannelAutoFollow, text);

    if (callback !== undefined) { return callback(null, results); }
  });
}

function initTransmitNodeQueueInterval(interval){

  console.log(chalkLog("INIT TRANSMIT NODE QUEUE INTERVAL: " + interval + " MS"));

  clearInterval(transmitNodeQueueInterval);

  transmitNodeQueueInterval = setInterval(function txNodeQueue () {

    if (transmitNodeQueueReady && (transmitNodeQueue.length > 0)) {

      transmitNodeQueueReady = false;

      let nodeObj = transmitNodeQueue.shift();

      if (!nodeObj) {
        console.error(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q"));
        transmitNodeQueueReady = true;
      }
      else {

        nodeObj.updateLastSeen = true;

        if (!nodeObj.category || (nodeObj.category === undefined)) { nodeObj.category = false; }
        if (!nodeObj.categoryAuto || (nodeObj.categoryAuto === undefined)) { nodeObj.categoryAuto = false; }

        debug(chalkAlert("TX NODE DE-Q"
          + " | NID: " + nodeObj.nodeId
          + " | " + nodeObj.nodeType
          + " | CAT: " + nodeObj.category
          + " | CATA: " + nodeObj.categoryAuto
        ));

        checkCategory(nodeObj, function checkCategoryCallback(err, node){

          if (err) { 
            transmitNodeQueueReady = true;
            return; 
          }

          updateNodeMeter(node, function updateNodeMeterCallback(err, n){

            transmitNodeQueueReady = true;

            if (err) {
              console.log(chalkError("ERROR updateNodeMeter: " + err
                + " | TYPE: " + node.nodeType
                + " | NID: " + node.nodeId
              ));
              viewNameSpace.volatile.emit("node", node);
            }
            else {

              const followable = userFollowable(n);

              if (twitUserShowReady && followable){

                unfollowableUserSet.add(n.nodeId);

                twitAutoFollow.get("users/show", 
                  {user_id: n.nodeId, include_entities: true}, 
                  function usersShow (err, rawUser, response){

                  if (err) {
                    twitUserShowReady = false;
                    unfollowableUserSet.delete(n.nodeId);
                    startTwitUserShowRateLimitTimeout();
                    startTwitUserShowRateLimitTimeoutDuration *= 1.5;
                    if (startTwitUserShowRateLimitTimeoutDuration > 15*ONE_MINUTE) {
                      startTwitUserShowRateLimitTimeoutDuration = 15*ONE_MINUTE;
                    }
                    console.log(chalkError("ERROR users/show rawUser: " + err));
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else if (rawUser && (rawUser.followers_count >= configuration.minFollowersAuto)) {

                    startTwitUserShowRateLimitTimeoutDuration = ONE_MINUTE;

                    debug(chalkTwitter("FOUND users/show rawUser" + jsonPrint(rawUser)));

                    n.isTwitterUser = true;
                    n.name = rawUser.name;
                    n.createdAt = rawUser.created_at;
                    n.screenName = rawUser.screen_name.toLowerCase();
                    n.screenNameLower = rawUser.screen_name.toLowerCase();
                    n.url = rawUser.url;
                    n.profileUrl = "http://twitter.com/" + rawUser.screen_name;
                    n.profileImageUrl = rawUser.profile_image_url;
                    n.bannerImageUrl = rawUser.profile_banner_url;
                    n.verified = rawUser.verified;
                    n.following = true;
                    n.threeceeFollowing = "altthreecee02";
                    n.description = rawUser.description;
                    n.lastTweetId = (rawUser.status !== undefined) ? rawUser.status.id_str : null;
                    n.statusesCount = rawUser.statuses_count;
                    n.friendsCount = rawUser.friends_count;
                    n.followersCount = rawUser.followers_count;
                    n.status = rawUser.status;
                    n.lastSeen = rawUser.status.created_at;
                    n.updateLastSeen = true;

                    let nCacheObj = nodeCache.get(n.nodeId);

                    if (nCacheObj) {
                      n.mentions = Math.max(n.mentions, nCacheObj.mentions);
                      n.setMentions = true;
                    }

                    userServerController.findOneUser(n, {noInc: false, fields: fieldsExclude}, function(err, updatedUser){
                      if (err) {
                        console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                        viewNameSpace.volatile.emit("node", n);
                      }
                      else {
                        viewNameSpace.volatile.emit("node", updatedUser);
                        autoFollowUser({threeceeUser: "altthreecee02", user: updatedUser});
                      }
                    });
                  }
                  else {
                    viewNameSpace.volatile.emit("node", n);
                  }
                });
              }
              else if ((n.nodeType === "user") && n.category){

                let nCacheObj = nodeCache.get(n.nodeId);

                if (nCacheObj) {
                  n.mentions = Math.max(n.mentions, nCacheObj.mentions);
                  n.setMentions = true;
                }

                n.updateLastSeen = true;

                userServerController.findOneUser(n, {noInc: false, fields: fieldsExclude}, function(err, updatedUser){
                  if (err) {
                    console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else {
                    viewNameSpace.volatile.emit("node", updatedUser);
                  }
                });
              }
              else if (n.nodeType === "user") {
                viewNameSpace.volatile.emit("node", n);
              }

              if ((n.nodeType === "hashtag") && n.category){

                n.updateLastSeen = true;

                hashtagServerController.findOneHashtag(n, {noInc: false}, function(err, updatedHashtag){
                  if (err) {
                    console.log(chalkError("updatedHashtag ERROR\n" + jsonPrint(err)));
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else if (updatedHashtag) {
                    viewNameSpace.volatile.emit("node", updatedHashtag);
                  }
                  else {
                    viewNameSpace.volatile.emit("node", n);
                  }
                });
              }
              else if (n.nodeType === "hashtag") {
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "emoji"){
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "media"){
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "place"){
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "word"){
                viewNameSpace.volatile.emit("node", n);
              }
            }

          });
        });
      }

    }
  }, interval);
}

function transmitNodes(tw, callback){
  debug("TX NODES");

  if (tw.user) {transmitNodeQueue.push(tw.user);}
  if (tw.place && configuration.enableTransmitPlace) {transmitNodeQueue.push(tw.place);}

  tw.userMentions.forEach(function userMentionsTxNodeQueue(user){
    if (user && configuration.enableTransmitUser) {transmitNodeQueue.push(user);}
  });

  tw.hashtags.forEach(function hashtagsTxNodeQueue(hashtag){
    if (hashtag && configuration.enableTransmitHashtag) {transmitNodeQueue.push(hashtag);}
  });

  tw.media.forEach(function mediaTxNodeQueue(media){
    if (media && configuration.enableTransmitMedia) {transmitNodeQueue.push(media);}
  });

  tw.emoji.forEach(function emojiTxNodeQueue(emoji){
    if (emoji && configuration.enableTransmitEmoji) {transmitNodeQueue.push(emoji);}
  });

  tw.urls.forEach(function urlTxNodeQueue(url){
    if (url && configuration.enableTransmitUrl) {transmitNodeQueue.push(url);}
  });

  tw.words.forEach(function wordsTxNodeQueue(word){
    // if (word && !ignoreWordHashMap.has(word.nodeId)) { transmitNodeQueue.push(word); }
    if (word && configuration.enableTransmitWord && categorizedWordHashMap.has(word.nodeId)) { 
      transmitNodeQueue.push(word); 
    }
  });


  callback();
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
    + " | " + moment().format(compactDateTimeFormat) 
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
    statsObj.socket.errors.httpServer_errors += 1;
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

  let heartbeatObj = {};

  heartbeatObj.servers = [];
  heartbeatObj.viewers = [];
  heartbeatObj.children = {};
  heartbeatObj.children.childrenHashMap = {};

  heartbeatObj.twitter = {};
  heartbeatObj.memory = {};

  setInterval(function hearbeatInterval() {

    statsObj.serverTime = moment().valueOf();
    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
    statsObj.timeStamp = moment().format(compactDateTimeFormat);
    statsObj.upTime = os.uptime() * 1000;
    statsObj.memory.memoryTotal = os.totalmem();
    statsObj.memory.memoryAvailable = os.freemem();
    statsObj.memory.memoryUsage = process.memoryUsage();

    const tempArray = serverHashMap.entries();
    heartbeatObj.servers = tempArray;

    const tempViewerArray = viewerHashMap.entries();
    heartbeatObj.viewers = tempViewerArray;

    statsObj.twitter.tweetsPerMin = parseInt(tweetMeter.toJSON()[metricsRate]);

    if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin){
      statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
      statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
    }

    if (internetReady && ioReady) {
      statsObj.configuration = configuration;

      heartbeatObj.serverTime = statsObj.serverTime;
      heartbeatObj.startTime = statsObj.startTime;
      heartbeatObj.runTime = statsObj.runTime;
      heartbeatObj.upTime = statsObj.upTime;
      heartbeatObj.elapsed = statsObj.elapsed;

      heartbeatObj.memory = statsObj.memory;

      heartbeatObj.nodesPerMin = statsObj.nodesPerMin;
      heartbeatObj.maxNodesPerMin = statsObj.maxNodesPerMin;

      heartbeatObj.twitter.tweetsPerMin = statsObj.twitter.tweetsPerMin;
      heartbeatObj.twitter.maxTweetsPerMin = statsObj.twitter.maxTweetsPerMin;
      heartbeatObj.twitter.maxTweetsPerMinTime = statsObj.twitter.maxTweetsPerMinTime;

      utilNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
      adminNameSpace.emit("HEARTBEAT", heartbeatObj);
      userNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
      viewNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);

      heartbeatsSent += 1;
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

function initAppRouting(callback) {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INIT APP ROUTING"));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  // app.use(session({
  //   secret: "my_precious",
  //   resave: false,
  //   store: new MongoDBStore({ mongooseConnection: dbConnection }),
  //   // store: new MongoDBStore({ "db": "sessions" }),
  //   saveUninitialized: true,
  //   cookie: { 
  //     secure: false,
  //     maxAge: MAX_SESSION_AGE
  //    }
  // }));
  // app.use(passport.initialize());
  // app.use(passport.session());
  app.use(exp.static(__dirname + "/public"));

  app.use(function requestLog(req, res, next) {

    console.log(chalkLog("R>"
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

        if (err) {
          next();
        }
        else if (response && (response.entries.length > 0)) {

          utilNameSpace.emit("DROPBOX_CHANGE", response);
          adminNameSpace.emit("DROPBOX_CHANGE", response);

          console.log(chalkLog(">>> DROPBOX CHANGE"
            + " | " + getTimeStamp()
            + " | FOLDER: " + bestNetworkFolder
          ));
          
          response.entries.forEach(function(entry){
            console.log(chalkLog(">>> DROPBOX CHANGE | ENTRY"
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
      console.log(chalkLog("R> REDIRECT /session")); 
      res.redirect("/session");
    }
    else if (req.path === "/categorize"){
      console.log(chalkLog("R> CATEGORIZE"
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
  passport.serializeUser(function(nodeId, done) {
    debug(chalkAlert("SERIALIZE USER: " + nodeId));
    done(null, nodeId);
  });

  passport.deserializeUser(function(userObj, done) {

    debug(chalkAlert("DESERIALIZE USER: @" + userObj.screenName));

    userServerController.findOne({ user: userObj}, function(err, user){

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
    console.log(chalkLog("LOADING PAGE"
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
    console.log(chalkLog("LOADING PAGE"
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
  }

  app.get("/account", ensureAuthenticated, function(req, res){

    debug(chalkError("PASSPORT TWITTER AUTH USER\n" + jsonPrint(req.session.passport.user)));  // handle errors
    console.log(chalkError("PASSPORT TWITTER AUTH USER"
      // + " | SID: " + util.inspect(req, {showHidden:false, depth:1})
      + " | @" + req.session.passport.user.screenName
      + " | UID" + req.session.passport.user.nodeId
    ));  // handle errors

    slackPostMessage(slackChannel, "PASSPORT TWITTER AUTH USER: @" + req.session.passport.user.screenName);

    userServerController.findOne({ user: req.session.passport.user}, function(err, user) {
      if(err) {
        console.log(chalkError("*** ERROR TWITTER AUTHENTICATION: " + jsonPrint(err)));  // handle errors
        res.redirect("/504.html");
      } 
      else {
        console.log(chalkAlert("TWITTER USER AUTHENTICATED: @" + user.screenName));  // handle errors
        slackPostMessage(slackChannel, "USER AUTH: @" + user.screenName);
        authenticatedUserCache.set(user.nodeId, user);
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

  statsObj.socket.testClient = {};
  statsObj.socket.testClient.errors = 0;

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
      statsObj.socket.testClient.errors += 1;
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

  tweetParserSendReady = true;

  console.log(chalkLog("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

    if ((tweetRxQueue.length > 0) && tweetParserReady && tweetParserSendReady) {

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

      childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({ op: "tweet", tweetStatus: tweet }, function sendTweetParser(err){

        if (err) {
          console.error(chalkError("*** TWEET PARSER SEND ERROR"
            + " | " + err
          ));

          if (quitOnError) {
            quit("TWEET PARSER SEND ERROR");
          }
          tweetParserSendReady = false;

          childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].status = "ERROR";
        }
        else {
          tweetParserSendReady = true;
          childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].status = "RUNNING";
        }
      });

    }
  }, interval);
}

function initHashtagLookupQueueInterval(interval){

  let hashtagLookupQueueReady = true;

  console.log(chalkLog("INIT HASHTAG LOOKUP QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(hashtagLookupQueueInterval);

  hashtagLookupQueueInterval = setInterval(function hashtagLookupQueueDeQ() {

    if ((hashtagLookupQueue.length > 0) && hashtagLookupQueueReady) {

      hashtagLookupQueueReady = false;

      const htObj = hashtagLookupQueue.shift();

      let categoryObj = {};

      hashtagServerController.findOne({hashtag: htObj}, function(err, hashtag){
        if (err) {
          console.log(chalkError("HASHTAG FIND ONE ERROR\n" + jsonPrint(err)));
        }
        else if (hashtag) { 

          categoryObj.manual = hashtag.category || false;
          categoryObj.auto = hashtag.categoryAuto || false;

          categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), categoryObj); 

          debug(chalkTwitter("+++ HT HIT "
            + " | CM: " + printCat(hashtag.category)
            + " | CA: " + printCat(hashtag.categoryAuto)
            + " | #" + hashtag.nodeId.toLowerCase()
          ));
        }
        else {
          // debug(chalkTwitter("HASHTAG NOT FOUND: " + htObj.text));
          debug(chalkTwitter("--- HT MISS"
            + " | CM: " + printCat(htObj.category)
            + " | CA: " + printCat(htObj.categoryAuto)
            + " | #" + htObj.nodeId.toLowerCase()
          ));
        }
        hashtagLookupQueueReady = true;
      });

    }
  }, interval);
}


function findChildByPid(pid, callback){

  let foundChildId = false;

  async.each(Object.keys(childrenHashMap), function(childId, cb){

    if (pid && (childrenHashMap[childId].pid === pid)){

      foundChildId = childId;

      cb(foundChildId);

    }
    else {
      cb();
    }

  }, function(result){
    callback(null, foundChildId);
  });
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
            + " [ TPMRQ: " + tweetParserMessageRxQueue.length + "]"
            + " | " + tweetObj.tweetId
            + " | USR: " + tweetObj.user.screenName
            + " | Hs: " + tweetObj.hashtags.length
            + " | UMs: " + tweetObj.userMentions.length
            + " | EJs: " + tweetObj.emoji.length
            + " | WDs: " + tweetObj.words.length
          ));

          if (transmitNodeQueue.length < MAX_Q) {

            transmitNodes(tweetObj, function transmitNode(err){
              if (err) {
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

const sortedObjectValues = function(params) {

  return new Promise(function(resolve, reject) {

    const keys = Object.keys(params.obj);

    const sortedKeys = keys.sort(function(a,b){
      const objA = params.obj[a];
      const objB = params.obj[b];
      return objB[params.sortKey] - objA[params.sortKey];
    });

    if (keys.length !== undefined) {
      resolve({nodeType: params.nodeType, sortKey: params.sortKey, sortedKeys: sortedKeys.slice(0,params.max)});
    }
    else {
      reject(new Error("ERROR: sortedObjectValues | params:\n" + jsonPrint(params)));
    }

  });
};



function initSorterMessageRxQueueInterval(interval){

  console.log(chalkLog("INIT SORTER RX MESSAGE QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(sorterMessageRxQueueInterval);

  let sortedKeys;
  let endIndex;
  let nodeId;
  let nodeRate;
  let sorterObj;
  let nodeType;

  sorterMessageRxQueueInterval = setInterval(function sorterMessageRxQueueDequeue() {

    if (sorterMessageRxReady && (sorterMessageRxQueue.length > 0)) {

      sorterMessageRxReady = false;

      sorterObj = sorterMessageRxQueue.shift();

      nodeType = sorterObj.nodeType;

      switch (sorterObj.op){

        case "SORTED":

          debug(chalkLog("SORT ---------------------"));

          sortedKeys = sorterObj.sortedKeys;
          endIndex = Math.min(configuration.maxTopTerms, sortedKeys.length);

          async.times(endIndex, function(index, next) {

            nodeId = sortedKeys[index].toLowerCase();

            if ((nodeType === undefined) || (nodeType === "overall")) {
              if (nodeMeter[nodeId]) {
                nodeRate = parseFloat(nodeMeter[nodeId].toJSON()[metricsRate]);
                nodesPerMinuteTopTermCache.set(nodeId, nodeRate);
              }
            }
            else {
              if (nodeMeterType[nodeType][nodeId]) {
                nodeRate = parseFloat(nodeMeterType[nodeType][nodeId].toJSON()[metricsRate]);
                nodesPerMinuteTopTermNodeTypeCache[nodeType].set(nodeId, nodeRate);
              }
            }
            next();

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

function keySort(params, callback){

  debug(chalkLog("KEY SORT"
    + " | KEYS: " + Object.keys(params.obj).length
  ));

  sortedObjectValues(params)
  .then(function(results){
    callback(null, results);
  })
  .catch(function(err){
    callback(err, params);
  });

}

let keySortInterval;
let keySortReady = true;

function initKeySortInterval(interval){

  clearInterval(keySortInterval);

  keySortReady = true;

  keySortInterval = setInterval(function(){

    if (keySortQueue.length > 0) {

      keySortReady = false;

      const keySortParams = keySortQueue.shift();

      keySort(keySortParams, function(err, results){

        keySortReady = true;

        if (err) {
          console.log(chalkError("KEY SORT ERROR: " + err));
        }
        else {

          sorterMessageRxQueue.push(
            { op: "SORTED", 
              nodeType: results.nodeType, 
              sortKey: results.sortKey, 
              sortedKeys: results.sortedKeys
            }
          );
        }

      });
    }


  }, interval);

}

function initSorterPingInterval(interval){

  clearInterval(sorterPingInterval);
  sorterPongReceived = false;

  pingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_SORTER_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_SORTER_CHILD_ID].child) {

    childrenHashMap[DEFAULT_SORTER_CHILD_ID].child.send({op: "PING", pingId: pingId}, function(err){
      if (err) {
        console.log(chalkError("*** SORTER SEND PING ERROR: " + err));
        killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
          initSorter({childId: DEFAULT_SORTER_CHILD_ID});
        });
      }
      console.log(chalkInfo(">PING | SORTER | PING ID: " + pingId));
    });

    sorterPingInterval = setInterval(function(){

      if (sorterPongReceived) {

        pingId = moment().valueOf();

        sorterPongReceived = false;

        childrenHashMap[DEFAULT_SORTER_CHILD_ID].child.send({op: "PING", pingId: pingId}, function(err){
          if (err) {
            console.log(chalkError("*** SORTER SEND PING ERROR: " + err));
            killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
              initSorter({childId: DEFAULT_SORTER_CHILD_ID});
            });
          }
          debug(chalkInfo(">PING | SORTER | PING ID: " + moment(pingId).format(compactDateTimeFormat)));
        });

      }
      else {

        console.log(chalkAlert("*** PONG TIMEOUT | SORTER | PING ID: " + pingId));
        
        slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\nSORTER\nPONG TIMEOUT");

        clearInterval(sorterPingInterval);

        setTimeout(function(){

          killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
            initSorter({childId: DEFAULT_SORTER_CHILD_ID});
          });

        }, 5000);
      }
    }, interval);

  }
}


function initSorter(params, callback){

  const s = cp.fork(`${__dirname}/js/libs/sorter.js`);

  childrenHashMap[params.childId] = {};
  childrenHashMap[params.childId].child = s;
  childrenHashMap[params.childId].pid = s.pid;
  childrenHashMap[params.childId].childId = params.childId;
  childrenHashMap[params.childId].title = "wa_node_sorter";
  childrenHashMap[params.childId].status = "NEW";
  childrenHashMap[params.childId].errors = 0;


  childrenHashMap[params.childId].child.on("message", function sorterMessageRx(m){

    debug(chalkLog("SORTER RX"
      + " | " + m.op
    ));

    if (m.op === "ERROR"){
      console.log(chalkError("*** SORTER ERROR: " + m.message));
      childrenHashMap[params.childId].status = "ERROR";
    }
    else if (m.op === "PONG"){
      sorterPongReceived = m.pongId;
      childrenHashMap[params.childId].status = "RUNNING";
      debug(chalkInfo("<PONG | SORTER | PONG ID: " + moment(m.pongId).format(compactDateTimeFormat)));
    }
    else {
      sorterMessageRxQueue.push(m);
    }

  });

  childrenHashMap[params.childId].child.send({
    op: "INIT",
    childId: params.childId,
    title: "wa_node_sorter",
    interval: DEFAULT_INTERVAL
  }, function sorterMessageRxError(err){
    if (err) {
      console.error(chalkError("*** SORTER SEND ERROR"
        + " | " + err
      ));
      childrenHashMap[params.childId].status = "ERROR";
      configEvents.emit("CHILD_ERROR", { childId: params.childId, err: "SORTER SEND ERROR" });
    }
    else {
      childrenHashMap[params.childId].status = "INIT";
    }

  });

  childrenHashMap[params.childId].child.on("error", function sorterError(err){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER ERROR ***"
      + " \n" + jsonPrint(err)
    ));
    childrenHashMap[params.childId].status = "ERROR";
    configEvents.emit("CHILD_ERROR", { childId: params.childId, err: err });
  });

  childrenHashMap[params.childId].child.on("exit", function sorterExit(code, signal){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER EXIT ***"
      + " | PID: " + childrenHashMap[params.childId].child.pid
      + " | EXIT CODE: " + code
      + " | EXIT SIGNAL: " + signal
    ));
    childrenHashMap[params.childId].status = "EXIT";

    if (code > 0) { configEvents.emit("CHILD_ERROR", { childId: params.childId, err: "SORTER EXIT" }); }
  });

  childrenHashMap[params.childId].child.on("close", function sorterClose(code, signal){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** SORTER CLOSE ***"
      + " | PID: " + childrenHashMap[params.childId].child.pid
      + " | EXIT CODE: " + code
      + " | EXIT SIGNAL: " + signal
    ));

    childrenHashMap[params.childId].status = "CLOSE";

    if (code > 0) { configEvents.emit("CHILD_ERROR", { childId: params.childId, err: "SORTER CLOSE" }); }
  });


  setTimeout(function(){
    initSorterPingInterval(DEFAULT_PING_INTERVAL);
  }, 1000);

  if (callback !== undefined) { callback(null, s); }
}



function initTweetParser(params, callback){

  tweetParserReady = false;

  const twp = cp.fork(`${__dirname}/js/libs/tweetParser.js`);

  childrenHashMap[params.childId] = {};
  childrenHashMap[params.childId].pid = twp.pid;
  childrenHashMap[params.childId].childId = params.childId;
  childrenHashMap[params.childId].title = "wa_node_tweetParser";
  childrenHashMap[params.childId].status = "NEW";
  childrenHashMap[params.childId].errors = 0;

  twp.on("message", function tweetParserMessageRx(m){

    childrenHashMap[params.childId].status = "RUNNING";  

    debug(chalkLog("TWEET PARSER RX MESSAGE"
      + " | OP: " + m.op
    ));
    if (tweetParserMessageRxQueue.length < MAX_Q){
      tweetParserMessageRxQueue.push(m);
    }
  });

  twp.on("error", function tweetParserError(err){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER ERROR ***"
      + " \n" + jsonPrint(err)
    ));
    tweetParserSendReady = false;
    tweetParserReady = false;
    childrenHashMap[params.childId].status = "ERROR";
  });

  twp.on("exit", function tweetParserExit(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER EXIT ***"
      + " | EXIT CODE: " + code
    ));
    tweetParserSendReady = false;
    tweetParserReady = false;
    childrenHashMap[params.childId].status = "EXIT";
  });

  twp.on("close", function tweetParserClose(code){
    console.error(chalkError(moment().format(compactDateTimeFormat)
      + " | *** TWEET PARSER CLOSE ***"
      + " | EXIT CODE: " + code
    ));
    tweetParserSendReady = false;
    tweetParserReady = false;
    childrenHashMap[params.childId].status = "CLOSE";
  });

  childrenHashMap[params.childId].child = twp;

  tweetParserReady = true;

  twp.send({
    op: "INIT",
    title: "wa_node_tweetParser",
    networkObj: bestNetworkObj,
    maxInputHashMap: maxInputHashMap,
    normalization: normalization,
    interval: TWEET_PARSER_INTERVAL
  }, function tweetParserMessageRxError(err){
    if (err) {
      console.error(chalkError("*** TWEET PARSER SEND ERROR"
        + " | " + err
      ));
      tweetParserSendReady = false;
      tweetParserReady = false;
      childrenHashMap[params.childId].status = "ERROR";
    }
    else {
      tweetParserSendReady = true;
      tweetParserReady = true;
      childrenHashMap[params.childId].status = "INIT";
    }
  });

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
          ));

          metricsHashmap.set(descriptorName, descriptor.name);
        }
        cb();
      }, function metricsHashmapSetComplete() {
        console.log(chalkLog("METRICS: "
          + " | TOTAL: " + descriptors.length
          + " | CUSTOM: " + metricsHashmap.count()
        ));
      });
    })
    .catch(function metricsHashmapSetError(err){
      if (err.code !== 8) {
        console.log(chalkError("*** ERROR GOOGLE METRICS"
          + " | ERR CODE: " + err.code
          + " | META DATA: " + err.metadata
          + " | META NODE: " + err.note
        ));
        console.log(chalkError(err));
      }
    });
}

let cacheObj = {};
cacheObj.nodeCache = nodeCache;
cacheObj.nodesPerMinuteTopTermCache = nodesPerMinuteTopTermCache;
cacheObj.nodesPerMinuteTopTermNodeTypeCache = {};
cacheObj.trendingCache = trendingCache;

DEFAULT_NODE_TYPES.forEach(function(nodeType){
  cacheObj.nodesPerMinuteTopTermNodeTypeCache[nodeType] = nodesPerMinuteTopTermNodeTypeCache[nodeType];
});

let cacheObjKeys;

function initRateQinterval(interval){

  if (GOOGLE_METRICS_ENABLED) {
    googleMonitoringClient = Monitoring.metricServiceClient();
    getCustomMetrics();
  }

  console.log(chalkLog("INIT RATE QUEUE INTERVAL | " + interval + " MS"));

  if (GOOGLE_METRICS_ENABLED) { console.log(chalkAlert("*** GOOGLE METRICS ENABLED ***")); }
  
  clearInterval(updateMetricsInterval);

  statsObj.nodesPerMin = 0.0;
  statsObj.nodesPerSec = 0.0;
  statsObj.maxNodesPerMin = 0.0;

  statsObj.twitter.tweetsPerMin = 0.0;
  statsObj.twitter.maxTweetsPerMin = 0.0;
  statsObj.twitter.maxTweetsPerMinTime = 0;

  statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
  statsObj.queues.tweetRxQueue = tweetRxQueue.length;
  statsObj.queues.sorterMessageRxQueue = {};
  statsObj.queues.sorterMessageRxQueue.ready = sorterMessageRxReady;
  statsObj.queues.sorterMessageRxQueue.length = sorterMessageRxQueue.length;
  statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.length;

  cacheObjKeys.forEach(function statsCachesUpdate(cacheName){
    if (cacheName === "nodesPerMinuteTopTermNodeTypeCache") {
      DEFAULT_NODE_TYPES.forEach(function(nodeType){
        statsObj.caches[cacheName][nodeType].stats.keys = cacheObj[cacheName][nodeType].getStats().keys;

        if (statsObj.caches[cacheName][nodeType].stats.keys > statsObj.caches[cacheName][nodeType].stats.keysMax) {
          statsObj.caches[cacheName][nodeType].stats.keysMax = statsObj.caches[cacheName][nodeType].stats.keys;
          statsObj.caches[cacheName][nodeType].stats.keysMaxTime = moment().valueOf();
          console.log(chalkInfo("MAX"
            + " | " + cacheName + " - " + nodeType
            + " | Ks: " + statsObj.caches[cacheName][nodeType].stats.keys
          ));
        }
      });
    }
    else {

      statsObj.caches[cacheName].stats.keys = cacheObj[cacheName].getStats().keys;

      if (statsObj.caches[cacheName].stats.keys > statsObj.caches[cacheName].stats.keysMax) {
        statsObj.caches[cacheName].stats.keysMax = statsObj.caches[cacheName].stats.keys;
        statsObj.caches[cacheName].stats.keysMaxTime = moment().valueOf();
        console.log(chalkInfo("MAX"
          + " | " + cacheName
          + " | Ks: " + statsObj.caches[cacheName].stats.keys
        ));
      }
    }

  });

  if (adminNameSpace) {
    statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    if (statsObj.admin.connected > statsObj.admin.connectedMax) {
      statsObj.admin.connectedMaxTime = moment().valueOf();
      statsObj.admin.connectedMax = statsObj.admin.connected;
      console.log(chalkInfo("MAX ADMINS"
       + " | " + statsObj.admin.connected
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

  let updateTimeSeriesCount = 0;

  updateMetricsInterval = setInterval(function updateMetrics () {

    statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
    statsObj.queues.tweetRxQueue = tweetRxQueue.length;
    statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.length;
    statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.length;

    updateTimeSeriesCount += 1;

    if (updateTimeSeriesCount % RATE_QUEUE_INTERVAL_MODULO === 0){


      DEFAULT_NODE_TYPES.forEach(function(nodeType){

        let paramsSorter = {};
        paramsSorter.op = "SORT";
        paramsSorter.nodeType = nodeType;
        paramsSorter.sortKey = metricsRate;
        paramsSorter.max = configuration.maxTopTerms;
        paramsSorter.obj = {};

        async.each(Object.keys(nodeMeterType[nodeType]), function sorterParams(meterId, cb){

          if (!nodeMeterType[nodeType][meterId]) {
            console.error(chalkError("*** ERROR NULL nodeMeterType[" + nodeType + "]: " + meterId));
          }

          paramsSorter.obj[meterId] = pick(nodeMeterType[nodeType][meterId].toJSON(), paramsSorter.sortKey);

          cb();

        }, function(err){

          if (err) {
            console.error(chalkError("ERROR RATE QUEUE INTERVAL\n" + err ));
          }

          keySortQueue.push(paramsSorter);

          // if ((childrenHashMap[DEFAULT_SORTER_CHILD_ID] !== undefined) 
          //   && (childrenHashMap[DEFAULT_SORTER_CHILD_ID].child !== undefined)) {

          //   childrenHashMap[DEFAULT_SORTER_CHILD_ID].child.send(paramsSorter, function sendSorterError(err){
          //     if (err) {
          //       console.error(chalkError("SORTER SEND ERROR"
          //         + " | " + err
          //       ));
          //       childrenHashMap[DEFAULT_SORTER_CHILD_ID].status = "ERROR";
          //       configEvents.emit("CHILD_ERROR", { childId: DEFAULT_SORTER_CHILD_ID, err: "SORTER SEND ERROR" });
          //     }
          //     else {
          //       childrenHashMap[DEFAULT_SORTER_CHILD_ID].status = "RUNNING";
          //     }
          //   });
          // }

        });
      });


      let paramsSorterOverall = {};
      paramsSorterOverall.op = "SORT";
      paramsSorterOverall.nodeType = "overall";
      paramsSorterOverall.sortKey = metricsRate;
      paramsSorterOverall.max = configuration.maxTopTerms;
      paramsSorterOverall.obj = {};

      async.each(Object.keys(nodeMeter), function sorterParams(meterId, cb){

        if (!nodeMeter[meterId]) {
          console.error(chalkError("*** ERROR NULL nodeMeter[meterId]: " + meterId));
        }

        paramsSorterOverall.obj[meterId] = pick(nodeMeter[meterId].toJSON(), paramsSorterOverall.sortKey);

        cb();

      }, function(err){
        if (err) {
          console.error(chalkError("ERROR RATE QUEUE INTERVAL\n" + err ));
        }

        keySortQueue.push(paramsSorterOverall);

        // if ((childrenHashMap[DEFAULT_SORTER_CHILD_ID] !== undefined) 
        //   && childrenHashMap[DEFAULT_SORTER_CHILD_ID].child) {

        //   childrenHashMap[DEFAULT_SORTER_CHILD_ID].child.send(paramsSorterOverall, function sendSorterError(err){
        //     if (err) {
        //       console.error(chalkError("SORTER SEND ERROR"
        //         + " | " + err
        //       ));
        //       childrenHashMap[DEFAULT_SORTER_CHILD_ID].status = "ERROR";
        //       configEvents.emit("CHILD_ERROR", { childId: DEFAULT_SORTER_CHILD_ID, err: "SORTER SEND ERROR" });
        //     }
        //     else {
        //       childrenHashMap[DEFAULT_SORTER_CHILD_ID].status = "RUNNING";
        //     }
        //   });
        // }

      });
    }

  }, interval);
}

let loadBestNetworkInterval;

function loadBestRuntimeNetwork(){
  loadFile(bestNetworkFolder, bestRuntimeNetworkFileName, function(err, bRtNnObj){

    if (err) {
      console.trace(chalkError("LOAD BEST NETWORK ERROR"
        + " | PATH: " + bestNetworkFolder + "/" + bestRuntimeNetworkFileName 
        + " | ERROR: " + err
      ));
    }
    else if (bRtNnObj) {

      bRtNnObj.matchRate = (bRtNnObj.matchRate !== undefined) ? bRtNnObj.matchRate : 0;

      console.log(chalkInfo("LOAD BEST NETWORK RUNTIME ID"
        + " | " + bRtNnObj.networkId
        + " | SUCCESS: " + bRtNnObj.successRate.toFixed(2) + "%"
        + " | MATCH: " + bRtNnObj.matchRate.toFixed(2) + "%"
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
        else {

          if (nnObj) { 
            nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
            bestNetworkObj = deepcopy(nnObj);

            // if (childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID] === undefined){
            //   killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
            //     initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
            //   });
            // }
          }
          else {
            NeuralNetwork.find({}).sort({"matchRate": -1}).limit(1).exec(function(err, nnArray){
              if (err){
                console.log(chalkError("*** NEURAL NETWORK FIND ERROR: " + err));
              }
              else if (nnArray === 0){
                console.log(chalkError("*** NEURAL NETWORK NOT FOUND"));
              }
              else {
                bestNetworkObj = nnArray[0];
                if (bestNetworkObj.matchRate === undefined) { bestNetworkObj.matchRate = 0; }
                if (bestNetworkObj.overallMatchRate === undefined) { bestNetworkObj.overallMatchRate = 0; }
                console.log(chalk.blue("+++ BEST NEURAL NETWORK LOADED FROM DB"
                  + " | " + bestNetworkObj.networkId
                  + " | SR: " + bestNetworkObj.successRate.toFixed(2) + "%"
                  + " | MR: " + bestNetworkObj.matchRate.toFixed(2) + "%"
                  + " | OAMR: " + bestNetworkObj.overallMatchRate.toFixed(2) + "%"
                ));
              }
            });
          }

          if (bestNetworkObj && (tweetParser !== undefined) && (previousBestNetworkId !== bestNetworkObj.networkId)) {

            if (bestNetworkObj) { previousBestNetworkId = bestNetworkObj.networkId; }

            console.log(chalk.blue("NEW BEST NETWORK"
              + " | " + nnObj.networkId
              + " | " + nnObj.successRate.toFixed(2)
              + " | " + nnObj.matchRate.toFixed(2)
              // + "\n" + jsonPrint(nnObj)
            ));

            statsObj.bestNetwork.networkId = nnObj.networkId;
            statsObj.bestNetwork.successRate = nnObj.successRate;
            statsObj.bestNetwork.matchRate = nnObj.matchRate;

            childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({ op: "NETWORK", networkObj: bestNetworkObj }, function twpNetwork(err){
              if (err) {
                console.error(chalkError("*** TWEET PARSER SEND NETWORK ERROR"
                  + " | " + err
                ));
              }
            });
          }

        }

      });
    }
  });
}

function initLoadBestNetworkInterval(interval){

  clearInterval(loadBestNetworkInterval);

  loadBestRuntimeNetwork();

  loadBestNetworkInterval = setInterval(function(){

    loadBestRuntimeNetwork();

    // loadFile(bestNetworkFolder, bestRuntimeNetworkFileName, function(err, bRtNnObj){

    //   if (err) {
    //     console.trace(chalkError("LOAD BEST NETWORK ERROR"
    //       + " | PATH: " + bestNetworkFolder + "/" + bestRuntimeNetworkFileName 
    //       + " | ERROR: " + err
    //     ));
    //   }
    //   else if (bRtNnObj) {

    //     bRtNnObj.matchRate = (bRtNnObj.matchRate !== undefined) ? bRtNnObj.matchRate : 0;

    //     console.log(chalkInfo("LOAD BEST NETWORK RUNTIME ID"
    //       + " | " + bRtNnObj.networkId
    //       + " | SUCCESS: " + bRtNnObj.successRate.toFixed(2) + "%"
    //       + " | MATCH: " + bRtNnObj.matchRate.toFixed(2) + "%"
    //     ));

    //     statsObj.bestNetwork.networkId = bRtNnObj.networkId;
    //     statsObj.bestNetwork.successRate = bRtNnObj.successRate;
    //     statsObj.bestNetwork.matchRate = bRtNnObj.matchRate;

    //     let file = bRtNnObj.networkId + ".json";

    //     loadFile(bestNetworkFolder, file, function(err, nnObj){

    //       if (err) {
    //         console.trace(chalkError("LOAD BEST NETWORK ERROR"
    //           + " | PATH: " + bestNetworkFolder + "/" + file 
    //           + " | ERROR" + err
    //         ));
    //       }
    //       else {

    //         if (nnObj) { 
    //           nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
    //           bestNetworkObj = deepcopy(nnObj);

    //           if (childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID] === undefined){
    //             killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
    //               initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
    //             });
    //           }
    //         }
    //         else {
    //           NeuralNetwork.find({}).sort({"matchRate": -1}).limit(1).exec(function(err, nnArray){
    //             if (err){
    //               console.log(chalkError("*** NEURAL NETWORK FIND ERROR: " + err));
    //             }
    //             else if (nnArray === 0){
    //               console.log(chalkError("*** NEURAL NETWORK NOT FOUND"));
    //             }
    //             else {
    //               bestNetworkObj = nnArray[0];
    //               if (bestNetworkObj.matchRate === undefined) { bestNetworkObj.matchRate = 0; }
    //               if (bestNetworkObj.overallMatchRate === undefined) { bestNetworkObj.overallMatchRate = 0; }
    //               console.log(chalk.blue("+++ BEST NEURAL NETWORK LOADED FROM DB"
    //                 + " | " + bestNetworkObj.networkId
    //                 + " | SR: " + bestNetworkObj.successRate.toFixed(2) + "%"
    //                 + " | MR: " + bestNetworkObj.matchRate.toFixed(2) + "%"
    //                 + " | OAMR: " + bestNetworkObj.overallMatchRate.toFixed(2) + "%"
    //               ));
    //             }
    //           });
    //         }

    //         if (bestNetworkObj && (tweetParser !== undefined) && (previousBestNetworkId !== bestNetworkObj.networkId)) {

    //           if (bestNetworkObj) { previousBestNetworkId = bestNetworkObj.networkId; }

    //           console.log(chalk.blue("NEW BEST NETWORK"
    //             + " | " + nnObj.networkId
    //             + " | " + nnObj.successRate.toFixed(2)
    //             + " | " + nnObj.matchRate.toFixed(2)
    //             // + "\n" + jsonPrint(nnObj)
    //           ));

    //           statsObj.bestNetwork.networkId = nnObj.networkId;
    //           statsObj.bestNetwork.successRate = nnObj.successRate;
    //           statsObj.bestNetwork.matchRate = nnObj.matchRate;

    //           childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({ op: "NETWORK", networkObj: bestNetworkObj }, function twpNetwork(err){
    //             if (err) {
    //               console.error(chalkError("*** TWEET PARSER SEND NETWORK ERROR"
    //                 + " | " + err
    //               ));
    //             }
    //           });
    //         }

    //       }

    //     });
    //   }

    // });
  
  }, interval);
}

function initCategoryHashmaps(callback){

  console.log(chalkTwitter("INIT CATEGORIZED USER + HASHTAG HASHMAPS FROM DB"));

  async.parallel({

    hashtag: function(cb){

      hashtagServerController.findCategorizedHashtagsCursor({}, function(err, results){
        if (err) {
          console.error(chalkError("ERROR: initCategoryHashmaps: findCategorizedHashtagsCursor:"
            + " " + err
          ));
          cb(err);
        }
        else {
          console.log(chalkTwitter("LOADED CATEGORIZED HASHTAGS FROM DB"
            + " | " + results.count + " CATEGORIZED"
            + " | " + results.manual + " MAN"
            + " | " + results.auto + " AUTO"
            + " | " + results.matchRate.toFixed(2) + "% MR"
          ));

          Object.keys(results.obj).forEach(function(nodeId){
            categorizedHashtagHashMap.set(nodeId, results.obj[nodeId]);
          });

          cb();
        }
      });
    },
    user: function(cb){

      userServerController.findCategorizedUsersCursor({}, function(err, results){
        
        if (err) {
          console.error(chalkError("ERROR: initCategoryHashmaps: findCategorizedUsersCursor:"
            + " " + err
          ));
          cb(err);
        }
        else {
          console.log(chalkTwitter("LOADED CATEGORIZED USERS FROM DB"
            + " | " + results.count + " CATEGORIZED"
            + " | " + results.manual + " MAN"
            + " | " + results.auto + " AUTO"
            + " | " + results.matchRate.toFixed(2) + "% MR"
          ));

          // categorizedUsersObj[user.nodeId.toString()] = { manual: user.category, auto: user.categoryAuto };
          Object.keys(results.obj).forEach(function(nodeId){
            categorizedUserHashMap.set(nodeId, results.obj[nodeId]);
          });

          cb();
        }
      });
    },
    word: function(cb){

      wordServerController.findCategorizedWordsCursor({}, function(err, results){
        
        if (err) {
          console.error(chalkError("ERROR: initCategoryHashmaps: findCategorizedWordsCursor:"
            + " " + err
          ));
          cb(err);
        }
        else {
          console.log(chalkTwitter("LOADED CATEGORIZED WORDS FROM DB"
            + " | " + results.count + " CATEGORIZED"
            + " | " + results.manual + " MAN"
            + " | " + results.auto + " AUTO"
            + " | " + results.matchRate.toFixed(2) + "% MR"
          ));

          Object.keys(results.obj).forEach(function(nodeId){
            categorizedWordHashMap.set(nodeId, results.obj[nodeId]);
          });

          cb();
        }
      });
    }

  }, function(err){
    if (err) {
      console.log(chalkError("ERROR: initCategoryHashmaps: " + err));
      if (callback !== undefined) { callback(err); }
    }
    else {
      console.log(chalk.blue("LOAD COMPLETE: initCategoryHashmaps"));
      if (callback !== undefined) { callback(); }
    }

  });
}


function initialize(cnf, callback) {

  debug(chalkInfo(moment().format(compactDateTimeFormat) + " | INITIALIZE"));

  killAll();

  let configArgs = Object.keys(cnf);
  configArgs.forEach(function finalConfigs(arg){
    debug("FINAL CONFIG | " + arg + ": " + cnf[arg]);
  });

  if (cnf.quitOnError) { 
    debug(chalkAlert("===== QUIT ON ERROR SET ====="));
  }

  loadFile(dropboxConfigTwitterFolder, defaultTwitterConfigFile, function initTwit(err, twitterConfig){
    if (err) {
      console.log(chalkError("*** LOADED DEFAULT TWITTER CONFIG ERROR: FILE:  " + defaultTwitterConfigFile));
      console.log(chalkError("*** LOADED DEFAULTTWITTER CONFIG ERROR: ERROR: " + err));
    }
    else {
      console.log(chalkTwitter("LOADED TWITTER AUTO FOLLOW CONFIG\n" + jsonPrint(defaultTwitterConfigFile)));

      twit = new Twit(twitterConfig);

      updateTrends();
    }
  });

  loadFile(dropboxConfigTwitterFolder, twitterAutoFollowConfigFile, function initTwit(err, twitterConfig){
    if (err) {
      console.log(chalkError("*** LOADED TWITTER AUTO FOLLOW CONFIG ERROR: FILE:  " + twitterAutoFollowConfigFile));
      console.log(chalkError("*** LOADED TWITTER AUTO FOLLOW CONFIG ERROR: ERROR: " + err));
    }
    else {
      console.log(chalkTwitter("LOADED TWITTER AUTO FOLLOW CONFIG\n" + jsonPrint(twitterAutoFollowConfigFile)));

      twitAutoFollow = new Twit(twitterConfig);
    }
  });

  loadMaxInputHashMap({folder: dropboxConfigDefaultTrainingSetsFolder, file: maxInputHashMapFile}, function(err){
    if (err) {
      console.log(chalkError("ERROR: loadMaxInputHashMap: " + err));
    }
    else {
      console.log(chalkInfo("LOADED MAX INPUT HASHMAP + NORMALIZATION"));
      console.log(chalkInfo("MAX INPUT HASHMAP INPUT TYPES: " + Object.keys(maxInputHashMap)));
      console.log(chalkInfo("NORMALIZATION INPUT TYPES: " + Object.keys(normalization)));
    }
  });

  initLoadBestNetworkInterval(ONE_MINUTE+1);
  initInternetCheckInterval(10000);

  initFollowableSearchTerms();


  io = require("socket.io")(httpServer, ioConfig);

  function postAuthenticate(socket, data) {
    console.log(chalkAlert("postAuthenticate\n" + jsonPrint(data)));
  }

  function disconnect(socket) {
    console.log(chalkAlert("POST AUTHENTICATE DISCONNECT | " + socket.id));
  }

  const socketIoAuth = require("@threeceelabs/socketio-auth")(io, {

    authenticate: function (socket, data, callback) {

      console.log(chalkAlert("SOCKET IO AUTHENTICATE"
        + " | " + getTimeStamp()
        + " | " + socket.id
        + "\n" + jsonPrint(data)
      ));
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

    getChildProcesses({searchTerm: "ALL"}, function(err, childArray){

      console.log(chalkLog("WA | FOUND " + childArray.length + " CHILDREN"));
      
      childArray.forEach(function(childObj){
        console.log(chalkLog("WA | CHILD | PID: " + childObj.pid + " | " + childObj.childId + " | " + childrenHashMap[childObj.childId].status));
      });

    });

    statsObj.serverTime = moment().valueOf();
    statsObj.timeStamp = moment().format(compactDateTimeFormat);
    statsObj.runTime = moment().valueOf() - statsObj.startTime;
    statsObj.upTime = os.uptime() * 1000;

    if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin){
      statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
      statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
    }

    statsObj.nodeMeterEntries = Object.keys(nodeMeter).length;

    if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
      statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
      statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
      debug(chalkLog("NEW MAX NODE METER ENTRIES"
        + " | " + moment().format(compactDateTimeFormat)
        + " | " + statsObj.nodeMeterEntries.toFixed(0)
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

    statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
    statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;

    saveStats(statsFile, statsObj, function saveStatsComplete(status){
      debug(chalkLog("SAVE STATS " + status));
    });

    showStats();

    statsUpdated += 1;

  }, interval);
}

function initCategoryHashmapsInterval(interval){

  console.log(chalkInfo("INIT CATEGORY HASHMAP INTERVAL"
    + " | " + interval + " MS"
  ));

  clearInterval(categoryHashmapsInterval);

  categoryHashmapsInterval = setInterval(function updateMemStats() {

    initCategoryHashmaps();

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

    initUnfollowableUserSet();
    initSorterMessageRxQueueInterval(DEFAULT_INTERVAL);
    initSaveFileQueue(configuration);
    initIgnoreWordsHashMap();
    initTransmitNodeQueueInterval(TRANSMIT_NODE_QUEUE_INTERVAL);
    initStatsInterval(STATS_UPDATE_INTERVAL);
    initCategoryHashmapsInterval(CATEGORY_UPDATE_INTERVAL);
    initUpdateTrendsInterval(UPDATE_TRENDS_INTERVAL);
    initRateQinterval(RATE_QUEUE_INTERVAL);
    initTwitterRxQueueInterval(TWITTER_RX_QUEUE_INTERVAL);
    initTweetParserMessageRxQueueInterval(TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL);
    initHashtagLookupQueueInterval(HASHTAG_LOOKUP_QUEUE_INTERVAL);

    console.log(chalkInfo("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS"));

    console.log(chalk.blue("CONFIGURATION\n" + jsonPrint(configuration)));

    if (!configuration.metrics.nodeMeterEnabled) {
      console.log(chalkAlert("*** WORD RATE METER DISABLED ***"));
    }

    statsObj.configuration = configuration;

    initCategoryHashmaps(function(err){
      if (err) {
        console.log(chalkError("ERROR: LOAD CATEGORY HASHMAPS: " + err));
      }
      else {
        console.log(chalkInfo("LOADED CATEGORY HASHMAPS"));
      }
      // initSorter({childId: DEFAULT_SORTER_CHILD_ID});
      initKeySortInterval(configuration.keySortInterval);
      initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
      slackPostMessage(slackChannel, "\n*INIT* | " + hostname + "\n");
    });

  }
});

module.exports = {
  app: app,
  io: io,
  http: httpServer
};