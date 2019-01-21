/*jslint node: true */
/*jshint sub:true*/
"use strict";

let saveSampleTweetFlag = true;

const os = require("os");
const kill = require("tree-kill");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const TWITTER_WEBHOOK_URL = "/webhooks/twitter";

const TWITTER_AUTH_CALLBACK_URL = "https://word.threeceelabs.com/auth/twitter/callback";
// const TWITTER_AUTH_CALLBACK_URL = "http://localhost:9997/auth/twitter/callback";

const dbAppName = "WAS_" + process.pid;

global.dbConnection = false;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

global.wordAssoDb = require("@threeceelabs/mongoose-twitter");

global.Emoji;
global.Hashtag;
global.Location;
global.Media;
global.NetworkInputs;
global.NeuralNetwork;
global.Place;
global.Tweet;
global.Url;
global.User;
global.Word;


let HashtagServerController;
let UserServerController;

let hashtagServerController;
let userServerController;

let hashtagServerControllerReady = false;
let userServerControllerReady = false;


let neuralNetworkChangeStream;
let userChangeStream;

let userFollowingCursor;

let initCategoryHashmapsReady = true;
let heartbeatInterval;

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const DEFAULT_INFO_TWITTER_USER = "threecee";
let infoTwitterUserObj = {};

const DEFAULT_GEOCODE_ENABLED = false;

const DEFAULT_FILTER_DUPLICATE_TWEETS = true;
const DEFAULT_AUTO_FOLLOW = true;
const DEFAULT_FORCE_FOLLOW = false;
const DEFAULT_FORCE_IMAGE_ANALYSIS = false;
const DEFAULT_ENABLE_IMAGE_ANALYSIS = true;

const DEFAULT_SAVE_FILE_QUEUE_INTERVAL = 5*ONE_SECOND;
const DEFAULT_CHECK_TWITTER_RATE_LIMIT_INTERVAL = ONE_MINUTE;

const DEFAULT_TWITTER_SEARCH_NODE_QUEUE_INTERVAL = 100;

const DEFAULT_MAX_TWIITER_SHOW_USER_TIMEOUT = 30*ONE_MINUTE;

const DEFAULT_CONFIG_INIT_INTERVAL = ONE_MINUTE;

const DEFAULT_TEST_INTERNET_CONNECTION_URL = "www.google.com";

const DEFAULT_FIND_CAT_USER_CURSOR_LIMIT = 100;
const DEFAULT_FIND_CAT_WORD_CURSOR_LIMIT = 100;
const DEFAULT_FIND_CAT_HASHTAG_CURSOR_LIMIT = 100;

const DEFAULT_CURSOR_BATCH_SIZE = 100;

const DEFAULT_THREECEE_USERS = ["altthreecee00", "altthreecee01", "altthreecee02", "altthreecee03", "altthreecee04", "altthreecee05"];
const DEFAULT_THREECEE_INFO_USERS = ["threecee", "threeceeinfo", "ninjathreecee"];

const DEFAULT_CHILD_ID_PREFIX = "wa_node_child_";

const DEFAULT_DBU_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "dbu";
const DEFAULT_TFE_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "tfe";
const DEFAULT_TWP_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "twp";
const DEFAULT_TSS_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "tss";

let dbuChild;
let tfeChild;
let parserChild;

let tssChildren = {};

DEFAULT_THREECEE_USERS.forEach(function(threeceeUser){
  tssChildren[threeceeUser] = {};
  tssChildren[threeceeUser].childId = DEFAULT_TSS_CHILD_ID + "_" + threeceeUser.toLowerCase();
});


const DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER = "altthreecee05";
const DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER_FILE = DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER + ".json";

const DEFAULT_TWITTER_CONFIG_THREECEE = "threecee";
const DEFAULT_TWITTER_CONFIG_THREECEE_FILE = DEFAULT_TWITTER_CONFIG_THREECEE + ".json";

const DEFAULT_INTERVAL = 10;
const DEFAULT_PING_INTERVAL = ONE_MINUTE;
const TWP_PING_INTERVAL = 10*ONE_MINUTE;
const TSS_PING_INTERVAL = 10*ONE_MINUTE;
const DBU_PING_INTERVAL = 10*ONE_MINUTE;
const TFE_PING_INTERVAL = 10*ONE_MINUTE;
const DEFAULT_DROPBOX_LIST_FOLDER_LIMIT = 50;
const DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT = 1*ONE_SECOND;
const DEFAULT_MIN_FOLLOWERS_AUTO = 10000;
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

const TWEET_ID_CACHE_DEFAULT_TTL = 20;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

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
const chalkBlueBold = chalk.blue.bold;

const btoa = require("btoa");
const crypto = require("crypto");
const objectPath = require("object-path");
const util = require("util");
const request = require("request");
const _ = require("lodash");
const touch = require("touch");
const merge = require("deepmerge");
const Measured = require("measured");
const omit = require("object.omit");
const pick = require("object.pick");
const config = require("./config/config");
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

const request_options = {
  url: "https://api.twitter.com/oauth2/token",
  method: "POST",
  auth: {
    user: "ex0jSXayxMOjNm4DZIiic9Nc0",
    pass: "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa"
  },
  form: {
    "grant_type": "client_credentials"
  }
};

function bearerTokenRequest(request_options){
  return new Promise(function(resolve, reject){
    request(request_options, function(error, response) {
      if (error) {
        reject(error);
      }
      else {

        var json_body = JSON.parse(response.body);

        console.log(chalk.green("WAS | TWITTER BEARER TOKEN | " + json_body.access_token));

        let twitter_bearer_token = json_body.access_token;

        // request options
        var req_options = {
          url: 'https://api.twitter.com/1.1/account_activity/all/dev/webhooks.json?url=https%3A%2F%word.threeceelabs.com%2Fwebhooks%2Ftwitter',
          method: "POST",
          resolveWithFullResponse: true,
          auth: { "bearer" : twitter_bearer_token }
        };

        // PUT request to retrieve webhook config
        request(req_options, function(error, response) {
          if (error) {
            console.log(chalkError("WAS | *** TWITTER WEBHOOK CONFIG REQ ERROR: " + error));
            return reject(twitter_bearer_token);
          }
          console.log(chalk.green("WAS | +++ TWITTER WEBHOOK VALID"));
          resolve(twitter_bearer_token);
        });
      }
    });
  });
}

function addAccountActivitySubscription(params){

  return new Promise(function(resolve, reject){

    let options = {
      url: "https://api.twitter.com/1.1/account_activity/all/dev/subscriptions.json",
      method: "POST",
      resolveWithFullResponse: true,
      oauth: {
        consumer_key: "ex0jSXayxMOjNm4DZIiic9Nc0",
        consumer_secret: "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa",
        token: "14607119-1VaZOqc1sgWOyANgO4jbD9SF7TzFhJvkiujQtkT4J",
        token_secret: "ZmvfjYU0z0wgDslyESZQLIHPr4pcCizflg5Y2IxhvwVVf"
      } 
    };

    request(options, function(error, response) {

      if (error) {
        reject(error);
      }
      else {
        if (response.statusCode == 204) {
          console.log(chalk.green("WAS | +++ TWITTER WEBHOOK SUBSCRIPTION ADDED"));
          resolve(response.statusCode);
        }
        else {
          console.log(chalkAlert("WAS | --- TWITTER WEBHOOK SUBSCRIPTION NOT ADDED: STATUS: " + response.statusCode));
          resolve(response.statusCode);
        }
      }
    });
  });
}


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

const threeceeConfig = {
  consumer_key: "ex0jSXayxMOjNm4DZIiic9Nc0",
  consumer_secret: "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa",
  token: "14607119-S5EIEw89NSC462IkX4GWT67K1zWzoLzuZF7wiurku",
  token_secret: "3NI3s4sTILiqBilgEDBSlC6oSJYXcdLQP7lXp58TQMk0A"
};

const EventEmitter2 = require("eventemitter2").EventEmitter2;

const fetch = require("isomorphic-fetch"); // or another library of choice.
const Dropbox = require("dropbox").Dropbox;

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

statsObj.dbuChildReady = false;
statsObj.tfeChildReady = false;

statsObj.tssChildren = {};

DEFAULT_THREECEE_USERS.forEach(function(threeceeUser){
  statsObj.tssChildren[threeceeUser] = {};
  statsObj.tssChildren[threeceeUser].ready = false;
});

let previousConfiguration = {};
let configuration = {};
let defaultConfiguration = {}; // general configuration
let hostConfiguration = {}; // host-specific configuration

configuration.verbose = false;
configuration.maxQueue = DEFAULT_MAX_QUEUE;
configuration.filterDuplicateTweets = DEFAULT_FILTER_DUPLICATE_TWEETS;
configuration.forceFollow = DEFAULT_FORCE_FOLLOW;
configuration.autoFollow = DEFAULT_AUTO_FOLLOW;
configuration.enableImageAnalysis = DEFAULT_ENABLE_IMAGE_ANALYSIS;
configuration.forceImageAnalysis = DEFAULT_FORCE_IMAGE_ANALYSIS;
configuration.geoCodeEnabled = DEFAULT_GEOCODE_ENABLED;

configuration.twitterThreeceeAutoFollowUser = DEFAULT_TWITTER_THREECEE_AUTO_FOLLOW_USER;

configuration.threeceeInfoUsersArray = DEFAULT_THREECEE_INFO_USERS;

configuration.dropboxListFolderLimit = DEFAULT_DROPBOX_LIST_FOLDER_LIMIT;
configuration.dropboxWebhookChangeTimeout = DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT;

configuration.tweetParserMessageRxQueueInterval = DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL;
configuration.tweetParserInterval = DEFAULT_TWEET_PARSER_INTERVAL;
configuration.sorterMessageRxQueueInterval = DEFAULT_SORTER_INTERVAL;
configuration.transmitNodeQueueInterval = DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL;
configuration.rateQueueInterval = DEFAULT_RATE_QUEUE_INTERVAL;
configuration.rateQueueIntervalModulo = DEFAULT_RATE_QUEUE_INTERVAL_MODULO;
configuration.statsUpdateInterval = DEFAULT_STATS_UPDATE_INTERVAL;
// configuration.checkTwitterRateLimitInterval = DEFAULT_CHECK_TWITTER_RATE_LIMIT_INTERVAL;

configuration.DROPBOX = {};
configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY ;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
configuration.DROPBOX.DROPBOX_WAS_CONFIG_FILE = process.env.DROPBOX_CONFIG_FILE || "wordAssoServerConfig.json";
configuration.DROPBOX.DROPBOX_WAS_STATS_FILE = process.env.DROPBOX_STATS_FILE || "wordAssoServerStats.json";

configuration.twitterRxQueueInterval = DEFAULT_TWITTER_RX_QUEUE_INTERVAL;
configuration.twitterSearchNodeQueueInterval = DEFAULT_TWITTER_SEARCH_NODE_QUEUE_INTERVAL;
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


// global.dbConnection = false;

const Twit = require(__dirname + "/js/libs/twit");

let threeceeTwitter = {};
threeceeTwitter.config = {};

let threeceeInfoTwitter = {};
threeceeInfoTwitter.config = {};

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

const enableStdin = { name: "enableStdin", alias: "S", type: Boolean };
const quitOnComplete = { name: "quitOnComplete", alias: "q", type: Boolean };
const quitOnError = { name: "quitOnError", alias: "Q", type: Boolean };
const verbose = { name: "verbose", alias: "v", type: Boolean };
const testMode = { name: "testMode", alias: "X", type: Boolean };

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
    console.log(chalkAlert("WAS | *** getTimeStamp INVALID DATE: " + inputTime));
    return null;
  }
}

function quit(message) {

  console.log(chalkAlert("\nWAS | ... QUITTING ... " + getTimeStamp()));

  if (userFollowingCursor !== undefined) { userFollowingCursor.close(); }
  if (neuralNetworkChangeStream !== undefined) { neuralNetworkChangeStream.close(); }
  if (userChangeStream !== undefined) { userChangeStream.close(); }

  clearInterval(updateUserSetsInterval);
  clearInterval(dbConnectInterval);
  clearInterval(nodeCacheInterval);
  clearInterval(saveFileQueueInterval);
  clearInterval(heartbeatInterval);
  clearInterval(updateTrendsInterval);
  clearInterval(transmitNodeQueueInterval);
  clearInterval(internetCheckInterval);
  clearInterval(tweetRxQueueInterval);
  clearInterval(tweetParserMessageRxQueueInterval);
  clearInterval(sorterMessageRxQueueInterval);
  clearInterval(keySortInterval);
  clearInterval(dbuPingInterval);
  clearInterval(tfePingInterval);
  clearInterval(tssPingInterval);
  clearInterval(tweetParserPingInterval);
  clearInterval(updateMetricsInterval);
  clearInterval(statsInterval);
  clearInterval(memStatsInterval);
  clearInterval(categoryHashmapsInterval);
  clearInterval(twitterSearchNodeQueueInterval);

  let msg = "";
  if (message) {msg = message;}

  console.log(chalkAlert("WAS | ... QUITTING ..."));
  console.log(chalkAlert("WAS | QUIT MESSAGE: " + msg));
  console.error(chalkAlert("WAS | QUIT MESSAGE: " + msg));

  if (global.dbConnection) {

    global.dbConnection.close(function () {

      statsObj.dbConnectionReady = false;
      dbConnectionReady = false;

      console.log(chalkAlert(
            "WAS | =========================="
        + "\nWAS | MONGO DB CONNECTION CLOSED"
        + "\nWAS | =========================="
      ));

    });

  }

  setTimeout(function() {

    process.exit();

  }, 5000);
}

const commandLineConfig = commandLineArgs(optionDefinitions);
console.log(chalkInfo("WAS | COMMAND LINE CONFIG\nWAS | " + jsonPrint(commandLineConfig)));

if (Object.keys(commandLineConfig).includes("help")) {
  console.log(chalkInfo("WAS | optionDefinitions\n" + jsonPrint(optionDefinitions)));
  quit("help");
}

let adminNameSpace;
let utilNameSpace;
let userNameSpace;
let viewNameSpace;

let ignoredUserFile = "ignoredUser.json";
let unfollowableUserFile = "unfollowableUser.json";
let followableSearchTermFile = "followableSearchTerm.txt";

let pendingFollowSet = new Set();

let followableUserSet = new Set();
let categorizeableUserSet = new Set();

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
followableSearchTermSet.add("aoc");
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

followableSearchTermSet.add("🌊");
followableSearchTermSet.add("fbr");
followableSearchTermSet.add("bluewave");
followableSearchTermSet.add("bluetsunami");
followableSearchTermSet.add("liberal");
followableSearchTermSet.add("democrat");
followableSearchTermSet.add("congress");
followableSearchTermSet.add("republican");
followableSearchTermSet.add("conservative");
followableSearchTermSet.add("livesmatter");

followableSearchTermSet.add("specialcounsel");
followableSearchTermSet.add("special counsel");

let followableSearchTermsArray = Array.from(followableSearchTermSet);
let followableSearchTermString = followableSearchTermsArray.join("|");
let followableRegEx = new RegExp(followableSearchTermString, "gi");

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
  category: 1,
  categoryAuto: 1,
  followersCount: 1,
  following: 1,
  friendsCount: 1,
  isTopTerm: 1,
  lastTweetId: 1,
  mentions: 1,
  name: 1,
  lang: 1,
  nodeId: 1,
  nodeType: 1,
  rate: 1,
  screenName: 1,
  screenNameLower: 1,
  statusesCount: 1,
  statusId: 1,
  threeceeFollowing: 1
};

const fieldsTransmitKeys = Object.keys(fieldsTransmit);

let childrenHashMap = {};

let bestNetworkObj = false;
let maxInputHashMap = false;
let normalization = false;


let twitterUserThreecee = {
    nodeId : "14607119",
    // userId : "14607119",
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

let followedUserSet = new Set();
let unfollowableUserSet = new Set();
let ignoredUserSet = new Set();

process.title = "node_wordAssoServer";
console.log(chalkBlue("\n\nWAS | ============== START ==============\n\n"));

console.log(chalkBlue("WAS | PROCESS PID:   " + process.pid));
console.log(chalkBlue("WAS | PROCESS TITLE: " + process.title));
console.log(chalkBlue("WAS | ENVIRONMENT:   " + process.env.NODE_ENV));

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

let dbuPingInterval;
let dbuPingSent = false;
let dbuPongReceived = false;
let dbuPingId = false;

let tssPingInterval;
let tssPingSent = false;
let tssPongReceived = false;
let tssPingId = false;

let tfePingInterval;
let tfePingSent = false;
let tfePongReceived = false;
let tfePingId = false;

let tweetParserPingInterval;
let tweetParserPingSent = false;
let tweetParserPongReceived = false;
let tweetParserPingId = false;


let categoryHashmapsInterval;
let statsInterval;

let categorizedManualUserSet = new Set();
let categorizedAutoUserSet = new Set();

let uncategorizedManualUserSet = new Set();
let uncategorizedAutoUserSet = new Set();

let uncategorizedManualUserArray = [];
let uncategorizedAutoUserArray = [];

let matchUserSet = new Set();
let mismatchUserSet = new Set();
let mismatchUserArray = [];


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

let dropboxConfigDefaultFile = "default_" + configuration.DROPBOX.DROPBOX_WAS_CONFIG_FILE;
let dropboxConfigHostFile = hostname + "_" + configuration.DROPBOX.DROPBOX_WAS_CONFIG_FILE;

let childPidFolderLocal = (hostname === "google") 
  ? "/home/tc/Dropbox/Apps/wordAssociation/config/utility/google/children" 
  : "/Users/tc/Dropbox/Apps/wordAssociation/config/utility/" + hostname + "/children";

let dropboxConfigDefaultTrainingSetsFolder = dropboxConfigDefaultFolder + "/trainingSets";
let trainingSetsUsersFolder = dropboxConfigDefaultTrainingSetsFolder + "/users";

// need local version for "touch"
let trainingSetsUsersFolderLocal = (hostname === "google") 
  ? "/home/tc/Dropbox/Apps/wordAssociation/config/utility/default/trainingSets/users" 
  : "/Users/tc/Dropbox/Apps/wordAssociation/config/utility/default/trainingSets/users";

let usersZipUpdateFlagFile = trainingSetsUsersFolderLocal + "/usersZipUpdateFlag.txt";

let categorizedFolder = dropboxConfigDefaultFolder + "/categorized";
let categorizedUsersFile = "categorizedUsers.json";
let categorizedHashtagsFile = "categorizedHashtags.json";

let statsFolder = "/stats/" + hostname;
let statsFile = "wordAssoServerStats_" + moment().format(tinyDateTimeFormat) + ".json";

let testDataFolder = dropboxConfigDefaultFolder + "/test/testData/tweets";


configuration.dropboxChangeFolderArray = [ 
  bestNetworkFolder, 
  dropboxConfigDefaultFolder, 
  dropboxConfigHostFolder, 
  dropboxConfigTwitterFolder,
  trainingSetsUsersFolder
];

console.log(chalkLog("WAS | DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN));
console.log(chalkLog("WAS | DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY));
console.log(chalkLog("WAS | DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET));

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

    console.log(chalkLog("WAS | filesGetMetadataLocal options\n" + jsonPrint(options)));

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

let dropboxRemoteClient = new Dropbox({ 
  accessToken: configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  fetch: fetch
});

let dropboxLocalClient = {  // offline mode
  filesListFolder: filesListFolderLocal,
  filesUpload: function(){ console.log(chalkInfo("WAS | filesUpload")); },
  filesDownload: function(){ console.log(chalkInfo("WAS | filesDownload")); },
  filesGetMetadata: filesGetMetadataLocal,
  filesDelete: function(){ console.log(chalkInfo("WAS | filesDelete")); }
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

function printUserObj(title, user, chalkFormat) {

  const chlk = chalkFormat || chalkUser;

  user = userDefaults(user);

  console.log(chlk(title
    + " | " + user.userId
    + " | @" + user.screenName
    + " | " + user.name 
    + " | LG " + user.lang
    + " | FW " + user.followersCount
    + " | FD " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + getTimeStamp(user.lastSeen)
    + " | FWG " + user.following 
    + " | 3C " + user.threeceeFollowing 
    + " | LC " + user.location
    + " | C M " + user.category + " A " + user.categoryAuto
  ));
}

function connectDb(){

  return new Promise(function(resolve, reject){

    try {

      statsObj.status = "CONNECTING MONGO DB";

      global.wordAssoDb.connect("WAS_" + process.pid, function(err, db){

        if (err) {
          console.log(chalkError("WAS | *** MONGO DB CONNECTION ERROR: " + err));
          statsObj.status = "MONGO CONNECTION ERROR";
          // slackSendMessage(hostname + " | WAS | " + statsObj.status);
          dbConnectionReady = false;
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("close", function(){
          statsObj.status = "MONGO CLOSED";
          console.error.bind(console, "WAS | *** MONGO DB CONNECTION CLOSED ***\n");
          console.log(chalkAlert("WAS | *** MONGO DB CONNECTION CLOSED ***\n"));
          // slackSendMessage(hostname + " | WAS | " + statsObj.status);
          // db.close();
          dbConnectionReady = false;
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("error", function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "WAS | *** MONGO DB CONNECTION ERROR ***\n");
          console.log(chalkError("WAS | *** MONGO DB CONNECTION ERROR ***\n"));
          // slackSendMessage(hostname + " | WAS | " + statsObj.status);
          db.close();
          dbConnectionReady = false;
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "WAS | *** MONGO DB DISCONNECTED ***\n");
          // slackSendMessage(hostname + " | WAS | " + statsObj.status);
          console.log(chalkAlert("WAS | *** MONGO DB DISCONNECTED ***\n"));
          dbConnectionReady = false;
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
        });

        // dbConnectionReady = true;
        // statsObj.dbConnectionReady = true;

        global.dbConnection = db;

        console.log(chalk.green("WAS | MONGOOSE DEFAULT CONNECTION OPEN"));

        const emojiModel = require("@threeceelabs/mongoose-twitter/models/emoji.server.model");
        const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
        const locationModel = require("@threeceelabs/mongoose-twitter/models/location.server.model");
        const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
        const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
        const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
        const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
        const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
        const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
        const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

        global.Emoji = global.dbConnection.model("Emoji", emojiModel.EmojiSchema);
        global.Hashtag = global.dbConnection.model("Hashtag", hashtagModel.HashtagSchema);
        global.Location = global.dbConnection.model("Location", locationModel.LocationSchema);
        global.Media = global.dbConnection.model("Media", mediaModel.MediaSchema);
        global.NeuralNetwork = global.dbConnection.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
        global.Place = global.dbConnection.model("Place", placeModel.PlaceSchema);
        global.Tweet = global.dbConnection.model("Tweet", tweetModel.TweetSchema);
        global.Url = global.dbConnection.model("Url", urlModel.UrlSchema);
        global.User = global.dbConnection.model("User", userModel.UserSchema);
        global.Word = global.dbConnection.model("Word", wordModel.WordSchema);


        const neuralNetworkCollection = db.collection("neuralnetworks");

        neuralNetworkCollection.countDocuments(function(err, count){
          if (err) { throw Error; }
          console.log(chalkInfo("WAS | NEURAL NETWORKS IN DB: " + count));
        });

        const filterNetwork = {
          "$match": {
            "$or": [{ operationType: "insert" },{ operationType: "delete" },{ operationType: "update" },{ operationType: "replace" }]
          }
        };
        const optionsNetwork = { fullDocument: "updateLookup" };

        neuralNetworkChangeStream = neuralNetworkCollection.watch([filterNetwork], optionsNetwork);

        neuralNetworkChangeStream.on("change", function(change){
          if (change && change.fullDocument) { 
            const nn = networkDefaults(change.fullDocument); 
            printNetworkObj("WAS | --> NN   CHANGE | " +  change.operationType, nn);
          }
          else {
            console.log(chalkLog("WAS | --> NN   CHANGE | " +  change.operationType));
          }
        });

        const sessionId = btoa("threecee");
        console.log(chalk.green("WAS | PASSPORT SESSION ID: " + sessionId ));

        app.use(expressSession({
          sessionId: sessionId,
          secret: "three cee labs 47", 
          resave: false, 
          saveUninitialized: false,
          store: new MongoStore({ mongooseConnection: global.dbConnection })
        }));

        app.use(passport.initialize());
        // app.use(passport.session());

        passport.use(new TwitterStrategy({
            consumerKey: threeceeConfig.consumer_key,
            consumerSecret: threeceeConfig.consumer_secret,
            callbackURL: TWITTER_AUTH_CALLBACK_URL
          },
          function(token, tokenSecret, profile, cb) {

            console.log(chalk.green("WAS | PASSPORT TWITTER AUTH: token:       " + token));
            console.log(chalk.green("WAS | PASSPORT TWITTER AUTH: tokenSecret: " + tokenSecret));
            console.log(chalk.green("WAS | PASSPORT TWITTER AUTH USER | @" + profile.username + " | " + profile.id));

            if (configuration.verbose) { console.log(chalk.green("WAS | PASSPORT TWITTER AUTH\nprofile\n" + jsonPrint(profile))); }

            const rawUser = profile["_json"];

            if (!userServerControllerReady || !statsObj.dbConnectionReady) {
              return cb(new Error("userServerController not ready"), null);
            }

            userServerController.convertRawUser({user:rawUser}, function(err, user){

              if (err) {
                console.log(chalkError("WAS | *** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
                return cb("RAW USER", rawUser);
              }

              printUserObj("WAS | MONGO DB | TWITTER AUTH USER", user);

              userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

                if (err) {
                  console.log(chalkError("WAS | ***findOneUser ERROR: " + err));
                  return cb(err);
                }

                console.log(chalk.blue("WAS | UPDATED updatedUser"
                  + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
                  + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
                  + "\nWAS | " + printUser({user:updatedUser})
                ));


                if (configuration.threeceeInfoUsersArray.includes(updatedUser.screenName)) {
                  if (threeceeInfoTwitter[updatedUser.screenName] === undefined) {
                    threeceeInfoTwitter[updatedUser.screenName] = {};
                  }
                  threeceeInfoTwitter[updatedUser.screenName].twitterAuthorizationErrorFlag = false;
                  threeceeInfoTwitter[updatedUser.screenName].twitterCredentialErrorFlag = false;
                  threeceeInfoTwitter[updatedUser.screenName].twitterErrorFlag = false;
                  threeceeInfoTwitter[updatedUser.screenName].twitterFollowLimit = false;
                  threeceeInfoTwitter[updatedUser.screenName].twitterTokenErrorFlag = false;
                }
                else {

                  threeceeTwitter[updatedUser.screenName].twitterAuthorizationErrorFlag = false;
                  threeceeTwitter[updatedUser.screenName].twitterCredentialErrorFlag = false;
                  threeceeTwitter[updatedUser.screenName].twitterErrorFlag = false;
                  threeceeTwitter[updatedUser.screenName].twitterFollowLimit = false;
                  threeceeTwitter[updatedUser.screenName].twitterTokenErrorFlag = false;

                }

                tssSendAllChildren({
                  op: "USER_AUTHENTICATED",
                  token: token,
                  tokenSecret: tokenSecret,
                  user: updatedUser
                });


                saveFileQueue.push({
                  localFlag: false, 
                  folder: categorizedFolder, 
                  file: categorizedUsersFile, 
                  obj: categorizedUserHashMap.entries()
                });

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

        // passport.use(new LocalStrategy(
        //   function(username, password, done) {

        //     console.log(chalkAlert("WAS | *** LOGIN *** | " + username));

        //     User.findOne({ screenName: username.toLowerCase() }, function (err, user) {
        //       if (err) { 
        //         console.log(chalkAlert("WAS | *** LOGIN USER DB ERROR *** | " + err));
        //         return done(err);
        //       }
        //       if (!user) {
        //         console.log(chalkAlert("WAS | *** LOGIN FAILED | USER NOT FOUND *** | " + username));
        //         return done(null, false, { message: "Incorrect username." });
        //       }
        //       if ((user.screenName.toLowerCase().startsWith("altthreecee")) && (password === "okay!")) {
        //         console.log(chalkAlert("WAS | *** LOGIN FAILED | INVALID PASSWORD *** | " + username));
        //         return done(null, false, { message: "Incorrect password." });
        //       }
        //       if ((user.screenName !== "threecee") || (password !== "what")) {
        //         console.log(chalkAlert("WAS | *** LOGIN FAILED | INVALID PASSWORD *** | " + username));
        //         return done(null, false, { message: "Incorrect password." });
        //       }
        //       adminNameSpace.emit("USER_AUTHENTICATED", user);
        //       viewNameSpace.emit("USER_AUTHENTICATED", user);
        //       return done(null, user);
        //     });
        //   }
        // ));

        app.get("/login_auth",
          passport.authenticate("local", { 
            // successReturnToOrRedirect: "/session",
            successReturnToOrRedirect: "/after-auth.html",
            failureRedirect: "/login"
          })
        );

        passport.serializeUser(function(user, done) { 

          let sessionUser = { 
            "_id": user["_id"], 
            nodeId: user.nodeId, 
            screenName: user.screenName, 
            name: user.name
          };

          console.log(chalk.green("WAS | PASSPORT SERIALIZE USER | @" + user.screenName));

          done(null, sessionUser); 
        });

        passport.deserializeUser(function(sessionUser, done) {
          done(null, sessionUser);
        });

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
        statsObj.user.matched = 0;
        statsObj.user.mismatched = 0;
        statsObj.user.uncategorizedManualUserArray = 0;

        initUpdateUserSetsInterval(ONE_MINUTE);

        HashtagServerController = require("@threeceelabs/hashtag-server-controller");
        hashtagServerController = new HashtagServerController("WAS_HSC");
        hashtagServerControllerReady = true;

        hashtagServerController.on("error", function(err){
          hashtagServerControllerReady = false;
          console.log(chalkError("WAS | *** HSC ERROR | " + err));
        });

        UserServerController = require("@threeceelabs/user-server-controller");
        userServerController = new UserServerController("WAS_USC");

        userServerController.on("error", function(err){
          userServerControllerReady = false;
          console.log(chalkError("WAS | *** USC ERROR | " + err));
        });


        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";
          // slackSendMessage(hostname + " | WAS | " + statsObj.status);

          userServerControllerReady = true;
          console.log(chalk.green("WAS | USC READY | " + appname));
          // dbConnectionReady = true;

          configEvents.emit("DB_CONNECT");
          resolve(db);

        });

      });

    }
    catch(err){
      console.log(chalkError("WAS | *** MONGO DB CONNECT ERROR: " + err));
      reject(err);
    }

  });
}

let dbConnectInterval;
statsObj.dbConnectBusy = false;

dbConnectInterval = setInterval(function(){

  if (!statsObj.dbConnectionReady && !statsObj.dbConnectBusy) {

    statsObj.dbConnectBusy = true;

    connectDb()
    .then(function(){
      statsObj.dbConnectBusy = false;
      statsObj.dbConnectionReady = true;
      dbConnectionReady = true;
    })
    .catch(function(err){
      console.log(chalkError("WAS | *** CONNECT DB INTERVAL ERROR: " + err));
      statsObj.dbConnectionReady = false;
      dbConnectionReady = false;
      statsObj.dbConnectBusy = false;
    });
  }

}, 10*ONE_SECOND);


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
      + " | LOC: " + params.user.location 
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

  let sign = 1;

  if (duration < 0) {
    sign = -1;
    duration = -duration;
  }

  let seconds = parseInt((duration / 1000) % 60);
  let minutes = parseInt((duration / (1000 * 60)) % 60);
  let hours = parseInt((duration / (1000 * 60 * 60)) % 24);
  let days = parseInt(duration / (1000 * 60 * 60 * 24));
  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  if (sign > 0) return days + ":" + hours + ":" + minutes + ":" + seconds;
  return "- " + days + ":" + hours + ":" + minutes + ":" + seconds;
}

function touchChildPidFile(params){

  const childPidFile = params.childId + "=" + params.pid;

  const folder = params.folder || childPidFolderLocal;

  shell.mkdir("-p", folder);

  const path = folder + "/" + childPidFile;

  touch.sync(path, { force: true });

  console.log(chalkBlue("WAS | TOUCH CHILD PID FILE: " + path));
}

// ==================================================================
// TWEET ID CACHE
// ==================================================================
let tweetIdCacheTtl = process.env.TWEET_ID_CACHE_DEFAULT_TTL;
if (tweetIdCacheTtl === undefined) { tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL;}

console.log("WAS | TWEET ID CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (tweetIdCacheCheckPeriod === undefined) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD;}

console.log("WAS | TWEET ID CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod
});

// ==================================================================
// VIEWER CACHE
// ==================================================================
let viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
if (viewerCacheTtl === undefined) { viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL;}

console.log("WAS | VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

let viewerCacheCheckPeriod = process.env.VIEWER_CACHE_CHECK_PERIOD;
if (viewerCacheCheckPeriod === undefined) { viewerCacheCheckPeriod = VIEWER_CACHE_CHECK_PERIOD;}

console.log("WAS | VIEWER CACHE CHECK PERIOD: " + viewerCacheCheckPeriod + " SECONDS");

const viewerCache = new NodeCache({
  stdTTL: viewerCacheTtl,
  checkperiod: viewerCacheCheckPeriod
});

function viewerCacheExpired(viewerCacheId, viewerObj) {

  console.log(chalkInfo("WAS | XXX VIEWER CACHE EXPIRED"
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
console.log("WAS | SERVER CACHE TTL: " + serverCacheTtl + " SECONDS");

let serverCacheCheckPeriod = process.env.SERVER_CACHE_CHECK_PERIOD;
if (serverCacheCheckPeriod === undefined) { serverCacheCheckPeriod = SERVER_CACHE_CHECK_PERIOD;}
console.log("WAS | SERVER CACHE CHECK PERIOD: " + serverCacheCheckPeriod + " SECONDS");

const serverCache = new NodeCache({
  stdTTL: serverCacheTtl,
  checkperiod: serverCacheCheckPeriod
});

function serverCacheExpired(serverCacheId, serverObj) {

  const ttl = serverCache.getTtl(serverCacheId);

  console.log(chalkInfo("WAS | XXX SERVER CACHE EXPIRED"
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
console.log("WAS | AUTHENTICATED SOCKET CACHE TTL: " + authenticatedSocketCacheTtl + " SECONDS");

let authenticatedSocketCacheCheckPeriod = process.env.AUTH_SOCKET_CACHE_CHECK_PERIOD;
if (authenticatedSocketCacheCheckPeriod === undefined) { authenticatedSocketCacheCheckPeriod = AUTH_SOCKET_CACHE_CHECK_PERIOD;}
console.log("WAS | AUTHENTICATED SOCKET CACHE CHECK PERIOD: " + authenticatedSocketCacheCheckPeriod + " SECONDS");

const authenticatedSocketCache = new NodeCache({
  stdTTL: authenticatedSocketCacheTtl,
  checkperiod: authenticatedSocketCacheCheckPeriod
});

function authenticatedSocketCacheExpired(socketId, authSocketObj) {

  const ttl = authenticatedSocketCache.getTtl(socketId);

  console.log(chalkInfo("WAS | XXX AUTH SOCKET CACHE EXPIRED"
    + " | TTL: " + msToTime(authenticatedSocketCacheTtl*1000)
    + " | NSP: " + authSocketObj.namespace.toUpperCase()
    + " | " + socketId
    + " | " + authSocketObj.ipAddress
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

          console.log(chalkInfo("WAS | AUTH SOCKET CACHE ENTRIES"
            + " | NSP: " + authSocketObjCache.namespace.toUpperCase()
            + " | " + socketId
            + " | " + authSocketObjCache.ipAddress
            + " | USER ID: " + authSocketObjCache.userId
            + " | NOW: " + getTimeStamp()
            + " | TS: " + getTimeStamp(authSocketObjCache.timeStamp)
            + " | AGO: " + msToTime(moment().valueOf() - authSocketObjCache.timeStamp)
          ));
        }
        else {
          console.log(chalkAlert("WAS | ??? AUTH SOCKET CACHE NO ENTRY? | SOCKET ID: " + socketId));
        }

      });
    }
    else {
      console.log(chalkError("WAS | *** AUTH CACHE GET KEYS ERROR: " + err));
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
console.log("WAS | AUTHENTICATED TWITTER USER CACHE TTL: " + authenticatedTwitterUserCacheTtl + " SECONDS");

let authenticatedTwitterUserCacheCheckPeriod = process.env.AUTH_USER_CACHE_CHECK_PERIOD;
if (authenticatedTwitterUserCacheCheckPeriod === undefined) { authenticatedTwitterUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;}
console.log("WAS | AUTHENTICATED TWITTERUSER CACHE CHECK PERIOD: " + authenticatedTwitterUserCacheCheckPeriod + " SECONDS");

const authenticatedTwitterUserCache = new NodeCache({
  stdTTL: authenticatedTwitterUserCacheTtl,
  checkperiod: authenticatedTwitterUserCacheCheckPeriod
});

function authenticatedTwitterUserCacheExpired(nodeId, userObj) {

  console.log(chalkInfo("WAS | XXX AUTH TWITTER USER CACHE EXPIRED"
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
console.log("WAS | AUTH IN PROGRESS CACHE TTL: " + authInProgressTwitterUserCacheTtl + " SECONDS");

let authInProgressTwitterUserCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (authInProgressTwitterUserCacheCheckPeriod === undefined) { authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;}
console.log("WAS | AUTH IN PROGRESS CACHE CHECK PERIOD: " + authInProgressTwitterUserCacheCheckPeriod + " SECONDS");

const authInProgressTwitterUserCache = new NodeCache({
  stdTTL: authInProgressTwitterUserCacheTtl,
  checkperiod: authInProgressTwitterUserCacheCheckPeriod
});

authInProgressTwitterUserCache.on("expired", function(nodeId, userObj){

  console.log(chalkInfo("WAS | XXX AUTH IN PROGRESS TWITTER USER CACHE EXPIRED"
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
console.log("WAS | NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

let nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
if (nodeCacheCheckPeriod === undefined) { nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD;}
console.log("WAS | NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS");


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
      console.log(chalkLog("WAS | NEW MAX NODE METER ENTRIES"
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
let nodeCacheInterval;

nodeCacheInterval = setInterval(function(){

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
console.log("WAS | TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

const trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: TRENDING_CACHE_CHECK_PERIOD
});

let nodesPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (nodesPerMinuteTopTermTtl === undefined) {nodesPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;}
console.log("WAS | TOP TERMS WPM CACHE TTL: " + nodesPerMinuteTopTermTtl + " SECONDS");

let nodesPerMinuteTopTermCheckPeriod = process.env.TOPTERMS_CACHE_CHECK_PERIOD;
if (nodesPerMinuteTopTermCheckPeriod === undefined) {
  nodesPerMinuteTopTermCheckPeriod = TOPTERMS_CACHE_CHECK_PERIOD;
}
console.log("WAS | TOP TERMS WPM CACHE CHECK PERIOD: " + nodesPerMinuteTopTermCheckPeriod + " SECONDS");

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

let statsBestNetworkPickArray = [
  "networkId",
  "successRate",
  "matchRate",
  "overallMatchRate",
  "inputsId",
  "testCycles",
  "numInputs",
  "seedNetworkId",
  "seedNetworkRes",
  "betterChild"
];

function initStats(callback){

  console.log(chalk.bold.black("WAS | INIT STATS"));
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
  statsObj.bestNetwork.networkId = false;
  statsObj.bestNetwork.successRate = false;
  statsObj.bestNetwork.matchRate = false;
  statsObj.bestNetwork.overallMatchRate = false;
  statsObj.bestNetwork.inputsId = false;
  statsObj.bestNetwork.numInputs = 0;
  statsObj.bestNetwork.seedNetworkId = false;
  statsObj.bestNetwork.seedNetworkRes = 0;
  statsObj.bestNetwork.testCycles = 0;
  statsObj.bestNetwork.betterChild = false;

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
  statsObj.twitter.duplicateTweetsReceived = 0;
  statsObj.twitter.retweetsReceived = 0;
  statsObj.twitter.quotedTweetsReceived = 0;
  statsObj.twitter.tweetsPerMin = 0;
  statsObj.twitter.maxTweetsPerMin = 0;
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

  console.log("WAS | process.memoryUsage()\n"+ jsonPrint(process.memoryUsage()));
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

  if (configuration.verbose) { console.log(chalkLog("WAS | dropboxFolderGetLastestCursor FOLDER: " + folder)); }

  dropboxClient.filesListFolderGetLatestCursor(optionsGetLatestCursor)
  .then(function(last_cursor) {

    lastCursorTruncated = last_cursor.cursor.substring(0,20);

    if (configuration.verbose) { console.log(chalkLog("WAS | DROPBOX LAST CURSOR\n" + jsonPrint(last_cursor))); }

    dropboxLongPoll(last_cursor.cursor, function(err, results){

      if (configuration.verbose) { console.log(chalkLog("WAS | DROPBOX LONG POLL RESULTS\n" + jsonPrint(results))); }

      if (results.changes) {

        dropboxClient.filesListFolderContinue({ cursor: last_cursor.cursor})
        .then(function(response){

          if (configuration.verbose) { console.log(chalkLog("WAS | DROPBOX FILE LIST FOLDER CONTINUE\n" + jsonPrint(response))); }

          callback(null, response);

        })
        .catch(function(err){

          if (err.status === 429){
            console.log(chalkError("WAS | *** dropboxFolderGetLastestCursor filesListFolder *** DROPBOX FILES LIST FOLDER ERROR"
              + " | TOO MANY REQUESTS" 
              + " | FOLDER: " + folder 
            ));
          }
          else {
            console.log(chalkError("WAS | *** dropboxFolderGetLastestCursor filesListFolder *** DROPBOX FILES LIST FOLDER ERROR"
              + "\nERROR: " + err 
              + "\nERROR: " + jsonPrint(err)
            ));
          }
          callback(err, last_cursor.cursor);

        });
      }
      else {
        console.log(chalkLog("WAS | DROPBOX | FOLDER NO CHANGE | " + folder));
        callback(null, null);
      }
    });
  })
  .catch(function(err){
    console.log(chalkError("WAS | *** ERROR DROPBOX FOLDER | " + folder + " | " + err));
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
    console.log(chalkLog("WAS | STATS\n" + jsonPrint(statsObj)));
  }

  console.log(chalkLog("WAS | S"
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

function loadCommandLineArgs(params){

  return new Promise(function(resolve, reject){

    statsObj.status = "LOAD COMMAND LINE ARGS";

    const commandLineConfigKeys = Object.keys(commandLineConfig);

    async.each(commandLineConfigKeys, function(arg, cb){
      configuration[arg] = commandLineConfig[arg];
      console.log("WAS | --> COMMAND LINE CONFIG | " + arg + ": " + configuration[arg]);
      cb();
    }, function(err){

      if (err) {
        return reject(err);
      }
      statsObj.commandLineArgsLoaded = true;
      resolve();
    });

  });
}

function getFileMetadata(params) {

  return new Promise(function(resolve, reject){

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
      resolve(response);
    })
    .catch(function(err) {
      console.log(chalkError("WAS | *** DROPBOX getFileMetadata ERROR: " + fullPath));
      console.log(chalkError("WAS | *** ERROR\n" + jsonPrint(err.error)));

      if ((err.status === 404) || (err.status === 409)) {
        console.error(chalkError("WAS | *** DROPBOX READ FILE " + fullPath + " NOT FOUND"));
      }
      if (err.status === 0) {
        console.error(chalkError("WAS | *** DROPBOX NO RESPONSE"));
      }

      reject(err);

    });

  });
}

function getFileMetadataRetry(params, callback) {

  debug(chalkAlert("WAS | getFileMetadataRetry | PARAMS\n" + jsonPrint(params)));

  let operation = retry.operation();
 
  operation.attempt(function(currentAttempt) {

    if (currentAttempt > 1) {
      console.log(chalkAlert("WAS | getFileMetadataRetry"
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

function loadFile(params) {

  return new Promise(function(resolve, reject){

    let fullPath = params.folder + "/" + params.file;

    debug(chalkInfo("LOAD FOLDER " + params.folder));
    debug(chalkInfo("LOAD FILE " + params.file));
    debug(chalkInfo("FULL PATH " + fullPath));


    if (configuration.offlineMode || params.loadLocalFile) {

      if (hostname === "google") {
        fullPath = "/home/tc/Dropbox/Apps/wordAssociation/" + fullPath;
        console.log(chalkInfo("OFFLINE_MODE: FULL PATH " + fullPath));
      }

      if ((hostname === "mbp3") || (hostname === "mbp2")) {
        fullPath = "/Users/tc/Dropbox/Apps/wordAssociation/" + fullPath;
        console.log(chalkInfo("OFFLINE_MODE: FULL PATH " + fullPath));
      }

      fs.readFile(fullPath, "utf8", function(err, data) {

        if (err) {
          console.log(chalkError("fs readFile ERROR: " + err));
          return reject(err);
        }

        console.log(chalkInfo(getTimeStamp()
          + " | LOADING FILE FROM DROPBOX"
          + " | " + fullPath
        ));

        if (params.file.match(/\.json$/gi)) {

          const fileObj = JSONParse(data);

          if (fileObj.value) {

            const fileObjSizeMbytes = sizeof(fileObj)/ONE_MEGABYTE;

            console.log(chalkInfo(getTimeStamp()
              + " | LOADED FILE FROM DROPBOX"
              + " | " + fileObjSizeMbytes.toFixed(2) + " MB"
              + " | " + fullPath
            ));

            return resolve(fileObj.value);
          }

          console.log(chalkError(getTimeStamp()
            + " | *** LOAD FILE FROM DROPBOX ERROR"
            + " | " + fullPath
            + " | " + fileObj.error
          ));

          return reject(fileObj.error);

        }

        console.log(chalkError(getTimeStamp()
          + " | ... SKIP LOAD FILE FROM DROPBOX"
          + " | " + fullPath
        ));
        resolve();

      });

     }
    else {

      dropboxClient.filesDownload({path: fullPath})
      .then(function(data) {

        debug(chalkLog(getTimeStamp()
          + " | LOADING FILE FROM DROPBOX FILE: " + fullPath
        ));

        if (params.file.match(/\.json$/gi)) {

          let payload = data.fileBinary;

          if (!payload || (payload === undefined)) {
            return reject(new Error("WAS LOAD FILE PAYLOAD UNDEFINED"));
          }

          const fileObj = JSONParse(payload);

          if (fileObj.value) {
            return resolve(fileObj.value);
          }

          console.log(chalkError("WAS | DROPBOX loadFile ERROR: " + fullPath));
          return reject(fileObj.error);
        }
        else if (params.file.match(/\.txt$/gi)) {

          let payload = data.fileBinary;

          if (!payload || (payload === undefined)) {
            return reject(new Error("WAS LOAD FILE PAYLOAD UNDEFINED"));
          }

          return resolve(payload);

          console.log(chalkError("WAS | DROPBOX loadFile ERROR: " + fullPath));
          return reject(fileObj.error);
        }
        else {
          resolve();
        }
      })
      .catch(function(error) {

        console.log(chalkError("WAS | DROPBOX loadFile ERROR: " + fullPath));
        
        if ((error.status === 409) || (error.status === 404)) {
          console.log(chalkError("WAS | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"
            + " ... SKIPPING ...")
          );
          return reject(error);
        }
        
        if (error.status === 0) {
          console.log(chalkError("WAS | !!! DROPBOX NO RESPONSE"
            + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
          return reject(error);
        }

        reject(error);

      });
    }
  });
}


function loadMaxInputHashMap(params){

  return new Promise(function(resolve, reject) {

    // try{

      params = params || {};
      params.folder = params.folder || dropboxConfigDefaultTrainingSetsFolder;
      params.file = params.file || maxInputHashMapFile;

      // let dataObj = await loadFile(params);

      loadFile(params)
      .then(function(dataObj){
        if (dataObj.maxInputHashMap === undefined) {
          console.log(chalkError("WAS | *** ERROR: loadMaxInputHashMap: loadFile: maxInputHashMap UNDEFINED"));
        }
        if (dataObj.normalization === undefined) {
          console.log(chalkError("WAS | *** ERROR: loadMaxInputHashMap: loadFile: normalization UNDEFINED"));
        }

        maxInputHashMap = dataObj.maxInputHashMap || {};
        normalization = dataObj.normalization || {};

        resolve();
      })
      .catch(function(err){
        if (err.code === "ENOTFOUND") {
          console.log(chalkError("WAS | *** LOAD MAX INPUT: FILE NOT FOUND"
            + " | " + params.folder + "/" + params.file
          ));
        }

        return reject(err);
      });


    // }
    // catch(err){

    //   if (err.code === "ENOTFOUND") {
    //     console.log(chalkError("WAS | *** LOAD MAX INPUT: FILE NOT FOUND"
    //       + " | " + params.folder + "/" + params.file
    //     ));
    //   }

    //   return reject(err);
    // }

  });
}

function loadYamlConfig(yamlFile, callback){
  console.log(chalkInfo("WAS | LOADING YAML CONFIG FILE: " + yamlFile));
  fs.exists(yamlFile, function yamlCheckFileExists(exists) {
    if (exists) {
      let cnf = yaml.load(yamlFile);
      console.log(chalkInfo("WAS | FOUND FILE " + yamlFile));
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
          console.log(chalkLog("WAS | LOCAL STREAM READ CLOSED | SOURCE: " + fullPath));
        });

        remoteWriteStream.on("close", function(){
          console.log(chalkLog("WAS | REMOTE STREAM WRITE CLOSED | DEST: " + options.destination));
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
          console.log(chalkLog("WAS | REMOTE STREAM WRITE END | DEST: " + options.destination));
          if (callback !== undefined) { return callback(null); }
        });

        remoteWriteStream.on("error", function(err){
          console.log(chalkError("WAS | *** REMOTE STREAM WRITE ERROR | DEST: " + options.destination + "\n" + err));
          if (callback !== undefined) { return callback(err); }
        });

      }, 5000);

    })
    .catch(function(error){
      console.log(chalkError("WAS | *** " + getTimeStamp() 
        + " | *** ERROR DROBOX JSON WRITE | FILE: " + fullPath 
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
            + " | *** ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: 413"
          ));
          if (callback !== undefined) { return callback(error); }
        }
        else if (error.status === 429){
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | *** ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: TOO MANY WRITES"
          ));
          if (callback !== undefined) { return callback(error); }
        }
        else if (error.status === 500){
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | *** ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: DROPBOX SERVER ERROR"
          ));
          if (callback !== undefined) { return callback(error); }
        }
        else {
          console.log(chalkError("WAS | " + getTimeStamp() 
            + " | *** ERROR DROBOX JSON WRITE | FILE: " + fullPath 
            + " | ERROR: " + error
            + " | ERROR\n" + jsonPrint(error)
          ));
          if (callback !== undefined) { return callback(error); }
        }
      });
    };

    if (options.mode === "add") {

      dropboxClient.filesListFolder({path: params.folder, limit: configuration.dropboxListFolderLimit})
      .then(function(response){

        debug(chalkLog("WAS | DROPBOX LIST FOLDER"
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

  console.log(chalk.bold.black("WAS | INIT DROPBOX SAVE FILE INTERVAL | " + msToTime(cnf.saveFileQueueInterval)));

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

function killChild(params){

  return new Promise(function(resolve, reject){

    let pid;

    if ((params.pid === undefined) && childrenHashMap[params.childId] === undefined) {
      return reject(new Error("CHILD ID NOT FOUND: " + params.childId));
    }

    if (params.pid) {
      pid = params.pid;
    }
    else if (params.childId && childrenHashMap[params.childId] !== undefined) {
      pid = childrenHashMap[params.childId].pid;
    }


    kill(pid, function(err){

      if (err) { return reject(err); }
      resolve(params);

    });


    // let pid = false;
    // let command;

    // if (params.title !== undefined) {
    //   command = "pkill -f " + params.title;
    // }
    // else if (params.pid !== undefined) {
    //   pid = params.pid;
    //   command = "kill " + pid;
    // }
    // else if (params.childId !== undefined) {
    //   if (childrenHashMap[params.childId] === undefined) {
    //     console.log(chalkError("WAS | KILL CHILD ERROR: CHILD NOT IN HM: " + params.childId));
    //     return reject(new Error("ERROR: CHILD NOT IN HM: " + params.childId));
    //   }
    //   pid = childrenHashMap[params.childId].pid;
    //   command = "kill " + pid;
    // }


    // shell.exec(command, function(code, stdout, stderr){

    //   console.log(chalkAlert("WAS | KILL CHILD"
    //     + "\nPARAMS\n " + jsonPrint(params)
    //     + "\nCOMMAND: " + command
    //     + "\nCODE:    " + code
    //     + "\nSTDOUT:  " + stdout
    //     + "\nSTDERR:  " + stderr
    //   )); 

    //   // slackSendMessage(
    //   //   "\n*KILL CHILD*"
    //   //   + "\nPARAMS\n " + jsonPrint(params)
    //   //   + "\nCOMMAND: " + command
    //   //   + "\nCODE:    " + code
    //   //   + "\nSTDOUT:  " + stdout
    //   //   + "\nSTDERR:  " + stderr
    //   // );

    //   resolve({stderr: stderr, code: code, stdout: stdout });

    // });

  });
}

function getChildProcesses(params){

  return new Promise(function(resolve, reject){

    let command;
    let pid;
    let childId;
    let numChildren = 0;
    let childPidArray = [];

    // DEFAULT_CHILD_ID_PREFIX_XXX=[pid] 

    shell.mkdir("-p", childPidFolderLocal);

    debug("SHELL: cd " + childPidFolderLocal);
    shell.cd(childPidFolderLocal);

    const childPidFileNameArray = shell.ls(DEFAULT_CHILD_ID_PREFIX + "*");

    async.eachSeries(childPidFileNameArray, function (childPidFileName, cb) {

      debug("SHELL: childPidFileName: " + childPidFileName);

      // wa_node_child_dbu=46633
      const childPidStringArray = childPidFileName.split("=");

      const childId = childPidStringArray[0];
      const childPid = parseInt(childPidStringArray[1]);

      debug("SHELL: CHILD ID: " + childId + " | PID: " + childPid);

      if (childrenHashMap[childId]) {
        debug("CHILD HM HIT"
          + " | ID: " + childId 
          + " | SHELL PID: " + childPid 
          + " | HM PID: " + childrenHashMap[childId].pid 
          + " | STATUS: " + childrenHashMap[childId].status
        );
      }
      else {
        debug("CHILD HM MISS | ID: " + childId + " | PID: " + childPid + " | STATUS: UNKNOWN");
      }

      if ((childrenHashMap[childId] !== undefined) && (childrenHashMap[childId].pid === childPid)) {
        // cool kid
        childPidArray.push({ pid: childPid, childId: childId});

        debug(chalkInfo("WAS | FOUND CHILD"
          + " [ " + childPidArray.length + " CHILDREN ]"
          + " | ID: " + childId
          + " | PID: " + childPid
          + " | FILE: " + childPidFileName
        ));

        cb();

      }
      else {

        debug("SHELL: CHILD NOT IN HASH | ID: " + childId + " | PID: " + childPid);

        if (childrenHashMap[childId] === undefined) {
          childrenHashMap[childId] = {};
          childrenHashMap[childId].status = "ZOMBIE";
        }

        console.log(chalkAlert("WAS | *** CHILD ZOMBIE"
          + " | STATUS: " + childrenHashMap[childId].status
          + " | TERMINATING ..."
        ));

        kill(childPid, function(err){

          if (err) {
            console.log(chalkError("WAS | *** KILL ZOMBIE ERROR: ", err));
            return cb(err);
          }

          delete childrenHashMap[childId];

          shell.rm(childPidFileName);

          console.log(chalkAlert("WAS | XXX CHILD ZOMBIE"
            + " [ " + childPidArray.length + " CHILDREN ]"
            + " | ID: " + childId
            + " | PID: " + childPid
          ));

          cb();

        });

      }

    }, function(err){
      if (err) {
        return reject(err);
      }

      resolve(childPidArray);

    });

    // let command;
    // let pid;
    // let childId;
    // let numChildren = 0;
    // let childPidArray = [];

    // if ((params.searchTerm === undefined) || (params.searchTerm === "ALL")){
    //   command = "pgrep " + "wa_";
    // }
    // else {
    //   command = "pgrep " + params.searchTerm;
    // }

    // debug(chalkAlert("getChildProcesses | command: " + command));


    // shell.exec(command, {silent: true}, function(code, stdout, stderr){

    //   if (stderr) {
    //     console.log(chalkError("WAS | *** SHELL ERROR"
    //       + " | COMMAND: " + command
    //       + " | STDERR: " + stderr
    //     ));
    //     return reject(stderr);
    //   }

    //   if (code === 0) {

    //     let soArray = stdout.trim();

    //     let stdoutArray = soArray.split("\n");

    //     async.eachSeries(stdoutArray, function(pidRaw, cb){

    //       pid = pidRaw.trim();

    //       if (parseInt(pid) > 0) {

    //         command = "ps -o command= -p " + pid;

    //         shell.exec(command, {silent: true}, function(code, stdout, stderr){

    //           if (stderr) {
    //             console.log(chalkError("WAS | *** SHELL ERROR"
    //               + " | COMMAND: " + command
    //               + " | STDERR: " + stderr
    //             ));
    //             return cb(stderr);
    //           }

    //           childId = stdout.trim();

    //           numChildren += 1;

    //           debug(chalk.blue("WAS | FOUND CHILD PROCESS"
    //             + " | NUM: " + numChildren
    //             + " | PID: " + pid
    //             + " | " + childId
    //           ));

    //           if (childrenHashMap[childId] === undefined) {

    //             childrenHashMap[childId] = {};
    //             childrenHashMap[childId].status = "ZOMBIE";

    //             console.log(chalkError("WAS | *** CHILD ZOMBIE ***"
    //               + " | NUM: " + numChildren
    //               + " | PID: " + pid
    //               + " | " + childId
    //               + " | STATUS: " + childrenHashMap[childId].status
    //             ));


    //             // try {
    //               // await killChild({pid: pid});
    //               killChild({pid: pid})
    //               .then(function(){
    //                 console.log(chalkAlert("WAS | XXX ZOMBIE CHILD KILLED | PID: " + pid + " | CH ID: " + childId));
    //                 cb();
    //               })
    //               .catch(function(err){
    //                 console.log(chalkError("WAS | *** KILL CHILD ERROR"
    //                   + " | PID: " + pid
    //                   + " | ERROR: " + err
    //                 ));
    //                 return cb(err);
    //               });

    //             // }
    //             // catch(err){
    //             //  console.log(chalkError("WAS | *** KILL CHILD ERROR"
    //             //     + " | PID: " + pid
    //             //     + " | ERROR: " + err
    //             //   ));
    //             //   return cb(err);
    //             // }
    //           }
    //           else {
    //             debug(chalkInfo("WAS | CHILD"
    //               + " | PID: " + pid
    //               + " | " + childId
    //               + " | STATUS: " + childrenHashMap[childId].status
    //             ));
    //             childPidArray.push({ pid: pid, childId: childId});
    //             cb();
    //           }

    //         });
    //       }
    //       else {
    //         cb();
    //       }

    //     }, function(err){

    //       if (err) {
    //         console.log(chalkError("WAS | *** GET CHILD PROCESSES ERROR"
    //           + " | ERROR: " + err
    //         ));
    //         return reject(err);
    //       }

    //       resolve(childPidArray);

    //     });

    //   }

    //   if (code === 1) {
    //     console.log(chalkInfo("WAS | NO NN CHILD PROCESSES FOUND"));
    //     return resolve([]);
    //   }

    //   if (code > 1) {
    //     console.log(chalkAlert("WAS | ERROR *** SHELL KILL CHILD"
    //       + "\nSHELL :: WAS | COMMAND: " + command
    //       + "\nSHELL :: WAS | EXIT CODE: " + code
    //       + "\nSHELL :: WAS | STDOUT\n" + stdout
    //       + "\nSHELL :: WAS | STDERR\n" + stderr
    //     ));
    //     return reject(stderr);
    //     // if (callback !== undefined) { callback(stderr, command); }
    //   }

    // });

  });
}

function killAll(callback){

  return new Promise(function(resolve, reject){

    // let childPidArray = await getChildProcesses({searchTerm: "ALL"});
    getChildProcesses({searchTerm: "ALL"})
    .then(function(childPidArray){
      console.log(chalk.green("getChildProcesses childPidArray\n" + jsonPrint(childPidArray)));
      if (childPidArray && (childPidArray.length > 0)) {

        async.eachSeries(childPidArray, function(childObj, cb){

          killChild({pid: childObj.pid})
          .then(function(){
            console.log(chalkAlert("WAS | KILL ALL | KILLED | PID: " + childObj.pid + " | CH ID: " + childObj.childId));
            cb();
          })
          .catch(function(err){
            console.log(chalkError("WAS | *** KILL CHILD ERROR"
              + " | PID: " + childObj.pid
              + " | ERROR: " + err
            ));
            return cb(err);
          });

          // try {
          //   await killChild({pid: childObj.pid});
          //   console.log(chalkAlert("WAS | KILL ALL | KILLED | PID: " + childObj.pid + " | CH ID: " + childObj.childId));
          //   return;
          // }
          // catch(err){
          //   return(err);
          // }

        }, function(err){

          if (err){
            return reject(err);
          }

          resolve(childPidArray);

        });
      }
      else {

        console.log(chalkBlue("WAS | KILL ALL | NO CHILDREN"));
        resolve(childPidArray);
      }
    })
    .catch(function(err){

    });


  });
}

process.on("unhandledRejection", function(err, promise) {
  console.trace("WAS | *** Unhandled rejection (promise: ", promise, ", reason: ", err, ").");
  quit("unhandledRejection");
  process.exit(1);
});

process.on("exit", function processExit() {

  console.log(chalkAlert("\nWAS | MAIN PROCESS EXITING ...\n"));

  killAll()
  .then(function(){
    console.log(chalkAlert("\nWAS | *** MAIN PROCESS EXIT *** \n"));
  })
  .catch(function(err){
    console.log(chalkError("WAS | *** MAIN PROCESS EXIT ERROR: " + err));
  });
});

process.on("message", function processMessageRx(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    console.log(chalkAlert("\nWAS | =============================\nWAS | *** SHUTDOWN OR SIGINT ***\nWAS | =============================\n"));

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

  console.log(chalkError("WAS | *** CHILD_ERROR"
    + " | " + childObj.childId
    + " | ERROR: " + jsonPrint(childObj.err)
  ));

  if (childrenHashMap[childObj.childId] !== undefined){
    childrenHashMap[childObj.childId].errors += 1;
    childrenHashMap[childObj.childId].status = "UNKNOWN";
  }


  // slackSendMessage("\n*CHILD ERROR*\n" + childObj.childId + "\n" + childObj.err);

  switch(childObj.childId){

    case DEFAULT_DBU_CHILD_ID:

      console.log(chalkError("WAS | *** KILL DBU CHILD"));

      killChild({childId: DEFAULT_DBU_CHILD_ID}, function(err, numKilled){
        initDbuChild({childId: DEFAULT_DBU_CHILD_ID});
      });

    break;

    case DEFAULT_TFE_CHILD_ID:

      console.log(chalkError("WAS | *** KILL TFE CHILD"));

      killChild({childId: DEFAULT_TFE_CHILD_ID}, function(err, numKilled){
        initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
      });

    break;

    // case DEFAULT_TSS_CHILD_ID:

    //   console.log(chalkError("WAS | *** KILL TSS CHILD"));

    //   killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err, numKilled){
    //     initTssChild({childId: DEFAULT_TSS_CHILD_ID});
    //   });

    // break;

    case DEFAULT_TWP_CHILD_ID:

      console.log(chalkError("WAS | *** KILL TWEET PARSER"));

      killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err, numKilled){
        initTweetParser({childId: DEFAULT_TWP_CHILD_ID}, function(err, twp){
          if (!err) { parserChild = twp; }
        });
      });

    break;

  }

  if (childObj.childId.startsWith(DEFAULT_TSS_CHILD_ID)){
      console.log(chalkError("WAS | *** KILL TSS CHILD | " + childObj.childId));

      killChild({childId: childObj.childId}, function(err, numKilled){
        initTssChild({childId: childObj.childId, threeceeUser: childrenHashMap[childObj.childId].threeceeUser});
      });
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
        console.log(chalkError("WAS | *** PORT DISCONNECTED | " + getTimeStamp() 
          + " | " + config.port));
      });
    });

    httpServer.listen(config.port, function serverListen() {
      debug(chalkInfo("WAS | " + getTimeStamp() + " | LISTENING ON PORT " + config.port));
    });

    httpServer.on("error", function serverError(err) {

      statsObj.socket.errors.httpServer_errors += 1;
      statsObj.internetReady = false;

      debug(chalkError("WAS | *** HTTP ERROR | " + getTimeStamp() + "\n" + err));

      if (err.code === "EADDRINUSE") {

        debug(chalkError("WAS | *** HTTP ADDRESS IN USE: " + config.port + " ... RETRYING..."));

        setTimeout(function serverErrorTimeout() {
          httpServer.listen(config.port, function serverErrorListen() {
            debug("WAS | LISTENING ON PORT " + config.port);
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
    heartbeatObj.bestNetwork = {};
    heartbeatObj.bestNetwork = statsObj.bestNetwork;

    let tempAdminArray = [];
    let tempServerArray = [];
    let tempViewerArray = [];

    heartbeatInterval = setInterval(function() {

      statsObj.serverTime = moment().valueOf();
      statsObj.runTime = moment().valueOf() - statsObj.startTime;
      statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
      statsObj.timeStamp = getTimeStamp();
      statsObj.upTime = os.uptime() * 1000;
      statsObj.memory.memoryTotal = os.totalmem();
      statsObj.memory.memoryAvailable = os.freemem();
      statsObj.memory.memoryUsage = process.memoryUsage();

      heartbeatObj.bestNetwork = statsObj.bestNetwork;

      tempAdminArray = adminHashMap.entries();
      heartbeatObj.admins = tempAdminArray;

      tempServerArray = [];

      async.each(serverCache.keys(), function(serverCacheKey, cb){

        serverCache.get(serverCacheKey, function(err, serverObj){

          if (err) {
            console.log(chalkError("WAS | *** SERVER CACHE ERROR: " + err));
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
            console.log(chalkError("WAS | *** VIEWER CACHE ERROR: " + err));
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

  initAppRouting(function initAppRoutingComplete() {
    // initLoadBestNetworkInterval(ONE_MINUTE+1);
  });
});

configEvents.on("INTERNET_NOT_READY", function internetNotReady() {
  if (configuration.autoOfflineMode) {
    configuration.offlineMode = true;
    console.log(chalkAlert("WAS | *** AUTO_OFFLINE_MODE ***"));
  }
});

configEvents.on("DB_CONNECT", function configEventDbConnect(){

  async.parallel({

    socketInit: function(cb){

      initSocketNamespaces()
      .then(function(){
        cb();
      })
      .catch(function(err){
        return cb(err);
      });

    },
    
    unfollowableInit: function(cb){

      initUnfollowableUserSet()
      .then(function(){
        cb();
      })
      .catch(function(err){
        return cb(err);
      });

    },
    
    ignoredInit: function(cb){

      initIgnoredUserSet()
      .then(function(){
        cb();
      })
      .catch(function(err){
        return cb(err);
      });

    },
    
    followSearchInit: function(cb){

      initFollowableSearchTermSet()
      .then(function(){
        cb();
      })
      .catch(function(err){
        return cb(err);
      });

    },

    categoryHashmapsInit: function(cb){

      initCategoryHashmaps()
      .then(function(){
        cb();
      })
      .catch(function(err){
        return cb(err);
      });

    }
  },
  function(err, results){
    if (err){
      console.log(chalkError("WAS | *** ERROR: LOAD CATEGORY HASHMAPS: " + err));
      console.error(err);
    }
    else {
      console.log(chalk.green("WAS | +++ MONGO DB CONNECTION READY"));
      // dbConnectionReady = true;
    }
  });
 
});

configEvents.on("NEW_BEST_NETWORK", function configEventDbConnect(bestNetworkId){

  if (childrenHashMap[DEFAULT_TFE_CHILD_ID] !== undefined) {

    console.log(chalkBlue("WAS | UPDATE TFE CHILD NETWORK: " + bestNetworkObj.networkId));

    childrenHashMap[DEFAULT_TFE_CHILD_ID].child.send({ op: "NETWORK", networkObj: bestNetworkObj }, function tfeNetwork(err){
      if (err) {
        console.log(chalkError("WAS | *** TFE CHILD SEND NETWORK ERROR"
          + " | " + err
        ));
      }
    });

  }

  if (childrenHashMap[DEFAULT_TWP_CHILD_ID] !== undefined) {

    console.log(chalkBlue("WAS | UPDATE TWP CHILD NETWORK: " + bestNetworkObj.networkId));

    childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send({ op: "NETWORK", networkObj: bestNetworkObj }, function twpNetwork(err){
      if (err) {
        console.log(chalkError("WAS | *** TWEET PARSER SEND NETWORK ERROR"
          + " | " + err
        ));
      }
    });
  }
});

configEvents.on("NEW_MAX_INPUT_HASHMAP", function configEventDbConnect(){

  if (childrenHashMap[DEFAULT_TFE_CHILD_ID] !== undefined) {

    console.log(chalkBlue("WAS | UPDATE TFE CHILD MAX INPUT HASHMAP: " + Object.keys(maxInputHashMap)));

    childrenHashMap[DEFAULT_TFE_CHILD_ID].child.send({ op: "MAX_INPUT_HASHMAP", maxInputHashMap: maxInputHashMap }, function tfeMaxInputHashMap(err){
      if (err) {
        console.log(chalkError("WAS | *** TFE CHILD SEND MAX_INPUT_HASHMAP ERROR"
          + " | " + err
        ));
      }
    });

  }

  if (childrenHashMap[DEFAULT_TWP_CHILD_ID] !== undefined) {

    console.log(chalkBlue("WAS | UPDATE TWP CHILD MAX INPUT HASHMAP: " + Object.keys(maxInputHashMap)));

    childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send({ op: "MAX_INPUT_HASHMAP", maxInputHashMap: maxInputHashMap }, function twpMaxInputHashMap(err){
      if (err) {
        console.log(chalkError("WAS | *** TWEET PARSER SEND MAX_INPUT_HASHMAP ERROR"
          + " | " + err
        ));
      }
    });
  }
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
      console.log(chalkAlert("WAS | *** AUTH USER NOT IN CACHE\n" + jsonPrint(categorizeObj.twitterUser)));

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

      if (!userServerControllerReady || !statsObj.dbConnectionReady) {
        return callback(new Error("userServerController not ready"), null);
      }

      userServerController.updateCategory(
        {user: categorizeObj.node, category: categorizeObj.category}, 
        function(err, updatedUser){

        if (err) {
          console.log(chalkError("WAS | *** USER UPDATE CATEGORY ERROR: " + jsonPrint(err)));
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

          // slackSendMessage("CATEGORIZE" + "\n@" + categorizeObj.node.screenName + ": " + categorizeObj.category );

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
          console.log(chalkError("WAS | *** HASHTAG UPDATE CATEGORY ERROR: " + jsonPrint(err)));
          if (callback !== undefined) {
            callback(err, categorizeObj);
          }
        }
        else {

          categorizedHashtagHashMap.set(
            updatedHashtag.nodeId, 
            { manual: updatedHashtag.category, auto: updatedHashtag.categoryAuto });

          // slackSendMessage("CATEGORIZE" + "\n@" + categorizeObj.node.nodeId.toLowerCase() + ": " + categorizeObj.category );

          debug(chalkLog("UPDATE_CATEGORY HASHTAG | #" + updatedHashtag.nodeId ));
          if (callback !== undefined) {
            callback(null, updatedHashtag);
          }
        }
      });
    break;
  }
}

let prevTweetUser;

function socketRxTweet(tw) {

  prevTweetUser = tweetIdCache.get(tw.id_str);

  if (prevTweetUser) {

    statsObj.twitter.duplicateTweetsReceived += 1;

    if (statsObj.twitter.duplicateTweetsReceived % 1000 === 0){
      console.log(chalkLog("WAS"
        + " | ??? DUP TWEET"
        + " | FILTER: " + configuration.filterDuplicateTweets
        + " [ $: " + tweetIdCache.getStats().keys + " / " + statsObj.twitter.duplicateTweetsReceived + " DUPs ]"
        + " | " + tw.id_str 
      ));
    }
    
    if (configuration.filterDuplicateTweets) { return; }
  }

  tweetIdCache.set(tw.id_str, tw.user.screen_name);

  tweetMeter.mark();

  statsObj.twitter.tweetsReceived += 1;

  if (tw.retweeted_status) {
    statsObj.twitter.retweetsReceived += 1;
  }

  if (tw.quoted_status) {
    statsObj.twitter.quotedTweetsReceived += 1;
  }

  debug(chalkSocket("tweet" 
    + " [" + statsObj.twitter.tweetsReceived + "]"
    + " | " + tw.id_str
    + " | TW LANG: " + tw.lang
    + " | " + tw.user.id_str
    + " | " + tw.user.screen_name
    + " | " + tw.user.name
    + " | USER LANG: " + tw.user.lang
  ));

  if (tweetRxQueue.length > configuration.maxQueue){

    statsObj.errors.twitter.maxRxQueue += 1;

    if (statsObj.errors.twitter.maxRxQueue % 1000 === 0) {
      console.log(chalk.black.bold("WAS | *** TWEET RX MAX QUEUE [" + tweetRxQueue.length + "]"
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

    const sampleTweetFileName = "sampleTweet_" + getTimeStamp() + ".json";

    if (saveSampleTweetFlag) {

      saveSampleTweetFlag = false;

      console.log(chalkLog("WAS | SAVING SAMPLE TWEET"
        + " [" + statsObj.twitter.tweetsReceived + " RXd]"
        + " | " + getTimeStamp()
        + " | " + tw.id_str
        + " | " + tw.user.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
        + " | " + sampleTweetFileName
      ));

      saveFileQueue.push({
        localFlag: false, 
        folder: testDataFolder, 
        file: sampleTweetFileName, 
        obj: tw
      });
    }

    tw.inc = true;

    tw.user.statusId = tw.id_str;
    tw.user.status = {};
    tw.user.status.id_str = tw.id_str;
    tw.user.status.created_at = tw.created_at;
    tw.user.status.lang = tw.lang;
    tw.user.status.text = (tw.truncated) ? tw.extended_tweet.full_text : (tw.text || "");

    if (tw.quoted_status) {
      tw.user.quotedStatus = {};
      tw.user.quotedStatus = tw.quoted_status;
    }

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

    if (statsObj.twitter.tweetsReceived % 1000 === 0) {
      console.log(chalkTwitter("WAS | <T"
        + " | RXQ: " + tweetRxQueue.length
        + " [ T/R/Q " + statsObj.twitter.tweetsReceived + "/" + statsObj.twitter.retweetsReceived + "/" + statsObj.twitter.quotedTweetsReceived + "]"
        + " | TW " + tw.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
      ));
    }

  }
  else {
    console.log(chalkAlert("WAS | NULL USER T*<"
      + " [ RXQ: " + tweetRxQueue.length + "]"
      + " [ TPQ: " + tweetParserQueue.length + "]"
      + " | " + tw.id_str
      + " | @" + tw.user.screen_name
      + " | " + tw.user.name
    ));
  }
}

function enableFollow(params){
  if (params.forceFollow) { return true; }
  if (followedUserSet.has(params.user.nodeId)) { return false; }
  if (ignoredUserSet.has(params.user.nodeId)) { return false; }
  if (unfollowableUserSet.has(params.user.nodeId)) { return false; }
  return true;
}

function follow(params, callback) {

  if (!enableFollow(params)) { 

    console.log(chalkWarn("-X- FOLLOW | @" + params.user.screenName + " | IN UNFOLLOWABLE, FOLLOWED or IGNORED USER SET"));

    if (callback !== undefined) { 
      return callback("XXX FOLLOW", null);
    }
    else {
      return;
    }
  }

  followedUserSet.add(params.user.nodeId);
  ignoredUserSet.delete(params.user.nodeId);
  unfollowableUserSet.delete(params.user.nodeId);

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
      console.log(chalkError("WAS | *** FOLLOW | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){
      if (tssChildren[configuration.twitterThreeceeAutoFollowUser] !== undefined) {

        console.log(chalkLog("WAS | +++ FOLLOW"
          + " | " + printUser({user: userUpdated})
        ));

        tssChildren[configuration.twitterThreeceeAutoFollowUser].child.send({
          op: "FOLLOW", 
          user: userUpdated,
          forceFollow: configuration.forceFollow
        });
      }
      else {
        pendingFollowSet.add(userUpdated.userId);
        console.log(chalkAlert("WAS | 000 CAN'T FOLLOW | NO AUTO FOLLOW USER"
          + " | PENDING FOLLOWS: " + pendingFollowSet.size
          + " | " + printUser({user: userUpdated})
        ));
      }

    }
    else {
      console.log(chalkLog("WAS | --- FOLLOW | USER NOT IN DB"
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
    }

    if (callback !== undefined) { callback(err, userUpdated); }

  });
}

function initTssChildren(params){
  return new Promise(function(resolve, reject){

    async.eachSeries(DEFAULT_THREECEE_USERS, function(threeceeUser, cb){
      const childId = DEFAULT_TSS_CHILD_ID + "_" + threeceeUser.toLowerCase();
      tssChildren[threeceeUser] = {};
      tssChildren[threeceeUser].childId = childId;
      initTssChild({childId: childId, threeceeUser: threeceeUser});
      cb();
    }, function(err){
      if (err) {
        return reject(err);
      }
      resolve();
    });


  });
}

function killTssChildren(params){
  return new Promise(function(resolve, reject){

    Object.keys(tssChildren).forEach(function(threeceeUser){
      const childId = DEFAULT_TSS_CHILD_ID + "_" + threeceeUser.toLowerCase();
      killChild({childId: childId}, function(err, numKilled){
        tssChildren[threeceeUser].childId = childId;
        tssChildren[threeceeUser].pongReceived = false;
        initTssChild({childId: childId, threeceeUser: threeceeUser});
      });
    });

    resolve();

  });
}

function tssSendAllChildren(params){
  return new Promise(function(resolve, reject){

    Object.keys(tssChildren).forEach(function(threeceeUser){
      tssChildren[threeceeUser].child.send(params);
    });

    resolve();

  });
}

function ignore(params, callback) {

  console.log(chalk.blue("WAS | XXX IGNORE | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    ignoredUserSet.add(params.user.nodeId);

    const ob = {
      userIds : [...ignoredUserSet]
    };

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: ignoredUserFile, 
      obj: ob
    });

  }

  tssSendAllChildren({op: "IGNORE", user: params.user});

  const query = { nodeId: params.user.nodeId };

  let update = {};
  update["$set"] = { ignored: true };

  const options = {
    new: true,
    upsert: false
  };

  User.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("WAS | *** IGNORE | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){
      console.log(chalkLog("WAS | XXX IGNORE"
        + " | " + printUser({user: userUpdated})
      ));
    }
    else {
      console.log(chalkLog("WAS | --- IGNORE USER NOT IN DB"
        + " | ID: " + params.user.nodeId
      ));
    }


    if (callback !== undefined) { callback(err, userUpdated); }

  });
}

function unignore(params, callback) {

  console.log(chalk.blue("WAS | +++ UNIGNORE | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    ignoredUserSet.delete(params.user.nodeId);

    const ob = {
      userIds : [...ignoredUserSet]
    };

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: ignoredUserFile, 
      obj: ob
    });

  } 

  const query = { nodeId: params.user.nodeId };

  let update = {};
  update["$set"] = { ignored: false };

  const options = {
    new: true,
    upsert: false
  };

  User.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("WAS | *** UNIGNORE | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){
      console.log(chalkLog("WAS | +++ UNIGNORE"
        + " | " + printUser({user: userUpdated})
      ));
    }
    else {
      console.log(chalkLog("WAS | --- UNIGNORE USER NOT IN DB"
        + " | ID: " + params.user.nodeId
      ));
    }

    if (callback !== undefined) { callback(err, userUpdated); }

  });
}

function unfollow(params, callback) {

  // console.log(chalk.blue("WAS | XXX UNFOLLOW | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    unfollowableUserSet.add(params.user.nodeId);
    followedUserSet.delete(params.user.nodeId);
    uncategorizedManualUserSet.delete(params.user.nodeId);

    if (params.ignored) {
      ignoredUserSet.add(params.user.nodeId);

      const ob = {
        userIds : [...ignoredUserSet]
      };

      saveFileQueue.push({
        localFlag: false, 
        folder: dropboxConfigDefaultFolder, 
        file: ignoredUserFile, 
        obj: ob
      });
    }

    const obj = {
      userIds : [...unfollowableUserSet]
    };

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: unfollowableUserFile, 
      obj: obj
    });

  } 

  tssSendAllChildren({op: "UNFOLLOW", user: params.user});

  const query = { nodeId: params.user.nodeId, following: true };

  let update = {};
  update["$set"] = { following: false, threeceeFollowing: false };

  const options = {
    new: true,
    upsert: false
  };

  User.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("WAS | *** UNFOLLOW | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){
      console.log(chalkLog("WAS | XXX UNFOLLOW"
        + " | " + userUpdated.nodeId
        + " | @" + userUpdated.screenName
        + " | " + userUpdated.name
      ));
    }
    else {
      console.log(chalkLog("WAS | --- UNFOLLOWED USER NOT IN DB"
        + " | ID: " + params.user.nodeId
      ));
    }


    if (callback !== undefined) { callback(err, userUpdated); }

  });
}

function initFollowableSearchTermSet(){

  console.log(chalkBlue("WAS | INIT FOLLOWABLE SEARCH TERM SET: " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile));

  return new Promise(function(resolve, reject) {

    loadFile({folder: dropboxConfigDefaultFolder, file: followableSearchTermFile})
    .then(function(dataObj){

      if (!dataObj || dataObj === undefined) {

       console.log(chalkAlert("WAS | ??? NO FOLLOWABLE SEARCH TERMS ERROR ???"
          + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
        ));

        initFollowableSearchTerms()
        .then(function(){
          return resolve();
        })
        .catch(function(err){
          console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
          return reject(err);
        });

      }
      else{

        const dataArray = dataObj.toString().toLowerCase().split("\n");

        console.log(chalkLog("WAS | LOADED FOLLOWABLE SEARCH TERM FILE"
          + " | " + dataArray.length + " SEARCH TERMS"
          + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
        ));

        async.each(dataArray, function(searchTerm, cb){

          followableSearchTermSet.add(searchTerm);
          cb();

        }, function(err){

          console.log(chalkLog("WAS | FOLLOWABLE SEARCH TERM SET"
            + " | " + followableSearchTermSet.size + " SEARCH TERMS"
            + " | " + dataArray.length + " SEARCH TERMS IN FILE"
            + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
          ));

          initFollowableSearchTerms()
          .then(function(){
            return resolve();
          })
          .catch(function(err){
            console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
            return reject(err);
          });

        });
      }

    })
    .catch(function(err){
      console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
      return reject(err);
    });

  });
}

function initDropboxSync(){

  console.log(chalkLog("WAS | INIT DROPBOX SYNC"));
}

function initIgnoredUserSet(){

  console.log(chalkLog("WAS | INIT IGNORED USER SET"));

  return new Promise(function(resolve, reject) {


    loadFile({folder: dropboxConfigDefaultFolder, file: ignoredUserFile})
    .then(function(ignoredUserSetObj){

      if (!ignoredUserSetObj || ignoredUserSetObj === undefined) {
        console.log(chalkAlert("WAS | ??? LOAD IGNORED USERS EMPTY SET???"));
        return resolve();
      }

      console.log(chalkLog("WAS | LOADED IGNORED USERS FILE"
        + " | " + ignoredUserSetObj.userIds.length + " USERS"
        + " | " + dropboxConfigDefaultFolder + "/" + ignoredUserFile
      ));

      let query;
      let update;
      let numIgnored = 0;
      let numAlreadyIgnored = 0;

      async.eachSeries(ignoredUserSetObj.userIds, function(userId, cb){

        ignoredUserSet.add(userId);

        query = { nodeId: userId, ignored: {"$in": [ false, "false", null ]} };

        update = {};
        update["$set"] = { ignored: true, following: false, threeceeFollowing: false };

        const options = {
          new: true,
          upsert: false
        };

        User.findOneAndUpdate(query, update, options, function(err, userUpdated){

          if (err) {
            console.log(chalkError("WAS | *** initIgnoredUserSet | USER FIND ONE ERROR: " + err));
            return cb(err, userId);
          }
          
          if (userUpdated){

            numIgnored += 1;
            console.log(chalkLog("WAS | XXX IGNORE"
              + " [" + numIgnored + "/" + numAlreadyIgnored + "/" + ignoredUserSetObj.userIds.length + "]"
              + " | " + printUser({user: userUpdated})
            ));

            cb(null, userUpdated);
          }
          else {
            numAlreadyIgnored += 1;
            if (configuration.verbose){
              console.log(chalkLog("WAS | ... ALREADY IGNORED"
                + " [" + numIgnored + "/" + numAlreadyIgnored + "/" + ignoredUserSetObj.userIds.length + "]"
                + " | ID: " + userId
              ));
            }
            cb(null, null);
          }
        });
      }, function(err){

        if (err) {
          return reject(err);
        }
        console.log(chalkBlue("WAS | INIT IGNORED USERS"
          + " | " + numIgnored + " NEW IGNORED"
          + " | " + numAlreadyIgnored + " ALREADY IGNORED"
          + " | " + ignoredUserSet.size + " USERS IN SET"
          + " | " + ignoredUserSetObj.userIds.length + " USERS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + ignoredUserFile
        ));
        resolve();
      });

    })
    .catch(function(err){
      if ((err.code === "ENOTFOUND") || (err.status === 409)) {
        console.log(chalkError("WAS | *** LOAD IGNORED USERS ERROR: FILE NOT FOUND:  " 
          + dropboxConfigDefaultFolder + "/" + ignoredUserFile
        ));
        return resolve();
      }
      
      console.log(chalkError("WAS | *** LOAD IGNORED USERS ERROR: " + err));
      return reject(err);
    });

  });
}

function initUnfollowableUserSet(){

  console.log(chalkLog("WAS | INIT UNFOLLOWABLE USER SET"));

  return new Promise(function(resolve, reject) {


    loadFile({folder: dropboxConfigDefaultFolder, file: unfollowableUserFile})
    .then(function(unfollowableUserSetObj){

      if (!unfollowableUserSetObj || unfollowableUserSetObj === undefined) {
        console.log(chalkAlert("WAS | ??? LOAD UNFOLLOWABLE USERS EMPTY SET???"));
        return resolve();
      }

      console.log(chalkLog("WAS | LOADED UNFOLLOWABLE USERS FILE"
        + " | " + unfollowableUserSetObj.userIds.length + " USERS"
        + " | " + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
      ));

      let query;
      let update;
      let numUnfollowed = 0;
      let numAlreadyUnfollowed = 0;

      async.eachSeries(unfollowableUserSetObj.userIds, function(userId, cb){

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
            console.log(chalkError("WAS | *** initUnfollowableUserSet | USER FIND ONE ERROR: " + err));
            return cb(err, userId);
          }
          
          if (userUpdated){

            numUnfollowed += 1;

            debug(chalkLog("WAS | XXX UNFOLLOW"
              + " [" + numUnfollowed + "/" + numAlreadyUnfollowed + "/" + unfollowableUserSetObj.userIds.length + "]"
              + " | " + userUpdated.nodeId
              + " | @" + userUpdated.screenName
              + " | " + userUpdated.name
            ));

            cb(null, userUpdated);
          }
          else {
            numAlreadyUnfollowed += 1;
            if (configuration.verbose){
              console.log(chalkLog("WAS | ... ALREADY UNFOLLOWED"
                + " [" + numUnfollowed + "/" + numAlreadyUnfollowed + "/" + unfollowableUserSetObj.userIds.length + "]"
                + " | ID: " + userId
              ));
            }
            cb(null, null);
          }
        });

      }, function(err){

        if (err) {
          return reject(err);
        }
        console.log(chalkBlue("WAS | INIT UNFOLLOWABLE USERS"
          + " | " + numUnfollowed + " NEW UNFOLLOWED"
          + " | " + numAlreadyUnfollowed + " ALREADY UNFOLLOWED"
          + " | " + unfollowableUserSet.size + " USERS IN SET"
          + " | " + unfollowableUserSetObj.userIds.length + " USERS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
        ));
        return resolve();
      });

    })
    .catch(function(err){
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("WAS | *** LOAD UNFOLLOWABLE USERS ERROR: FILE NOT FOUND:  " 
          + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
        ));
      }
      else {
        console.log(chalkError("WAS | *** LOAD UNFOLLOWABLE USERS ERROR: " + err));
      }
      console.error(err);
      reject(err);

    });

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

  console.log(chalk.blue("WAS | SOCKET CONNECT"
    + " | " + ipAddress
    + " | " + socketObj.namespace
    + " | " + socket.id
    + " | AD: " + statsObj.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | VW: " + statsObj.entity.viewer.connected
  ));

  // slackSendMessage(socketConnectText);

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

      console.log(chalkError("WAS | SERVER ERROR" 
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

      console.log(chalkError("WAS | VIEWER ERROR" 
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

    console.log(chalkAlert("WAS | XXX SOCKET DISCONNECT"
      + " | " + socketId
      + " | REASON: " + reason
    ));

    if (adminHashMap.has(socketId)) { 
      console.log(chalkAlert("WAS | XXX DELETED ADMIN" 
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

      console.log(chalkAlert("WAS | XXX SERVER DISCONNECTED" 
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
          console.log(chalkError("WAS | VIEWER CA ENTRY DELETE ERROR"
            + " | " + err
            + " | " + err
          ));
        }

        console.log(chalkAlert("WAS | -X- VIEWER DISCONNECTED" 
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
      console.log(chalkAlert("WAS | SESSION_KEEPALIVE USER UNDEFINED ??"
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
          console.log(chalkLog("WAS | ... KEEPALIVE AUTHENTICATED SOCKET"
            + " | " + socket.id
            + " | NSP: " + authSocketObj.namespace.toUpperCase()
            + " | USER ID: " + authSocketObj.userId
          ));
        }

        authSocketObj.ipAddress = ipAddress;
        authSocketObj.timeStamp = moment().valueOf();

        authenticatedSocketCache.set(socket.id, authSocketObj);

      }
      else {
        console.log(chalkAlert("WAS | *** KEEPALIVE UNAUTHENTICATED SOCKET | DISCONNECTING..."
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

        console.log(chalkInfo("WAS | R< KA"
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
          // sessionObj.stats = keepAliveObj.stats;
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
          // sessionObj.stats = keepAliveObj.stats;

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


        console.log(chalkInfo("WAS | R< KA"
          // + " | DELTA: " + deltaNS + " NS"
          + " | " + currentSessionType + " SERVER" 
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
          // sessionObj.stats = keepAliveObj.stats;
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
          // sessionObj.stats = keepAliveObj.stats;

          serverCache.set(socket.id, sessionObj);
          adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
          socket.emit("GET_STATS");
        }

      break;

      case "VIEWER" :

        console.log(chalkInfo("WAS | R< KA"
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
          // sessionObj.stats = keepAliveObj.stats;
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
          // sessionObj.stats = keepAliveObj.stats;

          viewerCache.set(socket.id, sessionObj);
          adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
        }
      break;

      default:
        console.log(chalkAlert("WAS | **** NOT SERVER ****"
          + " | SESSION TYPE: " + currentSessionType
          + "\n" + jsonPrint(keepAliveObj.user)
        ));
    }
  });

  socket.on("TWITTER_FOLLOW", function twitterFollow(user) {

    if (!user || (user === undefined)) {
      console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: NULL USER"));
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

    follow({user: user, forceFollow: true}, function(err, updatedUser){
      if (err) {
        console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: " + err));
        return;
      }

      if (!updatedUser) {
        console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: NULL UPDATED USER"));
        return;
      }

      console.log(chalk.blue("WAS | +++ TWITTER_FOLLOW"
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

    unfollow({user: user}, function(err, updatedUser){
      if (err) {
        console.log(chalkError("WAS | TWITTER_UNFOLLOW ERROR: " + err));
        return;
      }
      
      if (!updatedUser) { return; }

      adminNameSpace.emit("UNFOLLOW", updatedUser);
      utilNameSpace.emit("UNFOLLOW", updatedUser);

      console.log(chalk.blue("WAS | XXX TWITTER_UNFOLLOW"
        + " | UID" + updatedUser.nodeId
        + " | @" + updatedUser.screenName
      ));

    });

  });

  socket.on("TWITTER_IGNORE", function twitterIgnore(user) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    console.log(chalkSocket("R< TWITTER_IGNORE"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
      + " | UID: " + user.userId
      + " | @" + user.screenName
    ));

    ignore({user: user, socketId: socket.id}, function(err, updatedUser){
      if (err) {
        console.log(chalkError("WAS | TWITTER_IGNORE ERROR: " + err));
        return;
      }
      
      if (!updatedUser) { return; }

      adminNameSpace.emit("IGNORE", updatedUser);
      utilNameSpace.emit("IGNORE", updatedUser);

      console.log(chalk.blue("WAS | XXX TWITTER_IGNORE"
        + " | SID: " + socket.id
        + " | UID" + updatedUser.nodeId
        + " | @" + updatedUser.screenName
      ));

    });
  });

  socket.on("TWITTER_UNIGNORE", function twitterUnignore(user) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    console.log(chalkSocket("R< TWITTER_UNIGNORE"
      + " | " + getTimeStamp(timeStamp)
      + " | " + ipAddress
      + " | " + socket.id
      + " | UID: " + user.userId
      + " | @" + user.screenName
    ));

    unignore({user: user, socketId: socket.id}, function(err, updatedUser){
      if (err) {
        console.log(chalkError("WAS | TWITTER_UNIGNORE ERROR: " + err));
        return;
      }
      
      if (!updatedUser) { return; }

      adminNameSpace.emit("UNIGNORE", updatedUser);
      utilNameSpace.emit("UNIGNORE", updatedUser);

      console.log(chalk.blue("WAS | +++ TWITTER_UNIGNORE"
        + " | SID: " + socket.id
        + " | UID" + updatedUser.nodeId
        + " | @" + updatedUser.screenName
      ));

    });
  });

  socket.on("TWITTER_SEARCH_NODE", function (sn) {

    const timeStamp = moment().valueOf();

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    twitterSearchNodeQueue.push({searchNode: sn, socketId: socket.id});

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
        console.log(chalkError("WAS | CAT NODE ERROR: " + err));
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
            + " | LANG: " + updatedNodeObj.lang
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
        console.log(chalkError("WAS | *** USER_READY_ACK SEND ERROR | " + userObj.userId));
      }
      else {
        console.log(chalkError("WAS | TXD> USER_READY_ACK | " + userObj.userId));
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

    if (!userServerControllerReady || !statsObj.dbConnectionReady) {
      return callback(new Error("userServerController not ready"), null);
    }

    userServerController.findOne({user: defaultTwitterUser}, function(err, user){

      if (err) {
        console.log(chalkError("WAS | *** ERROR | VIEWER READY FIND USER"
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

    console.log(chalkAlert("WAS | LOGIN"
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

function initSocketNamespaces(params){

  return new Promise(function(resolve, reject){

    try {

      const timeStamp = moment().valueOf();

      console.log(chalkInfo(getTimeStamp(timeStamp) + " | INIT SOCKET NAMESPACES"));

      adminNameSpace = io.of("/admin");
      utilNameSpace = io.of("/util");
      userNameSpace = io.of("/user");
      viewNameSpace = io.of("/view");

      adminNameSpace.on("connect", function adminConnect(socket) {

        console.log(chalk.blue("WAS | ADMIN CONNECT " + socket.id));

        let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

        authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){

          if (authenticatedSocketObj){
            console.log(chalkAlert("WAS | ADMIN ALREADY AUTHENTICATED"
              + " | " + socket.id
              + " | " + authenticatedSocketObj.ipAddress
              + "\n" + jsonPrint(authenticatedSocketObj)
            ));
          }
          else {
            socket.on("authentication", function(data) {

              if (configuration.verbose) {
                console.log("WAS | RX SOCKET AUTHENTICATION"
                  + " | " + socket.nsp.name.toUpperCase()
                  + " | " + ipAddress
                  + " | " + socket.id
                  + " | USER ID: " + data.userId
                );
              }

              data.ipAddress = ipAddress;
              data.timeStamp = moment().valueOf();

              authenticatedSocketCache.set(socket.id, data);

              statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;

              initSocketHandler({namespace: "admin", socket: socket});

              socket.emit("authenticated", true);

            });
          }
        });
      });

      utilNameSpace.on("connect", function utilConnect(socket) {

        console.log(chalk.blue("WAS | UTIL CONNECT " + socket.id));

        let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

        authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
          if (authenticatedSocketObj){
            console.log(chalkAlert("WAS | UTIL ALREADY AUTHENTICATED"
              + " | " + socket.id
              + " | " + authenticatedSocketObj.ipAddress
              + "\n" + jsonPrint(authenticatedSocketObj)
            ));
          }
          else {
            socket.on("authentication", function(data) {

              if (configuration.verbose) {
                console.log("WAS | RX SOCKET AUTHENTICATION"
                  + " | " + socket.nsp.name.toUpperCase()
                  + " | " + ipAddress
                  + " | " + socket.id
                  + " | USER ID: " + data.userId
                );
              }

              data.ipAddress = ipAddress;
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
        console.log(chalk.blue("WAS | USER CONNECT " + socket.id));

        let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

        authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
          if (authenticatedSocketObj){
            console.log(chalkAlert("WAS | USER ALREADY AUTHENTICATED"
              + " | " + socket.id
              + " | " + authenticatedSocketObj.ipAddress
              + "\n" + jsonPrint(authenticatedSocketObj)
            ));
          }
        });

        initSocketHandler({namespace: "user", socket: socket});
      });

      viewNameSpace.on("connect", function viewConnect(socket) {

        let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

        console.log(chalk.blue("WAS | VIEWER CONNECT " + socket.id));

        authenticatedSocketCache.get(socket.id, function(err, authenticatedSocketObj){
          if (authenticatedSocketObj){
            console.log(chalkAlert("WAS | VIEWER ALREADY AUTHENTICATED"
              + " | " + socket.id
              + " | " + authenticatedSocketObj.ipAddress
              + "\n" + jsonPrint(authenticatedSocketObj)
            ));
          }
          else {
            socket.on("authentication", function(data) {

              console.log("WAS | RX SOCKET AUTHENTICATION"
                + " | " + socket.nsp.name.toUpperCase()
                + " | " + ipAddress
                + " | " + socket.id
                + " | USER ID: " + data.userId
              );

              data.ipAddress = ipAddress;
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

      resolve();
    }
    catch(err){
      console.log(chalkError("WAS | *** INIT SOCKET NAME SPACES ERROR: " + err));
      reject(err);
    }

  });
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

    debugCategory(chalk.blue("WAS | KW HIT WORD NODEID"
      + " | " + nodeObj.nodeId
      + " | CAT: " + nodeObj.category
      + " | CATA: " + nodeObj.categoryAuto
    ));

    async.parallel({
      overall: function(cb){
        nodesPerMinuteTopTermCache.get(nodeObj.nodeId, function topTermNodeId(err, nodeRate) {
          if (err){
            console.log(chalkError("WAS | nodesPerMinuteTopTermCache GET ERR: " + err));
            return cb(err);
          }
          if (nodeRate !== undefined) {

            debugCategory(chalkLog("WAS | TOP TERM"
              + " | " + nodeObj.nodeId 
              + " | " + nodeRate.toFixed(3)
            ));

            nodeObj.isTopTerm = true;
          }
          else {
            nodeObj.isTopTerm = false;
          }

          cb();

        });
      },
      nodeType: function(cb){
        nodesPerMinuteTopTermNodeTypeCache[nodeObj.nodeType].get(nodeObj.nodeId, function topTermNodeId(err, nodeRate) {
          if (err){
            console.log(chalkError("WAS | nodesPerMinuteTopTermNodeTypeCache" + nodeObj.nodeType + " GET ERR: " + err));
            return cb(err);
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

          cb();        

        });    
      }
    },
    function(err, results){
      if (err) {
        console.log(chalkError("WAS | *** processCheckCategory ERROR: " + err));
        return callback(err, null);
      }
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
      console.log(chalk.blue("WAS | DEFAULT | checkCategory\n" + jsonPrint(nodeObj)));
      callback(null, nodeObj);
  }
}

function updateTrends(currentThreeceeUser){

  if ( !currentThreeceeUser
    || (threeceeTwitter[currentThreeceeUser] === undefined)
    || threeceeTwitter[currentThreeceeUser].ready)
  {
    
    if (!statsObj.twitNotReadyWarning) {

      console.log(chalkError("WAS | *** updateTrends | TWIT NOT READY"
        + " | CURRENT 3C USER: @" + currentThreeceeUser
      ));

      statsObj.twitNotReadyWarning = true;
    }

    return;
  }

  statsObj.twitNotReadyWarning = false;

  console.log(chalkLog("WAS | UPDATE TWITTER TRENDS"
    + " | CURRENT 3C USER: @" + currentThreeceeUser
  ));

  threeceeTwitter[currentThreeceeUser].twit.get("trends/place", {id: 1}, function updateTrendsWorldWide (err, data, response){

    if (err){
      console.log(chalkError("WAS | *** TWITTER GET trends/place ID=1 ERROR ***"
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
      console.log(chalkError("WAS | *** TWITTER GET trends/place ID=23424977 ERROR ***"
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

async function initUpdateTrendsInterval(interval){

  console.log(chalk.bold.black("WAS | INIT UPDATE TRENDS INTERVAL: " + msToTime(interval)));


  try {

    clearInterval(updateTrendsInterval);

    let currentThreeceeUser = await getCurrentThreeceeUser();

    if (currentThreeceeUser 
      && (threeceeTwitter[currentThreeceeUser] !== undefined) 
      && threeceeTwitter[currentThreeceeUser].ready) { 
      updateTrends(); 
    }

    updateTrendsInterval = setInterval(async function updateTrendsIntervalCall () {

      try {
        let c3user = await getCurrentThreeceeUser();

        if (c3user && (threeceeTwitter[c3user] !== undefined) && threeceeTwitter[c3user].ready) { 
          updateTrends(c3user); 
        }

      }
      catch(err){
        console.log(chalkError("WAS | *** INIT UPDATE TRENDS INTERVAL ERROR: " + err));
      }

    }, interval);

  }
  catch(err){
    console.log(chalkError("WAS | *** INIT UPDATE TRENDS INTERVAL ERROR: " + err));
  }
}

function updateNodeMeter(node, callback){

  const nodeType = node.nodeType;

  if (!configuration.metrics.nodeMeterEnabled) { return callback(null, node); }

  if (node.nodeId === undefined) {
    console.log(chalkError("WAS | NODE ID UNDEFINED\n" + jsonPrint(node)));
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

  return new Promise(function(resolve, reject){

    const termsArray = Array.from(followableSearchTermSet);

    followableSearchTermString = termsArray.join("|");

    followableRegEx = new RegExp(followableSearchTermString, "gi");

    debug(chalkInfo("followableRegEx: " + followableRegEx));

    console.log(chalkLog("WAS | FOLLOWABLE SEARCH TERM REGEX INITIALIZED"
      + " | " + followableSearchTermSet.size + " SEARCH TERMS"
    ));

    resolve();

  });
}

let categorizeableFlag = false;
let userCategorizeable = function(user){

  if (user.nodeType !== "user") { return false; }
  if (ignoredUserSet.has(user.nodeId)) { return false; }
  // if (user.categoryAuto !== undefined && user.categoryAuto) { return false; }
  if (user.following) { 
    if ((user.description === undefined) || !user.description) { user.description = ""; }
    if ((user.screenName === undefined) || !user.screenName) { user.screenName = ""; }
    if ((user.name === undefined) || !user.name) { user.name = ""; }
    categorizeableUserSet.add(user.nodeId);
    return true;
  }
  if (user.followersCount !== undefined && (user.followersCount < configuration.minFollowersAuto)) { return false; }
  if (user.lang !== undefined && user.lang !== "en") { 
    ignoredUserSet.add(user.nodeId);
    unfollowableUserSet.add(user.nodeId);
    console.log(chalkBlue("WAS | XXX UNCATEGORIZEABLE | USER LANG NOT ENGLISH: " + user.lang));
    return false;
  }

  if ((user.description === undefined) || !user.description) { user.description = ""; }
  if ((user.screenName === undefined) || !user.screenName) { user.screenName = ""; }
  if ((user.name === undefined) || !user.name) { user.name = ""; }

  if (followableRegEx === undefined) { return false; }

  categorizeableFlag = followableRegEx.test(user.description)
    || followableRegEx.test(user.screenName) 
    || followableRegEx.test(user.name);

  if (categorizeableFlag) { categorizeableUserSet.add(user.nodeId); }

  return categorizeableFlag;
};

let followableFlag = false;
let userFollowable = function(user){

  if (user.nodeType !== "user") { return false; }
  if (user.ignored !== undefined && user.ignored) { return false; }
  if (user.following !== undefined && user.following) { return false; }
  if (followedUserSet.has(user.nodeId)) { return false; }
  if (ignoredUserSet.has(user.nodeId)) { return false; }
  if (unfollowableUserSet.has(user.nodeId)) { return false; }
  if (user.category !== undefined && user.category) { return false; }
  if (user.followersCount !== undefined && (user.followersCount < configuration.minFollowersAuto)) { return false; }
  if (user.lang !== undefined && user.lang !== "en") { 
    ignoredUserSet.add(user.nodeId);
    unfollowableUserSet.add(user.nodeId);
    console.log(chalkBlue("WAS | XXX UNFOLLOWABLE | LANG NOT EN: " + user.lang + " | IG: " + ignoredUserSet.size));
    return false;
  }

  if ((user.description === undefined) || !user.description) { user.description = ""; }
  if ((user.screenName === undefined) || !user.screenName) { user.screenName = ""; }
  if ((user.name === undefined) || !user.name) { user.name = ""; }

  if (followableRegEx !== undefined) {

    followableFlag = followableRegEx.test(user.description)
      || followableRegEx.test(user.screenName) 
      || followableRegEx.test(user.name);

    if (followableFlag) { followableUserSet.add(user.nodeId); }
    return followableFlag;
  }

  return false;

};

function getCurrentThreeceeUser(params){

  return new Promise(function(resolve, reject){

    try{

      debug(chalkTwitter("WAS | getCurrentThreeceeUser 3C USERS\n" + jsonPrint(threeceeTwitter)));

      if (!statsObj.threeceeUsersConfiguredFlag) {
        if (configuration.verbose ){ console.log(chalkAlert("WAS | *** THREECEE_USERS NOT CONFIGURED")); }
        statsObj.currentThreeceeUser = false;
        return reject(false);
      }

      if (configuration.threeceeUsers.length === 0){
        console.log(chalkAlert("WAS | ??? NO THREECEE_USERS ???"));
        statsObj.currentThreeceeUser = false;
        return reject(false);
      }

      async.eachSeries(configuration.threeceeUsers, function(threeceeUser, cb){

        if ((threeceeTwitter[threeceeUser] !== undefined) && threeceeTwitter[threeceeUser].ready) {

          debug(chalkTwitter("WAS | IN getCurrentThreeceeUser 3C USER"
            + " | @" + threeceeUser + " READY"
          ));

          return cb(threeceeUser);
        }

        debug(chalkTwitter("WAS | IN getCurrentThreeceeUser 3C USER"
          + " | @" + threeceeUser + " NOT READY"
        ));

        cb();

      }, function(threeceeUser){

        if (threeceeUser) { 

          statsObj.currentThreeceeUser = threeceeUser;

          debug(chalkTwitter("WAS | getCurrentThreeceeUser 3C USER"
            + " | 3C USERS: " + configuration.threeceeUsers
            + " | @" + statsObj.currentThreeceeUser
          ));

        }
        else {


          if (statsObj.currentThreeceeUser) {

            statsObj.currentThreeceeUser = false;

            console.log(chalkAlert("WAS | getCurrentThreeceeUser 3C USER"
              + " | 3C USERS: " + configuration.threeceeUsers
              + " | NONE READY"
            ));
          }

        }

        resolve(statsObj.currentThreeceeUser);

      });

    }
    catch(err){
      reject(err);
    }

  });
}

function updateUserSets(params){

  return new Promise(function(resolve, reject){

    let calledBack = false;

    if (!statsObj.dbConnectionReady) {
      console.log(chalkAlert("WAS | ABORT updateUserSets: DB CONNECTION NOT READY"));
      calledBack = true;
      return reject(new Error("DB CONNECTION NOT READY"));
    }

    const userCollection = global.dbConnection.collection("users");

    userCollection.countDocuments(function(err, count){

      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT DOCS ERROR: " + err));
        calledBack = true;
        return reject(err);
      }

      statsObj.user.total = count;
      console.log(chalkBlue("WAS | GRAND TOTAL USERS IN DB: " + statsObj.user.total));
    });

    userCollection.countDocuments({"following": true}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT FOLLOWING ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.following = count;
      console.log(chalkBlue("WAS | TOTAL FOLLOWING USERS IN DB: " + statsObj.user.following));
    });

    userCollection.countDocuments({"ignored": true}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT IGNORED ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.ignored = count;
      console.log(chalkBlue("WAS | TOTAL IGNORED USERS IN DB: " + statsObj.user.ignored));
    });

    userCollection.countDocuments({"following": false}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT NOT FOLLOWING ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.notFollowing = count;
      console.log(chalkBlue("WAS | TOTAL NOT FOLLOWING USERS IN DB: " + statsObj.user.notFollowing));
    });

    userCollection.countDocuments({category: { "$nin": [ false, "false", null ] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT CAT MAN ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.categorizedManual = count;
      console.log(chalkBlue("WAS | TOTAL CATEGORIZED MANUAL USERS IN DB: " + statsObj.user.categorizedManual));
    });

    userCollection.countDocuments({category: { "$in": [ false, "false", null ] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT UNCAT MAN ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.uncategorizedManual = count;
      console.log(chalkBlue("WAS | TOTAL UNCATEGORIZED MANUAL USERS IN DB: " + statsObj.user.uncategorizedManual));
    });

    userCollection.countDocuments({categoryAuto: { "$nin": [ false, "false", null ] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT CAT AUTO ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.categorizedAuto = count;
      console.log(chalkBlue("WAS | TOTAL CATEGORIZED AUTO USERS IN DB: " + statsObj.user.categorizedAuto));
    });

    userCollection.countDocuments({categoryAuto: { "$in": [ false, "false", null ] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT UNCAT AUTO ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.uncategorizedAuto = count;
      console.log(chalkBlue("WAS | TOTAL UNCATEGORIZED AUTO USERS IN DB: " + statsObj.user.uncategorizedAuto));
    });

    const followingSearchQuery = { following: true, ignored: false };
    
    userFollowingCursor = User.find(followingSearchQuery).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

    userFollowingCursor.on("data", function(user) {

      if (!ignoredUserSet.has(user.nodeId) && !unfollowableUserSet.has(user.nodeId) && user.lang && (user.lang !== undefined) && (user.lang !== "en")){
        ignoredUserSet.add(user.nodeId);
        unfollowableUserSet.add(user.nodeId);
        printUserObj(
          "LANG NOT ENGLISH: " + user.lang 
          + " | IGNORE+UNFOLLOW [ IG: " + ignoredUserSet.size + " | UF: " + unfollowableUserSet.size + "]", 
          user, 
          chalkAlert
        );
      }

      if (!uncategorizedManualUserSet.has(user.nodeId) && !user.category && !ignoredUserSet.has(user.nodeId)) { 

        uncategorizedManualUserSet.add(user.nodeId);

        if (uncategorizedManualUserSet.size % 100 === 0) {
          printUserObj("UNCAT MAN USER  [" + uncategorizedManualUserSet.size + "]", user);
        }

      }

      if (!uncategorizedAutoUserSet.has(user.nodeId) && !user.categoryAuto && !ignoredUserSet.has(user.nodeId)) { 

        uncategorizedAutoUserSet.add(user.nodeId);

        if (uncategorizedAutoUserSet.size % 100 === 0) {
          printUserObj("UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", user);
        }

      }
      
      if (!ignoredUserSet.has(user.nodeId) 
        && ((user.category === "left") || (user.category === "neutral") || (user.category === "right"))
        && ((user.categoryAuto === "left") || (user.categoryAuto === "neutral") || (user.categoryAuto === "right"))
      ) { 

        uncategorizedManualUserSet.delete(user.nodeId); 
        uncategorizedAutoUserSet.delete(user.nodeId); 

        categorizedManualUserSet.add(user.nodeId); 
        categorizedAutoUserSet.add(user.nodeId); 

        if (!mismatchUserSet.has(user.nodeId) && (user.category !== user.categoryAuto)) {

          mismatchUserSet.add(user.nodeId); 
          matchUserSet.delete(user.nodeId); 

          if (mismatchUserSet.size % 100 === 0) {
            printUserObj("MISMATCHED USER [" + mismatchUserSet.size + "]", user);
          }
        }

        if (!matchUserSet.has(user.nodeId) && (user.category === user.categoryAuto)) {

          matchUserSet.add(user.nodeId); 
          mismatchUserSet.delete(user.nodeId); 

          if (matchUserSet.size % 100 === 0) {
            printUserObj("MATCHED USER [" + matchUserSet.size + "]", user);
          }
        }


      }

    });

    userFollowingCursor.on("end", function() {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];
      mismatchUserArray = mismatchUserSet.keys();

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;
      statsObj.user.matched = matchUserSet.size;
      statsObj.user.mismatched = mismatchUserSet.size;

      console.log(chalkBlue("WAS | END FOLLOWING CURSOR | FOLLOWING USER SET"));
      console.log(chalkBlue("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

      if (!calledBack) { 
        calledBack = true;
        return resolve();
      }
    });

    userFollowingCursor.on("error", function(err) {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];
      mismatchUserArray = mismatchUserSet.keys();

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;
      statsObj.user.matched = matchUserSet.size;
      statsObj.user.mismatched = mismatchUserSet.size;

      console.error(chalkError("*** ERROR userFollowingCursor: " + err));
      console.log(chalkAlert("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

      if (!calledBack) { 
        calledBack = true;
        return reject(err);
      }
    });

    userFollowingCursor.on("close", function() {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];
      mismatchUserArray = mismatchUserSet.keys();

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;
      statsObj.user.matched = matchUserSet.size;
      statsObj.user.mismatched = mismatchUserSet.size;

      console.log(chalkBlue("WAS | CLOSE FOLLOWING CURSOR"));
      console.log(chalkBlue("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

      if (!calledBack) { 
        calledBack = true;
        return resolve();
      }
    });

  });
}

function initTransmitNodeQueueInterval(interval){

  console.log(chalk.bold.black("WAS | INIT TRANSMIT NODE QUEUE INTERVAL: " + msToTime(interval)));

  clearInterval(transmitNodeQueueInterval);

  let nodeObj;
  let followable;
  let categorizeable;
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
            console.log(chalkError("WAS | *** CHECK CATEGORY ERROR: " + err));
            return; 
          }

          updateNodeMeter(node, function updateNodeMeterCallback(err, n){

            if (err) {
              console.log(chalkError("WAS | ERROR updateNodeMeter: " + err
                + " | TYPE: " + node.nodeType
                + " | NID: " + node.nodeId
              ));
              delete node["_id"];
              delete node["userId"];
              viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));

              transmitNodeQueueReady = true;

            }
            else {

              followable = userFollowable(n);
              categorizeable = userCategorizeable(n);

              if (followable) {
                if (!n.category && !uncategorizedManualUserSet.has(n.nodeId)) { 
                  uncategorizedManualUserSet.add(n.nodeId);
                  if (uncategorizedManualUserSet.size % 100 === 0) {
                    printUserObj("UNCAT MAN USER [" + uncategorizedManualUserSet.size + "]", n);
                  }
                }
                if (!n.categoryAuto && !uncategorizedAutoUserSet.has(n.nodeId)) { 
                  uncategorizedAutoUserSet.add(n.nodeId);
                  if (uncategorizedAutoUserSet.size % 100 === 0) {
                    printUserObj("UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", n);
                  }
                }

                follow({user: n}, function(err, updatedUser){
                  if (err) {
                    console.log(chalkError("WAS | TWITTER AUTO FOLLOW ERROR: " + err));
                  }
                  else if (!updatedUser) {
                    console.log(chalkError("WAS | TWITTER AUTO FOLLOW ERROR: NULL UPDATED USER"));
                  }
                  else {
                    console.log(chalk.blue("WAS | +++ TWITTER AUTO FOLLOW"
                      + " | UID" + updatedUser.nodeId
                      + " | @" + updatedUser.screenName
                    ));
                  }
                });

              }

              if (categorizeable) {

                if (!n.category && !uncategorizedManualUserSet.has(n.nodeId)) { 
                  uncategorizedManualUserSet.add(n.nodeId);
                  if (uncategorizedManualUserSet.size % 100 === 0) {
                    printUserObj("UNCAT MAN USER [" + uncategorizedManualUserSet.size + "]", n);
                  }
                }

                if (!n.categoryAuto && !uncategorizedAutoUserSet.has(n.nodeId)) { 
                  uncategorizedAutoUserSet.add(n.nodeId);
                  if (uncategorizedAutoUserSet.size % 100 === 0) {
                    printUserObj("UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", n);
                  }
                }

                if (tfeChild !== undefined) { 
                  tfeChild.send({op: "USER_CATEGORIZE", user: n});
                }
              }

              if ((n.nodeType === "user") && (n.category || n.categoryAuto || n.following || n.threeceeFollowing)){

                nCacheObj = nodeCache.get(n.nodeId);

                if (nCacheObj) {
                  n.mentions = Math.max(n.mentions, nCacheObj.mentions);
                  n.setMentions = true;
                }

                n.updateLastSeen = true;

                if (!userServerControllerReady || !statsObj.dbConnectionReady) {
                  return callback(new Error("userServerController not ready"), null);
                  transmitNodeQueueReady = true;
                }

                userServerController.findOneUser(n, {noInc: false, fields: fieldsTransmit}, function(err, updatedUser){
                  if (err) {
                    console.log(chalkError("WAS | findOneUser ERROR" + jsonPrint(err)));
                    delete n["_id"];
                    delete n["userId"];
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else {
                    delete n["_id"];
                    delete n["userId"];
                    viewNameSpace.volatile.emit("node", updatedUser);
                  }

                  transmitNodeQueueReady = true;

                });
              }
              else if (n.nodeType === "user") {
                delete n["_id"];
                delete n["userId"];
                viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));

                transmitNodeQueueReady = true;

              }
              else if ((n.nodeType === "hashtag") && n.category){

                n.updateLastSeen = true;

                hashtagServerController.findOneHashtag(n, {noInc: false}, function(err, updatedHashtag){
                  if (err) {
                    console.log(chalkError("WAS | updatedHashtag ERROR\n" + jsonPrint(err)));
                    delete n["_id"];
                    delete n["userId"];
                    viewNameSpace.volatile.emit("node", n);
                  }
                  else if (updatedHashtag) {
                    delete n["_id"];
                    delete n["userId"];
                    viewNameSpace.volatile.emit("node", updatedHashtag);
                  }
                  else {
                    delete n["_id"];
                    delete n["userId"];
                    viewNameSpace.volatile.emit("node", n);
                  }

                  transmitNodeQueueReady = true;

                });
              }
              else if (n.nodeType === "hashtag") {
                delete n["_id"];
                delete n["userId"];
                viewNameSpace.volatile.emit("node", n);
                transmitNodeQueueReady = true;

              }
              else {
                transmitNodeQueueReady = true;
              }

            }

          });
        });
      }
    }

  }, interval);
}

function transmitNodes(tw, callback){

  // if (configuration.verbose) {
  //   console.log("WAS | TX NODES | TW ID: " + tw.tweetId + " | @" + tw.user.screenName);
  // }

  async.parallel({
    user: function(cb){
      if (tw.user && !ignoredUserSet.has(tw.user.nodeId)) { transmitNodeQueue.push(tw.user); }
      cb();
    },
    userMentions: function(cb){
      tw.userMentions.forEach(function userMentionsTxNodeQueue(user){
        if (user && configuration.enableTransmitUser && !ignoredUserSet.has(user.nodeId)) { transmitNodeQueue.push(user); }
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
  function(err){
    if (err) {
      console.log(chalkError("WAS | *** TRANSMIT NODES ERROR: " + err));
      return callback(err);
    }
    callback();
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
    + " | " + getTimeStamp() 
    + " | ST: " + getTimeStamp(parseInt(statsObj.startTime)) 
    + " | UP: " + msToTime(statsObj.upTime) 
    + " | RN: " + msToTime(statsObj.runTime) 
    + " | MEM: " + memoryAvailableMB.toFixed(0) + " AVAIL"
    + " / " + memoryTotalMB.toFixed(0) + " TOTAL MB"
    + " - " + memoryAvailablePercent.toFixed(3) + " %"
  ));
}

let dropboxFolderGetLastestCursorReady = true;

function getChallengeResponse(crc_token, consumer_secret) {
  const hmac = crypto.createHmac("sha256", consumer_secret).update(crc_token).digest("base64");
  return hmac;
}

function touchUsersZipUpdateFlag(params){
  console.log(chalkLog("WAS | TOUCH FILE: " + usersZipUpdateFlagFile));
  touch.sync(usersZipUpdateFlagFile, { force: true });
  return;
}

function initAppRouting(callback) {

  console.log(chalkInfo(getTimeStamp() + " | INIT APP ROUTING"));

  // app.get("/login_auth",
  //   passport.authenticate("local", { 
  //     successReturnToOrRedirect: "/session",
  //     failureRedirect: "/login"
  //   })
  // );

  app.post(TWITTER_WEBHOOK_URL, function requestTwitterWebhook(req, res) {

    console.log(chalk.bold.blue("WAS | R< TWITTER WEB HOOK | " + TWITTER_WEBHOOK_URL
      + " | CRC TOKEN: " + req.query.crc_token
    ));

    const hmac = getChallengeResponse(req.query.crc_token, threeceeConfig.consumer_secret);

    const response_token = "sha256=" + Buffer.from(hmac).toString('base64');

    console.log(chalk.bold.blue("WAS | T> TWITTER WEB HOOK RES TOKEN"
      + " | " + response_token
    ));

    const response = { "response_token" : response_token };

    res.send(response);
  });

  app.use(methodOverride());

  app.use(function requestLog(req, res, next) {

    if (req.path === "/json") {
      if (!ignoreIpSet.has(req.ip)) {
        console.log(chalkInfo("WAS | R< REJECT: /json"
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

      if (configuration.verbose) {

        console.log(chalkInfo("WAS | R< DROPBOX WEB HOOK | /dropbox_webhook"
          + " | DB CURSOR READY: " + dropboxFolderGetLastestCursorReady
        )); 

        debug(chalkInfo("WAS | R< dropbox_webhook"
          + "\nreq.query\n" + jsonPrint(req.query)
          + "\nreq.params\n" + jsonPrint(req.params)
          + "\nreq.body\n" + jsonPrint(req.body)
        )); 
      }

      res.send(req.query.challenge);

      next();

      let dropboxCursorFolderArray = configuration.dropboxChangeFolderArray;

      if (dropboxFolderGetLastestCursorReady) {

        dropboxFolderGetLastestCursorReady = false;

        async.each(dropboxCursorFolderArray, function(folder, cb){

            dropboxFolderGetLastestCursor(folder, function(err, response){

              if (err) {
                console.log(chalkError("WAS | *** DROPBOX GET LATEST CURSOR ERROR: " + err));
                return cb(err);
              }
              
              if (response && (response.entries.length > 0)) {

                setTimeout(function(){

                  console.log(chalk.bold.black("WAS | >>> DROPBOX CHANGE"
                    + " | " + getTimeStamp()
                    + " | FOLDER: " + folder
                  ));

                  // response.entries.forEach(function(entry){
                  async.eachSeries(response.entries, function(entry, cb1){

                    console.log(chalk.green("WAS | >>> DROPBOX CHANGE | PATH LOWER: " + entry.path_lower));

                    if ((entry.path_lower.endsWith("google_wordassoserverconfig.json"))
                      || (entry.path_lower.endsWith("default_wordassoserverconfig.json"))){
                      initConfig(configuration);
                      cb1();
                    }

                    else if (entry.path_lower.endsWith("users.zip")){
                      touchUsersZipUpdateFlag();
                      cb1();
                    }

                    else if (entry.path_lower.endsWith(bestRuntimeNetworkFileName.toLowerCase())){
                      loadBestRuntimeNetwork()
                      .then(function(){
                        cb1();
                      })
                      .catch(function(err){
                        cb1(err);
                      });
                    }

                    else if (entry.path_lower.endsWith(maxInputHashMapFile)){

                      setTimeout(function(){

                        loadMaxInputHashMap()
                        .then(function(){
                          configEvents.emit("NEW_MAX_INPUT_HASHMAP");
                          cb1();
                        })
                        .catch(function(err){
                          cb1(err);
                        });

                      }, 10*ONE_SECOND);
                    }

                    else if (entry.path_lower.endsWith("defaultsearchterms.txt")){
                      updateSearchTerms();
                      cb1();
                    }

                    else if (entry.path_lower.endsWith("followablesearchterm.txt")){
                      initFollowableSearchTermSet();
                      cb1();
                    }

                    else if ((entry.path_lower.endsWith("google_twittersearchstreamconfig.json"))
                      || (entry.path_lower.endsWith("default_twittersearchstreamconfig.json"))){

                      killTssChildren()
                      .then(function(){
                        initTssChildren();
                        cb1();
                      })
                      .catch(function(err){
                        cb1(err);
                      });
                    }

                    else {
                      cb1();
                    }

                  }, function(err){
                    if (err) {
                      return cb(err);
                    }
                    cb();
                  });

                }, configuration.dropboxWebhookChangeTimeout);

              }
              else {
                setTimeout(function(){ 
                  cb(); 
                }, configuration.dropboxWebhookChangeTimeout);
              }
            });

        }, function(err){
          if (err) {
            console.log(chalkError("WAS | *** DROPBOX WEBHOOK ERROR: " + err));
          }
          console.log(chalkLog("WAS | END DROPBOX WEBHOOK"));
          dropboxFolderGetLastestCursorReady = true;
          // next();
        });
      }
      else {
        debug(chalkAlert("WAS | SKIP DROPBOX WEBHOOK ... NOT READY"));
        // next();
      }
    }
    else if (req.path === "/googleccd19766bea2dfd2.html") {
      console.log(chalk.green("WAS | R< googleccd19766bea2dfd2.html")); 

      const googleVerification = __dirname + "/googleccd19766bea2dfd2.html";

      res.sendFile(googleVerification, function googleVerify(err) {
        if (err) {
          console.log(chalkError("WAS | GET /googleccd19766bea2dfd2.html ERROR:"
            + " | " + getTimeStamp()
            + " | " + req.url
            + " | " + googleVerification
            + " | " + err
          ));
        } 
        else {
          console.log(chalkInfo("WAS | SENT:", googleVerification));
        }
      });
    }
    else if (req.path === "/") {
      console.log(chalkLog("WAS | R< REDIRECT /session")); 
      res.redirect("/session");
    }
    else if (req.path === "/categorize"){
      console.log(chalkLog("WAS | R< CATEGORIZE"
        + " | req.query: " + jsonPrint(req.query)
        + " | req.params: " + jsonPrint(req.params)
      ));
      res.sendStatus(200);
    }
    else {
      console.log(chalkInfo("WAS | R<"
        + " | " + getTimeStamp()
        + " | IP: " + req.ip
        + " | HOST: " + req.hostname
        + " | METHOD: " + req.method
        + " | PATH: " + req.path
      ));
      next();
    }
  });

  app.use(express.static(__dirname + "/"));
  app.use(express.static(__dirname + "/js"));
  app.use(express.static(__dirname + "/css"));
  app.use(express.static(__dirname + "/node_modules"));
  app.use(express.static(__dirname + "/public/assets/images"));

  const adminHtml = __dirname + "/admin/admin.html";

  app.get("/admin", function requestAdmin(req, res) {

    debug(chalkInfo("get req\n" + req));

    console.log(chalkLog("WAS | LOADING PAGE"
      + " | IP: " + req.ip
      + " | REQ: " + req.url
      + " | RES: " + adminHtml
    ));

    res.sendFile(adminHtml, function responseAdmin(err) {
      if (err) {
        console.log(chalkError("WAS | GET /admin ERROR:"
          + " | " + getTimeStamp()
          + " | IP: " + req.ip
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

    console.log(chalkAlert("WAS | LOADING PAGE"
      + " | IP: " + req.ip
      + " | REQ: " + req.url
      + " | RES: " + loginHtml
    ));

    res.sendFile(loginHtml, function responseSession(err) {
      if (err) {
        console.log(chalkError("WAS | GET /login ERROR:"
          + " | " + getTimeStamp()
          + " | " + req.url
          + " | " + loginHtml
          + " | " + err
        ));
      } 
      else {
        console.log(chalkAlert("SENT:", loginHtml));
      }
    });
  });

  // const loginAuth = __dirname + "/login_auth.js";

  // app.get("/login", function requestSession(req, res, next) {

  //   debug(chalkInfo("get next\n" + next));

  //   console.log(chalkLog("WAS | LOADING PAGE"
  //     + " | REQ: " + req.url
  //     + " | RES: " + loginAuth
  //   ));

  //   res.sendFile(loginAuth, function responseSession(err) {
  //     if (err) {
  //       console.log(chalkError("WAS | GET /login_auth ERROR:"
  //         + " | " + getTimeStamp()
  //         + " | " + req.url
  //         + " | " + loginAuth
  //         + " | " + err
  //       ));
  //     } 
  //     else {
  //       debug(chalkInfo("SENT:", loginHtml));
  //     }
  //   });
  // });

  const sessionHtml = __dirname + "/sessionModular.html";

  app.get("/session", function requestSession(req, res, next) {

    debug(chalkInfo("get next\n" + next));

    debug("req");
    debug(req);

    console.log(chalkLog("WAS | LOADING PAGE"
      // + " [ VIEWS: " + req.session.views + "]"
      + " | IP: " + req.ip
      + " | REQ: " + req.url
      + " | RES: " + sessionHtml
    ));

    res.sendFile(sessionHtml, function responseSession(err) {
      if (err) {
        console.log(chalkError("WAS | GET /session ERROR:"
          + " | " + getTimeStamp()
          + " | IP: " + req.ip
          + " | " + req.url
          + " | " + sessionHtml
          + " | " + err
        ));
      } 
      else {
        if (configuration.verbose) {
          console.log(chalkInfo("SENT:", sessionHtml));
        }
      }
    });
  });

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
      console.log(chalk.green("WAS | PASSPORT TWITTER AUTHENTICATED"));
      // slackSendMessage("PASSPORT TWITTER AUTHENTICATED");
      return next();
    }
    console.log(chalkAlert("WAS | *** PASSPORT TWITTER *NOT* AUTHENTICATED ***"));
    // slackSendMessage("PASSPORT TWITTER AUTHENTICATION FAILED");
  }

  app.get("/account", ensureAuthenticated, function(req, res){

    console.log(chalkError("WAS | PASSPORT TWITTER AUTH USER\n" + jsonPrint(req.session.passport.user)));  // handle errors
    console.log(chalkError("WAS | PASSPORT TWITTER AUTH USER"
      + " | IP: " + req.ip
      + " | @" + req.session.passport.user.screenName
      + " | UID" + req.session.passport.user.nodeId
    ));  // handle errors

    // slackSendMessage("PASSPORT TWITTER AUTH USER: @" + req.session.passport.user.screenName);
    if (!userServerControllerReady || !statsObj.dbConnectionReady) {
      return callback(new Error("userServerController not ready"), null);
    }

    userServerController.findOne({ user: req.session.passport.user}, function(err, user) {
      if(err) {
        console.log(chalkError("WAS | *** ERROR TWITTER AUTHENTICATION: " + jsonPrint(err)));  // handle errors
        res.redirect("/504.html");
      } 
      else if (user) {
        console.log(chalk.green("TWITTER USER AUTHENTICATED: @" + user.screenName));  // handle errors
        // slackSendMessage("USER AUTH: @" + user.screenName);
        authenticatedTwitterUserCache.set(user.nodeId, user);
        res.redirect("/after-auth.html");
      }
      else {
        console.log(chalkAlert("WAS | *** TWITTER USER AUTHENTICATE FAILED"
          + " | @" + req.session.passport.user.screenName + " NOT FOUND"));
        res.redirect("/504.html");
      }
    });
  });

  app.get("/auth/twitter/error", function(req, res){
    console.log(chalkAlert("WAS | PASSPORT AUTH TWITTER ERROR"));
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
        console.log(chalkError("WAS | testClient ERROR " + jsonPrint(err)));
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


  return new Promise(function(resolve, reject){

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

    resolve();

  });

}

function initTwitterRxQueueInterval(interval){

  let tweet = {};

  if (typeof interval !== "number") {
    throw new Error("initTwitterRxQueueInterval interval NOT a NUMBER: " + interval);
  }

  console.log(chalk.bold.black("WAS | INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(tweetRxQueueInterval);

  tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

    if ((tweetRxQueue.length > 0) && statsObj.tweetParserReady) {

      tweet = tweetRxQueue.shift();

      childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send({ op: "tweet", tweetStatus: tweet });

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

  if (typeof interval !== "number") {
    throw new Error("initTweetParserMessageRxQueueInterval interval NOT a NUMBER: " + interval);
  }

  console.log(chalk.bold.black("WAS | INIT TWEET PARSER MESSAGE RX QUEUE INTERVAL | " + msToTime(interval)));

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
          console.log(chalkAlert("WAS | parsedTweet -- TW USER UNDEFINED"
            + " | " + tweetObj.tweetId
          ));
          tweetParserMessageRxQueueReady = true;
        }
        else {

          debug(chalkInfo("WAS | PARSED TW"
            + " [ TPMRQ: " + tweetParserMessageRxQueue.length + "]"
            + " | " + tweetObj.tweetId
            + " | USR: " + tweetObj.user.screenName
            + " | EJs: " + tweetObj.emoji.length
            + " | Hs: " + tweetObj.hashtags.length
            + " | Hs: " + tweetObj.images.length
            + " | LCs: " + tweetObj.locations.length
            + " | Ms: " + tweetObj.mentions.length
            + " | PLs: " + tweetObj.places.length
            + " | ULs: " + tweetObj.urls.length
            + " | UMs: " + tweetObj.userMentions.length
            + " | WDs: " + tweetObj.words.length
          ));


          if (dbuChild && statsObj.dbuChildReady && (followableUserSet.has(tweetObj.user.nodeId) || categorizeableUserSet.has(tweetObj.user.nodeId))) {
            dbuChild.send({op: "TWEET", tweetObj: tweetObj});
          }

          if (transmitNodeQueue.length < configuration.maxQueue) {

            transmitNodes(tweetObj, function transmitNode(err){
              if (err) {
                console.log(chalkError("WAS | TRANSMIT NODES ERROR\n" + err));
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
        console.log(chalkError("WAS | *** TWEET PARSER UNKNOWN OP"
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

  console.log(chalk.bold.black("WAS | INIT SORTER RX MESSAGE QUEUE INTERVAL | " + msToTime(interval)));

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
          console.log(chalkError("WAS | ??? SORTER UNKNOWN OP\n" + jsonPrint(sorterObj)));
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

  console.log(chalkInfo("WAS | INIT KEY SORT INTERVAL: " + msToTime(interval)));

  clearInterval(keySortInterval);

  keySortReady = true;

  let keySortParams;

  keySortInterval = setInterval(function(){

    if (keySortReady && (keySortQueue.length > 0)) {

      keySortReady = false;

      keySortParams = keySortQueue.shift();

      keySort(keySortParams, function(err, results){

        if (err) {
          console.log(chalkError("WAS | *** KEY SORT ERROR: " + err));
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

  return;
}

function initDbuPingInterval(interval){

  clearInterval(dbuPingInterval);

  dbuPingSent = false;
  dbuPongReceived = false;

  dbuPingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_DBU_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_DBU_CHILD_ID].child) {

    dbuPingInterval = setInterval(function(){

      if (!dbuPingSent) {

        dbuPingId = moment().valueOf();

        childrenHashMap[DEFAULT_DBU_CHILD_ID].child.send({op: "PING", pingId: dbuPingId}, function(err){

          dbuPingSent = true; 

          if (err) {

            console.log(chalkError("WAS | *** DBU SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_DBU_CHILD_ID}, function(err, numKilled){
              dbuPongReceived = false;
              initDbuChild({childId: DEFAULT_DBU_CHILD_ID});
            });

            return;
          }

          console.log(chalkInfo("WAS | >PING | DBU | PING ID: " + getTimeStamp(dbuPingId)));

        });

      }
      else if (dbuPingSent && dbuPongReceived) {

        dbuPingId = moment().valueOf();

        dbuPingSent = false; 
        dbuPongReceived = false;

        childrenHashMap[DEFAULT_DBU_CHILD_ID].child.send({op: "PING", pingId: dbuPingId}, function(err){

          if (err) {

            console.log(chalkError("WAS | *** DBU SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_DBU_CHILD_ID}, function(err, numKilled){
              dbuPongReceived = false;
              initDbuChild({childId: DEFAULT_DBU_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo("WAS | >PING | DBU | PING ID: " + getTimeStamp(dbuPingId))); }

          dbuPingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("WAS | *** PONG TIMEOUT | DBU"
          + " | TIMEOUT: " + interval
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(dbuPingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - dbuPingId)
        ));
        
        // slackSendMessage("\n*CHILD ERROR*\nTWEET_PARSER\nPONG TIMEOUT");
      }
    }, interval);

  }
}

function initTfePingInterval(interval){

  clearInterval(tfePingInterval);

  tfePingSent = false;
  tfePongReceived = false;

  tfePingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_TFE_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_TFE_CHILD_ID].child) {

    tfePingInterval = setInterval(function(){

      if (!tfePingSent) {

        tfePingId = moment().valueOf();

        childrenHashMap[DEFAULT_TFE_CHILD_ID].child.send({op: "PING", pingId: tfePingId}, function(err){

          tfePingSent = true; 

          if (err) {

            console.log(chalkError("WAS | *** TFE SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TFE_CHILD_ID}, function(err, numKilled){
              tfePongReceived = false;
              initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
            });

            return;
          }

          // if (configuration.verbose) { console.log(chalkInfo("WAS | >PING | TFE | PING ID: " + getTimeStamp(tfePingId))); }
          console.log(chalkInfo("WAS | >PING | TFE | PING ID: " + getTimeStamp(tfePingId)));

        });

      }
      else if (tfePingSent && tfePongReceived) {

        tfePingId = moment().valueOf();

        tfePingSent = false; 
        tfePongReceived = false;

        childrenHashMap[DEFAULT_TFE_CHILD_ID].child.send({op: "PING", pingId: tfePingId}, function(err){

          if (err) {

            console.log(chalkError("WAS | *** TFE SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TFE_CHILD_ID}, function(err, numKilled){
              tfePongReceived = false;
              initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo("WAS | >PING | TFE | PING ID: " + getTimeStamp(tfePingId))); }

          tfePingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("WAS | *** PONG TIMEOUT | TFE"
          + " | TIMEOUT: " + interval
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tfePingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tfePingId)
        ));
        
      }
    }, interval);

  }
}

function unfollowDuplicates(params){

  console.log(chalk.bold.black("WAS | UNFOLLOW DUPLICATES"
    + " | " + params.threeceeUser
  ));

  return new Promise(function(resolve, reject){

    const threeceeUserTarget = params.threeceeUser;
    const threeceeUsersArray = Object.keys(threeceeTwitter).sort();

    let unfollowArrarys = {};

    async.eachSeries(threeceeUsersArray, function(threeceeUserTarget, cb0){

      unfollowArrarys[threeceeUserTarget] = [];

      if (
        !threeceeTwitter[threeceeUserTarget].twitterFriends 
        || threeceeTwitter[threeceeUserTarget] === undefined 
        || threeceeTwitter[threeceeUserTarget].twitterFriends === undefined
      ){
        return cb0();
      }

      debug(chalkLog("WAS | UNFOLLOW DUPLICATES ARRAY" 
        + " | 3C TARGET @" + threeceeUserTarget + " | " + threeceeTwitter[threeceeUserTarget].twitterFriends.length + " FRNDs"
        + " | UNFOLLOW ARRAY: " + unfollowArrarys[threeceeUserTarget].length + " USERS =============="
      ));

      async.eachSeries(threeceeUsersArray, function(threeceeUserSource, cb1){
        if (threeceeUserSource < threeceeUserTarget 
            && (threeceeTwitter[threeceeUserTarget].twitterFriends !== undefined)
            && (threeceeTwitter[threeceeUserSource].twitterFriends !== undefined)
          ) { // altthreecee00 < altthreecee01

          unfollowArrarys[threeceeUserTarget] = _.concat(unfollowArrarys[threeceeUserTarget], _.intersection(threeceeTwitter[threeceeUserTarget].twitterFriends, threeceeTwitter[threeceeUserSource].twitterFriends));
          unfollowArrarys[threeceeUserTarget] = _.concat(unfollowArrarys[threeceeUserTarget], _.intersection(threeceeTwitter[threeceeUserTarget].twitterFriends, [...unfollowableUserSet]));

          debug(chalkLog("WAS | UNFOLLOW DUPLICATES ARRAY" 
            + " | 3C TARGET @" + threeceeUserTarget + " | " + threeceeTwitter[threeceeUserTarget].twitterFriends.length + " FRNDs"
            + " | 3C SOURCE @" + threeceeUserSource + " | " + threeceeTwitter[threeceeUserSource].twitterFriends.length + " FRNDs"
            + " | UNFOLLOW ARRAY: " + unfollowArrarys[threeceeUserTarget].length + " USERS"
          ));

          return cb1();
        }

        cb1();

      }, function(err1){

        console.log(chalkLog("WAS | UNFOLLOW DUPLICATES ARRAY" 
          + " | 3C TARGET @" + threeceeUserTarget + " | " + threeceeTwitter[threeceeUserTarget].twitterFriends.length + " FRNDs"
          + " | UNFOLLOW ARRAY: " + unfollowArrarys[threeceeUserTarget].length + " USERS"
        ));

        if (unfollowArrarys[threeceeUserTarget].length > 0) {
          tssChildren[threeceeUserTarget].child.send({op: "UNFOLLOW_ID_ARRAY", userArray: unfollowArrarys[threeceeUserTarget]});
        }

        cb0();

      });

    }, function(err){

      if (err) {
        console.log(chalkError("WAS | *** UNFOLLOW DUPLICATES ERROR: " + err
          + " | 3C USER TARGET: " + threeceeUserTarget
          + " | 3C USER SOURCE: " + threeceeUserSource
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tfePingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tfePingId)
        ));
        return reject(err);
      }

      resolve(unfollowArrarys);

    });
  });
}

function updateSearchTerms(){
  console.log(chalk.green("WAS | WAS | UPDATE SEARCH TERMS"));

  tssSendAllChildren({op: "UPDATE_SEARCH_TERMS"});
}

function initTssChild(params){

  statsObj.tssChildren[params.threeceeUser].ready = false;

  console.log(chalk.bold.black("WAS | INIT TSS CHILD\n" + jsonPrint(params)));

  return new Promise(function(resolve, reject){

    const tss = cp.fork(`${__dirname}/js/libs/tssChild.js`);

    childrenHashMap[params.childId] = {};
    childrenHashMap[params.childId].pid = tss.pid;
    childrenHashMap[params.childId].childId = params.childId;
    childrenHashMap[params.childId].threeceeUser = params.threeceeUser;
    childrenHashMap[params.childId].title = params.childId;
    childrenHashMap[params.childId].status = "NEW";
    childrenHashMap[params.childId].errors = 0;
    childrenHashMap[params.childId].unfollowArrary = [];

    touchChildPidFile({ 
      childId: params.childId, 
      pid: childrenHashMap[params.childId].pid
    });

    tss.on("message", async function tssMessageRx(m){

      childrenHashMap[params.childId].status = "RUNNING";  

      debug(chalkLog("TSS RX MESSAGE"
        + " | OP: " + m.op
      ));

      switch (m.op) {

        case "ERROR":
          console.log(chalkError("WAS | <TSS | ERROR"
            + " | 3C @" + m.threeceeUser
            + " | ERROR TYPE: " + m.errorType
            + " | ERROR MESSAGE: " + m.error.message
            // + "\n" + jsonPrint(m.error)
          ));

          if ((m.errorType === "TWITTER_UNAUTHORIZED") || (m.error.statusCode === 401)) {

            threeceeTwitter[m.threeceeUser].twitterErrors += 1;
            threeceeTwitter[m.threeceeUser].twitterErrorFlag = m.error;
            threeceeTwitter[m.threeceeUser].twitterAuthorizationErrorFlag = m.error;

          }
          else if (m.errorType === "TWITTER_TOKEN") {

            threeceeTwitter[m.threeceeUser].twitterErrors += 1;
            threeceeTwitter[m.threeceeUser].twitterErrorFlag = m.error;
            threeceeTwitter[m.threeceeUser].twitterTokenErrorFlag = m.error;

          }
          else if (m.errorType === "TWITTER_FOLLOW_BLOCK") {

            unfollowableUserSet.add(m.userId);

            console.log(chalkLog("WAS | XXX TWITTER FOLLOW BLOCK"
              + " | UID: " + m.userId
              + " | @" + m.screenName
              + " | UNFOLLOWABLE SET SIZE: " + unfollowableUserSet.size
            ));

            const obj = {
              userIds : [...unfollowableUserSet]
            };

            saveFileQueue.push({
              localFlag: false, 
              folder: dropboxConfigDefaultFolder, 
              file: unfollowableUserFile, 
              obj: obj
            });

          }
          else {

            threeceeTwitter[m.threeceeUser].twitterErrors += 1;
            threeceeTwitter[m.threeceeUser].twitterErrorFlag = m.error;

          }
        break;

        case "TWITTER_STATS":

          console.log(chalkInfo("WAS | <TSS | TWITTER STATS"
            + " | 3C @" + m.threeceeUser
            + " | FOLLOWING: " + m.twitterFollowing
          ));

          threeceeTwitter[m.threeceeUser].twitterFollowing = m.twitterFollowing;
          threeceeTwitter[m.threeceeUser].twitterFriends = m.twitterFriends;

          try{
            childrenHashMap[params.childId].unfollowArrary = await unfollowDuplicates({threeceeUser: m.threeceeUser});
          }
          catch(err){
            console.log(chalkError("WAS | <TSS | *** UNFOLLOW DUPLICATES ERROR"
              + " | 3C @" + m.threeceeUser
              + " | ERR: " + err
            ));
          }

        break;

        case "FOLLOW_LIMIT":

          console.log(chalkInfo("WAS | <TSS | FOLLOW LIMIT"
            + " | 3C @" + m.threeceeUser
            + " | LIMIT: " + getTimeStamp(m.twitterFollowLimit)
            + " | NOW: " + getTimeStamp()
          ));

          threeceeTwitter[m.threeceeUser].twitterFollowing = m.twitterFollowing;
          threeceeTwitter[m.threeceeUser].twitterFriends = m.twitterFriends;
          threeceeTwitter[m.threeceeUser].twitterFollowLimit = true;

          try{
            childrenHashMap[params.childId].unfollowArrary = await unfollowDuplicates({threeceeUser: m.threeceeUser});
          }
          catch(err){
            console.log(chalkError("WAS | <TSS | *** UNFOLLOW DUPLICATES ERROR"
              + " | 3C @" + m.threeceeUser
              + " | ERR: " + err
            ));
          }

        break;

        case "TWEET":
          // deltaTssMessage = process.hrtime(deltaTssMessageStart);
          // if (deltaTssMessage[0] > 0) { console.log(chalkAlert("WAS | *** TSS RX DELTA: " + deltaTssMessage[0] + "." + deltaTssMessage[1])); }
          // deltaTssMessageStart = process.hrtime();
          if (configuration.verbose) { debug(chalkInfo("R< TWEET | " + m.tweet.id_str + " | @" + m.tweet.user.screen_name)); }
          socketRxTweet(m.tweet);
        break;

        case "PONG":
          tssPongReceived = m.pongId;
          childrenHashMap[params.childId].status = "RUNNING";
          if (configuration.verbose) {
            console.log(chalkInfo("WAS | <TSS | PONG"
              + " | NOW: " + getTimeStamp()
              + " | PONG ID: " + getTimeStamp(m.pongId)
              + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
            ));
          }
        break;

        default:
          console.log(chalkError("WAS | TSS | *** ERROR *** UNKNOWN OP: " + m.op));
      }
    });

    tss.on("error", function tssError(err){
      console.log(chalkError(getTimeStamp()
        + " | *** TSS ERROR ***"
        + " \n" + jsonPrint(err)
      ));
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "ERROR";
      childrenHashMap[params.childId].error = err;
      configEvents.emit("CHILD_ERROR", {childId: params.childId});
    });

    tss.on("exit", function tssExit(code){
      console.log(chalkError(getTimeStamp()
        + " | *** TSS EXIT ***"
        + " | EXIT CODE: " + code
      ));
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "EXIT";
    });

    tss.on("close", function tssClose(code){
      console.log(chalkError(getTimeStamp()
        + " | *** TSS CLOSE ***"
        + " | EXIT CODE: " + code
      ));
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "CLOSE";
      configEvents.emit("CHILD_ERROR", {childId: params.childId});
    });

    childrenHashMap[params.childId].child = tss;

    statsObj.tssChildren[params.threeceeUser].ready = true;

    tssChildren[params.threeceeUser].child = tss;

    tss.send({
      op: "INIT",
      title: params.childId,
      threeceeUser: params.threeceeUser,
      twitterConfig: threeceeTwitter[params.threeceeUser].twitterConfig,
      interval: configuration.tssInterval,
      filterDuplicateTweets: configuration.filterDuplicateTweets,
      testMode: configuration.testMode,
      verbose: configuration.verbose
    }, function tssMessageRxError(err){
      if (err) {
        console.log(chalkError("WAS | *** TSS SEND ERROR: " + err));
        console.error(err);
        clearInterval(tssPingInterval);
        childrenHashMap[params.childId].status = "ERROR";
        reject(err);
      }
      else {
        childrenHashMap[params.childId].status = "INIT";
        clearInterval(tssPingInterval);
        // setTimeout(function(){
        //   initTssPingInterval(TSS_PING_INTERVAL);
        // }, 1000);
        resolve();
      }
    });

  });
}

function initTfeChild(params){

  return new Promise(function(resolve, reject){

    statsObj.tfeChildReady = false;

    console.log(chalk.bold.black("WAS | INIT TFE CHILD\n" + jsonPrint(params)));

    console.log(chalkInfo("WAS | LOADED MAX INPUT HASHMAP + NORMALIZATION"));
    console.log(chalkInfo("WAS | MAX INPUT HASHMAP INPUT TYPES: " + Object.keys(maxInputHashMap)));
    console.log(chalkInfo("WAS | NORMALIZATION INPUT TYPES: " + Object.keys(normalization)));

    // let deltaTfeMessageStart = process.hrtime();
    // let deltaTfeMessage = process.hrtime(deltaTfeMessageStart);

    const tfe = cp.fork(`${__dirname}/js/libs/tfeChild.js`);

    childrenHashMap[params.childId] = {};
    childrenHashMap[params.childId].pid = tfe.pid;
    childrenHashMap[params.childId].childId = params.childId;
    childrenHashMap[params.childId].title = params.childId;
    childrenHashMap[params.childId].status = "NEW";
    childrenHashMap[params.childId].errors = 0;

    touchChildPidFile({ 
      childId: params.childId, 
      pid: childrenHashMap[params.childId].pid
    });

    tfe.on("message", async function tfeMessageRx(m){

      childrenHashMap[params.childId].status = "RUNNING";  

      debug(chalkLog("TFE RX MESSAGE"
        + " | OP: " + m.op
      ));

      const isInfoUser = m.isInfoUser || false;

      const threeceeHashMap = (isInfoUser) ? threeceeInfoTwitter : threeceeTwitter ;

      switch (m.op) {

        case "ERROR":

          console.log(chalkError("WAS | <TFE | ERROR"
            + " | 3C @" + m.threeceeUser
            + " | INFO 3C: " + isInfoUser
            + " | ERROR TYPE: " + m.errorType
            // + "\n" + jsonPrint(m.error)
          ));

          if (m.errorType === "TWITTER_UNAUTHORIZED") {

            threeceeHashMap[m.threeceeUser].twitterErrors += 1;
            threeceeHashMap[m.threeceeUser].twitterErrorFlag = m.error;
            threeceeHashMap[m.threeceeUser].twitterAuthorizationErrorFlag = m.error;

          }
          else if (m.errorType === "TWITTER_TOKEN") {

            threeceeHashMap[m.threeceeUser].twitterErrors += 1;
            threeceeHashMap[m.threeceeUser].twitterErrorFlag = m.error;
            threeceeHashMap[m.threeceeUser].twitterTokenErrorFlag = m.error;

          }
          else if (m.errorType === "BLOCKED") {

            threeceeHashMap[m.threeceeUser].twitterErrors += 1;
            threeceeHashMap[m.threeceeUser].twitterErrorFlag = m.error;
            threeceeHashMap[m.threeceeUser].twitterTokenErrorFlag = m.error;

            ignoredUserSet.add(m.userId);
            unfollowableUserSet.add(m.userId);

            const user = {
              nodeId: m.userId,
              userId: m.userId
            }

            unfollow({user: user}, function(err, updatedUser){
              if (err) {
                console.log(chalkError("WAS | TWITTER_UNFOLLOW ERROR: " + err));
                return;
              }
              
              if (!updatedUser) { return; }

              adminNameSpace.emit("UNFOLLOW", updatedUser);
              utilNameSpace.emit("UNFOLLOW", updatedUser);

              console.log(chalk.blue("WAS | XXX TWITTER_UNFOLLOW"
                + " | UID" + updatedUser.nodeId
                + " | @" + updatedUser.screenName
              ));

            });

          }
          else {

            console.log(chalkError("WAS | <TFE | ERROR"
              + " | 3C @" + m.threeceeUser
              + " | INFO 3C: " + isInfoUser
              + " | ERROR TYPE: " + m.errorType
              + "\n" + jsonPrint(m.error)
            ));

            threeceeHashMap[m.threeceeUser].twitterErrors += 1;
            threeceeHashMap[m.threeceeUser].twitterErrorFlag = m.error;

          }
        break;

        case "TWITTER_STATS":

          console.log(chalkInfo("WAS | <TFE | TWITTER STATS"
            + " | 3C @" + m.threeceeUser
            + " | FOLLOWING: " + m.twitterFollowing
          ));

          threeceeHashMap[m.threeceeUser].twitterFollowing = m.twitterFollowing;
          threeceeHashMap[m.threeceeUser].twitterFriends = m.twitterFriends;

          try{
            childrenHashMap[params.childId].unfollowArrary = await unfollowDuplicates({threeceeUser: m.threeceeUser});
          }
          catch(err){
            console.log(chalkError("WAS | <TSS | *** UNFOLLOW DUPLICATES ERROR"
              + " | 3C @" + m.threeceeUser
              + " | ERR: " + err
            ));
          }

        break;

        case "FOLLOW_LIMIT":

          console.log(chalkInfo("WAS | <TFE | FOLLOW LIMIT"
            + " | 3C @" + m.threeceeUser
            + " | LIMIT: " + getTimeStamp(m.twitterFollowLimit)
            + " | NOW: " + getTimeStamp()
          ));

          threeceeHashMap[m.threeceeUser].twitterFollowing = m.twitterFollowing;
          threeceeHashMap[m.threeceeUser].twitterFriends = m.twitterFriends;
          threeceeHashMap[m.threeceeUser].twitterFollowLimit = true;
        break;

        case "TWEET":
           if (configuration.verbose) { debug(chalkInfo("R< TWEET | " + m.tweet.id_str + " | @" + m.tweet.user.screen_name)); }
          socketRxTweet(m.tweet);
        break;

        case "PONG":
          tfePongReceived = m.pongId;
          childrenHashMap[params.childId].status = "RUNNING";
          if (configuration.verbose) {
            console.log(chalkInfo("WAS | <TFE | PONG"
              + " | NOW: " + getTimeStamp()
              + " | PONG ID: " + getTimeStamp(m.pongId)
              + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
            ));
          }
        break;

        default:
          console.log(chalkError("WAS | TFE | *** ERROR *** UNKNOWN OP: " + m.op));
      }
    });

    tfe.on("error", function tfeError(err){
      console.log(chalkError(getTimeStamp()
        + " | *** TFE ERROR ***"
        + " \n" + jsonPrint(err)
      ));
      statsObj.tfeSendReady = false;
      statsObj.tfeChildReady = false;
      clearInterval(tfePingInterval);
      childrenHashMap[params.childId].status = "ERROR";
    });

    tfe.on("exit", function tfeExit(code){
      console.log(chalkError(getTimeStamp()
        + " | *** TFE EXIT ***"
        + " | EXIT CODE: " + code
      ));
      statsObj.tfeSendReady = false;
      statsObj.tfeChildReady = false;
      clearInterval(tfePingInterval);
      childrenHashMap[params.childId].status = "EXIT";
    });

    tfe.on("close", function tfeClose(code){
      console.log(chalkError(getTimeStamp()
        + " | *** TFE CLOSE ***"
        + " | EXIT CODE: " + code
      ));
      statsObj.tfeSendReady = false;
      statsObj.tfeChildReady = false;
      clearInterval(tfePingInterval);
      childrenHashMap[params.childId].status = "CLOSE";
    });

    childrenHashMap[params.childId].child = tfe;

    statsObj.tfeChildReady = true;

    tfeChild = tfe;

    tfeChild.send({
      op: "INIT",
      title: "wa_node_child_tfe",
      networkObj: bestNetworkObj,
      maxInputHashMap: maxInputHashMap,
      normalization: normalization,
      interval: configuration.tfeInterval,
      geoCodeEnabled: configuration.geoCodeEnabled,
      enableImageAnalysis: configuration.enableImageAnalysis,
      forceImageAnalysis: configuration.forceImageAnalysis,
      testMode: configuration.testMode,
      verbose: configuration.verbose
    }, function tfeMessageRxError(err){
      if (err) {
        console.log(chalkError("WAS | *** TFE SEND ERROR"
          + " | " + err
        ));
        console.error(err);
        statsObj.tfeSendReady = false;
        statsObj.tfeChildReady = false;
        clearInterval(tfePingInterval);
        childrenHashMap[params.childId].status = "ERROR";
        reject(err);
      }
      else {
        statsObj.tfeSendReady = true;
        statsObj.tfeChildReady = true;
        childrenHashMap[params.childId].status = "INIT";
        clearInterval(tfePingInterval);
        setTimeout(function(){
          initTfePingInterval(TFE_PING_INTERVAL);
        }, 1000);
        resolve();
      }
    });

  });
}

function initDbuChild(params){

  return new Promise(function(resolve, reject){

    const childId = params.childId;

    statsObj.dbuChildReady = false;

    console.log(chalk.bold.black("WAS | INIT DBU CHILD\n" + jsonPrint(params)));

    const dbu = cp.fork(`${__dirname}/js/libs/dbuChild.js`);

    childrenHashMap[childId] = {};
    childrenHashMap[childId].pid = dbu.pid;
    childrenHashMap[childId].childId = params.childId;
    childrenHashMap[params.childId].title = params.childId;
    childrenHashMap[childId].status = "NEW";
    childrenHashMap[childId].errors = 0;

    touchChildPidFile({ 
      childId: childId, 
      pid: childrenHashMap[childId].pid
    });

    dbu.on("message", function dbuMessageRx(m){

      childrenHashMap[childId].status = "RUNNING";  

      debug(chalkLog("DBU RX MESSAGE"
        + " | OP: " + m.op
      ));

      switch (m.op) {

        case "ERROR":
          console.log(chalkError("WAS | <DBU | ERROR"
            + " | ERROR TYPE: " + m.errorType
            + "\n" + jsonPrint(m.error)
          ));
        break;

        case "PONG":
          dbuPongReceived = m.pongId;
          childrenHashMap[childId].status = "RUNNING";
          if (configuration.verbose) {
            console.log(chalkInfo("WAS | <DBU | PONG"
              + " | NOW: " + getTimeStamp()
              + " | PONG ID: " + getTimeStamp(m.pongId)
              + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
            ));
          }
        break;

        default:
          console.log(chalkError("WAS | DBU | *** ERROR *** UNKNOWN OP: " + m.op));
      }
    });

    dbu.on("error", function dbuError(err){
      console.log(chalkError(getTimeStamp()
        + " | *** DBU ERROR ***"
        + " \n" + jsonPrint(err)
      ));
      statsObj.dbuSendReady = false;
      statsObj.dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "ERROR";
    });

    dbu.on("exit", function dbuExit(code){
      console.log(chalkError(getTimeStamp()
        + " | *** DBU EXIT ***"
        + " | EXIT CODE: " + code
      ));
      statsObj.dbuSendReady = false;
      statsObj.dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "EXIT";
    });

    dbu.on("close", function dbuClose(code){
      console.log(chalkError(getTimeStamp()
        + " | *** DBU CLOSE ***"
        + " | EXIT CODE: " + code
      ));
      statsObj.dbuSendReady = false;
      statsObj.dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "CLOSE";
    });

    childrenHashMap[childId].child = dbu;

    statsObj.dbuChildReady = true;

    dbuChild = dbu;

    dbuChild.send({
      op: "INIT",
      title: "wa_node_child_dbu",
      interval: configuration.dbuInterval,
      testMode: configuration.testMode,
      verbose: configuration.verbose
    }, function dbuMessageRxError(err){
      if (err) {
        console.log(chalkError("WAS | *** DBU SEND ERROR"
          + " | " + err
        ));
        console.error(err);
        statsObj.dbuSendReady = false;
        statsObj.dbuChildReady = false;
        clearInterval(dbuPingInterval);
        childrenHashMap[childId].status = "ERROR";
        reject(err);
      }
      else {
        statsObj.dbuSendReady = true;
        statsObj.dbuChildReady = true;
        childrenHashMap[childId].status = "INIT";
        clearInterval(dbuPingInterval);
        setTimeout(function(){
          initDbuPingInterval(DBU_PING_INTERVAL);
        }, 1000);
        resolve();
      }
    });

  });
}

function initTweetParserPingInterval(interval){

  clearInterval(tweetParserPingInterval);

  tweetParserPingSent = false;
  tweetParserPongReceived = false;

  tweetParserPingId = moment().valueOf();

  if ((childrenHashMap[DEFAULT_TWP_CHILD_ID] !== undefined) 
    && childrenHashMap[DEFAULT_TWP_CHILD_ID].child) {

    tweetParserPingInterval = setInterval(function(){

      if (!tweetParserPingSent) {

        tweetParserPingId = moment().valueOf();

        childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send({op: "PING", pingId: tweetParserPingId}, function(err){

          tweetParserPingSent = true; 

          if (err) {

            console.log(chalkError("WAS | *** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err, numKilled){
              tweetParserPongReceived = false;
              initTweetParser({childId: DEFAULT_TWP_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo("WAS | >PING | TWEET_PARSER | PING ID: " + getTimeStamp(tweetParserPingId))); }

        });

      }
      else if (tweetParserPingSent && tweetParserPongReceived) {

        tweetParserPingId = moment().valueOf();

        tweetParserPingSent = false; 
        tweetParserPongReceived = false;

        childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send({op: "PING", pingId: tweetParserPingId}, function(err){

          if (err) {

            console.log(chalkError("WAS | *** TWEET_PARSER SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err, numKilled){
              tweetParserPongReceived = false;
              initTweetParser({childId: DEFAULT_TWP_CHILD_ID});
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo("WAS | >PING | TWEET_PARSER | PING ID: " + getTimeStamp(tweetParserPingId))); }

          tweetParserPingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("WAS | *** PONG TIMEOUT | TWEET_PARSER"
          + " | TIMEOUT: " + interval
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tweetParserPingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tweetParserPingId)
        ));
        
        // slackSendMessage("\n*CHILD ERROR*\nTWEET_PARSER\nPONG TIMEOUT");

        // clearInterval(tweetParserPingInterval);

        // tweetParserPingSent = false; 
        // tweetParserPongReceived = false;

        // setTimeout(function(){

        //   killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err, numKilled){
        //     initTweetParser({childId: DEFAULT_TWP_CHILD_ID});
        //   });

        // }, 5000);
      }
    }, interval);

  }
}

function initTweetParser(params, callback){

  console.log(chalk.bold.black("WAS | INIT TWEET PARSER\n" + jsonPrint(params)));

  clearInterval(tweetParserPingInterval);
  tweetParserPongReceived = false;

  statsObj.tweetParserReady = false;

  // let deltaTweetParserMessageStart = process.hrtime();
  // let deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);

  const twp = cp.fork(`${__dirname}/js/libs/tweetParser.js`);

  childrenHashMap[params.childId] = {};
  childrenHashMap[params.childId].pid = twp.pid;
  childrenHashMap[params.childId].childId = params.childId;
  childrenHashMap[params.childId].title = params.childId;
  childrenHashMap[params.childId].status = "NEW";
  childrenHashMap[params.childId].errors = 0;

  touchChildPidFile({ 
    childId: params.childId, 
    pid: childrenHashMap[params.childId].pid
  });

  twp.on("message", function tweetParserMessageRx(m){

    childrenHashMap[params.childId].status = "RUNNING";  

    debug(chalkLog("TWEET PARSER RX MESSAGE"
      + " | OP: " + m.op
    ));

    if (m.op === "PONG"){

      tweetParserPongReceived = m.pongId;

      childrenHashMap[params.childId].status = "RUNNING";

      if (configuration.verbose) {
        console.log(chalkInfo("WAS | <PONG | TWEET PARSER"
          + " | NOW: " + getTimeStamp()
          + " | PONG ID: " + getTimeStamp(m.pongId)
          + " | RESPONSE TIME: " + msToTime(moment().valueOf() - m.pongId)
        ));
      }
    } 

    else if (tweetParserMessageRxQueue.length < configuration.maxQueue){
      // deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);
      // if (deltaTweetParserMessage[0] > 0) { console.log(chalkAlert("WAS | *** TWP RX DELTA: " + deltaTweetParserMessage[0] + "." + deltaTweetParserMessage[1])); }
      // deltaTweetParserMessageStart = process.hrtime();
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
    configEvents.emit("CHILD_ERROR", {childId: params.childId});
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
    title: "wa_node_child_twp",
    networkObj: bestNetworkObj,
    maxInputHashMap: maxInputHashMap,
    normalization: normalization,
    interval: configuration.tweetParserInterval,
    testMode: configuration.testMode,
    verbose: configuration.verbose
  }, function tweetParserMessageRxError(err){
    if (err) {
      console.log(chalkError("WAS | *** TWEET PARSER SEND ERROR"
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
        initTweetParserPingInterval(TWP_PING_INTERVAL);
      }, 1000);
    }
  });

  if (callback !== undefined) { callback(null, twp); }
}

function initRateQinterval(interval){

  console.log(chalk.bold.black("WAS | INIT RATE QUEUE INTERVAL | " + msToTime(interval)));

  return new Promise(function(resolve, reject){

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
                console.log(chalkInfo("WAS | MAX CACHE"
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
              console.log(chalkInfo("WAS | MAX CACHE"
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
            console.log(chalkInfo("WAS | MAX ADMINS"
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
            console.log(chalkInfo("WAS | MAX UTILS"
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

            console.log(chalkInfo("WAS | MAX VIEWERS"
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
              console.log(chalkError("WAS | *** ERROR NULL nodeMeterType[" + nodeType + "]: " + meterId));
            }

            paramsSorter.obj[meterId] = pick(nodeMeterType[nodeType][meterId].toJSON(), paramsSorter.sortKey);

            cb();

          }, function(err){

            if (err) {
              console.log(chalkError("WAS | ERROR RATE QUEUE INTERVAL\n" + err ));
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
            console.log(chalkError("WAS | *** ERROR NULL nodeMeter[meterId]: " + meterId));
          }

          paramsSorterOverall.obj[meterId] = pick(nodeMeter[meterId].toJSON(), paramsSorterOverall.sortKey);

          cb();
        }, function(err){
          if (err) {
            console.log(chalkError("WAS | ERROR RATE QUEUE INTERVAL\n" + err ));
          }

          keySortQueue.push(paramsSorterOverall);
        });

      }

    }, interval);

    resolve();

  });
}

function loadBestRuntimeNetwork(params){

  return new Promise(function(resolve, reject){

    params = params || {};

    const folder = params.folder || bestNetworkFolder;
    let file = params.file || bestRuntimeNetworkFileName;

    loadFile({folder: folder, file: file})
    .then(function(bRtNnObj){
      if (bRtNnObj) {

        bRtNnObj.matchRate = (bRtNnObj.matchRate !== undefined) ? bRtNnObj.matchRate : 0;

        console.log(chalkInfo("WAS | LOAD BEST NETWORK RUNTIME ID"
          + " | " + bRtNnObj.networkId
          + " | SUCCESS: " + bRtNnObj.successRate.toFixed(2) + "%"
          + " | MATCH: " + bRtNnObj.matchRate.toFixed(2) + "%"
        ));


        file = bRtNnObj.networkId + ".json";

        loadFile({folder: folder, file: file})
        .then(function(nnObj){
          if (nnObj) { 

            nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
            bestNetworkObj = {};
            bestNetworkObj = deepcopy(nnObj);
            console.log(chalk.green.bold("WAS | +++ LOADED BEST NETWORK: " + bestNetworkObj.networkId));

            statsObj.bestNetwork = pick(bestNetworkObj, statsBestNetworkPickArray);

            if (statsObj.previousBestNetworkId !== bestNetworkObj.networkId) {
              statsObj.previousBestNetworkId = bestNetworkObj.networkId;
              configEvents.emit("NEW_BEST_NETWORK", bestNetworkObj.networkId);
            }

            resolve(bestNetworkObj.networkId);

          }
          else {

            NeuralNetwork.find({}).sort({"matchRate": -1}).limit(1).exec(function(err, nnArray){
              if (err){
                console.log(chalkError("WAS | *** NEURAL NETWORK FIND ERROR: " + err));
                return reject(err);
              }
              
              if (nnArray === 0){
                console.log(chalkError("WAS | *** NEURAL NETWORK NOT FOUND"));
                return resolve(null);
              }

              bestNetworkObj = {};
              bestNetworkObj = nnArray[0];
              
              if (bestNetworkObj.matchRate === undefined) { bestNetworkObj.matchRate = 0; }
              if (bestNetworkObj.overallMatchRate === undefined) { bestNetworkObj.overallMatchRate = 0; }
              
              statsObj.bestNetwork = pick(bestNetworkObj, statsBestNetworkPickArray);

              if (statsObj.previousBestNetworkId !== bestNetworkObj.networkId) {
                statsObj.previousBestNetworkId = bestNetworkObj.networkId;
                configEvents.emit("NEW_BEST_NETWORK", bestNetworkObj.networkId);
              }

              console.log(chalk.blue.bold("WAS | +++ BEST NEURAL NETWORK LOADED FROM DB"
                + " | " + bestNetworkObj.networkId
                + " | SR: " + bestNetworkObj.successRate.toFixed(2) + "%"
                + " | MR: " + bestNetworkObj.matchRate.toFixed(2) + "%"
                + " | OAMR: " + bestNetworkObj.overallMatchRate.toFixed(2) + "%"
              ));

              resolve(bestNetworkObj.networkId);

            });
          }
        });
      }
      else {
        console.log(chalkError("WAS | *** LOAD BEST NETWORK ERROR: NO PAYLOAD?" 
          + folder + "/" + file
        ));
        reject(new Error("NO NETWORK PAYLOAD"));
      }
    })
    .catch(function(err){
      if (err.code === "ETIMEDOUT") {
        console.log(chalkError("WAS | *** LOAD BEST NETWORK ERROR: NETWORK TIMEOUT:  " 
          + folder + "/" + file
        ));
      }
      else if (err.code === "ENOTFOUND") {
        console.log(chalkError("WAS | *** LOAD BEST NETWORK ERROR: FILE NOT FOUND:  " 
          + folder + "/" + file
        ));
      }
      else {
        console.log(chalkError("WAS | *** LOAD BEST NETWORK ERROR"
          + " | " + folder + "/" + file
          + "\n" + jsonPrint(err)
        ));
      }

      console.log(err);
      return reject(err);
    });

  });
}

function loadConfigFile(params) {

  return new Promise(function(resolve, reject){

    const fullPath = params.folder + "/" + params.file;

    if (params.file === dropboxConfigDefaultFile) {
      prevConfigFileModifiedMoment = moment(prevDefaultConfigFileModifiedMoment);
    }
    else {
      prevConfigFileModifiedMoment = moment(prevHostConfigFileModifiedMoment);
    }

    if (configuration.offlineMode) {
      loadCommandLineArgs()
      .then(function(){
        return resolve();
      })
      .catch(function(err){
        return reject(err);
      });
    }

    getFileMetadata({folder: params.folder, file: params.file})
    .then(function(response){
      const fileModifiedMoment = moment(new Date(response.client_modified));
      
      if (fileModifiedMoment.isSameOrBefore(prevConfigFileModifiedMoment)){

        console.log(chalkInfo("WAS | CONFIG FILE BEFORE OR EQUAL"
          + " | " + fullPath
          + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
          + " | " + fileModifiedMoment.format(compactDateTimeFormat)
        ));
        return resolve();
      }

      console.log(chalk.green("WAS | +++ CONFIG FILE AFTER ... LOADING"
        + " | " + fullPath
        + " | PREV: " + prevConfigFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));

      prevConfigFileModifiedMoment = moment(fileModifiedMoment);

      if (params.file === dropboxConfigDefaultFile) {
        prevDefaultConfigFileModifiedMoment = moment(fileModifiedMoment);
      }
      else {
        prevHostConfigFileModifiedMoment = moment(fileModifiedMoment);
      }

      loadFile({folder: params.folder, file: params.file})
      .then(function(loadedConfigObj){

        if ((loadedConfigObj === undefined) || !loadedConfigObj) {
          console.log(chalkError("WAS | DROPBOX CONFIG LOAD FILE ERROR | JSON UNDEFINED ??? "));
          return reject(new Error("JSON UNDEFINED"));
        }

        console.log(chalkInfo("WAS | LOADED CONFIG FILE: " + params.file + "\n" + jsonPrint(loadedConfigObj)));

        let newConfiguration = {};
        newConfiguration.metrics = {};
        newConfiguration.threeceeUsers = {};

        if (loadedConfigObj.WAS_TEST_MODE  !== undefined){
          console.log("WAS | LOADED WAS_TEST_MODE: " + loadedConfigObj.WAS_TEST_MODE);

          if ((loadedConfigObj.WAS_TEST_MODE === false) || (loadedConfigObj.WAS_TEST_MODE === "false")) {
            newConfiguration.testMode = false;
          }
          else if ((loadedConfigObj.WAS_TEST_MODE === true) || (loadedConfigObj.WAS_TEST_MODE === "true")) {
            newConfiguration.testMode = true;
          }
          else {
            newConfiguration.testMode = false;
          }
        }

        if (loadedConfigObj.VERBOSE  !== undefined){
          console.log("WAS | LOADED VERBOSE: " + loadedConfigObj.VERBOSE);

          if ((loadedConfigObj.VERBOSE === false) || (loadedConfigObj.VERBOSE === "false")) {
            newConfiguration.verbose = false;
          }
          else if ((loadedConfigObj.VERBOSE === true) || (loadedConfigObj.VERBOSE === "true")) {
            newConfiguration.verbose = true;
          }
          else {
            newConfiguration.verbose = false;
          }
        }

        if (loadedConfigObj.GEOCODE_ENABLED  !== undefined){
          console.log("WAS | LOADED GEOCODE_ENABLED: " + loadedConfigObj.GEOCODE_ENABLED);

          if ((loadedConfigObj.GEOCODE_ENABLED === false) || (loadedConfigObj.GEOCODE_ENABLED === "false")) {
            newConfiguration.geoCodeEnabled = false;
          }
          else if ((loadedConfigObj.GEOCODE_ENABLED === true) || (loadedConfigObj.GEOCODE_ENABLED === "true")) {
            newConfiguration.geoCodeEnabled = true;
          }
          else {
            newConfiguration.geoCodeEnabled = false;
          }
        }

        if (loadedConfigObj.FILTER_DUPLICATE_TWEETS  !== undefined){
          console.log("WAS | LOADED FILTER_DUPLICATE_TWEETS: " + loadedConfigObj.FILTER_DUPLICATE_TWEETS);

          if ((loadedConfigObj.FILTER_DUPLICATE_TWEETS === false) || (loadedConfigObj.FILTER_DUPLICATE_TWEETS === "false")) {
            newConfiguration.filterDuplicateTweets = false;
          }
          else if ((loadedConfigObj.FILTER_DUPLICATE_TWEETS === true) || (loadedConfigObj.FILTER_DUPLICATE_TWEETS === "true")) {
            newConfiguration.filterDuplicateTweets = true;
          }
          else {
            newConfiguration.filterDuplicateTweets = true;
          }
        }

        if (loadedConfigObj.ENABLE_IMAGE_ANALYSIS  !== undefined){
          console.log("WAS | LOADED ENABLE_IMAGE_ANALYSIS: " + loadedConfigObj.ENABLE_IMAGE_ANALYSIS);

          if ((loadedConfigObj.ENABLE_IMAGE_ANALYSIS === false) || (loadedConfigObj.ENABLE_IMAGE_ANALYSIS === "false")) {
            newConfiguration.enableImageAnalysis = false;
          }
          else if ((loadedConfigObj.ENABLE_IMAGE_ANALYSIS === true) || (loadedConfigObj.ENABLE_IMAGE_ANALYSIS === "true")) {
            newConfiguration.enableImageAnalysis = true;
          }
          else {
            newConfiguration.enableImageAnalysis = false;
          }
        }

        if (loadedConfigObj.FORCE_IMAGE_ANALYSIS  !== undefined){
          console.log("WAS | LOADED FORCE_IMAGE_ANALYSIS: " + loadedConfigObj.FORCE_IMAGE_ANALYSIS);

          if ((loadedConfigObj.FORCE_IMAGE_ANALYSIS === false) || (loadedConfigObj.FORCE_IMAGE_ANALYSIS === "false")) {
            newConfiguration.forceImageAnalysis = false;
          }
          else if ((loadedConfigObj.FORCE_IMAGE_ANALYSIS === true) || (loadedConfigObj.FORCE_IMAGE_ANALYSIS === "true")) {
            newConfiguration.forceImageAnalysis = true;
          }
          else {
            newConfiguration.forceImageAnalysis = false;
          }
        }

        if (loadedConfigObj.AUTO_FOLLOW  !== undefined){
          console.log("WAS | LOADED AUTO_FOLLOW: " + loadedConfigObj.AUTO_FOLLOW);

          if ((loadedConfigObj.AUTO_FOLLOW === false) || (loadedConfigObj.AUTO_FOLLOW === "false")) {
            newConfiguration.autoFollow = false;
          }
          else if ((loadedConfigObj.AUTO_FOLLOW === true) || (loadedConfigObj.AUTO_FOLLOW === "true")) {
            newConfiguration.autoFollow = true;
          }
          else {
            newConfiguration.autoFollow = false;
          }
        }

        if (loadedConfigObj.FORCE_FOLLOW  !== undefined){
          console.log("WAS | LOADED FORCE_FOLLOW: " + loadedConfigObj.FORCE_FOLLOW);

          if ((loadedConfigObj.FORCE_FOLLOW === false) || (loadedConfigObj.FORCE_FOLLOW === "false")) {
            newConfiguration.forceFollow = false;
          }
          else if ((loadedConfigObj.FORCE_FOLLOW === true) || (loadedConfigObj.FORCE_FOLLOW === "true")) {
            newConfiguration.forceFollow = true;
          }
          else {
            newConfiguration.forceFollow = false;
          }
        }

        if (loadedConfigObj.WAS_ENABLE_STDIN  !== undefined){
          console.log("WAS | LOADED WAS_ENABLE_STDIN: " + loadedConfigObj.WAS_ENABLE_STDIN);

          if ((loadedConfigObj.WAS_ENABLE_STDIN === false) || (loadedConfigObj.WAS_ENABLE_STDIN === "false")) {
            newConfiguration.enableStdin = false;
          }
          else if ((loadedConfigObj.WAS_ENABLE_STDIN === true) || (loadedConfigObj.WAS_ENABLE_STDIN === "true")) {
            newConfiguration.enableStdin = true;
          }
          else {
            newConfiguration.enableStdin = false;
          }
        }

        if (loadedConfigObj.NODE_METER_ENABLED !== undefined){

          console.log("WAS | LOADED NODE_METER_ENABLED: " + loadedConfigObj.NODE_METER_ENABLED);

          if (loadedConfigObj.NODE_METER_ENABLED === "true") {
            newConfiguration.metrics.nodeMeterEnabled = true;
          }
          else if (loadedConfigObj.NODE_METER_ENABLED === "false") {
            newConfiguration.metrics.nodeMeterEnabled = false;
          }
          else {
            newConfiguration.metrics.nodeMeterEnabled = true;
          }
        }

        if (loadedConfigObj.PROCESS_NAME !== undefined){
          console.log("WAS | LOADED PROCESS_NAME: " + loadedConfigObj.PROCESS_NAME);
          newConfiguration.processName = loadedConfigObj.PROCESS_NAME;
        }

        if (loadedConfigObj.THREECEE_USERS !== undefined){
          console.log("WAS | LOADED THREECEE_USERS: " + loadedConfigObj.THREECEE_USERS);
          newConfiguration.threeceeUsers = loadedConfigObj.THREECEE_USERS;
        }

        if (loadedConfigObj.TWITTER_THREECEE_INFO_USERS !== undefined){
          console.log("WAS | LOADED TWITTER_THREECEE_INFO_USERS: " + loadedConfigObj.TWITTER_THREECEE_INFO_USERS);
          newConfiguration.threeceeInfoUsersArray = loadedConfigObj.TWITTER_THREECEE_INFO_USERS;
        }

        if (loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW_USER !== undefined){
          console.log("WAS | LOADED TWITTER_THREECEE_AUTO_FOLLOW_USER: " + loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW_USER);
          newConfiguration.twitterThreeceeAutoFollowUser = loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW_USER;
        }

        if (loadedConfigObj.CURSOR_BATCH_SIZE !== undefined){
          console.log("WAS | LOADED CURSOR_BATCH_SIZE: " + loadedConfigObj.CURSOR_BATCH_SIZE);
          newConfiguration.cursorBatchSize = loadedConfigObj.CURSOR_BATCH_SIZE;
        }

        if (loadedConfigObj.DROPBOX_WEBHOOK_CHANGE_TIMEOUT !== undefined){
          console.log("WAS | LOADED DROPBOX_WEBHOOK_CHANGE_TIMEOUT: " + loadedConfigObj.DROPBOX_WEBHOOK_CHANGE_TIMEOUT);
          newConfiguration.dropboxWebhookChangeTimeout = loadedConfigObj.DROPBOX_WEBHOOK_CHANGE_TIMEOUT;
        }

        if (loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT !== undefined){
          console.log("WAS | LOADED FIND_CAT_USER_CURSOR_LIMIT: " + loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT);
          newConfiguration.findCatUserLimit = loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT;
        }

        if (loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT !== undefined){
          console.log("WAS | LOADED FIND_CAT_HASHTAG_CURSOR_LIMIT: " + loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT);
          newConfiguration.findCatHashtagLimit = loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT;
        }

        if (loadedConfigObj.HEAPDUMP_ENABLED !== undefined){
          console.log("WAS | LOADED HEAPDUMP_ENABLED: " + loadedConfigObj.HEAPDUMP_ENABLED);
          newConfiguration.heapDumpEnabled = loadedConfigObj.HEAPDUMP_ENABLED;
        }

        if (loadedConfigObj.HEAPDUMP_MODULO !== undefined){
          console.log("WAS | LOADED HEAPDUMP_MODULO: " + loadedConfigObj.HEAPDUMP_MODULO);
          newConfiguration.heapDumpModulo = loadedConfigObj.HEAPDUMP_MODULO;
        }

        if (loadedConfigObj.HEAPDUMP_THRESHOLD !== undefined){
          console.log("WAS | LOADED HEAPDUMP_THRESHOLD: " + loadedConfigObj.HEAPDUMP_THRESHOLD);
          newConfiguration.heapDumpThreshold = loadedConfigObj.HEAPDUMP_THRESHOLD;
        }

        if (loadedConfigObj.NODE_CACHE_CHECK_PERIOD !== undefined){
          console.log("WAS | LOADED NODE_CACHE_CHECK_PERIOD: " + loadedConfigObj.NODE_CACHE_CHECK_PERIOD);
          newConfiguration.nodeCacheCheckPeriod = loadedConfigObj.NODE_CACHE_CHECK_PERIOD;
        }

        if (loadedConfigObj.NODE_CACHE_DEFAULT_TTL !== undefined){
          console.log("WAS | LOADED NODE_CACHE_DEFAULT_TTL: " + loadedConfigObj.NODE_CACHE_DEFAULT_TTL);
          newConfiguration.nodeCacheTtl = loadedConfigObj.NODE_CACHE_DEFAULT_TTL;
        }

        if (loadedConfigObj.SOCKET_IDLE_TIMEOUT !== undefined){
          console.log("WAS | LOADED SOCKET_IDLE_TIMEOUT: " + loadedConfigObj.SOCKET_IDLE_TIMEOUT);
          newConfiguration.socketIdleTimeout = loadedConfigObj.SOCKET_IDLE_TIMEOUT;
        }

        if (loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD !== undefined){
          console.log("WAS | LOADED TOPTERMS_CACHE_CHECK_PERIOD: " + loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD);
          newConfiguration.topTermsCacheCheckPeriod = loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD;
        }

        if (loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL !== undefined){
          console.log("WAS | LOADED TOPTERMS_CACHE_DEFAULT_TTL: " + loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL);
          newConfiguration.topTermsCacheTtl = loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL;
        }

        if (loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD !== undefined){
          console.log("WAS | LOADED TRENDING_CACHE_CHECK_PERIOD: " + loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD);
          newConfiguration.trendingCacheCheckPeriod = loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD;
        }

        if (loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL !== undefined){
          console.log("WAS | LOADED TRENDING_CACHE_DEFAULT_TTL: " + loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL);
          newConfiguration.trendingCacheTtl = loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL;
        }

        if (loadedConfigObj.MIN_FOLLOWERS_AUTO !== undefined){
          console.log("WAS | LOADED MIN_FOLLOWERS_AUTO: " + loadedConfigObj.MIN_FOLLOWERS_AUTO);
          newConfiguration.minFollowersAuto = loadedConfigObj.MIN_FOLLOWERS_AUTO;
        }

        if (loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL !== undefined){
          console.log("WAS | LOADED CATEGORY_HASHMAPS_UPDATE_INTERVAL: " + loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL);
          newConfiguration.categoryHashmapsUpdateInterval = loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL;
        }

        if (loadedConfigObj.STATS_UPDATE_INTERVAL !== undefined){
          console.log("WAS | LOADED STATS_UPDATE_INTERVAL: " + loadedConfigObj.STATS_UPDATE_INTERVAL);
          newConfiguration.statsUpdateInterval = loadedConfigObj.STATS_UPDATE_INTERVAL;
        }

        if (loadedConfigObj.TRANSMIT_NODE_QUEUE_INTERVAL !== undefined){
          console.log("WAS | LOADED TRANSMIT_NODE_QUEUE_INTERVAL: " + loadedConfigObj.TRANSMIT_NODE_QUEUE_INTERVAL);
          newConfiguration.transmitNodeQueueInterval = loadedConfigObj.TRANSMIT_NODE_QUEUE_INTERVAL;
        }

        if (loadedConfigObj.RATE_QUEUE_INTERVAL !== undefined){
          console.log("WAS | LOADED RATE_QUEUE_INTERVAL: " + loadedConfigObj.RATE_QUEUE_INTERVAL);
          newConfiguration.rateQueueInterval = loadedConfigObj.RATE_QUEUE_INTERVAL;
        }

        if (loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO !== undefined){
          console.log("WAS | LOADED RATE_QUEUE_INTERVAL_MODULO: " + loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO);
          newConfiguration.rateQueueIntervalModulo = loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO;
        }

        if (loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW !== undefined){
          console.log("WAS | LOADED TWITTER_THREECEE_AUTO_FOLLOW: " + loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW);
          newConfiguration.twitterThreeceeAutoFollowConfigFile = loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW + ".json";
        }

        if (loadedConfigObj.TWEET_PARSER_INTERVAL !== undefined){
          console.log("WAS | LOADED TWEET_PARSER_INTERVAL: " + loadedConfigObj.TWEET_PARSER_INTERVAL);
          newConfiguration.tweetParserInterval = loadedConfigObj.TWEET_PARSER_INTERVAL;
        }

        if (loadedConfigObj.UPDATE_TRENDS_INTERVAL !== undefined){
          console.log("WAS | LOADED UPDATE_TRENDS_INTERVAL: " + loadedConfigObj.UPDATE_TRENDS_INTERVAL);
          newConfiguration.updateTrendsInterval = loadedConfigObj.UPDATE_TRENDS_INTERVAL;
        }

        if (loadedConfigObj.KEEPALIVE_INTERVAL !== undefined){
          console.log("WAS | LOADED KEEPALIVE_INTERVAL: " + loadedConfigObj.KEEPALIVE_INTERVAL);
          newConfiguration.keepaliveInterval = loadedConfigObj.KEEPALIVE_INTERVAL;
        }

        resolve(newConfiguration);

      });
    })
    .catch(function(err){
      console.error(chalkError("WAS | ERROR LOAD DROPBOX CONFIG: " + fullPath
        + "\n" + jsonPrint(err)
      ));
      reject(err);

    });

  });
}


function loadAllConfigFiles(){

  return new Promise(function(resolve, reject){

    statsObj.status = "LOAD CONFIG";

    loadConfigFile({folder: dropboxConfigDefaultFolder, file: dropboxConfigDefaultFile})
    .then(function(defaultConfig){

      if (defaultConfig) {
        defaultConfiguration = defaultConfig;
        console.log(chalk.green("WAS | +++ RELOADED DEFAULT CONFIG " + dropboxConfigDefaultFolder + "/" + dropboxConfigDefaultFile));
      }

      loadConfigFile({folder: dropboxConfigHostFolder, file: dropboxConfigHostFile})
      .then(function(hostConfig){

        if (hostConfig) {
          hostConfiguration = hostConfig;
          console.log(chalk.green("WAS | +++ RELOADED HOST CONFIG " + dropboxConfigHostFolder + "/" + dropboxConfigHostFile));
        }

        let defaultAndHostConfig = merge(defaultConfiguration, hostConfiguration); // host settings override defaults
        let tempConfig = merge(configuration, defaultAndHostConfig); // any new settings override existing config

        configuration = tempConfig;
        configuration.threeceeUsers = _.uniq(configuration.threeceeUsers);  // merge concats arrays!

        resolve();

      });

    })
    .catch(function(err){
      reject(err);
    });


  });
}

function initStatsUpdate(cnf) {

  return new Promise(function(resolve, reject){

    try {
      console.log(chalkTwitter("WAS | INIT STATS UPDATE INTERVAL | " + cnf.statsUpdateIntervalTime + " MS"));

      let statsUpdated = 0;

      showStats(true);

      clearInterval(statsInterval);
      clearInterval(memStatsInterval);

      memStatsInterval = setInterval(function updateMemStats() {

        statsObj.memory.rss = process.memoryUsage().rss/(1024*1024);

        if (statsObj.memory.rss > statsObj.memory.maxRss) {

          statsObj.memory.maxRss = statsObj.memory.rss;
          statsObj.memory.maxRssTime = moment().valueOf();

          console.log(chalkInfo("WAS | NEW MAX RSS"
            + " | " + getTimeStamp()
            + " | " + statsObj.memory.rss.toFixed(1) + " MB"
          ));

        }
      }, 15000);

      statsInterval = setInterval(function updateStats() {

        getChildProcesses({searchTerm: "ALL"})
        .then(function(childArray){

          if (configuration.verbose)  { 
            console.log(chalkLog("WAS | FOUND " + childArray.length + " CHILDREN"));
          }
          
          childArray.forEach(function(childObj){
            console.log(chalkLog("WAS | CHILD"
              + " | PID: " + childObj.pid 
              + " | " + childObj.childId 
              + " | " + childrenHashMap[childObj.childId].status
            ));
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

        })
        .catch(function(err){

        });

      }, cnf.statsUpdateIntervalTime);

      resolve();
    }
    catch(err){
      reject(err);
    }

  });
}

function initConfig() {

  return new Promise(function(resolve, reject){

    statsObj.status = "INIT CONFIG";

    configuration.processName = process.env.PROCESS_NAME || "node_wordAssoServer";
    configuration.verbose = process.env.VERBOSE || false ;
    configuration.quitOnError = process.env.QUIT_ON_ERROR || false ;
    configuration.enableStdin = process.env.ENABLE_STDIN || true ;
    configuration.statsUpdateIntervalTime = process.env.TFE_STATS_UPDATE_INTERVAL || ONE_MINUTE;

    debug(chalkTwitter("WAS | THREECEE USERS\n" + jsonPrint(configuration.threeceeUsers)));

    configuration.threeceeUsers.forEach(function(user){
      threeceeTwitter[user] = {};
      threeceeTwitter[user].twit = {};
      threeceeTwitter[user].ready = false;
      threeceeTwitter[user].status = "UNCONFIGURED";
      threeceeTwitter[user].error = false;
      threeceeTwitter[user].twitterFollowing = 0;
      threeceeTwitter[user].twitterFriends = [];
      threeceeTwitter[user].twitterFollowLimit = false;
      threeceeTwitter[user].twitterAuthorizationErrorFlag = false;
      threeceeTwitter[user].twitterErrorFlag = false;
      threeceeTwitter[user].twitterTokenErrorFlag = false;
      threeceeTwitter[user].twitterCredentialErrorFlag = false;
      threeceeTwitter[user].twitterRateLimitException = false;
      threeceeTwitter[user].twitterRateLimitExceptionFlag = false;
      threeceeTwitter[user].twitterRateLimitResetAt = false;

      debug(chalkTwitter("WAS | THREECEE USER @" + user + "\n" + jsonPrint(threeceeTwitter[user])));
    });

    configuration.threeceeInfoUsersArray.forEach(function(user){
      threeceeInfoTwitter[user] = {};
      threeceeInfoTwitter[user].twit = {};
      threeceeInfoTwitter[user].ready = false;
      threeceeInfoTwitter[user].status = "UNCONFIGURED";
      threeceeInfoTwitter[user].error = false;
      threeceeInfoTwitter[user].twitterFollowing = 0;
      threeceeInfoTwitter[user].twitterFriends = [];
      threeceeInfoTwitter[user].twitterFollowLimit = false;
      threeceeInfoTwitter[user].twitterAuthorizationErrorFlag = false;
      threeceeInfoTwitter[user].twitterErrorFlag = false;
      threeceeInfoTwitter[user].twitterTokenErrorFlag = false;
      threeceeInfoTwitter[user].twitterCredentialErrorFlag = false;
      threeceeInfoTwitter[user].twitterRateLimitException = false;
      threeceeInfoTwitter[user].twitterRateLimitExceptionFlag = false;
      threeceeInfoTwitter[user].twitterRateLimitResetAt = false;

      debug(chalkTwitter("WAS | THREECEE INFO USER @" + user + "\n" + jsonPrint(threeceeInfoTwitter[user])));
    });

    loadAllConfigFiles()
    .then(function(){

      loadCommandLineArgs()
      .then(function(){

        const configArgs = Object.keys(configuration);

        configArgs.forEach(function(arg){
          if (_.isObject(configuration[arg])) {
            console.log("WAS | _FINAL CONFIG | " + arg + "\n" + jsonPrint(configuration[arg]));
          }
          else {
            console.log("WAS | _FINAL CONFIG | " + arg + ": " + configuration[arg]);
          }
        });
        
        statsObj.commandLineArgsLoaded = true;

        if (configuration.enableStdin) {
          initStdIn().then(function(){});
        }

        initStatsUpdate(configuration)
        .then(function(){
          resolve(configuration);
        });

      });

    })
    .catch(function(err){
      console.log(chalkLog("WAS | *** INIT CONFIG ERROR: " + err));
      return reject(err);
    });

  });
}

function initDbUserChangeStream(params){

  return new Promise(function(resolve, reject){

    const userCollection = global.dbConnection.collection("users");

    userCollection.countDocuments(function(err, count){

      if (err) {
        console.log(chalkError("WAS | *** DB USERS COUNTER ERROR: " + err));
        return reject(err);
      }

      console.log(chalkInfo("WAS | USERS IN DB: " + count));

      const userChangeFilter = {
        "$match": {
          "$or": [
            { operationType: "insert" },
            { operationType: "delete" },
            { operationType: "update" },
            { operationType: "replace" }
          ]
        }
      };

      const userChangeOptions = { fullDocument: "updateLookup" };

      userChangeStream = userCollection.watch([userChangeFilter], userChangeOptions);

      let categoryChanges = {};
      let catObj = {};

      userChangeStream.on("change", function(change){

        if (change 
          && change.fullDocument 
          && change.updateDescription 
          && change.updateDescription.updatedFields 
          && (Object.keys(change.updateDescription.updatedFields).includes("category")
            || Object.keys(change.updateDescription.updatedFields).includes("categoryAuto"))
        ) { 

          categoryChanges = {};

          categoryChanges.manual = change.fullDocument.category;
          categoryChanges.auto = change.fullDocument.categoryAuto;
          
          if (categoryChanges.auto || categoryChanges.manual) {

            catObj = categorizedUserHashMap.get(change.fullDocument.nodeId);

            if (catObj === undefined) {
              catObj = {};
              catObj.screenName = change.fullDocument.screenName;
              catObj.nodeId = change.fullDocument.nodeId;
            }

            catObj.manual = categoryChanges.manual || catObj.manual;
            catObj.auto = categoryChanges.auto || catObj.auto;

            categorizedUserHashMap.set(catObj.nodeId, catObj);

            console.log(chalkInfo("WAS | CHG"
              + " | NID: " + catObj.nodeId
              + " | @" + catObj.screenName
              + " | CAT M: " + categoryChanges.manual + " | A: " + categoryChanges.auto
            ));
          }
        }
        // else {
        //   console.log(chalkLog("WAS | XX> USER CHANGE | " +  change.operationType));
        // }
      });

      resolve();

    });

  });
}

function initCategoryHashmaps(){

  console.log(chalk.bold.black("WAS | INIT CATEGORIZED USER + HASHTAG HASHMAPS FROM DB"));

  return new Promise(function(resolve, reject){

    async.series({

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

        debug(chalkInfo("WAS | LOADING CATEGORIZED USERS FROM DB ..."));

        async.whilst(

          function() {
            return (statsObj.dbConnectionReady && more);
          },

          function(cb0){

            if (!userServerControllerReady || !statsObj.dbConnectionReady) {
              return cb0(new Error("userServerController not ready"), null);
            }

            userServerController.findCategorizedUsersCursor(p, function(err, results){

              if (err) {
                console.log(chalkError("WAS | ERROR: initCategorizedUserHashmap: userServerController: findCategorizedUsersCursor: " + err));
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

                console.log(chalk.bold.blue("WAS | LOADED CATEGORIZED USERS FROM DB"
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
              console.log(chalkError("WAS | *** INIT CATEGORIZED USER HASHMAP ERROR: " + err + "\n" + jsonPrint(err)));
            }
            cb(err);
          }
        );
      },

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

        debug(chalkInfo("WAS | LOADING CATEGORIZED HASHTAGS FROM DB ..."));

        async.whilst(

          function() {
            return (statsObj.dbConnectionReady && more);
          },

          function(cb0){

            hashtagServerController.findCategorizedHashtagsCursor(p, function(err, results){

              if (err) {
                console.log(chalkError("WAS | ERROR: initCategorizedHashtagHashmap: hashtagServerController: findCategorizedHashtagsCursor" + err));
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

                console.log(chalk.bold.blue("WAS | LOADED CATEGORIZED HASHTAGS FROM DB"
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
              console.log(chalkError("WAS | INIT CATEGORIZED HASHTAG HASHMAP ERROR: " + err + "\n" + jsonPrint(err)));
            }
            cb(err);
          }
        );
      }

    }, function(err){
      if (err) {
        console.log(chalkError("WAS | *** ERROR: initCategoryHashmaps: " + err));
        return reject(err);
      }
        
      console.log(chalk.green("WAS | INIT CATEGORIZED HASHMAPS COMPLETE"));
      resolve();

    });

  });
}

let stdin;

function initStdIn(params){

  return new Promise(function(resolve, reject){

    console.log("TNN | STDIN ENABLED");

    stdin = process.stdin;

    if(stdin.setRawMode  !== undefined) {
      stdin.setRawMode( true );
    }
    stdin.resume();
    stdin.setEncoding( "utf8" );
    stdin.on( "data", function( key ){

      switch (key) {
        case "\u0003":
          process.exit();
        break;
        case "t":
          configuration.testMode = !configuration.testMode;
          console.log(chalkAlert("WAS | TEST MODE: " + configuration.testMode));
        break;
        case "x":
          saveSampleTweetFlag = true;
          console.log(chalkAlert("WAS | SAVE SAMPLE TWEET"));
        break;
        case "v":
          configuration.verbose = !configuration.verbose;
          console.log(chalkAlert("WAS | VERBOSE: " + configuration.verbose));
        break;
        case "q":
          quit();
        break;
        case "Q":
          quit();
        break;
        case "s":
          showStats();
        break;
        case "S":
          showStats(true);
        break;
        default:
          console.log(chalkAlert(
            "\n" + "q/Q: quit"
            + "\n" + "s: showStats"
            + "\n" + "S: showStats verbose"
            + "\n" + "v: verbose log"
          ));
      }
    });

    resolve();

  });
}

function initIgnoreWordsHashMap() {
  return new Promise(function(resolve, reject){

    async.each(ignoreWordsArray, function ignoreWordHashMapSet(ignoreWord, cb) {
      ignoreWordHashMap.set(ignoreWord, true);
      ignoreWordHashMap.set(ignoreWord.toLowerCase(), true);
      cb();
    }, function ignoreWordHashMapError(err) {
      resolve();
    });

  });
}

let updateUserSetsInterval;
let updateUserSetsIntervalReady = true;

function initUpdateUserSetsInterval(interval){

  clearInterval(updateUserSetsInterval);

  console.log(chalk.bold.black("WAS | INIT USER SETS INTERVAL | " + msToTime(interval) ));

  updateUserSetsInterval = setInterval(function() {

    try {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];
      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

      if (statsObj.dbConnectionReady && updateUserSetsIntervalReady && (uncategorizedManualUserArray.length < 10)) {

        updateUserSetsIntervalReady = false;

        updateUserSets()
        .then(function(){
          updateUserSetsIntervalReady = true;
        });


      }

    }
    catch(err){
      console.log(chalkError("WAS | UPDATE USER SETS ERROR: " + err));
      updateUserSetsIntervalReady = true;
    }


  }, interval);
}

let memStatsInterval;

function initStatsInterval(interval){

  let statsUpdated = 0;

  console.log(chalk.bold.black("WAS | INIT STATS INTERVAL"
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

      console.log(chalkInfo("WAS | NEW MAX RSS"
        + " | " + getTimeStamp()
        + " | " + statsObj.memory.rss.toFixed(1) + " MB"
      ));

    }
  }, 15000);

  statsInterval = setInterval(function updateStats() {

    getChildProcesses({searchTerm: "ALL"}, function(err, childArray){

      if (configuration.verbose)  { console.log(chalkLog("WAS | FOUND " + childArray.length + " CHILDREN")); }
      
      childArray.forEach(function(childObj){
        console.log(chalkLog("WAS | CHILD | PID: " + childObj.pid + " | " + childObj.childId + " | " + childrenHashMap[childObj.childId].status));
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

function initThreeceeTwitterUsers(params){

  return new Promise(function(resolve, reject){

    const threeceeUsers = params.threeceeUsers;

    console.log(chalkTwitter("WAS | INIT THREECEE TWITTER USERS\n" + jsonPrint(threeceeUsers)));

    async.eachSeries(threeceeUsers, function(user, cb){

      console.log(chalkTwitter("WAS | LOADING TWITTER CONFIG | @" + user));

      const configFile = user + ".json";

      try {

        loadFile({folder: dropboxConfigTwitterFolder, file: configFile})
        .then(function(twitterConfig){

          console.log(chalkTwitter("WAS | LOADED TWITTER CONFIG"
            + " | 3C @" + user
            + " | " + dropboxConfigTwitterFolder + "/" + configFile
            // + "\nCONFIG\n" + jsonPrint(twitterConfig)
          ));

          if (!configuration.threeceeUsers.includes(twitterConfig.screenName)) {
            console.log(chalkAlert("WAS | SKIP CONFIG @" + twitterConfig.screenName + " | NOT IN 3C USERS: " + configuration.threeceeUsers));
            return cb() ;
          }

          threeceeTwitter[user].twitterConfig = {};
          threeceeTwitter[user].twitterConfig = twitterConfig;

          threeceeTwitter[user].twit = new Twit({
            consumer_key: twitterConfig.consumer_key, 
            consumer_secret:twitterConfig.consumer_secret,
            app_only_auth: true
          });

          threeceeTwitter[user].ready = true;
          threeceeTwitter[user].status = false;
          threeceeTwitter[user].error = false;
          statsObj.threeceeUsersConfiguredFlag = true;

          cb();

        });
      }

      catch(err) {

        if (err.code === "ENOTFOUND") {
          console.log(chalkError("WAS | *** LOAD TWITTER CONFIG ERROR: FILE NOT FOUND"
            + " | " + dropboxConfigTwitterFolder + "/" + configFile
          ));
        }
        else {
          console.log(chalkError("WAS | *** LOAD TWITTER CONFIG ERROR: " + err));
        }

        threeceeTwitter[user].error = "CONFIG LOAD ERROR: " + err;
        threeceeTwitter[user].ready = false;
        threeceeTwitter[user].twit = false;
        threeceeTwitter[user].status = false;

        return cb(err);
      }

    }, async function(err){

      if (err) {
        return reject(err);
      }

      try{
        let currentThreeceeUser = await getCurrentThreeceeUser();
        console.log(chalkInfo("WAS | CURRENT 3C TWITTER USER: @" + currentThreeceeUser));
        resolve(currentThreeceeUser);
      }
      catch(err){
        console.log(chalkInfo("WAS | *** CURRENT 3C TWITTER USER ERROR: " + err));
        return reject(err);
      }
    
    });

  });
}

function twitterGetUserUpdateDb(user, callback){

  if (!user.userId && !user.nodeId && !user.screenName) { return callback("NO USER PROPS", null); }

  getCurrentThreeceeUser()
  .then(async function(currentThreeceeUser){

    if ( currentThreeceeUser
      && (threeceeTwitter[currentThreeceeUser] !== undefined)
      && threeceeTwitter[currentThreeceeUser].ready) {

      printUserObj("WAS | GET USER TWITTER DATA", user);

      let twitQuery = {};

      twitQuery.include_entities = true;

      if (user.nodeId !== undefined) { twitQuery.user_id = user.nodeId; }
      if (user.userId !== undefined) { twitQuery.user_id = user.userId; }
      if (user.screenName !== undefined) { twitQuery.screen_name = user.screenName; }

      threeceeTwitter[currentThreeceeUser].twit.get("users/show", twitQuery, function usersShow (err, rawUser, response){

        if (err) {

          console.log(chalkError("WAS | *** ERROR users/show rawUser"
            + " | @" + user.screenName 
            + " | " + err 
            + "\nerr\n" + jsonPrint(err)
            + "\ntwitQuery\n" + jsonPrint(twitQuery)
          ));

          return callback("NO TWITTER UPDATE", user);
        }

        if (rawUser && (rawUser !== undefined)) {

          if (!userServerControllerReady || !statsObj.dbConnectionReady) {
            return callback(new Error("userServerController not ready"), null);
          }

          userServerController.convertRawUser({user:rawUser}, async function(err, cUser){

            if (err) {
              console.log(chalkError("WAS | *** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
              return callback("RAW USER", rawUser);
            }

            printUserObj("FOUND users/show rawUser", cUser);

            user.bannerImageUrl = cUser.bannerImageUrl;
            user.createdAt = cUser.createdAt;
            user.description = cUser.description;
            user.followersCount = cUser.followersCount;
            user.friendsCount = cUser.friendsCount;
            user.ignored = cUser.ignored;
            user.lang = cUser.lang;
            user.lastSeen = (cUser.status && (cUser.status !== undefined)) ? cUser.status.created_at : Date.now();
            user.lastTweetId = cUser.lastTweetId;
            user.location = cUser.location;
            user.name = cUser.name;
            user.nodeId = cUser.nodeId;
            user.profileImageUrl = cUser.profileImageUrl;
            user.profileUrl = cUser.profileUrl;
            user.screenName = cUser.screenName;
            user.status = cUser.status;
            user.statusesCount = cUser.statusesCount;
            user.statusId = cUser.statusId;
            user.updateLastSeen = true;
            user.url = cUser.url;
            user.userId = cUser.userId;
            user.verified = cUser.verified;

            let nCacheObj = nodeCache.get(user.nodeId);

            if (nCacheObj) {
              user.mentions = Math.max(user.mentions, nCacheObj.mentions);
              user.setMentions = true;
            }

            try{
              const updatedUser = await userServerController.findOneUserV2({user: user, mergeHistograms: false, noInc: true});
              console.log(chalk.blue("WAS | UPDATED updatedUser"
                + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
                + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
                + "\n" + printUser({user:updatedUser})
              ));
              callback(null, updatedUser);
            }
            catch(err){
              console.log(chalkError("WAS | *** findOneUser ERROR: " + err));
              return callback("NO DB UPDATE", user);
            }
          });
        }
        else {
          console.log(chalkTwitter("WAS | NOT FOUND users/show data"));
          callback("TWITTER NOT FOUND", user);
        }
      });
    }
    else if (threeceeTwitter[currentThreeceeUser] !== undefined) {
      console.log(chalkTwitter("WAS | XXX TWITTER_SEARCH_NODE USER FAIL"
        + " | 3C @" + currentThreeceeUser
        + " | 3C READY: " + threeceeTwitter[currentThreeceeUser].ready
        + "\n" + printUser({user:user})
      ));
      callback("TWITTER NOT READY", user);
    }
    else {
      console.log(chalkTwitter("WAS | XXX TWITTER_SEARCH_NODE USER FAIL"
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

      // if (!statsObj.dbConnectionReady) {
      //   return callback("DB CONNECTION NOT READY", user);
      // }

      if (!userServerControllerReady || !statsObj.dbConnectionReady) {
        return callback(new Error("userServerController not ready"), user);
      }

      try{

        const updatedUser = await userServerController.findOneUserV2({user: user, mergeHistograms: false, noInc: true});

        console.log(chalk.blue("WAS | UPDATED updatedUser"
          + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
          + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
          + "\n" + printUser({user:updatedUser})
        ));

        callback(null, updatedUser);

      }
      catch(err){
        console.log(chalkError("WAS | *** findOneUser ERROR: " + err));
        return callback("NO DB OR TWITTER UPDATE", user);
      }

      // userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

      //   if (err) {
      //     console.log(chalkError("WAS | *** findOneUser ERROR: " + err));
      //     return callback("NO DB OR TWITTER UPDATE", user);
      //   }

      //   console.log(chalk.blue("WAS | UPDATED updatedUser"
      //     + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
      //     + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
      //     + "\n" + printUser({user:updatedUser})
      //   ));

      //   callback(null, updatedUser);

      // });
    }
  })
  .catch(function(err){
    console.log(chalkError("WAS | *** GET CURRENT 3C USER ERROR: " + err));
    return callback(err, null);
  });
}

function twitterSearchUserNode(searchQuery, callback){

  User.findOne(searchQuery, function(err, user){

    if (err) {
      console.log(chalkError("WAS | *** TWITTER SEARCH NODE USER ERROR"
        + "searchQuery\n" + jsonPrint(searchQuery)
        + "ERROR\n" + jsonPrint(err)
      ));
      callback("DB ERROR", null);
    }
    
    else if (user) {

      printUserObj("WAS | TWITTER SEARCH DB | FOUND USER", user);

      twitterGetUserUpdateDb(user, function(err, updatedUser){
        if (err) { callback(err, null); }
        else if (updatedUser) { callback(err, updatedUser); }
        else { callback(null, null); }
      });

    }
    else {

      console.log(chalkLog("WAS | TWITTER SEARCH DB USER NOT FOUND"
        + "\nsearchQuery\n" + jsonPrint(searchQuery)
      ));

      twitterGetUserUpdateDb(searchQuery, function(err, updatedUser){
        if (err) { callback(err, null); }
        else if (updatedUser) { callback(err, updatedUser); }
        else { callback(null, null); }
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
        console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE HASHTAG ERROR\n" + jsonPrint(err)));
        callback(err, null);
      }
      else if (hashtag) { 
        console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG FOUND\n" + jsonPrint(hashtag)));

        viewNameSpace.emit("SET_TWITTER_HASHTAG", hashtag);

        if (hashtag.category) { 
          let htCatObj = {};
          htCatObj.manual = hashtag.category;
          htCatObj.auto = false;
          if (categorizedHashtagHashMap.has(hashtag.nodeId.toLowerCase())) {
            htCatObj.auto = categorizedHashtagHashMap.get(hashtag.nodeId.toLowerCase()).auto || false ;
          }
          categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), htCatObj);
        }
        callback(null, hashtag);
      }
      else {
        console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG NOT FOUND: #" + searchNodeHashtag.nodeId));
        console.log(chalkTwitter("WAS | +++ CREATE NEW HASHTAG: #" + searchNodeHashtag.nodeId));

        new Hashtag({
          nodeId: searchNodeHashtag.nodeId.toLowerCase(), 
          text: searchNodeHashtag.nodeId.toLowerCase()})
        .save(function(err, newHt){
          if (err) {
            console.log(chalkError("WAS | *** ERROR:  SAVE NEW HASHTAG"
              + " | #" + searchNodeHashtag.nodeId.toLowerCase()
              + " | ERROR: " + err
            ));
            return callback(err, null);
          }

          console.log(chalk.blue("WAS | +++ SAVED NEW HASHTAG"
            + " | #" + newHt.nodeId
          ));

          viewNameSpace.emit("SET_TWITTER_HASHTAG", newHt);

          callback(null, newHt);
        });
      }
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
          if (err){
            console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
              + " [ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
              + " | " + getTimeStamp()
              + " | SEARCH UNCATEGORIZED USER"
              + " | UID: " + uncategorizedUserId
              + " | ERROR: " + err
            ));

            uncategorizedManualUserSet.delete(uncategorizedUserId);
            ignoredUserSet.add(uncategorizedUserId);
          }
          else if (user) {
            if (tfeChild !== undefined) { 

              const categorizeable = userCategorizeable(user);

              if (categorizeable) { 
                if (user.toObject && (typeof user.toObject === "function")) {
                  tfeChild.send({op: "USER_CATEGORIZE", user: user.toObject()});
                }
                else {
                  tfeChild.send({op: "USER_CATEGORIZE", user: user});
                }
              }

            }

            viewNameSpace.emit("SET_TWITTER_USER", user.toObject());

            console.log(chalkBlue("WAS | T> TWITTER_SEARCH_NODE"
              + " | " + params.socketId
              + "[ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
              + " | " + getTimeStamp()
              + " | @" + user.screenName
              + " | NID: " + user.nodeId
            ));

            uncategorizedManualUserSet.delete(user.nodeId);
          }
          else {
            console.log(chalkAlert("WAS | --- TWITTER_SEARCH_NODE NOT FOUND"
              + "[ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
              + " | " + getTimeStamp()
              + " | SEARCH UNCATEGORIZED USER"
              + " | UID: " + uncategorizedUserId
              + " | ERROR: " + err
            ));
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
          if (err){
            console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
              + " [ UC MISMATCHED ARRAY: " + mismatchUserArray.length + "]"
              + " | " + getTimeStamp()
              + " | SEARCH MISMATCHED USER"
              + " | UID: " + mismatchedUserId
              + " | ERROR: " + err
            ));
          }
          else if (user) {
            viewNameSpace.emit("SET_TWITTER_USER", user.toObject());
          }
          else {
            console.log(chalkAlert("WAS | --- TWITTER_SEARCH_NODE NOT FOUND"
              + " [ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
              + " | " + getTimeStamp()
              + " | SEARCH MISMATCHED USER"
              + " | UID: " + uncategorizedUserId
              + " | ERROR: " + err
            ));
          }
          callback(err, user);
        });
      }
      else {
        callback(null, null);
      }
    }
    else {
      console.log(chalkInfo("WAS | SEARCH FOR SPECIFIC USER | " + jsonPrint(searchNodeUser)));
      nodeSearchType = "USER_SPECIFIC";

      twitterSearchUserNode(searchNodeUser, function(err, user){
        if (err){
          console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
            + " | " + getTimeStamp()
            + " | SEARCH USER_SPECIFIC"
            + " | USER: " + searchNodeUser
            + " | ERROR: " + err
          ));
        }
        else if (user) {
          viewNameSpace.emit("SET_TWITTER_USER", user.toObject());
        }
        else {
          console.log(chalkAlert("WAS | --- TWITTER_SEARCH_NODE NOT FOUND"
            + "[ UC USER ARRAY: " + uncategorizedManualUserArray.length + "]"
            + " | " + getTimeStamp()
            + " | SEARCH USER_SPECIFIC USER"
            + " | UID: " + uncategorizedUserId
            + " | ERROR: " + err
          ));
        }
        callback(err, user);
      });

    }
  }
  else {
    callback(null, null);
  }
}

function initTwitterSearchNodeQueueInterval(interval){

  let searchNodeParams;
  twitterSearchNodeQueueReady = true;

  console.log(chalk.bold.black("WAS | INIT TWITTER SEARCH NODE QUEUE INTERVAL: " + msToTime(interval)));

  clearInterval(twitterSearchNodeQueueInterval);

  twitterSearchNodeQueueInterval = setInterval(function txSearchNodeQueue () {

    if (twitterSearchNodeQueueReady && (twitterSearchNodeQueue.length > 0)) {

      twitterSearchNodeQueueReady = false;

      searchNodeParams = twitterSearchNodeQueue.shift();

      let searchTimeout = setTimeout(function(){

        console.log(chalkAlert(
          "WAS | *** SEARCH NODE TIMEOUT\nsearchNodeParams\n" + jsonPrint(searchNodeParams)
        ));

      }, 5000);

      twitterSearchNode(searchNodeParams, function(err, node){

        if (err) {
          console.log(chalkError("WAS | *** TWITTER SEARCH NODE ERROR: " + err));
        }
        else if (node) {
          console.log(chalk.green("WAS | TWITTER SEARCH NODE FOUND | NID: " + node.nodeId));
        }

        clearTimeout(searchTimeout);

        twitterSearchNodeQueueReady = true;
      });
    }

  }, interval);
}

initStats(function setCacheObjKeys(){
  cacheObjKeys = Object.keys(statsObj.caches);
});

setTimeout(function(){

  try {

    initConfig()
    .then(function(cnf){

      configuration = deepcopy(cnf);

      console.log("WAS | " + chalkTwitter(configuration.processName + " STARTED " + getTimeStamp() ));

      statsObj.status = "START";


      if (configuration.testMode) {
      }

      console.log(chalkTwitter("WAS" 
        + " | " + configuration.processName 
      ));

      killAll().then(function(){

        io = require("socket.io")(httpServer, ioConfig);

        dbConnectionReadyInterval = setInterval(function() {

          if (statsObj.dbConnectionReady) {

            try {

              clearInterval(dbConnectionReadyInterval);

              if (configuration.twitter === undefined) { configuration.twitter = {}; }

              initInternetCheckInterval(ONE_MINUTE)
              .then(()=>addAccountActivitySubscription())
              .then(()=>initKeySortInterval(configuration.keySortInterval))
              .then(()=>initDropboxSync())
              .then(()=>initSaveFileQueue(configuration))
              .then(()=>updateUserSets())
              .then(()=>loadBestRuntimeNetwork())
              .then(()=>loadMaxInputHashMap())
              .then(()=>initCategoryHashmaps())
              .then(()=>initIgnoreWordsHashMap())
              .then(()=>initThreeceeTwitterUsers({threeceeUsers: configuration.threeceeUsers}))
              .then(()=>initTransmitNodeQueueInterval(configuration.transmitNodeQueueInterval))
              .then(()=>initRateQinterval(configuration.rateQueueInterval))
              .then(()=>initTwitterRxQueueInterval(configuration.twitterRxQueueInterval))
              .then(()=>initTweetParserMessageRxQueueInterval(configuration.tweetParserMessageRxQueueInterval))
              .then(()=>initTwitterSearchNodeQueueInterval(configuration.twitterSearchNodeQueueInterval))
              .then(()=>initSorterMessageRxQueueInterval(configuration.sorterMessageRxQueueInterval))
              .then(()=>initDbuChild({childId: DEFAULT_DBU_CHILD_ID}))
              .then(()=>initTweetParser({childId: DEFAULT_TWP_CHILD_ID}))
              .then(()=>initTfeChild({childId: DEFAULT_TFE_CHILD_ID}))
              .then(()=>initDbUserChangeStream())
              .then(()=>initTssChildren())
              .catch(function(err){
                console.log(chalkError("WAS | *** INIT ERROR: " + err));
              });

            }
            catch(err){
              console.log(chalkError("WAS | *** DB CONNECT READY INTERVAL ERROR: " + err));
            }
            
          }
          else {
            console.log(chalkLog("WAS | WAIT DB CONNECTED ..."));
          }
        }, 1000);

      });

    });

  }
  catch(err){
    console.log(chalkError("WAS | **** INIT CONFIG ERROR: " + err + "\n" + jsonPrint(err)));
    if (err.code !== 404) {
      console.log("WAS | *** INIT CONFIG ERROR | err.status: " + err.status);
      quit();
    }
  }
}, 1000);


module.exports = {
  app: app,
  io: io,
  http: httpServer
};