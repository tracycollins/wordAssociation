/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewTicker() {

  var self = this;
  self.disableLinks = true;

  var runningFlag = false;

  var antonymFlag = false;
  var fixedGroupsFlag = false;
  var lineHeight = 3;

  // ==============================================
  // GLOBAL VARS
  // ==============================================
  var sessionNodeArrayHash = {};  

  var groupYpositionHash = {};

  var minFontSize = 20;
  var maxFontSize = 48;

  var currentMaxMentions = 2;

  var newFlagRatio = 0.01;
  var maxWords = 100;
  var maxOpacity = 1.0;
  var minOpacity = 0.3;
  var defaultFadeDuration = 50;

  var testModeEnabled = false;

  var tickNumber = 0;
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

  var newWordFlag = false;

  var maxSessionRows = 25;
  var maxWordRows = 25;

  var marginTopGroups = 15; // %
  var marginLeftGroups = 5;
  var marginRightGroups = 82;

  var marginTopSessions = 15; // %
  var marginLeftSessions = 5;
  var marginRightSessions = 85;

  var marginTopWords = 15; // %
  var marginLeftWords = 15;
  var marginRightWords = 75;

  var colSpacing = 20;

  var maxRecentWords = maxWordRows;
  var wordArray = [];
  var recentNodeArray = [];
  var wordMentionsArray = [];
  var recentWordMentionsArray = [];

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

  var wordBarWidthScale = d3.scaleLinear().domain([1, 2e6]).range([0.1, 65]);
  var wordOpacityScale = d3.scaleLinear().domain([1e-6, 0.1*nodeMaxAge, nodeMaxAge]).range([maxOpacity, 0.4*maxOpacity, 0.2*maxOpacity]);
  var placeOpacityScale = d3.scaleLinear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordBarOpacityScale = d3.scaleLinear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordCloudFontScale = d3.scaleLinear().domain([1, 2e6]).range([2, 8]);
  var wordCloudAgeScale = d3.scaleLinear().domain([1, DEFAULT_MAX_AGE]).range([1, 1e-6]);

  var adjustedAgeRateScale = d3.scalePow().domain([1, 500]).range([1.0, 100.0]);
  var fontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]);

  var sessionCircleRadiusScale = d3.scaleLinear().domain([1, 100000000]).range([5.0, 100.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scaleLinear().domain([1, 100000000]).range([1.0, 30.0]);

  var fillColorScale = d3.scaleLinear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

  var strokeColorScale = d3.scaleLinear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);

  var linkColorScale = d3.scaleLinear().domain([1e-6, 0.5, 1.0]).range(["#cccccc", "#666666", "#444444"]);

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

    groups = [];
    sessions = [];
    nodes = [];

    deadNodesHash = {};

    resetMouseMoveTimer();
    mouseMovingFlag = false;
    self.resize();
    self.resetDefaultForce();

    updateTickerDisplayReady = true;  
  }

  self.setPause = function(pause){
    pauseFlag = pause;
    console.error("PAUSE: " + pauseFlag);
    if (pauseFlag){
    }
  }

  self.updateLinkStrength = function(value) {
    console.log("updateLinkStrength: " + value);
    globalLinkStrength = value;
  }

  self.updateFriction = function(value) {
    friction = value;
  }

  self.updateGravity = function(value) {
    gravity = value;
  }

  self.updateCharge = function(value) {
    charge = value;
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
  // var groupLabelSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  // var groupGnode = groupSvgGroup.selectAll("g.group");
  // var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  
  // var sessionSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "sessionSvgGroup");
  // var sessionLabelSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  // var sessionGnode = sessionSvgGroup.selectAll("g.session");
  // var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  
  var nodeSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  // var nodeLabelSvgGroup = svgTickerLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
  var node = nodeSvgGroup.selectAll("g.node");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var link = linkSvgGroup.selectAll("line");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);


  // ===================================================================
  var simulation;

  function drawSimulation(){
    updateGroupWords();
    updateNodeWords();
  }

  // function ticked() {
  //   updateGroupWords();
  //   updateNodeWords();
  //   updateLinks();
  //   updateSimulation(function(){});
  // }

  function ticked() {
    drawSimulation();
    updateSimulation();
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
      .force("link", d3.forceLink(links).id(function(d) { return d.linkId; }).distance(20).strength(DEFAULT_LINK_STRENGTH))
      .force("charge", d3.forceManyBody().strength(DEFAULT_CHARGE))
      .force("forceX", d3.forceX(svgTickerLayoutAreaWidth/2).strength(DEFAULT_GRAVITY))
      .force("forceY", d3.forceY(svgTickerLayoutAreaHeight/2).strength(DEFAULT_GRAVITY))
      .velocityDecay(DEFAULT_VELOCITY_DECAY)
      .on("tick", ticked);
  }

  this.simulationControl = function(op) {
    // console.warn("SIMULATION CONTROL | OP: " + op);
    switch (op) {
      case 'RESET':
        // self.initD3timer();
        console.warn("SIMULATION CONTROL | OP: " + op);
        self.clearDrawSimulationInterval();
        simulation.reset();
        runningFlag = false;
        // simulation.stop();
      break;
      case 'START':
        console.warn("SIMULATION CONTROL | OP: " + op);
        self.initD3timer();
        simulation.alphaTarget(0.7).restart();
        runningFlag = true;
      break;
      case 'RESUME':
        if (!runningFlag){
          console.warn("SIMULATION CONTROL | OP: " + op);
          runningFlag = true;
          self.clearDrawSimulationInterval();
          simulation.alphaTarget(0.7).restart();
        }
      break;
      case 'PAUSE':
        if (runningFlag){
          console.warn("SIMULATION CONTROL | OP: " + op);
          runningFlag = false;
          simulation.alpha(0);
          simulation.stop();
          self.initDrawSimulationInverval();
        }
      break;
      case 'STOP':
        runningFlag = false;
        console.warn("SIMULATION CONTROL | OP: " + op);
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

  function updateSimulation(callback) {

    async.series(
      {
        deadNode: processDeadNodesHash,
        deadSession: processDeadSessionsHash,
        deadGroup: processDeadGroupsHash,
        deadLink: processDeadLinksHash,
        group: processGroupUpdateQ,
        session: processSessionUpdateQ,
        node: processNodeUpdateQ,
        link: processLinkUpdateQ,
        ageGroup: ageGroups,
        ageSession: ageSessions,
        ageNode: ageNodes,
        ageLink: ageLinks,
        rankGroup: rankGroups
      },

      function(err, results) {
        if (err) {
          console.error("*** ERROR: updateSimulation *** \nERROR: " + err);
        }
        else if (results) {
          var keys = Object.keys(results);

          for (var i=0; i<keys.length; i++){
            if (results[keys[i]]) {
              simulation.nodes(nodes);
              if (runningFlag) self.simulationControl('RESTART');
              break;
            }
          }
        }


        if (typeof callback !== 'undefined') callback(err);
      }
    );
  }

  function ageGroups(callback) {

    var group;
    var age;
    var ageMaxRatio;
    var ageRate;

    var deadGroupFlag = false ;

    var dateNow = moment().valueOf();

    if (groups.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (groups.length > 50) {
      ageRate = adjustedAgeRateScale(groups.length - 50);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }


    var ageGroupsLength = groups.length - 1;
    var ageGroupsIndex = groups.length - 1;

    for (ageGroupsIndex = ageGroupsLength; ageGroupsIndex >= 0; ageGroupsIndex -= 1) {

      group = groups[ageGroupsIndex];

      age = group.age + (ageRate * (dateNow - group.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (group.isDead) {
        deadGroupFlag = true;
        deadGroupsHash[group.groupId] = 1;
        groups[ageGroupsIndex] = group;
      } 
      else if (age >= groupMaxAge) {
        deadGroupFlag = true;
        group.isDead = true;
        deadGroupsHash[group.groupId] = 1;
        groups[ageGroupsIndex] = group;
      } 
      else {
        group.ageUpdated = dateNow;
        group.age = age;
        group.ageMaxRatio = ageMaxRatio;

        if (age < newFlagRatio * groupMaxAge) {
          group.newFlag = true;
        } 
        else {
          group.newFlag = false;
        }
        groups[ageGroupsIndex] = group;
      }
    }

    if (ageGroupsIndex < 0) {
      callback(null, deadGroupFlag);
    }
  }

  var ageSessions = function (callback) {

    var session;
    var age;
    var ageMaxRatio;
    var ageRate;

    var deadSessionFlag = false ;

    var dateNow = moment().valueOf();

    if (sessions.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (sessions.length > 500) {
      ageRate = adjustedAgeRateScale(sessions.length - 500);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }


    var ageSessionsLength = sessions.length - 1;
    var ageSessionsIndex = sessions.length - 1;

    for (ageSessionsIndex = ageSessionsLength; ageSessionsIndex >= 0; ageSessionsIndex -= 1) {

      session = sessions[ageSessionsIndex];

      age = session.age + (ageRate * (dateNow - session.ageUpdated));

      if (session.isDead) {
        deadSessionFlag = true;
        deadSessionsHash[session.sessionId] = 1;
      } else if (age >= sessionMaxAge) {
        deadSessionFlag = true;
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
        sessions[ageSessionsIndex] = session;
   }

    if (ageSessionsIndex < 0) {
      callback(null, deadSessionFlag);
    }
  }

  var ageNodes = function (callback) {

    var node;
    var age;
    var ageMaxRatio;
    var ageRate;

    var deadNodeFlag = false ;

    var dateNow = moment().valueOf();

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

      age = node.age + (ageRate * (dateNow - node.ageUpdated));
      ageMaxRatio = age/nodeMaxAge ;

      if (node.isDead) {
        deadNodesHash[node.nodeId] = 1;
        deadNodeFlag = true;
      } 
      else if (age >= nodeMaxAge) {
        node.ageUpdated = dateNow;
        node.age = age;
        node.ageMaxRatio = ageMaxRatio;
        node.isDead = true;
        nodes[ageNodesIndex] = node;
        deadNodesHash[node.nodeId] = 1;
        deadNodeFlag = true;
      } 
      else {
        node.ageUpdated = dateNow;
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
      group = groups[ageGroupsIndex];
      if (deadGroupsHash[group.groupId]) {
        nodeDeleteQueue.push(group.groupId);
        groups.splice(ageGroupsIndex, 1);
        delete deadGroupsHash[group.groupId];
        // console.log("XXX GROUP: " + group.groupId);
      }
    }

    if (ageGroupsIndex < 0) {
      return (callback());
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

  // ===================================================================

  var t = d3.transition()
    .duration(100);
    // .ease(d3.easeLinear);


  function updateGroupWords() {

    var groupWords = groupSvgGroup.selectAll("text").data(groups, function(d) { return d.nodeId; });

    groupWords
      .text(function(d) { return d.text; })
        .style("fill-opacity", function(d) {
          return Math.max(wordOpacityScale(d.age + 1), minOpacity)
        })
      // .transition()
      //   .duration(defaultFadeDuration)
      //   // .style("fill-opacity", function(d) {
      //   //   return Math.max(wordOpacityScale(d.age + 1), minOpacity)
      //   // })
        .transition()
        .duration(50)
        .attr("y", ypositionGroup);

    groupWords
      .enter()
      .append("svg:text")
      .attr("id", "group")
      .attr("x", xposition)
      .attr("y", ypositionGroup)
      .text(function(d) { return d.text; })
      .style("fill", "FFFFFF")
      .style("fill-opacity", 1e-6)
      .style("font-size", "2.1vmin")
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .merge(groupWords);

    groupWords
      .exit()
      .remove();

  }


  function updateNodeWords() {

    var nodeWords = nodeSvgGroup.selectAll("text").data(nodes, function(d) { return d.nodeId; });

    nodeWords
     .text(function(d) {
        if (antonymFlag && d.antonym) { return '[' + d.antonym + ']';  }
        else if (d.raw == '&amp;') { return '&'; }
        else { return d.raw; }
      })
      .style("font-size", function(d){
        if (d.isIgnored) { return minFontSize + "px"; }
        else { return fontSizeScale(d.mentions) + "px"; }
      })
      .attr("bboxWidth", function(d, i){
        nodes[i].bboxWidth = this.getBBox().width;
        var cNode = nodeHashMap.get(d.nodeId);
        cNode.bboxWidth = this.getBBox().width;
        nodeHashMap.set(d.nodeId, cNode);
        return this.getBBox().width;
      })
      .style("fill", function(d) {
        if (d.age < 0.01*nodeMaxAge) { return "FFFFFF";  }
        else { return d.interpolateNodeColor(1e-6); }
      })
      // .transition()
      //   .duration(defaultFadeDuration)
        .style("fill-opacity", function(d) {
          if (self.removeDeadNodes) {
            return wordOpacityScale(d.age + 1);
          } else {
            return Math.max(wordOpacityScale(d.age + 1), minOpacity)
          }
        })
        .transition()
        .duration(50)
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
      .on("click", nodeClick)
      .merge(nodeWords);

    nodeWords
      .exit()
      .remove();

  }

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


  function updateRecentNodes(node) {

    var newNodeFlag = true;
    var i = 0;
    for (i = recentNodeArray.length - 1; i >= 0; i--) {

      if (recentNodeArray[i].nodeId == node.nodeId) {
        newNodeFlag = false;
        recentNodeArray.splice(i, 1);
      }
    }

    if ((i < 0) && (newNodeFlag)) {
      newNodeFlag = false;
      recentNodeArray.unshift(node);
    }

    if (recentNodeArray.length > maxRecentWords) {
      recentNodeArray.pop();
    };
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
      callback(null, null);
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
      callback(null, null);
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

  var groupUpdateQ = [];
  var sessionUpdateQ = [];
  var nodeUpdateQ = [];
  var linkUpdateQ = [];

  var sessionPreviousNode = {};

  var wordNodeHashMap = {};

  var processGroupUpdateQ = function(callback) {
    var groupsModifiedFlag = false;
    while (groupUpdateQ.length > 0){
      var groupUpdateObj = groupUpdateQ.shift();
      switch (groupUpdateObj.op) {
        case "add":
          groupsModifiedFlag = true;
          if (fixedGroupsFlag) {
            groupUpdateObj.group.node.fx = groupUpdateObj.group.node.x;
            groupUpdateObj.group.node.fy = groupUpdateObj.group.node.y;
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

          var newNode = nodeUpdateObj.node;
          nodesModifiedFlag = true;

          if (!newNode.isSession 
            && !newNode.isSessionNode 
            && !newNode.isGroup 
            && !newNode.isGroupNode) {

            if (!newNode.isIgnored && (newNode.mentions > currentMaxMentions)) {
              currentMaxMentions = newNode.mentions;
              fontSizeScale = d3.scaleLinear().domain([1, currentMaxMentions]).range([minFontSize, maxFontSize]);
              console.warn("NEW MAX MENTIONS" 
                + " | " + newNode.text 
                + " | " + currentMaxMentions 
              );
            }

            newNode.x = width;

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
              }
            }

            nodeMouseOut.y = height;

            sessionPreviousNode[newNode.sessionId] = newNode.nodeId;

            nodes.push(newNode);

            if (!newNode.isGroupNode && !newNode.isSessionNode && !ignoreWordHashMap.has(newNode.text) && (typeof wordNodeHashMap[newNode.text] === 'undefined')){
              wordNodeHashMap[newNode.text] = [];
              wordNodeHashMap[newNode.text].push(newNode.nodeId);
            }
            else if (!newNode.isGroupNode && !newNode.isSessionNode && !ignoreWordHashMap.has(newNode.text)) {
              for (var i=0; i < wordNodeHashMap[newNode.text].length; i++){
                var cNodeId = wordNodeHashMap[newNode.text][i];
                if (!self.disableLinks && nodeHashMap.has(cNodeId)) {
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
                  self.addLink(newLink);
                }

              }
              wordNodeHashMap[newNode.text].push(newNode.nodeId);
            }
          }

          updateRecentNodes(newNode);

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

  this.addSession = function(newSession) {
    sessionUpdateQ.push({op:'add', session: newSession});
  }

  this.addGroup = function(newGroup) {
    console.log("groupUpdateQ");
    groupUpdateQ.push({op:'add', group:newGroup});
  }

  this.addNode = function(newNode) {
    nodeUpdateQ.push({op:'add', node: newNode});
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

  this.deleteSessionLinks = function(sessionId) {
    sessionUpdateQ.push({op:'delete', sessionId: sessionId});
  }

  // ===================================================================

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
    var dateNow = moment().valueOf();

    var sessionId = 'session_' + randomNumber360;
    var userId = 'user_' + randomNumber360;
    var nodeId = 'testNode' + tickNumber;
    var mentions = randomIntFromInterval(0, 1000000);
    var wordChainIndex = tickNumber;
    var text = randomNumber360 + ' | ' + mentions;

    var startColor = "hsl(" + randomNumber360 + ",100%,50%)";
    var endColor = "hsl(" + randomNumber360 + ",100%,30%)";

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

  var rows = maxWordRows;
  var cols = 5;


  function ypositionGroup(d, i) {

    var value;
    // value = groupYpositionHash[d.groupId] + (0.5 * d.randomYoffset);

    if (typeof groupYpositionHash[d.groupId] === 'undefined') {
      value = 25;
      groupYpositionHash[d.groupId] = {};
      groupYpositionHash[d.groupId][d.groupId] = value;
      d.fy = value * height / 100;
      return value + "%";
    }
    else {
      value = groupYpositionHash[d.groupId][d.groupId];
      d.fy = value * height / 100;
      return value + "%";
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
      if (typeof groupYpositionHash[d.groupId] === 'undefined') {
        groupYpositionHash[d.groupId] = {};
        groupYpositionHash[d.groupId][d.groupId] = value;
      }
      else {
        groupYpositionHash[d.groupId][d.groupId] = value;
      }
      return value + "%";
    }
  }

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);
}
