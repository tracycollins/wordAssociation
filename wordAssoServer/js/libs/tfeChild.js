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
configuration.inputsBinaryMode = true;
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.forceImageAnalysis = false;
configuration.enableImageAnalysis = false;
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

function connectDb(){

  return new Promise(async function(resolve, reject){

    try {

      statsObj.status = "CONNECT DB";

      wordAssoDb.connect("TFC_" + process.pid, async function(err, db){

        if (err) {
          console.log(chalkError("TFC | *** MONGO DB CONNECTION ERROR: " + err));
          callback(err, null);
          statsObj.status = "MONGO CONNECTION ERROR";
          dbConnectionReady = false;
          quit(statsObj.status);
          return reject(err);
        }

        db.on("error", async function(){
          statsObj.status = "MONGO ERROR";
          console.error.bind(console, "TFE | *** MONGO DB CONNECTION ERROR ***");
          console.log(chalkError("TFE | *** MONGO DB CONNECTION ERROR ***"));
          db.close();
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        db.on("disconnected", async function(){
          statsObj.status = "MONGO DISCONNECTED";
          console.error.bind(console, "TFE | *** MONGO DB DISCONNECTED ***");
          console.log(chalkAlert("TFE | *** MONGO DB DISCONNECTED ***"));
          dbConnectionReady = false;
          quit(statsObj.status);
        });

        global.dbConnection = db;

        console.log(chalk.green("TFC | MONGOOSE DEFAULT CONNECTION OPEN"));

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
          console.log(chalk.green("TFC | TSC READY"));
        });

        tweetServerController.on("error", function(err){
          tweetServerControllerReady = false;
          console.trace(chalkError("TFE | *** TSC ERROR | " + err));
        });

        userServerControllerReady = false;
        userServerController.on("ready", function(appname){

          statsObj.status = "MONGO DB CONNECTED";

          userServerControllerReady = true;
          console.log(chalkLog("TFC | USC READY | " + appname));
          dbConnectionReady = true;

          resolve(db);

          // initDbUserChangeStream({db: db})
          // .then(function(){
          //   resolve(db);
          // })
          // .catch(function(err){
          //   console.log(chalkError("TFE | *** INIT DB CHANGE STREAM ERROR: " + err));
          //   return reject(err);
          // });

        });

      });
    }
    catch(err){
      console.log(chalkError("TFE | *** MONGO DB CONNECT ERROR: " + err));
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
            "TFE | =========================="
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

    global.User.countDocuments(query, function (err, count) {
      statsObj.numUsersFollowing = count;
      console.log(chalkLog("TFE | FOUND FOLLOWING IN DB: " + statsObj.numUsersFollowing + " USERS"));
    });

    const cursor = global.User.find(query).select({userId:1, screenName:1, lastSeen:1}).lean().cursor({ batchSize: DEFAULT_CURSOR_BATCH_SIZE });

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

            // let inputValue = 0;

            networkInput[indexOffset + index] = (maxInputHashMap[inputType][inputName] > 0) 
              ? histogramObj[inputName]/maxInputHashMap[inputType][inputName] 
              : 1;

            // networkInput[indexOffset + index] = inputValue;

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

      // if (configuration.verbose) {
      //   printNetworkInput({title: title, inputArray: networkInput});
      // }

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
      console.log(chalkError("TFE | *** UPDATE GLOBAL HISTOGRAMS ERROR: " + err));
      return reject(err);
    }

    // async.each(Object.keys(mergedHistograms), function(type, cb0) {
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

function checkUserProfileChanged(params) {

  let user = params.user;

  let results = [];

  if (user.name && (user.name !== undefined) && (user.name !== user.previousName)) { results.push("name"); }
  if (user.screenName && (user.screenName !== undefined) && (user.screenName !== user.previousScreenName)) { results.push("screenName"); }
  if (user.description && (user.description !== undefined) && (user.description !== user.previousDescription)) { results.push("description"); }
  if (user.location && (user.location !== undefined) && (user.location !== user.previousLocation)) { results.push("location"); }
  if (user.url && (user.url !== undefined) && (user.url !== user.previousUrl)) { results.push("url"); }
  if (user.expandedUrl && (user.expandedUrl !== undefined) && (user.expandedUrl !== user.previousExpandedUrl)) { results.push("expandedUrl"); }
  if (user.profileUrl && (user.profileUrl !== undefined) && (user.profileUrl !== user.previousProfileUrl)) { results.push("profileUrl"); }
  if (user.bannerImageUrl && (user.bannerImageUrl !== undefined) && (user.bannerImageUrl !== user.previousBannerImageUrl)) { results.push("bannerImageUrl"); }

  if (results.length === 0) { return; }
  return results;    
}

function checkUserStatusChanged(params) {

  let user = params.user;

  let results = [];

  if (user.statusId !== user.previousStatusId) { results.push("statusId"); }
  if (user.quotedStatusId !== user.previousQuotedStatusId) { results.push("quotedStatusId"); }

  if (results.length === 0) { return; }
  return results;    
}

function userProfileChangeHistogram(params) {

  let text = "";
  let urlsHistogram = {};
  urlsHistogram.urls = {};
  let profileUrl = false;
  let bannerImageUrl = false;

  let profileHistograms = {};

  return new Promise(function(resolve, reject){

    let user = params.user;
  
    const userProfileChanges = checkUserProfileChanged(params);

    if (!userProfileChanges) {
      return resolve();
    }

    async.each(userProfileChanges, function(userProp, cb){

      const userPropValue = user[userProp].toLowerCase();

      const prevUserProp = "previous" + _.upperFirst(userProp);

      let domain;
      let nodeId;

      user[prevUserProp] = (!user[prevUserProp] || (user[prevUserProp] === undefined)) ? {} : user[prevUserProp];

      switch (userProp) {

        case "name":
        case "location":
        case "description":
          text += userPropValue + "\n";
        break;

        case "screenName":
          text += "@" + userPropValue + "\n";
        break;

        case "url":
        case "profileUrl":
        case "expandedUrl":
          domain = urlParse(userPropValue.toLowerCase()).hostname;
          nodeId = btoa(userPropValue.toLowerCase());

          if (domain) { urlsHistogram.urls[domain] = (urlsHistogram.urls[domain] === undefined) ? 1 : urlsHistogram.urls[domain] + 1; }
          urlsHistogram.urls[nodeId] = (urlsHistogram.urls[nodeId] === undefined) ? 1 : urlsHistogram.urls[nodeId] + 1;
        break;

        case "bannerImageUrl":
          bannerImageUrl = userPropValue;
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

      // console.log("text: " + text);
      // console.log("urlsHistogram\n" + jsonPrint(urlsHistogram));

      async.parallel({

        imageHist: function(cb) {

          if (configuration.enableImageAnalysis && bannerImageUrl){

            parseImage({
              screenName: user.screenName, 
              category: user.category, 
              imageUrl: bannerImageUrl, 
              histograms: user.histograms,
              updateGlobalHistograms: true
            })
            .then(function(imageParseResults){
              // console.log(chalkLog("TFE | IMAGE PARSE imageParseResults\n" + jsonPrint(imageParseResults)));
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


            parseText({ category: user.category, text: text, updateGlobalHistograms: true })
            .then(function(textParseResults){

              if (Object.keys(urlsHistogram.urls).length > 0) {

                mergeHistograms.merge({ histogramA: textParseResults, histogramB: urlsHistogram })
                .then(function(textMergeResults){

                  cb(null, textMergeResults);
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
            // console.log(chalkLog("TFE | URLS urlsHistogram\n" + jsonPrint(urlsHistogram)));
            cb(null, urlsHistogram);
          }
        }

      }, function(err, results){


        mergeHistograms.merge({ histogramA: results.textHist, histogramB: results.imageHist})
        .then(function(histogramsMerged){

          // console.log(chalkAlert("TFE | histogramsMerged\n" + jsonPrint(histogramsMerged)));

          resolve(histogramsMerged);
        })
        .catch(function(err){
          console.log(chalkError("TFE | USER PROFILE CHANGE HISTOGRAM ERROR: " + err));
          return reject(err);
        });
      });

    });

  });
}

// function userStatusChangeHistogram(params) {

//   return new Promise(function(resolve, reject){

//     let user = params.user;
  
//     const userStatusChangeArray = checkUserStatusChanged(params);

//     if (!userStatusChangeArray) {
//       return resolve();
//     }

//     let tweetHistograms = {};
    
//     async.eachSeries(userStatusChangeArray, function(userProp, cb){

//       delete user._id; // fix for UnhandledPromiseRejectionWarning: RangeError: Maximum call stack size exceeded

//       const prevUserProp = "previous" + _.upperFirst(userProp);

//       console.log(chalkLog("TFE | +++ USER STATUS CHANGE"
//         + " | NODE ID: " + user.nodeId 
//         + " | @" + user.screenName 
//         + " | " + userProp 
//         + " | " + user[userProp] + " <-- " + user[prevUserProp]
//         // + "\n" + jsonPrint(user) 
//       ));

//       let tscParams = {
//         globalTestMode: configuration.globalTestMode,
//         testMode: configuration.testMode,
//         inc: false,
//         twitterEvents: configEvents
//       };

//       if (userProp === "statusId"){

//         let status = deepcopy(user.status);  // avoid circular references

//         user.statusId = user.statusId.toString();
//         tscParams.tweetStatus = {};
//         tscParams.tweetStatus = status;
//         tscParams.tweetStatus.user = {};
//         tscParams.tweetStatus.user = user;
//         tscParams.tweetStatus.user.isNotRaw = true;
//       }

//       if (userProp === "quotedStatusId"){

//         let quotedStatus = deepcopy(user.quotedStatus);  // avoid circular references

//         user.quotedStatusId = user.quotedStatusId.toString();
//         tscParams.tweetStatus = {};
//         tscParams.tweetStatus = quotedStatus;
//         tscParams.tweetStatus.user = {};
//         tscParams.tweetStatus.user = user;
//         tscParams.tweetStatus.user.isNotRaw = true;
//       }

//       // console.log(chalkAlert("TFE | tscParams\n", jsonPrint(tscParams)));

//       tweetServerController.createStreamTweet(tscParams)
//       .then(function(tweetObj){

//         // console.log(chalkLog("TFE | CREATE STREAM TWEET | " + Object.keys(tweetObj)));

//         async.eachSeries(DEFAULT_INPUT_TYPES, function(entityType, cb0){

//           if (!entityType || entityType === undefined) {
//             console.log(chalkAlert("TFE | ??? UNDEFINED TWEET entityType: ", entityType));
//             return cb0();
//           }

//           if (entityType === "user") { return cb0(); }
//           if (!tweetObj[entityType] || tweetObj[entityType] === undefined) { return cb0(); }
//           if (tweetObj[entityType].length === 0) { return cb0(); }

//           async.eachSeries(tweetObj[entityType], function(entityObj, cb1){

//             if (!entityObj) {
//               debug(chalkInfo("TFE | !!! NULL entity? | ENTITY TYPE: " + entityType + " | entityObj: " + entityObj));
//               return cb1();
//             }

//             let entity;

//             switch (entityType) {
//               case "hashtags":
//                 entity = "#" + entityObj.nodeId.toLowerCase();
//               break;
//               case "mentions":
//               case "userMentions":
//                 entity = "@" + entityObj.screenName.toLowerCase();
//               break;
//               case "locations":
//                 entity = entityObj.nodeId;
//               break;
//               case "images":
//               case "media":
//                 entity = entityObj.nodeId;
//               break;
//               case "emoji":
//                 entity = entityObj.nodeId;
//               break;
//               case "urls":
//                 // entity = (entityObj.expandedUrl && entityObj.expandedUrl !== undefined) ? entityObj.expandedUrl.toLowerCase() : entityObj.nodeId;
//                 entity = entityObj.nodeId;
//               break;
//               case "words":
//                 entity = entityObj.nodeId.toLowerCase();
//               break;
//               case "places":
//                 entity = entityObj.nodeId;
//               break;
//             }

//             if (!tweetHistograms[entityType] || (tweetHistograms[entityType] === undefined)){
//               tweetHistograms[entityType] = {};
//               tweetHistograms[entityType][entity] = 1;
//             }

//             if (!tweetHistograms[entityType][entity] || (tweetHistograms[entityType][entity] === undefined)){
//               tweetHistograms[entityType][entity] = 1;
//             }

//             // if (configuration.verbose) {
//               console.log(chalkLog("TFE | +++ USER HIST"
//                 + " | " + entityType.toUpperCase()
//                 + " | " + entity
//                 + " | " + tweetHistograms[entityType][entity]
//               ));
//             // }

//             async.setImmediate(function() { cb1(); });

//           }, function(){

//             async.setImmediate(function() { cb0(); });

//           });
//         }, function(err0){

//           async.setImmediate(function() { cb(); });

//         });

//       })
//       .catch(function(err){
//         return cb(err);
//       });

//     }, function(err){

//       if (err) {
//         console.log(chalkError("TFE | USER STATUS HISTOGRAM ERROR: " + err));
//         return reject(err);
//       }

//       resolve(tweetHistograms);
 
//     });

//   });
// }

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
        console.log(chalkLog("TFE | +++ USER STATUS CHANGE"
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
        tscParams.tweetStatus = {};
        tscParams.tweetStatus = status;
        tscParams.tweetStatus.user = {};
        tscParams.tweetStatus.user = user;
        tscParams.tweetStatus.user.isNotRaw = true;
      }

      if (userProp === "quotedStatusId"){

        let quotedStatus = deepcopy(user.quotedStatus);  // avoid circular references

        user.quotedStatusId = user.quotedStatusId.toString();
        tscParams.tweetStatus = {};
        tscParams.tweetStatus = quotedStatus;
        tscParams.tweetStatus.user = {};
        tscParams.tweetStatus.user = user;
        tscParams.tweetStatus.user.isNotRaw = true;
      }

      // console.log(chalkAlert("TFE | tscParams\n", jsonPrint(tscParams)));

      tweetServerController.createStreamTweet(tscParams)
      .then(function(tweetObj){

        // console.log(chalkLog("TFE | CREATE STREAM TWEET | " + Object.keys(tweetObj)));

        async.eachSeries(DEFAULT_INPUT_TYPES, function(entityType, cb0){

          if (!entityType || entityType === undefined) {
            console.log(chalkAlert("TFE | ??? UNDEFINED TWEET entityType: ", entityType));
            return cb0();
          }

          if (entityType === "user") { return cb0(); }
          if (!tweetObj[entityType] || tweetObj[entityType] === undefined) { return cb0(); }
          if (tweetObj[entityType].length === 0) { return cb0(); }

          async.eachSeries(tweetObj[entityType], function(entityObj, cb1){

            if (!entityObj) {
              debug(chalkInfo("TFE | !!! NULL entity? | ENTITY TYPE: " + entityType + " | entityObj: " + entityObj));
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
                // entity = (entityObj.expandedUrl && entityObj.expandedUrl !== undefined) ? entityObj.expandedUrl.toLowerCase() : entityObj.nodeId;
                entity = entityObj.nodeId;
              break;
              case "words":
                entity = entityObj.nodeId.toLowerCase();
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
              console.log(chalkLog("TFE | +++ USER HIST"
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
        console.log(chalkError("TFE | USER STATUS HISTOGRAM ERROR: " + err));
        return reject(err);
      }

      resolve(tweetHistograms);
 
    });

  });
}

function updateUserHistograms(params) {

  return new Promise(function(resolve, reject){
    
    if ((params.user === undefined) || !params.user) {
      console.log(chalkError("TFE | *** updateUserHistograms USER UNDEFINED"));
      const err = new Error("TFE | *** updateUserHistograms USER UNDEFINED");
      console.error(err);
      return reject(err);
    }

    // let user = params.user;

    params.user.profileHistograms = params.user.profileHistograms || {};
    params.user.tweetHistogramChanges = params.user.tweetHistogramChanges || {};

    userStatusChangeHistogram({user: params.user})

      .then(function(tweetHistogramChanges){

        userProfileChangeHistogram(params)
        .then(function(profileHistogramChanges){

          // console.log(chalkAlert("user.profileHistograms\n" + jsonPrint(user.profileHistograms)));
          // console.log(chalkAlert("profileHistogramChanges\n" + jsonPrint(profileHistogramChanges)));

          async.parallel({

            profileHist: function(cb){

              if (profileHistogramChanges) {

                mergeHistograms.merge({ histogramA: params.user.profileHistograms, histogramB: profileHistogramChanges })
                .then(function(profileHist){
                  cb(null, profileHist);
                })
                .catch(function(err){
                  console.log(chalkError("TFE | *** MERGE HISTOGRAMS ERROR | PROFILE: " + err));
                  return cb(err, null);
                });

              }
              else {
                cb(null, null);
              }

            },

            tweetHist: function(cb){

              if (tweetHistogramChanges) {

                mergeHistograms.merge({ histogramA: params.user.tweetHistograms, histogramB: tweetHistogramChanges })
                .then(function(tweetHist){
                  cb(null, tweetHist);
                })
                .catch(function(err){
                  console.log(chalkError("TFE | *** MERGE HISTOGRAMS ERROR | TWEET: " + err));
                  return cb(err, null);
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

            updateGlobalHistograms(params)
            .then(function(){
              resolve(params.user);
            })
            .catch(function(err){
              console.log(chalkError("TFE | *** UPDATE USER HISTOGRAM ERROR: " + err));
              return reject(err);
            });

          });

        });

      })
      .catch(function(err){
        console.log(chalkError("TFE | *** UPDATE USER HISTOGRAM ERROR: " + err));
        return reject(err);
      });
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

  userCategorizeQueueInterval = setInterval(async function(){

    if (userServerControllerReady && userCategorizeQueueReady && (userCategorizeQueue.length > 0)) {

      userCategorizeQueueReady = false;

      user = userCategorizeQueue.shift();
      user.nodeId = user.userId;

      let updatedUser;
      let networkOutput;

      try {
        updatedUser = await updateUserHistograms({user: user});
        networkOutput = await activateNetwork({user: updatedUser});
      }
      catch (err) {
        console.log(chalkError("TFE | *** UPDATE USER HISTOGRAMS ERROR: " + err));
        console.error(err);
        userCategorizeQueueReady = true;
        return;
      }

      if (updatedUser.categoryAuto !== networkOutput.output) {
        console.log(chalkLog("TFE | >>> NN AUTO CAT CHANGE"
          + " | " + networkObj.networkId
          + " | AUTO: " + updatedUser.categoryAuto + " > " + networkOutput.output
          + " | NODE ID: " + updatedUser.nodeId
          + " | @" + updatedUser.screenName
        ));
      }

      updatedUser.categoryAuto = networkOutput.output;
      updatedUser.nodeId = updatedUser.nodeId;

      printUserObj("TFE | updatedUser", updatedUser, chalkLog);

      userServerController.findOneUser(updatedUser, {noInc: false, fields: fieldsTransmit}, function(err, dbUser){
        if (err) {
          console.log(chalkError("TFC | *** USER FIND ONE ERROR: " + err));
          return;
        }
        printUserObj("TFE | NN: " + networkObj.networkId + " | DB CAT", dbUser, chalkInfo);
        process.send({ op: "USER_CATEGORIZED", user: dbUser });
        userCategorizeQueueReady = true;
      });
      // }
      // catch (err) {
      //   console.log(chalkError("TFE | *** USER CATEGORIZE ERROR: " + err));
      //   console.error(err);
      //   userCategorizeQueueReady = true;
      // }
    }


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

          let user = new global.User(change.fullDocument); 

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

        }
        else {
          console.log(chalkLog("TFE | XX> USER CHANGE | " +  change.operationType));
          resolve();
        }

      });

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


  switch (m.op) {

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.forceImageAnalysis = m.forceImageAnalysis;
      maxInputHashMap = m.maxInputHashMap;
      normalization = m.normalization;

      networkObj = m.networkObj;
      network = neataptic.Network.fromJSON(m.networkObj.network);

      // networksHashMap.set(m.networkObj.networkId, m.networkObj);

      console.log(chalkInfo("TFE | INIT"
        + " | TITLE: " + process.title
        + " | NETWORK: " + networkObj.networkId
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

        console.log(chalkLog("TFE | CURRENT AUTH\n" + jsonPrint(authObj)));

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
        try {
          let user = m.user.toObject();
          userCategorizeQueue.push(user);

          debug(chalkInfo("TFE | USER_CATEGORIZE"
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

  initialize(configuration, async function(err, cnf){

    if (err && (err.status !== 404)) {
      console.error(chalkLog("TFE | *** INIT ERROR \n" + jsonPrint(err)));
      quit();
    }

    configuration = cnf;

    console.log("TFE | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");


    try {
      global.dbConnection = await connectDb();
      dbConnectionReady = true;
    }
    catch(err){
      dbConnectionReady = false;
      console.log(chalkError("TFC | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
      quit("MONGO DB CONNECT ERROR");
    }

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


