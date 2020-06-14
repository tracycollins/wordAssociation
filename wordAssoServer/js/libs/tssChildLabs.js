/*jslint node: true */
/*jshint sub:true*/

const MODULE_ID_PREFIX = "TSS";

const ignoredHashtagFile = "ignoredHashtag.txt";
const followableSearchTermFile = "followableSearchTerm.txt";
const ignoreLocationsFile = "ignoreLocations.txt";
const allowLocationsFile = "allowLocations.txt";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 5;
const DEFAULT_STREAM_DATA_QUEUE_INTERVAL = 5;

const TWEET_ID_CACHE_DEFAULT_TTL = 60;
const TWEET_ID_CACHE_CHECK_PERIOD = 10;

// const TWITTER_MAX_TRACKING_NUMBER = 400;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;
const ONE_HOUR = ONE_MINUTE*60;
const ONE_DAY = ONE_HOUR*24;

const DEFAULT_SEARCH_TERM_UPDATE_INTERVAL = ONE_DAY;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

// const mangledRegEx = /\u00C3.\u00C2|\u00B5/g;

const os = require("os");
const debug = require("debug")("tss");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");

const chalk = require("chalk");
const chalkBlue = chalk.blue;
const chalkBlueBold = chalk.blue.bold;
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.yellow;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;


const request = require("request");
const util = require("util");

const get = util.promisify(request.get);
const post = util.promisify(request.post);

const path = require("path");
const empty = require("is-empty");
const watch = require("watch");
const yj = require("yieldable-json");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

// const _ = require("lodash");
const async = require("async");
const Twit = require("twit");

// TWITTER LABS NEW STREAMING INTERFACE

const bearerTokenURL = new URL("https://api.twitter.com/oauth2/token");
const streamURL = new URL("https://api.twitter.com/labs/1/tweets/stream/filter");
const rulesURL = new URL("https://api.twitter.com/labs/1/tweets/stream/filter/rules");

const moment = require("moment");
const treeify = require("treeify");
const Measured = require("measured");
const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");

const followingUserIdHashMap = new HashMap();

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
let dbConnection;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

const UserServerController = require("@threeceelabs/user-server-controller");
const userServerController = new UserServerController(MODULE_ID_PREFIX + "_USC");

userServerController.on("error", function(err){
  console.log(chalkError(MODULE_ID_PREFIX + " | *** USC ERROR | " + err));
});

userServerController.on("ready", function(appname){
  console.log(chalk.green(MODULE_ID_PREFIX + " | USC READY | " + appname));
});


let DROPBOX_ROOT_FOLDER;

if (hostname == "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
}
else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
}

const configDefaultFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility/default");
const configHostFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility", hostname);

const statsHostFolder = path.join(DROPBOX_ROOT_FOLDER, "stats", hostname);
const twitterConfigFolder = path.join(DROPBOX_ROOT_FOLDER, "config/twitter");

const DROPBOX_DEFAULT_SEARCH_TERMS_DIR = "/config/utility/default";
const DROPBOX_DEFAULT_SEARCH_TERMS_FILE = "followableSearchTerm.txt";

let followableSearchTermSet = new Set();

let tweetIdCacheTtl = process.env.TWEET_ID_CACHE_DEFAULT_TTL;
if (tweetIdCacheTtl === undefined) { tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL; }
console.log("TSS | USER CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (tweetIdCacheCheckPeriod === undefined) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD; }
console.log("TSS | USER CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod
});

const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
const tcUtils = new ThreeceeUtilities("WAS_TSS_TCU");

const ignoreUserSet = new Set();
let allowLocationsSet = new Set();
let ignoredHashtagSet = new Set();

let ignoreLocationsSet = new Set();
ignoreLocationsSet.add("india");
ignoreLocationsSet.add("africa");
ignoreLocationsSet.add("canada");
ignoreLocationsSet.add("britain");
ignoreLocationsSet.add("mumbai");
ignoreLocationsSet.add("london");
ignoreLocationsSet.add("england");
ignoreLocationsSet.add("nigeria");
ignoreLocationsSet.add("lagos");

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

process.on("disconnect", function() {
  quit("DISCONNECT");
});

let twitterSearchInit = false;

const tweetQueue = [];
let tweetSendReady = true;
let tweetQueueInterval;

const streamDataQueue = [];
let streamDataQueueReady = true;
let streamDataQueueInterval;

let configuration = {};
configuration.filterDuplicateTweets = true;
configuration.verbose = false;
configuration.forceFollow = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode
configuration.searchTermsUpdateInterval = DEFAULT_SEARCH_TERM_UPDATE_INTERVAL;
configuration.twitterQueueIntervalTime = DEFAULT_TWITTER_QUEUE_INTERVAL;
configuration.followQueueIntervalTime = 5*ONE_SECOND;
configuration.ignoreQueueInterval = 15 * ONE_SECOND;
configuration.maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
let maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;

configuration.sendMessageTimeout = ONE_SECOND;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initSearchTermsTimeout = Number(ONE_MINUTE);
configuration.initIgnoreLocationsTimeout = Number(ONE_MINUTE);
configuration.twitterFollowLimitTimeout = 15*ONE_MINUTE;

configuration.twitterConfig = {};

const threeceeUserObj = {};

threeceeUserObj.twitterConfig = {};
threeceeUserObj.twitterConfig.screenName = "altthreecee00";
threeceeUserObj.twitterConfig.CONSUMER_KEY = "ex0jSXayxMOjNm4DZIiic9Nc0";
threeceeUserObj.twitterConfig.consumer_key = "ex0jSXayxMOjNm4DZIiic9Nc0";
threeceeUserObj.twitterConfig.CONSUMER_SECRET = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa";
threeceeUserObj.twitterConfig.consumer_secret = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa";
threeceeUserObj.twitterConfig.TOKEN = "848591649575927810-2MYMejf0VeXwMkQELca6uDqXUkfxKow";
threeceeUserObj.twitterConfig.access_token = "848591649575927810-2MYMejf0VeXwMkQELca6uDqXUkfxKow";
threeceeUserObj.twitterConfig.TOKEN_SECRET = "NL5UBvP2QFPH9fYe7MUZleH24RoMoErfbDTrJNglrEidB";
threeceeUserObj.twitterConfig.access_token_secret = "NL5UBvP2QFPH9fYe7MUZleH24RoMoErfbDTrJNglrEidB";

threeceeUserObj.screenName = "altthreecee00";

threeceeUserObj.stats = {};
threeceeUserObj.stats.ready = false;
threeceeUserObj.stats.error = false;
threeceeUserObj.stats.connected = false;
threeceeUserObj.stats.authenticated = false;
threeceeUserObj.stats.twitterTokenErrorFlag = false;

let rateLimited = false;

threeceeUserObj.stats.twitterConnects = 0;
threeceeUserObj.stats.twitterReconnects = 0;
threeceeUserObj.stats.twitterFollowLimit = false;
threeceeUserObj.stats.twitterLimit = 0;
threeceeUserObj.stats.twitterErrors = 0;
threeceeUserObj.stats.rateLimited = false;

threeceeUserObj.rateLimit = {};

const rateMeter = Measured.createCollection();

rateMeter.meter("rawTweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
rateMeter.meter("rawTweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

threeceeUserObj.trackingNumber = 0;
threeceeUserObj.followUserScreenNameSet = new Set();
threeceeUserObj.followUserIdSet = new Set();
threeceeUserObj.searchTermSet = new Set();

const jsonPrint = function (obj){
  if (obj) {
    return treeify.asTree(obj, true, true);
  }
  else {
    return "UNDEFINED";
  }
};

console.log(
  "\n\nTSS | ====================================================================================================\n" 
  + process.argv[1] 
  + "\nTSS | PROCESS ID:    " + process.pid 
  + "\nTSS | PROCESS TITLE: " + process.title 
  + "\nTSS | " + "====================================================================================================\n" 
);

if (debug.enabled) {
  console.log("\nTSS | %%%%%%%%%%%%%%\nTSS | %%%%%%% DEBUG ENABLED %%%%%%%\nTSS | %%%%%%%%%%%%%%\n");
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

const statsObj = {};

statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.maxHeap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.queues = {};
statsObj.queues.tweetQueue = {};
statsObj.queues.tweetQueue.size = 0;
statsObj.queues.tweetQueue.fullEvents = 0;
// let fullEvents = 0;
statsObj.queues.followQueue = {};
statsObj.queues.followQueue.size = 0;
statsObj.queues.followQueue.fullEvents = 0;
statsObj.queues.unfollowQueue = {};
statsObj.queues.unfollowQueue.size = 0;
statsObj.queues.unfollowQueue.fullEvents = 0;

statsObj.tweetsReceived = 0;
statsObj.retweetsReceived = 0;
statsObj.quotedTweetsReceived = 0;
statsObj.tweetsPerSecond = 0.0;
statsObj.tweetsPerMinute = 0.0;
statsObj.maxTweetsPerMinute = 0;
statsObj.maxTweetsPerMinuteTime = moment().valueOf();

statsObj.twitter = {};
statsObj.twitter.duplicateTweetsReceived = 0;
// let duplicateTweetsReceived = 0;
statsObj.twitter.deletes = 0;
statsObj.twitter.connects = 0;
statsObj.twitter.disconnects = 0;
statsObj.twitter.reconnects = 0;
statsObj.twitter.warnings = 0;
statsObj.twitter.errors = 0;
statsObj.twitter.limit = 0;
statsObj.twitter.scrubGeo = 0;
statsObj.twitter.statusWithheld = 0;
statsObj.twitter.userWithheld = 0;
statsObj.twitter.limitMax = 0;
statsObj.twitter.limitMaxTime = moment().valueOf();

async function connectDb(){

  try {

    statsObj.status = "CONNECTING MONGO DB";

    console.log(chalkBlueBold(MODULE_ID_PREFIX + " | CONNECT MONGO DB ..."));

    const db = await wordAssoDb.connect(MODULE_ID_PREFIX + "_" + process.pid);

    db.on("error", async function(err){
      statsObj.status = "MONGO ERROR";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION ERROR: " + err));
    });

    db.on("close", async function(){
      statsObj.status = "MONGO CLOSED";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION CLOSED"));
    });

    db.on("disconnected", async function(){
      statsObj.status = "MONGO DISCONNECTED";
      statsObj.dbConnectionReady = false;
      console.log(chalkAlert(MODULE_ID_PREFIX + " | *** MONGO DB DISCONNECTED"));
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

// ==================================================================
// DROPBOX
// ==================================================================

if (process.env.DROPBOX_DEFAULT_SEARCH_TERMS_DIR !== undefined) {
  configuration.searchTermsDir = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
}
else {
  configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
}

if (process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE !== undefined) {
  configuration.searchTermsFile = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
}
else {
  configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
}

const DROPBOX_TSS_CONFIG_FILE = process.env.DROPBOX_TSS_CONFIG_FILE || "twitterSearchStreamConfig.json";
const DROPBOX_TSS_STATS_FILE = process.env.DROPBOX_TSS_STATS_FILE || "twitterSearchStreamStats.json";

const statsFile = DROPBOX_TSS_STATS_FILE;

const dropboxConfigFolder = "/config/utility";
const dropboxConfigFile = hostname + "_" + DROPBOX_TSS_CONFIG_FILE;

console.log("TSS | DROPBOX_TSS_CONFIG_FILE: " + DROPBOX_TSS_CONFIG_FILE);

debug("TSS | dropboxConfigFolder : " + dropboxConfigFolder);
debug("TSS | dropboxConfigFile : " + dropboxConfigFile);

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
    console.log(chalkAlert("TSS | getTimeStamp INVALID DATE: " + inputTime));
    return null;
  }
}

function showStats(options){

  threeceeUserObj.stats.rateLimited = rateLimited;

  statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
  statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

  // statsObj.tweetsReceived = tweetsReceived;
  // statsObj.retweetsReceived = retweetsReceived;
  // statsObj.quotedTweetsReceived = quotedTweetsReceived;
  // statsObj.twitter.duplicateTweetsReceived = duplicateTweetsReceived;

  // statsObj.queues.tweetQueue.fullEvents = fullEvents;

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (statsObj.tweetsPerMinute > statsObj.maxTweetsPerMinute) {
    statsObj.maxTweetsPerMinute = statsObj.tweetsPerMinute;
    statsObj.maxTweetsPerMinuteTime = moment().valueOf();
    console.log(chalk.blue("TSS | NEW MAX TPM"
      + " | " + moment().format(compactDateTimeFormat)
      + " | " + statsObj.tweetsPerMinute.toFixed(0)
    ));
  }

  if (options) {
    console.log("TSS | STATS\n" + jsonPrint(statsObj));

    console.log("TSS | @" + threeceeUserObj.screenName
      + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
    );

    console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
      + " | FOLLOW USER ID SET: " + threeceeUserObj.followUserIdSet.size
    ));

  }
  else {
    console.log(chalkLog("TSS | S"
      + " | ELPSD " + msToTime(statsObj.elapsed)
      + " | START " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | TWEET Q: " + tweetQueue.length
      + "\nTSS | " + statsObj.tweetsReceived + " Ts"
      + " | " + statsObj.tweetsPerSecond.toFixed(1) + " TPS"
      + " | " + statsObj.tweetsPerMinute.toFixed(0) + " TPM"
      + " | " + statsObj.maxTweetsPerMinute.toFixed(0) + " MAX"
      + " " + moment(parseInt(statsObj.maxTweetsPerMinuteTime)).format(compactDateTimeFormat)
      + " \nTSS | TWITTER LIMIT: " + statsObj.twitter.limit
      + " | " + statsObj.twitter.limitMax + " MAX"
      + " " + moment(parseInt(statsObj.twitter.limitMaxTime)).format(compactDateTimeFormat)
    ));

    console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
      + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
    ));

    console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
      + " | FOLLOW USER ID SET: " + threeceeUserObj.followUserIdSet.size
    ));

  }
}

function quit(message) {

  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.log("TSS | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TSS CHILD: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if (dbConnection !== undefined) {

    dbConnection.close(function () {
      console.log(chalkAlert(
            "TSS | =========================="
        + "\nTSS | MONGO DB CONNECTION CLOSED"
        + "\nTSS | =========================="
      ));

      process.exit(exitCode);
    });
  }
  else {
    process.exit(exitCode);
  }
}

function initStatsUpdate(cnf){

  return new Promise(function(resolve, reject){

    console.log(chalkInfo("TSS | TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

    try{

      setInterval(async function () {

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;
        statsObj.timeStamp = moment().format(defaultDateTimeFormat);

        threeceeUserObj.stats.rateLimited = rateLimited;

        statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
        statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

        // statsObj.tweetsReceived = tweetsReceived;
        // statsObj.retweetsReceived = retweetsReceived;
        // statsObj.quotedTweetsReceived = quotedTweetsReceived;
        // statsObj.twitter.duplicateTweetsReceived = duplicateTweetsReceived;

        // statsObj.queues.tweetQueue.fullEvents = fullEvents;

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;

        if (statsObj.tweetsPerMinute > statsObj.maxTweetsPerMinute) {
          statsObj.maxTweetsPerMinute = statsObj.tweetsPerMinute;
          statsObj.maxTweetsPerMinuteTime = moment().valueOf();
          console.log(chalk.blue("TSS | NEW MAX TPM"
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + statsObj.tweetsPerMinute.toFixed(0)
          ));
        }

        showStats();

        await tcUtils.saveFile({localFlag: true, folder: statsHostFolder, file: statsFile, obj: statsObj});

      }, cnf.statsUpdateIntervalTime);

      resolve(cnf);
    }
    catch(err){
      reject(err);
    }
  });
}

function printUserObj(title, u) {

  const user = userDefaults(u);

  console.log(chalkLog(title
    + " | U " + user.userId
    + " | @" + user.screenName
    + " | N " + user.name 
    + " | L " + user.location 
    + " | FWs " + user.followersCount
    + " | FDs " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + getTimeStamp(user.lastSeen)
    + " | FW " + user.following 
    + " | 3C " + user.threeceeFollowing 
    + " | C M " + user.category + " A " + user.categoryAuto
  ));
}

const userDefaults = function (user){
  return user;
};

const rateLimitHashMap = {};

function twitStreamPromise(params){

  return new Promise(function(resolve, reject){

    const resource_endpoint = params.resource + "_" + params.endPoint;
    const resourceEndpoint = params.resource + "/" + params.endPoint;

    if (rateLimitHashMap[resource_endpoint] && rateLimitHashMap[resource_endpoint].exceptionFlag){
      return resolve();
    }

    if (!rateLimitHashMap[resource_endpoint] || rateLimitHashMap[resource_endpoint] == undefined) {
      rateLimitHashMap[resource_endpoint] = {};
    }

    rateLimitHashMap[resource_endpoint].exceptionFlag = false;

    threeceeUserObj.twitStream.get(resourceEndpoint, params.twitParams, async function(err, data, response) {

      if (err){
        console.log(chalkError("TSS | *** TWITTER STREAM ERROR"
          + " | @" + threeceeUserObj.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

        if (err.code) {
          if (err.code == 88) {

            rateLimitHashMap[resource_endpoint].exceptionFlag = true;

            const rateLimitEndEvent = "rateLimitEnd_" + resource_endpoint;

            tcUtils.emitter.once(rateLimitEndEvent, function(){

              console.log(chalkError("TSS | -X- TWITTER STREAM RATE LIMIT END"
                + " | @" + threeceeUserObj.screenName
                + " | " + getTimeStamp()
                + " | EVENT: " + rateLimitEndEvent
              ));

              const key = rateLimitEndEvent.replace("rateLimitEnd_", "");

              rateLimitHashMap[key].exceptionFlag = false;

            });
          }

          await tcUtils.handleTwitterError({user: "altthreecee00", err: err, resource: params.resource, endPoint: params.endPoint});

          resolve();
        }

        if (configuration.verbose) {
          console.log("TSS | response\n" + jsonPrint(response));
        }

        threeceeUserObj.stats.error = err;
        threeceeUserObj.stats.twitterErrors += 1;

        return reject(err);
      }

      threeceeUserObj.stats.error = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = false;

      resolve(data);

    });
  });
}

function initFollowUserIdSet(){

  return new Promise(function(resolve, reject){

    let userIndex = 0;

    async.eachSeries([...threeceeUserObj.followUserIdSet], function(userId, cb){

      userIndex += 1;

      if (configuration.testMode && (userIndex > 100)){
        return cb();
      }

      if (followingUserIdHashMap.has(userId)){

        const threeceeFollowingInHashMap = followingUserIdHashMap.get(userId);

        if (threeceeFollowingInHashMap != threeceeUserObj.screenName) {

          console.log(chalkLog("TSS | !!! TWITTER USER FOLLOW MISMATCH"
            + " | UID: " + userId
            + " | IN HM: 3C @" + threeceeFollowingInHashMap
            + " | CUR 3C @: " + threeceeUserObj.screenName
          ));

          return cb();

        }
        else {
          console.log(chalkLog("TSS | ??? TWITTER USER FOLLOW HM HIT"
            + " | UID: " + userId
            + " | IN HM: 3C @" + threeceeFollowingInHashMap
            + " | CUR 3C @: " + threeceeUserObj.screenName
          ));

          return cb();
        }

      }
      else {

        followingUserIdHashMap.set(userId, threeceeUserObj.screenName);

        wordAssoDb.User.findOne({ userId: userId }, function (err, user) {

          if (err) { 
            console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
            return cb(err);
          }

          if (user) {

            threeceeUserObj.followUserScreenNameSet.add(user.screenName.toLowerCase());

            if (configuration.verbose || (userIndex % 100 == 0)) {
              const printString = "TSS | [ " + userIndex + "/" + threeceeUserObj.followUserIdSet.size + " ] @" + threeceeUserObj.screenName + " | DB HIT";
              printUserObj(printString, user);
            }

            if (!user.following) { 
              user.following = true;
              user.threeceeFollowing = threeceeUserObj.screenName;
              user.markModified("following");
              user.markModified("threeceeFollowing");
              user.save(function(err){
                if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                cb();
              });
            }
            else if (user.following && (user.threeceeFollowing > threeceeUserObj.screenName)) {
              console.log(chalk.black("TSS | -X- CHANGE 3C FOLLOWING"
                + " | UID: " + user.userId
                + " | @" + user.screenName
                + " | 3C @" + user.threeceeFollowing + " -> " + threeceeUserObj.screenName
              ));
              user.threeceeFollowing = threeceeUserObj.screenName;
              user.markModified("threeceeFollowing");
              user.save(function(err){
                if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                cb();
              });
            }
            else {
              cb();
            }

          }
          else {
            cb();
          }
        });
      }

    }, function(err){

      if (err){
        return reject(err);
      }

      process.send({
        op: "TWITTER_STATS", 
        threeceeUser: threeceeUserObj.screenName, 
        stats: threeceeUserObj.stats, 
        twitterFollowing: threeceeUserObj.followUserIdSet.size,
        twitterFriends: [...threeceeUserObj.followUserIdSet]
      });

      resolve(threeceeUserObj);

    });

  });
}

async function initTwit(){

  console.log(chalkLog("TSS | INIT TWIT USER @" + threeceeUserObj.screenName));

  console.log(chalkInfo("TSS | INIT TWIT | TWITTER CONFIG " 
    + "\n" + jsonPrint(threeceeUserObj.twitterConfig)
  ));

  threeceeUserObj.stats = {};
  threeceeUserObj.stats.ready = false;
  threeceeUserObj.stats.error = false;
  threeceeUserObj.stats.connected = false;
  threeceeUserObj.stats.authenticated = false;
  threeceeUserObj.stats.twitterTokenErrorFlag = false;
  threeceeUserObj.stats.tweetsReceived = 0;
  threeceeUserObj.stats.retweetsReceived = 0;
  threeceeUserObj.stats.quotedTweetsReceived = 0;
  threeceeUserObj.stats.twitterConnects = 0;
  threeceeUserObj.stats.twitterReconnects = 0;
  threeceeUserObj.stats.twitterFollowLimit = false;
  threeceeUserObj.stats.twitterLimit = 0;
  threeceeUserObj.stats.twitterErrors = 0;
  threeceeUserObj.stats.rateLimited = false;
  rateLimited = false;

  threeceeUserObj.stats.twitterRateLimit = 0;
  threeceeUserObj.stats.twitterRateLimitRemaining = 0;
  threeceeUserObj.stats.twitterRateLimitResetAt = 0;
  threeceeUserObj.stats.twitterRateLimitRemainingTime = 0;
  threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;

  threeceeUserObj.trackingNumber = 0;

  threeceeUserObj.followUserScreenNameSet = new Set();
  threeceeUserObj.followUserIdSet = new Set();

  const newTwitStream = new Twit({
    consumer_key: threeceeUserObj.twitterConfig.CONSUMER_KEY,
    consumer_secret: threeceeUserObj.twitterConfig.CONSUMER_SECRET,
    access_token: threeceeUserObj.twitterConfig.TOKEN,
    access_token_secret: threeceeUserObj.twitterConfig.TOKEN_SECRET
  });

  threeceeUserObj.twitStream = {};
  threeceeUserObj.twitStream = newTwitStream;

  threeceeUserObj.searchStream = false;
  threeceeUserObj.searchTermSet = new Set();

  console.log(chalkTwitter("TSS | INIT TWITTER USER"
    + " | NAME: " + threeceeUserObj.screenName
  ));

  const twitGetFriendsParams = {
    screen_name: threeceeUserObj.screenName,
    stringify_ids: true
  };

  try {

    await tcUtils.initTwitter(threeceeUserObj);

    const data = await twitStreamPromise({resource: "friends", endPoint: "ids", twitParams: twitGetFriendsParams});

    threeceeUserObj.stats.error = false;
    threeceeUserObj.stats.authenticated = true;
    threeceeUserObj.stats.twitterTokenErrorFlag = false;

    if (!data || data == undefined) {

      console.log(chalkAlert("TSS | !!! EMPTY TWITTER GET FRIENDS IDS"
        + " | @" + threeceeUserObj.screenName
        + " | followUserIdSet: " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
      ));

      if (threeceeUserObj.followUserIdSet.size === 0){
        return;
      }
    }
    else{
      threeceeUserObj.followUserIdSet = new Set(data.ids);
    }

    console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
      + " | @" + threeceeUserObj.screenName
      + " | " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
    ));

    await initFollowUserIdSet();

    return;

  }
  catch(err){
    console.log(chalkError("TSS | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
      + " | @" + threeceeUserObj.screenName
      + " | " + getTimeStamp()
      + " | CODE: " + err.code
      + " | STATUS CODE: " + err.statusCode
      + " | " + err.message
    ));

    threeceeUserObj.stats.error = err;
    threeceeUserObj.stats.twitterErrors += 1;
    threeceeUserObj.stats.authenticated = false;

    throw err;
  }
}

async function initTwitterUser(){

  console.log(chalkTwitter("TSS | TWITTER USER: @" + threeceeUserObj.screenName));

  try {
    await initTwit();
    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** TWIT INIT ERROR"
      + " | @" + threeceeUserObj.screenName
      + " | " + getTimeStamp()
      + " | " + err
    ));
    throw err;
  }
}

async function processTweet(params){

  const tweetObj = params.tweetObj;

  // ─ data
  // │  ├─ id: 1175639968674455552
  // │  ├─ created_at: 2019-09-22T05:16:25.000Z
  // │  ├─ text: RT @AOC: At this point, the bigger national scandal isn’t the president’s lawbreaking behavior - it is the Democratic Party’s refusal to im…
  // │  ├─ author_id: 229661564
  // │  ├─ referenced_tweets
  // │  │  └─ 0
  // │  │     ├─ type: retweeted
  // │  │     └─ id: 1175619319432196096
  // │  ├─ entities
  // │  │  └─ mentions
  // │  │     └─ 0
  // │  │        ├─ start: 3
  // │  │        ├─ end: 7
  // │  │        └─ username: AOC
  // │  ├─ stats
  // │  │  ├─ retweet_count: 9944
  // │  │  ├─ reply_count: 0
  // │  │  ├─ like_count: 0
  // │  │  └─ quote_count: 0
  // │  ├─ possibly_sensitive: false
  // │  ├─ lang: en
  // │  ├─ source: <a href="http://twitter.com/download/android" rel="nofollow">Twitter for Android</a>
  // │  └─ format: detailed
  // ├─ includes
  // │  └─ users
  // │     └─ 0
  // │        ├─ id: 229661564
  // │        ├─ created_at: 2010-12-23T00:30:07.000Z
  // │        ├─ name: Allison Cattewoof
  // │        ├─ username: AlphaShadow92
  // │        ├─ protected: false
  // │        ├─ location: In a small cardboard box
  // │        ├─ url: https://t.co/BC1jaSnozN
  // │        ├─ description: 27 | Demigirl, She/They | Ace/Panro | Art Demon | Polyam is Rad | Autistic punk | Big Soft Monster (aaa)
  // │        ├─ verified: false
  // │        ├─ entities
  // │        │  └─ url
  // │        │     └─ urls
  // │        │        └─ 0
  // │        │           ├─ start: 0
  // │        │           ├─ end: 23
  // │        │           ├─ url: https://t.co/BC1jaSnozN
  // │        │           ├─ expanded_url: https://twitch.tv/alphashadow92/
  // │        │           └─ display_url: twitch.tv/alphashadow92/
  // │        ├─ profile_image_url: https://pbs.twimg.com/profile_images/1168919706226561024/YUUTkuFc_normal.jpg
  // │        ├─ stats
  // │        │  ├─ followers_count: 286
  // │        │  ├─ following_count: 652
  // │        │  ├─ tweet_count: 74988
  // │        │  └─ listed_count: 3
  // │        ├─ most_recent_tweet_id: 1175639968674455552
  // │        ├─ pinned_tweet_id: 903805963416850432
  // │        └─ format: detailed
  // └─ matching_rules
  //    └─ 0
  //       ├─ id: 1175637227017318400
  //       └─ tag: impeach

  // + " | " + tweetObj.data.id
  // + " | CR: " + tcUtils.getTimeStamp(tweetObj.created_at)
  // + " | @" + tweetObj.includes.users[0].username
  // + " | LOC: " + tweetObj.includes.users[0].location
  // + " | FLWRs: " + tweetObj.includes.users[0].stats.followers_count
  // + " | FRNDs: " + tweetObj.includes.users[0].stats.following_count
  // + " | TWs: " + tweetObj.includes.users[0].stats.tweet_count

  const processedTweetObj = {};

  processedTweetObj.id_str = tweetObj.data.id.toString();
  processedTweetObj.created_at = tweetObj.data.created_at;
  processedTweetObj.text = tweetObj.data.text;
  processedTweetObj.lang = tweetObj.data.lang;
  processedTweetObj.entities = {};
  processedTweetObj.entities = tweetObj.data.entities;

  // !!!! KLUDGE: need to process inclues, that may contain userMentions with followers stats
  processedTweetObj.includes = {};
  processedTweetObj.includes = tweetObj.includes;
  processedTweetObj.user = {};
  processedTweetObj.user.id_str = tweetObj.includes.users[0].id.toString();
  processedTweetObj.user.created_at = tweetObj.includes.users[0].created_at;
  processedTweetObj.user.screen_name = tweetObj.includes.users[0].username.toLowerCase();
  processedTweetObj.user.name = tweetObj.includes.users[0].name;
  processedTweetObj.user.lang = tweetObj.includes.users[0].name;
  processedTweetObj.user.location = tweetObj.includes.users[0].location;
  processedTweetObj.user.profile_image_url = tweetObj.includes.users[0].profile_image_url;
  processedTweetObj.user.url = tweetObj.includes.users[0].url;
  processedTweetObj.user.description = tweetObj.includes.users[0].description;
  processedTweetObj.user.followers_count = tweetObj.includes.users[0].stats.followers_count;
  processedTweetObj.user.friends_count = tweetObj.includes.users[0].stats.following_count;
  processedTweetObj.user.statuses_count = tweetObj.includes.users[0].stats.tweet_count;
  processedTweetObj.user.statusId = tweetObj.includes.users[0].most_recent_tweet_id;
  processedTweetObj.user.verified = tweetObj.includes.users[0].verified;
  processedTweetObj.user.entities = {};
  processedTweetObj.user.entities = tweetObj.includes.users[0].entities;

  const prevTweetUser = tweetIdCache.get(processedTweetObj.id_str);

  if (prevTweetUser) {

    statsObj.twitter.duplicateTweetsReceived += 1;

    if (statsObj.twitter.duplicateTweetsReceived % 1000 == 0){
      console.log(chalkLog("TSS"
        + " | @" + threeceeUserObj.screenName
        + " | ??? DUP TWEET"
        + " | FILTER DUPs: " + configuration.filterDuplicateTweets
        + " [ $: " + tweetIdCache.getStats().keys + " / " + statsObj.twitter.duplicateTweetsReceived + " DUPs ]"
        + " | " + processedTweetObj.id_str 
        + " | CURR @" + processedTweetObj.user.screen_name
        + " | PREV @" + prevTweetUser
      ));
    }
    
    if (configuration.filterDuplicateTweets) { return; }
  }

  tweetIdCache.set(processedTweetObj.id_str, processedTweetObj.user.screen_name);

  threeceeUserObj.stats.rateLimited = false;

  rateMeter.meter("tweetsPerSecond").mark();
  rateMeter.meter("tweetsPerMinute").mark();

  statsObj.tweetsPerSecond = rateMeter.toJSON().tweetsPerSecond["1MinuteRate"];
  statsObj.tweetsPerMinute = rateMeter.toJSON().tweetsPerMinute["1MinuteRate"];

  statsObj.tweetsReceived+= 1;
  threeceeUserObj.stats.tweetsReceived += 1;

  if (processedTweetObj.retweeted_status) {
    statsObj.retweetsReceived += 1;
  }

  if (processedTweetObj.quoted_status) {
    statsObj.quotedTweetsReceived += 1;
  }

  if (tweetQueue.length < maxTweetQueue ) {

    tweetQueue.push(processedTweetObj);

    statsObj.queues.tweetQueue.size = tweetQueue.length;

  }
  else {
    statsObj.queues.tweetQueue.fullEvents += 1;
  }

  if (statsObj.tweetsReceived % 1000 == 0) {
    console.log(chalkTwitter("TSS | <T"
      + " | [PQ: " + tweetQueue.length + "]"
      + " | " + statsObj.tweetsPerMinute.toFixed(3) + " TPM"
      + " | TQ " + tweetQueue.length
      + " [ T/R/Q " + statsObj.tweetsReceived + "/" + statsObj.retweetsReceived + "/" + statsObj.quotedTweetsReceived + "]"
      + " | TW " + processedTweetObj.id_str
      + " | TLG " + processedTweetObj.lang
      + " | U " + processedTweetObj.user.id_str
      + " | @" + processedTweetObj.user.screen_name
      + " | " + processedTweetObj.user.name
      + " | ULG " + processedTweetObj.user.lang
      + " | LOC " + processedTweetObj.user.location
    ));
  }

  return processedTweetObj;
}

const consumer_key = "ex0jSXayxMOjNm4DZIiic9Nc0"; // Add your API key here
const consumer_secret = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa"; // Add your API secret key here

async function bearerToken () {
  const requestConfig = {
    url: bearerTokenURL,
    auth: {
      user: consumer_key,
      pass: consumer_secret,
    },
    form: {
      grant_type: "client_credentials",
    },
  };

  const response = await post(requestConfig);
  return JSON.parse(response.body).access_token;
}

async function getAllRules(token) {
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    }
  };

  const response = await get(requestConfig);
  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return JSON.parse(response.body);
}

async function deleteAllRules(rules, token) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map(function(rule){ return rule.id; });

  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: {
      delete: {
        ids: ids
      }
    }
  };

  const response = await post(requestConfig);
  if (response.statusCode !== 200) {
    throw new Error(JSON.stringify(response.body));
  }

  return response.body;
}

async function setRules(rules, token) {
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: {
      add: rules  
    }
  };

  const response = await post(requestConfig);
  if (response.statusCode !== 201) {
    throw new Error(JSON.stringify(response.body));
  }

  return response.body;
}

async function checkValidTweet(params){

  if (params.tweetObj.includes 
    && params.tweetObj.includes.users 
    && ignoreUserSet.has(params.tweetObj.includes.users[0].id.toString())
  ) {
    if (configuration.verbose) {
      console.log(chalkLog("TSS | XXX IGNORE USER | SKIPPING"
        + " | TWID: " + params.tweetObj.data.id.toString()
        + " | UID: " + params.tweetObj.includes.users[0].id.toString()
        + " | @" + params.tweetObj.includes.users[0].username
        + " | NAME: " + params.tweetObj.includes.users[0].name
      ));
    }
    return false;
  }

  if (ignoreLocationsSet.has(params.tweetObj.includes.users[0].location)) {
    if (configuration.verbose) {
      console.log(chalkLog("TSS | XXX IGNORE LOCATION | SKIPPING"
        + " | TWID: " + params.tweetObj.data.id.toString()
        + " | UID: " + params.tweetObj.includes.users[0].id.toString()
        + " | @" + params.tweetObj.includes.users[0].username
        + " | NAME: " + params.tweetObj.includes.users[0].name
        + " | LOC: " + params.tweetObj.includes.users[0].location
      ));
    }
    return false;
  }

  if (params.tweetObj.data.lang && (params.tweetObj.data.lang != "en")) {
    if (configuration.verbose) {
      console.log(chalkLog("TSS | XXX IGNORE LANG | SKIPPING"
        + " | TWID: " + params.tweetObj.data.id.toString()
        + " | LANG: " + params.tweetObj.data.lang
        + " | UID: " + params.tweetObj.includes.users[0].id.toString()
        + " | @" + params.tweetObj.includes.users[0].username
        + " | NAME: " + params.tweetObj.includes.users[0].name
      ));
    }
    return false;
  }

  return true;

}

async function processStreamData(data){

  try {

    yj.parseAsync(data, async function(err, dataObj){

      if (err){
        debug(chalkError(MODULE_ID_PREFIX + " | *** ERROR processStreamData parse json"));
        // console.error(err);
        return;
      }

      if (dataObj && dataObj.title && (dataObj.title === "Invalid Request")){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! TWITTER LABS INVALID REQUEST"
          + " | " + dataObj.title
          + " | TYPE: " + dataObj.type
          + " | DETAIL: " + dataObj.detail
        ));
        return;
      }

      if (dataObj && dataObj.title && (dataObj.title === "UsageCapExceeded")){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! TWITTER LABS USAGE CAP EXCEEDED"
          + " | ACCOUNT: " + dataObj.account_id
          + " | PRODUCT: " + dataObj.product_name
          + " | PERIOD: " + dataObj.period
        ));
        return;
      }

      if (dataObj && dataObj.title && (dataObj.title === "ConnectionException")){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! TWITTER LABS CONNECTION EXCEPTION"
          + " | ISSUE: " + dataObj.connection_issue
          + " | TYPE: " + dataObj.type
          + " | DETAIL: " + dataObj.detail
        ));
        return;
      }

      if (dataObj.errors) {
        console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! TWITTER LABS STREAM ERROR"
          + " | TYPE: " + dataObj.type
          + " | DETAIL: " + dataObj.detail
        ));
        return;
      }


      const validTweet = await checkValidTweet({tweetObj: dataObj});

      if (validTweet) {
        await processTweet({tweetObj: dataObj});
      }

      return;

    });
  }
  catch(err){
    statsObj.twitter.errors += 1;
    console.log(chalkError(MODULE_ID_PREFIX + " | !!! PROCESS STREAM DATA ERROR", err));
    return;
  }
}

function streamConnect(token) {

  const qs = {
    "format": "detailed",
    "user.format": "detailed",
    "tweet.format": "detailed",
    "place.format": "detailed",
    "expansions": "author_id,attachments.media_keys,in_reply_to_user_id,geo.place_id"
  };

  const auth = { bearer: token };

  const config = {
    url: streamURL,
    auth: auth,
    qs: qs,
    timeout: 20000,
  };

  console.log(chalkBlue(MODULE_ID_PREFIX + " | ... CONNECTING STREAM ..."));

  const stream = request.get(config);

  console.log(chalk.green(MODULE_ID_PREFIX + " | +++ STREAM CONNECTED | CONFIG\n" + jsonPrint(config)));
  console.log(chalk.green(MODULE_ID_PREFIX + " | +++ STREAM CONNECTED | RESPONSE HEADERS\n" + jsonPrint(stream.headers)));

  return stream;
}

async function initSearchStreamLabs(){

  // { 'value': 'impeach', 'tag': 'impeach'}
  // { 'value': 'theresistance OR fbr OR followbackresistance', 'tag': 'theresistance' },

  console.log(chalkInfo("TSS | INIT SEARCH STREAM"));

  const rules = [];

  let token;

  threeceeUserObj.filter = {};
  threeceeUserObj.filter.tags = {};
  threeceeUserObj.filter.tags.trump = {};
  threeceeUserObj.filter.tags.trump.valuesSet = new Set();
  threeceeUserObj.filter.tags.trump.valuesSet.add("djt");
  threeceeUserObj.filter.tags.trump.valuesSet.add("#djt");
  threeceeUserObj.filter.tags.trump.valuesSet.add("trump");
  threeceeUserObj.filter.tags.trump.valuesSet.add("#trump");
  threeceeUserObj.filter.tags.trump.valuesSet.add("donaldtrump");
  threeceeUserObj.filter.tags.trump.valuesSet.add("#donaldtrump");
  threeceeUserObj.filter.tags.trump.valuesSet.add("realdonaldtrump");
  threeceeUserObj.filter.tags.trump.valuesSet.add("@realdonaldtrump");
  threeceeUserObj.filter.tags.trump.valuesSet.add("melania");
  threeceeUserObj.filter.tags.trump.valuesSet.add("ivanka");
  threeceeUserObj.filter.tags.trump.valuesSet.add("melania");
  threeceeUserObj.filter.tags.trump.valuesSet.add("potus");
  threeceeUserObj.filter.tags.trump.valuesSet.add("@potus");
  // threeceeUserObj.filter.tags.trump.valuesSet.add("drumpf");
  // threeceeUserObj.filter.tags.trump.valuesSet.add("#drumpf");

  threeceeUserObj.filter.tags.impeach = {};
  threeceeUserObj.filter.tags.impeach.valuesSet = new Set();
  threeceeUserObj.filter.tags.impeach.valuesSet.add("impeach");
  threeceeUserObj.filter.tags.impeach.valuesSet.add("#impeach");
  // threeceeUserObj.filter.tags.impeach.valuesSet.add("#impeach45");
  threeceeUserObj.filter.tags.impeach.valuesSet.add("#impeachtrump");

  threeceeUserObj.filter.tags.government = {};
  threeceeUserObj.filter.tags.government.valuesSet = new Set();
  threeceeUserObj.filter.tags.government.valuesSet.add("congress");
  threeceeUserObj.filter.tags.government.valuesSet.add("senate");
  // threeceeUserObj.filter.tags.government.valuesSet.add("house of representatives");
  // threeceeUserObj.filter.tags.government.valuesSet.add("the white house");
  // threeceeUserObj.filter.tags.government.valuesSet.add("the supreme court");
  threeceeUserObj.filter.tags.government.valuesSet.add("scotus");
  threeceeUserObj.filter.tags.government.valuesSet.add("@scotus");
  threeceeUserObj.filter.tags.government.valuesSet.add("#scotus");
  // threeceeUserObj.filter.tags.government.valuesSet.add("judiciary");
  // threeceeUserObj.filter.tags.government.valuesSet.add("executive branch");

  threeceeUserObj.filter.tags.democrats = {};
  threeceeUserObj.filter.tags.democrats.valuesSet = new Set();
  threeceeUserObj.filter.tags.democrats.valuesSet.add("democrats");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#democrats");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("@democrats");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("dnc");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("@dnc");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#dnc");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("dems");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#dems");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("pelosi");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#pelosi");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("aoc");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#aoc");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("@aoc");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("bernie");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#bernie");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("berniesanders");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#berniesanders");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("lizwarren");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#lizwarren");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("ewarren");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#ewarren");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("warren");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("kamala");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#kamala");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("cory");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#cory");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("buttigieg");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#buttigieg");
  threeceeUserObj.filter.tags.democrats.valuesSet.add("#yanggang");

  threeceeUserObj.filter.tags.republicans = {};
  threeceeUserObj.filter.tags.republicans.valuesSet = new Set();
  threeceeUserObj.filter.tags.republicans.valuesSet.add("republicans");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("#republicans");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("gop");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("@gop");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("#gop");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("repub");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("repubs");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("vpotus");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("@pence");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("#pence");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("mcconnell");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("#mcconnell");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("@mcconnell");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("#senatemajldr");
  threeceeUserObj.filter.tags.republicans.valuesSet.add("@senatemajldr");

  threeceeUserObj.filter.tags.resistance = {};
  threeceeUserObj.filter.tags.resistance.valuesSet = new Set();
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#theresistance");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#voteblue");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#votebluenomatterwho");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#followbackresistance");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#fbr");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#geeksresist");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#lawyersresist");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#musiciansresist");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#neverthelesssheresisted");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#resistanceunited");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#resisttrump");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#resisttogether");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#vetsresist");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#vetsresistsquadron");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#vetsresistsupportsquadron");
  threeceeUserObj.filter.tags.resistance.valuesSet.add("#wearetheresistance");

  for(const tag of Object.keys(threeceeUserObj.filter.tags)){
    const value = [...threeceeUserObj.filter.tags[tag].valuesSet].join(" OR ");
    rules.push({value: value, tag: tag});
  }

  console.log(chalkInfo("TSS | INIT SEARCH STREAM FILTER + RULES"
    + " | @" + threeceeUserObj.screenName
    + "\n" + jsonPrint(threeceeUserObj.filter)
    + "\n" + jsonPrint(rules)
  ));

  try {
    // Exchange your credentials for a Bearer token
    token = await bearerToken({consumer_key, consumer_secret});

    // Gets the complete list of rules currently applied to the stream
    const currentRules = await getAllRules(token);
    
    // Delete all rules. Comment this line if you want to keep your existing rules.
    if (currentRules) {
      // console.log("currentRules: ", currentRules);
      await deleteAllRules(currentRules, token);
    }

    // Add rules to the stream. Comment this line if you want to keep your existing rules.
    await setRules(rules, token);

    console.log(chalkBlueBold(MODULE_ID_PREFIX + " | TWITTER LABS CURRENT FILTER RULES\n" + jsonPrint(currentRules)));

    // Listen to the stream.
    // This reconnection logic will attempt to reconnect when a disconnection is detected.
    // To avoid rate limites, this logic implements exponential backoff, so the wait time
    // will increase if the client cannot reconnect to the stream.

    let stream = streamConnect(token);

    let timeout = 0;

    stream.on("timeout", async function(){

      console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! TWITTER STREAM TIMEOUT ... RECONNECTING ..."));

      setTimeout(async function(){

        timeout++;

        stream = streamConnect(token);

      }, 2 ** timeout);

    });

    stream.on("data", function(data){
      rateMeter.meter("rawTweetsPerSecond").mark();
      rateMeter.meter("rawTweetsPerMinute").mark();

      statsObj.rawTweetsPerSecond = rateMeter.toJSON().tweetsPerSecond["1MinuteRate"];
      statsObj.rawTweetsPerMinute = rateMeter.toJSON().tweetsPerMinute["1MinuteRate"];

      if (streamDataQueue.length < maxTweetQueue) { streamDataQueue.push(data); }
    });

    stream.on("error", function(err){

      console.log(chalkError(MODULE_ID_PREFIX + " | *** STREAM ERROR: " + err));
      if (err.code === "ETIMEDOUT") {
        stream.emit("timeout");
      }
    });

    return stream;

  }
  catch (err) {
    console.log(err);
    throw err;
  }
}

async function initSetFromFile(params){

  statsObj.status = "INIT SET FROM FILE";

  console.log(chalkBlue("TSS | ... INIT SET FROM FILE: " + params.folder + "/" + params.file));

  try{

    const setObj = await tcUtils.loadFileRetry({folder: params.folder, file: params.file, resolveOnNotFound: params.resolveOnNotFound});

    if (empty(setObj)) {
     console.log(chalkAlert("TSS | ??? NO ITEMS IN FILE ERROR ???"
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

    console.log(chalkLog("TSS | LOADED SET FROM FILE"
      + " | OBJ ARRAY KEY: " + params.objArrayKey
      + " | " + fileSet.size + " ITEMS"
      + " | " + params.folder + "/" + params.file
    ));

    return fileSet;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT SET FROM FILE ERROR: " + err));
    if (params.noErrorNotFoundFlag) {
      return;
    }
    throw err;
  }
}

async function initSearchTerms(params){

  console.log(chalkTwitter("TSS | INIT TERMS | @" + threeceeUserObj.screenName));

  try{

    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: params.searchTermsFile, 
      resolveOnNotFound: false
    });

    if (result) {
      threeceeUserObj.searchTermSet = new Set([...result]);
      threeceeUserObj.searchTermSet.delete("");
      threeceeUserObj.searchTermSet.delete(" ");
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + threeceeUserObj.searchTermSet.size + " TOTAL SEARCH TERMS "));

    console.log(chalkLog("TSS | ADDING " + threeceeUserObj.followUserScreenNameSet.size + " SCREEN NAMES TO TRACK SET"));

    threeceeUserObj.searchTermSet = new Set([...threeceeUserObj.searchTermSet, ...threeceeUserObj.followUserScreenNameSet]);

    if (threeceeUserObj.searchTermSet.size == 0){
      console.log(chalkAlert("TSS | ??? NO SEACH TERMS |@" + threeceeUserObj.screenName));
      throw new Error("NO SEARCH TERMS");
    }

    console.log(chalk.blue("TSS | SEACH TERMS"
      + " | @" + threeceeUserObj.screenName 
      + " | " + threeceeUserObj.searchTermSet.size + " SEACH TERMS"
    ));

    return;

  }
  catch(err){
    console.log(chalkError("TSS | LOAD FILE ERROR\n" + err));
    throw err;
  }
}

async function initAllowLocations(){

  console.log(chalkTwitter("TSS | INIT ALLOW LOCATIONS | @" + threeceeUserObj.screenName));

  try{
    const result = await initSetFromFile({folder: configDefaultFolder, file: allowLocationsFile, resolveOnNotFound: false});

    if (result) {
      allowLocationsSet = new Set([...result]);
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + allowLocationsSet.size + " ALLOW LOCATIONS "));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT ALLOW LOCATIONS ERROR: " + err));
    throw err;
  }
}

async function initIgnoreLocations(){

  console.log(chalkTwitter("TSS | INIT IGNORE LOCATIONS | @" + threeceeUserObj.screenName));

  try{
    const result = await initSetFromFile({folder: configDefaultFolder, file: ignoreLocationsFile, resolveOnNotFound: false});

    if (result) {
      ignoreLocationsSet = new Set([...result]);
      // ignoreLocationsArray = [...ignoreLocationsSet];
      // ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
      // ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
      // ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "gi");
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + ignoreLocationsSet.size + " IGNORE LOCATIONS "));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT IGNORE LOCATIONS ERROR: " + err));
    throw err;
  }
}

async function initIgnoreHashtags(){

  console.log(chalkTwitter("TSS | INIT IGNORE HASHTAGS | @" + threeceeUserObj.screenName));

  try{
    const result = await initSetFromFile({folder: configDefaultFolder, file: ignoredHashtagFile, resolveOnNotFound: false});

    if (result) {
      ignoredHashtagSet = new Set([...result]);
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + ignoredHashtagSet.size + " IGNORE HASHTAGS "));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT IGNORE HASHTAGS ERROR: " + err));
    throw err;
  }
}

async function initFollowableSearchTermSet(){

  statsObj.status = "INIT FOLLOWABLE SEARCH TERM SET";

  console.log(chalkBlue("TSS | INIT FOLLOWABLE SEARCH TERM SET: " + configDefaultFolder 
    + "/" + followableSearchTermFile
  ));

  try{

    const result = await initSetFromFile({folder: configDefaultFolder, file: followableSearchTermFile, resolveOnNotFound: true});

    if (result) {
      followableSearchTermSet = new Set([...result]);
      followableSearchTermSet.delete("");
      followableSearchTermSet.delete(" ");
    }

    console.log(chalkLog("TSS | LOADED FOLLOWABLE SEARCH TERMS FILE"
      + " | " + followableSearchTermSet.size + " SEARCH TERMS"
      + " | " + configDefaultFolder + "/" + followableSearchTermFile
    ));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
    throw err;
  }
}

let searchTermsUpdateInterval;

async function initSearchTermsUpdateInterval(){

  clearInterval(searchTermsUpdateInterval);

  const interval = configuration.searchTermsUpdateInterval || DEFAULT_SEARCH_TERM_UPDATE_INTERVAL;

  searchTermsUpdateInterval = setInterval(async function(){
    console.log(chalkInfo("TSS | ... SEARCH TERM UPDATE | INTERVAL: " + msToTime(interval)));
    await initSearchTerms(configuration);
    await initSearchStreamLabs();

  }, interval);
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

      console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ FILE CREATED or CHANGED | " + getTimeStamp() + " | " + f));

      if (f.endsWith(followableSearchTermFile)){
        await initFollowableSearchTermSet();
        await initSearchTerms(configuration);
        await initSearchStreamLabs();
      }

      if (f.endsWith(allowLocationsFile)){
        await initAllowLocations();
      }

      if (f.endsWith(ignoreLocationsFile)){
        await initIgnoreLocations();
      }

      if (f.endsWith(ignoredHashtagFile)){
        await initIgnoreHashtags();
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

  return;
}

async function initialize(cnf){

  console.log(chalkLog("TSS | TSS | INITIALIZE"
    + " | @" + cnf.threeceeUser
    // + "\n" + jsonPrint(cnf)
  ));

  if (debug.enabled || debugCache.enabled || debugQ.enabled){
    console.log("\nTSS | %%%%%%%%%%%%%%\nTSS | DEBUG ENABLED \nTSS | %%%%%%%%%%%%%%\n");
  }

  cnf.processName = process.env.TSS_PROCESS_NAME || "wa_node_tss";

  cnf.verbose = process.env.TSS_VERBOSE_MODE || false;
  cnf.globalTestMode = process.env.TSS_GLOBAL_TEST_MODE || false;
  cnf.testMode = process.env.TSS_TEST_MODE || false;
  cnf.quitOnError = process.env.TSS_QUIT_ON_ERROR || false;

  cnf.twitterQueueIntervalTime = process.env.TSS_TWITTER_QUEUE_INTERVAL || DEFAULT_TWITTER_QUEUE_INTERVAL;
  cnf.streamDataQueueIntervalTime = process.env.TSS_STREAM_DATA_QUEUE_INTERVAL || DEFAULT_STREAM_DATA_QUEUE_INTERVAL;
  cnf.maxTweetQueue = process.env.TSS_MAX_TWEET_QUEUE || DEFAULT_MAX_TWEET_QUEUE;
  maxTweetQueue = cnf.maxTweetQueue;

  cnf.twitterConfigFolder = process.env.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER || "/config/twitter"; 
  cnf.twitterConfigFile = process.env.DROPBOX_TSS_DEFAULT_TWITTER_CONFIG_FILE 
    || "altthreecee00.json";

  cnf.statsUpdateIntervalTime = process.env.TSS_STATS_UPDATE_INTERVAL || 10*ONE_MINUTE;

  debug(chalkWarn("TSS | dropboxConfigFolder: " + dropboxConfigFolder));
  debug(chalkWarn("TSS | dropboxConfigFile  : " + dropboxConfigFile));


  try {
    const loadedConfigObj = await tcUtils.loadFileRetry({folder: configHostFolder, file: dropboxConfigFile}); 

    debug(dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

    if (loadedConfigObj.TSS_VERBOSE_MODE !== undefined){
      console.log("TSS | LOADED TSS_VERBOSE_MODE: " + loadedConfigObj.TSS_VERBOSE_MODE);
      cnf.verbose = loadedConfigObj.TSS_VERBOSE_MODE;
    }

    if (loadedConfigObj.TSS_GLOBAL_TEST_MODE !== undefined){
      console.log("TSS | LOADED TSS_GLOBAL_TEST_MODE: " + loadedConfigObj.TSS_GLOBAL_TEST_MODE);
      cnf.globalTestMode = loadedConfigObj.TSS_GLOBAL_TEST_MODE;
    }

    if (loadedConfigObj.TSS_TEST_MODE !== undefined){
      console.log("TSS | LOADED TSS_TEST_MODE: " + loadedConfigObj.TSS_TEST_MODE);
      cnf.testMode = loadedConfigObj.TSS_TEST_MODE;
    }

    if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER !== undefined){
      console.log("TSS | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " + loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER);
      cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
    }

    if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR !== undefined){
      console.log("TSS | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_DIR: " + loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR);
      cnf.searchTermsDir = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
    }

    if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE !== undefined){
      console.log("TSS | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_FILE: " + loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE);
      cnf.searchTermsFile = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
    }

    if (loadedConfigObj.TSS_STATS_UPDATE_INTERVAL !== undefined) {
      console.log("TSS | LOADED TSS_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TSS_STATS_UPDATE_INTERVAL);
      cnf.statsUpdateIntervalTime = loadedConfigObj.TSS_STATS_UPDATE_INTERVAL;
    }

    if (loadedConfigObj.TSS_MAX_TWEET_QUEUE !== undefined) {
      console.log("TSS | LOADED TSS_MAX_TWEET_QUEUE: " + loadedConfigObj.TSS_MAX_TWEET_QUEUE);
      cnf.maxTweetQueue = loadedConfigObj.TSS_MAX_TWEET_QUEUE;
      maxTweetQueue = cnf.maxTweetQueue;
    }

    // OVERIDE CONFIG WITH COMMAND LINE ARGS

    const configArgs = Object.keys(cnf);

    if (cnf.verbose) {
      configArgs.forEach(function(arg){
        console.log("TSS | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });
    }

    await initStatsUpdate(cnf);

    return cnf;

  }
  catch(err){
    console.log("TSS | TSS | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
    throw err;
  }
}

let dataBuffer;

async function initStreamDataQueue(){

  console.log(chalkTwitter("TSS | INIT STREAM DATA QUEUE INTERVAL: " + configuration.streamDataQueueIntervalTime));

  const interval = configuration.streamDataQueueIntervalTime;

  clearInterval(streamDataQueueInterval);

  streamDataQueueInterval = setInterval(async function () {

    if (streamDataQueueReady && (streamDataQueue.length > 0)) {

      streamDataQueueReady = false;
      dataBuffer = streamDataQueue.shift();
      try{
        await processStreamData(dataBuffer);
        streamDataQueueReady = true;
      }
      catch(err){
        console.error("TSS | *** processStreamData ERROR",err);
        streamDataQueueReady = true;
      }
    }
  }, interval);

  return;
}

function initTwitterQueue(cnf){

  console.log(chalkTwitter("TSS | INIT TWITTER QUEUE INTERVAL: " + cnf.twitterQueueIntervalTime));

  const interval = cnf.twitterQueueIntervalTime;
  // const sendMessageTimeout = configuration.sendMessageTimeout;

  clearInterval(tweetQueueInterval);

  let prevTweetId = "";
  let tweetStatus;

  tweetQueueInterval = setInterval(function () {

    if (tweetSendReady && (tweetQueue.length > 0)) {

      tweetSendReady = false;
      tweetStatus = tweetQueue.shift();

      if (tweetStatus.id_str != prevTweetId) {

        process.send({op: "TWEET", tweet: tweetStatus});

        prevTweetId = tweetStatus.id_str;
        tweetSendReady = true;
      }
      else {

        tweetSendReady = true;
      }
    }
  }, interval);
}

function initTwitterSearch(cnf){

  return new Promise(function(resolve){

    twitterSearchInit = true;

    console.log(chalkTwitter("TSS | INIT TWITTER SEARCH"));

    initTwitterQueue(cnf);

    console.log(chalkTwitter("TSS | " + getTimeStamp() 
      + " | ENABLE TWEET STREAM"
    ));

    resolve();

  });
}

let followQueueInterval;
let followQueueReady = false;
const followQueue = [];

async function initFollowQueue(params){

  try {

    const interval = params.interval;

    console.log(chalkTwitter("TSS"
      + " | 3C @" + threeceeUserObj.screenName 
      + " | FOLLOW QUEUE INTERVAL: " + interval
    ));

    clearInterval(followQueueInterval);

    let followObj;
    const createParams = {};
    createParams.follow = true;

    followQueueReady = true;

    followQueueInterval = setInterval(function () {

      if (followQueueReady && (followQueue.length > 0)) {

        followQueueReady = false;

        followObj = followQueue.shift();

        createParams.screen_name = followObj.user.screenName || null;
        createParams.user_id = followObj.user.userId || null;

        statsObj.queues.followQueue.size = followQueue.length;

        console.log(chalkTwitter("TSS | --> TWITTER FOLLOW"
          + " | 3C @" + threeceeUserObj.screenName
          + " | @" + followObj.user.screenName
          + " | UID: " + followObj.user.userId
        ));

        threeceeUserObj.twitStream.post("friendships/create", createParams, function(err, data, response) {

          if (err){

            console.log(chalkError("TSS | *** TWITTER FOLLOW ERROR"
              + " | @" + threeceeUserObj.screenName
              + " | ERROR CODE: " + err.code
              + " | ERROR: " + err
            ));

            if (configuration.verbose) {
              console.log(chalkError("TSS | *** TWITTER FOLLOW ERROR"
                + " | @" + threeceeUserObj.screenName
                + "\nresponse\n" + jsonPrint(response)
              ));
            }

            if (err.code == 161) {
              followQueue.length = 0;
            }

            const errorType = (err.code == 161) ? "TWITTER_FOLLOW_LIMIT" : "TWITTER_FOLLOW";

            process.send({
              op: "ERROR", 
              threeceeUser: threeceeUserObj.screenName, 
              stats: threeceeUserObj.stats, 
              errorType: errorType, 
              error: err
            });

          }
          else {
            console.log(chalk.green("TSS | +++ TWITTER FOLLOWING"
              + " | 3C @" + threeceeUserObj.screenName
              + " | @" + data.screen_name
              + " | ID: " + data.id_str
              + " | " + data.name
            ));

            threeceeUserObj.followUserIdSet.add(data.id_str);

            followQueueReady = true;
          }
        });
      }

    }, interval);

    return;

  }
  catch(err){
    console.log(chalkError("TSS | *** TWIT INIT FOLLOW ERROR"
      + " | @" + threeceeUserObj.screenName
      + " | " + getTimeStamp()
      + " | " + err
    ));
    throw err;
  }
}

process.on("message", async function(m) {

  console.log(chalkLog("TSS | RX MESSAGE"
    + " | OP: " + m.op
  ));

  let authObj;
  let authObjNew;
  let twitterConfigFile;

  switch (m.op) {

    case "QUIT":
      console.log(chalkAlert("TSS | QUIT"));
      quit("PARENT QUIT");
    break;

    case "VERBOSE":
      console.log(chalkAlert("TSS | VERBOSE"));
      configuration.verbose = m.verbose;
    break;

    case "INIT":

      process.title = m.title;

      configuration.threeceeUser = m.threeceeUser;
      threeceeUserObj.screenName = m.threeceeUser;
      configuration.filterDuplicateTweets = m.filterDuplicateTweets;
      // filterDuplicateTweets = m.filterDuplicateTweets;
      configuration.verbose = m.verbose;
      configuration.testMode = m.testMode;

      threeceeUserObj.twitterConfig = m.twitterConfig;


      console.log(chalkInfo("TSS | INIT"
        + " | TITLE: " + m.title
        + " | 3C USER @" + configuration.threeceeUser
        + "\nCONFIGURATION\n" + jsonPrint(configuration)
        + "\nTWITTER CONFIG\n" + jsonPrint(m.twitterConfig)
      ));

      try {
        await tcUtils.setThreeceeUser(configuration.threeceeUser);
        await initFollowableSearchTermSet();
        await initAllowLocations();
        await initIgnoreLocations();
        await initIgnoreHashtags();
        await initTwitterUser();
        await initSearchTerms(configuration);
        await initSearchStreamLabs();
        await initTwitterSearch(configuration);
        await initFollowQueue({interval: configuration.followQueueIntervalTime});
      }
      catch(err){
        console.log(chalkError("TSS | *** INIT ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "USER_AUTHENTICATED":

      if (m.user.screenName != threeceeUserObj.screenName) {
        console.log(chalkInfo("TSS | USER_AUTHENTICATED | USER MISS"
          + " | CHILD 3C @" + threeceeUserObj.screenName
          + " | AUTH USER @" + m.user.screenName
          + " | UID: " + m.user.userId
          // + " | TOKEN: " + m.token
          // + " | TOKEN SECRET: " + m.tokenSecret
        ));
        break;
      }

      console.log(chalkInfo("TSS | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      authObj = threeceeUserObj.twitStream.getAuth();

      console.log(chalkLog("TSS | CURRENT AUTH\n" + jsonPrint(authObj)));

      threeceeUserObj.twitStream.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

      authObjNew = threeceeUserObj.twitStream.getAuth();

      threeceeUserObj.twitterConfig.token = authObjNew.access_token;
      threeceeUserObj.twitterConfig.token_secret = authObjNew.access_token_secret;

      threeceeUserObj.twitterConfig.access_token = authObjNew.access_token;
      threeceeUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
      
      threeceeUserObj.twitterConfig.TOKEN = authObjNew.access_token;
      threeceeUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

      console.log(chalkError("TSS | UPDATED AUTH\n" + jsonPrint(authObjNew)));

      twitterConfigFile = threeceeUserObj.screenName + ".json";

      await tcUtils.saveFile({localFlag: true, folder: twitterConfigFolder, file: twitterConfigFile, obj: threeceeUserObj.twitterConfig});

      console.log(chalkLog("TSS | SAVED UPDATED AUTH " + twitterConfigFolder + "/" + twitterConfigFile));

      threeceeUserObj.stats.connected = true;
      threeceeUserObj.stats.twitterFollowLimit = false;

      const twitGetFriendsParams = {
        screen_name: threeceeUserObj.screenName,
        stringify_ids: true
      };

      const data = await twitStreamPromise({resource: "friends", endPoint: "ids", twitParams: twitGetFriendsParams});

      threeceeUserObj.stats.error = false;
      threeceeUserObj.stats.authenticated = true;
      threeceeUserObj.followUserIdSet = new Set(data.ids);

      if (!data || data == undefined) {

        console.log(chalkAlert("TSS | !!! EMPTY TWITTER GET FRIENDS IDS"
          + " | @" + threeceeUserObj.screenName
          + " | followUserIdSet: " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
        ));

        if (threeceeUserObj.followUserIdSet.size === 0){
          return;
        }
      }
      else{
        threeceeUserObj.followUserIdSet = new Set(data.ids);
      }

      console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
        + " | @" + threeceeUserObj.screenName
        + " | " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
      ));

      let userIndex = 0;
      let printString = "";

      async.eachSeries([...threeceeUserObj.followUserIdSet], function(userId, cb){

        userIndex += 1;

        if (followingUserIdHashMap.has(userId)) {

          const threeceeFollowingInHashMap = followingUserIdHashMap.get(userId);

          if (threeceeFollowingInHashMap != threeceeUserObj.screenName) {

            console.log(chalkLog("TSS | !!! TWITTER USER FOLLOW MISMATCH"
              + " | UID: " + userId
              + " | IN HM: 3C @" + threeceeFollowingInHashMap
              + " | CUR 3C @: " + threeceeUserObj.screenName
            ));

            return cb();

          }
          else {

            if (configuration.verbose) {
              console.log(chalkAlert("TSS | ??? TWITTER USER FOLLOW HM HIT"
                + " | UID: " + userId
                + " | IN HM: 3C @" + threeceeFollowingInHashMap
                + " | CUR 3C @: " + threeceeUserObj.screenName
              ));
            }

            return cb();
          }
        }

        followingUserIdHashMap.set(userId, threeceeUserObj.screenName);

        wordAssoDb.User.findOne({ userId: userId }, function (err, user) {

          if (err) { 
            console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
            return cb(err);
          }

          if (user) {

            if (configuration.verbose || (userIndex % 100 == 0)){
              printString = "TSS | [ " + userIndex + "/" + threeceeUserObj.followUserIdSet.size + " ] @" + threeceeUserObj.screenName + " | DB HIT";
              printUserObj(printString, user);
            }

            if (!user.following) {
              user.following = true;
              user.threeceeFollowing = threeceeUserObj.screenName;
              user.markModified("following");
              user.markModified("threeceeFollowing");
              user.save(function(err){
                if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                cb();
              });
            }
            else if (user.following && (user.threeceeFollowing > threeceeUserObj.screenName)) {
              console.log(chalk.black("TSS | -X- CHANGE 3C FOLLOWING"
                + " | UID: " + user.userId
                + " | @" + user.screenName
                + " | 3C @" + user.threeceeFollowing + " -> " + threeceeUserObj.screenName
              ));
              user.threeceeFollowing = threeceeUserObj.screenName;
              user.markModified("threeceeFollowing");
              user.save(function(err){
                if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                cb();
              });
            }
            else {
              cb();
            }

          }
          else {
            console.log(chalkLog("TSS | [ " + userIndex + "/" + threeceeUserObj.followUserIdSet.size + " ]"
              + " 3C @" + threeceeUserObj.screenName 
              + " | DB USER MISS  | UID: " + userId
            ));
            cb();
          }
        });

      }, async function(err){

        if (err) {
          console.log(chalkError("TSS | *** USER_AUTHENTICATED ERROR: " + err));
          return;
        }

        try{

          await initSearchTerms(configuration);
          await initSearchStreamLabs();

          console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUserObj.screenName));

          if (!twitterSearchInit) { 
            await initTwitterSearch(configuration);
          }

          process.send({
            op: "TWITTER_STATS", 
            threeceeUser: threeceeUserObj.screenName,
            twitterConfig: threeceeUserObj.twitterConfig,
            stats: threeceeUserObj.stats, 
            twitterFollowing: threeceeUserObj.followUserIdSet.size,
            twitterFriends: [...threeceeUserObj.followUserIdSet]
          });
        }
        catch(e){
          process.send({
            op: "TWITTER_ERROR", 
            threeceeUser: threeceeUserObj.screenName, 
            err: e
          });
        }

      });

    break;

    case "FOLLOW":
      console.log(chalkInfo("TSS | FOLLOW"
        + " | 3C @" + threeceeUserObj.screenName
        + " | UID " + m.user.userId
        + " | @" + m.user.screenName
        + " | FORCE FOLLOW: " + m.forceFollow
      ));

      if (m.forceFollow !== undefined) { configuration.forceFollow = m.forceFollow; }

      followQueue.push(m);
    break;

    case "UNFOLLOW":
      console.log(chalkInfo("TSS | UNFOLLOW"
        // + " [Q: " + unfollowQueue.length + "]"
        + " 3C @" + threeceeUserObj.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "UNFOLLOW_ID_ARRAY":
    break;

    case "IGNORE":
      console.log(chalkInfo("TSS | TSS > IGNORE"
        + " | 3C @" + threeceeUserObj.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
      ignoreUserSet.add(m.user.userId);
    break;

    case "UPDATE_ALLOW_LOCATIONS":
      console.log(chalkLog("TSS | UPDATE ALLOW LOCATIONS"));

      try {
        await initAllowLocations(configuration);
      }
      catch(err){
        console.log(chalkError("TSS | *** UPDATE_ALLOW_LOCATIONS ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "UPDATE_IGNORE_LOCATIONS":
      console.log(chalkLog("TSS | UPDATE IGNORE LOCATIONS"));

      try {
        await initIgnoreLocations();
      }
      catch(err){
        console.log(chalkError("TSS | *** UPDATE_IGNORE_LOCATIONS ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "UPDATE_SEARCH_TERMS":
      console.log(chalkLog("TSS | UPDATE SEARCH TERMS"));

      try{

        await initSearchTerms(configuration);
        await initSearchStreamLabs();

        console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUserObj.screenName));

        if (!twitterSearchInit) { await initTwitterSearch(configuration); }

        process.send({
          op: "TWITTER_STATS", 
          threeceeUser: threeceeUserObj.screenName, 
          stats: threeceeUserObj.stats, 
          twitterFollowing: threeceeUserObj.followUserIdSet.size,
          twitterFriends: [...threeceeUserObj.followUserIdSet]
        });
      }
      catch(err){
        process.send({
          op: "TWITTER_ERROR", 
          threeceeUser: threeceeUserObj.screenName, 
          err: err
        });
      }
    break;

    case "PING":
      debug(chalkLog("TSS | TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){

        process.send({ 
          op: "PONG",
          pongId: m.pingId
        });

      }, 1000);
    break;

    default:
      console.log(chalkError("TSS | *** TSS UNKNOWN OP"
        + " | 3C @" + threeceeUserObj.screenName
        + " | INTERVAL: " + m.op
      ));
  }
});

setTimeout(async function(){

  try{
    configuration = await initialize(configuration);
    process.send({ op: "READY"});
  }
  catch(err){
    if (err.status != 404) {
      console.log(chalkError("TSS | *** INIT ERROR\n" + jsonPrint(err)));
      quit();
    }
    console.log(chalkError("TSS | TSS | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
  }

  console.log("TSS | TSS | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");

  try {
    dbConnection = await connectDb();
    dbConnectionReady = true;
  }
  catch(err){
    dbConnectionReady = false;
    console.log(chalkError("TSS | TSS | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
    quit("MONGO DB CONNECT ERROR");
  }

  dbConnectionReadyInterval = setInterval(async function() {
    if (dbConnectionReady) {
      clearInterval(dbConnectionReadyInterval);
      await initWatchConfig();
      await initStreamDataQueue();
      await initSearchTermsUpdateInterval();
      // await initStatsUpdate(configuration);
    }
    else {
      console.log(chalkInfo("TSS | TSS | WAIT DB CONNECTED ..."));
    }
  }, 1000);
}, 5*ONE_SECOND);
