/*jslint node: true */
"use strict";

var BHT_REQUEST_LIMIT = 250000;

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

var maxNumberUsers = 0;
var maxNumberUsersTime = moment();

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
  "sessionUpdatesSent" : 0,

  "bhtRequests" : 0,

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

var chalkUser = chalk.green;
var chalkGreen = chalk.green;
var chalkAdmin = chalk.bold.cyan;
var chalkConnectAdmin = chalk.bold.cyan;
var chalkConnect = chalk.green;
var chalkDisconnect = chalk.black;
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

var clientIpHashMap = new HashMap();
var clientSocketIdHashMap = new HashMap();

var numberUsers = 0;
var numberViewers = 0;
var numberTestViewers = 0;
var numberTestUsers = 0;
var numberSessionClients = 0;

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
// WORD CACHE
// ==================================================================
var wordCacheTtl = process.env.WORD_CACHE_TTL || 60 ;
console.log("WORD CACHE TTL: " + wordCacheTtl);
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
      console.log(chalkLog(moment().format(defaultDateTimeFormat) + " | SAVED STATUS | FILE: " + dropboxHostStatsFile));
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
    numberUsers : numberUsers,
    numberViewers : numberViewers,
    numberTestViewers : numberTestViewers,
    numberTestUsers : numberTestUsers,
    numberSessionClients : numberSessionClients,
    maxNumberUsers : maxNumberUsers,
    maxNumberUsersTime : maxNumberUsersTime,
    promptsSent : promptsSent,
    responsesReceived: responsesReceived,
    bhtErrors: bhtErrors,
    bhtRequests: bhtRequests,
    totalSessions: totalSessions,
    sessionUpdatesSent: sessionUpdatesSent,
    totalWords: totalWords,
    wordCacheHits: wordCache.getStats().hits,
    wordCacheMisses: wordCache.getStats().misses
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

var Admin = require('mongoose').model('Admin');
var Client = require('mongoose').model('Client');

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
var client = new net.Socket();

var googleOauthEvents = new EventEmitter();

var Queue = require('queue-fifo');
var socketQueue = new Queue();
var sessionQueue = new Queue();

var MAX_WORD_HASH_MAP_COUNT = 20 ;
var wordArray = [] ; // used to keep wordHashMap.count() < MAX_WORD_HASH_MAP_COUNT

var NodeCache = require( "node-cache" );

var userCache = new NodeCache();
var wordCache = new NodeCache();
var sessionCache = new NodeCache();
var sessionHashMap = new HashMap();

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

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

wordCache.on( "expired", function(word, wordObj){
  debug("CACHE WORD EXPIRED\n" + jsonPrint(wordObj));
  debug("CACHE WORD EXPIRED | " + wordObj.nodeId 
    + " | LAST SEEN: " + getTimeStamp(wordObj.lastSeen)
    + " | AGO: " + msToTime(moment().valueOf() - wordObj.lastSeen)
    + " | M: " + wordObj.mentions
    + " | KEYS: " + wordCache.getStats().keys
    + " | HITS: " + wordCache.getStats().hits
    + " | MISSES: " + wordCache.getStats().misses
  );
});

var randomIntFromInterval = function (min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

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
    debug("dnsReverseLookup: DEVELOPMENT HOST: " + os.hostname() + " | " + ip);
    var domains =[];
    domains.push(localHostHashMap.get(ip));
    callback(null, domains);
  }
  else if (dnsHostHashMap.has(ip)) {
    var domains = dnsHostHashMap.get(ip) ;
    debug("dnsReverseLookup: HOST IN HASHMAP : " + os.hostname() + " | " + ip + " | " + domains);
    callback(null, domains);
  }
  else {
    dns.reverse(ip, function(err, domains){
      if (err){
        console.error('\n\n***** ERROR: DNS REVERSE IP: ' + ip + '\n' + err + '\n');
        callback(err, null);
      }
      else {
        debug('DNS REVERSE IP: ' + ip);
        dnsHostHashMap.set(ip, domains);
        domains.forEach(function(domain){
          debug("DOMAIN: " + domain);
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

var statsCountsComplete = false ;

function updateSessionViews(sessionUpdateObj){

  if (statsCountsComplete) {

    statsCountsComplete = false ;

    Session.count({}, function(err,count){
      if (!err){ 
        debug("TOTAL SESSIONS: " + count);
        totalSessions = count ;
        updateStats({totalSessions: totalSessions});
      } 
      else {
        console.error(chalkError("\n*** DB Session.count ERROR *** | " + moment().format(defaultDateTimeFormat) + "\n" + err));
      }

      Word.count({}, function(err,count){
        if (!err){ 
          debug("TOTAL WORDS: " + count);
          totalWords = count ;
          statsCountsComplete = true ;
        } 
        else {
          console.error(chalkError("\n*** DB Word.count ERROR *** | " + moment().format(defaultDateTimeFormat) + "\n" + err));
          statsCountsComplete = true ;
        }
      });

    });

  }

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

  if (!currentUser){
    console.log("sendPrompt | " + sessionObj.userId + " NOT FOUND IN USER CACHE ... SKIPPING | " + sessionObj.sessionId);
    return;
  }

  currentSession.wordChain.push(promptWordObj.nodeId);
  sessionCache.set(currentSession.sessionId, currentSession);

  var sourceWordObj ;

  if (currentSession.wordChain.length >= 2) {

    var previousResponse = currentSession.wordChain[currentSession.wordChain.length-2];

    sourceWordObj = wordCache.get(previousResponse);

    debug("CHAIN: " + currentSession.wordChain);
    console.log(chalkPrompt("P -->"
      + " | " + currentUser.userId 
      + " | " + sessionObj.sessionId 
      + " | " + previousResponse + " --> " + promptWordObj.nodeId));

  } else {

    sourceWordObj = promptWordObj;

    console.log(chalkPrompt("P -->"
      + " | " + currentUser.userId 
      + " | " + sessionObj.sessionId 
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
            // wordCache.set(word.nodeId, word, WORD_CACHE_TTL);
            wordCache.set(word.nodeId, word, wordCacheTtl);
            callback('BHT_OVER_LIMIT', word);
          }
          else if (status.indexOf("BHT_ERROR") >= 0) {
            debug(chalkError("bhtSearchWord dbUpdateWord findOneWord ERROR\n" + JSON.stringify(status)));
            wordCache.set(word.nodeId, word, wordCacheTtl);
            callback('BHT_ERROR', word);
          }
          else if (bhtResponseObj.bhtFound){
            debug(chalkBht("-*- BHT HIT   | " + bhtResponseObj.nodeId));
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj, wordCacheTtl);
            callback('BHT_HIT', bhtResponseObj);
          }
          else if (status == 'BHT_REDIRECT') {
            debug(chalkBht("-A- BHT REDIRECT  | " + wordObj.nodeId));
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj, wordCacheTtl);
            callback('BHT_REDIRECT', bhtResponseObj);
          }
          else {
            debug(chalkBht("-O- BHT MISS  | " + wordObj.nodeId));
            wordCache.set(bhtResponseObj.nodeId, bhtResponseObj, wordCacheTtl);
            callback('BHT_MISS', bhtResponseObj);
          }
        });
      }
      else if (word.bhtFound){
        debug(chalkBht("-F- BHT FOUND | " + word.nodeId));
        wordCache.set(word.nodeId, word, wordCacheTtl);
        callback('BHT_FOUND', word);
      }
      else {
        debug(chalkBht("-N- BHT NOT FOUND  | " + word.nodeId));
        wordCache.set(word.nodeId, word, wordCacheTtl);
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
  // console.log("generatePrompt: " + query.input + " | OPTIONS: " + jsonPrint(query));

  if (query.algorithm == 'random'){
    words.getRandomWord(function(err, randomWordObj){
      if (!err) {
        // console.log("randomWordObj: " + randomWordObj.nodeId);
        wordCache.set(randomWordObj.nodeId, randomWordObj, wordCacheTtl);
        callback('OK', randomWordObj);
      }
      else {
        callback('ERROR', err);
      }
    });

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
    wordObj.nodeId = wordObj.nodeId.replace(/[\n\r\[\]\{\}\<\>\/\;\:\"\'\`\~\?\!\@\#\$\%\^\&\*\(\)\_\+\=]+/g, '') ;
    wordObj.nodeId = wordObj.nodeId.replace(/\s+/g, ' ') ;
    wordObj.nodeId = wordObj.nodeId.replace(/^\s+|\s+$/g, '') ;
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

function setWordCacheTtl(value){
  console.log(chalkInfo("SET WORD CACHE TTL: PREV: " + wordCacheTtl + " | NOW: " + value));
  wordCacheTtl = parseInt(value) ;
  updateStats({ wordCacheTtl: wordCacheTtl });
}

function setBhtReqs(value){
  console.log(chalkInfo("SET BHT REQS: PREV: " + bhtRequests + " | NOW: " + value));
  bhtRequests = parseInt(value) ;
  updateStats({ bhtRequests: bhtRequests });
}

function incrementSocketBhtReqs(delta){

  if ((bhtRequests > BHT_REQUEST_LIMIT) || ((bhtRequests+delta) > BHT_REQUEST_LIMIT)){
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
  }
  incrementDeltaBhtReqs(delta);
}

function sessionUpdateDb (sessionObj, callback) {

  // debug("sessionUpdateDb: sessionObj: " + JSON.stringify(sessionObj, null, 3));
  // debug("sessionConnectDb: sessionObj: " + util.inspect(sessionObj, {showHidden: false, depth: 1}));

  var query = { sessionId: sessionObj.sessionId };

  var update = { 
          $set: { 
            "userId": sessionObj.userId,
            "namespace": sessionObj.namespace,
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
          + " | USR ID: " + ses.userId 
        ));
        callback(null, ses);
      }
    }
  );
}

function sessionDisconnectDb(sessionObj, callback){

  debug("sessionDisconnectDb: socketId: " + sessionObj.sessionId);

  var query = { "sessionId": sessionObj.sessionId };
  var update = { 
          $set: { 
            "userId": sessionObj.userId,
            "wordChain": sessionObj.wordChain,
            "lastSeen": sessionObj.lastSeen,
            "connected": false,
            "disconnectTime": moment()
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
          + " | " + sessionObj.ip 
          + "\n" + err);
        callback(err, sessionObj);
      }
      else {
        debug(chalkSession(">>> SESSION DISCONNECT UPDATED" 
          + "\n  SESSION ID: " + ses.sessionId
          + "\n  USER ID: " + ses.userId 
          + "\n  DISCONNECT TIME: " + getTimeStamp(ses.disconnectTime)
          + "\n  CREATED: " + getTimeStamp(ses.createdAt)
          + "\n  LAST SEEN: " + getTimeStamp(ses.lastSeen)
          + "\n  CONNECTED: " + ses.connected
          + "\n  DISCONNECT TIME: " + getTimeStamp(ses.disconnectTime)
        ));
        sessionHashMap.remove(ses.sessionId);
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
        console.log(chalkSession("SESSION\n" 
        ));
        callback(null, session);      
      }
      else {
        console.log(chalkAlert(moment().format(defaultDateTimeFormat) + " | SESSION NOT FOUND"));
        callback(null, null);      
      }
    }
  );
}

function adminConnectDb (adminObj, callback) {

  debug("adminConnectDb: adminObj: " + JSON.stringify(adminObj, null, 3));

  var query = { ip: adminObj.ip };
  var update = { 
          $inc: { "numberOfConnections": 1 }, 
          $set: { 
            "socketId": adminObj.socketId,
            "connectTime": currentTime,
            "disconnectTime": currentTime,
            "domain": adminObj.domain, 
            "lastSeen": currentTime 
          },
          $push: { "sessions": { 
                      "socketId": adminObj.socketId,
                      "connectedAt": currentTime
                    }
                  } 
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
          + " | " + adminObj.ip 
          + "\n" + err);
        callback(err, adminObj);
      }
      else {
        debug(">>> ADMIN CONNECT UPDATED " 
          + " | " + ad.ip
          + " | DOMAIN: " + ad.domain 
          + " | SOCKET ID: " + ad.socketId 
          + " | CONNECTIONS: " + ad.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          );
        callback(null, ad);
      }
    }
  );
}

function userUpdateDb (userObj, callback) {

  var query = { userId: userObj.userId };
  var update = { 
          $set: { 
            "screenName": userObj.screenName,
            "description": userObj.description,
            "url": userObj.url,
            "profileUrl": userObj.profileUrl,
            "profileImageUrl": userObj.profileImageUrl,
            "verified": userObj.verified,
            "lastSeen": moment(),
            "lastSession": userObj.lastSession,
            "connected": userObj.connected
          },
          $push: { "sessions": userObj.sessions } 
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
        console.log(">>> USER UPDATED" 
          + " | ID: " + us.userId
          + " | SN: " + us.screenName 
          + " | DES: " + us.description 
          + " | URL: " + us.url 
          + " | PURL: " + us.profileUrl 
          + " | PIURL: " + us.profileImageUrl 
          + " | VER: " + us.verified
          + " | LS: " + getTimeStamp(us.lastSeen)
          + " | SES: " + us.sessions.length
          + " | LSES: " + us.lastSession
          + " | CONN: " + us.connected
          );
        callback(null, us);
      }
    }
  );
}

function adminDisconnectDb (adminObj, callback) {

  debug("adminDisconnectDb: admin: " + JSON.stringify(adminObj, null, 3));

  var query = { ip: adminObj.ip };
  var update = { 
          $set: { 
            "socketId": adminObj.socketId,
            "connected": adminObj.connected,
            "config": adminObj.config,
            "referer": adminObj.referer,
            "connectTime": moment().valueOf(),
            "disconnectTime": moment().valueOf(),
            "domain": adminObj.domain, 
            "lastSeen": moment().valueOf() 
           }
          // $push: { "sessions": { 
          //             "socketId": adminObj.socketId,
          //             "disconnectedAt": currentTime
          //           }
          //         } 
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
          + " | " + adminObj.ip 
          + "\n" + err);
        callback(err, adminObj);
      }
      else {
        debug(">>> ADMIN DISCONNECT UPDATED " 
          + " | " + ad.ip
          + " | DOMAIN: " + ad.domain 
          + " | SOCKET ID: " + ad.socketId 
          + " | DISCONNECT TIME: " + ad.disconnectTime 
          + " | CONNECTIONS: " + ad.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          );
        callback(null, ad);
      }

    }
  );
}

function userDisconnectDb (userObj, callback) {

  debug("clientDisconnectDb: clientObj: " + clientObj.socketId + " | " + clientObj.ip);

  var query = { ip: clientObj.ip };
  var update = { 
          $set: { 
            "config": clientObj.config,
            "referer": clientObj.referer, 
            "domain": clientObj.domain, 
            "lastSeen": currentTime,
            "socketId" : clientObj.socketId, 
            "disconnectTime": currentTime
           },
          };
  var options = { upsert: true, new: true };

  Client.findOneAndUpdate(
    query,
    update,
    options,
    function(err, cl) {
      if (err) {
        console.error("!!! CLIENT FINDONE ERROR: " 
          + moment().format(defaultDateTimeFormat)
          + " | " + clientObj.ip 
          + "\n" + err);
        callback(err, clientObj);
      }
      else {
        debug(">>> CLIENT DISCONNECT UPDATED" 
          + " | IP: " + cl.ip
          + " | DOMAIN: " + cl.domain 
          + " | CONFIG: " + cl.config 
          + " | REFERER: " + cl.referer 
          + " | SOCKET ID: " + cl.socketId 
          + " | DISCONNECT TIME: " + cl.disconnectTime 
          + " | CONNECTIONS: " + cl.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(cl.lastSeen)
          );
        callback(null, cl);
      }
    }
  );
}

function adminFindAllDb (options, callback) {

  debug("\n=============================\nADMINS IN DB\nOPTIONS");
  debug(options);

  var query = {};
  var projections = {
    ip: true,
    domain: true,
    socketId: true,
    lastSeen: true,
    // connected: true,
    connectTime: true,
    disconnectTime: true,
    numberOfConnections: true
  };

  Admin.find(query, projections, function(err, admins) {

    admins.forEach(function(admin) {
        debug("IP: " + admin.ip 
        + " | SOCKET: " + admin.socketId
        + " | DOMAIN: " + admin.domain
        + " | LAST SEEN: " + admin.lastSeen
        + " | CONNECT TIME: " + admin.connectTime
        + " | DISCONNECT TIME: " + admin.disconnectTime
        + " | NUM SESSIONS: " + admin.numberOfConnections
        );
      adminIpHashMap.set(admin.ip, admin);
      adminSocketIdHashMap.set(admin.socketId, admin);
    });

    debug(adminIpHashMap.count() + " KNOWN ADMINS");
    callback(adminIpHashMap.count());
  });
}

function userFindAllDb (options, callback) {

  console.log("\n=============================\nUSERS IN DB\n----------");
  if (options) console.log("OPTIONS\n" + jsonPrint(options));

  var query = {};
  var projections = {
    userId: true,
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
      for (var i=0; i<users.length; i++) {
        console.log("USER " + users[i].userId
          + "\n" + chalkLog(util.inspect(users[i], {showHidden: false, depth: 1})
        ));
        userCache.set(users[i].userId, users[i]);
        if (i >= users.length) {
          callback(null, users.length);
          return;
        }
      }
    }
    else {
      console.log("NO USERS FOUND");
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
var metricDateStart = moment().toJSON();
var metricDateEnd = moment().toJSON();  

function updateMetrics(){

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

  if (typeof googleMonitoring === 'undefined'){
    console.error("updateMetrics: googleMonitoring UNDEFINED ... SKIPPING METRICS UPDATE");
    return null;
  }

  // name: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers
  // label key: custom.cloudmonitoring.googleapis.com/word-asso/clients/numberUsers

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
          "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheHits"
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
          "metric": "custom.cloudmonitoring.googleapis.com/word-asso/word-cache/wordCacheMisses"
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
          + "\n" + util.inspect(err, {showHidden: false, depth: 1})
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

    deltaPromptsSent = 0 ;
    deltaResponsesReceived = 0 ;
    incrementDeltaBhtReqs(0);
}

var readDnsQueue = setInterval(function (){

  if (!dnsReverseLookupQueue.isEmpty()){
    var clientObj = dnsReverseLookupQueue.dequeue();

    dnsReverseLookup(clientObj.ip, function(err, domains){
      if (err){
        console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + clientObj.ip + " ERROR: " + err));
      }
      else {
        debug("DNS REVERSE LOOKUP: " + clientObj.ip + " | DOMAINS: " + domains);
        clientObj.domain = domains[0];
      }

    });

  }
}, 20);

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
        var options ;
        userFindAllDb(options, function(numberUsers){
          console.log("NUMBER USERS: " + numberUsers);
        });
        break;

      case 'SESSION_CREATE':
        console.log(chalkSession(
          ">>> SESSION CREATE"
          + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.session.sessionId
          // + " | UID: " + sesObj.user.userId
        ));
        sessionCache.set(sesObj.session.sessionId, sesObj.session);
        break;

      case 'SOCKET_DISCONNECT':
        debug(chalkSession(
          "XXX SOCKET DISCONNECT"
          // + " | NSP: " + sesObj.session.namespace
          + " | SID: " + sesObj.sessionId
          // + " | UID: " + sesObj.user.userId
        ));

        var currentSession = sessionCache.get(sesObj.sessionId);
        var currentUser = userCache.get(currentSession.userId);

        sessionCache.del(currentSession.sessionId);
        if (currentUser) {
          userCache.del(currentUser.userId);
          currentUser.connected = false;
          userUpdateDb(currentUser, function(){});
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
        sesObj.user.connected = false;
        userUpdateDb(sesObj.user, function(){});
        break;

      case 'USER_READY':

        debug(chalkSession(
          ">>> SESSION USER READY"
          + " | SID: " + sesObj.session.sessionId
          + " | UID: " + sesObj.user.userId
        ));

        var currentSession = sessionCache.get(sesObj.session.sessionId);
        currentSession.userId = sesObj.user.userId;

        sesObj.user.lastSession = sesObj.session.sessionId;
        sesObj.user.connected = true;

        userUpdateDb(sesObj.user, function(){});

        sessionCache.set(currentSession.sessionId, currentSession, function( err, success ){
          if( !err && success ){
            userCache.set(currentSession.userId, sesObj.user, function( err, success ){
              if( !err && success ){
                words.getRandomWord(function(err, randomWordObj){
                  if (!err) {
                    // console.log("randomWordObj\n" + jsonPrint(randomWordObj));
                    wordCache.set(randomWordObj.nodeId, randomWordObj, wordCacheTtl);
                    // currentSession.wordChain.push(randomWordObj.nodeId);
                    sessionCache.set(currentSession.sessionId, currentSession);
                    sendPrompt(currentSession, randomWordObj);
                  }
                  else {
                  }
                });
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

    updateStats({ responsesReceived: responsesReceived });

    var socketId = responseInObj.socketId;

    var currentSessionObj = sessionCache.get(socketId);

    if (!currentSessionObj) {
      console.error("??? SESSION NOT IN CACHE ON RESPONSE Q READ (DISCONNECTED?) " + socketId);
      return ; 
    }

    currentSessionObj.lastSeen = moment().valueOf();

    // console.log("currentSession.wordChain: " + currentSessionObj.wordChain);

    var promptWordObj ;
    var previousPrompt = currentSessionObj.wordChain[currentSessionObj.wordChain.length-1] ;
    var previousPromptObj = wordCache.get(previousPrompt);
    if (!previousPromptObj) {
      console.log(chalkWarn("??? previousPrompt NOT IN CACHE: " + previousPrompt));
    }

    console.log(chalkResponse("R <--"
      + " | " + currentSessionObj.userId 
      + " | " + socketId 
      + " | " + responseInObj.nodeId + " <-- " + previousPrompt));

    var responseWordObj;

    // ADD/UPDATE WORD IN DB
    dbUpdateWord(responseInObj, true, function(status, responseWordObj){
      if ((status == 'BHT_ERROR') || (status == 'BHT_OVER_LIMIT')) {
        wordCache.set(responseInObj.nodeId, responseInObj, wordCacheTtl);
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
        wordCache.set(responseWordObj.nodeId, responseWordObj, wordCacheTtl);
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

var readPromptQueue = setInterval(function (){

  if (!promptQueue.isEmpty()){

    var currentAlgorithm = 'random';
    var currentSessionId = promptQueue.dequeue();

    var currentSession = sessionCache.get(currentSessionId);

    if (!currentSession) {
      console.log(chalkWarn("??? SESSION EXPIRED ??? ... SKIPPING SEND PROMPT | " + currentSessionId));
      return;
    }

    debug("readPromptQueue currentSession\n" + jsonPrint(currentSession));

    var currentResponse = currentSession.wordChain[currentSession.wordChain.length-1];

    var query = { input: currentResponse, algorithm: currentAlgorithm};

    generatePrompt(query, function(status, responseObj){
      if (status == 'ERROR') {
        console.log(chalkError("**** generatePrompt ERROR\n" + jsonPrint(responseObj)))
      }
      else if (status == 'OK') {
        // console.log(chalkPrompt("PROMPT: " + responseObj.nodeId));
        wordCache.set(responseObj.nodeId, responseObj, wordCacheTtl);
        sendPrompt(currentSession, responseObj);
      }
    });

  }
}, 20);


function initializeConfiguration() {

  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | initializeConfiguration ..."));

  async.series([

    // DATABASE INIT
    function(callbackSeries){
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | START DATABASE INIT"));

      async.parallel(
        [

          // CLIENT IP INIT
          // function(callbackParallel) {
          //   console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | CLIENT IP INIT"));
          //   clientFindAllDb(null, function(numberOfClientIps){
          //     console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps));
          //     callbackParallel();
          //   });
          // },
          // ADMIN IP INIT
          function(callbackParallel) {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | ADMIN IP INIT"));
            adminFindAllDb(null, function(numberOfAdminIps){
              console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps));
              callbackParallel();
            });
          }
        ],
        function(err){
          if (err) {
            console.error(chalkError("\n" + moment().format(defaultDateTimeFormat) + "!!! DATABASE INIT ERROR: " + err));
            callbackSeries(err);
            // return;
          }
          else {
            console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | DATABASE INIT COMPLETE"));
            configEvents.emit('DATABASE_INIT_COMPLETE', moment().format(defaultDateTimeFormat));
            callbackSeries();
          }
        }
      );
    },

    // APP ROUTING INIT
    function(callbackSeries){
      debug(chalkInfo(moment().format(defaultDateTimeFormat) + " | APP ROUTING INIT"));
      initAppRouting();
      callbackSeries();
    },

    // CONFIG EVENT
    function(callbackSeries){
      console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | INIT CONFIG COMPLETE"));
      serverSessionConfig = { 
        testMode: testMode
      };
      debug("SESSION CONFIGURATION\n" + JSON.stringify(serverSessionConfig, null, 3) + "\n");
      callbackSeries();
    },

    // SERVER READY
    function(callbackSeries){

      debug("... CHECKING INTERNET CONNECTION ...");

      client.connect(80, 'www.google.com', function() {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + ' | CONNECTED TO GOOGLE: OK'));
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | SEND SERVER_READY"));
        internetReady = true ;
        configEvents.emit("SERVER_READY");
        client.destroy();
        callbackSeries();
      });
    },

    // GOOGLE INIT
    function(callbackSeries){
      if (!disableGoogleMetrics) {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE INIT"));
        findCredential(GOOGLE_SERVICE_ACCOUNT_CLIENT_ID, function(){
          callbackSeries();
        });
      }
      else {
        console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | GOOGLE INIT *** SKIPPED *** | GOOGLE METRICS DISABLED"));
        callbackSeries();
      }
    }



  ]);
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
      + " | BHTR: " + txHeartbeat.bhtRequests
      + " | MEM: " + txHeartbeat.memoryAvailable + "/" + txHeartbeat.memoryTotal
    ));
  }

  var serverHeartbeatInterval = setInterval(function () {

    // numberAdmins = io.of('/admin').sockets.length;
    // numberUsers = io.of('/').sockets.length - io.of('/admin').sockets.length;

    numberAdmins = adminNameSpace.sockets.length;
    numberUsers = userNameSpace.sockets.length;
    numberTestUsers = testUsersNameSpace.sockets.length;
    numberViewers = viewNameSpace.sockets.length;
    numberTestViewers = testViewersNameSpace.sockets.length;

    if (numberUsers > maxNumberUsers) {
      maxNumberUsers = numberUsers;
      maxNumberUsersTime = currentTime;
      console.log(chalkAlert("NEW MAX CLIENTS CONNECTED: " + maxNumberUsers 
        + " | " + moment().format(defaultDateTimeFormat)));
    }

    runTime =  moment() - startTime ;

    // if (bhtOverLimitFlag && moment().isAfter(bhtOverLimitTime)){
    //   bhtEvents.emit("BHT_OVER_LIMIT_TIMEOUT");
    // }   

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

        // wordHashMapCount : wordHashMap.count(),
        wordCacheStats : wordCache.getStats(),
        
        clientIpHashMapCount : clientIpHashMap.count(),
        clientSocketIdHashMapCount : clientSocketIdHashMap.count(),
        sessionHashMapCount : sessionHashMap.count(),

        numberAdmins : numberAdmins,
        numberViewers : numberViewers,
        numberUsers : numberUsers,
        numberTestUsers : numberTestUsers,

        maxNumberUsers : maxNumberUsers,
        maxNumberUsersTime : maxNumberUsersTime,

        totalWords : totalWords,
        bhtRequests : bhtRequests,

        bhtOverLimitFlag : bhtOverLimitFlag,
        bhtLimitResetTime : bhtLimitResetTime,
        bhtOverLimitTime : bhtOverLimitTime,
        bhtTimeToReset : bhtTimeToReset,

        totalSessions : totalSessions,
        totalUsers : totalUsers,

        promptsSent : promptsSent,
        responsesReceived : responsesReceived

      } ;

      io.emit('HEARTBEAT', txHeartbeat);

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

  // var userId = newSessionObj.userId ;
  var namespace = newSessionObj.namespace ;
  var socket = newSessionObj.socket ;
  var socketId = newSessionObj.socket.id;
  var ipAddress = newSessionObj.socket.handshake.headers['x-real-ip'] || newSessionObj.socket.client.conn.remoteAddress;
  var hostname = newSessionObj.socket.handshake.headers.host ;
  var domain = "UNKNOWN" ;

  numberAdmins = adminNameSpace.sockets.length;
  numberUsers = userNameSpace.sockets.length;
  numberViewers = viewNameSpace.sockets.length;
  numberTestUsers = testUsersNameSpace.sockets.length;
  numberTestViewers = testViewersNameSpace.sockets.length;

  var sessionObj = new Session ({
    sessionId: socketId,
    // userId: userId,
    namespace: namespace,
    createAt: moment().valueOf(),
    lastSeen: moment().valueOf(),
    connected: true,
    connectTime: moment(),
    disconnectTime: null
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
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + " | SOCKET RECONNECT: " + socket.id));
    sessionQueue.enqueue({sessionEvent: "SOCKET_RECONNECT", sessionId: socket.id});
  });

  socket.on("disconnect", function(){
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) + " | SOCKET DISCONNECT: " + socket.id));
    sessionQueue.enqueue({sessionEvent: "SOCKET_DISCONNECT", sessionId: socket.id});
    debug(chalkDisconnect("\nDISCONNECTED SOCKET " + util.inspect(socket, {showHidden: false, depth: 1})));
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

  socket.on("USER_READY", function(userObj){

    debug(chalkUser("USER READY\n" + jsonPrint(userObj)));

    var socketId = socket.id ;
    var sessionObj = sessionCache.get(socketId);

    if (!sessionObj){
      console.log(chalkError(moment().format(defaultDateTimeFormat) 
        + " | ??? SESSION NOT FOUND ON USER READY | " + socketId
      ));
      return;
    }
    console.log(chalkConnect(moment().format(defaultDateTimeFormat) 
      + " | USER_READY: " + userObj.userId
      + " | SID: " + sessionObj.sessionId
    ));

    sessionQueue.enqueue({sessionEvent: "USER_READY", session: sessionObj, user: userObj});
  });

  socket.on("RESPONSE_WORD_OBJ", function(rxInObj){

    var responseInObj = rxInObj ;

    // responseInObj.nodeId = rxInObj.nodeId.trim() ;
    responseInObj.nodeId = rxInObj.nodeId.replace(/[\W_]+/g, '') ;

    responseInObj.socketId = socket.id ;

    debug(chalkResponse(">>> RX RESPONSE | " + responseInObj.nodeId));

    responseQueue.enqueue(rxInObj);
  });

  socket.on("BHT_REQUESTS", function(numberSocketBhtRequests){

    var n = parseInt(numberSocketBhtRequests);

    console.log(chalkBht(">>> RX BHT_REQUESTS | " + socket.id + " | " + n ));

    incrementSocketBhtReqs(n);
  });

  socket.on("GET_RANDOM_WORD", function(){
    debug(chalkTest("RX GET_RANDOM_WORD | " + socket.id));
    words.getRandomWord(function(err, randomWordObj){
      socket.emit("RANDOM_WORD", randomWordObj.nodeId);
    });
  });

  socket.on("GET_SESSION", function(sessionId){
    console.log(chalkTest("RX GET_SESSION | " + sessionId));
    findSessionById(sessionId, function(err, sessionObj){
      if (err){

      }
      else if (sessionObj) {
        socket.emit("SESSION", sessionObj);
      }
    });
  });

  socket.on("SOCKET_TEST_MODE", function(testMode){
    console.log(chalkTest("RX SOCKET_TEST_MODE: " + testMode));
    serverSessionConfig.testMode = testMode
    io.of('/admin').emit("CONFIG_CHANGE", serverSessionConfig);
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
  createSession({namespace:"admin", socket: socket});
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

configEvents.on("DATABASE_INIT_COMPLETE", function(tweetCount){
  databaseEnabled = true ;
  console.log(chalkInfo(moment().format(defaultDateTimeFormat) + " | DATABASE ENABLED"));
});


//=================================
//  METRICS INTERVAL
//=================================
var metricsInterval = setInterval(function () {

  if (!disableGoogleMetrics && googleMetricsEnabled) {
    updateMetrics();
  }

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

function initAppRouting(){

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

  app.get('/admin/admin.html', function(req, res){
    debug("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
    return;
  });

  app.get('/node_modules/debug/node_modules/debug.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/debug/node_modules/debug.js');
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

  app.get('/admin/admin.html', function(req, res){
    debug("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
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
initializeConfiguration();

User.count({}, function(err,count){
  if (!err){ 
    console.log("TOTAL USERS: " + count);
    totalUsers = count ;
    updateStats({totalUsers: totalUsers});
  } 
  else {
    console.error(chalkError("\n*** DB User.count ERROR *** | " + moment().format(defaultDateTimeFormat) + "\n" + err));
  }
});

Session.count({}, function(err,count){
  if (!err){ 
    console.log("TOTAL SESSIONS: " + count);
    totalSessions = count ;
    updateStats({totalSessions: totalSessions});
  } 
  else {
    console.error(chalkError("\n*** DB Session.count ERROR *** | " + moment().format(defaultDateTimeFormat) + "\n" + err));
  }
});

Word.count({}, function(err,count){
  if (!err){ 
    console.log("TOTAL WORDS: " + count);
    totalWords = count ;
    statsCountsComplete = true ;
    updateStats({totalWords: totalWords});
  } 
  else {
    console.error(chalkError("\n*** DB Word.count ERROR *** | " + moment().format(defaultDateTimeFormat) + "\n" + err));
    statsCountsComplete = true ;
  }
});

module.exports = {
 app: app,
 io:io, 
 http: httpServer
}


