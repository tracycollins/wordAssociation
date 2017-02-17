/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewForce() {

  var newAgeRatio = 0.05;
  var nodeNewAge = 1000;

  var disableLinks = false;
  var hideNodeCirclesFlag = false;
  var hideNodeImagesFlag = false;

  var sPosHashMap = {};

  var localSessionHashMap = new HashMap();
  var localNodeHashMap = new HashMap();
  var localLinkHashMap = new HashMap();

  var MAX_NODES = 47;
  var processNodeCount = 0;
  var processNodeModulus = 3;

  var maxNodeAddQ = 0;

  var self = this;
  var simulation;

  var showStatsFlag = true;
  var fixedGroupsFlag = false;

  var runningFlag = false;
  var updateNodeFlag = false;
  
  var nodeAddQ = [];
  var nodeUpdateQ = [];
  var nodeDeleteQ = [];
  var linkUpdateQ = [];

  // ==============================================
  // GLOBAL VARS
  // ==============================================
  // var testModeEnabled = false;

  var newNodesFlag = false;
  var deadNodeFlag = false;

  var maxTotalWordChainIndex ;

  var sliderPercision = 3;

  var tickNumber = 0;
  var width = window.innerWidth * 0.9;
  var height = window.innerHeight * 0.9;

  this.getWidth = function() {
    return window.innerWidth;
  }

  this.getHeight = function() {
    return window.innerHeight;
  }

  var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
  var compactDateTimeFormat = "YYYYMMDD HHmmss ZZ";
  var defaultTimePeriodFormat = "HH:mm:ss";


  var mouseFreezeEnabled = true;
  var mouseHoverFlag = false;
  var mouseOverRadius = 10;
  var mouseHoverNodeId = false;

  var nodeMaxAge = 60000;

  var DEFAULT_CONFIG = {'nodeMaxAge': window.DEFAULT_MAX_AGE};
  var config = DEFAULT_CONFIG;
  var previousConfig = [];

  var defaultFadeDuration = 250;

  var DEFAULT_FLOW_CONFIG = {
    'charge': DEFAULT_CHARGE,
    'velocityDecay': DEFAULT_VELOCITY_DECAY,
    'linkStrength': DEFAULT_LINK_STRENGTH,
    'linkDistance': DEFAULT_LINK_DISTANCE,
    'gravity': DEFAULT_GRAVITY,
    'forceYmultiplier': DEFAULT_FORCEY_MULTIPLIER,
    'ageRate': window.DEFAULT_AGE_RATE,
  };

  var ageRate = DEFAULT_FLOW_CONFIG.ageRate;
  var maxAgeRate = 0;

  var blahMode = DEFAULT_BLAH_MODE;
  var charge = DEFAULT_CHARGE;
  var gravity = DEFAULT_GRAVITY;
  var forceYmultiplier = DEFAULT_FORCEY_MULTIPLIER;
  var collisionRadiusMultiplier = DEFAULT_COLLISION_RADIUS_MULTIPLIER;
  var collisionIterations = DEFAULT_COLLISION_ITERATIONS;
  var globalLinkStrength = DEFAULT_LINK_STRENGTH;
  var globalLinkDistance = DEFAULT_LINK_DISTANCE;
  var velocityDecay = DEFAULT_VELOCITY_DECAY;

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
    "blue": "#2176C7",
    "green": "#259286",
    "lightgreen": "#35A296",
    "yellowgreen": "#738A05"
  };

  var currentHashtagMaxMentions = 2;

  var minFontSize = 20;
  var maxFontSize = 30;

  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var FLOW_LAYOUT_WIDTH_RATIO = 1.0;
  var FLOW_LAYOUT_HEIGHT_RATIO = 1.0;

  var svgMain_WIDTH_RATIO = 1.0;
  var svgMain_HEIGHT_RATIO = 1.0;

  var deadNodesHash = {};
  var deadLinksHash = {};

  var translate = [0, 0];

  var d3LayoutWidth = window.innerWidth * D3_LAYOUT_WIDTH_RATIO;
  var d3LayoutHeight = window.innerHeight * D3_LAYOUT_HEIGHT_RATIO;

  console.log("width: " + window.innerWidth + " | height: " + window.innerHeight);

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }
  }, true);

  var nodeCircleOpacityScale = d3.scaleLinear().domain([1e-6, 1.0]).range([1.0, 1e-6]);
  var nodeImageOpacityScale = d3.scaleLinear().domain([1e-6, 1.0]).range([1.0, 1e-6]);
  var nodeLabelOpacityScale = d3.scaleLinear().domain([1e-6, 1.0]).range([1.0, 1e-6]);
  var linkOpacityScale = d3.scaleLinear().domain([1e-6, 1.0]).range([0.5, 1e-6]);

  // var adjustedAgeRateScale = d3.scaleLinear().domain([1, 500]).range([1.0, 10.0]).clamp(true);
  var adjustedAgeRateScale = d3.scaleLinear().domain([1, MAX_NODES]).range([1.0, 10.0]);

  var nodeFontSizeScale = d3.scaleLinear().domain([1, currentHashtagMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
  var imageSizeScale = d3.scaleLog().domain([1, 10000000]).range([20.0, 120.0]).clamp(true);
  var defaultRadiusScale = d3.scaleLog().domain([1, 10000000]).range([5, 30]).clamp(true);

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  function jp(s, obj) {
    console.warn(s + "\n" + jsonPrint(obj));
  }

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  var randomIntFromInterval = function(min, max) {
    var random = Math.random();
    var randomInt = Math.floor((random * (max - min + 1)) + min);
    return randomInt;
  };

  var randomId = randomIntFromInterval(1000000000, 9999999999);

  d3.select("body").style("cursor", "default");

  var nodes = [];
  var links = [];
  
  this.getNodesLength = function() {
    return nodes.length;
  }
  
  this.getMaxNodes = function() {
    return maxNumberNodes;
  }
  
  this.getNodeAddQlength = function() {
    return nodeAddQ.length;
  }
  
  this.getMaxNodeAddQ = function() {
    return maxNodeAddQ;
  }
  

  this.getLinksLength = function() {
    return links.length;
  }
  
  this.getAgeRate = function() {
    return ageRate;
  }
  
  this.getMaxAgeRate = function() {
    return maxAgeRate;
  }
  
  this.setNodeMaxAge = function(maxAge) {
    nodeMaxAge = maxAge;
    console.debug("SET NODE MAX AGE: " + nodeMaxAge);
  }

  var maxNumberNodes = 0;
  var maxNumberLinks = 0;


  var d3image = d3.select("#d3group");

  var svgMain = d3image.append("svg:svg")
    .attr("id", "svgMain")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var svgForceLayoutArea = svgMain.append("g")
    .attr("id", "svgForceLayoutArea")
    .attr("width", width)
    .attr("height", height)
    .attr("viewbox", 1e-6, 1e-6, width, height)
    // .attr("preserveAspectRatio", "none")
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var linkSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "linkSvgGroup");
  var nodeSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");
  var nodeImages = nodeSvgGroup.selectAll("image");

  var defs = nodeSvgGroup.append("defs");

  var pattern = nodeSvgGroup.append("pattern")
    .attr("id", "hash4_4")
    .attr("width", 8)
    .attr("height", 8)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(-45)")
    .append("rect")
    .attr("width", 4)
    .attr("height", 8)
    .attr("transform", "translate(0,0)")
    .attr("fill", palette.yellow);

  var filterBorderUser = nodeSvgGroup.append("defs")
    .append("filter")
      .attr("id", "borderUser");

  filterBorderUser.append("feImage")
    .attr("result", "bgBorder")
    .attr("href", "/assets/images/userBackgroundBorder.png");
  filterBorderUser.append("feBlend")
    .attr("in", "SourceGraphic")
    .attr("in1", "bgBorder")
    .attr("mode", "normal");


  var filterBorderMedia = nodeSvgGroup.append("defs")
    .append("filter")
      .attr("id", "borderMedia");

  filterBorderMedia.append("feImage")
    .attr("result", "bgBorder")
    .attr("href", "/assets/images/mediaBackgroundBorder.png");
  filterBorderMedia.append("feBlend")
    .attr("in", "SourceGraphic")
    .attr("in1", "bgBorder")
    .attr("mode", "normal");


  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

  var globalLinkIndex = 0;

  self.toolTipVisibility = function(isVisible){
    if (isVisible) {
      divTooltip.style("visibility", "visible");
    }
    else {
      divTooltip.style("visibility", "hidden");
    }
  }

  var panzoomElement = document.getElementById('svgForceLayoutArea');
  panzoom(panzoomElement, {zoomSpeed: 0.030});

  function generateLinkId(callback) {
    globalLinkIndex++;
    return "LNK" + globalLinkIndex;
  }

  self.setPause = function(value){
    console.debug("SET PAUSE: " + value);
    runningFlag = !value;
    if (value){
      self.simulationControl('PAUSE');
    }
    else{
      self.simulationControl('RESUME');
    }
  }

  self.togglePause = function(){
    if (runningFlag){
      self.simulationControl('PAUSE');
    }
    else{
      self.simulationControl('RESUME');
    }
  }

  self.updateParam = function(param, value) {
    console.log("updateParam: " + param + " = " + value);
    switch(param){
      case "linkStrength" :
        globalLinkStrength = value;
        simulation.force("link", d3.forceLink(links)
          .distance(function(d){
            return globalLinkDistance; 
          })
          .strength(function(d){
          return 0.5*globalLinkStrength; 
        }))
      break;
      case "linkDistance" :
        globalLinkDistance = value;
        simulation.force("link", d3.forceLink(links)
          .distance(function(d){
            return globalLinkDistance; 
          })
          .strength(function(d){
          return 0.5*globalLinkStrength; 
        }))
      break;
    }
  }

  self.updateLinkStrength = function(value) {
    console.debug("UPDATE LINK STRENGTH: " + value.toFixed(sliderPercision));
    globalLinkStrength = value;
    // simulation.force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength));
    // simulation.force("link", d3.forceLink(links).distance(globalLinkDistance).strength(globalLinkStrength));
    simulation.force("link", d3.forceLink(links)
      .distance(function(d){
        return globalLinkDistance; 
      })
      .strength(function(d){
      return 0.5*globalLinkStrength; 
    }))
  }

  self.updateLinkDistance = function(value) {
    console.debug("UPDATE LINK DISTANCE: " + value.toFixed(sliderPercision));
    globalLinkDistance = value;
    // simulation.force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength));
    // simulation.force("link", d3.forceLink(links).distance(globalLinkDistance).strength(globalLinkStrength));
    simulation.force("link", d3.forceLink(links)
      .distance(function(d){
        return globalLinkDistance; 
      })
      .strength(function(d){
      return 0.5*globalLinkStrength; 
    }))
  }

  self.updateVelocityDecay = function(value) {
    console.debug("UPDATE VEL DECAY: " + value.toFixed(sliderPercision));
    velocityDecay = value;
    simulation.velocityDecay(velocityDecay);
  }

  self.updateGravity = function(value) {
    console.debug("UPDATE GRAVITY: " + value.toFixed(sliderPercision));
    gravity = value;

    simulation.force("forceX", d3.forceX().x(function(d) { 
        return 0.5*width; 
      }).strength(function(d){
        return 1*gravity; 
      }));

    simulation.force("forceY", d3.forceY().y(function(d) { 
        return 0.4*height; 
      }).strength(function(d){
        return forceYmultiplier * gravity; 
      }));
  }

  self.updateCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  }

  self.resetDefaultForce = function() {
    console.log("RESET FLOW LAYOUT DEFAULTS");
    self.updateCharge(DEFAULT_CHARGE);
    self.updateVelocityDecay(DEFAULT_VELOCITY_DECAY);
    self.updateGravity(DEFAULT_GRAVITY);
    self.updateLinkStrength(DEFAULT_LINK_STRENGTH);
    self.updateLinkDistance(DEFAULT_LINK_DISTANCE);
  }

  //================================
  // GET NODES FROM QUEUE
  //================================

  var age;
  var ageMaxRatio;  // 0.0 - 1.0 of nodeMaxAge
  var nodeIndex = 0;

  function deleteNodeQ(nodeId, callback){

    var deadNodeFlag = false;

    var nodesLength = nodes.length - 1;
    var linksLength = links.length - 1;

    var node;

    var nodeIndex = nodesLength;
    var linkIndex = linksLength;

    for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {

      var node = nodes[nodeIndex];

      if (node.nodeId == nodeId) {

        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          var linkId = link.linkId;
          if (node.links[linkId]) {
          }
        }

        if (linkIndex < 0) {
          nodes.splice(nodeIndex, 1);
          deadNodeFlag = true;
          return(callback(null, deadNodeFlag));
        }
      }
    }
    if ((nodeIndex < 0) && (linkIndex < 0)) {
      nodes.splice(nodeIndex, 1);
      console.debug("XXX NODE NOT FOUND ??? " + nodeId);
      return(callback(null, deadNodeFlag));
    }
  }

  function deleteLinkQ(linkId, callback){
    var deadLinkFlag = false;

    var linksLength = links.length - 1;
    var linkIndex = linksLength;

    for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
      if (linkId == links[linkIndex].linkId) {
        deadLinkFlag = true;
        links.splice(linkIndex, 1);
        return(callback(null, deadLinkFlag));
      }
    }

    if (linkIndex < 0) {
      return(callback(null, deadLinkFlag));
    }
  }

  function addNodeEnabled (){
    if (nodes.length < MAX_NODES) {
      // console.debug("processNodeCount"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 2*MAX_NODES) && (processNodeCount % processNodeModulus == 0)) {
      // console.debug("processNodeCount MAX_NODES MOD"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 3*MAX_NODES) && (processNodeCount % (processNodeModulus+1) == 0)) {
      // console.debug("processNodeCount MAX_NODES MOD"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 4*MAX_NODES) && (processNodeCount % (processNodeModulus+2) == 0)) {
      // console.debug("processNodeCount MAX_NODES MOD 2"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 8*MAX_NODES) && (processNodeCount % (processNodeModulus+3) == 0)) {
      // console.debug("processNodeCount MAX_NODES MOD 8"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else {
      // console.info("processNodeCount MAX_NODES"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return false;
    }
  }

  var processNodeAddQ = function(callback) {

    var nodesModifiedFlag = false;

    processNodeCount++;

    while ((nodeAddQ.length > 0) && (addNodeEnabled() || (nodeAddQ[0].nodeType == "tweet"))) {

      nodesModifiedFlag = false;

      processNodeCount++;

      var nodeAddObj = nodeAddQ.shift();
      var newNode = nodeAddObj.node;
      var currentNode = {};

      // console.warn("processNodeAddQ | " + newNode.nodeType + " | " + newNode.nodeId);

      switch (nodeAddObj.op) {

        case "add":

          if (localNodeHashMap.has(newNode.nodeId)){
            // console.error("localNodeHashMap HIT: " + newNode.nodeId);
            currentNode = localNodeHashMap.get(newNode.nodeId);
            currentNode.newFlag = true;
            currentNode.age = 1e-6;
            currentNode.ageMaxRatio = 1e-6;
          }
          else {
            nodesModifiedFlag = true;
            currentNode = newNode;
            if (!newNode.links) currentNode.links = {};
            currentNode.newFlag = true;
            currentNode.age = 1e-6;
            currentNode.ageMaxRatio = 1e-6;
            currentNode.x = randomIntFromInterval(0.45 * width, 0.55 * width);
            currentNode.y = randomIntFromInterval(0.45 * height, 0.55 * height);
            // if (newNode.nodeType == "tweet"){
            // }
          }

          currentNode.mentions = newNode.mentions;
          currentNode.ageUpdated = moment().valueOf();

          if ((newNode.nodeType == "hashtag") && (newNode.mentions > currentHashtagMaxMentions)){
            currentHashtagMaxMentions = newNode.mentions;
            nodeFontSizeScale = d3.scaleLinear().domain([1, currentHashtagMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
            console.info("NEW MAX Ms" 
              + " | " + currentHashtagMaxMentions 
              + " | " + currentNode.nodeType 
              + " | " + currentNode.text 
            );
          }

          if (nodesModifiedFlag) nodes.push(currentNode);

          localNodeHashMap.set(currentNode.nodeId, currentNode);

          if (nodes.length > maxNumberNodes) {
            maxNumberNodes = nodes.length;
          }

        break;

        default:
          console.error("??? UNKNOWN NODE UPDATE Q OP: " + nodeAddObj.op);
        break;
      }
    }

    if ((nodeAddQ.length == 0) || !addNodeEnabled()){
      callback(null, nodesModifiedFlag);
    }
  }

  var processNodeUpdateQ = function(callback) {

    var nodesModifiedFlag = false;


    while (nodeUpdateQ.length > 0) {

      var nodeUpdateObj = nodeUpdateQ.shift();

      switch (nodeUpdateObj.op) {

        case "update":
          // nodesModifiedFlag = true;

          var node;
          var nodesLength = nodes.length - 1;
          var nodeIndex = nodesLength;

          for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {
            node = nodes[nodeIndex];
            if (node.nodeId == uNode.nodeId) {
              nodesModifiedFlag = true;
              console.debug("updateNode PREVIOUS\n" + jsonPrint(node));
              uNode.age = 0;
              uNode.ageMaxRatio = 1e-6;
              uNode.ageUpdated = moment().valueOf();
              nodes[nodeIndex] = uNode;
              console.debug("updateNode UPDATED\n" + jsonPrint(uNode));
            }
          }

          if (nodeIndex < 0) {
            updateNodeFlag = false;
            console.debug("updateNode DONE");
            return;
          }
        break;

        default:
          console.error("??? UNKNOWN NODE UPDATE Q OP: " + nodeUpdateObj.op);
        break;

      }
    }

    if (nodeUpdateQ.length == 0) {
      callback(null, nodesModifiedFlag);
    }
  }

  var processNodeDeleteQ = function(callback) {

    var nodesModifiedFlag = false;

    while (nodeDeleteQ.length > 0){

      var nodeDeleteObj = nodeDeleteQ.shift();

      switch (nodeDeleteObj.op) {

        case "delete":
          deleteNodeQ(nodeDeleteObj.nodeId, function(err, deadNodeFlag){
            if (deadNodeFlag) nodesModifiedFlag = true;
          });
        break;

        default:
          console.error("??? UNKNOWN NODE DELETE Q OP: " + nodeDeleteObj.op);
        break;

      }
    }

    if (nodeDeleteQ.length == 0){
      callback(null, nodesModifiedFlag);
    }
  }

  var processLinkUpdateQ = function(callback) {

    var linksModifiedFlag = false;
    var linkUpdateObj;

    while (linkUpdateQ.length > 0) {

      linkUpdateObj = linkUpdateQ.shift();

      switch (linkUpdateObj.op) {
        case "add":
          linksModifiedFlag = true;
          links.push(linkUpdateObj.link);
        break;
        case "delete":
          deleteLinkQ(linkUpdateObj.linkId, function(err, deadLinkFlag){
            localLinkHashMap.remove(linkUpdateObj.link);
            if (deadLinkFlag) linksModifiedFlag = true;
          });
        break;
        default:
          console.error("UNKNOWN LINK OP: " + linkUpdateObj.op);
        break;
      }
    }

    if (linkUpdateQ.length == 0){
      callback(null, linksModifiedFlag);
    }
  }

  var createTweetLinksQueue = [];
  var createTweetLinksHashMap = new HashMap();
  var createTweetLinksInterval;
  var createTweetLinksReady = true;

  function initCreateTweetLinksInterval (interval){

    clearInterval(createTweetLinksInterval);
    createTweetLinksQueue = [];

    var node;

    createTweetLinksInterval = setInterval(function(){
      while (createTweetLinksQueue.length > 0) {
        node = createTweetLinksQueue.shift();
        createTweetLinks(node, function(){
          // createTweetLinksHashMap.remove(node.nodeId);
        });
      }
    }, interval);
  }

  function createTweetLinks(node, callback){

    async.parallel({

      tweet: function(cb) {

        if (node.isRetweet){

          // console.info("RT"
          //   + " | " + node.nodeId
          //   + " | " + moment(node.createdAt).format(compactDateTimeFormat)
          //   + " | " + node.retweetedId
          //   + " | " + moment(new Date(node.retweetedStatus.created_at)).format(compactDateTimeFormat)
          // );

          if (localNodeHashMap.has(node.retweetedId)) {

            // console.debug("RT"
            //   + " | " + node.nodeId
            //   + " | " + moment(node.createdAt).format(compactDateTimeFormat)
            //   + " | " + node.retweetedId
            //   + " | " + moment(new Date(node.retweetedStatus.created_at)).format(compactDateTimeFormat)
            // );

            var twNode = localNodeHashMap.get(node.retweetedId);
            var linkId = node.nodeId + "_" + twNode.nodeId;

            if (!localLinkHashMap.has(linkId)) {
              var newLink = {
                linkId: linkId,
                age: 0,
                source: node,
                target: twNode,
                sourceAndTarget: true
              }
              localLinkHashMap.set(linkId, newLink);
              self.addLink(newLink);
              twNode.age = 0;
              localNodeHashMap.set(twNode.nodeId, twNode);
            }
            else {
              newLink = localLinkHashMap.get(linkId);
              newLink.age = 0;
              localLinkHashMap.set(linkId, newLink);
            }
          }
          cb();
        }
        else {
          cb();
        }
      },

      user: function(cb) {

        if (node.user){

          if (localNodeHashMap.has(node.user.nodeId)) {

            var usNode = localNodeHashMap.get(node.user.nodeId);
            var linkId = node.nodeId + "_" + usNode.nodeId;

            if (!localLinkHashMap.has(linkId)) {
              var newLink = {
                linkId: linkId,
                age: 0,
                source: node,
                target: usNode,
                sourceAndTarget: true
              }
              localLinkHashMap.set(linkId, newLink);
              self.addLink(newLink);
              usNode.age = 0;
              localNodeHashMap.set(usNode.nodeId, usNode);
            }
            else {
              newLink = localLinkHashMap.get(linkId);
              newLink.age = 0;
              localLinkHashMap.set(linkId, newLink);
            }
          }
          cb();
        }
        else {
          cb();
        }

      },

      userMentions: function(cb) {

        if (node.userMentions) {

          if (node.userMentions.length == 0) return(cb());

          var usNode, linkId, newLink;

          async.each(node.userMentions, function (usObj, cb2) {

            if (localNodeHashMap.has(usObj.nodeId)) {

              usNode = localNodeHashMap.get(usObj.nodeId);
              linkId = node.nodeId + "_" + usNode.nodeId;

              if (!localLinkHashMap.has(linkId)) {
                newLink = {
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: usNode,
                  sourceAndTarget: true
                }
                localLinkHashMap.set(linkId, newLink);
                self.addLink(newLink);
                usNode.age = 0;
                localNodeHashMap.set(usNode.nodeId, usNode);
              }
              else {
                newLink = localLinkHashMap.get(linkId);
                newLink.age = 0;
                localLinkHashMap.set(linkId, newLink);
              }
            }

            cb2();

          }, function () {
            return(cb());
          });
        }
        else {
          cb();
        }
      },

      hashtags: function(cb) {

        if (node.hashtags) {

          if (node.hashtags.length == 0) return(cb());

          var htNode, linkId, newLink;

          async.each(node.hashtags, function (htObj, cb2) {

            if (localNodeHashMap.has(htObj.nodeId)) {

              htNode = localNodeHashMap.get(htObj.nodeId);
              linkId = node.nodeId + "_" + htNode.nodeId;

              if (!localLinkHashMap.has(linkId)) {
                newLink = {
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: htNode,
                  sourceAndTarget: true
                }
                localLinkHashMap.set(linkId, newLink);
                self.addLink(newLink);
                htNode.age = 0;
                localNodeHashMap.set(htNode.nodeId, htNode);
              }
              else {
                newLink = localLinkHashMap.get(linkId);
                newLink.age = 0;
                localLinkHashMap.set(linkId, newLink);
              }
            }

            cb2();

          }, function () {
            return(cb());
          });
        }
        else {
          cb();
        }
      },

      media: function(cb) {

        if (node.media) {

          if (node.media.length == 0) return(cb());

          var meNode, linkId, newLink;

          async.each(node.media, function (meObj, cb2) {

            if (localNodeHashMap.has(meObj.nodeId)) {

              meNode = localNodeHashMap.get(meObj.nodeId);
              linkId = node.nodeId + "_" + meNode.nodeId;

              if (!localLinkHashMap.has(linkId)) {
                newLink = {
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: meNode,
                  sourceAndTarget: true
                }
                localLinkHashMap.set(linkId, newLink);
                self.addLink(newLink);
                meNode.age = 0;
                localNodeHashMap.set(meNode.nodeId, meNode);
              }
              else {
                newLink = localLinkHashMap.get(linkId);
                newLink.age = 0;
                localLinkHashMap.set(linkId, newLink);
              }
            }

            cb2();

          }, function () {
            return(cb());
          });
        }
        else {
          cb();
        }
      },

      urls: function(cb) {

        if (node.urls) {

          if (node.urls.length == 0) return(cb());

          var urlNode, linkId, newLink;

          async.each(node.urls, function (urlObj, cb2) {

            if (localNodeHashMap.has(urlObj.nodeId)) {

              urlNode = localNodeHashMap.get(urlObj.nodeId);
              linkId = node.nodeId + "_" + urlNode.nodeId;

              if (!localLinkHashMap.has(linkId)) {
                newLink = {
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: urlNode,
                  sourceAndTarget: true
                }
                localLinkHashMap.set(linkId, newLink);
                self.addLink(newLink);
                urlNode.age = 0;
                localNodeHashMap.set(urlNode.nodeId, urlNode);
              }
              else {
                newLink = localLinkHashMap.get(linkId);
                newLink.age = 0;
                localLinkHashMap.set(linkId, newLink);
              }
            }

            cb2();

          }, function () {
            return(cb());
          });
        }
        else {
          cb();
        }
      },

      place: function(cb) {

        if (node.place){

          if (localNodeHashMap.has(node.place.nodeId)) {

            var plNode = localNodeHashMap.get(node.place.nodeId);
            var linkId = node.nodeId + "_" + plNode.nodeId;

            if (!localLinkHashMap.has(linkId)) {
              var newLink = {
                linkId: linkId,
                age: 0,
                source: node,
                target: plNode,
                sourceAndTarget: true
              }
              localLinkHashMap.set(linkId, newLink);
              self.addLink(newLink);
              plNode.age = 0;
              localNodeHashMap.set(plNode.nodeId, plNode);
            }
            else {
              newLink = localLinkHashMap.get(linkId);
              newLink.age = 0;
              localLinkHashMap.set(linkId, newLink);
            }
          }
          cb();
        }
        else{
          cb();
        }
      }

    }, function(err, results) {
      callback();
    });
  }

  var createSessionLinksQueue = [];
  var createSessionLinksHashMap = new HashMap();
  var createSessionLinksInterval;
  var createSessionLinksReady = true;

  function initCreateSessionLinksInterval (interval){

    clearInterval(createSessionLinksInterval);
    createSessionLinksQueue = [];

    var node;

    createSessionLinksInterval = setInterval(function(){

      if (createSessionLinksReady && (createSessionLinksQueue.length > 0)) {

        createSessionLinksReady = false;

        node = createSessionLinksQueue.shift();

        createSessionLinks(node, function(){

          createSessionLinksHashMap.remove(node.nodeId);

          createSessionLinksReady = true;

        });

      }

    }, interval);

  }

  function createSessionLinks(node, callback){

    console.log("createSessionLinks\n" + jsonPrint(node));


    if (localNodeHashMap.has(node.sessionNodeId)) {

      var sNode = localNodeHashMap.get(node.sessionNodeId);

      console.debug("createSessionLinks sNode\n" + jsonPrint(sNode));

      var linkId = sNode.nodeId + "_" + node.nodeId;

      if (!localLinkHashMap.has(linkId)) {
        var newLink = {
          linkId: linkId,
          age: 0,
          source: sNode,
          target: node,
          sourceAndTarget: true
        }
        localLinkHashMap.set(linkId, newLink);
        self.addLink(newLink);
      }
      else {
        newLink = localLinkHashMap.get(linkId);
        newLink.age = 0;
        localLinkHashMap.set(linkId, newLink);
      }
    }

    callback();

  }

  var ageNodes = function (callback) {

    var deadNodeFlag = false ;

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
      return (callback(null, deadNodeFlag));
    } 
    else if ((nodes.length > MAX_NODES) && (nodeAddQ.length <= MAX_RX_QUEUE)) {
      ageRate = adjustedAgeRateScale(nodes.length - MAX_NODES);
    } 
    else if (nodeAddQ.length > MAX_RX_QUEUE) {
      ageRate = adjustedAgeRateScale(nodeAddQ.length - MAX_RX_QUEUE);
    } 
    else {
      ageRate = DEFAULT_AGE_RATE;
    }

    maxAgeRate = Math.max(ageRate, maxAgeRate);

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;
    var nodeObj;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      if (localNodeHashMap.has(node.nodeId)){
        nodeObj = localNodeHashMap.get(node.nodeId);
        if (nodeObj.newFlag) {
          node.age = 1e-6;
          node.ageUpdated = moment().valueOf();
          node.isDead = false;
          node.newFlag = false;
          localNodeHashMap.set(node.nodeId, node);
        }
      }

      age = node.age + randomIntFromInterval(10,100) + (ageRate * (moment().valueOf() - node.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
        node.ageMaxRatio = 1.0;
        deadNodeFlag = true;
        localNodeHashMap.set(node.nodeId, node);
      } 
      else if (age >= nodeMaxAge) {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = 1.0;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
        deadNodeFlag = true;
        localNodeHashMap.set(node.nodeId, node);
      } 
      else {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.isDead = false;
        nodes[ageNodesIndex] = node;
        localNodeHashMap.set(node.nodeId, node);

        // if ((node.nodeType == "tweet") && (!createTweetLinksHashMap.has(node.nodeId))) {
        if (node.nodeType == "tweet") {
          createTweetLinksQueue.push(node);
          // createTweetLinksHashMap.set(node.nodeId, node);
          // console.warn("createTweetLinksQueue: " + createTweetLinksQueue.length);
        }
        if (node.nodeType == "word"){
          var sessionLinkId = node.sessionId + "_" + node.nodeId;
          if (!createSessionLinksHashMap.has(sessionLinkId)) {
            createSessionLinksQueue.push(node);
            createSessionLinksHashMap.set(sessionLinkId, node);
            console.warn("createSessionLinksQueue: " + sessionLinkId);
          }
        }
      }
    }

    if (ageNodesIndex < 0) {
      callback(null, deadNodeFlag);
    }
  }

  var ageLinks = function(callback) {

    var deadLinksFlag = false;

    if (self.disableLinks)  return (callback(null, deadLinksFlag));

    // console.debug("ageLinks");

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;

    var currentLinkObject = {};

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

      currentLinkObject = links[ageLinksIndex];

      // console.debug("currentLinkObject"
      //   + " | " + currentLinkObject.linkId
      //   // + " \n" + jsonPrint(currentLinkObject)
      // );

      if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'X';
        deadLinksFlag = true;
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.source.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'X SOURCE';
        deadLinksFlag = true;
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.target.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'X TARGET';
        deadLinksFlag = true;
      } else if ((currentLinkObject.source.nodeId !== 'anchor') && !localNodeHashMap.has(currentLinkObject.source.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'NO SOURCE';
      } else if (!localNodeHashMap.has(currentLinkObject.target.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'NO TARGET';
      } else {
        if (currentLinkObject.source.age > currentLinkObject.target.age) {
          currentLinkObject.age = currentLinkObject.source.age;
          currentLinkObject.ageMaxRatio = currentLinkObject.source.ageMaxRatio;
          links[ageLinksIndex] = currentLinkObject;
        } else {
          currentLinkObject.age = currentLinkObject.target.age;
          currentLinkObject.ageMaxRatio = currentLinkObject.target.ageMaxRatio;
          links[ageLinksIndex] = currentLinkObject;
        }
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      callback(null, deadLinksFlag);
    }
  }

  var processDeadNodesHash = function (callback) {

    var deadNodeFlag = false;

    if (Object.keys(deadNodesHash).length == 0) {
      return (callback(null, deadNodeFlag));
    }

    var deadNodeIds = Object.keys(deadNodesHash);

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if (deadNodesHash[node.nodeId]) {
        nodeDeleteQ.push({op:'delete', nodeId: node.nodeId});
        nodeDeleteQueue.push(node.nodeId);
        deadNodeFlag = true;
        delete deadNodesHash[node.nodeId];
        localNodeHashMap.remove(node.nodeId);
      }
      deadNodeIds = Object.keys(deadNodesHash);
    }

    if ((nodes.length == 0) || (deadNodeIds.length == 0) || (ageNodesIndex < 0)) {
      return (callback(null, deadNodeFlag));
    }
  }

  var processDeadLinksHash = function(callback) {

    if (self.disableLinks){
      if (links.length > 0) {
        links = [];
        return (callback());
      }
      return (callback());
    }

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;
    var link;

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {
      link = links[ageLinksIndex];
      if (deadLinksHash[link.linkId]) {
        linkDeleteQueue.push(link.linkId);
        links.splice(ageLinksIndex, 1);
        // console.debug("X L [ " + links.length  + " | " + Object.keys(deadLinksHash).length + " ] " + link.linkId + " | " + deadLinksHash[link.linkId]);
        delete deadLinksHash[link.linkId];
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      return (callback(null));
    }
  }

  var updateLinks = function(callback) {

    link = linkSvgGroup.selectAll("line").data(links, 
      function(d) { 
        if (d.sourceAndTarget) {
          return d.source.nodeId + "-" + d.target.nodeId; 
        }
        else {
          console.error("UNDEFINED SRC OR TRG: " + d.source.nodeId + "-" + d.target.nodeId);
        }
      });

    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style('stroke', function(d) {
        // if ((d.source.age < nodeNewAge) && (d.target.age < nodeNewAge)) return palette.white;
        // if ((d.source.nodeType == 'tweet') && (d.target.nodeType == 'tweet')) return palette.blue;
        if (d.ageMaxRatio < newAgeRatio) return palette.white;
        return "aaaaaa";
      })
      // .style('stroke-width', function(d) {
      //   // if ((d.source.age <= nodeNewAge) && (d.target.age <= nodeNewAge)) return 4.5;
      //   // if (d.ageMaxRatio < newAgeRatio) return 1.5;
      //   if ((d.source.nodeType == 'tweet') && (d.target.nodeType == 'tweet')) return 1.5;
      //   return 1.0;
      // })
      .style('opacity', function(d){
        // if ((d.source.age <= nodeNewAge) && (d.target.age <= nodeNewAge)) return 1.0;
        if (d.ageMaxRatio < newAgeRatio) return 1.0;
        return linkOpacityScale(d.ageMaxRatio);
      });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .style("visibility", "visible")
      .style('stroke', palette.white )
      .style('stroke-width', 1.0)
      .style('opacity', 1);

    link
      .exit()
      .remove();

    callback();
  }

  var updateNodeCircles = function(callback) {

    nodeCircles = nodeSvgGroup.selectAll("circle")
      .data(nodes.filter(function(d){
        return (
          (d.nodeType == 'group') 
          || (d.nodeType == 'session') 
          || (d.nodeType == 'word') 
          || (d.nodeType == 'tweet') 
          || (d.nodeType == 'hashtag') 
          || (d.nodeType == 'url') 
          || (d.nodeType == 'place')
          ); 
      }));

    nodeCircles
      .enter()
      .append("svg:circle")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .style("fill", palette.white)
      .merge(nodeCircles)
      .attr("r", function(d) {
        if (d.isIgnored) {
          return defaultRadiusScale(1);
        }
        else if (typeof d.mentions === 'undefined') {
          console.debug(d.nodeId + " | NODE CIRCLE d.mentions UNDEFINED");
          return defaultRadiusScale(1);
        }
        else {
          return defaultRadiusScale(parseInt(d.mentions) + 1.0);
        }
      })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.newFlag) { return palette.white; }
        if (d.age < nodeNewAge) { return palette.white; }
        // if (d.nodeType == 'tweet') { 
        //   if (d.isRetweet) return palette.pink;
        //   return palette.red; 
        // }
        // if (d.nodeType == 'group') { return palette.green; }
        // if (d.nodeType == 'sesion') { return palette.purple; }
        // if (d.nodeType == 'word') { return palette.yellow; }
        // if (d.nodeType == 'hashtag') { return palette.blue; }
        // if (d.nodeType == 'url') { return palette.green; }
        // if (d.nodeType == 'place') { return palette.purple; }
        return palette.black; 
      })
      .style('stroke', function(d) {
        if (d.age < nodeNewAge) return palette.white;
        return "aaaaaa";
      })
      .style('stroke-width', function(d) {
        if (d.age < nodeNewAge) return 3.5;
        return 2.5;
      })
      .style('stroke-opacity', function(d) {
        if (hideNodeCirclesFlag) return 1e-6;
        if (d.mouseHoverFlag) return 1.0;
        return nodeCircleOpacityScale(d.ageMaxRatio);
      });

    nodeCircles
      .exit()
      .remove();

    callback();
  }

  var updateNodeImages = function(callback) {

    var nodeImages = nodeSvgGroup.selectAll("image")
      .data(nodes, function(d){
        // if ((d.nodeType == "user") || (d.nodeType == "media")) return d.nodeId;
        // return null;
        return d.nodeId;
      });

    nodeImages
      .enter()
      .append("svg:image")
      .attr("href", function(d) { 
        if (d.nodeType == "image") return d.url;
        if (d.nodeType == "user") return d.profileImageUrl;
        return null; 
      })
      .attr("class", "nodeImage")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .style("visibility", function(d) {
        if ((d.nodeType == "media") || (d.nodeType == "user")) return "visible";
        return "hidden";
      })
      .merge(nodeImages)
      // .attr("href", function(d) { 
      //   if (d.nodeType == "image") return d.url;
      //   if (d.nodeType == "user") return d.profileImageUrl;
      //   return null; 
      // })
      // .style("filter", function(d) {
      //   if (d.nodeType == "media") return "url(#borderMedia)";
      //   if (d.nodeType == "user") return "url(#borderUser)";
      //   return "url(#border)";
      // })
      .attr("x", function(d) { return d.x - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0)); })
      .attr("y", function(d) { return d.y - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0)); })
      .attr("width", function(d){ 
        if ((d.nodeType != "media") && (d.nodeType != "user")) return 0;
        return imageSizeScale(parseInt(d.mentions) + 1.0); 
      })
      .attr("height", function(d){ 
        if ((d.nodeType != "media") && (d.nodeType != "user")) return 0;
        return imageSizeScale(parseInt(d.mentions) + 1.0); 
      })
      .style('opacity', function(d) {
        // if (!d.imageLoaded) return 0.5;
        if ((d.nodeType != "media") && (d.nodeType != "user")) return 0;
        if (d.mouseHoverFlag) return 1.0;
        return nodeImageOpacityScale(d.ageMaxRatio);
      });

    nodeImages
      .exit()
      .remove();

    callback();
  }

  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text")
      .data(nodes.filter(function(d){
        return (
          (d.nodeType == 'hashtag') 
          || (d.nodeType == 'place')
          || (d.nodeType == 'session')
          || (d.nodeType == 'group')
          || (d.nodeType == 'word')
          ); 
      }));

    nodeLabels
      .enter()
      .append("svg:text")
      .style("text-anchor", "middle")
      .style("alignment-baseline", "bottom")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .merge(nodeLabels)
      .text(function(d) {
        if (d.nodeType == 'group') return d.name;
        if (d.nodeType == 'session') return d.entity.toUpperCase();
        if (d.nodeType == 'word') return d.text;
        if (d.nodeType == 'hashtag') return d.nodeId;
        if (d.nodeType == 'place') return d.fullName;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { 
        return d.y - 1.5 * (defaultRadiusScale(d.mentions + 1));
      })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return nodeLabelOpacityScale(d.ageMaxRatio); 
      })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        return palette.white; 
      })
      .style("font-size", function(d) {
        return (nodeFontSizeScale(d.mentions + 1));
      });

    nodeLabels
      .exit().remove();

    callback();
  }

  function ticked() {
    drawSimulation(function(){
      updateSimulation(function(){});
    });
  }

  function drawSimulation(callback){

    async.parallel(
      {
        udl: updateLinks,
        udnc: updateNodeCircles,
        udni: updateNodeImages,
        udnl: updateNodeLabels
      },

      function(err, results) {
        if (err) {
          console.error("*** ERROR: drawSimulation *** \nERROR: " + err);
          return(callback(err));
        }
        else {
          callback();
        }
      }

    );
  }

  function updateSimulation(callback) {

    async.series(
      {
        deleteNode: processNodeDeleteQ,
        addNode: processNodeAddQ,
        link: processLinkUpdateQ,
        ageNode: ageNodes,
        ageLinks: ageLinks,
        deadNode: processDeadNodesHash,
        deadLink: processDeadLinksHash
      },

      function(err, results) {


        simulation.nodes(nodes);
        if (typeof callback !== 'undefined') callback();


        // if (err) {
        //   console.error("*** ERROR: updateSimulation *** \nERROR: " + err);
        //   callback(err);
        // }
        // else if (results) {
        //       simulation.nodes(nodes);
        //       if (typeof callback !== 'undefined') return(callback());

        //   // var keys = Object.keys(results);

        //   // for (var i=0; i<keys.length; i++){
        //   //   if (results[keys[i]]) {
        //   //     // simulation.nodes(nodes);
        //   //     // if (runningFlag) self.simulationControl('RESTART');
        //   //     // if (typeof callback !== 'undefined') return(callback());
        //   //     break;
        //   //   }
        //   // }
        // }
        // else {
        //   if (typeof callback !== 'undefined') callback();
        // }
      }

    );
  }

  // ===================================================================

  function nodeMouseOver(d) {

    mouseHoverFlag = true;
    d.mouseHoverFlag = true;
    mouseHoverNodeId = d.nodeId;

    d.fx = d.x;
    d.fy = d.y;

    self.toolTipVisibility(true);

    var tooltipString;

    switch (d.nodeType) {
      case 'tweet':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>MENTIONS: " + d.mentions 
          + "<br>@" + d.user.screenName
          + "<br>" + d.user.name;
      break;
      case 'user':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>" + d.name
          + "<br>@" + d.screenName
          + "<br>Ms: " + d.mentions;
      break;
      case 'media':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>URL: " + d.url;
      break;
      case 'hashtag':
        tooltipString = "#" + d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions;
      break;
      case 'url':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>URL: " + d.url;
      break;
      case 'place':
        tooltipString = d.nodeId
          + "<br>TYPE: " + d.nodeType 
          + "<br>Ms: " + d.mentions
          + "<br>URL: " + d.fullName;
      break;
    }

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");

    updateNodeLabels(function(){});
  }

  function nodeMouseOut(d) {
    mouseHoverFlag = false;
    d.mouseHoverFlag = false;
    mouseHoverNodeId = false;
    self.toolTipVisibility(false);
  }

  function nodeClick(d) {

    var url = "";

    switch (d.nodeType) {
      case "tweet" :
        console.warn("OPEN TWEET URL: " + d.url);
        window.open(d.url, '_blank');
      break;

      case "user" :
        console.warn("OPEN USER URL: " + d.profileUrl);
        window.open(d.profileUrl, '_blank');
      break;

      case "hashtag" :
        url = "https://twitter.com/search?f=realtime&q=%23" + d.text ;
        window.open(url, '_blank');
      break;

      case "place" :
        url = d.sourceUrl ;
        window.open(url, '_blank');
      break;

      case "url" :
        url = d.expandedUrl ;
        window.open(url, '_blank');
      break;

      case "media" :
        url = d.sourceUrl ;
        window.open(url, '_blank');
      break;

      default:
      break;
    }
  }

  this.addNode = function(nNode) {

    // console.debug("N> " + nNode.nodeId + " | " + nNode.nodeType);

    if ((nNode.nodeType == "session")|| (nNode.nodeType == "group")|| (nNode.nodeType == "word")) return;

    var newNode = nNode;
    newNode.newFlag = true;


    // console.debug("N> " + newNode.nodeId 
    //   + " | " + newNode.nodeId
    //   // + "\n" + jsonPrint(newNode)
    // );

    if ((newNode.nodeType == "tweet") || (nodeAddQ.length < MAX_RX_QUEUE)) {
      nodeAddQ.push({op:'add', node: newNode});
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  }

  this.addGroup = function(nNode) {

    var newNode = nNode;
    newNode.newFlag = true;

      console.debug("N> " + newNode.nodeId + " | " + newNode.nodeType);

    if (nodeAddQ.length < MAX_RX_QUEUE) nodeAddQ.push({op:'add', node: newNode});

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  }

  var localSessionHashMap = {};
  this.addSession = function(sess) {

    // var newNode = sess.node;
    // newNode.newFlag = true;

    // console.debug("N> " + newNode.nodeId 
    //   + " | " + newNode.nodeType
    //   + "\n" + jsonPrint(newNode)
    // );

    // if (nodeAddQ.length < MAX_RX_QUEUE) {
    //   nodeAddQ.push({op:'add', node: newNode});
    //   if (!localSessionHashMap[sess.sessionId]) localSessionHashMap[sess.sessionId] = {};
    //   localSessionHashMap[sess.sessionId][newNode.nodeId] = 1;
    // }

    // if (nodeAddQ.length > maxNodeAddQ) {
    //   maxNodeAddQ = nodeAddQ.length;
    //   console.info("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    // }
  }

  this.deleteNode = function(nodeId) {
    nodeDeleteQ.push({op:'delete', nodeId: nodeId});
  }

  this.addLink = function(newLink) {
    if (self.disableLinks)  return ;
    // console.debug("+ L | " + newLink.linkId);
    linkUpdateQ.push({op:'add', link: newLink});
  }

  this.deleteLink = function(linkId) {
    linkUpdateQ.push({op:'delete', linkId: linkId});
  }

  this.initD3timer = function() {

    initCreateTweetLinksInterval(20);
    initCreateSessionLinksInterval(20);

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.linkId; })
        .distance(function(d){
          return globalLinkDistance; 
        })
        .strength(function(d){
        return 0.5*globalLinkStrength; 
      }))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX().x(function(d) { 
        return 0.5*width; 
      }).strength(function(d){
        return 1*gravity; 
      }))
      .force("forceY", d3.forceY().y(function(d) { 
        return 0.4*height; 
      }).strength(function(d){
        return forceYmultiplier * gravity; 
      }))
      .force("collide", d3.forceCollide().radius(function(d) { 
          return collisionRadiusMultiplier * defaultRadiusScale(d.mentions + 1.0) ; 
        }).iterations(collisionIterations))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);

      // d3.forceCenter([0.5*width, 0.5*height]);
  }

  this.simulationControl = function(op) {
    switch (op) {
      case 'RESET':
        console.debug("SIMULATION CONTROL | OP: " + op);
        self.reset();
        runningFlag = false;
      break;
      case 'START':
        console.debug("SIMULATION CONTROL | OP: " + op);
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case 'RESUME':
        console.debug("SIMULATION CONTROL | OP: " + op);
        // self.initD3timer();
        runningFlag = true;
        simulation.alphaTarget(0.7).restart();
      break;
      case 'FREEZE':
        console.debug("SIMULATION CONTROL | OP: " + op);
        if (!freezeFlag){
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
      break;
      case 'PAUSE':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'STOP':
        console.debug("SIMULATION CONTROL | OP: " + op);
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'RESTART':
        // console.debug("SIMULATION CONTROL | OP: " + op);
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      default:
        console.error("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
      break;
    }
  }

  this.resize = function() {
    console.info("RESIZE");

    d3image = d3.select("#d3group");

    if (window.innerWidth !== 'undefined') {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== 'undefined' 
      && document.documentElement.clientWidth !== 'undefined' 
      && document.documentElement.clientWidth !== 0) {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      width = document.getElementsByTagName('body')[0].clientWidth;
      height = document.getElementsByTagName('body')[0].clientHeight;
    }

    console.log("width: " + width + " | height: " + height);

    d3LayoutWidth = width; // double the width for now
    d3LayoutHeight = height;

    svgForceLayoutArea
      .attr("width", width)
      .attr("height", height)
      .attr("viewbox", 1e-6, 1e-6, width, height)
      .attr("x", 1e-6)
      .attr("y", 1e-6);

    if (simulation){
      simulation.force("forceX", d3.forceX().x(function(d) { 
          return 0.5*width; 
        }).strength(function(d){
          return 1*gravity; 
        }));

      simulation.force("forceY", d3.forceY().y(function(d) { 
          return 0.4*height; 
        }).strength(function(d){
          return forceYmultiplier * gravity; 
        }));
    }
  }

  // ==========================================
  var testAddNodeInterval;

  this.deleteRandomNode = function() {
    if (nodes.length == 0) return;
    if ((nodes.length < 5) && (randomIntFromInterval(0, 100) < 80)) return;
    if (randomIntFromInterval(0, 100) < 5) return;
    var index = randomIntFromInterval(0, nodes.length - 1);
    var node = nodes[index];
    self.deleteNode(node.nodeId);
  }

  this.addRandomNode = function() {

    var randomNumber360 = randomIntFromInterval(0, 360);
    var randomNumber256 = randomIntFromInterval(0, 256);

    var userId = 'user_' + randomNumber360;
    var nodeId = 'testNode' + tickNumber;
    var mentions = randomIntFromInterval(0, 1000000);
    var wordChainIndex = tickNumber;
    var text = randomNumber360 + ' | ' + mentions;

    var startColor = "black";
    var endColor = "white";

    var interpolateNodeColor = d3.interpolateRgb(startColor, endColor);

    var newNode = {
      nodeId: nodeId,
      userId: userId,
      text: text,
      mentions: mentions,
      wordChainIndex: wordChainIndex,
      startColor: startColor,
      endColor: endColor,
      interpolateNodeColor: interpolateNodeColor,
      r: 100,
      x: 0.5 * window.innerWidth + randomIntFromInterval(0, 100),
      y: 0.5 * window.innerHeight + randomIntFromInterval(0, 100),
      age: 0,
      lastSeen: moment().valueOf(),
    }

    newNode.links = {};

    self.addNode(newNode);
  }

  this.addRandomLink = function() {

    if (nodes.length < 2) {
      return;
    }

    var linkId = 'testLink' + tickNumber;

    var sourceNodeIndex = randomIntFromInterval(0, nodes.length - 1);
    var targetNodeIndex = randomIntFromInterval(0, nodes.length - 1);

    while (sourceNodeIndex == targetNodeIndex) {
      sourceNodeIndex = randomIntFromInterval(0, nodes.length - 1);
      targetNodeIndex = randomIntFromInterval(0, nodes.length - 1);
    }

    var sourceNode = nodes[sourceNodeIndex];
    var targetNode = nodes[targetNodeIndex];

    var newLink = {
      linkId: linkId,
      age: 0,
      source: {},
      target: {}
    }

    sourceNode.links[linkId] = 1;
    targetNode.links[linkId] = 1;

    newLink.source = sourceNode;
    newLink.target = targetNode;

    nodes[sourceNodeIndex] = sourceNode;
    nodes[targetNodeIndex] = targetNode;

    self.addLink(newLink);
  }

  this.clearTestAddNodeInterval = function() {
    clearInterval(testAddNodeInterval);
  }

  this.initTestAddNodeInterval = function(interval) {
    clearInterval(testAddNodeInterval);
    testAddNodeInterval = setInterval(function() {
      self.addRandomNode();
    }, interval);
  }

  var testAddLinkInterval;

  this.clearTestAddLinkInterval = function() {
    clearInterval(testAddLinkInterval);
  }

  this.initTestAddLinkInterval = function(interval) {
    clearInterval(testAddLinkInterval);
    testAddLinkInterval = setInterval(function() {
      if (nodes.length > 1) {
        self.addRandomLink();
      }
    }, interval);
  }

  var testDeleteNodeInterval;

  this.clearTestDeleteNodeInterval = function() {
    clearInterval(testDeleteNodeInterval);
  }

  this.initTestDeleteNodeInterval = function(interval) {
    clearInterval(testDeleteNodeInterval);
    testDeleteNodeInterval = setInterval(function() {
      self.deleteRandomNode();
    }, interval);
  }

  document.addEventListener("resize", function() {
    self.resize();
  }, true);

  self.reset = function() {
    console.info("RESET");

    updateNodeFlag = false;

    nodes = [];
    links = [];

    deadNodesHash = {};
    deadLinksHash = {};
    mouseMovingFlag = false;
    mouseHoverFlag = false;
    mouseHoverNodeId = false;
    self.toolTipVisibility(false);

    self.resize();
    self.resetDefaultForce();
  }
}