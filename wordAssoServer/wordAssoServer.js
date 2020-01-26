const MODULE_NAME = "wordAssoServer";
const MODULE_ID_PREFIX = "WAS";
const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const DEFAULT_START_TIMEOUT = 10*ONE_SECOND;
const DEFAULT_MAX_USER_SEARCH_SKIP_COUNT = 25;

const DEFAULT_USER_PROFILE_ONLY_FLAG = false;
const DEFAULT_BINARY_MODE = true;

let saveSampleTweetFlag = true;

const os = require("os");
const kill = require("tree-kill");
const empty = require("is-empty");
const watch = require("watch");
// const whois = require("whois-promise");
const dns = require("dns");

// const {google} = require("googleapis");
// let cloudDebugger = google.clouddebugger("v2");

// require("@google-cloud/debug-agent").start({allowExpressions: true});

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

console.log("WAS | ==============================");
console.log("WAS | HOST: " + hostname);
console.log("WAS | ==============================");

let DROPBOX_ROOT_FOLDER;

if (hostname == "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
}
else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
}

const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
const tcUtils = new ThreeceeUtilities("WAS_TCU");

const msToTime = tcUtils.msToTime;
const jsonPrint = tcUtils.jsonPrint;
const getTimeStamp = tcUtils.getTimeStamp;

const TWITTER_WEBHOOK_URL = "/webhooks/twitter";
const TWITTER_AUTH_CALLBACK_URL = "https://word.threeceelabs.com/auth/twitter/callback";

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
let dbConnection;

const HashtagServerController = require("@threeceelabs/hashtag-server-controller");
const hashtagServerController = new HashtagServerController("WAS_HSC");
let hashtagServerControllerReady = false;

hashtagServerController.on("error", function(err){
  hashtagServerControllerReady = false;
  console.log(chalkError("WAS | *** HSC ERROR | " + err));
});

hashtagServerController.on("ready", function(appname){
  hashtagServerControllerReady = true;
  console.log(chalk.green("WAS | HSC READY | " + appname));
});


const UserServerController = require("@threeceelabs/user-server-controller");
const userServerController = new UserServerController("WAS_USC");
let userServerControllerReady = false;

userServerController.on("error", function(err){
  userServerControllerReady = false;
  console.log(chalkError("WAS | *** USC ERROR | " + err));
});

userServerController.on("ready", function(appname){
  userServerControllerReady = true;
  console.log(chalk.green("WAS | USC READY | " + appname));
});

let neuralNetworkChangeStream;
let userChangeStream;

let userSearchCursor;

let heartbeatInterval;

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const DEFAULT_IGNORE_CATEGORY_RIGHT = false;
const DEFAULT_FILTER_DUPLICATE_TWEETS = true;
const DEFAULT_FILTER_RETWEETS = false;
const DEFAULT_AUTO_FOLLOW = true;
const DEFAULT_FORCE_FOLLOW = false;

const DEFAULT_FORCE_IMAGE_ANALYSIS = false;
const DEFAULT_ENABLE_IMAGE_ANALYSIS = true;

const DEFAULT_FORCE_LANG_ANALYSIS = false;
const DEFAULT_ENABLE_LANG_ANALYSIS = true;

const DEFAULT_FORCE_GEOCODE = false;
const DEFAULT_ENABLE_GEOCODE = true;

const DEFAULT_DB_USER_MISS_QUEUE_INTERVAL = ONE_SECOND;
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
const DEFAULT_TSS_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "tss";
const DEFAULT_TWP_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "twp";

let dbuChild;
let tfeChild;
let tssChild;
let twpChild;

let filterDuplicateTweets = true;
let filterRetweets = false;

const DEFAULT_TWITTER_THREECEE_USER = "altthreecee00";
const DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT = Number(ONE_SECOND);

const DEFAULT_TWEET_VERSION_2 = false;

const DEFAULT_INTERVAL = 5;
const DEFAULT_MIN_FOLLOWERS_AUTO_CATEGORIZE = 5000;
const DEFAULT_MIN_FOLLOWERS_AUTO_FOLLOW = 20000;

const DEFAULT_TSS_TWITTER_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TWEET_PARSER_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_SORTER_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TWITTER_RX_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = DEFAULT_INTERVAL;

const TWP_PING_INTERVAL = 10*ONE_MINUTE;
const DBU_PING_INTERVAL = 10*ONE_MINUTE;
const TFE_PING_INTERVAL = 10*ONE_MINUTE;
const TSS_PING_INTERVAL = 10*ONE_MINUTE;

const DEFAULT_RATE_QUEUE_INTERVAL = 5*ONE_SECOND; // 1 second
const DEFAULT_RATE_QUEUE_INTERVAL_MODULO = 60; // modulo RATE_QUEUE_INTERVAL
const DEFAULT_STATS_UPDATE_INTERVAL = ONE_MINUTE;
const DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL = 5*ONE_MINUTE;

const DEFAULT_SOCKET_AUTH_TIMEOUT = 30*ONE_SECOND;
const DEFAULT_QUIT_ON_ERROR = false;
const DEFAULT_MAX_TOP_TERMS = 100;
const DEFAULT_METRICS_NODE_METER_ENABLED = true;

const DEFAULT_MAX_QUEUE = 500;
const DEFAULT_OFFLINE_MODE = process.env.OFFLINE_MODE || false; 
const DEFAULT_AUTO_OFFLINE_MODE = true; // if network connection is down, will auto switch to OFFLINE_MODE
const DEFAULT_IO_PING_INTERVAL = ONE_MINUTE;
const DEFAULT_IO_PING_TIMEOUT = 3*ONE_MINUTE;

const DEFAULT_NODE_TYPES = ["hashtag", "user"];

const compactDateTimeFormat = "YYYYMMDD HHmmss";
const tinyDateTimeFormat = "YYYYMMDDHHmmss";

const IP_CACHE_DEFAULT_TTL = 300; // seconds
const IP_CACHE_CHECK_PERIOD = 15;

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
// const TRENDING_CACHE_CHECK_PERIOD = 60;

const NODE_CACHE_DEFAULT_TTL = 60;
const NODE_CACHE_CHECK_PERIOD = 1;

const TWEET_ID_CACHE_DEFAULT_TTL = 20;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

const DEFAULT_UNCAT_USER_ID_CACHE_DEFAULT_TTL = 604800; // 3600*24*7 sec/week
const DEFAULT_UNCAT_USER_ID_CACHE_CHECK_PERIOD = 3600;

const DEFAULT_MISMATCH_USER_ID_CACHE_DEFAULT_TTL = 604800; // 3600*24*7 sec/week
const DEFAULT_MISMATCH_USER_ID_CACHE_CHECK_PERIOD = 3600;

const chalk = require("chalk");
const chalkUser = chalk.blue;
const chalkTwitter = chalk.blue;
const chalkConnect = chalk.black;
const chalkSocket = chalk.black;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkWarn = chalk.bold.yellow;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkBlue = chalk.blue;
const chalkBlueBold = chalk.blue.bold;

const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;

const btoa = require("btoa");
const request = require("request-promise-native");
const _ = require("lodash");
const touch = require("touch");
const merge = require("deepmerge");
const Measured = require("measured-core");
const omit = require("object.omit");
const pick = require("object.pick");
const config = require("./config/config");
const fs = require("fs");
const path = require("path");
const async = require("async");
const debug = require("debug")("wa");
const moment = require("moment");

const express = require("express");
const app = express();
app.set("trust proxy", 1); // trust first proxy

const expressSession = require("express-session");
const MongoStore = require("connect-mongo")(expressSession);
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require("serve-static")(path.join(__dirname, "public")));

const threeceeConfig = {
  consumer_key: "ex0jSXayxMOjNm4DZIiic9Nc0",
  consumer_secret: "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa",
  token: "14607119-S5EIEw89NSC462IkX4GWT67K1zWzoLzuZF7wiurku",
  token_secret: "3NI3s4sTILiqBilgEDBSlC6oSJYXcdLQP7lXp58TQMk0A"
};


const ipCacheObj = {};
function dnsReverse(params){

  return new Promise(function(resolve, reject){

    dns.reverse(params.ipAddress, function(err, hostnames){

      if (err) {
        console.log(chalkError(MODULE_ID_PREFIX + " | *** DNS REVERSE ERROR: " + err));
        return reject(err);
      }

      ipCacheObj.domainName = hostnames[0];
      ipCacheObj.timeStamp = getTimeStamp();

      ipCache.set(
        params.ipAddress, 
        ipCacheObj,
        ipCacheTtl
      );

      console.log(chalkLog(MODULE_ID_PREFIX + " | DNS REVERSE"
        + " | IP: " + params.ipAddress 
        + " | " + hostnames.length + " HOST NAMES"
        + " | HOST: " + hostnames[0]
        // + "\nhostnames\n" + jsonPrint(hostnames)
      ));

      resolve(hostnames[0]);
    });

  });
}

//=========================================================================
// SLACK
//=========================================================================

const slackChannel = "was";
const slackChannelUserAuth = "was-user-auth";
const slackChannelAdmin = "was-admin";

let slackText = "";
const channelsHashMap = new HashMap();

const slackOAuthAccessToken = "xoxp-3708084981-3708084993-206468961315-ec62db5792cd55071a51c544acf0da55";
const slackRtmToken = "xoxb-209434353623-bNIoT4Dxu1vv8JZNgu7CDliy";

let slackRtmClient;
let slackWebClient;

async function slackSendWebMessage(msgObj){
  try{
    const token = msgObj.token || slackOAuthAccessToken;
    const channel = msgObj.channel || configuration.slackChannel.id;
    const text = msgObj.text || msgObj;

    const message = {
      token: token, 
      channel: channel,
      text: text
    };

    if (msgObj.attachments !== undefined) {
      message.attachments = msgObj.attachments;
    }

    if (slackWebClient && slackWebClient !== undefined) {
      const sendResponse = await slackWebClient.chat.postMessage(message);
      return sendResponse;
    }
    else {
      console.log(chalkAlert(MODULE_ID_PREFIX + " | SLACK WEB NOT CONFIGURED | SKIPPING SEND SLACK MESSAGE\n" + jsonPrint(message)));
      return;
    }
  }
  catch(err){
    console.log(chalkAlert(MODULE_ID_PREFIX + " | *** slackSendWebMessage ERROR: " + err));
    throw err;
  }
}

async function initSlackWebClient(){
  try {

    const { WebClient } = require("@slack/client");
    slackWebClient = new WebClient(slackRtmToken);

    const conversationsListResponse = await slackWebClient.conversations.list({token: slackOAuthAccessToken});

    conversationsListResponse.channels.forEach(async function(channel){

      debug(chalkLog(MODULE_ID_PREFIX + " | SLACK CHANNEL | " + channel.id + " | " + channel.name));

      if (channel.name === slackChannel) {
        configuration.slackChannel = channel;

        const message = {
          token: slackOAuthAccessToken, 
          channel: configuration.slackChannel.id,
          text: "OP"
        };

        message.attachments = [];
        message.attachments.push({
          text: "INIT", 
          fields: [ 
            { title: "SRC", value: hostname + "_" + process.pid }, 
            { title: "MOD", value: MODULE_NAME }, 
            { title: "DST", value: "ALL" } 
          ]
        });

        await slackWebClient.chat.postMessage(message);
      }

      channelsHashMap.set(channel.id, channel);

    });

    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT SLACK WEB CLIENT ERROR: " + err));
    throw err;
  }
}

async function initSlackRtmClient(){

  const { RTMClient } = require("@slack/client");
  slackRtmClient = new RTMClient(slackRtmToken);

  await slackRtmClient.start();

  slackRtmClient.on("slack_event", async function(eventType, event){
    switch (eventType) {
      case "pong":
        debug(chalkLog(MODULE_ID_PREFIX + " | SLACK RTM PONG | " + getTimeStamp() + " | " + event.reply_to));
      break;
      default: debug(chalkInfo(MODULE_ID_PREFIX + " | SLACK RTM EVENT | " + getTimeStamp() + " | " + eventType + "\n" + jsonPrint(event)));
    }
  });
}

const autoFollowUserSet = new Set();
const verifiedCategorizedUsersSet = new Set();
const ignoreIpSet = new Set();

const ignoredHashtagRegex = new RegExp(/[^\u0000-\u007F]+/, "i");

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
const methodOverride = require("method-override");
const deepcopy = require("deep-copy");

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
let dbuChildReady = false;
statsObj.tfeChildReady = false;
statsObj.tssChildReady = false;

statsObj.hashtag = {};
statsObj.hashtag.manual = {};
statsObj.hashtag.manual.right = 0;
statsObj.hashtag.manual.left = 0;
statsObj.hashtag.manual.neutral = 0;
statsObj.hashtag.manual.positive = 0;
statsObj.hashtag.manual.negative = 0;
statsObj.hashtag.manual.none = 0;

statsObj.hashtag.auto = {};
statsObj.hashtag.auto.right = 0;
statsObj.hashtag.auto.left = 0;
statsObj.hashtag.auto.neutral = 0;
statsObj.hashtag.auto.positive = 0;
statsObj.hashtag.auto.negative = 0;
statsObj.hashtag.auto.none = 0;

statsObj.hashtag.total = 0;
statsObj.hashtag.categorizedTotal = 0;
statsObj.hashtag.categorizedManual = 0;
statsObj.hashtag.categorizedAuto = 0;

statsObj.hashtag.uncategorized = {};
statsObj.hashtag.uncategorized.all = 0;
statsObj.hashtag.uncategorized.left = 0;
statsObj.hashtag.uncategorized.right = 0;
statsObj.hashtag.uncategorized.neutral = 0;
statsObj.hashtag.uncategorized.positive = 0;
statsObj.hashtag.uncategorized.negative = 0;
statsObj.hashtag.uncategorized.none = 0;

statsObj.hashtag.uncategorizedTotal = 0;
statsObj.hashtag.uncategorizedManual = 0;
statsObj.hashtag.uncategorizedAuto = 0;
statsObj.hashtag.matched = 0;
statsObj.hashtag.mismatched = 0;

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
statsObj.user.autoFollow = 0;
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

statsObj.user.categoryVerified = 0;

let configuration = {};
let defaultConfiguration = {}; // general configuration
let hostConfiguration = {}; // host-specific configuration

configuration.slackChannel = {};

configuration.heartbeatInterval = process.env.WAS_HEARTBEAT_INTERVAL || ONE_MINUTE;
configuration.statsUpdateIntervalTime = process.env.WAS_STATS_UPDATE_INTERVAL || 10*ONE_MINUTE;
configuration.uncatUserCacheIntervalTime = process.env.WAS_UNCAT_USER_CACHE_INTERVAL || 15*ONE_MINUTE;
configuration.mismatchUserCacheIntervalTime = process.env.WAS_MISMATCH_USER_CACHE_INTERVAL || 15*ONE_MINUTE;

configuration.maxUserSearchSkipCount = DEFAULT_MAX_USER_SEARCH_SKIP_COUNT;
configuration.filterVerifiedUsers = true;
configuration.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
configuration.verbose = false;
configuration.userProfileOnlyFlag = DEFAULT_USER_PROFILE_ONLY_FLAG;
configuration.binaryMode = DEFAULT_BINARY_MODE;
configuration.ignoreCategoryRight = DEFAULT_IGNORE_CATEGORY_RIGHT;

configuration.maxQueue = DEFAULT_MAX_QUEUE;
let maxQueue = configuration.maxQueue;
let maxRxQueue = 0;
let tweetsReceived = 0;
let retweetsReceived = 0;
let quotedTweetsReceived = 0;
let duplicateTweetsReceived = 0;


configuration.filterDuplicateTweets = DEFAULT_FILTER_DUPLICATE_TWEETS;
configuration.filterRetweets = DEFAULT_FILTER_RETWEETS;

filterDuplicateTweets = configuration.filterDuplicateTweets;
filterRetweets = configuration.filterRetweets;

configuration.forceFollow = DEFAULT_FORCE_FOLLOW;
configuration.enableTwitterFollow = DEFAULT_ENABLE_TWITTER_FOLLOW;
configuration.autoFollow = DEFAULT_AUTO_FOLLOW;

configuration.mismatchUserCacheTtl = DEFAULT_MISMATCH_USER_ID_CACHE_DEFAULT_TTL;
configuration.mismatchUserCacheCheckPeriod = DEFAULT_MISMATCH_USER_ID_CACHE_CHECK_PERIOD;

configuration.uncatUserCacheTtl = DEFAULT_UNCAT_USER_ID_CACHE_DEFAULT_TTL;
configuration.uncatUserCacheCheckPeriod = DEFAULT_UNCAT_USER_ID_CACHE_CHECK_PERIOD;

configuration.enableLanguageAnalysis = DEFAULT_ENABLE_LANG_ANALYSIS;
configuration.forceLanguageAnalysis = DEFAULT_FORCE_LANG_ANALYSIS;

configuration.enableImageAnalysis = DEFAULT_ENABLE_IMAGE_ANALYSIS;
configuration.forceImageAnalysis = DEFAULT_FORCE_IMAGE_ANALYSIS;

configuration.enableGeoCode = DEFAULT_ENABLE_GEOCODE;
configuration.forceGeoCode = DEFAULT_FORCE_GEOCODE;

configuration.threeceeUser = DEFAULT_TWITTER_THREECEE_USER;
configuration.threeceeInfoUsersArray = DEFAULT_THREECEE_INFO_USERS;

configuration.dropboxWebhookChangeTimeout = DEFAULT_DROPBOX_WEBHOOK_CHANGE_TIMEOUT;

configuration.tssInterval = DEFAULT_TSS_TWITTER_QUEUE_INTERVAL;
configuration.tweetParserMessageRxQueueInterval = DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL;
configuration.tweetVersion2 = DEFAULT_TWEET_VERSION_2;
configuration.tweetParserInterval = DEFAULT_TWEET_PARSER_INTERVAL;
configuration.updateUserSetsInterval = DEFAULT_UPDATE_USER_SETS_INTERVAL;
configuration.sorterMessageRxQueueInterval = DEFAULT_SORTER_INTERVAL;
configuration.dbUserMissQueueInterval = DEFAULT_DB_USER_MISS_QUEUE_INTERVAL;
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
configuration.minFollowersAutoCategorize = DEFAULT_MIN_FOLLOWERS_AUTO_CATEGORIZE;
configuration.minFollowersAutoFollow = DEFAULT_MIN_FOLLOWERS_AUTO_FOLLOW;

configuration.threeceeUsers = [];
configuration.threeceeUsers = DEFAULT_THREECEE_USERS;
statsObj.currentThreeceeUser = configuration.threeceeUsers[0];

const threeceeUser = "altthreecee00";

const threeceeTwitter = {};
const threeceeInfoTwitter = {};

if (process.env.MIN_FOLLOWERS_AUTO_CATEGORIZE !== undefined) {
  configuration.minFollowersAutoCategorize = parseInt(process.env.MIN_FOLLOWERS_AUTO_CATEGORIZE);
}

if (process.env.MIN_FOLLOWERS_AUTO_FOLLOW !== undefined) {
  configuration.minFollowersAutoFollow = parseInt(process.env.MIN_FOLLOWERS_AUTO_FOLLOW);
}

if (process.env.NODE_METER_ENABLED !== undefined) {
  if (process.env.NODE_METER_ENABLED == "true") {
    configuration.metrics.nodeMeterEnabled = true;
  }
  else if (process.env.NODE_METER_ENABLED == "false") {
    configuration.metrics.nodeMeterEnabled = false;
  }
  else {
    configuration.metrics.nodeMeterEnabled = true;
  }
}

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

function quit(message) {

  statsObj.status = "QUITTING";

  console.log(chalkAlert("\nWAS | ... QUITTING ... " + getTimeStamp()));

  if (userSearchCursor !== undefined) { userSearchCursor.close(); }
  if (neuralNetworkChangeStream !== undefined) { neuralNetworkChangeStream.close(); }
  if (userChangeStream !== undefined) { userChangeStream.close(); }

  clearInterval(updateUserSetsInterval);
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
  clearInterval(dbUserMissQueueInterval);
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
  console.log(chalkAlert("WAS | QUIT MESSAGE: " + msg));

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

const ignoredHashtagFile = "ignoredHashtag.txt";
const ignoredUserFile = "ignoredUser.json";
const followableSearchTermFile = "followableSearchTerm.txt";
const uncatUserCacheFile = "uncatUserCache.json";

const pendingFollowSet = new Set();
// const followableUserSet = new Set();
const categorizeableUserSet = new Set();
let followableSearchTermSet = new Set();

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

// followableSearchTermSet.add("#maga");
// followableSearchTermSet.add("#kag");
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
  bannerImageUrl: 1,
  profileImageUrl: 1,
  category: 1,
  categoryAuto: 1,
  followersCount: 1,
  following: 1,
  friendsCount: 1,
  isTopTerm: 1,
  isTweetSource: 1,
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

const defaultTwitterUserScreenName = "threecee";

const followedUserSet = new Set();
const unfollowableUserSet = new Set();
let ignoredUserSet = new Set();
let ignoredHashtagSet = new Set();

process.title = "node_wordAssoServer";
console.log(chalkBlue("\n\nWAS | ============= START ==============\n\n"));

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

const categorizedManualUserSet = new Set();
const categorizedAutoUserSet = new Set();
const uncategorizedManualUserSet = new Set();
const uncategorizedAutoUserSet = new Set();

const matchUserSet = new Set();
const mismatchUserSet = new Set();

// ==================================================================
// DROPBOX
// ==================================================================
const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY;
const DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;

const configDefaultFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility/default");
const configHostFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility", hostname);
const configDefaultFile = "default_wordAssoServerConfig.json";
const configHostFile = hostname + "_wordAssoServerConfig.json";

// const statsDefaultFolder = path.join(DROPBOX_ROOT_FOLDER, "stats/default");
const statsHostFolder = path.join(DROPBOX_ROOT_FOLDER, "stats", hostname);
const statsFile = "wordAssoServerStats_" + moment().format(tinyDateTimeFormat) + ".json";

const twitterConfigFolder = path.join(DROPBOX_ROOT_FOLDER, "config/twitter");

const bestNetworkFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility/best/neuralNetworks");

const childPidFolderLocal = path.join(DROPBOX_ROOT_FOLDER, "config/utility", hostname, "children");

const dropboxConfigDefaultTrainingSetsFolder = path.join(configDefaultFolder, "trainingSets");
const trainingSetsUsersFolder = path.join(dropboxConfigDefaultTrainingSetsFolder, "users");

const testDataFolder = path.join(configDefaultFolder, "test/testData/tweets");

configuration.dropboxChangeFolderArray = [ 
  bestNetworkFolder, 
  configDefaultFolder, 
  configHostFolder, 
  twitterConfigFolder,
  trainingSetsUsersFolder
];

console.log(chalkLog("WAS | DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN));
console.log(chalkLog("WAS | DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY));
console.log(chalkLog("WAS | DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET));

const userDefaults = function (user){
  return user;
};

function printUserObj(title, u, chalkFormat) {

  const chlk = chalkFormat || chalkUser;

  const user = userDefaults(u);

  console.log(chlk(title
    + " | " + user.nodeId
    + " | @" + user.screenName
    + " | N " + user.name 
    // + " | LG " + user.lang
    + " | FC " + user.followersCount
    + " | FD " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | FW " + user.following 
    // + " | LC " + user.location
    + " | V " + user.categoryVerified + " M " + user.category + " A " + user.categoryAuto
    // + " | PRI " + user.priorityFlag
  ));
}

function printHashtag(params) {
  let text;
  const hashtag = params.hashtag;

  if (params.verbose) {
    return jsonPrint(params.hashtag);
  } 
  else {
    text = "#" + hashtag.nodeId
    + " | M  " + hashtag.mentions
    + " | LS " + getTimeStamp(hashtag.lastSeen)
    + " | C M " + hashtag.category + " A " + hashtag.categoryAuto;
    return text;
  }
}

function printUser(params) {
  const user = params.user;

  if (params.verbose) {
    return jsonPrint(params.user);
  } 
  else {
    const cat = (!user.category || user.category === undefined) ? "-" : user.category.charAt(0).toUpperCase();
    const catAuto = (!user.categoryAuto || user.categoryAuto === undefined) ? "-" : user.categoryAuto.charAt(0).toUpperCase();

    const text = user.nodeId
    + " | @" + user.screenName
    + " | " + user.name 
    + " | LG " + user.lang
    + " | FW " + user.followersCount
    + " | FD " + user.friendsCountf
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + getTimeStamp(user.lastSeen)
    + " | FWG " + user.following 
    + " | LC " + user.location
    + " | C M: " + cat + " A: " + catAuto;
    return text;
  }
}

async function connectDb(){

  try {

    statsObj.status = "CONNECTING MONGO DB";

    console.log(chalkBlueBold(MODULE_ID_PREFIX + " | CONNECT MONGO DB ..."));

    const db = await wordAssoDb.connect(MODULE_ID_PREFIX + "_" + process.pid);

    db.on("error", async function(err){
      statsObj.status = "MONGO ERROR";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION ERROR"));
      db.close();
      quit({cause: "MONGO DB ERROR: " + err});
    });

    db.on("close", async function(err){
      statsObj.status = "MONGO CLOSED";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION CLOSED"));
      quit({cause: "MONGO DB CLOSED: " + err});
    });

    db.on("disconnected", async function(){
      statsObj.status = "MONGO DISCONNECTED";
      statsObj.dbConnectionReady = false;
      console.log(chalkAlert(MODULE_ID_PREFIX + " | *** MONGO DB DISCONNECTED"));
      quit({cause: "MONGO DB DISCONNECTED"});
    });

    console.log(chalk.green(MODULE_ID_PREFIX + " | MONGOOSE DEFAULT CONNECTION OPEN"));

    statsObj.dbConnectionReady = true;

    return db;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECT ERROR: " + err));
    throw err;
  }
}

function initPassport(){

  return new Promise(function(resolve){

    const sessionId = btoa("threecee");
    console.log(chalk.green("WAS | PASSPORT SESSION ID: " + sessionId ));

    app.use(expressSession({
      sessionId: sessionId,
      secret: "three cee labs 47", 
      resave: false, 
      saveUninitialized: false,
      store: new MongoStore({ mongooseConnection: dbConnection })
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
          console.log(chalkAlert("WAS | *** NOT READY"
            + " | statsObj.dbConnectionReady: " + statsObj.dbConnectionReady
            + " | userServerControllerReady: " + userServerControllerReady
          ));
          return cb(new Error("userServerController not ready"), null);
        }

        userServerController.convertRawUser({user: rawUser}, function(err, user){

          if (err) {
            console.log(chalkError("WAS | *** UNCATEGORIZED USER | convertRawUser ERROR: " + err + "\nrawUser\n" + jsonPrint(rawUser)));
            return cb("RAW USER", rawUser);
          }

          printUserObj("WAS | MONGO DB | TWITTER AUTH USER", user);

          userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, async function(err, updatedUser){

            if (err) {
              console.log(chalkError("WAS | ***findOneUser ERROR: " + err));
              return cb(err);
            }

            if (configuration.verbose) {
              console.log(chalk.blue("WAS | UPDATED updatedUser"
                + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
                + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
                + "\nWAS | " + printUser({user: updatedUser})
              ));
            }


            if (configuration.threeceeInfoUsersArray.includes(updatedUser.screenName)) {
              threeceeInfoTwitter.twitterAuthorizationErrorFlag = false;
              threeceeInfoTwitter.twitterCredentialErrorFlag = false;
              threeceeInfoTwitter.twitterErrorFlag = false;
              threeceeInfoTwitter.twitterFollowLimit = false;
              threeceeInfoTwitter.twitterTokenErrorFlag = false;
            }
            else {
              threeceeTwitter.twitterAuthorizationErrorFlag = false;
              threeceeTwitter.twitterCredentialErrorFlag = false;
              threeceeTwitter.twitterErrorFlag = false;
              threeceeTwitter.twitterFollowLimit = false;
              threeceeTwitter.twitterTokenErrorFlag = false;

            }

            if (tssChild !== undefined) {
              tssChild.send({op: "USER_AUTHENTICATED", token: token, tokenSecret: tokenSecret,user: updatedUser});
            }

            adminNameSpace.emit("USER_AUTHENTICATED", updatedUser);
            viewNameSpace.emit("USER_AUTHENTICATED", updatedUser);

            slackText = "*USER_AUTHENTICATED | @" + updatedUser.screenName + "*";

            await slackSendWebMessage({ channel: slackChannelUserAuth, text: slackText});

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

    resolve();

  });
}

statsObj.dbConnectBusy = false;

function touchChildPidFile(params){

  const childPidFile = params.childId + "=" + params.pid;

  const folder = params.folder || childPidFolderLocal;

  shell.mkdir("-p", folder);

  const path = folder + "/" + childPidFile;

  touch.sync(path, { force: true });

  console.log(chalkBlue("WAS | TOUCH CHILD PID FILE: " + path));
}

// ==================================================================
// IP CACHE
// ==================================================================

let ipCacheTtl = process.env.IP_CACHE_DEFAULT_TTL;
if (empty(ipCacheTtl)) { ipCacheTtl = IP_CACHE_DEFAULT_TTL; }

console.log("WAS | IP CACHE TTL: " + ipCacheTtl + " SECONDS");

let ipCacheCheckPeriod = process.env.IP_CACHE_CHECK_PERIOD;
if (empty(ipCacheCheckPeriod)) { ipCacheCheckPeriod = IP_CACHE_CHECK_PERIOD; }

console.log("WAS | IP CACHE CHECK PERIOD: " + ipCacheCheckPeriod + " SECONDS");

const ipCache = new NodeCache({
  stdTTL: ipCacheTtl,
  checkperiod: ipCacheCheckPeriod
});

function ipCacheExpired(ip, ipObj) {

  statsObj.caches.ipCache.expired += 1;

  console.log(chalkInfo("WAS | XXX IP CACHE EXPIRED"
    + " [" + ipCache.getStats().keys + " KEYS]"
    + " | TTL: " + msToTime(ipCacheTtl*1000)
    + " | NOW: " + getTimeStamp()
    + " | $ EXPIRED: " + statsObj.caches.ipCache.expired
    + " | IN $: " + ipObj.timeStamp
    + " | IP: " + ip
    + " | DOMAIN" + ipObj.domainName
  ));
}

ipCache.on("expired", ipCacheExpired);

// ==================================================================
// UNCAT USER ID CACHE
// ==================================================================
console.log("WAS | UNCAT USER ID CACHE TTL: " + msToTime(configuration.uncatUserCacheTtl*1000));
console.log("WAS | UNCAT USER ID CACHE CHECK PERIOD: " + msToTime(configuration.uncatUserCacheCheckPeriod*1000));

const uncatUserCache = new NodeCache({
  stdTTL: configuration.uncatUserCacheTtl,
  checkperiod: configuration.uncatUserCacheCheckPeriod
});

function uncatUserCacheExpired(uncatUserId, uncatUserObj) {
  statsObj.caches.uncatUserCache.expired += 1;
  console.log(chalkInfo("WAS | XXX UNCAT USER CACHE EXPIRED"
    + " [" + uncatUserCache.getStats().keys + " KEYS]"
    + " | TTL: " + msToTime(configuration.uncatUserCacheTtl*1000)
    + " | NOW: " + getTimeStamp()
    + " | $ EXPIRED: " + statsObj.caches.uncatUserCache.expired
    + " | IN $: " + uncatUserObj.timeStamp
    + " | NID: " + uncatUserId
    + " | @" + uncatUserObj.screenName
  ));
}

uncatUserCache.on("expired", uncatUserCacheExpired);

// ==================================================================
// MISMATCH USER ID CACHE
// ==================================================================
console.log("WAS | MISMATCH USER ID CACHE TTL: " + msToTime(configuration.mismatchUserCacheTtl*1000));
console.log("WAS | MISMATCH USER ID CACHE CHECK PERIOD: " + msToTime(configuration.mismatchUserCacheCheckPeriod*1000));

const mismatchUserCache = new NodeCache({
  stdTTL: configuration.mismatchUserCacheTtl,
  checkperiod: configuration.mismatchUserCacheCheckPeriod
});

function mismatchUserCacheExpired(mismatchUserId, mismatchUserObj) {
  statsObj.caches.mismatchUserCache.expired += 1;
  console.log(chalkInfo("WAS | XXX MISMATCH USER CACHE EXPIRED"
    + " [" + mismatchUserCache.getStats().keys + " KEYS]"
    + " | TTL: " + msToTime(configuration.mismatchUserCacheTtl*1000)
    + " | NOW: " + getTimeStamp()
    + " | $ EXPIRED: " + statsObj.caches.mismatchUserCache.expired
    + " | IN $: " + mismatchUserObj.timeStamp
    + " | NID: " + mismatchUserId
    + " | @" + mismatchUserObj.screenName
  ));
}

mismatchUserCache.on("expired", mismatchUserCacheExpired);

// ==================================================================
// TWEET ID CACHE
// ==================================================================
let tweetIdCacheTtl = process.env.TWEET_ID_CACHE_DEFAULT_TTL;
if (empty(tweetIdCacheTtl)) { tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL; }

console.log("WAS | TWEET ID CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (empty(tweetIdCacheCheckPeriod)) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD; }

console.log("WAS | TWEET ID CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod
});

// ==================================================================
// VIEWER CACHE
// ==================================================================
let viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
if (empty(viewerCacheTtl)) { viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL; }

console.log("WAS | VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

let viewerCacheCheckPeriod = process.env.VIEWER_CACHE_CHECK_PERIOD;
if (empty(viewerCacheCheckPeriod)) { viewerCacheCheckPeriod = VIEWER_CACHE_CHECK_PERIOD; }

console.log("WAS | VIEWER CACHE CHECK PERIOD: " + viewerCacheCheckPeriod + " SECONDS");

const viewerCache = new NodeCache({
  stdTTL: viewerCacheTtl,
  checkperiod: viewerCacheCheckPeriod
});

function viewerCacheExpired(viewerCacheId, viewerObj) {

  console.log(chalkInfo("WAS | XXX VIEWER CACHE EXPIRED"
    + " [" + viewerCache.getStats().keys + " KEYS]"
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
if (empty(serverCacheTtl)) { serverCacheTtl = SERVER_CACHE_DEFAULT_TTL; }
console.log("WAS | SERVER CACHE TTL: " + serverCacheTtl + " SECONDS");

let serverCacheCheckPeriod = process.env.SERVER_CACHE_CHECK_PERIOD;
if (empty(serverCacheCheckPeriod)) { serverCacheCheckPeriod = SERVER_CACHE_CHECK_PERIOD; }
console.log("WAS | SERVER CACHE CHECK PERIOD: " + serverCacheCheckPeriod + " SECONDS");

const serverCache = new NodeCache({
  stdTTL: serverCacheTtl,
  checkperiod: serverCacheCheckPeriod
});

function serverCacheExpired(serverCacheId, serverObj) {

  console.log(chalkInfo("WAS | XXX SERVER CACHE EXPIRED"
    + " [" + serverCache.getStats().keys + " KEYS]"
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
if (empty(authenticatedSocketCacheTtl)) { 
  authenticatedSocketCacheTtl = AUTH_SOCKET_CACHE_DEFAULT_TTL;
}
console.log("WAS | AUTHENTICATED SOCKET CACHE TTL: " + authenticatedSocketCacheTtl + " SECONDS");

let authenticatedSocketCacheCheckPeriod = process.env.AUTH_SOCKET_CACHE_CHECK_PERIOD;
if (empty(authenticatedSocketCacheCheckPeriod)) {
  authenticatedSocketCacheCheckPeriod = AUTH_SOCKET_CACHE_CHECK_PERIOD;
}
console.log("WAS | AUTHENTICATED SOCKET CACHE CHECK PERIOD: " + authenticatedSocketCacheCheckPeriod + " SECONDS");

const authenticatedSocketCache = new NodeCache({
  stdTTL: authenticatedSocketCacheTtl,
  checkperiod: authenticatedSocketCacheCheckPeriod
});

function authenticatedSocketCacheExpired(socketId, authSocketObj) {

  console.log(chalkInfo("WAS | XXX AUTH SOCKET CACHE EXPIRED"
    + " [" + authenticatedSocketCache.getStats().keys + " KEYS]"
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

        if (authSocketObjCache !== undefined) {

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
if (empty(authenticatedTwitterUserCacheTtl)) { 
  authenticatedTwitterUserCacheTtl = AUTH_USER_CACHE_DEFAULT_TTL;
}
console.log("WAS | AUTHENTICATED TWITTER USER CACHE TTL: " + authenticatedTwitterUserCacheTtl + " SECONDS");

let authenticatedTwitterUserCacheCheckPeriod = process.env.AUTH_USER_CACHE_CHECK_PERIOD;
if (empty(authenticatedTwitterUserCacheCheckPeriod)) {
  authenticatedTwitterUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;
}
console.log("WAS | AUTHENTICATED TWITTERUSER CACHE CHECK PERIOD: " + authenticatedTwitterUserCacheCheckPeriod + " SECONDS");

const authenticatedTwitterUserCache = new NodeCache({
  stdTTL: authenticatedTwitterUserCacheTtl,
  checkperiod: authenticatedTwitterUserCacheCheckPeriod
});

function authenticatedTwitterUserCacheExpired(nodeId, userObj) {
  console.log(chalkInfo("WAS | XXX AUTH TWITTER USER CACHE EXPIRED"
    + " [" + authenticatedTwitterUserCache.getStats().keys + " KEYS]"
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
if (empty(authInProgressTwitterUserCacheTtl)) { 
  authInProgressTwitterUserCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;
}
console.log("WAS | AUTH IN PROGRESS CACHE TTL: " + authInProgressTwitterUserCacheTtl + " SECONDS");

let authInProgressTwitterUserCacheCheckPeriod = process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (empty(authInProgressTwitterUserCacheCheckPeriod)) { 
  authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
}
console.log("WAS | AUTH IN PROGRESS CACHE CHECK PERIOD: " + authInProgressTwitterUserCacheCheckPeriod + " SECONDS");

const authInProgressTwitterUserCache = new NodeCache({
  stdTTL: authInProgressTwitterUserCacheTtl,
  checkperiod: authInProgressTwitterUserCacheCheckPeriod
});

authInProgressTwitterUserCache.on("expired", function(nodeId, userObj){

  console.log(chalkInfo("WAS | XXX AUTH IN PROGRESS TWITTER USER CACHE EXPIRED"
    + " [" + authInProgressTwitterUserCache.getStats().keys + " KEYS]"
    + " | TTL: " + authInProgressTwitterUserCacheTtl + " SECS"
    + " | NODE ID: " + nodeId
    + " | userObj\n" + jsonPrint(userObj)
  ));

});

// ==================================================================
// NODE CACHE
// ==================================================================
let nodeCacheTtl = process.env.NODE_CACHE_DEFAULT_TTL;
if (empty(nodeCacheTtl)) { nodeCacheTtl = NODE_CACHE_DEFAULT_TTL; }
console.log("WAS | NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

let nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
if (empty(nodeCacheCheckPeriod)) { nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD; }
console.log("WAS | NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS");


const nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: nodeCacheCheckPeriod
});

const nodeCacheDeleteQueue = [];

function nodeCacheExpired(nodeObj, callback) {

  const nodeCacheId = nodeObj.nodeId;

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
if (empty(trendingCacheTtl)) { trendingCacheTtl = TRENDING_CACHE_DEFAULT_TTL; }
console.log("WAS | TRENDING CACHE TTL: " + trendingCacheTtl + " SECONDS");

// const trendingCache = new NodeCache({
//   stdTTL: trendingCacheTtl,
//   checkperiod: TRENDING_CACHE_CHECK_PERIOD
// });

let nodesPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;
if (empty(nodesPerMinuteTopTermTtl)) { nodesPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL; }
console.log("WAS | TOP TERMS WPM CACHE TTL: " + nodesPerMinuteTopTermTtl + " SECONDS");

let nodesPerMinuteTopTermCheckPeriod = process.env.TOPTERMS_CACHE_CHECK_PERIOD;
if (empty(nodesPerMinuteTopTermCheckPeriod)) {
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
cacheObj.mismatchUserCache = mismatchUserCache;
cacheObj.uncatUserCache = uncatUserCache;
cacheObj.nodeCache = nodeCache;
cacheObj.serverCache = serverCache;
cacheObj.viewerCache = viewerCache;
cacheObj.nodesPerMinuteTopTermCache = nodesPerMinuteTopTermCache;
cacheObj.nodesPerMinuteTopTermNodeTypeCache = {};
// cacheObj.trendingCache = trendingCache;
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
  "networkTechnology",
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

let tweetParserReady = false;

function initStats(callback){

  console.log(chalk.bold.black("WAS | INIT STATS"));

  statsObj.ioReady = false;
  statsObj.internetReady = false;
  statsObj.internetTestError = false;

  statsObj.dbConnectionReady = false;

  statsObj.tweetParserReady = false;
  tweetParserReady = false;

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

  statsObj.bestNetwork = {};
  statsObj.bestNetwork.networkTechnology = "";
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
  maxRxQueue = 0;

  statsObj.nodeMeterEntries = 0;
  statsObj.nodeMeterEntriesMax = 0;
  statsObj.nodeMeterEntriesMaxTime = moment().valueOf();

  childrenHashMap = {};

  statsObj.twitter = {};

  statsObj.twitter.tweetsReceived = 0;
  tweetsReceived = 0;

  statsObj.twitter.duplicateTweetsReceived = 0;
  duplicateTweetsReceived = 0;

  statsObj.twitter.retweetsReceived = 0;
  retweetsReceived = 0;

  statsObj.twitter.quotedTweetsReceived = 0;
  quotedTweetsReceived = 0;

  statsObj.twitter.tweetsPerMin = 0;
  statsObj.twitter.maxTweetsPerMin = 0;
  statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
  statsObj.twitter.aaSubs = {};

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

  statsObj.caches.ipCache = {};
  statsObj.caches.ipCache.stats = {};
  statsObj.caches.ipCache.stats.keys = 0;
  statsObj.caches.ipCache.stats.keysMax = 0;

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

  statsObj.caches.uncatUserCache = {};
  statsObj.caches.uncatUserCache.stats = {};
  statsObj.caches.uncatUserCache.stats.keys = 0;
  statsObj.caches.uncatUserCache.stats.keysMax = 0;
  statsObj.caches.uncatUserCache.expired = 0;

  statsObj.caches.mismatchUserCache = {};
  statsObj.caches.mismatchUserCache.stats = {};
  statsObj.caches.mismatchUserCache.stats.keys = 0;
  statsObj.caches.mismatchUserCache.stats.keysMax = 0;
  statsObj.caches.mismatchUserCache.expired = 0;

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

function showStats(options){

  statsObj.twitter.quotedTweetsReceived = quotedTweetsReceived;
  statsObj.twitter.retweetsReceived = retweetsReceived;
  statsObj.twitter.tweetsReceived = tweetsReceived;
  statsObj.twitter.duplicateTweetsReceived = duplicateTweetsReceived;
  statsObj.errors.twitter.maxRxQueue = maxRxQueue;

  statsObj.dbuChildReady = dbuChildReady;

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

async function loadMaxInputHashMap(p){

  const params = p || {};
  params.folder = params.folder || dropboxConfigDefaultTrainingSetsFolder;
  params.file = params.file || maxInputHashMapFile;

  try{
    const dataObj = await tcUtils.loadFileRetry(params);

    if (empty(dataObj.maxInputHashMap)) {
      console.log(chalkError("WAS | *** ERROR: loadMaxInputHashMap: loadFile: maxInputHashMap UNDEFINED"));
    }
    if (empty(dataObj.normalization)) {
      console.log(chalkError("WAS | *** ERROR: loadMaxInputHashMap: loadFile: normalization UNDEFINED"));
    }

    maxInputHashMap = dataObj.maxInputHashMap;
    normalization = dataObj.normalization;

    return;
  }
  catch(err){
    if (err.code == "ENOTFOUND") {
      console.log(chalkError("WAS | *** LOAD MAX INPUT: FILE NOT FOUND"
        + " | " + params.folder + "/" + params.file
      ));
    }
    throw err;
  }
}

let saveFileQueueInterval;
let saveFileBusy = false;

function initSaveFileQueue(cnf){

  return new Promise(function(resolve){

    console.log(chalk.bold.black("WAS | INIT DROPBOX SAVE FILE INTERVAL | " + msToTime(cnf.saveFileQueueInterval)));

    clearInterval(saveFileQueueInterval);

    saveFileQueueInterval = setInterval(async function () {

      if (!saveFileBusy && saveFileQueue.length > 0) {

        saveFileBusy = true;

        const saveFileObj = saveFileQueue.shift();

        try{
          await tcUtils.saveFile(saveFileObj);
          console.log(chalkInfo("WAS | SAVED FILE | " + saveFileObj.folder + "/" + saveFileObj.file));
          saveFileBusy = false;
        }
        catch(err){
          console.log(chalkError("WAS | *** SAVE FILE ERROR ... RETRY | " + saveFileObj.folder + "/" + saveFileObj.file));
          saveFileQueue.push(saveFileObj);
          saveFileBusy = false;
        }

      }

    }, cnf.saveFileQueueInterval);

    resolve();

  });
}

function killChild(params){

  return new Promise(function(resolve, reject){

    let pid;

    if (empty(params.pid) && empty(childrenHashMap[params.childId])) {
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

    if (!childPidFileNameArray || childPidFileNameArray.length == 0) {
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

      if ((childrenHashMap[childId] !== undefined) && (childrenHashMap[childId].pid == childPid)) {
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

        if (empty(childrenHashMap[childId])) {
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

async function killAll(){

  try{

    const childPidArray = await getChildProcesses({searchTerm: "ALL"});

    console.log(chalk.green("getChildProcesses childPidArray\n" + jsonPrint(childPidArray)));

    if (childPidArray && (childPidArray.length > 0)) {

      childPidArray.forEach(async function(childObj){

        try{
          await killChild({pid: childObj.pid});
          console.log(chalkAlert("WAS | XXX KILL ALL | KILLED | PID: " + childObj.pid + " | CH ID: " + childObj.childId));
        }
        catch(err){
          console.log(chalkError("WAS | *** KILL CHILD ERROR"
            + " | PID: " + childObj.pid
            + " | ERROR: " + err
          ));
          throw err;
        }
      });

      return childPidArray;
    }

    console.log(chalkBlue("WAS | XXX KILL ALL | NO CHILDREN"));
    return childPidArray;

  }
  catch(err){
    console.log(chalkError("WAS | *** killAll ERROR: " + err));
    throw err;
  }
}

process.on("unhandledRejection", function(err, promise) {
  console.trace("WAS | *** Unhandled rejection (promise: ", promise, ", reason: ", err, ").");
  quit("unhandledRejection");
  process.exit(1);
});

process.on("exit", async function processExit() {

  console.log(chalkAlert("\nWAS | MAIN PROCESS EXITING ...\n"));

  try{
    await killAll();
  }
  catch(err){
    console.log(chalkError("WAS | *** MAIN PROCESS EXIT ERROR: " + err));
  }
});

process.on("message", async function processMessageRx(msg) {

  if ((msg == "SIGINT") || (msg == "shutdown")) {

    console.log(chalkAlert("\nWAS | =============================\nWAS"
      + " | *** SHUTDOWN OR SIGINT ***\nWAS | =============================\n"
    ));

    clearInterval(internetCheckInterval);

    try{
      await tcUtils.saveFile({folder: statsHostFolder, statsFile: statsFile, obj: statsObj});
    }
    catch(err){
      console.log(chalkError("WAS | *** SAVE STATS ERROR: " + err));
    }

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

    case DEFAULT_TSS_CHILD_ID:

      console.log(chalkError("WAS | *** KILL TSS CHILD"));

      killChild({childId: DEFAULT_TSS_CHILD_ID}, async function(err){
        if (err){
          console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
        }
        else {
          await initTssChild({
            childId: DEFAULT_TSS_CHILD_ID,
            tweetVersion2: configuration.tweetVersion2,
            threeceeUser: childrenHashMap[DEFAULT_TSS_CHILD_ID].threeceeUser
          });
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

});

configEvents.on("INTERNET_READY", function internetReady() {

  console.log(chalkInfo(getTimeStamp() + " | SERVER_READY EVENT"));

  clearInterval(heartbeatInterval);

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

      if (err.code == "EADDRINUSE") {

        debug(chalkError("WAS | *** HTTP ADDRESS IN USE: " + config.port + " ... RETRYING..."));

        setTimeout(function serverErrorTimeout() {
          httpServer.listen(config.port, function serverErrorListen() {
            debug("WAS | LISTENING ON PORT " + config.port);
          });
        }, 5000);
      }
    });
      
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

      heartbeatObj.bestNetwork = statsObj.bestNetwork;

      tempAdminArray = adminHashMap.entries();
      heartbeatObj.admins = tempAdminArray;

      tempServerArray = [];

      async.each(serverCache.keys(), function(serverCacheKey, cb){

        const serverObj = serverCache.get(serverCacheKey);
        if (serverObj !== undefined) { tempServerArray.push([serverCacheKey, serverObj]); }
        cb();
        
      }, function(){
        heartbeatObj.servers = tempServerArray;
      });

      tempViewerArray = [];

      async.each(viewerCache.keys(), function(viewerCacheKey, cb){

        const viewerObj = viewerCache.get(viewerCacheKey);
        if (viewerObj !== undefined) { tempViewerArray.push([viewerCacheKey, viewerObj]); }
        cb();

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
        heartbeatObj.nodesPerMin = statsObj.nodesPerMin;
        heartbeatObj.maxNodesPerMin = statsObj.maxNodesPerMin;

        heartbeatObj.twitter.tweetsPerMin = statsObj.twitter.tweetsPerMin;
        heartbeatObj.twitter.maxTweetsPerMin = statsObj.twitter.maxTweetsPerMin;
        heartbeatObj.twitter.maxTweetsPerMinTime = statsObj.twitter.maxTweetsPerMinTime;

        viewNameSpace.volatile.emit("HEARTBEAT", heartbeatObj);

        const sObj = {};
        sObj.user = statsObj.user;
        sObj.bestNetwork = statsObj.bestNetwork;

        viewNameSpace.volatile.emit("STATS", sObj);

        heartbeatsSent += 1;
        if (heartbeatsSent % 60 == 0) { logHeartbeat(); }

      } 
      else {
        if (moment().seconds() % 10 == 0) {
          debug(chalkError("!!!! INTERNET DOWN?? !!!!! " 
            + getTimeStamp()
            + " | INTERNET READY: " + statsObj.internetReady
            + " | I/O READY: " + statsObj.ioReady
          ));
        }
      }
    }, configuration.heartbeatInterval);
  }

  initAppRouting(function initAppRoutingComplete() {
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

  console.log(chalk.green("WAS | >>> DB CONNECT EVENT"));

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

    uncatUserCacheInit: function(cb){

      initUncatUserCache().
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
      console.log(err);
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

  if (tfeChild !== undefined) {

    console.log(chalkBlue("WAS | >>> UPDATE TFE CHILD NETWORK"
      + " | " + getTimeStamp()
      + " | " + bestNetworkObj.networkId
    ));

    tfeChild.send({ op: "NETWORK", networkObj: bestNetworkObj }, function tfeNetwork(err){
      if (err) {
        console.log(chalkError("WAS | *** TFE CHILD SEND NETWORK ERROR"
          + " | " + err
        ));
      }
    });
  }

});

configEvents.on("NEW_MAX_INPUT_HASHMAP", function configEventDbConnect(){

  if (tfeChild !== undefined) {

    console.log(chalkBlue("WAS | UPDATE TFE CHILD MAX INPUT HASHMAP: " + Object.keys(maxInputHashMap)));

    tfeChild.send(
      { op: "MAX_INPUT_HASHMAP", maxInputHashMap: maxInputHashMap }, 
      function tfeMaxInputHashMap(err){
      if (err) {
        console.log(chalkError("WAS | *** TFE CHILD SEND MAX_INPUT_HASHMAP ERROR"
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

async function updateTwitterWebhook(){

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
    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** TWITTER WEBHOOK ERROR"
      + " | STATUS: " + err.statusCode
    ));
    console.log(err.error);
    return;
  }
}

async function getTwitterWebhooks(){

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

    console.log(chalkLog("WAS | GET TWITTER WEBHOOKS"));

    if (bodyJson.length > 0){

      for(const sub of bodyJson){

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

          await updateTwitterWebhook();
        }

        const url = "https://api.twitter.com/1.1/account_activity/all/dev/subscriptions/list.json";

        const optionsSub = {
          url: url,
          method: "GET",
          headers: {
            "authorization": "Bearer " + configuration.twitterBearerToken
          }    
        };

        const bodySub = await request(optionsSub);

        const aaSubs = JSON.parse(bodySub);

        // aaSubs
        //  ├─ environment: dev
        //  ├─ application_id: 15917082
        //  └─ subscriptions
        //     ├─ 0
        //     │  └─ user_id: 14607119
        //     └─ 1
        //        └─ user_id: 848591649575927810

        console.log(chalkTwitter("aaSubs"
          + "\n" + jsonPrint(aaSubs)
        ));

        if ((aaSubs.application_id == "15917082") && (aaSubs.subscriptions.length > 0)){
          statsObj.twitter.aaSubs = {};
          statsObj.twitter.aaSubs = aaSubs;
          console.log(chalkTwitter("WAS | +++ TWITTER ACCOUNT ACTIVITY SUBSCRIPTIONS"
            + "\n" + jsonPrint(statsObj.twitter.aaSubs)
          ));
        }
        else {
          console.log(chalkInfo("WAS | --- NO TWITTER ACCOUNT ACTIVITY SUBSCRIPTIONS"));
        }
      }

      return;

    }
    else {
      console.log(chalkAlert("WAS | ??? NO TWITTER WEBHOOKS"
      ));
      return;
    }
  }
  catch(err){
    console.log(chalkError("WAS | *** GET TWITTER WEBHOOKS ERROR: " + err));
    throw err;
  }
}

async function addTwitterAccountActivitySubscription(p){

  statsObj.status = "ADD TWITTER ACCOUNT ACTIVITY SUBSCRIPTION";

  const params = p || {};

  console.log(chalkTwitter("WAS | ... ADD ACCOUNT ACTIVITY SUBSCRIPTION | " + params.threeceeUser));

  params.threeceeUser = params.threeceeUser || "altthreecee00";

  if (!threeceeTwitter) {
    console.log(chalkError("WAS | *** ADD ACCOUNT ACTIVITY SUBSCRIPTION ERROR | UNDEFINED threeceeTwitter | " + params.threeceeUser));
    console.log("threeceeTwitter\n" + jsonPrint(threeceeTwitter));
    throw new Error("threeceeUser twitter configuration undefined");
  }

  if (!threeceeTwitter.twitterConfig) {
    console.log(chalkError("WAS | *** ADD ACCOUNT ACTIVITY SUBSCRIPTION ERROR | UNDEFINED threeceeTwitter.twitterConfig | " + params.threeceeUser));
    throw new Error("threeceeUser twitter configuration undefined");
  }


  const options = {
    url: "https://api.twitter.com/1.1/account_activity/all/dev/subscriptions.json",
    method: "POST",
    resolveWithFullResponse: true,
    headers: {
      "Content-type": "application/x-www-form-urlencoded"
    },      
    oauth: {
      consumer_key: threeceeTwitter.twitterConfig.consumer_key,
      consumer_secret: threeceeTwitter.twitterConfig.consumer_secret,
      token: threeceeTwitter.twitterConfig.token,
      token_secret: threeceeTwitter.twitterConfig.token_secret
    } 
  };

  console.log(chalkInfo("WAS | ADD TWITTER ACCOUNT ACTIVITY SUBSCRIPTION"));
  console.log(chalkLog("REQ OPTIONS\n" + jsonPrint(options)));

  try {

    const body = await request(options);

    console.log(chalk.green("WAS | +++ ADDED TWITTER ACCOUNT ACTIVITY SUBSCRIPTION"));
    console.log(body);

    return;
  }
  catch(e){

    const err = JSON.parse(e);

    console.log()

    if (err.errors && ((err.errors.code == 355) || (err.StatusCodeError == 409))) {
      console.log(chalkInfo("WAS | ... TWITTER ACCOUNT ACTIVITY SUBSCRIPTION ALREADY EXISTS"));
      return;
    }
    console.log(chalkError("WAS | *** ADD TWITTER ACCOUNT ACTIVITY SUBSCRIPTION ERROR: ", err));

    throw err;
  }
}

async function categorizeNode(categorizeObj) {

  if (categorizeObj.twitterUser && categorizeObj.twitterUser.nodeId) {

    const user = authenticatedTwitterUserCache.get(categorizeObj.twitterUser.nodeId);

    if ((user == undefined)
      && (categorizeObj.twitterUser.nodeId != "14607119") 
      && (categorizeObj.twitterUser.nodeId != "848591649575927810")) {

      console.log(chalkAlert("WAS | *** AUTH USER NOT IN CACHE\n" + jsonPrint(categorizeObj.twitterUser)));

      return categorizeObj.twitterUser;
    }
  }

  const cObj = {};
  cObj.manual = false;
  cObj.auto = false;

  let nCacheObj;

  const node = categorizeObj.node;
  const nodeId = categorizeObj.node.nodeId.toLowerCase();

  const query = {nodeId: nodeId};
  const update = {};
  const options = {new: true, upsert: true};

  switch (node.nodeType){

    case "user":

      cObj.manual = categorizeObj.category;

      if (categorizedUserHashMap.has(nodeId)){
        cObj.auto = categorizedUserHashMap.get(nodeId).auto || false;
      }

      update.category = categorizeObj.category;
      if (cObj.auto) { update.categoryAuto = cObj.auto; }

      categorizedHashtagHashMap.set(nodeId, cObj);

      nCacheObj = nodeCache.get(nodeId);

      if (nCacheObj !== undefined) {
        node.mentions = Math.max(node.mentions, nCacheObj.mentions);
        nCacheObj.mentions = node.mentions;
        nodeCache.set(nCacheObj.nodeId, nCacheObj);
        update.mentions = node.mentions;
      }

      if (!userServerControllerReady || !statsObj.dbConnectionReady) {
        console.log(chalkAlert("WAS | *** NOT READY"
          + " | statsObj.dbConnectionReady: " + statsObj.dbConnectionReady
          + " | userServerControllerReady: " + userServerControllerReady
        ));
        throw new Error("userServerController not ready");
      }

      try{

        const updatedUser = await wordAssoDb.User.findOneAndUpdate(query, update, options);

        if (categorizeObj.follow) {

          const updatedFollowUser = await follow({user: updatedUser, forceFollow: true});

          if (!updatedFollowUser) {
            console.log(chalkError("WAS | TWITTER FOLLOW ERROR: NULL UPDATED USER"));
            return;
          }

          categorizedUserHashMap.set(
            updatedFollowUser.nodeId, 
            { 
              nodeId: updatedFollowUser.nodeId, 
              screenName: updatedFollowUser.screenName, 
              manual: updatedFollowUser.category, 
              auto: updatedFollowUser.categoryAuto
            }
          );

          if (updatedFollowUser.category) { uncategorizedManualUserSet.delete(updatedFollowUser.nodeId); }
          if (updatedFollowUser.categoryAuto) { uncategorizedAutoUserSet.delete(updatedFollowUser.nodeId); }

          console.log(chalk.blue("WAS | +++ TWITTER_FOLLOW"
            + " | UID: " + updatedFollowUser.nodeId
            + " | @" + updatedFollowUser.screenName
          ));

          return updatedFollowUser;
        }
        else {

          categorizedUserHashMap.set(
            updatedUser.nodeId, 
            { 
              nodeId: updatedUser.nodeId, 
              screenName: updatedUser.screenName, 
              manual: updatedUser.category, 
              auto: updatedUser.categoryAuto
            }
          );

          if (updatedUser.category) { uncategorizedManualUserSet.delete(updatedUser.nodeId); }
          if (updatedUser.categoryAuto) { uncategorizedAutoUserSet.delete(updatedUser.nodeId); }

          return updatedUser;
        }
      }
      catch(err) {
        console.log(chalkError("WAS | *** USER UPDATE CATEGORY ERROR: " + err));
        throw err;
      }

    case "hashtag":

      cObj.manual = categorizeObj.category;

      update.category = categorizeObj.category;

      if (categorizedHashtagHashMap.has(nodeId)){
        cObj.auto = categorizedHashtagHashMap.get(nodeId).auto || false;
      }

      categorizedHashtagHashMap.set(nodeId, cObj);

      nCacheObj = nodeCache.get(nodeId);

      if (nCacheObj !== undefined) {
        node.mentions = Math.max(node.mentions, nCacheObj.mentions);
        nCacheObj.mentions = node.mentions;
        nodeCache.set(nCacheObj.nodeId, nCacheObj);
        update.mentions = node.mentions;
      }

      try{
        const updatedHashtag = await wordAssoDb.Hashtag.findOneAndUpdate(query, update, options);

        categorizedHashtagHashMap.set(
          updatedHashtag.nodeId, 
          { manual: updatedHashtag.category, auto: updatedHashtag.categoryAuto });

        return updatedHashtag;
      }
      catch(err){
        console.log(chalkError("WAS | *** HASHTAG UPDATE CATEGORY ERROR: " + err));
        throw err;
      }

    default:
      throw new Error("categorizeNode TYPE: " + node.isTopTermNodeType);
  }
}

let prevTweetUser;
let screenName;

function socketRxTweet(tw) {

  prevTweetUser = tweetIdCache.get(tw.id_str);

  if (prevTweetUser !== undefined) {
    duplicateTweetsReceived += 1;
    if (filterDuplicateTweets) { return; }
  }

  tweetIdCache.set(tw.id_str, tw.user.screen_name);

  tweetMeter.mark();

  tweetsReceived += 1;

  if (tw.retweeted_status && tw.retweeted_status !== undefined) {
    retweetsReceived += 1;
    if (filterRetweets) { return; }
  }

  if (tw.is_quote_status) {
    quotedTweetsReceived += 1;
    if (filterRetweets) { return; }
  }

  if (tweetRxQueue.length > maxQueue){
    maxRxQueue += 1;
  }
  else if (tw.user) {

    if (saveSampleTweetFlag) {

      saveSampleTweetFlag = false;
      const sampleTweetFileName = "sampleTweet_" + getTimeStamp() + ".json";

      console.log(chalkLog("WAS | SAVING SAMPLE TWEET"
        + " [" + tweetsReceived + " RXd]"
        + " | " + getTimeStamp()
        + " | " + tw.id_str
        + " | " + tw.user.id_str
        + " | @" + tw.user.screen_name
        + " | " + tw.user.name
        + " | " + sampleTweetFileName
      ));

      saveFileQueue.push({folder: testDataFolder, file: sampleTweetFileName, obj: tw});
    }

    screenName = tw.user.screen_name.toLowerCase();

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

    if (categorizedUserHashMap.has(screenName)){

      tw.user.category = categorizedUserHashMap.get(screenName).manual;
      tw.user.categoryAuto = categorizedUserHashMap.get(screenName).auto;
    }

    tweetRxQueue.push(tw);

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

async function follow(params) {

  if (!enableFollow(params)) { 

    console.log(chalkWarn("-X- FOLLOW | @" + params.user.screenName 
      + " | IN UNFOLLOWABLE, FOLLOWED or IGNORED USER SET"
    ));

    return;
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

  try{
    const userUpdated = await wordAssoDb.User.findOneAndUpdate(query, update, options);

    if (userUpdated){

      console.log(chalkLog("WAS | +++ FOLLOW"
        + " | " + printUser({user: userUpdated})
      ));

      if (configuration.enableTwitterFollow){

        if (tssChild !== undefined){
          tssChild.send({
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

      return userUpdated;

    }
    else {
      console.log(chalkLog("WAS | --- FOLLOW | USER NOT IN DB"
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
      ));

      return;
    }

  }
  catch(err) {
    console.log(chalkError("WAS | *** FOLLOW | USER FIND ONE ERROR: " + err));
  }
}

async function categoryVerified(params) {

  if (params.user.screenName !== undefined){

    console.log(chalk.blue("WAS | UPDATE CAT_VERFIED"
      + " | @" + params.user.screenName
      + " | CV: " + params.user.categoryVerified
      + " | C: " + params.user.category
      + " | CA: " + params.user.categoryAuto
    ));

    if (params.user.categoryVerified) {
      verifiedCategorizedUsersSet.add(params.user.screenName.toLowerCase());
    }
    else {
      verifiedCategorizedUsersSet.delete(params.user.screenName.toLowerCase());
    }

    const dbUser = await wordAssoDb.User.findOne({screenName: params.user.screenName.toLowerCase()});

    if (empty(dbUser)) {
      console.log(chalkWarn("WAS | ??? UPDATE VERIFIED | USER NOT FOUND: " + params.user.screenName.toLowerCase()));
      throw new Error("USER NOT FOUND");
    }

    dbUser.categoryVerified = params.user.categoryVerified;

    const dbUpdatedUser = await dbUser.save();

    printUserObj(
      "UPDATE DB USER | CAT VERIFIED [" + verifiedCategorizedUsersSet.size + "]",
      dbUpdatedUser, 
      chalkLog
    );

    return dbUpdatedUser;
  }
  else {
    throw new Error("USER SCREENNAME UNDEFINED");
  }
}

async function ignore(params) {

  console.log(chalk.blue("WAS | XXX IGNORE | @" + params.user.screenName));

  if (params.user.nodeId && (params.user.nodeId !== undefined)){
    ignoredUserSet.add(params.user.nodeId);
  }

  if (params.user.userId && (params.user.userId !== undefined)){
    ignoredUserSet.add(params.user.userId);
  }

  if (params.user.screenName && (params.user.screenName !== undefined)){
    ignoredUserSet.add(params.user.screenName);
  }

  tssChild.send({op: "IGNORE", user: params.user});

  try{
    const results = await wordAssoDb.User.deleteOne({nodeId: params.user.nodeId});

    if (results.deletedCount > 0){
      console.log(chalkAlert("WAS | XXX IGNORED USER | -*- DB HIT"
        + " | " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
    }
    else{
      console.log(chalkAlert("WAS | XXX IGNORED USER | --- DB MISS" 
        + " | " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
    }

    const obj = {};
    obj.userIds = [...ignoredUserSet];

    saveFileQueue.push({folder: configDefaultFolder, file: ignoredUserFile, obj: obj});

    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** DB DELETE IGNORED USER ERROR: " + err));
    throw err;
  }
}

async function unignore(params) {

  console.log(chalk.blue("WAS | +++ UNIGNORE | @" + params.user.screenName));

  if (params.user.nodeId !== undefined){
    ignoredUserSet.delete(params.user.nodeId);
  } 

  if (params.user.userId && (params.user.userId !== undefined)){
    ignoredUserSet.delete(params.user.userId);
  }

  const query = { nodeId: params.user.nodeId };

  const update = {};
  update.$set = { ignored: false };

  const options = {
    new: true,
    returnOriginal: false,
    upsert: false
  };

  wordAssoDb.User.findOneAndUpdate(query, update, options, function(err, userUpdated){

    if (err) {
      console.log(chalkError("WAS | *** UNIGNORE | USER FIND ONE ERROR: " + err));
      throw err;
    }
    
    if (userUpdated){
      console.log(chalkLog("WAS | +++ UNIGNORE"
        + " | " + printUser({user: userUpdated})
      ));
      return userUpdated;
    }

    console.log(chalkLog("WAS | --- UNIGNORE USER NOT IN DB"
      + " | ID: " + params.user.nodeId
    ));

    return;

  });
}

function unfollow(params, callback) {

  if (params.user.nodeId !== undefined){

    unfollowableUserSet.add(params.user.nodeId);
    followedUserSet.delete(params.user.nodeId);
    uncategorizedManualUserSet.delete(params.user.nodeId);

    if (params.ignored) {
      ignoredUserSet.add(params.user.nodeId);
    }
  } 

  tssChild.send({op: "UNFOLLOW", user: params.user});

  const query = { nodeId: params.user.nodeId, following: true };

  const update = {};
  update.$set = { following: false, threeceeFollowing: false };

  const options = {
    new: true,
    returnOriginal: false,
    upsert: false
  };

  wordAssoDb.User.findOneAndUpdate(query, update, options, function(err, userUpdated){

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

async function updateDbIgnoredHashtags(){

  statsObj.status = "UPDATE IGNORED HASHTAGS IN DB";

  console.log(chalkBlue("WAS | UPDATE IGNORED HASHTAGS DB" 
  ));

  [...ignoredHashtagSet].forEach(async function(hashtag){

    try {

        const dbHashtag = await wordAssoDb.Hashtag.findOne({nodeId: hashtag.toLowerCase()});

        if (empty(dbHashtag)) {
          console.log(chalkWarn("WAS | ??? UPDATE IGNORED | HASHTAG NOT FOUND: " + hashtag.toLowerCase()));
        }
        else {

          dbHashtag.ignored = true;

          const dbUpdatedHashtag = await dbHashtag.save();

          console.log(chalkLog("WAS | XXX IGNORE"
            + " [" + ignoredHashtagSet.size + "]"
            + " | " + printHashtag({hashtag: dbUpdatedHashtag})
          ));

        }
    }
    catch(err){
      console.log(chalkError("WAS | *** UPDATE IGNORED HASHTAG DB ERROR: " + err));
      return err;
    }

  });

  return;
}

async function initIgnoredHashtagSet(){

  statsObj.status = "INIT IGNORE HASHTAG SET";

  console.log(chalkLog("WAS | ... INIT IGNORE HASHTAG SET"));

  try{

    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: ignoredHashtagFile, 
      resolveOnNotFound: true
    });

    if (result) {
      ignoredHashtagSet = result;
      ignoredHashtagSet.delete("");
      ignoredHashtagSet.delete(" ");
      await updateDbIgnoredHashtags();
    }

    console.log(chalkLog("WAS | LOADED IGNORED HASHTAGS FILE"
      + " | " + ignoredHashtagSet.size + " HASHTAGS"
      + " | " + configDefaultFolder + "/" + ignoredHashtagFile
    ));

    return;

  }
  catch(err){
    console.log(chalkError("WAS | *** LOAD IGNORED HASHTAGS ERROR: " + err));
    throw err;
  }
}

async function initSetFromFile(params){

  statsObj.status = "INIT SET FROM FILE";

  console.log(chalkBlue("WAS | ... INIT SET FROM FILE: " + params.folder + "/" + params.file));

  try{

    const setObj = await tcUtils.loadFileRetry({folder: params.folder, file: params.file, resolveOnNotFound: params.resolveOnNotFound});

    if (empty(setObj)) {
     console.log(chalkAlert("WAS | ??? NO ITEMS IN FILE ERROR ???"
        + " | " + params.folder + "/" + params.file
      ));

      if (params.errorOnNoItems) {
        throw new Error("NO ITEMS IN FILE: " + params.folder + "/" + params.file); 
      }
      return;
    }

    let fileSet;

    if (params.objArrayKey) {
      fileSet = new Set(setObj[params.objArrayKey]);
    }
    else{
      const itemArray = setObj.toString().toLowerCase().split("\n");
      fileSet = new Set(itemArray);
    }

    console.log(chalkLog("WAS | LOADED SET FROM FILE"
      + " | OBJ ARRAY KEY: " + params.objArrayKey
      + " | " + fileSet.size + " ITEMS"
      + " | " + params.folder + "/" + params.file
    ));

    return fileSet;
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT SET FROM FILE ERROR: " + err));
    if (params.noErrorNotFound) {
      return;
    }
    throw err;
  }
}

function saveUncatUserCache(){

  statsObj.status = "SAVE UNCAT USER ID CACHE";

  const folder = (hostname === "google") ? configDefaultFolder : configHostFolder;

  console.log(chalkBlue("WAS | SAVE UNCAT USER CACHE: " + folder 
    + "/" + uncatUserCacheFile
  ));

  const uncatUserCacheObj = {};

  const uncatUserIdArray = uncatUserCache.keys();

  for(const userId of uncatUserIdArray){
    const uncatUserObj = uncatUserCache.get(userId);
    uncatUserCacheObj[userId] = uncatUserObj;
  }

  console.log(chalkLog("WAS | ... SAVING UNCAT USER CACHE FILE"
    + " | " + Object.keys(uncatUserCacheObj).length + " USERS"
    + " | " + folder + "/" + uncatUserCacheFile
  ));

  saveFileQueue.push({folder: folder, file: uncatUserCacheFile, obj: uncatUserCacheObj});

  return;
}

let uncatUserCacheInterval;

async function initUncatUserCache(){

  statsObj.status = "INIT UNCAT USER ID CACHE";

  const folder = (hostname === "google") ? configDefaultFolder : configHostFolder;

  console.log(chalkBlue("WAS | INIT UNCAT USER CACHE: " + folder 
    + "/" + uncatUserCacheFile
  ));

  try{

    const uncatUserCacheObj = await tcUtils.loadFileRetry({
      folder: folder, 
      file: uncatUserCacheFile,
      noErrorNotFound: true
    });

    if (!uncatUserCacheObj || uncatUserCacheObj == undefined) {
      console.log(chalkAlert("WAS | !!! UNCAT USER CACHE FILE NOT FOUND"
        + " | " + folder + "/" + uncatUserCacheFile
      ));
      return;
    }

    const uncatUserIdArray = Object.keys(uncatUserCacheObj);

    console.log(chalkLog("WAS | ... LOADING UNCAT USER CACHE FILE"
      + " | " + uncatUserIdArray.length + " USERS"
      + " | " + folder + "/" + uncatUserCacheFile
    ));

    for(const userId of uncatUserIdArray){
      uncatUserCacheObj[userId].timeStamp = getTimeStamp();
      uncatUserCache.set(
        userId, 
        uncatUserCacheObj[userId],
        configuration.uncatUserCacheTtl
      );
    }

    console.log(chalkLog("WAS | +++ LOADED UNCAT USER CACHE FILE"
      + " | " + uncatUserIdArray.length + " USERS"
      + " | " + folder + "/" + uncatUserCacheFile
      + " | $ EXPIRED: " + statsObj.caches.uncatUserCache.expired
      + "\nUNCAT USER $ STATS\n" + jsonPrint(uncatUserCache.getStats())
    ));

    clearInterval(uncatUserCacheInterval);

    uncatUserCacheInterval = setInterval(function(){
     saveUncatUserCache();
    }, configuration.uncatUserCacheIntervalTime);

    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT UNCAT USER CACHE ERROR: " + err));
    throw err;
  }
}

async function initFollowableSearchTermSet(){

  statsObj.status = "INIT FOLLOWABLE SEARCH TERM SET";

  console.log(chalkBlue("WAS | INIT FOLLOWABLE SEARCH TERM SET: " + configDefaultFolder 
    + "/" + followableSearchTermFile
  ));

  try{

    const result = await initSetFromFile({folder: configDefaultFolder, file: followableSearchTermFile, resolveOnNotFound: true});

    if (result) {
      followableSearchTermSet = result;
      followableSearchTermSet.delete("");
      followableSearchTermSet.delete(" ");
      followableSearchTermsArray = [...followableSearchTermSet];
    }

    console.log(chalkLog("WAS | LOADED FOLLOWABLE SEARCH TERMS FILE"
      + " | " + followableSearchTermSet.size + " SEARCH TERMS"
      + " | " + configDefaultFolder + "/" + followableSearchTermFile
    ));

    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
    throw err;
  }
}

async function initIgnoredUserSet(){

  statsObj.status = "INIT IGNORED USER SET";

  console.log(chalkBlue("WAS | INIT IGNORED USER SET: " + configDefaultFolder 
    + "/" + ignoredUserFile
  ));

  try{

    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: ignoredUserFile, 
      objArrayKey: "userIds", 
      resolveOnNotFound: true
    });

    if (result) {
      ignoredUserSet = result;
      ignoredUserSet.delete("");
      ignoredUserSet.delete(" ");
    }

    console.log(chalkLog("WAS | LOADED IGNORED USERS FILE"
      + " | " + ignoredUserSet.size + " USERS"
      + " | " + configDefaultFolder + "/" + ignoredUserFile
    ));

    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT IGNORED USERS SET ERROR: " + err));
    throw err;
  }
}

const serverRegex = /^(.+)_/i;

async function initSocketHandler(socketObj) {

  const socket = socketObj.socket;
  const socketId = socket.id;

  const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  try{
    const domainName = await dnsReverse({ipAddress: ipAddress});
    console.log(chalk.blue("WAS | SOCKET CONNECT"
      + " | " + ipAddress
      + " | DOMAIN: " + domainName
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
      statsObj.socket.errors.errorObj = errorObj;

      console.log(chalkError(getTimeStamp(timeStamp) 
        + " | SOCKET RECONNECT ERROR: " + socketId 
        + "\nerrorObj\n" + jsonPrint(errorObj)
      ));
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

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      statsObj.socket.errors.errors += 1;

      console.log(chalkError(getTimeStamp(timeStamp) 
        + " | *** SOCKET ERROR" + " | " + socketId + " | " + error));

      const currentServer = serverCache.get(socketId);

      if (currentServer !== undefined) { 

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

      if (currentViewer !== undefined) { 

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

      if (currentServer !== undefined) { 

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
      if (currentViewer !== undefined) { 
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

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      if (empty(keepAliveObj.user)) {
        console.log(chalkAlert("WAS | SESSION_KEEPALIVE USER UNDEFINED ??"
          + " | NSP: " + socket.nsp.name.toUpperCase()
          + " | " + socket.id
          + " | " + ipAddress
          + "\n" + jsonPrint(keepAliveObj)
        ));
        return;
      }

      const authSocketObj = authenticatedSocketCache.get(socket.id);

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


      if (empty(statsObj.utilities[keepAliveObj.user.userId])) {
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

          if (tempServerObj == undefined) { 

            sessionObj.ip = ipAddress;
            sessionObj.socketId = socket.id;
            sessionObj.type = currentSessionType;
            sessionObj.timeStamp = moment().valueOf();
            sessionObj.user = keepAliveObj.user;
            sessionObj.isAdmin = false;
            sessionObj.isServer = true;
            sessionObj.isViewer = false;
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

          if (tempViewerObj == undefined) { 

            sessionObj.socketId = socket.id;
            sessionObj.ip = ipAddress;
            sessionObj.type = currentSessionType;
            sessionObj.timeStamp = moment().valueOf();
            sessionObj.user = keepAliveObj.user;
            sessionObj.isAdmin = false;
            sessionObj.isServer = false;
            sessionObj.isViewer = true;
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

    socket.on("TWITTER_FOLLOW", async function(user) {

      if (empty(user)) {
        console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: NULL USER"));
        return;
      }

      const timeStamp = moment().valueOf();

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      console.log(chalkSocket("R< TWITTER_FOLLOW"
        + " | " + getTimeStamp(timeStamp)
        + " | " + ipAddress
        + " | " + socket.id
        + " | NID: " + user.nodeId
        + " | UID: " + user.userId
        + " | @" + user.screenName
      ));

      try{

        const updatedUser = await follow({user: user, forceFollow: true});

        if (!updatedUser) {
          console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: NULL UPDATED USER"));
        }
        else{
          console.log(chalk.blue("WAS | +++ TWITTER_FOLLOW"
            + " | " + ipAddress
            + " | " + socket.id
            + " | UID" + updatedUser.nodeId
            + " | @" + updatedUser.screenName
          ));
        }

      }
      catch(err) {
        console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: " + err));
        throw err;
      }
    });

    socket.on("TWITTER_UNFOLLOW", function(user) {

      const timeStamp = moment().valueOf();

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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

    socket.on("TWITTER_CATEGORY_VERIFIED", async function(user) {

      const timeStamp = moment().valueOf();

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      console.log(chalkSocket("R< TWITTER_CATEGORY_VERIFIED"
        + " | " + getTimeStamp(timeStamp)
        + " | " + ipAddress
        + " | " + socket.id
        + " | UID: " + user.userId
        + " | @" + user.screenName
      ));

      try{

        user.categoryVerified = true;

        const updatedUser = await categoryVerified({user: user});

        if (!updatedUser) { return; }

        adminNameSpace.emit("CAT_VERFIED", updatedUser);
        utilNameSpace.emit("CAT_VERFIED", updatedUser);

        console.log(chalk.blue("WAS | +++ TWITTER_CATEGORY_VERIFIED"
          + " | SID: " + socket.id
          + " | UID" + updatedUser.nodeId
          + " | @" + updatedUser.screenName
          + " | C M: " + updatedUser.category + " A: " + updatedUser.categoryAuto
        ));
      }
      catch(err){
        console.log(chalkError("WAS | TWITTER_CATEGORY_VERIFIED ERROR: " + err));
      }
    });

    socket.on("TWITTER_CATEGORY_UNVERIFIED", async function(user) {

      const timeStamp = moment().valueOf();

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      console.log(chalkSocket("R< TWITTER_CATEGORY_UNVERIFIED"
        + " | " + getTimeStamp(timeStamp)
        + " | " + ipAddress
        + " | " + socket.id
        + " | UID: " + user.userId
        + " | @" + user.screenName
      ));

      try{

        user.categoryVerified = false;

        const updatedUser = await categoryVerified({user: user});

        if (!updatedUser) { return; }

        adminNameSpace.emit("CAT_UNVERFIED", updatedUser);
        utilNameSpace.emit("CAT_UNVERFIED", updatedUser);

        console.log(chalk.blue("WAS | --- TWITTER_CATEGORY_UNVERIFIED"
          + " | SID: " + socket.id
          + " | UID" + updatedUser.nodeId
          + " | @" + updatedUser.screenName
        ));
      }
      catch(err){
        console.log(chalkError("WAS | TWITTER_CATEGORY_VERIFIED ERROR: " + err));
      }
    });

    socket.on("TWITTER_IGNORE", async function(user) {

      try{

        const timeStamp = moment().valueOf();

        // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

        console.log(chalkSocket("R< TWITTER_IGNORE"
          + " | " + getTimeStamp(timeStamp)
          + " | " + ipAddress
          + " | " + socket.id
          + " | UID: " + user.userId
          + " | @" + user.screenName
        ));

        const updatedUser = await ignore({user: user, socketId: socket.id});

        if (!updatedUser) { return; }

        adminNameSpace.emit("IGNORE", updatedUser);
        utilNameSpace.emit("IGNORE", updatedUser);

        console.log(chalk.blue("WAS | XXX TWITTER_IGNORE"
          + " | SID: " + socket.id
          + " | UID" + updatedUser.nodeId
          + " | @" + updatedUser.screenName
        ));
      }
      catch(err){
        console.log(chalkError("WAS | *** IGNORE USER ERROR: " + err));
      }
    });

    socket.on("TWITTER_UNIGNORE", async function(user) {

      try{

        const timeStamp = moment().valueOf();

        // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

        console.log(chalkSocket("R< TWITTER_UNIGNORE"
          + " | " + getTimeStamp(timeStamp)
          + " | " + ipAddress
          + " | " + socket.id
          + " | UID: " + user.userId
          + " | @" + user.screenName
        ));

        const updatedUser = await unignore({user: user, socketId: socket.id});
        
        if (!updatedUser) { return; }

        adminNameSpace.emit("UNIGNORE", updatedUser);
        utilNameSpace.emit("UNIGNORE", updatedUser);

        console.log(chalk.blue("WAS | +++ TWITTER_UNIGNORE"
          + " | SID: " + socket.id
          + " | UID" + updatedUser.nodeId
          + " | @" + updatedUser.screenName
        ));

      }
      catch(err){
        console.log(chalkError("WAS | TWITTER_UNIGNORE ERROR: " + err));
        throw err;
      }
    });

    socket.on("TWITTER_SEARCH_NODE", function (sn) {

      const timeStamp = moment().valueOf();

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      if (dataObj.node.nodeType == "user") {
        console.log(chalkSocket("TWITTER_CATEGORIZE_NODE"
          + " | " + getTimeStamp(timeStamp)
          + " | " + ipAddress
          + " | " + socket.id
          + " | @" + dataObj.node.screenName
          + " | CAT: " + dataObj.category
          + " | FOLLOW: " + dataObj.follow
        ));
      }
      if (dataObj.node.nodeType == "hashtag") {
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
          if (updatedNodeObj.nodeType == "user") {

            console.log(chalkSocket("TX> SET_USER"
              + " | " + printUser({user: updatedNodeObj})
            ));
          }
          if (updatedNodeObj.nodeType == "hashtag") {
            socket.emit("SET_TWITTER_HASHTAG", {hashtag: updatedNodeObj, stats: statsObj.hashtag });
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

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

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

    socket.on("VIEWER_READY", async function viewerReady(viewerObj) {

      const timeStamp = moment().valueOf();

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      console.log(chalkSocket("VIEWER READY"
        + " | " + getTimeStamp(timeStamp)
        + " | " + ipAddress
        + " | " + socket.id
        + " | " + viewerObj.viewerId
        + " | SENT AT " + getTimeStamp(parseInt(viewerObj.timeStamp))
      ));

      if (!userServerControllerReady || !statsObj.dbConnectionReady) {
        console.log(chalkAlert("WAS | *** NOT READY"
          + " | statsObj.dbConnectionReady: " + statsObj.dbConnectionReady
          + " | userServerControllerReady: " + userServerControllerReady
        ));
        // console.log(chalkError("WAS | *** userServerController OR dbConnection NOT READY ERROR"));
      }
      else{
        try{
          const user = await wordAssoDb.User.findOne({screenName: defaultTwitterUserScreenName});

          if (user) {
            socket.emit("SET_TWITTER_USER", {user: user, stats: statsObj.user });
          }

          socket.emit("VIEWER_READY_ACK", 
            {
              nodeId: viewerObj.viewerId,
              timeStamp: moment().valueOf(),
              viewerSessionKey: moment().valueOf()
            }
          );

        }
        catch(err){
          console.log(chalkError("WAS | *** ERROR | VIEWER READY FIND USER"
            + " | " + getTimeStamp(timeStamp)
            + " | " + ipAddress
            + " | " + socket.id
            + " | " + viewerObj.viewerId
            + " | ERROR: " + err
          ));
        }

      }
    });

    socket.on("categorize", categorizeNode);

    socket.on("login", async function socketLogin(viewerObj){

      viewerObj.timeStamp = moment().valueOf();

      console.log(chalkAlert("WAS | LOGIN"
        + " | " + socket.id
        + " | IP: " + ipAddress
        + " | DOMAIN: " + domainName
        + "\n" + jsonPrint(viewerObj)
      ));

      slackText = "*LOADING PAGE | TWITTER LOGIN*";
      slackText = slackText + " | IP: " + ipAddress;
      slackText = slackText + " | DOMAIN: " + domainName;
      slackText = slackText + " | @" + viewerObj.screenName;

      await slackSendWebMessage({ channel: slackChannel, text: slackText});

      authInProgressTwitterUserCache.set(viewerObj.nodeId, viewerObj);
    });

    socket.on("STATS", function socketStats(statsObj){

      // ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      const serverObj = serverCache.get(socket.id);
      const viewerObj = viewerCache.get(socket.id);

      if (serverObj !== undefined) {

        serverObj.status = "STATS";
        serverObj.stats = statsObj;
        serverObj.timeStamp = moment().valueOf();

        serverCache.set(socket.id, serverObj);

        if (configuration.verbose) {
          console.log(chalkSocket("R< STATS | " + serverObj.user.userId));
        }

        adminNameSpace.emit("SERVER_STATS", serverObj);
      }

      if (viewerObj !== undefined) {

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
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** initSocketHandler DNS REVERSE ERROR: " + err));
  }

}

async function initSocketNamespaces(){

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

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);

      if (authenticatedSocketObj !== undefined){
        console.log(chalkAlert("WAS | ADMIN ALREADY AUTHENTICATED"
          + " | " + socket.id
          + " | " + authenticatedSocketObj.ipAddress
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }
      else {
        socket.on("authentication", async function(data) {

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

          await initSocketHandler({namespace: "admin", socket: socket});

          socket.emit("authenticated", true);

        });
      }
    });

    utilNameSpace.on("connect", function utilConnect(socket) {

      console.log(chalk.blue("WAS | UTIL CONNECT " + socket.id));

      const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);
      if (authenticatedSocketObj !== undefined){
        console.log(chalkAlert("WAS | UTIL ALREADY AUTHENTICATED"
          + " | " + socket.id
          + " | " + authenticatedSocketObj.ipAddress
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }
      else {
        socket.on("authentication", async function(data) {

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

          await initSocketHandler({namespace: "util", socket: socket});

          socket.emit("authenticated", true);

        });
      }
    });

    userNameSpace.on("connect", async function userConnect(socket) {

      console.log(chalk.blue("WAS | USER CONNECT " + socket.id));

      // const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);
      if (authenticatedSocketObj !== undefined){
        console.log(chalkAlert("WAS | USER ALREADY AUTHENTICATED"
          + " | " + socket.id
          + " | " + authenticatedSocketObj.ipAddress
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }

      await initSocketHandler({namespace: "user", socket: socket});
    });

    viewNameSpace.on("connect", function viewConnect(socket) {

      const ipAddress = socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

      console.log(chalk.blue("WAS | VIEWER CONNECT " + socket.id));

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);
      if (authenticatedSocketObj !== undefined){
        console.log(chalkAlert("WAS | VIEWER ALREADY AUTHENTICATED"
          + " | " + socket.id
          + " | " + authenticatedSocketObj.ipAddress
          + "\n" + jsonPrint(authenticatedSocketObj)
        ));
      }
      else {
        socket.on("authentication", async function(data) {

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

          await initSocketHandler({namespace: "view", socket: socket});

          socket.emit("authenticated", true);

        });
      }
    });

    statsObj.ioReady = true;

    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** INIT SOCKET NAME SPACES ERROR: " + err));
    throw err;
  }
}

function processCheckCategory(nodeObj){

  return new Promise(function(resolve, reject){

    let categorizedNodeHashMap;

    switch (nodeObj.nodeType) {

      case "hashtag":
        categorizedNodeHashMap = categorizedHashtagHashMap;
      break;

      case "user":
        categorizedNodeHashMap = categorizedUserHashMap;
      break;

      default:
        return reject(new Error("NO CATEGORY HASHMAP: " + nodeObj.nodeType));
    }

    if (categorizedNodeHashMap.has(nodeObj.nodeId)) {

      nodeObj.category = categorizedNodeHashMap.get(nodeObj.nodeId).manual;
      nodeObj.categoryAuto = categorizedNodeHashMap.get(nodeObj.nodeId).auto;

      async.parallel({
        overall: function(cb){
          const nodeRate = nodesPerMinuteTopTermCache.get(nodeObj.nodeId);
          if (nodeRate !== undefined) {
            nodeObj.isTopTerm = true;
          }
          else {
            nodeObj.isTopTerm = false;
          }

          cb();

        },
        nodeType: function(cb){
          const nodeRate = nodesPerMinuteTopTermNodeTypeCache[nodeObj.nodeType].get(nodeObj.nodeId);
          if (nodeRate !== undefined) {
            nodeObj.isTopTermNodeType = true;
          }
          else {
            nodeObj.isTopTermNodeType = false;
          }
          cb();
        }
      },
      function(err){
        if (err) {
          console.log(chalkError("WAS | *** processCheckCategory ERROR: " + err));
          return reject(err);
        }
        resolve(nodeObj);
      });   
    }
    else {
      resolve(nodeObj);
    }

  });
}

async function checkCategory(nodeObj) {

  // debugCategory(chalkLog("checkCategory"
  //   + " | " + nodeObj.nodeType
  //   + " | " + nodeObj.nodeId
  //   + " | CAT: " + nodeObj.category
  //   + " | CATA: " + nodeObj.categoryAuto
  // ));

  switch (nodeObj.nodeType) {

    case "hashtag":
    case "user":

      const updatedNodeObj = await processCheckCategory(nodeObj);
      return updatedNodeObj;

    case "tweet":
    case "emoji":
    case "media":
    case "url":
    case "place":
    case "word":
      return nodeObj;

    default:
      console.log(chalk.blue("WAS | DEFAULT | checkCategory\n" + jsonPrint(nodeObj)));
      return nodeObj;
  }

}

async function updateNodeMeter(node){

  const nodeType = node.nodeType;

  if (!configuration.metrics.nodeMeterEnabled) { return node; }

  if (empty(node.nodeId)) {
    console.log(chalkError("WAS | NODE ID UNDEFINED\n" + jsonPrint(node)));
    throw new Error("NODE ID UNDEFINED", node);
  }

  const nodeObj = pick(node, ["nodeId", "nodeType", "isServer", "isIgnored", "rate", "mentions"]);

  const meterNodeId = nodeObj.nodeId;

  if (empty(nodeMeterType[nodeType])) {
    nodeMeterType[nodeType] = {};
    nodeMeterType[nodeType][meterNodeId] = {};
  }

  if (empty(nodeMeterType[nodeType][meterNodeId])) {
    nodeMeterType[nodeType][meterNodeId] = {};
  }


  if (ignoreWordHashMap.has(meterNodeId)) {

    // debug(chalkLog("updateNodeMeter IGNORE " + meterNodeId));

    nodeObj.isIgnored = true;
    node.isIgnored = true;

    nodeMeter[meterNodeId] = null;
    nodeMeterType[nodeType][meterNodeId] = null;

    delete nodeMeter[meterNodeId];
    delete nodeMeterType[nodeType][meterNodeId];

    return node;
  }
  else {
    if ((/TSS_/).test(meterNodeId) || nodeObj.isServer){
      return node;
    }
    else if (empty(nodeMeter[meterNodeId])){

      nodeMeter[meterNodeId] = new Measured.Meter({rateUnit: 60000});
      nodeMeterType[nodeType][meterNodeId] = new Measured.Meter({rateUnit: 60000});

      nodeMeter[meterNodeId].mark();
      nodeMeterType[nodeType][meterNodeId].mark();
      globalNodeMeter.mark();
      
      nodeObj.rate = parseFloat(nodeMeter[meterNodeId].toJSON()[metricsRate]);
      nodeObj.mentions = nodeObj.mentions ? nodeObj.mentions+1 : 1;

      node.rate = nodeObj.rate;
      node.mentions = nodeObj.mentions;

      nodeCache.set(meterNodeId, nodeObj);

      return node;
    }
    else {

      nodeMeter[meterNodeId].mark();
      globalNodeMeter.mark();

      if (empty(nodeMeterType[nodeType][meterNodeId])){
        nodeMeterType[nodeType][meterNodeId] = new Measured.Meter({rateUnit: 60000});
      }

      nodeObj.rate = parseFloat(nodeMeter[meterNodeId].toJSON()[metricsRate]);
      node.rate = nodeObj.rate;

      const nCacheObj = nodeCache.get(meterNodeId);

      if (nCacheObj !== undefined) {
        nodeObj.mentions = Math.max(nodeObj.mentions, nCacheObj.mentions);
      }

      nodeObj.mentions = nodeObj.mentions ? nodeObj.mentions+1 : 1;
      node.mentions = nodeObj.mentions;

      nodeCache.set(meterNodeId, nodeObj);

      return node;
    }
  }
}

let transmitNodeQueueReady = true;
let transmitNodeQueueInterval;
const transmitNodeQueue = [];

function followable(text){

  return new Promise(function(resolve){

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

async function userCategorizeable(user){

  if (user.nodeType != "user") { 
    return false; 
  }

  if (user.following && (user.following !== undefined)) { 
    unfollowableUserSet.delete(user.nodeId);
    return true; 
  }

  if (user.ignored && (user.ignored !== undefined)) { 
    ignoredUserSet.add(user.nodeId);
    return false; 
  }

  if (ignoredUserSet.has(user.nodeId) || ignoredUserSet.has(user.screenName.toLowerCase())) { 
    return false; 
  }

  if (unfollowableUserSet.has(user.nodeId)) { 
    return false;
  }

  if (user.lang && (user.lang !== undefined) && (user.lang != "en")) { 
    categorizeableUserSet.delete(user.nodeId);
    return false;
  }

  if (ignoreLocationsRegEx
    && (ignoreLocationsRegEx !== undefined) 
    && user.location 
    && (user.location !== undefined) 
    && !allowLocationsRegEx.test(user.location)
    && ignoreLocationsRegEx.test(user.location)){
    
    ignoredUserSet.add(user.nodeId);

    return false;
  }
  
  if (user.followersCount && (user.followersCount !== undefined) 
    && (user.followersCount < configuration.minFollowersAutoCategorize)) { 
    unfollowableUserSet.add(user.nodeId);
    return false;
  }

  // if (!user.ignored || (user.ignored === undefined)){

    if (!user.description || (user.description === undefined)) { user.description = ""; }
    if (!user.screenName || (user.screenName === undefined)) { user.screenName = ""; }
    if (!user.name || (user.name === undefined)) { user.name = ""; }

    hitSearchTerm = await followable(user.description);

    if (hitSearchTerm) { 
      categorizeableUserSet.add(user.nodeId);
      ignoredUserSet.delete(user.nodeId);
      unfollowableUserSet.delete(user.nodeId);
      return true; 
    }

    hitSearchTerm = await followable(user.screenName);

    if (hitSearchTerm) { 
      categorizeableUserSet.add(user.nodeId);
      ignoredUserSet.delete(user.nodeId);
      unfollowableUserSet.delete(user.nodeId);
      return true; 
    }

    hitSearchTerm = await followable(user.name);

    if (hitSearchTerm) { 
      categorizeableUserSet.add(user.nodeId);
      ignoredUserSet.delete(user.nodeId);
      unfollowableUserSet.delete(user.nodeId);
      return true; 
    }

    categorizeableUserSet.delete(user.nodeId);
    return false;
  // }

  // categorizeableUserSet.delete(user.nodeId);
  // return false;
}

async function initAllowLocations(){

  statsObj.status = "INIT ALLOW LOCATIONS SET";

  console.log(chalkTwitter("WAS | INIT ALLOW LOCATIONS"));

  try{
    const data = await tcUtils.loadFileRetry({folder: configDefaultFolder, file: "allowLocations.txt"}); 

    if (empty(data)){
      console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
        + " | " + configDefaultFolder + "/" + "allowLocations.txt"
      ));
      throw new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED");
    }

    // debug(chalkInfo("WAS | DROPBOX ALLOW LOCATIONS FILE\n" + jsonPrint(data)));

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

    return;
  }
  catch(e){
    console.log(chalkError("TSS | LOAD FILE ERROR\n" + e));
    throw e;
  }
}

async function initIgnoreLocations(){

  statsObj.status = "INIT IGNORE LOCATIONS SET";

  console.log(chalkTwitter("WAS | INIT IGNORE LOCATIONS"));

  try{
    const data = await tcUtils.loadFileRetry({folder: configDefaultFolder, file: "ignoreLocations.txt"}); 

    if (empty(data)){
      console.log(chalkError("WAS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
        + " | " + configDefaultFolder + "/" + "ignoreLocations.txt"
      ));
      throw new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED");
    }

    // debug(chalkInfo("WAS | DROPBOX IGNORE LOCATIONS FILE\n" + jsonPrint(data)));

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

    return;
  }
  catch(e){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** LOAD FILE ERROR\n" + e));
    throw e;
  }
}

async function countDocuments(params){

  try{

    const documentType = params.documentType;
    const query = params.query;

    const documentCollection = dbConnection.collection(documentType);

    console.log(chalkLog(MODULE_ID_PREFIX + " | ... COUNTING DOCUMENTS: TYPE: " + documentType));

    const count = await documentCollection.countDocuments(query);
    return count;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** DB COUNT DOCUMENTS ERROR\n" + err));
    throw err;
  }
}

async function addMismatchUserSet(params){

  if (!mismatchUserSet.has(params.user.nodeId) && (params.user.category !== params.user.categoryAuto)) {

    const mismatchUserObj = await mismatchUserCache.get(params.user.nodeId);

    if (configuration.filterVerifiedUsers && verifiedCategorizedUsersSet.has(params.user.screenName)){
      mismatchUserSet.delete(params.user.nodeId);
    }
    else if (mismatchUserObj === undefined) {
      mismatchUserSet.add(params.user.nodeId);
    }

    matchUserSet.delete(params.user.nodeId); 

    if ((mismatchUserSet.size > 0) && (mismatchUserSet.size % 100 == 0)) {
      printUserObj("MISMATCHED USER [" + mismatchUserSet.size + "] | VCU: " + verifiedCategorizedUsersSet.has(params.user.screenName), params.user);
    }

    return;
  }
  else {
    return;
  }
}

async function updateUserSets(){

  statsObj.status = "UPDATE USER SETS";

  let calledBack = false;

  if (!statsObj.dbConnectionReady) {
    console.log(chalkAlert("WAS | ABORT updateUserSets: DB CONNECTION NOT READY"));
    calledBack = true;
    throw new Error("DB CONNECTION NOT READY");
  }

  await wordAssoDb.User.deleteMany({ "$and": [ {lang: { "$nin": [ false, null ] } }, { lang: { "$ne": "en" } } ]} );

  statsObj.user.total = await countDocuments({documentType: "users", query: {}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | GRAND TOTAL USERS: " + statsObj.user.total));

  statsObj.user.following = await countDocuments({documentType: "users", query: {"following": true}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | FOLLOWING USERS: " + statsObj.user.following));

  statsObj.user.notFollowing = await countDocuments({documentType: "users", query: {"following": false}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | NOT FOLLOWING USERS: " + statsObj.user.notFollowing));

  statsObj.user.ignored = await countDocuments({documentType: "users", query: {"ignored": true}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | IGNORED USERS: " + statsObj.user.ignored));

  statsObj.user.categoryVerified = await countDocuments({documentType: "users", query: {"categoryVerified": true}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | CAT VERIFIED USERS: " + statsObj.user.categoryVerified));

  statsObj.user.categorizedManual = await countDocuments({documentType: "users", query: {category: { "$nin": [false, "false", null] }}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | CAT MANUAL USERS: " + statsObj.user.categorizedManual));

  statsObj.user.uncategorizedManual = await countDocuments({documentType: "users", query: {category: { "$in": [false, "false", null] }}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | UNCAT MANUAL USERS: " + statsObj.user.uncategorizedManual));

  statsObj.user.categorizedAuto = await countDocuments({documentType: "users", query: {categoryAuto: { "$nin": [false, "false", null] }}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | CAT AUTO USERS: " + statsObj.user.categorizedAuto));

  statsObj.user.uncategorizedAuto = await countDocuments({documentType: "users", query: {categoryAuto: { "$in": [false, "false", null] }}});
  console.log(chalkBlue(MODULE_ID_PREFIX + " | UNCAT AUTO USERS: " + statsObj.user.uncategorizedAuto));

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

  const userSearchQuery = { ignored: false };
  
  userSearchCursor = wordAssoDb.User
    .find(userSearchQuery)
    .select({
      nodeId: 1, 
      lang: 1, 
      category: 1, 
      categoryAuto: 1, 
      categoryVerified: 1, 
      following: 1, 
      followersCount: 1, 
      ignored: 1,
      screenName: 1,
      name: 1
    })
    .lean()
    .cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

  const cursorStartTime = moment().valueOf();

  userSearchCursor.on("data", async function(user) {

    const nodeId = user.nodeId.toLowerCase();
    const screenName = (user.screenName && (user.screenName !== undefined)) ? user.screenName.toLowerCase() : "undefined_screen_name";
    const category = user.category;
    const categoryAuto = user.categoryAuto;

    const uncatUserObj = await uncatUserCache.get(nodeId);

    if (user.lang && (user.lang !== undefined) && (user.lang != "en")){

      wordAssoDb.User.deleteOne({"nodeId": nodeId}, function(err){
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
    else if (!category 
      && !user.following 
      && (user.followersCount > 0)
      && (user.followersCount < configuration.minFollowersAutoCategorize)
    ){

      wordAssoDb.User.deleteOne({"nodeId": nodeId}, function(err){
        if (err) {
          console.log(chalkError("WAS | *** DB DELETE USER LESS THAN MIN FOLLOWERS | ERROR: " + err));
        }
        else {
          printUserObj(
            "XXX USER | < MIN FOLLOWERS: " + user.followersCount,
            user, 
            chalkAlert
          );
        }
      });
    }
    else {

      if (user.categoryVerified) {
        verifiedCategorizedUsersSet.add(screenName);
      }

      let categorizeable = false;

      switch (category) {
        case "right":
          userRightSet.add(nodeId);
          userLeftSet.delete(nodeId);
          userNeutralSet.delete(nodeId);
          userPositiveSet.delete(nodeId);
          userNegativeSet.delete(nodeId);
          userNoneSet.delete(nodeId);
          categorizeable = true;
        break;
        case "left":
          userRightSet.delete(nodeId);
          userLeftSet.add(nodeId);
          userNeutralSet.delete(nodeId);
          userPositiveSet.delete(nodeId);
          userNegativeSet.delete(nodeId);
          userNoneSet.delete(nodeId);
          categorizeable = true;
        break;
        case "neutral":
          userRightSet.delete(nodeId);
          userLeftSet.delete(nodeId);
          userNeutralSet.add(nodeId);
          userPositiveSet.delete(nodeId);
          userNegativeSet.delete(nodeId);
          userNoneSet.delete(nodeId);
          categorizeable = true;
        break;
        case "positive":
          userRightSet.delete(nodeId);
          userLeftSet.delete(nodeId);
          userNeutralSet.delete(nodeId);
          userPositiveSet.add(nodeId);
          userNegativeSet.delete(nodeId);
          userNoneSet.delete(nodeId);
          categorizeable = true;
        break;
        case "negative":
          userRightSet.delete(nodeId);
          userLeftSet.delete(nodeId);
          userNeutralSet.delete(nodeId);
          userPositiveSet.delete(nodeId);
          userNegativeSet.add(nodeId);
          userNoneSet.delete(nodeId);
          categorizeable = true;
        break;
        default:
          userRightSet.delete(nodeId);
          userLeftSet.delete(nodeId);
          userNeutralSet.delete(nodeId);
          userPositiveSet.delete(nodeId);
          userNegativeSet.delete(nodeId);
          userNoneSet.add(nodeId);
      }

      switch (categoryAuto) {
        case "right":
          userAutoRightSet.add(nodeId);
          userAutoLeftSet.delete(nodeId);
          userAutoNeutralSet.delete(nodeId);
          userAutoPositiveSet.delete(nodeId);
          userAutoNegativeSet.delete(nodeId);
          userAutoNoneSet.delete(nodeId);
        break;
        case "left":
          userAutoRightSet.delete(nodeId);
          userAutoLeftSet.add(nodeId);
          userAutoNeutralSet.delete(nodeId);
          userAutoPositiveSet.delete(nodeId);
          userAutoNegativeSet.delete(nodeId);
          userAutoNoneSet.delete(nodeId);
        break;
        case "neutral":
          userAutoRightSet.delete(nodeId);
          userAutoLeftSet.delete(nodeId);
          userAutoNeutralSet.add(nodeId);
          userAutoPositiveSet.delete(nodeId);
          userAutoNegativeSet.delete(nodeId);
          userAutoNoneSet.delete(nodeId);
        break;
        case "positive":
          userAutoRightSet.delete(nodeId);
          userAutoLeftSet.delete(nodeId);
          userAutoNeutralSet.delete(nodeId);
          userAutoPositiveSet.add(nodeId);
          userAutoNegativeSet.delete(nodeId);
          userAutoNoneSet.delete(nodeId);
        break;
        case "negative":
          userAutoRightSet.delete(nodeId);
          userAutoLeftSet.delete(nodeId);
          userAutoNeutralSet.delete(nodeId);
          userAutoPositiveSet.delete(nodeId);
          userAutoNegativeSet.add(nodeId);
          userAutoNoneSet.delete(nodeId);
        break;
        default:
          userAutoRightSet.delete(nodeId);
          userAutoLeftSet.delete(nodeId);
          userAutoNeutralSet.delete(nodeId);
          userAutoPositiveSet.delete(nodeId);
          userAutoNegativeSet.delete(nodeId);
          userAutoNoneSet.add(nodeId);
      }

      if (!categorizeable) {
        categorizeable = await userCategorizeable(user);
      }

      if (categorizeable
        && (uncatUserObj == undefined)
        && (!category || (category == undefined))
        && (!user.ignored || (user.ignored == undefined))
        && (user.following || (user.followersCount >= configuration.minFollowersAutoCategorize)) 
        && (!configuration.ignoreCategoryRight || (configuration.ignoreCategoryRight && categoryAuto && (categoryAuto != "right")))
        && !ignoredUserSet.has(nodeId) 
        && !ignoredUserSet.has(screenName) 
        && !uncategorizedManualUserSet.has(nodeId) 
        && !unfollowableUserSet.has(nodeId)) { 

        uncategorizedManualUserSet.add(nodeId);

        if (tfeChild !== undefined) { 
          tfeChild.send({op: "USER_CATEGORIZE", user: user});
          // if (user.category == "left" || user.category == "right" || user.category == "neutral") {
          //   uncatUserCache.del(user.nodeId);
          // }
        }

        if (uncategorizedManualUserSet.size % 100 == 0) {
          printUserObj("UNCAT MAN USER  [" + uncategorizedManualUserSet.size + "]", user);
        }
      }

      if (!uncategorizedAutoUserSet.has(nodeId) 
        && (!categoryAuto || (categoryAuto == undefined))
        && !ignoredUserSet.has(nodeId) 
        && !ignoredUserSet.has(screenName) 
        && !ignoreLocationsSet.has(nodeId) 
        && (user.followersCount >= configuration.minFollowersAutoCategorize) 
        && !unfollowableUserSet.has(nodeId)) { 

        uncategorizedAutoUserSet.add(nodeId);

        if (uncategorizedAutoUserSet.size % 100 == 0) {
          printUserObj("UNCAT AUTO USER [" + uncategorizedAutoUserSet.size + "]", user);
        }
      }
      
      if (((category == "left") || (category == "neutral") || (category == "right"))
        && ((categoryAuto == "left") || (categoryAuto == "neutral") || (categoryAuto == "right"))) { 

        uncategorizedManualUserSet.delete(nodeId); 
        uncategorizedAutoUserSet.delete(nodeId); 

        if (!ignoredUserSet.has(nodeId) 
          && !ignoredUserSet.has(screenName) 
          && !ignoreLocationsSet.has(nodeId) 
          && !unfollowableUserSet.has(nodeId)){

          categorizedManualUserSet.add(nodeId); 
          categorizedAutoUserSet.add(nodeId); 

          await addMismatchUserSet({user: user});

          if (!matchUserSet.has(nodeId) && (category === categoryAuto)) {

            matchUserSet.add(nodeId); 
            mismatchUserSet.delete(nodeId); 

            if (matchUserSet.size % 100 == 0) {
              printUserObj("MATCHED USER [" + matchUserSet.size + "]", user);
            }
          }
        }
      }
    }

  });

  userSearchCursor.on("end", function() {

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

    console.log(chalkBlue("WAS | END FOLLOWING CURSOR"
      + " | " + getTimeStamp()
      + " | FOLLOWING USER SET | RUN TIME: " + msToTime(moment().valueOf() - cursorStartTime)
    ));
    console.log(chalkLog("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

    if (!calledBack) { 
      calledBack = true;
      return;
    }
  });

  userSearchCursor.on("error", function(err) {

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

    console.log(chalkError("*** ERROR userSearchCursor: " + err));
    console.log(chalkAlert("WAS | USER DB STATS\n" + jsonPrint(statsObj.user)));

    if (!calledBack) { 
      calledBack = true;
      throw err;
    }
  });

  userSearchCursor.on("close", function() {

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
      return;
    }
  });
}

function initTransmitNodeQueueInterval(interval){

  return new Promise(function(resolve){

    console.log(chalk.bold.black("WAS | INIT TRANSMIT NODE QUEUE INTERVAL: " + msToTime(interval)));

    clearInterval(transmitNodeQueueInterval);

    let nodeObj;
    let categorizeable;
    let nCacheObj;
    let autoFollowFlag = false;

    transmitNodeQueueInterval = setInterval(async function() {

      try {

        if (!transmitNodeQueueReady || (transmitNodeQueue.length == 0)) {
          return;
        }

        transmitNodeQueueReady = false;
        autoFollowFlag = false;

        nodeObj = transmitNodeQueue.shift();

        if (!nodeObj) {
          console.log(chalkError(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q")));
          transmitNodeQueueReady = true;
          return;
        }

        nodeObj.updateLastSeen = true;

        if (empty(nodeObj.category)) { nodeObj.category = false; }
        if (empty(nodeObj.categoryAuto)) { nodeObj.categoryAuto = false; }

        const node = await checkCategory(nodeObj);
        const n = await updateNodeMeter(node);

        categorizeable = await userCategorizeable(n);
 
        if (categorizeable) {

          if (n.nodeType != "user"){
            console.log(chalkError("WAS | *** CATEGORIZED NOT USER: CAT: " + categorizeable + " | TYPE: " + n.nodeType));
          }

          if (n.category == "left" || n.category == "right" || n.category == "neutral") {
            uncatUserCache.del(n.nodeId);
          }

          if (configuration.autoFollow
            && (!n.category || (n.category === undefined))
            && (!n.ignored || (n.ignored === undefined))
            && (!n.following || (n.following === undefined))
            && (n.followersCount >= configuration.minFollowersAutoFollow)
            && !autoFollowUserSet.has(n.nodeId)
            && !ignoredUserSet.has(n.nodeId) 
            && !ignoredUserSet.has(n.screenName.toLowerCase()) 
            )
          {
            n.following = true;
            autoFollowFlag = true;
            autoFollowUserSet.add(n.nodeId);
            statsObj.user.autoFollow += 1;
            printUserObj(MODULE_ID_PREFIX + " | +++ AUTO FOLLOW [" + statsObj.user.autoFollow + "]", n);
          }

          const uncatUserObj = uncatUserCache.get(n.nodeId);

          if (!uncategorizedManualUserSet.has(n.nodeId) 
            && (uncatUserObj == undefined)
            && (!n.category || (n.category === undefined))
            && (!n.ignored || (n.ignored === undefined))
            && (!configuration.ignoreCategoryRight || (configuration.ignoreCategoryRight && n.categoryAuto && (n.categoryAuto != "right")))
            && !ignoredUserSet.has(n.nodeId) 
            && !ignoredUserSet.has(n.screenName.toLowerCase()) 
            && (n.followersCount >= configuration.minFollowersAutoCategorize) 
            && !unfollowableUserSet.has(n.nodeId)) { 

            uncategorizedManualUserSet.add(n.nodeId);
          }

          if (!n.categoryAuto 
            && (n.followersCount >= configuration.minFollowersAutoCategorize) 
            && !uncategorizedAutoUserSet.has(n.nodeId)) {

            uncategorizedAutoUserSet.add(n.nodeId);
          }

          if (tfeChild !== undefined) { 
            tfeChild.send({op: "USER_CATEGORIZE", priorityFlag: autoFollowFlag, user: n});
            if (n.category == "left" || n.category == "right" || n.category == "neutral") {
              uncatUserCache.del(n.nodeId);
            }
          }
        }

        if ((n.nodeType == "user") && (n.category || n.categoryAuto || n.following || n.threeceeFollowing)){

          nCacheObj = nodeCache.get(n.nodeId);

          if (nCacheObj !== undefined) {
            n.mentions = Math.max(n.mentions, nCacheObj.mentions);
            n.setMentions = true;
            nodeCache.set(n.nodeId, n);
          }

          n.updateLastSeen = true;

          if (!userServerControllerReady || !statsObj.dbConnectionReady) {
            transmitNodeQueueReady = true;
          }
          else{

            userServerController.findOneUser(n, {noInc: false, fields: fieldsTransmit}, function(err, updatedUser){
              if (err) {
                console.log(chalkError("WAS | findOneUser ERROR" + jsonPrint(err)));
                delete n._id;
                delete n.userId;
                viewNameSpace.volatile.emit("node", n);
              }
              else {
                delete updatedUser._id;
                delete updatedUser.userId;
                viewNameSpace.volatile.emit("node", updatedUser);
              }

              transmitNodeQueueReady = true;
            });
          }
        }
        else if (n.nodeType == "user") {
          delete n._id;
          delete n.userId;
          viewNameSpace.volatile.emit("node", pick(n, fieldsTransmitKeys));

          transmitNodeQueueReady = true;
        }
        else if ((n.nodeType == "hashtag") && n.category && hashtagServerControllerReady){

          n.updateLastSeen = true;

          if (!hashtagServerControllerReady || !statsObj.dbConnectionReady) {
            transmitNodeQueueReady = true;
          }
          else {
            hashtagServerController.findOneHashtag(n, {noInc: false, lean: true}, function(err, updatedHashtag){
              if (err) {
                console.log(chalkError("WAS | updatedHashtag ERROR\n" + jsonPrint(err)));
                delete n._id;
                viewNameSpace.volatile.emit("node", n);
              }
              else {
                delete updatedHashtag._id;
                viewNameSpace.volatile.emit("node", updatedHashtag);
              }

              transmitNodeQueueReady = true;
            });
          }
        }
        else if (n.nodeType == "hashtag") {
          delete n._id;
          viewNameSpace.volatile.emit("node", n);
          transmitNodeQueueReady = true;
        }
        else {
          transmitNodeQueueReady = true;
        }

      }
      catch(err){
        transmitNodeQueueReady = true;
        console.log(chalkError("WAS | *** TRANSMIT NODE QUEUE ERROR: " + err));
      }
    }, interval);

    resolve();

  });
}

async function transmitNodes(tw){

  if (!tw.user 
    || ignoredUserSet.has(tw.user.nodeId) 
    || ignoredUserSet.has(tw.user.userId) 
    || ignoredUserSet.has(tw.user.screenName.toLowerCase()))
  {
    return;
  }

  transmitNodeQueue.push(tw.user);

  for(const user of tw.userMentions){
    if (user && configuration.enableTransmitUser && !ignoredUserSet.has(user.nodeId) && !ignoredUserSet.has(user.screenName.toLowerCase())) { 
      transmitNodeQueue.push(user); 
    }
  }

  for(const hashtag of tw.hashtags){
    if (hashtag && configuration.enableTransmitHashtag && !ignoredHashtagSet.has(hashtag.nodeId) && !ignoredHashtagRegex.test(hashtag.nodeId)) { 
      transmitNodeQueue.push(hashtag);
    }
  }

  return;
}

let heartbeatsSent = 0;

function logHeartbeat() {

  console.log(chalkLog("HB " + heartbeatsSent 
    + " | " + getTimeStamp() 
    + " | ST: " + getTimeStamp(parseInt(statsObj.startTime)) 
    + " | UP: " + msToTime(statsObj.upTime) 
    + " | RN: " + msToTime(statsObj.runTime) 
  ));
}

function initAppRouting(callback) {

  console.log(chalkInfo(getTimeStamp() + " | INIT APP ROUTING"));

  app.use(methodOverride());

  app.use(async function requestLog(req, res, next) {

    if (req.path == "/json") {
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
    else if (req.path == "callbacks/addsub") {
      console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | callbacks/addsub"
      )); 

      console.log(chalkAlert("WAS | R< callbacks/addsub"
        + "\nreq.query\n" + jsonPrint(req.query)
        + "\nreq.params\n" + jsonPrint(req.params)
        + "\nreq.body\n" + jsonPrint(req.body)
      )); 
    }
    else if (req.path == "callbacks/removesub") {
      console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | callbacks/removesub"
      )); 

      console.log(chalkAlert("WAS | R< callbacks/removesub"
        + "\nreq.query\n" + jsonPrint(req.query)
        + "\nreq.params\n" + jsonPrint(req.params)
        + "\nreq.body\n" + jsonPrint(req.body)
      )); 
    }
    else if (req.path == TWITTER_WEBHOOK_URL) {

      console.log(chalkAlert("WAS | R< TWITTER WEB HOOK | " + TWITTER_WEBHOOK_URL
        + " | " + getTimeStamp()
        + " | IP: " + req.ip
        + " | HOST: " + req.hostname
        + " | METHOD: " + req.method
        + " | PATH: " + req.path
        + " | ERROR: " + req.error
      )); 

      if (req.method == "GET") {

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

        if (followEvents && (followEvents[0].type == "follow")) {

          console.log(chalkAlert("WAS | >>> TWITTER USER FOLLOW EVENT"
            + " | SOURCE: @" + followEvents[0].source.screen_name
            + " | TARGET: @" + followEvents[0].target.screen_name
          ));

          const user = {
            nodeId: followEvents[0].target.id.toString(),
            userId: followEvents[0].target.id.toString(),
            screenName: followEvents[0].target.screen_name
          }

          follow({user: user, forceFollow: true})
          .then(function(updatedUser){
            if (!updatedUser) { return; }
            adminNameSpace.emit("FOLLOW", updatedUser);
            utilNameSpace.emit("FOLLOW", updatedUser);

          })
          .catch(function(err){
            console.log(chalkError("WAS | TWITTER_FOLLOW ERROR: " + err));
            return;
          });
        
        }
        
        if (followEvents && (followEvents[0].type == "unfollow")) {

          console.log(chalkAlert("WAS | >>> TWITTER USER UNFOLLOW EVENT"
            + " | SOURCE: @" + followEvents[0].source.screen_name
            + " | TARGET: @" + followEvents[0].target.screen_name
            // + "\n" + jsonPrint(followEvents)
          ));

          const user = {
            nodeId: followEvents[0].target.id.toString(),
            userId: followEvents[0].target.id.toString(),
            screenName: followEvents[0].target.screen_name
          }

          unfollow({user: user}, function(err, updatedUser){
            if (err) {
              console.log(chalkError("WAS | TWITTER_UNFOLLOW ERROR: " + err));
              return;
            }
            
            if (!updatedUser) { return; }

            adminNameSpace.emit("UNFOLLOW", updatedUser);
            utilNameSpace.emit("UNFOLLOW", updatedUser);
          });
        }
        
        res.sendStatus(200);
      }
    }
    else if (req.path == "/dropbox_webhook") {

      if (configuration.verbose) {
        console.log(chalkInfo("WAS | R< DROPBOX WEB HOOK | /dropbox_webhook"
        )); 
      }

      res.send(req.query.challenge);

      next();
    }
    else if (req.path == "/googleccd19766bea2dfd2.html") {

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
    else if (req.path == "/") {
      console.log(chalkLog("WAS | R< REDIRECT /session")); 
      res.redirect("/session");
    }
    else if ((req.path == "/profiles.js") || (req.path == "/session.js") || (req.path == "/js/libs/controlPanel.js")) {

      const fullPath = path.join(__dirname, req.path);
      const defaultSource = (hostname == "google") ? "PRODUCTION_SOURCE" : "LOCAL_SOURCE";

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

      const domainName = await dnsReverse({ipAddress: req.ip});

      console.log(chalkInfo("WAS | R<"
        + " | " + getTimeStamp()
        + " | IP: " + req.ip
        + " | DOMAIN: " + domainName
        + " | HOST: " + req.hostname
        + " | METHOD: " + req.method
        + " | PATH: " + req.path
      ));

      if (req.path.includes("controlPanel")){        

        slackText = "*LOADING PAGE | CONTROL PANEL*";
        slackText = slackText + " | IP: " + req.ip;
        slackText = slackText + " | DOMAIN: " + domainName;
        slackText = slackText + " | URL: " + req.url;
        slackText = slackText + "\nFILE: " + adminHtml;

        await slackSendWebMessage({ channel: slackChannelAdmin, text: slackText});
      }

      next();
    }
  });

  app.use(express.static(path.join(__dirname, "/")));
  app.use(express.static(path.join(__dirname, "/js")));
  app.use(express.static(path.join(__dirname, "/css")));
  app.use(express.static(path.join(__dirname, "/node_modules")));
  app.use(express.static(path.join(__dirname, "/public/assets/images")));

  app.get("/onload.js", function(req, res) {

    console.log(chalkInfo("WAS | R< ONLOAD | /onload"));

    const onloadFile = path.join(__dirname, "/onload.js");

    res.sendFile(onloadFile, function(err) {
      if (err) {
        console.log(chalkError("WAS | GET /onload ERROR:"
          + " | " + getTimeStamp()
          + " | IP: " + req.ip
          + " | " + req.url
          + " | " + onloadFile
          + " | " + err
        ));
      } 
    });
  });

  const adminHtml = path.join(__dirname, "/admin/admin.html");

  app.get("/admin", async function requestAdmin(req, res) {

    const domainName = await dnsReverse({ipAddress: req.ip});

    console.log(chalkLog("WAS | LOADING PAGE"
      + " | IP: " + req.ip
      + " | DOMAIN: " + domainName
      + " | REQ: " + req.url
      + " | FILE: " + adminHtml
    ));

    slackText = "*LOADING PAGE | ADMIN*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | URL: " + req.url;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + "\nFILE: " + adminHtml;

    await slackSendWebMessage({ channel: slackChannelAdmin, text: slackText});

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
    });
  });

  const loginHtml = path.join(__dirname, "/login.html");

  app.get("/login", async function requestSession(req, res, next) {

    debug(chalkInfo("get next\n" + next));

    const domainName = await dnsReverse({ipAddress: req.ip});

    console.log(chalkAlert("WAS | LOADING PAGE | LOGIN"
      + " | IP: " + req.ip
      + " | DOMAIN: " + domainName
      + " | REQ: " + req.url
      + " | RES: " + loginHtml
    ));

    slackText = "*LOADING PAGE | TWITTER LOGIN*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + " | URL: " + req.url;
    slackText = slackText + "\nFILE: " + loginHtml;

    await slackSendWebMessage({ channel: slackChannel, text: slackText});

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

  const sessionHtml = path.join(__dirname, "/sessionModular.html");

  app.get("/session", async function requestSession(req, res, next) {

    debug(chalkInfo("get next\n" + next));

    const domainName = await dnsReverse({ipAddress: req.ip});

    console.log(chalkLog("WAS | LOADING PAGE"
      + " | IP: " + req.ip
      + " | DOMAIN: " + domainName
      + " | REQ: " + req.url
      + " | FILE: " + sessionHtml
    ));

    slackText = "*LOADING PAGE*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + " | URL: " + req.url;
    slackText = slackText + "\nFILE: " + sessionHtml;

    await slackSendWebMessage({ channel: slackChannel, text: slackText});

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

  const profilesHtml = path.join(__dirname, "/profiles.html");

  app.get("/profiles", async function requestSession(req, res, next) {

    debug(chalkInfo("get next\n" + next));

    const domainName = await dnsReverse({ipAddress: req.ip});

    console.log(chalkLog("WAS | LOADING PAGE"
      + " | IP: " + req.ip
      + " | DOMAIN: " + domainName
      + " | REQ: " + req.url
      + " | FILE: " + profilesHtml
    ));

    slackText = "*LOADING PAGE*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + " | URL: " + req.url;
    slackText = slackText + "\nFILE: " + profilesHtml;

    await slackSendWebMessage({ channel: slackChannel, text: slackText});

    res.sendFile(profilesHtml, function responseSession(err) {
      if (err) {
        console.log(chalkError("WAS | GET /profiles ERROR:"
          + " | " + getTimeStamp()
          + " | IP: " + req.ip
          + " | " + req.url
          + " | " + profilesHtml
          + " | " + err
        ));
      } 
      else {
        if (configuration.verbose) {
          console.log(chalkInfo("SENT:", profilesHtml));
        }
      }
    });
  });

  async function ensureAuthenticated(req, res, next) {

    const domainName = await dnsReverse({ipAddress: req.ip});

    if (req.isAuthenticated()) { 

      console.log(chalk.green("WAS | PASSPORT TWITTER AUTHENTICATED"));

      slackText = "*PASSPORT TWITTER AUTHENTICATED*";
      slackText = slackText + " | IP: " + req.ip;
      slackText = slackText + " | DOMAIN: " + domainName;
      slackText = slackText + " | URL: " + req.url;
      slackText = slackText + " | @" + req.session.passport.user.screenName;

      await slackSendWebMessage({ channel: slackChannelUserAuth, text: slackText});

      return next();
    }

    console.log(chalkAlert("WAS | *** PASSPORT TWITTER *NOT* AUTHENTICATED ***"));

    slackText = "*PASSPORT TWITTER AUTHENTICATION FAILED*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + " | URL: " + req.url;
    slackText = slackText + " | @" + req.session.passport.user.screenName;

    await slackSendWebMessage({ channel: slackChannelUserAuth, text: slackText});
  }

  app.get("/account", ensureAuthenticated, async function(req, res){

    const domainName = await dnsReverse({ipAddress: req.ip});

    console.log(chalkError("WAS | PASSPORT TWITTER AUTH USER\n" + jsonPrint(req.session.passport.user))); // handle errors
    console.log(chalkError("WAS | PASSPORT TWITTER AUTH USER"
      + " | IP: " + req.ip
      + " | DOMAIN: " + domainName
      + " | @" + req.session.passport.user.screenName
      + " | UID" + req.session.passport.user.nodeId
    )); // handle errors

    slackText = "*LOADING PAGE | PASSPORT TWITTER AUTH*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + " | URL: " + req.url;
    slackText = slackText + " | @" + req.session.passport.user.screenName;

    await slackSendWebMessage({ channel: slackChannelUserAuth, text: slackText});

    if (!userServerControllerReady || !statsObj.dbConnectionReady) {
      console.log(chalkAlert("WAS | *** NOT READY"
        + " | statsObj.dbConnectionReady: " + statsObj.dbConnectionReady
        + " | userServerControllerReady: " + userServerControllerReady
      ));
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

  app.get("/auth/twitter/error", async function(req){

    const domainName = await dnsReverse({ipAddress: req.ip});

    console.log(chalkAlert("WAS | PASSPORT AUTH TWITTER ERROR"));

    slackText = "*LOADING PAGE | PASSPORT AUTH TWITTER ERROR*";
    slackText = slackText + " | IP: " + req.ip;
    slackText = slackText + " | DOMAIN: " + domainName;
    slackText = slackText + " | URL: " + req.url;

    await slackSendWebMessage({ channel: slackChannelUserAuth, text: slackText});
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
      if (err.code != "ENOTFOUND") {
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

    // debug(chalkInfo(getTimeStamp() 
    //   + " | INIT INTERNET CHECK INTERVAL | " + interval + " MS"));

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

    let tweetRxQueueReady = true;

    const twpMessageObj = { op: "tweet", tweetStatus: {} };

    if (typeof interval != "number") {
      return reject(new Error("initTwitterRxQueueInterval interval NOT a NUMBER: " + interval));
    }

    console.log(chalk.bold.black("WAS | INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"));

    clearInterval(tweetRxQueueInterval);

    tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {

      if ((tweetRxQueue.length > 0) && tweetParserReady && tweetRxQueueReady) {

        tweetRxQueueReady = false;

        twpMessageObj.tweetStatus = tweetRxQueue.shift();
        twpChild.send(twpMessageObj, function(){
          tweetRxQueueReady = true;
        });

      }
    }, interval);

    resolve();

  });
}

let tweetParserMessageRxQueueReady = true;
let tweetParserMessageRxQueueInterval;

async function initTweetParserMessageRxQueueInterval(interval){

  if (typeof interval != "number") {
    throw new Error("initTweetParserMessageRxQueueInterval interval NOT a NUMBER: " + interval);
  }

  console.log(chalk.bold.black("WAS | INIT TWEET PARSER MESSAGE RX QUEUE INTERVAL | " + msToTime(interval)));

  clearInterval(tweetParserMessageRxQueueInterval);

  let tweetParserMessage = {};
  let tweetObj = {};

  const dbUserMessage = {};
  dbUserMessage.op = "TWEET";
  dbUserMessage.tweetObj = {};

  // {op: "TWEET", tweetObj: tweetObj}

  tweetParserMessageRxQueueInterval = setInterval(async function() {

    if ((tweetParserMessageRxQueue.length > 0) && tweetParserMessageRxQueueReady) {

      tweetParserMessageRxQueueReady = false;

      tweetParserMessage = tweetParserMessageRxQueue.shift();

      // debug(chalkLog("TWEET PARSER RX MESSAGE"
      //   + " | OP: " + tweetParserMessage.op
      // ));

      if (tweetParserMessage.op == "error") {

        statsObj.errors.twitter.parser += 1;

        console.log(chalkError("WAS | *** ERROR PARSE TW"
          + " | " + getTimeStamp()
          + " | TWEET PARSER ERRORS: " + statsObj.errors.twitter.parser
          + " | ERROR: " + tweetParserMessage.err
        ));

        tweetParserMessageRxQueueReady = true;
      }
      else if (tweetParserMessage.op == "parsedTweet") {

        tweetObj = tweetParserMessage.tweetObj;

        if (!tweetObj.user) {
          console.log(chalkAlert("WAS | parsedTweet -- TW USER UNDEFINED"
            + " | " + tweetObj.tweetId
          ));
          tweetParserMessageRxQueueReady = true;
        }
        else {

          if (dbuChild && dbuChildReady && categorizeableUserSet.has(tweetObj.user.nodeId)) {
            dbUserMessage.tweetObj = tweetObj;
            dbuChild.send(dbUserMessage);
          }

          if (transmitNodeQueue.length <= maxQueue) {

            try{
              await transmitNodes(tweetObj);
              tweetParserMessageRxQueueReady = true;
            }
            catch(e){
              console.log(chalkError("WAS | *** TX NODES ERROR"));
              console.log(e);
              tweetParserMessageRxQueueReady = true;
            }
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

  return;
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

    const maxTopTerms = configuration.maxTopTerms;

    sorterMessageRxQueueInterval = setInterval(function sorterMessageRxQueueDequeue() {

      if (sorterMessageRxReady && (sorterMessageRxQueue.length > 0)) {

        sorterMessageRxReady = false;

        sorterObj = sorterMessageRxQueue.shift();

        nodeType = sorterObj.nodeType;

        switch (sorterObj.op){

          case "SORTED":

            // debug(chalkLog("SORT ---------------------"));

            sortedKeys = sorterObj.sortedKeys;
            endIndex = Math.min(maxTopTerms, sortedKeys.length);

            async.times(endIndex, function(index, next) {

              nodeId = sortedKeys[index].toLowerCase();

              if (empty(nodeType) || (nodeType == "overall")) {
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

  // debug(chalkLog("KEY SORT"
  //   + " | KEYS: " + Object.keys(params.obj).length
  // ));

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

  if (dbuChild) {

    dbuPingInterval = setInterval(function(){

      if (!dbuPingSent) {

        dbuPingId = moment().valueOf();

        dbuChild.send({op: "PING", pingId: dbuPingId}, function(err){

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

        dbuChild.send({op: "PING", pingId: dbuPingId}, function(err){

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

  if (tfeChild !== undefined) {

    tfePingInterval = setInterval(function(){

      if (!tfePingSent) {

        tfePingId = moment().valueOf();

        tfeChild.send({op: "PING", pingId: tfePingId}, function(err){

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

        tfeChild.send({op: "PING", pingId: tfePingId}, function(err){

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

function initTssPingInterval(interval){

  clearInterval(tssPingInterval);

  tssPingSent = false;
  tssPongReceived = false;

  tssPingId = moment().valueOf();

  if (tssChild !== undefined) {

    tssPingInterval = setInterval(function(){

      if (!tssPingSent) {

        tssPingId = moment().valueOf();

        tssChild.send({op: "PING", pingId: tssPingId}, function(err){

          tssPingSent = true; 

          if (err) {

            console.log(chalkError("WAS | *** TSS SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
              tssPongReceived = false;
              initTssChild({
                childId: DEFAULT_TSS_CHILD_ID, 
                tweetVersion2: configuration.tweetVersion2,
                threeceeUser: threeceeUser
              });
            });

            return;
          }

          console.log(chalkInfo("WAS | >PING | TSS | PING ID: " + getTimeStamp(tssPingId)));

        });

      }
      else if (tssPingSent && tssPongReceived) {

        tssPingId = moment().valueOf();

        tssPingSent = false; 
        tssPongReceived = false;

        tssChild.send({op: "PING", pingId: tssPingId}, function(err){

          if (err) {

            console.log(chalkError("WAS | *** TSS SEND PING ERROR: " + err));

            killChild({childId: DEFAULT_TSS_CHILD_ID}, function(err){
              if (err) {
                console.log(chalkError("WAS | *** KILL CHILD ERROR: " + err));
                return;
              }
              tssPongReceived = false;
              initTssChild({
                childId: DEFAULT_TSS_CHILD_ID, 
                tweetVersion2: configuration.tweetVersion2,
                threeceeUser: threeceeUser
              });
            });

            return;
          }

          if (configuration.verbose) { console.log(chalkInfo("WAS | >PING | TSS | PING ID: " + getTimeStamp(tssPingId))); }

          tssPingSent = true; 

        });

      }
      else {

        console.log(chalkAlert("WAS | *** PONG TIMEOUT | TSS"
          + " | TIMEOUT: " + interval
          + " | NOW: " + getTimeStamp()
          + " | PING ID: " + getTimeStamp(tssPingId)
          + " | ELAPSED: " + msToTime(moment().valueOf() - tssPingId)
        ));
        
      }
    }, interval);

  }
}

function initTssChild(params){

  statsObj.status = "INIT TSS CHILD";

  statsObj.tssChildReady = false;

  console.log(chalk.bold.black("WAS | INIT TSS CHILD\n" + jsonPrint(params)));

  return new Promise(function(resolve, reject){

    let tss;

    if (params.tweetVersion2) {
      tss = cp.fork(`${__dirname}/js/libs/tssChildLabs.js`);
    }
    else{
      tss = cp.fork(`${__dirname}/js/libs/tssChild.js`);
    }

    childrenHashMap[params.childId] = {};
    childrenHashMap[params.childId].pid = tss.pid;
    childrenHashMap[params.childId].childId = params.childId;
    childrenHashMap[params.childId].threeceeUser = params.threeceeUser;
    childrenHashMap[params.childId].title = params.childId;
    childrenHashMap[params.childId].status = "NEW";
    childrenHashMap[params.childId].errors = 0;
    childrenHashMap[params.childId].unfollowArrary = [];

    touchChildPidFile({ childId: params.childId, pid: childrenHashMap[params.childId].pid });

    tss.on("message", async function tssMessageRx(m){

      childrenHashMap[params.childId].status = "RUNNING";  

      switch (m.op) {

        case "ERROR":
          console.log(chalkError("WAS | <TSS | ERROR"
            + " | 3C @" + m.threeceeUser
            + " | ERROR TYPE: " + m.errorType
            + " | ERROR MESSAGE: " + m.error.message
            // + "\n" + jsonPrint(m.error)
          ));

          if (m.errorType == "TWITTER_UNFOLLOW") {

            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;

            console.log(chalkError("WAS | <TSS | ERROR | TWITTER_UNFOLLOW"
              + " | AUTUO FOLLOW USER: @" + threeceeUser
              + " | ERROR TYPE: " + m.errorType
              + " | ERROR MESSAGE: " + m.error.message
            ));
          }
          else if ((m.errorType == "TWITTER_FOLLOW_LIMIT") || (m.error.code == 161)) {

            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
            threeceeTwitter.twitterAuthorizationErrorFlag = m.error;

            console.log(chalkError("WAS | <TSS | ERROR | TWITTER_FOLLOW_LIMIT"
              + " | AUTUO FOLLOW USER: @" + threeceeUser
              + " | ERROR TYPE: " + m.errorType
              + " | ERROR MESSAGE: " + m.error.message
            ));
          }
          else if ((m.errorType == "TWITTER_UNAUTHORIZED") || (m.error.statusCode == 401)) {

            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
            threeceeTwitter.twitterAuthorizationErrorFlag = m.error;
          }
          else if (m.errorType == "TWITTER_TOKEN") {

            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
            threeceeTwitter.twitterTokenErrorFlag = m.error;
          }
          else if (m.errorType == "USER_NOT_FOUND") {

            unfollowableUserSet.add(m.userId);

            console.log(chalkLog("WAS | XXX TWITTER USER NOT FOUND"
              + " | UID: " + m.userId
              + " | @" + m.screenName
              + " | UNFOLLOWABLE SET SIZE: " + unfollowableUserSet.size
            ));
          }
          else if (m.errorType == "TWITTER_FOLLOW_BLOCK") {

            unfollowableUserSet.add(m.userId);

            console.log(chalkLog("WAS | XXX TWITTER FOLLOW BLOCK"
              + " | UID: " + m.userId
              + " | @" + m.screenName
              + " | UNFOLLOWABLE SET SIZE: " + unfollowableUserSet.size
            ));
          }
          else {

            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;

          }
        break;

        case "TWITTER_STATS":

          console.log(chalkInfo("WAS | <TSS | TWITTER STATS"
            + " | 3C @" + m.threeceeUser
            + " | FOLLOWING: " + m.twitterFollowing
          ));

          threeceeTwitter.twitterFollowing = m.twitterFollowing;
          threeceeTwitter.twitterFriends = m.twitterFriends;
          if (m.twitterConfig) {
            threeceeTwitter.twitterConfig = m.twitterConfig;
          }
        break;

        case "FOLLOW_LIMIT":

          console.log(chalkInfo("WAS | <TSS | FOLLOW LIMIT"
            + " | 3C @" + m.threeceeUser
            + " | LIMIT: " + getTimeStamp(m.twitterFollowLimit)
            + " | NOW: " + getTimeStamp()
          ));

          threeceeTwitter.twitterFollowing = m.twitterFollowing;
          threeceeTwitter.twitterFriends = m.twitterFriends;
          threeceeTwitter.twitterFollowLimit = true;
        break;

        case "TWEET":
          socketRxTweet(m.tweet);
        break;

        case "DB_USER_MISS":
          dbUserMissQueue.push(m);
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
      statsObj.tssChildReady = false;
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
      statsObj.tssChildReady = false;
      console.log(chalkError(getTimeStamp()
        + " | *** TSS EXIT ***"
        + " | EXIT CODE: " + code
      ));
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "EXIT";
    });

    tss.on("close", function tssClose(code){
      statsObj.tssChildReady = false;
      console.log(chalkError(getTimeStamp()
        + " | *** TSS CLOSE ***"
        + " | EXIT CODE: " + code
      ));
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "CLOSE";
      configEvents.emit("CHILD_ERROR", {childId: params.childId});
    });

    tssChild = tss;

    tss.send({
      op: "INIT",
      title: params.childId,
      threeceeUser: params.threeceeUser,
      twitterConfig: threeceeTwitter.twitterConfig,
      interval: configuration.tssInterval,
      filterDuplicateTweets: configuration.filterDuplicateTweets,
      filterRetweets: configuration.filterRetweets,
      testMode: configuration.testMode,
      verbose: configuration.verbose
    }, function tssMessageRxError(err){
      if (err) {
        statsObj.tssChildReady = false;
        console.log(chalkError("WAS | *** TSS SEND ERROR: " + err));
        console.log(err);
        clearInterval(tssPingInterval);
        childrenHashMap[params.childId].status = "ERROR";
        reject(err);
      }
      else {
        childrenHashMap[params.childId].status = "INIT";
        clearInterval(tssPingInterval);
        setTimeout(function(){
          initTssPingInterval(TSS_PING_INTERVAL);
        }, 1000);
        statsObj.tssChildReady = true;
        resolve();
      }
    });

  });
}

async function initTfeChild(params){

  statsObj.status = "INIT TFE CHILD";

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

  touchChildPidFile({ childId: params.childId, pid: childrenHashMap[params.childId].pid });

  tfe.on("message", async function tfeMessageRx(m){

    childrenHashMap[params.childId].status = "RUNNING";  

    const isInfoUser = m.isInfoUser || false;

    switch (m.op) {

      case "ERROR":

        console.log(chalkError("WAS | <TFE | ERROR"
          + " | 3C @" + m.threeceeUser
          + " | INFO 3C: " + isInfoUser
          + " | ERROR TYPE: " + m.errorType
        ));

        if (m.errorType == "TWITTER_UNAUTHORIZED") {

          threeceeTwitter.twitterErrors += 1;
          threeceeTwitter.twitterErrorFlag = m.error;
          threeceeTwitter.twitterAuthorizationErrorFlag = m.error;
        }
        else if (m.errorType == "TWITTER_TOKEN") {

          threeceeTwitter.twitterErrors += 1;
          threeceeTwitter.twitterErrorFlag = m.error;
          threeceeTwitter.twitterTokenErrorFlag = m.error;
        }
        else if (m.errorType == "USER_BLOCKED") {

          threeceeTwitter.twitterErrors += 1;
          threeceeTwitter.twitterErrorFlag = m.error;
          threeceeTwitter.twitterTokenErrorFlag = m.error;

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

          threeceeTwitter.twitterErrors += 1;
          threeceeTwitter.twitterErrorFlag = m.error;

        }
      break;

      case "TWITTER_STATS":

        console.log(chalkInfo("WAS | <TFE | TWITTER STATS"
          + " | 3C @" + m.threeceeUser
          + " | FOLLOWING: " + m.twitterFollowing
        ));

        threeceeTwitter.twitterFollowing = m.twitterFollowing;
        threeceeTwitter.twitterFriends = m.twitterFriends;
      break;

      case "FOLLOW_LIMIT":

        console.log(chalkInfo("WAS | <TFE | FOLLOW LIMIT"
          + " | 3C @" + m.threeceeUser
          + " | LIMIT: " + getTimeStamp(m.twitterFollowLimit)
          + " | NOW: " + getTimeStamp()
        ));

        threeceeTwitter.twitterFollowing = m.twitterFollowing;
        threeceeTwitter.twitterFriends = m.twitterFriends;
        threeceeTwitter.twitterFollowLimit = true;
      break;

      case "TWEET":
        socketRxTweet(m.tweet);
      break;

      case "NETWORK_STATS":
      break;

      case "USER_CATEGORIZED":

        categorizedUserHashMap.set(
          m.user.nodeId, 
          { 
            nodeId: m.user.nodeId, 
            screenName: m.user.screenName, 
            manual: m.user.category, 
            auto: m.user.categoryAuto
          }
        );

        if (m.user.category == "left" || m.user.category == "right" || m.user.category == "neutral") {
          uncatUserCache.del(m.user.nodeId);

          if (m.user.category == m.user.categoryAuto) {
            mismatchUserCache.del(m.user.nodeId);
          }

        }

        if (m.priorityFlag){
          if (m.searchMode === "SPECIFIC"){
            printUserObj("WAS | <TFE | PRI CAT | MODE: " + m.searchMode, m.user);
            viewNameSpace.emit("SET_TWITTER_USER", { user: m.user, searchMode: m.searchMode, stats: statsObj.user });
          }
          else if ((m.searchMode === "MISMATCH") && m.user.category && (m.user.category === m.user.categoryAuto)){
            await addMismatchUserSet({user: m.user});
            printUserObj("WAS | <TFE | PRI CAT | MISMATCH NOT FOUND | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?mm"});
          }
          else if ((m.searchMode === "UNCAT_LEFT") && m.user.categoryAuto && (m.user.categoryAuto !== "left")){
            printUserObj("WAS | <TFE | PRI CAT | UNCAT LEFT NOT FOUND | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?left"});
          }
          else if ((m.searchMode === "UNCAT_NEUTRAL") && m.user.categoryAuto && (m.user.categoryAuto !== "neutral")){
            printUserObj("WAS | <TFE | PRI CAT | UNCAT NEUTRAL NOT FOUND | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?neutral"});
          }
          else if ((m.searchMode === "UNCAT_RIGHT") && m.user.categoryAuto && (m.user.categoryAuto !== "right")){
            printUserObj("WAS | <TFE | PRI CAT | UNCAT RIGHT NOT FOUND | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?right"});
          }
          else if ((m.searchMode === "UNCAT") && m.user.category){
            printUserObj("WAS | <TFE | PRI CAT | UNCAT NOT FOUND | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?all"});
          }
          else if (m.searchMode && m.searchMode !== undefined){
            printUserObj("WAS | <TFE | PRI CAT | MODE: " + m.searchMode, m.user);
            viewNameSpace.emit("SET_TWITTER_USER", { user: m.user, searchMode: m.searchMode, stats: statsObj.user });
          }
          else if (autoFollowUserSet.has(m.user.nodeId)){
            printUserObj("WAS | <TFE | PRI CAT | AUTO FOLLOW", m.user);
            // autoFollowUserSet.delete(m.user.nodeId);
          }
        }
        else if (configuration.verbose) {
          printUserObj("WAS | <TFE | CAT | MODE: " + m.searchMode, m.user, chalkLog);
        }
      break;

      case "USER_CATEGORIZED_ERROR":
        if (m.priorityFlag){

          uncatUserCache.del(m.user.nodeId);

          if (m.searchMode === "MISMATCH"){
            printUserObj("WAS | <TFE | PRI CAT | *** MISMATCH ERROR | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?mm"});
          }
          else if (m.searchMode === "UNCAT_LEFT"){
            printUserObj("WAS | <TFE | PRI CAT | *** UNCAT LEFT ERROR | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?left"});
          }
          else if (m.searchMode === "UNCAT_NEUTRAL"){
            printUserObj("WAS | <TFE | PRI CAT | *** UNCAT NEUTRAL ERROR | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?neutral"});
          }
          else if (m.searchMode === "UNCAT_RIGHT"){
            printUserObj("WAS | <TFE | PRI CAT | *** UNCAT RIGHT ERROR | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?right"});
          }
          else{
            printUserObj("WAS | <TFE | PRI CAT | *** UNCAT ERROR | " + m.searchMode, m.user);
            await twitterSearchUser({searchNode: "@?all"});
          }
        }
        else if (configuration.verbose) {
          printUserObj("WAS | <TFE | CAT | MODE: " + m.searchMode, m.user, chalkLog);
        }
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

  tfeChild = tfe;

  tfeChild.send({
    op: "INIT",
    title: "wa_node_child_tfe",
    networkObj: bestNetworkObj,
    twitterConfig: threeceeTwitter.twitterConfig,
    maxInputHashMap: maxInputHashMap,
    userProfileOnlyFlag: configuration.userProfileOnlyFlag,
    binaryMode: configuration.binaryMode,
    normalization: normalization,
    interval: configuration.tfeInterval,

    enableGeoCode: configuration.enableGeoCode,
    forceGeoCode: configuration.forceGeoCode,

    enableImageAnalysis: configuration.enableImageAnalysis,
    forceImageAnalysis: configuration.forceImageAnalysis,
    
    enableLanguageAnalysis: configuration.enableImageAnalysis,
    forceLanguageAnalysis: configuration.forceLanguageAnalysis,
    
    testMode: configuration.testMode,
    verbose: configuration.verbose
  }, function tfeMessageRxError(err){
    if (err) {
      console.log(chalkError("WAS | *** TFE SEND ERROR"
        + " | " + err
      ));
      console.log(err);
      statsObj.tfeSendReady = false;
      statsObj.tfeChildReady = false;
      clearInterval(tfePingInterval);
      childrenHashMap[params.childId].status = "ERROR";
      throw err;
    }
    else {
      statsObj.tfeSendReady = true;
      statsObj.tfeChildReady = true;
      childrenHashMap[params.childId].status = "INIT";
      clearInterval(tfePingInterval);
      setTimeout(function(){
        initTfePingInterval(TFE_PING_INTERVAL);
      }, 15*ONE_SECOND);
      return;
    }
  });
}

function initDbuChild(params){

  statsObj.status = "INIT DBU CHILD";

  return new Promise(function(resolve, reject){

    const childId = params.childId;

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

      // debug(chalkLog("DBU RX MESSAGE"
      //   + " | OP: " + m.op
      // ));

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
      // dbuSendReady = false;
      dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "ERROR";
    });

    dbu.on("exit", function dbuExit(code){
      console.log(chalkError(getTimeStamp()
        + " | *** DBU EXIT ***"
        + " | EXIT CODE: " + code
      ));
      // dbuSendReady = false;
      dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "EXIT";
    });

    dbu.on("close", function dbuClose(code){
      console.log(chalkError(getTimeStamp()
        + " | *** DBU CLOSE ***"
        + " | EXIT CODE: " + code
      ));
      // dbuSendReady = false;
      dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "CLOSE";
    });

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
        console.log(err);
        // dbuSendReady = false;
        dbuChildReady = false;
        clearInterval(dbuPingInterval);
        childrenHashMap[childId].status = "ERROR";
        reject(err);
      }
      else {
        // dbuSendReady = true;
        dbuChildReady = true;
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

  if (twpChild) {

    tweetParserPingInterval = setInterval(function(){

      if (!tweetParserPingSent) {

        tweetParserPingId = moment().valueOf();

        twpChild.send({op: "PING", pingId: tweetParserPingId}, function(err){

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

        twpChild.send({op: "PING", pingId: tweetParserPingId}, function(err){

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

    tweetParserReady = false;

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

      // debug(chalkLog("TWEET PARSER RX MESSAGE"
      //   + " | OP: " + m.op
      // ));

      if (m.op == "PONG"){

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

      else if (tweetParserMessageRxQueue.length < maxQueue){
        tweetParserMessageRxQueue.push(m);
      }
    });

    twp.on("error", function tweetParserError(err){
      console.log(chalkError(getTimeStamp()
        + " | *** TWEET PARSER ERROR ***"
        + " \n" + jsonPrint(err)
      ));
      statsObj.tweetParserSendReady = false;
      tweetParserReady = false;
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
      tweetParserReady = false;
      clearInterval(tweetParserPingInterval);
      childrenHashMap[params.childId].status = "EXIT";
    });

    twp.on("close", function tweetParserClose(code){
      console.log(chalkError(getTimeStamp()
        + " | *** TWEET PARSER CLOSE ***"
        + " | EXIT CODE: " + code
      ));
      statsObj.tweetParserSendReady = false;
      tweetParserReady = false;
      clearInterval(tweetParserPingInterval);
      childrenHashMap[params.childId].status = "CLOSE";
    });

    twpChild = twp;

    tweetParserReady = true;

    twp.send({
      op: "INIT",
      title: "wa_node_child_twp",
      interval: configuration.tweetParserInterval,
      tweetVersion2: configuration.tweetVersion2,
      testMode: configuration.testMode,
      verbose: configuration.verbose
    }, function tweetParserMessageRxError(err){
      if (err) {
        console.log(chalkError("WAS | *** TWEET PARSER SEND ERROR"
          + " | " + err
        ));
        statsObj.tweetParserSendReady = false;
        tweetParserReady = false;
        clearInterval(tweetParserPingInterval);
        childrenHashMap[params.childId].status = "ERROR";
      }
      else {
        statsObj.tweetParserSendReady = true;
        tweetParserReady = true;
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

      if (updateTimeSeriesCount % configuration.rateQueueIntervalModulo == 0){

        cacheObjKeys.forEach(function statsCachesUpdate(cacheName){
          if (cacheName == "nodesPerMinuteTopTermNodeTypeCache") {
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

async function loadBestRuntimeNetwork(p){

  const params = p || {};

  const folder = params.folder || bestNetworkFolder;
  let file = params.file || bestRuntimeNetworkFileName;

  try {

    const bRtNnObj = await tcUtils.loadFileRetry({folder: folder, file: file, noErrorNotFound: true});

    if (bRtNnObj) {

      bRtNnObj.matchRate = (bRtNnObj.matchRate !== undefined) ? bRtNnObj.matchRate : 0;

      console.log(chalkInfo("WAS | LOAD BEST NETWORK RUNTIME ID"
        + " | " + bRtNnObj.networkId
        + " | SUCCESS: " + bRtNnObj.successRate.toFixed(2) + "%"
        + " | MATCH: " + bRtNnObj.matchRate.toFixed(2) + "%"
      ));

      file = bRtNnObj.networkId + ".json";

      try{
        const nnObj = await tcUtils.loadFileRetry({folder: folder, file: file, noErrorNotFound: true});

        if (nnObj) { 

          nnObj.matchRate = (nnObj.matchRate !== undefined) ? nnObj.matchRate : 0;
          bestNetworkObj = {};
          bestNetworkObj = deepcopy(nnObj);

          console.log(chalk.green.bold("WAS | +++ LOADED BEST NETWORK: " + bestNetworkObj.networkId));

          statsObj.bestNetwork = pick(bestNetworkObj, statsBestNetworkPickArray);

          if (statsObj.previousBestNetworkId != bestNetworkObj.networkId) {
            console.log(chalk.green.bold("WAS | >>> BEST NETWORK CHANGE"
              + " | PREV: " + statsObj.previousBestNetworkId
              + " > NEW: " + bestNetworkObj.networkId
            ));
            statsObj.previousBestNetworkId = bestNetworkObj.networkId;
            configEvents.emit("NEW_BEST_NETWORK", bestNetworkObj.networkId);
          }

          return bestNetworkObj.networkId;
        }
      }
      catch(e){

        console.log(chalkError("WAS | *** ERROR LOAD BEST NETWORK RUNTIME ID: " +e));
        console.log(chalkAlert("WAS | ... SEARCH DB FOR BEST RUNTIME NETWORK: " + bRtNnObj.networkId));

      }
    }

    const nnArray = await wordAssoDb.NeuralNetwork.find({"overallMatchRate": { $lt: 100 }}).sort({"overallMatchRate": -1}).limit(1);

    if (nnArray.length == 0){
      console.log(chalkError("WAS | *** NEURAL NETWORK NOT FOUND"));
      return;
    }

    bestNetworkObj = {};
    bestNetworkObj = nnArray[0];
    
    if (empty(bestNetworkObj.matchRate)) { bestNetworkObj.matchRate = 0; }
    if (empty(bestNetworkObj.overallMatchRate)) { bestNetworkObj.overallMatchRate = 0; }
    
    statsObj.bestNetwork = pick(bestNetworkObj, statsBestNetworkPickArray);

    if (statsObj.previousBestNetworkId != bestNetworkObj.networkId) {
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

    return bestNetworkObj.networkId;
  }
  catch(err){
    if (err.code == "ETIMEDOUT") {
      console.log(chalkError("WAS | *** LOAD BEST NETWORK ERROR: NETWORK TIMEOUT:  " 
        + folder + "/" + file
      ));
    }
    else if (err.code == "ENOTFOUND") {
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
    throw err;
  }
}

async function loadConfigFile(params) {

  const fullPath = params.folder + "/" + params.file;

  if (configuration.offlineMode) {
    await loadCommandLineArgs();
    return;
  }

  try{
    const loadedConfigObj = await tcUtils.loadFileRetry({folder: params.folder, file: params.file});

    if (empty(loadedConfigObj)) {
      console.log(chalkError("WAS | DROPBOX CONFIG LOAD FILE ERROR | JSON UNDEFINED ??? "));
      throw new Error("JSON UNDEFINED");
    }

    console.log(chalkInfo("WAS | LOADED CONFIG FILE: " + params.file + "\n" + jsonPrint(loadedConfigObj)));

    const newConfiguration = {};
    newConfiguration.metrics = {};
    newConfiguration.threeceeUsers = [];

    if (loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG !== undefined){
      console.log("WAS | LOADED WAS_USER_PROFILE_ONLY_FLAG: " + loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG);

      if ((loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == false) || (loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == "false")) {
        newConfiguration.userProfileOnlyFlag = false;
      }
      else if ((loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == true) || (loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == "true")) {
        newConfiguration.userProfileOnlyFlag = true;
      }
      else {
        newConfiguration.userProfileOnlyFlag = false;
      }
    }

    if (loadedConfigObj.TWEET_VERSION_2 !== undefined){
      console.log("WAS | LOADED TWEET_VERSION_2: " + loadedConfigObj.TWEET_VERSION_2);

      if ((loadedConfigObj.TWEET_VERSION_2 == false) || (loadedConfigObj.TWEET_VERSION_2 == "false")) {
        newConfiguration.tweetVersion2 = false;
      }
      else if ((loadedConfigObj.TWEET_VERSION_2 == true) || (loadedConfigObj.TWEET_VERSION_2 == "true")) {
        newConfiguration.tweetVersion2 = true;
      }
      else {
        newConfiguration.tweetVersion2 = false;
      }
    }

    if (loadedConfigObj.WAS_TEST_MODE !== undefined){
      console.log("WAS | LOADED WAS_TEST_MODE: " + loadedConfigObj.WAS_TEST_MODE);

      if ((loadedConfigObj.WAS_TEST_MODE == false) || (loadedConfigObj.WAS_TEST_MODE == "false")) {
        newConfiguration.testMode = false;
      }
      else if ((loadedConfigObj.WAS_TEST_MODE == true) || (loadedConfigObj.WAS_TEST_MODE == "true")) {
        newConfiguration.testMode = true;
      }
      else {
        newConfiguration.testMode = false;
      }
    }

    if (loadedConfigObj.VERBOSE !== undefined){
      console.log("WAS | LOADED VERBOSE: " + loadedConfigObj.VERBOSE);

      if ((loadedConfigObj.VERBOSE == false) || (loadedConfigObj.VERBOSE == "false")) {
        newConfiguration.verbose = false;
      }
      else if ((loadedConfigObj.VERBOSE == true) || (loadedConfigObj.VERBOSE == "true")) {
        newConfiguration.verbose = true;
      }
      else {
        newConfiguration.verbose = false;
      }
    }

    if (loadedConfigObj.BINARY_MODE !== undefined){
      console.log("WAS | LOADED BINARY_MODE: " + loadedConfigObj.BINARY_MODE);

      if ((loadedConfigObj.BINARY_MODE == false) || (loadedConfigObj.BINARY_MODE == "false")) {
        newConfiguration.binaryMode = false;
      }
      else if ((loadedConfigObj.BINARY_MODE == true) || (loadedConfigObj.BINARY_MODE == "true")) {
        newConfiguration.binaryMode = true;
      }
      else {
        newConfiguration.binaryMode = false;
      }
    }

    if (loadedConfigObj.IGNORE_CATEGORY_RIGHT !== undefined){
      console.log("WAS | LOADED IGNORE_CATEGORY_RIGHT: " + loadedConfigObj.IGNORE_CATEGORY_RIGHT);

      if ((loadedConfigObj.IGNORE_CATEGORY_RIGHT == false) || (loadedConfigObj.IGNORE_CATEGORY_RIGHT == "false")) {
        newConfiguration.ignoreCategoryRight = false;
      }
      else if ((loadedConfigObj.IGNORE_CATEGORY_RIGHT == true) || (loadedConfigObj.IGNORE_CATEGORY_RIGHT == "true")) {
        newConfiguration.ignoreCategoryRight = true;
      }
      else {
        newConfiguration.ignoreCategoryRight = false;
      }
    }

    if (loadedConfigObj.ENABLE_GEOCODE !== undefined){
      console.log("WAS | LOADED ENABLE_GEOCODE: " + loadedConfigObj.ENABLE_GEOCODE);

      if ((loadedConfigObj.ENABLE_GEOCODE == false) || (loadedConfigObj.ENABLE_GEOCODE == "false")) {
        newConfiguration.enableGeoCode = false;
      }
      else if ((loadedConfigObj.ENABLE_GEOCODE == true) || (loadedConfigObj.ENABLE_GEOCODE == "true")) {
        newConfiguration.enableGeoCode = true;
      }
      else {
        newConfiguration.enableGeoCode = false;
      }
    }

    if (loadedConfigObj.FILTER_RETWEETS !== undefined){
      console.log("WAS | LOADED FILTER_RETWEETS: " + loadedConfigObj.FILTER_RETWEETS);

      if ((loadedConfigObj.FILTER_RETWEETS == false) || (loadedConfigObj.FILTER_RETWEETS == "false")) {
        newConfiguration.filterRetweets = false;
      }
      else if ((loadedConfigObj.FILTER_RETWEETS == true) || (loadedConfigObj.FILTER_RETWEETS == "true")) {
        newConfiguration.filterRetweets = true;
      }
      else {
        newConfiguration.filterRetweets = true;
      }
    }

    if (loadedConfigObj.FILTER_DUPLICATE_TWEETS !== undefined){
      console.log("WAS | LOADED FILTER_DUPLICATE_TWEETS: " + loadedConfigObj.FILTER_DUPLICATE_TWEETS);

      if ((loadedConfigObj.FILTER_DUPLICATE_TWEETS == false) || (loadedConfigObj.FILTER_DUPLICATE_TWEETS == "false")) {
        newConfiguration.filterDuplicateTweets = false;
      }
      else if ((loadedConfigObj.FILTER_DUPLICATE_TWEETS == true) || (loadedConfigObj.FILTER_DUPLICATE_TWEETS == "true")) {
        newConfiguration.filterDuplicateTweets = true;
      }
      else {
        newConfiguration.filterDuplicateTweets = true;
      }
    }

    if (loadedConfigObj.UNCAT_USER_ID_CACHE_DEFAULT_TTL !== undefined){
      console.log("WAS | LOADED UNCAT_USER_ID_CACHE_DEFAULT_TTL: " + loadedConfigObj.UNCAT_USER_ID_CACHE_DEFAULT_TTL);
      newConfiguration.uncatUserCacheTtl = loadedConfigObj.UNCAT_USER_ID_CACHE_DEFAULT_TTL;
    }

    if (loadedConfigObj.MISMATCH_USER_ID_CACHE_DEFAULT_TTL !== undefined){
      console.log("WAS | LOADED MISMATCH_USER_ID_CACHE_DEFAULT_TTL: " + loadedConfigObj.MISMATCH_USER_ID_CACHE_DEFAULT_TTL);
      newConfiguration.mismatchUserCacheTtl = loadedConfigObj.MISMATCH_USER_ID_CACHE_DEFAULT_TTL;
    }

    if (loadedConfigObj.ENABLE_IMAGE_ANALYSIS !== undefined){
      console.log("WAS | LOADED ENABLE_IMAGE_ANALYSIS: " + loadedConfigObj.ENABLE_IMAGE_ANALYSIS);

      if ((loadedConfigObj.ENABLE_IMAGE_ANALYSIS == false) || (loadedConfigObj.ENABLE_IMAGE_ANALYSIS == "false")) {
        newConfiguration.enableImageAnalysis = false;
      }
      else if ((loadedConfigObj.ENABLE_IMAGE_ANALYSIS == true) || (loadedConfigObj.ENABLE_IMAGE_ANALYSIS == "true")) {
        newConfiguration.enableImageAnalysis = true;
      }
      else {
        newConfiguration.enableImageAnalysis = false;
      }
    }

    if (loadedConfigObj.FORCE_IMAGE_ANALYSIS !== undefined){
      console.log("WAS | LOADED FORCE_IMAGE_ANALYSIS: " + loadedConfigObj.FORCE_IMAGE_ANALYSIS);

      if ((loadedConfigObj.FORCE_IMAGE_ANALYSIS == false) || (loadedConfigObj.FORCE_IMAGE_ANALYSIS == "false")) {
        newConfiguration.forceImageAnalysis = false;
      }
      else if ((loadedConfigObj.FORCE_IMAGE_ANALYSIS == true) || (loadedConfigObj.FORCE_IMAGE_ANALYSIS == "true")) {
        newConfiguration.forceImageAnalysis = true;
      }
      else {
        newConfiguration.forceImageAnalysis = false;
      }
    }

    if (loadedConfigObj.AUTO_FOLLOW !== undefined){
      console.log("WAS | LOADED AUTO_FOLLOW: " + loadedConfigObj.AUTO_FOLLOW);

      if ((loadedConfigObj.AUTO_FOLLOW == false) || (loadedConfigObj.AUTO_FOLLOW == "false")) {
        newConfiguration.autoFollow = false;
      }
      else if ((loadedConfigObj.AUTO_FOLLOW == true) || (loadedConfigObj.AUTO_FOLLOW == "true")) {
        newConfiguration.autoFollow = true;
      }
      else {
        newConfiguration.autoFollow = false;
      }
    }

    if (loadedConfigObj.FORCE_FOLLOW !== undefined){
      console.log("WAS | LOADED FORCE_FOLLOW: " + loadedConfigObj.FORCE_FOLLOW);

      if ((loadedConfigObj.FORCE_FOLLOW == false) || (loadedConfigObj.FORCE_FOLLOW == "false")) {
        newConfiguration.forceFollow = false;
      }
      else if ((loadedConfigObj.FORCE_FOLLOW == true) || (loadedConfigObj.FORCE_FOLLOW == "true")) {
        newConfiguration.forceFollow = true;
      }
      else {
        newConfiguration.forceFollow = false;
      }
    }

    if (loadedConfigObj.WAS_ENABLE_STDIN !== undefined){
      console.log("WAS | LOADED WAS_ENABLE_STDIN: " + loadedConfigObj.WAS_ENABLE_STDIN);

      if ((loadedConfigObj.WAS_ENABLE_STDIN == false) || (loadedConfigObj.WAS_ENABLE_STDIN == "false")) {
        newConfiguration.enableStdin = false;
      }
      else if ((loadedConfigObj.WAS_ENABLE_STDIN == true) || (loadedConfigObj.WAS_ENABLE_STDIN == "true")) {
        newConfiguration.enableStdin = true;
      }
      else {
        newConfiguration.enableStdin = false;
      }
    }

    if (loadedConfigObj.NODE_METER_ENABLED !== undefined){

      console.log("WAS | LOADED NODE_METER_ENABLED: " + loadedConfigObj.NODE_METER_ENABLED);

      if (loadedConfigObj.NODE_METER_ENABLED == "true") {
        newConfiguration.metrics.nodeMeterEnabled = true;
      }
      else if (loadedConfigObj.NODE_METER_ENABLED == "false") {
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

    // if (loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD !== undefined){
    //   console.log("WAS | LOADED TRENDING_CACHE_CHECK_PERIOD: " + loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD);
    //   newConfiguration.trendingCacheCheckPeriod = loadedConfigObj.TRENDING_CACHE_CHECK_PERIOD;
    // }

    if (loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL !== undefined){
      console.log("WAS | LOADED TRENDING_CACHE_DEFAULT_TTL: " + loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL);
      newConfiguration.trendingCacheTtl = loadedConfigObj.TRENDING_CACHE_DEFAULT_TTL;
    }

    if (loadedConfigObj.MIN_FOLLOWERS_AUTO_FOLLOW !== undefined){
      console.log("WAS | LOADED MIN_FOLLOWERS_AUTO_FOLLOW: " + loadedConfigObj.MIN_FOLLOWERS_AUTO_FOLLOW);
      newConfiguration.minFollowersAutoFollow = loadedConfigObj.MIN_FOLLOWERS_AUTO_FOLLOW;
    }

    if (loadedConfigObj.MIN_FOLLOWERS_AUTO_CATEGORIZE !== undefined){
      console.log("WAS | LOADED MIN_FOLLOWERS_AUTO_CATEGORIZE: " + loadedConfigObj.MIN_FOLLOWERS_AUTO_CATEGORIZE);
      newConfiguration.minFollowersAutoCategorize = loadedConfigObj.MIN_FOLLOWERS_AUTO_CATEGORIZE;
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

    return newConfiguration;

  }
  catch(err){
    console.log(chalkError("WAS | ERROR LOAD DROPBOX CONFIG: " + fullPath
      + "\n" + jsonPrint(err)
    ));
    throw err;
  }
}

async function loadAllConfigFiles(){

  statsObj.status = "LOAD CONFIG";

  const defaultConfig = await loadConfigFile({folder: configDefaultFolder, file: configDefaultFile});

  if (defaultConfig) {
    defaultConfiguration = defaultConfig;
    console.log(chalk.green("WAS | +++ RELOADED DEFAULT CONFIG " + configDefaultFolder + "/" + configDefaultFile));
  }

  const hostConfig = await loadConfigFile({folder: configHostFolder, file: configHostFile});

  if (hostConfig) {
    hostConfiguration = hostConfig;
    console.log(chalk.green("WAS | +++ RELOADED HOST CONFIG " + configHostFolder + "/" + configHostFile));
  }

  const defaultAndHostConfig = merge(defaultConfiguration, hostConfiguration); // host settings override defaults
  const tempConfig = merge(configuration, defaultAndHostConfig); // any new settings override existing config

  configuration = tempConfig;
  configuration.threeceeUsers = _.uniq(configuration.threeceeUsers); // merge concats arrays!

  filterDuplicateTweets = configuration.filterDuplicateTweets;
  filterRetweets = configuration.filterRetweets;

  // if (filterRetweets) { 
  console.log(chalkWarn(MODULE_ID_PREFIX + " | -X- FILTER RETWEETS: " + filterRetweets));
  // }

  maxQueue = configuration.maxQueue;

  return;
}

function initStatsUpdate() {

  return new Promise(function(resolve, reject){

    try {
      console.log(chalkTwitter("WAS | INIT STATS UPDATE INTERVAL | " + msToTime(configuration.statsUpdateIntervalTime)));

      showStats(true);

      clearInterval(statsInterval);

      statsInterval = setInterval(async function updateStats() {

        try{
          const childArray = await getChildProcesses({searchTerm: "ALL"});

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
            // debug(chalkLog("NEW MAX NODE METER ENTRIES"
            //   + " | " + getTimeStamp()
            //   + " | " + statsObj.nodeMeterEntries.toFixed(0)
            // ));
          }

          if (adminNameSpace) { statsObj.admin.connected = Object.keys(adminNameSpace.connected).length; }// userNameSpace.sockets.length ;
          if (utilNameSpace) { statsObj.entity.util.connected = Object.keys(utilNameSpace.connected).length; } // userNameSpace.sockets.length ;
          if (viewNameSpace) { statsObj.entity.viewer.connected = Object.keys(viewNameSpace.connected).length; } // userNameSpace.sockets.length ;

          saveFileQueue.push({folder: statsHostFolder, file: statsFile, obj: statsObj});

          showStats();

          if (statsObj.twitNotReadyWarning) { statsObj.twitNotReadyWarning = false; }
        }
        catch(err){
          console.log(chalkError("WAS | *** STATS UPDATE ERROR: " + err));
        }
         
      }, configuration.statsUpdateIntervalTime);

      resolve();
    }
    catch(err){
      reject(err);
    }

  });
}

async function initConfig() {

  statsObj.status = "INIT CONFIG";

  configuration.processName = process.env.PROCESS_NAME || "node_wordAssoServer";
  configuration.verbose = process.env.VERBOSE || false;
  configuration.quitOnError = process.env.QUIT_ON_ERROR || false;
  configuration.enableStdin = process.env.ENABLE_STDIN || true;
  configuration.statsUpdateIntervalTime = process.env.WAS_STATS_UPDATE_INTERVAL || 10*ONE_MINUTE;

  console.log(chalkTwitter("WAS | THREECEE USERS\n" + jsonPrint(configuration.threeceeUsers)));

  threeceeTwitter.twit = {};
  threeceeTwitter.twitterConfig = {};
  threeceeTwitter.ready = false;
  threeceeTwitter.status = "UNCONFIGURED";
  threeceeTwitter.error = false;
  threeceeTwitter.twitterFollowing = 0;
  threeceeTwitter.twitterFriends = [];
  threeceeTwitter.twitterFollowLimit = false;
  threeceeTwitter.twitterAuthorizationErrorFlag = false;
  threeceeTwitter.twitterErrorFlag = false;
  threeceeTwitter.twitterTokenErrorFlag = false;
  threeceeTwitter.twitterCredentialErrorFlag = false;
  threeceeTwitter.twitterRateLimitException = false;
  threeceeTwitter.twitterRateLimitExceptionFlag = false;
  threeceeTwitter.twitterRateLimitResetAt = false;

  for (const user of configuration.threeceeInfoUsersArray){
    threeceeInfoTwitter.twit = {};
    threeceeInfoTwitter.twitterConfig = {};
    threeceeInfoTwitter.ready = false;
    threeceeInfoTwitter.status = "UNCONFIGURED";
    threeceeInfoTwitter.error = false;
    threeceeInfoTwitter.screenName = user.screenName;
    threeceeInfoTwitter.twitterFollowing = 0;
    threeceeInfoTwitter.twitterFriends = [];
    threeceeInfoTwitter.twitterFollowLimit = false;
    threeceeInfoTwitter.twitterAuthorizationErrorFlag = false;
    threeceeInfoTwitter.twitterErrorFlag = false;
    threeceeInfoTwitter.twitterTokenErrorFlag = false;
    threeceeInfoTwitter.twitterCredentialErrorFlag = false;
    threeceeInfoTwitter.twitterRateLimitException = false;
    threeceeInfoTwitter.twitterRateLimitExceptionFlag = false;
    threeceeInfoTwitter.twitterRateLimitResetAt = false;

    // debug(chalkTwitter("WAS | THREECEE INFO USER @" + user + "\n" + jsonPrint(threeceeInfoTwitter)));
  }

  try {

    await loadAllConfigFiles();
    await loadCommandLineArgs();

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

    if (configuration.enableStdin) { await initStdIn(); }

    await initStatsUpdate(configuration);

    statsObj.configuration = configuration;

    return configuration;

  }
  catch(err){
    console.log(chalkLog("WAS | *** INIT CONFIG ERROR: " + err));
    throw err;
  }
}

async function initDbUserChangeStream(){

  const userCollection = dbConnection.collection("users");

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

        if (empty(catObj)) {
          catObj = {};
          catObj.screenName = change.fullDocument.screenName;
          catObj.nodeId = change.fullDocument.nodeId;
        }

        catObj.manual = categoryChanges.manual || catObj.manual;
        catObj.auto = categoryChanges.auto || catObj.auto;

        categorizedUserHashMap.set(catObj.nodeId, catObj);
      }
    }
  });

  return;
}

function initCategoryHashmaps(){

  return new Promise(function(resolve, reject){

    console.log(chalkBlue("WAS | ... INITIALIZING CATEGORIZED USER + HASHTAG HASHMAPS FROM DB"));
  
    async.series({

      user: function(cb){

        const p = {};

        p.projection = "nodeId userId screenName category categoryAuto";

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

        console.log(chalkInfo("WAS | LOADING CATEGORIZED USERS FROM DB ..."));

        async.whilst(

          function test(cbTest) {
            // cbTest(null, statsObj.dbConnectionReady && more);
            cbTest(null, more);
          },

          function(cb0){

            if (!userServerControllerReady || !statsObj.dbConnectionReady) {
              console.log(chalkAlert("WAS | *** NOT READY"
                + " | statsObj.dbConnectionReady: " + statsObj.dbConnectionReady
                + " | userServerControllerReady: " + userServerControllerReady
              ));
              return cb0(new Error("userServerController not ready"), null);
            }

            userServerController.findCategorizedUsersCursor(p, function(err, results){

              if (err) {
                console.log(chalkError("WAS | ERROR: initCategorizedUserHashmap: userServerController: findCategorizedUsersCursor: " + err));
                return cb0(err);
              }
              
              if (results) {

                statsObj.db.totalUsers = results.totalUsers;

                more = true;
                totalCount += results.count;
                totalManual += results.manual;
                totalAuto += results.auto;
                totalMatched += results.matched;
                totalMismatched += results.mismatched;

                totalMatchRate = 100*(totalMatched/(totalMatched+totalMismatched));

                console.log(chalkLog("WAS | ... LOADING CATEGORIZED USERS FROM DB"
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

                for (const nodeId of Object.keys(results.obj)){

                  categorizedUserHashMap.set(
                    results.obj[nodeId].nodeId, 
                    { 
                      nodeId: results.obj[nodeId].nodeId, 
                      screenName: results.obj[nodeId].screenName, 
                      manual: results.obj[nodeId].category, 
                      auto: results.obj[nodeId].categoryAuto
                    }
                  );
                }

                p.skip += results.count;

                cb0(null, null);
              }
              else {

                more = false;

                console.log(chalk.bold.blue("WAS | +++ LOADED CATEGORIZED USERS FROM DB"
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

                cb0(null, null);
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

        console.log(chalkLog("WAS | ... LOADING CATEGORIZED HASHTAGS FROM DB"));

        async.whilst(

          function test(cbTest) {
            cbTest(null, more);
          },

          function(cb0){

            if (!hashtagServerControllerReady || !statsObj.dbConnectionReady) {
              console.log(chalkAlert("WAS | *** NOT READY"
                + " | statsObj.dbConnectionReady: " + statsObj.dbConnectionReady
                + " | hashtagServerControllerReady: " + hashtagServerControllerReady
              ));
              return cb0(new Error("hashtagServerController not ready"), null);
            }

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

                cb0(null, null);
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

                cb0(null, null);
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

    console.log(MODULE_ID_PREFIX + " | STDIN ENABLED");

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

    updateUserSetsInterval = setInterval(async function() {

      try {
        if (statsObj.dbConnectionReady && updateUserSetsIntervalReady) {
          updateUserSetsIntervalReady = false;
          await updateUserSets();
          updateUserSetsIntervalReady = true;
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

async function initThreeceeTwitterUser(threeceeUser){

  console.log(chalkTwitter("WAS | ... INIT THREECEE TWITTER USER: " + threeceeUser));

  console.log(chalkTwitter("WAS | ... LOADING TWITTER CONFIG | @" + threeceeUser));

  const configFile = threeceeUser + ".json";

  try {

    // threeceeTwitter.twitterConfig = {};
    // threeceeTwitter.twitterConfig = await tcUtils.loadFileRetry({folder: twitterConfigFolder, file: configFile});

    // console.log(chalkTwitter("WAS | +++ LOADED TWITTER CONFIG"
    //   + " | 3C @" + threeceeUser
    //   + " | " + twitterConfigFolder + "/" + configFile
    //   + "\nCONFIG\n" + jsonPrint(threeceeTwitter.twitterConfig)
    // ));

    threeceeTwitter.twitterConfig = await tcUtils.initTwitterConfig({folder: twitterConfigFolder, threeceeUser: threeceeUser});
    await tcUtils.initTwitter({twitterConfig: threeceeTwitter.twitterConfig});
    await tcUtils.getTwitterAccountSettings();

    console.log(chalkTwitter("WAS | +++ TWITTER INITIALIZED"
      + " | 3C @" + threeceeUser
      + "\nCONFIG\n" + jsonPrint(threeceeTwitter.twitterConfig)
    ));

    // threeceeTwitter.twit = new Twit({
    //   consumer_key: threeceeTwitter.twitterConfig.consumer_key, 
    //   consumer_secret: threeceeTwitter.twitterConfig.consumer_secret,
    //   app_only_auth: true
    // });

    threeceeTwitter.ready = true;
    threeceeTwitter.status = false;
    threeceeTwitter.error = false;
    statsObj.threeceeUsersConfiguredFlag = true;
    return threeceeUser;
  }
  catch(err) {

    if (err.code == "ENOTFOUND") {
      console.log(chalkError("WAS | *** LOAD TWITTER CONFIG ERROR: FILE NOT FOUND"
        + " | " + twitterConfigFolder + "/" + configFile
      ));
    }
    else {
      console.log(chalkError("WAS | *** LOAD TWITTER CONFIG ERROR: " + err));
    }

    threeceeTwitter.error = "CONFIG LOAD ERROR: " + err;
    threeceeTwitter.ready = false;
    threeceeTwitter.twit = false;
    threeceeTwitter.status = false;

    throw err;
  }
}

async function twitterGetUserUpdateDb(params){

  const user = params.user;
  const following = params.following;

  if (!user.userId && !user.nodeId && !user.screenName) { throw new Error("NO USER PROPS"); }

  try{
    if (configuration.verbose) {
      printUserObj("WAS | GET USER TWITTER DATA", user);
    }

    const twitQuery = {};

    twitQuery.include_entities = true;

    if (user.nodeId !== undefined) { twitQuery.user_id = user.nodeId; }
    else if (user.userId !== undefined) { twitQuery.user_id = user.userId; }
    else if (user.screenName !== undefined) { twitQuery.screen_name = user.screenName; }

    const rawUser = await tcUtils.twitterUsersShow({user: user, twitQuery: twitQuery, following: following});
    const cUser = await userServerController.convertRawUserPromise({user: rawUser});

    if (configuration.verbose) {
      printUserObj("WAS | FOUND users/show rawUser", cUser);
    }

    if (params.following !== undefined){
      user.following = params.following;
    }

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

    if (nCacheObj !== undefined) {
      user.mentions = Math.max(user.mentions, nCacheObj.mentions);
    }

    user.setMentions = true;

    const updatedUser = await userServerController.findOneUserV2({user: user, mergeHistograms: false, noInc: true});

    if (configuration.verbose) {
      console.log(chalk.blue("WAS | UPDATED updatedUser"
        + " | PREV CR: " + previousUserUncategorizedCreated.format(compactDateTimeFormat)
        + " | USER CR: " + getTimeStamp(updatedUser.createdAt)
        + "\n" + printUser({user: updatedUser})
      ));
    }

    return updatedUser;

  }
  catch(err){
    console.log(chalkError("WAS | ***ERROR twitterGetUserUpdateDb"
      + "\n" + printUser({user: user})
    ));
    throw err;
  }
}

async function twitterSearchUserNode(params){

  const user = params.user;
  const following = params.following;
  const searchMode = params.searchMode;

  try {

    const dbUser = await wordAssoDb.User.findOne(user);

    if (dbUser) {

      printUserObj("WAS | SEARCH DB | MODE: " + searchMode + " | FOUND USER", dbUser);

      const updatedUser = await twitterGetUserUpdateDb({user: dbUser, following: following});

      if (updatedUser) { 
        return updatedUser;
      }
      return;
    }

    console.log(chalkLog("WAS | SEARCH DB | MODE: " + searchMode + " | USER NOT FOUND | @" + user.screenName + " | NID: " + user.nodeId
      + "\nUSER\n" + jsonPrint(user)
    ));

    const newUser = await twitterGetUserUpdateDb({user: user, following: following});
    if (newUser) { return newUser; }
    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** TWITTER SEARCH NODE USER ERROR | MODE: " + searchMode
      + "\nsearchQuery\n" + jsonPrint(user)
      + "ERROR: ", err
    ));
    throw err;
  }
}

function uncatUserCacheCheck(nodeId){
  return new Promise(function(resolve){

    const uncatUserObj = uncatUserCache.get(nodeId);
    if (!uncatUserObj || (uncatUserObj == undefined)){
      resolve(false);
    }
    else {
      resolve(uncatUserObj);
    }

  });
}

async function processTwitterSearchNode(params) {

  let uncatUserCacheHit = false;
  let uncategorizable = false;

  if (params.user) {

    console.log(chalkBlue("WAS | T> TWITTER_SEARCH_NODE"
      + " | " + getTimeStamp()
      + " | MODE: " + params.searchMode
      + " | SPECIFIC USER: " + params.specificUserFlag
      + " | NID: " + params.user.nodeId
      + " | @" + params.user.screenName
    ));

    const categorizeable = await userCategorizeable(params.user);
    const uuObj = await uncatUserCacheCheck(params.user.nodeId);

    if (params.specificUserFlag) {
      if (tfeChild && params.user.toObject && (typeof params.user.toObject == "function")) {
        tfeChild.send({op: "USER_CATEGORIZE", priorityFlag: true, searchMode: params.searchMode, user: params.user.toObject()});

        if (params.user.category == "left" || params.user.category == "right" || params.user.category == "neutral") {
          uncatUserCache.del(params.user.nodeId);
        }
      }
      else if (tfeChild) {
        tfeChild.send({op: "USER_CATEGORIZE", priorityFlag: true, searchMode: params.searchMode, user: params.user});
        if (params.user.category == "left" || params.user.category == "right" || params.user.category == "neutral") {
          uncatUserCache.del(params.user.nodeId);
        }
      }
    }
    else if (categorizeable && !uuObj) { 

      uncatUserCacheHit = false;

      const uncatUserObj = {};

      uncatUserObj.nodeId = params.user.nodeId;
      uncatUserObj.screenName = params.user.screenName;
      uncatUserObj.timeStamp = getTimeStamp();

      console.log(chalk.yellow(MODULE_ID_PREFIX
        + " | --- MISS | UNCAT USER $"
        + " | TTL: " + msToTime(configuration.uncatUserCacheTtl*1000)
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
        + " | CAT VERIFIED: " + params.user.categoryVerified
        + " | CAT M: " + params.user.category
        + " | CAT A: " + params.user.categoryAuto
        + " | $ EXPIRED: " + statsObj.caches.uncatUserCache.expired
        + "\nUNCAT USER $ STATS\n" + jsonPrint(uncatUserCache.getStats())
      ));

      mismatchUserSet.delete(params.user.nodeId);

      if (empty(params.user.category) || (params.user.category === "none") || !params.user.category || (params.user.category === "false")) {
        uncatUserCache.set(
          params.user.nodeId, 
          uncatUserObj,
          configuration.uncatUserCacheTtl
        );
      }

      if (!empty(params.user.category) && (params.user.category != params.user.categoryAuto)) {

        const mismatchUserObj = {};

        mismatchUserObj.nodeId = params.user.nodeId;
        mismatchUserObj.screenName = params.user.screenName;
        mismatchUserObj.timeStamp = getTimeStamp();

        mismatchUserCache.set(
          params.user.nodeId, 
          mismatchUserObj,
          configuration.mismatchUserCacheTtl
        );

        console.log(chalk.blue(MODULE_ID_PREFIX
          + " | --- MISS | MISMATCH USER $"
          + " | TTL: " + msToTime(configuration.mismatchUserCacheTtl*1000)
          + " | NID: " + params.user.nodeId
          + " | @" + params.user.screenName
          + " | CAT VERIFIED: " + params.user.categoryVerified
          + " | CAT M: " + params.user.category
          + " | CAT A: " + params.user.categoryAuto
          + " | $ EXPIRED: " + statsObj.caches.mismatchUserCache.expired
          + "\nMISMATCH USER $ STATS\n" + jsonPrint(mismatchUserCache.getStats())
        ));

      }

      if (tfeChild && params.user.toObject && (typeof params.user.toObject == "function")) {
        tfeChild.send({op: "USER_CATEGORIZE", priorityFlag: true, searchMode: params.searchMode, user: params.user.toObject()});
        if (params.user.category == "left" || params.user.category == "right" || params.user.category == "neutral") {
          uncatUserCache.del(params.user.nodeId);
        }
      }
      else if (tfeChild) {
        tfeChild.send({op: "USER_CATEGORIZE", priorityFlag: true, searchMode: params.searchMode, user: params.user});
        if (params.user.category == "left" || params.user.category == "right" || params.user.category == "neutral") {
          uncatUserCache.del(params.user.nodeId);
        }
      }
    }
    else if (categorizeable && uuObj) { 

      uncatUserCacheHit = true;

      uuObj.timeStamp = getTimeStamp();

      console.log(chalkBlue(MODULE_ID_PREFIX
        + " | +++ HIT  | UNCAT USER $"
        + " | TTL: " + msToTime(configuration.uncatUserCacheTtl*1000)
        + " | NID: " + uuObj.nodeId
        + " | @" + uuObj.screenName
        + " | TS: " + uuObj.timeStamp
        + " | $ EXPIRED: " + statsObj.caches.uncatUserCache.expired
        + "\nUNCAT USER $ STATS\n" + jsonPrint(uncatUserCache.getStats())
      ));
    }
    else if (uuObj) {
      uncategorizable = true;
      uncatUserCacheHit = true;
      console.log(chalk.yellow(MODULE_ID_PREFIX
        + " | +++ HIT (NOT CATEGORIZABLE)  | UNCAT USER $"
        + " | TTL: " + msToTime(configuration.uncatUserCacheTtl*1000)
        + " | NID: " + uuObj.nodeId
        + " | @" + uuObj.screenName
        + " | TS: " + uuObj.timeStamp
        + " | $ EXPIRED: " + statsObj.caches.uncatUserCache.expired
        + "\nUNCAT USER $ STATS\n" + jsonPrint(uncatUserCache.getStats())
      ));
    }
    else {
      uncategorizable = true;
      uncatUserCacheHit = false;
      console.log(chalkBlue(MODULE_ID_PREFIX
        + " | --- MISS (NOT CATEGORIZABLE)  | UNCAT USER $"
        + " | TTL: " + msToTime(configuration.uncatUserCacheTtl*1000)
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
        + " | CAT VERIFIED: " + params.user.categoryVerified
        + " | CAT M: " + params.user.category
        + " | CAT A: " + params.user.categoryAuto
        + " | $ EXPIRED: " + statsObj.caches.uncatUserCache.expired
        + "\nUNCAT USER $ STATS\n" + jsonPrint(uncatUserCache.getStats())
      ));
    }

    if (params.user.toObject && (typeof params.user.toObject == "function")) {
      const u = params.user.toObject();
      if (ignoredUserSet.has(u.nodeId) || ignoredUserSet.has(u.screenName.toLowerCase())){
        u.ignored = true;
      }
      if (followedUserSet.has(u.nodeId)){
        u.following = true;
        u.threeceeFollowing = "altthreecee00";
      }
      return {user: u, searchMode: params.searchMode, cacheHit: uncatUserCacheHit, uncategorizable: uncategorizable};
    }
    else{
      if (ignoredUserSet.has(params.user.nodeId) || ignoredUserSet.has(params.user.screenName.toLowerCase())){
        params.user.ignored = true;
      }
      if (followedUserSet.has(params.user.nodeId)){
        params.user.following = true;
        params.user.threeceeFollowing = "altthreecee00";
      }
      return {user: params.user, searchMode: params.searchMode, cacheHit: uncatUserCacheHit, uncategorizable: uncategorizable};
    }

  }
  else {

    console.log(chalkAlert("WAS | *** TWITTER_SEARCH_NODE | NOT FOUND"
      + " | " + getTimeStamp()
      + " | MODE: " + params.searchMode
      + " | NODE: " + params.searchNode
    ));

    viewNameSpace.emit("TWITTER_SEARCH_NODE_NOT_FOUND", { searchMode: params.searchMode, searchNode: params.searchNode, stats: statsObj.user });

    return {user: false, cacheHit: uncatUserCacheHit, uncategorizable: uncategorizable};

  }
}

function getNextSearchNode(params){

  return new Promise(function(resolve, reject){

    let notFoundAndMore = true;

    const searchNode = params.searchNode;
    const searchMode = params.searchMode;
    const searchUserArray = params.searchUserArray;

    let searchResults;
    let userSkipCount = 0;

    async.whilst(

      function test(cbTest) {
        cbTest(null, notFoundAndMore);
      },

      async function(){

        try {


          if ((searchUserArray.length == 0) || (userSkipCount >= configuration.maxUserSearchSkipCount)){
            notFoundAndMore = false;
            searchResults = await processTwitterSearchNode({searchMode: searchMode, searchNode: searchNode});
            return;
          }

          const searchUserId = searchUserArray.shift();

          uncategorizedManualUserSet.delete(searchUserId);

          mismatchUserSet.delete(searchUserId);
          statsObj.user.mismatched = mismatchUserSet.size;

          userAutoLeftSet.delete(searchUserId);
          userAutoNeutralSet.delete(searchUserId);
          userAutoRightSet.delete(searchUserId);

          statsObj.user.uncategorized.all = uncategorizedManualUserSet.size;
          statsObj.user.uncategorized.left = _.intersection([...userAutoLeftSet], [...uncategorizedManualUserSet]).length;
          statsObj.user.uncategorized.neutral = _.intersection([...userAutoNeutralSet], [...uncategorizedManualUserSet]).length;
          statsObj.user.uncategorized.right = _.intersection([...userAutoRightSet], [...uncategorizedManualUserSet]).length;

          const user = await twitterSearchUserNode({user: {nodeId: searchUserId}, searchMode: searchMode});

          if (empty(user)){

            if (params.searchUserArray.length > 0) {
              notFoundAndMore = true;
            }

            console.log(chalkAlert("WAS | ??? USER NOT FOUND"
              + " | MODE: " + searchMode
              + " | " + searchUserId
            ));

            return;
          }
          else{

            switch (searchMode){

              case "UNCAT":
                if (user.category && (user.category != "none")){
                  userSkipCount += 1;
                  printUserObj("WAS | ... SKIP SEARCH | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);
                  notFoundAndMore = true;
                  break;
                }

                printUserObj("WAS | --> UNCAT USER", user);
                searchResults = await processTwitterSearchNode({searchMode: searchMode, searchNode: searchNode, user: user});

                if (searchResults.cacheHit || searchResults.uncategorizable) {
                  notFoundAndMore = true;
                }
                else{
                  notFoundAndMore = false;
                }
              break;

              case "MISMATCH":
                if ((user.category !== undefined) && (user.category != "none") && user.categoryVerified){
                  userSkipCount += 1;
                  printUserObj("WAS | ... SKIP SRCH | VRFD | MODE: " + searchMode + " | SKIPPED: " + userSkipCount, user);
                  notFoundAndMore = true;
                  break;
                }
                else if ((user.category !== undefined) && (user.category != "none") && (user.category == user.categoryAuto)){
                  printUserObj("WAS | ... SKIP SRCH | MTCHD  | MODE: " + searchMode + " | SKIPPED: " + userSkipCount, user);
                  notFoundAndMore = true;
                  break;
                }

                printUserObj("WAS | --> MM USER", user);

                searchResults = await processTwitterSearchNode({searchMode: searchMode, searchNode: searchNode, user: user});

                if (searchResults.cacheHit || (user.category == user.categoryAuto) || searchResults.uncategorizable) {
                  notFoundAndMore = true;
                }
                else{
                  notFoundAndMore = false;
                }
              break;

              case "UNCAT_LEFT":

                if ((user.category && (user.category != "none")) || (user.categoryAuto != "left")){
                  userSkipCount += 1;
                  printUserObj("WAS | ... SKIP SEARCH USER | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);
                  notFoundAndMore = true;
                  break;
                }

                printUserObj("WAS | --> SEARCH USER FOUND | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);

                searchResults = await processTwitterSearchNode({searchMode: searchMode, searchNode: searchNode, user: user});

                if (searchResults.cacheHit || (user.categoryAuto !== "left") || searchResults.uncategorizable) {
                  notFoundAndMore = true;
                }
                else{
                  notFoundAndMore = false;
                }
              break;

              case "UNCAT_NEUTRAL":

                if ((user.category && (user.category != "none")) || (user.categoryAuto != "neutral")){
                  userSkipCount += 1;
                  printUserObj("WAS | ... SKIP SEARCH USER | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);
                  notFoundAndMore = true;
                  break;
                }

                printUserObj("WAS | --> SEARCH USER FOUND | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);

                searchResults = await processTwitterSearchNode({searchMode: searchMode, searchNode: searchNode, user: user});

                if (searchResults.cacheHit || (user.categoryAuto !== "neutral") || searchResults.uncategorizable) {
                  notFoundAndMore = true;
                }
                else{
                  notFoundAndMore = false;
                }
              break;

              case "UNCAT_RIGHT":
                if ((user.category && (user.category != "none")) || (user.categoryAuto != "right")){
                  userSkipCount += 1;
                  printUserObj("WAS | ... SKIP SEARCH USER | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);
                  notFoundAndMore = true;
                  break;
                }

                printUserObj("WAS | --> SEARCH USER FOUND | MODE: " + searchMode + " | SKIP COUNT: " + userSkipCount, user);

                searchResults = await processTwitterSearchNode({searchMode: searchMode, searchNode: searchNode, user: user});

                if (searchResults.cacheHit || (user.categoryAuto !== "right") || searchResults.uncategorizable) {
                  notFoundAndMore = true;
                }
                else{
                  notFoundAndMore = false;
                }
              break;

              default:
                console.log(chalkError(MODULE_ID_PREFIX + " | *** ERROR: UNKNOWN SEARCH MODE: " + searchMode));
                quit({cause: "UNKNOWN SEARCH MODE: " + searchMode});
            }

            return;
          }

        }
        catch(err){
          return err;
        }

      },

      function(err){
        if (err) {
          console.log(chalkError("WAS | *** getNextSearchNode ERROR: " + err + "\n" + jsonPrint(err)));
          return reject(err);
        }
        
        resolve(searchResults);
      }
    );
  });
}

async function twitterSearchUser(params) {

  const searchNode = params.searchNode;
  const searchNodeUser = { screenName: searchNode.substring(1) };

  let searchMode;
  let searchUserArray = [];

  const userAutoLeftArray = [...userAutoLeftSet];
  const userAutoRightArray = [...userAutoRightSet];
  const userAutoNeutralArray = [...userAutoNeutralSet];

  const uncategorizedManualUserArray = [...uncategorizedManualUserSet];

  statsObj.user.uncategorized.all = uncategorizedManualUserArray.length;
  statsObj.user.uncategorized.left = _.intersection(userAutoLeftArray, uncategorizedManualUserArray).length;
  statsObj.user.uncategorized.right = _.intersection(userAutoRightArray, uncategorizedManualUserArray).length;
  statsObj.user.uncategorized.neutral = _.intersection(userAutoNeutralArray, uncategorizedManualUserArray).length;

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

      case "?mm":
        searchMode = "MISMATCH";
        searchUserArray = _.shuffle([...mismatchUserSet]);
      break;

      case "?all":
        searchMode = "UNCAT";
        searchUserArray = _.shuffle(uncategorizedManualUserArray);
      break;

      case "?left":
        searchMode = "UNCAT_LEFT";
        searchUserArray = _.shuffle(uncategorizedManualUserArray);
      break;

      case "?right":
        searchMode = "UNCAT_RIGHT";
        searchUserArray = _.shuffle(uncategorizedManualUserArray);
      break;

      case "?neutral":
        searchMode = "UNCAT_NEUTRAL";
        searchUserArray = _.shuffle(uncategorizedManualUserArray);
      break;

      default:
        console.log(chalkError("WAS | *** UNKNOWN searchNodeUser.screenName: " + searchNodeUser.screenName));
        throw new Error("UNKNOWN searchNodeUser.screenName");
    }

    if (searchUserArray.length == 0) {

      console.log(chalkLog("WAS | --- TWITTER_SEARCH_NODE | NO USERS FOUND"
        + " | " + getTimeStamp()
        + " | MODE: " + searchMode
        + " [ SEARCH USER ARRAY: " + searchUserArray.length + "]"
      ));

      const message = {};
      
      message.user = {};
      message.user.notFound = true;
      message.searchNode = searchNode;
      message.stats = statsObj.user;

      viewNameSpace.emit("TWITTER_SEARCH_NODE_EMPTY_QUEUE", message);

      return;
    }

    try {
      await getNextSearchNode({searchMode: searchMode, searchNode: searchNode, searchUserArray: searchUserArray});
      return;
    }
    catch(err){
      console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
        + " [ UC USER ARRAY: " + searchUserArray.length + "]"
        + " | " + getTimeStamp()
        + " | MODE: " + searchMode + " | ERROR: " + err
      ));

      viewNameSpace.emit("TWITTER_SEARCH_NODE_ERROR", { searchNode: searchNode, stats: statsObj.user });
      throw err;
    }
  }      

  console.log(chalkInfo("WAS | SEARCH FOR SPECIFIC USER | @" + searchNodeUser.screenName));

  try {
    const user = await twitterSearchUserNode({user: {screenName: searchNodeUser.screenName}, searchMode: searchMode});
    await processTwitterSearchNode({specificUserFlag: true, searchMode: "SPECIFIC", searchNode: searchNode, user: user});
    return;
  }
  catch(err){
    console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE ERROR"
      + " | " + getTimeStamp()
      + " | SEARCH UNCATEGORIZED USER"
      + " | searchNodeUser: " + searchNodeUser
      + " | ERROR: " + err
    ));

    viewNameSpace.emit("TWITTER_SEARCH_NODE_ERROR", { searchNode: searchNode, stats: statsObj.user });
    throw err;
  }
}

async function twitterSearchHashtag(params) {

  const searchNode = params.searchNode.toLowerCase().trim();
  const searchNodeHashtag = { nodeId: searchNode.substring(1) };

  try {

    let hashtag = await wordAssoDb.Hashtag.findOne(searchNodeHashtag);

    if (hashtag) { 

      if (hashtag.toObject && (typeof hashtag.toObject == "function")) {
        console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG FOUND\n" + jsonPrint(hashtag.toObject())));
        viewNameSpace.emit("SET_TWITTER_HASHTAG", { hashtag: hashtag.toObject(), stats: statsObj.hashtag });
      }
      else{
        console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG FOUND\n" + jsonPrint(hashtag)));
        viewNameSpace.emit("SET_TWITTER_HASHTAG", { hashtag: hashtag, stats: statsObj.hashtag });
      }

      if (hashtag.category) { 

        const htCatObj = {};
        htCatObj.manual = hashtag.category;
        htCatObj.auto = false;

        if (categorizedHashtagHashMap.has(hashtag.nodeId.toLowerCase())) {
          htCatObj.auto = categorizedHashtagHashMap.get(hashtag.nodeId.toLowerCase()).auto || false;
          categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), htCatObj);
        }
        else{
          categorizedHashtagHashMap.set(hashtag.nodeId.toLowerCase(), htCatObj);
        }


      }
      return hashtag;
    }

    console.log(chalkTwitter("WAS | TWITTER_SEARCH_NODE HASHTAG NOT FOUND: #" + searchNodeHashtag.nodeId));
    console.log(chalkTwitter("WAS | +++ CREATE NEW HASHTAG: #" + searchNodeHashtag.nodeId));

    hashtag = new wordAssoDb.Hashtag({ nodeId: searchNodeHashtag.nodeId.toLowerCase(), text: searchNodeHashtag.nodeId.toLowerCase()});

    const newHashtag = await hashtag.save();

    console.log(chalk.blue("WAS | +++ SAVED NEW HASHTAG"
      + " | #" + newHashtag.nodeId
    ));


    if (hashtag.toObject && (typeof hashtag.toObject == "function")) {
      viewNameSpace.emit("SET_TWITTER_HASHTAG", { hashtag: hashtag.toObject(), stats: statsObj.hashtag });
    }
    else{
      viewNameSpace.emit("SET_TWITTER_HASHTAG", { hashtag: hashtag, stats: statsObj.hashtag });
    }

    return newHashtag;

  }
  catch(err){
    console.log(chalkError("WAS | *** TWITTER_SEARCH_NODE HASHTAG ERROR\n" + jsonPrint(err)));
    throw err;
  }
}

async function twitterSearchNode(params) {

  const searchNode = params.searchNode.toLowerCase().trim();

  console.log(chalkSocket("TWITTER_SEARCH_NODE"
    + " | " + getTimeStamp()
    + " | " + searchNode
  ));

  if (searchNode.startsWith("#")) {
    await twitterSearchHashtag({searchNode: searchNode});
    return;
  }

  if (searchNode.startsWith("@")) {
    await twitterSearchUser({searchNode: searchNode, searchMode: "SPECIFIC"});
    return;
  }

  viewNameSpace.emit("TWITTER_SEARCH_NODE_UNKNOWN_MODE", { searchNode: searchNode, stats: statsObj.user });
  throw new Error("UNKNOWN SEARCH MODE: " + searchNode);
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

let dbUserMissQueueReady = true;
const dbUserMissQueue = [];
let dbUserMissQueueInterval;

function initDbUserMissQueueInterval(interval){

  return new Promise(function(resolve){

    dbUserMissQueueReady = true;
    let dbMissObj;

    console.log(chalk.bold.black("WAS | INIT TWITTER SEARCH NODE QUEUE INTERVAL: " + msToTime(interval)));

    clearInterval(dbUserMissQueueInterval);

    dbUserMissQueueInterval = setInterval(async function() {

      if (dbUserMissQueueReady && (dbUserMissQueue.length > 0)) {

        dbUserMissQueueReady = false;

        dbMissObj = dbUserMissQueue.shift();

        try {

          const user = await twitterSearchUserNode({user: {nodeId: dbMissObj.nodeId}, searchMode: "SPECIFIC", following: true});

          if (user) {
            console.log(chalk.green("WAS | DB MISS USER FOUND | NID: " + user.nodeId + " | @" + user.screenName));
          }

          dbUserMissQueueReady = true;
        }
        catch(err){
          console.log(chalkError("WAS | *** DB MISS USER SEARCH ERROR: " + err));
          dbUserMissQueueReady = true;
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
    params.maxIntervalWait = params.maxIntervalWait || 5*ONE_SECOND;

    console.log(chalkLog("WAS | ... WAIT ALL TRUE TIMEOUT | " + msToTime(params.maxIntervalWait)));

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

      console.log(chalkBlue("WAS | ... WAIT DB CONNECTION | " + getTimeStamp() ));

      if (statsObj.dbConnectionReady) {
        console.log(chalk.green("WAS | +++ DB CONNECTION | " + getTimeStamp() ));
        clearInterval(dbConnectionReadyInterval);
        return resolve();
      }

    }, 5000);

  });
}

const watchOptions = {
  ignoreDotFiles: true,
  ignoreUnreadableDir: true,
  ignoreNotPermitted: true,
}

async function initWatchConfig(){

  statsObj.status = "INIT WATCH CONFIG";

  console.log(chalkLog(MODULE_ID_PREFIX + " | ... INIT WATCH"));

  const loadConfig = async function(f){

    try{

      debug(chalkInfo(MODULE_ID_PREFIX + " | +++ FILE CREATED or CHANGED | " + getTimeStamp() + " | " + f));

      if (f.endsWith("wordAssoServerConfig.json")){

        await loadAllConfigFiles();

        const configArgs = Object.keys(configuration);

        for (const arg of configArgs){
          if (_.isObject(configuration[arg])) {
            console.log(MODULE_ID_PREFIX + " | _FINAL CONFIG | " + arg + "\n" + jsonPrint(configuration[arg]));
          }
          else {
            console.log(MODULE_ID_PREFIX + " | _FINAL CONFIG | " + arg + ": " + configuration[arg]);
          }
        }
      }

      if (f.endsWith("bestRuntimeNetwork.json")){
        await loadBestRuntimeNetwork();
        await updateUserSets();
      }

      if (f.endsWith(followableSearchTermFile)){
        await initFollowableSearchTermSet();
      }

    }
    catch(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** LOAD ALL CONFIGS ON CREATE ERROR: " + err));
    }
  }

  watch.createMonitor(configDefaultFolder, watchOptions, function (monitor) {

    monitor.on("created", loadConfig);

    monitor.on("changed", loadConfig);

    monitor.on("removed", function (f) {
      console.log(chalkAlert(MODULE_ID_PREFIX + " | XXX FILE DELETED | " + getTimeStamp() + " | " + f));
    });
  });

  watch.createMonitor(bestNetworkFolder, watchOptions, function (monitor) {

    monitor.on("created", loadConfig);

    monitor.on("changed", loadConfig);

    monitor.on("removed", function (f) {
      console.log(chalkAlert(MODULE_ID_PREFIX + " | XXX FILE DELETED | " + getTimeStamp() + " | " + f));
    });
  });

  return;
}

setTimeout(async function(){

  console.log(chalkBlue("WAS | ... WAIT START TIMEOUT: " + msToTime(DEFAULT_START_TIMEOUT)));

  try {

    await initSlackRtmClient();
    await initSlackWebClient();

    dbConnection = await connectDb();

    configEvents.emit("DB_CONNECT");

    await waitDbConnectionReady();
    const cnf = await initConfig();

    configuration = deepcopy(cnf);
    if (empty(configuration.twitter)) { configuration.twitter = {}; }

    console.log("WAS | " + chalkTwitter(configuration.processName + " STARTED " + getTimeStamp() ));

    statsObj.status = "START";

    console.log(chalkTwitter("WAS" 
      + " | " + configuration.processName 
    ));

    slackText = "*WAS START*";

    await slackSendWebMessage({ channel: slackChannel, text: slackText});

    await killAll();
    await allTrue();
    await initInternetCheckInterval(ONE_MINUTE);
    await initKeySortInterval(configuration.keySortInterval);
    await initSaveFileQueue(configuration);
    await initPassport();
    await initThreeceeTwitterUser("altthreecee00");

    if (hostname == "google") {
      try{

        await getTwitterWebhooks();
        if (statsObj.twitter.aaSubs) { console.log(chalkLog("WAS | TWITTER AA SUBSCRIPTIONS ... SKIP ADD SUBS")); }
        if (!statsObj.twitter.aaSubs) { await addTwitterAccountActivitySubscription({threeceeUser: "altthreecee00"}); }
      }
      catch(err){
        console.log(chalkError("WAS | **** TWITTER WEBHOOK ERROR: " + err));
      }
    }

    await dnsReverse({ipAddress: "35.240.151.105"});

    await initAllowLocations();
    await initIgnoreLocations();
    await loadBestRuntimeNetwork();
    await updateUserSets();
    await loadMaxInputHashMap();
    await initIgnoreWordsHashMap();
    await initDbUserMissQueueInterval(configuration.dbUserMissQueueInterval)
    await initTransmitNodeQueueInterval(configuration.transmitNodeQueueInterval);
    await initRateQinterval(configuration.rateQueueInterval);
    await initTwitterRxQueueInterval(configuration.twitterRxQueueInterval);
    await initTweetParserMessageRxQueueInterval(configuration.tweetParserMessageRxQueueInterval);
    await initTwitterSearchNodeQueueInterval(configuration.twitterSearchNodeQueueInterval);
    await initSorterMessageRxQueueInterval(configuration.sorterMessageRxQueueInterval);
    await initDbuChild({childId: DEFAULT_DBU_CHILD_ID});
    await initTweetParser({childId: DEFAULT_TWP_CHILD_ID});
    await initTfeChild({childId: DEFAULT_TFE_CHILD_ID});
    await initTssChild({childId: DEFAULT_TSS_CHILD_ID, tweetVersion2: configuration.tweetVersion2, threeceeUser: threeceeUser});
    await initDbUserChangeStream();
    await initUpdateUserSetsInterval(configuration.updateUserSetsInterval);
    await initWatchConfig();
  }
  catch(err){
    console.trace(chalkError("WAS | **** INIT CONFIG ERROR: " + err + "\n" + jsonPrint(err)));
    if (err.code != 404) {
      console.log("WAS | *** INIT CONFIG ERROR | err.code: " + err.code);
      quit();
    }
  }
}, DEFAULT_START_TIMEOUT);

module.exports = {
  app: app,
  io: io,
  http: httpServer
};
