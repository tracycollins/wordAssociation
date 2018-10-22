/*jslint node: true */
/*jshint sub:true*/
"use strict";

process.title = "wa_node_tss";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threecee";
const USER_SHOW_QUEUE_MAX_LENGTH = 500;

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
require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
const Twit = require("twit");
const moment = require("moment");
// const treeify = require("treeify");
const treeify = require("../libs/treeify");
const TwitterStreamChannels = require("node-tweet-stream");
// const commandLineArgs = require("command-line-args");
const Measured = require("measured");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;

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
const twitterUserHashMap = new HashMap();

const twitterFollowQueue = [];
const userShowQueue = [];

process.on("SIGHUP", function processSigHup() {
  quit("SIGHUP");
});

process.on("SIGINT", function processSigInt() {
  quit("SIGINT");
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
configuration.userShowQueueInterval = ONE_SECOND;
configuration.maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;

configuration.sendMessageTimeout = ONE_SECOND;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initSearchTermsTimeout = 1*ONE_MINUTE;
configuration.initTwitterUsersTimeout = 1*ONE_MINUTE;

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

let statsObj = {};

statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.maxHeap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.queues = {};
statsObj.tweetsReceived = 0;
statsObj.retweetsReceived = 0;
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
mongoose.Promise = global.Promise;

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");

let User;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

let UserServerController;
let userServerController;

let userServerControllerReady = false;

require("isomorphic-fetch");

function connectDb(callback){

  statsObj.status = "CONNECT DB";

  wordAssoDb.connect("TSS_" + process.pid, function(err, db){
    if (err) {
      console.log(chalkError("TSS | *** MONGO DB CONNECTION ERROR: " + err));
      callback(err, null);
      dbConnectionReady = false;
    }
    else {

      db.on("error", function(){
        console.error.bind(console, "TSS | ***  MONGO DB CONNECTION ERROR ***\n");
        console.log(chalkError("TSS | *** MONGO DB CONNECTION ERROR ***\n"));
        db.close();
        dbConnectionReady = false;
      });

      db.on("disconnected", function(){
        console.error.bind(console, "TSS | *** MONGO DB DISCONNECTED ***\n");
        console.log(chalkAlert("TSS | *** MONGO DB DISCONNECTED ***\n"));
        dbConnectionReady = false;
      });


      console.log(chalk.green("TSS | MONGOOSE DEFAULT CONNECTION OPEN"));

      dbConnectionReady = true;

      User = mongoose.model("User", userModel.UserSchema);

      callback(null, db);
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

const dropboxClient = new Dropbox({ accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN });

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

  twitterUserHashMap.forEach(function(twitterUserObj, screenName){
    if (twitterUserObj) {
      statsObj.tweetsPerSecond += twitterUserObj.stats.tweetsPerSecond;
      statsObj.tweetsPerMinute += twitterUserObj.stats.tweetsPerMinute;
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

    twitterUserHashMap.forEach(function(twitterUserObj, screenName){
      if ((screenName === undefined) || !screenName) {
        console.log(chalkError("TSS | TWITTER 3C USER HASHMAP SCREEN_NAME UNDEFINED?"));
        twitterUserHashMap.delete(null);
      }
      else {
        console.log("TSS | @" + screenName
          + " | FOLLOWING USERS: " + twitterUserObj.followUserSet.size
          + " | TRACKING SEARCH TERMS: " + twitterUserObj.searchTermArray.length
          // + "\n" + jsonPrint(twitterUserObj.stats)
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

    twitterUserHashMap.forEach(function(twitterUserObj, screenName){
      console.log(chalkLog("TSS | @" + twitterUserObj.screenName
        + " | FOLLOWING USERS: " + twitterUserObj.followUserSet.size
        + " | TRACKING SEARCH TERMS: " + twitterUserObj.searchTermArray.length
        // + "\n" + jsonPrint(twitterUserObj.stats)
      ));
    });
  }
}

function twitterStopAll(callback){

  const twUsersArray = twitterUserHashMap.keys();

  async.each(twUsersArray, function(screenName, cb){

    twitterUserHashMap.get(screenName).searchStream.stop();
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

  global.dbConnection.close(function () {
    
    console.log(chalkAlert(
      "\nTSS | ==========================\n"
      + "TSS | MONGO DB CONNECTION CLOSED"
      + "\nTSS | ==========================\n"
    ));

    process.exit(exitCode);
  });
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

  let twitterUserObj = {};

  twitterUserObj.stats = {};
  twitterUserObj.stats.ready = false;
  twitterUserObj.stats.error = false;
  twitterUserObj.stats.connected = false;
  twitterUserObj.stats.authenticated = false;
  twitterUserObj.stats.twitterTokenErrorFlag = false;
  twitterUserObj.stats.tweetsReceived = 0;
  twitterUserObj.stats.retweetsReceived = 0;
  twitterUserObj.stats.twitterConnects = 0;
  twitterUserObj.stats.twitterReconnects = 0;
  twitterUserObj.stats.twitterFollowLimit = false;
  twitterUserObj.stats.twitterLimit = 0;
  twitterUserObj.stats.twitterErrors = 0;
  twitterUserObj.stats.rateLimited = false;
  twitterUserObj.stats.tweetsPerSecond = 0;
  twitterUserObj.stats.tweetsPerMinute = 0;

  twitterUserObj.stats.twitterRateLimit = 0;
  twitterUserObj.stats.twitterRateLimitRemaining = 0;
  twitterUserObj.stats.twitterRateLimitResetAt = 0;
  twitterUserObj.stats.twitterRateLimitRemainingTime = 0;
  twitterUserObj.stats.twitterRateLimitExceptionFlag = false;

  twitterUserObj.rateMeter = Measured.createCollection();
  twitterUserObj.rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
  twitterUserObj.rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

  twitterUserObj.trackingNumber = 0;

  twitterUserObj.screenName = params.config.screenName ;
  twitterUserObj.twitterConfig = {} ;
  twitterUserObj.twitterConfig = params.config ;

  const newTwit = new Twit({
    consumer_key: params.config.CONSUMER_KEY,
    consumer_secret: params.config.CONSUMER_SECRET,
    access_token: params.config.TOKEN,
    access_token_secret: params.config.TOKEN_SECRET
  });

  twitterUserObj.twit = {};
  twitterUserObj.twit = newTwit;

  twitterUserObj.searchStream = {};
  twitterUserObj.searchTermArray = [];
  twitterUserObj.followUserSet = new Set();

  console.log(chalkTwitter("TSS | INIT TWITTER USER"
    + " | NAME: " + params.config.screenName
  ));

  const twitGetFriendsParams = {
    screen_name: twitterUserObj.screenName,
    stringify_ids: true
  };

  twitterUserObj.twit.get("friends/ids", twitGetFriendsParams, function(err, data, response) {

    if (err){

      console.log(chalkError("TSS | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
        + " | @" + twitterUserObj.screenName
        + " | " + getTimeStamp()
        + " | CODE: " + err.code
        + " | STATUS CODE: " + err.statusCode
        + " | " + err.message
      ));

      twitterUserObj.stats.error = err;
      twitterUserObj.stats.twitterErrors += 1;
      twitterUserObj.stats.authenticated = false;

      twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

      return callback(err, twitterUserObj);
    }

    twitterUserObj.stats.error = false;
    twitterUserObj.stats.authenticated = true;
    twitterUserObj.stats.twitterTokenErrorFlag = false;

    twitterUserObj.followUserSet = new Set(data.ids);

    console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
      + " | @" + twitterUserObj.screenName
      + " | FOLLOW USER SET SIZE: " + twitterUserObj.followUserSet.size + " FRIENDS"
      + " | DATA IDS: " + data.ids.length + " FRIENDS"
      + " | PREV CURSOR: " + data.previous_cursor_str
      + " | NEXT CURSOR: " + data.next_cursor_str
      + " | data keys: " + Object.keys(data)
    ));

    let userIndex = 0;
    let printString = "";

    async.eachSeries([...twitterUserObj.followUserSet], function(userId, cb){

      userIndex += 1;

      if (configuration.testMode && (userIndex > 100)){
        return cb();
      }

      if (followingUserIdSet.has(userId)){

        twitterUserObj.followUserSet.delete(userId);

        console.log(chalk.black("TSS [ " + userIndex + "/" + twitterUserObj.followUserSet.size + " ]"
          + " XXX UNFOLLOWING"
          + " | 3C @" + twitterUserObj.screenName
          + " | " + userId
        ));

        twitterUserObj.twit.post("friendships/destroy", {user_id: userId}, function(err, data, response) {
          if (err){

            twitterUserObj.stats.error = err;

            if (err.code === 34) {
              console.log(chalk.black("TSS | UNFOLLOW USER NOT FOUND"
                + " | 3C @:" + twitterUserObj.screenName
                + " | CODE: " + err.code
                + " | STATUS CODE: " + err.statusCode
                + " | " + err
              ));
              cb();
            }
            else if (err.code === 261) { //  Application cannot perform write actions
              console.log(chalk.black("TSS | UNFOLLOW ERROR"
                + " | 3C @:" + twitterUserObj.screenName
                + " | CODE: " + err.code
                + " | STATUS CODE: " + err.statusCode
                + " | " + err
              ));
              cb();
            }
            else {
              console.log(chalkError("TSS | *** UNFOLLOW ERROR"
                + " | 3C @:" + twitterUserObj.screenName
                + " | CODE: " + err.code
                + " | STATUS CODE: " + err.statusCode
                + " | " + err
              ));
              cb(err);
            }
          }
          else {
            twitterUserObj.stats.error = false;
            console.log(chalkTwitter("TSS | XXX UNFOLLOWED"
              + " | 3C @" + twitterUserObj.screenName
              + " | FOLLOWING: " + data.following
              + " | @" + data.screen_name
              // + "\n" + jsonPrint(data)
              // + "\n" + jsonPrint(response)
            ));

            setTimeout(function(){
              // delay for twitter
              cb();
            }, 1000);
          }
        });

      }
      else {

        followingUserIdSet.add(userId);

        User.findOne({ userId: userId }, function (err, user) {

          if (err) { 
            console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
            return cb(err);
          }

          if (user) {

            printString = "TSS | [ " + userIndex + "/" + twitterUserObj.followUserSet.size + " ] @" + twitterUserObj.screenName + " | DB HIT";

            printUserObj(printString, user);

            if (!user.following) { 
              user.following = true;
              user.threeceeFollowing = twitterUserObj.screenName;
              user.markModified("following");
              user.markModified("threeceeFollowing");
              user.save(function(err){
                if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                cb();
              });
            }
            else if (user.following && (user.threeceeFollowing > twitterUserObj.screenName)) {
              console.log(chalk.black("TSS | -X- CHANGE 3C FOLLOWING"
                + " | UID: " + user.userId
                + " | @" + user.screenName
                + " | 3C @" + user.threeceeFollowing + " -> " + twitterUserObj.screenName
              ));
              user.threeceeFollowing = twitterUserObj.screenName;
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
      twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);
      process.send({op: "TWITTER_STATS", threeceeUser: twitterUserObj.screenName, twitterFollowing: twitterUserObj.followUserSet.size});
      callback(null, twitterUserObj);
    });

  });
}

function initInfoTwit(params, callback){

  console.log(chalkTwitter("TSS | INIT INFO USER @" + params.screenName));

  const twitterConfigFile = params.screenName + ".json";

  loadFile(configuration.twitterConfigFolder, twitterConfigFile, function(err, twitterConfig){

    if (err){
      console.error(chalkError("TSS | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
      return callback(err, null);
    }

    if (!twitterConfig){
      console.error(chalkError("TSS | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
        + " | " + configuration.twitterConfigFolder + "/" + twitterConfigFile
      ));
      return callback("TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?", null);
    }

    console.log(chalkTwitter("TSS | INFO TWITTER USER CONFIG\n" + jsonPrint(twitterConfig)));

    let twitterUserObj = {};

    twitterUserObj.stats = {};
    twitterUserObj.stats.ready = false;
    twitterUserObj.stats.error = false;
    twitterUserObj.stats.connected = false;
    twitterUserObj.stats.authenticated = false;
    twitterUserObj.stats.twitterTokenErrorFlag = false;
    twitterUserObj.stats.twitterConnects = 0;
    twitterUserObj.stats.twitterReconnects = 0;
    twitterUserObj.stats.twitterFollowLimit = false;
    twitterUserObj.stats.twitterLimit = 0;
    twitterUserObj.stats.twitterErrors = 0;
    twitterUserObj.stats.rateLimited = false;

    twitterUserObj.stats.twitterRateLimit = 0;
    twitterUserObj.stats.twitterRateLimitRemaining = 0;
    twitterUserObj.stats.twitterRateLimitResetAt = 0;
    twitterUserObj.stats.twitterRateLimitRemainingTime = 0;
    twitterUserObj.stats.twitterRateLimitExceptionFlag = false;

    twitterUserObj.screenName = twitterConfig.screenName ;
    twitterUserObj.twitterConfig = {} ;
    twitterUserObj.twitterConfig = twitterConfig ;

    const newTwit = new Twit({
      consumer_key: twitterConfig.CONSUMER_KEY,
      consumer_secret: twitterConfig.CONSUMER_SECRET,
      access_token: twitterConfig.TOKEN,
      access_token_secret: twitterConfig.TOKEN_SECRET
    });

    twitterUserObj.twit = {};
    twitterUserObj.twit = newTwit;

    console.log(chalkTwitter("TSS | INIT INFO TWITTER USER"
      + " | NAME: " + twitterConfig.screenName
    ));

    checkTwitterRateLimit({twitterUserObj: twitterUserObj}, function(err, tuObj){
      if (callback !== undefined) { callback(err, tuObj); }
    });

  });

}

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

        initTwit({config: twitterConfig}, function(err, twitterUserObj){

          if (err){
            console.log(chalkError("TSS | *** TWIT INIT ERROR"
              + " | @" + twitterUserObj.screenName
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
let followingUserIdSet = new Set();

function initFollowingUserIdSet(callback){

  return new Promise(async function(resolve, reject){

    statsObj.numFollowUsers = 0;
    statsObj.numUsersFollowing = 0;

    let query = { "following": true };

    User.countDocuments(query, function (err, count) {
      statsObj.numUsersFollowing = count;
      console.log(chalkAlert("TSS | FOUND FOLLOWING IN DB: " + statsObj.numUsersFollowing + " USERS"));
    });

    const cursor = User.find(query).select({userId:1, screenName:1, lastSeen:1}).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

    cursor.on("data", function(user) {

      statsObj.numFollowUsers += 1;

      if (followingUserIdSet.has(user.userId)) {

        if (configuration.verbose || (statsObj.numFollowUsers % 100 === 0)) {
          console.log(chalkInfo("TSS | U | IN SET "
            + " [ FUS: " + followingUserIdSet.size
            + " | USRs FTCHD: " + statsObj.numFollowUsers + "]"
            + " | @" + user.screenName
            + " | " + user.userId
            + " | LS: " + getTimeStamp(user.lastSeen)
          ));
        }

      }
      else {

        followingUserIdSet.add(user.userId);

        if (configuration.verbose || (statsObj.numFollowUsers % 100 === 0)) {
          console.log(chalk.blue("TSS | U | ADD SET"
            + " [ FUS: " + followingUserIdSet.size
            + " | USRs FTCHD: " + statsObj.numFollowUsers + "]"
            + " | @" + user.screenName
            + " | " + user.userId
            + " | LS: " + getTimeStamp(user.lastSeen)
          ));
        }
      }
    });

    cursor.on("end", function() {
      resolve();
    });

    cursor.on("error", function(err) {
      console.error(chalkError("TSS | *** ERROR initFollowingUserIdSet: " + err));
      reject(err);
    });

    cursor.on("close", function() {
      resolve();
    });

  });
}

let deltaTweetStart = process.hrtime();
let deltaTweet = process.hrtime(deltaTweetStart);

let prevFileModifiedMoment = moment("2010-01-01");

function checkTwitterRateLimit(params, callback){

  let twitterUserObj = params.twitterUserObj;

  if ((twitterUserObj === undefined) || (twitterUserObj.twit === undefined)) {
    return callback(new Error("INVALID PARAMS", params));
  }

  twitterUserObj.twit.get("application/rate_limit_status", {screen_name: twitterUserObj.screenName}, function(err, data, response) {
    
    if (err){

      console.log(chalkError("TSS | *** TWITTER ACCOUNT ERROR"
        + " | @" + twitterUserObj.screenName
        + " | " + getTimeStamp()
        + " | CODE: " + err.code
        + " | STATUS CODE: " + err.statusCode
        + " | " + err.message
      ));

      twitterUserObj.stats.error = err;
      twitterUserObj.stats.twitterErrors += 1;
      twitterUserObj.stats.ready = false;

      callback(err, twitterUserObj);
    }
    else {

      twitterUserObj.stats.error = false;

      if (configuration.verbose) {
        console.log(chalkLog("TSS | TWITTER RATE LIMIT STATUS"
          + " | @" + twitterUserObj.screenName
          + " | LIM: " + twitterUserObj.stats.twitterRateLimit
          + " | REM: " + twitterUserObj.stats.twitterRateLimitRemaining
          + " | RST: " + getTimeStamp(twitterUserObj.stats.twitterRateLimitResetAt)
          + " | NOW: " + moment().format(compactDateTimeFormat)
          + " | IN " + msToTime(twitterUserObj.stats.twitterRateLimitRemainingTime)
        ));
      }

      if (data.resources.users["/users/show/:id"].remaining > 0){


        twitterUserObj.stats.ready = true;

        twitterUserObj.stats.twitterRateLimit = data.resources.users["/users/show/:id"].limit;
        twitterUserObj.stats.twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
        twitterUserObj.stats.twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset).valueOf();
        twitterUserObj.stats.twitterRateLimitRemainingTime = moment(twitterUserObj.stats.twitterRateLimitResetAt).diff(moment());

        if (twitterUserObj.stats.twitterRateLimitExceptionFlag) {

          twitterUserObj.stats.twitterRateLimitExceptionFlag = false;
          
          console.log(chalkInfo("TSS | XXX RESET TWITTER RATE LIMIT"
            + " | @" + twitterUserObj.screenName
            + " | CONTEXT: " + data.rate_limit_context.access_token
            + " | LIM: " + twitterUserObj.stats.twitterRateLimit
            + " | REM: " + twitterUserObj.stats.twitterRateLimitRemaining
            + " | EXP: " + twitterUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
            + " | NOW: " + moment().format(compactDateTimeFormat)
          ));
        }

        callback(null, twitterUserObj);

      }
      else {

        twitterUserObj.stats.ready = false;
        twitterUserObj.stats.twitterRateLimitExceptionFlag = true;

        twitterUserObj.stats.twitterRateLimit = data.resources.users["/users/show/:id"].limit;
        twitterUserObj.stats.twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
        twitterUserObj.stats.twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset).valueOf();
        twitterUserObj.stats.twitterRateLimitRemainingTime = moment(twitterUserObj.stats.twitterRateLimitResetAt).diff(moment());

        console.log(chalkLog("TSS | --- TWITTER RATE LIMIT"
          + " | @" + twitterUserObj.screenName
          + " | CONTEXT: " + data.rate_limit_context.access_token
          + " | LIM: " + twitterUserObj.stats.twitterRateLimit
          + " | REM: " + twitterUserObj.stats.twitterRateLimitRemaining
          + " | EXP: " + twitterUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
          + " | RST: " + moment(twitterUserObj.stats.twitterRateLimitResetAt).format(compactDateTimeFormat)
          + " | NOW: " + moment().format(compactDateTimeFormat)
          + " | IN " + msToTime(twitterUserObj.stats.twitterRateLimitRemainingTime)
        ));

        callback(null, twitterUserObj);

      }

    }
  });
}

function checkTwitterRateLimitAll(callback){
  twitterUserHashMap.forEach(function(twitterUserObj, threeceeUser){
    checkTwitterRateLimit({twitterUserObj: twitterUserObj}, function(err, tuObj){
      if (!err && (tuObj !== undefined)) { twitterUserHashMap.set(tuObj.screenName, tuObj); }
    });
  });
}

let userShowQueueReady = true;
let userShowQueueInterval;

function initUserShowQueueInterval(cnf, callback){

  let user = {};

  console.log(chalkTwitter("TSS | INIT TWITTER USER SHOW QUEUE INTERVAL: " + cnf.userShowQueueInterval));

  clearInterval(userShowQueueInterval);

  userShowQueueInterval = setInterval(function () {

    if (userShowQueueReady && (userShowQueue.length > 0)) {

      userShowQueueReady = false;

      user = userShowQueue.shift();

      follow({user: user, forceFollow: false}, function(err, success){
        userShowQueueReady = true;
      });

    }

  }, cnf.userShowQueueInterval);

  if (callback) { callback(); }
}

function initSearchStream(params, callback){

  let twitterUserObj = params.twitterUserObj;

  let filter = {};
  filter.track = [];
  filter.follow = [];

  if (twitterUserObj.searchTermArray.length > 0) { filter.track = twitterUserObj.searchTermArray; }
  if (twitterUserObj.followUserSet.size > 0) { filter.follow = [...twitterUserObj.followUserSet]; }

  twitterUserObj.searchStream = twitterUserObj.twit.stream("statuses/filter", filter);

  twitterUserObj.searchStream.on("message", function(msg){
    if (msg.event) {
      console.log(chalkAlert("TSS | " + getTimeStamp() 
        + " | TWITTER MESSAGE EVENT: " + msg.event
        + " | @" + twitterUserObj.screenName
        + "\n" + jsonPrint(msg)
      ));
    }
  });

  twitterUserObj.searchStream.on("follow", function(msg){
    console.log(chalkAlert("TSS | " + getTimeStamp() 
      + " | TWITTER FOLLOW EVENT"
      + " | @" + twitterUserObj.screenName
      + "\n" + jsonPrint(msg)
    ));
  });

  twitterUserObj.searchStream.on("unfollow", function(msg){
    console.log(chalkAlert("TSS | " + getTimeStamp() 
      + " | TWITTER UNFOLLOW EVENT"
      + " | @" + twitterUserObj.screenName
      + "\n" + jsonPrint(msg)
    ));
  });

  twitterUserObj.searchStream.on("user_update", function(msg){
    console.log(chalkAlert("TSS | " + getTimeStamp() 
      + " | TWITTER USER UPDATE EVENT"
      + " | @" + twitterUserObj.screenName
      + "\n" + jsonPrint(msg)
    ));
  });

  twitterUserObj.searchStream.on("connect", function(){
    console.log(chalkTwitter("TSS | " + getTimeStamp()
      + " | TWITTER CONNECT"
      + " | @" + twitterUserObj.screenName
    ));
    statsObj.twitterConnects += 1;
    twitterUserObj.stats.connected = true;
    twitterUserObj.stats.twitterConnects += 1;
    twitterUserObj.stats.rateLimited = false;
    twitterUserObj.stats.twitterTokenErrorFlag = false;
    showStats();
  });

  twitterUserObj.searchStream.on("reconnect", function(data){
    console.log(chalkTwitter("TSS | " + getTimeStamp()
      + " | TWITTER RECONNECT"
      + " | @" + twitterUserObj.screenName
    ));

    if (data.type === "rate-limit") {
      twitterUserObj.stats.rateLimited = true;
    }
    else {
      twitterUserObj.stats.rateLimited = false;
    }

    statsObj.twitterReconnects+= 1;

    twitterUserObj.stats.connected = true;
    twitterUserObj.stats.twitterReconnects += 1;
    twitterUserObj.stats.twitterTokenErrorFlag = false;
    showStats();
  });

  twitterUserObj.searchStream.on("disconnect", function(data){
    console.log(chalkAlert("TSS | " + getTimeStamp()
      + " | @" + twitterUserObj.screenName
      + " | !!! TWITTER DISCONNECT\n" + jsonPrint(data)
    ));
    statsObj.twitterDisconnects+= 1;
    twitterUserObj.stats.connected = false;
    twitterUserObj.stats.twitterReconnects = 0;
    twitterUserObj.stats.rateLimited = false;
    twitterUserObj.stats.twitterTokenErrorFlag = false;
    showStats();
  });

  twitterUserObj.searchStream.on("warning", function(data){
    console.log(chalkAlert("TSS | " + getTimeStamp() + " | !!! TWITTER WARNING: " + jsonPrint(data)));
    statsObj.twitterWarnings+= 1;
    showStats();
  });

  twitterUserObj.searchStream.on("direct_message", function (message) {
    console.log(chalkTwitter("TSS | R< TWITTER DIRECT MESSAGE"
      + " | @" + twitterUserObj.screenName
      + " | " + message.direct_message.sender_screen_name
      + "\n" + message.direct_message.text
    ));
    showStats();
  });

  twitterUserObj.searchStream.on("scrub_geo", function(data){
    console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER SCRUB GEO: " + jsonPrint(data)));
    statsObj.twitterScrubGeo+= 1;
    showStats();
  });

  twitterUserObj.searchStream.on("status_withheld", function(data){
    console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER STATUS WITHHELD: " + jsonPrint(data)));
    statsObj.twitterStatusWithheld+= 1;
    showStats();
  });

  twitterUserObj.searchStream.on("user_withheld", function(data){
    console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER USER WITHHELD: " + jsonPrint(data)));
    statsObj.twitterUserWithheld+= 1;
    showStats();
  });

  twitterUserObj.searchStream.on("limit", function(limitMessage){

    statsObj.twitterLimit += limitMessage.limit.track;
    twitterUserObj.stats.twitterLimit += limitMessage.limit.track;

    if (statsObj.twitterLimit > statsObj.twitterLimitMax) {
      statsObj.twitterLimitMax = statsObj.twitterLimit;
      statsObj.twitterLimitMaxTime = moment().valueOf();
    }

    debug(chalkTwitter("TSS | " + getTimeStamp()
      + " | TWITTER LIMIT" 
      + " | @" + twitterUserObj.screenName
      + " | USER LIMIT: " + statsObj.twitterLimit
      + " | TOTAL LIMIT: " + twitterUserObj.stats.twitterLimit
    ));
  });

  twitterUserObj.searchStream.on("error", function(err){
    console.log(chalkError("TSS | " + getTimeStamp()
      + " | @" + twitterUserObj.screenName
      + " | *** TWITTER ERROR: " + err
    ));
    statsObj.twitterErrors += 1;
    twitterUserObj.stats.twitterErrors += 1;

    if (err.statusCode === 401) {
      process.send({op: "ERROR", threeceeUser: twitterUserObj.screenName, errorType: "TWITTER_UNAUTHORIZED", error: err});
    }
    else {
      process.send({op: "ERROR", threeceeUser: twitterUserObj.screenName, errorType: "TWITTER", error: err});
    }

    showStats();
  });
  
  twitterUserObj.searchStream.on("parser-error", function(err){
    console.log(chalkError("TSS | " + getTimeStamp()
      + " | @" + twitterUserObj.screenName
      + " | *** TWITTER PARSER ERROR: " + err
    ));
    statsObj.twitterErrors += 1;
    twitterUserObj.stats.twitterErrors += 1;

    process.send({op: "ERROR", threeceeUser: twitterUserObj.screenName, errorType: "TWITTER_PARSER", error: err});

    showStats();
  });
  
  twitterUserObj.searchStream.on("tweet", function(tweetStatus){

    tweetStatus.entities.media = [];
    tweetStatus.entities.polls = [];
    tweetStatus.entities.symbols = [];
    tweetStatus.entities.urls = [];

    deltaTweet = process.hrtime(deltaTweetStart);
    if (deltaTweet[0] > 0) { 
      console.log(chalkAlert("TSS | *** TWEET RX DELTA"
        + " | @" + twitterUserObj.screenName
        + " | " + deltaTweet[0] + "." + deltaTweet[1]
      ));
    }
    deltaTweetStart = process.hrtime();

    twitterUserObj.stats.rateLimited = false;

    twitterStats.meter("tweetsPerSecond").mark();
    twitterStats.meter("tweetsPerMinute").mark();

    twitterUserObj.rateMeter.meter("tweetsPerSecond").mark();
    twitterUserObj.rateMeter.meter("tweetsPerMinute").mark();

    twitterUserObj.stats.tweetsPerSecond = twitterUserObj.rateMeter.toJSON().tweetsPerSecond["1MinuteRate"];
    twitterUserObj.stats.tweetsPerMinute = twitterUserObj.rateMeter.toJSON().tweetsPerMinute["1MinuteRate"];

    statsObj.tweetsReceived+= 1 ;
    twitterUserObj.stats.tweetsReceived += 1;

    if (tweetStatus.retweeted_status) {
      statsObj.retweetsReceived += 1;
      twitterUserObj.stats.retweetsReceived += 1;
    }

    if (tweetQueue.length < configuration.maxTweetQueue ) {
      tweetQueue.push(tweetStatus);
    }

    if ((twitterUserObj.stats.tweetsReceived % 500 === 0) || (statsObj.tweetsReceived % 500 === 0)) {
      console.log(chalkTwitter("TSS | <T | "+ getTimeStamp()
        + " | TWQ: " + tweetQueue.length
        + " [ TOTAL Ts/RTs: " + statsObj.tweetsReceived + "/" + statsObj.retweetsReceived + "]"
        + " | 3C @" + twitterUserObj.screenName
        + " [ Ts/RTs: " + twitterUserObj.stats.tweetsReceived + "/" + twitterUserObj.stats.retweetsReceived + "]"
        + " | " + statsObj.tweetsPerMinute.toFixed(3) + " TPM"
        + " | " + tweetStatus.id_str
        + " | @" + tweetStatus.user.screen_name
        + " | " + tweetStatus.user.name
        + " | " + tweetStatus.user.id_str
      ));
    }

    statsObj.queues.tweetQueue = tweetQueue.length;
  });

  callback(null, twitterUserObj);
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

        const twUsersArray = twitterUserHashMap.keys();

        async.eachSeries(twUsersArray, function(screenName, cb){

          let twitterUserObj = twitterUserHashMap.get(screenName);

          async.whilst( 
            function(){ 
              return ((twitterUserObj.searchTermArray.length < TWITTER_MAX_TRACKING_NUMBER)
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

                twitterUserObj.searchTermArray.push(searchTerm);
                searchTermHashMap.set(searchTerm, screenName);

                console.log(chalkInfo("TSS | +++ TRACK"
                  + " | @" + screenName
                  + " | TRACKING: " + twitterUserObj.searchTermArray.length 
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

              initSearchStream({twitterUserObj: twitterUserObj}, function(err, tuObj){

                console.log(chalkInfo("TSS | END TRACK USER"
                  + " | @" + tuObj.screenName
                ));

                twitterUserHashMap.set(tuObj.screenName, tuObj);

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

let deltaTxTweetStart = process.hrtime();
let deltaTxTweet = process.hrtime(deltaTxTweetStart);

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

      deltaTxTweet = process.hrtime(deltaTxTweetStart);
      if (deltaTxTweet[0] > 0) { 
        console.log(chalkAlert("TSS | *** TWEET TX DELTA: " + deltaTxTweet[0] + "." + deltaTxTweet[1]));
      }
      deltaTxTweetStart = process.hrtime();

      tweetStatus = tweetQueue.shift();

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

      }
      else {

        tweetSendReady = true;

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

function follow(params, callback) {

  const twUsersArray = twitterUserHashMap.keys();

  async.eachSeries(twUsersArray, function(screenName, cb){

    let twitterUserObj = twitterUserHashMap.get(screenName);

    console.log(chalkInfo("TSS | CHECK FOLLOW | 3C @" + twitterUserObj.screenName + " | @" + params.user.screenName));

    if (twitterUserObj.stats.twitterTokenErrorFlag) {
      console.log(chalkAlert("TSS | SKIP FOLLOW | TOKEN ERROR FLAG | 3C @" + twitterUserObj.screenName));
      cb();
    }
    else if ( (params.forceFollow && (twitterUserObj.followUserSet.size < 5000))
      || ( configuration.forceFollow && (twitterUserObj.followUserSet.size < 5000))
      || ((twitterUserObj.followUserSet.size < 5000) && !twitterUserObj.followUserSet.has(params.user.userId))
    ){

      if (!twitterUserObj.followUserSet.has(params.user.userId)) {
        twitterUserObj.followUserSet.add(params.user.userId);
      }

      twitterUserObj.twit.post("friendships/create", {screen_name: params.user.screenName}, function(err, data, response) {
        if (err) {
    
          twitterUserObj.stats.error = err;
          twitterUserObj.stats.twitterErrors += 1;

          if (data.errors[0].code !== undefined) { 

            if (data.errors[0].code === 89) {

              console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | TOKEN ERROR (CODE 89)"
                + " | 3C @" + screenName
                + " | FOLLOW @" + params.user.screenName
                + " | " + err
              ));

              process.send({op: "ERROR", threeceeUser: twitterUserObj.screenName, errorType: "TWITTER_TOKEN", error: data.errors[0]});
              twitterUserObj.stats.twitterTokenErrorFlag = true;
              return cb();
            }

            if (data.errors[0].code === 261) {

              console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | TOKEN ERROR (CODE 261)"
                + " | 3C @" + screenName
                + " | FOLLOW @" + params.user.screenName
                + " | " + err
              ));

              process.send({op: "ERROR", threeceeUser: twitterUserObj.screenName, errorType: "TWITTER_TOKEN", error: data.errors[0]});
              twitterUserObj.stats.twitterTokenErrorFlag = true;
              return cb();
            }

            if (data.errors[0].code === 161) {

              twitterUserObj.stats.twitterFollowLimit = moment().valueOf();

              console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | FOLLOW LIMIT (CODE 161)"
                + " | 3C @" + screenName
                + " | FOLLOW @" + params.user.screenName
                + " | " + err
              ));
              
              process.send({
                op: "FOLLOW_LIMIT", 
                threeceeUser: twitterUserObj.screenName, 
                twitterFollowLimit: twitterUserObj.stats.twitterFollowLimit,
                twitterFollowing: twitterUserObj.followUserSet.size
              });

              return cb();
            }
          }

          twitterUserObj.followUserSet.delete(params.user.userId);

          twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

          console.log(chalkError("TSS | *** ERROR FRIENDSHIP CREATE | ERROR (CODE " + data.errors[0].code + ")"
            + " | 3C @" + screenName
            + " | FOLLOW @" + params.user.screenName
            + " | " + err
          ));

          return cb();
        }

        twitterUserObj.stats.error = false;

        console.log(chalkAlert("TSS | +++ FOLLOW"
          + " | 3C @" + twitterUserObj.screenName
          + " | FOLLOWING: " + twitterUserObj.followUserSet.size 
          + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
          + " | UID: " + params.user.userId
          + " | @" + params.user.screenName
        ));

        params.user.following = true;
        params.user.threeceeFollowing = twitterUserObj.screenName;

        userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

          if (err) {
            console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
          }
          else {
            const printString = "TSS | @" + updatedUser.screenName + " | DB USER UPDATED";
            printUserObj(printString, updatedUser);
          }

          let filter = {};
          filter.track = [];
          filter.follow = [];

          if (twitterUserObj.searchTermArray.length > 0) { filter.track = twitterUserObj.searchTermArray; }
          if (twitterUserObj.followUserSet.size > 0) { filter.follow = [...twitterUserObj.followUserSet]; }

          twitterUserObj.searchStream = twitterUserObj.twit.stream("statuses/filter", filter);

          twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

          process.send({op: "TWITTER_STATS", threeceeUser: twitterUserObj.screenName, twitterFollowing: twitterUserObj.followUserSet.size});

          cb(true);


        });

      });
    }
    else {

      console.log(chalkInfo("TSS | ... SKIP FOLLOW"
        + " | @" + params.user.screenName
        + " | FOLLOWING: " + twitterUserObj.followUserSet.size 
        + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
        + " | UID: " + params.user.userId
      ));

      process.send({op: "TWITTER_STATS", threeceeUser: twitterUserObj.screenName, twitterFollowing: twitterUserObj.followUserSet.size});
      cb();
    }

  },
  function(success){
    if (success) {
      console.log(chalkError("TSS | FOLLOW SUCCESS"
      ));
    }
    callback(null, success);
  });
}

function unfollow(params, callback) {

  const twUsersArray = twitterUserHashMap.keys();

  async.eachSeries(twUsersArray, function(screenName, cb){

    let twitterUserObj = twitterUserHashMap.get(screenName);

    console.log(chalkInfo("TSS | CHECK UNFOLLOW | 3C @" + twitterUserObj.screenName + " | @" + params.user.screenName));

    if (twitterUserObj.stats.twitterTokenErrorFlag) {
      console.log(chalkAlert("TSS | SKIP FOLLOW | TOKEN ERROR FLAG | 3C @" + twitterUserObj.screenName));
      cb();
    }
    else {

      if (twitterUserObj.followUserSet.has(params.user.userId)) {
        twitterUserObj.followUserSet.delete(params.user.userId);
      }

      twitterUserObj.twit.post("friendships/destroy", {user_id: params.user.userId}, function(err, data, response) {
        if (err) {
    
          twitterUserObj.stats.error = err;
          twitterUserObj.stats.twitterErrors += 1;

          if (data.errors[0].code !== undefined) { 

            if (data.errors[0].code === 89) {
              process.send({op: "ERROR", threeceeUser: twitterUserObj.screenName, errorType: "TWITTER_TOKEN", error: data.errors[0]});
              twitterUserObj.stats.twitterTokenErrorFlag = true;
              return cb();
            }

            console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));
            return cb();
          }

          twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

          console.log(chalkError("TSS | *** ERROR FRIENDSHIP DESTROY: " + err));

          return cb();
        }

        twitterUserObj.stats.error = false;

        console.log(chalkAlert("TSS | XXX UNFOLLOW"
          + " | 3C @" + twitterUserObj.screenName
          + " | FOLLOWING: " + twitterUserObj.followUserSet.size 
          + "/" + TWITTER_MAX_FOLLOW_USER_NUMBER + " MAX"
          + " | UID: " + params.user.userId
          + " | @" + params.user.screenName
        ));

        params.user.following = false;
        params.user.threeceeFollowing = false;

        userServerController.findOneUser(params.user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){

          if (err) {
            console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
          }
          else {
            const printString = "TSS | @" + updatedUser.screenName + " | UNFOLLOW DB USER UPDATED";
            printUserObj(printString, updatedUser);
          }

          let filter = {};
          filter.track = [];
          filter.follow = [];

          if (twitterUserObj.searchTermArray.length > 0) { filter.track = twitterUserObj.searchTermArray; }
          if (twitterUserObj.followUserSet.size > 0) { filter.follow = [...twitterUserObj.followUserSet]; }

          twitterUserObj.searchStream = twitterUserObj.twit.stream("statuses/filter", filter);

          twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

          process.send({op: "TWITTER_STATS", threeceeUser: twitterUserObj.screenName, twitterFollowing: twitterUserObj.followUserSet.size});

          cb(true);

        });

      });
    }

  },
  function(success){
    if (success) {
      console.log(chalkError("TSS | UNFOLLOW SUCCESS"
      ));
    }
    callback(null, success);
  });
}

process.on("message", function(m) {

  debug(chalkAlert("TSS | RX MESSAGE"
    + " | OP: " + m.op
  ));

  switch (m.op) {

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

      let twitterUserObj = twitterUserHashMap.get(m.user.screenName);

      if (twitterUserObj !== undefined) {

        const authObj = twitterUserObj.twit.getAuth();

        console.log(chalkAlert("TSS | CURRENT AUTH\n" + jsonPrint(authObj)));

        twitterUserObj.twit.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

        const authObjNew = twitterUserObj.twit.getAuth();

        twitterUserObj.twitterConfig.access_token = authObjNew.access_token;
        twitterUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
        twitterUserObj.twitterConfig.TOKEN = authObjNew.access_token;
        twitterUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

        console.log(chalkError("TSS | UPDATED AUTH\n" + jsonPrint(authObjNew)));

        const twitterConfigFile = twitterUserObj.screenName + ".json";

        saveFile(configuration.twitterConfigFolder, twitterConfigFile, twitterUserObj.twitterConfig, function(){
          console.log(chalkLog("TSS | SAVED UPDATED AUTH " + configuration.twitterConfigFolder + "/" + twitterConfigFile));

          twitterUserObj.stats.connected = true;
          twitterUserObj.stats.twitterFollowLimit = false;

          const twitGetFriendsParams = {
            screen_name: twitterUserObj.screenName,
            stringify_ids: true
          };

          twitterUserObj.twit.get("friends/ids", twitGetFriendsParams, function(err, data, response) {

            if (err){

              console.log(chalkError("TSS | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
                + " | @" + twitterUserObj.screenName
                + " | " + getTimeStamp()
                + " | CODE: " + err.code
                + " | STATUS CODE: " + err.statusCode
                + " | " + err.message
              ));

              twitterUserObj.stats.twitterErrors += 1;
              twitterUserObj.stats.authenticated = false;
              twitterUserObj.stats.error = err;

              twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

            }
            else {

              twitterUserObj.stats.error = false;
              twitterUserObj.stats.authenticated = true;
              twitterUserObj.followUserSet = new Set(data.ids);

              console.log(chalkError("TSS | TWITTER GET FRIENDS IDS"
                + " | @" + twitterUserObj.screenName
                + " | " + twitterUserObj.followUserSet.size + " FRIENDS"
              ));

              twitterUserHashMap.set(twitterUserObj.screenName, twitterUserObj);

              let userIndex = 0;
              let printString = "";

              async.eachSeries([...twitterUserObj.followUserSet], function(userId, cb){

                userIndex += 1;

                followingUserIdSet.add(userId);

                User.findOne({ userId: userId }, function (err, user) {

                  if (err) { 
                    console.log(chalkAlert("TSS | *** USER DB ERROR *** | " + err));
                    return cb(err);
                  }

                  if (user) {

                    printString = "TSS | [ " + userIndex + "/" + twitterUserObj.followUserSet.size + " ] @" + twitterUserObj.screenName + " | DB HIT";

                    printUserObj(printString, user);

                    if (!user.following) {
                      user.following = true;
                      user.threeceeFollowing = twitterUserObj.screenName;
                      user.markModified("following");
                      user.markModified("threeceeFollowing");
                      user.save(function(err){
                        if (err) { console.log(chalkError("TSS | *** USER DB SAVE ERROR: " + err)); }
                        cb();
                      });
                    }
                    else if (user.following && (user.threeceeFollowing > twitterUserObj.screenName)) {
                      console.log(chalk.black("TSS | -X- CHANGE 3C FOLLOWING"
                        + " | UID: " + user.userId
                        + " | @" + user.screenName
                        + " | 3C @" + user.threeceeFollowing + " -> " + twitterUserObj.screenName
                      ));
                      user.threeceeFollowing = twitterUserObj.screenName;
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
                    console.log(chalkLog("TSS | [ " + userIndex + "/" + twitterUserObj.followUserSet.size + " ]"
                      + " @" + twitterUserObj.screenName 
                      + " | DB USER MISS  | UID: " + userId
                    ));
                    cb();
                  }
                });

              }, function(err){

                let filter = {};
                filter.track = [];
                filter.follow = [];

                if (twitterUserObj.searchTermArray.length > 0) { filter.track = twitterUserObj.searchTermArray; }
                if (twitterUserObj.followUserSet.size > 0) { filter.follow = [...twitterUserObj.followUserSet]; }

                initSearchStream({twitterUserObj: twitterUserObj}, function(err, tuObj){

                  console.log(chalkInfo("TSS | END USER_AUTHENTICATED"
                    + " | @" + tuObj.screenName
                  ));

                  twitterUserHashMap.set(tuObj.screenName, tuObj);
                  process.send({op: "TWITTER_STATS", threeceeUser: twitterUserObj.screenName, twitterFollowing: twitterUserObj.followUserSet.size});

                });

              });

            }

          });
        });

      }
    break;

    case "USER_SHOW":

      if (!userShowQueue.includes(m.user.userId) && (userShowQueue.length < USER_SHOW_QUEUE_MAX_LENGTH)) {

        userShowQueue.push(m.user);

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
      }
    break;

    case "FOLLOW":
      console.log(chalkInfo("TSS | FOLLOW"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
        + " | FORCE FOLLOW: " + m.forceFollow
      ));

      if (m.forceFollow !== undefined) { configuration.forceFollow = m.forceFollow; }

      follow(m, function(err, success){
      });
    break;

    case "UNFOLLOW":
      console.log(chalkInfo("TSS | UNFOLLOW"
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));

      unfollow(m, function(err, success){
      });

    break;

    case "UPDATE_SEARCH_TERMS":
      console.log(chalkAlert("TSS | UPDATE SEARCH TERMS"));

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
        process.send({ op: "PONG", pongId: m.pingId });
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

      global.dbConnection = db;

      UserServerController = require("@threeceelabs/user-server-controller");
      userServerController = new UserServerController("TSS_USC");

      userServerControllerReady = false;

      userServerController.on("ready", function(appname){
        userServerControllerReady = true;
        console.log(chalkAlert("TSS | USC READY | " + appname));
      });

      User = mongoose.model("User", userModel.UserSchema);

      dbConnectionReady = true;
    });

    dbConnectionReadyInterval = setInterval(function() {

      if (dbConnectionReady) {

        clearInterval(dbConnectionReadyInterval);

      }
      else {
        console.log(chalkAlert("TSS | WAIT DB CONNECTED ..."));
      }
    }, 1000);

    initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER}, function(err, ituObj){
      infoTwitterUserObj = ituObj;
      initUserShowQueueInterval(configuration);
    });

    initTwitterUsers(configuration, function(err){
      if (err){
        console.log(chalkError("TSS | ERROR initTwitterUsers\n" + err));
      }
      
      console.log(chalkTwitter("TSS | TWITTER USER HASH MAP ENTRIES"
        + " | " + twitterUserHashMap.keys()
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


