/* global d3, deePool, HashMap, panzoom*/

function ViewTreepack (config) {

  console.log("@@@@@@@ CLIENT @@@@@@@@");
  console.log({config})

  let nodeArray = [];

  const initialXposition = 0.5;
  const initialYposition = 0.9;
  // const defaultInitialZoom = 1.0;

  // const DEFAULT_ZOOM_FACTOR = 0.5;
  const minRateMetricChange = 0.5;

  function getWindowDimensions () {
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

  function jsonPrint(obj) {
    if (obj || obj === 0) {
      return JSON.stringify(obj, null, 2);
    } else {
      return "UNDEFINED";
    }
  }

  const palette = {
    black: "#000000",
    white: "#FFFFFF",
    lightgray: "#AAAAAA",
    gray: "#888888",
    mediumgray: "#536870",
    darkgray: "#475B62",
    darkblue: "#0A2933",
    darkerblue: "#042029",
    paleryellow: "#FCF4DC",
    paleyellow: "#EAE3CB",
    yellow: "#A57706",
    lightyellow: "#B58716",
    darkyellow: "#846608",
    orange: "#BD3613",
    red: "#D11C24",
    redPure: "#FF0000",
    greenPure: "#00FF00",
    bluePure: "#0000FF",
    pink: "#C61C6F",
    purple: "#595AB7",
    blue: "#4808FF",
    green: "#00E540",
    darkergreen: "#008200",
    lightgreen: "#35A296",
    yellowgreen: "#738A05",
  };

  const DEFAULT_MIN_RATE = 0.1;
  const minRate = DEFAULT_MIN_RATE;

  const DEFAULT_MIN_FOLLOWERS = 5000;
  const minFollowers = DEFAULT_MIN_FOLLOWERS;

  const DEFAULT_MIN_MENTIONS = 1000;

  const minMentionsUsers = DEFAULT_MIN_MENTIONS;
  const minMentionsHashtags = 100;

  const DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9; // age users with many followers at a slower rate

  let mouseMovingFlag = false;

  // let self = self;
  let simulation;

  let enableAgeNodes = true;
  let newCurrentMaxMentionsMetricFlag = true;
  let newCurrentMaxRateMetricFlag = true;

  let resumeTimeStamp = 0;

  const sliderPercision = 5;

  // FORCE X & Y
  const xFocusLeftRatio = 0.2;
  const yFocusLeftRatio = 0.5;

  const xFocusRightRatio = 0.8;
  const yFocusRightRatio = 0.5;

  const xFocusPositiveRatio = 0.5;
  const yFocusPositiveRatio = 0.2;

  const xFocusNegativeRatio = 0.5;
  const yFocusNegativeRatio = 0.7;

  const xFocusNeutralRatio = 0.5;
  const yFocusNeutralRatio = 0.5;

  const xFocusDefaultRatio = 0.5;
  const yFocusDefaultRatio = 0.6;

  // INITIAL POSITION
  const xMinRatioLeft = 0.25;
  const xMaxRatioLeft = 0.3;

  const yMinRatioLeft = 0.75;
  const yMaxRatioLeft = 0.85;

  const xMinRatioRight = 0.7;
  const xMaxRatioRight = 0.75;

  const yMinRatioRight = 0.75;
  const yMaxRatioRight = 0.85;

  const xMinRatioPositive = 0.45;
  const xMaxRatioPositive = 0.55;

  const yMinRatioPositive = 0.3;
  const yMaxRatioPositive = 0.4;

  const xMinRatioNegative = 0.45;
  const xMaxRatioNegative = 0.55;

  const yMinRatioNegative = 0.85;
  const yMaxRatioNegative = 0.95;

  const xMinRatioNeutral = 0.45;
  const xMaxRatioNeutral = 0.55;

  const yMinRatioNeutral = 0.75;
  const yMaxRatioNeutral = 0.85;

  const xMinRatioDefault = 0.45;
  const xMaxRatioDefault = 0.55;

  const yMinRatioDefault = 0.75;
  const yMaxRatioDefault = 0.85;

  let foci = {
    left: { x: xFocusLeftRatio * width, y: yFocusLeftRatio * height },
    right: { x: xFocusRightRatio * width, y: yFocusRightRatio * height },
    positive: {
      x: xFocusPositiveRatio * width,
      y: yFocusPositiveRatio * height,
    },
    negative: {
      x: xFocusNegativeRatio * width,
      y: yFocusNegativeRatio * height,
    },
    neutral: { x: xFocusNeutralRatio * width, y: yFocusNeutralRatio * height },
    none: { x: xFocusDefaultRatio * width, y: yFocusDefaultRatio * height },
    default: { x: xFocusDefaultRatio * width, y: yFocusDefaultRatio * height },
  };

  const totalHashmap = {};
  totalHashmap.total = 0;
  totalHashmap.left = 0;
  totalHashmap.right = 0;
  totalHashmap.neutral = 0;
  totalHashmap.positive = 0;
  totalHashmap.negative = 0;
  totalHashmap.none = 0;


  let currentMaxRateMetric = 2;

  const currentMax = {};

  currentMax.rate = {};
  currentMax.rate.isMaxNode = true;
  currentMax.rate.nodeId = "14607119";
  currentMax.rate.nodeType = "user";
  currentMax.rate.screenName = "threecee";
  currentMax.rate.rate = 0.1;
  currentMax.rate.mentions = 0.1;
  currentMax.rate.timeStamp = Date.now();

  currentMax.mentions = {};
  currentMax.mentions.isMaxNode = true;
  currentMax.mentions.nodeId = "what";
  currentMax.mentions.nodeType = "hashtag";
  currentMax.mentions.screenName = "whatever";
  currentMax.mentions.rate = 0.1;
  currentMax.mentions.mentions = 0.1;
  currentMax.mentions.timeStamp = Date.now();

  function resetCurrentMax() {
    currentMax.rate.isMaxNode = true;
    currentMax.rate.nodeId = "14607119";
    currentMax.rate.nodeType = "user";
    currentMax.rate.screenName = "threecee";
    currentMax.rate.rate = 0.1;
    currentMax.rate.mentions = 0.1;
    currentMax.rate.timeStamp = Date.now();

    currentMax.mentions.isMaxNode = true;
    currentMax.mentions.nodeId = "what";
    currentMax.mentions.nodeType = "hashtag";
    currentMax.mentions.screenName = "whatever";
    currentMax.mentions.rate = 0.1;
    currentMax.mentions.mentions = 0.1;
    currentMax.mentions.timeStamp = Date.now();
  }

  function Node(nodePoolId) {
    this.age = 1e-6;
    this.ageMaxRatio = 1e-6;
    this.ageUpdated = Date.now();
    this.category = "none";
    this.categoryAuto = "none";
    this.categoryColor = "#FFFFFF";
    this.categoryMatch = false;
    this.categoryMismatch = false;
    this.following = false;
    this.followersCount = 0;
    this.followersMentions = 0;
    this.friendsCount = 0;
    this.fullName = 0;
    this.hashtagId = false;
    this.index = 0;
    this.isBot = false;
    this.isTweeter = false;
    this.isDead = true;
    this.isIgnored = false;
    this.isMaxNode = false;
    this.isTopTerm = false;
    this.isTrendingTopic = false;
    this.isValid = false;
    this.lastTweetId = false;
    this.mentions = 0;
    this.mouseHoverFlag = false;
    this.name = "";
    this.newFlag = true;
    this.nodeId = "";
    this.nodePoolId = nodePoolId;
    this.nodeType = "user";
    this.rank = -1;
    this.rate = 1e-6;
    this.screenName = "";
    this.statusesCount = 0;
    this.text = "";
    this.vx = 1e-6;
    this.vy = 1e-6;
    this.x = initialXposition * width;
    this.y = initialYposition * height;
  }

  let nodePoolIndex = 0;

  const nodePool = deePool.create(function makeNode() {
    nodePoolIndex += 1;
    return new Node("nodePoolId_" + nodePoolIndex);
  });

  nodePool.grow(2 * config.settings.maxNodes);

  console.log(`POOL INIT | SIZE: ${nodePool.size()}`)

  let autoCategoryFlag = config.settings.autoCategoryFlag;
  let metricMode = config.settings.metricMode;
  let charge = config.settings.charge;
  let gravity = config.settings.gravity;
  const forceXmultiplier = config.settings.forceXmultiplier;
  const forceYmultiplier = config.settings.forceYmultiplier;
  const collisionRadiusMultiplier = 1.1;
  const collisionIterations = config.settings.collisionIterations;
  let velocityDecay = config.settings.velocityDecay;

  let fontSizeRatioMin = config.settings.fontSizeRatio.min;
  let fontSizeRatioMax = config.settings.fontSizeRatio.max;
  let fontSizeMin = fontSizeRatioMin * height;
  let fontSizeMax = fontSizeRatioMax * height;

  let nodeRadiusRatioMin = config.settings.nodeRadiusRatio.min;
  let nodeRadiusRatioMax = config.settings.nodeRadiusRatio.max;
  let nodeRadiusMin = nodeRadiusRatioMin * width;
  let nodeRadiusMax = nodeRadiusRatioMax * width;

  if (config.settings.panzoomTransform === undefined) {
    config.settings.panzoomTransform = {};
  }
  config.settings.panzoomTransform.ratio = 1.0;
  config.settings.panzoomTransform.scale = config.settings.panzoomTransform.scale || config.settings.zoomFactor;
  config.settings.panzoomTransform.x = config.settings.panzoomTransform.x || 0.5 * width;
  config.settings.panzoomTransform.y = config.settings.panzoomTransform.y || 0.5 * height;

  const maxRateMentions = {};
  maxRateMentions.rateNodeType = "hashtag";
  maxRateMentions.mentionsNodeType = "hashtag";
  maxRateMentions.isMaxNode = true;
  maxRateMentions.metricMode = metricMode;

  if (metricMode === "rate") {
    maxRateMentions.nodeId = "RATE | MAX";
  }
  if (metricMode === "mentions") {
    maxRateMentions.nodeId = "MNTN | MAX";
  }
  maxRateMentions.rate = 2;
  maxRateMentions.rateNodeId = "what";
  maxRateMentions.mentionsNodeId = "what";
  maxRateMentions.rateTimeStamp = Date.now();
  maxRateMentions.mentionsTimeStamp = Date.now();
  maxRateMentions.mentions = 2;
  maxRateMentions.ageMaxRatio = 1e-6;
  maxRateMentions.isTrendingTopic = true;
  maxRateMentions.mouseHoverFlag = false;
  maxRateMentions.x = 100;
  maxRateMentions.y = 100;

  console.log("TREEPACK CONFIG");

  let testMode = false;
  let freezeFlag = false;

  const minOpacity = 0.2;

  const DEFAULT_AGE_RATE = 1.0;

  const localNodeHashMap = new HashMap();
  const nodeIdHashMap = new HashMap();

  let maxNodeAddQ = 0;
  let maxNodes = 0;

  let runningFlag = false;

  const nodeAddQ = [];

  self.getWidth = function () {
    return width;
  };

  self.getHeight = function () {
    return height;
  };

  const keysForSort = [];

  self.getSortedKeys = function (hmap, sortProperty) {
    hmap.forEach(function (value, key) {
      if (!value.isSessionNode) {
        keysForSort.push(key);
      }
    });
    return keysForSort.sort(function sortFunc(a, b) {
      return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty];
    });
  };

  let mouseHoverFlag = false;

  let nodeMaxAge = 60000;
  let maxAgeRate = 1e-6;

  // let defaultStrokeWidth = "1.1px";
  const defaultStrokeWidth = "0.5em";
  // let topTermStrokeWidth = "2.0px";
  const topTermStrokeWidth = "0.6em";

  // let botStrokeWidth = "4.0px";
  const botStrokeWidth = "0.6em";
  const botCircleFillColor = palette.black;
  // const botCircleStrokeColor = palette.lightgray;
  const botLabelFillColor = palette.white;

  const categoryMatchColor = palette.green;
  // let categoryMatchStrokeWidth = "4.0px";
  const categoryMatchStrokeWidth = "0.6em";
  // let categoryMismatchStrokeWidth = "7.0px";
  const categoryMismatchStrokeWidth = "0.7em";
  // let categoryAutoStrokeWidth = "2.0px";
  const categoryAutoStrokeWidth = "0.3em";

  const divTooltip = d3
    .select("body")
    .append("div")
    .attr("id", "divTooltip")
    .attr("class", "tooltip")
    .style("display", "none");

  document.addEventListener(
    "mousemove",
    function mousemoveFunc() {
      if (mouseHoverFlag) {
        d3.select("body").style("cursor", "pointer");
      } else {
        d3.select("body").style("cursor", "default");
      }
    },
    true
  );

  let currentMetricModeDomainMaxSqrt = Math.sqrt(
    currentMax[metricMode][metricMode]
  );
  let currentMetricModeDomainMax = currentMax[metricMode][metricMode];

  let defaultRadiusScale = d3
    .scaleLinear()
    .domain([0, currentMetricModeDomainMaxSqrt])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

  let nodeLabelSizeScale = d3
    .scaleLinear()
    .domain([1, currentMetricModeDomainMax])
    .range([fontSizeMin, fontSizeMax])
    .clamp(true);

  const nodeLabelOpacityScale = d3
    .scaleLinear()
    .domain([1e-6, 0.5, 1.0])
    .range([1.0, 0.85, 1.5 * minOpacity])
    .clamp(true);

  const nodeLabelOpacityScaleTopTerm = d3
    .scaleLinear()
    .domain([1e-6, 0.5, 1.0])
    .range([1.0, 0.95, 0.75])
    .clamp(true);

  const adjustedAgeRateScale = d3
    .scaleLinear()
    .domain([1, config.settings.maxNodesLimit])
    .range([1.0, 100.0]);

  const d3image = d3.select("#d3group");

  const svgMain = d3image
    .append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);


  const svgTreemapLayoutArea = svgMain
    .append("svg:g")
    .attr("id", "svgTreemapLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  
  const panzoomElement = document.getElementById("svgTreemapLayoutArea");

  const panzoomInstance = panzoom(panzoomElement, {
    autocenter: true,
    bounds: true,
    initialZoom: 0.9
    // maxZoom: 2,
    // minZoom: 0.1,
    // zoomSpeed: 0.02,
  });

  const panzoomEvent = new CustomEvent("panzoomEvent", {
    bubbles: true,
    detail: { transform: () => config.settings.panzoomTransform },
  });

  let panzoomCurrentEvent;

  panzoomInstance.on("transform", function (e) {
    panzoomCurrentEvent = e;
    resetZoomEndTimeout();
  });

  let zoomEndTimeout;

  const resetZoomEndTimeout = function () {
    clearTimeout(zoomEndTimeout);

    zoomEndTimeout = setTimeout(function () {
      config.settings.panzoomTransform = panzoomCurrentEvent.getTransform();
      console.log(
        "panzoomTransform transform end\n",
        jsonPrint(config.settings.panzoomTransform)
      );
      document.dispatchEvent(panzoomEvent);
    }, 1000);
  };

  console.log("panzoomInstance zoomAbs\n", jsonPrint(config.settings.panzoomTransform));

  // panzoomInstance.zoomAbs(
  //   width * 0.5,
  //   height * 0.5,
  //   config.settings.panzoomTransform.scale
  // );
  
  const nodeSvgGroup = svgTreemapLayoutArea
    .append("svg:g")
    .attr("id", "nodeSvgGroup");
  const nodeLabelSvgGroup = svgTreemapLayoutArea
    .append("svg:g")
    .attr("id", "nodeLabelSvgGroup");

  const randomIntFromInterval = function (min, max) {
    const random = Math.random();
    const randomInt = Math.floor(random * (max - min + 1) + min);
    if (Number.isNaN(randomInt)) {
      console.error(
        "randomIntFromInterval NaN" + " | MIN: " + min + " | MAX: " + max
      );
    }
    return randomInt;
  };

  d3.select("body").style("cursor", "default");

  self.setStats = function (stats) {
    console.log("setStats" + "\nSTATS\n" + jsonPrint(stats));
  };

  self.setEnableAgeNodes = function (enabled) {
    enableAgeNodes = enabled;
    config.settings.enableAgeNodes = enabled;
  };

  self.getPanzoomTransform = function () {
    return config.settings.panzoomTransform;
  };

  self.deleteNode = function () {
    return null;
  };
  self.getTotalHashMap = function () {
    return totalHashmap;
  };
  self.getNodesLength = function () {
    return "NODES: " + nodeArray.length + " | POOL: " + nodePool.size();
  };
  self.getMaxNodes = function () {
    return maxNodes;
  };
  self.getNumNodes = function () {
    return nodeArray.length;
  };
  self.getNodeAddQlength = function () {
    return nodeAddQ.length;
  };
  self.getMaxNodeAddQ = function () {
    return maxNodeAddQ;
  };
  // self.getAgeRate = function () {
  //   return ageRate;
  // };
  self.getMaxAgeRate = function () {
    return maxAgeRate;
  };

  self.setMaxNodesLimit = function (mNodesLimit) {
    // maxNodesLimit = mNodesLimit;
    config.settings.maxNodesLimit = mNodesLimit;
    console.debug("SET MAX NODES LIMIT: " + config.settings.maxNodesLimit);
  };

  self.setNodeMaxAge = function (mAge) {
    nodeMaxAge = mAge;
    config.settings.maxAge = mAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  };

  // self.setAntonym = function (flag) {
  //   antonymFlag = flag;
  //   console.debug("SET ANTONYM: " + antonymFlag);
  // };

  // self.setTwitterUser = function (message) {
  //   if (message.node.notFound !== undefined) {
  //     console.log(
  //       "setTwitterUser" +
  //         " | NOT FOUND: SEARCH NODE: " +
  //         message.searchNode +
  //         "\nSTATS\n" +
  //         jsonPrint(message.stats)
  //     );
  //   } else {
  //     console.log(
  //       "setTwitterUser" +
  //         " | NID: " +
  //         message.node.nodeId +
  //         " | @" +
  //         message.node.screenName +
  //         "\nSTATS\n" +
  //         jsonPrint(message.stats)
  //     );
  //   }

  //   // if (controlPanelReadyFlag) {
  //   //   controlPanelWindow.postMessage(
  //   //     {
  //   //       op: "SET_TWITTER_USER",
  //   //       node: message.node,
  //   //       searchNode: message.searchNode,
  //   //       stats: message.stats,
  //   //     },
  //   //     DEFAULT_SOURCE
  //   //   );
  //   // }

  // };

  // self.twitterUserNotFound = function (message) {
  //   console.log(
  //     "TWITTER USER NOT FOUND" +
  //       " | SEARCH MODE: " +
  //       message.searchMode +
  //       " | SEARCH NODE: " +
  //       message.searchNode
  //   );

  //   // if (controlPanelReadyFlag) {
  //   //   controlPanelWindow.postMessage(
  //   //     {
  //   //       op: "TWITTER_USER_NOT_FOUND",
  //   //       searchMode: message.searchMode,
  //   //       searchNode: message.searchNode,
  //   //       stats: stats,
  //   //     },
  //   //     DEFAULT_SOURCE
  //   //   );
  //   // }
  // };

  // self.setTwitterHashtag = function (message) {
  //   if (message.node.notFound !== undefined) {
  //     console.log(
  //       "setTwitterHashtag" +
  //         " | NOT FOUND: SEARCH NODE: " +
  //         message.searchNode +
  //         "\nSTATS\n" +
  //         jsonPrint(message.stats)
  //     );
  //   } else {
  //     console.log(
  //       "setTwitterHashtag" +
  //         " | #" +
  //         message.node.nodeId +
  //         "\nSTATS\n" +
  //         jsonPrint(message.stats)
  //     );
  //   }

  //   // if (controlPanelReadyFlag) {
  //   //   controlPanelWindow.postMessage(
  //   //     {
  //   //       op: "SET_TWITTER_HASHTAG",
  //   //       node: message.node,
  //   //       searchNode: message.searchNode,
  //   //       stats: message.stats,
  //   //     },
  //   //     DEFAULT_SOURCE
  //   //   );
  //   // }
  // };

  self.setMetricMode = function (mode) {
    metricMode = mode;
    config.settings.metricMode = mode;

    nodeLabelSizeScale = d3
      .scaleLinear()
      .domain([1, currentMax[mode][mode]])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    defaultRadiusScale = d3
      .scaleLinear()
      .domain([0, Math.sqrt(currentMax[mode][mode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);

    console.debug("SET METRIC MODE: " + mode);
  };

  self.setAutoCategoryFlag = function (flag) {
    autoCategoryFlag = flag;
    console.debug("SET AUTO CATEGORY: " + autoCategoryFlag);
  };

  // self.setRemoveDeadNodesFlag = function (flag) {
  //   removeDeadNodesFlag = flag;
  //   console.debug("SET REMOVE DEAD NODES: " + removeDeadNodesFlag);
  // };

  self.setTestMode = function (flag) {
    testMode = flag;
    console.debug("SET TEST MODE: " + testMode);
  };

  self.toolTipVisibility = function (isVisible) {
    if (isVisible) {
      divTooltip.style("display", "unset");
    } else {
      divTooltip.style("display", "none");
    }
  };

  self.deleteSessionLinks = function () {
    console.debug("DELETE LINKS");
  };

  self.setPause = function (value) {
    console.debug("SET PAUSE: " + value);
    runningFlag = !value;
    if (value) {
      self.simulationControl("PAUSE");
    } else {
      self.simulationControl("RESUME");
    }
  };

  self.togglePause = function () {
    if (runningFlag) {
      self.simulationControl("PAUSE");
    } else {
      self.simulationControl("RESUME");
    }
  };

  self.setParam = function (param, value) {
    console.log("updateParam: " + param + " = " + value);
    return;
  };

  self.setVelocityDecay = function (value) {
    console.debug("UPDATE VEL DECAY: " + value.toFixed(sliderPercision));
    config.settings.velocityDecay = value;
    velocityDecay = value;
    simulation.velocityDecay(velocityDecay);
  };

  self.setGravity = function (value) {
    console.debug("UPDATE GRAVITY: " + value.toFixed(5));
    config.settings.gravity = value;
    gravity = value;

    simulation
      .force("forceX", d3.forceX()
          .x(function (d) {
            if (
              (autoCategoryFlag && isCategorized(d.categoryAuto)) ||
              (!isCategorized(d.category) && isCategorized(d.categoryAuto))
            ) {
              return foci[d.categoryAuto].x;
            }
            if (isCategorized(d.category)) {
              return foci[d.category].x;
            }
            return foci.default.x;
          })
          .strength(function () {
            return forceXmultiplier * gravity;
          })
      )
      .force(
        "forceY",
        d3
          .forceY()
          .y(function (d) {
            if (
              (autoCategoryFlag && isCategorized(d.categoryAuto)) ||
              (!isCategorized(d.category) && isCategorized(d.categoryAuto))
            ) {
              return foci[d.categoryAuto].y;
            }
            if (isCategorized(d.category)) {
              return foci[d.category].y;
            }
            return foci.default.y;
          })
          .strength(function () {
            return forceYmultiplier * gravity;
          })
      );
  };

  self.setTransitionDuration = function (value) {
    console.debug("UPDATE TRANSITION DURATION: " + value);
    // transitionDuration = value;
    config.settings.transitionDuration = value;
  };

  self.setCharge = function (value) {
    console.debug("UPDATE CHARGE: " + value);
    config.settings.charge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.setNodeRadiusRatioMin = function (value) {
    console.debug("UPDATE NODE RADIUS MIN RATIO: " + value);
    config.settings.nodeRadiusRatio.min = value;
    nodeRadiusRatioMin = value;
    nodeRadiusMin = value * width;
    defaultRadiusScale = d3
      .scaleLinear()
      .domain([0, currentMetricModeDomainMaxSqrt])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.setNodeRadiusRatioMax = function (value) {
    console.debug("UPDATE NODE RADIUS MAX RATIO: " + value);
    config.settings.nodeRadiusRatio.max = value;
    nodeRadiusRatioMax = value;
    nodeRadiusMax = value * width;
    defaultRadiusScale = d3
      .scaleLinear()
      .domain([0, currentMetricModeDomainMaxSqrt])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.setFontSizeRatioMin = function (value) {
    console.debug("UPDATE FONT MIN SIZE: " + value);
    config.settings.fontSizeRatio.min = value;

    fontSizeRatioMin = value;
    fontSizeMin = value * height;

    nodeLabelSizeScale = d3
      .scaleLinear()
      .domain([1, currentMetricModeDomainMax])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.setFontSizeRatioMax = function (value) {
    console.debug("UPDATE FONT MAX SIZE: " + value);
    config.settings.fontSizeRatio.max = value;

    fontSizeRatioMax = value;
    fontSizeMax = value * height;

    nodeLabelSizeScale = d3
      .scaleLinear()
      .domain([1, currentMetricModeDomainMax])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.resetDefaultForce = function () {
    console.warn("RESET TREEPACK DEFAULT FORCE");
    self.setTransitionDuration(config.settings.transitionDuration);
    self.setNodeMaxAge(config.settings.maxAge);
    self.setCharge(config.settings.charge);
    self.setVelocityDecay(config.settings.velocityDecay);
    self.setGravity(config.settings.gravity);
  };

  function resetNode(n){

    // console.debug(`==> RESET NODE | ID: ${n.nodeId}`)

    n.age = 1e-6;
    n.ageMaxRatio = 1e-6;
    n.ageUpdated = Date.now();
    n.category = false;
    n.categoryAuto = false;
    n.categoryColor = "#FFFFFF";
    n.categoryMatch = false;
    n.categoryMismatch = false;
    n.categoryVerified = false;
    n.following = false;
    n.followersCount = 0;
    n.followersMentions = 0;
    n.friendsCount = 0;
    n.fullName = "";
    n.hashtagId = false;
    n.index = 0;
    n.isCategory = false;
    n.isDead = true;
    n.isMaxNode = false;
    n.isTopTerm = false;
    n.isTrendingTopic = false;
    n.isValid = false;
    n.lastTweetId = false;
    n.mentions = 0;
    n.mouseHoverFlag = false;
    n.name = "";
    n.newFlag = false;
    n.nodeId = "";
    n.nodeType = "user";
    n.rank = -1;
    n.rate = 1e-6;
    n.screenName = "";
    n.statusesCount = 0;
    n.text = "";
    n.vx = 1e-6;
    n.vy = 1e-6;
    n.x = initialXposition.width;
    n.y = initialYposition.height;

    if (document.getElementById(n.nodePoolId)){
      document.getElementById(n.nodePoolId).setAttribute("display", "none");
    }

    if (document.getElementById(n.nodePoolId + "_label")){
      document.getElementById(n.nodePoolId + "_label").setAttribute("display", "none");
    }

    return n;
  }

  function ageNodes(){
      
    let age = 1e-6;
    const tempNodeArray = [];

    const tempTotalHashmap = {};
    tempTotalHashmap.total = 0;
    tempTotalHashmap.left = 0;
    tempTotalHashmap.right = 0;
    tempTotalHashmap.neutral = 0;
    tempTotalHashmap.positive = 0;
    tempTotalHashmap.negative = 0;
    tempTotalHashmap.none = 0;

    const nodeIdArray = nodeIdHashMap.keys();
    
    const ageNodesLength = nodeIdArray.length;
    let ageRate = DEFAULT_AGE_RATE;

    if (ageNodesLength > config.settings.maxNodesLimit && nodeAddQ.length <= config.settings.maxNodes) {
      ageRate = adjustedAgeRateScale(ageNodesLength - config.settings.maxNodesLimit);
    } 
    else if (nodeAddQ.length > config.settings.maxNodes) {
      ageRate = adjustedAgeRateScale(nodeAddQ.length - config.settings.maxNodes);
    } 

    maxAgeRate = Math.max(ageRate, maxAgeRate);

    for(const nodeId of nodeIdArray){

      const nPoolId = nodeIdHashMap.get(nodeId);
      const nNode = localNodeHashMap.get(nPoolId);

      if (!nPoolId || !nNode){
        console.debug(`UNDEFINED | nPoolId: ${nPoolId} | nNode: ${nNode}`)
        continue;
      }

      if (!enableAgeNodes || resumeTimeStamp > 0) {
        ageRate = 1e-6;
      }

      if (nNode.nodeType === "user" && nNode.followersCount && nNode.followersCount > minFollowers) {
        age = nNode.age + ageRate * DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO * (Date.now() - nNode.ageUpdated);
      } 
      else {
        age = nNode.age + ageRate * (Date.now() - nNode.ageUpdated);
      }

      if (nNode.isDead || (age >= nodeMaxAge)) {

        nodeIdHashMap.remove(nodeId);
        localNodeHashMap.remove(nPoolId);

        const n = resetNode(nNode)
        nodePool.recycle(n);

      } 
      else {
        
        nNode.isValid = true;
        nNode.isDead = (age >= nodeMaxAge);
        nNode.ageUpdated = Date.now();
        nNode.age = Math.max(age, 1e-6);
        nNode.ageMaxRatio = Math.max((age / nodeMaxAge), 1e-6);

        localNodeHashMap.set(nPoolId, nNode);
        nodeIdHashMap.set(nNode.nodeId, nPoolId);

        tempNodeArray.push(nNode);

        if (isCategorized(nNode.category)) {
          if (metricMode === "rate") {
            tempTotalHashmap[nNode.category] += nNode.rate;
            tempTotalHashmap.total += nNode.rate;
          }
          if (metricMode === "mentions") {
            tempTotalHashmap[nNode.category] += nNode.mentions;
            tempTotalHashmap.total += nNode.mentions;
          }
        } else {
          if (metricMode === "rate") {
            tempTotalHashmap.none += nNode.rate;
            tempTotalHashmap.total += nNode.rate;
          }
          if (metricMode === "mentions") {
            tempTotalHashmap.none += nNode.mentions;
            tempTotalHashmap.total += nNode.mentions;
          }
        }

      }

    }

    resumeTimeStamp = 0;
    // totalHashmap = tempTotalHashmap;
    return tempNodeArray;

  }

  let tooltipString;

  const nodeMouseOver = function (event, d) {
    d.mouseHoverFlag = true;

    if (mouseMovingFlag) {
      self.toolTipVisibility(true);
    } else {
      self.toolTipVisibility(false);
    }

    d3.select(this).style("fill-opacity", 1);
    d3.select(this).style("stroke", palette.white);
    d3.select(this).style("stroke-opacity", 1);
    d3.select(this).style("display", "unset");
    d3.select("#" + d.nodePoolId).style("fill-opacity", 1);
    d3.select("#" + d.nodePoolId).style("stroke-opacity", 1);
    d3.select("#" + d.nodePoolId + "_label").style("stroke", "unset");
    d3.select("#" + d.nodePoolId + "_label").style("fill", palette.white);
    d3.select("#" + d.nodePoolId + "_label").style("fill-opacity", 1);
    d3.select("#" + d.nodePoolId + "_label").style("display", "unset");

    switch (d.nodeType) {
      case "user":

        tooltipString =
          "@" +
          d.screenName +
          "<br>" +
          d.name +
          "<br>AGE (DAYS): " +
          d.ageDays.toFixed(3) +
          "<br>TPD: " +
          d.tweetsPerDay.toFixed(3) +
          "<br>FLWRs: " +
          d.followersCount +
          "<br>FRNDs: " +
          d.friendsCount +
          "<br>FMs: " +
          d.followersMentions +
          "<br>Ms: " +
          d.mentions +
          "<br>Ts: " +
          d.statusesCount +
          "<br>" +
          d.rate.toFixed(3) +
          " WPM" +
          "<br>C: " +
          d.category +
          "<br>CA: " +
          d.categoryAuto;
        break;

      case "hashtag":
        tooltipString =
          "#" +
          d.nodeId +
          "<br>Ms: " +
          d.mentions +
          "<br>" +
          d.rate.toFixed(3) +
          " MPM" +
          "<br>C: " +
          d.category +
          "<br>CA: " +
          d.categoryAuto;
        break;
      default:
        tooltipString = ""
    }

    divTooltip.html(tooltipString);
    divTooltip
      .style("left", event.pageX - 40 + "px")
      .style("top", event.pageY - 50 + "px");
  };

  const labelMouseOver = function (event, d) {
    d.mouseHoverFlag = true;

    if (mouseMovingFlag) {
      self.toolTipVisibility(true);
    } else {
      self.toolTipVisibility(false);
    }

    d3.select(this).style("fill", palette.white);
    d3.select(this).style("fill-opacity", 1);
    d3.select(this).style("stroke-opacity", 1);
    d3.select(this).style("display", "unset");
    d3.select("#" + d.nodePoolId).style("fill-opacity", 1);
    d3.select("#" + d.nodePoolId).style("stroke", palette.white);
    d3.select("#" + d.nodePoolId).style("stroke-opacity", 1);

    switch (d.nodeType) {
      case "user":
        tooltipString =
          "@" +
          d.screenName +
          "<br>" +
          d.name +
          "<br>AGE (DAYS): " +
          d.ageDays.toFixed(3) +
          "<br>TPD: " +
          d.tweetsPerDay.toFixed(3) +
          "<br>FLWRs: " +
          d.followersCount +
          "<br>FRNDs: " +
          d.friendsCount +
          "<br>FMs: " +
          d.followersMentions +
          "<br>Ms: " +
          d.mentions +
          "<br>Ts: " +
          d.statusesCount +
          "<br>" +
          d.rate.toFixed(3) +
          " WPM" +
          "<br>C: " +
          d.category +
          "<br>CA: " +
          d.categoryAuto;
        break;

      case "hashtag":
        tooltipString =
          "#" +
          d.nodeId +
          "<br>Ms: " +
          d.mentions +
          "<br>" +
          d.rate.toFixed(3) +
          " MPM" +
          "<br>C: " +
          d.category +
          "<br>CA: " +
          d.categoryAuto;
        break;
      
      default:
        tooltipString = ""
    }

    divTooltip.html(tooltipString);
    divTooltip
      .style("left", event.pageX - 40 + "px")
      .style("top", event.pageY - 50 + "px");
  };

  function labelMouseOut(event, d) {
    d.mouseHoverFlag = false;

    self.toolTipVisibility(false);

    d3.select("#" + d.nodePoolId).style("fill-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select("#" + d.nodePoolId).style("stroke-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select(this).style("fill", labelFill(d));

    d3.select(this).style("fill-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select(this).style("display", function () {
      if (!d.isValid) {
        return "none";
      }
      if (isCategorized(d.category)) {
        return "unset";
      }
      if (d.rate > minRate) {
        return "unset";
      }
      if (
        d.nodeType === "hashtag" &&
        (d.mentions > minMentionsHashtags || d.nodeId.includes("trump"))
      ) {
        return "unset";
      }
      if (
        d.nodeType === "user" &&
        (d.followersCount > minFollowers ||
          d.mentions > minMentionsUsers ||
          d.screenName.toLowerCase().includes("trump") ||
          (d.name && d.name.toLowerCase().includes("trump")))
      ) {
        return "unset";
      }
      return "none";
    });
  }

  function nodeMouseOut(event, d) {
    d.mouseHoverFlag = false;

    self.toolTipVisibility(false);

    d3.select(this).style("fill-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select(this).style("stroke", circleStroke(d));

    d3.select(this).style("stroke-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select("#" + d.nodePoolId).style("fill-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select("#" + d.nodePoolId).style("stroke-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select("#" + d.nodePoolId + "_label").style("fill", labelFill(d));

    d3.select("#" + d.nodePoolId + "_label").style("fill-opacity", function () {
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select("#" + d.nodePoolId + "_label").style("display", function () {
      if (!d.isValid) {
        return "none";
      }
      if (isCategorized(d.category)) {
        return "unset";
      }
      if (d.rate > minRate) {
        return "unset";
      }
      if (d.nodeType === "hashtag" && (d.mentions > minMentionsHashtags || d.nodeId.includes("trump"))) {
        return "unset";
      }
      if (
        d.nodeType === "user" &&
        (d.followersCount > minFollowers ||
          d.mentions > minMentionsUsers ||
          d.screenName.toLowerCase().includes("trump") ||
          (d.name && d.name.toLowerCase().includes("trump")))
      ) {
        return "unset";
      }
      return "none";
    });
  }

  function labelText(d) {
    if (d.nodeType === "hashtag") {
      if (isCategorized(d.category) || isCategorized(d.categoryAuto)) {
        return "#" + d.nodeId.toUpperCase();
      }
      if (d.mentions >= minMentionsHashtags) {
        return "#" + d.nodeId.toUpperCase();
      }
      return "#" + d.nodeId.toLowerCase();
    }
    if (d.nodeType === "user") {
      if (d.screenName) {
        if (d.isBot){
          return "@" + d.screenName.toLowerCase() + " (BOT)";
        }
        if (isCategorized(d.category) || isCategorized(d.categoryAuto)) {
          return "@" + d.screenName.toUpperCase();
        }
        if (d.followersCount >= minFollowers) {
          return "@" + d.screenName.toUpperCase();
        }
        if (d.mentions >= minMentionsUsers) {
          return "@" + d.screenName.toUpperCase();
        }
        return "@" + d.screenName.toLowerCase();
      } else if (d.name) {
        if (isCategorized(d.category) || isCategorized(d.categoryAuto)) {
          return d.name.toUpperCase();
        }
        if (d.followersCount >= minFollowers) {
          return d.name.toUpperCase();
        }
        if (d.mentions >= minMentionsUsers) {
          return d.name.toUpperCase();
        }
        return d.name;
      } else {
        return "@UNKNOWN?";
      }
    }
    return d.nodeId;
  }

  function nodeClick(event, d) {

    document.dispatchEvent(new CustomEvent("nodeSearch", { detail: { node: d }}));
    
    switch (d.nodeType) {

      case "user":
        if (d.lastTweetId && d.lastTweetId !== undefined) {
          console.debug("LOADING TWITTER USER: https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId);
          window.open("https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId, "_blank");
        } 
        else {
          console.debug("LOADING TWITTER USER: https://twitter.com/" + d.screenName);
          window.open("https://twitter.com/" + d.screenName, "_blank");
        }
        break;

      case "hashtag":
        window.open("https://twitter.com/search?f=tweets&q=%23" + d.nodeId, "_blank");
        break;

      default:
        console.debug(`UNSUPPORTED NODE TYPE: ${d.nodeType}`);
    }
  }

  let nodeCircles;

  function circleFill(d) {
    if (d.isBot) {
      return botCircleFillColor;
    }
    if (
      d.isTopTerm &&
      !isCategorized(d.category) &&
      !isCategorized(d.categoryAuto)
    ) {
      return palette.white;
    }
    if (!isCategorized(d.category) && !isCategorized(d.categoryAuto)) {
      return palette.gray;
    }
      return d.categoryColor;
  }

  function circleStroke(d) {
    if (d.nodeType === "hashtag") {
      return palette.white;
    }
    if (d.categoryMismatch) {
      return palette.red;
    }
    if (d.categoryMatch) {
      return categoryMatchColor;
    }
    if (d.categoryAuto === "right") {
      return palette.darkyellow;
    }
    if (d.categoryAuto === "left") {
      return palette.blue;
    }
    if (d.categoryAuto === "positive") {
      return palette.green;
    }
    if (d.categoryAuto === "negative") {
      return palette.black;
    }
    return palette.white;
  }

  function circleStrokeWidth(d){
    if (d.nodeType === "hashtag" && d.isTopTerm) { return topTermStrokeWidth; }
    if (d.nodeType === "hashtag") { return 0.5 * defaultStrokeWidth; }
    if (d.isBot) { return botStrokeWidth; }
    if (d.categoryMismatch && d.following) { return categoryMismatchStrokeWidth; }
    if (d.categoryMismatch && !d.following) { return 0.5 * categoryMismatchStrokeWidth; }
    if (d.categoryMatch && d.following) { return categoryMatchStrokeWidth; }
    if (d.categoryMatch && !d.following) { return 0.5 * categoryMatchStrokeWidth; }
    if (d.isTopTerm && d.following) { return topTermStrokeWidth; }
    if (d.isTopTerm && !d.following) { return 0.5 * topTermStrokeWidth; }
    if (isCategorized(d.categoryAuto) && d.following) { return 2.0 * categoryAutoStrokeWidth; }
    if (isCategorized(d.categoryAuto) && !d.following) { return 2.0 * categoryAutoStrokeWidth; }
    if (d.following) { return defaultStrokeWidth; }
    return 0.5 * defaultStrokeWidth;
  }

  function circleFillOpacity(d){
    if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
    if (!isCategorized(d.category) && isCategorized(d.categoryAuto)) { return nodeLabelOpacityScaleTopTerm(0.5*d.ageMaxRatio); }
    return nodeLabelOpacityScale(d.ageMaxRatio);
  }

  function circleStrokeOpacity(d) { 
    if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
    return nodeLabelOpacityScale(d.ageMaxRatio);
  }

  function updateNodeCircles() {
    
    nodeCircles = nodeSvgGroup.selectAll("circle").data(
      nodeArray.filter(function (d) { return d.isValid; }),
      function (d) { return d.nodeId; }
    );

    // ENTER
    nodeCircles
      .enter()
      .append("circle")
      .style("display", function (d) {
        if (!d.isValid) { return "none"; }
        return "unset";
      })
      .attr("r", 1e-6)
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .style("fill", circleFill)
      .style("fill-opacity", circleFillOpacity)
      .style("stroke", circleStroke)
      .style("stroke-width", circleStrokeWidth)
      .style("stroke-opacity", circleStrokeOpacity)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick);

    // UPDATE
    nodeCircles
      .style("display", function (d) {
        if (!d.isValid) { return "none"; }
        return "unset"; 
      })
      .attr("r", function (d) {
        if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate)); }
        if (metricMode === "mentions") { return defaultRadiusScale(Math.sqrt(d.mentions)); }
      })
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .style("fill", circleFill)
      .style("fill-opacity", circleFillOpacity)
      .style("stroke", circleStroke)
      .style("stroke-width", circleStrokeWidth)
      .style("stroke-opacity", circleStrokeOpacity)

    // EXIT
    nodeCircles.exit().style("display", "none");
    return;
  }

  let nodeLabels;

  function labelFill(d) {
    if (d.mouseHoverFlag) {
      return palette.white;
    }
    if (d.isBot) {
      return botLabelFillColor;
    }
    if (d.isTopTerm && d.nodeType === "hashtag") {
      return palette.white;
    }
    if (d.isTopTerm && d.followersCount > minFollowers) {
      return palette.white;
    }
    if (!d.isTopTerm && d.followersCount > minFollowers) {
      return palette.lightgray;
    }
    if (d.isTopTerm) {
      return palette.lightgray;
    }
    return palette.lightgray;
  }

  function labelFontSize(d) {
    if (metricMode === "rate") {
      return nodeLabelSizeScale(d.rate);
    }
    if (metricMode === "mentions") {
      return nodeLabelSizeScale(d.mentions);
    }
  }

  function labelFontDisplay(d){
    if (!d.isValid) { return "none"; }
    if (isCategorized(d.category)) { return "unset"; }
    if (isCategorized(d.categoryAuto)) { return "unset"; }
    if (mouseMovingFlag) { return "unset"; }
    if (d.rate > minRate) { return "unset"; }
    if (d.nodeType === "user" &&
      (d.followersCount > minFollowers ||
        d.mentions > minMentionsUsers ||
        d.screenName.toLowerCase().includes("trump") ||
        (d.name && d.name.toLowerCase().includes("trump")))
    ) {
      return "unset";
    }
    if (
      d.nodeType === "hashtag" &&
      (d.mentions > minMentionsHashtags || d.nodeId.includes("trump"))
    ) {
      return "unset";
    }
    return "none";
  }

  function updateNodeLabels() {

    nodeLabels = nodeLabelSvgGroup
      .selectAll("text")
      .data(nodeArray, function (d) { return d.nodeId; });

    // UPDATE
    nodeLabels
      .text(labelText)
      .style("display", labelFontDisplay)
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y; })
      .style("fill", labelFill)
      .style("fill-opacity", function (d) {
        if (d.mouseHoverFlag) { return 1.0; }
        return nodeLabelOpacityScale(d.ageMaxRatio);
      })
      .style("font-size", labelFontSize);

    // ENTER
    nodeLabels
      .enter()
      .append("text")
      .attr("id", function (d) { return d.nodePoolId + "_label"; })
      .attr("nodeId", function (d) { return d.nodeId; })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y; })
      .text(labelText)
      .style("font-weight", function (d) {
        if (d.followersCount > minFollowers) { return "bold"; }
        return "normal";
      })
      .style("display", labelFontDisplay)
      .style("text-decoration", function (d) {
        if (d.isTopTerm && d.followersCount > minFollowers) { return "overline underline"; }
        if (!d.isTopTerm && d.followersCount > minFollowers) { return "underline"; }
        if (d.isTopTerm) { return "overline"; }
        return "none";
      })
      .style("text-decoration-style", function (d) {
        if (d.categoryVerified) { return "double"; }
        return "none";
      })
      .style("fill-opacity", function (d) {
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio);
      })
      .style("fill", labelFill)
      .style("font-size", labelFontSize)
      .on("mouseover", labelMouseOver)
      .on("mouseout", labelMouseOut)
      .on("click", nodeClick);
      
    // EXIT
    nodeLabels.exit().style("display", "none");

    return;
  }

  self.mouseMoving = function (isMoving) {
    if (isMoving && !mouseMovingFlag) {
      mouseMovingFlag = isMoving;
      updateNodeLabels();
    } else {
      mouseMovingFlag = isMoving;
    }
  };

  function isCategorized(category) {
    if (category && category !== "none") {
      return true;
    }
    return false;
  }

  // const categoryFocus = function (d, axis) {
  //   if (
  //     (autoCategoryFlag && isCategorized(d.categoryAuto)) ||
  //     (!isCategorized(d.category) && isCategorized(d.categoryAuto))
  //   ) {
  //     return foci[d.categoryAuto][axis];
  //   }
  //   if (isCategorized(d.category)) {
  //     return foci[d.category];
  //   }
  //   return foci.default[axis];
  // };

  function focus(focalPoint) {
    switch (focalPoint) {
      case "left":
        return {
          x: randomIntFromInterval(
            xMinRatioLeft * width,
            xMaxRatioLeft * width
          ),
          y: randomIntFromInterval(
            yMinRatioLeft * height,
            yMaxRatioLeft * height
          ),
        };
      case "right":
        return {
          x: randomIntFromInterval(
            xMinRatioRight * width,
            xMaxRatioRight * width
          ),
          y: randomIntFromInterval(
            yMinRatioRight * height,
            yMaxRatioRight * height
          ),
        };
      case "positive":
        return {
          x: randomIntFromInterval(
            xMinRatioPositive * width,
            xMaxRatioPositive * width
          ),
          y: randomIntFromInterval(
            yMinRatioPositive * height,
            yMaxRatioPositive * height
          ),
        };
      case "negative":
        return {
          x: randomIntFromInterval(
            xMinRatioNegative * width,
            xMaxRatioNegative * width
          ),
          y: randomIntFromInterval(
            yMinRatioNegative * height,
            yMaxRatioNegative * height
          ),
        };
      case "neutral":
        return {
          x: randomIntFromInterval(
            xMinRatioNeutral * width,
            xMaxRatioNeutral * width
          ),
          y: randomIntFromInterval(
            yMinRatioNeutral * height,
            yMaxRatioNeutral * height
          ),
        };
      case "none":
        return {
          x: randomIntFromInterval(
            xMinRatioDefault * width,
            xMaxRatioDefault * width
          ),
          y: randomIntFromInterval(
            yMinRatioDefault * height,
            yMaxRatioDefault * height
          ),
        };
      default:
        return {
          x: randomIntFromInterval(
            xMinRatioDefault * width,
            xMaxRatioDefault * width
          ),
          y: randomIntFromInterval(
            yMinRatioDefault * height,
            yMaxRatioDefault * height
          ),
        };
    }
  }

  let nodeAddQReady = true;
  let nodePoolIdcircle;

  function processNodeAddQ(){

    if (nodeIdHashMap.size > maxNodes) {
      maxNodes = nodeIdHashMap.size;
    }

    if (nodeAddQReady && nodeAddQ.length > 0) {
      nodeAddQReady = false;

      const newNode = nodeAddQ.shift();

      if (nodeIdHashMap.has(newNode.nodeId)) {

        const nodePoolId = nodeIdHashMap.get(newNode.nodeId);
        const currentNode = localNodeHashMap.get(nodePoolId);

        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = Date.now();
        currentNode.isDead = false;
        currentNode.isMaxNode = false;
        currentNode.isValid = true;
        currentNode.mouseHoverFlag = false;
        currentNode.newFlag = true;

        currentNode.ageDays = newNode.ageDays;
        currentNode.tweetsPerDay = newNode.tweetsPerDay;
        currentNode.rank = newNode.rank;
        currentNode.rate = newNode.rate;
        currentNode.mentions = newNode.mentions;
        currentNode.isBot = newNode.isBot;
        currentNode.isTweeter = newNode.isTweeter;
        currentNode.isIgnored = newNode.isIgnored;
        currentNode.isTopTerm = newNode.isTopTerm;
        currentNode.isTrendingTopic = newNode.isTrendingTopic;
        currentNode.category = newNode.category;
        currentNode.categoryAuto = newNode.categoryAuto;
        currentNode.categoryColor = newNode.categoryColor;
        currentNode.categoryMismatch = newNode.categoryMismatch;
        currentNode.categoryMatch = newNode.categoryMatch;
        currentNode.categoryVerified = newNode.categoryVerified;
        currentNode.lastTweetId = newNode.lastTweetId;

        if (newNode.nodeType === "user") {
          currentNode.following = newNode.following;
          currentNode.friendsCount = newNode.friendsCount || 0;
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);
        nodeAddQReady = true;

        return;

      } 
      else {

        const currentNode = nodePool.use();

        nodeIdHashMap.set(newNode.nodeId, currentNode.nodePoolId);

        currentNode.ageDays = newNode.ageDays;
        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = Date.now();
        currentNode.category = newNode.category;
        currentNode.categoryAuto = newNode.categoryAuto;
        currentNode.categoryColor = newNode.categoryColor;
        currentNode.categoryMatch = newNode.categoryMatch;
        currentNode.categoryMismatch = newNode.categoryMismatch;
        currentNode.categoryVerified = newNode.categoryVerified;
        currentNode.fullName = newNode.fullName;
        currentNode.hashtagId = newNode.hashtagId;
        currentNode.isCategory = newNode.isCategory || false;
        currentNode.isDead = false;
        currentNode.isIgnored = newNode.isIgnored;
        currentNode.isMaxNode = false;
        currentNode.isBot = newNode.isBot || false;
        currentNode.isTweeter = newNode.isTweeter || false;
        currentNode.isTopTerm = newNode.isTopTerm || false;
        currentNode.isTrendingTopic = newNode.isTrendingTopic || false;
        currentNode.isValid = true;
        currentNode.lastTweetId = newNode.lastTweetId;
        currentNode.mentions = newNode.mentions;
        currentNode.mouseHoverFlag = false;
        currentNode.name = newNode.name;
        currentNode.newFlag = true;
        currentNode.nodeId = newNode.nodeId;
        currentNode.nodeType = newNode.nodeType;
        currentNode.rank = newNode.rank;
        currentNode.rate = newNode.rate;
        currentNode.screenName = newNode.screenName;
        currentNode.statusesCount = newNode.statusesCount;
        currentNode.tweetsPerDay = newNode.tweetsPerDay;
        currentNode.vx = 1e-6;
        currentNode.vy = 1e-6;
        currentNode.x = initialXposition * width;
        currentNode.y = initialYposition * height;

        if (newNode.nodeType === "user") {
          currentNode.following = newNode.following;
          currentNode.friendsCount = newNode.friendsCount || 0;
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        if (
          isCategorized(newNode.category) ||
          isCategorized(newNode.categoryAuto)
        ) {
          if (autoCategoryFlag && isCategorized(newNode.categoryAuto)) {
            currentNode.x = focus(newNode.categoryAuto).x;
            currentNode.y = focus(newNode.categoryAuto).y;
          } else if (
            isCategorized(newNode.categoryAuto) &&
            !isCategorized(newNode.category)
          ) {
            currentNode.x = focus(newNode.categoryAuto).x;
            currentNode.y = focus(newNode.categoryAuto).y;
          } else if (isCategorized(newNode.category)) {
            currentNode.x = focus(newNode.category).x;
            currentNode.y = focus(newNode.category).y;
          }
        } else {
          currentNode.x = focus("none").x;
          currentNode.y = focus("none").y;
        }

        nodePoolIdcircle = document.getElementById(currentNode.nodePoolId);

        if (nodePoolIdcircle) {
          nodePoolIdcircle.setAttribute("r", 1e-6);
          nodePoolIdcircle.setAttribute("display", "none");
          nodePoolIdcircle.setAttribute("fill-opacity", 1e-6);
          nodePoolIdcircle.setAttribute("stroke-opacity", 1e-6);
        }

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);

        nodeAddQReady = true;

        return;

      }

    }

    return;
  }

  let previousMaxRateMetric = 0;

  // function drawSimulation(){

  //   async.parallel(
  //     {
  //       updateNodeCirclesSeries: function (cb) {
  //         updateNodeCircles(cb);
  //       },
  //       updateNodeLabelsSeries: function (cb) {
  //         updateNodeLabels(cb);
  //       },
  //     },
      
  //     function drawSimulationCallback() {

  //       if (
  //         (metricMode === "rate" &&
  //           newCurrentMaxRateMetricFlag &&
  //           Math.abs(currentMaxRateMetric - previousMaxRateMetric) /
  //             currentMaxRateMetric >
  //             minRateMetricChange) ||
  //         (metricMode === "mentions" && newCurrentMaxMentionsMetricFlag)
  //       ) {
  //         if (metricMode === "rate") {
  //           newCurrentMaxRateMetricFlag = false;
  //           previousMaxRateMetric = currentMax.rate.rate;
  //         }
  //         if (metricMode === "mentions") {
  //           newCurrentMaxMentionsMetricFlag = false;
  //         }

  //         nodeLabelSizeScale = d3
  //           .scaleLinear()
  //           .domain([1, currentMetricModeDomainMax])
  //           .range([fontSizeMin, fontSizeMax])
  //           .clamp(true);

  //         defaultRadiusScale = d3
  //           .scaleLinear()
  //           .domain([0, currentMetricModeDomainMaxSqrt])
  //           .range([nodeRadiusMin, nodeRadiusMax])
  //           .clamp(true);
  //       }

  //       return;
  //     }
  //   );
  // }

  function drawSimulation(){

    updateNodeCircles()
    updateNodeLabels()

    if ((metricMode === "rate" && newCurrentMaxRateMetricFlag && Math.abs(currentMaxRateMetric - previousMaxRateMetric) / currentMaxRateMetric > minRateMetricChange)
      || (metricMode === "mentions" && newCurrentMaxMentionsMetricFlag)) {

      if (metricMode === "rate") {
        newCurrentMaxRateMetricFlag = false;
        previousMaxRateMetric = currentMax.rate.rate;
      }
      
      if (metricMode === "mentions") {
        newCurrentMaxMentionsMetricFlag = false;
      }

      nodeLabelSizeScale = d3
        .scaleLinear()
        .domain([1, currentMetricModeDomainMax])
        .range([fontSizeMin, fontSizeMax])
        .clamp(true);

      defaultRadiusScale = d3
        .scaleLinear()
        .domain([0, currentMetricModeDomainMaxSqrt])
        .range([nodeRadiusMin, nodeRadiusMax])
        .clamp(true);
    }

    return;
      
  }

  let updateSimulationReady = true;

  function updateSimulation(){
    if (updateSimulationReady) {
      updateSimulationReady = false;
      processNodeAddQ();
      nodeArray = ageNodes();
      simulation.nodes(nodeArray);
      updateSimulationReady = true;
      return;
    }
    else{
      console.debug(`updateSimulationReady: ${updateSimulationReady} NOT READY`)
      return;
    }
  }

  function ticked(){
    updateSimulation();
    drawSimulation();
    return;
  }

  self.setChargeSliderValue = function (value) {
    console.debug("SET CHARGE: " + value);
    config.settings.charge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.addNode = function (n) {

    if (nodeAddQ.length >= config.settings.maxNodes) {
      return;
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
    }
    
    n.age = 1e-6;
    n.ageUpdated = Date.now();
    n.ageMaxRatio = 1e-6;
    n.rank = -1;
    n.newFlag = true;
    n.following = n.following !== undefined ? n.following : false;
    n.followersCount = n.followersCount ? parseInt(n.followersCount) : 0;
    n.friendsCount = n.friendsCount ? parseInt(n.friendsCount) : 0;
    n.mentions = n.mentions ? parseInt(n.mentions) : 0;

    n.ageDays = n.ageDays ? n.ageDays : 0;
    n.tweetsPerDay = n.tweetsPerDay ? n.tweetsPerDay : 0;

    if (n.nodeType === "user") {
      n.followersMentions = n.mentions + n.followersCount;
    }

    if (n.mentions > currentMax.mentions.mentions) {
      newCurrentMaxMentionsMetricFlag = true;

      currentMax.mentions.nodeType = n.nodeType;
      currentMax.mentions.nodeId = n.nodeId;
      currentMax.mentions.screenName = n.screenName;
      currentMax.mentions.mentions = n.mentions;
      currentMax.mentions.rate = n.rate;
      currentMax.mentions.timeStamp = Date.now();

      currentMetricModeDomainMaxSqrt = Math.sqrt(
        currentMax[metricMode][metricMode]
      );
      currentMetricModeDomainMax = currentMax[metricMode][metricMode];
    }

    if (n.rate > currentMax.rate.rate) {
      newCurrentMaxRateMetricFlag = true;

      currentMax.rate.nodeType = n.nodeType;
      currentMax.rate.nodeId = n.nodeId;
      currentMax.rate.screenName = n.screenName;
      currentMax.rate.rate = n.rate;
      currentMax.rate.mentions = n.mentions;
      currentMax.rate.timeStamp = Date.now();

      if (metricMode === "rate") {
        currentMaxRateMetric = n.rate;
      }

      currentMetricModeDomainMaxSqrt = Math.sqrt(
        currentMax[metricMode][metricMode]
      );
      currentMetricModeDomainMax = currentMax[metricMode][metricMode];
    }

    nodeAddQ.push(n);

  };

  self.addGroup = function () {
    // not used
  };

  self.addSession = function () {
    // not used
  };

  self.initD3timer = function() {

    console.log(`initD3timer`)
    console.log({nodeArray})
    console.log({charge})
    console.log({velocityDecay})
    console.log({gravity})
    console.log({forceXmultiplier})
    console.log({forceYmultiplier})

    simulation = d3.forceSimulation(nodeArray)
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX()
        .x((d) => {
          if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))) {
            return foci[d.categoryAuto].x;
          }
          if (isCategorized(d.category)) { return foci[d.category].x; }
          return foci.default.x;
        })
        .strength(() => forceXmultiplier * gravity)
      )
      .force("forceY", d3.forceY()
        .y((d) => {
          if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))) {
            return foci[d.categoryAuto].y;
          }
          if (isCategorized(d.category)) { return foci[d.category].y; }
          return foci.default.y;
        })
        .strength(() => forceYmultiplier * gravity)
      )
      .force("collide", d3.forceCollide()
        .radius((d) => {
          if (metricMode === "rate") { return (collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate))); }
          if (metricMode === "mentions") { return (collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions))); }
        })
        .iterations(collisionIterations)
        .strength(1.0)
      )
      .velocityDecay(velocityDecay)
      .on("tick", ticked);

    simulation.on("end", console.log("*** END"))

    // *** NEEDED FOR SIM TO RUN FOREVER: alphaTarget > alphaMin (default 0.001)
    simulation.alphaTarget(0.7).restart();

    return
  };

  self.simulationControl = function (op) {
    // console.log(`simulationControl | op: ${op}`)

    switch (op) {
      case "RESET":
        self.reset();
        runningFlag = false;
        break;
      case "START":
        self.initD3timer();
        self.resize();
        simulation.alphaTarget(0.7).restart();
        enableAgeNodes = true
        runningFlag = true;
        break;
      case "RESUME":
        resumeTimeStamp = Date.now();
        enableAgeNodes = true
        runningFlag = true;
        // console.log(`simulationControl | op: ${op}  | resumeTimeStamp: ${resumeTimeStamp}`)
        simulation.alphaTarget(0.7).restart();
        break;
      case "FREEZE":
        if (!freezeFlag) {
          enableAgeNodes = false
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
        break;
      case "PAUSE":
        // resumeTimeStamp = 0;
        enableAgeNodes = false
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
        // console.log(`simulationControl | op: ${op}  | resumeTimeStamp: ${resumeTimeStamp}`)
        break;
      case "STOP":
        enableAgeNodes = false
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
        break;
      case "RESTART":
        simulation.alphaTarget(0.7).restart();
        enableAgeNodes = true
        runningFlag = true;

        break;
      default:
        console.error("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
    }
  };

  let resizeTimeOut;

  self.resize = function () {
    clearTimeout(resizeTimeOut);

    resizeTimeOut = setTimeout(function () {
      resetCurrentMax();

      // d3image = d3.select("#d3group");

      width = getWindowDimensions().width;
      height = getWindowDimensions().height;

      console.log("RESIZE: " + width + "x" + height);

      foci = {
        left: { x: xFocusLeftRatio * width, y: yFocusLeftRatio * height },
        right: { x: xFocusRightRatio * width, y: yFocusRightRatio * height },

        positive: {
          x: xFocusPositiveRatio * width,
          y: yFocusPositiveRatio * height,
        },
        negative: {
          x: xFocusNegativeRatio * width,
          y: yFocusNegativeRatio * height,
        },

        neutral: {
          x: xFocusNeutralRatio * width,
          y: yFocusNeutralRatio * height,
        },
        none: { x: xFocusDefaultRatio * width, y: yFocusDefaultRatio * height },

        default: {
          x: xFocusDefaultRatio * width,
          y: yFocusDefaultRatio * height,
        },
      };

      console.log("FOCI: " + jsonPrint(foci));

      nodeRadiusMin = nodeRadiusRatioMin * width;
      nodeRadiusMax = nodeRadiusRatioMax * width;

      defaultRadiusScale = d3
        .scaleLinear()
        .domain([0, currentMetricModeDomainMaxSqrt])
        .range([nodeRadiusMin, nodeRadiusMax])
        .clamp(true);

      fontSizeMin = fontSizeRatioMin * height;
      fontSizeMax = fontSizeRatioMax * height;

      nodeLabelSizeScale = d3
        .scaleLinear()
        .domain([1, currentMetricModeDomainMax])
        .range([fontSizeMin, fontSizeMax])
        .clamp(true);

      svgMain
        .attr("width", width)
        .attr("height", height)
        .attr("x", 1e-6)
        .attr("y", 1e-6);

      if (simulation) {
        simulation
          .force("charge", d3.forceManyBody().strength(charge))
          .force("forceX", d3.forceX()
              .x(function forceXfunc(d) {
                if (
                  (autoCategoryFlag && isCategorized(d.categoryAuto)) ||
                  (!isCategorized(d.category) && isCategorized(d.categoryAuto))
                ) {
                  return foci[d.categoryAuto].x;
                }
                if (isCategorized(d.category)) {
                  return foci[d.category].x;
                }
                return foci.default.x;
              })
              .strength(function strengthFunc() {
                return forceXmultiplier * gravity;
              })
          )
          .force("forceY", d3.forceY()
              .y(function forceYfunc(d) {
                if (
                  (autoCategoryFlag && isCategorized(d.categoryAuto)) ||
                  (!isCategorized(d.category) && isCategorized(d.categoryAuto))
                ) {
                  return foci[d.categoryAuto].y;
                }
                if (isCategorized(d.category)) {
                  return foci[d.category].y;
                }
                return foci.default.y;
              })
              .strength(function strengthFunc() {
                return forceYmultiplier * gravity;
              })
          )
          .force("collide", d3.forceCollide()
              .radius(function forceCollideFunc(d) {
                if (metricMode === "rate") {
                  return (
                    collisionRadiusMultiplier *
                    defaultRadiusScale(Math.sqrt(d.rate))
                  );
                }
                if (metricMode === "mentions") {
                  return (
                    collisionRadiusMultiplier *
                    defaultRadiusScale(Math.sqrt(d.mentions))
                  );
                }
              })
              .iterations(collisionIterations)
          )
          .velocityDecay(velocityDecay);
      }

    }, 200);
  };

  // ==========================================

  document.defaultView.addEventListener(
    "resize",
    function resizeFunc() {
      self.resize();
    },
    true
  );

  document.addEventListener(
    "resize",
    function resizeFunc() {
      self.resize();
    },
    true
  );

  self.reset = function () {
    console.info("RESET");
    mouseHoverFlag = false;
    localNodeHashMap.clear();
    nodeIdHashMap.clear();
    nodeArray.length = 0;
    self.toolTipVisibility(false);
    self.resetDefaultForce();
    self.resize();
    resetCurrentMax();
  };

  return self;
}
