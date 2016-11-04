/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewFlow() {

  var self = this;
  var simulation;

  var showStatsFlag = false;
  var fixedGroupsFlag = true;

  var runningFlag = false;
  var updateNodeFlag = false;

  var groupCircleVisibility = "visible";


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
  var mouseHoverGroupId;
  var mouseHoverSessionId;
  var mouseHoverNodeId;

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
    'ageRate': window.DEFAULT_AGE_RATE,
  };

  var ageRate = DEFAULT_FLOW_CONFIG.ageRate;

  var charge = DEFAULT_CHARGE;
  var gravity = DEFAULT_GRAVITY;
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
    "yellowgreen": "#738A05"
  };

  var currentScale = 0.4;
  var currentMaxMentions = 2;

  var minFontSize = 20;
  var maxFontSize = 60;


  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var FLOW_LAYOUT_WIDTH_RATIO = 1.0;
  var FLOW_LAYOUT_HEIGHT_RATIO = 1.0;

  var SVGCANVAS_WIDTH_RATIO = 1.0;
  var SVGCANVAS_HEIGHT_RATIO = 1.0;

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


  var adjustedAgeRateScale = d3.scaleLinear().domain([1, 500]).range([1.0, 100.0]);

  var sessionFontSizeScale = d3.scaleLinear().domain([1, 10000000]).range([16.0, 24]).clamp(true);
  var nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);

  var groupCircleRadiusScale = d3.scaleLog().domain([1, 10000000]).range([10.0, 50.0]).clamp(true); // uses wordChainIndex
  var sessionCircleRadiusScale = d3.scaleLog().domain([1, 1000000]).range([5.0, 40.0]).clamp(true); // uses wordChainIndex
  var defaultRadiusScale = d3.scaleLog().domain([1, 10000000]).range([2.0, 30.0]).clamp(true);

  var fillColorScale = d3.scaleLinear().domain([1e-6, 0.1, 1.0]).range([palette.gray, palette.darkgray, palette.black]);
  var strokeColorScale = d3.scaleLog().domain([1e-6, 0.15, 1.0]).range([palette.white, palette.darkgray, palette.black]);
  var linkColorScale = d3.scaleLinear().domain([1e-6, 0.5, 1.0]).range(["#cccccc", "#666666", "#444444"]);


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

  this.groupsLength = function() {
    return groups.length;
  }
  
  this.sessionsLength = function() {
    return sessions.length;
  }
  
  this.nodesLength = function() {
    return nodes.length;
  }
  
  this.linksLength = function() {
    return links.length;
  }
  
  this.ageRate = function() {
    return ageRate;
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

  var svgFlowLayoutAreaWidth = d3LayoutWidth * FLOW_LAYOUT_WIDTH_RATIO;
  var svgFlowLayoutAreaHeight = d3LayoutHeight * FLOW_LAYOUT_HEIGHT_RATIO;

  this.getSessionsLength = function() {
    return sessions.length;
  }


  var d3image = d3.select("#d3group");

  var svgcanvas = d3image.append("svg:svg")
    .attr("id", "svgcanvas")
    .attr("x", 0)
    .attr("y", 0);

  var svgFlowLayoutArea = svgcanvas.append("g")
    .attr("id", "svgFlowLayoutArea");

  var linkSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

  var groupSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "groupSvgGroup");
  var groupLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  var groupGnode = groupSvgGroup.selectAll("g.group");
  var groupCircles = groupSvgGroup.selectAll("circle");

  var nodeSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");

  var node = nodeSvgGroup.selectAll("g.node");
  var nodeCircles = nodeSvgGroup.selectAll("circle");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  var sessionLabelSvgGroup = svgFlowLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);

  var globalLinkIndex = 0;


  var panzoomElement = document.getElementById('svgFlowLayoutArea')
  panzoom(panzoomElement);


  function generateLinkId(callback) {
    globalLinkIndex++;
    return "LNK" + globalLinkIndex;
  }

  self.togglePause = function(){
    // runningFlag = pause;
    if (runningFlag){
      // runningFlag = false;
      self.simulationControl('PAUSE');
    }
    else{
      // runningFlag = true;
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
    simulation.force("forceX", d3.forceX(-10000).strength(value));
    // simulation.force("forceY", d3.forceY(svgForceLayoutAreaHeight/2).strength(gravity));
 }

  self.updateCharge = function(value) {
    console.debug("UPDATE CHARGE: " + value);
    charge = value;
    simulation.force("charge", d3.forceManyBody().strength(value));
  }

  self.resetDefaultForce = function() {
    console.log("RESET FLOW LAYOUT DEFAULTS");
    self.updateCharge(DEFAULT_CHARGE);
    self.updateVelocityDecay(DEFAULT_FRICTION);
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
          console.log("XXX GROUP NODE " + deletedGroup.node.nodeId);
          deadGroupFlag = true;
          nodeUpdateQ.push({op:'delete', nodeId: deletedGroup.node.nodeId});
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
          console.log("XXX SESS NODE " + deletedSession.node.nodeId);
          deadSessionFlag = true;
          nodeUpdateQ.push({op:'delete', nodeId: deletedSession.node.nodeId});
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

      node = nodes[nodeIndex];

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
      console.error("XXX NODE NOT FOUND ??? " + nodeId);
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
            if (fixedGroupsFlag || groupUpdateObj.group.node.fixed) {
              groupUpdateObj.group.node.fx = groupUpdateObj.group.node.x;
              // groupUpdateObj.group.node.fy = groupUpdateObj.group.node.y;
            }
            console.log("ADD GROUP | " + groupUpdateObj.group.groupId);
            groups.push(groupUpdateObj.group);
          break;
          case "delete":
            console.warn("DEL GROUP | " + groupUpdateObj.groupId);
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


  var processNodeUpdateQ = function(callback) {

    var nodesModifiedFlag = false;

    while (nodeUpdateQ.length > 0){

      var nodeUpdateObj = nodeUpdateQ.shift();

      switch (nodeUpdateObj.op) {

        case "add":
          nodesModifiedFlag = true;

          if (!nodeUpdateObj.node.isGroupNode 
            && !nodeUpdateObj.node.isSessionNode 
            && !nodeUpdateObj.node.isIgnored 
            && (nodeUpdateObj.node.mentions > currentMaxMentions)) {
            currentMaxMentions = nodeUpdateObj.node.mentions;
            nodeFontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]).clamp(true);
            console.warn("NEW MAX MENTIONS" 
              + " | " + nodeUpdateObj.node.text 
              + " | isIgnored: " + nodeUpdateObj.node.isIgnored 
              + " | " + currentMaxMentions 
            );
          }

          nodes.push(nodeUpdateObj.node);
        break;

        case "update":
          nodesModifiedFlag = true;

          var node;
          var nodesLength = nodes.length - 1;
          var nodeIndex = nodesLength;

          for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {
            node = nodes[nodeIndex];
            if (node.nodeId == uNode.nodeId) {
              console.error("updateNode PREVIOUS\n" + jsonPrint(node));
              nodes[nodeIndex] = uNode;
              console.error("updateNode UPDATED\n" + jsonPrint(uNode));
            }
          }

          if (nodeIndex < 0) {
            updateNodeFlag = false;
            console.error("updateNode DONE");
            return;
          }
        break;

        case "delete":
          deleteNodeQ(nodeUpdateObj.nodeId, function(err, deadNodeFlag){
            if (deadNodeFlag) nodesModifiedFlag = true;
          });
        break;

      }
    }
    if (nodeUpdateQ.length == 0){
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
    else if (nodes.length > 100) {
      ageRate = adjustedAgeRateScale(nodes.length - 100);
    } 
    else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

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

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;

    var currentSession;
    var currentLinkObject = {};

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

      currentLinkObject = links[ageLinksIndex];

      if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD';
        deadLinksFlag = true;
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.source.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD SOURCE';
        deadLinksFlag = true;
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.target.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD TARGET';
        deadLinksFlag = true;
      } else if (!nodeHashMap.has(currentLinkObject.source.nodeId)) {
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

        nodeUpdateQ.push({op:'delete', nodeId: node.nodeId});
        nodeDeleteQueue.push(node.nodeId);

        deadNodeFlag = true;

        delete deadNodesHash[node.nodeId];

        if (node.isGroupNode){
          for (var i=groups.length-1; i >= 0; i -= 1) {
            if (node.nodeId == groups[i].node.nodeId) {

              console.log("XXX GROUP | " + groups[i].node.nodeId);

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
              console.log("XXX SESSION | " + sessions[i].node.nodeId);
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
        // console.warn("XXX DEAD LINK | " + link.linkId);
        linkDeleteQueue.push(link.linkId);
        links.splice(ageLinksIndex, 1);
        delete deadLinksHash[link.linkId];
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      return (callback(null));
    }
  }

  // function updateNodes() {

  //   node = nodeSvgGroup.selectAll("g").data(nodes, function(d) { return d.nodeId; });

  //   node
  //     .attr("x", function(d) { return d.x; })
  //     .attr("y", function(d) { return d.y; });

  //   node
  //     .enter()
  //     .append("svg:g")
  //     .attr("class", "node")
  //     .attr("x", function(d) { return d.x; })
  //     .attr("y", function(d) { return d.y; })
  //     .merge(node);

  //   node
  //     .exit()
  //     .remove();
  // }

  function updateLinks() {

    link = linkSvgGroup.selectAll("line").data(links, 
      function(d) { return d.source.nodeId + "-" + d.target.nodeId; });

    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style('stroke', function(d) { return linkColorScale(d.ageMaxRatio); })
      .style('opacity', function(d) { return 1.0 - d.ageMaxRatio; });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .style('stroke', function(d) { return linkColorScale(1.0); })
      .style('stroke-width', 1.75)
      .style('opacity', 1e-6)
      .merge(link);

    link
      .exit()
      .remove();
  }

  function updateGroupsCircles() {

    groupCircles = groupSvgGroup.selectAll("circle").data(groups ,function(d) { return d.groupId; })

    groupCircles
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return groupCircleRadiusScale(d.wordChainIndex + 1); })
      .style("fill", function(d) {
        if (d.mouseHoverFlag) { return palette.blue; }
        else { return d.interpolateGroupColor(1-d.node.ageMaxRatio); }
      })
      .style('opacity', function(d) {
        if (d.mouseHoverFlag) { return 1.0; }
        else { return 1-d.node.ageMaxRatio; }
      })
      .style('stroke', function(d) { return d.interpolateGroupColor(d.node.ageMaxRatio); })
      .style('stroke-width', function(d) { return 5; })
      .style("stroke-opacity", function(d) {
          return d.interpolateGroupColor(1-d.node.ageMaxRatio);
      });

    groupCircles
      .enter()
      .append("svg:circle")
      .attr("class", "groupCircle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      // .attr("mouseover", 0)
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .on("click", nodeClick)
      .attr("r", 1e-6)
      .style("visibility", groupCircleVisibility)
      .style("fill", function(d) {
        if (d.mouseHoverFlag) { return palette.blue; }
        else { return d.interpolateGroupColor(1-d.node.ageMaxRatio); }
      })
      .style("opacity", 1e-6)
      .style('stroke', function(d) {
        return d.interpolateGroupColor(0.75);
      })
      .style("stroke-width", 2.5)
      .style("stroke-opacity", 0.8)
      .merge(groupCircles);

    groupCircles
      .exit()
      .remove();

  }

  function updateGroupLabels() {    

    groupLabels = groupLabelSvgGroup.selectAll("text").data(groups ,function(d) { return d.groupId; });

    groupLabels
      .text(function(d) { return d.text; })
      .style("fill", function(d) {
        if (d.mouseHoverFlag) { return palette.blue; }
        // else { return d.interpolateGroupColor(d.node.ageMaxRatio); }
        else { return strokeColorScale(d.node.ageMaxRatio); }
      })
      .style("font-size", function(d) { return sessionFontSizeScale(d.totalWordChainIndex) + "px"; })
      .style('opacity', function(d) {
        if (d.mouseHoverFlag) { return 1.0; }
        return 1.0-d.node.ageMaxRatio;
      })
      .attr("x", function(d) {
        return d.node.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.6 * (groupCircleRadiusScale(d.wordChainIndex + 1));
        return d.node.y + shiftY;
      });

    groupLabels.enter()
      .append("svg:text")
      .attr("class", "groupLabel")
      .attr("groupId", function(d) { return d.groupId; })
      .attr("x", function(d) {
        return d.node.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.5 * (groupCircleRadiusScale(d.wordChainIndex + 1));
        return d.node.y + shiftY;
      })
      .text(function(d) { return d.text; })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1e-6)
      .style('fill', "#ffffff")
      .style("font-size", function(d) { return sessionFontSizeScale(d.totalWordChainIndex) + "px"; })
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .on("click", nodeClick)
      .merge(groupLabels);

    groupLabels
      .exit().remove();}

  function updateSessionLabels() {

    sessionLabels = sessionLabelSvgGroup.selectAll("text").data(sessions ,function(d) { return d.sessionId; });

    sessionLabels
      .text(function(d) { return d.text; })
      .attr("x", function(d) {
        // var cnode = nodeHashMap.get(d.nodeId);
        // if (typeof cnode === 'undefined') return 0;
        return d.node.x;
      })
      .attr("y", function(d) {
        var shiftY = -1.5 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        // var cnode = nodeHashMap.get(d.nodeId);
        // if (typeof cnode === 'undefined') return 0;
        return d.node.y + shiftY;
      })
      .style("font-size", function(d) { return sessionFontSizeScale(d.totalWordChainIndex) + "px"; })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag || d.node.mouseHoverFlag) { return palette.white; }
        return palette.yellow; 
      })
      .style('opacity', function(d) {
        if (d.mouseHoverFlag || d.node.mouseHoverFlag) { return 1.0; }
        // return 1.0-((moment().valueOf()-d.lastSeen)/nodeMaxAge);
        return 1.0-d.node.ageMaxRatio;
      });

    sessionLabels
      .enter()
      .append("text")
      .attr("class", "sessionLabel")
      .attr("sessionId", function(d) { return d.sessionId; })
      .text(function(d) { return d.text;  })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1.0)
      .style('fill', "#ffffff")
      .style("font-size", function(d) { return sessionFontSizeScale(d.totalWordChainIndex) + "px"; })
      .attr("x", function(d) {
         return d.node.x;
      })
      .attr("y", function(d) {
        var shiftY = -2.5 * (sessionCircleRadiusScale(d.wordChainIndex + 1));
        return d.node.y + shiftY;
      })
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .on("click", nodeClick)
      .merge(sessionLabels);

    sessionLabels
      .exit().remove();
  }

  function updateNodeCircles() {

    nodeCircles = nodeSvgGroup.selectAll("circle").data(nodes ,function(d) { return d.nodeId; })

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
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", function(d) {
        if (d.mouseHoverFlag) {
          return palette.blue; 
        }
        else {
          if (d.isGroupNode ) return d.interpolateGroupColor(d.ageMaxRatio);
          if (d.isSessionNode) return d.interpolateSessionColor(d.ageMaxRatio);
          // return d.interpolateNodeColor(d.ageMaxRatio);
          return d.interpolateNodeColor(d.ageMaxRatio);
        }
      })
      .style('opacity', function(d) {
        // if (d.ageMaxRatio >= 1.0) { return 0; }
        return 1.0;
      })
      .style('stroke', function(d) {
        if (d.ageMaxRatio < 0.01) return palette.white;
        // if (d.isGroupNode || d.isSessionNode) return d.interpolateNodeColor(d.ageMaxRatio);
        // return strokeColorScale(d.ageMaxRatio);
          // if (d.isGroupNode ) return d.interpolateGroupColor(d.ageMaxRatio);
          if (d.isGroupNode ) return strokeColorScale(d.ageMaxRatio);
          // if (d.isSessionNode) return d.interpolateSessionColor(d.ageMaxRatio);
          if (d.isSessionNode) return strokeColorScale(d.ageMaxRatio);
          return d.interpolateNodeColor(d.ageMaxRatio);
      })
      // .style('stroke-opacity', function(d) { return Math.max(0.2, 1.0 - d.ageMaxRatio); });
      .style('stroke-opacity', 1.0);

    nodeCircles
      .enter()
      .append("svg:circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .attr("r", 1e-6)
      .style("visibility", function(d) { return (d.isGroupNode || d.isSessionNode) ? groupCircleVisibility : "hidden"; })
      .style("fill", palette.black)
      .style("opacity", 1e-6)
      .style('stroke', palette.red)
      .style("stroke-width", function(d) {
        if (d.isGroupNode) return 6.0;
        // if (d.isSessionNode) return 4.0;
        return 4.0;
      })
      .merge(nodeCircles);

    nodeCircles
      .exit().remove();
  }

  function updateNodeLabels() {

    nodeLabels = nodeLabelSvgGroup.selectAll("text").data(nodes ,function(d) { return d.nodeId; });

    nodeLabels
      .text(function(d) {
        if (d.isGroupNode) return d.totalWordChainIndex;
        if (d.isSessionNode) return d.wordChainIndex;
        if (d.isKeyword) return d.text.toUpperCase();
        return d.text;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) {
        if (d.isGroupNode) { return d.y; }
        else if (d.isSessionNode) { return d.y; }
        else{
          return d.y;
        }
        // else{
        //   var shiftY = -20 - 1.15 * (defaultRadiusScale(parseInt(d.mentions) + 1));
        //   return d.y + shiftY;
        // }
      })
      .style("font-size", function(d) {
        if (d.isGroupNode) {
          return sessionFontSizeScale(d.totalWordChainIndex + 1.1) + "px";
        }
        else if (d.isSessionNode) {
          return sessionFontSizeScale(d.wordChainIndex + 1.1) + "px";
        }
        else if (d.isIgnored) {
          return nodeFontSizeScale(10) + "px";
        }
        else {
          return nodeFontSizeScale(d.mentions + 1.1) + "px";
        }
      })
      .style('fill', function(d) { 
        if (d.mouseHoverFlag) { return palette.blue; }
        if (d.isKeyword) { return d.keywordColor; }
        return palette.white; 
      })
      .style('opacity', function(d) { 
        if (d.mouseHoverFlag) { return 1.0; }
        return 1.0 - d.ageMaxRatio; 
      });

    nodeLabels
      .enter()
      .append("svg:text")
      .attr("nodeId", function(d) { return d.nodeId; })
      .text(function(d) {
        if (d.isGroupNode) return d.totalWordChainIndex;
        if (d.isSessionNode) return d.wordChainIndex;
        return d.text;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) {
        if (d.isGroupNode) { return d.y; }
        else if (d.isSessionNode) { return d.y; }
        else {
          var shiftY = -10 - 1.1 * (defaultRadiusScale(parseInt(d.mentions) + 1));
          return d.y + shiftY;
        }
      })
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("opacity", 1e-6)
      .style("fill", palette.white)
      .style("font-size", function(d) {
        if (d.isGroupNode) return sessionFontSizeScale(d.totalWordChainIndex + 1.1) + "px";
        if (d.isSessionNode) return sessionFontSizeScale(d.wordChainIndex + 1.1) + "px";
        return nodeFontSizeScale(d.mentions + 1.1) + "px";
      })
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut)
      .on("click", nodeClick)
      .merge(nodeLabels);

    nodeLabels
      .exit().remove();
  }

  function drawSimulation(){
    updateLinks();
    updateNodeCircles();
    updateNodeLabels();
    updateGroupsCircles();
    updateSessionLabels();
    updateGroupLabels();
  }

  function ticked() {
    drawSimulation();
    updateSimulation();
  }

  function updateSimulation(callback) {
    async.series(
      {
        group: processGroupUpdateQ,
        session: processSessionUpdateQ,
        node: processNodeUpdateQ,
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
              // simulation.alphaTarget(0.7).restart();
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

    if (d.isSessionNode) {
      sessions.forEach(function(session){
        if (session.sessionId == d.sessionId){
          session.mouseHoverFlag = true;
          mouseHoverSessionId = d.sessionId;
        }
      });
    }

    d.fx = d.x;
    d.fy = d.y;

    var nodeId = d.nodeId;
    var sId = d.sessionId;
    var uId = d.userId;
    var mentions = d.mentions;
    var currentR = d3.select(this).attr("r");

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    var tooltipString = "<bold>" + nodeId + "</bold>" 
      + "<br>MENTIONS: " + mentions 
      + "<br>" + uId 
      + "<br>" + sId;

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  }

  function nodeMouseOut(d) {

    mouseHoverFlag = false;
    d.mouseHoverFlag = false;

    if (!d.isGroupNode){
      d.fx = null;
      d.fy = null;
    }

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1e-6);
  }

  function nodeClick(d) {
    launchSessionView(d.sessionId);
  }
 
  function sessionCircleClick(d) {
    launchSessionView(d.sessionId);
  }


  var groupUpdateQ = [];
  var sessionUpdateQ = [];
  var nodeUpdateQ = [];
  var linkUpdateQ = [];


  this.addGroup = function(newGroup) {
    groupUpdateQ.push({op:'add', group:newGroup});
  }

  this.addSession = function(newSession) {
    sessionUpdateQ.push({op:'add', session: newSession});
  }

  this.deleteSessionLinks = function(sessionId) {
    sessionUpdateQ.push({op:'delete', sessionId: sessionId});
  }

  this.addNode = function(newNode) {
    // console.warn("ADD NODE\n" + jsonPrint(newNode));
    nodeUpdateQ.push({op:'add', node: newNode});
  }

  this.updateNode = function(uNode) {
    console.error("updateNode\n" + jsonPrint(uNode));
    nodeUpdateQ.push({op:'update', node: uNode});
  }

  this.deleteNode = function(nodeId) {
    nodeUpdateQ.push({op:'delete', nodeId: nodeId});
  }

  this.addLink = function(newLink) {
    if (self.disableLinks)  return ;
    linkUpdateQ.push({op:'add', link: newLink});
  }

  this.deleteLink = function(linkId) {
    linkUpdateQ.push({op:'delete', linkId: linkId});
  }


  var drawSimulationInterval;
  var DEFAULT_DRAW_SIMULATION_INTERVAL = 100;
  var drawSimulationIntervalTime = DEFAULT_DRAW_SIMULATION_INTERVAL;

  this.initDrawSimulationInverval = function(itvl){

    var interval = drawSimulationIntervalTime;

    clearInterval(drawSimulationInterval);

    if (typeof itvl !== 'undefined'){
      interval = itvl;
    }

    drawSimulationInterval = setInterval(function(){
      drawSimulation();
    }, interval);
  }

  this.clearDrawSimulationInterval = function(){
    clearInterval(drawSimulationInterval);
  }

  this.initD3timer = function() {

    simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(globalLinkDistance).strength(globalLinkStrength))
      .force("charge", d3.forceManyBody().strength(charge))
      .force("forceX", d3.forceX(-10000).strength(gravity))
      .force("collide", d3.forceCollide().radius(function(d) { return 2.0*d.r ; }).iterations(2))
      // .force("forceY", d3.forceY(svgFlowLayoutAreaHeight/2).strength(DEFAULT_GRAVITY))
      .velocityDecay(velocityDecay)
      .on("tick", ticked);

      d3.forceCenter([0.5*width, 0.5*height]);
  }

  this.simulationControl = function(op) {
    // console.warn("SIMULATION CONTROL | OP: " + op);
    switch (op) {
      case 'RESET':
        // self.initD3timer();
        console.warn("SIMULATION CONTROL | OP: " + op);
        self.clearDrawSimulationInterval();
        self.reset();
        runningFlag = false;
        // simulation.stop();
      break;
      case 'START':
        // console.warn("SIMULATION CONTROL | OP: " + op);
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case 'RESUME':
        if (!runningFlag){
          // console.warn("SIMULATION CONTROL | OP: " + op);
          runningFlag = true;
          self.clearDrawSimulationInterval();
          simulation.alphaTarget(0.7).restart();
        }
      break;
      case 'PAUSE':
        if (runningFlag){
          // console.warn("SIMULATION CONTROL | OP: " + op);
          runningFlag = false;
          simulation.alpha(0);
          simulation.stop();
          self.initDrawSimulationInverval();
        }
      break;
      case 'STOP':
        runningFlag = false;
        // console.warn("SIMULATION CONTROL | OP: " + op);
        self.clearDrawSimulationInterval();
        simulation.alpha(0);
        simulation.stop();
      break;
      case 'RESTART':
        // console.warn("SIMULATION CONTROL | OP: " + op);
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      default:
        console.warn("???? SIMULATION CONTROL | UNKNOWN OP: " + op);
      break;
    }
  }

  this.resize = function() {
    console.log("RESIZE");

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

    d3LayoutWidth = window.innerWidth * D3_LAYOUT_WIDTH_RATIO; // double the width for now
    d3LayoutHeight = window.innerHeight * D3_LAYOUT_HEIGHT_RATIO;

    svgcanvas
      .attr("width", SVGCANVAS_WIDTH_RATIO * window.innerWidth)
      .attr("height", SVGCANVAS_HEIGHT_RATIO * window.innerHeight);

    svgFlowLayoutAreaWidth = d3LayoutWidth * FLOW_LAYOUT_WIDTH_RATIO;
    svgFlowLayoutAreaHeight = d3LayoutHeight * FLOW_LAYOUT_HEIGHT_RATIO;

    svgFlowLayoutArea.attr("width", svgFlowLayoutAreaWidth)
      .attr("height", svgFlowLayoutAreaHeight);

    svgFlowLayoutArea.attr("x", 0);
    svgFlowLayoutArea.attr("y", 0);
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

    var startColor = "hsl(" + randomNumber360 + ",0.8,0.5)";
    var endColor = "black";

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

  self.reset = function() {
    console.error("RESET");

    updateNodeFlag = false;

    groups = [];
    sessions = [];
    nodes = [];
    links = [];

    deadNodesHash = {};
    deadLinksHash = {};
    mouseMovingFlag = false;
    self.resize();
    self.resetDefaultForce();
  }
}