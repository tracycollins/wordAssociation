/*jslint node: true */
"use strict";

const MAX_Q = 500;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");
const debug = require("debug")("wa");
const moment = require("moment");

const wordAssoDb = require("@threeceelabs/mongoose-twitter");
const db = wordAssoDb();

const tweetServer = require("@threeceelabs/tweet-server-controller");
// const wordServer = require("@threeceelabs/word-server-controller");

const Queue = require("queue-fifo");
const tweetParserQueue = new Queue();

const chalk = require("chalk");
const chalkInfo = chalk.gray;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;

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

console.log(
  "\n\n====================================================================================================\n" 
  + "========================================= ***START*** ==============================================\n" 
  + "====================================================================================================\n" 
  + process.argv[1] 
  + "\nPROCESS ID  " + process.pid 
  // + "\nSTARTED     " + Date() 
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

  tweetParserQueueInterval = setInterval(function(){

    if (!tweetParserQueue.isEmpty() && tweetParserQueueReady){

      tweetParserQueueReady = false;

      tweet = tweetParserQueue.dequeue();

      debug(chalkInfo("TPQ>"
        + " [" + tweetParserQueue.size() + "]"
        // + " | " + socket.id
        + " | " + tweet.id_str
        + " | " + tweet.user.id_str
        + " | " + tweet.user.screen_name
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
          debug(chalkInfo("[" + tweetParserQueue.size() + "]"
            + " createStreamTweet DONE" 
            + " | " + tweetObj.tweetId
            // + "\ntweetObj.tweet.user\n" + jsonPrint(tweetObj.tweet.user)
            // + "\ntweetObj.user\n" + jsonPrint(tweetObj.user)
          ));

          process.send({op: "parsedTweet", tweetObj: tweetObj}, function(err){

            tweetParserQueueReady = true;

            if (err) {
              console.error(chalkError("*** TWEET PARSER SEND TWEET ERROR"
                + " | " + moment().format(compactDateTimeFormat)
                + " | " + err
              ));
            }
            else {
              debug(chalkInfo(moment().format(compactDateTimeFormat)
                + " | SEND TWEET COMPLETE"
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
      if (tweetParserQueue.size() < MAX_Q) {

        tweetParserQueue.enqueue(m.tweetStatus);

        debug(chalkInfo("T<"
          + " [ TPQ: " + tweetParserQueue.size() + "]"
          + " | " + m.tweetStatus.id_str
        ));
      }
      else {
        debug(chalkAlert("*** MAX TWEET PARSE Q SIZE: " + tweetParserQueue.size()));
      }
    break;

    default:
      console.error(chalkError("*** TWEET PARSER UNKNOWN OP"
        + " | INTERVAL: " + m.op
      ));
  }
});