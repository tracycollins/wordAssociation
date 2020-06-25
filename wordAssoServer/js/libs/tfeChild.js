// "use strict";

process.title = "wa_node_child_tfe";

const MODULE_NAME = "tfeChild";
const MODULE_ID_PREFIX = "TFC";

const MIN_TWEET_ID = 1000000;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;
const ONE_HOUR = ONE_MINUTE*60;
const ONE_DAY = ONE_HOUR*24;

const twitterDeleteUserErrorCodesArray = [];
twitterDeleteUserErrorCodesArray.push(34);
twitterDeleteUserErrorCodesArray.push(136);
twitterDeleteUserErrorCodesArray.push(401);
twitterDeleteUserErrorCodesArray.push(401);

const DEFAULT_QUOTA_TIMEOUT_DURATION = ONE_HOUR;
const SAVE_FILE_QUEUE_INTERVAL = 5*ONE_SECOND;

const DEFAULT_MAX_USER_TWEETIDS = 100;
const SAVE_CACHE_DEFAULT_TTL = 60;

let currentBestRuntimeNetwork = {};

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
  "ngrams", 
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

let primaryNetworkObj = {};

const USER_PROCESS_QUEUE_MAX_LENGTH = 20;

const USER_CHANGE_CACHE_DEFAULT_TTL = 15;
const USER_CHANGE_CACHE_CHECK_PERIOD = 1;

const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");
const path = require("path");

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

let DROPBOX_ROOT_FOLDER;

if (hostname == "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
}
else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
}

global.wordAssoDb = require("@threeceelabs/mongoose-twitter");

const NeuralNetworkTools = require("@threeceelabs/neural-network-tools");

const pick = require("object.pick");
const defaults = require("object.defaults");
const btoa = require("btoa");
const empty = require("is-empty");
const _ = require("lodash");
const async = require("async");
const moment = require("moment");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const HashMap = require("hashmap").HashMap;
const NodeCache = require("node-cache");
const watch = require("watch");

const debug = require("debug")("tfe");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkBlue = chalk.blue;
const chalkBlueBold = chalk.blue.bold;

const twitterUserHashMap = new HashMap();

const tcuChildName = MODULE_ID_PREFIX + "_TCU";

const userTweetFetchSet = new Set();

const processUserQueue = [];

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

configuration.bestNetworkIdArray = [];
configuration.bestNetworkIdArrayFile = "bestNetworkIdArray.json";

configuration.quotaTimoutDuration = DEFAULT_QUOTA_TIMEOUT_DURATION;
configuration.processUserQueueInterval = 100;

configuration.enableFetchUserFriends = false;
configuration.enableGeoCode = false;
configuration.forceGeoCode = false;

configuration.forceImageAnalysis = false;
configuration.enableImageAnalysis = true;

configuration.enableLanguageAnalysis = true;
configuration.forceLanguageAnalysis = false;

configuration.userProfileOnlyFlag = false
configuration.verbose = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode

configuration.inputTypes = DEFAULT_INPUT_TYPES;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initTwitterUsersTimeout = Number(ONE_MINUTE);

configuration.twitterConfig = {};
configuration.threeceeUser = "altthreecee00";

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

const startTimeMoment = moment();

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

const statsObj = {};

statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.maxHeap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.threeceeUser = {};
statsObj.threeceeUser.endFetch = false;
statsObj.threeceeUser.nextCursor = false;
statsObj.threeceeUser.nextCursorValid = false;
statsObj.threeceeUser.friendsFetched = 0;
statsObj.threeceeUser.twitterRateLimitExceptionFlag = false;

const TWITTER_RATE_LIMIT_RESOURCES = {
  application: ["rate_limit_status"],
  friends: ["ids", "list"],
  statuses: ["user_timeline"],
  users: ["show/:id"]
};

statsObj.threeceeUser.twitterRateLimit = {};
const rateLimitTimeout = {};

Object.keys(TWITTER_RATE_LIMIT_RESOURCES).forEach(function(resource){

  rateLimitTimeout[resource] = {};
  statsObj.threeceeUser.twitterRateLimit[resource] = {};

  TWITTER_RATE_LIMIT_RESOURCES[resource].forEach(function(endPoint){

    rateLimitTimeout[resource][endPoint] = null;

    statsObj.threeceeUser.twitterRateLimit[resource][endPoint] = {};
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].limit = 0;
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].limit = 0;
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].exceptionAt = moment();
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].exceptionFlag = false;
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].remaining = 0;
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].remainingTime = 0;
    statsObj.threeceeUser.twitterRateLimit[resource][endPoint].resetAt = moment();
  });

});

statsObj.threeceeUser.friendsCount = 0;
statsObj.threeceeUser.followersCount = 0;
statsObj.threeceeUser.statusesCount = 0;

statsObj.imageParser = {};
statsObj.imageParser.numberParsed = 0;
statsObj.imageParser.rateLimitFlag = false;

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
statsObj.user.processed = 0;

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

statsObj.currentBestRuntimeNetwork = {};
statsObj.currentBestRuntimeNetwork.networkId = false;
statsObj.currentBestRuntimeNetwork.rank = Infinity;
statsObj.currentBestRuntimeNetwork.successRate = 0;
statsObj.currentBestRuntimeNetwork.matchRate = 0;
statsObj.currentBestRuntimeNetwork.overallMatchRate = 0;
statsObj.currentBestRuntimeNetwork.runtimeMatchRate = 0;
statsObj.currentBestRuntimeNetwork.testCycles = 0;
statsObj.currentBestRuntimeNetwork.total = 0;
statsObj.currentBestRuntimeNetwork.match = 0;
statsObj.currentBestRuntimeNetwork.mismatch = 0;
statsObj.currentBestRuntimeNetwork.left = 0;
statsObj.currentBestRuntimeNetwork.neutral = 0;
statsObj.currentBestRuntimeNetwork.right = 0;
statsObj.currentBestRuntimeNetwork.positive = 0;
statsObj.currentBestRuntimeNetwork.negative = 0;

statsObj.currentBestNetwork = {};
statsObj.currentBestNetwork.networkId = false;
statsObj.currentBestNetwork.rank = Infinity;
statsObj.currentBestNetwork.successRate = 0;
statsObj.currentBestNetwork.matchRate = 0;
statsObj.currentBestNetwork.overallMatchRate = 0;
statsObj.currentBestNetwork.runtimeMatchRate = 0;
statsObj.currentBestNetwork.testCycles = 0;
statsObj.currentBestNetwork.total = 0;
statsObj.currentBestNetwork.match = 0;
statsObj.currentBestNetwork.mismatch = 0;
statsObj.currentBestNetwork.left = 0;
statsObj.currentBestNetwork.neutral = 0;
statsObj.currentBestNetwork.right = 0;
statsObj.currentBestNetwork.positive = 0;
statsObj.currentBestNetwork.negative = 0;

let dbConnectionReady = false;
let dbConnectionReadyInterval;


// ==================================================================
// USER CHANGE CACHE
// ==================================================================
let userChangeCacheTtl = process.env.USER_CHANGE_CACHE_DEFAULT_TTL;
if (userChangeCacheTtl === undefined) { userChangeCacheTtl = USER_CHANGE_CACHE_DEFAULT_TTL; }

console.log(MODULE_ID_PREFIX + " | USER CHANGE CACHE TTL: " + userChangeCacheTtl + " SECONDS");

let userChangeCacheCheckPeriod = process.env.USER_CHANGE_CACHE_CHECK_PERIOD;
if (userChangeCacheCheckPeriod === undefined) { userChangeCacheCheckPeriod = USER_CHANGE_CACHE_CHECK_PERIOD; }

console.log(MODULE_ID_PREFIX + " | userChange CACHE CHECK PERIOD: " + userChangeCacheCheckPeriod + " SECONDS");

const userChangeCache = new NodeCache({
  stdTTL: userChangeCacheTtl,
  checkperiod: userChangeCacheCheckPeriod
});

// ==================================================================
// MONGO DB
// ==================================================================

let tcUtils;
let formatCategory;

let nnTools;
let tweetServerController;
let userServerController;

async function connectDb(){

  try {

    statsObj.status = "CONNECTING MONGO DB";

    console.log(chalkBlueBold(MODULE_ID_PREFIX + " | CONNECT MONGO DB ..."));

    const db = await global.wordAssoDb.connect(MODULE_ID_PREFIX + "_" + process.pid);

    db.on("error", async function(err){
      statsObj.status = "MONGO ERROR";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION ERROR"));
    });

    db.on("close", async function(err){
      statsObj.status = "MONGO CLOSED";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION CLOSED"));
    });

    db.on("disconnected", async function(){
      statsObj.status = "MONGO DISCONNECTED";
      statsObj.dbConnectionReady = false;
      console.log(chalkAlert(MODULE_ID_PREFIX + " | *** MONGO DB DISCONNECTED"));
    });

    console.log(chalk.green(MODULE_ID_PREFIX + " | MONGOOSE DEFAULT CONNECTION OPEN"));

    const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
    
    tcUtils = new ThreeceeUtilities(tcuChildName);
    formatCategory = tcUtils.formatCategory;

    nnTools = new NeuralNetworkTools("WA_TFE_NNT");

    const UserServerController = require("@threeceelabs/user-server-controller");
    
    userServerController = new UserServerController(MODULE_ID_PREFIX + "_USC");

    userServerController.on("error", function(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** USC ERROR | " + err));
    });

    userServerController.on("ready", function(appname){
      console.log(chalk.green(MODULE_ID_PREFIX + " | USC READY | " + appname));
    });

    const TweetServerController = require("@threeceelabs/tweet-server-controller");
    tweetServerController = new TweetServerController(MODULE_ID_PREFIX + "_TSC");

    tweetServerController.on("error", function(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** TSC ERROR | " + err));
    });

    tweetServerController.on("ready", function(appname){
      console.log(chalk.green(MODULE_ID_PREFIX + " | TSC READY | " + appname));
    });

    statsObj.dbConnectionReady = true;

    return db;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECT ERROR: " + err));
    throw err;
  }
}

configuration.configDefaultFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility/default");
configuration.configDefaultFile = "default_" + MODULE_NAME + "Config.json";

configuration.statsFolder = path.join(DROPBOX_ROOT_FOLDER, "stats", hostname);
configuration.statsFile = MODULE_NAME + "Stats.json";

configuration.twitterConfigFolder = path.join(DROPBOX_ROOT_FOLDER, "config/twitter");
configuration.twitterConfigFile = "altthreecee00.json";

function showStats(options){

  statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
  statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options) {
    console.log(MODULE_ID_PREFIX + " | STATS\n" + tcUtils.jsonPrint(statsObj));
  }
  else {
    console.log(chalkLog(MODULE_ID_PREFIX + " | S"
      + " | ELPSD " + tcUtils.msToTime(statsObj.elapsed)
      + " | START " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
      + " | UC$: " + userChangeCache.getStats().keys
      + " | UCATQ: " + processUserQueue.length
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

  console.error(MODULE_ID_PREFIX + " | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
  );

  process.exit(exitCode);
}

//=========================================================================
// FILE SAVE
//=========================================================================

let saveFileQueueInterval;
const saveFileQueue = [];
let statsUpdateInterval;

configuration.saveFileQueueInterval = SAVE_FILE_QUEUE_INTERVAL;

statsObj.queues.saveFileQueue = {};
statsObj.queues.saveFileQueue.busy = false;
statsObj.queues.saveFileQueue.size = 0;


let saveCacheTtl = process.env.SAVE_CACHE_DEFAULT_TTL;

if(empty(saveCacheTtl)) { saveCacheTtl = SAVE_CACHE_DEFAULT_TTL; }

console.log(MODULE_ID_PREFIX + " | SAVE CACHE TTL: " + saveCacheTtl + " SECONDS");

let saveCacheCheckPeriod = process.env.SAVE_CACHE_CHECK_PERIOD;

if(empty(saveCacheCheckPeriod)) { saveCacheCheckPeriod = 10; }

console.log(MODULE_ID_PREFIX + " | SAVE CACHE CHECK PERIOD: " + saveCacheCheckPeriod + " SECONDS");

const saveCache = new NodeCache({
  stdTTL: saveCacheTtl,
  checkperiod: saveCacheCheckPeriod
});

function saveCacheExpired(file, fileObj) {
  debug(chalkLog("XXX $ SAVE"
    + " [" + saveCache.getStats().keys + "]"
    + " | " + file
  ));
  saveFileQueue.push(fileObj);
  statsObj.queues.saveFileQueue.size = saveFileQueue.length;
}

saveCache.on("expired", saveCacheExpired);

saveCache.on("set", function(file, fileObj) {
  debug(chalkLog(MODULE_ID_PREFIX + " | $$$ SAVE CACHE"
    + " [" + saveCache.getStats().keys + "]"
    + " | " + fileObj.folder + "/" + file
  ));
});

function initSaveFileQueue(cnf) {

  console.log(chalkLog(MODULE_ID_PREFIX + " | INIT DROPBOX SAVE FILE INTERVAL | " + tcUtils.msToTime(cnf.saveFileQueueInterval)));

  clearInterval(saveFileQueueInterval);

  let saveFileObj;

  saveFileQueueInterval = setInterval(async function () {

    if (!statsObj.queues.saveFileQueue.busy && saveFileQueue.length > 0) {

      statsObj.queues.saveFileQueue.busy = true;

      saveFileObj = saveFileQueue.shift();
      saveFileObj.verbose = true;

      statsObj.queues.saveFileQueue.size = saveFileQueue.length;

      try{
        await tcUtils.saveFile(saveFileObj);
        console.log(chalkLog(
          MODULE_ID_PREFIX 
          + " | SAVED FILE"
          + " [Q: " + saveFileQueue.length + "] " 
          + " [$: " + saveCache.getStats().keys + "] " 
          + saveFileObj.folder + "/" + saveFileObj.file
        ));
        statsObj.queues.saveFileQueue.busy = false;
      }
      catch(err){
        console.log(chalkError(MODULE_ID_PREFIX 
          + " | *** SAVE FILE ERROR ... RETRY"
          + " | ERROR: " + err
          + " | " + saveFileObj.folder + "/" + saveFileObj.file
        ));
        saveFileQueue.push(saveFileObj);
        statsObj.queues.saveFileQueue.size = saveFileQueue.length;
        statsObj.queues.saveFileQueue.busy = false;
      }

    }
  }, cnf.saveFileQueueInterval);
}

function getElapsedTimeStamp(){
  statsObj.elapsedMS = moment().valueOf() - startTimeMoment.valueOf();
  return tcUtils.msToTime(statsObj.elapsedMS);
}

function initStatsUpdate() {

  return new Promise(function(resolve, reject){

    try {

      console.log(chalkLog(MODULE_ID_PREFIX + " | INIT STATS UPDATE INTERVAL | " + tcUtils.msToTime(configuration.statsUpdateIntervalTime)));

      statsObj.elapsed = getElapsedTimeStamp();
      statsObj.timeStamp = tcUtils.getTimeStamp();

      saveFileQueue.push({folder: configuration.statsFolder, file: configuration.statsFile, obj: statsObj});

      clearInterval(statsUpdateInterval);

      statsUpdateInterval = setInterval(async function () {

        statsObj.elapsed = getElapsedTimeStamp();
        statsObj.timeStamp = tcUtils.getTimeStamp();

        saveFileQueue.push({folder: configuration.statsFolder, file: configuration.statsFile, obj: statsObj});
        statsObj.queues.saveFileQueue.size = saveFileQueue.length;

        try{
          await showStats();
        }
        catch(err){
          console.log(chalkError(MODULE_ID_PREFIX + " | *** SHOW STATS ERROR: " + err));
        }
        
      }, configuration.statsUpdateIntervalTime);

      resolve();

    }
    catch(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** initStatsUpdate ERROR:", err));
      reject(err);
    }
  });
}

function printUser(params) {
  let text;
  const user = params.user;

  if (params.verbose) {
    return tcUtils.jsonPrint(params.user);
  } 
  else {
    text = user.nodeId
    + " | @" + user.screenName
    + " | " + user.name 
    + " | LG " + user.lang
    + " | FW " + user.followersCount
    + " | FD " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + tcUtils.getTimeStamp(user.lastSeen)
    + " | FWG " + user.following 
    + " | LC " + user.location
    + " | CN " + user.categorizeNetwork
    + " | C M " + formatCategory(user.category) 
    + " A " + formatCategory(user.categoryAuto);

    return text;
  }
}

function printNetworkObj(title, nn, format) {

  const chalkFormat = (format !== undefined) ? format : chalk.blue;
  const rank = (nn.rank !== undefined) ? nn.rank : Infinity;
  const previousRank = (nn.previousRank !== undefined) ? nn.previousRank : Infinity;
  const overallMatchRate = nn.overallMatchRate || 0;
  const runtimeMatchRate = nn.runtimeMatchRate || 0;
  const matchRate = nn.matchRate || 0;
  const successRate = nn.successRate || 0;
  const testCycleHistory = nn.testCycleHistory || [];

  console.log(chalkFormat(title
    + " | RK: " + rank
    + " | PRK: " + previousRank
    + " | SR: " + successRate.toFixed(2) + "%"
    + " | MR: " + matchRate.toFixed(2) + "%"
    + " | OAMR: " + overallMatchRate.toFixed(2) + "%"
    + " | RMR: " + runtimeMatchRate.toFixed(2) + "%"
    // + " | CR: " + tcUtils.getTimeStamp(nn.createdAt)
    + " | TC:  " + nn.testCycles
    + " | TH: " + testCycleHistory.length
    + " |  " + nn.inputsId
    + " | " + nn.networkId
  ));

  return;
}

const networkOutput = {};
networkOutput.output = [];
networkOutput.left = 0;
networkOutput.neutral = 0;
networkOutput.right = 0;
networkOutput.none = 0;
networkOutput.positive = 0;
networkOutput.negative = 0;

async function processTweetObj(params){

  const tweetObj = params.tweetObj;
  const histograms = params.histograms;

  for(const entityType of DEFAULT_INPUT_TYPES){

    if (!entityType || entityType === undefined) {
      console.log(chalkAlert(MODULE_ID_PREFIX + " | ??? UNDEFINED TWEET entityType: ", entityType));
      continue;
    }

    if (entityType == "user") { continue; }
    if (empty(tweetObj[entityType])) { continue; }
    if (tweetObj[entityType].length == 0) { continue; }

    for(const entityObj of tweetObj[entityType]){

      if (empty(entityObj)) {
        debug(chalkAlert(MODULE_ID_PREFIX 
          + " | *** processTweetObj EMPTY ENTITY | ENTITY TYPE: " + entityType 
          + " | entityObj: " + tcUtils.jsonPrint(entityObj)
        ));
        continue;
      }

      if (empty(entityObj.nodeId)) {
        debug(chalkAlert(MODULE_ID_PREFIX 
          + " | *** processTweetObj UNDEFINED NODE ID | ENTITY TYPE: " + entityType 
          + " | entityObj: " + tcUtils.jsonPrint(entityObj)
        ));
        continue;
      }

      let entity;

      switch (entityType) {

        case "hashtags":
          entity = "#" + entityObj.nodeId.toLowerCase();
        break;

        case "mentions":
        case "userMentions":
          if (empty(entityObj.screenName)) {
            console.log(chalkAlert(MODULE_ID_PREFIX 
              + " | *** processTweetObj UNDEFINED SCREEN NAME | ENTITY TYPE: " + entityType 
              + " | entityObj: " + tcUtils.jsonPrint(entityObj)
            ));
            continue;
          }
          entity = "@" + entityObj.screenName.toLowerCase();
        break;

        case "locations":
        case "images":
        case "media":
        case "ngrams":
        case "places":
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
        
        default:
          console.log(chalkError(MODULE_ID_PREFIX + " | *** processTweetObj UNKNOWN ENTITY TYPE: " + entityType));
          continue;
      }

      if (empty(histograms[entityType])){
        histograms[entityType] = {};
        histograms[entityType][entity] = 1;
      }
      else if (empty(histograms[entityType][entity])){
        histograms[entityType][entity] = 1;
      }
      else {
        histograms[entityType][entity] += 1;
      }
    }
  }

  return histograms;
}

function histogramIncomplete(histogram){

  return new Promise(function(resolve){

    if (!histogram) { return resolve(true); }
    if (histogram === undefined) { return resolve(true); }
    if (histogram == {}) { return resolve(true); }

    async.each(Object.values(histogram), function(value, cb){

      if (value == {}) { return cb(); }
      if ((value !== undefined) && (Object.keys(value).length > 0)) { return cb("valid"); }

      cb();

    }, function(valid){
      if (valid) { return resolve(false); }
      return resolve(true);
    });

  });
}

async function processUserTweetArray(params){

  const tscParams = params.tscParams;
  const user = params.user;
  const tweets = params.tweets;
  const forceFetch = params.forceFetch;

  for (const tweet of tweets) {

    tscParams.tweetStatus = tweet;
    tscParams.tweetStatus.user = {};
    tscParams.tweetStatus.user = user;
    tscParams.tweetStatus.user.isNotRaw = true;

    if (tweet.id_str.toString() > user.tweets.maxId.toString()) {
      user.tweets.maxId = tweet.id_str.toString();
    }

    if (tweet.id_str.toString() > user.tweets.sinceId.toString()) {
      user.tweets.sinceId = tweet.id_str.toString();
    }

    if (forceFetch || !user.tweets.tweetIds.includes(tweet.id_str.toString())) { 

      try {

        if (!user.tweets.tweetIds.includes(tweet.id_str.toString())) {
          statsObj.twitter.tweetsHits += 1;
        }

        const tweetObj = await tweetServerController.createStreamTweetAsync(tscParams);

        if (!user.tweetHistograms || (user.tweetHistograms === undefined)) { user.tweetHistograms = {}; }

        user.tweetHistograms = await processTweetObj({tweetObj: tweetObj, histograms: user.tweetHistograms});
        user.tweets.tweetIds = _.union(user.tweets.tweetIds, [tweet.id_str]); 

        statsObj.twitter.tweetsProcessed += 1;
        statsObj.twitter.tweetsTotal += 1;

        if (configuration.testMode || configuration.verbose) {
          console.log(chalkTwitter(MODULE_ID_PREFIX + " | +++ PROCESSED TWEET"
            + " | FORCE: " + forceFetch
            + " [ P/H/T " + statsObj.twitter.tweetsProcessed + "/" + statsObj.twitter.tweetsHits + "/" + statsObj.twitter.tweetsTotal + "]"
            + " | TW: " + tweet.id_str
            + " | SINCE: " + user.tweets.sinceId
            + " | TWs: " + user.tweets.tweetIds.length
            + " | @" + user.screenName
          ));
        }

      }
      catch(err){
        console.log(chalkError(MODULE_ID_PREFIX + " | updateUserTweets ERROR: " + err));
        throw err;
      }
    }
    else {

      statsObj.twitter.tweetsHits += 1;
      statsObj.twitter.tweetsTotal += 1;

      if (configuration.testMode || configuration.verbose) {
        console.log(chalkInfo(MODULE_ID_PREFIX + " | ... TWEET ALREADY PROCESSED"
          + " [ P/H/T " + statsObj.twitter.tweetsProcessed + "/" + statsObj.twitter.tweetsHits + "/" + statsObj.twitter.tweetsTotal + "]"
          + " | TW: " + tweet.id_str
          + " | TWs: " + user.tweets.tweetIds.length
          + " | @" + user.screenName
        ));
      }

    }
  }

  if (forceFetch || configuration.testMode || configuration.verbose) {
    console.log(chalkLog(MODULE_ID_PREFIX + " | +++ Ts"
      + " | FORCE: " + forceFetch
      + " [ P/H/T " + statsObj.twitter.tweetsProcessed + "/" + statsObj.twitter.tweetsHits + "/" + statsObj.twitter.tweetsTotal + "]"
      + " | Ts: " + user.tweets.tweetIds.length
      + " | @" + user.screenName
    ));
  }

  return user;
}

async function processUserTweets(params){

  let user = {};
  user = params.user;

  const tweets = params.tweets;

  const tscParams = {};

  tscParams.globalTestMode = configuration.globalTestMode;
  tscParams.testMode = configuration.testMode;
  tscParams.inc = false;
  tscParams.twitterEvents = configEvents;
  tscParams.tweetStatus = {};

  let tweetHistogramsEmpty = false;

  try{
    tweetHistogramsEmpty = await tcUtils.emptyHistogram(user.tweetHistograms);

    const processedUser = await processUserTweetArray({
      user: user, 
      forceFetch: tweetHistogramsEmpty, 
      tweets: tweets, 
      tscParams: tscParams
    });

    if (tweetHistogramsEmpty) {
      console.log(chalkLog(MODULE_ID_PREFIX + " | USER Ts"
        + " | " + printUser({user: processedUser})
      ));
      debug(chalkLog(MODULE_ID_PREFIX + " | USER Ts"
        + " | SINCE: " + processedUser.tweets.sinceId
        + " | TWEETS: " + processedUser.tweets.tweetIds.length
      ));
      debug(chalkLog(MODULE_ID_PREFIX + " | >>> processUserTweetArray USER TWEET HISTOGRAMS"
        + "\n" + tcUtils.jsonPrint(processedUser.tweetHistograms)
      ));
      debug(chalkLog(MODULE_ID_PREFIX + " | >>> processUserTweetArray USER PROFILE HISTOGRAMS"
        + "\n" + tcUtils.jsonPrint(processedUser.profileHistograms)
      ));
    }

    return processedUser;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** processUserTweetArray ERROR: " + err));
    throw err;
  }
}

async function updateUserTweets(params){

  try{
    const user = params.user;

    const histogramIncompleteFlag = await histogramIncomplete(user.tweetHistograms);

    if (configuration.testFetchTweetsMode 
      || (!userTweetFetchSet.has(user.nodeId) && (histogramIncompleteFlag || user.priorityFlag))) { 

      userTweetFetchSet.add(user.nodeId);

      if (configuration.testFetchTweetsMode) {
        console.log(chalkAlert(MODULE_ID_PREFIX + " | updateUserTweets | !!! TEST MODE FETCH TWEETS"
          + " | @" + user.screenName
        ));
      }
      else{
        debug(chalkInfo(MODULE_ID_PREFIX + " | PRI FETCH TWEETS"
          + " | @" + user.screenName
        ));
      }

      if (histogramIncompleteFlag) { user.tweetHistograms = {}; }

      const latestTweets = await tcUtils.fetchUserTweets({user: user, force: true});
      if (latestTweets) { user.latestTweets = latestTweets; }
    }

    if (user.latestTweets.length == 0) { 
      delete user.latestTweets;
      return user;
    }

    const latestTweets = user.latestTweets;
    
    delete user.latestTweets;

    defaults(user.tweets, userTweetsDefault);

    if (user.tweets.tweetIds.length > DEFAULT_MAX_USER_TWEETIDS) {

      const length = user.tweets.tweetIds.length;
      const removeNumber = length - DEFAULT_MAX_USER_TWEETIDS;

      debug(chalkLog(MODULE_ID_PREFIX + " | ---  TWEETS > MAX TWEETIDS"
        + " | " + user.nodeId
        + " | @" + user.screenName
        + " | " + length + " TWEETS"
        + " | REMOVE: " + removeNumber
      ));

      user.tweets.tweetIds.splice(0,removeNumber);
    }

    const processedUser = await processUserTweets({tweets: latestTweets, user: user});

    return processedUser;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** updateUserTweets ERROR: " + err));
    console.log(chalkError(MODULE_ID_PREFIX + " | *** updateUserTweets ERROR CODE: " + err.code));
    console.log(chalkError(MODULE_ID_PREFIX + " | *** updateUserTweets ERROR STATUS CODE: " + err.statusCode));

    if (twitterDeleteUserErrorCodesArray.includes(err.code)){
      console.log(chalkError(MODULE_ID_PREFIX + " | XXX DELETE USER"
        + " | ERROR STATUS CODE: " + err.statusCode
        + " | NID: " + params.user.nodeId
        + " | @" + params.user.screenName
      ));
      await global.wordAssoDb.User.deleteOne({nodeId: params.user.nodeId});
    }
    throw err;
  }
}

async function updateUserFriends(params){

  const user = params.user;

  try{
    const friendsIdsObj = await tcUtils.fetchUserFriends({user: user});
    user.friends = _.union(user.friends, friendsIdsObj.ids);
    return user;
  }
  catch(err){
    return user;
  }
}

const userTweetsDefault = {
  maxId: MIN_TWEET_ID,
  sinceId: MIN_TWEET_ID,
  tweetIds: []
}

let processUserQueueBusy = false;
let processUserQueueInterval;

function initProcessUserQueueInterval(interval) {

  return new Promise(function(resolve){

    console.log(chalkBlue(MODULE_ID_PREFIX + " | INIT PROCESS USER QUEUE INTERVAL | " + interval + " MS"));

    let userDoc;
    let queueObj;
    let user;
    let processedUser;

    clearInterval(processUserQueueInterval);

    processUserQueueBusy = false;

    processUserQueueInterval = setInterval(async function () {

      if (!processUserQueueBusy && processUserQueue.length > 0) {

        processUserQueueBusy = true;

        queueObj = processUserQueue.shift();
        
        try {

          userDoc = await global.wordAssoDb.User.findOne({nodeId: queueObj.user.nodeId});

          if (!userDoc) {
            processUserQueueBusy = false;
          }
          else {

            user = await tcUtils.encodeHistogramUrls({user: userDoc});

            user.priorityFlag = queueObj.priorityFlag;

            user.ageDays = (moment().diff(user.createdAt))/ONE_DAY;
            user.tweetsPerDay = user.statusesCount/user.ageDays;

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

            defaults(user.tweets, userTweetsDefault);

            if (!user.latestTweets || (user.latestTweets === undefined)) { user.latestTweets = []; }

            user.latestTweets = _.union(userDoc.latestTweets, user.latestTweets);

            processedUser = await processUser({user: user});

            statsObj.user.processed += 1;

            if (queueObj.priorityFlag) {
              console.log(chalkInfo(MODULE_ID_PREFIX + " | PRI PRCSSD"
                + " [ PRCSSD: " + statsObj.user.processed + " / PUQ: " + processUserQueue.length + "]"
                + " | PRI: " + queueObj.priorityFlag
                + " | NID: " + processedUser.nodeId
                + " | @" + processedUser.screenName
                + " | N: " + processedUser.name
                + " | CN: " + processedUser.categorizeNetwork
                + " | CV: " + processedUser.categoryVerified
                + " | CM: " + formatCategory(processedUser.category)
                + " A: " + formatCategory(processedUser.categoryAuto)
              ));
            }

            process.send({ 
              op: "USER_CATEGORIZED", 
              priorityFlag: queueObj.priorityFlag, 
              searchMode: queueObj.searchMode, 
              user: processedUser, 
              stats: statsObj.user 
            });

            processUserQueueBusy = false;
          }
        }
        catch(err){
          if (err.code) { 
            await tcUtils.handleTwitterError({err: err, user: queueObj.user});
            process.send({ 
              op: "USER_CATEGORIZED_ERROR", 
              priorityFlag: queueObj.priorityFlag, 
              searchMode: queueObj.searchMode, 
              user: queueObj.user, 
              stats: statsObj.user 
            });
          }
          else {
            console.log(chalkError("*** ERROR initProcessUserQueueInterval"
              + " | NID: " + queueObj.user.nodeId
              + " | @" + queueObj.user.screenName
              + " | " + err
            ));
          }
          processUserQueueBusy = false;
        }

      }
    }, interval);

    resolve();
  });
}

const watchOptions = {
  ignoreDotFiles: true,
  ignoreUnreadableDir: true,
  ignoreNotPermitted: true,
}

async function initWatchConfig(){

  statsObj.status = "INIT WATCH CONFIG";

  console.log(chalkLog(MODULE_ID_PREFIX + " | ... INIT WATCH"));

  const loadConfig = async function(f){

    try{

      debug(chalkInfo(MODULE_ID_PREFIX + " | +++ FILE CREATED or CHANGED | " + tcUtils.getTimeStamp() + " | " + f));

      if (f.endsWith(configuration.bestNetworkIdArrayFile)){
        console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ FILE CREATED or CHANGED | " + tcUtils.getTimeStamp() + " | " + f));
        await nnTools.deleteAllNetworks();
        await loadNetworks();
        statsObj.autoChangeTotal = 0;
        statsObj.autoChangeMatchRate = 0;
        statsObj.autoChangeMatch = 0;
        statsObj.autoChangeMismatch = 0;
      }

    }
    catch(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** LOAD ALL CONFIGS ON CREATE ERROR: " + err));
    }
  }

  watch.createMonitor(configuration.configDefaultFolder, watchOptions, function (monitor) {

    monitor.on("created", loadConfig);

    monitor.on("changed", loadConfig);

  });

  return;
}

async function initialize(cnf){

  console.log(chalkLog(MODULE_ID_PREFIX + " | INITIALIZE"));

  if (debug.enabled || debugCache.enabled || debugQ.enabled){
    console.log("\nWAS | TFC | %%%%%%%%%%%%%%\nWAS | TFC | DEBUG ENABLED \nWAS | TFC | %%%%%%%%%%%%%%\n");
  }

  cnf.processName = process.env.TFE_PROCESS_NAME || "wa_node_tfe";

  cnf.verbose = process.env.TFE_VERBOSE_MODE || false;
  cnf.globalTestMode = process.env.TFE_GLOBAL_TEST_MODE || false;
  cnf.testMode = process.env.TFE_TEST_MODE || false;
  cnf.quitOnError = process.env.TFE_QUIT_ON_ERROR || false;

  cnf.statsUpdateIntervalTime = process.env.TFE_STATS_UPDATE_INTERVAL || 60000;

  try{

    const loadedConfigObj = await tcUtils.loadFileRetry({
      folder: configuration.configDefaultFolder, 
      file: configuration.configDefaultFile
    }); 

    console.log(MODULE_ID_PREFIX 
      + " | " + configuration.configDefaultFolder + "/" + configuration.configDefaultFile 
      + "\n" + tcUtils.jsonPrint(loadedConfigObj)
    );

    if (loadedConfigObj.TFE_VERBOSE_MODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TFE_VERBOSE_MODE: " + loadedConfigObj.TFE_VERBOSE_MODE);
      cnf.verbose = loadedConfigObj.TFE_VERBOSE_MODE;
    }

    if (loadedConfigObj.TFE_GLOBAL_TEST_MODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TFE_GLOBAL_TEST_MODE: " + loadedConfigObj.TFE_GLOBAL_TEST_MODE);
      cnf.globalTestMode = loadedConfigObj.TFE_GLOBAL_TEST_MODE;
    }

    if (loadedConfigObj.TFE_TEST_MODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TFE_TEST_MODE: " + loadedConfigObj.TFE_TEST_MODE);
      cnf.testMode = loadedConfigObj.TFE_TEST_MODE;
    }

    if (loadedConfigObj.TFE_ENABLE_FETCH_USER_FRIENDS !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TFE_ENABLE_FETCH_USER_FRIENDS: " + loadedConfigObj.TFE_ENABLE_FETCH_USER_FRIENDS);
      cnf.enableFetchUserFriends = loadedConfigObj.TFE_ENABLE_FETCH_USER_FRIENDS;
    }

    if (loadedConfigObj.TFE_ENABLE_GEOCODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TFE_ENABLE_GEOCODE: " + loadedConfigObj.TFE_ENABLE_GEOCODE);
      cnf.enableGeoCode = loadedConfigObj.TFE_ENABLE_GEOCODE;
    }

    if (loadedConfigObj.TFE_STATS_UPDATE_INTERVAL !== undefined) {
      console.log(MODULE_ID_PREFIX + " | LOADED TFE_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TFE_STATS_UPDATE_INTERVAL);
      cnf.statsUpdateIntervalTime = loadedConfigObj.TFE_STATS_UPDATE_INTERVAL;
    }

    // OVERIDE CONFIG WITH COMMAND LINE ARGS

    const configArgs = Object.keys(cnf);

    configArgs.forEach(function(arg){
      console.log(MODULE_ID_PREFIX + " | FINAL CONFIG | " + arg + ": " + cnf[arg]);
    });

    await initStatsUpdate();

    const twitterConfig = await tcUtils.loadFileRetry({folder: configuration.twitterConfigFolder, file: configuration.twitterConfigFile});

    cnf.twitterConfig = {};
    cnf.twitterConfig = twitterConfig;

    console.log(MODULE_ID_PREFIX + " | " + chalkInfo(tcUtils.getTimeStamp() + " | TWITTER CONFIG FILE " 
      + configuration.twitterConfigFolder
      + configuration.twitterConfigFile
      + "\n" + tcUtils.jsonPrint(cnf.twitterConfig )
    ));

    return cnf;

  }
  catch(err){
    console.error(MODULE_ID_PREFIX 
      + " | *** ERROR LOAD DROPBOX CONFIG: " + configuration.configDefaultFolder + "/" + configuration.configDefaultFile 
      + "\n" + tcUtils.jsonPrint(err)
    );
    throw err;
  }
}

const defaultUpdateOptions = {
  new: true,
  setDefaultsOnInsert: true,
  upsert: true
};

async function updateNetworkRuntimeStats() {
  
  await nnTools.updateNetworkRank();
  const networkStatsObj = await nnTools.getNetworkStats();

  for(const nnId of Object.keys(networkStatsObj.networks)){

    const networkObj = networkStatsObj.networks[nnId];

    const networkDoc = await global.wordAssoDb.NeuralNetwork.findOneAndUpdate(
      {"networkId": nnId}, 
      {
        "runtimeMatchRate": networkObj.matchRate,
        "rank": networkObj.rank, 
        "previousRank": networkObj.previousRank
      }, 
      defaultUpdateOptions
    );

    printNetworkObj(
      MODULE_ID_PREFIX + " | +++ UPDATE NN RT",
      networkDoc.toObject(), 
      chalk.black
    );

  }
  return;
}

async function generateAutoCategory(p) {

  try{

    const params = p || {};

    const userProfileOnlyFlag = (params.userProfileOnlyFlag !== undefined) ? params.userProfileOnlyFlag : configuration.userProfileOnlyFlag;

    const user = await tcUtils.updateUserHistograms({user: params.user});

    const activateNetworkResults = await nnTools.activate({
      user: user,
      userProfileOnlyFlag: userProfileOnlyFlag,
      convertDatumFlag: true, 
      verbose: configuration.verbose
    });

    currentBestRuntimeNetwork = await nnTools.updateNetworkStats({
      sortBy: "matchRate",
      user: user,
      networkOutput: activateNetworkResults.networkOutput, 
      expectedCategory: user.category,
      updateRuntimeMatchRate: true
    });

    if (statsObj.currentBestRuntimeNetwork.rank < currentBestRuntimeNetwork.rank){
      printNetworkObj("RNT | +++ UPDATE BEST NN"
        + " | @" + user.screenName 
        + " | CM: " + formatCategory(user.category), currentBestRuntimeNetwork, chalk.black
      );
      await nnTools.printNetworkResults();
      await updateNetworkRuntimeStats();
    }
    else if (configuration.testMode 
      || (currentBestRuntimeNetwork.meta.total > 0 && currentBestRuntimeNetwork.meta.total % 1000 === 0)
    ) {
      printNetworkObj(MODULE_ID_PREFIX + " | NN"
        + " | @" + user.screenName 
        + " | CM: " + formatCategory(user.category), currentBestRuntimeNetwork, chalk.black
      );
      await nnTools.printNetworkResults();
      await updateNetworkRuntimeStats();
    }

    if (configuration.verbose
      || (statsObj.currentBestRuntimeNetwork.rank < currentBestRuntimeNetwork.rank)
    ) {
      console.log(MODULE_ID_PREFIX + " | BEST RUNTIME NN"
        + " | RANK: " + currentBestRuntimeNetwork.rank
        + " | MR: " + currentBestRuntimeNetwork.matchRate.toFixed(2) + "%"
        + " | " + currentBestRuntimeNetwork.meta.match + "/" + currentBestRuntimeNetwork.meta.total
        + " | MATCH: " + currentBestRuntimeNetwork.meta.matchFlag
        + " | " + currentBestRuntimeNetwork.networkId
        + " | IN: " + currentBestRuntimeNetwork.inputsId
        + " | OUT: " + currentBestRuntimeNetwork.meta.output
      );
    }

    statsObj.currentBestRuntimeNetwork = currentBestRuntimeNetwork;

    let text = MODULE_ID_PREFIX + " | ->- CAT AUTO SET     ";

    if (user.category && user.category !== "none" && (currentBestRuntimeNetwork.meta.categoryAuto == user.category)) {
      statsObj.autoChangeTotal += 1;
      statsObj.autoChangeMatch += 1;
      statsObj.autoChangeMatchRate = 100*(statsObj.autoChangeMatch/statsObj.autoChangeTotal);
      text = MODULE_ID_PREFIX + " | +++ CAT AUTO MATCH   ";
    }
    else if (user.category && user.category !== "none" ) {
      statsObj.autoChangeTotal += 1;
      statsObj.autoChangeMismatch += 1;
      statsObj.autoChangeMatchRate = 100*(statsObj.autoChangeMatch/statsObj.autoChangeTotal);
      text = MODULE_ID_PREFIX + " | -X- CAT AUTO MISMATCH";
    }

    if (configuration.verbose || (user.categoryAuto != currentBestRuntimeNetwork.meta.categoryAuto)) {
      console.log(chalkLog(text
        + " | " + currentBestRuntimeNetwork.networkId
        + " | AUTO CHG M/MM/TOT: " + statsObj.autoChangeMatch + "/" + statsObj.autoChangeMismatch + "/" + statsObj.autoChangeTotal
        + " | " + statsObj.autoChangeMatchRate.toFixed(2) + "%"
        + " | V: " + user.categoryVerified
        + " | M: " + formatCategory(user.category)
        + " | A: " + formatCategory(user.categoryAuto) + " --> " + formatCategory(currentBestRuntimeNetwork.meta.categoryAuto)
        + " | @" + user.screenName
      ));
    }

    user.categoryAuto = currentBestRuntimeNetwork.meta.categoryAuto;
    user.categorizeNetwork = currentBestRuntimeNetwork.networkId;
    user.ageDays = (moment().diff(user.createdAt))/ONE_DAY;
    user.tweetsPerDay = user.statusesCount/user.ageDays;
    return user;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** generateAutoCategory ERROR: " + err));
    throw err;
  }
}

async function updatePreviousUserProps(params){

  try{

    if (!params.user) {
      throw new Error("user UNDEFINED");
    }

    const user = params.user;

    let prevUserProp;

    for(const userProp of USER_PROFILE_PROPERTY_ARRAY){

      prevUserProp = "previous" + _.upperFirst(userProp);

      if (user[userProp] && (user[userProp] !== undefined) && (user[prevUserProp] != user[userProp])) {
        user[prevUserProp] = user[userProp];
      }
    }

    if (user.statusId && (user.statusId !== undefined) && (user.previousStatusId != user.statusId)) {
      user.previousStatusId = user.statusId;
    }

    if (user.quotedStatusId && (user.quotedStatusId !== undefined) && (user.previousQuotedStatusId != user.quotedStatusId)) {
      user.previousQuotedStatusId = user.quotedStatusId;
    }

    return user;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** updatePreviousUserProps ERROR: " + err));
    throw err;
  }
}

const processUserPickArray = [
  "ageDays",
  "bannerImageUrl",
  "category",
  "categoryAuto",
  "categorizeNetwork",
  "categoryVerified",
  "createdAt",
  "description",
  "followersCount",
  "following",
  "friendsCount",
  "ignored",
  "isBot",
  "isTopTerm",
  "isTweeter",
  "isTweetSource",
  "lastSeen",
  "location",
  "mentions",
  "name",
  "nodeId",
  "nodeType",
  "profileImageUrl",
  "rate",
  "rateMax",
  "rateMaxTime",
  "screenName",
  "statusesCount",
  "tweetsPerDay",
  "userId",
  "verified"
];

async function processUser(params) {

  if (userServerController === undefined) {
    console.log(chalkError(MODULE_ID_PREFIX + " | *** processUser userServerController UNDEFINED"));
    throw new Error("processUser userServerController UNDEFINED");
  }

  try {

    const user = params.user;
    // user.following = true;

    let updatedFriendsUser = user;

    if (configuration.enableFetchUserFriends && (!user.friends || (user.friends.length === undefined)|| (user.friends.length === 0))){
      updatedFriendsUser = await updateUserFriends({user: user});
    }

    const updatedTweetsUser = await updateUserTweets({user: updatedFriendsUser});
    const autoCategoryUser = await generateAutoCategory({user: updatedTweetsUser});
    const prevPropsUser = await updatePreviousUserProps({user: autoCategoryUser});

    prevPropsUser.markModified("ageDays");
    prevPropsUser.markModified("tweetsPerDay");
    prevPropsUser.markModified("categoryAuto");
    prevPropsUser.markModified("categorizeNetwork");
    prevPropsUser.markModified("tweetHistograms");
    prevPropsUser.markModified("profileHistograms");
    prevPropsUser.markModified("tweets");
    prevPropsUser.markModified("latestTweets");

    await prevPropsUser.save();

    const u = pick(prevPropsUser.toObject(), processUserPickArray);

    // KLUDGE!! why these aren't passed thru in toObjec()?
    u.ageDays = prevPropsUser.ageDays;
    u.tweetsPerDay = prevPropsUser.tweetsPerDay;
    u.tweetHistograms = {};
    u.profileHistograms = {};
    u.friends = [];
    // const u = prevPropsUser.toJSON();

    return u;

  }
  catch(err) {
    console.log(chalkError(MODULE_ID_PREFIX + " | *** processUser ERROR: " + err));
    throw err;
  }
}

async function loadNetworks(){

  console.log(chalkLog(MODULE_ID_PREFIX 
    + " | ... LOADING BEST NETWORKS FROM " + configuration.configDefaultFolder + "/" + configuration.bestNetworkIdArrayFile
  ));

  configuration.bestNetworkIdArray = await tcUtils.loadFileRetry({
    folder: configuration.configDefaultFolder, 
    file: configuration.bestNetworkIdArrayFile
  });

  if (configuration.bestNetworkIdArray && configuration.bestNetworkIdArray.length > 0){

    console.log(chalkLog(MODULE_ID_PREFIX + " | ... LOADING BEST NETWORKS: " + configuration.bestNetworkIdArray.length));

    for (const nnId of configuration.bestNetworkIdArray){
      const nn = await global.wordAssoDb.NeuralNetwork.findOne({networkId: nnId}).lean();

      if (nn) {

        if (nn.testCycleHistory && nn.testCycleHistory !== undefined && nn.testCycleHistory.length > 0) {

          nn.previousRank = nn.testCycleHistory[nn.testCycleHistory.length-1].rank;

          console.log(chalkLog(MODULE_ID_PREFIX
            + " | PREV RANK " + nn.previousRank
            + " | " + nn.networkId 
          ));
        } 

        await nnTools.loadNetwork({networkObj: nn});
      }
    }        
    return;
  }
  else{
    return;
  }
}

async function fixIncorrectNetworkMetaData(params){

  try{
    let incorrectUpdateFlag = false;

   if (params.networkObj.runtimeMatchRate === undefined) {
      params.networkObj.runtimeMatchRate = 0;
    }

    if (params.networkObj.evolve 
      && params.networkObj.evolve.options.networkTechnology 
      && params.networkObj.evolve.options.networkTechnology !== params.networkObj.networkTechnology) {
      console.log(chalkAlert(MODULE_ID_PREFIX
        + " | !!! INCORRECT NETWORK TECH | CHANGE " + params.networkObj.networkTechnology 
        + " -> " + params.networkObj.evolve.options.networkTechnology
        + " | " + params.networkObj.networkId 
      ));
      params.networkObj.networkTechnology = params.networkObj.evolve.options.networkTechnology;
      incorrectUpdateFlag = "networkTechnology";
    } 

    if (params.networkObj.evolve
      && params.networkObj.evolve.options.binaryMode !== undefined 
      && params.networkObj.evolve.options.binaryMode !== params.networkObj.binaryMode) {
      console.log(chalkAlert(MODULE_ID_PREFIX
        + " | !!! INCORRECT BINARY MODE | CHANGE " + params.networkObj.binaryMode 
        + " -> " + params.networkObj.evolve.options.binaryMode
        + " | " + params.networkObj.networkId 
      ));
      params.networkObj.binaryMode = params.networkObj.evolve.options.binaryMode;
      incorrectUpdateFlag = "binaryMode";
    } 

    if (incorrectUpdateFlag) {
      console.log(chalkLog(MODULE_ID_PREFIX
        + " | ... SAVING UPDATED INCORRECT NN META DATA"
        + " | INCORRECT FLAG: " + incorrectUpdateFlag
        + " | " + params.networkObj.networkId 
      ));
      if (!params.updateDatabaseOnly) {
        await tcUtils.saveFile({folder: params.folder, file: params.file, obj: params.networkObj});
      }
    }

    return params.networkObj;
  }
  catch(err){
    console.log(chalkAlert(MODULE_ID_PREFIX + " | *** fixIncorrectNetworkMetaData ERROR | " + err));
    throw err;
  }
}

process.on("message", async function(m) {

  let twitterUserObj;
  let cacheObj;

  switch (m.op) {

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.bestNetworkIdArrayFile = (m.bestNetworkIdArrayFile !== undefined) ? m.bestNetworkIdArrayFile : configuration.bestNetworkIdArrayFile;
      configuration.userProfileOnlyFlag = (m.userProfileOnlyFlag !== undefined) ? m.userProfileOnlyFlag : configuration.userProfileOnlyFlag;

      configuration.enableGeoCode = (m.enableGeoCode !== undefined) ? m.enableGeoCode : configuration.enableGeoCode;
      configuration.forceGeoCode = (m.forceGeoCode !== undefined) ? m.forceGeoCode : configuration.forceGeoCode;

      configuration.enableImageAnalysis = (m.enableImageAnalysis !== undefined) ? m.enableImageAnalysis : configuration.enableImageAnalysis;
      configuration.forceImageAnalysis = (m.forceImageAnalysis !== undefined) ? m.forceImageAnalysis : configuration.forceImageAnalysis;

      configuration.enableLanguageAnalysis = (m.enableLanguageAnalysis !== undefined) ? m.enableLanguageAnalysis : configuration.enableLanguageAnalysis;
      configuration.forceLanguageAnalysis = (m.forceLanguageAnalysis !== undefined) ? m.forceLanguageAnalysis : configuration.forceLanguageAnalysis;

      statsObj.autoChangeTotal = 0;
      statsObj.autoChangeMatchRate = 0;
      statsObj.autoChangeMatch = 0;
      statsObj.autoChangeMismatch = 0;

      const primaryNnObj = m.networkObj;

      if (empty(primaryNnObj)){
        console.log(chalkError(MODULE_ID_PREFIX
          + " | *** UNDEFINED NETWORK " + tcUtils.jsonPrint(m)
        ));
        quit();
        break;
      }

      if (primaryNnObj.testCycleHistory && primaryNnObj.testCycleHistory !== undefined && primaryNnObj.testCycleHistory.length > 0) {

        primaryNnObj.previousRank = primaryNnObj.testCycleHistory[primaryNnObj.testCycleHistory.length-1].rank;

        console.log(chalkLog(MODULE_ID_PREFIX
          + " | PRIMARY NN PREV RANK " + primaryNnObj.previousRank
          + " | " + primaryNnObj.networkId 
        ));
      } 

      const pNnObj = await fixIncorrectNetworkMetaData({networkObj: primaryNnObj, updateDatabaseOnly: true});
      primaryNetworkObj = await nnTools.convertNetwork({networkObj: pNnObj});

      await nnTools.deleteAllNetworks();

      await nnTools.loadNetwork({networkObj: primaryNetworkObj});
      nnTools.setPrimaryNeuralNetwork(primaryNetworkObj.networkId);

      // await nnTools.setMaxInputHashMap(m.maxInputHashMap);
      await nnTools.setNormalization(m.normalization);

      await loadNetworks();

      await tcUtils.setEnableLanguageAnalysis(configuration.enableLanguageAnalysis);
      await tcUtils.setEnableImageAnalysis(configuration.enableImageAnalysis);
      await tcUtils.setEnableGeoCode(configuration.enableGeoCode);
      
      await tcUtils.initTwitter({twitterConfig: m.twitterConfig});
      await initProcessUserQueueInterval(configuration.processUserQueueInterval);

      console.log(chalkBlueBold("===============================\n"
        + MODULE_ID_PREFIX + " | INIT"
        + " | TITLE: " + process.title
        + " | PRIMARY NETWORK: " + primaryNetworkObj.networkId
        + " | USER PROFILE ONLY FLAG: " + configuration.userProfileOnlyFlag
        + " | ENABLE GEOCODE: " + configuration.enableGeoCode
        + " | FORCE GEOCODE: " + configuration.forceGeoCode
        + " | ENABLE IMAGE ANALYSIS: " + configuration.enableImageAnalysis
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
        + " | ENABLE LANG ANALYSIS: " + configuration.enableLanguageAnalysis
        + " | FORCE LANG ANALYSIS: " + configuration.forceLanguageAnalysis
        // + "\nWAS | TFC | INIT | MAX INPUT HM KEYS: " + Object.keys(nnTools.getMaxInputHashMap())
        + "\nWAS | TFC | INIT | NORMALIZATION: " + Object.keys(nnTools.getNormalization())
        + "\n==============================="
      ));
    break;

    case "NETWORK":

      primaryNetworkObj = m.networkObj;
      await nnTools.loadNetwork({networkObj: m.networkObj});
      nnTools.setPrimaryNeuralNetwork(m.networkObj.networkId);

      statsObj.autoChangeTotal = 0;
      statsObj.autoChangeMatchRate = 0;
      statsObj.autoChangeMatch = 0;
      statsObj.autoChangeMismatch = 0;

      console.log(chalkBlueBold(MODULE_ID_PREFIX + " | >>> SET PRIMARY NETWORK"
        + " | NETWORK: " + primaryNetworkObj.networkId
        + " | INPUTS ID: " + primaryNetworkObj.inputsId
      ));
    break;

    case "FORCE_IMAGE_ANALYSIS":
      configuration.forceImageAnalysis = m.forceImageAnalysis;
      console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ FORCE_IMAGE_ANALYSIS"
        + " | FORCE IMAGE ANALYSIS: " + configuration.forceImageAnalysis
      ));
    break;

    // case "MAX_INPUT_HASHMAP":
    //   await nnTools.setMaxInputHashMap(m.maxInputHashMap);
    //   console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ MAX_INPUT_HASHMAP"
    //     + " | MAX INPUT HM KEYS: " + Object.keys(nnTools.getMaxInputHashMap())
    //   ));
    // break;

    case "NORMALIZATION":
      await nnTools.setNormalization(m.normalization);
      console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ NORMALIZATION"
        + " | NORMALIZATION: " + Object.keys(nnTools.getNormalization())
      ));
    break;

    case "USER_AUTHENTICATED":

      console.log(chalkInfo(MODULE_ID_PREFIX + " | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      twitterUserObj = twitterUserHashMap.get(m.user.screenName);

      if (twitterUserObj !== undefined) {

        const authObj = twitterUserObj.twit.getAuth();

        console.log(chalkLog(MODULE_ID_PREFIX + " | CURRENT AUTH\n" + tcUtils.jsonPrint(authObj)));

        twitterUserObj.twit.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

        const authObjNew = twitterUserObj.twit.getAuth();

        twitterUserObj.twitterConfig.access_token = authObjNew.access_token;
        twitterUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
        twitterUserObj.twitterConfig.TOKEN = authObjNew.access_token;
        twitterUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

        twitterUserHashMap.set(m.user.screenName, twitterUserObj);

        console.log(chalkError(MODULE_ID_PREFIX + " | UPDATED AUTH\n" + tcUtils.jsonPrint(authObjNew)));

      }
      else {
        console.log(chalkAlert(MODULE_ID_PREFIX + " | TWITTER USER OBJ UNDEFINED: " + m.user.screenName));
      }
    break;

    case "USER_CATEGORIZE":

      if (m.priorityFlag) {
        console.log(chalkInfo(MODULE_ID_PREFIX + " | PRI CAT"
          + " [PUQ: " + processUserQueue.length + "]"
          + " | NID: " + m.user.nodeId
          + " | @" + m.user.screenName
          + " | CN: " + m.user.categorizeNetwork
          + " | CV: " + m.user.categoryVerified
          + " | CM: " + m.user.category
          + " | CA: " + m.user.categoryAuto
        ));
      }

      cacheObj = userChangeCache.get(m.user.nodeId);

      if (m.priorityFlag && configuration.verbose) { 
        if (cacheObj){
          console.log(chalk.green(MODULE_ID_PREFIX + " | CAT $ HIT"
            + " [UC$: " + userChangeCache.getStats().keys + "]"
            + " [PUQ: " + processUserQueue.length + "]"
            + " | SEARCH: " + m.searchMode
            + " | NID: " + m.user.nodeId
            + " | @" + m.user.screenName
            + " | CN: " + m.user.categorizeNetwork
            + " | CV: " + m.user.categoryVerified
            + " | CM: " + m.user.category
            + " | CA: " + m.user.categoryAuto
          ));
        }
        else{
          console.log(chalk.gray(MODULE_ID_PREFIX + " | CAT $ MISS"
            + " [UC$: " + userChangeCache.getStats().keys + "]"
            + " [PUQ: " + processUserQueue.length + "]"
            + " | SEARCH: " + m.searchMode
            + " | NID: " + m.user.nodeId
            + " | @" + m.user.screenName
            + " | CN: " + m.user.categorizeNetwork
            + " | CV: " + m.user.categoryVerified
            + " | CM: " + m.user.category
            + " | CA: " + m.user.categoryAuto
          ));
        }
      }

      if (m.priorityFlag || ((cacheObj === undefined) && (processUserQueue.length < USER_PROCESS_QUEUE_MAX_LENGTH))){

        try {

          const user = m.user.toObject();

          if (m.priorityFlag) {
            user.priorityFlag = true;
            processUserQueue.unshift({user: user, priorityFlag: m.priorityFlag, searchMode: m.searchMode});
          }
          else {
            user.priorityFlag = false;
            userChangeCache.set(user.nodeId, {user: user, timeStamp: moment().valueOf()});
            processUserQueue.push({user: user, priorityFlag: m.priorityFlag, searchMode: m.searchMode});
          }

        }
        catch(err){  
          // not a user doc

          if (m.priorityFlag) {
            m.user.priorityFlag = true;
            processUserQueue.unshift({user: m.user, priorityFlag: m.priorityFlag, searchMode: m.searchMode});
          }
          else {
            m.user.priorityFlag = false;
            userChangeCache.set(m.user.nodeId, {user: m.user, timeStamp: moment().valueOf()});
            processUserQueue.push({user: m.user, priorityFlag: m.priorityFlag, searchMode: m.searchMode});
          }

        }
      }
    break;

    case "PING":
      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    default:
      console.error(chalkLog(MODULE_ID_PREFIX + " | TWP | *** UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));
  }
});

setTimeout(async function(){

  try {
    await connectDb();
    dbConnectionReady = true;

    try{
      configuration = await initialize(configuration);
    }
    catch(err){
      if (err.status != 404){
        console.error(chalkLog(MODULE_ID_PREFIX + " | *** INIT ERROR \n" + tcUtils.jsonPrint(err)));
        quit();
      }
      console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
    }
  }
  catch(err){
    dbConnectionReady = false;
    console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"));
    quit("MONGO DB CONNECT ERROR");
  }

  console.log(MODULE_ID_PREFIX + " | " + configuration.processName + " STARTED " + tcUtils.getTimeStamp() + "\n");

  dbConnectionReadyInterval = setInterval(function() {
    if (dbConnectionReady) {
      clearInterval(dbConnectionReadyInterval);
    }
    else {
      console.log(chalkInfo(MODULE_ID_PREFIX + " | WAIT DB CONNECTED ..."));
    }
  }, 1000);

  try {
    initSaveFileQueue(configuration);
    const twitterParams = await tcUtils.initTwitterConfig();
    await tcUtils.initTwitter({twitterConfig: twitterParams});
    await tcUtils.getTwitterAccountSettings();
    await initWatchConfig();
    process.send({ op: "READY"});
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT INFO TWITTER ERROR: " + err));
  }

}, ONE_SECOND);


