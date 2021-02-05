/* global d3, deePool, HashMap, panzoom, */

function ViewForceLinks (inputConfig) {

  const DISPLAY_TWEETS = false;
  const DISPLAY_LINKS = false;
  const LINK_DISTANCE = 10;
  const LINK_STRENGTH = 0.2;

  console.log("@@@@@@@ ViewForceLinks @@@@@@@@");
  console.log({inputConfig})

  function getWindowDimensions () {

    // chrome on mbp2 needs this for correct height. no clue why!
    if (window.innerWidth !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }

    if (window.outerWidth !== "undefined") {
      return { width: window.outerWidth, height: window.outerHeight };
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

  console.log({width})
  console.log({height})

  const heightOffsetRatio = 0.5; // on add new node

  let nodeArray = [];
  let linkArray = [];

  const config = inputConfig || {};

  config.settings = config.settings || {};
  config.defaults = config.defaults || {};

  config.settings.displayTweets = DISPLAY_TWEETS;
  config.settings.displayLinks = DISPLAY_LINKS;
  config.settings.linkDistance = LINK_DISTANCE;
  config.settings.linkStrength = LINK_STRENGTH;
  config.settings.adjustedAgeRateScaleRange = {};
  config.settings.adjustedAgeRateScaleRange.min = 1.0;
  config.settings.adjustedAgeRateScaleRange.max = 20.0;
  
  config.settings.initialXposition = config.settings.initialXposition || 0.5;
  config.settings.initialYposition = config.settings.initialYposition || 0.9;

  config.settings.minRateMetricChange = config.settings.minRateMetricChange || 0.5;

  config.settings.focus = config.settings.focus || {};

  config.settings.focus.leftRatio = {};
  config.settings.focus.leftRatio.x = 0.2;
  config.settings.focus.leftRatio.y = 0.4;
  
  config.settings.focus.rightRatio = {};
  config.settings.focus.rightRatio.x = 0.8;
  config.settings.focus.rightRatio.y = 0.4;
  
  config.settings.focus.positiveRatio = {};
  config.settings.focus.positiveRatio.x = 0.5;
  config.settings.focus.positiveRatio.y = 0.2;
  
  config.settings.focus.negativeRatio = {};
  config.settings.focus.negativeRatio.x = 0.5;
  config.settings.focus.negativeRatio.y = 0.85;
  
  config.settings.focus.neutralRatio = {};
  config.settings.focus.neutralRatio.x = 0.5;
  config.settings.focus.neutralRatio.y = 0.4;
  
  config.settings.focus.defaultRatio = {};
  config.settings.focus.defaultRatio.x = 0.5;
  config.settings.focus.defaultRatio.y = 0.4;
  
  let foci = {
    left: { 
      x: config.settings.focus.leftRatio.x * width, 
      y: config.settings.focus.leftRatio.y * height
    },
    right: { 
      x: config.settings.focus.rightRatio.x * width, 
      y: config.settings.focus.rightRatio.y * height
    },
    neutral: { 
      x: config.settings.focus.neutralRatio.x * width, 
      y: config.settings.focus.neutralRatio.y * height
    },
    positive: { 
      x: config.settings.focus.positiveRatio.x * width, 
      y: config.settings.focus.positiveRatio.y * height
    },
    negative: { 
      x: config.settings.focus.negativeRatio.x * width, 
      y: config.settings.focus.negativeRatio.y * height
    },
    none: { 
      x: config.settings.focus.defaultRatio.x * width, 
      y: config.settings.focus.defaultRatio.y * height
    },
    default: { 
      x: config.settings.focus.defaultRatio.x * width, 
      y: config.settings.focus.defaultRatio.y * height
    },
  };

  const updateFoci = (w, h) => ({
    left: { 
      x: config.settings.focus.leftRatio.x * w, 
      y: config.settings.focus.leftRatio.y * h
    },
    right: { 
      x: config.settings.focus.rightRatio.x * w, 
      y: config.settings.focus.rightRatio.y * h
    },
    neutral: { 
      x: config.settings.focus.neutralRatio.x * w, 
      y: config.settings.focus.neutralRatio.y * h
    },
    positive: { 
      x: config.settings.focus.positiveRatio.x * w, 
      y: config.settings.focus.positiveRatio.y * h
    },
    negative: { 
      x: config.settings.focus.negativeRatio.x * w, 
      y: config.settings.focus.negativeRatio.y * h
    },
    none: { 
      x: config.settings.focus.defaultRatio.x * w, 
      y: config.settings.focus.defaultRatio.y * h
    },
    default: { 
      x: config.settings.focus.defaultRatio.x * w, 
      y: config.settings.focus.defaultRatio.y * h
    }
  }) 

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
  const minRate = config.settings.minRate || DEFAULT_MIN_RATE;

  const DEFAULT_MIN_FOLLOWERS = 5000;
  const minFollowers = config.settings.minFollowers || DEFAULT_MIN_FOLLOWERS;

  const DEFAULT_MIN_MENTIONS = 1000;
  const minMentionsUsers = config.settings.minMentionsUsers || DEFAULT_MIN_MENTIONS;
  const minMentionsHashtags = config.settings.minMentionsHashtags || 100;

  const DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9; // age users with many followers at a slower rate

  let mouseMovingFlag = false;

  let simulation;

  let enableAgeNodes = true;
  let newCurrentMaxMentionsMetricFlag = true;
  let newCurrentMaxRateMetricFlag = true;

  let resumeTimeStamp = 0;

  const sliderPercision = 5;

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
  currentMax.rate.nodeId = "14607119";
  currentMax.rate.nodeType = "user";
  currentMax.rate.screenName = "threecee";
  currentMax.rate.rate = 0.1;
  currentMax.rate.mentions = 0.1;
  currentMax.rate.timeStamp = Date.now();

  currentMax.mentions = {};
  currentMax.mentions.nodeId = "what";
  currentMax.mentions.nodeType = "hashtag";
  currentMax.mentions.screenName = "whatever";
  currentMax.mentions.rate = 0.1;
  currentMax.mentions.mentions = 0.1;
  currentMax.mentions.timeStamp = Date.now();

  function resetCurrentMax() {
    currentMax.rate.nodeId = "14607119";
    currentMax.rate.nodeType = "user";
    currentMax.rate.screenName = "threecee";
    currentMax.rate.rate = 0.1;
    currentMax.rate.mentions = 0.1;
    currentMax.rate.timeStamp = Date.now();

    currentMax.mentions.nodeId = "what";
    currentMax.mentions.nodeType = "hashtag";
    currentMax.mentions.screenName = "whatever";
    currentMax.mentions.rate = 0.1;
    currentMax.mentions.mentions = 0.1;
    currentMax.mentions.timeStamp = Date.now();
  }

  function Node(nodePoolId) {
    this.isFixedNode = false;

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
    this.isIgnored = false;
    this.isTopTerm = false;
    this.isTrendingTopic = false;
    this.isValid = false;
    this.lastTweetId = false;
    this.mentions = 0;
    this.mouseHoverFlag = false;
    this.name = "";
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
    this.x = config.settings.initialXposition * width;
    this.y = config.settings.initialYposition * height;
  }

  let nodePoolIndex = 0;

  const nodePool = deePool.create(function makeNode() {
    nodePoolIndex += 1;
    return new Node("nodePoolId_" + nodePoolIndex);
  });

  nodePool.grow(2 * config.settings.maxNodesLimit);

  console.log(`POOL NODES INIT | SIZE: ${nodePool.size()}`)

  let autoCategoryFlag = config.settings.autoCategoryFlag;
  let metricMode = config.settings.metricMode;
  let charge = config.settings.charge;
  let linkStrength = config.settings.linkStrength;
  let linkDistance = config.settings.linkDistance;
  let gravity = config.settings.gravity;
  let displayTweets = config.settings.displayTweets;
  let displayLinks = config.settings.displayLinks;

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

  if (config.settings.panzoom.transform === undefined) {
    config.settings.panzoom.transform = {};
    config.settings.panzoom.transform.ratio = 1.0;
    config.settings.panzoom.transform.scale = config.settings.panzoom.transform.scale || 0.6;
    config.settings.panzoom.transform.x = config.settings.panzoom.transform.x || 0.5 * width;
    config.settings.panzoom.transform.y = config.settings.panzoom.transform.y || 0.2 * height;
  }

  const maxRateMentions = {};
  maxRateMentions.rateNodeType = "hashtag";
  maxRateMentions.mentionsNodeType = "hashtag";
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

  console.log("VIEW FORCE CONFIG");

  let testMode = false;
  let freezeFlag = false;

  const minOpacity = 0.2;

  const DEFAULT_AGE_RATE = 1.0;

  const localNodeHashMap = new HashMap();
  const nodeIdToPoolIdHashMap = new HashMap();

  const nodeAddQ = [];
  let maxNodeAddQ = 0;
  let maxNodes = 0;

  let runningFlag = false;

  self.getWidth = function () {
    return width;
  };

  self.getHeight = function () {
    return height;
  };

  self.displayTweets = function (value) {
    console.debug("DISPLAY TWEETS: " + value);
    config.settings.displayTweets = value;
    displayTweets = value;
    return displayTweets;
  };

  self.displayLinks = function (value) {
    console.debug("DISPLAY LINKS: " + value);
    config.settings.displayLinks = value;
    displayLinks = value;

    if (!displayLinks){
      linkArray = [];
    }

    return displayLinks;
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

  const defaultStrokeWidth = "0.4em";
  const topTermStrokeWidth = "0.5em";

  const botStrokeWidth = "0.5em";
  const botCircleFillColor = palette.black;
  const botLabelFillColor = palette.white;

  const fixedNodeFillColor = palette.red;
  const fixedNodeStrokeColor = palette.blue;

  const categoryMatchColor = palette.green;
  const categoryMatchStrokeWidth = "0.5em";
  const categoryMismatchStrokeWidth = "0.6em";
  const categoryAutoStrokeWidth = "0.2em";

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
    // .scaleLinear()
    .scaleSqrt()
    .domain([1, config.settings.maxNodesLimit])
    .range([config.settings.adjustedAgeRateScaleRange.min, config.settings.adjustedAgeRateScaleRange.max]);

  const d3image = d3.select("#d3group");

  const svgMain = d3image
    .append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", '100%')
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  const svgViewForceLayoutArea = svgMain
    .append("svg:g")
    .attr("id", "svgViewForceLayoutArea")
    .attr("width", '100%')
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  const panzoomElement = document.getElementById("svgViewForceLayoutArea");

  const panzoomInit = {}
  panzoomInit.autocenter = config.settings.panzoom.autocenter || true;
  panzoomInit.bounds = config.settings.panzoom.bounds || true;
  panzoomInit.initialZoom = config.settings.panzoom.transform.scale || 0.6;
  panzoomInit.initialX = config.settings.panzoom.transform.x || width*0.5;
  panzoomInit.initialY = config.settings.panzoom.transform.y || height*0.5;

  const panzoomInstance = panzoom(panzoomElement, panzoomInit);

  const panzoomEvent = new CustomEvent("panzoomEvent", {
    bubbles: true,
    detail: { transform: () => config.settings.panzoomTransform },
  });

  let panzoomCurrentEvent;
  let firstPanzoomEvent = true;

  panzoomInstance.on("transform", function (e) {
    panzoomCurrentEvent = e;
    if (!firstPanzoomEvent) { resetZoomEndTimeout(); }
    firstPanzoomEvent = false;
  });

  let zoomEndTimeout;

  const resetZoomEndTimeout = function () {
    clearTimeout(zoomEndTimeout);

    zoomEndTimeout = setTimeout(function () {
      config.settings.panzoom.transform = panzoomCurrentEvent.getTransform();
      console.log(
        "panzoomTransform transform end\n",
        jsonPrint(config.settings.panzoom.transform)
      );
      document.dispatchEvent(panzoomEvent);
    }, 1000);
  };

  console.log("panzoomInstance zoomAbs\n", jsonPrint(config.settings.panzoom.transform));

  const linkSvgGroup = svgViewForceLayoutArea
    .append("svg:g")
    .attr("id", "linkSvgGroup");
    
  const nodeSvgGroup = svgViewForceLayoutArea
    .append("svg:g")
    .attr("id", "nodeSvgGroup");
    
  const nodeLabelSvgGroup = svgViewForceLayoutArea
    .append("svg:g")
    .attr("id", "nodeLabelSvgGroup");

  d3.select("body").style("cursor", "default");

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
  self.getMaxAgeRate = function () {
    return maxAgeRate;
  };
  self.getPanzoomTransform = function () {
    return config.settings.panzoom.transform;
  };
  
  self.setStats = function (stats) {
    console.log("setStats" + "\nSTATS\n" + jsonPrint(stats));
  };

  self.setEnableAgeNodes = function (enabled) {
    enableAgeNodes = enabled;
    config.settings.enableAgeNodes = enabled;
  };

  self.setMaxNodesLimit = function (mNodesLimit) {
    config.settings.maxNodesLimit = mNodesLimit;
    console.debug("SET MAX NODES LIMIT: " + config.settings.maxNodesLimit);
  };

  self.setNodeMaxAge = function (mAge) {
    nodeMaxAge = mAge;
    config.settings.nodeMaxAge = mAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  };

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

    simulation.force("forceX", d3.forceX()
      .x(function (d) {
        if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))) { 
          return foci[d.categoryAuto].x; 
        }
        if (isCategorized(d.category)) { return foci[d.category].x; }
        return foci.default.x;
      })
      .strength(function () { return forceXmultiplier * gravity; })
    );

    simulation.force("forceY",d3.forceY()
      .y(function (d) {
        if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))
        ) {
          return foci[d.categoryAuto].y;
        }
        if (isCategorized(d.category)) { return foci[d.category].y; }
        return foci.default.y;
      })
      .strength(function () { return forceYmultiplier * gravity; })
    );
  };

  self.setTransitionDuration = function (value) {
    console.debug("UPDATE TRANSITION DURATION: " + value);
    config.settings.transitionDuration = value;
  };

  self.setCharge = function (value) {
    console.debug("UPDATE CHARGE: " + value);
    config.settings.charge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.setLinkStrength = function (value) {
    console.debug("UPDATE LINK STRENGTH: " + value);
    config.settings.linkStrength = value;
    linkStrength = value;
    simulation.force("link").strength(value);
    simulation.alpha(1).restart();
  };

  self.setLinkDistance = function (value) {
    console.debug("UPDATE LINK DISTANCE: " + value);
    config.settings.linkDistance = value;
    linkDistance = value;
    simulation.force("link").distance(value);
    simulation.alpha(1).restart();
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
    console.warn("RESET VIEW DEFAULT FORCE");
    self.setTransitionDuration(config.settings.transitionDuration);
    self.setNodeMaxAge(config.settings.nodeMaxAge);
    self.setCharge(config.settings.charge);
    self.setLinkDistance(config.settings.linkDistance);
    self.setLinkStrength(config.settings.linkStrength);
    self.setVelocityDecay(config.settings.velocityDecay);
    self.setGravity(config.settings.gravity);
  };

  function resetNode(n){
    n.age = 1e-6;
    n.ageMaxRatio = 1e-6;
    n.ageUpdated = Date.now();
    n.category = false;
    n.categoryAuto = false;
    n.categoryColor = "#FFFFFF";
    n.categoryMatch = false;
    n.categoryMismatch = false;
    n.categoryVerified = false;
    n.favoriteCount = 0;
    n.replyCount = 0;
    n.retweetCount = 0;
    n.quoteCount = 0;
    n.following = false;
    n.followersCount = 0;
    n.followersMentions = 0;
    n.friendsCount = 0;
    n.fullName = "";
    n.hashtagId = false;
    n.index = 0;
    n.isCategorized = false;
    n.isTopTerm = false;
    n.isTrendingTopic = false;
    n.isValid = false;
    n.isTweeter = false;
    n.tweeterId = "";
    n.lastTweetId = false;
    n.mentions = 0;
    n.mouseHoverFlag = false;
    n.name = "";
    n.nodeId = "";
    n.nodeType = "user";
    n.rank = -1;
    n.rate = 1e-6;
    n.screenName = "";
    n.statusesCount = 0;
    n.text = "";
    n.userMentions = [];
    n.hashtags = []
    n.vx = 1e-6;
    n.vy = 1e-6;
    n.x = config.settings.initialXposition * width;
    n.y = config.settings.initialYposition * height;

    if (document.getElementById(n.nodePoolId)){
      document.getElementById(n.nodePoolId).setAttribute("display", "none");
    }

    if (document.getElementById(n.nodePoolId + "_label")){
      document.getElementById(n.nodePoolId + "_label").setAttribute("display", "none");
    }

    return n;
  }

  // let tempNodeArray = []

  async function ageNodes(){
      
    nodeArray = [];
    let age = 1e-6;

    const nodeIdArray = nodeIdToPoolIdHashMap.keys();
    
    const ageNodesLength = nodeIdArray.length;
    let ageRate = DEFAULT_AGE_RATE;

    if (ageNodesLength > config.settings.maxNodesLimit && nodeAddQ.length <= config.settings.maxNodesLimit) {
      ageRate = adjustedAgeRateScale(ageNodesLength - config.settings.maxNodesLimit);
    } 
    else if (nodeAddQ.length > config.settings.maxNodesLimit) {
      ageRate = adjustedAgeRateScale(nodeAddQ.length - config.settings.maxNodesLimit);
    } 

    maxAgeRate = Math.max(ageRate, maxAgeRate);

    for(const nodeId of nodeIdArray){

      const nPoolId = nodeIdToPoolIdHashMap.get(nodeId);
      let nNode = localNodeHashMap.get(nPoolId);

      if (!nPoolId){
        console.debug(`UNDEFINED | nPoolId: ${nPoolId} | nodeId: ${nodeId}`)
        nodeIdToPoolIdHashMap.remove(nodeId)
        continue;
      }

      if (!nNode){
        console.debug(`UNDEFINED | nNode: ${nNode}`)
        localNodeHashMap.remove(nPoolId)
        continue;
      }

      if (!enableAgeNodes || resumeTimeStamp > 0) {
        ageRate = 1e-6;
      }

      if (nNode.isFixedNode) {
        age = 1e-6;
      }
      else if (nNode.nodeType === "user" && nNode.followersCount && nNode.followersCount > minFollowers) {
        age = nNode.age + ageRate * DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO * (Date.now() - nNode.ageUpdated);
      } 
      else {
        age = nNode.age + ageRate * (Date.now() - nNode.ageUpdated);
      }

      if (!nNode.disableAging && (age >= nodeMaxAge)) {

        nNode.isValid = false;

        nodeIdToPoolIdHashMap.remove(nodeId);
        localNodeHashMap.remove(nPoolId);

        const n = resetNode(nNode)
        nodePool.recycle(n);

      } 
      else {

        if (nNode.isFixedNode){
          nNode.fx = foci[nNode.category].x
          nNode.fy = foci[nNode.category].y
        }
        
        nNode.isValid = true;
        nNode.age = Math.max(age, 1e-6);
        nNode.ageMaxRatio = Math.max((age / nodeMaxAge), 1e-6);
        nNode.ageUpdated = Date.now();
        nNode.mouseHoverFlag = false;

        if (nNode.nodeType === "tweet"){
          nNode = await processTweetNode(nNode)
        }

        localNodeHashMap.set(nPoolId, nNode);
        nodeArray.push(nNode)
      }

    }

    resumeTimeStamp = 0;

    return;

  }

  let tooltipString;

  const nodeMouseOver = function (event, d) {
    d.mouseHoverFlag = true;

    if (mouseMovingFlag) {
      self.toolTipVisibility(true);
    } else {
      self.toolTipVisibility(false);
    }

    d3.select("#" + d.nodePoolId)
      .style("fill-opacity", 1)
      .style("stroke-opacity", 1);

    d3.select("#" + d.nodePoolId + "_label")
      .style("stroke", "unset")
      .style("fill", palette.white)
      .style("fill-opacity", 1)
      .style("display", "unset");

    switch (d.nodeType) {
      case "tweet":
        tooltipString =
          "TW ID" + d.nodeId +
          "<br>@" + d.user.screenName +
          "<br>" + d.rate.toFixed(3) + " NPM"
        break;
      case "user":
        tooltipString =
          "@" + d.screenName +
          "<br>" + d.name +
          "<br>AGE (DAYS): " + d.ageDays.toFixed(3) +
          "<br>TPD: " + d.tweetsPerDay.toFixed(3) +
          "<br>FLWRs: " + d.followersCount +
          "<br>FRNDs: " + d.friendsCount +
          "<br>FMs: " + d.followersMentions +
          "<br>Ms: " + d.mentions +
          "<br>Ts: " + d.statusesCount +
          "<br>" + d.rate.toFixed(3) + " NPM" +
          "<br>C: " + d.category +
          "<br>CA: " + d.categoryAuto;
        break;

      case "hashtag":
        tooltipString =
          "#" + d.nodeId +
          "<br>Ms: " + d.mentions +
          "<br>" + d.rate.toFixed(3) + " MPM" +
          "<br>C: " + d.category +
          "<br>CA: " + d.categoryAuto;
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

    d3.select("#" + d.nodePoolId)
      .style("fill-opacity", 1)
      .style("stroke", palette.white)
      .style("stroke-opacity", 1);

    switch (d.nodeType) {
      case "tweet":
        break;
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

    d3.select("#" + d.nodePoolId)
      .style("fill-opacity", function () {
        return nodeLabelOpacityScale(d.ageMaxRatio);
      })
      .style("stroke-opacity", function () {
        return nodeLabelOpacityScale(d.ageMaxRatio);
      });

  }

  function nodeMouseOut(event, d) {
    d.mouseHoverFlag = false;

    self.toolTipVisibility(false);

    d3.select("#" + d.nodePoolId)
      .style("fill-opacity", function () {
        return nodeLabelOpacityScale(d.ageMaxRatio);
      })
      .style("stroke-opacity", function () {
        return nodeLabelOpacityScale(d.ageMaxRatio);
      });

    d3.select("#" + d.nodePoolId + "_label")
      .style("fill", labelFill(d))
      .style("fill-opacity", nodeLabelOpacityScale(d.ageMaxRatio))
      .style("display", function () {
        if (!d.isValid) {
          return "none";
        }
        if (d.nodeType === "tweet") {
          return "unset";
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
    if (d.nodeType === "tweet") {
      return ""
    }
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

    const url = "https://twitter.com/";
    
    switch (d.nodeType) {

      case "tweet":
        window.open(`${url}/${d.user ? d.user.screenName : "twitter"}/status/${d.nodeId ? d.nodeId : ""}`, "_blank");
        break;
      case "user":
        if (d.isFixedNode){
          console.debug(`FIXED NODE TYPE: ${d.category}`);
          break;
        }
        if (d.lastTweetId && d.lastTweetId !== undefined) {
          console.debug(`LOADING TWITTER USER: ${url}/${d.screenName}/status/${d.lastTweetId}`);
          window.open(`${url}/${d.screenName}/status/${d.lastTweetId}`, "_blank");
        } 
        else {
          console.debug(`LOADING TWITTER USER: ${url}/${d.screenName}`);
          window.open(`${url}/${d.screenName}`, "_blank");
        }
        break;

      case "hashtag":
          window.open(`${url}/search?f=tweets&q=%23${d.nodeId}`, "_blank");
        break;

      default:
        console.debug(`UNSUPPORTED NODE TYPE: ${d.nodeType}`);
    }
  }

  function linkStroke() {
    return palette.white;
  }

  function linkStrokeWidth(){
    return 0.5 * defaultStrokeWidth;
  }

  function linkStrokeOpacity(d){
    return nodeLabelOpacityScale(d.source.ageMaxRatio);
  }

  function updateLinks() {

    linkLines = linkSvgGroup.selectAll(".link").data(
      linkArray,
      function (d) { return d.linkId; }
    );

    // ENTER
    linkLines
      .enter()
      .append("line")
      .attr("id", function (d) { return d.linkId; })
      .attr("class", "link")
      .attr("x1", function (d) { return d.source.x })
      .attr("y1", function (d) { return d.source.y })
      .attr("x2", function (d) { return d.target.x })
      .attr("y2", function (d) { return d.target.y })

      .style("stroke", linkStroke)
      .style("stroke-width", linkStrokeWidth)
      .style("stroke-opacity", 1);

    // UPDATE
    linkLines
      .attr("x1", function (d) { return d.source.x })
      .attr("y1", function (d) { return d.source.y })
      .attr("x2", function (d) { return d.target.x })
      .attr("y2", function (d) { return d.target.y })
      .style("stroke-opacity", linkStrokeOpacity);

    // EXIT
    linkLines.exit().remove();

    return;
  }

  let nodeCircles;
  let linkLines;

  function circleFill(d) {
    if (d.nodeType === "tweet") {
      return palette.black;
    }
    if (d.isFixedNode) {
      return fixedNodeFillColor;
    }
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
    if (d.isFixedNode) {
      return fixedNodeStrokeColor;
    }
    if (d.nodeType === "tweet") {
      return palette.yellow;
    }
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
    if (d.nodeType === "tweet") { return defaultStrokeWidth; }
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
    if (d.isFixedNode) { return 1.0; }
    if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
    if (!isCategorized(d.category) && isCategorized(d.categoryAuto)) { return nodeLabelOpacityScaleTopTerm(0.5*d.ageMaxRatio); }
    return nodeLabelOpacityScale(d.ageMaxRatio);
  }

  function circleStrokeOpacity(d) { 
    if (d.isFixedNode) { return 1.0; }
    if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
    return nodeLabelOpacityScale(d.ageMaxRatio);
  }

  function updateNodeCircles() {

    nodeCircles = nodeSvgGroup.selectAll("circle").data(
      nodeArray,
      function (d) { return d.nodePoolId; }
    );

    // ENTER
    nodeCircles
      .enter()
      .append("circle")
      .attr("id", function (d) { return d.nodePoolId; })
      .attr("nodeId", function (d) { return d.nodeId; })
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
      .attr("id", function (d) { return d.nodePoolId; })
      .attr("nodeId", function (d) { return d.nodeId; })
      .style("display", function (d) {
        if (d.isValid) { return "unset"; }
        return "none"; 
      })
      .attr("r", function (d) {
        if (d.isFixedNode) { return 20; }
        if (d.nodeType === "tweet") { return defaultRadiusScale(Math.sqrt(d.favoriteCount + d.replyCount + d.retweetCount + d.quoteCount)); }
        if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate)); }
        if (metricMode === "mentions") { return defaultRadiusScale(Math.sqrt(d.mentions)); }
      })
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .style("fill", circleFill)
      .style("fill-opacity", circleFillOpacity)
      .style("stroke", circleStroke)
      .style("stroke-width", circleStrokeWidth)
      .style("stroke-opacity", circleStrokeOpacity);

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
    if (d.nodeType === "tweet") { return "unset"; }
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
      .data(nodeArray, function (d) { return d.nodePoolId; });

    // UPDATE
    nodeLabels
      .attr("id", function (d) { return d.nodePoolId + "_label"; })
      .attr("nodeId", function (d) { return d.nodeId; })
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

  let nodeAddQReady = true;

  const processTweetNode = async (newTweetNode) => {

    const tweetNode = Object.assign({}, newTweetNode)

    tweetNode.retweetCount = newTweetNode.retweetCount || 0;
    tweetNode.quotedId = newTweetNode.quotedId || "";
    tweetNode.quoteCount = newTweetNode.quoteCount || 0;
    tweetNode.replyCount = newTweetNode.replyCount || 0;
    tweetNode.favoriteCount = newTweetNode.favoriteCount || 0;
    tweetNode.userMentions = newTweetNode.userMentions ? newTweetNode.userMentions : [];
    tweetNode.hashtags = newTweetNode.hashtags ? newTweetNode.hashtags : [];
    
    for(const targetNodeId of [tweetNode.tweeterId, ...tweetNode.userMentions, ...tweetNode.hashtags]){

      if (!targetNodeId || targetNodeId === undefined){
        continue;
      }

      if (!nodeIdToPoolIdHashMap.has(targetNodeId)) {
        continue;
      }

      const targetNodePoolId = nodeIdToPoolIdHashMap.get(targetNodeId);

      if (!localNodeHashMap.has(targetNodePoolId)) {
        continue;
      }

      const targetNode = localNodeHashMap.get(targetNodePoolId);

      targetNode.age = 1e-6;
      targetNode.ageMaxRatio = 1e-6;
      targetNode.ageUpdated = Date.now();
      targetNode.isTweeter = true;
      targetNode.isValid = true;

      localNodeHashMap.set(targetNodePoolId, targetNode);

      if (tweetNode.nodePoolId){
        localNodeHashMap.set(tweetNode.nodePoolId, tweetNode);
      }
    }

    return tweetNode;
  }

  async function processNodeAddQ(){

    try{
      if (nodeIdToPoolIdHashMap.size > maxNodes) {
        maxNodes = nodeIdToPoolIdHashMap.size;
      }

      if (nodeAddQReady && nodeAddQ.length > 0) {
        
        nodeAddQReady = false;

        const newNode = nodeAddQ.shift();

        if (nodeIdToPoolIdHashMap.has(newNode.nodeId)) {

          const nodePoolId = nodeIdToPoolIdHashMap.get(newNode.nodeId);

          let currentNode = localNodeHashMap.get(nodePoolId);

          currentNode = Object.assign({}, currentNode, newNode)

          currentNode.isValid = true;
          currentNode.age = 1e-6;
          currentNode.ageMaxRatio = 1e-6;
          currentNode.ageUpdated = Date.now();
          currentNode.mouseHoverFlag = false;

          if (newNode.nodeType === "tweet") {
            currentNode = await processTweetNode(currentNode)
          }

          localNodeHashMap.set(currentNode.nodePoolId, currentNode);
          nodeAddQReady = true;

          return;

        } 

        let currentNode = nodePool.use();

        nodeIdToPoolIdHashMap.set(newNode.nodeId, currentNode.nodePoolId);

        currentNode = Object.assign({}, currentNode, newNode);

        currentNode.isValid = true;
        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = Date.now();
        currentNode.mouseHoverFlag = false;

        if (newNode.nodeType === "tweet") {
          currentNode = await processTweetNode(currentNode)
        }


        if (isCategorized(newNode.category) || isCategorized(newNode.categoryAuto)) {
          if (autoCategoryFlag && isCategorized(newNode.categoryAuto)) {
            currentNode.x = foci[newNode.categoryAuto].x;
            currentNode.y = foci[newNode.categoryAuto].y + heightOffsetRatio*height;
          } 
          else if (isCategorized(newNode.categoryAuto) && !isCategorized(newNode.category)) {
            currentNode.x = foci[newNode.categoryAuto].x;
            currentNode.y = foci[newNode.categoryAuto].y + heightOffsetRatio*height;
          } 
          else if (isCategorized(newNode.category)) {
            currentNode.x = foci[newNode.category].x;
            currentNode.y = foci[newNode.category].y + heightOffsetRatio*height;
          }
        } 
        else if (newNode.nodeType === "tweet") {
          currentNode.x = foci.none.x + 100*Math.random();
          currentNode.y = foci.none.y + heightOffsetRatio*height + 100*Math.random();
        }
        else {
          currentNode.x = foci.none.x;
          currentNode.y = foci.none.y + heightOffsetRatio*height;
        }

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);
        nodeAddQReady = true;
        return;
      }
    }
    catch(err){
      console.error(err)
      throw err;
    }
  }

  let previousMaxRateMetric = 0;

  async function drawSimulation(){

    try{
      updateNodeCircles();
      updateNodeLabels();

      // if (updateLinks){
        updateLinks();
      // }

      if ((metricMode === "rate" && newCurrentMaxRateMetricFlag && Math.abs(currentMaxRateMetric - previousMaxRateMetric) / currentMaxRateMetric > config.settings.minRateMetricChange)
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
    catch(err){
      console.error(err)
      throw err;
    }
  }

  const processLinks = async () => {

    try{

      const links = []

      for(const node of nodeArray){

        if (node.nodeType === "tweet"){

          for(const targetNodeId of [node.tweeterId, ...node.userMentions, ...node.hashtags]){

            const targetNodePoolId = nodeIdToPoolIdHashMap.get(targetNodeId)

            if (targetNodePoolId === undefined) { continue; }

            const targetNode = localNodeHashMap.get(targetNodePoolId)

            if (targetNode !== undefined){

              links.push({
                linkId: `${node.nodeId}_target_${targetNodeId}`,
                // isValid: true,
                source: node,
                target: targetNode
              })
            }
          }
        }
      }
      return links;
    }
    catch(err){
      console.error(err)
      throw err;
    }
  }

  let updateSimulationReady = true;

  async function updateSimulation(){

    if (updateSimulationReady) {

      updateSimulationReady = false;

      await processNodeAddQ();
      await ageNodes();

      if (displayLinks){
        linkArray = await processLinks();
      }

      simulation.nodes(nodeArray);

      if (displayLinks){
        simulation.force("link").links(linkArray);
      }

      updateSimulationReady = true;
    }
    return;

  }

  function ticked(){
    updateSimulation()
    .then(() => {
      drawSimulation()
      .then()
      .catch((e) => console.error(e))
    })
    .catch((err) => {
      console.error(err)
    })
  }

  self.setChargeSliderValue = function (value) {
    console.debug("SET CHARGE: " + value);
    config.settings.charge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.setLinkStrengthSliderValue = function (value) {
    console.debug("SET LINK STRENGTH: " + value);
    config.settings.linkStrength = value;
    linkStrength = value;

    if (displayLinks){
      simulation.force("link").strength(value);
    }
  };

  self.setLinkDistanceSliderValue = function (value) {
    console.debug("SET LINK DISTANCE: " + value);
    config.settings.linkDistance = value;
    linkDistance = value;
    
    if (displayLinks){
      simulation.force("link").distance(value);
    }
  };

  self.addNode = function (n) {

    if (!displayTweets && n.nodeType === "tweet"){
      return;
    }

    if (!n.isFixedNode && !n.isTweeter && nodeAddQ.length >= config.settings.maxNodesLimit) {
      return;
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
    }

    if (n.isFixedNode){
      n.fx = foci[n.category].x
      n.fy = foci[n.category].y
      n.disableAging = true
      console.log(`FIXED NODE: ${n.nodeId} | CAT: ${n.category}`)
    }
    
    n.age = 1e-6;
    n.ageUpdated = Date.now();
    n.ageMaxRatio = 1e-6;
    n.rank = -1;
    n.ageDays = n.ageDays ? n.ageDays : 0;

    if (n.nodeType === "user" || n.nodeType === "hashtag") {
      n.mentions = n.mentions ? parseInt(n.mentions) : 0;
      n.tweetsPerDay = n.tweetsPerDay ? n.tweetsPerDay : 0;
      n.following = n.following !== undefined ? n.following : false;
      n.followersCount = n.followersCount ? parseInt(n.followersCount) : 0;
      n.friendsCount = n.friendsCount ? parseInt(n.friendsCount) : 0;
      n.followersMentions = n.mentions + n.followersCount;

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

    simulation = d3.forceSimulation(nodeArray);

    if (displayLinks){
      simulation.force("link", d3.forceLink().id(function(d) { return d.id; }).distance(linkDistance).strength(linkStrength));
    }

    simulation.force("charge", d3.forceManyBody().strength(charge));
    simulation.force("forceX", d3.forceX()
        .x((d) => {
          if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))) {
            return foci[d.categoryAuto].x;
          }
          if (isCategorized(d.category)) { return foci[d.category].x; }
          return foci.default.x;
        })
        .strength(() => forceXmultiplier * gravity)
      );

    simulation.force("forceY", d3.forceY()
        .y((d) => {
          if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))) {
            return foci[d.categoryAuto].y;
          }
          if (isCategorized(d.category)) { return foci[d.category].y; }
          return foci.default.y;
        })
        .strength(() => forceYmultiplier * gravity)
      );

    simulation.force("collide", d3.forceCollide()
        .radius((d) => {
          if (metricMode === "rate") { return (collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate))); }
          if (metricMode === "mentions") { return (collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions))); }
        })
        .iterations(collisionIterations)
        .strength(1.0))
      .velocityDecay(velocityDecay)
      .on("tick", ticked)
      .alphaTarget(0.7);

    simulation.on("end", console.log("*** END"));

    // *** NEEDED FOR SIM TO RUN FOREVER: alphaTarget > alphaMin (default 0.001)
    // simulation.alphaTarget(0.7).restart();
    simulation.restart();

    return
  };

  self.simulationControl = function (op) {

    switch (op) {
      case "RESET":
        self.reset();
        runningFlag = false;
        break;
      case "START":
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        enableAgeNodes = true
        runningFlag = true;
        break;
      case "RESUME":
        resumeTimeStamp = Date.now();
        enableAgeNodes = true
        runningFlag = true;
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
        enableAgeNodes = false
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
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

      width = getWindowDimensions().width;
      height = getWindowDimensions().height;

      console.log("RESIZE: " + width + "x" + height);

      svgMain
        .attr("width", '100%')
        .attr("height", height)
        .attr("x", 1e-6)
        .attr("y", 1e-6);

      svgViewForceLayoutArea
        .attr("width", '100%')
        .attr("height", height)
        .attr("x", 1e-6)
        .attr("y", 1e-6);

      foci = updateFoci(width, height)

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


      if (simulation) {

        simulation.force("charge", d3.forceManyBody().strength(charge));

        if (displayLinks) {
          simulation.force("link", d3.forceLink().id(function(d) { return d.id; }).distance(linkDistance).strength(linkStrength));
        }

        simulation.force("forceX", d3.forceX()
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
        );

        simulation.force("forceY", d3.forceY()
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
        );

        simulation.force("collide", d3.forceCollide()
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
    nodeIdToPoolIdHashMap.clear();
    nodeArray.length = 0;
    linkArray.length = 0;
    self.toolTipVisibility(false);
    self.resetDefaultForce();
    // self.resize();
    resetCurrentMax();
  };

  return self;
}
