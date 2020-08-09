const MODULE_ID_PREFIX = "TSS";

const ignoredProfileWordsFile = "ignoredProfileWords.txt";
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
console.log(MODULE_ID_PREFIX + " | USER CACHE TTL: " + tweetIdCacheTtl + " SECONDS");

let tweetIdCacheCheckPeriod = process.env.TWEET_ID_CACHE_CHECK_PERIOD;
if (tweetIdCacheCheckPeriod === undefined) { tweetIdCacheCheckPeriod = TWEET_ID_CACHE_CHECK_PERIOD; }
console.log(MODULE_ID_PREFIX + " | USER CACHE CHECK PERIOD: " + tweetIdCacheCheckPeriod + " SECONDS");

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

let ignoredProfileWordsSet = new Set();
ignoredProfileWordsSet.add("nsfw");
ignoredProfileWordsSet.add("18+");
let ignoredProfileWordsArray = [...ignoredProfileWordsSet];

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

const threeceeUser = {};

// ??? KLUDGE: DON'T HARD CODE CREDENTIALS!! SECURITY RISK
threeceeUser.twitterConfig = {};
threeceeUser.twitterConfig.screenName = "altthreecee00";
threeceeUser.twitterConfig.CONSUMER_KEY = "ex0jSXayxMOjNm4DZIiic9Nc0";
threeceeUser.twitterConfig.consumer_key = "ex0jSXayxMOjNm4DZIiic9Nc0";
threeceeUser.twitterConfig.CONSUMER_SECRET = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa";
threeceeUser.twitterConfig.consumer_secret = "I3oGg27QcNuoReXi1UwRPqZsaK7W4ZEhTCBlNVL8l9GBIjgnxa";
threeceeUser.twitterConfig.TOKEN = "848591649575927810-2MYMejf0VeXwMkQELca6uDqXUkfxKow";
threeceeUser.twitterConfig.access_token = "848591649575927810-2MYMejf0VeXwMkQELca6uDqXUkfxKow";
threeceeUser.twitterConfig.TOKEN_SECRET = "NL5UBvP2QFPH9fYe7MUZleH24RoMoErfbDTrJNglrEidB";
threeceeUser.twitterConfig.access_token_secret = "NL5UBvP2QFPH9fYe7MUZleH24RoMoErfbDTrJNglrEidB";

threeceeUser.screenName = "altthreecee00";

threeceeUser.stats = {};
threeceeUser.stats.ready = false;
threeceeUser.stats.error = false;
threeceeUser.stats.connected = false;
threeceeUser.stats.authenticated = false;
threeceeUser.stats.twitterTokenErrorFlag = false;

threeceeUser.stats.tweetsReceived = 0;
let tweetsReceived = 0;

threeceeUser.stats.retweetsReceived = 0;
let retweetsReceived = 0;

threeceeUser.stats.quotedTweetsReceived = 0;
let quotedTweetsReceived = 0;

threeceeUser.stats.twitterConnects = 0;
threeceeUser.stats.twitterReconnects = 0;
threeceeUser.stats.twitterFollowLimit = false;
threeceeUser.stats.twitterLimit = 0;
threeceeUser.stats.twitterErrors = 0;
threeceeUser.stats.rateLimited = false;
let rateLimited = false;
threeceeUser.stats.tweetsPerSecond = 0;
let tweetsPerSecond = 0;
threeceeUser.stats.tweetsPerMinute = 0;
let tweetsPerMinute = 0;

threeceeUser.rateLimit = {};

const rateMeter = Measured.createCollection();

rateMeter.meter("tweetsPerSecond", {rateUnit: 1000, tickInterval: 1000});
rateMeter.meter("tweetsPerMinute", {rateUnit: 60000, tickInterval: 1000});

threeceeUser.trackingNumber = 0;

threeceeUser.followUserScreenNameSet = new Set();
threeceeUser.followUserIdSet = new Set();
threeceeUser.searchTermSet = new Set();

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

statsObj.tweets = {};
statsObj.tweets.total = 0;

statsObj.filtered = {};
statsObj.filtered.users = 0;
statsObj.filtered.words = 0;
statsObj.filtered.languages = 0;
statsObj.filtered.locations = 0;
statsObj.filtered.retweets = 0;

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

console.log(MODULE_ID_PREFIX + " | DROPBOX_TSS_CONFIG_FILE: " + DROPBOX_TSS_CONFIG_FILE);

debug(MODULE_ID_PREFIX + " | dropboxConfigFolder : " + dropboxConfigFolder);
debug(MODULE_ID_PREFIX + " | dropboxConfigFile : " + dropboxConfigFile);

function showStats(options){

  threeceeUser.stats.rateLimited = rateLimited;

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
    console.log(chalk.blue(MODULE_ID_PREFIX + " | NEW MAX TPM"
      + " | " + moment().format(compactDateTimeFormat)
      + " | " + statsObj.tweetsPerMinute.toFixed(0)
    ));
  }

  if (options) {
    console.log(MODULE_ID_PREFIX + " | STATS\n" + jsonPrint(statsObj));

    console.log(MODULE_ID_PREFIX + " | @" + threeceeUser.screenName
      + " | TRACKING SEARCH TERMS: " + threeceeUser.searchTermSet.size
    );

    console.log(chalkLog(MODULE_ID_PREFIX + " | @" + threeceeUser.screenName
      + " | FOLLOW USER ID SET: " + threeceeUser.followUserIdSet.size
    ));

  }
  else {
    console.log(chalkLog(MODULE_ID_PREFIX + " | S"
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

    console.log(chalkLog(MODULE_ID_PREFIX + " | @" + threeceeUser.screenName
      + " | TRACKING SEARCH TERMS: " + threeceeUser.searchTermSet.size
    ));

    console.log(chalkLog(MODULE_ID_PREFIX + " | @" + threeceeUser.screenName
      + " | FOLLOW USER ID SET: " + threeceeUser.followUserIdSet.size
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

  console.log(MODULE_ID_PREFIX + " | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TSS CHILD: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );

  // if (dbConnection !== undefined) {

  //   dbConnection.close(function () {
  //     console.log(chalkAlert(
  //           MODULE_ID_PREFIX + " | =========================="
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

    console.log(chalkInfo(MODULE_ID_PREFIX + " | TSS | initStatsUpdate | INTERVAL: " + cnf.statsUpdateIntervalTime));

    try{

      setInterval(async function () {

        statsObj.elapsed = moment().valueOf() - statsObj.startTime;
        statsObj.timeStamp = moment().format(defaultDateTimeFormat);

        threeceeUser.stats.rateLimited = rateLimited;

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
          console.log(chalk.blue(MODULE_ID_PREFIX + " | NEW MAX TPM"
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

    threeceeUser.twitStream.get(resourceEndpoint, params.twitParams, async function(err, data, response) {

      if (err){
        console.log(chalkError(MODULE_ID_PREFIX + " | *** TWITTER STREAM ERROR"
          + " | @" + threeceeUser.screenName
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

              console.log(chalkError(MODULE_ID_PREFIX + " | -X- TWITTER STREAM RATE LIMIT END"
                + " | @" + threeceeUser.screenName
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
          console.log(MODULE_ID_PREFIX + " | response\n" + jsonPrint(response));
        }

        threeceeUser.stats.error = err;
        threeceeUser.stats.twitterErrors += 1;

        return reject(err);
      }

      threeceeUser.stats.error = false;
      threeceeUser.stats.twitterTokenErrorFlag = false;

      resolve(data);

    });
  });

}

async function initFollowUserIdSet(){

  process.send({
    op: "TWITTER_STATS", 
    threeceeUser: threeceeUser.screenName, 
    stats: threeceeUser.stats, 
    twitterFollowing: threeceeUser.followUserIdSet.size,
    twitterFriends: [...threeceeUser.followUserIdSet]
  });

  return threeceeUser;

}

async function initTwit(){

  console.log(chalkLog(MODULE_ID_PREFIX + " | INIT TWIT USER @" + threeceeUser.screenName));

  console.log(chalkInfo(MODULE_ID_PREFIX + " | INIT TWIT | TWITTER CONFIG " 
    + "\n" + jsonPrint(threeceeUser.twitterConfig)
  ));

  threeceeUser.stats = {};
  threeceeUser.stats.ready = false;
  threeceeUser.stats.error = false;
  threeceeUser.stats.connected = false;
  threeceeUser.stats.authenticated = false;
  threeceeUser.stats.twitterTokenErrorFlag = false;
  threeceeUser.stats.tweetsReceived = 0;
  threeceeUser.stats.retweetsReceived = 0;
  threeceeUser.stats.quotedTweetsReceived = 0;
  threeceeUser.stats.twitterConnects = 0;
  threeceeUser.stats.twitterReconnects = 0;
  threeceeUser.stats.twitterFollowLimit = false;
  threeceeUser.stats.twitterLimit = 0;
  threeceeUser.stats.twitterErrors = 0;
  threeceeUser.stats.rateLimited = false;
  rateLimited = false;
  threeceeUser.stats.tweetsPerSecond = 0;
  threeceeUser.stats.tweetsPerMinute = 0;

  threeceeUser.stats.twitterRateLimit = 0;
  threeceeUser.stats.twitterRateLimitRemaining = 0;
  threeceeUser.stats.twitterRateLimitResetAt = 0;
  threeceeUser.stats.twitterRateLimitRemainingTime = 0;
  threeceeUser.stats.twitterRateLimitExceptionFlag = false;

  threeceeUser.trackingNumber = 0;

  threeceeUser.followUserScreenNameSet = new Set();
  threeceeUser.followUserIdSet = new Set();

  const newTwitStream = new Twit({
    consumer_key: threeceeUser.twitterConfig.CONSUMER_KEY,
    consumer_secret: threeceeUser.twitterConfig.CONSUMER_SECRET,
    access_token: threeceeUser.twitterConfig.TOKEN,
    access_token_secret: threeceeUser.twitterConfig.TOKEN_SECRET
  });

  threeceeUser.twitStream = {};
  threeceeUser.twitStream = newTwitStream;

  threeceeUser.searchStream = false;
  threeceeUser.searchTermSet = new Set();

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT TWITTER USER"
    + " | NAME: " + threeceeUser.screenName
  ));

  const twitGetFriendsParams = {
    screen_name: threeceeUser.screenName,
    stringify_ids: true
  };

  try {

    await tcUtils.initTwitter(threeceeUser);

    const data = await twitStreamPromise({resource: "friends", endPoint: "ids", twitParams: twitGetFriendsParams});

    threeceeUser.stats.error = false;
    threeceeUser.stats.authenticated = true;
    threeceeUser.stats.twitterTokenErrorFlag = false;

    if (!data || data == undefined) {

      console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! EMPTY TWITTER GET FRIENDS IDS"
        + " | @" + threeceeUser.screenName
        + " | followUserIdSet: " + threeceeUser.followUserIdSet.size + " FRIENDS"
      ));

      if (threeceeUser.followUserIdSet.size === 0){
        return;
      }
    }
    else{
      threeceeUser.followUserIdSet = new Set(data.ids);
    }

    console.log(chalkTwitter(MODULE_ID_PREFIX + " | TWITTER GET FRIENDS IDS"
      + " | @" + threeceeUser.screenName
      + " | " + threeceeUser.followUserIdSet.size + " FRIENDS"
    ));

    await initFollowUserIdSet();

    return;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** TWITTER GET FRIENDS IDS ERROR | NOT AUTHENTICATED"
      + " | @" + threeceeUser.screenName
      + " | " + getTimeStamp()
      + " | CODE: " + err.code
      + " | STATUS CODE: " + err.statusCode
      + " | " + err.message
    ));

    threeceeUser.stats.error = err;
    threeceeUser.stats.twitterErrors += 1;
    threeceeUser.stats.authenticated = false;

    throw err;
  }
}

async function initTwitterUser(){

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | TWITTER USER: @" + threeceeUser.screenName));

  try {
    await initTwit();
    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** TWIT INIT ERROR"
      + " | @" + threeceeUser.screenName
      + " | " + getTimeStamp()
      + " | " + err
    ));
    throw err;
  }
}

function initSearchStream(){

  return new Promise(function(resolve, reject){

    const filter = {};

    filter.follow = [...threeceeUser.followUserIdSet];

    filter.track = [];

    if (threeceeUser.searchTermSet.size > 0) {
      if (threeceeUser.searchTermSet.size <= TWITTER_MAX_TRACKING_NUMBER){
        filter.track = [...threeceeUser.searchTermSet];
      }
      else{
        const searchTermArray = _.shuffle([...threeceeUser.searchTermSet]);
        filter.track = searchTermArray.slice(0,TWITTER_MAX_TRACKING_NUMBER);
      }
    }

    console.log(chalkInfo(MODULE_ID_PREFIX + " | INIT SEARCH STREAM"
      + " | @" + threeceeUser.screenName
      + " | SEARCH TERMS: " + threeceeUser.searchTermSet.size
      + " | FILTER TRACK SIZE: " + filter.track.length
      + " | FILTER FOLLOW SIZE: " + filter.follow.length
    ));

    try {

      if (threeceeUser.searchStream) {
        console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! RESTARTING TWITTER SEARCH STREAM"));
        threeceeUser.searchStream.stop();
      }

      threeceeUser.searchStream = {};

      threeceeUser.searchStream = threeceeUser.twitStream.stream("statuses/filter", filter);

      threeceeUser.searchStream.on("message", function(msg){
        if (msg.event) {
          console.log(chalkAlert(MODULE_ID_PREFIX + " | " + getTimeStamp() 
            + " | TWITTER MESSAGE EVENT: " + msg.event
            + " | @" + threeceeUser.screenName
            + "\n" + jsonPrint(msg)
          ));
        }
      });

      threeceeUser.searchStream.on("follow", function(msg){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | " + getTimeStamp() 
          + " | TWITTER FOLLOW EVENT"
          + " | @" + threeceeUser.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUser.searchStream.on("unfollow", function(msg){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | " + getTimeStamp() 
          + " | TWITTER UNFOLLOW EVENT"
          + " | @" + threeceeUser.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUser.searchStream.on("user_update", function(msg){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | " + getTimeStamp() 
          + " | TWITTER USER UPDATE EVENT"
          + " | @" + threeceeUser.screenName
          + "\n" + jsonPrint(msg)
        ));
      });

      threeceeUser.searchStream.on("connect", function(){
        console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp()
          + " | TWITTER CONNECT"
          + " | @" + threeceeUser.screenName
        ));
        statsObj.twitter.connects += 1;
        threeceeUser.stats.connected = true;
        threeceeUser.stats.twitterConnects += 1;
        threeceeUser.stats.rateLimited = false;
        rateLimited = false;
        threeceeUser.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUser.searchStream.on("reconnect", function(data){

        if (data.type == "rate-limit") {
          threeceeUser.stats.rateLimited = true;
          rateLimited = true;
        }
        else {
          threeceeUser.stats.rateLimited = false;
          rateLimited = false;
        }

        console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp()
          + " | TWITTER RECONNECT"
          + " | RATE LIMIT: " + threeceeUser.stats.rateLimited
          + " | @" + threeceeUser.screenName
        ));

        statsObj.twitter.reconnects+= 1;

        threeceeUser.stats.connected = true;
        threeceeUser.stats.twitterReconnects += 1;
        threeceeUser.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUser.searchStream.on("disconnect", function(data){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | " + getTimeStamp()
          + " | @" + threeceeUser.screenName
          + " | !!! TWITTER DISCONNECT\n" + jsonPrint(data)
        ));
        statsObj.twitter.disconnects+= 1;
        threeceeUser.stats.connected = false;
        threeceeUser.stats.twitterReconnects = 0;
        threeceeUser.stats.rateLimited = false;
        rateLimited = false;
        threeceeUser.stats.twitterTokenErrorFlag = false;
        showStats();
      });

      threeceeUser.searchStream.on("warning", function(data){
        console.log(chalkAlert(MODULE_ID_PREFIX + " | " + getTimeStamp() + " | !!! TWITTER WARNING\n" + jsonPrint(data)));
        statsObj.twitter.warnings+= 1;
        showStats();
      });

      threeceeUser.searchStream.on("direct_message", function (message) {
        console.log(chalkTwitter(MODULE_ID_PREFIX + " | R< TWITTER DIRECT MESSAGE"
          + " | @" + threeceeUser.screenName
          + " | " + message.direct_message.sender_screen_name
          + "\n" + message.direct_message.text
        ));
        showStats();
      });

      threeceeUser.searchStream.on("scrub_geo", function(data){
        console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp() + " | !!! TWITTER SCRUB GEO\n" + jsonPrint(data)));
        statsObj.twitter.scrubGeo+= 1;
        showStats();
      });

      threeceeUser.searchStream.on("status_withheld", function(data){
        console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp() + " | !!! TWITTER STATUS WITHHELD\n" + jsonPrint(data)));
        statsObj.twitter.statusWithheld+= 1;
        showStats();
      });

      threeceeUser.searchStream.on("user_withheld", function(data){
        console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp() + " | !!! TWITTER USER WITHHELD\n" + jsonPrint(data)));
        statsObj.twitter.userWithheld+= 1;
        showStats();
      });

      threeceeUser.searchStream.on("limit", function(limitMessage){

        statsObj.twitter.limit += limitMessage.limit.track;
        threeceeUser.stats.twitterLimit += limitMessage.limit.track;

        if (statsObj.twitter.limit > statsObj.twitter.limitMax) {
          statsObj.twitter.limitMax = statsObj.twitter.limit;
          statsObj.twitter.limitMaxTime = moment().valueOf();
        }

        if (configuration.verbose) {
          console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp()
            + " | TWITTER LIMIT" 
            + " | @" + threeceeUser.screenName
            + " | USER LIMIT: " + statsObj.twitter.limit
            + " | TOTAL LIMIT: " + threeceeUser.stats.twitterLimit
          ));
        }
      });

      threeceeUser.searchStream.on("error", function(err){

        console.log(chalkError(MODULE_ID_PREFIX + " | " + getTimeStamp()
          + " | @" + threeceeUser.screenName
          + " | *** TWITTER ERROR: " + err
          + " | *** TWITTER ERROR\n" + jsonPrint(err)
        ));


        statsObj.twitter.errors += 1;
        threeceeUser.stats.twitterErrors += 1;

        threeceeUser.stats.ready = false;
        threeceeUser.stats.error = err;
        threeceeUser.stats.connected = false;
        threeceeUser.stats.authenticated = false;
        threeceeUser.stats.twitterTokenErrorFlag = true;

        const errorType = (err.statusCode == 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

        process.send({
          op: "ERROR", 
          threeceeUser: threeceeUser.screenName, 
          stats: threeceeUser.stats, 
          errorType: errorType, 
          error: err
        });
      });
      
      threeceeUser.searchStream.on("end", function(err){

        threeceeUser.searchStream.stop();

        console.log(chalkError(MODULE_ID_PREFIX + " | " + getTimeStamp()
          + " | @" + threeceeUser.screenName
          + " | *** TWITTER END: " + err
        ));


        statsObj.twitter.errors += 1;
        threeceeUser.stats.twitterErrors += 1;

        if (err.statusCode == 401) {
          process.send({
            op: "ERROR", 
            threeceeUser: threeceeUser.screenName, 
            stats: threeceeUser.stats, 
            errorType: "TWITTER_UNAUTHORIZED", 
            error: err
          });
        }
        else {
          process.send({
            op: "ERROR", 
            threeceeUser: threeceeUser.screenName, 
            stats: threeceeUser.stats, 
            errorType: "TWITTER_END", 
            error: err
          });
        }
      });
      
      threeceeUser.searchStream.on("parser-error", function(err){

        console.log(chalkError(MODULE_ID_PREFIX + " | " + getTimeStamp()
          + " | @" + threeceeUser.screenName
          + " | *** TWITTER PARSER ERROR: " + err
        ));

        statsObj.twitter.errors += 1;
        threeceeUser.stats.twitterErrors += 1;

        process.send({
          op: "ERROR", 
          threeceeUser: threeceeUser.screenName, 
          stats: threeceeUser.stats, 
          errorType: "TWITTER_PARSER", 
          error: err
        });

        showStats();
      });

      let prevTweetUser;
      
      threeceeUser.searchStream.on("tweet", function(tweetStatus){

        statsObj.tweets.total += 1;

        if (filterRetweets && (tweetStatus.retweeted_status || tweetStatus.is_quote_status)){

          statsObj.filtered.retweets += 1;

          if (configuration.verbose) {
            console.log(chalkLog(MODULE_ID_PREFIX + " | XXX FILTER RETWEETS | SKIPPING"
              + " [" + statsObj.filtered.retweets + "]"
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

          statsObj.filtered.users += 1;

          if (configuration.verbose) {
            console.log(chalkLog(MODULE_ID_PREFIX + " | XXX IGNORE USER | SKIPPING"
              + " [" + statsObj.filtered.users + "]"
              + " | TWID: " + tweetStatus.id_str
              + " | UID: " + tweetStatus.user.id_str
              + " | @" + tweetStatus.user.screen_name
              + " | NAME: " + tweetStatus.user.name
            ));
          }
          return;
        }

        // if (substrings.some(v => str.includes(v))) {
        //     // There's at least one
        // }

        if (tweetStatus.user.description && (tweetStatus.user.description !== undefined)) {
          
          if(ignoredProfileWordsArray.some((word) => tweetStatus.user.description.includes(word))){
            // if (configuration.verbose) {
              statsObj.filtered.words += 1;

              console.log(chalkLog(MODULE_ID_PREFIX + " | XXX IGNORE PROFILE WORD | SKIPPING"
                + " [" + statsObj.filtered.words + "]"
                + " | TWID: " + tweetStatus.id_str
                + " | UID: " + tweetStatus.user.id_str
                + " | @" + tweetStatus.user.screen_name
                + " | NAME: " + tweetStatus.user.name
              ));
            // }
            return;
          }
        }

        if (tweetStatus.user.location 
          && (tweetStatus.user.location !== undefined) 
          && ignoreLocationsRegEx.test(tweetStatus.user.location)){

          statsObj.filtered.locations += 1;

          if (configuration.verbose) {
            console.log(chalkLog(MODULE_ID_PREFIX + " | XXX IGNORE LOCATION | SKIPPING"
              + " [" + statsObj.filtered.locations + "]"
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

          statsObj.filtered.languages += 1;

          if (configuration.verbose) {
            console.log(chalkLog(MODULE_ID_PREFIX + " | XXX IGNORE LANG | SKIPPING"
              + " [" + statsObj.filtered.languages + "]"
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
      console.log(chalkError(MODULE_ID_PREFIX + " | CAUGHT ERROR | " + getTimeStamp()
        + " | @" + threeceeUser.screenName
        + " | *** TWITTER ERROR: " + err
        + " | *** TWITTER ERROR\n" + jsonPrint(err)
      ));

      statsObj.twitter.errors += 1;
      threeceeUser.stats.twitterErrors += 1;

      threeceeUser.stats.ready = false;
      threeceeUser.stats.error = err;
      threeceeUser.stats.connected = false;
      threeceeUser.stats.authenticated = false;
      threeceeUser.stats.twitterTokenErrorFlag = true;

      const errorType = (err.statusCode == 401) ? "TWITTER_UNAUTHORIZED" : "TWITTER";

      process.send({
        op: "ERROR", 
        threeceeUser: threeceeUser.screenName, 
        stats: threeceeUser.stats, 
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

  console.log(chalkBlue(MODULE_ID_PREFIX + " | ... INIT SET FROM FILE: " + params.folder + "/" + params.file));

  try{

    const setObj = await tcUtils.loadFile({
      folder: params.folder, 
      file: params.file, 
      noErrorNotFound: params.noErrorNotFound
    });

    if (empty(setObj)) {
     console.log(chalkAlert(MODULE_ID_PREFIX + " | ??? NO ITEMS IN FILE ERROR ???"
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

    console.log(chalkLog(MODULE_ID_PREFIX + " | LOADED SET FROM FILE"
      + " | OBJ ARRAY KEY: " + params.objArrayKey
      + " | " + fileSet.size + " ITEMS"
      + " | " + params.folder + "/" + params.file
    ));

    return fileSet;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT SET FROM FILE ERROR: " + err));
    if (params.noErrorNotFound) {
      return;
    }
    throw err;
  }
}

async function initSearchTerms(params){

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT TERMS | @" + threeceeUser.screenName));

  try{

    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: params.searchTermsFile, 
      noErrorNotFound: true
    });

    if (result) {
      threeceeUser.searchTermSet = new Set([...result]);
      threeceeUser.searchTermSet.delete("");
      threeceeUser.searchTermSet.delete(" ");
    }

    console.log(chalk.blue(MODULE_ID_PREFIX + " | FILE CONTAINS " + threeceeUser.searchTermSet.size + " TOTAL SEARCH TERMS "));

    console.log(chalkLog(MODULE_ID_PREFIX + " | ADDING " + threeceeUser.followUserScreenNameSet.size + " SCREEN NAMES TO TRACK SET"));

    threeceeUser.searchTermSet = new Set([...threeceeUser.searchTermSet, ...threeceeUser.followUserScreenNameSet]);

    if (threeceeUser.searchTermSet.size == 0){
      console.log(chalkAlert(MODULE_ID_PREFIX + " | ??? NO SEACH TERMS |@" + threeceeUser.screenName));
      throw new Error("NO SEARCH TERMS");
    }

    console.log(chalk.blue(MODULE_ID_PREFIX + " | SEACH TERMS"
      + " | @" + threeceeUser.screenName 
      + " | " + threeceeUser.searchTermSet.size + " SEACH TERMS"
    ));

    return;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | LOAD FILE ERROR\n" + err));
    throw err;
  }
}

async function initAllowLocations(){

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT ALLOW LOCATIONS | @" + threeceeUser.screenName));

  try{
    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: allowLocationsFile, 
      noErrorNotFound: true
    });

    if (result) {
      allowLocationsSet = new Set([...result]);
    }

    console.log(chalk.blue(MODULE_ID_PREFIX + " | FILE CONTAINS " + allowLocationsSet.size + " ALLOW LOCATIONS "));

    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT ALLOW LOCATIONS ERROR: " + err));
    throw err;
  }
}

async function initIgnoreLocations(){

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT IGNORE LOCATIONS | @" + threeceeUser.screenName));

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

    console.log(chalk.blue(MODULE_ID_PREFIX + " | FILE CONTAINS " + ignoreLocationsSet.size + " IGNORE LOCATIONS "));

    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT IGNORE LOCATIONS ERROR: " + err));
    throw err;
  }
}

async function initIgnoreHashtags(){

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT IGNORE HASHTAGS | @" + threeceeUser.screenName));

  try{
    const result = await initSetFromFile({
      folder: configDefaultFolder, 
      file: ignoredHashtagFile, 
      noErrorNotFound: true
    });

    if (result) {
      ignoredHashtagSet = new Set([...result]);
    }

    console.log(chalk.blue(MODULE_ID_PREFIX + " | FILE CONTAINS " + ignoredHashtagSet.size + " IGNORE HASHTAGS "));

    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT IGNORE HASHTAGS ERROR: " + err));
    throw err;
  }
}

async function initIgnoredProfileWords(){

  console.log(chalkInfo(MODULE_ID_PREFIX + " | INIT IGNORED PROFILE WORDS | @" + threeceeUser.screenName));

  try{

    const result = await tcUtils.initSetFromFile({
      folder: configDefaultFolder, 
      file: ignoredProfileWordsFile, 
      resolveOnNotFound: true
    });

    if (result) {
      ignoredProfileWordsSet = result;
      ignoredProfileWordsSet.delete("");
      ignoredProfileWordsSet.delete(" ");
      ignoredProfileWordsArray = [...ignoredProfileWordsSet];
    }

    console.log(chalkInfo(MODULE_ID_PREFIX + " | +++ LOADED IGNORED PROFILE WORDS: " + ignoredProfileWordsSet.size));

    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT IGNORED PROFILE WORDS ERROR: " + err));
    throw err;
  }
}


async function initFollowableSearchTermSet(){

  statsObj.status = "INIT FOLLOWABLE SEARCH TERM SET";

  console.log(chalkBlue(MODULE_ID_PREFIX + " | INIT FOLLOWABLE SEARCH TERM SET: " + configDefaultFolder 
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

    console.log(chalkLog(MODULE_ID_PREFIX + " | LOADED FOLLOWABLE SEARCH TERMS FILE"
      + " | " + followableSearchTermSet.size + " SEARCH TERMS"
      + " | " + configDefaultFolder + "/" + followableSearchTermFile
    ));

    return;
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT FOLLOWABLE SEARCH TERM SET ERROR: " + err));
    throw err;
  }
}

let searchTermsUpdateInterval;

async function initSearchTermsUpdateInterval(){

  clearInterval(searchTermsUpdateInterval);

  const interval = configuration.searchTermsUpdateInterval || DEFAULT_SEARCH_TERM_UPDATE_INTERVAL;

  searchTermsUpdateInterval = setInterval(async function(){
    console.log(chalkInfo(MODULE_ID_PREFIX + " | ... SEARCH TERM UPDATE | INTERVAL: " + msToTime(interval)));
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

      if (f.endsWith(ignoredProfileWordsFile)){
        await initIgnoredProfileWords();
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

  console.log(chalkLog(MODULE_ID_PREFIX + " | TSS | INITIALIZE"
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

  debug(chalkWarn(MODULE_ID_PREFIX + " | dropboxConfigFolder: " + dropboxConfigFolder));
  debug(chalkWarn(MODULE_ID_PREFIX + " | dropboxConfigFile  : " + dropboxConfigFile));


  try {
    const loadedConfigObj = await tcUtils.loadFile({
      folder: configHostFolder, 
      file: dropboxConfigFile,
      noErrorNotFound: true
    }); 

    debug(dropboxConfigFile + "\n" + jsonPrint(loadedConfigObj));

    if (loadedConfigObj.TSS_VERBOSE_MODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TSS_VERBOSE_MODE: " + loadedConfigObj.TSS_VERBOSE_MODE);
      cnf.verbose = loadedConfigObj.TSS_VERBOSE_MODE;
    }

    if (loadedConfigObj.TSS_GLOBAL_TEST_MODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TSS_GLOBAL_TEST_MODE: " + loadedConfigObj.TSS_GLOBAL_TEST_MODE);
      cnf.globalTestMode = loadedConfigObj.TSS_GLOBAL_TEST_MODE;
    }

    if (loadedConfigObj.TSS_TEST_MODE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED TSS_TEST_MODE: " + loadedConfigObj.TSS_TEST_MODE);
      cnf.testMode = loadedConfigObj.TSS_TEST_MODE;
    }

    if (loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER: " + loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER);
      cnf.twitterConfigFolder = loadedConfigObj.DROPBOX_WORD_ASSO_DEFAULT_TWITTER_CONFIG_FOLDER;
    }

    if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_DIR: " + loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR);
      cnf.searchTermsDir = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_DIR;
    }

    if (loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE !== undefined){
      console.log(MODULE_ID_PREFIX + " | LOADED DROPBOX_DEFAULT_SEARCH_TERMS_FILE: " + loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE);
      cnf.searchTermsFile = loadedConfigObj.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
    }

    if (loadedConfigObj.TSS_STATS_UPDATE_INTERVAL !== undefined) {
      console.log(MODULE_ID_PREFIX + " | LOADED TSS_STATS_UPDATE_INTERVAL: " + loadedConfigObj.TSS_STATS_UPDATE_INTERVAL);
      cnf.statsUpdateIntervalTime = loadedConfigObj.TSS_STATS_UPDATE_INTERVAL;
    }

    if (loadedConfigObj.TSS_MAX_TWEET_QUEUE !== undefined) {
      console.log(MODULE_ID_PREFIX + " | LOADED TSS_MAX_TWEET_QUEUE: " + loadedConfigObj.TSS_MAX_TWEET_QUEUE);
      cnf.maxTweetQueue = loadedConfigObj.TSS_MAX_TWEET_QUEUE;
      maxTweetQueue = cnf.maxTweetQueue;
    }

    // OVERIDE CONFIG WITH COMMAND LINE ARGS

    const configArgs = Object.keys(cnf);

    if (cnf.verbose) {
      configArgs.forEach(function(arg){
        console.log(MODULE_ID_PREFIX + " | FINAL CONFIG | " + arg + ": " + cnf[arg]);
      });
    }

    await initStatsUpdate(cnf);

    return cnf;

  }
  catch(err){
    console.log(MODULE_ID_PREFIX + " | TSS | *** ERROR LOAD CONFIG: " + dropboxConfigFile + "\n" + jsonPrint(err));
    throw err;
  }
}

function initTwitterQueue(cnf, callback){

  console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT TWITTER QUEUE INTERVAL: " + cnf.twitterQueueIntervalTime));

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

    console.log(chalkTwitter(MODULE_ID_PREFIX + " | INIT TWITTER SEARCH"));

    initTwitterQueue(cnf);

    console.log(chalkTwitter(MODULE_ID_PREFIX + " | " + getTimeStamp() 
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

        console.log(chalkTwitter(MODULE_ID_PREFIX + " | --> TWITTER FOLLOW"
          + " | @" + followObj.user.screenName
          + " | UID: " + followObj.user.userId
        ));

        threeceeUser.twitStream.post("friendships/create", createParams, function(err, data, response) {

          if (err){

            console.log(chalkError(MODULE_ID_PREFIX + " | *** TWITTER FOLLOW ERROR"
              + " | @" + threeceeUser.screenName
              + " | ERROR CODE: " + err.code
              + " | ERROR: " + err
            ));

            if (configuration.verbose) {
              console.log(chalkError(MODULE_ID_PREFIX + " | *** TWITTER FOLLOW ERROR"
                + " | @" + threeceeUser.screenName
                + "\nresponse\n" + jsonPrint(response)
              ));
            }

            if (err.code == 161) {
              followQueue.length = 0;
            }

            const errorType = (err.code == 161) ? "TWITTER_FOLLOW_LIMIT" : "TWITTER_FOLLOW";

            process.send({
              op: "ERROR", 
              threeceeUser: threeceeUser.screenName, 
              stats: threeceeUser.stats, 
              errorType: errorType, 
              error: err
            });

          }
          else {
            console.log(chalk.green(MODULE_ID_PREFIX + " | +++ TWITTER FOLLOWING"
              + " | @" + data.screen_name
              + " | ID: " + data.id_str
              + " | " + data.name
            ));

            threeceeUser.followUserIdSet.add(data.id_str);

            followQueueReady = true;
          }
        });
      }

    }, interval);

    return;

  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** TWIT INIT FOLLOW ERROR"
      + " | @" + threeceeUser.screenName
      + " | " + getTimeStamp()
      + " | " + err
    ));
    throw err;
  }
}

process.on("message", async function(m) {

  console.log(chalkLog(MODULE_ID_PREFIX + " | RX MESSAGE"
    + " | OP: " + m.op
  ));

  let authObj;
  let authObjNew;
  let twitterConfigFile;

  switch (m.op) {

    case "QUIT":
      console.log(chalkAlert(MODULE_ID_PREFIX + " | QUIT"));
      quit("PARENT QUIT");
    break;

    case "VERBOSE":
      console.log(chalkAlert(MODULE_ID_PREFIX + " | VERBOSE"));
      configuration.verbose = m.verbose;
    break;

    case "INIT":

      process.title = m.title;

      configuration.threeceeUser = m.threeceeUser;
      threeceeUser.screenName = m.threeceeUser;

      configuration.filterDuplicateTweets = m.filterDuplicateTweets;
      filterDuplicateTweets = m.filterDuplicateTweets;
      
      configuration.filterRetweets = m.filterRetweets;
      filterRetweets = m.filterRetweets;
      
      configuration.twitterQueueIntervalTime = m.interval;
      configuration.verbose = m.verbose;
      configuration.testMode = m.testMode;

      threeceeUser.twitterConfig = m.twitterConfig;

      console.log(chalkInfo(MODULE_ID_PREFIX + " | INIT"
        + " | TITLE: " + m.title
        + " | 3C USER @" + configuration.threeceeUser
        + "\nCONFIGURATION\n" + jsonPrint(configuration)
        + "\nTWITTER CONFIG\n" + jsonPrint(m.twitterConfig)
      ));

      try {
        await tcUtils.setThreeceeUser(configuration.threeceeUser);
        await initFollowableSearchTermSet();
        await initAllowLocations();
        await initIgnoredProfileWords();
        await initIgnoreLocations();
        await initIgnoreHashtags();
        await initTwitterUser();
        await initSearchTerms(configuration);
        await initSearchStream();
        await initTwitterSearch(configuration);
        await initFollowQueue({interval: configuration.followQueueIntervalTime});
      }
      catch(err){
        console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "USER_AUTHENTICATED":

      if (m.user.screenName != threeceeUser.screenName) {
        console.log(chalkInfo(MODULE_ID_PREFIX + " | USER_AUTHENTICATED | USER MISS"
          + " | CHILD 3C @" + threeceeUser.screenName
          + " | AUTH USER @" + m.user.screenName
          + " | UID: " + m.user.userId
          // + " | TOKEN: " + m.token
          // + " | TOKEN SECRET: " + m.tokenSecret
        ));
        break;
      }

      console.log(chalkInfo(MODULE_ID_PREFIX + " | USER_AUTHENTICATED"
        + " | @" + m.user.screenName
        + " | UID: " + m.user.userId
        + " | TOKEN: " + m.token
        + " | TOKEN SECRET: " + m.tokenSecret
      ));

      authObj = threeceeUser.twitStream.getAuth();

      console.log(chalkLog(MODULE_ID_PREFIX + " | CURRENT AUTH\n" + jsonPrint(authObj)));

      threeceeUser.twitStream.setAuth({access_token: m.token, access_token_secret: m.tokenSecret});

      authObjNew = threeceeUser.twitStream.getAuth();

      threeceeUser.twitterConfig.token = authObjNew.access_token;
      threeceeUser.twitterConfig.token_secret = authObjNew.access_token_secret;

      threeceeUser.twitterConfig.access_token = authObjNew.access_token;
      threeceeUser.twitterConfig.access_token_secret = authObjNew.access_token_secret;
      
      threeceeUser.twitterConfig.TOKEN = authObjNew.access_token;
      threeceeUser.twitterConfig.TOKEN_SECRET = authObjNew.access_token_secret;

      console.log(chalkError(MODULE_ID_PREFIX + " | UPDATED AUTH\n" + jsonPrint(authObjNew)));

      twitterConfigFile = threeceeUser.screenName + ".json";

      await tcUtils.saveFile({localFlag: true, folder: twitterConfigFolder, file: twitterConfigFile, obj: threeceeUser.twitterConfig});

      console.log(chalkLog(MODULE_ID_PREFIX + " | SAVED UPDATED AUTH " + twitterConfigFolder + "/" + twitterConfigFile));

      threeceeUser.stats.connected = true;
      threeceeUser.stats.twitterFollowLimit = false;

      const twitGetFriendsParams = {
        screen_name: threeceeUser.screenName,
        stringify_ids: true
      };

      try{
        const data = await twitStreamPromise({resource: "friends", endPoint: "ids", twitParams: twitGetFriendsParams});

        if (!data || data == undefined) {

          threeceeUser.stats.error = false;
          threeceeUser.stats.authenticated = true;

          console.log(chalkAlert(MODULE_ID_PREFIX + " | !!! EMPTY TWITTER GET FRIENDS IDS"
            + " | @" + threeceeUser.screenName
            + " | followUserIdSet: " + threeceeUser.followUserIdSet.size + " FRIENDS"
          ));

          if (threeceeUser.followUserIdSet.size === 0){
            return;
          }
        }
        else{
          threeceeUser.stats.error = false;
          threeceeUser.stats.authenticated = true;
          threeceeUser.followUserIdSet = new Set(data.ids);
        }

        console.log(chalkTwitter(MODULE_ID_PREFIX + " | TWITTER GET FRIENDS IDS"
          + " | @" + threeceeUser.screenName
          + " | " + threeceeUser.followUserIdSet.size + " FRIENDS"
        ));

        await initSearchTerms(configuration);
        await initSearchStream();

        console.log(chalkInfo(MODULE_ID_PREFIX + " | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUser.screenName));

        if (!twitterSearchInit) { 
          await initTwitterSearch(configuration);
        }

        process.send({
          op: "TWITTER_STATS", 
          threeceeUser: threeceeUser.screenName,
          twitterConfig: threeceeUser.twitterConfig,
          stats: threeceeUser.stats, 
          twitterFollowing: threeceeUser.followUserIdSet.size,
          twitterFriends: [...threeceeUser.followUserIdSet]
        });

      }
      catch(err){
        console.log(chalkError(MODULE_ID_PREFIX + " | *** USER AUTHENTICATE ERROR: " + err));
      }

    break;

    case "FOLLOW":
      console.log(chalkInfo(MODULE_ID_PREFIX + " | FOLLOW"
        + " | 3C @" + threeceeUser.screenName
        + " | UID " + m.user.userId
        + " | @" + m.user.screenName
        + " | FORCE FOLLOW: " + m.forceFollow
      ));

      if (m.forceFollow !== undefined) { configuration.forceFollow = m.forceFollow; }

      followQueue.push(m);
    break;

    case "UNFOLLOW":
      console.log(chalkInfo(MODULE_ID_PREFIX + " | UNFOLLOW"
        // + " [Q: " + unfollowQueue.length + "]"
        + " 3C @" + threeceeUser.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
    break;

    case "UNFOLLOW_ID_ARRAY":
    break;

    case "IGNORE":
      console.log(chalkInfo(MODULE_ID_PREFIX + " | TSS > IGNORE"
        + " | 3C @" + threeceeUser.screenName
        + " | USER " + m.user.userId
        + " | @" + m.user.screenName
      ));
      ignoreUserSet.add(m.user.userId);
    break;

    case "UPDATE_ALLOW_LOCATIONS":
      console.log(chalkLog(MODULE_ID_PREFIX + " | UPDATE ALLOW LOCATIONS"));

      try {
        await initAllowLocations(configuration);
      }
      catch(err){
        console.log(chalkError(MODULE_ID_PREFIX + " | *** UPDATE_ALLOW_LOCATIONS ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "UPDATE_IGNORE_LOCATIONS":
      console.log(chalkLog(MODULE_ID_PREFIX + " | UPDATE IGNORE LOCATIONS"));

      try {
        await initIgnoreLocations();
      }
      catch(err){
        console.log(chalkError(MODULE_ID_PREFIX + " | *** UPDATE_IGNORE_LOCATIONS ERROR" 
          + " | @" + m.threeceeUser
          + " | ERROR: " + err
        ));
      }
    break;

    case "UPDATE_SEARCH_TERMS":
      console.log(chalkLog(MODULE_ID_PREFIX + " | UPDATE SEARCH TERMS"));

      try{

        await initSearchTerms(configuration);
        await initSearchStream();

        console.log(chalkInfo(MODULE_ID_PREFIX + " | INIT SEARCH TERMS COMPLETE | 3C @" + threeceeUser.screenName));

        if (!twitterSearchInit) { await initTwitterSearch(configuration); }

        process.send({
          op: "TWITTER_STATS", 
          threeceeUser: threeceeUser.screenName, 
          stats: threeceeUser.stats, 
          twitterFollowing: threeceeUser.followUserIdSet.size,
          twitterFriends: [...threeceeUser.followUserIdSet]
        });
      }
      catch(err){
        process.send({
          op: "TWITTER_ERROR", 
          threeceeUser: threeceeUser.screenName, 
          err: err
        });
      }
    break;

    case "PING":
      debug(chalkLog(MODULE_ID_PREFIX + " | TWP | PING"
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
      console.log(chalkError(MODULE_ID_PREFIX + " | *** TSS UNKNOWN OP"
        + " | 3C @" + threeceeUser.screenName
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

  console.log(MODULE_ID_PREFIX + " | " + configuration.processName + " STARTED " + getTimeStamp() + "\n");

  try {

    try{
      configuration = await initialize(configuration);
    }
    catch(err){
      if (err.status != 404) {
        console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT ERROR\n" + jsonPrint(err)));
        quit();
      }
      console.log(chalkError(MODULE_ID_PREFIX + " | *** INIT ERROR | CONFIG FILE NOT FOUND? | ERROR: " + err));
    }

    await initWatchConfig();
    await initSearchTermsUpdateInterval();
    process.send({ op: "READY"});
  }
  catch(err){
    console.log(chalkError(MODULE_ID_PREFIX + " | *** ERROR: " + err + " | QUITTING ***"));
    quit("INITIALIZE ERROR");
  }
}, ONE_SECOND);
