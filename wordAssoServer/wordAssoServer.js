/*jslint node: true */
"use strict";


/*

INITIALIZATION SEQUENCE:

- VERIFY INTERNET CONNECTION
- INIT DROPBOX
- LOAD CONFIG (FROM DROPBOX IF OK, ELSE USE ENV VARIABLES)

- INIT DB
--- INIT HASHMAPS FROM DB (ADMINS, CLIENTS, HASHTAGS, MEDIA, TWEETS, ETC)

- INIT GOOGLE
--- GOOGLE OAUTH
--- GOOGLE METRICS

- INIT SOCIAL MEDIA STREAMS
--- INIT TWITTER SEARCH STREAM
--- INIT INSTAGRAM SEARCH STREAM
--- INIT FACEBOOK STREAM

*/

console.log(
  '\n\n====================================================================================================\n' 
  +   '========================================= ***START*** ==============================================\n' 
  +   '====================================================================================================\n' 
  +    process.argv[1] + '\nSTARTED ' + Date() + '\n'
  +   '====================================================================================================\n' 
  +   '========================================= ***START*** ==============================================\n' 
  +   '====================================================================================================\n\n'
  );

process.on("message", function(msg) {
  if (msg == 'shutdown') {
    // Your process is going to be reloaded
    // You have to close all database/socket.io/* connections

    console.log('\n\n!!!!! RECEIVED PM2 SHUTDOWN !!!!!\n\n***** Closing all connections *****\n\n');

    // You will have 4000ms to close all connections before
    // the reload mechanism will try to do its job

    setTimeout(function() {
      console.log('**** Finished closing connections ****\n\n ***** RELOADING blm.js NOW *****\n\n');
      // This timeout means that all connections have been closed
      // Now we can exit to let the reload mechanism do its job
      process.exit(0);
    }, 1500);
  }
});

var CALLBACK_HOSTNAME = 'http://threeceelabs.com'
if (typeof process.env.CALLBACK_HOSTNAME !== 'undefined'){
  CALLBACK_HOSTNAME = process.env.CALLBACK_HOSTNAME ;
}

var ONE_SECOND = 1000 ;
var ONE_MINUTE = ONE_SECOND*60 ;
var ONE_HOUR = ONE_MINUTE*60 ;
var ONE_DAY = ONE_HOUR*24 ;

var currentTime = Date.now();
var startTime = currentTime;
var runTime = 0;

var currentTimeInteval = setInterval(function () {
  var d = new Date();
  currentTime = d.getTime();
}, 10);


var twitterYamlConfigFile = process.env.BLM_DEFAULT_TWITTER_CONFIG;
var twitterMaxTrackingNumber = process.env.TWITTER_MAX_TRACKING_NUMBER;
var maxTracksReached = false ;

// ==================================================================
// TWEET TIME TABLE SERVER
// ==================================================================
var tweetTimeTableServerEnabled = false ;
var tweetTimeTableSocketId ;

// ==================================================================
// TEST CONFIG
// ==================================================================
var testMode = false ;
var sendTestTweetInterval = 1000 ;
var testSendInterval = 500 ; // ms

// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var chalk = require('chalk');

var chalkGreen = chalk.green;

var chalkAdmin = chalk.bold.cyan;
var chalkConnectAdmin = chalk.bold.cyan;

var chalkConnect = chalk.bold.green;
var chalkDisconnect = chalk.bold.blue;

var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.yellow;

var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;

var chalkTwitter = chalk.blue;

var chalkInstagram = chalk.green;
var chalkInstagramB = chalk.bold.green;

var chalkFacebook = chalk.magenta;

var chalkGoogle = chalk.cyan;

// =================

var MAX_TX_SESSIONS = 100 ;
var MAX_STATS = 500;  // MAX NUMBER OF STATS TO SEND TO CLIENTS ON PAGE LOAD
var MAX_PLACE_STATS = 10;  // MAX NUMBER OF STATS TO SEND TO CLIENTS ON PAGE LOAD

var sessionConfig = {};
var configChangeFlag = false ;

var serverReady = false ;
var internetReady = false ;

var updateMetricsInterval = 10 * ONE_SECOND ;
var googleCheckDailyLimitInterval = 10 * ONE_MINUTE ;  // check every 10 minutes

var searchByDateTimeEnableFlag = false ;
var searchByDateTimeContinueFlag = false ;

var maxTwitterDirectMessageRxId = 0;
var lastTestTweetId = 0;


var autoSearchTermEnable = false;
if (process.env.AUTO_SEARCH_TERM_ENABLE > 0) autoSearchTermEnable = true ;
console.log("AUTO_SEARCH_TERM_ENABLE: " + autoSearchTermEnable);

var autoTweetStreamEnable = false;
if (process.env.AUTO_TWEET_STREAM_ENABLE > 0) autoTweetStreamEnable = true ;
console.log("AUTO_TWEET_STREAM_ENABLE: " + autoTweetStreamEnable);

var enablePollInstagramTags = false;
if (process.env.POLL_INSTAGRAM_TAGS_ENABLE > 0) enablePollInstagramTags = true ;
console.log("POLL_INSTAGRAM_TAGS_ENABLE: " + enablePollInstagramTags);

var autoInstagramStreamEnable = false;
if (process.env.AUTO_INSTAGRAM_STREAM_ENABLE > 0) autoInstagramStreamEnable = true ;
console.log("AUTO_INSTAGRAM_STREAM_ENABLE: " + autoInstagramStreamEnable);

// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================
var moment = require('moment');

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

// ==================================================================
// EVENT EMITTER/LISTENER INIT
// ==================================================================

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var EventEmitter = require("events").EventEmitter;

var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

var testEvents = new EventEmitter();
var googleOauthEvents = new EventEmitter();

// ==================================================================
// ENV INIT
// ==================================================================
var debug = require('debug')('blm');
var debugTw = require('debug')('blm:twitter');
var debugIg = require('debug')('blm:instagram');
var debugFb = require('debug')('blm:facebook');

if (debug.enabled || debugIg.enabled){
  console.log("\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}


debug('NODE_ENV BEFORE: ' + process.env.NODE_ENV);
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log('NODE_ENV : ' + process.env.NODE_ENV);

console.log('... SERVER NODE_ENV: ' + process.env.NODE_ENV );
console.log('... CLIENT HOST + PORT: ' + 'http://localhost:' + config.port);

// ==================================================================
// DROPBOX
// ==================================================================
var DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN ;

var DROPBOX_DEFAULT_MAP_FILE = process.env.DROPBOX_DEFAULT_MAP_FILE || 'blmMap.json';

var DROPBOX_DEFAULT_SEARCH_TERMS_FILE = process.env.DROPBOX_DEFAULT_SEARCH_TERMS_FILE;
var DROPBOX_SEARCH_TERMS_FILE = process.env.DROPBOX_SEARCH_TERMS_FILE;
var DROPBOX_NEW_SEARCH_TERMS_FILE = process.env.DROPBOX_NEW_SEARCH_TERMS_FILE;
var DROPBOX_POSSIBLE_SEARCH_TERMS_FILE = process.env.DROPBOX_POSSIBLE_SEARCH_TERMS_FILE;
var DROPBOX_BLACKLIST_SEARCH_TERMS_FILE = process.env.DROPBOX_BLACKLIST_SEARCH_TERMS_FILE;

var DROPBOX_DEFAULT_TWEET_TIME_TABLE_DIR = process.env.DROPBOX_DEFAULT_TWEET_TIME_TABLE_DIR ;

var Dropbox = require("dropbox");

var dropboxClient = new Dropbox.Client({
    token: DROPBOX_ACCESS_TOKEN
});

dropboxClient.authDriver(new Dropbox.AuthDriver.NodeServer(8191));

dropboxClient.getAccountInfo(function(error, accountInfo) {
  if (error) {
    console.error("\n*** DROPBOX getAccountInfo ERROR ***\n" + JSON.stringify(error, null, 3));
    return error;  // Something went wrong.
  }

  debug(chalkInfo("DROPBOX ACCOUNT INFO: " + JSON.stringify(accountInfo,null,3) ));
});

// ==================================================================
// MONGO DATABASE CONFIG
// ==================================================================

console.log("\n------------------------\nMONGO DATABASE CONFIG");

var db = mongoose();

var Tweet = require('mongoose').model('Tweet');

var IgMedia = require('mongoose').model('IgMedia');
var IgTag = require('mongoose').model('IgTag');
var IgPlace = require('mongoose').model('IgPlace');

var Admin = require('mongoose').model('Admin');
var Client = require('mongoose').model('Client');
var Oauth2credential = require('mongoose').model('Oauth2credential');


// ==================================================================
// APP HTTP IO DNS CONFIG -- ?? order is important.
// ==================================================================
var app = express(); 

var http = require('http').Server(app);

http.maxSockets = 100;

var io = require('socket.io')(http);
var dns = require('dns');
var path = require('path');

// METRICS

var htOneMinWindowHistogram = {};


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
    // weekday: "long", year: "numeric", month: "short",
    weekday: "none", year: "numeric", month: "numeric",
    day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit"
  };

  if (typeof inputTime === 'undefined') {
    currentTimeStamp = moment();
    // currentDate = new Date().toDateString("en-US", options);
    // currentTime = new Date().toTimeString('en-US', options);
  }
  else if (moment.isMoment(inputTime)) {
    // console.log("getTimeStamp: inputTime: " + inputTime + " | NOW: " + Date.now());
    currentTimeStamp = moment(inputTime);
    // currentDate = new Date().toDateString("en-US", options);
    // currentTime = new Date().toTimeString('en-US', options);
  }
  else {
    currentTimeStamp = moment(parseInt(inputTime));
    // var d = new Date(inputTime);
    // currentDate = new Date(d).toDateString("en-US", options);
    // currentTime = new Date(d).toTimeString('en-US', options);
  }
  return currentTimeStamp.format("YYYY-MM-DD HH:mm:ss ZZ");
}

// function getTimeStamp(inputTime) {
//   var options = {
//     timeZone: "America/New_York", year: "numeric", month: "numeric",
//     day: "numeric", hour: "2-digit", hour12: false,  minute: "2-digit",  second: "2-digit"
//   };

//   var ct ;

//   if (typeof inputTime === 'undefined') {
//     ct = new Date().toLocaleString('en-US', options);
//   }
//   else {
//     ct = new Date(inputTime).toLocaleString('en-US', options);
//   }
//   return ct;
// }

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

function dropboxWriteArrayToFile(filePath, dataArray, callback){

  if (typeof filePath === 'undefined'){
    console.error(chalkError(getTimeStamp() + " | !!! DROPBOX WRITE FILE ERROR: FILE PATH UNDEFINED"));
    callback('FILE PATH UNDEFINED', null);
  }

  var dataString = dataArray.join('\n');

  dropboxClient.writeFile(filePath, dataString, function(error, stat) {
    if (error) {
      console.error(chalkError(getTimeStamp() + " | !!! DROPBOX WRITE FILE ERROR: " + error));
      callback(error, filePath);
    }
    else {
      debug(chalkInfo(getTimeStamp() + " | DROPBOX FILE WRITE: " + filePath));
      callback(null, stat);
    }
  });
}

function updateInstagramMetric(igMedia){
  debugIg("IG RATE FIFO PUSH: NOW: " + getTimeNow() + " | MEDIA CREATED AT: " + igMedia.created_time);
  igRate1minQ.enqueue(Date.now());
  // IgMedia.count({}, function(err, count) {
  //   if (!err){ 
  //     numberIgMediaReceived = count ;
  //     // console.log("Instagram Media INIT: " + getTimeStamp() + " | TOTAL INSTAGRAM MEDIA: " + numberIgMediaReceived);
  //     configEvents.emit('HASHMAP_INIT_COMPLETE.IG_MEDIA', count);
  //   } 
  // });
  numberIgMediaReceived++ ;
  deltaIgMediaReceived++ ;
}

function updateTweetsMetric(tweet){
  debug("TW RATE FIFO PUSH: NOW: " + getTimeNow() + " | TWEET CREATED AT: " + tweet.created_at);
  tweetRate1minQ.enqueue(Date.now());
}

function updateMetrics(numberClientsConnected, numberTweetsReceived, numberRetweetsReceived, tweetsPerMin, numberIgMediaReceived, igMediaPerMin){

  var metricDate = new Date().toJSON();

  debug(getTimeStamp() 
    + " | updateMetrics CLIENTS: " + numberClientsConnected 
    + " | TPM: " + tweetsPerMin 
    + " | T: " + numberTweetsReceived 
    + " | RT: " + numberRetweetsReceived
    + " | IGPM: " + igMediaPerMin
    + " | IG: " + numberIgMediaReceived
    );

  if (typeof googleMonitoring === 'undefined'){
    console.error("updateMetrics: googleMonitoring UNDEFINED ... SKIPPING METRICS UPDATE");
    // console.log("updateMetrics: AUTHORIZE GOOGLE");
    // authorizeGoogle();
    return null;
  }

  googleMonitoring.timeseries.write({
    'project': GOOGLE_PROJECT_ID,
    'resource': {
       "timeseries": [
        {
         "point": {
          "int64Value": numberClientsConnected,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/numberClientsConnected" : "clientsConnected"},
          "metric": "custom.cloudmonitoring.googleapis.com/twitter/clients/numberClientsConnected"
         }
        },

        {
         "point": {
          "int64Value": Math.round(tweetsPerMin),
          // "doubleValue": tweetsPerMin,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/tweetsPerMin" : "tweetsPerMin"},
          "metric": "custom.cloudmonitoring.googleapis.com/twitter/tweets/tweetsPerMin"
         }
        },

        {
         "point": {
          "int64Value": numberTweetsReceived,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/tweets" : "tweets"},
          "metric": "custom.cloudmonitoring.googleapis.com/twitter/tweets/totalTweets"
         }
        },

        {
         "point": {
          "int64Value": deltaTweetsReceived,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/delta_tweets" : "delta_tweets"},
          "metric": "custom.cloudmonitoring.googleapis.com/twitter/tweets/deltaTweets"
         }
        },

        {
         "point": {
          "int64Value": numberRetweetsReceived,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/retweets" : "retweets"},
          "metric": "custom.cloudmonitoring.googleapis.com/twitter/tweets/totalTweets"
         }
        },

        {
         "point": {
          "int64Value": deltaRetweetsReceived,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/delta_retweets" : "delta_retweets"},
          "metric": "custom.cloudmonitoring.googleapis.com/twitter/tweets/deltaTweets"
         }
        },

        {
         "point": {
          "int64Value": igMediaPerMin,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/instagram/media/mediaPerMin" : "Instagram Media Per Min"},
          "metric": "custom.cloudmonitoring.googleapis.com/instagram/media/mediaPerMin"
         }
        },

        {
         "point": {
          "int64Value": numberIgMediaReceived,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/instagram/media/totalMedia" : "Total Instagram Media Received"},
          "metric": "custom.cloudmonitoring.googleapis.com/instagram/media/totalMedia"
         }
        },

        {
         "point": {
          "int64Value": deltaIgMediaReceived,
          "start": metricDate,
          "end": metricDate
         },
         "timeseriesDesc": {
          "labels": { "custom.cloudmonitoring.googleapis.com/instagram/media/deltaMedia" : "Delta Instagram Media Received"},
          "metric": "custom.cloudmonitoring.googleapis.com/instagram/media/deltaMedia"
         }
        }

       ]
      }
    }, function(err, res){
      if (err) {
        console.error("!!! GOOGLE CLOUD MONITORING ERROR " 
          + " | " + getTimeStamp() 
          + "\n" + err.toString());
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
    });

    deltaTweetsReceived = 0 ;
    deltaRetweetsReceived = 0 ;

    deltaIgMediaReceived = 0 ;
}

function oauthExpiryTimer(endTime) {

  var remainingTime = msToTime(endTime - getTimeNow());

  debug("\nSET oauthExpiryTimer: " + getTimeStamp(endTime));
  console.log(chalkInfo(getTimeStamp() + " | GOOGLE OAUTH2 CREDENTIAL EXPIRES IN: " + remainingTime 
    + " AT " + getTimeStamp(endTime)
    ));

  var oauthInterval = setInterval(function () {

      remainingTime = msToTime(endTime - getTimeNow());

      if (endTime - getTimeNow() < 60000) {
        console.log(chalkAlert(getTimeStamp() + " | GOOGLE OAUTH2 CREDENTIAL EXPIRING IN " + remainingTime
        ));
      }

      if (getTimeNow() >= endTime) {
        console.log(chalkAlert(getTimeStamp() + " | GOOGLE OAUTH2 CREDENTIAL EXPIRED: " 
          + " | " + getTimeStamp(endTime)));
        clearInterval(oauthInterval);
        googleAuthorized = false ;
        googleMetricsEnabled = false ;
        googleOauthEvents.emit('GOOGLE OAUTH2 CREDENTIAL EXPIRED');
        googleOauthEvents.emit('AUTHORIZE GOOGLE');
      }

  }, 10000);
}

function dnsReverseLookup(ip, callback) {
  if (localHostHashMap.has(ip)) {
    debug("dnsReverseLookup: DEVELOPMENT HOST: " + os.hostname() + " | " + ip);
    var domains =[];
    domains.push('threeceelabs.com');
    domains.push('threeceemedia.com');
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

function findClientsSocket(namespace) {
  var res = new HashMap();
  var ns = io.of(namespace ||"/");    // the default namespace is "/"

  if (ns) {
    for (var id in ns.connected) {
      res.set(id, ns.connected[id]);
    }
  }
  return res;
}

function getMetricData(metric, callback) {
  var youngest = new Date().toJSON()

  // var oldest = getTimeNow() - (1000 * 60);
  var oldest = new Date(getTimeNow() - (1000 * 60));

  console.log(chalkInfo("... GET METRIC DATA: " + metric + " | OLDEST: " + oldest + " | YOUNGEST: " + youngest));

  googleMonitoring.timeseries.list({
    'project': GOOGLE_PROJECT_ID,
    'metric': 'custom.cloudmonitoring.googleapis.com/' + metric,
    'youngest': youngest
  }, function(err, response) {
    if (err) {
      console.error("\n*** ERROR: GET METRIC DATA\n" + err);
      callback(err, null);
    }
    debug("GET METRIC DATA\n" + JSON.stringify(response, null, 3));
    callback(null, response);
  });
}

function searchByTweetId(reqObj){

  console.log("searchByTweetId\n" + JSON.stringify(reqObj, null, 3));

  var nextSearchTweetId ;

  tweets.tweetByID(reqObj.searchTweetId, reqObj.searchLimit, function(tweetsRes){
    if (tweetsRes) {
      var lastTimeStamp = moment.utc(tweetsRes[tweetsRes.length-1].createdAt);
      var startTimeStamp = moment.utc(reqObj.startTime);
      if (lastTimeStamp.isBefore(startTimeStamp)){
        console.log("*** LAST TWEET CREATED BEFORE STARTTIME" 
          + " | CREATED: " + lastTimeStamp.format()
          + " | START: " + startTimeStamp.format()
          + " ... SEARCH BY ID: " + tweetsRes[tweetsRes.length-1].tweetId
        );
        debug("nextSearchTweet\n" + JSON.stringify(tweetsRes[tweetsRes.length-1], null, 3));

        if (tweetsRes.length == 1) {
          nextSearchTweetId = tweetsRes[0].tweetId+1 ;
        }
        else {
          nextSearchTweetId = tweetsRes[tweetsRes.length-1].tweetId ;
        }

        searchByTweetId({
          searchTweetId: nextSearchTweetId, 
          startTime: reqObj.startTime, 
          endTime: reqObj.endTime,
          searchLimit: reqObj.searchLimit
        })

      }
      else {
        console.log("=== LAST TWEET CREATED AFTER STARTTIME" 
          + " | CREATED: " + lastTimeStamp.format()
          + " | START: " + startTimeStamp.format()
        );

        lastTestTweetId = tweetsRes[0].tweetId ;
        console.log("=== LAST TWEET ID (lastTestTweetId): " + lastTestTweetId); 

        for (var i=0; i<tweetsRes.length; i++){
          console.log(chalkTest("@@@ FOUND TWEET: SEARCH ID: " + reqObj.searchTweetId 
            + " | FOUND: " + tweetsRes[i].tweetId
            + " | CREATED: " + tweetsRes[i].status.created_at
          ));
          io.of('/admin').emit("TWEETS_DATE_RANGE_RES", JSON.stringify(tweetsRes[i].status));
          io.of('/').to(reqObj.gtttSocketId).emit('node', tweetsRes[i]);
        }
      }
    }
    else {
      console.log(chalkError("--- TWEET NOT FOUND BY ID ???" + reqObj.searchTweetId));
    }
  });

}

function createClientSocket (socket){

  var clientsHashMap = findClientsSocket('/');
  var referer = 'CLIENT';

  debug("\nSOCKET NAMESPACE\n" + util.inspect(socket.nsp, {showHidden: false, depth: 1}));

  // debug("\n\n===================================\nCLIENT CONNECT\n" 
  //   + util.inspect(io.of('/').sockets, {showHidden: false, depth: 1})
  //   + "\n========================================\n"
  // );

  // debug("\n\n===================================\nTEST CLIENT CONNECT\n" 
  //   + util.inspect(io.of('/test').sockets, {showHidden: false, depth: 1})
  //   + "\n========================================\n"
  // );

  // ????? KLUDGE: cannot get socket.io namespaces to work, so this is a hack
  // to distinguish connections based on the referring page
  
  if (socket.nsp.name.indexOf('admin') >= 0) {
    referer = 'ADMIN';
    debug("@@@ ADMIN CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
      return 1;   
  }
  else if (socket.nsp.name.indexOf('test') >= 0) {
    referer = 'TEST';
    debug("@@@ TEST CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
  }
  else if (socket.nsp.name.indexOf('blacklivesmatter') >= 0) {
    referer = 'CLIENT';
    debug("@@@ CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
  }
  else if (socket.nsp.name.indexOf('stats') >= 0) {
    referer = 'CLIENT';
    debug("@@@ CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | NAMESPACE: " + socket.nsp.name
      ); 
  }
  else if (typeof socket.handshake.headers.referer !== 'undefined'){
    if (socket.handshake.headers.referer.indexOf('admin') >= 0) {
      referer = 'ADMIN';
      debug("@@@ ADMIN CONNECTED: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
        );
      // not a client connection. quit
      return 1;   
    }
    else if (socket.handshake.headers.referer.indexOf('test') >= 0) {
      referer = 'TEST';
      debug("@@@ TEST CLIENT CONNECTED: " + getTimeStamp() 
        + " | " + socket.id 
        + " | REFERER: " + socket.handshake.headers.referer
        ); 
    }
  }
  else {
    referer = 'CLIENT';
    debug(">>> CLIENT CONNECTED: " + getTimeStamp() 
      + " | " + socket.id 
      + " | REFERER: " + 'CLIENT'
      ); 
  }

  numberClientsConnected = io.of('/').sockets.length;


  // console.log(chalkConnect("CLIENT CONNECTED [" + numberClientsConnected + "] " 
  //   + socket.id 
  //   + " | " + getTimeStamp()
  //   + " | " + socket.connected
  // ));


  // numberClientsConnected++;
  var socketId = socket.id;

  var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;

  // check for IPV6 address
  if (clientIp.indexOf(':') >= 0){
    var ipParts = clientIp.split(':');
    var clientIp4 = ipParts.pop();

    if (clientIp4 == '1'){
      clientIp4 = '127.0.0.1';
    }
    console.log("\n... CONVERTING IPV6 IP " + clientIp + " TO IPV4: " + clientIp4 + "\n");
    clientIp = clientIp4 ;
  }


  var clientHostname = socket.handshake.headers.host ;
  var clientDomain ;

  var clientObj = {
          type: 'CLIENT',  
          ip: clientIp, 
          domain: clientDomain,
          socketId: socketId,
          socket: socket,
          referer: referer,
          connected: true, 
          connectTime: currentTime, 
          // disconnectTime: currentTime
        };

  // adding also after enqueue; adding early to so add will show up earlier
  clientSocketIdHashMap.set(socketId, clientObj);  

  socketQueue.enqueue(clientObj);

  readSocketQueue();

  socket.on("error", function(err){
    console.error(chalkError(getTimeStamp() + " | *** SOCKET ERROR: " + err));
    // console.error(chalkError("\nSOCKET ERROR" + util.inspect(socket, {showHidden: false, depth: 1})));
  });

  socket.on("TWEET_TIME_TABLE", function(tttsId){
    console.log(chalkTwitter(getTimeStamp() + " | TWEET_TIME_TABLE CONNECTED: SOCKET ID: " + tttsId));
    tweetTimeTableServerEnabled = true;
    tweetTimeTableSocketId = tttsId ;
  });

  socket.on("TWEET_TIME_TABLE_TWEET_ID", function(rxObj){
    // var gtttSocketId = socket.id;
    var resObj = JSON.parse(rxObj);
    resObj.searchLimit = 100 ;
    resObj.gtttSocketId = socket.id
    console.log(chalkTwitter(getTimeStamp() + " | RX TWEET_TIME_TABLE_TWEET_ID: GTTT SOCKET: " 
      + resObj.gtttSocketId + "\n" + JSON.stringify(resObj, null, 3)
    ));
    if (resObj.searchTweetId) {
      console.log(chalkTwitter(getTimeStamp() + " | @@@-> RX TWEET_TIME_TABLE_TWEET_ID: " + resObj.searchTweetId));
      searchByTweetId(resObj);
    }
    else {  // NOT FOUND IN TWEET TIME TABLE
      console.log("XXX NOT FOUND RX TWEET_TIME_TABLE_TWEET_ID ... SEARCHING BY DATE\n" + JSON.stringify(resObj, null, 3));
      tweets.tweetByTimeStamp(resObj.startTime, function(tweets){
        console.log(chalkTest('\n===============================\n@@@+++ TWEETS_DATE_RANGE | ' + getTimeStamp() 
          + ' | FOUND ' + tweets.length + ' TWEETS IN DATE RANGE: ' + resObj.startTime + ' - ' + resObj.endTime
        ));

        lastTestTweetId = tweets[0].tweetId ;
        console.log("=== LAST TWEET ID (lastTestTweetId): " + lastTestTweetId); 

        for (var i=0; i<tweets.length; i++){
          debug(chalkTest('TWEETS_DATE_RANGE: SENT TWEET ' + tweets[i].tweetId));
          tweets[i].status.tweetsReceived = numberTweetsReceived ;
          io.of('/admin').to(resObj.socketId).emit("TWEETS_DATE_RANGE_RES", JSON.stringify(tweets[i].status));
        }
      });
    }
  });

  socket.on("STATS_TPM", function(youngest){
    var socketId = socket.id;
    var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
    console.log('\n@@@>>> STATS_TPM RXCD: socketIp: ' + clientIp + ' | socketId: ' + socketId + ' | ' + getTimeStamp());
    getMetricData('twitter/tweets/tweetsPerMin', function(err, tpmData){
      if (err){
        console.error("*** ERROR getMetricData " + err);
      }
      else {
        var timeSeriesArray = [] ;
        console.log("TPM DATA SERIES: " + tpmData.timeseries[0].points.length + " POINTS");
        for (var i = 0; (i < 100 && i < tpmData.timeseries[0].points.length); i++){
          console.log("> ADD TMP DATA: " + tpmData.timeseries[0].points[i].int64Value + " " + tpmData.timeseries[0].points[i].start);
          timeSeriesArray.push({'value': tpmData.timeseries[0].points[i].int64Value, 'timestamp': tpmData.timeseries[0].points[i].start});
          if (i == 99 || i == tpmData.timeseries[0].points.length-1) {
            socket.emit("STATS_TPM_DATA", JSON.stringify(timeSeriesArray));
          }
        }
      }
    })
  });

  socket.on("STATS_TWEET_INIT", function(timeStamp){
    var socketId = socket.id;
    var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
    console.log('\n@@@>>> STATS_TWEET_INIT RXCD: socketIp: ' + clientIp + ' | socketId: ' + socketId + ' | ' + timeStamp);
    tweets.sendStats(io, socketId, 'tweet', MAX_STATS);
  });

  socket.on("STATS_HASHTAG_INIT", function(timeStamp){
    var socketId = socket.id;
    var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
    console.log('\n@@@>>> STATS_HASHTAG_INIT RXCD: socketIp: ' + clientIp + ' | socketId: ' + socketId + ' | ' + timeStamp);
    tweets.sendStats(io, socketId, 'hashtag', MAX_STATS);
  });

  socket.on("STATS_PLACE_INIT", function(maxNodes){
    var socketId = socket.id;
    var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
    console.log('\n@@@>>> STATS_PLACE_INIT RXCD: socketIp: ' + clientIp + ' | socketId: ' + socketId + ' | ' + getTimeStamp());
    tweets.sendStats(io, socketId, 'place', maxNodes);
    instagrams.sendStats(io, socketId, 'ig_place', maxNodes);
  });

  socket.on("STATS_MEDIA_INIT", function(timeStamp){
    var socketId = socket.id;
    var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
    console.log('\n@@@>>> STATS_MEDIA_INIT RXCD: socketIp: ' + clientIp + ' | socketId: ' + socketId + ' | ' + timeStamp);
    tweets.sendStats(io, socketId, 'media', MAX_STATS);
  });

  socket.on("disconnect", function(){

    var socketId = socket.id ;

    debug(chalkDisconnect("\nDISCONNECTED SOCKET " + util.inspect(socket, {showHidden: false, depth: 1})));

    if (socketId == tweetTimeTableSocketId) {
      console.error("\n*** TWEET_TIME_TABLE DISCONNECTED: SOCKET ID: " + socketId);
      tweetTimeTableServerEnabled = false ;
    }

    if (clientSocketIdHashMap.has(socketId)) {

      var clientObj = clientSocketIdHashMap.get(socketId);

      clientObj.type = 'CLIENT';
      clientObj.connected = false;
      clientObj.disconnectTime = currentTime;

      debug("--- DISCONNECT: FOUND SOCKET IN HASH: " + clientObj.ip + " " + clientObj.socketId);
      debug("clientSocketIdHashMap count: " + clientSocketIdHashMap.count());

      socketQueue.enqueue(clientObj);
      readSocketQueue();
      clientSocketIdHashMap.remove(socketId);

    }
    else {
      clientSocketIdHashMap.remove(socketId);
      debug("??? SOCKET NOT FOUND IN HASH ... " + socketId);      
      debug("clientSocketIdHashMap count: " + clientSocketIdHashMap.count());
    }

    readSocketQueue();
  });

  socket.on("close", function(){

    var socketId = socket.id ;

    console.log(chalkClosed("CLOSED SOCKET " + socketId));

    if (clientSocketIdHashMap.has(socketId)) {

      var clientObj = clientSocketIdHashMap.get(socketId);

      clientObj.type = 'CLIENT';
      clientObj.connected = false;
      clientObj.disconnectTime = currentTime;

      debug("FOUND SOCKET IN HASH: " + clientObj.ip + " " + clientObj.socketId);
      debug("clientSocketIdHashMap count: " + clientSocketIdHashMap.count());

      socketQueue.enqueue(clientObj);
      readSocketQueue();

    }
    else {
      clientSocketIdHashMap.remove(socketId);
      debug("??? SOCKET NOT FOUND IN HASH ... " + socketId);      
      debug("clientSocketIdHashMap count: " + clientSocketIdHashMap.count());
    }

    readSocketQueue();
  });
}

function readSocketQueue(){

  var socketObj = {};

  if (!socketQueue.isEmpty()){

    socketObj = socketQueue.dequeue();


    debug("\n%%% DEQUEUE socketQueue: socketObj: " + socketObj.type 
      + " | SOCKET ID: " + socketObj.socketId 
      + " | IP: " + socketObj.ip 
      + " | REFERER: " + socketObj.referer 
      + " | CONNECTED: " + socketObj.connected
      + " | CONNECT TIME: " + socketObj.connectTime
      + " | DISCONNECT TIME: " + socketObj.disconnectTime
      + "\n"
    );
    // debug(util.inspect(socketObj, {showHidden: false, depth: 1}));
    if (typeof socketObj.socket !== 'undefined'){
      debug("... CONNECT STATE: " + socketObj.socket.connected + " | CLIENT OBJ CONN: " + socketObj.connected);
    }
    else if (socketObj.connected){
      debug("??? MISMATCH ??? DISCONNECTED STATE: CLIENT OBJ CONN: " + socketObj.connected);      
    }
    else{
      debug(chalkDisconnect("... DISCONNECT DE-Q : CLIENT OBJ CONN: " + socketObj.socketId));      
    }


    if (socketObj.connected) {

      async.waterfall(
        [
          function(callback) {

            // debug('async.series: dnsReverseLookup');

            dnsReverseLookup(socketObj.ip, function(err, domains){
              if (err){
                console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + socketObj.ip + " ERROR: " + err));
              }
              else {
                debug("DNS REVERSE LOOKUP: " + socketObj.ip + " | DOMAINS: " + domains);
                socketObj.domain = domains[0];
              }
              callback(err, socketObj);
            });
          },

          function(socketObj, callback) {

            clientConnectDb(socketObj, function(err, cl){
              if (err){
                console.error(chalkError("\n\n***** ERROR: clientConnectDb: " + err));
                callback(err, socketObj);
              }
              else {
                debug("--- CLIENT DB UPDATED: "
                  + cl.ip
                  + " | S: " + cl.socketId 
                  + " | D: " + cl.domain
                  + " | R: " + cl.referer
                  + " | CREATED AT: " + getTimeStamp(cl.createdAt)
                  + " | LAST SEEN: " + getTimeStamp(cl.lastSeen)
                  + " | CONNECTIONS: " + cl.numberOfConnections
                );
                // debug(JSON.stringify(cl, null, 3));
                callback(null, cl);
              }
            });
          },

          function(socketObj, callback) {
            clientSocketIdHashMap.set(socketObj.socketId, socketObj);
            clientIpHashMap.set(socketObj.ip, socketObj);
            callback(null, socketObj);
          }
        ], 
        function(err, socketObj){
          if (err){
            clientSocketIdHashMap.remove(socketObj.socketId);
            socketObj.connected = false ;
            socketObj.disconnectTime = currentTime ;
            console.error(chalkError("\n *** CL CONNECT ERROR *** " 
              + "[" + numberClientsConnected + "] " 
              + " | " + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
              + "\n" + err
            ));
          }
          else if (socketObj.referer == 'TEST') {
            socketObj.connected = true ;
            socketObj.connectTime = currentTime ;
            socketObj.sessions = [] ;
            io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: true, clientObj: socketObj}));

            console.log(chalkTest("TEST CL CONNECT    "
              + "[" + numberTestClients + "] " 
              + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
            ));
          }
          else{
            socketObj.connected = true ;
            socketObj.connectTime = currentTime ;
            socketObj.sessions = [] ;
            io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: true, clientObj: socketObj}));

            console.log(chalkConnect("CL CONNECT    "
              + "[" + numberClientsConnected + "] " 
              + getTimeStamp() 
              + " | S: " + socketObj.socketId 
              + " | I: " + socketObj.ip 
              + " | D: " + socketObj.domain
              + " | R: " + socketObj.referer
            ));
          }
        }
      );
    }

    else {

      debug("@@@ DISCONNECT SOCKET " + socketObj.socketId + " | " + socketObj.connected);

      clientSocketIdHashMap.remove(socketObj.socketId);

      clientDisconnectDb(socketObj, function(err, cl){
        if (err){
          console.error(chalkError("\n\n***** ERROR: clientDisconnectDb: " + err));
          // clientSocketIdHashMap.remove(socketObj.socketId);
          clientIpHashMap.set(socketObj.ip, socketObj);
        }
        else {
          debug("--- CLIENT DB UPDATED: "
            + cl.ip
            + " | SOCKET ID: " + cl.socketId 
            + " | " + cl.domain
            + " | CREATED AT: " + getTimeStamp(cl.createdAt)
            + " | LAST SEEN: " + getTimeStamp(cl.lastSeen)
            + " | CONNECTIONS: " + cl.numberOfConnections
          );
          // debug(JSON.stringify(cl, null, 3));

          cl.connected = false ;
          cl.disconnectTime = currentTime ;
          cl.sessions = [] ;
          io.of('/admin').emit('CLIENT SESSION', JSON.stringify({connected: false, clientObj: cl}));

          // clientSocketIdHashMap.remove(cl.socketId);
          // clientIpHashMap.set(cl.ip, cl);

          console.log(chalkDisconnect("CL DISCONNECT " 
              + "[" + numberClientsConnected + "] " 
            + getTimeStamp() 
            + " | S: " + cl.socketId 
            + " | I: " + cl.ip 
            + " | D: " + cl.domain 
            + " | R: " + cl.referer
            ));
          }
      });
    }

  }
}

var trackingNumber = 0;

function twitterTrack(searchTerm, mode){
  if (mode == 'track') { 
    if (trackingNumber < twitterMaxTrackingNumber){
      trackingNumber++;
      twitterStreamChannelsClient.track(searchTerm);
      debug(chalkInfo("+++ TRACK [" + trackingNumber + "]: " + searchTerm));
    }
    else if (!maxTracksReached) {
      debug(chalkAlert(getTimeStamp() + " | MAX NUMBER OF TWITTER TRACKS REACHED: " + trackingNumber 
        + " ... SKIPPING REMAINING SEARCH TERMS ... " + searchTerm
      ));
      maxTracksReached = true ;
    }
  } else if (mode == 'untrack') {  
    trackingNumber--;
    twitterStreamChannelsClient.untrack(searchTerm);
    debug(chalkInfo("--- TWITTER UNTRACK [" + trackingNumber + "]: " + searchTerm));
  }
}
 
function sendDirectMessage(user, message, callback) {
  
  twit.post('direct_messages/new', {screen_name: user, text:message}, function(error, response){

    if(error) {
      console.error("!!!!! TWITTER SEND DIRECT MESSAGE ERROR: " + getTimeStamp() + '\n'  + JSON.stringify(error, null, 2));
    }
    else{
      console.log(chalkTwitter(getTimeStamp() + " | SENT TWITTER DM TO " + user + ": " + response.text));
      callback(null, message) ;
    }

  });
}

function findOneOauth2Credential (credential, io) {

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
        console.error(chalkError(getTimeStamp() + " | !!! OAUTH2 CREDENTIAL FINDONE ERROR" 
          + "\nCLIENT ID: "  + credential.clientId 
          + "\nERROR" + err
        ));
        getErrorMessage(err);
        return credential;
      }
      else {
        console.log(chalkInfo(getTimeStamp() + " | GOOGLE CREDENTIAL UPDATED"
          + " | EXPIRES AT " + getTimeStamp(cred.expiryDate)
        ));
        debug(chalkGoogle("\n\n--- OAUTH2 CREDENTIAL UPDATED---" 
          + "\nCREDENTIAL TYPE: " + cred.credentialType 
          + "\nCLIENT ID:       " + cred.clientId 
          + "\nCLIENT SECRET:   " + cred.clientSecret 
          + "\nEMAIL ADDR:      " + cred.emailAddress 
          + "\nTOKEN TYPE:      " + cred.tokenType 
          + "\nACCESS TOKEN:    " + cred.accessToken 
          + "\nREFRESH TOKEN:   " + cred.refreshToken 
          + "\nEXPIRY DATE:     " + getTimeStamp(cred.expiryDate)
          // + "\nLAST SEEN:       " + getTimeStamp(Date(cred.lastSeen)) 
          + "\nLAST SEEN:       " + getTimeStamp(cred.lastSeen) 
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
         + getTimeStamp() 
         + "\nCLIENT ID: "  + clientId 
         + "\n" + err));
        getErrorMessage(err);
        googleOauthEvents.emit('credential error', clientId + "\n" + err);        
        callback(err);  
        // return;    
      }
      else if (cred) {
        console.log(chalkInfo(getTimeStamp() + " | GOOGLE OAUTH2 CREDENTIAL FOUND"));
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
        console.log(chalkAlert(getTimeStamp() + "| GOOGLE OAUTH2 CREDENTIAL NOT FOUND"));
        googleOauthEvents.emit('GOOGLE CREDENTIAL NOT FOUND', clientId);        
        callback(null);      
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
            // "connected": true,
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
          + getTimeStamp()
          + " | " + adminObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, adminObj);
      }
      else {
        debug(">>> ADMIN CONNECT UPDATED " 
          + " | " + ad.ip
          + " | DOMAIN: " + ad.domain 
          + " | SOCKET ID: " + ad.socketId 
          // + " | CONNECTED: " + ad.connected 
          + " | CONNECTIONS: " + ad.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          );
        callback(null, ad);
      }
    }
  );
}

function clientConnectDb (clientObj, callback) {

  // debug("clientConnectDb: clientObj: " + JSON.stringify(clientObj, null, 3));
  // debug("clientConnectDb: clientObj: " + util.inspect(clientObj, {showHidden: false, depth: 1}));
    if (typeof clientObj.socket !== 'undefined'){
      debug("clientConnectDb CONNECT STATE: " + clientObj.socket.connected + " | CLIENT OBJ CONN: " + clientObj.connected);
    }
    else{
      debug("??? DISCONNECTED STATE: CLIENT OBJ CONN: " + clientObj.connected);      
    }

  var query = { ip: clientObj.ip };
  var update = { 
          $inc: { "numberOfConnections": 1 }, 
          $set: { 
            "socketId": clientObj.socketId,
            "referer": clientObj.referer,
            "connectTime": currentTime,
            "disconnectTime": currentTime,
            "domain": clientObj.domain, 
            "lastSeen": currentTime 
          },
          $push: { "sessions": { 
                      "socketId": clientObj.socketId,
                      "connectedAt": currentTime
                    }
                  } 
          };
  var options = { upsert: true, new: true };

  Client.findOneAndUpdate(
    query,
    update,
    options,
    function(err, cl) {
      if (err) {
        console.error("!!! CLIENT FINDONE ERROR: " 
          + getTimeStamp()
          + " | " + clientObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, clientObj);
      }
      else {
        debug(">>> CLIENT UPDATED" 
          + " | I: " + cl.ip
          + " | D: " + cl.domain 
          + " | S: " + cl.socketId 
          + " | R: " + cl.referer 
          + " | CONS: " + cl.numberOfConnections 
          + " | LAST: " + getTimeStamp(cl.lastSeen)
          );
        callback(null, cl);
      }
    }
  );
}

function adminDisconnectDb (adminObj, callback) {

  debug("adminDisconnectDb: admin: " + JSON.stringify(adminObj, null, 3));

  var query = { ip: adminObj.ip };
  var update = { 
          $set: { 
            "domain": adminObj.domain, 
            "lastSeen": currentTime,
            "socketId" : adminObj.socketId, 
            "disconnectTime": currentTime
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
          + getTimeStamp()
          + " | " + adminObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, adminObj);
      }
      else {
        debug(">>> ADMIN DISCONNECT UPDATED " 
          + " | " + ad.ip
          + " | DOMAIN: " + ad.domain 
          + " | SOCKET ID: " + ad.socketId 
          // + " | CONNECTED: " + ad.connected 
          + " | DISCONNECT TIME: " + ad.disconnectTime 
          + " | CONNECTIONS: " + ad.numberOfConnections 
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          );
        callback(null, ad);
      }

    }
  );
}

function clientDisconnectDb (clientObj, callback) {

  debug("clientDisconnectDb: clientObj: " + clientObj.socketId + " | " + clientObj.ip);

  var query = { ip: clientObj.ip };
  var update = { 
          $set: { 
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
          + getTimeStamp()
          + " | " + clientObj.ip 
          + "\n" + err);
        getErrorMessage(err);
        callback(err, clientObj);
      }
      else {
        debug(">>> CLIENT DISCONNECT UPDATED" 
          + " | IP: " + cl.ip
          + " | DOMAIN: " + cl.domain 
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
        // + " | CONNECTED: " + admin.connected
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

function clientFindAllDb (options, callback) {

  debug("\n=============================\nCLIENTS IN DB\nOPTIONS");
  debug(options);

  var query = {};
  var projections = {
    ip: true,
    domain: true,
    socketId: true,
    lastSeen: true,
    referer: true,
    connectTime: true,
    disconnectTime: true,
    numberOfConnections: true
  };

  Client.find(query, projections, options, function(err, clients) {

    clients.forEach(function(client) {
        debug("IP: " + client.ip 
        + " | SOCKET: " + client.socketId
        + " | DOMAIN: " + client.domain
        + " | REFERER: " + client.referer
        + " | LAST SEEN: " + client.lastSeen
        + " | CONNECT TIME: " + client.connectTime
        + " | DISCONNECT TIME: " + client.disconnectTime
        + " | NUM SESSIONS: " + client.numberOfConnections
        );
      clientIpHashMap.set(client.ip, client);
    });
    debug(clientIpHashMap.count() + " KNOWN CLIENTS");
    callback(clientIpHashMap.count());
  });
}

var getErrorMessage = function(err) {
  var message = '';
  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
      console.error("... DB ERROR ..." 
        + " | " + getTimeStamp() 
        + "\n" +  JSON.stringify(err));
        break;
      default:
        message = 'Something went wrong';
    }
  }
  else {
    for (var errName in err.errors) {
      if (err.errors[errName].message)
        message = err.errors[errName].message;
    }
  }

  return message;
};

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

function authorizeGoogle(){
  googleOauthClient.authorize(function(err, tokens) {
    if (err){
      console.error(chalkError(getTimeStamp() + " | ***** GOOGLE OAUTH ERROR: googleOauthClient " 
        + " | " + getTimeStamp()
        + "\n" 
        + err
        + "\n" 
      ));
      googleOauthEvents.emit('GOOGLE OAUTH ERROR', err);
    }
    else {

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

      findOneOauth2Credential(credential, io);
      googleAuthorized = true ;
      googleMetricsEnabled = true ;
      oauthExpiryTimer(tokens.expiry_date);

      console.log(chalkInfo(getTimeStamp() + " | GOOGLE OAUTH2 AUTHORIZED: ExpiryDate: " + getTimeStamp(googleAuthExpiryDate)));
      googleOauthEvents.emit('GOOGLE AUTHORIZED', credential);
    }
  });
}

function getInstagramSubs(callback){
  instagramClient.subscriptions(function(err, subscriptions, remaining, limit){
    if (err){
      console.error(chalkError("\nERROR getInstagramSubs\n" + err));
      configEvents.emit("INSTAGRAM_ERROR", err) ;
      callback(err, null);
    }
    else {
      console.log(chalkInstagram("#### INSTAGRAM_SUBSCRIPTIONS\n" + subscriptions + "\nEND INSTAGRAM_SUBSCRIPTIONS\n####\n"));
      configEvents.emit("INSTAGRAM_SUBSCRIPTIONS", subscriptions) ;
      configEvents.emit("INSTAGRAM_RATE_LIMIT", limit) ;
      configEvents.emit("INSTAGRAM_RATE_LIMIT_REMAINING", remaining) ;
      callback(null, subscriptions);
    }
  });
}

function addInstagramSub(searchTerm, callback){

  instagramClient.add_tag_subscription(searchTerm, instagramCallbackUrl, function(err, result, remaining, limit) {

    if (err){
      console.error(chalkError("!!! INSTAGRAM TAG SUBSCRIPTION ERROR " 
        + getTimeStamp() 
        + " SEARCHTERM: " + searchTerm 
        + " [ LIMIT: " + limit + " | REMAINING: " + remaining + " ] "
        + "\nRESULT\n" 
        + JSON.stringify(result, null, 3) 
        + "\nERROR\n" 
        + JSON.stringify(err, null, 3) 
        + "\n"
      ));

      if (err.error_type == 'OAuthRateLimitException') {
        instagramRateLimitException = Date.now() ;
        instagramRateLimitRemaining = 0 ;
        configEvents.emit("INSTAGRAM_RATE_LIMIT_ERROR", err) ;
        instagramError = true ;
        instagramReady = false ;
        callback(err, searchTerm);
      }
      else if (err.error_type == 'APISubscriptionError') {
        instagramClient.add_tag_subscription(searchTerm, instagramCallbackUrl, function(err, result, remaining, limit) {
          if (err){
            console.error(chalkError("!!! ** RETRY ** | INSTAGRAM TAG SUBSCRIPTION ERROR: " + searchTerm));
            instagramError = true ;
            instagramReady = false ;
            configEvents.emit("INSTAGRAM_ERROR", searchTerm) ;
            if (err.error_type !== 'OAuthRateLimitException') {
              err.retry();
            }
            callback(err, searchTerm);
          }
          else {
            console.log(chalkInstagram("** RETRY ** | +++ INSTAGRAM ADD TAG SUBSCRIPTION"));
            configEvents.emit("INSTAGRAM_ERROR", searchTerm) ;
            callback(null, result.object_id);
          }
        });
      }
      else {
        callback(err, searchTerm);
      }
    }
    else {
      instagramRateLimitException = 0;
      instagramRateLimitRemaining = remaining ;

      console.log(chalkInstagram("+++ INSTAGRAM ADD TAG SUBSCRIPTION [ LIMIT: " + limit 
        + " | REMAINING: " + remaining + " ]: " 
        + result.object_id
        ));
      configEvents.emit("INSTAGRAM_TAG_SUB", result.object_id) ;
      configEvents.emit("INSTAGRAM_RATE_LIMIT_REMAINING", remaining) ;

      callback(null, result.object_id);
    }

  });
}

var instagramTagHashMapKeys = [];
var refreshInstagramTagHashMapKeys = true ;

function pollInstagramTags(){
  
  var tagOptions = {
    count: 1,
    min_tag_id: 0
  };

  if (refreshInstagramTagHashMapKeys || (instagramTagHashMapKeys.length == 0)) {
    refreshInstagramTagHashMapKeys = false ;
    instagramTagHashMapKeys = instagramTagHashMap.keys();
    console.log(chalkInstagram("REFRESH IG TAG HM KEYS ... NUMBER IG TAG HM KEYS: " + instagramTagHashMapKeys.length));
  }

  var igTagId = instagramTagHashMapKeys.shift() ;
  var tObj = instagramTagHashMap.get(igTagId);

  // console.log("pollInstagramTags: CURRENT IG TAG: " + igTagId + "\n" + JSON.stringify(tObj, null, 2));

  console.log(chalkInstagram("IG POLL" 
    // + " " + getTimeStamp() 
    + " " + tObj.igTagId 
    + " " + instagramTagHashMap.count() + " Ts"
    + " R " + instagramRateLimitRemaining
    ));

  tagOptions.min_tag_id = tObj.minTagId;

  if (instagramRateLimitRemaining < instagramRateLimitRemainingMin){
    if (instagramRateLimitLowException == 0){
      instagramRateLimitLowException = getTimeNow();
      console.warn("! SETTING INSTAGRAM RATE LIMIT REMAINING LOW EXCEPTION: REMAINING: " 
        + instagramRateLimitRemaining + " | AT: " + getTimeStamp(instagramRateLimitLowException));
    }
    console.warn("! INSTAGRAM RATE LIMIT REMAINING LOW: " + instagramRateLimitRemaining + " ... SKIPPING POLLING ...");
  }
  else {
    instagramClient.tag_media_recent(igTagId, tagOptions, function(err, igMediaArray, pagination, remaining, limit) {
      if (err) {
        console.error(chalkError("[IG] pollInstagramTags !!! ERROR RECENT INSTAGRAM TAG " 
          + getTimeStamp() 
          + " | " + igTagId 
          + " | " + JSON.stringify(tagOptions)
          + " | LIMIT: " + limit 
          + " | REMAINING: " + remaining
          + " | ERROR CODE: " + err.status_code
          + " | ERR: " + err
        ));

        if (err.error_type == 'OAuthRateLimitException') {
          instagramRateLimitException = Date.now() ;
          instagramRateLimitLowException = Date.now() ;
          instagramRateLimitRemaining = 0;
        }
        else if (err.code == 'ECONNRESET') {
          instagramReady = false ;
          configEvents.emit("INSTAGRAM_ERROR", igTagId) ;
        }
        else {
          console.error(chalkError("!!! ** RETRY ** | INSTAGRAM TAG MEDIA RECENT ERROR: " + igTagId));
          err.retry();
        }
      }
      else {
        instagramRateLimitRemaining = remaining;
        instagramRateLimitLowException = 0;
        instagramRateLimitException = 0;

        if (igMediaArray.length > 0) {

          tObj.minTagId = pagination.min_tag_id;

          instagramClient.tag(igTagId, function(err, result, remaining, limit) {
            if (!err){
              tObj.mediaCount = result.media_count ;

              console.log(chalkInstagram("IG T" 
                + " " + igTagId 
                + " " + igMediaArray.length + " RES"
                + " MT " + pagination.min_tag_id
                + " MC " + result.media_count
                + " RM " + remaining
              ));

              instagrams.findOneTag(tObj, null, function(err, igt){
                if (err){
                  console.error("\n!!! ERROR: pollInstagramTags: findOneTag: " + err);
                }
                else{
                  instagramTagHashMap.set(igTagId, igt) ;
                }
              });
            }
            else {
              console.error(chalkError("!!! ** RETRY ** | INSTAGRAM TAG MEDIA RECENT ERROR: " + igTagId));
              if (err.error_type !== 'OAuthRateLimitException') {
                err.retry();
              }
              tObj.mediaCount = 1 ;  // min update to max of this or what's in DB
              instagrams.findOneTag(tObj, null, function(err, igt){
                if (err){
                  console.error("\n!!! ERROR: pollInstagramTags: findOneTag: " + err);
                }
                else {
                  instagramTagHashMap.set(igTagId, igt) ;
                }
              });
            }
          });
        }
        else {
          debugIg("pollInstagramTags -- NO RESULTS"
            + " | LIMIT: " + limit 
            + " | REMAINING: " + remaining
            + " | MIN TAG ID: " + tObj.minTagId
            + " | " + igTagId
          );
        }

        igMediaArray.forEach(function(igMedia){
          debugIg("\n[IG] --- MEDIA ---\n" + JSON.stringify(igMedia, null, 3) + "\n");
          console.log(chalkInstagram("IG M"
            + " " + igMedia.id 
            + " T " + igMedia.type 
            + " U " + igMedia.user.id
            + " " + igMedia.user.username
            // + " " + igMedia.user.full_name
            // + " L " + igMedia.location.name
            // + " " + igMedia.link
            + " R " + remaining
            // + "\nT " + igMedia.tags
            ));
          instagrams.createStreamMedia(
            igMedia, 
            io, 
            searchTermHashMap, 
            possibleSearchTermHashMap, 
            blacklistSearchTermHashMap, 
            configEvents);
          updateInstagramMetric(igMedia);
        });
      }
    });
  }

}

function getLatestInstagram(req) {

  var tagOptions = {
    count: 1,
    min_tag_id: 0
  };

  debugIg("getLatestInstagram: req.object_id: " + req.object_id);

  if (instagramTagHashMap.has(req.object_id.toLowerCase())){
    
    var tagObj = instagramTagHashMap.get(req.object_id.toLowerCase());
    debugIg("getLatestInstagram: tagObj: " + JSON.stringify(tagObj, null, 3));

    instagramClient.tag(tagObj.igTagId, function(err, result, remaining, limit) {
      if (!err){
        tagObj.mediaCount = result.media_count ;
        // console.log("\n#####\nresult\n" + JSON.stringify(result, null, 2));
        console.log(chalkInstagram("IG T " + tagObj.igTagId + " MC " + result.media_count));
        instagrams.findOneTag(tagObj, null, function(err, igt){
          if (err){
            console.error("\n!!! ERROR: pollInstagramTags: findOneTag: " + err);
          }
          else{
            debugIg("getLatestInstagram: instagramTagHashMap set: " + igt.igTagId + " | " + JSON.stringify(igt));
            instagramTagHashMap.set(igt.igTagId, igt) ;
          }
        });
      }
      else{
        console.error(chalkError("!!! ** RETRY ** | INSTAGRAM TAG MEDIA RECENT ERROR: " + tagObj.igTagId));
        if (err.error_type !== 'OAuthRateLimitException') {
          err.retry();
        }
        tagObj.mediaCount = 1 ;  // min update to max of this or what's in DB
        instagrams.findOneTag(tagObj, null, function(err, igt){
          if (err){
            console.error("\n!!! ERROR: pollInstagramTags: findOneTag: " + err);
          }
          else{
            debugIg("getLatestInstagram: instagramTagHashMap set: " + igt.igTagId + " | " + JSON.stringify(igt));
            instagramTagHashMap.set(igt.igTagId, igt) ;
          }
        });
      }
    });

    debugIg("[IG] ... FOUND PREVIOUS INSTAGRAM TAG " + req.object_id + " | MIN ID: " + tagObj.minTagId);

    tagOptions.min_tag_id = tagObj.minTagId;
  }
  else {

    var newTagObj = new IgTag({
      igTagId: req.object_id.toLowerCase(),
      nodeId: req.object_id.toLowerCase(),
      nodeType: 'ig_tag',
      text: req.object_id.toLowerCase(),
      minTagId : 0,
      mediaCount : 1,
      lastSeen : Date.now()
    });

    instagramClient.tag(newTagObj.igTagId, function(err, result, remaining, limit) {
      if (!err){
        newTagObj.mediaCount = result.media_count ;
        // console.log("\n#####\nresult\n" + JSON.stringify(result, null, 2));
        console.log(chalkInstagram("IG T " + newTagObj.igTagId + " MC " + result.mediaCount));
        instagrams.findOneTag(newTagObj, null, function(err, igt){
          if (err){
            console.error("\n!!! ERROR: pollInstagramTags: findOneTag: " + err);
          }
          else{
            debugIg("getLatestInstagram: instagramTagHashMap set: " + igt.igTagId + " | " + JSON.stringify(igt));
            instagramTagHashMap.set(igt.igTagId, igt) ;
          }
        });
      }
      else{
        console.error(chalkError("!!! ** RETRY ** | INSTAGRAM TAG MEDIA RECENT ERROR: " + newTagObj.igTagId));
        if (err.error_type !== 'OAuthRateLimitException') {
          err.retry();
        }
        instagrams.findOneTag(newTagObj, null, function(err, igt){
          if (err){
            console.error("\n!!! ERROR: pollInstagramTags: findOneTag: " + err);
          }
          else{
            debugIg("getLatestInstagram: instagramTagHashMap set: " + igt.igTagId + " | " + JSON.stringify(igt));
            instagramTagHashMap.set(newTagObj.igTagId, igt) ;
          }
        });
      }
    });

    tagOptions.min_tag_id = 0;

    console.log("NEW IG T " + req.object_id + "\nREQ\n" + JSON.stringify(req, null, 2));

    // instagramTagHashMap.set(req.object_id.toLowerCase(), newTagObj);
  }


  instagramClient.tag_media_recent(req.object_id, tagOptions, function(err, igMediaArray, pagination, remaining, limit) {
    if (err) {
      console.error("[IG] getLatestInstagram !!! ERROR RECENT INSTAGRAM TAG " + getTimeStamp() 
        + " | " + req.object_id + " [ LIMIT: " + limit + " | REMAINING: " + remaining + " ]\n" 
        + JSON.stringify(err, null, 3)
      );

      if (err.error_type == 'OAuthRateLimitException') {
        instagramRateLimitException = Date.now() ;
        instagramRateLimitLowException = Date.now() ;
      }
      else if (err.code == 'ECONNRESET') {
        instagramReady = false ;
        configEvents.emit("INSTAGRAM_ERROR", req.object_id) ;
      }
      else {
        console.error(chalkError("!!! ** RETRY ** | INSTAGRAM TAG MEDIA RECENT ERROR: " + req.object_id));
        if (err.error_type !== 'OAuthRateLimitException') {
          err.retry();
        }
      }

    }
    else {
      // debugIg("[IG] RECENT INSTAGRAM TAG " + req.object_id + "\n" + JSON.stringify(igMediaArray, null, 3));

      instagramRateLimitException = 0;
      instagramRateLimitRemaining = remaining ;

      debugIg("[IG] >>> RECENT INSTAGRAM TAG " 
        + req.object_id 
        + " | " + igMediaArray.length + " RESULTS"
        + " | MIN TAG ID: " + pagination.min_tag_id
      );

      if (igMediaArray.length > 0) {
       var newTagObj = new IgTag({
          igTagId: req.object_id.toLowerCase(),
          nodeId: req.object_id.toLowerCase(),
          nodeType: 'ig_tag',
          text: req.object_id.toLowerCase(),
          minTagId : pagination.min_tag_id,
          lastSeen : Date.now()
        });
        instagramTagHashMap.set(req.object_id, newTagObj) ;
      }

      igMediaArray.forEach(function(igMedia){
        debugIg("\n[IG] --- MEDIA ---\n" + JSON.stringify(igMedia, null, 3) + "\n");

        console.log(chalkInstagram("IG M"
              + " " + igMedia.id 
              + " " + igMedia.type 
              + " U " + igMedia.user.id
              + " " + igMedia.user.username
              + " " + igMedia.user.full_name
              + " L " + JSON.stringify(igMedia.location)
              + " " + igMedia.link
              + " R " + remaining
              // + "\n    TAG " + igMedia.tags
              ));

// exports.createStreamMedia = function(newIgMedia, io, searchTermHashMap, possibleSearchTermHashMap, searchTermBlacklistHashMap, configEvents) {  
        instagrams.createStreamMedia(
          igMedia, 
          io, 
          searchTermHashMap, 
          possibleSearchTermHashMap, 
          blacklistSearchTermHashMap, 
          configEvents);
        updateInstagramMetric(igMedia);
      });
    }
  });
}

function deleteInstragramSubs(callback){
  instagramClient.del_subscription({ all: true }, function(err, subscriptions, remaining, limit){
    if (err){
      console.error(chalkError(getTimeStamp() + " *** ERROR instagramClient.del_subscription\n" + err));
      instagramSubsInitialized = false ;
      if (err.error_type == 'OAuthRateLimitException') {
        instagramRateLimitException = Date.now() ;
        instagramRateLimitRemaining = 0 ;
      }
      callback(err);
      // return ;
    }
    else {
      console.log(chalkInfo(getTimeStamp() + " DELETED ALL INSTAGRAM SUBS | LIMIT: " + limit + " | REMAINING: " + remaining));
      callback(remaining);
    }
  });
}

function initInstagramRealtimeSubs(callback){
  instagramClient.del_subscription({ all: true }, function(err, subscriptions, remaining, limit){
    if (err){
      console.error(chalkError(getTimeStamp() + " *** ERROR instagramClient.del_subscription\n" + err));
      instagramSubsInitialized = false ;
      if (err.error_type == 'OAuthRateLimitException') {
        instagramRateLimitException = Date.now() ;
        instagramRateLimitRemaining = 0 ;
      }
      callback(err);
      // return ;
    }
    else {
      console.log(chalkInfo(getTimeStamp() + " | DELETED ALL INSTAGRAM SUBS | LIMIT: " + limit + " | REMAINING: " + remaining));
      instagramRateLimitRemaining = remaining ;
      instagramSubsInitialized = false ;

      console.log(chalkInfo(getTimeStamp() 
        + " | ADDING " +  defaultSearchTermArray.length + " DEFAULT SEARCH TERM ENTRIES TO INSTAGRAM SUBS" ));
      for (var igIndex=0; igIndex < defaultSearchTermArray.length; igIndex++){

        // INITIALIZE INSTAGRAM TAG HASHMAP WITH SEARCHTERMS

        var tagObj = new IgTag({
          igTagId: defaultSearchTermArray[igIndex].toLowerCase(),
          nodeId: defaultSearchTermArray[igIndex].toLowerCase(),
          nodeType: 'ig_tag',
          text: defaultSearchTermArray[igIndex].toLowerCase(),
          minTagId : 0,
          lastSeen : Date.now()
        });

        instagrams.findOneTag(tagObj, null, function(err, igTag){
          if (err){
            console.error(chalkError("!!! INSTAGRAM findOneTag ERROR: " + err));
            callback(err);
          }
          else {
            console.log(chalkInfo("--> ADD INSTAGRAM TAG TO HASHMAP: " + igTag.igTagId 
              + " | MIN TID: " + igTag.minTagId));
            instagramTagHashMap.set(igTag.igTagId, igTag);
          }
        });

        // ADD INSTAGRAM REAL-TIME SUBSCRIPTIONS, EVEN THO IT SEEMS IT DOESN'T WORK CONSISTENTLY. USE POLLING, TOO.
        if (!instagramSubsInitialized 
          && (instagramRateLimitException == 0) 
          && (instagramRateLimitLowException == 0) 
          && (igIndex < MAX_INSTAGRAM_SUBS)) {

          addInstagramSub(defaultSearchTermArray[igIndex], function(err, searchTerm){
            if (err){
              console.error(chalkError(getTimeStamp() + " *** ERROR addInstagramSub\n" + err));
              configEvents.emit("INSTAGRAM_SUBSCRIPTION_ERROR", err) ;
              instagramSubsInitialized = false ;
              callback(err);
            }
            else {
              console.log(chalkInfo("+++ ADDED INSTAGRAM SEARCHTERM SUBSCRIPTION : " + searchTerm));
            }
          });
        }
        else {
          console.log(chalkInfo("--- SKIPPED INSTAGRAM SEARCHTERM SUBSCRIPTION [" + igIndex + "]: " 
            + defaultSearchTermArray[igIndex] 
            + " | instagramRateLimitException: " + instagramRateLimitException 
            + " | instagramRateLimitLowException: " + instagramRateLimitLowException
            ));
        }
      }
    }
  });
  callback();
}

function getTotalTweets(callback){
  Tweet.count({}, function(err, count) {
    if (!err){ 
      debug("TOTAL TWEETS: " + count);
      callback(null, count);
    } 
    else {
      console.error(chalkError("\n*** getTotalTweets: DB Tweet.count ERROR *** | " + getTimeStamp() + "\n" + err));
      callback(err, null);
    }
  });
}

function getTotalInstagrams(callback){
  IgMedia.count({}, function(err, count) {
    if (!err){ 
      debug("TOTAL INSTAGRAM MEDIA: " + count);
      callback(null, count);
    } 
    else {
      console.error(chalkError("\n*** getTotalInstagrams: DB IgMedia.count ERROR *** | " + getTimeStamp() + "\n" + err));
      callback(err, null);
    }
  });
}

function initializeConfiguration() {

  console.log(chalkInfo(getTimeStamp() + " | initializeConfiguration ..."));
  if (autoInstagramStreamEnable) {
    console.log(chalkInfo(getTimeStamp() + " | ENABLING INSTAGRAM STREAM ..."));
    enableInstagramStream = true ;
  }
  else {
    console.warn(chalkAlert(getTimeStamp() + " | ??? AUTO ENABLING INSTAGRAM STREAM OFF ???: autoInstagramStreamEnable: " 
      + autoInstagramStreamEnable 
    ));
  }

  loadTwitterYamlConfig(twitterYamlConfigFile, function(twitterConfig){
      console.log(chalkInfo(getTimeStamp() + ' | TWITTER CONFIG YAML FILE ' + twitterYamlConfigFile));
  });

  async.series([

    // DATABASE INIT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | START DATABASE INIT"));

      async.parallel(
        [

          // CLIENT IP INIT
          function(callbackParallel) {
            console.log(chalkInfo(getTimeStamp() + " | CLIENT IP INIT"));
            clientFindAllDb(null, function(numberOfClientIps){
              console.log(chalkInfo(getTimeStamp() + " | CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps));
              callbackParallel();
            });
          },

          // ADMIN IP INIT
          function(callbackParallel) {
            console.log(chalkInfo(getTimeStamp() + " | ADMIN IP INIT"));
            adminFindAllDb(null, function(numberOfAdminIps){
              console.log(chalkInfo(getTimeStamp() + " | ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps));
              callbackParallel();
            });
          },

          // TWEET COUNT INIT
          function(callbackParallel) {
            console.log(chalkInfo(getTimeStamp() + " | TWEET COUNT INIT"));
            getTotalTweets(function(err, count){
              if (!err){ 
                numberTweetsReceived = count ;
                console.log(chalkInfo(getTimeStamp() + " | TOTAL TWEETS: " + numberTweetsReceived));
                callbackParallel(err);
              } 
              else {
                console.error(chalkError("\n*** getTotalTweets ERROR *** | " + getTimeStamp() + "\n" + err));
                callbackParallel();
              }
            });
          },

          // INSTAGRAM MEDIA COUNT INIT
          function(callbackParallel) {
            console.log(chalkInfo(getTimeStamp() + " | INSTAGRAM MEDIA COUNT INIT"));
            getTotalInstagrams(function(err, count) {
              if (!err){ 
                numberIgMediaReceived = count ;
                console.log(chalkInfo(getTimeStamp() + " | TOTAL INSTAGRAM MEDIA: " + numberIgMediaReceived));
                configEvents.emit('HASHMAP_INIT_COMPLETE.IG_MEDIA', count);
                callbackParallel(err);
              } 
              else {
                console.error(chalkError("\n*** getTotalInstagrams ERROR *** | " + getTimeStamp() + "\n" + err));
                callbackParallel();
              }
            });
          }

        ],

        function(err){
          if (err) {
            console.error(chalkError("\n" + getTimeStamp() + "!!! DATABASE INIT ERROR: " + err));
            callbackSeries(err);
            // return;
          }
          else {
            console.log(chalkInfo(getTimeStamp() + " | DATABASE INIT COMPLETE"));
            configEvents.emit('DATABASE_INIT_COMPLETE', numberTweetsReceived);
            callbackSeries();
          }
        }
      );
    },

    // DROPBOX INIT
    function(callbackSeries) {
      console.log(chalkInfo(getTimeStamp() + " | DROPBOX INIT"));
      dropboxClient.getAccountInfo(function(err, accountInfo) {

        if (err) {
          console.error(chalkError("!!! DROPBOX ACCOUNT INFO ERROR: " + err));
          // configEvents.emit('DROPBOX_INIT_COMPLETE', err);
          callbackSeries(err);
          // return; //It's important to return so that the task callback isn't called twice
        }
        else {

          async.series([
              // function(callbackDropbox) {

              //   // TWEET TIME TABLE
              //   //
              //   // There are 24 * 365 = 8760 max table entries per year; or 24*366=8784 for leap years.

              //   // Files are named TWEET_TIME_TABLE_YYYY, where YYYY is the year, i.e., TWEET_TIME_TABLE_2014

              //   // The table file is a list of timestamps (on hour boundaries) and tweet id's, one per line, 
              //   // that correspond to the smallest tweet id received within the hour.

              //   console.log("DROPBOX_DEFAULT_TWEET_TIME_TABLE_DIR: " + DROPBOX_DEFAULT_TWEET_TIME_TABLE_DIR);  // JSON
              //   dropboxClient.readdir("/", function(error, entries) {
              //     if (error) {
              //       console.error(chalkError("!!! DROPBOX READ DROPBOX_DEFAULT_TWEET_TIME_TABLE_DIR ERROR: " + error));
              //       callbackDropbox(err);
              //       return; //It's important to return so that the task callback isn't called twice
              //     }
              //     console.log(chalkAlert("\nDROPBOX DEFAULT TWEET TIME TABLE DIR: " + DROPBOX_DEFAULT_TWEET_TIME_TABLE_DIR));
              //     console.log("tweetTimeTableDirJson\n" + entries.join(", "));
              //     // var tweetTimeTableDirObj = JSON.parse(tweetTimeTableDirJson);
              //     // console.log("tweetTimeTableDirJson\n" + JSON.stringify(tweetTimeTableDirObj, null, 3));
              //     callbackDropbox();
              //   });
              // },

              function(callbackDropbox) {
                debug("DROPBOX_DEFAULT_MAP_FILE: " + DROPBOX_DEFAULT_MAP_FILE);  // JSON
                dropboxClient.readFile(DROPBOX_DEFAULT_MAP_FILE, function(error, locationsJson) {
                  if (error) {
                    console.error(chalkError("!!! DROPBOX READ DEFAULT MAP FILE ERROR: " + error));
                    callbackDropbox(err);
                    return; //It's important to return so that the task callback isn't called twice
                  }
                  console.log(chalkInfo(getTimeStamp() + " | ADDING DEFAULT MAP LOCATIONS FROM DROPBOX FILE: " 
                    + DROPBOX_DEFAULT_MAP_FILE));
                  var locationsObj = JSON.parse(locationsJson);
                  debug("locationsJson\n" + JSON.stringify(locationsObj, null, 3));
                  console.log(chalkInfo(getTimeStamp() + " | FOUND " + locationsObj.locations.length 
                    + " MAP LOCATIONS IN DROPBOX FILE: " + DROPBOX_DEFAULT_MAP_FILE));
                  locationsObj.locations.forEach(function(loc){
                    debug("loc\n" + JSON.stringify(loc, null, 3));
                  })
                  callbackDropbox();
                });
              },

              function(callbackDropbox) {
                debug("DROPBOX_DEFAULT_SEARCH_TERMS_FILE: " + DROPBOX_DEFAULT_SEARCH_TERMS_FILE);
                dropboxClient.readFile(DROPBOX_DEFAULT_SEARCH_TERMS_FILE, function(error, data) {
                  if (error) {
                    console.error(chalkError("!!! DROPBOX READ DEFAULT SEARCH TERM FILE ERROR: " + error));
                    callbackDropbox(err);
                    return; //It's important to return so that the task callback isn't called twice
                  }
                  console.log(chalkInfo(getTimeStamp() + " | ADDING DEFAULT SEARCH TERMS FROM DROPBOX FILE: " + DROPBOX_DEFAULT_SEARCH_TERMS_FILE));
                  var dataNoSpaces = data.toString().replace(/ /g, "");
                  var dataArray = dataNoSpaces.toString().split("\n");
                  dataArray.forEach(function(searchTerm){
                    if (!searchTermHashMap.has(searchTerm) && !S(searchTerm).startsWith('#')&& !S(searchTerm).isEmpty()){
                      defaultSearchTermArray.push(searchTerm);
                      searchTermArray.push(searchTerm);
                      searchTermHashMap.set(searchTerm, 1);
                      debug("+def+ ADDED DEFAULT SEARCH TERM [DROPBOX]: " + searchTerm);
                    }
                  });
                  callbackDropbox();
                });
              },

              function(callbackDropbox) {
                dropboxClient.readFile(DROPBOX_NEW_SEARCH_TERMS_FILE, function(error, data) {
                  if (error) {
                    console.error(chalkError("!!! DROPBOX READ NEW SEARCH TERM FILE ERROR: " + error));
                    callbackDropbox(err);
                    // return; //It's important to return so that the task callback isn't called twice
                  }
                  console.log(chalkInfo(getTimeStamp() + " | ADDING NEW SEARCH TERMS FROM DROPBOX FILE: " + DROPBOX_NEW_SEARCH_TERMS_FILE));
                  var dataNoSpaces = data.toString().replace(/ /g, "");
                  var dataArray = dataNoSpaces.toString().split("\n");
                  dataArray.forEach(function(searchTerm){
                    if (!searchTermHashMap.has(searchTerm) && !S(searchTerm).startsWith('#')&& !S(searchTerm).isEmpty()){
                      newSearchTermHashMap.set(searchTerm, 1);
                      searchTermArray.push(searchTerm);
                      searchTermHashMap.set(searchTerm, 1);
                      debug("+new+ ADDED NEW SEARCH TERM [DROPBOX]: " + searchTerm);
                    }
                  });
                  callbackDropbox();
                });
              },

              function(callbackDropbox) {
                dropboxClient.readFile(DROPBOX_SEARCH_TERMS_FILE, function(error, data) {
                  if (error) {
                    console.error(chalkError("!!! DROPBOX READ SEARCH TERM FILE ERROR: " + error));
                    callbackDropbox(err);
                    // return; //It's important to return so that the task callback isn't called twice
                  }
                  console.log(chalkInfo(getTimeStamp() + " | ADDING SEARCH TERMS FROM DROPBOX FILE: " + DROPBOX_SEARCH_TERMS_FILE));
                  var dataNoSpaces = data.toString().replace(/ /g, "");
                  var dataArray = dataNoSpaces.toString().split("\n");
                  dataArray.forEach(function(searchTerm){
                    if (!searchTermHashMap.has(searchTerm) && !S(searchTerm).startsWith('#')&& !S(searchTerm).isEmpty()){
                      // defaultSearchTermArray.push(searchTerm);
                      searchTermArray.push(searchTerm);
                      searchTermHashMap.set(searchTerm, 1);
                      debug("+++ ADDED SEARCH TERM [DROPBOX]: " + searchTerm);
                    }
                  });
                  callbackDropbox();
                });
              },

              function(callbackDropbox) {
                dropboxClient.readFile(DROPBOX_POSSIBLE_SEARCH_TERMS_FILE, function(error, data) {
                  if (error) {
                    console.error(chalkError("!!! DROPBOX READ POSSILBE FILE ERROR: " + error));
                    callbackDropbox(error);
                    // return; 
                  }
                  console.log(chalkInfo(getTimeStamp() + " | ADDING POSSIBLE SEARCH TERMS FROM DROPBOX FILE: " 
                    + DROPBOX_POSSIBLE_SEARCH_TERMS_FILE));
                  var dataNoSpaces = data.toString().replace(/ /g, "");
                  var dataArray = dataNoSpaces.toString().split("\n");
                  dataArray.forEach(function(possibeSearchTerm){
                    if (!possibleSearchTermHashMap.has(possibeSearchTerm) 
                      && !S(possibeSearchTerm).startsWith('#') 
                      && !S(possibeSearchTerm).isEmpty()){
                      possibleSearchTermArray.push(possibeSearchTerm);
                      possibleSearchTermHashMap.set(possibeSearchTerm, 1);
                      debug("+++ ADDED POSSIBLE SEARCH TERM [DROPBOX]: " + possibeSearchTerm);
                    }
                  });
                  callbackDropbox();
                });
              },

              function(callbackDropbox) {
                dropboxClient.readFile(DROPBOX_BLACKLIST_SEARCH_TERMS_FILE, function(error, data) {
                  if (error) {
                    console.error(chalkError("!!! DROPBOX READ BLACK LIST FILE ERROR: " + error));
                    callbackDropbox(error);
                    // return; 
                  }
                  console.log(chalkInfo(getTimeStamp() + " | ADDING BLACK LIST SEARCH TERMS FROM DROPBOX FILE: " 
                    + DROPBOX_BLACKLIST_SEARCH_TERMS_FILE));
                  var dataNoSpaces = data.toString().replace(/ /g, "");
                  var dataArray = dataNoSpaces.toString().split("\n");
                  dataArray.forEach(function(blacklistSearchTerm){
                    if (!blacklistSearchTermHashMap.has(blacklistSearchTerm) 
                      && !S(blacklistSearchTerm).startsWith('#')
                      && !S(blacklistSearchTerm).isEmpty()){
                      blacklistSearchTermArray.push(blacklistSearchTerm);
                      blacklistSearchTermHashMap.set(blacklistSearchTerm, 1);
                      debug("+++ ADDED BLACK LIST SEARCH TERM [DROPBOX]: " + blacklistSearchTerm);
                    }
                  });
                  callbackDropbox();
               });
              }

          ], function(error) {
              if (error) {
                console.error(chalkError("!!! DROPBOX INIT ERROR: " + error));
                // configEvents.emit('DROPBOX_INIT_COMPLETE', error);
                callbackSeries(err);
                // return;
              }
              else {
                sessionConfig = { 
                  searchTermArray : searchTermArray, 
                  possibleSearchTermArray : possibleSearchTermArray, 
                  blacklistSearchTermArray : blacklistSearchTermArray, 
                  testMode: testMode
                };
                console.log(chalkInfo(getTimeStamp() + " | DROPBOX INIT COMPLETE: ACCOUNT: " + accountInfo.name));
                configEvents.emit('DROPBOX_INIT_COMPLETE', null);
                callbackSeries();
              }
          });    
        }
      });
    },

    // GOOGLE INIT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | GOOGLE INIT"));
      findCredential(GOOGLE_SERVICE_ACCOUNT_CLIENT_ID, function(){
        callbackSeries();
      });
    },

    // APP ROUTING INIT
    function(callbackSeries){
      debug(chalkInfo(getTimeStamp() + " | APP ROUTING INIT"));
      initAppRouting();
      callbackSeries();
    },

    // SOCKET INIT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | SOCKET INIT"));
      callbackSeries();
    },

    // CONFIG EVENT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | INIT CONFIG COMPLETE"));
      sessionConfig = { 
        searchTermArray : defaultSearchTermArray, 
        // testMode: false
        testMode: testMode
      };
      debug("SESSION CONFIGURATION\n" + JSON.stringify(sessionConfig, null, 3) + "\n");
      // configEvents.emit("INIT_CONFIG_COMPLETE", sessionConfig);
      callbackSeries();
    },

    // TWITTER TRACK INIT
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | TWITTER TRACKING INIT | TWITTER MAX TRACKING NUMBER: " + twitterMaxTrackingNumber));
      twit.get('account/settings', function(err, data, response) {
        if (err){
          console.error('!!!!! TWITTER ACCOUNT ERROR |  TWITTER TRACKING INIT | ' 
            + getTimeStamp() + '\n' + JSON.stringify(err, null, 3));
          // twitterStatus.error = err;
          // callbackSeries(err);
          callbackSeries(err);
          // return;
        }
        else {
          // console.log('\n-------------------------------------\nTWITTER ACCOUNT SETTINGS\n' + JSON.stringify(data, null, 3));
          twitterStatus.settings = data;

          twit.get('application/rate_limit_status', function(err, data, response) {
            if (err){
              console.error('!!!!! TWITTER TRACKING INIT ACCOUNT ERROR | ' + getTimeStamp() + '\n' + JSON.stringify(err, null, 3));
              console.error('!!!!! TWITTER TRACKING INIT ACCOUNT ERROR | TWITTER ACCOUNT SETTINGS\n' + JSON.stringify(data, null, 3));
              twitterStatus.error = err;
              callbackSeries(err);
              // return;
            }
            else {
              console.log(chalkInfo(getTimeStamp() + " | ADDING TWITTER TRACKING FROM searchTermArray ..."));

              searchTermArray.forEach(function(searchTerm){
                twitterTrack(searchTerm, "track");
              });
              callbackSeries();
            }
          });

        }
      });
    },

    // TWITTER RATE LIMIT STATUS
    function(callbackSeries){
      console.log(chalkInfo("\n" + getTimeStamp() + " | TWITTER RATE LIMIT STATS"));

      twit.get('application/rate_limit_status', function(err, data, response) {
        if (err){
          console.error('!!!!! TWITTER ACCOUNT ERROR | ' + getTimeStamp() + '\n' + JSON.stringify(err, null, 3));
          twitterStatus.error = err;
          callbackSeries(err);
          // return;
        }
        else {
          debug(chalkTwitter('\n-------------------------------------\nTWITTER RATE LIMIT STATUS\n' + JSON.stringify(data, null, 3)));
          var remainingTime = msToTime(1000*data.resources.application["/application/rate_limit_status"].reset - Date.now()) ;
          console.log(chalkInfo(getTimeStamp() 
            + " | TWITTER ACCOUNT RATE: LIMIT: " + data.resources.application["/application/rate_limit_status"].limit
            + " | REMAINING: " + data.resources.application["/application/rate_limit_status"].remaining
            + " | RESET AT: " + getTimeStamp(1000*data.resources.application["/application/rate_limit_status"].reset)
            + " | IN " + remainingTime
          ));
          callbackSeries();
        }
      });
    },

    // INSTAGRAM INIT
    function(callbackSeries){
      if (enableInstagramStream){
        console.log(chalkInfo("\n" + getTimeStamp() + " | INSTAGRAM INIT"));

        initInstagramRealtimeSubs(function(err){
          if (err){
            console.error(chalkError("\n" + getTimeStamp() + " *** INSTAGRAM INIT REALTIME SUBSCRIPTIONS ERROR\n" + err + "\n"));
            instagramReady = false ;
          }
          else {
            console.log(chalkInfo("\n" + getTimeStamp() + " | INSTAGRAM INIT REALTIME SUBSCRIPTIONS COMPLETE"));
            getInstagramSubs(function(err, subscriptions){
              if (err){
                console.error(chalkError("\n" + getTimeStamp() + " *** INSTAGRAM GET REALTIME SUBSCRIPTIONS ERROR\n" + err + "\n"));
              }
              else {
                console.log(chalkInfo("--------------------\nINSTAGRAM REALTIME SUBSCRIPTIONS\n" 
                  + subscriptions + "\nEND INSTAGRAM REALTIME SUBSCRIPTIONS\n-------\n"));
              }
            });
            instagramReady = true ;
          }
        });

        if (defaultSearchTermArray.length > MAX_INSTAGRAM_SUBS) {
          console.warn(chalkInstagram("WARNING: NUMBER OF SEARCH TERMS (" + defaultSearchTermArray.length + ")"
            + " GREATER THAN INSTAGRAM MAX SUBSCRIPTIONS: " + MAX_INSTAGRAM_SUBS 
            + " ... WILL SKIP SOME"));
        }

        instagramTagHashMapInitComplete = true ;

        var pollInstagramTimer = setInterval(function () {

          if ((instagramRateLimitException > 0) || (instagramRateLimitRemaining < instagramRateLimitRemainingMin)){

            if (instagramRateLimitException > 0){
              console.warn(chalkInstagram("*** INSTAGRAM RATE LIMIT EXCEPTION OCCURED AT " 
                + getTimeStamp(instagramRateLimitException) 
                + " | " + msToTime(getTimeNow() - instagramRateLimitException) + " AGO"
                + " | RETRY IN " + msToTime(instagramRateLimitException + instagramRateLimitExceptionTimeout - getTimeNow())
                + " AT " + getTimeStamp(instagramRateLimitException + instagramRateLimitExceptionTimeout)
              ));
            }
            else if (instagramRateLimitLowException > 0){
              console.warn(chalkInstagram("... INSTAGRAM RATE LIMIT LOW (" + instagramRateLimitRemaining + ")"
                + " EXCEPTION OCCURED AT " + getTimeStamp(instagramRateLimitLowException) 
                + " | " + msToTime(getTimeNow() - instagramRateLimitLowException) + " AGO"
                + " | RETRY IN " + msToTime(instagramRateLimitLowException + instagramRateLimitLowExceptionTimeout - getTimeNow())
                + " AT " + getTimeStamp(instagramRateLimitLowException + instagramRateLimitLowExceptionTimeout)
              ));
            }
            else if ((instagramRateLimitException == 0) 
              && (instagramRateLimitLowException == 0) 
              && (instagramRateLimitRemaining < instagramRateLimitRemainingMin)){
              instagramRateLimitLowException = getTimeNow();
              console.warn(chalkInstagram("*** INSTAGRAM RATE LIMIT REMAINING LOW EXCEPTION: " + instagramRateLimitRemaining 
                + " AT " + getTimeStamp() 
                + " | RETRY IN " + msToTime(instagramRateLimitLowException + instagramRateLimitLowExceptionTimeout - getTimeNow())
                + " AT " + getTimeStamp(instagramRateLimitLowException + instagramRateLimitLowExceptionTimeout)
                + "\n"
              ));
            }

            if ((instagramRateLimitException > 0) 
              && ((getTimeNow() - instagramRateLimitException) > instagramRateLimitExceptionTimeout)) {

              console.log(chalkInstagram("=== RESETING INSTAGRAM RATE LIMIT EXCEPTION" 
                + " | OCCURED AT " + getTimeStamp(instagramRateLimitException) 
                + " | " + msToTime(getTimeNow() - instagramRateLimitException) + " AGO"
              ));

              instagramRateLimitException = 0;
              instagramRateLimitRemaining = instagramRateLimitRemainingMin ;

              if (!instagramReady){
                console.log(chalkInstagram("INITIALIZING INSTAGRAM SEARCH TERMS"));
                initInstagramRealtimeSubs(function(err){
                  if (err){
                    console.error(chalkError(" *** INSTAGRAM INIT REALTIME SUBSCRIPTIONS INIT ERROR " + getTimeStamp() + " | ERROR: " + err));
                    instagramReady = false ;
                  }
                  else {
                    console.log(chalkInfo("\n" + getTimeStamp() + " | INSTAGRAM INIT REALTIME SUBSCRIPTIONS COMPLETE"));
                    instagramReady = true ;
                  }
                });
              }
              else if (enablePollInstagramTags) {
                pollInstagramTags();
              }
            }

            else if ((instagramRateLimitException == 0) 
              && (instagramRateLimitLowException > 0) 
              && ((getTimeNow() - instagramRateLimitLowException) > instagramRateLimitLowExceptionTimeout)
              ) {

              console.log(chalkInstagram("=== RESETING INSTAGRAM RATE LIMIT LOW EXCEPTION TO " +  instagramRateLimitRemainingMin
                + " | OCCURED AT " + getTimeStamp(instagramRateLimitLowException) 
                + " | " + msToTime(getTimeNow() - instagramRateLimitLowException) + " AGO"
              ));

              instagramRateLimitLowException = 0;
              instagramRateLimitRemaining = instagramRateLimitRemainingMin ;

              if (enablePollInstagramTags) {
                pollInstagramTags();
              }
            }
          }
          else if (instagramReady) {
            pollInstagramTags();
          }
        }, instagramPollingInterval);
      }
      else { // delete instagram subscriptions if not enabled
        instagramClient.del_subscription({ all: true }, function(err, subscriptions, remaining, limit){
          if (err){
            console.error(chalkError(getTimeStamp() + " *** ERROR instagramClient.del_subscription\n" + err));
            configEvents.emit("INSTAGRAM_SUBSCRIPTION_ERROR", err) ;
            if (err.error_type == 'OAuthRateLimitException') {
              instagramRateLimitException = Date.now() ;
              instagramRateLimitRemaining = 0 ;
              configEvents.emit("INSTAGRAM_RATE_LIMIT_ERROR", err) ;
            }
          }
          else {
            console.log(chalkInfo(getTimeStamp() 
              + " | DELETED ALL INSTAGRAM SUBSCRIPTIONS | LIMIT: " + limit + " | REMAINING: " + remaining));
          }
        });
      }
      callbackSeries();
    },

    // SERVER READY
    function(callbackSeries){
      console.log(chalkInfo(getTimeStamp() + " | SEND SERVER_READY"));
      configEvents.emit("SERVER_READY");
      callbackSeries();
    }
  ]);
}


// ==================================================================
// SEARCH ARRAYS and HASHMAPS
// ==================================================================
var searchTermArray = [] ;
var defaultSearchTermArray = [] ;
var blacklistSearchTermArray = [] ;
var possibleSearchTermArray = [] ;

var searchTermHashMap = new HashMap();
var newSearchTermHashMap = new HashMap();
var blacklistSearchTermHashMap = new HashMap();
var possibleSearchTermHashMap = new HashMap();


// ==================================================================
// TWITTER CONFIG
// ==================================================================
var twitterStatus = {};
var enableTweetStream = false;
var sendTestTweetsFlag = false; 

var Twit = require('twit');
var TwitterStreamChannels = require('node-tweet-stream');


function loadTwitterYamlConfig(yamlFile, callback){
  debug(chalkInfo("LOADING TWITTER YAML CONFIG FILE: " + yamlFile));
  var tcfg = yaml.load(yamlFile);
  callback(tcfg);
}


var twitterStreamChannelsClient ;
var twit ;

var tweets = require('./app/controllers/tweets.server.controller');

// ==================================================================
// INSTAGRAM CONFIG
// ==================================================================
var enableInstagramStream = false ;
var instagramReady = false ;
var instagramError = false ;
var instagramSubsInitialized = false ;
var instagramSubscriptions = [];
var MAX_INSTAGRAM_SUBS = 30;
var instagramTagHashMap = new HashMap();
var instagramRateLimitException = 0;  // = Date.now() on exceptoin
var instagramRateLimitExceptionTimeout = 15 * ONE_MINUTE ; // 15 minutes
var instagramRateLimitRemainingMin = 50 ;
var instagramRateLimitRemaining = instagramRateLimitRemainingMin;  // ATTEMPT AT LEAST ONE
var instagramRateLimitLowException = 0;
var instagramRateLimitLowExceptionTimeout = 5 * ONE_MINUTE ; // 5 minute
var instagramPollingInterval = 5 * ONE_SECOND ; //

var hashtagHashMapInitComplete = false ;
var placeHashMapInitComplete = false ;
var mediaHashMapInitComplete = false ;
var instagramTagHashMapInitComplete = false ;


var instagramCallbackUrl = CALLBACK_HOSTNAME + '/instagram' ;
console.log("INSTAGRAM CALLBACK URL: " + instagramCallbackUrl);

var instagramClient = require('instagram-node').instagram();
var instagrams = require('./app/controllers/instagram.server.controller');

instagramClient.use({ 
  client_id: process.env.INSTAGRAM_CLIENT_ID_1, 
  client_secret: process.env.INSTAGRAM_CLIENT_SECRET_1
});


// ==================================================================
// FACEBOOK CONFIG
// ==================================================================
var facebookEnable = process.env.FACEBOOK_ENABLE || false ;
console.log(chalkFacebook("FACEBOOK ENABLE: " + facebookEnable));

var Facebook = require('facebook-node-sdk');
var facebookClient ;
var facebookReady = false ;
var facebookError = false ;

var facebookCallbackUrl = CALLBACK_HOSTNAME + '/facebook' ;
var facebookAccessToken = process.env.FACEBOOK_APP_ACCESS_TOKEN ;

function facebookInit(){
  debug(chalkFacebook("FACEBOOK INIT")); 
  console.log(chalkFacebook("FACEBOOK CALLBACK URL: " + facebookCallbackUrl));
  facebookClient = new Facebook({ 
    appid: process.env.FACEBOOK_APP_ID, 
    secret: process.env.FACEBOOK_APP_SECRET
  }).setAccessToken(facebookAccessToken);

  facebookClient.getAccessToken(function(err, accessToken) {
    if (err){
      console.error(chalkError("FACEBOOK getAccessToken: " + err)); // => { id: ... }
      facebookError = true ;
    }
    debug(chalkFacebook("FACEBOOK getAccessToken: " + accessToken)); // => { id: ... }
  });

  facebookClient.api('/me', { access_token: facebookAccessToken}, function(err, data) {
    if (err){
      facebookError = true ;
      console.error(chalkError("FACEBOOK threecee: " + JSON.stringify(err, null, 2))); // => { id: ... }
    }
    else {
      facebookReady = true ;
      console.log(chalkFacebook(getTimeStamp() 
        + " | FACEBOOK AUTHORIZED: ID: " + data.id 
        + " | NAME: " + data.first_name + " " + data.last_name));
      debug(chalkFacebook("FACEBOOK threecee: " + JSON.stringify(data, null, 2))); // => { id: ... }
    }
  });
}

if (facebookEnable){
  facebookInit();
}

// ==================================================================
// GOOGLE INIT
// ==================================================================
var googleapis = require('googleapis');

var GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID ;
var GOOGLE_SERVICE_ACCOUNT_CLIENT_ID = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID;
var GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
var GOOGLE_SERVICE_ACCOUNT_KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
var GOOGLE_MONITORING_SCOPE = process.env.GOOGLE_MONITORING_SCOPE;

var disableGoogleMetrics = false;
if (process.env.GOOGLE_METRICS_DISABLE > 0) disableGoogleMetrics = true ;
console.log("GOOGLE_METRICS_DISABLE: " + disableGoogleMetrics);

var googleAuthorized = false ;
var googleAuthCode = 0;
var googleAuthExpiryDate = new Date() ;
var googleMetricsEnabled = false ;

var googleMonitoring ;
var googleOauthClient = new googleapis.auth.JWT(
                              GOOGLE_SERVICE_ACCOUNT_EMAIL, 
                              GOOGLE_SERVICE_ACCOUNT_KEY_FILE, 
                              null, 
                              [GOOGLE_MONITORING_SCOPE]
                              );

// ==================================================================
// CHECK FOR INTERNET CONNECTION AND SOCKET IO
// ==================================================================

console.log("... CHECKING INTERNET CONNECTION ...");
dns.resolve('www.google.com', function(err, addresses) {
  if (err){
    console.error("\n????? INTERNET DOWN ????? | " + getTimeStamp());
  } 
  else{
    internetReady = true ;
    console.log(chalkInfo(getTimeStamp() + " | INTERNET CONNECTION OK"));
    debug('DNS IP RESOLVE www.google.com: ' + JSON.stringify(addresses));

    dns.reverse(addresses[0], function(err, domains){
      debug('DNS REVERSE IP: ' + addresses[0] + ' | DOMAINS: ' + JSON.stringify(domains, null, 3));
    });
  }
});

// ==================================================================
// ADMIN
// ==================================================================

var adminIpHashMap = new HashMap();
var adminSocketIdHashMap = new HashMap();

var numberAdminsTotal = 0;
var numberAdminsConnected = 0;

var clientIpHashMap = new HashMap();
var clientSocketIdHashMap = new HashMap();

var numberClientsConnected = 0;
var numberTestClients = 0;


var dnsHostHashMap = new HashMap();
var localHostHashMap = new HashMap();
localHostHashMap.set('::ffff:127.0.0.1', 1);
localHostHashMap.set('127.0.0.1', 1);
localHostHashMap.set('::1', 1);
localHostHashMap.set('::1', 1);

localHostHashMap.set('macpro.local', 1);
localHostHashMap.set('macpro2.local', 1);
localHostHashMap.set('mbp.local', 1);
localHostHashMap.set('mbp2.local', 1);
localHostHashMap.set('macminiserver0.local', 1);
localHostHashMap.set('macminiserver1.local', 1);
localHostHashMap.set('macminiserver2.local', 1);
localHostHashMap.set('mms0.local', 1);
localHostHashMap.set('mms1.local', 1);
localHostHashMap.set('mms2.local', 1);

localHostHashMap.set('::ffff:10.0.1.4', 1);
localHostHashMap.set('::ffff:10.0.1.10', 1);
localHostHashMap.set('::ffff:10.0.1.27', 1);
localHostHashMap.set('::ffff:10.0.1.45', 1);
localHostHashMap.set('10.0.1.4', 1);
localHostHashMap.set('10.0.1.10', 1);
localHostHashMap.set('10.0.1.27', 1);

// ==================================================================
// METRICS
// ==================================================================

var googleCheckSocketUpInterval = ONE_MINUTE;

var numberTweetsReceived = 0 ;
var deltaTweetsReceived = 0 ;  // cleared 1/min

var numberRetweetsReceived = 0 ;
var deltaRetweetsReceived = 0 ;

var numberIgMediaReceived = 0;
var deltaIgMediaReceived = 0;

var Queue = require('queue-fifo');

var twitterStreamQ = new Queue();
var socketQueue = new Queue();
var tweetRate1minQ = new Queue();
var igRate1minQ = new Queue();
var htRate1minQ = new Queue();

var twRateQhead ;
var igRateQhead ;
var htRateQhead ;


configEvents.on('newListener', function(data){
  console.log("*** NEW CONFIG EVENT LISTENER: " + data);
})


// ==================================================================
// INIT TWITTER STREAMING CLIENT
// ==================================================================
configEvents.on('DROPBOX_INIT_COMPLETE', function(error){
  if (error){
    console.error(chalkError("!!! DROPBOX INIT ERROR !!!\n" + error));
  }
  else {
    console.log(chalkInfo(getTimeStamp() + " | DROPBOX_INIT_COMPLETE ... INITIALIZING TWITTER ..."))

    loadTwitterYamlConfig(twitterYamlConfigFile, function(twitterConfig){

      console.log(chalkInfo(getTimeStamp() + ' | TWITTER CONFIG USING YAML CONFIG FILE:' + twitterYamlConfigFile));

      twitterStreamChannelsClient = new TwitterStreamChannels({
        consumer_key: twitterConfig.CONSUMER_KEY,
        consumer_secret: twitterConfig.CONSUMER_SECRET,
        token: twitterConfig.TOKEN,
        token_secret: twitterConfig.TOKEN_SECRET
      });

      twitterStreamChannelsClient.on("connect", function(data){
        console.log(chalkTwitter(getTimeStamp() + " | TWITTER CONNECT"));
      });

      twitterStreamChannelsClient.on("reconnect", function(data){
        console.warn(chalkTwitter(getTimeStamp() + " | !!! TWITTER RECONNECT: " + JSON.stringify(data, null, 2)));
        console.warn(chalkTwitter("CLEARING TWEET RATE QUEUE"));
        tweetRate1minQ.clear();
      });

      twitterStreamChannelsClient.on("disconnect", function(data){
        console.err(chalkTwitter(getTimeStamp() + " | !!! TWITTER DISCONNECT: " + JSON.stringify(data, null, 2)));
        console.warn(chalkTwitter("CLEARING TWEET RATE QUEUE"));
        tweetRate1minQ.clear();
      });

      twitterStreamChannelsClient.on("warning", function(data){
        console.warn(chalkTwitter(getTimeStamp() + " | !!! TWITTER WARNING: " + JSON.stringify(data, null, 2)));
      });

      twitterStreamChannelsClient.on("limit", function(data){
        console.warn(chalkTwitter(getTimeStamp() + " | TWITTER LIMIT: " + JSON.stringify(data, null, 2)));
      });

      twitterStreamChannelsClient.on("delete", function(data){
        console.log(chalkTwitter(getTimeStamp() + " | TWITTER DELETE: " + JSON.stringify(data, null, 2)));
      });

      twitterStreamChannelsClient.on("error", function(err){
        console.error(chalkTwitter(getTimeStamp() + " | *** TWITTER ERROR: " + err));
        console.warn(chalkTwitter("CLEARING TWEET RATE QUEUE"));
        tweetRate1minQ.clear();
      });

      twit = new Twit({
        consumer_key: twitterConfig.CONSUMER_KEY,
        consumer_secret: twitterConfig.CONSUMER_SECRET,
        access_token: twitterConfig.TOKEN,
        access_token_secret: twitterConfig.TOKEN_SECRET
      });

      twit.get('account/settings', function(err, data, response) {
        if (err){
          console.error('!!!!! TWITTER ACCOUNT ERROR | ' + getTimeStamp() + '\n' + JSON.stringify(err, null, 3));
          // return;
        }
        else {
          console.log(chalkInfo(getTimeStamp() + " | TWITTER ACCOUNT: " + data.screen_name))
          debug(chalkTwitter('\n-------------------------------------\nTWITTER ACCOUNT SETTINGS\n' 
            + JSON.stringify(data, null, 3)));

          twit.get('application/rate_limit_status', function(err, data, response) {
            if (err){
              console.error('!!!!! TWITTER ACCOUNT ERROR | ' + getTimeStamp() + '\n' + JSON.stringify(err, null, 3));
              // return;
            }
            else {
              // console.log('\n-------------------------------------\nTWITTER RATE LIMIT STATUS\n' + JSON.stringify(data, null, 3));
            }
          });
        }
      });
    });
  }
});

// ==================================================================
// CONNECT TO INTERNET, ENABLE TWITTER STREAMING CLIENT
// START SERVER HEARTBEAT
// ==================================================================
configEvents.on("SERVER_READY", function () {

  serverReady = true ;

  tweets.placeHashMapInit(function(err, numberPlaces){
    if (!err) console.log(chalkInfo(getTimeStamp() + " | PLACE HASHMAP INIT | " + numberPlaces + " TWITTER PLACES"));
  });

  instagrams.placeHashMapInit(function(err, numberPlaces){
    if (!err) console.log(chalkInfo(getTimeStamp() + " | IG PLACE HASHMAP INIT | " + numberPlaces + " IG PLACES"));
  });

  console.log(chalkInfo(getTimeStamp() + " | SERVER_READY EVENT"));

  http.on("reconnect", function(){
    internetReady = true ;
    console.log(chalkConnect(getTimeStamp() + ' | PORT RECONNECT: ' + config.port));
    initializeConfiguration();
    // authorizeGoogle();
  });

  http.on("connect", function(){
    internetReady = true ;
    console.log(chalkConnect(getTimeStamp() + ' | PORT CONNECT: ' + config.port));

    http.on("disconnect", function(){
      internetReady = false ;
      console.error(chalkError('\n***** PORT DISCONNECTED | ' + getTimeStamp() + ' | ' + config.port));
    });
  });

  http.listen(config.port, function(){
    console.log(chalkInfo(getTimeStamp() + " | LISTENING ON PORT " + config.port));
  });

  http.on("error", function (err) {
    internetReady = false ;
    console.error(chalkError('??? HTTP ERROR | ' + getTimeStamp() + '\n' + err));
    if (err.code == 'EADDRINUSE') {
      console.error(chalkError('??? HTTP ADDRESS IN USE: ' + config.port + ' ... RETRYING...'));
      setTimeout(function () {
        http.listen(config.port, function(){
          console.log('LISTENING ON PORT ' + config.port);
        });
      }, 5000);
    }
  });


  if (autoTweetStreamEnable) {
    console.log(chalkInfo(getTimeStamp() + " | ENABLING TWEET STREAM ..."));
    enableTweetStream = true ;
  }
  else {
    console.warn(chalkWarn("??? AUTO ENABLING TWEET STREAM OFF ???: autoTweetStreamEnable: " 
      + autoTweetStreamEnable 
    ));
  }


  //----------------------
  //  SERVER HEARTBEAT
  //----------------------

  var txHeartbeat = { };

  var maxNumberClientsConnected = 0;
  var maxNumberClientsConnectedTime = currentTime;

  var maxTweetsPerMin = 0;
  var maxTweetsPerMinTime = currentTime;

  var maxTweetsPerMin24hour = 0;
  var localMaxTweetsPerMin24hour = 0;
  // var maxTweetsPerMin24hourTime = currentTime;
  var localMaxTweetsPerMin24hourTime = moment.utc();
  var maxTweetsPerMin24hourTime = moment.utc();
  var maxTweetsPerMin24hourTimePlusOffset = moment.utc(maxTweetsPerMin24hourTime);
  maxTweetsPerMin24hourTimePlusOffset.add(1, 'days');

  var maxIgMediaPerMin = 0;
  var maxIgMediaPerMinTime = currentTime;

  var tempDateTime = new Date();

  var tpmSampleArray = []; // the last N tpm values, probably 60 1-sec values, used to calc average tpm
  var tpmAccumulator = 0 ;
  var tpmAverage = 0 ;
  var TPM_SAMPLE_SIZE = 60 ;

  var serverHeartbeatInterval = setInterval(function () {

    numberAdminsConnected = io.of('/admin').sockets.length;
    numberClientsConnected = io.of('/').sockets.length - io.of('/admin').sockets.length;

    if (numberClientsConnected > maxNumberClientsConnected) {
      maxNumberClientsConnected = numberClientsConnected;
      maxNumberClientsConnectedTime = currentTime;
      console.log(chalkAlert(getTimeStamp() + " | NEW MAX CLIENTS CONNECTED: " + maxNumberClientsConnected));
    }

    // caluclate tpm rate average  BRUTE FORCE ??? KLUDGE
    tpmSampleArray.push(tweetRate1minQ.size());

    if (tpmSampleArray.length > TPM_SAMPLE_SIZE) tpmSampleArray.shift();

    var tpmAccumulator = 0 ;
    tpmSampleArray.forEach(function(sample){
      tpmAccumulator += sample ;      
    });

    if (tpmSampleArray.length > 0){
      tpmAverage = tpmAccumulator/tpmSampleArray.length * (TPM_SAMPLE_SIZE/tpmSampleArray.length) ;
      tpmAverage = Math.round( tpmAverage * 10 ) / 10;
    }
    else {
      tpmAverage = 0;
    }

    if (tpmAverage > maxTweetsPerMin) {
      maxTweetsPerMin = tpmAverage;
      maxTweetsPerMinTime = moment.utc();
      debug(chalkAlert(getTimeStamp() + " | NEW MAX TPM        : " + maxTweetsPerMin));
    }

    if ((tpmAverage > maxTweetsPerMin24hour) || (maxTweetsPerMin24hourTimePlusOffset.isBefore(moment()))) {

      maxTweetsPerMin24hour = tpmAverage;
      maxTweetsPerMin24hourTime = moment.utc();

      maxTweetsPerMin24hourTimePlusOffset = moment.utc();
      maxTweetsPerMin24hourTimePlusOffset.add(1, 'days');

      debug(chalkAlert(getTimeStamp() + " | NEW MAX 24-HOUR TPM: " + maxTweetsPerMin24hour));
    }

    if ((maxTweetsPerMin24hourTimePlusOffset.isAfter(moment()))) {
      if (tpmAverage > localMaxTweetsPerMin24hour) {
        localMaxTweetsPerMin24hour = tpmAverage;
        localMaxTweetsPerMin24hourTime = moment.utc();
        debug(chalkAlert(getTimeStamp() + " | LCL MAX 24-HOUR TPM: " + localMaxTweetsPerMin24hour));
      }
    }
    else {
      localMaxTweetsPerMin24hour = tpmAverage;
      localMaxTweetsPerMin24hourTime = moment.utc();
      debug(chalkAlert(getTimeStamp() + " | RST LCL MAX 24-HOUR TPM: " + localMaxTweetsPerMin24hour));
    }


    if (igRate1minQ.size() > maxIgMediaPerMin) {
      maxIgMediaPerMin = igRate1minQ.size();
      maxIgMediaPerMinTime = currentTime;
      debug(chalkAlert(getTimeStamp() + " | NEW MAX IGPM: " + maxIgMediaPerMin));
    }

    numberTestClients = 0;

    clientSocketIdHashMap.forEach(function(clientObj, ip) {
      if (clientObj.referer == 'TEST') {
        numberTestClients++;
      }
    });

    runTime =  getTimeNow() - startTime ;
    

    //
    // SERVER HEARTBEAT
    //

    if (internetReady){

      txHeartbeat = { 
        serverHostName : os.hostname(), 
        timeStamp : getTimeNow(), 
        startTime : startTime, 
        upTime : os.uptime() * 1000, 
        runTime : runTime, 
        authExpiryDate : googleAuthExpiryDate,

        tweetsReceived : numberTweetsReceived, 
        tweetsPerMin : tpmAverage,
        tweetsPerMinAve : tpmAverage,
        maxTweetsPerMin : maxTweetsPerMin,
        maxTweetsPerMinTime : maxTweetsPerMinTime,
        maxTweetsPerMin24hour : maxTweetsPerMin24hour,
        maxTweetsPerMin24hourTime : maxTweetsPerMin24hourTime,

        igMediaReceived : numberIgMediaReceived, 
        igMediaPerMin : igRate1minQ.size(),
        maxIgMediaPerMin : maxIgMediaPerMin,
        maxIgMediaPerMinTime : maxIgMediaPerMinTime,

        numberAdmins : numberAdminsConnected,

        numberClients : numberClientsConnected,
        maxNumberClients : maxNumberClientsConnected,
        maxNumberClientsTime : maxNumberClientsConnectedTime,

        htPerMin: htOneMinWindowHistogram,

        numberTestClients : numberTestClients
      } ;

      io.emit('HEARTBEAT', txHeartbeat);
      io.of('/admin').emit('HEARTBEAT', txHeartbeat);
      io.of('/test').emit('HEARTBEAT', txHeartbeat);
    }
    else {
      tempDateTime = new Date() ;
      if (tempDateTime.getSeconds()%10 == 0){
        console.error(chalkError("!!!! INTERNET DOWN?? !!!!! " + getTimeStamp()));
      }
    }
  }, 1000 );


  //----------------------
  //  TWITTER STREAM QUEUE HANDLER
  //----------------------

  var twitterStreamQueueInterval = setInterval(function () {
    if (twitterStreamQ.isEmpty()){
    }
    // else if (!searchByDateTimeEnableFlag) {
    else if (!sendTestTweetsFlag) {

      var tweetStatus =  twitterStreamQ.dequeue();
      tweetStatus.testMode = false ;
      debug(chalkTwitter("[" + twitterStreamQ.size() + "] twitterStreamQ dequeue: " + tweetStatus.id_str));
      tweets.createStreamTweet(
        tweetStatus, 
        io, 
        searchTermHashMap, 
        possibleSearchTermHashMap, 
        blacklistSearchTermHashMap, 
        configEvents);
    }
  }, 100);

  //----------------------
  //  GOOGLE METRICS UPDATE
  //----------------------
  var googleMetricsInterval = setInterval(function () {
    if (disableGoogleMetrics || !googleMetricsEnabled) {
      debug(chalkError("GOOGLE METRICS DISABLED: " + getTimeStamp() 
        + " | disableGoogleMetrics: " + disableGoogleMetrics 
        + " | googleMetricsEnabled: " + googleMetricsEnabled));
    }
    else if (!disableGoogleMetrics && googleAuthorized && googleMetricsEnabled) { 
      updateMetrics(
        numberClientsConnected, 
        numberTweetsReceived, 
        numberRetweetsReceived, 
        tpmAverage, 
        numberIgMediaReceived, 
        igRate1minQ.size()
      );
    }
    else if (!disableGoogleMetrics && googleAuthorized && !googleMetricsEnabled) {
      console.error(chalkError("GOOGLE METRICS DISABLED??? " 
        + getTimeStamp() 
        + " \n... FIND GOOGLE CREDENTIAL | CLIENT ID: " + GOOGLE_SERVICE_ACCOUNT_CLIENT_ID));
      findCredential(GOOGLE_SERVICE_ACCOUNT_CLIENT_ID, function(cred){
        console.error(chalkError("findCredential: GOOGLE METRICS DISABLED " + getTimeStamp() + " CRED: " + cred));
      });
    }
  }, updateMetricsInterval);


  //----------------------
  //  TEST TWEETS
  //----------------------

  var randomIntFromInterval = function (min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  }

  setInterval(function () {
    if (searchByDateTimeEnableFlag) { 

      searchByDateTimeEnableFlag = false ;
      // searchByDateTimeContinueFlag = true ;

      console.log(">>> SEARCH FOR TWEET BY DATE: " + sessionConfig.searchDateTime 
        + " | " + getTimeStamp(sessionConfig.searchDateTime));

      tweets.tweetByTimeStamp(sessionConfig.searchDateTime, function(reqTweets){
        if (reqTweets){

          lastTestTweetId = reqTweets[reqTweets.length-1].tweetId ;

          console.log("@@@ FOUND " + reqTweets.length + " TWEETs BY DATE" 
            + " | REQ DATE: " + sessionConfig.searchDateTime 
            + " | " + getTimeStamp(sessionConfig.searchDateTime)
            + " | lastTestTweetId: " + lastTestTweetId
            // + " | " + reqTweet.tweetId 
            // + " | " + getTimeStamp(reqTweet.createdAt) 
            // + " | " + reqTweet.text
            );


          tweets.sendTweet(lastTestTweetId, testEvents); 
          // testDateTime = reqTweet.createdAt + 1000;
        }

      }); 
    }
    else if (sendTestTweetsFlag || searchByDateTimeContinueFlag){
      tweets.sendTweet(lastTestTweetId, testEvents); 
    }
  }, sendTestTweetInterval );

  var tweetStreamMode = 'REALTIME';

  //----------------------
  //  MAIN TWEET STREAM HANDLER (FEEDS TWEET STREAM QUEUE)
  //----------------------
  if (enableTweetStream){

    console.log(chalkInfo(getTimeStamp() + " | TWEET STREAM ENABLED ..."));

    twitterStreamChannelsClient.on("error", function(err){
      console.error(chalkTwitter(getTimeStamp() + " | *** TWITTER ERROR: " + err));
    });

    twitterStreamChannelsClient.on("tweet", function(tweetStatus){

      twitterStreamQ.enqueue(tweetStatus);

      if (typeof tweetStatus.retweeted_status !== 'undefined') {
        numberRetweetsReceived++ ;
        deltaRetweetsReceived++ ;
      }
      numberTweetsReceived++ ;
      deltaTweetsReceived++ ;

      tweetStatus.tweetsReceived = numberTweetsReceived ;

      // if (googleMetricsEnabled) updateTweetsMetric(tweetStatus) ;
      updateTweetsMetric(tweetStatus) ;

      console.log(chalkInfo('TW ' + numberTweetsReceived 
        // + ' ' + maxTweetsPerMin + ' MAX TPM' 
        // + ' @ ' + getTimeStamp(maxTweetsPerMinTime) 
        // + ' | ' + maxTweetsPerMin24hour + ' MAX 24H TPM' 
        // + ' @ ' + getTimeStamp(maxTweetsPerMin24hourTime) 
        + ' ' + tweetStatus.id_str 
        + ' ' + getTimeStamp()
        + ' ' + tpmAverage + ' TPM' 
      ));

      debug(chalkTwitter('>>> RX TW ' 
        + numberTweetsReceived 
        + ' | ' + tpmAverage + ' TPM | ' 
        + tweetStatus.id_str 
        + ' | ' + getTimeStamp() 
        + '\n    ' + tweetStatus.text.replace(/(\r\n|\n|\r)/gm," ")));


      // debug(JSON.stringify(tweetStatus, null, 3));

      io.of("/admin").emit("TWEET", JSON.stringify(tweetStatus));
    });
  }

  configEvents.emit("CONFIG_CHANGE", sessionConfig );
});


// ==================================================================
// CONFIGURATION CHANGE HANDLER
// ==================================================================
configEvents.on("CONFIG_CHANGE", function (sessionConfig) {

  console.log(chalkAlert(getTimeStamp() + " | CONFIG_CHANGE EVENT"));
  debug("==> CONFIG_CHANGE EVENT: " + JSON.stringify(sessionConfig, null, 3));

  if (typeof sessionConfig.testMode !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: testMode: " + sessionConfig.testMode));
    io.of("/admin").emit('CONFIG_CHANGE',  {testMode: sessionConfig.testMode});
    io.emit('CONFIG_CHANGE',  {testMode: sessionConfig.testMode});
    sendTestTweetsFlag = sessionConfig.testMode;
  }

  if (typeof sessionConfig.testSendInterval !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: testMode: " + sessionConfig.testSendInterval));
    io.of("/admin").emit('CONFIG_CHANGE',  {testSendInterval: sessionConfig.testSendInterval});
    io.emit('CONFIG_CHANGE',  {testSendInterval: sessionConfig.testSendInterval});
    testSendInterval = sessionConfig.testSendInterval;
  }

  if (typeof sessionConfig.searchByDateTimeEnable !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: searchByDateTimeEnable: " + sessionConfig.searchByDateTimeEnable));
    io.of("/admin").emit('CONFIG_CHANGE',  {searchByDateTimeEnable: sessionConfig.searchByDateTimeEnable});
    io.emit('CONFIG_CHANGE',  {searchByDateTimeEnable: sessionConfig.searchByDateTimeEnable});
    searchByDateTimeEnableFlag = sessionConfig.searchByDateTimeEnable;
  }

  if (typeof sessionConfig.searchByDateTimeContinueEnable !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: searchByDateTimeContinueEnable: " 
      + sessionConfig.searchByDateTimeContinueEnable));
    io.of("/admin").emit('CONFIG_CHANGE',  {searchByDateTimeContinueEnable: sessionConfig.searchByDateTimeContinueEnable});
    io.emit('CONFIG_CHANGE',  {searchByDateTimeContinueEnable: sessionConfig.searchByDateTimeContinueEnable});
    searchByDateTimeContinueFlag = sessionConfig.searchByDateTimeContinueEnable;
  }

  if (typeof sessionConfig.searchDateTime !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE: searchDateTime: " + sessionConfig.searchDateTime));
    io.of("/admin").emit('CONFIG_CHANGE',  {searchDateTime: sessionConfig.searchDateTime});
    io.emit('CONFIG_CHANGE',  {searchDateTime: sessionConfig.searchDateTime});
  }

  if (typeof sessionConfig.searchTermArray !== 'undefined') {
    console.log(chalkAlert("   ---> CONFIG_CHANGE"));

    async.series([
      function(callback){
        if (sessionConfig.searchTermArray == 'CLEAR') {
          console.log(chalkAlert("   ---> CLEARING SEARCH TERM ARRAY"));
          searchTermHashMap.forEach(function(value, key) {
            twitterTrack(key, "untrack");
            console.log("... UNTRACKED " + key);
            searchTermHashMap.set(key, false);
          });
          searchTermHashMap.clear();
          sessionConfig.searchTermArray = [];
        } 
        else if (sessionConfig.searchTermArray == 'DEFAULT') {
          console.log(chalkAlert("   ---> SETTING SEARCH TERM ARRAY TO DEFAULT:\n" 
            + JSON.stringify(defaultSearchTermArray, null, 3)));
          searchTermHashMap.forEach(function(value, key) {
            twitterTrack(key, "untrack");
            console.log("... UNTRACKED " + key);
            searchTermHashMap.set(key, false);
          });
          searchTermHashMap.clear();
          sessionConfig.searchTermArray = defaultSearchTermArray ;
        }
        else {
          for (var i = sessionConfig.searchTermArray.length -1; i >= 0; i--){

            if (sessionConfig.searchTermArray[i].charAt(0) == '-') {
              console.log(chalkAlert('--- REMOVING SEARCH TERM FROM HASH: "' + sessionConfig.searchTermArray[i] + '"'));
              sessionConfig.searchTermArray[i] = sessionConfig.searchTermArray[i].substr(1);
              if (searchTermHashMap.has(sessionConfig.searchTermArray[i])) {   
                searchTermHashMap.set(sessionConfig.searchTermArray[i], false);
                console.log(chalkAlert('--- REMOVED SEARCH TERM FROM HASH: "' + sessionConfig.searchTermArray[i] + '"'));
                twitterTrack(sessionConfig.searchTermArray[i], "untrack");
                sessionConfig.searchTermArray.splice(i, 1);
              }       
            } else if (!searchTermHashMap.has(sessionConfig.searchTermArray[i])) {
              searchTermHashMap.set(sessionConfig.searchTermArray[i], true);
              console.log(chalkAlert('... ADDED SEARCH TERM TO HASH: "' + sessionConfig.searchTermArray[i] + '"'));
              twitterTrack(sessionConfig.searchTermArray[i], "track");
            }
            else if (searchTermHashMap.has(sessionConfig.searchTermArray[i]) 
              && !searchTermHashMap.get(sessionConfig.searchTermArray[i])) {
              console.log(chalkAlert('+-- ENABLE PREVIOUS SEARCH TERM: "' + sessionConfig.searchTermArray[i]));
              searchTermHashMap.set(sessionConfig.searchTermArray[i], true);
              twitterTrack(sessionConfig.searchTermArray[i], "track");
            }
            else if (searchTermHashMap.has(sessionConfig.searchTermArray[i])) {
              debug(chalkAlert('... ALREADY TRACKING SEARCH TERM: "' + sessionConfig.searchTermArray[i] + '" ... SKIPPING ...'));
            }
          }
        }
        callback();
      },

      function(callback){
        dropboxWriteArrayToFile(DROPBOX_SEARCH_TERMS_FILE, searchTermHashMap.keys().sort(), function(err, stat){
          if (err){
            console.error(chalkError(getTimeStamp() 
              + " | *** DROPBOX WRITE ERROR: " + DROPBOX_SEARCH_TERMS_FILE + "\n" + err + "\n"));
          }
          else {
            console.log(chalkInfo(">>> SAVED " 
              + searchTermHashMap.keys().length 
              + " SEARCH TERMS TO DROPBOX FILE: " + DROPBOX_SEARCH_TERMS_FILE));
            debug(JSON.stringify(stat, null, 2));
          }
        });
      }
    ]);

    io.of("/admin").emit('CONFIG_CHANGE', {searchTermArray: sessionConfig.searchTermArray});
    io.emit('CONFIG_CHANGE', {searchTermArray: sessionConfig.searchTermArray});
  }

  console.log(chalkInfo(getTimeStamp() + ' | >>> SENT CONFIG_CHANGE'));
});

configEvents.on('MATTER_HASHTAG', function(matterHashtag){
  debug("\n--- MATTER HASHTAG: " + matterHashtag);
});

// POSSIBLE_SEARCH_TERM EVENT
configEvents.on('POSSIBLE_SEARCH_TERM', function(rxStObj){

  var searchTermObj = JSON.parse(rxStObj);

  console.log(chalkAlert("??? POSSIBLE NEW SEARCH TERM: " + searchTermObj.hashtag));

  possibleSearchTermHashMap.set(searchTermObj.hashtag, 1);
  possibleSearchTermArray.push(searchTermObj.hashtag);

  dropboxWriteArrayToFile(DROPBOX_POSSIBLE_SEARCH_TERMS_FILE, possibleSearchTermArray, function(err, stat){
    if (err){
      console.error(chalkError("*** DROPBOX WRITE ERROR: " + DROPBOX_POSSIBLE_SEARCH_TERMS_FILE + "\n" + err + "\n"));
    }
    else {
      console.log(chalkInfo("... DROPBOX WRITE POSSIBLE HASHTAG FILE: " + DROPBOX_POSSIBLE_SEARCH_TERMS_FILE));
      debug(JSON.stringify(stat, null, 2));
    }
  });

  var searchTermAddedFlag = false ;

  if (autoSearchTermEnable 
     && (S(searchTermObj.hashtag).endsWith('livematter') 
      || S(searchTermObj.hashtag).endsWith('livesmatter')
      || S(searchTermObj.hashtag).endsWith('lifematter')
      || S(searchTermObj.hashtag).endsWith('lifesmatter')

      || S(searchTermObj.hashtag).endsWith('livematters')
      || S(searchTermObj.hashtag).endsWith('livesmatters')
      || S(searchTermObj.hashtag).endsWith('lifematters')
      || S(searchTermObj.hashtag).endsWith('lifesmatters')

      || S(searchTermObj.hashtag).endsWith('livemattered')
      || S(searchTermObj.hashtag).endsWith('livesmattered')
      || S(searchTermObj.hashtag).endsWith('lifemattered')
      || S(searchTermObj.hashtag).endsWith('lifesmattered'))
      ){
    console.log(chalkAlert(getTimeStamp() + " | ADDING POSSIBLE NEW SEARCH TERM TO SEARCH TERM ARRAY: " 
      + searchTermObj.hashtag));
    var config = {};
    newSearchTermHashMap.set(searchTermObj.hashtag, true);
    config.searchTermArray = [searchTermObj.hashtag];
    configEvents.emit('CONFIG_CHANGE', config);
    searchTermAddedFlag = true ;
  }

  console.log(chalkAlert(getTimeStamp() + " | SENDING DM TO POSSIBLE NEW SEARCH TERM: " 
    + searchTermObj.hashtag + " TO @threecee ..."));

  var dmString = '';

  if (searchTermAddedFlag) {
    dmString = 'ADDED HT\n' + searchTermObj.hashtag + '\n' + searchTermObj.source + '\n' + searchTermObj.url;
    dropboxWriteArrayToFile(DROPBOX_NEW_SEARCH_TERMS_FILE, newSearchTermHashMap.keys(), function(err, stat){
      if (err){
        console.error(chalkError("*** DROPBOX WRITE NEW SEARCH TERMS FILE ERROR: " 
          + DROPBOX_NEW_SEARCH_TERMS_FILE + "\n" + err + "\n"));
      }
      else {
        console.log(chalkInfo(">>> SAVED " 
          + newSearchTermHashMap.keys().length 
          + " NEW SEARCH TERMS TO DROPBOX FILE: " + DROPBOX_NEW_SEARCH_TERMS_FILE));
        debug(JSON.stringify(stat, null, 2));
      }
    });
  }
  else {
    dmString = 'FOUND HT\n' + searchTermObj.hashtag + '\n' + searchTermObj.source + '\n' + searchTermObj.url;
  }


  sendDirectMessage('threecee', dmString, function(err, res){
    if (!err) {
      debug("SENT TWITTER DM: " + JSON.stringify(searchTermObj, null, 2));
    }
    else {
      console.error(chalkError("DM SEND ERROR:" + err));
    }
  });
});


// ==================================================================
// GOOGLE OAUTH AUTHORIZATION
// ==================================================================

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
    console.log(chalkInfo(getTimeStamp() + " | GOOGLE OAUTH2 CREDENTIAL EXPIRES IN: " + remainingTime 
      + " AT " + getTimeStamp(credential.expiryDate) + " ... AUTHORIZING ANYWAY ..."));
    googleOauthEvents.emit('AUTHORIZE GOOGLE');
  }
  else {
    console.log(chalkAlert(getTimeStamp() + " | !!! GOOGLE OAUTH2 CREDENTIAL EXPIRED AT " + getTimeStamp(credential.expiryDate) 
      + " | " + msToTime(currentTime - credential.expiryDate) + " AGO ... AUTHORIZING ..."));
    googleOauthEvents.emit('AUTHORIZE GOOGLE');
  }
});

googleOauthEvents.on("GOOGLE CREDENTIAL NOT FOUND", function (credentialId) {
  console.log(chalkAlert(getTimeStamp() + " | GOOGLE CREDENTIAL NOT FOUND: " + credentialId));
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
  console.log(chalkGoogle("GOOGLE SOCKET HUNG UP ... CLEARING TWEET RATE QUEUE " + getTimeStamp()));
  tweetRate1minQ.clear();
  console.log(chalkGoogle("RE-TRYING GOOGLE METRICS IN " + msToTime(googleCheckSocketUpInterval)));

  setTimeout(function () {
    // googleMetricsEnabled = true ;
    googleOauthEvents.emit("AUTHORIZE GOOGLE");
    // console.log(chalkGoogle("RE-ENABLING GOOGLE METRICS AFTER SOCKET HUNG UP..."));
  }, googleCheckSocketUpInterval);
});



// ==================================================================
// TEST MODE
// ==================================================================
var testTweetsReceived = 0 ;

testEvents.on("node", function(testTweet){
  testTweetsReceived++ ;
  console.log("testEvents [" + testTweetsReceived + " TEST TWEETS]: " + testTweet.tweetId);
  lastTestTweetId = testTweet.tweetId;
  testTweet.status.testMode = true ;
  testTweet.status.tweetsReceived = testTweetsReceived ;
  tweets.createStreamTweet(
    testTweet.status, 
    io, 
    searchTermHashMap, 
    possibleSearchTermHashMap, 
    blacklistSearchTermHashMap, 
    configEvents); 
  io.of('/admin').emit('TWEET', JSON.stringify(testTweet.status));
});



//=================================
//  SERVER READY
//=================================

io.of("/test").on("connect", function(socket){
  debug("\n\n===================================\nTEST CONNECT\n" 
    + util.inspect(socket.nsp.name, {showHidden: false, depth: 1})
    + "\n========================================\n"
  );
  createClientSocket(socket);
});

io.of("/admin").on("connect", function(socket){

  var adminsHashMap = findClientsSocket('/admin');

  adminsHashMap.forEach(function(value, key) {
    debug("\n\n===================================\nADMIN SOCKET\n" 
      + "KEY: " + key + "\n"
      + util.inspect(value, {showHidden: false, depth: 1})
      + "\n========================================\n"
    );
  });

  debug("\n\n===================================\nADMIN CONNECT\n" 
    + util.inspect(io.of('/admin').sockets, {showHidden: false, depth: 1})
    + "\n========================================\n"
  );

  numberAdminsConnected = io.of('/admin').sockets.length;

  console.log(chalkConnect("ADMIN CONNECTED [" + numberAdminsConnected + "] " 
    + socket.id 
    + " | " + getTimeStamp()
    + " | " + socket.connected
  ));
  
  // debug(chalkConnectAdmin(util.inspect(socket, {showHidden: false, depth: 1})));

  var socketId = socket.id ;
  var adminIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;
  var adminHostname = socket.handshake.headers.host ;
  var adminDomain ;

  var adminObj = {  
          connected: true, 
          connectTime: getTimeNow(), 
          disconnectTime: getTimeNow(), 
          referer: 'ADMIN',
          ip: adminIp, 
          domain: adminDomain,
          socketId: socketId
  } ;

  console.log("SENDING sessionConfig to ADMIN " + socketId + "\n" + JSON.stringify(sessionConfig));
  socket.emit('ADMIN_CONFIG', JSON.stringify(sessionConfig));

  socket.on("REQ ADMIN SESSION", function(options){
    console.log("\n>>> RX REQ ADMIN SESSION\n" 
      + "OPTIONS\n"+ JSON.stringify(options, null, 3)
    );
    switch (options.sessionType) {

      case 'ALL':
        console.log("... FINDING ALL ADMINS + CLIENTS IN DB ...")

        clientFindAllDb(options, function(numberOfClientIps){
          console.log(chalkInfo("CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps));
          clientIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('CLIENT IP', JSON.stringify(value));
          });  

          console.log(chalkInfo("CLIENT SOCKET COUNT: " + clientSocketIdHashMap.count()));

          var numberSessionsTxd = 0;

          clientSocketIdHashMap.forEach(function(value, key) {

            if (typeof value.connected !== 'undefined'){
              if ((value.domain.indexOf("googleusercontent") < 0) || (numberSessionsTxd < MAX_TX_SESSIONS)){
                console.log(">>> TX SESSION: CLIENT " 
                  + value.domain 
                  + " | I: " + value.ip 
                  + " | S: " + value.socketId
                  + " | R: " + value.referer
                  + " | CONNECTED: " + value.connected
                  );
                value.sessions = [] ;
                io.of('/admin').emit('CLIENT SESSION', 
                  JSON.stringify({
                    clientObj: {
                      ip: value.ip,
                      socketId: value.socketId,
                      referer: value.referer,
                      domain: value.domain,
                      connected: value.connected, 
                      connectTime: value.connectTime,
                      disconnectTime: value.disconnectTime
                    }
                  })
                );
                numberSessionsTxd++;
              }
              else {
                console.log("... SKIPPING TX SESSION: TEST CLIENT (googleusercontent)");
              }
            }
            else{
              console.log("... SKIPPING TX SESSION: " + numberSessionsTxd + " TXD | " + MAX_TX_SESSIONS + " MAX");
            }
          });  
        });

        adminFindAllDb(options, function(numberOfAdminIps){
          console.log("ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps);
          adminIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('ADMIN IP', JSON.stringify(value));
          }); 

          console.log("ADMIN SOCKET COUNT: " + adminSocketIdHashMap.count());

          var numberSessionsTxd = 0;
          adminSocketIdHashMap.forEach(function(value, key) {
            if ((numberSessionsTxd < MAX_TX_SESSIONS) && (typeof value.connected !== 'undefined')){
              value.sessions = [] ;
              // io.of('/admin').emit('ADMIN SESSION', JSON.stringify({connected: value.connected, adminObj: value}));
              io.of('/admin').emit('ADMIN SESSION', 
                JSON.stringify({
                  adminObj: {
                    ip: value.ip,
                    socketId: value.socketId,
                    domain: value.domain,
                    connected: value.connected, 
                    connectTime: value.connectTime,
                    disconnectTime: value.disconnectTime
                  }
                })
              );
              numberSessionsTxd++;
            }
            else{
              debug("... SKIPPING TX SESSION: " + numberSessionsTxd + " TXD | " + MAX_TX_SESSIONS + " MAX");
            }
          });  
        });
      break;

      case 'ADMIN':
        console.log("... FINDING ADMINS IN DB ...");
        adminFindAllDb(options, function(numberOfAdminIps){
          console.log("ADMIN UNIQUE IP ADDRESSES: " + numberOfAdminIps);
          adminIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('ADMIN IP',
              JSON.stringify({
                connected: value.connected, 
                adminObj: {
                  domain: value.domain,
                  ip: value.ip
                }
              })
            );
          });  
          adminSocketIdHashMap.forEach(function(value, key) {
            if (typeof value.connected !== 'undefined'){
              value.sessions = [] ;
              io.of('/admin').emit('ADMIN SESSION', 
                JSON.stringify({
                  adminObj: {
                    ip: value.ip,
                    socketId: value.socketId,
                    domain: value.domain,
                    connected: value.connected, 
                    connectTime: value.connectTime,
                    disconnectTime: value.disconnectTime
                  }
                })
              );
            }
          });  
        });
      break;

      case 'CLIENT':
        console.log("... FINDING CLIENTS IN DB ...");
        clientFindAllDb(options, function(numberOfClientIps){
          console.log("CLIENT UNIQUE IP ADDRESSES: " + numberOfClientIps);
          clientIpHashMap.forEach(function(value, key) {
            value.sessions = [] ;
            io.of('/admin').emit('CLIENT IP',
              JSON.stringify({
                connected: value.connected, 
                clientObj: {
                  domain: value.domain,
                  referer: value.referer,
                  ip: value.ip
                }
              })
            );
          });
          clientSocketIdHashMap.forEach(function(value, key) {
            if (typeof value.connected !== 'undefined'){
              value.sessions = [] ;
              io.of('/admin').emit('CLIENT SESSION', 
                JSON.stringify({
                  clientObj: {
                    ip: value.ip,
                    socketId: value.socketId,
                    domain: value.domain,
                    referer: value.referer,
                    connected: value.connected, 
                    connectTime: value.connectTime,
                    disconnectTime: value.disconnectTime
                  }
                })
              );
            }
          });  
        });
      break;

      default:
        // console.error(chalkError("\n\n*** UNKNOWN REQ ADMIN SESSION TYPE: " + options.sessionType));
        console.error(chalkError("\n\n*** UNKNOWN REQ ADMIN SESSION TYPE"));
      break;
    }
  });

  async.waterfall([

      function(callback) {
        debug('async.series: dnsReverseLookup');
        dnsReverseLookup(adminObj.ip, function(err, domains){
          if (err){
            console.error(chalkError("\n\n***** ERROR: dnsReverseLookup: " + adminObj.ip + " ERROR: " + err));
          }
          else {
            debug("DNS REVERSE LOOKUP: " + adminObj.ip + " | DOMAINS: " + domains);
            adminObj.domain = domains[0];
          }
          callback(err, adminObj);
        });
      },

      function(adminObj, callback) {
        adminConnectDb(adminObj, function(err, ad){
          if (err){
            console.error(chalkError("\n\n***** ERROR: adminConnectDb: " + err));
            callback(err, adminObj);
          }
          else {
            debug("--- ADMIN DB UPDATED: "
              + ad.ip
              + " | SOCKET ID: " + ad.socketId 
              + " | " + ad.domain
              + " | CREATED AT: " + getTimeStamp(ad.createdAt)
              + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
              + " | CONNECTIONS: " + ad.numberOfConnections
            );

            // debug(JSON.stringify(ad, null, 3));

            callback(null, ad);
          }
        });
      },

      function(adminObj, callback) {
        // debug("async admin hash stage: " + JSON.stringify(adminObj, null, 3));
        adminIpHashMap.set(adminObj.ip, adminObj);
        adminSocketIdHashMap.set(adminObj.socketId, adminObj);
        callback(null, adminObj);
      }
    ], 
    function(err, adminObj){
      adminObj.connected = true ;
      adminObj.sessions = [] ;
      io.of('/admin').emit('ADMIN SESSION', 
        JSON.stringify({
          adminObj: {
            ip: adminObj.ip,
            socketId: adminObj.socketId,
            domain: adminObj.domain,
            connected: adminObj.connected, 
            connectTime: adminObj.connectTime,
            disconnectTime: currentTime
          }
        })
      );
    }
  );
  
  socket.on("CONFIG", function(msg){
  
    var rxAdminConfig = JSON.parse(msg) ;
    var previousProperty ;
  
    console.log("\n*** RX ADMIN CONFIG ***\n" 
      + "IP: " + adminIp 
      + " | SOCKET: " + socketId 
      + JSON.stringify(rxAdminConfig, null, 3));
  

    console.log("\nPREVIOUS sessionConfig:\n" + JSON.stringify(sessionConfig, null, 3));

    for(var configPropertyName in rxAdminConfig) {
      console.log("configPropertyName: " + configPropertyName + " | " + rxAdminConfig[configPropertyName]);
      previousProperty = sessionConfig[configPropertyName];
      sessionConfig[configPropertyName] = rxAdminConfig[configPropertyName];
      console.log(configPropertyName + " was: " + previousProperty + " | now: " + sessionConfig[configPropertyName]);
    }

    console.log("\nNEW sessionConfig:\n" + JSON.stringify(sessionConfig, null, 3));

    configEvents.emit("CONFIG_CHANGE", sessionConfig);
  });

  
  socket.on("TWEETS_DATE_RANGE", function(startTime, endTime){
    var socketId = socket.id;
    var clientIp = socket.handshake.headers['x-real-ip'] || socket.client.conn.remoteAddress;

    console.log(chalkTest('@@@>>> TWEETS_DATE_RANGE RXCD: socketIp: ' + clientIp 
      + ' | socketId: ' + socketId 
      + ' | START: ' + startTime
      + ' | END: ' + endTime
      ));

    if (tweetTimeTableServerEnabled){
      io.of('/').to(tweetTimeTableSocketId).emit('TWEETS_DATE_RANGE', startTime);
      console.log("--> SEND TO TWEET TIME TABLE SERVER [" + tweetTimeTableSocketId + "] TWEETS_DATE_RANGE | START TIME: " + startTime);
    }
    else {
      console.log("... TWEET TIME TABLE SERVER OFFLINE ... SEARCH BY TIMESTAMP: TWEETS_DATE_RANGE | START TIME: " + startTime);
      tweets.tweetByTimeStamp(startTime, function(tweets){
        console.log(chalkTest('@@@+++ TWEETS_DATE_RANGE | ' + getTimeStamp() + ' | FOUND ' + tweets.length + ' TWEETS IN DATE RANGE: ' + startTime + ' - ' + endTime));

        lastTestTweetId = tweets[0].tweetId ;
        console.log("=== LAST TWEET ID (lastTestTweetId): " + lastTestTweetId); 

        for (var i=0; i<tweets.length; i++){
          debug(chalkTest('TWEETS_DATE_RANGE: SENT TWEET ' + tweets[i].tweetId));
          tweets[i].status.tweetsReceived = numberTweetsReceived ;
          io.of('/admin').to(socketId).emit("TWEETS_DATE_RANGE_RES", JSON.stringify(tweets[i].status));
        }
      });
    }
  });

  socket.on("disconnect", function(){

    numberAdminsConnected = io.of('/admin').sockets.length;

    adminObj.disconnectTime = currentTime;

    adminDisconnectDb(adminObj, function(err, ad){
      if (err){
        console.error(chalkError("\n\n***** ERROR: adminDisconnectDb: " + err));
      }
      else {
        debug("--- ADMIN DB UPDATED: "
          + ad.ip
          + " | SOCKET ID: " + ad.socketId 
          + " | " + ad.domain
          + " | CREATED AT: " + getTimeStamp(ad.createdAt)
          + " | LAST SEEN: " + getTimeStamp(ad.lastSeen)
          + " | CONNECTIONS: " + ad.numberOfConnections
        );

        // debug(JSON.stringify(ad, null, 3));

        adminIpHashMap.set(ad.ip, ad);

        adminSocketIdHashMap.remove(ad.socketId);

        var adminDisconnectedString = '--- ADMIN DISCONNECTED AT ' + getTimeStamp() 
          + ' | ' + ad.ip 
          + ' | socketId: ' + ad.socketId
          + ' | domain: ' + ad.domain
          + ' | ' + numberAdminsTotal + ' ADMINS UNIQUE IP'
          + ' | ' + numberAdminsConnected + ' ADMINS CONNECTED'
           ;

        console.log(adminDisconnectedString);

        adminObj.sessions = [] ;

        io.of('/admin').emit('ADMIN SESSION', 
          JSON.stringify({
            adminObj: {
              ip: ad.ip,
              socketId: ad.socketId,
              domain: ad.domain,
              connected: false, 
              connectTime: ad.connectTime,
              disconnectTime: ad.disconnectTime
            }
          })
        );
      }

    });
  });
});

io.on("disconnect", function(){
  console.log("\n\n**** IO (NGINX?) DISCONNECTED ***\nCLEARING SOCKET HASHMAPS AND QUEUES");

  clientSocketIdHashMap.clear();
  clientIpHashMap.clear();

  adminIpHashMap.clear();
  adminSocketIdHashMap.clear();

  socketQueue.clear();
  tweetRate1minQ.clear();
  igRate1minQ.clear();
});

io.on("connect", function(socket){
  createClientSocket(socket);
});

io.on("reconnecting", function(reconnectAttemptNum){
  console.warn(chalkWarn("... SKT RECONNECTING: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + " | " + reconnectAttemptNum + " RECONNECT ATTEMPTS"
  ));

  // if (debug.enabled) {
  //   dumpIoStats();
  // }
});

io.on("reconnect", function(reconnectAttemptNum){
  console.warn(chalkWarn("+-- SKT RECONNECTED: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + " | " + reconnectAttemptNum + " RECONNECT ATTEMPTS"
  ));
});

io.on("error", function(errorObj){
  console.error(chalkError("\n*** SKT ERROR: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("reconnect_error", function(errorObj){
  console.error(chalkError("\n*** SKT RECONNECT ERROR: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("reconnect_failed", function(errorObj){
  console.error(chalkError("\n*** SKT RECONNECT FAILED: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("connect_error", function(errorObj){
  console.error(chalkError("\n*** SKT CONNECT ERROR: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("connect_timeout", function(errorObj){
  console.error(chalkError("\n*** SKT CONNECT TIMEOUT: " 
    + " | " + getTimeStamp()
    + " | " + sdName
    + JSON.stringify(errorObj, null, 3)
  ));

  if (debug.enabled) {
    dumpIoStats();
  }
});

io.on("node", function(nodeObj){
  debug('NODE: ' + JSON.stringify(nodeObj, null, 3));
});

io.on("STATS_INIT", function(timeStamp){
  var socketId = socket.id
  var clientIp = socket.request.connection.remoteAddress
  console.log('\n@@@>>> STATS_INIT RXCD: socketIp: ' + clientIp + ' | socketId: ' + socketId + ' | ' + timeStamp);
});


//=================================
//  METRICS RATE QUEUE DEQUEUE
//=================================
var rateQinterval = setInterval(function () {

  if (!tweetRate1minQ.isEmpty()) {
    twRateQhead = new Date(tweetRate1minQ.peek());
    if ((twRateQhead.getTime()+60000 < currentTime)){
      // debug("<<< --- tweetRate1minQ deQ: " + twRateQhead.getTime() + " | NOW: " + currentTime);  
      twRateQhead = tweetRate1minQ.dequeue();
      // debug("tweetRate1minQ Q size: " + tweetRate1minQ.size());   
    }
  }

  if (!igRate1minQ.isEmpty()) {
    igRateQhead = new Date(igRate1minQ.peek());
    if (igRateQhead.getTime() < (currentTime - 60000)){
      // debug("<<< ----- igRate1minQ deQ: " + igRateQhead.getTime() + " | NOW: " + currentTime);  
      igRateQhead = igRate1minQ.dequeue();
      // debug("igRate1minQ Q size: " + igRate1minQ.size());   
    }
  }
}, 50);

var updateOneSecondTimeStatInterval = setInterval(function() {

  tweets.updateOneSecondTimeStat(function(err, htObjArray){
    if (htObjArray.length > 0) {
      // debug(chalkAlert("htObjArray [" + htObjArray.length + "]\n" + JSON.stringify(htObjArray, null, 3)));
      for (var i=0; i<htObjArray.length; i++){
        // debug(chalkAlert("htObjArray[" + i + "]._second: " + htObjArray[i]._second 
        //   + " | MIN: " + msToMinutes(htObjArray[i]._second)
        //   + " | DATE: " + getTimeStamp(htObjArray[i]._second)
        // ));
        htRate1minQ.enqueue(htObjArray[i]);

        Object.keys(htObjArray[i]).forEach(function(key) {
          // debug(chalkAlert("  " + key + ": " + htObjArray[i][key]));
          if (typeof htOneMinWindowHistogram[key] !== 'undefined'){
             if (key !== '_second') htOneMinWindowHistogram[key] += htObjArray[i][key] ;
          }
          else {
             if (key !== '_second') htOneMinWindowHistogram[key] = htObjArray[i][key] ;
          }
          // console.log(chalkAlert("EN-Q: htOneMinWindowHistogram\n" + JSON.stringify(htOneMinWindowHistogram, null, 3)));
        });

      }
    }
    else {
      var currentSecond = currentTime - (currentTime % 1000);
      // debug(chalkAlert("htObjArray[-]._second: " + currentSecond 
      //   + " | MIN: " + msToMinutes(currentSecond)
      //   + " | DATE: " + getTimeStamp(currentSecond)
      // ));
      htRate1minQ.enqueue({"_second" : currentSecond});
    }
  });

  if (htRate1minQ.isEmpty()) {
  }
  else {

    htRateQhead = htRate1minQ.peek();

    if ((htRateQhead._second + 60000) < currentTime){
      // debug(chalkGreen("<<< --- htRateQhead deQ: " + getTimeStamp(htRateQhead._second) + " | NOW: " + currentTime));  
      htRateQhead = htRate1minQ.dequeue();
      // debug(chalkGreen("HT RATE 1 MIN DeQ\n" + JSON.stringify(htRateQhead,null,3)));   
 
      // var decrementHtCountFlag = false ;

      Object.keys(htRateQhead).forEach(function(key) {
        // debug(chalkAlert("  " + key + ": " + htRateQhead[key]));
        if (key !== '_second') {
          // decrementHtCountFlag = true;
          htOneMinWindowHistogram[key] -= htRateQhead[key] ;
          // debug(chalkGreen("--- " + key + "(-" + htRateQhead[key] + ") : " + htOneMinWindowHistogram[key]));
          if (htOneMinWindowHistogram[key] <= 0) delete htOneMinWindowHistogram[key] ;
          // debug(chalkGreen("DE-Q: htOneMinWindowHistogram\n" + JSON.stringify(htOneMinWindowHistogram, null, 3)));
        }
        else {
          htOneMinWindowHistogram[key] = htRateQhead[key] ;
        }
      });

      // if (decrementHtCountFlag) debug(chalkGreen("DE-Q: htOneMinWindowHistogram\n" + JSON.stringify(htOneMinWindowHistogram, null, 3)));
      // decrementHtCountFlag = false ;
    }
  }
}, 100);


var databaseEnabled = false ;

configEvents.on("DATABASE_INIT_COMPLETE", function(tweetCount){
  databaseEnabled = true ;
  console.log(chalkInfo(getTimeStamp() + " | DATABASE ENABLED"));
});

var updateTweetCountInterval = setInterval(function () {
  if (databaseEnabled){
    getTotalTweets(function(err, count){
      if (!err){ 
        numberTweetsReceived = count ;
        console.log(chalkInfo(getTimeStamp() + " | TOTAL TWEETS: " + numberTweetsReceived));
      } 
      else {
        console.error(chalkError("\n*** DB Tweet.find ERROR *** | " + getTimeStamp() + "\n" + err));
        console.log("\n*** DB Tweet.find ERROR *** | " + getTimeStamp() + "\n" + err);
      }
    });
  }
}, 4*ONE_HOUR);



//=================================
//  REMOVE DISCONNECTED CLIENT SOCKETS FROM HASH MAP
//=================================
var clientSocketCheckInterval = setInterval(function () {

  var clientSockets = findClientsSocket('/');

  clientSocketIdHashMap.forEach(function(clientObj, socketId) {
    if (clientSockets.has(socketId)){
     }
    else{
      console.warn(chalkWarn("??? DISCONNECTED STATE: CLIENT OBJ CONN: " + clientObj.connected + " ... REMOVING FROM HASH ..."));  
      clientSocketIdHashMap.remove(socketId);    
    }
  });
}, 1000);


//=================================
// INIT APP ROUTING
//=================================

function initAppRouting(){

  console.log(chalkInfo(getTimeStamp() + " | INIT APP ROUTING"));

  app.get('/js/libs/progressbar.min.js', function(req, res){
    debug("LOADING PAGE: /js/libs/progressbar.min.js");
    res.sendFile(__dirname + '/js/libs/progressbar.min.js');
  });

  app.get('/favicon.ico', function(req, res){
    debug("LOADING PAGE: /favicon.ico");
    res.sendFile(__dirname + '/favicon.png');
  });

  app.get('/favicon.png', function(req, res){
    debug("LOADING PAGE: /favicon.png");
    res.sendFile(__dirname + '/favicon.png');
  });

  app.get('/images/technoMask_400x429.png', function(req, res){
    debug("LOADING PAGE: /images/technoMask_400x429.png");
    res.sendFile(__dirname + '/images/technoMask_400x429.png');
  });

  app.get('/images/mapIcon.png', function(req, res){
    debug("LOADING PAGE: /images/mapIcon.png");
    res.sendFile(__dirname + '/images/mapIcon.png');
  });

  app.get('/images/mapIconKnown.png', function(req, res){
    debug("LOADING PAGE: /images/mapIconKnown.png");
    res.sendFile(__dirname + '/images/mapIconKnown.png');
  });

  app.get('/chart.html', function(req, res){
    debug("LOADING PAGE: /chart.html");
    res.sendFile(__dirname + '/chart.html');
  });

  app.get('/js/libs/d3.v3.min.js', function(req, res){
    debug("LOADING PAGE: /js/libs/d3.v3.min.js");
    res.sendFile(__dirname + '/js/libs/d3.v3.min.js');
  });

  app.get('/js/libs/jquery-latest.js', function(req, res){
    debug("LOADING PAGE: /js/libs/jquery-latest.js");
    res.sendFile(__dirname + '/js/libs/jquery-latest.js');
  });

  app.get('/js/libs/plotly.min.js', function(req, res){
    debug("LOADING PAGE: /js/libs/plotly.min.js");
    res.sendFile(__dirname + '/js/libs/plotly.min.js');
  });

  app.get('/js/libs/chartView.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/chartView.js');
  });

  app.get('/js/libs/Chart.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/Chart.js');
  });


  app.get('/stats.html', function(req, res){
    debug("LOADING PAGE: /stats.html");
    res.sendFile(__dirname + '/stats.html');
  });

  app.get('/stats', function(req, res){
    debug("LOADING PAGE: /stats");
    res.sendFile(__dirname + '/stats.html');
  });

  app.get('/map', function(req, res){
    debug("LOADING PAGE: /map");
    res.sendFile(__dirname + '/map.html');
  });

  app.get('/js/libs/statsView.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/statsView.js');
  });

  app.get('/js/libs/mapView.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/mapView.js');
  });

  app.get('/testTweetServer.js', function(req, res){
    res.sendFile(__dirname + '/testTweetServer.js');
  });

  app.get('/', function(req, res){
    debug("LOADING PAGE: /");
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/facebook', function(req, res){
    debugFb("\n@@@ FACEBOOK PAGE GET REQUEST: " + util.inspect(req, {showHidden: false, depth: 1}));
    debugFb(chalkFacebook("<<< FACEBOOK PAGE GET REQUEST: " + JSON.stringify(req, null, 2)));
    console.log(chalkFacebook(">>> SENDING FACEBOOK GET RESPONSE: OK"));
    res.send('OK');
  });

  app.post('/facebook', function(req, res){

    debugFb(chalkFacebook("<<< RX FACEBOOK PAGE POST REQUEST\n" + util.inspect(req.body, {showHidden: false, depth: 1})));
    // console.log(chalkFacebook(">>> SENDING FACEBOOK GET RESPONSE: OK"));
    res.send('OK');

  });

  app.get('/instagram', function(req, res){
    debugIg("\n@@@ INSTAGRAM PAGE GET REQUEST: " + util.inspect(req, {showHidden: false, depth: 1}));
    debugIg(chalkInstagram("<<< INSTAGRAM PAGE GET REQUEST: " + req.url));
    console.log(chalkInstagram(">>> SENDING INSTAGRAM GET RESPONSE: req.query['hub.challenge']: " + req.query['hub.challenge']));
    res.send(req.query['hub.challenge']);
  });

  app.post('/instagram', function(req, res){

    debugIg(chalkInstagram("<<< RX INSTAGRAM PAGE POST REQUEST\n" + util.inspect(req.body, {showHidden: false, depth: 1})));

    if (instagramRateLimitException) {
      console.warn("### INSTAGRAM RATE LIMIT EXCEPTION AT " + getTimeStamp(instagramRateLimitException) 
        + " -- " + msToTime(getTimeNow() - instagramRateLimitException) + " AGO"
        + " ... SKIPPING getLatestInstagram"
        + "\n"
        );
    }
    else if (instagramTagHashMapInitComplete){
      getLatestInstagram(req.body[0]);
    }
    else{
      console.warn("! INSTAGRAM HASHMAP INIT NOT COMPLETE ... SKIPPING getLatestInstagram REQ: " + JSON.stringify(req.body[0], null, 2));
    }

    res.send('OK');

  });

  app.get('/test', function(req, res){
    debug("LOADING PAGE: /test: " + req);
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/blacklivesmatter', function(req, res){
    debug("LOADING PAGE: /blacklivesmatter");
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/admin/admin.html', function(req, res){
    debug("LOADING PAGE: /admin/admin.html");
    res.sendFile(__dirname + '/admin/admin.html');
  });

  app.get('/node_modules/debug/node_modules/debug.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/debug/node_modules/debug.js');
  });

  app.get('/graph', function(req, res){
    debug("LOADING PAGE: /graph");
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/authTest.html', function(req, res){
    res.sendFile(__dirname + '/authTest.html');
  });

  app.get('/css/main.css', function(req, res){
    res.sendFile(__dirname + '/css/main.css');
  });

  app.get('/css/progressbar.css', function(req, res){
    res.sendFile(__dirname + '/css/progressbar.css');
  });

  app.get('/css/style.css', function(req, res){
    res.sendFile(__dirname + '/css/style.css');
  });

  app.get('/css/base.css', function(req, res){
    res.sendFile(__dirname + '/css/base.css');
  });

  // app.get('/css/pace-center-simple.css', function(req, res){
  //   res.sendFile(__dirname + '/css/pace-center-simple.css');
  // });

  app.get('/node_modules/async/lib/async.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/async/lib/async.js');
  });

  app.get('/js/libs/forceDirectedView.js', function(req, res){
    debug("LOADING FILE: forceDirectedView.js");
    res.sendFile(__dirname + '/js/libs/forceDirectedView.js');
  });

  app.get('/js/libs/d3.min.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/d3.min.js');
  });

  app.get('/js/libs/Queue.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/Queue.js');
  });

  // app.get('/js/libs/pace.js', function(req, res){
  //   res.sendFile(__dirname + '/js/libs/pace.js');
  // });

  app.get('/js/libs/tablesorter/jquery-latest.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/tablesorter/jquery-latest.js');
  });

  app.get('/js/libs/tablesorter/jquery.tablesorter.js', function(req, res){
    res.sendFile(__dirname + '/js/libs/tablesorter/jquery.tablesorter.js');
  });

  app.get('/node_modules/stats/stats.min.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/stats/stats.min.js');
  });

  app.get('/node_modules/hashmap/hashmap.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/hashmap/hashmap.js');
  });

  app.get('/public/', function(req, res){
    res.sendFile(__dirname + '/public/');
  });

  app.get('/public/img/', function(req, res){
    res.sendFile(__dirname + '/public/img/');
  });

  app.get('/public/entries/', function(req, res){
    res.sendFile(__dirname + '/public/entries/');
  });

  app.get('/threecee.pem', function(req, res){
    debug("LOADING FILE: threecee.pem");
    res.sendFile(__dirname + '/threecee.pem');
  });

  app.get('*', function(req, res){
    console.log("??? UNKNOWN REQ ??? :");
    // console.log(req);
    // res.status(404).send('what???');
  });
}

initializeConfiguration();



module.exports = {
 app: app,
 io:io, 
 http: http
}


