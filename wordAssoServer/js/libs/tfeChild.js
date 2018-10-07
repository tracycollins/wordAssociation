/*jslint node: true */
/*jshint sub:true*/
"use strict";

process.title = "wa_node_tfe";

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threeceeinfo";
const USER_SHOW_QUEUE_MAX_LENGTH = 500;

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
const treeify = require("../libs/treeify");
const commandLineArgs = require("command-line-args");
const Measured = require("measured");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const neataptic = require("neataptic");
const networksHashMap = new HashMap();

const debug = require("debug")("tfe");
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

const twitterUserHashMap = new HashMap();

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

let stdin;

let configuration = {};
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode
configuration.userShowQueueInterval = ONE_SECOND;

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
const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const networkInputsModel = require("@threeceelabs/mongoose-twitter/models/networkInputs.server.model");

let User;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

let UserServerController;
let userServerController;

let userServerControllerReady = false;

require("isomorphic-fetch");

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

      callback(null, db);
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

  global.dbConnection.close(function () {
    
    console.log(chalkAlert(
      "\nTFE | ==========================\n"
      + "TFE | MONGO DB CONNECTION CLOSED"
      + "\nTFE | ==========================\n"
    ));

    process.exit(exitCode);
  });
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
        + "\nTFE | ERROR: " + error
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

function printUserObj(title, user) {

  user = userDefaults(user);

  console.log(chalkLog(title
    + " | UID: " + user.userId
    + " | @" + user.screenName
    + " | N: " + user.name 
    + " | FLWRs: " + user.followersCount
    + " | FRNDs: " + user.friendsCount
    + " | Ts: " + user.statusesCount
    + " | Ms:  " + user.mentions
    + " | LS: " + getTimeStamp(user.lastSeen)
    + " | FLWg: " + user.following 
    + " | 3C: @" + user.threeceeFollowing 
    + " | CAT MAN: " + user.category
    + " | CAT AUTO: " + user.categoryAuto
  ));
}

const userDefaults = function (user){
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

  return new Promise(async function(resolve, reject){

    statsObj.numFollowUsers = 0;
    statsObj.numUsersFollowing = 0;

    let query = { "following": true };

    User.countDocuments(query, function (err, count) {
      statsObj.numUsersFollowing = count;
      console.log(chalkAlert("TFE | FOUND FOLLOWING IN DB: " + statsObj.numUsersFollowing + " USERS"));
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
          
          console.log(halkInfo("TFE | XXX RESET TWITTER RATE LIMIT"
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

let userShowQueueReady = true;
let userShowQueueInterval;

function initUserShowQueueInterval(cnf, callback){

  let userId;

  console.log(chalkTwitter("TFE | INIT TWITTER USER SHOW QUEUE INTERVAL: " + cnf.userShowQueueInterval));

  clearInterval(userShowQueueInterval);

  userShowQueueInterval = setInterval(function () {

    if (userShowQueueReady && (userShowQueue.length > 0)) {

      userShowQueueReady = false;

      userId = userShowQueue.shift();

      userShowQueueReady = true;

    }
  }, cnf.userShowQueueInterval);

  if (callback) { callback(); }
}

function initNetworkHashMap(params, callback){
  loadFile(bestn, dropboxConfigFile, function(err, loadedConfigObj){

    let commandLineConfigKeys;
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

  const inputTypes = Object.keys(params.inputsObj.inputs).sort();
  let networkInput = [];

  let indexOffset = 0;

  async.eachSeries(inputTypes, function(inputType, cb0){

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

    // elapsed_time("end generateNetworkInputIndexed");

    callback(err, networkInput);
  });
}

let activateNetworkBusy = false;

function activateNetwork2(user, callback){

  activateNetworkBusy = true;
  let networkOutput = {};
  let userHistograms = {};
  let languageAnalysis = {};

  userHistograms = user.histograms;
  languageAnalysis = user.languageAnalysis;

  async.each(networksHashMap.keys(), function(nnId, cb){

    const networkObj = networksHashMap.get(nnId);

    networkOutput[nnId] = {};
    networkOutput[nnId].output = [];
    networkOutput[nnId].left = statsObj.loadedNetworks[nnId].left;
    networkOutput[nnId].neutral = statsObj.loadedNetworks[nnId].neutral;
    networkOutput[nnId].right = statsObj.loadedNetworks[nnId].right;
    networkOutput[nnId].none = statsObj.loadedNetworks[nnId].none;
    networkOutput[nnId].positive = statsObj.loadedNetworks[nnId].positive;
    networkOutput[nnId].negative = statsObj.loadedNetworks[nnId].negative;

    if (networkObj.inputsObj.inputs === undefined) {
      console.log(chalkError("UNDEFINED NETWORK INPUTS OBJ | NETWORK OBJ KEYS: " + Object.keys(networkObj)));
    }

    const params = {
      networkId: networkObj.networkId,
      userScreenName: user.screenName,
      histograms: userHistograms,
      languageAnalysis: languageAnalysis,
      inputsObj: networkObj.inputsObj,
      maxInputHashMap: maxInputHashMap
    };

    generateNetworkInputIndexed(params, function(err, networkInput){

      const output = networkObj.network.activate(networkInput);

      if (output.length !== 3) {
        console.log(chalkError("*** ZERO LENGTH NETWORK OUTPUT | " + nnId ));
        return(cb("ZERO LENGTH NETWORK OUTPUT", networkOutput));
      }

      indexOfMax(output, function maxNetworkOutput(maxOutputIndex){

        switch (maxOutputIndex) {
          case 0:
            networkOutput[nnId].output = [1,0,0];
            networkOutput[nnId].left += 1;
          break;
          case 1:
            networkOutput[nnId].output = [0,1,0];
            networkOutput[nnId].neutral += 1;
          break;
          case 2:
            networkOutput[nnId].output = [0,0,1];
            networkOutput[nnId].right += 1;
          break;
          default:
            networkOutput[nnId].output = [0,0,0];
            networkOutput[nnId].none += 1;
        }

        async.setImmediate(function() {
          cb();
        });

      });
    });

  }, function(err){
    activateNetworkBusy = false;
    callback(err, networkOutput);
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

    let commandLineConfigKeys;
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

  switch (m.op) {

    case "INIT":

      // networkObj: bestNetworkObj,
      // maxInputHashMap: maxInputHashMap,
      // normalization: normalization,

      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.networkObj = m.networkObj;
      configuration.maxInputHashMap = m.maxInputHashMap;
      configuration.normalization = m.normalization;

      console.log(chalkInfo("TFE | INIT"
        + " | TITLE: " + m.title
        + " | NETWORK: " + m.networkObj.networkId
        + " | MAX INPUT HM KEYS: " + Object.keys(m.maxInputHashMap)
        + " | NORMALIZATION: " + Object.keys(m.maxInputHashMap)
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

        console.log(chalkError("TFE | UPDATED AUTH\n" + jsonPrint(authObjNew)));

        const twitterConfigFile = twitterUserObj.screenName + ".json";

        saveFile(configuration.twitterConfigFolder, twitterConfigFile, twitterUserObj.twitterConfig, function(){
          console.log(chalkLog("TFE | SAVED UPDATED AUTH " + configuration.twitterConfigFolder + "/" + twitterConfigFile));

          twitterUserObj.stats.connected = true;
          twitterUserObj.stats.twitterFollowLimit = false;

          twitterUserObj.twit.get("friends/ids", function(err, data, response) {

            if (err){

              console.log(chalkError("TFE | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
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

              console.log(chalkError("TFE | TWITTER GET FRIENDS IDS"
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
                    console.log(chalkAlert("TFE | *** USER DB ERROR *** | " + err));
                    return cb(err);
                  }

                  if (user) {

                    printString = "TFE | [ " + userIndex + "/" + twitterUserObj.followUserSet.size + " ] @" + twitterUserObj.screenName + " | DB USER FOUND";

                    printUserObj(printString, user);

                    if (!user.following) {
                      user.following = true;
                      user.threeceeFollowing = twitterUserObj.screenName;
                      user.markModified("following");
                      user.markModified("threeceeFollowing");
                      user.save(function(err){
                        if (err) { console.log(chalkError("TFE | *** USER DB SAVE ERROR: " + err)); }
                        cb();
                      });
                    }
                    else if (user.following && (user.threeceeFollowing > twitterUserObj.screenName)) {
                      console.log(chalk.black("TFE | -X- CHANGE 3C FOLLOWING"
                        + " | UID: " + user.userId
                        + " | @" + user.screenName
                        + " | 3C @" + user.threeceeFollowing + " -> " + twitterUserObj.screenName
                      ));
                      user.threeceeFollowing = twitterUserObj.screenName;
                      user.markModified("threeceeFollowing");
                      user.save(function(err){
                        if (err) { console.log(chalkError("TFE | *** USER DB SAVE ERROR: " + err)); }
                        cb();
                      });
                    }
                    else {
                      cb();
                    }

                  }
                  else {
                    console.log(chalkLog("TFE | [ " + userIndex + "/" + twitterUserObj.followUserSet.size + " ]"
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

                  console.log(chalkInfo("TFE | END USER_AUTHENTICATED"
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

        console.log(chalkInfo("TFE | USER_SHOW"
          + " [ USQ: " + userShowQueue.length + "]"
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
      debug(chalkLog("TFE | TWP | PING"
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
        console.log(chalkAlert("TFE | USC READY | " + appname));
      });

      User = mongoose.model("User", userModel.UserSchema);

      dbConnectionReady = true;
    });

    dbConnectionReadyInterval = setInterval(function() {

      if (dbConnectionReady) {

        clearInterval(dbConnectionReadyInterval);

      }
      else {
        console.log(chalkAlert("TFE | ... WAIT DB CONNECTED ..."));
      }
    }, 1000);

    initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER}, function(err, ituObj){
      infoTwitterUserObj = ituObj;
      initUserShowQueueInterval(configuration);
    });

  });
}, 5*ONE_SECOND);


