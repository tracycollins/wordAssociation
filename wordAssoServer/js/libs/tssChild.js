/*jslint node: true */
/*jshint sub:true*/

const MODULE_ID_PREFIX = "TSS";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;

const TWEET_ID_CACHE_DEFAULT_TTL = 20;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

// const TWITTER_MAX_TRACKING_NUMBER = process.env.TWITTER_MAX_TRACKING_NUMBER || 400;
const TWITTER_MAX_TRACKING_NUMBER = 400;

const DROPBOX_DEFAULT_CONFIG_FOLDER = "/config/utility/default";
const DROPBOX_DEFAULT_SEARCH_TERMS_DIR = "/config/utility/default";
const DROPBOX_DEFAULT_SEARCH_TERMS_FILE = "defaultSearchTerms.txt";

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;


const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const mangledRegEx = /\u00C3.\u00C2|\u00B5/g;


const os = require("os");
const fs = require("fs");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

let DROPBOX_ROOT_FOLDER;

if (hostname === "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
}
else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
}

const jsonParse = require("json-parse-safe");
const sizeof = require("object-sizeof");
const _ = require("lodash");
const S = require("string");
const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
const Twit = require("twit");
const moment = require("moment");
const treeify = require("treeify");
const Measured = require("measured");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");


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


const debug = require("debug")("tss");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");


const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.red;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;

const searchTermHashMap = new HashMap();

// const unfollowQueue = [];

const ignoreUserSet = new Set();

const allowLocationsSet = new Set();
allowLocationsSet.add("new england");
let allowLocationsArray = Array.from(allowLocationsSet);
let allowLocationsString = allowLocationsArray.join('\\b|\\b');
allowLocationsString = '\\b' + allowLocationsString + '\\b';
// let allowLocationsRegEx = new RegExp(allowLocationsString, "gi");

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
configuration.searchTermsUpdateInterval = Number(ONE_MINUTE);
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

// function loadFile(path, file, callback) {

//   // console.log(chalkInfo("TSS | LOAD FOLDER " + path));
//   // console.log(chalkInfo("TSS | LOAD FILE " + file));
//   // console.log(chalkInfo("TSS | FULL PATH " + path + "/" + file));

//   dropboxClient.filesDownload({path: path + "/" + file}).
//     then(function(data) {
//       console.log("TSS | " + chalkLog(getTimeStamp()
//         + " | LOADING FILE FROM DROPBOX FILE: " + path + "/" + file
//       ));

//       const payload = data.fileBinary;
//       debug(payload);

//       if (file.match(/\.json$/gi)) {
//         const fileObj = JSON.parse(payload);
//         return(callback(null, fileObj));
//       }
//       else {
//         return(callback(null, payload));
//       }
//     }).
//     catch(function(error) {
//       console.log(chalkError("TSS | *** DROPBOX loadFile ERROR: " + file + " | " + error));
//       console.log(chalkError("TSS | *** DROPBOX READ " + file + " ERROR"));

//       if ((error.response.status === 404) || (error.response.status === 409)) {
//         console.error(chalkError("TSS | *** DROPBOX READ FILE " + file + " NOT FOUND"
//           + " ... SKIPPING ...")
//         );
//         return(callback(null, null));
//       }
//       if (error.status === 0) {
//         console.error(chalkError("TSS | *** DROPBOX NO RESPONSE"
//           + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
//         return(callback(null, null));
//       }
//       console.log(chalkError(jsonPrint(error)));
//       return(callback(error, null));
//     }).
//     catch(function(err) {
//       console.log(chalkError("TSS | *** ERROR DROPBOX LOAD FILE\n" + err));
//       callback(err, null);
//     });
// }

// function loadFile(params) {

//   return new Promise(function(resolve, reject){

//     const noErrorNotFound = params.noErrorNotFound || false;

//     let fullPath = params.path || params.folder + "/" + params.file;

//     debug(chalkInfo("LOAD PATH " + params.path));
//     debug(chalkInfo("LOAD FOLDER " + params.folder));
//     debug(chalkInfo("LOAD FILE " + params.file));
//     debug(chalkInfo("FULL PATH " + fullPath));


//     if (configuration.offlineMode || params.loadLocalFile) {

//       fullPath = DROPBOX_ROOT_FOLDER + fullPath;

//       fs.readFile(fullPath, "utf8", function(err, data) {

//         if (err) {
//           console.log(chalkError("fs readFile ERROR: " + err));
//           return reject(err);
//         }

//         console.log(chalkInfo(getTimeStamp()
//           + " | LOADING FILE FROM DROPBOX"
//           + " | " + fullPath
//         ));

//         if (fullPath.match(/\.json$/gi)) {

//           const results = jsonParse(data);

//           if (results.error) {
//             console.log(chalkError(getTimeStamp()
//               + " | *** LOAD FILE FROM DROPBOX ERROR"
//               + " | " + fullPath
//               + " | " + results.error
//             ));

//             return reject(results.error);
//           }

//           const fileObjSizeMbytes = sizeof(results.value)/ONE_MEGABYTE;

//           console.log(chalkInfo(getTimeStamp()
//             + " | LOADED FILE FROM DROPBOX"
//             + " | " + fileObjSizeMbytes.toFixed(2) + " MB"
//             + " | " + fullPath
//           ));

//           return resolve(results.value);

//         }

//         console.log(chalkError(getTimeStamp()
//           + " | SKIP LOAD FILE FROM DROPBOX"
//           + " | " + fullPath
//         ));
//         resolve();

//       });

//      }
//     else {

//       dropboxClient.filesDownload({path: fullPath}).
//       then(function(data) {

//         debug(chalkLog(getTimeStamp()
//           + " | LOADING FILE FROM DROPBOX FILE: " + fullPath
//         ));

//         if (fullPath.match(/\.json$/gi)) {

//           const payload = data.fileBinary;

//           if (!payload || (payload === undefined)) {
//             return reject(new Error(MODULE_ID_PREFIX + " LOAD FILE PAYLOAD UNDEFINED"));
//           }

//           // jsonParse(payload, function(err, fileObj){
//           //   if (err) {
//           //     console.log(chalkError(getTimeStamp()
//           //       + " | *** LOAD FILE FROM DROPBOX ERROR"
//           //       + " | " + fullPath
//           //       + " | " + err
//           //     ));

//           //     return reject(err);
//           //   }

//           //   return resolve(fileObj);

//           // });

//           const results = jsonParse(payload);

//           if (results.error) {
//             console.log(chalkError(getTimeStamp()
//               + " | *** LOAD FILE FROM DROPBOX ERROR"
//               + " | " + fullPath
//               + " | " + results.error
//             ));

//             return reject(results.error);
//           }

//           const fileObjSizeMbytes = sizeof(results.value)/ONE_MEGABYTE;

//           console.log(chalkInfo(getTimeStamp()
//             + " | LOADED FILE FROM DROPBOX"
//             + " | " + fileObjSizeMbytes.toFixed(2) + " MB"
//             + " | " + fullPath
//           ));

//           return resolve(results.value);

//         }
//         else {
//           resolve();
//         }
//       }).
//       catch(function(err) {

//         console.log(chalkError(MODULE_ID_PREFIX + " | *** DROPBOX loadFile ERROR: " + fullPath));
        
//         if ((err.status === 409) || (err.status === 404)) {
//           if (noErrorNotFound) {
//             if (configuration.verbose) { console.log(chalkLog(MODULE_ID_PREFIX + " | *** DROPBOX READ FILE " + fullPath + " NOT FOUND")); }
//             return resolve(new Error("NOT FOUND"));
//           }
//           console.log(chalkAlert(MODULE_ID_PREFIX + " | *** DROPBOX READ FILE " + fullPath + " NOT FOUND ... SKIPPING ..."));
//           return resolve(err);
//         }
        
//         if (err.status === 0) {
//           console.log(chalkError(MODULE_ID_PREFIX + " | *** DROPBOX NO RESPONSE"
//             + " | NO INTERNET CONNECTION? SKIPPING ..."));
//           return resolve(new Error("NO INTERNET"));
//         }

//         reject(err);

//       });
//     }
//   });
// }
function loadFile(params) {

  return new Promise(function(resolve, reject){

    const noErrorNotFound = params.noErrorNotFound || false;

    let fullPath = params.path || params.folder + "/" + params.file;

    debug(chalkInfo("LOAD PATH " + params.path));
    debug(chalkInfo("LOAD FOLDER " + params.folder));
    debug(chalkInfo("LOAD FILE " + params.file));
    debug(chalkInfo("FULL PATH " + fullPath));


    if (configuration.offlineMode || params.loadLocalFile) {

      fullPath = DROPBOX_ROOT_FOLDER + fullPath;

      fs.readFile(fullPath, "utf8", function(err, data) {

        if (err) {
          console.log(chalkError("fs readFile ERROR: " + err));
          return reject(err);
        }

        console.log(chalkInfo(getTimeStamp()
          + " | LOADING FILE FROM DROPBOX"
          + " | " + fullPath
        ));

        if (fullPath.match(/\.json$/gi)) {

          const results = jsonParse(data);

          if (results.error) {
            console.log(chalkError(getTimeStamp()
              + " | *** LOAD FILE FROM DROPBOX ERROR"
              + " | " + fullPath
              + " | " + results.error
            ));

            return reject(results.error);
          }

          const fileObjSizeMbytes = sizeof(results.value)/ONE_MEGABYTE;

          console.log(chalkInfo(getTimeStamp()
            + " | LOADED FILE FROM DROPBOX"
            + " | " + fileObjSizeMbytes.toFixed(2) + " MB"
            + " | " + fullPath
          ));

          return resolve(results.value);

        }

        console.log(chalkError(getTimeStamp()
          + " | SKIP LOAD FILE FROM DROPBOX"
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

        if (fullPath.match(/\.(json|txt)$/gi)) {

          const payload = data.fileBinary;

          if (!payload || (payload === undefined)) {
            return reject(new Error(MODULE_ID_PREFIX + " LOAD FILE PAYLOAD UNDEFINED"));
          }

          let results = {};

          if (fullPath.match(/\.json$/gi)) {
            results = jsonParse(payload);
          }
          if (fullPath.match(/\.txt$/gi)) {
            results.value = payload;
          }


          if (results.error) {
            console.log(chalkError(getTimeStamp()
              + " | *** LOAD FILE FROM DROPBOX ERROR"
              + " | " + fullPath
              + " | " + results.error
            ));

            return reject(results.error);
          }

          const fileObjSizeMbytes = sizeof(results.value)/ONE_MEGABYTE;

          console.log(chalkInfo(getTimeStamp()
            + " | LOADED FILE FROM DROPBOX"
            + " | " + fileObjSizeMbytes.toFixed(2) + " MB"
            + " | " + fullPath
          ));

          return resolve(results.value);
        }
        resolve();
      }).
      catch(function(err) {

        console.log(chalkError(MODULE_ID_PREFIX + " | *** DROPBOX loadFile ERROR: " + fullPath));
        
        if ((err.status === 409) || (err.status === 404)) {
          if (noErrorNotFound) {
            if (configuration.verbose) { console.log(chalkLog(MODULE_ID_PREFIX + " | *** DROPBOX READ FILE " + fullPath + " NOT FOUND")); }
            return resolve(new Error("NOT FOUND"));
          }
          console.log(chalkAlert(MODULE_ID_PREFIX + " | *** DROPBOX READ FILE " + fullPath + " NOT FOUND ... SKIPPING ..."));
          return resolve(err);
        }
        
        if (err.status === 0) {
          console.log(chalkError(MODULE_ID_PREFIX + " | *** DROPBOX NO RESPONSE"
            + " | NO INTERNET CONNECTION? SKIPPING ..."));
          return resolve(new Error("NO INTERNET"));
        }

        reject(err);

      });
    }
  });
}


// function initStatsUpdate(cnf, callback){

//   console.log(chalkInfo("TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

//   setInterval(async function() {

//     statsObj.elapsed = moment().valueOf() - statsObj.startTime;
//     statsObj.timeStamp = moment().format(defaultDateTimeFormat);

//     showStats();

//     await checkTwitterRateLimit();

//   }, cnf.statsUpdateIntervalTime);


//   callback(null, cnf);
// }

function initStatsUpdate(cnf){

  return new Promise(function(resolve, reject){

    console.log(chalkInfo("WAS | TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

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
           console.log(chalkError("WAS | TSS | *** CHECK RATE LIMIT ERROR: " + err));
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

function twitStreamPromise(params){

  return new Promise(function(resolve, reject){

    threeceeUserObj.twitStream.get(params.endpoint, params.twitParams, function(err, data, response) {

      if (err){
        console.log(chalkError("TSS | *** TWITTER STREAM ERROR"
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

        return reject(err);
      }

      threeceeUserObj.stats.error = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = false;

      resolve(data);

    });
  });

}


function initTwit(){

  return new Promise(async function(resolve, reject){

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

          if (threeceeFollowingInHashMap !== threeceeUserObj.screenName) {

            console.log(chalkLog("TSS | !!! TWITTER USER FOLLOW MISMATCH"
              + " | UID: " + userId
              + " | IN HM: 3C @" + threeceeFollowingInHashMap
              + " | CUR 3C @: " + threeceeUserObj.screenName
            ));

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

              threeceeUserObj.followUserScreenNameSet.add(user.screenName.toLowerCase());

              if (configuration.verbose || (userIndex % 100 === 0)) {
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

      return reject(err);
    }

  });
}

function initTwitterUser(){

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

function getFileMetadata(params) {

  return new Promise(function(resolve, reject){

    if (dropboxClient === undefined) {
      return reject(new Error("dropboxClient undefined"));
    }

    const fullPath = params.folder + "/" + params.file;
    debug(chalkInfo("TSS | FOLDER " + params.folder));
    debug(chalkInfo("TSS | FILE " + params.file));

    dropboxClient.filesGetMetadata({path: fullPath}).
      then(function(response) {
        debug(chalkInfo("TSS | FILE META\n" + jsonPrint(response)));
        resolve(response);
      }).
      catch(function(err) {
        console.log(chalkError("TSS | GET FILE METADATA ERROR | PATH: " + fullPath + " ERROR: " + err));
        console.log(chalkError("TSS | GET FILE METADATA ERROR\n" + jsonPrint(err)));
        reject(err);
      });

  });
}

const followingUserIdHashMap = new HashMap();

let prevAllowLocationsFileModifiedMoment = moment("2010-01-01");
let prevIgnoredLocationsFileModifiedMoment = moment("2010-01-01");
let prevSearchTermsFileModifiedMoment = moment("2010-01-01");

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

function initSearchStream(){

  return new Promise(function(resolve, reject){

    const filter = {};
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

      if (threeceeUserObj.searchStream) {
        console.log(chalkAlert("TSS | RESTARTING TWITTER SEARCH STREAM"));
        threeceeUserObj.searchStream.stop();
      }

      threeceeUserObj.searchStream = {};

      threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);
      // threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", { track: "@realdonaldtrump" });

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

        if (data.type === "rate-limit") {
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

        console.log(chalkTwitter("TSS | " + getTimeStamp()
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

        if (tweetStatus.user.lang !== undefined && tweetStatus.user.lang !== "en") { 
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

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("TSS | INIT TERMS | @" + threeceeUserObj.screenName));

    threeceeUserObj.searchTermSet.add("realdonaldtrump");
    threeceeUserObj.searchTermSet.add("trump");
    threeceeUserObj.searchTermSet.add("ivanka");
    threeceeUserObj.searchTermSet.add("melania");
    threeceeUserObj.searchTermSet.add("maga");
    threeceeUserObj.searchTermSet.add("fbr");
    threeceeUserObj.searchTermSet.add("aoc");
    threeceeUserObj.searchTermSet.add("bernie");
    threeceeUserObj.searchTermSet.add("beto");
    threeceeUserObj.searchTermSet.add("kamala");
    threeceeUserObj.searchTermSet.add("elizabethwarren");
    threeceeUserObj.searchTermSet.add("obama");
    threeceeUserObj.searchTermSet.add("pence");
    threeceeUserObj.searchTermSet.add("clinton");
    threeceeUserObj.searchTermSet.add("biden");
    threeceeUserObj.searchTermSet.add("democrat");
    threeceeUserObj.searchTermSet.add("republican");
    threeceeUserObj.searchTermSet.add("bluewave");
    threeceeUserObj.searchTermSet.add("uniteblue");
    threeceeUserObj.searchTermSet.add("theresistence");

    let response;

    try{
      response = await getFileMetadata({folder: params.searchTermsDir, file: params.searchTermsFile});
    }
    catch(err){
      console.log(chalkError("TSS | *** GET FILE METADATA ERROR: " + err));
      return reject(err);
    }

    const fileModifiedMoment = moment(new Date(response.client_modified));
  
    if (fileModifiedMoment.isSameOrBefore(prevSearchTermsFileModifiedMoment)){
      console.log(chalkInfo("TSS | SEARCH TERMS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevSearchTermsFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));
      configEvents.emit("SEARCH_TERM_CONFIG_COMPLETE");
      return resolve(0);
    }

    console.log(chalkInfo("TSS | SEARCH TERMS FILE AFTER"));

    prevSearchTermsFileModifiedMoment = moment(fileModifiedMoment);

    try{
      const data = await loadFileRetry({folder: params.searchTermsDir, file: params.searchTermsFile}); 

      if (data === undefined){
        console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
          + " | " + params.searchTermsDir + "/" + params.searchTermsFile
        ));
        return reject(new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED"));
      }

      debug(chalkInfo("TSS | DROPBOX SEARCH TERMS FILE\n" + jsonPrint(data)));

      const dataConvertAccent = data.toString().replace(/Ã©/g, "e");
      const dataConvertTilde = dataConvertAccent.toString().replace(/Ã£/g, "a");
      let totalDataArray = dataConvertTilde.toString().split("\n");

      totalDataArray = _.shuffle(totalDataArray); // mix up eventual subset of search terms

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
        default:
          console.log(chalkError("TSS | *** UNKNOWN THREECEE USER: " + threeceeUserObj.screenName));
          return reject(new Error("UNKNOWN THREECEE USER: " + threeceeUserObj.screenName));
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

        function test(cbTest){ 
          cbTest(null, (threeceeUserObj.searchTermSet.size < TWITTER_MAX_TRACKING_NUMBER) && (dataArray.length > 0));
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
            console.log(chalkInfo("TSS | --- SKIP TRACK"
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
            return(reject(err));
          }

          initSearchStream().
          then(function(){
            console.log(chalkLog("TSS | TRACK COMPLETE"
              + " | @" + threeceeUserObj.screenName 
              + " | TRACKING " + threeceeUserObj.searchTermSet.size + " SEARCH TERMS"
            ));
            resolve(threeceeUserObj.searchTermSet.size);
          }).
          catch(function(err){
            console.log(chalkError("TSS | *** INIT SEARCH STREAM ERROR"
              + " | @" + threeceeUserObj.screenName 
              + " | ERROR: " + err
            ));
            return reject(err);
          });

        }
      );
    }
    catch(e){
      console.log(chalkError("TSS | LOAD FILE ERROR\n" + e));
      return reject(e);
    }
      
  });
}


function initAllowLocations(){

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("TSS | INIT ALLOW LOCATIONS | @" + threeceeUserObj.screenName));

    allowLocationsSet.add("new england");

    let response;

    try{
      response = await getFileMetadata({folder: DROPBOX_DEFAULT_CONFIG_FOLDER, file: "allowLocations.txt"});
    }
    catch(err){
      console.log(chalkError("TSS | *** GET FILE METADATA ERROR: " + err));
      return reject(err);
    }

    const fileModifiedMoment = moment(new Date(response.client_modified));
  
    if (fileModifiedMoment.isSameOrBefore(prevAllowLocationsFileModifiedMoment)){
      console.log(chalkInfo("TSS | ALLOW LOCATIONS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevAllowLocationsFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));
      return resolve(0);
    }

    console.log(chalkInfo("TSS | ALLOW LOCATIONS FILE AFTER"));

    prevAllowLocationsFileModifiedMoment = moment(fileModifiedMoment);

    try{
      const data = await loadFileRetry({folder: DROPBOX_DEFAULT_CONFIG_FOLDER, file: "allowLocations.txt"}); 

      if (data === undefined){
        console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
          + " | " + DROPBOX_DEFAULT_CONFIG_FOLDER + "/" + "allowLocations.txt"
        ));
        return reject(new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED"));
      }

      debug(chalkInfo("TSS | DROPBOX ALLOW LOCATIONS FILE\n" + jsonPrint(data)));

      const dataArray = data.toString().toLowerCase().
split("\n");

      console.log(chalk.blue("TSS | FILE CONTAINS " + dataArray.length + " ALLOW LOCATIONS "));

      let location;

      dataArray.forEach(function(loc){
        location = loc.trim();
        location = location.replace(/^\s+|\s+$|\n/gim, "");
        if (location.length > 1) { 
          allowLocationsSet.add(location);
          console.log(chalkLog("WAS | +++ ALLOW LOCATION [" + allowLocationsSet.size + "] " + location));
        }
      });

      allowLocationsArray = [...allowLocationsSet];
      allowLocationsString = allowLocationsArray.join('\\b|\\b');
      allowLocationsString = '\\b' + allowLocationsString + '\\b';
      // allowLocationsRegEx = new RegExp(allowLocationsString, "gi");

      resolve();

    }
    catch(e){
      console.log(chalkError("TSS | LOAD FILE ERROR\n" + e));
      return reject(e);
    }
      
  });
}

function initIgnoreLocations(){

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("TSS | INIT IGNORE LOCATIONS | @" + threeceeUserObj.screenName));

    ignoreLocationsSet.add("india");
    ignoreLocationsSet.add("london");
    ignoreLocationsSet.add("england");
    ignoreLocationsSet.add("nigeria");

    let response;

    try{
      response = await getFileMetadata({folder: DROPBOX_DEFAULT_CONFIG_FOLDER, file: "ignoreLocations.txt"});
    }
    catch(err){
      console.log(chalkError("TSS | *** GET FILE METADATA ERROR: " + err));
      return reject(err);
    }

    const fileModifiedMoment = moment(new Date(response.client_modified));
  
    if (fileModifiedMoment.isSameOrBefore(prevIgnoredLocationsFileModifiedMoment)){
      console.log(chalkInfo("TSS | IGNORE LOCATIONS FILE BEFORE OR EQUAL"
        + " | PREV: " + prevIgnoredLocationsFileModifiedMoment.format(compactDateTimeFormat)
        + " | " + fileModifiedMoment.format(compactDateTimeFormat)
      ));
      return resolve(0);
    }

    console.log(chalkInfo("TSS | IGNORE LOCATIONS FILE AFTER"));

    prevIgnoredLocationsFileModifiedMoment = moment(fileModifiedMoment);

    try{
      const data = await loadFileRetry({folder: DROPBOX_DEFAULT_CONFIG_FOLDER, file: "ignoreLocations.txt"}); 

      if (data === undefined){
        console.log(chalkError("TSS | DROPBOX FILE DOWNLOAD DATA UNDEFINED"
          + " | " + DROPBOX_DEFAULT_CONFIG_FOLDER + "/" + "ignoreLocations.txt"
        ));
        return reject(new Error("DROPBOX FILE DOWNLOAD DATA UNDEFINED"));
      }

      debug(chalkInfo("TSS | DROPBOX IGNORE LOCATIONS FILE\n" + jsonPrint(data)));

      const dataArray = data.toString().toLowerCase().split("\n");

      console.log(chalk.blue("TSS | FILE CONTAINS " + dataArray.length + " IGNORE LOCATIONS "));


      let location;

      dataArray.forEach(function(loc){
        location = loc.trim();
        location = location.replace(/\s|\n/gim, "");
        if (location.length > 1) { 
          ignoreLocationsSet.add(location);
          console.log(chalkLog("WAS | +++ IGNORE LOCATION [" + ignoreLocationsSet.size + "] " + location));
        }
      });

      ignoreLocationsArray = [...ignoreLocationsSet];
      ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
      ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
      ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "gi");

      resolve();

    }
    catch(e){
      console.log(chalkError("TSS | LOAD FILE ERROR\n" + e));
      return reject(e);
    }
      
  });
}


function loadFileRetry(params){

  return new Promise(async function(resolve, reject){

    const resolveOnNotFound = params.resolveOnNotFound || false;
    const maxRetries = params.maxRetries || 5;
    let retryNumber;
    let backOffTime = params.initialBackOffTime || ONE_SECOND;
    const path = params.path || params.folder + "/" + params.file;

    for (retryNumber = 0;retryNumber < maxRetries;retryNumber++) {
      try {
        
        const fileObj = await loadFile(params);

        if (retryNumber > 0) { 
          console.log(chalkAlert(MODULE_ID_PREFIX + " | FILE LOAD RETRY"
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
        setTimeout(function(){
          console.log(chalkAlert(MODULE_ID_PREFIX + " | FILE LOAD ERROR ... RETRY"
            + " | " + path
            + " | BACKOFF: " + msToTime(backOffTime)
            + " | " + retryNumber + " OF " + maxRetries
            + " | ERROR: " + err
          )); 
        }, backOffTime);
      }
    }

    if (resolveOnNotFound) {
      console.log(chalkAlert(MODULE_ID_PREFIX + " | resolve FILE LOAD FAILED | RETRY: " + retryNumber + " OF " + maxRetries));
      return resolve(false);
    }
    console.log(chalkError(MODULE_ID_PREFIX + " | reject FILE LOAD FAILED | RETRY: " + retryNumber + " OF " + maxRetries));
    reject(new Error("FILE LOAD ERROR | RETRIES " + maxRetries));

  });
}

function initialize(cnf){

  return new Promise(async function(resolve, reject){

    console.log(chalkLog("WAS | TSS | INITIALIZE"
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
      const loadedConfigObj = await loadFileRetry({folder: dropboxConfigHostFolder, file: dropboxConfigFile}); 

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

      resolve(cnf);

    }
    catch(err){
      console.error("WAS | TSS | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
      return reject(err);
    }

  });

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
      + " | " + searchTermHashMap.keys().length + " SEARCH TERMS"
    ));

    resolve();

  });

}

let followQueueInterval;
let followQueueReady = false;
const followQueue = [];

function initFollowQueue(params){

  return new Promise(async function(resolve, reject){

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

              if (err.code === 161) {
                followQueue.length = 0;
              }

              const errorType = (err.code === 161) ? "TWITTER_FOLLOW_LIMIT" : "TWITTER_FOLLOW";

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

process.on("message", async function(m) {

  debug(chalkAlert("TSS | RX MESSAGE"
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
        await initAllowLocations(configuration);
        await initIgnoreLocations(configuration);
        await initTwitterUser();
        await initSearchTerms(configuration);
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

      authObj = threeceeUserObj.twitStream.getAuth();

      console.log(chalkLog("TSS | CURRENT AUTH\n" + jsonPrint(authObj)));

      threeceeUserObj.twitStream.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

      authObjNew = threeceeUserObj.twitStream.getAuth();

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

                if (threeceeFollowingInHashMap !== threeceeUserObj.screenName) {

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
                const status = await initSearchTerms(configuration);
                console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUserObj.screenName));
                debug("initSearchTerms status\n" + jsonPrint(status));

                if (!twitterSearchInit) { 
                  await initTwitterSearch(configuration);
                }

                process.send({
                  op: "TWITTER_STATS", 
                  threeceeUser: threeceeUserObj.screenName, 
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

      console.log(chalkInfo("TSS | WAS > UNFOLLOW"
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

      // console.log(chalkInfo("TSS | WAS > UNFOLLOW_ID_ARRAY"
      //   + " | 3C @" + threeceeUserObj.screenName
      //   + " | Q: " + unfollowQueue.length
      //   + " | USER ARRAY " + m.userArray.length
      // ));
    break;

    case "IGNORE":
      console.log(chalkInfo("TSS | WAS > IGNORE"
        + " | 3C @" + threeceeUserObj.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
      ignoreUserSet.add("m.user.userId");
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
        await initIgnoreLocations(configuration);
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
        const status = await initSearchTerms(configuration);
        console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUserObj.screenName));
        debug("initSearchTerms status\n" + jsonPrint(status));

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
    if (err.status !== 404) {
      console.error(chalkError("TSS | *** INIT ERROR\n" + jsonPrint(err)));
      quit();
    }
    console.log(chalkError("WAS | TSS | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
  }

  console.log("WAS | TSS | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");

  try {
    global.globalDbConnection = await connectDb();
    dbConnectionReady = true;
  }
  catch(err){
    dbConnectionReady = false;
    console.log(chalkError("WAS | TSS | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
    quit("MONGO DB CONNECT ERROR");
  }

  dbConnectionReadyInterval = setInterval(async function() {
    if (dbConnectionReady) {
      clearInterval(dbConnectionReadyInterval);
      // await initStatsUpdate(configuration);
    }
    else {
      console.log(chalkInfo("WAS | TSS | WAIT DB CONNECTED ..."));
    }
  }, 1000);

}, 5*ONE_SECOND);


