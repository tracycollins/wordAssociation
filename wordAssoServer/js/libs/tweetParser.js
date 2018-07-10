/*jslint node: true */
"use strict";

process.title = "wa_node_tweetParser";

let networkReady = false;

const MAX_Q = 100;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");
const debug = require("debug")("twp");
const moment = require("moment");
const async = require("async");
const treeify = require("treeify");

const chalk = require("chalk");
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkNetwork = chalk.blue;

const mongoose = require("mongoose");

const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

let Hashtag;
let Media;
let Place;
let Tweet;
let Url;
let User;
let Word;
let tweetServer;

const tweetParserQueue = [];

const EventEmitter2 = require("eventemitter2").EventEmitter2;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word/g, "google");

function jsonPrint(obj) {
  if (obj) {
    return treeify.asTree(obj, true, true);
  } 
  else {
    return obj;
  }
}

function quit(message) {

  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.error("TWP | " + process.argv[1]
    + " | " + moment().format(compactDateTimeFormat)
    + " | TWEET PARSER: **** QUITTING"
    + " | CAUSE: " + msg
    + " | PID: " + process.pid
    
  );
  process.exit(exitCode);
}

process.on("SIGHUP", function processSigHup() {
  quit("SIGHUP");
});

process.on("SIGINT", function processSigInt() {
  quit("SIGINT");
});

console.log(
  "\n\nTWP | ====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID:    " + process.pid 
  + "\nPROCESS TITLE: " + process.title 
  + "\n" + "====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n\n"
);

const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function configEventsNewListener(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});

if (debug.enabled) {
  console.log("*** TWP\n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

let cnf = {};
cnf.verbose = false;
cnf.updateInterval = 5;
cnf.globalTestMode = false;
cnf.testMode = false;
cnf.inc = true;

let tweetParserQueueInterval;

function initTweetParserQueueInterval(cnf){

  console.log(chalkInfo("TWP | initTweetParserQueueInterval | " + cnf.updateInterval + " MS"));

  clearInterval(tweetParserQueueInterval);

  let tweet;
  let tweetParserQueueReady = true;
  let params = {
    globalTestMode: cnf.globalTestMode,
    testMode: cnf.testMode,
    inc: cnf.inc,
    twitterEvents: configEvents
  };

  if (tweetServer) { 
    if (cnf.networkObj) { tweetServer.loadNeuralNetwork({networkObj: cnf.networkObj}, function(){}); }
    if (cnf.maxInputHashMap) { tweetServer.loadMaxInputHashMap(cnf.maxInputHashMap, function(){}); }
    if (cnf.normalization) { tweetServer.loadNormalization(cnf.normalization, function(){}); }
  }

  tweetParserQueueInterval = setInterval(function(){

    if (tweetServer 
      && tweetServer.ready() 
      && (tweetParserQueue.length > 0) 
      && tweetParserQueueReady && networkReady)
    {

      tweetParserQueueReady = false;

      tweet = tweetParserQueue.shift();

      debug(chalkInfo("TW PARSER TPQ>"
        + " [" + tweetParserQueue.length + "]"
        + " | " + tweet.id_str
        + " | " + tweet.user.id_str
        + " | @" + tweet.user.screen_name
        + " | " + tweet.user.name
        + " | Ts: " + tweet.user.statuses_count
        + " | FLs: " + tweet.user.followers_count
        + " | FRs: " + tweet.user.friends_count
      ));

      params.tweetStatus = tweet;

      tweetServer.createStreamTweet(params, function createStreamTweetCallback(err, tweetObj){

        if (err){

          tweetParserQueueReady = true;

          if (err.code !== 11000) {
            console.log(chalkError("TWP | CREATE STREAM TWEET ERROR\n" + jsonPrint(err)));
          }
        }
        else if (cnf.globalTestMode){

          tweetParserQueueReady = true;

          if (cnf.verbose){
            console.log(chalkAlert("TWP | t< GLOBAL TEST MODE"
              + " | " + tweetObj.tweetId
              + " | @" + tweetObj.user.screenName
            ));
          }
        }
        else {
          if (cnf.verbose) {
            console.log.bind(console, "TWP | TW PARSER [" + tweetParserQueue.length + "]"
              + " | " + tweetObj.tweetId);
            console.log(chalkInfo("TWP | TW PARSER [" + tweetParserQueue.length + "]"
              + " | " + tweetObj.tweetId
            ));
          }

          process.send({op: "parsedTweet", tweetObj: tweetObj}, function(err){

            tweetParserQueueReady = true;

            if (err) {
              console.error(chalkError("*** TW PARSER SEND TWEET ERROR"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + err
              ));
            }
            else {
              debug(chalkInfo("TW PARSER SEND COMPLETE"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + tweetObj.tweetId
              ));
            }
            
          });
        }
      });
    }

  }, cnf.updateInterval);
}

process.on("message", function(m) {

  debug(chalkAlert("TWEET PARSER RX MESSAGE"
    + " | OP: " + m.op
  ));

  switch (m.op) {

    case "INIT":

      process.title = m.title;

      cnf.verbose = m.verbose;
      cnf.updateInterval = m.interval;
      cnf.networkObj = {};
      cnf.networkObj = m.networkObj;
      cnf.maxInputHashMap = {};
      cnf.maxInputHashMap = m.maxInputHashMap;
      cnf.normalization = {};
      cnf.normalization = m.normalization;
      cnf.inputArrays = {};

      console.log(chalkInfo("TWEET PARSER INIT"
        + " | TITLE: " + m.title
        + " | INTERVAL: " + m.interval
        + "\nMESSAGE " + jsonPrint(m)
      ));

      if (cnf.networkObj) {
        console.log(chalkInfo("TWEET PARSER INIT"
          + " | NN: " + m.networkObj.networkId
        ));

        async.eachSeries(Object.keys(m.networkObj.inputsObj.inputs), function(type, cb){

          console.log(chalkNetwork("NN INPUTS TYPE" 
            + " | " + type
            + " | INPUTS: " + m.networkObj.inputsObj.inputs[type].length
          ));

          cnf.inputArrays[type] = {};
          cnf.inputArrays[type] = m.networkObj.inputsObj.inputs[type];

          cb();
        }, function(){
          initTweetParserQueueInterval(cnf);
          networkReady = true;
        });

      }
      else {
        initTweetParserQueueInterval(cnf);
        networkReady = false;
      }
      
      if (cnf.maxInputHashMap) {
        console.log(chalkInfo("TWEET PARSER INIT"
          + " | MAX IN HM INPUT TYPES: " + Object.keys(cnf.maxInputHashMap)
        ));
      }
      
      if (cnf.normalization) {
        console.log(chalkInfo("TWEET PARSER INIT"
          + " | NORMALIZATION INPUT TYPES: " + Object.keys(cnf.normalization)
        ));
      }
      

    break;

    case "NETWORK":

      networkReady = false;

      console.log(chalkInfo("TWEET PARSER NETWORK"
        + " | NN: " + m.networkObj.networkId
        + " | SUCCESS RATE: " + m.networkObj.successRate.toFixed(2)
      ));

      cnf.networkObj = {};
      cnf.networkObj = m.networkObj;

      tweetServer.loadNeuralNetwork({networkObj: cnf.networkObj}, function(){});

      cnf.inputArrays = {};

      async.eachSeries(Object.keys(m.networkObj.inputsObj.inputs), function(type, cb){

        console.log(chalkNetwork("NN INPUTS TYPE" 
          + " | " + type
          + " | INPUTS: " + m.networkObj.inputsObj.inputs[type].length
        ));

        cnf.inputArrays[type] = {};
        cnf.inputArrays[type] = m.networkObj.inputsObj.inputs[type];

        cb();

      }, function(){
        networkReady = true;
      });


    break;

    case "tweet":
      if (tweetParserQueue.length < MAX_Q) {

        tweetParserQueue.push(m.tweetStatus);

        debug(chalkInfo("TW PARSER T<"
          + " [ TPQ: " + tweetParserQueue.length + "]"
          + " | " + m.tweetStatus.id_str
        ));
      }
      else {
        debug(chalkAlert("*** MAX TWEET PARSE Q SIZE: " + tweetParserQueue.length));
      }
    break;

    default:
      console.error(chalkError("*** TWEET PARSER UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));
  }
});