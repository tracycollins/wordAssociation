/*jslint node: true */
/*jshint sub:true*/
"use strict";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threecee";
// const USER_SHOW_QUEUE_MAX_LENGTH = 500;

const USER_CACHE_DEFAULT_TTL = 10;
const USER_CACHE_CHECK_PERIOD = 1;

const TWEET_ID_CACHE_DEFAULT_TTL = 20;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

const MAX_READY_ACK_WAIT_COUNT = 10;

const TWITTER_MAX_TRACKING_NUMBER = process.env.TWITTER_MAX_TRACKING_NUMBER || 400;
const TWITTER_MAX_FOLLOW_USER_NUMBER = process.env.TWITTER_MAX_FOLLOW_USER_NUMBER || 5000;

const DROPBOX_DEFAULT_SEARCH_TERMS_DIR = "/config/utiltiy/default";
const DROPBOX_DEFAULT_SEARCH_TERMS_FILE = "defaultSearchTerms.txt";

const ONE_SECOND = 1000 ;
const ONE_MINUTE = ONE_SECOND*60 ;

let threeceeUserObj = {};

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const fieldsExclude = {
  histograms: 0,
  countHistory: 0,
  friends: 0
};

const mangledRegEx = /\u00C3.\u00C2|\u00B5/g;


const os = require("os");
let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const _ = require("lodash");
const S = require("string");
const util = require("util");
const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
const Twit = require("../libs/twit");
const moment = require("moment");
const treeify = require("../libs/treeify");
const Measured = require("measured");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");

// ==================================================================
// NODE CACHE
// ==================================================================
let userCacheTtl = process.env.USER_CACHE_DEFAULT_TTL;
if (userCacheTtl === undefined) { userCacheTtl = USER_CACHE_DEFAULT_TTL;}
console.log("TSS | USER CACHE TTL: " + userCacheTtl + " SECONDS");

let userCacheCheckPeriod = process.env.USER_CACHE_CHECK_PERIOD;
if (userCacheCheckPeriod === undefined) { userCacheCheckPeriod = USER_CACHE_CHECK_PERIOD;}
console.log("TSS | USER CACHE CHECK PERIOD: " + userCacheCheckPeriod + " SECONDS");

const userCache = new NodeCache({
  stdTTL: userCacheTtl,
  checkperiod: userCacheCheckPeriod
});


let tweetIdCacheTtl = process.env.TWEET_ID_CACHE_DEFAULT_TTL;
if (tweetIdCacheTtl === undefined) { tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL;}
console.log("TSS | USER CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (tweetIdCacheCheckPeriod === undefined) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD;}
console.log("TSS | USER CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod
});


const debug = require("debug")("tss");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");


const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkRed = chalk.red;
const chalkRedBold = chalk.bold.red;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.red;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkConnect = chalk.green;

const searchTermHashMap = new HashMap();

const followQueue = [];
const ignoreQueue = [];
const unfollowQueue = [];

process.on("SIGHUP", function processSigHup() {
  quit("SIGHUP");
});

process.on("SIGINT", function processSigInt() {
  quit("SIGINT");
});

process.on("disconnect", function processDisconnect() {
  quit("DISCONNECT");
});

const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20,
  verboseMemoryLeak: true
});

let infoTwitterUserObj = {};  // used for general twitter tasks

const twitterStats = Measured.createCollection();
twitterStats.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
twitterStats.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

let twitterSearchInit = false;
let searchTermsUpdateInterval;

let tweetQueue = [];
let tweetSendReady = [];
let tweetQueueInterval;

let stdin;

let configuration = {};
configuration.filterDuplicateTweets = true;
configuration.verbose = false;
configuration.forceFollow = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode
configuration.searchTermsUpdateInterval = 1*ONE_MINUTE;
configuration.followQueueIntervalTime = ONE_MINUTE;
configuration.ignoreQueueInterval = 15 * ONE_SECOND;
configuration.maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;

configuration.sendMessageTimeout = ONE_SECOND;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initSearchTermsTimeout = 1*ONE_MINUTE;
configuration.twitterFollowLimitTimeout = 15*ONE_MINUTE;

configuration.twitterConfig = {};

let resetInProgressFlag = false;

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

let statsObj = {};

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

global.dbConnection = false;
const mongoose = require("mongoose");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");

global.User = mongoose.model("User", userModel.UserSchema);

let dbConnectionReady = false;
let dbConnectionReadyInterval;

let UserServerController;
let userServerController;

let userServerControllerReady = false;


function connectDb(){

  return new Promise(function(resolve, reject){

    try {

      statsObj.status = "CONNECTING MONGO DB";

      wordAssoDb.connect("TSS_" + process.pid, function(err, db){

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
          quit(statsObj.status);
        });

        db.on("error", function(err){
          statsObj.status = "MONGO ERROR";
          console.log(chalkAlert("TSS | @" + threeceeUserObj.screenName + " | *** MONGO DB CONNECTION ERROR: " + err));
          db.close();
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.log(chalkAlert("TSS | @" + threeceeUserObj.screenName + " | *** MONGO DB DISCONNECTED ***"));
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        dbConnectionReady = true;
        statsObj.dbConnectionReady = true;

        global.dbConnection = db;

        console.log(chalk.green("TSS | @" + threeceeUserObj.screenName + " | MONGO DB CONNECTION OPEN"));

        // // UserServerController = require("../userServerController/index.js");
        UserServerController = require("@threeceelabs/user-server-controller");
        userServerController = new UserServerController("TSS_USC");

        userServerControllerReady = false;

        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";

          userServerControllerReady = true;

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
  configuration.searchTermsDir = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_DIR  ;
}
else {
  configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
}

if (process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE !== undefined) {
  configuration.searchTermsFile = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE  ;
}
else {
  configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
}

const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
const DROPBOX_TSS_CONFIG_FILE = process.env.DROPBOX_TSS_CONFIG_FILE || "twitterSearchStreamConfig.json";

const dropboxConfigFolder = "/config/utility";
const dropboxConfigHostFolder = "/config/utility/" + hostname;

const dropboxConfigFile = hostname + "_" + DROPBOX_TSS_CONFIG_FILE;

console.log("TSS | DROPBOX_TSS_CONFIG_FILE: " + DROPBOX_TSS_CONFIG_FILE);

debug("TSS | dropboxConfigFolder : " + dropboxConfigFolder);
debug("TSS | dropboxConfigFile : " + dropboxConfigFile);


const dropboxClient = new Dropbox({ 
  accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  fetch: fetch
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

  statsObj.tweetsPerSecond = threeceeUserObj.stats.tweetsPerSecond;
  statsObj.tweetsPerMinute = threeceeUserObj.stats.tweetsPerMinute;

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

    console.log("TSS | @" + screenName
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

  if ((global.dbConnection !== undefined) && (global.dbConnection.readyState > 0)) {

    global.dbConnection.close(function () {
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

  let options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("TSS | SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      console.error(chalkError("TSS | " + moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + "\nERROR: " + error
      ));
      callback(error.error, null);
    });
}

function loadFile(path, file, callback) {

  // console.log(chalkInfo("TSS | LOAD FOLDER " + path));
  // console.log(chalkInfo("TSS | LOAD FILE " + file));
  // console.log(chalkInfo("TSS | FULL PATH " + path + "/" + file));

  dropboxClient.filesDownload({path: path + "/" + file})
    .then(function(data) {
      console.log("TSS | " + chalkLog(getTimeStamp()
        + " | LOADING FILE FROM DROPBOX FILE: " + path + "/" + file
      ));

      let payload = data.fileBinary;
      debug(payload);

      if (file.match(/\.json$/gi)) {
        let fileObj = JSON.parse(payload);
        return(callback(null, fileObj));
      }
      else {
        return(callback(null, payload));
      }
    })
    .catch(function(error) {
      console.log(chalkError("TSS | *** DROPBOX loadFile ERROR: " + file + " | " + error));
      console.log(chalkError("TSS | *** DROPBOX READ " + file + " ERROR"));

      if ((error.response.status === 404) || (error.response.status === 409)) {
        console.error(chalkError("TSS | *** DROPBOX READ FILE " + file + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return(callback(null, null));
      }
      if (error.status === 0) {
        console.error(chalkError("TSS | *** DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      console.log(chalkError(jsonPrint(error)));
      return(callback(error, null));
    })
    .catch(function(err) {
      console.log(chalkError("TSS | *** ERROR DROPBOX LOAD FILE\n" + err));
      callback(err, null);
    });
}

function initStatsUpdate(cnf, callback){

  console.log(chalkInfo("TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

  setInterval(async function() {

    statsObj.elapsed = moment().valueOf() - statsObj.startTime;
    statsObj.timeStamp = moment().format(defaultDateTimeFormat);

    showStats();

    await checkTwitterRateLimit();

  }, cnf.statsUpdateIntervalTime);


  callback(null, cnf);
}

function printUserObj(title, user) {

  user = userDefaults(user);

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


function initTwit(params){

  return new Promise(function(resolve, reject){

    console.log(chalkLog("TSS | INIT TWIT USER @" + threeceeUserObj.twitterConfig.screenName));

    debug(chalkInfo("TSS | INIT TWIT | TWITTER CONFIG " 
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

    threeceeUserObj.searchStream = {};
    threeceeUserObj.searchTermSet = new Set();

    console.log(chalkTwitter("TSS | INIT TWITTER USER"
      + " | NAME: " + threeceeUserObj.twitterConfig.screenName
    ));

    const twitGetFriendsParams = {
      screen_name: threeceeUserObj.twitterConfig.screenName,
      stringify_ids: true
    };

    threeceeUserObj.twitStream.get("friends/ids", twitGetFriendsParams, function(err, data, response) {

      if (err){

        console.log(chalkError("TSS | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
          + " | @" + threeceeUserObj.twitterConfig.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

        threeceeUserObj.stats.error = err;
        threeceeUserObj.stats.twitterErrors += 1;
        threeceeUserObj.stats.authenticated = false;

        return reject(err);
      }

      threeceeUserObj.stats.error = false;
      threeceeUserObj.stats.authenticated = true;
      threeceeUserObj.stats.twitterTokenErrorFlag = false;

      threeceeUserObj.followUserScreenNameSet = new Set();
      threeceeUserObj.followUserIdSet = new Set(data.ids);

      console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
        + " | @" + threeceeUserObj.twitterConfig.screenName
        + " | " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
        // + " | DATA IDS: " + data.ids.length + " FRIENDS"
        // + " | PREV CURSOR: " + data.previous_cursor_str
        // + " | NEXT CURSOR: " + data.next_cursor_str
      ));

      let userIndex = 0;
      let printString = "";

      async.eachSeries([...threeceeUserObj.followUserIdSet], function(userId, cb){

        userIndex += 1;

        if (configuration.testMode && (userIndex > 100)){
          return cb();
        }

        if (followingUserIdHashMap.has(userId)){

          const threeceeFollowingInHashMap = followingUserIdHashMap.get(userId);

          if (threeceeFollowingInHashMap !== threeceeUserObj.twitterConfig.screenName) {

            console.log(chalkLog("TSS | !!! TWITTER USER FOLLOW MISMATCH"
              + " | UID: " + userId
              + " | IN HM: 3C @" + threeceeFollowingInHashMap
              + " | CUR 3C @: " + threeceeUserObj.twitterConfig.screenName
            ));

            const user = new global.User({userId: userId});

            if (threeceeFollowingInHashMap < threeceeUserObj.twitterConfig.screenName) {

              // threeceeUserObj.searchTermSet.delete("@" + user.screenName.toLowerCase());

              unfollowQueue.push({threeceeUser: threeceeUserObj.twitterConfig.screenName, user: user});

              console.log(chalkLog("TSS | > UNFOLLOW Q | ALREADY FOLLOWING"
                + " [" + unfollowQueue.length + "]"
                + " | UID: " + user.userId
                + " | 3C IN HM @: " + threeceeFollowingInHashMap
                + " | 3C CUR @: " + threeceeUserObj.twitterConfig.screenName
              ));
            }
            else {

              // threeceeUserObj.searchTermSet.delete("@" + user.screenName.toLowerCase());

              unfollowQueue.push({threeceeUser: threeceeFollowingInHashMap, user: user});

              console.log(chalkLog("TSS | > UNFOLLOW Q"
                + " [" + unfollowQueue.length + "]"
                + " | UID: " + user.userId
                + " | 3C @" + threeceeFollowingInHashMap
              ));
            }

            return cb();

          }
          else {
            console.log(chalkAlert("TSS | ??? TWITTER USER FOLLOW HM HIT"
              + " | UID: " + userId
              + " | IN HM: 3C @" + threeceeFollowingInHashMap
              + " | CUR 3C @: " + threeceeUserObj.twitterConfig.screenName
            ));

            return cb();
          }

        }
        else {

          followingUserIdHashMap.set(userId, threeceeUserObj.twitterConfig.screenName);

          global.User.findOne({ userId: userId }, function (err, user) {

            if (err) { 
              console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
              return cb(err);
            }

            if (user) {

              // if (threeceeUserObj.searchTermSet.size < TWITTER_MAX_TRACKING_NUMBER) {
              //   threeceeUserObj.searchTermSet.add(user.screenName.toLowerCase());
              // }

              threeceeUserObj.followUserScreenNameSet.add(user.screenName.toLowerCase());

              if (configuration.verbose || (userIndex % 100 === 0)) {
                printString = "TSS | [ " + userIndex + "/" + threeceeUserObj.followUserIdSet.size + " ] @" + threeceeUserObj.twitterConfig.screenName + " | DB HIT";
                printUserObj(printString, user);
              }

              if (!user.following) { 
                user.following = true;
                user.threeceeFollowing = threeceeUserObj.twitterConfig.screenName;
                user.markModified("following");
                user.markModified("threeceeFollowing");
                user.save(function(err){
                  if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                  cb();
                });
              }
              else if (user.following && (user.threeceeFollowing > threeceeUserObj.twitterConfig.screenName)) {
                console.log(chalk.black("TSS | -X- CHANGE 3C FOLLOWING"
                  + " | UID: " + user.userId
                  + " | @" + user.screenName
                  + " | 3C @" + user.threeceeFollowing + " -> " + threeceeUserObj.twitterConfig.screenName
                ));
                user.threeceeFollowing = threeceeUserObj.twitterConfig.screenName;
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
          threeceeUser: threeceeUserObj.twitterConfig.screenName, 
          stats: threeceeUserObj.stats, 
          twitterFollowing: threeceeUserObj.followUserIdSet.size,
          twitterFriends: [...threeceeUserObj.followUserIdSet]
        });

        resolve(threeceeUserObj);

      });
    });
  });
}

function threeceeUserUnfollowReady(threeceeUser){

  if (!threeceeUserObj.stats.authenticated) { 
    console.log("3C @" + threeceeUser + " | NOT READY | NOT AUTHENTICATED");
    return false; 
  }

  if (threeceeUserObj.stats.error) { 
    console.log("3C @" + threeceeUser + " | NOT READY | ERROR: " + threeceeUserObj.stats.error);
    return false; 
  }

  if (threeceeUserObj.stats.twitterTokenErrorFlag) { 
    console.log("3C @" + threeceeUser + " | NOT READY | TWITTER TOKEN ERROR: " + threeceeUserObj.stats.twitterTokenErrorFlag);
    return false; 
  }

  if (threeceeUserObj.stats.twitterRateLimitExceptionFlag) { 
    console.log("3C @" + threeceeUser + " | NOT READY | TWITTER RATE LIMIT"
      + " | LIM: " + threeceeUserObj.stats.twitterRateLimit
      + " | REM: " + threeceeUserObj.stats.twitterRateLimitRemaining
      + " | RST: " + getTimeStamp(threeceeUserObj.stats.twitterRateLimitResetAt)
      + " | NOW: " + moment().format(compactDateTimeFormat)
      + " | IN " + msToTime(threeceeUserObj.stats.twitterRateLimitRemainingTime)
    );
    return false; 
  }

  return true;
}

function initTwitterUser(params){

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("TSS | TWITTER USER: @" + threeceeUserObj.screenName));

    try {
      await initTwit();
      resolve();
    }
    catch(err){
      console.log(chalkError("TSS | *** TWIT INIT ERROR"
        + " | @" + threeceeUserObj.screenName
        + " | " + getTimeStamp()
        + " | " + err
      ));
      return reject(err);
    }

  });
}

function getFileMetadata(path, file, callback) {

  const fullPath = path + "/" + file;
  debug(chalkInfo("TSS | FOLDER " + path));
  debug(chalkInfo("TSS | FILE " + file));
  // console.log(chalkInfo("TSS | getFileMetadata FULL PATH: " + fullPath));

  dropboxClient.filesGetMetadata({path: fullPath})
    .then(function(response) {
      debug(chalkInfo("TSS | FILE META\n" + jsonPrint(response)));
      return(callback(null, response));
    })
    .catch(function(error) {
      console.log(chalkError("TSS | GET FILE METADATA ERROR: " + error));
      console.log(chalkError("TSS | GET FILE METADATA ERROR\n" + jsonPrint(error)));
      return(callback(error, null));
    });
}

const MAX_FOLLOW_USER_IDS = 5000;

let followingUserIdHashMap = new HashMap();

let prevFileModifiedMoment = moment("2010-01-01");

function checkTwitterRateLimit(params){

  return new Promise(function(resolve, reject){

    if (threeceeUserObj.twitStream === undefined) {
      return reject(new Error("TWIT UNDEFINED", params));
    }

    threeceeUserObj.twitStream.get("application/rate_limit_status", {screen_name: threeceeUserObj.screenName}, function(err, data, response) {
      
      if (err){

        console.log(chalkError("TSS | *** TWITTER ACCOUNT ERROR"
          + " | @" + threeceeUserObj.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

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
            + " | EXP: " + threeceeUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
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
        + " | EXP: " + threeceeUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
        + " | RST: " + moment(threeceeUserObj.stats.twitterRateLimitResetAt).format(compactDateTimeFormat)
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | IN " + msToTime(threeceeUserObj.stats.twitterRateLimitRemainingTime)
      ));

      resolve();

    });

  });
}

function initSearchStream(params){

  return new Promise(function(resolve, reject){

    let filter = {};
    filter.track = [];
    filter.follow = [];

    if (threeceeUserObj.searchTermSet.size > 0) { filter.track = [...threeceeUserObj.searchTermSet]; }
    if (threeceeUserObj.followUserIdSet.size > 0) { filter.follow = [...threeceeUserObj.followUserIdSet]; }

    console.log(chalkInfo("TSS | INIT SEARCH STREAM"
      + " | @" + threeceeUserObj.screenName
      + " | SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
      + " | FILTER TRACK SIZE: " + filter.track.length
      + " | FILTER FOLLOW SIZE: " + filter.follow.length
    ));

    try {
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
        console.log(chalkTwitter("TSS | " + getTimeStamp()
          + " | TWITTER RECONNECT"
          + " | @" + threeceeUserObj.screenName
        ));

        if (data.type === "rate-limit") {
          threeceeUserObj.stats.rateLimited = true;
        }
        else {
          threeceeUserObj.stats.rateLimited = false;
        }

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

        debug(chalkTwitter("TSS | " + getTimeStamp()
          + " | TWITTER LIMIT" 
          + " | @" + threeceeUserObj.screenName
          + " | USER LIMIT: " + statsObj.twitter.limit
          + " | TOTAL LIMIT: " + threeceeUserObj.stats.twitterLimit
        ));
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

        const errorType = (err.statusCode === 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

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

        if (err.statusCode === 401) {
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

        prevTweetUser = tweetIdCache.get(tweetStatus.id_str);

        if (prevTweetUser) {

          statsObj.twitter.duplicateTweetsReceived += 1;

          if (statsObj.twitter.duplicateTweetsReceived % 1000 === 0){
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

        statsObj.tweetsReceived+= 1 ;
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

        if ((threeceeUserObj.stats.tweetsReceived % 1000 === 0) || (statsObj.tweetsReceived % 1000 === 0)) {
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

      const errorType = (err.statusCode === 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

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

function initSearchTerms(params){

  return new Promise(function(resolve, reject){

    console.log(chalkTwitter("TSS | INIT TERMS | @" + threeceeUserObj.screenName));

    getFileMetadata(params.searchTermsDir, params.searchTermsFile, function(err, response){

      if (err) {
        return reject(err);
      }

      const fileModifiedMoment = moment(new Date(response.client_modified));
    
      if (fileModifiedMoment.isSameOrBefore(prevFileModifiedMoment)){
        console.log(chalkInfo("TSS | SEARCH TERMS FILE BEFORE OR EQUAL"
          + " | PREV: " + prevFileModifiedMoment.format(compactDateTimeFormat)
          + " | " + fileModifiedMoment.format(compactDateTimeFormat)
        ));
        configEvents.emit("SEARCH_TERM_CONFIG_COMPLETE");
        return resolve(0);
      }

      console.log(chalkInfo("TSS | SEARCH TERMS FILE AFTER"));

      prevFileModifiedMoment = moment(fileModifiedMoment);

      loadFile(params.searchTermsDir, params.searchTermsFile, function(err, data){

        if (err){
          console.log(chalkError("TSS | LOAD FILE ERROR\n" + err));
          return reject(err);
        }

        if (data  === undefined){
          console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
            + " | " + params.searchTermsFile
          ));
          return reject(new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED"));
        }

        debug(chalkInfo("TSS | DROPBOX SEARCH TERMS FILE\n" + jsonPrint(data)));

        const dataConvertAccent = data.toString().replace(/Ã©/g, "e");
        const dataConvertTilde = dataConvertAccent.toString().replace(/Ã£/g, "a");
        const totalDataArray = dataConvertTilde.toString().split("\n");

        const totalDataArrayChunkArray = _.chunk(totalDataArray, TWITTER_MAX_TRACKING_NUMBER); // for althreecee[0:5] twitter accounts

        let dataArray = [];

        console.log(chalk.blue("TSS | FILE CONTAINS " + totalDataArray.length + " TOTAL SEARCH TERMS "));

        console.log(chalk.blue("TSS | SEARCH TERM INIT | @" + threeceeUserObj.screenName));

        switch (threeceeUserObj.screenName) {
          case "altthreecee00":
            dataArray = totalDataArrayChunkArray[0] || [];
          break;
          case "altthreecee01":
            dataArray = totalDataArrayChunkArray[1] || [];
          break;
          case "altthreecee02":
            dataArray = totalDataArrayChunkArray[2] || [];
          break;
          case "altthreecee03":
            dataArray = totalDataArrayChunkArray[3] || [];
          break;
          case "altthreecee04":
            dataArray = totalDataArrayChunkArray[4] || [];
          break;
          case "altthreecee05":
            dataArray = totalDataArrayChunkArray[5] || [];
          break;
        }

        if (dataArray.length < TWITTER_MAX_TRACKING_NUMBER) {

          const screenNamesToAdd = TWITTER_MAX_TRACKING_NUMBER - dataArray.length;

          console.log(chalkLog("TSS | ADDING " + screenNamesToAdd + " SCREEN NAMES TO TRACK SET"));

          dataArray = _.concat(dataArray, [...threeceeUserObj.followUserScreenNameSet]);
        }
        if (dataArray === 0){
          console.log(chalkAlert("TSS | ??? NO SEACH TERMS |@" + threeceeUserObj.screenName));
          return resolve(0);
        }

        console.log(chalk.blue("TSS | SEACH TERM CHUNK START"
          + " | @" + threeceeUserObj.screenName 
          + " | " + dataArray[0] 
          + " | " + dataArray.length + " SEACH TERMS"
        ));

        async.whilst( 
          function(){ 
            return ((threeceeUserObj.searchTermSet.size < TWITTER_MAX_TRACKING_NUMBER)
              && (dataArray.length > 0));
          },
          function(cb){

            let searchTerm = dataArray.shift();

            searchTerm = searchTerm.replace(/^\s+/g, "");
            searchTerm = searchTerm.replace(/\s+$/g, "");
            searchTerm = searchTerm.replace(/\s+/g, " ");

            const searchTermString = new S(searchTerm);

            if (!searchTermHashMap.has(searchTerm) 
              && !searchTermString.startsWith("#")
              && !searchTermString.isEmpty()
              && !searchTerm.match(mangledRegEx)
            ){

              threeceeUserObj.searchTermSet.add(searchTerm);
              searchTermHashMap.set(searchTerm, threeceeUserObj.screenName);

              debug(chalkInfo("TSS | +++ TRACK"
                + " | @" + threeceeUserObj.screenName
                + " | TRACKING: " + threeceeUserObj.searchTermSet.size 
                + "/" + TWITTER_MAX_TRACKING_NUMBER + " MAX"
                + " | SEARCH TERM: " + searchTerm
              ));

              cb();

            }
            else {
              debug(chalkInfo("TSS | --- SKIP TRACK"
                + " | @" + threeceeUserObj.screenName
                + " | IN HM: " + searchTermHashMap.has(searchTerm)
                + " | SEARCH TERM: " + searchTerm
              ));
              cb();
            }
          },
          function(err){

            if (err) {
              console.log(chalkError("TSS | *** twitterTrack ERROR"
                + " | @" + threeceeUserObj.screenName 
                + " | ERROR: " + err
              ));
              return(cb(err));
            }

            initSearchStream()
            .then(function(){
              console.log(chalkLog("TSS | TRACK COMPLETE"
                + " | @" + threeceeUserObj.screenName 
                + " | TRACKING " + threeceeUserObj.searchTermSet.size + " SEARCH TERMS"
              ));
              resolve(threeceeUserObj.searchTermSet.size);
            })
            .catch(function(err){
              console.log(chalkError("TSS | *** INIT SEARCH STREAM ERROR"
                + " | @" + threeceeUserObj.screenName 
                + " | ERROR: " + err
              ));
              return reject(err);
            });

          }
        );
      
      });
    });

  });
}

function initialize(cnf, callback){

  console.log(chalkLog("WAS | TSS | INITIALIZE"
    + " | @" + cnf.threeceeUser
    // + "\n" + jsonPrint(cnf)
  ));

  if (debug.enabled || debugCache.enabled || debugQ.enabled){
    console.log("\nTSS | %%%%%%%%%%%%%%\nTSS | DEBUG ENABLED \nTSS | %%%%%%%%%%%%%%\n");
  }

  cnf.verbose = process.env.TSS_VERBOSE_MODE || false ;
  cnf.globalTestMode = process.env.TSS_GLOBAL_TEST_MODE || false ;
  cnf.testMode = process.env.TSS_TEST_MODE || false ;
  cnf.quitOnError = process.env.TSS_QUIT_ON_ERROR || false ;

  cnf.twitterQueueIntervalTime = process.env.TSS_TWITTER_QUEUE_INTERVAL || DEFAULT_TWITTER_QUEUE_INTERVAL ;
  cnf.maxTweetQueue = process.env.TSS_MAX_TWEET_QUEUE || DEFAULT_MAX_TWEET_QUEUE ;

  cnf.twitterConfigFolder = process.env.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER || "/config/twitter"; 
  cnf.twitterConfigFile = process.env.DROPBOX_TSS_DEFAULT_TWITTER_CONFIG_FILE 
    || "altthreecee00.json";

  cnf.statsUpdateIntervalTime = process.env.TSS_STATS_UPDATE_INTERVAL || 60000;

  debug(chalkWarn("TSS | dropboxConfigFolder: " + dropboxConfigFolder));
  debug(chalkWarn("TSS | dropboxConfigFile  : " + dropboxConfigFile));

  loadFile(dropboxConfigHostFolder, dropboxConfigFile, function(err, loadedConfigObj){

    // let commandLineConfigKeys;
    let configArgs;

    if (!err) {
      debug(dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

      if (loadedConfigObj.TSS_VERBOSE_MODE  !== undefined){
        console.log("TSS | LOADED TSS_VERBOSE_MODE: " + loadedConfigObj.TSS_VERBOSE_MODE);
        cnf.verbose = loadedConfigObj.TSS_VERBOSE_MODE;
      }

      if (loadedConfigObj.TSS_GLOBAL_TEST_MODE  !== undefined){
        console.log("TSS | LOADED TSS_GLOBAL_TEST_MODE: " + loadedConfigObj.TSS_GLOBAL_TEST_MODE);
        cnf.globalTestMode = loadedConfigObj.TSS_GLOBAL_TEST_MODE;
      }

      if (loadedConfigObj.TSS_TEST_MODE  !== undefined){
        console.log("TSS | LOADED TSS_TEST_MODE: " + loadedConfigObj.TSS_TEST_MODE);
        cnf.testMode = loadedConfigObj.TSS_TEST_MODE;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER  !== undefined){
        console.log("TSS | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER));
        cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
      }

      if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR  !== undefined){
        console.log("TSS | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_DIR: " 
          + jsonPrint(loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR));
        cnf.searchTermsDir = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
      }

      if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE  !== undefined){
        console.log("TSS | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_FILE: " 
          + jsonPrint(loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE));
        cnf.searchTermsFile = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
      }

      if (loadedConfigObj.TSS_STATS_UPDATE_INTERVAL  !== undefined) {
        console.log("TSS | LOADED TSS_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TSS_STATS_UPDATE_INTERVAL);
        cnf.statsUpdateIntervalTime = loadedConfigObj.TSS_STATS_UPDATE_INTERVAL;
      }

      if (loadedConfigObj.TSS_MAX_TWEET_QUEUE  !== undefined) {
        console.log("TSS | LOADED TSS_MAX_TWEET_QUEUE: " + loadedConfigObj.TSS_MAX_TWEET_QUEUE);
        cnf.maxTweetQueue = loadedConfigObj.TSS_MAX_TWEET_QUEUE;
      }

      // OVERIDE CONFIG WITH COMMAND LINE ARGS

      configArgs = Object.keys(cnf);

      if (cnf.verbose) {
        configArgs.forEach(function(arg){
          console.log("TSS | FINAL CONFIG | " + arg + ": " + cnf[arg]);
        });
      }

      return(callback(err, cnf));

    }
    else {
      console.error("TSS | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));

      if (err.status === 404){

        configArgs = Object.keys(cnf);

        configArgs.forEach(function(arg){
          console.log("TSS | FINAL CONFIG | " + arg + ": " + cnf[arg]);
        });

      }
      return(callback(err, cnf));
     }
  });
}

let followQueueReady = true;
let followQueueInterval;
let sendMessageTimeout;

function initFollowQueue(params){

  return new Promise(async function(resolve, reject){


    try {

      console.log(chalkTwitter("TSS"
        + " | 3C @" + threeceeUserObj.screenName 
        + " | FOLLOW QUEUE INTERVAL: " + params.interval
      ));

      clearInterval(followQueueInterval);

      let followObj;
      let createParams = {};
      createParams.follow = true;

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
            // + "\nfollowObj\n" + jsonPrint(followObj)
            // + "\ncreateParams\n" + jsonPrint(createParams)
          ));


          threeceeUserObj.twitStream.post("friendships/create", createParams, function(err, data, response) {
            if (err){
              console.log(chalkError("TSS | *** TWITTER FOLLOW ERROR"
                + " | @" + threeceeUserObj.screenName
                + " | ERROR: " + err
                + "\ncreateParams\n" + jsonPrint(createParams)
              ));
              followQueueReady = true;
            }
            else {
              console.log(chalk.green("TSS | +++ TWITTER FOLLOWING"
                + " | 3C @" + threeceeUserObj.screenName
                + " | @" + data.screen_name
                + " | ID: " + data.id_str
                + " | " + data.name
                // + "\ndata\n" + jsonPrint(data)
              ));

              threeceeUserObj.followUserIdSet.add(data.id_str);

              followQueueReady = true;
            }
          });
        }

      }, params.interval);

      resolve();

    }
    catch(err){
      console.log(chalkError("TSS | *** TWIT INIT FOLLOW ERROR"
        + " | @" + threeceeUserObj.screenName
        + " | " + getTimeStamp()
        + " | " + err
      ));
      return reject(err);
    }

  });
}

let unfollowQueueReady = true;
let unfollowQueueInterval;

function initUnfollowQueue(params){

  return new Promise(async function(resolve, reject){

    try {

      console.log(chalkTwitter("TSS"
        + " | 3C @" + threeceeUserObj.screenName 
        + " | UNFOLLOW QUEUE INTERVAL: " + params.interval
      ));

      clearInterval(unfollowQueueInterval);

      let unfollowObj;
      let createParams = {};
      createParams.unfollow = true;

      unfollowQueueInterval = setInterval(function () {

        if (unfollowQueueReady && (unfollowQueue.length > 0)) {

          unfollowQueueReady = false;

          unfollowObj = unfollowQueue.shift();

          if (unfollowObj.user.userId) { createParams.user_id = unfollowObj.user.userId; }
          if (unfollowObj.user.screenName) { createParams.screen_name = unfollowObj.user.screenName; }

          statsObj.queues.unfollowQueue.size = unfollowQueue.length;

          if (configuration.verbose) {
            console.log(chalkTwitter("TSS | --> TWITTER UNFOLLOW"
              + " [ UFQ: " + unfollowQueue.length + " ]"
              + " | 3C @" + threeceeUserObj.screenName
              + " | @" + unfollowObj.user.screenName
              + " | UID: " + unfollowObj.user.userId
            ));
          }

          threeceeUserObj.twitStream.post("friendships/destroy", createParams, function(err, data, response) {
            if (err){
              console.log(chalkError("TSS | *** TWITTER UNFOLLOW ERROR"
                + " [ UFQ: " + unfollowQueue.length + " ]"
                + " | @" + threeceeUserObj.screenName
                + " | ERROR: " + err
                + "\ncreateParams\n" + jsonPrint(createParams)
              ));
              unfollowQueueReady = true;
            }
            else {
              console.log(chalk.green("TSS | XXX TWITTER UNFOLLOWING"
                + " [ UFQ: " + unfollowQueue.length + " ]"
                + " | 3C @" + threeceeUserObj.screenName
                + " | @" + data.screen_name
                + " | ID: " + data.id_str
                + " | " + data.name
              ));

              threeceeUserObj.followUserIdSet.delete(data.id_str);

              unfollowQueueReady = true;
            }
          });
        }

      }, params.interval);

      resolve();

    }
    catch(err){
      console.log(chalkError("TSS | *** TWIT INIT UNFOLLOW ERROR"
        + " | @" + threeceeUserObj.screenName
        + " | " + getTimeStamp()
        + " | " + err
      ));
      return reject(err);
    }

  });
}

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

      if (tweetStatus.id_str !== prevTweetId) {

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

        statsObj.twitter.duplicateTweetsReceived += 1 ;

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

  return new Promise(function(resolve, reject){

    twitterSearchInit = true;

    console.log(chalkTwitter("TSS | INIT TWITTER SEARCH"));

    initTwitterQueue(cnf);

    console.log(chalkTwitter("TSS | " + getTimeStamp() 
      + " | ENABLE TWEET STREAM"
      + " | " + searchTermHashMap.keys().length + " SEARCH TERMS"
    ));

    resolve();

  });

}

process.on("message", async function(m) {

  debug(chalkAlert("TSS | RX MESSAGE"
    + " | OP: " + m.op
  ));

  switch (m.op) {

    case "QUIT":
      console.log(chalkAlert("TSS | QUIT"));
      quit("PARENT QUIT");
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
      ));

      try {
        await initTwitterUser();
        await initSearchTerms(configuration)
        await initTwitterSearch(configuration);
        await initFollowQueue({interval: configuration.followQueueIntervalTime});
        await initUnfollowQueue({interval: configuration.followQueueIntervalTime});
      }
      catch(err){
        console.log(chalkError("TSS | *** INIT ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }

    break;

    case "USER_AUTHENTICATED":

      if (m.user.screenName !== threeceeUserObj.screenName) {
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

      const authObj = threeceeUserObj.twitStream.getAuth();

      console.log(chalkLog("TSS | CURRENT AUTH\n" + jsonPrint(authObj)));

      threeceeUserObj.twitStream.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

      const authObjNew = threeceeUserObj.twitStream.getAuth();

      threeceeUserObj.twitterConfig.access_token = authObjNew.access_token;
      threeceeUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
      threeceeUserObj.twitterConfig.TOKEN = authObjNew.access_token;
      threeceeUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

      console.log(chalkError("TSS | UPDATED AUTH\n" + jsonPrint(authObjNew)));

      const twitterConfigFile = threeceeUserObj.screenName + ".json";

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

                if (threeceeFollowingInHashMap !== threeceeUserObj.screenName) {

                  console.log(chalkLog("TSS | !!! TWITTER USER FOLLOW MISMATCH"
                    + " | UID: " + userId
                    + " | IN HM: 3C @" + threeceeFollowingInHashMap
                    + " | CUR 3C @: " + threeceeUserObj.screenName
                  ));

                  if (threeceeFollowingInHashMap < threeceeUserObj.screenName) {

                    unfollowQueue.push({threeceeUser: threeceeUserObj.screenName, user: { userId: userId} });

                    console.log(chalkLog("TSS | > UNFOLLOW Q"
                      + "[" + unfollowQueue.length + "]"
                      + " | 3C @: " + threeceeUserObj.screenName
                      + " | UID: " + userId
                    ));

                  }
                  else {

                    unfollowQueue.push({threeceeUser: threeceeUserObj.screenName, user: { userId: userId} });

                    console.log(chalkLog("TSS | > UNFOLLOW Q"
                      + "[" + unfollowQueue.length + "]"
                      + " | 3C @: " + threeceeFollowingInHashMap
                      + " | UID: " + userId
                    ));

                  }

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

              global.User.findOne({ userId: userId }, function (err, user) {

                if (err) { 
                  console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
                  return cb(err);
                }

                if (user) {

                  if (configuration.verbose || (userIndex % 100 === 0)){
                    printString = "TSS | [ " + userIndex + "/" + threeceeUserObj.followUserIdSet.size + " ] @" + threeceeUserObj.screenName + " | DB HIT";
                  }

                  printUserObj(printString, user);

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
                    + " @" + threeceeUserObj.screenName 
                    + " | DB USER MISS  | UID: " + userId
                  ));
                  cb();
                }
              });

            }, function(err){

              initSearchTerms(configuration)
              .then(function(status){

                console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE"));
                debug("initSearchTerms status\n" + jsonPrint(status));

                if (!twitterSearchInit) { initTwitterSearch(configuration); }

                process.send({
                  op: "TWITTER_STATS", 
                  threeceeUser: threeceeUserObj.screenName, 
                  stats: threeceeUserObj.stats, 
                  twitterFollowing: threeceeUserObj.followUserIdSet.size,
                  twitterFriends: [...threeceeUserObj.followUserIdSet]
                });

              })
              .catch(function(err){
                process.send({
                  op: "TWITTER_ERROR", 
                  threeceeUser: threeceeUserObj.screenName, 
                  err: err
                });
              });

            });

          }

        });
      });
    break;

    case "FOLLOW":
      console.log(chalkInfo("TSS | FOLLOW"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
        + " | FORCE FOLLOW: " + m.forceFollow
      ));

      if (m.forceFollow !== undefined) { configuration.forceFollow = m.forceFollow; }

      followQueue.push(m);
    break;

    case "UNFOLLOW":

      unfollowQueue.push({threeceeUser: threeceeUserObj.twitterConfig.screenName, user: m.user});

      console.log(chalkInfo("TSS | WAS > UNFOLLOW"
        + " | Q: " + unfollowQueue.length
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "UNFOLLOW_ID_ARRAY":

      m.userArray.forEach(function(userId){
        unfollowQueue.push({threeceeUser: threeceeUserObj.twitterConfig.screenName, user: { userId: userId }});
      });

      console.log(chalkInfo("TSS | WAS > UNFOLLOW_ID_ARRAY"
        + " | Q: " + unfollowQueue.length
        + " | USER ARRAY " + m.userArray.length
      ));
    break;

    case "IGNORE":
      console.log(chalkInfo("TSS | WAS > IGNORE"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "UPDATE_SEARCH_TERMS":
      console.log(chalkLog("TSS | UPDATE SEARCH TERMS"));

      initSearchTerms(configuration)
      .then(function(status){
        console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE"));
        debug("initSearchTerms status\n" + jsonPrint(status));
        if (!twitterSearchInit) { 
          initTwitterSearch(configuration);
        }
      })
      .catch(function(err){
        console.log(chalkError("TSS | *** INIT SEARCH TERMS ERROR: " + err));
        quit();
        return;
      });
    break;

    case "PING":
      debug(chalkLog("TSS | TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){

        process.send({ 
          op: "PONG", pongId: 
          m.pingId
        });

      }, 1000);
    break;

    default:
      console.error(chalkError("TSS | TWP | *** TSS UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));

  }
});

setTimeout(function(){

  initialize(configuration, function(err, cnf){

    if (err && (err.status !== 404)) {
      console.error(chalkError("TSS | *** INIT ERROR\n" + jsonPrint(err)));
      quit();
    }

    configuration = cnf;

    console.log(chalkLog("TSS | STARTED " + getTimeStamp() + "\n"));

    connectDb(function(err, db){

      if (err) {
        dbConnectionReady = false;
        console.log(chalkError("TSS | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
        quit("MONGO DB CONNECT ERROR");
      }

      // UserServerController = require("@threeceelabs/user-server-controller");
      // userServerController = new UserServerController("TSS_USC");

      // userServerControllerReady = false;

      // userServerController.on("ready", function(appname){
      //   userServerControllerReady = true;
      //   console.log(chalkLog("TSS | USC READY | " + appname));
      // });

      // User = mongoose.model("User", userModel.UserSchema);

      dbConnectionReady = true;
    });

    dbConnectionReadyInterval = setInterval(function() {

      if (dbConnectionReady) {

        clearInterval(dbConnectionReadyInterval);

      }
      else {
        console.log(chalkInfo("TSS | WAIT DB CONNECTED ..."));
      }
    }, 1000);

  });
}, 5*ONE_SECOND);


