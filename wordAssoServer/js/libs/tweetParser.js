/*jslint node: true */
/*jshint sub:true*/
"use strict";


global.dbConnection = false;
let dbConnectionReady = false;

process.title = "wa_node_tweetParser";

// let networkReady = false;

const MAX_Q = 100;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");
const debug = require("debug")("twp");
const moment = require("moment");
const async = require("async");
const treeify = require("treeify");
const EventEmitter2 = require("eventemitter2").EventEmitter2;

const chalk = require("chalk");
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkNetwork = chalk.blue;

let statsObj = {};
statsObj.dbConnectionReady = false;


const configEvents = new EventEmitter2({
  wildcard: true,
  newListener: true,
  maxListeners: 20
});

configEvents.on("newListener", function configEventsNewListener(data) {
  debug("*** NEW CONFIG EVENT LISTENER: " + data);
});


const emojiModel = require("@threeceelabs/mongoose-twitter/models/emoji.server.model");
const hashtagModel = require("@threeceelabs/mongoose-twitter/models/hashtag.server.model");
const mediaModel = require("@threeceelabs/mongoose-twitter/models/media.server.model");
const locationModel = require("@threeceelabs/mongoose-twitter/models/location.server.model");
const placeModel = require("@threeceelabs/mongoose-twitter/models/place.server.model");
const tweetModel = require("@threeceelabs/mongoose-twitter/models/tweet.server.model");
const urlModel = require("@threeceelabs/mongoose-twitter/models/url.server.model");
const userModel = require("@threeceelabs/mongoose-twitter/models/user.server.model");
const wordModel = require("@threeceelabs/mongoose-twitter/models/word.server.model");

let Emoji;
let Hashtag;
let Media;
let Location;
let Place;
let Tweet;
let Url;
let User;
let Word;

let TweetServerController;
let tweetServerController;
let tweetServerControllerReady = false;

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const wordAssoDb = require("@threeceelabs/mongoose-twitter");

configEvents.on("DB_CONNECT", function configEventDbConnect(){

  TweetServerController = require("@threeceelabs/tweet-server-controller");
  tweetServerController = new TweetServerController("TWP");

  tweetServerController.on("ready", function(err){
    tweetServerControllerReady = true;
    console.log(chalk.green("TWP | TSC READY"));
  });

  tweetServerController.on("error", function(err){
    tweetServerControllerReady = false;
    console.log(chalkError("TWP | *** TSC ERROR | " + err));
  });
});


const dbAppName = "TWP_" + process.pid;

wordAssoDb.connect(dbAppName, function(err, db) {

  if (err) {
    console.log(chalkError("TWP | *** MONGO DB CONNECTION ERROR"
      + " | DB APP NAME: " + dbAppName
      + " | ERROR: " + err
    ));
    configEvents.emit("DB_CONNECT_ERROR");
    return;
  }

  db.on("error", function(err){
    console.error.bind(console, "TWP | *** MONGO DB CONNECTION ERROR ***\n");
    console.log(chalkError("TWP | *** MONGO DB CONNECTION ERROR"
      + " | DB APP NAME: " + dbAppName
      + " | ERROR: " + err
    ));
    dbConnectionReady = false;
    statsObj.dbConnectionReady = false;
    configEvents.emit("DB_ERROR");
  });

  db.on("disconnected", function(){
    console.error.bind(console, "TWP | MONGO DB DISCONNECTED ***\n");
    console.log(chalkError("TWP | MONGO DB DISCONNECTED"
      + " | DB APP NAME: " + dbAppName
    ));
    dbConnectionReady = false;
    statsObj.dbConnectionReady = false;
    configEvents.emit("DB_DISCONNECT");
  });

  Emoji = mongoose.model("Emoji", emojiModel.EmojiSchema);
  Hashtag = mongoose.model("Hashtag", hashtagModel.HashtagSchema);
  Media = mongoose.model("Media", mediaModel.MediaSchema);
  Location = mongoose.model("Location", locationModel.LocationSchema);
  Place = mongoose.model("Place", placeModel.PlaceSchema);
  Tweet = mongoose.model("Tweet", tweetModel.TweetSchema);
  Url = mongoose.model("Url", urlModel.UrlSchema);
  User = mongoose.model("User", userModel.UserSchema);
  Word = mongoose.model("Word", wordModel.WordSchema);


  console.log(chalkInfo("TWP | DB READY STATE: " + db.readyState));

  console.log(chalk.bold.green("TWP | MONGOOSE DEFAULT CONNECTION OPEN"));


  global.dbConnection = db;

  dbConnectionReady = true;
  statsObj.dbConnectionReady = true;
  configEvents.emit("DB_CONNECT");
});

const tweetParserQueue = [];

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

  if ((global.dbConnection !== undefined) && (global.dbConnection.readyState > 0)) {
    global.dbConnection.close(function () {
      
      console.log(chalkAlert(
        "\nTWP | ==========================\n"
        + "TWP | MONGO DB CONNECTION CLOSED"
        + "\nTWP | ==========================\n"
      ));

      process.exit(exitCode);
    });
  }
  else {
    process.exit(exitCode);
  }

}

process.on("SIGHUP", function processSigHup() {
  quit("SIGHUP");
});

process.on("SIGINT", function processSigInt() {
  quit("SIGINT");
});

process.on("disconnect", function processDisconnect() {
  quit("DISCONNECT");
});


console.log(
  "\n\nTWP | ====================================================================================================\n" 
  + process.argv[1] 
  + "\nTWP | PROCESS ID:    " + process.pid 
  + "\nTWP | PROCESS TITLE: " + process.title 
  + "\nTWP | " + "====================================================================================================\n" 
);


if (debug.enabled) {
  console.log("TWP | %%%%%%%%%%%%%%\nTWP | %%%%%%% DEBUG ENABLED %%%%%%%\nTWP | %%%%%%%%%%%%%%\n");
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

  let deltaTweetParserMessageStart = process.hrtime();
  let deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);

  let tweet;
  let tweetParserQueueReady = true;
  let params = {
    globalTestMode: cnf.globalTestMode,
    testMode: cnf.testMode,
    inc: cnf.inc,
    twitterEvents: configEvents
  };

  if (tweetServerControllerReady) { 
    if (cnf.networkObj) { tweetServerController.loadNeuralNetwork({networkObj: cnf.networkObj}, function(){}); }
    if (cnf.maxInputHashMap) { tweetServerController.loadMaxInputHashMap(cnf.maxInputHashMap, function(){}); }
    if (cnf.normalization) { tweetServerController.loadNormalization(cnf.normalization, function(){}); }
  }

  tweetParserQueueInterval = setInterval(function(){

    if (tweetServerController 
      && (tweetParserQueue.length > 0) 
      && tweetParserQueueReady)
    {

      tweetParserQueueReady = false;

      tweet = tweetParserQueue.shift();

      debug(chalkInfo("TW PARSER TPQ>"
        + " [" + tweetParserQueue.length + "]"
        + " | " + tweet.id_str
        + " | TWEET LANG: " + tweet.lang
        + " | " + tweet.user.id_str
        + " | @" + tweet.user.screen_name
        + " | " + tweet.user.name
        + " | USER LANG: " + tweet.user.lang
        + " | Ts: " + tweet.user.statuses_count
        + " | FLs: " + tweet.user.followers_count
        + " | FRs: " + tweet.user.friends_count
      ));

      params.tweetStatus = tweet;


      tweetServerController.createStreamTweet(params)
      .then(function(tweetObj){

        if (cnf.globalTestMode){

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

            deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);

            if (deltaTweetParserMessage[0] > 0) { 
              console.log.bind(console, "TWP | *** SEND DELTA: " + deltaTweetParserMessage[0] + "." + deltaTweetParserMessage[1]); 
              console.log("TWP | *** SEND DELTA: " + deltaTweetParserMessage[0] + "." + deltaTweetParserMessage[1]); 
            }

            deltaTweetParserMessageStart = process.hrtime();

            tweetParserQueueReady = true;

            if (err) {
              console.error(chalkError("TWP | *** PARSER SEND TWEET ERROR"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + err
              ));
            }
            else {
              debug(chalkInfo("TWP | *** PARSER SEND COMPLETE"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + tweetObj.tweetId
              ));
            }
            
          });
        }
      })
      .catch(function(err){
        if (err) {
          console.log(chalkError("TWP | *** CREATE STREAM TWEET ERROR: ", err));
        }
        tweetParserQueueReady = true;
        if (err.code !== 11000) { console.log(chalkError("TWP | CREATE STREAM TWEET ERROR\n" + jsonPrint(err))); }
      });

      // let tweetObj;
      // try {

    //     tweetObj = await tweetServerController.createStreamTweet(params);

    //     if (cnf.globalTestMode){

    //       tweetParserQueueReady = true;

    //       if (cnf.verbose){
    //         console.log(chalkAlert("TWP | t< GLOBAL TEST MODE"
    //           + " | " + tweetObj.tweetId
    //           + " | @" + tweetObj.user.screenName
    //         ));
    //       }
    //     }
    //     else {

    //       if (cnf.verbose) {
    //         console.log.bind(console, "TWP | TW PARSER [" + tweetParserQueue.length + "]"
    //           + " | " + tweetObj.tweetId);
    //         console.log(chalkInfo("TWP | TW PARSER [" + tweetParserQueue.length + "]"
    //           + " | " + tweetObj.tweetId
    //         ));
    //       }

    //       process.send({op: "parsedTweet", tweetObj: tweetObj}, function(err){

    //         deltaTweetParserMessage = process.hrtime(deltaTweetParserMessageStart);

    //         if (deltaTweetParserMessage[0] > 0) { 
    //           console.log.bind(console, "TWP | *** SEND DELTA: " + deltaTweetParserMessage[0] + "." + deltaTweetParserMessage[1]); 
    //           console.log("TWP | *** SEND DELTA: " + deltaTweetParserMessage[0] + "." + deltaTweetParserMessage[1]); 
    //         }

    //         deltaTweetParserMessageStart = process.hrtime();

    //         tweetParserQueueReady = true;

    //         if (err) {
    //           console.error(chalkError("TWP | *** PARSER SEND TWEET ERROR"
    //             + " | " + moment().format(compactDateTimeFormat)
    //             + " | " + err
    //           ));
    //         }
    //         else {
    //           debug(chalkInfo("TWP | *** PARSER SEND COMPLETE"
    //             + " | " + moment().format(compactDateTimeFormat)
    //             + " | " + tweetObj.tweetId
    //           ));
    //         }
            
    //       });
    //     }
    //   }
    //   catch(err){
    //     tweetParserQueueReady = true;
    //     if (err.code !== 11000) { console.log(chalkError("TWP | CREATE STREAM TWEET ERROR\n" + jsonPrint(err))); }
    //   }

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

      console.log(chalkInfo("TWP | TWEET PARSER INIT"
        + " | TITLE: " + m.title
        + " | INTERVAL: " + m.interval
        // + "\nMESSAGE " + jsonPrint(m)
      ));

      if (cnf.networkObj) {
        console.log(chalkInfo("TWP | TWEET PARSER INIT"
          + " | NN: " + m.networkObj.networkId
        ));

        async.eachSeries(Object.keys(m.networkObj.inputsObj.inputs), function(type, cb){

          console.log(chalkNetwork("TWP | NN INPUTS TYPE" 
            + " | " + type
            + " | INPUTS: " + m.networkObj.inputsObj.inputs[type].length
          ));

          cnf.inputArrays[type] = {};
          cnf.inputArrays[type] = m.networkObj.inputsObj.inputs[type];

          cb();
        }, function(){
          initTweetParserQueueInterval(cnf);
          // networkReady = true;
        });

      }
      else {
        initTweetParserQueueInterval(cnf);
        // networkReady = false;
      }
      
      if (cnf.maxInputHashMap) {
        console.log(chalkInfo("TWP | TWEET PARSER INIT"
          + " | MAX IN HM INPUT TYPES: " + Object.keys(cnf.maxInputHashMap)
        ));
      }
      
      if (cnf.normalization) {
        console.log(chalkInfo("TWP | TWEET PARSER INIT"
          + " | NORMALIZATION INPUT TYPES: " + Object.keys(cnf.normalization)
        ));
      }
    break;

    case "NETWORK":

      // networkReady = false;

      console.log(chalkInfo("TWP | TWEET PARSER NETWORK"
        + " | NN: " + m.networkObj.networkId
        + " | SUCCESS RATE: " + m.networkObj.successRate.toFixed(2)
      ));

      cnf.networkObj = {};
      cnf.networkObj = m.networkObj;


      cnf.inputArrays = {};

      async.eachSeries(Object.keys(m.networkObj.inputsObj.inputs), function(type, cb){

        console.log(chalkNetwork("TWP | NN INPUTS TYPE" 
          + " | " + type
          + " | INPUTS: " + m.networkObj.inputsObj.inputs[type].length
        ));

        cnf.inputArrays[type] = {};
        cnf.inputArrays[type] = m.networkObj.inputsObj.inputs[type];

        cb();

      }, function(){
      });
    break;

    case "PING":
      debug(chalkLog("TWP | PING"
        + " | PING ID: " + moment(m.pingId).format(compactDateTimeFormat)
      ));

      setTimeout(function(){
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
    break;

    case "tweet":
      if (tweetParserQueue.length < MAX_Q) {

        tweetParserQueue.push(m.tweetStatus);

        debug(chalkInfo("TWP | PARSER T<"
          + " [ TPQ: " + tweetParserQueue.length + "]"
          + " | " + m.tweetStatus.id_str
        ));
      }
      else {
        debug(chalkAlert("TWP | *** MAX TWEET PARSE Q SIZE: " + tweetParserQueue.length));
      }
    break;

    default:
      console.log(chalkError("TWP | *** TWEET PARSER UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));
  }
});