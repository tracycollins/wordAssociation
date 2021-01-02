/* global d3,HashMap,store,moment,io,ViewTreepack */

const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
const LOCAL_SOURCE = "http://localhost:9997";

const DEFAULT_SOURCE = PRODUCTION_SOURCE;

console.debug(`PRODUCTION_SOURCE: ${PRODUCTION_SOURCE}`)
console.debug(`LOCAL_SOURCE: ${LOCAL_SOURCE}`)
console.debug(`DEFAULT_SOURCE: ${DEFAULT_SOURCE}`)

const STORED_CONFIG_VERSION = "2.1.7";
const STORED_CONFIG_NAME = `stored_config${"_" + STORED_CONFIG_VERSION}`
// const DEFAULT_USE_STORED_CONFIG = true;
const globalStoredSettingsName = STORED_CONFIG_NAME;

const defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";

// const DEFAULT_AUTH_URL = "http://word.threeceelabs.com/auth/twitter";

const DEFAULT_WINDOW_HEIGHT = 1080;
const DEFAULT_WINDOW_WIDTH = 1920;

const DEFAULT_METRIC_MODE = "rate";
const DEFAULT_RX_NODE_QUEUE_MAX = 200;
const DEFAULT_RX_NODE_QUEUE_INTERVAL = 5;
const DEFAULT_MAX_NODES = 50;

const DEFAULT_AGE_RATE = 1.0;

const DEFAULT_TRANSITION_DURATION = 40;

const DEFAULT_NODE_MAX_AGE = 15000;
const DEFAULT_NODE_MAX_AGE_RANGE_MIN = 0;
const DEFAULT_NODE_MAX_AGE_RANGE_MAX = 60000;
const DEFAULT_NODE_MAX_AGE_RANGE_STEP = 100;

const DEFAULT_MAX_NODES_LIMIT = 25;
const DEFAULT_MAX_NODES_LIMIT_RANGE_MIN = 0;
const DEFAULT_MAX_NODES_LIMIT_RANGE_MAX = 100;
const DEFAULT_MAX_NODES_LIMIT_RANGE_STEP = 1;

const DEFAULT_CHARGE = -50;
const DEFAULT_CHARGE_RANGE_MIN = -1000;
const DEFAULT_CHARGE_RANGE_MAX = 1000;
const DEFAULT_CHARGE_RANGE_STEP = 10;

const DEFAULT_GRAVITY = 0.001;
const DEFAULT_GRAVITY_RANGE_MIN = -0.01;
const DEFAULT_GRAVITY_RANGE_MAX = 0.01;
const DEFAULT_GRAVITY_RANGE_STEP = 0.00001;

const DEFAULT_VELOCITY_DECAY = 0.35;
const DEFAULT_VELOCITY_DECAY_RANGE_MIN = 0.0;
const DEFAULT_VELOCITY_DECAY_RANGE_MAX = 1.0;
const DEFAULT_VELOCITY_DECAY_RANGE_STEP = 0.01;

const DEFAULT_FORCEX_MULTIPLIER = 25.0;
const DEFAULT_FORCEY_MULTIPLIER = 25.0;

const DEFAULT_COLLISION_RADIUS_MULTIPLIER = 1.0;
const DEFAULT_COLLISION_ITERATIONS = 1;

const DEFAULT_NODE_RADIUS_RATIO_RANGE_MIN = 0.0;
const DEFAULT_NODE_RADIUS_RATIO_RANGE_MAX = 0.500;
const DEFAULT_NODE_RADIUS_RATIO_MIN = 0.02;
const DEFAULT_NODE_RADIUS_RATIO_MAX = 0.10;

const DEFAULT_FONT_SIZE_RATIO_RANGE_MIN = 0.0;
const DEFAULT_FONT_SIZE_RATIO_RANGE_MAX = 0.1;
const DEFAULT_FONT_SIZE_RATIO_MIN = 0.01;
const DEFAULT_FONT_SIZE_RATIO_MAX = 0.04;

const DEFAULT_MAX_READY_ACK_WAIT_COUNT = 10;
const DEFAULT_KEEPALIVE_INTERVAL = 60000;

let currentSessionView;
let rxNodeQueueReady = false;
const rxNodeQueue = [];

let customizePanelFlag = false;

const status = {};

status.serverConnected = false;
status.viewerReadyTransmitted = false;
status.viewerReadyAck = false
status.isAuthenticated = false || LOCAL_SOURCE === DEFAULT_SOURCE;

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

let previousConfig = {}
const config = {};

config.defaults = {}
config.defaults.app_name = "Session View";
config.defaults.sessionViewType = "treepack"; // options: force, histogram ??
config.defaults.storedConfigName = STORED_CONFIG_NAME;
config.defaults.serverActiveTimeoutInterval = 60000;
config.defaults.panzoomTransform = {};

config.defaults.ageRate = DEFAULT_AGE_RATE;
config.defaults.rxNodeQueueMax = DEFAULT_RX_NODE_QUEUE_MAX;
config.defaults.rxNodeQueueInterval = DEFAULT_RX_NODE_QUEUE_INTERVAL;
config.defaults.transitionDuration = DEFAULT_TRANSITION_DURATION;

config.defaults.metricMode = DEFAULT_METRIC_MODE;
config.defaults.pauseOnMouseMove = true;
config.defaults.keepaliveInterval = DEFAULT_KEEPALIVE_INTERVAL;
config.defaults.viewerReadyInterval = 10000;

config.defaults.displayNodeHashMap = {};

config.defaults.displayNodeHashMap = {};
config.defaults.displayNodeHashMap.emoji = "hide";
config.defaults.displayNodeHashMap.hashtag = "show";
config.defaults.displayNodeHashMap.place = "hide";
config.defaults.displayNodeHashMap.url = "hide";
config.defaults.displayNodeHashMap.user = "show";
config.defaults.displayNodeHashMap.word = "hide";

config.defaults.autoCategoryFlag = false;
config.defaults.metricMode = DEFAULT_METRIC_MODE;

config.defaults.nodeMaxAge = DEFAULT_NODE_MAX_AGE;
config.defaults.nodeMaxAgeRange = {};
config.defaults.nodeMaxAgeRange.min = DEFAULT_NODE_MAX_AGE_RANGE_MIN; 
config.defaults.nodeMaxAgeRange.max = DEFAULT_NODE_MAX_AGE_RANGE_MAX;
config.defaults.nodeMaxAgeRange.step = DEFAULT_NODE_MAX_AGE_RANGE_STEP;

config.defaults.maxNodesLimit = DEFAULT_MAX_NODES_LIMIT;
config.defaults.maxNodesLimitRange = {};
config.defaults.maxNodesLimitRange.min = DEFAULT_MAX_NODES_LIMIT_RANGE_MIN; 
config.defaults.maxNodesLimitRange.max = DEFAULT_MAX_NODES_LIMIT_RANGE_MAX;
config.defaults.maxNodesLimitRange.step = DEFAULT_MAX_NODES_LIMIT_RANGE_STEP;

config.defaults.charge = DEFAULT_CHARGE;
config.defaults.chargeRange = {};
config.defaults.chargeRange.min = DEFAULT_CHARGE_RANGE_MIN; 
config.defaults.chargeRange.max = DEFAULT_CHARGE_RANGE_MAX;
config.defaults.chargeRange.step = DEFAULT_CHARGE_RANGE_STEP;

config.defaults.gravity = DEFAULT_GRAVITY;
config.defaults.gravityRange = {};
config.defaults.gravityRange.min = DEFAULT_GRAVITY_RANGE_MIN
config.defaults.gravityRange.max = DEFAULT_GRAVITY_RANGE_MAX;
config.defaults.gravityRange.step = DEFAULT_GRAVITY_RANGE_STEP;

config.defaults.velocityDecay = DEFAULT_VELOCITY_DECAY;
config.defaults.velocityDecayRange = {};
config.defaults.velocityDecayRange.min = DEFAULT_VELOCITY_DECAY_RANGE_MIN;
config.defaults.velocityDecayRange.max = DEFAULT_VELOCITY_DECAY_RANGE_MAX;
config.defaults.velocityDecayRange.step = DEFAULT_VELOCITY_DECAY_RANGE_STEP;

config.defaults.forceXmultiplier = DEFAULT_FORCEX_MULTIPLIER;
config.defaults.forceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
config.defaults.collisionIterations = DEFAULT_COLLISION_ITERATIONS;
config.defaults.collisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;

config.defaults.fontSizeRatioRange = {};
config.defaults.fontSizeRatioRange.min = DEFAULT_FONT_SIZE_RATIO_RANGE_MIN; 
config.defaults.fontSizeRatioRange.max = DEFAULT_FONT_SIZE_RATIO_RANGE_MAX;
config.defaults.fontSizeRatioRange.step = 0.001;
config.defaults.fontSizeRatio = {};
config.defaults.fontSizeRatio.min = DEFAULT_FONT_SIZE_RATIO_MIN;
config.defaults.fontSizeRatio.max = DEFAULT_FONT_SIZE_RATIO_MAX;
config.defaults.fontSize = {};
config.defaults.fontSize.min = config.defaults.fontSizeRatioRange.min * DEFAULT_WINDOW_HEIGHT;
config.defaults.fontSize.max = config.defaults.fontSizeRatioRange.max * DEFAULT_WINDOW_HEIGHT;

config.defaults.nodeRadiusRatioRange = {};
config.defaults.nodeRadiusRatioRange.min = DEFAULT_NODE_RADIUS_RATIO_RANGE_MIN;
config.defaults.nodeRadiusRatioRange.max = DEFAULT_NODE_RADIUS_RATIO_RANGE_MAX;
config.defaults.nodeRadiusRatioRange.step = 0.001;
config.defaults.nodeRadiusRatio = {};
config.defaults.nodeRadiusRatio.min = DEFAULT_NODE_RADIUS_RATIO_MIN;
config.defaults.nodeRadiusRatio.max = DEFAULT_NODE_RADIUS_RATIO_MAX;
config.defaults.nodeRadius = {};
config.defaults.nodeRadius.min = config.defaults.nodeRadiusRatio.min * DEFAULT_WINDOW_WIDTH;
config.defaults.nodeRadius.max = config.defaults.nodeRadiusRatio.max * DEFAULT_WINDOW_WIDTH;

config.settings = Object.assign({}, config.defaults)
previousConfig = Object.assign({}, config.defaults)

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
    mode: "stream"
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
  config.defaults.storedConfigName = "config_" + config.settings.sessionViewType;

  clearTimeout(configUpdateTimeOut);

  configUpdateTimeOut = setTimeout(function () {
    console.debug("STORE CONFIG");
    saveConfig();
    return;
  }, configUpdateTimeOutInverval);
}

const saveConfig = () => {
  config.defaults.storedConfigName = globalStoredSettingsName
  store.set(config.defaults.storedConfigName, config);
  console.debug("STORED CONFIG" + " | " + config.defaults.storedConfigName);
  return;
}

const controlDivElement = document.getElementById("controlDiv");
let serverActiveTimeout;
const serverActiveTimeoutEventObj = new CustomEvent("serverActiveTimeoutEvent");

const resetServerActiveTimer = () => {

  if (currentSessionView !== undefined) {
    currentSessionView.setEnableAgeNodes(true);
  }

  clearTimeout(serverActiveTimeout);

  serverActiveTimeout = setTimeout(function () {
    document.dispatchEvent(serverActiveTimeoutEventObj);
  }, config.settings.serverActiveTimeoutInterval);
}

let customizerWindow;
const customizerComm = (event) => {

  console.debug("CUSTOMIZE PANEL: " + event.origin);

  if (event.data === "DisableHTML5Autoplay_Initialize") {
    console.info("RX> CONTROL PANEL | DisableHTML5Autoplay_Initialize ... IGNORING ...");
    return;
  }

  switch (event.data.op) {

    case "READY":
      console.warn("R< CUSTOMIZE PANEL READY");
      // customizePanel = true;
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

        case "transitionDuration":
          currentSessionView.setTransitionDuration(event.data.value);
          config.settings.TransitionDuration = event.data.value;
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
          console.log(`CUSTOMIZER SET | setNodeRadiusRatio | min: ${event.data.min} max: ${event.data.max}`)
          break;

        case "fontSizeRatio":
          currentSessionView.setFontSizeRatioMin(event.data.min);
          currentSessionView.setFontSizeRatioMax(event.data.max);
          console.log(`CUSTOMIZER SET | setFontSizeRatio | min: ${event.data.min} max: ${event.data.max}`)
          break;

        default:
          console.error("UNKNOWN CUSTOMIZE PANEL ID: " + event.data.id + "\n" + jsonPrint(event.data));
      }
      resetConfigUpdateTimeOut();

      break;

    case "INIT":
      console.info("R< CUSTOMIZE PANEL LOOPBACK? | INIT ... IGNORING ...");
      break;

    default:
      if (event.data["twttr.button"] !== undefined) {
        console.log("R< CUSTOMIZE PANEL TWITTER" + " | " + event.data["twttr.button"].method);
      } 
      else if (event.data.settings !== undefined) {
        console.log("R< CUSTOMIZE PANEL SETTINGS" + "\n" + jsonPrint(event.data.settings));
      } 
      else {
        console.warn("R< ??? CUSTOMIZE PANEL OP UNDEFINED\n" + jsonPrint(event.data));
      }
  }
}

const openCustomizer = (cnf) => {
  
  console.debug("openCustomizer");

  customizerWindow = window.open(
    DEFAULT_SOURCE + "/customize",
    "CUSTOMIZE",
    "width=1000,height=600"
  );

  window.addEventListener("message", customizerComm, false);

  customizerWindow.addEventListener(
    "beforeunload",
    function () {
      console.log("CUSTOMIZE POP UP CLOSING...");
      customizePanelFlag = false;
      updateCustomizeButton(customizePanelFlag);
    },
    false
  );

  customizerWindow.addEventListener(
    "load",
    function () {
      customizePanelFlag = true;
      updateCustomizeButton(customizePanelFlag);
      customizerWindow.postMessage({ op: "INIT", config: cnf, status: status }, DEFAULT_SOURCE);
      return;
    },
    false
  );

  return;
}

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
    openCustomizer(config)
  }
  else{
    if (customizerWindow) {
      customizerWindow.close();
    }
  }
  return;
}

const updateCustomizeButton = (customizePanelFlag) => {
  document.getElementById("customizeButton").innerHTML = customizePanelFlag
    ? "CLOSE CUSTOMIZE"
    : "CUSTOMIZE";
  return;
}

const addCustomizeButton = () => {
  const customizeButton = document.createElement("BUTTON");
  customizeButton.className = "button";
  customizeButton.setAttribute("id", "customizeButton");
  customizeButton.onclick = toggleCustomize;
  customizeButton.innerHTML = config.settings.customizeMode
    ? "EXIT CUSTOMIZE"
    : "CUSTOMIZE";
  controlDivElement.appendChild(customizeButton);
  return;
}

const addFullscreenButton = () => {
  const fullscreenButton = document.createElement("BUTTON");
  fullscreenButton.className = "button";
  fullscreenButton.setAttribute("id", "fullscreenButton");
  fullscreenButton.onclick = toggleFullScreen
  fullscreenButton.innerHTML = config.fullscreenMode
    ? "EXIT FULLSCREEN"
    : "FULLSCREEN";
  controlDivElement.appendChild(fullscreenButton);
  return;
}

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
          "*** RESENDING _READY AFTER " +
            DEFAULT_MAX_READY_ACK_WAIT_COUNT +
            " WAIT CYCLES"
        );
      } else {
        status.userReadyAckWait += 1;
        console.log(
          "... WAITING FOR VIEWER_READY_ACK" +
            " | " +
            DEFAULT_MAX_READY_ACK_WAIT_COUNT +
            " WAIT CYCLES"
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
  // let keepaliveIndex = 0;

  clearInterval(socketKeepaliveInterval);

  console.log(
    "START KEEPALIVE" +
      " | READY ACK: " +
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
    // TX KEEPALIVE

    status.elapsed = Date.now() - status.startTime;

    viewerObj.stats = status;

    sendKeepAlive(viewerObj, function (err) {
      if (err) {
        console.error("KEEPALIVE ERROR: " + err);
      }
    });

    // keepaliveIndex += 1;
  }, interval);
}

let socket;

const rxNode = function (node) {
  
  if (rxNodeQueue.length >= config.settings.rxNodeQueueMax) {
    return;
  }

  if (node.nodeType !== "user" && node.nodeType !== "hashtag") {
    return;
  }

  rxNodeQueue.push(node);
};

function initSocketHandler () {

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

    if (config.settings.VIEWER_OBJ === undefined) {
      config.settings.VIEWER_OBJ = {};
    }

    config.settings.VIEWER_OBJ = viewerObj;

    console.debug("STORE CONFIG ON VIEWER_READY_ACK");
    saveConfig();

    initKeepalive(viewerObj, config.settings.keepaliveInterval);
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
    if (currentSessionView !== undefined) {
      currentSessionView.resize();
    }
  });

  let socketErrorTimeout;

  socket.on("error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;

    console.log("*** SOCKET ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET ERROR\n" + error);

    if (currentSessionView !== undefined) {
      currentSessionView.resize();
    }

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
    if (currentSessionView !== undefined) {
      currentSessionView.resize();
    }
  });

  socket.on("reconnect_error", function (error) {
    status.socket.errors += 1;
    status.socket.error = error;

    console.log("*** SOCKET RECONNECT ERROR ... DELETING ALL SESSIONS ...");
    console.error("*** SOCKET RECONNECT ERROR\n" + error);
    if (currentSessionView !== undefined) {
      currentSessionView.resize();
    }
  });

  socket.on("unauthorized", function (err) {
    status.serverConnected = true;

    console.error(
      "TSS | *** UNAUTHORIZED *** " +
        " | ID: " +
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

    console.log("CONNECTED TO HOST" + " | ID: " + socket.id);

    initViewerReadyInterval(config.settings.viewerReadyInterval);
  });

  const sSmall = {};
  sSmall.bestNetwork = {};

  socket.on("HEARTBEAT", function (hb) {
    console.log(`HEARTBEAT`);
    resetServerActiveTimer();

    status.bestNetwork = hb.bestNetwork;

    status.maxNodes = currentSessionView === undefined ? 0 : currentSessionView.getMaxNodes();
    status.maxNodeAddQ = currentSessionView === undefined ? 0 : currentSessionView.getMaxNodeAddQ();

    status.serverConnected = true;
    status.socket.connected = true;

  });

  socket.on("STATS", function (stats) {
    status.serverConnected = true;
    status.socket.connected = true;

    console.log("<R STATS" + "\n" + jsonPrint(stats));

    if (currentSessionView) {
      currentSessionView.setStats(stats);
    }
  });

  socket.on("CONFIG_CHANGE", function (rxConfig) {
    status.serverConnected = true;
    status.socket.connected = true;

    console.log(
      "\n-----------------------\nRX CONFIG_CHANGE\n" +
        JSON.stringify(rxConfig, null, 3) +
        "\n------------------------\n"
    );

    if (rxConfig.testMode !== undefined) {
      config.settings.testMode = rxConfig.testMode;
      console.log(
        "\n*** ENV CHANGE: TEST_MODE:  WAS: " +
          previousConfig.testMode +
          " | NOW: " +
          config.settings.testMode +
          "\n"
      );
      previousConfig.testMode = config.testMode;
    }

    if (rxConfig.testSendInterval !== undefined) {
      config.settings.testSendInterval = rxConfig.testSendInterval;
      console.log(
        "\n*** ENV CHANGE: TEST_SEND_INTERVAL: WAS: " +
          previousConfig.testSendInterval +
          " | NOW: " +
          config.settings.testSendInterval +
          "\n"
      );
      previousConfig.testSendInterval = config.settings.testSendInterval;
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

  // const viewNumNodes = 0;
  let viewNodeAddQlength = 0;

  clearInterval(socketSessionUpdateInterval);

  socketSessionUpdateInterval = setInterval(function () {

    viewNodeAddQlength = currentSessionView.getNodeAddQlength();

    if (rxNodeQueueReady && rxNodeQueue.length > 0 && viewNodeAddQlength <= 1.5 * config.settings.rxNodeQueueMax) {

      rxNodeQueueReady = false;

      newNode = rxNodeQueue.shift();

      if (config.autoCategoryFlag && newNode.categoryAuto) {
        category = newNode.categoryAuto;
      } 
      else {
        category = newNode.category;
      }

      if (newNode.categoryAuto !== "none" && (category === undefined || category === "none")) {
        newNode.categoryColor = categoryColorHashMap.get("auto");
      } 
      else if (category === undefined || category === "none") {
        newNode.categoryColor = categoryColorHashMap.get("none");
      } 
      else {
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

      newNode.categoryMismatch = newNode.category !== "none" && newNode.category && newNode.categoryAuto && newNode.category !== newNode.categoryAuto;
      newNode.categoryMatch = newNode.category !== "none" && newNode.category && newNode.categoryAuto && newNode.category === newNode.categoryAuto;

      currentSessionView.addNode(newNode);
      rxNodeQueueReady = true;

    }

  }, config.settings.rxNodeQueueInterval);

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

function displayControl(isVisible) {
  controlDivElement.style.display = isVisible ? "unset" : "none";
}

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

    if (config.settings.pauseOnMouseMove && !config.settings.pauseFlag) {
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

document.addEventListener("mousemove", function () {
    if (currentSessionView) {
      if (config.settings.pauseOnMouseMove) {
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

document.addEventListener("panzoomEvent", function () {
    if (currentSessionView) {
      config.settings.panzoomTransform = currentSessionView.getPanzoomTransform();
      saveConfig();
    }
  },
  true
);

const loadStoredSettings = () => {
  console.log("LOADING STORED SETTINGS: " + globalStoredSettingsName);
  return store.get(globalStoredSettingsName);
}

window.addEventListener(
  "beforeunload",
  function () {
    console.log("CLOSING...");
    if (customizerWindow){
      customizerWindow.close()
    }
    customizePanelFlag = false;
  },
  false
);

setTimeout(function(){

  try{

    const storedSettings = loadStoredSettings();

    if (storedSettings) {
      console.log(`LOADED STORED SETTINGS`)
      console.log({storedSettings}) 
      config.settings = Object.assign(config.settings, storedSettings.settings)
    }
    else{
      console.log(`*** LOAD STORED SETTINGS FAILED: ${globalStoredSettingsName}`)
    }

    socket = io("/view");

    addCustomizeButton();
    addFullscreenButton();

    console.log("TX VIEWER_READY\n" + jsonPrint(viewerObj));

    viewerObj.timeStamp = Date.now();

    socket.emit("VIEWER_READY", viewerObj, function () {
      status.viewerReadyTransmitted = true;
    });

    currentSessionView = ViewTreepack(config);
    currentSessionView.initD3timer();
    currentSessionView.resize();    
    initSocketHandler()
    initSocketSessionUpdateRx()
    resetMouseMoveTimer()
  }
  catch(err){
    console.error({err})
  }

}, 100)
