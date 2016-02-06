/*jslint node: true */
"use strict";

function quit(){
  console.log( "\n... QUITTING ..." );
  process.exit( );
}

process.on( 'SIGINT', function() {
  quit();
});

// SESSION TYPES: RANDOM, ANTONYM, SYNONYM, SCRIPT, USER-USER, GROUP  ( session.config.type )

var sessionTypes = [ "RANDOM", "ANTONYM", "SYNONYM", "SCRIPT", "USER-USER", "GROUP" ];
// var enabledSessionTypes = [ 'RANDOM', 'ANTONYM', 'SYNONYM'];
var enabledSessionTypes = [ "ANTONYM", "SYNONYM" ];

var DEFAULT_SESSION_TYPE = 'ANTONYM';

var defaultSessionType = DEFAULT_SESSION_TYPE ;

var BHT_REQUEST_LIMIT = 250000;
var MW_REQUEST_LIMIT = 250000;
var SESSION_WORDCHAIN_REQUEST_LIMIT = 25;

var ONE_SECOND = 1000 ;
var ONE_MINUTE = ONE_SECOND*60 ;
var ONE_HOUR = ONE_MINUTE*60 ;
var ONE_DAY = ONE_HOUR*24 ;


// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

var moment = require('moment');

var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
var defaultTimePeriodFormat = "HH:mm:ss";

var S = require('string');

var os = require('os');
var config = require('./config/config');
var util = require('util');

var express = require('./config/express');
var mongoose = require('./config/mongoose');

var request = require('request');
var fs = require('fs');
var yaml = require('yamljs');

var async = require('async');
var HashMap = require('hashmap').HashMap;

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var EventEmitter = require("events").EventEmitter;

var statsLogger = require('stats-logger').createInstance(
  10*ONE_SECOND, 
  'file', 
  {
    filename: "./" + os.hostname() +  "_wordAssoServerStats.log", 
    outputFormat: "{lastFlushTime}"
      + " | {numberViewers} V"
      + " | {numberViewersMax} V MAX"
      + " | {numberUsers} U"
      + " | {numberUsersMax} U MAX"
      + " | {numberTestUsers} TEST U"
      + " | {numberTestUsersMax} TEST U MAX"
      + " | {numberUsersTotal} TOTAL U"
      + " | {numberUsersTotalMax} TOTAL U MAX"
      // + " | CACHE K:{wordCacheKeys} H:{wordCacheHits} M:{wordCacheMisses} VS:{wordCacheVsize} KS:{wordCacheKsize}"
  }
);


// ==================================================================
// SERVER STATUS
// ==================================================================
var upTime = os.uptime() * 1000;
var memoryTotal = os.totalmem();
var memoryAvailable = os.freemem();

var currentTime = moment();
var startTime = moment();
var runTime = 0;

var currentTimeInteval = setInterval(function () {
  currentTime = moment();
}, 10);

var tempDateTime = moment();
var txHeartbeat = { };
var heartbeatsSent = 0;

var numberIpAddresses = 0;

var numberUsersMax = 0;
var numberUsersMaxTime = moment().valueOf();

var numberUsersTotalMax = 0;
var numberUsersTotalMaxTime = moment().valueOf();

var numberTestUsersMax = 0;
var numberTestUsersMaxTime = moment().valueOf();

var numberViewersMax = 0;
var numberViewersMaxTime = moment().valueOf();

statsLogger.addStat("numberViewers", "snapshot", {initialValue: 0});
statsLogger.addStat("numberViewersMax", "max", {initialValue: 0, suppressReset: true});

statsLogger.addStat("numberUsersTotal", "snapshot", {initialValue: 0});
statsLogger.addStat("numberUsersTotalMax", "max", {initialValue: 0, suppressReset: true});

statsLogger.addStat("numberUsers", "snapshot", {initialValue: 0});
statsLogger.addStat("numberUsersMax", "max", {initialValue: 0, suppressReset: true});

statsLogger.addStat("numberTestUsers", "snapshot", {initialValue: 0});
statsLogger.addStat("numberTestUsersMax", "max", {initialValue: 0, suppressReset: true});

statsLogger.start();

console.log(
  '\n\n====================================================================================================\n' 
  +   '========================================= ***START*** ==============================================\n' 
  +   '====================================================================================================\n' 
  +    process.argv[1] + '\nSTARTED ' + Date() + '\n'
  +   '====================================================================================================\n' 
  +   '========================================= ***START*** ==============================================\n' 
  +   '====================================================================================================\n\n'
  );


// ==================================================================
// WORD ASSO STATUS
// ==================================================================
var totalSessions = 0;
var totalUsers = 0;
var totalClients = 0;
var totalWords = 0;

var promptsSent = 0;
var responsesReceived = 0;
var sessionUpdatesSent = 0;


var wordAssoServerStatsObj = {

  "name" : "Word Association Server Status",
  "host" : os.hostname(),
  "timeStamp" : moment().format(defaultDateTimeFormat),
  "runTimeArgs" : process.argv,

  "startTime" : startTime,
  "runTime" : runTime,

  "totalClients" : 0,
  "totalUsers" : 0,
  "totalSessions" : 0,
  "totalWords" : 0,

  "promptsSent" : 0,
  "responsesReceived" : 0,
  "deltaResponsesReceived" : 0,
  "sessionUpdatesSent" : 0,

  "bhtRequests" : 0,
  "mwRequests" : 0,

  "heartbeat" : txHeartbeat
};

var saveStatsInterval = 10000 ;

// ==================================================================
// TEST CONFIG
// ==================================================================
var testMode = false ;
var bhtOverLimitTestFlag = false ;

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var chalk = require('chalk');

var chalkViewer = chalk.cyan;
var chalkUser = chalk.green;
var chalkRed = chalk.red;
var chalkGreen = chalk.green;
var chalkAdmin = chalk.bold.cyan;
var chalkConnectAdmin = chalk.bold.cyan;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.red;
var chalkInfo = chalk.gray;
var chalkTest = chalk.yellow;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkSession = chalk.blue;
var chalkPrompt = chalk.blue;
var chalkResponse = chalk.blue;
var chalkBht = chalk.red;
var chalkMw = chalk.yellow;
var chalkDb = chalk.gray;
var chalkGoogle = chalk.green;

var serverReady = false ;
var internetReady = false ;

var serverSessionConfig = {};
var configChangeFlag = false ;


var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on('newListener', function(data){
  console.log("*** NEW CONFIG EVENT LISTENER: " + data);
});


var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();

var numberAdminsTotal = 0;
var numberAdmins = 0;

var numberUtils = 0;
var numberUsers = 0;
var numberViewers = 0;
var numberTestViewers = 0;
var numberTestUsers = 0;

var dnsHostHashMap = new HashMap();
var localHostHashMap = new HashMap();


// ==================================================================
// ADMIN
// ==================================================================

localHostHashMap.set('::ffff:127.0.0.1', 'threeceelabs.com');
localHostHashMap.set('127.0.0.1', 'threeceelabs.com');
localHostHashMap.set('::1', 'threeceelabs.com');
localHostHashMap.set('::1', 'threeceelabs.com');

localHostHashMap.set('macpro.local', 'threeceelabs.com');
localHostHashMap.set('macpro2.local', 'threeceelabs.com');
localHostHashMap.set('mbp.local', 'threeceelabs.com');
localHostHashMap.set('mbp2.local', 'threeceelabs.com');
localHostHashMap.set('macminiserver0.local', 'threeceelabs.com');
localHostHashMap.set('macminiserver1.local', 'threeceelabs.com');
localHostHashMap.set('macminiserver2.local', 'threeceelabs.com');
localHostHashMap.set('mms0.local', 'threeceelabs.com');
localHostHashMap.set('mms1.local', 'threeceelabs.com');
localHostHashMap.set('mms2.local', 'threeceelabs.com');

localHostHashMap.set('::ffff:10.0.1.4', 'threeceelabs.com');
localHostHashMap.set('::ffff:10.0.1.10', 'threeceelabs.com');
localHostHashMap.set('::ffff:10.0.1.27', 'threeceelabs.com');
localHostHashMap.set('::ffff:10.0.1.45', 'threeceelabs.com');
localHostHashMap.set('10.0.1.4', 'threeceelabs.com');
localHostHashMap.set('10.0.1.10', 'threeceelabs.com');
localHostHashMap.set('10.0.1.27', 'threeceelabs.com');

localHostHashMap.set('104.197.93.13', 'threeceelabs.com');


// ==================================================================
// SESSION CACHE
// ==================================================================
var sessionCacheTtl = process.env.SESSION_CACHE_DEFAULT_TTL ;

if (typeof sessionCacheTtl === 'undefined') sessionCacheTtl = 60 ;
console.log("SESSION CACHE TTL: " + sessionCacheTtl + " SECONDS");

// ==================================================================
// WORD CACHE
// ==================================================================
var wordCacheTtl = parseInt(process.env.WORD_CACHE_TTL);

if (typeof wordCacheTtl === 'undefined') wordCacheTtl = 60 ;
console.log("WORD CACHE TTL: " + wordCacheTtl + " SECONDS");

// ==================================================================
// BIG HUGE THESAURUS
// ==================================================================
var bigHugeLabsApiKey = "e1b4564ec38d2db399dabdf83a8beeeb";
var bigHugeThesaurusUrl = "http://words.bighugelabs.com/api/2/" + bigHugeLabsApiKey + "/";
var bhtEvents = new EventEmitter();
var bhtErrors = 0;
var bhtRequests = 0; 
var bhtOverLimits = 0; 

var bhtOverLimitTime = moment.utc().utcOffset("-08:00").endOf('day');
var bhtLimitResetTime = moment.utc().utcOffset("-08:00").endOf('day');
var bhtTimeToReset = moment.utc().utcOffset("-08:00").endOf('day').valueOf() - moment.utc().utcOffset("-08:00").valueOf();
var bhtOverLimitFlag = false ;

console.log("BHT OVER LIMIT TIME:  " + bhtOverLimitTime.format(defaultDateTimeFormat));
console.log("BHT OVER LIMIT RESET: " + bhtOverLimitTime.format(defaultDateTimeFormat));
console.log("BHT TIME TO RESET: " + msToTime(bhtTimeToReset));

var bhtOverLimitTimeOut = setTimeout(function () {
  bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
}, bhtTimeToReset);


// ==================================================================
// MERRIAM-WEBSTER
// ==================================================================
var mwEvents = new EventEmitter();
var mwErrors = 0;
var mwRequests = 0; 
var mwOverLimits = 0; 

var mwOverLimitTime = moment.utc().utcOffset("-05:00").endOf('day');
var mwLimitResetTime = moment.utc().utcOffset("-05:00").endOf('day');
var mwTimeToReset = moment.utc().utcOffset("-05:00").endOf('day').valueOf() - moment.utc().utcOffset("-05:00").valueOf();
var mwOverLimitFlag = false ;

console.log("MW OVER LIMIT TIME:  " + mwOverLimitTime.format(defaultDateTimeFormat));
console.log("MW OVER LIMIT RESET: " + mwOverLimitTime.format(defaultDateTimeFormat));
console.log("MW TIME TO RESET: " + msToTime(mwTimeToReset));

var mwOverLimitTimeOut = setTimeout(function () {
  mwEvents.emit("MW_OVER_LIMIT_TIMEOUT");
}, mwTimeToReset);



// ==================================================================
// ENV INIT
// ==================================================================
var debug = require('debug')('wordAsso');

if (debug.enabled){
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

debug('WORDASSO_NODE_ENV BEFORE: ' + process.env.WORDASSO_NODE_ENV);

process.env.WORDASSO_NODE_ENV = process.env.WORDASSO_NODE_ENV || 'development';

console.log('WORDASSO_NODE_ENV : ' + process.env.WORDASSO_NODE_ENV);
console.log('CLIENT HOST + PORT: ' + 'http://localhost:' + config.port);


// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_WORD_ASSO_ACCESS_TOKEN = process.env.DROPBOX_WORD_ASSO_ACCESS_TOKEN ;
var DROPBOX_WORD_ASSO_APP_KEY = process.env.DROPBOX_WORD_ASSO_APP_KEY ;
var DROPBOX_WORD_ASSO_APP_SECRET = process.env.DROPBOX_WORD_ASSO_APP_SECRET;
var DROPBOX_WORD_ASSO_STATS_FILE = process.env.DROPBOX_WORD_ASSO_STATS_FILE;
var dropboxHostStatsFile = os.hostname() + "_" + DROPBOX_WORD_ASSO_STATS_FILE;

var Dropbox = require("dropbox");

console.log("DROPBOX_WORD_ASSO_ACCESS_TOKEN :" + DROPBOX_WORD_ASSO_ACCESS_TOKEN);
console.log("DROPBOX_WORD_ASSO_APP_KEY :" + DROPBOX_WORD_ASSO_APP_KEY);
console.log("DROPBOX_WORD_ASSO_APP_SECRET :" + DROPBOX_WORD_ASSO_APP_SECRET);

var dropboxClient = new Dropbox.Client({
    token: DROPBOX_WORD_ASSO_ACCESS_TOKEN,
    key: DROPBOX_WORD_ASSO_APP_KEY,
    secret: DROPBOX_WORD_ASSO_APP_SECRET
});


dropboxClient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

dropboxClient.getAccountInfo(function(error, accountInfo) {
  if (error) {
    console.error("\n*** DROPBOX getAccountInfo ERROR ***\n" + JSON.stringify(error, null, 3));
    return error;  // Something went wrong.
  }
  debug(chalkInfo("DROPBOX ACCOUNT INFO: " + JSON.stringify(accountInfo,null,3) ));
  console.log(chalkInfo("DROPBOX ACCOUNT INFO: " + accountInfo.name ));
});

function dropboxWriteArrayToFile(filePath, dataArray, callback){

  if (typeof filePath === 'undefined'){
    console.error(chalkError(moment().format(defaultDateTimeFormat) + " | !!! DROPBOX WRITE FILE ERROR: FILE PATH UNDEFINED"));
    callback('FILE PATH UNDEFINED', null);
  }

  var dataString = dataArray.join('\n');

  dropboxClient.writeFile(filePath, dataString, function(error, stat) {
    if (error) {
      console.error(chalkError(moment().format(defaultDateTimeFormat) + " | !!! DROPBOX WRITE FILE ERROR: " + error));
      callback(error, filePath);
    }
    else {
      debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | DROPBOX FILE WRITE: " + filePath));
      callback(null, stat);
    }
  });
}

function saveStats (dropboxHostStatsFile, wordAssoServerStatsObj, callback){
  dropboxClient.writeFile(dropboxHostStatsFile, JSON.stringify(wordAssoServerStatsObj, null, 2), function(error, stat) {
    if (error) {
      console.error(chalkError(moment().format(defaultDateTimeFormat) + " | !!! ERROR STATUS WRITE | FILE: " + dropboxHostStatsFile 
        + " ERROR: " + error));
      callback(error);
    }
    else {
      debug(chalkLog("... SAVED STATS | " + dropboxHostStatsFile));
      // console.log(chalkLog(moment().format(defaultDateTimeFormat) + " | SAVED STATUS | STATUS\n" + jsonPrint(wordAssoServerStatsObj)));
      callback('OK');
    }
  });
}

function updateStats(updateObj){
  for (var key in updateObj) {
     if (updateObj.hasOwnProperty(key)) {
        debug("UPDATING WORD ASSO STATUS | " + key + ": " + updateObj[key]);
        wordAssoServerStatsObj[key] = updateObj[key];
     }
  }
}

function loadStats(){

  dropboxClient.readFile(dropboxHostStatsFile, function(err, statsJson, callback) {

    if (err) {

      console.error(chalkError("!!! DROPBOX READ DROPBOX_WORD_ASSO_STATS_FILE ERROR"));
      debug(chalkError(jsonPrint(err)));

      if (err.status != 404) {
        console.log(chalkError(jsonPrint(err)));
      }
      else if (err.status = 404) {

        console.log("... TRYING DROPBOX READ OF DEFAULT DROPBOX_WORD_ASSO_STATS_FILE " + DROPBOX_WORD_ASSO_STATS_FILE);
        
        dropboxClient.readFile(DROPBOX_WORD_ASSO_STATS_FILE, function(err, statsJson, callback) {

          console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
            + " | ... LOADING STATS FROM DROPBOX FILE: " + DROPBOX_WORD_ASSO_STATS_FILE
          ));

          var statsObj = JSON.parse(statsJson);

          console.log("DROPBOX STATS\n" + JSON.stringify(statsObj, null, 3));

          if (typeof statsObj.name === 'undefined') statsObj.name = 'Word Assocition Server Status | ' + os.hostname()

          console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | FOUND " + statsObj.name));

          if (typeof statsObj.bhtRequests !== 'undefined') {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SET DAILY BHT REQUESTS: " + statsObj.bhtRequests));
            bhtRequests = statsObj.bhtRequests ;
          }

          if (typeof statsObj.promptsSent !== 'undefined') {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SET PROMPTS SENT: " + statsObj.promptsSent));
            promptsSent = statsObj.promptsSent ;
          }

          if (typeof statsObj.responsesReceived !== 'undefined') {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SET RESPONSES RECEIVED: " + statsObj.responsesReceived));
            responsesReceived = statsObj.responsesReceived ;
          }

          wordAssoServerStatsObj.bhtRequests = bhtRequests;
          wordAssoServerStatsObj.promptsSent = promptsSent;
          wordAssoServerStatsObj.responsesReceived = responsesReceived;

          saveStats(dropboxHostStatsFile, wordAssoServerStatsObj, function(status){
            if (status != 'OK'){
              console.error("!!! ERROR: saveStats " + status);
            }
            else {
              console.log(chalkLog("UPDATE DROPBOX STATUS OK"));
            }
          });

        });

      }

      return; //It's important to return so that the task callback isn't called twice
    }

    console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
      + " | ... LOADING STATS FROM DROPBOX FILE: " + dropboxHostStatsFile
    ));

    var statsObj = JSON.parse(statsJson);

    console.log("DROPBOX STATS\n" + JSON.stringify(statsObj, null, 3));

    console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | FOUND " + statsObj.name));

    if (typeof statsObj.bhtRequests !== 'undefined') {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SET DAILY BHT REQUESTS: " + statsObj.bhtRequests));
      bhtRequests = statsObj.bhtRequests ;
    }

    if (typeof statsObj.promptsSent !== 'undefined') {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SET PROMPTS SENT: " + statsObj.promptsSent));
      promptsSent = statsObj.promptsSent ;
    }

    if (typeof statsObj.responsesReceived !== 'undefined') {
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SET RESPONSES RECEIVED: " + statsObj.responsesReceived));
      responsesReceived = statsObj.responsesReceived ;
    }

    wordAssoServerStatsObj.bhtRequests = bhtRequests;
    wordAssoServerStatsObj.promptsSent = promptsSent;
    wordAssoServerStatsObj.responsesReceived = responsesReceived;

    saveStats(dropboxHostStatsFile, wordAssoServerStatsObj, function(status){
      if (status != 'OK'){
        console.error("!!! ERROR: saveStats " + status);
      }
      else {
        console.log(chalkLog("UPDATE DROPBOX STATUS OK"));
      }
    });
  });
}

//=================================
//  UPDATE STATUS
//=================================
loadStats();

setInterval(function () {
  updateStats({ 
    timeStamp : moment().format(defaultDateTimeFormat),
    upTime : msToTime(upTime),
    runTime : msToTime(runTime),
    heartbeat : txHeartbeat,

    numberAdmins : numberAdmins,
    numberUtils : numberUtils,

    numberUsers : numberUsers,
    numberUsersMax : numberUsersMax,
    numberUsersMaxTime : numberUsersMaxTime,

    numberTestUsers : numberTestUsers,
    numberTestUsersMax : numberTestUsersMax,
    numberTestUsersMaxTime : numberTestUsersMaxTime,

    numberUsersTotal : numberUsersTotal,
    numberUsersTotalMax : numberUsersTotalMax,
    numberUsersTotalMaxTime : numberUsersTotalMaxTime,

    numberViewers : numberViewers,
    numberViewersMax : numberViewersMax,
    numberViewersMaxTime : numberViewersMaxTime,

    numberTestViewers : numberTestViewers,

    promptsSent : promptsSent,
    responsesReceived: responsesReceived,

    bhtErrors: bhtErrors,
    bhtRequests: bhtRequests,

    mwRequests: mwRequests,

    totalSessions: totalSessions,
    sessionUpdatesSent: sessionUpdatesSent,

    totalWords: totalWords,
    wordCacheHits: wordCache.getStats().hits,
    wordCacheMisses: wordCache.getStats().misses,
    wordCacheTtl: wordCacheTtl
  });

  saveStats(dropboxHostStatsFile, wordAssoServerStatsObj, function(status){
    if (status != 'OK'){
      console.error("!!! ERROR: SAVE STATUS | FILE: " + dropboxHostStatsFile + "\n" + status);
    }
    else {
      // console.log(chalkLog("SAVE STATUS OK | FILE: " + dropboxHostStatsFile));
    }
  });
}, saveStatsInterval);


// ==================================================================
// MONGO DATABASE CONFIG
// ==================================================================

var db = mongoose();

var IpAddress = require('mongoose').model('IpAddress');

var Admin = require('mongoose').model('Admin');
var Viewer = require('mongoose').model('Viewer');

var User = require('mongoose').model('User');
var Session = require('mongoose').model('Session');
var Word = require('mongoose').model('Word');

var words = require('./app/controllers/word.server.controller');
var Oauth2credential = require('mongoose').model('Oauth2credential');

// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================
var app = express(); 

var http = require('http');
var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);
var dns = require('dns');
var path = require('path');
var net = require('net');
// var testClient = new net.Socket();

var googleOauthEvents = new EventEmitter();

var Queue = require('queue-fifo');
var socketQueue = new Queue();
var sessionQueue = new Queue();

var MAX_WORD_HASH_MAP_COUNT = 20 ;
var wordArray = [] ; // used to keep wordHashMap.count() < MAX_WORD_HASH_MAP_COUNT

var NodeCache = require( "node-cache" );

var adminCache = new NodeCache();
var viewerCache = new NodeCache();
var userCache = new NodeCache();

var wordCache = new NodeCache({ stdTTL: 0, checkperiod: 10 });

var sessionCache = new NodeCache({ stdTTL: sessionCacheTtl, checkperiod: 10 });

var promptQueue = new Queue();
var responseQueue = new Queue();
var responseRate1minQ = new Queue();
var promptArray = ["black"];

var dnsReverseLookupQueue = new Queue();

// ==================================================================
// GOOGLE
// ==================================================================
// ==================================================================
// GOOGLE INIT
// ==================================================================
var googleapis = require('googleapis');

var GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID ;
var GOOGLE_SERVICE_ACCOUNT_CLIENT_ID = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID;
var GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
var GOOGLE_SERVICE_ACCOUNT_KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
var GOOGLE_MONITORING_SCOPE = process.env.GOOGLE_MONITORING_SCOPE;

console.log("GOOGLE_PROJECT_ID: " + GOOGLE_PROJECT_ID);
console.log("GOOGLE_SERVICE_ACCOUNT_CLIENT_ID: " + GOOGLE_SERVICE_ACCOUNT_CLIENT_ID);
console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL: " + GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("GOOGLE_SERVICE_ACCOUNT_KEY_FILE: " + GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
console.log("GOOGLE_MONITORING_SCOPE: " + GOOGLE_MONITORING_SCOPE);

var disableGoogleMetrics = false;
if (process.env.GOOGLE_METRICS_DISABLE > 0) {
  disableGoogleMetrics = true ;
  console.log("GOOGLE_METRICS_DISABLE: " + disableGoogleMetrics);
}
else {
  console.log("GOOGLE_METRICS_DISABLE: " + disableGoogleMetrics);
}

var googleAuthorized = false ;
var googleAuthCode = 0;
var googleAuthExpiryDate = new Date() ;
var googleMetricsEnabled = false ;

var googleCheckDailyLimitInterval = 10 * ONE_MINUTE ;  // check every 10 minutes
var googleCheckSocketUpInterval = ONE_MINUTE;

var googleMonitoring ;
var googleOauthClient ;

if (!disableGoogleMetrics) {
  googleOauthClient = new googleapis.auth.JWT(
                              GOOGLE_SERVICE_ACCOUNT_EMAIL, 
                              GOOGLE_SERVICE_ACCOUNT_KEY_FILE, 
                              null, 
                              [GOOGLE_MONITORING_SCOPE]
                            );
}


var adminNameSpace = io.of("/admin");
var utilNameSpace = io.of("/util");
var userNameSpace = io.of("/user");
var viewNameSpace = io.of("/view");
var testUsersNameSpace = io.of("/test-user");
var testViewersNameSpace = io.of("/test-view");



// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  var milliseconds = parseInt((duration%1000)/100)
      , seconds = parseInt((duration/1000)%60)
      , minutes = parseInt((duration/(1000*60))%60)
      , hours = parseInt((duration/(1000*60*60))%24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds ;
}

function msToMinutes(duration) {
  var minutes = parseInt((duration/(1000*60))%60);
  return minutes ;
}

function getTimeNow() {
  var d = new Date();
  return d.getTime();
}

function getTimeStamp(inputTime) {

  var currentTimeStamp ;
  var options = {
    weekday: "none", year: "numeric", month: "numeric",
    day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit"
  };

  if (typeof inputTime === 'undefined') {
    currentTimeStamp = moment();
   }
  else if (moment.isMoment(inputTime)) {
    currentTimeStamp = moment(inputTime);
  }
  else {
    currentTimeStamp = moment(parseInt(inputTime));
  }
  return currentTimeStamp.format("YYYY-MM-DD HH:mm:ss ZZ");
}

// var randomIntFromInterval = function (min,max) {
//   return Math.floor(Math.random()*(max-min+1)+min);
// }

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

sessionCache.on( "expired", function(sessionId, sessionObj){
  sessionQueue.enqueue({sessionEvent: "SESSION_EXPIRED", sessionId: sessionId, session: sessionObj});
  io.of(sessionObj.namespace).to(sessionObj.sessionId).emit("SESSION_EXPIRED", "IDLE_TIMEOUT");
  debug("CACHE SESSION EXPIRED\n" + jsonPrint(sessionObj));
  debug("... CACHE SESS EXPIRED | " + sessionObj.sessionId 
    + " | NSP: " + sessionObj.namespace
    + " | LS: " + getTimeStamp(sessionObj.lastSeen)
    + " | " + msToTime(moment().valueOf() - sessionObj.lastSeen)
    + " | W: " + sessionObj.wordChain.length
    + " | K: " + sessionCache.getStats().keys
    + " | H: " + sessionCache.getStats().hits
    + " | M: " + sessionCache.getStats().misses
  );
});

wordCache.on( "expired", function(word, wordObj){
  debug("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
  debug("... CACHE WORD EXPIRED | " + wordObj.nodeId 
    + " | LS: " + getTimeStamp(wordObj.lastSeen)
    + " | " + msToTime(moment().valueOf() - wordObj.lastSeen)
    + " | M: " + wordObj.mentions
    + " | K: " + wordCache.getStats().keys
    + " | H: " + wordCache.getStats().hits
    + " | M: " + wordCache.getStats().misses
  );
});


var jsonPrint = function (obj){
  if (obj) {
    return JSON.stringify(obj, null, 2);
  }
  else {
    return "UNDEFINED";
  }
}

function readFileIntoArray (path, callback) {

 debug("PATH: " + path);

    fs.exists(path, function(exists) {
      if (exists) {
      fs.stat(path, function(error, stats) {
        fs.open(path, "r", function(error, fd) {
          var buffer = new Buffer(stats.size);
   
          fs.readFile(path, function(error, data) {
            debug(data);
            var dataNoSpaces = data.toString().replace(/ /g, "");
            var dataArray = dataNoSpaces.toString().split("\n");
            callback(error, dataArray) ;
            fs.close(fd);
          });
        });   
      });
    }
    else {
      console.error("??? FILE DOES NOT EXIST ??? " + path);
    }
  });
}

function dnsReverseLookup(ip, callback) {
  if (localHostHashMap.has(ip)) {
    console.log("dnsReverseLookup: DEVELOPMENT HOST: " + os.hostname() + " | " + ip);
    var domains =[];
    domains.push(localHostHashMap.get(ip));
    callback(null, domains);
  }
  else if (dnsHostHashMap.has(ip)) {
    var domains = dnsHostHashMap.get(ip) ;
    console.log("dnsReverseLookup: HOST IN HASHMAP : " + os.hostname() + " | " + ip + " | " + domains);
    callback(null, domains);
  }
  else {
    dns.reverse(ip, function(err, domains){
      if (err){
        console.error('\n\n***** ERROR: DNS REVERSE IP: ' + ip + '\n' + err + '\n');
        callback(err, null);
      }
      else {
        console.log('DNS REVERSE IP: ' + ip);
        dnsHostHashMap.set(ip, domains);
        domains.forEach(function(domain){
          console.log("DOMAIN: " + domain);
        });
        callback(null, domains);
      }
    });
  }
}

function updatePromptResponseMetric(sessionUpdateObj){
  debug("PROMPT-RESPONSE RATE FIFO PUSH: NOW: " + getTimeNow() 
    + " | PROMPT-RESPONSE SESSION: " + sessionUpdateObj.sessionId);
  responseRate1minQ.enqueue(moment.utc());
}

var statsCountsComplete = true ;

function updateStatsCounts(){

  if (statsCountsComplete) {

    statsCountsComplete = false ;

    var uComplete = false;
    var sComplete = false;
    var wComplete = false;

    User.count({}, function(err,count){
      if (!err){ 
        // console.log("TOTAL USERS: " + count);
        totalUsers = count ;
        updateStats({totalUsers: totalUsers});
        uComplete = true ;

        Session.count({}, function(err,count){
          if (!err){ 
            // console.log("TOTAL SESSIONS: " + count);
            totalSessions = count ;
            updateStats({totalSessions: totalSessions});
            sComplete = true ;

            Word.count({}, function(err,count){
              statsCountsComplete = true ;
              if (!err){ 
                // console.log("TOTAL WORDS: " + count);
                totalWords = count ;
                updateStats({totalWords: totalWords});
                wComplete = true ;
                return;
              } 
              else {
                console.error(chalkError("\n*** DB Word.count ERROR *** | " 
                  + moment().format(defaultDateTimeFormat) + "\n" + err));
                return;
              }
            });
          } 
          else {
            console.error(chalkError("\n*** DB Session.count ERROR *** | " 
              + moment().format(defaultDateTimeFormat) + "\n" + err));
            return;
          }
        });
      } 
      else {
        console.error(chalkError("\n*** DB User.count ERROR *** | " 
          + moment().format(defaultDateTimeFormat) + "\n" + err));
        return;
      }
    });

  }
}

function updateSessionViews(sessionUpdateObj){

  updateStatsCounts();

  debug(chalkInfo(">>> TX SESSION_UPDATE"
    + " | " + sessionUpdateObj.sessionId
    // + " | " + jsonPrint(sessionUpdateObj.client.config)
    + " | " + sessionUpdateObj.sourceWord.nodeId
    + " --> " + sessionUpdateObj.targetWord.nodeId
  ));

  viewNameSpace.emit("SESSION_UPDATE", sessionUpdateObj);
  testViewersNameSpace.emit("SESSION_UPDATE", sessionUpdateObj);

  sessionUpdatesSent++ ;
  updateStats({ sessionUpdatesSent: sessionUpdatesSent });

  updatePromptResponseMetric(sessionUpdateObj);
}

var simpleChain = function(chain){
  var chainArray = [];
  for (var i=0; i<chain.length; i++){
    chainArray.push(chain[i].nodeId);
  }
  return chainArray;
}

function sendPrompt(sessionObj, promptWordObj){

  debug("sendPrompt: sessionObj\n" + jsonPrint(sessionObj));

  var currentSession = sessionCache.get(sessionObj.sessionId);
  var currentUser = userCache.get(sessionObj.userId);

  if (!currentSession){
    console.log("sendPrompt | sessionObj.sessionId NOT FOUND IN SESSION CACHE ... SKIPPING | " + sessionObj.sessionId);
    return;
  }
  else if (!currentUser){
    console.log("sendPrompt | " + sessionObj.userId + " NOT FOUND IN USER CACHE ... SKIPPING | " + sessionObj.sessionId);
    return;
  }
  else {
    // currentSession.wordChain.push(promptWordObj.nodeId);
    // sessionCache.set(currentSession.sessionId, currentSession);

    var sourceWordObj ;

    if (currentSession.wordChain.length >= 2) {

      var previousResponse = currentSession.wordChain[currentSession.wordChain.length-2];

      sourceWordObj = wordCache.get(previousResponse);

      debug("CHAIN: " + currentSession.wordChain);
      console.log(chalkPrompt("P-> "
        + currentUser.userId 
        + " | " + sessionObj.sessionId 
        + " | " + sessionObj.config.type 
        + " | " + previousResponse + " --> " + promptWordObj.nodeId));

    } else {

      sourceWordObj = promptWordObj;

      console.log(chalkPrompt("P-> "
        + currentUser.userId 
        + " | " + sessionObj.sessionId 
        + " | " + sessionObj.config.type 
        + " | START --> " + promptWordObj.nodeId));
    }

    io.of(currentSession.namespace).to(currentSession.sessionId).emit('PROMPT_WORD_OBJ',promptWordObj);

    promptsSent++ ;
    deltaPromptsSent++;

    var sessionUpdateObj = {
      sessionId: currentSession.sessionId,
      sourceWord: sourceWordObj,
      targetWord: promptWordObj
    };

    updateSessionViews(sessionUpdateObj);

    updateStats({ promptsSent: promptsSent });
  }


}

// BHT
var wordTypes = [ 'noun', 'verb', 'adjective', 'adverb' ];
var wordVariations = [ 'syn', 'ant', 'rel', 'sim', 'usr' ];

function dbUpdateWord(wordObj, incMentions, callback){

  if ((wordObj.nodeId == null) || (typeof wordObj.nodeId === 'undefined')) {
    console.error(chalkError("\n***** dbUpdateWord: NULL OR UNDEFINED nodeId\n" + jsonPrint(wordObj)));
    callback("NULL OR UNDEFINED nodeId", wordObj);
    return;
  }

  words.findOneWord(wordObj, incMentions, function(err, word){
    if (err) {
      console.log(chalkError("dbUpdateWord -- > findOneWord ERROR" 
        + "\n" + JSON.stringify(err)
        + "\n" + JSON.stringify(wordObj, null, 2)
      ));
      callback(err, wordObj);
    }
    else {

      debug ("dbUpdateWord ->- DB UPDATE | " + word.nodeId 
        + " | MNS: " + word.mentions 
        + " | BHT SEARCHED: " + word.bhtSearched
        + " | BHT FOUND: " + word.bhtFound
        );

      debug(JSON.stringify(word, null, 3));

      if (!word.bhtSearched) {  // not yet bht searched
        debug("word.bhtSearched: " + word.bhtSearched);

        bhtSearchWord(word, function(status, bhtResponseObj){
          if (status.indexOf("BHT_OVER_LIMIT") >= 0) {
            debug(chalkError("bhtSearchWord BHT OVER LIMI"));
            wordCache.set(word.nodeId, word);
            callback('BHT_OVER_LIMIT', word);
          }
          else if (status.indexOf("BHT_ERROR") >= 0) {
            debug(chalkError("bhtSearchWord dbUpdateWord findOneWord ERROR\n" + JSON.stringify(status)));
            wordCache.set(word.nodeId, word);
            callback('BHT_ERROR', word);
          }
          else if (bhtResponseObj.bhtFound){
            debug(chalkBht("-*- BHT HIT   | " + bhtResponseObj.nodeId));
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_HIT', bhtResponseObj);
          }
          else if (status == 'BHT_REDIRECT') {
            debug(chalkBht("-A- BHT REDIRECT  | " + wordObj.nodeId));
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_REDIRECT', bhtResponseObj);
          }
          else {
            debug(chalkBht("-O- BHT MISS  | " + wordObj.nodeId));
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj);
            callback('BHT_MISS', bhtResponseObj);
          }
        });
      }
      else if (word.bhtFound){
        debug(chalkBht("-F- BHT FOUND | " + word.nodeId));
        wordCache.set(word.nodeId, word);
        callback('BHT_FOUND', word);
      }
      else {
        debug(chalkBht("-N- BHT NOT FOUND  | " + word.nodeId));
        wordCache.set(word.nodeId, word);
        callback('BHT_NOT_FOUND', word);
      }
    }
  });
}

function loadBhtResponseHash(bhtResponseObj, callback){

  var bhtWordHashMap = new HashMap();

  wordTypes.forEach(function(wordType){
    debug("wordType: " + wordType);
    if ((typeof  bhtResponseObj[wordType] !== 'undefined')
        && (bhtResponseObj[wordType] != null)){
      debug("FOUND wordType: " + wordType);
      wordVariations.forEach(function(wordVariation){
        debug("wordVariation: " + wordVariation);
        if ((typeof bhtResponseObj[wordType][wordVariation] !== 'undefined') 
          && (bhtResponseObj[wordType][wordVariation] != null)){
          debug("FOUND wordVariation: " + wordVariation);
          var wordArry = bhtResponseObj[wordType][wordVariation] ;
          wordArry.forEach(function(word){
            bhtWordHashMap.set(word, bhtResponseObj.nodeId);
            debug(bhtResponseObj.nodeId 
              + " | " + wordType
              + " | " + wordVariation
              + " | " + word
            );
          })
        }
      })
    }
  });
  callback(bhtWordHashMap);
}

function bhtHttpGet(host, path, wordObj, callback){

  http.get({host: host, path: path}, function(response) {

    debug("bhtHttpGet: " + host + "/" + path);
    
    response.on('error', function(err) {
      bhtErrors++;
      console.log(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors
        + " | WORD: " + wordObj.nodeId
        + " | STATUS CODE: " + response.statusCode
        + " | STATUS MESSAGE: " + response.statusMessage
        + "\n" + util.inspect(err, {showHidden: false, depth: 3})
      ));
      callback("BHT_ERROR | " + err, wordObj);
      return;
    });

    var body = '';
    var status = '';

    if ((response.statusCode == 500) && (response.statusMessage == 'Usage Exceeded')){
      bhtErrors++;
      console.log(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors
        + " | WORD: " + wordObj.nodeId
        + " | STATUS CODE: " + response.statusCode
        + " | STATUS MESSAGE: " + response.statusMessage
        // + "\n" + util.inspect(response, {showHidden: false, depth: 3})
      ));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
      return ;
    }
    else if ((response.statusCode == 500) && (response.statusMessage == 'Inactive key')){
      bhtErrors++;
      console.log(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors
        + " | WORD: " + wordObj.nodeId
        + " | STATUS CODE: " + response.statusCode
        + " | STATUS MESSAGE: " + response.statusMessage
        + "\n" + util.inspect(response, {showHidden: false, depth: 3})
      ));
      bhtEvents.emit("BHT_INACTIVE_KEY", bhtRequests);
      callback("BHT_INACTIVE_KEY", wordObj);
      return ;
    }
    else if (bhtOverLimitTestFlag) {
      console.log(chalkBht("BHT OVER LIMIT TEST FLAG SET"));
      bhtEvents.emit("BHT_OVER_LIMIT", bhtRequests);
      callback("BHT_OVER_LIMIT", wordObj);
      return ;
    }
    else if (response.statusCode == 404) {
      debug("bhtHttpGet: \'" + wordObj.nodeId + "\' NOT FOUND");
      wordObj.bhtSearched = true ;
      wordObj.bhtFound = false ;
      words.findOneWord(wordObj, true, function(err, wordUpdatedObj){
        debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " + wordUpdatedObj.nodeId 
          + " | MNS: " + wordUpdatedObj.mentions
        ));
        debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
        callback("BHT_NOT_FOUND", wordUpdatedObj);
        return ;
      });
    }
    else if (response.statusCode == 303){
      wordObj.bhtAlt = response.statusMessage;
      console.log(chalkBht("BHT REDIRECT" 
        + " | WORD: " + wordObj.nodeId
        + " | ALT: " + response.statusMessage  // alternative word
        + " | " + response.headers.location
      ));
      words.findOneWord(wordObj, true, function(err, wordUpdatedObj){
        if (err) {
          console.log(chalkError("bhtHttpGet: findOneWord: DB ERROR\n" 
            + "\n" + util.inspect(err, {showHidden: false, depth: 3})
          ));
          callback("BHT_ERROR | " + err, wordObj);
          return;
        }
        else {
          console.log(chalkBht("bhtHttpGet: ->- DB ALT UPDATE | " 
            + wordUpdatedObj.nodeId 
            + " | ALT: " + wordUpdatedObj.bhtAlt  // alternative word
            + " | MNS: " + wordUpdatedObj.mentions
          ));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback('BHT_REDIRECT', wordUpdatedObj);
          return;
        }
      });
    }
    else if (response.statusCode != 200){
      bhtErrors++;
      console.log(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors
        + " | WORD: " + wordObj.nodeId
        + " | STATUS CODE: " + response.statusCode
        + " | STATUS MESSAGE: " + response.statusMessage
        + "\n" + util.inspect(response, {showHidden: false, depth: 3})
      ));
      bhtEvents.emit("BHT_UNKNOWN_STATUS", bhtRequests);
      callback("BHT_UNKNOWN_STATUS", wordObj);
      return ;
    }
    else {
      response.on('data', function(d) {
        body += d;
      });

      response.on('end', function() {
      
        if (body != ''){
          var parsed = JSON.parse(body);
          debug("bhtHttpGet: " + JSON.stringify(parsed, null, 3));
          if (typeof parsed.noun !== null) wordObj.noun = parsed.noun ;
          if (typeof parsed.verb !== null) wordObj.verb = parsed.verb ;
          if (typeof parsed.adjective !== null) wordObj.adjective = parsed.adjective ;
          if (typeof parsed.adverb !== null) wordObj.adverb = parsed.adverb ;
          status = "BHT_HIT";
          wordObj.bhtSearched = true ;
          wordObj.bhtFound = true ;
        }
        else {
          debug("bhtHttpGet: \'" + wordObj.nodeId + "\' NOT FOUND");
          status = "BHT_MISS";
          wordObj.bhtSearched = true ;
          wordObj.bhtFound = false ;
        }

        words.findOneWord(wordObj, true, function(err, wordUpdatedObj){
          debug(chalkBht("bhtHttpGet: ->- DB UPDATE | " 
            + wordUpdatedObj.nodeId 
            + " | MNS: " + wordUpdatedObj.mentions
          ));
          debug(chalkBht(JSON.stringify(wordUpdatedObj, null, 3)));
          callback(status, wordUpdatedObj);
          return;
        });
      });
    }
  }).on('error', function(e) {
      bhtErrors++;
      console.log(chalkError("BHT ERROR" 
        + " | TOTAL ERRORS: " + bhtErrors
        + " | WORD: " + wordObj.nodeId
        + " | STATUS CODE: " + response.statusCode
        + " | STATUS MESSAGE: " + response.statusMessage
        + "\n" + util.inspect(e, {showHidden: false, depth: 3})
      ));
      callback("BHT_ERROR", wordObj);
    });
}

function generatePrompt(query, callback){
  console.log("->- GEN PROMPT | " + query.input + " | " + query.algorithm.toUpperCase());

// wordVariations = [ 'syn', 'ant', 'rel', 'sim', 'usr' ]

  switch (query.algorithm) {
    case 'antonym':
      words.getWordVariation(query.input, wordTypes, ['ant'], function(status, antWordObj){
        if (status == 'BHT_VAR_HIT') {
          // console.log("randomWordObj: " + randomWordObj.nodeId);
          wordCache.set(antWordObj.nodeId, antWordObj);
          callback('OK', antWordObj);
          return;
        }
        else if (status == 'BHT_VAR_MISS') {
          words.getRandomWord(function(err, randomWordObj){
            if (!err) {
              console.log("-G- GEN RANDOM - ANT MISS: " + randomWordObj.nodeId);
              wordCache.set(randomWordObj.nodeId, randomWordObj);
              callback('OK', randomWordObj);
              return;
            }
            else {
              console.error("*** GENERATE PROMPT ERROR | " + status);
              callback('ERROR', status);
              return;
            }
          });
        }
        else {
          console.error("*** GENERATE PROMPT ERROR | " + status);
          callback('ERROR', status);
          return;
        }
      });
      break;
    case 'synonym':
      words.getWordVariation(query.input, wordTypes, ['syn', 'sim'], function(status, synWordObj){
        if (status == 'BHT_VAR_HIT') {
          // console.log("randomWordObj: " + randomWordObj.nodeId);
          wordCache.set(synWordObj.nodeId, synWordObj);
          callback('OK', synWordObj);
          return;
        }
        else if (status == 'BHT_VAR_MISS') {
          words.getRandomWord(function(err, randomWordObj){
            if (!err) {
              console.log("-G- GEN RANDOM - SYN MISS: " + randomWordObj.nodeId);
              wordCache.set(randomWordObj.nodeId, randomWordObj);
              callback('OK', randomWordObj);
              return;
            }
            else {
              console.error("*** GENERATE PROMPT ERROR | " + status);
              callback('ERROR', status);
              return;
            }
          });
        }
        else {
          console.error("*** GENERATE PROMPT ERROR | " + status);
          callback('ERROR', status);
          return;
        }
      });
      break;
    default: // 'random':
      words.getRandomWord(function(err, randomWordObj){
        if (!err) {
          // console.log("randomWordObj: " + randomWordObj.nodeId);
          wordCache.set(randomWordObj.nodeId, randomWordObj);
          callback('OK', randomWordObj);
          return;
        }
        else {
          callback('ERROR', err);
          return;
        }
      });
      break;
  }
}

bhtEvents.on("BHT_OVER_LIMIT_TIMEOUT", function(){
  if (bhtOverLimitFlag) {
    console.log(chalkBht("*** BHT_OVER_LIMIT_TIMEOUT END *** | " + moment().format(defaultDateTimeFormat)));
  }
  else {
    console.log(chalkBht(" BHT_OVER_LIMIT_TIMEOUT END (NO OVER LIMIT) | " + moment().format(defaultDateTimeFormat)));
  }

  bhtOverLimitFlag = false ;
  bhtOverLimitTestFlag = false ;
  setBhtReqs(0);

  bhtOverLimitTime = moment.utc();
  bhtOverLimitTime.utcOffset("-08:00");

  bhtLimitResetTime = moment.utc();
  bhtLimitResetTime.utcOffset("-08:00");
  bhtLimitResetTime.endOf("day");

  updateStats({ 
    bhtRequests : bhtRequests,
    bhtOverLimitTime : bhtOverLimitTime,
    bhtLimitResetTime : bhtLimitResetTime,
    bhtOverLimitFlag : bhtOverLimitFlag
  });

  bhtTimeToReset = bhtLimitResetTime.valueOf() - bhtOverLimitTime.valueOf();

  clearTimeout(bhtOverLimitTimeOut);

  bhtOverLimitTimeOut = setTimeout(function () {
    bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
  }, bhtTimeToReset);

});

bhtEvents.on("BHT_OVER_LIMIT", function(){

  bhtOverLimits++ ;
  bhtOverLimitFlag = true ;
  bhtOverLimitTestFlag = false ;

  bhtOverLimitTime = moment.utc();
  bhtOverLimitTime.utcOffset("-08:00");

  bhtLimitResetTime = moment.utc();
  bhtLimitResetTime.utcOffset("-08:00");
  bhtLimitResetTime.endOf("day");

  // bhtTimeToReset = moment(bhtLimitResetTime);
  // bhtTimeToReset.subtract(bhtOverLimitTime);
  bhtTimeToReset = bhtLimitResetTime.valueOf() - bhtOverLimitTime.valueOf();

  console.log(chalkBht("bhtSearchWord: *** OVER LIMIT *** | " + bhtRequests + " REQUESTS"));
  console.log(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT OVER LIMIT TIME:      " 
    + bhtOverLimitTime.format(defaultDateTimeFormat)));
  console.log(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT LIMIT RESET TIME:     " 
    + bhtLimitResetTime.format(defaultDateTimeFormat)));
  console.log(chalkBht("bhtSearchWord: *** OVER LIMIT *** | BHT OVER LIMIT REMAINING: " 
    + msToTime(bhtTimeToReset)
  ));

  console.log("SET BHT REQUESTS TO LIMIT: " + BHT_REQUEST_LIMIT);
  bhtRequests = BHT_REQUEST_LIMIT ;
  console.log("SET bhtOverLimitTimeOut = " + msToTime(bhtTimeToReset) + " | " + bhtTimeToReset + " ms");

  updateStats({
    "bhtOverLimits" : bhtOverLimits,
    "bhtOverLimitTime" : bhtOverLimitTime,
    "bhtRequests" : BHT_REQUEST_LIMIT
  });

  clearTimeout(bhtOverLimitTimeOut);

  bhtOverLimitTimeOut = setTimeout(function () {
    bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
  }, bhtTimeToReset);
});

function bhtSearchWord (wordObj, callback){

  if (wordObj.bhtFound) {
    callback("BHT_FOUND", wordObj);
    return ;
  }

  else if (bhtOverLimitFlag) {

    var now = moment.utc();
    now.utcOffset("-08:00");

    console.log(chalkBht("*** BHT OVER LIMIT"
     + " | LIMIT: " + BHT_REQUEST_LIMIT
     + " | REQS: " + bhtRequests
     + " | OVER: " + bhtOverLimitTime.format(defaultDateTimeFormat)
     + " | RESET: " + bhtLimitResetTime.format(defaultDateTimeFormat)
     + " | REMAIN: " + msToTime(bhtLimitResetTime.diff(now))
    ));
    callback("BHT_OVER_LIMIT", wordObj);
    return ;
  }

  else {

    incrementSocketBhtReqs(1);

    debug(chalkBht(">>> BHT SEARCH (before replace): " + wordObj.nodeId));

    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ');
    wordObj.nodeId = wordObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=]+/g, '') ;
    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ') ;
    wordObj.nodeId = wordObj.nodeId.replace(/^\s+|\s+$/g, '') ;
    wordObj.nodeId = wordObj.nodeId.replace(/\'+/g, "'") ;
    wordObj.nodeId = wordObj.nodeId.toLowerCase();

    debug(chalkBht(">>> BHT SEARCH (after replace):  " + wordObj.nodeId));

    var bhtHost = "words.bighugelabs.com";
    var path = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(wordObj.nodeId) + "/json";

    bhtHttpGet(bhtHost, path, wordObj, function(status, bhtResponseObj){
      if (status == 'BHT_REDIRECT'){
        var pathRedirect = "/api/2/" + bigHugeLabsApiKey + "/" + encodeURI(bhtResponseObj.bhtAlt) + "/json";
        bhtHttpGet(bhtHost, pathRedirect, bhtResponseObj, function(statusRedirect, responseRedirectObj){
          callback(statusRedirect, responseRedirectObj);
        });
      }
      else {
        callback(status, bhtResponseObj);
      }
    });
  }
}

function chainDeadEnd(chain) {

  if (chain.length > 6) { 

    var uniqueNodes = [];

    for (var i = chain.length-1; i >= chain.length-6; i--){

      if (uniqueNodes.indexOf(chain[i].nodeId) == -1){

        if (uniqueNodes.length > 3) {
          debug("... NO CHAIN FREEZE | " + jsonPrint(uniqueNodes));
          return false ;
        }
        else if (i == chain.length-6){
          console.log(chalkResponse("*** CHAIN FREEZE | " + uniqueNodes)); 
          return true ;
        }
        else {
          uniqueNodes.push(chain[i].nodeId);
        }

      }
    }

  }
  else {
    debug("... NO CHAIN FREEZE | " + jsonPrint(uniqueNodes));
    return false ;
  }
 }

function incrementDeltaBhtReqs(delta){
  var d = parseInt(delta);
  if (d == 0) {
    deltaBhtRequests = 0 ;
  }
  else {
    deltaBhtRequests += d;
  }
}

function incrementDeltaMwReqs(delta){
  var d = parseInt(delta);
  if (d == 0) {
    deltaMwRequests = 0 ;
  }
  else {
    deltaMwRequests += d;
  }
}

function setWordCacheTtl(value){
  console.log(chalkWarn("SET WORD CACHE TTL: PREV: " + wordCacheTtl + " | NOW: " + value));
  wordCacheTtl = parseInt(value) ;
  updateStats({ wordCacheTtl: wordCacheTtl });
}

function setBhtReqs(value){
  console.log(chalkInfo("SET BHT REQS: PREV: " + bhtRequests + " | NOW: " + value));
  bhtRequests = parseInt(value) ;
  updateStats({ bhtRequests: bhtRequests });
}

function incrementSocketBhtReqs(delta){

  if ((bhtRequests >= BHT_REQUEST_LIMIT) || ((bhtRequests+delta) > BHT_REQUEST_LIMIT)){
    console.log(chalkInfo("!!! incrementSocketBhtReqs: AT BHT_REQUEST_LIMIT: " + bhtRequests + " | NOW: " + BHT_REQUEST_LIMIT));
    bhtRequests = BHT_REQUEST_LIMIT ;
  }
  else if (delta > 0) {
    bhtRequests += delta;
    var remain = BHT_REQUEST_LIMIT - bhtRequests ;
    console.log(chalkInfo("-#- BHT REQS: " + bhtRequests
      + " | DELTA: " + delta
      + " | LIMIT: " + BHT_REQUEST_LIMIT
      + " | REMAIN: " + remain
    ));
    incrementDeltaBhtReqs(delta);
  }
}

function incrementSocketMwReqs(delta){

  if ((mwRequests > MW_REQUEST_LIMIT) || ((mwRequests+delta) > MW_REQUEST_LIMIT)){
    console.log(chalkInfo("!!! incrementSocketMwReqs: AT MW_REQUEST_LIMIT: " + mwRequests + " | NOW: " + MW_REQUEST_LIMIT));
    mwRequests = MW_REQUEST_LIMIT ;
  }
  else if (delta > 0) {
    mwRequests += delta;
    var remain = MW_REQUEST_LIMIT - mwRequests ;
    console.log(chalkInfo("-#- MW  REQS: " + mwRequests
      + " | DELTA: " + delta
      + " | LIMIT: " + MW_REQUEST_LIMIT
      + " | REMAIN: " + remain
    ));
    incrementDeltaMwReqs(delta);
  }
}

function sessionUpdateDb (sessionObj, callback) {

  // debug("sessionUpdateDb: sessionObj: " + JSON.stringify(sessionObj, null, 3));
  // debug("sessionConnectDb: sessionObj: " + util.inspect(sessionObj, {showHidden: false, depth: 1}));

  var query = { sessionId: sessionObj.sessionId };

  var update = { 
          $set: { 
            "config": sessionObj.config,
            "userId": sessionObj.userId,
            "namespace": sessionObj.namespace,
            "ip": sessionObj.ip,
            "domain": sessionObj.domain,
            "lastSeen": sessionObj.lastSeen,
            "connected": sessionObj.connected,
            "connectTime": sessionObj.connectTime,
            "disconnectTime": sessionObj.disconnectTime,
            "wordChain": sessionObj.wordChain
            },
          };

  var options = { upsert: true, new: true };

  Session.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ses) {
      if (err) {
        console.error("!!! SESSION FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat)
          + " | " + sessionObj.sessionId 
          + "\n" + err);
        callback(err, sessionObj);
      }
      else {
        debug(chalkSession("SESSION UPDATED" 
          + " | " + ses.sessionId
          + " | NSP: " + ses.namespace 
          + " | UID: " + ses.userId 
          + " | IP: " + ses.ip 
          + " | DOM: " + ses.domain 
          + " | CON: " + ses.connected 
          + " | WCL: " + ses.wordChain.length 
          + "\nCONFIG\n" + jsonPrint(ses.config) 
        ));
        callback(null, ses);
      }
    }
  );
}

function findSessionById(sessionId, callback){

  var query = { sessionId: sessionId  };

  Session.findOne(
    query,
    function(err, session) {
      if (err) {
        console.error(chalkError("!!! SESSION FINDONE ERROR: "
         + moment().format(defaultDateTimeFormat) 
         + "\nSESSION ID: "  + sessionId 
         + "\n" + err));
        callback(err, null);  
      }
      else if (session) {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SESSION FOUND\n" + jsonPrint(session)));
        callback(null, session);      
      }
      else {
        console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | SESSION NOT FOUND"));
        callback(null, null);      
      }
    }
  );
}

function adminUpdateDb (adminObj, callback) {

  if (adminObj.ip && (typeof adminObj.domain === 'undefined')) {
    dnsReverseLookup(adminObj.ip, function(err, domains){
      if (domains[0]) {
        adminObj.domain = domains[0];
        console.log("adminUpdateDb: UPDATED DOMAIN | " + adminObj.userId + " | " + adminObj.domain);
      }
    });
  }

  var query = { adminId: adminObj.adminId };
  var update = { 
          $set: { 
            "screenName": adminObj.screenName,
            "domain": adminObj.domain,
            "namespace": adminObj.namespace,
            "ip": adminObj.ip,
            "sessionId": adminObj.lastSession,
            "description": adminObj.description,
            "url": adminObj.url,
            "profileUrl": adminObj.profileUrl,
            "profileImageUrl": adminObj.profileImageUrl,
            "verified": adminObj.verified,
            "lastSeen": adminObj.lastSeen,
            "lastSession": adminObj.lastSession,
            "connectTime": adminObj.connectTime,
            "disconnectTime": adminObj.disconnectTime,
            "connected": adminObj.connected
          },
          $push: { "sessions": adminObj.lastSession } 
        };
  var options = { upsert: true, new: true };

  Admin.findOneAndUpdate(
    query,
    update,
    options,
    function(err, ad) {
      if (err) {
        console.error("!!! ADMIN FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat)
          + " | " + adminObj.adminId 
          + "\nQUERY: " + jsonPrint(query)
          + "\nUPDATE: " + jsonPrint(update)
          + "\nOPTIONS: " + jsonPrint(options)
          + "\nERROR: " + jsonPrint(err)
          );
        callback(err, adminObj);
        return;
      }
      else {
        console.log(">>> ADMIN UPDATED" 
          + " | " + ad.adminId
          + " | IP: " + ad.ip
          + " | DOM: " + ad.domain
          + " | SID: " + ad.sessionId
          + " | SN: " + ad.screenName 
          // + " | DES: " + us.description 
          // + " | URL: " + us.url 
          // + " | PURL: " + us.profileUrl 
          // + " | PIURL: " + us.profileImageUrl 
          + " | VER: " + ad.verified
          + " | LS: " + getTimeStamp(ad.lastSeen)
          + " | SES: " + ad.sessions.length
          + " | LSES: " + ad.lastSession
          + " | CON: " + ad.connected
          );
        callback(null, ad);
        return;
      }
    }
  );
}

function viewerUpdateDb (viewerObj, callback) {

  var query = { viewerId: viewerObj.viewerId };
  var update = { 
          $set: { 
            "namespace": viewerObj.namespace,
            "domain": viewerObj.domain,
            "ip": viewerObj.ip,
            "sessionId": viewerObj.lastSession,
            "screenName": viewerObj.screenName,
            "description": viewerObj.description,
            "url": viewerObj.url,
            "profileUrl": viewerObj.profileUrl,
            "profileImageUrl": viewerObj.profileImageUrl,
            "verified": viewerObj.verified,
            "lastSeen": moment(),
            "lastSession": viewerObj.lastSession,
            "connectTime": viewerObj.connectTime,
            "disconnectTime": viewerObj.disconnectTime,
            "connected": viewerObj.connected
          },
          $push: { "sessions": viewerObj.lastSession } 
        };
  var options = { upsert: true, new: true };

  Viewer.findOneAndUpdate(
    query,
    update,
    options,
    function(err, vw) {
      if (err) {
        console.error("!!! VIEWER FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat)
          + " | " + viewerObj.viewerId 
          + "\n" + err);
        callback(err, viewerObj);
      }
      else {
        console.log(">>> VIEWER UPDATED" 
          + " | " + vw.viewerId
          + " | SN: " + vw.screenName 
          + " | NSP: " + vw.namespace
          + " | IP: " + vw.ip
          + " | DOM: " + vw.domain
          + " | SID: " + vw.sessionId
          // + " | DES: " + us.description 
          // + " | URL: " + us.url 
          // + " | PURL: " + us.profileUrl 
          // + " | PIURL: " + us.profileImageUrl 
          + " | VER: " + vw.verified
          + " | LS: " + getTimeStamp(vw.lastSeen)
          + " | SES: " + vw.sessions.length
          + " | LSES: " + vw.lastSession
          );
        callback(null, vw);
      }
    }
  );
}

function userUpdateDb (userObj, callback) {

  if (userObj.ip && (typeof userObj.domain === 'undefined')) {
    dnsReverseLookup(userObj.ip, function(err, domains){
      if (err){
        console.error(chalkError("*** dnsReverseLookup ERROR\n" + err));
      }
      else {
        if (domains[0]) {
          userObj.domain = domains[0];
          console.log("userUpdateDb: UPDATED DOMAIN | " + userObj.userId + " | " + userObj.domain);
        }
      }
    });
  }

  // if (dnsHostHashMap.has(userObj.ip)) {
  //   userObj.domain = dnsHostHashMap.get(userObj.ip);
  //   console.log("userUpdateDb: UPDATED DOMAIN | " + userObj.userId + " | " + userObj.domain);
  // }

  var query = { userId: userObj.userId };
  var update = { 
          $set: { 
            "namespace": userObj.namespace,
            "domain": userObj.domain,
            "ip": userObj.ip,
            "sessionId": userObj.lastSession,
            "screenName": userObj.screenName,
            "description": userObj.description,
            "url": userObj.url,
            "profileUrl": userObj.profileUrl,
            "profileImageUrl": userObj.profileImageUrl,
            "verified": userObj.verified,
            "lastSeen": userObj.lastSeen,
            "lastSession": userObj.lastSession,
            "connectTime": userObj.connectTime,
            "disconnectTime": userObj.disconnectTime,
            "connected": userObj.connected
          },
          $push: { "sessions": userObj.lastSession } 
        };
  var options = { upsert: true, new: true };

  User.findOneAndUpdate(
    query,
    update,
    options,
    function(err, us) {
      if (err) {
        console.error("!!! USER FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat)
          + " | " + userObj.userId 
          + "\n" + err);
        callback(err, userObj);
      }
      else {
        console.log(chalkUser(">>> USER UPDATED" 
          + " | " + us.userId
          + " | SN: " + us.screenName 
          + " | NSP: " + us.namespace
          + " | IP: " + us.ip
          + " | DOM: " + us.domain
          + " | SID: " + us.sessionId
          // + " | URL: " + us.url 
          // + " | PURL: " + us.profileUrl 
          // + " | PIURL: " + us.profileImageUrl 
          + " | VER: " + us.verified
          + " | LS: " + getTimeStamp(us.lastSeen)
          + " | SES: " + us.sessions.length
          + " | LSES: " + us.lastSession
          + " | CON: " + us.connected
        ));
        callback(null, us);
      }
    }
  );
}

function adminFindAllDb (options, callback) {

  console.log("\n=============================\nADMINS IN DB\n----------");
  if (options) console.log("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    adminId: true,
    namespace: true,
    sessionId: true,
    ip: true,
    domain: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true,
  };

  Admin.find(query, projections, options, function(err, admins) {
    if (err) {
      callback(err, null);
      return;
    }
    if (admins){

      async.forEach(

        admins,

        function(adminObj, callback){

          console.log(chalkAdmin("UID: " + adminObj.adminId
            + " | SN: " +  adminObj.screenName
            + " | LS: " + getTimeStamp(adminObj.lastSeen)
            // + "\n" + chalkLog(util.inspect(admins[i], {showHidden: false, depth: 1})
          ));

          if (!adminObj.adminId || typeof adminObj.adminId === 'undefined' || adminObj.adminId == null) {
            console.log(chalkError("*** ERROR: adminFindAllDb: ADMIN ID UNDEFINED *** | SKIPPING ADD TO CACHE"));
            callback("ERROR: ADMIN ID UNDEFINED", null);
            return;
          }
          else {
            var addCacheResult = adminCache.set(adminObj.adminId, adminObj);
            callback(null, addCacheResult);
            return;
          }

        },

        function(err){
          if (err) {
            console.error("*** ERROR  adminFindAllDb: " + err);
            callback(err, null);
            return;
          }
          else {
            console.log("FOUND " + admins.length + " ADMINS");
            callback(null, admins.length);
            return;
          }
        }
      );

    }
    else {
      console.log("NO ADMINS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function viewerFindAllDb (options, callback) {

  console.log("\n=============================\nVIEWERS IN DB\n----------");
  if (options) console.log("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    viewerId: true,
    namespace: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true,
  };

  Viewer.find(query, projections, options, function(err, viewers) {
    if (err) {
      callback(err, null);
      return;
    }
    if (viewers){

      async.forEach(

        viewers,

        function(viewer, callback){

          console.log(chalkViewer("UID: " + viewer.viewerId
            + " | SN: " +  viewer.screenName
            + " | LS: " + getTimeStamp(viewer.lastSeen)
            // + "\n" + chalkLog(util.inspect(viewers[i], {showHidden: false, depth: 1})
          ));

          viewerCache.set(viewer.viewerId, viewers);
          callback(null);

        },

        function(err){
          if (err) {
            console.error("*** ERROR  viewerFindAllDb\n" + err);
            callback(err, null);
            return;
          }
          else {
            console.log("FOUND " + viewers.length + " VIEWERS");
            callback(null, viewers.length);
            return;
          }
        }
      );

    }
    else {
      console.log("NO VIEWERS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function userFindAllDb (options, callback) {

  console.log("\n=============================\nUSERS IN DB\n----------");
  if (options) console.log("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    userId: true,
    namespace: true,
    sessionId: true,
    ip: true,
    domain: true,
    screenName: true,
    description: true,
    url: true,
    profileUrl: true,
    profileImageUrl: true,
    verified: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    connected: true,
  };

  User.find(query, projections, options, function(err, users) {
    if (err) {
      callback(err, null);
      return;
    }
    if (users){

      async.forEach(

        users,

        function(user, callback){

          console.log(chalkUser("UID: " + user.userId
            + " | SN: " +  user.screenName
            + " | LS: " + getTimeStamp(user.lastSeen)
            // + "\n" + chalkLog(util.inspect(users[i], {showHidden: false, depth: 1})
          ));

          userCache.set(user.userId, user);
          callback(null);

        },

        function(err){
          if (err) {
            console.error("*** ERROR  userFindAllDb\n" + err);
            callback(err, null);
            return;
          }
          else {
            console.log("FOUND " + users.length + " USERS");
            callback(null, users.length);
            return;
          }
        }
      );

    }
    else {
      console.log("NO USERS FOUND");
      callback(null, 0);
      return;
    }
  });
}

function ipAddressFindAllDb (options, callback) {

  console.log("\n=============================\nIP ADDRESSES IN DB\n----------");
  if (options) console.log("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    ipAddress: true,
    createdAt: true,
    lastSeen: true,
    lastSession: true,
    sessions: true
  };

  IpAddress.find(query, projections, options, function(err, ipAddressArray) {
    if (err) {
      callback(err, null);
      return;
    }
    if (ipAddressArray){

      async.forEach(

        ipAddressArray,

        function(ipAddress, callback){
          console.log(chalkUser("IP: " + ipAddress.ip
            + " | LSESS: " + ipAddress.lastSession
            + " | LS: " + getTimeStamp(ipAddress.lastSeen)
            + " | #SESS: " + ipAddress.sessions.length
            // + "\n" + chalkLog(util.inspect(users[i], {showHidden: false, depth: 1})
          ));

          ipAddressCache.set(ipAddress.ip, ipAddress);
          callback(null);
        },

        function(err){
          if (err) {
            console.error("*** ERROR  ipAddressFindAllDb\n" + err);
            callback(err, null);
            return;
          }
          else {
            console.log("FOUND " + ipAddressArray.length + " IP ADDRESSES");
            callback(null, ipAddressArray.length);
            return;
          }
        }
      );

    }
    else {
      console.log("NO IP ADDRESSES FOUND");
      callback(null, 0);
      return;
    }
  });
}

function dumpIoStats(){
  debug("\n-------------\nIO\n-------------"
    + "\nIO SOCKETS NAME: " + io.sockets.name
    + "\nSERVER:          " + util.inspect(io.sockets.server, {showHidden: false, depth: 2})
    + "\nCONNECTED:       " + util.inspect(io.sockets.connected, {showHidden: false, depth: 2})
    + "\nFNS:             " + io.sockets.fns
    + "\nIDS:             " + io.sockets.ids
    + "\nACKS:            " + util.inspect(io.sockets.acks, {showHidden: false, depth: 2})
    + "\n----------------------------");
}

function oauthExpiryTimer(endTime) {

  var remainingTime = msToTime(endTime - getTimeNow());

  debug("\nSET oauthExpiryTimer: " + getTimeStamp(endTime));
  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL EXPIRES IN: " + remainingTime 
    + " AT " + endTime
    ));

  var oauthInterval = setInterval(function () {

      remainingTime = msToTime(endTime - getTimeNow());

      if (endTime - getTimeNow() < 60000) {
        console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL EXPIRING IN " + remainingTime
        ));
      }

      if (getTimeNow() >= endTime) {
        console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL EXPIRED: " 
          + " | " + getTimeStamp(endTime)));
        clearInterval(oauthInterval);
        googleAuthorized = false ;
        googleMetricsEnabled = false ;
        googleOauthEvents.emit('GOOGLE OAUTH2 CREDENTIAL EXPIRED');
        googleOauthEvents.emit('AUTHORIZE GOOGLE');
      }

  }, 10000);
}

function authorizeGoogle(){
  googleOauthClient.authorize(function(err, tokens) {
    if (err){
      console.error(chalkError(moment().format(defaultDateTimeFormat) + " | ***** GOOGLE OAUTH ERROR: googleOauthClient " 
        + " | " + moment().format(defaultDateTimeFormat)
        + "\n" 
        + err
        + "\n" 
      ));
      googleOauthEvents.emit('GOOGLE OAUTH ERROR', err);
    }
    else {

      console.log("GOOGLE TOKEN\n" + jsonPrint(tokens));
      googleAuthExpiryDate = tokens.expiry_date;

      googleMonitoring = googleapis.cloudmonitoring({ version: 'v2beta2', auth: googleOauthClient});


      var credential = {
              credentialType: 'SERVICE ACCOUNT',
              clientId: GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
              emailAddress: GOOGLE_SERVICE_ACCOUNT_EMAIL,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tokenType: tokens.token_type,
              expiryDate: googleAuthExpiryDate,
              lastSeen: currentTime 
            }
      debug(chalkGoogle("\nGOOGLE OAUTH2 AUTHORIZED\n----------------------\nCREDENTIAL\n" 
        + JSON.stringify(tokens, null, 3)));

      findOneOauth2Credential(credential);
      googleAuthorized = true ;
      googleMetricsEnabled = true ;
      oauthExpiryTimer(tokens.expiry_date);

      console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
        + " | GOOGLE OAUTH2 AUTHORIZED: ExpiryDate: " + getTimeStamp(googleAuthExpiryDate)));
      googleOauthEvents.emit('GOOGLE AUTHORIZED', credential);
    }
  });
}

function findOneOauth2Credential (credential) {

  console.log("findOneOauth2Credential: credential\n" + jsonPrint(credential));

  var query = { clientId: credential.clientId  };
  var update = { 
          $inc: { mentions: 1 }, 
          $set: { 
            credentialType: credential.credentialType,
            clientId: credential.clientId,
            clientSecret: credential.clientSecret,
            emailAddress: credential.emailAddress,
            accessToken: credential.accessToken,
            refreshToken: credential.refreshToken,
            tokenType: credential.tokenType,
            expiryDate: credential.expiryDate,
            lastSeen: currentTime 
          } 
        };
  var options = { upsert: true, new: true };

  Oauth2credential.findOneAndUpdate(
    query,
    update,
    options,
    function(err, cred) {
      if (err) {
        console.error(chalkError(moment().format(defaultDateTimeFormat) + " | !!! OAUTH2 CREDENTIAL FINDONE ERROR" 
          + "\nCLIENT ID: "  + credential.clientId 
          + "\nERROR" + err
        ));
        return credential;
      }
      else {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE CREDENTIAL UPDATED"
          + " | EXPIRES AT " + cred.expiryDate
        ));
        console.log(chalkGoogle("\n\n--- OAUTH2 CREDENTIAL UPDATED---" 
          + "\nCREDENTIAL TYPE: " + cred.credentialType 
          + "\nCLIENT ID:       " + cred.clientId 
          + "\nCLIENT SECRET:   " + cred.clientSecret 
          + "\nEMAIL ADDR:      " + cred.emailAddress 
          + "\nTOKEN TYPE:      " + cred.tokenType 
          + "\nACCESS TOKEN:    " + cred.accessToken 
          + "\nREFRESH TOKEN:   " + cred.refreshToken 
          + "\nEXPIRY DATE:     " + cred.expiryDate
          // + "\nLAST SEEN:       " + getTimeStamp(Date(cred.lastSeen)) 
          + "\nLAST SEEN:       " + cred.lastSeen
          + "\nMENTIONS:        " + cred.mentions 
          + "\n--------------------------------\n\n" 
        ));
        var mentionsString = cred.mentions.toString() ;
        cred.mentions = mentionsString ;
        return cred;  
      }

    }
  );
}

function findCredential (clientId, callback) {

  var query = { clientId: clientId  };
  
  Oauth2credential.findOne(
    query,
    function(err, cred) {
      if (err) {
        console.error(chalkError("!!! OAUTH2 CREDENTIAL FINDONE ERROR: "
         + moment().format(defaultDateTimeFormat) 
         + "\nCLIENT ID: "  + clientId 
         + "\n" + err));
        googleOauthEvents.emit('credential error', clientId + "\n" + err);        
        callback(err);  
        // return;    
      }
      else if (cred) {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL FOUND"));
        debug(chalkGoogle("GOOGLE OAUTH2 CREDENTIAL\n--------------------------------\n" 
          + "\nCREDENTIAL TYPE: " + cred.credentialType 
          + "\nCLIENT ID:       " + cred.clientId 
          + "\nCLIENT SECRET:   " + cred.clientSecret 
          + "\nEMAIL ADDR:      " + cred.emailAddress 
          + "\nTOKEN TYPE:      " + cred.tokenType 
          + "\nACCESS TOKEN:    " + cred.accessToken 
          + "\nREFRESH TOKEN:   " + cred.refreshToken 
          + "\nEXPIRY DATE:     " + cred.expiryDate
          + "\nLAST SEEN:       " + getTimeStamp(cred.lastSeen) 
          + "\nMENTIONS:        " + cred.mentions 
          + "\n--------------------------------\n\n" 
        ));
        var mentionsString = cred.mentions.toString() ;
        cred.mentions = mentionsString ;
        googleOauthEvents.emit('GOOGLE CREDENTIAL FOUND', cred);  
        callback(cred);      
      }
      else {
        console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL NOT FOUND"));
        googleOauthEvents.emit('GOOGLE CREDENTIAL NOT FOUND', clientId);        
        callback(null);      
      }

    }
  );
}

var deltaPromptsSent = 0 ;
var deltaResponsesReceived = 0 ;
var deltaBhtRequests = 0;
var deltaMwRequests = 0;
var metricDateStart = moment().toJSON();
var metricDateEnd = moment().toJSON();  

function updateMetrics(googleMetricsUpdateFlag){

  if (heartbeatsSent%100 == 0) updateStatsCounts();

  metricDateStart = moment().toJSON();
  metricDateEnd = moment().toJSON();  
  // hopefully will avoid Google metric error Timeseries data must be more recent than previously-written data

  debug(moment().format(defaultDateTimeFormat) 
    + " | updateMetrics USERS: " + numberUsers 
    + " | PTX: " + promptsSent 
    + " | RRX: " + responsesReceived
    + " | STX: " + sessionUpdatesSent
    + " | BHTR: " + bhtRequests
    );


  // name: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers
  // label key: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers

  var statArray = [
    numberUsers,
    numberTestUsers,
    numberViewers,
    numberTestViewers,
    wordCache.getStats().keys,
    wordCache.getStats().hits,
    wordCache.getStats().misses,
    promptsSent,
    deltaPromptsSent,
    responsesReceived,
    deltaResponsesReceived,
    deltaBhtRequests,
    bhtRequests,
    totalWords
  ];

  if (googleMetricsUpdateFlag && (typeof googleMonitoring !== 'undefined')){
    googleMonitoring.timeseries.write({

      'project': GOOGLE_PROJECT_ID,

      'resource': {

         "timeseries": [

          {
           "point": {
            "int64Value": numberUsers,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/users/numberUsers" : "NUMBER USERS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/users"
           }
          },

          {
           "point": {
            "int64Value": numberTestUsers,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/users/numberTestUsers" : "NUMBER TEST USERS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/users"
           }
          },

          {
           "point": {
            "int64Value": numberViewers,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/viewers/numberViewers" : "NUMBER VIEWERS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/viewers"
           }
          },

          {
           "point": {
            "int64Value": numberTestViewers,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/viewers/numberTestViewers" : "NUMBER TEST VIEWERS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/viewers"
           }
          },

          {
           "point": {
            "int64Value": parseInt(100.0*(memoryTotal - memoryAvailable)/memoryTotal),
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/memory/memoryUsed" : "MEMORY USED"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/memory/memoryUsed"
           }
          },

          {
           "point": {
            "int64Value": wordCache.getStats().keys,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheKeys" : "WORD CACHE KEYS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheKeys"
           }
          },

          {
           "point": {
            "int64Value": wordCache.getStats().hits,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHits" : "WORD CACHE HITS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache"
           }
          },

          {
           "point": {
            "int64Value": wordCache.getStats().misses,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheMisses" : "WORD CACHE MISSES"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache"
           }
          },

          {
           "point": {
            "int64Value": parseInt(100 * wordCache.getStats().hits/(1 + wordCache.getStats().misses)),
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHitMissRatio" : "WORD CACHE HIT/MISS RATIO"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHitMissRatio"
           }
          },

          {
           "point": {
            "int64Value": promptsSent,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/prompts/totalPromptsSent" : "PROMPTS SENT"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/prompts/totalPromptsSent"
           }
          },

          {
           "point": {
            "int64Value": deltaPromptsSent,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/prompts/deltaPromptsSent" : "DELTA PROMPTS SENT"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/prompts/deltaPromptsSent"
           }
          },

          {
           "point": {
            "int64Value": responsesReceived,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/responses/totalResponsesReceived" : "RESPONSES RECEIVED"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/responses/totalResponsesReceived"
           }
          },

          {
           "point": {
            "int64Value": deltaResponsesReceived,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/responses/deltaResponsesReceived" : "DELTA RESPONSES RECEIVED"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/responses/deltaResponsesReceived"
           }
          },

          {
           "point": {
            "int64Value": deltaBhtRequests,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/bht/deltaBhtRequests" : "DELTA BHT REQUESTS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/bht/deltaBhtRequests"
           }
          },

          {
           "point": {
            "int64Value": bhtRequests,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { 
              "custom.cloudmonitoring.googleapis.com/word-asso/bht/numberBhtRequests" : "TOTAL DAILY BHT REQUESTS"
            },
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/bht/numberBhtRequests"
           }
          },

          {
           "point": {
            "int64Value": totalWords,
            "start": metricDateStart,
            "end": metricDateEnd
           },
           "timeseriesDesc": {
            "labels": { "custom.cloudmonitoring.googleapis.com/word-asso/words/totalWords" : "TOTAL WORDS IN DB"},
            "metric": "custom.cloudmonitoring.googleapis.com/word-asso/words/totalWords"
           }
          }

         ]
        }
      }, function(err, res){
        if (err) {
          console.error("!!! GOOGLE CLOUD MONITORING ERROR " 
            + " | " + moment().format(defaultDateTimeFormat) 
            + " | " + statArray
            + "\n" + util.inspect(err, {showHidden: false, depth: 3})
          );

          if (err.code == 500){
            console.warn(chalkGoogle("??? GOOGLE CLOUD MONITORING INTERNAL SERVER ERROR (CODE: 500)"));
          }

          if (err.toString().indexOf("Daily Limit Exceeded") >= 0){
            console.error(chalkGoogle("!!! GOOGLE CLOUD MONITORING DAILY LIMIT EXCEEDED ... DISABLING METRICS"));
            googleMetricsEnabled = false ;
            googleOauthEvents.emit("DAILY LIMIT EXCEEDED");
          }
          if (err.toString().indexOf("socket hang up") >= 0){
            console.error(chalkGoogle("!!! GOOGLE CLOUD MONITORING SOCKET HUNG UP ... DISABLING METRICS"));
            googleMetricsEnabled = false ;
            googleOauthEvents.emit("SOCKET HUNG UP");
          }
        }
        else {
          debug("GOOGLE MONITORING RESULT: " + jsonPrint(res));
        } 
    });
  }

  updateStats({deltaResponsesReceived: deltaResponsesReceived});

  deltaPromptsSent = 0 ;
  deltaResponsesReceived = 0 ;
  incrementDeltaBhtReqs(0);

}

var readDnsQueue = setInterval(function (){

  if (!dnsReverseLookupQueue.isEmpty()){
    var sessionObj = dnsReverseLookupQueue.dequeue();

    dnsReverseLookup(sessionObj.ip, function(err, domains){
      if (err){
        console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + sessionObj.ip + " ERROR: " + err));
      }
      else {
        debug("DNS REVERSE LOOKUP: " + sessionObj.ip + " | DOMAINS: " + domains);
        sessionObj.domain = domains[0];
      }

    });

  }
}, 20);

var unpairedUserHashMap = new HashMap();
var pairedUserHashMap = new HashMap();

function pairUser(sessionObj, callback){

  sessionObj.config.type = 'USER-USER' ; // should already be set
  console.log(unpairedUserHashMap.count() + " PAIRING USER " + sessionObj.userId + " | SID: " + sessionObj.sessionId);

  if (unpairedUserHashMap.count() > 0){

    unpairedUserHashMap.forEach(function(userId, sessionId){

      console.log(chalkSession("UNPAIRED USER | " + userId + " | SID: " + sessionId));

      if (sessionId != sessionObj.sessionId){

        console.log(chalkSession("PPP FOUND USER TO PAIR | A: " + sessionId + " <-> B: " + sessionObj.sessionId));

        sessionObj.config.userB = sessionObj.sessionId;
        sessionObj.config.userA = sessionId;

        // add both A -> B and B -> A to pairedUserHashMap

        pairedUserHashMap.set(sessionObj.sessionId, sessionId);
        pairedUserHashMap.set(sessionId, sessionObj.sessionId);

        unpairedUserHashMap.remove(sessionObj.sessionId);
        unpairedUserHashMap.remove(sessionId);

        sessionUpdateDb(sessionObj, function(err, updatedSessionObj){
          sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);  

          // update session for userA
          var sessionUserA = sessionCache.get(sessionId);  

          sessionUserA.config.userB = sessionObj.sessionId;
          sessionUserA.config.userA = sessionId;

          sessionUpdateDb(sessionUserA, function(err, updatedSessionObj){
            sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);  
            callback(null, sessionObj);
            return;
          });

        });

      }
      else {
        console.log(chalkSession("FOUND CURRENT USER " + sessionObj.userId + " | " + sessionObj.sessionId + " ... ALREADY IN unpairedUserHashMap"));
        sessionObj.config.userA = sessionObj.sessionId;
      }

    });

    sessionUpdateDb(sessionObj, function(err, updatedSessionObj){
      sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);  
      callback(null, sessionObj);
    });

  }
  else {
    sessionObj.config.userA = sessionObj.sessionId;
    console.log(chalkSession("NO UNPAIRED USER FOUND " + sessionObj.userId + " | " + sessionObj.sessionId + " ... ADDING TO unpairedUserHashMap"));
    unpairedUserHashMap.set(sessionObj.sessionId, sessionObj.userId);
    sessionUpdateDb(sessionObj, function(err, updatedSessionObj){
      sessionCache.set(updatedSessionObj.sessionId, updatedSessionObj);  
      callback(null, sessionObj);
    });
  }

}

var readSessionQueue = setInterval(function (){

  var sesObj;

  if (!sessionQueue.isEmpty()){

    sesObj = sessionQueue.dequeue();

    debug(chalkSession("----------\nREAD SESSION QUEUE"
      + " | " + sesObj.sessionEvent
      + "\n" + jsonPrint(sesObj)
    ));

    switch (sesObj.sessionEvent) {

      case 'REQ_ADMIN_SESSION':
        Object.keys(adminNameSpace.connected).forEach(function(adminSessionKey){
          var adminSessionObj = sessionCache.get(adminSessionKey);
          if (adminSessionObj) {
            console.log("FOUND ADMIN SESSION: " + adminSessionObj.sessionId);
            console.log("TX ADMIN SESSION: " + adminSessionObj.sessionId 
              + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId);
            adminNameSpace.to(sesObj.session.sessionId).emit('ADMIN_SESSION', adminSessionObj);
          }
          // else {
          //   console.log("NOT FOUND ADMIN SESSION: " + adminSessionKey);
          //   adminNameSpace.to(sesObj.options.requestSocketId).emit('ADMIN_SESSION', adminSessionObj);
          // }
        });
        break;

      case 'REQ_USER_SESSION':
        console.log(chalkAlert("RX REQ_USER_SESSION\n" + jsonPrint(sesObj)));
        Object.keys(userNameSpace.connected).forEach(function(userSessionKey){
          var userSessionObj = sessionCache.get(userSessionKey);
          if (userSessionObj) {
            console.log("FOUND USER SESSION: " + userSessionObj.sessionId);
            console.log(chalkRed("TX USER SESSION: " + userSessionObj.sessionId 
              + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
            delete userSessionObj.wordChain ;

            adminNameSpace.to(sesObj.session.sessionId).emit('USER_SESSION', userSessionObj);
          }
        });
        Object.keys(testUsersNameSpace.connected).forEach(function(userSessionKey){
          var userSessionObj = sessionCache.get(userSessionKey);
          if (userSessionObj) {
            console.log("FOUND TEST USER SESSION: " + userSessionObj.sessionId);
            console.log(chalkRed("TX USER SESSION: " + userSessionObj.sessionId 
              + " TO " + sesObj.options.requestNamespace + "#" + sesObj.options.requestSocketId));
            delete userSessionObj.wordChain ;

            adminNameSpace.to(sesObj.session.sessionId).emit('USER_SESSION', userSessionObj);
          }
        });
        break;

      case 'SESSION_CREATE':

        sesObj.session.config.type = enabledSessionTypes[randomInt(0, enabledSessionTypes.length)];

        console.log(chalkSession("... SESSION TYPE: " + sesObj.session.config.type ));

        // sesObj.session.config.type = defaultSessionType ;

        console.log(chalkSession(
          ">>> SESSION CREATE"
          + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.session.sessionId
          + " | SIP: " + sesObj.session.ip
          // + " | UID: " + sesObj.user.userId
        ));

         // SESSION TYPES: RANDOM, ANTONYM, SYNONYM, SCRIPT, USER-USER, GROUP 

        switch (sesObj.session.config.type) {
          case 'RANDOM':
          break;
          case 'ANTONYM':
          break;
          case 'SYNONYM':
          break;
          case 'SCRIPT':
          break;
          case 'USER-USER':
          break;
          case 'GROUP':
          break;
          default:
            console.error(chalkError(" 1 ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type));
            quit();
          break;
        }


        dnsReverseLookup(sesObj.session.ip, function(err, domains){
          if (!err) {
            console.log(chalkSession("... SESSION CREATE | IP: " 
              + sesObj.session.ip + " | DOMAINS: " + domains.length + " | " + domains[0]
            ));

            if (domains.length > 0){
              sesObj.session.domain = domains[0];
            } 
            else {
              sesObj.session.domain = 'UNKNOWN';
            }

            sesObj.session.connected = true;

            sessionUpdateDb(sesObj.session, function(err, sessionUpdatedObj){
              if (!err){
                if (sessionUpdatedObj.namespace == 'admin') {
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj, 0);  // don't age out admin sessions
                }
                else if (sessionUpdatedObj.namespace == 'view') {
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj, 0);  // don't age out view sessions
                }
                else if (sessionUpdatedObj.namespace == 'user') {
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj, 0);  // don't age out user sessions
                }
               else if (sessionUpdatedObj.namespace == 'test-user') {
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj, 0);  // don't age out test-user sessions
                }
                else {
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                }
              }
            });

          }
        });
        break;

      case 'SOCKET_RECONNECT':
        console.log(chalkSession(
          "<-> SOCKET RECONNECT"
          + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.session.sessionId
          + " | IP: " + sesObj.session.ip
          + " | DOMAIN: " + sesObj.session.domain
        ));
        sessionCache.set(sesObj.session.sessionId, sesObj.session);
        sessionUpdateDb(sesObj.session, function(){});

        var currentUser = userCache.get(sesObj.session.userId);
        currentUser.connected = true ;

        userUpdateDb(currentUser, function(err, updatedUserObj){
          if (!err){
            console.log(chalkRed("TX USER SESSION (SOCKET ERROR): " 
              + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));

            adminNameSpace.emit('USER_SESSION', updatedUserObj);
          }
        });

        break;

      case 'SESSION_EXPIRED':
        debug(chalkSession(
          "EXP SESSION EXPIRED"
          + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.session.sessionId
          + " | IP: " + sesObj.session.ip
          + " | DOMAIN: " + sesObj.session.domain
        ));


        sesObj.session.disconnectTime = moment().valueOf();

        sessionUpdateDb(sesObj.session, function(err, updatedSessionObj){

          var currentUser = userCache.get(updatedSessionObj.userId);
          var currentAdmin = adminCache.get(updatedSessionObj.userId);
          var currentViewer = viewerCache.get(updatedSessionObj.userId);

          if (currentViewer) {
            debug("currentViewer\n" + jsonPrint(currentViewer));
            viewerCache.del(currentViewer.viewerId);
            currentViewer.lastSeen = moment().valueOf();
            currentViewer.connected = false;
            viewerUpdateDb(currentViewer, function(err, updatedViewerObj){
              if (!err){

                updatedViewerObj.sessionId = updatedViewerObj.lastSession;

                console.log(chalkRed("TX VIEWER SESSION (DISCONNECT): " 
                  + updatedViewerObj.lastSession + " TO ADMIN NAMESPACE"
                ));

                adminNameSpace.emit('VIEWER_SESSION', updatedViewerObj);
              }
            });
          }

          if (currentAdmin) {
            debug("currentAdmin\n" + jsonPrint(currentAdmin));
            adminCache.del(currentAdmin.adminId);
            currentAdmin.lastSeen = moment().valueOf();
            currentAdmin.connected = false;
            adminUpdateDb(currentAdmin, function(err, updatedAdminObj){
              if (!err){

                updatedAdminObj.sessionId = updatedAdminObj.lastSession;

                console.log(chalkRed("TX ADMIN SESSION (DISCONNECT): " 
                  + updatedAdminObj.lastSession + " TO ADMIN NAMESPACE"
                ));

                adminNameSpace.emit('ADMIN_SESSION', updatedAdminObj);
              }
            });
          }
          
          if (currentUser) {
            debug("currentUser\n" + jsonPrint(currentUser));
            userCache.del(currentUser.userId);
            currentUser.lastSeen = moment().valueOf();
            currentUser.connected = false;
            userUpdateDb(currentUser, function(err, updatedUserObj){
              if (!err){

                updatedUserObj.sessionId = updatedUserObj.lastSession;

                console.log(chalkRed("TX USER SESSION (DISCONNECT): " 
                  + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"
                ));

                adminNameSpace.emit('USER_SESSION', updatedUserObj);
              }
            });
          }


        });


        sesObj.session.wordChain.forEach(function(word){
          debug(chalkSession(">T< SET WORD " + word + " TTL: " + wordCacheTtl));
          wordCache.ttl(word, wordCacheTtl);
        });

        break;

      case 'SOCKET_DISCONNECT':
        console.log(chalkSession(
          "XXX SOCKET DISCONNECT"
          + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.session.sessionId
          + " | IP: " + sesObj.session.ip
          + " | DOMAIN: " + sesObj.session.domain
        ));


        if (sesObj.session){

          debug("SOCKET_DISCONNECT\n" + jsonPrint(sesObj));

          var currentAdmin = adminCache.get(sesObj.session.userId);
          var currentUser = userCache.get(sesObj.session.userId);
          var currentViewer = viewerCache.get(sesObj.session.userId);

          sesObj.session.disconnectTime = moment().valueOf();
          sessionUpdateDb(sesObj.session, function(){});

          sesObj.session.wordChain.forEach(function(word){
            debug(chalkSession(">T< SET WORD " + word + " TTL: " + wordCacheTtl));
            wordCache.ttl(word, wordCacheTtl);
          });

          sessionCache.del(sesObj.session.sessionId);

          if (currentAdmin) {
            debug("currentAdmin\n" + jsonPrint(currentAdmin));
            adminCache.del(currentAdmin.adminId);

            currentAdmin.lastSeen = moment().valueOf();
            currentAdmin.disconnectTime = moment().valueOf();
            currentAdmin.connected = false;

            console.log(chalkRed("CONNECTION DURATION: " + currentAdmin.adminId
             + " | " + msToTime(moment().valueOf() - currentAdmin.connectTime)));

            adminUpdateDb(currentAdmin, function(err, updatedAdminObj){
              if (!err){
                console.log(chalkRed("TX ADMIN SESSION (DISCONNECT): " 
                  + updatedAdminObj.lastSession + " TO ADMIN NAMESPACE"));

                adminNameSpace.emit('ADMIN_SESSION', updatedAdminObj);
              }
            });
          }
          
          if (currentUser) {
            debug("currentUser\n" + jsonPrint(currentUser));
            userCache.del(currentUser.userId);

            currentUser.lastSeen = moment().valueOf();
            currentUser.connected = false;
            currentUser.disconnectTime = moment().valueOf();

            console.log(chalkRed("CONNECTION DURATION: " + currentUser.userId
             + " | " + msToTime(moment().valueOf() - currentUser.connectTime)));

            userUpdateDb(currentUser, function(err, updatedUserObj){
              if (!err){

                updatedUserObj.sessionId = updatedUserObj.lastSession;

                console.log(chalkRed("TX USER SESSION (DISCONNECT): " 
                  + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"
                ));

                adminNameSpace.emit('USER_SESSION', updatedUserObj);
              }
            });
          }
          
          if (currentViewer) {
            debug("currentViewer\n" + jsonPrint(currentViewer));
            viewerCache.del(currentViewer.viewerId);

            currentViewer.lastSeen = moment().valueOf();
            currentViewer.connected = false;
            currentViewer.disconnectTime = moment().valueOf();

            console.log(chalkRed("CONNECTION DURATION: " + currentViewer.userId
             + " | " + msToTime(moment().valueOf() - currentViewer.connectTime)));

            viewerUpdateDb(currentViewer, function(err, updatedViewerObj){
              if (!err){

                updatedViewerObj.sessionId = updatedViewerObj.lastSession;

                console.log(chalkRed("TX VIEWER SESSION (DISCONNECT): " 
                  + updatedViewerObj.lastSession + " TO ADMIN NAMESPACE"
                ));

                adminNameSpace.emit('USER_SESSION', updatedViewerObj);
              }
            });
          }
        }

        break;

      case 'SOCKET_ERROR':
        console.log(chalkSession(
          "*** SOCKET ERROR"
          // + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.sessionId
          // + " | UID: " + sesObj.user.userId
        ));
        var currentSession = sessionCache.get(sesObj.sessionId);
        sessionCache.del(currentSession.sessionId);
        sesObj.user.lastSeen = moment().valueOf();
        sesObj.user.connected = false;
        userUpdateDb(sesObj.user, function(err, updatedUserObj){
          if (!err){
            console.log(chalkRed("TX USER SESSION (SOCKET ERROR): " 
              + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));

            adminNameSpace.emit('USER_SESSION', updatedUserObj);
          }
        });
        break;

      case 'ADMIN_READY':

        // ????? ADMIN VERIFICATION SHOULD HAPPEN HERE

        if (typeof sesObj.session.ip !== 'undefined'){
          if (dnsHostHashMap.has(sesObj.session.ip)) {
            sesObj.admin.domain = dnsHostHashMap.get(sesObj.session.ip);
            sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
          }
        }

        console.log("ADMIN_READY\n" + jsonPrint(sesObj));

        console.log(chalkSession(
          ">>> SESSION ADMIN READY"
          + " | SID: " + sesObj.session.sessionId
          + " | UID: " + sesObj.admin.adminId
          + " | NSP: " + sesObj.session.namespace
          + " | IP: " + sesObj.session.ip
          + " | DOMAIN: " + sesObj.session.domain
        ));

        var currentSession = sessionCache.get(sesObj.session.sessionId);

        currentSession.userId = sesObj.admin.adminId;

        sesObj.admin.ip = sesObj.session.ip;
        sesObj.admin.domain = sesObj.session.domain;
        sesObj.admin.lastSession = sesObj.session.sessionId;
        sesObj.admin.lastSeen = moment().valueOf();
        sesObj.admin.connectTime = moment().valueOf();
        sesObj.admin.disconnectTime = moment().valueOf();
        sesObj.admin.connected = true;

        console.log("adminUpdateDb\n" + jsonPrint(sesObj));

        adminUpdateDb(sesObj.admin, function(err, adminObj){
          if (!err) {

            var adminSessionKey = randomInt(1000000,1999999) ;

            currentSession.adminSessionKey = adminSessionKey;
            currentSession.connected = true;

            sessionUpdateDb(currentSession, function(err, sessionUpdatedObj){
              if (!err){
                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                debug(chalkInfo("-S- DB UPDATE"
                  + " | " + sessionUpdatedObj.sessionId
                ));
                console.log("TX ADMIN_ACK", adminSessionKey);
                io.of(currentSession.namespace).to(currentSession.sessionId).emit('ADMIN_ACK', adminSessionKey);
              }
              else {
                console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
              }
            });
          } 
        });
        break;

      case 'VIEWER_READY':

        if (typeof sesObj.session.ip !== 'undefined'){
          if (dnsHostHashMap.has(sesObj.session.ip)) {
            sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
            sesObj.viewer.domain = dnsHostHashMap.get(sesObj.session.ip);
          }
        }

        console.log("VIEWER_READY\n" + jsonPrint(sesObj));

        console.log(chalkSession(
          ">>> SESSION VIEWER READY"
          + " | SID: " + sesObj.session.sessionId
          + " | UID: " + sesObj.viewer.viewerId
          + " | NSP: " + sesObj.session.namespace
          + " | IP: " + sesObj.session.ip
          + " | DOMAIN: " + sesObj.session.domain
        ));

        var currentSession = sessionCache.get(sesObj.session.sessionId);

        currentSession.userId = sesObj.viewer.viewerId;

        sesObj.viewer.ip = sesObj.session.ip;
        sesObj.viewer.domain = sesObj.session.domain;
        sesObj.viewer.namespace = sesObj.session.namespace;
        sesObj.viewer.lastSession = sesObj.session.sessionId;
        sesObj.viewer.lastSeen = moment().valueOf();
        sesObj.viewer.connected = true;
        sesObj.viewer.connectTime = moment().valueOf();
        sesObj.viewer.disconnectTime = 0;

        viewerUpdateDb(sesObj.viewer, function(err, viewerObj){
          if (!err) {
            var viewerSessionKey = randomInt(1000000,1999999) ;
            currentSession.viewerSessionKey = viewerSessionKey;
             sessionUpdateDb(currentSession, function(err, sessionUpdatedObj){
              if (!err){
                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                debug(chalkInfo("-S- DB UPDATE"
                  + " | " + sessionUpdatedObj.sessionId
                ));
                console.log("TX VIEWER_ACK", viewerSessionKey);
                io.of(currentSession.namespace).to(currentSession.sessionId).emit('VIEWER_ACK', viewerSessionKey);
              }
              else {
                console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
              }
            });
          } 
        });
        break;

      case 'USER_READY':

        if (typeof sesObj.session.ip !== 'undefined'){
          if (dnsHostHashMap.has(sesObj.session.ip)) {
            sesObj.session.domain = dnsHostHashMap.get(sesObj.session.ip);
            sesObj.user.domain = dnsHostHashMap.get(sesObj.session.ip);
            console.log(chalkUser("@@@ USER_READY SET DOMAIN: " + dnsHostHashMap.get(sesObj.session.ip)));
          }
        }

        console.log(chalkSession(
          ">>> SESSION USER READY"
          + " | SID: " + sesObj.session.sessionId
          + " | SES TYPE: " + sesObj.session.config.type
          + " | UID: " + sesObj.user.userId
          + " | NSP: " + sesObj.session.namespace
          + " | IP: " + sesObj.session.ip
          + " | DOMAIN: " + sesObj.session.domain
        ));

        var currentSession = sessionCache.get(sesObj.session.sessionId);
        currentSession.userId = sesObj.user.userId;

        sesObj.user.ip = sesObj.session.ip;
        sesObj.user.namespace = sesObj.session.namespace;
        sesObj.user.domain = sesObj.session.domain;
        sesObj.user.lastSession = sesObj.session.sessionId;
        sesObj.user.lastSeen = moment().valueOf();
        sesObj.user.connectTime = moment().valueOf();
        sesObj.user.disconnectTime = moment().valueOf();
        sesObj.user.connected = true;

        userUpdateDb(sesObj.user, function(err, updatedUserObj){
          if (!err){
            console.log(chalkRed("TX USER SESSION (USER READY): " 
              + updatedUserObj.lastSession + " TO ADMIN NAMESPACE"));
            adminNameSpace.emit('USER_SESSION', updatedUserObj);
          }
        });

        /*
            ROUTING OF PROMPT/RESPONSE BASED ON SESSION TYPE
        */


        sessionCache.set(currentSession.sessionId, currentSession, function( err, success ){
          if( !err && success ){
            userCache.set(currentSession.userId, sesObj.user, function( err, success ){
              if( !err && success ){

                switch (sesObj.session.config.type) {

                  // start with a random word for these session types

                  case 'RANDOM':
                  case 'ANTONYM':
                  case 'SYNONYM':
                    words.getRandomWord(function(err, randomWordObj){
                      if (!err) {
                        wordCache.set(randomWordObj.nodeId, randomWordObj);
                        currentSession.wordChain.push(randomWordObj.nodeId);
                        sessionUpdateDb(currentSession, function(err, sessionUpdatedObj){
                          if (!err){
                            sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                            debug(chalkInfo("-S- DB UPDATE"
                              + " | " + sessionUpdatedObj.sessionId
                              + " | WCL: " + sessionUpdatedObj.wordChain.length
                            ));
                            sendPrompt(currentSession, randomWordObj);
                          }
                          else {
                            console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                          }
                        });
                      }
                      else {
                        console.log(chalkError("*** ERROR GET RANDOM WORD\n" + err));
                      }
                    });
                  break;

                  case 'SCRIPT':
                  break;
                  case 'USER-USER':
                    console.log(chalkSession("... PAIRING USER " + currentSession.userId));
                    pairUser(currentSession, function(err, updatedSessionObj){
                      if (err){
                        console.error(chalkError("*** pairUser ERROR\n" + jsonPrint(err)));
                      }
                      else {
                        console.log(chalkSession("U-U CREATED USER-USER PAIR\n" + jsonPrint(updatedSessionObj.config)));
                        words.getRandomWord(function(err, randomWordObj){
                          if (!err) {
                            wordCache.set(randomWordObj.nodeId, randomWordObj);
                            updatedSessionObj.wordChain.push(randomWordObj.nodeId);
                            sessionUpdateDb(updatedSessionObj, function(err, sessionUpdatedObj){
                              if (!err){
                                sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                                debug(chalkInfo("-S- DB UPDATE"
                                  + " | " + sessionUpdatedObj.sessionId
                                  + " | WCL: " + sessionUpdatedObj.wordChain.length
                                ));
                                sendPrompt(currentSession, randomWordObj);
                              }
                              else {
                                console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                              }
                            });
                          }
                          else {
                            console.log(chalkError("*** ERROR GET RANDOM WORD\n" + err));
                          }
                        });
                      }
                    })
                  break;
                  case 'GROUP':
                  break;
                  default:
                    console.error(chalkError("2  ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type));
                    quit();
                  break;
                }

              }
            });
          }
        });
        break;

      default:
        console.log(chalkError("??? UNKNOWN SESSION EVENT\n"
          + jsonPrint(sesObj)
        ));
        return;
    }
  }
}, 20);

var readResponseQueue = setInterval(function (){

  if (!responseQueue.isEmpty()){

    var rxInObj = responseQueue.dequeue();

    var responseInObj = rxInObj ;
    var socketId = responseInObj.socketId;
    var currentSessionObj = sessionCache.get(socketId);

    if (!currentSessionObj) {
      console.error(chalkWarn("??? SESSION NOT IN CACHE ON RESPONSE Q READ (DISCONNECTED?) " + socketId
        + " ... ABORTING SESSION"
      ));
      return ; 
    }

    debug(chalkBht(">>> RESPONSE (before replace): " + responseInObj.nodeId));
    responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, ' ');
    responseInObj.nodeId = responseInObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\'\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=]+/g, '') ;
    responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, ' ') ;
    responseInObj.nodeId = responseInObj.nodeId.replace(/^\s+|\s+$/g, '') ;
    responseInObj.nodeId = responseInObj.nodeId.toLowerCase();
    debug(chalkBht(">>> RESPONSE: " + responseInObj.nodeId));

    if (!responseInObj.mentions) responseInObj.mentions = 1;

    responsesReceived++;
    deltaResponsesReceived++;

    updateStats({ responsesReceived: responsesReceived, deltaResponsesReceived: deltaResponsesReceived });


    currentSessionObj.lastSeen = moment().valueOf();

    // console.log("currentSession.wordChain: " + currentSessionObj.wordChain);

    var promptWordObj ;
    var previousPrompt;
    var previousPromptObj;

    if ((typeof currentSessionObj.wordChain !== 'undefined') && (currentSessionObj.wordChain.length > 0)){
      previousPrompt = currentSessionObj.wordChain[currentSessionObj.wordChain.length-1] ;
      previousPromptObj = wordCache.get(previousPrompt);
      if (!previousPromptObj) {
        console.log(chalkWarn("??? previousPrompt NOT IN CACHE: " + previousPrompt
          + " ... ABORTING SESSION"
        ));
        return;
      }
      else {
        console.log(chalkResponse("previousPromptObj\n" + previousPromptObj.nodeId));
      }
    }
    else if (currentSessionObj.config.type == 'USER-USER') {

      console.log(chalkResponse("---------- USER-USER ----------"));

      var respondentSessionId = currentSessionObj.sessionId ;
      var targetSessionId ;

      if (respondentSessionId == currentSessionObj.config.userA) {
        targetSessionId = currentSessionObj.config.userB;
      }
      else if (respondentSessionId == currentSessionObj.config.userB) {
        targetSessionId = currentSessionObj.config.userA;
      }
      else {
        console.error("?????? USER-USER RESPONSE FROM UNKNOWN USER\n" + jsonPrint(currentSessionObj));
        quit();
      }

      if ((typeof currentSessionObj.wordChain === 'undefined') || (currentSessionObj.wordChain.length == 0)){
        console.log(chalkResponse("START OF USER-USER SESSION | ADDING " + responseInObj.nodeId + " TO WORDCHAIN"));
        previousPrompt = responseInObj.nodeId;
        currentSessionObj.wordChain.push(responseInObj.nodeId);
        previousPromptObj = { nodeId: previousPrompt } ;
        wordCache.set(previousPromptObj.nodeId, previousPrompt); 
      }
      else {

      }

      console.log(chalkResponse("U->U RESPONSE"
        + " | " + currentSessionObj.config.userA + " -> " + currentSessionObj.config.userB
        + " | " + jsonPrint(responseInObj)
      ));
    }
    else {
      console.log(chalkWarn("??? EMPTY WORD CHAIN ... PREVIOUS PROMPT NOT IN CACHE: " + previousPrompt
        + " ... ABORTING SESSION"
      ));
      return;
    }

    console.log(chalkResponse("R<- "
      + currentSessionObj.userId 
      + " | " + socketId 
      + " | " + responseInObj.nodeId + " <-- " + previousPrompt));


    // ????? IS A WORD CACHE NECESSARY? HELPFUL??

    var responseWordObj;

    var responseCacheObj = wordCache.get(responseInObj.nodeId); 

    if (responseCacheObj) {
      console.log(chalkRed(".W. CACHE HIT  | " + responseInObj.nodeId));
    }
    else {
      console.log(chalkInfo(".w. CACHE MISS | " + responseInObj.nodeId));
    }

    // ADD/UPDATE WORD IN DB
    dbUpdateWord(responseInObj, true, function(status, responseWordObj){
      if ((status == 'BHT_ERROR') || (status == 'BHT_OVER_LIMIT')) {
        wordCache.set(responseInObj.nodeId, responseInObj);
        currentSessionObj.wordChain.push(responseInObj.nodeId);
        sessionCache.set(currentSessionObj.sessionId, currentSessionObj, function(err, success){
          if (!err && success) {

            promptQueue.enqueue(currentSessionObj.sessionId);

            var sessionUpdateObj = {
              sessionId: currentSessionObj.sessionId,
              sourceWord: previousPromptObj,
              targetWord: responseInObj
            };

            updateSessionViews(sessionUpdateObj);
          }
        });
      }
      else {
        wordCache.set(responseWordObj.nodeId, responseWordObj);
        currentSessionObj.wordChain.push(responseWordObj.nodeId);
        sessionCache.set(currentSessionObj.sessionId, currentSessionObj, function(err, success){
          if (!err && success) {

            promptQueue.enqueue(currentSessionObj.sessionId);

            var sessionUpdateObj = {
              sessionId: currentSessionObj.sessionId,
              sourceWord: previousPromptObj,
              targetWord: responseWordObj
            };

            updateSessionViews(sessionUpdateObj);
          }
        });
      }
    });

    // // GENERATE PROMPT
    // generatePrompt(responseWordObj, function(status, promptWordObj){
    // });

    // // TX PROMPT
    // sendPrompt(currentSessionObj, promptWordObj);

    // // TX SESSION VIEW UPDATE
    // updateSessionViews(sessionUpdateObj);

    // // UPDATE SESSION IN DB
    // dbUpdateSession(currentSessionObj, function(err, sessionObj){
    // });

    // // UPDATE USER IN DB
    // dbUpdateUser(currentSessionObj, function(err, sessionObj){
    // });


  }
}, 20);


var algorithms = [ 'antonym', 'synonym', 'related', 'similar', 'user'];
var currentAlgorithm = 'antonym'; // random, antonym, synonym, ??
// wordVariations = [ 'syn', 'ant', 'rel', 'sim', 'usr' ]


var generatePromptQueueInterval = setInterval(function (){

  if (!promptQueue.isEmpty()){


    var currentSessionId = promptQueue.dequeue();

    var currentSession = sessionCache.get(currentSessionId);

    if (!currentSession) {
      console.log(chalkWarn("??? SESSION EXPIRED ??? ... SKIPPING SEND PROMPT | " + currentSessionId));
      return;
    }

    debug("generatePromptQueueInterval currentSession\n" + jsonPrint(currentSession));

    var currentResponse = currentSession.wordChain[currentSession.wordChain.length-1];

/*

This is where routing of response -> prompt happens

*/

      switch (currentSession.config.type) {

        case 'RANDOM':
          var randomIndex = randomInt(0, algorithms.length);
          currentAlgorithm = algorithms[randomIndex];
          // console.log("[-] CURRENT ALGORITHM: " + currentAlgorithm);

          var query = { input: currentResponse, algorithm: currentAlgorithm};

          generatePrompt(query, function(status, responseObj){
            if (status == 'ERROR') {
              console.log(chalkError("**** generatePrompt ERROR\n" + jsonPrint(responseObj)))
            }
            else if (status == 'OK') {
              wordCache.set(responseObj.nodeId, responseObj);
              currentSession.wordChain.push(responseObj.nodeId);

              sessionUpdateDb(currentSession, function(err, sessionUpdatedObj){
                if (!err){
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                  debug(chalkInfo("-S- DB UPDATE"
                    + " | " + sessionUpdatedObj.sessionId
                    + " | WCL: " + sessionUpdatedObj.wordChain.length
                  ));
                  sendPrompt(sessionUpdatedObj, responseObj);
                }
                else {
                  console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                }
              });
            }
          });
        break;

        case 'ANTONYM':
        case 'SYNONYM':

          currentAlgorithm = currentSession.config.type.toLowerCase();
          // console.log("[-] CURRENT ALGORITHM: " + currentAlgorithm);

          var query = { input: currentResponse, algorithm: currentAlgorithm};

          generatePrompt(query, function(status, responseObj){
            if (status == 'ERROR') {
              console.log(chalkError("**** generatePrompt ERROR\n" + jsonPrint(responseObj)))
            }
            else if (status == 'OK') {
              wordCache.set(responseObj.nodeId, responseObj);
              currentSession.wordChain.push(responseObj.nodeId);

              sessionUpdateDb(currentSession, function(err, sessionUpdatedObj){
                if (!err){
                  sessionCache.set(sessionUpdatedObj.sessionId, sessionUpdatedObj);
                  debug(chalkInfo("-S- DB UPDATE"
                    + " | " + sessionUpdatedObj.sessionId
                    + " | WCL: " + sessionUpdatedObj.wordChain.length
                  ));
                  sendPrompt(sessionUpdatedObj, responseObj);
                }
                else {
                  console.log(chalkError("*** ERROR DB UPDATE SESSION\n" + err));
                }
              });
            }
          });
        break;

        case 'USER-USER':
        break;

        // case 'SCRIPT':
        // break;
        // case 'GROUP':
        // break;
        default:
          console.error(chalkError("3  ????? UNKNOWN SESSION TYPE: " + sesObj.session.config.type));
          quit();
        break;
      }

  }
}, 20);


function initializeConfiguration(callback) {

  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | initializeConfiguration ..."));

  async.series([
    // DATABASE INIT
    function(callbackSeries){
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | START DATABASE INIT"));

      async.parallel(
        [

          function(callbackParallel) {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | ADMIN IP INIT"));
            adminFindAllDb(null, function(numberOfAdminIps){
              console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
                + " | ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps));
              callbackParallel();
            });
          }
        ],
        function(err, results){  //async.parallel callbac
          if (err) {
            console.error(chalkError("\n" + moment().format(defaultDateTimeFormat) + "!!! DATABASE INIT ERROR: " + err));
            callbackSeries(err, null);
            return;
          }
          else {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | DATABASE INIT COMPLETE"));
            configEvents.emit('INIT_DATABASE_COMPLETE', moment().format(defaultDateTimeFormat));
            callbackSeries(null, 'INIT_DATABASE_COMPLETE');
          }
        }
      );  // async.parallel
    },

    // APP ROUTING INIT
    function(callbackSeries){
      debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | APP ROUTING INIT"));
      initAppRouting(function(err, results){
        callbackSeries(err, results);
      });
    },

    // CONFIG EVENT
    function(callbackSeries){
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | INIT CONFIG COMPLETE"));
      var serverSessionConfig = { 
        configOrigin: 'SERVER',
        testMode: testMode
      };
      debug("SESSION CONFIGURATION\n" + JSON.stringify(serverSessionConfig, null, 3) + "\n");
      callbackSeries(null, serverSessionConfig);
    },

    // SERVER READY
    function(callbackSeries){

      debug("... CHECKING INTERNET CONNECTION ...");

      // var testClient = new net.Socket();
      var testClient = net.createConnection(80, 'www.google.com');

      testClient.on('connect', function(){
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + ' | CONNECTED TO GOOGLE: OK'));
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SEND SERVER_READY"));
        internetReady = true ;
        configEvents.emit("SERVER_READY");
        testClient.destroy();
        callbackSeries(null, "SERVER_READY");
      });

      testClient.on('error', function(err){
        console.error(chalkInfo(moment().format(defaultDateTimeFormat) + ' | CONNECTED TO GOOGLE: OK'));
        internetReady = false ;
        testClient.destroy();
        configEvents.emit("SERVER_NOT_READY");
        callbackSeries(err, null);
      });
    },

    // GOOGLE INIT
    function(callbackSeries){
      if (!disableGoogleMetrics) {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE INIT"));
        findCredential(GOOGLE_SERVICE_ACCOUNT_CLIENT_ID, function(){
          callbackSeries(null, "INIT_GOOGLE_METRICS_COMPLETE");
          return;
        });
      }
      else {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) 
          + " | GOOGLE INIT *** SKIPPED *** | GOOGLE METRICS DISABLED"));
        callbackSeries(null, "INIT_GOOGLE_METRICS_SKIPPED");
      }
    }
  ],
  function(err, results){
    if (err){
      console.error(chalkError("\n*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err) + "\n"));
      callback(err, null);
    }
    else {
      debug(chalkLog("\nINITIALIZE CONFIGURATION RESULTS\n" + jsonPrint(results) + "\n"));
      callback(null, results);
    }
  });
}

// ==================================================================
// CONNECT TO INTERNET, START SERVER HEARTBEAT
// ==================================================================
configEvents.on("SERVER_READY", function () {

  serverReady = true ;

  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SERVER_READY EVENT"));

  httpServer.on("reconnect", function(){
    internetReady = true ;
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + ' | PORT RECONNECT: ' + config.port));
    initializeConfiguration();
  });

  httpServer.on('connect', function(){
    internetReady = true ;
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + ' | PORT CONNECT: ' + config.port));

    httpServer.on("disconnect", function(){
      internetReady = false ;
      console.error(chalkError('\n***** PORT DISCONNECTED | ' + moment().format(defaultDateTimeFormat) + ' | ' + config.port));
    });
  });

  httpServer.listen(config.port, function(){
    console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | LISTENING ON PORT " + config.port));
  });

  httpServer.on("error", function (err) {
    internetReady = false ;
    console.error(chalkError('??? HTTP ERROR | ' + moment().format(defaultDateTimeFormat) + '\n' + err));
    if (err.code == 'EADDRINUSE') {
      console.error(chalkError('??? HTTP ADDRESS IN USE: ' + config.port + ' ... RETRYING...'));
      setTimeout(function () {
        httpServer.listen(config.port, function(){
          console.log('LISTENING ON PORT ' + config.port);
        });
      }, 5000);
    }
  });


  //----------------------
  //  SERVER HEARTBEAT
  //----------------------

  function logHeartbeat(){
    console.log(chalkLog("HB " + heartbeatsSent 
      + " | " + getTimeStamp(txHeartbeat.timeStamp)
      + " | ST: " + getTimeStamp(txHeartbeat.startTime)
      + " | UP: " + msToTime(txHeartbeat.upTime)
      + " | RN: " + msToTime(txHeartbeat.runTime)
      + " | MWR: " + txHeartbeat.mwRequests
      + " | BHTR: " + txHeartbeat.bhtRequests
      + " | MEM: " + txHeartbeat.memoryAvailable + "/" + txHeartbeat.memoryTotal
    ));
  }

  var serverHeartbeatInterval = setInterval(function () {

    debug(util.inspect(userNameSpace.connected, {showHidden: false, depth: 1}))

    runTime =  moment() - startTime ;

    bhtTimeToReset = moment.utc().utcOffset("-08:00").endOf('day').valueOf() - moment.utc().utcOffset("-08:00").valueOf();

    //
    // SERVER HEARTBEAT
    //

    if (internetReady){

      heartbeatsSent++;

      txHeartbeat = { 
        serverHostName : os.hostname(), 
        timeStamp : getTimeNow(), 
        startTime : startTime, 
        upTime : upTime, 
        runTime : runTime, 
        heartbeatsSent : heartbeatsSent,
        memoryAvailable : memoryAvailable,
        memoryTotal : memoryTotal,

        wordCacheStats : wordCache.getStats(),
        wordCacheTtl: wordCacheTtl,
        
        numberAdmins : numberAdmins,
        numberUtils : numberUtils,

        numberViewers : numberViewers,
        numberViewersMax : numberViewersMax,
        numberViewersMaxTime : numberViewersMaxTime,

        numberTestViewers : numberTestViewers,

        numberUsersTotal : numberUsersTotal,
        numberUsersTotalMax : numberUsersTotalMax,
        numberUsersTotalMaxTime : numberUsersTotalMaxTime,

        numberUsers : numberUsers,
        numberUsersMax : numberUsersMax,
        numberUsersMaxTime : numberUsersMaxTime,

        numberTestUsers : numberTestUsers,
        numberTestUsersMax : numberTestUsersMax,
        numberTestUsersMaxTime : numberTestUsersMaxTime,

        totalWords : totalWords,

        mwRequests : mwRequests,

        bhtRequestLimit : BHT_REQUEST_LIMIT,
        bhtRequests : bhtRequests,
        bhtOverLimitFlag : bhtOverLimitFlag,
        bhtLimitResetTime : bhtLimitResetTime,
        bhtOverLimitTime : bhtOverLimitTime,
        bhtTimeToReset : bhtTimeToReset,

        totalSessions : totalSessions,
        totalUsers : totalUsers,

        promptsSent : promptsSent,
        deltaPromptsSent : deltaPromptsSent,
        deltaResponsesReceived : wordAssoServerStatsObj.deltaResponsesReceived,
        responsesReceived : responsesReceived

      } ;

      io.emit('HEARTBEAT', txHeartbeat);

      utilNameSpace.emit('HEARTBEAT', txHeartbeat);
      adminNameSpace.emit('HEARTBEAT', txHeartbeat);
      userNameSpace.emit('HEARTBEAT', txHeartbeat);
      viewNameSpace.emit('HEARTBEAT', txHeartbeat);
      testUsersNameSpace.emit('HEARTBEAT', txHeartbeat);
      testViewersNameSpace.emit('HEARTBEAT', txHeartbeat);

      if (heartbeatsSent%60 == 0) {
        logHeartbeat();
      }


    }
    else {
      tempDateTime = moment() ;
      if (tempDateTime.seconds()%10 == 0){
        console.error(chalkError("!!!! INTERNET DOWN?? !!!!! " + moment().format(defaultDateTimeFormat)));
      }
    }
  }, 1000 );

  configEvents.emit("CONFIG_CHANGE", serverSessionConfig );
});

// ==================================================================
// CONFIGURATION CHANGE HANDLER
// ==================================================================
configEvents.on("CONFIG_CHANGE", function (serverSessionConfig) {

  console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | CONFIG_CHANGE EVENT"));
  debug("==> CONFIG_CHANGE EVENT: " + JSON.stringify(serverSessionConfig, null, 3));

  if (typeof serverSessionConfig.testMode !== 'undefined') {
    console.log(chalkAlert("--> CONFIG_CHANGE: testMode: " + serverSessionConfig.testMode));
    io.of("/admin").emit('CONFIG_CHANGE',  {testMode: serverSessionConfig.testMode});
    io.of("/util").emit('CONFIG_CHANGE',  {testMode: serverSessionConfig.testMode});
    io.emit('CONFIG_CHANGE',  {testMode: serverSessionConfig.testMode});
    io.of("/test-user").emit('CONFIG_CHANGE', {testMode: serverSessionConfig.testMode});
    io.of("/test-view").emit('CONFIG_CHANGE', {testMode: serverSessionConfig.testMode});
  }

  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + ' | >>> SENT CONFIG_CHANGE'));
});


googleOauthEvents.on("AUTHORIZE GOOGLE", function(){
  authorizeGoogle();
});

googleOauthEvents.on("GOOGLE CREDENTIAL FOUND", function(credential) {

  var credentialExpiryDate = new Date(credential.expiryDate).getTime();
  var remainingTime = msToTime(credentialExpiryDate - currentTime);

  googleAuthExpiryDate = credential.expiryDate;

  debug(chalkGoogle("googleOauthEvents: GOOGLE CREDENTIAL FOUND: " + JSON.stringify(credential, null, 3)));

  debug("currentTime: " + currentTime + " | credentialExpiryDate: " + credentialExpiryDate);

  if (currentTime < credentialExpiryDate){
    googleAuthorized = true ;
    googleMetricsEnabled = true ;
    googleOauthEvents.emit('GOOGLE AUTHORIZED');
    oauthExpiryTimer(credential.expiryDate);
    console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE OAUTH2 CREDENTIAL EXPIRES IN: " + remainingTime 
      + " AT " + credential.expiryDate + " ... AUTHORIZING ANYWAY ..."));
    googleOauthEvents.emit('AUTHORIZE GOOGLE');
  }
  else {
    console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | !!! GOOGLE OAUTH2 CREDENTIAL EXPIRED AT " + credential.expiryDate 
      + " | " + msToTime(currentTime - credential.expiryDate) + " AGO ... AUTHORIZING ..."));
    googleOauthEvents.emit('AUTHORIZE GOOGLE');
  }
});

googleOauthEvents.on("GOOGLE CREDENTIAL NOT FOUND", function (credentialId) {
  console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | GOOGLE CREDENTIAL NOT FOUND: " + credentialId));
  googleOauthEvents.emit("AUTHORIZE GOOGLE");
});

// RE-ENABLE METRICS PERIODICALLY TO CHECK DAILY LIMIT
googleOauthEvents.on("DAILY LIMIT EXCEEDED", function(){
  console.log(chalkGoogle("RE-ENABLING GOOGLE METRICS IN " + msToTime(googleCheckDailyLimitInterval)));
  setTimeout(function () {
    googleMetricsEnabled = true ;
    console.log("RE-ENABLED GOOGLE METRICS AFTER DAILY LIMIT EXCEEDED");
  }, googleCheckDailyLimitInterval);
});

// RE-ENABLE METRICS PERIODICALLY TO CHECK IF SOCKET IS UP
googleOauthEvents.on("SOCKET HUNG UP", function(){
  console.log(chalkGoogle("GOOGLE SOCKET HUNG UP ... CLEARING TWEET RATE QUEUE " + moment().format(defaultDateTimeFormat)));
  console.log(chalkGoogle("RE-TRYING GOOGLE METRICS IN " + msToTime(googleCheckSocketUpInterval)));

  setTimeout(function () {
    // googleMetricsEnabled = true ;
    googleOauthEvents.emit("AUTHORIZE GOOGLE");
    // console.log(chalkGoogle("RE-ENABLING GOOGLE METRICS AFTER SOCKET HUNG UP..."));
  }, googleCheckSocketUpInterval);
});


//=================================
//  SERVER READY
//=================================
function createSession (newSessionObj){

  debug(chalkSession("\nCREATE SESSION\n" + util.inspect(newSessionObj, {showHidden: false, depth: 1})));

  var namespace = newSessionObj.namespace ;
  var socket = newSessionObj.socket ;
  var socketId = newSessionObj.socket.id;
  var ipAddress = newSessionObj.socket.handshake.headers['x-real-ip'] || newSessionObj.socket.client.conn.remoteAddress;
  var hostname = newSessionObj.socket.handshake.headers.host ;
  var domain = "UNKNOWN" ;

  numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;

  var sessionObj = new Session ({
    sessionId: socketId,
    ip: ipAddress,
    namespace: namespace,
    createAt: moment().valueOf(),
    lastSeen: moment().valueOf(),
    connected: true,
    connectTime: moment().valueOf(),
    disconnectTime: 0
  });

  sessionCache.set(sessionObj.sessionId, sessionObj);

  debug(chalkSession("\nNEW SESSION\n" + util.inspect(sessionObj, {showHidden: false, depth: 1})));

  sessionQueue.enqueue({sessionEvent: "SESSION_CREATE", session: sessionObj});

  socket.on("error", function(error){
    console.error(chalkError(moment().format(defaultDateTimeFormat) + " | *** SOCKET ERROR"
      + " | " + socket.id 
      + " | " + error
    ));
    sessionQueue.enqueue({sessionEvent: "SOCKET_ERROR", sessionId: socket.id, error: error});
  });

  socket.on("reconnect", function(err){
    sessionObj.connected = true ;
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
    sessionQueue.enqueue({sessionEvent: "SOCKET_RECONNECT", sessionId: socket.id});
  });

  socket.on("disconnect", function(){
    console.log(chalkDisconnect(moment().format(defaultDateTimeFormat) + " | SOCKET DISCONNECT: " + socket.id));
    var sessionObj = sessionCache.get(socket.id) ;
    if (sessionObj) {
      sessionObj.connected = false ;
      sessionQueue.enqueue({sessionEvent: "SOCKET_DISCONNECT", sessionId: socket.id, session: sessionObj});
      debug(chalkDisconnect("\nDISCONNECTED SOCKET " + util.inspect(socket, {showHidden: false, depth: 1})));
    }
    else {
      console.log(chalkWarn("??? DISCONNECTED SOCKET NOT IN CACHE ... TIMED OUT? | " + socket.id));
    }
  });

  socket.on("REQ_ADMIN_SESSION", function(options){
    console.log(chalkAdmin(moment().format(defaultDateTimeFormat) 
      + " | REQ_ADMIN_SESSION: " + socketId
      + " | IP: " + ipAddress
      + " | SID: " + sessionObj.sessionId
      + " | OPTIONS: " + jsonPrint(options)      
    ));

    sessionQueue.enqueue({sessionEvent: "REQ_ADMIN_SESSION", session: sessionObj, options: options});
  });

  socket.on("REQ_USER_SESSION", function(options){
    console.log(chalkUser(moment().format(defaultDateTimeFormat) 
      + " | REQ_USER_SESSION: " + socketId
      + " | IP: " + ipAddress
      + " | SID: " + sessionObj.sessionId
      + " | OPTIONS: " + jsonPrint(options)      
    ));

    sessionQueue.enqueue({sessionEvent: "REQ_USER_SESSION", session: sessionObj, options: options});
  });

  socket.on("ADMIN_READY", function(adminObj){

    debug(chalkAdmin("ADMIN READY\n" + jsonPrint(adminObj)));

    var socketId = socket.id ;
    // var ipAddress = socket. ;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON ADMIN READY | " + socketId
      ));
      return;
    }

    console.log(chalkConnect("--- ADMIN READY   | " + adminObj.adminId
      + " | SID: " + sessionObj.sessionId
      + " | " + moment().format(defaultDateTimeFormat)
    ));

    sessionQueue.enqueue({sessionEvent: "ADMIN_READY", session: sessionObj, admin: adminObj});
  });

  socket.on("VIEWER_READY", function(viewerObj){

    debug(chalkViewer("VIEWER READY\n" + jsonPrint(viewerObj)));

    var socketId = socket.id ;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON VIEWER READY | " + socketId
      ));
      return;
    }
    console.log(chalkConnect("--- VIEWER READY   | " + viewerObj.viewerId
      + " | SID: " + sessionObj.sessionId
      + " | " + moment().format(defaultDateTimeFormat)
    ));

    sessionQueue.enqueue({sessionEvent: "VIEWER_READY", session: sessionObj, viewer: viewerObj});
  });

  socket.on("USER_READY", function(userObj){

    console.log(chalkUser("USER READY\n" + jsonPrint(userObj)));

    var socketId = socket.id ;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON USER READY | " + socketId
      ));
      return;
    }
    console.log(chalkConnect("--- USER READY   | " + userObj.userId
      + " | SID: " + sessionObj.sessionId
      + " | " + moment().format(defaultDateTimeFormat)
    ));

    sessionQueue.enqueue({sessionEvent: "USER_READY", session: sessionObj, user: userObj});
  });

  socket.on("RESPONSE_WORD_OBJ", function(rxInObj){

    var responseInObj = rxInObj ;

    // responseInObj.nodeId = rxInObj.nodeId.replace(/[\W_]+/g, '') ;

    responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, ' ') ;
    responseInObj.nodeId = responseInObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\'\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=]+/g, '') ;
    responseInObj.nodeId = responseInObj.nodeId.replace(/\s+/g, ' ') ;
    responseInObj.nodeId = responseInObj.nodeId.replace(/^\s+|\s+$/g, '') ;
    responseInObj.nodeId = responseInObj.nodeId.replace(/\'+/g, "'") ;
    responseInObj.nodeId = responseInObj.nodeId.toLowerCase();

    responseInObj.socketId = socket.id ;

    console.log(chalkResponse(">>> RX RESPONSE | " + responseInObj.nodeId));

    responseQueue.enqueue(rxInObj);
  });

  socket.on("BHT_REQUESTS", function(numberSocketBhtRequests){

    var n = parseInt(numberSocketBhtRequests);

    debug(chalkBht(">>> RX BHT_REQUESTS | " + socket.id + " | " + n ));

    incrementSocketBhtReqs(n);
  });

  socket.on("MW_REQUESTS", function(numberSocketMwRequests){

    var n = parseInt(numberSocketMwRequests);

    debug(chalkMw(">>> RX MW_REQUESTS | " + socket.id + " | " + n ));

    incrementSocketMwReqs(n);
  });

  socket.on("GET_RANDOM_WORD", function(){
    debug(chalkTest("RX GET_RANDOM_WORD | " + socket.id));
    words.getRandomWord(function(err, randomWordObj){
      socket.emit("RANDOM_WORD", randomWordObj.nodeId);
    });
  });

  socket.on("GET_SESSION", function(sessionId){
    console.log(chalkTest("RX GET_SESSION | " + sessionId + " | CHAIN LIMIT: " + SESSION_WORDCHAIN_REQUEST_LIMIT));
    findSessionById(sessionId, function(err, sessionObj){
      if (err){

      }
      else if (sessionObj) {

        var wordChainIndex = 0;
        var wordChainSegment = sessionObj.wordChain.slice(-SESSION_WORDCHAIN_REQUEST_LIMIT) ;


        async.forEachOf(

          wordChainSegment,  // iterate over wordChain array

          function(word, wordChainIndex, callback){

            Word.find({nodeId: word}, function(err, wordArray){
              if (err) {
                console.error("ERROR\n" + err);
                callback(err);
              }
              else if (!wordArray){
                callback(null);
              }
              console.log("FOUND CHAIN WORD[" + wordChainIndex + "]: " + wordArray[0].nodeId);
              var sessionUpdateObj = {
                  sessionId: sessionObj.sessionId,
                  wordChainIndex: wordChainIndex,
                  wordChainLength: sessionObj.wordChain.length,
                  wordChainSegmentLength: wordChainSegment.length,
                  word: wordArray[0]
              };
              socket.emit("SESSION", sessionUpdateObj);
              callback(null);
            });

          },

          function(err){
            if (!err) console.log("TX SESSION COMPLETE: " + sessionId);
          }

        )
      }
    });
  });

  socket.on("SOCKET_TEST_MODE", function(testMode){
    console.log(chalkTest("RX SOCKET_TEST_MODE: " + testMode));
    serverSessionConfig.testMode = testMode;
    adminNameSpace.emit("CONFIG_CHANGE", serverSessionConfig);
    // configEvents.emit("CONFIG_CHANGE", serverSessionConfig);
  });

  socket.on("UPDATE_BHT_REQS", function(newBhtRequests){
    console.log(chalkTest("RX UPDATE_BHT_REQS: " + newBhtRequests));
    if (newBhtRequests <= 0) {
      return;
    }
    else {
      console.log(chalkAdmin("@@@ RX UPDATE_BHT_REQS | " + socket.id + " | " + newBhtRequests));
      setBhtReqs(newBhtRequests);
    }
  });
}

adminNameSpace.on('connect', function(socket){
  console.log(chalkAdmin("ADMIN CONNECT"));
  createSession({namespace:"admin", socket: socket});
  socket.on('SET_WORD_CACHE_TTL', function(value){
    setWordCacheTtl(value);
  });

});

utilNameSpace.on('connect', function(socket){
  createSession({namespace:"util", socket: socket});
});

userNameSpace.on('connect', function(socket){
  createSession({namespace:"user", socket: socket});
});

viewNameSpace.on('connect', function(socket){
  createSession({namespace:"view", socket: socket});
});

testUsersNameSpace.on('connect', function(socket){
  createSession({namespace:"test-user", socket: socket});
});

testViewersNameSpace.on('connect', function(socket){
  createSession({namespace:"test-view", socket: socket});
});


var databaseEnabled = false ;

configEvents.on("INIT_DATABASE_COMPLETE", function(tweetCount){
  databaseEnabled = true ;
  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | DATABASE ENABLED"));
});


//=================================
//  METRICS INTERVAL
//=================================
var numberUsersTotal = 0;

var metricsInterval = setInterval(function () {

  numberAdmins = Object.keys(adminNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUtils = Object.keys(utilNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberUsers = Object.keys(userNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestUsers = Object.keys(testUsersNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberViewers = Object.keys(viewNameSpace.connected).length; // userNameSpace.sockets.length ;
  numberTestViewers = Object.keys(testViewersNameSpace.connected).length; // userNameSpace.sockets.length ;

  numberUsersTotal = numberUsers + numberTestUsers ;

  statsLogger.recordStat('numberViewers', numberViewers);
  statsLogger.recordStat('numberUsers', numberUsers);
  statsLogger.recordStat('numberTestUsers', numberTestUsers);
  statsLogger.recordStat('numberUsersTotal', numberUsersTotal);

  if (numberViewers > numberViewersMax) {
    numberViewersMaxTime = moment().valueOf();
    numberViewersMax = numberViewers;
    statsLogger.recordStat('numberViewersMax', numberViewers);
    console.log(chalkAlert("... NEW TOTAL MAX VIEWERS"
      + " | " + statsLogger.getStatValue('numberViewersMax') 
      + " | " + moment().format(defaultDateTimeFormat)));
  }
  else{
    statsLogger.recordStat('numberViewersMax', numberViewers);
  }

  if (numberUsersTotal > numberUsersTotalMax) {
    numberUsersTotalMaxTime = moment().valueOf();
    numberUsersTotalMax = numberUsersTotal ;
    statsLogger.recordStat('numberUsersTotalMax', numberUsersTotal);
    console.log(chalkAlert("... NEW TOTAL MAX USERS"
      + " | " + statsLogger.getStatValue('numberUsersTotalMax') 
      + " | " + moment().format(defaultDateTimeFormat)));
  }
  else{
    statsLogger.recordStat('numberUsersTotalMax', numberUsersTotal);
  }

  if (numberUsers > numberUsersMax) {
    numberUsersMaxTime = moment().valueOf();
    numberUsersMax = numberUsers;
    statsLogger.recordStat('numberUsersMax', numberUsers);
    console.log(chalkAlert("... NEW MAX USERS"
      + " | " + statsLogger.getStatValue('numberUsersMax') 
      + " | " + moment().format(defaultDateTimeFormat)));
  }
  else{
    statsLogger.recordStat('numberUsersMax', numberUsers);
  }


  if (numberTestUsers > numberTestUsersMax) {
    numberTestUsersMaxTime = moment().valueOf();
    numberTestUsersMax = numberTestUsers;
    statsLogger.recordStat('numberTestUsersMax', numberTestUsers);
    console.log(chalkAlert("... NEW MAX TEST USERS"
      + " | " + statsLogger.getStatValue('numberTestUsersMax') 
      + " | " + moment().format(defaultDateTimeFormat)));
  }
  else{
    statsLogger.recordStat('numberTestUsersMax', numberTestUsers);
  }


  var googleMetricsUpdateFlag = !disableGoogleMetrics && googleMetricsEnabled ;
  updateMetrics(googleMetricsUpdateFlag);
}, 1000);


//=================================
//  RATE CALC
//=================================
var responseRateQhead;
var rateQinterval = setInterval(function () {

  if (!responseRate1minQ.isEmpty()) {
    responseRateQhead = new Date(responseRate1minQ.peek());
    if ((responseRateQhead.getTime()+60000 < currentTime)){
      debug("<<< --- responseRate1minQ deQ: " + responseRateQhead.getTime() 
        + " | NOW: " + moment.utc().format());  
      responseRateQhead = responseRate1minQ.dequeue();
      debug("responseRate1minQ Q size: " + responseRate1minQ.size());   
    }
  }
}, 50);

//=================================
// INIT APP ROUTING
//=================================

function initAppRouting(callback){

  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | INIT APP ROUTING"));

  app.get('/threecee.pem', function(req, res){
    debug("LOADING FILE: threecee.pem");
    res.sendFile(__dirname + '/threecee.pem');
    return;
  });

  app.get('/', function(req, res){
    debug("LOADING PAGE: /");
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/admin', function(req, res){
    console.log("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
    return;
  });

  app.get('/admin/admin.html', function(req, res){
    console.log("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
    return;
  });

  app.get('/js/libs/progressbar.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/progressbar.js');
    return;
  });

  app.get('/js/libs/progressbar.min.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/progressbar.min.js');
    return;
  });

  app.get('/css/progressbar.css', function(req, res){
    res.sendFile(__dirname + '/css/progressbar.css');
    return;
  });

  app.get('/node_modules/debug/node_modules/debug.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/debug/node_modules/debug.js');
    return;
  });

  app.get('/util', function(req, res){
    debug(chalkAlert("UTIL PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/test-user', function(req, res){
    debug(chalkAlert("TEST USER PAGE REQUEST ... RETURNING index.html ..."));
    res.sendFile(__dirname + '/index.html');
    return;
  });

  app.get('/wordAssoClient.js', function(req, res){
    debug("LOADING PAGE: /wordAssoClient.js");
    res.sendFile(__dirname + '/wordAssoClient.js');
    return;
  });

  app.get('/session', function(req, res){
    debug("LOADING FILE: /session.html");
    res.sendFile(__dirname + '/session.html');
    return;
  });

  app.get('/js/libs/sessionView.js', function(req, res){
    debug("LOADING FILE: sessionView.js");
    res.sendFile(__dirname + '/js/libs/sessionView.js');
    return;
  });

  app.get('/css/main.css', function(req, res){
    res.sendFile(__dirname + '/css/main.css');
    return;
  });

  app.get('/css/style.css', function(req, res){
    res.sendFile(__dirname + '/css/style.css');
    return;
  });

  app.get('/css/base.css', function(req, res){
    res.sendFile(__dirname + '/css/base.css');
    return;
  });

  app.get('/node_modules/async/lib/async.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/async/lib/async.js');
    return;
  });

  app.get('/js/libs/Queue.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/Queue.js');
    return;
  });

  app.get('/node_modules/hashmap/hashmap.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/hashmap/hashmap.js');
    return;
  });

  app.get('/favicon.ico', function(req, res){
    debug("LOADING PAGE: /favicon.ico");
    res.sendFile(__dirname + '/favicon.png');
    return;
  });

  app.get('/favicon.png', function(req, res){
    debug("LOADING PAGE: /favicon.png");
    res.sendFile(__dirname + '/favicon.png');
    return;
  });

  configEvents.emit("INIT_APP_ROUTING_COMPLETE");
  callback(null, "INIT_APP_ROUTING_COMPLETE");
}

//=================================
// PROCESS HANDLERS
//=================================

process.on("message", function(msg) {

  if ((msg == 'SIGINT') || (msg == 'shutdown')) {
    
    console.log('\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n');
    console.log("... SAVING STATS");

    saveStats(dropboxHostStatsFile, wordAssoServerStatsObj, function(status){
      if (status != 'OK'){
        console.error("!!! ERROR: saveStats " + status);
      }
      else {
        console.log(chalkLog("UPDATE DROPBOX STATUS OK"));
      }
    });

    setTimeout(function() {
      console.log('**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n');
      process.exit(0);
    }, 300);

  }
});

//=================================
// BEGIN !!
//=================================
initializeConfiguration(function(err, results){
  if (err){
    console.error(chalkError("*** INITIALIZE CONFIGURATION ERROR ***\n" + jsonPrint(err)));
  }
  else {
    console.log(chalkLog("INITIALIZE CONFIGURATION COMPLETE\n" + jsonPrint(results)));
  }
});

updateStatsCounts();

module.exports = {
 app: app,
 io:io, 
 http: httpServer
}


