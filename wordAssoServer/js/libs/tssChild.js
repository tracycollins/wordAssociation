const MODULE_ID_PREFIX = "TSS";

const ignoredHashtagFile = "ignoredHashtag.txt";
const followableSearchTermFile = "followableSearchTerm.txt";
const ignoreLocationsFile = "ignoreLocations.txt";
const allowLocationsFile = "allowLocations.txt";

const DEFAULT_FILTER_RETWEETS = false;
const DEFAULT_MAX_TWEET_QUEUE = 100;
const DEFAULT_TWITTER_QUEUE_INTERVAL = 5;

const TWEET_ID_CACHE_DEFAULT_TTL = 30;
const TWEET_ID_CACHE_CHECK_PERIOD = 5;

const TWITTER_MAX_TRACKING_NUMBER = 400;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND*60;

const DEFAULT_SEARCH_TERM_UPDATE_INTERVAL = 15*ONE_MINUTE;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");
const debug = require("debug")("tss");
const debugCache = require("debug")("cache");
const debugQ = require("debug")("queue");
const path = require("path");
const empty = require("is-empty");
const watch = require("watch");

const chalk = require("chalk");
const chalkBlue = chalk.blue;
const chalkAlert = chalk.red;
const chalkTwitter = chalk.blue;
const chalkError = chalk.bold.red;
const chalkWarn = chalk.yellow;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const _ = require("lodash");
const Twit = require("twit");

const moment = require("moment");
const Measured = require("measured-core");
const NodeCache = require("node-cache");

let DROPBOX_ROOT_FOLDER;

if (hostname == "google") {
  DROPBOX_ROOT_FOLDER = "/home/tc/Dropbox/Apps/wordAssociation";
}
else {
  DROPBOX_ROOT_FOLDER = "/Users/tc/Dropbox/Apps/wordAssociation";
}

const configDefaultFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility/default");
const configHostFolder = path.join(DROPBOX_ROOT_FOLDER, "config/utility", hostname);

const statsHostFolder = path.join(DROPBOX_ROOT_FOLDER, "stats", hostname);
const twitterConfigFolder = path.join(DROPBOX_ROOT_FOLDER, "config/twitter");

const DROPBOX_DEFAULT_SEARCH_TERMS_DIR = "/config/utility/default";
const DROPBOX_DEFAULT_SEARCH_TERMS_FILE = "followableSearchTerm.txt";

let followableSearchTermSet = new Set();

let tweetIdCacheTtl = process.env.TWEET_ID_CACHE_DEFAULT_TTL;
if (tweetIdCacheTtl === undefined) { tweetIdCacheTtl = TWEET_ID_CACHE_DEFAULT_TTL; }
console.log("TSS | USER CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (tweetIdCacheCheckPeriod === undefined) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD; }
console.log("TSS | USER CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

const tweetIdCache = new NodeCache({
  stdTTL: tweetIdCacheTtl,
  checkperiod: tweetIdCacheCheckPeriod
});

const ThreeceeUtilities = require("@threeceelabs/threecee-utilities");
const tcUtils = new ThreeceeUtilities("WAS_TSS_TCU");
const jsonPrint = tcUtils.jsonPrint;
const getTimeStamp = tcUtils.getTimeStamp;
const msToTime = tcUtils.msToTime;

let filterRetweets = false;

const ignoreUserSet = new Set();
let allowLocationsSet = new Set();
let ignoredHashtagSet = new Set();

let ignoreLocationsSet = new Set();
ignoreLocationsSet.add("india");
ignoreLocationsSet.add("africa");
ignoreLocationsSet.add("canada");
ignoreLocationsSet.add("britain");
ignoreLocationsSet.add("mumbai");
ignoreLocationsSet.add("london");
ignoreLocationsSet.add("england");
ignoreLocationsSet.add("nigeria");
ignoreLocationsSet.add("lagos");

let ignoreLocationsArray = [...ignoreLocationsSet];
let ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
let ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "gi");

process.on("SIGHUP", function() {
  quit("SIGHUP");
});

process.on("SIGINT", function() {
  quit("SIGINT");
});

process.on("disconnect", function() {
  quit("DISCONNECT");
});

let twitterSearchInit = false;

const tweetQueue = [];
let tweetSendReady = [];
let tweetQueueInterval;

let configuration = {};
configuration.filterDuplicateTweets = true;
let filterDuplicateTweets = true;

configuration.filterRetweets = DEFAULT_FILTER_RETWEETS;
configuration.verbose = false;
configuration.forceFollow = false;
configuration.globalTestMode = false;
configuration.testMode = false; // per tweet test mode
configuration.searchTermsUpdateInterval = DEFAULT_SEARCH_TERM_UPDATE_INTERVAL;
configuration.followQueueIntervalTime = 5*ONE_SECOND;
configuration.maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
let maxTweetQueue = DEFAULT_MAX_TWEET_QUEUE;
configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;

configuration.sendMessageTimeout = ONE_SECOND;
configuration.twitterDownTimeout = 3*ONE_MINUTE;
configuration.initSearchTermsTimeout = Number(ONE_MINUTE);
configuration.initIgnoreLocationsTimeout = Number(ONE_MINUTE);
configuration.twitterFollowLimitTimeout = 15*ONE_MINUTE;

configuration.twitterConfig = {};

const threeceeUserObj = {};

// ??? KLUDGE: DON'T HARD CODE CREDENTIALS!! SECURITY RISK
threeceeUserObj.twitterConfig = {};
threeceeUserObj.twitterConfig.screenName = "altthreecee00";
threeceeUserObj.twitterConfig.CONSUMER_KEY = "ex0jSXayxMOjNm4DZIiic9Nc0";
threeceeUserObj.twitterConfig.consumer_key = "ex0jSXayxMOjNm4DZIiic9Nc0";
threeceeUserObj.twitterConfig.CONSUMER_SECRET = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa";
threeceeUserObj.twitterConfig.consumer_secret = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa";
threeceeUserObj.twitterConfig.TOKEN = "848591649575927810-2MYMejf0VeXwMkQELca6uDqXUkfxKow";
threeceeUserObj.twitterConfig.access_token = "848591649575927810-2MYMejf0VeXwMkQELca6uDqXUkfxKow";
threeceeUserObj.twitterConfig.TOKEN_SECRET = "NL5UBvP2QFPH9fYe7MUZleH24RoMoErfbDTrJNglrEidB";
threeceeUserObj.twitterConfig.access_token_secret = "NL5UBvP2QFPH9fYe7MUZleH24RoMoErfbDTrJNglrEidB";

threeceeUserObj.screenName = "altthreecee00";

threeceeUserObj.stats = {};
threeceeUserObj.stats.ready = false;
threeceeUserObj.stats.error = false;
threeceeUserObj.stats.connected = false;
threeceeUserObj.stats.authenticated = false;
threeceeUserObj.stats.twitterTokenErrorFlag = false;

threeceeUserObj.stats.tweetsReceived = 0;
let tweetsReceived = 0;

threeceeUserObj.stats.retweetsReceived = 0;
let retweetsReceived = 0;

threeceeUserObj.stats.quotedTweetsReceived = 0;
let quotedTweetsReceived = 0;

threeceeUserObj.stats.twitterConnects = 0;
threeceeUserObj.stats.twitterReconnects = 0;
threeceeUserObj.stats.twitterFollowLimit = false;
threeceeUserObj.stats.twitterLimit = 0;
threeceeUserObj.stats.twitterErrors = 0;
threeceeUserObj.stats.rateLimited = false;
let rateLimited = false;
threeceeUserObj.stats.tweetsPerSecond = 0;
let tweetsPerSecond = 0;
threeceeUserObj.stats.tweetsPerMinute = 0;
let tweetsPerMinute = 0;

threeceeUserObj.rateLimit = {};

const rateMeter = Measured.createCollection();

rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

threeceeUserObj.trackingNumber = 0;

threeceeUserObj.followUserScreenNameSet = new Set();
threeceeUserObj.followUserIdSet = new Set();
threeceeUserObj.searchTermSet = new Set();

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

const statsObj = {};

// statsObj.dbConnectionReady = false;

statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.maxHeap = process.memoryUsage().heapUsed/(1024*1024);
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.queues = {};
statsObj.queues.tweetQueue = {};
statsObj.queues.tweetQueue.size = 0;
statsObj.queues.tweetQueue.fullEvents = 0;
let fullEvents = 0;
statsObj.queues.followQueue = {};
statsObj.queues.followQueue.size = 0;
statsObj.queues.followQueue.fullEvents = 0;
statsObj.queues.unfollowQueue = {};
statsObj.queues.unfollowQueue.size = 0;
statsObj.queues.unfollowQueue.fullEvents = 0;

statsObj.tweetsReceived = 0;
statsObj.retweetsReceived = 0;
statsObj.quotedTweetsReceived = 0;
statsObj.tweetsPerSecond = 0.0;
statsObj.tweetsPerMinute = 0.0;
statsObj.maxTweetsPerMinute = 0;
statsObj.maxTweetsPerMinuteTime = moment().valueOf();

statsObj.twitter = {};
statsObj.twitter.duplicateTweetsReceived = 0;
let duplicateTweetsReceived = 0;
statsObj.twitter.deletes = 0;
statsObj.twitter.connects = 0;
statsObj.twitter.disconnects = 0;
statsObj.twitter.reconnects = 0;
statsObj.twitter.warnings = 0;
statsObj.twitter.errors = 0;
statsObj.twitter.limit = 0;
statsObj.twitter.scrubGeo = 0;
statsObj.twitter.statusWithheld = 0;
statsObj.twitter.userWithheld = 0;
statsObj.twitter.limitMax = 0;
statsObj.twitter.limitMaxTime = moment().valueOf();

// ==================================================================
// DROPBOX
// ==================================================================

if (process.env.DROPBOX_DEFAULT_SEARCH_TERMS_DIR !== undefined) {
  configuration.searchTermsDir = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
}
else {
  configuration.searchTermsDir = DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
}

if (process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE !== undefined) {
  configuration.searchTermsFile = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
}
else {
  configuration.searchTermsFile = DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
}

const DROPBOX_TSS_CONFIG_FILE = process.env.DROPBOX_TSS_CONFIG_FILE || "twitterSearchStreamConfig.json";
const DROPBOX_TSS_STATS_FILE = process.env.DROPBOX_TSS_STATS_FILE || "twitterSearchStreamStats.json";

const statsFile = DROPBOX_TSS_STATS_FILE;

const dropboxConfigFolder = "/config/utility";

const dropboxConfigFile = hostname + "_" + DROPBOX_TSS_CONFIG_FILE;

console.log("TSS | DROPBOX_TSS_CONFIG_FILE: " + DROPBOX_TSS_CONFIG_FILE);

debug("TSS | dropboxConfigFolder : " + dropboxConfigFolder);
debug("TSS | dropboxConfigFile : " + dropboxConfigFile);

function showStats(options){

  threeceeUserObj.stats.rateLimited = rateLimited;

  statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
  statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

  statsObj.tweetsReceived = tweetsReceived;
  statsObj.retweetsReceived = retweetsReceived;
  statsObj.quotedTweetsReceived = quotedTweetsReceived;
  statsObj.twitter.duplicateTweetsReceived = duplicateTweetsReceived;

  statsObj.queues.tweetQueue.fullEvents = fullEvents;

  statsObj.tweetsPerSecond = tweetsPerSecond || 0;
  statsObj.tweetsPerMinute = tweetsPerMinute || 0;

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

    console.log("TSS | @" + threeceeUserObj.screenName
      + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
    );

    console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
      + " | FOLLOW USER ID SET: " + threeceeUserObj.followUserIdSet.size
    ));

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
      + " \nTSS | TWITTER LIMIT: " + statsObj.twitter.limit
      + " | " + statsObj.twitter.limitMax + " MAX"
      + " " + moment(parseInt(statsObj.twitter.limitMaxTime)).format(compactDateTimeFormat)
    ));

    console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
      + " | TRACKING SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
    ));

    console.log(chalkLog("TSS | @" + threeceeUserObj.screenName
      + " | FOLLOW USER ID SET: " + threeceeUserObj.followUserIdSet.size
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

  console.log("TSS | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TSS CHILD: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  // if (dbConnection !== undefined) {

  //   dbConnection.close(function () {
  //     console.log(chalkAlert(
  //           "TSS | =========================="
  //       + "\nTSS | MONGO DB CONNECTION CLOSED"
  //       + "\nTSS | =========================="
  //     ));

  //     process.exit(exitCode);
  //   });
  // }
  // else {
    process.exit(exitCode);
  // }
}

function initStatsUpdate(cnf){

  return new Promise(function(resolve, reject){

    console.log(chalkInfo("TSS | TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

    try{

      setInterval(async function () {

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;
        statsObj.timeStamp = moment().format(defaultDateTimeFormat);

        threeceeUserObj.stats.rateLimited = rateLimited;

        statsObj.heap = process.memoryUsage().heapUsed/(1024*1024);
        statsObj.maxHeap = Math.max(statsObj.maxHeap, statsObj.heap);

        statsObj.tweetsReceived = tweetsReceived;
        statsObj.retweetsReceived = retweetsReceived;
        statsObj.quotedTweetsReceived = quotedTweetsReceived;
        statsObj.twitter.duplicateTweetsReceived = duplicateTweetsReceived;

        statsObj.queues.tweetQueue.fullEvents = fullEvents;

        statsObj.tweetsPerSecond = tweetsPerSecond || 0;
        statsObj.tweetsPerMinute = tweetsPerMinute || 0;

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;

        if (statsObj.tweetsPerMinute > statsObj.maxTweetsPerMinute) {
          statsObj.maxTweetsPerMinute = statsObj.tweetsPerMinute;
          statsObj.maxTweetsPerMinuteTime = moment().valueOf();
          console.log(chalk.blue("TSS | NEW MAX TPM"
            + " | " + moment().format(compactDateTimeFormat)
            + " | " + statsObj.tweetsPerMinute.toFixed(0)
          ));
        }

        await tcUtils.saveFile({folder: statsHostFolder, file: statsFile, obj: statsObj});

      }, cnf.statsUpdateIntervalTime);

      resolve(cnf);
    }
    catch(err){
      reject(err);
    }
  });
}

const rateLimitHashMap = {};

function twitStreamPromise(params){

  return new Promise(function(resolve, reject){

    const resource_endpoint = params.resource + "_" + params.endPoint;
    const resourceEndpoint = params.resource + "/" + params.endPoint;

    if (rateLimitHashMap[resource_endpoint] && rateLimitHashMap[resource_endpoint].exceptionFlag){
      return resolve();
    }

    if (!rateLimitHashMap[resource_endpoint] || rateLimitHashMap[resource_endpoint] == undefined) {
      rateLimitHashMap[resource_endpoint] = {};
    }

    rateLimitHashMap[resource_endpoint].exceptionFlag = false;

    threeceeUserObj.twitStream.get(resourceEndpoint, params.twitParams, async function(err, data, response) {

      if (err){
        console.log(chalkError("TSS | *** TWITTER STREAM ERROR"
          + " | @" + threeceeUserObj.screenName
          + " | " + getTimeStamp()
          + " | CODE: " + err.code
          + " | STATUS CODE: " + err.statusCode
          + " | " + err.message
        ));

        if (err.code) {
          if (err.code == 88) {

            rateLimitHashMap[resource_endpoint].exceptionFlag = true;

            const rateLimitEndEvent = "rateLimitEnd_" + resource_endpoint;

            tcUtils.emitter.once(rateLimitEndEvent, function(){

              console.log(chalkError("TSS | -X- TWITTER STREAM RATE LIMIT END"
                + " | @" + threeceeUserObj.screenName
                + " | " + getTimeStamp()
                + " | EVENT: " + rateLimitEndEvent
              ));

              const key = rateLimitEndEvent.replace("rateLimitEnd_", "");

              rateLimitHashMap[key].exceptionFlag = false;

            });
          }

          await tcUtils.handleTwitterError({user: "altthreecee00", err: err, resource: params.resource, endPoint: params.endPoint});

          resolve();
        }

        if (configuration.verbose) {
          console.log("TSS | response\n" + jsonPrint(response));
        }

        threeceeUserObj.stats.error = err;
        threeceeUserObj.stats.twitterErrors += 1;

        return reject(err);
      }

      threeceeUserObj.stats.error = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = false;

      resolve(data);

    });
  });

}

async function initFollowUserIdSet(){

  process.send({
    op: "TWITTER_STATS", 
    threeceeUser: threeceeUserObj.screenName, 
    stats: threeceeUserObj.stats, 
    twitterFollowing: threeceeUserObj.followUserIdSet.size,
    twitterFriends: [...threeceeUserObj.followUserIdSet]
  });

  return threeceeUserObj;

}

async function initTwit(){

  console.log(chalkLog("TSS | INIT TWIT USER @" + threeceeUserObj.screenName));

  console.log(chalkInfo("TSS | INIT TWIT | TWITTER CONFIG " 
    + "\n" + jsonPrint(threeceeUserObj.twitterConfig)
  ));

  threeceeUserObj.stats = {};
  threeceeUserObj.stats.ready = false;
  threeceeUserObj.stats.error = false;
  threeceeUserObj.stats.connected = false;
  threeceeUserObj.stats.authenticated = false;
  threeceeUserObj.stats.twitterTokenErrorFlag = false;
  threeceeUserObj.stats.tweetsReceived = 0;
  threeceeUserObj.stats.retweetsReceived = 0;
  threeceeUserObj.stats.quotedTweetsReceived = 0;
  threeceeUserObj.stats.twitterConnects = 0;
  threeceeUserObj.stats.twitterReconnects = 0;
  threeceeUserObj.stats.twitterFollowLimit = false;
  threeceeUserObj.stats.twitterLimit = 0;
  threeceeUserObj.stats.twitterErrors = 0;
  threeceeUserObj.stats.rateLimited = false;
  rateLimited = false;
  threeceeUserObj.stats.tweetsPerSecond = 0;
  threeceeUserObj.stats.tweetsPerMinute = 0;

  threeceeUserObj.stats.twitterRateLimit = 0;
  threeceeUserObj.stats.twitterRateLimitRemaining = 0;
  threeceeUserObj.stats.twitterRateLimitResetAt = 0;
  threeceeUserObj.stats.twitterRateLimitRemainingTime = 0;
  threeceeUserObj.stats.twitterRateLimitExceptionFlag = false;

  threeceeUserObj.trackingNumber = 0;

  threeceeUserObj.followUserScreenNameSet = new Set();
  threeceeUserObj.followUserIdSet = new Set();

  const newTwitStream = new Twit({
    consumer_key: threeceeUserObj.twitterConfig.CONSUMER_KEY,
    consumer_secret: threeceeUserObj.twitterConfig.CONSUMER_SECRET,
    access_token: threeceeUserObj.twitterConfig.TOKEN,
    access_token_secret: threeceeUserObj.twitterConfig.TOKEN_SECRET
  });

  threeceeUserObj.twitStream = {};
  threeceeUserObj.twitStream = newTwitStream;

  threeceeUserObj.searchStream = false;
  threeceeUserObj.searchTermSet = new Set();

  console.log(chalkTwitter("TSS | INIT TWITTER USER"
    + " | NAME: " + threeceeUserObj.screenName
  ));

  const twitGetFriendsParams = {
    screen_name: threeceeUserObj.screenName,
    stringify_ids: true
  };

  try {

    await tcUtils.initTwitter(threeceeUserObj);

    const data = await twitStreamPromise({resource: "friends", endPoint: "ids", twitParams: twitGetFriendsParams});

    threeceeUserObj.stats.error = false;
    threeceeUserObj.stats.authenticated = true;
    threeceeUserObj.stats.twitterTokenErrorFlag = false;

    if (!data || data == undefined) {

      console.log(chalkAlert("TSS | !!! EMPTY TWITTER GET FRIENDS IDS"
        + " | @" + threeceeUserObj.screenName
        + " | followUserIdSet: " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
      ));

      if (threeceeUserObj.followUserIdSet.size === 0){
        return;
      }
    }
    else{
      threeceeUserObj.followUserIdSet = new Set(data.ids);
    }

    console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
      + " | @" + threeceeUserObj.screenName
      + " | " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
    ));

    await initFollowUserIdSet();

    return;

  }
  catch(err){
    console.log(chalkError("TSS | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
      + " | @" + threeceeUserObj.screenName
      + " | " + getTimeStamp()
      + " | CODE: " + err.code
      + " | STATUS CODE: " + err.statusCode
      + " | " + err.message
    ));

    threeceeUserObj.stats.error = err;
    threeceeUserObj.stats.twitterErrors += 1;
    threeceeUserObj.stats.authenticated = false;

    throw err;
  }
}

async function initTwitterUser(){

  console.log(chalkTwitter("TSS | TWITTER USER: @" + threeceeUserObj.screenName));

  try {
    await initTwit();
    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** TWIT INIT ERROR"
      + " | @" + threeceeUserObj.screenName
      + " | " + getTimeStamp()
      + " | " + err
    ));
    throw err;
  }
}

function initSearchStream(){

  return new Promise(function(resolve, reject){

    const filter = {};

    filter.follow = [...threeceeUserObj.followUserIdSet];

    filter.track = [];

    if (threeceeUserObj.searchTermSet.size > 0) {
      if (threeceeUserObj.searchTermSet.size <= TWITTER_MAX_TRACKING_NUMBER){
        filter.track = [...threeceeUserObj.searchTermSet];
      }
      else{
        const searchTermArray = _.shuffle([...threeceeUserObj.searchTermSet]);
        filter.track = searchTermArray.slice(0,TWITTER_MAX_TRACKING_NUMBER);
      }
    }

    console.log(chalkInfo("TSS | INIT SEARCH STREAM"
      + " | @" + threeceeUserObj.screenName
      + " | SEARCH TERMS: " + threeceeUserObj.searchTermSet.size
      + " | FILTER TRACK SIZE: " + filter.track.length
      + " | FILTER FOLLOW SIZE: " + filter.follow.length
    ));

    try {

      if (threeceeUserObj.searchStream) {
        console.log(chalkAlert("TSS | !!! RESTARTING TWITTER SEARCH STREAM"));
        threeceeUserObj.searchStream.stop();
      }

      threeceeUserObj.searchStream = {};

      threeceeUserObj.searchStream = threeceeUserObj.twitStream.stream("statuses/filter", filter);

      threeceeUserObj.searchStream.on("message", function(msg){
        if (msg.event) {
          console.log(chalkAlert("TSS | " + getTimeStamp() 
            + " | TWITTER MESSAGE EVENT: " + msg.event
            + " | @" + threeceeUserObj.screenName
            + "\n" + jsonPrint(msg)
          ));
        }
      });

      threeceeUserObj.searchStream.on("follow", function(msg){
        console.log(chalkAlert("TSS | " + getTimeStamp() 
          + " | TWITTER FOLLOW EVENT"
          + " | @" + threeceeUserObj.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUserObj.searchStream.on("unfollow", function(msg){
        console.log(chalkAlert("TSS | " + getTimeStamp() 
          + " | TWITTER UNFOLLOW EVENT"
          + " | @" + threeceeUserObj.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUserObj.searchStream.on("user_update", function(msg){
        console.log(chalkAlert("TSS | " + getTimeStamp() 
          + " | TWITTER USER UPDATE EVENT"
          + " | @" + threeceeUserObj.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUserObj.searchStream.on("connect", function(){
        console.log(chalkTwitter("TSS | " + getTimeStamp()
          + " | TWITTER CONNECT"
          + " | @" + threeceeUserObj.screenName
        ));
        statsObj.twitter.connects += 1;
        threeceeUserObj.stats.connected = true;
        threeceeUserObj.stats.twitterConnects += 1;
        threeceeUserObj.stats.rateLimited = false;
        rateLimited = false;
        threeceeUserObj.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUserObj.searchStream.on("reconnect", function(data){

        if (data.type == "rate-limit") {
          threeceeUserObj.stats.rateLimited = true;
          rateLimited = true;
        }
        else {
          threeceeUserObj.stats.rateLimited = false;
          rateLimited = false;
        }

        console.log(chalkTwitter("TSS | " + getTimeStamp()
          + " | TWITTER RECONNECT"
          + " | RATE LIMIT: " + threeceeUserObj.stats.rateLimited
          + " | @" + threeceeUserObj.screenName
        ));

        statsObj.twitter.reconnects+= 1;

        threeceeUserObj.stats.connected = true;
        threeceeUserObj.stats.twitterReconnects += 1;
        threeceeUserObj.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUserObj.searchStream.on("disconnect", function(data){
        console.log(chalkAlert("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | !!! TWITTER DISCONNECT\n" + jsonPrint(data)
        ));
        statsObj.twitter.disconnects+= 1;
        threeceeUserObj.stats.connected = false;
        threeceeUserObj.stats.twitterReconnects = 0;
        threeceeUserObj.stats.rateLimited = false;
        rateLimited = false;
        threeceeUserObj.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUserObj.searchStream.on("warning", function(data){
        console.log(chalkAlert("TSS | " + getTimeStamp() + " | !!! TWITTER WARNING\n" + jsonPrint(data)));
        statsObj.twitter.warnings+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("direct_message", function (message) {
        console.log(chalkTwitter("TSS | R< TWITTER DIRECT MESSAGE"
          + " | @" + threeceeUserObj.screenName
          + " | " + message.direct_message.sender_screen_name
          + "\n" + message.direct_message.text
        ));
        showStats();
      });

      threeceeUserObj.searchStream.on("scrub_geo", function(data){
        console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER SCRUB GEO\n" + jsonPrint(data)));
        statsObj.twitter.scrubGeo+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("status_withheld", function(data){
        console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER STATUS WITHHELD\n" + jsonPrint(data)));
        statsObj.twitter.statusWithheld+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("user_withheld", function(data){
        console.log(chalkTwitter("TSS | " + getTimeStamp() + " | !!! TWITTER USER WITHHELD\n" + jsonPrint(data)));
        statsObj.twitter.userWithheld+= 1;
        showStats();
      });

      threeceeUserObj.searchStream.on("limit", function(limitMessage){

        statsObj.twitter.limit += limitMessage.limit.track;
        threeceeUserObj.stats.twitterLimit += limitMessage.limit.track;

        if (statsObj.twitter.limit > statsObj.twitter.limitMax) {
          statsObj.twitter.limitMax = statsObj.twitter.limit;
          statsObj.twitter.limitMaxTime = moment().valueOf();
        }

        if (configuration.verbose) {
          console.log(chalkTwitter("TSS | " + getTimeStamp()
            + " | TWITTER LIMIT" 
            + " | @" + threeceeUserObj.screenName
            + " | USER LIMIT: " + statsObj.twitter.limit
            + " | TOTAL LIMIT: " + threeceeUserObj.stats.twitterLimit
          ));
        }
      });

      threeceeUserObj.searchStream.on("error", function(err){

        console.log(chalkError("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | *** TWITTER ERROR: " + err
          + " | *** TWITTER ERROR\n" + jsonPrint(err)
        ));


        statsObj.twitter.errors += 1;
        threeceeUserObj.stats.twitterErrors += 1;

        threeceeUserObj.stats.ready = false;
        threeceeUserObj.stats.error = err;
        threeceeUserObj.stats.connected = false;
        threeceeUserObj.stats.authenticated = false;
        threeceeUserObj.stats.twitterTokenErrorFlag = true;

        const errorType = (err.statusCode == 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

        process.send({
          op: "ERROR", 
          threeceeUser: threeceeUserObj.screenName, 
          stats: threeceeUserObj.stats, 
          errorType: errorType, 
          error: err
        });
      });
      
      threeceeUserObj.searchStream.on("end", function(err){

        threeceeUserObj.searchStream.stop();

        console.log(chalkError("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | *** TWITTER END: " + err
        ));


        statsObj.twitter.errors += 1;
        threeceeUserObj.stats.twitterErrors += 1;

        if (err.statusCode == 401) {
          process.send({
            op: "ERROR", 
            threeceeUser: threeceeUserObj.screenName, 
            stats: threeceeUserObj.stats, 
            errorType: "TWITTER_UNAUTHORIZED", 
            error: err
          });
        }
        else {
          process.send({
            op: "ERROR", 
            threeceeUser: threeceeUserObj.screenName, 
            stats: threeceeUserObj.stats, 
            errorType: "TWITTER_END", 
            error: err
          });
        }
      });
      
      threeceeUserObj.searchStream.on("parser-error", function(err){

        console.log(chalkError("TSS | " + getTimeStamp()
          + " | @" + threeceeUserObj.screenName
          + " | *** TWITTER PARSER ERROR: " + err
        ));

        statsObj.twitter.errors += 1;
        threeceeUserObj.stats.twitterErrors += 1;

        process.send({
          op: "ERROR", 
          threeceeUser: threeceeUserObj.screenName, 
          stats: threeceeUserObj.stats, 
          errorType: "TWITTER_PARSER", 
          error: err
        });

        showStats();
      });

      let prevTweetUser;
      
      threeceeUserObj.searchStream.on("tweet", function(tweetStatus){

        if (filterRetweets && (tweetStatus.retweeted_status || tweetStatus.is_quote_status)){
          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX FILTER RETWEETS | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        if (tweetStatus.user.userId 
          && (tweetStatus.user.userId !== undefined) 
          && ignoreUserSet.has(tweetStatus.user.userId)){
          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX IGNORE USER | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        if (tweetStatus.user.location 
          && (tweetStatus.user.location !== undefined) 
          && ignoreLocationsRegEx.test(tweetStatus.user.location)){

          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX IGNORE LOCATION | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | LOC: " + tweetStatus.user.location
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        if (tweetStatus.user.lang 
          && (tweetStatus.user.lang !== undefined) 
          && (tweetStatus.user.lang != "en")){ 
          if (configuration.verbose) {
            console.log(chalkLog("TSS | XXX IGNORE LANG | SKIPPING"
              + " | TWID: " + tweetStatus.id_str
              + " | LANG: " + tweetStatus.user.lang
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        prevTweetUser = tweetIdCache.get(tweetStatus.id_str);

        if (prevTweetUser !== undefined) {
          duplicateTweetsReceived += 1;          
          if (filterDuplicateTweets) { return; }
        }

        tweetIdCache.set(tweetStatus.id_str, tweetStatus.user.screen_name);

        tweetStatus.entities.media = [];
        tweetStatus.entities.polls = [];
        tweetStatus.entities.symbols = [];
        tweetStatus.entities.urls = [];

        rateLimited = false;

        rateMeter.meter("tweetsPerSecond").mark();
        rateMeter.meter("tweetsPerMinute").mark();

        tweetsPerSecond = rateMeter.toJSON().tweetsPerSecond["1MinuteRate"];
        tweetsPerMinute = rateMeter.toJSON().tweetsPerMinute["1MinuteRate"];

        tweetsReceived+= 1;

        if (tweetStatus.retweeted_status) {
          retweetsReceived += 1;
        }

        if (tweetStatus.quoted_status) {
          quotedTweetsReceived += 1;
        }

        if (tweetQueue.length < maxTweetQueue ) {
          tweetQueue.push(tweetStatus);
        }
        else {
          fullEvents += 1;
        }

      });

    }
    catch(err){
      console.log(chalkError("TSS | CAUGHT ERROR | " + getTimeStamp()
        + " | @" + threeceeUserObj.screenName
        + " | *** TWITTER ERROR: " + err
        + " | *** TWITTER ERROR\n" + jsonPrint(err)
      ));

      statsObj.twitter.errors += 1;
      threeceeUserObj.stats.twitterErrors += 1;

      threeceeUserObj.stats.ready = false;
      threeceeUserObj.stats.error = err;
      threeceeUserObj.stats.connected = false;
      threeceeUserObj.stats.authenticated = false;
      threeceeUserObj.stats.twitterTokenErrorFlag = true;

      const errorType = (err.statusCode == 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

      process.send({
        op: "ERROR", 
        threeceeUser: threeceeUserObj.screenName, 
        stats: threeceeUserObj.stats, 
        errorType: errorType, 
        error: err
      });

      return reject(err);
    }

    resolve();

  });
}

async function initSetFromFile(params){

  statsObj.status = "INIT SET FROM FILE";

  console.log(chalkBlue("TSS | ... INIT SET FROM FILE: " + params.folder + "/" + params.file));

  try{

    const setObj = await tcUtils.loadFile({
      folder: params.folder, 
      file: params.file, 
      noErrorNotFound: params.noErrorNotFound
    });

    if (empty(setObj)) {
     console.log(chalkAlert("TSS | ??? NO ITEMS IN FILE ERROR ???"
        + " | " + params.folder + "/" + params.file
      ));

      if (params.errorOnNoItems) {
        throw new Error("NO ITEMS IN FILE: " + params.folder + "/" + params.file); 
      }
      return;
    }

    let fileSet;

    if (params.objArrayKey) {
      fileSet = new Set(setObj[params.objArrayKey]);
    }
    else{
      const itemArray = setObj.toString().toLowerCase().split("\n");
      fileSet = new Set(itemArray);
    }

    console.log(chalkLog("TSS | LOADED SET FROM FILE"
      + " | OBJ ARRAY KEY: " + params.objArrayKey
      + " | " + fileSet.size + " ITEMS"
      + " | " + params.folder + "/" + params.file
    ));

    return fileSet;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT SET FROM FILE ERROR: " + err));
    if (params.noErrorNotFound) {
      return;
    }
    throw err;
  }
}

async function initSearchTerms(params){

  console.log(chalkTwitter("TSS | INIT TERMS | @" + threeceeUserObj.screenName));

  try{

    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: params.searchTermsFile, 
      noErrorNotFound: true
    });

    if (result) {
      threeceeUserObj.searchTermSet = new Set([...result]);
      threeceeUserObj.searchTermSet.delete("");
      threeceeUserObj.searchTermSet.delete(" ");
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + threeceeUserObj.searchTermSet.size + " TOTAL SEARCH TERMS "));

    console.log(chalkLog("TSS | ADDING " + threeceeUserObj.followUserScreenNameSet.size + " SCREEN NAMES TO TRACK SET"));

    threeceeUserObj.searchTermSet = new Set([...threeceeUserObj.searchTermSet, ...threeceeUserObj.followUserScreenNameSet]);

    if (threeceeUserObj.searchTermSet.size == 0){
      console.log(chalkAlert("TSS | ??? NO SEACH TERMS |@" + threeceeUserObj.screenName));
      throw new Error("NO SEARCH TERMS");
    }

    console.log(chalk.blue("TSS | SEACH TERMS"
      + " | @" + threeceeUserObj.screenName 
      + " | " + threeceeUserObj.searchTermSet.size + " SEACH TERMS"
    ));

    return;

  }
  catch(err){
    console.log(chalkError("TSS | LOAD FILE ERROR\n" + err));
    throw err;
  }
}

async function initAllowLocations(){

  console.log(chalkTwitter("TSS | INIT ALLOW LOCATIONS | @" + threeceeUserObj.screenName));

  try{
    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: allowLocationsFile, 
      noErrorNotFound: true
    });

    if (result) {
      allowLocationsSet = new Set([...result]);
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + allowLocationsSet.size + " ALLOW LOCATIONS "));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT ALLOW LOCATIONS ERROR: " + err));
    throw err;
  }
}

async function initIgnoreLocations(){

  console.log(chalkTwitter("TSS | INIT IGNORE LOCATIONS | @" + threeceeUserObj.screenName));

  try{
    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: ignoreLocationsFile, 
      noErrorNotFound: true
    });

    if (result) {
      ignoreLocationsSet = new Set([...result]);
      ignoreLocationsArray = [...ignoreLocationsSet];
      ignoreLocationsString = ignoreLocationsArray.join('\\b|\\b');
      ignoreLocationsString = '\\b' + ignoreLocationsString + '\\b';
      ignoreLocationsRegEx = new RegExp(ignoreLocationsString, "gi");
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + ignoreLocationsSet.size + " IGNORE LOCATIONS "));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT IGNORE LOCATIONS ERROR: " + err));
    throw err;
  }
}

async function initIgnoreHashtags(){

  console.log(chalkTwitter("TSS | INIT IGNORE HASHTAGS | @" + threeceeUserObj.screenName));

  try{
    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: ignoredHashtagFile, 
      noErrorNotFound: true
    });

    if (result) {
      ignoredHashtagSet = new Set([...result]);
    }

    console.log(chalk.blue("TSS | FILE CONTAINS " + ignoredHashtagSet.size + " IGNORE HASHTAGS "));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT IGNORE HASHTAGS ERROR: " + err));
    throw err;
  }
}

async function initFollowableSearchTermSet(){

  statsObj.status = "INIT FOLLOWABLE SEARCH TERM SET";

  console.log(chalkBlue("TSS | INIT FOLLOWABLE SEARCH TERM SET: " + configDefaultFolder 
    + "/" + followableSearchTermFile
  ));

  try{

    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: followableSearchTermFile, 
      noErrorNotFound: true
    });

    if (result) {
      followableSearchTermSet = new Set([...result]);
      followableSearchTermSet.delete("");
      followableSearchTermSet.delete(" ");
    }

    console.log(chalkLog("TSS | LOADED FOLLOWABLE SEARCH TERMS FILE"
      + " | " + followableSearchTermSet.size + " SEARCH TERMS"
      + " | " + configDefaultFolder + "/" + followableSearchTermFile
    ));

    return;
  }
  catch(err){
    console.log(chalkError("TSS | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
    throw err;
  }
}

let searchTermsUpdateInterval;

async function initSearchTermsUpdateInterval(){

  clearInterval(searchTermsUpdateInterval);

  const interval = configuration.searchTermsUpdateInterval || DEFAULT_SEARCH_TERM_UPDATE_INTERVAL;

  searchTermsUpdateInterval = setInterval(async function(){
    console.log(chalkInfo("TSS | ... SEARCH TERM UPDATE | INTERVAL: " + msToTime(interval)));
    await initSearchTerms(configuration);
    await initSearchStream();

  }, interval);
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

      debug(chalkInfo(MODULE_ID_PREFIX + " | +++ FILE CREATED or CHANGED | " + getTimeStamp() + " | " + f));

      if (f.endsWith(followableSearchTermFile)){
        await initFollowableSearchTermSet();
        await initSearchTerms(configuration);
        await initSearchStream();
      }

      if (f.endsWith(allowLocationsFile)){
        await initAllowLocations();
      }

      if (f.endsWith(ignoreLocationsFile)){
        await initIgnoreLocations();
      }

      if (f.endsWith(ignoredHashtagFile)){
        await initIgnoreHashtags();
      }

    }
    catch(err){
      console.log(chalkError(MODULE_ID_PREFIX + " | *** LOAD ALL CONFIGS ON CREATE ERROR: " + err));
    }
  }

  watch.createMonitor(configDefaultFolder, watchOptions, function (monitor) {

    monitor.on("created", loadConfig);

    monitor.on("changed", loadConfig);

    monitor.on("removed", function (f) {
      console.log(chalkAlert(MODULE_ID_PREFIX + " | XXX FILE DELETED | " + getTimeStamp() + " | " + f));
    });
  });

  return;
}

async function initialize(cnf){

  console.log(chalkLog("TSS | TSS | INITIALIZE"
    + " | @" + cnf.threeceeUser
    // + "\n" + jsonPrint(cnf)
  ));

  if (debug.enabled || debugCache.enabled || debugQ.enabled){
    console.log("\nTSS | %%%%%%%%%%%%%%\nTSS | DEBUG ENABLED \nTSS | %%%%%%%%%%%%%%\n");
  }

  cnf.processName = process.env.TSS_PROCESS_NAME || "wa_node_tss";

  cnf.verbose = process.env.TSS_VERBOSE_MODE || false;
  cnf.globalTestMode = process.env.TSS_GLOBAL_TEST_MODE || false;
  cnf.testMode = process.env.TSS_TEST_MODE || false;
  cnf.quitOnError = process.env.TSS_QUIT_ON_ERROR || false;

  cnf.twitterQueueIntervalTime = process.env.TSS_TWITTER_QUEUE_INTERVAL || DEFAULT_TWITTER_QUEUE_INTERVAL;
  cnf.maxTweetQueue = process.env.TSS_MAX_TWEET_QUEUE || DEFAULT_MAX_TWEET_QUEUE;
  maxTweetQueue = cnf.maxTweetQueue;

  cnf.twitterConfigFolder = process.env.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER || "/config/twitter"; 
  cnf.twitterConfigFile = process.env.DROPBOX_TSS_DEFAULT_TWITTER_CONFIG_FILE 
    || "altthreecee00.json";

  cnf.statsUpdateIntervalTime = process.env.TSS_STATS_UPDATE_INTERVAL || 60000;

  debug(chalkWarn("TSS | dropboxConfigFolder: " + dropboxConfigFolder));
  debug(chalkWarn("TSS | dropboxConfigFile  : " + dropboxConfigFile));


  try {
    const loadedConfigObj = await tcUtils.loadFile({
      folder: configHostFolder, 
      file: dropboxConfigFile,
      noErrorNotFound: true
    }); 

    debug(dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

    if (loadedConfigObj.TSS_VERBOSE_MODE !== undefined){
      console.log("TSS | LOADED TSS_VERBOSE_MODE: " + loadedConfigObj.TSS_VERBOSE_MODE);
      cnf.verbose = loadedConfigObj.TSS_VERBOSE_MODE;
    }

    if (loadedConfigObj.TSS_GLOBAL_TEST_MODE !== undefined){
      console.log("TSS | LOADED TSS_GLOBAL_TEST_MODE: " + loadedConfigObj.TSS_GLOBAL_TEST_MODE);
      cnf.globalTestMode = loadedConfigObj.TSS_GLOBAL_TEST_MODE;
    }

    if (loadedConfigObj.TSS_TEST_MODE !== undefined){
      console.log("TSS | LOADED TSS_TEST_MODE: " + loadedConfigObj.TSS_TEST_MODE);
      cnf.testMode = loadedConfigObj.TSS_TEST_MODE;
    }

    if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER !== undefined){
      console.log("TSS | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " + loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER);
      cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
    }

    if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR !== undefined){
      console.log("TSS | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_DIR: " + loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR);
      cnf.searchTermsDir = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
    }

    if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE !== undefined){
      console.log("TSS | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_FILE: " + loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE);
      cnf.searchTermsFile = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
    }

    if (loadedConfigObj.TSS_STATS_UPDATE_INTERVAL !== undefined) {
      console.log("TSS | LOADED TSS_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TSS_STATS_UPDATE_INTERVAL);
      cnf.statsUpdateIntervalTime = loadedConfigObj.TSS_STATS_UPDATE_INTERVAL;
    }

    if (loadedConfigObj.TSS_MAX_TWEET_QUEUE !== undefined) {
      console.log("TSS | LOADED TSS_MAX_TWEET_QUEUE: " + loadedConfigObj.TSS_MAX_TWEET_QUEUE);
      cnf.maxTweetQueue = loadedConfigObj.TSS_MAX_TWEET_QUEUE;
      maxTweetQueue = cnf.maxTweetQueue;
    }

    // OVERIDE CONFIG WITH COMMAND LINE ARGS

    const configArgs = Object.keys(cnf);

    if (cnf.verbose) {
      configArgs.forEach(function(arg){
        console.log("TSS | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });
    }

    await initStatsUpdate(cnf);

    return cnf;

  }
  catch(err){
    console.log("TSS | TSS | *** ERROR LOAD CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
    throw err;
  }
}

function initTwitterQueue(cnf, callback){

  console.log(chalkTwitter("TSS | INIT TWITTER QUEUE INTERVAL: " + cnf.twitterQueueIntervalTime));

  const interval = cnf.twitterQueueIntervalTime;

  clearInterval(tweetQueueInterval);

  let prevTweetId = "";
  let tweetStatus;

  tweetQueueInterval = setInterval(function () {

    if (tweetSendReady && (tweetQueue.length > 0)) {

      tweetSendReady = false;
      tweetStatus = tweetQueue.shift();

      if (tweetStatus.id_str != prevTweetId) {
        process.send({op: "TWEET", tweet: tweetStatus});
        prevTweetId = tweetStatus.id_str;
        tweetSendReady = true;
      }
      else {
        tweetSendReady = true;
      }
    }
  }, interval);

  if (callback) { callback(); }
}

function initTwitterSearch(cnf){

  return new Promise(function(resolve){

    twitterSearchInit = true;

    console.log(chalkTwitter("TSS | INIT TWITTER SEARCH"));

    initTwitterQueue(cnf);

    console.log(chalkTwitter("TSS | " + getTimeStamp() 
      + " | ENABLE TWEET STREAM"
    ));

    resolve();

  });
}

let followQueueInterval;
let followQueueReady = false;
const followQueue = [];

async function initFollowQueue(params){

  try {

    const interval = params.interval;

    console.log(chalkTwitter("TSS"
      + " | FOLLOW QUEUE INTERVAL: " + interval
    ));

    clearInterval(followQueueInterval);

    let followObj;
    const createParams = {};
    createParams.following = true;

    followQueueReady = true;

    followQueueInterval = setInterval(function () {

      if (followQueueReady && (followQueue.length > 0)) {

        followQueueReady = false;

        followObj = followQueue.shift();

        createParams.screen_name = followObj.user.screenName || null;
        createParams.user_id = followObj.user.userId || null;

        statsObj.queues.followQueue.size = followQueue.length;

        console.log(chalkTwitter("TSS | --> TWITTER FOLLOW"
          + " | @" + followObj.user.screenName
          + " | UID: " + followObj.user.userId
        ));

        threeceeUserObj.twitStream.post("friendships/create", createParams, function(err, data, response) {

          if (err){

            console.log(chalkError("TSS | *** TWITTER FOLLOW ERROR"
              + " | @" + threeceeUserObj.screenName
              + " | ERROR CODE: " + err.code
              + " | ERROR: " + err
            ));

            if (configuration.verbose) {
              console.log(chalkError("TSS | *** TWITTER FOLLOW ERROR"
                + " | @" + threeceeUserObj.screenName
                + "\nresponse\n" + jsonPrint(response)
              ));
            }

            if (err.code == 161) {
              followQueue.length = 0;
            }

            const errorType = (err.code == 161) ? "TWITTER_FOLLOW_LIMIT" : "TWITTER_FOLLOW";

            process.send({
              op: "ERROR", 
              threeceeUser: threeceeUserObj.screenName, 
              stats: threeceeUserObj.stats, 
              errorType: errorType, 
              error: err
            });

          }
          else {
            console.log(chalk.green("TSS | +++ TWITTER FOLLOWING"
              + " | @" + data.screen_name
              + " | ID: " + data.id_str
              + " | " + data.name
            ));

            threeceeUserObj.followUserIdSet.add(data.id_str);

            followQueueReady = true;
          }
        });
      }

    }, interval);

    return;

  }
  catch(err){
    console.log(chalkError("TSS | *** TWIT INIT FOLLOW ERROR"
      + " | @" + threeceeUserObj.screenName
      + " | " + getTimeStamp()
      + " | " + err
    ));
    throw err;
  }
}

process.on("message", async function(m) {

  console.log(chalkLog("TSS | RX MESSAGE"
    + " | OP: " + m.op
  ));

  let authObj;
  let authObjNew;
  let twitterConfigFile;

  switch (m.op) {

    case "QUIT":
      console.log(chalkAlert("TSS | QUIT"));
      quit("PARENT QUIT");
    break;

    case "VERBOSE":
      console.log(chalkAlert("TSS | VERBOSE"));
      configuration.verbose = m.verbose;
    break;

    case "INIT":

      process.title = m.title;

      configuration.threeceeUser = m.threeceeUser;
      threeceeUserObj.screenName = m.threeceeUser;

      configuration.filterDuplicateTweets = m.filterDuplicateTweets;
      filterDuplicateTweets = m.filterDuplicateTweets;
      
      configuration.filterRetweets = m.filterRetweets;
      filterRetweets = m.filterRetweets;
      
      configuration.twitterQueueIntervalTime = m.interval;
      configuration.verbose = m.verbose;
      configuration.testMode = m.testMode;

      threeceeUserObj.twitterConfig = m.twitterConfig;

      console.log(chalkInfo("TSS | INIT"
        + " | TITLE: " + m.title
        + " | 3C USER @" + configuration.threeceeUser
        + "\nCONFIGURATION\n" + jsonPrint(configuration)
        + "\nTWITTER CONFIG\n" + jsonPrint(m.twitterConfig)
      ));

      try {
        await tcUtils.setThreeceeUser(configuration.threeceeUser);
        await initFollowableSearchTermSet();
        await initAllowLocations();
        await initIgnoreLocations();
        await initIgnoreHashtags();
        await initTwitterUser();
        await initSearchTerms(configuration);
        await initSearchStream();
        await initTwitterSearch(configuration);
        await initFollowQueue({interval: configuration.followQueueIntervalTime});
      }
      catch(err){
        console.log(chalkError("TSS | *** INIT ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "USER_AUTHENTICATED":

      if (m.user.screenName != threeceeUserObj.screenName) {
        console.log(chalkInfo("TSS | USER_AUTHENTICATED | USER MISS"
          + " | CHILD 3C @" + threeceeUserObj.screenName
          + " | AUTH USER @" + m.user.screenName
          + " | UID: " + m.user.userId
          // + " | TOKEN: " + m.token
          // + " | TOKEN SECRET: " + m.tokenSecret
        ));
        break;
      }

      console.log(chalkInfo("TSS | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      authObj = threeceeUserObj.twitStream.getAuth();

      console.log(chalkLog("TSS | CURRENT AUTH\n" + jsonPrint(authObj)));

      threeceeUserObj.twitStream.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

      authObjNew = threeceeUserObj.twitStream.getAuth();

      threeceeUserObj.twitterConfig.token = authObjNew.access_token;
      threeceeUserObj.twitterConfig.token_secret = authObjNew.access_token_secret;

      threeceeUserObj.twitterConfig.access_token = authObjNew.access_token;
      threeceeUserObj.twitterConfig.access_token_secret = authObjNew.access_token_secret;
      
      threeceeUserObj.twitterConfig.TOKEN = authObjNew.access_token;
      threeceeUserObj.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

      console.log(chalkError("TSS | UPDATED AUTH\n" + jsonPrint(authObjNew)));

      twitterConfigFile = threeceeUserObj.screenName + ".json";

      await tcUtils.saveFile({localFlag: true, folder: twitterConfigFolder, file: twitterConfigFile, obj: threeceeUserObj.twitterConfig});

      console.log(chalkLog("TSS | SAVED UPDATED AUTH " + twitterConfigFolder + "/" + twitterConfigFile));

      threeceeUserObj.stats.connected = true;
      threeceeUserObj.stats.twitterFollowLimit = false;

      const twitGetFriendsParams = {
        screen_name: threeceeUserObj.screenName,
        stringify_ids: true
      };

      try{
        const data = await twitStreamPromise({resource: "friends", endPoint: "ids", twitParams: twitGetFriendsParams});

        if (!data || data == undefined) {

          threeceeUserObj.stats.error = false;
          threeceeUserObj.stats.authenticated = true;

          console.log(chalkAlert("TSS | !!! EMPTY TWITTER GET FRIENDS IDS"
            + " | @" + threeceeUserObj.screenName
            + " | followUserIdSet: " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
          ));

          if (threeceeUserObj.followUserIdSet.size === 0){
            return;
          }
        }
        else{
          threeceeUserObj.stats.error = false;
          threeceeUserObj.stats.authenticated = true;
          threeceeUserObj.followUserIdSet = new Set(data.ids);
        }

        console.log(chalkTwitter("TSS | TWITTER GET FRIENDS IDS"
          + " | @" + threeceeUserObj.screenName
          + " | " + threeceeUserObj.followUserIdSet.size + " FRIENDS"
        ));

        await initSearchTerms(configuration);
        await initSearchStream();

        console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUserObj.screenName));

        if (!twitterSearchInit) { 
          await initTwitterSearch(configuration);
        }

        process.send({
          op: "TWITTER_STATS", 
          threeceeUser: threeceeUserObj.screenName,
          twitterConfig: threeceeUserObj.twitterConfig,
          stats: threeceeUserObj.stats, 
          twitterFollowing: threeceeUserObj.followUserIdSet.size,
          twitterFriends: [...threeceeUserObj.followUserIdSet]
        });

      }
      catch(err){
        console.log(chalkError("TSS | *** USER AUTHENTICATE ERROR: " + err));
      }

    break;

    case "FOLLOW":
      console.log(chalkInfo("TSS | FOLLOW"
        + " | 3C @" + threeceeUserObj.screenName
        + " | UID " + m.user.userId
        + " | @" + m.user.screenName
        + " | FORCE FOLLOW: " + m.forceFollow
      ));

      if (m.forceFollow !== undefined) { configuration.forceFollow = m.forceFollow; }

      followQueue.push(m);
    break;

    case "UNFOLLOW":
      console.log(chalkInfo("TSS | UNFOLLOW"
        // + " [Q: " + unfollowQueue.length + "]"
        + " 3C @" + threeceeUserObj.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "UNFOLLOW_ID_ARRAY":
    break;

    case "IGNORE":
      console.log(chalkInfo("TSS | TSS > IGNORE"
        + " | 3C @" + threeceeUserObj.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
      ignoreUserSet.add(m.user.userId);
    break;

    case "UPDATE_ALLOW_LOCATIONS":
      console.log(chalkLog("TSS | UPDATE ALLOW LOCATIONS"));

      try {
        await initAllowLocations(configuration);
      }
      catch(err){
        console.log(chalkError("TSS | *** UPDATE_ALLOW_LOCATIONS ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "UPDATE_IGNORE_LOCATIONS":
      console.log(chalkLog("TSS | UPDATE IGNORE LOCATIONS"));

      try {
        await initIgnoreLocations();
      }
      catch(err){
        console.log(chalkError("TSS | *** UPDATE_IGNORE_LOCATIONS ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "UPDATE_SEARCH_TERMS":
      console.log(chalkLog("TSS | UPDATE SEARCH TERMS"));

      try{

        await initSearchTerms(configuration);
        await initSearchStream();

        console.log(chalkInfo("TSS | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUserObj.screenName));

        if (!twitterSearchInit) { await initTwitterSearch(configuration); }

        process.send({
          op: "TWITTER_STATS", 
          threeceeUser: threeceeUserObj.screenName, 
          stats: threeceeUserObj.stats, 
          twitterFollowing: threeceeUserObj.followUserIdSet.size,
          twitterFriends: [...threeceeUserObj.followUserIdSet]
        });
      }
      catch(err){
        process.send({
          op: "TWITTER_ERROR", 
          threeceeUser: threeceeUserObj.screenName, 
          err: err
        });
      }
    break;

    case "PING":
      debug(chalkLog("TSS | TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){

        process.send({ 
          op: "PONG",
          pongId: m.pingId
        });

      }, 1000);
    break;

    default:
      console.log(chalkError("TSS | *** TSS UNKNOWN OP"
        + " | 3C @" + threeceeUserObj.screenName
        + " | INTERVAL: " + m.op
      ));
  }
});

process.on("unhandledRejection", function(err, promise) {
  console.trace(MODULE_ID_PREFIX + " | *** Unhandled rejection (promise: ", promise, ", reason: ", err, ").");
  quit("unhandledRejection");
  // process.exit(1);
});

setTimeout(async function(){

  console.log("TSS | TSS | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");

  try {

    try{
      configuration = await initialize(configuration);
    }
    catch(err){
      if (err.status != 404) {
        console.log(chalkError("TSS | *** INIT ERROR\n" + jsonPrint(err)));
        quit();
      }
      console.log(chalkError("TSS | TSS | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
    }

    await initWatchConfig();
    await initSearchTermsUpdateInterval();
    process.send({ op: "READY"});
  }
  catch(err){
    console.log(chalkError("TSS | TSS | *** ERROR: " + err + " | QUITTING ***"));
    quit("INITIALIZE ERROR");
  }
}, ONE_SECOND);
