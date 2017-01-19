/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewFlow() {

  var hideNodeCirclesFlag = false;

  var sPosHashMap = {};

  var MAX_NODES = 50;
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
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

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

  var currentMaxMentions = 2;

  var minFontSize = 10;
  var maxFontSize = 60;


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
    // if (mouseFreezeEnabled) {
    //   // self.simulation.stop();
    // }
  }, true);


  var adjustedAgeRateScale = d3.scaleLinear().domain([1, 200]).range([1.0, 20.0]).clamp(true);

  var sessionFontSizeScale = d3.scaleLinear().domain([1, 10000000]).range([16.0, 24]).clamp(true);
  var nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);

  var groupCircleRadiusScale = d3.scaleLog().domain([1, 10000000]).range([10.0, 50.0]).clamp(true); // uses wordChainIndex
  var sessionCircleRadiusScale = d3.scaleLog().domain([1, 1000000]).range([15.0, 50.0]).clamp(true); // uses wordChainIndex
  var defaultRadiusScale = d3.scaleLog().domain([1, 10000000]).range([2.0, 30.0]).clamp(true);

  var fillColorScale = d3.scaleLinear().domain([1e-6, 0.1, 1.0]).range([palette.gray, palette.darkgray, palette.black]);
  var strokeColorScale = d3.scaleLog().domain([1e-6, 0.15, 1.0]).range([palette.white, palette.darkgray, palette.black]);
  var linkColorScale = d3.scaleLinear().domain([1e-6, 0.5, 1.0]).range(["#000000", "#000000", "#000000"]);

  var sessionOpacityScale = d3.scaleLinear().domain([1e-6, 0.05, 1.0]).range([1.0, 0.2, 1e-6]);
  var fontScale = d3.scaleLinear().domain([1e-6, 1.0]).range([0.5, 1.0]);
  // var sessionOpacityScale = d3.scaleLog().domain([1e-6, 1.0]).range([1.0, 1e-6]);

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
    .attr("viewBox", "0 0 1000 1000");
  var svgFlowLayoutArea = svgMain.append("g")
    .attr("id", "svgFlowLayoutArea")
    .attr("viewBox", "0 0 1000 1000");
    // .attr("width", 900)
    // .attr("width", "100%");
    // .attr("height", 900);
     // .call(d3.zoom()
     //      .scaleExtent([1 / 2, 4])
     //      .on("zoom", zoomed));

  var linkSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

  var groupSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "groupSvgGroup");
  var groupLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  var groupGnode = groupSvgGroup.selectAll("g.group");
  var groupCircles = groupSvgGroup.selectAll("circle");

  var nodeSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var nodeGs = nodeSvgGroup.selectAll("g.node");
  // var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeRects = nodeSvgGroup.selectAll("rect");
  var nodeCircles = nodeSvgGroup.selectAll("image");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var sessionLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");
    // .style("opacity", 1e-6);

  var globalLinkIndex = 0;

  self.toolTipVisibility = function(isVisible){
    if (isVisible) {
      divTooltip.style("visibility", "visible");
    }
    else {
      divTooltip.style("visibility", "hidden");
    }
  }

  var panzoomElement = document.getElementById('svgFlowLayoutArea')
  panzoom(panzoomElement);

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
        simulation.force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength));
      break;
      case "linkDistance" :
        globalLinkDistance = value;
        simulation.force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength));
      break;
    }
  }

  self.updateLinkStrength = function(value) {
    console.debug("UPDATE LINK STRENGTH: " + value.toFixed(sliderPercision));
    globalLinkStrength = value;
    simulation.force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength));
  }

  self.updateLinkDistance = function(value) {
    console.debug("UPDATE LINK DISTANCE: " + value.toFixed(sliderPercision));
    globalLinkDistance = value;
    simulation.force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength));
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
        if (d.isSessionNode) return 0.65*width;
        return -20*width; 
      }).strength(function(d){
        if (d.isSessionNode) return 70*gravity;
        return gravity; 
      }));
    simulation.force("forceY", d3.forceY().y(function(d) { 
        return 0.4*height; 
      }).strength(function(d){
        if (d.isSessionNode) return 0.75*forceYmultiplier*gravity;
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
          console.log("X SES " + deletedSession.node.nodeId);
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

    processNodeCount++;

    var nodesModifiedFlag = false;

    if ((nodeAddQ.length > 0) && addNodeEnabled()) {

      var nodeAddObj = nodeAddQ.shift();

      switch (nodeAddObj.op) {

        case "add":

          nodesModifiedFlag = true;
          nodeAddObj.node.age = 0;
          nodeAddObj.node.ageMaxRatio = 1e-6;
          nodeAddObj.node.ageUpdated = moment().valueOf();

          if (!nodeAddObj.node.isGroupNode 
            && !nodeAddObj.node.isSessionNode 
            && !nodeAddObj.node.isIgnored 
            && (nodeAddObj.node.mentions > currentMaxMentions)) {

            currentMaxMentions = nodeAddObj.node.mentions;

            nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);

            console.info("NEW MAX Ms" 
              + " | " + nodeAddObj.node.text 
              + " | I: " + nodeAddObj.node.isIgnored 
              + " | Ms " + currentMaxMentions 
              + " | K: " + nodeAddObj.node.isKeyword 
              + " | KWs: " + jsonPrint(nodeAddObj.node.keywords) 
            );
          }

          nodes.push(nodeAddObj.node);

          if (nodes.length > maxNumberNodes) {
            console.info("MAX NODES: " + maxNumberNodes);
            maxNumberNodes = nodes.length;
          }

          callback(null, nodesModifiedFlag);

        break;

        default:
          console.error("??? UNKNOWN NODE UPDATE Q OP: " + nodeUpdateObj.op);
          callback(null, nodesModifiedFlag);
        break;
      }
    }
    else {
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

    while (linkUpdateQ.length > 0){
      var linkUpdateObj = linkUpdateQ.shift();
      switch (linkUpdateObj.op) {
        case "add":
          linksModifiedFlag = true;
          links.push(linkUpdateObj.link);
          console.debug("+ LINK: " + linkUpdateObj.link.source.nodeId + " > " + linkUpdateObj.link.target.nodeId);
        break;
        case "delete":
          deleteLinkQ(linkUpdateObj.linkId, function(err, deadLinkFlag){
            if (deadLinkFlag) linksModifiedFlag = true;
          });
        break;
      }
    }

    if (linkUpdateQ.length == 0){
      callback(null, linksModifiedFlag);
    }
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

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      var node = nodes[ageNodesIndex];

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
        nodes[ageNodesIndex] = node;
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
        deadLinksHash[currentLinkObject.linkId] = 'DEAD';
        deadLinksFlag = true;
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.source.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD SOURCE';
        deadLinksFlag = true;
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.target.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD TARGET';
        deadLinksFlag = true;
      } else if ((currentLinkObject.source.nodeId !== 'anchor') && !nodeHashMap.has(currentLinkObject.source.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'UNDEFINED SOURCE';
      } else if (!nodeHashMap.has(currentLinkObject.target.nodeId)) {
        deadLinksHash[currentLinkObject.linkId] = 'UNDEFINED TARGET';
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
              console.log("X SES | " + sessions[i].node.nodeId);
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
        console.debug("XXX LINK " + link.linkId);
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
        console.info("link\n" + jsonPrint(d));
        return d.source.nodeId + "-" + d.target.nodeId; 
      });

    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style('stroke', function(d) { 
        if (d.ageMaxRatio < 0.01) { return palette.red; }
        return palette.blue; 
      });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .style("visibility", "visible")
      .style('stroke', function(d) { return linkColorScale(1.0); })
      .style('stroke-width', 1.75)
      .style('opacity', 1);

    link
      .exit()
      .remove();

    callback();
  }

  var updateNodeCircles = function(callback) {

    nodeRects = nodeSvgGroup.selectAll("rect").data(nodes ,function(d) { return d.nodeId; })

    nodeRects
      .attr("x", function(d) {return d.x - 0.5*(sessionCircleRadiusScale(d.wordChainIndex + 1.0));})
      .attr("y", function(d) {return d.y - 0.5*(sessionCircleRadiusScale(d.wordChainIndex + 1.0));})
      .attr("width", function(d){
        return sessionCircleRadiusScale(d.wordChainIndex + 1.0);
      })
      .attr("height", function(d){
        return sessionCircleRadiusScale(d.wordChainIndex + 1.0);
      })
      .style('opacity', function(d) {
        if (hideNodeCirclesFlag) return 1e-6;
        if (d.mouseHoverFlag) return 1.0;
        return sessionOpacityScale(d.ageMaxRatio);
      });

    nodeRects
      .enter()
      .append("svg:rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", function(d) {return d.x;})
      .attr("y", function(d) {return d.y;})
      .attr("fill", "none")
      .style('stroke', function(d) {
        return palette.black;
      })
      .style('stroke-width', 1)
      .style('stroke-opacity', function(d) {
        return 1.0 - d.ageMaxRatio; 
      })
      .style("visibility", function(d) { 
        return (d.isSessionNode) ? "visible" : "hidden"; 
      });

    nodeRects
      .exit().remove();


    nodeCircles = nodeSvgGroup.selectAll("image").data(nodes ,function(d) { return d.nodeId; })

    nodeCircles
      .attr("r", function(d) {
        if (typeof d.mentions === 'undefined') 
          {
            console.error(d.nodeId + " | NODE CIRCLE d.mentions UNDEFINED");
            return defaultRadiusScale(1);
          }
        else {
          if (d.isGroupNode) {
            return groupCircleRadiusScale(d.totalWordChainIndex + 1.0) ;
          }
          else if (d.isSessionNode) {
            return sessionCircleRadiusScale(d.wordChainIndex + 1.0) ;
          }
          else {
            return defaultRadiusScale(parseInt(d.mentions) + 1.0);
          }
        }
      })
      .attr("x", function(d) {return d.x - 0.5*(sessionCircleRadiusScale(d.wordChainIndex + 1.0));})
      .attr("y", function(d) {return d.y - 0.5*(sessionCircleRadiusScale(d.wordChainIndex + 1.0));})
      .attr("width", function(d){
        return sessionCircleRadiusScale(d.wordChainIndex + 1.0);
      })
      .attr("height", function(d){
        return sessionCircleRadiusScale(d.wordChainIndex + 1.0);
      })
      .style('opacity', function(d) {
        if (hideNodeCirclesFlag) return 1e-6;
        if (d.mouseHoverFlag) return 1.0;
        return sessionOpacityScale(d.ageMaxRatio);
      });

    nodeCircles
      .enter()
      .append("svg:image")
      .attr("nodeId", function(d) { return d.nodeId;})
      .attr("isSessionNode", function(d) { return d.isSessionNode;})
      .attr("sessionId", function(d) { return d.sessionId;})
      .attr("x", function(d) {return d.x;})
      .attr("y", function(d) {return d.y;})
      .attr("xlink:href", function(d) { return d.profileImageUrl; })
      .attr("width", 80)
      .attr("height", 80)
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .attr("r", 1e-6)
      .style("visibility", function(d){
        if (hideNodeCirclesFlag) return "hidden";
        if (d.isGroupNode ) return "hidden";
        if (d.isSessionNode) return "visible";
        return "hidden";
      })
      .style("opacity", 1)

    nodeCircles
      .exit().remove();

    callback();
  }

  var updateNodeLabels = function(callback) {

    nodeLabels = nodeLabelSvgGroup.selectAll("text").data(nodes ,function(d) { return d.nodeId; });

    nodeLabels
      .text(function(d) {
        d.textLength = this.getComputedTextLength();
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
        return d.raw.toUpperCase();
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .style("font-weight", function(d) {
        if (d.isTwitterUser || d.isKeyword || d.isNumber || d.isCurrency || d.isTrendingTopic) return "bold";
        return "normal";
      })
      .style("text-decoration", function(d) {
        if (d.isTrendingTopic) return "underline";
        return "none";
      })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        if (d.isTrendingTopic || d.isTwitterUser || d.isNumber || d.isCurrency) { return palette.black; }
        if ((d.isGroupNode || d.isSessionNode) && (d.ageMaxRatio < 0.01)) { return palette.yellow; }
        return palette.lightgray; 
      })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return 1.0 - d.ageMaxRatio; 
      })
      .style("font-size", function(d) {
          if (d.isIgnored) { return nodeFontSizeScale(10) + "px";  }
          if (d.isTrendingTopic) { return nodeFontSizeScale(1.5*d.mentions + 1.1) + "px"; }
          return (nodeFontSizeScale(d.mentions + 1.1)) + "px";
        });

    nodeLabels
      .enter()
      .append("svg:text")
      .attr("nodeId", function(d) { return d.nodeId; })
      .text(function(d) {
        d.textLength = this.getComputedTextLength();
        if (d.isGroupNode) return d.totalWordChainIndex;
        if (d.isSessionNode) return d.wordChainIndex + ' | ' + d.y.toFixed(0);
        if (!mouseMovingFlag && blahMode && !d.isKeyword) return "blah";
        return d.raw;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .style("visibility", function(d) { 
        return (d.isGroupNode || d.isSessionNode) ? "hidden" : "visible"; 
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
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
    window.open(d.url, '_blank');
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

  this.addNode = function(newNode) {

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

    if (newNode.isSessionNode) {
      nodeAddQ.push({op:'add', node: newNode});
    }
    else {
      nodeAddQ.push({op:'add', node: newNode});
    }

    if (nodeAddQ.length > maxNodeAddQ) {
      maxNodeAddQ = nodeAddQ.length;
      console.warn("NEW MAX NODE ADD Q: " + maxNodeAddQ);
    }
  }

  this.deleteNode = function(nodeId) {
    nodeDeleteQ.push({op:'delete', nodeId: nodeId});
  }

  this.addLink = function(newLink) {
    if (self.disableLinks)  return ;
    linkUpdateQ.push({op:'add', link: newLink});
  }

  this.deleteLink = function(linkId) {
    linkUpdateQ.push({op:'delete', linkId: linkId});
  }

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX().x(function(d) { 
        if (d.isSessionNode) return 0.65*width;
        return -20*width; 
      }).strength(function(d){
        if (d.isSessionNode) return 70*gravity;
        return gravity; 
      }))
      .force("forceY", d3.forceY().y(function(d) { 
        return 0.4*height; 
      }).strength(function(d){
        if (d.isSessionNode) return 0.75*forceYmultiplier * gravity;
        return forceYmultiplier * gravity; 
      }))
      .force("collide", d3.forceCollide().radius(function(d) { 
          if (d.isGroupNode) return 4.5 * collisionRadiusMultiplier * d.r ; 
          if (d.isSessionNode) return 3.5 * collisionRadiusMultiplier * d.r ; 
          return collisionRadiusMultiplier * d.textLength ; 
        }).iterations(collisionIterations))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);

      d3.forceCenter([0.5*width, 0.5*height]);
  }

  this.simulationControl = function(op) {
    switch (op) {
      case 'RESET':
        console.debug("SIMULATION CONTROL | OP: " + op);
        self.reset();
        runningFlag = false;
      break;
      case 'START':
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case 'RESUME':
        runningFlag = true;
        simulation.alphaTarget(0.7).restart();
      break;
      case 'FREEZE':
        if (!freezeFlag){
          freezeFlag = true;
          simulation.alpha(0);
          simulation.stop();
        }
      break;
      case 'PAUSE':
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'STOP':
        runningFlag = false;
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'RESTART':
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