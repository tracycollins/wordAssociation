/*jslint node: true */
/*jshint sub:true*/
// "use strict";

process.title = "wa_node_child_tfe";

const MODULE_ID_PREFIX = "TFC";

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;

// const DEFAULT_IMAGE_QUOTA_TIMEOUT = ONE_MINUTE;
const DEFAULT_MAX_USER_TWEETIDS = 500;
const DEFAULT_TWEET_FETCH_COUNT = 10;
const DEFAULT_TWEET_FETCH_EXCLUDE_REPLIES = true;
const DEFAULT_TWEET_FETCH_INCLUDE_RETWEETS = false;

const DEFAULT_WORD_MIN_LENGTH = 3;
const DEFAULT_INPUT_TYPES = [
  "emoji",
  "friends",
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


const defaultUserTweetHistograms = {};
const defaultUserProfileHistograms = {};

DEFAULT_INPUT_TYPES.forEach(function(type){
  defaultUserTweetHistograms[type] = {};
  defaultUserProfileHistograms[type] = {};
});

let networkObj = {};
let network;

let maxInputHashMap = {};
let normalization = {};
const globalHistograms = {};

const DEFAULT_INFO_TWITTER_USER = "threecee";
const USER_CAT_QUEUE_MAX_LENGTH = 500;

const USER_CHANGE_CACHE_DEFAULT_TTL = 30;
const USER_CHANGE_CACHE_CHECK_PERIOD = 5;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const ONE_KILOBYTE = 1024;
const ONE_MEGABYTE = 1024 * ONE_KILOBYTE;

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


const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyDBxA6RmuBcyj-t7gfvK61yp8CDNnRLUlc"
});

const MergeHistograms = require("@threeceelabs/mergehistograms");
const mergeHistograms = new MergeHistograms();

const twitterTextParser = require("@threeceelabs/twitter-text-parser");
const twitterImageParser = require("@threeceelabs/twitter-image-parser");

const urlParse = require("url-parse");
const btoa = require("btoa");

const jsonParse = require("json-parse-safe");
const sizeof = require("object-sizeof");

const _ = require("lodash");
const fetchDropbox = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
const Twit = require("twit");
const moment = require("moment");
const treeify = require("treeify");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const neataptic = require("neataptic");
const arrayNormalize = require("array-normalize");
const NodeCache = require("node-cache");

const debug = require("debug")("tfe");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkGreen = chalk.green;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.yellow;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;

const twitterUserHashMap = new HashMap();

const EventEmitter = require("eventemitter3");

class ChildEvents extends EventEmitter {}

const childEvents = new ChildEvents();

const userCategorizeQueue = [];
const userChangeDbQueue = [];

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


let infoTwitterUserObj = {}; // used for general twitter tasks

let configuration = {};
configuration.geoCodeEnabled = false;
configuration.inputsBinaryMode = true;
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.forceImageAnalysis = false;
configuration.enableImageAnalysis = true;
configuration.testMode = false; // per tweet test mode
configuration.userCategorizeQueueInterval = 100;

configuration.enableLanguageAnalysis = true;
configuration.forceLanguageAnalysis = false;

configuration.inputTypes = DEFAULT_INPUT_TYPES;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initTwitterUsersTimeout = Number(ONE_MINUTE);

configuration.twitterConfig = {};
configuration.threeceeUser = "UNDEFINED";

const threeceeUserDefaults = {};

threeceeUserDefaults.id = 0;
threeceeUserDefaults.name = "---";
threeceeUserDefaults.screenName = configuration.threeceeUser;
threeceeUserDefaults.description = "---";
threeceeUserDefaults.url = "---";
threeceeUserDefaults.friendsCount = 0;
threeceeUserDefaults.followersCount = 0;
threeceeUserDefaults.statusesCount = 0;

threeceeUserDefaults.error = false;

threeceeUserDefaults.tweetFetchCount = configuration.tweetFetchCount;
threeceeUserDefaults.fetchCount = configuration.fetchCount;
threeceeUserDefaults.endFetch = false;
threeceeUserDefaults.nextCursor = false;
threeceeUserDefaults.nextCursorValid = false;
threeceeUserDefaults.friendsFetched = 0;
threeceeUserDefaults.percentFetched = 0;

threeceeUserDefaults.twitterRateLimit = {};

const jsonPrint = function (obj){
  if (obj) {
    return treeify.asTree(obj, true, true);
  }
  else {
    return "UNDEFINED";
  }
};

function categoryToString(c) {

  let cs = "";

  switch (c) {
    case "left":
      cs = "L";
    break;
    case "neutral":
      cs = "N";
    break;
    case "right":
      cs = "R";
    break;
    case "positive":
      cs = "+";
    break;
    case "negative":
      cs = "-";
    break;
    case "none":
      cs = "0";
    break;
    case false:
      cs = "false";
    break;
    case undefined:
      cs = "undefined";
    break;
    case null:
      cs = "null";
    break;
    default:
      cs = "?";
  }

  return cs;
}

console.log(
  "\n\n====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID:    " + process.pid 
  + "\nPROCESS TITLE: " + process.title 
  + "\nPROCESS NAME:  " + process.title 
  + "\n" + "====================================================================================================\n" 
);

if (debug.enabled) {
  console.log("*** WAS | TFC\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

function msToTime(dur) {

  let sign = 1;
  let duration = dur;

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

statsObj.google = {};
statsObj.google.vision = {};
statsObj.google.vision.imagesParsed = 0;
statsObj.google.vision.errors = 0;
statsObj.google.vision.imageAnalysisQuotaFlag = false;

statsObj.autoChangeMatch = 0;
statsObj.autoChangeMismatch = 0;
statsObj.autoChangeTotal = 0;
statsObj.autoChangeMatchRate = 0;

statsObj.user = {};
statsObj.user.changes = 0;

statsObj.queues = {};

statsObj.twitter = {};
statsObj.twitter.tweetsHits = 0;
statsObj.twitter.tweetsProcessed = 0;
statsObj.twitter.tweetsTotal = 0;

statsObj.geo = {};
statsObj.geo.misses = 0;
statsObj.geo.hits = 0;
statsObj.geo.hitRate = 0;
statsObj.geo.total = 0;

statsObj.analyzer = {};
statsObj.analyzer.total = 0;
statsObj.analyzer.analyzed = 0;
statsObj.analyzer.skipped = 0;
statsObj.analyzer.errors = 0;

global.globalDbConnection = false;
// global.globalUser;

global.globalWordAssoDb = require("@threeceelabs/mongoose-twitter");

const emojiModel = require("@threeceelabs/mongoose-twitter/models/emoji.server.model");
const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const locationModel = require("@threeceelabs/mongoose-twitter/models/location.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

let dbConnectionReady = false;
let dbConnectionReadyInterval;

const UserServerController = require("@threeceelabs/user-server-controller");
let userServerController;
let userServerControllerReady = false;

const TweetServerController = require("@threeceelabs/tweet-server-controller");
let tweetServerController;

// ==================================================================
// USER CHANGE CACHE
// ==================================================================
let userChangeCacheTtl = process.env.USER_CHANGE_CACHE_DEFAULT_TTL;
if (userChangeCacheTtl === undefined) { userChangeCacheTtl = USER_CHANGE_CACHE_DEFAULT_TTL; }

console.log("WAS | TFC | USER CHANGE CACHE TTL: " + userChangeCacheTtl + " SECONDS");

let userChangeCacheCheckPeriod = process.env.USER_CHANGE_CACHE_CHECK_PERIOD;
if (userChangeCacheCheckPeriod === undefined) { userChangeCacheCheckPeriod = USER_CHANGE_CACHE_CHECK_PERIOD; }

console.log("WAS | TFC | userChange CACHE CHECK PERIOD: " + userChangeCacheCheckPeriod + " SECONDS");

const userChangeCache = new NodeCache({
  stdTTL: userChangeCacheTtl,
  checkperiod: userChangeCacheCheckPeriod
});

function userChangeCacheExpired(userChangeCacheId, changeObj) {

  debug(chalkLog("WAS | TFC | XXX USER CHANGE CACHE EXPIRED"
    + " | TTL: " + userChangeCacheTtl + " SECS"
    + " | " + userChangeCacheId
    + " | UID: " + changeObj.user.userId
    + " | @" + changeObj.user.screenName
  ));

}

userChangeCache.on("expired", userChangeCacheExpired);


// ==================================================================
// MONGO DB
// ==================================================================
function connectDb(){

  return new Promise(function(resolve, reject){

    try {

      statsObj.status = "CONNECT DB";

      global.globalWordAssoDb.connect("TFC_" + process.pid, function(err, db){

        if (err) {
          console.log(chalkError("WAS | TFC | *** MONGO DB CONNECTION ERROR: " + err));
          statsObj.status = "MONGO CONNECTION ERROR";
          dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("close", function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "WAS | TFC | *** MONGO DB CONNECTION CLOSED ***");
          console.log(chalkError("WAS | TFC | *** MONGO DB CONNECTION CLOSED ***"));
          dbConnectionReady = false;
        });

        db.on("error", function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "WAS | TFC | *** MONGO DB CONNECTION ERROR ***");
          console.log(chalkError("WAS | TFC | *** MONGO DB CONNECTION ERROR ***"));
          dbConnectionReady = false;
        });

        db.on("disconnected", function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "WAS | TFC | *** MONGO DB DISCONNECTED ***");
          console.log(chalkAlert("WAS | TFC | *** MONGO DB DISCONNECTED ***"));
          dbConnectionReady = false;
        });

        global.globalDbConnection = db;

        console.log(chalk.green("WAS | TFC | MONGOOSE DEFAULT CONNECTION OPEN"));

        global.globalEmoji = global.globalDbConnection.model("Emoji", emojiModel.EmojiSchema);
        global.globalHashtag = global.globalDbConnection.model("Hashtag", hashtagModel.HashtagSchema);
        global.globalLocation = global.globalDbConnection.model("Location", locationModel.LocationSchema);
        global.globalMedia = global.globalDbConnection.model("Media", mediaModel.MediaSchema);
        global.globalNeuralNetwork = global.globalDbConnection.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
        global.globalPlace = global.globalDbConnection.model("Place", placeModel.PlaceSchema);
        global.globalTweet = global.globalDbConnection.model("Tweet", tweetModel.TweetSchema);
        global.globalUrl = global.globalDbConnection.model("Url", urlModel.UrlSchema);
        global.globalUser = global.globalDbConnection.model("User", userModel.UserSchema);
        global.globalWord = global.globalDbConnection.model("Word", wordModel.WordSchema);

        userServerController = new UserServerController("TFC_USC");

        tweetServerController = new TweetServerController("TFC_TSC");

        tweetServerController.on("ready", function(appname){
          console.log(chalkLog("WAS | TFC | TSC READY | " + appname));
        });

        tweetServerController.on("error", function(err){
          console.trace(chalkError("WAS | TFC | *** TSC ERROR | " + err));
        });

        userServerControllerReady = false;
        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";

          userServerControllerReady = true;
          console.log(chalkLog("WAS | TFC | USC READY | " + appname));
          dbConnectionReady = true;

          resolve(db);

        });
      });

    }
    catch(err){
      console.log(chalkError("WAS | TFC | *** MONGO DB CONNECT ERROR: " + err));
      reject(err);
    }
  });
}


// ==================================================================
// DROPBOX
// ==================================================================

const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN;
const DROPBOX_TFE_CONFIG_FILE = process.env.DROPBOX_TFE_CONFIG_FILE || "tfeChildConfig.json";
const DROPBOX_TFE_STATS_FILE = process.env.DROPBOX_TFE_STATS_FILE || "tfeChildStats.json";

const dropboxConfigFolder = "/config/utility";
const dropboxConfigHostFolder = "/config/utility/" + hostname;

const dropboxConfigFile = hostname + "_" + DROPBOX_TFE_CONFIG_FILE;
const statsFolder = "/stats/" + hostname + "/followerExplorer";
const statsFile = DROPBOX_TFE_STATS_FILE;

console.log("WAS | TFC | DROPBOX_TFE_CONFIG_FILE: " + DROPBOX_TFE_CONFIG_FILE);
console.log("WAS | TFC | DROPBOX_TFE_STATS_FILE : " + DROPBOX_TFE_STATS_FILE);

debug("WAS | TFC | dropboxConfigFolder : " + dropboxConfigFolder);
debug("WAS | TFC | dropboxConfigFile : " + dropboxConfigFile);

debug("WAS | TFC | statsFolder : " + statsFolder);
debug("WAS | TFC | statsFile : " + statsFile);

const dropboxClient = new Dropbox({ 
  accessToken: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
  fetch: fetchDropbox
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
    console.log(chalkAlert("WAS | TFC | *** getTimeStamp INVALID DATE: " + inputTime));
    return null;
  }
}

function showStats(options){

  statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
  statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options) {
    console.log("WAS | TFC | STATS\n" + jsonPrint(statsObj));
  }
  else {
    console.log(chalkLog("WAS | TFC | S"
      + " | ELPSD " + msToTime(statsObj.elapsed)
      + " | START " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | UC$: " + userChangeCache.getStats().keys
      + " | UCDBQ: " + userChangeDbQueue.length
      + " | UCATQ: " + userCategorizeQueue.length
      + " | AUTO CHG M " + statsObj.autoChangeMatch
      + " MM: " + statsObj.autoChangeMismatch
      + " TOT: " + statsObj.autoChangeTotal
      + " RATE: " + statsObj.autoChangeMatchRate.toFixed(2)
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

  console.error("WAS | TFC | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if ((global.globalDbConnection !== undefined) && (global.globalDbConnection.readyState > 0)) {

    global.globalDbConnection.close(function () {
      
      console.log(chalkAlert(
            "WAS | TFC | =========================="
        + "\nTFE | MONGO DB CONNECTION CLOSED"
        + "\nTFE | =========================="
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

  debug(chalkInfo("WAS | TFC | SAVE FOLDER " + path));
  debug(chalkInfo("WAS | TFC | SAVE FILE " + file));
  debug(chalkInfo("WAS | TFC | FULL PATH " + fullPath));

  const options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options).
    then(function(response){
      debug(chalkLog("WAS | TFC | ... SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    }).
    catch(function(error){
      console.error(chalkError("WAS | TFC | " + moment().format(defaultDateTimeFormat)
        + " | !!! ERROR DROBOX FILE UPLOAD | FILE: " + fullPath 
      ));
      console.log("*** WAS | TFC DROPBOX FILE UPLOAD ERROR", error);
      console.error("*** WAS | TFC DROPBOX FILE UPLOAD ERROR", error);
      callback(error.error, null);
    });
}

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

        if (fullPath.match(/\.json$/gi)) {

          const payload = data.fileBinary;

          if (!payload || (payload === undefined)) {
            return reject(new Error(MODULE_ID_PREFIX + " LOAD FILE PAYLOAD UNDEFINED"));
          }

          const results = jsonParse(payload);

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
        else {
          resolve();
        }
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

function initStatsUpdate(cnf){

  return new Promise(function(resolve, reject){

    console.log(chalkInfo("WAS | TFC | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

    try{

      setInterval(async function () {

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;
        statsObj.timeStamp = moment().format(defaultDateTimeFormat);

        saveFile(statsFolder, statsFile, statsObj, function(){
          showStats();
        });

        try{
          await checkTwitterRateLimitAll();
        }
        catch(err){
           console.log(chalkError("WAS | TFC | *** CHECK RATE LIMIT ERROR: " + err));
        }

      }, cnf.statsUpdateIntervalTime);

      resolve(cnf);
    }
    catch(err){
      reject(err);
    }

  });
}

function printUserObj(title, u, chalkConfig) {

  const curChalk = chalkConfig || chalkLog;

  const user = userDefaults(u);

  console.log(curChalk(title
    + " | C M: " + categoryToString(user.category) + " - A: " + categoryToString(user.categoryAuto)
    + " | " + user.rate.toFixed(3) + " TPM"
    + " | @" + user.screenName
    + " | N: " + user.name 
    + " | " + user.userId
    + " | IG: " + user.ignored 
    + " | 3C: " + user.threeceeFollowing 
    + " | PRIORITY: " + user.priorityFlag 
  ));

  if (user.changes) {
    console.log(curChalk(title
    + "\nCHANGES\n" + jsonPrint(user.changes)
    ));
  }
}

const userDefaults = function (user){

  if (!user.rate || user.rate === undefined) { 
    user.rate = 0;
  }

  if (!user.profileHistograms || user.profileHistograms === undefined) { 
    user.profileHistograms = defaultUserProfileHistograms;
  }
  
  if (!user.tweetHistograms || user.tweetHistograms === undefined) { 
    user.tweetHistograms = defaultUserTweetHistograms;
  }
  
  return user;
};

function initInfoTwit(params){

  return new Promise(async function(resolve, reject){

    console.log(chalkTwitter("WAS | TFC | INIT INFO USER @" + params.screenName));

    const twitterConfigFile = params.screenName + ".json";

    let twitterConfig;

    try {
      twitterConfig = await loadFileRetry({folder: configuration.twitterConfigFolder, file: twitterConfigFile});

      if (!twitterConfig){
        console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
          + " | " + configuration.twitterConfigFolder + "/" + twitterConfigFile
        ));
        return reject(new Error("TWITTER CONFIG FILE NOT FOUND"));
      }
    }
    catch (err){
      console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
      return reject(err);
    }

    debug(chalkTwitter("WAS | TFC | INFO TWITTER USER CONFIG\n" + jsonPrint(twitterConfig)));

    const twitterUserObj = {};

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

    twitterUserObj.screenName = twitterConfig.screenName;
    twitterUserObj.twitterConfig = {};
    twitterUserObj.twitterConfig = twitterConfig;

    const newTwit = new Twit({
      consumer_key: twitterConfig.CONSUMER_KEY,
      consumer_secret: twitterConfig.CONSUMER_SECRET,
      access_token: twitterConfig.TOKEN,
      access_token_secret: twitterConfig.TOKEN_SECRET
    });

    twitterUserObj.twit = {};
    twitterUserObj.twit = newTwit;

    console.log(chalkTwitter("WAS | TFC | INIT INFO TWITTER USER"
      + " | NAME: " + twitterConfig.screenName
    ));

    try {
      const tuObj = await checkTwitterRateLimit({twitterUserObj: twitterUserObj});
      resolve(tuObj);
    }
    catch(err){
      console.log(chalkTwitter("WAS | TFC | *** INIT INFO TWITTER USER | checkTwitterRateLimit ERROR: " + err));
      reject(err);
    }

  });
}

function checkTwitterRateLimit(params){

  return new Promise(function(resolve, reject){

    const twitterUserObj = params.twitterUserObj;

    if ((twitterUserObj === undefined) || (twitterUserObj.twit === undefined)) {
      return reject(new Error("INVALID PARAMS"));
    }

    twitterUserObj.twit.get("application/rate_limit_status", function(err, data, response) {
      
      if (err){

        console.log(chalkError("WAS | TFC | *** TWITTER ACCOUNT ERROR"
          + " | @" + twitterUserObj.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

        if (configuration.verbose) {
          console.log(chalkError("WAS | TFC | *** TWITTER ACCOUNT ERROR\nresponse\n" + jsonPrint(response)));
        }

        twitterUserObj.stats.error = err;
        twitterUserObj.stats.twitterErrors += 1;
        twitterUserObj.stats.ready = false;

        return reject(err);
      }

      twitterUserObj.stats.error = false;

      if (configuration.verbose) {
        console.log(chalkLog("WAS | TFC | TWITTER RATE LIMIT STATUS"
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
          
          console.log(chalkInfo("WAS | TFC | XXX RESET TWITTER RATE LIMIT"
            + " | @" + twitterUserObj.screenName
            + " | CONTEXT: " + data.rate_limit_context.access_token
            + " | LIM: " + twitterUserObj.stats.twitterRateLimit
            + " | REM: " + twitterUserObj.stats.twitterRateLimitRemaining
            // + " | EXP: " + twitterUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
            + " | NOW: " + moment().format(compactDateTimeFormat)
          ));
        }

        return resolve(twitterUserObj);

      }

      twitterUserObj.stats.ready = false;
      twitterUserObj.stats.twitterRateLimitExceptionFlag = true;

      twitterUserObj.stats.twitterRateLimit = data.resources.users["/users/show/:id"].limit;
      twitterUserObj.stats.twitterRateLimitRemaining = data.resources.users["/users/show/:id"].remaining;
      twitterUserObj.stats.twitterRateLimitResetAt = moment.unix(data.resources.users["/users/show/:id"].reset).valueOf();
      twitterUserObj.stats.twitterRateLimitRemainingTime = moment(twitterUserObj.stats.twitterRateLimitResetAt).diff(moment());

      console.log(chalkLog("WAS | TFC | --- TWITTER RATE LIMIT"
        + " | @" + twitterUserObj.screenName
        + " | CONTEXT: " + data.rate_limit_context.access_token
        + " | LIM: " + twitterUserObj.stats.twitterRateLimit
        + " | REM: " + twitterUserObj.stats.twitterRateLimitRemaining
        // + " | EXP: " + twitterUserObj.stats.twitterRateLimitException.format(compactDateTimeFormat)
        + " | RST: " + moment(twitterUserObj.stats.twitterRateLimitResetAt).format(compactDateTimeFormat)
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | IN " + msToTime(twitterUserObj.stats.twitterRateLimitRemainingTime)
      ));

      resolve(twitterUserObj);

    });

  });
}

function checkTwitterRateLimitAll(){

  return new Promise(function(resolve, reject){

    if (twitterUserHashMap.size === 0) { return resolve(); }

    async.eachSeries(twitterUserHashMap.values(), async function(twitterUserObj){

      const tuObj = await checkTwitterRateLimit({twitterUserObj: twitterUserObj});
      if (tuObj) { twitterUserHashMap.set(tuObj.screenName, tuObj); }
      return;

    }, function(err){

      if (err){
        console.log(chalkError("WAS | TFC | *** CHECK RATE LIMIT ERROR: " + err));
        return reject(err);
      }

      resolve();
    });

  });
}

function generateObjFromArray(params){

  return new Promise(async function(resolve){

    const keys = params.keys || [];
    const value = params.value || 0;
    const result = {};

    async.each(keys, function(key, cb){
      result[key.toString()] = value;
      cb();
    }, function(){
      resolve(result);
    });

  });
}

let userCategorizeQueueReady = true;
let userCategorizeQueueInterval;

function generateNetworkInputIndexed(params){

  return new Promise(function(resolve, reject){

    const maxInputHashMap = params.maxInputHashMap;

    const inputTypes = Object.keys(params.inputsObj.inputs).sort();
    const networkInput = [];

    let indexOffset = 0;

    async.eachSeries(inputTypes, function(inputType, cb0){

      debug("RNT | GENERATE NET INPUT | TYPE: " + inputType);

      const histogramObj = params.histograms[inputType];
      const networkInputTypeNames = params.inputsObj.inputs[inputType];

      async.eachOf(networkInputTypeNames, function(inputName, index, cb1){

        if (histogramObj && (histogramObj[inputName] !== undefined)) {

          if (configuration.inputsBinaryMode) {

            networkInput[indexOffset + index] = 1;

            return cb1();
          }

          if (maxInputHashMap[inputType] === undefined) {

            maxInputHashMap[inputType] = {};
            maxInputHashMap[inputType][inputName] = histogramObj[inputName];

            networkInput[indexOffset + index] = 1;

            console.log(chalkLog("RNT | MAX INPUT TYPE UNDEFINED"
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

            // generate maxInputHashMap on the fly if needed
            // should backfill previous input values when new max is found

            if (maxInputHashMap[inputType][inputName] === undefined) {

              maxInputHashMap[inputType][inputName] = histogramObj[inputName];

              console.log(chalkLog("RNT | MAX INPUT NAME UNDEFINED"
                + " | IN ID: " + params.inputsObj.inputsId
                + " | IN LENGTH: " + networkInput.length
                + " | @" + params.userScreenName
                + " | TYPE: " + inputType
                + " | " + inputName
                + " | " + histogramObj[inputName]
              ));
            }
            else if (histogramObj[inputName] > maxInputHashMap[inputType][inputName]) {

              const previousMaxInput = maxInputHashMap[inputType][inputName]; 

              maxInputHashMap[inputType][inputName] = histogramObj[inputName];

              console.log(chalkLog("RNT | MAX INPUT VALUE UPDATED"
                + " | IN ID: " + params.inputsObj.inputsId
                + " | CURR IN INDEX: " + networkInput.length + "/" + params.inputsObj.meta.numInputs
                + " | @" + params.userScreenName
                + " | TYPE: " + inputType
                + " | " + inputName
                + " | PREV MAX: " + previousMaxInput
                + " | CURR MAX: " + maxInputHashMap[inputType][inputName]
              ));
            }

            networkInput[indexOffset + index] = (maxInputHashMap[inputType][inputName] > 0) 
              ? histogramObj[inputName]/maxInputHashMap[inputType][inputName] 
              : 1;

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

        if (err) {
          console.log(chalkError("TFC | generateNetworkInputIndexed ERROR: " + err));
          return cb0(err);
        }

        async.setImmediate(function() { 
          indexOffset += networkInputTypeNames.length;
          cb0(); 
        });

      });

    }, function(err){
      if (err) { return reject(err); }
      resolve(networkInput);
    });

  });
}

function indexOfMax (arr) {

  return new Promise(function(resolve, reject){

    if (arr.length === 0) {
      console.log(chalkAlert("RNT | indexOfMax: 0 LENG ARRAY: -1"));
      return reject(new Error("0 LENG ARRAY"));
    }
    if ((arr[0] === arr[1]) && (arr[1] === arr[2])){
      return resolve(-1);
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
      resolve(maxIndex); 
    });

  });
}

function printNetworkInput(params){

  return new Promise(function(resolve, reject){

    const inputArray = params.inputsObj.input;
    const nameArray = params.inputsObj.name;
    const columns = params.columns || 100;

    let col = 0;

    let hitRowArray = [];

    let inputText = ".";
    let text = "";
    let textRow = "";
    let hits = 0;
    let hitRate = 0;
    const inputArraySize = inputArray.length;

    async.eachOfSeries(inputArray, function(input, index, cb){

      if (input) {
        inputText = "X";
        hits += 1;
        hitRate = 100 * hits / inputArraySize;
        hitRowArray.push(nameArray[index]);
      }
      else {
        inputText = ".";
      }

      textRow += inputText;
      col += 1;

      if ((col === columns) || ((index+1) === inputArraySize)){

        text += textRow;
        text += " | " + hitRowArray;
        text += "\n";

        textRow = "";
        col = 0;
        hitRowArray = [];
      }

      cb();

    }, function(err){
      if (err) {
        return reject(err);
      }
      resolve();
      console.log(chalkLog(
        "______________________________________________________________________________________________________________________________________"
        + "\n" + hits + " / " + inputArraySize + " | HIT RATE: " + hitRate.toFixed(2) + "% | " + params.title
        + "\n" + text
        ));
    });

  });
}

const networkOutput = {};
networkOutput.output = [];
networkOutput.left = 0;
networkOutput.neutral = 0;
networkOutput.right = 0;
networkOutput.none = 0;
networkOutput.positive = 0;
networkOutput.negative = 0;

function activateNetwork(params){

  return new Promise(async function(resolve, reject) {

    if (!params.user || params.user === undefined) { return reject(new Error("user undefined")); }

    const user = params.user;

    user.friends = user.friends || [];
    user.profileHistograms = user.profileHistograms || {};
    user.tweetHistograms = user.tweetHistograms || {};
    user.languageAnalysis = user.languageAnalysis || {};

    let mergedUserHistograms = {};
    mergedUserHistograms.friends = {};

    try {

      mergedUserHistograms = await mergeHistograms.merge({ histogramA: user.profileHistograms, histogramB: user.tweetHistograms });
      mergedUserHistograms.friends = await generateObjFromArray({ keys: user.friends, value: 1 }); // [ 1,2,3... ] => { 1:1, 2:1, 3:1, ... }

      if (networkObj.inputsObj.inputs === undefined) {
        console.log(chalkError("UNDEFINED NETWORK INPUTS OBJ | NETWORK OBJ KEYS: " + Object.keys(networkObj)));
        const err = new Error("UNDEFINED NETWORK INPUTS OBJ");
        console.error(err);
        return reject(err);
      }

      const generateNetworkInputIndexedParams = {
        networkId: networkObj.networkId,
        userScreenName: user.screenName,
        histograms: mergedUserHistograms,
        languageAnalysis: user.languageAnalysis,
        inputsObj: networkObj.inputsObj,
        maxInputHashMap: maxInputHashMap
      };

      const networkInput = await generateNetworkInputIndexed(generateNetworkInputIndexedParams);

      const output = network.activate(networkInput);

      if (output.length !== 3) {
        console.log(chalkError("RNT | *** ZERO LENGTH NETWORK OUTPUT | " + networkObj.networkId ));
        return reject(new Error("ZERO LENGTH NETWORK OUTPUT"));
      }

      const maxOutputIndex = await indexOfMax(output);

      let categoryAuto;

      switch (maxOutputIndex) {
        case 0:
          categoryAuto = "left";
          networkOutput.left += 1;
        break;
        case 1:
          categoryAuto = "neutral";
          networkOutput.neutral += 1;
        break;
        case 2:
          categoryAuto = "right";
          networkOutput.right += 1;
        break;
        default:
          categoryAuto = "none";
          networkOutput.none += 1;
      }

      networkOutput.output = categoryAuto;

      if (configuration.verbose) {
        printNetworkInput({title: params.user.screenName + " | C: " + params.user.category + " | A: " + categoryAuto , inputArray: networkInput});
      }

      resolve(networkOutput);

    }
    catch(err){
      console.log(chalkError("RNT | *** ERROR ACTIVATE NETWORK: " + err));
      return reject(err);
    }

  });
}

function updateGlobalHistograms(params) {

  return new Promise(async function(resolve, reject){

    statsObj.status = "UPDATE GLOBAL HISTOGRAMS";

    let mergedHistograms = {};

    try {
      mergedHistograms = await mergeHistograms.merge({ histogramA: params.user.profileHistograms, histogramB: params.user.tweetHistograms });
      mergedHistograms.friends = await generateObjFromArray({ keys: params.user.friends, value: 1 }); // [ 1,2,3... ] => { 1:1, 2:1, 3:1, ... }
    }
    catch(err){
      console.log(chalkError("WAS | TFC | *** UPDATE GLOBAL HISTOGRAMS ERROR: " + err));
      return reject(err);
    }

    async.each(DEFAULT_INPUT_TYPES, function(inputType, cb0) {

      if (!mergedHistograms[inputType] || (mergedHistograms[inputType] === undefined)){
        return cb0();
      }

      if (globalHistograms[inputType] === undefined) { globalHistograms[inputType] = {}; }

      async.each(Object.keys(mergedHistograms[inputType]), function(item, cb1) {

        if (globalHistograms[inputType][item] === undefined) {
          globalHistograms[inputType][item] = {};
          globalHistograms[inputType][item].total = 0;
          globalHistograms[inputType][item].left = 0;
          globalHistograms[inputType][item].neutral = 0;
          globalHistograms[inputType][item].right = 0;
          globalHistograms[inputType][item].positive = 0;
          globalHistograms[inputType][item].negative = 0;
          globalHistograms[inputType][item].none = 0;
          globalHistograms[inputType][item].uncategorized = 0;
        }

        globalHistograms[inputType][item].total += 1;

        if (params.user.category) {
          if (params.user.category === "left") { globalHistograms[inputType][item].left += 1; }
          if (params.user.category === "neutral") { globalHistograms[inputType][item].neutral += 1; }
          if (params.user.category === "right") { globalHistograms[inputType][item].right += 1; }
          if (params.user.category === "positive") { globalHistograms[inputType][item].positive += 1; }
          if (params.user.category === "negative") { globalHistograms[inputType][item].negative += 1; }
          if (params.user.category === "none") { globalHistograms[inputType][item].none += 1; }
        }
        else {
          globalHistograms[inputType][item].uncategorized += 1;
        }

        cb1();

      }, function(err) {

        if (err) { return reject(err); }

        cb0();

      });

    }, function(err) {

      if (err) { return reject(err); }

      resolve();

    });

  });
}

function parseImage(p){

  return new Promise(async function(resolve, reject) {

    const params = p;

    params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
    params.category = params.user.category || "none";
    params.histograms = params.user.histograms;
    params.screenName = params.user.screenName;

    try{
      const hist = await twitterImageParser.parseImage(params);
      console.log(chalkLog("WAS | TFE | +++ IMAGE PARSE" 
        + " | CAT: " + params.category
        + " | @" + params.screenName
        + " | " + params.imageUrl
        + "\n" + jsonPrint(hist)
      ));
      resolve(hist);
    }
    catch(err){
      if (err.code === 8) {
        console.log(chalkAlert("WAS | TFC | GOOGLE VISION IMAGE PARSER QUOTA ERROR"));
      }
      else{
        console.log(chalkError("WAS | TFC | GOOGLE VISION IMAGE PARSER ERROR: " + err));
      }
      reject(err);
    }

    then(function(hist){
    }).
    catch(function(err){
    });

  });
}

function parseText(params){

  return new Promise(function(resolve, reject) {

    params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
    params.category = (params.user && params.user.category) ? params.user.category : "none";
    params.minWordLength = params.minWordLength || DEFAULT_WORD_MIN_LENGTH;

    twitterTextParser.parseText(params).
    then(function(hist){
      resolve(hist);
    }).
    catch(function(err){
      console.log(chalkError("*** TWITTER TEXT PARSER ERROR: " + err));
      console.error(err);
      reject(err);
    });

  });
}

function geoCode(params) {

  return new Promise(function(resolve, reject){

    const components = {};
    let placeId = false;
    let formattedAddress;
    let geoValid = false;

    googleMapsClient.geocode({ address: params.address }, function(err, response) {
      if (err) {
        console.log(chalkError("TCS | *** GEOCODE ERROR\n", jsonPrint(err)));
        return reject(err);
      }
      if (response.json.results.length > 0) {

        geoValid = true;
        placeId = response.json.results[0].place_id;
        formattedAddress = response.json.results[0].formatted_address;

        debug(chalkLog("TCS | GEOCODE"
          + " | " + params.address
          + " | PLACE ID: " + placeId
          + " | FORMATTED: " + response.json.results[0].formatted_address
        ));

        async.each(response.json.results[0].address_components, function(addressComponent, cb0){

          if (!addressComponent.types || addressComponent.types === undefined || addressComponent.types.length === 0){
            async.setImmediate(function() { return cb0(); });
          }

          async.eachOf(addressComponent.types, function(addressComponentType, index, cb1){
            switch(addressComponentType){
              case "country":
              case "locality":
              case "sublocality":
              case "sublocality_level_1":
              case "administrative_area_level_1":
              case "administrative_area_level_2":
              case "administrative_area_level_3":
                components[addressComponentType] = addressComponent.long_name;

                debug(chalkInfo("TCS | GEOCODE | +++ ADDRESS COMPONENT"
                  + " | " + params.address
                  + " | FORMATTED: " + response.json.results[0].formatted_address
                  + " | TYPE: " + addressComponentType
                  + " | " + components[addressComponentType]
                ));

              break;
              default:
            }
            cb1();
          }, function(){
            async.setImmediate(function() { cb0(); });
          });

        }, function(err){
          if (err) {

            console.log(chalkError("TCS | *** GEOCODE ERROR: " + err));
            return reject(err);
          }

          debug(chalkLog("TCS | GEOCODE"
            + " | " + params.address
            + " | PLACE ID: " + placeId
            + " | FORMATTED: " + response.json.results[0].formatted_address
            // + "\n" + jsonPrint(response.json)
          ));

          resolve({
            address: params.address,
            geoValid: geoValid,
            placeId: placeId, 
            formattedAddress: formattedAddress, 
            components: components, 
            raw: response.json 
          });
        });
      }
      else {
        resolve({ 
          geoValid: geoValid,
          address: params.address,
          placeId: placeId, 
          formattedAddress: formattedAddress, 
          components: components, 
          raw: response.json 
        });
      }

    });

  });
}

function mergeHistogramsArray(params) {
  return new Promise(function(resolve, reject){

    let resultHistogram = {};

    async.eachSeries(params.histogramArray, async function(histogram){
      
      try {
        resultHistogram = await mergeHistograms.merge({ histogramA: resultHistogram, histogramB: histogram });
        return;
      }
      catch(err){
        return err;
      }

    }, function(err){
      if (err) {
        return reject(err);
      }
      resolve(resultHistogram);
    })
  });
}

function checkPropertyChange(user, prop){
  const prevProp = "previous" + _.upperFirst(prop);
  if (user[prop] && (user[prop] !== undefined) && (user[prevProp] !== user[prop])) { return true; }
  return false;
}

function allHistogramsZeroKeys(histogram){

  return new Promise(function(resolve, reject){

    if (!histogram) {
      return reject(new Error("histogram undefined"));
    }

    Object.keys(histogram).forEach(function(histogramType){
      if (Object.keys(histogram[histogramType]).length > 0) { return resolve(false); }
    });

    resolve(true);

  });
}

function checkUserProfileChanged(params) {

  return new Promise(async function(resolve, reject){

    const user = params.user;

    let allHistogramsZero = false;

    try{
      allHistogramsZero = await allHistogramsZeroKeys(user.profileHistograms);
    }
    catch(err){
      console.log(chalkError("WAS | TFC | *** ALL HISTOGRAMS ZERO ERROR: " + err));
      return reject(err);
    }

    if (!user.profileHistograms 
      || (user.profileHistograms === undefined) 
      || (user.profileHistograms === {})
      || (Object.keys(user.profileHistograms).length === 0)
      || allHistogramsZero
    ){

      if (configuration.verbose) {
        console.log(chalkLog(
          "WAS | TFC | USER PROFILE HISTOGRAMS UNDEFINED" 
          + " | RST PREV PROP VALUES" 
          + " | @" + user.screenName 
        ));
      }

      user.previousProfileImageUrl = null;
      user.previousBannerImageUrl = null;
      user.previousDescription = null;
      user.previousExpandedUrl = null;
      user.previousLocation = null;
      user.previousName = null;
      user.previousProfileUrl = null;
      user.previousScreenName = null;
      user.previousUrl = null;
    }

    const results = [];

    if (checkPropertyChange(user, "profileImageUrl")) { results.push("profileImageUrl"); }
    if (checkPropertyChange(user, "bannerImageUrl")) { results.push("bannerImageUrl"); }
    if (checkPropertyChange(user, "description")) { results.push("description"); }
    if (checkPropertyChange(user, "expandedUrl")) { results.push("expandedUrl"); }
    if (checkPropertyChange(user, "location")) { results.push("location"); }
    if (checkPropertyChange(user, "name")) { results.push("name"); }
    if (checkPropertyChange(user, "profileUrl")) { results.push("profileUrl"); }
    if (checkPropertyChange(user, "screenName")) { results.push("screenName"); }
    if (checkPropertyChange(user, "url")) { results.push("url"); }

    if (results.length === 0) { return resolve(); }
    resolve(results);    
  });
}

function processTweetObj(params){

  return new Promise(async function(resolve, reject){

    const tweetObj = params.tweetObj;
    const histograms = params.histograms;

    async.eachSeries(DEFAULT_INPUT_TYPES, function(entityType, cb0){

      if (!entityType || entityType === undefined) {
        console.log(chalkAlert("WAS | TFC | ??? UNDEFINED TWEET entityType: ", entityType));
        return cb0();
      }

      if (entityType === "user") { return cb0(); }
      if (!tweetObj[entityType] || tweetObj[entityType] === undefined) { return cb0(); }
      if (tweetObj[entityType].length === 0) { return cb0(); }

      async.eachSeries(tweetObj[entityType], function(entityObj, cb1){

        if (!entityObj) {
          debug(chalkInfo("WAS | TFC | !!! NULL entity? | ENTITY TYPE: " + entityType + " | entityObj: " + entityObj));
          return cb1();
        }

        let entity;

        switch (entityType) {
          case "hashtags":
            entity = "#" + entityObj.nodeId.toLowerCase();
          break;
          case "mentions":
          case "userMentions":
            entity = "@" + entityObj.screenName.toLowerCase();
          break;
          case "locations":
            entity = entityObj.nodeId;
          break;
          case "images":
          case "media":
            entity = entityObj.nodeId;
          break;
          case "emoji":
            entity = entityObj.nodeId;
          break;
          case "urls":
            if (entityObj.nodeId.includes(".")) { 
              entity = btoa(entityObj.nodeId);
            }
            else{
              entity = entityObj.nodeId;
            }
          break;
          case "words":
            entity = entityObj.nodeId.toLowerCase();
            entity = entity.replace(/\./gi, "_")
          break;
          case "places":
            entity = entityObj.nodeId;
          break;
          default:
            console.log(chalkAlert("TFC | *** UNDEFINED ENTITY TYPE: " + entityType));
        }

        if (!histograms[entityType] || (histograms[entityType] === undefined)){
          histograms[entityType] = {};
          histograms[entityType][entity] = 1;
        }

        if (!histograms[entityType][entity] || (histograms[entityType][entity] === undefined)){
          histograms[entityType][entity] = 1;
        }

        async.setImmediate(function() { cb1(); });

      }, function(){

        async.setImmediate(function() { cb0(); });

      });
    }, function(err){

      if (err) {
        return reject(err);
      }

      resolve(histograms);

    });

  });
}

function updateUserTweets(params){

  return new Promise(function(resolve, reject){

    if (params.tweets.length === 0) { return resolve(params.user); }

    const user = params.user;
    if (user.tweetHistograms === undefined) { user.tweetHistograms = {}; }
    if (user.tweets === undefined) { 
      user.tweets = {};
      user.tweets.maxId = "0";
      user.tweets.sinceId = "0";
      user.tweets.tweetIds = [];
    }

    user.tweets.maxId = user.tweets.maxId || "0";
    user.tweets.sinceId = user.tweets.sinceId || "0";
    user.tweets.tweetIds = user.tweets.tweetIds || [];

    if (user.tweetHistograms === undefined) { user.tweetHistograms = {}; }

    const tscParams = {};

    tscParams.globalTestMode = configuration.globalTestMode;
    tscParams.testMode = configuration.testMode;
    tscParams.inc = false;
    tscParams.twitterEvents = configEvents;
    tscParams.tweetStatus = {};

    let tweetsProcessed = 0;

    if (user.tweets.tweetIds.length > DEFAULT_MAX_USER_TWEETIDS) {

      const length = user.tweets.tweetIds.length;
      const removeNumber = length - DEFAULT_MAX_USER_TWEETIDS;

      debug(chalkLog("WAS | TFC | --- USER TWEETS > DEFAULT_MAX_USER_TWEETIDS"
        + " | " + user.nodeId
        + " | @" + user.screenName
        + " | " + length + " TWEETS"
        + " | REMOVE: " + removeNumber
      ));

      user.tweets.tweetIds.splice(0,removeNumber);
    }

    async.eachSeries(params.tweets, async function(tweet){

      tscParams.tweetStatus = tweet;
      tscParams.tweetStatus.user = {};
      tscParams.tweetStatus.user = user;
      tscParams.tweetStatus.user.isNotRaw = true;

      if (tweet.id_str > user.tweets.maxId) {
        user.tweets.maxId = tweet.id_str;
      }

      if (tweet.id_str > user.tweets.sinceId) {
        user.tweets.sinceId = tweet.id_str;
      }

      if (!user.tweets.tweetIds.includes(tweet.id_str)) { 

        try {

          const tweetObj = await tweetServerController.createStreamTweet(tscParams);

          user.tweetHistograms = await processTweetObj({tweetObj: tweetObj, histograms: user.tweetHistograms});
          user.tweets.tweetIds.push(tweet.id_str);

          tweetsProcessed += 1;
          statsObj.twitter.tweetsProcessed += 1;
          statsObj.twitter.tweetsTotal += 1;

          if (configuration.verbose) {
            console.log(chalkTwitter("WAS | TFC | +++ PROCESSED TWEET"
              + " [ H/P/T " + statsObj.twitter.tweetsProcessed + "/" + statsObj.twitter.tweetsHits + "/" + statsObj.twitter.tweetsTotal + "]"
              + " | TW: " + tweet.id_str
              + " | SINCE: " + user.tweets.sinceId
              + " | TWs: " + user.tweets.tweetIds.length
              + " | @" + user.screenName
            ));
          }

          return;
        }
        catch(err){
          console.log(chalkError("WAS | TFC | updateUserTweets ERROR: " + err));
          return err;
        }
      }
      else {

        statsObj.twitter.tweetsHits += 1;
        statsObj.twitter.tweetsTotal += 1;

        if (configuration.verbose) {
          console.log(chalkInfo("WAS | TFC | ... TWEET ALREADY PROCESSED"
            + " [ H/P/T " + statsObj.twitter.tweetsProcessed + "/" + statsObj.twitter.tweetsHits + "/" + statsObj.twitter.tweetsTotal + "]"
            + " | TW: " + tweet.id_str
            + " | TWs: " + user.tweets.tweetIds.length
            + " | @" + user.screenName
          ));
        }

        return;
      }

    }, function(err){
      if (err) {
        console.log(chalkError("WAS | TFC | updateUserTweets ERROR: " + err));
        return reject(err);
      }

      if (configuration.verbose && (tweetsProcessed > 0)) {
        console.log(chalkLog("WAS | TFC | +++ Ts"
          + " | " + tweetsProcessed
          + " [ P/H/T " + statsObj.twitter.tweetsProcessed + "/" + statsObj.twitter.tweetsHits + "/" + statsObj.twitter.tweetsTotal + " ]"
          + " | SINCE: " + user.tweets.sinceId
          + " | DB Ts: " + user.tweets.tweetIds.length
          + " | @" + user.screenName
        ));
      }

      resolve(user);
    });

  });
}
function delayEvent(p) {

  const params = p || {};
  const delayEventName = params.delayEventName;
  const period = params.period || 10*ONE_SECOND;
  const verbose = params.verbose || false;

  if (verbose) {
    console.log(chalkLog(MODULE_ID_PREFIX + " | +++ DELAY START | NOW: " + getTimeStamp() + " | PERIOD: " + msToTime(period)));
  }

  const delayTimout = setTimeout(function(){

    if (verbose) {
      console.log(chalkLog(MODULE_ID_PREFIX + " | XXX DELAY END | NOW: " + getTimeStamp() + " | PERIOD: " + msToTime(period)));
    }

    childEvents.emit(delayEventName); 

  }, period);

  return(delayTimout);

}

function userProfileChangeHistogram(params) {

  return new Promise(async function(resolve, reject){

    let userProfileChanges = false;

    try {
      userProfileChanges = await checkUserProfileChanged(params);
    }
    catch(err){
      return reject(err);
    }

    if (!userProfileChanges) {
      return resolve();
    }

    const user = params.user;

    let text = "";
    const urlsHistogram = {};
    urlsHistogram.urls = {};

    const profileImageUrl = false;
    const bannerImageUrl = false;

    const locationsHistogram = {};
    locationsHistogram.locations = {};

    async.each(userProfileChanges, async function(userProp){

      const userPropValue = user[userProp].toLowerCase();

      const prevUserProp = "previous" + _.upperFirst(userProp);

      let domain;
      let domainNodeId;
      let nodeId;
      let lastSeen;
      let name;

      user[prevUserProp] = (!user[prevUserProp] || (user[prevUserProp] === undefined)) ? null : user[prevUserProp];

      switch (userProp) {

        case "location":

          lastSeen = Date.now();

          text += userPropValue + "\n";

          name = userPropValue.trim();
          name = name.toLowerCase();
          name = name.replace(/\./gi, "");
          nodeId = btoa(name);

          locationsHistogram.locations[nodeId] = (locationsHistogram.locations[nodeId] === undefined) ? 1 : locationsHistogram.locations[nodeId] + 1;

          try {

            let locationDoc = await global.globalLocation.findOne({nodeId: nodeId});

            if (!locationDoc) {

              debug(chalkInfo("WAS | TFC | --- LOC DB MISS"
                + " | NID: " + nodeId
                + " | N: " + name + " / " + userPropValue
              ));

              locationDoc = new global.globalLocation({
                nodeId: nodeId,
                name: name,
                nameRaw: userPropValue,
                geoSearch: false,
                geoValid: false,
                lastSeen: lastSeen,
                mentions: 0
              });

              let geoCodeResults;

              if (configuration.geoCodeEnabled) {
                geoCodeResults = await geoCode({address: name});
                locationDoc.geoSearch = true;
              }

              if (geoCodeResults && geoCodeResults.placeId) {

                locationDoc.geoValid = true;
                locationDoc.geo = geoCodeResults;
                locationDoc.placeId = geoCodeResults.placeId;
                locationDoc.formattedAddress = geoCodeResults.formattedAddress;

                await locationDoc.save();

                statsObj.geo.hits += 1;
                statsObj.geo.total += 1;
                statsObj.geo.hitRate = 100*(statsObj.geo.hits/statsObj.geo.total);

                debug(chalk.blue("WAS | TFC | +++ LOC GEO HIT "
                  + " | GEO: " + locationDoc.geoValid
                  + "  H " + statsObj.geo.hits
                  + "  M " + statsObj.geo.misses
                  + "  T " + statsObj.geo.total
                  + " HR: " + statsObj.geo.hitRate.toFixed(2)
                  + " | PID: " + locationDoc.placeId 
                  + " | NID: " + locationDoc.nodeId
                  + " | N: " + locationDoc.name + " / " + locationDoc.nameRaw
                  + " | A: " + locationDoc.formattedAddress
                ));

                user.geoValid = geoCodeResults.geoValid;
                user.geo = geoCodeResults;

                locationsHistogram.locations[geoCodeResults.placeId] = (locationsHistogram.locations[geoCodeResults.placeId] === undefined) 
                  ? 1 
                  : locationsHistogram.locations[geoCodeResults.placeId] + 1;


                user[prevUserProp] = user[userProp];

              } else {

                await locationDoc.save();

                statsObj.geo.misses += 1;
                statsObj.geo.total += 1;
                statsObj.geo.hitRate = 100*(statsObj.geo.hits/statsObj.geo.total);

                debug(chalkLog("WAS | TFC | --- LOC GEO MISS"
                  + " | GEO: " + locationDoc.geoValid
                  + "  H " + statsObj.geo.hits
                  + "  M " + statsObj.geo.misses
                  + "  T " + statsObj.geo.total
                  + " HR: " + statsObj.geo.hitRate.toFixed(2)
                  + " | NID: " + locationDoc.nodeId
                  + " | N: " + locationDoc.name + " / " + locationDoc.nameRaw
                ));

                user[prevUserProp] = user[userProp];
              }

            }
            else {

              locationDoc.mentions += 1;
              locationDoc.lastSeen = lastSeen;


              debug(chalk.green("WAS | TFC | +++ LOC DB HIT "
                + " | GEO: " + locationDoc.geoValid
                + "  H " + statsObj.geo.hits
                + "  M " + statsObj.geo.misses
                + "  T " + statsObj.geo.total
                + " HR: " + statsObj.geo.hitRate.toFixed(2)
                + " | PID: " + locationDoc.placeId 
                + " | NID: " + locationDoc.nodeId
                + " | N: " + locationDoc.name + " / " + locationDoc.nameRaw
                + " | A: " + locationDoc.formattedAddress
              ));

              if (locationDoc.geoValid) {
                if (configuration.geoCodeEnabled 
                  && (!locationDoc.geoSearch || !locationDoc.geo || locationDoc.geo === undefined)) {
                  locationDoc.geo = await geoCode({address: locationDoc.name});
                }
                user.geoValid = true;
                user.geo = locationDoc.geo;
              }

              await locationDoc.save();

              const key = (locationDoc.placeId && locationDoc.placeId !== undefined) ? locationDoc.placeId : locationDoc.nodeId;

              locationsHistogram.locations[key] = (locationsHistogram.locations[key] === undefined) ? 1 : locationsHistogram.locations[key] + 1;

              user[prevUserProp] = user[userProp];
            }

          }
          catch(err){
            console.log(chalkError("TCS | *** GEOCODE ERROR", err));
          }
        break;

        case "name":
        case "description":
          text += userPropValue + "\n";
          user[prevUserProp] = user[userProp];
        break;

        case "screenName":
          text += "@" + userPropValue + "\n";
          user[prevUserProp] = user[userProp];
        break;

        case "url":
        case "profileUrl":
        case "expandedUrl":
        case "profileImageUrl":
        case "bannerImageUrl":

          domain = urlParse(userPropValue.toLowerCase()).hostname;
          nodeId = btoa(userPropValue.toLowerCase());

          if (domain) { 
            domainNodeId = btoa(domain);
            urlsHistogram.urls[domainNodeId] = (urlsHistogram.urls[domainNodeId] === undefined) ? 1 : urlsHistogram.urls[domainNodeId] + 1; 
          }
          urlsHistogram.urls[nodeId] = (urlsHistogram.urls[nodeId] === undefined) ? 1 : urlsHistogram.urls[nodeId] + 1;

          user[prevUserProp] = user[userProp];
        break;

        default:
          console.log(chalkError("WAS | TFC | UNKNOWN USER PROPERTY: " + userProp));
          return (new Error("UNKNOWN USER PROPERTY: " + userProp));
      }
      
      return;

    }, function(err){

      if (err) {
        console.log(chalkError("WAS | TFC | USER PROFILE HISTOGRAM ERROR: " + err));
        return reject(err);
      }

      async.parallel({

        profileImageHist: function(cb) {

          if (configuration.enableImageAnalysis && !statsObj.google.vision.imageAnalysisQuotaFlag
            && (profileImageUrl || ( (!user.profileImageAnalyzed || (user.profileImageAnalyzed === undefined)) && user.profileImageUrl && (user.profileImageUrl !== undefined))
            )
          ){

            parseImage({
              imageUrl: user.profileImageUrl,
              user: user,
              updateGlobalHistograms: true
            }).
            then(function(imageParseResults){
              statsObj.google.vision.imagesParsed += 1;
              cb(null, imageParseResults);
            }).
            catch(function(err){

              if (err.code === 8) {

                console.log(chalkAlert(MODULE_ID_PREFIX + " | *** GOOGLE IMAGE PARSER QUOTA ERROR"));

                statsObj.google.vision.imageAnalysisQuotaFlag = true;
                statsObj.google.vision.errors += 1;

                const quotaResetAtMoment = moment().endOf("day");
                const quotaTimeoutPeriod = quotaResetAtMoment.diff(moment());

                console.log(chalkAlert(MODULE_ID_PREFIX + " | *** GOOGLE IMAGE PARSER QUOTA RESET AT"
                  + " | " + quotaResetAtMoment.format(compactDateTimeFormat)
                  + " | " + msToTime(quotaTimeoutPeriod)
                ));

                childEvents.once("imageAnalysisQuotaExpired", function(){

                  statsObj.google.vision.imageAnalysisQuotaFlag = false;

                  console.log(chalkGreen(MODULE_ID_PREFIX
                    + " | XXX GOOGLE IMAGE PARSER QUOTA"
                  ));

                });

                delayEvent({delayEventName: "imageAnalysisQuotaExpired", period: quotaTimeoutPeriod, verbose: true});

                cb(null, {});
              }
              else{
                console.log(chalkError("*** USER PROFILE CHANGE ERROR: " + err));
                cb(err, null);
              }
            });

          }
          else {
            cb(null, null);
          }
        }, 

        bannerImageHist: function(cb) {

          if (configuration.enableImageAnalysis && !statsObj.google.vision.imageAnalysisQuotaFlag
            && (bannerImageUrl || ( (!user.bannerImageAnalyzed || (user.bannerImageAnalyzed === undefined)) && user.bannerImageUrl && (user.bannerImageUrl !== undefined))
            )
          ){

            parseImage({
              imageUrl: user.bannerImageUrl,
              user: user,
              updateGlobalHistograms: true
            }).
            then(function(imageParseResults){
              statsObj.google.vision.imagesParsed += 1;
              cb(null, imageParseResults);
            }).
            catch(function(err){

              if (err.code === 8) {

                console.log(chalkAlert(MODULE_ID_PREFIX + " | *** GOOGLE IMAGE PARSER QUOTA ERROR"));

                statsObj.google.vision.imageAnalysisQuotaFlag = true;
                statsObj.google.vision.errors += 1;

                const quotaResetAtMoment = moment().endOf("day");
                const quotaTimeoutPeriod = quotaResetAtMoment.diff(moment());

                console.log(chalkAlert(MODULE_ID_PREFIX + " | *** GOOGLE IMAGE PARSER QUOTA RESET AT"
                  + " | " + quotaResetAtMoment.format(compactDateTimeFormat)
                  + " | " + msToTime(quotaTimeoutPeriod)
                ));

                childEvents.once("imageAnalysisQuotaExpired", function(){

                  statsObj.google.vision.imageAnalysisQuotaFlag = false;

                  console.log(chalkGreen(MODULE_ID_PREFIX
                    + " | XXX GOOGLE IMAGE PARSER QUOTA"
                  ));

                });

                delayEvent({delayEventName: "imageAnalysisQuotaExpired", period: quotaTimeoutPeriod, verbose: true});

                cb(null, {});
              }
              else{
                console.log(chalkError("*** USER PROFILE CHANGE ERROR: " + err));
                cb(err, null);
              }
            });

          }
          else {
            cb(null, null);
          }
        }, 

        textHist: function(cb){

          if (text && (text !== undefined)){

            parseText({ category: user.category, text: text, updateGlobalHistograms: true }).
            then(function(textParseResults){

              cb(null, textParseResults);

            }).
            catch(function(err){
              if (err) {
                console.log(chalkError("WAS | TFC | USER PROFILE CHANGE HISTOGRAM PARSE TEXT ERROR: " + err));
              }
              cb(err, null);
            });
          }
          else {
            cb(null, null);
          }
        }

      }, function(err, results){

        if (err) {
          console.log(chalkError("WAS | TFC | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        }

        mergeHistogramsArray( {histogramArray: [results.textHist, results.bannerImageHist, results.profileImageHist, urlsHistogram, locationsHistogram]} ).
        then(function(histogramsMerged){
          resolve(histogramsMerged);
        }).
        catch(function(err){
          console.log(chalkError("WAS | TFC | USER PROFILE MERGE HISTOGRAMS ERROR: " + err));
          return reject(err);
        });
      });
    });

  });
}

let infoRateLimitTimeout;
let infoRateLimitStatusInterval;

function initRateLimitPause(params){

  return new Promise(async function(resolve, reject){

    if (!params) {
      return reject(new Error("params undefined"));
    }

    console.log(chalkAlert("WAS | TFC"
      + " | RATE LIMIT PAUSE"
      + " | @" + configuration.threeceeUser
      + " | NOW: " + moment().format(compactDateTimeFormat)
      + " | RESET AT: " + params.twitterRateLimitResetAt.format(compactDateTimeFormat)
      + " | REMAINING: " + msToTime(params.twitterRateLimitRemainingTime)
    ));

    clearInterval(infoRateLimitStatusInterval);
    clearTimeout(infoRateLimitTimeout);

    let remainingTime = params.twitterRateLimitRemainingTime;
    const resetAt = params.twitterRateLimitResetAt;
    const timeout = params.twitterRateLimitRemainingTime + ONE_MINUTE;

    infoRateLimitStatusInterval = setInterval(function(){

      remainingTime = resetAt.diff(moment());

      console.log(chalkAlert("WAS | TFC"
        + " | RATE LIMIT PAUSE"
        + " | @" + configuration.threeceeUser
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | RESET AT: " + resetAt.format(compactDateTimeFormat)
        + " | REMAINING: " + msToTime(remainingTime)
      ));

    }, ONE_MINUTE);

    infoRateLimitTimeout = setTimeout(function(){

      remainingTime = resetAt.diff(moment());

      console.log(chalkAlert("WAS | TFC | XXX RATE LIMIT EXPIRED"
        + " | @" + configuration.threeceeUser
        + " | NOW: " + moment().format(compactDateTimeFormat)
        + " | RESET AT: " + resetAt.format(compactDateTimeFormat)
        + " | REMAINING: " + msToTime(remainingTime)
      ));

      infoTwitterUserObj.stats.twitterRateLimitExceptionFlag = false;

      clearInterval(infoRateLimitStatusInterval);

    }, timeout);

    resolve();

  });
}

function fetchUserTweets(params){

  return new Promise(async function(resolve, reject){

    const fetchUserTweetsParams = {};

    fetchUserTweetsParams.user_id = params.userId;

    if (params.trimUser) { fetchUserTweetsParams.trim_user = params.trimId; } 
    if (params.maxId) { fetchUserTweetsParams.max_id = params.maxId; } 
    if (params.sinceId) { fetchUserTweetsParams.since_id = params.sinceId; } 

    fetchUserTweetsParams.count = params.count || DEFAULT_TWEET_FETCH_COUNT;
    fetchUserTweetsParams.exclude_replies = params.excludeReplies || DEFAULT_TWEET_FETCH_EXCLUDE_REPLIES;
    fetchUserTweetsParams.include_rts = params.includeRetweets || DEFAULT_TWEET_FETCH_INCLUDE_RETWEETS;

    infoTwitterUserObj.twit.get("statuses/user_timeline", fetchUserTweetsParams, async function(err, userTweetsArray, response) {

      if (err){

        console.log(chalkError("TFC | *** TWITTER FETCH USER TWEETS ERROR"
          + " | @" + configuration.threeceeUser 
          + " | FETCH USER ID: " + params.userId
          + " | " + getTimeStamp() 
          + " | STATUS CODE: " + err.statusCode
          + " | ERR CODE: " + err.code
          + " | MESSAGE: " + err.message
        ));

        if (err.code === 130){ // Over capacity
          return resolve([]);
        }

        if (err.code === 136){ // You have been blocked from viewing this user's profile.
          process.send({
            op: "ERROR", 
            errorType: "BLOCKED",
            userId: params.userId,
            isInfoUser: true, 
            threeceeUser: configuration.threeceeUser,
            error: err
          });
          return reject(err);
        }

        if (err.code === 88){

          infoTwitterUserObj.stats.twitterRateLimitExceptionFlag = true;
          infoTwitterUserObj.stats.twitterRateLimit = response.headers["x-rate-limit-limit"];
          infoTwitterUserObj.stats.twitterRateLimitRemaining = response.headers["x-rate-limit-remaining"];
          infoTwitterUserObj.stats.twitterRateLimitResetAt = moment.unix(response.headers["x-rate-limit-reset"]);
          infoTwitterUserObj.stats.twitterRateLimitRemainingTime = moment.unix(response.headers["x-rate-limit-reset"]).diff(moment());

          console.log(chalkLog("TFC | RATE LIMIT"
            + " | LIM: " + infoTwitterUserObj.stats.twitterRateLimit
            + " | REM: " + infoTwitterUserObj.stats.twitterRateLimitRemaining
            + " | RESET AT: " + infoTwitterUserObj.stats.twitterRateLimitResetAt.format(compactDateTimeFormat)
            + " | REMAINING: " + msToTime(infoTwitterUserObj.stats.twitterRateLimitRemainingTime)
          ));

          try {
            await initRateLimitPause(infoTwitterUserObj.stats);
            return resolve([]);
          }
          catch(e){
            console.log(chalkError("WAS | TFC | *** INIT RATE LIMIT PAUSE ERROR: " + e));
            return reject(e);
          }
        }

        if (err.code === 89){

          console.log(chalkAlert("TFC | *** TWITTER FETCH USER TWEETS ERROR | INVALID OR EXPIRED TOKEN" 
            + " | " + getTimeStamp() 
            + " | @" + configuration.threeceeUser 
          ));


          statsObj.threeceeUser = Object.assign({}, threeceeUserDefaults, statsObj.threeceeUser);  

          statsObj.threeceeUser.err = err;

          process.send({op: "ERROR", errorType: "TWITTER_TOKEN", isInfoUser: true, threeceeUser: configuration.threeceeUser, error: err});
          return reject(err);
        }

        if (err.statusCode === 401){ // twitter user not authorized, suspended

          console.log(chalkAlert("TFC | *** TWITTER FETCH USER TWEETS ERROR | USER NOT AUTHORIZED (SUSPENDED?) ... DELETING" 
            + " | " + getTimeStamp() 
            + " | UID: " + params.userId 
            + " | @" + params.screenName 
          ));

          try {
            await global.globalUser.deleteOne({nodeId: params.userId});
            return reject(err);
          }
          catch(e){
            return reject(e);
          }
        }
        
        return reject(err);
      }

      if (configuration.verbose) {
        console.log(chalkInfo("TFC | +++ FETCHED USER TWEETS" 
          + " [" + userTweetsArray.length + "]"
          + " | @" + configuration.threeceeUser 
          + " | UID " + params.userId
        ));
      }

      resolve(userTweetsArray);

    });

  });
}

function updateUserHistograms(p) {

  return new Promise(async function(resolve, reject){

    const params = p || {};
    
    if ((params.user === undefined) || !params.user) {
      console.log(chalkError("WAS | TFC | *** updateUserHistograms USER UNDEFINED"));
      const err = new Error("WAS | TFC | *** updateUserHistograms USER UNDEFINED");
      console.error(err);
      return reject(err);
    }

    if (!params.user.nodeId || (params.user.nodeId === undefined)) {

      console.log(chalkWarn("WAS | TFC | !!! updateUserHistograms USER NODE ID UNDEFINED\n" + jsonPrint(params.user)));

      if (!params.user.userId || (params.user.userId === undefined)){
        console.log(chalkError("WAS | TFC | *** updateUserHistograms USER NODE & USER IDs UNDEFINED"
          + "\n" + jsonPrint(params.user)
        ));
        const err = new Error("WAS | TFC | *** updateUserHistograms USER NODE & USER IDs UNDEFINED");
        console.error(err);
        return reject(err);
      }
      else {
        params.user.nodeId = params.user.userId;
        console.log(chalkWarn("WAS | TFC | !!! updateUserHistograms USER NODE ID UNDEFINED | @" + params.user.screenName));
      }
    }

    if (!params.user.userId || (params.user.userId === undefined)) {

      console.log(chalkWarn("WAS | TFC | !!! updateUserHistograms USER USER ID UNDEFINED\n" + jsonPrint(params.user)));

      if (!params.user.nodeId || (params.user.nodeId === undefined)){
        console.log(chalkError("WAS | TFC | *** updateUserHistograms USER NODE & USER IDs UNDEFINED"
          + "\n" + jsonPrint(params.user)
        ));
        const err = new Error("WAS | TFC | *** updateUserHistograms USER NODE & USER IDs UNDEFINED");
        console.error(err);
        return reject(err);
      }
      else {
        params.user.userId = params.user.nodeId;
        console.log(chalkWarn("WAS | TFC | !!! updateUserHistograms USER USER ID UNDEFINED | @" + params.user.screenName));
      }
    }

    let user;

    if (!params.user.userId || (params.user.userId === undefined)){
      params.user.userId = params.user.nodeId;
    }

    try {

      user = await global.globalUser.findOne({nodeId: params.user.nodeId});

      if (!user) {
        user = global.globalUser(params.user);
      }

      user.profileHistograms = user.profileHistograms || {};
      user.tweetHistograms = user.tweetHistograms || {};

      let latestTweets = [];

      if (!infoTwitterUserObj.stats.twitterRateLimitExceptionFlag) {

        try{
          if (!user.tweets || user.tweets === undefined) {
            user.tweets = {};
            user.tweets.tweetIds = [];
            user.tweets.sinceId = false;
            user.tweets.maxId = false;
          }
          if (!user.tweets.sinceId || user.tweets.sinceId === undefined) {
            user.tweets.sinceId = false;
            user.tweets.maxId = false;
          }
          latestTweets = await fetchUserTweets({ userId: user.userId, screenName: user.screenName, sinceId: user.tweets.sinceId });
        }
        catch(e){
          return reject(e);
        }

      }

      user = await updateUserTweets({user: user, tweets: latestTweets});

      const profileHistogramChanges = await userProfileChangeHistogram({user: user});

      if (profileHistogramChanges) {
        user.profileHistograms = await mergeHistograms.merge({ histogramA: user.profileHistograms, histogramB: profileHistogramChanges });
      }

      user.previousProfileImageUrl = user.profileImageUrl;
      user.previousBannerImageUrl = user.bannerImageUrl;
      user.previousDescription = user.description;
      user.previousExpandedUrl = user.expandedUrl;
      user.previousLocation = user.location;
      user.previousName = user.name;
      user.previousProfileUrl = user.profileUrl;
      user.previousQuotedStatusId = user.quotedStatusId;
      user.previousScreenName = user.screenName;
      user.previousStatusId = user.statusId;
      user.previousUrl = user.url;

      await updateGlobalHistograms({user: user});

      user.priorityFlag = params.user.priorityFlag;
      resolve(user);

    }
    catch(err){
      console.log(chalkError("WAS | TFC | *** updateUserHistograms ERROR"
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
      return reject(err);
    }

  });
}

let uscTimeout;

function initUserCategorizeQueueInterval(cnf){

  console.log(chalkTwitter("WAS | TFC | INIT TWITTER USER CATEGORIZE QUEUE INTERVAL: " + cnf.userCategorizeQueueInterval));

  clearInterval(userCategorizeQueueInterval);

  let updatedUser;
  let networkOutput;
  let user;
  let dbUser;
  let matchFlag = false;
  let chalkType = chalkLog;

  userCategorizeQueueInterval = setInterval(async function(){

    if (userServerControllerReady && userCategorizeQueueReady && (userCategorizeQueue.length > 0)) {

      userCategorizeQueueReady = false;

      user = userCategorizeQueue.shift();

      if ((!user.nodeId || user.nodeId === undefined) && (!user.userId || user.userId === undefined)){
        console.log(chalkError("WAS | TFC | *** USER CAT ERROR: USER NODE ID & USER ID UNDEFINED\n" + jsonPrint(user)));
        userCategorizeQueueReady = true;
        return;
      }

      if (user.userId && (user.userId !== undefined) && (!user.nodeId || (user.nodeId === undefined))){
        console.log(chalkWarn("WAS | TFC | !!! USER CAT ERROR: USER NODE ID UNDEFINED\n" + jsonPrint(user)));
        user.nodeId = user.userId;
      }

      if (user.nodeId && (user.nodeId !== undefined) && (!user.userId || (user.userId === undefined))){
        console.log(chalkWarn("WAS | TFC | !!! USER CAT ERROR: USER USER ID UNDEFINED\n" + jsonPrint(user)));
        user.userId = user.nodeId;
      }

      if (configuration.verbose || user.priorityFlag) { printUserObj("WAS | TFC | USER CAT [ UCATQ: " + userCategorizeQueue.length + " ]", user, chalkLog); }

      try {
        updatedUser = await updateUserHistograms({user: user});
      }
      catch (err) {
        console.log(chalkError("WAS | TFC | *** UPDATE USER HISTOGRAMS ERROR: " + err));
        userChangeCache.del(user.nodeId);
        userCategorizeQueueReady = true;
        return;
      }

      try {
        networkOutput = await activateNetwork({user: updatedUser});
      }
      catch (err) {
        console.log(chalkError("WAS | TFC | *** ACTIVATE NETWORK ERROR: " + err));
        userChangeCache.del(user.nodeId);
        userCategorizeQueueReady = true;
        return;
      }

      matchFlag = updatedUser.category 
        && (updatedUser.category !== undefined) 
        && (updatedUser.category !== false) 
        && (updatedUser.category !== "false") 
        && (updatedUser.category === networkOutput.output);

      if (!updatedUser.category || updatedUser.category === undefined) {
        chalkType = chalkLog;
      }
      else if (matchFlag){
        chalkType = chalkGreen;
        statsObj.autoChangeTotal += 1;
        statsObj.autoChangeMatch += 1;
      }
      else {
        chalkType = chalk.yellow;
        statsObj.autoChangeTotal += 1;
        statsObj.autoChangeMismatch += 1;
      }

      statsObj.autoChangeMatchRate = 100*(statsObj.autoChangeMatch/statsObj.autoChangeTotal);
        
      updatedUser.lastHistogramTweetId = updatedUser.statusId;
      updatedUser.lastHistogramQuoteId = updatedUser.quotedStatusId;

      if (updatedUser.priorityFlag || (updatedUser.categoryAuto !== networkOutput.output)) {
        console.log(chalkType("WAS | TFC | >>> NN AUTO CHG"
          + " | " + statsObj.autoChangeMatchRate.toFixed(2) + "%"
          + " | M: " + statsObj.autoChangeMatch
          + " MM: " + statsObj.autoChangeMismatch
          + " TOT: " + statsObj.autoChangeTotal
          + " | UC$ " + userChangeCache.getStats().keys
          + " UCQ " + userCategorizeQueue.length
          + " NN " + networkObj.networkId
          + " MTCH " + matchFlag
          + " | C M: " + updatedUser.category
          + " A: " + updatedUser.categoryAuto + " > " + networkOutput.output
          + " | NID " + updatedUser.nodeId
          + " @" + updatedUser.screenName
          + " | PRIORITY: " + updatedUser.priorityFlag
        ));

        updatedUser.categoryAuto = networkOutput.output;

        process.send({ op: "USER_CATEGORIZED", priorityFlag: updatedUser.priorityFlag, user: updatedUser, stats: statsObj.user });

      }

      uscTimeout = setTimeout(function(){
        console.log(chalkError("WAS | TFC | *** USC FINDONEUSER TIMEOUT"));
        printUserObj("WAS | TFC | DB", dbUser, chalkError); 
      }, 5000);

      try {

        dbUser = await userServerController.findOneUserV2({user: updatedUser, mergeHistograms: false, noInc: true});

        dbUser.priorityFlag = updatedUser.priorityFlag;

        if (dbUser.priorityFlag || configuration.verbose) { printUserObj("WAS | TFC | DB", dbUser, chalkLog); }

        userChangeCache.del(dbUser.nodeId);
        clearTimeout(uscTimeout);
        userCategorizeQueueReady = true;
      }
      catch(err){
        console.log(chalkError("WAS | TFC | *** USER FIND ONE ERROR"
          + " | " + updatedUser.userId
          + " | @" + updatedUser.screenName
          + " | " + err
        ));

        clearTimeout(uscTimeout);
        userCategorizeQueueReady = true;
      }
    }

  }, cnf.userCategorizeQueueInterval);
}

function initialize(cnf){

  return new Promise(async function(resolve, reject){

    console.log(chalkLog("WAS | TFC | INITIALIZE"));

    if (debug.enabled || debugCache.enabled || debugQ.enabled){
      console.log("\nWAS | TFC | %%%%%%%%%%%%%%\nWAS | TFC | DEBUG ENABLED \nWAS | TFC | %%%%%%%%%%%%%%\n");
    }

    cnf.processName = process.env.TFE_PROCESS_NAME || "wa_node_tfe";

    cnf.verbose = process.env.TFE_VERBOSE_MODE || false;
    cnf.globalTestMode = process.env.TFE_GLOBAL_TEST_MODE || false;
    cnf.testMode = process.env.TFE_TEST_MODE || false;
    cnf.quitOnError = process.env.TFE_QUIT_ON_ERROR || false;

    cnf.twitterConfigFolder = process.env.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER || "/config/twitter"; 
    cnf.twitterConfigFile = process.env.DROPBOX_TFE_DEFAULT_TWITTER_CONFIG_FILE 
      || "altthreecee00.json";

    cnf.statsUpdateIntervalTime = process.env.TFE_STATS_UPDATE_INTERVAL || 60000;

    debug(chalkWarn("WAS | TFC | dropboxConfigFolder: " + dropboxConfigFolder));
    debug(chalkWarn("WAS | TFC | dropboxConfigFile  : " + dropboxConfigFile));

    try{

      const loadedConfigObj = await loadFileRetry({folder: dropboxConfigHostFolder, file: dropboxConfigFile}); 

      console.log("WAS | TFC | " + dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

      if (loadedConfigObj.TFE_VERBOSE_MODE !== undefined){
        console.log("WAS | TFC | LOADED TFE_VERBOSE_MODE: " + loadedConfigObj.TFE_VERBOSE_MODE);
        cnf.verbose = loadedConfigObj.TFE_VERBOSE_MODE;
      }

      if (loadedConfigObj.TFE_GLOBAL_TEST_MODE !== undefined){
        console.log("WAS | TFC | LOADED TFE_GLOBAL_TEST_MODE: " + loadedConfigObj.TFE_GLOBAL_TEST_MODE);
        cnf.globalTestMode = loadedConfigObj.TFE_GLOBAL_TEST_MODE;
      }

      if (loadedConfigObj.TFE_TEST_MODE !== undefined){
        console.log("WAS | TFC | LOADED TFE_TEST_MODE: " + loadedConfigObj.TFE_TEST_MODE);
        cnf.testMode = loadedConfigObj.TFE_TEST_MODE;
      }

      if (loadedConfigObj.TFE_GEOCODE_ENABLED !== undefined){
        console.log("WAS | TFC | LOADED TFE_GEOCODE_ENABLED: " + loadedConfigObj.TFE_GEOCODE_ENABLED);
        cnf.geoCodeEnabled = loadedConfigObj.TFE_GEOCODE_ENABLED;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER !== undefined){
        console.log("WAS | TFC | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER));
        cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE !== undefined){
        console.log("WAS | TFC | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE));
        cnf.twitterConfigFile = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE;
      }

      if (loadedConfigObj.TFE_STATS_UPDATE_INTERVAL !== undefined) {
        console.log("WAS | TFC | LOADED TFE_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TFE_STATS_UPDATE_INTERVAL);
        cnf.statsUpdateIntervalTime = loadedConfigObj.TFE_STATS_UPDATE_INTERVAL;
      }

      if (loadedConfigObj.TFE_MAX_TWEET_QUEUE !== undefined) {
        console.log("WAS | TFC | LOADED TFE_MAX_TWEET_QUEUE: " + loadedConfigObj.TFE_MAX_TWEET_QUEUE);
        cnf.maxTweetQueue = loadedConfigObj.TFE_MAX_TWEET_QUEUE;
      }

      // OVERIDE CONFIG WITH COMMAND LINE ARGS

      const configArgs = Object.keys(cnf);

      configArgs.forEach(function(arg){
        console.log("WAS | TFC | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });

      await initStatsUpdate(cnf);

      const twitterConfig = await loadFileRetry({folder: cnf.twitterConfigFolder, file: cnf.twitterConfigFile});

      cnf.twitterConfig = {};
      cnf.twitterConfig = twitterConfig;

      console.log("WAS | TFC | " + chalkInfo(getTimeStamp() + " | TWITTER CONFIG FILE " 
        + cnf.twitterConfigFolder
        + cnf.twitterConfigFile
        + "\n" + jsonPrint(cnf.twitterConfig )
      ));

      return(resolve(cnf));

    }
    catch(err){
      console.error("WAS | TFC | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
      return reject(err);
    }

  });
}

process.on("message", function(m) {

  debug(chalkAlert("TFC RX MESSAGE"
    + " | OP: " + m.op
  ));

  let twitterUserObj;
  let cacheObj;

  switch (m.op) {

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.geoCodeEnabled = m.geoCodeEnabled || false;
      configuration.enableImageAnalysis = m.enableImageAnalysis || false;
      configuration.forceImageAnalysis = m.forceImageAnalysis || false;
      maxInputHashMap = m.maxInputHashMap;
      normalization = m.normalization;

      networkObj = m.networkObj;
      network = neataptic.Network.fromJSON(m.networkObj.network);

      console.log(chalkInfo("WAS | TFC | INIT"
        + " | TITLE: " + process.title
        + " | NETWORK: " + networkObj.networkId
        + " | ENABLE GEOCODE: " + configuration.geoCodeEnabled
        + " | ENABLE IMAGE ANALYSIS: " + configuration.enableImageAnalysis
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
        + " | MAX INPUT HM KEYS: " + Object.keys(maxInputHashMap)
        + " | NORMALIZATION: " + Object.keys(normalization)
      ));
    break;

    case "NETWORK":

      networkObj = m.networkObj;
      network = neataptic.Network.fromJSON(m.networkObj.network);

      statsObj.autoChangeTotal = 0;
      statsObj.autoChangeMatchRate = 0;
      statsObj.autoChangeMatch = 0;
      statsObj.autoChangeMismatch = 0;

      console.log(chalkInfo("WAS | TFC | +++ NETWORK"
        + " | NETWORK: " + networkObj.networkId
        + " | INPUTS: " + networkObj.inputsObj.meta.numInputs
        + " | INPUTS ID: " + networkObj.inputsId
      ));
    break;

    case "FORCE_IMAGE_ANALYSIS":

      configuration.forceImageAnalysis = m.forceImageAnalysis;

      console.log(chalkInfo("WAS | TFC | +++ FORCE_IMAGE_ANALYSIS"
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
      ));
    break;

    case "MAX_INPUT_HASHMAP":

      maxInputHashMap = m.maxInputHashMap;

      console.log(chalkInfo("WAS | TFC | +++ MAX_INPUT_HASHMAP"
        + " | MAX INPUT HM KEYS: " + Object.keys(maxInputHashMap)
      ));
    break;

    case "NORMALIZATION":

      normalization = m.normalization;

      console.log(chalkInfo("WAS | TFC | +++ NORMALIZATION"
        + " | NORMALIZATION: " + Object.keys(normalization)
      ));
    break;

    case "USER_AUTHENTICATED":

      console.log(chalkInfo("WAS | TFC | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      twitterUserObj = twitterUserHashMap.get(m.user.screenName);

      if (twitterUserObj !== undefined) {

        const authObj = twitterUserObj.twit.getAuth();

        console.log(chalkLog("WAS | TFC | CURRENT AUTH\n" + jsonPrint(authObj)));

        twitterUserObj.twit.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

        const authObjNew = twitterUserObj.twit.getAuth();

        twitterUserObj.twitterConfig.access_token = authObjNew.access_token;
        twitterUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
        twitterUserObj.twitterConfig.TOKEN = authObjNew.access_token;
        twitterUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

        twitterUserHashMap.set(m.user.screenName, twitterUserObj);

        console.log(chalkError("WAS | TFC | UPDATED AUTH\n" + jsonPrint(authObjNew)));

      }
      else {
        console.log(chalkAlert("WAS | TFC | TWITTER USER OBJ UNDEFINED: " + m.user.screenName));
      }
    break;

    case "USER_CATEGORIZE":

      if (m.priorityFlag) {
        console.log(chalkError("WAS | TFC | *** PRIORITY USER_CATEGORIZE"
          + " | UID: " + m.user.userId
          + " | @" + m.user.screenName
        ));
      }

      if (!m.user.nodeId || (m.user.nodeId === undefined)) { 
        console.log(chalkError("WAS | TFC | ??? USER NODE ID UNDEFINED ... SET TO USER ID"
          + " | UID: " + m.user.userId
          + " | @" + m.user.screenName
        ));
        m.user.nodeId = m.user.userId;
      }

      cacheObj = userChangeCache.get(m.user.nodeId);

      if (m.priorityFlag || (configuration.verbose && (cacheObj === undefined))) { 
        console.log(chalkInfo("WAS | TFC | USER CAT $ MISS"
          + " [UC$: " + userChangeCache.getStats().keys + "]"
          + " [UCATQ: " + userCategorizeQueue.length + "]"
          + " | NID: " + m.user.nodeId
          + " | @" + m.user.screenName
        ));
      }

      if (m.priorityFlag || ((cacheObj === undefined) && (userCategorizeQueue.length < USER_CAT_QUEUE_MAX_LENGTH))){

        try {

          const user = m.user.toObject();

          if (m.priorityFlag) {
            user.priorityFlag = true;
            userCategorizeQueue.unshift(user);
          }
          else {
            userCategorizeQueue.push(user);
          }

          userChangeCache.set(user.nodeId, {user: user, timeStamp: moment().valueOf()});

          debug(chalkInfo("WAS | TFC | USER_CATEGORIZE"
            + " [ USQ: " + userCategorizeQueue.length + "]"
            + " | FLWRs: " + user.followersCount
            + " | FRNDs: " + user.friendsCount
            + " | USER " + user.userId
            + " | @" + user.screenName
            + " | " + user.name
            + "\nTFE | USER_SHOW | DESC: " + user.description
          ));
        }
        catch(err){  
          // not a user doc

          if (m.priorityFlag) {
            m.user.priorityFlag = true;
            userCategorizeQueue.unshift(m.user);
          }
          else {
            userCategorizeQueue.push(m.user);
          }

          userChangeCache.set(m.user.nodeId, {user: m.user, timeStamp: moment().valueOf()});

          debug(chalkInfo("WAS | TFC | USER_CATEGORIZE"
            + " [ USQ: " + userCategorizeQueue.length + "]"
            + " | FLWRs: " + m.user.followersCount
            + " | FRNDs: " + m.user.friendsCount
            + " | USER " + m.user.userId
            + " | @" + m.user.screenName
            + " | " + m.user.name
            + "\nTFE | USER_SHOW | DESC: " + m.user.description
          ));
        }
      }

    break;

    case "PING":
      debug(chalkLog("WAS | TFC | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    default:
      console.error(chalkLog("WAS | TFC | TWP | *** UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));

  }
});

setTimeout(async function(){

  try{
    configuration = await initialize(configuration);
  }
  catch(err){
    if (err.status !== 404){
      console.error(chalkLog("WAS | TFC | *** INIT ERROR \n" + jsonPrint(err)));
      quit();
    }
    console.log(chalkError("WAS | TFC | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
  }

  console.log("WAS | TFC | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");

  try {
    global.globalDbConnection = await connectDb();
    dbConnectionReady = true;
  }
  catch(err){
    dbConnectionReady = false;
    console.log(chalkError("WAS | TFC | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
    quit("MONGO DB CONNECT ERROR");
  }

  dbConnectionReadyInterval = setInterval(function() {
    if (dbConnectionReady) {
      clearInterval(dbConnectionReadyInterval);
    }
    else {
      console.log(chalkInfo("WAS | TFC | WAIT DB CONNECTED ..."));
    }
  }, 1000);

  try {
    const ituObj = await initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER});
    configuration.threeceeUser = DEFAULT_INFO_TWITTER_USER;

    threeceeUserDefaults.screenName = configuration.threeceeUser;

    infoTwitterUserObj = ituObj;
    initUserCategorizeQueueInterval(configuration);
  }
  catch(err){
    console.log(chalkError("WAS | TFC | *** INIT INFO TWITTER ERROR: " + err));
  }

}, 5*ONE_SECOND);


