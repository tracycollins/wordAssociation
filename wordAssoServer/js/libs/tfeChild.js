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

let defaultUserTweetHistograms = {};
let defaultUserProfileHistograms = {};

DEFAULT_INPUT_TYPES.forEach(function(type){

  defaultUserTweetHistograms[type] = {};
  defaultUserProfileHistograms[type] = {};

});

let networkObj = {};
let network;

let maxInputHashMap = {};
let normalization = {};
let globalHistograms = {};

let langAnalyzer; // undefined for now

const fieldsTransmit = {
  bannerImageUrl: 1,
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
  previousBannerImageUrl: 1,
  previousDescription: 1,
  previousLocation: 1,
  previousName: 1,
  previousProfileUrl: 1,
  previousScreenName: 1,
  previousStatusId: 1,
  profileUrl: 1,
  rate: 1,
  screenName: 1,
  screenNameLower: 1,
  status: 1,
  statusesCount: 1,
  statusId: 1,
  threeceeFollowing: 1,
  userId: 1
};

const DEFAULT_MAX_TWEET_QUEUE = 500;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 10;
const DEFAULT_CURSOR_BATCH_SIZE = 5000;
const DEFAULT_INFO_TWITTER_USER = "threecee";
const USER_CAT_QUEUE_MAX_LENGTH = 500;

const USER_CHANGE_CACHE_DEFAULT_TTL = 30;
const USER_CHANGE_CACHE_CHECK_PERIOD = 5;

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

const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyDBxA6RmuBcyj-t7gfvK61yp8CDNnRLUlc"
});


// const mergeHistograms = require("./mergeHistograms");
const MergeHistograms = require("@threeceelabs/mergehistograms");
const mergeHistograms = new MergeHistograms();

const twitterTextParser = require("@threeceelabs/twitter-text-parser");
const twitterImageParser = require("@threeceelabs/twitter-image-parser");

const urlParse = require("url-parse");
const btoa = require("btoa");

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
const deepcopy = require("deepcopy");
const NodeCache = require("node-cache");

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
configuration.geoCodeEnabled = false;
configuration.inputsBinaryMode = true;
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.forceImageAnalysis = false;
configuration.enableImageAnalysis = true;
configuration.testMode = false; // per tweet test mode
configuration.userCategorizeQueueInterval = ONE_SECOND;
configuration.userChangeDbQueueInterval = 10;

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
  + "\nPROCESS NAME:  " + process.title 
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

global.dbConnection = false;
const mongoose = require("mongoose");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");

const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const neuralNetworkModel = require("@threeceelabs/mongoose-twitter/models/neuralNetwork.server.model");
const networkInputsModel = require("@threeceelabs/mongoose-twitter/models/networkInputs.server.model");

global.User;

let dbConnectionReady = false;
let dbConnectionReadyInterval;

let UserServerController;
let userServerController;
let userServerControllerReady = false;

let TweetServerController;
let tweetServerController;
let tweetServerControllerReady = false;

// ==================================================================
// USER CHANGE CACHE
// ==================================================================
let userChangeCacheTtl = process.env.USER_CHANGE_CACHE_DEFAULT_TTL;
if (userChangeCacheTtl === undefined) { userChangeCacheTtl = USER_CHANGE_CACHE_DEFAULT_TTL;}

console.log("WAS | TFC | USER CHANGE CACHE TTL: " + userChangeCacheTtl + " SECONDS");

let userChangeCacheCheckPeriod = process.env.USER_CHANGE_CACHE_CHECK_PERIOD;
if (userChangeCacheCheckPeriod === undefined) { userChangeCacheCheckPeriod = USER_CHANGE_CACHE_CHECK_PERIOD;}

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

  return new Promise(async function(resolve, reject){

    try {

      statsObj.status = "CONNECT DB";

      wordAssoDb.connect("TFC_" + process.pid, async function(err, db){

        if (err) {
          console.log(chalkError("WAS | TFC | *** MONGO DB CONNECTION ERROR: " + err));
          callback(err, null);
          statsObj.status = "MONGO CONNECTION ERROR";
          dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("error", async function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "WAS | TFC | *** MONGO DB CONNECTION ERROR ***");
          console.log(chalkError("WAS | TFC | *** MONGO DB CONNECTION ERROR ***"));
          db.close();
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("disconnected", async function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "WAS | TFC | *** MONGO DB DISCONNECTED ***");
          console.log(chalkAlert("WAS | TFC | *** MONGO DB DISCONNECTED ***"));
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        global.dbConnection = db;

        console.log(chalk.green("WAS | TFC | MONGOOSE DEFAULT CONNECTION OPEN"));

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

        global.Emoji = global.dbConnection.model("Emoji", emojiModel.EmojiSchema);
        global.Hashtag = global.dbConnection.model("Hashtag", hashtagModel.HashtagSchema);
        global.Location = global.dbConnection.model("Location", locationModel.LocationSchema);
        global.Media = global.dbConnection.model("Media", mediaModel.MediaSchema);
        global.NeuralNetwork = global.dbConnection.model("NeuralNetwork", neuralNetworkModel.NeuralNetworkSchema);
        global.Place = global.dbConnection.model("Place", placeModel.PlaceSchema);
        global.Tweet = global.dbConnection.model("Tweet", tweetModel.TweetSchema);
        global.Url = global.dbConnection.model("Url", urlModel.UrlSchema);
        global.User = global.dbConnection.model("User", userModel.UserSchema);
        global.Word = global.dbConnection.model("Word", wordModel.WordSchema);

        UserServerController = require("@threeceelabs/user-server-controller");
        userServerController = new UserServerController("TFC_USC");

        TweetServerController = require("@threeceelabs/tweet-server-controller");
        tweetServerController = new TweetServerController("TFC_TSC");

        tweetServerController.on("ready", function(err){
          tweetServerControllerReady = true;
          console.log(chalk.green("WAS | TFC | TSC READY"));
        });

        tweetServerController.on("error", function(err){
          tweetServerControllerReady = false;
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

const DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
const DROPBOX_TFE_CONFIG_FILE = process.env.DROPBOX_TFE_CONFIG_FILE || "twitterFollowerExplorerConfig.json";
const DROPBOX_TFE_STATS_FILE = process.env.DROPBOX_TFE_STATS_FILE || "twitterFollowerExplorerStats.json";

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
    + " | TFE CHILD: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  if ((global.dbConnection !== undefined) && (global.dbConnection.readyState > 0)) {

    global.dbConnection.close(function () {
      
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

  let options = {};

  options.contents = JSON.stringify(jsonObj, null, 2);
  options.path = fullPath;
  options.mode = "overwrite";
  options.autorename = false;

  dropboxClient.filesUpload(options)
    .then(function(response){
      debug(chalkLog("WAS | TFC | ... SAVED DROPBOX JSON | " + options.path));
      callback(null, response);
    })
    .catch(function(error){
      console.error(chalkError("WAS | TFC | " + moment().format(defaultDateTimeFormat) 
        + " | !!! ERROR DROBOX JSON WRITE | FILE: " + fullPath 
        + "\nTFE | ERROR: ", error
      ));
      callback(error.error, null);
    });
}

function loadFile(path, file, callback) {

  console.log(chalkInfo("WAS | TFC | LOAD FOLDER " + path));
  console.log(chalkInfo("WAS | TFC | LOAD FILE " + file));
  console.log(chalkInfo("WAS | TFC | FULL PATH " + path + "/" + file));

  dropboxClient.filesDownload({path: path + "/" + file})
    .then(function(data) {
      console.log(chalkLog("WAS | TFC | " + getTimeStamp()
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
      console.log(chalkLog("WAS | TFC | *** DROPBOX loadFile ERROR: " + file + " | " + error));
      console.log(chalkLog("WAS | TFC | *** DROPBOX READ " + file + " ERROR"));

      if ((error.response.status === 404) || (error.response.status === 409)) {
        console.error(chalkLog("WAS | TFC | *** DROPBOX READ FILE " + file + " NOT FOUND"
          + " ... SKIPPING ...")
        );
        return(callback(null, null));
      }
      if (error.status === 0) {
        console.error(chalkLog("WAS | TFC | *** DROPBOX NO RESPONSE"
          + " ... NO INTERNET CONNECTION? ... SKIPPING ..."));
        return(callback(null, null));
      }
      console.log(chalkError(jsonPrint(error)));
      return(callback(error, null));
    })
    .catch(function(err) {
      console.log(chalkLog("WAS | TFC | *** ERROR DROPBOX LOAD FILE\n" + err));
      callback(err, null);
    });
}

function initStatsUpdate(cnf, callback){

  console.log(chalkInfo("WAS | TFC | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

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
    + " | U " + user.userId
    + " | @" + user.screenName
    + " | N " + user.name 
    + " | L " + user.lang 
    + " | FWs " + user.followersCount
    + " | FDs " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + getTimeStamp(user.lastSeen)
    + " | IG " + user.ignored 
    + " | FW " + user.following 
    + " | 3C " + user.threeceeFollowing 
    + " | LHTID " + user.lastHistogramTweetId 
    + " | LHQID " + user.lastHistogramQuoteId 
    + " | 3C " + user.threeceeFollowing 
    + " | CAT M " + user.category + " A " + user.categoryAuto
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

  console.log(chalkTwitter("WAS | TFC | INIT INFO USER @" + params.screenName));

  const twitterConfigFile = params.screenName + ".json";

  loadFile(configuration.twitterConfigFolder, twitterConfigFile, function(err, twitterConfig){

    if (err){
      console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG FILE LOAD ERROR\n" + err));
      return callback(err, null);
    }

    if (!twitterConfig){
      console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?"
        + " | " + configuration.twitterConfigFolder + "/" + twitterConfigFile
      ));
      return callback("TWITTER CONFIG FILE LOAD ERROR | NOT FOUND?", null);
    }

    console.log(chalkTwitter("WAS | TFC | INFO TWITTER USER CONFIG\n" + jsonPrint(twitterConfig)));

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

    console.log(chalkTwitter("WAS | TFC | INIT INFO TWITTER USER"
      + " | NAME: " + twitterConfig.screenName
    ));

    checkTwitterRateLimit({twitterUserObj: twitterUserObj}, function(err, tuObj){
      if (callback !== undefined) { callback(err, tuObj); }
    });

  });
}

function getFileMetadata(path, file, callback) {

  const fullPath = path + "/" + file;
  debug(chalkInfo("WAS | TFC | FOLDER " + path));
  debug(chalkInfo("WAS | TFC | FILE " + file));
  console.log(chalkInfo("WAS | TFC | getFileMetadata FULL PATH: " + fullPath));

  dropboxClient.filesGetMetadata({path: fullPath})
    .then(function(response) {
      debug(chalkInfo("WAS | TFC | FILE META\n" + jsonPrint(response)));
      return(callback(null, response));
    })
    .catch(function(error) {
      console.log(chalkLog("WAS | TFC | GET FILE METADATA ERROR: " + error));
      console.log(chalkLog("WAS | TFC | GET FILE METADATA ERROR\n" + jsonPrint(error)));
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

    global.User.countDocuments(query, function (err, count) {
      statsObj.numUsersFollowing = count;
      console.log(chalkLog("WAS | TFC | FOUND FOLLOWING IN DB: " + statsObj.numUsersFollowing + " USERS"));
    });

    const cursor = global.User.find(query).select({userId:1, screenName:1, lastSeen:1}).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

    cursor.on("data", function(user) {

      statsObj.numFollowUsers += 1;

      if (followingUserIdSet.has(user.userId)) {

        if (configuration.verbose || (statsObj.numFollowUsers % 100 === 0)) {
          console.log(chalkInfo("WAS | TFC | U | IN SET "
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
          console.log(chalkInfo("WAS | TFC | U | ADD SET"
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
      console.error(chalkLog("WAS | TFC | *** ERROR initFollowingUserIdSet: " + err));
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

      console.log(chalkError("WAS | TFC | *** TWITTER ACCOUNT ERROR"
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

        console.log(chalkLog("WAS | TFC | --- TWITTER RATE LIMIT"
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

function generateNetworkInputIndexed(params){

  return new Promise(function(resolve, reject){

    generateNetworkInputBusy = true;

    const maxInputHashMap = params.maxInputHashMap;

    const inputTypes = Object.keys(params.inputsObj.inputs).sort();
    let networkInput = [];

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

          let inputValue = 0;

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

        async.setImmediate(function() { 
          indexOffset += networkInputTypeNames.length;
          cb0(); 
        });

      });

    }, function(err){

      if (err) { return reject(err); }

      generateNetworkInputBusy = false;

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

      resolve(maxIndex) ; 

    });

  });
}

let activateNetworkBusy = false;

let networkOutput = {};
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

    let user = params.user;

    activateNetworkBusy = true;

    user.profileHistograms = user.profileHistograms || {};
    user.tweetHistograms = user.tweetHistograms || {};
    user.languageAnalysis = user.languageAnalysis || {};

    try {

      const mergedUserHistograms = await mergeHistograms.merge({ histogramA: user.profileHistograms, histogramB: user.tweetHistograms });

      if (networkObj.inputsObj.inputs === undefined) {
        console.log(chalkError("UNDEFINED NETWORK INPUTS OBJ | NETWORK OBJ KEYS: " + Object.keys(networkObj)));
        const err = new Error("UNDEFINED NETWORK INPUTS OBJ");
        console.error(err);
        activateNetworkBusy = false;
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
        console.log(chalkError("RNT | *** ZERO LENGTH NETWORK OUTPUT | " + nnId ));
        activateNetworkBusy = false;
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

      networkOutput.output = categoryAuto;;

      if (configuration.verbose) {
        printNetworkInput({title: params.user.screenName + " | C: " + params.user.category + " | A: " + categoryAuto , inputArray: networkInput});
      }

      activateNetworkBusy = false;
      resolve(networkOutput);

    }
    catch(err){
      console.log(chalkError("RNT | *** ERROR ACTIVATE NETWORK: " + err));
      activateNetworkBusy = false;
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

  });
}

function geoCode(params) {

  return new Promise(function(resolve, reject){

    let components = {};
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
        return ;
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

  Object.keys(histogram).forEach(function(histogramType){
    if (Object.keys(histogram[histogramType]).length > 0) { return false; }
  });

  return true;
}

function checkUserProfileChanged(params) {

  let user = params.user;

  if (!user.profileHistograms 
    || (user.profileHistograms === undefined) 
    || (user.profileHistograms === {})
    || (Object.keys(user.profileHistograms).length === 0)
    || allHistogramsZeroKeys(user.profileHistograms)
  ){

    console.log(chalkLog(
      "WAS | TFC | USER PROFILE HISTOGRAMS UNDEFINED" 
      + " | RST PREV PROP VALUES" 
      + " | @" + user.screenName 
    ));

    user.previousBannerImageUrl = null;
    user.previousDescription = null;
    user.previousExpandedUrl = null;
    user.previousLocation = null;
    user.previousName = null;
    user.previousProfileUrl = null;
    user.previousScreenName = null;
    user.previousUrl = null;
  }

  let results = [];

  if (checkPropertyChange(user, "bannerImageUrl")) { results.push("bannerImageUrl"); }
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

function checkUserStatusChanged(params) {

  let user = params.user;

  if (!user.tweetHistograms 
    || (user.tweetHistograms === undefined) 
    || (user.tweetHistograms === {})
    || (Object.keys(user.tweetHistograms).length === 0)
    || allHistogramsZeroKeys(user.tweetHistograms)
  ){

    console.log(chalkLog(
      "WAS | TFC | USER TWEET HISTOGRAMS UNDEFINED" 
      + " | RST PREV PROP VALUES" 
      + " | @" + user.screenName 
    ));

    user.previousStatusId = null;
    user.previousQuotedStatusId = null;
  }

  let results = [];

  if (checkPropertyChange(user, "statusId")) { results.push("statusId"); }
  if (checkPropertyChange(user, "quotedStatusId")) { results.push("quotedStatusId"); }

  if (results.length === 0) { return; }
  return results;    
}

function userProfileChangeHistogram(params) {

  return new Promise(function(resolve, reject){

    let user = params.user;

    let text = "";

    let urlsHistogram = {};
    urlsHistogram.urls = {};
    let profileUrl = false;
    let bannerImageUrl = false;

    let locationsHistogram = {};
    locationsHistogram.locations = {};

    let profileHistograms = {};

  
    const userProfileChanges = checkUserProfileChanged(params);

    if (!userProfileChanges) {
      return resolve();
    }

    async.each(userProfileChanges, async function(userProp){

      const userPropValue = user[userProp].toLowerCase();

      const prevUserProp = "previous" + _.upperFirst(userProp);

      let domain;
      let domainNodeId;
      let nodeId;
      let geoCodeResults;

      user[prevUserProp] = (!user[prevUserProp] || (user[prevUserProp] === undefined)) ? null : user[prevUserProp];

      switch (userProp) {

        case "location":

          const lastSeen = Date.now();

          const name = userPropValue.trim().toLowerCase().replace(/\./gi, "");
          nodeId = btoa(name);

          locationsHistogram.locations[nodeId] = (locationsHistogram.locations[nodeId] === undefined) ? 1 : locationsHistogram.locations[nodeId] + 1;

          try {

            let locationDoc = await Location.findOne({nodeId: nodeId});

            if (!locationDoc) {

              debug(chalkInfo("WAS | TFC | --- LOC DB MISS"
                + " | NID: " + nodeId
                + " | N: " + name + " / " + userPropValue
              ));

              locationDoc = new Location({
                nodeId: nodeId,
                name : name,
                nameRaw : userPropValue,
                geoSearch: false,
                geoValid: false,
                lastSeen : lastSeen,
                mentions : 0
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

                return;

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

                return;

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

              return;
            }

          }
          catch(err){
            console.log(chalkError("TCS | *** GEOCODE ERROR", err));
            return;
          }
        break;

        case "name":
        case "description":
          text += userPropValue + "\n";

          user[prevUserProp] = user[userProp];

          return;
        break;

        case "screenName":
          text += "@" + userPropValue + "\n";

          user[prevUserProp] = user[userProp];

          return;
        break;

        case "url":
        case "profileUrl":
        case "expandedUrl":
        case "bannerImageUrl":

          domain = urlParse(userPropValue.toLowerCase()).hostname;
          nodeId = btoa(userPropValue.toLowerCase());

          if (domain) { 
            domainNodeId = btoa(domain);
            urlsHistogram.urls[domainNodeId] = (urlsHistogram.urls[domainNodeId] === undefined) ? 1 : urlsHistogram.urls[domainNodeId] + 1; 
          }
          urlsHistogram.urls[nodeId] = (urlsHistogram.urls[nodeId] === undefined) ? 1 : urlsHistogram.urls[nodeId] + 1;

          user[prevUserProp] = user[userProp];

          return;
        break;

        default:
          console.log(chalkError("WAS | TFC | UNKNOWN USER PROPERTY: " + userProp));
          return (new Error("UNKNOWN USER PROPERTY: " + userProp));
      }


    }, function(err){

      if (err) {
        console.log(chalkError("WAS | TFC | USER PROFILE HISTOGRAM ERROR: " + err));
        return reject(err);
      }

      async.parallel({

        imageHist: function(cb) {

          if (configuration.enableImageAnalysis && bannerImageUrl){

            parseImage({
              screenName: user.screenName, 
              category: user.category, 
              imageUrl: bannerImageUrl, 
              histograms: user.profileHistograms,
              updateGlobalHistograms: true
            })
            .then(function(imageParseResults){
              cb(null, imageParseResults);
            })
            .catch(function(err){
              console.log(chalkError("WAS | TFC | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
              cb(err, null);
            });

          }
          else {
            cb(null, null);
          }
        }, 

        textHist: function(cb){

          if (text && (text !== undefined)){

            parseText({ category: user.category, text: text, updateGlobalHistograms: true })
            .then(function(textParseResults){

              cb(null, textParseResults);

            })
            .catch(function(err){
              if (err) {
                console.log(chalkError("WAS | TFC | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
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

        mergeHistogramsArray( {histogramArray: [ results.textHist, results.imageHist, urlsHistogram, locationsHistogram ]} )
        .then(function(histogramsMerged){
          resolve(histogramsMerged);
        })
        .catch(function(err){
          console.log(chalkError("WAS | TFC | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        });
      });

    });

  });
}

function userStatusChangeHistogram(params) {

  return new Promise(function(resolve, reject){

    let user = params.user;
  
    const userStatusChangeArray = checkUserStatusChanged(params);

    if (!userStatusChangeArray) {
      return resolve();
    }

    let tweetHistograms = {};
    let text = "";

    async.eachSeries(userStatusChangeArray, function(userProp, cb){

      delete user._id; // fix for UnhandledPromiseRejectionWarning: RangeError: Maximum call stack size exceeded

      const prevUserProp = "previous" + _.upperFirst(userProp);

      if (configuration.verbose) {
        console.log(chalkLog("WAS | TFC | +++ USER STATUS CHANGE"
          + " | NODE ID: " + user.nodeId 
          + " | @" + user.screenName 
          + " | " + userProp 
          + " | " + user[userProp] + " <-- " + user[prevUserProp]
          // + "\n" + jsonPrint(user) 
        ));
      }

      let tscParams = {
        globalTestMode: configuration.globalTestMode,
        testMode: configuration.testMode,
        inc: false,
        twitterEvents: configEvents
      };

      if (userProp === "statusId"){

        let status = deepcopy(user.status);  // avoid circular references

        user.statusId = user.statusId.toString();
        user.previousStatusId = user.statusId;

        tscParams.tweetStatus = {};
        tscParams.tweetStatus = status;
        tscParams.tweetStatus.user = {};
        tscParams.tweetStatus.user = user;
        tscParams.tweetStatus.user.isNotRaw = true;
      }

      if (userProp === "quotedStatusId"){

        let quotedStatus = deepcopy(user.quotedStatus);  // avoid circular references

        user.quotedStatusId = user.quotedStatusId.toString();
        user.previousQuotedStatusId = user.quotedStatusId;

        tscParams.tweetStatus = {};
        tscParams.tweetStatus = quotedStatus;
        tscParams.tweetStatus.user = {};
        tscParams.tweetStatus.user = user;
        tscParams.tweetStatus.user.isNotRaw = true;
      }

      // console.log(chalkAlert("WAS | TFC | tscParams\n", jsonPrint(tscParams)));

      tweetServerController.createStreamTweet(tscParams)
      .then(function(tweetObj){

        // console.log(chalkLog("WAS | TFC | CREATE STREAM TWEET | " + Object.keys(tweetObj)));

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
                // entity = (entityObj.expandedUrl && entityObj.expandedUrl !== undefined) ? entityObj.expandedUrl.toLowerCase() : entityObj.nodeId;
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
            }

            if (!tweetHistograms[entityType] || (tweetHistograms[entityType] === undefined)){
              tweetHistograms[entityType] = {};
              tweetHistograms[entityType][entity] = 1;
            }

            if (!tweetHistograms[entityType][entity] || (tweetHistograms[entityType][entity] === undefined)){
              tweetHistograms[entityType][entity] = 1;
            }

            if (configuration.verbose) {
              console.log(chalkLog("WAS | TFC | +++ USER TWEET HIST"
                + " | " + entityType.toUpperCase()
                + " | " + entity
                + " | " + tweetHistograms[entityType][entity]
              ));
            }

            async.setImmediate(function() { cb1(); });

          }, function(){

            async.setImmediate(function() { cb0(); });

          });
        }, function(err0){

          async.setImmediate(function() { cb(); });

        });
      })
      .catch(function(err){
        return cb(err);
      });

    }, function(err){

      if (err) {
        console.log(chalkError("WAS | TFC | USER STATUS HISTOGRAM ERROR: " + err));
        return reject(err);
      }

      resolve(tweetHistograms);
 
    });

  });
}

function updateUserHistograms(params) {

  return new Promise(async function(resolve, reject){
    
    if ((params.user === undefined) || !params.user) {
      console.log(chalkError("WAS | TFC | *** updateUserHistograms USER UNDEFINED"));
      const err = new Error("WAS | TFC | *** updateUserHistograms USER UNDEFINED");
      console.error(err);
      return reject(err);
    }

    let user;

    params.user.userId = (params.user.nodeId && !params.user.userId) ? params.user.nodeId : params.user.userId;

    try {
      user = await global.User.findOne({nodeId: params.user.nodeId});
      if (!user) {
        user = global.User(params.user);
      }
    }
    catch (err){
      console.log(chalkError("WAS | TFE | *** updateUserHistograms USER FIND ERROR"
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
    }

    user.profileHistograms = user.profileHistograms || {};
    user.tweetHistograms = user.tweetHistograms || {};

    userStatusChangeHistogram({user: user})

      .then(function(tweetHistogramChanges){

        userProfileChangeHistogram(params)
        .then(function(profileHistogramChanges){

          async.parallel({

            profileHist: function(cb){

              if (profileHistogramChanges) {

                mergeHistograms.merge({ histogramA: user.profileHistograms, histogramB: profileHistogramChanges })
                .then(function(profileHist){
                  cb(null, profileHist);
                })
                .catch(function(err){
                  console.log(chalkError("WAS | TFC | *** MERGE HISTOGRAMS ERROR | PROFILE: " + err));
                  return cb(err, null);
                });

              }
              else {
                cb(null, user.profileHistograms);
              }

            },

            tweetHist: function(cb){

              if (tweetHistogramChanges) {

                mergeHistograms.merge({ histogramA: user.tweetHistograms, histogramB: tweetHistogramChanges })
                .then(function(tweetHist){
                  cb(null, tweetHist);
                })
                .catch(function(err){
                  console.log(chalkError("WAS | TFC | *** MERGE HISTOGRAMS ERROR | TWEET: " + err));
                  return cb(err, null);
                });

              }
              else {
                cb(null, user.tweetHistograms);
              }
            }

          }, function(err, results){
            if (err) {
              return reject(err);
            }

            user.profileHistograms = results.profileHist;
            user.tweetHistograms = results.tweetHist;

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

            updateGlobalHistograms({user: user})
            .then(function(){
              resolve(user);
            })
            .catch(function(err){
              console.log(chalkError("WAS | TFC | *** UPDATE USER HISTOGRAM ERROR: " + err));
              return reject(err);
            });

          });

        });

      })
      .catch(function(err){
        console.log(chalkError("WAS | TFC | *** UPDATE USER HISTOGRAM ERROR: " + err));
        return reject(err);
      });
  });
}

let uscTimeout;

function initUserCategorizeQueueInterval(cnf){

  console.log(chalkTwitter("WAS | TFC | INIT TWITTER USER CATEGORIZE QUEUE INTERVAL: " + cnf.userCategorizeQueueInterval));

  clearInterval(userCategorizeQueueInterval);

  userCategorizeQueueInterval = setInterval(async function(){

    if (userServerControllerReady && userCategorizeQueueReady && (userCategorizeQueue.length > 0)) {

      userCategorizeQueueReady = false;

      let user = userCategorizeQueue.shift();

      if ((!user.nodeId || user.nodeId === undefined) && (!user.userId || user.userId === undefined)){
        console.log(chalkError("WAS | TFC | *** USER CAT ERROR: USER NODE ID & USER ID UNDEFINED\n" + jsonPrint(user)));
        userCategorizeQueueReady = true;
        return;
      }

      user.nodeId = user.userId;

      printUserObj("WAS | TFC | USER CAT [UCATQ: " + userCategorizeQueue.length + "]", user, chalkLog);

      let updatedUser;
      let networkOutput;

      try {
        updatedUser = await updateUserHistograms({user: user});
        networkOutput = await activateNetwork({user: updatedUser});
      }
      catch (err) {
        console.log(chalkError("WAS | TFC | *** UPDATE USER HISTOGRAMS ERROR: " + err));
        console.error(err);
        userChangeCache.del(user.nodeId);
        userCategorizeQueueReady = true;
        return;
      }

      if (updatedUser.categoryAuto !== networkOutput.output) {
        console.log(chalkLog("WAS | TFC | >>> NN AUTO CAT CHANGE"
          + " [UC$: " + userChangeCache.getStats().keys + "]"
          + " [UCATQ: " + userCategorizeQueue.length + "]"
          + " | " + networkObj.networkId
          + " | AUTO: " + updatedUser.categoryAuto + " > " + networkOutput.output
          + " | NODE ID: " + updatedUser.nodeId
          + " | @" + updatedUser.screenName
        ));
      }

      updatedUser.categoryAuto = networkOutput.output;
      updatedUser.lastHistogramTweetId = updatedUser.statusId;
      updatedUser.lastHistogramQuoteId = updatedUser.quotedStatusId;

      if (typeof updatedUser.previousLocation !== "string") { updatedUser.previousLocation = ""; }
      if (typeof updatedUser.previousUrl !== "string") { updatedUser.previousUrl = ""; }
      if (typeof updatedUser.previousBannerImageUrl !== "string") { updatedUser.previousBannerImageUrl = ""; }
      if (typeof updatedUser.previousScreenName !== "string") { updatedUser.previousScreenName = ""; }
      if (typeof updatedUser.previousProfileUrl !== "string") { updatedUser.previousProfileUrl = ""; }
      if (typeof updatedUser.previousName !== "string") { updatedUser.previousName = ""; }

      uscTimeout = setTimeout(function(){

        console.log(chalkError("WAS | TFC | *** USC FINDONEUSER TIMEOUT"));

        printUserObj("WAS | TFC | " 
          + " [UC$: " + userChangeCache.getStats().keys + "]"
          + " [UCQ: " + userCategorizeQueue.length + "]"
          + " | NN: " + networkObj.networkId + " | ", updatedUser, chalkInfo);

        quit({cause: "USC TIMEOUT"});

      }, 5000);

      try {
        let dbUser = await userServerController.findOneUserV2({user: updatedUser, mergeHistograms: false, noInc: true});
        printUserObj("WAS | TFC | " 
          + " [UC$: " + userChangeCache.getStats().keys + "]"
          + " [UCQ: " + userCategorizeQueue.length + "]"
          + " | NN: " + networkObj.networkId + " | DB CAT", dbUser, chalkInfo);

        userChangeCache.del(dbUser.nodeId);
      }
      catch(err){
        console.log(chalkError("WAS | TFC | *** USER FIND ONE ERROR: " + err));
      }

      clearTimeout(uscTimeout);
      userCategorizeQueueReady = true;
    }


  }, cnf.userCategorizeQueueInterval);
}

function initialize(cnf, callback){

  console.log(chalkLog("WAS | TFC | INITIALIZE"));

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

  debug(chalkWarn("WAS | TFC | dropboxConfigFolder: " + dropboxConfigFolder));
  debug(chalkWarn("WAS | TFC | dropboxConfigFile  : " + dropboxConfigFile));

  loadFile(dropboxConfigHostFolder, dropboxConfigFile, function(err, loadedConfigObj){

    // let commandLineConfigKeys;
    let configArgs;

    if (!err) {
      console.log("WAS | TFC | " + dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

      if (loadedConfigObj.TFE_VERBOSE_MODE  !== undefined){
        console.log("WAS | TFC | LOADED TFE_VERBOSE_MODE: " + loadedConfigObj.TFE_VERBOSE_MODE);
        cnf.verbose = loadedConfigObj.TFE_VERBOSE_MODE;
      }

      if (loadedConfigObj.TFE_GLOBAL_TEST_MODE  !== undefined){
        console.log("WAS | TFC | LOADED TFE_GLOBAL_TEST_MODE: " + loadedConfigObj.TFE_GLOBAL_TEST_MODE);
        cnf.globalTestMode = loadedConfigObj.TFE_GLOBAL_TEST_MODE;
      }

      if (loadedConfigObj.TFE_TEST_MODE  !== undefined){
        console.log("WAS | TFC | LOADED TFE_TEST_MODE: " + loadedConfigObj.TFE_TEST_MODE);
        cnf.testMode = loadedConfigObj.TFE_TEST_MODE;
      }

      if (loadedConfigObj.TFE_GEOCODE_ENABLED  !== undefined){
        console.log("WAS | TFC | LOADED TFE_GEOCODE_ENABLED: " + loadedConfigObj.TFE_GEOCODE_ENABLED);
        cnf.geoCodeEnabled = loadedConfigObj.TFE_GEOCODE_ENABLED;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER  !== undefined){
        console.log("WAS | TFC | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER));
        cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
      }

      if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE  !== undefined){
        console.log("WAS | TFC | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE: " 
          + jsonPrint(loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE));
        cnf.twitterConfigFile = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FILE;
      }

      if (loadedConfigObj.TFE_STATS_UPDATE_INTERVAL  !== undefined) {
        console.log("WAS | TFC | LOADED TFE_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TFE_STATS_UPDATE_INTERVAL);
        cnf.statsUpdateIntervalTime = loadedConfigObj.TFE_STATS_UPDATE_INTERVAL;
      }

      if (loadedConfigObj.TFE_MAX_TWEET_QUEUE  !== undefined) {
        console.log("WAS | TFC | LOADED TFE_MAX_TWEET_QUEUE: " + loadedConfigObj.TFE_MAX_TWEET_QUEUE);
        cnf.maxTweetQueue = loadedConfigObj.TFE_MAX_TWEET_QUEUE;
      }

      // OVERIDE CONFIG WITH COMMAND LINE ARGS

      configArgs = Object.keys(cnf);

      configArgs.forEach(function(arg){
        console.log("WAS | TFC | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });

      initStatsUpdate(cnf, function(err, cnf2){

        if (err) {
          console.log(chalkLog("WAS | TFC | ERROR initStatsUpdate\n" + err));
        }

        loadFile(cnf.twitterConfigFolder, cnf.twitterConfigFile, function(err, tc){
          if (err){
            console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG LOAD ERROR\n" + err));
            quit();
            return;
          }

          cnf2.twitterConfig = {};
          cnf2.twitterConfig = tc;

          console.log("WAS | TFC | " + chalkInfo(getTimeStamp() + " | TWITTER CONFIG FILE " 
            + cnf2.twitterConfigFolder
            + cnf2.twitterConfigFile
            + "\n" + jsonPrint(cnf2.twitterConfig )
          ));
          return(callback(null, cnf2));
        });
      });
    }
    else {
      console.error("WAS | TFC | *** ERROR LOAD DROPBOX CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));

      if (err.status === 404){

        configArgs = Object.keys(cnf);

        configArgs.forEach(function(arg){
          console.log("WAS | TFC | FINAL CONFIG | " + arg + ": " + cnf[arg]);
        });

        initStatsUpdate(cnf, function(err, cnf2){

          if (err) {
            console.log(chalkLog("WAS | TFC | ERROR initStatsUpdate\n" + jsonPrint(err)));
          }

          loadFile(cnf.twitterConfigFolder, cnf.twitterConfigFile, function(err, tc){
            if (err){
              console.error(chalkLog("WAS | TFC | *** TWITTER CONFIG LOAD ERROR\n" + err));
              quit();
              return;
            }

            cnf2.twitterConfig = {};
            cnf2.twitterConfig = tc;

            console.log("WAS | TFC | " + chalkInfo(getTimeStamp() + " | TWITTER CONFIG FILE " 
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

  debug(chalkAlert("TFC RX MESSAGE"
    + " | OP: " + m.op
  ));


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

      // networksHashMap.set(m.networkObj.networkId, m.networkObj);

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

      network = neataptic.Network.fromJSON(m.networkObj.network);

      m.networkObj.network = {};
      m.networkObj.network = network;

      networksHashMap.set(m.networkObj.networkId, m.networkObj);

      console.log(chalkInfo("WAS | TFC | +++ NETWORK"
        + " | NNs IN HM: " + networksHashMap.size
        + " | NETWORK: " + networksHashMap.get(m.networkObj.networkId).networkId
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

      let twitterUserObj = twitterUserHashMap.get(m.user.screenName);

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

      if (!m.user.nodeId || (m.user.nodeId === undefined)) { 
        console.log(chalkError("WAS | TFC | ??? USER NODE ID UNDEFINED ... SET TO USER ID"
          + " | UID: " + m.user.userId
          + " | @" + m.user.screenName
        ));
        m.user.nodeId = m.user.userId;
      }

      const cacheObj = userChangeCache.get(m.user.nodeId);

      if (configuration.verbose && (cacheObj === undefined)) { 
        console.log(chalkInfo("WAS | TFC | USER CAT $ MISS"
          + " [UC$: " + userChangeCache.getStats().keys + "]"
          + " [UCATQ: " + userCategorizeQueue.length + "]"
          + " | NID: " + m.user.nodeId
          + " | @" + m.user.screenName
        ));
      }

      if ((cacheObj === undefined) && !userCategorizeQueue.includes(m.user.userId) && (userCategorizeQueue.length < USER_CAT_QUEUE_MAX_LENGTH)) {
        try {

          let user = m.user.toObject();

          userCategorizeQueue.push(user);
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
          userCategorizeQueue.push(m.user);
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

      // userChangeCache.set(m.user.nodeId, {user: m.user, timeStamp: moment().valueOf()});

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
      console.error(chalkLog("WAS | TFC | TWP | *** TFE UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));

  }
});

setTimeout(function(){

  initialize(configuration, async function(err, cnf){

    if (err && (err.status !== 404)) {
      console.error(chalkLog("WAS | TFC | *** INIT ERROR \n" + jsonPrint(err)));
      quit();
    }

    configuration = cnf;

    console.log("WAS | TFC | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");


    try {
      global.dbConnection = await connectDb();
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

    initInfoTwit({screenName: DEFAULT_INFO_TWITTER_USER}, async function(err, ituObj){
      infoTwitterUserObj = ituObj;
      // initUserChangeDbQueueInterval(configuration);
      initUserCategorizeQueueInterval(configuration);
      // await initDbUserChangeStream({db: global.dbConnection});
    });

  });
}, 5*ONE_SECOND);


