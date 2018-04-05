/*jslint node: false */

function ViewTreepack() {

  "use strict";

  console.log("@@@@@@@ CLIENT @@@@@@@@");

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
    "lightgray": "#819090",
    "gray": "#708284",
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

  var MIN_RATE = 2.5;
  var MIN_FOLLOWERS = 50000;
  var MIN_MENTIONS = 10000;
  var MIN_FOLLOWERS_AGE_RATE_RATIO = 0.9;  // age users with many followers at a slower rate

  var mouseMovingFlag = false;

  var currentTwitterUser = twitterUserThreecee;
  var currentTwitterHashtag = "resist";

  var defaultProfileImageUrl = "favicon.png";

  var self = this;
  var simulation;

  var enableAgeNodes = true;
  var newCurrentMaxMetricFlag = true;

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

  var currentMaxMetric = 2;

  var currentMax = {};

  currentMax.rate = {};
  currentMax.rate.nodeId = "what";
  currentMax.rate.nodeType = "hashtag";
  currentMax.rate.value = 0.1;
  currentMax.rate.timeStamp = moment().valueOf();

  currentMax.mentions = {};
  currentMax.mentions.nodeId = "what";
  currentMax.mentions.nodeType = "hashtag";
  currentMax.mentions.value = 0.1;
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
    this.categoryColor = palette.white;
    this.isMaxNode = false;
  } 

  var nodePoolIndex = 0;

  var nodePool = deePool.create(function makeNode(){

    // var nodePoolId = "nodePoolId_" + nodePoolIndex;

    nodePoolIndex += 1;

    // var n = new Node(nodePoolId);

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

  var nodesTopTermHashMap = new HashMap();
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
      updateNodeLabels();
    }
    else { mouseMovingFlag = isMoving; }
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

  var categoryMatchColor = palette.green;
  var categoryMatchStrokeWidth = "4.0";
  var categoryMismatchStrokeWidth = "4.0";
  var categoryAutoStrokeWidth = "3.0";

  var divTooltip = d3.select("body").append("div")
    .attr("id", "divTooltip")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

  var topTermsDiv = d3.select("#topTermsDiv");

  var topTermsCheckBox = topTermsDiv.append("input")
    .attr("id", "topTermsCheckBox")
    .attr("type", "checkbox")
    .style("pointer-events", "auto")
    .on("change", function topTermsCheckBoxFunc(){
      if (topTermsCheckBox.property("checked") === false) { topTermsDiv.style("visibility", "hidden"); }
      else { topTermsDiv.style("visibility", "visible"); }
    });

  var mouseMoveTimeoutEventHandler = function(e) {

    d3.selectAll("iframe").style("visibility", "hidden");

    if (topTermsCheckBox.property("checked") === false) { topTermsDiv.style("visibility", "hidden"); }
    else { topTermsDiv.style("visibility", "visible"); }
  };


  document.addEventListener("mouseMoveTimeoutEvent", mouseMoveTimeoutEventHandler);

  document.addEventListener("mousemove", function mousemoveFunc() {

    topTermsDiv.style("visibility", "visible");

    if (mouseHoverFlag) { d3.select("body").style("cursor", "pointer"); } 
    else { d3.select("body").style("cursor", "default"); }

  }, true);

  var defaultRadiusScale = d3.scaleLinear()
    .domain([0, Math.sqrt(currentMaxMetric)])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

  var nodeLabelSizeScale = d3.scaleLinear()
    .domain([1, currentMaxMetric])
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

  var fontTopTerm = config.defaultFontSizeTopTermRatio * topTermsDiv.height;

  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgTreemapLayoutArea = svgMain.append("g")
    .attr("id", "svgTreemapLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgTopTermLayoutArea = svgMain.append("g")
    .attr("id", "svgTopTermLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var panzoomElement = document.getElementById("svgTreemapLayoutArea");
  panzoom(panzoomElement, { 
    // onTouch: function(e) {
    //   // `e` - is current touch event.
    //   return true; // tells the library to not preventDefault.
    // },
    zoomSpeed: 0.030 
  });

  var svgTopTerms = topTermsDiv.append("svg:svg")
    .attr("id", "svgTopTerms")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var maxRateMentionsSvgGroup = svgTopTerms.append("svg:g")
    .attr("id", "maxRateMentionsSvgGroup")
    .attr("width", width)
    .attr("height", height)
    .style("zIndex", 100)
    .style("opacity", 1.0);

  var maxRateMentionsText = maxRateMentionsSvgGroup.append("text")
    .attr("id", "maxRateMentionsText")
    .attr("x", maxRateMentionsLeftMargin + "%")
    .attr("y", maxRateMentionsTopMargin + "%")
    .text("MAX MENTIONS: 0")
    .style("font-family", "monospace")
    .style("font-size", fontTopTerm)
    .style("fill", palette.white)
    // .style("stroke", palette.white)
    .style("opacity", 1.0)
    .style("text-anchor", "right")
    .style("alignment-baseline", "top");

  var nodeTopTermLabelSvgGroup = svgTopTerms.append("svg:g")
    .attr("id", "nodeTopTermLabelSvgGroup")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

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

    if (controlPanelReadyFlag){ controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: user}, DEFAULT_SOURCE); }
  };

  this.setTwitterHashtag = function(hashtag) {
    console.log("setTwitterHashtag | HTID: "  + hashtag.hashtagId + " | #" + hashtag.text);
    
    if (controlPanelReadyFlag){
      controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: hashtag}, DEFAULT_SOURCE);
    }
  };

  this.setMetricMode = function(mode) {

    config.defaultMetricMode = mode;
    metricMode = mode;

    if (mode === "rate") { currentMaxMetric = currentMax.rate.value;  }
    else if (mode === "mentions") { currentMaxMetric = currentMax.mentions.value;  }

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);

    defaultRadiusScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMaxMetric)])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);

    console.debug("SET METRIC MODE: " + metricMode);
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
    if (isVisible) { divTooltip.style("visibility", "visible"); }
    else { divTooltip.style("visibility", "hidden"); }
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
      .domain([0, Math.sqrt(currentMaxMetric)])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.updateNodeRadiusMaxRatio = function(value) {
    console.debug("UPDATE NODE RADIUS MAX RATIO: " + value);
    config.defaultNodeRadiusMaxRatio = value;
    nodeRadiusMaxRatio = value;
    nodeRadiusMax = value * width;
    defaultRadiusScale = d3.scaleLinear()
      .domain([0, Math.sqrt(currentMaxMetric)])
      .range([nodeRadiusMin, nodeRadiusMax])
      .clamp(true);
  };

  self.updateFontSizeMinRatio = function(value) {
    console.debug("UPDATE FONT MIN SIZE: " + value);
    config.defaultFontSizeMinRatio = value;
    fontSizeMinRatio = value;
    fontSizeMin = value * height;
    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
      .range([fontSizeMin, fontSizeMax])
      .clamp(true);
  };

  self.updateFontSizeMaxRatio = function(value) {
    console.debug("UPDATE FONT MAX SIZE: " + value);
    config.defaultFontSizeMaxRatio = value;
    fontSizeMaxRatio = value;
    fontSizeMax = value * height;
    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
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

  function resetNode(n){
    n.isDead = true;
    n.isValid = false;
    n.age = 1e-6;
    n.ageMaxRatio = 1e-6;
    n.isTopTerm = false;
    n.newFlag = false;

    tempNodeCirle = document.getElementById(n.nodePoolId);
    tempNodeCirle.setAttribute("r", 1e-6);
    tempNodeCirle.setAttribute("visibility", "hidden");
    tempNodeCirle.setAttribute("opacity", 1e-6);
  }

  var age;
  var ageMaxRatio = 1e-6;
  var ageNodesLength = 0;
  var node;
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

      var nodePoolId = nodeIdHashMap.get(nodeId);
      node = localNodeHashMap.get(nodePoolId);

      if (!node.isValid || node.isDead) {
        return;
      }

      if (!enableAgeNodes || (resumeTimeStamp > 0)) {
        ageRate = 1e-6;
      }

      if ((node.nodeType === "user") && (node.followersCount > MIN_FOLLOWERS)){
        age = node.age + (ageRate * MIN_FOLLOWERS_AGE_RATE_RATIO * (currentTime - node.ageUpdated));
      }
      else {
        age = node.age + (ageRate * (currentTime - node.ageUpdated));
      }

      ageMaxRatio = age/nodeMaxAge ;

      if ((!node.isDead && node.isValid) && (removeDeadNodesFlag && (age >= nodeMaxAge))) {

        node.isValid = false;
        node.isDead = true;
        node.ageUpdated = currentTime;
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;

        nodeIdHashMap.remove(node.nodeId);
        localNodeHashMap.set(nodePoolId, node);

        nodePool.recycle(node);

      } 
      else {
        node.isValid = true;
        node.isDead = false;
        node.ageUpdated = currentTime;
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;

        if (ageMaxRatio < NEW_NODE_AGE_RATIO) { node.newFlag = true; }
        else { node.newFlag = false;   }

        localNodeHashMap.set(nodePoolId, node);
        nodeIdHashMap.set(node.nodeId, nodePoolId);

        tempNodeArray.push(node);

        if (node.isTopTerm){ 
          tempNodesTopTerm.push(node);
        }
      }
    });

    resumeTimeStamp = 0;

    maxRateMentions.metricMode = metricMode;
    
    maxRateMentions.rateNodeType = currentMax.rate.nodeType;
    maxRateMentions.rate = currentMax.rate.value;
    maxRateMentions.rateNodeId = currentMax.rate.nodeId;
    maxRateMentions.rateTimeStamp = currentMax.rate.timeStamp;

    maxRateMentions.mentionsNodeType = currentMax.mentions.nodeType;
    maxRateMentions.mentions = currentMax.mentions.value;
    maxRateMentions.mentionsNodeId = currentMax.mentions.nodeId;
    maxRateMentions.mentionsTimeStamp = currentMax.mentions.timeStamp;

    maxRateMentions.isTrendingTopic = true;
    maxRateMentions.displaytext = createDisplayText(maxRateMentions);

    if (metricMode === "rate") { maxRateMentions.nodeId = "RATE | MAX" ; }
    if (metricMode === "mentions") { maxRateMentions.nodeId = "MNTN | MAX" ;  }

    maxRateMentionsText.text(maxRateMentions.displaytext);

    rankArrayByValue(nodesTopTerm, metricMode, function rankArrayByValueFunc(){
      nodeArray = tempNodeArray;
      nodesTopTerm = tempNodesTopTerm;
      callback(null);
    });
  };

  var previousTwitterUserId;
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

    d3.select(this).style("opacity", 1);


    switch (d.nodeType) {

      case "user":

        currentTwitterUser = d;

        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterUserId || (previousTwitterUserId !== d.userId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: currentTwitterUser}, DEFAULT_SOURCE);
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

        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: currentTwitterHashtag}, DEFAULT_SOURCE);
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        tooltipString = "#" + d.nodeId
          + "<br>Ms: " + d.mentions
          + "<br>" + d.rate.toFixed(2) + " WPM"
          + "<br>C: " + d.category
          + "<br>CA: " + d.categoryAuto;
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
    d3.select(this).style("opacity", function(){
        if (d.isTopTerm) { return topTermLabelOpacityScale(d.ageMaxRatio); }
        return nodeLabelOpacityScale(d.ageMaxRatio);
      });
  }

  function labelText(d) {
    if (d.nodeType === "hashtag") { return "#" + d.text.toUpperCase(); }
    if (d.nodeType === "user") { 
      if (d.screenName) { return "@" + d.screenName.toUpperCase(); }
      else if (d.name){ return "@" + d.name.toUpperCase(); }
      else { return "@UNKNOWN?"; }
    }
    if (d.nodeType === "place") {  return d.fullName.toUpperCase(); }
    return d.nodeId; 
  }

  var nodeUrl = "";
  function nodeClick(d) {

    switch (d.nodeType) {

      case "user" :

        currentTwitterUser = d;
        
        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterUserId || (previousTwitterUserId !== d.userId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_USER", user: currentTwitterUser}, DEFAULT_SOURCE);
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

        // console.debug("LOADING TWITTER USER: " + nodeUrl);
        // window.open(nodeUrl, "_blank");
      break;

      case "hashtag" :

        currentTwitterHashtag = d;

        if (mouseMovingFlag && controlPanelReadyFlag && (!previousTwitterHashtag || (previousTwitterHashtag !== d.nodeId))){
          controlPanelWindow.postMessage({op: "SET_TWITTER_HASHTAG", hashtag: currentTwitterHashtag}, DEFAULT_SOURCE);
          previousTwitterHashtag = currentTwitterHashtag.nodeId;
        }

        // nodeUrl = "https://twitter.com/search?f=tweets&q=%23" + d.text ;
        window.open("https://twitter.com/search?f=tweets&q=%23"+d.text, "_blank");
      break;

      case "place" :
        // nodeUrl = "http://twitter.com/search?q=place%3A" + d.placeId ;
        window.open("http://twitter.com/search?q=place%3A" + d.placeId, "_blank");
      break;
    }
  }

  var nodeTopTermLabels;

  var updateTopTerm = function(callback) {

    nodeTopTermLabels = nodeTopTermLabelSvgGroup.selectAll("text")
      .data(nodesTopTerm, function updateTopTermData(d) { return d.nodeId; });

    nodeTopTermLabels
      .exit()
      .remove();

    nodeTopTermLabels
      .attr("x", xposition)
      .text(function updateTopTermText(d) {
        return d.displaytext;
      })
      .style("opacity", function updateTopTermOpacity(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return topTermLabelOpacityScale(d.ageMaxRatio); 
      })
      .transition()
        .duration(1.5*transitionDuration)
        .attr("y", yposition);

    nodeTopTermLabels
      .enter().append("text")
      .style("text-anchor", "right")
      .style("alignment-baseline", "bottom")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .style("pointer-events", "auto")
      .attr("x", xposition)
      .text(function updateTopTermText(d) {
        return d.displaytext;
      })
      .style("font-family", "monospace")
      .style("opacity", function updateTopTermOpacity(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return topTermLabelOpacityScale(d.ageMaxRatio); 
      })
      .style("fill", function updateTopTermFill(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.category || d.categoryAuto) { return d.categoryColor; }
        if (d.isTrendingTopic || d.isNumber || d.isCurrency) { return palette.white; }
        if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.darkgray; 
      })
      .style("font-size", fontTopTerm)
      .transition()
        .duration(2*transitionDuration)
        .attr("y", yposition);


    callback(null, null);
  };

  var nodeCircles;
  var updateNodeCircles = function(callback) {

    nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(nodeArray, function (d){ return d.nodeId; });

    nodeCircles
      .enter().append("circle")
      .attr("id", function (d) { return d.nodePoolId; })
      .attr("nodeId", function (d) { return d.nodeId; })
      .style("visibility", function (d) { 
        if (!d.isValid) { return "hidden"; }
        return "visible"; 
      })
      .attr("r", 1e-6) 
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
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
        if (d.categoryMatch) { return categoryMatchStrokeWidth; }
        if (d.isTopTerm) { return "3.0"; }
        if (d.newFlag) { return "3.0"; }
        if (d.categoryAuto === "right") { return categoryAutoStrokeWidth; }
        if (d.categoryAuto === "left") { return categoryAutoStrokeWidth; }
        if (d.categoryAuto === "positive") { return categoryAutoStrokeWidth; }
        if (d.categoryAuto ==="negative") { return categoryAutoStrokeWidth; }
        return "2.0"; 
      })
      .style("opacity", function (d) { return nodeLabelOpacityScale(d.ageMaxRatio); })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick);

    nodeCircles
      .attr("r", function(d) {
        if (metricMode === "rate") { return defaultRadiusScale(Math.sqrt(d.rate));}
        if (metricMode === "mentions") {return defaultRadiusScale(Math.sqrt(d.mentions));}
      })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("visibility", function (d) {
        if (!d.isValid) { return "hidden"; }
        if (mouseMovingFlag) { return "visible"; }
        if (d.rate > MIN_RATE) { return "visible"; }
        if (d.followersCount > MIN_FOLLOWERS) { return "visible"; }
        if (d.mentions > MIN_FOLLOWERS) { return "visible"; }
        if (d.category) { return "visible"; }
        if (d.nodeType === "hashtag") { 
          if (d.text.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        if (d.nodeType === "user") { 
          if (d.screenName.toLowerCase().includes("trump")) { return "visible"; }
          if (d.name && d.name.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        return "hidden";
      })
      .style("opacity", function(d) { return nodeLabelOpacityScale(d.ageMaxRatio); })
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
        if (d.categoryMatch) { return categoryMatchStrokeWidth; }
        if (d.isTopTerm) { return "3.0"; }
        if (d.newFlag) { return "3.0"; }
        if (d.categoryAuto === "right") { return categoryAutoStrokeWidth; }
        if (d.categoryAuto === "left") { return categoryAutoStrokeWidth; }
        if (d.categoryAuto === "positive") { return categoryAutoStrokeWidth; }
        if (d.categoryAuto ==="negative") { return categoryAutoStrokeWidth; }
        return "2.0"; 
      })
      .on("click", nodeClick);

    nodeCircles
      .exit()
      .attr("r", 1e-6)
      .style("opacity", 1e-6);
      // .remove()

    callback();
  };

  var nodeLabels;
  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text")
      .data(nodeArray, function (d) { return d.nodeId; });

    nodeLabels
      .text(labelText)
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y; })
      .style("opacity", function (d) { return nodeLabelOpacityScale(d.ageMaxRatio); })
      .style("visibility", function (d) {
        if (!d.isValid) { return "hidden"; }
        if (mouseMovingFlag) { return "visible"; }
        if (d.rate > MIN_RATE) { return "visible"; }
        if (d.followersCount > MIN_FOLLOWERS) { return "visible"; }
        if (d.mentions > MIN_FOLLOWERS) { return "visible"; }
        if (d.category) { return "visible"; }
        if (d.nodeType === "hashtag") { 
          if (d.text.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        if (d.nodeType === "user") { 
          if (d.screenName.toLowerCase().includes("trump")) { return "visible"; }
          if (d.name && d.name.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        return "hidden";
      })
      .style("font-size", function (d) {
        if (metricMode === "rate") { return nodeLabelSizeScale(d.rate); }
        if (metricMode === "mentions") { return nodeLabelSizeScale(d.mentions); }
      });

    nodeLabels
      .enter().append("text")
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
        if (d.followersCount > MIN_FOLLOWERS) { return "bold"; }
        return "normal";
      })
      .style("visibility", function (d) {
        if (!d.isValid) { return "hidden"; }
        if (mouseMovingFlag) { return "visible"; }
        if (d.rate > MIN_RATE) { return "visible"; }
        if (d.followersCount > MIN_FOLLOWERS) { return "visible"; }
        if (d.mentions > MIN_FOLLOWERS) { return "visible"; }
        if (d.category) { return "visible"; }
        if (d.nodeType === "hashtag") { 
          if (d.text.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        if (d.nodeType === "user") { 
          if (d.screenName.toLowerCase().includes("trump")) { return "visible"; }
          if (d.name && d.name.toLowerCase().includes("trump")) { return "visible"; }
          return "hidden";
        }
        return "hidden";
      })
      .style("text-decoration", function (d) { 
        if (d.isTopTerm && (d.followersCount > MIN_FOLLOWERS)) { return "overline underline"; }
        if (!d.isTopTerm && (d.followersCount > MIN_FOLLOWERS)) { return "underline"; }
        if (d.isTopTerm) { return "overline"; }
        return "none"; 
      })
      .style("opacity", function (d) { return nodeLabelOpacityScale(d.ageMaxRatio); })
      .style("fill", palette.white)
      .style("stroke-width", function (d) { 
        if (d.categoryMatch) { return categoryMatchStrokeWidth; }
        if (d.categoryMismatch) { return "4.0"; }
        if (d.isTopTerm) { return "3.0"; }
        if (d.newFlag) { return "2.0"; }
        return "1.2"; 
      })
      .style("font-size", function (d) {
        if (metricMode === "rate") { return nodeLabelSizeScale(d.rate); }
        if (metricMode === "mentions") { return nodeLabelSizeScale(d.mentions); }
      });

    nodeLabels
      .exit()
      .style("font-size", 1e-6)
      .style("opacity", 1e-6)
      // .remove();

    if (callback !== undefined) { callback(); }
  };

  var focus = function(focalPoint){
    switch (focalPoint) {
      case "left":
        return({
          x: randomIntFromInterval(xMinRatioLeft*width, xMaxRatioLeft*width), 
          y: randomIntFromInterval(yMinRatioLeft*height, yMaxRatioLeft*height)
        });
      break;
      case "right":
        return({
          x: randomIntFromInterval(xMinRatioRight*width, xMaxRatioRight*width), 
          y: randomIntFromInterval(yMinRatioRight*height, yMaxRatioRight*height)
        });
      break;
      case "positive":
        return({
          x: randomIntFromInterval(xMinRatioPositive*width, xMaxRatioPositive*width), 
          y: randomIntFromInterval(yMinRatioPositive*height, yMaxRatioPositive*height)
        });
      break;
      case "negative":
        return({
          x: randomIntFromInterval(xMinRatioNegative*width, xMaxRatioNegative*width), 
          y: randomIntFromInterval(yMinRatioNegative*height, yMaxRatioNegative*height)
        });
      break;
      case "neutral":
        return({
          x: randomIntFromInterval(xMinRatioNeutral*width, xMaxRatioNeutral*width), 
          y: randomIntFromInterval(yMinRatioNeutral*height, yMaxRatioNeutral*height)
        });
      break;
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
    displaytext = "";

    if (node.isMaxNode) {
      if (metricMode === "rate") {
        nodeIdString = node.rateNodeId.toUpperCase();
        if (node.rateNodeType === "user") { nodeIdString = "@" + nodeIdString; }
        if (node.rateNodeType === "hashtag") { nodeIdString = "#" + nodeIdString; }
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt 
        + " | " + nodeIdString
        + " | RATE MAX " + moment(parseInt(node.rateTimeStamp)).format(compactDateTimeFormat);
      }
      else {
        nodeIdString = node.mentionsNodeId.toUpperCase();
        if (node.mentionsNodeType === "user") { nodeIdString = "@" + node.screenName; }
        if (node.rateNodeType === "hashtag") { nodeIdString = "#" + nodeIdString; }
        displaytext = new Array(ratePadSpaces).join("\xa0") + rateString 
        + " | " + new Array(mentionPadSpaces).join("\xa0") + mentionsInt
        + " | " + nodeIdString
        + " | MENTION MAX " + moment(parseInt(node.mentionsTimeStamp)).format(compactDateTimeFormat);
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
  var nodesModifiedFlag = false;
  var nodeAddQReady = true;
  var currentNode;
  var nodePoolIdcircle;

  var processNodeAddQ = function(callback) {

    if (nodeAddQReady && (nodeAddQ.length > 0)) {

      nodeAddQReady = false;

      newNode = nodeAddQ.shift();

      nodesModifiedFlag = false;

      if (nodeIdHashMap.has(newNode.nodeId)){

        var nodePoolId = nodeIdHashMap.get(newNode.nodeId);

        currentNode = localNodeHashMap.get(nodePoolId);

        currentNode.age = 1e-6;
        currentNode.isDead = false;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.rate = newNode.rate;
        // currentNode.rank = newNode.rank;
        currentNode.mentions = newNode.mentions;
        currentNode.isTopTerm = newNode.isTopTerm;
        currentNode.isTrendingTopic = newNode.isTrendingTopic;
        currentNode.category = newNode.category;
        currentNode.categoryAuto = newNode.categoryAuto;

        if (newNode.nodeType === "user"){
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        currentNode.displaytext = createDisplayText(currentNode);

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);

        nodeAddQReady = true;

        callback(null, nodesModifiedFlag);
      }
      else {
        nodesModifiedFlag = true;

        currentNode = nodePool.use();

        nodeIdHashMap.set(newNode.nodeId, currentNode.nodePoolId);

        currentNode.isValid = true;

        currentNode.nodeId = newNode.nodeId;
        currentNode.userId = newNode.userId;
        currentNode.hashtagId = newNode.hashtagId;
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

        if (newNode.nodeType === "user"){
          currentNode.followersCount = newNode.followersCount || 0;
          currentNode.followersMentions = newNode.followersCount + newNode.mentions;
        }

        currentNode.age = 1e-6;
        currentNode.ageMaxRatio = 1e-6;
        currentNode.ageUpdated = moment().valueOf();
        currentNode.isDead = false;
        currentNode.isMaxNode = false;
        currentNode.mouseHoverFlag = false;
        currentNode.newFlag = true;
        currentNode.x = 0.5*width;
        currentNode.y = 0.5*height;

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

        nodePoolIdcircle = document.getElementById(currentNode.nodePoolId);
        if (nodePoolIdcircle) {
          nodePoolIdcircle.setAttribute("r", 1e-6);
          nodePoolIdcircle.setAttribute("visibility", "hidden");
          nodePoolIdcircle.setAttribute("opacity", 1e-6);
        }

        localNodeHashMap.set(currentNode.nodePoolId, currentNode);

        nodeAddQReady = true;

        callback(null, nodesModifiedFlag);
      }

      if (nodeIdHashMap.size > maxNumberNodes) { maxNumberNodes = nodeIdHashMap.size; }

    }
    else {
      if (nodeIdHashMap.size > maxNumberNodes) { maxNumberNodes = nodeIdHashMap.size; }
      callback(null, nodesModifiedFlag);
    }
  };

  function ticked() {
    drawSimulation(function drawSimulationCallback() { updateSimulation(); });
  }

  var previousMaxMetric = 0;

  function drawSimulation(callback){

    async.series([
      function updateNodeCirclesSeries (cb){ updateNodeCircles(cb); },
      function updateNodeLabelsSeries (cb){ updateNodeLabels(cb); },
      function updateTopTermSeries (cb){ updateTopTerm(cb); }
    ], function drawSimulationCallback (err, results) {
      if (newCurrentMaxMetricFlag && (Math.abs(currentMaxMetric - previousMaxMetric)/currentMaxMetric) > 0.05) {

        newCurrentMaxMetricFlag = false;
        previousMaxMetric = currentMaxMetric;

        nodeLabelSizeScale = d3.scaleLinear()
          .domain([1, currentMaxMetric])
          .range([fontSizeMin, fontSizeMax])
          .clamp(true);

        defaultRadiusScale = d3.scaleLinear()
          .domain([0, Math.sqrt(currentMaxMetric)])
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

  // var rowNum;
  function yposition(d){
    if (d.rank < 0) { return height; }
    // rowNum = d.rank % maxHashtagRows;
    // var value = hashtagTopMargin + (rowNum * rowSpacing);
    return (hashtagTopMargin + ((d.rank % maxHashtagRows) * rowSpacing)) + "%";
  }

  // var colNum;
  function xposition(d){
    if (d.rank < 0) { return hashtagLeftMargin; }
    // colNum = parseInt(d.rank / maxHashtagRows);        
    // var value = hashtagLeftMargin + (colNum * colSpacing);
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

    newNode.rank = 100;
    newNode.newFlag = true;
    newNode.followersCount = (newNode.followersCount) ? newNode.followersCount : 0;
    newNode.mentions = (newNode.mentions) ? newNode.mentions : 0;

    if (newNode.nodeType === "user") {
      newNode.followersMentions = newNode.mentions + newNode.followersCount;
    }

    if ((newNode.nodeType === "user") && (newNode.mentions > currentMax.mentions.value)) { 

      newCurrentMaxMetricFlag = true;

      currentMax.mentions.value = newNode.mentions; 
      currentMax.mentions.nodeId = newNode.screenName.toLowerCase(); 
      currentMax.mentions.timeStamp = moment().valueOf(); 

      if (metricMode === "mentions") {
        currentMaxMetric = newNode.mentions; 
      }
    }
    else if (newNode.mentions > currentMax.mentions.value) { 

      newCurrentMaxMetricFlag = true;

      currentMax.mentions.nodeType = newNode.nodeType;
      currentMax.mentions.value = newNode.mentions; 
      currentMax.mentions.timeStamp = moment().valueOf(); 

      if (newNode.nodeType === "user") {
        if (newNode.screenName !== undefined) {
          currentMax.mentions.nodeId = newNode.screenName.toLowerCase(); 
        }
        else if (newNode.name !== undefined) {
          currentMax.mentions.nodeId = newNode.screenName.toLowerCase(); 
        }
        else {
          currentMax.mentions.nodeId = newNode.nodeId; 
        }
      }
      else if (newNode.name && (newNode.nodeType === "place")) {
        currentMax.mentions.nodeId = newNode.name.toLowerCase(); 
      }
      else if (newNode.nodeId === undefined) {
        console.error("*** NODE ID UNDEFINED\n" + jsonPrint(newNode));
      }
      else  {
        currentMax.mentions.nodeId = newNode.nodeId; 
      }

      if (metricMode === "mentions") {
        currentMaxMetric = newNode.mentions; 
      }
    }

    if (newNode.rate > currentMax.rate.value) { 

      newCurrentMaxMetricFlag = true;

      currentMax.rate.nodeType = newNode.nodeType;
      currentMax.rate.value = newNode.rate;

      if (newNode.nodeType === "user") {
        if (newNode.screenName !== undefined) { currentMax.rate.nodeId = newNode.screenName.toLowerCase(); }
        else if (newNode.name !== undefined) { currentMax.rate.nodeId = newNode.screenName.toLowerCase(); }
        else { currentMax.rate.nodeId = newNode.nodeId; }
      }
      else if (newNode.nodeType === "place") { currentMax.rate.nodeId = newNode.name; }
      else { currentMax.rate.nodeId = newNode.nodeId; }
      currentMax.rate.timeStamp = moment().valueOf(); 

      if (metricMode === "rate") { currentMaxMetric = newNode.rate; }
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
      }).iterations(collisionIterations).strength(1.0))
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
    .domain([0, Math.sqrt(currentMaxMetric)])
    .range([nodeRadiusMin, nodeRadiusMax])
    .clamp(true);

    fontSizeMin = fontSizeMinRatio * height;
    fontSizeMax = fontSizeMaxRatio * height;

    nodeLabelSizeScale = d3.scaleLinear()
      .domain([1, currentMaxMetric])
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

    svgTopTermLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    nodeTopTermLabelSvgGroup
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    svgTopTerms
      .attr("width", width)
      .attr("height", height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    fontTopTerm = fontSizeTopTermRatio * topTermsDiv.height;
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
        }).iterations(collisionIterations))
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