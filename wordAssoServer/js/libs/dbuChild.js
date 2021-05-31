process.title = "wa_node_child_dbu";

const PF = "DBU";

const inputTypes = [
  "emoji",
  "friends",
  "hashtags",
  "images",
  "locations",
  "media",
  "mentions",
  "ngrams",
  "places",
  "sentiment",
  "urls",
  "userMentions",
  "words",
];

const DEFAULT_VERBOSE = false;
const DEFAULT_TEST_MODE = false;
const DEFAULT_USER_UPDATE_QUEUE_INTERVAL = 100;
const DEFAULT_MAX_UPDATE_QUEUE = 500;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const compactDateTimeFormat = "YYYYMMDD_HHmmss";

import os from "os";
import moment from "moment";
import _ from "lodash";
import merge from "deepmerge";

import { ThreeceeUtilities } from "@threeceelabs/threeceeutilities";
const tcUtils = new ThreeceeUtilities(PF + "_TCU");

const formatCategory = tcUtils.formatCategory;
const getTimeStamp = tcUtils.getTimeStamp;
const msToTime = tcUtils.msToTime;

tcUtils.on("error", function (err) {
  console.log(chalkError(PF + " | *** TCU ERROR | " + err));
});

tcUtils.on("ready", function (appname) {
  console.log(chalk.green(PF + " | TCU READY | " + appname));
});

import chalk from "chalk";
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkUser = chalk.black;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

console.log("WAS | ==============================");
console.log("WAS | HOST: " + hostname);
console.log("WAS | ==============================");

const statsObj = {};

statsObj.status = "LOAD";
statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.dbConnectionReady = false;

statsObj.startTimeMoment = moment();
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

statsObj.users = {};

statsObj.errors = {};
statsObj.errors.users = {};

process.on("unhandledRejection", function (err, promise) {
  console.trace(
    "Unhandled rejection (promise: ",
    promise,
    ", reason: ",
    err,
    ")."
  );
  process.exit();
});

process.on("SIGHUP", function () {
  quit("SIGHUP");
});

process.on("SIGINT", function () {
  quit("SIGINT");
});

process.on("disconnect", function () {
  quit("DISCONNECT");
});

import mgt from "@threeceelabs/mongoose-twitter";
global.wordAssoDb = mgt;

const mguAppName = PF + "_MGU";
import { MongooseUtilities } from "@threeceelabs/mongoose-utilities";
const mgUtils = new MongooseUtilities(mguAppName);

mgUtils.on("ready", async () => {
  console.log(`${PF} | +++ MONGOOSE UTILS READY: ${mguAppName}`);
});

const configuration = {}; // merge of defaultConfiguration & hostConfiguration
configuration.processName =
  process.env.DBU_PROCESS_NAME || "node_databaseUpdate";
configuration.verbose = DEFAULT_VERBOSE;
configuration.testMode = DEFAULT_TEST_MODE; // per tweet test mode
configuration.maxUserUpdateQueue = DEFAULT_MAX_UPDATE_QUEUE;
configuration.inputTypes = inputTypes;

console.log(
  "\n\nDBU | ====================================================================================================\n" +
    "\nDBU | " +
    process.argv[1] +
    "\nDBU | PROCESS ID:    " +
    process.pid +
    "\nDBU | PROCESS TITLE: " +
    process.title +
    "\nDBU | " +
    "====================================================================================================\n"
);

function showStats() {
  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  console.log(
    chalkLog(
      "DBU | ============================================================" +
        "\nDBU | S" +
        " | STATUS: " +
        statsObj.status +
        " | CPUs: " +
        statsObj.cpus +
        " | CH: " +
        statsObj.numChildren +
        " | S " +
        moment(parseInt(statsObj.startTime)).format(compactDateTimeFormat) +
        " | N " +
        moment().format(compactDateTimeFormat) +
        " | E " +
        msToTime(statsObj.elapsed) +
        "\nDBU | ============================================================"
    )
  );
}

function quit(options) {
  console.log(chalkAlert("DBU | ... QUITTING ..."));

  clearInterval(tweetUpdateQueueInterval);

  statsObj.elapsed = moment().valueOf() - statsObj.startTime;

  if (options !== undefined) {
    if (options === "help") {
      process.exit();
    }
  }

  showStats();

  setTimeout(function () {
    process.exit();
  }, 1000);
}

process.on("SIGINT", function () {
  quit("SIGINT");
});

process.on("exit", function () {
  quit("EXIT");
});

function initialize() {
  return new Promise(function (resolve) {
    statsObj.status = "INITIALIZE";

    resolve();
  });
}

function printUserObj(title, user) {
  console.log(
    chalkUser(
      title +
        " | " +
        user.userId +
        " | @" +
        user.screenName +
        " | " +
        user.name +
        " | FWs " +
        user.followersCount +
        " | FDs " +
        user.friendsCount +
        " | T " +
        user.statusesCount +
        " | M  " +
        user.mentions +
        " | LS " +
        getTimeStamp(user.lastSeen) +
        " | FW: " +
        user.following +
        " | 3C " +
        user.threeceeFollowing +
        " | LHTID " +
        user.lastHistogramTweetId +
        " | LHQID " +
        user.lastHistogramQuoteId +
        " | CAT M " +
        user.category +
        " A " +
        user.categoryAuto
    )
  );
}

function printHashtagObj(title, hashtag) {
  console.log(
    chalkLog(
      title +
        " | CR: " +
        getTimeStamp(hashtag.createdAt) +
        " | LS: " +
        getTimeStamp(hashtag.lastSeen) +
        " | CAT: " +
        formatCategory(hashtag.category) +
        " | R: " +
        hashtag.rate.toFixed(2) +
        " | Ms: " +
        hashtag.mentions +
        " | #" +
        hashtag.nodeId
    )
  );
}

let tweetUpdateQueueInterval;
let tweetUpdateQueueReady = false;
const tweetUpdateQueue = [];

function getNumKeys(obj) {
  if (!obj || obj === undefined || typeof obj !== "object" || obj === null) {
    return 0;
  }
  return Object.keys(obj).length;
}

// const update = { $inc: {mentions: 1} };
// const options = { new: true, upsert: true };

async function tweetUpdateDb(params) {
  try {
    statsObj.status = "TWEET UPDATE DB";

    const user = await global.wordAssoDb.User.findOne({
      nodeId: params.tweetObj.user.nodeId,
    });

    if (!user) {
      // console.log(chalkLog("DBU | --- USER DB MISS: @" + params.tweetObj.user.screenName));
      return;
    }

    if (
      user.tweets &&
      user.tweets.tweetIds &&
      user.tweets.tweetIds.includes(params.tweetObj.tweetId)
    ) {
      console.log(
        chalkAlert(
          "DBU | ??? TWEET ALREADY RCVD" +
            " | TW: " +
            params.tweetObj.tweetId +
            " | TW MAX ID: " +
            user.tweets.maxId +
            " | TW SINCE ID: " +
            user.tweets.maxId +
            " | @" +
            user.screenName
        )
      );
      return;
    }

    const newTweetHistograms = tcUtils.processTweetObj({
      tweetObj: params.tweetObj,
    });

    let tweetHistogramMerged = {};

    if (
      !user.tweetHistograms ||
      user.tweetHistograms === undefined ||
      user.tweetHistograms === null
    ) {
      console.log(
        chalkLog(
          "DBU | USER TWEET HISTOGRAMS UNDEFINED" +
            " | " +
            user.nodeId +
            " | @" +
            user.screenName
        )
      );
      user.tweetHistograms = {};
    }

    if (
      !user.profileHistograms ||
      user.profileHistograms === undefined ||
      user.profileHistograms === null
    ) {
      console.log(
        chalkLog(
          "DBU | USER PROFILE HISTOGRAMS UNDEFINED" +
            " | " +
            user.nodeId +
            " | @" +
            user.screenName
        )
      );
      user.profileHistograms = {};
    }

    tweetHistogramMerged = merge(newTweetHistograms, user.tweetHistograms);

    user.tweetHistograms = tweetHistogramMerged;
    user.lastHistogramTweetId = user.statusId;
    user.lastHistogramQuoteId = user.quotedStatusId;

    user.tweets.tweetIds = _.union(user.tweets.tweetIds, [
      params.tweetObj.tweetId,
    ]);

    if (configuration.verbose) {
      printUserObj("DBU | +++ USR DB HIT", user);
    }

    user.ageDays = moment().diff(user.createdAt) / ONE_DAY;
    user.tweetsPerDay = user.statusesCount / user.ageDays;

    user.markModified("tweets");
    user.markModified("tweetHistograms");
    user.markModified("profileHistograms");
    user.markModified("lastHistogramTweetId");
    user.markModified("lastHistogramQuoteId");

    await user.save();

    for (const ht of params.tweetObj.hashtags) {
      const hashtag = await global.wordAssoDb.Hashtag.findOne({ nodeId: ht });

      if (hashtag) {
        hashtag.mentions += 1;
        hashtag.lastSeen = Date.now();
        await hashtag.save();
        // printHashtagObj("DBU | +++ HT DB HIT", hashtag);
      } else {
        // console.log("DBU | --- HT DB MISS | " + ht);
        const newHashtag = new global.wordAssoDb.Hashtag({
          nodeId: ht,
          mentions: 1,
        });
        await newHashtag.save();
        // printHashtagObj("DBU | ==> HT DB NEW", newHashtag);
      }
    }

    return;
  } catch (err) {
    console.log(chalkError("DBU | *** ERROR tweetUpdateDb | " + err));
    throw err;
  }
}

function initUserUpdateQueueInterval(interval) {
  return new Promise(function (resolve, reject) {
    try {
      clearInterval(tweetUpdateQueueInterval);

      tweetUpdateQueueReady = true;

      tweetUpdateQueueInterval = setInterval(async function () {
        if (tweetUpdateQueueReady && tweetUpdateQueue.length > 0) {
          tweetUpdateQueueReady = false;

          try {
            const twObj = tweetUpdateQueue.shift();
            await tweetUpdateDb({ tweetObj: twObj });
            tweetUpdateQueueReady = true;
          } catch (e) {
            console.log(chalkError("DBU | *** TWEET UPDATE DB ERROR: " + e));
            tweetUpdateQueueReady = true;
          }
        }
      }, interval);

      resolve();
    } catch (err) {
      console.log(
        chalkError("DBU | *** INIT TWEET UPDATE QUEUE INTERVAL ERROR: ", err)
      );
      reject(err);
    }
  });
}

process.on("message", async function (m) {
  switch (m.op) {
    case "INIT":
      process.title = m.title;

      configuration.verbose = m.verbose || DEFAULT_VERBOSE;
      configuration.testMode = m.testMode || DEFAULT_TEST_MODE;
      configuration.tweetUpdateQueueInterval =
        m.interval || DEFAULT_USER_UPDATE_QUEUE_INTERVAL;

      await initUserUpdateQueueInterval(configuration.tweetUpdateQueueInterval);

      console.log(
        chalkInfo("DBU | ==== INIT =====" + " | TITLE: " + process.title)
      );

      break;

    case "TWEET":
      if (tweetUpdateQueue.length < configuration.maxUserUpdateQueue) {
        tweetUpdateQueue.push(m.tweetObj);
      }

      if (configuration.verbose) {
        console.log(
          chalkLog(
            "DBU | [" +
              tweetUpdateQueue.length +
              "]" +
              " | TW " +
              m.tweetObj.tweetId +
              " | @" +
              m.tweetObj.user.screenName
          )
        );
      }

      statsObj.tweetUpdateQueue = tweetUpdateQueue.length;

      break;

    case "PING":
      setTimeout(function () {
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
      break;

    default:
      console.log(chalkError("DBU | *** DBU UNKNOWN OP" + " | OP: " + m.op));
  }
});

setTimeout(async function () {
  try {
    await initialize();

    console.log(chalkLog("DBU | " + configuration.processName + " STARTED"));

    global.dbConnection = await mgUtils.connectDb();

    process.send({ op: "READY" });
  } catch (err) {
    console.log(chalkError("DBU | *** DBU INITIALIZE ERROR: " + err));
    quit(err);
  }
}, 5 * ONE_SECOND);
