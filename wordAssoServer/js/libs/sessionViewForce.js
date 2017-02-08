/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewForce() {

  var newAgeRatio = 0.01;
  var nodeNewAge = 700;

  var disableLinks = false;
  var hideNodeCirclesFlag = false;
  var hideNodeImagesFlag = false;

  var sPosHashMap = {};

  var localNodeHashMap = new HashMap();
  var localLinkHashMap = new HashMap();

  var MAX_NODES = 70;
  var processNodeCount = 0;
  var processNodeModulus = 3;

  var maxNodeAddQ = 0;

  var self = this;
  var simulation;

  var showStatsFlag = false;
  var fixedGroupsFlag = false;

  var runningFlag = false;
  var updateNodeFlag = false;
  var antonymFlag = false;
  
  var groupCircleVisibility = "visible";

  var groupUpdateQ = [];
  var sessionUpdateQ = [];
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
  var defaultTimePeriodFormat = "HH:mm:ss";

  var minSessionNodeOpacity = 0.2;

  var mouseFreezeEnabled = true;
  var mouseHoverFlag = false;
  var mouseOverRadius = 10;
  var mouseHoverGroupId = false;
  var mouseHoverSessionId = false;
  var mouseHoverNodeId = false;

  var nodeMaxAge = 60000;

  var DEFAULT_CONFIG = {'nodeMaxAge': window.DEFAULT_MAX_AGE};
  var config = DEFAULT_CONFIG;
  var previousConfig = [];

  var defaultFadeDuration = 250;

  var DEFAULT_FLOW_CONFIG = {
    'blahMode': DEFAULT_BLAH_MODE,
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

  var minFontSize = 10;
  var maxFontSize = 40;

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


  var adjustedAgeRateScale = d3.scaleLinear().domain([1, 200]).range([1.0, 20.0]).clamp(true);

  var sessionFontSizeScale = d3.scaleLinear().domain([1, 10000000]).range([16.0, 24]).clamp(true);
  var nodeFontSizeScale = d3.scaleLinear().domain([1, currentHashtagMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);

  var groupCircleRadiusScale = d3.scaleLog().domain([1, 10000000]).range([10.0, 50.0]).clamp(true); // uses wordChainIndex
  var sessionCircleRadiusScale = d3.scaleLog().domain([1, 1000000]).range([15.0, 50.0]).clamp(true); // uses wordChainIndex
  var imageSizeScale = d3.scaleLog().domain([1, 10000000]).range([20.0, 60.0]).clamp(true);
  var defaultRadiusScale = d3.scaleLog().domain([1, 10000000]).range([10, 40]).clamp(true);

  var fillColorScale = d3.scaleLinear().domain([1e-6, 0.1, 1.0]).range([palette.gray, palette.darkgray, palette.black]);
  var strokeColorScale = d3.scaleLog().domain([1e-6, 0.15, 1.0]).range([palette.white, palette.darkgray, palette.black]);
  var linkColorScale = d3.scaleLinear().domain([1e-6, 0.5, 1.0]).range(["#000000", "#000000", "#000000"]);

  var sessionOpacityScale = d3.scaleLinear().domain([1e-6, 1.0]).range([1.0, 1e-6]);
  var fontScale = d3.scaleLinear().domain([1e-6, 1.0]).range([0.5, 1.0]);

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

  var groups = [];
  var sessions = [];
  var nodes = [];
  var links = [];

  this.getGroupsLength = function() {
    return groups.length;
  }
  
  this.getSessionsLength = function() {
    return sessions.length;
  }
  
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

  this.getSession = function(index) {
    return sessions[index];
  }

  var maxNumberSessions = 0;
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
    .attr("preserveAspectRatio", "none")
    .attr("x", 1e-6)
    .attr("y", 1e-6);

  var linkSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

  var groupSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "groupSvgGroup");
  var groupLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  var groupGnode = groupSvgGroup.selectAll("g.group");
  var groupCircles = groupSvgGroup.selectAll("circle");

  var nodeSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var nodeGs = nodeSvgGroup.selectAll("g.node");
  var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");
  var nodeImages = nodeSvgGroup.selectAll("image");

  var sessionLabelSvgGroup = svgForceLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
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

  self.setBlah = function(value){
    blahMode = value;
    console.log("BLAH: " + value);
  }

  self.setAntonym = function(ant){
    antonymFlag = ant;
    console.error("ANTONYM: " + antonymFlag);
    if (antonymFlag){
    }
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
            if (d.isSessionNode) return 0.1*globalLinkDistance;
            return globalLinkDistance; 
          })
          .strength(function(d){
          if (d.isSessionNode) return 10.0*globalLinkStrength;
          return 0.5*globalLinkStrength; 
        }))
      break;
      case "linkDistance" :
        globalLinkDistance = value;
        simulation.force("link", d3.forceLink(links)
          .distance(function(d){
            if (d.isSessionNode) return 0.1*globalLinkDistance;
            return globalLinkDistance; 
          })
          .strength(function(d){
          if (d.isSessionNode) return 10.0*globalLinkStrength;
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
        if (d.isSessionNode) return 0.1*globalLinkDistance;
        return globalLinkDistance; 
      })
      .strength(function(d){
      if (d.isSessionNode) return 10.0*globalLinkStrength;
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
        if (d.isSessionNode) return 0.1*globalLinkDistance;
        return globalLinkDistance; 
      })
      .strength(function(d){
      if (d.isSessionNode) return 10.0*globalLinkStrength;
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
        if (d.isSessionNode) return 0.7*width;
        return 0.5*width; 
      }).strength(function(d){
        if (d.isSessionNode) return 1.0*gravity;
        return 1*gravity; 
      }));

    simulation.force("forceY", d3.forceY().y(function(d) { 
        return 0.4*height; 
      }).strength(function(d){
        if (d.isSessionNode) return gravity;
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

  function deleteGroupQ(groupId, callback){
    var deletedGroup;
    var deadGroupFlag = false;

    var groupsLength = groups.length - 1;
    var groupIndex = groups.length - 1;

    for (groupIndex = groupsLength; groupIndex >= 0; groupIndex -= 1) {

      deletedGroup = groups[groupIndex];

      if (deletedGroup.groupId == groupId) {

        deadGroupFlag = true;

        var linksLength = links.length - 1;
        var linkIndex = links.length - 1;

        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          if (link.groupId == groupId) {
            deadLinksHash[link.linkId] = 1;
          }
        }

        if (linkIndex < 0) {
          console.log("X GRP " + deletedGroup.node.nodeId);
          deadGroupFlag = true;
          nodeDeleteQ.push({op:'delete', nodeId: deletedGroup.node.nodeId});
          groups.splice(groupIndex, 1);
          return(callback(null, deadGroupFlag));
        }
      }
    }
    if ((groupIndex < 0) && (linkIndex < 0)) {
      return(callback(null, deadGroupFlag));
    }
  }

  function deleteSessionQ(sessionId, callback){
    var deletedSession;
    var deadSessionFlag = false;

    var sessionsLength = sessions.length - 1;
    var sessionIndex = sessions.length - 1;

    for (sessionIndex = sessionsLength; sessionIndex >= 0; sessionIndex -= 1) {

      deletedSession = sessions[sessionIndex];

      if (deletedSession.sessionId == sessionId) {

        deadSessionFlag = true;

        var linksLength = links.length - 1;
        var linkIndex = links.length - 1;

        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          if (link.sessionId == sessionId) {
            deadLinksHash[link.linkId] = 1;
          }
        }

        if (linkIndex < 0) {
          // console.log("X SES " + deletedSession.node.nodeId);
          deadSessionFlag = true;
          nodeDeleteQ.push({op:'delete', nodeId: deletedSession.node.nodeId});
          sessions.splice(sessionIndex, 1);
          return(callback(null, deadSessionFlag));
        }
      }
    }
    if ((sessionIndex < 0) && (linkIndex < 0)) {
      return(callback(null, deadSessionFlag));
    }
  }

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

        if (node.isSessionNode) {
          sessionUpdateQ.push({op:'delete', sessionId: node.sessionId});
        }

        for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
          var link = links[linkIndex];
          var linkId = link.linkId;
          if (node.links[linkId]) {
          }
        }

        if (linkIndex < 0) {
          nodes.splice(nodeIndex, 1);
          deadNodeFlag = true;
          // console.warn("XXX NODE " + nodeId);
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

  var processGroupUpdateQ = function(callback) {
    if (!runningFlag) {
      callback(null, false);
    }
    else {
      var groupsModifiedFlag = false;
      while (groupUpdateQ.length > 0){
        var groupUpdateObj = groupUpdateQ.shift();
        switch (groupUpdateObj.op) {
          case "add":
            groupsModifiedFlag = true;
            if (typeof groupUpdateObj.group.node.x === 'undefined') groupUpdateObj.group.node.x = 100;
            if (typeof groupUpdateObj.group.node.y === 'undefined') groupUpdateObj.group.node.y = 100;
            if (fixedGroupsFlag || groupUpdateObj.group.node.fixed) {
              groupUpdateObj.group.node.fx = groupUpdateObj.group.node.x;
              // groupUpdateObj.group.node.fy = groupUpdateObj.group.node.y;
            }
            else {
              groupUpdateObj.group.node.fx = null;
            }
            // console.log("ADD GROUP | " + groupUpdateObj.group.groupId);
            groups.push(groupUpdateObj.group);
          break;
          case "delete":
            // console.warn("DEL GROUP | " + groupUpdateObj.groupId);
            deleteGroupQ(groupUpdateObj.groupId, function(err, deadGroupFlag){
              if (deadGroupFlag) groupsModifiedFlag = true;
            });
          break;
        }
      }
      if (groupUpdateQ.length == 0){
        callback(null, groupsModifiedFlag);
      }
    }
  }

  var processSessionUpdateQ = function(callback) {
    var sessionsModifiedFlag = false;
    while (sessionUpdateQ.length > 0){
      var sessionUpdateObj = sessionUpdateQ.shift();
      switch (sessionUpdateObj.op) {
        case "add":
          sessionsModifiedFlag = true;
          console.debug("ADD SESSION"
            + " | " + sessionUpdateObj.session.sessionId
            + " | x " + sessionUpdateObj.session.x
            + " y " + sessionUpdateObj.session.y
          );
          sessionUpdateObj.session.fx = sessionUpdateObj.session.x;
          sessions.push(sessionUpdateObj.session);
        break;
        case "delete":
          deleteSessionQ(sessionUpdateObj.sessionId, function(err, deadSessionFlag){
            if (deadSessionFlag) sessionsModifiedFlag = true;
          });
        break;
      }
    }
    if (sessionUpdateQ.length == 0){
      callback(null, sessionsModifiedFlag);
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
    else if ((nodes.length < 2*MAX_NODES) && (processNodeCount % processNodeModulus != 0)) {
      // console.debug("processNodeCount MAX_NODES MOD"
      //   + " | Ns: "  + nodes.length
      //   + " | NQ: "  + nodeAddQ.length
      //   + " | PNC: "  + processNodeCount
      // );
      return true;
    }
    else if ((nodes.length < 3*MAX_NODES) && (processNodeCount % processNodeModulus == 0)) {
      // console.debug("processNodeCount MAX_NODES MOD 2"
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

    // processNodeCount++;

    var nodesModifiedFlag = false;

    while ((nodeAddQ.length > 0) && addNodeEnabled()) {

      processNodeCount++;

      var nodeAddObj = nodeAddQ.shift();

      var newNode = nodeAddObj.node;

      var currentNode = {};


      switch (nodeAddObj.op) {

        case "add":

          if (localNodeHashMap.has(newNode.nodeId)){
            // console.error("localNodeHashMap HIT: " + newNode.nodeId);
            currentNode = localNodeHashMap.get(newNode.nodeId);
            currentNode.newFlag = true;
            currentNode.age = 0;
          }
          else {
            // console.error("localNodeHashMap MISS: " + newNode.nodeId);
            currentNode = newNode;
            currentNode.x = randomIntFromInterval(0.1 * width, 0.15 * width);
            currentNode.y = randomIntFromInterval(0.3 * height, 0.7 * height);
            if (newNode.nodeType == "tweet"){
            }
          }

          nodesModifiedFlag = true;
          currentNode.mentions = newNode.mentions;
          currentNode.ageUpdated = moment().valueOf();

          if ((newNode.nodeType == "hashtag") && (newNode.mentions > currentHashtagMaxMentions)){

            currentHashtagMaxMentions = newNode.mentions;

            nodeFontSizeScale = d3.scaleLinear().domain([1, currentHashtagMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);

            console.info("NEW MAX Ms" 
              + " | " + currentNode.text 
              + " | I: " + currentNode.isIgnored 
              + " | Ms " + currentHashtagMaxMentions 
              + " | K: " + currentNode.isKeyword 
              + " | KWs: " + jsonPrint(currentNode.keywords) 
            );
          }

          nodes.push(currentNode);
          localNodeHashMap.set(currentNode.nodeId, currentNode);

          if (nodes.length > maxNumberNodes) {
            // console.info("MAX NODES: " + maxNumberNodes);
            maxNumberNodes = nodes.length;
          }

          // callback(null, nodesModifiedFlag);

        break;

        default:
          console.error("??? UNKNOWN NODE UPDATE Q OP: " + nodeAddObj.op);
          // callback(null, nodesModifiedFlag);
        break;
      }
    }
    // else {
    //   callback(null, nodesModifiedFlag);
    // }

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

    // while ((linkUpdateQ.length > 0) && addNodeEnabled()) {
    while (linkUpdateQ.length > 0) {

      linkUpdateObj = linkUpdateQ.shift();

      switch (linkUpdateObj.op) {
        case "add":
          linksModifiedFlag = true;
          links.push(linkUpdateObj.link);
          // localLinkHashMap.set(linkUpdateObj.link, linkUpdateObj);
          // console.debug("+ L " + linkUpdateObj.link.source.nodeId + " > " + linkUpdateObj.link.target.nodeId);
          // callback(null, linksModifiedFlag);
        break;
        case "delete":
          deleteLinkQ(linkUpdateObj.linkId, function(err, deadLinkFlag){
            localLinkHashMap.remove(linkUpdateObj.link);
            if (deadLinkFlag) linksModifiedFlag = true;
            // callback(null, linksModifiedFlag);
          });
        break;
        default:
          console.error("UNKNOWN LINK OP: " + linkUpdateObj.op);
          // callback(null, linksModifiedFlag);
        break;
      }
    }
    // else {
    //   callback(null, linksModifiedFlag);
    // }

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

      // if (createTweetLinksReady && (createTweetLinksQueue.length > 0)) {
      // if (createTweetLinksQueue.length > 0) {
      while (createTweetLinksQueue.length > 0) {

        // createTweetLinksReady = false;

        node = createTweetLinksQueue.shift();

        createTweetLinks(node, function(){

          createTweetLinksHashMap.remove(node.nodeId);
          // if (createTweetLinksQueue.length == 0) createTweetLinksReady = true;

        });
      }

    }, interval);
  }


  function createTweetLinks(node, callback){

    async.parallel({

      user: function(cb) {

        if (!node.user) return(cb());

        if (localNodeHashMap.has(node.user.nodeId)) {

          var usNode = localNodeHashMap.get(node.user.nodeId);
          var linkId = node.nodeId + "_" + usNode.nodeId;

          if (!localLinkHashMap.has(linkId)) {

            var newLink = {
              sessionId: socket.id,
              linkId: linkId,
              age: 0,
              source: node,
              target: usNode,
              sourceAndTarget: true
            }

            localLinkHashMap.set(linkId, newLink);

            self.addLink(newLink);

          }
        }

        cb();
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
                  sessionId: socket.id,
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: usNode,
                  sourceAndTarget: true
                }

                localLinkHashMap.set(linkId, newLink);

                self.addLink(newLink);

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
                  sessionId: socket.id,
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: htNode,
                  sourceAndTarget: true
                }

                localLinkHashMap.set(linkId, newLink);

                self.addLink(newLink);

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
                  sessionId: socket.id,
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: meNode,
                  sourceAndTarget: true
                }

                localLinkHashMap.set(linkId, newLink);

                self.addLink(newLink);

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

              // console.debug("+ L URL\n" + jsonPrint(urlObj));

              urlNode = localNodeHashMap.get(urlObj.nodeId);
              linkId = node.nodeId + "_" + urlNode.nodeId;

              if (!localLinkHashMap.has(linkId)) {

                newLink = {
                  sessionId: socket.id,
                  linkId: linkId,
                  age: 0,
                  source: node,
                  target: urlNode,
                  sourceAndTarget: true
                }

                localLinkHashMap.set(linkId, newLink);

                // console.debug("+ L URL: " + linkId);
                self.addLink(newLink);

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

        if (!node.place) return(cb());

        if (localNodeHashMap.has(node.place.nodeId)) {

          var plNode = localNodeHashMap.get(node.place.nodeId);
          var linkId = node.nodeId + "_" + plNode.nodeId;

          if (!localLinkHashMap.has(linkId)) {

            var newLink = {
              sessionId: socket.id,
              linkId: linkId,
              age: 0,
              source: node,
              target: plNode,
              sourceAndTarget: true
            }

            localLinkHashMap.set(linkId, newLink);

            self.addLink(newLink);

          }
        }

        cb();
      },

    }, function(err, results) {
      callback();
    });
  }

  var ageNodes = function (callback) {

    var deadNodeFlag = false ;

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
      return (callback(null, deadNodeFlag));
    } 
    else if (nodeAddQ.length > 100) {
      ageRate = adjustedAgeRateScale(nodeAddQ.length - 100);
    } 
    else if (nodes.length > 100) {
      ageRate = adjustedAgeRateScale(nodes.length - 100);
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

      age = node.age + (ageRate * (moment().valueOf() - node.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
        node.ageMaxRatio = 1.0;
        deadNodeFlag = true;
      } 
      else if (age >= nodeMaxAge) {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = 1.0;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
        deadNodeFlag = true;
      } 
      else {
        node.ageUpdated = moment().valueOf();
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.isDead = false;
        nodes[ageNodesIndex] = node;

        if ((node.nodeType == "tweet") && (!createTweetLinksHashMap.has(node.nodeId))) {
          createTweetLinksQueue.push(node);
          createTweetLinksHashMap.set(node.nodeId, node);
          // console.warn("createTweetLinksQueue: " + createTweetLinksQueue.length);
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

    var currentSession;
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

        if (node.isGroupNode){
          for (var i=groups.length-1; i >= 0; i -= 1) {
            if (node.nodeId == groups[i].node.nodeId) {

              console.log("X GRP | " + groups[i].node.nodeId);

              groupUpdateQ.push({op:'delete', groupId: groups[i].groupId});

              var deadLinkIds = Object.keys(node.links);
              deadLinkIds.forEach(function(deadLink){
                deadLinksHash[deadLink] = 'DEAD';
              });
            }
          }
        }
        if (node.isSessionNode){
          for (var i=sessions.length-1; i >= 0; i -= 1) {
            if (node.nodeId == sessions[i].node.nodeId) {
              // console.log("X SES | " + sessions[i].node.nodeId);
              sessionUpdateQ.push({op:'delete', sessionId: sessionId});
              var deadLinkIds = Object.keys(node.links);
              deadLinkIds.forEach(function(deadLink){
                deadLinksHash[deadLink] = 'DEAD';
              });
            }
          }
        }
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
        // console.info("link\n" + jsonPrint(d));
        // if ((typeof d.source !== 'undefined') && (typeof d.target !== 'undefined')) {
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
      // .style('opacity', function(d) { return sessionOpacityScale(d.ageMaxRatio); });
      .style('stroke', function(d) {
        if ((d.source.age < nodeNewAge) && (d.target.age < nodeNewAge)) return palette.white;
        return "aaaaaa";
      })
      .style('stroke-width', function(d) {
        if ((d.source.age < nodeNewAge) && (d.target.age < nodeNewAge)) return 3.5;
        return 1.5;
      })
      .style('opacity', function(d){
        if ((d.source.age < nodeNewAge) && (d.target.age < nodeNewAge)) return 1.0;
        // return 0.5*(nodeMaxAge - d.source.age) / nodeMaxAge ;
        return sessionOpacityScale(d.ageMaxRatio);
      });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .style("visibility", "visible")
      .style('stroke', palette.lightgray )
      .style('stroke-width', 1)
      .style('opacity', 1);

    link
      .exit()
      .remove();

    callback();
  }

  var updateNodeCircles = function(callback) {

    nodeCircles = nodeSvgGroup.selectAll("circle").data(nodes ,function(d) { return d.nodeId; });

    nodeCircles
      .attr("r", function(d) {
        // if (typeof d.isIgnored === 'undefined') {
        if (d.isIgnored) {
          // console.debug(d.nodeId + " | NODE CIRCLE d.mentions UNDEFINED");
          return defaultRadiusScale(1);
        }
        else if (typeof d.mentions === 'undefined') {
          console.debug(d.nodeId + " | NODE CIRCLE d.mentions UNDEFINED");
          return defaultRadiusScale(1);
        }
        else {
          // if (d.isGroupNode) return groupCircleRadiusScale(d.totalWordChainIndex + 1.0) ;
          // if (d.isSessionNode) return sessionCircleRadiusScale(d.wordChainIndex + 1.0) ;
          return defaultRadiusScale(parseInt(d.mentions) + 1.0);
        }
      })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style('stroke', function(d) {
        if (d.age < nodeNewAge) return palette.white;
        return "aaaaaa";
      })
      .style('stroke-width', function(d) {
        if (d.age < nodeNewAge) return 3.5;
        return 1.5;
      })
      .style('opacity', function(d) {
        if (hideNodeCirclesFlag) return 1e-6;
        if (d.mouseHoverFlag) return 1.0;
        return sessionOpacityScale(d.ageMaxRatio);
      });

    nodeCircles
      .enter()
      .append("svg:circle")
      .attr("r", 1e-6)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        if (d.nodeType == 'tweet') { return palette.red; }
        if (d.nodeType == 'hashtag') { return palette.blue; }
        if (d.nodeType == 'user') { return palette.green; }
        if (d.nodeType == 'url') { return palette.green; }
        if (d.nodeType == 'media') { return palette.yellow; }
        if (d.nodeType == 'place') { return palette.purple; }
        if ( d.isTrendingTopic 
          || d.isTwitterUser 
          || d.isNumber 
          || d.isCurrency) { return palette.black; }
        if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.black; 
      })
      .style('stroke', palette.lightgray )
      .style('stroke-width', 1)
      .style('visibility', function(d) {
        if (hideNodeCirclesFlag) { return "hidden"; }
        if (d.nodeType == "media") { return "hidden"; }
        if (d.nodeType == "user") { return "hidden"; }
        return "visible";
      })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick);

    nodeCircles
      .exit()
      .remove();

    callback();
  }

  var updateNodeImages = function(callback) {

   var nodeImages = nodeSvgGroup.selectAll("image").data(nodes, function(d) { return d.nodeId; })

    nodeImages
      .attr("x", function(d) { return d.x - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0)); })
      .attr("y", function(d) { return d.y - 0.5*(imageSizeScale(parseInt(d.mentions) + 1.0)); })
      .attr("width", function(d){ return imageSizeScale(parseInt(d.mentions) + 1.0); })
      .attr("height", function(d){ return imageSizeScale(parseInt(d.mentions) + 1.0); })
      .style("visibility", function(d){
        if (hideNodeImagesFlag) return "hidden";
        if (d.nodeType == "media") return "visible";
        if (d.nodeType == "user") return "visible";
        return "hidden";
      })
      .style('opacity', function(d) {
        if (d.mouseHoverFlag) return 1.0;
        return sessionOpacityScale(d.ageMaxRatio);
      });

    nodeImages
      .enter()
      .append("svg:image")
      .filter(function(d) { 
        return ((d.nodeType == "media") || (d.nodeType == "user")); 
      })
      .attr("x", function(d) {return d.x;})
      .attr("y", function(d) {return d.y;})
      .attr("xlink:href", function(d) { 
        if (d.nodeType == "media") return d.sourceUrl;
        if (d.nodeType == "user") return d.profileImageUrl;
        return d.url; 
      })
      .attr("width", 1e-6)
      .attr("height", 1e-6)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .style("visibility", function(d){
        if (hideNodeImagesFlag) return "hidden";
        if (d.nodeType == "media") return "visible";
        if (d.nodeType == "user") return "visible";
        return "hidden";
      })
      .style("opacity", 1);

    nodeImages
      .exit()
      .remove();

    callback();
  }

  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text").data(nodes ,function(d) { return d.nodeId; });

    nodeLabels
      .text(function(d) {
        d.textLength = this.getComputedTextLength();
        if (d.nodeType == 'hashtag') return d.nodeId;
        if (d.nodeType == 'user') return "";
        if (d.nodeType == 'tweet') return "";
        if (d.isGroupNode) return d.totalWordChainIndex;
        if (d.isSessionNode) return d.entity;
        if (d.isTwitterUser) return d.raw;
        if (!mouseMovingFlag 
          && blahMode 
          && !d.isTwitterUser 
          && !d.isKeyword 
          && !d.isCurrency 
          && !d.isNumber 
          && !d.isTrendingTopic) {
          return "blah";
        }
        if (antonymFlag && d.antonym) { return '[' + d.antonym + ']';  }
        if (typeof d.raw !== 'undefined') { return d.raw.toUpperCase();  }
        return d.nodeId.toUpperCase();
      })
      .attr("x", function(d) { return d.x; })
      // .attr("y", function(d) { return d.y; })
      .attr("y", function(d) { 
        // var shiftY = -1.5 * (nodeFontSizeScale(d.mentions + 1));
        if (d.isIgnored) return d.y - 1.8 * (defaultRadiusScale(10));
        return d.y - 1.5 * (defaultRadiusScale(d.mentions + 1));
      })
      .style("font-weight", function(d) {
        if (d.isTwitterUser 
          || d.isKeyword 
          || d.isNumber 
          || d.isCurrency 
          || d.isTrendingTopic) return "bold";
        return "normal";
      })
      .style("text-decoration", function(d) {
        if (d.isTrendingTopic) return "underline";
        return "none";
      })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        if ( d.isTrendingTopic 
          || d.isTwitterUser 
          || d.isNumber 
          || d.isCurrency) { return palette.white; }
        if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.white; 
      })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return 1.0 - d.ageMaxRatio; 
      })
      .style("font-size", function(d) {
          if (d.isIgnored) { return nodeFontSizeScale(10);  }
          if (d.isTrendingTopic) { return nodeFontSizeScale(1.5*(d.mentions + 1)); }
          return (nodeFontSizeScale(d.mentions + 1));
        });

    nodeLabels
      .enter()
      .append("svg:text")
      .attr("nodeId", function(d) { return d.nodeId; })
      .text(function(d) {
        d.textLength = this.getComputedTextLength();
        // if (d.isGroupNode) return d.totalWordChainIndex;
        // if (d.isSessionNode) return d.wordChainIndex + ' | ' + d.y.toFixed(0);
        if (d.nodeType == 'hashtag') return d.nodeId;
        if (d.nodeType == 'user') return "";
        if (d.nodeType == 'tweet') return "";
        if (!mouseMovingFlag && blahMode && !d.isKeyword) return "blah";
        return d.raw;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .style("visibility", function(d) { 
        if (d.nodeType == "media") return "hidden";
        if (d.nodeType == "url") return "hidden";
        return (d.isGroupNode || d.isSessionNode) ? "hidden" : "visible"; 
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "bottom")
      .style("opacity", 1e-6)
      .style("fill", palette.white)
      .style("font-size", "1px")
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick);

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

    async.series(
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
        if (err) {
          console.error("*** ERROR: updateSimulation *** \nERROR: " + err);
          callback(err);
        }
        else if (results) {

          var keys = Object.keys(results);

          for (var i=0; i<keys.length; i++){
            if (results[keys[i]]) {
              simulation.nodes(nodes);
              if (runningFlag) self.simulationControl('RESTART');
              if (typeof callback !== 'undefined') return(callback());
              break;
            }
          }
        }
        else {
          if (typeof callback !== 'undefined') callback();
        }
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

    var nodeId = d.nodeId;
    var sId = d.sessionId;
    var uId = d.userId;
    var mentions = d.mentions;
    var currentR = d3.select(this).attr("r");

    self.toolTipVisibility(true);

    var tooltipString;

    if (d.isSessionNode) {
      sessions.forEach(function(session){
        if (session.sessionId == d.sessionId){
          session.mouseHoverFlag = true;
          mouseHoverSessionId = d.sessionId;
        }
      });

      tooltipString = uId 
        + "<br>MENTIONS: " + mentions;
    }
    else {
      tooltipString = d.raw
        + "<br>MENTIONS: " + mentions 
        + "<br>KEYWORD: " + d.isKeyword 
        + "<br>KEYWORD: " + jsonPrint(d.keywords) 
        + "<br>" + uId;
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

    if (!d.isGroupNode){
      d.fx = null;
      d.fy = null;
    }

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



  function sessionCircleClick(d) {
    window.open(d.url, '_blank');
  }

  this.addGroup = function(newGroup) {
    // groupUpdateQ.push({op:'add', group:newGroup});
  }

  this.addSession = function(newSession) {
    console.debug("sPosHashMap ADD SES"
      + " | " + newSession.sessionId
    );
    console.info("+ SES" 
      + " " + newSession.sessionId
    );
    // sessionUpdateQ.push({op:'add', session: newSession});
  }

  this.deleteSessionLinks = function(sessionId) {
    sessionUpdateQ.push({op:'delete', sessionId: sessionId});
  }

  this.addNode = function(nNode) {

    var newNode = nNode;
    newNode.newFlag = true;


    if (typeof nNode.mentions === 'undefined') {
      // console.error("MENTIONS UNDEFINED " + newNode.nodeId);
      console.error("MENTIONS UNDEFINED\n" + jsonPrint(nNode));
      newNode.mentions = 1;
    }

    if (typeof newNode.text === 'undefined') {
      newNode.text = "== UNDEFINED ==";
    }

    newNode.textLength = 100;

    if (newNode.isKeyword){
      newNode.textLength = 100;
    }

    if (typeof newNode.raw !== 'undefined') {

      newNode.raw = newNode.raw.replace(/\&amp\;/gi, "&");

      if (newNode.raw.match(/^\d+/gi)){
        newNode.isNumber = true;
      }

      if (newNode.raw.match(/^\$/gi)){
        newNode.isCurrency = true;
      }
      
      if (newNode.raw.match(/^@/gi)){
        newNode.isTwitterUser = true;
      }
    }

    if (newNode.isTrendingTopic) {
      console.log("TT" 
        + " " + newNode.text
        + " " + newNode.raw
      );
    }

    if (nodeAddQ.length < MAX_RX_QUEUE) nodeAddQ.push({op:'add', node: newNode});

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.warn("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
    else {

    }
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

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.linkId; })
        .distance(function(d){
          if (d.isSessionNode) return 0.1*globalLinkDistance;
          return globalLinkDistance; 
        })
        .strength(function(d){
        if (d.isSessionNode) return 10.0*globalLinkStrength;
        return 0.5*globalLinkStrength; 
      }))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX().x(function(d) { 
        if (d.isSessionNode) return 0.7*width;
        return 0.5*width; 
      }).strength(function(d){
        if (d.isSessionNode) return 1.0*gravity;
        return 1*gravity; 
      }))
      .force("forceY", d3.forceY().y(function(d) { 
        return 0.4*height; 
      }).strength(function(d){
        if (d.isSessionNode) return gravity;
        return forceYmultiplier * gravity; 
      }))
      .force("collide", d3.forceCollide().radius(function(d) { 
          if (d.isGroupNode) return 4.5 * collisionRadiusMultiplier * sessionCircleRadiusScale(d.wordChainIndex + 1.0) ; 
          if (d.isSessionNode) return collisionRadiusMultiplier * sessionCircleRadiusScale(d.wordChainIndex + 1.0) ; 
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
          if (d.isSessionNode) return 0.7*width;
          return 0.5*width; 
        }).strength(function(d){
          if (d.isSessionNode) return 1.0*gravity;
          return 1*gravity; 
        }));

      simulation.force("forceY", d3.forceY().y(function(d) { 
          return 0.4*height; 
        }).strength(function(d){
          if (d.isSessionNode) return gravity;
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

    var sessionId = 'session_' + randomNumber360;
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
      sessionId: sessionId,
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

  var testSessionIndex = 0;

  this.addRandomLink = function() {

    if (nodes.length < 2) {
      return;
    }

    var sessionId = 'testSession' + testSessionIndex;
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
      sessionId: sessionId,
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

    groups = [];
    sessions = [];
    nodes = [];
    links = [];

    deadNodesHash = {};
    deadLinksHash = {};
    mouseMovingFlag = false;
    mouseHoverFlag = false;
    mouseHoverGroupId = false;
    mouseHoverSessionId = false;
    mouseHoverNodeId = false;
    self.toolTipVisibility(false);

    self.resize();
    self.resetDefaultForce();
  }
}