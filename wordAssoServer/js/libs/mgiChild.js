const MODULE_ID_PREFIX = "MGI";

const compactDateTimeFormat = "YYYYMMDD HHmmss";

const os = require("os");

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const chalkLog = chalk.gray;

let hostname = os.hostname();
hostname = hostname.replace(/.local/g, "");
hostname = hostname.replace(/.home/g, "");
hostname = hostname.replace(/.at.net/g, "");
hostname = hostname.replace(/.fios-router/g, "");
hostname = hostname.replace(/.fios-router.home/g, "");
hostname = hostname.replace(/word0-instance-1/g, "google");
hostname = hostname.replace(/word-1/g, "google");
hostname = hostname.replace(/word/g, "google");

const MODULE_ID = MODULE_ID_PREFIX + "_" + hostname.toUpperCase();
const moment = require("moment");

process.on("SIGHUP", function () {
  quit("SIGHUP");
});

process.on("SIGINT", function () {
  quit("SIGINT");
});

process.on("disconnect", function () {
  quit("DISCONNECT");
});

// let configuration = {};
// configuration.testMode = false; // per tweet test mode

console.log(
  "\n\nMGI | ====================================================================================================\n" +
    process.argv[1] +
    "\nMGI | PROCESS ID:    " +
    process.pid +
    "\nMGI | PROCESS TITLE: " +
    process.title +
    "\nMGI | " +
    "====================================================================================================\n"
);

const statsObj = {};

statsObj.hostname = hostname;
statsObj.pid = process.pid;
statsObj.heap = process.memoryUsage().heapUsed / (1024 * 1024);
statsObj.maxHeap = process.memoryUsage().heapUsed / (1024 * 1024);
statsObj.startTime = moment().valueOf();
statsObj.elapsed = moment().valueOf() - statsObj.startTime;

// ==================================================================
// DROPBOX
// ==================================================================

function quit(message) {
  let msg = "";
  let exitCode = 0;

  if (message) {
    msg = message;
    exitCode = 1;
  }

  console.log(
    MODULE_ID +
      " | " +
      process.argv[1] +
      " | " +
      moment().format(compactDateTimeFormat) +
      " | MGI CHILD: **** QUITTING" +
      " | CAUSE: " +
      msg +
      " | PID: " +
      process.pid
  );

  // if (dbConnection !== undefined) {

  //   dbConnection.close(function () {
  //     console.log(chalkAlert(
  //           MODULE_ID + " | =========================="
  //       + "\nMGI | MONGO DB CONNECTION CLOSED"
  //       + "\nMGI | =========================="
  //     ));

  //     process.exit(exitCode);
  //   });
  // }
  // else {
  process.exit(exitCode);
  // }
}

process.on("message", async function (m) {
  console.log(chalkLog(MODULE_ID + " | RX MESSAGE" + " | OP: " + m.op));

  switch (m.op) {
    case "QUIT":
      console.log(chalkAlert(MODULE_ID + " | QUIT"));
      quit("PARENT QUIT");
      break;

    default:
      console.log(
        chalkError(MODULE_ID + " | *** MGI UNKNOWN OP" + " | INTERVAL: " + m.op)
      );
  }
});

process.on("unhandledRejection", function (err, promise) {
  console.trace(
    MODULE_ID + " | *** Unhandled rejection (promise: ",
    promise,
    ", reason: ",
    err,
    ")."
  );
  quit("unhandledRejection");
  // process.exit(1);
});

global.wordAssoDb = require("@threeceelabs/mongoose-twitter");

const mguAppName = MODULE_ID_PREFIX + "_MGU";
const MongooseUtilities = require("@threeceelabs/mongoose-utilities");
const mgUtils = new MongooseUtilities(mguAppName);

mgUtils.on("ready", async () => {
  console.log(`${MODULE_ID_PREFIX} | +++ MONGOOSE UTILS READY: ${mguAppName}`);
  statsObj.status = "MONGO CONNECTED";
  statsObj.dbConnectionReady = true;
});

setTimeout(async function () {
  try {
    global.dbConnection = await mgUtils.connectDb();

    const usersCollection = global.dbConnection.collection("users");

    const currentUserIndexes = await usersCollection.getIndexes();

    console.log(chalkLog(`${MODULE_ID_PREFIX} | CURRENT USER INDEXES`));
    console.log({ currentUserIndexes });

    const defaultUserIndexes = [
      { nodeId: 1 },
      { screenName: 1 },
      { category: 1 },
      { categoryAuto: 1 },
      { categoryMismatch: 1 },
      { categoryVerified: 1 },
      { friends: 1 },
      { followersCount: 1 },
      { following: 1 },
      { ignored: 1 },
      { isBot: 1 },
      { lang: 1 },
      { location: 1 },
      { rateMax: 1 },
      { category: 1, ignored: 1, nodeId: 1, "friends.0": 1 },
      { category: 1, ignored: 1, nodeId: 1, "tweets.tweetIds.0": 1 },
      { category: 1, ignored: 1, "friends.0": 1 },
      { category: 1, ignored: 1, "tweets.tweetIds.0": 1 },
      { category: 1, "tweets.tweetIds.0": 1 },
      { category: 1, categoryAuto: 1 },
      { category: 1, ignored: 1 },
      { categoryAuto: 1, ignored: 1 },
      { categorized: 1, "tweets.tweetIds.0": 1 },
      { categorized: 1, categorizedAuto: 1 },
      { categorized: 1, "friends.0": 1, ignored: 1 },
      { categorized: 1, ignored: 1, "tweets.tweetIds.0": 1 },
      { categorized: 1, ignored: 1 },
      { categorized: 1 },
      { categorizedAuto: 1 },
      { "categorizedBy.users.altthreecee00.category": 1 },
      { "categorizedBy.users.altthreecee00.timeStamp": 1 },
      { "categorizedBy.users.ninjathreecee.category": 1 },
      { "categorizedBy.users.ninjathreecee.timeStamp": 1 },
      { "categorizedBy.users.threecee.category": 1 },
      { "categorizedBy.users.threecee.timeStamp": 1 },
      { "categorizedBy.users.threeceeinfo.category": 1 },
      { "categorizedBy.users.threeceeinfo.timeStamp": 1 },
      { "geo.components.country": 1 },
      { "tweets.tweetIds.0": 1 },
    ];

    for (const indexObj of defaultUserIndexes) {
      console.log(
        chalk.blue(
          `${MODULE_ID_PREFIX} | ... CREATING USER INDEX: ${Object.keys(
            indexObj
          )}`
        )
      );
      try {
        await usersCollection.createIndex(indexObj, { background: true });
        console.log(
          chalk.green(
            `${MODULE_ID_PREFIX} | +++ CREATED USER INDEX: ${Object.keys(
              indexObj
            )}`
          )
        );
      } catch (e) {
        if (e.code === 85) {
          console.log(
            chalk.yellow(
              `${MODULE_ID_PREFIX} | !!! CREATING USER INDEX: ${Object.keys(
                indexObj
              )} EXISTS | SKIPPING ...`
            )
          );
        } else {
          console.log(
            chalkAlert(
              `${MODULE_ID_PREFIX} | !!! CREATING USER INDEX ERROR: ${Object.keys(
                indexObj
              )} | ERR: ${e}`
            )
          );
          console.log(e);
        }
      }
    }

    process.send({ op: "DONE" });
  } catch (err) {
    console.log(
      chalkError(MODULE_ID + " | *** ERROR: " + err + " | QUITTING ***")
    );
    quit("INITIALIZE ERROR");
  }
}, 1000);
