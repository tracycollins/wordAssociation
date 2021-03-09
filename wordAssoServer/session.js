/* global config,d3,HashMap,store,moment,io,ViewForceLinks,React,ReactDOM,InfoOverlay,ControlOverlay */
const testMode = false;

const testNode = {
  ageDays: 4667.932989085648,
  bannerImageAnalyzed:
    "https://pbs.twimg.com/profile_banners/14607119/1559109295",
  bannerImageUrl: "https://pbs.twimg.com/profile_banners/14607119/1559109295",
  categorizeNetwork: "nn_20210205_140625_mms2_4",
  categorized: true,
  categorizedAuto: true,
  category: "left",
  categoryAuto: "right",
  categoryMismatch: false,
  categoryVerified: false,
  countHistory: [],
  createdAt: "2008-04-30T22:42:14.000Z",
  derived: false,
  description: "so much to learn, so little time",
  expandedUrl: "",
  followersCount: 341,
  following: true,
  friends: [],
  friendsCount: 551,
  geo: {},
  geoEnabled: true,
  geoValid: false,
  ignored: false,
  isBot: false,
  isTopTerm: false,
  isTweetSource: false,
  isTweeter: true,
  isTwitterUser: true,
  lang: null,
  languageAnalysis: {},
  languageAnalyzed: false,
  lastHistogramQuoteId: "",
  lastHistogramTweetId: "1347310377214894081",
  lastSeen: "2021-01-21T04:11:04.000Z",
  lastTweetId: "false",
  location: "Brooklyn, New York",
  mentions: 1247,
  name: "Tracy Collins",
  nodeId: "14607119",
  nodeType: "user",
  oauthID: 0,
  previousBannerImageUrl:
    "https://pbs.twimg.com/profile_banners/14607119/1559109295",
  previousDescription: "so much to learn, so little time",
  previousExpandedUrl: "",
  previousLocation: "Brooklyn, New York",
  previousName: "Tracy Collins",
  previousProfileImageUrl:
    "https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",
  previousProfileUrl: "https://twitter.com/threecee",
  previousQuotedStatusId: "",
  previousScreenName: "threecee",
  previousStatusId: "1352106411338170370",
  previousUrl: "http://threeceemedia.com",
  profileImageAnalyzed:
    "https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",
  profileImageUrl:
    "https://pbs.twimg.com/profile_images/1205585278565527559/GrTkBpzl.jpg",
  profileUrl: "https://twitter.com/threecee",
  quotedStatus: {},
  quotedStatusId: "",
  rate: 247,
  rateMax: 0,
  rateMaxTime: "2020-05-15T17:04:05.682Z",
  screenName: "threecee",
  screenNameLower: "threecee",
  status: {
    created_at: "Thu Jan 21 04:11:04 +0000 2021",
    id: 1352106411338170400,
    id_str: "1352106411338170370",
    text: "RT @CathyYan: Omg. https://t.co/kyf9holXKw",
    truncated: false,
  },
  statusId: "1352106411338170370",
  statusesCount: 4351,
  threeceeFollowing: "altthreecee00",
  tweetsPerDay: 0.932104211901352,
  url: "http://threeceemedia.com",
  userId: "14607119",
  verified: false,
  __v: 2,
  _id: "5f7e04b7777e5a535cba941f",
};

const reactElement = React.createElement;

const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";
// const LOCAL_NPX_SOURCE = "http://localhost:5000";
// const MBP3_SOURCE = "http://mbp3:3000";

const DEFAULT_SOURCE = PRODUCTION_SOURCE;
// const DEFAULT_SOURCE = REPLACE_SOURCE;
// const DEFAULT_SOURCE = LOCAL_NPX_SOURCE;

console.debug(`PRODUCTION_SOURCE: ${PRODUCTION_SOURCE}`);
console.debug(`LOCAL_SOURCE: ${LOCAL_SOURCE}`);
console.debug(`DEFAULT_SOURCE: ${DEFAULT_SOURCE}`);

const STORED_CONFIG_VERSION = "2.2.9";
const STORED_CONFIG_NAME = `stored_config${"_" + STORED_CONFIG_VERSION}`;
const globalStoredSettingsName = STORED_CONFIG_NAME;

let currentConfig = {};
currentConfig = Object.assign({}, config);

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

const DEFAULT_RX_NODE_QUEUE_MAX = 200;
const DEFAULT_RX_NODE_QUEUE_INTERVAL = 5;

const DEFAULT_MAX_READY_ACK_WAIT_COUNT = 10;
const DEFAULT_KEEPALIVE_INTERVAL = 60000;

let currentSessionView;
let rxNodeQueueReady = false;
const rxNodeQueue = [];

let customizePanelFlag = false;
let infoOverlayFlag = false;

const status = {};

status.serverConnected = false;
status.viewerReadyTransmitted = false;
status.viewerReadyAck = false;
status.isAuthenticated = false || LOCAL_SOURCE === DEFAULT_SOURCE;

status.memory = {};
status.memory.jsHeapSizeLimit = 0;
status.memory.totalJSHeapSize = 0;
status.memory.usedJSHeapSize = 0;
status.memory.heapMax = 0;

status.socket = {};
status.socket.errors = 0;
status.socket.error = false;
status.socket.connected = true;
status.socket.connects = 0;
status.socket.reconnects = 0;

status.bestNetwork = {};
status.bestNetwork.networkId = "";
status.bestNetwork.successRate = 0;
status.bestNetwork.matchRate = 0;
status.bestNetwork.overallMatchRate = 0;
status.bestNetwork.inputsId = "";
status.bestNetwork.numInputs = 0;

status.maxNodes = 0;
status.maxNodeAddQ = 0;

currentConfig.settings.app_name = "Session View";
currentConfig.settings.sessionViewType = "treepack"; // options: force, histogram ??
currentConfig.settings.storedConfigName = STORED_CONFIG_NAME;
currentConfig.settings.rxNodeQueueMax = DEFAULT_RX_NODE_QUEUE_MAX;
currentConfig.settings.rxNodeQueueInterval = DEFAULT_RX_NODE_QUEUE_INTERVAL;
currentConfig.settings.keepaliveInterval = DEFAULT_KEEPALIVE_INTERVAL;
currentConfig.settings.viewerReadyInterval = 10000;

const palette = {
  black: "#000000",
  white: "#FFFFFF",
  lightgray: "#819090",
  gray: "#708284",
  mediumgray: "#536870",
  darkgray: "#364A51",
  darkblue: "#0A2933",
  darkerblue: "#042029",
  paleryellow: "#FCF4DC",
  paleyellow: "#EAE3CB",
  yellow: "#A57706",
  orange: "#BD3613",
  red: "#D11C24",
  pink: "#C61C6F",
  purple: "#595AB7",
  blue: "#2176C7",
  green: "#25C286",
  lightgreen: "#35F096",
  yellowgreen: "#738A05",
};

const categoryColorHashMap = new HashMap();

categoryColorHashMap.set("positive", palette.green);
categoryColorHashMap.set("negative", palette.red);
categoryColorHashMap.set("neutral", palette.darkgray);
categoryColorHashMap.set("left", palette.blue);
categoryColorHashMap.set("right", palette.yellow);
categoryColorHashMap.set("none", palette.black);
categoryColorHashMap.set("auto", palette.white);

function jsonPrint(obj) {
  if (obj || obj === 0) {
    return JSON.stringify(obj, null, 2);
  } else {
    return "UNDEFINED";
  }
}

const randomIntFromInterval = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const VIEWER_ID = "viewer_" + randomIntFromInterval(1000000000, 9999999999);

const DEFAULT_VIEWER_OBJ = {
  nodeId: VIEWER_ID,
  userId: VIEWER_ID,
  viewerId: VIEWER_ID,
  screenName: VIEWER_ID,
  type: "viewer",
  namespace: "view",
  timeStamp: Date.now(),
  tags: {
    entity: VIEWER_ID,
    type: "viewer",
    mode: "stream",
  },
};

const viewerObj = DEFAULT_VIEWER_OBJ;

let currentDate;
let currentTime;

const optionsTimeStamp = {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
};

function getTimeStamp(inputTime) {
  if (inputTime === undefined) {
    currentDate = new Date().toDateString("en-US", optionsTimeStamp);
    currentTime = new Date().toTimeString("en-US", optionsTimeStamp);
  } else {
    currentDate = new Date(inputTime).toDateString("en-US", optionsTimeStamp);
    currentTime = new Date(inputTime).toTimeString("en-US", optionsTimeStamp);
  }
  return currentDate + " - " + currentTime;
}

let configUpdateTimeOut;
const configUpdateTimeOutInverval = 3000;

const resetConfigUpdateTimeOut = () => {
  clearTimeout(configUpdateTimeOut);

  configUpdateTimeOut = setTimeout(function () {
    console.debug("STORE CONFIG");
    saveConfig();
    return;
  }, configUpdateTimeOutInverval);
};

const saveConfig = () => {
  currentConfig.defaults.storedConfigName = globalStoredSettingsName;
  store.set(currentConfig.defaults.storedConfigName, currentConfig);
  console.debug(
    "STORED CONFIG" + " | " + currentConfig.defaults.storedConfigName
  );
  return;
};

const infoDivElement = document.getElementById("infoDiv");
const controlDivElement = document.getElementById("controlDiv");
controlDivElement.style.display = "unset";

let customizerWindow = null;

const customizerComm = (event) => {
  console.debug("CUSTOMIZE PANEL: " + event.origin);

  if (event.data === "DisableHTML5Autoplay_Initialize") {
    console.info(
      "RX> CUSTOMIZE PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ..."
    );
    return;
  }

  switch (event.data.op) {
    case "READY":
      console.warn("R< CUSTOMIZE PANEL READY");
      break;

    case "CLOSE":
      console.warn("R< CUSTOMIZE PANEL CLOSING...");
      resetConfigUpdateTimeOut();
      break;

    case "TOGGLE":
      console.warn("R< CUSTOMIZE PANEL TOGGLE");

      switch (event.data.id) {
        case "fullscreenToggleButton":
          toggleFullScreen();
          break;

        default:
          console.error(
            "CUSTOMIZE PANEL UNKNOWN TOGGLE BUTTON | ID: " + event.data.id
          );
      }

      resetConfigUpdateTimeOut();

      break;

    case "UPDATE":
      console.warn("R< CONTROL PANEL UPDATE");

      switch (event.data.id) {
        case "display":
          currentSessionView.displayEntity(event.data.entity, event.data.value);
          break;

        case "linkStrength":
          currentSessionView.setLinkStrength(event.data.value);
          break;

        case "linkDistance":
          currentSessionView.setLinkDistance(event.data.value);
          break;

        case "velocityDecay":
          currentSessionView.setVelocityDecay(event.data.value);
          break;

        case "gravity":
          currentSessionView.setGravity(event.data.value);
          break;

        case "charge":
          currentSessionView.setCharge(event.data.value);
          break;

        case "nodeMaxAge":
          currentSessionView.setNodeMaxAge(event.data.value);
          break;

        case "maxNodesLimit":
          currentSessionView.setMaxNodesLimit(event.data.value);
          break;

        case "nodeRadiusRatio":
          currentSessionView.setNodeRadiusRatioMin(event.data.min);
          currentSessionView.setNodeRadiusRatioMax(event.data.max);
          console.log(
            `CUSTOMIZER SET | setNodeRadiusRatio | min: ${event.data.min} max: ${event.data.max}`
          );
          break;

        case "fontSizeRatio":
          currentSessionView.setFontSizeRatioMin(event.data.min);
          currentSessionView.setFontSizeRatioMax(event.data.max);
          console.log(
            `CUSTOMIZER SET | setFontSizeRatio | min: ${event.data.min} max: ${event.data.max}`
          );
          break;

        default:
          console.error(
            "UNKNOWN CUSTOMIZE PANEL ID: " +
              event.data.id +
              "\n" +
              jsonPrint(event.data)
          );
      }
      resetConfigUpdateTimeOut();

      break;

    case "INIT":
      console.info("R< CUSTOMIZE PANEL LOOPBACK? | INIT ... IGNORING ...");
      break;

    default:
      if (event.data["twttr.button"] !== undefined) {
        console.log(
          "R< CUSTOMIZE PANEL TWITTER" +
            " | " +
            event.data["twttr.button"].method
        );
      } else if (event.data.settings !== undefined) {
        console.log(
          "R< CUSTOMIZE PANEL SETTINGS" + "\n" + jsonPrint(event.data.settings)
        );
      } else {
        console.warn(
          "R< ??? CUSTOMIZE PANEL OP UNDEFINED\n" + jsonPrint(event.data)
        );
      }
  }
};

const openCustomizer = (cnf) => {
  console.debug("openCustomizer");
  console.debug({ cnf });

  const customizerWindowFeatures =
    "width=1000,height=600,resizable,scrollbars,status";

  if (customizerWindow === null || customizerWindow.closed) {
    customizerWindow = window.open(
      DEFAULT_SOURCE + "/customize",
      "CUSTOMIZE",
      customizerWindowFeatures
    );
  } else {
    customizerWindow.focus();
  }

  window.addEventListener("message", customizerComm, false);

  customizerWindow.addEventListener(
    "beforeunload",
    function () {
      console.log("CUSTOMIZE POP UP CLOSING...");
      customizePanelFlag = false;
    },
    false
  );

  customizerWindow.addEventListener(
    "load",
    function () {
      customizePanelFlag = true;
      customizerWindow.postMessage(
        { op: "INIT", config: cnf, status: status },
        DEFAULT_SOURCE
      );
      return;
    },
    false
  );

  return;
};

function toggleFullScreen() {
  console.warn("toggleFullScreen");

  if (
    !document.fullscreenElement &&
    !document.mozFullScreenElement &&
    !document.webkitFullscreenElement &&
    !document.msFullscreenElement
  ) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(
        Element.ALLOW_KEYBOARD_INPUT
      );
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  resetConfigUpdateTimeOut();
}

const toggleCustomize = () => {
  console.warn("toggleCustomize");
  if (!customizePanelFlag) {
    customizePanelFlag = !customizePanelFlag;
    openCustomizer(currentConfig);
  } else {
    if (customizerWindow) {
      customizerWindow.close();
    }
  }
  return;
};

const toggleInfo = () => {
  console.warn("toggleInfo");
  infoOverlayFlag = !infoOverlayFlag;
  displayInfo(infoOverlayFlag);
  return;
};

const displayInfo = (isVisible) => {
  if (isVisible) {
    infoDivElement.style.display = "unset";
    ReactDOM.render(
      reactElement(InfoOverlay, { closeButtonHandler: toggleInfo }),
      infoDivElement
    );
  } else {
    infoDivElement.style.display = "none";
  }
};

const displayControl = (isVisible) => {
  if (isVisible) {
    controlDivElement.style.display = "unset";
    ReactDOM.render(
      reactElement(ControlOverlay, {
        infoButtonHandler: toggleInfo,
        settingsButtonHandler: toggleCustomize,
        fullscreenButtonHandler: toggleFullScreen,
      }),
      controlDivElement
    );
  } else {
    controlDivElement.style.display = "none";
  }
};

let viewerReadyInterval;

function initViewerReadyInterval(interval) {
  console.log("INIT VIEWER READY INTERVAL");

  clearInterval(viewerReadyInterval);

  viewerReadyInterval = setInterval(function () {
    if (
      status.serverConnected &&
      !status.viewerReadyTransmitted &&
      !status.viewerReadyAck
    ) {
      viewerObj.timeStamp = Date.now();

      console.log(
        "T> VIEWER_READY" +
          " | " +
          viewerObj.userId +
          " | CONNECTED: " +
          status.serverConnected +
          " | READY TXD: " +
          status.viewerReadyTransmitted +
          " | READY ACK RXD: " +
          status.viewerReadyAck +
          " | " +
          getTimeStamp()
      );

      status.viewerReadyTransmitted = true;

      socket.emit(
        "VIEWER_READY",
        { userId: viewerObj.userId, timeStamp: Date.now() },
        function () {
          status.viewerReadyTransmitted = true;
        }
      );

      clearInterval(viewerReadyInterval);
    } else if (
      status.serverConnected &&
      status.viewerReadyTransmitted &&
      !status.viewerReadyAck
    ) {
      if (status.userReadyAckWait > DEFAULT_MAX_READY_ACK_WAIT_COUNT) {
        status.viewerReadyTransmitted = false;
        console.log(
          `*** RESENDING _READY AFTER | ${DEFAULT_MAX_READY_ACK_WAIT_COUNT} WAIT CYCLES`
        );
      } else {
        status.userReadyAckWait += 1;
        console.log(
          `... WAITING FOR VIEWER_READY_ACK | ${DEFAULT_MAX_READY_ACK_WAIT_COUNT} WAIT CYCLES`
        );
      }
    } else if (!status.serverConnected) {
      console.log("... WAITING FOR SERVER CONNECTION ...");
    }
  }, interval);
}

function sendKeepAlive(viewerObj, callback) {
  if (status.viewerReadyAck && status.serverConnected) {
    const statusSmall = status;
    delete statusSmall.heartBeat;

    socket.emit("SESSION_KEEPALIVE", {
      user: viewerObj,
      stats: statusSmall,
      results: {},
    });

    callback(null);
  } else {
    console.error(
      "!!!! CANNOT TX KEEPALIVE" +
        " | " +
        viewerObj.userId +
        " | CONNECTED: " +
        status.serverConnected +
        " | READY TXD: " +
        status.viewerReadyTransmitted +
        " | READY ACK RXD: " +
        status.viewerReadyAck +
        " | " +
        moment().format(defaultDateTimeFormat)
    );
    callback("ERROR");
  }
}

let socketKeepaliveInterval;

function initKeepalive(viewerObj, interval) {
  clearInterval(socketKeepaliveInterval);

  console.log(
    "START KEEPALIVE | READY ACK: " +
      status.viewerReadyAck +
      " | SERVER CONNECTED: " +
      status.serverConnected +
      " | INTERVAL: " +
      interval +
      " ms"
  );

  sendKeepAlive(viewerObj, function (err) {
    if (err) {
      console.error("KEEPALIVE ERROR: " + err);
    }
  });

  socketKeepaliveInterval = setInterval(function () {
    status.elapsed = Date.now() - status.startTime;
    viewerObj.stats = status;

    sendKeepAlive(viewerObj, function (err) {
      if (err) {
        console.error("KEEPALIVE ERROR: " + err);
      }
    });
  }, interval);
}

let socket;

const rxNode = function (node) {
  if (rxNodeQueue.length >= currentConfig.settings.rxNodeQueueMax) {
    return;
  }

  if (
    node.nodeType !== "tweet" &&
    node.nodeType !== "user" &&
    node.nodeType !== "hashtag"
  ) {
    return;
  }

  rxNodeQueue.push(node);
};

function initSocketHandler() {
  socket.on("connect", function () {
    viewerObj.socketId = socket.id;

    status.socketId = socket.id;
    status.serverConnected = true;
    status.socket.connected = true;

    if (currentSessionView !== undefined) {
      currentSessionView.setEnableAgeNodes(true);
    }
    console.log("CONNECTED TO HOST | SOCKET ID: " + socket.id);

    status.socket.connects += 1;

    viewerObj.timeStamp = Date.now();

    socket.emit("authentication", {
      namespace: "view",
      userId: viewerObj.userId,
      password: "0123456789",
    });
  });

  socket.on("SERVER_READY", function (serverAck) {
    status.serverConnected = true;
    status.socket.connected = true;
    console.log("RX SERVER_READY | SERVER ACK: " + jsonPrint(serverAck));
  });

  socket.on("VIEWER_READY_ACK", function (vSesKey) {
    status.serverConnected = true;
    status.socket.connected = true;
    status.viewerReadyAck = true;

    console.log("RX VIEWER_READY_ACK | SESSION KEY: " + vSesKey);

    status.viewerSessionKey = vSesKey;
    viewerObj.viewerSessionKey = vSesKey;

    if (currentConfig.settings.VIEWER_OBJ === undefined) {
      currentConfig.settings.VIEWER_OBJ = {};
    }

    currentConfig.settings.VIEWER_OBJ = viewerObj;

    console.debug("STORE CONFIG ON VIEWER_READY_ACK");
    saveConfig();

    initKeepalive(viewerObj, currentConfig.settings.keepaliveInterval);
  });

  socket.on("USER_AUTHENTICATED", function (userObj) {
    status.isAuthenticated = true;
    status.socket.connected = true;
    console.log("RX USER_AUTHENTICATED | USER: @" + userObj.screenName);
  });

  socket.on("reconnect", function () {
    viewerObj.socketId = socket.id;

    status.serverConnected = true;
    console.log("RECONNECTED TO HOST | SOCKET ID: " + socket.id);

    status.socket.reconnects += 1;
    status.socket.connected = true;

    viewerObj.timeStamp = Date.now();

    socket.emit("VIEWER_READY", viewerObj, function () {
      status.viewerReadyTransmitted = true;
      socket.emit("authentication", {
        namespace: "view",
        userId: viewerObj.userId,
        password: "0123456789",
      });
    });
  });

  socket.on("disconnect", function () {
    status.serverConnected = false;
    status.socket.connected = false;
    console.log("*** DISCONNECTED FROM HOST ... DELETING ALL SESSIONS ...");
  });

  let socketErrorTimeout;

  socket.on("error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;

    console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET ERROR\n" + error);

    // if (currentSessionView !== undefined) {
    //   currentSessionView.resize();
    // }

    socket.disconnect(true); // full disconnect, not just namespace

    clearTimeout(socketErrorTimeout);

    socketErrorTimeout = setTimeout(function () {
      socket.connect();
    }, 5000);
  });

  socket.on("connect_error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;
    console.log("*** SOCKET CONNECT ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET CONNECT ERROR\n" + error);
  });

  socket.on("reconnect_error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;
    console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET RECONNECT ERROR\n" + error);
  });

  socket.on("unauthorized", function (err) {
    status.serverConnected = true;
    console.error(
      "*** UNAUTHORIZED *** | ID: " +
        socket.id +
        " | VIEWER ID: " +
        viewerObj.userId +
        " | " +
        err.message
    );
  });

  socket.on("authenticated", function () {
    console.debug("AUTHENTICATED | " + socket.id);
    status.socketId = socket.id;
    status.serverConnected = true;
    status.userReadyTransmitted = false;
    status.userReadyAck = false;
    console.log("CONNECTED TO HOST | ID: " + socket.id);
    initViewerReadyInterval(currentConfig.settings.viewerReadyInterval);
  });

  const sSmall = {};
  sSmall.bestNetwork = {};

  socket.on("action", (action) => {
    switch (action.type) {
      case "heartbeat":
        status.serverConnected = true;
        status.socket.connected = true;
        status.memory.jsHeapSizeLimit =
          window.performance.memory.jsHeapSizeLimit;
        status.memory.totalJSHeapSize =
          window.performance.memory.totalJSHeapSize;
        status.memory.usedJSHeapSize = window.performance.memory.usedJSHeapSize;

        status.memory.heapMax = Math.max(
          status.memory.heapMax,
          window.performance.memory.usedJSHeapSize
        );

        // console.log(`<R HB | ${action.data.timeStamp}`);

        if (customizerWindow) {
          const hbStats = Object.assign({}, status, action.data);

          // memory: MemoryInfo jsHeapSizeLimit: 2172649472 totalJSHeapSize: 19348658
          // usedJSHeapSize: 18244770
          customizerWindow.postMessage(
            { op: "HEARTBEAT", status: hbStats },
            DEFAULT_SOURCE
          );
        }

        if (testMode && currentSessionView) {
          currentSessionView.addNode(testNode);
        }

        break;

      default:
    }
  });

  socket.on("node", rxNode);

  return;
}

let socketSessionUpdateInterval;

function initSocketSessionUpdateRx() {
  rxNodeQueueReady = true;

  let newNode = {};
  let category;
  // let viewNodeAddQlength = 0;

  clearInterval(socketSessionUpdateInterval);

  socketSessionUpdateInterval = setInterval(function () {
    // viewNodeAddQlength = currentSessionView.getNodeAddQlength();

    // if (rxNodeQueueReady && rxNodeQueue.length > 0 && viewNodeAddQlength <= 1.5 * currentConfig.settings.rxNodeQueueMax) {
    if (rxNodeQueueReady && rxNodeQueue.length > 0) {
      rxNodeQueueReady = false;

      newNode = rxNodeQueue.shift();

      if (currentConfig.autoCategoryFlag && newNode.categoryAuto) {
        category = newNode.categoryAuto;
      } else {
        category = newNode.category;
      }

      if (
        newNode.categoryAuto !== "none" &&
        (category === undefined || category === "none")
      ) {
        newNode.categoryColor = categoryColorHashMap.get("auto");
      } else if (category === undefined || category === "none") {
        newNode.categoryColor = categoryColorHashMap.get("none");
      } else {
        newNode.categoryColor = categoryColorHashMap.get(category);
      }

      newNode.age = 1e-6;
      newNode.ageMaxRatio = 1e-6;
      newNode.mouseHoverFlag = false;
      newNode.isDead = false;
      newNode.r = 0;
      newNode.following = newNode.following ? newNode.following : false;
      newNode.mentions = newNode.mentions ? newNode.mentions : 1;

      if (newNode.nodeType === "user") {
        newNode.text = newNode.screenName.toLowerCase();
        newNode.screenName = newNode.screenName.toLowerCase();
      }

      newNode.categoryMismatch =
        newNode.category !== "none" &&
        newNode.category &&
        newNode.categoryAuto &&
        newNode.category !== newNode.categoryAuto;
      newNode.categoryMatch =
        newNode.category !== "none" &&
        newNode.category &&
        newNode.categoryAuto &&
        newNode.category === newNode.categoryAuto;

      currentSessionView.addNode(newNode);
      rxNodeQueueReady = true;
    }
  }, currentConfig.settings.rxNodeQueueInterval);

  return;
}

function getBrowserPrefix() {
  // Check for the unprefixed property.
  // if ("hidden" in document) {
  if (document.hidden !== undefined) {
    return null;
  }
  // All the possible prefixes.
  const browserPrefixes = ["moz", "ms", "o", "webkit"];
  let prefix;

  browserPrefixes.forEach(function (p) {
    prefix = p + "Hidden";
    if (document[prefix] !== undefined) {
      return p;
    }
  });

  // The API is not supported in browser.
  return null;
}

function hiddenProperty(prefix) {
  if (prefix) {
    return prefix + "Hidden";
  } else {
    return "hidden";
  }
}

function getVisibilityEvent(prefix) {
  if (prefix) {
    return prefix + "visibilitychange";
  } else {
    return "visibilitychange";
  }
}

const prefix = getBrowserPrefix();
const hidden = hiddenProperty(prefix);
const visibilityEvent = getVisibilityEvent(prefix);
let windowVisible = true;

const mouseMoveTimeoutEventObj = new CustomEvent("mouseMoveTimeoutEvent");
let mouseMoveTimeout;
// let mouseMovingFlag = false;
const mouseMoveTimeoutInterval = 2000;

function resetMouseMoveTimer() {
  clearTimeout(mouseMoveTimeout);

  mouseMoveTimeout = setTimeout(function () {
    displayControl(false);

    d3.select("body").style("cursor", "none");

    currentSessionView.toolTipVisibility(false);
    currentSessionView.mouseMoving(false);

    if (
      currentConfig.settings.pauseOnMouseMove &&
      !currentConfig.settings.pauseFlag
    ) {
      currentSessionView.simulationControl("RESUME");
    }

    document.dispatchEvent(mouseMoveTimeoutEventObj);
  }, mouseMoveTimeoutInterval);
}

document.addEventListener(visibilityEvent, function () {
  if (!document[hidden]) {
    windowVisible = true;
    resetMouseMoveTimer();
    if (currentSessionView !== undefined) {
      currentSessionView.setPause(false);
    }
    console.info("visibilityEvent: " + windowVisible);
  } else {
    windowVisible = false;
    if (currentSessionView !== undefined) {
      currentSessionView.setPause(true);
    }
    console.info("visibilityEvent: " + windowVisible);
  }
});

document.addEventListener(
  "mousemove",
  function () {
    if (currentSessionView) {
      if (currentConfig.settings.pauseOnMouseMove) {
        currentSessionView.simulationControl("PAUSE");
      }
      // mouseMovingFlag = true;
      currentSessionView.mouseMoving(true);
      displayControl(true);
      resetMouseMoveTimer();
    }
  },
  true
);

document.addEventListener(
  "panzoomEvent",
  function () {
    if (currentSessionView) {
      currentConfig.settings.panzoom.transform = currentSessionView.getPanzoomTransform();
      saveConfig();
    }
  },
  true
);

const loadStoredSettings = () => {
  console.log("LOADING STORED SETTINGS: " + globalStoredSettingsName);
  return store.get(globalStoredSettingsName);
};

function getWindowDimensions() {
  if (window.outerWidth !== "undefined") {
    return { width: window.outerWidth, height: window.outerHeight };
  }
  if (window.innerWidth !== "undefined") {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)

  if (
    document.documentElement !== "undefined" &&
    document.documentElement.clientWidth !== "undefined" &&
    document.documentElement.clientWidth !== 0
  ) {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
  }
  // older versions of IE
  return {
    width: document.getElementsByTagName("body")[0].clientWidth,
    height: document.getElementsByTagName("body")[0].clientHeight,
  };
}

let width = getWindowDimensions().width;
let height = getWindowDimensions().height;

window.addEventListener(
  "beforeunload",
  function () {
    console.log("CLOSING...");
    if (customizerWindow) {
      customizerWindow.close();
    }
    customizePanelFlag = false;
  },
  false
);

window.addEventListener(
  "load",
  function () {
    console.log("LOAD SESSION");

    width = getWindowDimensions().width;
    height = getWindowDimensions().height;

    currentConfig.settings.panzoom.transform.x = 0.5 * width;
    currentConfig.defaults.panzoom.transform.x = 0.5 * width;
    currentConfig.settings.panzoom.transform.y = 0.5 * height;
    currentConfig.defaults.panzoom.transform.y = 0.5 * height;
  },

  false
);

const nodeSearch = (event) => {
  // { detail: { node: d }}

  console.log(
    `EVENT | NODE SEARCH | TYPE: ${event.detail.node.nodeType} | @${event.detail.node.screenName}`
  );

  let searchNode;

  switch (event.detail.node.nodeType) {
    case "user":
      searchNode = "@" + event.detail.node.screenName;
      break;
    case "hashtag":
      searchNode = "#" + event.detail.node.nodeId;
      break;
    default:
      console.error(
        `EVENT | NODE SEARCH | UNKNOWN TYPE: ${event.detail.node.nodeType}`
      );
      return;
  }

  socket.emit("TWITTER_SEARCH_NODE", { searchNode: searchNode });
};

document.addEventListener("nodeSearch", nodeSearch, false);

let testModeAddNodeInterval;

setTimeout(function () {
  try {
    const storedSettings = loadStoredSettings();

    if (storedSettings) {
      console.log(`LOADED STORED SETTINGS`);
      console.log({ storedSettings });
      currentConfig = Object.assign({}, currentConfig, storedSettings);
    } else {
      console.log(
        `*** LOAD STORED SETTINGS FAILED: ${globalStoredSettingsName}`
      );
      currentConfig = Object.assign({}, currentConfig, config);
    }

    socket = io("/view");

    // addCustomizeButton();
    // addFullscreenButton();
    // addInfoButton();

    console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

    viewerObj.timeStamp = Date.now();

    socket.emit("VIEWER_READY", viewerObj, function () {
      status.viewerReadyTransmitted = true;
    });

    currentSessionView = ViewForceLinks(currentConfig);
    currentSessionView.initD3timer();
    initSocketHandler();
    resetMouseMoveTimer();
    initSocketSessionUpdateRx();

    if (testMode && currentSessionView) {
      testModeAddNodeInterval = setInterval(() => {
        currentSessionView.addNode(testNode);
      }, 1047);
    }
  } catch (err) {
    clearInterval(testModeAddNodeInterval);
    console.error({ err });
  }
}, 100);
