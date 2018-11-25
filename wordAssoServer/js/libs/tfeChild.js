/*jslint node: true */
/*jshint sub:true*/
"use strict";

process.title = "wa_node_child_tfe";

const DEFAULT_WORD_MIN_LENGTH = 3;
const DEFAULT_INPUT_TYPES = [
  "emoji", 
  "hashtags",  
  "images", 
  "locations", 
  "media", 
  "mentions", 
  "places", 
  "sentiment", 
  "urls", 
  "userMentions", 
  "words"
];

DEFAULT_INPUT_TYPES.sort();

let maxInputHashMap = {};
let normalization = {};
let globalHistograms = {};

let langAnalyzer; // undefined for now

const fieldsTransmit = {
  category: 1,
  categoryAuto: 1,
  description: 1,
  followersCount: 1,
  following: 1,
  friendsCount: 1,
  ignored: 1,
  isTopTerm: 1,
  lastTweetId: 1,
  location: 1,
  mentions: 1,
  name: 1,
  nodeId: 1,
  nodeType: 1,
  previousDescription: 1,
  previousName: 1,
  rate: 1,
  screenName: 1,
  screenNameLower: 1,
  status: 1,
  statusesCount: 1,
  statusId: 1,
  threeceeFollowing: 1,
  userId: 1
};

// const fieldsTransmitKeys = Object.keys(fieldsTransmit);

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threecee";
const USER_CAT_QUEUE_MAX_LENGTH = 500;

const MAX_READY_ACK_WAIT_COUNT = 10;

const ONE_SECOND = 1000 ;
const ONE_MINUTE = ONE_SECOND*60 ;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const fieldsExclude = {
  histograms: 0,
  countHistory: 0,
  friends: 0
};

let defaultUserTweetHistograms = {};
let defaultUserProfileHistograms = {};

DEFAULT_INPUT_TYPES.forEach(function(type){

  defaultUserTweetHistograms[type] = {};
  defaultUserProfileHistograms[type] = {};

});

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

// const mergeHistograms = require("./mergeHistograms");
const MergeHistograms = require("@threeceelabs/mergehistograms");
const mergeHistograms = new MergeHistograms();

const twitterTextParser = require("@threeceelabs/twitter-text-parser");
const twitterImageParser = require("@threeceelabs/twitter-image-parser");

const _ = require("lodash");
const S = require("string");
const util = require("util");
const fetchDropbox = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
const Twit = require("twit");
const moment = require("moment");
const treeify = require("../libs/treeify");
const Measured = require("measured");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const neataptic = require("neataptic");
const networksHashMap = new HashMap();
const arrayNormalize = require("array-normalize");

const debug = require("debug")("tfe");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkGreen = chalk.green;
const chalkRed = chalk.red;
const chalkRedBold = chalk.bold.red;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.yellow;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkConnect = chalk.green;

const twitterUserHashMap = new HashMap();

const userCategorizeQueue = [];
const userChangeDbQueue = [];

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

let stdin;

let configuration = {};
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.forceImageAnalysis = false;
configuration.testMode = false; // per tweet test mode
configuration.userCategorizeQueueInterval = ONE_SECOND;
configuration.userChangeDbQueueInterval = 10;
configuration.enableImageAnalysis = false;

configuration.enableLanguageAnalysis = false;
configuration.forceLanguageAnalysis = false;

configuration.inputTypes = DEFAULT_INPUT_TYPES;
configuration.sendMessageTimeout = ONE_SECOND;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
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
  "\n\n====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID:    " + process.pid 
  + "\nPROCESS TITLE: " + process.title 
  + "\n" + "====================================================================================================\n" 
);


if (debug.enabled) {
  console.log("*** TFE\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
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

statsObj.user = {};
statsObj.user.changes = 0;

statsObj.queues = {};
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

statsObj.analyzer = {};
statsObj.analyzer.total = 0;
statsObj.analyzer.analyzed = 0;
statsObj.analyzer.skipped = 0;
statsObj.analyzer.errors = 0;

global.dbConnection = false;
const mongoose = require("mongoose");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");

const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const networkInputsModel = require("@threeceelabs/mongoose-twitter/models/networkInputs.server.model");

let User;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

let UserServerController;
let userServerController;

let userServerControllerReady = false;

function connectDb(callback){

  statsObj.status = "CONNECT DB";

  wordAssoDb.connect("TFE_" + process.pid, function(err, db){
    if (err) {
      console.log(chalkError("TFE | *** MONGO DB CONNECTION ERROR: " + err));
      callback(err, null);
      dbConnectionReady = false;
    }
    else {

      db.on("error", function(){
        console.error.bind(console, "TFE | *** MONGO DB CONNECTION ERROR ***\n");
        console.log(chalkError("TFE | *** MONGO DB CONNECTION ERROR ***\n"));
        db.close();
        dbConnectionReady = false;
      });

      db.on("disconnected", function(){
        console.error.bind(console, "TFE | MONGO DB DISCONNECTED\n");
        console.log(chalkAlert("TFE | MONGO DB DISCONNECTED\n"));
        dbConnectionReady = false;
      });


      console.log(chalk.green("TFE | MONGOOSE DEFAULT CONNECTION OPEN"));

      dbConnectionReady = true;

      User = mongoose.model("User", userModel.UserSchema);

      initDbUserChangeStream({db: db})
        .then(function(){
          callback(null, db);
        })
        .catch(function(err){
          console.log(chalkError("TFE | *** INIT DB CHANGE STREAM ERROR: " + err));
          callback(err, null);
        });

    }
  });
}


// ==================================================================
// DROPBOX
// ==================================================================

const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
const DROPBOX_TFE_CONFIG_FILE = process.env.DROPBOX_TFE_CONFIG_FILE || "twitterFollowerExplorerConfig.json";
const DROPBOX_TFE_STATS_FILE = process.env.DROPBOX_TFE_STATS_FILE || "twitterFollowerExplorerStats.json";

const dropboxConfigFolder = "/config/utility";
const dropboxConfigHostFolder = "/config/utility/" + hostname;

const dropboxConfigFile = hostname + "_" + DROPBOX_TFE_CONFIG_FILE;
const statsFolder = "/stats/" + hostname + "/followerExplorer";
const statsFile = DROPBOX_TFE_STATS_FILE;

console.log("TFE | DROPBOX_TFE_CONFIG_FILE: " + DROPBOX_TFE_CONFIG_FILE);
console.log("TFE | DROPBOX_TFE_STATS_FILE : " + DROPBOX_TFE_STATS_FILE);

debug("TFE | dropboxConfigFolder : " + dropboxConfigFolder);
debug("TFE | dropboxConfigFile : " + dropboxConfigFile);

debug("TFE | statsFolder : " + statsFolder);
debug("TFE | statsFile : " + statsFile);

const dropboxClient = new Dropbox({ 
  accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  fetch: fetchDropbox
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
    console.log(chalkAlert("TFE | *** getTimeStamp INVALID DATE: " + inputTime));
    return null;
  }
}

function showStats(options){

  statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
  statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options) {
    console.log("TFE | STATS\n" + jsonPrint(statsObj));
  }
  else {
    console.log(chalkLog("TFE | S"
      + " | ELPSD " + msToTime(statsObj.elapsed)
      + " | START " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
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

  console.error("TFE | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TFE CHILD: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if ((global.dbConnection !== undefined) && (global.dbConnection.readyState > 0)) {

    global.dbConnection.close(function () {
      
      console.log(chalkAlert(
        "\nTFE | ==========================\n"
        + "TFE | MONGO DB CONNECTION CLOSED"
        + "\nTFE | ==========================\n"
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

  debug(chalkInfo("TFE | SAVE FOLDER " + path));
  debug(chalkInfo("TFE | SAVE FILE " + file));
  debug(chalkInfo("TFE | FULL PATH " + fullPath));

  let options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("TFE | ... SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      console.error(chalkError("TFE | " + moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + "\nTFE | ERROR: ", error
      ));
      callback(error.error, null);
    });
}

function loadFile(path, file, callback) {

  console.log(chalkInfo("TFE | LOAD FOLDER " + path));
  console.log(chalkInfo("TFE | LOAD FILE " + file));
  console.log(chalkInfo("TFE | FULL PATH " + path + "/" + file));

  dropboxClient.filesDownload({path: path + "/" + file})
    .then(function(data) {
      console.log(chalkLog("TFE | " + getTimeStamp()
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
      console.log(chalkLog("TFE | *** DROPBOX loadFile ERROR: " + file + " | " + error));
      console.log(chalkLog("TFE | *** DROPBOX READ " + file + " ERROR"));

      if ((error.response.status === 404) || (error.response.status === 409)) {
        console.error(chalkLog("TFE | *** DROPBOX READ FILE " + file + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return(callback(null, null));
      }
      if (error.status === 0) {
        console.error(chalkLog("TFE | *** DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      console.log(chalkError(jsonPrint(error)));
      return(callback(error, null));
    })
    .catch(function(err) {
      console.log(chalkLog("TFE | *** ERROR DROPBOX LOAD FILE\n" + err));
      callback(err, null);
    });
}

function initStatsUpdate(cnf, callback){

  console.log(chalkInfo("TFE | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

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

function printUserObj(title, user, chalkConfig) {

  let curChalk = chalkConfig || chalkLog;

  user = userDefaults(user);

  console.log(curChalk(title
    + " | UID: " + user.userId
    + " | @" + user.screenName
    + " | N: " + user.name 
    + " | LANG: " + user.lang 
    + " | FLWRs: " + user.followersCount
    + " | FRNDs: " + user.friendsCount
    + " | Ts: " + user.statusesCount
    + " | Ms:  " + user.mentions
    + " | LS: " + getTimeStamp(user.lastSeen)
    + " | IGNRD: " + user.ignored 
    + " | FLWg: " + user.following 
    + " | 3C: @" + user.threeceeFollowing 
    + " | CAT M: " + user.category + " - A: " + user.categoryAuto
  ));

  if (user.changes) {
    console.log(curChalk(title
    + "\nCHANGES\n" + jsonPrint(user.changes)
    ));
  }
}

const userDefaults = function (user){

  if (!user.profileHistograms || user.profileHistograms === undefined) { 
    user.profileHistograms = defaultUserProfileHistograms;
  }
  
  if (!user.tweetHistograms || user.tweetHistograms === undefined) { 
    user.tweetHistograms = defaultUserTweetHistograms;
  }
  
  return user;
};


function initInfoTwit(params, callback){

  console.log(chalkTwitter("TFE | INIT INFO USER @" + params.screenName));

  const twitterConfigFile = params.screenName + ".json";

  loadFile(configuration.twitterConfigFolder, twitterConfigFile, function(err, twitterConfig){

    if (err){
      console.error(chalkLog("TFE | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
      return callback(err, null);
    }

    if (!twitterConfig){
      console.error(chalkLog("TFE | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
        + " | " + configuration.twitterConfigFolder + "/" + twitterConfigFile
      ));
      return callback("TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?", null);
    }

    console.log(chalkTwitter("TFE | INFO TWITTER USER CONFIG\n" + jsonPrint(twitterConfig)));

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

    console.log(chalkTwitter("TFE | INIT INFO TWITTER USER"
      + " | NAME: " + twitterConfig.screenName
    ));

    checkTwitterRateLimit({twitterUserObj: twitterUserObj}, function(err, tuObj){
      if (callback !== undefined) { callback(err, tuObj); }
    });

  });
}

function getFileMetadata(path, file, callback) {

  const fullPath = path + "/" + file;
  debug(chalkInfo("TFE | FOLDER " + path));
  debug(chalkInfo("TFE | FILE " + file));
  console.log(chalkInfo("TFE | getFileMetadata FULL PATH: " + fullPath));

  dropboxClient.filesGetMetadata({path: fullPath})
    .then(function(response) {
      debug(chalkInfo("TFE | FILE META\n" + jsonPrint(response)));
      return(callback(null, response));
    })
    .catch(function(error) {
      console.log(chalkLog("TFE | GET FILE METADATA ERROR: " + error));
      console.log(chalkLog("TFE | GET FILE METADATA ERROR\n" + jsonPrint(error)));
      return(callback(error, null));
    });
}

const MAX_FOLLOW_USER_IDS = 5000;
let followingUserIdSet = new Set();

function initFollowingUserIdSet(callback){

  return new Promise(function(resolve, reject){

    statsObj.numFollowUsers = 0;
    statsObj.numUsersFollowing = 0;

    let query = { "following": true };

    User.countDocuments(query, function (err, count) {
      statsObj.numUsersFollowing = count;
      console.log(chalkLog("TFE | FOUND FOLLOWING IN DB: " + statsObj.numUsersFollowing + " USERS"));
    });

    const cursor = User.find(query).select({userId:1, screenName:1, lastSeen:1}).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

    cursor.on("data", function(user) {

      statsObj.numFollowUsers += 1;

      if (followingUserIdSet.has(user.userId)) {

        if (configuration.verbose || (statsObj.numFollowUsers % 100 === 0)) {
          console.log(chalkInfo("TFE | U | IN SET "
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
          console.log(chalkInfo("TFE | U | ADD SET"
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
      console.error(chalkLog("TFE | *** ERROR initFollowingUserIdSet: " + err));
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

  twitterUserObj.twit.get("application/rate_limit_status", function(err, data, response) {
    
    if (err){

      console.log(chalkError("TFE | *** TWITTER ACCOUNT ERROR"
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
        console.log(chalkLog("TFE | TWITTER RATE LIMIT STATUS"
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
          
          console.log(chalkInfo("TFE | XXX RESET TWITTER RATE LIMIT"
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

        console.log(chalkLog("TFE | --- TWITTER RATE LIMIT"
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


let userCategorizeQueueReady = true;
let userCategorizeQueueInterval;

let userChangeDbQueueReady = true;
let userChangeDbQueueInterval;


let generateNetworkInputBusy = false;

function generateNetworkInputIndexed(params, callback){

  // const params = {
  //   networkId: networkObj.networkId,
  //   userScreenName: user.screenName,
  //   histograms: userHistograms,
  //   languageAnalysis: languageAnalysis,
  //   inputsObj: networkObj.inputsObj,
  //   maxInputHashMap: maxInputHashMap
  // };

  generateNetworkInputBusy = true;

  const inTypes = Object.keys(params.inputsObj.inputs).sort();
  let networkInput = [];

  let indexOffset = 0;

  async.eachSeries(inTypes, function(inputType, cb0){

    debug("RNT | GENERATE NET INPUT | TYPE: " + inputType);

    const histogramObj = params.histograms[inputType];
    const networkInputTypeNames = params.inputsObj.inputs[inputType];

    async.eachOf(networkInputTypeNames, function(inputName, index, cb1){

      if (histogramObj && (histogramObj[inputName] !== undefined)) {

        if ((params.maxInputHashMap === undefined) 
          || (params.maxInputHashMap[inputType] === undefined)) {

          networkInput[indexOffset + index] = 1;

          console.log(chalkLog("RNT | ??? UNDEFINED MAX INPUT"
            + " | IN ID: " + params.inputsObj.inputsId
            + " | IN LENGTH: " + networkInput.length
            + " | @" + params.userScreenName
            + " | TYPE: " + inputType
            + " | " + inputName
            + " | " + histogramObj[inputName]
          ));

          async.setImmediate(function() { 
            cb1(); 
          });

        }
        else {

          const inputValue = (params.maxInputHashMap[inputType][inputName] > 0) 
            ? histogramObj[inputName]/params.maxInputHashMap[inputType][inputName] 
            : 1;

          networkInput[indexOffset + index] = inputValue;

          async.setImmediate(function() {
            cb1();
          });
        }
      }
      else {

        networkInput[indexOffset + index] = 0;
 
        async.setImmediate(function() { 
          cb1(); 
        });
      }

    }, function(err){

      async.setImmediate(function() { 
        indexOffset += networkInputTypeNames.length;
        cb0(); 
      });

    });

  }, function(err){
    generateNetworkInputBusy = false;
    callback(err, networkInput);
  });
}

function indexOfMax (arr, callback) {

  if (arr.length === 0) {
    console.log(chalkAlert("indexOfMax: 0 LENG ARRAY: -1"));
    return callback(-1);
  }
  if ((arr[0] === arr[1]) && (arr[1] === arr[2])){
    return callback(-1);
  }

  arrayNormalize(arr);

  let max = arr[0];
  let maxIndex = 0;

  async.eachOfSeries(arr, function(val, index, cb){

    if (val > max) {
      maxIndex = index;
      max = val;
    }

    async.setImmediate(function() { cb(); });

  }, function(){

    callback(maxIndex) ; 

  });
}

let activateNetworkBusy = false;

function activateNetwork(params){

  return new Promise(function(resolve, reject) {

    let user = params.user;

    activateNetworkBusy = true;

    let networkOutput = {};

    user.profileHistograms = user.profileHistograms || {};
    user.tweetHistograms = user.tweetHistograms || {};
    user.languageAnalysis = user.languageAnalysis || {};

    mergeHistograms.merge({ histogramA: user.profileHistograms, histogramB: user.tweetHistograms })
    .then(function(mergedUserHistograms){

      async.each(networksHashMap.keys(), function(nnId, cb){

        const networkObj = networksHashMap.get(nnId);

        if (networkObj.inputsObj.inputs === undefined) {
          console.log(chalkError("UNDEFINED NETWORK INPUTS OBJ | NETWORK OBJ KEYS: " + Object.keys(networkObj)));
          const err = new Error("UNDEFINED NETWORK INPUTS OBJ");
          console.error(err);
          activateNetworkBusy = false;
          reject(err);
        }

        const prms = {
          networkId: networkObj.networkId,
          userScreenName: user.screenName,
          histograms: mergedUserHistograms,
          languageAnalysis: user.languageAnalysis,
          inputsObj: networkObj.inputsObj,
          maxInputHashMap: maxInputHashMap
        };

        generateNetworkInputIndexed(prms, function(err, networkInput){

          const output = networkObj.network.activate(networkInput);

          if (output.length !== 3) {
            console.log(chalkError("*** ZERO LENGTH NETWORK OUTPUT | " + nnId ));
            const e = new Error("ZERO LENGTH NETWORK OUTPUT");
            console.error(e);
            reject(err);
          }

          indexOfMax(output, function maxNetworkOutput(maxOutputIndex){

            if (networkOutput[nnId] === undefined) {
              networkOutput[nnId] = {};
              networkOutput[nnId].output = "0";
              networkOutput[nnId].left = 0;
              networkOutput[nnId].neutral = 0;
              networkOutput[nnId].right = 0;
              networkOutput[nnId].none = 0;
            }

            switch (maxOutputIndex) {
              case 0:
                networkOutput[nnId].output = "left";
                networkOutput[nnId].left += 1;
              break;
              case 1:
                networkOutput[nnId].output = "neutral";
                networkOutput[nnId].neutral += 1;
              break;
              case 2:
                networkOutput[nnId].output = "right";
                networkOutput[nnId].right += 1;
              break;
              default:
                networkOutput[nnId].output = "none";
                networkOutput[nnId].none += 1;
            }

            async.setImmediate(function() {
              cb();
            });

          });
        });
      }, function(err){
        activateNetworkBusy = false;
        resolve(networkOutput);
      });

    })
    .catch(function(err){
      activateNetworkBusy = false;
      reject(err);
    });


  });
}

function updateGlobalHistograms(params, callback) {

  if (params.user === undefined) { return callback ("UNDEFINED USER"); }

  statsObj.status = "UPDATE GLOBAL HISTOGRAMS";

  async.each(Object.keys(params.user.histograms), function(type, cb0) {

    if (globalHistograms[type] === undefined) { globalHistograms[type] = {}; }

    async.each(Object.keys(params.user.histograms[type]), function(item, cb1) {

      if (globalHistograms[type][item] === undefined) {
        globalHistograms[type][item] = {};
        globalHistograms[type][item].total = 0;
        globalHistograms[type][item].left = 0;
        globalHistograms[type][item].neutral = 0;
        globalHistograms[type][item].right = 0;
        globalHistograms[type][item].positive = 0;
        globalHistograms[type][item].negative = 0;
        globalHistograms[type][item].uncategorized = 0;
      }

      globalHistograms[type][item].total += 1;

      if (params.user.category) {
        if (params.user.category === "left") { globalHistograms[type][item].left += 1; }
        if (params.user.category === "neutral") { globalHistograms[type][item].neutral += 1; }
        if (params.user.category === "right") { globalHistograms[type][item].right += 1; }
        if (params.user.category === "positive") { globalHistograms[type][item].positive += 1; }
        if (params.user.category === "negative") { globalHistograms[type][item].negative += 1; }
      }
      else {
        globalHistograms[type][item].uncategorized += 1;
      }

      cb1();

    }, function() {

      cb0();

    });

  }, function() {

    if (callback !== undefined) { callback(); }

  });
}

function updateHistograms(params) {

  // printUserObj("TFE | IN UPDATE HISTOGRAMS", params.user);

  return new Promise(function(resolve, reject) {

    statsObj.status = "UPDATE HISTOGRAMS";

    let user = {};
    let histogramsIn = {};

    user = params.user;
    histogramsIn = params.histograms;

    if (!user.histograms || (user.histograms === undefined)) {
      user.histograms = {};
    }
    
    async.each(configuration.inputTypes, function(type, cb0) {

      if (user.histograms[type] === undefined) { user.histograms[type] = {}; }
      if (histogramsIn[type] === undefined) { histogramsIn[type] = {}; }

      const inputHistogramTypeItems = Object.keys(histogramsIn[type]);

      async.each(inputHistogramTypeItems, function(item, cb1) {

        if (user.histograms[type][item] === undefined) {
          user.histograms[type][item] = histogramsIn[type][item];
        }
        else if (params.accumulateFlag) {
          user.histograms[type][item] += histogramsIn[type][item];
        }

        debug("user histograms"
          + " | @" + user.screenName
          + " | " + type
          + " | " + item
          + " | USER VAL: " + user.histograms[type][item]
          + " | UPDATE VAL: " + histogramsIn[type][item]
        );

        async.setImmediate(function() {
          cb1();
        });

      }, function (argument) {

        async.setImmediate(function() {
          cb0();
        });

      });
    }, function(err) {

      if (err) {
        console.log(chalkError("TFE | UPDATE HISTOGRAMS ERROR: " + err));
        reject(err);
      }

      updateGlobalHistograms({user: user}, function(err){

        if (err) {
          console.log(chalkError("TFE | UPDATE GLOBAL HISTOGRAMS ERROR: " + err));
          reject(err);
        }

        resolve(user);

      });

    });

  });
}

function enableAnalysis(user, languageAnalysis) {
  if (!configuration.enableLanguageAnalysis) { return false; }
  if (configuration.forceLanguageAnalysis) {
    debug(chalkAlert("enableAnalysis: configuration.forceLanguageAnalysis: "
      + configuration.forceLanguageAnalysis
    ));
    return true;
  }
  if (!user.languageAnalyzed) {
    debug(chalkAlert("enableAnalysis: user.languageAnalyzed: "
      + user.languageAnalyzed
    ));
    return true;
  }
  if (user.languageAnalysis.error !== undefined) {
    if ((user.languageAnalysis.error.code === 3)
      || (user.languageAnalysis.error.code === 8)) {
      debug(chalkAlert("enableAnalysis: user.languageAnalysis.error: "
        + user.languageAnalysis.error.code
      ));
      return true;
    }
  }
  if (user.languageAnalyzed && (languageAnalysis.magnitude === 0) && (languageAnalysis.score === 0)) {
    debug(chalkAlert("enableAnalysis: user.languageAnalyzed: "
      + user.languageAnalyzed
    ));
    return true;
  }
  return false;
}

function parseImage(params){

  return new Promise(function(resolve, reject) {

    params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
    params.category = params.user.category || "none";
    params.imageUrl = params.user.bannerImageUrl;
    params.histograms = params.user.histograms;
    params.screenName = params.user.screenName;

    twitterImageParser.parseImage(params)
    .then(function(hist){
      resolve(hist);
    })
    .catch(function(err){
      console.log(chalkError("*** TWITTER IMAGE PARSER ERROR: " + err));
      console.error(err);
      reject(err);
    });

    // try {
    //   const hist = await twitterImageParser.parseImage(params);
    //   resolve(hist);
    // }
    // catch(err){
    //   console.log(chalkError("*** TWITTER IMAGE PARSER ERROR: " + err));
    //   console.error(err);
    //   reject(err);
    // }

  });
}

function parseText(params){

  return new Promise(function(resolve, reject) {

    params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
    params.category = (params.user && params.user.category) ? params.user.category : "none";
    params.minWordLength = params.minWordLength || DEFAULT_WORD_MIN_LENGTH;

    twitterTextParser.parseText(params)
    .then(function(hist){
      resolve(hist);
    })
    .catch(function(err){
      console.log(chalkError("*** TWITTER TEXT PARSER ERROR: " + err));
      console.error(err);
      reject(err);
    });

    // try {
    //   const hist = await twitterTextParser.parseText(params);
    //   resolve(hist);
    // }
    // catch(err){
    //   console.log(chalkError("*** TWITTER TEXT PARSER ERROR: " + err));
    //   console.error(err);
    //   reject(err);
    // }

  });
}

function checkUserProfileChanged(params) {

  let user = params.user;

  let results = [];

  if (user.name && (user.name !== undefined) && (user.name !== user.previousName)) { results.push("name"); }
  if (user.screenName && (user.screenName !== undefined) && (user.screenName !== user.previousScreenName)) { results.push("screenName"); }
  if (user.description && (user.description !== undefined) && (user.description !== user.previousDescription)) { results.push("description"); }
  if (user.location && (user.location !== undefined) && (user.location !== user.previousLocation)) { results.push("location"); }
  if (user.url && (user.url !== undefined) && (user.url !== user.previousUrl)) { results.push("url"); }
  if (user.profileUrl && (user.profileUrl !== undefined) && (user.profileUrl !== user.previousProfileUrl)) { results.push("profileUrl"); }
  if (user.bannerImageUrl && (user.bannerImageUrl !== undefined) && (user.bannerImageUrl !== user.previousBannerImageUrl)) { results.push("bannerImageUrl"); }

  if (results.length === 0) { return false; }
  return results;    
}

function checkUserStatusChanged(params) {

  let user = params.user;

  let results = [];

  if (user.statusId !== user.previousStatusId) { results.push("statusId"); }
  if (user.quotedStatusId !== user.previousQuotedStatusId) { results.push("quotedStatusId"); }

  if (results.length === 0) { return false; }
  return results;    
}

function userProfileChangeHistogram(params) {

  return new Promise(function(resolve, reject){

    let user = params.user;
  
    const userProfileChanges = checkUserProfileChanged(params);

    if (!userProfileChanges) {
      return resolve(false);
    }

    let text = "";
    let url = false;
    let profileUrl = false;
    let bannerImageUrl = false;

    async.each(userProfileChanges, function(userProp, cb){

      const prevUserProp = "previous" + _.upperFirst(userProp);

      console.log(chalkLog("TFE | +++ USER PROFILE CHANGE"
        + " | " + userProp 
        + " | " + user[userProp] + " <-- " + user[prevUserProp]
      ));

      switch (userProp) {
        case "name":
        case "location":
        case "description":
          text += user[userProp] + "\n";
        break;
        case "screenName":
          text += "@" + user[userProp] + "\n";
        break;
        case "url":
          url = user[userProp];
        break;
        case "profileUrl":
          profileUrl = user[userProp];
        break;
        case "bannerImageUrl":
          bannerImageUrl = user[userProp];
        break;
        default:
          console.log(chalkError("TFE | UNKNOWN USER PROPERTY: " + userProp));
          return cb(new Error("UNKNOWN USER PROPERTY: " + userProp));
      }

      cb();

    }, function(err){

      if (err) {
        console.log(chalkError("TFE | USER PROFILE HISTOGRAM ERROR: " + err));
        return reject(err);
      }


      async.parallel({

        imageHist: function(cb) {

          if (bannerImageUrl){
            parseImage(params)
            .then(function(imageParseResults){
              cb(null, imageParseResults);
            })
            .catch(function(err){
              cb(err, null);
            });
          }
          else {
            cb(null, null);
          }


        }, 

        textHist: function(cb){

          if (text && (text !== undefined)){

            // params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
            // params.category = params.user.category || "none";
            // params.minWordLength = params.minWordLength || DEFAULT_WORD_MIN_LENGTH;

            parseText({category: user.category, text: text})
            .then(function(textParseResults){

              if (profileUrl) {

                let histB = {};
                histB[profileUrl] = 1;

                mergeHistograms.merge({ histogramA: textParseResults, histogramB: histB })
                .then(function(textParseResults){
                  cb(null, textParseResults);
                })
                .catch(function(err){
                  cb(err, null);
                });

              }
              else {
                cb(null, textParseResults);
              }

            })
            .catch(function(err){
              cb(err, null);
            });
          }
          else {
            cb(null, null);
          }
        }

      }, function(err, results){

        mergeHistograms.merge({ histogramA: results.textHist, histogramB: results.imageHist})
        .then(function(histogramsMerged){
          resolve(histogramsMerged);
        })
        .catch(function(err){
          console.log(chalkError("TFE | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        });
      });

      /*

        KLUDGE: If and when jshint supports async /await....

      */
      // let imageParseResults;
      // let textParseResults;


      // try {
      //   if (bannerImageUrl) { imageParseResults = await parseImage({url: bannerImageUrl});  }

      //   if (text) { textParseResults = await parseText({text: text}); }

      //   if (profileUrl) { 

      //     let histB = {};
      //     histB[profileUrl] = 1;

      //     textParseResults = mergeHistograms.merge({ histogramA: textParseResults, histogramB: histB });
      //   }

      //   let histogramsMerged = mergeHistograms.merge({ histogramA: textParseResults, histogramB: imageParseResults});

      //   resolve(histogramsMerged);
      // }
      // catch(err){
      //   console.log(chalkError("TFE | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
      //   return reject(err);
      // }

    });

  });
}

function userStatusChangeHistogram(params) {

  return new Promise(function(resolve, reject){

    let user = params.user;
  
    const userStatusChangeArray = checkUserStatusChanged(params);

    if (!userStatusChangeArray) {
      return resolve(false);
    }

    let text = false;

    async.each(userStatusChangeArray, function(userProp, cb){

      const prevUserProp = "previous" + _.upperFirst(userProp);

      console.log(chalkLog("TFE | +++ USER STATUS CHANGE"
        + " | " + userProp 
        + " | " + user[userProp] + " <-- " + user[prevUserProp]
      ));

      switch (userProp) {
        case "statusId":
          text += "\n" + user.status.text;
        break;
        case "quotedStatusId":
          if (user.quotedStatus.extended_tweet) {
            text += "\n" + user.quotedStatus.extended_tweet.full_text;
          }
          else {
            text += "\n" + user.quotedStatus.text;
          }
        break;
        default:
          console.log(chalkError("TFE | UNKNOWN USER PROPERTY: " + userProp));
          return cb(new Error("UNKNOWN USER PROPERTY: " + userProp));
      }

      cb();

    }, function(err){

      if (err) {
        console.log(chalkError("TFE | USER STATUS HISTOGRAM ERROR: " + err));
        return reject(err);
      }

      // let textParseResults;

      if (text){
       parseText({user: user, text: text})
        .then(function(textParseResults){
          resolve(textParseResults);
        })
        .catch(function(err){
          console.log(chalkError("TFE | USER STATUS CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        });
      }
      else {
        resolve(null);
      }
 
      // try {
      //   if (text) { textParseResults = await parseText({text: text}); }

      //   resolve(textParseResults);
      // }
      // catch(err){
      //   console.log(chalkError("TFE | USER STATUS CHANGE HISTOGRAM ERROR: " + err));
      //   return reject(err);
      // }

    });

  });
}

function updateUserHistograms(params) {

  return new Promise(function(resolve, reject){
    
    if ((params.user === undefined) || !params.user) {
      console.log(chalkError("TFE | *** updateUserHistograms USER UNDEFINED"));
      const err = new Error("TFE | *** updateUserHistograms USER UNDEFINED");
      console.error(err);
      reject(err);
    }

    params.user = userDefaults(params.user);

    userStatusChangeHistogram(params)

      .then(function(tweetHistogramChanges){

        params.tweetHistogramChanges = tweetHistogramChanges;

        userProfileChangeHistogram(params)
        .then(function(profileHistogramChanges){

          async.parallel({

            profHist: function(cb){

              if (profileHistogramChanges) {

                mergeHistograms.merge({ histogramA: params.user.profileHistograms, histogramB: profileHistogramChanges })
                .then(function(profileHist){
                  cb(null, profileHist);
                })
                .catch(function(err){
                  cb(err, null);
                });

              }
              else {
                cb(null, null);
              }

            },

            tweetHist: function(cb){

              if (params.tweetHistogramChanges) {

                mergeHistograms.merge({ histogramA: params.user.tweetHistograms, histogramB: params.tweetHistogramChanges })
                .then(function(tweetHist){
                  cb(null, tweetHist);
                })
                .catch(function(err){
                  cb(err, null);
                });

              }
              else {
                cb(null, null);
              }
            }

          }, function(err, results){
            if (err) {
              return reject(err);
            }
            params.user.profileHistograms = results.profileHist;
            params.user.tweetHistograms = results.tweetHist;
            resolve(params.user);
          });

        });

      })
      .catch(function(err){
        console.log(chalkError("TFE | *** UPDATE USER HISTOGRAM ERROR: " + err));
        reject(err);
      });


    // try {

    //   let profileHistogramChanges = await userProfileChangeHistogram(params);
    //   let tweetHistogramChanges = await userStatusChangeHistogram(params);

    //   if (profileHistogramChanges) {
    //     params.user.profileHistograms = await mergeHistograms.merge({ 
    //       histogramA: params.user.profileHistograms, 
    //       histogramB: profileHistogramChanges
    //     });
    //   } 

    //   if (tweetHistogramChanges) {
    //     params.user.tweetHistograms = await mergeHistograms.merge({
    //       histogramA: params.user.tweetHistograms, 
    //       histogramB: tweetHistogramChanges
    //     });
    //   }

    //   resolve(params);

    // }
    // catch (err) {
    //   reject(err);
    // }

  });
}

function initUserChangeDbQueueInterval(cnf){

  let user = {};

  console.log(chalkTwitter("TFE | INIT TWITTER USER CHANGE DB QUEUE INTERVAL: " + cnf.userChangeDbQueueInterval));

  clearInterval(userChangeDbQueueInterval);

  userChangeDbQueueInterval = setInterval(function () {

    if (userChangeDbQueueReady && (userChangeDbQueue.length > 0)) {

      userChangeDbQueueReady = false;

      user = userChangeDbQueue.shift();

      if (user.initFlag && !user.changes) {

        printUserObj("TFE | CHANGE USER DB [" + userChangeDbQueue.length + "] INIT", user, chalkGreen);

        user.nodeId = user.userId;

        userServerController.findOneUser(user, {noInc: true}, function(err, dbUser){
          if (err) {
            console.log(chalkError("TFE | *** USER DB UPDATE ERROR: " + err));
          }
          userChangeDbQueueReady = true;
        });

      }
      else if (user.changes) {

        statsObj.user.changes += 1;

        if (configuration.verbose) { 
          printUserObj("TFE | CHANGE USER DB [" + userChangeDbQueue.length + "] CHNG", user, chalkGreen); 
        }

        if (!userCategorizeQueue.includes(user.userId) && (userCategorizeQueue.length < USER_CAT_QUEUE_MAX_LENGTH)) {

          userCategorizeQueue.push(user);

          debug(chalkInfo("TFE | USER_CATEGORIZE"
            + " [ USQ: " + userCategorizeQueue.length + "]"
            + " | FLWRs: " + user.followersCount
            + " | FRNDs: " + user.friendsCount
            + " | UID: " + user.userId
            + " | @" + user.screenName
            + " | " + user.name
            + " | LANG: " + user.lang
            + "\nTFE | USER_SHOW | DESC: " + user.description
          ));
          
        }

        userChangeDbQueueReady = true;
      }
      else {
        userChangeDbQueueReady = true;
      }

    }

  }, cnf.userChangeDbQueueInterval);
}

function initUserCategorizeQueueInterval(cnf){

  let user = {};

  console.log(chalkTwitter("TFE | INIT TWITTER USER CATEGORIZE QUEUE INTERVAL: " + cnf.userCategorizeQueueInterval));

  clearInterval(userCategorizeQueueInterval);

  userCategorizeQueueInterval = setInterval(function () {

    if (userServerControllerReady && userCategorizeQueueReady && (userCategorizeQueue.length > 0)) {

      userCategorizeQueueReady = false;

      user = userCategorizeQueue.shift();
      user.nodeId = user.userId;

      updateUserHistograms({user: user})
      .then(function(updatedUser){
        activateNetwork({user: updatedUser})
        .then(function(networkOutput){

          if (Object.keys(networkOutput).length === 0) {
            console.log(chalkError("TFE | ??? NO NETWORK OUTPUT\n" + jsonPrint(networkOutput)));
            userCategorizeQueueReady = true;
            return;
          }

          Object.keys(networkOutput).forEach(function(nnId){

            if (updatedUser.categoryAuto !== networkOutput[nnId].output) {
              console.log(chalkLog("TFE | >>> NN AUTO CAT CHANGE"
                + " | " + nnId
                + " | AUTO: " + updatedUser.categoryAuto + " > " + networkOutput[nnId].output
                + " | NID: " + updatedUser.nodeId
                + " | @" + updatedUser.screenName
              ));
            }

            updatedUser.categoryAuto = networkOutput[nnId].output;

            if (!userServerControllerReady) {
              userCategorizeQueueReady = true;
              return;
            }

            userServerController.findOneUser(updatedUser, {noInc: false, fields: fieldsTransmit}, function(err, dbUser){
              if (err) {
                console.log(chalkError("TFE | *** FIND ONE USER ERROR: " + err));
                userCategorizeQueueReady = true;
                return;
              }
              printUserObj("TFE | NN: " + nnId + " | DB CAT", dbUser, chalkInfo);
              process.send({ op: "USER_CATEGORIZED", user: dbUser });
              userCategorizeQueueReady = true;
            });

          });

        });
      })
      .catch(function(err){
        console.log(chalkError("TFE | *** USER CATEGORIZE ERROR: " + err));
        console.error(err);
        userCategorizeQueueReady = true;
      });
    }

    //   try {

    //     let updatedUser = await updateUserHistograms({user: user});

    //     let networkOutput = await activateNetwork(updatedUser);

        // Object.keys(networkOutput).forEach(function(nnId){


        //   if (updatedUser.categoryAuto !== networkOutput[nnId].output) {
        //     console.log(chalkLog("TFE | >>> NN AUTO CAT CHANGE"
        //       + " | " + nnId
        //       + " | AUTO: " + updatedUser.categoryAuto + " > " + networkOutput[nnId].output
        //       + " | @" + updatedUser.screenName
        //     ));
        //   }
        //   else {

        //   }
        //   updatedUser.categoryAuto = networkOutput[nnId].output;
        //   updatedUser.nodeId = updatedUser.nodeId;

        //   userServerController.findOneUser(updatedUser, {noInc: false, fields: fieldsTransmit}, function(err, dbUser){
        //     printUserObj("TFE | NN: " + nnId + " | DB CAT", dbUser, chalkInfo);
        //     process.send({ op: "USER_CATEGORIZED", user: dbUser });
        //   });

        // });

    //     userCategorizeQueueReady = true;

    //   }
    //   catch (err) {
    //     console.log(chalkError("TFE | *** USER CATEGORIZE ERROR: " + err));
    //     console.error(err);
    //     userCategorizeQueueReady = true;
    //   }
    // }

  }, cnf.userCategorizeQueueInterval);
}

function checkUserChanges(params){

  return new Promise(function(resolve, reject){

    let results = {};
    results.change = {};
    results.changeFlag = false;
    results.initFlag = false;

    let user = {};
    user = params.user;

    if (user.previousName === undefined) { 
      results.initFlag = true;
      user.previousName = user.name || ""; 
    }
    if (user.previousDescription === undefined) { 
      results.initFlag = true;
      user.previousDescription = user.description || ""; 
    }
    if (user.previousStatusId === undefined) {
      results.initFlag = true;
      user.previousStatusId = user.statusId || "0"; 
    }

    if (user.name && (user.previousName !== user.name)) { 
      results.changeFlag = true;
      results.change.name = user.previousName;
      results.name = user.name;
      user.previousName = user.name; 
    }
    if (user.description && (user.previousDescription !== user.description)) { 
      results.changeFlag = true;
      results.change.description = user.previousDescription;
      results.description = user.description; 
      user.previousDescription = user.description; 
    }
    if (user.statusId && (user.previousStatusId !== user.statusId)) { 
      results.changeFlag = true;
      results.change.statusId = user.previousStatusId;
      results.statusId = user.statusId;
      user.previousStatusId = user.statusId;
    }

    resolve(results);

  });
}

function initDbUserChangeStream(params){

  return new Promise(function(resolve, reject){

    const userCollection = params.db.collection("users");

    userCollection.countDocuments(function(err, count){

      if (err) { 
        // throw Error;
        return reject(err);
      }
      console.log(chalkInfo("TFE | USERS IN DB: " + count));

      const changeFilter = {
        "$match": {
          "$or": [{ operationType: "insert" },{ operationType: "delete" },{ operationType: "update" },{ operationType: "replace" }]
        }
      };
      const changeOptions = { fullDocument: "updateLookup" };

      const userChangeStream = userCollection.watch([changeFilter], changeOptions);

      userChangeStream.on("change", function(change){

        if (change && change.fullDocument) { 

          let user = new User(change.fullDocument); 

          checkUserChanges({user:user})
          .then(function(userChanges){

            if (userChanges.changeFlag) { 
              user.changes = userChanges; 
            }

            if (userChanges.initFlag) {
              user.initFlag = true;
            }

            if ((userChangeDbQueue.length < 10000) && (userChanges.changeFlag || userChanges.initFlag)) { 
              userChangeDbQueue.push(user);
            }
            
            if (configuration.verbose) {
              printUserObj("TFE | --> USER CHANGE | " +  change.operationType, user, chalkLog);
            }

            resolve();
          })
          .catch(function(err){
            console.log(chalkLog("TFE | *** USER CHANGE STREAM ERROR | " +  err));
            reject(err);
          });

          // const userChanges = await checkUserChanges({user:user});

          // if (userChanges.changeFlag) { 
          //   user.changes = userChanges; 
          // }

          // if (userChanges.initFlag) {
          //   user.initFlag = true;
          // }

          // if ((userChangeDbQueue.length < 10000) && (userChanges.changeFlag || userChanges.initFlag)) { 
          //   userChangeDbQueue.push(user);
          // }
          
          // if (configuration.verbose) {
          //   printUserObj("TFE | --> USER CHANGE | " +  change.operationType, user, chalkLog);
          // }
        }
        else {
          console.log(chalkLog("TFE | XX> USER CHANGE | " +  change.operationType));
          resolve();
        }

      });

      // resolve();

    });

  });
}

function initialize(cnf, callback){

  console.log(chalkLog("TFE | INITIALIZE"));

  if (debug.enabled || debugCache.enabled || debugQ.enabled){
    console.log("\nTFE | %%%%%%%%%%%%%%\nTFE | DEBUG ENABLED \nTFE | %%%%%%%%%%%%%%\n");
  }

  cnf.processName = process.env.TFE_PROCESS_NAME || "wa_node_tfe";

  cnf.verbose = process.env.TFE_VERBOSE_MODE || false ;
  cnf.globalTestMode = process.env.TFE_GLOBAL_TEST_MODE || false ;
  cnf.testMode = process.env.TFE_TEST_MODE || false ;
  cnf.quitOnError = process.env.TFE_QUIT_ON_ERROR || false ;

  cnf.twitterConfigFolder = process.env.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER || "/config/twitter"; 
  cnf.twitterConfigFile = process.env.DROPBOX_TFE_DEFAULT_TWITTER_CONFIG_FILE 
    || "altthreecee00.json";

  cnf.statsUpdateIntervalTime = process.env.TFE_STATS_UPDATE_INTERVAL || 60000;

  debug(chalkWarn("TFE | dropboxConfigFolder: " + dropboxConfigFolder));
  debug(chalkWarn("TFE | dropboxConfigFile  : " + dropboxConfigFile));

  loadFile(dropboxConfigHostFolder, dropboxConfigFile, function(err, loadedConfigObj){

    // let commandLineConfigKeys;
    let configArgs;

    if (!err) {
      console.log("TFE | " + dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

      if (loadedConfigObj.TFE_VERBOSE_MODE  !== undefined){
        console.log("TFE | LOADED TFE_VERBOSE_MODE: " + loadedConfigObj.TFE_VERBOSE_MODE);
        cnf.verbose = loadedConfigObj.TFE_VERBOSE_MODE;
      }

      if (loadedConfigObj.TFE_GLOBAL_TEST_MODE  !== undefined){
        console.log("TFE | LOADED TFE_GLOBAL_TEST_MODE: " + loadedConfigObj.TFE_GLOBAL_TEST_MODE);
        cnf.globalTestMode = loadedConfigObj.TFE_GLOBAL_TEST_MODE;
      }

      if (loadedConfigObj.TFE_TEST_MODE  !== undefined){
        console.log("TFE | LOADED TFE_TEST_MODE: " + loadedConfigObj.TFE_TEST_MODE);
        cnf.testMode = loadedConfigObj.TFE_TEST_MODE;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER  !== undefined){
        console.log("TFE | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER));
        cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE  !== undefined){
        console.log("TFE | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE));
        cnf.twitterConfigFile = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE;
      }

      if (loadedConfigObj.TFE_STATS_UPDATE_INTERVAL  !== undefined) {
        console.log("TFE | LOADED TFE_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TFE_STATS_UPDATE_INTERVAL);
        cnf.statsUpdateIntervalTime = loadedConfigObj.TFE_STATS_UPDATE_INTERVAL;
      }

      if (loadedConfigObj.TFE_MAX_TWEET_QUEUE  !== undefined) {
        console.log("TFE | LOADED TFE_MAX_TWEET_QUEUE: " + loadedConfigObj.TFE_MAX_TWEET_QUEUE);
        cnf.maxTweetQueue = loadedConfigObj.TFE_MAX_TWEET_QUEUE;
      }

      // OVERIDE CONFIG WITH COMMAND LINE ARGS

      configArgs = Object.keys(cnf);

      configArgs.forEach(function(arg){
        console.log("TFE | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });

      initStatsUpdate(cnf, function(err, cnf2){

        if (err) {
          console.log(chalkLog("TFE | ERROR initStatsUpdate\n" + err));
        }

        loadFile(cnf.twitterConfigFolder, cnf.twitterConfigFile, function(err, tc){
          if (err){
            console.error(chalkLog("TFE | *** TWITTER CONFIG LOAD ERROR\n" + err));
            quit();
            return;
          }

          cnf2.twitterConfig = {};
          cnf2.twitterConfig = tc;

          console.log("TFE | " + chalkInfo(getTimeStamp() + " | TWITTER CONFIG FILE " 
            + cnf2.twitterConfigFolder
            + cnf2.twitterConfigFile
            + "\n" + jsonPrint(cnf2.twitterConfig )
          ));
          return(callback(null, cnf2));
        });
      });
    }
    else {
      console.error("TFE | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));

      if (err.status === 404){

        configArgs = Object.keys(cnf);

        configArgs.forEach(function(arg){
          console.log("TFE | FINAL CONFIG | " + arg + ": " + cnf[arg]);
        });

        initStatsUpdate(cnf, function(err, cnf2){

          if (err) {
            console.log(chalkLog("TFE | ERROR initStatsUpdate\n" + jsonPrint(err)));
          }

          loadFile(cnf.twitterConfigFolder, cnf.twitterConfigFile, function(err, tc){
            if (err){
              console.error(chalkLog("TFE | *** TWITTER CONFIG LOAD ERROR\n" + err));
              quit();
              return;
            }

            cnf2.twitterConfig = {};
            cnf2.twitterConfig = tc;

            console.log("TFE | " + chalkInfo(getTimeStamp() + " | TWITTER CONFIG FILE " 
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

let sendMessageTimeout;


process.on("message", function(m) {

  debug(chalkAlert("TFE RX MESSAGE"
    + " | OP: " + m.op
  ));

  let network;

  switch (m.op) {

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.forceImageAnalysis = m.forceImageAnalysis;
      maxInputHashMap = m.maxInputHashMap;
      normalization = m.normalization;

      network = neataptic.Network.fromJSON(m.networkObj.network);

      m.networkObj.network = {};
      m.networkObj.network = network;

      networksHashMap.set(m.networkObj.networkId, m.networkObj);

      console.log(chalkInfo("TFE | INIT"
        + " | TITLE: " + process.title
        + " | NETWORK: " + networksHashMap.get(m.networkObj.networkId).networkId
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
        + " | MAX INPUT HM KEYS: " + Object.keys(maxInputHashMap)
        + " | NORMALIZATION: " + Object.keys(normalization)
      ));
    break;

    case "NETWORK":

      network = neataptic.Network.fromJSON(m.networkObj.network);

      m.networkObj.network = {};
      m.networkObj.network = network;

      networksHashMap.set(m.networkObj.networkId, m.networkObj);

      console.log(chalkInfo("TFE | +++ NETWORK"
        + " | NNs IN HM: " + networksHashMap.size
        + " | NETWORK: " + networksHashMap.get(m.networkObj.networkId).networkId
      ));
      
    break;

    case "FORCE_IMAGE_ANALYSIS":

      configuration.forceImageAnalysis = m.forceImageAnalysis;

      console.log(chalkInfo("TFE | +++ FORCE_IMAGE_ANALYSIS"
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
      ));
      
    break;

    case "MAX_INPUT_HASHMAP":

      maxInputHashMap = m.maxInputHashMap;

      console.log(chalkInfo("TFE | +++ MAX_INPUT_HASHMAP"
        + " | MAX INPUT HM KEYS: " + Object.keys(maxInputHashMap)
      ));
      
    break;

    case "NORMALIZATION":

      normalization = m.normalization;

      console.log(chalkInfo("TFE | +++ NORMALIZATION"
        + " | NORMALIZATION: " + Object.keys(normalization)
      ));
      
    break;

    case "USER_AUTHENTICATED":

      console.log(chalkInfo("TFE | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      let twitterUserObj = twitterUserHashMap.get(m.user.screenName);

      if (twitterUserObj !== undefined) {

        const authObj = twitterUserObj.twit.getAuth();

        console.log(chalkAlert("TFE | CURRENT AUTH\n" + jsonPrint(authObj)));

        twitterUserObj.twit.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

        const authObjNew = twitterUserObj.twit.getAuth();

        twitterUserObj.twitterConfig.access_token = authObjNew.access_token;
        twitterUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
        twitterUserObj.twitterConfig.TOKEN = authObjNew.access_token;
        twitterUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

        twitterUserHashMap.set(m.user.screenName, twitterUserObj);

        console.log(chalkError("TFE | UPDATED AUTH\n" + jsonPrint(authObjNew)));

      }
      else {
        console.log(chalkAlert("TFE | TWITTER USER OBJ UNDEFINED: " + m.user.screenName));
      }
    break;

    case "USER_CATEGORIZE":

      if (!userCategorizeQueue.includes(m.user.userId) && (userCategorizeQueue.length < USER_CAT_QUEUE_MAX_LENGTH)) {

        userCategorizeQueue.push(m.user);

        debug(chalkInfo("TFE | USER_CATEGORIZE"
          + " [ USQ: " + userCategorizeQueue.length + "]"
          + " | FLWRs: " + m.user.followersCount
          + " | FRNDs: " + m.user.friendsCount
          + " | USER " + m.user.userId
          + " | @" + m.user.screenName
          + " | " + m.user.name
          + "\nTFE | USER_SHOW | DESC: " + m.user.description
        ));
      }
    break;

    case "PING":
      debug(chalkLog("TFE | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    default:
      console.error(chalkLog("TFE | TWP | *** TFE UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));

  }
});

setTimeout(function(){

  initialize(configuration, function(err, cnf){

    if (err && (err.status !== 404)) {
      console.error(chalkLog("TFE | *** INIT ERROR \n" + jsonPrint(err)));
      quit();
    }

    configuration = cnf;

    console.log("TFE | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");


    connectDb(function(err, db){

      if (err) {
        dbConnectionReady = false;
        console.log(chalkError("TFE | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
        quit("MONGO DB CONNECT ERROR");
      }

      global.dbConnection = db;

      UserServerController = require("@threeceelabs/user-server-controller");
      userServerController = new UserServerController("TFE_USC");

      userServerControllerReady = false;

      userServerController.on("ready", function(appname){
        userServerControllerReady = true;
        console.log(chalkLog("TFE | USC READY | " + appname));
      });

      dbConnectionReady = true;
    });

    dbConnectionReadyInterval = setInterval(function() {

      if (dbConnectionReady) {

        clearInterval(dbConnectionReadyInterval);

      }
      else {
        console.log(chalkInfo("TFE | WAIT DB CONNECTED ..."));
      }
    }, 1000);

    initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER}, function(err, ituObj){
      infoTwitterUserObj = ituObj;
      initUserChangeDbQueueInterval(configuration);
      initUserCategorizeQueueInterval(configuration);
    });

  });
}, 5*ONE_SECOND);


