/*jslint node: true */
/*jshint sub:true*/
"use strict";

const TWITTER_AUTH_CALLBACK_URL = "https://word.threeceelabs.com/auth/twitter/callback";
// const TWITTER_AUTH_CALLBACK_URL = "http://localhost:9997/auth/twitter/callback";

global.dbConnection = false;
let dbConnectionReady = false;
let initCategoryHashmapsReady = true;

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const NS_PER_SEC = 1e9;
let time = process.hrtime();
let diff = process.hrtime(time);
let deltaNS = diff[0] * NS_PER_SEC + diff[1];

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const DEFAULT_FORCE_FOLLOW = false;

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

const DEFAULT_THREECEE_USERS = ["altthreecee00", "altthreecee01", "altthreecee02", "altthreecee03"];

const DEFAULT_SORTER_CHILD_ID = "wa_node_sorter";
const DEFAULT_TSS_CHILD_ID = "wa_node_tss";
const DEFAULT_TWEET_PARSER_CHILD_ID = "wa_node_tweetParser";

const DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER = "altthreecee00";
const DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER_FILE = DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER + ".json";

const DEFAULT_TWITTER_CONFIG_THREECEE = "altthreecee00";
const DEFAULT_TWITTER_CONFIG_THREECEE_FILE = DEFAULT_TWITTER_CONFIG_THREECEE + ".json";

const DEFAULT_INTERVAL = 10;
const DEFAULT_PING_INTERVAL = 30*ONE_SECOND;
const DEFAULT_DROPBOX_LIST_FOLDER_LIMIT = 50;
const DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT = 1*ONE_SECOND;
const DEFAULT_MIN_FOLLOWERS_AUTO = 15000;
const DEFAULT_RATE_QUEUE_INTERVAL = ONE_SECOND; // 1 second
const DEFAULT_RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const DEFAULT_TWEET_PARSER_INTERVAL = 10;
const DEFAULT_SORTER_INTERVAL = 10;
const DEFAULT_TWITTER_RX_QUEUE_INTERVAL = 10;
const DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL = 10;
const DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = 10;
const DEFAULT_UPDATE_TRENDS_INTERVAL = 15*ONE_MINUTE;
const DEFAULT_STATS_UPDATE_INTERVAL = ONE_MINUTE;
const DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL = 5*ONE_MINUTE;
const DEFAULT_HASHTAG_LOOKUP_QUEUE_INTERVAL = 10;

const DEFAULT_SOCKET_AUTH_TIMEOUT = 30*ONE_SECOND;
const DEFAULT_QUIT_ON_ERROR = false;
const DEFAULT_MAX_TOP_TERMS = 100;
const DEFAULT_METRICS_NODE_METER_ENABLED = true;

const DEFAULT_MAX_QUEUE = 200;
const DEFAULT_OFFLINE_MODE = process.env.OFFLINE_MODE || false; // if network connection is down, will auto switch to OFFLINE_MODE
const DEFAULT_AUTO_OFFLINE_MODE = true; // if network connection is down, will auto switch to OFFLINE_MODE
const DEFAULT_IO_PING_INTERVAL = ONE_MINUTE;
const DEFAULT_IO_PING_TIMEOUT = 3*ONE_MINUTE;


// const DEFAULT_NODE_TYPES = ["emoji", "hashtag", "media", "place", "url", "user", "word"];
const DEFAULT_NODE_TYPES = ["hashtag", "user"];

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

const AUTH_USER_CACHE_DEFAULT_TTL = ONE_DAY/1000;
const AUTH_USER_CACHE_CHECK_PERIOD = ONE_HOUR/1000; // seconds

const AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL = 300;
const AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD = 5;

const TOPTERMS_CACHE_DEFAULT_TTL = 60;
const TOPTERMS_CACHE_CHECK_PERIOD = 5;

const TRENDING_CACHE_DEFAULT_TTL = 300;
const TRENDING_CACHE_CHECK_PERIOD = 60;

const NODE_CACHE_DEFAULT_TTL = 60;
const NODE_CACHE_CHECK_PERIOD = 1;

const chalk = require("chalk");
const chalkUser = chalk.blue;
const chalkNetwork = chalk.black;
const chalkTwitter = chalk.blue;
const chalkConnect = chalk.black;
const chalkSession = chalk.black;
const chalkDisconnect = chalk.black;
const chalkSocket = chalk.black;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkWarn = chalk.bold.yellow;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkBlue = chalk.blue;

const util = require("util");
const _ = require("lodash");
const merge = require("deepmerge");
const Measured = require("measured");
const omit = require("object.omit");
const pick = require("object.pick");
const config = require("./config/config");
const os = require("os");
const fs = require("fs");
const retry = require("retry");
const path = require("path");
const async = require("async");
const yaml = require("yamljs");
const debug = require("debug")("wa");
const debugCache = require("debug")("cache");
const debugCategory = require("debug")("kw");
const moment = require("moment");
// const treeify = require("treeify");
const treeify = require(__dirname + "/js/libs/treeify");

const express = require("express");
const app = express();
app.set("trust proxy", 1); // trust first proxy

const expressSession = require("express-session");
const MongoStore = require("connect-mongo")(expressSession);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;

app.use(require("serve-static")(__dirname + "/public"));
app.use(require("body-parser").urlencoded({ extended: true }));

const altthreecee00config = {
  consumer_key: "0g1pAgIqe6f3LN9yjaPBGJcSL",
  consumer_secret: "op5mSFdo1jenyiTxFyED0yD2W1rmviq35qpVlgSSyIIlFPuBj7",
  access_token: "848591649575927810-WDKNQnWvisJD9uJIP5eHxAVHsnFq5jE",
  access_token_secret: "O2ZFttRte6RXs1XjZ5wcDgbXDoWZTr2wt245vRqvL0X8G"
};

const EventEmitter2 = require("eventemitter2").EventEmitter2;
require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;

const Monitoring = require("@google-cloud/monitoring");

let googleMonitoringClient;

const HashMap = require("hashmap").HashMap;
const ignoreIpSet = new Set();

const NodeCache = require("node-cache");
const commandLineArgs = require("command-line-args");

let metricsRate = "5MinuteRate";

const shell = require("shelljs");
const JSONParse = require("json-parse-safe");

const methodOverride = require("method-override");
const deepcopy = require("deep-copy");
const sizeof = require("object-sizeof");
const writeJsonFile = require("write-json-file");

const MongoDBStore = require("express-session-mongo");

const slackOAuthAccessToken = "xoxp-3708084981-3708084993-206468961315-ec62db5792cd55071a51c544acf0da55";
const slackChannel = "#was";
const slackChannelAutoFollow = "#wasAuto";
const slackErrorChannel = "#wasError";
const Slack = require("slack-node");
let slack = false;


let configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function configEventsNewListener(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});


let statsObj = {};
statsObj.commandLineArgsLoaded = false;
statsObj.currentThreeceeUserIndex = 0;
statsObj.currentThreeceeUser = "altthreecee00";
statsObj.threeceeUsersConfiguredFlag = false;
statsObj.twitNotReadyWarning = false;

let previousConfiguration = {};
let configuration = {};
let defaultConfiguration = {}; // general configuration
let hostConfiguration = {}; // host-specific configuration

configuration.verbose = false;
configuration.maxQueue = DEFAULT_MAX_QUEUE;
configuration.forceFollow = DEFAULT_FORCE_FOLLOW;

configuration.twitterThreeceeAutoFollowUser = DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER;

configuration.dropboxListFolderLimit = DEFAULT_DROPBOX_LIST_FOLDER_LIMIT;
configuration.dropboxWebhookChangeTimeout = DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT;

configuration.tweetParserInterval = DEFAULT_TWEET_PARSER_INTERVAL;
configuration.sorterMessageRxQueueInterval = DEFAULT_SORTER_INTERVAL;
configuration.rateQueueInterval = DEFAULT_RATE_QUEUE_INTERVAL;
configuration.rateQueueIntervalModulo = DEFAULT_RATE_QUEUE_INTERVAL_MODULO;
configuration.statsUpdateInterval = DEFAULT_STATS_UPDATE_INTERVAL;
configuration.checkTwitterRateLimitInterval = DEFAULT_CHECK_TWITTER_RATE_LIMIT_INTERVAL;

configuration.DROPBOX = {};
configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY ;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
configuration.DROPBOX.DROPBOX_WA_CONFIG_FILE = process.env.DROPBOX_CONFIG_FILE || "wordAssoServerConfig.json";
configuration.DROPBOX.DROPBOX_WA_STATS_FILE = process.env.DROPBOX_STATS_FILE || "wordAssoServerStats.json";

configuration.categoryHashmapsUpdateInterval = DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL;
configuration.testInternetConnectionUrl = DEFAULT_TEST_INTERNET_CONNECTION_URL;
configuration.offlineMode = DEFAULT_OFFLINE_MODE;
configuration.autoOfflineMode = DEFAULT_AUTO_OFFLINE_MODE;

configuration.batchSize = DEFAULT_CURSOR_BATCH_SIZE;

configuration.keySortInterval = DEFAULT_INTERVAL;

configuration.enableTransmitUser = true;
configuration.enableTransmitWord = false;
configuration.enableTransmitPlace = false;
configuration.enableTransmitHashtag = true;
configuration.enableTransmitEmoji = false;
configuration.enableTransmitUrl = false;
configuration.enableTransmitMedia = false;

configuration.saveFileQueueInterval = DEFAULT_SAVE_FILE_QUEUE_INTERVAL;
configuration.socketAuthTimeout = DEFAULT_SOCKET_AUTH_TIMEOUT;
configuration.quitOnError = DEFAULT_QUIT_ON_ERROR;
configuration.maxTopTerms = DEFAULT_MAX_TOP_TERMS;
configuration.metrics = {};
configuration.metrics.nodeMeterEnabled = DEFAULT_METRICS_NODE_METER_ENABLED;
configuration.minFollowersAuto = DEFAULT_MIN_FOLLOWERS_AUTO;

configuration.threeceeUsers = [];
configuration.threeceeUsers = DEFAULT_THREECEE_USERS;
statsObj.currentThreeceeUser = configuration.threeceeUsers[0];


const Twit = require("twit");

let threeceeTwitter = {};
threeceeTwitter.config = {};

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

let prevHostConfigFileModifiedMoment = moment("2010-01-01");
let prevDefaultConfigFileModifiedMoment = moment("2010-01-01");
let prevConfigFileModifiedMoment = moment("2010-01-01");

previousConfiguration = deepcopy(configuration);

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
  else if (moment(new Date(inputTime)).isValid()) {
    currentTimeStamp = moment(new Date(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else if (moment(parseInt(inputTime)).isValid()) {
    currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
    return currentTimeStamp;
  }
  else {
    console.log(chalkAlert("*** getTimeStamp INVALID DATE: " + inputTime));
    return null;
  }
}


function quit(message) {

  console.log(chalkAlert("\n... QUITTING ... " + getTimeStamp()));
  console.error(chalkAlert("\n... QUITTING ... " + getTimeStamp()));

  let msg = "";
  if (message) {msg = message;}

  console.log(chalkAlert("\n... QUITTING ..."));
  console.log(chalkAlert("QUIT MESSAGE: " + msg));
  console.error(chalkAlert("QUIT MESSAGE: " + msg));

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

process.title = "node_wordAssoServer";
console.log("\n\n============== START ==============\n\n");

console.log(chalkAlert("PROCESS PID:   " + process.pid));
console.log(chalkAlert("PROCESS TITLE: " + process.title));
console.log(chalkAlert("ENVIRONMENT: " + process.env.NODE_ENV));

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================


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
// let viewerHashMap = new HashMap();

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

let twitterSearchNodeQueue = [];
let twitterSearchNodeQueueInterval;
let twitterSearchNodeQueueReady = false;

let tssPingInterval;
let tssPingSent = false;
let tssPongReceived = false;
let tssPingId = false;

let tweetParserPingInterval;
let tweetParserPingSent = false;
let tweetParserPongReceived = false;
let tweetParserPingId = false;

let sorterPingInterval;
let sorterPingSent = false;
let sorterPongReceived = false;
let sorterPingId = false;

let categoryHashmapsInterval;
let statsInterval;

// ==================================================================
// DROPBOX
// ==================================================================
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

let dropboxConfigSearchTermsFolder = "/config/searchTerms";

let dropboxConfigTwitterFolder = "/config/twitter";

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

configuration.dropboxChangeFolderArray = [ 
  bestNetworkFolder, 
  dropboxConfigDefaultFolder, 
  dropboxConfigHostFolder, 
  dropboxConfigTwitterFolder
];

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
  filesUpload: function(){ console.log(chalkInfo("filesUpload")); },
  filesDownload: function(){ console.log(chalkInfo("filesDownload")); },
  filesGetMetadata: filesGetMetadataLocal,
  filesDelete: function(){ console.log(chalkInfo("filesDelete")); }
};

let dropboxClient = dropboxRemoteClient;

const configFolder = "/config/utility/" + hostname;
const deletedMetricsFile = "deletedMetrics.json";

const networkDefaults = function (networkObj){

  if (networkObj.betterChild === undefined) { networkObj.betterChild = false; }
  if (networkObj.testCycles === undefined) { networkObj.testCycles = 0; }
  if (networkObj.testCycleHistory === undefined) { networkObj.testCycleHistory = []; }
  if (networkObj.overallMatchRate === undefined) { networkObj.overallMatchRate = 0; }
  if (networkObj.matchRate === undefined) { networkObj.matchRate = 0; }
  if (networkObj.successRate === undefined) { networkObj.successRate = 0; }

  return networkObj;
};

function printNetworkObj(title, networkObj) {

  networkObj = networkDefaults(networkObj);

  console.log(chalkNetwork(title
    + " | OAMR: " + networkObj.overallMatchRate.toFixed(2) + "%"
    + " | MR: " + networkObj.matchRate.toFixed(2) + "%"
    + " | SR: " + networkObj.successRate.toFixed(2) + "%"
    + " | CR: " + getTimeStamp(networkObj.createdAt)
    + " | TC:  " + networkObj.testCycles
    + " | TCH: " + networkObj.testCycleHistory.length
    + " | INPUTS: " + networkObj.numInputs
    + " | IN ID:  " + networkObj.inputsId
    + " | " + networkObj.networkId
  ));
}

const userDefaults = function (user){
  return user;
};

function printUserObj(title, user) {

  user = userDefaults(user);

  console.log(chalkUser(title
    + " | UID: " + user.userId
    + " | @" + user.screenName
    + " | N: " + user.name 
    + " | FLWRs: " + user.followersCount
    + " | FRNDs: " + user.friendsCount
    + " | Ts: " + user.statusesCount
    + " | Ms:  " + user.mentions
    + " | LS: " + getTimeStamp(user.lastSeen)
    + " | FLWg: " + user.following 
    + " | 3C: @" + user.threeceeFollowing 
    + " | CAT MAN: " + user.category
    + " | CAT AUTO: " + user.categoryAuto
  ));
}

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

let uncategorizedManualUserSet = new Set();
let uncategorizedAutoUserSet = new Set();

let uncategorizedManualUserArray = [];
let uncategorizedAutoUserArray = [];

let mismatchUserSet = new Set();
let mismatchUserArray = [];


const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
// const wordAssoDb = require("../../mongooseTwitter");

const dbAppName = "WA_" + process.pid;


function connectDb(callback){

  wordAssoDb.connect(dbAppName, function(err, db) {

    if (err) {
      console.log(chalkError("*** WA | MONGO DB CONNECTION ERROR"
        + " | DB APP NAME: " + dbAppName
        + " | ERROR: " + err
      ));
      configEvents.emit("DB_ERROR", err);
      return callback(false);
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

    console.log(chalkInfo("WA | DB READY STATE: " + db.readyState));

    console.log(chalk.bold.green("WA | MONGOOSE DEFAULT CONNECTION OPEN"));


    global.dbConnection = db;

    app.use(expressSession({ 
      secret: "three cee labs 47", 
      resave: false, 
      saveUninitialized: false,
      store: new MongoStore({ mongooseConnection: db })
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new TwitterStrategy({
        consumerKey: altthreecee00config.consumer_key,
        consumerSecret: altthreecee00config.consumer_secret,
        callbackURL: TWITTER_AUTH_CALLBACK_URL
      },
      function(token, tokenSecret, profile, cb) {

        console.log(chalkAlert("PASSPORT TWITTER AUTH: token:       " + token));
        console.log(chalkAlert("PASSPORT TWITTER AUTH: tokenSecret: " + tokenSecret));
        console.log(chalkAlert("PASSPORT TWITTER AUTH USER | @" + profile.username + " | " + profile.id));
        if (configuration.verbose) { console.log(chalkAlert("PASSPORT TWITTER AUTH\nprofile\n" + jsonPrint(profile))); }

        const rawUser = profile["_json"];

        userServerController.convertRawUser({user:rawUser}, function(err, user){

          if (err) {
            console.log(chalkError("*** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
            return cb("RAW USER", rawUser);
          }

          printUserObj("MONGO DB | TWITTER AUTH USER", user);

          userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

            if (err) {
              console.log(chalkError("findOneUser ERROR: " + err));
              return cb(err);
            }

            console.log(chalk.blue("UPDATED updatedUser"
              + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
              + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
              + "\n" + printUser({user:updatedUser})
            ));

            adminNameSpace.emit("USER_AUTHENTICATED", updatedUser);
            viewNameSpace.emit("USER_AUTHENTICATED", updatedUser);

            cb(null, updatedUser);

          });
        });

      }
    ));

    app.get("/auth/twitter", passport.authenticate("twitter"));

    app.get("/auth/twitter/callback", 
      passport.authenticate("twitter", 
        { 
          // successReturnToOrRedirect: "/session",
          successReturnToOrRedirect: "/after-auth.html",
          failureRedirect: "/login" 
        }
      )
    );

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
            return done(null, false, { message: "Incorrect username." });
          }
          if ((user.screenName !== "threecee") || (password !== "what")) {
            console.log(chalkAlert("*** LOGIN FAILED | INVALID PASSWORD *** | " + username));
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        });
      }
    ));

    passport.serializeUser(function(user, done) { 

      let sessionUser = { 
        "_id": user["_id"], 
        nodeId: user.nodeId, 
        screenName: user.screenName, 
        name: user.name
      };

      console.log(chalkAlert("PASSPORT SERIALIZE USER | @" + user.screenName));

      done(null, sessionUser); 
    });

    passport.deserializeUser(function(sessionUser, done) {

      done(null, sessionUser);

      // User.findOne({nodeId: nodeId}, function(err, user) {
      //   if (err) {
      //     console.log(chalkError("*** ERROR PASSPORT DESERIALIZE USER: " + err));
      //     return done(err, null);
      //   }
      //   if (!user) {
      //     console.log(chalkAlert("!!! PASSPORT DESERIALIZE USER NOT FOUND | NODE ID: " + nodeId));
      //     return done(null, null);
      //   }

      //   console.log(chalkAlert("PASSPORT DESERIALIZE USER FOUND | @" + user.screenName));

      //   done(err, user);
      // });

    });

    dbConnectionReady = true;
    statsObj.dbConnectionReady = true;

    statsObj.user = {};
    statsObj.user.total = 0;
    statsObj.user.following = 0;
    statsObj.user.notFollowing = 0;
    statsObj.user.categorizedTotal = 0;
    statsObj.user.categorizedManual = 0;
    statsObj.user.categorizedAuto = 0;
    statsObj.user.uncategorizedTotal = 0;
    statsObj.user.uncategorizedManual = 0;
    statsObj.user.uncategorizedAuto = 0;
    statsObj.user.mismatched = 0;
    statsObj.user.uncategorizedManualUserArray = 0;

    updateUserSets();
    initUpdateUserSetsInterval(ONE_MINUTE);

    const neuralNetworkCollection = db.collection("neuralnetworks");

    neuralNetworkCollection.countDocuments(function(err, count){
      if (err) { throw Error; }
      console.log(chalkInfo("NEURAL NETWORKS IN DB: " + count));
    });

    const filterNetwork = {
      "$match": {
        "$or": [{ operationType: "insert" },{ operationType: "delete" },{ operationType: "update" },{ operationType: "replace" }]
      }
    };
    const optionsNetwork = { fullDocument: "updateLookup" };

    const neuralNetworkChangeStream = neuralNetworkCollection.watch([filterNetwork], optionsNetwork);

    neuralNetworkChangeStream.on("change", function(change){
      if (change && change.fullDocument) { 
        const nn = networkDefaults(change.fullDocument); 
        printNetworkObj("--> NN   CHANGE | " +  change.operationType, nn);
      }
      else {
        console.log(chalkAlert("--> NN   CHANGE | " +  change.operationType));
      }
    });

    callback(true);
    configEvents.emit("DB_CONNECT");
  });
}

let dbConnectInterval;
statsObj.dbConnectBusy = false;

dbConnectInterval = setInterval(function(){

  if (!statsObj.dbConnectionReady && !statsObj.dbConnectBusy) {

    statsObj.dbConnectBusy = true;

    connectDb(function(connected){
      statsObj.dbConnectBusy = false;
      statsObj.dbConnectionReady = connected;
    });

  }

}, 10*ONE_SECOND);


let HashtagServerController;
let UserServerController;

let hashtagServerController;
let userServerController;

let hashtagServerControllerReady = true;
let userServerControllerReady = true;

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

let previousSlackMessage = "";

function slackPostMessage(channel, text, callback){

  if (text === previousSlackMessage) {
    console.log(chalkInfo("XXX DUPLICATE SLACK MESSAGE \nTEXT: " + text));
    if (callback !== undefined) { callback(null, null); }
    return;
  }

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

const serverCache = new NodeCache({
  stdTTL: serverCacheTtl,
  checkperiod: serverCacheCheckPeriod
});

function serverCacheExpired(serverCacheId, serverObj) {

  const ttl = serverCache.getTtl(serverCacheId);

  console.log(chalkInfo("XXX SERVER CACHE EXPIRED"
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

        const authSocketObjCache = authenticatedSocketCache.get(socketId);

        if (authSocketObjCache) {

          console.log(chalkInfo("AUTH SOCKET CACHE ENTRIES"
            + " | NSP: " + authSocketObjCache.namespace.toUpperCase()
            + " | " + socketId
            + " | USER ID: " + authSocketObjCache.userId
            + " | NOW: " + getTimeStamp()
            + " | TS: " + getTimeStamp(authSocketObjCache.timeStamp)
            + " | AGO: " + msToTime(moment().valueOf() - authSocketObjCache.timeStamp)
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
if (authInProgressTwitterUserCacheTtl === undefined) { authInProgressTwitterUserCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;}
console.log("AUTH IN PROGRESS CACHE TTL: " + authInProgressTwitterUserCacheTtl + " SECONDS");

let authInProgressTwitterUserCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (authInProgressTwitterUserCacheCheckPeriod === undefined) { authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;}
console.log("AUTH IN PROGRESS CACHE CHECK PERIOD: " + authInProgressTwitterUserCacheCheckPeriod + " SECONDS");

const authInProgressTwitterUserCache = new NodeCache({
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


const nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: nodeCacheCheckPeriod
});

let nodeCacheDeleteQueue = [];

function nodeCacheExpired(nodeObj, callback) {

  const nodeCacheId = nodeObj.nodeId;

  debugCache(chalkLog("XXX $ NODE"
    + " | " + nodeObj.nodeType
    + " | " + nodeCacheId
  ));

  if (nodeMeter[nodeCacheId] || (nodeMeter[nodeCacheId] !== undefined)) {

    nodeMeter[nodeCacheId].end();
    nodeMeter[nodeCacheId] = null;

    nodeMeter = omit(nodeMeter, nodeCacheId);
    delete nodeMeter[nodeCacheId];

    if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
      statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
      statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
      console.log(chalkLog("NEW MAX NODE METER ENTRIES"
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

  }

  callback();
}

nodeCache.on("expired", function(nodeCacheId, nodeObj){
  nodeCacheDeleteQueue.push(nodeObj);
});

let nodeCacheDeleteReady = true;

setInterval(function(){

  if (nodeCacheDeleteReady && (nodeCacheDeleteQueue.length > 0)) {

    nodeCacheDeleteReady = false;

    const nodeObj = nodeCacheDeleteQueue.shift();
    
    nodeCacheExpired(nodeObj, function(){
      nodeCacheDeleteReady = true;
    });
  }

}, 1);


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

let tssChild;
let sorterChild;
let parserChild;

function initStats(callback){
  console.log(chalk.bold.black("INIT STATS"));
  // statsObj = {};

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
  statsObj.twitter.retweetsReceived = 0;
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

  console.log(chalkLog("dropboxFolderGetLastestCursor FOLDER: " + folder));

  dropboxClient.filesListFolderGetLatestCursor(optionsGetLatestCursor)
  .then(function(last_cursor) {

    lastCursorTruncated = last_cursor.cursor.substring(0,20);

    // console.log(chalkLog("lastCursorTruncated: " + lastCursorTruncated));
    if (configuration.verbose) { console.log(chalkLog("DROPBOX LAST CURSOR\n" + jsonPrint(last_cursor))); }

    dropboxLongPoll(last_cursor.cursor, function(err, results){

      if (configuration.verbose) { console.log(chalkLog("DROPBOX LONG POLL RESULTS\n" + jsonPrint(results))); }

      if (results.changes) {

        dropboxClient.filesListFolderContinue({ cursor: last_cursor.cursor})
        .then(function(response){

          if (configuration.verbose) { console.log(chalkLog("DROPBOX FILE LIST FOLDER CONTINUE\n" + jsonPrint(response))); }

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
        console.log(chalkLog("DROPBOX | FOLDER NO CHANGE | " + folder));
        callback(null, null);
      }
    });
  })
  .catch(function(err){
    console.log(chalkError("*** ERROR DROPBOX FOLDER | " + folder + " | " + err));
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

function getFileMetadata(params, callback) {

  const fullPath = params.folder + "/" + params.file;

  debug(chalkInfo("FOLDER " + params.folder));
  debug(chalkInfo("FILE " + params.file));
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
      callback(null, response);
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
      callback(error, null);
    });
}

function getFileMetadataRetry(params, callback) {

  debug(chalkAlert("getFileMetadataRetry | PARAMS\n" + jsonPrint(params)));

  let operation = retry.operation();
 
  operation.attempt(function(currentAttempt) {

    if (currentAttempt > 1) {
      console.log(chalkAlert("getFileMetadataRetry"
        + " | ATTEMPT NUM: " + currentAttempt
        + "\nPARAMS\n" + jsonPrint(params)
      ));
    }

    getFileMetadata(params, function(err, metaData) {

      if (operation.retry(err)) {
        return;
      }
 
      callback(err ? operation.mainError() : null, metaData);

    });

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
          return callback(new Error("WA LOAD FILE PAYLOAD UNDEFINED"), null);
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
      }
      else {
        debug(chalkError("WA | LOAD FILE ERROR: " + err));
      }

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

    getFileMetadataRetry({folder: folder, file: file}, function(err, metaData){

      if (err) {
        return callback(err);
      }

      const fileModifiedMoment = moment(new Date(metaData.client_modified));
    
      if (fileModifiedMoment.isSameOrBefore(prevConfigFileModifiedMoment)){

        debug(chalkInfo("WA | CONFIG FILE BEFORE OR EQUAL"
          + " | " + fullPath
          + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
          + " | " + fileModifiedMoment.format(compactDateTimeFormat)
        ));
        callback(null);
      }
      else {
        console.log(chalkInfo("WA | +++ CONFIG FILE AFTER ... LOADING"
          + " | " + fullPath
          + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
          + " | " + fileModifiedMoment.format(compactDateTimeFormat)
        ));

        previousConfiguration = deepcopy(configuration);
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

            if (loadedConfigObj.VERBOSE  !== undefined){
              console.log("WA | LOADED VERBOSE: " + loadedConfigObj.VERBOSE);

              if ((loadedConfigObj.VERBOSE === false) || (loadedConfigObj.VERBOSE === "false")) {
                configuration.verbose = false;
              }
              else if ((loadedConfigObj.VERBOSE === true) || (loadedConfigObj.VERBOSE === "true")) {
                configuration.verbose = true;
              }
              else {
                configuration.verbose = false;
              }
            }

            if (loadedConfigObj.FORCE_FOLLOW  !== undefined){
              console.log("WA | LOADED FORCE_FOLLOW: " + loadedConfigObj.FORCE_FOLLOW);

              if ((loadedConfigObj.FORCE_FOLLOW === false) || (loadedConfigObj.FORCE_FOLLOW === "false")) {
                configuration.forceFollow = false;
              }
              else if ((loadedConfigObj.FORCE_FOLLOW === true) || (loadedConfigObj.FORCE_FOLLOW === "true")) {
                configuration.forceFollow = true;
              }
              else {
                configuration.forceFollow = false;
              }
            }

            if (loadedConfigObj.WA_TEST_MODE  !== undefined){
              console.log("WA | LOADED WA_TEST_MODE: " + loadedConfigObj.WA_TEST_MODE);
              configuration.testMode = loadedConfigObj.WA_TEST_MODE;
            }

            if (loadedConfigObj.WAS_ENABLE_STDIN !== undefined){
              console.log("WA | LOADED WAS_ENABLE_STDIN: " + loadedConfigObj.WAS_ENABLE_STDIN);
              configuration.enableStdin = loadedConfigObj.WAS_ENABLE_STDIN;
            }

            if (loadedConfigObj.NODE_METER_ENABLED !== undefined){

              console.log("WA | LOADED NODE_METER_ENABLED: " + loadedConfigObj.NODE_METER_ENABLED);

              if (loadedConfigObj.NODE_METER_ENABLED === "true") {
                configuration.metrics.nodeMeterEnabled = true;
              }
              else if (loadedConfigObj.NODE_METER_ENABLED === "false") {
                configuration.metrics.nodeMeterEnabled = false;
              }
              else {
                configuration.metrics.nodeMeterEnabled = true;
              }
            }

            if (loadedConfigObj.PROCESS_NAME !== undefined){
              console.log("WA | LOADED PROCESS_NAME: " + loadedConfigObj.PROCESS_NAME);
              configuration.processName = loadedConfigObj.PROCESS_NAME;
            }

            if (loadedConfigObj.THREECEE_USERS !== undefined){
              console.log("WA | LOADED THREECEE_USERS: " + loadedConfigObj.THREECEE_USERS);
              configuration.threeceeUsers = loadedConfigObj.THREECEE_USERS;
            }

            if (loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW_USER !== undefined){
              console.log("WA | LOADED TWITTER_THREECEE_AUTO_FOLLOW_USER: " + loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW_USER);
              configuration.twitterThreeceeAutoFollowUser = loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW_USER;
            }

            if (loadedConfigObj.CURSOR_BATCH_SIZE !== undefined){
              console.log("WA | LOADED CURSOR_BATCH_SIZE: " + loadedConfigObj.CURSOR_BATCH_SIZE);
              configuration.cursorBatchSize = loadedConfigObj.CURSOR_BATCH_SIZE;
            }

            if (loadedConfigObj.DROPBOX_WEBHOOK_CHANGE_TIMEOUT !== undefined){
              console.log("WA | LOADED DROPBOX_WEBHOOK_CHANGE_TIMEOUT: " + loadedConfigObj.DROPBOX_WEBHOOK_CHANGE_TIMEOUT);
              configuration.dropboxWebhookChangeTimeout = loadedConfigObj.DROPBOX_WEBHOOK_CHANGE_TIMEOUT;
            }

            if (loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT !== undefined){
              console.log("WA | LOADED FIND_CAT_USER_CURSOR_LIMIT: " + loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT);
              configuration.findCatUserLimit = loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT;
            }

            if (loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT !== undefined){
              console.log("WA | LOADED FIND_CAT_HASHTAG_CURSOR_LIMIT: " + loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT);
              configuration.findCatHashtagLimit = loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT;
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

            if (loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL !== undefined){
              console.log("WA | LOADED CATEGORY_HASHMAPS_UPDATE_INTERVAL: " + loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL);
              configuration.categoryHashmapsUpdateInterval = loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL;
            }

            if (loadedConfigObj.STATS_UPDATE_INTERVAL !== undefined){
              console.log("WA | LOADED STATS_UPDATE_INTERVAL: " + loadedConfigObj.STATS_UPDATE_INTERVAL);
              configuration.statsUpdateInterval = loadedConfigObj.STATS_UPDATE_INTERVAL;
            }

            if (loadedConfigObj.RATE_QUEUE_INTERVAL !== undefined){
              console.log("WA | LOADED RATE_QUEUE_INTERVAL: " + loadedConfigObj.RATE_QUEUE_INTERVAL);
              configuration.rateQueueInterval = loadedConfigObj.RATE_QUEUE_INTERVAL;
            }

            if (loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO !== undefined){
              console.log("WA | LOADED RATE_QUEUE_INTERVAL_MODULO: " + loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO);
              configuration.rateQueueIntervalModulo = loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO;
            }

            if (loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW !== undefined){
              console.log("WA | LOADED TWITTER_THREECEE_AUTO_FOLLOW: " + loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW);
              configuration.twitterThreeceeAutoFollowConfigFile = loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW + ".json";
            }

            if (loadedConfigObj.TWEET_PARSER_INTERVAL !== undefined){
              console.log("WA | LOADED TWEET_PARSER_INTERVAL: " + loadedConfigObj.TWEET_PARSER_INTERVAL);
              configuration.tweetParserInterval = loadedConfigObj.TWEET_PARSER_INTERVAL;
            }

            if (loadedConfigObj.UPDATE_TRENDS_INTERVAL !== undefined){
              console.log("WA | LOADED UPDATE_TRENDS_INTERVAL: " + loadedConfigObj.UPDATE_TRENDS_INTERVAL);
              configuration.updateTrendsInterval = loadedConfigObj.UPDATE_TRENDS_INTERVAL;
            }

            if (loadedConfigObj.KEEPALIVE_INTERVAL !== undefined){
              console.log("WA | LOADED KEEPALIVE_INTERVAL: " + loadedConfigObj.KEEPALIVE_INTERVAL);
              configuration.keepaliveInterval = loadedConfigObj.KEEPALIVE_INTERVAL;
            }

            if (loadedConfigObj.CHECK_TWITTER_RATE_LIMIT_INTERVAL !== undefined){
              console.log("WA | LOADED CHECK_TWITTER_RATE_LIMIT_INTERVAL: " + loadedConfigObj.CHECK_TWITTER_RATE_LIMIT_INTERVAL);
              configuration.checkTwitterRateLimitInterval = loadedConfigObj.CHECK_TWITTER_RATE_LIMIT_INTERVAL;
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
      }

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

        const stats = fs.statSync(fullPath);
        const fileSizeInBytes = stats.size;
        const savedSize = fileSizeInBytes/ONE_MEGABYTE;

        console.log(chalkLog("WAS | ... SAVING DROPBOX JSON"
          + " | " + getTimeStamp()
          + " | " + savedSize.toFixed(2) + " MBYTES"
          + "\n SRC: " + fullPath
          + "\n DST: " + options.destination
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
          if (callback !== undefined) { return callback(error); }
        }
        else if (error.status === 429){
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: TOO MANY WRITES"
            // + " ERROR\n" + "jsonPrint"(error.error)
          ));
          if (callback !== undefined) { return callback(error); }
        }
        else if (error.status === 500){
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: DROPBOX SERVER ERROR"
            // + " ERROR\n" + jsonPrint(error.error)
          ));
          if (callback !== undefined) { return callback(error); }
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

      dropboxClient.filesListFolder({path: params.folder, limit: configuration.dropboxListFolderLimit})
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
        callback("ERROR: CHILD NOT IN HM: " + params.childId, null);
      }
      return;
    }
    pid = childrenHashMap[params.childId].pid;
    command = "kill " + pid;
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

    if (stderr) {
      console.log(chalkError("*** SHELL ERROR"
        + " | COMMAND: " + command
        + " | STDERR: " + stderr
      ));
      return cb(stderr);
    }

    if (code === 0) {

      let soArray = stdout.trim();

      let stdoutArray = soArray.split("\n");

      async.eachSeries(stdoutArray, function(pidRaw, cb){

        pid = pidRaw.trim();

        if (parseInt(pid) > 0) {

          command = "ps -o command= -p " + pid;

          shell.exec(command, {silent: true}, function(code, stdout, stderr){

            if (stderr) {
              console.log(chalkError("*** SHELL ERROR"
                + " | COMMAND: " + command
                + " | STDERR: " + stderr
              ));
              return cb(stderr);
            }

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

                if (err) {
                  console.log(chalkError("*** KILL CHILD ERROR"
                    + " | PID: " + pid
                    + " | ERROR: " + err
                  ));
                  return cb(err);
                }

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

        if (err) {
          console.log(chalkError("*** GET CHILD PROCESSES ERROR"
            + " | ERROR: " + err
          ));
        }

        if (callback !== undefined) { callback(err, childPidArray); }

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
          cb(err);
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

  if (childrenHashMap[childObj.childId] !== undefined){
    childrenHashMap[childObj.childId].errors += 1;
    childrenHashMap[childObj.childId].status = "UNKNOWN";
  }


  slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\n" + childObj.childId + "\n" + childObj.err);

  switch(childObj.childId){

    case DEFAULT_TSS_CHILD_ID:

      console.log(chalkError("KILL TSS CHILD"));

      killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, numKilled){
        initTssChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, tss){
          if (!err) { tssChild = tss; }
        });
      });

    break;

    case DEFAULT_TWEET_PARSER_CHILD_ID:

      console.log(chalkError("KILL TWEET PARSER"));

      killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
        initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, twp){
          if (!err) { parserChild = twp; }
        });
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

        adminNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
        utilNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);
        viewNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);

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

  initAppRouting(function initAppRoutingComplete() {
    initLoadBestNetworkInterval(ONE_MINUTE+1);
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

  UserServerController = require("@threeceelabs/user-server-controller");

  hashtagServerController = new HashtagServerController("WA_HSC");
  userServerController = new UserServerController("WA_USC");

  hashtagServerControllerReady = true;
  userServerControllerReady = true;

  hashtagServerController.on("error", function(err){
    hashtagServerControllerReady = false;
    console.log(chalkError("*** HSC ERROR | " + err));
  });

  userServerController.on("error", function(err){
    userServerControllerReady = false;
    console.log(chalkError("*** USC ERROR | " + err));
  });

  initSocketNamespaces();

  initUnfollowableUserSet();
  initFollowableSearchTermSet();

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

          if (updatedUser.category) { uncategorizedManualUserSet.delete(updatedUser.nodeId); }
          if (updatedUser.categoryAuto) { uncategorizedAutoUserSet.delete(updatedUser.nodeId); }

          saveFileQueue.push(
            {
              localFlag: false, 
              folder: categorizedFolder, 
              file: categorizedUsersFile, 
              obj: categorizedUserHashMap.entries()
            });

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

let deltaTweetStart = process.hrtime();
let deltaTweet = process.hrtime(deltaTweetStart);

function socketRxTweet(tw) {

  tweetMeter.mark();

  deltaTweet = process.hrtime(deltaTweetStart);

  if (deltaTweet[0] > 0) { 

    statsObj.twitter.tweetsPerMin = parseInt(tweetMeter.toJSON()[metricsRate]);

    console.log(chalkAlert("*** TWEET RX DELTA: " + deltaTweet[0] + "." + deltaTweet[1]));

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

  deltaTweetStart = process.hrtime();

  statsObj.twitter.tweetsReceived += 1;

  if (tw.retweeted_status) {
    statsObj.twitter.retweetsReceived += 1;
  }

  debug(chalkSocket("tweet" 
    + " [" + statsObj.twitter.tweetsReceived + "]"
    + " | " + tw.id_str
    + " | " + tw.user.id_str
    + " | " + tw.user.screen_name
    + " | " + tw.user.name
  ));

  if (tweetRxQueue.length > configuration.maxQueue){

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

    if (statsObj.twitter.tweetsReceived % 100 === 0) {
      console.log(chalkTwitter("WAS | <T | "+ getTimeStamp()
        + " | RXQ: " + tweetRxQueue.length
        + " [ Ts/RTs: " + statsObj.twitter.tweetsReceived + "/" + statsObj.twitter.retweetsReceived + "]"
        + " | " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }

  }
  else {
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

    console.log(chalkWarn("XXX FOLLOW | @" + params.user.screenName + " | IN UNFOLLOWABLE USER SET"));

    if (callback !== undefined) { 
      return callback("XXX FOLLOW", null);
    }
    else {
      return;
    }
  }

  unfollowableUserSet.add(params.user.nodeId);

  const query = { nodeId: params.user.nodeId };

  let update = {};

  update["$set"] = { 
    following: true, 
    threeceeFollowing: configuration.twitterThreeceeAutoFollowUser
  };

  const options = {
    new: true,
    upsert: false
  };

  User.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("*** UNFOLLOW | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){
      console.log(chalkLog("+++ FOLLOW"
        + " | " + printUser({user: userUpdated})
      ));

      if (statsObj.tssChildReady) {
        tssChild.send({
          op: "FOLLOW", 
          threeceeUser: configuration.twitterThreeceeAutoFollowUser, 
          user: params.user,
          forceFollow: configuration.forceFollow
        });
      }

    }
    else {
      console.log(chalkLog("... ALREADY FOLLOWING"
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
    }

    if (callback !== undefined) { callback(err, userUpdated); }

  });

  // console.log(chalk.blue("+++ FOLLOW | @" + params.user.screenName));

  // if (callback !== undefined) { callback(null, null); }
}

function unfollow(params, callback) {

  console.log(chalk.blue("+++ UNFOLLOW | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    unfollowableUserSet.add(params.user.nodeId);
    uncategorizedManualUserSet.delete(params.user.nodeId);

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: unfollowableUserFile, 
      obj: [...unfollowableUserSet]
    });

  } 

  // adminNameSpace.emit("UNFOLLOW", params.user);
  // utilNameSpace.emit("UNFOLLOW", params.user);

  const query = { nodeId: params.user.nodeId, following: true };

  let update = {};
  update["$set"] = { following: false, threeceeFollowing: false };

  const options = {
    new: true,
    upsert: false
  };

  User.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("*** UNFOLLOW | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){
      console.log(chalkLog("XXX UNFOLLOW"
        + " | " + printUser({user: userUpdated})
      ));
    }
    else {
      console.log(chalkLog("... ALREADY UNFOLLOWED"
        + " | ID: " + params.user.nodeId
      ));
    }

    if (callback !== undefined) { callback(err, userUpdated); }

  });
}


function initFollowableSearchTermSet(){

  console.log(chalkBlue("INIT FOLLOWABLE SEARCH TERM SET"));

  loadFile(dropboxConfigDefaultFolder, followableSearchTermFile, function(err, followableSearchTermSetArray){

    if (err) {
      if (err.status === 409) {
        console.log(chalkError("*** LOAD FOLLOWABLE SEARCH TERM ERROR: FILE NOT FOUND:  " 
          + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
        ));
      }
      else {
        console.log(chalkError("*** LOAD FOLLOWABLE SEARCH TERM ERROR: STATUS: " + err.status));
        console.log(err);
      }

      initFollowableSearchTerms();

    }
    else if (followableSearchTermSetArray) {

      console.log(chalkLog("LOADED FOLLOWABLE SEARCH TERM FILE"
        + " | " + followableSearchTermSetArray.length + " SEARCH TERMS"
        + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
      ));

      async.each(followableSearchTermSetArray, function(searchTerm, cb){

        followableSearchTermSet.add(searchTerm);
        cb();

      }, function(err){

        console.log(chalkLog("FOLLOWABLE SEARCH TERM SET"
          + " | " + followableSearchTermSet.size + " SEARCH TERMS"
          + " | " + followableSearchTermSetArray.length + " SEARCH TERMS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
        ));

        initFollowableSearchTerms();
      });

    }
  });
}

function initDropboxSync(){

  console.log(chalkLog("INIT DROPBOX SYNC"));

}

function initUnfollowableUserSet(){

  console.log(chalkLog("INIT UNFOLLOWABLE USER SET"));

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
    }
    else if (unfollowableUserSetArray) {

      console.log(chalkLog("LOADED UNFOLLOWABLE USERS FILE"
        + " | " + unfollowableUserSetArray.length + " USERS"
        + " | " + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
      ));

      // unfollowableUserSet = new Set(unfollowableUserSetArray);

      let query;
      let update;
      let numUnfollowed = 0;
      let numAlreadyUnfollowed = 0;

      async.eachSeries(unfollowableUserSetArray, function(userId, cb){

        unfollowableUserSet.add(userId);

        query = { nodeId: userId, following: true };

        update = {};
        update["$set"] = { following: false, threeceeFollowing: false };

        const options = {
          new: true,
          upsert: false
        };

        User.findOneAndUpdate(query, update, options, function(err, userUpdated){

          if (err) {
            console.log(chalkError("*** initUnfollowableUserSet | USER FIND ONE ERROR: " + err));
            return cb(err, userId);
          }
          
          if (userUpdated){

            numUnfollowed += 1;
            console.log(chalkLog("XXX UNFOLLOW"
              + " [" + numUnfollowed + "/" + numAlreadyUnfollowed + "/" + unfollowableUserSetArray.length + "]"
              + " | " + printUser({user: userUpdated})
            ));

            cb(null, userUpdated);
          }
          else {
            numAlreadyUnfollowed += 1;
            if (configuration.verbose){
              console.log(chalkLog("... ALREADY UNFOLLOWED"
                + " [" + numUnfollowed + "/" + numAlreadyUnfollowed + "/" + unfollowableUserSetArray.length + "]"
                + " | ID: " + userId
              ));
            }
            cb(null, null);
          }
        });

      }, function(err){
        // console.log(chalk.bold.black("INIT UNFOLLOWABLE USERS | " + unfollowableUserSet.size + " USERS"));
        console.log(chalkBlue("INIT UNFOLLOWABLE USERS"
          + " | " + numUnfollowed + " NEW UNFOLLOWED"
          + " | " + numAlreadyUnfollowed + " ALREADY UNFOLLOWED"
          + " | " + unfollowableUserSet.size + " USERS IN SET"
          + " | " + unfollowableUserSetArray.length + " USERS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
        ));
      });
    }
  });
}


const serverRegex = /^(.+)_/i;
let socketConnectText = "";


function initSocketHandler(socketObj) {

  const socket = socketObj.socket;
  const socketId = socket.id;

  let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  socketConnectText = "\nSOCKET CONNECT"
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

    const timeStamp = moment().valueOf();

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.reconnect_errors += 1;
    debug(chalkError(getTimeStamp(timeStamp) 
      + " | SOCKET RECONNECT ERROR: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("reconnect_failed", function reconnectFailed(errorObj) {

    const timeStamp = moment().valueOf();

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.reconnect_fails += 1;
    console.log(chalkError(getTimeStamp(timeStamp) 
      + " | SOCKET RECONNECT FAILED: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_error", function connectError(errorObj) {

    const timeStamp = moment().valueOf();

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.connect_errors += 1;
    console.log(chalkError(getTimeStamp(timeStamp) 
      + " | SOCKET CONNECT ERROR: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("connect_timeout", function connectTimeout(errorObj) {

    const timeStamp = moment().valueOf();

    serverCache.del(socketId);
    viewerCache.del(socketId);

    statsObj.socket.errors.connect_timeouts += 1;
    console.log(chalkError(getTimeStamp(timeStamp) 
      + " | SOCKET CONNECT TIMEOUT: " + socketId + "\nerrorObj\n" + jsonPrint(errorObj)));
  });

  socket.on("error", function socketError(error) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    statsObj.socket.errors.errors += 1;

    console.log(chalkError(getTimeStamp(timeStamp) 
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

      serverCache.del(socketId);

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

      viewerCache.del(socketId);

      adminNameSpace.emit("VIEWER_ERROR", currentViewer);
    }
  });

  socket.on("reconnect", function socketReconnect() {

    const timeStamp = moment().valueOf();

    statsObj.socket.reconnects += 1;
    console.log(chalkConnect(getTimeStamp(timeStamp) + " | SOCKET RECONNECT: " + socket.id));
  });

  socket.on("disconnect", function socketDisconnect(reason) {

    const timeStamp = moment().valueOf();

    statsObj.socket.disconnects += 1;

    console.log(chalkAlert("XXX SOCKET DISCONNECT"
      + " | " + socketId
      + " | REASON: " + reason
    ));

    if (adminHashMap.has(socketId)) { 
      console.log(chalkAlert("XXX DELETED ADMIN" 
        + " | " + getTimeStamp(timeStamp)
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
        + " | " + getTimeStamp(timeStamp)
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

    const timeStamp = moment().valueOf();

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
        serverCache.del(socket.id);
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
          + " | " + getTimeStamp(timeStamp)
          + " | " + keepAliveObj.user.userId
          + " | " + ipAddress
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
          sessionObj.stats = keepAliveObj.stats;
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          console.log(chalk.green("+++ ADD " + currentSessionType 
            + " | " + getTimeStamp(timeStamp)
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
          sessionObj.stats = keepAliveObj.stats;

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
      case "TMP" :

        // console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);

        deltaNS = diff[0] * NS_PER_SEC + diff[1];

        diff = process.hrtime(time);

        console.log(chalkLog("R< KA"
          // + " | DELTA: " + deltaNS + " NS"
          + " | " + currentSessionType + " SERVER" 
          + " | " + getTimeStamp(timeStamp)
          + " | " + keepAliveObj.user.userId
          + " | " + ipAddress
          + " | " + socket.id
        ));

        time = process.hrtime();

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
          sessionObj.stats = keepAliveObj.stats;
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          console.log(chalk.green("+++ ADD " + currentSessionType + " SERVER" 
            + " | " + getTimeStamp(timeStamp)
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
          sessionObj.stats = keepAliveObj.stats;

          serverCache.set(socket.id, sessionObj);
          adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
          socket.emit("GET_STATS");
        }

      break;

      case "VIEWER" :

        console.log(chalkLog("R< KA"
          + " | " + "VIEWER"
          + " | " + getTimeStamp(timeStamp)
          + " | " + keepAliveObj.user.userId
          + " | " + ipAddress
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
          sessionObj.stats = keepAliveObj.stats;
          sessionObj.status = keepAliveObj.status || "KEEPALIVE";

          console.log(chalk.green("+++ ADD " + currentSessionType + " SESSION" 
            + " | " + getTimeStamp(timeStamp)
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
          sessionObj.stats = keepAliveObj.stats;

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

  socket.on("TWITTER_FOLLOW", function twitterFollow(user) {

    if (!user || (user === undefined)) {
      console.log(chalkError("TWITTER_FOLLOW ERROR: NULL USER"));
      return;
    }

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    console.log(chalkSocket("R< TWITTER_FOLLOW"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
      + " | NID: " + user.nodeId
      + " | UID: " + user.userId
      + " | @" + user.screenName
    ));

    follow({user: user}, function(err, updatedUser){
      if (err) {
        console.log(chalkError("TWITTER_FOLLOW ERROR: " + err));
        return;
      }

      if (!updatedUser) {
        console.log(chalkError("TWITTER_FOLLOW ERROR: NULL UPDATED USER"));
        return;
      }

      // adminNameSpace.emit("FOLLOW", updatedUser);
      // utilNameSpace.emit("FOLLOW", updatedUser);

      console.log(chalk.blue("+++ TWITTER_FOLLOW"
        + " | " + ipAddress
        + " | " + socket.id
        + " | UID" + updatedUser.nodeId
        + " | @" + updatedUser.screenName
      ));

    });
  });

  socket.on("TWITTER_UNFOLLOW", function twitterUnfollow(user) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    console.log(chalkSocket("R< TWITTER_UNFOLLOW"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
      + " | UID: " + user.userId
      + " | @" + user.screenName
    ));

    unfollow({user: user, socketId: socket.id}, function(err, updatedUser){
      if (err) {
        console.log(chalkError("TWITTER_UNFOLLOW ERROR: " + err));
        return;
      }
      
      if (!updatedUser) { return; }

      adminNameSpace.emit("UNFOLLOW", updatedUser);
      utilNameSpace.emit("UNFOLLOW", updatedUser);

      console.log(chalk.blue("XXX TWITTER_UNFOLLOW"
        + " | SID: " + socket.id
        + " | UID" + updatedUser.nodeId
        + " | @" + updatedUser.screenName
      ));

    });
  });

  socket.on("TWITTER_SEARCH_NODE", function (sn) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    twitterSearchNodeQueue.push({searchNode: sn, socket: socket});

    console.log(chalkSocket("R< TWITTER_SEARCH_NODE"
      + " [ TSNQ: " + twitterSearchNodeQueue.length + "]"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
      + " | " + sn
    ));
  });

  socket.on("TWITTER_CATEGORIZE_NODE", function twitterCategorizeNode(dataObj) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    if (dataObj.node.nodeType === "user") {
      console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
        + " | " + getTimeStamp(timeStamp)
        + " | " + ipAddress
        + " | " + socket.id
        + " | @" + dataObj.node.screenName
        + " | CAT: " + dataObj.category
      ));
    }
    if (dataObj.node.nodeType === "hashtag") {
      console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
        + " | " + getTimeStamp(timeStamp)
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
            + " | " + getTimeStamp(timeStamp)
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
            + " | " + getTimeStamp(timeStamp)
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

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    console.log(chalkSocket("R< USER READY"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
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

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    console.log(chalkSocket("VIEWER READY"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
      + " | " + viewerObj.viewerId
      + " | SENT AT " + getTimeStamp(parseInt(viewerObj.timeStamp))
    ));


    userServerController.findOne({user: defaultTwitterUser}, function(err, user){

      if (err) {
        console.log(chalkError("*** ERROR | VIEWER READY FIND USER"
          + " | " + getTimeStamp(timeStamp)
          + " | " + ipAddress
          + " | " + socket.id
          + " | " + viewerObj.viewerId
          + " | ERROR: " + err
        ));
      }
      else {

        if (user) {
          socket.emit("SET_TWITTER_USER", user);
        }

        socket.emit("VIEWER_READY_ACK", 
          {
            nodeId: viewerObj.viewerId,
            timeStamp: moment().valueOf(),
            viewerSessionKey: moment().valueOf()
          }
        );
      }
  
    });
  });

  socket.on("categorize", categorizeNode);

  socket.on("login", function socketLogin(viewerObj){

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    viewerObj.timeStamp = moment().valueOf();

    console.log(chalkAlert("LOGIN"
      + " | " + ipAddress
      + " | " + socket.id
      + "\n" + jsonPrint(viewerObj)
    ));

    authInProgressTwitterUserCache.set(viewerObj.nodeId, viewerObj);
  });

  socket.on("STATS", function socketStats(statsObj){

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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

function initSocketNamespaces(){

  const timeStamp = moment().valueOf();

  console.log(chalkInfo(getTimeStamp(timeStamp) + " | INIT SOCKET NAMESPACES"));

  adminNameSpace = io.of("/admin");
  utilNameSpace = io.of("/util");
  userNameSpace = io.of("/user");
  viewNameSpace = io.of("/view");

  adminNameSpace.on("connect", function adminConnect(socket) {

    console.log(chalk.blue("ADMIN CONNECT " + socket.id));

    authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
      if (authenticatedSocketObj){
        console.log(chalkAlert("ADMIN ALREADY AUTHENTICATED"
          + " | " + socket.id
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }
      else {
        socket.on("authentication", function(data) {

          if (configuration.verbose) {
            console.log("RX SOCKET AUTHENTICATION"
              + " | " + socket.nsp.name.toUpperCase()
              + " | " + socket.id
              + " | USER ID: " + data.userId
            );
          }

          data.timeStamp = moment().valueOf();

          authenticatedSocketCache.set(socket.id, data);

          statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;

          initSocketHandler({namespace: "admin", socket: socket});

          socket.emit("authenticated", true);

        });
      }
    });

    // statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
    // initSocketHandler({namespace: "admin", socket: socket});
  });

  utilNameSpace.on("connect", function utilConnect(socket) {

    console.log(chalk.blue("UTIL CONNECT " + socket.id));

    authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
      if (authenticatedSocketObj){
        console.log(chalkAlert("UTIL ALREADY AUTHENTICATED"
          + " | " + socket.id
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }
      else {
        socket.on("authentication", function(data) {

          if (configuration.verbose) {
            console.log("RX SOCKET AUTHENTICATION"
              + " | " + socket.nsp.name.toUpperCase()
              + " | " + socket.id
              + " | USER ID: " + data.userId
            );
          }

          data.timeStamp = moment().valueOf();

          authenticatedSocketCache.set(socket.id, data);

          statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;

          initSocketHandler({namespace: "util", socket: socket});

          socket.emit("authenticated", true);

        });
      }
    });
  });

  userNameSpace.on("connect", function userConnect(socket) {
    console.log(chalk.blue("USER CONNECT " + socket.id));

    authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
        console.log(chalkAlert("USER ALREADY AUTHENTICATED"
          + " | " + socket.id
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
    });

    initSocketHandler({namespace: "user", socket: socket});
  });

  viewNameSpace.on("connect", function viewConnect(socket) {

    console.log(chalk.blue("VIEWER CONNECT " + socket.id));

    authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
      if (authenticatedSocketObj){
        console.log(chalkAlert("VIEWER ALREADY AUTHENTICATED"
          + " | " + socket.id
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }
      else {
        socket.on("authentication", function(data) {

          console.log("RX SOCKET AUTHENTICATION"
            + " | " + socket.nsp.name.toUpperCase()
            + " | " + socket.id
            + " | USER ID: " + data.userId
          );

          data.timeStamp = moment().valueOf();

          authenticatedSocketCache.set(socket.id, data);

          statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; // viewNameSpace.sockets.length ;

          initSocketHandler({namespace: "view", socket: socket});

          socket.emit("authenticated", true);

        });
      }
    });
  });

  statsObj.ioReady = true;
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
        nodesPerMinuteTopTermCache.get(nodeObj.nodeId, function topTermNodeId(err, nodeRate) {
          if (err){
            console.log(chalkError("nodesPerMinuteTopTermCache GET ERR: " + err));
          }
          if (nodeRate !== undefined) {

            debugCategory(chalkLog("TOP TERM"
              + " | " + nodeObj.nodeId 
              + " | " + nodeRate.toFixed(3)
            ));

            nodeObj.isTopTerm = true;
          }
          else {
            nodeObj.isTopTerm = false;
          }
        });
        cb();
      },
      nodeType: function(cb){
        nodesPerMinuteTopTermNodeTypeCache[nodeObj.nodeType].get(nodeObj.nodeId, function topTermNodeId(err, nodeRate) {
          if (err){
            console.log(chalkError("nodesPerMinuteTopTermNodeTypeCache" + nodeObj.nodeType + " GET ERR: " + err));
          }
          if (nodeRate !== undefined) {

            debugCategory(chalkLog("TOP TERM NODE TYPE"
              + " | " + nodeObj.nodeType 
              + " | " + nodeObj.nodeId 
              + " | " + nodeRate.toFixed(3)
            ));
            
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
    case "word":
      callback(null, nodeObj);
    break;

    case "hashtag":
    case "user":
      processCheckCategory(nodeObj, function(err, updatedNodeObj){
        if (err) { return callback(err, null); }
        callback(null, updatedNodeObj);
      });
    break;

    default:
      console.log(chalk.blue("DEFAULT | checkCategory\n" + jsonPrint(nodeObj)));
      callback(null, nodeObj);
  }
}

function updateTrends(currentThreeceeUser){

  if ( !currentThreeceeUser
    || (threeceeTwitter[currentThreeceeUser] === undefined)
    || threeceeTwitter[currentThreeceeUser].ready)
  {
    
    if (!statsObj.twitNotReadyWarning) {

      console.log(chalkError("*** updateTrends | TWIT NOT READY"
        + " | CURRENT 3C USER: @" + currentThreeceeUser
      ));

      statsObj.twitNotReadyWarning = true;
    }

    return;
  }

  statsObj.twitNotReadyWarning = false;

  console.log(chalkLog("UPDATE TWITTER TRENDS"
    + " | CURRENT 3C USER: @" + currentThreeceeUser
  ));

  threeceeTwitter[currentThreeceeUser].twit.get("trends/place", {id: 1}, function updateTrendsWorldWide (err, data, response){

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
  
  threeceeTwitter[currentThreeceeUser].twit.get("trends/place", {id: 23424977}, function updateTrendsUs (err, data, response){

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

  // });
}

function initUpdateTrendsInterval(interval){

  console.log(chalk.bold.black("INIT UPDATE TRENDS INTERVAL: " + msToTime(interval)));

  clearInterval(updateTrendsInterval);

  getCurrentThreeceeUser(function(currentThreeceeUser){

    if (currentThreeceeUser 
      && (threeceeTwitter[currentThreeceeUser] !== undefined) 
      && threeceeTwitter[currentThreeceeUser].ready) { updateTrends(); }

    updateTrendsInterval = setInterval(function updateTrendsIntervalCall () {

      getCurrentThreeceeUser(function(c3user){

        if (c3user 
          && (threeceeTwitter[c3user] !== undefined) 
          && threeceeTwitter[c3user].ready) 
        { 
          updateTrends(c3user); 
        }

      });

    }, interval);

  });
}

function updateNodeMeter(node, callback){

  const nodeType = node.nodeType;

  if (!configuration.metrics.nodeMeterEnabled) { return callback(null, node); }

  if (node.nodeId === undefined) {
    console.log(chalkError("NODE ID UNDEFINED\n" + jsonPrint(node)));
    return callback("NODE ID UNDEFINED", node);
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

function initFollowableSearchTerms(){

  const termsArray = Array.from(followableSearchTermSet);

  followableSearchTermString = termsArray.join("|");

  followableRegEx = new RegExp(followableSearchTermString, "gi");

  debug(chalkInfo("followableRegEx: " + followableRegEx));

  console.log(chalkLog("FOLLOWABLE SEARCH TERM REGEX INITIALIZED"
    + " | " + followableSearchTermSet.size + " SEARCH TERMS"
  ));

}

let userFollowable = function(user){

  if (user.nodeType !== "user") { return false; }
  if (user.following !== undefined && user.following) { return false; }
  if (user.category !== undefined && user.category) { return false; }
  if (unfollowableUserSet.has(user.nodeId)) { return false; }

  if ((user.description === undefined) || !user.description) { user.description = ""; }
  if ((user.screenName === undefined) || !user.screenName) { user.screenName = ""; }
  if ((user.name === undefined) || !user.name) { user.name = ""; }

  if (followableRegEx === undefined) {
    return false;
  }

  return followableRegEx.test(user.description)
    || followableRegEx.test(user.screenName) 
    || followableRegEx.test(user.name);
};

function autoFollowUser(params, callback){

  if (unfollowableUserSet.has(params.user.nodeId)){

    console.log(chalk.bold.blue("XXX AUTO FOLLOW USER | IN UNFOLLOWABLE SET"
      + "\n" + printUser({user:params.user})
    ));

    if (callback !== undefined) { 
      return callback(null, null);
    }

    return;
  }

  console.log(chalkUser("AUTO FOLLOW USER"
    + " | MIN: " + configuration.minFollowersAuto
    + "\n" + printUser({user:params.user})
  ));

  follow({user: params.user}, function(err, results){
    if (err) {

      unfollowableUserSet.delete(params.user.nodeId);

      if (callback !== undefined) { return callback(err, params); }
      return;
    }

    // adminNameSpace.emit("FOLLOW", params.user);
    // utilNameSpace.emit("FOLLOW", params.user);

    // if (statsObj.tssChildReady) {
    //   tssChild.send({op: "FOLLOW", user: params.user});
    // }

    console.log(chalk.blue("+++ AUTO FOLLOW"
      + " | UID: " + params.user.userId
      + " | @" + params.user.screenName
      + " | NAME: " + params.user.name
      + " | FOLLOWING: " + params.user.following
      + " | 3C FOLLOW: " + params.user.threeceeFollowing
      + " | FLWRs: " + params.user.followersCount
    ));

    const text = "*WAS*"
      + "\n*AUTO FOLLOW*"
      + "\n@" + params.user.screenName + " | " + params.user.name
      // + "\nID: " + params.user.userId
      + "\nFLWRs: " + params.user.followersCount
      + "\n3C @" + params.user.threeceeFollowing;

    slackPostMessage(slackChannelAutoFollow, text);

    if (callback !== undefined) { return callback(null, results); }
  });
}

function checkTwitterRateLimit(params, callback){

  threeceeTwitter[params.user].twit.get("application/rate_limit_status", function(err, data, response) {
    
    if (err){

      console.log(chalkError("!!!!! TWITTER ACCOUNT ERROR"
        + " | @" + params.user
        + " | " + getTimeStamp()
        + " | CODE: " + err.code
        + " | STATUS CODE: " + err.statusCode
        + " | " + err.message
      ));

      threeceeTwitter[params.user].error = err;
      threeceeTwitter[params.user].ready = false;

      if (callback !== undefined) { callback(err, null); }
    }
    else {

      if (configuration.verbose) {
        console.log(chalkLog("TWITTER RATE LIMIT STATUS"
          + " | @" + params.user
          + " | LIM: " + threeceeTwitter[params.user].twitterRateLimit
          + " | REM: " + threeceeTwitter[params.user].twitterRateLimitRemaining
          + " | RST: " + getTimeStamp(threeceeTwitter[params.user].twitterRateLimitResetAt)
          + " | NOW: " + moment().format(compactDateTimeFormat)
          + " | IN " + msToTime(threeceeTwitter[params.user].twitterRateLimitRemainingTime)
        ));
      }

      if (data.resources.users["/users/show/:id"].remaining > 0){


        threeceeTwitter[params.user].ready = true;

        threeceeTwitter[params.user].twitterRateLimit = data.resources.users["/users/show/:id"].limit;
        threeceeTwitter[params.user].twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
        threeceeTwitter[params.user].twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset);
        threeceeTwitter[params.user].twitterRateLimitRemainingTime = threeceeTwitter[params.user].twitterRateLimitResetAt.diff(moment());

        if (threeceeTwitter[params.user].twitterRateLimitExceptionFlag) {

          threeceeTwitter[params.user].twitterRateLimitExceptionFlag = false;
          
          console.log(chalkInfo("XXX RESET TWITTER RATE LIMIT"
            + " | @" + params.user
            + " | CONTEXT: " + data.rate_limit_context.access_token
            + " | LIM: " + threeceeTwitter[params.user].twitterRateLimit
            + " | REM: " + threeceeTwitter[params.user].twitterRateLimitRemaining
            + " | EXP: " + threeceeTwitter[params.user].twitterRateLimitException.format(compactDateTimeFormat)
            + " | NOW: " + moment().format(compactDateTimeFormat)
          ));
        }


      }
      else {

        threeceeTwitter[params.user].ready = false;
        threeceeTwitter[params.user].twitterRateLimitExceptionFlag = true;

        threeceeTwitter[params.user].twitterRateLimit = data.resources.users["/users/show/:id"].limit;
        threeceeTwitter[params.user].twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
        threeceeTwitter[params.user].twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset);
        threeceeTwitter[params.user].twitterRateLimitRemainingTime = threeceeTwitter[params.user].twitterRateLimitResetAt.diff(moment());

        console.log(chalkLog("--- TWITTER RATE LIMIT"
          + " | @" + params.user
          + " | CONTEXT: " + data.rate_limit_context.access_token
          + " | LIM: " + threeceeTwitter[params.user].twitterRateLimit
          + " | REM: " + threeceeTwitter[params.user].twitterRateLimitRemaining
          + " | EXP: " + threeceeTwitter[params.user].twitterRateLimitException.format(compactDateTimeFormat)
          + " | RST: " + threeceeTwitter[params.user].twitterRateLimitResetAt.format(compactDateTimeFormat)
          + " | NOW: " + moment().format(compactDateTimeFormat)
          + " | IN " + msToTime(threeceeTwitter[params.user].twitterRateLimitRemainingTime)
        ));
      }

      if (callback !== undefined) { callback(); }
    }
  });
}

let checkTwitterRateLimitInterval;
let checkTwitterRateLimitReady = true;

function initCheckTwitterRateLimitInterval(interval){

  clearInterval(checkTwitterRateLimitInterval);

  checkTwitterRateLimitReady = true;

  checkTwitterRateLimitInterval = setInterval(function(){

    if (checkTwitterRateLimitReady) {

      checkTwitterRateLimitReady = false;

      async.eachSeries(configuration.threeceeUsers, function(user, cb){

        if (threeceeTwitter[user].twitterRateLimitExceptionFlag) {

          checkTwitterRateLimit({user: user}, function(err){
            cb();
          });

        }
        else {
          cb();
        }

      }, function(err){
          checkTwitterRateLimitReady = true;
      });

    }

  }, interval);
}

function getCurrentThreeceeUser(callback){

  debug(chalkTwitter("getCurrentThreeceeUser 3C USERS\n" + jsonPrint(threeceeTwitter)));

  if (!statsObj.threeceeUsersConfiguredFlag) {
    if (configuration.verbose ){ console.log(chalkAlert("*** THREECEE_USERS NOT CONFIGURED")); }
    return callback(false);
  }

  if (configuration.threeceeUsers.length === 0){
    console.log(chalkAlert("??? NO THREECEE_USERS ???"));
    statsObj.currentThreeceeUser = false;
    return callback(statsObj.currentThreeceeUser);
  }

  async.eachSeries(configuration.threeceeUsers, function(threeceeUser, cb){

    if ((threeceeTwitter[threeceeUser] !== undefined) && threeceeTwitter[threeceeUser].ready) {

      debug(chalkTwitter("IN getCurrentThreeceeUser 3C USER"
        + " | @" + threeceeUser + " READY"
      ));

      return cb(threeceeUser);
    }

    debug(chalkTwitter("IN getCurrentThreeceeUser 3C USER"
      + " | @" + threeceeUser + " NOT READY"
    ));

    cb();


  }, function(threeceeUser){

    if (threeceeUser) { 

      statsObj.currentThreeceeUser = threeceeUser;

      debug(chalkTwitter("getCurrentThreeceeUser 3C USER"
        + " | 3C USERS: " + configuration.threeceeUsers
        + " | @" + statsObj.currentThreeceeUser
      ));

    }
    else {


      if (statsObj.currentThreeceeUser) {

        statsObj.currentThreeceeUser = false;

        console.log(chalkAlert("getCurrentThreeceeUser 3C USER"
          + " | 3C USERS: " + configuration.threeceeUsers
          + " | NONE READY"
        ));
      }

    }

    return callback(statsObj.currentThreeceeUser);

  });
}

function updateUserSets(callback){

  const userCollection = global.dbConnection.collection("users");

  userCollection.countDocuments(function(err, count){
    if (err) { throw Error; }
    statsObj.user.total = count;
    console.log(chalkBlue("GRAND TOTAL USERS IN DB: " + statsObj.user.total));
  });

  userCollection.countDocuments({"following": true}, function(err, count){
    if (err) { throw Error; }
    statsObj.user.following = count;
    console.log(chalkBlue("TOTAL FOLLOWING USERS IN DB: " + statsObj.user.following));
  });

  userCollection.countDocuments({"following": false}, function(err, count){
    if (err) { throw Error; }
    statsObj.user.notFollowing = count;
    console.log(chalkBlue("TOTAL NOT FOLLOWING USERS IN DB: " + statsObj.user.notFollowing));
  });

  userCollection.countDocuments({category: { "$nin": [ false, "false", null ] }}, function(err, count){
    if (err) { throw Error; }
    statsObj.user.categorizedManual = count;
    console.log(chalkBlue("TOTAL CATEGORIZED MANUAL USERS IN DB: " + statsObj.user.categorizedManual));
  });

  userCollection.countDocuments({category: { "$in": [ false, "false", null ] }}, function(err, count){
    if (err) { throw Error; }
    statsObj.user.uncategorizedManual = count;
    console.log(chalkBlue("TOTAL UNCATEGORIZED MANUAL USERS IN DB: " + statsObj.user.uncategorizedManual));
  });

  userCollection.countDocuments({categoryAuto: { "$nin": [ false, "false", null ] }}, function(err, count){
    if (err) { throw Error; }
    statsObj.user.categorizedAuto = count;
    console.log(chalkBlue("TOTAL CATEGORIZED AUTO USERS IN DB: " + statsObj.user.categorizedAuto));
  });

  userCollection.countDocuments({categoryAuto: { "$in": [ false, "false", null ] }}, function(err, count){
    if (err) { throw Error; }
    statsObj.user.uncategorizedAuto = count;
    console.log(chalkBlue("TOTAL UNCATEGORIZED AUTO USERS IN DB: " + statsObj.user.uncategorizedAuto));
  });

  const followingSearchQuery = {following: true};
  const userFollowingCursor = User.find(followingSearchQuery).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

  userFollowingCursor.on("data", function(user) {

    if (!user.category) { 

      uncategorizedManualUserSet.add(user.nodeId);

      if (uncategorizedManualUserSet.size % 100 === 0) {
        printUserObj("UNCAT MAN USER  [" + uncategorizedManualUserSet.size + "]", user);
      }

    }

    if (!user.categoryAuto) { 

      uncategorizedAutoUserSet.add(user.nodeId);

      if (uncategorizedAutoUserSet.size % 100 === 0) {
        printUserObj("UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", user);
      }

    }
    
    if (user.category && user.categoryAuto && (user.category !== user.categoryAuto)) { 

      mismatchUserSet.add(user.nodeId); 

      if (mismatchUserSet.size % 100 === 0) {
        printUserObj("MISMATCHED USER [" + mismatchUserSet.size + "]", user);
      }

    }
  });

  userFollowingCursor.on("end", function() {

    uncategorizedManualUserArray = [...uncategorizedManualUserSet];
    mismatchUserArray = mismatchUserSet.keys();

    statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;
    statsObj.user.mismatched = mismatchUserSet.size;

    console.log(chalkBlue("END FOLLOWING CURSOR | FOLLOWING USER SET"));
    console.log(chalkBlue("USER DB STATS\n" + jsonPrint(statsObj.user)));
  });

  userFollowingCursor.on("error", function(err) {

    uncategorizedManualUserArray = [...uncategorizedManualUserSet];
    mismatchUserArray = mismatchUserSet.keys();

    statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;
    statsObj.user.mismatched = mismatchUserSet.size;

    console.error(chalkError("*** ERROR userFollowingCursor: " + err));
    console.log(chalkAlert("USER DB STATS\n" + jsonPrint(statsObj.user)));
  });

  userFollowingCursor.on("close", function() {

    uncategorizedManualUserArray = [...uncategorizedManualUserSet];
    mismatchUserArray = mismatchUserSet.keys();

    statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;
    statsObj.user.mismatched = mismatchUserSet.size;

    console.log(chalkBlue("CLOSE FOLLOWING CURSOR"));
    console.log(chalkBlue("USER DB STATS\n" + jsonPrint(statsObj.user)));

    if (callback !== undefined) { callback(); }

  });

  // if (callback !== undefined) { callback(); }
}

function initTransmitNodeQueueInterval(interval){

  console.log(chalk.bold.black("INIT TRANSMIT NODE QUEUE INTERVAL: " + msToTime(interval)));

  clearInterval(transmitNodeQueueInterval);

  let nodeObj;
  let followable;
  let nCacheObj;

  let deltaTxNodeStart = process.hrtime();
  let deltaTxNode = process.hrtime(deltaTxNodeStart);

  transmitNodeQueueInterval = setInterval(function txNodeQueue () {

    if (transmitNodeQueueReady && (transmitNodeQueue.length > 0)) {

      deltaTxNodeStart = process.hrtime();

      transmitNodeQueueReady = false;
      nodeObj = transmitNodeQueue.shift();

      if (!nodeObj) {
        console.log(chalkError(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q")));
        transmitNodeQueueReady = true;

        deltaTxNode = process.hrtime(deltaTxNodeStart);
        if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (!nodeObj): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

      }
      else {

        nodeObj.updateLastSeen = true;

        if (!nodeObj.category || (nodeObj.category === undefined)) { nodeObj.category = false; }
        if (!nodeObj.categoryAuto || (nodeObj.categoryAuto === undefined)) { nodeObj.categoryAuto = false; }

        if (configuration.verbose) {
          debug(chalkInfo("TX NODE DE-Q"
            + " | NID: " + nodeObj.nodeId
            + " | " + nodeObj.nodeType
            + " | CAT: " + nodeObj.category
            + " | CATA: " + nodeObj.categoryAuto
          ));
        }

        checkCategory(nodeObj, function checkCategoryCallback(err, node){

          if (err) { 
            transmitNodeQueueReady = true;

            console.log(chalkError("*** CHECK CATEGORY ERROR: " + err));

            deltaTxNode = process.hrtime(deltaTxNodeStart);
            if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (checkCategory err): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

            return; 
          }

          updateNodeMeter(node, function updateNodeMeterCallback(err, n){

            if (err) {
              console.log(chalkError("ERROR updateNodeMeter: " + err
                + " | TYPE: " + node.nodeType
                + " | NID: " + node.nodeId
              ));
              delete node["_id"];
              viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));

              transmitNodeQueueReady = true;

              deltaTxNode = process.hrtime(deltaTxNodeStart);
              if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (updateNodeMeter err): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

            }
            else {

              followable = userFollowable(n);

              if (configuration.verbose) { 
                printUserObj("FOLLWABLE: " + followable, n);
              }

              getCurrentThreeceeUser(function(currentThreeceeUser){

                if (configuration.verbose) { 
                  console.log(chalkAlert("getCurrentThreeceeUser: " + currentThreeceeUser));
                  if (threeceeTwitter[currentThreeceeUser] !== undefined) {
                    console.log(chalkAlert("threeceeTwitter[currentThreeceeUser].ready: " + threeceeTwitter[currentThreeceeUser].ready));
                  }
                  console.log(chalkAlert("twitUserShowReady: " + twitUserShowReady));
                  console.log(chalkAlert("followable: " + followable));
                }

                if (currentThreeceeUser
                  && (threeceeTwitter[currentThreeceeUser] !== undefined) 
                  && threeceeTwitter[currentThreeceeUser].ready 
                  && twitUserShowReady 
                  && followable){

                  threeceeTwitter[currentThreeceeUser].twit.get("users/show", 
                    {user_id: n.nodeId, include_entities: true}, 
                    function usersShow (err, rawUser, response){

                    twitUserShowReady = false;

                    if (configuration.verbose) { debug(chalkAlert("RAW USER\n" + jsonPrint(rawUser))); }

                    if (err){

                      if (err.code === 88){

                        console.log(chalkAlert("*** TWITTER SHOW USER ERROR | RATE LIMIT EXCEEDED" 
                          + " | " + getTimeStamp() 
                          + " | @" + currentThreeceeUser 
                        ));

                        threeceeTwitter[currentThreeceeUser].ready = false;
                        threeceeTwitter[currentThreeceeUser].twitterRateLimitException = moment();
                        threeceeTwitter[currentThreeceeUser].twitterRateLimitExceptionFlag = true;

                        checkTwitterRateLimit({user: currentThreeceeUser});

                        delete n["_id"];
                        viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));

                      }
                      else if (err.code === 63){

                        console.log(chalkError("*** TWITTER SHOW USER ERROR | USER SUSPENDED"
                          + " | " + getTimeStamp() 
                          + " | 3C @" + currentThreeceeUser 
                          + " | UID: " + n.nodeId
                          + " | ERR CODE: " + err.code
                          + " | " + err.message
                        ));

                        unfollowableUserSet.add(n.nodeId);
                      }
                      else if (err.code === 99){

                        console.log(chalkError("*** TWITTER SHOW USER ERROR | UNABLE TO VERIFY CREDENTIALS"
                          + " | " + getTimeStamp() 
                          + " | 3C @" + currentThreeceeUser 
                          + " | ERR CODE: " + err.code
                          + " | " + err.message
                        ));

                        threeceeTwitter[currentThreeceeUser].ready = false;
                        threeceeTwitter[currentThreeceeUser].twitterCredentialErrorFlag = true;
                      }
                      else {

                        console.log(chalkError("*** TWITTER SHOW USER ERROR"
                          + " | " + getTimeStamp() 
                          + " | 3C @" + currentThreeceeUser 
                          + " | UID: " + n.nodeId
                          + " | ERR CODE: " + err.code
                          + " | " + err.message
                        ));
                      }

                      twitUserShowReady = true;
                      transmitNodeQueueReady = true;

                      deltaTxNode = process.hrtime(deltaTxNodeStart);
                      if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (users/show err): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

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
                      n.profileUrl = "https://twitter.com/" + rawUser.screen_name;
                      n.profileImageUrl = rawUser.profile_image_url;
                      n.bannerImageUrl = rawUser.profile_banner_url;
                      n.verified = rawUser.verified;
                      n.following = true;
                      n.threeceeFollowing = configuration.twitterThreeceeAutoFollowUser;
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
                          delete n["_id"];
                          viewNameSpace.volatile.emit("node", n);
                        }
                        else {

                          delete n["_id"];
                          viewNameSpace.volatile.emit("node", updatedUser);

                          if (!unfollowableUserSet.has(updatedUser.nodeId)) { 
                            autoFollowUser({ threeceeUser: configuration.twitterThreeceeAutoFollowUser, user: updatedUser });
                          }
                          else {
                            console.log(chalkAlert("... NO AUTO FOLLOW | IN UNFOLLOWABLE SET"
                              + "\n" + printUser( { user: updatedUser} )
                            ));
                          }

                        }

                        twitUserShowReady = true;
                        transmitNodeQueueReady = true;

                        deltaTxNode = process.hrtime(deltaTxNodeStart);
                        if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (findOneUser): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

                      });
                    }
                    else {
                      delete n["_id"];
                      viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));

                      twitUserShowReady = true;
                      transmitNodeQueueReady = true;

                      deltaTxNode = process.hrtime(deltaTxNodeStart);
                      if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (no autofollow): " + deltaTxNode[0] + "." + deltaTxNode[1])); }
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
                      delete n["_id"];
                      viewNameSpace.volatile.emit("node", n);
                    }
                    else {
                      delete n["_id"];
                      viewNameSpace.volatile.emit("node", updatedUser);
                    }

                    transmitNodeQueueReady = true;

                    deltaTxNode = process.hrtime(deltaTxNodeStart);
                    if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (user categorized): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

                  });
                }
                else if (n.nodeType === "user") {
                  delete n["_id"];
                  viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));

                  transmitNodeQueueReady = true;

                  deltaTxNode = process.hrtime(deltaTxNodeStart);
                  if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (user uncategorized): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

                }
                else if ((n.nodeType === "hashtag") && n.category){

                  n.updateLastSeen = true;

                  hashtagServerController.findOneHashtag(n, {noInc: false}, function(err, updatedHashtag){
                    if (err) {
                      console.log(chalkError("updatedHashtag ERROR\n" + jsonPrint(err)));
                      delete n["_id"];
                      viewNameSpace.volatile.emit("node", n);
                    }
                    else if (updatedHashtag) {
                      delete n["_id"];
                      viewNameSpace.volatile.emit("node", updatedHashtag);
                    }
                    else {
                      delete n["_id"];
                      viewNameSpace.volatile.emit("node", n);
                    }

                    transmitNodeQueueReady = true;

                    deltaTxNode = process.hrtime(deltaTxNodeStart);
                    if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (hashtag categorized): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

                  });
                }
                else if (n.nodeType === "hashtag") {
                  delete n["_id"];
                  viewNameSpace.volatile.emit("node", n);
                  transmitNodeQueueReady = true;

                  deltaTxNode = process.hrtime(deltaTxNodeStart);
                  if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (hashtag uncategorized): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

                }
                else {
                  transmitNodeQueueReady = true;

                  deltaTxNode = process.hrtime(deltaTxNodeStart);
                  if (deltaTxNode[0] > 0) { console.log(chalkAlert("*** WAS TX NODE DELTA (nothing?): " + deltaTxNode[0] + "." + deltaTxNode[1])); }

                }

              });
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

  async.parallel({
    user: function(cb){
      if (tw.user) { transmitNodeQueue.push(tw.user); }
      cb();
    },
    userMentions: function(cb){
      tw.userMentions.forEach(function userMentionsTxNodeQueue(user){
        if (user && configuration.enableTransmitUser) { transmitNodeQueue.push(user); }
      });
      cb();
    },
    hashtags: function(cb){
      tw.hashtags.forEach(function hashtagsTxNodeQueue(hashtag){
        if (hashtag && configuration.enableTransmitHashtag) { transmitNodeQueue.push(hashtag); }
      });
      cb();
    }
  },
  function(){
    callback();
  });   

  // if (tw.user) {transmitNodeQueue.push(tw.user);}

  // if (tw.place && configuration.enableTransmitPlace) {transmitNodeQueue.push(tw.place);}

  // tw.userMentions.forEach(function userMentionsTxNodeQueue(user){
  //   if (user && configuration.enableTransmitUser) {transmitNodeQueue.push(user);}
  // });

  // tw.hashtags.forEach(function hashtagsTxNodeQueue(hashtag){
  //   if (hashtag && configuration.enableTransmitHashtag) { transmitNodeQueue.push(hashtag); }
  // });

  // if (configuration.enableTransmitMedia) {
  //   tw.media.forEach(function mediaTxNodeQueue(media){
  //     if (media) { transmitNodeQueue.push(media); }
  //   });
  // }

  // if (configuration.enableTransmitEmoji) {
  //   tw.emoji.forEach(function emojiTxNodeQueue(emoji){
  //     if (emoji) { transmitNodeQueue.push(emoji); }
  //   });
  // }

  // if (configuration.enableTransmitUrl) {
  //   tw.urls.forEach(function urlTxNodeQueue(url){
  //     if (url) { transmitNodeQueue.push(url); }
  //   });
  // }

  // if (configuration.enableTransmitWord) {
  //   tw.words.forEach(function wordsTxNodeQueue(word){
  //     if (word && categorizedWordHashMap.has(word.nodeId)) { transmitNodeQueue.push(word); }
  //   });
  // }


  // callback();
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

  app.post("/login",
    passport.authenticate("local", { 
      successReturnToOrRedirect: "/session",
      failureRedirect: "/login"
    })
  );

  app.use(methodOverride());

  app.use(function requestLog(req, res, next) {

    if (req.path === "/json") {
      if (!ignoreIpSet.has(req.ip)) {
        console.log(chalkLog("R< REJECT: /json"
          + " | " + getTimeStamp()
          + " | IP: " + req.ip
          + " | HOST: " + req.hostname
          + " | METHOD: " + req.method
          + " | PATH: " + req.path
        ));
        ignoreIpSet.add(req.ip);
      }
      res.sendStatus(404);
    }
    else if (req.path === "/dropbox_webhook") {

      console.log(chalk.bold.black("R< DROPBOX WEB HOOK | /dropbox_webhook"
        + " | DB CURSOR READY: " + dropboxFolderGetLastestCursorReady
        + " | DB CHANGE FOLDER ARRAY\n" + jsonPrint(configuration.dropboxChangeFolderArray)
      )); 

      if (configuration.verbose) {
        console.log(chalkInfo("R< dropbox_webhook"
          + "\nreq.query\n" + jsonPrint(req.query)
          + "\nreq.params\n" + jsonPrint(req.params)
          + "\nreq.body\n" + jsonPrint(req.body)
        )); 
      }

      res.send(req.query.challenge);

      let dropboxCursorFolderArray = configuration.dropboxChangeFolderArray;

      if (dropboxFolderGetLastestCursorReady) {

        dropboxFolderGetLastestCursorReady = false;

        async.each(dropboxCursorFolderArray, function(folder, cb){

          dropboxFolderGetLastestCursor(folder, function(err, response){

            if (err) {
              console.log(chalkError("*** DROPBOX GET LATEST CURSOR ERROR: " + err));
              return cb(err);
            }
            
            if (response && (response.entries.length > 0)) {

              setTimeout(function(){

                console.log(chalk.bold.black(">>> DROPBOX CHANGE"
                  + " | " + getTimeStamp()
                  + " | FOLDER: " + folder
                ));

                response.entries.forEach(function(entry){

                  console.log(chalkAlert(">>> DROPBOX CHANGE | " + entry.path_lower));

                  if ((entry.path_lower.endsWith("google_wordassoserverconfig.json"))
                    || (entry.path_lower.endsWith("default_wordassoserverconfig.json"))){
                    initConfig();
                  }

                  if (entry.path_lower.endsWith("defaultsearchterms.txt")){
                    updateSearchTerms();
                  }

                  if ((entry.path_lower.endsWith("google_twitterSearchStreamConfig.json"))
                    || (entry.path_lower.endsWith("default_twitterSearchStreamConfig.json"))){

                    killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, numKilled){
                      tssPongReceived = false;
                      initTssChild({childId: DEFAULT_TSS_CHILD_ID});
                    });

                  }

                });

                cb();
              }, configuration.dropboxWebhookChangeTimeout);

            }
            else {
              setTimeout(function(){ cb(); }, configuration.dropboxWebhookChangeTimeout);
            }

          });

        }, function(err){
          console.log(chalkInfo("WAS | END DROPBOX WEBHOOK"));
          dropboxFolderGetLastestCursorReady = true;
          next();
        });
      }
      else {
        console.log(chalkAlert("WAS | SKIP DROPBOX WEBHOOK ... NOT READY"));
        next();
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

      console.log(chalkAlert("SLACK"));

      if (req.body.type === "url_verification") {
        console.log(chalkInfo("R< SLACK URL VERIFICATION"
          + " | TOKEN: " + req.body.token
          + " | CHALLENGE: " + req.body.challenge
        ));
        res.send(req.body.challenge);
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

  app.use(express.static("./"));
  app.use(express.static("./js"));
  app.use(express.static("./css"));
  app.use(express.static("./node_modules"));
  app.use(express.static("./public/assets/images"));

  const adminHtml = __dirname + "/admin/admin.html";

  app.get("/admin", function requestAdmin(req, res) {
    debug(chalkInfo("get req\n" + req));
    console.log(chalkLog("LOADING PAGE"
      + " | REQ: " + req.url
      + " | RES: " + adminHtml
    ));
    res.sendFile(adminHtml, function responseAdmin(err) {
      if (err) {
        console.log(chalkError("GET /admin ERROR:"
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

  const loginHtml = __dirname + "/login.html";

  app.get("/login", function requestSession(req, res, next) {

    debug(chalkInfo("get next\n" + next));

    console.log(chalkLog("LOADING PAGE"
      + " | REQ: " + req.url
      + " | RES: " + loginHtml
    ));

    res.sendFile(loginHtml, function responseSession(err) {
      if (err) {
        console.log(chalkError("GET /login ERROR:"
          + " | " + getTimeStamp()
          + " | " + req.url
          + " | " + loginHtml
          + " | " + err
        ));
      } 
      else {
        debug(chalkInfo("SENT:", loginHtml));
      }
    });
  });

  const sessionHtml = __dirname + "/sessionModular.html";

  app.get("/session", function requestSession(req, res, next) {

    debug(chalkInfo("get next\n" + next));

    debug("req");
    debug(req);

    console.log(chalkLog("LOADING PAGE"
      // + " [ VIEWS: " + req.session.views + "]"
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
      console.log(chalkAlert("PASSPORT TWITTER AUTHENTICATED"));
      slackPostMessage(slackChannel, "PASSPORT TWITTER AUTHENTICATED");
      return next();
    }
    console.log(chalkAlert("*** PASSPORT TWITTER *NOT* AUTHENTICATED ***"));
    slackPostMessage(slackChannel, "PASSPORT TWITTER AUTHENTICATION FAILED");
  }

  app.get("/account", ensureAuthenticated, function(req, res){

    console.log(chalkError("PASSPORT TWITTER AUTH USER\n" + jsonPrint(req.session.passport.user)));  // handle errors
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
      else if (user) {
        console.log(chalk.green("TWITTER USER AUTHENTICATED: @" + user.screenName));  // handle errors
        slackPostMessage(slackChannel, "USER AUTH: @" + user.screenName);
        authenticatedTwitterUserCache.set(user.nodeId, user);
        res.redirect("/after-auth.html");
      }
      else {
        console.log(chalkAlert("*** TWITTER USER AUTHENTICATE FAILED"
          + " | @" + req.session.passport.user.screenName + " NOT FOUND"));
        res.redirect("/504.html");
      }
    });
  });

  app.get("/auth/twitter/error", function(req, res){
    console.log(chalkAlert("PASSPORT AUTH TWITTER ERROR"));
  });

  app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
  });

  callback(null);
}

function testInternetConnection(params, callback) {

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
    // console.log("testInternetConnection");
  });

  internetCheckInterval = setInterval(function internetCheck(){

    testInternetConnection(params, function(err, internetReady){
      // console.log("testInternetConnection");
    });

  }, interval);
}

function initTwitterRxQueueInterval(interval){

  let tweet = {};

  // statsObj.tweetParserSendReady = true;

  console.log(chalk.bold.black("INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

    // if ((tweetRxQueue.length > 0) && statsObj.tweetParserReady && statsObj.tweetParserSendReady) {
    if ((tweetRxQueue.length > 0) && statsObj.tweetParserReady) {

      tweet = tweetRxQueue.shift();


      childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({ op: "tweet", tweetStatus: tweet });


    }
  }, interval);
}

// let htObj = {};
// let categoryObj = {};

// function initHashtagLookupQueueInterval(interval){

//   let hashtagLookupQueueReady = true;

//   console.log(chalk.bold.black("INIT HASHTAG LOOKUP QUEUE INTERVAL | " + msToTime(interval)));

//   clearInterval(hashtagLookupQueueInterval);

//   hashtagLookupQueueInterval = setInterval(function hashtagLookupQueueDeQ() {

//     if ((hashtagLookupQueue.length > 0) && hashtagLookupQueueReady) {

//       hashtagLookupQueueReady = false;

//       htObj = hashtagLookupQueue.shift();


//       hashtagServerController.findOne({hashtag: htObj}, function(err, hashtag){
//         if (err) {
//           console.log(chalkError("HASHTAG FIND ONE ERROR\n" + jsonPrint(err)));
//         }
//         else if (hashtag) { 

//           categoryObj = {};

//           categoryObj.manual = hashtag.category || false;
//           categoryObj.auto = hashtag.categoryAuto || false;

//           categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), categoryObj); 

//           debug(chalkTwitter("+++ HT HIT "
//             + " | CM: " + printCat(hashtag.category)
//             + " | CA: " + printCat(hashtag.categoryAuto)
//             + " | #" + hashtag.nodeId.toLowerCase()
//           ));
//         }
//         else {
//           // debug(chalkTwitter("HASHTAG NOT FOUND: " + htObj.text));
//           debug(chalkTwitter("--- HT MISS"
//             + " | CM: " + printCat(htObj.category)
//             + " | CA: " + printCat(htObj.categoryAuto)
//             + " | #" + htObj.nodeId.toLowerCase()
//           ));
//         }
//         hashtagLookupQueueReady = true;
//       });

//     }
//   }, interval);
// }

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

          if (transmitNodeQueue.length < configuration.maxQueue) {

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

    if (keySortReady && (keySortQueue.length > 0)) {

      keySortReady = false;

      keySortParams = keySortQueue.shift();

      keySort(keySortParams, function(err, results){

        if (err) {
          console.log(chalkError("KEY SORT ERROR: " + err));
          keySortReady = true;
        }
        else {

          sorterMessageRxQueue.push(
            { op: "SORTED", 
              nodeType: results.nodeType, 
              sortKey: results.sortKey, 
              sortedKeys: results.sortedKeys
            }
          );

          keySortReady = true;
        }

      });
    }
  }, interval);
}

function initTssPingInterval(interval){

  clearInterval(tssPingInterval);

  tssPingSent = false;
  tssPongReceived = false;

  tssPingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_TSS_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_TSS_CHILD_ID].child) {

    tssPingInterval = setInterval(function(){

      if (!tssPingSent) {

        tssPingId = moment().valueOf();

        childrenHashMap[DEFAULT_TSS_CHILD_ID].child.send({op: "PING", pingId: tssPingId}, function(err){

          tssPingSent = true; 

          if (err) {

            console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, numKilled){
              tssPongReceived = false;
              initTssChild({childId: DEFAULT_TSS_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(tssPingId))); }

        });

      }
      else if (tssPingSent && tssPongReceived) {

        tssPingId = moment().valueOf();

        tssPingSent = false; 
        tssPongReceived = false;

        childrenHashMap[DEFAULT_TSS_CHILD_ID].child.send({op: "PING", pingId: tssPingId}, function(err){

          if (err) {

            console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, numKilled){
              tssPongReceived = false;
              initTssChild({childId: DEFAULT_TSS_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(tssPingId))); }

          tssPingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("*** PONG TIMEOUT | TSS"
          + " | TIMEOUT: " + interval
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tssPingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tssPingId)
        ));
        
        slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\nTWEET_PARSER\nPONG TIMEOUT");

        clearInterval(tssPingInterval);

        tssPingSent = false; 
        tssPongReceived = false;

        setTimeout(function(){

          killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, numKilled){
            initTssChild({childId: DEFAULT_TSS_CHILD_ID});
          });

        }, 5000);
      }
    }, interval);

  }
}

function updateSearchTerms(){
  console.log(chalk.bold.black("WAS | UPDATE SEARCH TERMS"));

  if (statsObj.tssChildReady) {
    tssChild.send({op: "UPDATE_SEARCH_TERMS"});
  }
}

function initTssChild(params, callback){

  console.log(chalk.bold.black("INIT TSS CHILD\n" + jsonPrint(params)));

  statsObj.tssChildReady = false;

  let deltaTssMessageStart = process.hrtime();
  let deltaTssMessage = process.hrtime(deltaTssMessageStart);

  const tss = cp.fork(`${__dirname}/js/libs/tssChild.js`);

  childrenHashMap[params.childId] = {};
  childrenHashMap[params.childId].pid = tss.pid;
  childrenHashMap[params.childId].childId = params.childId;
  childrenHashMap[params.childId].title = "wa_node_tss";
  childrenHashMap[params.childId].status = "NEW";
  childrenHashMap[params.childId].errors = 0;

  tss.on("message", function tssMessageRx(m){

    childrenHashMap[params.childId].status = "RUNNING";  

    debug(chalkLog("TSS RX MESSAGE"
      + " | OP: " + m.op
    ));

    switch (m.op) {

      case "ERROR":
        console.log(chalkError("<TSS | ERROR"
          + " | ERROR TYPE: " + m.errorType
          + " | ERROR: " + jsonPrint(m.error)
        ));
      break;

      case "FOLLOW_LIMIT":

        console.log(chalkInfo("<TSS | FOLLOW LIMIT"
          + " | 3C @" + m.threeceeUser
          + " | LIMIT: " + getTimeStamp(m.twitterFollowLimit)
          + " | NOW: " + getTimeStamp()
        ));
        configuration.twitterThreeceeAutoFollowUser = "altthreecee02";
      break;

      case "TWEET":
        deltaTssMessage = process.hrtime(deltaTssMessageStart);
        if (deltaTssMessage[0] > 0) { console.log(chalkAlert("*** TSS RX DELTA: " + deltaTssMessage[0] + "." + deltaTssMessage[1])); }
        deltaTssMessageStart = process.hrtime();
        if (configuration.verbose) { debug(chalkInfo("R< TWEET | " + m.tweet.id_str + " | @" + m.tweet.user.screen_name)); }
        socketRxTweet(m.tweet);
      break;

      case "PONG":
        tssPongReceived = m.pongId;
        childrenHashMap[params.childId].status = "RUNNING";
        if (configuration.verbose) {
          console.log(chalkInfo("<TSS | PONG"
            + " | NOW: " + getTimeStamp()
            + " | PONG ID: " + getTimeStamp(m.pongId)
            + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
          ));
        }
      break;

      default:
        console.log(chalkError("TSS | *** ERROR *** UNKNOWN OP: " + m.op));
    }

    // if (m.op === "PONG"){

    //   tssPongReceived = m.pongId;

    //   childrenHashMap[params.childId].status = "RUNNING";

    //   if (configuration.verbose) {
    //     console.log(chalkInfo("<PONG | TSS"
    //       + " | NOW: " + getTimeStamp()
    //       + " | PONG ID: " + getTimeStamp(m.pongId)
    //       + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
    //     ));
    //   }
    // } 

    // else {

    //   deltaTssMessage = process.hrtime(deltaTssMessageStart);
    //   if (deltaTssMessage[0] > 0) { console.log(chalkAlert("*** TSS RX DELTA: " + deltaTssMessage[0] + "." + deltaTssMessage[1])); }
    //   deltaTssMessageStart = process.hrtime();

    //   if (configuration.verbose) { debug(chalkInfo("R< TWEET | " + m.tweet.id_str + " | @" + m.tweet.user.screen_name)); }
      
    //   socketRxTweet(m.tweet);

    // }

  });

  tss.on("error", function tssError(err){
    console.log(chalkError(getTimeStamp()
      + " | *** TSS ERROR ***"
      + " \n" + jsonPrint(err)
    ));
    statsObj.tssSendReady = false;
    statsObj.tssChildReady = false;
    clearInterval(tssPingInterval);
    childrenHashMap[params.childId].status = "ERROR";
  });

  tss.on("exit", function tssExit(code){
    console.log(chalkError(getTimeStamp()
      + " | *** TSS EXIT ***"
      + " | EXIT CODE: " + code
    ));
    statsObj.tssSendReady = false;
    statsObj.tssChildReady = false;
    clearInterval(tssPingInterval);
    childrenHashMap[params.childId].status = "EXIT";
  });

  tss.on("close", function tssClose(code){
    console.log(chalkError(getTimeStamp()
      + " | *** TSS CLOSE ***"
      + " | EXIT CODE: " + code
    ));
    statsObj.tssSendReady = false;
    statsObj.tssChildReady = false;
    clearInterval(tssPingInterval);
    childrenHashMap[params.childId].status = "CLOSE";
  });

  childrenHashMap[params.childId].child = tss;

  statsObj.tssChildReady = true;

  tss.send({
    op: "INIT",
    title: "wa_node_tss",
    networkObj: bestNetworkObj,
    maxInputHashMap: maxInputHashMap,
    normalization: normalization,
    interval: configuration.tssInterval,
    verbose: false
  }, function tssMessageRxError(err){
    if (err) {
      console.log(chalkError("*** TSS SEND ERROR"
        + " | " + err
      ));
      statsObj.tssSendReady = false;
      statsObj.tssChildReady = false;
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "ERROR";
    }
    else {
      statsObj.tssSendReady = true;
      statsObj.tssChildReady = true;
      childrenHashMap[params.childId].status = "INIT";
      clearInterval(tssPingInterval);
      setTimeout(function(){
        initTssPingInterval(DEFAULT_PING_INTERVAL);
      }, 1000);
    }
  });

  if (callback !== undefined) { callback(null, tss); }
}

function initTweetParserPingInterval(interval){

  clearInterval(tweetParserPingInterval);

  tweetParserPingSent = false;
  tweetParserPongReceived = false;

  tweetParserPingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child) {

    tweetParserPingInterval = setInterval(function(){

      if (!tweetParserPingSent) {

        tweetParserPingId = moment().valueOf();

        childrenHashMap[DEFAULT_TWEET_PARSER_CHILD_ID].child.send({op: "PING", pingId: tweetParserPingId}, function(err){

          tweetParserPingSent = true; 

          if (err) {

            console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
              tweetParserPongReceived = false;
              initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
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

            killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
              tweetParserPongReceived = false;
              initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(tweetParserPingId))); }

          tweetParserPingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("*** PONG TIMEOUT | TWEET_PARSER"
          + " | TIMEOUT: " + interval
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tweetParserPingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tweetParserPingId)
        ));
        
        slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\nTWEET_PARSER\nPONG TIMEOUT");

        clearInterval(tweetParserPingInterval);

        tweetParserPingSent = false; 
        tweetParserPongReceived = false;

        setTimeout(function(){

          killChild({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, numKilled){
            initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID});
          });

        }, 5000);
      }
    }, interval);

  }
}
function initTweetParser(params, callback){

  console.log(chalk.bold.black("INIT TWEET PARSER\n" + jsonPrint(params)));

  clearInterval(tweetParserPingInterval);
  tweetParserPongReceived = false;

  statsObj.tweetParserReady = false;

  let deltaTweetParserMessageStart = process.hrtime();
  let deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);

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

    if (m.op === "PONG"){

      tweetParserPongReceived = m.pongId;

      childrenHashMap[params.childId].status = "RUNNING";

      if (configuration.verbose) {
        console.log(chalkInfo("<PONG | TWEET PARSER"
          + " | NOW: " + getTimeStamp()
          + " | PONG ID: " + getTimeStamp(m.pongId)
          + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
        ));
      }
    } 

    else if (tweetParserMessageRxQueue.length < configuration.maxQueue){
      deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);
      if (deltaTweetParserMessage[0] > 0) { console.log(chalkAlert("*** TWP RX DELTA: " + deltaTweetParserMessage[0] + "." + deltaTweetParserMessage[1])); }
      deltaTweetParserMessageStart = process.hrtime();
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
    }
    else {
      statsObj.tweetParserSendReady = true;
      statsObj.tweetParserReady = true;
      childrenHashMap[params.childId].status = "INIT";
      clearInterval(tweetParserPingInterval);
      setTimeout(function(){
        initTweetParserPingInterval(DEFAULT_PING_INTERVAL);
      }, 1000);
    }
  });

  if (callback !== undefined) { callback(null, twp); }
}


// function initSorterPingInterval(interval){

//   clearInterval(sorterPingInterval);

//   sorterPingSent = false;
//   sorterPongReceived = false;

//   sorterPingId = moment().valueOf();

//   if ((childrenHashMap[DEFAULT_SORTER_CHILD_ID] !== undefined) 
//     && childrenHashMap[DEFAULT_SORTER_CHILD_ID].child) {

//     sorterPingInterval = setInterval(function(){

//       if (!sorterPingSent) {

//         sorterPingId = moment().valueOf();

//         childrenHashMap[DEFAULT_SORTER_CHILD_ID].child.send({op: "PING", pingId: sorterPingId}, function(err){

//           sorterPingSent = true; 

//           if (err) {

//             console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

//             killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
//               sorterPongReceived = false;
//               initSorter({childId: DEFAULT_SORTER_CHILD_ID});
//             });

//             return;
//           }

//           if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(sorterPingId))); }

//         });

//       }
//       else if (sorterPingSent && sorterPongReceived) {

//         sorterPingId = moment().valueOf();

//         sorterPingSent = false; 
//         sorterPongReceived = false;

//         childrenHashMap[DEFAULT_SORTER_CHILD_ID].child.send({op: "PING", pingId: sorterPingId}, function(err){

//           if (err) {

//             console.log(chalkError("*** TWEET_PARSER SEND PING ERROR: " + err));

//             killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
//               sorterPongReceived = false;
//               initSorter({childId: DEFAULT_SORTER_CHILD_ID});
//             });

//             return;
//           }

//           if (configuration.verbose) { console.log(chalkInfo(">PING | TWEET_PARSER | PING ID: " + getTimeStamp(sorterPingId))); }

//           sorterPingSent = true; 

//         });

//       }
//       else {

//         console.log(chalkAlert("*** PONG TIMEOUT | TWEET_PARSER"
//           + " | TIMEOUT: " + interval
//           + " | NOW: " + getTimeStamp()
//           + " | PING ID: " + getTimeStamp(sorterPingId)
//           + " | ELAPSED: " + msToTime(moment().valueOf() - sorterPingId)
//         ));
        
//         slackPostMessage(slackErrorChannel, "\n*CHILD ERROR*\nTWEET_PARSER\nPONG TIMEOUT");

//         clearInterval(sorterPingInterval);

//         sorterPingSent = false; 
//         sorterPongReceived = false;

//         setTimeout(function(){

//           killChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, numKilled){
//             initSorter({childId: DEFAULT_SORTER_CHILD_ID});
//           });

//         }, 5000);
//       }
//     }, interval);

//   }
// }
// function initSorterChild(params, callback){

//   console.log(chalk.bold.black("INIT TWEET PARSER\n" + jsonPrint(params)));

//   clearInterval(sorterPingInterval);
//   sorterPongReceived = false;

//   statsObj.sorterReady = false;

//   let deltaSorterMessageStart = process.hrtime();
//   let deltaSorterMessage = process.hrtime(deltaSorterMessageStart);

//   const srt = cp.fork(`${__dirname}/js/libs/sorter.js`);

//   childrenHashMap[params.childId] = {};
//   childrenHashMap[params.childId].pid = srt.pid;
//   childrenHashMap[params.childId].childId = params.childId;
//   childrenHashMap[params.childId].title = "wa_node_sorter";
//   childrenHashMap[params.childId].status = "NEW";
//   childrenHashMap[params.childId].errors = 0;

//   srt.on("message", function sorterMessageRx(m){

//     childrenHashMap[params.childId].status = "RUNNING";  

//     debug(chalkLog("SORTER CHILD RX MESSAGE"
//       + " | OP: " + m.op
//     ));

//     if (m.op === "PONG"){

//       sorterPongReceived = m.pongId;

//       childrenHashMap[params.childId].status = "RUNNING";

//       if (configuration.verbose) {
//         console.log(chalkInfo("<PONG | SORTER CHILD"
//           + " | NOW: " + getTimeStamp()
//           + " | PONG ID: " + getTimeStamp(m.pongId)
//           + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
//         ));
//       }
//     } 

//     else if (sorterMessageRxQueue.length < configuration.maxQueue){
//       deltaSorterMessage = process.hrtime(deltaSorterMessageStart);
//       if (deltaSorterMessage[0] > 0) { console.log(chalkAlert("*** SORTER RX DELTA: " + deltaSorterMessage[0] + "." + deltaSorterMessage[1])); }
//       deltaSorterMessageStart = process.hrtime();
//       sorterMessageRxQueue.push(m);
//     }

//   });

//   srt.on("error", function sorterError(err){
//     console.log(chalkError(getTimeStamp()
//       + " | *** SORTER CHILD ERROR ***"
//       + " \n" + jsonPrint(err)
//     ));
//     statsObj.sorterSendReady = false;
//     statsObj.sorterReady = false;
//     clearInterval(sorterPingInterval);
//     childrenHashMap[params.childId].status = "ERROR";
//   });

//   srt.on("exit", function sorterExit(code){
//     console.log(chalkError(getTimeStamp()
//       + " | *** SORTER CHILD EXIT ***"
//       + " | EXIT CODE: " + code
//     ));
//     statsObj.sorterSendReady = false;
//     statsObj.sorterReady = false;
//     clearInterval(sorterPingInterval);
//     childrenHashMap[params.childId].status = "EXIT";
//   });

//   srt.on("close", function sorterClose(code){
//     console.log(chalkError(getTimeStamp()
//       + " | *** SORTER CHILD CLOSE ***"
//       + " | EXIT CODE: " + code
//     ));
//     statsObj.sorterSendReady = false;
//     statsObj.sorterReady = false;
//     clearInterval(sorterPingInterval);
//     childrenHashMap[params.childId].status = "CLOSE";
//   });

//   childrenHashMap[params.childId].child = srt;

//   statsObj.sorterReady = true;

//   srt.send({
//     op: "INIT",
//     title: "wa_node_sorter",
//     verbose: false
//   }, function sorterMessageRxError(err){
//     if (err) {
//       console.log(chalkError("*** SORTER CHILD SEND ERROR"
//         + " | " + err
//       ));
//       statsObj.sorterSendReady = false;
//       statsObj.sorterReady = false;
//       clearInterval(sorterPingInterval);
//       childrenHashMap[params.childId].status = "ERROR";
//     }
//     else {
//       statsObj.sorterSendReady = true;
//       statsObj.sorterReady = true;
//       childrenHashMap[params.childId].status = "INIT";
//       clearInterval(sorterPingInterval);
//       setTimeout(function(){
//         initSorterPingInterval(DEFAULT_PING_INTERVAL);
//       }, 1000);
//     }
//   });

//   if (callback !== undefined) { callback(null, srt); }
// }


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

    // if (updateTimeSeriesCount % RATE_QUEUE_INTERVAL_MODULO === 0){
    if (updateTimeSeriesCount % configuration.rateQueueIntervalModulo === 0){

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
      if (err.code === "ETIMEDOUT") {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: NETWORK TIMEOUT:  " 
          + bestNetworkFolder + "/" + bestRuntimeNetworkFileName
        ));
      }
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: FILE NOT FOUND:  " 
          + bestNetworkFolder + "/" + bestRuntimeNetworkFileName
        ));
      }
      else {
        console.log(chalkError("*** LOAD BEST NETWORK ERROR: " + err
          + bestNetworkFolder + "/" + bestRuntimeNetworkFileName
        ));
      }

      console.log(err);
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

          if (bestNetworkObj 
            && (parserChild !== undefined) 
            && (statsObj.previousBestNetworkId !== bestNetworkObj.networkId)) {

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

function loadAllConfigFiles(callback){

  statsObj.status = "LOAD CONFIG";

  async.series({

    defaultConfig: function(cb) {
      loadConfigFile({folder: dropboxConfigDefaultFolder, file: dropboxConfigDefaultFile}, function(err, defaultConfig){

        if (err) {
          console.log(chalkAlert("WAS | ERROR LOADED DEFAULT CONFIG " + dropboxConfigDefaultFolder + "/" + dropboxConfigDefaultFile));
          console.log(chalkAlert("WAS | ERROR LOADED DEFAULT CONFIG " + err));
          return cb(err);
        }

        if (defaultConfig) {

          defaultConfiguration = defaultConfig;

          console.log(chalkAlert("WAS | +++ RELOADED DEFAULT CONFIG " + dropboxConfigDefaultFolder + "/" + dropboxConfigDefaultFile));

          cb();
        }
        else {
          cb();
        }

      });
    },

    hostConfig: function(cb){
      loadConfigFile({folder: dropboxConfigHostFolder, file: dropboxConfigHostFile}, function(err, hostConfig){

        if (err) {
          console.log(chalkAlert("WAS | ERROR LOADED HOST CONFIG " + dropboxConfigHostFolder + "/" + dropboxConfigHostFile));
          console.log(chalkAlert("WAS | ERROR LOADED HOST CONFIG " + err));
          return cb(err);
        }

        if (hostConfig) {

          hostConfiguration = hostConfig;

          console.log(chalkAlert("WAS | +++ RELOADED HOST CONFIG " + dropboxConfigHostFolder + "/" + dropboxConfigHostFile));

          cb();
        }
        else {
          cb();
        }

      });
    }

  }, function(err, results) {

    if (err) {
      console.log(chalkError("LOAD ALL CONFIG FILES ERROR: " + err));
      return callback(err);
    }

    let defaultAndHostConfig = merge(defaultConfiguration, hostConfiguration); // host settings override defaults
    let tempConfig = merge(configuration, defaultAndHostConfig); // any new settings override existing config

    configuration = tempConfig;

    callback();
  });
}

function initConfig(){

  console.log(chalk.bold.black("INIT CONFIG"));

  loadAllConfigFiles(function(err0){
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

  // const loadConfigFileParams = {
  //   folder: dropboxConfigDefaultFolder,
  //   file: dropboxConfigDefaultFile
  // };



  // loadConfigFile(loadConfigFileParams, function(err0){

  //   if (err0) {
  //     console.log(chalkError("*** LOAD CONFIGURATION FILE ERROR: " + err0));
  //     quit("LOAD CONFIGURATION FILE ERROR");
  //     return;
  //   }

  //   if (statsObj.commandLineArgsLoaded) {
  //     debug(chalkLog("... SKIP LOAD COMMAND LINE ARGS | ALREADY LOADED"));
  //     return;
  //   }
    

  //   loadCommandLineArgs(function(err1, results){

  //     if (err1) {
  //       console.log(chalkError("*** LOAD COMMAND LINE ARGS ERROR: " + err1));
  //       quit("LOAD COMMAND LINE ARGS ERROR");
  //       return;
  //     }

  //     const configArgs = Object.keys(configuration);

  //     configArgs.forEach(function(arg){
  //       if (_.isObject(configuration[arg])) {
  //         console.log(chalkLog("WA | _FINAL CONFIG | " + arg + ": " + jsonPrint(configuration[arg])));
  //       }
  //       else {
  //         console.log(chalkLog("WA | _FINAL CONFIG | " + arg + ": " + configuration[arg]));
  //       }
  //     });
      
  //     statsObj.commandLineArgsLoaded = true;

  //   });
  // });
}

function initLoadBestNetworkInterval(interval){
  clearInterval(loadBestNetworkInterval);
  loadBestRuntimeNetwork();
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

              Object.keys(results.obj).forEach(function(nodeId){
                categorizedUserHashMap.set(nodeId, results.obj[nodeId]);
              });

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

  configuration.processName = process.env.PROCESS_NAME || "node_wordAssoServer";
  configuration.verbose = process.env.VERBOSE || false ;
  configuration.quitOnError = process.env.QUIT_ON_ERROR || false ;
  configuration.enableStdin = process.env.ENABLE_STDIN || true ;

  debug(chalkTwitter("THREECEE USERS\n" + jsonPrint(configuration.threeceeUsers)));

  configuration.threeceeUsers.forEach(function(user){
    threeceeTwitter[user] = {};
    threeceeTwitter[user].twit = {};
    threeceeTwitter[user].ready = false;
    threeceeTwitter[user].status = "UNCONFIGURED";
    threeceeTwitter[user].error = false;
    threeceeTwitter[user].twitterCredentialErrorFlag = false;
    threeceeTwitter[user].twitterRateLimitException = false;
    threeceeTwitter[user].twitterRateLimitExceptionFlag = false;
    threeceeTwitter[user].twitterRateLimitResetAt = false;

    debug(chalkTwitter("THREECEE USER @" + user + "\n" + jsonPrint(threeceeTwitter[user])));
  });

  initConfig();

  if (!statsObj.internetReady) { 
    initInternetCheckInterval(ONE_MINUTE);
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

let updateUserSetsInterval;
let updateUserSetsIntervalReady = true;

function initUpdateUserSetsInterval(interval){

  console.log(chalk.bold.black("INIT USER SETS INTERVAL"
    + " | " + msToTime(interval)
  ));

  updateUserSetsInterval = setInterval(function() {

    uncategorizedManualUserArray = [...uncategorizedManualUserSet];
    statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

    if (updateUserSetsIntervalReady && (uncategorizedManualUserArray.length < 10)) {

      updateUserSetsIntervalReady = false;

      updateUserSets(function(){

        updateUserSetsIntervalReady = true;

      });

    }

  }, interval);
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

      if (configuration.verbose)  { console.log(chalkLog("WA | FOUND " + childArray.length + " CHILDREN")); }
      
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

    if (statsObj.twitNotReadyWarning) { statsObj.twitNotReadyWarning = false; }

    statsUpdated += 1;

  }, interval);
}

function initThreeceeTwitterUsers(params, callback){

  const threeceeUsers = params.threeceeUsers;

  console.log(chalkTwitter("INIT THREECEE TWITTER USERS\n" + jsonPrint(threeceeUsers)));

  async.eachSeries(threeceeUsers, function(user, cb){

    console.log(chalkTwitter("LOADING TWITTER CONFIG | @" + user));

    const configFile = user + ".json";

    loadFile(
      dropboxConfigTwitterFolder, 
      configFile, 
      function initTwit(err, twitterConfig){
        if (err) {

          if (err.code === "ENOTFOUND") {
            console.log(chalkError("*** LOAD TWITTER CONFIG ERROR: FILE NOT FOUND"
              + " | " + dropboxConfigTwitterFolder + "/" + configFile
            ));
          }
          else {
            console.log(chalkError("*** LOAD TWITTER CONFIG ERROR: " + err));
          }

          threeceeTwitter[user].error = "CONFIG LOAD ERROR: " + err;
          threeceeTwitter[user].ready = false;
          threeceeTwitter[user].twit = false;
          threeceeTwitter[user].status = false;

          cb();
        }
        else {
          console.log(chalkTwitter("LOADED TWITTER CONFIG"
            + " | 3C @" + user
            + " | " + dropboxConfigTwitterFolder + "/" + configFile
            + "\nCONFIG\n" + jsonPrint(twitterConfig)
          ));

          threeceeTwitter[user].config = {};
          threeceeTwitter[user].config = twitterConfig;

          // threeceeTwitter[user].twit = new Twit(twitterConfig);
          threeceeTwitter[user].twit = new Twit({
            consumer_key: twitterConfig.consumer_key, 
            consumer_secret:twitterConfig.consumer_secret,
            app_only_auth: true
          });
          // app_only_auth
          threeceeTwitter[user].ready = true;
          threeceeTwitter[user].status = false;
          threeceeTwitter[user].error = false;
          statsObj.threeceeUsersConfiguredFlag = true;

          cb();
        }
      }
    );
  }, function(){


    getCurrentThreeceeUser(function(currentThreeceeUser){

      console.log(chalkInfo("CURRENT 3C TWITTER USER: @" + currentThreeceeUser));

      if (callback !== undefined) { callback(); }
    });

  });
}

function initCategoryHashmapsInterval(interval){

  console.log(chalk.bold.black("INIT CATEGORY HASHMAP INTERVAL"
    + " | " + msToTime(interval)
  ));

  clearInterval(categoryHashmapsInterval);

  categoryHashmapsInterval = setInterval(function updateMemStats() {

    if (statsObj.dbConnectionReady && initCategoryHashmapsReady) {

      debug(chalkInfo("--- IN CATEGORY HASHMAP INTERVAL"
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

function twitterGetUserUpdateDb(user, callback){

  if (!user.userId && !user.nodeId && !user.screenName) { return callback("NO USER PROPS", null); }

  getCurrentThreeceeUser(function(currentThreeceeUser){

    if ( currentThreeceeUser
      && (threeceeTwitter[currentThreeceeUser] !== undefined)
      && threeceeTwitter[currentThreeceeUser].ready) {

      printUserObj("+++ UNCATEGORIZED USER | GET USER TWITTER DATA", user);

      let twitQuery = {};

      twitQuery.include_entities = true;

      if (user.nodeId !== undefined) { twitQuery.user_id = user.nodeId; }
      if (user.userId !== undefined) { twitQuery.user_id = user.userId; }
      if (user.screenName !== undefined) { twitQuery.screen_name = user.screenName; }

      threeceeTwitter[currentThreeceeUser].twit.get("users/show", twitQuery, function usersShow (err, rawUser, response){

        if (err) {
          console.log(chalkError("ERROR users/show rawUser | @" + user.screenName + " | " + err + "\ntwitQuery\n" + jsonPrint(twitQuery)));
          return callback("NO TWITTER UPDATE", user);
        }

        if (rawUser && (rawUser !== undefined)) {

          userServerController.convertRawUser({user:rawUser}, function(err, cUser){

            if (err) {
              console.log(chalkError("*** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
              return callback("RAW USER", rawUser);
            }

            printUserObj("FOUND users/show rawUser", cUser);

            user.userId = cUser.userId;
            user.nodeId = cUser.nodeId;
            user.name = cUser.name;
            user.description = cUser.description;
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
                return callback("NO DB UPDATE", user);
              }

              console.log(chalk.blue("UPDATED updatedUser"
                + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
                + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
                + "\n" + printUser({user:updatedUser})
              ));

              callback(null, updatedUser);
            });
          });
        }
        else {
          console.log(chalkTwitter("NOT FOUND users/show data"));
          callback("TWITTER NOT FOUND", user);
        }
      });
    }
    else if (threeceeTwitter[currentThreeceeUser] !== undefined) {
      console.log(chalkTwitter("XXX TWITTER_SEARCH_NODE USER FAIL"
        + " | 3C @" + currentThreeceeUser
        + " | 3C READY: " + threeceeTwitter[currentThreeceeUser].ready
        + "\n" + printUser({user:user})
      ));
      callback("TWITTER NOT READY", user);
    }
    else {
      console.log(chalkTwitter("XXX TWITTER_SEARCH_NODE USER FAIL"
        + " | threeceeTwitter[currentThreeceeUser] UNDEFINED"
        + " | 3C @" + currentThreeceeUser
        + "\n" + printUser({user:user})
      ));

      if (user.nodeId){

        let nCacheObj = nodeCache.get(user.nodeId);

        if (nCacheObj) {
          user.mentions = Math.max(user.mentions, nCacheObj.mentions);
          user.setMentions = true;
        }
      }

      userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

        if (err) {
          console.log(chalkError("findOneUser ERROR: " + err));
          return callback("NO DB OR TWITTER UPDATE", user);
        }

        console.log(chalk.blue("UPDATED updatedUser"
          + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
          + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
          + "\n" + printUser({user:updatedUser})
        ));

        callback("DB NO TWITTER UPDATE", updatedUser);

      });
    }
  });
}

function twitterSearchUserNode(searchQuery, callback){

  User.findOne(searchQuery, function(err, user){

    if (err) {
      console.log(chalkError("TWITTER SEARCH NODE USER ERROR"
        + "searchQuery\n" + jsonPrint(searchQuery)
        + "ERROR\n" + jsonPrint(err)
      ));
      return callback("DB ERROR", null);
    }
    
    if (user) {

      printUserObj("DB> FOUND USER", user);

      twitterGetUserUpdateDb({user:user}, function(err, updatedUser){
        if (err) { return  callback(err, user); }
        if (updatedUser) { return callback(err, updatedUser); }
        callback(err, user);
      });

    }
    else {

      console.log(chalkAlert("TWITTER SEARCH DB USER NOT FOUND"
        + "\nsearchQuery\n" + jsonPrint(searchQuery)
      ));

      twitterGetUserUpdateDb(searchQuery, function(err, updatedUser){
        if (err) { return  callback(err, user); }
        if (updatedUser) { return callback(err, updatedUser); }
        callback(err, user);
      });


    }

  });
}

function twitterSearchNode(params, callback) {

  let searchNode = params.searchNode.toLowerCase().trim();
  let searchNodeHashtag;
  let searchNodeUser;
  let searchQuery = {};

  console.log(chalkSocket("TWITTER_SEARCH_NODE"
    + " | " + getTimeStamp()
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

        params.socket.emit("SET_TWITTER_HASHTAG", hashtag);

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

          params.socket.emit("SET_TWITTER_HASHTAG", newHt);
        });
      }
      callback(err, hashtag);
    });
  }
  else if (searchNode.startsWith("@")) {

    searchNodeUser = { screenName: searchNode.substring(1) };

    if (searchNodeUser.screenName === "?") {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];
      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

      console.log(chalkSocket("TWITTER_SEARCH_NODE"
        + "[ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
        + " | " + getTimeStamp()
        + " | SEARCH UNCATEGORIZED USER"
      ));


      if (uncategorizedManualUserArray.length > 0) {

        const uncategorizedUserId = uncategorizedManualUserArray.shift();
        statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

        console.log(chalkSocket("TWITTER_SEARCH_NODE"
          + "[ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
          + " | " + getTimeStamp()
          + " | SEARCH UNCATEGORIZED USER"
          + " | UID: " + uncategorizedUserId
        ));

        searchQuery = {nodeId: uncategorizedUserId};

        twitterSearchUserNode(searchQuery, function(err, user){
          if (user) {
            params.socket.emit("SET_TWITTER_USER", user);
            uncategorizedManualUserSet.delete(user.nodeId);
          }
          callback(err, user);
        });
      }
      else {
        callback(null, null);
      }
    }      
    else if (searchNodeUser.screenName === "?mm") {

      console.log(chalkSocket("TWITTER_SEARCH_NODE"
        + " | " + getTimeStamp()
        + " | SEARCH MISMATCHED USER"
      ));

      mismatchUserArray = _.shuffle([...mismatchUserSet]);

      if (mismatchUserArray.length > 0) {

        const mismatchedUserId = mismatchUserArray.shift();

        searchQuery = {nodeId: mismatchedUserId};

        twitterSearchUserNode(searchQuery, function(err, user){
          if (user) {
            params.socket.emit("SET_TWITTER_USER", user);
          }
          callback(err, user);
        });
      }
      else {
        callback(null, null);
      }
    }
    else {
      console.log(chalkInfo("SEARCH FOR SPECIFIC USER | " + jsonPrint(searchNodeUser)));
      nodeSearchType = "USER_SPECIFIC";

      twitterSearchUserNode(searchNodeUser, function(err, user){
        if (user) {
          params.socket.emit("SET_TWITTER_USER", user);
        }
        callback(err, user);
      });

    }

  }
}

function initTwitterSearchNodeQueueInterval(interval){

  let searchNodeParams;
  twitterSearchNodeQueueReady = true;

  console.log(chalk.bold.black("INIT TWITTER SEARCH NODE QUEUE INTERVAL: " + msToTime(interval)));

  clearInterval(twitterSearchNodeQueueInterval);

  twitterSearchNodeQueueInterval = setInterval(function txSearchNodeQueue () {

    if (twitterSearchNodeQueueReady && (twitterSearchNodeQueue.length > 0)) {

      twitterSearchNodeQueueReady = false;

      searchNodeParams = twitterSearchNodeQueue.shift();

      twitterSearchNode(searchNodeParams, function(err){
        twitterSearchNodeQueueReady = true;
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

    initDropboxSync();
    initSaveFileQueue(configuration);
    initIgnoreWordsHashMap();
    initThreeceeTwitterUsers({threeceeUsers: configuration.threeceeUsers});
    initTransmitNodeQueueInterval(configuration.transmitNodeQueueInterval);
    initCategoryHashmapsInterval(configuration.categoryHashmapsUpdateInterval);
    initRateQinterval(configuration.rateQueueInterval);
    initTwitterRxQueueInterval(configuration.twitterRxQueueInterval);
    initTweetParserMessageRxQueueInterval(configuration.tweetParserMessageRxQueueInterval);
    initTwitterSearchNodeQueueInterval(configuration.twitterSearchNodeQueueInterval);
    initSorterMessageRxQueueInterval(configuration.sorterMessageRxQueueInterval);

    console.log(chalkInfo("NODE CACHE TTL: " + nodeCacheTtl + " SECONDS"));

    console.log(chalk.blue("CONFIGURATION\n" + jsonPrint(configuration)));

    if (!configuration.metrics.nodeMeterEnabled) {
      console.log(chalkAlert("*** NODE RATE METER DISABLED ***"));
    }

    statsObj.configuration = configuration;

    initKeySortInterval(configuration.keySortInterval);

    // initSorterChild({childId: DEFAULT_SORTER_CHILD_ID}, function(err, srt){
    //   if (err) { 
    //     console.log(chalkError("INIT SORTER CHILD ERROR: " + err));
    //   }
    //   else {
    //     sorterChild = srt;
    //   }
    // });

    initTssChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, tss){
      if (err) { 
        console.log(chalkError("INIT TSS CHILD ERROR: " + err));
      }
      else {
        tssChild = tss;
      }
    });

    initTweetParser({childId: DEFAULT_TWEET_PARSER_CHILD_ID}, function(err, twp){
      if (err) { 
        console.log(chalkError("INIT TWEET PARSER CHILD ERROR: " + err));
      }
      else {
        parserChild = twp;
      }
    });

    initStatsInterval(configuration.statsUpdateInterval);
    initCheckTwitterRateLimitInterval(configuration.checkTwitterRateLimitInterval);

    slackPostMessage(slackChannel, "\n*INIT* | " + hostname + "\n");

  }
});

module.exports = {
  app: app,
  io: io,
  http: httpServer
};