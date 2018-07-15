/*jslint node: true */
"use strict";

global.dbConnection = false;
let dbConnectionReady = false;
let initCategoryHashmapsReady = true;

process.env.NODE_ENV = process.env.NODE_ENV || "development";


const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const DEFAULT_CONFIG_INIT_INTERVAL = process.env.DEFAULT_CONFIG_INIT_INTERVAL || ONE_MINUTE;

const DEFAULT_TEST_INTERNET_CONNECTION_URL = process.env.DEFAULT_TEST_INTERNET_CONNECTION_URL || "www.google.com";

const DEFAULT_FIND_CAT_USER_CURSOR_LIMIT = process.env.DEFAULT_FIND_CAT_USER_CURSOR_LIMIT || 100;
const DEFAULT_FIND_CAT_WORD_CURSOR_LIMIT = process.env.DEFAULT_FIND_CAT_WORD_CURSOR_LIMIT || 100;
const DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT = process.env.DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT || 100;

const DEFAULT_CURSOR_BATCH_SIZE = process.env.DEFAULT_CURSOR_BATCH_SIZE || 100;

const DEFAULT_SORTER_CHILD_ID = "wa_node_sorter";
const DEFAULT_TWEET_PARSER_CHILD_ID = "wa_node_tweetParser";

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
const CATEGORY_HASHMAPS_UPDATE_INTERVAL = process.env.CATEGORY_HASHMAPS_UPDATE_INTERVAL || ONE_MINUTE;
const HASHTAG_LOOKUP_QUEUE_INTERVAL = 2;

const MAX_SESSION_AGE = ONE_DAY/1000;  // in seconds
const MAX_Q = 200;
const OFFLINE_MODE = process.env.OFFLINE_MODE || false; // if network connection is down, will auto switch to OFFLINE_MODE
const AUTO_OFFLINE_MODE = process.env.AUTO_OFFLINE_MODE || true; // if network connection is down, will auto switch to OFFLINE_MODE

const DEFAULT_NODE_TYPES = ["emoji", "hashtag", "media", "place", "url", "user", "word"];

const compactDateTimeFormat = "YYYYMMDD HHmmss";
const tinyDateTimeFormat = "YYYYMMDDHHmmss";

const SERVER_CACHE_DEFAULT_TTL = 300; // seconds
const SERVER_CACHE_CHECK_PERIOD = 15;

const VIEWER_CACHE_DEFAULT_TTL = 300; // seconds
const VIEWER_CACHE_CHECK_PERIOD = 15;

const ADMIN_CACHE_DEFAULT_TTL = 300; // seconds
const ADMIN_CACHE_CHECK_PERIOD = 15;

const AUTH_SOCKET_CACHE_DEFAULT_TTL = 600;
const AUTH_SOCKET_CACHE_CHECK_PERIOD = 10;

const AUTH_USER_CACHE_DEFAULT_TTL = MAX_SESSION_AGE;
const AUTH_USER_CACHE_CHECK_PERIOD = ONE_HOUR/1000; // seconds

const AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL = 300;
const AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD = 5;

const TOPTERMS_CACHE_DEFAULT_TTL = 60;
const TOPTERMS_CACHE_CHECK_PERIOD = 5;

const TRENDING_CACHE_DEFAULT_TTL = 300;
const TRENDING_CACHE_CHECK_PERIOD = 60;

const NODE_CACHE_DEFAULT_TTL = 60;
const NODE_CACHE_CHECK_PERIOD = 5;


let DEFAULT_IO_PING_INTERVAL = ONE_MINUTE;
let DEFAULT_IO_PING_TIMEOUT = 3*ONE_MINUTE;

const util = require("util");
const _ = require("lodash");
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
const moment = require("moment");
const treeify = require("treeify");

const express = require("./config/express");
const app = express();

const EventEmitter2 = require("eventemitter2").EventEmitter2;
require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

const Monitoring = require("@google-cloud/monitoring");

let googleMonitoringClient;

const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");
const commandLineArgs = require("command-line-args");

const chalk = require("chalk");
const chalkTwitter = chalk.blue;
const chalkConnect = chalk.black;
const chalkSession = chalk.black;
const chalkDisconnect = chalk.black;
const chalkSocket = chalk.black;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkBlue = chalk.blue;


let configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function configEventsNewListener(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

let configuration = {};

configuration.verbose = false;

configuration.DROPBOX = {};
configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY ;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
configuration.DROPBOX.DROPBOX_WA_CONFIG_FILE = process.env.DROPBOX_WA_CONFIG_FILE || "wordAssoServerConfig.json";
configuration.DROPBOX.DROPBOX_WA_STATS_FILE = process.env.DROPBOX_WA_STATS_FILE || "wordAssoServerStats.json";

configuration.categoryHashmapsUpdateInterval = CATEGORY_HASHMAPS_UPDATE_INTERVAL;
configuration.testInternetConnectionUrl = DEFAULT_TEST_INTERNET_CONNECTION_URL;
configuration.offlineMode = OFFLINE_MODE;
configuration.autoOfflineMode = AUTO_OFFLINE_MODE;

configuration.batchSize = DEFAULT_CURSOR_BATCH_SIZE;

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

let statsObj = {};
statsObj.commandLineArgsLoaded = false;

let prevHostConfigFileModifiedMoment = moment("2010-01-01");
let prevDefaultConfigFileModifiedMoment = moment("2010-01-01");
let prevConfigFileModifiedMoment = moment("2010-01-01");

const help = { name: "help", alias: "h", type: Boolean};

const enableStdin = { name: "enableStdin", alias: "S", type: Boolean, defaultValue: true };
const quitOnComplete = { name: "quitOnComplete", alias: "q", type: Boolean };
const quitOnError = { name: "quitOnError", alias: "Q", type: Boolean, defaultValue: true };
const verbose = { name: "verbose", alias: "v", type: Boolean };
const testMode = { name: "testMode", alias: "X", type: Boolean, defaultValue: false };

const optionDefinitions = [
  enableStdin, 
  quitOnComplete, 
  quitOnError, 
  verbose, 
  testMode,
  help
];

function quit(message) {

  console.log(chalkAlert("\n... QUITTING ..."));
  let msg = "";
  if (message) {msg = message;}

  debug("QUIT MESSAGE: " + msg);

  setTimeout(function() {

    global.dbConnection.close(function () {

      console.log(chalkAlert(
        "\n==========================\n"
        + "MONGO DB CONNECTION CLOSED"
        + "\n==========================\n"
      ));

      process.exit();

    });

  }, 5000);
}


const commandLineConfig = commandLineArgs(optionDefinitions);
console.log(chalkInfo("WA | COMMAND LINE CONFIG\nWA | " + jsonPrint(commandLineConfig)));

if (Object.keys(commandLineConfig).includes("help")) {
  console.log("WA |optionDefinitions\n" + jsonPrint(optionDefinitions));
  quit("help");
}

let adminNameSpace;
let utilNameSpace;
let userNameSpace;
let viewNameSpace;

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



// let dropboxConfigDefaultFolder = "/config/utility/default";
let dropboxConfigTwitterFolder = "/config/twitter";

const DEFAULT_TWITTER_CONFIG_FILE = "altthreecee02.json";
const DEFAULT_TWITTER_AUTO_FOLLOW_CONFIG_FILE = "altthreecee02.json";

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


let maxInputHashMapFile = "maxInputHashMap.json";

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
const shell = require("shelljs");
const JSONParse = require("json-parse-safe");

const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const deepcopy = require("deep-copy");
const sizeof = require("object-sizeof");
const writeJsonFile = require("write-json-file");

const session = require("express-session");
const MongoDBStore = require("express-session-mongo");

const slackOAuthAccessToken = "xoxp-3708084981-3708084993-206468961315-ec62db5792cd55071a51c544acf0da55";
const slackChannel = "#was";
const slackChannelAutoFollow = "#wasAuto";
const slackErrorChannel = "#wasError";
const Slack = require("slack-node");
let slack = false;

let unfollowableUserSet = new Set();

process.title = "node_wordAssoServer";
console.log("\n\n============== START ==============\n\n");

console.log(chalkAlert("PROCESS PID:   " + process.pid));
console.log(chalkAlert("PROCESS TITLE: " + process.title));
console.log(chalkAlert("ENVIRONMENT: " + process.env.NODE_ENV));

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================


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


const categorizedUserHashMap = new HashMap();
const categorizedWordHashMap = new HashMap();
const categorizedHashtagHashMap = new HashMap();
const metricsHashmap = new HashMap();
// const deletedMetricsHashmap = new HashMap();

const Twit = require("twit");
let twit = false;
let twitAutoFollow = false;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const tweetMeter = new Measured.Meter({rateUnit: 60000});

let languageServer = {};


let adminHashMap = new HashMap();
// let serverHashMap = new HashMap();
let viewerHashMap = new HashMap();

const globalNodeMeter = new Measured.Meter({rateUnit: 60000});

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



// ==================================================================
// DROPBOX
// ==================================================================
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

let dropboxConfigFolder = "/config/utility";
let dropboxConfigDefaultFolder = "/config/utility/default";
let dropboxConfigHostFolder = "/config/utility/" + hostname;

let dropboxConfigDefaultFile = "default_" + configuration.DROPBOX.DROPBOX_WA_CONFIG_FILE;
let dropboxConfigHostFile = hostname + "_" + configuration.DROPBOX.DROPBOX_WA_CONFIG_FILE;

let dropboxConfigDefaultTrainingSetsFolder = dropboxConfigDefaultFolder + "/trainingSets";

let categorizedFolder = dropboxConfigDefaultFolder + "/categorized";
let categorizedUsersFile = "categorizedUsers.json";
let categorizedHashtagsFile = "categorizedHashtags.json";

let statsFolder = "/stats/" + hostname;
let statsFile = "wordAssoServerStats_" + moment().format(tinyDateTimeFormat) + ".json";

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

function filesListFolderLocal(options){
  return new Promise(function(resolve, reject) {

    debug("filesListFolderLocal options\n" + jsonPrint(options));

    const fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + options.path;

    fs.readdir(fullPath, function(err, items){
      if (err) {
        reject(err);
      }
      else {

        let itemArray = [];

        async.each(items, function(item, cb){

          itemArray.push(
            {
              name: item, 
              client_modified: false,
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
        }
    });
  });
}

function filesGetMetadataLocal(options){

  return new Promise(function(resolve, reject) {

    console.log("filesGetMetadataLocal options\n" + jsonPrint(options));

    const fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + options.path;

    fs.stat(fullPath, function(err, stats){
      if (err) {
        reject(err);
      }
      else {
        const response = {
          client_modified: stats.mtimeMs
        };
        
        resolve(response);
      }
    });
  });
}

let dropboxRemoteClient = new Dropbox({ accessToken: configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN });
let dropboxLocalClient = {  // offline mode
  filesListFolder: filesListFolderLocal,
  filesUpload: function(){},
  filesDownload: function(){},
  filesGetMetadata: filesGetMetadataLocal,
  filesDelete: function(){}
};

let dropboxClient = dropboxRemoteClient;

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

let NeuralNetwork;
let Emoji;
let Hashtag;
let Media;
let Place;
let Tweet;
let Url;
let User;
let Word;

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
// const wordAssoDb = require("../../mongooseTwitter");

const dbAppName = "WA_" + process.pid;

wordAssoDb.connect(dbAppName, function(err, db) {

  if (err) {
    console.log(chalkError("*** WA | MONGO DB CONNECTION ERROR"
      + " | DB APP NAME: " + dbAppName
      + " | ERROR: " + err
    ));
    configEvents.emit("DB_ERROR", err);
    return;
  }

  db.on("error", function(err){
    console.log(chalkError("*** WA | MONGO DB ERROR"
      + " | DB APP NAME: " + dbAppName
      + " | ERROR: " + err
    ));
    dbConnectionReady = false;
    statsObj.dbConnectionReady = false;
    configEvents.emit("DB_ERROR", err);
  });

  db.on("timeout", function(){
    console.log(chalkError("*** WA | MONGO DB TIMEOUT"
      + " | " + getTimeStamp()
      + " | DB APP NAME: " + dbAppName
    ));
    dbConnectionReady = false;
    statsObj.dbConnectionReady = false;
    configEvents.emit("DB_ERROR", "timeout");
  });

  db.on("disconnected", function(){
    console.log(chalkError("*** WA | MONGO DB DISCONNECTED"
      + " | " + getTimeStamp()
      + " | DB APP NAME: " + dbAppName
    ));
    dbConnectionReady = false;
    statsObj.dbConnectionReady = false;
    configEvents.emit("DB_DISCONNECT");
  });

  Emoji = mongoose.model("Emoji", emojiModel.EmojiSchema);
  Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
  Media = mongoose.model("Media", mediaModel.MediaSchema);
  NeuralNetwork = mongoose.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
  Place = mongoose.model("Place", placeModel.PlaceSchema);
  Tweet = mongoose.model("Tweet", tweetModel.TweetSchema);
  Url = mongoose.model("Url", urlModel.UrlSchema);
  User = mongoose.model("User", userModel.UserSchema);
  Word = mongoose.model("Word", wordModel.WordSchema);

  console.log(chalkAlert("WA | DB READY STATE: " + db.readyState));

  console.log(chalk.bold.green("WA | MONGOOSE DEFAULT CONNECTION OPEN"));


  global.dbConnection = db;

  dbConnectionReady = true;
  statsObj.dbConnectionReady = true;
  configEvents.emit("DB_CONNECT");
});

let HashtagServerController;
let UserServerController;
let WordServerController;

let hashtagServerController;
let userServerController;
let wordServerController;

let hashtagServerControllerReady = true;
let userServerControllerReady = true;
let wordServerControllerReady = true;

function toMegabytes(sizeInBytes) {
  return sizeInBytes/ONE_MEGABYTE;
}

function jsonPrint(obj) {
  if (obj) {
    return treeify.asTree(obj, true, true);
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
      + " | CR: " + getTimeStamp(params.user.createdAt)
      + " | LS: " + getTimeStamp(params.user.lastSeen)
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

  if (!slack) {
    debug(chalkInfo("SLACK NOT AVAILABLE"));
    if (callback !== undefined) { 
      return callback("SLACK NOT AVAILABLE", null);
    }
    else {
      return;
    }
  }

  slack.api("chat.postMessage", {
    text: text,
    channel: channel
  }, function(err, response){
    if (err){
      console.log(chalkError("*** SLACK POST MESSAGE ERROR\nTEXT: " + text + "\nERROR: " + err));
    }
    else {
      debug(response);
    }
    if (callback !== undefined) { callback(err, response); }
  });
}

// ==================================================================
// VIEWER CACHE
// ==================================================================
let viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
if (viewerCacheTtl === undefined) { viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL;}

console.log("VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

let viewerCacheCheckPeriod = process.env.VIEWER_CACHE_CHECK_PERIOD;
if (viewerCacheCheckPeriod === undefined) { viewerCacheCheckPeriod = VIEWER_CACHE_CHECK_PERIOD;}

console.log("VIEWER CACHE CHECK PERIOD: " + viewerCacheCheckPeriod + " SECONDS");

const viewerCache = new NodeCache({
  stdTTL: viewerCacheTtl,
  checkperiod: viewerCacheCheckPeriod
});

function viewerCacheExpired(viewerCacheId, viewerObj) {

  console.log(chalkAlert("XXX VIEWER CACHE EXPIRED"
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

const serverCache = new NodeCache({
  stdTTL: serverCacheTtl,
  checkperiod: serverCacheCheckPeriod
});

function serverCacheExpired(serverCacheId, serverObj) {

  const ttl = serverCache.getTtl(serverCacheId);

  console.log(chalkAlert("XXX SERVER CACHE EXPIRED"
    + " | TTL: " + serverCacheTtl + " SECS"
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
if (authenticatedSocketCacheTtl === undefined) { authenticatedSocketCacheTtl = AUTH_SOCKET_CACHE_DEFAULT_TTL;}
console.log("AUTHENTICATED SOCKET CACHE TTL: " + authenticatedSocketCacheTtl + " SECONDS");

let authenticatedSocketCacheCheckPeriod = process.env.AUTH_SOCKET_CACHE_CHECK_PERIOD;
if (authenticatedSocketCacheCheckPeriod === undefined) { authenticatedSocketCacheCheckPeriod = AUTH_SOCKET_CACHE_CHECK_PERIOD;}
console.log("AUTHENTICATED SOCKET CACHE CHECK PERIOD: " + authenticatedSocketCacheCheckPeriod + " SECONDS");

const authenticatedSocketCache = new NodeCache({
  stdTTL: authenticatedSocketCacheTtl,
  checkperiod: authenticatedSocketCacheCheckPeriod
});

function authenticatedSocketCacheExpired(socketId, authSocketObj) {

  const ttl = authenticatedSocketCache.getTtl(socketId);

  console.log(chalkAlert("XXX AUTH SOCKET CACHE EXPIRED"
    + " | TTL: " + msToTime(authenticatedSocketCacheTtl*1000)
    + " | NSP: " + authSocketObj.namespace.toUpperCase()
    + " | " + socketId
    + " | USER ID: " + authSocketObj.userId
    + "\nNOW: " + getTimeStamp()
    + " | TS: " + getTimeStamp(authSocketObj.timeStamp)
    + " | AGO: " + msToTime(moment().valueOf() - authSocketObj.timeStamp)
  ));

  authenticatedSocketCache.keys( function( err, socketIds ){
    if( !err ){
      socketIds.forEach(function(socketId){

        const authSocketObj = authenticatedSocketCache.get(socketId);

        if (authSocketObj) {

          console.log(chalkAlert("AUTH SOCKET CACHE ENTRIES"
            + " | NSP: " + authSocketObj.namespace.toUpperCase()
            + " | " + socketId
            + " | USER ID: " + authSocketObj.userId
            + "\nNOW: " + getTimeStamp()
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
if (authenticatedTwitterUserCacheTtl === undefined) { authenticatedTwitterUserCacheTtl = AUTH_USER_CACHE_DEFAULT_TTL;}
console.log("AUTHENTICATED TWITTER USER CACHE TTL: " + authenticatedTwitterUserCacheTtl + " SECONDS");

let authenticatedTwitterUserCacheCheckPeriod = process.env.AUTH_USER_CACHE_CHECK_PERIOD;
if (authenticatedTwitterUserCacheCheckPeriod === undefined) { authenticatedTwitterUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;}
console.log("AUTHENTICATED TWITTERUSER CACHE CHECK PERIOD: " + authenticatedTwitterUserCacheCheckPeriod + " SECONDS");

const authenticatedTwitterUserCache = new NodeCache({
  stdTTL: authenticatedTwitterUserCacheTtl,
  checkperiod: authenticatedTwitterUserCacheCheckPeriod
});

function authenticatedTwitterUserCacheExpired(nodeId, userObj) {

  console.log(chalkAlert("XXX AUTH TWITTER USER CACHE EXPIRED"
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
if (authInProgressTwitterUserCacheTtl === undefined) { authInProgressTwitterUserCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;}
console.log("AUTH IN PROGRESS CACHE TTL: " + authInProgressTwitterUserCacheTtl + " SECONDS");

let authInProgressTwitterUserCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (authInProgressTwitterUserCacheCheckPeriod === undefined) { authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;}
console.log("AUTH IN PROGRESS CACHE CHECK PERIOD: " + authInProgressTwitterUserCacheCheckPeriod + " SECONDS");

const authInProgressTwitterUserCache = new NodeCache({
  stdTTL: authInProgressTwitterUserCacheTtl,
  checkperiod: authInProgressTwitterUserCacheCheckPeriod
});

//    authInProgressTwitterUserCache.set(viewerObj.nodeId, viewerObj);

authInProgressTwitterUserCache.on("expired", function(nodeId, userObj){

  console.log(chalkAlert("XXX AUTH IN PROGRESS TWITTER USER CACHE EXPIRED"
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


let cacheObj = {};
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


let updateMetricsInterval;
let saveFileQueue = [];



let internetCheckInterval;

const http = require("http");

const httpServer = http.createServer(app);

const ioConfig = {
  pingInterval: DEFAULT_IO_PING_INTERVAL,
  pingTimeout: DEFAULT_IO_PING_TIMEOUT,
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

function initStats(callback){
  console.log(chalk.bold.black("INIT STATS"));
  statsObj = {};

  statsObj.ioReady = false;
  statsObj.internetReady = false;
  statsObj.internetTestError = false;

  statsObj.dbConnectionReady = dbConnectionReady;

  statsObj.tweetParserReady = false;
  statsObj.tweetParserSendReady = false;
  statsObj.previousBestNetworkId = "";

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
  statsObj.timeStamp = getTimeStamp();
  statsObj.serverTime = moment().valueOf();
  statsObj.upTime = os.uptime() * 1000;
  statsObj.runTime = 0;
  statsObj.runTimeArgs = process.argv;

  statsObj.nodesPerSec = 0.0;
  statsObj.nodesPerMin = 0.0;
  statsObj.maxNodesPerMin = 0.0;
  statsObj.maxNodesPerMinTime = moment().valueOf();

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
  statsObj.socket.testClient = {};
  statsObj.socket.testClient.errors = 0;
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
      callback(null, results);
    })
    .catch(function(err){
      console.log(err);
      callback(err, null);
    });
}


function dropboxFolderGetLastestCursor(folder, callback) {

  let lastCursorTruncated = "";

  let optionsGetLatestCursor = {
    path: folder,
    recursive: true,
    include_media_info: false,
    include_deleted: true,
    include_has_explicit_shared_members: false
  };


  debug(chalkLog("dropboxFolderGetLastestCursor FOLDER: " + folder));

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
          if (err.status === 429){
            console.log(chalkError("dropboxFolderGetLastestCursor filesListFolder *** DROPBOX FILES LIST FOLDER ERROR"
              + " | TOO MANY REQUESTS" 
              + " | FOLDER: " + folder 
            ));
          }
          else {
            console.log(chalkError("dropboxFolderGetLastestCursor filesListFolder *** DROPBOX FILES LIST FOLDER ERROR"
              + "\nERROR: " + err 
              + "\nERROR: " + jsonPrint(err)
            ));
          }
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
  statsObj.timeStamp = getTimeStamp();
  statsObj.twitter.tweetsPerMin = parseInt(tweetMeter.toJSON()[metricsRate]);
  statsObj.nodesPerMin = parseInt(globalNodeMeter.toJSON()[metricsRate]);

  if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin){
    statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
    statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
  }

  if (options) {
    console.log(chalkLog("STATS\n" + jsonPrint(statsObj)));
  }

  console.log(chalkLog("S"
    + " | " + getTimeStamp()
    + " | E: " + statsObj.elapsed
    + " | S: " + getTimeStamp(parseInt(statsObj.startTime))
    + " | AD: " + statsObj.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | VW: " + statsObj.entity.viewer.connected
    + " | TwRxPM: " + statsObj.twitter.tweetsPerMin
    + " | MaxTwRxPM: " + statsObj.twitter.maxTweetsPerMin
    + " | TwRXQ: " + tweetRxQueue.length
    + " | TwPRQ: " + tweetParserQueue.length
  ));
}

function loadCommandLineArgs(callback){

  statsObj.status = "LOAD COMMAND LINE ARGS";

  const commandLineConfigKeys = Object.keys(commandLineConfig);

  async.each(commandLineConfigKeys, function(arg, cb){
    configuration[arg] = commandLineConfig[arg];
    console.log("WA | --> COMMAND LINE CONFIG | " + arg + ": " + configuration[arg]);
    cb();
  }, function(){
    statsObj.commandLineArgsLoaded = true;

    if (callback !== undefined) { callback(null, commandLineConfig); }
  });
}

function getFileMetadata(path, file, callback) {

  const fullPath = path + "/" + file;
  debug(chalkInfo("FOLDER " + path));
  debug(chalkInfo("FILE " + file));
  debug(chalkInfo("getFileMetadata FULL PATH: " + fullPath));

  if (configuration.offlineMode) {
    dropboxClient = dropboxLocalClient;
  }
  else {
    dropboxClient = dropboxRemoteClient;
  }

  dropboxClient.filesGetMetadata({path: fullPath})
    .then(function(response) {
      debug(chalkInfo("FILE META\n" + jsonPrint(response)));
      return callback(null, response);
    })
    .catch(function(error) {
      console.log(chalkError("WA | DROPBOX getFileMetadata ERROR: " + fullPath + "\n" + error));
      console.log(chalkError("WA | !!! DROPBOX READ " + fullPath + " ERROR"));
      console.log(chalkError("WA | " + jsonPrint(error.error)));

      if ((error.status === 404) || (error.status === 409)) {
        console.error(chalkError("WA | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return callback(null, null);
      }
      if (error.status === 0) {
        console.error(chalkError("WA | !!! DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return callback(null, null);
      }
      return callback(error, null);
    });
}

function loadFile(path, file, callback) {

  debug(chalkInfo("LOAD FOLDER " + path));
  debug(chalkInfo("LOAD FILE " + file));
  debug(chalkInfo("FULL PATH " + path + "/" + file));

  let fullPath = path + "/" + file;

  if (configuration.offlineMode) {
    if (hostname === "mbp2") {
      fullPath = "/Users/tc/Dropbox/Apps/wordAssociation" + path + "/" + file;
      debug(chalkInfo("OFFLINE MODE: FULL PATH " + fullPath));
    }
    fs.readFile(fullPath, "utf8", function(err, data) {

      if (err) {
        console.log(chalkError("fs readFile ERROR: " + err));
      }

      debug(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE"
        + " | " + fullPath
      ));

      if (file.match(/\.json$/gi)) {

        const fileObj = JSONParse(data);

        if (fileObj.value) {
          callback(null, fileObj.value);
        }
        else {
          callback(fileObj.error, null);
        }

      }
      else {
        callback(null, null);
      }

    });
   }
  else {

    dropboxClient.filesDownload({path: fullPath})
    .then(function(data) {

      debug(chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE: " + fullPath
      ));

      if (file.match(/\.json$/gi)) {

        let payload = data.fileBinary;

        if (!payload || (payload === undefined)) {
          return callback(new Error("TFE LOAD FILE PAYLOAD UNDEFINED"), null);
        }

        const fileObj = JSONParse(payload);

        if (fileObj.value) {
          callback(null, fileObj.value);
        }
        else {
          callback(fileObj.error, null);
        }
      }
      else {
        callback(null, null);
      }
    })
    .catch(function(err) {

      if (err.code === "ENOTFOUND") {
        debug(chalkError("WA | LOAD FILE ERROR | FILE NOT FOUND: " + fullPath));
        return callback(err, null);
      }

      debug(chalkError("WA | LOAD FILE ERROR: " + err));
      
      callback(err, null);

    });
  }
}

function loadConfigFile(params, callback) {

  const file = params.file;
  const folder = params.folder;

  console.log(chalk.bold.black("LOAD CONFIG FILE | " + folder + "/" + file));

  if (file === dropboxConfigDefaultFile) {
    prevConfigFileModifiedMoment = moment(prevDefaultConfigFileModifiedMoment);
  }
  else {
    prevConfigFileModifiedMoment = moment(prevHostConfigFileModifiedMoment);
  }

  if (configuration.offlineMode) {
    loadCommandLineArgs(function(err, commandLineConfig){
      return callback(null);
    });
  }
  else {

    const fullPath = folder + "/" + file;

    getFileMetadata(folder, file, function(err, response){

      if (err) {
        return callback(err);
      }

      const fileModifiedMoment = moment(new Date(response.client_modified));
    
      if (fileModifiedMoment.isSameOrBefore(prevConfigFileModifiedMoment)){

        debug(chalkInfo("WA | CONFIG FILE BEFORE OR EQUAL"
          + " | " + fullPath
          + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
          + " | " + fileModifiedMoment.format(compactDateTimeFormat)
        ));
        callback(null);
      }
      else {
        console.log(chalkAlert("WA | +++ CONFIG FILE AFTER ... LOADING"
          + " | " + fullPath
          + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
          + " | " + fileModifiedMoment.format(compactDateTimeFormat)
        ));

        prevConfigFileModifiedMoment = moment(fileModifiedMoment);

        if (file === dropboxConfigDefaultFile) {
          prevDefaultConfigFileModifiedMoment = moment(fileModifiedMoment);
        }
        else {
          prevHostConfigFileModifiedMoment = moment(fileModifiedMoment);
        }

        loadFile(folder, file, function(err, loadedConfigObj){

          if (err) {
            console.error(chalkError("WA | ERROR LOAD DROPBOX CONFIG: " + file
              + "\n" + jsonPrint(err)
            ));
            callback(err);
          }
          else if ((loadedConfigObj === undefined) || !loadedConfigObj) {
            console.log(chalkError("WA | DROPBOX CONFIG LOAD FILE ERROR | JSON UNDEFINED ??? "));
            callback("JSON UNDEFINED");
          }

          else {

            console.log(chalkInfo("WA | LOADED CONFIG FILE: " + file + "\n" + jsonPrint(loadedConfigObj)));

            if (loadedConfigObj.DEFAULT_CURSOR_BATCH_SIZE !== undefined){
              console.log("WA | LOADED DEFAULT_CURSOR_BATCH_SIZE: " + loadedConfigObj.DEFAULT_CURSOR_BATCH_SIZE);
              configuration.cursorBatchSize = loadedConfigObj.DEFAULT_CURSOR_BATCH_SIZE;
            }

            if (loadedConfigObj.DEFAULT_FIND_CAT_USER_CURSOR_LIMIT !== undefined){
              console.log("WA | LOADED DEFAULT_FIND_CAT_USER_CURSOR_LIMIT: " + loadedConfigObj.DEFAULT_FIND_CAT_USER_CURSOR_LIMIT);
              configuration.findCatUserLimit = loadedConfigObj.DEFAULT_FIND_CAT_USER_CURSOR_LIMIT;
            }

            if (loadedConfigObj.DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT !== undefined){
              console.log("WA | LOADED DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT: " + loadedConfigObj.DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT);
              configuration.findCatHashtagLimit = loadedConfigObj.DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT;
            }

            if (loadedConfigObj.HEAPDUMP_ENABLED !== undefined){
              console.log("WA | LOADED HEAPDUMP_ENABLED: " + loadedConfigObj.HEAPDUMP_ENABLED);
              configuration.heapDumpEnabled = loadedConfigObj.HEAPDUMP_ENABLED;
            }

            if (loadedConfigObj.HEAPDUMP_MODULO !== undefined){
              console.log("WA | LOADED HEAPDUMP_MODULO: " + loadedConfigObj.HEAPDUMP_MODULO);
              configuration.heapDumpModulo = loadedConfigObj.HEAPDUMP_MODULO;
            }

            if (loadedConfigObj.HEAPDUMP_THRESHOLD !== undefined){
              console.log("WA | LOADED HEAPDUMP_THRESHOLD: " + loadedConfigObj.HEAPDUMP_THRESHOLD);
              configuration.heapDumpThreshold = loadedConfigObj.HEAPDUMP_THRESHOLD;
            }

            if (loadedConfigObj.NODE_CACHE_CHECK_PERIOD !== undefined){
              console.log("WA | LOADED NODE_CACHE_CHECK_PERIOD: " + loadedConfigObj.NODE_CACHE_CHECK_PERIOD);
              configuration.nodeCacheCheckPeriod = loadedConfigObj.NODE_CACHE_CHECK_PERIOD;
            }

            if (loadedConfigObj.NODE_CACHE_DEFAULT_TTL !== undefined){
              console.log("WA | LOADED NODE_CACHE_DEFAULT_TTL: " + loadedConfigObj.NODE_CACHE_DEFAULT_TTL);
              configuration.nodeCacheTtl = loadedConfigObj.NODE_CACHE_DEFAULT_TTL;
            }

            if (loadedConfigObj.SOCKET_IDLE_TIMEOUT !== undefined){
              console.log("WA | LOADED SOCKET_IDLE_TIMEOUT: " + loadedConfigObj.SOCKET_IDLE_TIMEOUT);
              configuration.socketIdleTimeout = loadedConfigObj.SOCKET_IDLE_TIMEOUT;
            }

            if (loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD !== undefined){
              console.log("WA | LOADED TOPTERMS_CACHE_CHECK_PERIOD: " + loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD);
              configuration.topTermsCacheCheckPeriod = loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD;
            }

            if (loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL !== undefined){
              console.log("WA | LOADED TOPTERMS_CACHE_DEFAULT_TTL: " + loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL);
              configuration.topTermsCacheTtl = loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL;
            }

            if (loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD !== undefined){
              console.log("WA | LOADED TRENDING_CACHE_CHECK_PERIOD: " + loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD);
              configuration.trendingCacheCheckPeriod = loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD;
            }

            if (loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL !== undefined){
              console.log("WA | LOADED TRENDING_CACHE_DEFAULT_TTL: " + loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL);
              configuration.trendingCacheTtl = loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL;
            }

            if (loadedConfigObj.MIN_FOLLOWERS_AUTO !== undefined){
              console.log("WA | LOADED MIN_FOLLOWERS_AUTO: " + loadedConfigObj.MIN_FOLLOWERS_AUTO);
              configuration.minFollowersAuto = loadedConfigObj.MIN_FOLLOWERS_AUTO;
            }

            if (loadedConfigObj.WAS_ENABLE_STDIN !== undefined){
              console.log("WA | LOADED WAS_ENABLE_STDIN: " + loadedConfigObj.WAS_ENABLE_STDIN);
              configuration.enableStdin = loadedConfigObj.WAS_ENABLE_STDIN;
            }

            if (loadedConfigObj.WAS_PROCESS_NAME !== undefined){
              console.log("WA | LOADED WAS_PROCESS_NAME: " + loadedConfigObj.WAS_PROCESS_NAME);
              configuration.processName = loadedConfigObj.WAS_PROCESS_NAME;
            }

            if (loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL !== undefined){
              console.log("WA | LOADED CATEGORY_HASHMAPS_UPDATE_INTERVAL: " + loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL);
              configuration.categoryHashmapsUpdateInterval = loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL;
            }

            if (loadedConfigObj.WAS_STATS_UPDATE_INTERVAL !== undefined){
              console.log("WA | LOADED WAS_STATS_UPDATE_INTERVAL: " + loadedConfigObj.WAS_STATS_UPDATE_INTERVAL);
              configuration.statsUpdateIntervalTime = loadedConfigObj.WAS_STATS_UPDATE_INTERVAL;
            }

            if (loadedConfigObj.WAS_TWITTER_DEFAULT_USER !== undefined){
              console.log("WA | LOADED WAS_TWITTER_DEFAULT_USER: " + loadedConfigObj.WAS_TWITTER_DEFAULT_USER);
              configuration.twitterDefaultUser = loadedConfigObj.WAS_TWITTER_DEFAULT_USER;
            }

            if (loadedConfigObj.WAS_TWITTER_USERS !== undefined){
              console.log("WA | LOADED WAS_TWITTER_USERS: " + loadedConfigObj.WAS_TWITTER_USERS);
              configuration.twitterUsers = loadedConfigObj.WAS_TWITTER_USERS;
            }

            if (loadedConfigObj.WAS_KEEPALIVE_INTERVAL !== undefined){
              console.log("WA | LOADED WAS_KEEPALIVE_INTERVAL: " + loadedConfigObj.WAS_KEEPALIVE_INTERVAL);
              configuration.keepaliveInterval = loadedConfigObj.WAS_KEEPALIVE_INTERVAL;
            }

            if (loadedConfigObj.WA_VERBOSE_MODE  !== undefined){
              console.log("WA | LOADED WA_VERBOSE_MODE: " + loadedConfigObj.WA_VERBOSE_MODE);

              if ((loadedConfigObj.WA_VERBOSE_MODE === false) || (loadedConfigObj.WA_VERBOSE_MODE === "false")) {
                configuration.verbose = false;
              }
              else if ((loadedConfigObj.WA_VERBOSE_MODE === true) || (loadedConfigObj.WA_VERBOSE_MODE === "true")) {
                configuration.verbose = true;
              }
              else {
                configuration.verbose = false;
              }
            }

            if (loadedConfigObj.WA_TEST_MODE  !== undefined){
              console.log("WA | LOADED WA_TEST_MODE: " + loadedConfigObj.WA_TEST_MODE);
              configuration.testMode = loadedConfigObj.WA_TEST_MODE;
            }

            if (loadedConfigObj.WA_ENABLE_STDIN  !== undefined){
              console.log("WA | LOADED WA_ENABLE_STDIN: " + loadedConfigObj.WA_ENABLE_STDIN);
              configuration.enableStdin = loadedConfigObj.WA_ENABLE_STDIN;
            }

            if (loadedConfigObj.WA_STATS_UPDATE_INTERVAL  !== undefined) {
              console.log("WA | LOADED WA_STATS_UPDATE_INTERVAL: " + loadedConfigObj.WA_STATS_UPDATE_INTERVAL);
              configuration.statsUpdateIntervalTime = loadedConfigObj.WA_STATS_UPDATE_INTERVAL;
            }

            if (loadedConfigObj.WA_KEEPALIVE_INTERVAL  !== undefined) {
              console.log("WA | LOADED WA_KEEPALIVE_INTERVAL: " + loadedConfigObj.WA_KEEPALIVE_INTERVAL);
              configuration.keepaliveInterval = loadedConfigObj.WA_KEEPALIVE_INTERVAL;
            }

            callback(null);

          }
        });

      }
    });
  }
}

function loadMaxInputHashMap(params, callback){
  loadFile(params.folder, params.file, function(err, dataObj){
    if (err){

      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD MAX INPUT: FILE NOT FOUND"
          + " | " + params.folder + "/" + params.file
        ));
        return(callback(err));
      }
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
          console.log(chalkError("WAS | *** LOCAL STREAM READ ERROR | " + err));
          if (callback !== undefined) { return callback(err); }
        });

        remoteWriteStream.on("end", function(){
          console.log(chalkAlert("WAS | REMOTE STREAM WRITE END | DEST: " + options.destination));
          if (callback !== undefined) { return callback(null); }
        });

        remoteWriteStream.on("error", function(err){
          console.log(chalkError("WAS | *** REMOTE STREAM WRITE ERROR | DEST: " + options.destination + "\n" + err));
          if (callback !== undefined) { return callback(err); }
        });

      }, 5000);

    })
    .catch(function(error){
      console.log(chalkError("WAS | " + getTimeStamp() 
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
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: 413"
            // + " ERROR\n" + jsonPrint(error.error)
          ));
          if (callback !== undefined) { return callback(error.error_summary); }
        }
        else if (error.status === 429){
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: TOO MANY WRITES"
            // + " ERROR\n" + "jsonPrint"(error.error)
          ));
          if (callback !== undefined) { return callback(error.error_summary); }
        }
        else if (error.status === 500){
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: DROPBOX SERVER ERROR"
            // + " ERROR\n" + jsonPrint(error.error)
          ));
          if (callback !== undefined) { return callback(error.error_summary); }
        }
        else {
          console.log(chalkError("WAS | " + getTimeStamp() 
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
            + " | LAST MOD: " + getTimeStamp(new Date(entry.client_modified))
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

  console.log(chalk.bold.black("INIT DROPBOX SAVE FILE INTERVAL | " + msToTime(cnf.saveFileQueueInterval)));

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

  if (configuration.offlineMode) {

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
      debug(chalkLog(getTimeStamp()
        + " | SAVED DROPBOX JSON | " + options.path
      ));
      callback("OK");
    })
    .catch(function dropboxFilesUploadError(err){
      console.log(chalkError(getTimeStamp() 
        + " | !!! ERROR DROBOX STATS WRITE | FILE: " + options.path 
        // + "\nERROR\n" + jsonPrint(err)
      ));

      console.log(chalkError(err)); 

      callback(err);
    });

  }
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
  let pid;
  let childId;
  let numChildren = 0;
  let childPidArray = [];

  if ((params.searchTerm === undefined) || (params.searchTerm === "ALL")){
    command = "pgrep " + "wa_";
  }
  else {
    command = "pgrep " + params.searchTerm;
  }

  debug(chalkAlert("getChildProcesses | command: " + command));


  shell.exec(command, {silent: true}, function(code, stdout, stderr){

    if (code === 0) {

      let soArray = stdout.trim();

      let stdoutArray = soArray.split("\n");

      async.eachSeries(stdoutArray, function(pidRaw, cb){

        pid = pidRaw.trim();

        if (parseInt(pid) > 0) {

          command = "ps -o command= -p " + pid;

          shell.exec(command, {silent: true}, function(code, stdout, stderr){

            childId = stdout.trim();

            numChildren += 1;

            debug(chalk.blue("WA | FOUND CHILD PROCESS"
              + " | NUM: " + numChildren
              + " | PID: " + pid
              + " | " + childId
            ));

            if (childrenHashMap[childId] === undefined) {

              childrenHashMap[childId] = {};
              childrenHashMap[childId].status = "ZOMBIE";

              console.log(chalkError("WA | ??? CHILD ZOMBIE ???"
                + " | NUM: " + numChildren
                + " | PID: " + pid
                + " | " + childId
                + " | STATUS: " + childrenHashMap[childId].status
              ));

              killChild({pid: pid}, function(err, numKilled){
                console.log(chalkAlert("WA | XXX ZOMBIE CHILD KILLED | PID: " + pid + " | CH ID: " + childId));
              });

            }
            else {
              debug(chalkInfo("WA | CHILD"
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
      console.log(chalkInfo("WA | NO NN CHILD PROCESSES FOUND"));
        if (callback !== undefined) { callback(null, []); }
    }

    if (code > 1) {
      console.log(chalkAlert("SHELL : WA | ERROR *** KILL CHILD"
        + "\nSHELL :: WA | COMMAND: " + command
        + "\nSHELL :: WA | EXIT CODE: " + code
        + "\nSHELL :: WA | STDOUT\n" + stdout
        + "\nSHELL :: WA | STDERR\n" + stderr
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
          console.log(chalkAlert("WA | KILL ALL | KILLED | PID: " + childObj.pid + " | CH ID: " + childObj.childId));
          cb();
        });

      }, function(err){

        if (callback !== undefined) { callback(err, childPidArray); }

      });
    }
    else {

      console.log(chalkAlert("WA | KILL ALL | NO CHILDREN"));

      if (callback !== undefined) { callback(err, childPidArray); }
    }
  });
}


process.on("exit", function processExit() {
  killAll();
});

process.on("message", function processMessageRx(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    console.log(chalkAlert("\n=============================\n***** SHUTDOWN OR SIGINT *****\n=============================\n"));

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
      quit(msg);
    }, 1000);
  }
});

configEvents.on("CHILD_ERROR", function childError(childObj){

  console.log(chalkError("CHILD_ERROR"
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

      console.log(chalkError("KILL TWEET PARSER"));

      killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
        // initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
        initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, twp){
          if (!err) { tweetParser = twp; }
        });
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


configEvents.on("INTERNET_READY", function internetReady() {

  console.log(chalkInfo(getTimeStamp() + " | SERVER_READY EVENT"));

  if (!httpServer.listening) {

    httpServer.on("reconnect", function serverReconnect() {
      statsObj.internetReady = true;
      debug(chalkConnect(getTimeStamp() + " | PORT RECONNECT: " + config.port));
    });

    httpServer.on("connect", function serverConnect() {
      statsObj.socket.connects += 1;
      statsObj.internetReady = true;
      debug(chalkConnect(getTimeStamp() + " | PORT CONNECT: " + config.port));

      httpServer.on("disconnect", function serverDisconnect() {
        statsObj.internetReady = false;
        console.log(chalkError("\n***** PORT DISCONNECTED | " + getTimeStamp() 
          + " | " + config.port));
      });
    });

    httpServer.listen(config.port, function serverListen() {
      debug(chalkInfo(getTimeStamp() + " | LISTENING ON PORT " + config.port));
    });

    httpServer.on("error", function serverError(err) {

      statsObj.socket.errors.httpServer_errors += 1;
      statsObj.internetReady = false;

      debug(chalkError("??? HTTP ERROR | " + getTimeStamp() + "\n" + err));

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

        // utilNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
        adminNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
        // userNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
        // viewNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);

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
  }

  loadFile(dropboxConfigTwitterFolder, defaultTwitterConfigFile, function initTwit(err, twitterConfig){
    if (err) {

      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD DEFAULT TWITTER CONFIG ERROR: FILE NOT FOUND:  " + dropboxConfigTwitterFolder + "/" + twitterAutoFollowConfigFile));
      }
      else {
        console.log(chalkError("*** LOAD DEFAULT TWITTER CONFIG ERROR: " + err));
      }

      twit = false;
    }
    else {
      console.log(chalkTwitter("LOADED DEFAULT TWITTER CONFIG"
        + " | " + dropboxConfigTwitterFolder + "/" + defaultTwitterConfigFile
        // + "\n" + jsonPrint(twitterConfig)
      ));

      twit = new Twit(twitterConfig);

      updateTrends();
    }
  });

  loadFile(dropboxConfigTwitterFolder, twitterAutoFollowConfigFile, function initTwit(err, twitterAutoFollowConfig){
    if (err) {

      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD TWITTER AUTO FOLLOW CONFIG ERROR: FILE NOT FOUND:  " + dropboxConfigTwitterFolder + "/" + twitterAutoFollowConfigFile));
      }
      else {
        console.log(chalkError("*** LOAD TWITTER AUTO FOLLOW CONFIG ERROR: " + err));
      }

      twitAutoFollow = false;
    }
    else {
      console.log(chalkTwitter("LOADED TWITTER AUTO FOLLOW CONFIG"
        + " | " + dropboxConfigTwitterFolder + "/" + twitterAutoFollowConfigFile
        // + "\n" + jsonPrint(twitterAutoFollowConfig)
      ));

      twitAutoFollow = new Twit(twitterAutoFollowConfig);
    }
  });

  loadMaxInputHashMap({folder: dropboxConfigDefaultTrainingSetsFolder, file: maxInputHashMapFile}, function(err){
    if (err) {
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD MAX INPUT ERROR: FILE NOT FOUND"
          + " | " + dropboxConfigDefaultTrainingSetsFolder + "/" + maxInputHashMapFile
        ));
      }
      else {
        console.log(chalkError("*** LOAD MAX INPUT ERROR: " + err));
      }
    }
    else {
      console.log(chalkInfo("LOADED MAX INPUT HASHMAP + NORMALIZATION"));
      console.log(chalkInfo("MAX INPUT HASHMAP INPUT TYPES: " + Object.keys(maxInputHashMap)));
      console.log(chalkInfo("NORMALIZATION INPUT TYPES: " + Object.keys(normalization)));
    }
  });

  if (statsObj.internetReady) {
    slack = new Slack(slackOAuthAccessToken);
  }


  function postAuthenticate(socket, data) {

    data.timeStamp = moment().valueOf();

    console.log(chalk.bold.green("+++ SOCKET AUTHENTICATED"
      + " | " + data.namespace.toUpperCase()
      + " | " + socket.id
      + " | " + data.userId
    ));

    authenticatedSocketCache.set(socket.id, data);
  }

  function disconnect(socket) {
    authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
      if (authenticatedSocketObj) {
        console.log(chalkAlert("POST AUTHENTICATE DISCONNECT"
          + " | " + authenticatedSocketObj.namespace.toUpperCase()
          + " | " + socket.id
          + " | " + authenticatedSocketObj.userId
        ));
      }
      else {
        console.log(chalkAlert("POST AUTHENTICATE DISCONNECT | " + socket.id));
      }
    });
  }

  const socketIoAuth = require("@threeceelabs/socketio-auth")(io, {

    authenticate: function (socket, data, callback) {

      const namespace = data.namespace;
      const userId = data.userId.toLowerCase();
      const password = data.password;

      console.log(chalkLog("... AUTHENTICATING SOCKET"
        + " | " + getTimeStamp()
        + " | " + socket.id
        + " | NSP: " + namespace.toUpperCase()
        + " | UID: " + userId
        // + "\n" + jsonPrint(data)
      ));
      //get credentials sent by the client

      if ((namespace === "admin") && (password === "this is a very weak password")) {
        debug(chalk.green("+++ ADMIN AUTHENTICATED | " + userId));
        return callback(null, true);
      }

      if (namespace === "view") {
        debug(chalk.green("+++ VIEWER AUTHENTICATED | " + userId));
        return callback(null, true);
      }

      if ((namespace === "util") && (password === "0123456789")) {
        debug(chalk.green("+++ UTIL AUTHENTICATED | " + userId));
        return callback(null, true);
      }

      return callback(null, false);

    },
    postAuthenticate: postAuthenticate,
    disconnect: disconnect,
    timeout: configuration.socketIoAuthTimeout
  });

  initAppRouting(function initAppRoutingComplete() {
    initSocketNamespaces();
    initLoadBestNetworkInterval(ONE_MINUTE+1);
    initFollowableSearchTerms();
  });

});

configEvents.on("INTERNET_NOT_READY", function internetNotReady() {
  if (configuration.autoOfflineMode) {
    configuration.offlineMode = true;
    console.log(chalkAlert("*** AUTO_OFFLINE_MODE ***"));
  }
});

configEvents.on("DB_CONNECT", function configEventDbConnect(){

  HashtagServerController = require("@threeceelabs/hashtag-server-controller");
  // HashtagServerController = require("../../hashtagServerController");

  UserServerController = require("@threeceelabs/user-server-controller");
  // UserServerController = require("../../userServerController");

  WordServerController = require("@threeceelabs/word-server-controller");
  // WordServerController = require("../../wordServerController");

  hashtagServerController = new HashtagServerController("WA_HSC");
  userServerController = new UserServerController("WA_USC");
  wordServerController = new WordServerController("WA_WSC");

  hashtagServerControllerReady = true;
  userServerControllerReady = true;
  wordServerControllerReady = true;

  hashtagServerController.on("error", function(err){
    hashtagServerControllerReady = false;
    console.log(chalkError("*** HSC ERROR | " + err));
  });

  userServerController.on("error", function(err){
    userServerControllerReady = false;
    console.log(chalkError("*** USC ERROR | " + err));
  });

  wordServerController.on("error", function(err){
    wordServerControllerReady = false;
    console.log(chalkError("*** WSC ERROR | " + err));
  });

  initCategoryHashmapsReady = false;

  initCategoryHashmaps(function(err){

    initCategoryHashmapsReady = true;

    if (err) {
      console.log(chalkError("ERROR: LOAD CATEGORY HASHMAPS: " + err));
    }
    else {
      console.log(chalk.bold.green("+++ LOADED CATEGORY HASHMAPS"));
    }
  });
});


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


debug("NODE_ENV : " + process.env.NODE_ENV);
debug("CLIENT HOST + PORT: " + "http://localhost:" + config.port);

function categorizeNode(categorizeObj, callback) {

  if (categorizeObj.twitterUser && categorizeObj.twitterUser.nodeId) {

    let user = authenticatedTwitterUserCache.get(categorizeObj.twitterUser.nodeId);

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

          // const text = "CATEGORIZE"
          //   + "\n@" + categorizeObj.node.screenName 
          //   + ": " + categorizeObj.category;

          slackPostMessage(slackChannel, "CATEGORIZE" + "\n@" + categorizeObj.node.screenName + ": " + categorizeObj.category );

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
        { hashtag: categorizeObj.node, category: categorizeObj.category }, 
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
            { manual: updatedHashtag.category, auto: updatedHashtag.categoryAuto });

          // const text = "CATEGORIZE"
          //   + "\n#" + categorizeObj.node.nodeId.toLowerCase() + ": " + categorizeObj.category;

          // slackPostMessage(slackChannel, text);
          slackPostMessage(slackChannel, "CATEGORIZE" + "\n@" + categorizeObj.node.nodeId.toLowerCase() + ": " + categorizeObj.category );

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
      console.log(chalkLog("*** TWEET RX MAX QUEUE [" + tweetRxQueue.length + "]"
        + " | " + getTimeStamp()
        + " | TWP READY: " + statsObj.tweetParserReady
        + " | TWP SEND READY: " + statsObj.tweetParserSendReady
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

  if (unfollowableUserSet.has(params.user.nodeId)) { 

    console.log(chalkAlert("XXX FOLLOW | @" + params.user.screenName + " | IN UNFOLLOWABLE USER SET"));

    if (callback !== undefined) { 
      return callback("XXX FOLLOW", null);
    }
    else {
      return;
    }
  }

  console.log(chalk.blue("+++ FOLLOW | @" + params.user.screenName));

  adminNameSpace.emit("FOLLOW", params.user);
  utilNameSpace.emit("FOLLOW", params.user);

  if (callback !== undefined) { callback(null, null); }
}

function initUnfollowableUserSet(){

  loadFile(dropboxConfigDefaultFolder, unfollowableUserFile, function(err, unfollowableUserSetArray){
    if (err) {
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD UNFOLLOWABLE USERS ERROR: FILE NOT FOUND:  " 
          + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
        ));
      }
      else {
        console.log(chalkError("*** LOAD UNFOLLOWABLE USERS ERROR: " + err));
      }
      // console.log(chalkAlert("*** ERROR INIT UNFOLLOWABLE USERS | " + err));
    }
    else if (unfollowableUserSetArray) {
      unfollowableUserSet = new Set(unfollowableUserSetArray);
      console.log(chalk.bold.black("INIT UNFOLLOWABLE USERS | " + unfollowableUserSet.size + " USERS"));
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
      console.log(chalkLog("UNFOLLOW USER: @" + user.screenName));
    }

    if (callback !== undefined) { callback(); }
  });
}


const serverRegex = /^(.+)_/i;
let socketConnectText = "";


function initSocketHandler(socketObj) {

  const socket = socketObj.socket;
  const socketId = socket.id;

  let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  socketConnectText = "\nSOCKET CONNECT"
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

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.reconnect_errors += 1;
    debug(chalkError(getTimeStamp() 
      + " | SOCKET RECONNECT ERROR: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("reconnect_failed", function reconnectFailed(errorObj) {

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.reconnect_fails += 1;
    console.log(chalkError(getTimeStamp() 
      + " | SOCKET RECONNECT FAILED: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_error", function connectError(errorObj) {

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.connect_errors += 1;
    console.log(chalkError(getTimeStamp() 
      + " | SOCKET CONNECT ERROR: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_timeout", function connectTimeout(errorObj) {

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.connect_timeouts += 1;
    console.log(chalkError(getTimeStamp() 
      + " | SOCKET CONNECT TIMEOUT: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function socketError(error) {

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    statsObj.socket.errors.errors += 1;

    console.log(chalkError(getTimeStamp() 
      + " | *** SOCKET ERROR" + " | " + socketId + " | " + error));

    let currentServer = serverCache.get(socketId);

    if (currentServer) { 

      currentServer.timeStamp = moment().valueOf();
      currentServer.ip = ipAddress;
      currentServer.status = "ERROR";

      console.log(chalkError("SERVER ERROR" 
        + " | " + getTimeStamp(currentServer.timeStamp)
        + " | " + currentServer.user.type.toUpperCase()
        + " | " + currentServer.user.nodeId
        + " | " + currentServer.status
        + " | " + currentServer.ip
        + " | " + socketId
      ));

      serverCache.set(socketId, currentServer);

      adminNameSpace.emit("SERVER_ERROR", currentServer);
    }


    let currentViewer = viewerCache.get(socketId);

    if (currentViewer) { 

      currentViewer.timeStamp = moment().valueOf();
      currentViewer.ip = ipAddress;
      currentViewer.status = "ERROR";

      console.log(chalkError("VIEWER ERROR" 
        + " | " + getTimeStamp(currentViewer.timeStamp)
        + " | " + currentViewer.user.type.toUpperCase()
        + " | " + currentViewer.user.nodeId
        + " | " + currentViewer.status
        + " | " + currentViewer.ip
        + " | " + socketId
      ));

      viewerHashMap.set(socketId, currentViewer);

      adminNameSpace.emit("VIEWER_ERROR", currentViewer);
    }
  });

  socket.on("reconnect", function socketReconnect() {
    statsObj.socket.reconnects += 1;
    console.log(chalkConnect(getTimeStamp() + " | SOCKET RECONNECT: " + socket.id));
  });

  socket.on("disconnect", function socketDisconnect(reason) {

    statsObj.socket.disconnects += 1;

    console.log(chalkAlert("XXX SOCKET DISCONNECT"
      + " | " + socketId
      + " | REASON: " + reason
    ));

    if (adminHashMap.has(socketId)) { 
      console.log(chalkAlert("XXX DELETED ADMIN" 
        + " | " + getTimeStamp()
        + " | " + adminHashMap.get(socketId).user.type.toUpperCase()
        + " | " + adminHashMap.get(socketId).user.nodeId
        + " | " + socketId
      ));
      adminNameSpace.emit("ADMIN_DELETE", {socketId: socketId, nodeId: adminHashMap.get(socketId).user.nodeId});
      adminHashMap.delete(socketId);
    }

    let currentServer = serverCache.get(socketId);

    if (currentServer) { 

      currentServer.status = "DISCONNECTED";

      console.log(chalkAlert("XXX SERVER DISCONNECTED" 
        + " | " + getTimeStamp()
        + " | " + currentServer.user.type.toUpperCase()
        + " | " + currentServer.user.nodeId
        + " | " + socketId
      ));
 
      adminNameSpace.emit("SERVER_DISCONNECT", currentServer);
      serverCache.del(socketId);

    }

    let currentViewer = viewerCache.get(socketId);
    if (currentViewer) { 

      currentViewer.status = "DISCONNECTED";

      viewerCache.del(socketId, function(err, count){

        if (err) { 
          console.log(chalkError("VIEWER CA ENTRY DELETE ERROR"
            + " | " + err
            + " | " + err
          ));
        }

        console.log(chalkAlert("-X- VIEWER DISCONNECTED" 
          + " | " + getTimeStamp(currentViewer.timeStamp)
          + " | " + currentViewer.user.type.toUpperCase()
          + " | " + currentViewer.user.nodeId
          + " | " + currentViewer.ip
          + " | " + socketId
        ));

        adminNameSpace.emit("VIEWER_DISCONNECT", currentViewer);
      });
    }
  });

  socket.on("SESSION_KEEPALIVE", function sessionKeepalive(keepAliveObj) {

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    if (keepAliveObj.user === undefined) {
      console.log(chalkAlert("SESSION_KEEPALIVE USER UNDEFINED ??"
        + " | NSP: " + socket.nsp.name.toUpperCase()
        + " | " + socket.id
        + " | " + ipAddress
        + "\n" + jsonPrint(keepAliveObj)
      ));
      return;
    }

    authenticatedSocketCache.get(socket.id, function(err, authSocketObj){

      if (authSocketObj !== undefined) {

        if (configuration.verbose) {
          console.log(chalkLog("... KEEPALIVE AUTHENTICATED SOCKET"
            + " | " + socket.id
            + " | NSP: " + authSocketObj.namespace.toUpperCase()
            + " | USER ID: " + authSocketObj.userId
          ));
        }

        authSocketObj.timeStamp = moment().valueOf();
        authenticatedSocketCache.set(socket.id, authSocketObj);

      }
      else {
        console.log(chalkAlert("*** KEEPALIVE UNAUTHENTICATED SOCKET | DISCONNECTING..."
          + " | " + socket.id
          + " | NSP: " + socket.nsp.name.toUpperCase()
          + " | " + keepAliveObj.user.userId
        ));
        socket.disconnect();
      }
    });


    if (statsObj.utilities[keepAliveObj.user.userId] === undefined) {
      statsObj.utilities[keepAliveObj.user.userId] = {};
    }

    statsObj.socket.keepalives += 1;

    if (keepAliveObj.user.stats) {statsObj.utilities[keepAliveObj.user.userId] = keepAliveObj.user.stats;}


    const currentSessionType = serverRegex.exec(keepAliveObj.user.userId) ? serverRegex.exec(keepAliveObj.user.userId)[1].toUpperCase() : "NULL";

    let sessionObj = {};
    let tempServerObj;
    let tempViewerObj;

    switch (currentSessionType) {

      case "ADMIN" :

        console.log(chalkLog("R< KA"
          + " | " + "ADMIN" 
          + " | " + getTimeStamp()
          + " | " + keepAliveObj.user.userId
          + " | " + socket.id
        ));

        sessionObj.status = keepAliveObj.status || "KEEPALIVE";

        if (!adminHashMap.has(socket.id)) { 

          sessionObj.ip = ipAddress;
          sessionObj.socketId = socket.id;
          sessionObj.type = currentSessionType;
          sessionObj.timeStamp = moment().valueOf();
          sessionObj.user = keepAliveObj.user;
          sessionObj.isAdmin = true;
          sessionObj.isServer = false;
          sessionObj.isViewer = false;
          sessionObj.stats = {};
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          console.log(chalk.green("+++ ADD " + currentSessionType 
            + " | " + getTimeStamp()
            + " | " + keepAliveObj.user.userId
            + " | " + sessionObj.ip
            + " | " + socket.id
          ));

          adminHashMap.set(socket.id, sessionObj);
          adminNameSpace.emit("ADMIN_ADD", sessionObj);

        }
        else {
          sessionObj = adminHashMap.get(socket.id);

          sessionObj.timeStamp = moment().valueOf();
          sessionObj.user = keepAliveObj.user;
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          adminHashMap.set(socket.id, sessionObj);

          adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
        }
      break;

      case "GIS" :
      case "TFE" :
      case "TNN" :
      case "TSS" :
      case "TUS" :
      case "LA" :

        console.log(chalkLog("R< KA"
          + " | " + currentSessionType + " SERVER" 
          + " | " + getTimeStamp()
          + " | " + keepAliveObj.user.userId
          + " | " + socket.id
        ));

        sessionObj.socketId = socket.id;
        sessionObj.ip = ipAddress;
        sessionObj.type = currentSessionType;
        sessionObj.timeStamp = moment().valueOf();
        sessionObj.user = keepAliveObj.user;

        tempServerObj = serverCache.get(socket.id);

        if (!tempServerObj) { 

          sessionObj.ip = ipAddress;
          sessionObj.socketId = socket.id;
          sessionObj.type = currentSessionType;
          sessionObj.timeStamp = moment().valueOf();
          sessionObj.user = keepAliveObj.user;
          sessionObj.isAdmin = false;
          sessionObj.isServer = true;
          sessionObj.isViewer = false;
          sessionObj.stats = {};
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          console.log(chalk.green("+++ ADD " + currentSessionType + " SERVER" 
            + " | " + getTimeStamp()
            + " | " + keepAliveObj.user.userId
            + " | " + sessionObj.ip
            + " | " + socket.id
          ));

          serverCache.set(socket.id, sessionObj);

          adminNameSpace.emit("SERVER_ADD", sessionObj);
        }
        else {

          sessionObj = tempServerObj;

          sessionObj.timeStamp = moment().valueOf();
          sessionObj.user = keepAliveObj.user;
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          serverCache.set(socket.id, sessionObj);

          adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
          socket.emit("GET_STATS");
        }

      break;

      case "VIEWER" :

        console.log(chalkLog("R< KA"
          + " | " + "VIEWER"
          + " | " + getTimeStamp()
          + " | " + keepAliveObj.user.userId
          + " | " + socket.id
        ));

        sessionObj.socketId = socket.id;
        sessionObj.ip = ipAddress;
        sessionObj.type = currentSessionType;
        sessionObj.timeStamp = moment().valueOf();
        sessionObj.user = keepAliveObj.user;

        tempViewerObj = viewerCache.get(socket.id);

        if (!tempViewerObj) { 

          sessionObj.socketId = socket.id;
          sessionObj.ip = ipAddress;
          sessionObj.type = currentSessionType;
          sessionObj.timeStamp = moment().valueOf();
          sessionObj.user = keepAliveObj.user;
          sessionObj.isAdmin = false;
          sessionObj.isServer = false;
          sessionObj.isViewer = true;
          sessionObj.stats = {};
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          console.log(chalk.green("+++ ADD " + currentSessionType + " SESSION" 
            + " | " + getTimeStamp()
            + " | " + keepAliveObj.user.userId
            + " | " + sessionObj.ip
            + " | " + socket.id
          ));

          viewerCache.set(socket.id, sessionObj);
          adminNameSpace.emit("VIEWER_ADD", sessionObj);
        }
        else {

          sessionObj = tempViewerObj;

          sessionObj.timeStamp = moment().valueOf();
          sessionObj.user = keepAliveObj.user;
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          viewerHashMap.set(socket.id, sessionObj);

          viewerCache.set(socket.id, sessionObj);

          adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
        }
      break;

      default:
        console.log(chalkAlert("**** NOT SERVER ****"
          + " | SESSION TYPE: " + currentSessionType
          + "\n" + jsonPrint(keepAliveObj.user)
        ));
    }
  });

  socket.on("TWITTER_FOLLOW", function twitterFollow(u) {

    console.log(chalkSocket("R< TWITTER_FOLLOW"
      + " | " + getTimeStamp()
      + " | SID: " + socket.id
      + " | UID: " + u.userId
      + " | @" + u.screenName
    ));

    follow({user: u}, function(err, results){
      if (err) {
        console.log(chalkError("TWITTER_FOLLOW ERROR: " + err));
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
        console.log(chalkError("TWITTER_UNFOLLOW ERROR: " + err));
        return;
      }

      console.log(chalk.blue("+++ TWITTER_UNFOLLOW"
        + " | @" + u.screenName
      ));

    });
  });

  let searchNode;
  let searchNodeHashtag;
  let searchNodeUser;
  let searchQuery = {};

  socket.on("TWITTER_SEARCH_NODE", function twitterSearchNode(sn) {

    searchNode = sn.toLowerCase();

    console.log(chalkSocket("TWITTER_SEARCH_NODE"
      + " | " + getTimeStamp()
      + " | SID: " + socket.id
      + " | " + searchNode
    ));

    if (searchNode.startsWith("#")) {

      nodeSearchType = "HASHTAG_UNCATEGORIZED";

      searchNodeHashtag = { nodeId: searchNode.substring(1) };

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

      if (searchNode.startsWith("@")) {

        searchNodeUser = { screenName: searchNode.substring(1) };

        if ((searchNodeUser.screenName === "?") && (nodeSearchBy === "createdAt")) {
          console.log(chalkInfo("SEARCH FOR UNCATEGORIZED USER | CREATED AT"));
          nodeSearchType = "USER_UNCATEGORIZED";
          searchNodeUser = { createdAt: previousUserUncategorizedCreated, following: true };
        }
        else if ((searchNodeUser.screenName === "?") && (nodeSearchBy === "lastSeen")) {
          console.log(chalkInfo("SEARCH FOR UNCATEGORIZED USER | LAST SEEN"));
          nodeSearchType = "USER_UNCATEGORIZED";
          searchNodeUser = { lastSeen: previousUserUncategorizedLastSeen, following: true };
        }
        else if (searchNodeUser.screenName === "?mm") {
          console.log(chalkInfo("SEARCH FOR MISMATCHED USER"));
          nodeSearchType = "USER_MISMATCHED";
          searchNodeUser = { nodeId: previousUserMismatchedId, following: true };
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
            
            if (twit) {
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
                else if (rawUser && (rawUser !== undefined)) {

                  userServerController.convertRawUser({user:rawUser}, function(err, cUser){

                    if (err) {
                      console.log(chalkError("*** TWITTER_SEARCH_NODE | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));

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
                    user.lastSeen = (cUser.status !== undefined) ? cUser.status.created_at : Date.now();

                    let nCacheObj = nodeCache.get(user.nodeId);

                    if (nCacheObj) {
                      user.mentions = Math.max(user.mentions, nCacheObj.mentions);
                      user.setMentions = true;
                    }

                    userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

                      if (err) {
                        console.log(chalkError("findOneUser ERROR: " + err));
                        socket.emit("SET_TWITTER_USER", user);
                      }
                      else {

                        console.log(chalk.blue("UPDATED updatedUser"
                          + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
                          + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
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
              socket.emit("TWITTER_SEARCH_NODE_FAIL", sn);
            }
          }
          else {
            console.log(chalkTwitter("--- TWITTER_SEARCH_NODE USER *NOT* FOUND"
              + "\nSEARCH TYPE: " + nodeSearchType
              + "\nNODE ID: " + searchNodeUser.screenName
              + "\nSCREEN NAME: " + searchNodeUser.screenName
              + "\nLAST SEEN: " + searchNodeUser.lastSeen
              + "\nCREATED: " + searchNodeUser.createdAt
              // + "\n" + jsonPrint(searchNodeUser)
            ));

            if (nodeSearchType === "USER_UNCATEGORIZED") {

              socket.emit("TWITTER_SEARCH_NODE_FAIL", sn);

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

            if (twit) {
              twit.get("users/show", twitQuery, function usersShow (err, rawUser, response){
                if (err) {
                  console.log(chalkError("ERROR users/show rawUser" + err));
                  console.log(chalkError("ERROR users/show rawUser\n" + jsonPrint(err)));
                  console.log(chalkError("ERROR users/show searchNodeUser:\n" + jsonPrint(searchNodeUser)));

                  socket.emit("TWITTER_SEARCH_NODE_FAIL", sn);
                }
                else if (rawUser && (rawUser !== undefined)) {

                  userServerController.convertRawUser({user:rawUser}, function(err, cUser){

                    if (err) {
                      console.log(chalkError("*** TWITTER_SEARCH_NODE | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));

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
                      if (nodeSearchType === "USER_MISMATCHED") { previousUserMismatchedId = searchNodeUser.nodeId; }

                      socket.emit("TWITTER_SEARCH_NODE_FAIL", sn);

                      return;
                    }

                    console.log(chalkTwitter("FOUND users/show rawUser"
                      + "\n" + printUser({user:cUser})
                    ));

                    cUser.updateLastSeen = true;
                    cUser.lastSeen = cUser.status.created_at;

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
                    // + "\nsearchNodeUser\n" + jsonPrint(searchNodeUser)
                  ));

                  socket.emit("TWITTER_SEARCH_NODE_FAIL", sn);
                }
              });
            }
            else {
              // socket.emit("SET_TWITTER_USER", updatedUser);
              socket.emit("TWITTER_SEARCH_NODE_FAIL", sn);
            }
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

    console.log(chalkSocket("R< USER READY"
      + " | " + getTimeStamp()
      + " | " + userObj.userId
      + " | SENT " + getTimeStamp(parseInt(userObj.timeStamp))
    ));

    socket.emit("USER_READY_ACK", { userId: userObj.userId, timeStamp: moment().valueOf() }, function(err){
      if (err) {
        console.log(chalkError("*** USER_READY_ACK SEND ERROR | " + userObj.userId));
      }
      else {
        console.log(chalkError("TXD> USER_READY_ACK | " + userObj.userId));
      }
    });
  });

  socket.on("VIEWER_READY", function viewerReady(viewerObj) {
    console.log(chalkSocket("VIEWER READY"
      + " | " + getTimeStamp()
      + " | " + viewerObj.viewerId
      + " | SENT AT " + getTimeStamp(parseInt(viewerObj.timeStamp))
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

  socket.on("tweet", function(tweet){
    if (configuration.verbose) { console.log(chalkInfo("R< TWEET | " + tweet.id_str + " | @" + tweet.user.screen_name)); }
    if (statsObj.tweetParserReady) { socketRxTweet(tweet); }
  });

  socket.on("categorize", categorizeNode);

  // side channel twitter auth in process...
  socket.on("login", function socketLogin(viewerObj){

    viewerObj.timeStamp = moment().valueOf();

    console.log(chalkAlert("LOGIN"
      + " | SID: " + socket.id
      + "\n" + jsonPrint(viewerObj)
    ));

    authInProgressTwitterUserCache.set(viewerObj.nodeId, viewerObj);
  });

  socket.on("STATS", function socketStats(statsObj){

    let serverObj = serverCache.get(socket.id);
    let viewerObj = viewerCache.get(socket.id);

    if (serverObj) {

      serverObj.status = "STATS";
      serverObj.stats = statsObj;
      serverObj.timeStamp = moment().valueOf();

      serverCache.set(socket.id, serverObj);

      if (configuration.verbose) {
        console.log(chalkSocket("R< STATS | " + serverObj.user.userId));
      }

      adminNameSpace.emit("SERVER_STATS", serverObj);
    }

    if (viewerObj) {

      viewerObj.status = "STATS";
      viewerObj.stats = statsObj;
      viewerObj.timeStamp = moment().valueOf();

      viewerCache.set(socket.id, viewerObj);

      if (configuration.verbose) {
        console.log(chalkSocket("R< STATS | " + viewerObj.user.userId));
      }

      adminNameSpace.emit("SERVER_STATS", viewerObj);
    }

    if (configuration.verbose) {
      console.log(chalkSocket("R< STATS | " + socket.id));
    }
  });
}

function initSocketNamespaces(callback){

  console.log(chalkInfo(getTimeStamp() + " | INIT SOCKET NAMESPACES"));

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

  statsObj.ioReady = true;

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

  if (!twit) {
    console.log(chalkError("TWIT\n" + jsonPrint(twit)));
    return;
  }

  twit.get("trends/place", {id: 1}, function updateTrendsWorldWide (err, data, response){

    // debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));
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

    // debug(chalkInfo("twit trends/place response\n" + jsonPrint(response)));

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

  console.log(chalk.bold.black("INIT UPDATE TRENDS INTERVAL: " + msToTime(interval)));

  clearInterval(updateTrendsInterval);

  if (twit) { updateTrends(); }

  updateTrendsInterval = setInterval(function updateTrendsIntervalCall () {

    if (twit) { updateTrends(); }

  }, interval);
}

function updateNodeMeter(node, callback){


  const nodeType = node.nodeType;

  if (!configuration.metrics.nodeMeterEnabled
    || (
        (nodeType !== "user") 
      && (nodeType !== "hashtag") 
      && (nodeType !== "emoji") 
      && (nodeType !== "word") 
      && (nodeType !== "url") 
      && (nodeType !== "media") 
      && (nodeType !== "place"))
    ) 
  {
    callback(null, node);
    return;
  }

  if (node.nodeId === undefined) {
    console.log(chalkError("NODE ID UNDEFINED\n" + jsonPrint(node)));
    callback("NODE ID UNDEFINED", node);
  }

  let nodeObj = {};

  nodeObj = pick(node, ["nodeId", "nodeType", "isServer",  "isIgnored", "rate", "mentions"]);

  let meterNodeId = nodeObj.nodeId;

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
    node.isIgnored = true;

    nodeMeter[meterNodeId] = null;
    nodeMeterType[nodeType][meterNodeId] = null;

    delete nodeMeter[meterNodeId];
    delete nodeMeterType[nodeType][meterNodeId];

    if (callback !== undefined) { callback(null, node); }
  }
  else {
    if (/TSS_/.test(meterNodeId) || nodeObj.isServer){
      debug(chalkLog("updateNodeMeter\n" + jsonPrint(nodeObj)));
      if (callback !== undefined) { callback(null, node); }
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
      globalNodeMeter.mark();
      
      nodeObj.rate = parseFloat(newMeter.toJSON()[metricsRate]);
      nodeObj.mentions += 1;

      node.rate = nodeObj.rate;
      node.mentions = nodeObj.mentions;

      nodeMeter[meterNodeId] = newMeter;
      nodeMeterType[nodeType][meterNodeId] = newNodeTypeMeter;

      nodeCache.set(meterNodeId, nodeObj);

      statsObj.nodeMeterEntries = Object.keys(nodeMeter).length;

      if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
        statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
        statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
        debug(chalkLog("NEW MAX NODE METER ENTRIES"
          + " | " + getTimeStamp()
          + " | " + statsObj.nodeMeterEntries.toFixed(0)
        ));
      }

      if (callback !== undefined) { callback(null, node); }
    }
    else {

      nodeMeter[meterNodeId].mark();
      globalNodeMeter.mark();

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
      node.rate = nodeObj.rate;

      let nCacheObj = nodeCache.get(meterNodeId);

      if (nCacheObj) {
        nodeObj.mentions = Math.max(nodeObj.mentions, nCacheObj.mentions);
      }

      nodeObj.mentions += 1;
      node.mentions = nodeObj.mentions;

      nodeCache.set(meterNodeId, nodeObj);

      if (callback !== undefined) { callback(null, node); }
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
    console.log(chalk.green("TWITTER USER SHOW TIMEOUT END"
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
  debug(chalkInfo("followableRegEx: " + followableRegEx));
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

    unfollowableUserSet.add(params.user.nodeId);

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

  console.log(chalk.bold.black("INIT TRANSMIT NODE QUEUE INTERVAL: " + msToTime(interval)));

  clearInterval(transmitNodeQueueInterval);

  let nodeObj;
  let followable;
  let nCacheObj;

  transmitNodeQueueInterval = setInterval(function txNodeQueue () {

    if (transmitNodeQueueReady && (transmitNodeQueue.length > 0)) {

      transmitNodeQueueReady = false;

      nodeObj = transmitNodeQueue.shift();

      if (!nodeObj) {
        console.log(chalkError(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q")));
        transmitNodeQueueReady = true;
      }
      else {

        nodeObj.updateLastSeen = true;

        if (!nodeObj.category || (nodeObj.category === undefined)) { nodeObj.category = false; }
        if (!nodeObj.categoryAuto || (nodeObj.categoryAuto === undefined)) { nodeObj.categoryAuto = false; }

        if (configuration.verbose) {
          console.log(chalkAlert("TX NODE DE-Q"
            + " | NID: " + nodeObj.nodeId
            + " | " + nodeObj.nodeType
            + " | CAT: " + nodeObj.category
            + " | CATA: " + nodeObj.categoryAuto
          ));
        }

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
              delete node._id;
              viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));
            }
            else {

              followable = userFollowable(n);

              if (twitAutoFollow && twitUserShowReady && followable){

                twitAutoFollow.get("users/show", 
                  {user_id: n.nodeId, include_entities: true}, 
                  function usersShow (err, rawUser, response){

                  if (err) {
                    twitUserShowReady = false;
                    startTwitUserShowRateLimitTimeout();
                    startTwitUserShowRateLimitTimeoutDuration *= 1.5;
                    if (startTwitUserShowRateLimitTimeoutDuration > 15*ONE_MINUTE) {
                      startTwitUserShowRateLimitTimeoutDuration = 15*ONE_MINUTE;
                    }
                    console.log(chalkError("ERROR users/show rawUser"
                      + " | UID: " + node.nodeId
                      + " | @" + node.screenName
                      + " | ERROR: " + err
                    ));
                    delete n._id;

                    // const nSmall = pick(n, fieldsTransmitKeys);

                    viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));
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
                    n.lastSeen = (rawUser.status !== undefined) ? rawUser.status.created_at : null;
                    n.updateLastSeen = true;

                    nCacheObj = nodeCache.get(n.nodeId);

                    if (nCacheObj) {
                      n.mentions = Math.max(n.mentions, nCacheObj.mentions);
                      n.setMentions = true;
                    }

                    userServerController.findOneUser(n, {noInc: false, fields: fieldsTransmit, lean: true}, function(err, updatedUser){
                      if (err) {
                        console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                        delete n._id;
                        viewNameSpace.volatile.emit("node", n);
                      }
                      else {

                        delete n._id;
                        viewNameSpace.volatile.emit("node", updatedUser);

                        if (!unfollowableUserSet.has(updatedUser.nodeId)) { 
                          autoFollowUser({ threeceeUser: "altthreecee02", user: updatedUser });
                        }

                      }
                    });
                  }
                  else {
                    delete n._id;
                    viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));
                  }
                });
              }
              else if ((n.nodeType === "user") && n.category){

                nCacheObj = nodeCache.get(n.nodeId);

                if (nCacheObj) {
                  n.mentions = Math.max(n.mentions, nCacheObj.mentions);
                  n.setMentions = true;
                }

                n.updateLastSeen = true;

                userServerController.findOneUser(n, {noInc: false, fields: fieldsTransmit}, function(err, updatedUser){
                  if (err) {
                    console.log(chalkError("findOneUser ERROR" + jsonPrint(err)));
                    delete n._id;
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else {
                    delete n._id;
                    viewNameSpace.volatile.emit("node", updatedUser);
                  }
                });
              }
              else if (n.nodeType === "user") {
                delete n._id;
                viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));
              }

              if ((n.nodeType === "hashtag") && n.category){

                n.updateLastSeen = true;

                hashtagServerController.findOneHashtag(n, {noInc: false}, function(err, updatedHashtag){
                  if (err) {
                    console.log(chalkError("updatedHashtag ERROR\n" + jsonPrint(err)));
                    delete n._id;
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else if (updatedHashtag) {
                    delete n._id;
                    viewNameSpace.volatile.emit("node", updatedHashtag);
                  }
                  else {
                    delete n._id;
                    viewNameSpace.volatile.emit("node", n);
                  }
                });
              }
              else if (n.nodeType === "hashtag") {
                delete n._id;
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "emoji"){
                delete n._id;
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "media"){
                delete n._id;
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "place"){
                delete n._id;
                viewNameSpace.volatile.emit("node", n);
              }

              if (n.nodeType === "word"){
                delete n._id;
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
  if (configuration.verbose) {
    console.log("TX NODES | TW ID: " + tw.tweetId + " | @" + tw.user.screenName);
  }

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
    + " | " + getTimeStamp() 
    + " | ST: " + getTimeStamp(parseInt(statsObj.startTime)) 
    + " | UP: " + msToTime(statsObj.upTime) 
    + " | RN: " + msToTime(statsObj.runTime) 
    + " | MEM: " + memoryAvailableMB.toFixed(0) + " AVAIL"
    + " / " + memoryTotalMB.toFixed(0) + " TOTAL MB"
    + " - " + memoryAvailablePercent.toFixed(3) + " %"
  ));
}

//=================================
// INIT APP ROUTING
//=================================
function slackMessageHandler(messageObj){

  console.log(chalk.blue("R< SLACK MSG"
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
        console.log(chalkLog("METRICS RATE: " + metricsRate));
      }
    break;
    default:
      console.log(chalkError("UNKNOWN SLACK OP: " + op));
  }
}

let dropboxFolderGetLastestCursorReady = true;

function initAppRouting(callback) {

  console.log(chalkInfo(getTimeStamp() + " | INIT APP ROUTING"));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(exp.static(__dirname + "/public"));

  app.use(function requestLog(req, res, next) {

    if (req.path === "/dropbox_webhook") {

      debug(chalkAlert("R< dropbox_webhook"
        + "\nreq.query: " + jsonPrint(req.query)
        + "\nreq.params: " + jsonPrint(req.params)
        + "\nreq.body: " + jsonPrint(req.body)
      )); 

      res.send(req.query.challenge);


      if (dropboxFolderGetLastestCursorReady) {

        dropboxFolderGetLastestCursorReady = false;

        dropboxFolderGetLastestCursor(bestNetworkFolder, function(err, response){

          if (err) {
            setTimeout(function(){
              dropboxFolderGetLastestCursorReady = true;
              next();
            }, 1000);
          }
          else if (response && (response.entries.length > 0)) {

            setTimeout(function(){
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

              dropboxFolderGetLastestCursorReady = true;

            }, 1000);

          }
        });
      }
    }
    else if (req.path === "/googleccd19766bea2dfd2.html") {
      console.log(chalkAlert("R< googleccd19766bea2dfd2.html")); 

      const googleVerification = __dirname + "/googleccd19766bea2dfd2.html";

      res.sendFile(googleVerification, function googleVerify(err) {
        if (err) {
          console.log(chalkError("GET /googleccd19766bea2dfd2.html ERROR:"
            + " | " + getTimeStamp()
            + " | " + req.url
            + " | " + googleVerification
            + " | " + err
          ));
        } 
        else {
          console.log(chalkInfo("SENT:", googleVerification));
        }
      });
    }
    else if (req.path === "/") {
      console.log(chalkLog("R< REDIRECT /session")); 
      res.redirect("/session");
    }
    else if (req.path === "/categorize"){
      console.log(chalkLog("R< CATEGORIZE"
        + " | req.query: " + jsonPrint(req.query)
        + " | req.params: " + jsonPrint(req.params)
      ));
      res.sendStatus(200);
    }
    else if (req.path === "/slack_event"){
      if (req.body.type === "url_verification") {
        console.log(chalkAlert("R< SLACK URL VERIFICATION"
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
          console.log(chalkAlert("R< ??? UNKNOWN SLACK EVENT TYPE\n" + util.inspect(req.body, {showHidden:false, depth:1})));
        }
        res.sendStatus(200);
      }
    }
    else {
      console.log(chalkLog("R<"
        + " | " + getTimeStamp()
        + " | IP: " + req.ip
        + " | HOST: " + req.hostname
        + " | METHOD: " + req.method
        + " | PATH: " + req.path
      ));
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
        console.log(chalkError("GET /session ERROR:"
          + " | " + getTimeStamp()
          + " | " + req.url
          + " | " + adminHtml
          + " | " + err
        ));
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
        console.log(chalkError("GET /session ERROR:"
          + " | " + getTimeStamp()
          + " | " + req.url
          + " | " + sessionHtml
          + " | " + err
        ));
      } 
      else {
        debug(chalkInfo("SENT:", sessionHtml));
      }
    });
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
      console.log(chalk.green("PASSPORT TWITTER AUTHENTICATED"));
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
        console.log(chalk.green("TWITTER USER AUTHENTICATED: @" + user.screenName));  // handle errors
        slackPostMessage(slackChannel, "USER AUTH: @" + user.screenName);
        authenticatedTwitterUserCache.set(user.nodeId, user);
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
      console.log(chalk.green("PASSPORT AUTH TWITTER"
        + " | req.query: " + jsonPrint(req.query)
        + " | req.params: " + jsonPrint(req.params)
      ));
    });

  app.get("/auth/twitter/callback",
    passport.authenticate("twitter", { successRedirect: "/account", failureRedirect: "/auth/twitter/error" }),
    function(req, res) {
      console.log(chalk.green("PASSPORT AUTH TWITTER CALLBACK"));
    });

  app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
  });

  callback(null);
}

function testInternetConnection(params, callback) {

  // console.log("testInternetConnection | statsObj.internetReady: " + statsObj.internetReady);

  if (statsObj.internetReady) {
    return callback(null, true);
  }

  let testClient = net.createConnection(80, params.url);

  testClient.on("connect", function testConnect() {

    statsObj.internetReady = true;
    statsObj.socket.connects += 1;

    console.log(chalkInfo(getTimeStamp() + " | CONNECTED TO " + params.url + ": OK"));
    console.log(chalkInfo(getTimeStamp() + " | SEND INTERNET_READY"));

    configEvents.emit("INTERNET_READY");
    testClient.destroy();

    callback(null, true);

  });

  testClient.on("error", function testError(err) {

    if (err) {
      if (err.code !== "ENOTFOUND") {
        console.log(chalkError("testClient ERROR " + jsonPrint(err)));
      }
    }

    statsObj.internetReady = false;
    statsObj.internetTestError = err;
    statsObj.socket.testClient.errors += 1;

    console.log(chalkError(getTimeStamp()
      + " | TEST INTERNET ERROR | CONNECT ERROR: " + params.url + " : " + err.code));

    testClient.destroy();
    configEvents.emit("INTERNET_NOT_READY");

    callback(err, false);
  });
}

function initInternetCheckInterval(interval){

  debug(chalkInfo(getTimeStamp() 
    + " | INIT INTERNET CHECK INTERVAL | " + interval + " MS"));

  clearInterval(internetCheckInterval);

  let params = {url: configuration.testInternetConnectionUrl};

  testInternetConnection(params, function(err, internetReady){
  });

  internetCheckInterval = setInterval(function internetCheck(){

    testInternetConnection(params, function(err, internetReady){
    });

  }, interval);
}

function initTwitterRxQueueInterval(interval){

  let tweet = {};

  statsObj.tweetParserSendReady = true;

  console.log(chalk.bold.black("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

    if ((tweetRxQueue.length > 0) && statsObj.tweetParserReady && statsObj.tweetParserSendReady) {

      tweet = tweetRxQueue.shift();

      // if (configuration.verbose) {
      //   console.log(chalkInfo("TPQ<"
      //     // + " [" + tweetRxQueue.size() + "]"
      //     + " [" + tweetRxQueue.length + "]"
      //     // + " | " + socket.id
      //     + " | " + tweet.id_str
      //     + " | " + tweet.user.id_str
      //     + " | " + tweet.user.screen_name
      //     + " | " + tweet.user.name
      //   ));
      // }

      childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({ op: "tweet", tweetStatus: tweet }, function sendTweetParser(err){

        if (err) {
          console.log(chalkError("*** TWEET PARSER SEND ERROR"
            + " | " + err
          ));

          if (quitOnError) {
            quit("TWEET PARSER SEND ERROR");
          }
          statsObj.tweetParserSendReady = false;

          childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].status = "ERROR";
        }
        else {
          statsObj.tweetParserSendReady = true;
          childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].status = "RUNNING";
        }
      });

    }
  }, interval);
}

let htObj = {};
let categoryObj = {};

function initHashtagLookupQueueInterval(interval){

  let hashtagLookupQueueReady = true;

  console.log(chalk.bold.black("INIT HASHTAG LOOKUP QUEUE INTERVAL | " + msToTime(interval)));

  clearInterval(hashtagLookupQueueInterval);

  hashtagLookupQueueInterval = setInterval(function hashtagLookupQueueDeQ() {

    if ((hashtagLookupQueue.length > 0) && hashtagLookupQueueReady) {

      hashtagLookupQueueReady = false;

      htObj = hashtagLookupQueue.shift();


      hashtagServerController.findOne({hashtag: htObj}, function(err, hashtag){
        if (err) {
          console.log(chalkError("HASHTAG FIND ONE ERROR\n" + jsonPrint(err)));
        }
        else if (hashtag) { 

          categoryObj = {};

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

  console.log(chalk.bold.black("INIT TWEET PARSER MESSAGE RX QUEUE INTERVAL | " + msToTime(interval)));

  clearInterval(tweetParserMessageRxQueueInterval);

  let tweetParserMessage = {};
  let tweetObj = {};

  tweetParserMessageRxQueueInterval = setInterval(function tweetParserMessageRxQueueDequeue() {

    if ((tweetParserMessageRxQueue.length > 0) && tweetParserMessageRxQueueReady) {

      tweetParserMessageRxQueueReady = false;

      tweetParserMessage = tweetParserMessageRxQueue.shift();

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
                console.log(chalkError("TRANSMIT NODES ERROR\n" + err));
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
        console.log(chalkError("*** TWEET PARSER UNKNOWN OP"
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

    let objA = {};
    let objB = {};

    const sortedKeys = keys.sort(function(a,b){
      objA = params.obj[a];
      objB = params.obj[b];
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

  console.log(chalk.bold.black("INIT SORTER RX MESSAGE QUEUE INTERVAL | " + msToTime(interval)));

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

  let keySortParams;

  keySortInterval = setInterval(function(){

    if (keySortQueue.length > 0) {

      keySortReady = false;

      keySortParams = keySortQueue.shift();

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
          debug(chalkInfo(">PING | SORTER | PING ID: " + getTimeStamp(pingId)));
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
      debug(chalkInfo("<PONG | SORTER | PONG ID: " + getTimeStamp(m.pongId)));
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
      console.log(chalkError("*** SORTER SEND ERROR"
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
    console.log(chalkError(getTimeStamp()
      + " | *** SORTER ERROR ***"
      + " \n" + jsonPrint(err)
    ));
    childrenHashMap[params.childId].status = "ERROR";
    configEvents.emit("CHILD_ERROR", { childId: params.childId, err: err });
  });

  childrenHashMap[params.childId].child.on("exit", function sorterExit(code, signal){
    console.log(chalkError(getTimeStamp()
      + " | *** SORTER EXIT ***"
      + " | PID: " + childrenHashMap[params.childId].child.pid
      + " | EXIT CODE: " + code
      + " | EXIT SIGNAL: " + signal
    ));
    childrenHashMap[params.childId].status = "EXIT";

    if (code > 0) { configEvents.emit("CHILD_ERROR", { childId: params.childId, err: "SORTER EXIT" }); }
  });

  childrenHashMap[params.childId].child.on("close", function sorterClose(code, signal){
    console.log(chalkError(getTimeStamp()
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

  console.log(chalk.bold.black("INIT TWEET PARSER\n" + jsonPrint(params)));

  statsObj.tweetParserReady = false;

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
    console.log(chalkError(getTimeStamp()
      + " | *** TWEET PARSER ERROR ***"
      + " \n" + jsonPrint(err)
    ));
    statsObj.tweetParserSendReady = false;
    statsObj.tweetParserReady = false;
    childrenHashMap[params.childId].status = "ERROR";
  });

  twp.on("exit", function tweetParserExit(code){
    console.log(chalkError(getTimeStamp()
      + " | *** TWEET PARSER EXIT ***"
      + " | EXIT CODE: " + code
    ));
    statsObj.tweetParserSendReady = false;
    statsObj.tweetParserReady = false;
    childrenHashMap[params.childId].status = "EXIT";
  });

  twp.on("close", function tweetParserClose(code){
    console.log(chalkError(getTimeStamp()
      + " | *** TWEET PARSER CLOSE ***"
      + " | EXIT CODE: " + code
    ));
    statsObj.tweetParserSendReady = false;
    statsObj.tweetParserReady = false;
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
    interval: TWEET_PARSER_INTERVAL,
    // verbose: configuration.verbose
    verbose: false
  }, function tweetParserMessageRxError(err){
    if (err) {
      console.log(chalkError("*** TWEET PARSER SEND ERROR"
        + " | " + err
      ));
      statsObj.tweetParserSendReady = false;
      statsObj.tweetParserReady = false;
      childrenHashMap[params.childId].status = "ERROR";
    }
    else {
      statsObj.tweetParserSendReady = true;
      statsObj.tweetParserReady = true;
      childrenHashMap[params.childId].status = "INIT";
    }
  });

  if (callback !== undefined) { callback(null, twp); }
}

function initRateQinterval(interval){

  console.log(chalk.bold.black("INIT RATE QUEUE INTERVAL | " + msToTime(interval)));
  
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

  
  let queueNames;

  let updateTimeSeriesCount = 0;

  let paramsSorterOverall = {};
  let paramsSorter = {};

  updateMetricsInterval = setInterval(function updateMetrics () {

    statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
    statsObj.queues.tweetRxQueue = tweetRxQueue.length;
    statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.length;
    statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.length;

    updateTimeSeriesCount += 1;

    if (updateTimeSeriesCount % RATE_QUEUE_INTERVAL_MODULO === 0){


      cacheObjKeys.forEach(function statsCachesUpdate(cacheName){
        if (cacheName === "nodesPerMinuteTopTermNodeTypeCache") {
          DEFAULT_NODE_TYPES.forEach(function(nodeType){
            statsObj.caches[cacheName][nodeType].stats.keys = cacheObj[cacheName][nodeType].getStats().keys;

            if (statsObj.caches[cacheName][nodeType].stats.keys > statsObj.caches[cacheName][nodeType].stats.keysMax) {
              statsObj.caches[cacheName][nodeType].stats.keysMax = statsObj.caches[cacheName][nodeType].stats.keys;
              statsObj.caches[cacheName][nodeType].stats.keysMaxTime = moment().valueOf();
              console.log(chalkInfo("MAX CACHE"
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
            console.log(chalkInfo("MAX CACHE"
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
           + " | " + getTimeStamp()
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
           + " | " + getTimeStamp()
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
           + " | " + getTimeStamp()
          ));

        }
      }


      DEFAULT_NODE_TYPES.forEach(function(nodeType){

        paramsSorter = {};
        paramsSorter.op = "SORT";
        paramsSorter.nodeType = nodeType;
        paramsSorter.sortKey = metricsRate;
        paramsSorter.max = configuration.maxTopTerms;
        paramsSorter.obj = {};

        async.each(Object.keys(nodeMeterType[nodeType]), function sorterParams(meterId, cb){

          if (!nodeMeterType[nodeType][meterId]) {
            console.log(chalkError("*** ERROR NULL nodeMeterType[" + nodeType + "]: " + meterId));
          }

          paramsSorter.obj[meterId] = pick(nodeMeterType[nodeType][meterId].toJSON(), paramsSorter.sortKey);

          cb();

        }, function(err){

          if (err) {
            console.log(chalkError("ERROR RATE QUEUE INTERVAL\n" + err ));
          }

          keySortQueue.push(paramsSorter);

        });
      });

      paramsSorterOverall = {};
      paramsSorterOverall.op = "SORT";
      paramsSorterOverall.nodeType = "overall";
      paramsSorterOverall.sortKey = metricsRate;
      paramsSorterOverall.max = configuration.maxTopTerms;
      paramsSorterOverall.obj = {};

      async.each(Object.keys(nodeMeter), function sorterParams(meterId, cb){

        if (!nodeMeter[meterId]) {
          console.log(chalkError("*** ERROR NULL nodeMeter[meterId]: " + meterId));
        }

        paramsSorterOverall.obj[meterId] = pick(nodeMeter[meterId].toJSON(), paramsSorterOverall.sortKey);

        cb();
      }, function(err){
        if (err) {
          console.log(chalkError("ERROR RATE QUEUE INTERVAL\n" + err ));
        }

        keySortQueue.push(paramsSorterOverall);
      });

    }

  }, interval);
}

let loadBestNetworkInterval;

function loadBestRuntimeNetwork(){
  loadFile(bestNetworkFolder, bestRuntimeNetworkFileName, function(err, bRtNnObj){

    if (err) {
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: FILE NOT FOUND:  " 
          + bestNetworkFolder + "/" + bestRuntimeNetworkFileName
        ));
      }
      else {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: " + err));
      }
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
          if (err.code === "ENOTFOUND") {
            console.log(chalkError("*** LOAD BEST NETWORK ERROR: FILE NOT FOUND:  "
              + bestNetworkFolder + "/" + file
            ));
          }
          else {
            console.log(chalkError("*** LOAD BEST NETWORK ERROR: " + err));
          }
       }
        else {

          if (nnObj) { 
            nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
            bestNetworkObj = {};
            bestNetworkObj = deepcopy(nnObj);
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
                bestNetworkObj = {};
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

          if (bestNetworkObj && (tweetParser !== undefined) && (statsObj.previousBestNetworkId !== bestNetworkObj.networkId)) {

            if (bestNetworkObj) { statsObj.previousBestNetworkId = bestNetworkObj.networkId; }

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
                console.log(chalkError("*** TWEET PARSER SEND NETWORK ERROR"
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

let configInterval;

function initConfigInterval(interval){

  console.log(chalk.bold.black("INIT CONFIG INTERVAL | " + msToTime(interval)));

  clearInterval(configInterval);

  const loadConfigFileParams = {
    folder: dropboxConfigDefaultFolder,
    file: dropboxConfigDefaultFile
  };

  configInterval = setInterval(function(){

    loadConfigFile(loadConfigFileParams, function(err0){

      if (err0) {
        console.log(chalkError("*** LOAD CONFIGURATION FILE ERROR: " + err0));
        quit("LOAD CONFIGURATION FILE ERROR");
        return;
      }

      if (statsObj.commandLineArgsLoaded) {
        debug(chalkLog("... SKIP LOAD COMMAND LINE ARGS | ALREADY LOADED"));
        return;
      }
      

      loadCommandLineArgs(function(err1, results){

        if (err1) {
          console.log(chalkError("*** LOAD COMMAND LINE ARGS ERROR: " + err1));
          quit("LOAD COMMAND LINE ARGS ERROR");
          return;
        }

        const configArgs = Object.keys(configuration);

        configArgs.forEach(function(arg){
          if (_.isObject(configuration[arg])) {
            console.log(chalkLog("WA | _FINAL CONFIG | " + arg + ": " + jsonPrint(configuration[arg])));
          }
          else {
            console.log(chalkLog("WA | _FINAL CONFIG | " + arg + ": " + configuration[arg]));
          }
        });
        
        statsObj.commandLineArgsLoaded = true;

      });

    });

  }, interval);
}

function initLoadBestNetworkInterval(interval){

  clearInterval(loadBestNetworkInterval);

  loadBestRuntimeNetwork();

  loadBestNetworkInterval = setInterval(function(){

    loadBestRuntimeNetwork();
  
  }, interval);
}
// kludge
// probably can write one general purpose function to handle all types of nodes

function initCategoryHashmaps(callback){

  console.log(chalk.bold.black("INIT CATEGORIZED USER + HASHTAG HASHMAPS FROM DB"));

  async.series({

    hashtag: function(cb){

      let p = {};

      p.skip = 0;
      p.batchSize = configuration.cursorBatchSize;
      p.limit = configuration.findCatHashtagLimit;
      p.verbose = false;

      let more = true;
      let totalCount = 0;
      let totalManual = 0;
      let totalAuto = 0;
      let totalMatched = 0;
      let totalMismatched = 0;
      let totalMatchRate = 0;

      debug(chalkInfo("WA | LOADING CATEGORIZED HASHTAGS FROM DB ..."));

      async.whilst(

        function() {
          return more;
        },

        function(cb0){

          hashtagServerController.findCategorizedHashtagsCursor(p, function(err, results){

            if (err) {
              console.log(chalkError("WA | ERROR: initCategorizedHashtagHashmap: hashtagServerController: findCategorizedHashtagsCursor" + err));
              cb0(err);
            }
            else if (results) {

              statsObj.db.totalHashtags = results.totalHashtags;

              more = true;
              totalCount += results.count;
              totalManual += results.manual;
              totalAuto += results.auto;
              totalMatched += results.matched;
              totalMismatched += results.mismatched;

              totalMatchRate = 100*(totalMatched/(totalMatched+totalMismatched));

              Object.keys(results.obj).forEach(function(nodeId){
                categorizedHashtagHashMap.set(nodeId, results.obj[nodeId]);
              });

              // if (configuration.verbose) {
              //   console.log(chalkInfo("WA | LOADING CATEGORIZED HASHTAGS FROM DB"
              //     + " | TOTAL CATEGORIZED: " + totalCount
              //     + " | TOTAL CATEGORIZED: " + totalCount
              //     + " | LIMIT: " + p.limit
              //     + " | SKIP: " + p.skip
              //     + " | " + totalManual + " MAN"
              //     + " | " + totalAuto + " AUTO"
              //     + " | " + totalMatched + " MATCHED"
              //     + " / " + totalMismatched + " MISMATCHED"
              //     + " | " + totalMatchRate.toFixed(2) + "% MATCHRATE"
              //   ));
              // }

              p.skip += results.count;

              cb0();
            }
            else {

              more = false;

              console.log(chalk.bold.blue("LOADED CATEGORIZED HASHTAGS FROM DB"
                + " | TOTAL HASHTAGS: " + statsObj.db.totalHashtags
                + " | TOTAL CATEGORIZED: " + totalCount
                + " | LIMIT: " + p.limit
                + " | SKIP: " + p.skip
                + " | " + totalManual + " MAN"
                + " | " + totalAuto + " AUTO"
                + " | " + totalMatched + " MATCHED"
                + " / " + totalMismatched + " MISMATCHED"
                + " | " + totalMatchRate.toFixed(2) + "% MATCHRATE"
              ));

              cb0();
            }
          });
        },

        function(err){
          if (err) {
            console.log(chalkError("WA | INIT CATEGORIZED HASHTAG HASHMAP ERROR: " + err + "\n" + jsonPrint(err)));
          }
          cb(err);
        }
      );
    },

    user: function(cb){

      let p = {};

      p.skip = 0;
      p.batchSize = configuration.cursorBatchSize;
      p.limit = configuration.findCatUserLimit;
      // p.verbose = configuration.verbose;
      p.verbose = false;

      let more = true;
      let totalCount = 0;
      let totalManual = 0;
      let totalAuto = 0;
      let totalMatched = 0;
      let totalMismatched = 0;
      let totalMatchRate = 0;

      debug(chalkInfo("WA | LOADING CATEGORIZED USERS FROM DB ..."));

      async.whilst(

        function() {
          return more;
        },

        function(cb0){

          userServerController.findCategorizedUsersCursor(p, function(err, results){

            if (err) {
              console.log(chalkError("WA | ERROR: initCategorizedUserHashmap: userServerController: findCategorizedUsersCursor" + err));
              cb0(err);
            }
            else if (results) {

              statsObj.db.totalUsers = results.totalUsers;

              more = true;
              totalCount += results.count;
              totalManual += results.manual;
              totalAuto += results.auto;
              totalMatched += results.matched;
              totalMismatched += results.mismatched;

              totalMatchRate = 100*(totalMatched/(totalMatched+totalMismatched));

              // results.obj[nodeId] = { manual: user.category, auto: user.categoryAuto };

              Object.keys(results.obj).forEach(function(nodeId){
                categorizedUserHashMap.set(nodeId, results.obj[nodeId]);
              });

              // if (configuration.verbose) {
              //   console.log(chalkInfo("WA | LOADING CATEGORIZED USERS FROM DB"
              //     + " | TOTAL USERS: " + statsObj.db.totalUsers
              //     + " | TOTAL CATEGORIZED: " + totalCount
              //     + " | LIMIT: " + p.limit
              //     + " | SKIP: " + p.skip
              //     + " | " + totalManual + " MAN"
              //     + " | " + totalAuto + " AUTO"
              //     + " | " + totalMatched + " MATCHED"
              //     + " / " + totalMismatched + " MISMATCHED"
              //     + " | " + totalMatchRate.toFixed(2) + "% MATCHRATE"
              //   ));
              // }

              p.skip += results.count;

              cb0();
            }
            else {

              more = false;

              console.log(chalk.bold.blue("LOADED CATEGORIZED USERS FROM DB"
                + " | TOTAL USERS: " + statsObj.db.totalUsers
                + " | TOTAL CATEGORIZED: " + totalCount
                + " | LIMIT: " + p.limit
                + " | SKIP: " + p.skip
                + " | " + totalManual + " MAN"
                + " | " + totalAuto + " AUTO"
                + " | " + totalMatched + " MATCHED"
                + " / " + totalMismatched + " MISMATCHED"
                + " | " + totalMatchRate.toFixed(2) + "% MATCHRATE"
              ));

              cb0();
            }
          });
        },

        function(err){
          if (err) {
            console.log(chalkError("WA | INIT CATEGORIZED USER HASHMAP ERROR: " + err + "\n" + jsonPrint(err)));
          }
          cb(err);
        }
      );
    }

  }, function(err){
    if (err) {
      console.log(chalkError("ERROR: initCategoryHashmaps: " + err));
      if (callback !== undefined) { callback(err); }
    }
    else {
      debug(chalk.blue("LOAD COMPLETE: initCategoryHashmaps"));
      if (callback !== undefined) { callback(); }
    }

  });
}

function initialize(callback){

  statsObj.status = "INITIALIZE";

  killAll();

  io = require("socket.io")(httpServer, ioConfig);

  debug(chalkBlue("INITIALIZE configuration\n" + jsonPrint(configuration)));

  if (debug.enabled || debugCache.enabled){
    console.log("\nWA | %%%%%%%%%%%%%%\nWA |  DEBUG ENABLED \nWA | %%%%%%%%%%%%%%\n");
  }

  configuration.processName = process.env.WA_PROCESS_NAME || "node_wordAssoServer";
  configuration.verbose = (process.env.WA_VERBOSE_MODE === "true" || process.env.WA_VERBOSE_MODE === true) || false ;
  configuration.quitOnError = process.env.WA_QUIT_ON_ERROR || false ;
  configuration.enableStdin = process.env.WA_ENABLE_STDIN || true ;

  // const loadConfigFileParams = {
  //   folder: dropboxConfigDefaultFolder,
  //   file: dropboxConfigDefaultFile
  // };

  // loadConfigFile(loadConfigFileParams, function(err){

  //   if (err) {
  //     console.log(chalkError("*** LOAD CONFIGURATION FILE ERROR: " + err));
  //     quit("LOAD CONFIGURATION FILE ERROR");
  //     return callback(err);
  //   }

  //   loadCommandLineArgs(function(err, results){
    
  //     const configArgs = Object.keys(configuration);

  //     configArgs.forEach(function(arg){
  //       if (_.isObject(configuration[arg])) {
  //         console.log("WA | _FINAL CONFIG | " + arg + ": " + jsonPrint(configuration[arg]));
  //       }
  //       else {
  //         console.log("WA | _FINAL CONFIG | " + arg + ": " + configuration[arg]);
  //       }
  //     });
      
  //     statsObj.commandLineArgsLoaded = true;

  //     if (!statsObj.internetReady) { 
  //       initInternetCheckInterval(10000);
  //     }

  //     callback(err);
  //   });
  // });

  initConfigInterval(DEFAULT_CONFIG_INIT_INTERVAL);

  if (!statsObj.internetReady) { 
    initInternetCheckInterval(10000);
  }

  callback();
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

  console.log(chalk.bold.black("INIT STATS INTERVAL"
    + " | " + msToTime(interval)
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
        + " | " + getTimeStamp()
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
    statsObj.timeStamp = getTimeStamp();
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
        + " | " + getTimeStamp()
        + " | " + statsObj.nodeMeterEntries.toFixed(0)
      ));
    }

    statsObj.memory.heap = process.memoryUsage().heapUsed/(1024*1024);

    if (statsObj.memory.heap > statsObj.memory.maxHeap) {
      statsObj.memory.maxHeap = statsObj.memory.heap;
      statsObj.memory.maxHeapTime = moment().valueOf();
      debug(chalkLog("NEW MAX HEAP"
        + " | " + getTimeStamp()
        + " | " + statsObj.memory.heap.toFixed(0) + " MB"
      ));
    }

    statsObj.memory.memoryAvailable = os.freemem();
    statsObj.memory.memoryTotal = os.totalmem();
    statsObj.memory.memoryUsage = process.memoryUsage();

    if (adminNameSpace) { statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; }// userNameSpace.sockets.length ;
    if (utilNameSpace) { statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; } // userNameSpace.sockets.length ;
    if (viewNameSpace) { statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; } // userNameSpace.sockets.length ;

    saveStats(statsFile, statsObj, function saveStatsComplete(status){
      debug(chalkLog("SAVE STATS " + status));
    });

    showStats();

    statsUpdated += 1;

  }, interval);
}

function initCategoryHashmapsInterval(interval){

  console.log(chalk.bold.black("INIT CATEGORY HASHMAP INTERVAL"
    + " | " + msToTime(interval)
  ));

  clearInterval(categoryHashmapsInterval);

  categoryHashmapsInterval = setInterval(function updateMemStats() {

    if (statsObj.dbConnectionReady && initCategoryHashmapsReady) {

      debug(chalkAlert("--- IN CATEGORY HASHMAP INTERVAL"
        + " | " + msToTime(interval)
      ));

      initCategoryHashmapsReady = false;

      initCategoryHashmaps(function(err){

        initCategoryHashmapsReady = true;

        if (err) {
          console.log(chalkError("ERROR: LOAD CATEGORY HASHMAPS: " + err));
        }
        else {
          debug(chalk.bold.green("+++ LOADED CATEGORY HASHMAPS"));
        }
      });
    }

  }, interval);
}

initStats(function setCacheObjKeys(){
  cacheObjKeys = Object.keys(statsObj.caches);
});

initialize(function initializeComplete(err) {
  if (err) {
    console.log(chalkError("*** INITIALIZE ERROR ***\n" + jsonPrint(err)));
  } 
  else {
    debug(chalkLog("INITIALIZE COMPLETE"));

    initUnfollowableUserSet();
    initSorterMessageRxQueueInterval(DEFAULT_INTERVAL);
    initSaveFileQueue(configuration);
    initIgnoreWordsHashMap();
    initTransmitNodeQueueInterval(TRANSMIT_NODE_QUEUE_INTERVAL);
    initCategoryHashmapsInterval(configuration.categoryHashmapsUpdateInterval);
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

    initKeySortInterval(configuration.keySortInterval);
    initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, twp){
      if (!err) { tweetParser = twp; }
    });
    initStatsInterval(STATS_UPDATE_INTERVAL);
    slackPostMessage(slackChannel, "\n*INIT* | " + hostname + "\n");

  }
});

module.exports = {
  app: app,
  io: io,
  http: httpServer
};