/*jslint node: false */
"use strict";

function ViewTreepack() {


  console.log("@@@@@@@ CLIENT @@@@@@@@");

  var initialXposition = 0.5;
  var initialYposition = 0.9;
  var defaultInitialZoom = 1.0;

  var DEFAULT_ZOOM_FACTOR = 0.5;
  var minRateMetricChange = 0.5;

  var getWindowDimensions = function (){

    if (window.innerWidth !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    
    if (document.documentElement !== "undefined" 
      && document.documentElement.clientWidth !== "undefined" 
      && document.documentElement.clientWidth !== 0) {
      return { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    }
    // older versions of IE
    return { width: document.getElementsByTagName("body")[0].clientWidth, height: document.getElementsByTagName("body")[0].clientHeight };
  };

  var width = getWindowDimensions().width;
  var height = getWindowDimensions().height;

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      return JSON.stringify(obj, null, 2);
    } else {
      return "UNDEFINED";
    }
  }

  var palette = {
    "black": "#000000",
    "white": "#FFFFFF",
    "lightgray": "#AAAAAA",
    "gray": "#888888",
    "mediumgray": "#536870",
    "darkgray": "#475B62",
    "darkblue": "#0A2933",
    "darkerblue": "#042029",
    "paleryellow": "#FCF4DC",
    "paleyellow": "#EAE3CB",
    "yellow": "#A57706",
    "lightyellow": "#B58716",
    "darkyellow": "#846608",
    "orange": "#BD3613",
    "red": "#D11C24",
    "pink": "#C61C6F",
    "purple": "#595AB7",
    "blue": "#4808FF",
    "green": "#00E540",
    "darkergreen": "#008200",
    "lightgreen": "#35A296",
    "yellowgreen": "#738A05"
  };

  var DEFAULT_MIN_RATE = 0.1;
  var minRate = DEFAULT_MIN_RATE;

  var DEFAULT_MIN_FOLLOWERS = 5000;
  var minFollowers = DEFAULT_MIN_FOLLOWERS;

  var DEFAULT_MIN_MENTIONS = 1000;

  var minMentionsUsers = DEFAULT_MIN_MENTIONS;
  var minMentionsHashtags = 100;

  var DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9; // age users with many followers at a slower rate

  var mouseMovingFlag = false;

  var self = this;
  var simulation;

  var enableAgeNodes = true;
  var newCurrentMaxMentionsMetricFlag = true;
  var newCurrentMaxRateMetricFlag = true;

  var resumeTimeStamp = 0;

  var sliderPercision = 5;

  // FORCE X & Y
  var xFocusLeftRatio = 0.2;
  var yFocusLeftRatio = 0.5;

  var xFocusRightRatio = 0.8;
  var yFocusRightRatio = 0.5;

  var xFocusPositiveRatio = 0.5;
  var yFocusPositiveRatio = 0.2;

  var xFocusNegativeRatio = 0.5;
  var yFocusNegativeRatio = 0.7;

  var xFocusNeutralRatio = 0.5;
  var yFocusNeutralRatio = 0.5;

  var xFocusDefaultRatio = 0.5;
  var yFocusDefaultRatio = 0.6;

  // INITIAL POSITION
  var xMinRatioLeft = 0.25;
  var xMaxRatioLeft = 0.30;

  var yMinRatioLeft = 0.75;
  var yMaxRatioLeft = 0.85;

  var xMinRatioRight = 0.7;
  var xMaxRatioRight = 0.75;

  var yMinRatioRight = 0.75;
  var yMaxRatioRight = 0.85;

  var xMinRatioPositive = 0.45;
  var xMaxRatioPositive = 0.55;

  var yMinRatioPositive = 0.3;
  var yMaxRatioPositive = 0.4;

  var xMinRatioNegative = 0.45;
  var xMaxRatioNegative = 0.55;

  var yMinRatioNegative = 0.85;
  var yMaxRatioNegative = 0.95;

  var xMinRatioNeutral = 0.45;
  var xMaxRatioNeutral = 0.55;

  var yMinRatioNeutral = 0.75;
  var yMaxRatioNeutral = 0.85;

  var xMinRatioDefault = 0.45;
  var xMaxRatioDefault = 0.55;

  var yMinRatioDefault = 0.75;
  var yMaxRatioDefault = 0.85;

  var foci = {
    left: {x: xFocusLeftRatio*width, y: yFocusLeftRatio*height}, 
    right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 
    positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
    negative: {x: xFocusNegativeRatio*width, y: yFocusNegativeRatio*height},
    neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
    none: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height},
    default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
  };

  var totalHashmap = {};
  totalHashmap.total = 0;
  totalHashmap.left = 0;
  totalHashmap.right = 0;
  totalHashmap.neutral = 0;
  totalHashmap.positive = 0;
  totalHashmap.negative = 0;
  totalHashmap.none = 0;

  var nodeArray = [];

  var currentMaxRateMetric = 2;

  var currentMax = {};

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

  function resetCurrentMax(){
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

  function Node(nodePoolId){
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
    this.x = initialXposition*width;
    this.y = initialYposition*height;
  } 

  var nodePoolIndex = 0;

  var nodePool = deePool.create(function makeNode(){
    nodePoolIndex += 1;
    return (new Node("nodePoolId_" + nodePoolIndex));
  });

  var autoCategoryFlag = config.autoCategoryFlag;
  var metricMode = config.defaultMetricMode;
  var blahMode = config.defaultBlahMode;
  var charge = config.defaultCharge;
  var gravity = config.defaultGravity;
  var forceXmultiplier = config.defaultForceXmultiplier;
  var forceYmultiplier = config.defaultForceYmultiplier;
  var collisionRadiusMultiplier = 1.1;
  var collisionIterations = config.defaultCollisionIterations;
  var velocityDecay = config.defaultVelocityDecay;
  var fontSizeMinRatio = config.defaultFontSizeMinRatio;
  var fontSizeMaxRatio = config.defaultFontSizeMaxRatio;
  var fontSizeMin = config.defaultFontSizeMinRatio * height;
  var fontSizeMax = config.defaultFontSizeMaxRatio * height;

  var nodeRadiusMinRatio = config.defaultNodeRadiusMinRatio;
  var nodeRadiusMaxRatio = config.defaultNodeRadiusMaxRatio;
  var nodeRadiusMin = config.defaultNodeRadiusMinRatio * width;
  var nodeRadiusMax = config.defaultNodeRadiusMaxRatio * width;

  if (config.panzoomTransform === undefined) { 
    config.panzoomTransform = {}; 
  }
  config.panzoomTransform.scale = config.panzoomTransform.scale || config.defaultZoomFactor;
  config.panzoomTransform.x = config.panzoomTransform.x || 0.5*width;
  config.panzoomTransform.y = config.panzoomTransform.y || 0.5*height;

  var maxRateMentions = {};
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

  console.warn("TREEPACK CONFIG"
    // + "\n" + jsonPrint(config)
  );

  var testMode = false;
  var freezeFlag = false;

  var MAX_NODES_LIMIT = 100;

  var minOpacity = 0.2;
  var antonymFlag = false;
  var removeDeadNodesFlag = true;

  var DEFAULT_AGE_RATE = 1.0;
  var MAX_RX_QUEUE = 100;

  var localNodeHashMap = new HashMap();
  var nodeIdHashMap = new HashMap();

  var maxNodeAddQ = 0;
  var maxNodes = 0;
  var maxNodesLimit = MAX_NODES_LIMIT;

  var runningFlag = false;
  
  var nodeAddQ = [];

  self.sessionKeepalive = function() {
    return null;
  };

  self.getWidth = function() { return width; };

  self.getHeight = function() { return height; };

  var keysForSort = [];

  self.getSortedKeys = function(hmap, sortProperty) {
    hmap.forEach(function(value, key) {
      if (!value.isSessionNode) { keysForSort.push(key); }
    });
    return keysForSort.sort(function sortFunc(a, b) {
      return hmap.get(b)[sortProperty] - hmap.get(a)[sortProperty];
    });
  };

  var mouseHoverFlag = false;

  var nodeMaxAge = 60000;

  var DEFAULT_TREEMAP_CONFIG = { "ageRate": DEFAULT_AGE_RATE };

  var ageRate = DEFAULT_TREEMAP_CONFIG.ageRate;
  var maxAgeRate = 1e-6;

  // var defaultStrokeWidth = "1.1px";
  var defaultStrokeWidth = "0.2em";
  // var topTermStrokeWidth = "2.0px";
  var topTermStrokeWidth = "0.3em";

  // var botStrokeWidth = "4.0px";
  var botStrokeWidth = "0.4em";
  var botFillColor = palette.orange;

  var categoryMatchColor = palette.green;
  // var categoryMatchStrokeWidth = "4.0px";
  var categoryMatchStrokeWidth = "0.4em";
  // var categoryMismatchStrokeWidth = "7.0px";
  var categoryMismatchStrokeWidth = "0.7em";
  // var categoryAutoStrokeWidth = "2.0px";
  var categoryAutoStrokeWidth = "0.2em";

  var divTooltip = d3.select("body").append("div").
    attr("id", "divTooltip").
    attr("class", "tooltip").
    style("display", "none");

  document.addEventListener("mousemove", function mousemoveFunc() {

    if (mouseHoverFlag) { d3.select("body").style("cursor", "pointer"); } 
    else { d3.select("body").style("cursor", "default"); }

  }, true);

  var currentMetricModeDomainMaxSqrt = Math.sqrt(currentMax[metricMode][metricMode]);
  var currentMetricModeDomainMax = currentMax[metricMode][metricMode];

  var defaultRadiusScale = d3.scaleLinear().
    domain([0, currentMetricModeDomainMaxSqrt]).
    range([nodeRadiusMin, nodeRadiusMax]).
    clamp(true);

  var nodeLabelSizeScale = d3.scaleLinear().
    domain([1, currentMetricModeDomainMax]).
    range([fontSizeMin, fontSizeMax]).
    clamp(true);
        
  var nodeLabelOpacityScale = d3.scaleLinear().
    domain([1e-6, 0.2, 1.0]).
    range([1.0, 0.5, 1.5*minOpacity]).
    clamp(true);
    
  var nodeLabelOpacityScaleTopTerm = d3.scaleLinear().
    domain([1e-6, 0.2, 1.0]).
    range([1.0, 0.95, 0.75]).
    clamp(true);
    
  var adjustedAgeRateScale = d3.scaleLinear().
    domain([1, maxNodesLimit]).
    range([1.0, 100.0]);

  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg").
    attr("id", "svgMain").
    attr("width", width).
    attr("height", height).
    attr("x", 1e-6).
    attr("y", 1e-6);

  var svgTreemapLayoutArea = svgMain.append("svg:g").
    attr("id", "svgTreemapLayoutArea").
    attr("width", width).
    attr("height", height).
    attr("x", 1e-6).
    attr("y", 1e-6);

  var panzoomElement = document.getElementById("svgTreemapLayoutArea");

  var panzoomInstance = panzoom(
    panzoomElement, 
    {
      maxZoom: 2, 
      minZoom: 0.1,
      zoomSpeed: 0.02
    }
  );

  var panzoomEvent = new CustomEvent("panzoomEvent", { 
    bubbles: true, 
    detail: { transform: () => config.panzoomTransform } 
  });

  var panzoomCurrentEvent;

  panzoomInstance.on("transform", function(e){
    panzoomCurrentEvent = e;
    resetZoomEndTimeout();
  });

  var zoomEndTimeout;
  var resetZoomEndTimeout = function(){

    clearTimeout(zoomEndTimeout);

    zoomEndTimeout = setTimeout(function() {
      config.panzoomTransform = panzoomCurrentEvent.getTransform();
      console.log("panzoomTransform transform end\n", jsonPrint(config.panzoomTransform));
      document.dispatchEvent(panzoomEvent);
    }, 1000);

  };

  console.log("panzoomInstance zoomAbs\n", jsonPrint(config.panzoomTransform));

  // panzoomInstance.zoomAbs(config.panzoomTransform.x, config.panzoomTransform.y, config.panzoomTransform.scale);
  panzoomInstance.zoomAbs(width*0.5, height*0.5, config.panzoomTransform.scale);

  var nodeSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgTreemapLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var randomIntFromInterval = function(min, max) {
    var random = Math.random();
    var randomInt = Math.floor((random * (max - min + 1)) + min);
    if (Number.isNaN(randomInt)) {
      console.error("randomIntFromInterval NaN"
        + " | MIN: " + min
        + " | MAX: " + max
      );
    }
    return randomInt;
  };

  d3.select("body").style("cursor", "default");

  this.setStats = function(stats) {

    console.log("setStats"
      + "\nSTATS\n" + jsonPrint(stats)
    ); 

    if (controlPanelReadyFlag){ 
      controlPanelWindow.postMessage(
        {
          op: "STATS", 
          stats: stats
        }, 
        DEFAULT_SOURCE
      );
    }
  };

  self.setEnableAgeNodes = function(enabled) {
    enableAgeNodes = enabled;
    config.enableAgeNodes = enabled;
  };

  this.getPanzoomTransform = function() { return config.panzoomTransform; };
  this.deleteNode = function() { return null; };
  this.getTotalHashMap = function() { return totalHashmap; };
  this.getNodesLength = function() { return "NODES: " + nodeArray.length + " | POOL: " + nodePool.size(); };
  this.getMaxNodes = function() { return maxNodes; };
  this.getNumNodes = function() { return nodeArray.length; };
  this.getNodeAddQlength = function() { return nodeAddQ.length; };
  this.getMaxNodeAddQ = function() { return maxNodeAddQ; };
  this.getAgeRate = function() { return ageRate; };
  this.getMaxAgeRate = function() { return maxAgeRate; };

  this.setMaxNodesLimit = function(mNodesLimit) {
    maxNodesLimit = mNodesLimit;
    config.defaultMaxNodesLimit = mNodesLimit;
    console.debug("SET MAX NODES LIMIT: " + maxNodesLimit);
  };

  this.setNodeMaxAge = function(mAge) {
    nodeMaxAge = mAge;
    config.defaultMaxAge = mAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  };

  this.setAntonym = function(flag) {
    antonymFlag = flag;
    console.debug("SET ANTONYM: " + antonymFlag);
  };

  this.setTwitterUser = function(message) {

    if (message.node.notFound !== undefined) { 
      console.log("setTwitterUser"
        + " | NOT FOUND: SEARCH NODE: " + message.searchNode
        + "\nSTATS\n" + jsonPrint(message.stats)
      ); 
    }
    else { 
      console.log("setTwitterUser"
        + " | NID: " + message.node.nodeId
        + " | @" + message.node.screenName
        + "\nSTATS\n" + jsonPrint(message.stats)
      ); 
    }

    if (controlPanelReadyFlag){ 
      controlPanelWindow.postMessage(
        {
          op: "SET_TWITTER_USER", 
          node: message.node, 
          searchNode: message.searchNode, 
          stats: message.stats
        }, 
        DEFAULT_SOURCE
      );
    }
  };

  this.twitterUserNotFound = function(message) {

    console.log("TWITTER USER NOT FOUND"
      + " | SEARCH MODE: " + message.searchMode 
      + " | SEARCH NODE: " + message.searchNode
    );    

    if (controlPanelReadyFlag){ 
      controlPanelWindow.postMessage(
        {
          op: "TWITTER_USER_NOT_FOUND", 
          searchMode: message.searchMode,
          searchNode: message.searchNode,
          stats: stats
        }, 
        DEFAULT_SOURCE
      );
    }
  };

  this.setTwitterHashtag = function(message) {

    if (message.node.notFound !== undefined) { 
      console.log("setTwitterHashtag"
        + " | NOT FOUND: SEARCH NODE: " + message.searchNode
        + "\nSTATS\n" + jsonPrint(message.stats)
      ); 
    }
    else { 
      console.log("setTwitterHashtag"
        + " | #" + message.node.nodeId
        + "\nSTATS\n" + jsonPrint(message.stats)
      ); 
    }

    if (controlPanelReadyFlag){ 
      controlPanelWindow.postMessage(
        {
          op: "SET_TWITTER_HASHTAG", 
          node: message.node, 
          searchNode: message.searchNode, 
          stats: message.stats
        }, 
        DEFAULT_SOURCE
      );
    }
  };

  this.setMetricMode = function(mode) {

    metricMode = mode;
    config.defaultMetricMode = mode;

    nodeLabelSizeScale = d3.scaleLinear().
      domain([1, currentMax[mode][mode]]).
      range([fontSizeMin, fontSizeMax]).
      clamp(true);

    defaultRadiusScale = d3.scaleLinear().
      domain([0, Math.sqrt(currentMax[mode][mode])]).
      range([nodeRadiusMin, nodeRadiusMax]).
      clamp(true);

    console.debug("SET METRIC MODE: " + mode);
  };

  this.setBlah = function(flag) {
    blahMode = flag;
    console.debug("SET BLAH: " + blahMode);
  };

  this.setAutoCategoryFlag = function(flag) {
    autoCategoryFlag = flag;
    console.debug("SET AUTO CATEGORY: " + autoCategoryFlag);
  };

  this.setRemoveDeadNodesFlag = function(flag) {
    removeDeadNodesFlag = flag;
    console.debug("SET REMOVE DEAD NODES: " + removeDeadNodesFlag);
  };

  this.setTestMode = function(flag){
    testMode = flag;
    console.debug("SET TEST MODE: " + testMode);
  };

  self.toolTipVisibility = function(isVisible){
    if (isVisible) { divTooltip.style("display", "unset"); }
    else { divTooltip.style("display", "none"); }
  };

  self.deleteSessionLinks = function(){ console.debug("DELETE LINKS"); };

  self.setPause = function(value){
    console.debug("SET PAUSE: " + value);
    runningFlag = !value;
    if (value) { self.simulationControl("PAUSE"); }
    else { self.simulationControl("RESUME"); }
  };

  self.togglePause = function(){
    if (runningFlag) { self.simulationControl("PAUSE"); }
    else { self.simulationControl("RESUME"); }
  };

  self.setParam = function(param, value) {
    console.log("updateParam: " + param + " = " + value);
    return;
  };

  self.setVelocityDecay = function(value) {
    console.debug("UPDATE VEL DECAY: " + value.toFixed(sliderPercision));
    config.defaultVelocityDecay = value;
    velocityDecay = value;
    simulation.velocityDecay(velocityDecay);
  };

  self.setGravity = function(value) {
    console.debug("UPDATE GRAVITY: " + value.toFixed(5));
    config.defaultGravity = value;
    gravity = value;

    simulation.
      force("forceX", d3.forceX().x(function(d) { 
        if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))){
          return foci[d.categoryAuto].x;
        }
        if (isCategorized(d.category)){ return foci[d.category].x; }
        return foci.default.x;
      }).
      strength(function(){ return forceXmultiplier * gravity; })).
      force("forceY", d3.forceY().y(function(d) { 
        if ((autoCategoryFlag && isCategorized(d.categoryAuto)) || (!isCategorized(d.category) && isCategorized(d.categoryAuto))){
          return foci[d.categoryAuto].y;
        }
        if (isCategorized(d.category)){ return foci[d.category].y; }
        return foci.default.y;
      }).
      strength(function(){ return forceYmultiplier * gravity; }));
  };

  self.setTransitionDuration = function(value) {
    console.debug("UPDATE TRANSITION DURATION: " + value);
    // transitionDuration = value;
    config.defaultTransitionDuration = value;
  };

  self.setCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.setNodeRadiusRatioMin = function(value) {
    console.debug("UPDATE NODE RADIUS MIN RATIO: " + value);
    config.defaultNodeRadiusMinRatio = value;
    nodeRadiusMinRatio = value;
    nodeRadiusMin = value * width;
    defaultRadiusScale = d3.scaleLinear().
      domain([0, currentMetricModeDomainMaxSqrt]).
      range([nodeRadiusMin, nodeRadiusMax]).
      clamp(true);
  };

  self.setNodeRadiusRatioMax = function(value) {
    console.debug("UPDATE NODE RADIUS MAX RATIO: " + value);
    config.defaultNodeRadiusMaxRatio = value;
    nodeRadiusMaxRatio = value;
    nodeRadiusMax = value * width;
    defaultRadiusScale = d3.scaleLinear().
      domain([0, currentMetricModeDomainMaxSqrt]).
      range([nodeRadiusMin, nodeRadiusMax]).
      clamp(true);
  };

  self.setFontSizeRatioMin = function(value) {
    console.debug("UPDATE FONT MIN SIZE: " + value);
    config.defaultFontSizeMinRatio = value;

    fontSizeMinRatio = value;
    fontSizeMin = value * height;

    nodeLabelSizeScale = d3.scaleLinear().
      domain([1, currentMetricModeDomainMax]).
      range([fontSizeMin, fontSizeMax]).
      clamp(true);
  };

  self.setFontSizeRatioMax = function(value) {
    console.debug("UPDATE FONT MAX SIZE: " + value);
    config.defaultFontSizeMaxRatio = value;

    fontSizeMaxRatio = value;
    fontSizeMax = value * height;

    nodeLabelSizeScale = d3.scaleLinear().
      domain([1, currentMetricModeDomainMax]).
      range([fontSizeMin, fontSizeMax]).
      clamp(true);
  };

  self.resetDefaultForce = function() {
    console.warn("RESET TREEPACK DEFAULT FORCE");
    self.setTransitionDuration(config.defaultTransitionDuration);
    self.setNodeMaxAge(config.defaultMaxAge);
    self.setCharge(config.defaultCharge);
    self.setVelocityDecay(config.defaultVelocityDecay);
    self.setGravity(config.defaultGravity);
  };

  var tempNodeCirle;
  var tempNodeLabel;

  function resetNode(n, callback){
    n.age = 1e-6;
    n.ageMaxRatio = 1e-6;
    n.ageUpdated = Date.now();
    n.category = false;
    n.categoryAuto = false;
    n.categoryColor = "#FFFFFF";
    n.categoryMatch = false;
    n.categoryMismatch = false;
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

    tempNodeCirle = document.getElementById(n.nodePoolId);
    tempNodeCirle.setAttribute("display", "none");

    tempNodeLabel = document.getElementById(n.nodePoolId + "_label");
    tempNodeLabel.setAttribute("display", "none");

    callback(n);
  }

  var tempTotalHashmap = {};
  var ageNodesLength = 0;
  var ageMaxRatio = 1e-6;
  var age = 1e-6;
  var nodeIdArray = [];
  var tempNodeArray = [];
  var nPoolId;
  var nNode;;

  function ageNodes(callback) {

    tempTotalHashmap.total = 0;
    tempTotalHashmap.left = 0;
    tempTotalHashmap.right = 0;
    tempTotalHashmap.neutral = 0;
    tempTotalHashmap.positive = 0;
    tempTotalHashmap.negative = 0;
    tempTotalHashmap.none = 0;

    tempNodeArray.length = 0;

    nodeIdArray = nodeIdHashMap.keys();
    age = 1e-6;
    ageMaxRatio = 1e-6;
    ageNodesLength = nodeIdArray.length;
    ageRate = DEFAULT_AGE_RATE;

    if (ageNodesLength === 0) { 
      ageRate = DEFAULT_AGE_RATE; 
    } 
    else if ((ageNodesLength > maxNodesLimit) && (nodeAddQ.length <= MAX_RX_QUEUE)) {
      ageRate = adjustedAgeRateScale(ageNodesLength - maxNodesLimit);
    } 
    else if (nodeAddQ.length > MAX_RX_QUEUE) { 
      ageRate = adjustedAgeRateScale(nodeAddQ.length - MAX_RX_QUEUE); 
    } 
    else { 
      ageRate = DEFAULT_AGE_RATE; 
    }

    maxAgeRate = Math.max(ageRate, maxAgeRate);

    async.eachSeries(nodeIdArray, function eachNodeIdArray(nodeId, cb){

      nPoolId = nodeIdHashMap.get(nodeId);
      nNode = localNodeHashMap.get(nPoolId);

      if (!nNode.isValid || nNode.isDead) {
        return cb();
      }

      if (!enableAgeNodes || (resumeTimeStamp > 0)) {
        ageRate = 1e-6;
      }

      if ((nNode.nodeType === "user") && nNode.followersCount && (nNode.followersCount > minFollowers)){
        age = nNode.age + (ageRate * DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO * (Date.now() - nNode.ageUpdated));
      }
      else {
        age = nNode.age + (ageRate * (Date.now() - nNode.ageUpdated));
      }

      ageMaxRatio = age/nodeMaxAge;

      if (removeDeadNodesFlag && (nNode.isDead || (age >= nodeMaxAge))) {

        nNode.isDead = true;
        nNode.ageUpdated = Date.now();
        nNode.age = 1e-6;
        nNode.ageMaxRatio = 1e-6;

        nodeIdHashMap.remove(nNode.nodeId);
        localNodeHashMap.set(nPoolId, nNode);

        if (nNode.isValid) {
          nNode.isValid = false;
          localNodeHashMap.remove(nPoolId);
          resetNode(nNode, function nodeReset(n){
            nodePool.recycle(n);
            localNodeHashMap.set(nPoolId, n);
            cb();
          });
        }
        else {
          cb();
        }
      } 
      else {
        nNode.isValid = true;
        nNode.isDead = false;
        nNode.ageUpdated = Date.now();
        nNode.age = Math.max(age, 1e-6);
        nNode.ageMaxRatio = Math.max(ageMaxRatio, 1e-6);

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
        }
        else {
          if (metricMode === "rate") { 
            tempTotalHashmap.none += nNode.rate; 
            tempTotalHashmap.total += nNode.rate; 
          }
          if (metricMode === "mentions") { 
            tempTotalHashmap.none += nNode.mentions; 
            tempTotalHashmap.total += nNode.mentions; 
          }
        }

        cb();
      }
    }, function endAgeNodes(err){
      if (err) { 
        console.error("age node err: " + err);
      }
      resumeTimeStamp = 0;
      totalHashmap = tempTotalHashmap;
      callback(err, tempNodeArray);
    });
  }

  var previousTwitterUserId;
  // var previousTwitterEmoji;
  var previousTwitterHashtag;
  var tooltipString;

  var nodeMouseOver = function (d) {

    d.mouseHoverFlag = true;

    if (mouseMovingFlag) {
      self.toolTipVisibility(true);
    }
    else {
      self.toolTipVisibility(false);
    }

    d3.select(this).style("fill-opacity", 1);
    d3.select(this).style("stroke-opacity", 1);
    d3.select(this).style("display", "unset");
    d3.select("#" + d.nodePoolId).style("fill-opacity", 1);
    d3.select("#" + d.nodePoolId).style("stroke-opacity", 1);
    d3.select("#" + d.nodePoolId + "_label").style("fill-opacity", 1);
    d3.select("#" + d.nodePoolId + "_label").style("display", "unset");

    switch (d.nodeType) {

      case "user":

        // currentTwitterUser = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterUserId || (previousTwitterUserId !== d.nodeId))){
          previousTwitterUserId = d.nodeId;
        }

        tooltipString = "@" + d.screenName
          + "<br>" + d.name 
          + "<br>AGE (DAYS): " + d.ageDays.toFixed(3)
          + "<br>TPD: " + d.tweetsPerDay.toFixed(3)
          + "<br>FLWRs: " + d.followersCount
          + "<br>FRNDs: " + d.friendsCount
          + "<br>FMs: " + d.followersMentions
          + "<br>Ms: " + d.mentions
          + "<br>Ts: " + d.statusesCount
          + "<br>" + d.rate.toFixed(3) + " WPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;

      case "hashtag":

        // currentTwitterHashtag = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          previousTwitterHashtag = d.nodeId;
        }

        tooltipString = "#" + d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(3) + " MPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;

    }

    divTooltip.html(tooltipString);
    divTooltip.
      style("left", (d3.event.pageX - 40) + "px").
      style("top", (d3.event.pageY - 50) + "px");
  };

  function nodeMouseOut(d) {

    d.mouseHoverFlag = false;

    self.toolTipVisibility(false);

    d3.select(this).style("fill-opacity", function(){
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select(this).style("stroke-opacity", function(){
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });

    d3.select("#" + d.nodePoolId).style("fill-opacity", function(){
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });
    
    d3.select("#" + d.nodePoolId).style("stroke-opacity", function(){
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });
    
    d3.select("#" + d.nodePoolId + "_label").style("fill-opacity", function(){
      return nodeLabelOpacityScale(d.ageMaxRatio);
    });
            
    d3.select("#" + d.nodePoolId + "_label").style("display", function(){
      if (!d.isValid) { return "none"; }
      if (isCategorized(d.category)) { return "unset"; }
      if (d.rate > minRate) { return "unset"; }
      if ((d.nodeType === "hashtag") && ((d.mentions > minMentionsHashtags) || (d.nodeId.includes("trump")))){ 
        return "unset"; 
      }
      if ((d.nodeType === "user") 
        && (
          (d.followersCount > minFollowers) 
          || (d.mentions > minMentionsUsers) 
          || (d.screenName.toLowerCase().includes("trump"))
          || (d.name && d.name.toLowerCase().includes("trump"))
          )
      ) { 
        return "unset"; 
      }
      return "none";
    });
  }

  function labelText(d) {
    if (d.nodeType === "hashtag") { 
      if (isCategorized(d.category) || isCategorized(d.categoryAuto)) { return "#" + d.nodeId.toUpperCase(); }
      if (d.mentions >= minMentionsHashtags) { return "#" + d.nodeId.toUpperCase(); }
      return "#" + d.nodeId.toLowerCase(); 
    }
    if (d.nodeType === "user") { 
      if (d.screenName) { 
        if (isCategorized(d.category) || isCategorized(d.categoryAuto)) { return "@" + d.screenName.toUpperCase(); }
        if (d.followersCount >= minFollowers) { return "@" + d.screenName.toUpperCase(); }
        if (d.mentions >= minMentionsUsers) { return "@" + d.screenName.toUpperCase(); }
        return "@" + d.screenName.toLowerCase(); 
      }
      else if (d.name){ 
      if (isCategorized(d.category) || isCategorized(d.categoryAuto)) { return "@" + d.name.toUpperCase(); }
        if (d.followersCount >= minFollowers) { return "@" + d.name.toUpperCase(); }
        if (d.mentions >= minMentionsUsers) { return "@" + d.name.toUpperCase(); }
        return "@" + d.name.toLowerCase(); 
      }
      else { return "@UNKNOWN?"; }
    }
    return d.nodeId; 
  }

  function nodeClick(d) {

    switch (d.nodeType) {

      case "user" :
        
        if (controlPanelReadyFlag) {
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", node: d, nodeSearch: true}, DEFAULT_SOURCE);
        }

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterUserId || (previousTwitterUserId !== d.nodeId))){
          previousTwitterUserId = d.nodeId;
        }

        if (d.lastTweetId && (d.lastTweetId !== undefined)) {
          console.debug("LOADING TWITTER USER: " + "https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId);
          window.open("https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId, "_blank");
        }
        else {
          console.debug("LOADING TWITTER USER: " + "https://twitter.com/" + d.screenName);
          window.open("https://twitter.com/" + d.screenName, "_blank");
        }
      break;

      case "hashtag" :

        if (controlPanelReadyFlag) {
          controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", node: d, nodeSearch: true}, DEFAULT_SOURCE);
        }

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          previousTwitterHashtag = d.nodeId;
        }

        window.open("https://twitter.com/search?f=tweets&q=%23"+d.nodeId, "_blank");
      break;

    }
  }

  var nodeCircles;

  function updateNodeCircles(callback) {

    nodeCircles = nodeSvgGroup.selectAll("circle").
      data(nodeArray.filter(
        function(d){ 
          return d.isValid && (d.nodeType !== "media");
        }), 
        function (d){ 
          return d.nodeId;
        });

    // ENTER
    nodeCircles.
      enter().append("circle").
      attr("id", function (d) { return d.nodePoolId; }).
      attr("nodeId", function (d) { return d.nodeId; }).
      style("display", function (d) { 
        if (!d.isValid) { return "none"; }
        return "unset"; 
      }).
      attr("r", 1e-6). 
      attr("cx", function (d) { return d.x; }).
      attr("cy", function (d) { return d.y; }).
      style("fill", function (d) { 
        if (d.isBot) { return botFillColor; }
        if (d.isTopTerm && !isCategorized(d.category) && !isCategorized(d.categoryAuto)) { return palette.white; }
        if (!isCategorized(d.category) && !isCategorized(d.categoryAuto)) { return palette.gray; }
        if (isCategorized(d.category)) { return d.categoryColor; }
        if (d.categoryAuto === "right") { return palette.darkyellow; }
        if (d.categoryAuto === "left") { return palette.blue; }
        if (d.categoryAuto === "positive") { return palette.green; }
        if (d.categoryAuto ==="negative") { return palette.red; }
        return d.categoryColor; 
      }).
      style("stroke", function (d) {
        if (d.nodeType === "hashtag") { return palette.white; }
        if (d.categoryMismatch) { return palette.red; }
        if (d.categoryMatch) { return categoryMatchColor; }
        if (d.categoryAuto === "right") { return palette.darkyellow; }
        if (d.categoryAuto === "left") { return palette.blue; }
        if (d.categoryAuto === "positive") { return palette.green; }
        if (d.categoryAuto ==="negative") { return palette.black; }
        return palette.white; 
      }).
      style("stroke-width", function (d) { 
        if (d.nodeType === "hashtag" && d.isTopTerm) { return topTermStrokeWidth; }
        if (d.nodeType === "hashtag") { return 0.5*defaultStrokeWidth; }
        if (d.isBot) { return botStrokeWidth; }
        if (d.categoryMismatch && d.following) { return categoryMismatchStrokeWidth; }
        if (d.categoryMismatch && !d.following) { return 0.5*categoryMismatchStrokeWidth; }
        if (d.categoryMatch && d.following) { return categoryMatchStrokeWidth; }
        if (d.categoryMatch && !d.following) { return 0.5*categoryMatchStrokeWidth; }
        if (d.isTopTerm && d.following) { return topTermStrokeWidth; }
        if (d.isTopTerm && !d.following) { return 0.5*topTermStrokeWidth; }
        if (isCategorized(d.categoryAuto) && d.following) { return categoryAutoStrokeWidth; }
        if (isCategorized(d.categoryAuto) && !d.following) { return 0.5*categoryAutoStrokeWidth; }
        if (d.following) { return defaultStrokeWidth; }
        return 0.5*defaultStrokeWidth; 
      }).
      style("fill-opacity", function(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      }).
      style("stroke-opacity", function(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      }).
      on("mouseover", nodeMouseOver).
      on("mouseout", nodeMouseOut).
      on("click", nodeClick);

    // UPDATE
    nodeCircles.
      style("display", function nodeCirclesDisplay(d) { 
        if (!d.isValid) { return "none"; }
        return "unset"; 
      }).
      attr("r", function nodeCircleRadius(d) {
        if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate)); }
        if (metricMode === "mentions") { return defaultRadiusScale(Math.sqrt(d.mentions)); }
      }).
      attr("cx", function nodeCircleCx(d) { return d.x; }).
      attr("cy", function nodeCircleCy(d) { return d.y; }).
      style("fill", function nodeCirclesFill(d) { 
        if (d.isBot) { return botFillColor; }
        if (d.isTopTerm && !isCategorized(d.category) && !isCategorized(d.categoryAuto)) { return palette.white; }
        if (!isCategorized(d.category) && !isCategorized(d.categoryAuto)) { return palette.gray; }
        if (isCategorized(d.category)) { return d.categoryColor; }
        if (d.categoryAuto === "right") { return palette.darkyellow; }
        if (d.categoryAuto === "left") { return palette.blue; }
        if (d.categoryAuto === "positive") { return palette.green; }
        if (d.categoryAuto ==="negative") { return palette.red; }
        return d.categoryColor; 
      }).
      style("stroke", function nodeCirclesStroke (d) {
        if (d.nodeType === "hashtag") { return palette.white; }
        if (d.categoryMismatch) { return palette.red; }
        if (d.categoryMatch) { return categoryMatchColor; }
        if (d.categoryAuto === "right") { return palette.darkyellow; }
        if (d.categoryAuto === "left") { return palette.blue; }
        if (d.categoryAuto === "positive") { return palette.green; }
        if (d.categoryAuto ==="negative") { return palette.black; }
        return palette.white; 
      }).
      style("stroke-width", function nodeCirclesStrokeWidth(d) { 
        if (d.nodeType === "hashtag" && d.isTopTerm) { return topTermStrokeWidth; }
        if (d.nodeType === "hashtag") { return 0.5*defaultStrokeWidth; }
        if (d.isBot) { return botStrokeWidth; }
        if (d.categoryMismatch && d.following) { return categoryMismatchStrokeWidth; }
        if (d.categoryMismatch && !d.following) { return 0.5*categoryMismatchStrokeWidth; }
        if (d.categoryMatch && d.following) { return categoryMatchStrokeWidth; }
        if (d.categoryMatch && !d.following) { return 0.5*categoryMatchStrokeWidth; }
        if (d.isTopTerm && d.following) { return topTermStrokeWidth; }
        if (d.isTopTerm && !d.following) { return 0.5*topTermStrokeWidth; }
        if (d.categoryAuto && d.following) { return categoryAutoStrokeWidth; }
        if (d.categoryAuto && !d.following) { return 0.5*categoryAutoStrokeWidth; }
        if (d.following) { return defaultStrokeWidth; }
        return 0.5*defaultStrokeWidth; 
      }).
      style("fill-opacity", function nodeCirclesFillOpacity(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      }).
      style("stroke-opacity", function nodeCirclesStrokeOpacity(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      });

    // EXIT
    nodeCircles.
      exit().
      style("display", "none");

    callback();
  }

  var nodeLabels;
  
  function updateNodeLabels (callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text").
      data(nodeArray, function (d) { return d.nodeId; });

    // UPDATE
    nodeLabels.
      text(labelText).
      style("display", function (d) {
        if (!d.isValid) { return "none"; }
        if (d.mouseHoverFlag) { return "unset"; }
        if (isCategorized(d.category)) { return "unset"; }
        if (isCategorized(d.categoryAuto)) { return "unset"; }
        if (d.rate > minRate) { return "unset"; }
        if ((d.nodeType === "user") 
          && (
            (d.followersCount > minFollowers) 
            || (d.mentions > minMentionsUsers) 
            || (d.screenName.toLowerCase().includes("trump"))
            || (d.name && d.name.toLowerCase().includes("trump"))
            )
        ) { 
          return "unset"; 
        }
        if ((d.nodeType === "hashtag") && ((d.mentions > minMentionsHashtags) || (d.nodeId.includes("trump"))))
        { 
          return "unset"; 
        }
        return "none";
      }).
      attr("x", function (d) { return d.x; }).
      attr("y", function (d) { return d.y; }).
      style("fill", function (d) { 
        if (d.isBot) { return palette.red; }
        if (d.isTopTerm && (d.nodeType === "hashtag")) { return palette.white; }
        if (d.isTopTerm && (d.followersCount > minFollowers)) { return palette.white; }
        if (!d.isTopTerm && (d.followersCount > minFollowers)) { return palette.lightgray; }
        if (d.isTopTerm) { return palette.lightgray; }
        return palette.gray; 
      }).
      style("fill-opacity", function updateNodeLabelOpacity(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      }).
      style("font-size", function (d) {
        if (metricMode === "rate") {
          if (d.isTopTerm) { return nodeLabelSizeScale(1.5*d.rate); }
          return nodeLabelSizeScale(d.rate);
        }
        if (metricMode === "mentions") { 
          if (d.isTopTerm) { return nodeLabelSizeScale(1.5*d.mentions); }
          return nodeLabelSizeScale(d.mentions);
        }
      });

    // ENTER
    nodeLabels. 
      enter().append("text").
      attr("id", function (d) { return d.nodePoolId + "_label"; }).
      attr("nodeId", function (d) { return d.nodeId; }).
      style("text-anchor", "middle").
      style("alignment-baseline", "middle").
      on("mouseover", nodeMouseOver).
      on("mouseout", nodeMouseOut).
      on("click", nodeClick).
      attr("x", function (d) { return d.x; }).
      attr("y", function (d) { return d.y; }).
      text(labelText).
      style("font-weight", function (d) {
        if (d.followersCount > minFollowers) { return "bold"; }
        return "normal";
      }).
      style("display", function (d) {
        if (!d.isValid) { return "none"; }
        if (isCategorized(d.category)) { return "unset"; }
        if (isCategorized(d.categoryAuto)) { return "unset"; }
        if (mouseMovingFlag) { return "unset"; }
        if (d.rate > minRate) { return "unset"; }
        if ((d.nodeType === "user") 
          && (
            (d.followersCount > minFollowers) 
            || (d.mentions > minMentionsUsers) 
            || (d.screenName.toLowerCase().includes("trump"))
            || (d.name && d.name.toLowerCase().includes("trump"))
            )
        ) { 
          return "unset"; 
        }
        if ((d.nodeType === "hashtag") && ((d.mentions > minMentionsHashtags) || (d.nodeId.includes("trump"))))
        { 
          return "unset"; 
        }
        return "none";
      }).
      style("text-decoration", function (d) { 
        if (d.isTopTerm && (d.followersCount > minFollowers)) { return "overline underline"; }
        if (!d.isTopTerm && (d.followersCount > minFollowers)) { return "underline"; }
        if (d.isTopTerm) { return "overline"; }
        return "none"; 
      }).
      style("fill-opacity", function (d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio);
      }).
      style("fill", function (d) { 
        if (d.isBot) { return palette.red; }
        if (d.isTopTerm && (d.nodeType === "hashtag")) { return palette.white; }
        if (d.isTopTerm && (d.followersCount > minFollowers)) { return palette.white; }
        if (!d.isTopTerm && (d.followersCount > minFollowers)) { return palette.lightgray; }
        if (d.isTopTerm) { return palette.lightgray; }
        return palette.gray; 
      }).
      style("font-size", function (d) {
        if (metricMode === "rate") {
          if (d.isTopTerm) { return nodeLabelSizeScale(1.5*d.rate); }
          return nodeLabelSizeScale(d.rate);
        }
        if (metricMode === "mentions") { 
          if (d.isTopTerm) { return nodeLabelSizeScale(1.5*d.mentions); }
          return nodeLabelSizeScale(d.mentions);
        }
      });

    // EXIT
    nodeLabels.
      exit().
      style("display", "none");

    if (callback !== undefined) { callback(); }
  }

  self.mouseMoving = function(isMoving) {
    if (isMoving && !mouseMovingFlag) {
      mouseMovingFlag = isMoving;
      updateNodeLabels();
    }
    else { 
      mouseMovingFlag = isMoving;
    }
  };

  function isCategorized(category){
    if (category && (category !== "none")) { return true; }
    return false;
  }

  var categoryFocus = function(d, axis){
    if ((autoCategoryFlag && isCategorized(d.categoryAuto)) 
      || (!isCategorized(d.category) && isCategorized(d.categoryAuto))
    ){ 
      return foci[d.categoryAuto][axis]; 
      }
    if (isCategorized(d.category)) { return foci[d.category]; }
    return foci.default[axis];
  };

  function focus(focalPoint){
    switch (focalPoint) {
      case "left":
        return({
          x: randomIntFromInterval(xMinRatioLeft*width, xMaxRatioLeft*width), 
          y: randomIntFromInterval(yMinRatioLeft*height, yMaxRatioLeft*height)
        });
      case "right":
        return({
          x: randomIntFromInterval(xMinRatioRight*width, xMaxRatioRight*width), 
          y: randomIntFromInterval(yMinRatioRight*height, yMaxRatioRight*height)
        });
      case "positive":
        return({
          x: randomIntFromInterval(xMinRatioPositive*width, xMaxRatioPositive*width), 
          y: randomIntFromInterval(yMinRatioPositive*height, yMaxRatioPositive*height)
        });
      case "negative":
        return({
          x: randomIntFromInterval(xMinRatioNegative*width, xMaxRatioNegative*width), 
          y: randomIntFromInterval(yMinRatioNegative*height, yMaxRatioNegative*height)
        });
      case "neutral":
        return({
          x: randomIntFromInterval(xMinRatioNeutral*width, xMaxRatioNeutral*width), 
          y: randomIntFromInterval(yMinRatioNeutral*height, yMaxRatioNeutral*height)
        });
      case "none":
        return({
          x: randomIntFromInterval(xMinRatioDefault*width, xMaxRatioDefault*width), 
          y: randomIntFromInterval(yMinRatioDefault*height, yMaxRatioDefault*height)
        });
      default:
        return({
          x: randomIntFromInterval(xMinRatioDefault*width, xMaxRatioDefault*width), 
          y: randomIntFromInterval(yMinRatioDefault*height, yMaxRatioDefault*height)
        });
    }
  }

  var newNode = {};
  var nodeAddQReady = true;
  var currentNode;
  var nodePoolId;
  var nodePoolIdcircle;

  function processNodeAddQ(callback) {

    if (nodeIdHashMap.size > maxNodes) { maxNodes = nodeIdHashMap.size; }

    if (nodeAddQReady && (nodeAddQ.length > 0)) {

      nodeAddQReady = false;

      newNode = nodeAddQ.shift();

      if (nodeIdHashMap.has(newNode.nodeId)){

        nodePoolId = nodeIdHashMap.get(newNode.nodeId);

        currentNode = localNodeHashMap.get(nodePoolId);

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
        currentNode.lastTweetId = newNode.lastTweetId;

        if (newNode.nodeType === "user"){
          currentNode.following = newNode.following;
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);
        nodeAddQReady = true;

        callback();
      }
      else {

        currentNode = nodePool.use();

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
        currentNode.friendsCount = newNode.friendsCount;
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
        currentNode.x = initialXposition*width;
        currentNode.y = initialYposition*height;

        if (newNode.nodeType === "user"){
          currentNode.following = newNode.following;
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        if (isCategorized(newNode.category) || isCategorized(newNode.categoryAuto)) {

          if (autoCategoryFlag && isCategorized(newNode.categoryAuto)) { 
            currentNode.x = focus(newNode.categoryAuto).x; 
            currentNode.y = focus(newNode.categoryAuto).y;
          }
          else if (isCategorized(newNode.categoryAuto) && !isCategorized(newNode.category)) { 
            currentNode.x = focus(newNode.categoryAuto).x; 
            currentNode.y = focus(newNode.categoryAuto).y;
          }
          else if (isCategorized(newNode.category)) { 
            currentNode.x = focus(newNode.category).x; 
            currentNode.y = focus(newNode.category).y;
          }
        }
        else {
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

        callback();
      }

    }
    else {
      callback();
    }
  }

  var previousMaxRateMetric = 0;

  function drawSimulation(callback){

    async.parallel({
      updateNodeCirclesSeries: function(cb){ updateNodeCircles(cb); },
      updateNodeLabelsSeries: function(cb){ updateNodeLabels(cb); }
    }, function drawSimulationCallback () {

      if (
        ( 
          (metricMode === "rate") 
          && newCurrentMaxRateMetricFlag 
          && (Math.abs(currentMaxRateMetric - previousMaxRateMetric)/currentMaxRateMetric) > minRateMetricChange)
        || (
          (metricMode === "mentions") 
          && newCurrentMaxMentionsMetricFlag)
        ) {

        if (metricMode === "rate") { 
          newCurrentMaxRateMetricFlag = false;
          previousMaxRateMetric = currentMax.rate.rate;
        }
        if (metricMode === "mentions") { 
          newCurrentMaxMentionsMetricFlag = false;
        }

        nodeLabelSizeScale = d3.scaleLinear().
          domain([1, currentMetricModeDomainMax]).
          range([fontSizeMin, fontSizeMax]).
          clamp(true);

        defaultRadiusScale = d3.scaleLinear().
          domain([0, currentMetricModeDomainMaxSqrt]).
          range([nodeRadiusMin, nodeRadiusMax]).
          clamp(true);

      }

      callback();
    });
  }

  var updateSimulationReady = true;
  
  function updateSimulation() {

    if (updateSimulationReady) {

      updateSimulationReady = false;

      processNodeAddQ(function(){
        ageNodes(function(err, nArray){
          nodeArray = nArray;
          simulation.nodes(nodeArray);
          updateSimulationReady = true;
        });
      });

    }
  }

  function ticked() {
    drawSimulation(function() { 
      updateSimulation(); 
    });
  }

  this.setChargeSliderValue = function(value){
    console.debug("SET CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  this.addNode = function(n) {

    n.age = 1e-6;
    n.ageUpdated = Date.now();
    n.ageMaxRatio = 1e-6;
    n.rank = -1;
    n.newFlag = true;
    n.following = (n.following !== undefined) ? n.following : false;
    n.followersCount = (n.followersCount) ? parseInt(n.followersCount) : 0;
    n.mentions = (n.mentions) ? parseInt(n.mentions) : 0;

    n.ageDays = (n.ageDays) ? n.ageDays : 0;
    n.tweetsPerDay = (n.tweetsPerDay) ? n.tweetsPerDay : 0;

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

      currentMetricModeDomainMaxSqrt = Math.sqrt(currentMax[metricMode][metricMode]);
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

      if (metricMode === "rate") { currentMaxRateMetric = n.rate; }

      currentMetricModeDomainMaxSqrt = Math.sqrt(currentMax[metricMode][metricMode]);
      currentMetricModeDomainMax = currentMax[metricMode][metricMode];
    }

    if (nodeAddQ.length < MAX_RX_QUEUE) { nodeAddQ.push(n); }

    if (nodeAddQ.length > maxNodeAddQ) { maxNodeAddQ = nodeAddQ.length; }
  };

  this.addGroup = function() {
    // not used
  };

  this.addSession = function() {
    // not used
  };

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodeArray).
      force("charge", d3.forceManyBody().strength(charge)).
      // force("forceX", d3.forceX().x(function (d){ return categoryFocus(d, "x"); }).strength(function strengthFunc() { return forceXmultiplier * gravity; })).
      // force("forceY", d3.forceY().y(function (d){ return categoryFocus(d, "y"); }).strength(function strengthFunc(){ return forceYmultiplier * gravity; })).
      force("forceX", d3.forceX().x(function forceXfunc(d) { 
        if ((autoCategoryFlag && isCategorized(d.categoryAuto)) 
          || (!isCategorized(d.category) && isCategorized(d.categoryAuto))
        ){ 
          return foci[d.categoryAuto].x; 
          }
        if (isCategorized(d.category)) { return foci[d.category].x; }
        return foci.default.x;
      }).
      strength(function strengthFunc(){ return forceXmultiplier * gravity; })).
      force("forceY", d3.forceY().y(function forceYfunc(d) { 

        if ((autoCategoryFlag && isCategorized(d.categoryAuto)) 
          || (!isCategorized(d.category) && isCategorized(d.categoryAuto))
        ){ 
          return foci[d.categoryAuto].y; 
          }
        if (isCategorized(d.category)) { return foci[d.category].y; }
        return foci.default.y;
      }).
      strength(function strengthFunc(){ return forceYmultiplier * gravity; })).
      force("collide", d3.forceCollide().radius(function forceCollideFunc(d) { 
        if (metricMode === "rate") { return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate)); }
        if (metricMode === "mentions") { return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions)); }
      }).
      iterations(collisionIterations).
      strength(1.0)).
      velocityDecay(velocityDecay).
      on("tick", ticked);
  };

  this.simulationControl = function(op) {
    switch (op) {
      case "RESET":
        self.reset();
        runningFlag = false;
      break;
      case "START":
        self.initD3timer();
        self.resize();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case "RESUME":
        resumeTimeStamp = Date.now();
        runningFlag = true;
        simulation.alphaTarget(0.7).restart();
      break;
      case "FREEZE":
        if (!freezeFlag){
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
      break;
      case "PAUSE":
        resumeTimeStamp = 0;
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case "STOP":
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case "RESTART":
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;

      break;
      default:
        console.error("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
    }
  };

  var resizeTimeOut;

  this.resize = function() {

    clearTimeout(resizeTimeOut);

    resizeTimeOut = setTimeout(function(){

      resetCurrentMax();

      d3image = d3.select("#d3group");

      width = getWindowDimensions().width;
      height = getWindowDimensions().height;

      console.log("RESIZE: " + width + "x" + height);

      foci = {
        left:  {x: xFocusLeftRatio*width,  y: yFocusLeftRatio*height}, 
        right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 

        positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
        negative: {x: xFocusNegativeRatio*width,  y: yFocusNegativeRatio*height},

        neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
        none:    {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height},

        default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
      };

      console.log("FOCI: " + jsonPrint(foci));

      nodeRadiusMin = nodeRadiusMinRatio * width;
      nodeRadiusMax = nodeRadiusMaxRatio * width;

      defaultRadiusScale = d3.scaleLinear().
        domain([0, currentMetricModeDomainMaxSqrt]).
        range([nodeRadiusMin, nodeRadiusMax]).
        clamp(true);

      fontSizeMin = fontSizeMinRatio * height;
      fontSizeMax = fontSizeMaxRatio * height;

      nodeLabelSizeScale = d3.scaleLinear().
        domain([1, currentMetricModeDomainMax]).
        range([fontSizeMin, fontSizeMax]).
        clamp(true);

      svgMain.
        attr("width", width).
        attr("height", height).
        attr("x", 1e-6).
        attr("y", 1e-6);

      if (simulation){

        simulation.
          force("charge", d3.forceManyBody().strength(charge)).
          force("forceX", d3.forceX().x(function forceXfunc(d) { 
            if ((autoCategoryFlag && isCategorized(d.categoryAuto)) 
              || (!isCategorized(d.category) && isCategorized(d.categoryAuto))
            ){ 
              return foci[d.categoryAuto].x; 
              }
            if (isCategorized(d.category)) { return foci[d.category].x; }
            return foci.default.x;
          }).
          strength(function strengthFunc(){ return forceXmultiplier * gravity; })).
          force("forceY", d3.forceY().y(function forceYfunc(d) { 

            if ((autoCategoryFlag && isCategorized(d.categoryAuto)) 
              || (!isCategorized(d.category) && isCategorized(d.categoryAuto))
            ){ 
              return foci[d.categoryAuto].y; 
              }
            if (isCategorized(d.category)) { return foci[d.category].y; }
            return foci.default.y;
          }).
          strength(function strengthFunc(){ return forceYmultiplier * gravity; })).
          force("collide", d3.forceCollide().radius(function forceCollideFunc(d) { 
            if (metricMode === "rate") { return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate)); }
            if (metricMode === "mentions") { return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions)); }
          }).
          iterations(collisionIterations)).
          velocityDecay(velocityDecay);
      }

      panzoomElement = document.getElementById("svgTreemapLayoutArea");

      if (panzoomElement) {
        panzoomInstance.zoomAbs(width*0.5, height*0.5, config.panzoomTransform.scale);
      }

    }, 200);
  };

  // ==========================================

  document.defaultView.addEventListener("resize", function resizeFunc() { 
    self.resize(); 
  }, true);

  document.addEventListener("resize", function resizeFunc() { 
    self.resize(); 
  }, true);

  self.reset = function() {
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

}