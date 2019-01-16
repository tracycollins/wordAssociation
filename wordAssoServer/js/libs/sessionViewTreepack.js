/*jslint node: false */

function ViewTreepack() {

  // "use strict";

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  // var workerAgeNodes = new Worker("ageNodes.js");

  var initialXposition = 0.5;
  var initialYposition = 0.9;

  var DEFAULT_ZOOM_FACTOR = 0.4;
  // var emojiFontMulipier = 2.0;
  var minRateMetricChange = 0.5;

  // var topTermsDivVisible = false;

  var getWindowDimensions = function (){

    if (window.innerWidth !== "undefined") {
      w = window.innerWidth;
      h = window.innerHeight;
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
      // var jsonString = JSON.stringify(obj, null, 2);
      return JSON.stringify(obj, null, 2);
    } else {
      return "UNDEFINED";
    }
  }

  var palette = {
    "black": "#000000",
    "white": "#FFFFFF",
    // "lightgray": "#819090",
    "lightgray": "#AAAAAA",
    // "gray": "#708284",
    "gray": "#888888",
    "mediumgray": "#536870",
    "darkgray": "#475B62",
    "darkblue": "#0A2933",
    "darkerblue": "#042029",
    "paleryellow": "#FCF4DC",
    "paleyellow": "#EAE3CB",
    "yellow": "#A57706",
    "orange": "#BD3613",
    "red": "#D11C24",
    "pink": "#C61C6F",
    "purple": "#595AB7",
    "blue": "#4808FF",
    "green": "#00E540",
    "darkergreen": "#008200",
    "lightgreen":  "#35A296",
    "yellowgreen": "#738A05"
  };

  var DEFAULT_MIN_RATE = 0.1;
  var minRate = DEFAULT_MIN_RATE;

  var DEFAULT_MIN_FOLLOWERS = 5000;
  var minFollowers = DEFAULT_MIN_FOLLOWERS;

  var DEFAULT_MIN_MENTIONS = 1000;

  var minMentions = DEFAULT_MIN_MENTIONS;
  var minMentionsUsers = DEFAULT_MIN_MENTIONS;
  var minMentionsHashtags = 100;

  var DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9;  // age users with many followers at a slower rate

  var mouseMovingFlag = false;

  var currentTwitterUser = twitterUserThreecee;
  var currentTwitterHashtag = "resist";

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
  var xMinRatioLeft = 0.3;
  var xMaxRatioLeft = 0.35;

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
    negative: {x: xFocusNeutralRatio*width, y: yFocusNegativeRatio*height},
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
  currentMax.rate.timeStamp = Date.now();

  currentMax.mentions = {};
  currentMax.mentions.isMaxNode = true;
  currentMax.mentions.nodeId = "what";
  currentMax.mentions.nodeType = "hashtag";
  currentMax.mentions.screenName = "whatever";
  currentMax.mentions.rate = 0.1;
  currentMax.mentions.mentions = 0.1;
  currentMax.mentions.timeStamp = Date.now();

  function Node(nodePoolId){
    this.age = 1e-6;
    this.ageMaxRatio = 1e-6;
    this.ageUpdated = Date.now();
    this.category = false;
    this.categoryAuto = false;
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
    this.isCategory = false;
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
  maxRateMentions.rateTimeStamp = Date.now();
  maxRateMentions.mentionsTimeStamp = Date.now();
  maxRateMentions.mentions = 2;
  maxRateMentions.ageMaxRatio = 1e-6;
  maxRateMentions.isTrendingTopic = true;
  maxRateMentions.mouseHoverFlag = false;
  maxRateMentions.x = 100;
  maxRateMentions.y = 100;

  console.warn("TREEPACK CONFIG\n" + jsonPrint(config));

  var testMode = false;
  var freezeFlag = false;

  var MAX_NODES_LIMIT = 100;

  var NEW_NODE_AGE_RATIO = 0.01;

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

  self.mouseMoving = function(isMoving) {
    if (isMoving && !mouseMovingFlag) {
      mouseMovingFlag = isMoving;
      updateNodeLabels();
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

  var defaultStrokeWidth = "1.5px";
  var topTermStrokeWidth = "4.0px";
  var newFlagStrokeWidth = "2.0px";

  var categoryMatchColor = palette.green;
  var categoryMatchStrokeWidth = "10.0px";
  var categoryMismatchStrokeWidth = "8.0px";
  var categoryAutoStrokeWidth = "4.0px";

  var divTooltip = d3.select("body").append("div")
    .attr("id", "divTooltip")
    .attr("class", "tooltip")
    .style("display", "none");

  // var topTermsDiv = d3.select("#topTermsDiv");

  // var topTermsCheckBox = topTermsDiv.append("input")
  //   .attr("id", "topTermsCheckBox")
  //   .attr("type", "checkbox")
  //   .style("pointer-events", "auto")
  //   .on("change", function topTermsCheckBoxFunc(){
  //     if (topTermsCheckBox.property("checked") === false) { 
  //       topTermsDiv.style("display", "none");
  //       topTermsDivVisible = false;
  //     }
  //     else { 
  //     }
  //   });

  // var mouseMoveTimeoutEventHandler = function(e) {

    // d3.selectAll("iframe").style("display", "none");

    // if (topTermsCheckBox.property("checked") === false) { 
    //   topTermsDiv.style("display", "none"); 
    //   topTermsDivVisible = false;
    // }
    // else { 
    // }
  // };


  // document.addEventListener("mouseMoveTimeoutEvent", mouseMoveTimeoutEventHandler);

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

  // var emojiLabelSizeScale = d3.scaleLinear()
  //   .domain([1, currentMax[metricMode][metricMode]])
  //   .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
  //   .clamp(true);

  var nodeLabelSizeScale = d3.scaleLinear()
    .domain([1, currentMax[metricMode][metricMode]])
    .range([fontSizeMin, fontSizeMax])
    .clamp(true);
    
  var topTermLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 1.0])
    .range([1.0, 2.0*minOpacity])
    .clamp(true);
    
  var nodeLabelOpacityScale = d3.scaleLinear()
    .domain([1e-6, 0.2, 1.0])
    .range([1.0, 0.5, 1.5*minOpacity])
    .clamp(true);
    
  var nodeLabelOpacityScaleTopTerm = d3.scaleLinear()
    .domain([1e-6, 0.2, 1.0])
    .range([1.0, 0.75, 2.0*minOpacity])
    .clamp(true);
    
  var adjustedAgeRateScale = d3.scaleLinear()
    .domain([1, maxNodesLimit])
    .range([1.0, 10.0]);

  // var fontTopTerm = config.defaultFontSizeTopTermRatio * topTermsDiv.height;

  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgTreemapLayoutArea = svgMain.append("svg:g")
    .attr("id", "svgTreemapLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgTopTermLayoutArea = svgMain.append("svg:g")
    .attr("id", "svgTopTermLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);


  var zoomFactor = DEFAULT_ZOOM_FACTOR;
  var panzoomElement = document.getElementById("svgTreemapLayoutArea");

  panzoom(
    panzoomElement, 
    {
      maxZoom: 2, 
      minZoom: 0.1,
      zoomSpeed: 0.02
    }
  )
  .zoomAbs(0.5*width, 0.5*height, zoomFactor);

  // panzoom(panzoomElement, { 
  //   zoomSpeed: 0.040,
  //   smoothScroll: true,
  //   autocenter: true
  // }).zoomAbs(
  //   0.5*width,
  //   0.5*height,
  //   zoomFactor
  // );

  // var svgTopTerms = topTermsDiv.append("svg:svg")
  //   .attr("id", "svgTopTerms")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("x", 1e-6)
  //   .attr("y", 1e-6);

  // var maxRateMentionsSvgGroup = svgTopTerms.append("svg:g")
  //   .attr("id", "maxRateMentionsSvgGroup")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .style("zIndex", 100)
  //   .style("opacity", 1.0);

  // var maxRateMentionsText = maxRateMentionsSvgGroup.append("svg:text")
  //   .attr("id", "maxRateMentionsText")
  //   .attr("x", maxRateMentionsLeftMargin + "%")
  //   .attr("y", maxRateMentionsTopMargin + "%")
  //   .text("MAX MENTIONS: 0")
  //   .style("font-family", "monospace")
  //   .style("font-size", fontTopTerm)
  //   .style("fill", palette.lightgray)
  //   // .style("stroke", palette.white)
  //   .style("opacity", 1.0)
  //   .style("text-anchor", "right")
  //   .style("alignment-baseline", "top");

  // var nodeTopTermLabelSvgGroup = svgTopTerms.append("svg:g")
  //   .attr("id", "nodeTopTermLabelSvgGroup")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("x", 1e-6)
  //   .attr("y", 1e-6);

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
  
  self.setEnableAgeNodes = function(enabled) {
    enableAgeNodes = enabled;
    config.enableAgeNodes = enabled;
  };

  this.deleteNode = function() { return null; };

  this.getTotalHashMap = function() { return totalHashmap; };
  
  this.getNodesLength = function() { return "NODES: " + nodeArray.length + " | POOL: " + nodePool.size(); };
  
  this.getMaxNodes = function() { return maxNodes; };
  
  this.getNodeAddQlength = function() { return nodeAddQ.length; };
  
  this.getMaxNodeAddQ = function() { return maxNodeAddQ; };
    
  this.getAgeRate = function() { return ageRate; };
  
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

  this.getMaxAgeRate = function() { return maxAgeRate; };
  
  this.setAntonym = function(flag) {
    antonymFlag = flag;
    console.debug("SET ANTONYM: " + antonymFlag);
  };

  this.setTwitterUser = function(user) {

    if (user.notFound !== undefined) { console.log("setTwitterUser | NOT FOUND: @"  + user.screenName); }
    else { console.log("setTwitterUser | "  + user.nodeId + " | @" + user.screenName); }

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

    // emojiLabelSizeScale = d3.scaleLinear()
    //   .domain([1, currentMax[metricMode][metricMode]])
    //   .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
    //   .clamp(true);

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

    // emojiLabelSizeScale = d3.scaleLinear()
    //   .domain([1, currentMax[metricMode][metricMode]])
    //   .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
    //   .clamp(true);

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

    // emojiLabelSizeScale = d3.scaleLinear()
    //   .domain([1, currentMax[metricMode][metricMode]])
    //   .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
    //   .clamp(true);

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

  var tempNodeCirle;
  var tempNodeLabel;
  // var tempNodeTopTermLabel;


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
    n.x = 1e-6;
    n.y = 1e-6;

    tempNodeCirle = document.getElementById(n.nodePoolId);
    tempNodeCirle.setAttribute("display", "none");

    tempNodeLabel = document.getElementById(n.nodePoolId + "_label");
    tempNodeLabel.setAttribute("display", "none");

    // tempNodeTopTermLabel = document.getElementById(n.nodePoolId + "_labelTopTerm");
    // if (tempNodeTopTermLabel) {
    //   tempNodeTopTermLabel.setAttribute("display", "none");
    // }
    callback(n);
  }

  var tempTotalHashmap = {};

  function ageNodes(callback) {

    tempTotalHashmap.total = 0;
    tempTotalHashmap.left = 0;
    tempTotalHashmap.right = 0;
    tempTotalHashmap.neutral = 0;
    tempTotalHashmap.positive = 0;
    tempTotalHashmap.negative = 0;
    tempTotalHashmap.none = 0;

    var tempNodeArray = [];

    var nodeIdArray = nodeIdHashMap.keys();
    var age = 1e-6;
    var ageMaxRatio = 1e-6;
    var ageNodesLength = nodeIdArray.length;
    var ageRate = DEFAULT_AGE_RATE;

    if (ageNodesLength === 0) { ageRate = DEFAULT_AGE_RATE; } 
    else if ((ageNodesLength > maxNodesLimit) && (nodeAddQ.length <= MAX_RX_QUEUE)) {
      ageRate = adjustedAgeRateScale(ageNodesLength - maxNodesLimit);
    } 
    else if (nodeAddQ.length > MAX_RX_QUEUE) { ageRate = adjustedAgeRateScale(nodeAddQ.length - MAX_RX_QUEUE); } 
    else { ageRate = DEFAULT_AGE_RATE; }

    var maxAgeRate = Math.max(ageRate, maxAgeRate);

    async.each(nodeIdArray, function(nodeId, cb){

      var nPoolId = nodeIdHashMap.get(nodeId);
      var node = localNodeHashMap.get(nPoolId);

      if (!node.isValid || node.isDead) {
        return cb();
      }

      if (!enableAgeNodes || (resumeTimeStamp > 0)) {
        ageRate = 1e-6;
      }

      if ((node.nodeType === "user") && node.followersCount && (node.followersCount > minFollowers)){
        age = node.age + (ageRate * DEFAULT_MIN_FOLLOWERS_AGE_RATE_RATIO * (Date.now() - node.ageUpdated));
      }
      else {
        age = node.age + (ageRate * (Date.now() - node.ageUpdated));
      }

      ageMaxRatio = age/nodeMaxAge ;

      if (removeDeadNodesFlag && (node.isDead || (age >= nodeMaxAge))) {

        node.isDead = true;
        node.ageUpdated = Date.now();
        node.age = 1e-6;
        node.ageMaxRatio = 1e-6;

        nodeIdHashMap.remove(node.nodeId);
        localNodeHashMap.set(nPoolId, node);

        if (node.isValid) {
          node.isValid = false;
          resetNode(node, function(n){
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
        node.isValid = true;
        node.isDead = false;
        node.ageUpdated = Date.now();
        node.age = Math.max(age, 1e-6);
        node.ageMaxRatio = Math.max(ageMaxRatio, 1e-6);

        localNodeHashMap.set(nPoolId, node);
        nodeIdHashMap.set(node.nodeId, nPoolId);

        tempNodeArray.push(node);

        if (node.category) {
          if (metricMode === "rate") { 
            tempTotalHashmap[node.category] += node.rate; 
            tempTotalHashmap.total += node.rate; 
          }
          if (metricMode === "mentions") { 
            tempTotalHashmap[node.category] += node.mentions; 
            tempTotalHashmap.total += node.mentions; 
          }
        }
        else {
          if (metricMode === "rate") { 
            tempTotalHashmap.none += node.rate; 
            tempTotalHashmap.total += node.rate; 
          }
          if (metricMode === "mentions") { 
            tempTotalHashmap.none += node.mentions; 
            tempTotalHashmap.total += node.mentions; 
          }
        }

        cb();
      }
    }, function(err){
      resumeTimeStamp = 0;
      totalHashmap = tempTotalHashmap;
      callback(null, tempNodeArray);
    });


    // maxRateMentionsText.text(createDisplayText(currentMax[metricMode]));

    // nodeArray = tempNodeArray;

    // rankArrayByValue(tempNodesTopTerm, metricMode, function rankArrayByValueFunc(){
    //   nodeArray = tempNodeArray;
    //   callback(null);
    // });
  };

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

      // case "emoji":

      //   currentTwitterEmoji = d;

      //   if (mouseMovingFlag 
      //     && controlPanelReadyFlag 
      //     && (!previousTwitterEmoji || (previousTwitterEmoji !== d.nodeId))){
      //     previousTwitterEmoji = currentTwitterEmoji.nodeId;
      //   }

      //   tooltipString = d.nodeId
      //     + "<br>Ms: " + d.mentions
      //     + "<br>" + d.rate.toFixed(2) + " MPM";
      // break;

      case "user":

        currentTwitterUser = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterUserId || (previousTwitterUserId !== d.nodeId))){
          previousTwitterUserId = currentTwitterUser.nodeId;
        }

        tooltipString = "@" + d.screenName
          + "<br>" + d.name 
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

        currentTwitterHashtag = d;

        if (mouseMovingFlag 
          && controlPanelReadyFlag 
          && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        tooltipString = "#" + d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(3) + " MPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
      break;

      // case "media":
      //   tooltipString = "ID: " + d.nodeId
      //     + "<br>Ms: " + d.mentions
      //     + "<br>" + d.rate.toFixed(2) + " WPM"
      //     + "<br>URL: " + d.url
      //     + "<br>MEDIA URL: " + d.mediaUrl;
      // break;

      // case "word":
      //   tooltipString = d.nodeId
      //     + "<br>Ms: " + d.mentions
      //     + "<br>" + d.rate.toFixed(2) + " WPM"
      //     + "<br>C: " + d.category
      //     + "<br>CA: " + d.categoryAuto;
      // break;

      // case "place":
      //   tooltipString = d.fullName
      //     + "<br>Ms: " + d.mentions
      //     + "<br>" + d.rate.toFixed(2) + " WPM"
      //     + "<br>C: " + d.category
      //     + "<br>CA: " + d.categoryAuto;
      // break;
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
      if (d.category || d.categoryAuto) { return "#" + d.nodeId.toUpperCase(); }
      if (d.mentions >= minMentionsHashtags) { return "#" + d.nodeId.toUpperCase(); }
      return "#" + d.nodeId.toLowerCase(); 
    }
    if (d.nodeType === "user") { 
      if (d.screenName) { 
        if (d.category || d.categoryAuto) { return "@" + d.screenName.toUpperCase(); }
        if (d.followersCount >= minFollowers) { return "@" + d.screenName.toUpperCase(); }
        if (d.mentions >= minMentionsUsers) { return "@" + d.screenName.toUpperCase(); }
        return "@" + d.screenName.toLowerCase(); 
      }
      else if (d.name){ 
        if (d.category || d.categoryAuto) { return "@" + d.name.toUpperCase(); }
        if (d.followersCount >= minFollowers) { return "@" + d.name.toUpperCase(); }
        if (d.mentions >= minMentionsUsers) { return "@" + d.name.toUpperCase(); }
        return "@" + d.name.toLowerCase(); 
      }
      else { return "@UNKNOWN?"; }
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
          && (!previousTwitterUserId || (previousTwitterUserId !== d.nodeId))){
          previousTwitterUserId = currentTwitterUser.nodeId;
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

      // case "media" :
      //   console.debug("LOADING MEDIA: " + d.url);
      //   window.open(d.url, "_blank");
      // break;

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

        window.open("https://twitter.com/search?f=tweets&q=%23"+d.nodeId, "_blank");
      break;

      // case "place" :
      //   window.open("http://twitter.com/search?q=place%3A" + d.placeId, "_blank");
      // break;
    }
  }

  // var nodeTopTermLabels;

  // var updateTopTerm = function(callback) {

  //   nodeTopTermLabels = nodeTopTermLabelSvgGroup.selectAll("text")
  //     .data(nodesTopTerm, function updateTopTermData(d) { return d.nodeId; });

  //   nodeTopTermLabels
  //     .exit()
  //     .style("display", "none")
  //     .style("fill-opacity", 1e-6);

  //   nodeTopTermLabels
  //     .attr("x", xposition)
  //     .text(function updateTopTermText(d) {
  //       return d.displaytext;
  //     })
  //     .style("fill", function updateTopTermFill(d) { 
  //       if (d.mouseHoverFlag) { return palette.blue; }
  //       if (d.category || d.categoryAuto) { return d.categoryColor; }
  //       if (d.isTrendingTopic || d.isNumber || d.isCurrency) { return palette.white; }
  //       if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
  //       return palette.darkgray; 
  //     })
  //     .style("fill-opacity", function updateTopTermOpacity(d) { 
  //       if (d.mouseHoverFlag) { return 1.0; }
  //       return topTermLabelOpacityScale(d.ageMaxRatio); 
  //     })
  //     .style("display", "unset")
  //     .transition()
  //       .duration(transitionDuration)
  //       .attr("y", yposition);

  //   nodeTopTermLabels
  //     .enter().append("text")
  //     .attr("id", function (d) { return d.nodePoolId + "_labelTopTerm"; })
  //     .attr("nodeId", function (d) { return d.nodeId; })
  //     .style("text-anchor", "right")
  //     .style("alignment-baseline", "bottom")
  //     .on("mouseover", nodeMouseOver)
  //     .on("mouseout", nodeMouseOut)
  //     .on("click", nodeClick)
  //     .style("pointer-events", "auto")
  //     .attr("x", xposition)
  //     .text(function updateTopTermText(d) {
  //       return d.displaytext;
  //     })
  //     .style("font-family", "monospace")
  //     .style("display", "unset")
  //     .style("fill-opacity", function updateTopTermOpacity(d) { 
  //       if (d.mouseHoverFlag) { return 1.0; }
  //       return topTermLabelOpacityScale(d.ageMaxRatio); 
  //     })
  //     .style("fill", function updateTopTermFill(d) { 
  //       if (d.mouseHoverFlag) { return palette.blue; }
  //       if (d.category || d.categoryAuto) { return d.categoryColor; }
  //       if (d.isTrendingTopic || d.isNumber || d.isCurrency) { return palette.white; }
  //       if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
  //       return palette.darkgray; 
  //     })
  //     .style("font-size", fontTopTerm)
  //     .transition()
  //       .duration(2*transitionDuration)
  //       .attr("y", yposition);


  //   callback(null, null);
  // };

  // var nodeMedia;
  // var updateNodeMedia = function(callback) {

  //   nodeMedia = nodeSvgGroup.selectAll("image")
  //     .data(nodeArray.filter(function(d){ return d.nodeType === "media"; }), function (d){ return d.nodeId; });

  //   nodeMedia
  //     .enter().append("svg:image")
  //     .attr("id", function (d) { return d.nodePoolId; })
  //     .attr("nodeId", function (d) { return d.nodeId; })
  //     .attr("xlink:href", function (d) { return d.mediaUrl; })
  //     .attr("class", "nodeImage")
  //     .attr("r", 1e-6) 
  //     .attr("x", function(d) {
  //       if (metricMode === "rate") { return d.x - 0.5*(imageSizeScale(parseInt(d.rate) + 1.0)); }
  //       if (metricMode === "mentions") { return d.x - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0)); }
  //     })
  //     .attr("y", function(d) { 
  //       if (metricMode === "rate") { return d.y - 0.5*(imageSizeScale(parseInt(d.rate) + 1.0)); }
  //       if (metricMode === "mentions") { return d.y - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0)); }
  //     })
  //     .style("display", function (d) { 
  //       if (!d.isValid) { return "none"; }
  //       return "unset"; 
  //     })
  //     .attr("width", function(d){ 
  //       if (metricMode === "rate") {return imageSizeScale(parseInt(d.rate + 1.0));}
  //       if (metricMode === "mentions") {return imageSizeScale(parseInt(d.mentions + 1.0));}
  //     })
  //     .attr("height", function(d){ 
  //       if (metricMode === "rate") {return imageSizeScale(parseInt(d.rate + 1.0));}
  //       if (metricMode === "mentions") {return imageSizeScale(parseInt(d.mentions + 1.0));}
  //     })
  //     .style("opacity", function (d) { return nodeLabelOpacityScale(d.ageMaxRatio); })
  //     .on("mouseover", nodeMouseOver)
  //     .on("mouseout", nodeMouseOut)
  //     .on("click", nodeClick);

  //   nodeMedia
  //     .attr("r", function(d) {
  //       if (metricMode === "rate") { return imageSizeScale(Math.sqrt(d.rate));}
  //       if (metricMode === "mentions") {return imageSizeScale(Math.sqrt(d.mentions));}
  //     })
  //     .attr("x", function(d) {
  //       if (metricMode === "rate") {return d.x - 0.5*(imageSizeScale(parseInt(d.rate) + 1.0));}
  //       if (metricMode === "mentions") {return d.x - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0));}
  //     })
  //     .attr("y", function(d) { 
  //       if (metricMode === "rate") {return d.y - 0.5*(imageSizeScale(parseInt(d.rate) + 1.0));}
  //       if (metricMode === "mentions") {return d.y - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0));}
  //     })
  //     .attr("width", function(d){ 
  //       if (metricMode === "rate") {return imageSizeScale(parseInt(d.rate + 1.0));}
  //       if (metricMode === "mentions") {return imageSizeScale(parseInt(d.mentions + 1.0));}
  //     })
  //     .attr("height", function(d){ 
  //       if (metricMode === "rate") {return imageSizeScale(parseInt(d.rate + 1.0));}
  //       if (metricMode === "mentions") {return imageSizeScale(parseInt(d.mentions + 1.0));}
  //     })
  //     .style("display", function (d) { 
  //       if (!d.isValid) { return "none"; }
  //       return "unset"; 
  //     })
  //     .style("opacity", function(d) { return nodeLabelOpacityScale(d.ageMaxRatio); });

  //   nodeMedia
  //     .exit()
  //     .style("display", "none");

  //   callback();
  // };

  var updateChangedCircleNodes = function(d){

    if (d.newFlag && d.isValid) {

      d.newFlag = false;

      d3.select(this)
        .style("display", "unset")
        .style("fill", function (d) { 
          if (!d.category && !d.categoryAuto) { return palette.black; }
          return d.categoryColor; 
        })
        .style("stroke", function (d) {
          if (d.categoryMismatch) { return palette.red; }
          if (d.categoryMatch) { return categoryMatchColor; }
          if (d.categoryAuto === "right") { return palette.yellow; }
          if (d.categoryAuto === "left") { return palette.blue; }
          if (d.categoryAuto === "positive") { return palette.green; }
          if (d.categoryAuto ==="negative") { return palette.red; }
          return palette.white; 
        })
        .style("stroke-width", function (d) { 
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
        });
    }
  };

  var nodeCircles;
  var updateNodeCircles = function(callback) {

    nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(nodeArray.filter(
        function(d){ 
          return d.isValid && (d.nodeType !== "media");
        }), 
        function (d){ 
          return d.nodeId;
        });

    // ENTER
    nodeCircles
      .enter().append("circle")
      .attr("id", function (d) { return d.nodePoolId; })
      .attr("nodeId", function (d) { return d.nodeId; })
      .style("display", function (d) { 
        if (!d.isValid) { return "none"; }
        return "unset"; 
      })
      .attr("r", 1e-6) 
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .style("fill", function (d) { 
        if (d.isTopTerm && !d.category && !d.categoryAuto) { return palette.white; }
        if (!d.category && !d.categoryAuto) { return palette.black; }
        if (d.category) { return d.categoryColor; }
        if (d.categoryAuto === "right") { return palette.yellow; }
        if (d.categoryAuto === "left") { return palette.blue; }
        if (d.categoryAuto === "positive") { return palette.green; }
        if (d.categoryAuto ==="negative") { return palette.red; }
        return d.categoryColor; 
      })
      .style("stroke", function (d) {
        if (d.categoryMismatch) { return palette.red; }
        if (d.categoryMatch) { return categoryMatchColor; }
        if (d.categoryAuto === "right") { return palette.yellow; }
        if (d.categoryAuto === "left") { return palette.blue; }
        if (d.categoryAuto === "positive") { return palette.green; }
        if (d.categoryAuto ==="negative") { return palette.black; }
        return palette.white; 
      })
      .style("stroke-width", function (d) { 
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
      })
      .style("fill-opacity", function(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("stroke-opacity", function(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick);

    // UPDATE
    nodeCircles
      .style("display", function (d) { 
        if (!d.isValid) { return "none"; }
        return "unset"; 
      })
      .attr("r", function(d) {
        if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
        if (metricMode === "mentions") {return defaultRadiusScale(Math.sqrt(d.mentions));}
      })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      // .style("fill", function (d) { 
      //   if (d.isTopTerm && !d.category && !d.categoryAuto) { return palette.white; }
      //   if (!d.category && !d.categoryAuto) { return palette.black; }
      //   if (d.category) { return d.categoryColor; }
      //   if (d.categoryAuto === "right") { return palette.yellow; }
      //   if (d.categoryAuto === "left") { return palette.blue; }
      //   if (d.categoryAuto === "positive") { return palette.green; }
      //   if (d.categoryAuto ==="negative") { return palette.red; }
      //   return d.categoryColor; 
      // })
      // .style("stroke", function (d) {
      //   if (d.categoryMismatch) { return palette.red; }
      //   if (d.categoryMatch) { return categoryMatchColor; }
      //   if (d.categoryAuto === "right") { return palette.yellow; }
      //   if (d.categoryAuto === "left") { return palette.blue; }
      //   if (d.categoryAuto === "positive") { return palette.green; }
      //   if (d.categoryAuto ==="negative") { return palette.black; }
      //   return palette.white; 
      // })
      // .style("stroke-width", function (d) { 
      //   if (d.categoryMismatch && d.following) { return categoryMismatchStrokeWidth; }
      //   if (d.categoryMismatch && !d.following) { return 0.5*categoryMismatchStrokeWidth; }
      //   if (d.categoryMatch && d.following) { return categoryMatchStrokeWidth; }
      //   if (d.categoryMatch && !d.following) { return 0.5*categoryMatchStrokeWidth; }
      //   if (d.isTopTerm && d.following) { return topTermStrokeWidth; }
      //   if (d.isTopTerm && !d.following) { return 0.5*topTermStrokeWidth; }
      //   if (d.categoryAuto && d.following) { return categoryAutoStrokeWidth; }
      //   if (d.categoryAuto && !d.following) { return 0.5*categoryAutoStrokeWidth; }
      //   if (d.following) { return defaultStrokeWidth; }
      //   return 0.5*defaultStrokeWidth; 
      // })
      .style("fill-opacity", function(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("stroke-opacity", function(d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .each(updateChangedCircleNodes);

    // EXIT
    nodeCircles
      .exit()
      .style("display", "none");

    callback();
  };

  var nodeLabels;
  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text")
      .data(nodeArray, function (d) { return d.nodeId; });

    // UPDATE
    nodeLabels
      .text(labelText)
      .style("display", function (d) {
        if (!d.isValid) { return "none"; }
        if (d.mouseHoverFlag) { return "unset"; }
        if (d.category) { return "unset"; }
        if (d.categoryAuto) { return "unset"; }
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
      })
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y; })
      .style("fill-opacity", function updateNodeLabelOpacity(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("font-size", function (d) {
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
    nodeLabels 
      .enter().append("text")
      .attr("id", function (d) { return d.nodePoolId + "_label"; })
      .attr("nodeId", function (d) { return d.nodeId; })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y; })
      .text(labelText)
      .style("font-weight", function (d) {
        if (d.followersCount > minFollowers) { return "bold"; }
        return "normal";
      })
      .style("display", function (d) {
        if (!d.isValid) { return "none"; }
        if (d.category) { return "unset"; }
        if (d.categoryAuto) { return "unset"; }
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
      })
      .style("text-decoration", function (d) { 
        if (d.isTopTerm && (d.followersCount > minFollowers)) { return "overline underline"; }
        if (!d.isTopTerm && (d.followersCount > minFollowers)) { return "underline"; }
        if (d.isTopTerm) { return "overline"; }
        return "none"; 
      })
      .style("fill-opacity", function (d) { 
        if (d.isTopTerm) { return nodeLabelOpacityScaleTopTerm(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio);
      })
      .style("fill", function (d) { 
        if (d.isTopTerm && (d.nodeType === "hashtag")) { return palette.white; }
        if (d.isTopTerm && (d.followersCount > minFollowers)) { return palette.white; }
        if (!d.isTopTerm && (d.followersCount > minFollowers)) { return palette.lightgray; }
        if (d.isTopTerm) { return palette.lightgray; }
        return palette.gray; 
      })
      .style("font-size", function (d) {
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
    nodeLabels
      .exit()
      .style("display", "none");

    if (callback !== undefined) { callback(); }
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
          x: randomIntFromInterval(xMinRatioDefault*width, xMaxRatioDefault*width), 
          y: randomIntFromInterval(yMinRatioDefault*height, yMaxRatioDefault*height)
        });
    }
  };

  var mentionsInt = 0;
  var rateString = "";
  var mentionPadSpaces = 0;
  var ratePadSpaces = 0;
  var nodeIdString = "";

  var createDisplayText = function(node) {

    let displaytext = "";

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

        currentNode.rank = newNode.rank;
        currentNode.rate = newNode.rate;
        currentNode.mentions = newNode.mentions;
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
        currentNode.vx = 1e-6;
        currentNode.vy = 1e-6;
        currentNode.x = initialXposition*width;
        currentNode.y = initialYposition*height;

        if (newNode.nodeType === "user"){
          currentNode.following = newNode.following;
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

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
          currentNode.x = focus("default").x; 
          currentNode.y = focus("default").y;
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
  };

  function ticked() {
    drawSimulation(function drawSimulationCallback() { updateSimulation(); });
  }

  var previousMaxRateMetric = 0;
  var previousMaxMentionsMetric = 0;

  function drawSimulation(callback){

    // async.series([
    //   function updateNodeCirclesSeries (cb){ updateNodeCircles(cb); },
    //   function updateNodeLabelsSeries (cb){ updateNodeLabels(cb); }
    // ], function drawSimulationCallback (err, results) {

    async.parallel({
      updateNodeCirclesSeries: function(cb){ updateNodeCircles(cb); },
      updateNodeLabelsSeries: function(cb){ updateNodeLabels(cb); }
    }, function drawSimulationCallback (err, results) {

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

        // emojiLabelSizeScale = d3.scaleLinear()
        //   .domain([1, currentMax[metricMode][metricMode]])
        //   .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
        //   .clamp(true);

        defaultRadiusScale = d3.scaleLinear()
          .domain([0, Math.sqrt(currentMax[metricMode][metricMode])])
          .range([nodeRadiusMin, nodeRadiusMax])
          .clamp(true);

      }

      callback();
    });
  }

  function updateSimulation() {

    processNodeAddQ(function(){
      ageNodes(function(err, tempNodeArray){
        nodeArray = tempNodeArray;
        simulation.nodes(nodeArray);
      });
    });

    // async.series(
    //   {
    //     addNode: processNodeAddQ,
    //     ageNode: ageNodes
    //   },
    //   function updateSimulationCallback() {
    //   }
    // );
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

    // self.setEnableAgeNodes(true);

    newNode.age = 1e-6;
    newNode.ageUpdated = Date.now();
    newNode.ageMaxRatio = 1e-6;
    newNode.rank = -1;
    newNode.newFlag = true;
    newNode.following = (newNode.following !== undefined) ? newNode.following : false;
    newNode.followersCount = (newNode.followersCount) ? parseInt(newNode.followersCount) : 0;
    newNode.mentions = (newNode.mentions) ? parseInt(newNode.mentions) : 0;

    if (newNode.nodeType === "user") {
      newNode.followersMentions = newNode.mentions + newNode.followersCount;
      // newNode.nodeId = newNode.userId;
    }

    if (newNode.mentions > currentMax.mentions.mentions) { 

      newCurrentMaxMentionsMetricFlag = true;

      currentMax.mentions.nodeType = newNode.nodeType;
      currentMax.mentions.nodeId = newNode.nodeId; 
      currentMax.mentions.screenName = newNode.screenName; 
      currentMax.mentions.mentions = newNode.mentions; 
      currentMax.mentions.rate = newNode.rate;
      currentMax.mentions.timeStamp = Date.now(); 

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
      currentMax.rate.timeStamp = Date.now(); 

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

    // emojiLabelSizeScale = d3.scaleLinear()
    //   .domain([1, currentMax[metricMode][metricMode]])
    //   .range([emojiFontMulipier*fontSizeMin, emojiFontMulipier*fontSizeMax])
    //   .clamp(true);

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMax[metricMode][metricMode]])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    svgMain
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    svgTreemapLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

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
    // rowSpacing = fontSizeTopTermRatio*110; // %

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
    mouseHoverFlag = false;
    localNodeHashMap.clear();
    nodeIdHashMap.clear();
    nodeArray = [];
    // nodesTopTermHashMap.clear();
    self.toolTipVisibility(false);
    self.resize();
    self.resetDefaultForce();
  };

}