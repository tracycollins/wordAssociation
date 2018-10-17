/*jslint node: true */
/*jshint sub:true*/
"use strict";

process.title = "wa_node_tfe";

let maxInputHashMap = {};
let normalization = {};
let globalHistograms = {};

let langAnalyzer; // undefined for now

const fieldsTransmit = {
  userId: 1,
  nodeId: 1,
  nodeType: 1,
  name: 1,
  screenName: 1,
  screenNameLower: 1,
  lastTweetId: 1,
  mentions: 1,
  rate: 1,
  isTopTerm: 1,
  category: 1,
  categoryAuto: 1,
  followersCount: 1,
  friendsCount: 1,
  statusesCount: 1,
  following: 1,
  threeceeFollowing: 1
};

const fieldsTransmitKeys = Object.keys(fieldsTransmit);

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threeceeinfo";
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

const twitterTextParser = require("@threeceelabs/twitter-text-parser");
const twitterImageParser = require("@threeceelabs/twitter-image-parser");

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
const arrayNormalize = require("array-normalize");

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

const userCategorizeQueue = [];

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
configuration.userCategorizeQueueInterval = ONE_SECOND;
configuration.enableImageAnalysis = false;

configuration.enableLanguageAnalysis = false;
configuration.forceLanguageAnalysis = false;

configuration.inputTypes = [ 
  "emoji",
  "hashtags",
  "images",
  "mentions",
  "sentiment",
  "urls",
  "words"
];

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

statsObj.analyzer = {};
statsObj.analyzer.total = 0;
statsObj.analyzer.analyzed = 0;
statsObj.analyzer.skipped = 0;
statsObj.analyzer.errors = 0;

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

  wordAssoDb.connect("TFE_" + process.pid, async function(err, db){
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

      await initDbUserChangeStream({db: db});

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

function printUserObj(title, user, chalkConfig) {

  let curChalk = chalkConfig || chalkLog;

  user = userDefaults(user);

  console.log(curChalk(title
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
    + " | CAT M: " + user.category + " - A: " + user.categoryAuto
  ));

  if (user.changes) {
    console.log(curChalk(title
    + "\nCHANGES\n" + jsonPrint(user.changes)
    ));
  }
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

let userCategorizeQueueReady = true;
let userCategorizeQueueInterval;


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

async function activateNetwork(user){

  return new Promise(function(resolve, reject) {

    activateNetworkBusy = true;

    let networkOutput = {};

    let userHistograms = user.histograms || {};
    let languageAnalysis = user.languageAnalysis || {};

    async.each(networksHashMap.keys(), function(nnId, cb){

      const networkObj = networksHashMap.get(nnId);

      if (networkObj.inputsObj.inputs === undefined) {
        console.log(chalkError("UNDEFINED NETWORK INPUTS OBJ | NETWORK OBJ KEYS: " + Object.keys(networkObj)));
        const err = new Error("UNDEFINED NETWORK INPUTS OBJ");
        console.error(err);
        reject(err);
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

  });
}

function updateGlobalHistograms(params, callback) {

  if (params.user === undefined) { return callback ("UNDEFINED USER")}

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

function parseUserImage(user){

  if (
    (configuration.enableImageAnalysis && !user.bannerImageAnalyzed && user.bannerImageUrl)
    || (configuration.enableImageAnalysis && user.bannerImageUrl && (user.bannerImageAnalyzed !== user.bannerImageUrl))
    || (configuration.forceImageAnalysis && user.bannerImageUrl)
  ) 

  {

    twitterImageParser.parseImage(
      user.bannerImageUrl,
      {screenName: user.screenName, category: user.category, updateGlobalHistograms: true},
      function(err, results) {
        if (err) {
          if (err.code === 8) {
            console.log(chalkAlert("PARSE BANNER IMAGE QUOTA ERROR"
            ));
            configuration.enableImageAnalysis = false;
            startImageQuotaTimeout();
            return user;
          }
          else if (err.code === 7) {
            console.log(chalkAlert("PARSE BANNER IMAGE CLOUD VISION API ERROR"
            ));
            configuration.enableImageAnalysis = false;
            startImageQuotaTimeout();
            return user;
          }
          else{
            console.log(chalkError("PARSE BANNER IMAGE ERROR"
              // + "\nREQ\n" + jsonPrint(results)
              + " | ERR: " + err
              + "\nERR\n" + jsonPrint(err)
            ));
            throw new Error(err);
          }
        }

        if (user.bannerImageAnalyzed 
          && user.bannerImageUrl 
          && (user.bannerImageAnalyzed !== user.bannerImageUrl)) {
          console.log(chalk.bold.blue("^^^ BANNER IMAGE UPDATED "
            + " | @" + user.screenName
            + "\nTFE | bannerImageAnalyzed: " + user.bannerImageAnalyzed
            + "\nTFE | bannerImageUrl: " + user.bannerImageUrl
          ));
        }
        else {
          console.log(chalk.bold.blue("TFE | +++ BANNER IMAGE ANALYZED"
            + " | @" + user.screenName
            + "\nTFE | bannerImageAnalyzed: " + user.bannerImageAnalyzed
            + "\nTFE | bannerImageUrl: " + user.bannerImageUrl
          ));
        }

        user.bannerImageAnalyzed = user.bannerImageUrl;

        if (Object.keys(results.images).length > 0) {

          async.each(Object.keys(results.images), function(item, cb){

            if (user.histograms.images[item] === undefined) { 
              user.histograms.images[item] = results.images[item];
              console.log(chalk.bold.blue("+++ USER IMAGE HISTOGRAM ADD"
                + " | @" + user.screenName
                + " | " + item + ": " + results.images[item]
              ));
            }
            else {
              console.log(chalk.bold.blue("... USER IMAGE HISTOGRAM HIT"
                + " | @" + user.screenName
                + " | " + item
                + " | IN HISTOGRAM: " + user.histograms.images[item]
                + " | IN BANNER: " + item + ": " + results.images[item]
              ));
            }

            cb();

          }, function(){

            return user;

          });
        }
        else {
          return user;
        }

      }
    );
  }
  else {
    return user;
  }
}

function parseText(params){

  return new Promise(function(resolve, reject) {

    let parseTextOptions = {};
    parseTextOptions.updateGlobalHistograms = true;

    if (params.user.category) {
      parseTextOptions.category = params.user.category;
    }
    else {
      parseTextOptions.category = false;
    }

    twitterTextParser.parseText(params.text, parseTextOptions, function(err, hist) {

      if (err) {
        console.log(chalkError("*** TWITTER TEXT PARSER ERROR: " + err));
        console.error(err);
        reject(err);
      }

      const response = {user: params.user, histograms: hist};
      resolve(response);

    });

  });
}

async function generateUserData(user) {

  if (user === undefined) {
    console.log(chalkError("TFE | *** generateUserData USER UNDEFINED"));
    const err = new Error("TFE | *** generateUserData USER UNDEFINED");
    console.error(err);
  }

  let text = " ";

  text = (user.screenName !== undefined) ? "@" + user.screenName.toLowerCase() : text;
  text = (user.userName !== undefined) ? text + " | " + user.name.toLowerCase() : text;
  text = ((user.description !== undefined) && user.description) ? text + "\n" + user.description : text;
  text = ((user.status !== undefined) && user.status && user.status.text) ? text + "\n" + user.status.text : text;
  text = ((user.retweeted_status !== undefined) && user.retweeted_status && user.retweeted_status.text) ? text + "\n" + user.retweeted_status.text : text;

  if (!user.histograms || (user.histograms === undefined)) { 
    user.histograms = {}; 
    user.histograms.images = {}; 
  }
  else if (user.histograms.images === undefined) { 
    user.histograms.images = {}; 
  }

  let userParsedImage = await parseUserImage(user);
  let textParserResults = await parseText({user: userParsedImage, text: text});
  let updatedUser = await updateHistograms({user: textParserResults.user, histograms: textParserResults.histograms});

  updatedUser.inputHits = 0;

  if (updatedUser.languageAnalysis === undefined) {
    updatedUser.languageAnalysis = {};
    updatedUser.languageAnalysis.sentiment = 0;
    updatedUser.languageAnalysis.magnitude = 0;
  }

  const score = updatedUser.languageAnalysis.sentiment ? updatedUser.languageAnalysis.sentiment.score : 0;
  const mag = updatedUser.languageAnalysis.sentiment ? updatedUser.languageAnalysis.sentiment.magnitude : 0;

  statsObj.analyzer.total += 1;

  // if (enableAnalysis(updatedUser, {magnitude: mag, score: score})) {
  //   debug(chalkLog(">>>> LANG ANALYZE"
  //     + " [ ANLd: " + statsObj.analyzer.analyzed
  //     + " [ SKPd: " + statsObj.analyzer.skipped
  //     + " | " + updatedUser.nodeId
  //     + " | @" + updatedUser.screenName
  //     + " | LAd: " + updatedUser.languageAnalyzed
  //     + " | LA: S: " + score.toFixed(2)
  //     + " M: " + mag.toFixed(2)
  //   ));

  //   if ((langAnalyzer !== undefined) && langAnalyzer) {
  //     langAnalyzer.send({op: "LANG_ANALIZE", obj: updatedUser, text: text}, function() {
  //       statsObj.analyzer.analyzed += 1;
  //     });
  //   }
  // }
  // else {
  //   statsObj.analyzer.skipped += 1;
  //   debug(chalkLog("SKIP LANG ANALYZE"
  //     + " [ ANLd: " + statsObj.analyzer.analyzed
  //     + " [ SKPd: " + statsObj.analyzer.skipped
  //     + " | " + updatedUser.nodeId
  //     + " | @" + updatedUser.screenName
  //     + " | LAd: " + updatedUser.languageAnalyzed
  //     + " | LA: S: " + score.toFixed(2)
  //     + " M: " + mag.toFixed(2)
  //   ));
  // }

  // printUserObj("TFE | generateUserData", updatedUser);

  return updatedUser;
}

async function initUserCategorizeQueueInterval(cnf){

  let user = {};

  console.log(chalkTwitter("TFE | INIT TWITTER USER CATEGORIZE QUEUE INTERVAL: " + cnf.userCategorizeQueueInterval));

  clearInterval(userCategorizeQueueInterval);

  userCategorizeQueueInterval = setInterval(async function () {

    if (userCategorizeQueueReady && (userCategorizeQueue.length > 0)) {

      userCategorizeQueueReady = false;

      user = userCategorizeQueue.shift();

      try {

        let updatedUser = await generateUserData(user);
        let networkOutput = await activateNetwork(updatedUser);

        Object.keys(networkOutput).forEach(function(nnId){

          updatedUser.categoryAuto = networkOutput[nnId].output;

          userServerController.findOneUser(updatedUser, {noInc: false, fields: fieldsTransmit}, function(err, dbUser){
            printUserObj("TFE | DB CAT", dbUser, chalkRed);
            process.send({ op: "USER_CATEGORIZED", user: dbUser });
          });

        });

        userCategorizeQueueReady = true;

      }
      catch (err) {
        console.log(chalkError("TFE | *** USER CATEGORIZE ERROR: " + err));
        console.error(err);
        userCategorizeQueueReady = true;
      }



    }

  }, cnf.userCategorizeQueueInterval);
}

function checkUserChanges(params){

  return new Promise(async function(resolve, reject){

    let results = {};
    results.changeFlag = false;
    results.initFlag = false;

    let user = {};
    user = params.user;

    if (user.previousName === undefined) { 
      results.initFlag = true;
      user.previousName = user.name; 
    }
    if (user.previousDescription === undefined) { 
      results.initFlag = true;
      user.previousDescription = user.description; 
    }
    if (user.lastHistogramTweetId === undefined) {
      results.initFlag = true;
      user.lastHistogramTweetId = user.status.id_str;
    }

    if (user.previousName !== user.name) { 
      results.changeFlag = true;
      results.name = user.name;
    }
    if (user.previousDescription !== user.description) { 
      results.changeFlag = true;
      results.description = user.description; 
    }
    if (user.lastHistogramTweetId !== user.status.id_str) { 
      results.changeFlag = true;
      results.status = user.status;
    }

    resolve(results);

  });
}

async function initDbUserChangeStream(params){

  return new Promise(async function(resolve, reject){

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

      userChangeStream.on("change", async function(change){

        if (change && change.fullDocument) { 
          const user = change.fullDocument; 

          const userChanges = await checkUserChanges({user:user});

          if (userChanges.initFlag) {

            user.markModified("previousName");
            user.markModified("previousDescription");
            user.markModified("lastHistogramTweetId");

          }

          if (userChanges.changeFlag) {

            user.changes = userChanges;

            // printUserObj("TFE | ++> USER UPDATE CHANGE | " +  change.operationType, user, chalkAlert);

            userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){
              printUserObj("TFE | ++> USER CHANGE | UPDATE | " +  change.operationType, updatedUser, chalkAlert);
            });

          }
          else if (userChanges.initFlag) {

            // printUserObj("TFE | 00> USER INIT   CHANGE | " +  change.operationType, user, chalkWarn);

            userServerController.findOneUser(user, {noInc: true, fields: fieldsExclude}, function(err, updatedUser){
              printUserObj("TFE | 00> USER CHANGE | INIT   | " +  change.operationType, updatedUser, chalkWarn);
            });

          }
          
          if (configuration.verbose) {
            printUserObj("TFE | --> USER CHANGE | " +  change.operationType, user, chalkLog);
          }

        }
        else {
          console.log(chalkAlert("TFE | XX> USER CHANGE | " +  change.operationType));
        }

      });

      resolve();

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

      process.title = m.title;

      configuration.verbose = m.verbose;
      maxInputHashMap = m.maxInputHashMap;
      normalization = m.normalization;

      const network = neataptic.Network.fromJSON(m.networkObj.network);

      m.networkObj.network = {};
      m.networkObj.network = network;

      networksHashMap.set(m.networkObj.networkId, m.networkObj);

      console.log(chalkInfo("TFE | INIT"
        + " | TITLE: " + process.title
        + " | NETWORK: " + networksHashMap.get(m.networkObj.networkId).networkId
        + " | MAX INPUT HM KEYS: " + Object.keys(maxInputHashMap)
        + " | NORMALIZATION: " + Object.keys(normalization)
      ));

    break;

    case "PING":
      debug(chalkLog("TFE | TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
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
      initUserCategorizeQueueInterval(configuration);
    });

  });
}, 5*ONE_SECOND);


