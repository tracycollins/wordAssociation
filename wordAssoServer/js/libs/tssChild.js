/*jslint node: true */
/*jshint sub:true*/

const MODULE_ID_PREFIX = "TSS";

const ignoredHashtagFile = "ignoredHashtag.txt";
const followableSearchTermFile = "followableSearchTerm.txt";
const ignoreLocationsFile = "ignoreLocations.txt";
const allowLocationsFile = "allowLocations.txt";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;

const TWEET_ID_CACHE_DEFAULT_TTL = 20;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

const TWITTER_MAX_TRACKING_NUMBER = 400;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;

const DEFAULT_SEARCH_TERM_UPDATE_INTERVAL = 15*ONE_MINUTE;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

// const mangledRegEx = /\u00C3.\u00C2|\u00B5/g;

const os = require("os");

const request = require('request');
const util = require('util');

const get = util.promisify(request.get);
const post = util.promisify(request.post);

const path = require("path");
const empty = require("is-empty");
const watch = require("watch");
const parseJson = require("parse-json");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const _ = require("lodash");
const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
const Twit = require("twit");

// TWITTER LABS NEW STREAMING INTERFACE

const bearerTokenURL = new URL("https://api.twitter.com/oauth2/token");
// const streamURL = new URL("https://api.twitter.com/labs/1/tweets/stream/filter");
const rulesURL = new URL("https://api.twitter.com/labs/1/tweets/stream/filter/rules");

const moment = require("moment");
const treeify = require("treeify");
const Measured = require("measured");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");

let DROPBOX_ROOT_FOLDER;

if (hostname == "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
}
else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
}

const configDefaultFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility/default");
const configHostFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility", hostname);

// const DROPBOX_DEFAULT_CONFIG_FOLDER = "/config/utility/default";
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

const debug = require("debug")("tss");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");


const chalk = require("chalk");
const chalkBlue = chalk.blue;
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.yellow;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;

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

let ignoreLocationsArray = [...ignoreLocationsSet];
let ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
let ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "gi");

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

process.on("disconnect", function() {
  quit("DISCONNECT");
});

const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20,
  verboseMemoryLeak: true
});

const twitterStats = Measured.createCollection();
twitterStats.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
twitterStats.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

let twitterSearchInit = false;

const tweetQueue = [];
let tweetSendReady = [];
let tweetQueueInterval;

let configuration = {};
configuration.filterDuplicateTweets = true;
configuration.verbose = false;
configuration.forceFollow = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode
configuration.searchTermsUpdateInterval = DEFAULT_SEARCH_TERM_UPDATE_INTERVAL;
configuration.followQueueIntervalTime = 5*ONE_SECOND;
configuration.ignoreQueueInterval = 15 * ONE_SECOND;
configuration.maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
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
threeceeUserObj.stats.tweetsReceived = 0;
threeceeUserObj.stats.retweetsReceived = 0;
threeceeUserObj.stats.quotedTweetsReceived = 0;
threeceeUserObj.stats.twitterConnects = 0;
threeceeUserObj.stats.twitterReconnects = 0;
threeceeUserObj.stats.twitterFollowLimit = false;
threeceeUserObj.stats.twitterLimit = 0;
threeceeUserObj.stats.twitterErrors = 0;
threeceeUserObj.stats.rateLimited = false;
threeceeUserObj.stats.tweetsPerSecond = 0;
threeceeUserObj.stats.tweetsPerMinute = 0;

// threeceeUserObj.stats.twitterRateLimitException = false
threeceeUserObj.stats.twitterRateLimit = 0;
threeceeUserObj.stats.twitterRateLimitRemaining = 0;
threeceeUserObj.stats.twitterRateLimitResetAt = 0;
threeceeUserObj.stats.twitterRateLimitRemainingTime = 0;
threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;

threeceeUserObj.rateMeter = {};
threeceeUserObj.rateMeter = Measured.createCollection();
threeceeUserObj.rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
threeceeUserObj.rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

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

global.globalDbConnection = false;
const mongoose = require("mongoose");

global.globalWordAssoDb = require("@threeceelabs/mongoose-twitter");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");

global.globalUser = mongoose.model("User", userModel.UserSchema);
const User = global.globalUser;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

const UserServerController = require("@threeceelabs/user-server-controller");
let userServerController;

function connectDb(){

  return new Promise(function(resolve, reject){

    try {

      statsObj.status = "CONNECTING MONGO DB";

      global.globalWordAssoDb.connect("TSS_" + process.pid, function(err, db){

        if (err) {
          console.log(chalkAlert("TSS | @" + threeceeUserObj.screenName + " | *** MONGO DB CONNECTION ERROR: " + err));
          statsObj.status = "MONGO CONNECTION ERROR";
          dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("close", function(){
          statsObj.status = "MONGO CLOSED";
          console.log(chalkAlert("TSS | @" + threeceeUserObj.screenName + " | *** MONGO DB CONNECTION CLOSED"));
          dbConnectionReady = false;
        });

        db.on("error", function(err){
          statsObj.status = "MONGO ERROR";
          console.log(chalkAlert("TSS | @" + threeceeUserObj.screenName + " | *** MONGO DB CONNECTION ERROR: " + err));
          db.close();
          dbConnectionReady = false;
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.log(chalkAlert("TSS | @" + threeceeUserObj.screenName + " | *** MONGO DB DISCONNECTED ***"));
          dbConnectionReady = false;
        });

        dbConnectionReady = true;
        statsObj.dbConnectionReady = true;

        global.globalDbConnection = db;

        console.log(chalk.green("TSS | @" + threeceeUserObj.screenName + " | MONGO DB CONNECTION OPEN"));

        userServerController = new UserServerController("TSS_USC");

        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";

          console.log(chalkLog("TSS | USC READY | " + appname));

          resolve(db);
          configEvents.emit("DB_CONNECT");

        });

      });

    }
    catch(err){
      console.log(chalkError("TSS | *** MONGO DB CONNECT ERROR: " + err));
      reject(err);
    }

  });
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

const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_TSS_CONFIG_FILE = process.env.DROPBOX_TSS_CONFIG_FILE || "twitterSearchStreamConfig.json";
const DROPBOX_TSS_STATS_FILE = process.env.DROPBOX_TSS_STATS_FILE || "twitterSearchStreamStats.json";

const statsFolder = "/stats/" + hostname + "/tssChild";
const statsFile = DROPBOX_TSS_STATS_FILE;

const dropboxConfigFolder = "/config/utility";
// const dropboxConfigHostFolder = "/config/utility/" + hostname;

const dropboxConfigFile = hostname + "_" + DROPBOX_TSS_CONFIG_FILE;

console.log("TSS | DROPBOX_TSS_CONFIG_FILE: " + DROPBOX_TSS_CONFIG_FILE);

debug("TSS | dropboxConfigFolder : " + dropboxConfigFolder);
debug("TSS | dropboxConfigFile : " + dropboxConfigFile);


const dropboxClient = new Dropbox({ 
  accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  fetch: fetch
});

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

  statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
  statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

  statsObj.tweetsPerSecond = threeceeUserObj.stats.tweetsPerSecond || 0;
  statsObj.tweetsPerMinute = threeceeUserObj.stats.tweetsPerMinute || 0;

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

  }
}

function quit(message) {

  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.error("TSS | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TSS CHILD: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if ((global.globalDbConnection !== undefined) && (global.globalDbConnection.readyState > 0)) {

    global.globalDbConnection.close(function () {
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

function saveFile (path, file, jsonObj, callback){

  const fullPath = path + "/" + file;

  debug(chalkInfo("TSS | SAVE FOLDER " + path));
  debug(chalkInfo("TSS | SAVE FILE " + file));
  debug(chalkInfo("TSS | FULL PATH " + fullPath));

  const options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options).
    then(function(response){
      debug(chalkLog("TSS | SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    }).
    catch(function(error){
      console.error(chalkError("TSS | " + moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + "\nERROR: " + error
      ));
      callback(error.error, null);
    });
}

function initStatsUpdate(cnf){

  return new Promise(function(resolve, reject){

    console.log(chalkInfo("TSS | TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

    try{

      setInterval(async function () {

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;
        statsObj.timeStamp = moment().format(defaultDateTimeFormat);

        saveFile(statsFolder, statsFile, statsObj, function(){
          showStats();
        });

        try{
          if (threeceeUserObj.twitStream !== undefined) {
            await checkTwitterRateLimit();
          }
        }
        catch(err){
           console.log(chalkError("TSS | TSS | *** CHECK RATE LIMIT ERROR: " + err));
        }

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

let rateLimitTimeout;
let rateLimitStatusInterval;

function initRateLimitPause(params){

  return new Promise(function(resolve, reject){

    if (!params) {
      return reject(new Error("params undefined"));
    }

    console.log(chalkAlert("TSS | TSS"
      + " | RATE LIMIT PAUSE"
      + " | @" + configuration.threeceeUser
      + " | NOW: " + moment().format(compactDateTimeFormat)
      + " | RESET AT: " + params.twitterRateLimitResetAt.format(compactDateTimeFormat)
      + " | REMAINING: " + msToTime(params.twitterRateLimitRemainingTime)
    ));

    clearInterval(rateLimitStatusInterval);
    clearTimeout(rateLimitTimeout);

    let remainingTime = params.twitterRateLimitRemainingTime;
    const resetAt = params.twitterRateLimitResetAt;
    const timeout = params.twitterRateLimitRemainingTime + ONE_MINUTE;

    rateLimitStatusInterval = setInterval(function(){

      remainingTime = resetAt.diff(moment());

      console.log(chalkAlert("TSS"
        + " | RATE LIMIT PAUSE"
        + " | @" + configuration.threeceeUser
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | RESET AT: " + resetAt.format(compactDateTimeFormat)
        + " | REMAINING: " + msToTime(remainingTime)
      ));

    }, ONE_MINUTE);

    rateLimitTimeout = setTimeout(function(){

      remainingTime = resetAt.diff(moment());

      console.log(chalkAlert("TSS | XXX RATE LIMIT EXPIRED"
        + " | @" + configuration.threeceeUser
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | RESET AT: " + resetAt.format(compactDateTimeFormat)
        + " | REMAINING: " + msToTime(remainingTime)
      ));

      threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;

      clearInterval(rateLimitStatusInterval);

    }, timeout);

    resolve();

  });
}

function twitStreamPromise(params){

  return new Promise(function(resolve, reject){

    threeceeUserObj.twitStream.get(params.endpoint, params.twitParams, async function(err, data, response) {

      if (err){
        console.log(chalkError("TSS | *** TWITTER STREAM ERROR"
          + " | @" + threeceeUserObj.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

        if (err.code == 88){
          threeceeUserObj.stats.twitterRateLimitExceptionFlag = true;
          threeceeUserObj.stats.twitterRateLimit = response.headers["x-rate-limit-limit"];
          threeceeUserObj.stats.twitterRateLimitRemaining = response.headers["x-rate-limit-remaining"];
          threeceeUserObj.stats.twitterRateLimitResetAt = moment.unix(response.headers["x-rate-limit-reset"]);
          threeceeUserObj.stats.twitterRateLimitRemainingTime = moment.unix(response.headers["x-rate-limit-reset"]).diff(moment());

          console.log(chalkLog(MODULE_ID_PREFIX + " | RATE LIMIT"
            + " | LIM: " + threeceeUserObj.stats.twitterRateLimit
            + " | REM: " + threeceeUserObj.stats.twitterRateLimitRemaining
            + " | RESET AT: " + threeceeUserObj.stats.twitterRateLimitResetAt.format(compactDateTimeFormat)
            + " | REMAINING: " + msToTime(threeceeUserObj.stats.twitterRateLimitRemainingTime)
          ));

          try {
            await initRateLimitPause(threeceeUserObj.stats);
            return resolve([]);
          }
          catch(e){
            console.log(chalkError("TSS | *** INIT RATE LIMIT PAUSE ERROR: " + e));
            return reject(e);
          }
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

        User.findOne({ userId: userId }, function (err, user) {

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
  threeceeUserObj.stats.tweetsPerSecond = 0;
  threeceeUserObj.stats.tweetsPerMinute = 0;

  threeceeUserObj.stats.twitterRateLimit = 0;
  threeceeUserObj.stats.twitterRateLimitRemaining = 0;
  threeceeUserObj.stats.twitterRateLimitResetAt = 0;
  threeceeUserObj.stats.twitterRateLimitRemainingTime = 0;
  threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;

  threeceeUserObj.rateMeter = {};
  threeceeUserObj.rateMeter = Measured.createCollection();
  threeceeUserObj.rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
  threeceeUserObj.rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

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

    const data = await twitStreamPromise({endpoint: "friends/ids", twitParams: twitGetFriendsParams});

    threeceeUserObj.stats.authenticated = true;

    threeceeUserObj.stats.error = false;
    threeceeUserObj.stats.authenticated = true;
    threeceeUserObj.stats.twitterTokenErrorFlag = false;

    threeceeUserObj.followUserScreenNameSet = new Set();
    threeceeUserObj.followUserIdSet = new Set(data.ids);

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


const followingUserIdHashMap = new HashMap();

function checkTwitterRateLimit(params){

  return new Promise(function(resolve, reject){

    if (threeceeUserObj.twitStream === undefined) {
      return reject(new Error("TWIT UNDEFINED", params));
    }

    threeceeUserObj.twitStream.get("application/rate_limit_status", 
      {screen_name: threeceeUserObj.screenName}, 
      function(err, data, response) {
      
      if (err){

        console.log(chalkError("TSS | *** TWITTER ACCOUNT ERROR"
          + " | @" + threeceeUserObj.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

        if (configuration.verbose) {
          console.log("TSS | response\n" + jsonPrint(response));
        }

        threeceeUserObj.stats.error = err;
        threeceeUserObj.stats.twitterErrors += 1;
        threeceeUserObj.stats.ready = false;

        return reject(err);
      }

      threeceeUserObj.stats.error = false;

      if (configuration.verbose) {
        console.log(chalkLog("TSS | TWITTER RATE LIMIT STATUS"
          + " | @" + threeceeUserObj.screenName
          + " | LIM: " + threeceeUserObj.stats.twitterRateLimit
          + " | REM: " + threeceeUserObj.stats.twitterRateLimitRemaining
          + " | RST: " + getTimeStamp(threeceeUserObj.stats.twitterRateLimitResetAt)
          + " | NOW: " + moment().format(compactDateTimeFormat)
          + " | IN " + msToTime(threeceeUserObj.stats.twitterRateLimitRemainingTime)
        ));
      }

      if (data.resources.users["/users/show/:id"].remaining > 0){

        threeceeUserObj.stats.ready = true;
        threeceeUserObj.stats.twitterRateLimit = data.resources.users["/users/show/:id"].limit;
        threeceeUserObj.stats.twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
        threeceeUserObj.stats.twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset).valueOf();
        threeceeUserObj.stats.twitterRateLimitRemainingTime = moment(threeceeUserObj.stats.twitterRateLimitResetAt).diff(moment());

        if (threeceeUserObj.stats.twitterRateLimitExceptionFlag) {

          threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;
          threeceeUserObj.stats.twitterFollowLimit = false;
          
          console.log(chalkInfo("TSS | XXX RESET TWITTER RATE LIMIT"
            + " | @" + threeceeUserObj.screenName
            + " | CONTEXT: " + data.rate_limit_context.access_token
            + " | LIM: " + threeceeUserObj.stats.twitterRateLimit
            + " | REM: " + threeceeUserObj.stats.twitterRateLimitRemaining
            // + " | EXP: " + threeceeUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
            + " | NOW: " + moment().format(compactDateTimeFormat)
          ));
        }

        return resolve();

      }

      threeceeUserObj.stats.ready = false;
      threeceeUserObj.stats.twitterRateLimitExceptionFlag = true;

      threeceeUserObj.stats.twitterRateLimit = data.resources.users["/users/show/:id"].limit;
      threeceeUserObj.stats.twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
      threeceeUserObj.stats.twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset).valueOf();
      threeceeUserObj.stats.twitterRateLimitRemainingTime = moment(threeceeUserObj.stats.twitterRateLimitResetAt).diff(moment());

      console.log(chalkLog("TSS | --- TWITTER RATE LIMIT"
        + " | @" + threeceeUserObj.screenName
        + " | CONTEXT: " + data.rate_limit_context.access_token
        + " | LIM: " + threeceeUserObj.stats.twitterRateLimit
        + " | REM: " + threeceeUserObj.stats.twitterRateLimitRemaining
        // + " | EXP: " + threeceeUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
        + " | RST: " + moment(threeceeUserObj.stats.twitterRateLimitResetAt).format(compactDateTimeFormat)
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | IN " + msToTime(threeceeUserObj.stats.twitterRateLimitRemainingTime)
      ));

      resolve();

    });

  });
}

async function checkValidTweet(params){

  if (ignoreUserSet.has(params.tweetObj.includes.users[0].id.toString())) {
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
  // processedTweetObj.entities.polls = [tweetObj.data.entities.polls;
  // processedTweetObj.entities.symbols = tweetObj.data.entities.symbols;
  // processedTweetObj.entities.urls = tweetObj.data.entities.urls;
  // processedTweetObj.entities.hashtags = tweetObj.data.entities.hashtags;
  // processedTweetObj.entities.mentions = tweetObj.data.entities.mentions;
  // processedTweetObj.entities.cashtags = tweetObj.data.entities.cashtags;
  // processedTweetObj.entities.urls = tweetObj.data.entities.urls;
  // processedTweetObj.entities.urls = tweetObj.data.entities.urls;

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

  twitterStats.meter("tweetsPerSecond").mark();
  twitterStats.meter("tweetsPerMinute").mark();

  threeceeUserObj.rateMeter.meter("tweetsPerSecond").mark();
  threeceeUserObj.rateMeter.meter("tweetsPerMinute").mark();

  threeceeUserObj.stats.tweetsPerSecond = threeceeUserObj.rateMeter.toJSON().tweetsPerSecond["1MinuteRate"];
  threeceeUserObj.stats.tweetsPerMinute = threeceeUserObj.rateMeter.toJSON().tweetsPerMinute["1MinuteRate"];

  statsObj.tweetsReceived+= 1;
  threeceeUserObj.stats.tweetsReceived += 1;

  if (processedTweetObj.retweeted_status) {
    statsObj.retweetsReceived += 1;
    threeceeUserObj.stats.retweetsReceived += 1;
  }

  if (processedTweetObj.quoted_status) {
    statsObj.quotedTweetsReceived += 1;
    threeceeUserObj.stats.quotedTweetsReceived += 1;
  }

  if (tweetQueue.length < configuration.maxTweetQueue ) {
    tweetQueue.push(processedTweetObj);
    statsObj.queues.tweetQueue.size = tweetQueue.length;
  }
  else {
    statsObj.queues.tweetQueue.fullEvents += 1;
  }

  if ((threeceeUserObj.stats.tweetsReceived % 1000 == 0) || (statsObj.tweetsReceived % 1000 == 0)) {
    console.log(chalkTwitter("TSS | <T"
      + " | 3C " + threeceeUserObj.screenName
      + " | " + threeceeUserObj.stats.tweetsPerMinute.toFixed(3) + " TPM"
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

const consumer_key = 'ex0jSXayxMOjNm4DZIiic9Nc0'; // Add your API key here
const consumer_secret = 'I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa'; // Add your API secret key here


async function bearerToken () {
  const requestConfig = {
    url: bearerTokenURL,
    auth: {
      user: consumer_key,
      pass: consumer_secret,
    },
    form: {
      grant_type: 'client_credentials',
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

  const ids = rules.data.map(rule => rule.id);

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

function streamConnect(token) {
  // Listen to the stream
  const config = {
    url: 'https://api.twitter.com/labs/1/tweets/stream/filter',
    auth: {
      bearer: token,
    },
    qs: {
      format: 'detailed',
      'user.format': 'detailed',
      'tweet.format': 'detailed',
      'place.format': 'detailed',
      expansions: 'author_id',
    },
    timeout: 20000,
  };

  const stream = request.get(config);

  stream.on("data", async function(data){
    try {

      const tweetObj = parseJson(data);

      if (configuration.verbose) {
        console.log(chalkTwitter(MODULE_ID_PREFIX + " | TW"
          + " | " + tweetObj.data.id
          + " | CR: " + tcUtils.getTimeStamp(tweetObj.created_at)
          + " | @" + tweetObj.includes.users[0].username
          + " | LOC: " + tweetObj.includes.users[0].location
          + " | FLWRs: " + tweetObj.includes.users[0].stats.followers_count
          + " | FRNDs: " + tweetObj.includes.users[0].stats.following_count
          + " | TWs: " + tweetObj.includes.users[0].stats.tweet_count
          // + "\n" + tcUtils.jsonPrint(tweetObj)
        ));
      }

      const validTweet = await checkValidTweet({tweetObj: tweetObj});

      if (validTweet) {
        const processedTweet = await processTweet({tweetObj: tweetObj});
      }
    }
    catch(err){
      statsObj.twitter.errors += 1;
      console.log(chalkWarn(MODULE_ID_PREFIX + " | !!! TWEET JSON PARSE ERROR: " + err));
    }
  }).on('error', error => {
    if (error.code === 'ETIMEDOUT') {
      stream.emit('timeout');
    }
  });

  return stream;
}

async function initSearchStreamLabs(){

  // { 'value': 'impeach', 'tag': 'impeach'}
  // { 'value': 'theresistance OR fbr OR followbackresistance', 'tag': 'theresistance' },

  const rules = [];

  let token;

  threeceeUserObj.filter = {};
  threeceeUserObj.filter.tags = {};
  threeceeUserObj.filter.tags["trump"] = {};
  threeceeUserObj.filter.tags["trump"].valuesSet = new Set();
  threeceeUserObj.filter.tags["trump"].valuesSet.add("trump");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("donaldtrump");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("realdonaldtrump");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("melania");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("ivanka");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("melania");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("potus");
  threeceeUserObj.filter.tags["trump"].valuesSet.add("drumpf");

  threeceeUserObj.filter.tags["impeach"] = {};
  threeceeUserObj.filter.tags["impeach"].valuesSet = new Set();
  threeceeUserObj.filter.tags["impeach"].valuesSet.add("impeach");
  threeceeUserObj.filter.tags["impeach"].valuesSet.add("impeach45");
  threeceeUserObj.filter.tags["impeach"].valuesSet.add("impeachtrump");

  threeceeUserObj.filter.tags["government"] = {};
  threeceeUserObj.filter.tags["government"].valuesSet = new Set();
  threeceeUserObj.filter.tags["government"].valuesSet.add("congress");
  threeceeUserObj.filter.tags["government"].valuesSet.add("senate");
  threeceeUserObj.filter.tags["government"].valuesSet.add("house of representatives");
  threeceeUserObj.filter.tags["government"].valuesSet.add("the white house");
  threeceeUserObj.filter.tags["government"].valuesSet.add("the supreme court");
  threeceeUserObj.filter.tags["government"].valuesSet.add("scotus");
  threeceeUserObj.filter.tags["government"].valuesSet.add("judiciary");
  threeceeUserObj.filter.tags["government"].valuesSet.add("executive branch");

  threeceeUserObj.filter.tags["democrats"] = {};
  threeceeUserObj.filter.tags["democrats"].valuesSet = new Set();
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("democrats");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("dnc");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("dems");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("democratic party");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("pelosi");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("aoc");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("bernie");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("berniesanders");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("lizwarren");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("warren");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("kamala");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("cory");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("buttigieg");
  threeceeUserObj.filter.tags["democrats"].valuesSet.add("yanggang");

  threeceeUserObj.filter.tags["republicans"] = {};
  threeceeUserObj.filter.tags["republicans"].valuesSet = new Set();
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("republicans");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("republican party");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("gop");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("repub");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("repubs");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("vpotus");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("pence");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("mcconnell");
  threeceeUserObj.filter.tags["republicans"].valuesSet.add("senatemajldr");

  threeceeUserObj.filter.tags["resistance"] = {};
  threeceeUserObj.filter.tags["resistance"].valuesSet = new Set();
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("theresistance");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("voteblue");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("votebluenomatterwho");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("followbackresistance");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("fbr");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("geeksresist");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("lawyersresist");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("musiciansresist");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("neverthelesssheresisted");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("resistanceunited");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("resisttrump");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("resisttogether");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("vetsresist");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("vetsresistsquadron");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("vetsresistsupportsquadron");
  threeceeUserObj.filter.tags["resistance"].valuesSet.add("wearetheresistance");

  for(const tag of Object.keys(threeceeUserObj.filter.tags)){
    const value = [...threeceeUserObj.filter.tags[tag].valuesSet].join(" OR ");
    rules.push({value: value, tag: tag});
  }

  console.log(chalkInfo("TSS | INIT SEARCH STREAM"
    + " | @" + threeceeUserObj.screenName
    + "\n" + jsonPrint(threeceeUserObj.filter)
    + "\n" + jsonPrint(rules)
  ));

  try {
    // Exchange your credentials for a Bearer token
    token = await bearerToken({consumer_key, consumer_secret});
  }
  catch (e) {
    console.error(`Could not generate a Bearer token. Please check that your credentials are correct and that the Filtered Stream preview is enabled in your Labs dashboard. (${e})`);
    throw e;
  }

  try {
    // Gets the complete list of rules currently applied to the stream
    const currentRules = await getAllRules(token);
    
    // Delete all rules. Comment this line if you want to keep your existing rules.
    if (currentRules) {
      // console.log("currentRules: ", currentRules);
      await deleteAllRules(currentRules, token);
    }

    // Add rules to the stream. Comment this line if you want to keep your existing rules.
    await setRules(rules, token);
    console.log("currentRules: ", currentRules);

  }
  catch (e) {
    console.error(e);
    throw e;
  }

  // Listen to the stream.
  // This reconnection logic will attempt to reconnect when a disconnection is detected.
  // To avoid rate limites, this logic implements exponential backoff, so the wait time
  // will increase if the client cannot reconnect to the stream.

  const stream = streamConnect(token);
  let timeout = 0;

  stream.on('timeout', () => {
    // Reconnect on error
    console.warn('A connection error occurred. Reconnecting…');

    setTimeout(() => {
      timeout++;
      streamConnect(token);
    }, 2 ** timeout);

    streamConnect(token);

  });

  return;
}

function initSearchStream(){

  return new Promise(function(resolve, reject){

    const filter = {};

    filter.follow = [...threeceeUserObj.followUserIdSet];

    filter.track = [];

    if (threeceeUserObj.searchTermSet.size > 0) {
      if (threeceeUserObj.searchTermSet.size <= TWITTER_MAX_TRACKING_NUMBER){
        filter.track = [...threeceeUserObj.searchTermSet];
      }
      else{
        const searchTermArray = _.shuffle([...threeceeUserObj.searchTermSet]);
        filter.track = searchTermArray.slice(0,TWITTER_MAX_TRACKING_NUMBER);
      }
    }

    console.log(chalkInfo("TSS | INIT SEARCH STREAM"
      + " | @" + threeceeUserObj.screenName
      + " | SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
      + " | FILTER TRACK SIZE: " + filter.track.length
      + " | FILTER FOLLOW SIZE: " + filter.follow.length
    ));

    try {

      if (threeceeUserObj.searchStream) {
        console.log(chalkAlert("TSS | !!! RESTARTING TWITTER SEARCH STREAM"));
        threeceeUserObj.searchStream.stop();
      }

      threeceeUserObj.searchStream = {};

      threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

      threeceeUserObj.searchStream.on("message", function(msg){
        if (msg.event) {
          console.log(chalkAlert("TSS | " + getTimeStamp() 
            + " | TWITTER MESSAGE EVENT: " + msg.event
            + " | @" + threeceeUserObj.screenName
            + "\n" + jsonPrint(msg)
          ));
        }
      });

      threeceeUserObj.searchStream.on("follow", function(msg){
        console.log(chalkAlert("TSS | " + getTimeStamp() 
          + " | TWITTER FOLLOW EVENT"
          + " | @" + threeceeUserObj.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUserObj.searchStream.on("unfollow", function(msg){
        console.log(chalkAlert("TSS | " + getTimeStamp() 
          + " | TWITTER UNFOLLOW EVENT"
          + " | @" + threeceeUserObj.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUserObj.searchStream.on("user_update", function(msg){
        console.log(chalkAlert("TSS | " + getTimeStamp() 
          + " | TWITTER USER UPDATE EVENT"
          + " | @" + threeceeUserObj.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUserObj.searchStream.on("connect", function(){
        console.log(chalkTwitter("TSS | " + getTimeStamp()
          + " | TWITTER CONNECT"
          + " | @" + threeceeUserObj.screenName
        ));
        statsObj.twitter.connects += 1;
        threeceeUserObj.stats.connected = true;
        threeceeUserObj.stats.twitterConnects += 1;
        threeceeUserObj.stats.rateLimited = false;
        threeceeUserObj.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUserObj.searchStream.on("reconnect", function(data){

        if (data.type == "rate-limit") {
          threeceeUserObj.stats.rateLimited = true;
        }
        else {
          threeceeUserObj.stats.rateLimited = false;
        }

        console.log(chalkTwitter("TSS | " + getTimeStamp()
          + " | TWITTER RECONNECT"
          + " | RATE LIMIT: " + threeceeUserObj.stats.rateLimited
          + " | @" + threeceeUserObj.screenName
        ));

        statsObj.twitter.reconnects+= 1;

        threeceeUserObj.stats.connected = true;
        threeceeUserObj.stats.twitterReconnects += 1;
        threeceeUserObj.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUserObj.searchStream.on("disconnect", function(data){
        console.log(chalkAlert("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | !!! TWITTER DISCONNECT\n" + jsonPrint(data)
        ));
        statsObj.twitter.disconnects+= 1;
        threeceeUserObj.stats.connected = false;
        threeceeUserObj.stats.twitterReconnects = 0;
        threeceeUserObj.stats.rateLimited = false;
        threeceeUserObj.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUserObj.searchStream.on("warning", function(data){
        console.log(chalkAlert("TSS | " + getTimeStamp() + " | !!! TWITTER WARNING\n" + jsonPrint(data)));
        statsObj.twitter.warnings+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("direct_message", function (message) {
        console.log(chalkTwitter("TSS | R< TWITTER DIRECT MESSAGE"
          + " | @" + threeceeUserObj.screenName
          + " | " + message.direct_message.sender_screen_name
          + "\n" + message.direct_message.text
        ));
        showStats();
      });

      threeceeUserObj.searchStream.on("scrub_geo", function(data){
        console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER SCRUB GEO\n" + jsonPrint(data)));
        statsObj.twitter.scrubGeo+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("status_withheld", function(data){
        console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER STATUS WITHHELD\n" + jsonPrint(data)));
        statsObj.twitter.statusWithheld+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("user_withheld", function(data){
        console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER USER WITHHELD\n" + jsonPrint(data)));
        statsObj.twitter.userWithheld+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("limit", function(limitMessage){

        statsObj.twitter.limit += limitMessage.limit.track;
        threeceeUserObj.stats.twitterLimit += limitMessage.limit.track;

        if (statsObj.twitter.limit > statsObj.twitter.limitMax) {
          statsObj.twitter.limitMax = statsObj.twitter.limit;
          statsObj.twitter.limitMaxTime = moment().valueOf();
        }

        if (configuration.verbose) {
          console.log(chalkTwitter("TSS | " + getTimeStamp()
            + " | TWITTER LIMIT" 
            + " | @" + threeceeUserObj.screenName
            + " | USER LIMIT: " + statsObj.twitter.limit
            + " | TOTAL LIMIT: " + threeceeUserObj.stats.twitterLimit
          ));
        }

      });

      threeceeUserObj.searchStream.on("error", function(err){

        console.log(chalkError("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | *** TWITTER ERROR: " + err
          + " | *** TWITTER ERROR\n" + jsonPrint(err)
        ));


        statsObj.twitter.errors += 1;
        threeceeUserObj.stats.twitterErrors += 1;

        threeceeUserObj.stats.ready = false;
        threeceeUserObj.stats.error = err;
        threeceeUserObj.stats.connected = false;
        threeceeUserObj.stats.authenticated = false;
        threeceeUserObj.stats.twitterTokenErrorFlag = true;

        const errorType = (err.statusCode == 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

        process.send({
          op: "ERROR", 
          threeceeUser: threeceeUserObj.screenName, 
          stats: threeceeUserObj.stats, 
          errorType: errorType, 
          error: err
        });
      });
      
      threeceeUserObj.searchStream.on("end", function(err){

        threeceeUserObj.searchStream.stop();

        console.log(chalkError("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | *** TWITTER END: " + err
        ));


        statsObj.twitter.errors += 1;
        threeceeUserObj.stats.twitterErrors += 1;

        if (err.statusCode == 401) {
          process.send({
            op: "ERROR", 
            threeceeUser: threeceeUserObj.screenName, 
            stats: threeceeUserObj.stats, 
            errorType: "TWITTER_UNAUTHORIZED", 
            error: err
          });
        }
        else {
          process.send({
            op: "ERROR", 
            threeceeUser: threeceeUserObj.screenName, 
            stats: threeceeUserObj.stats, 
            errorType: "TWITTER_END", 
            error: err
          });
        }
      });
      
      threeceeUserObj.searchStream.on("parser-error", function(err){

        console.log(chalkError("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | *** TWITTER PARSER ERROR: " + err
        ));

        statsObj.twitter.errors += 1;
        threeceeUserObj.stats.twitterErrors += 1;

        process.send({
          op: "ERROR", 
          threeceeUser: threeceeUserObj.screenName, 
          stats: threeceeUserObj.stats, 
          errorType: "TWITTER_PARSER", 
          error: err
        });

        showStats();
      });

      let prevTweetUser;
      
      threeceeUserObj.searchStream.on("tweet", function(tweetStatus){

        if (tweetStatus.user.userId 
          && (tweetStatus.user.userId !== undefined) 
          && ignoreUserSet.has(tweetStatus.user.userId))
        {
          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX IGNORE USER | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        if (tweetStatus.user.location 
          && (tweetStatus.user.location !== undefined) 
          && ignoreLocationsRegEx.test(tweetStatus.user.location))
        {
          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX IGNORE LOCATION | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | LOC: " + tweetStatus.user.location
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        if (tweetStatus.user.lang 
          && (tweetStatus.user.lang !== undefined) 
          && (tweetStatus.user.lang != "en")) 
        { 
          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX IGNORE LANG | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | LANG: " + tweetStatus.user.lang
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        prevTweetUser = tweetIdCache.get(tweetStatus.id_str);

        if (prevTweetUser) {

          statsObj.twitter.duplicateTweetsReceived += 1;

          if (statsObj.twitter.duplicateTweetsReceived % 100 == 0){
            console.log(chalkLog("TSS"
              + " | @" + threeceeUserObj.screenName
              + " | ??? DUP TWEET"
              + " | FILTER DUPs: " + configuration.filterDuplicateTweets
              + " [ $: " + tweetIdCache.getStats().keys + " / " + statsObj.twitter.duplicateTweetsReceived + " DUPs ]"
              + " | " + tweetStatus.id_str 
              + " | CURR @" + tweetStatus.user.screen_name
              + " | PREV @" + prevTweetUser
            ));
          }
          
          if (configuration.filterDuplicateTweets) { return; }
        }

        tweetIdCache.set(tweetStatus.id_str, tweetStatus.user.screen_name);

        tweetStatus.entities.media = [];
        tweetStatus.entities.polls = [];
        tweetStatus.entities.symbols = [];
        tweetStatus.entities.urls = [];

        threeceeUserObj.stats.rateLimited = false;

        twitterStats.meter("tweetsPerSecond").mark();
        twitterStats.meter("tweetsPerMinute").mark();

        threeceeUserObj.rateMeter.meter("tweetsPerSecond").mark();
        threeceeUserObj.rateMeter.meter("tweetsPerMinute").mark();

        threeceeUserObj.stats.tweetsPerSecond = threeceeUserObj.rateMeter.toJSON().tweetsPerSecond["1MinuteRate"];
        threeceeUserObj.stats.tweetsPerMinute = threeceeUserObj.rateMeter.toJSON().tweetsPerMinute["1MinuteRate"];

        statsObj.tweetsReceived+= 1;
        threeceeUserObj.stats.tweetsReceived += 1;

        if (tweetStatus.retweeted_status) {
          statsObj.retweetsReceived += 1;
          threeceeUserObj.stats.retweetsReceived += 1;
        }

        if (tweetStatus.quoted_status) {
          statsObj.quotedTweetsReceived += 1;
          threeceeUserObj.stats.quotedTweetsReceived += 1;
        }

        if (tweetQueue.length < configuration.maxTweetQueue ) {
          tweetQueue.push(tweetStatus);
          statsObj.queues.tweetQueue.size = tweetQueue.length;
        }
        else {
          statsObj.queues.tweetQueue.fullEvents += 1;
        }

        if ((threeceeUserObj.stats.tweetsReceived % 1000 == 0) || (statsObj.tweetsReceived % 1000 == 0)) {
          console.log(chalkTwitter("TSS | <T"
            + " | 3C " + threeceeUserObj.screenName
            + " | " + threeceeUserObj.stats.tweetsPerMinute.toFixed(3) + " TPM"
            + " | TQ " + tweetQueue.length
            + " [ T/R/Q " + statsObj.tweetsReceived + "/" + statsObj.retweetsReceived + "/" + statsObj.quotedTweetsReceived + "]"
            + " | TW " + tweetStatus.id_str
            + " | TLG " + tweetStatus.lang
            + " | U " + tweetStatus.user.id_str
            + " | @" + tweetStatus.user.screen_name
            + " | " + tweetStatus.user.name
            + " | ULG " + tweetStatus.user.lang
            + " | LOC " + tweetStatus.user.location
          ));
        }
      });

    }
    catch(err){
      console.log(chalkError("TSS | CAUGHT ERROR | " + getTimeStamp()
        + " | @" + threeceeUserObj.screenName
        + " | *** TWITTER ERROR: " + err
        + " | *** TWITTER ERROR\n" + jsonPrint(err)
      ));

      statsObj.twitter.errors += 1;
      threeceeUserObj.stats.twitterErrors += 1;

      threeceeUserObj.stats.ready = false;
      threeceeUserObj.stats.error = err;
      threeceeUserObj.stats.connected = false;
      threeceeUserObj.stats.authenticated = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = true;

      const errorType = (err.statusCode == 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

      process.send({
        op: "ERROR", 
        threeceeUser: threeceeUserObj.screenName, 
        stats: threeceeUserObj.stats, 
        errorType: errorType, 
        error: err
      });

      return reject(err);
    }

    resolve();

  });
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

    const result = await initSetFromFile({folder: configDefaultFolder, file: params.searchTermsFile, resolveOnNotFound: false});

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
      ignoreLocationsArray = [...ignoreLocationsSet];
      ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
      ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
      ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "gi");
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
    await initSearchStream();

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
        await initSearchStream();
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

  cnf.verbose = process.env.TSS_VERBOSE_MODE || false;
  cnf.globalTestMode = process.env.TSS_GLOBAL_TEST_MODE || false;
  cnf.testMode = process.env.TSS_TEST_MODE || false;
  cnf.quitOnError = process.env.TSS_QUIT_ON_ERROR || false;

  cnf.twitterQueueIntervalTime = process.env.TSS_TWITTER_QUEUE_INTERVAL || DEFAULT_TWITTER_QUEUE_INTERVAL;
  cnf.maxTweetQueue = process.env.TSS_MAX_TWEET_QUEUE || DEFAULT_MAX_TWEET_QUEUE;

  cnf.twitterConfigFolder = process.env.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER || "/config/twitter"; 
  cnf.twitterConfigFile = process.env.DROPBOX_TSS_DEFAULT_TWITTER_CONFIG_FILE 
    || "altthreecee00.json";

  cnf.statsUpdateIntervalTime = process.env.TSS_STATS_UPDATE_INTERVAL || 60000;

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
    console.error("TSS | TSS | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
    throw err;
  }
}

let sendMessageTimeout;

function initTwitterQueue(cnf, callback){

  console.log(chalkTwitter("TSS | INIT TWITTER QUEUE INTERVAL: " + cnf.twitterQueueIntervalTime));

  clearInterval(tweetQueueInterval);

  let prevTweetId = "";
  let tweetStatus;

  tweetQueueInterval = setInterval(function () {

    if (tweetSendReady && (tweetQueue.length > 0)) {

      tweetSendReady = false;
      statsObj.queues.tweetQueue.ready = false;

      tweetStatus = tweetQueue.shift();
      statsObj.queues.tweetQueue.size = tweetQueue.length;

      if (tweetStatus.id_str != prevTweetId) {

        debug(chalkTwitter("TSS [" + tweetQueue.length + "] " + tweetStatus.id_str));

        sendMessageTimeout = setTimeout(function(){

          console.log(chalkAlert("TSS | *** SEND TWEET TIMEOUT"
            + " | " + msToTime(configuration.sendMessageTimeout)
          ));

        }, configuration.sendMessageTimeout);

        process.send({op: "TWEET", tweet: tweetStatus});

        clearTimeout(sendMessageTimeout);
        prevTweetId = tweetStatus.id_str;
        tweetSendReady = true;
        statsObj.queues.tweetQueue.ready = true;

      }
      else {

        tweetSendReady = true;
        statsObj.queues.tweetQueue.ready = true;

        statsObj.twitter.duplicateTweetsReceived += 1;

        const dupPercent = 100 * statsObj.twitter.duplicateTweetsReceived / statsObj.tweetsReceived;

        debug(chalkAlert("TSS | DUP [ Q: " + tweetQueue.length + "]"
          + " [ " + statsObj.twitter.duplicateTweetsReceived + "/" + statsObj.tweetsReceived
          + " | " + dupPercent.toFixed(1) + "% ]"
          + " | " + tweetStatus.id_str
        ));
      }


    }
  }, cnf.twitterQueueIntervalTime);

  if (callback) { callback(); }
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

    console.log(chalkTwitter("TSS"
      + " | 3C @" + threeceeUserObj.screenName 
      + " | FOLLOW QUEUE INTERVAL: " + params.interval
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

    }, params.interval);

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
      configuration.filterDuplicateTweets = m.filterDuplicateTweets;
      configuration.verbose = m.verbose;
      configuration.testMode = m.testMode;

      threeceeUserObj.screenName = m.threeceeUser;
      threeceeUserObj.twitterConfig = m.twitterConfig;

      console.log(chalkInfo("TSS | INIT"
        + " | TITLE: " + m.title
        + "\nTWITTER CONFIG\n" + jsonPrint(m.twitterConfig)
      ));

      try {
        await initFollowableSearchTermSet();
        await initAllowLocations();
        await initIgnoreLocations();
        await initIgnoreHashtags();
        await initTwitterUser();
        await initSearchTerms(configuration);
        await initSearchStream();
        await initTwitterSearch(configuration);
        await initFollowQueue({interval: configuration.followQueueIntervalTime});
        // await initUnfollowQueue({interval: configuration.followQueueIntervalTime});
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

      saveFile(configuration.twitterConfigFolder, twitterConfigFile, threeceeUserObj.twitterConfig, function(){
        console.log(chalkLog("TSS | SAVED UPDATED AUTH " + configuration.twitterConfigFolder + "/" + twitterConfigFile));

        threeceeUserObj.stats.connected = true;
        threeceeUserObj.stats.twitterFollowLimit = false;

        const twitGetFriendsParams = {
          screen_name: threeceeUserObj.screenName,
          stringify_ids: true
        };

        threeceeUserObj.twitStream.get("friends/ids", twitGetFriendsParams, function(err, data, response) {

          if (err){

            console.log(chalkError("TSS | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
              + " | @" + threeceeUserObj.screenName
              + " | " + getTimeStamp()
              + " | CODE: " + err.code
              + " | STATUS CODE: " + err.statusCode
              + " | " + err.message
            ));

            if (configuration.verbose) {
              console.log("TSS | response\n" + jsonPrint(response));
            }

            threeceeUserObj.stats.twitterErrors += 1;
            threeceeUserObj.stats.authenticated = false;
            threeceeUserObj.stats.error = err;

          }
          else {

            threeceeUserObj.stats.error = false;
            threeceeUserObj.stats.authenticated = true;
            threeceeUserObj.followUserIdSet = new Set(data.ids);

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

              User.findOne({ userId: userId }, function (err, user) {

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
                await initSearchStream();

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

          }
        });
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

      // unfollowQueue.push({threeceeUser: threeceeUserObj.screenName, user: m.user});

      console.log(chalkInfo("TSS | TSS > UNFOLLOW"
        // + " [Q: " + unfollowQueue.length + "]"
        + " 3C @" + threeceeUserObj.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "UNFOLLOW_ID_ARRAY":

      // m.userArray.forEach(function(userId){
      //   // unfollowQueue.push({threeceeUser: threeceeUserObj.screenName, user: { userId: userId }});
      // });

      // console.log(chalkInfo("TSS | TSS > UNFOLLOW_ID_ARRAY"
      //   + " | 3C @" + threeceeUserObj.screenName
      //   + " | Q: " + unfollowQueue.length
      //   + " | USER ARRAY " + m.userArray.length
      // ));
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
        await initSearchStream();

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
      console.error(chalkError("TSS | TWP | *** TSS UNKNOWN OP"
        + " | 3C @" + threeceeUserObj.screenName
        + " | INTERVAL: " + m.op
      ));

  }
});

setTimeout(async function(){

  try{
    configuration = await initialize(configuration);
  }
  catch(err){
    if (err.status != 404) {
      console.error(chalkError("TSS | *** INIT ERROR\n" + jsonPrint(err)));
      quit();
    }
    console.log(chalkError("TSS | TSS | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
  }

  console.log("TSS | TSS | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");

  try {
    global.globalDbConnection = await connectDb();
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
      await initSearchTermsUpdateInterval();
      // await initStatsUpdate(configuration);
    }
    else {
      console.log(chalkInfo("TSS | TSS | WAIT DB CONNECTED ..."));
    }
  }, 1000);

}, 5*ONE_SECOND);
