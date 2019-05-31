/*jslint node: true */
/*jshint sub:true*/
const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

const DEFAULT_START_TIMEOUT = ONE_MINUTE;

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

global.globalDbConnection = false;

const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

global.globalWordAssoDb = require("@threeceelabs/mongoose-twitter");

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

let HashtagServerController;
let hashtagServerController;

let UserServerController;
let userServerController;
let userServerControllerReady = false;

let neuralNetworkChangeStream;
let userChangeStream;

let userSearchCursor;

let heartbeatInterval;

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const DEFAULT_IGNORE_CATEGORY_RIGHT = false;
const DEFAULT_GEOCODE_ENABLED = false;
const DEFAULT_FILTER_DUPLICATE_TWEETS = true;
const DEFAULT_AUTO_FOLLOW = false;
const DEFAULT_FORCE_FOLLOW = false;
const DEFAULT_FORCE_IMAGE_ANALYSIS = false;
const DEFAULT_ENABLE_IMAGE_ANALYSIS = true;
const DEFAULT_UPDATE_USER_SETS_INTERVAL = 5*ONE_MINUTE;
const DEFAULT_SAVE_FILE_QUEUE_INTERVAL = 5*ONE_SECOND;
const DEFAULT_ENABLE_TWITTER_FOLLOW = false;
const DEFAULT_TWITTER_SEARCH_NODE_QUEUE_INTERVAL = 100;
const DEFAULT_TEST_INTERNET_CONNECTION_URL = "www.google.com";
const DEFAULT_CURSOR_BATCH_SIZE = 100;

const DEFAULT_THREECEE_USERS = [
  "altthreecee00"
];
const DEFAULT_THREECEE_INFO_USERS = ["threecee", "threeceeinfo", "ninjathreecee"];

const DEFAULT_CHILD_ID_PREFIX = "wa_node_child_";

const DEFAULT_DBU_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "dbu";
const DEFAULT_TFE_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "tfe";
const DEFAULT_TWP_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "twp";
const DEFAULT_TSS_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "tss";

let dbuChild;
let tfeChild;

const tssChildren = {};

DEFAULT_THREECEE_USERS.forEach(function(threeceeUser){
  tssChildren[threeceeUser] = {};
  tssChildren[threeceeUser].childId = DEFAULT_TSS_CHILD_ID + "_" + threeceeUser.toLowerCase();
});


const DEFAULT_TWITTER_THREECEE_USER = "altthreecee00";
const DEFAULT_DROPBOX_LIST_FOLDER_LIMIT = 50;
const DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT = Number(ONE_SECOND);

const DEFAULT_INTERVAL = 5;
const DEFAULT_MIN_FOLLOWERS_AUTO = 10000;

const DEFAULT_TWEET_PARSER_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_SORTER_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TWITTER_RX_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const TWP_PING_INTERVAL = 10*ONE_MINUTE;
const DBU_PING_INTERVAL = 10*ONE_MINUTE;
const TFE_PING_INTERVAL = 10*ONE_MINUTE;

const DEFAULT_RATE_QUEUE_INTERVAL = ONE_SECOND; // 1 second
const DEFAULT_RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const DEFAULT_STATS_UPDATE_INTERVAL = ONE_MINUTE;
const DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL = 5*ONE_MINUTE;

const DEFAULT_SOCKET_AUTH_TIMEOUT = 30*ONE_SECOND;
const DEFAULT_QUIT_ON_ERROR = false;
const DEFAULT_MAX_TOP_TERMS = 100;
const DEFAULT_METRICS_NODE_METER_ENABLED = true;

const DEFAULT_MAX_QUEUE = 200;
const DEFAULT_OFFLINE_MODE = process.env.OFFLINE_MODE || false; 
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
const chalkSocket = chalk.black;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkWarn = chalk.bold.yellow;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkBlue = chalk.blue;

const btoa = require("btoa");
const request = require("request-promise-native");
const _ = require("lodash");
const touch = require("touch");
const merge = require("deepmerge");
const Measured = require("measured");
const omit = require("object.omit");
const pick = require("object.pick");
const config = require("./config/config");
const fs = require("fs");
const path = require("path");
const async = require("async");
const debug = require("debug")("wa");
const debugCache = require("debug")("cache");
const debugCategory = require("debug")("kw");
const moment = require("moment");
const treeify = require("treeify");

let prevAllowLocationsFileModifiedMoment = moment("2010-01-01");
let prevIgnoredLocationsFileModifiedMoment = moment("2010-01-01");

const express = require("express");
const app = express();
app.set("trust proxy", 1); // trust first proxy

const expressSession = require("express-session");
const MongoStore = require("connect-mongo")(expressSession);
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;

app.use(express.urlencoded());
app.use(express.json());
app.use(require("serve-static")(path.join(__dirname, "public")));

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

const allowLocationsSet = new Set();
allowLocationsSet.add("new england");
let allowLocationsArray = Array.from(allowLocationsSet);
let allowLocationsString = allowLocationsArray.join('\\b|\\b');
allowLocationsString = '\\b' + allowLocationsString + '\\b';
let allowLocationsRegEx = new RegExp(allowLocationsString, "i");

const ignoreLocationsSet = new Set();
ignoreLocationsSet.add("india");
ignoreLocationsSet.add("africa");
ignoreLocationsSet.add("canada");
ignoreLocationsSet.add("britain");
ignoreLocationsSet.add("mumbai");
ignoreLocationsSet.add("london");
ignoreLocationsSet.add("england");
ignoreLocationsSet.add("nigeria");
ignoreLocationsSet.add("lagos");
let ignoreLocationsArray = Array.from(ignoreLocationsSet);
let ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
let ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "i");

const crypto = require("crypto");
const NodeCache = require("node-cache");
const commandLineArgs = require("command-line-args");
const metricsRate = "5MinuteRate";
const shell = require("shelljs");
const jsonParse = require("json-parse-safe");
const methodOverride = require("method-override");
const deepcopy = require("deep-copy");
const sizeof = require("object-sizeof");
const writeJsonFile = require("write-json-file");

const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

const statsObj = {};
statsObj.commandLineArgsLoaded = false;
statsObj.currentThreeceeUserIndex = 0;
statsObj.currentThreeceeUser = "altthreecee00";
statsObj.threeceeUsersConfiguredFlag = false;
statsObj.twitNotReadyWarning = false;
statsObj.initSetsComplete = false;

statsObj.dbuChildReady = false;
statsObj.tfeChildReady = false;

statsObj.tssChildren = {};

statsObj.user = {};

statsObj.user.manual = {};
statsObj.user.manual.right = 0;
statsObj.user.manual.left = 0;
statsObj.user.manual.neutral = 0;
statsObj.user.manual.positive = 0;
statsObj.user.manual.negative = 0;
statsObj.user.manual.none = 0;

statsObj.user.auto = {};
statsObj.user.auto.right = 0;
statsObj.user.auto.left = 0;
statsObj.user.auto.neutral = 0;
statsObj.user.auto.positive = 0;
statsObj.user.auto.negative = 0;
statsObj.user.auto.none = 0;

statsObj.user.total = 0;
statsObj.user.following = 0;
statsObj.user.notFollowing = 0;
statsObj.user.categorizedTotal = 0;
statsObj.user.categorizedManual = 0;
statsObj.user.categorizedAuto = 0;

statsObj.user.uncategorized = {};
statsObj.user.uncategorized.all = 0;
statsObj.user.uncategorized.left = 0;
statsObj.user.uncategorized.right = 0;
statsObj.user.uncategorized.neutral = 0;

statsObj.user.uncategorizedTotal = 0;
statsObj.user.uncategorizedManual = 0;
statsObj.user.uncategorizedAuto = 0;
statsObj.user.matched = 0;
statsObj.user.mismatched = 0;
statsObj.user.uncategorizedManualUserArray = 0;

DEFAULT_THREECEE_USERS.forEach(function(threeceeUser){
  statsObj.tssChildren[threeceeUser] = {};
  statsObj.tssChildren[threeceeUser].ready = false;
});

let configuration = {};
let defaultConfiguration = {}; // general configuration
let hostConfiguration = {}; // host-specific configuration

configuration.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
configuration.verbose = false;
configuration.ignoreCategoryRight = DEFAULT_IGNORE_CATEGORY_RIGHT;
configuration.maxQueue = DEFAULT_MAX_QUEUE;
configuration.filterDuplicateTweets = DEFAULT_FILTER_DUPLICATE_TWEETS;
configuration.forceFollow = DEFAULT_FORCE_FOLLOW;
configuration.enableTwitterFollow = DEFAULT_ENABLE_TWITTER_FOLLOW;
configuration.autoFollow = DEFAULT_AUTO_FOLLOW;
configuration.enableImageAnalysis = DEFAULT_ENABLE_IMAGE_ANALYSIS;
configuration.forceImageAnalysis = DEFAULT_FORCE_IMAGE_ANALYSIS;
configuration.geoCodeEnabled = DEFAULT_GEOCODE_ENABLED;

configuration.threeceeUser = DEFAULT_TWITTER_THREECEE_USER;

configuration.threeceeInfoUsersArray = DEFAULT_THREECEE_INFO_USERS;

configuration.dropboxListFolderLimit = DEFAULT_DROPBOX_LIST_FOLDER_LIMIT;
configuration.dropboxWebhookChangeTimeout = DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT;

configuration.tweetParserMessageRxQueueInterval = DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL;
configuration.tweetParserInterval = DEFAULT_TWEET_PARSER_INTERVAL;
configuration.updateUserSetsInterval = DEFAULT_UPDATE_USER_SETS_INTERVAL;
configuration.sorterMessageRxQueueInterval = DEFAULT_SORTER_INTERVAL;
configuration.transmitNodeQueueInterval = DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL;
configuration.rateQueueInterval = DEFAULT_RATE_QUEUE_INTERVAL;
configuration.rateQueueIntervalModulo = DEFAULT_RATE_QUEUE_INTERVAL_MODULO;
configuration.statsUpdateInterval = DEFAULT_STATS_UPDATE_INTERVAL;

configuration.DROPBOX = {};
configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
configuration.DROPBOX.DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
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

const threeceeUser = "altthreecee00";

const Twit = require(path.join(__dirname, "/js/libs/twit"));

const threeceeTwitter = {};
threeceeTwitter.config = {};

const threeceeInfoTwitter = {};
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

  let currentTimeStamp;

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

  statsObj.status = "QUITTING";

  console.log(chalkAlert("\nWAS | ... QUITTING ... " + getTimeStamp()));

  if (userSearchCursor !== undefined) { userSearchCursor.close(); }
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
  if (message) { msg = message; }

  console.log(chalkAlert("WAS | ... QUITTING ..."));
  console.log(chalkAlert("WAS | QUIT MESSAGE: " + msg));
  console.error(chalkAlert("WAS | QUIT MESSAGE: " + msg));

  if (global.globalDbConnection) {

    global.globalDbConnection.close(function () {

      statsObj.dbConnectionReady = false;

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

const userRightSet = new Set();
const userLeftSet = new Set();
const userNeutralSet = new Set();
const userPositiveSet = new Set();
const userNegativeSet = new Set();
const userNoneSet = new Set();

const userAutoRightSet = new Set();
const userAutoLeftSet = new Set();
const userAutoNeutralSet = new Set();
const userAutoPositiveSet = new Set();
const userAutoNegativeSet = new Set();
const userAutoNoneSet = new Set();

const ignoredHashtagFile = "ignoredHashtag.json";
const ignoredUserFile = "ignoredUser.json";
const unfollowableUserFile = "unfollowableUser.json";
const followableSearchTermFile = "followableSearchTerm.txt";

const pendingFollowSet = new Set();
const followableUserSet = new Set();
const categorizeableUserSet = new Set();
const followableSearchTermSet = new Set();

followableSearchTermSet.add("potus");
followableSearchTermSet.add("trump");
followableSearchTermSet.add("trumps");
followableSearchTermSet.add("obama");
followableSearchTermSet.add("obamas");
followableSearchTermSet.add("clinton");
followableSearchTermSet.add("clintons");
followableSearchTermSet.add("pence");
followableSearchTermSet.add("pences");
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
followableSearchTermSet.add("gop");
followableSearchTermSet.add("dem");
followableSearchTermSet.add("bluewave");
followableSearchTermSet.add("bluetsunami");
followableSearchTermSet.add("liberal");
followableSearchTermSet.add("liberals");
followableSearchTermSet.add("senate");
followableSearchTermSet.add("senator");
followableSearchTermSet.add("senators");
followableSearchTermSet.add("democrat");
followableSearchTermSet.add("democrats");
followableSearchTermSet.add("congress");
followableSearchTermSet.add("republican");
followableSearchTermSet.add("republicans");
followableSearchTermSet.add("conservative");
followableSearchTermSet.add("conservatives");
followableSearchTermSet.add("livesmatter");
followableSearchTermSet.add("abortion");
followableSearchTermSet.add("prochoice");
followableSearchTermSet.add("pro choice");
followableSearchTermSet.add("pro-choice");
followableSearchTermSet.add("prolife");
followableSearchTermSet.add("pro life");
followableSearchTermSet.add("pro-life");

followableSearchTermSet.add("election");
followableSearchTermSet.add("elections");
followableSearchTermSet.add("scotus");
followableSearchTermSet.add("supreme court");

followableSearchTermSet.add("specialcounsel");
followableSearchTermSet.add("special counsel");

let followableSearchTermsArray = [...followableSearchTermSet];
// let followableSearchTermString = followableSearchTermsArray.join('\\b|\\b');
// followableSearchTermString = '\\b' + followableSearchTermString + '\\b';

// console.log("followableSearchTermString\n" + followableSearchTermString);

// let followableRegEx = new RegExp('/' + followableSearchTermString + '/', "i");

const DEFAULT_BEST_NETWORK_FOLDER = "/config/utility/best/neuralNetworks";
const bestNetworkFolder = DEFAULT_BEST_NETWORK_FOLDER;

const DEFAULT_BEST_NETWORK_FILE = "bestRuntimeNetwork.json";
const bestRuntimeNetworkFileName = DEFAULT_BEST_NETWORK_FILE;


const DEFAULT_MAX_INPUT_HASHMAP_FILE = "maxInputHashMap.json";
const maxInputHashMapFile = DEFAULT_MAX_INPUT_HASHMAP_FILE;

const previousUserUncategorizedCreated = moment();

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


const twitterUserThreecee = {
  nodeId: "14607119",
  profileImageUrl: "https://pbs.twimg.com/profile_images/780466729692659712/p6RcVjNK.jpg",
  profileUrl: "https://twitter.com/threecee",
  url: "http://threeCeeMedia.com",
  name: "Tracy Collins",
  screenName: "threecee",
  nodeType: "user",
  following: null,
  description: "photography + animation + design",
  isTwitterUser: true,
  screenNameLower: "threecee"
};

const defaultTwitterUser = twitterUserThreecee;

const followedUserSet = new Set();
const unfollowableUserSet = new Set();
const ignoredUserSet = new Set();
const ignoredHashtagSet = new Set();

process.title = "node_wordAssoServer";
console.log(chalkBlue("\n\nWAS | ============== START ==============\n\n"));

console.log(chalkBlue("WAS | PROCESS PID:   " + process.pid));
console.log(chalkBlue("WAS | PROCESS TITLE: " + process.title));
console.log(chalkBlue("WAS | ENVIRONMENT:   " + process.env.NODE_ENV));

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================


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
const categorizedHashtagHashMap = new HashMap();
const adminHashMap = new HashMap();

const tweetMeter = new Measured.Meter({rateUnit: 60000});
const globalNodeMeter = new Measured.Meter({rateUnit: 60000});

let nodeMeter = {};
const nodeMeterType = {};

DEFAULT_NODE_TYPES.forEach(function(nodeType){
  nodeMeterType[nodeType] = {};
});

let tweetRxQueueInterval;
const tweetParserQueue = [];
const tweetParserMessageRxQueue = [];
const tweetRxQueue = [];

const keySortQueue = [];

const twitterSearchNodeQueue = [];
let twitterSearchNodeQueueInterval;
let twitterSearchNodeQueueReady = false;

let dbuPingInterval;
let dbuPingSent = false;
let dbuPongReceived = false;
let dbuPingId = false;

let tssPingInterval;

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

const categorizedManualUserSet = new Set();
const categorizedAutoUserSet = new Set();
const uncategorizedManualUserSet = new Set();
const uncategorizedAutoUserSet = new Set();
let uncategorizedManualUserArray = [];

const matchUserSet = new Set();
const mismatchUserSet = new Set();

// ==================================================================
// DROPBOX
// ==================================================================
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

const dropboxConfigTwitterFolder = "/config/twitter";
const dropboxConfigDefaultFolder = "/config/utility/default";
const dropboxConfigHostFolder = "/config/utility/" + hostname;

const dropboxConfigDefaultFile = "default_" + configuration.DROPBOX.DROPBOX_WAS_CONFIG_FILE;
const dropboxConfigHostFile = hostname + "_" + configuration.DROPBOX.DROPBOX_WAS_CONFIG_FILE;
const childPidFolderLocal = (hostname === "google") 
  ? "/home/tc/Dropbox/Apps/wordAssociation/config/utility/google/children" 
  : "/Users/tc/Dropbox/Apps/wordAssociation/config/utility/" + hostname + "/children";
const dropboxConfigDefaultTrainingSetsFolder = dropboxConfigDefaultFolder + "/trainingSets";
const trainingSetsUsersFolder = dropboxConfigDefaultTrainingSetsFolder + "/users";

// need local version for "touch"
const trainingSetsUsersFolderLocal = (hostname === "google") 
  ? "/home/tc/Dropbox/Apps/wordAssociation/config/utility/default/trainingSets/users" 
  : "/Users/tc/Dropbox/Apps/wordAssociation/config/utility/default/trainingSets/users";
const usersZipUpdateFlagFile = trainingSetsUsersFolderLocal + "/usersZipUpdateFlag.txt";
const statsFolder = "/stats/" + hostname;
const statsFile = "wordAssoServerStats_" + moment().format(tinyDateTimeFormat) + ".json";
const testDataFolder = dropboxConfigDefaultFolder + "/test/testData/tweets";

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

        const itemArray = [];

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

          if (err) {
            console.log(chalkError("WAS | *** ERROR filesListFolderLocal"));
            return reject(err);
          }

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

const dropboxRemoteClient = new Dropbox({ 
  accessToken: configuration.DROPBOX.DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  fetch: fetch
});

const dropboxLocalClient = { // offline mode
  filesListFolder: filesListFolderLocal,
  filesUpload: function(){ console.log(chalkInfo("WAS | filesUpload")); },
  filesDownload: function(){ console.log(chalkInfo("WAS | filesDownload")); },
  filesGetMetadata: filesGetMetadataLocal,
  filesDelete: function(){ console.log(chalkInfo("WAS | filesDelete")); }
};

let dropboxClient = dropboxRemoteClient;

const networkDefaults = function (netObj){

  let networkObj = {};
  networkObj = netObj;

  if (networkObj.betterChild === undefined) { networkObj.betterChild = false; }
  if (networkObj.testCycles === undefined) { networkObj.testCycles = 0; }
  if (networkObj.testCycleHistory === undefined) { networkObj.testCycleHistory = []; }
  if (networkObj.overallMatchRate === undefined) { networkObj.overallMatchRate = 0; }
  if (networkObj.matchRate === undefined) { networkObj.matchRate = 0; }
  if (networkObj.successRate === undefined) { networkObj.successRate = 0; }

  return networkObj;
};

function printNetworkObj(title, netObj) {

  let networkObj = {};
  networkObj = netObj;
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

function printUserObj(title, u, chalkFormat) {

  const chlk = chalkFormat || chalkUser;

  const user = userDefaults(u);

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

function printHashtag(params) {
  let text;
  const hashtag = params.hashtag;

  if (params.verbose) {
    return jsonPrint(params.hashtag);
  } 
  else {
    text = "#" + hashtag.hashtagId
    + " | M  " + hashtag.mentions
    + " | LS " + getTimeStamp(hashtag.lastSeen)
    + " | C M " + hashtag.category + " A " + hashtag.categoryAuto;
    return text;
  }
}

function printUser(params) {
  let text;
  const user = params.user;

  if (params.verbose) {
    return jsonPrint(params.user);
  } 
  else {
    text = user.userId
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
    + " | C M " + user.category + " A " + user.categoryAuto;
    return text;
  }
}

function connectDb(){

  return new Promise(function(resolve, reject){

    try {

      statsObj.status = "CONNECTING MONGO DB";

      global.globalWordAssoDb.connect("WAS_" + process.pid, function(err, db){

        if (err) {
          console.log(chalkError("WAS | *** MONGO DB CONNECTION ERROR: " + err));
          statsObj.status = "MONGO CONNECTION ERROR";
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        console.log(chalk.green("WAS | MONGO DB DEFAULT CONNECTION OPEN"));

        db.on("close", function(){
          statsObj.status = "MONGO CLOSED";
          console.error.bind(console, "WAS | *** MONGO DB CONNECTION CLOSED ***\n");
          console.log(chalkAlert("WAS | *** MONGO DB CONNECTION CLOSED ***\n"));
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("error", function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "WAS | *** MONGO DB CONNECTION ERROR ***\n");
          console.log(chalkError("WAS | *** MONGO DB CONNECTION ERROR ***\n"));
          db.close();
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "WAS | *** MONGO DB DISCONNECTED ***\n");
          console.log(chalkAlert("WAS | *** MONGO DB DISCONNECTED ***\n"));
          statsObj.dbConnectionReady = false;
          quit(statsObj.status);
        });

        global.globalDbConnection = db;

        global.globalEmoji = global.globalDbConnection.model("Emoji", emojiModel.EmojiSchema);
        global.globalHashtag = global.globalDbConnection.model("Hashtag", hashtagModel.HashtagSchema);
        global.globalLocation = global.globalDbConnection.model("Location", locationModel.LocationSchema);
        global.globalMedia = global.globalDbConnection.model("Media", mediaModel.MediaSchema);
        global.globalNeuralNetwork = global.globalDbConnection.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
        global.globalPlace = global.globalDbConnection.model("Place", placeModel.PlaceSchema);
        global.globalTweet = global.globalDbConnection.model("Tweet", tweetModel.TweetSchema);
        global.globalUrl = global.globalDbConnection.model("Url", urlModel.UrlSchema);
        global.globalUser = global.globalDbConnection.model("User", userModel.UserSchema);
        global.globalWord = global.globalDbConnection.model("Word", wordModel.WordSchema);


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
            printNetworkObj("WAS | --> NN   CHANGE | " + change.operationType, nn);
          }
          else {
            console.log(chalkLog("WAS | --> NN   CHANGE | " + change.operationType));
          }
        });

        const sessionId = btoa("threecee");
        console.log(chalk.green("WAS | PASSPORT SESSION ID: " + sessionId ));

        app.use(expressSession({
          sessionId: sessionId,
          secret: "three cee labs 47", 
          resave: false, 
          saveUninitialized: false,
          store: new MongoStore({ mongooseConnection: global.globalDbConnection })
        }));

        app.use(passport.initialize());

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

            const rawUser = profile._json;

            if (!userServerControllerReady || !statsObj.dbConnectionReady) {
              return cb(new Error("userServerController not ready"), null);
            }

            userServerController.convertRawUser({user: rawUser}, function(err, user){

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
                  + "\nWAS | " + printUser({user: updatedUser})
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
              successReturnToOrRedirect: "/after-auth.html",
              failureRedirect: "/login" 
            }
          )
        );

        app.get("/login_auth",
          passport.authenticate("local", { 
            successReturnToOrRedirect: "/after-auth.html",
            failureRedirect: "/login"
          })
        );

        passport.serializeUser(function(user, done) { 

          const sessionUser = { 
            "_id": user._id, 
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
        statsObj.user.manual = {};
        statsObj.user.manual.right = 0;
        statsObj.user.manual.left = 0;
        statsObj.user.manual.neutral = 0;
        statsObj.user.manual.positive = 0;
        statsObj.user.manual.negative = 0;
        statsObj.user.manual.none = 0;
        statsObj.user.auto = {};
        statsObj.user.auto.right = 0;
        statsObj.user.auto.left = 0;
        statsObj.user.auto.neutral = 0;
        statsObj.user.auto.positive = 0;
        statsObj.user.auto.negative = 0;
        statsObj.user.auto.none = 0;
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

        statsObj.user.uncategorized = {};
        statsObj.user.uncategorized.all = 0;
        statsObj.user.uncategorized.left = 0;
        statsObj.user.uncategorized.right = 0;
        statsObj.user.uncategorized.neutral = 0;


        HashtagServerController = require("@threeceelabs/hashtag-server-controller");
        hashtagServerController = new HashtagServerController("WAS_HSC");

        hashtagServerController.on("error", function(err){
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

          userServerControllerReady = true;
          console.log(chalk.green("WAS | USC READY | " + appname));

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

statsObj.dbConnectBusy = false;

const dbConnectInterval = setInterval(function(){

  if (!statsObj.dbConnectionReady && !statsObj.dbConnectBusy) {

    statsObj.dbConnectBusy = true;

    connectDb().
    then(function(){
      statsObj.dbConnectBusy = false;
      statsObj.dbConnectionReady = true;
      console.log(chalk.green("WAS | +++ MONGO DB CONNECTED"));
    }).
    catch(function(err){
      console.log(chalkError("WAS | *** CONNECT DB INTERVAL ERROR: " + err));
      statsObj.dbConnectionReady = false;
      statsObj.dbConnectBusy = false;
    });
  }

}, 10*ONE_SECOND);

function jsonPrint(obj) {
  if (obj) {
    return treeify.asTree(obj, true, true);
  } 
  else {
    return obj;
  }
}

function msToTime(d) {

  let duration = d;
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
if (tweetIdCacheTtl === undefined) { tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL; }

console.log("WAS | TWEET ID CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (tweetIdCacheCheckPeriod === undefined) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD; }

console.log("WAS | TWEET ID CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod
});

// ==================================================================
// VIEWER CACHE
// ==================================================================
let viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
if (viewerCacheTtl === undefined) { viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL; }

console.log("WAS | VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

let viewerCacheCheckPeriod = process.env.VIEWER_CACHE_CHECK_PERIOD;
if (viewerCacheCheckPeriod === undefined) { viewerCacheCheckPeriod = VIEWER_CACHE_CHECK_PERIOD; }

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
if (serverCacheTtl === undefined) { serverCacheTtl = SERVER_CACHE_DEFAULT_TTL; }
console.log("WAS | SERVER CACHE TTL: " + serverCacheTtl + " SECONDS");

let serverCacheCheckPeriod = process.env.SERVER_CACHE_CHECK_PERIOD;
if (serverCacheCheckPeriod === undefined) { serverCacheCheckPeriod = SERVER_CACHE_CHECK_PERIOD; }
console.log("WAS | SERVER CACHE CHECK PERIOD: " + serverCacheCheckPeriod + " SECONDS");

const serverCache = new NodeCache({
  stdTTL: serverCacheTtl,
  checkperiod: serverCacheCheckPeriod
});

function serverCacheExpired(serverCacheId, serverObj) {

  // const ttl = serverCache.getTtl(serverCacheId);

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
if (authenticatedSocketCacheTtl === undefined) { 
  authenticatedSocketCacheTtl = AUTH_SOCKET_CACHE_DEFAULT_TTL;
}
console.log("WAS | AUTHENTICATED SOCKET CACHE TTL: " + authenticatedSocketCacheTtl + " SECONDS");

let authenticatedSocketCacheCheckPeriod = process.env.AUTH_SOCKET_CACHE_CHECK_PERIOD;
if (authenticatedSocketCacheCheckPeriod === undefined) {
  authenticatedSocketCacheCheckPeriod = AUTH_SOCKET_CACHE_CHECK_PERIOD;
}
console.log("WAS | AUTHENTICATED SOCKET CACHE CHECK PERIOD: " + authenticatedSocketCacheCheckPeriod + " SECONDS");

const authenticatedSocketCache = new NodeCache({
  stdTTL: authenticatedSocketCacheTtl,
  checkperiod: authenticatedSocketCacheCheckPeriod
});

function authenticatedSocketCacheExpired(socketId, authSocketObj) {

  // const ttl = authenticatedSocketCache.getTtl(socketId);

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
if (authenticatedTwitterUserCacheTtl === undefined) { 
  authenticatedTwitterUserCacheTtl = AUTH_USER_CACHE_DEFAULT_TTL;
}
console.log("WAS | AUTHENTICATED TWITTER USER CACHE TTL: " + authenticatedTwitterUserCacheTtl + " SECONDS");

let authenticatedTwitterUserCacheCheckPeriod = process.env.AUTH_USER_CACHE_CHECK_PERIOD;
if (authenticatedTwitterUserCacheCheckPeriod === undefined) {
  authenticatedTwitterUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;
}
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
if (authInProgressTwitterUserCacheTtl === undefined) { 
  authInProgressTwitterUserCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;
}
console.log("WAS | AUTH IN PROGRESS CACHE TTL: " + authInProgressTwitterUserCacheTtl + " SECONDS");

let authInProgressTwitterUserCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (authInProgressTwitterUserCacheCheckPeriod === undefined) { 
  authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
}
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
if (nodeCacheTtl === undefined) { nodeCacheTtl = NODE_CACHE_DEFAULT_TTL; }
console.log("WAS | NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

let nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
if (nodeCacheCheckPeriod === undefined) { nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD; }
console.log("WAS | NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS");


const nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: nodeCacheCheckPeriod
});

const nodeCacheDeleteQueue = [];

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

const nodeCacheInterval = setInterval(function(){

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
if (trendingCacheTtl === undefined) { trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL; }
console.log("WAS | TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

const trendingCache = new NodeCache({
  stdTTL: trendingCacheTtl,
  checkperiod: TRENDING_CACHE_CHECK_PERIOD
});

let nodesPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (nodesPerMinuteTopTermTtl === undefined) { nodesPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL; }
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

const nodesPerMinuteTopTermNodeTypeCache = {};

DEFAULT_NODE_TYPES.forEach(function(nodeType){
  nodesPerMinuteTopTermNodeTypeCache[nodeType] = new NodeCache({
    stdTTL: nodesPerMinuteTopTermTtl,
    checkperiod: TOPTERMS_CACHE_CHECK_PERIOD
  });
});


const cacheObj = {};
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
const saveFileQueue = [];

let internetCheckInterval;

const http = require("http");

const httpServer = http.createServer(app);

const ioConfig = {
  pingInterval: DEFAULT_IO_PING_INTERVAL,
  pingTimeout: DEFAULT_IO_PING_TIMEOUT,
  reconnection: true
};

const io = require("socket.io")(httpServer, ioConfig);
const net = require("net");

const cp = require("child_process");
const sorterMessageRxQueue = [];

const ignoreWordHashMap = new HashMap();
const localHostHashMap = new HashMap();

const statsBestNetworkPickArray = [
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

  statsObj.ioReady = false;
  statsObj.internetReady = false;
  statsObj.internetTestError = false;

  statsObj.dbConnectionReady = false;

  statsObj.tweetParserReady = false;
  statsObj.tweetParserSendReady = false;
  statsObj.previousBestNetworkId = "";

  statsObj.user.manual = {};
  statsObj.user.manual.right = 0;
  statsObj.user.manual.left = 0;
  statsObj.user.manual.neutral = 0;
  statsObj.user.manual.positive = 0;
  statsObj.user.manual.negative = 0;
  statsObj.user.manual.none = 0;

  statsObj.user.auto = {};
  statsObj.user.auto.right = 0;
  statsObj.user.auto.left = 0;
  statsObj.user.auto.neutral = 0;
  statsObj.user.auto.positive = 0;
  statsObj.user.auto.negative = 0;
  statsObj.user.auto.none = 0;

  statsObj.user.total = 0;
  statsObj.user.following = 0;
  statsObj.user.notFollowing = 0;
  statsObj.user.categorizedTotal = 0;
  statsObj.user.categorizedManual = 0;
  statsObj.user.categorizedAuto = 0;

  statsObj.user.uncategorized = {};
  statsObj.user.uncategorized.all = 0;
  statsObj.user.uncategorized.left = 0;
  statsObj.user.uncategorized.right = 0;
  statsObj.user.uncategorized.neutral = 0;

  statsObj.user.uncategorizedTotal = 0;
  statsObj.user.uncategorizedManual = 0;
  statsObj.user.uncategorizedAuto = 0;
  statsObj.user.matched = 0;
  statsObj.user.mismatched = 0;
  statsObj.user.uncategorizedManualUserArray = 0;

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

  statsObj.errors = {};
  statsObj.errors.google = {};
  statsObj.errors.twitter = {};
  statsObj.errors.twitter.parser = 0;
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

  statsObj.queues = {};
  statsObj.queues.metricsDataPointQueue = 0;
  statsObj.queues.sorterMessageRxQueue = 0;
  statsObj.queues.transmitNodeQueue = 0;
  statsObj.queues.tweetParserMessageRxQueue = 0;
  statsObj.queues.tweetParserQueue = 0;
  statsObj.queues.tweetRxQueue = 0;

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
  dropboxClient.filesListFolderLongpoll({cursor: last_cursor, timeout: 30}).
    then(function(results){
      callback(null, results);
    }).
    catch(function(err){
      console.log(err);
      callback(err, null);
    });
}

function dropboxFolderGetLastestCursor(folder, callback) {

  // let lastCursorTruncated = "";

  const optionsGetLatestCursor = {
    path: folder,
    recursive: true,
    include_media_info: false,
    include_deleted: true,
    include_has_explicit_shared_members: false
  };

  if (configuration.verbose) { 
    console.log(chalkLog("WAS | dropboxFolderGetLastestCursor FOLDER: " + folder)); 
  }

  dropboxClient.filesListFolderGetLatestCursor(optionsGetLatestCursor).
  then(function(last_cursor) {

    // lastCursorTruncated = last_cursor.cursor.substring(0,20);

    if (configuration.verbose) { 
      console.log(chalkLog("WAS | DROPBOX LAST CURSOR\n" + jsonPrint(last_cursor))); 
    }

    dropboxLongPoll(last_cursor.cursor, function(err, results){

      if (configuration.verbose) { 
        console.log(chalkLog("WAS | DROPBOX LONG POLL RESULTS\n" + jsonPrint(results))); 
      }

      if ((results !== undefined) && results && results.changes) {

        dropboxClient.filesListFolderContinue({ cursor: last_cursor.cursor}).
        then(function(response){

          if (configuration.verbose) { 
            console.log(chalkLog("WAS | DROPBOX FILE LIST FOLDER CONTINUE"
              + "\n" + jsonPrint(response)
            ));
          }

          callback(null, response);

        }).
        catch(function(err){

          if (err.status === 429){
            console.log(chalkError("WAS | *** dropboxFolderGetLastestCursor filesListFolder"
              + " | *** DROPBOX FILES LIST FOLDER ERROR"
              + " | TOO MANY REQUESTS" 
              + " | FOLDER: " + folder 
            ));
          }
          else {
            console.log(chalkError("WAS | *** dropboxFolderGetLastestCursor filesListFolder"
              + " *** DROPBOX FILES LIST FOLDER ERROR"
              + "\nERROR:", err 
              // + "\nERROR: " + jsonPrint(err)
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
  }).
  catch(function(err){
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

function loadCommandLineArgs(){

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

    dropboxClient.filesGetMetadata({path: fullPath}).
    then(function(response) {
      debug(chalkInfo("FILE META\n" + jsonPrint(response)));
      resolve(response);
    }).
    catch(function(err) {
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

function loadFile(params) {

  return new Promise(function(resolve, reject){

    let fullPath = params.folder + "/" + params.file;
    const noErrorNotFoundFlag = params.noErrorNotFoundFlag || false;

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

          const fileObj = jsonParse(data);

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

      dropboxClient.filesDownload({path: fullPath}).
      then(function(data) {

        debug(chalkLog(getTimeStamp()
          + " | LOADING FILE FROM DROPBOX FILE: " + fullPath
        ));

        if (params.file.match(/\.json$/gi)) {

          const payload = data.fileBinary;

          if (!payload || (payload === undefined)) {
            return reject(new Error("WAS LOAD FILE PAYLOAD UNDEFINED"));
          }

          let fileObj;

          try {
            fileObj = jsonParse(payload);

            if (fileObj.value) {
              return resolve(fileObj.value);
            }
            return null;
          }
          catch(err){
            console.log(chalkError("WAS | DROPBOX loadFile ERROR: " + fullPath));
            return reject(fileObj.error);
          }

        }
        
        if (params.file.match(/\.txt$/gi)) {

          const payload = data.fileBinary;

          if (!payload || (payload === undefined)) {
            return reject(new Error("WAS LOAD FILE PAYLOAD UNDEFINED"));
          }

          return resolve(payload);
        }

        resolve();
      }).
      catch(function(error) {

        console.log(chalkError("WAS | DROPBOX loadFile ERROR: " + fullPath));
        
        if ((error.status === 409) || (error.status === 404)) {

          if (noErrorNotFoundFlag) {
            console.log(chalkError("WAS | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND ... SKIPPING (NO ERROR NOT FOUND) ..."));
            return resolve(null);
          }
          console.log(chalkError("WAS | !!! DROPBOX READ FILE " + fullPath + " NOT FOUND"));
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

function loadMaxInputHashMap(p){

  return new Promise(function(resolve, reject) {

    const params = p || {};
    params.folder = params.folder || dropboxConfigDefaultTrainingSetsFolder;
    params.file = params.file || maxInputHashMapFile;

    loadFile(params).
    then(function(dataObj){
      if (dataObj.maxInputHashMap === undefined) {
        console.log(chalkError("WAS | *** ERROR: loadMaxInputHashMap: loadFile: maxInputHashMap UNDEFINED"));
      }
      if (dataObj.normalization === undefined) {
        console.log(chalkError("WAS | *** ERROR: loadMaxInputHashMap: loadFile: normalization UNDEFINED"));
      }

      maxInputHashMap = dataObj.maxInputHashMap || {};
      normalization = dataObj.normalization || {};

      resolve();
    }).
    catch(function(err){
      if (err.code === "ENOTFOUND") {
        console.log(chalkError("WAS | *** LOAD MAX INPUT: FILE NOT FOUND"
          + " | " + params.folder + "/" + params.file
        ));
      }

      return reject(err);
    });

  });
}

function saveFile (params, callback){

  const fullPath = params.folder + "/" + params.file;

  debug(chalkInfo("LOAD FOLDER " + params.folder));
  debug(chalkInfo("LOAD FILE " + params.file));
  debug(chalkInfo("FULL PATH " + fullPath));

  const options = {};

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

    writeJsonFile(fullPath, params.obj).
    then(function() {

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

        const localReadStream = fs.createReadStream(fullPath);
        const remoteWriteStream = drbx.file(options.destination).createWriteStream();


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

    }).
    catch(function(error){
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

      dropboxClient.filesUpload(options).
      then(function(){
        debug(chalkLog("SAVED DROPBOX JSON | " + options.path));
        if (callback !== undefined) { return callback(null); }
      }).
      catch(function(error){
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
            + " | ERROR STATUS " + error.status
          ));
          if (callback !== undefined) { return callback(error); }
        }
      });
    };

    if (options.mode === "add") {

      dropboxClient.filesListFolder({path: params.folder, limit: configuration.dropboxListFolderLimit}).
      then(function(response){

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
      }).
      catch(function(err){
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

  return new Promise(function(resolve){

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

    resolve();

  });
}

function saveStats(statsFile, statsObj, callback) {

  const fullPath = statsFolder + "/" + statsFile;

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

  const options = {};

  options.contents = JSON.stringify(statsObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options).
    then(function dropboxFilesUpload(){
      debug(chalkLog(getTimeStamp()
        + " | SAVED DROPBOX JSON | " + options.path
      ));
      callback("OK");
    }).
    catch(function dropboxFilesUploadError(err){
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

  });
}

function getChildProcesses(){

  return new Promise(function(resolve, reject){

    const childPidArray = [];

    shell.mkdir("-p", childPidFolderLocal);

    debug("SHELL: cd " + childPidFolderLocal);
    shell.cd(childPidFolderLocal);

    const childPidFileNameArray = shell.ls(DEFAULT_CHILD_ID_PREFIX + "*");

    if (!childPidFileNameArray || childPidFileNameArray.length === 0) {
      return resolve(childPidArray);
    }

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

  });
}

function killAll(){

  return new Promise(function(resolve, reject){

    // let childPidArray = await getChildProcesses({searchTerm: "ALL"});
    getChildProcesses({searchTerm: "ALL"}).
    then(function(childPidArray){
      console.log(chalk.green("getChildProcesses childPidArray\n" + jsonPrint(childPidArray)));
      if (childPidArray && (childPidArray.length > 0)) {

        async.eachSeries(childPidArray, function(childObj, cb){

          killChild({pid: childObj.pid}).
          then(function(){
            console.log(chalkAlert("WAS | KILL ALL | KILLED | PID: " + childObj.pid + " | CH ID: " + childObj.childId));
            cb();
          }).
          catch(function(err){
            console.log(chalkError("WAS | *** KILL CHILD ERROR"
              + " | PID: " + childObj.pid
              + " | ERROR: " + err
            ));
            return cb(err);
          });

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
    }).
    catch(function(err){
      console.log(chalkError("WAS | *** killAll ERROR: " + err));
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

  killAll().
  then(function(){
    console.log(chalkAlert("\nWAS | *** MAIN PROCESS EXIT *** \n"));
  }).
  catch(function(err){
    console.log(chalkError("WAS | *** MAIN PROCESS EXIT ERROR: " + err));
  });
});

process.on("message", function processMessageRx(msg) {

  if ((msg === "SIGINT") || (msg === "shutdown")) {

    console.log(chalkAlert("\nWAS | =============================\nWAS"
      + " | *** SHUTDOWN OR SIGINT ***\nWAS | =============================\n"
    ));

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

  switch(childObj.childId){

    case DEFAULT_DBU_CHILD_ID:

      console.log(chalkError("WAS | *** KILL DBU CHILD"));

      killChild({childId: DEFAULT_DBU_CHILD_ID}, function(err){
        if (err){
          console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
        }
        else {
          initDbuChild({childId: DEFAULT_DBU_CHILD_ID});
        }
      });

    break;

    case DEFAULT_TFE_CHILD_ID:

      console.log(chalkError("WAS | *** KILL TFE CHILD"));

      killChild({childId: DEFAULT_TFE_CHILD_ID}, function(err){
        if (err){
          console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
        }
        else {
          initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
        }
      });

    break;

    case DEFAULT_TWP_CHILD_ID:

      console.log(chalkError("WAS | *** KILL TWEET PARSER"));

      killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err){
        if (err){
          console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
        }
        else {
          initTweetParser({childId: DEFAULT_TWP_CHILD_ID});
        }
      });

    break;

    default:
      console.log(chalkError("WAS | *** CHILD ERROR -- UNKNOWN CHILD ID: " + childObj.childId));

  }

  if (childObj.childId.startsWith(DEFAULT_TSS_CHILD_ID)){
      console.log(chalkError("WAS | *** KILL TSS CHILD | " + childObj.childId));

      killChild({childId: childObj.childId}, function(err){
        if (err){
          console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
        }
        else {
          initTssChild({childId: childObj.childId, threeceeUser: childrenHashMap[childObj.childId].threeceeUser});
        }
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
      
    // memoryAvailableMB = (statsObj.memory.memoryAvailable/(1024*1024));
    // memoryTotalMB = (statsObj.memory.memoryTotal/(1024*1024));
    // memoryAvailablePercent = (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal);

    const heartbeatObj = {};

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
      // statsObj.memory.memoryTotal = os.totalmem();
      // statsObj.memory.memoryAvailable = os.freemem();
      // statsObj.memory.memoryUsage = process.memoryUsage();

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

        // heartbeatObj.memory = statsObj.memory;

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

configEvents.on("INIT_SETS_COMPLETE", function configEventDbConnect(){
  statsObj.initSetsComplete = true;
});

configEvents.on("DB_CONNECT", function configEventDbConnect(){

  statsObj.status = "DB_CONNECT";

  async.parallel({

    socketInit: function(cb){

      initSocketNamespaces().
      then(function(){
        cb();
      }).
      catch(function(err){
        return cb(err);
      });
    },
    
    unfollowableInit: function(cb){

      initUnfollowableUserSet().
      then(function(){
        cb();
      }).
      catch(function(err){
        return cb(err);
      });
    },
    
    ignoredUserInit: function(cb){

      initIgnoredUserSet().
      then(function(){
        cb();
      }).
      catch(function(err){
        return cb(err);
      });
    },
    
    ignoredHashtagInit: function(cb){

      initIgnoredHashtagSet().
      then(function(){
        cb();
      }).
      catch(function(err){
        return cb(err);
      });
    },
    
    followSearchInit: function(cb){

      initFollowableSearchTermSet().
      then(function(){
        cb();
      }).
      catch(function(err){
        return cb(err);
      });
    },

    categoryHashmapsInit: function(cb){

      initCategoryHashmaps().
      then(function(){
        cb();
      }).
      catch(function(err){
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
      if (configuration.verbose){
        console.log(chalk.green("WAS | +++ MONGO DB CONNECTION RESULTS\n" + jsonPrint(results)));
      }
      configEvents.emit("INIT_SETS_COMPLETE");
    }
  });
});

configEvents.on("NEW_BEST_NETWORK", function configEventDbConnect(){

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

    childrenHashMap[DEFAULT_TFE_CHILD_ID].child.send(
      { op: "MAX_INPUT_HASHMAP", maxInputHashMap: maxInputHashMap }, 
      function tfeMaxInputHashMap(err){
      if (err) {
        console.log(chalkError("WAS | *** TFE CHILD SEND MAX_INPUT_HASHMAP ERROR"
          + " | " + err
        ));
      }
    });

  }

  if (childrenHashMap[DEFAULT_TWP_CHILD_ID] !== undefined) {

    console.log(chalkBlue("WAS | UPDATE TWP CHILD MAX INPUT HASHMAP: " + Object.keys(maxInputHashMap)));

    childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send(
      { op: "MAX_INPUT_HASHMAP", maxInputHashMap: maxInputHashMap }, 
      function twpMaxInputHashMap(err){
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

function updateTwitterWebhook(){

  return new Promise(async function(resolve, reject){

    statsObj.status = "UPDATE TWITTER WEBHOOK";

    const fullWebhookUrl = encodeURI("https://word.threeceelabs.com" + TWITTER_WEBHOOK_URL);

    const options = {
      url: "https://api.twitter.com/1.1/account_activity/all/dev/webhooks.json",
      method: "POST",
      resolveWithFullResponse: true,
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },      
      form: { url: fullWebhookUrl },
      oauth: {
        consumer_key: threeceeConfig.consumer_key,
        consumer_secret: threeceeConfig.consumer_secret,
        token: threeceeConfig.token,
        token_secret: threeceeConfig.token_secret
      } 
    };

    console.log(chalkLog("WAS | UPDATE TWITTER WEBHOOK"
      + " | fullWebhookUrl: " + fullWebhookUrl
    ));
    console.log(chalkLog("REQ OPTIONS\n" + jsonPrint(options)));

    try{
      const body = await request(options);

      console.log(chalkAlert("WAS | +++ TWITTER WEBHOOK UPDATED"
        + "\nBODY: " + body
      ));

      await addAccountActivitySubscription();
      resolve();
    }
    catch(err){
      console.log(chalkError("WAS | *** TWITTER WEBHOOK ERROR"
        + " | STATUS: " + err.statusCode
      ));
      console.log(err.error);
      reject(err);
    }

  });
}

function getTwitterWebhooks(){

  return new Promise(async function(resolve, reject){

    statsObj.status = "GET ACCOUNT ACTIVITY SUBSCRIPTION";

    const fullWebhookUrl = encodeURI("https://word.threeceelabs.com" + TWITTER_WEBHOOK_URL);

    const options = {
      url: "https://api.twitter.com/1.1/account_activity/all/dev/webhooks.json",
      method: "GET",
      headers: {
        "authorization": "Bearer " + configuration.twitterBearerToken
      }    
    };

    console.log(chalkLog("WAS | GET TWITTER ACCOUNT ACTIVITY SUBSCRIPTION"
      + " | fullWebhookUrl: " + fullWebhookUrl
    ));

    try {

      statsObj.twitterSubs = {};

      const body = await request(options);

      const bodyJson = JSON.parse(body);

      console.log(chalkLog("WAS | +++ GET TWITTER WEBHOOKS"
        // + "\nBODY\n" + jsonPrint(bodyJson)
      ));

      if (bodyJson.length > 0){

        bodyJson.forEach(async function(sub){

          statsObj.twitterSubs[sub.id.toString()] = {};
          statsObj.twitterSubs[sub.id.toString()] = sub;

          console.log(chalkLog("WAS | TWITTER WEBHOOK"
            + " | ID: " + sub.id
            + " | URL: " + sub.url
            + " | VALID: " + sub.valid
            + " | CREATED: " + sub.created_timestamp
          ));

          if (!sub.valid) {

            console.log(chalkAlert("WAS | TWITTER WEBHOOK INVALID ... UPDATING ..."
              + " | ID: " + sub.id
              + " | URL: " + sub.url
              + " | VALID: " + sub.valid
              + " | CREATED: " + sub.created_timestamp
            ));

            try{
              await updateTwitterWebhook();
            }
            catch(err){
              console.log(chalkError("WAS | *** UPDATE TWITTER WEBHOOK ERROR"));
              return reject(err);
            }
          }

          const url = "https://api.twitter.com/1.1/account_activity/all/dev/subscriptions/list.json";

          const optionsSub = {
            url: url,
            method: "GET",
            headers: {
              "authorization": "Bearer " + configuration.twitterBearerToken
            }    
          };

          try {

            const bodySub = await request(optionsSub);

            const bodySubJson = JSON.parse(bodySub);

            console.log(chalkAlert("WAS | TWITTER ACCOUNT ACTIVITY SUBSCRIPTIONS"
              + "\nBODY\n" + jsonPrint(bodySubJson)
            ));

          }
          catch(errSub){
            console.log(chalkError("WAS | *** GET TWITTER ACCOUNT ACTIVITY SUB ERROR: " + errSub));
            return reject(errSub);
          }
        });

        resolve();
      }
      else {
        console.log(chalkAlert("WAS | ??? NO TWITTER WEBHOOKS"
        ));
        resolve();
      }
    }
    catch(err){
      console.log(chalkError("WAS | *** GET TWITTER WEBHOOKS ERROR: " + err));
      return reject(err);
    }

  });
}

function addAccountActivitySubscription(p){

  return new Promise(async function(resolve, reject){

    const params = p || {};

    params.threeceeUser = params.threeceeUser || "altthreecee00";

    if (!threeceeTwitter[params.threeceeUser] || !threeceeTwitter[params.threeceeUser].twitterConfig) {
      console.log(chalkError("WAS | *** ADD ACCOUNT ACTIVITY SUBSCRIPTION ERROR | UNDEFINED TWITTER CONFIG | " + params.threeceeUser));
      return reject(new Error("threeceeUser twitter configuration undefined"));
    }

    statsObj.status = "ADD TWITTER ACCOUNT ACTIVITY SUBSCRIPTION";

    const options = {
      url: "https://api.twitter.com/1.1/account_activity/all/dev/subscriptions.json",
      method: "POST",
      resolveWithFullResponse: true,
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },      
      oauth: {
        consumer_key: threeceeTwitter[params.threeceeUser].twitterConfig.consumer_key,
        consumer_secret: threeceeTwitter[params.threeceeUser].twitterConfig.consumer_secret,
        token: threeceeTwitter[params.threeceeUser].twitterConfig.token,
        token_secret: threeceeTwitter[params.threeceeUser].twitterConfig.token_secret
      } 
    };

    console.log(chalkAlert("WAS | ADD TWITTER ACCOUNT ACTIVITY SUBSCRIPTION"));
    console.log(chalkLog("REQ OPTIONS\n" + jsonPrint(options)));

    try {

      const body = await request(options);

      console.log(chalk.green("WAS | +++ ADDED TWITTER ACCOUNT ACTIVITY SUBSCRIPTION"));
      console.log(body);

      resolve();

    }
    catch(err){

      console.log(chalkError("WAS | *** ADD TWITTER ACCOUNT ACTIVITY SUBSCRIPTION ERROR"
      ));

      reject(err);
    }

  });
}

function categorizeNode(categorizeObj, callback) {

  if (categorizeObj.twitterUser && categorizeObj.twitterUser.nodeId) {

    const user = authenticatedTwitterUserCache.get(categorizeObj.twitterUser.nodeId);

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

  const cObj = {};
  cObj.manual = false;
  cObj.auto = false;

  let nCacheObj;

  switch (categorizeObj.node.nodeType){
    case "user":

      debug(chalkSocket("categorizeNode USER"
        + " | NID: " + categorizeObj.node.nodeId
        + " | @" + categorizeObj.node.screenName
        + " | C: " + categorizeObj.category
        + " | FLW: " + categorizeObj.follow
      ));

      cObj.manual = categorizeObj.category;

      if (categorizedUserHashMap.has(categorizeObj.node.nodeId)){
        cObj.auto = categorizedUserHashMap.get(categorizeObj.node.nodeId.toLowerCase()).auto || false;
      }

      categorizedHashtagHashMap.set(categorizeObj.node.nodeId.toLowerCase(), cObj);

      nCacheObj = nodeCache.get(categorizeObj.node.nodeId.toLowerCase());

      if (nCacheObj) {
        categorizeObj.node.mentions = Math.max(categorizeObj.node.mentions, nCacheObj.mentions);
        nCacheObj.mentions = categorizeObj.node.mentions;
        nodeCache.set(nCacheObj.nodeId, nCacheObj);
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

          if (categorizeObj.follow) {
            follow({user: updatedUser, forceFollow: true}, function(err, updatedFollowUser){
              if (err) {
                console.log(chalkError("WAS | TWITTER FOLLOW ERROR: " + err));
                return;
              }

              if (!updatedFollowUser) {
                console.log(chalkError("WAS | TWITTER FOLLOW ERROR: NULL UPDATED USER"));
                return;
              }

              categorizedUserHashMap.set(updatedFollowUser.nodeId, {manual: updatedFollowUser.category, auto: updatedFollowUser.categoryAuto});

              if (updatedFollowUser.category) { uncategorizedManualUserSet.delete(updatedFollowUser.nodeId); }
              if (updatedFollowUser.categoryAuto) { uncategorizedAutoUserSet.delete(updatedFollowUser.nodeId); }


              console.log(chalk.blue("WAS | +++ TWITTER_FOLLOW"
                + " | UID" + updatedFollowUser.nodeId
                + " | @" + updatedFollowUser.screenName
              ));

              debug(chalkLog("UPDATE_CATEGORY USER | @" + updatedFollowUser.screenName ));
              if (callback !== undefined) {
                callback(null, updatedFollowUser);
              }

            });
          }
          else {

            categorizedUserHashMap.set(updatedUser.nodeId, {manual: updatedUser.category, auto: updatedUser.categoryAuto});

            if (updatedUser.category) { uncategorizedManualUserSet.delete(updatedUser.nodeId); }
            if (updatedUser.categoryAuto) { uncategorizedAutoUserSet.delete(updatedUser.nodeId); }

            debug(chalkLog("UPDATE_CATEGORY USER | @" + updatedUser.screenName ));
            if (callback !== undefined) {
              callback(null, updatedUser);
            }

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
        nCacheObj.mentions = categorizeObj.node.mentions;
        nodeCache.set(nCacheObj.nodeId, nCacheObj);
      }

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

          debug(chalkLog("UPDATE_CATEGORY HASHTAG | #" + updatedHashtag.nodeId ));
          if (callback !== undefined) {
            callback(null, updatedHashtag);
          }
        }
      });
    break;

    default:
      debug(chalkSocket("categorizeNode TYPE: " + categorizeObj.node.nodeType
        + " | " + categorizeObj.node.nodeId
        + " | " + categorizeObj.category
      ));
      callback(new Error("categorizeNode TYPE: " + categorizeObj.node.nodeType), null);
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
      console.log(chalkLog("WAS | !!! TW RX MAX Q [" + tweetRxQueue.length + "]"
        + " | " + getTimeStamp()
        + " | TWP RDY: " + statsObj.tweetParserReady
        + " | TWP SND RDY: " + statsObj.tweetParserSendReady
        + " | MAX Qs " + statsObj.errors.twitter.maxRxQueue
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
        + " [ T/R/Q " + statsObj.twitter.tweetsReceived 
        + "/" + statsObj.twitter.retweetsReceived 
        + "/" + statsObj.twitter.quotedTweetsReceived + "]"
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
  if ((params.user.screenName !== undefined) && ignoredUserSet.has(params.user.screenName)) { return false; }
  if (unfollowableUserSet.has(params.user.nodeId)) { return false; }
  return true;
}

function follow(params, callback) {

  if (!enableFollow(params)) { 

    console.log(chalkWarn("-X- FOLLOW | @" + params.user.screenName 
      + " | IN UNFOLLOWABLE, FOLLOWED or IGNORED USER SET"
    ));

    if (callback !== undefined) { 
      return callback("XXX FOLLOW", null);
    }
    else {
      return;
    }
  }

  followedUserSet.add(params.user.nodeId);
  ignoredUserSet.delete(params.user.nodeId);
  ignoredUserSet.delete(params.user.screenName);
  unfollowableUserSet.delete(params.user.nodeId);
  unfollowableUserSet.delete(params.user.screenName);

  const query = { nodeId: params.user.nodeId };

  console.log(chalk.black.bold("WAS | FOLLOWING | @" + params.user.screenName 
    + " | 3C @" + threeceeUser
  ));

  const update = {};

  update.$set = { 
    following: true, 
    threeceeFollowing: threeceeUser
  };

  const options = {
    new: true,
    returnOriginal: false,
    upsert: false
  };

  global.globalUser.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("WAS | *** FOLLOW | USER FIND ONE ERROR: " + err));
    }
    else if (userUpdated){

      console.log(chalkLog("WAS | +++ FOLLOW"
        + " | " + printUser({user: userUpdated})
      ));

      if (configuration.enableTwitterFollow){

        if (tssChildren[threeceeUser] !== undefined){

          tssChildren[threeceeUser].child.send({
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

function initTssChildren(){
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

function killTssChildren(){
  return new Promise(function(resolve, reject){

    Object.keys(tssChildren).forEach(function(threeceeUser){
      const childId = DEFAULT_TSS_CHILD_ID + "_" + threeceeUser.toLowerCase();
      killChild({childId: childId}, function(err){
        if (err) {
          return reject(err);
        }
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
      if (tssChildren[threeceeUser] 
        && (tssChildren[threeceeUser] !== undefined) 
        && tssChildren[threeceeUser].child){
        tssChildren[threeceeUser].child.send(params, function(err){
          if (err) {
            return reject(err); 
          }
        });
      }
    });

    resolve();

  });
}

function ignore(params, callback) {

  console.log(chalk.blue("WAS | XXX IGNORE | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    ignoredUserSet.add(params.user.nodeId);

    const ob = {
      userIds: [...ignoredUserSet]
    };

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: ignoredUserFile, 
      obj: ob
    });

  }

  tssSendAllChildren({op: "IGNORE", user: params.user});

  global.globalUser.deleteOne({"nodeId": params.user.nodeId}, function(err){
    if (err) {
      console.log(chalkError("WAS | *** DB DELETE IGNORED USER ERROR: " + err));
    }
    else {
      console.log(chalkAlert("WAS | XXX IGNORED USER | DELETED" 
        + " | " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
    }

    if (callback !== undefined) { callback(err); }
  });
}

function unignore(params, callback) {

  console.log(chalk.blue("WAS | +++ UNIGNORE | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){

    ignoredUserSet.delete(params.user.nodeId);

    const ob = {
      userIds: [...ignoredUserSet]
    };

    saveFileQueue.push({
      localFlag: false, 
      folder: dropboxConfigDefaultFolder, 
      file: ignoredUserFile, 
      obj: ob
    });

  } 

  const query = { nodeId: params.user.nodeId };

  const update = {};
  update.$set = { ignored: false };

  const options = {
    new: true,
    returnOriginal: false,
    upsert: false
  };

  global.globalUser.findOneAndUpdate(query, update, options, function(err, userUpdated){

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
        userIds: [...ignoredUserSet]
      };

      saveFileQueue.push({
        localFlag: false, 
        folder: dropboxConfigDefaultFolder, 
        file: ignoredUserFile, 
        obj: ob
      });
    }

    const obj = {
      userIds: [...unfollowableUserSet]
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

  const update = {};
  update.$set = { following: false, threeceeFollowing: false };

  const options = {
    new: true,
    returnOriginal: false,
    upsert: false
  };

  global.globalUser.findOneAndUpdate(query, update, options, function(err, userUpdated){

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

  statsObj.status = "INIT FOLLOWABLE SEARCH TERM SET";

  console.log(chalkBlue("WAS | INIT FOLLOWABLE SEARCH TERM SET: " + dropboxConfigDefaultFolder 
    + "/" + followableSearchTermFile
  ));

  return new Promise(function(resolve, reject) {

    loadFile({folder: dropboxConfigDefaultFolder, file: followableSearchTermFile}).
    then(function(dataObj){

      if (!dataObj || dataObj === undefined) {

       console.log(chalkAlert("WAS | ??? NO FOLLOWABLE SEARCH TERMS ERROR ???"
          + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
        ));

        initFollowableSearchTerms().
        then(function(){
          return resolve();
        }).
        catch(function(err){
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

          if (err) {
            console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
            return reject(err);
          }
          console.log(chalkLog("WAS | FOLLOWABLE SEARCH TERM SET"
            + " | " + followableSearchTermSet.size + " SEARCH TERMS"
            + " | " + dataArray.length + " SEARCH TERMS IN FILE"
            + " | " + dropboxConfigDefaultFolder + "/" + followableSearchTermFile
          ));

          initFollowableSearchTerms().
          then(function(){
            return resolve();
          }).
          catch(function(err){
            console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
            return reject(err);
          });

        });
      }

    }).
    catch(function(err){
      console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
      return reject(err);
    });

  });
}

function initIgnoredHashtagSet(){

  statsObj.status = "INIT IGNORE HASHTAG SET";

  console.log(chalkLog("WAS | INIT IGNORE HASHTAG SET"));

  return new Promise(function(resolve, reject) {

    loadFile({folder: dropboxConfigDefaultFolder, file: ignoredHashtagFile}).
    then(function(ignoredHashtagSetObj){

      if (!ignoredHashtagSetObj || ignoredHashtagSetObj === undefined) {
        console.log(chalkAlert("WAS | ??? LOAD IGNORED HASHTAGS EMPTY SET???"));
        return resolve();
      }

      console.log(chalkLog("WAS | LOADED IGNORED HASHTAGS FILE"
        + " | " + ignoredHashtagSetObj.hashtagIds.length + " HASHTAGS"
        + " | " + dropboxConfigDefaultFolder + "/" + ignoredHashtagFile
      ));

      let query;
      let update;
      let numIgnored = 0;
      let numAlreadyIgnored = 0;

      ignoredHashtagSet.clear();

      async.eachSeries(ignoredHashtagSetObj.hashtagIds, function(hashtagId, cb){

        ignoredHashtagSet.add(hashtagId);

        query = { nodeId: hashtagId, ignored: {"$in": [false, "false", null]} };

        update = {};
        update.$set = { ignored: true, following: false, threeceeFollowing: false };

        const options = {
          new: true,
          returnOriginal: false,
          upsert: false
        };

        global.globalHashtag.findOneAndUpdate(query, update, options, function(err, hashtagUpdated){

          if (err) {
            console.log(chalkError("WAS | *** initIgnoredHashtagSet | HASHTAG FIND ONE ERROR: " + err));
            return cb(err);
          }
          
          if (hashtagUpdated && (hashtagUpdated !== undefined)){

            numIgnored += 1;
            console.log(chalkLog("WAS | XXX IGNORE"
              + " [" + numIgnored + "/" + numAlreadyIgnored + "/" + ignoredHashtagSetObj.hashtagIds.length + "]"
              + " | " + printHashtag({hashtag: hashtagUpdated})
            ));

            cb();
          }
          else {
            numAlreadyIgnored += 1;
            console.log(chalkLog("WAS | ... ALREADY IGNORED"
              + " [" + numIgnored + "/" + numAlreadyIgnored + "/" + ignoredHashtagSetObj.hashtagIds.length + "]"
              + " | ID: " + hashtagId
            ));
            cb();
          }
        });

      }, function(err){

        if (err) {
          return reject(err);
        }
        console.log(chalkBlue("WAS | INIT IGNORED HASHTAGS"
          + " | " + numIgnored + " NEW IGNORED"
          + " | " + numAlreadyIgnored + " ALREADY IGNORED"
          + " | " + ignoredHashtagSet.size + " HASHTAGS IN SET"
          + " | " + ignoredHashtagSetObj.hashtagIds.length + " HASHTAGS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + ignoredHashtagFile
        ));
        resolve();
      });

    }).
    catch(function(err){
      if ((err.code === "ENOTFOUND") || (err.status === 409)) {
        console.log(chalkError("WAS | *** LOAD IGNORED HASHTAGS ERROR: FILE NOT FOUND:  " 
          + dropboxConfigDefaultFolder + "/" + ignoredHashtagFile
        ));
        return resolve();
      }
      
      console.log(chalkError("WAS | *** LOAD IGNORED HASHTAGS ERROR: " + err));
      return reject(err);
    });

  });
}

function initIgnoredUserSet(){

  statsObj.status = "INIT IGNORED USER SET";

  console.log(chalkLog("WAS | INIT IGNORED USER SET"));

  return new Promise(function(resolve, reject) {


    loadFile({folder: dropboxConfigDefaultFolder, file: ignoredUserFile}).
    then(function(ignoredUserSetObj){

      if (!ignoredUserSetObj || ignoredUserSetObj === undefined) {
        console.log(chalkAlert("WAS | ??? LOAD IGNORED USERS EMPTY SET???"));
        return resolve();
      }

      console.log(chalkLog("WAS | LOADED IGNORED USERS FILE"
        + " | " + ignoredUserSetObj.userIds.length + " USERS"
        + " | " + dropboxConfigDefaultFolder + "/" + ignoredUserFile
      ));

      async.eachSeries(ignoredUserSetObj.userIds, function(userId, cb){

        ignoredUserSet.add(userId);
        cb();

      }, function(err){

        if (err) {
          return reject(err);
        }
        console.log(chalkBlue("WAS | INIT IGNORED USERS"
          + " | " + ignoredUserSet.size + " USERS IN SET"
          + " | " + ignoredUserSetObj.userIds.length + " USERS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + ignoredUserFile
        ));
        resolve();
      });

    }).
    catch(function(err){
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

  statsObj.status = "INIT UNFOLLOWABLE USER SET";

  console.log(chalkLog("WAS | INIT UNFOLLOWABLE USER SET"));

  return new Promise(function(resolve, reject) {


    loadFile({folder: dropboxConfigDefaultFolder, file: unfollowableUserFile}).
    then(function(unfollowableUserSetObj){

      if (!unfollowableUserSetObj || unfollowableUserSetObj === undefined) {
        console.log(chalkAlert("WAS | ??? LOAD UNFOLLOWABLE USERS EMPTY SET???"));
        return resolve();
      }

      console.log(chalkLog("WAS | LOADED UNFOLLOWABLE USERS FILE"
        + " | " + unfollowableUserSetObj.userIds.length + " USERS"
        + " | " + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
      ));

      async.each(unfollowableUserSetObj.userIds, function(userId, cb){

        unfollowableUserSet.add(userId);

        cb();

      }, function(err){

        if (err) {
          return reject(err);
        }
        console.log(chalkBlue("WAS | INIT UNFOLLOWABLE USERS"
          + " | " + unfollowableUserSet.size + " USERS IN SET"
          + " | " + unfollowableUserSetObj.userIds.length + " USERS IN FILE"
          + " | " + dropboxConfigDefaultFolder + "/" + unfollowableUserFile
        ));
        return resolve();
      });

    }).
    catch(function(err){
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

function initSocketHandler(socketObj) {

  const socket = socketObj.socket;
  const socketId = socket.id;

  let ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  console.log(chalk.blue("WAS | SOCKET CONNECT"
    + " | " + ipAddress
    + " | " + socketObj.namespace
    + " | " + socket.id
    + " | AD: " + statsObj.admin.connected
    + " | UT: " + statsObj.entity.util.connected
    + " | VW: " + statsObj.entity.viewer.connected
  ));

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

    const currentServer = serverCache.get(socketId);

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


    const currentViewer = viewerCache.get(socketId);

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

    const currentServer = serverCache.get(socketId);

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

    const currentViewer = viewerCache.get(socketId);
    if (currentViewer) { 

      currentViewer.status = "DISCONNECTED";

      viewerCache.del(socketId, function(err){

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

    if (keepAliveObj.user.stats) { statsObj.utilities[keepAliveObj.user.userId] = keepAliveObj.user.stats; }


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
        + " | FOLLOW: " + dataObj.follow
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
          socket.emit("SET_TWITTER_USER", {user: updatedNodeObj, stats: statsObj.user.uncategorized });
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
      console.log(chalkError("WAS | *** userServerController OR dbConnection NOT READY ERROR"));
    }
    else{
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
            socket.emit("SET_TWITTER_USER", {user: user, stats: statsObj.user.uncategorized });
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
    }

  });

  socket.on("categorize", categorizeNode);

  socket.on("login", function socketLogin(viewerObj){

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

    ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

    const serverObj = serverCache.get(socket.id);
    const viewerObj = viewerCache.get(socket.id);

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

        const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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

        const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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

        const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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
    function(err){
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

function updateNodeMeter(node, callback){

  const nodeType = node.nodeType;

  if (!configuration.metrics.nodeMeterEnabled) { return callback(null, node); }

  if (node.nodeId === undefined) {
    console.log(chalkError("WAS | NODE ID UNDEFINED\n" + jsonPrint(node)));
    return callback("NODE ID UNDEFINED", node);
  }

  let nodeObj = {};

  nodeObj = pick(node, ["nodeId", "nodeType", "isServer", "isIgnored", "rate", "mentions"]);

  const meterNodeId = nodeObj.nodeId;

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
    if ((/TSS_/).test(meterNodeId) || nodeObj.isServer){
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
      nodeObj.mentions = nodeObj.mentions ? nodeObj.mentions+1 : 1;

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

      const nCacheObj = nodeCache.get(meterNodeId);

      if (nCacheObj) {
        nodeObj.mentions = Math.max(nodeObj.mentions, nCacheObj.mentions);
      }

      nodeObj.mentions = nodeObj.mentions ? nodeObj.mentions+1 : 1;
      node.mentions = nodeObj.mentions;

      nodeCache.set(meterNodeId, nodeObj);

      if (callback !== undefined) { callback(null, node); }
    }
  }
}

let transmitNodeQueueReady = true;
let transmitNodeQueueInterval;
const transmitNodeQueue = [];

function initFollowableSearchTerms(){

  statsObj.status = "INIT FOLLOWABLE SEARCH TERMS";

  return new Promise(function(resolve, reject){

    try {

      followableSearchTermsArray = [...followableSearchTermSet];

      // followableSearchTermString = termsArray.join('\\b|\\b');
      // followableSearchTermString = '\\b' + followableSearchTermString + '\\b';
      // followableRegEx = new RegExp('/' + followableSearchTermString + '/', "i");

      // debug(chalkInfo("followableRegEx: " + followableRegEx));  

      console.log(chalkLog("WAS | FOLLOWABLE SEARCH TERMS INITIALIZED"
        + " | " + followableSearchTermsArray.length + " SEARCH TERMS"
      ));

      resolve();
    }
    catch(err){

      console.log(chalkError("WAS | FOLLOWABLE SEARCH TERM REGEX ERROR: " + err));

      return reject(err);
    }

  });
}


function followable(text){

  return new Promise(function(resolve, reject){

    let hitSearchTerm = false;

    followableSearchTermsArray.some(function(searchTerm){
      if (new RegExp("\\b" + searchTerm + "\\b", "i").test(text)) {
        hitSearchTerm = searchTerm;
        return true;
      }
      return false;
    });

    resolve(hitSearchTerm);

  });

}


let hitSearchTerm = false;

function userCategorizeable(user){

  return new Promise(async function(resolve, reject){

    if (user.nodeType !== "user") { 
      return resolve(false); 
    }

    if (user.following && (user.following !== undefined)) { 
      categorizeableUserSet.add(user.nodeId);
      ignoredUserSet.delete(user.nodeId);
      unfollowableUserSet.delete(user.nodeId);
      return resolve(true); 
    }

    if (user.ignored && (user.ignored !== undefined)) { 
      ignoredUserSet.add(user.nodeId);
      unfollowableUserSet.add(user.nodeId);
      categorizeableUserSet.delete(user.nodeId);
      return resolve(false); 
    }

    if (ignoredUserSet.has(user.nodeId)) { 
      unfollowableUserSet.add(user.nodeId);
      categorizeableUserSet.delete(user.nodeId);
      return resolve(false); 
    }

    if (unfollowableUserSet.has(user.nodeId)) { 
      ignoredUserSet.add(user.nodeId);
      categorizeableUserSet.delete(user.nodeId);
      return resolve(false);
    }

    if (user.lang && (user.lang !== undefined) && (user.lang !== "en")) { 
      ignoredUserSet.add(user.nodeId);
      unfollowableUserSet.add(user.nodeId);
      categorizeableUserSet.delete(user.nodeId);
      if (configuration.verbose) { 
        console.log(chalkBlue("WAS | XXX UNCATEGORIZEABLE | USER LANG NOT ENGLISH: " + user.lang));
      }
      return resolve(false);
    }

    if (ignoreLocationsRegEx
      && (ignoreLocationsRegEx !== undefined) 
      && user.location 
      && (user.location !== undefined) 
      && !allowLocationsRegEx.test(user.location)
      && ignoreLocationsRegEx.test(user.location)){
      
      unfollowableUserSet.add(user.nodeId);
      ignoredUserSet.add(user.nodeId);

      return resolve(false);
    }
    
    if (user.followersCount && (user.followersCount !== undefined) && (user.followersCount < configuration.minFollowersAuto)) { 
      unfollowableUserSet.add(user.nodeId);
      categorizeableUserSet.add(user.nodeId);
      return resolve(false);
    }

    if (!user.ignored || (user.ignored === undefined)){

      if ((user.description === undefined) || !user.description) { user.description = ""; }
      if ((user.screenName === undefined) || !user.screenName) { user.screenName = ""; }
      if ((user.name === undefined) || !user.name) { user.name = ""; }

      hitSearchTerm = await followable(user.description);

      if (hitSearchTerm) { 
        categorizeableUserSet.add(user.nodeId);
        return resolve(true); 
      }

      hitSearchTerm = await followable(user.screenName);

      if (hitSearchTerm) { 
        categorizeableUserSet.add(user.nodeId);
        return resolve(true); 
      }

      hitSearchTerm = await followable(user.name);

      if (hitSearchTerm) { 
        categorizeableUserSet.add(user.nodeId);
        return resolve(true); 
      }

      return resolve(false);
    }

    resolve(false);

  });
}

function getCurrentThreeceeUser(){
  return new Promise(function(resolve){
    resolve("altthreecee00");
  });
}

function loadFileRetry(params){

  return new Promise(async function(resolve, reject){

    const resolveOnNotFound = params.resolveOnNotFound || false;
    const maxRetries = params.maxRetries || 5;
    let retryNumber;
    let backOffTime = params.initialBackOffTime || ONE_SECOND;
    const path = params.path || params.folder + "/" + params.file;

    const backOffLog = function(e){
      console.log(chalkAlert("WAS | FILE LOAD ERROR ... RETRY"
        + " | " + path
        + " | BACKOFF: " + msToTime(backOffTime)
        + " | " + retryNumber + " OF " + maxRetries
        + " | ERROR: " + e
      )); 
    };

    for (retryNumber = 0;retryNumber < maxRetries;retryNumber++) {
      try {
        
        const fileObj = await loadFile(params);

        if (retryNumber > 0) { 
          console.log(chalkAlert("WAS | FILE LOAD RETRY"
            + " | " + path
            + " | BACKOFF: " + msToTime(backOffTime)
            + " | " + retryNumber + " OF " + maxRetries
          )); 
        }

        return resolve(fileObj);
        // break;
      } 
      catch(err) {
        backOffTime *= 1.5;
        setTimeout(backOffLog(err), backOffTime);
      }
    }

    if (resolveOnNotFound) {
      console.log(chalkAlert("WAS | resolve FILE LOAD FAILED | RETRY: " + retryNumber + " OF " + maxRetries));
      return resolve(false);
    }
    console.log(chalkError("WAS | reject FILE LOAD FAILED | RETRY: " + retryNumber + " OF " + maxRetries));
    reject(new Error("FILE LOAD ERROR | RETRIES " + maxRetries));

  });
}

function initAllowLocations(){

  statsObj.status = "INIT ALLOW LOCATIONS SET";

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("WAS | INIT ALLOW LOCATIONS"));

    let response;

    try{
      response = await getFileMetadata({folder: dropboxConfigDefaultFolder, file: "allowLocations.txt"});
    }
    catch(err){
      console.log(chalkError("WAS | *** GET FILE METADATA ERROR: " + err));
      return reject(err);
    }

    const fileModifiedMoment = moment(new Date(response.client_modified));
  
    if (fileModifiedMoment.isSameOrBefore(prevAllowLocationsFileModifiedMoment)){
      console.log(chalkInfo("WAS | ALLOW LOCATIONS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevAllowLocationsFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));
      return resolve(0);
    }

    console.log(chalkInfo("WAS | ALLOW LOCATIONS FILE AFTER"));

    prevAllowLocationsFileModifiedMoment = moment(fileModifiedMoment);

    try{
      const data = await loadFileRetry({folder: dropboxConfigDefaultFolder, file: "allowLocations.txt"}); 

      if (data === undefined){
        console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
          + " | " + dropboxConfigDefaultFolder + "/" + "allowLocations.txt"
        ));
        return reject(new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED"));
      }

      debug(chalkInfo("WAS | DROPBOX ALLOW LOCATIONS FILE\n" + jsonPrint(data)));

      const dataArray = data.toString().toLowerCase().split("\n");

      console.log(chalk.blue("WAS | FILE CONTAINS " + dataArray.length + " ALLOW LOCATIONS "));

      dataArray.forEach(function(loc){
        let location = loc.trim();
        location = location.replace(/^\s+|\s+$|\n/gim, "");
        if (location.length > 1) { 
          allowLocationsSet.add(location);
          console.log(chalkLog("WAS | +++ ALLOW LOCATION [" + allowLocationsSet.size + "] " + location));
        }
      });

      allowLocationsArray = [...allowLocationsSet];
      allowLocationsString = allowLocationsArray.join('\\b|\\b');
      allowLocationsString = '\\b' + allowLocationsString + '\\b';
      allowLocationsRegEx = new RegExp(allowLocationsString, "i");

      resolve();

    }
    catch(e){
      console.log(chalkError("TSS | LOAD FILE ERROR\n" + e));
      return reject(e);
    }
      
  });
}

function initIgnoreLocations(){

  statsObj.status = "INIT IGNORE LOCATIONS SET";

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("WAS | INIT IGNORE LOCATIONS"));

    let response;

    try{
      response = await getFileMetadata({folder: dropboxConfigDefaultFolder, file: "ignoreLocations.txt"});
    }
    catch(err){
      console.log(chalkError("WAS | *** GET FILE METADATA ERROR: " + err));
      return reject(err);
    }

    const fileModifiedMoment = moment(new Date(response.client_modified));
  
    if (fileModifiedMoment.isSameOrBefore(prevIgnoredLocationsFileModifiedMoment)){
      console.log(chalkInfo("WAS | IGNORE LOCATIONS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevIgnoredLocationsFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));
      return resolve(0);
    }

    console.log(chalkInfo("WAS | IGNORE LOCATIONS FILE AFTER"));

    prevIgnoredLocationsFileModifiedMoment = moment(fileModifiedMoment);

    try{
      const data = await loadFileRetry({folder: dropboxConfigDefaultFolder, file: "ignoreLocations.txt"}); 

      if (data === undefined){
        console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
          + " | " + dropboxConfigDefaultFolder + "/" + "ignoreLocations.txt"
        ));
        return reject(new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED"));
      }

      debug(chalkInfo("WAS | DROPBOX IGNORE LOCATIONS FILE\n" + jsonPrint(data)));

      const dataArray = data.toString().toLowerCase().split("\n");

      console.log(chalk.blue("WAS | FILE CONTAINS " + dataArray.length + " IGNORE LOCATIONS "));

      dataArray.forEach(function(loc){
        let location = loc.trim();
        location = location.replace(/\s|\n/gim, "");
        if (location.length > 1) { 
          ignoreLocationsSet.add(location);
          console.log(chalkLog("WAS | +++ IGNORE LOCATION [" + ignoreLocationsSet.size + "] " + location));
        }
      });

      ignoreLocationsArray = [...ignoreLocationsSet];
      ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
      ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
      ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "i");

      resolve();

    }
    catch(e){
      console.log(chalkError("TSS | LOAD FILE ERROR\n" + e));
      return reject(e);
    }
      
  });
}

function updateUserSets(){

  statsObj.status = "UPDATE USER SETS";

  return new Promise(function(resolve, reject){

    let calledBack = false;
    // let categorizeable = false;

    if (!statsObj.dbConnectionReady) {
      console.log(chalkAlert("WAS | ABORT updateUserSets: DB CONNECTION NOT READY"));
      calledBack = true;
      return reject(new Error("DB CONNECTION NOT READY"));
    }

    const userCollection = global.globalDbConnection.collection("users");

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

    userCollection.countDocuments({category: { "$nin": [false, "false", null] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT CAT MAN ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.categorizedManual = count;
      console.log(chalkBlue("WAS | TOTAL CATEGORIZED MANUAL USERS IN DB: " + statsObj.user.categorizedManual));
    });

    userCollection.countDocuments({category: { "$in": [false, "false", null] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT UNCAT MAN ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.uncategorizedManual = count;
      console.log(chalkBlue("WAS | TOTAL UNCATEGORIZED MANUAL USERS IN DB: " + statsObj.user.uncategorizedManual));
    });

    userCollection.countDocuments({categoryAuto: { "$nin": [false, "false", null] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT CAT AUTO ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.categorizedAuto = count;
      console.log(chalkBlue("WAS | TOTAL CATEGORIZED AUTO USERS IN DB: " + statsObj.user.categorizedAuto));
    });

    userCollection.countDocuments({categoryAuto: { "$in": [false, "false", null] }}, function(err, count){
      if (err) { 
        console.log(chalkError("UPDATE USER SETS COUNT UNCAT AUTO ERROR: " + err));
        calledBack = true;
        return reject(err);
      }
      statsObj.user.uncategorizedAuto = count;
      console.log(chalkBlue("WAS | TOTAL UNCATEGORIZED AUTO USERS IN DB: " + statsObj.user.uncategorizedAuto));
    });

    userRightSet.clear();
    userLeftSet.clear();
    userNeutralSet.clear();
    userPositiveSet.clear();
    userNegativeSet.clear();
    userNoneSet.clear();

    userAutoRightSet.clear();
    userAutoLeftSet.clear();
    userAutoNeutralSet.clear();
    userAutoPositiveSet.clear();
    userAutoNegativeSet.clear();
    userAutoNoneSet.clear();

    const userSearchQuery = { ignored: { "$in": [false, "false", null] } };
    
    userSearchCursor = global.globalUser.find(userSearchQuery).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

    userSearchCursor.on("data", async function(user) {

      if (user.lang && (user.lang !== undefined) && (user.lang !== "en")){

        ignoredUserSet.add(user.nodeId);
        unfollowableUserSet.add(user.nodeId);

        global.globalUser.deleteOne({"nodeId": user.nodeId}, function(err){
          if (err) {
            console.log(chalkError("WAS | *** DB DELETE USER LANG NOT ENG | ERROR: " + err));
          }
          else {
            printUserObj(
              "XXX USER | LANG NOT ENGLISH: " + user.lang,
              user, 
              chalkAlert
            );
          }
        });

      }
      else {

        switch (user.category) {
          case "right":
            userRightSet.add(user.nodeId);
            userLeftSet.delete(user.nodeId);
            userNeutralSet.delete(user.nodeId);
            userPositiveSet.delete(user.nodeId);
            userNegativeSet.delete(user.nodeId);
            userNoneSet.delete(user.nodeId);
          break;
          case "left":
            userRightSet.delete(user.nodeId);
            userLeftSet.add(user.nodeId);
            userNeutralSet.delete(user.nodeId);
            userPositiveSet.delete(user.nodeId);
            userNegativeSet.delete(user.nodeId);
            userNoneSet.delete(user.nodeId);
          break;
          case "neutral":
            userRightSet.delete(user.nodeId);
            userLeftSet.delete(user.nodeId);
            userNeutralSet.add(user.nodeId);
            userPositiveSet.delete(user.nodeId);
            userNegativeSet.delete(user.nodeId);
            userNoneSet.delete(user.nodeId);
          break;
          case "positive":
            userRightSet.delete(user.nodeId);
            userLeftSet.delete(user.nodeId);
            userNeutralSet.delete(user.nodeId);
            userPositiveSet.add(user.nodeId);
            userNegativeSet.delete(user.nodeId);
            userNoneSet.delete(user.nodeId);
          break;
          case "negative":
            userRightSet.delete(user.nodeId);
            userLeftSet.delete(user.nodeId);
            userNeutralSet.delete(user.nodeId);
            userPositiveSet.delete(user.nodeId);
            userNegativeSet.add(user.nodeId);
            userNoneSet.delete(user.nodeId);
          break;
          default:
            userRightSet.delete(user.nodeId);
            userLeftSet.delete(user.nodeId);
            userNeutralSet.delete(user.nodeId);
            userPositiveSet.delete(user.nodeId);
            userNegativeSet.delete(user.nodeId);
            userNoneSet.add(user.nodeId);
            if ((user.followersCount >= configuration.minFollowersAuto)) {
              uncategorizedManualUserSet.add(user.nodeId);
            }
        }

        switch (user.categoryAuto) {
          case "right":
            userAutoRightSet.add(user.nodeId);
            userAutoLeftSet.delete(user.nodeId);
            userAutoNeutralSet.delete(user.nodeId);
            userAutoPositiveSet.delete(user.nodeId);
            userAutoNegativeSet.delete(user.nodeId);
            userAutoNoneSet.delete(user.nodeId);
          break;
          case "left":
            userAutoRightSet.delete(user.nodeId);
            userAutoLeftSet.add(user.nodeId);
            userAutoNeutralSet.delete(user.nodeId);
            userAutoPositiveSet.delete(user.nodeId);
            userAutoNegativeSet.delete(user.nodeId);
            userAutoNoneSet.delete(user.nodeId);
          break;
          case "neutral":
            userAutoRightSet.delete(user.nodeId);
            userAutoLeftSet.delete(user.nodeId);
            userAutoNeutralSet.add(user.nodeId);
            userAutoPositiveSet.delete(user.nodeId);
            userAutoNegativeSet.delete(user.nodeId);
            userAutoNoneSet.delete(user.nodeId);
          break;
          case "positive":
            userAutoRightSet.delete(user.nodeId);
            userAutoLeftSet.delete(user.nodeId);
            userAutoNeutralSet.delete(user.nodeId);
            userAutoPositiveSet.add(user.nodeId);
            userAutoNegativeSet.delete(user.nodeId);
            userAutoNoneSet.delete(user.nodeId);
          break;
          case "negative":
            userAutoRightSet.delete(user.nodeId);
            userAutoLeftSet.delete(user.nodeId);
            userAutoNeutralSet.delete(user.nodeId);
            userAutoPositiveSet.delete(user.nodeId);
            userAutoNegativeSet.add(user.nodeId);
            userAutoNoneSet.delete(user.nodeId);
          break;
          default:
            userAutoRightSet.delete(user.nodeId);
            userAutoLeftSet.delete(user.nodeId);
            userAutoNeutralSet.delete(user.nodeId);
            userAutoPositiveSet.delete(user.nodeId);
            userAutoNegativeSet.delete(user.nodeId);
            userAutoNoneSet.add(user.nodeId);
        }

        let categorizeable = false;

        try {
          categorizeable = await userCategorizeable(user);
        }
        catch(e){
          categorizeable = false;
        }

        if (categorizeable
          && ((user.category === undefined) || !user.category) 
          && ((user.ignored === undefined) || !user.ignored) 
          && (!configuration.ignoreCategoryRight || (configuration.ignoreCategoryRight && user.categoryAuto && (user.categoryAuto !== "right")))
          && !ignoredUserSet.has(user.nodeId) 
          && !uncategorizedManualUserSet.has(user.nodeId) 
          && (user.followersCount >= configuration.minFollowersAuto) 
          && !unfollowableUserSet.has(user.nodeId)) { 

          uncategorizedManualUserSet.add(user.nodeId);

          if (uncategorizedManualUserSet.size % 100 === 0) {
            printUserObj("UNCAT MAN USER  [" + uncategorizedManualUserSet.size + "]", user);
          }
        }

        if (!uncategorizedAutoUserSet.has(user.nodeId) 
          && !user.categoryAuto 
          && !ignoredUserSet.has(user.nodeId) 
          && !ignoreLocationsSet.has(user.nodeId) 
          && (user.followersCount >= configuration.minFollowersAuto) 
          && !unfollowableUserSet.has(user.nodeId)) { 

          uncategorizedAutoUserSet.add(user.nodeId);

          if (uncategorizedAutoUserSet.size % 100 === 0) {
            printUserObj("UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", user);
          }
        }
        
        if (((user.category === "left") || (user.category === "neutral") || (user.category === "right"))
          && ((user.categoryAuto === "left") || (user.categoryAuto === "neutral") || (user.categoryAuto === "right"))
        ) { 

          uncategorizedManualUserSet.delete(user.nodeId); 
          uncategorizedAutoUserSet.delete(user.nodeId); 

          if (!ignoredUserSet.has(user.nodeId) 
            && !ignoreLocationsSet.has(user.nodeId) 
            && !unfollowableUserSet.has(user.nodeId)){
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
        }

      }

    });

    userSearchCursor.on("end", function() {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

      statsObj.user.matched = matchUserSet.size;
      statsObj.user.mismatched = mismatchUserSet.size;

      statsObj.user.manual.right = userRightSet.size;
      statsObj.user.manual.left = userLeftSet.size;
      statsObj.user.manual.neutral = userNeutralSet.size;
      statsObj.user.manual.positive = userPositiveSet.size;
      statsObj.user.manual.negative = userNegativeSet.size;
      statsObj.user.manual.none = userNoneSet.size;

      statsObj.user.auto.right = userAutoRightSet.size;
      statsObj.user.auto.left = userAutoLeftSet.size;
      statsObj.user.auto.neutral = userAutoNeutralSet.size;
      statsObj.user.auto.positive = userAutoPositiveSet.size;
      statsObj.user.auto.negative = userAutoNegativeSet.size;
      statsObj.user.auto.none = userAutoNoneSet.size;

      console.log(chalkBlue("WAS | END FOLLOWING CURSOR | FOLLOWING USER SET"));
      console.log(chalkLog("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

      if (!calledBack) { 
        calledBack = true;
        return resolve();
      }
    });

    userSearchCursor.on("error", function(err) {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

      statsObj.user.matched = matchUserSet.size;
      statsObj.user.mismatched = mismatchUserSet.size;

      statsObj.user.manual.right = userRightSet.size;
      statsObj.user.manual.left = userLeftSet.size;
      statsObj.user.manual.neutral = userNeutralSet.size;
      statsObj.user.manual.positive = userPositiveSet.size;
      statsObj.user.manual.negative = userNegativeSet.size;
      statsObj.user.manual.none = userNoneSet.size;

      statsObj.user.auto.right = userAutoRightSet.size;
      statsObj.user.auto.left = userAutoLeftSet.size;
      statsObj.user.auto.neutral = userAutoNeutralSet.size;
      statsObj.user.auto.positive = userAutoPositiveSet.size;
      statsObj.user.auto.negative = userAutoNegativeSet.size;
      statsObj.user.auto.none = userAutoNoneSet.size;


      console.error(chalkError("*** ERROR userSearchCursor: " + err));
      console.log(chalkAlert("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

      if (!calledBack) { 
        calledBack = true;
        return reject(err);
      }
    });

    userSearchCursor.on("close", function() {

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

      statsObj.user.matched = matchUserSet.size;
      statsObj.user.mismatched = mismatchUserSet.size;

      statsObj.user.manual.right = userRightSet.size;
      statsObj.user.manual.left = userLeftSet.size;
      statsObj.user.manual.neutral = userNeutralSet.size;
      statsObj.user.manual.positive = userPositiveSet.size;
      statsObj.user.manual.negative = userNegativeSet.size;
      statsObj.user.manual.none = userNoneSet.size;

      statsObj.user.auto.right = userAutoRightSet.size;
      statsObj.user.auto.left = userAutoLeftSet.size;
      statsObj.user.auto.neutral = userAutoNeutralSet.size;
      statsObj.user.auto.positive = userAutoPositiveSet.size;
      statsObj.user.auto.negative = userAutoNegativeSet.size;
      statsObj.user.auto.none = userAutoNoneSet.size;


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

  return new Promise(function(resolve){

    console.log(chalk.bold.black("WAS | INIT TRANSMIT NODE QUEUE INTERVAL: " + msToTime(interval)));

    clearInterval(transmitNodeQueueInterval);

    let nodeObj;
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

            updateNodeMeter(node, async function updateNodeMeterCallback(err, n){

              if (err) {
                console.log(chalkError("WAS | ERROR updateNodeMeter: " + err
                  + " | TYPE: " + node.nodeType
                  + " | NID: " + node.nodeId
                ));
                delete node._id;
                delete node.userId;
                viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));

                transmitNodeQueueReady = true;

              }
              else {

                try {
                  categorizeable = await userCategorizeable(n);
                }
                catch(e){
                  categorizeable = false;
                }

                if (categorizeable) {

                  if (n.nodeType !== "user"){
                    console.log(chalkError("WAS | *** CATEGORIZED NOT USER: CAT: " + categorizeable + " | TYPE: " + n.nodeType));
                  }

                  if (!uncategorizedManualUserSet.has(n.nodeId) 
                    && ((n.category === undefined) || !n.category) 
                    && ((n.ignored === undefined) || !n.ignored) 
                    && (!configuration.ignoreCategoryRight || (configuration.ignoreCategoryRight && n.categoryAuto && (n.categoryAuto !== "right")))
                    && !ignoredUserSet.has(n.nodeId) 
                    && (n.followersCount >= configuration.minFollowersAuto) 
                    && !unfollowableUserSet.has(n.nodeId)) { 

                    uncategorizedManualUserSet.add(n.nodeId);

                    if (uncategorizedManualUserSet.size % 100 === 0) {
                      printUserObj("TX | UNCAT MAN USER  [" + uncategorizedManualUserSet.size + "]", n);
                    }

                  }

                  if (!n.categoryAuto 
                    && (n.followersCount >= configuration.minFollowersAuto) 
                    && !uncategorizedAutoUserSet.has(n.nodeId)) { 
                    uncategorizedAutoUserSet.add(n.nodeId);
                    if (uncategorizedAutoUserSet.size % 100 === 0) {
                      printUserObj("TX | UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", n);
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
                    console.log(chalkError("WAS | *** userServerController OR DB CONNECTION NOT READY"));
                    transmitNodeQueueReady = true;
                  }

                  userServerController.findOneUser(n, {noInc: false, fields: fieldsTransmit}, function(err, updatedUser){
                    if (err) {
                      console.log(chalkError("WAS | findOneUser ERROR" + jsonPrint(err)));
                      delete n._id;
                      delete n.userId;
                      viewNameSpace.volatile.emit("node", n);
                    }
                    else {
                      delete n._id;
                      delete n.userId;
                      viewNameSpace.volatile.emit("node", updatedUser);
                    }

                    transmitNodeQueueReady = true;

                  });
                }
                else if (n.nodeType === "user") {
                  delete n._id;
                  delete n.userId;
                  viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));

                  transmitNodeQueueReady = true;
                }
                else if ((n.nodeType === "hashtag") && n.category){

                  n.updateLastSeen = true;

                  hashtagServerController.findOneHashtag(n, {noInc: false}, function(err, updatedHashtag){
                    if (err) {
                      console.log(chalkError("WAS | updatedHashtag ERROR\n" + jsonPrint(err)));
                      delete n._id;
                      delete n.userId;
                      viewNameSpace.volatile.emit("node", n);
                    }
                    else if (updatedHashtag) {
                      delete n._id;
                      delete n.userId;
                      viewNameSpace.volatile.emit("node", updatedHashtag);
                    }
                    else {
                      delete n._id;
                      delete n.userId;
                      viewNameSpace.volatile.emit("node", n);
                    }

                    transmitNodeQueueReady = true;

                  });
                }
                else if (n.nodeType === "hashtag") {
                  delete n._id;
                  delete n.userId;
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

    resolve();

  });
}

function transmitNodes(tw, callback){

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
        if (hashtag && !ignoredHashtagSet.has(hashtag.nodeId) && configuration.enableTransmitHashtag) { 
          transmitNodeQueue.push(hashtag);
        }
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

function logHeartbeat() {

  // memoryAvailableMB = (statsObj.memory.memoryAvailable/(1024*1024));
  // memoryTotalMB = (statsObj.memory.memoryTotal/(1024*1024));
  // memoryAvailablePercent = (statsObj.memory.memoryAvailable/statsObj.memory.memoryTotal);

  debug(chalkLog("HB " + heartbeatsSent 
    + " | " + getTimeStamp() 
    + " | ST: " + getTimeStamp(parseInt(statsObj.startTime)) 
    + " | UP: " + msToTime(statsObj.upTime) 
    + " | RN: " + msToTime(statsObj.runTime) 
    // + " | MEM: " + memoryAvailableMB.toFixed(0) + " AVAIL"
    // + " / " + memoryTotalMB.toFixed(0) + " TOTAL MB"
    // + " - " + memoryAvailablePercent.toFixed(3) + " %"
  ));
}

let dropboxFolderGetLastestCursorReady = true;

function touchUsersZipUpdateFlag(){
  console.log(chalkLog("WAS | TOUCH FILE: " + usersZipUpdateFlagFile));
  touch.sync(usersZipUpdateFlagFile, { force: true });
  return;
}

function initAppRouting(callback) {

  console.log(chalkInfo(getTimeStamp() + " | INIT APP ROUTING"));

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
    else if (req.path === "callbacks/addsub") {
      console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | callbacks/addsub"
      )); 

      console.log(chalkAlert("WAS | R< callbacks/addsub"
        + "\nreq.query\n" + jsonPrint(req.query)
        + "\nreq.params\n" + jsonPrint(req.params)
        + "\nreq.body\n" + jsonPrint(req.body)
      )); 
    }
    else if (req.path === "callbacks/removesub") {
      console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | callbacks/removesub"
      )); 

      console.log(chalkAlert("WAS | R< callbacks/removesub"
        + "\nreq.query\n" + jsonPrint(req.query)
        + "\nreq.params\n" + jsonPrint(req.params)
        + "\nreq.body\n" + jsonPrint(req.body)
      )); 
    }
    else if (req.path === TWITTER_WEBHOOK_URL) {

      console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | " + TWITTER_WEBHOOK_URL
        + " | " + getTimeStamp()
        + " | IP: " + req.ip
        + " | HOST: " + req.hostname
        + " | METHOD: " + req.method
        + " | PATH: " + req.path
        + " | ERROR: " + req.error
      )); 

      if (req.method === "GET") {

        const crc_token = req.query.crc_token;

        if (crc_token) {

          console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | CRC TOKEN: " + crc_token));

          const hmac = crypto.createHmac("sha256", threeceeConfig.consumer_secret).update(crc_token).digest("base64");

          console.log(chalkAlert("WAS | T> TWITTER WEB HOOK | CRC TOKEN > HASH: " + hmac));

          res.status(200);

          res.send({
            response_token: "sha256=" + hmac
          });

        } 
        else {
          res.status(400);
          res.send("Error: crc_token missing from request.")
        }
      }
      else {
        // ACCOUNT EVENTS

        const followEvents = req.body.follow_events;

        if (followEvents && (followEvents[0].type === "follow")) {
          console.log(chalkAlert("WAS | >>> TWITTER USER FOLLOW EVENT"
            + " | SOURCE: @" + followEvents[0].source.screen_name
            + " | TARGET: @" + followEvents[0].target.screen_name
            // + "\n" + jsonPrint(followEvents)
          ));

          const user = {
            nodeId: followEvents[0].target.id.toString(),
            screenName: followEvents[0].target.screen_name
          }

          follow({user: user, forceFollow: true}, function(err, updatedUser){
            if (err) {
              console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: " + err));
              return;
            }
            
            if (!updatedUser) { return; }

            adminNameSpace.emit("FOLLOW", updatedUser);
            utilNameSpace.emit("FOLLOW", updatedUser);

            debug(chalk.blue("WAS | +++ TWITTER FOLLOW"
              + " | UID" + updatedUser.nodeId
              + " | @" + updatedUser.screenName
            ));

          });

        }
        
        if (followEvents && (followEvents[0].type === "unfollow")) {

          console.log(chalkAlert("WAS | >>> TWITTER USER UNFOLLOW EVENT"
            + " | SOURCE: @" + followEvents[0].source.screen_name
            + " | TARGET: @" + followEvents[0].target.screen_name
            // + "\n" + jsonPrint(followEvents)
          ));

          const user = {
            nodeId: followEvents[0].target.id.toString(),
            screenName: followEvents[0].target.id.screenName
          }

          unfollow({user: user}, function(err, updatedUser){
            if (err) {
              console.log(chalkError("WAS | TWITTER_UNFOLLOW ERROR: " + err));
              return;
            }
            
            if (!updatedUser) { return; }

            adminNameSpace.emit("UNFOLLOW", updatedUser);
            utilNameSpace.emit("UNFOLLOW", updatedUser);

            debug(chalk.blue("WAS | XXX TWITTER UNFOLLOW"
              + " | UID" + updatedUser.nodeId
              + " | @" + updatedUser.screenName
            ));

          });
        }
        
        res.sendStatus(200);
      }

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

      const dropboxCursorFolderArray = configuration.dropboxChangeFolderArray;

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
                  async.eachSeries(response.entries, async function(entry){

                    console.log(chalk.green("WAS | >>> DROPBOX CHANGE | PATH LOWER: " + entry.path_lower));

                    if ((entry.path_lower.endsWith("google_wordassoserverconfig.json"))
                      || (entry.path_lower.endsWith("default_wordassoserverconfig.json"))){
                      await initConfig();
                      return;
                    }

                    if (entry.path_lower.endsWith("users.zip")){
                      touchUsersZipUpdateFlag();
                      return;
                    }

                    if (entry.path_lower.endsWith(bestRuntimeNetworkFileName.toLowerCase())){
                      loadBestRuntimeNetwork().
                      then(function(){
                        return;
                      }).
                      catch(function(err){
                        return err;
                      });
                    }

                    if (entry.path_lower.endsWith(maxInputHashMapFile)){

                      setTimeout(function(){

                        loadMaxInputHashMap().
                        then(function(){
                          configEvents.emit("NEW_MAX_INPUT_HASHMAP");
                          return;
                        }).
                        catch(function(err){
                          return err;
                        });

                      }, 10*ONE_SECOND);
                    }

                    if (entry.path_lower.endsWith("defaultsearchterms.txt")){
                      updateSearchTerms();
                      return;
                    }

                    if (entry.path_lower.endsWith(ignoredHashtagFile.toLowerCase())){
                      initIgnoredHashtagSet();
                      return;
                    }

                    if (entry.path_lower.endsWith("allowLocations.txt")){
                      allowLocations();
                      return;
                    }

                    if (entry.path_lower.endsWith("ignorelocations.txt")){
                      ignoreLocations();
                      return;
                    }

                    if (entry.path_lower.endsWith("followablesearchterm.txt")){
                      initFollowableSearchTermSet().
                      then(function(){
                        return;
                      }).
                      catch(function(err){
                        return err;
                      });
                    }

                    if ((entry.path_lower.endsWith("google_twittersearchstreamconfig.json"))
                      || (entry.path_lower.endsWith("default_twittersearchstreamconfig.json"))){

                      killTssChildren().
                      then(function(){
                        initTssChildren();
                        return;
                      }).
                      catch(function(err){
                        return err;
                      });
                    }

                    return;

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

      const googleVerification = path.join(__dirname, "/googleccd19766bea2dfd2.html");

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
    else if ((req.path === "/session.js") || (req.path === "/js/libs/controlPanel.js")) {

      // const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
      // const LOCAL_SOURCE = "http://localhost:9997";
      // var DEFAULT_SOURCE = REPLACE_SOURCE;

      const fullPath = path.join(__dirname, req.path);
      const defaultSource = (hostname === "google") ? "PRODUCTION_SOURCE" : "LOCAL_SOURCE";

      console.log(chalkAlert("WAS | !!! REPLACE DEFAULT SOURCE"
        + " | REQ: " + req.path
        + " | PATH: " + fullPath
        + " | SOURCE: " + defaultSource
      ));

      fs.readFile(fullPath, "utf8", function(err, data) {

        if (err) {
          console.log(chalkError("fs readFile " + fullPath + " ERROR: " + err));
          res.sendStatus(404);
        }
        else {
          console.log(chalkInfo(getTimeStamp()
            + "WAS | T> | FILE"
            + " | " + fullPath
          ));

          const newFile = data.replace(/REPLACE_SOURCE/g, defaultSource);

          res.send(newFile);
        }

      });
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

  app.use(express.static(path.join(__dirname, "/")));
  app.use(express.static(path.join(__dirname, "/js")));
  app.use(express.static(path.join(__dirname, "/css")));
  app.use(express.static(path.join(__dirname, "/node_modules")));
  app.use(express.static(path.join(__dirname, "/public/assets/images")));

  const adminHtml = path.join(__dirname, "/admin/admin.html");

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

  const loginHtml = path.join(__dirname, "/login.html");

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

  const sessionHtml = path.join(__dirname, "/sessionModular.html");

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
      return next();
    }
    console.log(chalkAlert("WAS | *** PASSPORT TWITTER *NOT* AUTHENTICATED ***"));
  }

  app.get("/account", ensureAuthenticated, function(req, res){

    console.log(chalkError("WAS | PASSPORT TWITTER AUTH USER\n" + jsonPrint(req.session.passport.user))); // handle errors
    console.log(chalkError("WAS | PASSPORT TWITTER AUTH USER"
      + " | IP: " + req.ip
      + " | @" + req.session.passport.user.screenName
      + " | UID" + req.session.passport.user.nodeId
    )); // handle errors

    if (!userServerControllerReady || !statsObj.dbConnectionReady) {
      return callback(new Error("userServerController not ready"), null);
    }

    userServerController.findOne({ user: req.session.passport.user}, function(err, user) {
      if(err) {
        console.log(chalkError("WAS | *** ERROR TWITTER AUTHENTICATION: " + jsonPrint(err))); // handle errors
        res.redirect("/504.html");
      } 
      else if (user) {
        console.log(chalk.green("TWITTER USER AUTHENTICATED: @" + user.screenName)); // handle errors
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

  app.get("/auth/twitter/error", function(){
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

  const testClient = net.createConnection(80, params.url);

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

  return new Promise(function(resolve){

    debug(chalkInfo(getTimeStamp() 
      + " | INIT INTERNET CHECK INTERVAL | " + interval + " MS"));

    clearInterval(internetCheckInterval);

    const params = {url: configuration.testInternetConnectionUrl};

    testInternetConnection(params, function(err){
      if (err) {
        console.log(chalkError("WAS | *** TEST INTERNET CONNECTION ERROR: " + err));
      }
    });

    internetCheckInterval = setInterval(function internetCheck(){

      testInternetConnection(params, function(err){
        if (err) {
          console.log(chalkError("WAS | *** TEST INTERNET CONNECTION ERROR: " + err));
        }
      });

    }, interval);

    resolve();

  });
}

function initTwitterRxQueueInterval(interval){

  return new Promise(function(resolve, reject){

    let tweet = {};

    if (typeof interval !== "number") {
      return reject(new Error("initTwitterRxQueueInterval interval NOT a NUMBER: " + interval));
    }

    console.log(chalk.bold.black("WAS | INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

    clearInterval(tweetRxQueueInterval);

    tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

      if ((tweetRxQueue.length > 0) && statsObj.tweetParserReady) {

        tweet = tweetRxQueue.shift();

        childrenHashMap[DEFAULT_TWP_CHILD_ID].child.send({ op: "tweet", tweetStatus: tweet });

      }
    }, interval);

    resolve();

  });
}

let tweetParserMessageRxQueueReady = true;
let tweetParserMessageRxQueueInterval;

function initTweetParserMessageRxQueueInterval(interval){

  return new Promise(function(resolve, reject) {

    if (typeof interval !== "number") {
      return reject(new Error("initTweetParserMessageRxQueueInterval interval NOT a NUMBER: " + interval));
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

        if (tweetParserMessage.op === "error") {
 
          statsObj.errors.twitter.parser += 1;

          console.log(chalkError("WAS | *** ERROR PARSE TW"
            + " | " + getTimeStamp()
            + " | TWEET PARSER ERRORS: " + statsObj.errors.twitter.parser
            + " | ERROR: " + tweetParserMessage.err
          ));

          tweetParserMessageRxQueueReady = true;

        }
        else if (tweetParserMessage.op === "parsedTweet") {

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

    resolve();
  });
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

  return new Promise(function(resolve) {

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

    resolve();

  });
}

function keySort(params, callback){

  debug(chalkLog("KEY SORT"
    + " | KEYS: " + Object.keys(params.obj).length
  ));

  sortedObjectValues(params).
  then(function(results){
    callback(null, results);
  }).
  catch(function(err){
    callback(err, params);
  });
}

let keySortInterval;
let keySortReady = true;

function initKeySortInterval(interval){

  return new Promise(function(resolve){

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

    resolve();

  });
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

            killChild({childId: DEFAULT_DBU_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
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

            killChild({childId: DEFAULT_DBU_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
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

            killChild({childId: DEFAULT_TFE_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
              tfePongReceived = false;
              initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
            });

            return;
          }

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

            killChild({childId: DEFAULT_TFE_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
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

    const unfollowArrarys = {};

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

        if (err1) {
          console.log(chalkError("WAS | *** UNFOLLOW DUPLICATES ERROR: " + err1));
          return cb0();
        }

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
          // + " | 3C USER SOURCE: " + threeceeUserSource
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

async function allowLocations(){
  console.log(chalk.green("WAS | WAS | UPDATE ALLOW LOCATIONS"));
  try{
    await initAllowLocations();
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT ALLOW LOCATIONS ERROR: " + err));
  }
  tssSendAllChildren({op: "UPDATE_ALLOW_LOCATIONS"});
}

async function ignoreLocations(){
  console.log(chalk.green("WAS | WAS | UPDATE IGNORE LOCATIONS"));
  try{
    await initIgnoreLocations();
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT IGNORE LOCATIONS ERROR: " + err));
  }
  tssSendAllChildren({op: "UPDATE_IGNORE_LOCATIONS"});
}

function initTssChild(params){

  statsObj.status = "INIT TSS CHILD";

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

          if (m.errorType === "TWITTER_UNFOLLOW") {

            threeceeTwitter[m.threeceeUser].twitterErrors += 1;
            threeceeTwitter[m.threeceeUser].twitterErrorFlag = m.error;

            console.log(chalkError("WAS | <TSS | ERROR | TWITTER_UNFOLLOW"
              + " | AUTUO FOLLOW USER: @" + threeceeUser
              + " | ERROR TYPE: " + m.errorType
              + " | ERROR MESSAGE: " + m.error.message
              // + "\n" + jsonPrint(m.error)
            ));

          }
          else if ((m.errorType === "TWITTER_FOLLOW_LIMIT") || (m.error.code === 161)) {

            threeceeTwitter[m.threeceeUser].twitterErrors += 1;
            threeceeTwitter[m.threeceeUser].twitterErrorFlag = m.error;
            threeceeTwitter[m.threeceeUser].twitterAuthorizationErrorFlag = m.error;

            console.log(chalkError("WAS | <TSS | ERROR | TWITTER_FOLLOW_LIMIT"
              + " | AUTUO FOLLOW USER: @" + threeceeUser
              + " | ERROR TYPE: " + m.errorType
              + " | ERROR MESSAGE: " + m.error.message
              // + "\n" + jsonPrint(m.error)
            ));

          }
          else if ((m.errorType === "TWITTER_UNAUTHORIZED") || (m.error.statusCode === 401)) {

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
              userIds: [...unfollowableUserSet]
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
          if (m.twitterConfig) {
            threeceeTwitter[m.threeceeUser].twitterConfig = m.twitterConfig;
          }

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
        resolve();
      }
    });

  });
}

function initTfeChild(params){

  statsObj.status = "INIT TFE CHILD";

  return new Promise(function(resolve, reject){

    statsObj.tfeChildReady = false;

    console.log(chalk.bold.black("WAS | INIT TFE CHILD\n" + jsonPrint(params)));

    console.log(chalkInfo("WAS | LOADED MAX INPUT HASHMAP + NORMALIZATION"));
    console.log(chalkInfo("WAS | MAX INPUT HASHMAP INPUT TYPES: " + Object.keys(maxInputHashMap)));
    console.log(chalkInfo("WAS | NORMALIZATION INPUT TYPES: " + Object.keys(normalization)));

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

      const threeceeHashMap = (isInfoUser) ? threeceeInfoTwitter : threeceeTwitter;

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

  statsObj.status = "INIT DBU CHILD";

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

            killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
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

            killChild({childId: DEFAULT_TWP_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
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
        
      }
    }, interval);

  }
}

function initTweetParser(params){

  statsObj.status = "INIT TWEET PARSER";

  return new Promise(function(resolve, reject){

    console.log(chalk.bold.black("WAS | INIT TWEET PARSER\n" + jsonPrint(params)));

    clearInterval(tweetParserPingInterval);
    tweetParserPongReceived = false;

    statsObj.tweetParserReady = false;

    let twp;

    try{
      twp = cp.fork(`${__dirname}/js/libs/tweetParser.js`);
    }
    catch(err){
      console.log(chalkError("WAS | *** TWEET PARSER CHILD FORK ERROR: " + err));
      return reject(err);
    }

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

    resolve();

  });
}

function initRateQinterval(interval){

  return new Promise(function(resolve){

    console.log(chalk.bold.black("WAS | INIT RATE QUEUE INTERVAL | " + msToTime(interval)));
  
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

    let updateTimeSeriesCount = 0;

    let paramsSorterOverall = {};
    let paramsSorter = {};

    updateMetricsInterval = setInterval(function updateMetrics () {

      statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
      statsObj.queues.tweetRxQueue = tweetRxQueue.length;
      statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.length;
      statsObj.queues.tweetParserMessageRxQueue = tweetParserMessageRxQueue.length;

      updateTimeSeriesCount += 1;

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

function loadBestRuntimeNetwork(p){

  return new Promise(function(resolve, reject){

    const params = p || {};

    const folder = params.folder || bestNetworkFolder;
    let file = params.file || bestRuntimeNetworkFileName;

    loadFile({folder: folder, file: file, noErrorNotFoundFlag: true})
    .then(function(bRtNnObj){
      if (bRtNnObj) {

        bRtNnObj.matchRate = (bRtNnObj.matchRate !== undefined) ? bRtNnObj.matchRate : 0;

        console.log(chalkInfo("WAS | LOAD BEST NETWORK RUNTIME ID"
          + " | " + bRtNnObj.networkId
          + " | SUCCESS: " + bRtNnObj.successRate.toFixed(2) + "%"
          + " | MATCH: " + bRtNnObj.matchRate.toFixed(2) + "%"
        ));

        file = bRtNnObj.networkId + ".json";

        loadFile({folder: folder, file: file, noErrorNotFoundFlag: true}).
        then(function(nnObj){
          if (nnObj) { 

            nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
            bestNetworkObj = {};
            bestNetworkObj = deepcopy(nnObj);
            console.log(chalk.green.bold("WAS | +++ LOADED BEST NETWORK: " + bestNetworkObj.networkId));

            statsObj.bestNetwork = pick(bestNetworkObj, statsBestNetworkPickArray);

            if (statsObj.previousBestNetworkId !== bestNetworkObj.networkId) {
              console.log(chalk.green.bold("WAS | >>> BEST NETWORK CHANGE"
                + " | PREV: " + statsObj.previousBestNetworkId
                + " > NEW: " + bestNetworkObj.networkId
              ));
              statsObj.previousBestNetworkId = bestNetworkObj.networkId;
              configEvents.emit("NEW_BEST_NETWORK", bestNetworkObj.networkId);
            }

            resolve(bestNetworkObj.networkId);

          }
          else {

            global.globalNeuralNetwork.find({}).sort({"matchRate": -1}).limit(1).exec(function(err, nnArray){
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
                console.log(chalk.green.bold("WAS | >>> BEST NETWORK CHANGE"
                  + " | PREV: " + statsObj.previousBestNetworkId
                  + " > NEW: " + bestNetworkObj.networkId
                ));
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
        }).
        catch(function(err){
          console.log(chalkError("WAS | *** LOAD BEST NETWORK RUNTIME ID ERROR: ", err));
          return reject(err);
        });
      }
      else {
        global.globalNeuralNetwork.find({}).sort({"matchRate": -1}).limit(1).exec(function(err, nnArray){
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
            console.log(chalk.green.bold("WAS | >>> BEST NETWORK CHANGE"
              + " | PREV: " + statsObj.previousBestNetworkId
              + " > NEW: " + bestNetworkObj.networkId
            ));
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
      loadCommandLineArgs().
      then(function(){
        return resolve();
      }).
      catch(function(err){
        return reject(err);
      });
    }

    getFileMetadata({folder: params.folder, file: params.file}).
    then(function(response){
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

      loadFile({folder: params.folder, file: params.file}).
      then(function(loadedConfigObj){

        if ((loadedConfigObj === undefined) || !loadedConfigObj) {
          console.log(chalkError("WAS | DROPBOX CONFIG LOAD FILE ERROR | JSON UNDEFINED ??? "));
          return reject(new Error("JSON UNDEFINED"));
        }

        console.log(chalkInfo("WAS | LOADED CONFIG FILE: " + params.file + "\n" + jsonPrint(loadedConfigObj)));

        const newConfiguration = {};
        newConfiguration.metrics = {};
        newConfiguration.threeceeUsers = [];

        if (loadedConfigObj.WAS_TEST_MODE !== undefined){
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

        if (loadedConfigObj.VERBOSE !== undefined){
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

        if (loadedConfigObj.IGNORE_CATEGORY_RIGHT !== undefined){
          console.log("WAS | LOADED IGNORE_CATEGORY_RIGHT: " + loadedConfigObj.IGNORE_CATEGORY_RIGHT);

          if ((loadedConfigObj.IGNORE_CATEGORY_RIGHT === false) || (loadedConfigObj.IGNORE_CATEGORY_RIGHT === "false")) {
            newConfiguration.ignoreCategoryRight = false;
          }
          else if ((loadedConfigObj.IGNORE_CATEGORY_RIGHT === true) || (loadedConfigObj.IGNORE_CATEGORY_RIGHT === "true")) {
            newConfiguration.ignoreCategoryRight = true;
          }
          else {
            newConfiguration.ignoreCategoryRight = false;
          }
        }

        if (loadedConfigObj.GEOCODE_ENABLED !== undefined){
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

        if (loadedConfigObj.FILTER_DUPLICATE_TWEETS !== undefined){
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

        if (loadedConfigObj.ENABLE_IMAGE_ANALYSIS !== undefined){
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

        if (loadedConfigObj.FORCE_IMAGE_ANALYSIS !== undefined){
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

        if (loadedConfigObj.AUTO_FOLLOW !== undefined){
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

        if (loadedConfigObj.FORCE_FOLLOW !== undefined){
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

        if (loadedConfigObj.WAS_ENABLE_STDIN !== undefined){
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

        if (loadedConfigObj.TWITTER_THREECEE_USER !== undefined){
          console.log("WAS | LOADED TWITTER_THREECEE_USER: " + loadedConfigObj.TWITTER_THREECEE_USER);
          newConfiguration.threeceeUser = loadedConfigObj.TWITTER_THREECEE_USER;
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

        if (loadedConfigObj.UPDATE_USER_SETS_INTERVAL !== undefined){
          console.log("WAS | LOADED UPDATE_USER_SETS_INTERVAL: " + loadedConfigObj.UPDATE_USER_SETS_INTERVAL);
          newConfiguration.updateUserSetsInterval = loadedConfigObj.UPDATE_USER_SETS_INTERVAL;
        }

        if (loadedConfigObj.KEEPALIVE_INTERVAL !== undefined){
          console.log("WAS | LOADED KEEPALIVE_INTERVAL: " + loadedConfigObj.KEEPALIVE_INTERVAL);
          newConfiguration.keepaliveInterval = loadedConfigObj.KEEPALIVE_INTERVAL;
        }

        resolve(newConfiguration);

      });
    }).
    catch(function(err){
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

    loadConfigFile({folder: dropboxConfigDefaultFolder, file: dropboxConfigDefaultFile}).
    then(function(defaultConfig){

      if (defaultConfig) {
        defaultConfiguration = defaultConfig;
        console.log(chalk.green("WAS | +++ RELOADED DEFAULT CONFIG " + dropboxConfigDefaultFolder + "/" + dropboxConfigDefaultFile));
      }

      loadConfigFile({folder: dropboxConfigHostFolder, file: dropboxConfigHostFile}).
      then(function(hostConfig){

        if (hostConfig) {
          hostConfiguration = hostConfig;
          console.log(chalk.green("WAS | +++ RELOADED HOST CONFIG " + dropboxConfigHostFolder + "/" + dropboxConfigHostFile));
        }

        const defaultAndHostConfig = merge(defaultConfiguration, hostConfiguration); // host settings override defaults
        const tempConfig = merge(configuration, defaultAndHostConfig); // any new settings override existing config

        configuration = tempConfig;
        configuration.threeceeUsers = _.uniq(configuration.threeceeUsers); // merge concats arrays!

        resolve();

      });

    }).
    catch(function(err){
      reject(err);
    });


  });
}

function initStatsUpdate(cnf) {

  return new Promise(function(resolve, reject){

    try {
      console.log(chalkTwitter("WAS | INIT STATS UPDATE INTERVAL | " + cnf.statsUpdateIntervalTime + " MS"));

      showStats(true);

      clearInterval(statsInterval);

      statsInterval = setInterval(function updateStats() {

        getChildProcesses({searchTerm: "ALL"}).
        then(function(childArray){

          if (configuration.verbose) { 
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

          if (adminNameSpace) { statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; }// userNameSpace.sockets.length ;
          if (utilNameSpace) { statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; } // userNameSpace.sockets.length ;
          if (viewNameSpace) { statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; } // userNameSpace.sockets.length ;

          saveStats(statsFile, statsObj, function saveStatsComplete(status){
            debug(chalkLog("SAVE STATS " + status));
          });

          showStats();

          if (statsObj.twitNotReadyWarning) { statsObj.twitNotReadyWarning = false; }

        }).
        catch(function(err){
          console.log(chalkError("WAS | getChildProcesses ERROR:", err));
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
    configuration.verbose = process.env.VERBOSE || false;
    configuration.quitOnError = process.env.QUIT_ON_ERROR || false;
    configuration.enableStdin = process.env.ENABLE_STDIN || true;
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

    loadAllConfigFiles().
    then(function(){

      loadCommandLineArgs().
      then(function(){

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

        initStatsUpdate(configuration).
        then(function(){
          resolve(configuration);
        });

      });

    }).
    catch(function(err){
      console.log(chalkLog("WAS | *** INIT CONFIG ERROR: " + err));
      return reject(err);
    });

  });
}

function initDbUserChangeStream(){

  return new Promise(function(resolve, reject){

    const userCollection = global.globalDbConnection.collection("users");

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

            debug(chalkInfo("WAS | CHG"
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

  return new Promise(function(resolve, reject){

    console.log(chalkBlue("WAS | INIT CATEGORIZED USER + HASHTAG HASHMAPS FROM DB"));
  
    async.series({

      user: function(cb){

        const p = {};

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

          function test(cbTest) {
            cbTest(null, statsObj.dbConnectionReady && more);
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

        const p = {};

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

          function test(cbTest) {
            cbTest(null, statsObj.dbConnectionReady && more);
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

function initStdIn(){

  return new Promise(function(resolve){

    console.log("TNN | STDIN ENABLED");

    stdin = process.stdin;

    if(stdin.setRawMode !== undefined) {
      stdin.setRawMode( true );
    }
    stdin.resume();
    stdin.setEncoding( "utf8" );
    stdin.on("data", function( key ){

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
      if (err){
        console.log(chalkError("WAS | *** initIgnoreWordsHashMap ERROR: " + err));
        return reject(err);
      }
      resolve();
    });

  });
}

let updateUserSetsInterval;
let updateUserSetsIntervalReady = true;

function initUpdateUserSetsInterval(interval){

  return new Promise(function(resolve){

    clearInterval(updateUserSetsInterval);

    console.log(chalk.bold.black("WAS | INIT USER SETS INTERVAL | " + msToTime(interval) ));

    updateUserSetsInterval = setInterval(function() {

      try {

        uncategorizedManualUserArray = [...uncategorizedManualUserSet];
        statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

        if (statsObj.dbConnectionReady && updateUserSetsIntervalReady) {

          updateUserSetsIntervalReady = false;

          updateUserSets().
          then(function(){
            updateUserSetsIntervalReady = true;
          }).
          catch(function(err){
            console.log(chalkError("WAS | UPDATE USER SETS ERROR: " + err));
            updateUserSetsIntervalReady = true;
          });
        }
      }
      catch(err){
        console.log(chalkError("WAS | UPDATE USER SETS ERROR: " + err));
        updateUserSetsIntervalReady = true;
      }

    }, interval);

    resolve();

  });
}

let memStatsInterval;

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
            + "\nCONFIG\n" + jsonPrint(twitterConfig)
          ));

          if (!configuration.threeceeUsers.includes(twitterConfig.screenName)) {
            console.log(chalkAlert("WAS | SKIP CONFIG @" + twitterConfig.screenName + " | NOT IN 3C USERS: " + configuration.threeceeUsers));
            return cb();
          }

          threeceeTwitter[user].twitterConfig = {};
          threeceeTwitter[user].twitterConfig = twitterConfig;

          threeceeTwitter[user].twit = new Twit({
            consumer_key: twitterConfig.consumer_key, 
            consumer_secret: twitterConfig.consumer_secret,
            app_only_auth: true
          });

          threeceeTwitter[user].ready = true;
          threeceeTwitter[user].status = false;
          threeceeTwitter[user].error = false;
          statsObj.threeceeUsersConfiguredFlag = true;

          cb();
        })
        .catch(function(err){
          console.log(chalkError("WAS | *** INIT THREECEE TWITTER CONFIG ERROR: " + err
          ));
          return cb(err);
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
        const currentThreeceeUser = await getCurrentThreeceeUser();
        console.log(chalkInfo("WAS | CURRENT 3C TWITTER USER: @" + currentThreeceeUser));
        resolve(currentThreeceeUser);
      }
      catch(err1){
        console.log(chalkInfo("WAS | *** CURRENT 3C TWITTER USER ERROR: " + err1));
        return reject(err1);
      }
    
    });

  });
}

function twitterGetUserUpdateDb(user){

  return new Promise(async function(resolve, reject){

    if (!user.userId && !user.nodeId && !user.screenName) { return reject(new Error("NO USER PROPS")); }

    try{
      printUserObj("WAS | GET USER TWITTER DATA", user);

      const twitQuery = {};

      twitQuery.include_entities = true;

      if (user.nodeId !== undefined) { twitQuery.user_id = user.nodeId; }
      if (user.userId !== undefined) { twitQuery.user_id = user.userId; }
      if (user.screenName !== undefined) { twitQuery.screen_name = user.screenName; }

      threeceeTwitter[threeceeUser].twit.get("users/show", twitQuery, async function usersShow (err, rawUser){

        if (err) {

          console.log(chalkError("WAS | *** ERROR users/show rawUser"
            + " | @" + user.screenName 
            + " | " + err 
            + "\nerr\n" + jsonPrint(err)
            + "\ntwitQuery\n" + jsonPrint(twitQuery)
          ));

          if ((err.code === 63) || (err.code === 50)) { // USER SUSPENDED or NOT FOUND

            try {
              if (user.nodeId !== undefined) { 

                console.log(chalkAlert("WAS | XXX DELETING USER IN DB | @" + user.screenName + " | NID: " + user.nodeId));

                await global.globalUser.deleteOne({ 'nodeId': user.nodeId });

                ignoredUserSet.add(user.nodeId);
                followableUserSet.delete(user.nodeId);
                uncategorizedManualUserSet.delete(user.nodeId);
                uncategorizedAutoUserSet.delete(user.nodeId);
                categorizedUserHashMap.delete(user.nodeId);

                return resolve();
              }

              if (user.screenName !== undefined) { 

                console.log(chalkAlert("WAS | XXX DELETING USER IN DB | @" + user.screenName + " | NID: " + user.nodeId));
                
                await global.globalUser.deleteOne({ 'screenName': user.screenName });
                
                ignoredUserSet.add(user.screenName.toLowerCase());
                followableUserSet.delete(user.nodeId);
                uncategorizedManualUserSet.delete(user.nodeId);
                uncategorizedAutoUserSet.delete(user.nodeId);
                categorizedUserHashMap.delete(user.nodeId);

                return resolve();
              }
            }
            catch(err1){
              return reject(err1);
            }

          }

          return reject(err);
        }

        if (rawUser && (rawUser !== undefined)) {

          if (!userServerControllerReady || !statsObj.dbConnectionReady) {
            return reject(new Error("userServerController not ready"));
          }

          let cUser;

          try{
            cUser = await userServerController.convertRawUserPromise({user: rawUser});
          }
          catch(err1){
            console.log(chalkError("WAS | *** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
            return reject(err1);
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
          user.mentions = 0;

          const nCacheObj = nodeCache.get(user.nodeId);

          if (nCacheObj) {
            user.mentions = Math.max(user.mentions, nCacheObj.mentions);
          }
          // else {
          //   user.mentions = 0;
          // }

          user.setMentions = true;

          try{
            const updatedUser = await userServerController.findOneUserV2({user: user, mergeHistograms: false, noInc: true});
            console.log(chalk.blue("WAS | UPDATED updatedUser"
              + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
              + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
              + "\n" + printUser({user: updatedUser})
            ));
            return resolve(updatedUser);
          }
          catch(err1){
            console.log(chalkError("WAS | *** findOneUserV2 ERROR: " + err1));
            return reject(err1);
          }
        }
        else {
          console.log(chalkTwitter("WAS | NOT FOUND users/show data"));
          return reject(new Error("TWITTER NOT FOUND"));
        }
      });
    }
    catch(err){
      console.log(chalkTwitter("WAS | XXX TWITTER_SEARCH_NODE USER FAIL"
        + " | threeceeTwitter[currentThreeceeUser] UNDEFINED"
        + " | 3C @" + threeceeUser
        + "\n" + printUser({user: user})
      ));
    }

  });
}

function twitterSearchUserNode(searchQuery){

  return new Promise(async function(resolve, reject){

    try {

      const user = await global.globalUser.findOne(searchQuery);

      if (user) {

        printUserObj("WAS | TWITTER SEARCH DB | FOUND USER", user);

        const updatedUser = await twitterGetUserUpdateDb(user);

        if (updatedUser) { 
          return resolve(updatedUser);
        }

        return resolve(null);

      }

      console.log(chalkLog("WAS | TWITTER SEARCH DB USER NOT FOUND"
        + "\nsearchQuery\n" + jsonPrint(searchQuery)
      ));

      const newUser = await twitterGetUserUpdateDb(searchQuery);

      if (newUser) { return resolve(newUser); }

      return resolve(null);

    }
    catch(err){
      console.log(chalkError("WAS | *** TWITTER SEARCH NODE USER ERROR"
        + "searchQuery\n" + jsonPrint(searchQuery)
        + "ERROR\n" + jsonPrint(err)
      ));
      return reject(err);
    }

  });
}

function twitterSearchUser(params) {

  return new Promise(async function(resolve, reject){

    try {

      const searchNode = params.searchNode;
      const searchNodeUser = { screenName: searchNode.substring(1) };

      let searchUserId;
      let searchMode;
      let searchUserArray = [];

      const userAutoLeftArray = [...userAutoLeftSet];
      const userAutoRightArray = [...userAutoRightSet];
      const userAutoNeutralArray = [...userAutoNeutralSet];

      uncategorizedManualUserArray = [...uncategorizedManualUserSet];

      statsObj.user.uncategorized.all = uncategorizedManualUserArray.length;
      statsObj.user.uncategorized.left = _.intersection(userAutoLeftArray, uncategorizedManualUserArray).length;
      statsObj.user.uncategorized.right = _.intersection(userAutoRightArray, uncategorizedManualUserArray).length;
      statsObj.user.uncategorized.neutral = _.intersection(userAutoNeutralArray, uncategorizedManualUserArray).length;

      statsObj.user.uncategorizedManualUserArray = uncategorizedManualUserArray.length;

      statsObj.user.mismatched = mismatchUserSet.size;

      statsObj.user.manual.right = userRightSet.size;
      statsObj.user.manual.left = userLeftSet.size;
      statsObj.user.manual.neutral = userNeutralSet.size;
      statsObj.user.manual.positive = userPositiveSet.size;
      statsObj.user.manual.negative = userNegativeSet.size;
      statsObj.user.manual.none = userNoneSet.size;

      statsObj.user.auto.right = userAutoRightSet.size;
      statsObj.user.auto.left = userAutoLeftSet.size;
      statsObj.user.auto.neutral = userAutoNeutralSet.size;
      statsObj.user.auto.positive = userAutoPositiveSet.size;
      statsObj.user.auto.negative = userAutoNegativeSet.size;
      statsObj.user.auto.none = userAutoNoneSet.size;

      if (searchNodeUser.screenName.startsWith("?")) {

        switch (searchNodeUser.screenName) {
          case "?":
            searchMode = "UNCAT";
            searchUserArray = uncategorizedManualUserArray;
          break;
          case "?mm":
            searchMode = "MISMATCH";
            searchUserArray = _.shuffle([...mismatchUserSet]);
          break;
          case "?left":
            searchMode = "UNCAT_LEFT";
            searchUserArray = _.intersection(userAutoLeftArray, uncategorizedManualUserArray);
          break;
          case "?right":
            searchMode = "UNCAT_RIGHT";
            searchUserArray = _.intersection(userAutoRightArray, uncategorizedManualUserArray);
          break;
          case "?neutral":
            searchMode = "UNCAT_NEUTRAL";
            searchUserArray = _.intersection(userAutoNeutralArray, uncategorizedManualUserArray);
          break;
          default:
            console.log(chalkError("WAS | *** UNKNOWN searchNodeUser.screenName: " + searchNodeUser.screenName));
            return reject(new Error("UNKNOWN searchNodeUser.screenName"));
        }

        if (searchUserArray.length === 0) {

          console.log(chalkLog("WAS | --- TWITTER_SEARCH_NODE | NO USERS FOUND"
            + " | " + getTimeStamp()
            + " | MODE: " + searchMode
            + " [ SEARCH USER ARRAY: " + searchUserArray.length + "]"
          ));

          const message = {};
          
          message.user = {};
          message.user.notFound = true;
          message.searchNode = searchNode;
          message.stats = statsObj.user.uncategorized;

          viewNameSpace.emit("TWITTER_SEARCH_NODE_EMPTY_QUEUE", message);

          return resolve();
        }

        searchUserId = searchUserArray.shift();

        console.log(chalkSocket("WAS | TWITTER_SEARCH_NODE"
          + " | " + getTimeStamp()
          + " | MODE: " + searchMode
          + " [ SEARCH USER ARRAY: " + searchUserArray.length + "]"
          + " | USER NID: " + searchUserId
        ));


        try {
          const user = await twitterSearchUserNode({nodeId: searchUserId});

          if (user) {

            console.log(chalkBlue("WAS | T> TWITTER_SEARCH_NODE"
              + " | " + getTimeStamp()
              + " | MODE: " + searchMode
              + " [ SEARCH USER ARRAY: " + searchUserArray.length + "]"
              + " | NID: " + user.nodeId
              + " | @" + user.screenName
            ));

            if (user.toObject && (typeof user.toObject === "function")) {
              viewNameSpace.emit("SET_TWITTER_USER", { user: user.toObject(), stats: statsObj.user.uncategorized });
            }
            else{
              viewNameSpace.emit("SET_TWITTER_USER", { user: user, stats: statsObj.user.uncategorized });
            }

            if (tfeChild !== undefined) { 

              let categorizeable = false;

              try {
                categorizeable = await userCategorizeable(user);
              }
              catch(e){
                categorizeable = false;
              }

              if (categorizeable) { 
                if (user.toObject && (typeof user.toObject === "function")) {
                  tfeChild.send({op: "USER_CATEGORIZE", user: user.toObject()});
               }
                else {
                  tfeChild.send({op: "USER_CATEGORIZE", user: user});
                }
              }
            }

            return resolve(user);
          }

          console.log(chalkAlert("WAS | *** TWITTER_SEARCH_NODE | NOT FOUND"
            + " | " + getTimeStamp()
            + " | MODE: " + searchMode
            + " [ SEARCH USER ARRAY: " + searchUserArray.length + "]"
            + " | NID: " + user.nodeId
            + " | @" + user.screenName
          ));

          viewNameSpace.emit("TWITTER_SEARCH_NODE_NOT_FOUND", { searchNode: searchNode, stats: statsObj.user.uncategorized });

          return resolve();
        }
        catch(err){
          console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
            + " [ UC USER ARRAY: " + searchUserArray.length + "]"
            + " | " + getTimeStamp()
            + " | SEARCH UNCATEGORIZED USER"
            + " | UID: " + searchUserId
            + " | ERROR: " + err
          ));

          viewNameSpace.emit("TWITTER_SEARCH_NODE_ERROR", { searchNode: searchNode, stats: statsObj.user.uncategorized });
          uncategorizedManualUserSet.delete(searchUserId);
          ignoredUserSet.add(searchUserId);
          return reject(err);
        }
      }      

      console.log(chalkInfo("WAS | SEARCH FOR SPECIFIC USER | " + jsonPrint(searchNodeUser)));

      try {
        const user = await twitterSearchUserNode(searchNodeUser);

        if (user) {

          console.log(chalkBlue("WAS | T> TWITTER_SEARCH_NODE"
            + " | " + getTimeStamp()
            + " | NID: " + user.nodeId
            + " | @" + user.screenName
          ));

          if (user.toObject && (typeof user.toObject === "function")) {
            viewNameSpace.emit("SET_TWITTER_USER", { user: user.toObject(), stats: statsObj.user.uncategorized });
          }
          else{
            viewNameSpace.emit("SET_TWITTER_USER", { user: user, stats: statsObj.user.uncategorized });
          }

          if (tfeChild !== undefined) { 

            let categorizeable = false;

            try {
              categorizeable = await userCategorizeable(user);
            }
            catch(e){
              categorizeable = false;
            }

            if (categorizeable) { 
              if (user.toObject && (typeof user.toObject === "function")) {
                tfeChild.send({op: "USER_CATEGORIZE", user: user.toObject()});
             }
              else {
                tfeChild.send({op: "USER_CATEGORIZE", user: user});
              }
            }
          }

          return resolve(user);
        }

        console.log(chalkAlert("WAS | *** TWITTER_SEARCH_NODE | NOT FOUND"
          + " | " + getTimeStamp()
          + " | NID: " + user.nodeId
          + " | @" + user.screenName
        ));

        viewNameSpace.emit("TWITTER_SEARCH_NODE_NOT_FOUND", { searchNode: searchNode, stats: statsObj.user.uncategorized });

        return resolve();
      }
      catch(err){
        console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
          + " | " + getTimeStamp()
          + " | SEARCH UNCATEGORIZED USER"
          + " | searchNodeUser: " + searchNodeUser
          + " | ERROR: " + err
        ));

        viewNameSpace.emit("TWITTER_SEARCH_NODE_ERROR", { searchNode: searchNode, stats: statsObj.user.uncategorized });
        uncategorizedManualUserSet.delete(searchUserId);
        ignoredUserSet.add(searchUserId);
        return reject(err);
      }

    }
    catch(err){
      return reject(err);
    }
  });
}

function twitterSearchHashtag(params) {

  return new Promise(async function(resolve, reject){

    try {

      const searchNode = params.searchNode.toLowerCase().trim();
      const searchNodeHashtag = { nodeId: searchNode.substring(1) };

      try {

        let hashtag = await global.globalHashtag.findOne({hashtag: searchNodeHashtag});

        if (hashtag) { 

          console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG FOUND\n" + jsonPrint(hashtag)));

          viewNameSpace.emit("SET_TWITTER_HASHTAG", { hashtag: hashtag });

          if (hashtag.category) { 

            const htCatObj = {};
            htCatObj.manual = hashtag.category;
            htCatObj.auto = false;

            if (categorizedHashtagHashMap.has(hashtag.nodeId.toLowerCase())) {
              htCatObj.auto = categorizedHashtagHashMap.get(hashtag.nodeId.toLowerCase()).auto || false;
            }

            categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), htCatObj);

          }
          return resolve(hashtag);
        }

        console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG NOT FOUND: #" + searchNodeHashtag.nodeId));
        console.log(chalkTwitter("WAS | +++ CREATE NEW HASHTAG: #" + searchNodeHashtag.nodeId));

        hashtag = new global.globalHashtag({ nodeId: searchNodeHashtag.nodeId.toLowerCase(), text: searchNodeHashtag.nodeId.toLowerCase()});

        const newHashtag = await hashtag.save();

        console.log(chalk.blue("WAS | +++ SAVED NEW HASHTAG"
          + " | #" + newHashtag.nodeId
        ));

        viewNameSpace.emit("SET_TWITTER_HASHTAG", newHashtag);

        return resolve(newHashtag);

      }
      catch(err){
        console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE HASHTAG ERROR\n" + jsonPrint(err)));
        return reject(err);
      }
    }
    catch(err){
      return reject(err);
    }

  });

}

function twitterSearchNode(params) {

  return new Promise(async function(resolve, reject){

    try {

      const searchNode = params.searchNode.toLowerCase().trim();

      console.log(chalkSocket("TWITTER_SEARCH_NODE"
        + " | " + getTimeStamp()
        + " | " + searchNode
      ));

      if (searchNode.startsWith("#")) {
        await twitterSearchHashtag({searchNode: searchNode});
        return resolve();
      }

      if (searchNode.startsWith("@")) {
        await twitterSearchUser({searchNode: searchNode});
        return resolve();
      }

      viewNameSpace.emit("TWITTER_SEARCH_NODE_UNKNOWN_MODE", { searchNode: searchNode, stats: statsObj.user.uncategorized });
      reject(new Error("UNKNOWN SEARCH MODE: " + searchNode));

    }
    catch(err){
      reject(err);
    }

  });
}

function initTwitterSearchNodeQueueInterval(interval){

  return new Promise(function(resolve){

    let searchNodeParams;
    twitterSearchNodeQueueReady = true;

    console.log(chalk.bold.black("WAS | INIT TWITTER SEARCH NODE QUEUE INTERVAL: " + msToTime(interval)));

    clearInterval(twitterSearchNodeQueueInterval);

    twitterSearchNodeQueueInterval = setInterval(async function txSearchNodeQueue () {

      if (twitterSearchNodeQueueReady && (twitterSearchNodeQueue.length > 0)) {

        twitterSearchNodeQueueReady = false;

        searchNodeParams = twitterSearchNodeQueue.shift();

        const searchTimeout = setTimeout(function(){

          console.log(chalkAlert(
            "WAS | *** SEARCH NODE TIMEOUT\nsearchNodeParams\n" + jsonPrint(searchNodeParams)
          ));

        }, 5000);


        try {
          const node = await twitterSearchNode(searchNodeParams);

          clearTimeout(searchTimeout);

          if (node) {
            console.log(chalk.green("WAS | TWITTER SEARCH NODE FOUND | NID: " + node.nodeId));
          }


          twitterSearchNodeQueueReady = true;
        }
        catch(err){
          clearTimeout(searchTimeout);
          console.log(chalkError("WAS | *** TWITTER SEARCH NODE ERROR: " + err));
          twitterSearchNodeQueueReady = true;
        }

      }
    }, interval);

    resolve();

  });
}

initStats(function setCacheObjKeys(){
  cacheObjKeys = Object.keys(statsObj.caches);
});

function allTrue(p){

  return new Promise(function(resolve){

    const params = p || {};

    let waitTime = 0;

    params.interval = params.interval || 10*ONE_SECOND;
    params.maxIntervalWait = params.maxIntervalWait || ONE_MINUTE;

    const waitInterval = setInterval(function() {

      if (statsObj.dbConnectionReady && statsObj.initSetsComplete) {

        clearInterval(waitInterval);
        resolve(true);
      }

      waitTime += params.interval;

      if (waitTime >= params.maxIntervalWait) {
        clearInterval(waitInterval);
        console.log(chalkAlert("WAS | ALL TRUE TIMEOUT | " + msToTime(waitTime)));
        return resolve(false);
      }

    }, params.interval);

  });
}

let dbConnectionReadyInterval;

function waitDbConnectionReady(){

  return new Promise(function(resolve){

    dbConnectionReadyInterval = setInterval(function(){

      console.log(chalkAlert("WAS | WAIT DB CONNECTION | " + getTimeStamp() ));

      if (statsObj.dbConnectionReady) {
        clearInterval(dbConnectionReadyInterval);
        return resolve();
      }

    }, 5000);

  });
}

setTimeout(async function(){

  console.log(chalkError("WAS | WAIT START TIMEOUT: " + msToTime(DEFAULT_START_TIMEOUT)));

  try {

    await waitDbConnectionReady();
    const cnf = await initConfig();

    configuration = deepcopy(cnf);
    if (configuration.twitter === undefined) { configuration.twitter = {}; }

    console.log("WAS | " + chalkTwitter(configuration.processName + " STARTED " + getTimeStamp() ));

    statsObj.status = "START";

    console.log(chalkTwitter("WAS" 
      + " | " + configuration.processName 
    ));

    await killAll();
    await allTrue();

    await initInternetCheckInterval(ONE_MINUTE);
    await initKeySortInterval(configuration.keySortInterval);
    await initSaveFileQueue(configuration);

    await initThreeceeTwitterUsers({threeceeUsers: configuration.threeceeUsers});

    try{
      await getTwitterWebhooks();
      await addAccountActivitySubscription();
    }
    catch(err){
      console.log(chalkError("WAS | *** TWITTER ACTIVITY ACCOUNT ERROR: " + err));
    }

    await initAllowLocations();
    await initIgnoreLocations();
    await updateUserSets();
    await loadBestRuntimeNetwork();
    await loadMaxInputHashMap();
    await initCategoryHashmaps();
    await initIgnoreWordsHashMap();
    await initTransmitNodeQueueInterval(configuration.transmitNodeQueueInterval);
    await initRateQinterval(configuration.rateQueueInterval);
    await initTwitterRxQueueInterval(configuration.twitterRxQueueInterval);
    await initTweetParserMessageRxQueueInterval(configuration.tweetParserMessageRxQueueInterval);
    await initTwitterSearchNodeQueueInterval(configuration.twitterSearchNodeQueueInterval);
    await initSorterMessageRxQueueInterval(configuration.sorterMessageRxQueueInterval);
    await initDbuChild({childId: DEFAULT_DBU_CHILD_ID});
    await initTweetParser({childId: DEFAULT_TWP_CHILD_ID});
    await initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
    await initDbUserChangeStream();
    await initTssChildren();
    await initUpdateUserSetsInterval(configuration.updateUserSetsInterval);
  }
  catch(err){
    console.log(chalkError("WAS | **** INIT CONFIG ERROR: " + err + "\n" + jsonPrint(err)));
    if (err.code !== 404) {
      console.log("WAS | *** INIT CONFIG ERROR | err.status: " + err.status);
      quit();
    }
  }
}, DEFAULT_START_TIMEOUT);

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
