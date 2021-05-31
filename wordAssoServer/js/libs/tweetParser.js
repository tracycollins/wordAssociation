const PF = "TWP";

process.title = "wa_node_child_twp";

const MAX_Q = 500;
const compactDateTimeFormat = "YYYYMMDD HHmmss";

import moment from "moment";

import chalk from "chalk";
const chalkLog = chalk.gray;
const chalkInfo = chalk.black;
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;

const statsObj = {};

import mgt from "@threeceelabs/mongoose-twitter";
global.wordAssoDb = mgt;

const tcuAppName = PF + "_TCU";
import { ThreeceeUtilities } from "@threeceelabs/threeceeutilities";
const tcUtils = new ThreeceeUtilities(tcuAppName);

tcUtils.on("error", function (err) {
  console.log(
    `${PF} | *** THREECEE UTILS ERROR | ${tcuAppName} | ERROR: ${err}`
  );
});

tcUtils.on("ready", function () {
  console.log(`${PF} | +++ THREECEE UTILS READY: ${tcuAppName}`);
});

const tscAppName = PF + "_TSC";
import { TweetServerController } from "@threeceelabs/tweet-server-controller";
const tweetServerController = new TweetServerController(tscAppName);

tweetServerController.on("error", function (err) {
  console.log(
    `${PF} | *** TWEET SERVER CONTROLLER ERROR | ${tscAppName} | ERROR: ${err}`
  );
});

tweetServerController.on("ready", function () {
  console.log(`${PF} | +++ TWEET SERVER CONTROLLER READY: ${tscAppName}`);
});

const mguAppName = PF + "_MGU";
import { MongooseUtilities } from "@threeceelabs/mongoose-utilities";
const mgUtils = new MongooseUtilities(mguAppName);

mgUtils.on("ready", async () => {
  console.log(`${PF} | +++ MONGOOSE UTILS READY: ${mguAppName}`);
});

const tweetParserQueue = [];

const configuration = {};
configuration.processName = process.env.TWP_PROCESS_NAME || "node_tweetParser";
configuration.verbose = false;
configuration.updateInterval = 5;
configuration.globalTestMode = false;
configuration.tweetVersion2 = false;
configuration.testMode = false;
configuration.inc = true;

function quit(message) {
  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.log(
    PF +
      " | " +
      process.argv[1] +
      " | " +
      moment().format(compactDateTimeFormat) +
      " | TWEET PARSER: **** QUITTING" +
      " | CAUSE: " +
      msg +
      " | PID: " +
      process.pid
  );

  if (global.dbConnection) {
    global.dbConnection.close(function () {
      console.log(
        chalkAlert(
          PF +
            " | ==========================" +
            "\nTWP | MONGO DB CONNECTION CLOSED" +
            "\nTWP | =========================="
        )
      );

      process.exit(exitCode);
    });
  } else {
    process.exit(exitCode);
  }
}

process.on("SIGHUP", function () {
  quit("SIGHUP");
});

process.on("SIGINT", function () {
  quit("SIGINT");
});

process.on("disconnect", function () {
  quit("DISCONNECT");
});

console.log(
  PF +
    "\n\n | ====================================================================================================\n" +
    process.argv[1] +
    "\n | PROCESS ID:    " +
    process.pid +
    "\n | PROCESS TITLE: " +
    process.title +
    "\n | " +
    "====================================================================================================\n"
);

let tweetParserQueueInterval;

function initTweetParserQueueInterval(cnf) {
  console.log(
    chalkInfo(
      PF +
        " | initTweetParserQueueInterval" +
        " | TWEET VERSION 2: " +
        cnf.tweetVersion2 +
        " | " +
        cnf.updateInterval +
        " MS"
    )
  );

  clearInterval(tweetParserQueueInterval);

  let tweetParserQueueReady = true;

  const params = {};
  params.tweetVersion2 = cnf.tweetVersion2;
  params.globalTestMode = cnf.globalTestMode;
  params.testMode = cnf.testMode;
  params.inc = cnf.inc;

  const tweetObjMessage = {};
  tweetObjMessage.op = "PARSED_TWEET";
  tweetObjMessage.tweetObj = {};

  tweetParserQueueInterval = setInterval(async function () {
    if (
      tweetServerController &&
      tweetParserQueue.length > 0 &&
      tweetParserQueueReady
    ) {
      tweetParserQueueReady = false;

      params.tweetStatus = tweetParserQueue.shift();

      try {
        tweetObjMessage.tweetObj =
          await tweetServerController.createStreamTweetAsync(params);
        process.send(tweetObjMessage);
        tweetParserQueueReady = true;
      } catch (err) {
        console.log(
          chalkError(
            PF + " | *** CREATE STREAM TWEET ERROR: " + tcUtils.getTimeStamp()
          )
        );
        console.log(chalkError(PF + " | *** CREATE STREAM TWEET ERROR: ", err));

        process.send({ op: "ERROR", err: err }, function (err) {
          tweetParserQueueReady = true;

          if (err) {
            console.trace(
              chalkError(
                PF +
                  " | *** PARSER SEND ERROR ERROR" +
                  " | " +
                  moment().format(compactDateTimeFormat) +
                  " | " +
                  err
              )
            );
          }
        });
      }
    }
  }, cnf.updateInterval);
}

process.on("message", function (m) {
  switch (m.op) {
    case "VERBOSE":
      configuration.verbose = m.verbose;
      console.log(chalkInfo(PF + " | VERBOSE" + " | " + m.verbose));
      break;

    case "INIT":
      process.title = m.title;

      configuration.verbose = m.verbose;
      configuration.updateInterval = m.interval;
      configuration.tweetVersion2 = m.tweetVersion2;

      console.log(
        chalkInfo(
          PF +
            " | TWEET PARSER INIT" +
            " | TITLE: " +
            m.title +
            " | INTERVAL: " +
            m.interval +
            " | TWEET VERSION 2: " +
            m.tweetVersion2
        )
      );

      initTweetParserQueueInterval(configuration);
      break;

    case "PING":
      setTimeout(function () {
        process.send({ op: "PONG", pongId: m.pingId });
      }, 1000);
      break;

    case "tweet":
      if (tweetParserQueue.length <= MAX_Q) {
        tweetParserQueue.push(m.tweetStatus);
      }
      break;

    default:
      console.trace(
        chalkError(
          PF + " | *** TWEET PARSER UNKNOWN OP" + " | INTERVAL: " + m.op
        )
      );
  }
});

setTimeout(async function () {
  try {
    console.log(
      PF + " | " + chalk.blue(configuration.processName + " STARTED ")
    );
    statsObj.status = "START";

    try {
      global.dbConnection = await mgUtils.connectDb();
      process.send({ op: "READY" });
    } catch (err) {
      console.log(
        chalkError(
          "TWP | *** MONGO DB CONNECT ERROR: " + err + " | QUITTING ***"
        )
      );
    }
  } catch (err) {
    console.log(chalkError(PF + " | *** INIT TIMEOUT ERROR: " + err));
    quit();
  }
}, 1000);
