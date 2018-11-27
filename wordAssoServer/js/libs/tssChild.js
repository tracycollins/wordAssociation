/*jslint node: true */
/*jshint sub:true*/
"use strict";

process.title = "wa_node_child_tss";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threecee";
const USER_SHOW_QUEUE_MAX_LENGTH = 500;

const USER_CACHE_DEFAULT_TTL = 10;
const USER_CACHE_CHECK_PERIOD = 1;

const MAX_READY_ACK_WAIT_COUNT = 10;

const TWITTER_MAX_TRACKING_NUMBER = process.env.TWITTER_MAX_TRACKING_NUMBER || 400;
const TWITTER_MAX_FOLLOW_USER_NUMBER = process.env.TWITTER_MAX_FOLLOW_USER_NUMBER || 5000;

const DROPBOX_DEFAULT_SEARCH_TERMS_DIR = "/config/utiltiy/default";
const DROPBOX_DEFAULT_SEARCH_TERMS_FILE = "defaultSearchTerms.txt";

const ONE_SECOND = 1000 ;
const ONE_MINUTE = ONE_SECOND*60 ;

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
const threeceeUserHashMap = new HashMap();
const twitterUsersHashMap = new HashMap();  // map of twitter user --> threeceeUser following

const twitterFollowQueue = [];
const ignoreQueue = [];
const unfollowQueue = [];
const userShowQueue = [];

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
let tweetQueueInterval;

let stdin;

let configuration = {};
configuration.verbose = false;
configuration.forceFollow = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode
configuration.searchTermsUpdateInterval = 1*ONE_MINUTE;
configuration.userShowQueueInterval = 15 * ONE_SECOND;
configuration.ignoreQueueInterval = 15 * ONE_SECOND;
configuration.unfollowQueueInterval = 15 * ONE_SECOND;
configuration.maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;

configuration.sendMessageTimeout = ONE_SECOND;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initSearchTermsTimeout = 1*ONE_MINUTE;
configuration.initTwitterUsersTimeout = 1*ONE_MINUTE;
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

statsObj.tweetsReceived = 0;
statsObj.retweetsReceived = 0;
statsObj.quotedTweetsReceived = 0;
statsObj.tweetsDuplicates = 0;
statsObj.tweetsPerSecond = 0.0;
statsObj.tweetsPerMinute = 0.0;
statsObj.maxTweetsPerMinute = 0;
statsObj.maxTweetsPerMinuteTime = moment().valueOf();
statsObj.twitterDeletes = 0;
statsObj.twitterConnects = 0;
statsObj.twitterDisconnects = 0;
statsObj.twitterReconnects = 0;
statsObj.twitterWarnings = 0;
statsObj.twitterErrors = 0;
statsObj.twitterLimit = 0;
statsObj.twitterScrubGeo = 0;
statsObj.twitterStatusWithheld = 0;
statsObj.twitterUserWithheld = 0;
statsObj.twitterLimit = 0;
statsObj.twitterLimitMax = 0;
statsObj.twitterLimitMaxTime = moment().valueOf();

global.dbConnection = false;
const mongoose = require("mongoose");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");

let User = mongoose.model("User", userModel.UserSchema);

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
          console.log(chalkError("TSS | *** MONGO DB CONNECTION ERROR: " + err));
          statsObj.status = "MONGO CONNECTION ERROR";
          dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("close", function(){
          statsObj.status = "MONGO CLOSED";
          console.error.bind(console, "TSS | *** MONGO DB CONNECTION CLOSED ***\n");
          console.log(chalkAlert("TSS | *** MONGO DB CONNECTION CLOSED ***\n"));
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("error", function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "TSS | *** MONGO DB CONNECTION ERROR ***\n");
          console.log(chalkError("TSS | *** MONGO DB CONNECTION ERROR ***\n"));
          db.close();
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "TSS | *** MONGO DB DISCONNECTED ***\n");
          console.log(chalkAlert("TSS | *** MONGO DB DISCONNECTED ***\n"));
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        dbConnectionReady = true;
        statsObj.dbConnectionReady = true;

        global.dbConnection = db;

        console.log(chalk.green("TSS | MONGOOSE DEFAULT CONNECTION OPEN"));

        // // UserServerController = require("../userServerController/index.js");
        UserServerController = require("@threeceelabs/user-server-controller");
        userServerController = new UserServerController("TSS_USC");

        userServerControllerReady = false;

        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";

          userServerControllerReady = true;

          console.log(chalkAlert("TSS | USC READY | " + appname));
          // dbConnectionReady = true;

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
const DROPBOX_TSS_STATS_FILE = process.env.DROPBOX_TSS_STATS_FILE || "twitterSearchStreamStats.json";

const dropboxConfigFolder = "/config/utility";
const dropboxConfigHostFolder = "/config/utility/" + hostname;

const dropboxConfigFile = hostname + "_" + DROPBOX_TSS_CONFIG_FILE;
const statsFolder = "/stats/" + hostname + "/searchStream";
const statsFile = DROPBOX_TSS_STATS_FILE;

console.log("TSS | DROPBOX_TSS_CONFIG_FILE: " + DROPBOX_TSS_CONFIG_FILE);
console.log("TSS | DROPBOX_TSS_STATS_FILE : " + DROPBOX_TSS_STATS_FILE);

debug("TSS | dropboxConfigFolder : " + dropboxConfigFolder);
debug("TSS | dropboxConfigFile : " + dropboxConfigFile);

debug("TSS | statsFolder : " + statsFolder);
debug("TSS | statsFile : " + statsFile);

// const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });
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

  statsObj.tweetsPerSecond = 0;
  statsObj.tweetsPerMinute = 0;

  threeceeUserHashMap.forEach(function(threeceeUserObj, screenName){
    if (threeceeUserObj) {
      statsObj.tweetsPerSecond += threeceeUserObj.stats.tweetsPerSecond;
      statsObj.tweetsPerMinute += threeceeUserObj.stats.tweetsPerMinute;
    }
  });

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

    threeceeUserHashMap.forEach(function(threeceeUserObj, screenName){
      if ((screenName === undefined) || !screenName) {
        console.log(chalkError("TSS | TWITTER 3C USER HASHMAP SCREEN_NAME UNDEFINED?"));
        threeceeUserHashMap.delete(null);
      }
      else {
        console.log("TSS | @" + screenName
          // + " | FOLLOWING USERS: " + threeceeUserObj.followUserSet.size
          // + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermArray.length
          + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
          // + "\n" + jsonPrint(threeceeUserObj.stats)
        );
      }
    });

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
      + " \nTSS | TWITTER LIMIT: " + statsObj.twitterLimit
      + " | " + statsObj.twitterLimitMax + " MAX"
      + " " + moment(parseInt(statsObj.twitterLimitMaxTime)).format(compactDateTimeFormat)
    ));

    threeceeUserHashMap.forEach(function(threeceeUserObj, screenName){
      console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
        // + " | FOLLOWING USERS: " + threeceeUserObj.followUserSet.size
        // + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermArray.length
        + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
        // + "\n" + jsonPrint(threeceeUserObj.stats)
      ));
    });
  }
}

function twitterStopAll(callback){

  const twUsersArray = threeceeUserHashMap.keys();

  async.each(twUsersArray, function(screenName, cb){

    threeceeUserHashMap.get(screenName).searchStream.stop();
    console.log(chalkAlert("TSS | STOP TWITTER STREAM | @" + screenName));
    cb();

  }, function(err){

    if (err) { console.log(chalkError("TSS | ERROR\n" + jsonPrint(err) )); }
    console.log(chalkAlert("TSS | STOPPED ALL TWITTER STREAMS"));
    callback();

  });
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
        "\nTSS | ==========================\n"
        + "TSS | MONGO DB CONNECTION CLOSED"
        + "\nTSS | ==========================\n"
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

  console.log(chalkInfo("TSS | LOAD FOLDER " + path));
  console.log(chalkInfo("TSS | LOAD FILE " + file));
  console.log(chalkInfo("TSS | FULL PATH " + path + "/" + file));

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

  setInterval(function () {

    statsObj.elapsed = moment().valueOf() - statsObj.startTime;
    statsObj.timeStamp = moment().format(defaultDateTimeFormat);

    saveFile(statsFolder, statsFile, statsObj, function(){
      showStats();
    });

    checkTwitterRateLimitAll();

  }, cnf.statsUpdateIntervalTime);


  callback(null, cnf);
}

function printUserObj(title, user) {

  user = userDefaults(user);

  console.log(chalkLog(title
    + " | " + user.userId
    + " | @" + user.screenName
    + " | N: " + user.name 
    + " | LOC: " + user.location 
    + " | FLWRs: " + user.followersCount
    + " | FRNDs: " + user.friendsCount
    + " | Ts: " + user.statusesCount
    + " | Ms:  " + user.mentions
    + " | LS: " + getTimeStamp(user.lastSeen)
    + " | FLWg: " + user.following 
    + " | 3C: @" + user.threeceeFollowing 
    + " | CAT M: " + user.category + " - A: " + user.categoryAuto
  ));
}

const userDefaults = function (user){
  return user;
};


function initTwit(params, callback){

  console.log(chalkLog("TSS | INIT TWIT USER @" + params.config.screenName));

  console.log(chalkInfo("TSS | INIT TWIT | TWITTER CONFIG " 
    + "\n" + jsonPrint(params.config)
  ));

  let threeceeUserObj = {};

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

  threeceeUserObj.rateMeter = Measured.createCollection();
  threeceeUserObj.rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
  threeceeUserObj.rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

  threeceeUserObj.trackingNumber = 0;

  threeceeUserObj.screenName = params.config.screenName ;
  threeceeUserObj.twitterConfig = {} ;
  threeceeUserObj.twitterConfig = params.config ;

  // const newTwitStream = new Twit({
  //   consumer_key: params.config.CONSUMER_KEY,
  //   consumer_secret: params.config.CONSUMER_SECRET,
  //   app_only_auth: true
  // });

  const newTwitStream = new Twit({
    consumer_key: params.config.CONSUMER_KEY,
    consumer_secret: params.config.CONSUMER_SECRET,
    access_token: params.config.TOKEN,
    access_token_secret: params.config.TOKEN_SECRET
  });

  // threeceeUserObj.twit = {};
  // threeceeUserObj.twit = newTwit;

  threeceeUserObj.twitStream = {};
  threeceeUserObj.twitStream = newTwitStream;

  threeceeUserObj.searchStream = {};
  // threeceeUserObj.searchTermArray = [];
  threeceeUserObj.searchTermSet = new Set();
  // threeceeUserObj.followUserSet = new Set();
  // threeceeUserObj.doNotFollowUserSet = new Set();

  console.log(chalkTwitter("TSS | INIT TWITTER USER"
    + " | NAME: " + params.config.screenName
  ));

  threeceeUserHashMap.set(params.config.screenName, threeceeUserObj);

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

      threeceeUserObj.stats.error = err;
      threeceeUserObj.stats.twitterErrors += 1;
      threeceeUserObj.stats.authenticated = false;

      threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

      return callback(err, threeceeUserObj);
    }

    threeceeUserObj.stats.error = false;
    threeceeUserObj.stats.authenticated = true;
    threeceeUserObj.stats.twitterTokenErrorFlag = false;

    threeceeUserObj.followUserSet = new Set(data.ids);

    threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

    console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
      + " | @" + threeceeUserObj.screenName
      + " | FOLLOW USER SET SIZE: " + threeceeUserObj.followUserSet.size + " FRIENDS"
      + " | DATA IDS: " + data.ids.length + " FRIENDS"
      + " | PREV CURSOR: " + data.previous_cursor_str
      + " | NEXT CURSOR: " + data.next_cursor_str
      + " | data keys: " + Object.keys(data)
    ));

    let userIndex = 0;
    let printString = "";

    async.eachSeries([...threeceeUserObj.followUserSet], function(userId, cb){

      userIndex += 1;

      if (configuration.testMode && (userIndex > 100)){
        return cb();
      }

      if (followingUserIdHashMap.has(userId)){

        const threeceeFollowingInHashMap = followingUserIdHashMap.get(userId);

        if (threeceeFollowingInHashMap !== threeceeUserObj.screenName) {

          console.log(chalkLog("TSS | !!! TWITTER USER FOLLOW MISMATCH"
            + " | UID: " + userId
            + " | IN HM: 3C @" + threeceeFollowingInHashMap
            + " | CUR 3C @: " + threeceeUserObj.screenName
          ));

          const user = new User({userId: userId});

          if (threeceeFollowingInHashMap < threeceeUserObj.screenName) {

            // threeceeUserObj.searchTermSet.delete("@" + user.screenName.toLowerCase());

            unfollowQueue.push({threeceeUser: threeceeUserObj.screenName, user: user});

            console.log(chalkLog("TSS | > UNFOLLOW Q | ALREADY FOLLOWING"
              + " [" + unfollowQueue.length + "]"
              + " | UID: " + user.userId
              + " | 3C IN HM @: " + threeceeFollowingInHashMap
              + " | 3C CUR @: " + threeceeUserObj.screenName
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

            threeceeUserObj.searchTermSet.add("@" + user.screenName.toLowerCase());

            if (configuration.verbose || (userIndex % 100 === 0)) {
              printString = "TSS | [ " + userIndex + "/" + threeceeUserObj.followUserSet.size + " ] @" + threeceeUserObj.screenName + " | DB HIT";
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

      threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

      process.send({
        op: "TWITTER_STATS", 
        threeceeUser: threeceeUserObj.screenName, 
        stats: threeceeUserObj.stats, 
        twitterFollowing: threeceeUserObj.followUserSet.size
      });

      callback(null, threeceeUserObj);
    });
  });
}

function threeceeUserUnfollowReady(threeceeUser){
  if (!threeceeUserHashMap.has(threeceeUser)) { 
    console.log("3C @" + threeceeUser + " | NOT READY | NOT IN HM");
    return false; 
  }

  const threeceeUserObj = threeceeUserHashMap.get(threeceeUser);

  if (!threeceeUserObj.stats.ready) { 
    console.log("3C @" + threeceeUser + " | NOT READY | NOT IN HM");
    return false; 
  }
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
  // if (threeceeUserObj.twit === undefined) { 
  //   console.log("3C @" + threeceeUser + " | NOT READY | TWIT UNDEFINED");
  //   return false; 
  // }
  return true;
}

// function initInfoTwit(params, callback){

//   console.log(chalkTwitter("TSS | INIT INFO USER @" + params.screenName));

//   const twitterConfigFile = params.screenName + ".json";

//   loadFile(configuration.twitterConfigFolder, twitterConfigFile, function(err, twitterConfig){

//     if (err){
//       console.error(chalkError("TSS | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
//       return callback(err, null);
//     }

//     if (!twitterConfig){
//       console.error(chalkError("TSS | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
//         + " | " + configuration.twitterConfigFolder + "/" + twitterConfigFile
//       ));
//       return callback("TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?", null);
//     }

//     console.log(chalkTwitter("TSS | INFO TWITTER USER CONFIG\n" + jsonPrint(twitterConfig)));

//     let threeceeUserObj = {};

//     threeceeUserObj.stats = {};
//     threeceeUserObj.stats.ready = false;
//     threeceeUserObj.stats.error = false;
//     threeceeUserObj.stats.connected = false;
//     threeceeUserObj.stats.authenticated = false;
//     threeceeUserObj.stats.twitterTokenErrorFlag = false;
//     threeceeUserObj.stats.twitterConnects = 0;
//     threeceeUserObj.stats.twitterReconnects = 0;
//     threeceeUserObj.stats.twitterFollowLimit = false;
//     threeceeUserObj.stats.twitterLimit = 0;
//     threeceeUserObj.stats.twitterErrors = 0;
//     threeceeUserObj.stats.rateLimited = false;

//     threeceeUserObj.stats.twitterRateLimit = 0;
//     threeceeUserObj.stats.twitterRateLimitRemaining = 0;
//     threeceeUserObj.stats.twitterRateLimitResetAt = 0;
//     threeceeUserObj.stats.twitterRateLimitRemainingTime = 0;
//     threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;


//     threeceeUserObj.screenName = twitterConfig.screenName ;
//     threeceeUserObj.twitterConfig = {} ;
//     threeceeUserObj.twitterConfig = twitterConfig ;

//     // const newTwit = new Twit({
//     //   consumer_key: twitterConfig.CONSUMER_KEY,
//     //   consumer_secret: twitterConfig.CONSUMER_SECRET,
//     //   // access_token: twitterConfig.TOKEN,
//     //   // access_token_secret: twitterConfig.TOKEN_SECRET,
//     //   app_only_auth: true
//     // });

//     // threeceeUserObj.twit = {};
//     // threeceeUserObj.twit = newTwit;

//     const newTwitStream = new Twit({
//       consumer_key: twitterConfig.CONSUMER_KEY,
//       consumer_secret: twitterConfig.CONSUMER_SECRET,
//       app_only_auth: true
//     });

//     // const newTwit = new Twit({
//     //   consumer_key: twitterConfig.CONSUMER_KEY,
//     //   consumer_secret: twitterConfig.CONSUMER_SECRET,
//     //   access_token: twitterConfig.TOKEN,
//     //   access_token_secret: twitterConfig.TOKEN_SECRET
//     // });

//     // threeceeUserObj.twit = {};
//     // threeceeUserObj.twit = newTwit;

//     threeceeUserObj.twitStream = {};
//     threeceeUserObj.twitStream = newTwitStream;

//     console.log(chalkTwitter("TSS | INIT INFO TWITTER USER"
//       + " | NAME: " + twitterConfig.screenName
//     ));

//     checkTwitterRateLimit({threeceeUserObj: threeceeUserObj}, function(err, tuObj){
//       if (callback !== undefined) { callback(err, tuObj); }
//     });

//   });

// }

function initTwitterUsers(cnf, callback){

  if (!configuration.twitterUsers){
    console.log(chalkWarn("TSS | ??? NO TWITTER USERS"));
    callback("NO TWITTER USERS", null);
  }
  else {

    console.log(chalkInfo("TSS | TWITTER USERS FOUND: " + jsonPrint(cnf.twitterUsers)));

    async.eachSeries(cnf.twitterUsers, function(screenName, cb) {

      screenName = screenName.toLowerCase();

      console.log(chalkTwitter("TSS | TWITTER USER: @" + screenName));

      const twitterConfigFile = screenName + ".json";

      loadFile(cnf.twitterConfigFolder, twitterConfigFile, function(err, twitterConfig){

        if (err){
          console.error(chalkError("TSS | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
          return(cb());
        }

        if (!twitterConfig){
          console.error(chalkError("TSS | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
            + " | " + cnf.twitterConfigFolder + "/" + twitterConfigFile
          ));
          return(cb());
        }

        initTwit({config: twitterConfig}, function(err, threeceeUserObj){

          if (err){
            console.log(chalkError("TSS | *** TWIT INIT ERROR"
              + " | @" + threeceeUserObj.screenName
              + " | " + getTimeStamp()
              + " | " + err
            ));
          }

          cb();
        });

      });

      }, function(err){
        callback(err, cnf);
    });
  }
}

function getFileMetadata(path, file, callback) {

  const fullPath = path + "/" + file;
  debug(chalkInfo("TSS | FOLDER " + path));
  debug(chalkInfo("TSS | FILE " + file));
  console.log(chalkInfo("TSS | getFileMetadata FULL PATH: " + fullPath));

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
// let deltaTweetStart = process.hrtime();
// let deltaTweet = process.hrtime(deltaTweetStart);

let prevFileModifiedMoment = moment("2010-01-01");

function checkTwitterRateLimit(params, callback){

  let threeceeUserObj = params.threeceeUserObj;

  // if ((threeceeUserObj === undefined) || (threeceeUserObj.twit === undefined)) {
  if ((threeceeUserObj === undefined) || (threeceeUserObj.twitStream === undefined)) {
    return callback(new Error("INVALID PARAMS", params));
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

      callback(err, threeceeUserObj);
    }
    else {

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

        callback(null, threeceeUserObj);

      }
      else {

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

        callback(null, threeceeUserObj);

      }

    }
  });
}

function checkTwitterRateLimitAll(callback){
  threeceeUserHashMap.forEach(function(threeceeUserObj, threeceeUser){
    checkTwitterRateLimit({threeceeUserObj: threeceeUserObj}, function(err, tuObj){
      if (!err && (tuObj !== undefined)) { threeceeUserHashMap.set(tuObj.screenName, tuObj); }
    });
  });
}

// let unfollowQueueReady = true;
// let unfollowQueueInterval;

// function initUnfollowQueueInterval(cnf, callback){

//   let unfollowObj = {};

//   console.log(chalkTwitter("TSS | INIT THREECEE USER UNFOLLOW QUEUE INTERVAL: " + cnf.unfollowQueueInterval));

//   clearInterval(unfollowQueueInterval);

//   unfollowQueueInterval = setInterval(function () {

//     if (unfollowQueueReady && (unfollowQueue.length > 0)) {

//       unfollowQueueReady = false;

//       unfollowObj = unfollowQueue.shift();

//       if ((unfollowObj.threeceeUser === undefined) || (unfollowObj.threeceeUser === "ALL")) {

//         console.log(chalkLog("TSS | < UNFOLLOW QUEUE"
//           + " [" + unfollowQueue.length + "]"
//           + " | 3C ALL UNFOLLOW"
//           + " | UID: " + unfollowObj.user.userId
//         ));

//         unfollow({user: unfollowObj.user, threeceeUser: "ALL"}, function(err, success){
//           unfollowQueueReady = true;
//         });

//       }
//       else if (!threeceeUserUnfollowReady(unfollowObj.threeceeUser)) {

//         unfollowQueue.push(unfollowObj);

//         console.log(chalkLog("TSS | < UNFOLLOW QUEUE"
//           + " [" + unfollowQueue.length + "]"
//           + " | 3C @" + unfollowObj.threeceeUser
//           + " | UID: " + unfollowObj.user.userId
//           + " | NOT READY ... SKIPPING"
//         ));

//         unfollowQueueReady = true;

//       }
//       else {

//         console.log(chalkTwitter("TSS | < UNFOLLOW QUEUE"
//           + " [" + unfollowQueue.length + "]"
//           + " | 3C @" + unfollowObj.threeceeUser
//           + " | UID: " + unfollowObj.user.userId
//         ));

//         unfollow({user: unfollowObj.user, threeceeUser: unfollowObj.threeceeUser}, function(err, success){
//           unfollowQueueReady = true;
//         });

//       }

//     }

//   }, cnf.unfollowQueueInterval);

//   if (callback) { callback(); }
// }

// let ignoreQueueReady = true;
// let ignoreQueueInterval;

// function initIgnoreQueueInterval(cnf, callback){

//   let ignoreObj = {};

//   console.log(chalkTwitter("TSS | INIT THREECEE USER IGNORE QUEUE INTERVAL: " + cnf.ignoreQueueInterval));

//   clearInterval(ignoreQueueInterval);

//   ignoreQueueInterval = setInterval(function () {

//     if (ignoreQueueReady && (ignoreQueue.length > 0)) {

//       ignoreQueueReady = false;

//       ignoreObj = ignoreQueue.shift();

//       if ((ignoreObj.threeceeUser === undefined) || (ignoreObj.threeceeUser === "ALL")) {

//         console.log(chalkLog("TSS | < IGNORE QUEUE"
//           + " [" + ignoreQueue.length + "]"
//           + " | 3C ALL IGNORE"
//           + " | UID: " + ignoreObj.user.userId
//         ));

//         ignore({user: ignoreObj.user, threeceeUser: "ALL"}, function(err, success){
//           ignoreQueueReady = true;
//         });

//       }
//       else if (!threeceeUserIgnoreReady(ignoreObj.threeceeUser)) {

//         console.log(chalkLog("TSS | < IGNORE QUEUE"
//           + " [" + ignoreQueue.length + "]"
//           + " | 3C @" + ignoreObj.threeceeUser
//           + " | UID: " + ignoreObj.user.userId
//           + " | NOT READY ... SKIPPING"
//         ));

//         ignoreQueue.push(ignoreObj);

//         ignoreQueueReady = true;

//       }
//       else {

//         console.log(chalkTwitter("TSS | < IGNORE QUEUE"
//           + " [" + ignoreQueue.length + "]"
//           + " | 3C @" + ignoreObj.threeceeUser
//           + " | UID: " + ignoreObj.user.userId
//         ));

//         ignore({user: ignoreObj.user, threeceeUser: ignoreObj.threeceeUser}, function(err, success){
//           ignoreQueueReady = true;
//         });

//       }

//     }

//   }, cnf.ignoreQueueInterval);

//   if (callback) { callback(); }
// }

// let userShowQueueReady = true;
// let userShowQueueInterval;

// function initUserShowQueueInterval(cnf, callback){

//   let user = {};

//   console.log(chalkTwitter("TSS | INIT TWITTER USER SHOW QUEUE INTERVAL: " + cnf.userShowQueueInterval));

//   clearInterval(userShowQueueInterval);

//   userShowQueueInterval = setInterval(function () {

//     if (userShowQueueReady && (userShowQueue.length > 0)) {

//       userShowQueueReady = false;

//       user = userShowQueue.shift();

//       follow({user: user, forceFollow: false}, function(err, success){
//         userShowQueueReady = true;
//       });

//     }

//   }, cnf.userShowQueueInterval);

//   if (callback) { callback(); }
// }

function initSearchStream(params, callback){

  let threeceeUserObj = params.threeceeUserObj;

  let filter = {};
  filter.track = [];
  filter.follow = [];

  // if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
  if (threeceeUserObj.searchTermSet.size > 0) { filter.track = [...threeceeUserObj.searchTermSet]; }
  // if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

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
      statsObj.twitterConnects += 1;
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

      statsObj.twitterReconnects+= 1;

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
      statsObj.twitterDisconnects+= 1;
      threeceeUserObj.stats.connected = false;
      threeceeUserObj.stats.twitterReconnects = 0;
      threeceeUserObj.stats.rateLimited = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = false;
      showStats();
    });

    threeceeUserObj.searchStream.on("warning", function(data){
      console.log(chalkAlert("TSS | " + getTimeStamp() + " | !!! TWITTER WARNING: " + jsonPrint(data)));
      statsObj.twitterWarnings+= 1;
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
      console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER SCRUB GEO: " + jsonPrint(data)));
      statsObj.twitterScrubGeo+= 1;
      showStats();
    });

    threeceeUserObj.searchStream.on("status_withheld", function(data){
      console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER STATUS WITHHELD: " + jsonPrint(data)));
      statsObj.twitterStatusWithheld+= 1;
      showStats();
    });

    threeceeUserObj.searchStream.on("user_withheld", function(data){
      console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER USER WITHHELD: " + jsonPrint(data)));
      statsObj.twitterUserWithheld+= 1;
      showStats();
    });

    threeceeUserObj.searchStream.on("limit", function(limitMessage){

      statsObj.twitterLimit += limitMessage.limit.track;
      threeceeUserObj.stats.twitterLimit += limitMessage.limit.track;

      if (statsObj.twitterLimit > statsObj.twitterLimitMax) {
        statsObj.twitterLimitMax = statsObj.twitterLimit;
        statsObj.twitterLimitMaxTime = moment().valueOf();
      }

      debug(chalkTwitter("TSS | " + getTimeStamp()
        + " | TWITTER LIMIT" 
        + " | @" + threeceeUserObj.screenName
        + " | USER LIMIT: " + statsObj.twitterLimit
        + " | TOTAL LIMIT: " + threeceeUserObj.stats.twitterLimit
      ));
    });

    threeceeUserObj.searchStream.on("error", function(err){

      // threeceeUserObj.searchStream.stop();

      console.log(chalkError("TSS | " + getTimeStamp()
        + " | @" + threeceeUserObj.screenName
        + " | *** TWITTER ERROR: " + err
        + " | *** TWITTER ERROR\n" + jsonPrint(err)
      ));


      statsObj.twitterErrors += 1;
      threeceeUserObj.stats.twitterErrors += 1;

      threeceeUserObj.stats.ready = false;
      threeceeUserObj.stats.error = err;
      threeceeUserObj.stats.connected = false;
      threeceeUserObj.stats.authenticated = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = true;

      twitterUsersHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

      const errorType = (err.statusCode === 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

      process.send({
        op: "ERROR", 
        threeceeUser: threeceeUserObj.screenName, 
        stats: threeceeUserObj.stats, 
        errorType: errorType, 
        error: err
      });

      // showStats();
    });
    
    threeceeUserObj.searchStream.on("end", function(err){

      threeceeUserObj.searchStream.stop();

      console.log(chalkError("TSS | " + getTimeStamp()
        + " | @" + threeceeUserObj.screenName
        + " | *** TWITTER END: " + err
      ));


      statsObj.twitterErrors += 1;
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

      // showStats();
    });
    
    threeceeUserObj.searchStream.on("parser-error", function(err){

      console.log(chalkError("TSS | " + getTimeStamp()
        + " | @" + threeceeUserObj.screenName
        + " | *** TWITTER PARSER ERROR: " + err
      ));

      statsObj.twitterErrors += 1;
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
    
    threeceeUserObj.searchStream.on("tweet", function(tweetStatus){

      tweetStatus.entities.media = [];
      tweetStatus.entities.polls = [];
      tweetStatus.entities.symbols = [];
      tweetStatus.entities.urls = [];

      // deltaTweet = process.hrtime(deltaTweetStart);
      // if (deltaTweet[0] > 0) { 
      //   console.log(chalkAlert("TSS | *** TWEET RX DELTA"
      //     + " | @" + threeceeUserObj.screenName
      //     + " | " + deltaTweet[0] + "." + deltaTweet[1]
      //   ));
      // }
      // deltaTweetStart = process.hrtime();

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

      if ((threeceeUserObj.stats.tweetsReceived % 500 === 0) || (statsObj.tweetsReceived % 500 === 0)) {
        console.log(chalkTwitter("TSS | <T | " + getTimeStamp()
          + " | TWQ: " + tweetQueue.length
          + " [ TOTAL Ts/RTs/QTs: " + statsObj.tweetsReceived + "/" + statsObj.retweetsReceived + "/" + statsObj.quotedTweetsReceived + "]"
          + " | 3C @" + threeceeUserObj.screenName
          + " [ Ts/RTs/QTs: " + threeceeUserObj.stats.tweetsReceived + "/" + threeceeUserObj.stats.retweetsReceived + "/" + threeceeUserObj.stats.quotedTweetsReceived + "]"
          + " | " + statsObj.tweetsPerMinute.toFixed(3) + " TPM"
          + " | " + tweetStatus.id_str
          + " | TWEET LANG: " + tweetStatus.lang
          + " | @" + tweetStatus.user.screen_name
          + " | " + tweetStatus.user.name
          + " | USER LANG: " + tweetStatus.user.lang
          + " | LOC " + tweetStatus.user.location
          + " | " + tweetStatus.user.id_str
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

    statsObj.twitterErrors += 1;
    threeceeUserObj.stats.twitterErrors += 1;

    threeceeUserObj.stats.ready = false;
    threeceeUserObj.stats.error = err;
    threeceeUserObj.stats.connected = false;
    threeceeUserObj.stats.authenticated = false;
    threeceeUserObj.stats.twitterTokenErrorFlag = true;

    twitterUsersHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

    const errorType = (err.statusCode === 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

    process.send({
      op: "ERROR", 
      threeceeUser: threeceeUserObj.screenName, 
      stats: threeceeUserObj.stats, 
      errorType: errorType, 
      error: err
    });
  }

  callback(null, threeceeUserObj);
}

function initSearchTerms(cnf, callback){

  getFileMetadata(cnf.searchTermsDir, cnf.searchTermsFile, function(err, response){

    if (err) {
      return(callback(err, null));
    }

    const fileModifiedMoment = moment(new Date(response.client_modified));
  
    if (fileModifiedMoment.isSameOrBefore(prevFileModifiedMoment)){
      console.log(chalkInfo("TSS | SEARCH TERMS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));
      configEvents.emit("SEARCH_TERM_CONFIG_COMPLETE");
      callback(null, 0);
    }
    else {
      console.log(chalkInfo("SEARCH TERMS FILE AFTER"));

      prevFileModifiedMoment = moment(fileModifiedMoment);

      loadFile(cnf.searchTermsDir, cnf.searchTermsFile, function(err, data){

        if (err){
          console.log(chalkError("TSS | LOAD FILE ERROR\n" + err));
          return(callback(err, null));
        }

        if (data  === undefined){
          console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
            + " | " + cnf.searchTermsFile
          ));
          return(callback("DROPBOX FILE DOWNLOAD DATA UNDEFINED", null));
        }

        debug(chalkInfo("TSS | DROPBOX SEARCH TERMS FILE\n" + jsonPrint(data)));

        const dataConvertAccent = data.toString().replace(/Ã©/g, "e");
        const dataConvertTilde = dataConvertAccent.toString().replace(/Ã£/g, "a");
        const dataArray = dataConvertTilde.toString().split("\n");

        console.log(chalk.blue("TSS | TRACKING " + dataArray.length + " SEARCH TERMS "));

        const twUsersArray = threeceeUserHashMap.keys();

        async.eachSeries(twUsersArray, function(screenName, cb){

          let threeceeUserObj = threeceeUserHashMap.get(screenName);

          async.whilst( 
            // function(){ 
            //   return ((threeceeUserObj.searchTermArray.length < TWITTER_MAX_TRACKING_NUMBER)
            //     && (dataArray.length > 0));
            // },
            function(){ 
              return ((threeceeUserObj.searchTermSet.size < TWITTER_MAX_TRACKING_NUMBER)
                && (dataArray.length > 0));
            },
            function(cb0){

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

                // threeceeUserObj.searchTermArray.push(searchTerm);
                threeceeUserObj.searchTermSet.add(searchTerm);
                searchTermHashMap.set(searchTerm, screenName);

                console.log(chalkInfo("TSS | +++ TRACK"
                  + " | @" + screenName
                  // + " | TRACKING: " + threeceeUserObj.searchTermArray.length 
                  + " | TRACKING: " + threeceeUserObj.searchTermSet.size 
                  + "/" + TWITTER_MAX_TRACKING_NUMBER + " MAX"
                  + " | SEARCH TERM: " + searchTerm
                ));

                cb0();

              }
              else {
                console.log(chalkInfo("TSS | --- SKIP TRACK"
                  + " | @" + screenName
                  + " | IN HM: " + searchTermHashMap.has(searchTerm)
                  + " | SEARCH TERM: " + searchTerm
                ));
                cb0();
              }
            },
            function(err0){

              if (err0) {
                console.log(chalkError("TSS | *** twitterTrack ERROR"
                  + " | @" + screenName 
                  + " | ERROR: " + err0
                ));
                return(cb(err0));
              }

              initSearchStream({threeceeUserObj: threeceeUserObj}, function(err, tuObj){

                console.log(chalkInfo("TSS | END TRACK USER"
                  + " | @" + tuObj.screenName
                ));

                threeceeUserHashMap.set(tuObj.screenName, tuObj);

                cb();

              });

            }
          );
        },
        function(err){
          if (err) {
            console.log(chalkError("TSS | *** twitterTrack ERROR"
              + " | ERROR: " + err
            ));
            return(callback(err, 1));
          }

          console.log(chalkInfo("TSS | END TRACK USERS"
          ));
          return(callback(null, 0));
        });

      });
    }
  });
}

function initialize(cnf, callback){

  console.log(chalkLog("INITIALIZE cnf\n" + jsonPrint(cnf)));

  if (debug.enabled || debugCache.enabled || debugQ.enabled){
    console.log("\nTSS | %%%%%%%%%%%%%%\nTSS | DEBUG ENABLED \nTSS | %%%%%%%%%%%%%%\n");
  }

  cnf.processName = process.env.TSS_PROCESS_NAME || "wa_node_tss";

  cnf.verbose = process.env.TSS_VERBOSE_MODE || false ;
  cnf.globalTestMode = process.env.TSS_GLOBAL_TEST_MODE || false ;
  cnf.testMode = process.env.TSS_TEST_MODE || false ;
  cnf.quitOnError = process.env.TSS_QUIT_ON_ERROR || false ;

  cnf.twitterQueueIntervalTime = process.env.TSS_TWITTER_QUEUE_INTERVAL || DEFAULT_TWITTER_QUEUE_INTERVAL ;
  cnf.maxTweetQueue = process.env.TSS_MAX_TWEET_QUEUE || DEFAULT_MAX_TWEET_QUEUE ;
  cnf.twitterUsers = [ "altthreecee00", "altthreecee01", "altthreecee02", "altthreecee03", "altthreecee04", "altthreecee05" ];

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
      console.log(dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

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

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE  !== undefined){
        console.log("TSS | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE));
        cnf.twitterConfigFile = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE;
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

      if (loadedConfigObj.TSS_TWITTER_USERS  !== undefined){
        console.log("TSS | LOADED TSS_TWITTER_USERS: " + jsonPrint(loadedConfigObj.TSS_TWITTER_USERS));
        cnf.twitterUsers = loadedConfigObj.TSS_TWITTER_USERS;
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

      configArgs.forEach(function(arg){
        console.log("TSS | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });

      initStatsUpdate(cnf, function(err, cnf2){

        if (err) {
          console.log(chalkError("TSS | ***  initStatsUpdate ERROR\n" + err));
        }

        loadFile(cnf.twitterConfigFolder, cnf.twitterConfigFile, function(err, tc){
          if (err){
            console.error(chalkError("TSS | *** TWITTER CONFIG LOAD ERROR\n" + err));
            quit();
            return;
          }

          cnf2.twitterConfig = {};
          cnf2.twitterConfig = tc;

          console.log(chalkInfo("TSS | " + getTimeStamp() + " | TWITTER CONFIG FILE " 
            + cnf2.twitterConfigFolder
            + cnf2.twitterConfigFile
            + "\n" + jsonPrint(cnf2.twitterConfig )
          ));
          return(callback(null, cnf2));
        });
      });
    }
    else {
      console.error("TSS | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));

      if (err.status === 404){

        configArgs = Object.keys(cnf);

        configArgs.forEach(function(arg){
          console.log("TSS | FINAL CONFIG | " + arg + ": " + cnf[arg]);
        });

        initStatsUpdate(cnf, function(err, cnf2){

          if (err) {
            console.log(chalkError("TSS | ERROR initStatsUpdate\n" + jsonPrint(err)));
          }

          loadFile(cnf.twitterConfigFolder, cnf.twitterConfigFile, function(err, tc){
            if (err){
              console.error(chalkError("TSS | *** TWITTER CONFIG LOAD ERROR\n" + err));
              quit();
              return;
            }

            cnf2.twitterConfig = {};
            cnf2.twitterConfig = tc;

            console.log(chalkInfo("TSS | " + getTimeStamp() + " | TWITTER CONFIG FILE " 
              + cnf2.twitterConfigFolder
              + cnf2.twitterConfigFile
              + "\n" + jsonPrint(cnf2.twitterConfig )
            ));
            return(callback(null, cnf2));
          });
        });
      }
      return(callback(err, cnf));
     }
  });
}

// let deltaTxTweetStart = process.hrtime();
// let deltaTxTweet = process.hrtime(deltaTxTweetStart);

let tweetSendReady = true;
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

      // deltaTxTweet = process.hrtime(deltaTxTweetStart);
      // if (deltaTxTweet[0] > 0) { 
      //   console.log(chalkAlert("TSS | *** TWEET TX DELTA: " + deltaTxTweet[0] + "." + deltaTxTweet[1]));
      // }
      // deltaTxTweetStart = process.hrtime();

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

        statsObj.tweetsDuplicates += 1 ;

        const dupPercent = 100 * statsObj.tweetsDuplicates / statsObj.tweetsReceived;

        debug(chalkAlert("TSS | DUP [ Q: " + tweetQueue.length + "]"
          + " [ " + statsObj.tweetsDuplicates + "/" + statsObj.tweetsReceived
          + " | " + dupPercent.toFixed(1) + "% ]"
          + " | " + tweetStatus.id_str
        ));
      }


    }
  }, cnf.twitterQueueIntervalTime);

  if (callback) { callback(); }
}

function initTwitterSearch(cnf){

  twitterSearchInit = true;

  console.log(chalkTwitter("TSS | INIT TWITTER SEARCH"));

  initTwitterQueue(cnf);

  console.log(chalkTwitter("TSS | " + getTimeStamp() 
    + " | ENABLE TWEET STREAM"
    + " | " + searchTermHashMap.keys().length + " SEARCH TERMS"
  ));
}

// function follow(params, callback) {

//   const twUsersArray = threeceeUserHashMap.keys();

//   async.eachSeries(twUsersArray, function(screenName, cb){

//     let threeceeUserObj = threeceeUserHashMap.get(screenName);

//     console.log(chalkLog("TSS | CHECK FOLLOW | 3C @" + threeceeUserObj.screenName + " | @" + params.user.screenName));

//     if (threeceeUserObj.doNotFollowUserSet.has(params.user.userId)){

//       console.log(chalkLog("TSS | ... SKIP FOLLOW | FOLLOW USER BLOCK"
//         + " | @" + params.user.screenName
//         + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//         + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//         + " | UID: " + params.user.userId
//         + " | BLOCK SET SIZE: " + threeceeUserObj.doNotFollowUserSet.size
//         + " | IN FOLLOW USER BLOCK SET: " + threeceeUserObj.doNotFollowUserSet.has(params.user.userId)
//       ));

//       return cb();

//     }

//     if (threeceeUserObj.followUserSet.has(params.user.userId)){

//       console.log(chalkLog("TSS | ... SKIP FOLLOW | ALREADY FOLLOWING"
//         + " | 3C @" + threeceeUserObj.screenName
//         + " | @" + params.user.screenName
//         + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//         + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//         + " | UID: " + params.user.userId
//         + " | IN FOLLOW USER SET: " + threeceeUserObj.followUserSet.has(params.user.userId)
//       ));

//       return cb(true);

//     }

//     if (threeceeUserObj.stats.twitterTokenErrorFlag) {
//       console.log(chalkAlert("TSS | SKIP FOLLOW | TOKEN ERROR FLAG | 3C @" + threeceeUserObj.screenName));
//       return cb();
//     }
    
//     if (threeceeUserObj.stats.twitterFollowLimit) {

//       if (threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout >= moment().valueOf()) {

//         console.log(chalkLog("TSS | ... SKIP FOLLOW | FOLLOW LIMIT"
//           + " | 3C @" + threeceeUserObj.screenName
//           + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//           + " | " + msToTime(moment().valueOf() - threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//           + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout - moment().valueOf()) + " REMAINING"
//         ));
//         return cb();
//       }

//       console.log(chalkAlert("TSS | XXX FOLLOW LIMIT"
//         + " | 3C @" + threeceeUserObj.screenName
//         + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//         + " | " + msToTime(moment().valueOf() - threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//         + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout - moment().valueOf()) + " REMAINING"
//       ));

//       threeceeUserObj.stats.twitterFollowLimit = false;
//     }
    
//     if (threeceeUserObj.followUserSet.size >= 5000){

//       console.log(chalkLog("TSS | ... SKIP FOLLOW | MAX FOLLOWING"
//         + " | @" + params.user.screenName
//         + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//         + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//         + " | UID: " + params.user.userId
//         + " | IN FOLLOW USER SET: " + threeceeUserObj.followUserSet.has(params.user.userId)
//       ));

//       // process.send({
//       //   op: "TWITTER_STATS", 
//       //   threeceeUser: threeceeUserObj.screenName, 
//       //   stats: threeceeUserObj.stats, 
//       //   twitterFollowing: threeceeUserObj.followUserSet.size
//       // });

//       return cb();

//     }

//     // threeceeUserObj.twit.post("friendships/create", {screen_name: params.user.screenName}, function(err, data, response) {

//     //   if (err) {
  
//     //     threeceeUserObj.stats.error = err;
//     //     threeceeUserObj.stats.twitterErrors += 1;

//     //     if (data.errors[0].code !== undefined) { 

//     //       if (data.errors[0].code === 89) {

//     //         console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | TOKEN ERROR (CODE 89)"
//     //           + " | 3C @" + screenName
//     //           + " | FOLLOW @" + params.user.screenName
//     //           + " | " + err
//     //         ));

//     //         process.send({
//     //           op: "ERROR", 
//     //           threeceeUser: threeceeUserObj.screenName, 
//     //           stats: threeceeUserObj.stats, 
//     //           errorType: "TWITTER_TOKEN", 
//     //           error: data.errors[0]
//     //         });

//     //         threeceeUserObj.stats.twitterTokenErrorFlag = true;
//     //         return cb();
//     //       }

//     //       if (data.errors[0].code === 261) {

//     //         console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | TOKEN ERROR (CODE 261)"
//     //           + " | 3C @" + screenName
//     //           + " | FOLLOW @" + params.user.screenName
//     //           + " | " + err
//     //         ));

//     //         process.send({
//     //           op: "ERROR", 
//     //           threeceeUser: threeceeUserObj.screenName, 
//     //           stats: threeceeUserObj.stats, 
//     //           errorType: "TWITTER_TOKEN", 
//     //           error: data.errors[0]
//     //         });

//     //         threeceeUserObj.stats.twitterTokenErrorFlag = true;
//     //         return cb();
//     //       }

//     //       if (data.errors[0].code === 161) {

//     //         threeceeUserObj.stats.twitterFollowLimit = moment().valueOf();

//     //         console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | FOLLOW LIMIT (CODE 161)"
//     //           + " | 3C @" + screenName
//     //           + " | FOLLOW @" + params.user.screenName
//     //           + " | " + err
//     //         ));
            
//     //         process.send({
//     //           op: "FOLLOW_LIMIT", 
//     //           threeceeUser: threeceeUserObj.screenName, 
//     //           stats: threeceeUserObj.stats, 
//     //           twitterFollowLimit: threeceeUserObj.stats.twitterFollowLimit,
//     //           twitterFollowing: threeceeUserObj.followUserSet.size
//     //         });

//     //         return cb();
//     //       }

//     //       if (data.errors[0].code === 162) {

//     //         threeceeUserObj.stats.twitterFollowLimit = moment().valueOf();

//     //         console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | FOLLOW BLOCK (CODE 162)"
//     //           + " | 3C @" + threeceeUserObj.screenName
//     //           + " | UID: " + params.user.userId
//     //           + " | @" + params.user.screenName
//     //           + " | " + err
//     //         ));

//     //         threeceeUserObj.doNotFollowUserSet.add(params.user.userId);
            
//     //         process.send({
//     //           op: "ERROR", 
//     //           threeceeUser: threeceeUserObj.screenName, 
//     //           userId: params.user.userId,
//     //           screenName: params.user.screenName,
//     //           stats: threeceeUserObj.stats,
//     //           errorType: "TWITTER_FOLLOW_BLOCK", 
//     //           error: data.errors[0]
//     //         });

//     //         return cb();
//     //       }

//     //     }

//     //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//     //     console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | ERROR (CODE " + data.errors[0].code + ")"
//     //       + " | 3C @" + screenName
//     //       + " | FOLLOW @" + params.user.screenName
//     //       + " | " + err
//     //     ));

//     //     return cb();
//     //   }

//     //   threeceeUserObj.followUserSet.add(params.user.userId);

//     //   threeceeUserObj.stats.error = false;

//     //   console.log(chalkLog("TSS | +++ FOLLOW"
//     //     + " | 3C @" + threeceeUserObj.screenName
//     //     + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//     //     + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//     //     + " | UID: " + params.user.userId
//     //     + " | @" + params.user.screenName
//     //   ));

//     //   params.user.nodeId = params.user.userId;
//     //   params.user.following = true;
//     //   params.user.threeceeFollowing = threeceeUserObj.screenName;

//     //   userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

//     //     if (err) {
//     //       console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
//     //     }
//     //     else {
//     //       const printString = "TSS | @" + updatedUser.screenName + " | DB USER UPDATED";
//     //       printUserObj(printString, updatedUser);
//     //     }

//     //     let filter = {};
//     //     filter.track = [];
//     //     filter.follow = [];

//     //     if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
//     //     if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

//     //     threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

//     //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//     //     process.send({
//     //       op: "TWITTER_STATS", 
//     //       threeceeUser: threeceeUserObj.screenName, 
//     //       stats: threeceeUserObj.stats, 
//     //       twitterFollowing: threeceeUserObj.followUserSet.size
//     //     });

//     //     cb(true);


//     //   });

//     // });

//   },
//   function(success){
//     debug(chalkTwitter("TSS | +++ FOLLOW SUCCESS"));
//     callback(null, success);
//   });
// }

// function ignore(params, callback) {

//   if ((params.threeceeUser !== undefined) && params.threeceeUser && (params.threeceeUser !== "ALL")) {

//     if (!threeceeUserHashMap.has(params.threeceeUser)) {
//       console.log(chalkAlert("TSS | IGNORING ... | 3C @" + params.threeceeUser + " UNINITIALIZED ... SKIPPING"));
//       if (callback !== undefined) {
//         return callback("3C @" + params.threeceeUser + "NOT INITIALIZED", param.user);
//       }
//     }

//     console.log(chalkLog("TSS | IGNORING ... | 3C @" + params.threeceeUser + " | UID: " + params.user.userId));

//     let threeceeUserObj = threeceeUserHashMap.get(params.threeceeUser);

//     // threeceeUserObj.twit.post("friendships/destroy", {user_id: params.user.userId}, function(err, data, response) {
//     //   if (err) {
  
//     //     threeceeUserObj.stats.error = err;
//     //     threeceeUserObj.stats.twitterErrors += 1;

//     //     if (data.errors[0].code !== undefined) { 

//     //       if (data.errors[0].code === 89) {

//     //         threeceeUserObj.stats.twitterTokenErrorFlag = true;

//     //         process.send({
//     //           op: "ERROR", 
//     //           threeceeUser: threeceeUserObj.screenName, 
//     //           stats: threeceeUserObj.stats, 
//     //           errorType: "TWITTER_TOKEN", 
//     //           error: data.errors[0]
//     //         });

//     //         return callback(err, null);
//     //       }

//     //       console.log(chalkError("TSS | *** ERROR IGNORE FRIENDSHIP DESTROY: " + err));
//     //       return callback(err, null);
//     //     }

//     //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//     //     console.log(chalkError("TSS | *** ERROR IGNORE FRIENDSHIP DESTROY: " + err));

//     //     return callback(err, null);
//     //   }

//     //   threeceeUserObj.stats.error = false;

//     //   console.log(chalkLog("TSS | XXX IGNORE"
//     //     + " | 3C @" + threeceeUserObj.screenName
//     //     + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//     //     + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//     //     + " | UID: " + params.user.userId
//     //     + " | @" + params.user.screenName
//     //   ));

//     //   params.user.nodeId = params.user.userId;
//     //   params.user.ignored = true;

//     //   userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

//     //     if (err) {
//     //       console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
//     //     }
//     //     else {
//     //       const printString = "TSS | @" + updatedUser.screenName + " | UNFOLLOW DB USER UPDATED";
//     //       printUserObj(printString, updatedUser);
//     //     }

//     //     if (threeceeUserObj.followUserSet.has(params.user.userId)) {
//     //       threeceeUserObj.followUserSet.delete(params.user.userId);
//     //     }

//     //     let filter = {};
//     //     filter.track = [];
//     //     filter.follow = [];

//     //     if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
//     //     if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

//     //     threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

//     //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//     //     process.send({
//     //       op: "TWITTER_STATS", 
//     //       threeceeUser: threeceeUserObj.screenName, 
//     //       stats: threeceeUserObj.stats, 
//     //       twitterFollowing: threeceeUserObj.followUserSet.size
//     //     });

//     //     return callback(err, params.user);

//     //   });

//     // });
//   }
//   else {

//     console.log(chalkAlert("TSS | UNFOLLOWING ALL 3C | UID: " + params.user.userId));

//     const twUsersArray = threeceeUserHashMap.keys();

//     async.eachSeries(twUsersArray, function(screenName, cb){

//       let threeceeUserObj = threeceeUserHashMap.get(screenName);

//       console.log(chalkInfo("TSS | CHECK UNFOLLOW"
//         + " | 3C @" + threeceeUserObj.screenName 
//         + " | UID: " + params.user.userId
//         + " | @" + params.user.screenName
//         ));

//       if (threeceeUserObj.stats.twitterTokenErrorFlag) {
//         console.log(chalkAlert("TSS | SKIP UNFOLLOW | TOKEN ERROR FLAG | 3C @" + threeceeUserObj.screenName));
//         return cb();
//       }

//       if (threeceeUserObj.stats.twitterFollowLimit) {

//         if (threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout >= moment().valueOf()) {

//           console.log(chalkLog("TSS | ... SKIP FOLLOW | FOLLOW LIMIT"
//             + " | 3C @" + threeceeUserObj.screenName
//             + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//             + " | " + msToTime(moment().valueOf() - threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//             + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout - moment().valueOf()) + " REMAINING"
//           ));
//           return cb();
//         }

//         console.log(chalkAlert("TSS | XXX FOLLOW LIMIT"
//           + " | 3C @" + threeceeUserObj.screenName
//           + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//           + " | " + msToTime(moment().valueOf() - threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//           + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout - moment().valueOf()) + " REMAINING"
//         ));

//         threeceeUserObj.stats.twitterFollowLimit = false;
//       }




//       if (threeceeUserObj.followUserSet.has(params.user.userId)) {
//         threeceeUserObj.followUserSet.delete(params.user.userId);
//       }

//       // threeceeUserObj.twit.post("friendships/destroy", {user_id: params.user.userId}, function(err, data, response) {

//       //   if (err) {
    
//       //     threeceeUserObj.stats.error = err;
//       //     threeceeUserObj.stats.twitterErrors += 1;

//       //     if (data.errors[0].code !== undefined) { 

//       //       if (data.errors[0].code === 89) {

//       //         threeceeUserObj.stats.twitterTokenErrorFlag = true;

//       //         process.send({
//       //           op: "ERROR", 
//       //           threeceeUser: threeceeUserObj.screenName, 
//       //           stats: threeceeUserObj.stats, 
//       //           errorType: "TWITTER_TOKEN", 
//       //           error: data.errors[0]
//       //         });

//       //         return cb();
//       //       }

//       //       console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));
//       //       return cb();
//       //     }

//       //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//       //     console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));

//       //     return cb();
//       //   }

//       //   threeceeUserObj.stats.error = false;

//       //   console.log(chalkLog("TSS | XXX UNFOLLOW"
//       //     + " | 3C @" + threeceeUserObj.screenName
//       //     + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//       //     + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//       //     + " | UID: " + params.user.userId
//       //     + " | @" + params.user.screenName
//       //     // + "\nDATA\n" + jsonPrint(data)
//       //   ));

//       //   params.user.nodeId = params.user.userId;
//       //   params.user.following = false;
//       //   params.user.threeceeFollowing = false;

//       //   userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

//       //     if (err) {
//       //       console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
//       //     }
//       //     else {
//       //       const printString = "TSS | @" + updatedUser.screenName + " | UNFOLLOW DB USER UPDATED";
//       //       printUserObj(printString, updatedUser);
//       //     }

//       //     let filter = {};
//       //     filter.track = [];
//       //     filter.follow = [];

//       //     if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
//       //     if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

//       //     threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

//       //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//       //     process.send({
//       //       op: "TWITTER_STATS", 
//       //       threeceeUser: threeceeUserObj.screenName, 
//       //       stats: threeceeUserObj.stats, 
//       //       twitterFollowing: threeceeUserObj.followUserSet.size
//       //     });

//       //     cb();

//       //   });

//       // });
//     },
//     function(success){
//       if (success) {
//         console.log(chalkError("TSS | UNFOLLOW SUCCESS"
//         ));
//       }
//       callback(null, success);
//     });
//   }
// }

// function unfollow(params, callback) {

//   if ((params.threeceeUser !== undefined) && params.threeceeUser && (params.threeceeUser !== "ALL")) {

//     if (!threeceeUserHashMap.has(params.threeceeUser)) {
//       console.log(chalkAlert("TSS | UNFOLLOWING ... | 3C @" + params.threeceeUser + " UNINITIALIZED ... SKIPPING"));
//       if (callback !== undefined) {
//         return callback("3C @" + params.threeceeUser + "NOT INITIALIZED", param.user);
//       }
//     }

//     console.log(chalkLog("TSS | UNFOLLOWING ... | 3C @" + params.threeceeUser + " | UID: " + params.user.userId));

//     let threeceeUserObj = threeceeUserHashMap.get(params.threeceeUser);

//     // threeceeUserObj.twit.post("friendships/destroy", {user_id: params.user.userId}, function(err, data, response) {
//     //   if (err) {
  
//     //     threeceeUserObj.stats.error = err;
//     //     threeceeUserObj.stats.twitterErrors += 1;

//     //     if (data.errors[0].code !== undefined) { 

//     //       if (data.errors[0].code === 89) {

//     //         threeceeUserObj.stats.twitterTokenErrorFlag = true;

//     //         process.send({
//     //           op: "ERROR", 
//     //           threeceeUser: threeceeUserObj.screenName, 
//     //           stats: threeceeUserObj.stats, 
//     //           errorType: "TWITTER_TOKEN", 
//     //           error: data.errors[0]
//     //         });

//     //         return callback(err, null);
//     //       }

//     //       console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));
//     //       return callback(err, null);
//     //     }

//     //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//     //     console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));

//     //     return callback(err, null);
//     //   }

//     //   threeceeUserObj.stats.error = false;

//     //   console.log(chalkLog("TSS | XXX UNFOLLOW"
//     //     + " | 3C @" + threeceeUserObj.screenName
//     //     + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//     //     + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//     //     + " | UID: " + params.user.userId
//     //     + " | @" + params.user.screenName
//     //   ));

//     //   params.user.nodeId = params.user.userId;
//     //   params.user.following = false;
//     //   params.user.threeceeFollowing = false;

//     //   userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

//     //     if (err) {
//     //       console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
//     //     }
//     //     else {
//     //       const printString = "TSS | @" + updatedUser.screenName + " | UNFOLLOW DB USER UPDATED";
//     //       printUserObj(printString, updatedUser);
//     //     }

//     //     if (threeceeUserObj.followUserSet.has(params.user.userId)) {
//     //       threeceeUserObj.followUserSet.delete(params.user.userId);
//     //     }

//     //     let filter = {};
//     //     filter.track = [];
//     //     filter.follow = [];

//     //     if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
//     //     if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

//     //     threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

//     //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//     //     process.send({
//     //       op: "TWITTER_STATS", 
//     //       threeceeUser: threeceeUserObj.screenName, 
//     //       stats: threeceeUserObj.stats, 
//     //       twitterFollowing: threeceeUserObj.followUserSet.size
//     //     });

//     //     return callback(err, params.user);

//     //   });

//     // });
//   }
//   else {

//     console.log(chalkAlert("TSS | UNFOLLOWING ALL 3C | UID: " + params.user.userId));

//     const twUsersArray = threeceeUserHashMap.keys();

//     async.eachSeries(twUsersArray, function(screenName, cb){

//       let threeceeUserObj = threeceeUserHashMap.get(screenName);

//       console.log(chalkInfo("TSS | CHECK UNFOLLOW"
//         + " | 3C @" + threeceeUserObj.screenName 
//         + " | UID: " + params.user.userId
//         + " | @" + params.user.screenName
//         ));

//       if (threeceeUserObj.stats.twitterTokenErrorFlag) {
//         console.log(chalkAlert("TSS | SKIP UNFOLLOW | TOKEN ERROR FLAG | 3C @" + threeceeUserObj.screenName));
//         return cb();
//       }

//       // if (threeceeUserObj.stats.twitterFollowLimit) {
//       //   console.log(chalkAlert("TSS | SKIP UNFOLLOW | FOLLOW LIMIT"
//       //     + " | 3C @" + threeceeUserObj.screenName
//       //     + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//       //     + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//       //   ));
//       //   return cb();
//       // }



//       if (threeceeUserObj.stats.twitterFollowLimit) {

//         if (threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout >= moment().valueOf()) {

//           console.log(chalkLog("TSS | ... SKIP FOLLOW | FOLLOW LIMIT"
//             + " | 3C @" + threeceeUserObj.screenName
//             + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//             + " | " + msToTime(moment().valueOf() - threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//             + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout - moment().valueOf()) + " REMAINING"
//           ));
//           return cb();
//         }

//         console.log(chalkAlert("TSS | XXX FOLLOW LIMIT"
//           + " | 3C @" + threeceeUserObj.screenName
//           + " | AT: " + moment(threeceeUserObj.stats.twitterFollowLimit).format(compactDateTimeFormat)
//           + " | " + msToTime(moment().valueOf() - threeceeUserObj.stats.twitterFollowLimit) + " AGO"
//           + " | " + msToTime(threeceeUserObj.stats.twitterFollowLimit + configuration.twitterFollowLimitTimeout - moment().valueOf()) + " REMAINING"
//         ));

//         threeceeUserObj.stats.twitterFollowLimit = false;
//       }




//       if (threeceeUserObj.followUserSet.has(params.user.userId)) {
//         threeceeUserObj.followUserSet.delete(params.user.userId);
//       }

//       // threeceeUserObj.twit.post("friendships/destroy", {user_id: params.user.userId}, function(err, data, response) {

//       //   if (err) {
    
//       //     threeceeUserObj.stats.error = err;
//       //     threeceeUserObj.stats.twitterErrors += 1;

//       //     if (data.errors[0].code !== undefined) { 

//       //       if (data.errors[0].code === 89) {

//       //         threeceeUserObj.stats.twitterTokenErrorFlag = true;

//       //         process.send({
//       //           op: "ERROR", 
//       //           threeceeUser: threeceeUserObj.screenName, 
//       //           stats: threeceeUserObj.stats, 
//       //           errorType: "TWITTER_TOKEN", 
//       //           error: data.errors[0]
//       //         });

//       //         return cb();
//       //       }

//       //       console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));
//       //       return cb();
//       //     }

//       //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//       //     console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));

//       //     return cb();
//       //   }

//       //   threeceeUserObj.stats.error = false;

//       //   console.log(chalkLog("TSS | XXX UNFOLLOW"
//       //     + " | 3C @" + threeceeUserObj.screenName
//       //     + " | FOLLOWING: " + threeceeUserObj.followUserSet.size 
//       //     + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
//       //     + " | UID: " + params.user.userId
//       //     + " | @" + params.user.screenName
//       //     // + "\nDATA\n" + jsonPrint(data)
//       //   ));

//       //   params.user.nodeId = params.user.userId;
//       //   params.user.following = false;
//       //   params.user.threeceeFollowing = false;

//       //   userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

//       //     if (err) {
//       //       console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
//       //     }
//       //     else {
//       //       const printString = "TSS | @" + updatedUser.screenName + " | UNFOLLOW DB USER UPDATED";
//       //       printUserObj(printString, updatedUser);
//       //     }

//       //     let filter = {};
//       //     filter.track = [];
//       //     filter.follow = [];

//       //     if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
//       //     if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

//       //     threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

//       //     threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

//       //     process.send({
//       //       op: "TWITTER_STATS", 
//       //       threeceeUser: threeceeUserObj.screenName, 
//       //       stats: threeceeUserObj.stats, 
//       //       twitterFollowing: threeceeUserObj.followUserSet.size
//       //     });

//       //     cb();

//       //   });

//       // });
//     },
//     function(success){
//       if (success) {
//         console.log(chalkError("TSS | UNFOLLOW SUCCESS"
//         ));
//       }
//       callback(null, success);
//     });
//   }
// }

process.on("message", function(m) {

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

      configuration.verbose = m.verbose;
      configuration.testMode = m.testMode;

      console.log(chalkInfo("TSS | INIT"
        + " | TITLE: " + m.title
      ));
    break;

    case "USER_AUTHENTICATED":

      console.log(chalkInfo("TSS | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      let threeceeUserObj = threeceeUserHashMap.get(m.user.screenName);

      if (threeceeUserObj !== undefined) {

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

              threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

            }
            else {

              threeceeUserObj.stats.error = false;
              threeceeUserObj.stats.authenticated = true;
              threeceeUserObj.followUserSet = new Set(data.ids);

              console.log(chalkError("TSS | TWITTER GET FRIENDS IDS"
                + " | @" + threeceeUserObj.screenName
                + " | " + threeceeUserObj.followUserSet.size + " FRIENDS"
              ));

              threeceeUserHashMap.set(threeceeUserObj.screenName, threeceeUserObj);

              let userIndex = 0;
              let printString = "";

              async.eachSeries([...threeceeUserObj.followUserSet], function(userId, cb){

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
                    console.log(chalkAlert("TSS | ??? TWITTER USER FOLLOW HM HIT"
                      + " | UID: " + userId
                      + " | IN HM: 3C @" + threeceeFollowingInHashMap
                      + " | CUR 3C @: " + threeceeUserObj.screenName
                    ));

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

                    if (configuration.verbose || (userIndex % 100 === 0)){
                      printString = "TSS | [ " + userIndex + "/" + threeceeUserObj.followUserSet.size + " ] @" + threeceeUserObj.screenName + " | DB HIT";
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
                    console.log(chalkLog("TSS | [ " + userIndex + "/" + threeceeUserObj.followUserSet.size + " ]"
                      + " @" + threeceeUserObj.screenName 
                      + " | DB USER MISS  | UID: " + userId
                    ));
                    cb();
                  }
                });

              }, function(err){

                let filter = {};
                filter.track = [];
                // filter.follow = [];

                // if (threeceeUserObj.searchTermArray.length > 0) { filter.track = threeceeUserObj.searchTermArray; }
                if (threeceeUserObj.searchTermSet.size > 0) { filter.track = [...threeceeUserObj.searchTermSet]; }
                // if (threeceeUserObj.followUserSet.size > 0) { filter.follow = [...threeceeUserObj.followUserSet]; }

                initSearchStream({threeceeUserObj: threeceeUserObj}, function(err, tuObj){

                  console.log(chalkInfo("TSS | END USER_AUTHENTICATED"
                    + " | @" + tuObj.screenName
                  ));

                  threeceeUserHashMap.set(tuObj.screenName, tuObj);

                  process.send({
                    op: "TWITTER_STATS", 
                    threeceeUser: threeceeUserObj.screenName, 
                    stats: threeceeUserObj.stats, 
                    twitterFollowing: threeceeUserObj.followUserSet.size
                  });

                });

              });

            }

          });
        });

      }
    break;

    case "USER_SHOW":

      if (userShowQueue.length < USER_SHOW_QUEUE_MAX_LENGTH) {

        userCache.get(m.user.userId, function(err, userCacheValue){

          if (err) {
            console.log(chalkError("TSS | *** USER CACHE ERROR: " + err));
          }

          if (userCacheValue) { 
            console.log(chalkLog("TSS | USER CACHE HIT: " + m.user.userId));
            return; 
          }

          userShowQueue.push(m.user);

          userCache.set(m.user.userId, true);

          console.log(chalkInfo("TSS | USER_SHOW"
            + " | 3C FOLLOWING: " + m.user.following
            + " | 3C @" + m.user.threeceeFollowing
            + " [ USQ: " + userShowQueue.length + "]"
            + " | FLWRs: " + m.user.followersCount
            + " | FRNDs: " + m.user.friendsCount
            + " | USER " + m.user.userId
            + " | @" + m.user.screenName
            + " | " + m.user.name
            + "\nTSS | USER_SHOW | DESC: " + m.user.description
          ));

        });
      }
    break;

    case "FOLLOW":
      console.log(chalkInfo("TSS | FOLLOW"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
        + " | FORCE FOLLOW: " + m.forceFollow
      ));

      if (m.forceFollow !== undefined) { configuration.forceFollow = m.forceFollow; }

      // follow(m, function(err, success){
      // });
    break;

    case "UNFOLLOW":

      // unfollowQueue.push(m);;

      console.log(chalkInfo("TSS | WAS > UNFOLLOW Q"
        + "[" + unfollowQueue.length + "]"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "IGNORE":

      console.log(chalkInfo("TSS | WAS > IGNORE"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));

      // ignoreQueue.push(m);;
    break;

    case "UPDATE_SEARCH_TERMS":
      console.log(chalkLog("TSS | UPDATE SEARCH TERMS"));

      initSearchTerms(configuration, function(err, status){

        if (err) {
          console.log(chalkError("TSS | *** INIT SEARCH TERMS ERROR: " + err));
          quit();
          return;
        }

        console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE"));

        debug("initSearchTerms status\n" + jsonPrint(status));

        if (!twitterSearchInit) { initTwitterSearch(configuration); }

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

    console.log(chalkLog("TSS | " + configuration.processName + " STARTED " + getTimeStamp() + "\n"));


    connectDb(function(err, db){

      if (err) {
        dbConnectionReady = false;
        console.log(chalkError("TSS | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
        quit("MONGO DB CONNECT ERROR");
      }

      // global.dbConnection = db;

      UserServerController = require("@threeceelabs/user-server-controller");
      userServerController = new UserServerController("TSS_USC");

      userServerControllerReady = false;

      userServerController.on("ready", function(appname){
        userServerControllerReady = true;
        console.log(chalkLog("TSS | USC READY | " + appname));
      });

      User = mongoose.model("User", userModel.UserSchema);

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

    // initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER}, function(err, ituObj){
    //   infoTwitterUserObj = ituObj;
    //   // initUserShowQueueInterval(configuration);
    //   // initUnfollowQueueInterval(configuration);
    //   // initIgnoreQueueInterval(configuration);
    // });

    initTwitterUsers(configuration, function(err){
      if (err){
        console.log(chalkError("TSS | ERROR initTwitterUsers\n" + err));
      }
      
      console.log(chalkTwitter("TSS | TWITTER USER HASH MAP ENTRIES"
        + " | " + threeceeUserHashMap.keys()
      ));

      initSearchTerms(configuration, function(err, status){

        if (err) {
          console.log(chalkError("TSS | *** INIT SEARCH TERMS ERROR: " + err));
          quit();
          return;
        }

        console.log(chalkInfo("TSS | INITIALIZATION COMPLETE"));

        debug("TSS | initSearchTerms status\n" + jsonPrint(status));

        if (!twitterSearchInit) { initTwitterSearch(configuration); }
      });

    });

  });
}, 5*ONE_SECOND);


