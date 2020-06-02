process.title = "wa_node_child_dbu";

const MODULE_ID_PREFIX = "DBU";

const inputTypes = [
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

const DEFAULT_VERBOSE = false;
const DEFAULT_TEST_MODE = false;
const DEFAULT_USER_UPDATE_QUEUE_INTERVAL = 100;
const DEFAULT_MAX_UPDATE_QUEUE = 500;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;
const ONE_HOUR = ONE_MINUTE*60;
const ONE_DAY = ONE_HOUR*24;

const compactDateTimeFormat = "YYYYMMDD_HHmmss";

const os = require("os");
const moment = require("moment");
const debug = require("debug")("dbu");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");
const _ = require("lodash");
const merge = require("deepmerge");

const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
const tcUtils = new ThreeceeUtilities(MODULE_ID_PREFIX + "_TCU");

tcUtils.on("error", function(err){
  console.log(chalkError(MODULE_ID_PREFIX + " | *** TCU ERROR | " + err));
});

tcUtils.on("ready", function(appname){
  console.log(chalk.green(MODULE_ID_PREFIX + " | TCU READY | " + appname));
});

const msToTime = tcUtils.msToTime;
const getTimeStamp = tcUtils.getTimeStamp;

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkUser = chalk.black;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

console.log("WAS | ==============================");
console.log("WAS | HOST: " + hostname);
console.log("WAS | ==============================");

const statsObj = {};

statsObj.status = "LOAD";
statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.dbConnectionReady = false;

statsObj.startTimeMoment = moment();
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.users = {};

statsObj.errors = {};
statsObj.errors.users = {};

process.on("unhandledRejection", function(err, promise) {
  console.trace("Unhandled rejection (promise: ", promise, ", reason: ", err, ").");
  process.exit();
});

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

process.on("disconnect", function() {
  quit("DISCONNECT");
});

global.wordAssoDb = require("@threeceelabs/mongoose-twitter");

const configuration = {}; // merge of defaultConfiguration & hostConfiguration
configuration.processName = process.env.DBU_PROCESS_NAME || "node_databaseUpdate";
configuration.verbose = DEFAULT_VERBOSE;
configuration.testMode = DEFAULT_TEST_MODE; // per tweet test mode
configuration.maxUserUpdateQueue = DEFAULT_MAX_UPDATE_QUEUE;
configuration.inputTypes = inputTypes;

console.log(
  "\n\nDBU | ====================================================================================================\n" 
  + "\nDBU | " + process.argv[1] 
  + "\nDBU | PROCESS ID:    " + process.pid 
  + "\nDBU | PROCESS TITLE: " + process.title 
  + "\nDBU | " + "====================================================================================================\n" 
);

function showStats(){

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  console.log(chalkLog("DBU | ============================================================"
    + "\nDBU | S"
    + " | STATUS: " + statsObj.status
    + " | CPUs: " + statsObj.cpus
    + " | CH: " + statsObj.numChildren
    + " | S " + moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat)
    + " | N " + moment().format(compactDateTimeFormat)
    + " | E " + msToTime(statsObj.elapsed)
    + "\nDBU | ============================================================"
  ));
}

function quit(options){

  console.log(chalkAlert( "DBU | ... QUITTING ..." ));

  clearInterval(userUpdateQueueInterval);

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options !== undefined) {

    if (options === "help") {
      process.exit();
    }
  }

  showStats();

  setTimeout(function(){
    process.exit();
  }, 1000);
}

process.on( "SIGINT", function() {
  quit("SIGINT");
});

process.on("exit", function() {
  quit("EXIT");
});

async function connectDb(){

  try {

    statsObj.status = "CONNECTING MONGO DB";

    console.log(chalkLog(MODULE_ID_PREFIX + " | CONNECT MONGO DB ..."));

    const db = await global.wordAssoDb.connect(MODULE_ID_PREFIX + "_" + process.pid);

    db.on("error", async function(err){
      statsObj.status = "MONGO ERROR";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION ERROR"));
      db.close();
      quit({cause: "MONGO DB ERROR: " + err});
    });

    db.on("close", async function(err){
      statsObj.status = "MONGO CLOSED";
      statsObj.dbConnectionReady = false;
      console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECTION CLOSED"));
      quit({cause: "MONGO DB CLOSED: " + err});
    });

    db.on("disconnected", async function(){
      statsObj.status = "MONGO DISCONNECTED";
      statsObj.dbConnectionReady = false;
      console.log(chalkAlert(MODULE_ID_PREFIX + " | *** MONGO DB DISCONNECTED"));
      quit({cause: "MONGO DB DISCONNECTED"});
    });

    console.log(chalk.green(MODULE_ID_PREFIX + " | MONGOOSE DEFAULT CONNECTION OPEN"));    

    statsObj.dbConnectionReady = true;

    return db;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** MONGO DB CONNECT ERROR: " + err));
    throw err;
  }
}

function initialize(){

  return new Promise(function(resolve){

    statsObj.status = "INITIALIZE";

    if (debug.enabled || debugCache.enabled || debugQ.enabled){
      console.log("\nDBU | %%%%%%%%%%%%%%\nDBU |  DEBUG ENABLED \nDBU | %%%%%%%%%%%%%%\n");
    }

    resolve();

  });
}

function printUserObj(title, user) {
  console.log(chalkUser(title
    + " | " + user.userId
    + " | @" + user.screenName
    + " | " + user.name 
    + " | FWs " + user.followersCount
    + " | FDs " + user.friendsCount
    + " | T " + user.statusesCount
    + " | M  " + user.mentions
    + " | LS " + getTimeStamp(user.lastSeen)
    + " | FW: " + user.following 
    + " | 3C " + user.threeceeFollowing 
    + " | LHTID " + user.lastHistogramTweetId 
    + " | LHQID " + user.lastHistogramQuoteId 
    + " | CAT M " + user.category + " A " + user.categoryAuto
  ));
}

let userUpdateQueueInterval;
let userUpdateQueueReady = false;
const userUpdateQueue = [];

function getNumKeys(obj){
  if (!obj || obj === undefined || typeof obj !== "object" || obj === null) { return 0; }
  return Object.keys(obj).length;
}

async function userUpdateDb(params){

  try{

    statsObj.status = "USER UPDATE DB";

    const user = await global.wordAssoDb.User.findOne({ nodeId: params.tweetObj.user.nodeId });

    if (!user) {
      console.log(chalkLog("DBU | --- USER DB MISS: @" + params.tweetObj.user.screenName));
      return;
    }

    if (user.tweets && user.tweets.tweetIds && user.tweets.tweetIds.includes(params.tweetObj.tweetId)){
      console.log(chalkAlert("DBU | ??? TWEET ALREADY RCVD"
        + " | TW: " + params.tweetObj.tweetId
        + " | TW MAX ID: " + user.tweets.maxId
        + " | TW SINCE ID: " + user.tweets.maxId
        + " | @" + user.screenName
      ));
      return;
    }

    const newTweetHistograms = tcUtils.processTweetObj({tweetObj: params.tweetObj});

    let tweetHistogramMerged = {};

    if (!user.tweetHistograms || user.tweetHistograms === undefined || user.tweetHistograms === null) { 
      console.log(chalkLog("DBU | USER TWEET HISTOGRAMS UNDEFINED"
        + " | " + user.nodeId
        + " | @" + user.screenName
      ));
      user.tweetHistograms = {};
    }

    if (!user.profileHistograms || user.profileHistograms === undefined || user.profileHistograms === null) { 
      console.log(chalkLog("DBU | USER PROFILE HISTOGRAMS UNDEFINED"
        + " | " + user.nodeId
        + " | @" + user.screenName
      ));
      user.profileHistograms = {};
    }

    tweetHistogramMerged = merge(newTweetHistograms, user.tweetHistograms);

    user.tweetHistograms = tweetHistogramMerged;
    user.lastHistogramTweetId = user.statusId;
    user.lastHistogramQuoteId = user.quotedStatusId;

    user.tweets.tweetIds = _.union(user.tweets.tweetIds, [params.tweetObj.tweetId]); 

    if (configuration.verbose) { printUserObj("DBU | +++ USR DB HIT", user); }

    debug(chalkInfo("DBU | USER MERGED HISTOGRAMS"
      + " | " + user.nodeId
      + " | @" + user.screenName
      + " | LHTID" + user.lastHistogramTweetId
      + " | LHQID" + user.lastHistogramQuoteId
      + " | EJs: " + getNumKeys(user.tweetHistograms.emoji)
      + " | Hs: " + getNumKeys(user.tweetHistograms.hashtags)
      + " | IMs: " + getNumKeys(user.tweetHistograms.images)
      + " | LCs: " + getNumKeys(user.tweetHistograms.locations)
      + " | MEs: " + getNumKeys(user.tweetHistograms.media)
      + " | Ms: " + getNumKeys(user.tweetHistograms.mentions)
      + " | NGs: " + getNumKeys(user.tweetHistograms.ngrams)
      + " | PLs: " + getNumKeys(user.tweetHistograms.places)
      + " | STs: " + getNumKeys(user.tweetHistograms.sentiment)
      + " | UMs: " + getNumKeys(user.tweetHistograms.userMentions)
      + " | ULs: " + getNumKeys(user.tweetHistograms.urls)
      + " | WDs: " + getNumKeys(user.tweetHistograms.words)
    ));

    user.ageDays = (moment().diff(user.createdAt))/ONE_DAY;
    user.tweetsPerDay = user.statusesCount/user.ageDays;

    user.markModified("tweets");
    user.markModified("tweetHistograms");
    user.markModified("profileHistograms");
    user.markModified("lastHistogramTweetId");
    user.markModified("lastHistogramQuoteId");

    await user.save();
    return;

  }
  catch(err){
    console.log(chalkError("DBU | *** ERROR userUpdateDb | " + err));
    throw err;
  }
}

function initUserUpdateQueueInterval(interval){

  return new Promise(function(resolve, reject){

    try {

      clearInterval(userUpdateQueueInterval);

      userUpdateQueueReady = true;

      userUpdateQueueInterval = setInterval(async function(){

        if (userUpdateQueueReady && (userUpdateQueue.length > 0)) {

          userUpdateQueueReady = false;

          try {
            const twObj = userUpdateQueue.shift();
            await userUpdateDb({tweetObj: twObj});
            userUpdateQueueReady = true;
          }
          catch(e){
            console.log(chalkError("DBU | *** USER UPDATE DB ERROR: " + e));
            userUpdateQueueReady = true;
          }

        }

      }, interval);

      resolve();
    }
    catch(err){
      console.log(chalkError("DBU | *** INIT USER UPDATE QUEUE INTERVAL ERROR: ", err));
      reject(err);
    }

  });
}

process.on("message", async function(m) {

  debug(chalkAlert("DBU | RX MESSAGE"
    + " | OP: " + m.op
  ));

  switch (m.op) {

    case "INIT":

      process.title = m.title;

      configuration.verbose = m.verbose || DEFAULT_VERBOSE;
      configuration.testMode = m.testMode || DEFAULT_TEST_MODE;
      configuration.userUpdateQueueInterval = m.interval || DEFAULT_USER_UPDATE_QUEUE_INTERVAL;

      await initUserUpdateQueueInterval(configuration.userUpdateQueueInterval);

      console.log(chalkInfo("DBU | ==== INIT ====="
        + " | TITLE: " + process.title
      ));

    break;

    case "TWEET":

      if (userUpdateQueue.length < configuration.maxUserUpdateQueue){
        userUpdateQueue.push(m.tweetObj);
      }

      if (configuration.verbose) {
        console.log(chalkLog("DBU | [" + userUpdateQueue.length + "]"
          + " | TW " + m.tweetObj.tweetId 
          + " | @" + m.tweetObj.user.screenName 
        ));
      }

      statsObj.userUpdateQueue = userUpdateQueue.length;

    break;

    case "PING":
      debug(chalkLog("DBU | TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    default:
      console.log(chalkError("DBU | *** DBU UNKNOWN OP"
        + " | OP: " + m.op
      ));

  }
});

setTimeout(async function(){

  try {

    await initialize();

    console.log(chalkLog("DBU | " + configuration.processName + " STARTED"));

    await connectDb();

    process.send({ op: "READY"});

  }
  catch(err){
    console.log(chalkError("DBU | *** DBU INITIALIZE ERROR: " + err));
    quit(err);
  }


}, 5*ONE_SECOND);

