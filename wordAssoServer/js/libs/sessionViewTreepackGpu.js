/*jslint node: false */

function ViewTreepack() {

  // "use strict";

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  var DEFAULT_ZOOM_FACTOR = 0.5;
  var emojiFontMulipier = 2.0;
  var minRateMetricChange = 0.5;

  // var topTermsDivVisible = false;

  var getWindowDimensions = function (){

    var w;
    var h;

    if (window.innerWidth !== "undefined") {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== "undefined" 
      && document.documentElement.clientWidth !== "undefined" 
      && document.documentElement.clientWidth !== 0) {
      w = document.documentElement.clientWidth;
      h = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      w = document.getElementsByTagName("body")[0].clientWidth;
      h = document.getElementsByTagName("body")[0].clientHeight;
    }

    return { width: w, height: h };
  };

  var width = getWindowDimensions().width;
  var height = getWindowDimensions().height;

  var canvas = document.getElementById("main-canvas");

  var platform = Stardust.platform("webgl-2d", canvas, width, height);

  platform.pixelRatio = window.devicePixelRatio || 1;

  var nodeCircles = Stardust.mark.create(Stardust.mark.circle(), platform);

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      // var jsonString = JSON.stringify(obj, null, 2);
      return JSON.stringify(obj, null, 2);
    } else {
      return "UNDEFINED";
    }
  }

  // var palette = {
  //   "black": [0,0,0,1],
  //   "blue": [33,118,199,1],
  //   "gray": [112,130,132,1],
  //   "green": [37,194,134,1],
  //   "lightgray": [129,144,144,1],
  //   "mediumgray": [83,104,112,1],
  //   "red": [209,28,36,1],
  //   "white": [1,1,1,1],
  //   "yellow": [165,119,6,1]
  // };

  // var categoryColorHashMap = new HashMap();

  // categoryColorHashMap.set("positive", palette.green);
  // categoryColorHashMap.set("negative", palette.red);
  // categoryColorHashMap.set("neutral", palette.lightgray);
  // categoryColorHashMap.set("none", palette.black);

  // categoryColorHashMap.set("left", palette.blue);
  // categoryColorHashMap.set("right", palette.yellow);


  var DEFAULT_MIN_RATE = 2.5;
  var minRate = DEFAULT_MIN_RATE;

  var DEFAULT_MIN_FOLLOWERS = 5000;
  var minFollowers = DEFAULT_MIN_FOLLOWERS;

  var DEFAULT_MIN_MENTIONS = 1000;
  var minMentions = DEFAULT_MIN_MENTIONS;

  var DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9;  // age users with many followers at a slower rate

  var mouseMovingFlag = false;

  var currentTwitterUser = twitterUserThreecee;
  var currentTwitterHashtag = "resist";
  var currentTwitterEmoji = "";

  var defaultProfileImageUrl = "favicon.png";

  var self = this;
  var simulation;

  var enableAgeNodes = true;
  var newCurrentMaxMentionsMetricFlag = true;
  var newCurrentMaxRateMetricFlag = true;

  var resumeTimeStamp = 0;
  var compactDateTimeFormat = "YYYYMMDD HHmmss";

  var sliderPercision = 5;

  var maxRateMentionsTopMargin = 2; // %
  var maxRateMentionsLeftMargin = 2; // %
  var hashtagTopMargin = 7; // %
  var hashtagLeftMargin = 2; // %
  var mentionsNumChars = 12;
  var rateNumChars = 8;

  var maxHashtagRows = 100;
  var maxHashtagCols = 5;

  // FORCE X & Y
  var xFocusLeftRatio = 0.3;
  var yFocusLeftRatio = 0.5;

  var xFocusRightRatio = 0.7;
  var yFocusRightRatio = 0.5;

  var xFocusPositiveRatio = 0.5;
  var yFocusPositiveRatio = 0.3;

  var yFocusNegativeRatio = 0.7;

  var xFocusNeutralRatio = 0.5;
  var yFocusNeutralRatio = 0.5;

  var xFocusDefaultRatio = 0.5;
  var yFocusDefaultRatio = 0.5;

  // INITIAL POSITION
  var xMinRatioLeft = 0.10;
  var xMaxRatioLeft = 0.35;

  var yMinRatioLeft = 0.75;
  var yMaxRatioLeft = 0.80;

  var xMinRatioRight = 0.65;
  var xMaxRatioRight = 0.90;

  var yMinRatioRight = 0.75;
  var yMaxRatioRight = 0.80;

  var xMinRatioPositive = 0.45;
  var xMaxRatioPositive = 0.55;

  var yMinRatioPositive = 0.65;
  var yMaxRatioPositive = 0.75;

  var xMinRatioNegative = 0.55;
  var xMaxRatioNegative = 0.65;

  var yMinRatioNegative = 0.65;
  var yMaxRatioNegative = 0.75;

  var xMinRatioNeutral = 0.45;
  var xMaxRatioNeutral = 0.55;

  var yMinRatioNeutral = 0.65;
  var yMaxRatioNeutral = 0.75;

  var foci = {
    left: {x: xFocusLeftRatio*width, y: yFocusLeftRatio*height}, 
    right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 
    positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
    negative: {x: xFocusNeutralRatio*width, y: yFocusNegativeRatio*height},
    neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
    default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
  };


  var nodeArray = [];
  var nodesTopTerm = [];

  var currentMaxMentionsMetric = 2;
  var currentMaxRateMetric = 2;

  var currentMax = {};

  currentMax.rate = {};
  currentMax.rate.isMaxNode = true;
  currentMax.rate.nodeId = "14607119";
  currentMax.rate.nodeType = "user";
  currentMax.rate.screenName = "threecee";
  currentMax.rate.rate = 0.1;
  currentMax.rate.mentions = 0.1;
  currentMax.rate.timeStamp = moment().valueOf();

  currentMax.mentions = {};
  currentMax.mentions.isMaxNode = true;
  currentMax.mentions.nodeId = "what";
  currentMax.mentions.nodeType = "hashtag";
  currentMax.mentions.screenName = "whatever";
  currentMax.mentions.rate = 0.1;
  currentMax.mentions.mentions = 0.1;
  currentMax.mentions.timeStamp = moment().valueOf();

  var deadNodesHash = {};

  function Node(nodePoolId){
    this.nodePoolId = nodePoolId;
    this.isValid = false;
    this.nodeId = "";
    this.nodeType = "user";
    this.screenName = "";
    this.followersCount = 0;
    this.followersMentions = 0;
    this.lastTweetId = false;
    this.text = "";
    this.name = "";
    this.isDead = true;
    this.mentions = 0;
    this.age = 1e-6;
    this.ageUpdated = moment().valueOf();
    this.ageMaxRatio = 1e-6;
    this.mouseHoverFlag = false;
    this.displaytext = "";
    this.rate = 1e-6;
    this.rank = -1;
    this.newFlag = true;
    this.x = 0.5*width;
    this.y = 0.5*height;
    this.isCategory = false;
    this.category = false;
    this.categoryAuto = false;
    this.categoryMatch = false;
    this.categoryMismatch = false;
    this.isTopTerm = false;
    this.isTrendingTopic = false;
    this.categoryColor = palette.black;
    this.isMaxNode = false;
  } 

  var nodePoolIndex = 0;

  var nodePool = deePool.create(function makeNode(){
    nodePoolIndex += 1;
    return (new Node("nodePoolId_" + nodePoolIndex));
  });


  var autoCategoryFlag = config.autoCategoryFlag;

  var metricMode = config.defaultMetricMode;
  var transitionDuration = config.defaultTransitionDuration;
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
  var fontSizeTopTermRatio = config.defaultFontSizeTopTermRatio;
  var fontSizeMin = config.defaultFontSizeMinRatio * height;
  var fontSizeMax = config.defaultFontSizeMaxRatio * height;

  var nodeRadiusMinRatio = config.defaultNodeRadiusMinRatio;
  var nodeRadiusMaxRatio = config.defaultNodeRadiusMaxRatio;
  var nodeRadiusMin = config.defaultNodeRadiusMinRatio * width;
  var nodeRadiusMax = config.defaultNodeRadiusMaxRatio * width;

  var rowSpacing = fontSizeTopTermRatio*110; // %
  var colSpacing = 90/maxHashtagCols; // %

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
  maxRateMentions.rateTimeStamp = moment().valueOf();
  maxRateMentions.mentionsTimeStamp = moment().valueOf();
  maxRateMentions.mentions = 2;
  maxRateMentions.ageMaxRatio = 1e-6;
  maxRateMentions.isTrendingTopic = true;
  maxRateMentions.displaytext = "WHAT?";
  maxRateMentions.mouseHoverFlag = false;
  maxRateMentions.x = 100;
  maxRateMentions.y = 100;

  console.warn("TREEPACK CONFIG\n" + jsonPrint(config));

  var testMode = false;
  var freezeFlag = false;

  var MAX_NODES = 100;

  var NEW_NODE_AGE_RATIO = 0.01;

  var minOpacity = 0.2;
  var antonymFlag = false;
  var removeDeadNodesFlag = true;

  var DEFAULT_AGE_RATE = 1.0;
  var MAX_RX_QUEUE = 100;

  var localNodeHashMap = new HashMap();
  var nodeIdHashMap = new HashMap();

  var maxNodeAddQ = 0;
  var maxNumberNodes = 0;

  var runningFlag = false;
  
  var nodeAddQ = [];
  var nodeDeleteQ = [];

  self.sessionKeepalive = function() {
    return null;
  };

  self.mouseMoving = function(isMoving) {
    if (isMoving && !mouseMovingFlag) {
      mouseMovingFlag = isMoving;
      // updateNodeLabels();
    }
    else { 
      mouseMovingFlag = isMoving;
    }
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

  var defaultStrokeWidth = "3.0px";
  var topTermStrokeWidth = "6.0px";
  var newFlagStrokeWidth = "6.0px";

  var categoryMatchColor = palette.green;
  var categoryMatchStrokeWidth = "8.0px";
  var categoryMismatchStrokeWidth = "10.0px";
  var categoryAutoStrokeWidth = "16.0px";

  var divTooltip = d3.select("body").append("div")
    .attr("id", "divTooltip")
    .attr("class", "tooltip")
    .style("display", "none");

  var mouseMoveTimeoutEventHandler = function(e) {
  };


  document.addEventListener("mouseMoveTimeoutEvent", mouseMoveTimeoutEventHandler);

  document.addEventListener("mousemove", function mousemoveFunc() {

    if (mouseHoverFlag) { d3.select("body").style("cursor", "pointer"); } 
    else { d3.select("body").style("cursor", "default"); }

  }, true);

  var defaultRadiusScale = d3.scaleLinear()
    .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

  var imageSizeScale = d3.scaleLinear()
    .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

  var emojiLabelSizeScale = d3.scaleLinear()
    .domain([1, currentMax[metricMode][metricMode]])
    .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
    .clamp(true);

  var nodeLabelSizeScale = d3.scaleLinear()
    .domain([1, currentMax[metricMode][metricMode]])
    .range([fontSizeMin, fontSizeMax])
    .clamp(true);
    
  var topTermLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 1.0])
    .range([1.0, minOpacity])
    .clamp(true);
    
  var nodeLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 0.1, 1.0])
    .range([1.0, 0.5, minOpacity])
    .clamp(true);
    
  var adjustedAgeRateScale = d3.scaleLinear()
    .domain([1, MAX_NODES])
    .range([1.0, 10.0]);

  var zoomFactor = DEFAULT_ZOOM_FACTOR;
  var panzoomElement = document.getElementById("main-canvas");

  panzoom(panzoomElement, { 
    zoomSpeed: 0.040,
    smoothScroll: true,
    autocenter: true
  }).zoomAbs(
    0.5*width,
    0.5*height,
    zoomFactor
  );

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
  
  self.setEnableAgeNodes = function(enabled) {
    enableAgeNodes = enabled;
    config.enableAgeNodes = enabled;
  };
  
  this.deleteNode = function() { return null; };
  
  this.getNodesLength = function() { return "NODES: " + nodeArray.length + " | POOL: " + nodePool.size(); };
  
  this.getMaxNodes = function() { return maxNumberNodes; };
  
  this.getNodeAddQlength = function() { return nodeAddQ.length; };
  
  this.getMaxNodeAddQ = function() { return maxNodeAddQ; };
    
  this.getAgeRate = function() { return ageRate; };
  
  this.setNodeMaxAge = function(mAge) {
    nodeMaxAge = mAge;
    config.defaultMaxAge = mAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  };

  this.getMaxAgeRate = function() { return maxAgeRate; };
  
  this.setAntonym = function(flag) {
    antonymFlag = flag;
    console.debug("SET ANTONYM: " + antonymFlag);
  };

  this.setTwitterUser = function(user) {

    if (user.notFound !== undefined) { console.log("setTwitterUser | NOT FOUND: @"  + user.screenName); }
    else { console.log("setTwitterUser | "  + user.userId + " | @" + user.screenName); }

    if (controlPanelReadyFlag){ 
      controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: user}, DEFAULT_SOURCE);
    }
  };

  this.setTwitterHashtag = function(hashtag) {
    console.log("setTwitterHashtag | HTID: "  + hashtag.hashtagId + " | #" + hashtag.text);
    
    if (controlPanelReadyFlag){
      controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: hashtag}, DEFAULT_SOURCE);
    }
  };

  this.setMetricMode = function(mode) {

    metricMode = mode;
    config.defaultMetricMode = mode;

    emojiLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
      .clamp(true);

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[mode][mode]])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    defaultRadiusScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMax[mode][mode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);

    imageSizeScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);

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
    if (value) { self.simulationControl("PAUSE");  }
    else { self.simulationControl("RESUME"); }
  };

  self.togglePause = function(){
    if (runningFlag) { self.simulationControl("PAUSE"); }
    else { self.simulationControl("RESUME"); }
  };

  self.updateParam = function(param, value) {
    console.log("updateParam: " + param + " = " + value);
    return;
  };

  self.updateVelocityDecay = function(value) {
    console.debug("UPDATE VEL DECAY: " + value.toFixed(sliderPercision));
    config.defaultVelocityDecay = value;
    velocityDecay = value;
    simulation.velocityDecay(velocityDecay);
  };

  self.updateGravity = function(value) {
    console.debug("UPDATE GRAVITY: " + value.toFixed(5));
    config.defaultGravity = value;
    gravity = value;

    simulation
      .force("forceX", d3.forceX().x(function(d) { 
        if ((autoCategoryFlag && d.categoryAuto) || (!d.category && d.categoryAuto)){
          return foci[d.categoryAuto].x;
        }
        if (d.category){ return foci[d.category].x; }
        return foci.default.x;
      }).strength(function(d){
        return forceXmultiplier * gravity; 
      }))
      .force("forceY", d3.forceY().y(function(d) { 
        if ((autoCategoryFlag && d.categoryAuto) || (!d.category && d.categoryAuto)){
          return foci[d.categoryAuto].y;
        }
        if (d.category){ return foci[d.category].y; }
        return foci.default.y;
      }).strength(function(d){
        return forceYmultiplier * gravity; 
      }));
  };

  self.updateTransitionDuration = function(value) {
    console.debug("UPDATE TRANSITION DURATION: " + value);
    transitionDuration = value;
    config.defaultTransitionDuration = value;
  };

  self.updateCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  self.updateNodeRadiusMinRatio = function(value) {
    console.debug("UPDATE NODE RADIUS MIN RATIO: " + value);
    config.defaultNodeRadiusMinRatio = value;
    nodeRadiusMinRatio = value;
    nodeRadiusMin = value * width;
    defaultRadiusScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
    imageSizeScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.updateNodeRadiusMaxRatio = function(value) {
    console.debug("UPDATE NODE RADIUS MAX RATIO: " + value);
    config.defaultNodeRadiusMaxRatio = value;
    nodeRadiusMaxRatio = value;
    nodeRadiusMax = value * width;
    defaultRadiusScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
    imageSizeScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.updateFontSizeMinRatio = function(value) {
    console.debug("UPDATE FONT MIN SIZE: " + value);
    config.defaultFontSizeMinRatio = value;

    fontSizeMinRatio = value;
    fontSizeMin = value * height;

    emojiLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
      .clamp(true);

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.updateFontSizeMaxRatio = function(value) {
    console.debug("UPDATE FONT MAX SIZE: " + value);
    config.defaultFontSizeMaxRatio = value;

    fontSizeMaxRatio = value;
    fontSizeMax = value * height;

    emojiLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
      .clamp(true);

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.resetDefaultForce = function() {
    console.warn("RESET TREEPACK DEFAULT FORCE");
    self.updateTransitionDuration(config.defaultTransitionDuration);
    self.setNodeMaxAge(config.defaultMaxAge);
    self.updateCharge(config.defaultCharge);
    self.updateVelocityDecay(config.defaultVelocityDecay);
    self.updateGravity(config.defaultGravity);
  };

  var keysForRankHashMap = [];
  function rankHashMapByValue(hmap, sortProperty, callback) {

    keysForRankHashMap = hmap.keys().sort(function hmapSortFunc(a,b){
      if (!hmap.get(a).isValid && !hmap.get(b).isValid) { return 0; }
      if (!hmap.get(a).isValid && hmap.get(b).isValid) { return -1; }
      if (hmap.get(a).isValid && !hmap.get(b).isValid) { return 1; }
      return hmap.get(b)[sortProperty]-hmap.get(a)[sortProperty];
    });

    async.forEachOf(keysForRankHashMap, function keysRank(key, index, cb) {

      var entry = hmap.get(key);
      entry.rank = index;

      hmap.set(key, entry);
      cb();

    }, function keysRankCallback(err) {
      if (err) { console.error("rankHashMapByValue ERROR: " + err); }
      callback(hmap);
    });
  }

  var keysForRankArray = [];
  function rankArrayByValue(arr, sortProperty, callback) {

    keysForRankArray = arr.sort(function hmapSortFunc(a,b){
      if (!a.isValid && !b.isValid) { return 0; }
      if (!a.isValid && b.isValid) { return -1; }
      if (a.isValid && !b.isValid) { return 1; }
      return b[sortProperty]-a[sortProperty];
    });

    async.forEachOf(keysForRankArray, function keysRank(nodeId, index, cb) {

      arr[index].rank = index;
      cb();

    }, function keysRankCallback(err) {
      if (err) { console.error("rankArrayByValue ERROR: " + err); }
      callback(arr);
    });
  }

  function resetNode(n, callback){
    n.age = 1e-6;
    n.ageMaxRatio = 1e-6;
    n.ageUpdated = moment().valueOf();
    n.category = false;
    n.categoryAuto = false;
    n.categoryColor = palette.black;
    n.categoryMatch = false;
    n.categoryMismatch = false;
    n.displaytext = "";
    n.followersCount = 0;
    n.followersMentions = 0;
    n.isCategory = false;
    n.isDead = true;
    n.isMaxNode = false;
    n.isTopTerm = false;
    n.isTrendingTopic = false;
    n.isValid = false;
    n.mentions = 0;
    n.mouseHoverFlag = false;
    n.name = "";
    n.newFlag = true;
    n.nodeId = "";
    n.nodeType = "user";
    n.rank = -1;
    n.rate = 1e-6;
    n.screenName = "";
    n.text = "";
    n.lastTweetId = false;

    callback(n);
  }

  var age;
  var ageMaxRatio = 1e-6;
  var ageNodesLength = 0;
  var node;
  var nPoolId;
  var prevNode;
  var currentTime = moment().valueOf();
  var nodeIdArray = [];
  var tempNodeArray = [];
  var tempNodesTopTerm = [];

  var ageNodes = function (callback) {

    tempNodeArray = [];
    tempNodesTopTerm = [];

    nodeIdArray = nodeIdHashMap.keys();
    ageMaxRatio = 1e-6;
    ageNodesLength = nodeIdArray.length;

    if (ageNodesLength === 0) { ageRate = DEFAULT_AGE_RATE; } 
    else if ((ageNodesLength > MAX_NODES) && (nodeAddQ.length <= MAX_RX_QUEUE)) {
      ageRate = adjustedAgeRateScale(ageNodesLength - MAX_NODES);
    } 
    else if (nodeAddQ.length > MAX_RX_QUEUE) { ageRate = adjustedAgeRateScale(nodeAddQ.length - MAX_RX_QUEUE); } 
    else { ageRate = DEFAULT_AGE_RATE; }

    maxAgeRate = Math.max(ageRate, maxAgeRate);
    currentTime = moment().valueOf();

    nodeIdArray.forEach(function(nodeId){

      nPoolId = nodeIdHashMap.get(nodeId);
      node = localNodeHashMap.get(nPoolId);

      if (!node.isValid || node.isDead) {
        return;
      }

      if (!enableAgeNodes || (resumeTimeStamp > 0)) {
        ageRate = 1e-6;
      }

      if ((node.nodeType === "user") && node.followersCount && (node.followersCount > minFollowers)){
        age = node.age + (ageRate * DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO * (currentTime - node.ageUpdated));
      }
      else {
        age = node.age + (ageRate * (currentTime - node.ageUpdated));
      }

      ageMaxRatio = age/nodeMaxAge ;

      if (removeDeadNodesFlag && (age >= nodeMaxAge)) {

        node.isDead = true;
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;

        nodeIdHashMap.remove(node.nodeId);
        localNodeHashMap.set(nPoolId, node);

        if (node.isValid) {
          node.isValid = false;
          resetNode(node, function(n){
            nodePool.recycle(n);
            // console.debug("NODE POOL SIZE: " + nodePool.size());     
          });
        }
      } 
      else {
        node.isValid = true;
        node.isDead = false;
        node.ageUpdated = currentTime;
        node.age = Math.max(age, 1e-6);
        node.ageMaxRatio = Math.max(ageMaxRatio, 1e-6);

        // node.newFlag = false; // 

        localNodeHashMap.set(nPoolId, node);
        nodeIdHashMap.set(node.nodeId, nPoolId);

        tempNodeArray.push(node);
      }
    });

    resumeTimeStamp = 0;

    // maxRateMentionsText.text(createDisplayText(currentMax[metricMode]));

    rankArrayByValue(tempNodesTopTerm, metricMode, function rankArrayByValueFunc(){
      nodeArray = tempNodeArray;
      callback(null);
    });
  };

  var previousTwitterUserId;
  var previousTwitterEmoji;
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

      case "emoji":

        currentTwitterEmoji = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterEmoji || (previousTwitterEmoji !== d.nodeId))){
          previousTwitterEmoji = currentTwitterEmoji.nodeId;
        }

        tooltipString = d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " MPM";
      break;

      case "user":

        currentTwitterUser = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterUserId || (previousTwitterUserId !== d.userId))){
          previousTwitterUserId = currentTwitterUser.userId;
        }

        tooltipString = "@" + d.screenName
          + "<br>" + d.name 
          + "<br>FLWRs: " + d.followersCount
          + "<br>FRNDs: " + d.friendsCount
          + "<br>FMs: " + d.followersMentions
          + "<br>Ms: " + d.mentions
          + "<br>Ts: " + d.statusesCount
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;

      case "hashtag":

        currentTwitterHashtag = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        tooltipString = "#" + d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " MPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;

      case "media":
        tooltipString = "ID: " + d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>URL: " + d.url
          + "<br>MEDIA URL: " + d.mediaUrl;
      break;

      case "word":
        tooltipString = d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;

      case "place":
        tooltipString = d.fullName
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;
    }

    divTooltip.html(tooltipString);
    divTooltip
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
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
      if (d.category) { return "unset"; }
      if (d.rate > minRate) { return "unset"; }
      if ((d.nodeType === "user") 
        && (
          (d.followersCount > minFollowers) 
          || (d.mentions > minMentions) 
          || (d.screenName.toLowerCase().includes("trump"))
          || (d.name && d.name.toLowerCase().includes("trump"))
          )
      ) { 
        return ""; 
      }
      if ((d.nodeType === "hashtag") && ((d.mentions > minMentions) || (d.text.toLowerCase().includes("trump")))){ 
        return ""; 
      }
      return "none";
    });
  }

  function labelText(d) {
    if (d.nodeType === "emoji") { 
      if (d.category || d.categoryAuto) { return d.text.toUpperCase(); }
      if (d.mentions >= minMentions) { return d.text.toUpperCase(); }
      return d.text.toLowerCase(); 
    }
    if (d.nodeType === "hashtag") { 
      if (d.category || d.categoryAuto) { return "#" + d.text.toUpperCase(); }
      if (d.mentions >= minMentions) { return "#" + d.text.toUpperCase(); }
      return "#" + d.text.toLowerCase(); 
    }
    if (d.nodeType === "user") { 
      if (d.screenName) { 
        if (d.category || d.categoryAuto) { return "@" + d.screenName.toUpperCase(); }
        if (d.followersCount >= minFollowers) { return "@" + d.screenName.toUpperCase(); }
        if (d.mentions >= minMentions) { return "@" + d.screenName.toUpperCase(); }
        return "@" + d.screenName.toLowerCase(); 
      }
      else if (d.name){ 
        if (d.category || d.categoryAuto) { return "@" + d.name.toUpperCase(); }
        if (d.followersCount >= minFollowers) { return "@" + d.name.toUpperCase(); }
        if (d.mentions >= minMentions) { return "@" + d.name.toUpperCase(); }
        return "@" + d.name.toLowerCase(); 
      }
      else { return "@UNKNOWN?"; }
    }
    if (d.nodeType === "place") {  
      if (d.fullName) { return d.fullName.toUpperCase(); }
    }
    return d.nodeId; 
  }

  var nodeUrl = "";
  function nodeClick(d) {

    switch (d.nodeType) {

      case "user" :

        currentTwitterUser = d;
        
        if (controlPanelReadyFlag) {
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: currentTwitterUser, nodeSearch:true}, DEFAULT_SOURCE);
        }

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterUserId || (previousTwitterUserId !== d.userId))){
          previousTwitterUserId = currentTwitterUser.userId;
        }

        if ((d.lastTweetId !== undefined) && (d.lastTweetId !== "false")) {
          nodeUrl = "https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId ;
          console.debug("LOADING TWITTER USER: " + "https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId);
          window.open("https://twitter.com/" + d.screenName + "/status/" + d.lastTweetId, "_blank");
        }
        else {
          nodeUrl = "https://twitter.com/" + d.screenName ;
          console.debug("LOADING TWITTER USER: " + "https://twitter.com/" + d.screenName);
          window.open("https://twitter.com/" + d.screenName, "_blank");
        }
      break;

      case "media" :
        console.debug("LOADING MEDIA: " + d.url);
        window.open(d.url, "_blank");
      break;

      case "hashtag" :

        currentTwitterHashtag = d;

        if (controlPanelReadyFlag) {
          controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: currentTwitterHashtag}, DEFAULT_SOURCE);
        }

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        window.open("https://twitter.com/search?f=tweets&q=%23"+d.text, "_blank");
      break;

      case "place" :
        window.open("http://twitter.com/search?q=place%3A" + d.placeId, "_blank");
      break;
    }
  }

  var positions;
  var positionScale;

  var updateNodeCircles = function(callback) {


    positions = Stardust.array("Vector2")
      .value(d => [d.x, d.y])
      .data(nodeArray);

    positionScale = Stardust.scale.custom("array(pos, value)")
      .attr("pos", "Vector2Array", positions);

   nodeCircles.data(nodeArray)
      .attr("center", positionScale(d => d.index))
      .attr("color", function(d){ 
        return [d.categoryColor[0], d.categoryColor[1], d.categoryColor[2], 1-d.ageMaxRatio]; 
      })
      .attr("radius", function(d){
        if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
        if (metricMode === "mentions") {return defaultRadiusScale(Math.sqrt(d.mentions));}
      });

    platform.clear([1, 1, 1, 1]);

    nodeCircles.render();

    callback();
  };

  var focus = function(focalPoint){
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
      default:
        return({
          x: randomIntFromInterval(xMinRatioNeutral*width, xMaxRatioNeutral*width), 
          y: randomIntFromInterval(yMinRatioNeutral*height, yMaxRatioNeutral*height)
        });
    }
  };

  var mentionsInt = 0;
  var rateString = "";
  var mentionPadSpaces = 0;
  var ratePadSpaces = 0;
  var displaytext = "";
  var nodeIdString = "";

  var createDisplayText = function(node) {

    mentionsInt = parseInt(node.mentions);
    rateString = node.rate.toFixed(2).toString() ;

    mentionPadSpaces = mentionsNumChars - mentionsInt.toString().length;
    ratePadSpaces = rateNumChars - rateString.length;

    if (node.nodeType === "user") { 
      nodeIdString = node.screenName.toUpperCase();
      nodeIdString = "@" + nodeIdString; 
    }
    if (node.nodeType === "hashtag") { 
      nodeIdString = node.nodeId.toUpperCase();
      nodeIdString = "#" + nodeIdString; 
    }

    displaytext = "";

    if (node.isMaxNode) {
      if (metricMode === "rate") {
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
        + " | " + nodeIdString
        + " | RATE MAX " + moment(parseInt(node.timeStamp)).format(compactDateTimeFormat);
      }
      else {
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt
        + " | " + nodeIdString
        + " | MENTION MAX " + moment(parseInt(node.timeStamp)).format(compactDateTimeFormat);
      }
    }
    else {
      if (node.nodeType === "user") { 
        if (node.screenName) {
          displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
          + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
          + " | @" + node.screenName.toUpperCase() ;
        }
        else if (node.name) {
          displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
          + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
          + " | @" + node.name.toUpperCase() ;
        }
        else {
          displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
          + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
          + " | @UNKNOWN?";
        }
      }
      else if (node.nodeType === "hashtag") { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
        + " | #" + node.text.toUpperCase() ;
      }
      else if (node.nodeType === "place") { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
        + " | " + node.fullName.toUpperCase() ;
      }
      else if (testMode) { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
        + " | BLAH" ;
      }
      else { 
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
        + " | " + node.nodeId.toUpperCase() ;
      }
    }

    return displaytext;
  };

  var newNode = {};
  var nodeAddQReady = true;
  var currentNode;
  var nodePoolId;
  // var nodePoolIdcircle;

  var processNodeAddQ = function(callback) {

    if (nodeAddQReady && (nodeAddQ.length > 0)) {

      nodeAddQReady = false;

      newNode = nodeAddQ.shift();

      if (nodeIdHashMap.has(newNode.nodeId)){

        nodePoolId = nodeIdHashMap.get(newNode.nodeId);

        currentNode = localNodeHashMap.get(nodePoolId);

        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.isDead = false;
        currentNode.isMaxNode = false;
        currentNode.isValid = true;
        currentNode.mouseHoverFlag = false;
        currentNode.newFlag = true;

        currentNode.rate = newNode.rate;
        currentNode.mentions = newNode.mentions;
        currentNode.isTopTerm = newNode.isTopTerm;
        currentNode.isTrendingTopic = newNode.isTrendingTopic;
        currentNode.category = newNode.category;
        currentNode.categoryAuto = newNode.categoryAuto;
        currentNode.lastTweetId = newNode.lastTweetId;

        if (newNode.nodeType === "user"){
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        if (newNode.nodeType === "media"){
          currentNode.url = newNode.url;
          currentNode.mediaUrl = newNode.mediaUrl;
        }

        currentNode.displaytext = createDisplayText(currentNode);

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);

        nodeAddQReady = true;

        callback(null);
      }
      else {

        currentNode = nodePool.use();

        nodeIdHashMap.set(newNode.nodeId, currentNode.nodePoolId);

        currentNode.isValid = true;
        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.isDead = false;
        currentNode.isMaxNode = false;
        currentNode.mouseHoverFlag = false;
        currentNode.newFlag = true;
        currentNode.x = 0.5*width;
        currentNode.y = 0.5*height;

        currentNode.nodeId = newNode.nodeId;
        currentNode.userId = newNode.userId;
        currentNode.hashtagId = newNode.hashtagId;
        currentNode.emojiId = newNode.emojiId;
        currentNode.placeId = newNode.placeId;
        currentNode.wordId = newNode.wordId;
        currentNode.fullName = newNode.fullName;
        currentNode.nodeType = newNode.nodeType;
        currentNode.screenName = newNode.screenName;
        currentNode.name = newNode.name;
        currentNode.rate = newNode.rate;
        currentNode.text = newNode.text;
        currentNode.rank = newNode.rank;
        currentNode.isTopTerm = newNode.isTopTerm;
        currentNode.isTrendingTopic = newNode.isTrendingTopic;
        currentNode.category = newNode.category;
        currentNode.categoryAuto = newNode.categoryAuto;
        currentNode.isCategory = newNode.isCategory;
        currentNode.categoryMatch = newNode.categoryMatch;
        currentNode.categoryMismatch = newNode.categoryMismatch;
        currentNode.categoryColor = newNode.categoryColor;
        currentNode.mentions = newNode.mentions;
        currentNode.statusesCount = newNode.statusesCount;
        currentNode.friendsCount = newNode.friendsCount;
        currentNode.lastTweetId = newNode.lastTweetId;

        if (newNode.nodeType === "user"){
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        if (newNode.nodeType === "media"){
          currentNode.url = newNode.url;
          currentNode.mediaUrl = newNode.mediaUrl;
          currentNode.width = 100;
          currentNode.height = 100;
        }

        currentNode.displaytext = createDisplayText(currentNode);

        if (newNode.category || newNode.categoryAuto) {

          if (autoCategoryFlag && newNode.categoryAuto) { 
            currentNode.x = focus(newNode.categoryAuto).x; 
            currentNode.y = focus(newNode.categoryAuto).y;
          }
          else if (newNode.categoryAuto && !newNode.category) { 
            currentNode.x = focus(newNode.categoryAuto).x; 
            currentNode.y = focus(newNode.categoryAuto).y;
          }
          else if (newNode.category) { 
            currentNode.x = focus(newNode.category).x; 
            currentNode.y = focus(newNode.category).y;
          }

        }
        else {
          currentNode.x = focus("neutral").x; 
          currentNode.y = focus("neutral").y;
        }

        // nodePoolIdcircle = document.getElementById(currentNode.nodePoolId);

        // if (nodePoolIdcircle) {
        //   nodePoolIdcircle.setAttribute("r", 1e-6);
        //   // nodePoolIdcircle.setAttribute("visibility", "hidden");
        //   nodePoolIdcircle.setAttribute("display", "none");
        //   // nodePoolIdcircle.setAttribute("opacity", 1e-6);
        //   nodePoolIdcircle.setAttribute("fill-opacity", 1e-6);
        //   nodePoolIdcircle.setAttribute("stroke-opacity", 1e-6);
        // }

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);

        nodeAddQReady = true;

        callback(null);
      }

      if (nodeIdHashMap.size > maxNumberNodes) { maxNumberNodes = nodeIdHashMap.size; }

    }
    else {
      if (nodeIdHashMap.size > maxNumberNodes) { maxNumberNodes = nodeIdHashMap.size; }
      callback(null);
    }
  };

  function ticked() {
    drawSimulation(function drawSimulationCallback() { updateSimulation(); });
  }

  var previousMaxRateMetric = 0;
  var previousMaxMentionsMetric = 0;

  function drawSimulation(callback){

    async.series([
      // function updateNodeMediaSeries (cb){ updateNodeMedia(cb); },
      function updateNodeCirclesSeries (cb){ updateNodeCircles(cb); },
      // function updateNodeLabelsSeries (cb){ updateNodeLabels(cb); },
      // function updateTopTermSeries (cb){ updateTopTerm(cb); }
    ], function drawSimulationCallback (err, results) {

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
          previousMaxMentionsMetric = currentMax.mentions.mentions;
        }

        nodeLabelSizeScale = d3.scaleLinear()
          .domain([1, currentMax[metricMode][metricMode]])
          .range([fontSizeMin, fontSizeMax])
          .clamp(true);

        emojiLabelSizeScale = d3.scaleLinear()
          .domain([1, currentMax[metricMode][metricMode]])
          .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
          .clamp(true);

        defaultRadiusScale = d3.scaleLinear()
          .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
          .range([nodeRadiusMin, nodeRadiusMax])
          .clamp(true);

      }

      callback();
    });
  }

  function updateSimulation() {

    async.series(
      {
        addNode: processNodeAddQ,
        ageNode: ageNodes
      },
      function updateSimulationCallback() {
        simulation.nodes(nodeArray);
      }
    );
  }

  function yposition(d){
    if (d.rank < 0) { return height; }
    return (hashtagTopMargin + ((d.rank % maxHashtagRows) * rowSpacing)) + "%";
  }

  function xposition(d){
    if (d.rank < 0) { return hashtagLeftMargin; }
    return (hashtagLeftMargin + ((parseInt(d.rank / maxHashtagRows)) * colSpacing)) + "%" ;
  }

  this.setChargeSliderValue = function(value){
    console.debug("SET CHARGE: " + value);
    config.defaultCharge = value;
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  };

  this.addNode = function(newNode) {

    self.setEnableAgeNodes(true);

    newNode.age = 1e-6;
    newNode.ageUpdated = moment().valueOf();
    newNode.ageMaxRatio = 1e-6;
    newNode.rank = -1;
    newNode.newFlag = true;
    newNode.followersCount = (newNode.followersCount) ? parseInt(newNode.followersCount) : 0;
    newNode.mentions = (newNode.mentions) ? parseInt(newNode.mentions) : 0;

    if (newNode.nodeType === "user") {
      newNode.followersMentions = newNode.mentions + newNode.followersCount;
    }

    if (newNode.mentions > currentMax.mentions.mentions) { 

      newCurrentMaxMentionsMetricFlag = true;

      currentMax.mentions.nodeType = newNode.nodeType;
      currentMax.mentions.nodeId = newNode.nodeId; 
      currentMax.mentions.screenName = newNode.screenName; 
      currentMax.mentions.mentions = newNode.mentions; 
      currentMax.mentions.rate = newNode.rate;
      currentMax.mentions.timeStamp = moment().valueOf(); 

      if (metricMode === "mentions") {
        currentMaxMentionsMetric = newNode.mentions; 
      }
    }

    if (newNode.rate > currentMax.rate.rate) { 

      newCurrentMaxRateMetricFlag = true;

      currentMax.rate.nodeType = newNode.nodeType;
      currentMax.rate.nodeId = newNode.nodeId;
      currentMax.rate.screenName = newNode.screenName; 
      currentMax.rate.rate = newNode.rate;
      currentMax.rate.mentions = newNode.mentions;
      currentMax.rate.timeStamp = moment().valueOf(); 

      if (metricMode === "rate") { currentMaxRateMetric = newNode.rate; }
    }

    if (nodeAddQ.length < MAX_RX_QUEUE) { nodeAddQ.push(newNode); }

    if (nodeAddQ.length > maxNodeAddQ) { maxNodeAddQ = nodeAddQ.length; }
  };

  this.addGroup = function() {
    // not used
  };

  this.addSession = function() {
    // not used
  };

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodeArray)
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX().x(function forceXfunc(d) { 
        if ((autoCategoryFlag && d.categoryAuto) || (!d.category && d.categoryAuto)) { return foci[d.categoryAuto].x; }
        if (d.category) { return foci[d.category].x; }
        return foci.default.x;
      }).strength(function strengthFunc(d) { return forceXmultiplier * gravity; }))
      .force("forceY", d3.forceY().y(function forceYfunc(d) { 
        if ((autoCategoryFlag && d.categoryAuto) || (!d.category && d.categorya)){ return foci[d.categoryAuto].y; }
        if (d.category){ return foci[d.category].y; }
        return foci.default.y;
      }).strength(function strengthFunc(d){ return forceYmultiplier * gravity; }))
      .force("collide", d3.forceCollide().radius(function forceCollideFunc(d) { 
        if (metricMode === "rate") { return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate));}
        if (metricMode === "mentions") { return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions)); }
      })
      .iterations(collisionIterations).strength(1.0))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);
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
        resumeTimeStamp = moment().valueOf();
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

  this.resize = function() {

    d3image = d3.select("#d3group");

    width = getWindowDimensions().width;
    height = getWindowDimensions().height;

    // const currentMaxMetric = (metricMode === "rate") ? currentMaxRateMetric : currentMaxMentionsMetric ;

    foci = {
      left: {x: xFocusLeftRatio*width, y: yFocusLeftRatio*height}, 
      right: {x: xFocusRightRatio*width, y: yFocusRightRatio*height}, 
      positive: {x: xFocusPositiveRatio*width, y: yFocusPositiveRatio*height}, 
      negative: {x: xFocusNeutralRatio*width, y: yFocusNegativeRatio*height},
      neutral: {x: xFocusNeutralRatio*width, y: yFocusNeutralRatio*height},
      default: {x: xFocusDefaultRatio*width, y: yFocusDefaultRatio*height}
    };

    nodeRadiusMin = nodeRadiusMinRatio * width;
    nodeRadiusMax = nodeRadiusMaxRatio * width;

    defaultRadiusScale = d3.scaleLinear()
    .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

    fontSizeMin = fontSizeMinRatio * height;
    fontSizeMax = fontSizeMaxRatio * height;

    emojiLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
      .clamp(true);

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    // svgMain
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("x", 1e-6)
    //   .attr("y", 1e-6);

    // svgTreemapLayoutArea
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("x", 1e-6)
    //   .attr("y", 1e-6);

    // svgTopTermLayoutArea
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("x", 1e-6)
    //   .attr("y", 1e-6);

    // nodeTopTermLabelSvgGroup
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("x", 1e-6)
    //   .attr("y", 1e-6);

    // svgTopTerms
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("x", 1e-6)
    //   .attr("y", 1e-6);

    // fontTopTerm = fontSizeTopTermRatio * topTermsDiv.height;
    rowSpacing = fontSizeTopTermRatio*110; // %

    if (simulation){
      simulation
        .force("charge", d3.forceManyBody().strength(charge))
        .force("forceX", d3.forceX().x(function forceXfunc(d) { 
          if ((autoCategoryFlag && d.categoryAuto) || (!d.category && d.categoryAuto)) {
            return foci[d.categoryAuto].x;
          }
          if (d.category){ return foci[d.category].x; }
          return foci.default.x;
        }).strength(function strengthFunc(d){
          return forceXmultiplier * gravity; 
        }))
        .force("forceY", d3.forceY().y(function forceYfunc(d) { 
          if ((autoCategoryFlag && d.categoryAuto) || (!d.category && d.categoryAuto)){
            return foci[d.categoryAuto].y;
          }
          if (d.category){ return foci[d.category].y; }
          return foci.default.y;
        }).strength(function strengthFunc(d){
          return forceYmultiplier * gravity; 
        }))
        .force("collide", d3.forceCollide().radius(function forceCollideFunc(d) { 
          if (metricMode === "rate") {return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.rate));}
          if (metricMode === "mentions") {
            return collisionRadiusMultiplier * defaultRadiusScale(Math.sqrt(d.mentions));
          }
        })
        .iterations(collisionIterations))
        .velocityDecay(velocityDecay);
    }
  };

  // ==========================================

  document.addEventListener("resize", function resizeFunc() { self.resize();  }, true);

  self.reset = function() {
    console.info("RESET");
    deadNodesHash = {};
    mouseHoverFlag = false;
    localNodeHashMap.clear();
    nodeIdHashMap.clear();
    nodeArray = [];
    nodesTopTermHashMap.clear();
    self.toolTipVisibility(false);
    self.resize();
    self.resetDefaultForce();
  };

}