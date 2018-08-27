/*jslint node: true */
/*jshint sub:true*/
"use strict";

const DROPBOX_LIST_FOLDER_LIMIT = 50;

const compactDateTimeFormat = "YYYYMMDD HHmmss";
const tinyDateTimeFormat = "YYYYMMDDHHmmss";

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const RUN_INTERVAL = ONE_SECOND;
const FSM_TICK_INTERVAL = ONE_SECOND;
const DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER = "altthreecee00";
const DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER_FILE = DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER + ".json";
const DEFAULT_SAVE_FILE_QUEUE_INTERVAL = ONE_SECOND;
const DEFAULT_CHECK_TWITTER_RATE_LIMIT_INTERVAL = ONE_MINUTE;
const DEFAULT_TWITTER_SEARCH_NODE_QUEUE_INTERVAL = 1000;
const DEFAULT_MAX_TWIITER_SHOW_USER_TIMEOUT = 30*ONE_MINUTE;
const DEFAULT_CONFIG_INIT_INTERVAL = ONE_MINUTE;
const DEFAULT_TEST_INTERNET_CONNECTION_URL = "www.google.com";
const DEFAULT_FIND_CAT_USER_CURSOR_LIMIT = 100;
const DEFAULT_FIND_CAT_WORD_CURSOR_LIMIT = 100;
const DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT = 100;
const DEFAULT_CURSOR_BATCH_SIZE = 100;
const DEFAULT_THREECEE_USERS = ["altthreecee00"];
const DEFAULT_SORTER_CHILD_ID = "wa_node_sorter";
const DEFAULT_TWEET_PARSER_CHILD_ID = "wa_node_tweetParser";
const DEFAULT_TWITTER_CONFIG_THREECEE = "altthreecee00";
const DEFAULT_TWITTER_CONFIG_THREECEE_FILE = DEFAULT_TWITTER_CONFIG_THREECEE + ".json";
const DEFAULT_INTERVAL = 10;
const DEFAULT_PING_INTERVAL = 10*ONE_SECOND;
const DEFAULT_DROPBOX_LIST_FOLDER_LIMIT = 50;
const DEFAULT_MIN_FOLLOWERS_AUTO = 15000;
const DEFAULT_RATE_QUEUE_INTERVAL = ONE_SECOND; // 1 second
const DEFAULT_RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const DEFAULT_TWEET_PARSER_INTERVAL = 10;
const DEFAULT_TWITTER_RX_QUEUE_INTERVAL = 10;
const DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL = 10;
const DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 10;
const DEFAULT_UPDATE_TRENDS_INTERVAL = 15*ONE_MINUTE;
const DEFAULT_STATS_UPDATE_INTERVAL = ONE_MINUTE;
const DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL = ONE_MINUTE;
const DEFAULT_HASHTAG_LOOKUP_QUEUE_INTERVAL = 10;
const DEFAULT_SOCKET_AUTH_TIMEOUT = 30*ONE_SECOND;
const DEFAULT_QUIT_ON_ERROR = false;
const DEFAULT_MAX_TOP_TERMS = 100;
const DEFAULT_METRICS_NODE_METER_ENABLED = true;
const DEFAULT_MAX_QUEUE = 200;
const DEFAULT_OFFLINE_MODE = process.env.OFFLINE_MODE || false; 
// if network connection is down, will auto switch to OFFLINE_MODE
const DEFAULT_AUTO_OFFLINE_MODE = true; // if network connection is down, will auto switch to OFFLINE_MODE
const DEFAULT_IO_PING_INTERVAL = ONE_MINUTE;
const DEFAULT_IO_PING_TIMEOUT = 3*ONE_MINUTE;
const DEFAULT_NODE_TYPES = ["emoji", "hashtag", "media", "place", "url", "user", "word"];
const SERVER_CACHE_DEFAULT_TTL = 300; // seconds
const SERVER_CACHE_CHECK_PERIOD = 15;
const VIEWER_CACHE_DEFAULT_TTL = 300; // seconds
const VIEWER_CACHE_CHECK_PERIOD = 15;
const ADMIN_CACHE_DEFAULT_TTL = 300; // seconds
const ADMIN_CACHE_CHECK_PERIOD = 15;
const AUTH_SOCKET_CACHE_DEFAULT_TTL = 600;
const AUTH_SOCKET_CACHE_CHECK_PERIOD = 10;
const AUTH_USER_CACHE_DEFAULT_TTL = ONE_DAY/1000;
const AUTH_USER_CACHE_CHECK_PERIOD = ONE_HOUR/1000; // seconds
const AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL = 300;
const AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD = 5;
const TOPTERMS_CACHE_DEFAULT_TTL = 60;
const TOPTERMS_CACHE_CHECK_PERIOD = 5;
const TRENDING_CACHE_DEFAULT_TTL = 300;
const TRENDING_CACHE_CHECK_PERIOD = 60;
const NODE_CACHE_DEFAULT_TTL = 60;
const NODE_CACHE_CHECK_PERIOD = 5;

require("isomorphic-fetch");

const configApp = require("./config/config");

const Watchpack = require("watchpack");
const wp = new Watchpack({
  ignored: [/^\..*/],
  aggregateTimeout: 1000,
  poll: true
 });

const net = require("net");
const _ = require("lodash");
const async = require("async");
const callerId = require("caller-id");
const cp = require("child_process");
const debug = require("debug")("WAS");
const deepcopy = require("deep-copy");
const defaults = require("object.defaults");
const fs = require("fs");
const HashMap = require("hashmap").HashMap;
const JSONParse = require("json-parse-safe");
const merge = require("deepmerge");
const moment = require("moment");
const NodeCache = require("node-cache");
const omit = require("object.omit");
const os = require("os");
const pick = require("object.pick");
const randomInt = require("random-int");
const randomItem = require("random-item");
const retry = require("retry");
const sizeof = require("object-sizeof");
const Stately = require("stately.js");
const table = require("text-table");
const treeify = require("treeify");
const util = require("util");
const writeJsonFile = require("write-json-file");
const express = require("express");
const expressSession = require("express-session");
const MongoStore = require("connect-mongo")(expressSession);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const Measured = require("measured");

let metricsRate = "5MinuteRate";
const globalNodeMeter = new Measured.Meter({rateUnit: 60000});
const tweetMeter = new Measured.Meter({rateUnit: 60000});
let nodeMeter = {};
let nodeMeterType = {};

DEFAULT_NODE_TYPES.forEach(function(nodeType){
  nodeMeterType[nodeType] = {};
});

const app = express();

const chalk = require("chalk");
const chalkInfo = chalk.black;
const chalkHeard = chalk.bold.blue;
const chalkBlue = chalk.blue;
const chalkError = chalk.bold.red;
const chalkAlert = chalk.red;
const chalkWarn = chalk.red;
const chalkLog = chalk.gray;

process.on("unhandledRejection", function(err, promise) {
  console.trace("Unhandled rejection (promise: ", promise, ", reason: ", err, ").");
  process.exit();
});

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
  else if (moment.isDate(new Date(inputTime))) {
    currentTimeStamp = moment(new Date(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else {
    currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
}

let DEFAULT_CONFIGURATION = {};

DEFAULT_CONFIGURATION.hostname = os.hostname();
DEFAULT_CONFIGURATION.hostname = DEFAULT_CONFIGURATION.hostname.replace(/.local/g, "");
DEFAULT_CONFIGURATION.hostname = DEFAULT_CONFIGURATION.hostname.replace(/.home/g, "");
DEFAULT_CONFIGURATION.hostname = DEFAULT_CONFIGURATION.hostname.replace(/.at.net/g, "");
DEFAULT_CONFIGURATION.hostname = DEFAULT_CONFIGURATION.hostname.replace(/.fios-router.home/g, "");
DEFAULT_CONFIGURATION.hostname = DEFAULT_CONFIGURATION.hostname.replace(/word0-instance-1/g, "google");
DEFAULT_CONFIGURATION.hostname = DEFAULT_CONFIGURATION.hostname.replace(/word/g, "google");

DEFAULT_CONFIGURATION.randomEvenDelayMin = 1;
DEFAULT_CONFIGURATION.randomEvenDelayMax = 5;

DEFAULT_CONFIGURATION.processName = "wordAssoServer";
DEFAULT_CONFIGURATION.processTitle = "node_wordAssoServer";
DEFAULT_CONFIGURATION.runId = DEFAULT_CONFIGURATION.hostname + "_" + getTimeStamp() + "_" + process.pid;

DEFAULT_CONFIGURATION.configFolder = "/config";
DEFAULT_CONFIGURATION.defaultConfigFolder = "/config/utility/default";
DEFAULT_CONFIGURATION.defaultConfigFile = "default_" + DEFAULT_CONFIGURATION.processName + "Config.json";
DEFAULT_CONFIGURATION.hostConfigFolder = "/config/utility/" + DEFAULT_CONFIGURATION.hostname;
DEFAULT_CONFIGURATION.hostConfigFile = DEFAULT_CONFIGURATION.hostname + "_" + DEFAULT_CONFIGURATION.processName + "Config.json";
DEFAULT_CONFIGURATION.statsFile = DEFAULT_CONFIGURATION.processName + "Stats.json";

DEFAULT_CONFIGURATION.watchFolderArray = [
  "/Users/tc/Dropbox/Apps/wordAssociation/config/default"
];

DEFAULT_CONFIGURATION.verbose = false;
DEFAULT_CONFIGURATION.debug = false;
DEFAULT_CONFIGURATION.offlineMode = false;
DEFAULT_CONFIGURATION.quitOnComplete = false;
DEFAULT_CONFIGURATION.testMode = false;

DEFAULT_CONFIGURATION.processPrefix = "WAS";
DEFAULT_CONFIGURATION.childPrefix = "TWP";

DEFAULT_CONFIGURATION.saveFileQueueInterval = ONE_SECOND;
DEFAULT_CONFIGURATION.keepaliveInterval = 10*ONE_SECOND;
DEFAULT_CONFIGURATION.cacheTtl = 60; // seconds
DEFAULT_CONFIGURATION.cacheCheckPeriod = 10; // seconds

DEFAULT_CONFIGURATION.db = {};
DEFAULT_CONFIGURATION.db.name = DEFAULT_CONFIGURATION.processPrefix + "_" + process.pid;
DEFAULT_CONFIGURATION.db.batchSize = 100;

DEFAULT_CONFIGURATION.fsm = {};
DEFAULT_CONFIGURATION.fsm.fsmTickInterval = ONE_SECOND;

DEFAULT_CONFIGURATION.dropbox = {};
DEFAULT_CONFIGURATION.dropbox.listFolderLimit = 50;
DEFAULT_CONFIGURATION.dropbox.timeout = 30 * ONE_SECOND;
DEFAULT_CONFIGURATION.dropbox.accessToken = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
DEFAULT_CONFIGURATION.dropbox.appKey = process.env.DROPBOX_WORD_ASSO_APP_KEY ;
DEFAULT_CONFIGURATION.dropbox.appSecret = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
DEFAULT_CONFIGURATION.dropbox.maxSaveNormal = 20 * ONE_MEGABYTE;
DEFAULT_CONFIGURATION.dropbox.configFolder = process.env.DROPBOX_CONFIG_FILE || DEFAULT_CONFIGURATION.configFolder;
DEFAULT_CONFIGURATION.dropbox.configFile = process.env.DROPBOX_CONFIG_FILE || DEFAULT_CONFIGURATION.configFile;
DEFAULT_CONFIGURATION.dropbox.statsFile = process.env.DROPBOX_STATS_FILE || DEFAULT_CONFIGURATION.statsFile;

DEFAULT_CONFIGURATION.child = {};
DEFAULT_CONFIGURATION.child.sourceFile = "tweetParserChild.js";
DEFAULT_CONFIGURATION.child.db = {};
DEFAULT_CONFIGURATION.child.db = DEFAULT_CONFIGURATION.db;
DEFAULT_CONFIGURATION.child.dropbox = {};
DEFAULT_CONFIGURATION.child.dropbox = DEFAULT_CONFIGURATION.dropbox;
DEFAULT_CONFIGURATION.child.childIdPrefix = DEFAULT_CONFIGURATION.processTitle + "_CH";
DEFAULT_CONFIGURATION.child.reinitOnClose = false;

DEFAULT_CONFIGURATION.verbose = false;
DEFAULT_CONFIGURATION.maxQueue = 100;

DEFAULT_CONFIGURATION.twitterThreeceeAutoFollowUser = DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER;

DEFAULT_CONFIGURATION.dropboxListFolderLimit = DEFAULT_DROPBOX_LIST_FOLDER_LIMIT;

DEFAULT_CONFIGURATION.tweetParserInterval = DEFAULT_TWEET_PARSER_INTERVAL;
DEFAULT_CONFIGURATION.rateQueueInterval = DEFAULT_RATE_QUEUE_INTERVAL;
DEFAULT_CONFIGURATION.rateQueueIntervalModulo = DEFAULT_RATE_QUEUE_INTERVAL_MODULO;
DEFAULT_CONFIGURATION.statsUpdateInterval = DEFAULT_STATS_UPDATE_INTERVAL;
DEFAULT_CONFIGURATION.checkTwitterRateLimitInterval = DEFAULT_CHECK_TWITTER_RATE_LIMIT_INTERVAL;
DEFAULT_CONFIGURATION.transmitNodeQueueInterval = DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL;
DEFAULT_CONFIGURATION.tweetParserMessageRxQueueInterval = DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL;
DEFAULT_CONFIGURATION.twitterRxQueueInterval = DEFAULT_TWITTER_RX_QUEUE_INTERVAL;
DEFAULT_CONFIGURATION.twitterSearchNodeQueueInterval = DEFAULT_TWITTER_SEARCH_NODE_QUEUE_INTERVAL;

DEFAULT_CONFIGURATION.categoryHashmapsUpdateInterval = DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL;
DEFAULT_CONFIGURATION.testInternetConnectionUrl = DEFAULT_TEST_INTERNET_CONNECTION_URL;
DEFAULT_CONFIGURATION.offlineMode = DEFAULT_OFFLINE_MODE;
DEFAULT_CONFIGURATION.autoOfflineMode = DEFAULT_AUTO_OFFLINE_MODE;

DEFAULT_CONFIGURATION.batchSize = DEFAULT_CURSOR_BATCH_SIZE;

DEFAULT_CONFIGURATION.keySortInterval = DEFAULT_INTERVAL;

DEFAULT_CONFIGURATION.enableTransmitUser = true;
DEFAULT_CONFIGURATION.enableTransmitWord = false;
DEFAULT_CONFIGURATION.enableTransmitPlace = false;
DEFAULT_CONFIGURATION.enableTransmitHashtag = true;
DEFAULT_CONFIGURATION.enableTransmitEmoji = false;
DEFAULT_CONFIGURATION.enableTransmitUrl = false;
DEFAULT_CONFIGURATION.enableTransmitMedia = false;

DEFAULT_CONFIGURATION.saveFileQueueInterval = DEFAULT_SAVE_FILE_QUEUE_INTERVAL;
DEFAULT_CONFIGURATION.socketAuthTimeout = DEFAULT_SOCKET_AUTH_TIMEOUT;
DEFAULT_CONFIGURATION.quitOnError = DEFAULT_QUIT_ON_ERROR;
DEFAULT_CONFIGURATION.maxTopTerms = DEFAULT_MAX_TOP_TERMS;
DEFAULT_CONFIGURATION.metrics = {};
DEFAULT_CONFIGURATION.metrics.nodeMeterEnabled = DEFAULT_METRICS_NODE_METER_ENABLED;
DEFAULT_CONFIGURATION.minFollowersAuto = DEFAULT_MIN_FOLLOWERS_AUTO;

DEFAULT_CONFIGURATION.threeceeUsers = [];
DEFAULT_CONFIGURATION.threeceeUsers = DEFAULT_THREECEE_USERS;

let viewerCache;
let serverCache;
let authenticatedSocketCache;
let authenticatedTwitterUserCache;
let authInProgressTwitterUserCache;
let nodeCache;
let trendingCache;
let nodesPerMinuteTopTermCache;
let cacheObj = {};

let adminHashMap = new HashMap();
let viewerHashMap = new HashMap();

let memoryAvailableMB = 0;
let memoryTotalMB = 0;
let memoryAvailablePercent = 0;

let configuration = {};
configuration = deepcopy(DEFAULT_CONFIGURATION);

process.title = configuration.processTitle;

let tweetRxQueueInterval;
let tweetParserQueue = [];
let tweetParserMessageRxQueue = [];
let tweetRxQueue = [];

let hashtagLookupQueueInterval;
let hashtagLookupQueue = [];

let keySortQueue = [];

let twitterSearchNodeQueue = [];
let twitterSearchNodeQueueInterval;
let twitterSearchNodeQueueReady = false;

let tweetParser;
let tweetParserPingInterval;
let tweetParserPingSent = false;
let tweetParserPongReceived = false;

let categoryHashmapsInterval;
let statsInterval;

let dropboxClient = null;
let child = null;


let adminNameSpace;
let utilNameSpace;
let userNameSpace;
let viewNameSpace;

let unfollowableUserFile = "unfollowableUser.json";
let followableSearchTermFile = "followableSearchTerm.json";

let followableSearchTermSet = new Set();

followableSearchTermSet.add("potus");
followableSearchTermSet.add("trump");
followableSearchTermSet.add("obama");
followableSearchTermSet.add("clinton");
followableSearchTermSet.add("pence");
followableSearchTermSet.add("ivanka");
followableSearchTermSet.add("mueller");
followableSearchTermSet.add("reagan");
followableSearchTermSet.add("hanity");
followableSearchTermSet.add("putin");

followableSearchTermSet.add("#maga");
followableSearchTermSet.add("#kag");
followableSearchTermSet.add("#nra");
followableSearchTermSet.add("#gop");
followableSearchTermSet.add("#resist");
followableSearchTermSet.add("#dem");
followableSearchTermSet.add("#imwithher");
followableSearchTermSet.add("#metoo");
followableSearchTermSet.add("#blm");
followableSearchTermSet.add("#russia");

followableSearchTermSet.add("@nra");
followableSearchTermSet.add("@gop");

followableSearchTermSet.add("bluewave");
followableSearchTermSet.add("liberal");
followableSearchTermSet.add("democrat");
followableSearchTermSet.add("congress");
followableSearchTermSet.add("republican");
followableSearchTermSet.add("conservative");
followableSearchTermSet.add("livesmatter");

let followableSearchTermString = "";

let followableRegEx;

const DEFAULT_BEST_NETWORK_FOLDER = "/config/utility/best/neuralNetworks";
const bestNetworkFolder = DEFAULT_BEST_NETWORK_FOLDER;

const DEFAULT_BEST_NETWORK_FILE = "bestRuntimeNetwork.json";
const bestRuntimeNetworkFileName = DEFAULT_BEST_NETWORK_FILE;

const bestRuntimeNetworkPath = bestNetworkFolder + "/" + bestRuntimeNetworkFileName;

const DEFAULT_MAX_INPUT_HASHMAP_FILE = "maxInputHashMap.json";
let maxInputHashMapFile = DEFAULT_MAX_INPUT_HASHMAP_FILE;

let nodeSearchType = false;
let nodeSearchBy = "lastSeen";
let previousUserUncategorizedId = "1";
let previousUserUncategorizedCreated = moment();
let previousUserUncategorizedLastSeen = moment();
let previousUserMismatchedId = "1";

const fieldsExclude = {
  histograms: 0,
  countHistory: 0,
  friends: 0
};

const fieldsTransmit = {
  userId: 1,
  nodeId: 1,
  nodeType: 1,
  name: 1,
  screenName: 1,
  screenNameLower: 1,
  lastTweetId: 1,
  mentions: 1,
  rate: 1,
  isTopTerm: 1,
  category: 1,
  categoryAuto: 1,
  followersCount: 1,
  friendsCount: 1,
  statusesCount: 1,
  following: 1,
  threeceeFollowing: 1
};

const fieldsTransmitKeys = Object.keys(fieldsTransmit);

let childrenHashMap = {};

let bestNetworkObj = false;
let maxInputHashMap = false;
let normalization = false;


let twitterUserThreecee = {
    nodeId : "14607119",
    userId : "14607119",
    profileImageUrl : "http://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
    profileUrl : "http://twitter.com/threecee",
    url : "http://threeCeeMedia.com",
    name : "Tracy Collins",
    screenName : "threecee",
    nodeType : "user",
    following : null,
    description : "photography + animation + design",
    isTwitterUser : true,
    screenNameLower : "threecee"
};

let defaultTwitterUser = twitterUserThreecee;

let unfollowableUserSet = new Set();


global.dbConnection = false;
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const wordAssoDb = require("@threeceelabs/mongoose-twitter");

const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const emojiModel = require("@threeceelabs/mongoose-twitter/models/emoji.server.model");
const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

let NeuralNetwork;
let Emoji;
let Hashtag;
let Media;
let Place;
let Tweet;
let Url;
let User;
let Word;

let dbConnectionReadyInterval;

let prevHostConfigFileModifiedMoment = moment("2010-01-01");
let prevDefaultConfigFileModifiedMoment = moment("2010-01-01");
let prevConfigFileModifiedMoment = moment("2010-01-01");

let quitWaitInterval;
let quitFlag = false;

let statsObj = {};
let statsObjSmall = {};

statsObj.pid = process.pid;

statsObj.hostname = configuration.hostname;
statsObj.startTimeMoment = moment();
statsObj.elapsed = 0;

statsObj.status = "START";
statsObj.memory = {};
statsObj.memory.memoryAvailable = 0;
statsObj.memory.memoryTotal = 0;
statsObj.memory.memoryUsage = 0;

statsObj.children = {};
statsObj.children.childIndex = 0;
statsObj.children.numChildren = 0;

statsObj.db = {};
statsObj.db.connected = false;

statsObj.twitter = {};
statsObj.twitter.tweetsReceived = 0;
statsObj.twitter.tweetsPerMin = 0;
statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();

statsObj.bestNetwork = {};

statsObj.errors = {};

let statsPickArray = [
  "pid", 
  "startTime", 
  "elapsed", 
  "status", 
  "fsmState"
];

let childHashMap = {};

let fsmMain;
let fsmTickInterval;
let fsmPreviousState = "START";

statsObj.fsmState = "START";
statsObj.fsmPreviousState = "START";

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

const jsonPrint = function (obj) {
  if (obj) {
    return treeify.asTree(obj, true, true);
  }
  else {
    return "UNDEFINED";
  }
};

function initHttpServer(params){

  if (!httpServer.listening) {

    httpServer.on("reconnect", function serverReconnect() {
      statsObj.internetReady = true;
      debug(chalkConnect(getTimeStamp() + " | PORT RECONNECT: " + params.port));
    });

    httpServer.on("connect", function serverConnect() {
      statsObj.socket.connects += 1;
      statsObj.internetReady = true;
      debug(chalkConnect(getTimeStamp() + " | PORT CONNECT: " + params.port));

      httpServer.on("disconnect", function serverDisconnect() {
        statsObj.internetReady = false;
        console.log(chalkError("\n***** PORT DISCONNECTED | " + getTimeStamp() 
          + " | " + params.port));
      });
    });

    httpServer.listen(params.port, function serverListen() {
      debug(chalkInfo(getTimeStamp() + " | LISTENING ON PORT " + params.port));
    });

    httpServer.on("error", function serverError(err) {

      statsObj.socket.errors.httpServer_errors += 1;
      statsObj.internetReady = false;

      debug(chalkError("??? HTTP ERROR | " + getTimeStamp() + "\n" + err));

      if (err.code === "EADDRINUSE") {

        debug(chalkError("??? HTTP ADDRESS IN USE: " + params.port + " ... RETRYING..."));

        setTimeout(function serverErrorTimeout() {
          httpServer.listen(params.port, function serverErrorListen() {
            debug("LISTENING ON PORT " + params.port);
          });
        }, 5000);
      }
    });
      
    memoryAvailableMB = (statsObj.memory.memoryAvailable/(1024*1024));
    memoryTotalMB = (statsObj.memory.memoryTotal/(1024*1024));
    memoryAvailablePercent = (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal);

    let heartbeatObj = {};

    heartbeatObj.admins = [];
    heartbeatObj.servers = [];
    heartbeatObj.viewers = [];
    heartbeatObj.children = {};
    heartbeatObj.children.childrenHashMap = {};

    heartbeatObj.twitter = {};
    heartbeatObj.memory = {};

    let tempAdminArray = [];
    let tempServerArray = [];
    let tempViewerArray = [];

    setInterval(function hearbeatInterval() {

      statsObj.serverTime = moment().valueOf();
      statsObj.runTime = moment().valueOf() - statsObj.startTime;
      statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
      statsObj.timeStamp = getTimeStamp();
      statsObj.upTime = os.uptime() * 1000;
      statsObj.memory.memoryTotal = os.totalmem();
      statsObj.memory.memoryAvailable = os.freemem();
      statsObj.memory.memoryUsage = process.memoryUsage();

      tempAdminArray = adminHashMap.entries();
      heartbeatObj.admins = tempAdminArray;

      tempServerArray = [];

      async.each(serverCache.keys(), function(serverCacheKey, cb){

        serverCache.get(serverCacheKey, function(err, serverObj){

          if (err) {
            console.log(chalkError("SERVER CACHE ERROR: " + err));
            return cb(err);
          }

          if (serverObj) { tempServerArray.push([serverCacheKey, serverObj]); }

          cb();

        });

      }, function(){
        heartbeatObj.servers = tempServerArray;
      });

      tempViewerArray = [];

      async.each(viewerCache.keys(), function(viewerCacheKey, cb){

        viewerCache.get(viewerCacheKey, function(err, viewerObj){

          if (err) {
            console.log(chalkError("VIEWER CACHE ERROR: " + err));
            return cb(err);
          }

          if (viewerObj) { tempViewerArray.push([viewerCacheKey, viewerObj]); }

          cb();

        });

      }, function(){
        heartbeatObj.viewers = tempViewerArray;
      });


      statsObj.nodesPerMin = parseInt(globalNodeMeter.toJSON()[metricsRate]);

      if (statsObj.nodesPerMin > statsObj.maxNodesPerMin){
        statsObj.maxNodesPerMin = statsObj.nodesPerMin;
        statsObj.maxNodesPerMinTime = moment().valueOf();
      }

      statsObj.twitter.tweetsPerMin = parseInt(tweetMeter.toJSON()[metricsRate]);

      if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin){
        statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
        statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
      }

      if (statsObj.internetReady && statsObj.ioReady) {
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

        adminNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);

        heartbeatsSent += 1;
        if (heartbeatsSent % 60 === 0) { logHeartbeat(); }

      } 
      else {
        if (moment().seconds() % 10 === 0) {
          debug(chalkError("!!!! INTERNET DOWN?? !!!!! " 
            + getTimeStamp()
            + " | INTERNET READY: " + statsObj.internetReady
            + " | I/O READY: " + statsObj.ioReady
          ));
        }
      }
    }, 1000);

    return;
  }
  else {
    return;
  }
}

function initDropbox(cfg){

  let config = defaults({ offlineMode: false, accessToken: configuration.dropbox.accessToken}, cfg); 

  return new Promise(async function (resolve, reject){

    const Dropbox = require("dropbox").Dropbox;

    let dropboxClient = null;

    try {

      if (config.offlineMode) {
        dropboxClient = {  // offline mode
          filesListFolder: filesListFolderLocal,
          filesUpload: function(){},
          filesDownload: function(){},
          filesGetMetadata: filesGetMetadataLocal,
          filesDelete: function(){}
        };
      }
      else {
        dropboxClient = new Dropbox({ accessToken: config.accessToken });
        configuration.child.dropbox.accessToken = config.accessToken;
      }

      statsObj.status = "INIT DROPBOX OK";
    }
    catch (err) {
      console.log(chalkError("ERR INIT DROPBOX: " + err));
      statsObj.status = "INIT DROPBOX ERROR";
      reject(err);
    }

    resolve(dropboxClient);

  });
}



let saveFileQueueInterval;
let saveFileBusy = false;
let saveFileQueue = [];
let statsUpdateInterval;

async function reset(params) {

  return new Promise(function(resolve, reject){

    setTimeout(function(){ 
      console.log(chalkAlert(configuration.processPrefix + " | RESET"));
      resolve("RESET");
    }, 1000);

  });
}

async function quit(options) {

  console.log(chalkAlert( configuration.processPrefix + " | QUITTING ..." ));

  let forceQuitFlag = false;

  if (options) { 
    console.log(chalkAlert("WAS | QUIT OPTIONS\n" + jsonPrint(options) ));
    forceQuitFlag = options.force || false;
  }

  statsObj.quitFlag = true;

  statsObj.elapsed = moment().valueOf() - statsObj.startTimeMoment.valueOf();
  statsObj.timeStamp = moment().format(compactDateTimeFormat);
  statsObj.status = "QUIT";

  const caller = callerId.getData();

  console.log(chalkAlert("WAS | *** QUIT ***\n" + jsonPrint(caller) ));

  await reset("QUIT");

  if (global.dbConnection) {
    global.dbConnection.close(function () {
      console.log(chalkAlert(
        "\nWAS ==========================\n"
        + "WAS MONGO DB CONNECTION CLOSED"
        + "\nWAS ==========================\n"
      ));

    });
  }

  setTimeout(function(){  process.exit(); }, 1000);
};

let stdin;

let defaultConfiguration = {}; // general configuration for TNN
let hostConfiguration = {}; // host-specific configuration for TNN

function filesListFolderLocal(options){
  return new Promise(function(resolve, reject) {

    debug("filesListFolderLocal options\n" + jsonPrint(options));

    const fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + options.path;

    fs.readdir(fullPath, function(err, items){
      if (err) {
        return reject(err);
      }

      let itemArray = [];

      async.each(items, function(item, cb){

        itemArray.push(
          {
            name: item, 
            server_modified: false,
            content_hash: false,
            path_display: fullPath + "/" + item
          }
        );
        cb();

      }, function(err){

        const response = {
          cursor: false,
          has_more: false,
          entries: itemArray
        };

        resolve(response);
      });

    });

  });
}

function filesGetMetadataLocal(options){

  return new Promise(function(resolve, reject) {

    console.log("filesGetMetadataLocal options\n" + jsonPrint(options));

    const fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + options.path;

    fs.stat(fullPath, function(err, stats){

      if (err) {
        return reject(err);
      }
      const response = { server_modified: stats.mtimeMs };
      
      resolve(response);

    });
  });
}

function loadFile(params) {

  return new Promise(function(resolve, reject){

    console.log(chalkInfo("PATH " + params.path));

    let fullPath = params.path;

    if (configuration.offlineMode) {

      if ((configuration.hostname === "macpro2") || (configuration.hostname === "mbp2")) {
        fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + params.path;
        debug(chalkInfo("DEFAULT_OFFLINE_MODE: FULL PATH " + fullPath));
      }

      console.log(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE"
        + " | " + fullPath
      ));

      fs.readFile(fullPath, "utf8", function(err, data){

        if (fullPath.match(/\.json$/gi)) {

          const fileObj = JSONParse(data);

          if (fileObj.value) {
            resolve(fileObj.value);
          }
          else {
            reject(fileObj.error);
          }
        }
        else if (fullPath.match(/\.txt$/gi)) {

          let payload = data.fileBinary;
          if (!payload || (payload === undefined)) {
            return reject(new Error(" LOAD FILE PAYLOAD UNDEFINED"));
          }
          resolve(data.fileBinary);
        }
        else {
          resolve(null);
        }

      });

    }
    else {

      dropboxClient.filesDownload({path: fullPath})
        .then(function(data){
          console.log(chalkLog(getTimeStamp()
            + " | LOADING FILE FROM DROPBOX FILE: " + fullPath
          ));

          if (fullPath.match(/\.json$/gi)) {

            let payload = data.fileBinary;

            if (!payload || (payload === undefined)) {
              console.log(chalkError("ERROR JSON PARSE"));
              return reject(new Error(" LOAD FILE PAYLOAD UNDEFINED"));
            }

            let fileObj = JSONParse(payload);

            if (fileObj.value) {
              resolve(fileObj.value);
            }
            else {
              console.log(chalkError("ERROR JSON PARSE"));
              reject(fileObj.error);
            }
          }
          else if (fullPath.match(/\.txt$/gi)) {

            try {
              const text = data.fileBinary.toString();
              resolve(text);
            }
            catch (err){
              reject(err);
            }
          }
          else {
            resolve(null);
          }
        })
        .catch(function(err){
          reject(err);
        });

    }

  });
}

const cla = require("command-line-args");
const enableStdin = { name: "enableStdin", alias: "i", type: Boolean, defaultValue: true};
const quitNow = { name: "quitNow", alias: "K", type: Boolean};
const quitOnError = { name: "quitOnError", alias: "q", type: Boolean, defaultValue: true};
const quitOnComplete = { name: "quitOnComplete", alias: "Q", type: Boolean};
const testMode = { name: "testMode", alias: "X", type: Boolean, defaultValue: false};

const optionDefinitions = [
  enableStdin, 
  quitNow, 
  quitOnError, 
  quitOnComplete, 
  testMode
];

const commandLineConfig = cla(optionDefinitions);
console.log(chalkInfo("WAS | COMMAND LINE CONFIG\n" + jsonPrint(commandLineConfig)));
console.log("WAS | COMMAND LINE OPTIONS\n" + jsonPrint(commandLineConfig));


function loadCommandLineArgs(){

  return new Promise(function(resolve, reject){

    statsObj.status = "LOAD COMMAND LINE ARGS";

    const commandLineConfigKeys = Object.keys(commandLineConfig);

    async.each(commandLineConfigKeys, function(arg, cb){

      configuration[arg] = commandLineConfig[arg];

      console.log(" | --> COMMAND LINE CONFIG | " + arg + ": " + configuration[arg]);

      cb();

    }, function(){

      statsObj.commandLineArgsLoaded = true;

      resolve(commandLineConfig);

    });

  });
}

function getFileMetadata(params) {

  return new Promise(async function(resolve, reject){

    try {

      const response = await dropboxClient.filesGetMetadata({path: params.path});
      debug(chalkInfo("FILE META\n" + jsonPrint(response)));
      resolve(response);

    } 
    catch (err) {

      if ((err.status === 404) || (err.status === 409)) {
        console.error(chalkError("WAS | *** DROPBOX GET FILE METADATA | " + params.path + " NOT FOUND"));
      }
      if (err.status === 0) {
        console.error(chalkError("WAS | *** DROPBOX GET FILE METADATA | NO RESPONSE"));
      }

      reject(err);
    }

  });
}

function loadConfigFile(folder, file) {

  const fullPath = folder + "/" + file;

  return new Promise(async function(resolve, reject){

    try {

      if (file === configuration.defaultConfigFile) {
        prevConfigFileModifiedMoment = moment(prevDefaultConfigFileModifiedMoment);
      }
      else {
        prevConfigFileModifiedMoment = moment(prevHostConfigFileModifiedMoment);
      }

      if (configuration.offlineMode) {
        resolve(null);
      }
      else {


        const fileMetadata = await getFileMetadata({ path: fullPath });

        const fileModifiedMoment = moment(new Date(fileMetadata.server_modified));
      
        if (fileModifiedMoment.isSameOrBefore(prevConfigFileModifiedMoment)){

          console.log(chalkInfo("WAS | CONFIG FILE BEFORE OR EQUAL"
            + " | " + fullPath
            + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
            + " | " + fileModifiedMoment.format(compactDateTimeFormat)
          ));

          resolve(null);
        }
        else {

          console.log(chalkLog("WAS | +++ CONFIG FILE AFTER ... LOADING"
            + " | " + fullPath
            + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
            + " | " + fileModifiedMoment.format(compactDateTimeFormat)
          ));

          prevConfigFileModifiedMoment = moment(fileModifiedMoment);

          if (file === configuration.defaultConfigFile) {
            prevDefaultConfigFileModifiedMoment = moment(fileModifiedMoment);
          }
          else {
            prevHostConfigFileModifiedMoment = moment(fileModifiedMoment);
          }

          const path = folder + "/" + file;
          const loadedConfigObj = await loadFile({path: path});

          console.log(chalkInfo("WAS | LOADED CONFIG FILE: " + file + "\n" + jsonPrint(loadedConfigObj)));

          let newConfiguration = {};

          if (newConfiguration.testMode) {
          }

          if (loadedConfigObj.TEST_MODE !== undefined) {
            console.log("WAS | LOADED TEST_MODE: " + loadedConfigObj.TEST_MODE);
            newConfiguration.testMode = loadedConfigObj.TEST_MODE;
          }

          if (loadedConfigObj.QUIT_ON_COMPLETE !== undefined) {
            console.log("WAS | LOADED QUIT_ON_COMPLETE: " + loadedConfigObj.QUIT_ON_COMPLETE);
            if ((loadedConfigObj.QUIT_ON_COMPLETE === true) || (loadedConfigObj.QUIT_ON_COMPLETE === "true")) {
              newConfiguration.quitOnComplete = true;
            }
            if ((loadedConfigObj.QUIT_ON_COMPLETE === false) || (loadedConfigObj.QUIT_ON_COMPLETE === "false")) {
              newConfiguration.quitOnComplete = false;
            }
          }

          if (loadedConfigObj.VERBOSE !== undefined) {
            console.log("WAS | LOADED VERBOSE: " + loadedConfigObj.VERBOSE);
            if ((loadedConfigObj.VERBOSE === true) || (loadedConfigObj.VERBOSE === "true")) {
              newConfiguration.verbose = true;
            }
            if ((loadedConfigObj.VERBOSE === false) || (loadedConfigObj.VERBOSE === "false")) {
              newConfiguration.verbose = false;
            }
          }

          if (loadedConfigObj.KEEPALIVE_INTERVAL !== undefined) {
            console.log("WAS | LOADED KEEPALIVE_INTERVAL: " + loadedConfigObj.KEEPALIVE_INTERVAL);
            newConfiguration.keepaliveInterval = loadedConfigObj.KEEPALIVE_INTERVAL;
          }

          resolve(newConfiguration);
        }
          

      }
    }
    catch (err) {
      console.log(chalkError("WAS | *** LOAD CONFIG FILE ERROR STATUS: " + err.status));
      if ((err.status === 404) || (err.status === 409)) {
        console.error(chalkError("WAS | *** DROPBOX LOAD CONFIG FILE ERROR | " + fullPath + " NOT FOUND"));
      }
      if (err.status === 0) {
        console.error(chalkError("WAS | *** DROPBOX LOAD CONFIG FILE ERROR | " + fullPath + " | NO RESPONSE"));
      }
      reject(err);
    }
  });
}

function loadAllConfigFiles(){
  return new Promise(async function(resolve, reject){

    statsObj.status = "LOAD CONFIG";

    console.log(chalkInfo("WAS | LOAD ALL DEFAULT " + configuration.defaultConfigFolder + "/" + configuration.defaultConfigFile));


    async.parallel({

      loadedDefaultConfig: function(cb){

        loadConfigFile(configuration.defaultConfigFolder, configuration.defaultConfigFile)
          .then(function(defaultConfig){
            defaultConfiguration = defaultConfig;
            cb();
          })
          .catch(function(err){
            cb();
          });
      },

      loadedHostConfig: function(cb){

        loadConfigFile(configuration.hostConfigFolder, configuration.hostConfigFile)
          .then(function(hostConfig){
            hostConfiguration = hostConfig;
            cb();
          })
          .catch(function(err){
            cb();
          });
      },

    },
    function(err, results){
      if (err) {
        return reject(err);
      }

      const defaultAndHostConfig = merge(defaultConfiguration, hostConfiguration);
      const tempConfig = merge(configuration, defaultAndHostConfig); 

      configuration = tempConfig;

      resolve(configuration);
    });   
  });
}

function loadDropboxFolder(params){
  return new Promise(async function(resolve, reject){

    let results = [];

    statsObj.status = "LOAD DROPBOX FOLDER | " + params.folder;

    console.log(chalkInfo("WAS | LOAD DROPBOX FOLDER " + params.folder));

    dropboxClient.filesListFolder({path: params.folder, limit: DROPBOX_LIST_FOLDER_LIMIT, recursive: true})
    .then(function(response){

      debug(chalkLog("WAS | DROPBOX LIST FOLDER"
        + " | ENTRIES: " + response.entries.length
        // + " | CURSOR (trunc): " + response.cursor.substr(-10)
        + " | MORE: " + response.has_more
        + " | FOLDER:" + params.folder
      ));

      async.each(response.entries, function(entry, cb){

        if (entry[".tag"] === "file") {

          results.push(entry);

          console.log(chalkInfo("WAS | DROPBOX FILE"
            + " | " + entry.path_display
            + " | TAG: " + entry[".tag"]
            + " | LAST MOD: " + moment(new Date(entry.server_modified)).format(compactDateTimeFormat)
            + " | " + entry.name
          ));
        }

        if (entry[".tag"] === "folder") {
          console.log(chalkInfo("WAS | DROPBOX FOLDER"
            + " | " + entry.path_display
            + " | TAG: " + entry[".tag"]
            + " | " + entry.name
          ));
        }


        cb();

      }, function(err){
        if (err) {
          console.error(err);
          console.log(chalkError("WAS | *** DROPBOX FILES LIST FOLDER ERROR: " + err));
          return reject(err);
        }
        resolve(results);
      });
    })
    .catch(function(err){
      console.log(chalkError("WAS | *** DROPBOX FILES LIST FOLDER ERROR: " + err));
      return reject(err);
    });

  });
}

function closeDbConnection(){

  return new Promise(async function (resolve, reject){

    statsObj.status = "CLOSE DB CONNECTION";

    if (global.dbConnection) {

      global.dbConnection.close(function () {

        statsObj.db.connected = false;

        console.log(chalkAlert(
          "\nWAS | ==========================\n"
          + "WAS | MONGO DB CONNECTION CLOSED"
          + "\nWAS | ==========================\n"
        ));

        resolve();

      });
    }
    else {
      resolve();
    }

  });
}

function resetConfiguration(){

  return new Promise(async function (resolve, reject){

    statsObj.status = "RESET CONFIGURATION";

    configuration = deepcopy(DEFAULT_CONFIGURATION);

    resolve();

  });
}

function reporter(event, oldState, newState) {

  statsObj.fsmState = newState;

  fsmPreviousState = oldState;

  console.log(chalkBlue("WAS | --------------------------------------------------------\n"
    + "WAS | << FSM MAIN >>"
    + " | " + getTimeStamp()
    + " | " + event
    + " | " + fsmPreviousState
    + " -> " + newState
    + "\nWAS | --------------------------------------------------------"
  ));
}

function fsmEvent(event, delay){

  if (delay === "random") { delay = randomInt(configuration.randomEvenDelayMin,configuration.randomEvenDelayMax); }

  setTimeout(function(){

    console.log(chalkLog("WAS | -> FSM EVENT " + event + " | DELAY: " + delay + " SECS"));

    fsmMain[event]();

  }, delay*1000);
}

function fsmEventOR(eventArray, delay){
  const event = randomItem(eventArray);
  fsmEvent(event, delay);
}

const fsmStates = {

  "START":{

    onEnter: function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 
      }
    },

    fsm_tick: function() {
    },

    "fsm_reset": "RESET",
    "fsm_save": "SAVE",
    "fsm_exit": "EXIT",
    "fsm_error": "ERROR",
    "fsm_pause": "PAUSE",
    "fsm_init": "INIT",
    "fsm_idle": "IDLE"
  },

  "RESET":{

    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 

        await closeDbConnection();

        fsmEvent("fsm_idle", 1);
      }
    },

    fsm_tick: function() {
    },

    "fsm_exit": "EXIT",
    "fsm_init": "INIT",
    "fsm_error": "ERROR",
    "fsm_pause": "PAUSE",
    "fsm_idle": "IDLE"
  },

  "IDLE":{
    onEnter: function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState);
        fsmEvent("fsm_init", 1);
      }
    },

    fsm_tick: function() {
    },
    "fsm_exit": "EXIT",
    "fsm_init": "INIT",
    "fsm_error": "ERROR"
  },

  "ERROR":{
    onEnter: function(event, oldState, newState) {
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState);
        fsmEvent("fsm_reset", "random");
      }
    },
    "fsm_exit": "EXIT",
    "fsm_run_complete": "RUN_COMPLETE",
    "fsm_reset": "RESET"
  },

  "INIT":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 

        try {
          await initCaches();
          global.dbConnection = await initDb(configuration.db);
          bestNetworkObj = await loadBestRuntimeNetwork();
          tweetParser = await initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
          await initHttpServer(configApp);
          fsmEvent("fsm_ready", 1);
        }
        catch(err){
          console.log(chalkError("WAS | *** ERROR FSM INIT: " + err));
          fsmEvent("fsm_error", 1);
        }
      }

    },
    fsm_tick: function() {
    },
    "fsm_exit": "EXIT",
    "fsm_idle": "IDLE",
    "fsm_error": "ERROR",
    "fsm_run_complete": "RUN_COMPLETE",
    "fsm_save": "SAVE",
    "fsm_ready": "READY",
    "fsm_reset": "RESET"
  },

  "READY":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 

        try {
          await initWatch({ listOfFiles: [], listOfDirectories: configuration.watchFolderArray });
        }
        catch(err){
          console.log(chalkError("WAS | *** ERROR FSM INIT: " + jsonPrint(err.error)));
          console.error(err);
        }

        fsmEvent("fsm_run", 1);
      }
    },
    fsm_tick: function() {
    },
    "fsm_exit": "EXIT",
    "fsm_run": "RUN",
    "fsm_idle": "IDLE",
    "fsm_init": "INIT",
    "fsm_pause": "PAUSE",
    "fsm_run_complete": "RUN_COMPLETE",
    "fsm_save": "SAVE",
    "fsm_error": "ERROR",
    "fsm_reset": "RESET"
  },

  "RUN":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 
        // initTalkTextInterval({ interval: configuration.talkTextInterval });
        // initRandomTalkInterval({ interval: configuration.randomTalkInterval });
        // talkTextQueue.push(configuration.greetingText);
      }
    },
    fsm_tick: function() {
    },
    "fsm_exit": "EXIT",
    "fsm_idle": "IDLE",
    "fsm_init": "INIT",
    "fsm_pause": "PAUSE",
    "fsm_run_complete": "RUN_COMPLETE",
    "fsm_save": "SAVE",
    "fsm_error": "ERROR",
    "fsm_reset": "RESET"
  },

  "PAUSE":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 
      }
    },
    fsm_tick: function() {
    },
    "fsm_exit": "EXIT",
    "fsm_idle": "IDLE",
    "fsm_init": "INIT",
    "fsm_run": "RUN",
    "fsm_run_complete": "RUN_COMPLETE",
    "fsm_save": "SAVE",
    "fsm_error": "ERROR",
    "fsm_reset": "RESET"
  },

  "RUN_COMPLETE":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 
      }
    },
    fsm_tick: function() {
    },
    "fsm_exit": "EXIT",
    "fsm_idle": "IDLE",
    "fsm_init": "INIT",
    "fsm_pause": "PAUSE",
    "fsm_run": "RUN",
    "fsm_save": "SAVE",
    "fsm_exit": "EXIT",
    "fsm_error": "ERROR",
    "fsm_reset": "RESET"
  },

  "SAVE":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState); 
      }
    },
    fsm_tick: function() {
    },
    "fsm_idle": "IDLE",
    "fsm_run_complete": "RUN_COMPLETE",
    "fsm_pause": "PAUSE",
    "fsm_init": "INIT",
    "fsm_ready": "READY",
    "fsm_run": "RUN",
    "fsm_exit": "EXIT",
    "fsm_error": "ERROR",
    "fsm_reset": "RESET"
  },

  "EXIT":{
    onEnter: async function(event, oldState, newState) { 
      if (event !== "fsm_tick") {
        reporter(event, oldState, newState);

        requestTextToSpeech.input.text = "QUITTING!";

        talkText(requestTextToSpeech);

        quit({source: "FSM EXIT"});
      }
    },
    fsm_tick: function() {
    }
  },
};

fsmMain = Stately.machine(fsmStates);

function initFsmTickInterval(interval) {

  console.log(chalkInfo("WAS | INIT FSM TICK INTERVAL | " + msToTime(interval)));

  clearInterval(fsmTickInterval);

  fsmTickInterval = setInterval(function() {
    fsmMain.fsm_tick();
  }, interval);
}

reporter("WAS | START", "---", fsmMain.getMachineState());

console.log("\n\nWAS =================================");
console.log("WAS | HOST:          " + configuration.hostname);
console.log("WAS | PROCESS TITLE: " + configuration.processTitle);
console.log("WAS | PROCESS ID:    " + process.pid);
console.log("WAS | RUN ID:        " + configuration.runId);
console.log("WAS | PROCESS ARGS   " + util.inspect(process.argv, {showHidden: false, depth: 1}));
console.log("WAS =================================");

process.on("exit", function() {
});

process.on("message", function(msg) {
  if ((msg === "SIGINT") || (msg === "shutdown")) {
    clearInterval(statsUpdateInterval);
    setTimeout(function() {
      console.log(chalkAlert("WAS | QUITTING"));
      quit({source: "PROCESS: " + msg});
    }, 1000);
  }
});

function showStats(options) {

  statsObj.children.numChildren = Object.keys(childHashMap).length;

  if (options) {
    console.log("WAS | STATS\n" + jsonPrint(statsObj));
  }
  else {

    console.log(chalkLog("WAS"
      + " | FSM: " + fsmMain.getMachineState()
      + " | S: " + statsObj.startTimeMoment.format(compactDateTimeFormat)
      + " | N: " + getTimeStamp()
      + " | E: " + msToTime(statsObj.elapsed)
    ));

  }
}

process.on( "SIGINT", function() {
  quit({source: "SIGINT"});
});

function saveFile (params, callback){

  let fullPath = params.folder + "/" + params.file;

  debug(chalkInfo("LOAD FOLDER " + params.folder));
  debug(chalkInfo("LOAD FILE " + params.file));
  debug(chalkInfo("FULL PATH " + fullPath));

  let options = {};

  if (params.localFlag) {

    const objSizeMBytes = sizeof(params.obj)/ONE_MEGABYTE;

    showStats();
    console.log(chalkBlue("WAS | ... SAVING DROPBOX LOCALLY"
      + " | " + objSizeMBytes.toFixed(3) + " MB"
      + " | " + fullPath
    ));

    writeJsonFile(fullPath, params.obj, { mode: 0o777 })
    .then(function() {

      console.log(chalkBlue("WAS | SAVED DROPBOX LOCALLY"
        + " | " + objSizeMBytes.toFixed(3) + " MB"
        + " | " + fullPath
      ));
      if (callback !== undefined) { return callback(null); }

    })
    .catch(function(err){
      console.trace(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
        + " | !!! ERROR DROBOX LOCAL JSON WRITE | FILE: " + fullPath 
        + " | ERROR: " + err
        + " | ERROR\n" + jsonPrint(err)
      ));
      if (callback !== undefined) { return callback(err); }
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
      .catch(function(err){
        if (err.status === 413){
          console.error(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: 413"
            + " | ERROR: FILE TOO LARGE"
          ));
          if (callback !== undefined) { return callback(err); }
        }
        else if (err.status === 429){
          console.error(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: TOO MANY WRITES"
          ));
          if (callback !== undefined) { return callback(err); }
        }
        else if (err.status === 500){
          console.error(chalkError(" | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: DROPBOX SERVER ERROR"
          ));
          if (callback !== undefined) { return callback(err); }
        }
        else {
          console.trace(chalkError("WAS | " + moment().format(compactDateTimeFormat) 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: " + err
          ));
          if (callback !== undefined) { return callback(err); }
        }
      });
    };

    if (options.mode === "add") {

      dropboxClient.filesListFolder({path: params.folder, limit: DROPBOX_LIST_FOLDER_LIMIT})
      .then(function(response){

        debug(chalkLog("WAS | DROPBOX LIST FOLDER"
          + " | ENTRIES: " + response.entries.length
          // + " | CURSOR (trunc): " + response.cursor.substr(-10)
          + " | MORE: " + response.has_more
          + " | PATH:" + options.path
        ));

        let fileExits = false;

        async.each(response.entries, function(entry, cb){

          console.log(chalkInfo("WAS | DROPBOX FILE"
            + " | " + params.folder
            + " | LAST MOD: " + moment(new Date(entry.server_modified)).format(compactDateTimeFormat)
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
              return callback(err, null);
            }
            return;
          }
          if (fileExits) {
            console.log(chalkAlert("WAS | ... DROPBOX FILE EXISTS ... SKIP SAVE | " + fullPath));
            if (callback !== undefined) { callback(err, null); }
          }
          else {
            console.log(chalkAlert("WAS | ... DROPBOX DOES NOT FILE EXIST ... SAVING | " + fullPath));
            dbFileUpload();
          }
        });
      })
      .catch(function(err){
        console.log(chalkError("WAS | *** DROPBOX FILES LIST FOLDER ERROR: " + err));
        // console.log(chalkError("WAS | *** DROPBOX FILES LIST FOLDER ERROR\n" + jsonPrint(err)));
        if (callback !== undefined) { callback(err, null); }
      });
    }
    else {
      dbFileUpload();
    }
  }
}

function initSaveFileQueue() {

  console.log(chalkBlue("WAS | INIT DROPBOX SAVE FILE INTERVAL | " + configuration.saveFileQueueInterval + " MS"));

  clearInterval(saveFileQueueInterval);

  saveFileQueueInterval = setInterval(function () {

    if (!saveFileBusy && saveFileQueue.length > 0) {

      saveFileBusy = true;

      const saveFileObj = saveFileQueue.shift();

      saveFile(saveFileObj, function(err) {
        if (err) {
          console.log(chalkError("WAS | *** SAVE FILE ERROR ... RETRY"
            + " | " + saveFileObj.folder + "/" + saveFileObj.file
          ));
          saveFileQueue.push(saveFileObj);
        }
        else {
          console.log(chalkLog("WAS"
            + " | SAVED FILE [Q: " + saveFileQueue.length + "] " + saveFileObj.folder + "/" + saveFileObj.file
          ));
        }
        saveFileBusy = false;
      });

    }
  }, configuration.saveFileQueueInterval);
}

function initDb(config){

  let name = config.name || configuration.db.name;
  name = name + "_" + getTimeStamp();

  const batchSize = config.batchSize || configuration.db.batchSize;

  return new Promise(async function (resolve, reject){

    statsObj.status = "INIT MONGO DB | " + name;

    try {

      wordAssoDb.connect(name, function(err, db){

        if (err) {
          console.log(chalkError("WAS | ***  | MONGO DB CONNECTION ERROR | " + name + " | " + err));
          statsObj.db.connected = false;
          return reject(err);
        }

        db.on("error", function(){
          console.log(chalkError("WAS | NAME: " + name + " | *** MONGO DB CONNECTION ERROR ***\n"));
          db.close();
          statsObj.db.connected = false;
        });

        db.on("disconnected", function(){
          console.log(chalkAlert("WAS | NAME: " + name + " | *** MONGO DISCONNECTED ***\n"));
          statsObj.db.connected = false;
        });

        console.log(chalk.green("WAS | NAME: " + name + " | MONGOOSE DEFAULT CONNECTION OPEN"));

        Emoji = mongoose.model("Emoji", emojiModel.EmojiSchema);
        Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
        Media = mongoose.model("Media", mediaModel.MediaSchema);
        NeuralNetwork = mongoose.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
        Place = mongoose.model("Place", placeModel.PlaceSchema);
        Tweet = mongoose.model("Tweet", tweetModel.TweetSchema);
        Url = mongoose.model("Url", urlModel.UrlSchema);
        User = mongoose.model("User", userModel.UserSchema);
        Word = mongoose.model("Word", wordModel.WordSchema);

        async.parallel({
          countEmoji: function(cb){
            Emoji.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("WAS | " + "*** ERROR INIT DB | COUNT EMOJI: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " EMOJI"));
              cb();
            });
          },
          countHashtags: function(cb){
            Hashtag.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("WAS | " + "*** ERROR INIT DB | COUNT HASHTAGS: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " HASHTAGS"));
              cb();
            });
          },
          countMedia: function(cb){
            Media.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT MEDIA: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " MEDIA"));
              cb();
            });
          },
          countNeuralNetworks: function(cb){
            NeuralNetwork.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT NETWORKS: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " NETWORKS"));
              cb();
            });
          },
          countPlaces: function(cb){
            Place.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT PLACES: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " PLACES"));
              cb();
            });
          },
          countTweets: function(cb){
            Tweet.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT TWEETS: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " TWEETS"));
              cb();
            });
          },
          countUrls: function(cb){
            Url.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT URLS: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " URLS"));
              cb();
            });
          },
          countUsers: function(cb){
            User.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT USERS: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " USERS"));
              cb();
            });
          },
          countWords: function(cb){
            Word.countDocuments({}, function (err, count) {
              if (err) {
                console.log(chalkError("*** ERROR INIT DB | COUNT WORDS: " + err));
                return cb(err);
              }
              console.log(chalkLog("WAS | " + count + " WORDS"));
              cb();
            });
          },
        },
        function(err, results){
          if (err) {
            statsObj.db.err = err;
            return reject(err);
          }

          statsObj.db.connected = true;
          resolve(db);
        });   

      });

    }
    catch (err) {
      console.log(chalkError("*** ERROR INIT DB: " + err));
      statsObj.db.err = err;
      statsObj.status = "INIT DB ERROR";
      reject(err);
    }


  });
}

function initWatch(params){

  wp.watch(params.listOfFiles, params.listOfDirectories, Date.now() + 10000);

  wp.on("change", function(filePath, mtime) {

    console.log(chalkAlert("> DOC FILE CHANGE | " + filePath));

    if (!filePath.endsWith(".txt")) { return; }

    const dropboxPath = filePath.replace("/Users/tc/Dropbox/Apps/wordAssociation", "");

    setTimeout(function(){
      
      // wait for dropbox filesystem to save new files

      if (dropboxPath.includes("doc/triggers")) {

        let loadParams = {};
        loadParams.path = dropboxPath;

        if (dropboxPath.includes("triggerWords")) { loadParams.triggerWords = true; }
        if (dropboxPath.includes("triggerPhrases")) { loadParams.triggerPhrases = true; }

        loadTrigger(loadParams)
          .then(function(text){
            console.log(chalkInfo("TRIGGER TEXT\n" + text));
          })
          .catch(function(err){
            console.log(chalkError("*** ERROR LOAD TRIGGER ON CHANGE | " + filePath + " | ERROR: " + err));
          });

      }
      if (dropboxPath.includes("doc/speeches") || dropboxPath.includes("doc/sentences")) {

        loadDoc({ path: dropboxPath })
          .then(function(){

          })
          .catch(function(err){
            console.log(chalkError("*** ERROR LOAD DOC ON CHANGE | " + filePath + " | ERROR: " + err));
          });

      }

    }, 5000);

  });

  wp.on("aggregated", function(changes) {
    if (configuration.verbose) { console.log(chalkAlert("> DOC FILE CHANGE | AGGREGATED\n" + jsonPrint(changes)));}
  });
}

function initStatsUpdate(callback) {

  console.log(chalkInfo("WAS | INIT STATS UPDATE INTERVAL | " + configuration.statsUpdateIntervalTime + " MS"));

  statsObj.elapsed = moment().valueOf() - statsObj.startTimeMoment.valueOf();
  statsObj.timeStamp = moment().format(compactDateTimeFormat);

  clearInterval(statsUpdateInterval);

  statsUpdateInterval = setInterval(function () {

    statsObj.elapsed = moment().valueOf() - statsObj.startTimeMoment.valueOf();
    statsObj.timeStamp = moment().format(compactDateTimeFormat);

    showStats();
    
  }, configuration.statsUpdateIntervalTime);

  if (callback !== undefined) { callback(null); }
}

function toggle(setting){

  configuration[setting] = !configuration[setting];

  console.log(chalkAlert("WAS | " + setting.toUpperCase() + ": " + configuration[setting]));
}

function initStdIn() {
  console.log("STDIN ENABLED");
  stdin = process.stdin;
  if(stdin.setRawMode !== undefined) {
    stdin.setRawMode( true );
  }
  stdin.resume();
  stdin.setEncoding( "utf8" );
  stdin.on( "data", function( key ) {
    switch (key) {
      case "a":
        abortCursor = true;
        console.log(chalkAlert("WAS | ABORT: " + abortCursor));
      break;

      case "K":
        quit({force: true, source: "STDIN"});
      break;

      case "q":
      case "Q":
        quit({source: "STDIN"});
      break;

      case "s":
        showStats();
      break;

      case "S":
        showStats(true);
      break;

      case "v":
        toggleVerbose();
      break;

      default:
        console.log(chalkInfo(
          "\n" + "q/Q: quit"
          + "\n" + "s: showStats"
          + "\n" + "S: showStats verbose"
          + "\n" + "v: toggle verbose"
        ));
    }
  });
}

function initConfig(cnf) {

  console.log(chalkInfo("INIT CONFIG"));

  return new Promise(async function(resolve, reject){

    try {

      statsObj.status = "INITIALIZE";

      if (debug.enabled) {
        console.log("\n%%%%%%%%%%%%%%\n DEBUG ENABLED \n%%%%%%%%%%%%%%\n");
      }

      cnf.processName = process.env.PROCESS_NAME || DEFAULT_CONFIGURATION.processName;
      cnf.targetServer = process.env.UTIL_TARGET_SERVER || DEFAULT_CONFIGURATION.targetServer;
      cnf.testMode = (process.env.TEST_MODE === "true") ? true : cnf.testMode;

      if (cnf.testMode) {
        console.log(chalkAlert("WAS | TEST MODE"));
      }

      cnf.quitOnError = process.env.QUIT_ON_ERROR || false ;

      if (process.env.QUIT_ON_COMPLETE === "false") {
        cnf.quitOnComplete = false;
      }
      else if ((process.env.QUIT_ON_COMPLETE === true) || (process.env.QUIT_ON_COMPLETE === "true")) {
        cnf.quitOnComplete = true;
      }

      cnf.enableStdin = process.env.ENABLE_STDIN || true ;

      cnf.statsUpdateIntervalTime = process.env.STATS_UPDATE_INTERVAL || ONE_MINUTE;

      dropboxClient = await initDropbox(cnf.dropbox);

      let allConfigLoaded = await loadAllConfigFiles();
      let commandLineConfigLoaded = await loadCommandLineArgs();

      statsObj.commandLineArgsLoaded = true;

      if (configuration.enableStdin) { initStdIn(); }

      configuration.child.db = configuration.db;
      configuration.child.dropbox = configuration.dropbox;

      resolve(configuration);

    }
    catch (err) {
      console.log(chalkError("WAS | *** ERROR INIT CONFIG: " + err));
      statsObj.status = "INIT CONFIG ERROR";
      reject(err);
    }
  });
}

function initPassport(params){

  return new Promise(async function(resolve, reject) {

    passport.use(new TwitterStrategy(
      {
        consumerKey: altthreecee00config.consumer_key,
        consumerSecret: altthreecee00config.consumer_secret,
        callbackURL: TWITTER_AUTH_CALLBACK_URL
      },
      function(token, tokenSecret, profile, callback) {

        console.log(chalkAlert("TWITTER AUTH\nprofile\n" + jsonPrint(profile)));

        const rawUser = profile._json;

        userServerController.convertRawUser({user:rawUser}, function(err, user){

          if (err) {
            console.log(chalkError("*** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
            return reject(err);
          }

          printUserObj("TWITTER AUTH USER", user);

          userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

            if (err) {
              console.log(chalkError("findOneUser ERROR: " + err));
              return reject(err);
            }

            console.log(chalk.blue("UPDATED updatedUser"
              + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
              + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
              + "\n" + printUser({user:updatedUser})
            ));

            passport.use(new LocalStrategy(
              function(username, password, done) {

                console.log(chalkAlert("*** LOGIN *** | " + username));

                User.findOne({ screenName: username.toLowerCase() }, function (err, user) {
                  if (err) { 
                    console.log(chalkAlert("*** LOGIN USER DB ERROR *** | " + err));
                    return done(err);
                  }
                  if (!user) {
                    console.log(chalkAlert("*** LOGIN FAILED | USER NOT FOUND *** | " + username));
                    return done(null, false, { message: 'Incorrect username.' });
                  }
                  if ((user.screenName !== "threecee") || (password !== "what")) {
                    console.log(chalkAlert("*** LOGIN FAILED | INVALID PASSWORD *** | " + username));
                    return done(null, false, { message: 'Incorrect password.' });
                  }
                  return done(null, user);
                });
              }
            ));

            passport.serializeUser(function(user, done) { done(null, user.nodeId); });

            passport.deserializeUser(function(nodeId, done) {
              User.findOne({nodeId: nodeId}, function(err, user) {
                done(err, user);
              });
            });

            resolve(updatedUser);
          });
        });
      }
    ));

  });

}

function startFsmMain(){
  initFsmTickInterval(FSM_TICK_INTERVAL)
  console.log(chalkBlue("WAS | +++ START FSM MAIN | " + getTimeStamp()));
  fsmEvent("fsm_reset", "random");
}

function initTweetParserPingInterval(interval){

  clearInterval(tweetParserPingInterval);

  tweetParserPingSent = false;
  tweetParserPongReceived = false;

  let tweetParserPingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child) {

    tweetParserPingInterval = setInterval(function(){

      if (!tweetParserPingSent) {

        tweetParserPingId = moment().valueOf();

        childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({op: "PING", pingId: tweetParserPingId}, function(err){

          tweetParserPingSent = true; 

          if (err) {

            console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, async function(err, numKilled){
              tweetParserPongReceived = false;
              tweetParser = await initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(tweetParserPingId))); }

        });

      }
      else if (tweetParserPingSent && tweetParserPongReceived) {

        tweetParserPingId = moment().valueOf();

        tweetParserPingSent = false; 
        tweetParserPongReceived = false;

        childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({op: "PING", pingId: tweetParserPingId}, function(err){

          if (err) {

            console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, async function(err, numKilled){
              tweetParserPongReceived = false;
              tweetParser = await initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(tweetParserPingId))); }

          tweetParserPingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("*** PONG TIMEOUT | TWEET_PARSER"
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tweetParserPingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tweetParserPingId)
        ));
        
        slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\nTWEET_PARSER\nPONG TIMEOUT");

        clearInterval(tweetParserPingInterval);

        tweetParserPingSent = false; 
        tweetParserPongReceived = false;

        setTimeout(function(){

          killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, async function(err, numKilled){
          tweetParser = await initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
          });

        }, 5000);
      }
    }, interval);

  }
}

function initTweetParser(params){

  return new Promise(async function(resolve, reject) {

    console.log(chalk.bold.black("INIT TWEET PARSER\n" + jsonPrint(params)));

    clearInterval(tweetParserPingInterval);
    tweetParserPongReceived = false;

    statsObj.tweetParserReady = false;

    try{

      const twp = await cp.fork(`${__dirname}/js/libs/tweetParser.js`);

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

        if (m.op === "PONG"){

          tweetParserPongReceived = m.pongId;

          childrenHashMap[params.childId].status = "RUNNING";

          if (configuration.verbose) {
            console.log(chalkInfo("<PONG | TWEET PARSER"
              + " | NOW: " + getTimeStamp()
              + " | PONG ID: " + getTimeStamp(m.pongId)
              + " | RESPONSE TIME: " + msToTime((moment().valueOf() - m.pongId))
            ));
          }
        } 

        else if (tweetParserMessageRxQueue.length < configuration.maxQueue){
          tweetParserMessageRxQueue.push(m);
        }
      });

      twp.on("error", function tweetParserError(err){
        console.log(chalkError(getTimeStamp()
          + " | *** TWEET PARSER ERROR ***"
          + " \n" + jsonPrint(err)
        ));
        statsObj.tweetParserSendReady = false;
        statsObj.tweetParserReady = false;
        clearInterval(tweetParserPingInterval);
        childrenHashMap[params.childId].status = "ERROR";
      });

      twp.on("exit", function tweetParserExit(code){
        console.log(chalkError(getTimeStamp()
          + " | *** TWEET PARSER EXIT ***"
          + " | EXIT CODE: " + code
        ));
        statsObj.tweetParserSendReady = false;
        statsObj.tweetParserReady = false;
        clearInterval(tweetParserPingInterval);
        childrenHashMap[params.childId].status = "EXIT";
      });

      twp.on("close", function tweetParserClose(code){
        console.log(chalkError(getTimeStamp()
          + " | *** TWEET PARSER CLOSE ***"
          + " | EXIT CODE: " + code
        ));
        statsObj.tweetParserSendReady = false;
        statsObj.tweetParserReady = false;
        clearInterval(tweetParserPingInterval);
        childrenHashMap[params.childId].status = "CLOSE";
      });

      childrenHashMap[params.childId].child = twp;

      statsObj.tweetParserReady = true;

      twp.send({
        op: "INIT",
        title: "wa_node_tweetParser",
        networkObj: bestNetworkObj,
        maxInputHashMap: maxInputHashMap,
        normalization: normalization,
        // interval: TWEET_PARSER_INTERVAL,
        interval: configuration.tweetParserInterval,
        verbose: false
      }, function tweetParserMessageRxError(err){
        if (err) {
          console.log(chalkError("*** TWEET PARSER SEND ERROR"
            + " | " + err
          ));
          statsObj.tweetParserSendReady = false;
          statsObj.tweetParserReady = false;
          clearInterval(tweetParserPingInterval);
          childrenHashMap[params.childId].status = "ERROR";
          reject(err);
        }
        else {
          statsObj.tweetParserSendReady = true;
          statsObj.tweetParserReady = true;
          childrenHashMap[params.childId].status = "INIT";
          clearInterval(tweetParserPingInterval);
          setTimeout(function(){
            initTweetParserPingInterval(DEFAULT_PING_INTERVAL);
          }, 1000);
          resolve(twp);
        }
      });
    }
    catch(err){
      console.log(chalkError("*** TWEET PARSER INIT ERROR: " + err));
      reject(err);
    }

  });
}

function loadBestRuntimeNetwork(){

  return new Promise(async function(resolve, reject) {

    console.log(chalkLog("LOAD BEST RUNTIME NETWORK"));

    try {

      let bRtNnObj = await loadFile({path: bestRuntimeNetworkPath});
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
      const path = bestNetworkFolder + "/" + file;

      let nnObj = await loadFile({path: path});

      if (nnObj) { 
        nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
        resolve(nnObj);
      }
      else {
        NeuralNetwork.find({}).sort({"matchRate": -1}).limit(1).exec(function(err, nnArray){
          if (err){
            console.log(chalkError("*** NEURAL NETWORK FIND ERROR: " + err));
            reject(err);
          }
          else if (nnArray === 0){
            console.log(chalkError("*** NEURAL NETWORK NOT FOUND"));
            resolve(null);
          }
          else {

            nnObj = nnArray[0];

            if (nnObj.matchRate === undefined) { nnObj.matchRate = 0; }
            if (nnObj.overallMatchRate === undefined) { nnObj.overallMatchRate = 0; }

            console.log(chalk.blue("+++ BEST NEURAL NETWORK LOADED FROM DB"
              + " | " + nnObj.networkId
              + " | SR: " + nnObj.successRate.toFixed(2) + "%"
              + " | MR: " + nnObj.matchRate.toFixed(2) + "%"
              + " | OAMR: " + nnObj.overallMatchRate.toFixed(2) + "%"
            ));

            resolve(nnObj);
          }
        });
      }
    }
    catch(err){
      if (err.code === "ETIMEDOUT") {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: NETWORK TIMEOUT" 
          + " | " + bestRuntimeNetworkPath
        ));
      }
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: FILE NOT FOUND" 
          + " | " + bestRuntimeNetworkPath
        ));
      }
      else {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR"
          + " | " + err
          + " | " + bestRuntimeNetworkPath
        ));
      }
    }

  });
}

function initCaches(params){

  console.log(chalkInfo("INIT CACHES"));

  // ==================================================================
  // VIEWER CACHE
  // ==================================================================
  let viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
  if (viewerCacheTtl === undefined) { viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL;}

  console.log("VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

  let viewerCacheCheckPeriod = process.env.VIEWER_CACHE_CHECK_PERIOD;
  if (viewerCacheCheckPeriod === undefined) { viewerCacheCheckPeriod = VIEWER_CACHE_CHECK_PERIOD;}

  console.log("VIEWER CACHE CHECK PERIOD: " + viewerCacheCheckPeriod + " SECONDS");

  viewerCache = new NodeCache({
    stdTTL: viewerCacheTtl,
    checkperiod: viewerCacheCheckPeriod
  });

  function viewerCacheExpired(viewerCacheId, viewerObj) {

    console.log(chalkInfo("XXX VIEWER CACHE EXPIRED"
      + " | TTL: " + viewerCacheTtl + " SECS"
      + " | TYPE: " + viewerObj.user.type.toUpperCase()
      + " | " + viewerCacheId
      + " | USER ID: " + viewerObj.user.userId
      + "\nNOW: " + getTimeStamp()
      + " | TS: " + getTimeStamp(viewerObj.timeStamp)
      + " | AGO: " + msToTime(moment().valueOf() - viewerObj.timeStamp)
    ));


    adminNameSpace.emit("VIEWER_EXPIRED", viewerObj);
  }

  viewerCache.on("expired", viewerCacheExpired);

  // ==================================================================
  // SERVER CACHE
  // ==================================================================
  let serverCacheTtl = process.env.SERVER_CACHE_DEFAULT_TTL;
  if (serverCacheTtl === undefined) { serverCacheTtl = SERVER_CACHE_DEFAULT_TTL;}
  console.log("SERVER CACHE TTL: " + serverCacheTtl + " SECONDS");

  let serverCacheCheckPeriod = process.env.SERVER_CACHE_CHECK_PERIOD;
  if (serverCacheCheckPeriod === undefined) { serverCacheCheckPeriod = SERVER_CACHE_CHECK_PERIOD;}
  console.log("SERVER CACHE CHECK PERIOD: " + serverCacheCheckPeriod + " SECONDS");

  serverCache = new NodeCache({
    stdTTL: serverCacheTtl,
    checkperiod: serverCacheCheckPeriod
  });

  function serverCacheExpired(serverCacheId, serverObj) {

    const ttl = serverCache.getTtl(serverCacheId);

    console.log(chalkInfo("XXX SERVER CACHE EXPIRED"
      + " | TTL: " + serverCacheTtl + " SECS"
      + " | TTL: " + msToTime(serverCacheTtl*1000)
      + " | TYPE: " + serverObj.user.type.toUpperCase()
      + " | " + serverCacheId
      + " | USER ID: " + serverObj.user.userId
      + "\nNOW: " + getTimeStamp()
      + " | TS: " + getTimeStamp(serverObj.timeStamp)
      + " | AGO: " + msToTime(moment().valueOf() - serverObj.timeStamp)
    ));

    adminNameSpace.emit("SERVER_EXPIRED", serverObj);
  }

  serverCache.on("expired", serverCacheExpired);

  // ==================================================================
  // AUTH SOCKET CACHE ( for UTILs, ADMINS, VIEWERs )
  // ==================================================================
  let authenticatedSocketCacheTtl = process.env.AUTH_SOCKET_CACHE_DEFAULT_TTL;
  if (authenticatedSocketCacheTtl === undefined) { 
    authenticatedSocketCacheTtl = AUTH_SOCKET_CACHE_DEFAULT_TTL;
  }
  console.log("AUTHENTICATED SOCKET CACHE TTL"
    + " | " + authenticatedSocketCacheTtl + " SECONDS"
  );

  let authenticatedSocketCacheCheckPeriod = process.env.AUTH_SOCKET_CACHE_CHECK_PERIOD;
  if (authenticatedSocketCacheCheckPeriod === undefined) {
    authenticatedSocketCacheCheckPeriod = AUTH_SOCKET_CACHE_CHECK_PERIOD;
  }
  console.log("AUTHENTICATED SOCKET CACHE CHECK PERIOD"
    + " | " + authenticatedSocketCacheCheckPeriod + " SECONDS"
  );

  authenticatedSocketCache = new NodeCache({
    stdTTL: authenticatedSocketCacheTtl,
    checkperiod: authenticatedSocketCacheCheckPeriod
  });

  function authenticatedSocketCacheExpired(socketId, authSocketObj) {

    const ttl = authenticatedSocketCache.getTtl(socketId);

    console.log(chalkInfo("XXX AUTH SOCKET CACHE EXPIRED"
      + " | TTL: " + msToTime(authenticatedSocketCacheTtl*1000)
      + " | NSP: " + authSocketObj.namespace.toUpperCase()
      + " | " + socketId
      + " | USER ID: " + authSocketObj.userId
      + " | NOW: " + getTimeStamp()
      + " | TS: " + getTimeStamp(authSocketObj.timeStamp)
      + " | AGO: " + msToTime(moment().valueOf() - authSocketObj.timeStamp)
    ));

    authenticatedSocketCache.keys( function( err, socketIds ){
      if( !err ){
        socketIds.forEach(function(socketId){

          const authSocketObj = authenticatedSocketCache.get(socketId);

          if (authSocketObj) {

            console.log(chalkInfo("AUTH SOCKET CACHE ENTRIES"
              + " | NSP: " + authSocketObj.namespace.toUpperCase()
              + " | " + socketId
              + " | USER ID: " + authSocketObj.userId
              + " | NOW: " + getTimeStamp()
              + " | TS: " + getTimeStamp(authSocketObj.timeStamp)
              + " | AGO: " + msToTime(moment().valueOf() - authSocketObj.timeStamp)
            ));
          }
          else {
            console.log(chalkAlert("???? AUTH SOCKET CACHE NO ENTRY??? | SOCKET ID: " + socketId));
          }

        });
      }
      else {
        console.log(chalkError("*** AUTH CACHE GET KEYS ERROR: " + err));
      }
    });

    adminNameSpace.emit("AUTH_SOCKET_EXPIRED", authSocketObj);
  }

  authenticatedSocketCache.on("expired", authenticatedSocketCacheExpired);

  // ==================================================================
  // AUTH TWITTER USER CACHE
  // ==================================================================
  let authenticatedTwitterUserCacheTtl = process.env.AUTH_USER_CACHE_DEFAULT_TTL;

  if (authenticatedTwitterUserCacheTtl === undefined) { 
    authenticatedTwitterUserCacheTtl = AUTH_USER_CACHE_DEFAULT_TTL;
  }
  console.log("AUTHENTICATED TWITTER USER CACHE TTL"
    + " | " + authenticatedTwitterUserCacheTtl + " SECONDS"
  );

  let authenticatedTwitterUserCacheCheckPeriod = process.env.AUTH_USER_CACHE_CHECK_PERIOD;
  if (authenticatedTwitterUserCacheCheckPeriod === undefined) { 
    authenticatedTwitterUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;
  }
  console.log("AUTHENTICATED TWITTERUSER CACHE CHECK PERIOD" 
    + " | " + authenticatedTwitterUserCacheCheckPeriod + " SECONDS"
  );

  authenticatedTwitterUserCache = new NodeCache({
    stdTTL: authenticatedTwitterUserCacheTtl,
    checkperiod: authenticatedTwitterUserCacheCheckPeriod
  });

  function authenticatedTwitterUserCacheExpired(nodeId, userObj) {

    console.log(chalkInfo("XXX AUTH TWITTER USER CACHE EXPIRED"
      + " | TTL: " + authenticatedTwitterUserCacheTtl + " SECS"
      + " | LS: " + userObj.lastSeen
      + " | @" + userObj.screenName
    ));
  }

  authenticatedTwitterUserCache.on("expired", authenticatedTwitterUserCacheExpired);

  // ==================================================================
  // AUTH IN PROGRESS CACHE
  // ==================================================================
  let authInProgressTwitterUserCacheTtl = process.env.AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;

  if (authInProgressTwitterUserCacheTtl === undefined) { 
    authInProgressTwitterUserCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;
  }
  console.log("AUTH IN PROGRESS CACHE TTL: " + authInProgressTwitterUserCacheTtl + " SECONDS");

  let authInProgressTwitterUserCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
  if (authInProgressTwitterUserCacheCheckPeriod === undefined) { 
    authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
  }
  console.log("AUTH IN PROGRESS CACHE CHECK PERIOD"
    + " | " + authInProgressTwitterUserCacheCheckPeriod + " SECONDS"
  );

  authInProgressTwitterUserCache = new NodeCache({
    stdTTL: authInProgressTwitterUserCacheTtl,
    checkperiod: authInProgressTwitterUserCacheCheckPeriod
  });

  authInProgressTwitterUserCache.on("expired", function(nodeId, userObj){
    console.log(chalkInfo("XXX AUTH IN PROGRESS TWITTER USER CACHE EXPIRED"
      + " | TTL: " + authInProgressTwitterUserCacheTtl + " SECS"
      + " | NODE ID: " + nodeId
      + " | userObj\n" + jsonPrint(userObj)
    ));
  });

  // ==================================================================
  // NODE CACHE
  // ==================================================================
  let nodeCacheTtl = process.env.NODE_CACHE_DEFAULT_TTL;
  if (nodeCacheTtl === undefined) { nodeCacheTtl = NODE_CACHE_DEFAULT_TTL;}
  console.log("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

  let nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
  if (nodeCacheCheckPeriod === undefined) { nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD;}
  console.log("NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS");

  nodeCache = new NodeCache({
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
          + " | " + getTimeStamp()
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

  trendingCache = new NodeCache({
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

  nodesPerMinuteTopTermCache = new NodeCache({
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

  cacheObj.nodeCache = nodeCache;
  cacheObj.serverCache = serverCache;
  cacheObj.viewerCache = viewerCache;
  cacheObj.nodesPerMinuteTopTermCache = nodesPerMinuteTopTermCache;
  cacheObj.nodesPerMinuteTopTermNodeTypeCache = {};
  cacheObj.trendingCache = trendingCache;
  cacheObj.authenticatedTwitterUserCache = authenticatedTwitterUserCache;
  cacheObj.authInProgressTwitterUserCache = authInProgressTwitterUserCache;
  cacheObj.authenticatedSocketCache = authenticatedSocketCache;

  DEFAULT_NODE_TYPES.forEach(function(nodeType){
    cacheObj.nodesPerMinuteTopTermNodeTypeCache[nodeType] = nodesPerMinuteTopTermNodeTypeCache[nodeType];
  });

  let cacheObjKeys = Object.keys(cacheObj);

  return;
}


const altthreecee00config = {
  consumer_key: "0g1pAgIqe6f3LN9yjaPBGJcSL",
  consumer_secret: "op5mSFdo1jenyiTxFyED0yD2W1rmviq35qpVlgSSyIIlFPuBj7",
  access_token: "848591649575927810-EHQmRALtPJLCYhRJqI8wkAzwfkEpDri",
  access_token_secret: "ZnUrnTUtH2D2iesTjaHVqNrrEWeDU8Rj13nFQ1UI2aDjl"
};

let internetCheckInterval;

const http = require("http");
const httpServer = http.createServer(app);

const ioConfig = {
  pingInterval: DEFAULT_IO_PING_INTERVAL,
  pingTimeout: DEFAULT_IO_PING_TIMEOUT,
  reconnection: true
};

let io;

function initApp(params){
  return new Promise(async function(resolve, reject) {

    app.set('trust proxy', 1) // trust first proxy
    app.use(require("serve-static")(__dirname + "/public"));
    app.use(require("body-parser").urlencoded({ extended: true }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.get("/auth/twitter", passport.authenticate("twitter"));
    app.get("/auth/twitter/callback",
      passport.authenticate("twitter", { successRedirect: "/session", failureRedirect: "/login" })
    );

    resolve();
  });
}

initConfig(configuration)
  .then(async function(cnf){
    configuration = deepcopy(cnf);

    console.log(chalkInfo(configuration.processName
      + " STARTED " + getTimeStamp()
    ));

    initStatsUpdate();
    startFsmMain();

  })
  .catch(function(err){
    throw err;
    // console.log(chalkError("WAS | ***** INIT CONFIG ERROR ***** ", err));
    // quit({source: "INIT ERROR"});
  });

