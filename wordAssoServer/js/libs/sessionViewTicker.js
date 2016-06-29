/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewTicker() {

  var self = this;
  self.disableLinks = false;

  var lineHeight = 3;

  var defaulStartColor = "hsl(90,100%,70%)";
  var defaultEndColor = "hsl(90,100%,0%)";
  var defaultColors = {"startColor": defaulStartColor, "endColor": defaultEndColor};
  var defaultInterpolateColor = d3.interpolateHsl(defaulStartColor, defaultEndColor);

  var force;

  // ==============================================
  // GLOBAL VARS
  // ==============================================
  var groupYpositionHash = {};
  var groupsLengthYposition = 0;

  var minFontSize = 20;
  var maxFontSize = 48;

  var currentMaxMentions = 2;

  // var age;
  // var ageMaxRatio;

  var newFlagRatio = 0.01;
  var maxWords = 100;
  // var removeDeadNodes = false;
  var maxOpacity = 1.0;
  var minOpacity = 0.1;
  var defaultFadeDuration = 150;

  var testModeEnabled = false;

  var tickNumber = 0;
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

  var newWordFlag = false;

  var maxSessionRows = 25;
  var maxWordRows = 25;

  var marginTopGroups = 10; // %
  var marginLeftGroups = 5;
  var marginRightGroups = 82;

  var marginTopSessions = 10; // %
  var marginLeftSessions = 5;
  var marginRightSessions = 85;

  var marginTopWords = 10; // %
  var marginLeftWords = 15;
  var marginRightWords = 80;

  var maxRecentWords = maxWordRows;

  // index = sessionId; elements = array of session nodeWords in chron order (old>new)
  var sessionNodeArrayHash = {};  

  var wordMentionsArray = [];
  var recentWordMentionsArray = [];

  var dateNow = moment().valueOf();
  var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
  var defaultTimePeriodFormat = "HH:mm:ss";

  var mouseFreezeEnabled = true;
  var mouseHoverFlag = false;
  var mouseHoverNodeId;

  var updateTickerDisplayReady = true;

  var showStatsFlag = false;
  var pauseFlag = false;
  var updateNodeFlag = false;

  var groupMaxAge = window.DEFAULT_MAX_AGE;
  var sessionMaxAge = window.DEFAULT_MAX_AGE;
  var nodeMaxAge = window.DEFAULT_MAX_AGE;

  var DEFAULT_CONFIG = {
    'nodeMaxAge': window.DEFAULT_MAX_AGE
  };

  var DEFAULT_FORCE_CONFIG = {
    'charge': DEFAULT_CHARGE,
    'friction': DEFAULT_FRICTION,
    'linkStrength': DEFAULT_LINK_STRENGTH,
    'gravity': DEFAULT_GRAVITY,
    'ageRate': window.DEFAULT_AGE_RATE,
  };
  var charge = DEFAULT_CHARGE;
  var gravity = DEFAULT_GRAVITY;
  var globalLinkStrength = DEFAULT_LINK_STRENGTH;
  var friction = DEFAULT_FRICTION;
  var forceStopped = true;

  var config = DEFAULT_CONFIG;
  self.removeDeadNodes = true;

  var previousConfig = [];

  var defaultTextFill = "#888888";

  var DEFAULT_TICKER_CONFIG = {
    'ageRate': window.DEFAULT_AGE_RATE,
  };

  var ageRate = DEFAULT_TICKER_CONFIG.ageRate;

  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var TICKER_LAYOUT_WIDTH_RATIO = 1.0;
  var TICKER_LAYOUT_HEIGHT_RATIO = 1.0;

  var SVGCANVAS_WIDTH_RATIO = 1.0;
  var SVGCANVAS_HEIGHT_RATIO = 1.0;

  var createNodeQueue = [];

  var deadGroupsHash = {};
  var deadSessionsHash = {};
  var deadNodesHash = {};
  var deadLinksHash = {};

  var d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO;
  var d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO;

  console.log("width: " + width + " | height: " + height);

  document.addEventListener("mousemove", function() {
    if (mouseHoverFlag) {
      d3.select("body").style("cursor", "pointer");
    } else {
      d3.select("body").style("cursor", "default");
    }

    resetMouseMoveTimer();
    mouseMovingFlag = true;

    if (mouseFreezeEnabled) {}
  }, true);


  var wordBarWidthScale = d3.scale.linear().domain([1, 2e6]).range([0.1, 65]);
  var wordOpacityScale = d3.scale.linear().domain([1e-6, 0.1*nodeMaxAge, nodeMaxAge]).range([maxOpacity, 0.4*maxOpacity, 0.2*maxOpacity]);
  var placeOpacityScale = d3.scale.linear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordBarOpacityScale = d3.scale.linear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordCloudFontScale = d3.scale.linear().domain([1, 2e6]).range([2, 8]);
  var wordCloudAgeScale = d3.scale.linear().domain([1, DEFAULT_MAX_AGE]).range([1, 1e-6]);

  var adjustedAgeRateScale = d3.scale.pow().domain([1, 500]).range([1.0, 100.0]);
  var fontSizeScale = d3.scale.linear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]);

  var sessionCircleRadiusScale = d3.scale.linear().domain([1, 100000000]).range([5.0, 100.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scale.linear().domain([1, 100000000]).range([1.0, 30.0]);

  var fillColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

  var strokeColorScale = d3.scale.linear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

  var linkColorScale = d3.scale.linear().domain([1e-6, 0.5, 1.0]).range(["#cccccc", "#666666", "#444444"]);

  console.log("@@@@@@@ CLIENT @@@@@@@@");

  d3.select("body").style("cursor", "default");


  var groups = [];
  var sessions = [];
  var nodes = [];
  var links = [];

  this.removeDeadNodes = true;

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
    return 0;
  }

  this.ageRate = function() {
    return ageRate;
  }

  this.getSession = function(index) {
    return sessions[index];
  }

  var maxNumberSessions = 0;
  var maxNumberNodes = 0;

  var svgTickerLayoutAreaWidth = d3LayoutWidth * TICKER_LAYOUT_WIDTH_RATIO;
  var svgTickerLayoutAreaHeight = d3LayoutHeight * TICKER_LAYOUT_HEIGHT_RATIO;

  self.reset = function() {
    console.error("RESET");

    force.stop();
    forceStopped = true;

    groups = [];
    sessions = [];
    nodes = [];

    deadNodesHash = {};
    groupHashMap.clear();
    groupYpositionHash = {};

    // newNodes = [];
    resetMouseMoveTimer();
    mouseMovingFlag = false;
    self.resize();
    self.resetDefaultForce();
    force.nodes(nodes);
    if (!self.disableLinks) force.links(links);
    force.start;
    forceStopped = false;

    updateTickerDisplayReady = true;  
  }

  self.setPause = function(pause){
    pauseFlag = pause;
    console.error("PAUSE: " + pauseFlag);
    if (pauseFlag){
      force.stop();
      forceStopped = true;
    }
  }

  self.updateLinkStrength = function(value) {
    console.log("updateLinkStrength: " + value + " | forceStopped: " + forceStopped);
    globalLinkStrength = value;
    force.linkStrength(globalLinkStrength);
    force.start();
  }

  self.updateFriction = function(value) {
    friction = value;
    force.friction(friction);
    force.start();
  }

  self.updateGravity = function(value) {
    gravity = value;
    force.gravity(gravity);
    force.start();
  }

  self.updateCharge = function(value) {
    charge = value;
    force.charge(charge);
    force.start();
  }

  self.resetDefaultForce = function() {
    console.log("RESET FORCE LAYOUT DEFAULTS");
    self.updateCharge(DEFAULT_CHARGE);
    self.updateFriction(DEFAULT_FRICTION);
    self.updateGravity(DEFAULT_GRAVITY);
    self.updateLinkStrength(DEFAULT_LINK_STRENGTH);
  }
  this.getSessionsLength = function() {
    return sessions.length;
  }

  this.setNodeMaxAge = function(maxAge) {
    nodeMaxAge = maxAge;
    console.warn("SET NODE MAX AGE: " + nodeMaxAge);
  }

  var d3image = d3.select("#d3group");

  var svgcanvas = d3image.append("svg:svg")
    .attr("id", "svgcanvas")
    .attr("x", 0)
    .attr("y", 0);

  var svgTickerLayoutArea = svgcanvas.append("g")
    .attr("id", "svgTickerLayoutArea");

  var linkSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "linkSvgGroup");

  var groupSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "groupSvgGroup");
  var groupLabelSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  var groupGnode = groupSvgGroup.selectAll("g.group");
  var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  
  var sessionSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "sessionSvgGroup");
  var sessionLabelSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionGnode = sessionSvgGroup.selectAll("g.session");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  
  var nodeSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
  var node = nodeSvgGroup.selectAll("g.node");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);


  // ===================================================================

  function ageGroups(callback) {

    if (groups.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (groups.length > 500) {
      ageRate = adjustedAgeRateScale(groups.length - 500);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var group;
    var age;
    var ageMaxRatio;

    var ageGroupsLength = groups.length - 1;
    var ageGroupsIndex = groups.length - 1;

    for (ageGroupsIndex = ageGroupsLength; ageGroupsIndex >= 0; ageGroupsIndex -= 1) {

      group = groups[ageGroupsIndex];

      age = group.age + (ageRate * (dateNow - group.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (group.isDead) {
        deadGroupsHash[group.groupId] = 1;
        group.ageMaxRatio = ageMaxRatio;
        group.ageUpdated = moment().valueOf();
        groups[ageGroupsIndex] = group;
      } else if (age >= groupMaxAge) {
        group.isDead = true;
        group.age = nodeMaxAge;
        group.ageMaxRatio = 0;
        group.ageUpdated = moment().valueOf();
        groups[ageGroupsIndex] = group;
        deadGroupsHash[group.groupId] = 1;
      } else {
        group.age = age;
        group.ageMaxRatio = ageMaxRatio;
        group.ageUpdated = moment().valueOf();

        if (age < newFlagRatio * groupMaxAge) {
          group.newFlag = true;
        } else {
          group.newFlag = false;
        }
      }
    }

    if (ageGroupsIndex < 0) {
      return (callback());
    }
  }

  function ageSessions(callback) {

    if (sessions.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (sessions.length > 500) {
      ageRate = adjustedAgeRateScale(sessions.length - 500);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var session;
    var age;

    var ageSessionsLength = sessions.length - 1;
    var ageSessionsIndex = sessions.length - 1;

    for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex >= 0; ageSessionsIndex -= 1) {

      session = sessions[ageSessionsIndex];
      age = session.age + (ageRate * (dateNow - session.ageUpdated));

      if (session.isDead) {
        deadSessionsHash[session.sessionId] = 1;
      } else if (age >= sessionMaxAge) {
        session.isDead = true;
        deadSessionsHash[session.sessionId] = 1;
      } else {
        session.ageUpdated = dateNow;
        session.age = age;
        if (age < newFlagRatio * sessionMaxAge) {
          session.newFlag = true;
        } else {
          session.newFlag = false;
        }
      }
    }

    if (ageSessionsIndex < 0) {
      return (callback());
    }
  }

  function processDeadSessionsHash(callback) {

    if (Object.keys(deadSessionsHash).length == 0) {
      // console.warn("NO DEAD SESSIONS");
      return (callback());
    }
    // console.error("processDeadSessionsHash\n" + jsonPrint(deadSessionsHash));

    var ageSessionsLength = sessions.length - 1;
    var ageSessionsIndex = sessions.length - 1;
    var session;

    for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex >= 0; ageSessionsIndex -= 1) {
      session = sessions[ageSessionsIndex];
      if (deadSessionsHash[session.sessionId]) {
        // sessionDeleteQueue.push(session.sessionId);
        sessions.splice(ageSessionsIndex, 1);
        delete deadSessionsHash[session.sessionId];
        var groupIds = Object.keys(groupYpositionHash);
        groupIds.forEach(function(groupId){
          if (typeof groupYpositionHash[groupId][session.sessionId] !== 'undefined'){
            console.log("groupYpositionHash XXX SESSION"
              + " | " + session.groupId
              + " | " + session.sessionId
            );
            delete groupYpositionHash[groupId][session.sessionId];
          }
        });
        // console.log("XXX SESSION: " + session.sessionId);
      }
    }

    if (ageSessionsIndex < 0) {
      return (callback());
    }
  }

  function tick() {

    link
      .attr("x1", function(d) {
        // console.log("source\n" + jsonPrint(d.source));
        var sourceNode = nodeHashMap.get(d.source.nodeId);
        if (sourceNode) return sourceNode.x;
        return 0;
      })
      .attr("y1", function(d) {
        var sourceNode = nodeHashMap.get(d.source.nodeId);
        if (sourceNode) return sourceNode.y;
        return 0;
      })
      .attr("x2", function(d) {
        var targetNode = nodeHashMap.get(d.target.nodeId);
        if (targetNode) return targetNode.x;
        return 0;
        
      })
      .attr("y2", function(d) {
        var targetNode = nodeHashMap.get(d.target.nodeId);
        if (targetNode) return targetNode.y;
        return 0;
      });
  }

  function ageNodes(callback) {

    var dateNow = moment().valueOf();

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (nodes.length > 500) {
      ageRate = adjustedAgeRateScale(nodes.length - 500);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var node;
    var age;
    var ageMaxRatio;

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      age = node.age + (ageRate * (moment().valueOf() - node.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (self.removeDeadNodes && node.isDead) {
        deadNodesHash[node.nodeId] = 1;
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.ageUpdated = moment().valueOf();
        nodes[ageNodesIndex] = node;
      } 
      else if (self.removeDeadNodes && (age >= nodeMaxAge)) {
        node.age = nodeMaxAge;
        node.ageMaxRatio = 0;
        node.ageUpdated = moment().valueOf();
        node.isDead = true;
        deadNodesHash[node.nodeId] = 1;
        if (node.isGroupNode) console.warn("XXX NODE " + node.nodeId + " | " + node.isGroupNode);
        nodes[ageNodesIndex] = node;
        if (!node.isGroupNode && !node.isSessionNode && (sessionNodeArrayHash[node.sessionId].length > 0)){
          // var shiftNodeId = sessionNodeArrayHash[node.sessionId].shift();
          sessionNodeArrayHash[node.sessionId].shift();
          // console.warn("shift NODE " + shiftNodeId);
        }
      } 
      else {
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.ageUpdated = moment().valueOf();

        if (age < newFlagRatio * nodeMaxAge) {
          node.newFlag = true;
        } else {
          node.newFlag = false;
        }
      }
    }

    if (ageNodesIndex < 0) {
      return (callback());
    }
  }

  function ageLinks(callback) {

    if (self.disableLinks)  return (callback(null, null));

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;

    var currentSession;
    var currentLinkObject = {};
    var dateNow = moment().valueOf();

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {

      currentLinkObject = links[ageLinksIndex];

      if ((typeof currentLinkObject !== 'undefined') && self.disableLinks) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD';
      } 
      else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD';
      } 
      else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.source.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD SOURCE';
      } else if ((typeof currentLinkObject !== 'undefined') && currentLinkObject.target.isDead) {
        deadLinksHash[currentLinkObject.linkId] = 'DEAD TARGET';
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
      return (callback(null, null));
    }
  }

  function processDeadGroupsHash(callback) {

    if (Object.keys(deadGroupsHash).length == 0) {
      // console.warn("NO DEAD GROUPS");
      return (callback());
    }
    // console.error("processDeadGroupsHash\n" + jsonPrint(deadGroupsHash));

    var ageGroupsLength = groups.length - 1;
    var ageGroupsIndex = groups.length - 1;
    var group;

    for (ageGroupsIndex = ageGroupsLength; ageGroupsIndex >= 0; ageGroupsIndex -= 1) {
      var group = groups[ageGroupsIndex];
      if (deadGroupsHash[group.groupId]) {
        nodeDeleteQueue.push(group.groupId);
        groups.splice(ageGroupsIndex, 1);
        delete deadGroupsHash[group.groupId];
        delete groupYpositionHash[group.groupId];
        console.log("XXX GROUP: " + group.groupId);
      }
    }

    if (ageGroupsIndex < 0) {
      return (callback());
    }
  }


  function processDeadNodesHash(callback) {

    if (Object.keys(deadNodesHash).length == 0) {
      return (callback());
    }

    var deadNodeIds = Object.keys(deadNodesHash);

    force.stop();
    forceStopped = true;

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if (deadNodesHash[node.nodeId]) {
        nodeDeleteQueue.push(node.nodeId);
        nodes.splice(ageNodesIndex, 1);
        delete deadNodesHash[node.nodeId];
        if (node.isGroupNode){
          for (var i=groups.length-1; i >= 0; i -= 1) {
            if (node.nodeId == groups[i].node.nodeId) {
              console.log("XXX GROUP | " + groups[i].node.nodeId);
              delete groupYpositionHash[groups[i].groupId];
              groups.splice(i, 1);
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
              sessions.splice(i, 1);
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
      force.nodes(nodes);
      return (callback());
    }
  }

  function processDeadLinksHash(callback) {

    if (self.disableLinks){
      if (links.length > 0) {
        force.stop();
        forceStopped = true;
        links = [];
        force.links(links);
        return (callback());
      }
      return (callback());
    }

    force.stop();
    forceStopped = true;

    var ageLinksLength = links.length - 1;
    var ageLinksIndex = links.length - 1;
    var link;

    for (ageLinksIndex = ageLinksLength; ageLinksIndex >= 0; ageLinksIndex -= 1) {
      link = links[ageLinksIndex];
      if (deadLinksHash[link.linkId]) {
        // console.warn("XXX DEAD LINK | " + link.linkId);
        linkDeleteQueue.push(link.linkId);
        links.splice(ageLinksIndex, 1);
        force.links(links);
        delete deadLinksHash[link.linkId];
      }
    }

    if ((links.length == 0) || (ageLinksIndex < 0)) {
      return (callback());
    }
  }

  // ===================================================================

  function updateGroupWords(callback) {

    var groupWords = groupSvgGroup.selectAll("#group")
      .data(groups, function(d) {
        return d.nodeId;
      });

    groupWords
      .text(function(d) {
        return d.text;
      })
      .style("fill", function(d) {
        if (d.age < 0.01*nodeMaxAge) {
          return "FFFFFF";
        }
        else {
          return d.interpolateColor(1e-6);
        }
      })
      // .style("fill-opacity", function(d){
      //   return 1.0 - d.ageMaxRatio;
      // })
      .style("fill-opacity", function(d) {
        return Math.max(wordOpacityScale(d.age + 1), minOpacity)
      })
      .transition()
        .duration(defaultFadeDuration)
        // .attr("x", xposition)
        // .style("fill-opacity", function(d){
        //   return 1.0 - d.ageMaxRatio;
        // })
        .attr("y", ypositionGroup);

    groupWords
      .enter()
      .append("svg:text")
      .attr("id", "group")
      .attr("x", xposition)
      .attr("y", ypositionGroup)
      .text(function(d) {
        return d.text;
      })
      .style("fill", "FFFFFF")
      .style("fill-opacity", 1.0)
      .style("font-size", "2.1vmin")
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver);

    groupWords
      .exit()
      .remove();

    return (callback(null, "updateGroupWords"));
  }

  function updateNodes(callback) {

    node = node.data(nodes, function(d) {
        return d.nodeId;
      });

    node.enter()
      .append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) {
        return d.nodeId;
      });

    node
      .exit()
      .remove();

    return (callback(null, "updateNodes"));
  }

  function updateNodeWords(callback) {

    var nodeWords = nodeSvgGroup.selectAll("#word")
      .data(nodes, function(d) {
        return d.nodeId;
      });

    nodeWords
      .text(function(d) {
        return d.text;
      })
      .style("font-size", function(d){
        if (d.isIgnored) {
          return minFontSize + "px";
        }
        else {
          return fontSizeScale(d.mentions) + "px";
        }
      })
      .attr("bboxWidth", function(d, i){
        nodes[i].bboxWidth = this.getBBox().width;
        var cNode = nodeHashMap.get(d.nodeId);
        cNode.bboxWidth = this.getBBox().width;
        nodeHashMap.set(d.nodeId, cNode);
        // console.log("bboxWidth " + nodes[i].bboxWidth);
        return this.getBBox().width;
      })
      .style("fill", function(d) {
        if (d.age < 0.01*nodeMaxAge) {
          return "FFFFFF";
        }
        else {
          return d.interpolateColor(1e-6);
        }
      })
      // .style("fill-opacity", function(d) {
      //   if (self.removeDeadNodes) {
      //     return wordOpacityScale(d.age + 1);
      //   } else {
      //     return Math.max(wordOpacityScale(d.age + 1), minOpacity)
      //   }
      // })
      .transition()
        .duration(defaultFadeDuration)
        .style("fill-opacity", function(d) {
          if (self.removeDeadNodes) {
            return wordOpacityScale(d.age + 1);
          } else {
            return Math.max(wordOpacityScale(d.age + 1), minOpacity)
          }
        })
        .attr("x", xposition)
        .attr("y", ypositionWord);

    nodeWords
      .enter()
      .append("svg:text")
      .attr("id", "word")
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("x", marginRightWords)
      .attr("y", ypositionWord)
      .text(function(d) {
        return d.text;
      })
      .style("text-anchor", "end")
      .style("fill", "#FFFFFF")
      .style("fill-opacity", 1e-6)
      .style("font-size", minFontSize + "px")
      .attr("bboxWidth", function(d, i){
        nodes[i].bboxWidth = this.getBBox().width;
        // console.log("bboxWidth " + nodes[i].bboxWidth);
        return this.getBBox().width;
      })
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .transition()
        .duration(defaultFadeDuration)
        .attr("x", xposition)
        .attr("y", ypositionWord);


    nodeWords
      .exit()
      // .attr("class", "exit")
      .remove();

    return (callback(null, "updateNodeWords"));
  }

  function updateLinks(callback) {

    // console.log("updateLinks");

    link = linkSvgGroup.selectAll("line").data(force.links(),
      function(d) {
        return d.source.nodeId + "-" + d.target.nodeId;
      });

    link
      .attr("x1", function(d) {
        // console.log("source\n" + jsonPrint(d.source));
        var sourceNode = nodeHashMap.get(d.source.nodeId);
        if (sourceNode) return sourceNode.x;
        return 0;
      })
      .attr("y1", function(d) {
        var sourceNode = nodeHashMap.get(d.source.nodeId);
        if (sourceNode) return sourceNode.y;
        return 0;
      })
      .attr("x2", function(d) {
        var targetNode = nodeHashMap.get(d.target.nodeId);
        if (targetNode) return targetNode.x;
        return 0;
      })
      .attr("y2", function(d) {
        var targetNode = nodeHashMap.get(d.target.nodeId);
        if (targetNode) return targetNode.y;
        return 0;
      })
      .style('stroke', function(d) {
        return linkColorScale(d.ageMaxRatio);
      })
      .style('opacity', function(d) {
        return 1.0 - d.ageMaxRatio;
      });

    link.enter()
      .append("svg:line")
      .attr("class", "link")
      .attr("x1", function(d) {
        // console.log("source\n" + jsonPrint(d.source));
        var sourceNode = nodeHashMap.get(d.source.nodeId);
        if (sourceNode) return sourceNode.x;
        return 0;
      })
      .attr("y1", function(d) {
        var sourceNode = nodeHashMap.get(d.source.nodeId);
        if (sourceNode) return sourceNode.y;
        return 0;
      })
      .attr("x2", function(d) {
        var targetNode = nodeHashMap.get(d.target.nodeId);
        if (targetNode) return targetNode.x;
        return 0;
      })
      .attr("y2", function(d) {
        var targetNode = nodeHashMap.get(d.target.nodeId);
        if (targetNode) return targetNode.y;
        return 0;
      })
      .style('stroke', function(d) {
        return linkColorScale(1.0);
      })
      .style('stroke-width', 1.75)
      .style('opacity', 1e-6)
      .transition()
      .duration(defaultFadeDuration)
      .style('opacity', 1.0);

    link
      .exit()
      .remove();

    return (callback(null, "updateLinks"));
  }


  // function updateRecentNodes(node) {

  //   var newNodeFlag = true;
  //   var i = 0;
  //   for (i = recentNodeArray.length - 1; i >= 0; i--) {

  //     if (recentNodeArray[i].nodeId == node.nodeId) {
  //       newNodeFlag = false;
  //       recentNodeArray.splice(i, 1);
  //     }
  //   }

  //   if ((i < 0) && (newNodeFlag)) {
  //     newNodeFlag = false;
  //     recentNodeArray.unshift(node);
  //   }

  //   if (recentNodeArray.length > maxRecentWords) {
  //     recentNodeArray.pop();
  //   };
  // }

  function updateTickerDisplay() {

    updateTickerDisplayReady = false;

    async.series(
      [
        ageGroups,
        ageSessions,
        ageNodes,
        ageLinks,
        processDeadNodesHash,
        processDeadSessionsHash,
        processDeadGroupsHash,
        processDeadLinksHash,
        rankGroups,
        // rankNodes,
        // updateGroups,
        updateGroupWords,
        // updateSessions,
        // updateNodes,
        updateNodeWords,
        updateLinks,
      ],

      function(err, result) {
        if (err) {
          console.error("*** ERROR: updateTickerDisplayReady *** \nERROR: " + err);
        }

        if (forceStopped) {
          force.start();
          forceStopped = false;
        }

        updateTickerDisplayReady = true;
        groupsLengthYposition = groups.length;
      }
    );
  }


  // ===================================================================

  function rankNodes(callback) {
    if (nodes.length == 0) return (callback());
    var sortedNodeArray = sortByProperty(nodes, 'mentions');

    // console.warn("sortedNodeArray\n" + jsonPrint(sortedNodeArray));
    // console.error("RANKING " + sortedNodeArray.length + " nodes");
    var node;

    async.forEachOf(sortedNodeArray, function(node, rank, cb) {
      node.rank = rank;
      nodes[rank] = node;
      // console.error("RANK " + rank + " | " + node.mentions + " | " + nodeId);
      cb();
    }, function(err) {
      // console.warn("RANKING COMPLETE | " + sortedNodeIds.length + " nodes");
      return (callback());
    });
  }

  function rankGroups(callback) {
    if (groups.length == 0) return (callback());
    // var sortedGroupArray = sortByProperty(groups, 'mentions');
    var sortedGroupArray = sortByProperty(groups, 'totalWordChainIndex');

    // console.warn("sortedNodeArray\n" + jsonPrint(sortedNodeArray));
    // console.error("RANKING " + sortedNodeArray.length + " nodes");
    var group;

    async.forEachOf(sortedGroupArray, function(group, rank, cb) {
      group.rank = rank;
      groups[rank] = group;
      // console.error("RANK " + rank + " | " + node.mentions + " | " + nodeId);
      cb();
    }, function(err) {
      // console.warn("RANKING COMPLETE | " + sortedNodeIds.length + " nodes");
      return (callback());
    });
  }

  function rankSessions(callback) {
    if (sessions.length == 0) return (callback());
    var sortedSessionArray = sortByProperty(sessions, 'wordChainIndex');

    // console.warn("sortedNodeArray\n" + jsonPrint(sortedNodeArray));
    // console.error("RANKING " + sortedNodeArray.length + " nodes");
    var session;

    async.forEachOf(sortedSessionArray, function(session, rank, cb) {
      session.rank = rank;
      sessions[rank] = session;
      // console.error("RANK " + rank + " | " + node.mentions + " | " + nodeId);
      cb();
    }, function(err) {
      // console.warn("RANKING COMPLETE | " + sortedNodeIds.length + " nodes");
      return (callback());
    });
  }

  // ===================================================================

  function compareMentions(a, b) {
    if (a.mentions > b.mentions)
      return -1;
    else if (a.mentions < b.mentions)
      return 1;
    else
      return 0;
  }

  function pad(num, size) {
    var s = "0000000000" + num;
    return s.substr(s.length - size);
  }

  function sortByProperty(array, property) {

    // console.log("array\n" + jsonPrint(array));

    var mapped = array.map(function(node, i) {
      return { index: i, value: pad(node[property], 10) + "_" + node.text };
    });

    mapped.sort(function(a, b) {
      // return +(a.value > b.value) || +(a.value === b.value) - 1;
      if (a.value > b.value)
        return -1;
      else if (a.value < b.value)
        return 1;
      else
        return 0;
    });

    var result = mapped.map(function(node) {
      // console.log("node.index: " + node.index);
      return array[node.index];
    });

    return result;
  }

  // ===================================================================

  function nodeFill(age) {
    return fillColorScale(age);
  }

  function nodeMouseOver(d) {

    mouseHoverFlag = true;
    mouseHoverNodeId = d.nodeId;

    var nodeId = d.nodeId;
    var sId = d.sessionId;
    var uId = d.userId;
    var rank = d.rank;
    var mentions = d.mentions;

    d3.select("body").style("cursor", "pointer");

    d3.select(this)
      .attr("mouseover", true)
      .style("opacity", 1)
      .style("fill", "yellow")
      .style("fill-opacity", 1);

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1.0);

    var tooltipString = nodeId 
      + "<br>GROUP: " + d.groupId 
      + "<br>CHAN: " + d.channel 
      // + "<br>WO: " + d.widthOffset 
      + "<br>WCI: " + d.wordChainIndex 
      + "<br>MENTIONS: " + mentions 
      + "<br>AGE: " + d.age 
      + "<br>RANK: " + rank;

    divTooltip.html(tooltipString)
      .style("left", (d3.event.pageX - 40) + "px")
      .style("top", (d3.event.pageY - 50) + "px");
  }

  function nodeMouseOut() {

    mouseHoverFlag = false;

    d3.select("body").style("cursor", "default");

    d3.select(this)
      .style("opacity", 1)
      .attr("mouseover", false)
      .style("fill", function(d) {
        return d.newFlag ? "red" : "#ffffff";
      })
      .style("fill-opacity", function(d) {
        if (d3.select(this).attr("mouseOverFlag") == "true") {
          return 1;
        } else {
          if (self.removeDeadNodes) {
            return wordOpacityScale(d.age + 1);
          } else {
            return Math.max(wordOpacityScale(d.age + 1), minOpacity)
          }
        }
      });

    divTooltip.transition()
      .duration(defaultFadeDuration)
      .style("opacity", 1e-6);
  }

  function nodeClick(d) {
    launchSessionView(d.sessionId);
  }

  function nodeFill(age) {
    return fillColorScale(age);
  }

  // ===================================================================



  this.addSession = function(newSession) {
    if (!forceStopped){
      force.stop();
      forceStopped = true;
    }
    sessions.push(newSession);
  }

  this.addGroup = function(newGroup) {
    force.stop();
    forceStopped = true;
    groups.push(newGroup);
  }

  var sessionPreviousNode = {};

  var wordNodeHashMap = {};

  this.addNode = function(newNode) {
    if (!newNode.isSession 
      && !newNode.isSessionNode 
      && !newNode.isGroup 
      && !newNode.isGroupNode) {

      if (!newNode.isIgnored && (newNode.mentions > currentMaxMentions)) {
        currentMaxMentions = newNode.mentions;
        fontSizeScale = d3.scale.linear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]);
        // console.log("NEW MAX MENTIONS" 
        //   + " | " + newNode.text 
        //   + " | " + currentMaxMentions 
        //   + " | " + fontSizeScale(currentMaxMentions)
        // );
      }


      if (groupHashMap.has(newNode.groupId)){
        var cGroup = groupHashMap.get(newNode.groupId);
        newNode.colors = {};
        newNode.colors = cGroup.colors;
        newNode.interpolateColor = cGroup.interpolateColor;
      }
      else {
        newNode.colors = {};
        newNode.colors = defaultColors;
        newNode.interpolateColor = defaultInterpolateColor;
      }

      newNode.x = width;
      newNode.randomYoffset = randomIntFromInterval(-10,10);

      if (typeof sessionNodeArrayHash[newNode.sessionId] !== 'undefined'){
        sessionNodeArrayHash[newNode.sessionId].push(newNode.nodeId);
      }
      else {
        sessionNodeArrayHash[newNode.sessionId] = [];
        sessionNodeArrayHash[newNode.sessionId].push(newNode.nodeId);
      }


      if (typeof sessionPreviousNode[newNode.sessionId] !== 'undefined'){
        var prevNodeId = sessionPreviousNode[newNode.sessionId];
        if (nodeHashMap.has(prevNodeId)){
          var prevNode = nodeHashMap.get(prevNodeId);
          newNode.prevNodeId = prevNodeId;

          if (typeof prevNode.randomYoffset !== 'undefined') {
            while (Math.abs(newNode.randomYoffset - prevNode.randomYoffset) < 5){
              newNode.randomYoffset = randomIntFromInterval(-10,10);
              // console.log("while randomYoffset | prevNode: " + prevNode.randomYoffset + " | newNode: " + newNode.randomYoffset);
            }
            // console.log("randomYoffset | prevNode: " + prevNode.randomYoffset + " | newNode: " + newNode.randomYoffset);
          }
        }
      }

      nodeMouseOut.y = height;

      sessionPreviousNode[newNode.sessionId] = newNode.nodeId;

      force.stop();
      forceStopped = true;
      nodes.push(newNode);
      force.nodes(nodes);

      if (!newNode.isGroupNode && !newNode.isSessionNode && !ignoreWordHashMap.has(newNode.text) && (typeof wordNodeHashMap[newNode.text] === 'undefined')){
        wordNodeHashMap[newNode.text] = [];
        wordNodeHashMap[newNode.text].push(newNode.nodeId);
      }
      else if (!newNode.isGroupNode && !newNode.isSessionNode && !ignoreWordHashMap.has(newNode.text)) {
        for (var i=0; i < wordNodeHashMap[newNode.text].length; i++){
          var cNodeId = wordNodeHashMap[newNode.text][i];
          if (nodeHashMap.has(cNodeId)) {
            var cNode = nodeHashMap.get(cNodeId);

            if (cNode.isGroupNode || cNode.isSessionNode || ignoreWordHashMap.has(cNode.text)) return;
            var linkId = cNodeId + "_" + newNode.nodeId;
            var newLink = {
              linkId: linkId,
              groupId: newNode.groupId,
              age: 0,
              isDead: false,
              source: newNode,
              target: cNode,
              isGroupLink: false
            };
            // self.addLink(newLink);
            // force.links(links);
          }

        }
        wordNodeHashMap[newNode.text].push(newNode.nodeId);
      }

      // console.log("NEW NODE\n" + jsonPrint(newNode));
    }
    // updateRecentNodes(newNode);
  }

  this.deleteNode = function(nodeId) {

    var nodesLength = nodes.length - 1;

    var node;
    var deadNodeFlag = false;

    var nodeIndex = nodesLength;

    for (nodeIndex = nodesLength; nodeIndex >= 0; nodeIndex -= 1) {
      node = nodes[nodeIndex];
      if (node.nodeId == nodeId) {
          nodes.splice(nodeIndex, 1);
          delete wordNodeHashMap[node.text];
        }
      }
  }

  this.addLink = function(newLink) {

    // console.warn("addLink\n" + jsonPrint(newLink));

    if (self.disableLinks)  return ;
    force.stop();
    forceStopped = true;
    links.push(newLink);
    if (newLink.isGroupLink){
      // console.error("ADD GROUP LINK | " + newLink.linkId);
    }
    force.links(links);
  }

  this.deleteLink = function(linkId) {

    force.stop();
    forceStopped = true;

    var linksLength = links.length - 1;

    var linkIndex = linksLength;

    for (linkIndex = linksLength; linkIndex >= 0; linkIndex -= 1) {
      if (linkId == links[linkIndex].linkId) {
        links.splice(linkIndex, 1);
        force.links(links);
        return;
      }
    }

    if (linkIndex < 0) {
      return;
    }
  }

  this.deleteSessionLinks = function(sessionId) {
    if (self.disableLinks)  return ;

    var deletedSession;
    var deadSessionFlag = false;

    var sessionsLength = sessions.length - 1;
    var sessionIndex = sessions.length - 1;

    for (sessionIndex = sessionsLength; sessionIndex >= 0; sessionIndex -= 1) {
      deletedSession = sessions[sessionIndex];
      if (deletedSession.sessionId == sessionId) {

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
          self.deleteNode(deletedSession.node.nodeId);
          sessions.splice(sessionIndex, 1);
          return;
        }
      }
    }
    if ((sessionIndex < 0) && (linkIndex < 0)) {
      return;
    }
  }

  // ===================================================================

  // this.initD3timer = function() {
  //   d3.timer(function() {
  //     tickNumber++;
  //     dateNow = moment().valueOf();
  //     if (updateTickerDisplayReady && !mouseMovingFlag) updateTickerDisplay();
  //   });
  // }

  this.initD3timer = function() {

    force = d3.layout.force()
      .nodes(nodes)
      .links(links)
      .gravity(gravity)
      .friction(friction)
      .charge(charge)
      .linkStrength(globalLinkStrength)
      .size([svgTickerLayoutAreaWidth, svgTickerLayoutAreaHeight]);
      // .on("tick", tick);

      d3.timer(function() {
        tickNumber++;
        dateNow = moment().valueOf();
        if (!pauseFlag 
          && !updateNodeFlag 
          && updateTickerDisplayReady 
          && (!mouseFreezeEnabled || (mouseFreezeEnabled && !mouseMovingFlag))){
          updateTickerDisplay();
        }
      });
  }

  // ===================================================================

  this.resize = function() {
    console.log("RESIZE");

    if (window.innerWidth !== 'undefined') {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    else if (document.documentElement !== 'undefined' && document.documentElement.clientWidth !== 'undefined' && document.documentElement.clientWidth !== 0) {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
    }
    // older versions of IE
    else {
      width = document.getElementsByTagName('body')[0].clientWidth;
      height = document.getElementsByTagName('body')[0].clientHeight;
    }

    console.log("width: " + width + " | height: " + height);

    d3LayoutWidth = width * D3_LAYOUT_WIDTH_RATIO; // double the width for now
    d3LayoutHeight = height * D3_LAYOUT_HEIGHT_RATIO;

    svgcanvas
      .attr("width", SVGCANVAS_WIDTH_RATIO * width)
      .attr("height", SVGCANVAS_HEIGHT_RATIO * height);

    svgTickerLayoutAreaWidth = d3LayoutWidth * TICKER_LAYOUT_WIDTH_RATIO;
    svgTickerLayoutAreaHeight = d3LayoutHeight * TICKER_LAYOUT_HEIGHT_RATIO;

    svgTickerLayoutArea.attr("width", svgTickerLayoutAreaWidth)
      .attr("height", svgTickerLayoutAreaHeight);

    svgTickerLayoutArea.attr("x", 0);
    svgTickerLayoutArea.attr("y", 0);
  }

  // ===================================================================
  var testAddNodeInterval;
  var testSessionIndex = 0;
  var testDeleteNodeInterval;

  function deleteRandomNode() {
    if (nodes.length == 0) return;
    if ((nodes.length < 5) && (randomIntFromInterval(0, 100) < 80)) return;
    if (randomIntFromInterval(0, 100) < 5) return;
    var index = randomIntFromInterval(0, nodes.length - 1);
    var node = nodes[index];
    self.deleteNode(node.nodeId);
  }

  function addRandomNode() {

    var randomNumber360 = randomIntFromInterval(0, 360);

    var sessionId = 'session_' + randomNumber360;
    var userId = 'user_' + randomNumber360;
    var nodeId = 'testNode' + tickNumber;
    var mentions = randomIntFromInterval(0, 1000000);
    var wordChainIndex = tickNumber;
    var text = randomNumber360 + ' | ' + mentions;

    var startColor = "hsl(" + randomNumber360 + ",100%,50%)";
    var endColor = "hsl(" + randomNumber360 + ",100%,30%)";

    var interpolateNodeColor = d3.interpolateHsl(startColor, endColor);

    var newNode = {
      nodeId: nodeId,
      sessionId: sessionId,
      userId: userId,
      text: text,
      mentions: mentions,
      wordChainIndex: wordChainIndex,
      startColor: startColor,
      endColor: endColor,
      interpolateColor: interpolateNodeColor,
      x: 0.5 * width + randomIntFromInterval(0, 100),
      y: 0.5 * height + randomIntFromInterval(0, 100),
      age: 0,
      lastSeen: dateNow,
    }

    self.addNode(newNode);
  }

  this.clearTestAddNodeInterval = function () {
    clearInterval(testAddNodeInterval);
  }

  this.initTestAddNodeInterval = function (interval) {
    clearInterval(testAddNodeInterval);
    testAddNodeInterval = setInterval(function() {
      addRandomNode();
    }, interval);
  }

  this.clearTestDeleteNodeInterval = function () {
    clearInterval(testDeleteNodeInterval);
  }

  this.initTestDeleteNodeInterval = function (interval) {
    clearInterval(testDeleteNodeInterval);
    testDeleteNodeInterval = setInterval(function() {
      deleteRandomNode();
    }, interval);
  }

  function getSortedKeys(hmap) {
    var keys = [];
    hmap.forEach(function(value, key) {
      keys.push(key);
    });
    return keys.sort(function(a, b) {
      return hmap.get(b).mentions - hmap.get(a).mentions
    });
  }

  function xposition(d, i) {

    if (d.isGroup) {
      return marginRightGroups + "%";
    }
    else if (d.isSession) {
      return marginRightSessions + "%";
    }
    else {

      var value = marginRightWords * width / 100;
      var nodeSeen = false;
      var length = sessionNodeArrayHash[d.sessionId].length;
      var i;
      // value = marginRightWords - (100.0*(d.ageMaxRatio));

      for (i=0; i<length; i++){

        var cNodeId = sessionNodeArrayHash[d.sessionId][i];
        var cNode = nodeHashMap.get(cNodeId);

        if (d.nodeId == cNodeId){
          nodeSeen = true;
          // if (typeof d.bboxWidth !== 'undefined') value = value+d.bboxWidth;
          if (nodeHashMap.has(cNodeId)){
            if (typeof cNode.bboxWidth !== 'undefined') value = value+cNode.bboxWidth;
          }
        }
        if (nodeSeen){
          if (nodeHashMap.has(cNodeId)){
            if (typeof cNode.bboxWidth !== 'undefined') value = value-cNode.bboxWidth-10;
          }
        }
      }

      if (i == length){
        // d.x = value;
        return (value/width)*100 + "%";
      }

    }
  }



  function ypositionWord(d, i) {

    var value;

    if (typeof groupYpositionHash[d.groupId] !== 'undefined') {
      var groupYpos = groupYpositionHash[d.groupId][d.groupId];
      groupYpositionHash[d.groupId][d.sessionId] = groupYpos;
      var sessionIds = Object.keys(groupYpositionHash[d.groupId]);
      sessionIds.sort();
      var numSessions = sessionIds.length;
      var index = 0;
      sessionIds.forEach(function(sessionId){
        if (sessionId == d.groupId) {
          numSessions--;
        }
        else {
          var tempValue = groupYpos + (lineHeight * index);
          groupYpositionHash[d.groupId][sessionId] = tempValue;
          index++;
          numSessions--;
        }
      });
      if (numSessions == 0) {
        value = groupYpositionHash[d.groupId][d.sessionId];
        d.y = value * height / 100;
        nodes[i] = d;
        nodeHashMap.set(d.nodeId, d);
        return value + "%";
      }
    }
    else {
      groupYpositionHash[d.groupId] = {};
      groupYpositionHash[d.groupId][d.groupId] = 25;
      groupYpositionHash[d.groupId][d.sessionId] = groupYpositionHash[d.groupId][d.groupId];
      value = groupYpositionHash[d.groupId][d.groupId];
      d.y = value * height / 100;
      nodes[i] = d;
      nodeHashMap.set(d.nodeId, d);
      return value + "%";
    }
  }

  function ypositionGroup(d, i) {

    var value;

    if (typeof d.rank === 'undefined') {
      value = marginTopSessions + ((100-marginTopSessions) * 10 / (groups.length))
      if (typeof groupYpositionHash[d.groupId] === 'undefined') {
        groupYpositionHash[d.groupId] = {};
        groupYpositionHash[d.groupId][d.groupId] = value;
      }
      else {
        groupYpositionHash[d.groupId][d.groupId] = value;
      }
      return value + "%";
    }
    else {
      value = marginTopSessions + ((100-marginTopSessions) * d.rank / (groups.length))
      if (typeof groupYpositionHash[d.groupId] === 'undefined') groupYpositionHash[d.groupId] = {};
      groupYpositionHash[d.groupId][d.groupId] = value;
      return value + "%";
    }
  }

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);
}
