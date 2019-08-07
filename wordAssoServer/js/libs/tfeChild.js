/*jslint node: true */
/*jshint sub:true*/
// "use strict";

process.title = "wa_node_child_tfe";

const MODULE_ID_PREFIX = "TFC";

const MIN_TWEET_ID = 1000000;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;

const DEFAULT_MAX_USER_TWEETIDS = 500;

const USER_PROFILE_PROPERTY_ARRAY = [
  "bannerImageUrl",
  "description",
  "location",
  "name",
  "profileUrl",
  "profileImageUrl",
  "screenName",
  "url"
];

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

// const globalHistograms = {};

const defaultUserTweetHistograms = {};
const defaultUserProfileHistograms = {};

DEFAULT_INPUT_TYPES.forEach(function(type){
  defaultUserTweetHistograms[type] = {};
  defaultUserProfileHistograms[type] = {};
});

let networkObj = {};

// const DEFAULT_INFO_TWITTER_USER = "threecee";
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

const urlParse = require("url-parse");

const NeuralNetworkTools = require("@threeceelabs/neural-network-tools");
const nnTools = new NeuralNetworkTools("WA_TFE_NNT");

const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyDBxA6RmuBcyj-t7gfvK61yp8CDNnRLUlc"
});

const defaults = require("object.defaults");
const Language = require("@google-cloud/language");
const languageClient = new Language.LanguageServiceClient();

const MergeHistograms = require("@threeceelabs/mergehistograms");
const mergeHistograms = new MergeHistograms();

const twitterTextParser = require("@threeceelabs/twitter-text-parser");
const twitterImageParser = require("@threeceelabs/twitter-image-parser");

const btoa = require("btoa");
const empty = require("is-empty");

const jsonParse = require("json-parse-safe");
const sizeof = require("object-sizeof");

const _ = require("lodash");
const fetchDropbox = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
const async = require("async");
// const Twit = require("twit");
const moment = require("moment");
const treeify = require("treeify");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");

const debug = require("debug")("tfe");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkBlue = chalk.blue;
// const chalkGreen = chalk.green;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.yellow;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;

const twitterUserHashMap = new HashMap();
const tcuChildName = MODULE_ID_PREFIX + "_TCU";
const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
const tcUtils = new ThreeceeUtilities(tcuChildName);


const processUserQueue = [];
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

let configuration = {};
configuration.processUserQueueInterval = 10;
configuration.geoCodeEnabled = false;
configuration.inputsBinaryMode = true;
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.forceImageAnalysis = false;
configuration.enableImageAnalysis = true;
configuration.testMode = false; // per tweet test mode
// configuration.userCategorizeQueueInterval = 100;
configuration.processUserQueueInterval = 100;

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

// function categoryToString(c) {

//   let cs = "";

//   switch (c) {
//     case "left":
//       cs = "L";
//     break;
//     case "neutral":
//       cs = "N";
//     break;
//     case "right":
//       cs = "R";
//     break;
//     case "positive":
//       cs = "+";
//     break;
//     case "negative":
//       cs = "-";
//     break;
//     case "none":
//       cs = "0";
//     break;
//     case false:
//       cs = "false";
//     break;
//     case undefined:
//       cs = "undefined";
//     break;
//     case null:
//       cs = "null";
//     break;
//     default:
//       cs = "?";
//   }

//   return cs;
// }

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
// let userServerControllerReady = false;

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

        // userServerControllerReady = false;
        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";

          // userServerControllerReady = true;
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

  process.exit(exitCode);

  // if ((global.globalDbConnection !== undefined) && (global.globalDbConnection.readyState > 0)) {

  //   global.globalDbConnection.close(function () {
      
  //     console.log(chalkAlert(
  //           "WAS | TFC | =========================="
  //       + "\nTFE | MONGO DB CONNECTION CLOSED"
  //       + "\nTFE | =========================="
  //     ));

  //     process.exit(exitCode);
  //   });
  // }
  // else {
  //   process.exit(exitCode);
  // }
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

async function loadFileRetry(params){

  // return new Promise(function(resolve, reject){

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

        return fileObj;
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
      return false;
    }
    console.log(chalkError(MODULE_ID_PREFIX + " | reject FILE LOAD FAILED | RETRY: " + retryNumber + " OF " + maxRetries));
    throw new Error("FILE LOAD ERROR | RETRIES " + maxRetries);

  // });
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

// function printUserObj(title, u, chalkConfig) {

//   const curChalk = chalkConfig || chalkLog;

//   const user = userDefaults(u);

//   console.log(curChalk(title
//     + " | C M: " + categoryToString(user.category) + " - A: " + categoryToString(user.categoryAuto)
//     + " | " + user.rate.toFixed(3) + " TPM"
//     + " | @" + user.screenName
//     + " | N: " + user.name 
//     + " | " + user.userId
//     + " | IG: " + user.ignored 
//     + " | 3C: " + user.threeceeFollowing 
//     + " | PRIORITY: " + user.priorityFlag 
//   ));

//   if (user.changes) {
//     console.log(curChalk(title
//     + "\nCHANGES\n" + jsonPrint(user.changes)
//     ));
//   }
// }

function printUser(params) {
  let text;
  const user = params.user;

  if (params.verbose) {
    return jsonPrint(params.user);
  } 
  else {
    text = user.userId
    + " | @" + user.screenName
    + " | " + user.name 
    + " | LG " + user.lang
    + " | FW " + user.followersCount
    + " | FD " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + getTimeStamp(user.lastSeen)
    + " | FWG " + user.following 
    + " | 3C " + user.threeceeFollowing 
    + " | LC " + user.location
    + " | C M " + user.category + " A " + user.categoryAuto;

    return text;
  }
}

// const userDefaults = function (user){

//   if (!user.rate || user.rate === undefined) { 
//     user.rate = 0;
//   }

//   if (!user.profileHistograms || user.profileHistograms === undefined) { 
//     user.profileHistograms = defaultUserProfileHistograms;
//   }
  
//   if (!user.tweetHistograms || user.tweetHistograms === undefined) { 
//     user.tweetHistograms = defaultUserTweetHistograms;
//   }
  
//   return user;
// };

// async function initInfoTwit(params){

//   // return new Promise(function(resolve, reject){

//     console.log(chalkTwitter("WAS | TFC | INIT INFO USER @" + params.screenName));

//     const twitterConfigFile = params.screenName + ".json";

//     let twitterConfig;

//     try {
//       twitterConfig = await loadFileRetry({folder: configuration.twitterConfigFolder, file: twitterConfigFile});

//       if (!twitterConfig){
//         console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
//           + " | " + configuration.twitterConfigFolder + "/" + twitterConfigFile
//         ));
//         throw new Error("TWITTER CONFIG FILE NOT FOUND");
//       }
//     }
//     catch (err){
//       console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
//       throw err;
//     }

//     debug(chalkTwitter("WAS | TFC | INFO TWITTER USER CONFIG\n" + jsonPrint(twitterConfig)));

//     const twitterUserObj = {};

//     twitterUserObj.stats = {};
//     twitterUserObj.stats.ready = false;
//     twitterUserObj.stats.error = false;
//     twitterUserObj.stats.connected = false;
//     twitterUserObj.stats.authenticated = false;
//     twitterUserObj.stats.twitterTokenErrorFlag = false;
//     twitterUserObj.stats.twitterConnects = 0;
//     twitterUserObj.stats.twitterReconnects = 0;
//     twitterUserObj.stats.twitterFollowLimit = false;
//     twitterUserObj.stats.twitterLimit = 0;
//     twitterUserObj.stats.twitterErrors = 0;
//     twitterUserObj.stats.rateLimited = false;

//     twitterUserObj.stats.twitterRateLimit = 0;
//     twitterUserObj.stats.twitterRateLimitRemaining = 0;
//     twitterUserObj.stats.twitterRateLimitResetAt = 0;
//     twitterUserObj.stats.twitterRateLimitRemainingTime = 0;
//     twitterUserObj.stats.twitterRateLimitExceptionFlag = false;

//     twitterUserObj.screenName = twitterConfig.screenName;
//     twitterUserObj.twitterConfig = {};
//     twitterUserObj.twitterConfig = twitterConfig;

//     const newTwit = new Twit({
//       consumer_key: twitterConfig.CONSUMER_KEY,
//       consumer_secret: twitterConfig.CONSUMER_SECRET,
//       access_token: twitterConfig.TOKEN,
//       access_token_secret: twitterConfig.TOKEN_SECRET
//     });

//     twitterUserObj.twit = {};
//     twitterUserObj.twit = newTwit;

//     console.log(chalkTwitter("WAS | TFC | INIT INFO TWITTER USER"
//       + " | NAME: " + twitterConfig.screenName
//     ));

//     try {
//       const tuObj = await checkTwitterRateLimit({twitterUserObj: twitterUserObj});
//       return tuObj;
//     }
//     catch(err){
//       console.log(chalkTwitter("WAS | TFC | *** INIT INFO TWITTER USER | checkTwitterRateLimit ERROR: " + err));
//       throw err;
//     }

//   // });
// }

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

const networkOutput = {};
networkOutput.output = [];
networkOutput.left = 0;
networkOutput.neutral = 0;
networkOutput.right = 0;
networkOutput.none = 0;
networkOutput.positive = 0;
networkOutput.negative = 0;


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

async function processLocationChange(params){

  const locations = params.locations || {};
  const user = params.user;
  const userPropValue = params.userPropValue;

  let text = params.text;
  text += userPropValue + "\n";

  let name = userPropValue.trim().toLowerCase();
  name = name.replace(/\./gi, "");

  const lastSeen = Date.now();

  const nodeId = btoa(name);

  locations[nodeId] = (locations[nodeId] === undefined) ? 1 : locations[nodeId] + 1;

  let locationDoc = await global.globalLocation.findOne({nodeId: nodeId}).exec();

  if (!locationDoc) {

    debug(chalkInfo(MODULE_ID_PREFIX + " | --- LOC DB MISS"
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

    if (configuration.geoCodeEnabled) {

      const geoCodeResults = await geoCode({address: name});

      if (geoCodeResults && geoCodeResults.placeId) {

        locationDoc.geoValid = true;
        locationDoc.geo = geoCodeResults;
        locationDoc.placeId = geoCodeResults.placeId;
        locationDoc.formattedAddress = geoCodeResults.formattedAddress;

        await locationDoc.save();

        statsObj.geo.hits += 1;
        statsObj.geo.total += 1;
        statsObj.geo.hitRate = 100*(statsObj.geo.hits/statsObj.geo.total);

        debug(chalk.blue(MODULE_ID_PREFIX + " | +++ LOC GEO HIT "
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

        locations[geoCodeResults.placeId] = (locations[geoCodeResults.placeId] === undefined) 
          ? 1 
          : locations[geoCodeResults.placeId] + 1;

        user.previousLocation = user.location;
        locationDoc.geoSearch = true;

        return {user: user, locations: locations, text: text};

      } 
      else {

        await locationDoc.save();

        statsObj.geo.misses += 1;
        statsObj.geo.total += 1;
        statsObj.geo.hitRate = 100*(statsObj.geo.hits/statsObj.geo.total);

        debug(chalkLog(MODULE_ID_PREFIX + " | --- LOC GEO MISS"
          + " | GEO: " + locationDoc.geoValid
          + "  H " + statsObj.geo.hits
          + "  M " + statsObj.geo.misses
          + "  T " + statsObj.geo.total
          + " HR: " + statsObj.geo.hitRate.toFixed(2)
          + " | NID: " + locationDoc.nodeId
          + " | N: " + locationDoc.name + " / " + locationDoc.nameRaw
        ));

        user.previousLocation = user.location;
        return {user: user, locations: locations, text: text};
      }
    }
    return {user: user, locations: locations, text: text};
  }
  else {

    locationDoc.mentions += 1;
    locationDoc.lastSeen = lastSeen;

    debug(chalk.green(MODULE_ID_PREFIX + " | +++ LOC DB HIT "
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

        const geoCodeResults = await geoCode({address: name});

        if (geoCodeResults && geoCodeResults.placeId) {

          locationDoc.geoValid = true;
          locationDoc.geo = geoCodeResults;
          locationDoc.placeId = geoCodeResults.placeId;
          locationDoc.formattedAddress = geoCodeResults.formattedAddress;

          statsObj.geo.hits += 1;
          statsObj.geo.total += 1;
          statsObj.geo.hitRate = 100*(statsObj.geo.hits/statsObj.geo.total);

          debug(chalk.blue(MODULE_ID_PREFIX + " | +++ LOC GEO HIT "
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

          locations[geoCodeResults.placeId] = (locations[geoCodeResults.placeId] === undefined) 
            ? 1 
            : locations[geoCodeResults.placeId] + 1;

          user.previousLocation = user.location;
          locationDoc.geoSearch = true;

          await locationDoc.save();
          return {user: user, locations: locations, text: text};
        } 
        else {

          await locationDoc.save();

          statsObj.geo.misses += 1;
          statsObj.geo.total += 1;
          statsObj.geo.hitRate = 100*(statsObj.geo.hits/statsObj.geo.total);

          debug(chalkLog(MODULE_ID_PREFIX + " | --- LOC GEO MISS"
            + " | GEO: " + locationDoc.geoValid
            + "  H " + statsObj.geo.hits
            + "  M " + statsObj.geo.misses
            + "  T " + statsObj.geo.total
            + " HR: " + statsObj.geo.hitRate.toFixed(2)
            + " | NID: " + locationDoc.nodeId
            + " | N: " + locationDoc.name + " / " + locationDoc.nameRaw
          ));

          user.previousLocation = user.location;
          return {user: user, locations: locations, text: text};
        }
      }
    }

    await locationDoc.save();

    const key = (locationDoc.placeId && locationDoc.placeId !== undefined) ? locationDoc.placeId : locationDoc.nodeId;

    locations[key] = (locations[key] === undefined) ? 1 : locations[key] + 1;

    user.previousLocation = user.location;

    return {user: user, locations: locations, text: text};
  }
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

  if (!empty(user[prop]) && (user[prevProp] !== user[prop])) { 

    if (prop === "url") {
      console.log("checkPropertyChange url | @" + user.screenName + " | url: " + user.url + " | prevProp: " + user[prevProp]);
    }
    return true;
  }

  return false;
}

function allHistogramsZeroKeys(histogram){

  return new Promise(function(resolve){

    if (empty(histogram)) {
      resolve(true);
    }

    for (const histogramType of Object.keys(histogram)){
      if (Object.keys(histogram[histogramType]).length > 0) { 
        return resolve(false);
      }
    }

    resolve(true);

  });
}

async function checkUserProfileChanged(params) {

  const user = params.user;
  user.profileHistograms = user.profileHistograms || {};

  let allHistogramsZero = false;

  try{
    allHistogramsZero = await allHistogramsZeroKeys(user.profileHistograms);
  }
  catch(err){
    console.log(chalkError("WAS | TFC | *** ALL HISTOGRAMS ZERO ERROR: " + err));
    throw err;
  }

  if (empty(user.profileHistograms) || allHistogramsZero){

    if (user.profileHistograms === undefined) { user.profileHistograms = {}; }

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

  if ((!user.bannerImageAnalyzed && user.bannerImageUrl) || checkPropertyChange(user, "bannerImageUrl")) { results.push("bannerImageUrl"); }
  if ((!user.profileImageAnalyzed && user.profileImageUrl) || checkPropertyChange(user, "profileImageUrl")) { results.push("profileImageUrl"); }

  if (checkPropertyChange(user, "description")) { results.push("description"); }
  if (checkPropertyChange(user, "expandedUrl")) { results.push("expandedUrl"); }
  if (checkPropertyChange(user, "location")) { results.push("location"); }
  if (checkPropertyChange(user, "name")) { results.push("name"); }
  if (checkPropertyChange(user, "profileUrl")) { results.push("profileUrl"); }
  if (checkPropertyChange(user, "screenName")) { results.push("screenName"); }
  if (checkPropertyChange(user, "url")) { results.push("url"); }

  if (results.length === 0) { return; }
  return results;
}

function emptyHistogram(histogram){

  return new Promise(function(resolve){

    if (!histogram) { return resolve(true); }
    if (histogram === undefined) { return resolve(true); }
    if (histogram === {}) { return resolve(true); }

    for (const histogramType of Object.keys(histogram)){
      if (Object.keys(histogram[histogramType]).length > 0) { return resolve(false); }
    }

    resolve(true);

  });
}

async function analyzeLanguage(params){

  debug(chalkAlert("analyzeLanguage\n" + jsonPrint(params)));

  const document = {
    "content": params.text,
    type: "PLAIN_TEXT"
  };

  const sentimentHistogram = {};

  let responses;

  try {

    responses = await languageClient.analyzeSentiment({document: document});

    const sentiment = responses[0].documentSentiment;

    sentimentHistogram.score = sentiment.score;
    sentimentHistogram.magnitude = sentiment.magnitude;
    sentimentHistogram.comp = 100*sentiment.score*sentiment.magnitude;

    statsObj.analyzer.analyzed += 1;
    statsObj.analyzer.total += 1;

    console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ LANG SENTIMENT"
      + " [" + statsObj.analyzer.analyzed + " TOT ANALYZED]"
      + " | M: " + sentimentHistogram.magnitude.toFixed(5)
      + " | S: " + sentimentHistogram.score.toFixed(5)
      + " | C: " + sentimentHistogram.comp.toFixed(5)
      + " | @" + params.screenName
    ));

    return sentimentHistogram;
  }
  catch(err){
    console.log(chalkError("*** LANGUAGE ANALYZER ERROR", err));
    statsObj.analyzer.errors += 1;
    statsObj.analyzer.total += 1;
    throw err;
  }
}

let startQuotaTimeOut;

function startQuotaTimeOutTimer(p){

  const params = p || {};

  params.duration = params.duration || configuration.languageQuotaTimoutDuration;

  clearTimeout(startQuotaTimeOut);

  console.log(chalkAlert(MODULE_ID_PREFIX + " | *** START LANG QUOTA TIMEOUT"
    + " | " + getTimeStamp()
    + " | DURATION: " + msToTime(configuration.languageQuotaTimoutDuration)
  ));

  startQuotaTimeOut = setTimeout(function(){

    statsObj.languageQuotaFlag = false;

    console.log(chalkAlert(MODULE_ID_PREFIX + " | *** END LANG QUOTA TIMEOUT"
      + " | " + getTimeStamp()
      + " | DURATION: " + msToTime(configuration.languageQuotaTimoutDuration)
    ));

  }, params.duration);
}
async function userLanguageSentiment(params){

  const user = params.user;

  const profileHistogramsEmpty = await emptyHistogram(user.profileHistograms);

  if (profileHistogramsEmpty) { user.profileHistograms = {}; }

  const sentimentHistogramEmpty = await emptyHistogram(user.profileHistograms.sentiment);

  if (sentimentHistogramEmpty) { user.profileHistograms.sentiment = {}; }

  if (configuration.enableLanguageAnalysis && !statsObj.languageQuotaFlag) {

    let profileText = "";

    if (user.name) { profileText = user.name; }
    if (user.screenName) { profileText += "\n" + user.screenName; }
    if (user.location) { profileText += "\n" + user.location; }
    if (user.description) { profileText += "\n" + user.description; }

    try{
      const sentiment = await analyzeLanguage({screenName: user.screenName, text: profileText});
      statsObj.languageQuotaFlag = false;
      return sentiment;
    }
    catch(err){
      if (err.code === 3) {
        console.log(chalkAlert(MODULE_ID_PREFIX + " | userLanguageSentiment | UNSUPPORTED LANG"
          + " | NID: " + user.nodeId
          + " | @" + user.screenName
          + " | " + err
        ));
      }
      else if (err.code === 8) {
        console.error(chalkAlert(MODULE_ID_PREFIX + " | userLanguageSentiment"
          + " | " + getTimeStamp()
          + " | LANGUAGE QUOTA"
          + " | RESOURCE_EXHAUSTED"
          + " | NID: " + user.nodeId
          + " | @" + user.screenName
        ));
        statsObj.languageQuotaFlag = moment().valueOf();
        startQuotaTimeOutTimer();
      }
      else {
        console.error(chalkError(MODULE_ID_PREFIX + " | *** userLanguageSentiment LANGUAGE TEXT ERROR"
          + " | " + err
          + "\n" + jsonPrint(err)
        ));
      }
      throw err;
    }
  }
  else {
    return user;
  }
}

function processUserProfileChanges(params){

  const user = params.user;

  return new Promise(function(resolve, reject){

    if (params.userProfileChanges.length === 0) {
      return resolve(user);
    }

    let text = "";
    const urlsHistogram = {};
    urlsHistogram.urls = {};

    const locationsHistogram = {};
    locationsHistogram.locations = {};

    async.eachSeries(params.userProfileChanges, function(userProp, cb){

      let userPropValue = false;

      if (user[userProp] && (user[userProp] !== undefined)) {
        userPropValue = user[userProp].toLowerCase();
      }

      const prevUserProp = "previous" + _.upperFirst(userProp);

      let domain;
      let domainNodeId;
      let nodeId;

      user[prevUserProp] = (user[prevUserProp] === undefined) ? null : user[prevUserProp];

      if (!userPropValue && (userPropValue !== undefined)) {
        console.log(chalkLog(MODULE_ID_PREFIX
          + " | --- processUserProfileChanges USER PROP VALUE FALSE"
          + " | @" + user.screenName
          + " | PROP: " + userProp
          + " | VALUE: " + userPropValue
        ));
        user[prevUserProp] = user[userProp];
        return cb();
      }

      switch (userProp) {

        case "sentiment":
          cb();
        break;

        case "location":
          processLocationChange({user: user, userPropValue: userPropValue, text: text})
          .then(function(results){
            locationsHistogram.locations = results.locations;
            user.location = results.user.location;
            user.previousLocation = results.user.previousLocation;
            text = results.text;
            cb();
          })
          .catch(function(e0){
            cb(e0);
          });
        break;

        case "name":
        case "description":
          text += userPropValue + "\n";
          user[prevUserProp] = user[userProp];
          cb();
        break;

        case "screenName":
          text += "@" + userPropValue + "\n";
          user[prevUserProp] = user[userProp];
          cb();
        break;

        case "url":
        case "profileUrl":
        case "expandedUrl":
        case "bannerImageUrl":
        case "profileImageUrl":

          if (userPropValue && (typeof userPropValue === "string")){
            domain = urlParse(userPropValue.toLowerCase()).hostname;
            nodeId = btoa(userPropValue.toLowerCase());

            if (userPropValue && domain) { 
              domainNodeId = btoa(domain);
              urlsHistogram.urls[domainNodeId] = (urlsHistogram.urls[domainNodeId] === undefined) ? 1 : urlsHistogram.urls[domainNodeId] + 1; 
            }
            urlsHistogram.urls[nodeId] = (urlsHistogram.urls[nodeId] === undefined) ? 1 : urlsHistogram.urls[nodeId] + 1;
            user[prevUserProp] = user[userProp];
            cb();
          }
          else{
            cb();
          }
        break;

        default:
          console.log(chalkError(MODULE_ID_PREFIX + " | UNKNOWN USER PROPERTY: " + userProp));
          return cb(new Error("UNKNOWN USER PROPERTY: " + userProp));
      }
    }, function(err){

      if (err) {
        console.trace(chalkError(MODULE_ID_PREFIX + " | processUserProfileChanges USER PROFILE HISTOGRAM ERROR: " + err));
        return reject(err);
      }

      async.parallel({

        bannerImageHist: function(cb) {

          if(statsObj.imageParser.rateLimitFlag){
            console.log(chalk.yellow(MODULE_ID_PREFIX + " | VISION RATE LIMITED | @" + user.screenName));
            return cb(null);
          }

          if (
              (configuration.enableImageAnalysis && user.bannerImageUrl && (user.bannerImageUrl !== undefined) && (user.bannerImageUrl != user.bannerImageAnalyzed)
            || (configuration.forceImageAnalysis && user.bannerImageUrl && (user.bannerImageUrl !== undefined))
            )
          ){

            parseImage({
              screenName: user.screenName, 
              category: user.category, 
              imageUrl: user.bannerImageUrl, 
              histograms: user.profileHistograms,
              updateGlobalHistograms: false
            }).
            then(function(imageParseResults){
              if (imageParseResults) { 
                user.bannerImageAnalyzed = user.bannerImageUrl; 
                // bannerImageAnalyzedFlag = true;
                cb(null, imageParseResults);
              }
              else{
                cb(null, {});
              }
            }).
            catch(function(err){
              console.log(chalkError(MODULE_ID_PREFIX + " | processUserProfileChanges USER PROFILE BANNER IMAGE HISTOGRAM ERROR: " + err));
              cb(err, null);
            });

          }
          else {
            cb(null, {});
          }
        }, 

        profileImageHist: function(cb) {

          if(statsObj.imageParser.rateLimitFlag){
            console.log(chalk.yellow(MODULE_ID_PREFIX + " | processUserProfileChanges VISION RATE LIMITED | @" + user.screenName));
            return cb(null);
          }

          if (
              (configuration.enableImageAnalysis && user.profileImageUrl && (user.profileImageUrl !== undefined) && (user.profileImageUrl != user.profileImageAnalyzed)
            || (configuration.forceImageAnalysis && user.profileImageUrl && (user.profileImageUrl !== undefined))
            )
          ){

            parseImage({
              screenName: user.screenName, 
              category: user.category, 
              imageUrl: user.profileImageUrl, 
              histograms: user.profileHistograms,
              updateGlobalHistograms: false
            }).
            then(function(imageParseResults){
              if (imageParseResults) { 
                user.profileImageAnalyzed = user.profileImageUrl; 
                cb(null, imageParseResults);
              }
              else{
                cb(null, {});
              }
            }).
            catch(function(err){
              console.log(chalkError(MODULE_ID_PREFIX + " | processUserProfileChanges USER PROFILE IMAGE HISTOGRAM ERROR: " + err));
              cb(err, null);
            });

          }
          else {
            cb(null, {});
          }
        }, 

        profileTextHist: function(cb){

          if (text && (text !== undefined)){

            parseText({ category: user.category, text: text, updateGlobalHistograms: false }).
            then(function(textParseResults){
              cb(null, textParseResults);
            }).
            catch(function(err){
              if (err) {
                console.log(chalkError(MODULE_ID_PREFIX + " | processUserProfileChanges USER PROFILE PARSE TEXT ERROR: " + err));
              }
              cb(err, null);
            });
          }
          else {
            cb(null, {});
          }
        },

        sentimentHist: function(cb){

          const userProfileSentimentChanges = params.userProfileChanges.includes("name") 
            || params.userProfileChanges.includes("screenName")
            || params.userProfileChanges.includes("location")
            || params.userProfileChanges.includes("description")
            || !user.profileHistograms.sentiment
            || (user.profileHistograms.sentiment === undefined)
            || (user.profileHistograms.sentiment == {});

          if (configuration.enableLanguageAnalysis && !statsObj.languageQuotaFlag && userProfileSentimentChanges){
            userLanguageSentiment({user: user}).
            then(function(sentiment){
              cb(null, sentiment);
            }).
            catch(function(err){
              cb(err, null);
            })
          }
          else{ cb(null, null); }
        }

      }, function(err, results){

        if (err) {
          console.log(chalkError(MODULE_ID_PREFIX + " | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        }

        mergeHistogramsArray( {
          histogramArray: [
            user.profileHistograms,
            results.profileTextHist, 
            results.bannerImageHist, 
            results.profileImageHist, 
            urlsHistogram,
            locationsHistogram,
          ]
        } ).
        then(function(histogramsMerged){
          user.profileHistograms = histogramsMerged;
          user.profileHistograms.sentiment = (results.sentimentHist) ? results.sentimentHist : {};
          resolve(user);
        }).
        catch(function(err){
          console.log(chalkError(MODULE_ID_PREFIX + " | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        });
      });
    });

  });
}

async function userProfileChangeHistogram(params) {

  try{
    const user = params.user;
    const userProfileChanges = await checkUserProfileChanged(params);
    const processUser = await processUserProfileChanges({user: user, userProfileChanges: userProfileChanges});
    return processUser;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** userProfileChangeHistogram ERROR: " + err));
    throw err;
  }
}


function processTweetObj(params){

  return new Promise(function(resolve, reject){

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
            if (empty(entityObj.nodeId)) {
              return cb1(new Error("UNDEFINED NODE ID"));
            }
            entity = "#" + entityObj.nodeId.toLowerCase();
          break;
          case "mentions":
          case "userMentions":
            if (empty(entityObj.screenName)) {
              return cb1(new Error("UNDEFINED SCREEN NAME"));
            }
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
            if (empty(entityObj.nodeId)) {
              return cb1(new Error("UNDEFINED NODE ID"));
            }
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

// let infoRateLimitTimeout;
// let infoRateLimitStatusInterval;

// function generateObjFromArray(params){

//   return new Promise(function(resolve, reject){

//     const keys = params.keys || [];
//     const value = params.value || 0;
//     const result = {};

//     async.each(keys, function(key, cb){

//       result[key.toString()] = value;
//       cb();

//     }, function(err){
//       if (err) {
//         return reject(err);
//       }
//       resolve(result);
//     });

//   });
// }

// async function updateGlobalHistograms(params) {

//   statsObj.status = "UPDATE GLOBAL HISTOGRAMS";

//   let mergedHistograms = {};

//   try {
//     mergedHistograms = await mergeHistograms.merge({ histogramA: params.user.profileHistograms, histogramB: params.user.tweetHistograms });
//     mergedHistograms.friends = await generateObjFromArray({ keys: params.user.friends, value: 1 }); // [ 1,2,3... ] => { 1:1, 2:1, 3:1, ... }
//   }
//   catch(err){
//     console.log(chalkError(MODULE_ID_PREFIX + " | *** UPDATE GLOBAL HISTOGRAMS ERROR: " + err));
//     throw err;
//   }

//   async.each(DEFAULT_INPUT_TYPES, function(inputType, cb0) {

//     if (!mergedHistograms[inputType] || (mergedHistograms[inputType] === undefined)){
//       return cb0();
//     }

//     if (globalHistograms[inputType] === undefined) { globalHistograms[inputType] = {}; }

//     async.each(Object.keys(mergedHistograms[inputType]), function(item, cb1) {

//       if (globalHistograms[inputType][item] === undefined) {
//         globalHistograms[inputType][item] = {};
//         globalHistograms[inputType][item].total = 0;
//         globalHistograms[inputType][item].left = 0;
//         globalHistograms[inputType][item].leftRatio = 0;
//         globalHistograms[inputType][item].neutral = 0;
//         globalHistograms[inputType][item].neutralRatio = 0;
//         globalHistograms[inputType][item].right = 0;
//         globalHistograms[inputType][item].rightRatio = 0;
//         globalHistograms[inputType][item].positive = 0;
//         globalHistograms[inputType][item].positiveRatio = 0;
//         globalHistograms[inputType][item].negative = 0;
//         globalHistograms[inputType][item].negativeRatio = 0;
//         globalHistograms[inputType][item].none = 0;
//         globalHistograms[inputType][item].uncategorized = 0;
//       }

//       globalHistograms[inputType][item].total += 1;

//       if (params.user.category) {
//         if (params.user.category === "left") { globalHistograms[inputType][item].left += 1; }
//         if (params.user.category === "neutral") { globalHistograms[inputType][item].neutral += 1; }
//         if (params.user.category === "right") { globalHistograms[inputType][item].right += 1; }
//         if (params.user.category === "positive") { globalHistograms[inputType][item].positive += 1; }
//         if (params.user.category === "negative") { globalHistograms[inputType][item].negative += 1; }
//         if (params.user.category === "none") { globalHistograms[inputType][item].none += 1; }
//       }
//       else {
//         globalHistograms[inputType][item].uncategorized += 1;
//       }

//       globalHistograms[inputType][item].leftRatio = globalHistograms[inputType][item].left/globalHistograms[inputType][item].total;
//       globalHistograms[inputType][item].neutralRatio = globalHistograms[inputType][item].neutral/globalHistograms[inputType][item].total;
//       globalHistograms[inputType][item].rightRatio = globalHistograms[inputType][item].right/globalHistograms[inputType][item].total;
//       globalHistograms[inputType][item].positiveRatio = globalHistograms[inputType][item].positive/globalHistograms[inputType][item].total;
//       globalHistograms[inputType][item].negativeRatio = globalHistograms[inputType][item].negative/globalHistograms[inputType][item].total;

//       cb1();

//     }, function(err) {

//       if (err) { throw err; }

//       cb0();

//     });

//   }, function(err) {

//     if (err) { throw err; }

//     return;

//   });
// }

async function parseText(params){

  params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
  params.category = (params.category !== undefined) ? params.category : "none";
  params.minWordLength = params.minWordLength || configuration.minWordLength;

  try {
    const hist = await twitterTextParser.parseText(params);
    return hist;
  }
  catch(err){
    console.log(chalkError("*** TWITTER TEXT PARSER ERROR: " + err));
    console.error(err);
    throw err;
  }
}

let imageParserRateTimitTimeout;


function startImageParserRateTimitTimeout(p) {

  const params = p || {};
  const period = params.period || configuration.imageParserRateTimitTimeout;
  const verbose = params.verbose || true;

  clearTimeout(imageParserRateTimitTimeout);

  if (verbose) {
    console.log(chalkLog(MODULE_ID_PREFIX + " | +++ RATE LIMIT TIMEOUT START | NOW: " + getTimeStamp() + " | PERIOD: " + msToTime(period)));
  }

  imageParserRateTimitTimeout = setTimeout(function(){
    if (verbose) {
      console.log(chalkLog(MODULE_ID_PREFIX + " | XXX RATE LIMIT TIMEOUT END | NOW: " + getTimeStamp() + " | PERIOD: " + msToTime(period)));
      statsObj.imageParser.rateLimitFlag = false;
    }
  }, period);
}

function parseImage(params){

  return new Promise(function(resolve, reject) {

    params.updateGlobalHistograms = (params.updateGlobalHistograms !== undefined) ? params.updateGlobalHistograms : false;
    params.category = params.category || "none";

    twitterImageParser.parseImage(params).
    then(function(hist){
      console.log(chalkLog(MODULE_ID_PREFIX + " | +++ IMAGE PARSE" 
        + " | CAT: " + params.category
        + " | @" + params.screenName
        + " | " + params.imageUrl
      ));
      resolve(hist);
    }).
    catch(function(err){

      if (err.code === 8){
        console.log(chalkError(MODULE_ID_PREFIX + " | *** IMAGE PARSER | RATE LIMIT: " + err));
        statsObj.imageParser.rateLimitFlag = true;

        startImageParserRateTimitTimeout(configuration.imageParserRateTimitTimeout);

        return resolve();
      }
      console.log(chalkError(MODULE_ID_PREFIX + " | *** IMAGE PARSER ERROR: " + err));
      console.error(err);
      reject(err);
    });
  });
}

async function updateUserHistograms(params) {

  if ((params.user === undefined) || !params.user) {
    console.log(chalkError(MODULE_ID_PREFIX + " | *** updateUserHistograms USER UNDEFINED"));
    const err = new Error(MODULE_ID_PREFIX + " | *** updateUserHistograms USER UNDEFINED");
    console.error(err);
    throw err;
  }

  const user = params.user;

  if (!user.profileHistograms || (user.profileHistograms === undefined)){ 
    user.profileHistograms = {};
  }

  if (!user.tweetHistograms || (user.tweetHistograms === undefined)){ 
    user.tweetHistograms = {};
  }

  if (!user.friends || (user.friends === undefined)){ 
    user.friends = [];
  }

  try {

    const processedUser = await userProfileChangeHistogram({user: user});

    // await updateGlobalHistograms({user: processedUser});
    return processedUser;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** updateUserHistograms ERROR: " + err));
    throw err;
  }
}

// let uscTimeout;

// function initUserCategorizeQueueInterval(cnf){

//   console.log(chalkTwitter("WAS | TFC | INIT TWITTER USER CATEGORIZE QUEUE INTERVAL: " + cnf.userCategorizeQueueInterval));

//   clearInterval(userCategorizeQueueInterval);

//   let updatedUser;
//   let activateResults;
//   let user;
//   let dbUser;
//   let matchFlag = false;
//   let chalkType = chalkLog;

//   userCategorizeQueueInterval = setInterval(async function(){

//     if (userServerControllerReady && userCategorizeQueueReady && (userCategorizeQueue.length > 0)) {

//       userCategorizeQueueReady = false;

//       user = userCategorizeQueue.shift();

//       if ((!user.nodeId || user.nodeId === undefined) && (!user.userId || user.userId === undefined)){
//         console.log(chalkError("WAS | TFC | *** USER CAT ERROR: USER NODE ID & USER ID UNDEFINED\n" + jsonPrint(user)));
//         userCategorizeQueueReady = true;
//         return;
//       }

//       if (user.userId && (user.userId !== undefined) && (!user.nodeId || (user.nodeId === undefined))){
//         console.log(chalkWarn("WAS | TFC | !!! USER CAT ERROR: USER NODE ID UNDEFINED\n" + jsonPrint(user)));
//         user.nodeId = user.userId;
//       }

//       if (user.nodeId && (user.nodeId !== undefined) && (!user.userId || (user.userId === undefined))){
//         console.log(chalkWarn("WAS | TFC | !!! USER CAT ERROR: USER USER ID UNDEFINED\n" + jsonPrint(user)));
//         user.userId = user.nodeId;
//       }

//       if (configuration.verbose || user.priorityFlag) { printUser("WAS | TFC | USER CAT [ UCATQ: " + userCategorizeQueue.length + " ]", user, chalkLog); }

//       try {
//         updatedUser = await updateUserHistograms({user: user});
//       }
//       catch (err) {
//         console.log(chalkError("WAS | TFC | *** UPDATE USER HISTOGRAMS ERROR: " + err));
//         userChangeCache.del(user.nodeId);
//         userCategorizeQueueReady = true;
//         return;
//       }

//       try {

//         activateResults = await nnTools.activateSingleNetwork({user: updatedUser});

//         if (configuration.verbose || configuration.testMode) {
//           console.log("TFC | >>> ACTIVATE activateResults\n" + jsonPrint(activateResults));
//         }

//         // const networkOutput = {};
//         // activateResults.nnId = nnId;
//         // activateResults.user = {};
//         // activateResults.user.nodeId = params.user.nodeId;
//         // activateResults.user.screenName = params.user.screenName;
//         // activateResults.user.category = params.user.category;
//         // activateResults.user.categoryAuto = params.user.categoryAuto;
//         // activateResults.outputRaw = [];
//         // activateResults.outputRaw = outputRaw;
//         // activateResults.output = [];
//         // activateResults.categoryAuto = "none";
//         // activateResults.matchFlag = "MISS";

//         const currentBestNetworkStats = await nnTools.updateNetworkStats({
//           user: updatedUser,
//           primaryNetwork: true,
//           networkOutput: activateResults, 
//           expectedCategory: activateResults.user.category
//         });

//         process.send({op: "NETWORK_STATS", stats: currentBestNetworkStats});

//         userCategorizeQueueReady = false;
//       }
//       catch (err) {
//         console.log(chalkError("WAS | TFC | *** ACTIVATE NETWORK ERROR: " + err));
//         userChangeCache.del(user.nodeId);
//         userCategorizeQueueReady = true;
//         return;
//       }

//       matchFlag = updatedUser.category 
//         && (updatedUser.category !== undefined) 
//         && (updatedUser.category !== false) 
//         && (updatedUser.category !== "false") 
//         && (updatedUser.category === activateResults.categoryAuto);

//       if (!updatedUser.category || updatedUser.category === undefined) {
//         chalkType = chalkLog;
//       }
//       else if (matchFlag){
//         chalkType = chalkGreen;
//         statsObj.autoChangeTotal += 1;
//         statsObj.autoChangeMatch += 1;
//       }
//       else {
//         chalkType = chalk.yellow;
//         statsObj.autoChangeTotal += 1;
//         statsObj.autoChangeMismatch += 1;
//       }

//       statsObj.autoChangeMatchRate = 100*(statsObj.autoChangeMatch/statsObj.autoChangeTotal);
        
//       updatedUser.lastHistogramTweetId = updatedUser.statusId;
//       updatedUser.lastHistogramQuoteId = updatedUser.quotedStatusId;

//       if (updatedUser.priorityFlag || (updatedUser.categoryAuto !== activateResults.categoryAuto)) {
//         console.log(chalkType("WAS | TFC | >>> NN AUTO CHG"
//           + " | " + statsObj.autoChangeMatchRate.toFixed(2) + "%"
//           + " | M: " + statsObj.autoChangeMatch
//           + " MM: " + statsObj.autoChangeMismatch
//           + " TOT: " + statsObj.autoChangeTotal
//           + " | UC$ " + userChangeCache.getStats().keys
//           + " UCQ " + userCategorizeQueue.length
//           + " NN " + networkObj.networkId
//           + " MTCH " + matchFlag
//           + " | C M: " + updatedUser.category
//           + " A: " + updatedUser.categoryAuto + " > " + activateResults.categoryAuto
//           + " | NID " + updatedUser.nodeId
//           + " @" + updatedUser.screenName
//           + " | PRIORITY: " + updatedUser.priorityFlag
//         ));

//         updatedUser.categoryAuto = activateResults.categoryAuto;

//         process.send({ op: "USER_CATEGORIZED", priorityFlag: updatedUser.priorityFlag, user: updatedUser, stats: statsObj.user });

//       }

//       uscTimeout = setTimeout(function(){
//         console.log(chalkError("WAS | TFC | *** USC FINDONEUSER TIMEOUT"));
//         printUser("WAS | TFC | DB", dbUser, chalkError); 
//       }, 5000);

//       try {

//         dbUser = await userServerController.findOneUserV2({user: updatedUser, mergeHistograms: false, noInc: true});

//         dbUser.priorityFlag = updatedUser.priorityFlag;

//         if (dbUser.priorityFlag || configuration.verbose) { printUser("WAS | TFC | DB", dbUser, chalkLog); }

//         userChangeCache.del(dbUser.nodeId);
//         clearTimeout(uscTimeout);
//         userCategorizeQueueReady = true;
//       }
//       catch(err){
//         console.log(chalkError("WAS | TFC | *** USER FIND ONE ERROR"
//           + " | " + updatedUser.userId
//           + " | @" + updatedUser.screenName
//           + " | " + err
//         ));

//         clearTimeout(uscTimeout);
//         userCategorizeQueueReady = true;
//       }
//     }

//   }, cnf.userCategorizeQueueInterval);
// }

const userTweetsDefault = {
  maxId: MIN_TWEET_ID,
  sinceId: MIN_TWEET_ID,
  tweetIds: []
}

let processUserQueueBusy = false;
let processUserQueueInterval;

async function initProcessUserQueueInterval(interval) {

  console.log(chalkBlue(MODULE_ID_PREFIX + " | INIT PROCESS USER QUEUE INTERVAL | " + interval + " MS"));

  clearInterval(processUserQueueInterval);

  processUserQueueBusy = false;

  processUserQueueInterval = setInterval(async function () {

    if (!processUserQueueBusy && processUserQueue.length > 0) {

      processUserQueueBusy = true;

      const user = processUserQueue.shift();
      
      try {

        const u = await global.globalUser.findOne({nodeId: user.nodeId}).exec();

        if (!u) {
          console.log(chalkAlert(MODULE_ID_PREFIX + " | ??? USER NOT FOUND IN DB"
            + " | NID: " + user.nodeId
            + " | @" + user.screenName
          ));
          processUserQueueBusy = false;
          return;
        }

        const user = await tcUtils.encodeHistogramUrls({user: u});

        if (!user.latestTweets || (user.latestTweets === undefined)) { 
          user.latestTweets = [];
        }
        if (!user.tweetHistograms || (user.tweetHistograms === undefined)) { 
          user.tweetHistograms = {}; 
        }
        if (!user.profileHistograms || (user.profileHistograms === undefined)) { 
          user.profileHistograms = {}; 
        }

        if (user.profileHistograms.sentiment && (user.profileHistograms.sentiment !== undefined)) {

          if (user.profileHistograms.sentiment.magnitude !== undefined){
            if (user.profileHistograms.sentiment.magnitude < 0){
              console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! NORMALIZATION MAG LESS THAN 0 | CLAMPED: " + user.profileHistograms.sentiment.magnitude));
              user.profileHistograms.sentiment.magnitude = 0;
            }
          }

          if (user.profileHistograms.sentiment.score !== undefined){
            if (user.profileHistograms.sentiment.score < -1.0){
              console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! NORMALIZATION SCORE LESS THAN -1.0 | CLAMPED: " + user.profileHistograms.sentiment.score));
              user.profileHistograms.sentiment.score = -1.0;
            }

            if (user.profileHistograms.sentiment.score > 1.0){
              console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! NORMALIZATION SCORE GREATER THAN 1.0 | CLAMPED: " + user.profileHistograms.sentiment.score));
              user.profileHistograms.sentiment.score = 1.0;
            }
          }
        }

        if (configuration.verbose){
          console.log(chalkLog(MODULE_ID_PREFIX + " | FOUND USER DB"
            + " | " + printUser({user: user})
          ));
        }

        defaults(user.tweets, userTweetsDefault);

        if (!user.latestTweets || (user.latestTweets === undefined)) { user.latestTweets = []; }

        user.latestTweets = _.union(user.latestTweets, user.latestTweets);

        const processedUser = await processUser({user: user});

        debug("PROCESSED USER\n" + jsonPrint(processedUser));

        if (configuration.verbose) {
          console.log(chalkAlert(MODULE_ID_PREFIX + " | PROCESSED USER"
            + " | UID: " + processedUser.userId
            + " | @" + processedUser.screenName
            + " | Ts SINCE: " + processedUser.tweets.sinceId
            + " MAX: " + processedUser.tweets.maxId
            + " Ts: " + processedUser.tweets.tweetIds.length
            // + "\ntweets\n" + jsonPrint(user.tweets)
          ));
        }

        process.send({ op: "USER_CATEGORIZED", priorityFlag: processedUser.priorityFlag, user: processedUser, stats: statsObj.user });

        processUserQueueBusy = false;
      }
      catch(err){
        console.trace(chalkError(MODULE_ID_PREFIX + " | *** ERROR processUser"
          + " | USER ID: " + user.userId
          + " | ", err
        ));
        console.log(err);
        processUserQueueBusy = false;
      }

    }
  }, interval);

  return;
}

async function initialize(cnf){

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

    return cnf;

  }
  catch(err){
    console.error("WAS | TFC | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
    throw err;
  }
}

async function generateAutoCategory(params) {

  statsObj.status = "GEN AUTO CAT";

  try{

    const user = await updateUserHistograms({user: params.user});

    const networkOutput = await nnTools.activateSingleNetwork({user: user});

    user.categoryAuto = networkOutput.categoryAuto;

    // const networkOutput = {};
    // networkOutput.nnId = nnId;
    // networkOutput.user = {};
    // networkOutput.user.nodeId = params.user.nodeId;
    // networkOutput.user.screenName = params.user.screenName;
    // networkOutput.user.category = params.user.category;
    // networkOutput.user.categoryAuto = params.user.categoryAuto;
    // networkOutput.outputRaw = [];
    // networkOutput.outputRaw = outputRaw;
    // networkOutput.output = [];
    // networkOutput.categoryAuto = "none";
    // networkOutput.matchFlag = "MISS";

    return user;

  }
  catch(err){
    console.log(chalkError("TFE | *** generateAutoCategory ERROR: " + err));
    throw err;
  }
}

function updatePreviousUserProps(params){

  return new Promise(function(resolve, reject){

    if (!params.user) {
      return reject(new Error("user UNDEFINED"));
    }

    const user = params.user;

    async.each(USER_PROFILE_PROPERTY_ARRAY, function(userProp, cb){

      const prevUserProp = "previous" + _.upperFirst(userProp);

      if (user[userProp] && (user[userProp] !== undefined) && (user[prevUserProp] !== user[userProp])) {
        debug(chalkLog("TFE | updatePreviousUserProps"
          + " | " + prevUserProp + ": " + user[prevUserProp] 
          + " <- " + userProp + ": " + user[userProp]
        ));

        user[prevUserProp] = user[userProp];

      }
      cb();

    }, function(){

      if (user.statusId && (user.statusId !== undefined) && (user.previousStatusId !== user.statusId)) {
        user.previousStatusId = user.statusId;
      }

      if (user.quotedStatusId && (user.quotedStatusId !== undefined) && (user.previousQuotedStatusId !== user.quotedStatusId)) {
        user.previousQuotedStatusId = user.quotedStatusId;
      }

      resolve(user);
    });
  });
}

async function processUser(params) {

  statsObj.status = "PROCESS USER";

  debug(chalkInfo("PROCESS USER\n" + jsonPrint(params.user)));

  if (userServerController === undefined) {
    console.log(chalkError(MODULE_ID_PREFIX + " | *** processUser userServerController UNDEFINED"));
    throw new Error("processUser userServerController UNDEFINED");
  }

  try {

    const user = params.user;
    user.following = true;

    const updatedTweetsUser = await updateUserTweets({user: user});
    const autoCategoryUser = await generateAutoCategory({user: updatedTweetsUser});
    const prevPropsUser = await updatePreviousUserProps({user: autoCategoryUser});

    prevPropsUser.markModified("tweetHistograms");
    prevPropsUser.markModified("profileHistograms");
    prevPropsUser.markModified("tweets");
    prevPropsUser.markModified("latestTweets");

    const savedUser = await prevPropsUser.save();

    if (configuration.verbose){
      console.log(chalkLog(MODULE_ID_PREFIX + " | >>> SAVED USER"
        + " | " + printUser({user: savedUser})
      ));
      console.log(chalkLog(MODULE_ID_PREFIX + " | >>> SAVED USER TWEETS"
        + " | SINCE: " + savedUser.tweets.sinceId
        + " | TWEETS: " + savedUser.tweets.tweetIds.length
      ));
      console.log(chalkLog(MODULE_ID_PREFIX + " | >>> SAVED USER TWEET HISTOGRAMS"
        + "\n" + jsonPrint(savedUser.tweetHistograms)
      ));
      console.log(chalkLog(MODULE_ID_PREFIX + " | >>> SAVED USER PROFILE HISTOGRAMS"
        + "\n" + jsonPrint(savedUser.profileHistograms)
      ));
    }

    return savedUser;

  }
  catch(err) {
    console.log(chalkError(MODULE_ID_PREFIX + " | *** processUser ERROR: " + err));
    throw err;
  }
}


process.on("message", async function(m) {

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
      // maxInputHashMap = m.maxInputHashMap;
      // normalization = m.normalization;

      networkObj = m.networkObj;

      await nnTools.loadNetwork({networkObj: m.networkObj});
      nnTools.setPrimaryNeuralNetwork(m.networkObj.networkId);

      await nnTools.setMaxInputHashMap(m.maxInputHashMap);
      await nnTools.setNormalization(m.normalization);


      console.log(chalkInfo("WAS | TFC | INIT"
        + " | TITLE: " + process.title
        + " | NETWORK: " + networkObj.networkId
        + " | ENABLE GEOCODE: " + configuration.geoCodeEnabled
        + " | ENABLE IMAGE ANALYSIS: " + configuration.enableImageAnalysis
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
        + " | MAX INPUT HM KEYS: " + Object.keys(nnTools.getMaxInputHashMap())
        + " | NORMALIZATION: " + Object.keys(nnTools.getNormalization())
      ));
    break;

    case "NETWORK":

      networkObj = m.networkObj;
      await nnTools.loadNetwork({networkObj: m.networkObj});
      nnTools.setPrimaryNeuralNetwork(m.networkObj.networkId);

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
      await nnTools.setMaxInputHashMap(m.maxInputHashMap);
      console.log(chalkInfo("WAS | TFC | +++ MAX_INPUT_HASHMAP"
        + " | MAX INPUT HM KEYS: " + Object.keys(nnTools.getMaxInputHashMap())
      ));
    break;

    case "NORMALIZATION":
      await nnTools.setNormalization(m.normalization);
      console.log(chalkInfo("WAS | TFC | +++ NORMALIZATION"
        + " | NORMALIZATION: " + Object.keys(nnTools.getNormalization())
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
    // const ituObj = await initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER});
    // configuration.threeceeUser = DEFAULT_INFO_TWITTER_USER;

    // threeceeUserDefaults.screenName = configuration.threeceeUser;

    initProcessUserQueueInterval(configuration.processUserQueueInterval);
  }
  catch(err){
    console.log(chalkError("WAS | TFC | *** INIT INFO TWITTER ERROR: " + err));
  }

}, 5*ONE_SECOND);


