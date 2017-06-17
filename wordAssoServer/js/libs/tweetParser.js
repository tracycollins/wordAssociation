/*jslint node: true */
"use strict";

var compactDateTimeFormat = "YYYYMMDD HHmmss";

var debug = require('debug')('wa');
var moment = require('moment');
var os = require('os');

var hostname = os.hostname();
hostname = hostname.replace(/.local/g, '');
hostname = hostname.replace(/.home/g, '');
hostname = hostname.replace(/.fios-router.home/g, '');
hostname = hostname.replace(/word0-instance-1/g, 'google');

var jsonPrint = function(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } else {
    return obj;
  }
}

function quit(message) {
  var msg = "";
  var exitCode = 0;
  if (message) {
    msg = message;
    exitCode = 1;
  }
  console.error(process.argv[1]
    + " | TWEET PARSER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );
  process.exit(exitCode);
}

process.on('SIGHUP', function() {
  quit('SIGHUP');
});

process.on('SIGINT', function() {
  quit('SIGINT');
});


// ==================================================================
// GLOBAL VARIABLES
// ==================================================================
var ONE_SECOND = 1000;
var ONE_MINUTE = ONE_SECOND * 60;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;


// ==================================================================
// NODE MODULE DECLARATIONS
// ==================================================================

var async = require('async');
var HashMap = require('hashmap').HashMap;

var mongoose = require('../../config/mongoose');
var db = mongoose();
var Media = require('mongoose').model('Media');
var Url = require('mongoose').model('Url');
var Hashtag = require('mongoose').model('Hashtag');
var Place = require('mongoose').model('Place');
var User = require('mongoose').model('User');
var Word = require('mongoose').model('Word');
var Group = require('mongoose').model('Group');
var Entity = require('mongoose').model('Entity');

var tweetServer = require("../../app/controllers/tweets.server.controller");

var tweetParserQueue = [];

console.log(
  '\n\n====================================================================================================\n' 
  + '========================================= ***START*** ==============================================\n' 
  + '====================================================================================================\n' 
  + process.argv[1] 
  + '\nPROCESS ID  ' + process.pid 
  + '\nSTARTED     ' + Date() 
  + '\n' + '====================================================================================================\n' 
  + '========================================= ***START*** ==============================================\n' 
  + '====================================================================================================\n\n'
);

// ==================================================================
// LOGS, STATS
// ==================================================================
var chalk = require('chalk');

var chalkRed = chalk.red;
var chalkGreen = chalk.green;
var chalkInfo = chalk.gray;
var chalkTest = chalk.bold.red;
var chalkAlert = chalk.red;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.black;

var EventEmitter2 = require("eventemitter2").EventEmitter2;

var configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

// ==================================================================
// ENV INIT
// ==================================================================
if (debug.enabled) {
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

var statsObj = {};

var cnf = {};
cnf.verbose = false;
cnf.updateInterval = 10;
cnf.globalTestMode = false;
cnf.testMode = false;
cnf.noInc = false;

var tweetParserQueueInterval;
      
process.on('message', function(m) {

  debug(chalkAlert("TWEET PARSER RX MESSAGE"
    + " | OP: " + m.op
    // + "\n" + jsonPrint(m)
  ));

  switch (m.op) {

    case "INIT":
      cnf.updateInterval = m.interval;
      console.log(chalkInfo("TWEET PARSER INIT"
        + " | INTERVAL: " + m.interval
      ));
      initTweetParserQueueInterval(cnf);
    break;

    case "tweet":
      tweetParserQueue.push(m.tweetStatus);
      debug(chalkInfo("T<"
        + " [" + tweetParserQueue.length + "]"
        + " | " + m.tweetStatus.id_str
      ));
    break;

    default:
      console.error(chalkError("*** TWEET PARSER UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));
  }
});

// ==================================================================
// FUNCTIONS
// ==================================================================
function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24),
    days = parseInt(duration / (1000 * 60 * 60 * 24));

  days = (days < 10) ? "0" + days : days;
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return days + ":" + hours + ":" + minutes + ":" + seconds;
}

var tweetParserQueueInterval;
var tweetParserQueueReady = true;

function initTweetParserQueueInterval(cnf){

  console.log(chalkInfo("initTweetParserQueueInterval | " + cnf.updateInterval + " MS"));

  clearInterval(tweetParserQueueInterval);

  var params = {
    globalTestMode: cnf.globalTestMode,
    testMode: cnf.testMode,
    noInc: cnf.noInc,
    twitterEvents: configEvents
  };

  var tweet;

  tweetParserQueueInterval = setInterval(function(){

    if (tweetParserQueue.length > 0){

      tweetParserQueueReady = false;

      tweet = tweetParserQueue.shift();

      debug(chalkInfo("TPQ>"
        + " [" + tweetParserQueue.length + "]"
        // + " | " + socket.id
        + " | " + tweet.id_str
        + " | " + tweet.user.id_str
        + " | " + tweet.user.screen_name
        + " | " + tweet.user.name
      ));

      params.tweetStatus = tweet;

      tweetServer.createStreamTweet(
        params,
        function(err, tweetObj){

          if (err){
            if (err.code !== 11000) {
              console.log(chalkError("CREATE STREAM TWEET ERROR\n" + jsonPrint(err)));
            }
            tweetParserQueueReady = true;
          }
          else if (cnf.globalTestMode){
            if (cnf.verbose){
              console.log(chalkAlert("t< GLOBAL TEST MODE"
                + " | " + tweetObj.tweetId
                + " | @" + tweetObj.user.userId
              ));
            }
            tweetParserQueueReady = true;
          }
          else {
            debug(chalkInfo("[" + tweetParserQueue.length + "]"
              + " createStreamTweet DONE" 
              + " | " + tweetObj.tweetId
              // + "\ntweetObj.tweet.user\n" + jsonPrint(tweetObj.tweet.user)
              // + "\ntweetObj.user\n" + jsonPrint(tweetObj.user)
            ));

            process.send({op: "parsedTweet", tweetObj: tweetObj}, function(err){

              if (err) {
                console.error(chalkError("*** TWEET PARSER SEND TWEET ERROR"
                  + " | " + err
                ));
              }
              else {
                debug(chalkInfo(moment().format(compactDateTimeFormat)
                  + " | SEND TWEET COMPLETE"
                  + " | " + tweetObj.tweetId
                ));
              }

              tweetParserQueueReady = true;
            });
          }
          
        }
      );
      // tweetParserQueueReady = true;

    }
  }, cnf.updateInterval);
}

