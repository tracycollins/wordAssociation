const dotenv = require("dotenv");
const envConfig = dotenv.config({ path: process.env.WORD_ENV_VARS_FILE });

if (envConfig.error) {
  throw envConfig.error;
}

console.log("WAS | +++ ENV CONFIG LOADED");

const DEFAULT_MONGODB_SESSION_SECRET = process.env.MONGODB_SESSION_SECRET;
const DEFAULT_MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const DEFAULT_MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const DEFAULT_MONGODB_IP_ADDRESS =
  process.env.MONGODB_IP_ADDRESS || "localhost";
const DEFAULT_MONGODB_URL = `mongodb://${DEFAULT_MONGODB_USERNAME}:${DEFAULT_MONGODB_PASSWORD}@${DEFAULT_MONGODB_IP_ADDRESS}:27017/wordAsso?replicaSet=rs0`;

const DEFAULT_BEST_NETWORK_FILE = "bestRuntimeNetwork.json";
const bestRuntimeNetworkFileName = DEFAULT_BEST_NETWORK_FILE;

const threeceeAuthorizedUsers = ["threecee", "altthreecee00", "ninjathreecee"];
const threeceeUser = "altthreecee00"; // for TSS
const DEFAULT_THREECEE_INFO_USERS = [
  "threecee",
  "threeceeinfo",
  "ninjathreecee",
];

const MODULE_NAME = "was";
const MODULE_ID_PREFIX = "WAS";

const DEFAULT_CURSOR_BATCH_SIZE = 256;

const DEFAULT_PRIMARY_HOST = "google";
const DEFAULT_DATABASE_HOST = "mms3";

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const twitterDateFormat = "ddd MMM DD HH:mm:ss Z YYYY"; // Wed Aug 27 13:08:45 +0000 2008

const DEFAULT_UPDATE_HASHTAG_SETS_INTERVAL = ONE_HOUR;
const DEFAULT_MIN_MENTIONS_HASHTAGS = 100;
const DEFAULT_MAX_LAST_SEEN_DAYS_HASHTAGS = 2;
const DEFAULT_TWEET_SEARCH_COUNT = 5;
const DEFAULT_PUBSUB_ENABLED = true;
const DEFAULT_PUBSUB_PROJECT_ID = "graphic-tangent-627";
const DEFAULT_PUBSUB_RESULT_TIMEOUT = ONE_MINUTE;

const DEFAULT_UPDATE_USER_SETS_INTERVAL = 10 * ONE_MINUTE;

let pubSubClient;

const DEFAULT_GOOGLE_COMPUTE_DOMAIN = "bc.googleusercontent.com";

const DEFAULT_START_TIMEOUT = 5 * ONE_SECOND;
const DEFAULT_MAX_USER_SEARCH_SKIP_COUNT = 25;

const DEFAULT_USER_PROFILE_ONLY_FLAG = false;
const DEFAULT_BINARY_MODE = true;

let saveSampleTweetFlag = true;

const cors = require("cors");
const os = require("os");
const https = require("https");
const defaults = require("object.defaults");
const kill = require("tree-kill");
const empty = require("is-empty");
const watch = require("watch");
const whois = require("whois-json");
const dns = require("dns");
const crypto = require("crypto");
const NodeCache = require("node-cache");
const commandLineArgs = require("command-line-args");
const metricsRate = "5MinuteRate";
const shell = require("shelljs");
const methodOverride = require("method-override");
const deepcopy = require("deep-copy");
const { PubSub } = require("@google-cloud/pubsub");

let hostname = os.hostname();
hostname = hostname.replace(/\.local/g, "");
hostname = hostname.replace(/\.home/g, "");
hostname = hostname.replace(/\.at.net/g, "");
hostname = hostname.replace(/\.fios-router/g, "");
hostname = hostname.replace(/\.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const PF = MODULE_ID_PREFIX + "_" + hostname.toUpperCase();

console.log(PF + " | ==============================");
console.log(PF + " | HOST: " + hostname);
console.log(PF + " | ==============================");

let DROPBOX_ROOT_FOLDER;
const TWITTER_WEBHOOK_URL = "/webhooks/twitter";
let TWITTER_AUTH_CALLBACK_URL =
  "https://word.threeceelabs.com/auth/twitter/callback";

if (hostname == "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
} else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
  TWITTER_AUTH_CALLBACK_URL = "http://localhost:9997/auth/twitter/callback";
}

global.wordAssoDb = require("@threeceelabs/mongoose-twitter");

const ThreeceeUtilities = require("@threeceelabs/threeceeutilities");
const tcUtils = new ThreeceeUtilities(PF + "_TCU");
const redisClient = tcUtils.redisClient;

tcUtils.on("error", function (err) {
  console.log(chalkError(PF + " | *** TCU ERROR | " + err));
});

tcUtils.on("ready", async function () {
  console.log(chalk.green(`${PF} | TCU READY | ${PF}_TCU`));
  if (hostname === "google") {
    const redisResult = await redisClient.flushall();
  }
});

const mguAppName = MODULE_ID_PREFIX + "_MGU";
const MongooseUtilities = require("@threeceelabs/mongoose-utilities");
const mgUtils = new MongooseUtilities(mguAppName);

mgUtils.on("ready", async () => {
  console.log(`${MODULE_ID_PREFIX} | +++ MONGOOSE UTILS READY: ${mguAppName}`);
  statsObj.dbConnectionReady = true;
});

const uscAppName = MODULE_ID_PREFIX + "_USC";
const UserServerController = require("@threeceelabs/user-server-controller");
const userServerController = new UserServerController(uscAppName);

userServerController.on("error", async (err) => {
  console.log(
    `${MODULE_ID_PREFIX} | *** USER SERVER CONTROLLER ERROR | ${uscAppName} | ERROR: ${err}`
  );
});

userServerController.on("ready", async () => {
  console.log(
    `${MODULE_ID_PREFIX} | +++ USER SERVER CONTROLLER READY: ${uscAppName}`
  );
  statsObj.dbConnectionReady = true;
});

const jsonPrint = tcUtils.jsonPrint;
const formatBoolean = tcUtils.formatBoolean;
const formatCategory = tcUtils.formatCategory;
const getTimeStamp = tcUtils.getTimeStamp;
const msToTime = tcUtils.msToTime;

let twitterClient;

let neuralNetworkChangeStream;
let userChangeStream;
let hashtagChangeStream;

let userSearchCursor;
let hashtagSearchCursor;

let heartbeatInterval;

process.env.NODE_ENV = process.env.NODE_ENV || "development";

// const DEFAULT_IGNORE_CATEGORY_RIGHT = false;
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

// const DEFAULT_SAVE_FILE_QUEUE_INTERVAL = 5*ONE_SECOND;
const DEFAULT_ENABLE_TWITTER_FOLLOW = false;
const DEFAULT_TEST_INTERNET_CONNECTION_URL = "www.google.com";

const DEFAULT_CHILD_ID_PREFIX = "wa_node_child_";

const DEFAULT_DBU_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "dbu";
const DEFAULT_TSS_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "tss";
const DEFAULT_TWP_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "twp";
const DEFAULT_MGI_CHILD_ID = DEFAULT_CHILD_ID_PREFIX + "mgi";
let dbuChild;
let tssChild;
let twpChild;
// let mgiChild;

let filterDuplicateTweets = true;
let filterRetweets = false;

const DEFAULT_TWITTER_THREECEE_USER = "threecee";

const DEFAULT_TWEET_VERSION_2 = false;

const DEFAULT_INTERVAL = 2;
const DEFAULT_MIN_FOLLOWERS_AUTO_CATEGORIZE = 5000;
const DEFAULT_MIN_FOLLOWERS_AUTO_FOLLOW = 20000;

const DEFAULT_MAX_BOTS_TO_FETCH = 5000;
const DEFAULT_BOT_UPDATE_INTERVAL = 4 * ONE_HOUR;
const DEFAULT_BOT_CATEGORIES = ["disruptive", "problematic"];

const DEFAULT_NODE_CACHE_DELETE_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TSS_TWITTER_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TWEET_PARSER_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_SORTER_INTERVAL = 100;
const DEFAULT_TWITTER_RX_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL = DEFAULT_INTERVAL;
const DEFAULT_NODE_SETPROPS_QUEUE_INTERVAL = 100;
const DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL = DEFAULT_INTERVAL;

const TWP_PING_INTERVAL = 15 * ONE_MINUTE;
const DBU_PING_INTERVAL = 15 * ONE_MINUTE;
const TSS_PING_INTERVAL = 15 * ONE_MINUTE;

const DEFAULT_RATE_QUEUE_INTERVAL = 10 * ONE_SECOND; // 1 second
const DEFAULT_RATE_QUEUE_INTERVAL_MODULO = 6; // modulo RATE_QUEUE_INTERVAL
const DEFAULT_STATS_UPDATE_INTERVAL = 5 * ONE_MINUTE;
const DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL = 5 * ONE_MINUTE;

const DEFAULT_SOCKET_AUTH_TIMEOUT = 30 * ONE_SECOND;
const DEFAULT_QUIT_ON_ERROR = false;
const DEFAULT_MAX_TOP_TERMS = 20;
const DEFAULT_METRICS_NODE_METER_ENABLED = true;

const DEFAULT_MAX_TWEET_RX_QUEUE = 50;
const DEFAULT_MAX_TRANSMIT_NODE_QUEUE = 50;

const DEFAULT_OFFLINE_MODE = process.env.OFFLINE_MODE || false;
const DEFAULT_AUTO_OFFLINE_MODE = true; // if network connection is down, will auto switch to OFFLINE_MODE
const DEFAULT_IO_PING_INTERVAL = ONE_MINUTE;
const DEFAULT_IO_PING_TIMEOUT = 3 * ONE_MINUTE;

const DEFAULT_NODE_TYPES = ["hashtag", "user", "tweet"];

const compactDateTimeFormat = "YYYYMMDD HHmmss";
// const tinyDateTimeFormat = "YYYYMMDDHHmmss";

const IP_CACHE_DEFAULT_TTL = 600; // seconds
const IP_CACHE_CHECK_PERIOD = 15;

const SERVER_CACHE_DEFAULT_TTL = 600; // seconds
const SERVER_CACHE_CHECK_PERIOD = 15;

const VIEWER_CACHE_DEFAULT_TTL = 600; // seconds
const VIEWER_CACHE_CHECK_PERIOD = 15;

const AUTH_SOCKET_CACHE_DEFAULT_TTL = 600;
const AUTH_SOCKET_CACHE_CHECK_PERIOD = 10;

const AUTH_USER_CACHE_DEFAULT_TTL = ONE_DAY / 1000;
const AUTH_USER_CACHE_CHECK_PERIOD = ONE_HOUR / 1000; // seconds

const AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL = 600;
const AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD = 5;

const TOPTERMS_CACHE_DEFAULT_TTL = 30;
const TOPTERMS_CACHE_CHECK_PERIOD = 5;

const NODE_CACHE_DEFAULT_TTL = 30;
const NODE_CACHE_CHECK_PERIOD = 1;

const TWEET_ID_CACHE_DEFAULT_TTL = 10;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

const DEFAULT_CATEGORIZE_CACHE_DEFAULT_TTL = 300; //
const DEFAULT_CATEGORIZE_CACHE_CHECK_PERIOD = 10;

const chalk = require("chalk");
const chalkTwitter = chalk.blue;
const chalkConnect = chalk.black;
const chalkSocket = chalk.black;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkWarn = chalk.bold.yellow;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkGreen = chalk.green;
const chalkBlue = chalk.blue;
const chalkBlueBold = chalk.blue.bold;
const chalkBot = chalk.gray;

const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap");

const btoa = require("btoa");
const axios = require("axios");
const _ = require("lodash");
const touch = require("touch");
const merge = require("deepmerge");
const Measured = require("measured-core");
const omit = require("object.omit");
const pick = require("object.pick");
const configServer = require("./config/configServer");

const fs = require("fs");
const path = require("path");
const async = require("async");
const debug = require("debug")("wa");
const moment = require("moment");

const express = require("express");
// set up rate limiter: maximum of five requests per minute

// const RateLimit = require('express-rate-limit');
// const limiter = new RateLimit({
//   windowMs: 1*60*1000, // 1 minute
//   max: 100
// });

const app = express();
// apply rate limiter to all requests
// app.use(limiter);

app.use(cors());
app.set("trust proxy", 1); // trust first proxy

const expressSession = require("express-session");
// const MongoStore = require("connect-mongo")(expressSession);
// const MongoStore = require("connect-mongo").default;
const MongoStore = require("connect-mongo");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
// const { Autohook } = require("twitter-autohook");
// const webhook = new Autohook();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require("serve-static")(path.join(__dirname, "public")));

const userCategoryHashmapPickArray = [
  "category",
  "categoryAuto",
  "statusesCount",
  "ageDays",
  "lastSeen",
  "createdAt",
  "followersCount",
  "friendsCount",
  "mentions",
  "tweetsPerDay",
  "nodeId",
  "screenName",
  "bannerImageUrl",
  "profileImageUrl",
  "network",
  "verified",
];

const threeceeConfig = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};

const statsObj = {};

statsObj.slack = {};
statsObj.slack.webClient = {};
statsObj.slack.webClient.ready = false;
statsObj.slack.webClient.error = false;

statsObj.slack.rtmClient = {};
statsObj.slack.rtmClient.ready = false;
statsObj.slack.rtmClient.error = false;

statsObj.bots = {};
statsObj.bots.numOfBots = 0;

statsObj.pubSub = {};
statsObj.pubSub.subscriptions = {};
statsObj.pubSub.subscriptions.errors = [];
statsObj.pubSub.messagesSent = 0;
statsObj.pubSub.messagesReceived = 0;
statsObj.pubSub.nodeSetPropsResultTimeouts = 0;
statsObj.pubSub.nodeSetProps = 0;

statsObj.commandLineArgsLoaded = false;

statsObj.threeceeUsersConfiguredFlag = false;
statsObj.twitNotReadyWarning = false;
statsObj.initSetsComplete = false;

statsObj.dbuChildReady = false;

let dbuChildReady = false;
statsObj.tssChildReady = false;

statsObj.twitter = {};
statsObj.twitter.tweetsReceived = 0;
statsObj.twitter.duplicateTweetsReceived = 0;
statsObj.twitter.retweetsReceived = 0;
statsObj.twitter.quotedTweetsReceived = 0;
statsObj.twitter.tweetsPerMin = 0;
statsObj.twitter.maxTweetsPerMin = 0;
statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
statsObj.twitter.aaSubs = {};

statsObj.hashtag = {};
statsObj.hashtag.added = 0;
statsObj.hashtag.deleted = 0;
statsObj.hashtag.categoryChanged = 0;
statsObj.hashtag.categoryAutoChanged = 0;
statsObj.hashtag.categorizeNetworkChanged = 0;
statsObj.hashtag.categoryVerifiedChanged = 0;
statsObj.hashtag.categoryAuto = {};
statsObj.hashtag.categoryAuto.left = 0;
statsObj.hashtag.categoryAuto.negative = 0;
statsObj.hashtag.categoryAuto.neutral = 0;
statsObj.hashtag.categoryAuto.none = 0;
statsObj.hashtag.categoryAuto.positive = 0;
statsObj.hashtag.categoryAuto.right = 0;
statsObj.hashtag.categorizedAuto = 0;
statsObj.hashtag.categorizedManual = 0;
statsObj.hashtag.categorizedTotal = 0;
statsObj.hashtag.category = {};
statsObj.hashtag.category.left = 0;
statsObj.hashtag.category.negative = 0;
statsObj.hashtag.category.neutral = 0;
statsObj.hashtag.category.none = 0;
statsObj.hashtag.category.positive = 0;
statsObj.hashtag.category.right = 0;
statsObj.hashtag.matched = 0;
statsObj.hashtag.mismatched = 0;
statsObj.hashtag.total = 0;
statsObj.hashtag.uncategorized = {};
statsObj.hashtag.uncategorized.all = 0;
statsObj.hashtag.uncategorized.left = 0;
statsObj.hashtag.uncategorized.negative = 0;
statsObj.hashtag.uncategorized.neutral = 0;
statsObj.hashtag.uncategorized.none = 0;
statsObj.hashtag.uncategorized.positive = 0;
statsObj.hashtag.uncategorized.right = 0;
statsObj.hashtag.uncategorizedAuto = 0;
statsObj.hashtag.uncategorizedManual = 0;
statsObj.hashtag.uncategorizedTotal = 0;

statsObj.traffic = {};
statsObj.traffic.users = {};
statsObj.traffic.users.bots = 0;
statsObj.traffic.users.percentBots = 0;
statsObj.traffic.users.total = 0;

statsObj.user = {};
statsObj.user.categorizedBy = {};

for (const user of threeceeAuthorizedUsers) {
  statsObj.user.categorizedBy[user] = {};
  statsObj.user.categorizedBy[user].total = 0;
  statsObj.user.categorizedBy[user].today = 0;
  statsObj.user.categorizedBy[user].periodCurrent = 0;
  statsObj.user.categorizedBy[user].periodLast = 0;
}

statsObj.user.total = 0;
statsObj.user.dbUncat = 0;
statsObj.user.added = 0;
statsObj.user.deleted = 0;
statsObj.user.categoryChanged = 0;
statsObj.user.categoryAutoChanged = 0;
statsObj.user.categorizeNetworkChanged = 0;
statsObj.user.categoryVerifiedChanged = 0;
statsObj.user.matched = 0;
statsObj.user.mismatched = 0;
statsObj.user.following = 0;
statsObj.user.notFollowing = 0;
statsObj.user.autoFollow = 0;
statsObj.user.categorizedAuto = 0;
statsObj.user.categorizedManual = 0;
statsObj.user.categorizedTotal = 0;
statsObj.user.categoryVerified = 0;
statsObj.user.categoryAuto = {};
statsObj.user.categoryAuto.left = 0;
statsObj.user.categoryAuto.negative = 0;
statsObj.user.categoryAuto.neutral = 0;
statsObj.user.categoryAuto.none = 0;
statsObj.user.categoryAuto.positive = 0;
statsObj.user.categoryAuto.right = 0;
statsObj.user.category = {};
statsObj.user.category.left = 0;
statsObj.user.category.negative = 0;
statsObj.user.category.neutral = 0;
statsObj.user.category.none = 0;
statsObj.user.category.positive = 0;
statsObj.user.category.right = 0;

statsObj.user.uncategorized = {};
statsObj.user.uncategorized.all = 0;
statsObj.user.uncategorized.left = 0;
statsObj.user.uncategorized.neutral = 0;
statsObj.user.uncategorized.right = 0;
statsObj.user.uncategorizedAuto = 0;
statsObj.user.uncategorizedTotal = 0;

function dnsReverse(params) {
  return new Promise(function (resolve, reject) {
    let ipCacheObj = ipCache.get(params.ipAddress);

    if (ipCacheObj) {
      console.log(
        chalkGreen(
          PF +
            " | DNS REVERSE | $ HIT" +
            " | IP: " +
            params.ipAddress +
            " | LS: " +
            ipCacheObj.timeStamp +
            " | HOST: " +
            ipCacheObj.domainName
        )
      );

      ipCacheObj.timeStamp = getTimeStamp();

      ipCache.set(params.ipAddress, ipCacheObj, ipCacheTtl);

      return resolve(ipCacheObj.domainName);
    }

    dns.reverse(params.ipAddress, async function (err, hostnames) {
      if (err) {
        console.log(
          chalk.yellow(
            PF +
              " | *** DNS REVERSE ERROR | IP: " +
              params.ipAddress +
              " | " +
              err
          )
        );

        try {
          console.log(
            chalk.yellow(PF + " | ... TRY WHOIS | IP: " + params.ipAddress)
          );

          const whoisResult = await whois(params.ipAddress);

          console.log(
            chalkGreen(
              PF +
                " | WHOIS" +
                " | REAL IP: " +
                params.ipAddress +
                " | NET NAME: " +
                whoisResult.netname
              // + "\n" + jsonPrint(whoisResult)
            )
          );

          if (params.verbose || configuration.verbose) {
            console.log(
              chalk.black(
                PF +
                  " | WHOIS" +
                  " | REAL IP: " +
                  params.ipAddress +
                  " | NET NAME: " +
                  whoisResult.netname +
                  "\n" +
                  jsonPrint(whoisResult)
              )
            );
          }

          ipCacheObj = {};
          ipCacheObj.domainName = whoisResult.netname;
          ipCacheObj.timeStamp = getTimeStamp();

          ipCache.set(params.ipAddress, ipCacheObj, ipCacheTtl);

          return resolve(whoisResult.netname);
        } catch (err1) {
          console.log(
            chalkError(
              PF + " | *** WHOIS ERROR | IP: " + params.ipAddress + " | " + err1
            )
          );

          ipCacheObj = {};
          ipCacheObj.domainName = "UNKNOWN_" + params.ipAddress;
          ipCacheObj.timeStamp = getTimeStamp();

          ipCache.set(params.ipAddress, ipCacheObj, ipCacheTtl);

          return resolve(ipCacheObj.domainName);
        }
      }

      // i.e. 66.248.198.35.bc.googleusercontent.com
      if (
        hostnames &&
        hostnames[0] &&
        hostnames[0].endsWith(DEFAULT_GOOGLE_COMPUTE_DOMAIN)
      ) {
        const googleComputeEngineExternalIpAddress = hostnames[0].replace(
          "." + DEFAULT_GOOGLE_COMPUTE_DOMAIN,
          ""
        );

        console.log(
          chalk.black(
            PF +
              " | DOMAIN | DNS REVERSE" +
              " | GCP IP: " +
              params.ipAddress +
              " | REAL IP: " +
              googleComputeEngineExternalIpAddress +
              " | " +
              hostnames.length +
              " HOST NAMES" +
              " | HOST: " +
              hostnames[0]
          )
        );

        dnsReverse({ ipAddress: googleComputeEngineExternalIpAddress })
          .then(function (domainName) {
            resolve(domainName);
          })
          .catch(async function (err0) {
            console.log(
              chalkError(
                PF +
                  " | *** DNS REVERSE ERROR | IP: " +
                  googleComputeEngineExternalIpAddress +
                  " | " +
                  err0
              )
            );

            try {
              console.log(
                chalkAlert(
                  PF +
                    " | ... TRY WHOIS | IP: " +
                    googleComputeEngineExternalIpAddress
                )
              );

              const whoisResult = await whois(
                googleComputeEngineExternalIpAddress
              );

              console.log(
                chalk.black(
                  PF +
                    " | DOMAIN | WHOIS" +
                    " | REAL IP: " +
                    googleComputeEngineExternalIpAddress +
                    " | DOMAIN: " +
                    whoisResult.domainName +
                    "\n" +
                    jsonPrint(whoisResult)
                )
              );

              ipCacheObj = {};
              ipCacheObj.domainName = whoisResult.domainName;
              ipCacheObj.timeStamp = getTimeStamp();

              ipCache.set(
                googleComputeEngineExternalIpAddress,
                ipCacheObj,
                ipCacheTtl
              );

              resolve(whoisResult.domainName);
            } catch (err1) {
              console.log(
                chalkError(
                  PF +
                    " | *** WHOIS ERROR | IP: " +
                    googleComputeEngineExternalIpAddress +
                    " | " +
                    err1
                )
              );
              reject(err1);
            }
          });
      } else {
        console.log(
          chalkGreen(
            PF +
              " | DNS REVERSE | $ MISS" +
              " | IP: " +
              params.ipAddress +
              " | " +
              hostnames.length +
              " HOST NAMES" +
              " | HOST: " +
              hostnames[0]
          )
        );

        ipCacheObj = {};
        ipCacheObj.domainName = hostnames[0];
        ipCacheObj.timeStamp = getTimeStamp();

        ipCache.set(params.ipAddress, ipCacheObj, ipCacheTtl);

        resolve(hostnames[0]);
      }
    });
  });
}

async function initPubSub(p) {
  try {
    const params = p || {};
    const projectId = params.projectId || configuration.pubSub.projectId;

    console.log(
      chalkBlue(`${MODULE_ID_PREFIX} | initPubSub | projectId: ${projectId}`)
    );

    const psClient = new PubSub({ projectId });

    console.log(chalkBlue(`${MODULE_ID_PREFIX} | END initPubSub`));
    return psClient;
  } catch (err) {
    console.log(
      chalkError(`${MODULE_ID_PREFIX} | *** initPubSub ERROR: ${err}`)
    );
    throw err;
  }
}

const subscriptionHashMap = {};

const nodeSearchResultHandler = async function (message) {
  try {
    message.ack();

    statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived += 1;

    const messageObj = JSON.parse(message.data.toString());

    debug(chalkLog(PF + " | RX NODE SEARCH RESULT " + message.id));

    if (pubSubPublishMessageRequestIdSet.has(messageObj.requestId)) {
      statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived += 1;

      if (
        (messageObj.node && messageObj.node.nodeType === "user") ||
        (messageObj.nodes &&
          messageObj.nodes.length > 0 &&
          messageObj.nodes[0].nodeType === "user")
      ) {
        if (messageObj.node) {
          debug(
            chalkBlue(
              PF +
                " | ==> SUB [" +
                statsObj.pubSub.subscriptions.nodeSearchResult
                  .messagesReceived +
                "]" +
                " | " +
                messageObj.requestId +
                " | SEARCH CAT AUTO: " +
                messageObj.categoryAuto +
                " | NID: " +
                messageObj.node.nodeId +
                " | @" +
                messageObj.node.screenName +
                " | FLW: " +
                formatBoolean(messageObj.node.following) +
                " | CN: " +
                messageObj.node.categorizeNetwork +
                " | CV: " +
                formatBoolean(messageObj.node.categoryVerified) +
                " | CM: " +
                formatCategory(messageObj.node.category) +
                " | CA: " +
                formatCategory(messageObj.node.categoryAuto)
            )
          );
        }

        if (messageObj.stats) {
          debug(chalkLog(PF + "\nUSER STATS\n" + jsonPrint(messageObj.stats)));
          defaults(statsObj.user, messageObj.stats);
        }

        if (messageObj.node) {
          const catUserObj = categorizedUserHashMap.get(messageObj.node.nodeId);

          if (catUserObj !== undefined) {
            if (isCategorized(messageObj.node)) {
              catUserObj.category = messageObj.node.category;
            }

            if (isAutoCategorized(messageObj.node)) {
              catUserObj.categoryAuto = messageObj.node.categoryAuto;
            }

            catUserObj.bannerImageUrl =
              messageObj.node.bannerImageUrl || catUserObj.bannerImageUrl;
            catUserObj.profileImageUrl =
              messageObj.node.profileImageUrl || catUserObj.profileImageUrl;

            categorizedUserHashMap.set(catUserObj.nodeId, catUserObj);
          }
        }

        if (messageObj.nodes && messageObj.nodes.length > 0) {
          console.log(
            PF +
              " | nodeSearchResultHandler | NODES: " +
              messageObj.nodes.length
          );

          // messageObj.nodes.forEach((node) => {
          for (const node of messageObj.nodes) {
            const catObj = categorizedUserHashMap.get(node.nodeId);

            if (catObj !== undefined) {
              if (isCategorized(node)) {
                catObj.category = node.category;
              }

              if (isAutoCategorized(node)) {
                catObj.categoryAuto = node.categoryAuto;
              }

              catObj.bannerImageUrl =
                node.bannerImageUrl || catObj.bannerImageUrl;
              catObj.profileImageUrl =
                node.profileImageUrl || catObj.profileImageUrl;

              categorizedUserHashMap.set(catObj.nodeId, catObj);
            }
          }
        }

        searchNodeResultHashMap[messageObj.requestId] = {};
        searchNodeResultHashMap[messageObj.requestId].node = messageObj.node;
        searchNodeResultHashMap[messageObj.requestId].nodes = [];
        searchNodeResultHashMap[messageObj.requestId].nodes = messageObj.nodes;
        searchNodeResultHashMap[messageObj.requestId].results =
          messageObj.results;
      } else if (messageObj.node && messageObj.node.nodeType === "hashtag") {
        console.log(
          chalkBlueBold(
            PF +
              " | ==> SUB [" +
              statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived +
              "]" +
              " | " +
              messageObj.requestId +
              " | SEARCH CAT AUTO: " +
              messageObj.categoryAuto +
              " | NID: " +
              messageObj.node.nodeId +
              " | CM: " +
              formatCategory(messageObj.node.category) +
              " | CA: " +
              formatCategory(messageObj.node.categoryAuto)
          )
        );

        const catHashtagObj = categorizedHashtagHashMap.get(
          messageObj.node.nodeId
        );

        if (catHashtagObj !== undefined) {
          if (isCategorized(messageObj.node)) {
            catHashtagObj.category = messageObj.node.category;
          }

          if (isAutoCategorized(messageObj.node)) {
            catHashtagObj.categoryAuto = messageObj.node.categoryAuto;
          }

          categorizedHashtagHashMap.set(catHashtagObj.nodeId, catHashtagObj);
        }

        console.log(
          chalkBlue(
            PF +
              " | ==> SUB [" +
              statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived +
              "]" +
              " | " +
              messageObj.requestId +
              " | #" +
              messageObj.node.nodeId +
              " | CM: " +
              formatCategory(messageObj.node.category) +
              " | CA: " +
              formatCategory(messageObj.node.categoryAuto)
          )
        );

        if (messageObj.stats) {
          debug(
            chalkLog(PF + "\nHASHTAG STATS\n" + jsonPrint(messageObj.stats))
          );
          defaults(statsObj.hashtag, messageObj.stats);
        }

        if (messageObj.nodes && messageObj.nodes.length > 0) {
          console.log(
            PF +
              " | nodeSearchResultHandler | NODES: " +
              messageObj.nodes.length
          );

          messageObj.nodes.forEach((node) => {
            const catObj = categorizedHashtagHashMap.get(
              messageObj.node.nodeId
            );

            if (catObj !== undefined) {
              if (isCategorized(node)) {
                catObj.category = node.category;
              }

              if (isAutoCategorized(node)) {
                catObj.categoryAuto = node.categoryAuto;
              }

              categorizedHashtagHashMap.set(catObj.nodeId, catObj);
            }
          });
        }

        searchNodeResultHashMap[messageObj.requestId] = {};
        searchNodeResultHashMap[messageObj.requestId].node = messageObj.node;
        searchNodeResultHashMap[messageObj.requestId].nodes = [];
        searchNodeResultHashMap[messageObj.requestId].nodes = messageObj.nodes;
        searchNodeResultHashMap[messageObj.requestId].results =
          messageObj.results;
      } else if (messageObj.results && messageObj.results.endCursor) {
        console.log(
          chalk.yellow(
            PF +
              " | ==> PS SEARCH NODE X END CURSOR X [" +
              statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived +
              "]" +
              " | MID: " +
              message.id +
              " | " +
              messageObj.requestId +
              " | SEARCH CAT AUTO: " +
              messageObj.categoryAuto +
              "\nRESULTS\n" +
              jsonPrint(messageObj.results)
          )
        );

        searchNodeResultHashMap[messageObj.requestId] = {};
        searchNodeResultHashMap[messageObj.requestId].results =
          messageObj.results;
      } else {
        console.log(
          chalk.yellow(
            PF +
              " | ==> PS SEARCH NODE -MISS- [" +
              statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived +
              "]" +
              " | MID: " +
              message.id +
              " | " +
              messageObj.requestId +
              " | SEARCH CAT AUTO: " +
              messageObj.categoryAuto +
              "\nRESULTS\n" +
              jsonPrint(messageObj.results)
          )
        );

        searchNodeResultHashMap[messageObj.requestId] = {};
        searchNodeResultHashMap[messageObj.requestId].results =
          messageObj.results;

        console.log(
          PF +
            " | *** nodeSearchResultHandler | UNKNOWN NODE TYPE\n" +
            jsonPrint(messageObj)
        );
        throw new Error("nodeSearchResultHandler | UNKNOWN NODE TYPE");
      }
    }

    tcUtils.emitter.emit("nodeSearchResult_" + messageObj.requestId);
    pubSubPublishMessageRequestIdSet.delete(messageObj.requestId);

    return;
  } catch (err) {
    message.ack();
    console.log(
      chalkError(PF + " | *** RX nodeSearchResultHandler ERROR: " + err)
    );
    console.log("message\n", message);
    throw err;
  }
};

const nodeSetPropsResultHandler = async function (message) {
  message.ack();

  const messageObj = JSON.parse(message.data.toString());

  // data host (mp2) only processes its own nodeSetProps
  // primary host (google) processes all nodeSetProps

  if (
    (configuration.isDatabaseHost &&
      pubSubPublishMessageRequestIdSet.has(messageObj.requestId)) ||
    !configuration.isDatabaseHost
  ) {
    statsObj.pubSub.subscriptions.nodeSetPropsResult.messagesReceived += 1;

    if (messageObj.node && messageObj.node.nodeType === "user") {
      if (
        !pubSubPublishMessageRequestIdSet.has(messageObj.requestId) ||
        configuration.verbose
      ) {
        debug(
          chalkBlueBold(
            PF +
              " | ==> SUB [" +
              statsObj.pubSub.subscriptions.nodeSetPropsResult
                .messagesReceived +
              "]" +
              " | TOPIC: node-setprops-result" +
              " | " +
              messageObj.requestId +
              " | TYPE: " +
              messageObj.node.nodeType +
              " | NID: " +
              messageObj.node.nodeId +
              " | @" +
              messageObj.node.screenName +
              " | AUTO FLW: " +
              formatBoolean(messageObj.node.autoFollowFlag) +
              " | FLW: " +
              formatBoolean(messageObj.node.following) +
              " | CN: " +
              messageObj.node.categorizeNetwork +
              " | CV: " +
              formatBoolean(messageObj.node.categoryVerified) +
              " | CM: " +
              formatCategory(messageObj.node.category) +
              " | CA: " +
              formatCategory(messageObj.node.categoryAuto)
          )
        );
      }

      if (messageObj.stats) {
        debug(chalkLog(PF + "\nUSER STATS\n" + jsonPrint(messageObj.stats)));
        defaults(statsObj.user, messageObj.stats);
      }

      if (pubSubPublishMessageRequestIdSet.has(messageObj.requestId)) {
        nodeSetPropsResultHashMap[messageObj.requestId] = messageObj.node;
      } else {
        // nodeSetProps not sent by this host
        if (messageObj.node.nodeType === "user") {
          if (
            isCategorized(messageObj.node) ||
            isAutoCategorized(messageObj.node)
          ) {
            categorizedUserHashMap.set(
              messageObj.node.nodeId,
              pick(messageObj.node, userCategoryHashmapPickArray)
            );
          }

          delete messageObj.node._id;

          if (
            messageObj.node.tweetHistograms &&
            messageObj.node.tweetHistograms.friends
          ) {
            console.log(
              chalkAlert(
                `${MODULE_ID_PREFIX} | !!! nodeSetPropsResultHandler tweetHistograms.friends ${typeof messageObj
                  .node.tweetHistograms.friends} | NID: ${
                  messageObj.node.nodeId
                } | @${messageObj.node.screenName}`
              )
            );
          }

          await global.wordAssoDb.User.findOneAndUpdate(
            { nodeId: messageObj.node.nodeId },
            messageObj.node,
            { upsert: true }
          );

          // return dbUser;
        }
      }
    } else if (messageObj.node && messageObj.node.nodeType === "hashtag") {
      if (configuration.verbose) {
        console.log(
          chalkBlue(
            PF +
              " | ==> SUB [" +
              statsObj.pubSub.subscriptions.nodeSetPropsResult
                .messagesReceived +
              "]" +
              " | TOPIC: node-setprops-result" +
              " | " +
              messageObj.requestId +
              " | TYPE: " +
              messageObj.node.nodeType +
              " | #" +
              messageObj.node.nodeId +
              " | CM: " +
              formatCategory(messageObj.node.category) +
              " | CA: " +
              formatCategory(messageObj.node.categoryAuto)
          )
        );
      }

      nodeSetPropsResultHashMap[messageObj.requestId] = messageObj.node;
    } else {
      console.log(
        chalk.yellow(
          PF +
            " | ==> NODE SET PROPS -MISS- [" +
            statsObj.pubSub.subscriptions.nodeSetPropsResult.messagesReceived +
            "]" +
            " | " +
            messageObj.requestId
        )
      );
    }
  }

  tcUtils.emitter.emit("nodeSetPropsResult_" + messageObj.requestId);
  pubSubPublishMessageRequestIdSet.delete(messageObj.requestId);

  return;
};

const nodeIgnoreHandler = async function (message) {
  message.ack();

  statsObj.pubSub.subscriptions.nodeSetPropsResult.messagesReceived += 1;

  const messageObj = JSON.parse(message.data.toString());

  // messageObj
  // ├─ requestId: reqId_1587767958144
  // ├─ node
  // │  └─ nodeType: "user"
  // │  └─ nodeId: 1000193009403613186

  console.log(
    chalkBlue(
      PF +
        " | --> PS IGNORE NODE [RX: " +
        statsObj.pubSub.ignoreNode.messagesReceived +
        "]" +
        " | MID: " +
        message.id +
        " | REQ ID: " +
        messageObj.requestId +
        " | NODE TYPE: " +
        messageObj.node.nodeType +
        " | NID: " +
        messageObj.node.nodeId
    )
  );

  let result = {};

  if (messageObj.node.nodeType === "user") {
    ignoredUserSet.add(messageObj.node.nodeId);
    result = await deleteUser({ user: messageObj.node });
  }

  await pubSubPublishMessage({
    publishName: "node-ignore-result",
    message: {
      requestId: messageObj.requestId,
      node: messageObj.node,
      result: result,
    },
  });
};

const nodeDeleteHandler = async function (message) {
  message.ack();

  statsObj.pubSub.subscriptions.nodeDelete.messagesReceived += 1;

  const messageObj = JSON.parse(message.data.toString());

  // messageObj
  // ├─ requestId: reqId_1587767958144
  // ├─ node
  // │  └─ nodeType: "user"
  // │  └─ nodeId: 1000193009403613186

  console.log(
    chalkBlue(
      PF +
        " | --> PS DELETE NODE [RX: " +
        statsObj.pubSub.subscriptions.nodeDelete.messagesReceived +
        "]" +
        " | MID: " +
        message.id +
        " | REQ ID: " +
        messageObj.requestId +
        " | NODE TYPE: " +
        messageObj.node.nodeType +
        " | NID: " +
        messageObj.node.nodeId
    )
  );

  let result = {};

  if (messageObj.node.nodeType === "user") {
    result = await deleteUser({ user: messageObj.node });
  }
};

const pubSubErrorHandler = function (params) {
  console.log(
    chalkError(
      `${PF} | *** PUBSUB ERROR | SUBSCRIPTION: ${params.subscribeName} | ${params.err}`
    )
  );
  statsObj.pubSub.subscriptions.errors.push(params.err);
};

async function initNodeOpHandler(params) {
  const subscription = await pubSubClient.subscription(params.subscribeName);

  subscription.on("error", function (err) {
    pubSubErrorHandler({ subscribeName: params.subscribeName, err: err });
  });

  const [metadata] = await subscription.getMetadata();

  console.log(
    chalkBlueBold(
      `${PF} | INIT PUBSUB NODE OP SUB HANDLER | SUB: ${params.subscribeName} | TOPIC: ${metadata.topic}`
    )
  );

  switch (params.subscribeName) {
    case "node-search-result":
    case "node-search-result-primary":
      statsObj.pubSub.subscriptions.nodeSearchResult = {};
      statsObj.pubSub.subscriptions.nodeSearchResult.name =
        params.subscribeName;
      statsObj.pubSub.subscriptions.nodeSearchResult.errors = [];
      statsObj.pubSub.subscriptions.nodeSearchResult.messagesReceived = 0;
      statsObj.pubSub.subscriptions.nodeSearchResult.topic = metadata.topic;
      subscriptionHashMap.nodeSearchResult = {};
      subscriptionHashMap.nodeSearchResult = subscription;
      subscription.on("message", nodeSearchResultHandler);
      break;

    case "node-setprops-result":
    case "node-setprops-result-primary":
      statsObj.pubSub.subscriptions.nodeSetPropsResult = {};
      statsObj.pubSub.subscriptions.nodeSetPropsResult.name =
        params.subscribeName;
      statsObj.pubSub.subscriptions.nodeSetPropsResult.errors = [];
      statsObj.pubSub.subscriptions.nodeSetPropsResult.messagesReceived = 0;
      statsObj.pubSub.subscriptions.nodeSetPropsResult.topic = metadata.topic;
      subscriptionHashMap.nodeSetPropsResult = {};
      subscriptionHashMap.nodeSetPropsResult = subscription;
      subscription.on("message", nodeSetPropsResultHandler);
      break;

    case "node-ignore":
    case "node-ignore-primary":
      statsObj.pubSub.subscriptions.nodeIgnoreResult = {};
      statsObj.pubSub.subscriptions.nodeIgnoreResult.name =
        params.subscribeName;
      statsObj.pubSub.subscriptions.nodeIgnoreResult.errors = [];
      statsObj.pubSub.subscriptions.nodeIgnoreResult.messagesReceived = 0;
      statsObj.pubSub.subscriptions.nodeIgnoreResult.topic = metadata.topic;
      subscriptionHashMap.nodeIgnoreResult = {};
      subscriptionHashMap.nodeIgnoreResult = subscription;
      subscription.on("message", nodeIgnoreHandler);
      break;

    case "node-delete":
      statsObj.pubSub.subscriptions.nodeDelete = {};
      statsObj.pubSub.subscriptions.nodeDelete.name = params.subscribeName;
      statsObj.pubSub.subscriptions.nodeDelete.errors = [];
      statsObj.pubSub.subscriptions.nodeDelete.messagesReceived = 0;
      statsObj.pubSub.subscriptions.nodeDelete.topic = metadata.topic;
      subscriptionHashMap.nodeDelete = {};
      subscriptionHashMap.nodeDelete = subscription;
      subscription.on("message", nodeDeleteHandler);
      break;

    default:
      console.log(
        chalkError(
          `${PF} | initNodeOpHandler ERROR: UNKNOWN SUBSCRIPTION: ${params.subscribeName}`
        )
      );
      throw new Error(
        "initNodeOpHandler UNKNOWN subscribeName: " + params.subscribeName
      );
  }

  return;
}

const searchNodeResultHashMap = {};

const pubSubPublishMessageRequestIdSet = new Set();

async function pubSubPublishMessage(params) {
  try {
    const data = JSON.stringify(params.message);
    const dataBuffer = Buffer.from(data);

    const messageId = await pubSubClient
      .topic(params.publishName)
      .publish(dataBuffer);

    pubSubPublishMessageRequestIdSet.add(params.message.requestId);

    statsObj.pubSub.messagesSent += 1;

    debug(
      chalkLog(
        PF +
          " | <== PUB [" +
          statsObj.pubSub.messagesSent +
          " / OUT: " +
          pubSubPublishMessageRequestIdSet.size +
          "]" +
          " | TOPIC: " +
          params.publishName +
          " | " +
          params.message.requestId +
          " | TYPE: " +
          params.message.node.nodeType +
          " | NID: " +
          params.message.node.nodeId +
          " | @" +
          params.message.node.screenName
      )
    );

    return messageId;
  } catch (err) {
    console.log(chalkError(PF + " | *** pubSubPublishMessage ERROR: " + err));
    throw err;
  }
}

//=========================================================================
// SLACK
//=========================================================================
const { WebClient } = require("@slack/web-api");

console.log("process.env.SLACK_BOT_TOKEN", process.env.SLACK_BOT_TOKEN);

const slackBotToken = process.env.SLACK_BOT_TOKEN;

let slackWebClient;

const slackChannel = MODULE_ID_PREFIX.toLowerCase();
const slackChannelUserAuth = MODULE_ID_PREFIX.toLowerCase() + "-user-auth";
const slackChannelAdmin = MODULE_ID_PREFIX.toLowerCase() + "-admin";

let slackText = "";
const channelsHashMap = new HashMap();

async function slackSendWebMessage(msgObj) {
  try {
    const channel = msgObj.channel || configuration.slackChannel.id;
    const text = msgObj.text || msgObj;

    await slackWebClient.chat.postMessage({
      text: text,
      channel: channel,
    });
  } catch (err) {
    console.log(
      chalkAlert(MODULE_ID_PREFIX + " | *** slackSendWebMessage ERROR: " + err)
    );
    throw err;
  }
}

async function initSlackWebClient() {
  try {
    console.log(chalkLog(PF + " | INIT SLACK WEB CLIENT"));

    slackWebClient = new WebClient(slackBotToken);

    const authTestResponse = await slackWebClient.auth.test();

    debug({ authTestResponse });

    const conversationsListResponse = await slackWebClient.conversations.list();

    conversationsListResponse.channels.forEach(async function (channel) {
      debug(
        chalkLog("WAS | SLACK CHANNEL | " + channel.id + " | " + channel.name)
      );

      if (channel.name === slackChannel) {
        configuration.slackChannel = channel;

        const message = {
          channel: configuration.slackChannel.id,
          text: "OP",
        };

        message.attachments = [];
        message.attachments.push({
          text: "INIT",
          fields: [
            { title: "SRC", value: hostname + "_" + process.pid },
            { title: "MOD", value: MODULE_NAME },
            { title: "DST", value: "ALL" },
          ],
        });

        await slackWebClient.chat.postMessage(message);
      }

      channelsHashMap.set(channel.id, channel);
    });

    return;
  } catch (err) {
    console.log(
      chalkError(
        `${MODULE_ID_PREFIX} | *** INIT SLACK WEB CLIENT ERROR: ${err}`
      )
    );
    throw err;
  }
}

const addedHashtagsSet = new Set();
const deletedHashtagsSet = new Set();

const addedUsersSet = new Set();
const deletedUsersSet = new Set();
const botNodeIdSet = new Set();
const ignoreIpSet = new Set();

const ignoredHashtagRegex = new RegExp(/[^\u0000-\u007F]+/, "i");

const allowLocationsSet = new Set();
allowLocationsSet.add("new england");
let allowLocationsArray = Array.from(allowLocationsSet);
let allowLocationsString = allowLocationsArray.join("\\b|\\b");
allowLocationsString = "\\b" + allowLocationsString + "\\b";
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
let ignoreLocationsString = ignoreLocationsArray.join("\\b|\\b");
ignoreLocationsString = "\\b" + ignoreLocationsString + "\\b";
let ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "i");

const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20,
});

configEvents.on("newListener", function (data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

let defaultConfiguration = {}; // general configuration
let hostConfiguration = {}; // host-specific configuration

let configuration = {};

configuration.minMentionsHashtags = DEFAULT_MIN_MENTIONS_HASHTAGS;
configuration.maxLastSeenDaysHashtags = DEFAULT_MAX_LAST_SEEN_DAYS_HASHTAGS;

configuration.tweetSearchCount = DEFAULT_TWEET_SEARCH_COUNT;
configuration.primaryHost = process.env.PRIMARY_HOST || DEFAULT_PRIMARY_HOST;
configuration.databaseHost = process.env.DATABASE_HOST || DEFAULT_DATABASE_HOST;

configuration.isPrimaryHost = hostname === configuration.primaryHost;
configuration.isDatabaseHost = hostname === configuration.databaseHost;

configuration.maxBotsToFetch = DEFAULT_MAX_BOTS_TO_FETCH;
configuration.botUpdateIntervalTime = DEFAULT_BOT_UPDATE_INTERVAL;
configuration.botCategories = DEFAULT_BOT_CATEGORIES;

configuration.pubSub = {};
configuration.pubSub.enabled = DEFAULT_PUBSUB_ENABLED;
configuration.pubSub.projectId = DEFAULT_PUBSUB_PROJECT_ID;
configuration.pubSub.pubSubResultTimeout = DEFAULT_PUBSUB_RESULT_TIMEOUT;

configuration.pubSub.subscriptions = {};

configuration.slackChannel = {};

configuration.heartbeatInterval =
  process.env.WAS_HEARTBEAT_INTERVAL || 10 * ONE_SECOND;

configuration.maxUserSearchSkipCount = DEFAULT_MAX_USER_SEARCH_SKIP_COUNT;
configuration.filterVerifiedUsers = true;
configuration.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
configuration.verbose = false;
configuration.userProfileOnlyFlag = DEFAULT_USER_PROFILE_ONLY_FLAG;
configuration.binaryMode = DEFAULT_BINARY_MODE;

configuration.maxTransmitNodeQueue = DEFAULT_MAX_TRANSMIT_NODE_QUEUE;
configuration.maxTweetRxQueue = DEFAULT_MAX_TWEET_RX_QUEUE;

let maxTransmitNodeQueue = configuration.maxTransmitNodeQueue;

let maxTweetRxQueue = configuration.maxTweetRxQueue;
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

configuration.categorizeCacheTtl = DEFAULT_CATEGORIZE_CACHE_DEFAULT_TTL;
configuration.categorizeCacheCheckPeriod = DEFAULT_CATEGORIZE_CACHE_CHECK_PERIOD;

configuration.enableLanguageAnalysis = DEFAULT_ENABLE_LANG_ANALYSIS;
configuration.forceLanguageAnalysis = DEFAULT_FORCE_LANG_ANALYSIS;

configuration.enableImageAnalysis = DEFAULT_ENABLE_IMAGE_ANALYSIS;
configuration.forceImageAnalysis = DEFAULT_FORCE_IMAGE_ANALYSIS;

configuration.enableGeoCode = DEFAULT_ENABLE_GEOCODE;
configuration.forceGeoCode = DEFAULT_FORCE_GEOCODE;

configuration.threeceeUser = DEFAULT_TWITTER_THREECEE_USER;
configuration.threeceeInfoUsersArray = DEFAULT_THREECEE_INFO_USERS;

configuration.nodeCacheDeleteQueueInterval = DEFAULT_NODE_CACHE_DELETE_QUEUE_INTERVAL;
configuration.tssInterval = DEFAULT_TSS_TWITTER_QUEUE_INTERVAL;
configuration.tweetParserMessageRxQueueInterval = DEFAULT_TWEET_PARSER_MESSAGE_RX_QUEUE_INTERVAL;
configuration.tweetVersion2 = DEFAULT_TWEET_VERSION_2;
configuration.tweetParserInterval = DEFAULT_TWEET_PARSER_INTERVAL;
configuration.sorterMessageRxQueueInterval = DEFAULT_SORTER_INTERVAL;
configuration.keySortInterval = DEFAULT_SORTER_INTERVAL;
configuration.nodeSetPropsQueueInterval = DEFAULT_NODE_SETPROPS_QUEUE_INTERVAL;
configuration.transmitNodeQueueInterval = DEFAULT_TRANSMIT_NODE_QUEUE_INTERVAL;
configuration.rateQueueInterval = DEFAULT_RATE_QUEUE_INTERVAL;
configuration.rateQueueIntervalModulo = DEFAULT_RATE_QUEUE_INTERVAL_MODULO;
configuration.statsUpdateIntervalTime = DEFAULT_STATS_UPDATE_INTERVAL;
configuration.updateUserSetsInterval = DEFAULT_UPDATE_USER_SETS_INTERVAL;
configuration.updateHashtagSetsInterval = DEFAULT_UPDATE_HASHTAG_SETS_INTERVAL;

configuration.twitterRxQueueInterval = DEFAULT_TWITTER_RX_QUEUE_INTERVAL;
configuration.categoryHashmapsUpdateInterval = DEFAULT_CATEGORY_HASHMAPS_UPDATE_INTERVAL;
configuration.testInternetConnectionUrl = DEFAULT_TEST_INTERNET_CONNECTION_URL;
configuration.offlineMode = DEFAULT_OFFLINE_MODE;
configuration.autoOfflineMode = DEFAULT_AUTO_OFFLINE_MODE;

configuration.cursorBatchSize = DEFAULT_CURSOR_BATCH_SIZE;

configuration.enableTransmitUser = true;
configuration.enableTransmitWord = false;
configuration.enableTransmitPlace = false;
configuration.enableTransmitHashtag = true;
configuration.enableTransmitEmoji = false;
configuration.enableTransmitNgram = false;
configuration.enableTransmitUrl = false;
configuration.enableTransmitMedia = false;

configuration.socketAuthTimeout = DEFAULT_SOCKET_AUTH_TIMEOUT;
configuration.quitOnError = DEFAULT_QUIT_ON_ERROR;
configuration.maxTopTerms = DEFAULT_MAX_TOP_TERMS;
configuration.metrics = {};
configuration.metrics.nodeMeterEnabled = DEFAULT_METRICS_NODE_METER_ENABLED;
configuration.minFollowersAutoCategorize = DEFAULT_MIN_FOLLOWERS_AUTO_CATEGORIZE;
configuration.minFollowersAutoFollow = DEFAULT_MIN_FOLLOWERS_AUTO_FOLLOW;

const threeceeTwitter = {};
const threeceeInfoTwitter = {};

if (process.env.MIN_FOLLOWERS_AUTO_CATEGORIZE !== undefined) {
  configuration.minFollowersAutoCategorize = parseInt(
    process.env.MIN_FOLLOWERS_AUTO_CATEGORIZE
  );
}

if (process.env.MIN_FOLLOWERS_AUTO_FOLLOW !== undefined) {
  configuration.minFollowersAutoFollow = parseInt(
    process.env.MIN_FOLLOWERS_AUTO_FOLLOW
  );
}

if (process.env.NODE_METER_ENABLED !== undefined) {
  if (process.env.NODE_METER_ENABLED == "true") {
    configuration.metrics.nodeMeterEnabled = true;
  } else if (process.env.NODE_METER_ENABLED == "false") {
    configuration.metrics.nodeMeterEnabled = false;
  } else {
    configuration.metrics.nodeMeterEnabled = true;
  }
}

const help = { name: "help", alias: "h", type: Boolean };

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
  help,
];

async function quit(message) {
  statsObj.status = "QUITTING";

  console.log(chalkAlert("\nWAS | ... QUITTING ... " + getTimeStamp()));

  // const slackText = PF + " | *** QUIT | MESSAGE: " + message;

  // await slackSendWebMessage({ channel: slackChannel, text: slackText });

  if (userSearchCursor !== undefined) {
    userSearchCursor.close();
  }
  if (neuralNetworkChangeStream !== undefined) {
    neuralNetworkChangeStream.close();
  }
  if (userChangeStream !== undefined) {
    userChangeStream.close();
  }

  clearInterval(nodeCacheDeleteQueueInterval);
  clearInterval(heartbeatInterval);
  clearInterval(transmitNodeQueueInterval);
  clearInterval(tweetRxQueueInterval);
  clearInterval(tweetParserMessageRxQueueInterval);
  clearInterval(sorterMessageRxQueueInterval);
  clearInterval(keySortInterval);
  clearInterval(dbuPingInterval);
  clearInterval(tssPingInterval);
  clearInterval(tweetParserPingInterval);
  clearInterval(updateMetricsInterval);
  clearInterval(statsInterval);
  clearInterval(memStatsInterval);

  let msg = "";
  if (message) {
    msg = message;
  }

  console.log(chalkAlert(PF + " | ... QUITTING ..."));
  console.log(chalkAlert(PF + " | QUIT MESSAGE: " + msg));
  console.log(chalkAlert(PF + " | QUIT MESSAGE: " + msg));

  setTimeout(async function () {
    if (tcUtils !== undefined) {
      await tcUtils.stopSaveFileQueue();
    }
    process.exit();
  }, 5000);
}

const commandLineConfig = commandLineArgs(optionDefinitions);
console.log(
  chalkInfo(
    PF + " | COMMAND LINE CONFIG\nWAS | " + jsonPrint(commandLineConfig)
  )
);

if (Object.keys(commandLineConfig).includes("help")) {
  console.log(
    chalkInfo(PF + " | optionDefinitions\n" + jsonPrint(optionDefinitions))
  );
  quit("help").then(function () {
    console.log("QUIT");
  });
}

let adminNameSpace;
let utilNameSpace;
let userNameSpace;
let viewNameSpace;

const ignoredHashtagFile = "ignoredHashtag.txt";
const ignoredUserFile = "ignoredUser.json";
const ignoredProfileWordsFile = "ignoredProfileWords.txt";
const followableSearchTermFile = "followableSearchTerm.txt";

let ignoredProfileWordsSet = new Set();
ignoredProfileWordsSet.add("nsfw");
ignoredProfileWordsSet.add("18+");
// let ignoredProfileWordsArray = [...ignoredProfileWordsSet];

// const categorizeableUserSet = new Set();
const uncategorizeableUserSet = new Set();
let followableSearchTermSet = new Set();

followableSearchTermSet.add("abortion");
followableSearchTermSet.add("andrewyang");
followableSearchTermSet.add("aoc");
followableSearchTermSet.add("barack");
followableSearchTermSet.add("barackobama");
followableSearchTermSet.add("biden");
followableSearchTermSet.add("bluetsunami");
followableSearchTermSet.add("bluewave");
followableSearchTermSet.add("clinton");
followableSearchTermSet.add("clintons");
followableSearchTermSet.add("cnn");
followableSearchTermSet.add("congress");
followableSearchTermSet.add("conservative");
followableSearchTermSet.add("conservatives");
followableSearchTermSet.add("dem");
followableSearchTermSet.add("democrat");
followableSearchTermSet.add("democrats");
followableSearchTermSet.add("dnc");
followableSearchTermSet.add("drumpf");
followableSearchTermSet.add("election");
followableSearchTermSet.add("elections");
followableSearchTermSet.add("fbr");
followableSearchTermSet.add("forbes");
followableSearchTermSet.add("foxnews");
followableSearchTermSet.add("gop");
followableSearchTermSet.add("hanity");
followableSearchTermSet.add("hillary");
followableSearchTermSet.add("ivanka");
followableSearchTermSet.add("joebiden");
followableSearchTermSet.add("kamala");
followableSearchTermSet.add("liberal");
followableSearchTermSet.add("liberals");
followableSearchTermSet.add("livesmatter");
followableSearchTermSet.add("maga");
followableSearchTermSet.add("mcconnell");
followableSearchTermSet.add("mitchmcconnell");
followableSearchTermSet.add("msnbc");
followableSearchTermSet.add("mueller");
followableSearchTermSet.add("nytimes");
followableSearchTermSet.add("obama");
followableSearchTermSet.add("obamagate");
followableSearchTermSet.add("obamas");
followableSearchTermSet.add("pence");
followableSearchTermSet.add("pences");
followableSearchTermSet.add("potus");
followableSearchTermSet.add("pro choice");
followableSearchTermSet.add("pro life");
followableSearchTermSet.add("pro-choice");
followableSearchTermSet.add("pro-life");
followableSearchTermSet.add("prochoice");
followableSearchTermSet.add("prolife");
followableSearchTermSet.add("putin");
followableSearchTermSet.add("reagan");
followableSearchTermSet.add("republican");
followableSearchTermSet.add("republicans");
followableSearchTermSet.add("rnc");
followableSearchTermSet.add("scotus");
followableSearchTermSet.add("senate");
followableSearchTermSet.add("senator");
followableSearchTermSet.add("senators");
followableSearchTermSet.add("special counsel");
followableSearchTermSet.add("specialcounsel");
followableSearchTermSet.add("supreme court");
followableSearchTermSet.add("trump");
followableSearchTermSet.add("trumps");
followableSearchTermSet.add("yanggang");
followableSearchTermSet.add("🌊");

let followableSearchTermsArray = [...followableSearchTermSet];

const previousUserUncategorizedCreated = moment();

const fieldsExclude = {
  histograms: 0,
  countHistory: 0,
  friends: 0,
};

const fieldsTransmit = {
  ageDays: 1,
  bannerImageUrl: 1,
  categorizeNetwork: 1,
  categorized: 1,
  categorizedBy: 1,
  category: 1,
  categoryAuto: 1,
  categoryVerified: 1,
  createdAt: 1,
  followersCount: 1,
  following: 1,
  friendsCount: 1,
  isBot: 1,
  isTopTerm: 1,
  isTweeter: 1,
  isTweetSource: 1,
  lang: 1,
  lastSeen: 1,
  lastTweetId: 1,
  mentions: 1,
  name: 1,
  nodeId: 1,
  nodeType: 1,
  profileImageUrl: 1,
  rate: 1,
  tweeterId: 1, // tweet
  retweetCount: 1, // tweet
  quotedId: 1, // tweet
  quoteCount: 1, // tweet
  replyCount: 1, // tweet
  favoriteCount: 1, // tweet
  userMentions: 1, // tweet entities array
  hashtags: 1, // tweet entities array
  screenName: 1,
  screenNameLower: 1,
  statusesCount: 1,
  statusId: 1,
  text: 1,
  threeceeFollowing: 1,
  tweetsPerDay: 1,
  user: 1,
};

const fieldsTransmitKeys = Object.keys(fieldsTransmit);

let childrenHashMap = {};

let bestNetworkObj = false;

const defaultTwitterUserScreenName = "threecee";

// const followedUserSet = new Set();
const unfollowableUserSet = new Set();
let ignoredUserSet = new Set();
let ignoredHashtagSet = new Set();

process.title = "node_wordAssoServer";
console.log(chalkBlue(PF + " | ============= START ==============\n\n"));

console.log(chalkBlue(PF + " | PROCESS PID:   " + process.pid));
console.log(chalkBlue(PF + " | PROCESS TITLE: " + process.title));
console.log(chalkBlue(PF + " | ENVIRONMENT:   " + process.env.NODE_ENV));

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
  "–",
];

const categorizedUserHashMap = new HashMap();
const categorizedHashtagHashMap = new HashMap();
const adminHashMap = new HashMap();

const tweetMeter = new Measured.Meter({ rateUnit: 60000 });
const globalNodeMeter = new Measured.Meter({ rateUnit: 60000 });
const globalNodeCounter = new Measured.Counter();

let nodeMeter = {};
const nodeMeterType = {};

DEFAULT_NODE_TYPES.forEach(function (nodeType) {
  nodeMeterType[nodeType] = {};
});

let tweetRxQueueInterval;
const tweetParserMessageRxQueue = [];
const tweetRxQueue = [];

const keySortQueue = [];

let dbuPingInterval;
let dbuPingSent = false;
let dbuPongReceived = false;
let dbuPingId = false;

let tssPingInterval;
let tssPingSent = false;
let tssPongReceived = false;
let tssPingId = false;

let tweetParserPingInterval;
let tweetParserPingSent = false;
let tweetParserPongReceived = false;
let tweetParserPingId = false;

let statsInterval;

// ==================================================================
// DROPBOX
// ==================================================================
const configDefaultFolder = path.join(
  DROPBOX_ROOT_FOLDER,
  "config/utility/default"
);
const configHostFolder = path.join(
  DROPBOX_ROOT_FOLDER,
  "config/utility",
  hostname
);
const configDefaultFile = "default_wordAssoServerConfig.json";
const configHostFile = hostname + "_wordAssoServerConfig.json";

configuration.userDataFolder = path.join(
  configDefaultFolder,
  "trainingSets/users/data"
);

const botsFolder = path.join(configDefaultFolder, "bots");

const statsHostFolder = path.join(DROPBOX_ROOT_FOLDER, "stats", hostname);
const statsFile = "wordAssoServerStats.json";

const twitterConfigFolder = path.join(DROPBOX_ROOT_FOLDER, "config/twitter");
const bestNetworkFolder = path.join(
  DROPBOX_ROOT_FOLDER,
  "config/utility/best/neuralNetworks"
);

const childPidFolderLocal = path.join(
  DROPBOX_ROOT_FOLDER,
  "config/utility",
  hostname,
  "children"
);

const dropboxConfigDefaultTrainingSetsFolder = path.join(
  configDefaultFolder,
  "trainingSets"
);
const trainingSetsUsersFolder = path.join(
  dropboxConfigDefaultTrainingSetsFolder,
  "users"
);

const testDataFolder = path.join(
  configDefaultFolder,
  "test/testData/tweets/v1"
);

configuration.dropboxChangeFolderArray = [
  bestNetworkFolder,
  configDefaultFolder,
  configHostFolder,
  twitterConfigFolder,
  trainingSetsUsersFolder,
];

const userDefaults = function (user) {
  user.rate = user.rate || 0;
  return user;
};

function printUserObj(title, u, chalkFormat) {
  const chlk = chalkFormat || chalkInfo;

  const user = userDefaults(u);

  console.log(
    chlk(
      title +
        " | " +
        user.nodeId +
        " @" +
        user.screenName +
        " N: " +
        user.name +
        " FC: " +
        user.followersCount +
        " FD: " +
        user.friendsCount +
        " T: " +
        user.statusesCount +
        " M: " +
        user.mentions +
        " R: " +
        user.rate.toFixed(2) +
        " FW: " +
        formatBoolean(user.following) +
        " LS: " +
        getTimeStamp(user.lastSeen) +
        " CN: " +
        user.categorizeNetwork +
        " V: " +
        formatBoolean(user.categoryVerified) +
        " M: " +
        formatCategory(user.category) +
        " A: " +
        formatCategory(user.categoryAuto)
    )
  );
}

function printHashtag(params) {
  let text;
  const hashtag = params.hashtag;

  if (params.verbose) {
    return jsonPrint(params.hashtag);
  } else {
    text =
      "LS " +
      getTimeStamp(hashtag.lastSeen) +
      " | CR  " +
      getTimeStamp(hashtag.createdAt) +
      " | C M " +
      formatCategory(hashtag.category) +
      " A " +
      formatCategory(hashtag.categoryAuto) +
      " | M  " +
      hashtag.mentions +
      " | #" +
      hashtag.nodeId;

    return text;
  }
}

function printUser(params) {
  const user = params.user;

  if (params.verbose) {
    return jsonPrint(params.user);
  } else {
    const text =
      user.nodeId +
      " | @" +
      user.screenName +
      " | " +
      user.name +
      " | LG " +
      user.lang +
      " | FW " +
      user.followersCount +
      " | FD " +
      user.friendsCountf +
      " | T " +
      user.statusesCount +
      " | M  " +
      user.mentions +
      " | LS " +
      getTimeStamp(user.lastSeen) +
      " | FWG " +
      formatBoolean(user.following) +
      " | LC " +
      user.location +
      " | CN: " +
      user.categorizeNetwork +
      " | C M: " +
      formatCategory(user.category) +
      " A: " +
      formatCategory(user.categoryAuto);
    return text;
  }
}

function initPassport() {
  return new Promise(function (resolve) {
    const sessionId = btoa("threecee");

    console.log(chalk.green(PF + " | PASSPORT SESSION ID: " + sessionId));

    console.log({ threeceeConfig });

    passport.use(
      new TwitterStrategy(
        {
          consumerKey: threeceeConfig.consumer_key,
          consumerSecret: threeceeConfig.consumer_secret,
          callbackURL: TWITTER_AUTH_CALLBACK_URL,
        },
        function (token, tokenSecret, profile, cb) {
          console.log(
            chalk.green(PF + " | PASSPORT TWITTER AUTH: token:       " + token)
          );
          console.log(
            chalk.green(
              PF + " | PASSPORT TWITTER AUTH: tokenSecret: " + tokenSecret
            )
          );
          console.log(
            chalk.green(
              PF +
                " | PASSPORT TWITTER AUTH: USER:       @" +
                profile.username +
                " | " +
                profile.id
            )
          );

          if (configuration.verbose) {
            console.log(
              chalk.green(
                PF + " | PASSPORT TWITTER AUTH\nprofile\n" + jsonPrint(profile)
              )
            );
          }

          const rawUser = profile._json;

          userServerController.convertRawUser(
            { user: rawUser },
            function (err, user) {
              if (err) {
                console.log(
                  chalkError(
                    PF +
                      " | *** UNCATEGORIZED USER | convertRawUser ERROR: " +
                      err +
                      "\nrawUser\n" +
                      jsonPrint(rawUser)
                  )
                );
                return cb("RAW USER", rawUser);
              }

              printUserObj(PF + " | MONGO DB | TWITTER AUTH USER", user);

              userServerController.findOneUser(
                user,
                { noInc: true, fields: fieldsExclude },
                async function (err, updatedUser) {
                  if (err) {
                    console.log(
                      chalkError(PF + " | ***findOneUser ERROR: " + err)
                    );
                    return cb(err);
                  }

                  if (configuration.verbose) {
                    console.log(
                      chalk.blue(
                        PF +
                          " | UPDATED updatedUser" +
                          " | PREV CR: " +
                          previousUserUncategorizedCreated.format(
                            compactDateTimeFormat
                          ) +
                          " | USER CR: " +
                          getTimeStamp(updatedUser.createdAt) +
                          "\nWAS | " +
                          printUser({ user: updatedUser })
                      )
                    );
                  }

                  if (
                    configuration.threeceeInfoUsersArray.includes(
                      updatedUser.screenName
                    )
                  ) {
                    threeceeInfoTwitter.twitterAuthorizationErrorFlag = false;
                    threeceeInfoTwitter.twitterCredentialErrorFlag = false;
                    threeceeInfoTwitter.twitterErrorFlag = false;
                    threeceeInfoTwitter.twitterFollowLimit = false;
                    threeceeInfoTwitter.twitterTokenErrorFlag = false;
                  } else {
                    threeceeTwitter.twitterAuthorizationErrorFlag = false;
                    threeceeTwitter.twitterCredentialErrorFlag = false;
                    threeceeTwitter.twitterErrorFlag = false;
                    threeceeTwitter.twitterFollowLimit = false;
                    threeceeTwitter.twitterTokenErrorFlag = false;
                  }

                  if (tssChild !== undefined) {
                    tssChild.send({
                      op: "USER_AUTHENTICATED",
                      token: token,
                      tokenSecret: tokenSecret,
                      user: updatedUser,
                    });
                  }

                  adminNameSpace.emit("USER_AUTHENTICATED", updatedUser);
                  viewNameSpace.emit("USER_AUTHENTICATED", updatedUser);

                  slackText =
                    "*USER_AUTHENTICATED | @" + updatedUser.screenName + "*";

                  await slackSendWebMessage({
                    channel: slackChannelUserAuth,
                    text: slackText,
                  });

                  cb(null, updatedUser);
                }
              );
            }
          );
        }
      )
    );

    passport.serializeUser(async function (user, done) {
      const sessionUser = {
        _id: user._id,
        nodeId: user.nodeId,
        screenName: user.screenName,
        name: user.name,
      };

      console.log(
        chalk.green(PF + " | PASSPORT SERIALIZE USER | @" + user.screenName)
      );

      done(null, sessionUser);
    });

    passport.deserializeUser(async function (sessionUser, done) {
      console.log(
        chalk.green(
          PF + " | PASSPORT DESERIALIZE USER | @" + sessionUser.screenName
        )
      );

      // slackText = "*PASSPORT TWITTER DESERIALIZE USER*";
      // slackText = slackText + "\nUSER NID:  " + sessionUser.nodeId;
      // slackText = slackText + "\nUSER      @" + sessionUser.screenName;
      // slackText = slackText + "\nUSER NAME: " + sessionUser.name;

      // await slackSendWebMessage({ channel: slackChannel, text: slackText });

      done(null, sessionUser);
    });

    app.use(
      expressSession({
        sessionId: sessionId,
        secret: DEFAULT_MONGODB_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        // store: new MongoStore({ mongooseConnection: global.dbConnection }),
        store: MongoStore.create({ mongoUrl: DEFAULT_MONGODB_URL }),
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/auth/twitter", passport.authenticate("twitter"));

    app.get(
      "/auth/twitter/callback",
      passport.authenticate("twitter", {
        successReturnToOrRedirect: "/after-auth.html",
        failureRedirect: "/login",
      })
    );

    app.get(
      "/login_auth",
      passport.authenticate("local", {
        successReturnToOrRedirect: "/after-auth.html",
        failureRedirect: "/login",
      })
    );

    resolve();
  });
}

statsObj.dbConnectBusy = false;

function touchChildPidFile(params) {
  const childPidFile = params.childId + "=" + params.pid;

  const folder = params.folder || childPidFolderLocal;

  shell.mkdir("-p", folder);

  const path = folder + "/" + childPidFile;

  touch.sync(path, { force: true });

  console.log(chalkBlue(PF + " | TOUCH CHILD PID FILE: " + path));
}

// ==================================================================
// IP CACHE
// ==================================================================

let ipCacheTtl = process.env.IP_CACHE_DEFAULT_TTL;
if (empty(ipCacheTtl)) {
  ipCacheTtl = IP_CACHE_DEFAULT_TTL;
}

console.log(PF + " | IP CACHE TTL: " + ipCacheTtl + " SECONDS");

let ipCacheCheckPeriod = process.env.IP_CACHE_CHECK_PERIOD;
if (empty(ipCacheCheckPeriod)) {
  ipCacheCheckPeriod = IP_CACHE_CHECK_PERIOD;
}

console.log(
  PF + " | IP CACHE CHECK PERIOD: " + ipCacheCheckPeriod + " SECONDS"
);

const ipCache = new NodeCache({
  stdTTL: ipCacheTtl,
  checkperiod: ipCacheCheckPeriod,
});

function ipCacheExpired(ip, ipCacheObj) {
  statsObj.caches.ipCache.expired += 1;

  console.log(
    chalkInfo(
      PF +
        " | XXX IP CACHE EXPIRED" +
        " [" +
        ipCache.getStats().keys +
        " KEYS]" +
        " | TTL: " +
        msToTime(ipCacheTtl * 1000) +
        " | NOW: " +
        getTimeStamp() +
        " | $ EXPIRED: " +
        statsObj.caches.ipCache.expired +
        " | IN $: " +
        ipCacheObj.timeStamp +
        " | IP: " +
        ip +
        " | DOMAIN: " +
        ipCacheObj.domainName
    )
  );
}

ipCache.on("expired", ipCacheExpired);

// ==================================================================
// TWEET ID CACHE
// ==================================================================
let tweetIdCacheTtl = process.env.TWEET_ID_CACHE_DEFAULT_TTL;
if (empty(tweetIdCacheTtl)) {
  tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL;
}

console.log(PF + " | TWEET ID CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (empty(tweetIdCacheCheckPeriod)) {
  tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD;
}

console.log(
  PF + " | TWEET ID CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS"
);

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod,
});

// ==================================================================
// VIEWER CACHE
// ==================================================================
let viewerCacheTtl = process.env.VIEWER_CACHE_DEFAULT_TTL;
if (empty(viewerCacheTtl)) {
  viewerCacheTtl = VIEWER_CACHE_DEFAULT_TTL;
}

console.log(PF + " | VIEWER CACHE TTL: " + viewerCacheTtl + " SECONDS");

let viewerCacheCheckPeriod = process.env.VIEWER_CACHE_CHECK_PERIOD;
if (empty(viewerCacheCheckPeriod)) {
  viewerCacheCheckPeriod = VIEWER_CACHE_CHECK_PERIOD;
}

console.log(
  PF + " | VIEWER CACHE CHECK PERIOD: " + viewerCacheCheckPeriod + " SECONDS"
);

const viewerCache = new NodeCache({
  stdTTL: viewerCacheTtl,
  checkperiod: viewerCacheCheckPeriod,
});

function viewerCacheExpired(viewerCacheId, viewerObj) {
  console.log(
    chalkInfo(
      PF +
        " | XXX VIEWER CACHE EXPIRED" +
        " [" +
        viewerCache.getStats().keys +
        " KEYS]" +
        " | TTL: " +
        viewerCacheTtl +
        " SECS" +
        " | TYPE: " +
        viewerObj.user.type.toUpperCase() +
        " | " +
        viewerCacheId +
        " | USER ID: " +
        viewerObj.user.userId +
        "\nNOW: " +
        getTimeStamp() +
        " | TS: " +
        getTimeStamp(viewerObj.timeStamp) +
        " | AGO: " +
        msToTime(moment().valueOf() - viewerObj.timeStamp)
    )
  );

  adminNameSpace.emit("VIEWER_EXPIRED", viewerObj);
}

viewerCache.on("expired", viewerCacheExpired);

// ==================================================================
// SERVER CACHE
// ==================================================================
let serverCacheTtl = process.env.SERVER_CACHE_DEFAULT_TTL;
if (empty(serverCacheTtl)) {
  serverCacheTtl = SERVER_CACHE_DEFAULT_TTL;
}
console.log(PF + " | SERVER CACHE TTL: " + serverCacheTtl + " SECONDS");

let serverCacheCheckPeriod = process.env.SERVER_CACHE_CHECK_PERIOD;
if (empty(serverCacheCheckPeriod)) {
  serverCacheCheckPeriod = SERVER_CACHE_CHECK_PERIOD;
}
console.log(
  PF + " | SERVER CACHE CHECK PERIOD: " + serverCacheCheckPeriod + " SECONDS"
);

const serverCache = new NodeCache({
  stdTTL: serverCacheTtl,
  checkperiod: serverCacheCheckPeriod,
});

function serverCacheExpired(serverCacheId, serverObj) {
  console.log(
    chalkInfo(
      PF +
        " | XXX SERVER CACHE EXPIRED" +
        " [" +
        serverCache.getStats().keys +
        " KEYS]" +
        " | TTL: " +
        serverCacheTtl +
        " SECS" +
        " | TYPE: " +
        serverObj.user.type.toUpperCase() +
        " | " +
        serverCacheId +
        " | USER ID: " +
        serverObj.user.userId +
        "\nNOW: " +
        getTimeStamp() +
        " | TS: " +
        getTimeStamp(serverObj.timeStamp) +
        " | AGO: " +
        msToTime(moment().valueOf() - serverObj.timeStamp)
    )
  );

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
console.log(
  PF +
    " | AUTHENTICATED SOCKET CACHE TTL: " +
    authenticatedSocketCacheTtl +
    " SECONDS"
);

let authenticatedSocketCacheCheckPeriod =
  process.env.AUTH_SOCKET_CACHE_CHECK_PERIOD;
if (empty(authenticatedSocketCacheCheckPeriod)) {
  authenticatedSocketCacheCheckPeriod = AUTH_SOCKET_CACHE_CHECK_PERIOD;
}
console.log(
  PF +
    " | AUTHENTICATED SOCKET CACHE CHECK PERIOD: " +
    authenticatedSocketCacheCheckPeriod +
    " SECONDS"
);

const authenticatedSocketCache = new NodeCache({
  stdTTL: authenticatedSocketCacheTtl,
  checkperiod: authenticatedSocketCacheCheckPeriod,
});

function authenticatedSocketCacheExpired(socketId, authSocketObj) {
  console.log(
    chalkInfo(
      PF +
        " | XXX AUTH SOCKET CACHE EXPIRED" +
        " [" +
        authenticatedSocketCache.getStats().keys +
        " KEYS]" +
        " | TTL: " +
        msToTime(authenticatedSocketCacheTtl * 1000) +
        " | NSP: " +
        authSocketObj.namespace.toUpperCase() +
        " | " +
        socketId +
        " | " +
        authSocketObj.ipAddress +
        " | USER ID: " +
        authSocketObj.userId +
        " | NOW: " +
        getTimeStamp() +
        " | TS: " +
        getTimeStamp(authSocketObj.timeStamp) +
        " | AGO: " +
        msToTime(moment().valueOf() - authSocketObj.timeStamp)
    )
  );

  authenticatedSocketCache.keys(function (err, socketIds) {
    if (!err) {
      socketIds.forEach(function (socketId) {
        const authSocketObjCache = authenticatedSocketCache.get(socketId);

        if (authSocketObjCache !== undefined) {
          console.log(
            chalkInfo(
              PF +
                " | AUTH SOCKET CACHE ENTRIES" +
                " | NSP: " +
                authSocketObjCache.namespace.toUpperCase() +
                " | " +
                socketId +
                " | " +
                authSocketObjCache.ipAddress +
                " | USER ID: " +
                authSocketObjCache.userId +
                " | NOW: " +
                getTimeStamp() +
                " | TS: " +
                getTimeStamp(authSocketObjCache.timeStamp) +
                " | AGO: " +
                msToTime(moment().valueOf() - authSocketObjCache.timeStamp)
            )
          );
        } else {
          console.log(
            chalkAlert(
              PF + " | ??? AUTH SOCKET CACHE NO ENTRY? | SOCKET ID: " + socketId
            )
          );
        }
      });
    } else {
      console.log(chalkError(PF + " | *** AUTH CACHE GET KEYS ERROR: " + err));
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
console.log(
  PF +
    " | AUTHENTICATED TWITTER USER CACHE TTL: " +
    authenticatedTwitterUserCacheTtl +
    " SECONDS"
);

let authenticatedTwitterUserCacheCheckPeriod =
  process.env.AUTH_USER_CACHE_CHECK_PERIOD;
if (empty(authenticatedTwitterUserCacheCheckPeriod)) {
  authenticatedTwitterUserCacheCheckPeriod = AUTH_USER_CACHE_CHECK_PERIOD;
}
console.log(
  PF +
    " | AUTHENTICATED TWITTERUSER CACHE CHECK PERIOD: " +
    authenticatedTwitterUserCacheCheckPeriod +
    " SECONDS"
);

const authenticatedTwitterUserCache = new NodeCache({
  stdTTL: authenticatedTwitterUserCacheTtl,
  checkperiod: authenticatedTwitterUserCacheCheckPeriod,
});

function authenticatedTwitterUserCacheExpired(nodeId, userObj) {
  console.log(
    chalkInfo(
      PF +
        " | XXX AUTH TWITTER USER CACHE EXPIRED" +
        " [" +
        authenticatedTwitterUserCache.getStats().keys +
        " KEYS]" +
        " | TTL: " +
        authenticatedTwitterUserCacheTtl +
        " SECS" +
        " | LS: " +
        userObj.lastSeen +
        " | @" +
        userObj.screenName
    )
  );
}

authenticatedTwitterUserCache.on(
  "expired",
  authenticatedTwitterUserCacheExpired
);

// ==================================================================
// AUTH IN PROGRESS CACHE
// ==================================================================
let authInProgressTwitterUserCacheTtl =
  process.env.AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;
if (empty(authInProgressTwitterUserCacheTtl)) {
  authInProgressTwitterUserCacheTtl = AUTH_IN_PROGRESS_CACHE_DEFAULT_TTL;
}
console.log(
  PF +
    " | AUTH IN PROGRESS CACHE TTL: " +
    authInProgressTwitterUserCacheTtl +
    " SECONDS"
);

let authInProgressTwitterUserCacheCheckPeriod =
  process.env.AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
if (empty(authInProgressTwitterUserCacheCheckPeriod)) {
  authInProgressTwitterUserCacheCheckPeriod = AUTH_IN_PROGRESS_CACHE_CHECK_PERIOD;
}
console.log(
  PF +
    " | AUTH IN PROGRESS CACHE CHECK PERIOD: " +
    authInProgressTwitterUserCacheCheckPeriod +
    " SECONDS"
);

const authInProgressTwitterUserCache = new NodeCache({
  stdTTL: authInProgressTwitterUserCacheTtl,
  checkperiod: authInProgressTwitterUserCacheCheckPeriod,
});

authInProgressTwitterUserCache.on("expired", function (nodeId, userObj) {
  console.log(
    chalkInfo(
      PF +
        " | XXX AUTH IN PROGRESS TWITTER USER CACHE EXPIRED" +
        " [" +
        authInProgressTwitterUserCache.getStats().keys +
        " KEYS]" +
        " | TTL: " +
        authInProgressTwitterUserCacheTtl +
        " SECS" +
        " | NODE ID: " +
        nodeId +
        " | userObj\n" +
        jsonPrint(userObj)
    )
  );
});

// ==================================================================
// NODE CACHE
// ==================================================================
let nodeCacheTtl = process.env.NODE_CACHE_DEFAULT_TTL;
if (empty(nodeCacheTtl)) {
  nodeCacheTtl = NODE_CACHE_DEFAULT_TTL;
}
console.log(PF + " | NODE CACHE TTL: " + nodeCacheTtl + " SECONDS");

let nodeCacheCheckPeriod = process.env.NODE_CACHE_CHECK_PERIOD;
if (empty(nodeCacheCheckPeriod)) {
  nodeCacheCheckPeriod = NODE_CACHE_CHECK_PERIOD;
}
console.log(
  PF + " | NODE CACHE CHECK PERIOD: " + nodeCacheCheckPeriod + " SECONDS"
);

const nodeCache = new NodeCache({
  stdTTL: nodeCacheTtl,
  checkperiod: nodeCacheCheckPeriod,
});

const nodeCacheDeleteQueue = [];

function nodeCacheExpired(nodeObj, callback) {
  const nodeCacheId = nodeObj.nodeId;

  if (nodeMeter[nodeCacheId] || nodeMeter[nodeCacheId] !== undefined) {
    nodeMeter[nodeCacheId].end();
    nodeMeter[nodeCacheId] = null;

    nodeMeter = omit(nodeMeter, nodeCacheId);
    delete nodeMeter[nodeCacheId];

    if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
      statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
      statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
      console.log(
        chalkLog(
          PF +
            " | NEW MAX NODE METER ENTRIES" +
            " | " +
            getTimeStamp() +
            " | " +
            statsObj.nodeMeterEntries.toFixed(0)
        )
      );
    }
  }

  if (
    nodeMeterType[nodeObj.nodeType][nodeCacheId] ||
    nodeMeterType[nodeObj.nodeType][nodeCacheId] !== undefined
  ) {
    nodeMeterType[nodeObj.nodeType][nodeCacheId].end();
    nodeMeterType[nodeObj.nodeType][nodeCacheId] = null;

    nodeMeterType[nodeObj.nodeType] = omit(
      nodeMeterType[nodeObj.nodeType],
      nodeCacheId
    );
    delete nodeMeterType[nodeObj.nodeType][nodeCacheId];
  }

  callback();
}

nodeCache.on("expired", function (nodeCacheId, nodeObj) {
  nodeCacheDeleteQueue.push(nodeObj);
});

let nodeCacheDeleteReady = true;
let nodeObj;

const nodeCacheDeleteQueueInterval = setInterval(function () {
  if (nodeCacheDeleteReady && nodeCacheDeleteQueue.length > 0) {
    nodeCacheDeleteReady = false;

    nodeObj = nodeCacheDeleteQueue.shift();

    nodeCacheExpired(nodeObj, function () {
      nodeCacheDeleteReady = true;
    });
  }
}, configuration.nodeCacheDeleteQueueInterval);

let nodesPerMinuteTopTermTtl = process.env.TOPTERMS_CACHE_DEFAULT_TTL;

if (empty(nodesPerMinuteTopTermTtl)) {
  nodesPerMinuteTopTermTtl = TOPTERMS_CACHE_DEFAULT_TTL;
}

console.log(
  PF + " | TOP TERMS WPM CACHE TTL: " + nodesPerMinuteTopTermTtl + " SECONDS"
);

let nodesPerMinuteTopTermCheckPeriod = process.env.TOPTERMS_CACHE_CHECK_PERIOD;

if (empty(nodesPerMinuteTopTermCheckPeriod)) {
  nodesPerMinuteTopTermCheckPeriod = TOPTERMS_CACHE_CHECK_PERIOD;
}

console.log(
  PF +
    " | TOP TERMS WPM CACHE CHECK PERIOD: " +
    nodesPerMinuteTopTermCheckPeriod +
    " SECONDS"
);

const nodesPerMinuteTopTermCache = new NodeCache({
  stdTTL: nodesPerMinuteTopTermTtl,
  checkperiod: TOPTERMS_CACHE_CHECK_PERIOD,
});

const nodesPerMinuteTopTermNodeTypeCache = {};

DEFAULT_NODE_TYPES.forEach(function (nodeType) {
  nodesPerMinuteTopTermNodeTypeCache[nodeType] = new NodeCache({
    stdTTL: nodesPerMinuteTopTermTtl,
    checkperiod: TOPTERMS_CACHE_CHECK_PERIOD,
  });
});

const cacheObj = {};
cacheObj.ipCache = ipCache;
cacheObj.nodeCache = nodeCache;
cacheObj.serverCache = serverCache;
cacheObj.viewerCache = viewerCache;
cacheObj.nodesPerMinuteTopTermCache = nodesPerMinuteTopTermCache;
cacheObj.nodesPerMinuteTopTermNodeTypeCache = {};
cacheObj.authenticatedTwitterUserCache = authenticatedTwitterUserCache;
cacheObj.authInProgressTwitterUserCache = authInProgressTwitterUserCache;
cacheObj.authenticatedSocketCache = authenticatedSocketCache;

DEFAULT_NODE_TYPES.forEach(function (nodeType) {
  cacheObj.nodesPerMinuteTopTermNodeTypeCache[nodeType] =
    nodesPerMinuteTopTermNodeTypeCache[nodeType];
});

let cacheObjKeys = Object.keys(cacheObj);

let updateMetricsInterval;

const http = require("http");

const httpServer = http.createServer(app);

const ioConfig = {
  pingInterval: DEFAULT_IO_PING_INTERVAL,
  pingTimeout: DEFAULT_IO_PING_TIMEOUT,
  reconnection: true,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
};

const io = require("socket.io")(httpServer, ioConfig);

const cp = require("child_process");
const { error } = require("console");
const sorterMessageRxQueue = [];

const ignoreWordHashMap = new HashMap();
const localHostHashMap = new HashMap();

const statsBestNetworkPickArray = [
  "networkTechnology",
  "networkId",
  "successRate",
  "matchRate",
  "overallMatchRate",
  "runtimeMatchRate",
  "inputsId",
  "testCycles",
  "numInputs",
  "seedNetworkId",
  "seedNetworkRes",
  "betterChild",
];

let tweetParserReady = false;

function initStats() {
  console.log(chalk.bold.black(PF + " | INIT STATS"));

  statsObj.ioReady = false;
  statsObj.internetReady = false;
  statsObj.internetTestError = false;

  statsObj.tweetParserReady = false;
  tweetParserReady = false;

  statsObj.tweetParserSendReady = false;
  statsObj.previousBestNetworkId = "";

  statsObj.user.added = 0;
  statsObj.user.deleted = 0;
  statsObj.user.categoryChanged = 0;
  statsObj.user.categoryAutoChanged = 0;
  statsObj.user.categorizeNetworkChanged = 0;
  statsObj.user.categoryVerifiedChanged = 0;

  statsObj.user.category = {};
  statsObj.user.category.right = 0;
  statsObj.user.category.left = 0;
  statsObj.user.category.neutral = 0;
  statsObj.user.category.positive = 0;
  statsObj.user.category.negative = 0;
  statsObj.user.category.none = 0;

  statsObj.user.categoryAuto = {};
  statsObj.user.categoryAuto.right = 0;
  statsObj.user.categoryAuto.left = 0;
  statsObj.user.categoryAuto.neutral = 0;
  statsObj.user.categoryAuto.positive = 0;
  statsObj.user.categoryAuto.negative = 0;
  statsObj.user.categoryAuto.none = 0;

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
  statsObj.user.uncategorizedAuto = 0;
  statsObj.user.matched = 0;
  statsObj.user.mismatched = 0;

  statsObj.hashtag.total = 0;
  statsObj.hashtag.categorizedManual = 0;
  statsObj.hashtag.uncategorizedTotal = 0;

  statsObj.hashtag.category = {};
  statsObj.hashtag.category.right = 0;
  statsObj.hashtag.category.left = 0;
  statsObj.hashtag.category.neutral = 0;
  statsObj.hashtag.category.positive = 0;
  statsObj.hashtag.category.negative = 0;
  statsObj.hashtag.category.none = 0;

  statsObj.bestNetwork = {};
  statsObj.bestNetwork.networkTechnology = "";
  statsObj.bestNetwork.networkId = false;
  statsObj.bestNetwork.successRate = false;
  statsObj.bestNetwork.matchRate = false;
  statsObj.bestNetwork.overallMatchRate = false;
  statsObj.bestNetwork.runtimeMatchRate = false;
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
  statsObj.caches.ipCache.expired = 0;

  statsObj.caches.nodeCache = {};
  statsObj.caches.nodeCache.stats = {};
  statsObj.caches.nodeCache.stats.keys = 0;
  statsObj.caches.nodeCache.stats.keysMax = 0;

  statsObj.caches.nodesPerMinuteTopTermCache = {};
  statsObj.caches.nodesPerMinuteTopTermCache.stats = {};
  statsObj.caches.nodesPerMinuteTopTermCache.stats.keys = 0;
  statsObj.caches.nodesPerMinuteTopTermCache.stats.keysMax = 0;

  statsObj.caches.nodesPerMinuteTopTermNodeTypeCache = {};

  DEFAULT_NODE_TYPES.forEach(function (nodeType) {
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType] = {};
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType].stats = {};
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[nodeType].stats.keys = 0;
    statsObj.caches.nodesPerMinuteTopTermNodeTypeCache[
      nodeType
    ].stats.keysMax = 0;
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
  statsObj.queues.tweetRxQueue = 0;
  statsObj.queues.saveFileQueue = 0;

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

  return;
}

function showStats(options) {
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
  statsObj.nodeCount = parseInt(globalNodeCounter.toJSON());

  if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin) {
    statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
    statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
  }

  if (options) {
    console.log(chalkLog(PF + " | STATS\n" + jsonPrint(statsObj)));
  }

  console.log(
    chalkLog(
      PF +
        " | S" +
        " | " +
        getTimeStamp() +
        " | E " +
        statsObj.elapsed +
        " | S " +
        getTimeStamp(parseInt(statsObj.startTime)) +
        " | AD " +
        statsObj.admin.connected +
        " | UT " +
        statsObj.entity.util.connected +
        " | VW " +
        statsObj.entity.viewer.connected +
        " | USRs + " +
        statsObj.user.added +
        " X " +
        statsObj.user.deleted +
        " | NPM " +
        statsObj.nodesPerMin +
        " | TPM " +
        statsObj.twitter.tweetsPerMin +
        " | MTPM " +
        statsObj.twitter.maxTweetsPerMin +
        " @ " +
        getTimeStamp(statsObj.twitter.maxTweetsPerMinTime) +
        " | NSPQ " +
        nodeSetPropsQueue.length +
        " | TwRXQ " +
        tweetRxQueue.length +
        " | T/RT/QT " +
        statsObj.twitter.tweetsReceived +
        "/" +
        statsObj.twitter.retweetsReceived +
        "/" +
        statsObj.twitter.quotedTweetsReceived +
        " | TNQ " +
        transmitNodeQueue.length +
        " | TNQ RDY " +
        transmitNodeQueueReady
    )
  );

  return;
}

function loadCommandLineArgs() {
  return new Promise(function (resolve, reject) {
    statsObj.status = "LOAD COMMAND LINE ARGS";

    const commandLineConfigKeys = Object.keys(commandLineConfig);

    async.each(
      commandLineConfigKeys,
      function (arg, cb) {
        configuration[arg] = commandLineConfig[arg];
        console.log(
          PF + " | --> COMMAND LINE CONFIG | " + arg + ": " + configuration[arg]
        );
        cb();
      },
      function (err) {
        if (err) {
          return reject(err);
        }
        statsObj.commandLineArgsLoaded = true;
        resolve();
      }
    );
  });
}

function killChild(params) {
  return new Promise(function (resolve, reject) {
    let pid;

    if (empty(params.pid) && empty(childrenHashMap[params.childId])) {
      return reject(new Error("CHILD ID NOT FOUND: " + params.childId));
    }

    if (params.pid) {
      pid = params.pid;
    } else if (
      params.childId &&
      childrenHashMap[params.childId] !== undefined
    ) {
      pid = childrenHashMap[params.childId].pid;
    }

    kill(pid, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(params);
    });
  });
}

function getChildProcesses() {
  return new Promise(function (resolve, reject) {
    const childPidArray = [];

    shell.mkdir("-p", childPidFolderLocal);

    debug("SHELL: cd " + childPidFolderLocal);
    shell.cd(childPidFolderLocal);

    const childPidFileNameArray = shell.ls(DEFAULT_CHILD_ID_PREFIX + "*");

    if (!childPidFileNameArray || childPidFileNameArray.length == 0) {
      return resolve(childPidArray);
    }

    async.eachSeries(
      childPidFileNameArray,
      function (childPidFileName, cb) {
        debug("SHELL: childPidFileName: " + childPidFileName);

        // wa_node_child_dbu=46633
        const childPidStringArray = childPidFileName.split("=");

        const childId = childPidStringArray[0];
        const childPid = parseInt(childPidStringArray[1]);

        debug("SHELL: CHILD ID: " + childId + " | PID: " + childPid);

        if (childrenHashMap[childId]) {
          debug(
            "CHILD HM HIT" +
              " | ID: " +
              childId +
              " | SHELL PID: " +
              childPid +
              " | HM PID: " +
              childrenHashMap[childId].pid +
              " | STATUS: " +
              childrenHashMap[childId].status
          );
        } else {
          debug(
            "CHILD HM MISS | ID: " +
              childId +
              " | PID: " +
              childPid +
              " | STATUS: UNKNOWN"
          );
        }

        if (
          childrenHashMap[childId] !== undefined &&
          childrenHashMap[childId].pid == childPid
        ) {
          // cool kid
          childPidArray.push({ pid: childPid, childId: childId });

          debug(
            chalkInfo(
              PF +
                " | FOUND CHILD" +
                " [ " +
                childPidArray.length +
                " CHILDREN ]" +
                " | ID: " +
                childId +
                " | PID: " +
                childPid +
                " | FILE: " +
                childPidFileName
            )
          );

          cb();
        } else {
          debug(
            "SHELL: CHILD NOT IN HASH | ID: " + childId + " | PID: " + childPid
          );

          if (empty(childrenHashMap[childId])) {
            childrenHashMap[childId] = {};
            childrenHashMap[childId].status = "ZOMBIE";
          }

          console.log(
            chalkAlert(
              PF +
                " | *** CHILD ZOMBIE" +
                " | STATUS: " +
                childrenHashMap[childId].status +
                " | TERMINATING ..."
            )
          );

          kill(childPid, function (err) {
            if (err) {
              console.log(chalkError(PF + " | *** KILL ZOMBIE ERROR: ", err));
              return cb(err);
            }

            delete childrenHashMap[childId];

            shell.rm(childPidFileName);

            console.log(
              chalkAlert(
                PF +
                  " | XXX CHILD ZOMBIE" +
                  " [ " +
                  childPidArray.length +
                  " CHILDREN ]" +
                  " | ID: " +
                  childId +
                  " | PID: " +
                  childPid
              )
            );

            cb();
          });
        }
      },
      function (err) {
        if (err) {
          return reject(err);
        }

        resolve(childPidArray);
      }
    );
  });
}

async function killAll() {
  try {
    const childPidArray = await getChildProcesses({ searchTerm: "ALL" });

    console.log(
      chalk.green(
        "getChildProcesses childPidArray\n" + jsonPrint(childPidArray)
      )
    );

    if (childPidArray && childPidArray.length > 0) {
      childPidArray.forEach(async function (childObj) {
        try {
          await killChild({ pid: childObj.pid });
          console.log(
            chalkAlert(
              PF +
                " | XXX KILL ALL | KILLED | PID: " +
                childObj.pid +
                " | CH ID: " +
                childObj.childId
            )
          );
        } catch (err) {
          console.log(
            chalkError(
              PF +
                " | *** KILL CHILD ERROR" +
                " | PID: " +
                childObj.pid +
                " | ERROR: " +
                err
            )
          );
          throw err;
        }
      });

      return childPidArray;
    }

    console.log(chalkBlue(PF + " | XXX KILL ALL | NO CHILDREN"));
    return childPidArray;
  } catch (err) {
    console.log(chalkError(PF + " | *** killAll ERROR: " + err));
    throw err;
  }
}

process.on("unhandledRejection", async function (err, promise) {
  console.trace(
    PF + " | *** Unhandled rejection | PROMISE: " + promise + " | ERROR: " + err
  );
  console.log(promise);
  await quit("unhandledRejection");
});

process.on("exit", async function processExit() {
  console.log(chalkAlert("\nWAS | MAIN PROCESS EXITING ...\n"));

  try {
    await killAll();
  } catch (err) {
    console.log(chalkError(PF + " | *** MAIN PROCESS EXIT ERROR: " + err));
  }
});

process.on("message", async function processMessageRx(msg) {
  if (msg == "SIGINT" || msg == "shutdown") {
    console.log(
      chalkAlert(
        "\nWAS | =============================\nWAS" +
          " | *** SHUTDOWN OR SIGINT ***\nWAS | =============================\n"
      )
    );

    try {
      await tcUtils.saveFile({
        folder: statsHostFolder,
        statsFile: statsFile,
        obj: statsObj,
      });
    } catch (err) {
      console.log(chalkError(PF + " | *** SAVE STATS ERROR: " + err));
    }

    setTimeout(async function quitTimeout() {
      showStats(true);
      await quit(msg);
    }, 1000);
  }
});

configEvents.on("CHILD_ERROR", function childError(childObj) {
  console.log(
    chalkError(
      PF +
        " | *** CHILD_ERROR" +
        " | " +
        childObj.childId +
        " | ERROR: " +
        jsonPrint(childObj.err)
    )
  );

  if (childrenHashMap[childObj.childId] !== undefined) {
    childrenHashMap[childObj.childId].errors += 1;
    childrenHashMap[childObj.childId].status = "UNKNOWN";
  }

  switch (childObj.childId) {
    case DEFAULT_DBU_CHILD_ID:
      console.log(chalkError(PF + " | *** KILL DBU CHILD"));

      killChild({ childId: DEFAULT_DBU_CHILD_ID }, function (err) {
        if (err) {
          console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
        } else {
          initDbuChild({ childId: DEFAULT_DBU_CHILD_ID });
        }
      });

      break;

    case DEFAULT_TSS_CHILD_ID:
      console.log(chalkError(PF + " | *** KILL TSS CHILD"));

      killChild({ childId: DEFAULT_TSS_CHILD_ID }, async function (err) {
        if (err) {
          console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
        } else {
          await initTssChild({
            childId: DEFAULT_TSS_CHILD_ID,
            tweetVersion2: configuration.tweetVersion2,
            threeceeUser: childrenHashMap[DEFAULT_TSS_CHILD_ID].threeceeUser,
          });
        }
      });

      break;

    case DEFAULT_TWP_CHILD_ID:
      console.log(chalkError(PF + " | *** KILL TWEET PARSER"));

      killChild({ childId: DEFAULT_TWP_CHILD_ID }, function (err) {
        if (err) {
          console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
        } else {
          initTweetParser({ childId: DEFAULT_TWP_CHILD_ID });
        }
      });

      break;

    default:
      console.log(
        chalkError(
          PF + " | *** CHILD ERROR -- UNKNOWN CHILD ID: " + childObj.childId
        )
      );
  }
});

const heartbeatPickArray = [
  "bestNetwork",
  "bots",
  "elapsed",
  "hashtag",
  "heartbeat",
  "maxNodesPerMin",
  "maxNodesPerMinTime",
  "nodeCount",
  "nodesPerMin",
  "runTime",
  "serverTime",
  "startTime",
  "timeStamp",
  "traffic",
  "twitter",
  "upTime",
  "user",
];

const initHeartbeatInterval = async (p) => {
  try {
    clearInterval(heartbeatInterval);

    const params = p || {};
    const interval = params.interval || configuration.heartbeatInterval;

    let heartbeatObj = {};

    statsObj.heartbeat = {};
    statsObj.heartbeat.start = getTimeStamp();
    statsObj.heartbeat.sent = 0;
    statsObj.heartbeat.interval = interval;

    heartbeatInterval = setInterval(function () {
      statsObj.serverTime = moment().valueOf();
      statsObj.runTime = moment().valueOf() - statsObj.startTime;
      statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
      statsObj.timeStamp = getTimeStamp();
      statsObj.upTime = os.uptime() * 1000;
      statsObj.nodesPerMin = parseInt(globalNodeMeter.toJSON()[metricsRate]);
      statsObj.nodeCount = parseInt(globalNodeCounter.toJSON());

      if (statsObj.nodesPerMin > statsObj.maxNodesPerMin) {
        statsObj.maxNodesPerMin = statsObj.nodesPerMin;
        statsObj.maxNodesPerMinTime = moment().valueOf();
      }

      statsObj.twitter.tweetsReceived = tweetsReceived;
      statsObj.twitter.tweetsPerMin = parseInt(
        tweetMeter.toJSON()[metricsRate]
      );
      statsObj.twitter.quotedTweetsReceived = quotedTweetsReceived;
      statsObj.twitter.retweetsReceived = retweetsReceived;
      statsObj.twitter.duplicateTweetsReceived = duplicateTweetsReceived;
      statsObj.errors.twitter.maxRxQueue = maxRxQueue;

      if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin) {
        statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
        statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
      }

      if (statsObj.internetReady && statsObj.ioReady) {
        statsObj.configuration = configuration;

        heartbeatObj = pick(statsObj, heartbeatPickArray);

        viewNameSpace.volatile.emit("action", {
          type: "heartbeat",
          data: heartbeatObj,
        });

        statsObj.heartbeat.sent += 1;

        if (statsObj.heartbeat.sent % 60 == 0) {
          logHeartbeat();
        }
      } else {
        if (moment().seconds() % 10 == 0) {
          console.log(
            chalkError(
              `${MODULE_ID_PREFIX} | !!!! INTERNET DOWN?? !!!!!  | ${getTimeStamp()} | INTERNET READY: ${
                statsObj.internetReady
              } | I/O READY: ${statsObj.ioReady}`
            )
          );
        }
      }
    }, interval);

    return;
  } catch (err) {
    console.log(
      chalkError(
        `${MODULE_ID_PREFIX} | *** initHeartbeatInterval ERROR: ${err}`
      )
    );
    throw err;
  }
};

configEvents.on("INTERNET_READY", function internetReady() {
  console.log(
    chalkInfo(
      `${PF} | ${getTimeStamp()} | SERVER_READY EVENT | PORT ${
        configServer.port
      }`
    )
  );

  if (!httpServer.listening) {
    httpServer.on("reconnect", function serverReconnect() {
      statsObj.internetReady = true;
      debug(
        chalkLog(
          `${PF} | ${getTimeStamp()} | RECONNECT PORT ${configServer.port}`
        )
      );
    });

    httpServer.on("connect", function serverConnect() {
      statsObj.socket.connects += 1;
      statsObj.internetReady = true;
      debug(
        chalkLog(
          `${PF} | ${getTimeStamp()} | CONNECT PORT ${configServer.port}`
        )
      );

      httpServer.on("disconnect", function serverDisconnect() {
        statsObj.internetReady = false;
        console.log(
          chalkError(
            `${PF} | *** PORT DISCONNECTED | ${getTimeStamp()} | ${
              configServer.port
            }`
          )
        );
      });
    });

    httpServer.listen(configServer.port, function serverListen() {
      debug(
        chalkLog(
          `${PF} | ${getTimeStamp()} | LISTENING ON PORT ${configServer.port}`
        )
      );
    });

    httpServer.on("error", function serverError(err) {
      statsObj.socket.errors.httpServer_errors += 1;
      statsObj.internetReady = false;

      debug(
        chalkError(
          `${PF} | ${getTimeStamp()} | *** HTTP ERROR | PORT ${
            configServer.port
          } | ERROR: ${err}`
        )
      );

      if (err.code == "EADDRINUSE") {
        debug(
          chalkError(
            `${PF} | ${getTimeStamp()} | *** HTTP ADDRESS IN USE | PORT ${
              configServer.port
            } | ... RETRYING...`
          )
        );

        setTimeout(function serverErrorTimeout() {
          httpServer.listen(configServer.port, function serverErrorListen() {
            debug(
              chalkInfo(
                `${PF} | ${getTimeStamp()} | LISTENING ON PORT ${
                  configServer.port
                }`
              )
            );
          });
        }, 5000);
      }
    });
  }

  initAppRouting(function initAppRoutingComplete() {});
});

configEvents.on("INTERNET_NOT_READY", function internetNotReady() {
  if (configuration.autoOfflineMode) {
    configuration.offlineMode = true;
    console.log(chalkAlert(PF + " | *** AUTO_OFFLINE_MODE ***"));
  }
});

configEvents.on("INIT_SETS_COMPLETE", function configEventDbConnect() {
  statsObj.initSetsComplete = true;
});

configEvents.on("DB_CONNECT", function configEventDbConnect() {
  statsObj.status = "DB_CONNECT";

  console.log(chalk.green(PF + " | >>> DB CONNECT EVENT"));

  async.parallel(
    {
      socketInit: function (cb) {
        initSocketNamespaces()
          .then(function () {
            cb();
          })
          .catch(function (err) {
            return cb(err);
          });
      },

      ignoredUserInit: function (cb) {
        initIgnoredUserSet()
          .then(function () {
            cb();
          })
          .catch(function (err) {
            return cb(err);
          });
      },

      ignoredHashtagInit: function (cb) {
        initIgnoredHashtagSet()
          .then(function () {
            cb();
          })
          .catch(function (err) {
            return cb(err);
          });
      },

      followSearchInit: function (cb) {
        initFollowableSearchTermSet()
          .then(function () {
            cb();
          })
          .catch(function (err) {
            return cb(err);
          });
      },
    },
    function (err, results) {
      if (err) {
        console.log(
          chalkError(PF + " | *** ERROR: LOAD CATEGORY HASHMAPS: " + err)
        );
        console.log(err);
      } else {
        console.log(chalk.green(PF + " | +++ MONGO DB CONNECTION READY"));
        if (configuration.verbose) {
          console.log(
            chalk.green(
              PF + " | +++ MONGO DB CONNECTION RESULTS\n" + jsonPrint(results)
            )
          );
        }
        configEvents.emit("INIT_SETS_COMPLETE");
      }
    }
  );
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
debug("CLIENT HOST + PORT: " + "http://localhost:" + configServer.port);

let prevTweetUser;

function socketRxTweet(tw) {
  prevTweetUser = tweetIdCache.get(tw.id_str);

  if (prevTweetUser !== undefined) {
    duplicateTweetsReceived += 1;
    if (filterDuplicateTweets) {
      return;
    }
  }

  tweetIdCache.set(tw.id_str, tw.user.screen_name);

  tweetMeter.mark();

  tweetsReceived += 1;

  if (tw.retweeted_status && tw.retweeted_status !== undefined) {
    retweetsReceived += 1;
    if (filterRetweets) {
      return;
    }
  }

  if (tw.is_quote_status) {
    quotedTweetsReceived += 1;
    if (filterRetweets) {
      return;
    }
  }

  if (tweetRxQueue.length > maxTweetRxQueue) {
    maxRxQueue += 1;
  } else if (tw.user) {
    if (saveSampleTweetFlag) {
      saveSampleTweetFlag = false;
      const sampleTweetFileName = "sampleTweet_" + getTimeStamp() + ".json";

      console.log(
        chalkLog(
          PF +
            " | SAVING SAMPLE TWEET" +
            " [" +
            tweetsReceived +
            " RXd]" +
            " | " +
            getTimeStamp() +
            " | " +
            tw.id_str +
            " | " +
            tw.user.id_str +
            " | @" +
            tw.user.screen_name +
            " | " +
            tw.user.name +
            " | " +
            testDataFolder +
            "/" +
            sampleTweetFileName
        )
      );

      statsObj.queues.saveFileQueue = tcUtils.saveFileQueue({
        folder: testDataFolder,
        file: sampleTweetFileName,
        obj: tw,
      });
    }

    tw.inc = true;

    tw.user.statusId = tw.id_str;
    tw.user.status = {};
    tw.user.status.id_str = tw.id_str;
    tw.user.status.created_at = tw.created_at;
    tw.user.status.lang = tw.lang;
    tw.user.status.text = tw.truncated
      ? tw.extended_tweet.full_text
      : tw.text || "";

    if (tw.quoted_status) {
      tw.user.quotedStatus = {};
      tw.user.quotedStatus = tw.quoted_status;
    }

    if (categorizedUserHashMap.has(tw.user.id_str)) {
      tw.user.following = true;
      tw.user.categorized = true;
      tw.user.category = categorizedUserHashMap.get(tw.user.id_str).category;
      tw.user.categoryAuto = categorizedUserHashMap.get(
        tw.user.id_str
      ).categoryAuto;
      tw.user.categorizeNetwork = categorizedUserHashMap.get(
        tw.user.id_str
      ).categorizeNetwork;
      tw.user.categoryVerified = categorizedUserHashMap.get(
        tw.user.id_str
      ).categoryVerified;
    }

    if (botNodeIdSet.has(tw.user.id_str)) {
      tw.user.isBot = true;
    }

    tweetRxQueue.push(tw);
  }
}

async function deleteNode(node) {
  let results;

  if (node.nodeType === "user") {
    results = await global.wordAssoDb.User.deleteOne({ nodeId: node.nodeId });

    if (results.deletedCount > 0) {
      statsObj.user.deleted += 1;

      console.log(
        chalkAlert(
          PF +
            " | XXX USER | -*- DB HIT" +
            " [" +
            statsObj.user.deleted +
            " DELETED USERS]" +
            " | " +
            node.nodeId
        )
      );
    } else {
      console.log(
        chalkAlert(PF + " | XXX USER | --- DB MISS" + " | " + node.nodeId)
      );
    }
  }

  if (node.nodeType === "hashtag") {
    results = await global.wordAssoDb.Hashtag.deleteOne({
      nodeId: node.nodeId,
    });

    if (results.deletedCount > 0) {
      statsObj.hashtag.deleted += 1;

      console.log(
        chalkAlert(
          PF +
            " | XXX HASHTAG | -*- DB HIT" +
            " [" +
            statsObj.hashtag.deleted +
            " DELETED HASHTAGS]" +
            " | " +
            node.nodeId
        )
      );
    } else {
      console.log(
        chalkAlert(PF + " | XXX HASHTAG | --- DB MISS" + " | " + node.nodeId)
      );
    }
  }

  return results;
}

let nodeSetPropsResultTimeout;
const nodeSetPropsResultHashMap = {};

async function pubSubNodeSetProps(params) {
  try {
    debug(
      chalkBlue(
        PF +
          " | NODE SET PROPS [" +
          statsObj.pubSub.messagesSent +
          "]" +
          " | " +
          params.requestId +
          " | TOPIC: node-setprops" +
          " | NODE TYPE: " +
          params.node.nodeType +
          " | CREATE NODE ON MISS: " +
          formatBoolean(params.createNodeOnMiss) +
          " | NID: " +
          params.node.nodeId +
          " | CAT BY: " +
          params.categorizedBy +
          " | PROPS: " +
          Object.keys(params.props)
      )
    );

    await pubSubPublishMessage({
      publishName: "node-setprops",
      message: params,
    });

    const eventName = "nodeSetPropsResult_" + params.requestId;

    clearTimeout(nodeSetPropsResultTimeout);

    nodeSetPropsResultTimeout = setTimeout(function () {
      statsObj.pubSub.nodeSetProps += 1;
      statsObj.pubSub.nodeSetPropsResultTimeouts += 1;
      console.log(
        chalkAlert(
          `${PF} | !!! NODE SET PROPS TIMEOUT` +
            ` |  ${msToTime(configuration.pubSub.pubSubResultTimeout)}` +
            ` [ ${statsObj.pubSub.nodeSetPropsResultTimeouts} TOs / ${statsObj.pubSub.nodeSetProps} TOT ]` +
            ` | ${params.requestId}` +
            ` | TOPIC: node-setprops` +
            ` | NODE TYPE: ${params.node.nodeType}` +
            ` | NID: ${params.node.nodeId}` +
            ` | PROPS: ${Object.keys(params.props)}` +
            `\n${PF} | NODE\n${jsonPrint(params.node)}` +
            `\n${PF} | PROPS\n${jsonPrint(params.props)}`
        )
      );

      tcUtils.emitter.emit(eventName);

      return;
    }, configuration.pubSub.pubSubResultTimeout);

    await tcUtils.waitEvent({
      event: eventName,
      verbose: configuration.verbose,
    });

    clearTimeout(nodeSetPropsResultTimeout);

    const node = nodeSetPropsResultHashMap[params.requestId] || false;
    statsObj.pubSub.nodeSetProps += 1;

    if (node.nodeType === "user") {
      if (isCategorized(node) || isAutoCategorized(node)) {
        categorizedUserHashMap.set(
          node.nodeId,
          pick(node, userCategoryHashmapPickArray)
        );
      }

      delete node._id;

      const dbUser = await global.wordAssoDb.User.findOneAndUpdate(
        { nodeId: node.nodeId },
        node,
        { upsert: true, new: true, lean: true }
      );

      delete nodeSetPropsResultHashMap[params.requestId];

      return dbUser;
    }

    if (node.nodeType === "hashtag") {
      node.text = node.nodeId;

      if (isCategorized(node)) {
        categorizedHashtagHashMap.set(node.nodeId, {
          nodeId: node.nodeId,
          text: node.text,
          category: node.category,
        });
      }

      delete node._id;

      let dbHashtag = await global.wordAssoDb.Hashtag.findOne({
        nodeId: node.nodeId,
      });

      if (empty(dbHashtag)) {
        dbHashtag = new global.wordAssoDb.Hashtag(node);
      }

      dbHashtag.mentions = node.mentions
        ? Math.max(node.mentions, dbHashtag.mentions)
        : dbHashtag.mentions;
      dbHashtag.category = node.category || dbHashtag.category;
      dbHashtag.rate = node.rate || 0;
      dbHashtag.createdAt = node.createdAt || Date.now();
      dbHashtag.lastSeen = node.lastSeen || Date.now();

      await dbHashtag.save();

      delete nodeSetPropsResultHashMap[params.requestId];

      return dbHashtag;
    }

    if (!node) {
      console.log(
        chalkAlert(
          PF +
            " | !!! NODE SET PROP NODE NOT FOUND" +
            " | " +
            params.requestId +
            " | TYPE: " +
            params.node.nodeType +
            " | NID: " +
            params.node.nodeId
        )
      );
    }

    delete nodeSetPropsResultHashMap[params.requestId];

    return node;
  } catch (err) {
    const errCode =
      err.code && err.code != undefined ? err.code : err.statusCode;

    let errorType;

    switch (errCode) {
      case 34:
      case 50:
        errorType = "USER_NOT_FOUND";
        console.log(
          chalkError(
            PF +
              " | *** TWITTER USER NOT FOUND" +
              " | " +
              getTimeStamp() +
              " | ERR CODE: " +
              errCode +
              " | ERR TYPE: " +
              errorType +
              " | UID: " +
              params.node.nodeId
          )
        );

        await deleteUser({ user: params.node });
        return;

      case 63:
        errorType = "USER_SUSPENDED";
        console.log(
          chalkError(
            PF +
              " | *** TWITTER USER SUSPENDED" +
              " | " +
              getTimeStamp() +
              " | ERR CODE: " +
              errCode +
              " | ERR TYPE: " +
              errorType +
              " | UID: " +
              params.node.nodeId
          )
        );

        await deleteUser({ user: params.node });
        return;

      case 11000:
        errorType = "USER_DUPLICATE_KEY";
        console.log(
          chalkError(
            PF +
              " | *** DB USER_DUPLICATE_KEY ERROR" +
              " | " +
              getTimeStamp() +
              " | ERR CODE: " +
              errCode +
              " | ERR TYPE: " +
              errorType +
              " | UID: " +
              params.node.nodeId
          )
        );

        await deleteUser({ user: params.node });
        return;

      default:
        console.log(
          chalkError(
            PF +
              " | *** TWITTER SEARCH NODE USER ERROR | SEARCH CAT AUTO: " +
              params.categoryAuto +
              " | ERR CODE: " +
              errCode +
              "\nsearchQuery\n" +
              jsonPrint(params.node) +
              "ERROR: ",
            err
          )
        );
    }
    throw err;
  }
}

async function nodeSetProps(params) {
  const requestId = "rId_" + hostname + "_" + moment().valueOf();

  debug(
    chalk.blue(
      PF +
        " | NODE SET PROPS" +
        " | " +
        requestId +
        " | TYPE: " +
        params.node.nodeType +
        " | NID: " +
        params.node.nodeId +
        " | PROPS: " +
        Object.keys(params.props)
    )
  );

  const node = await pubSubNodeSetProps({
    requestId: requestId,
    createNodeOnMiss: params.createNodeOnMiss,
    categorizedBy: params.categorizedBy,
    node: params.node,
    props: params.props,
  });

  return node;
}

async function updateDbIgnoredHashtags() {
  statsObj.status = "UPDATE IGNORED HASHTAGS IN DB";

  console.log(chalkBlue(PF + " | UPDATE IGNORED HASHTAGS DB"));

  [...ignoredHashtagSet].forEach(async function (hashtag) {
    try {
      let dbHashtag = await global.wordAssoDb.Hashtag.findOne({
        nodeId: hashtag.toLowerCase(),
      });

      if (empty(dbHashtag)) {
        dbHashtag = new global.wordAssoDb.Hashtag({
          nodeId: hashtag.toLowerCase(),
        });
      }

      dbHashtag.ignored = true;

      debug(
        chalkLog(
          PF +
            " | +++ IGNORED HASHTAG" +
            " [" +
            ignoredHashtagSet.size +
            "]" +
            " | " +
            printHashtag({ hashtag: dbHashtag })
        )
      );

      const dbUpdatedHashtag = await dbHashtag.save();

      debug(
        chalkLog(
          PF +
            " | XXX IGNORE" +
            " [" +
            ignoredHashtagSet.size +
            "]" +
            " | " +
            printHashtag({ hashtag: dbUpdatedHashtag })
        )
      );
    } catch (err) {
      console.log(
        chalkError(PF + " | *** UPDATE IGNORED HASHTAG DB ERROR: " + err)
      );
      return err;
    }
  });

  return;
}

async function initIgnoredHashtagSet() {
  statsObj.status = "INIT IGNORE HASHTAG SET";

  console.log(chalkLog(PF + " | ... INIT IGNORE HASHTAG SET"));

  try {
    const result = await tcUtils.initSetFromFile({
      folder: configDefaultFolder,
      file: ignoredHashtagFile,
      resolveOnNotFound: true,
    });

    if (result) {
      ignoredHashtagSet = result;
      ignoredHashtagSet.delete("");
      ignoredHashtagSet.delete(" ");
      await updateDbIgnoredHashtags();
    }

    console.log(
      chalkLog(
        PF +
          " | LOADED IGNORED HASHTAGS FILE" +
          " | " +
          ignoredHashtagSet.size +
          " HASHTAGS" +
          " | " +
          configDefaultFolder +
          "/" +
          ignoredHashtagFile
      )
    );

    return;
  } catch (err) {
    console.log(chalkError(PF + " | *** LOAD IGNORED HASHTAGS ERROR: " + err));
    throw err;
  }
}

async function initFollowableSearchTermSet() {
  statsObj.status = "INIT FOLLOWABLE SEARCH TERM SET";

  console.log(
    chalkBlue(
      PF +
        " | INIT FOLLOWABLE SEARCH TERM SET: " +
        configDefaultFolder +
        "/" +
        followableSearchTermFile
    )
  );

  try {
    const result = await tcUtils.initSetFromFile({
      folder: configDefaultFolder,
      file: followableSearchTermFile,
      resolveOnNotFound: true,
    });

    if (result) {
      followableSearchTermSet = result;
      followableSearchTermSet.delete("");
      followableSearchTermSet.delete(" ");
      followableSearchTermsArray = [...followableSearchTermSet];
    }

    console.log(
      chalkLog(
        PF +
          " | LOADED FOLLOWABLE SEARCH TERMS FILE" +
          " | " +
          followableSearchTermSet.size +
          " SEARCH TERMS" +
          " | " +
          configDefaultFolder +
          "/" +
          followableSearchTermFile
      )
    );

    return;
  } catch (err) {
    console.log(
      chalkError(PF + " | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err)
    );
    throw err;
  }
}

async function initIgnoredUserSet() {
  statsObj.status = "INIT IGNORED USER SET";

  console.log(
    chalkBlue(
      PF +
        " | INIT IGNORED USER SET: " +
        configDefaultFolder +
        "/" +
        ignoredUserFile
    )
  );

  try {
    const result = await tcUtils.initSetFromFile({
      folder: configDefaultFolder,
      file: ignoredUserFile,
      objArrayKey: "userIds",
      resolveOnNotFound: true,
    });

    if (result) {
      ignoredUserSet = result;
      ignoredUserSet.delete("");
      ignoredUserSet.delete(" ");
    }

    console.log(
      chalkLog(
        PF +
          " | LOADED IGNORED USERS FILE" +
          " | " +
          ignoredUserSet.size +
          " USERS" +
          " | " +
          configDefaultFolder +
          "/" +
          ignoredUserFile
      )
    );

    return;
  } catch (err) {
    console.log(chalkError(PF + " | *** INIT IGNORED USERS SET ERROR: " + err));
    throw err;
  }
}

const serverRegex = /^(.+)_/i;

let twitterSearchNodeTimeout;

const categorizedArray = ["left", "neutral", "right", "positive", "negative"];

const isCategorized = function (node) {
  return (
    node.category !== undefined && categorizedArray.includes(node.category)
  );
};

const isAutoCategorized = function (node) {
  return (
    node.categoryAuto !== undefined &&
    categorizedArray.includes(node.categoryAuto)
  );
};

async function pubSubSearchNode(params) {
  try {
    let nodeName;

    switch (params.node.nodeType) {
      case "user":
        nodeName = "@" + params.node.screenName;
        break;
      case "hashtag":
        nodeName = "#" + params.node.nodeId;
        break;
      default:
        console.log(
          chalkError(
            PF +
              " | *** pubSubSearchNode UNKNOWN NODE TYPE: " +
              params.node.nodeType
          )
        );
        throw new Error(
          "pubSubSearchNode UNKNOWN NODE TYPE: " + params.node.nodeType
        );
    }

    console.log(
      chalkBlue(
        PF +
          " | PS SEARCH NODE [" +
          statsObj.pubSub.messagesSent +
          "]" +
          " | TYPE: " +
          params.node.nodeType +
          " | " +
          params.requestId +
          " | TOPIC: node-search | SEARCH CAT AUTO: " +
          params.categoryAuto +
          " | minFollowers: " +
          params.node.minFollowers +
          " | NID: " +
          params.node.nodeId +
          " | " +
          nodeName
      )
    );

    await pubSubPublishMessage({
      publishName: "node-search",
      message: params,
    });

    const eventName = "nodeSearchResult_" + params.requestId;

    clearTimeout(twitterSearchNodeTimeout);

    twitterSearchNodeTimeout = setTimeout(function () {
      console.log(
        chalkAlert(
          `${PF} | !!! NODE SEARCH TIMEOUT | ${configuration.pubSub.pubSubResultTimeout} MS`
        )
      );
      console.log(
        chalkAlert(
          `${PF} | !!! NODE SEARCH TIMEOUT | PARAMS\n${jsonPrint(params)}`
        )
      );

      tcUtils.emitter.emit(eventName);

      return { node: false, nodes: false, results: {} };
    }, configuration.pubSub.pubSubResultTimeout);

    await tcUtils.waitEvent({
      event: eventName,
      verbose: configuration.verbose,
    });

    clearTimeout(twitterSearchNodeTimeout);

    if (!searchNodeResultHashMap[params.requestId]) {
      throw new Error(
        "UNDEFINED searchNodeResultHashMap entry: " + params.requestId
      );
    }

    if (
      !searchNodeResultHashMap[params.requestId].node &&
      !searchNodeResultHashMap[params.requestId].nodes
    ) {
      console.log(
        chalkAlert(
          PF +
            " | !!! " +
            params.node.nodeType +
            " NOT FOUND\n" +
            jsonPrint(params)
        )
      );
      return searchNodeResultHashMap[params.requestId];
    }

    const node = searchNodeResultHashMap[params.requestId].node;
    const nodes = searchNodeResultHashMap[params.requestId].nodes;

    if (nodes && nodes.length > 0) {
      const result = {};
      result.node = false;
      result.nodes = [];

      // nodes.forEach(async (node) => {
      for (const node of nodes) {
        categorizedUserHashMap.set(
          node.nodeId,
          pick(node, userCategoryHashmapPickArray)
        );

        delete node._id;

        const nodeUpdated = await global.wordAssoDb.User.findOneAndUpdate(
          { nodeId: node.nodeId },
          node,
          { upsert: true, new: true, lean: true }
        );

        result.nodes.push(nodeUpdated);
      }

      return result;
    }

    if (node && node.nodeType === "user") {
      if (isCategorized(node) || isAutoCategorized(node)) {
        categorizedUserHashMap.set(
          node.nodeId,
          pick(node, userCategoryHashmapPickArray)
        );

        delete node._id;

        const nodeUpdated = await global.wordAssoDb.User.findOneAndUpdate(
          { nodeId: node.nodeId },
          node,
          { upsert: true, new: true, lean: true }
        );

        return {
          node: nodeUpdated,
          nodes: false,
          results: searchNodeResultHashMap[params.requestId].results,
        };
      } else {
        return {
          node: node,
          nodes: false,
          results: searchNodeResultHashMap[params.requestId].results,
        };
      }
    }

    if (node && node.nodeType === "hashtag") {
      if (isCategorized(node)) {
        categorizedHashtagHashMap.set(node.nodeId, {
          nodeId: node.nodeId,
          text: node.nodeId,
          category: node.category,
          categoryAuto: "none",
        });
      }

      delete node._id;

      let dbHashtag = await global.wordAssoDb.Hashtag.findOne({
        nodeId: node.nodeId,
      });

      if (empty(dbHashtag)) {
        dbHashtag = new global.wordAssoDb.Hashtag(node);
      }

      dbHashtag.mentions = node.mentions
        ? Math.max(node.mentions, dbHashtag.mentions)
        : dbHashtag.mentions;
      dbHashtag.category = node.category || dbHashtag.category;
      dbHashtag.rate = node.rate || 0;
      dbHashtag.createdAt = node.createdAt || Date.now();
      dbHashtag.lastSeen = node.lastSeen || Date.now();

      await dbHashtag.save();

      return { node: dbHashtag, nodes: [], results: {} };
    }

    return { node: false, nodes: [], results: {} };
  } catch (err) {
    const errCode =
      err.code && err.code != undefined ? err.code : err.statusCode;

    let errorType;

    if (params.node.nodeType === "user") {
      switch (errCode) {
        case 34:
        case 50:
          errorType = "USER_NOT_FOUND";
          console.log(
            chalkError(
              PF +
                " | *** TWITTER USER NOT FOUND" +
                " | " +
                getTimeStamp() +
                " | ERR CODE: " +
                errCode +
                " | ERR TYPE: " +
                errorType +
                " | UID: " +
                params.node.nodeId
            )
          );

          await deleteUser({ user: params.node });
          break;

        case 63:
          errorType = "USER_SUSPENDED";
          console.log(
            chalkError(
              PF +
                " | *** TWITTER USER SUSPENDED" +
                " | " +
                getTimeStamp() +
                " | ERR CODE: " +
                errCode +
                " | ERR TYPE: " +
                errorType +
                " | UID: " +
                params.node.nodeId
            )
          );

          await deleteUser({ user: params.node });
          break;

        default:
          console.log(
            chalkError(
              PF +
                " | *** TWITTER SEARCH NODE USER ERROR | SEARCH CAT AUTO: " +
                params.categoryAuto +
                " | ERR CODE: " +
                errCode +
                "\nsearchQuery\n" +
                jsonPrint(params.node) +
                "ERROR: ",
              err
            )
          );
      }

      throw err;
    } else {
      throw err;
    }
  }
}

async function twitterSearchUser(params) {
  if (typeof params.node === "string") {
    console.log(chalkInfo(PF + " | -?- USER SEARCH | USER: " + params.node));
  } else {
    console.log(
      chalkInfo(
        PF +
          " | -?- USER SEARCH | NID: " +
          params.node.nodeId +
          " | minFollowers: " +
          params.node.minFollowers +
          " | @" +
          params.node.screenName
      )
    );
  }

  try {
    const message = {};
    message.requestId = "rId_" + hostname + "_" + moment().valueOf();
    message.node = {};
    message.node.nodeType = "user";
    message.node.minFollowers = params.node.minFollowers || 0;
    message.newCategory = params.newCategory || false;
    message.newCategoryVerified = params.newCategoryVerified || false;

    switch (params.node.screenName) {
      case "?mm":
        message.categoryAuto = "mismatch";
        break;

      case "?all":
        message.categoryAuto = "all";
        break;

      case "?left":
        message.categoryAuto = "left";
        break;

      case "?right":
        message.categoryAuto = "right";
        break;

      case "?neutral":
        message.categoryAuto = "neutral";
        break;

      default:
        message.categoryAuto = "SPECIFIC";
        message.node = params.node;
    }

    const response = await pubSubSearchNode(message);

    return {
      node: response.node,
      nodes: response.nodes,
      results: response.results,
      categoryAuto: message.categoryAuto,
      stats: statsObj.user,
    };
  } catch (err) {
    console.log(
      chalkError(
        PF +
          " | *** TWITTER_SEARCH_NODE ERROR" +
          " | " +
          getTimeStamp() +
          " | SEARCH USER" +
          " | ERROR: " +
          err +
          " | searchNode: " +
          jsonPrint(params.node)
      )
    );

    // const sObj = {};
    // sObj.user = statsObj.user;
    // sObj.bestNetwork = statsObj.bestNetwork;

    viewNameSpace.emit("TWITTER_SEARCH_NODE_ERROR", {
      node: params.node,
      stats: statsObj,
    });

    return {
      node: false,
      nodes: false,
      stats: statsObj.user,
      err: err,
    };
  }
}

async function twitterSearchHashtag(params) {
  if (typeof params.node === "string") {
    console.log(
      chalkInfo(PF + " | -?- HASHTAG SEARCH | HASHTAG: " + params.node)
    );
  } else {
    console.log(
      chalkInfo(PF + " | -?- HASHTAG SEARCH | NID: #" + params.node.nodeId)
    );
  }

  try {
    const message = {};
    message.requestId = "rId_" + hostname + "_" + moment().valueOf();
    message.node = {};
    message.newCategory = params.newCategory || false;
    message.categoryAuto = "SPECIFIC";
    message.node = params.node;

    const searchResponse = await pubSubSearchNode(message);

    console.log(
      chalkLog(
        PF +
          " | +++ TWITTER_SEARCH_NODE" +
          " | " +
          getTimeStamp() +
          " | SEARCH HASHTAG: #" +
          searchResponse.node.nodeId +
          " | RESPONSE RESULTS\n" +
          jsonPrint(searchResponse.results)
        // "\n" + PF + " | RESPONSE\n" + jsonPrint(searchResponse)
      )
    );

    return {
      node: searchResponse.node,
      nodes: searchResponse.nodes,
      results: searchResponse.results,
      categoryAuto: message.categoryAuto,
      stats: searchResponse.stats,
    };
  } catch (err) {
    console.log(
      chalkError(
        PF +
          " | *** TWITTER_SEARCH_NODE ERROR" +
          " | " +
          getTimeStamp() +
          " | SEARCH HASHTAG" +
          " | searchNode: " +
          params.node +
          " | ERROR: " +
          err
      )
    );

    // const sObj = {};
    // sObj.user = statsObj.user;
    // sObj.bestNetwork = statsObj.bestNetwork;

    viewNameSpace.emit("TWITTER_SEARCH_NODE_ERROR", {
      node: params.node,
      stats: statsObj,
    });

    throw err;
  }
}

async function twitterSearchNode(params) {
  try {
    const searchNode = params.searchNode.toLowerCase().trim();
    const minFollowers = params.minFollowers || 0;

    console.log(
      chalkSocket(
        `${PF} | twitterSearchNode` +
          ` | ${getTimeStamp()}` +
          ` | minFollowers: ${minFollowers}` +
          ` | ${searchNode}`
      )
    );

    if (searchNode.startsWith("#")) {
      updateHashtagCounts();

      const response = await twitterSearchHashtag({
        node: {
          nodeType: "hashtag",
          nodeId: searchNode.slice(1).toLowerCase(),
        },
      });

      if (response.node) {
        if (twitterClient) {
          const searchTerm = "#" + response.node.nodeId;

          console.log(
            chalkSocket(
              `${PF} | twitterSearchNode | SEARCH FOR HT TWEETS` +
                ` | ${getTimeStamp()}` +
                ` | ${searchTerm}`
            )
          );

          twitterClient.get(
            "search/tweets",
            { q: searchTerm, count: configuration.tweetSearchCount },
            (err, tweets) => {
              if (err) {
                console.log(
                  chalkError(
                    `${PF} | twitterSearchNode | *** SEARCH FOR HT TWEETS ERROR` +
                      ` | ${getTimeStamp()}` +
                      ` | ${searchTerm}` +
                      ` | ${err}`
                  )
                );

                viewNameSpace.emit("SET_TWITTER_HASHTAG", {
                  node: response.node,
                  stats: statsObj,
                });

                return;
              }

              console.log(
                chalkSocket(
                  `${PF} | twitterSearchNode | HT TWEETS` +
                    ` | ${getTimeStamp()}` +
                    ` | ${searchTerm}` +
                    ` | TWs: ${tweets.statuses.length}`
                )
              );

              viewNameSpace.emit("SET_TWITTER_HASHTAG", {
                node: response.node,
                tweets: tweets,
                stats: statsObj,
              });

              return;
            }
          );
        } else {
          viewNameSpace.emit("SET_TWITTER_HASHTAG", {
            node: response.node,
            stats: statsObj,
          });

          return;
        }
      } else {
        viewNameSpace.emit("TWITTER_HASHTAG_NOT_FOUND", {
          searchNode: searchNode,
          stats: statsObj,
        });
        return;
      }
    } else if (searchNode.startsWith("@")) {
      updateUserCounts();

      const response = await twitterSearchUser({
        node: {
          nodeType: "user",
          screenName: searchNode.slice(1),
          minFollowers: minFollowers,
        },
      });

      if (response.nodes) {
        console.log(
          chalkSocket(
            `${PF} | twitterSearchUser` +
              ` | ${getTimeStamp()}` +
              ` | NODES: ${response.nodes.length}`
          )
        );

        viewNameSpace.emit("TWITTER_USERS", {
          searchNode: searchNode,
          nodes: response.nodes,
          results: response.results,
          stats: statsObj,
        });
        return;
      } else if (response.node) {
        console.log(
          chalkSocket(
            `${PF} | twitterSearchUser` +
              ` | ${getTimeStamp()}` +
              ` | NODE: @${response.node.screenName}`
          )
        );

        viewNameSpace.emit("SET_TWITTER_USER", {
          node: response.node,
          results: response.results,
          stats: statsObj,
        });

        return;
      } else {
        viewNameSpace.emit("TWITTER_USER_NOT_FOUND", {
          searchNode: searchNode,
          results: response.results,
          stats: statsObj,
        });
        return;
      }
    } else {
      console.log(
        chalkError(
          `${PF} | twitterSearchNode | *** TWITTER_SEARCH_NODE_UNKNOWN_MODE` +
            ` | ${searchNode}`
        )
      );

      viewNameSpace.emit("TWITTER_SEARCH_NODE_UNKNOWN_MODE", {
        searchNode: searchNode,
        stats: statsObj,
      });

      return new Error("UNKNOWN SEARCH MODE: " + searchNode);
    }
  } catch (err) {
    console.log(chalkError(PF + " | *** twitterSearchNode ERROR: " + err));
    return err;
  }
}

async function initSocketHandler(socketObj) {
  const socket = socketObj.socket;
  const socketId = socket.id;

  const ipAddress =
    socket.handshake.headers["x-real-ip"] || socket.client.conn.remoteAddress;

  try {
    let domainName;

    try {
      domainName = await dnsReverse({ ipAddress: ipAddress });
    } catch (err) {
      console.log(chalkError(PF + " | *** initAppRouting DNS ERROR: " + err));
    }

    console.log(
      chalk.blue(
        PF +
          " | SOCKET CONNECT" +
          " | " +
          ipAddress +
          " | DOMAIN: " +
          domainName +
          " | " +
          socketObj.namespace +
          " | " +
          socket.id +
          " | AD: " +
          statsObj.admin.connected +
          " | UT: " +
          statsObj.entity.util.connected +
          " | VW: " +
          statsObj.entity.viewer.connected
      )
    );

    socket.on("reconnect_error", function reconnectError(errorObj) {
      const timeStamp = moment().valueOf();

      serverCache.del(socketId);
      viewerCache.del(socketId);

      statsObj.socket.errors.reconnect_errors += 1;
      statsObj.socket.errors.errorObj = errorObj;

      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp(timeStamp) +
            " | SOCKET RECONNECT ERROR: " +
            socketId +
            "\nerrorObj\n" +
            jsonPrint(errorObj)
        )
      );
    });

    socket.on("reconnect_failed", function reconnectFailed(errorObj) {
      const timeStamp = moment().valueOf();

      serverCache.del(socketId);
      viewerCache.del(socketId);

      statsObj.socket.errors.reconnect_fails += 1;
      console.log(
        chalkError(
          getTimeStamp(timeStamp) +
            " | SOCKET RECONNECT FAILED: " +
            socketId +
            "\nerrorObj\n" +
            jsonPrint(errorObj)
        )
      );
    });

    socket.on("connect_error", function connectError(errorObj) {
      const timeStamp = moment().valueOf();

      serverCache.del(socketId);
      viewerCache.del(socketId);

      statsObj.socket.errors.connect_errors += 1;
      console.log(
        chalkError(
          getTimeStamp(timeStamp) +
            " | SOCKET CONNECT ERROR: " +
            socketId +
            "\nerrorObj\n" +
            jsonPrint(errorObj)
        )
      );
    });

    socket.on("connect_timeout", function connectTimeout(errorObj) {
      const timeStamp = moment().valueOf();

      serverCache.del(socketId);
      viewerCache.del(socketId);

      statsObj.socket.errors.connect_timeouts += 1;
      console.log(
        chalkError(
          getTimeStamp(timeStamp) +
            " | SOCKET CONNECT TIMEOUT: " +
            socketId +
            "\nerrorObj\n" +
            jsonPrint(errorObj)
        )
      );
    });

    socket.on("error", function socketError(error) {
      const timeStamp = moment().valueOf();

      statsObj.socket.errors.errors += 1;

      console.log(
        chalkError(
          getTimeStamp(timeStamp) +
            " | *** SOCKET ERROR" +
            " | " +
            socketId +
            " | " +
            error
        )
      );

      const currentServer = serverCache.get(socketId);

      if (currentServer !== undefined) {
        currentServer.timeStamp = moment().valueOf();
        currentServer.ip = ipAddress;
        currentServer.status = "ERROR";

        console.log(
          chalkError(
            PF +
              " | SERVER ERROR" +
              " | " +
              getTimeStamp(currentServer.timeStamp) +
              " | " +
              currentServer.user.type.toUpperCase() +
              " | " +
              currentServer.user.nodeId +
              " | " +
              currentServer.status +
              " | " +
              currentServer.ip +
              " | " +
              socketId
          )
        );

        serverCache.del(socketId);

        adminNameSpace.emit("SERVER_ERROR", currentServer);
      }

      const currentViewer = viewerCache.get(socketId);

      if (currentViewer !== undefined) {
        currentViewer.timeStamp = moment().valueOf();
        currentViewer.ip = ipAddress;
        currentViewer.status = "ERROR";

        console.log(
          chalkError(
            PF +
              " | VIEWER ERROR" +
              " | " +
              getTimeStamp(currentViewer.timeStamp) +
              " | " +
              currentViewer.user.type.toUpperCase() +
              " | " +
              currentViewer.user.nodeId +
              " | " +
              currentViewer.status +
              " | " +
              currentViewer.ip +
              " | " +
              socketId
          )
        );

        viewerCache.del(socketId);

        adminNameSpace.emit("VIEWER_ERROR", currentViewer);
      }
    });

    socket.on("reconnect", function socketReconnect() {
      const timeStamp = moment().valueOf();

      statsObj.socket.reconnects += 1;
      console.log(
        chalkConnect(
          getTimeStamp(timeStamp) + " | SOCKET RECONNECT: " + socket.id
        )
      );
    });

    socket.on("disconnect", function socketDisconnect(reason) {
      const timeStamp = moment().valueOf();

      statsObj.socket.disconnects += 1;

      console.log(
        chalkAlert(
          PF +
            " | XXX SOCKET DISCONNECT" +
            " | " +
            socketId +
            " | REASON: " +
            reason
        )
      );

      if (adminHashMap.has(socketId)) {
        console.log(
          chalkAlert(
            PF +
              " | XXX DELETED ADMIN" +
              " | " +
              getTimeStamp(timeStamp) +
              " | " +
              adminHashMap.get(socketId).user.type.toUpperCase() +
              " | " +
              adminHashMap.get(socketId).user.nodeId +
              " | " +
              socketId
          )
        );
        adminNameSpace.emit("ADMIN_DELETE", {
          socketId: socketId,
          nodeId: adminHashMap.get(socketId).user.nodeId,
        });
        adminHashMap.delete(socketId);
      }

      const currentServer = serverCache.get(socketId);

      if (currentServer !== undefined) {
        currentServer.status = "DISCONNECTED";

        console.log(
          chalkAlert(
            PF +
              " | XXX SERVER DISCONNECTED" +
              " | " +
              getTimeStamp(timeStamp) +
              " | " +
              currentServer.user.type.toUpperCase() +
              " | " +
              currentServer.user.nodeId +
              " | " +
              socketId
          )
        );

        adminNameSpace.emit("SERVER_DISCONNECT", currentServer);
        serverCache.del(socketId);
      }

      const currentViewer = viewerCache.get(socketId);
      if (currentViewer !== undefined) {
        currentViewer.status = "DISCONNECTED";
        viewerCache.del(socketId, function (err) {
          if (err) {
            console.log(
              chalkError(
                PF +
                  " | VIEWER CA ENTRY DELETE ERROR" +
                  " | " +
                  err +
                  " | " +
                  err
              )
            );
          }

          console.log(
            chalkAlert(
              PF +
                " | -X- VIEWER DISCONNECTED" +
                " | " +
                getTimeStamp(currentViewer.timeStamp) +
                " | " +
                currentViewer.user.type.toUpperCase() +
                " | " +
                currentViewer.user.nodeId +
                " | " +
                currentViewer.ip +
                " | " +
                socketId
            )
          );

          adminNameSpace.emit("VIEWER_DISCONNECT", currentViewer);
        });
      }
    });

    socket.on("SESSION_KEEPALIVE", function sessionKeepalive(keepAliveObj) {
      const timeStamp = moment().valueOf();

      if (empty(keepAliveObj.user)) {
        console.log(
          chalkAlert(
            PF +
              " | SESSION_KEEPALIVE USER UNDEFINED ??" +
              " | NSP: " +
              socket.nsp.name.toUpperCase() +
              " | " +
              socket.id +
              " | " +
              ipAddress +
              "\n" +
              jsonPrint(keepAliveObj)
          )
        );
        return;
      }

      const authSocketObj = authenticatedSocketCache.get(socket.id);

      if (authSocketObj !== undefined) {
        if (configuration.verbose) {
          console.log(
            chalkLog(
              PF +
                " | ... KEEPALIVE AUTHENTICATED SOCKET" +
                " | " +
                socket.id +
                " | NSP: " +
                authSocketObj.namespace.toUpperCase() +
                " | USER ID: " +
                authSocketObj.userId
            )
          );
        }

        authSocketObj.ipAddress = ipAddress;
        authSocketObj.timeStamp = moment().valueOf();

        authenticatedSocketCache.set(socket.id, authSocketObj);
      } else {
        console.log(
          chalkAlert(
            PF +
              " | *** KEEPALIVE UNAUTHENTICATED SOCKET | DISCONNECTING..." +
              " | " +
              socket.id +
              " | NSP: " +
              socket.nsp.name.toUpperCase() +
              " | " +
              keepAliveObj.user.userId
          )
        );
        socket.disconnect();
        serverCache.del(socket.id);
      }

      if (empty(statsObj.utilities[keepAliveObj.user.userId])) {
        statsObj.utilities[keepAliveObj.user.userId] = {};
      }

      statsObj.socket.keepalives += 1;

      if (keepAliveObj.user.stats) {
        statsObj.utilities[keepAliveObj.user.userId] = keepAliveObj.user.stats;
      }

      const currentSessionType = serverRegex.exec(keepAliveObj.user.userId)
        ? serverRegex.exec(keepAliveObj.user.userId)[1].toUpperCase()
        : "NULL";

      let sessionObj = {};
      let tempServerObj;
      let tempViewerObj;

      switch (currentSessionType) {
        case "ADMIN":
          console.log(
            chalkInfo(
              PF +
                " | R< KA" +
                " | " +
                "ADMIN" +
                " | " +
                getTimeStamp(timeStamp) +
                " | " +
                keepAliveObj.user.userId +
                " | " +
                ipAddress +
                " | " +
                socket.id
            )
          );

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

            console.log(
              chalk.green(
                "+++ ADD " +
                  currentSessionType +
                  " | " +
                  getTimeStamp(timeStamp) +
                  " | " +
                  keepAliveObj.user.userId +
                  " | " +
                  sessionObj.ip +
                  " | " +
                  socket.id
              )
            );

            adminHashMap.set(socket.id, sessionObj);
            adminNameSpace.emit("ADMIN_ADD", sessionObj);
          } else {
            sessionObj = adminHashMap.get(socket.id);

            sessionObj.timeStamp = moment().valueOf();
            sessionObj.user = keepAliveObj.user;
            sessionObj.status = keepAliveObj.status || "KEEPALIVE";

            adminHashMap.set(socket.id, sessionObj);
            adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
          }
          break;

        case "GIS":
        case "TNN":
        case "TSS":
        case "TUS":
        case "LA":
        case "TMP":
          console.log(
            chalkInfo(
              PF +
                " | R< KA" +
                " | " +
                currentSessionType +
                " SERVER" +
                " | " +
                getTimeStamp(timeStamp) +
                " | " +
                keepAliveObj.user.userId +
                " | " +
                ipAddress +
                " | " +
                socket.id
            )
          );

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

            console.log(
              chalk.green(
                "+++ ADD " +
                  currentSessionType +
                  " SERVER" +
                  " | " +
                  getTimeStamp(timeStamp) +
                  " | " +
                  keepAliveObj.user.userId +
                  " | " +
                  sessionObj.ip +
                  " | " +
                  socket.id
              )
            );

            serverCache.set(socket.id, sessionObj);
            adminNameSpace.emit("SERVER_ADD", sessionObj);
          } else {
            sessionObj = tempServerObj;

            sessionObj.timeStamp = moment().valueOf();
            sessionObj.user = keepAliveObj.user;
            sessionObj.status = keepAliveObj.status || "KEEPALIVE";

            serverCache.set(socket.id, sessionObj);
            adminNameSpace.volatile.emit("KEEPALIVE", sessionObj);
            socket.emit("GET_STATS");
          }
          break;

        case "VIEWER":
          console.log(
            chalkInfo(
              PF +
                " | R< KA" +
                " | " +
                "VIEWER" +
                " | " +
                getTimeStamp(timeStamp) +
                " | " +
                keepAliveObj.user.userId +
                " | " +
                ipAddress +
                " | " +
                socket.id
            )
          );

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

            console.log(
              chalk.green(
                "+++ ADD " +
                  currentSessionType +
                  " SESSION" +
                  " | " +
                  getTimeStamp(timeStamp) +
                  " | " +
                  keepAliveObj.user.userId +
                  " | " +
                  sessionObj.ip +
                  " | " +
                  socket.id
              )
            );

            viewerCache.set(socket.id, sessionObj);
            adminNameSpace.emit("VIEWER_ADD", sessionObj);
            socket.emit("KEEPALIVE", sessionObj);
          } else {
            sessionObj = tempViewerObj;

            sessionObj.timeStamp = moment().valueOf();
            sessionObj.user = keepAliveObj.user;
            sessionObj.status = keepAliveObj.status || "KEEPALIVE";

            viewerCache.set(socket.id, sessionObj);
            socket.emit("KEEPALIVE", sessionObj);
          }
          break;

        default:
          console.log(
            chalkAlert(
              PF +
                " | **** NOT SERVER ****" +
                " | SESSION TYPE: " +
                currentSessionType +
                "\n" +
                jsonPrint(keepAliveObj.user)
            )
          );
      }
    });

    socket.on("TWITTER_FOLLOW", async function (user) {
      if (empty(user)) {
        console.log(chalkError(PF + " | TWITTER_FOLLOW ERROR: NULL USER"));
        return;
      }

      user.nodeType = "user";

      console.log(
        chalkSocket(
          PF +
            " | R< TWITTER_FOLLOW" +
            " | " +
            getTimeStamp() +
            " | " +
            ipAddress +
            " | " +
            socket.id +
            " | NID: " +
            user.nodeId +
            " | @" +
            user.screenName
        )
      );

      try {
        const node = await nodeSetProps({
          node: user,
          autoFollow: false,
          forceFollow: true,
          props: {
            following: true,
          },
        });

        if (node && node.nodeType === "user") {
          viewNameSpace.emit("FOLLOW", node);
          adminNameSpace.emit("FOLLOW", node);
          utilNameSpace.emit("FOLLOW", node);
        }
      } catch (err) {
        console.log(chalkError(PF + " | TWITTER_FOLLOW ERROR: " + err));
      }
    });

    socket.on("TWITTER_UNFOLLOW", async function (user) {
      user.nodeType = user.nodeType || "user";
      console.log(
        chalkSocket(
          PF +
            " | R< TWITTER_UNFOLLOW" +
            " | " +
            getTimeStamp() +
            " | " +
            ipAddress +
            " | " +
            socket.id +
            " | NID: " +
            user.nodeId +
            " | @" +
            user.screenName
        )
      );

      try {
        const node = await nodeSetProps({
          node: user,
          props: {
            following: false,
            autoFollow: false,
          },
        });

        if (node && node.nodeType === "user") {
          viewNameSpace.emit("FOLLOW", node);
          adminNameSpace.emit("FOLLOW", node);
          utilNameSpace.emit("FOLLOW", node);
        }
      } catch (err) {
        console.log(chalkError(PF + " | TWITTER_FOLLOW ERROR: " + err));
      }
    });

    socket.on("TWITTER_CATEGORY_VERIFIED", async function (user) {
      user.nodeType = user.nodeType || "user";

      console.log(
        chalkSocket(
          PF +
            " | R< TWITTER_CATEGORY_VERIFIED" +
            " | " +
            getTimeStamp() +
            " | " +
            ipAddress +
            " | " +
            socket.id +
            " | NID: " +
            user.nodeId +
            " | @" +
            user.screenName +
            " | CM: " +
            user.category
        )
      );

      try {
        const node = await nodeSetProps({
          node: user,
          props: {
            category: user.category,
            following: true,
            categoryVerified: true,
          },
        });

        if (node && node.nodeType === "user") {
          socket.emit("SET_TWITTER_USER", { node: node, stats: statsObj });
        }
      } catch (err) {
        console.log(
          chalkError(PF + " | TWITTER_CATEGORY_VERIFIED ERROR: " + err)
        );
      }
    });

    socket.on("TWITTER_CATEGORY_UNVERIFIED", async function (user) {
      user.nodeType = user.nodeType || "user";
      console.log(
        chalkSocket(
          PF +
            " | R< TWITTER_CATEGORY_UNVERIFIED" +
            " | " +
            getTimeStamp() +
            " | " +
            ipAddress +
            " | " +
            socket.id +
            " | NID: " +
            user.nodeId +
            " | @" +
            user.screenName
        )
      );

      try {
        const node = await nodeSetProps({
          node: user,
          props: { categoryVerified: false },
        });
        socket.emit("SET_TWITTER_USER", { node: node, stats: statsObj });
      } catch (err) {
        console.log(
          chalkError(PF + " | TWITTER_CATEGORY_VERIFIED ERROR: " + err)
        );
      }
    });

    socket.on("TWITTER_IGNORE", async function (user) {
      user.nodeType = user.nodeType || "user";
      user.ignored = true;

      try {
        console.log(
          chalkSocket(
            PF +
              " | R< TWITTER_IGNORE" +
              " | " +
              getTimeStamp() +
              " | " +
              ipAddress +
              " | " +
              socket.id +
              " | NID: " +
              user.nodeId +
              " | @" +
              user.screenName
          )
        );

        tssChild.send({
          op: "IGNORE",
          user: { nodeId: user.nodeId, screenName: user.screenName },
        });

        await nodeSetProps({ node: user, props: { ignored: true } });
        await deleteNode(user);
        socket.emit("SET_TWITTER_USER", { node: user, stats: statsObj });
      } catch (err) {
        console.log(chalkError(PF + " | *** IGNORE USER ERROR: " + err));
      }
    });

    socket.on("TWITTER_UNIGNORE", async function (user) {
      user.nodeType = user.nodeType || "user";
      user.ignored = false;

      try {
        console.log(
          chalkSocket(
            PF +
              " | R< TWITTER_UNIGNORE" +
              " | " +
              getTimeStamp() +
              " | " +
              ipAddress +
              " | " +
              socket.id +
              " | NID: " +
              user.nodeId +
              " | @" +
              user.screenName
          )
        );

        tssChild.send({
          op: "UNIGNORE",
          user: { nodeId: user.nodeId, screenName: user.screenName },
        });

        await nodeSetProps({ node: user, props: { ignored: false } });
        socket.emit("SET_TWITTER_USER", { node: user, stats: statsObj });
      } catch (err) {
        console.log(chalkError(PF + " | TWITTER_UNIGNORE ERROR: " + err));
      }
    });

    socket.on("TWITTER_BOT", async function (user) {
      user.nodeType = user.nodeType || "user";
      user.isBot = true;

      try {
        console.log(
          chalkSocket(
            PF +
              " | R< TWITTER_BOT" +
              " | " +
              getTimeStamp() +
              " | " +
              ipAddress +
              " | " +
              socket.id +
              " | NID: " +
              user.nodeId +
              " | @" +
              user.screenName
          )
        );

        tssChild.send({
          op: "BOT",
          user: { nodeId: user.nodeId, screenName: user.screenName },
        });
        await nodeSetProps({ node: user, props: { isBot: true } });
        socket.emit("SET_TWITTER_USER", { node: user, stats: statsObj });
      } catch (err) {
        console.log(chalkError(PF + " | *** BOT USER ERROR: " + err));
      }
    });

    socket.on("TWITTER_UNBOT", async function (user) {
      user.nodeType = user.nodeType || "user";
      user.isBot = false;

      try {
        console.log(
          chalkSocket(
            PF +
              " | R< TWITTER_UNBOT" +
              " | " +
              getTimeStamp() +
              " | " +
              ipAddress +
              " | " +
              socket.id +
              " | NID: " +
              user.nodeId +
              " | @" +
              user.screenName
          )
        );

        tssChild.send({
          op: "UNBOT",
          user: { nodeId: user.nodeId, screenName: user.screenName },
        });

        nodeSetProps({ node: user, props: { isBot: false } });
        socket.emit("SET_TWITTER_USER", { node: user, stats: statsObj });
      } catch (err) {
        console.log(chalkError(PF + " | TWITTER_UNBOT ERROR: " + err));
      }
    });

    // socket.on("TWITTER_SEARCH_NODE", async function (sn) {
    socket.on("TWITTER_SEARCH_NODE", async function (searchObj) {
      console.log(
        chalkSocket(
          PF +
            " | R< TWITTER_SEARCH_NODE" +
            " | " +
            getTimeStamp() +
            " | " +
            ipAddress +
            " | " +
            socket.id +
            " | minFollowers: " +
            searchObj.minFollowers +
            " | searchNode: " +
            searchObj.searchNode
        )
      );

      twitterSearchNode(searchObj);
    });

    socket.on(
      "TWITTER_CATEGORIZE_NODE",
      async function twitterCategorizeNode(catNodeObj) {
        try {
          console.log(
            `${PF} | R< TWITTER_CATEGORIZE_NODE | CAT: ${catNodeObj.category} | @${catNodeObj.node.screenName}`
          );
          const node = await nodeSetProps({
            createNodeOnMiss: true,
            categorizedBy: catNodeObj.categorizedBy, // screenName
            node: catNodeObj.node,
            props: {
              screenName: catNodeObj.node.screenName,
              category: catNodeObj.category,
              following: true,
            },
            autoCategorizeFlag: true,
          });

          if (node) {
            if (node.nodeType === "user") {
              console.log(
                chalkSocket(
                  PF +
                    " | R< TWITTER_CATEGORIZE_NODE" +
                    " | " +
                    getTimeStamp() +
                    " | " +
                    ipAddress +
                    " | " +
                    socket.id +
                    " | NID: " +
                    node.nodeId +
                    " | @" +
                    node.screenName +
                    " | CM: " +
                    formatCategory(node.category)
                )
              );

              if (!empty(node.categorizedBy)) {
                console.log(
                  chalkSocket(
                    PF +
                      " | R< TWITTER_CATEGORIZE_NODE | CAT BY" +
                      " | @" +
                      node.screenName +
                      " | CAT BY\n" +
                      jsonPrint(node.categorizedBy)
                  )
                );
              }

              viewNameSpace.emit("SET_TWITTER_USER", {
                node: node,
                stats: statsObj,
              });
              updateUserCounts();
            }

            if (node.nodeType === "hashtag") {
              viewNameSpace.emit("SET_TWITTER_HASHTAG", {
                node: node,
                stats: statsObj,
              });
              updateHashtagCounts();
            }
          }
        } catch (err) {
          console.log(
            chalkError(
              PF +
                " | *** TWITTER_CATEGORIZE_NODE ERROR" +
                " | TYPE: " +
                catNodeObj.node.nodeType +
                " | NID: " +
                catNodeObj.node.nodeId +
                " | @" +
                catNodeObj.node.screenName +
                " | ERROR: " +
                err
            )
          );
        }
      }
    );

    socket.on("USER_READY", function userReady(userObj) {
      console.log(
        chalkSocket(
          `${PF} | R< USER READY | ${getTimeStamp()} | ${ipAddress} | ${
            socket.id
          } | ${userObj.nodeId} | SENT AT ${getTimeStamp(
            parseInt(userObj.timeStamp)
          )}`
        )
      );

      socket.emit(
        "USER_READY_ACK",
        { userId: userObj.userId, timeStamp: moment().valueOf() },
        (err) => {
          if (err) {
            console.log(
              chalkError(
                `${PF} | *** USER_READY_ACK SEND ERROR | ${userObj.userId}`
              )
            );
          } else {
            console.log(
              chalkError(`${PF} | TXD> USER_READY_ACK | ${userObj.userId}`)
            );
          }
        }
      );
    });

    socket.on("VIEWER_READY", async function viewerReady(viewerObj) {
      const timeStamp = moment().valueOf();

      console.log(
        chalkSocket(
          `${PF} | VIEWER READY | ${getTimeStamp(timeStamp)} | ${ipAddress} | ${
            socket.id
          } | ${viewerObj.viewerId} | SENT AT ${getTimeStamp(
            parseInt(viewerObj.timeStamp)
          )}`
        )
      );

      try {
        const results = await twitterSearchUser({
          node: {
            nodeType: "user",
            screenName: defaultTwitterUserScreenName,
          },
        });

        if (results.node) {
          socket.emit("SET_TWITTER_USER", {
            node: results.node,
            stats: statsObj,
          });
        } else {
          socket.emit("TWITTER_USER_NOT_FOUND", {
            node: defaultTwitterUserScreenName,
            stats: statsObj,
          });
        }

        socket.emit("VIEWER_READY_ACK", {
          nodeId: viewerObj.viewerId,
          timeStamp: moment().valueOf(),
          viewerSessionKey: moment().valueOf(),
        });
      } catch (err) {
        console.log(
          chalkError(
            PF +
              " | *** ERROR | VIEWER READY FIND USER" +
              " | " +
              getTimeStamp(timeStamp) +
              " | " +
              ipAddress +
              " | " +
              socket.id +
              " | " +
              viewerObj.viewerId +
              " | ERROR: " +
              err
          )
        );
      }
    });

    socket.on("TWITTER_AUTHENTICATE", async function socketLogin(viewerObj) {
      viewerObj.timeStamp = moment().valueOf();

      console.log(
        chalkAlert(
          PF +
            " | TWITTER_AUTHENTICATE" +
            " | " +
            socket.id +
            " | IP: " +
            ipAddress +
            " | DOMAIN: " +
            domainName +
            "\n" +
            jsonPrint(viewerObj)
        )
      );

      // slackText = "*LOADING PAGE | TWITTER TWITTER_AUTHENTICATE*";
      // slackText = slackText + "\nIP: " + ipAddress;
      // slackText = slackText + "\nDOMAIN: " + domainName;
      // slackText = slackText + "\n@" + viewerObj.screenName;

      // await slackSendWebMessage({ channel: slackChannel, text: slackText });

      authInProgressTwitterUserCache.set(viewerObj.nodeId, viewerObj);
    });

    socket.on("STATS", function socketStats(statsObj) {
      const serverObj = serverCache.get(socket.id);
      const viewerObj = viewerCache.get(socket.id);

      if (serverObj !== undefined) {
        serverObj.status = "STATS";
        serverObj.stats = statsObj;
        serverObj.timeStamp = moment().valueOf();

        serverCache.set(socket.id, serverObj);

        if (configuration.verbose) {
          console.log(
            chalkSocket(PF + " | R< STATS | " + serverObj.user.userId)
          );
        }

        adminNameSpace.emit("SERVER_STATS", serverObj);
      }

      if (viewerObj !== undefined) {
        viewerObj.status = "STATS";
        viewerObj.stats = statsObj;
        viewerObj.timeStamp = moment().valueOf();

        viewerCache.set(socket.id, viewerObj);

        if (configuration.verbose) {
          console.log(
            chalkSocket(PF + " | R< STATS | " + viewerObj.user.userId)
          );
        }

        adminNameSpace.emit("SERVER_STATS", viewerObj);
      }

      if (configuration.verbose) {
        console.log(chalkSocket(PF + " | R< STATS | " + socket.id));
      }
    });
  } catch (err) {
    console.log(
      chalkError(PF + " | *** initSocketHandler DNS REVERSE ERROR: " + err)
    );
  }
}

async function initSocketNamespaces() {
  try {
    const timeStamp = moment().valueOf();

    console.log(
      chalkInfo(
        PF + " | " + getTimeStamp(timeStamp) + " | INIT SOCKET NAMESPACES"
      )
    );

    adminNameSpace = io.of("/admin");
    utilNameSpace = io.of("/util");
    userNameSpace = io.of("/user");
    viewNameSpace = io.of("/view");

    adminNameSpace.on("connect", function adminConnect(socket) {
      console.log(chalk.blue(PF + " | ADMIN CONNECT " + socket.id));

      const ipAddress =
        socket.handshake.headers["x-real-ip"] ||
        socket.client.conn.remoteAddress;

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);

      if (authenticatedSocketObj !== undefined) {
        console.log(
          chalkAlert(
            PF +
              " | ADMIN ALREADY AUTHENTICATED" +
              " | " +
              socket.id +
              " | " +
              authenticatedSocketObj.ipAddress +
              "\n" +
              jsonPrint(authenticatedSocketObj)
          )
        );
      } else {
        socket.on("authentication", async function (data) {
          if (configuration.verbose) {
            console.log(
              PF +
                " | RX SOCKET AUTHENTICATION" +
                " | " +
                socket.nsp.name.toUpperCase() +
                " | " +
                ipAddress +
                " | " +
                socket.id +
                " | USER ID: " +
                data.userId
            );
          }

          data.ipAddress = ipAddress;
          data.timeStamp = moment().valueOf();

          authenticatedSocketCache.set(socket.id, data);

          // statsObj.entity.util.connected = Object.keys(
          //   utilNameSpace.connected
          // ).length; // userNameSpace.sockets.length ;

          await initSocketHandler({ namespace: "admin", socket: socket });

          socket.emit("authenticated", true);
        });
      }
    });

    utilNameSpace.on("connect", function utilConnect(socket) {
      console.log(chalk.blue(PF + " | #### UTIL CONNECT " + socket.id));

      const ipAddress =
        socket.handshake.headers["x-real-ip"] ||
        socket.client.conn.remoteAddress;

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);
      if (authenticatedSocketObj !== undefined) {
        console.log(
          chalkAlert(
            PF +
              " | UTIL ALREADY AUTHENTICATED" +
              " | " +
              socket.id +
              " | " +
              authenticatedSocketObj.ipAddress +
              "\n" +
              jsonPrint(authenticatedSocketObj)
          )
        );
      } else {
        socket.on("authentication", async function (data) {
          if (configuration.verbose) {
            console.log(
              PF +
                " | RX SOCKET AUTHENTICATION" +
                " | " +
                socket.nsp.name.toUpperCase() +
                " | " +
                ipAddress +
                " | " +
                socket.id +
                " | USER ID: " +
                data.userId
            );
          }

          data.ipAddress = ipAddress;
          data.timeStamp = moment().valueOf();

          authenticatedSocketCache.set(socket.id, data);

          // statsObj.entity.util.connected = Object.keys(
          //   utilNameSpace.connected
          // ).length; // userNameSpace.sockets.length ;

          await initSocketHandler({ namespace: "util", socket: socket });

          socket.emit("authenticated", true);
        });
      }
    });

    userNameSpace.on("connect", async function userConnect(socket) {
      console.log(chalk.blue(PF + " | USER CONNECT " + socket.id));

      const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);
      if (authenticatedSocketObj !== undefined) {
        console.log(
          chalkAlert(
            PF +
              " | USER ALREADY AUTHENTICATED" +
              " | " +
              socket.id +
              " | " +
              authenticatedSocketObj.ipAddress +
              "\n" +
              jsonPrint(authenticatedSocketObj)
          )
        );
      }

      await initSocketHandler({ namespace: "user", socket: socket });
    });

    viewNameSpace.on("connect", function viewConnect(socket) {
      try {
        const ipAddress =
          socket.handshake.headers["x-real-ip"] ||
          socket.client.conn.remoteAddress;

        console.log(chalk.blue(PF + " | VIEWER CONNECT " + socket.id));

        const authenticatedSocketObj = authenticatedSocketCache.get(socket.id);

        if (authenticatedSocketObj !== undefined) {
          console.log(
            chalkAlert(
              PF +
                " | VIEWER ALREADY AUTHENTICATED" +
                " | " +
                socket.id +
                " | " +
                authenticatedSocketObj.ipAddress +
                "\n" +
                jsonPrint(authenticatedSocketObj)
            )
          );
        } else {
          socket.on("authentication", async function (data) {
            console.log(
              PF +
                " | RX SOCKET AUTHENTICATION" +
                " | " +
                socket.nsp.name.toUpperCase() +
                " | " +
                ipAddress +
                " | " +
                socket.id +
                " | USER ID: " +
                data.userId
            );

            data.ipAddress = ipAddress;
            data.timeStamp = moment().valueOf();

            authenticatedSocketCache.set(socket.id, data);

            await initSocketHandler({ namespace: "view", socket: socket });

            socket.emit("authenticated", true);
          });
        }
      } catch (err) {
        console.log(chalkError(PF + " | VIEWER CONNECT ERROR:" + error));
        throw err;
      }
    });

    statsObj.ioReady = true;

    return;
  } catch (err) {
    console.log(
      chalkError(PF + " | *** INIT SOCKET NAME SPACES ERROR: " + err)
    );
    throw err;
  }
}

async function checkCategory(nodeObj) {
  if (nodeObj.nodeType !== "user" && nodeObj.nodeType !== "hashtag") {
    throw new Error("NO CATEGORY HASHMAP: " + nodeObj.nodeType);
  }

  const categorizedNodeHashMap =
    nodeObj.nodeType === "user"
      ? categorizedUserHashMap
      : categorizedHashtagHashMap;

  if (categorizedNodeHashMap.has(nodeObj.nodeId)) {
    const catObj = categorizedNodeHashMap.get(nodeObj.nodeId);

    nodeObj.category = catObj.category;
    nodeObj.categoryAuto = catObj.categoryAuto;
    nodeObj.categorizeNetwork = catObj.network;
    nodeObj.categoryVerified = catObj.verified;

    if (nodesPerMinuteTopTermCache.get(nodeObj.nodeId) !== undefined) {
      nodeObj.isTopTerm = true;
    } else {
      nodeObj.isTopTerm = false;
    }

    if (
      nodesPerMinuteTopTermNodeTypeCache[nodeObj.nodeType].get(
        nodeObj.nodeId
      ) !== undefined
    ) {
      nodeObj.isTopTermNodeType = true;
    } else {
      nodeObj.isTopTermNodeType = false;
    }

    return nodeObj;
  } else {
    return nodeObj;
  }
}

async function updateNodeMeter(node) {
  const nodeType = node.nodeType;

  if (!configuration.metrics.nodeMeterEnabled) {
    return node;
  }

  if (empty(node.nodeId)) {
    console.log(chalkError(PF + " | NODE ID UNDEFINED\n" + jsonPrint(node)));
    throw new Error("NODE ID UNDEFINED", node);
  }

  const nodeObj = pick(node, [
    "nodeId",
    "nodeType",
    "isServer",
    "isIgnored",
    "rate",
    "mentions",
  ]);

  const meterNodeId = nodeObj.nodeId;

  if (empty(nodeMeterType[nodeType])) {
    nodeMeterType[nodeType] = {};
    nodeMeterType[nodeType][meterNodeId] = {};
  }

  if (empty(nodeMeterType[nodeType][meterNodeId])) {
    nodeMeterType[nodeType][meterNodeId] = {};
  }

  if (ignoreWordHashMap.has(meterNodeId)) {
    nodeObj.isIgnored = true;
    node.isIgnored = true;

    nodeMeter[meterNodeId] = null;
    nodeMeterType[nodeType][meterNodeId] = null;

    delete nodeMeter[meterNodeId];
    delete nodeMeterType[nodeType][meterNodeId];

    return node;
  } else {
    if (/TSS_/.test(meterNodeId) || nodeObj.isServer) {
      return node;
    } else if (empty(nodeMeter[meterNodeId])) {
      nodeMeter[meterNodeId] = new Measured.Meter({ rateUnit: 60000 });
      nodeMeterType[nodeType][meterNodeId] = new Measured.Meter({
        rateUnit: 60000,
      });

      nodeMeter[meterNodeId].mark();
      nodeMeterType[nodeType][meterNodeId].mark();
      globalNodeMeter.mark();
      globalNodeCounter.inc();

      nodeObj.rate = parseFloat(nodeMeter[meterNodeId].toJSON()[metricsRate]);
      nodeObj.mentions = nodeObj.mentions ? nodeObj.mentions + 1 : 1;

      node.rate = nodeObj.rate;
      node.mentions = nodeObj.mentions;

      nodeCache.set(meterNodeId, nodeObj);

      return node;
    } else {
      nodeMeter[meterNodeId].mark();
      globalNodeMeter.mark();
      globalNodeCounter.inc();

      if (empty(nodeMeterType[nodeType][meterNodeId])) {
        nodeMeterType[nodeType][meterNodeId] = new Measured.Meter({
          rateUnit: 60000,
        });
      }

      nodeObj.rate = parseFloat(nodeMeter[meterNodeId].toJSON()[metricsRate]);
      node.rate = nodeObj.rate;

      const nCacheObj = nodeCache.get(meterNodeId);

      if (nCacheObj !== undefined) {
        nodeObj.mentions = Math.max(nodeObj.mentions, nCacheObj.mentions);
      }

      nodeObj.mentions = nodeObj.mentions ? nodeObj.mentions + 1 : 1;
      node.mentions = nodeObj.mentions;

      nodeCache.set(meterNodeId, nodeObj);

      return node;
    }
  }
}

let transmitNodeQueueReady = true;
let transmitNodeQueueInterval;
const transmitNodeQueue = [];

function checkFollowableSearchTerm(searchTerm, text) {
  if (text === undefined || !text || text === "") {
    return false;
  }

  if (new RegExp("\\b" + searchTerm + "\\b", "i").test(text.trim())) {
    return true;
  }

  return false;
}

function followable(node) {
  // return new Promise(function (resolve) {

  // let hitSearchTerm = false;

  return followableSearchTermsArray.some(function (searchTerm) {
    return (
      checkFollowableSearchTerm(searchTerm, node.name) ||
      checkFollowableSearchTerm(searchTerm, node.screenName) ||
      checkFollowableSearchTerm(searchTerm, node.description)
    );
  });

  // followableSearchTermsArray.some(function (searchTerm) {
  //   hitSearchTerm = checkFollowableSearchTerm(searchTerm, node.screenName);
  //   return hitSearchTerm;
  // });

  // followableSearchTermsArray.some(function (searchTerm) {
  //   hitSearchTerm = checkFollowableSearchTerm(searchTerm, node.description);
  //   return hitSearchTerm;
  // });

  // resolve(hitSearchTerm);
  // });
}

async function userCategorizeable(params) {
  // const hitSearchTerm = false;
  const node = params.node;
  // const verbose =
  //   params.verbose && params.verbose !== undefined ? params.verbose : false;

  // assume it's a user node

  if (isCategorized(node)) {
    return true;
  }

  if (node.following && node.following !== undefined) {
    return true;
  }

  if (node.ignored && node.ignored !== undefined) {
    return false;
  }

  if (node.lang && node.lang !== undefined && node.lang != "en") {
    return false;
  }

  if (
    ignoreLocationsRegEx &&
    ignoreLocationsRegEx !== undefined &&
    node.location &&
    node.location !== undefined &&
    !allowLocationsRegEx.test(node.location) &&
    ignoreLocationsRegEx.test(node.location)
  ) {
    return false;
  }

  if (
    node.followersCount &&
    node.followersCount !== undefined &&
    node.followersCount < configuration.minFollowersAutoCategorize
  ) {
    return false;
  }

  return followable(node);
}

let botSetInterval;

async function fetchBotIds(p) {
  let fetchBotIdsInterval;

  statsObj.status = "INIT BOT SET";
  clearInterval(fetchBotIdsInterval);

  try {
    const params = p || {};
    const botCategory = params.botCategory || "problematic";
    const maxBotsToFetch =
      params.maxBotsToFetch || configuration.maxBotsToFetch;
    const fetchBotIdsIntervalTime =
      params.fetchBotIdsIntervalTime || 5 * ONE_SECOND;

    console.log(
      chalkTwitter(
        PF + " | INIT BOT SET INTERVAL | BOT CATEGORY: " + botCategory
      )
    );

    const url = "https://botsentinel.com/api/analyzed-accounts/load-more-data";

    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    const options = {
      httpsAgent: httpsAgent,
      params: {
        offset: 0,
        category: botCategory,
      },
    };

    // botNodeIdSet.clear();

    fetchBotIdsInterval = setInterval(async () => {
      try {
        const response = await axios.get(url, options);

        const botArray = response.data;

        if (!botArray || botArray.length === 0) {
          console.log(
            chalkBlueBold(
              PF +
                " [OFFSET: " +
                options.params.offset +
                "] " +
                " | --- BOT UPDATE END" +
                " | BOT CAT: " +
                options.params.category +
                " | BOTS FETCHED: " +
                botNodeIdSet.size
            )
          );

          clearInterval(fetchBotIdsInterval);
          // return
        } else {
          let botIndex = 0;
          // botArray.forEach(async (botObj, botIndex) => {
          for (const botObj of botArray) {
            botIndex += 1;

            const nodeUpdated = await global.wordAssoDb.User.findOneAndUpdate(
              { nodeId: botObj.id },
              {
                nodeId: botObj.id,
                userId: botObj.id,
                isBot: true,
                name: botObj.name,
                screenName: botObj.handle,
                followersCount: botObj.followers,
                friendsCount: botObj.following,
                createdAt: botObj.created,
                statusesCount: botObj.tweets,
                location: botObj.location,
                profileImageUrl: botObj.profile_photo,
                bannerImageUrl: botObj.cover_photo,
              },
              { upsert: true, new: true, lean: true }
            );

            botNodeIdSet.add(nodeUpdated.nodeId);

            if (configuration.verbose || botIndex % 1000 === 0) {
              printUserObj(
                PF +
                  "| +++ BOT [" +
                  botIndex +
                  "] | SET SIZE: " +
                  botNodeIdSet.size +
                  " | BOT CAT: " +
                  options.params.category,
                nodeUpdated
              );
            }
          }

          options.params.offset += botArray.length;

          if (options.params.offset >= maxBotsToFetch) {
            console.log(
              chalkBlueBold(
                PF +
                  " [OFFSET: " +
                  options.params.offset +
                  "] " +
                  " | --- BOT UPDATE END" +
                  " | BOT CAT: " +
                  options.params.category +
                  " | BOTS FETCHED: " +
                  botNodeIdSet.size
              )
            );
            clearInterval(fetchBotIdsInterval);
            // return
          }
        }
      } catch (e) {
        clearInterval(fetchBotIdsInterval);
        console.log(
          chalkError(MODULE_ID_PREFIX + " | *** BOT FETCH ERROR: " + e)
        );
        return;
      }
    }, fetchBotIdsIntervalTime);
  } catch (err) {
    console.log(
      chalkError(MODULE_ID_PREFIX + " | *** BOT FETCH ERROR: " + err)
    );
    clearInterval(fetchBotIdsInterval);
    return;
  }
}

async function initBotSet() {
  statsObj.status = "INIT BOT SET";

  console.log(chalkTwitter(PF + " | INIT BOT SET INTERVAL"));

  try {
    const dbBotNodes = await global.wordAssoDb.User.find({ isBot: true })
      .select({ nodeId: 1, screenName: 1 })
      .lean();

    console.log(chalkTwitter(PF + " | BOTS IN DB: " + dbBotNodes.length));

    for (const botNode of dbBotNodes) {
      botNodeIdSet.add(botNode.nodeId);

      if (botNodeIdSet.size % 1000 === 0) {
        console.log(
          chalk.black(
            PF +
              " | LOADED DB BOT NODE IDs [" +
              botNodeIdSet.size +
              "]" +
              " | NID" +
              botNode.nodeId +
              " | @" +
              botNode.screenName
          )
        );
      }
    }

    clearInterval(botSetInterval);

    for (const botCategory of configuration.botCategories) {
      await fetchBotIds({ botCategory: botCategory });
    }

    setInterval(async () => {
      for (const botCategory of configuration.botCategories) {
        await fetchBotIds({ botCategory: botCategory });
      }

      console.log(
        chalk.black(PF + " | LOADED BOT NODE IDs [" + botNodeIdSet.size + "]")
      );

      statsObj.bots = statsObj.bots || {};
      statsObj.bots.numOfBots = botNodeIdSet.size;
    }, configuration.botUpdateIntervalTime);

    return;
  } catch (e) {
    console.log(chalkError(PF + " | BOT SENTINEL FETCH\n" + e));
    throw e;
  }
}

async function initAllowLocations() {
  statsObj.status = "INIT ALLOW LOCATIONS SET";

  console.log(chalkTwitter(PF + " | INIT ALLOW LOCATIONS"));

  try {
    const data = await tcUtils.loadFileRetry({
      folder: configDefaultFolder,
      file: "allowLocations.txt",
    });

    if (empty(data)) {
      console.log(
        chalkError(
          PF +
            " | DROPBOX FILE DOWNLOAD DATA UNDEFINED" +
            " | " +
            configDefaultFolder +
            "/" +
            "allowLocations.txt"
        )
      );
      throw new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED");
    }

    const dataArray = data.toString().toLowerCase().split("\n");

    console.log(
      chalk.blue(
        PF + " | FILE CONTAINS " + dataArray.length + " ALLOW LOCATIONS "
      )
    );

    dataArray.forEach(function (loc) {
      let location = loc.trim();
      location = location.replace(/^\s+|\s+$|\n/gim, "");
      if (location.length > 1) {
        allowLocationsSet.add(location);
        console.log(
          chalkLog(
            PF +
              " | +++ ALLOW LOCATION [" +
              allowLocationsSet.size +
              "] " +
              location
          )
        );
      }
    });

    allowLocationsArray = [...allowLocationsSet];
    allowLocationsString = allowLocationsArray.join("\\b|\\b");
    allowLocationsString = "\\b" + allowLocationsString + "\\b";
    allowLocationsRegEx = new RegExp(allowLocationsString, "i");

    return;
  } catch (e) {
    console.log(chalkError(PF + " | TSS | LOAD FILE ERROR\n" + e));
    throw e;
  }
}

async function initIgnoreLocations() {
  statsObj.status = "INIT IGNORE LOCATIONS SET";

  console.log(chalkTwitter(PF + " | INIT IGNORE LOCATIONS"));

  try {
    const data = await tcUtils.loadFileRetry({
      folder: configDefaultFolder,
      file: "ignoreLocations.txt",
    });

    if (empty(data)) {
      console.log(
        chalkError(
          PF +
            " | DROPBOX FILE DOWNLOAD DATA UNDEFINED" +
            " | " +
            configDefaultFolder +
            "/" +
            "ignoreLocations.txt"
        )
      );
      throw new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED");
    }

    const dataArray = data.toString().toLowerCase().split("\n");

    console.log(
      chalk.blue(
        PF + " | FILE CONTAINS " + dataArray.length + " IGNORE LOCATIONS "
      )
    );

    dataArray.forEach(function (loc) {
      let location = loc.trim();
      location = location.replace(/\s|\n/gim, "");
      if (location.length > 1) {
        ignoreLocationsSet.add(location);
        debug(
          chalkLog(
            PF +
              " | +++ IGNORE LOCATION [" +
              ignoreLocationsSet.size +
              "] " +
              location
          )
        );
      }
    });

    ignoreLocationsArray = [...ignoreLocationsSet];
    ignoreLocationsString = ignoreLocationsArray.join("\\b|\\b");
    ignoreLocationsString = "\\b" + ignoreLocationsString + "\\b";
    ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "i");

    return;
  } catch (e) {
    console.log(chalkError(PF + " | *** LOAD FILE ERROR\n" + e));
    throw e;
  }
}

async function initIgnoredProfileWords() {
  console.log(chalkInfo(PF + " | INIT IGNORED PROFILE WORDS"));

  try {
    const result = await tcUtils.initSetFromFile({
      folder: configDefaultFolder,
      file: ignoredProfileWordsFile,
      resolveOnNotFound: true,
    });

    if (result) {
      ignoredProfileWordsSet = result;
      ignoredProfileWordsSet.delete("");
      ignoredProfileWordsSet.delete(" ");
      // ignoredProfileWordsArray = [...ignoredProfileWordsSet];
    }

    console.log(
      chalkInfo(
        PF +
          " | +++ LOADED IGNORED PROFILE WORDS: " +
          ignoredProfileWordsSet.size
      )
    );

    return;
  } catch (err) {
    console.log(
      chalkError(PF + " | *** INIT IGNORED PROFILE WORDS ERROR: " + err)
    );
    throw err;
  }
}

const countDocumentsRunning = {};
countDocumentsRunning.users = false;
countDocumentsRunning.hashtags = false;

async function countDocuments(params) {
  try {
    const queryValue = params.query
      ? Object.keys(params.query).join("-")
      : "noquery";

    console.log(
      chalkLog(
        `${PF} | ... COUNTING DOCUMENTS: TYPE: ${params.documentType} | QUERY VALUE: ${queryValue}`
      )
    );

    if (
      params.query &&
      countDocumentsRunning[params.documentType] &&
      countDocumentsRunning[params.documentType] === queryValue
    ) {
      console.log(
        chalkAlert(
          `${PF} | SKIP COUNTING DOCUMENTS: TYPE: ${params.documentType} | QUERY VALUE: ${queryValue}`
        )
      );
      return;
    }

    countDocumentsRunning[params.documentType] = queryValue;

    const documentCollection = global.dbConnection.collection(
      params.documentType
    );

    // console.log(chalkLog(PF + " | ... COUNTING DOCUMENTS: TYPE: " + params.documentType));

    if (params.query) {
      const count = await documentCollection.countDocuments(params.query);
      countDocumentsRunning[params.documentType] = false;
      return count;
    } else {
      // estimatedDocumentCount doesn't take query; always returns all docs in collection
      const count = await documentCollection.estimatedDocumentCount();
      countDocumentsRunning[params.documentType] = false;
      return count;
    }
  } catch (err) {
    countDocumentsRunning[params.documentType] = false;
    console.log(chalkError(PF + " | *** DB COUNT DOCUMENTS ERROR: " + err));
    console.error(err);
    throw err;
  }
}

let updateUserCountsRunning = false;

const setUpdateUserCountsTimeout = () => {
  updateUserCountsRunning = true;

  setTimeout(() => {
    updateUserCountsRunning = false;
  }, 10000);

  return;
};

let updateHashtagCountsRunning = false;

const setUpdateHashtagCountsTimeout = () => {
  updateHashtagCountsRunning = true;

  setTimeout(() => {
    updateHashtagCountsRunning = false;
  }, 10000);

  return;
};

async function updateUserCounts() {
  try {
    if (updateUserCountsRunning) {
      return;
    }

    setUpdateUserCountsTimeout();

    const startToday = moment().startOf("day").valueOf();
    const endToday = moment().endOf("day").valueOf();

    const startPeriod = moment().startOf("week").valueOf();
    const endPeriod = moment().endOf("week").valueOf();

    const startPeriodLast = moment()
      .startOf("week")
      .subtract(7, "days")
      .valueOf();
    const endPeriodLast = moment().endOf("week").subtract(7, "days").valueOf();

    statsObj.user.total = await countDocuments({ documentType: "users" });
    console.log(chalkBlue(PF + " | GRAND TOTAL USERS: " + statsObj.user.total));

    statsObj.user.following = await countDocuments({
      documentType: "users",
      query: { following: true },
    });
    console.log(
      chalkBlue(PF + " | FOLLOWING USERS: " + statsObj.user.following)
    );

    statsObj.user.notFollowing = await countDocuments({
      documentType: "users",
      query: { following: false },
    });
    console.log(
      chalkBlue(PF + " | NOT FOLLOWING USERS: " + statsObj.user.notFollowing)
    );

    statsObj.user.ignored = await countDocuments({
      documentType: "users",
      query: { ignored: true },
    });
    console.log(chalkBlue(PF + " | IGNORED USERS: " + statsObj.user.ignored));

    statsObj.user.categoryVerified = await countDocuments({
      documentType: "users",
      query: { categoryVerified: true },
    });
    console.log(
      chalkBlue(PF + " | CAT VERIFIED USERS: " + statsObj.user.categoryVerified)
    );

    // -----

    statsObj.user.categorizedManual = await countDocuments({
      documentType: "users",
      // query: { categorized: true },
      query: { category: { $in: ["left", "neutral", "right"] } },
    });
    console.log(
      chalkBlue(PF + " | CAT MANUAL USERS: " + statsObj.user.categorizedManual)
    );

    statsObj.user.category.left = await countDocuments({
      documentType: "users",
      query: { category: "left" },
    });
    console.log(
      chalkBlue(PF + " | CAT MANUAL USERS LEFT: " + statsObj.user.category.left)
    );

    statsObj.user.category.right = await countDocuments({
      documentType: "users",
      query: { category: "right" },
    });
    console.log(
      chalkBlue(
        PF + " | CAT MANUAL USERS RIGHT: " + statsObj.user.category.right
      )
    );

    statsObj.user.category.neutral = await countDocuments({
      documentType: "users",
      query: { category: "neutral" },
    });
    console.log(
      chalkBlue(
        PF + " | CAT MANUAL USERS NEUTRAL: " + statsObj.user.category.neutral
      )
    );

    // -----

    statsObj.user.uncategorized.all = await countDocuments({
      documentType: "users",
      query: { category: "none" },
    });
    console.log(
      chalkBlue(
        PF + " | UNCAT MANUAL USERS: " + statsObj.user.uncategorized.all
      )
    );

    statsObj.user.uncategorized.left = await countDocuments({
      documentType: "users",
      query: { category: "none", categoryAuto: "left" },
    });
    console.log(
      chalkBlue(
        PF + " | UNCAT MANUAL LEFT USERS: " + statsObj.user.uncategorized.left
      )
    );

    statsObj.user.uncategorized.right = await countDocuments({
      documentType: "users",
      query: { category: "none", categoryAuto: "right" },
    });
    console.log(
      chalkBlue(
        PF + " | UNCAT MANUAL RIGHT USERS: " + statsObj.user.uncategorized.right
      )
    );

    statsObj.user.uncategorized.neutral = await countDocuments({
      documentType: "users",
      query: { category: "none", categoryAuto: "neutral" },
    });
    console.log(
      chalkBlue(
        PF +
          " | UNCAT MANUAL NEUTRAL USERS: " +
          statsObj.user.uncategorized.neutral
      )
    );

    // -----

    statsObj.user.categorizedAuto = await countDocuments({
      documentType: "users",
      query: { categorizedAuto: true },
    });
    console.log(
      chalkBlue(PF + " | CAT AUTO USERS: " + statsObj.user.categorizedAuto)
    );

    statsObj.user.categoryAuto.left = await countDocuments({
      documentType: "users",
      query: { categoryAuto: "left" },
    });
    console.log(
      chalkBlue(
        PF + " | CAT AUTO USERS LEFT: " + statsObj.user.categoryAuto.left
      )
    );

    statsObj.user.categoryAuto.right = await countDocuments({
      documentType: "users",
      query: { categoryAuto: "right" },
    });
    console.log(
      chalkBlue(
        PF + " | CAT AUTO USERS RIGHT: " + statsObj.user.categoryAuto.right
      )
    );

    statsObj.user.categoryAuto.neutral = await countDocuments({
      documentType: "users",
      query: { categoryAuto: "neutral" },
    });
    console.log(
      chalkBlue(
        PF + " | CAT AUTO USERS NEUTRAL: " + statsObj.user.categoryAuto.neutral
      )
    );

    statsObj.user.uncategorizedAuto = await countDocuments({
      documentType: "users",
      query: { categoryAuto: "none" },
    });
    console.log(
      chalkBlue(PF + " | UNCAT AUTO USERS: " + statsObj.user.uncategorizedAuto)
    );

    // -----

    statsObj.user.mismatched = await countDocuments({
      documentType: "users",
      query: { categoryMismatch: true },
    });
    console.log(
      chalkBlue(PF + " | MISMATCHED USERS: " + statsObj.user.mismatched)
    );

    // -----

    for (const user of threeceeAuthorizedUsers) {
      let queryPath = `categorizedBy.users.${user}.category`;
      let query = {};
      query[queryPath] = { $nin: [null, false] };

      statsObj.user.categorizedBy[user].total = await countDocuments({
        documentType: "users",
        query: query,
      });

      console.log(
        chalkBlue(
          `${PF} | USERS CATEGORIZED BY @${user}: ${statsObj.user.categorizedBy[user].total}`
        )
      );

      // ---

      queryPath = `categorizedBy.users.${user}.timeStamp`;
      query = {};
      query[queryPath] = { $gte: startToday, $lte: endToday };

      statsObj.user.categorizedBy[user].today = await countDocuments({
        documentType: "users",
        query: query,
      });
      console.log(
        chalkBlue(
          `${PF} | USERS CATEGORIZED TODAY BY @${user}: ${statsObj.user.categorizedBy[user].today}`
        )
      );

      // ---

      query = {};
      query[queryPath] = { $gte: startPeriod, $lte: endPeriod };

      statsObj.user.categorizedBy[user].periodCurrent = await countDocuments({
        documentType: "users",
        query: query,
      });

      console.log(
        chalkBlue(
          `${PF} | USERS CATEGORIZED THIS WEEK BY @${user}: ${statsObj.user.categorizedBy[user].periodCurrent}`
        )
      );

      // ---

      query = {};
      query[queryPath] = { $gte: startPeriodLast, $lte: endPeriodLast };

      statsObj.user.categorizedBy[user].periodLast = await countDocuments({
        documentType: "users",
        query: query,
      });

      console.log(
        chalkBlue(
          `${PF} | USERS CATEGORIZED LAST WEEK BY @${user}: ${statsObj.user.categorizedBy[user].periodLast}`
        )
      );
    }

    return;
  } catch (err) {
    console.error(
      chalkError(`${MODULE_ID_PREFIX} | *** updateUserCounts ERROR: ${err}`)
    );
    return;
  }
}

async function updateHashtagCounts() {
  if (updateHashtagCountsRunning) {
    return;
  }

  setUpdateHashtagCountsTimeout();

  statsObj.hashtag.total = await countDocuments({ documentType: "hashtags" });

  console.log(
    chalkBlue(PF + " | GRAND TOTAL HASHTAGS: " + statsObj.hashtag.total)
  );

  statsObj.hashtag.ignored = await countDocuments({
    documentType: "hashtags",
    query: { ignored: true },
  });
  console.log(
    chalkBlue(PF + " | IGNORED HASHTAGS: " + statsObj.hashtag.ignored)
  );

  // -----

  statsObj.hashtag.categorizedManual = await countDocuments({
    documentType: "hashtags",
    query: { category: { $in: ["left", "neutral", "right"] } },
    // query: { categorized: true },
  });
  console.log(
    chalkBlue(
      PF + " | CAT MANUAL HASHTAGS: " + statsObj.hashtag.categorizedManual
    )
  );

  statsObj.hashtag.category.left = await countDocuments({
    documentType: "hashtags",
    query: { category: "left" },
  });
  console.log(
    chalkBlue(
      PF + " | CAT MANUAL HASHTAGS LEFT: " + statsObj.hashtag.category.left
    )
  );

  statsObj.hashtag.category.right = await countDocuments({
    documentType: "hashtags",
    query: { category: "right" },
  });
  console.log(
    chalkBlue(
      PF + " | CAT MANUAL HASHTAGS RIGHT: " + statsObj.hashtag.category.right
    )
  );

  statsObj.hashtag.category.neutral = await countDocuments({
    documentType: "hashtags",
    query: { category: "neutral" },
  });
  console.log(
    chalkBlue(
      PF +
        " | CAT MANUAL HASHTAGS NEUTRAL: " +
        statsObj.hashtag.category.neutral
    )
  );

  // -----

  statsObj.hashtag.uncategorized.all = await countDocuments({
    documentType: "hashtags",
    query: { category: "none" },
  });
  console.log(
    chalkBlue(
      PF + " | UNCAT MANUAL HASHTAGS: " + statsObj.hashtag.uncategorized.all
    )
  );

  return;
}

function cursorDataHandler(user) {
  return new Promise(function (resolve, reject) {
    if (!categorizedArray.includes(user.category)) {
      return resolve();
    }

    global.wordAssoDb.Uncat.deleteOne({ nodeId: user.nodeId })
      .then(function () {
        uncategorizeableUserSet.delete(user.nodeId);

        categorizedUserHashMap.set(
          user.nodeId,
          pick(user, userCategoryHashmapPickArray)
        );

        statsObj.user.processed += 1;

        if (statsObj.user.processed % 5000 === 0) {
          console.log(
            chalkLog(
              PF +
                " | USER SETS | " +
                statsObj.user.processed +
                " USERS PROCESSED"
            )
          );
        }

        resolve();
      })
      .catch(function (err) {
        return reject(err);
      });
  });
}

function hashtagCursorDataHandler(hashtag) {
  return new Promise(function (resolve, reject) {
    if (
      hashtag.mentions === undefined ||
      hashtag.lastSeen === undefined ||
      hashtag.createdAt === undefined
    ) {
      console.log(
        chalkAlert(
          MODULE_ID_PREFIX +
            " | !!! HT UNDEFINED PROPS | " +
            printHashtag({ hashtag: hashtag })
        )
      );

      hashtag.category = hashtag.category || "none";
      hashtag.mentions = hashtag.mentions || 0;
      hashtag.lastSeen = hashtag.lastSeen || Date.now();
      hashtag.createdAt = hashtag.createdAt || Date.now();

      delete hashtag._id;
      delete hashtag.keywords;
      delete hashtag.keywordsAuto;

      hashtag.text = hashtag.nodeId;

      global.wordAssoDb.Hashtag.findOneAndUpdate(
        { nodeId: hashtag.nodeId },
        hashtag,
        { upsert: true, new: true, lean: true }
      )
        .then()
        .catch(function (err) {
          return reject(err);
        });
    }

    if (isCategorized(hashtag)) {
      categorizedHashtagHashMap.set(hashtag.nodeId, {
        nodeId: hashtag.nodeId,
        text: hashtag.nodeId,
        category: hashtag.category,
        categoryAuto: "none",
      });
    } else if (
      hashtag.mentions !== undefined &&
      hashtag.mentions < configuration.minMentionsHashtags &&
      hashtag.lastSeen !== undefined &&
      // && !isCategorized(hashtag)
      moment().isAfter(
        moment(hashtag.lastSeen).add(
          configuration.maxLastSeenDaysHashtags,
          "days"
        )
      )
    ) {
      console.log(
        chalkAlert(
          PF +
            " | HASHTAG SETS | XXX DELETE OLD HT" +
            " | CR: " +
            moment(hashtag.createdAt).format(compactDateTimeFormat) +
            " | LS: " +
            moment(hashtag.lastSeen).format(compactDateTimeFormat) +
            " | Ms: " +
            hashtag.mentions +
            " | #" +
            hashtag.nodeId
        )
      );

      global.wordAssoDb.Hashtag.deleteOne({ nodeId: hashtag.nodeId })
        .then()
        .catch(function (err) {
          return reject(err);
        });
    }

    statsObj.hashtagsProcessed += 1;

    if (statsObj.hashtagsProcessed % 10000 === 0) {
      console.log(
        chalkLog(
          PF +
            " | HASHTAG SETS | " +
            statsObj.hashtagsProcessed +
            " HASHTAGS PROCESSED"
        )
      );
    }

    resolve();
  });
}

let updateUserSetsRunning = false;

async function updateUserSets(p) {
  statsObj.status = "UPDATE USER SETS";

  console.log(chalkInfo(PF + " | UPDATING USER SETS..."));

  if (updateUserSetsRunning) {
    return;
  }

  updateUserSetsRunning = true;

  const params = p || {};

  params.query = params.query || {
    $or: [
      { category: { $in: ["left", "neutral", "right"] } },
      { categoryAuto: { $in: ["left", "neutral", "right"] } },
    ],
  };
  // params.query = params.query || { $or: [{ categorized: true }, { categorizedAuto: true }] };

  userSearchCursor = global.wordAssoDb.User.find(params.query)
    .select({
      bannerImageUrl: 1,
      profileImageUrl: 1,
      categorizeNetwork: 1,
      category: 1,
      categoryAuto: 1,
      categoryVerified: 1,
      nodeId: 1,
      screenName: 1,
      statusesCount: 1,
      ageDays: 1,
      lastSeen: 1,
      createdAt: 1,
      followersCount: 1,
      friendsCount: 1,
      mentions: 1,
      tweetsPerDay: 1,
    })
    .lean()
    .cursor({ batchSize: configuration.cursorBatchSize });

  const cursorStartTime = moment().valueOf();

  statsObj.user.processed = 0;

  userSearchCursor.on("end", function () {
    console.log(
      chalkBlue(
        PF +
          " | END FOLLOWING CURSOR" +
          " | " +
          getTimeStamp() +
          " | FOLLOWING USER SET | RUN TIME: " +
          msToTime(moment().valueOf() - cursorStartTime)
      )
    );
    console.log(chalkLog(PF + " | USER DB STATS\n" + jsonPrint(statsObj.user)));
  });

  userSearchCursor.on("error", function (err) {
    console.log(chalkError(PF + " | *** ERROR userSearchCursor: " + err));
    console.log(
      chalkAlert(PF + " | USER DB STATS\n" + jsonPrint(statsObj.user))
    );
  });

  userSearchCursor.on("close", async function () {
    console.log(chalkBlue(PF + " | CLOSE FOLLOWING CURSOR"));
    console.log(
      chalkBlue(PF + " | USER DB STATS\n" + jsonPrint(statsObj.user))
    );
  });

  await userSearchCursor.eachAsync(
    async function (user) {
      await cursorDataHandler(user);
    },
    { parallel: 64 }
  );

  updateUserSetsRunning = false;
  updateUserCounts();
  return;
}

let updateUserSetsInterval;

async function initUpdateUserSetsInterval(p) {
  console.log(chalkInfo(PF + " | INIT UPDATE USER SETS INTERVAL ..."));

  const params = p || {};

  const interval = params.interval || configuration.updateUserSetsInterval;

  try {
    await updateUserSets();
  } catch (e) {
    console.log(chalkError(`${PF} | *** INIT USER SETS INTERVAL ERROR: ${e}`));
  }

  clearInterval(updateUserSetsInterval);

  updateUserSetsInterval = setInterval(async () => {
    try {
      await updateUserSets();
    } catch (e) {
      console.log(chalkError(`${PF} | *** UPDATE USER SETS ERROR: ${e}`));
    }
  }, interval);

  return;
}

let updateHashtagSetsRunning = false;

async function updateHashtagSets(p) {
  statsObj.status = "UPDATE HASHTAG SETS";

  console.log(chalkInfo(PF + " | UPDATING HASHTAG SETS..."));

  if (updateHashtagSetsRunning) {
    console.log(chalkAlert(PF + " | SKIP updateHashtagSets: RUNNING..."));
    return;
  }

  updateHashtagSetsRunning = true;

  const params = p || {};

  params.query = params.query || {
    category: { $in: ["left", "neutral", "right"] },
  };

  updateHashtagCounts();

  hashtagSearchCursor = global.wordAssoDb.Hashtag.find(params.query)
    .lean()
    .cursor({ batchSize: configuration.cursorBatchSize });

  const cursorStartTime = moment().valueOf();

  statsObj.hashtagsProcessed = 0;

  hashtagSearchCursor.on("end", function () {
    console.log(
      chalkBlue(
        PF +
          " | END FOLLOWING CURSOR" +
          " | " +
          getTimeStamp() +
          " | FOLLOWING HASHTAG SET | RUN TIME: " +
          msToTime(moment().valueOf() - cursorStartTime)
      )
    );
    console.log(
      chalkLog(PF + " | HASHTAG DB STATS\n" + jsonPrint(statsObj.hashtag))
    );
    updateHashtagSetsRunning = false;
  });

  hashtagSearchCursor.on("error", function (err) {
    console.log(chalkError(PF + " | *** ERROR hashtagSearchCursor: " + err));
    console.log(
      chalkAlert(PF + " | HASHTAG DB STATS\n" + jsonPrint(statsObj.hashtag))
    );
  });

  hashtagSearchCursor.on("close", function () {
    console.log(chalkBlue(PF + " | CLOSE FOLLOWING CURSOR"));
    console.log(
      chalkBlue(PF + " | HASHTAG DB STATS\n" + jsonPrint(statsObj.hashtag))
    );
    updateHashtagSetsRunning = false;
  });

  await hashtagSearchCursor.eachAsync(
    async function (hashtag) {
      await hashtagCursorDataHandler(hashtag);
    },
    { parallel: 32 }
  );

  updateHashtagSetsRunning = false;
  return;
}

let updateHashtagSetsInterval;

async function initUpdateHashtagSetsInterval(p) {
  console.log(chalkInfo(PF + " | INIT UPDATE HASHTAG SETS INTERVAL ..."));

  const params = p || {};

  const interval = params.interval || configuration.updateHashtagSetsInterval;

  await updateHashtagSets();

  clearInterval(updateHashtagSetsInterval);

  updateHashtagSetsInterval = setInterval(() => {
    updateHashtagSets();
  }, interval);

  return;
}

function printBotStats(params) {
  if (statsObj.traffic.users.bots % params.modulo === 0) {
    console.log(
      chalkBot(
        PF +
          " | BOT" +
          " [ " +
          statsObj.traffic.users.bots +
          "/" +
          statsObj.traffic.users.total +
          " | " +
          statsObj.traffic.users.percentBots.toFixed(2) +
          "% ]" +
          "\n" +
          PF +
          " | BOT | " +
          printUser({ user: params.user })
      )
    );
  }
}

const publishMessageCategorize = {};
publishMessageCategorize.publishName = "node-autocategorize";
publishMessageCategorize.message = {};
publishMessageCategorize.message.requestId = "";
publishMessageCategorize.message.node = {};

const nodeSetPropsQueue = [];
let nodeSetPropsQueueInterval;
let nodeSetPropsQueueReady = true;

function initNodeSetPropsQueueInterval(interval) {
  return new Promise(function (resolve) {
    console.log(
      chalk.bold.black(
        PF + " | INIT NODE SET PROPS QUEUE INTERVAL: " + interval + " MS"
      )
    );

    clearInterval(nodeSetPropsQueueInterval);

    nodeSetPropsQueueReady = true;

    nodeSetPropsQueueInterval = setInterval(async function () {
      try {
        if (nodeSetPropsQueueReady && nodeSetPropsQueue.length > 0) {
          nodeSetPropsQueueReady = false;
          const nspObj = nodeSetPropsQueue.shift();

          if (
            configuration.verbose ||
            (nodeSetPropsQueue.length > 0 &&
              nodeSetPropsQueue.length % 100 === 0)
          ) {
            console.log(
              chalkLog(PF + " | NODE SET PROPS Q: " + nodeSetPropsQueue.length)
            );
          }

          await nodeSetProps(nspObj);
          nodeSetPropsQueueReady = true;
        }
      } catch (err) {
        nodeSetPropsQueueReady = true;
        console.trace(
          chalkError(PF + " | *** NODE SET PROPS QUEUE ERROR: " + err)
        );
      }
    }, interval);

    resolve();
  });
}

async function uncatDbCheck(params) {
  statsObj.user.dbUncat = await global.wordAssoDb.Uncat.estimatedDocumentCount();

  let dbUncat = await global.wordAssoDb.Uncat.findOne({
    nodeId: params.node.nodeId,
  }).lean();

  if (!dbUncat || dbUncat === undefined) {
    debug(
      chalk.yellow(
        PF +
          " | --- MISS | UNCAT" +
          " [" +
          statsObj.user.dbUncat +
          "]" +
          " | NID: " +
          params.node.nodeId +
          " | @" +
          params.node.screenName +
          " | CV: " +
          formatBoolean(params.node.categoryVerified) +
          " | CN: " +
          params.node.categorizeNetwork +
          " | M: " +
          formatCategory(params.node.category) +
          " | A: " +
          formatCategory(params.node.categoryAuto)
      )
    );

    dbUncat = new global.wordAssoDb.Uncat(params.node);
    await dbUncat.save();
    return;
  }

  debug(
    chalkBlue(
      PF +
        " | +++ HIT  | UNCAT" +
        " [" +
        statsObj.user.dbUncat +
        "]" +
        " | NID: " +
        dbUncat.nodeId +
        " | TS: " +
        getTimeStamp(dbUncat.lastSeen)
    )
  );

  return dbUncat;
}

function initTransmitNodeQueueInterval(interval) {
  return new Promise(function (resolve) {
    console.log(
      chalk.bold.black(
        PF + " | INIT TRANSMIT NODE QUEUE INTERVAL: " + msToTime(interval)
      )
    );

    clearInterval(transmitNodeQueueInterval);

    let node;
    let categorizeable;
    let uncatObj;
    // let nodeSmall;
    let nCacheObj;

    transmitNodeQueueInterval = setInterval(async function () {
      try {
        if (!transmitNodeQueueReady || transmitNodeQueue.length == 0) {
          return;
        }

        transmitNodeQueueReady = false;

        node = transmitNodeQueue.shift();

        if (!node) {
          console.log(
            chalkError(new Error("transmitNodeQueue: NULL NODE OBJ DE-Q"))
          );
          transmitNodeQueueReady = true;
          return;
        }

        node.updateLastSeen = true;

        if (node.nodeType !== "tweet" && empty(node.category)) {
          node.category = "none";
        }

        if (node.nodeType !== "tweet" && empty(node.categoryAuto)) {
          node.categoryAuto = "none";
        }

        if (node.nodeType !== "tweet" && empty(node.categoryVerified)) {
          node.categoryVerified = false;
        }

        // ??? PERFORMANCE: may parallelize checkCategory + updateNodeMeter + userCategorizeable

        if (node.nodeType === "user" || node.nodeType === "hashtag") {
          node = await checkCategory(node);
        }

        if (node.nodeType === "user") {
          categorizeable = await userCategorizeable({ node: node });

          if (categorizeable) {
            uncategorizeableUserSet.delete(node.nodeId);

            node = await updateNodeMeter(node);

            if (hostname === configuration.databaseHost) {
              uncatObj = await uncatDbCheck({ node: node });

              if (uncatObj === undefined) {
                nodeSetPropsQueue.push({
                  createNodeOnMiss: true,
                  node: pick(node, fieldsTransmitKeys),
                  props: { screenName: node.screenName.toLowerCase() },
                  autoCategorize: true,
                });
              }
            }

            nCacheObj = nodeCache.get(node.nodeId);

            if (nCacheObj !== undefined) {
              node.mentions = Math.max(node.mentions, nCacheObj.mentions);
              nodeCache.set(node.nodeId, node);
            }

            if (node.isTweeter) {
              node.updateLastSeen = true;
              statsObj.traffic.users.total += 1;
            }

            try {
              if (node.status && node.status.created_at) {
                node.ageDays =
                  moment(node.status.created_at, twitterDateFormat).diff(
                    node.createdAt
                  ) / ONE_DAY;
              } else {
                node.ageDays = moment().diff(node.createdAt) / ONE_DAY;
              }

              node.tweetsPerDay =
                node.ageDays > 0 ? node.statusesCount / node.ageDays : 0;

              viewNameSpace.volatile.emit(
                "node",
                pick(node, fieldsTransmitKeys)
              );

              transmitNodeQueueReady = true;

              return;
            } catch (e) {
              console.log(
                chalkError(PF + " | findOneAndUpdate USER ERROR" + jsonPrint(e))
              );

              if (node.screenName === undefined || node.screenName === "") {
                console.log(
                  chalkError(PF + " | *** TRANSMIT USER SCREENNAME UNDEFINED")
                );
                printUserObj(
                  PF + " | *** TRANSMIT USER SCREENNAME UNDEFINED",
                  node
                );
                transmitNodeQueueReady = true;
                return;
              }

              viewNameSpace.volatile.emit(
                "node",
                pick(node, fieldsTransmitKeys)
              );

              transmitNodeQueueReady = true;

              return;
            }
          }

          transmitNodeQueueReady = true;
          return;
        }

        if (node.nodeType == "hashtag") {
          try {
            node = await updateNodeMeter(node);

            let dbHashtag = await global.wordAssoDb.Hashtag.findOne({
              nodeId: node.nodeId,
            });

            if (!dbHashtag || dbHashtag === undefined) {
              dbHashtag = new global.wordAssoDb.Hashtag(node);
            }

            dbHashtag.lastSeen = Date.now();
            dbHashtag.rate = node.rate;
            dbHashtag.text = node.nodeId;
            dbHashtag.mentions = node.mentions
              ? Math.max(node.mentions, dbHashtag.mentions)
              : 1;

            const nCacheObj = nodeCache.get(node.nodeId);

            if (nCacheObj !== undefined) {
              dbHashtag.mentions = Math.max(
                dbHashtag.mentions,
                nCacheObj.mentions
              );
              nodeCache.set(dbHashtag.nodeId, dbHashtag);
            }

            await dbHashtag.save();

            viewNameSpace.volatile.emit(
              "node",
              pick(dbHashtag, fieldsTransmitKeys)
            );

            transmitNodeQueueReady = true;

            return;
          } catch (e) {
            console.log(
              chalkError(PF + " | findOneAndUpdate HT ERROR\n" + jsonPrint(e))
            );

            viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));
            transmitNodeQueueReady = true;

            return;
          }
        }

        if (node.nodeType == "tweet") {
          try {
            viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));
            transmitNodeQueueReady = true;
            return;
          } catch (e) {
            console.log(
              chalkError(PF + " | findOneAndUpdate HT ERROR\n" + jsonPrint(e))
            );
            viewNameSpace.volatile.emit("node", pick(node, fieldsTransmitKeys));
            transmitNodeQueueReady = true;
            return;
          }
        }

        viewNameSpace.volatile.emit("node", node);
        transmitNodeQueueReady = true;
      } catch (err) {
        transmitNodeQueueReady = true;
        console.trace(
          chalkError(PF + " | *** TRANSMIT NODE QUEUE ERROR: " + err)
        );
      }
    }, interval);

    resolve();
  });
}

async function transmitNodes(tw) {
  if (
    !tw.user ||
    tw.user.screenName === undefined ||
    ignoredUserSet.has(tw.user.nodeId) ||
    ignoredUserSet.has(tw.user.userId) ||
    ignoredUserSet.has(tw.user.screenName.toLowerCase())
  ) {
    return;
  }

  if (botNodeIdSet.has(tw.user.nodeId)) {
    tw.user.isBot = true;
    statsObj.traffic.users.bots += 1;
    statsObj.traffic.users.percentBots =
      100 * (statsObj.traffic.users.bots / statsObj.traffic.users.total);
    printBotStats({ user: tw.user, modulo: 100 });
  }

  const tweetNode = {
    nodeType: "tweet",
    nodeId: tw.tweetId,
    user: {
      nodeId: tw.user.nodeId,
      screenName: tw.user.screenName.toLowerCase(),
    },
    tweeterId: tw.user.nodeId,
    retweetCount: 0,
    quotedId: false,
    quoteCount: 0,
    replyCount: 0,
    favoriteCount: 0,
    userMentions: [],
    hashtags: [],
  };

  tw.user.isTweeter = true;
  transmitNodeQueue.push(tw.user);

  for (const user of tw.userMentions) {
    if (
      user &&
      configuration.enableTransmitUser &&
      user.screenName !== undefined &&
      !ignoredUserSet.has(user.nodeId) &&
      !ignoredUserSet.has(user.screenName.toLowerCase())
    ) {
      user.isTweeter = false;
      if (botNodeIdSet.has(user.nodeId)) {
        user.isBot = true;
        statsObj.traffic.users.bots += 1;
        statsObj.traffic.users.percentBots =
          100 * (statsObj.traffic.users.bots / statsObj.traffic.users.total);
        printBotStats({ user: tw.user, modulo: 100 });
      }
      tweetNode.userMentions.push(user.nodeId);
      transmitNodeQueue.push(user);
    }
  }

  for (const hashtagId of tw.hashtags) {
    if (
      hashtagId &&
      configuration.enableTransmitHashtag &&
      !ignoredHashtagSet.has(hashtagId) &&
      !ignoredHashtagRegex.test(hashtagId)
    ) {
      tweetNode.hashtags.push(hashtagId);
      transmitNodeQueue.push({ nodeType: "hashtag", nodeId: hashtagId });
    }
  }

  transmitNodeQueue.push(tweetNode);

  return;
}

function logHeartbeat() {
  console.log(
    chalkLog(
      PF +
        " | HB " +
        statsObj.heartbeat.sent +
        " | " +
        getTimeStamp() +
        " | ST: " +
        getTimeStamp(parseInt(statsObj.startTime)) +
        " | UP: " +
        msToTime(statsObj.upTime) +
        " | RN: " +
        msToTime(statsObj.runTime)
    )
  );
}

function initAppRouting(callback) {
  console.log(chalkInfo(PF + " | " + getTimeStamp() + " | INIT APP ROUTING"));

  let domainName;

  app.use(methodOverride());

  app.use(async function requestLog(req, res, next) {
    if (req.path == "/json") {
      if (!ignoreIpSet.has(req.ip)) {
        console.log(
          chalkInfo(
            PF +
              " | R< REJECT: /json" +
              " | " +
              getTimeStamp() +
              " | IP: " +
              req.ip +
              " | HOST: " +
              req.hostname +
              " | METHOD: " +
              req.method +
              " | PATH: " +
              req.path
          )
        );
        ignoreIpSet.add(req.ip);
      }
      res.sendStatus(404);
    } else if (req.path == "callbacks/addsub") {
      console.log(chalkAlert(PF + " | R< TWITTER WEB HOOK | callbacks/addsub"));

      console.log(
        chalkAlert(
          PF +
            " | R< callbacks/addsub" +
            "\nreq.query\n" +
            jsonPrint(req.query) +
            "\nreq.params\n" +
            jsonPrint(req.params) +
            "\nreq.body\n" +
            jsonPrint(req.body)
        )
      );
    } else if (req.path == "callbacks/removesub") {
      console.log(
        chalkAlert(PF + " | R< TWITTER WEB HOOK | callbacks/removesub")
      );

      console.log(
        chalkAlert(
          PF +
            " | R< callbacks/removesub" +
            "\nreq.query\n" +
            jsonPrint(req.query) +
            "\nreq.params\n" +
            jsonPrint(req.params) +
            "\nreq.body\n" +
            jsonPrint(req.body)
        )
      );
    } else if (req.path == TWITTER_WEBHOOK_URL) {
      console.log(
        chalkAlert(
          PF +
            " | R< TWITTER WEB HOOK | " +
            TWITTER_WEBHOOK_URL +
            " | " +
            getTimeStamp() +
            " | IP: " +
            req.ip +
            " | HOST: " +
            req.hostname +
            " | METHOD: " +
            req.method +
            " | PATH: " +
            req.path +
            " | ERROR: " +
            req.error
        )
      );

      if (req.method == "GET") {
        const crc_token = req.query.crc_token;

        if (crc_token) {
          console.log(
            chalkAlert(PF + " | R< TWITTER WEB HOOK | CRC TOKEN: " + crc_token)
          );

          const hmac = crypto
            .createHmac("sha256", threeceeConfig.consumer_secret)
            .update(crc_token)
            .digest("base64");

          console.log(
            chalkAlert(
              PF + " | T> TWITTER WEB HOOK | CRC TOKEN > HASH: " + hmac
            )
          );
          res.status(200);
          res.send({ response_token: "sha256=" + hmac });
        } else {
          res.status(400);
          res.send("Error: crc_token missing from request.");
        }
      } else {
        // ACCOUNT EVENTS

        const followEvents = req.body.follow_events;

        if (followEvents && followEvents[0].type == "follow") {
          console.log(
            chalkAlert(
              PF +
                " | >>> TWITTER USER FOLLOW EVENT" +
                " | SOURCE: @" +
                followEvents[0].source.screen_name +
                " | TARGET: @" +
                followEvents[0].target.screen_name
            )
          );

          const user = {
            nodeId: followEvents[0].target.id.toString(),
            userId: followEvents[0].target.id.toString(),
            screenName: followEvents[0].target.screen_name,
          };

          await nodeSetProps({
            createNodeOnMiss: true,
            node: user,
            props: { following: true },
          });
        }

        if (followEvents && followEvents[0].type == "unfollow") {
          console.log(
            chalkAlert(
              PF +
                " | >>> TWITTER USER UNFOLLOW EVENT" +
                " | SOURCE: @" +
                followEvents[0].source.screen_name +
                " | TARGET: @" +
                followEvents[0].target.screen_name
            )
          );

          const user = {
            nodeId: followEvents[0].target.id.toString(),
            userId: followEvents[0].target.id.toString(),
            screenName: followEvents[0].target.screen_name,
          };

          await nodeSetProps({ node: user, props: { following: false } });
        }

        res.sendStatus(200);
      }
    } else if (req.path == "/googleccd19766bea2dfd2.html") {
      console.log(chalk.green(PF + " | R< googleccd19766bea2dfd2.html"));

      const googleVerification = path.join(
        __dirname,
        "/googleccd19766bea2dfd2.html"
      );

      res.sendFile(googleVerification, function googleVerify(err) {
        if (err) {
          console.log(
            chalkError(
              PF +
                " | GET /googleccd19766bea2dfd2.html ERROR:" +
                " | " +
                getTimeStamp() +
                " | " +
                req.url +
                " | " +
                googleVerification +
                " | " +
                err
            )
          );
        } else {
          console.log(chalkInfo(PF + " | SENT:", googleVerification));
        }
      });
    } else if (req.path == "/") {
      console.log(chalkLog(PF + " | R< REDIRECT /session"));
      res.redirect("/session");
    } else if (
      req.path == "/profiles.js" ||
      req.path == "/session.js" ||
      req.path.includes("/customizer/build") ||
      req.path.includes("/overlay/build") ||
      req.path == "/js/libs/controlPanel.js"
    ) {
      const fullPath = path.join(__dirname, req.path);
      const defaultSource =
        hostname == "google" ? "PRODUCTION_SOURCE" : "LOCAL_SOURCE";

      console.log(
        chalkAlert(
          PF +
            " | !!! REPLACE DEFAULT SOURCE" +
            " | REQ: " +
            req.path +
            " | PATH: " +
            fullPath +
            " | SOURCE: " +
            defaultSource
        )
      );

      fs.readFile(fullPath, "utf8", function (err, data) {
        if (err) {
          console.log(
            chalkError(PF + " | fs readFile " + fullPath + " ERROR: " + err)
          );
          res.sendStatus(404);
        } else {
          console.log(
            chalkInfo(
              PF +
                " | " +
                getTimeStamp() +
                PF +
                " | T> | FILE" +
                " | " +
                fullPath
            )
          );

          const newFile = data.replace(/REPLACE_SOURCE/g, defaultSource);

          res.send(newFile);
        }
      });
    } else {
      try {
        domainName = await dnsReverse({ ipAddress: req.ip });
      } catch (err) {
        console.log(chalkError(PF + " | *** initAppRouting DNS ERROR: " + err));
      }

      console.log(
        chalkInfo(
          PF +
            " | R<" +
            " | " +
            getTimeStamp() +
            " | IP: " +
            req.ip +
            " | DOMAIN: " +
            domainName +
            " | HOST: " +
            req.hostname +
            " | METHOD: " +
            req.method +
            " | PATH: " +
            req.path
        )
      );

      if (req.path.includes("controlPanel")) {
        slackText = "*LOADING PAGE | CONTROL PANEL*";
        slackText = slackText + "\nIP: " + req.ip;
        slackText = slackText + "\nDOMAIN: " + domainName;
        slackText = slackText + "\nURL: " + req.url;
        slackText = slackText + "\nFILE: " + adminHtml;
        await slackSendWebMessage({
          channel: slackChannelAdmin,
          text: slackText,
        });
      }

      next();
    }
  });

  app.use(express.static(path.join(__dirname, "/")));
  app.use(express.static(path.join(__dirname, "/js")));
  app.use(express.static(path.join(__dirname, "/css")));
  app.use(express.static(path.join(__dirname, "/public/assets/images")));

  app.use(express.static(path.join(__dirname, "/categorizer")));
  app.use(express.static(path.join(__dirname, "/categorizer/static/js")));
  app.use(express.static(path.join(__dirname, "/categorizer/static/css")));
  app.use(express.static(path.join(__dirname, "/categorizer/static")));
  app.use(express.static(path.join(__dirname, "/categorizer/build")));

  app.use(express.static(path.join(__dirname, "/customizer")));
  app.use(express.static(path.join(__dirname, "/customizer/static/js")));
  app.use(express.static(path.join(__dirname, "/customizer/static/css")));
  app.use(express.static(path.join(__dirname, "/customizer/static")));
  app.use(express.static(path.join(__dirname, "/customizer/build")));

  app.use(express.static(path.join(__dirname, "/overlay")));
  app.use(express.static(path.join(__dirname, "/overlay/static/js")));
  app.use(express.static(path.join(__dirname, "/overlay/static/css")));
  app.use(express.static(path.join(__dirname, "/overlay/static")));
  app.use(express.static(path.join(__dirname, "/overlay/build")));

  app.get("/onload.js", function (req, res) {
    console.log(chalkInfo(PF + " | R< ONLOAD | /onload"));

    const onloadFile = path.join(__dirname, "/onload.js");

    res.sendFile(onloadFile, function (err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /onload ERROR:" +
              " | " +
              getTimeStamp() +
              " | IP: " +
              req.ip +
              " | " +
              req.url +
              " | " +
              onloadFile +
              " | " +
              err
          )
        );
      }
    });
  });

  app.get("/categorize/user/:query", async function searchUserById(req, res) {
    console.log(
      chalkLog(PF + " | R< SEARCH | USER | QUERY: " + req.params.query)
    );

    try {
      twitterSearchNode({ searchNode: req.params.query });
      res.sendStatus(200);
    } catch (e) {
      console.log(
        chalkError(
          PF + " | R< SEARCH | *** USER ERROR | QUERY: " + req.params.query
        )
      );
      console.log(chalkError(PF + " | R< SEARCH | *** USER ERROR: " + e));
      res.sendStatus(500);
    }
  });

  app.get(
    "/categorize/hashtag/:query",
    async function searchHashtagById(req, res) {
      console.log(
        chalkLog(PF + " | R< SEARCH | HASHTAG | QUERY: " + req.params.query)
      );

      try {
        twitterSearchNode({ searchNode: req.params.query });
        res.sendStatus(200);
      } catch (e) {
        console.log(
          chalkError(
            PF + " | R< SEARCH | *** HASHTAG ERROR | QUERY: " + req.params.query
          )
        );
        console.log(chalkError(PF + " | R< SEARCH | *** HASHTAG ERROR: " + e));
        res.sendStatus(500);
      }
    }
  );

  app.get("/categorize", async function requestCategorize(req, res) {
    const categorizerHtml = path.join(
      __dirname,
      "/categorizer/build/index.html"
    );

    console.log(chalkLog(PF + " | R< CATEGORIZE"));

    res.sendFile(categorizerHtml, function responseCategorizer(err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /categorize ERROR:" +
              " | " +
              getTimeStamp() +
              " | " +
              req.url +
              " | " +
              categorizerHtml +
              " | " +
              err
          )
        );
      } else {
        console.log(chalkAlert(PF + " | SENT:", categorizerHtml));
      }
    });
  });

  app.get("/stats", async function requestStats(req, res) {
    console.log(chalkLog(PF + " | R< STATS"));

    statsObj.elapsed = msToTime(moment().valueOf() - statsObj.startTime);
    statsObj.timeStamp = getTimeStamp();
    statsObj.twitter.tweetsPerMin = parseInt(tweetMeter.toJSON()[metricsRate]);
    statsObj.nodesPerMin = parseInt(globalNodeMeter.toJSON()[metricsRate]);
    statsObj.nodeCount = parseInt(globalNodeCounter.toJSON());

    if (statsObj.nodesPerMin > statsObj.maxNodesPerMin) {
      statsObj.maxNodesPerMin = statsObj.nodesPerMin;
      statsObj.maxNodesPerMinTime = moment().valueOf();
    }

    if (statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin) {
      statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
      statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
    }

    res.send(statsObj);
  });

  const customizerHtml = path.join(__dirname, "/customizer/build/index.html");

  app.get("/customize", async function requestCustomizer(req, res) {
    console.log(chalkLog(PF + " | R< CUSTOMIZE"));

    res.sendFile(customizerHtml, function responseCustomizer(err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /customize ERROR:" +
              " | " +
              getTimeStamp() +
              " | " +
              req.url +
              " | " +
              customizerHtml +
              " | " +
              err
          )
        );
      } else {
        console.log(chalkAlert(PF + " | SENT:", customizerHtml));
      }
    });
  });

  const adminHtml = path.join(__dirname, "/admin/admin.html");

  app.get("/admin", async function requestAdmin(req, res) {
    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(
        chalkError(PF + " | *** initAppRouting /admin ERROR: " + err)
      );
    }

    console.log(
      chalkLog(
        PF +
          " | LOADING PAGE" +
          " | IP: " +
          req.ip +
          " | DOMAIN: " +
          domainName +
          " | REQ: " +
          req.url +
          " | FILE: " +
          adminHtml
      )
    );

    slackText = "*LOADING PAGE | ADMIN*";
    slackText = slackText + "\nIP: " + req.ip;
    slackText = slackText + "\nURL: " + req.url;
    slackText = slackText + "\nDOMAIN: " + domainName;
    slackText = slackText + "\nFILE: " + adminHtml;

    await slackSendWebMessage({ channel: slackChannelAdmin, text: slackText });

    res.sendFile(adminHtml, function responseAdmin(err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /admin ERROR:" +
              " | " +
              getTimeStamp() +
              " | IP: " +
              req.ip +
              " | " +
              req.url +
              " | " +
              adminHtml +
              " | " +
              err
          )
        );
      }
    });
  });

  const loginHtml = path.join(__dirname, "/login.html");

  app.get("/login", async function requestSession(req, res, next) {
    debug(chalkInfo("get next\n" + next));

    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(
        chalkError(PF + " | *** initAppRouting /login ERROR: " + err)
      );
    }

    console.log(
      chalkAlert(
        PF +
          " | LOADING PAGE | LOGIN" +
          " | IP: " +
          req.ip +
          " | DOMAIN: " +
          domainName +
          " | REQ: " +
          req.url +
          " | RES: " +
          loginHtml
      )
    );

    // slackText = "*LOADING PAGE | TWITTER LOGIN*";
    // slackText = slackText + " | IP: " + req.ip;
    // slackText = slackText + " | DOMAIN: " + domainName;
    // slackText = slackText + " | URL: " + req.url;
    // slackText = slackText + "\nFILE: " + loginHtml;

    // await slackSendWebMessage({ channel: slackChannel, text: slackText });

    res.sendFile(loginHtml, function responseSession(err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /login ERROR:" +
              " | " +
              getTimeStamp() +
              " | " +
              req.url +
              " | " +
              loginHtml +
              " | " +
              err
          )
        );
      } else {
        console.log(chalkAlert(PF + " | SENT:", loginHtml));
      }
    });
  });

  const sessionHtml = path.join(__dirname, "/sessionModular.html");

  app.get("/session", async function requestSession(req, res, next) {
    debug(chalkInfo("get next\n" + next));

    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(
        chalkError(PF + " | *** initAppRouting /session ERROR: " + err)
      );
    }

    console.log(
      chalkLog(
        PF +
          " | LOADING PAGE" +
          " | IP: " +
          req.ip +
          " | DOMAIN: " +
          domainName +
          " | REQ: " +
          req.url +
          " | FILE: " +
          sessionHtml
      )
    );

    // if (configuration.verbose) {
    // slackText = "*LOADING PAGE*";
    // slackText = slackText + "\nIP: " + req.ip;
    // slackText = slackText + "\nDOMAIN: " + domainName;
    // slackText = slackText + "\nURL: " + req.url;
    // slackText = slackText + "\nFILE: " + sessionHtml;

    // await slackSendWebMessage({ channel: slackChannel, text: slackText });
    // }

    res.sendFile(sessionHtml, function responseSession(err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /session ERROR:" +
              " | " +
              getTimeStamp() +
              " | IP: " +
              req.ip +
              " | " +
              req.url +
              " | " +
              sessionHtml +
              " | " +
              err
          )
        );
      } else {
        if (configuration.verbose) {
          console.log(chalkInfo(PF + " | SENT:", sessionHtml));
        }
      }
    });
  });

  const profilesHtml = path.join(__dirname, "/profiles.html");

  app.get("/profiles", async function requestSession(req, res, next) {
    debug(chalkInfo("get next\n" + next));

    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(
        chalkError(PF + " | *** initAppRouting /profiles ERROR: " + err)
      );
    }

    console.log(
      chalkLog(
        PF +
          " | LOADING PAGE" +
          " | IP: " +
          req.ip +
          " | DOMAIN: " +
          domainName +
          " | REQ: " +
          req.url +
          " | FILE: " +
          profilesHtml
      )
    );

    // if (configuration.verbose) {
    //   slackText = "*LOADING PAGE*";
    //   slackText = slackText + "\nIP: " + req.ip;
    //   slackText = slackText + "\nDOMAIN: " + domainName;
    //   slackText = slackText + "\nURL: " + req.url;
    //   slackText = slackText + "\nFILE: " + profilesHtml;

    //   await slackSendWebMessage({ channel: slackChannel, text: slackText });
    // }

    res.sendFile(profilesHtml, function responseSession(err) {
      if (err) {
        console.log(
          chalkError(
            PF +
              " | GET /profiles ERROR:" +
              " | " +
              getTimeStamp() +
              " | IP: " +
              req.ip +
              " | " +
              req.url +
              " | " +
              profilesHtml +
              " | " +
              err
          )
        );
      } else {
        if (configuration.verbose) {
          console.log(chalkInfo(PF + " | SENT:", profilesHtml));
        }
      }
    });
  });

  async function ensureAuthenticated(req, res, next) {
    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(
        chalkError(PF + " | *** ensureAuthenticated DNS REVERSE ERROR: " + err)
      );
    }

    if (req.isAuthenticated()) {
      console.log(chalk.green(PF + " | PASSPORT TWITTER AUTHENTICATED"));

      // slackText = "*PASSPORT TWITTER AUTHENTICATED*";
      // slackText = slackText + "\nIP: " + req.ip;
      // slackText = slackText + "\nDOMAIN: " + domainName;
      // slackText = slackText + "\nURL: " + req.url;
      // slackText = slackText + "\n@" + req.session.passport.user.screenName;

      // await slackSendWebMessage({
      //   channel: slackChannelUserAuth,
      //   text: slackText,
      // });

      return next();
    }

    console.log(
      chalkAlert(PF + " | *** PASSPORT TWITTER *NOT* AUTHENTICATED ***")
    );

    // slackText = "*PASSPORT TWITTER AUTHENTICATION FAILED*";
    // slackText = slackText + "\nIP: " + req.ip;
    // slackText = slackText + "\nDOMAIN: " + domainName;
    // slackText = slackText + "\nURL: " + req.url;
    // slackText = slackText + "\n@" + req.session.passport.user.screenName;

    // await slackSendWebMessage({
    //   channel: slackChannelUserAuth,
    //   text: slackText,
    // });
  }

  app.get("/account", ensureAuthenticated, async function (req, res) {
    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(chalkError(PF + " | *** /account DNS REVERSE ERROR: " + err));
    }

    console.log(
      chalkError(
        PF +
          " | PASSPORT TWITTER AUTH USER\n" +
          jsonPrint(req.session.passport.user)
      )
    ); // handle errors
    console.log(
      chalkError(
        PF +
          " | PASSPORT TWITTER AUTH USER" +
          " | IP: " +
          req.ip +
          " | DOMAIN: " +
          domainName +
          " | @" +
          req.session.passport.user.screenName +
          " | UID" +
          req.session.passport.user.nodeId
      )
    ); // handle errors

    // slackText = "*LOADING PAGE | PASSPORT TWITTER AUTH*";
    // slackText = slackText + "\nIP: " + req.ip;
    // slackText = slackText + "\nDOMAIN: " + domainName;
    // slackText = slackText + "\nURL: " + req.url;
    // slackText = slackText + "\n@" + req.session.passport.user.screenName;

    // await slackSendWebMessage({
    //   channel: slackChannelUserAuth,
    //   text: slackText,
    // });

    userServerController.findOne(
      { user: req.session.passport.user },
      function (err, user) {
        if (err) {
          console.log(
            chalkError(
              PF + " | *** ERROR TWITTER AUTHENTICATION: " + jsonPrint(err)
            )
          ); // handle errors
          res.redirect("/504.html");
        } else if (user) {
          console.log(
            chalk.green(
              PF + " | TWITTER USER AUTHENTICATED: @" + user.screenName
            )
          ); // handle errors
          authenticatedTwitterUserCache.set(user.nodeId, user);
          res.redirect("/after-auth.html");
        } else {
          console.log(
            chalkAlert(
              PF +
                " | *** TWITTER USER AUTHENTICATE FAILED" +
                " | @" +
                req.session.passport.user.screenName +
                " NOT FOUND"
            )
          );
          res.redirect("/504.html");
        }
      }
    );
  });

  app.get("/auth/twitter/error", async function (req) {
    try {
      domainName = await dnsReverse({ ipAddress: req.ip });
    } catch (err) {
      console.log(
        chalkError(PF + " | *** /auth/twitter/error DNS REVERSE ERROR: " + err)
      );
    }

    console.log(chalkAlert(PF + " | PASSPORT AUTH TWITTER ERROR"));

    // slackText = "*LOADING PAGE | PASSPORT AUTH TWITTER ERROR*";
    // slackText = slackText + "\nIP: " + req.ip;
    // slackText = slackText + "\nDOMAIN: " + domainName;
    // slackText = slackText + "\nURL: " + req.url;

    // await slackSendWebMessage({
    //   channel: slackChannelUserAuth,
    //   text: slackText,
    // });
  });

  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  callback(null);
}

function initTwitterRxQueueInterval(interval) {
  return new Promise(function (resolve, reject) {
    console.log(
      chalkLog(PF + " | initTwitterRxQueueInterval | interval: " + interval)
    );

    let tweetRxQueueReady = true;

    const twpMessageObj = { op: "tweet", tweetStatus: {} };

    if (typeof interval != "number") {
      return reject(
        new Error(
          "initTwitterRxQueueInterval interval NOT a NUMBER: " + interval
        )
      );
    }

    console.log(
      chalk.bold.black(
        PF + " | INIT TWITTER RX QUEUE INTERVAL | " + interval + " MS"
      )
    );

    clearInterval(tweetRxQueueInterval);

    tweetRxQueueInterval = setInterval(function tweetRxQueueDequeue() {
      if (tweetRxQueue.length > 0 && tweetParserReady && tweetRxQueueReady) {
        tweetRxQueueReady = false;

        twpMessageObj.tweetStatus = tweetRxQueue.shift();
        twpChild.send(twpMessageObj, function () {
          tweetRxQueueReady = true;
        });
      }
    }, interval);

    resolve();
  });
}

let tweetParserMessageRxQueueReady = true;
let tweetParserMessageRxQueueInterval;

async function initTweetParserMessageRxQueueInterval(interval) {
  if (typeof interval != "number") {
    throw new Error(
      "initTweetParserMessageRxQueueInterval interval NOT a NUMBER: " + interval
    );
  }

  console.log(
    chalk.bold.black(
      PF +
        " | INIT TWEET PARSER MESSAGE RX QUEUE INTERVAL | " +
        msToTime(interval)
    )
  );

  clearInterval(tweetParserMessageRxQueueInterval);

  let tweetParserMessage = {};
  let tweetObj = {};

  const dbUserMessage = {};
  dbUserMessage.op = "TWEET";
  dbUserMessage.tweetObj = {};

  tweetParserMessageRxQueueInterval = setInterval(async function () {
    if (
      tweetParserMessageRxQueue.length > 0 &&
      tweetParserMessageRxQueueReady
    ) {
      tweetParserMessageRxQueueReady = false;

      tweetParserMessage = tweetParserMessageRxQueue.shift();

      if (tweetParserMessage.op == "ERROR") {
        statsObj.errors.twitter.parser += 1;

        console.log(
          chalkError(
            PF +
              " | *** ERROR PARSE TW" +
              " | " +
              getTimeStamp() +
              " | TWEET PARSER ERRORS: " +
              statsObj.errors.twitter.parser +
              " | ERROR: " +
              tweetParserMessage.err
          )
        );

        tweetParserMessageRxQueueReady = true;
      } else if (tweetParserMessage.op == "PARSED_TWEET") {
        tweetObj = tweetParserMessage.tweetObj;

        if (!tweetObj.user) {
          console.log(
            chalkAlert(
              PF +
                " | parsedTweet -- TW USER UNDEFINED" +
                " | " +
                tweetObj.tweetId
            )
          );
          tweetParserMessageRxQueueReady = true;
        } else {
          if (
            dbuChild &&
            dbuChildReady &&
            !uncategorizeableUserSet.has(tweetObj.user.nodeId)
          ) {
            dbUserMessage.tweetObj = tweetObj;
            dbuChild.send(dbUserMessage);
          }

          if (transmitNodeQueue.length <= maxTransmitNodeQueue) {
            try {
              await transmitNodes(tweetObj);
              tweetParserMessageRxQueueReady = true;
            } catch (e) {
              console.log(chalkError(PF + " | *** TX NODES ERROR"));
              console.log(e);
              tweetParserMessageRxQueueReady = true;
            }
          } else {
            tweetParserMessageRxQueueReady = true;
          }
        }
      } else {
        console.log(
          chalkError(
            PF +
              " | *** TWEET PARSER UNKNOWN OP" +
              " | INTERVAL: " +
              tweetParserMessage.op
          )
        );
        tweetParserMessageRxQueueReady = true;
      }
    }
  }, interval);

  return;
}

let sorterMessageRxReady = true;
let sorterMessageRxQueueInterval;

const sortedObjectValues = function (params) {
  return new Promise(function (resolve, reject) {
    const keys = Object.keys(params.obj);

    let objA = {};
    let objB = {};

    const sortedKeys = keys.sort(function (a, b) {
      objA = params.obj[a];
      objB = params.obj[b];
      return objB[params.sortKey] - objA[params.sortKey];
    });

    if (keys.length !== undefined) {
      resolve({
        nodeType: params.nodeType,
        sortKey: params.sortKey,
        sortedKeys: sortedKeys.slice(0, params.max),
      });
    } else {
      reject(
        new Error("ERROR: sortedObjectValues | params:\n" + jsonPrint(params))
      );
    }
  });
};

function initSorterMessageRxQueueInterval(interval) {
  return new Promise(function (resolve) {
    console.log(
      chalk.bold.black(
        PF + " | INIT SORTER RX MESSAGE QUEUE INTERVAL | " + msToTime(interval)
      )
    );

    clearInterval(sorterMessageRxQueueInterval);

    let sortedKeys;
    let endIndex;
    let nodeId;
    let nodeRate;
    let sorterObj;
    let nodeType;

    const maxTopTerms = configuration.maxTopTerms;

    sorterMessageRxQueueInterval = setInterval(
      function sorterMessageRxQueueDequeue() {
        if (sorterMessageRxReady && sorterMessageRxQueue.length > 0) {
          sorterMessageRxReady = false;

          sorterObj = sorterMessageRxQueue.shift();

          nodeType = sorterObj.nodeType;

          switch (sorterObj.op) {
            case "SORTED":
              // debug(chalkLog("SORT ---------------------"));

              sortedKeys = sorterObj.sortedKeys;
              endIndex = Math.min(maxTopTerms, sortedKeys.length);

              async.times(
                endIndex,
                function (index, next) {
                  nodeId = sortedKeys[index].toLowerCase();

                  if (empty(nodeType) || nodeType == "overall") {
                    if (nodeMeter[nodeId]) {
                      nodeRate = parseFloat(
                        nodeMeter[nodeId].toJSON()[metricsRate]
                      );
                      nodesPerMinuteTopTermCache.set(nodeId, nodeRate);
                    }
                  } else {
                    if (nodeMeterType[nodeType][nodeId]) {
                      nodeRate = parseFloat(
                        nodeMeterType[nodeType][nodeId].toJSON()[metricsRate]
                      );
                      nodesPerMinuteTopTermNodeTypeCache[nodeType].set(
                        nodeId,
                        nodeRate
                      );
                    }
                  }
                  next();
                },
                function () {
                  sorterMessageRxReady = true;
                }
              );

              break;

            default:
              console.log(
                chalkError(
                  PF + " | ??? SORTER UNKNOWN OP\n" + jsonPrint(sorterObj)
                )
              );
              sorterMessageRxReady = true;
          }
        }
      },
      interval
    );

    resolve();
  });
}

function keySort(params, callback) {
  // debug(chalkLog("KEY SORT"
  //   + " | KEYS: " + Object.keys(params.obj).length
  // ));

  sortedObjectValues(params)
    .then(function (results) {
      callback(null, results);
    })
    .catch(function (err) {
      callback(err, params);
    });
}

let keySortInterval;
let keySortReady = true;

function initKeySortInterval(interval) {
  return new Promise(function (resolve) {
    console.log(
      chalkInfo(PF + " | INIT KEY SORT INTERVAL: " + msToTime(interval))
    );

    clearInterval(keySortInterval);

    keySortReady = true;

    let keySortParams;

    keySortInterval = setInterval(function () {
      if (keySortReady && keySortQueue.length > 0) {
        keySortReady = false;

        keySortParams = keySortQueue.shift();

        keySort(keySortParams, function (err, results) {
          if (err) {
            console.log(chalkError(PF + " | *** KEY SORT ERROR: " + err));
            keySortReady = true;
          } else {
            sorterMessageRxQueue.push({
              op: "SORTED",
              nodeType: results.nodeType,
              sortKey: results.sortKey,
              sortedKeys: results.sortedKeys,
            });

            keySortReady = true;
          }
        });
      }
    }, interval);

    resolve();
  });
}

function initDbuPingInterval(interval) {
  clearInterval(dbuPingInterval);

  dbuPingSent = false;
  dbuPongReceived = false;

  dbuPingId = moment().valueOf();

  if (dbuChild) {
    dbuPingInterval = setInterval(function () {
      if (!dbuPingSent) {
        dbuPingId = moment().valueOf();

        dbuChild.send({ op: "PING", pingId: dbuPingId }, function (err) {
          dbuPingSent = true;

          if (err) {
            console.log(chalkError(PF + " | *** DBU SEND PING ERROR: " + err));

            killChild({ childId: DEFAULT_DBU_CHILD_ID }, function (err) {
              if (err) {
                console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
                return;
              }
              dbuPongReceived = false;
              initDbuChild({ childId: DEFAULT_DBU_CHILD_ID });
            });

            return;
          }

          console.log(
            chalkInfo(
              PF + " | >PING | DBU | PING ID: " + getTimeStamp(dbuPingId)
            )
          );
        });
      } else if (dbuPingSent && dbuPongReceived) {
        dbuPingId = moment().valueOf();

        dbuPingSent = false;
        dbuPongReceived = false;

        dbuChild.send({ op: "PING", pingId: dbuPingId }, function (err) {
          if (err) {
            console.log(chalkError(PF + " | *** DBU SEND PING ERROR: " + err));

            killChild({ childId: DEFAULT_DBU_CHILD_ID }, function (err) {
              if (err) {
                console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
                return;
              }
              dbuPongReceived = false;
              initDbuChild({ childId: DEFAULT_DBU_CHILD_ID });
            });

            return;
          }

          if (configuration.verbose) {
            console.log(
              chalkInfo(
                PF + " | >PING | DBU | PING ID: " + getTimeStamp(dbuPingId)
              )
            );
          }

          dbuPingSent = true;
        });
      } else {
        console.log(
          chalkAlert(
            PF +
              " | *** PONG TIMEOUT | DBU" +
              " | TIMEOUT: " +
              interval +
              " | NOW: " +
              getTimeStamp() +
              " | PING ID: " +
              getTimeStamp(dbuPingId) +
              " | ELAPSED: " +
              msToTime(moment().valueOf() - dbuPingId)
          )
        );
      }
    }, interval);
  }
}

function initTssPingInterval(interval) {
  clearInterval(tssPingInterval);

  tssPingSent = false;
  tssPongReceived = false;

  tssPingId = moment().valueOf();

  if (tssChild !== undefined) {
    tssPingInterval = setInterval(function () {
      if (!tssPingSent) {
        tssPingId = moment().valueOf();

        tssChild.send({ op: "PING", pingId: tssPingId }, function (err) {
          tssPingSent = true;

          if (err) {
            console.log(chalkError(PF + " | *** TSS SEND PING ERROR: " + err));

            killChild({ childId: DEFAULT_TSS_CHILD_ID }, function (err) {
              if (err) {
                console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
                return;
              }
              tssPongReceived = false;
              initTssChild({
                childId: DEFAULT_TSS_CHILD_ID,
                tweetVersion2: configuration.tweetVersion2,
                threeceeUser: threeceeUser,
              });
            });

            return;
          }

          console.log(
            chalkInfo(
              PF + " | >PING | TSS | PING ID: " + getTimeStamp(tssPingId)
            )
          );
        });
      } else if (tssPingSent && tssPongReceived) {
        tssPingId = moment().valueOf();

        tssPingSent = false;
        tssPongReceived = false;

        tssChild.send({ op: "PING", pingId: tssPingId }, function (err) {
          if (err) {
            console.log(chalkError(PF + " | *** TSS SEND PING ERROR: " + err));

            killChild({ childId: DEFAULT_TSS_CHILD_ID }, function (err) {
              if (err) {
                console.log(chalkError(PF + " | *** KILL CHILD ERROR: " + err));
                return;
              }
              tssPongReceived = false;
              initTssChild({
                childId: DEFAULT_TSS_CHILD_ID,
                tweetVersion2: configuration.tweetVersion2,
                threeceeUser: threeceeUser,
              });
            });

            return;
          }

          if (configuration.verbose) {
            console.log(
              chalkInfo(
                PF + " | >PING | TSS | PING ID: " + getTimeStamp(tssPingId)
              )
            );
          }

          tssPingSent = true;
        });
      } else {
        console.log(
          chalkAlert(
            PF +
              " | *** PONG TIMEOUT | TSS" +
              " | TIMEOUT: " +
              interval +
              " | NOW: " +
              getTimeStamp() +
              " | PING ID: " +
              getTimeStamp(tssPingId) +
              " | ELAPSED: " +
              msToTime(moment().valueOf() - tssPingId)
          )
        );
      }
    }, interval);
  }
}

const initMongoIndexChild = (params) => {
  statsObj.status = "INIT MGI CHILD";

  statsObj.mgiChildReady = false;

  console.log(chalk.bold.black(PF + " | INIT MGI CHILD"));

  return new Promise(function (resolve) {
    const mgi = cp.fork(`${__dirname}/js/libs/mgiChild.js`);

    childrenHashMap[params.childId] = {};
    childrenHashMap[params.childId].pid = mgi.pid;
    childrenHashMap[params.childId].childId = params.childId;
    childrenHashMap[params.childId].title = params.childId;
    childrenHashMap[params.childId].status = "NEW";
    childrenHashMap[params.childId].errors = 0;

    touchChildPidFile({
      childId: params.childId,
      pid: childrenHashMap[params.childId].pid,
    });

    mgi.on("message", async function mgiMessageRx() {});

    mgi.on("error", function mgiError() {});

    mgi.on("exit", function mgiExit() {});

    mgi.on("close", function mgiClose() {});

    resolve();
  });
};

function initTssChild(params) {
  statsObj.status = "INIT TSS CHILD";

  statsObj.tssChildReady = false;

  console.log(chalk.bold.black(PF + " | INIT TSS CHILD\n" + jsonPrint(params)));

  return new Promise(function (resolve) {
    let tss;

    if (params.tweetVersion2) {
      tss = cp.fork(`${__dirname}/js/libs/tssChildLabs.js`);
    } else {
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

    touchChildPidFile({
      childId: params.childId,
      pid: childrenHashMap[params.childId].pid,
    });

    tss.on("message", async function tssMessageRx(m) {
      childrenHashMap[params.childId].status = "RUNNING";

      switch (m.op) {
        case "READY":
          tss.send(
            {
              op: "INIT",
              title: params.childId,
              threeceeUser: params.threeceeUser,
              twitterConfig: threeceeTwitter.twitterConfig,
              interval: configuration.tssInterval,
              filterDuplicateTweets: configuration.filterDuplicateTweets,
              filterRetweets: configuration.filterRetweets,
              testMode: configuration.testMode,
              verbose: configuration.verbose,
            },
            function tssMessageRxError(err) {
              if (err) {
                statsObj.tssChildReady = false;
                console.log(chalkError(PF + " | *** TSS SEND ERROR: " + err));
                console.log(err);
                clearInterval(tssPingInterval);
                childrenHashMap[params.childId].status = "ERROR";
              } else {
                childrenHashMap[params.childId].status = "INIT";
                clearInterval(tssPingInterval);
                setTimeout(function () {
                  initTssPingInterval(TSS_PING_INTERVAL);
                }, 1000);
                statsObj.tssChildReady = true;
              }
            }
          );
          break;

        case "ERROR":
          console.log(
            chalkError(
              PF +
                " | <TSS | ERROR" +
                " | 3C @" +
                m.threeceeUser +
                " | ERROR TYPE: " +
                m.errorType +
                " | ERROR MESSAGE: " +
                m.error.message
              // + "\n" + jsonPrint(m.error)
            )
          );

          if (m.errorType == "TWITTER_UNFOLLOW") {
            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;

            console.log(
              chalkError(
                PF +
                  " | <TSS | ERROR | TWITTER_UNFOLLOW" +
                  " | AUTUO FOLLOW USER: @" +
                  m.threeceeUser +
                  " | ERROR TYPE: " +
                  m.errorType +
                  " | ERROR MESSAGE: " +
                  m.error.message
              )
            );
          } else if (
            m.errorType == "TWITTER_FOLLOW_LIMIT" ||
            m.error.code == 161
          ) {
            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
            threeceeTwitter.twitterAuthorizationErrorFlag = m.error;

            console.log(
              chalkError(
                PF +
                  " | <TSS | ERROR | TWITTER_FOLLOW_LIMIT" +
                  " | AUTUO FOLLOW USER: @" +
                  m.threeceeUser +
                  " | ERROR TYPE: " +
                  m.errorType +
                  " | ERROR MESSAGE: " +
                  m.error.message
              )
            );
          } else if (
            m.errorType == "TWITTER_UNAUTHORIZED" ||
            m.error.statusCode == 401
          ) {
            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
            threeceeTwitter.twitterAuthorizationErrorFlag = m.error;
          } else if (m.errorType == "TWITTER_TOKEN") {
            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
            threeceeTwitter.twitterTokenErrorFlag = m.error;
          } else if (m.errorType == "USER_SUSPENDED") {
            unfollowableUserSet.add(m.userId);

            console.log(
              chalkLog(
                PF +
                  " | XXX TWITTER USER SUSPENDED" +
                  " | UID: " +
                  m.userId +
                  " | @" +
                  m.screenName +
                  " | UNFOLLOWABLE SET SIZE: " +
                  unfollowableUserSet.size
              )
            );
          } else if (m.errorType == "USER_NOT_FOUND") {
            unfollowableUserSet.add(m.userId);

            console.log(
              chalkLog(
                PF +
                  " | XXX TWITTER USER NOT FOUND" +
                  " | UID: " +
                  m.userId +
                  " | @" +
                  m.screenName +
                  " | UNFOLLOWABLE SET SIZE: " +
                  unfollowableUserSet.size
              )
            );
          } else if (m.errorType == "TWITTER_FOLLOW_BLOCK") {
            unfollowableUserSet.add(m.userId);

            console.log(
              chalkLog(
                PF +
                  " | XXX TWITTER FOLLOW BLOCK" +
                  " | UID: " +
                  m.userId +
                  " | @" +
                  m.screenName +
                  " | UNFOLLOWABLE SET SIZE: " +
                  unfollowableUserSet.size
              )
            );
          } else {
            threeceeTwitter.twitterErrors += 1;
            threeceeTwitter.twitterErrorFlag = m.error;
          }
          break;

        case "TWITTER_MESSAGE":
        case "TWITTER_CONNECT":
        case "TWITTER_RECONNECT":
        case "TWITTER_USER_UPDATE":
        case "TWITTER_WARNING":
        case "TWITTER_DIRECT_MESSAGE":
        case "TWITTER_SCRUB_GEO":
        case "TWITTER_STATUS_WITHHELD":
        case "TWITTER_USER_WITHHELD":
        case "TWITTER_FOLLOW":
        case "TWITTER_UNFOLLOW":
        case "TWITTER_LIMIT":
          console.log(
            chalkInfo(
              `${PF} | ${m.op}` +
                ` | ${m.threeceeUser}` +
                ` | MESSAGE: ${m.message || "NONE"}` +
                `\n${PF} | TWITTER STATS\n${jsonPrint(m.stats)}`
            )
          );

          break;

        case "TWITTER_STATS":
          console.log(
            chalkInfo(
              PF +
                " | <TSS | TWITTER STATS" +
                " | 3C @" +
                m.threeceeUser +
                " | FOLLOWING: " +
                m.twitterFollowing
            )
          );

          threeceeTwitter.twitterFollowing = m.twitterFollowing;
          threeceeTwitter.twitterFriends = m.twitterFriends;
          if (m.twitterConfig) {
            threeceeTwitter.twitterConfig = m.twitterConfig;
          }
          break;

        case "FOLLOW_LIMIT":
          console.log(
            chalkInfo(
              PF +
                " | <TSS | FOLLOW LIMIT" +
                " | 3C @" +
                m.threeceeUser +
                " | LIMIT: " +
                getTimeStamp(m.twitterFollowLimit) +
                " | NOW: " +
                getTimeStamp()
            )
          );

          threeceeTwitter.twitterFollowing = m.twitterFollowing;
          threeceeTwitter.twitterFriends = m.twitterFriends;
          threeceeTwitter.twitterFollowLimit = true;
          break;

        case "TWEET":
          socketRxTweet(m.tweet);
          break;

        case "PONG":
          tssPongReceived = m.pongId;
          childrenHashMap[params.childId].status = "RUNNING";
          if (configuration.verbose) {
            console.log(
              chalkInfo(
                PF +
                  " | <TSS | PONG" +
                  " | NOW: " +
                  getTimeStamp() +
                  " | PONG ID: " +
                  getTimeStamp(m.pongId) +
                  " | RESPONSE TIME: " +
                  msToTime(moment().valueOf() - m.pongId)
              )
            );
          }
          break;

        default:
          console.log(
            chalkError(PF + " | TSS | *** ERROR *** UNKNOWN OP: " + m.op)
          );
      }
    });

    tss.on("error", function tssError(err) {
      statsObj.tssChildReady = false;
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** TSS ERROR ***" +
            " \n" +
            jsonPrint(err)
        )
      );
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "ERROR";
      childrenHashMap[params.childId].error = err;
      configEvents.emit("CHILD_ERROR", { childId: params.childId });
    });

    tss.on("exit", function tssExit(code) {
      statsObj.tssChildReady = false;
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** TSS EXIT ***" +
            " | EXIT CODE: " +
            code
        )
      );
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "EXIT";
    });

    tss.on("close", function tssClose(code) {
      statsObj.tssChildReady = false;
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** TSS CLOSE ***" +
            " | EXIT CODE: " +
            code
        )
      );
      clearInterval(tssPingInterval);
      childrenHashMap[params.childId].status = "CLOSE";
      configEvents.emit("CHILD_ERROR", { childId: params.childId });
    });

    tssChild = tss;

    resolve();
  });
}

function initDbuChild(params) {
  statsObj.status = "INIT DBU CHILD";

  return new Promise(function (resolve) {
    const childId = params.childId;

    console.log(
      chalk.bold.black(PF + " | INIT DBU CHILD\n" + jsonPrint(params))
    );

    const dbu = cp.fork(`${__dirname}/js/libs/dbuChild.js`);

    childrenHashMap[childId] = {};
    childrenHashMap[childId].pid = dbu.pid;
    childrenHashMap[childId].childId = params.childId;
    childrenHashMap[params.childId].title = params.childId;
    childrenHashMap[childId].status = "NEW";
    childrenHashMap[childId].errors = 0;

    touchChildPidFile({
      childId: childId,
      pid: childrenHashMap[childId].pid,
    });

    dbu.on("message", function dbuMessageRx(m) {
      childrenHashMap[childId].status = "RUNNING";

      switch (m.op) {
        case "READY":
          dbuChild.send(
            {
              op: "INIT",
              title: "wa_node_child_dbu",
              interval: configuration.dbuInterval,
              testMode: configuration.testMode,
              verbose: configuration.verbose,
            },
            function dbuMessageRxError(err) {
              if (err) {
                console.log(
                  chalkError(PF + " | *** DBU SEND ERROR" + " | " + err)
                );
                console.log(err);
                dbuChildReady = false;
                clearInterval(dbuPingInterval);
                childrenHashMap[childId].status = "ERROR";
              } else {
                dbuChildReady = true;
                childrenHashMap[childId].status = "INIT";
                clearInterval(dbuPingInterval);
                setTimeout(function () {
                  initDbuPingInterval(DBU_PING_INTERVAL);
                }, 1000);
              }
            }
          );

          break;

        case "ERROR":
          console.log(
            chalkError(
              PF +
                " | <DBU | ERROR" +
                " | ERROR TYPE: " +
                m.errorType +
                "\n" +
                jsonPrint(m.error)
            )
          );
          break;

        case "PONG":
          dbuPongReceived = m.pongId;
          childrenHashMap[childId].status = "RUNNING";
          if (configuration.verbose) {
            console.log(
              chalkInfo(
                PF +
                  " | <DBU | PONG" +
                  " | NOW: " +
                  getTimeStamp() +
                  " | PONG ID: " +
                  getTimeStamp(m.pongId) +
                  " | RESPONSE TIME: " +
                  msToTime(moment().valueOf() - m.pongId)
              )
            );
          }
          break;

        default:
          console.log(
            chalkError(PF + " | DBU | *** ERROR *** UNKNOWN OP: " + m.op)
          );
      }
    });

    dbu.on("error", function dbuError(err) {
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** DBU ERROR ***" +
            " \n" +
            jsonPrint(err)
        )
      );
      dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "ERROR";
    });

    dbu.on("exit", function dbuExit(code) {
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** DBU EXIT ***" +
            " | EXIT CODE: " +
            code
        )
      );
      dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "EXIT";
    });

    dbu.on("close", function dbuClose(code) {
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** DBU CLOSE ***" +
            " | EXIT CODE: " +
            code
        )
      );
      dbuChildReady = false;
      clearInterval(dbuPingInterval);
      childrenHashMap[childId].status = "CLOSE";
    });

    dbuChild = dbu;

    resolve();
  });
}

function initTweetParserPingInterval(interval) {
  clearInterval(tweetParserPingInterval);

  tweetParserPingSent = false;
  tweetParserPongReceived = false;

  tweetParserPingId = moment().valueOf();

  if (twpChild) {
    tweetParserPingInterval = setInterval(function () {
      if (!tweetParserPingSent) {
        tweetParserPingId = moment().valueOf();

        twpChild.send(
          { op: "PING", pingId: tweetParserPingId },
          function (err) {
            tweetParserPingSent = true;

            if (err) {
              console.log(
                chalkError(PF + " | *** TWEET_PARSER SEND PING ERROR: " + err)
              );

              killChild({ childId: DEFAULT_TWP_CHILD_ID }, function (err) {
                if (err) {
                  console.log(
                    chalkError(PF + " | *** KILL CHILD ERROR: " + err)
                  );
                  return;
                }
                tweetParserPongReceived = false;
                initTweetParser({ childId: DEFAULT_TWP_CHILD_ID });
              });

              return;
            }

            if (configuration.verbose) {
              console.log(
                chalkInfo(
                  PF +
                    " | >PING | TWEET_PARSER | PING ID: " +
                    getTimeStamp(tweetParserPingId)
                )
              );
            }
          }
        );
      } else if (tweetParserPingSent && tweetParserPongReceived) {
        tweetParserPingId = moment().valueOf();

        tweetParserPingSent = false;
        tweetParserPongReceived = false;

        twpChild.send(
          { op: "PING", pingId: tweetParserPingId },
          function (err) {
            if (err) {
              console.log(
                chalkError(PF + " | *** TWEET_PARSER SEND PING ERROR: " + err)
              );

              killChild({ childId: DEFAULT_TWP_CHILD_ID }, function (err) {
                if (err) {
                  console.log(
                    chalkError(PF + " | *** KILL CHILD ERROR: " + err)
                  );
                  return;
                }
                tweetParserPongReceived = false;
                initTweetParser({ childId: DEFAULT_TWP_CHILD_ID });
              });

              return;
            }

            if (configuration.verbose) {
              console.log(
                chalkInfo(
                  PF +
                    " | >PING | TWEET_PARSER | PING ID: " +
                    getTimeStamp(tweetParserPingId)
                )
              );
            }

            tweetParserPingSent = true;
          }
        );
      } else {
        console.log(
          chalkAlert(
            PF +
              " | *** PONG TIMEOUT | TWEET_PARSER" +
              " | TIMEOUT: " +
              interval +
              " | NOW: " +
              getTimeStamp() +
              " | PING ID: " +
              getTimeStamp(tweetParserPingId) +
              " | ELAPSED: " +
              msToTime(moment().valueOf() - tweetParserPingId)
          )
        );
      }
    }, interval);
  }
}

function initTweetParser(params) {
  statsObj.status = "INIT TWEET PARSER";

  return new Promise(function (resolve, reject) {
    console.log(
      chalk.bold.black(PF + " | INIT TWEET PARSER\n" + jsonPrint(params))
    );

    clearInterval(tweetParserPingInterval);
    tweetParserPongReceived = false;

    tweetParserReady = false;

    let twp;

    try {
      twp = cp.fork(`${__dirname}/js/libs/tweetParser.js`);
    } catch (err) {
      console.log(
        chalkError(PF + " | *** TWEET PARSER CHILD FORK ERROR: " + err)
      );
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
      pid: childrenHashMap[params.childId].pid,
    });

    twp.on("message", function tweetParserMessageRx(m) {
      childrenHashMap[params.childId].status = "RUNNING";

      switch (m.op) {
        case "READY":
          twp.send(
            {
              op: "INIT",
              title: "wa_node_child_twp",
              interval: configuration.tweetParserInterval,
              tweetVersion2: configuration.tweetVersion2,
              testMode: configuration.testMode,
              verbose: configuration.verbose,
            },
            function tweetParserMessageRxError(err) {
              if (err) {
                console.log(
                  chalkError(
                    PF + " | *** TWEET PARSER SEND ERROR" + " | " + err
                  )
                );
                statsObj.tweetParserSendReady = false;
                tweetParserReady = false;
                clearInterval(tweetParserPingInterval);
                childrenHashMap[params.childId].status = "ERROR";
              } else {
                statsObj.tweetParserSendReady = true;
                tweetParserReady = true;
                childrenHashMap[params.childId].status = "INIT";
                clearInterval(tweetParserPingInterval);
                setTimeout(function () {
                  initTweetParserPingInterval(TWP_PING_INTERVAL);
                }, 1000);
              }
            }
          );
          break;

        case "PONG":
          tweetParserPongReceived = m.pongId;

          childrenHashMap[params.childId].status = "RUNNING";

          if (configuration.verbose) {
            console.log(
              chalkInfo(
                PF +
                  " | <PONG | TWEET PARSER" +
                  " | NOW: " +
                  getTimeStamp() +
                  " | PONG ID: " +
                  getTimeStamp(m.pongId) +
                  " | RESPONSE TIME: " +
                  msToTime(moment().valueOf() - m.pongId)
              )
            );
          }
          break;

        case "PARSED_TWEET":
          tweetParserMessageRxQueue.push(m);
          tweetParserReady = true;
          break;

        default:
          console.log(chalkError(PF + " | *** TWP UNKNOWN OP: " + m.op));
      }
    });

    twp.on("error", function tweetParserError(err) {
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** TWEET PARSER ERROR ***" +
            " \n" +
            jsonPrint(err)
        )
      );
      statsObj.tweetParserSendReady = false;
      tweetParserReady = false;
      clearInterval(tweetParserPingInterval);
      childrenHashMap[params.childId].status = "ERROR";
      configEvents.emit("CHILD_ERROR", { childId: params.childId });
    });

    twp.on("exit", function tweetParserExit(code) {
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** TWEET PARSER EXIT ***" +
            " | EXIT CODE: " +
            code
        )
      );
      statsObj.tweetParserSendReady = false;
      tweetParserReady = false;
      clearInterval(tweetParserPingInterval);
      childrenHashMap[params.childId].status = "EXIT";
    });

    twp.on("close", function tweetParserClose(code) {
      console.log(
        chalkError(
          PF +
            " | " +
            getTimeStamp() +
            " | *** TWEET PARSER CLOSE ***" +
            " | EXIT CODE: " +
            code
        )
      );
      statsObj.tweetParserSendReady = false;
      tweetParserReady = false;
      clearInterval(tweetParserPingInterval);
      childrenHashMap[params.childId].status = "CLOSE";
    });

    twpChild = twp;

    tweetParserReady = true;

    resolve();
  });
}

function initRateQinterval(interval) {
  return new Promise(function (resolve) {
    console.log(
      chalk.bold.black(
        PF + " | INIT RATE QUEUE INTERVAL | " + msToTime(interval)
      )
    );

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
    statsObj.queues.tweetParserMessageRxQueue =
      tweetParserMessageRxQueue.length;

    let updateTimeSeriesCount = 0;

    let paramsSorterOverall = {};
    let paramsSorter = {};

    updateMetricsInterval = setInterval(function updateMetrics() {
      statsObj.queues.transmitNodeQueue = transmitNodeQueue.length;
      statsObj.queues.tweetRxQueue = tweetRxQueue.length;
      statsObj.queues.sorterMessageRxQueue = sorterMessageRxQueue.length;
      statsObj.queues.tweetParserMessageRxQueue =
        tweetParserMessageRxQueue.length;

      updateTimeSeriesCount += 1;

      if (updateTimeSeriesCount % configuration.rateQueueIntervalModulo == 0) {
        cacheObjKeys.forEach(function statsCachesUpdate(cacheName) {
          if (cacheName == "nodesPerMinuteTopTermNodeTypeCache") {
            DEFAULT_NODE_TYPES.forEach(function (nodeType) {
              statsObj.caches[cacheName][nodeType].stats.keys = cacheObj[
                cacheName
              ][nodeType].getStats().keys;

              if (
                statsObj.caches[cacheName][nodeType].stats.keys >
                statsObj.caches[cacheName][nodeType].stats.keysMax
              ) {
                statsObj.caches[cacheName][nodeType].stats.keysMax =
                  statsObj.caches[cacheName][nodeType].stats.keys;
                statsObj.caches[cacheName][
                  nodeType
                ].stats.keysMaxTime = moment().valueOf();
                console.log(
                  chalkInfo(
                    `${PF} | MAX CACHE | ${cacheName} - ${nodeType} | Ks + ${statsObj.caches[cacheName][nodeType].stats.keys}`
                  )
                );
              }
            });
          } else {
            statsObj.caches[cacheName].stats.keys = cacheObj[
              cacheName
            ].getStats().keys;

            if (
              statsObj.caches[cacheName].stats.keys >
              statsObj.caches[cacheName].stats.keysMax
            ) {
              statsObj.caches[cacheName].stats.keysMax =
                statsObj.caches[cacheName].stats.keys;
              statsObj.caches[cacheName].stats.keysMaxTime = moment().valueOf();
              console.log(
                chalkInfo(
                  PF +
                    " | MAX CACHE" +
                    " | " +
                    cacheName +
                    " | Ks: " +
                    statsObj.caches[cacheName].stats.keys
                )
              );
            }
          }
        });

        if (adminNameSpace) {
          if (statsObj.admin.connected > statsObj.admin.connectedMax) {
            statsObj.admin.connectedMaxTime = moment().valueOf();
            statsObj.admin.connectedMax = statsObj.admin.connected;
            console.log(
              chalkInfo(
                PF +
                  " | MAX ADMINS" +
                  " | " +
                  statsObj.admin.connected +
                  " | " +
                  getTimeStamp()
              )
            );
          }
        }

        if (utilNameSpace) {
          if (
            statsObj.entity.util.connected > statsObj.entity.util.connectedMax
          ) {
            statsObj.entity.util.connectedMaxTime = moment().valueOf();
            statsObj.entity.util.connectedMax = statsObj.entity.util.connected;
            console.log(
              chalkInfo(
                PF +
                  " | MAX UTILS" +
                  " | " +
                  statsObj.entity.util.connected +
                  " | " +
                  getTimeStamp()
              )
            );
          }
        }

        if (adminNameSpace) {
          // statsObj.entity.viewer.connected = Object.keys(
          //   viewNameSpace.connected
          // ).length; // userNameSpace.sockets.length ;

          if (
            statsObj.entity.viewer.connected >
            statsObj.entity.viewer.connectedMax
          ) {
            statsObj.entity.viewer.connectedMaxTime = moment().valueOf();
            statsObj.entity.viewer.connectedMax =
              statsObj.entity.viewer.connected;

            console.log(
              chalkInfo(
                PF +
                  " | MAX VIEWERS" +
                  " | " +
                  statsObj.entity.viewer.connected +
                  " | " +
                  getTimeStamp()
              )
            );
          }
        }

        DEFAULT_NODE_TYPES.forEach(function (nodeType) {
          paramsSorter = {};
          paramsSorter.op = "SORT";
          paramsSorter.nodeType = nodeType;
          paramsSorter.sortKey = metricsRate;
          paramsSorter.max = configuration.maxTopTerms;
          paramsSorter.obj = {};

          async.each(
            Object.keys(nodeMeterType[nodeType]),
            function sorterParams(meterId, cb) {
              if (!nodeMeterType[nodeType][meterId]) {
                console.log(
                  chalkError(
                    PF +
                      " | *** ERROR NULL nodeMeterType[" +
                      nodeType +
                      "]: " +
                      meterId
                  )
                );
              }

              paramsSorter.obj[meterId] = pick(
                nodeMeterType[nodeType][meterId].toJSON(),
                paramsSorter.sortKey
              );

              cb();
            },
            function (err) {
              if (err) {
                console.log(
                  chalkError(PF + " | ERROR RATE QUEUE INTERVAL\n" + err)
                );
              }

              keySortQueue.push(paramsSorter);
            }
          );
        });

        paramsSorterOverall = {};
        paramsSorterOverall.op = "SORT";
        paramsSorterOverall.nodeType = "overall";
        paramsSorterOverall.sortKey = metricsRate;
        paramsSorterOverall.max = configuration.maxTopTerms;
        paramsSorterOverall.obj = {};

        async.each(
          Object.keys(nodeMeter),
          function sorterParams(meterId, cb) {
            if (!nodeMeter[meterId]) {
              console.log(
                chalkError(
                  PF + " | *** ERROR NULL nodeMeter[meterId]: " + meterId
                )
              );
            }

            paramsSorterOverall.obj[meterId] = pick(
              nodeMeter[meterId].toJSON(),
              paramsSorterOverall.sortKey
            );

            cb();
          },
          function (err) {
            if (err) {
              console.log(
                chalkError(PF + " | ERROR RATE QUEUE INTERVAL\n" + err)
              );
            }

            keySortQueue.push(paramsSorterOverall);
          }
        );
      }
    }, interval);

    resolve();
  });
}

async function loadBestRuntimeNetwork(p) {
  const params = p || {};

  const folder = params.folder || bestNetworkFolder;
  let file = params.file || bestRuntimeNetworkFileName;

  try {
    console.log(
      chalkLog(`${PF} | LOAD BEST RUNTIME NETWORK | ${folder}/${file}`)
    );

    const bRtNnObj = await tcUtils.loadFileRetry({
      folder: folder,
      file: file,
      noErrorNotFound: true,
    });

    if (bRtNnObj) {
      bRtNnObj.matchRate =
        bRtNnObj.matchRate !== undefined ? bRtNnObj.matchRate : 0;
      bRtNnObj.overallMatchRate =
        bRtNnObj.overallMatchRate !== undefined ? bRtNnObj.overallMatchRate : 0;
      bRtNnObj.runtimeMatchRate =
        bRtNnObj.runtimeMatchRate !== undefined ? bRtNnObj.runtimeMatchRate : 0;

      console.log(
        chalkLog(
          `${PF} | LOAD BEST NETWORK RUNTIME ID | ${
            bRtNnObj.networkId
          } | ${bRtNnObj.runtimeMatchRate.toFixed(3)}%`
        )
      );

      file = bRtNnObj.networkId + ".json";

      try {
        const nnObj = await tcUtils.loadFileRetry({
          folder: folder,
          file: file,
          noErrorNotFound: true,
        });

        if (nnObj) {
          nnObj.matchRate = nnObj.matchRate !== undefined ? nnObj.matchRate : 0;
          nnObj.overallMatchRate =
            nnObj.overallMatchRate !== undefined ? nnObj.overallMatchRate : 0;
          nnObj.runtimeMatchRate =
            nnObj.runtimeMatchRate !== undefined ? nnObj.runtimeMatchRate : 0;

          bestNetworkObj = {};
          bestNetworkObj = deepcopy(nnObj);

          console.log(
            chalk.green.bold(
              `${PF} | +++ LOADED BEST NETWORK | ${
                bestNetworkObj.networkId
              } | ${bestNetworkObj.runtimeMatchRate.toFixed(3)}%`
            )
          );

          statsObj.bestNetwork = pick(
            bestNetworkObj,
            statsBestNetworkPickArray
          );

          if (statsObj.previousBestNetworkId != bestNetworkObj.networkId) {
            console.log(
              chalk.green.bold(
                `${PF} | >>> BEST NETWORK CHANGE | PREV: ${statsObj.previousBestNetworkId} > NEW ${bestNetworkObj.networkId}`
              )
            );

            statsObj.previousBestNetworkId = bestNetworkObj.networkId;
            configEvents.emit("NEW_BEST_NETWORK", bestNetworkObj.networkId);
          }

          return bestNetworkObj.networkId;
        }
      } catch (e) {
        console.log(
          chalkError(
            `${PF} | *** ERROR LOAD BEST RUNTIME NETWORK | ERROR: ${e}`
          )
        );
        console.log(
          chalkAlert(
            `${PF} | ... SEARCH DB FOR BEST RUNTIME NETWORK: ${bRtNnObj.networkId}`
          )
        );
      }
    }

    const nnArray = await global.wordAssoDb.NeuralNetwork.find({
      runtimeMatchRate: { $lt: 100 },
    })
      .sort({ runtimeMatchRate: -1 })
      .limit(1);

    if (nnArray.length == 0) {
      console.log(chalkError(`${PF} | *** BEST RUNTIME NETWORK NOT FOUND`));
      return;
    }

    bestNetworkObj = {};
    bestNetworkObj = nnArray[0];

    if (empty(bestNetworkObj.matchRate)) {
      bestNetworkObj.matchRate = 0;
    }
    if (empty(bestNetworkObj.overallMatchRate)) {
      bestNetworkObj.overallMatchRate = 0;
    }
    if (empty(bestNetworkObj.runtimeMatchRate)) {
      bestNetworkObj.runtimeMatchRate = 0;
    }

    statsObj.bestNetwork = pick(bestNetworkObj, statsBestNetworkPickArray);

    if (statsObj.previousBestNetworkId != bestNetworkObj.networkId) {
      console.log(
        chalk.green.bold(
          `${PF} | >>> BEST NETWORK CHANGE | PREV: ${statsObj.previousBestNetworkId} > NEW ${bestNetworkObj.networkId}`
        )
      );
      statsObj.previousBestNetworkId = bestNetworkObj.networkId;
      configEvents.emit("NEW_BEST_NETWORK", bestNetworkObj.networkId);
    }

    console.log(
      chalk.blue.bold(
        `${PF} | +++ BEST NEURAL NETWORK LOADED FROM DB | ${
          bestNetworkObj.networkId
        } | ${bestNetworkObj.runtimeMatchRate.toFixed(3)}%`
      )
    );

    return bestNetworkObj.networkId;
  } catch (err) {
    if (err.code == "ETIMEDOUT") {
      console.log(
        chalkError(
          `${PF} | *** LOAD BEST NETWORK ERROR: NETWORK TIMEOUT | ${folder}/${file}`
        )
      );
    } else if (err.code == "ENOTFOUND") {
      console.log(
        chalkError(
          `${PF} | *** LOAD BEST NETWORK ERROR: FILE NOT FOUND | ${folder}/${file}`
        )
      );
    } else {
      console.log(chalkError(`${PF} | *** LOAD BEST NETWORK ERROR: ${err}`));
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

  try {
    const loadedConfigObj = await tcUtils.loadFile({
      folder: params.folder,
      file: params.file,
      noErrorNotFound: true,
    });

    if (empty(loadedConfigObj)) {
      console.log(
        chalkAlert(
          `${PF} | DROPBOX CONFIG LOAD FILE ERROR | JSON UNDEFINED ???`
        )
      );
      return;
    }

    console.log(chalkInfo(`${PF} | LOADED CONFIG FILE: ${params.file}`));

    const newConfiguration = {};

    newConfiguration.pubSub = {};
    newConfiguration.metrics = {};

    if (loadedConfigObj.WAS_HEARTBEAT_INTERVAL !== undefined) {
      console.log(
        `${PF} | LOADED WAS_HEARTBEAT_INTERVAL: ${loadedConfigObj.WAS_HEARTBEAT_INTERVAL}`
      );
      newConfiguration.heartbeatInterval =
        loadedConfigObj.WAS_HEARTBEAT_INTERVAL;
    }

    if (loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG !== undefined) {
      console.log(
        `${PF} | LOADED WAS_USER_PROFILE_ONLY_FLAG: ${loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG}`
      );

      if (
        loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == false ||
        loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == "false"
      ) {
        newConfiguration.userProfileOnlyFlag = false;
      } else if (
        loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == true ||
        loadedConfigObj.WAS_USER_PROFILE_ONLY_FLAG == "true"
      ) {
        newConfiguration.userProfileOnlyFlag = true;
      } else {
        newConfiguration.userProfileOnlyFlag = false;
      }
    }

    if (loadedConfigObj.WAS_MAX_LAST_SEEN_DAYS_HASHTAGS !== undefined) {
      console.log(
        `${PF} | LOADED WAS_MAX_LAST_SEEN_DAYS_HASHTAGS: ${loadedConfigObj.WAS_MAX_LAST_SEEN_DAYS_HASHTAGS}`
      );
      newConfiguration.maxLastSeenDaysHashtags =
        loadedConfigObj.WAS_MAX_LAST_SEEN_DAYS_HASHTAGS;
    }

    if (loadedConfigObj.WAS_MIN_MENTIONS_HASHTAGS !== undefined) {
      console.log(
        PF +
          " | LOADED WAS_MIN_MENTIONS_HASHTAGS: " +
          loadedConfigObj.WAS_MIN_MENTIONS_HASHTAGS
      );
      newConfiguration.minMentionsHashtags =
        loadedConfigObj.WAS_MIN_MENTIONS_HASHTAGS;
    }

    if (loadedConfigObj.WAS_PUBSUB_PROJECT_ID !== undefined) {
      console.log(
        PF +
          " | LOADED WAS_PUBSUB_PROJECT_ID: " +
          loadedConfigObj.WAS_PUBSUB_PROJECT_ID
      );
      newConfiguration.pubSub.projectId = loadedConfigObj.WAS_PUBSUB_PROJECT_ID;
    }

    if (loadedConfigObj.WAS_PUBSUB_RESULT_TIMEOUT !== undefined) {
      console.log(
        PF +
          " | LOADED WAS_PUBSUB_RESULT_TIMEOUT: " +
          loadedConfigObj.WAS_PUBSUB_RESULT_TIMEOUT
      );
      newConfiguration.pubSub.pubSubResultTimeout =
        loadedConfigObj.WAS_PUBSUB_RESULT_TIMEOUT;
    }

    if (loadedConfigObj.TWEET_VERSION_2 !== undefined) {
      console.log(
        PF + " | LOADED TWEET_VERSION_2: " + loadedConfigObj.TWEET_VERSION_2
      );

      if (
        loadedConfigObj.TWEET_VERSION_2 == false ||
        loadedConfigObj.TWEET_VERSION_2 == "false"
      ) {
        newConfiguration.tweetVersion2 = false;
      } else if (
        loadedConfigObj.TWEET_VERSION_2 == true ||
        loadedConfigObj.TWEET_VERSION_2 == "true"
      ) {
        newConfiguration.tweetVersion2 = true;
      } else {
        newConfiguration.tweetVersion2 = false;
      }
    }

    if (loadedConfigObj.WAS_TEST_MODE !== undefined) {
      console.log(
        PF + " | LOADED WAS_TEST_MODE: " + loadedConfigObj.WAS_TEST_MODE
      );

      if (
        loadedConfigObj.WAS_TEST_MODE == false ||
        loadedConfigObj.WAS_TEST_MODE == "false"
      ) {
        newConfiguration.testMode = false;
      } else if (
        loadedConfigObj.WAS_TEST_MODE == true ||
        loadedConfigObj.WAS_TEST_MODE == "true"
      ) {
        newConfiguration.testMode = true;
      } else {
        newConfiguration.testMode = false;
      }
    }

    if (loadedConfigObj.VERBOSE !== undefined) {
      console.log(PF + " | LOADED VERBOSE: " + loadedConfigObj.VERBOSE);

      if (
        loadedConfigObj.VERBOSE == false ||
        loadedConfigObj.VERBOSE == "false"
      ) {
        newConfiguration.verbose = false;
      } else if (
        loadedConfigObj.VERBOSE == true ||
        loadedConfigObj.VERBOSE == "true"
      ) {
        newConfiguration.verbose = true;
      } else {
        newConfiguration.verbose = false;
      }
    }

    if (loadedConfigObj.BINARY_MODE !== undefined) {
      console.log(PF + " | LOADED BINARY_MODE: " + loadedConfigObj.BINARY_MODE);

      if (
        loadedConfigObj.BINARY_MODE == false ||
        loadedConfigObj.BINARY_MODE == "false"
      ) {
        newConfiguration.binaryMode = false;
      } else if (
        loadedConfigObj.BINARY_MODE == true ||
        loadedConfigObj.BINARY_MODE == "true"
      ) {
        newConfiguration.binaryMode = true;
      } else {
        newConfiguration.binaryMode = false;
      }
    }

    if (loadedConfigObj.TWEET_SEARCH_COUNT !== undefined) {
      console.log(
        PF +
          " | LOADED TWEET_SEARCH_COUNT: " +
          loadedConfigObj.TWEET_SEARCH_COUNT
      );
      newConfiguration.tweetSearchCount = loadedConfigObj.TWEET_SEARCH_COUNT;
    }

    if (loadedConfigObj.NODE_SETPROPS_QUEUE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED NODE_SETPROPS_QUEUE_INTERVAL: " +
          loadedConfigObj.NODE_SETPROPS_QUEUE_INTERVAL
      );
      newConfiguration.nodeSetPropsQueueInterval =
        loadedConfigObj.NODE_SETPROPS_QUEUE_INTERVAL;
    }

    if (loadedConfigObj.UPDATE_USER_SETS_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED UPDATE_USER_SETS_INTERVAL: " +
          loadedConfigObj.UPDATE_USER_SETS_INTERVAL
      );
      newConfiguration.updateUserSetsInterval =
        loadedConfigObj.UPDATE_USER_SETS_INTERVAL;
    }

    if (loadedConfigObj.UPDATE_HASHTAG_SETS_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED UPDATE_HASHTAG_SETS_INTERVAL: " +
          loadedConfigObj.UPDATE_HASHTAG_SETS_INTERVAL
      );
      newConfiguration.updateHashtagSetsInterval =
        loadedConfigObj.UPDATE_HASHTAG_SETS_INTERVAL;
    }

    if (loadedConfigObj.ENABLE_GEOCODE !== undefined) {
      console.log(
        PF + " | LOADED ENABLE_GEOCODE: " + loadedConfigObj.ENABLE_GEOCODE
      );

      if (
        loadedConfigObj.ENABLE_GEOCODE == false ||
        loadedConfigObj.ENABLE_GEOCODE == "false"
      ) {
        newConfiguration.enableGeoCode = false;
      } else if (
        loadedConfigObj.ENABLE_GEOCODE == true ||
        loadedConfigObj.ENABLE_GEOCODE == "true"
      ) {
        newConfiguration.enableGeoCode = true;
      } else {
        newConfiguration.enableGeoCode = false;
      }
    }

    if (loadedConfigObj.FILTER_RETWEETS !== undefined) {
      console.log(
        PF + " | LOADED FILTER_RETWEETS: " + loadedConfigObj.FILTER_RETWEETS
      );

      if (
        loadedConfigObj.FILTER_RETWEETS == false ||
        loadedConfigObj.FILTER_RETWEETS == "false"
      ) {
        newConfiguration.filterRetweets = false;
      } else if (
        loadedConfigObj.FILTER_RETWEETS == true ||
        loadedConfigObj.FILTER_RETWEETS == "true"
      ) {
        newConfiguration.filterRetweets = true;
      } else {
        newConfiguration.filterRetweets = true;
      }
    }

    if (loadedConfigObj.FILTER_DUPLICATE_TWEETS !== undefined) {
      console.log(
        PF +
          " | LOADED FILTER_DUPLICATE_TWEETS: " +
          loadedConfigObj.FILTER_DUPLICATE_TWEETS
      );

      if (
        loadedConfigObj.FILTER_DUPLICATE_TWEETS == false ||
        loadedConfigObj.FILTER_DUPLICATE_TWEETS == "false"
      ) {
        newConfiguration.filterDuplicateTweets = false;
      } else if (
        loadedConfigObj.FILTER_DUPLICATE_TWEETS == true ||
        loadedConfigObj.FILTER_DUPLICATE_TWEETS == "true"
      ) {
        newConfiguration.filterDuplicateTweets = true;
      } else {
        newConfiguration.filterDuplicateTweets = true;
      }
    }

    if (loadedConfigObj.ENABLE_IMAGE_ANALYSIS !== undefined) {
      console.log(
        PF +
          " | LOADED ENABLE_IMAGE_ANALYSIS: " +
          loadedConfigObj.ENABLE_IMAGE_ANALYSIS
      );

      if (
        loadedConfigObj.ENABLE_IMAGE_ANALYSIS == false ||
        loadedConfigObj.ENABLE_IMAGE_ANALYSIS == "false"
      ) {
        newConfiguration.enableImageAnalysis = false;
      } else if (
        loadedConfigObj.ENABLE_IMAGE_ANALYSIS == true ||
        loadedConfigObj.ENABLE_IMAGE_ANALYSIS == "true"
      ) {
        newConfiguration.enableImageAnalysis = true;
      } else {
        newConfiguration.enableImageAnalysis = false;
      }
    }

    if (loadedConfigObj.FORCE_IMAGE_ANALYSIS !== undefined) {
      console.log(
        PF +
          " | LOADED FORCE_IMAGE_ANALYSIS: " +
          loadedConfigObj.FORCE_IMAGE_ANALYSIS
      );

      if (
        loadedConfigObj.FORCE_IMAGE_ANALYSIS == false ||
        loadedConfigObj.FORCE_IMAGE_ANALYSIS == "false"
      ) {
        newConfiguration.forceImageAnalysis = false;
      } else if (
        loadedConfigObj.FORCE_IMAGE_ANALYSIS == true ||
        loadedConfigObj.FORCE_IMAGE_ANALYSIS == "true"
      ) {
        newConfiguration.forceImageAnalysis = true;
      } else {
        newConfiguration.forceImageAnalysis = false;
      }
    }

    if (loadedConfigObj.AUTO_FOLLOW !== undefined) {
      console.log(PF + " | LOADED AUTO_FOLLOW: " + loadedConfigObj.AUTO_FOLLOW);

      if (
        loadedConfigObj.AUTO_FOLLOW == false ||
        loadedConfigObj.AUTO_FOLLOW == "false"
      ) {
        newConfiguration.autoFollow = false;
      } else if (
        loadedConfigObj.AUTO_FOLLOW == true ||
        loadedConfigObj.AUTO_FOLLOW == "true"
      ) {
        newConfiguration.autoFollow = true;
      } else {
        newConfiguration.autoFollow = false;
      }
    }

    if (loadedConfigObj.FORCE_FOLLOW !== undefined) {
      console.log(
        PF + " | LOADED FORCE_FOLLOW: " + loadedConfigObj.FORCE_FOLLOW
      );

      if (
        loadedConfigObj.FORCE_FOLLOW == false ||
        loadedConfigObj.FORCE_FOLLOW == "false"
      ) {
        newConfiguration.forceFollow = false;
      } else if (
        loadedConfigObj.FORCE_FOLLOW == true ||
        loadedConfigObj.FORCE_FOLLOW == "true"
      ) {
        newConfiguration.forceFollow = true;
      } else {
        newConfiguration.forceFollow = false;
      }
    }

    if (loadedConfigObj.WAS_ENABLE_STDIN !== undefined) {
      console.log(
        PF + " | LOADED WAS_ENABLE_STDIN: " + loadedConfigObj.WAS_ENABLE_STDIN
      );

      if (
        loadedConfigObj.WAS_ENABLE_STDIN == false ||
        loadedConfigObj.WAS_ENABLE_STDIN == "false"
      ) {
        newConfiguration.enableStdin = false;
      } else if (
        loadedConfigObj.WAS_ENABLE_STDIN == true ||
        loadedConfigObj.WAS_ENABLE_STDIN == "true"
      ) {
        newConfiguration.enableStdin = true;
      } else {
        newConfiguration.enableStdin = false;
      }
    }

    if (loadedConfigObj.NODE_METER_ENABLED !== undefined) {
      console.log(
        PF +
          " | LOADED NODE_METER_ENABLED: " +
          loadedConfigObj.NODE_METER_ENABLED
      );

      if (loadedConfigObj.NODE_METER_ENABLED == "true") {
        newConfiguration.metrics.nodeMeterEnabled = true;
      } else if (loadedConfigObj.NODE_METER_ENABLED == "false") {
        newConfiguration.metrics.nodeMeterEnabled = false;
      } else {
        newConfiguration.metrics.nodeMeterEnabled = true;
      }
    }

    if (loadedConfigObj.PROCESS_NAME !== undefined) {
      console.log(
        PF + " | LOADED PROCESS_NAME: " + loadedConfigObj.PROCESS_NAME
      );
      newConfiguration.processName = loadedConfigObj.PROCESS_NAME;
    }

    if (loadedConfigObj.MAX_TWEET_RX_QUEUE !== undefined) {
      console.log(
        PF +
          " | LOADED MAX_TWEET_RX_QUEUE: " +
          loadedConfigObj.MAX_TWEET_RX_QUEUE
      );
      newConfiguration.maxTweetRxQueue = loadedConfigObj.MAX_TWEET_RX_QUEUE;
    }

    if (loadedConfigObj.MAX_TRANSMIT_NODE_QUEUE !== undefined) {
      console.log(
        PF +
          " | LOADED MAX_TRANSMIT_NODE_QUEUE: " +
          loadedConfigObj.MAX_TRANSMIT_NODE_QUEUE
      );
      newConfiguration.maxTransmitNodeQueue =
        loadedConfigObj.MAX_TRANSMIT_NODE_QUEUE;
    }

    // if (loadedConfigObj.THREECEE_USERS !== undefined) {
    //   console.log(
    //     PF +
    //       " | LOADED THREECEE_USERS: " +
    //       loadedConfigObj.THREECEE_USERS
    //   );
    //   newConfiguration.threeceeUsers = loadedConfigObj.THREECEE_USERS;
    // }

    if (loadedConfigObj.TWITTER_THREECEE_INFO_USERS !== undefined) {
      console.log(
        PF +
          " | LOADED TWITTER_THREECEE_INFO_USERS: " +
          loadedConfigObj.TWITTER_THREECEE_INFO_USERS
      );
      newConfiguration.threeceeInfoUsersArray =
        loadedConfigObj.TWITTER_THREECEE_INFO_USERS;
    }

    if (loadedConfigObj.TWITTER_THREECEE_USER !== undefined) {
      console.log(
        PF +
          " | LOADED TWITTER_THREECEE_USER: " +
          loadedConfigObj.TWITTER_THREECEE_USER
      );
      newConfiguration.threeceeUser = loadedConfigObj.TWITTER_THREECEE_USER;
    }

    if (loadedConfigObj.CURSOR_BATCH_SIZE !== undefined) {
      console.log(
        PF + " | LOADED CURSOR_BATCH_SIZE: " + loadedConfigObj.CURSOR_BATCH_SIZE
      );
      newConfiguration.cursorBatchSize = loadedConfigObj.CURSOR_BATCH_SIZE;
    }

    if (loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT !== undefined) {
      console.log(
        PF +
          " | LOADED FIND_CAT_USER_CURSOR_LIMIT: " +
          loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT
      );
      newConfiguration.findCatUserLimit =
        loadedConfigObj.FIND_CAT_USER_CURSOR_LIMIT;
    }

    if (loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT !== undefined) {
      console.log(
        PF +
          " | LOADED FIND_CAT_HASHTAG_CURSOR_LIMIT: " +
          loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT
      );
      newConfiguration.findCatHashtagLimit =
        loadedConfigObj.FIND_CAT_HASHTAG_CURSOR_LIMIT;
    }

    if (loadedConfigObj.MAX_BOTS_TO_FETCH !== undefined) {
      console.log(
        PF + " | LOADED MAX_BOTS_TO_FETCH: " + loadedConfigObj.MAX_BOTS_TO_FETCH
      );
      newConfiguration.maxBotsToFetch = loadedConfigObj.MAX_BOTS_TO_FETCH;
    }

    if (loadedConfigObj.BOT_UPDATE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED BOT_UPDATE_INTERVAL: " +
          loadedConfigObj.BOT_UPDATE_INTERVAL
      );
      newConfiguration.botUpdateIntervalTime =
        loadedConfigObj.BOT_UPDATE_INTERVAL;
    }

    if (loadedConfigObj.HEAPDUMP_ENABLED !== undefined) {
      console.log(
        PF + " | LOADED HEAPDUMP_ENABLED: " + loadedConfigObj.HEAPDUMP_ENABLED
      );
      newConfiguration.heapDumpEnabled = loadedConfigObj.HEAPDUMP_ENABLED;
    }

    if (loadedConfigObj.HEAPDUMP_MODULO !== undefined) {
      console.log(
        PF + " | LOADED HEAPDUMP_MODULO: " + loadedConfigObj.HEAPDUMP_MODULO
      );
      newConfiguration.heapDumpModulo = loadedConfigObj.HEAPDUMP_MODULO;
    }

    if (loadedConfigObj.HEAPDUMP_THRESHOLD !== undefined) {
      console.log(
        PF +
          " | LOADED HEAPDUMP_THRESHOLD: " +
          loadedConfigObj.HEAPDUMP_THRESHOLD
      );
      newConfiguration.heapDumpThreshold = loadedConfigObj.HEAPDUMP_THRESHOLD;
    }

    if (loadedConfigObj.NODE_CACHE_CHECK_PERIOD !== undefined) {
      console.log(
        PF +
          " | LOADED NODE_CACHE_CHECK_PERIOD: " +
          loadedConfigObj.NODE_CACHE_CHECK_PERIOD
      );
      newConfiguration.nodeCacheCheckPeriod =
        loadedConfigObj.NODE_CACHE_CHECK_PERIOD;
    }

    if (loadedConfigObj.NODE_CACHE_DEFAULT_TTL !== undefined) {
      console.log(
        PF +
          " | LOADED NODE_CACHE_DEFAULT_TTL: " +
          loadedConfigObj.NODE_CACHE_DEFAULT_TTL
      );
      newConfiguration.nodeCacheTtl = loadedConfigObj.NODE_CACHE_DEFAULT_TTL;
    }

    if (loadedConfigObj.SOCKET_IDLE_TIMEOUT !== undefined) {
      console.log(
        PF +
          " | LOADED SOCKET_IDLE_TIMEOUT: " +
          loadedConfigObj.SOCKET_IDLE_TIMEOUT
      );
      newConfiguration.socketIdleTimeout = loadedConfigObj.SOCKET_IDLE_TIMEOUT;
    }

    if (loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD !== undefined) {
      console.log(
        PF +
          " | LOADED TOPTERMS_CACHE_CHECK_PERIOD: " +
          loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD
      );
      newConfiguration.topTermsCacheCheckPeriod =
        loadedConfigObj.TOPTERMS_CACHE_CHECK_PERIOD;
    }

    if (loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL !== undefined) {
      console.log(
        PF +
          " | LOADED TOPTERMS_CACHE_DEFAULT_TTL: " +
          loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL
      );
      newConfiguration.topTermsCacheTtl =
        loadedConfigObj.TOPTERMS_CACHE_DEFAULT_TTL;
    }

    if (loadedConfigObj.MIN_FOLLOWERS_AUTO_FOLLOW !== undefined) {
      console.log(
        PF +
          " | LOADED MIN_FOLLOWERS_AUTO_FOLLOW: " +
          loadedConfigObj.MIN_FOLLOWERS_AUTO_FOLLOW
      );
      newConfiguration.minFollowersAutoFollow =
        loadedConfigObj.MIN_FOLLOWERS_AUTO_FOLLOW;
    }

    if (loadedConfigObj.MIN_FOLLOWERS_AUTO_CATEGORIZE !== undefined) {
      console.log(
        PF +
          " | LOADED MIN_FOLLOWERS_AUTO_CATEGORIZE: " +
          loadedConfigObj.MIN_FOLLOWERS_AUTO_CATEGORIZE
      );
      newConfiguration.minFollowersAutoCategorize =
        loadedConfigObj.MIN_FOLLOWERS_AUTO_CATEGORIZE;
    }

    if (loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED CATEGORY_HASHMAPS_UPDATE_INTERVAL: " +
          loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL
      );
      newConfiguration.categoryHashmapsUpdateInterval =
        loadedConfigObj.CATEGORY_HASHMAPS_UPDATE_INTERVAL;
    }

    if (loadedConfigObj.STATS_UPDATE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED STATS_UPDATE_INTERVAL: " +
          loadedConfigObj.STATS_UPDATE_INTERVAL
      );
      newConfiguration.statsUpdateIntervalTime =
        loadedConfigObj.STATS_UPDATE_INTERVAL;
    }

    if (loadedConfigObj.TRANSMIT_NODE_QUEUE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED TRANSMIT_NODE_QUEUE_INTERVAL: " +
          loadedConfigObj.TRANSMIT_NODE_QUEUE_INTERVAL
      );
      newConfiguration.transmitNodeQueueInterval =
        loadedConfigObj.TRANSMIT_NODE_QUEUE_INTERVAL;
    }

    if (loadedConfigObj.RATE_QUEUE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED RATE_QUEUE_INTERVAL: " +
          loadedConfigObj.RATE_QUEUE_INTERVAL
      );
      newConfiguration.rateQueueInterval = loadedConfigObj.RATE_QUEUE_INTERVAL;
    }

    if (loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO !== undefined) {
      console.log(
        PF +
          " | LOADED RATE_QUEUE_INTERVAL_MODULO: " +
          loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO
      );
      newConfiguration.rateQueueIntervalModulo =
        loadedConfigObj.RATE_QUEUE_INTERVAL_MODULO;
    }

    if (loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW !== undefined) {
      console.log(
        PF +
          " | LOADED TWITTER_THREECEE_AUTO_FOLLOW: " +
          loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW
      );
      newConfiguration.twitterThreeceeAutoFollowConfigFile =
        loadedConfigObj.TWITTER_THREECEE_AUTO_FOLLOW + ".json";
    }

    if (loadedConfigObj.TWEET_PARSER_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED TWEET_PARSER_INTERVAL: " +
          loadedConfigObj.TWEET_PARSER_INTERVAL
      );
      newConfiguration.tweetParserInterval =
        loadedConfigObj.TWEET_PARSER_INTERVAL;
    }

    if (loadedConfigObj.KEEPALIVE_INTERVAL !== undefined) {
      console.log(
        PF +
          " | LOADED KEEPALIVE_INTERVAL: " +
          loadedConfigObj.KEEPALIVE_INTERVAL
      );
      newConfiguration.keepaliveInterval = loadedConfigObj.KEEPALIVE_INTERVAL;
    }

    return newConfiguration;
  } catch (err) {
    console.log(
      chalkError(
        PF + " | ERROR LOAD DROPBOX CONFIG: " + fullPath + "\n" + jsonPrint(err)
      )
    );
    throw err;
  }
}

async function loadAllConfigFiles() {
  statsObj.status = "LOAD CONFIG";

  const defaultConfig = await loadConfigFile({
    folder: configDefaultFolder,
    file: configDefaultFile,
  });

  if (defaultConfig) {
    defaultConfiguration = defaultConfig;
    console.log(
      chalk.green(
        PF +
          " | +++ RELOADED DEFAULT CONFIG " +
          configDefaultFolder +
          "/" +
          configDefaultFile
      )
    );
  }

  const hostConfig = await loadConfigFile({
    folder: configHostFolder,
    file: configHostFile,
  });

  if (hostConfig) {
    hostConfiguration = hostConfig;
    console.log(
      chalk.green(
        PF +
          " | +++ RELOADED HOST CONFIG " +
          configHostFolder +
          "/" +
          configHostFile
      )
    );
  }

  const defaultAndHostConfig = merge(defaultConfiguration, hostConfiguration); // host settings override defaults
  const tempConfig = merge(configuration, defaultAndHostConfig); // any new settings override existing config

  configuration = tempConfig;

  if (
    configuration.botUpdateIntervalTime !== tempConfig.botUpdateIntervalTime ||
    configuration.maxBotsToFetch !== tempConfig.maxBotsToFetch ||
    configuration.botCategories !== tempConfig.botCategories
  ) {
    await initBotSet();
  }
  // configuration.threeceeUsers = _.uniq(configuration.threeceeUsers); // merge concats arrays!

  filterDuplicateTweets = configuration.filterDuplicateTweets;
  filterRetweets = configuration.filterRetweets;

  console.log(chalkWarn(PF + " | -X- FILTER RETWEETS: " + filterRetweets));

  maxTweetRxQueue = configuration.maxTweetRxQueue;
  maxTransmitNodeQueue = configuration.maxTransmitNodeQueue;

  return;
}

function initStatsUpdate() {
  return new Promise(function (resolve, reject) {
    try {
      console.log(
        chalkTwitter(
          PF +
            " | INIT STATS UPDATE INTERVAL | " +
            msToTime(configuration.statsUpdateIntervalTime)
        )
      );

      showStats(true);

      clearInterval(statsInterval);

      let childArray = [];

      statsInterval = setInterval(async function updateStats() {
        try {
          childArray = await getChildProcesses({ searchTerm: "ALL" });

          if (configuration.verbose) {
            console.log(
              chalkLog(PF + " | FOUND " + childArray.length + " CHILDREN")
            );
          }

          childArray.forEach(function (childObj) {
            console.log(
              chalkLog(
                PF +
                  " | CHILD" +
                  " | PID: " +
                  childObj.pid +
                  " | " +
                  childObj.childId +
                  " | " +
                  childrenHashMap[childObj.childId].status
              )
            );
          });

          statsObj.serverTime = moment().valueOf();
          statsObj.timeStamp = getTimeStamp();
          statsObj.runTime = moment().valueOf() - statsObj.startTime;
          statsObj.upTime = os.uptime() * 1000;

          statsObj.bots.numOfBots = botNodeIdSet.size;

          if (
            statsObj.twitter.tweetsPerMin > statsObj.twitter.maxTweetsPerMin
          ) {
            statsObj.twitter.maxTweetsPerMin = statsObj.twitter.tweetsPerMin;
            statsObj.twitter.maxTweetsPerMinTime = moment().valueOf();
          }

          statsObj.nodeMeterEntries = Object.keys(nodeMeter).length;

          if (statsObj.nodeMeterEntries > statsObj.nodeMeterEntriesMax) {
            statsObj.nodeMeterEntriesMax = statsObj.nodeMeterEntries;
            statsObj.nodeMeterEntriesMaxTime = moment().valueOf();
          }

          statsObj.queues.saveFileQueue = tcUtils.saveFileQueue({
            folder: statsHostFolder,
            file: statsFile,
            obj: statsObj,
          });

          showStats();

          if (statsObj.twitNotReadyWarning) {
            statsObj.twitNotReadyWarning = false;
          }
        } catch (err) {
          console.log(chalkError(PF + " | *** STATS UPDATE ERROR: " + err));
        }
      }, configuration.statsUpdateIntervalTime);

      resolve();
    } catch (err) {
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

  for (const user of configuration.threeceeInfoUsersArray) {
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
  }

  try {
    await loadAllConfigFiles();
    await loadCommandLineArgs();

    const configArgs = Object.keys(configuration);

    configArgs.forEach((arg) => {
      if (_.isObject(configuration[arg])) {
        console.log(
          `${PF} | _FINAL CONFIG | ${arg}\n${jsonPrint(configuration[arg])}`
        );
      } else {
        console.log(`${PF} | _FINAL CONFIG | ${arg}: ${configuration[arg]}`);
      }
    });

    statsObj.commandLineArgsLoaded = true;

    if (configuration.enableStdin) {
      await initStdIn();
    }

    // await initStatsUpdate(configuration);
    // statsObj.configuration = configuration;

    return configuration;
  } catch (err) {
    console.log(chalkLog(PF + " | *** INIT CONFIG ERROR: " + err));
    throw err;
  }
}

async function initDbUserChangeStream() {
  console.log(chalkLog(PF + " | ... INIT DB USER CHANGE STREAM"));

  const userCollection = global.dbConnection.collection("users");

  let catChangeFlag = false;
  let catAutoChangeFlag = false;
  let catNetworkChangeFlag = false;
  let catVerifiedChangeFlag = false;

  const userChangeFilter = {
    $match: {
      $or: [
        { operationType: "insert" },
        { operationType: "delete" },
        { operationType: "update" },
        { operationType: "replace" },
      ],
    },
  };

  const userChangeOptions = { fullDocument: "updateLookup" };

  userChangeStream = userCollection.watch(
    [userChangeFilter],
    userChangeOptions
  );

  let categoryChanges = {};
  let catObj = {};

  userChangeStream.on("change", function (change) {
    catChangeFlag = false;
    catAutoChangeFlag = false;
    catNetworkChangeFlag = false;
    catVerifiedChangeFlag = false;

    statsObj.user.categoryChanged =
      statsObj.user.categoryChanged === undefined
        ? 0
        : statsObj.user.categoryChanged;
    statsObj.user.categoryAutoChanged =
      statsObj.user.categoryAutoChanged === undefined
        ? 0
        : statsObj.user.categoryAutoChanged;
    statsObj.user.categorizeNetworkChanged =
      statsObj.user.categorizeNetworkChanged === undefined
        ? 0
        : statsObj.user.categorizeNetworkChanged;
    statsObj.user.categoryVerifiedChanged =
      statsObj.user.categoryVerifiedChanged === undefined
        ? 0
        : statsObj.user.categoryVerifiedChanged;

    if (change && change.operationType === "insert") {
      addedUsersSet.add(change.fullDocument.nodeId);
      statsObj.user.added = addedUsersSet.size;

      if (
        change.fullDocument.tweetHistograms &&
        change.fullDocument.tweetHistograms.friends
      ) {
        console.log(
          chalkAlert(
            `${MODULE_ID_PREFIX} | !!! USER INSERT tweetHistograms.friends | NID: ${change.fullDocument.nodeId} | @${change.fullDocument.screenName}`
          )
        );
        console.log(change.fullDocument.tweetHistograms.friends);
      }
    }

    if (change && change.operationType === "delete") {
      // change obj doesn't contain userDoc, so use DB BSON ID
      deletedUsersSet.add(change._id._data);
      statsObj.user.deleted = deletedUsersSet.size;
    }

    if (
      change &&
      change.operationType === "update" &&
      change.fullDocument &&
      categorizedUserHashMap.has(change.fullDocument.nodeId) &&
      change.updateDescription &&
      change.updateDescription.updatedFields
    ) {
      const changedArray = Object.keys(change.updateDescription.updatedFields);

      categoryChanges = {};

      if (
        changedArray.includes("profileHistograms") ||
        changedArray.includes("tweetHistograms") ||
        changedArray.includes("friends")
      ) {
        if (
          empty(change.fullDocument.profileHistograms) &&
          empty(change.fullDocument.tweetHistograms) &&
          empty(change.fullDocument.friends)
        ) {
          console.log(
            chalkAlert(
              `${MODULE_ID_PREFIX} | !!! USER HIST CHANGED TO EMPTY | @${change.fullDocument.screenName}`
            )
          );
        }
      }

      if (changedArray.includes("category")) {
        categoryChanges.category = change.fullDocument.category;
      }
      if (changedArray.includes("tweetHistograms")) {
        if (change.fullDocument.tweetHistograms.friends) {
          console.log(
            chalkAlert(
              `${MODULE_ID_PREFIX} | *** USER CHG tweetHistograms.friends | NID: ${change.fullDocument.nodeId} | @${change.fullDocument.screenName}`
            )
          );
          console.log(change.fullDocument.tweetHistograms.friends);
        }
      }
      if (changedArray.includes("categoryAuto")) {
        categoryChanges.categoryAuto = change.fullDocument.categoryAuto;
      }
      if (changedArray.includes("categorizeNetwork")) {
        categoryChanges.network = change.fullDocument.categorizeNetwork;
      }
      if (changedArray.includes("categoryVerified")) {
        categoryChanges.verified = change.fullDocument.categoryVerified;
      }

      if (
        categoryChanges.categoryAuto ||
        categoryChanges.category ||
        categoryChanges.network ||
        categoryChanges.verified
      ) {
        catObj = categorizedUserHashMap.get(change.fullDocument.nodeId);

        if (
          categoryChanges.category &&
          formatCategory(catObj.category) !==
            formatCategory(categoryChanges.category)
        ) {
          catObj.category = categoryChanges.category;
          catChangeFlag = true;
          statsObj.user.categoryChanged += 1;
        }

        if (
          categoryChanges.categoryAuto &&
          formatCategory(catObj.categoryAuto) !==
            formatCategory(categoryChanges.categoryAuto)
        ) {
          catObj.categoryAuto = categoryChanges.categoryAuto;
          catAutoChangeFlag = true;
          statsObj.user.categoryAutoChanged += 1;
        }

        if (
          categoryChanges.network &&
          catObj.network &&
          catObj.network !== categoryChanges.network
        ) {
          catObj.network = categoryChanges.network;
          catNetworkChangeFlag = true;
          statsObj.user.categorizeNetworkChanged += 1;
        }

        if (
          categoryChanges.verified &&
          catObj.verified &&
          catObj.verified !== categoryChanges.verified
        ) {
          catObj.verified = categoryChanges.verified;
          catVerifiedChangeFlag = true;
          statsObj.user.categoryVerifiedChanged += 1;
        }

        if (
          catChangeFlag ||
          catAutoChangeFlag ||
          catNetworkChangeFlag ||
          catVerifiedChangeFlag
        ) {
          categorizedUserHashMap.set(catObj.nodeId, catObj);
          uncategorizeableUserSet.delete(catObj.nodeId);
        }
      }
    }
  });

  return;
}

async function initDbHashtagChangeStream() {
  console.log(chalkLog(PF + " | ... INIT DB HASHTAG CHANGE STREAM"));

  const hashtagCollection = global.dbConnection.collection("hashtags");

  let catChangeFlag = false;
  let catNetworkChangeFlag = false;
  let catVerifiedChangeFlag = false;

  const hashtagChangeFilter = {
    $match: {
      $or: [
        { operationType: "insert" },
        { operationType: "delete" },
        { operationType: "update" },
        { operationType: "replace" },
      ],
    },
  };

  const hashtagChangeOptions = { fullDocument: "updateLookup" };

  hashtagChangeStream = hashtagCollection.watch(
    [hashtagChangeFilter],
    hashtagChangeOptions
  );

  let categoryChanges = {};
  let catObj = {};

  hashtagChangeStream.on("change", function (change) {
    catChangeFlag = false;
    catNetworkChangeFlag = false;
    catVerifiedChangeFlag = false;

    if (change && change.operationType === "insert") {
      addedHashtagsSet.add(change.fullDocument.nodeId);
      statsObj.hashtag.added = addedHashtagsSet.size;
    }

    if (change && change.operationType === "delete") {
      // change obj doesn't contain hashtagDoc, so use DB BSON ID

      deletedHashtagsSet.add(change._id._data);
      statsObj.hashtag.deleted = deletedHashtagsSet.size;
    }

    if (
      change &&
      change.fullDocument &&
      change.updateDescription &&
      change.updateDescription.updatedFields &&
      Object.keys(change.updateDescription.updatedFields).includes("category")
    ) {
      categoryChanges = {};

      categoryChanges.category = change.fullDocument.category;

      if (categoryChanges.category) {
        catObj = categorizedHashtagHashMap.get(change.fullDocument.nodeId);

        if (empty(catObj)) {
          catChangeFlag = true;
          catObj = {};
          catObj.nodeId = change.fullDocument.nodeId;
          catObj.category = change.fullDocument.category;
        }

        if (
          categoryChanges.category &&
          formatCategory(catObj.category) !==
            formatCategory(categoryChanges.category)
        ) {
          catChangeFlag = true;
          statsObj.hashtag.categoryChanged += 1;
        }

        if (catChangeFlag || catNetworkChangeFlag || catVerifiedChangeFlag) {
          catObj.category = categoryChanges.category || catObj.category;
          categorizedHashtagHashMap.set(catObj.nodeId, catObj);
        }
      }
    }
  });

  return;
}

let stdin;

function initStdIn() {
  return new Promise(function (resolve) {
    console.log(PF + " | STDIN ENABLED");

    stdin = process.stdin;

    if (stdin.setRawMode !== undefined) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", async function (key) {
      switch (key) {
        case "\u0003":
          process.exit();
          break;
        case "t":
          configuration.testMode = !configuration.testMode;
          console.log(
            chalkAlert(PF + " | TEST MODE: " + configuration.testMode)
          );
          break;
        case "x":
          saveSampleTweetFlag = true;
          console.log(chalkAlert(PF + " | SAVE SAMPLE TWEET"));
          break;
        case "v":
          configuration.verbose = !configuration.verbose;
          console.log(chalkAlert(PF + " | VERBOSE: " + configuration.verbose));
          break;
        case "q":
          await quit();
          break;
        case "Q":
          await quit();
          break;
        case "s":
          showStats();
          break;
        case "S":
          showStats(true);
          break;
        default:
          console.log(
            chalkAlert(
              PF +
                "\n" +
                "q/Q: quit" +
                "\n" +
                "s: showStats" +
                "\n" +
                "S: showStats verbose" +
                "\n" +
                "v: verbose log"
            )
          );
      }
    });

    resolve();
  });
}

function initIgnoreWordsHashMap() {
  return new Promise(function (resolve, reject) {
    async.each(
      ignoreWordsArray,
      function ignoreWordHashMapSet(ignoreWord, cb) {
        ignoreWordHashMap.set(ignoreWord, true);
        ignoreWordHashMap.set(ignoreWord.toLowerCase(), true);
        cb();
      },
      function ignoreWordHashMapError(err) {
        if (err) {
          console.log(
            chalkError(PF + " | *** initIgnoreWordsHashMap ERROR: " + err)
          );
          return reject(err);
        }
        resolve();
      }
    );
  });
}

let memStatsInterval;

async function initThreeceeTwitterUser(threeceeUser) {
  console.log(
    chalkTwitter(PF + " | ... INIT THREECEE TWITTER USER: " + threeceeUser)
  );

  console.log(
    chalkTwitter(
      `${PF} | ... LOADING TWITTER CONFIG | @${threeceeUser} | FILE: ${twitterConfigFolder}`
    )
  );

  const configFile = threeceeUser + ".json";

  try {
    threeceeTwitter.twitterConfig = await tcUtils.initTwitterConfig({
      folder: twitterConfigFolder,
      threeceeUser: threeceeUser,
    });

    twitterClient = await tcUtils.initTwitter({
      twitterConfig: threeceeTwitter.twitterConfig,
    });
    await tcUtils.getTwitterAccountSettings();

    console.log(
      chalkTwitter(`${PF} | +++ TWITTER INITIALIZED | @${threeceeUser}`)
    );

    threeceeTwitter.ready = true;
    threeceeTwitter.status = false;
    threeceeTwitter.error = false;

    statsObj.threeceeUsersConfiguredFlag = true;

    return threeceeUser;
  } catch (err) {
    if (err.code == "88") {
      console.log(
        chalkError(`${PF} | !!! TWITTER RATE LIMIT | @${threeceeUser}`)
      );
      return;
    }
    if (err.code == "ENOTFOUND") {
      console.log(
        chalkError(
          `${PF} | *** LOAD TWITTER CONFIG ERROR: FILE NOT FOUND: ${twitterConfigFolder}/${configFile}`
        )
      );
    } else {
      console.log(chalkError(`${PF} | *** LOAD TWITTER CONFIG ERROR: ${err}`));
    }

    threeceeTwitter.error = "CONFIG LOAD ERROR: " + err;
    threeceeTwitter.ready = false;
    threeceeTwitter.twit = false;
    threeceeTwitter.status = false;

    throw err;
  }
}

async function deleteUser(params) {
  const results = await global.wordAssoDb.User.deleteOne({
    nodeId: params.user.nodeId,
  });

  if (results.deletedCount > 0) {
    deletedUsersSet.add(params.user.nodeId);
    statsObj.user.deleted = deletedUsersSet.size;

    console.log(
      chalkAlert(
        PF +
          " | XXX USER | -*- DB HIT" +
          " [" +
          statsObj.user.deleted +
          " DELETED USERS SET]" +
          " | " +
          params.user.nodeId +
          " | @" +
          params.user.screenName
      )
    );
  } else {
    console.log(
      chalkAlert(
        PF +
          " | XXX USER | --- DB MISS" +
          " | " +
          params.user.nodeId +
          " | @" +
          params.user.screenName
      )
    );
  }

  return;
}

// initStats(function setCacheObjKeys() {
//   cacheObjKeys = Object.keys(statsObj.caches);
// });

function allTrue(p) {
  return new Promise(function (resolve) {
    const params = p || {};

    let waitTime = 0;

    params.interval = params.interval || 10 * ONE_SECOND;
    params.maxIntervalWait = params.maxIntervalWait || 5 * ONE_SECOND;

    console.log(
      chalkLog(
        PF +
          " | ... WAIT ALL TRUE TIMEOUT | " +
          msToTime(params.maxIntervalWait)
      )
    );

    const waitInterval = setInterval(function () {
      if (statsObj.initSetsComplete) {
        clearInterval(waitInterval);
        resolve(true);
      }

      waitTime += params.interval;

      if (waitTime >= params.maxIntervalWait) {
        clearInterval(waitInterval);
        console.log(
          chalkAlert(PF + " | ALL TRUE TIMEOUT | " + msToTime(waitTime))
        );
        return resolve(false);
      }
    }, params.interval);
  });
}

const watchOptions = {
  ignoreDotFiles: true,
  ignoreUnreadableDir: true,
  ignoreNotPermitted: true,
};

let initBotSetTimeout;

const botBlockListFileRegex = RegExp("block-list");

async function initWatchConfig() {
  statsObj.status = "INIT WATCH CONFIG";

  console.log(chalkLog(PF + " | ... INIT WATCH"));

  const loadConfig = async function (f) {
    try {
      debug(
        chalkInfo(
          PF + " | +++ FILE CREATED or CHANGED | " + getTimeStamp() + " | " + f
        )
      );

      if (f.endsWith("wordAssoServerConfig.json")) {
        await loadAllConfigFiles();

        const configArgs = Object.keys(configuration);

        for (const arg of configArgs) {
          if (_.isObject(configuration[arg])) {
            console.log(
              PF +
                " | _FINAL CONFIG | " +
                arg +
                "\n" +
                jsonPrint(configuration[arg])
            );
          } else {
            console.log(
              PF + " | _FINAL CONFIG | " + arg + ": " + configuration[arg]
            );
          }
        }
      }

      if (f.endsWith(bestRuntimeNetworkFileName)) {
        await loadBestRuntimeNetwork();
      }

      if (f.endsWith(followableSearchTermFile)) {
        await initFollowableSearchTermSet();
      }

      if (f.endsWith(ignoredProfileWordsFile)) {
        await initIgnoredProfileWords();
      }

      if (botBlockListFileRegex.test(f)) {
        console.log(
          chalkAlert(
            PF + " | BOT BLOCK FILE CHANGED | " + getTimeStamp() + " | " + f
          )
        );

        clearTimeout(initBotSetTimeout);

        initBotSetTimeout = setTimeout(async function () {
          await initBotSet();
        }, ONE_MINUTE);
      }
    } catch (err) {
      console.log(
        chalkError(PF + " | *** LOAD ALL CONFIGS ON CREATE ERROR: " + err)
      );
    }
  };

  watch.createMonitor(configHostFolder, watchOptions, function (monitor) {
    monitor.on("created", loadConfig);
    monitor.on("changed", loadConfig);
  });

  watch.createMonitor(configDefaultFolder, watchOptions, function (monitor) {
    monitor.on("created", loadConfig);
    monitor.on("changed", loadConfig);
  });

  watch.createMonitor(bestNetworkFolder, watchOptions, function (monitor) {
    monitor.on("created", loadConfig);
    monitor.on("changed", loadConfig);
    monitor.on("removed", function (f) {
      console.log(
        chalkAlert(PF + " | XXX FILE DELETED | " + getTimeStamp() + " | " + f)
      );
    });
  });

  watch.createMonitor(botsFolder, watchOptions, function (monitor) {
    monitor.on("created", loadConfig);
    monitor.on("changed", loadConfig);
  });

  return;
}

setTimeout(async function () {
  console.log(
    chalkBlue(
      `${PF} | ... WAIT START TIMEOUT: ${msToTime(DEFAULT_START_TIMEOUT)}`
    )
  );

  try {
    global.dbConnection = await mgUtils.connectDb();

    await initSlackWebClient();

    const cnf = await initConfig();

    configuration = deepcopy(cnf);

    if (empty(configuration.twitter)) {
      configuration.twitter = {};
    }

    await initStats();

    await initStatsUpdate(configuration);
    statsObj.configuration = configuration;

    cacheObjKeys = Object.keys(statsObj.caches);

    configEvents.emit("DB_CONNECT");

    console.log(
      chalkTwitter(PF + " | PROCESS NAME: " + configuration.processName)
    );

    configuration.isPrimaryHost = hostname === configuration.primaryHost;
    configuration.isDatabaseHost = hostname === configuration.databaseHost;
    configuration.primaryHostSuffix = configuration.isPrimaryHost
      ? "-primary"
      : "";

    console.log(
      chalkBlueBold(
        PF +
          " | PROCESS: " +
          configuration.processName +
          " | HOST: " +
          hostname +
          " | PRIMARY HOST: " +
          configuration.primaryHost +
          " | DATABASE HOST: " +
          configuration.databaseHost +
          " | STARTED " +
          getTimeStamp()
      )
    );

    statsObj.status = "START";

    // slackText = "*WAS START*";
    // await slackSendWebMessage({ channel: slackChannel, text: slackText });

    await killAll();
    await allTrue();

    await initMongoIndexChild({ childId: DEFAULT_MGI_CHILD_ID });
    await initKeySortInterval(configuration.keySortInterval);
    await tcUtils.initSaveFileQueue({ interval: 100 });
    await initThreeceeTwitterUser("altthreecee00");
    // await initThreeceeTwitterUser("threecee");
    pubSubClient = await initPubSub();

    await initIgnoreWordsHashMap();
    await initAllowLocations();
    await initIgnoreLocations();
    await initIgnoredProfileWords();
    await initUpdateUserSetsInterval();
    await initUpdateHashtagSetsInterval();
    await loadBestRuntimeNetwork();
    if (hostname === configuration.databaseHost) {
      await initNodeSetPropsQueueInterval(
        configuration.nodeSetPropsQueueInterval
      );
    }
    await initTransmitNodeQueueInterval(
      configuration.transmitNodeQueueInterval
    );
    await initRateQinterval(configuration.rateQueueInterval);
    await initTwitterRxQueueInterval(configuration.twitterRxQueueInterval);
    await initTweetParserMessageRxQueueInterval(
      configuration.tweetParserMessageRxQueueInterval
    );
    await initSorterMessageRxQueueInterval(
      configuration.sorterMessageRxQueueInterval
    );
    await initDbuChild({ childId: DEFAULT_DBU_CHILD_ID });
    await initDbHashtagChangeStream();
    await initTweetParser({ childId: DEFAULT_TWP_CHILD_ID });
    await initWatchConfig();

    if (pubSubClient) {
      const [topics] = await pubSubClient.getTopics();
      topics.forEach((topic) =>
        console.log(chalkLog(PF + " | PUBSUB TOPIC: " + topic.name))
      );

      const [subscriptions] = await pubSubClient.getSubscriptions();
      subscriptions.forEach((subscription) =>
        console.log(chalkLog(PF + " | PUBSUB SUB: " + subscription.name))
      );
    }

    await initNodeOpHandler({
      subscribeName: "node-search-result" + configuration.primaryHostSuffix,
    });
    await initNodeOpHandler({
      subscribeName: "node-setprops-result" + configuration.primaryHostSuffix,
    });
    await initNodeOpHandler({
      subscribeName: "node-delete" + configuration.primaryHostSuffix,
    });

    await initDbUserChangeStream();

    statsObj.internetReady = true;
    configEvents.emit("INTERNET_READY");

    await initBotSet();

    await initTssChild({
      childId: DEFAULT_TSS_CHILD_ID,
      tweetVersion2: configuration.tweetVersion2,
      threeceeUser: threeceeUser,
    });

    await initHeartbeatInterval();
    // await initUpdateUserSetsInterval();
    await initPassport();
  } catch (err) {
    console.trace(
      chalkError(
        PF + " | **** INIT CONFIG ERROR: " + err + "\n" + jsonPrint(err)
      )
    );
    if (err.code != 404) {
      console.log(PF + " | *** INIT CONFIG ERROR | err.code: " + err.code);
      await quit();
    }
  }
}, DEFAULT_START_TIMEOUT);

module.exports = {
  app: app,
  io: io,
  http: httpServer,
};
