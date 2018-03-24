/*jslint node: true */
"use strict";

let networkReady = false;

const MAX_Q = 500;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");
const debug = require("debug")("twp");
const moment = require("moment");
const async = require("async");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

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

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const dbConnection = wordAssoDb();

dbConnection.on("error", console.error.bind(console, "connection error:"));
dbConnection.once("open", function() {
  console.log("CONNECT: TWEET PARSER MONGOOSE default connection open");
  Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
  Media = mongoose.model("Media", mediaModel.MediaSchema);
  Place = mongoose.model("Place", placeModel.PlaceSchema);
  Tweet = mongoose.model("Tweet", tweetModel.TweetSchema);
  Url = mongoose.model("Url", urlModel.UrlSchema);
  User = mongoose.model("User", userModel.UserSchema);
  Word = mongoose.model("Word", wordModel.WordSchema);
});

const tweetServer = require("@threeceelabs/tweet-server-controller");
const tweetParserQueue = [];

const chalk = require("chalk");
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkNetwork = chalk.blue;

const EventEmitter2 = require("eventemitter2").EventEmitter2;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");

function jsonPrint(obj) {
  if (obj) {
    return JSON.stringify(obj, null, 2);
  } else {
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

  console.error(process.argv[1]
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

process.title = "node_tweetParser";
console.log(
  "\n\n====================================================================================================\n" 
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
  console.log("UPDATER: \n%%%%%%%%%%%%%%\n%%%%%%% DEBUG ENABLED %%%%%%%\n%%%%%%%%%%%%%%\n");
}

let cnf = {};
cnf.verbose = false;
cnf.updateInterval = 10;
cnf.globalTestMode = false;
cnf.testMode = false;
cnf.inc = true;

let tweetParserQueueInterval;

function initTweetParserQueueInterval(cnf){

  console.log(chalkInfo("initTweetParserQueueInterval | " + cnf.updateInterval + " MS"));

  clearInterval(tweetParserQueueInterval);

  let tweet;
  let tweetParserQueueReady = true;
  let params = {
    globalTestMode: cnf.globalTestMode,
    testMode: cnf.testMode,
    inc: cnf.inc,
    twitterEvents: configEvents
  };

  tweetServer.loadNeuralNetwork({networkObj: cnf.networkObj}, function(){});
  tweetServer.loadMaxInputHashMap(cnf.maxInputHashMap, function(){});
  tweetServer.loadNormalization(cnf.normalization, function(){});

  tweetParserQueueInterval = setInterval(function(){

    if (tweetServer.ready() && (tweetParserQueue.length > 0) && tweetParserQueueReady && networkReady){

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
            console.log(chalkError("CREATE STREAM TWEET ERROR\n" + jsonPrint(err)));
          }
        }
        else if (cnf.globalTestMode){

          tweetParserQueueReady = true;

          if (cnf.verbose){
            console.log(chalkAlert("t< GLOBAL TEST MODE"
              + " | " + tweetObj.tweetId
              + " | @" + tweetObj.user.userId
            ));
          }
        }
        else {
          debug(chalkInfo("TW PARSER [" + tweetParserQueue.length + "]"
            + " createStreamTweet DONE" 
            + " | " + tweetObj.tweetId
          ));

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
      cnf.updateInterval = m.interval;
      cnf.networkObj = {};
      cnf.networkObj = m.networkObj;
      cnf.maxInputHashMap = {};
      cnf.maxInputHashMap = m.maxInputHashMap;
      cnf.normalization = {};
      cnf.normalization = m.normalization;
      cnf.inputArrays = {};

      console.log(chalkInfo("TWEET PARSER INIT"
        + " | INTERVAL: " + m.interval
        + " | NN: " + m.networkObj.networkId
        + " | MAX IN HM INPUT TYPES: " + Object.keys(cnf.maxInputHashMap)
        + " | NORMALIZATION INPUT TYPES: " + Object.keys(cnf.normalization)
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


    break;

    case "NETWORK":

      networkReady = false;

      console.log(chalkInfo("TWEET PARSER NETWORK"
        + " | NN: " + m.networkObj.networkId
        + " | SUCCESS RATE: " + m.networkObj.successRate.toFixed(2)
      ));

      cnf.networkObj = {};
      cnf.networkObj = m.networkObj;

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