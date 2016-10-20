/*ver 0.47*/
/*jslint node: true */

"use strict";

function ViewHistogram() {

  var self = this;

  // ==============================================
  // GLOBAL VARS
  // ==============================================

  var age;

  var newFlagRatio = 0.01;
  var maxWords = 100;
  // var removeDeadNodes = false;
  var maxOpacity = 0.9;
  var minOpacity = 0.3;
  var defaultFadeDuration = 150;

  var testModeEnabled = false;

  var tickNumber = 0;
  var width = window.innerWidth * 1;
  var height = window.innerHeight * 1;

  var newWordFlag = false;

  var maxSessionRows = 25;
  var maxWordRows = 25;

  var marginTopGroups = 15; // %
  var marginLeftGroups = 5;

  var marginTopSessions = 15; // %
  var marginLeftSessions = 5;

  var marginTopWords = 15; // %
  var marginLeftWords = 15;

  var colSpacing = 20;

  var maxY = (marginTopWords + (2 * maxWordRows)) + "%";

  var maxRecentWords = maxWordRows;
  var wordArray = [];
  var recentNodeArray = [];
  var wordMentionsArray = [];
  var recentWordMentionsArray = [];

  var dateNow = moment().valueOf();
  var defaultDateTimeFormat = "YYYY-MM-DD HH:mm:ss ZZ";
  var defaultTimePeriodFormat = "HH:mm:ss";

  var mouseFreezeEnabled = true;
  var mouseMovingFlag = false;
  var mouseHoverFlag = false;
  var mouseOverRadius = 10;
  var mouseMoveTimeoutInterval = 1000;
  var mouseHoverNodeId;

  var updateHistogramDisplayReady = true;

  var showStatsFlag = false;

  var groupMaxAge = window.DEFAULT_MAX_AGE;
  var sessionMaxAge = window.DEFAULT_MAX_AGE;
  var nodeMaxAge = window.DEFAULT_MAX_AGE;

  var DEFAULT_CONFIG = {
    'nodeMaxAge': window.DEFAULT_MAX_AGE
  };

  var config = DEFAULT_CONFIG;
  self.removeDeadNodes = true;

  var previousConfig = [];

  var defaultTextFill = "#888888";


  var DEFAULT_HISTOGRAM_CONFIG = {
    'ageRate': window.DEFAULT_AGE_RATE,
  };

  var ageRate = DEFAULT_HISTOGRAM_CONFIG.ageRate;

  var D3_LAYOUT_WIDTH_RATIO = 1.0;
  var D3_LAYOUT_HEIGHT_RATIO = 1.0;

  var HISTOGRAM_LAYOUT_WIDTH_RATIO = 1.0;
  var HISTOGRAM_LAYOUT_HEIGHT_RATIO = 1.0;

  var SVGCANVAS_WIDTH_RATIO = 1.0;
  var SVGCANVAS_HEIGHT_RATIO = 1.0;

  var createNodeQueue = [];

  var deadGroupsHash = {};
  var deadSessionsHash = {};
  var deadNodesHash = {};

  var newNodes = [];

  var mouseHoverFlag = false;
  var mouseHoverNodeId;


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
  var wordOpacityScale = d3.scaleLinear().domain([0, DEFAULT_MAX_AGE]).range([maxOpacity, minOpacity]);
  var placeOpacityScale = d3.scaleLinear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordBarOpacityScale = d3.scaleLinear().domain([0, DEFAULT_MAX_AGE]).range([0.9, 0.15]);
  var wordCloudFontScale = d3.scaleLinear().domain([1, 2e6]).range([2, 8]);
  var wordCloudAgeScale = d3.scaleLinear().domain([1, DEFAULT_MAX_AGE]).range([1, 1e-6]);


  var adjustedAgeRateScale = d3.scalePow().domain([1, 500]).range([1.0, 100.0]);
  var fontSizeScale = d3.scaleLinear().domain([1, 100000000]).range([20.0, 30]);

  var sessionCircleRadiusScale = d3.scaleLinear().domain([1, 100000000]).range([5.0, 100.0]); // uses wordChainIndex
  var defaultRadiusScale = d3.scaleLinear().domain([1, 100000000]).range([1.0, 30.0]);

  var fillColorScale = d3.scaleLinear()
    .domain([0, 30000, 60000])
    .range(["#555555", "#222222", "#000000"]);

  var strokeColorScale = d3.scaleLinear()
    .domain([0, 30000, 60000])
    .range(["#cccccc", "#444444", "#000000"]);


  console.log("@@@@@@@ CLIENT @@@@@@@@");

  d3.select("body").style("cursor", "default");


  var groups = [];
  var sessions = [];
  var nodes = [];

  // this.removeDeadNodes = true;

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

  var svgHistogramLayoutAreaWidth = d3LayoutWidth * HISTOGRAM_LAYOUT_WIDTH_RATIO;
  var svgHistogramLayoutAreaHeight = d3LayoutHeight * HISTOGRAM_LAYOUT_HEIGHT_RATIO;

  self.reset = function() {
    console.error("RESET");
    nodes = [];
    createNodeQueue = [];

    deadNodesHash = {};

    newNodes = [];
  }

  this.getSessionsLength = function() {
    return sessions.length;
  }


  this.setNodeMaxAge = function(maxAge) {
    nodeMaxAge = maxAge;
    console.warn("SET NODE MAX AGE: " + nodeMaxAge);
  }

  this.displayControlOverlay = function(vis) {
    var visible = "visible";
    if (vis) {
      visible = "visible";
    } else {
      visible = "hidden";
    }
  }

  var mouseMoveTimeout = setTimeout(function() {
    d3.select("body").style("cursor", "none");
    if (!showStatsFlag && !pageLoadedTimeIntervalFlag) {
    }
  }, mouseMoveTimeoutInterval);

  function resetMouseMoveTimer() {
    clearTimeout(mouseMoveTimeout);

    mouseMoveTimeout = setTimeout(function() {
      d3.select("body").style("cursor", "none");

      if (!showStatsFlag && !pageLoadedTimeIntervalFlag) {
      }

      mouseMovingFlag = false;
    }, mouseMoveTimeoutInterval);
  }

  var d3image = d3.select("#d3group");

  var svgcanvas = d3image.append("svg:svg")
    .attr("id", "svgcanvas")
    .attr("x", 0)
    .attr("y", 0);

  var svgHistogramLayoutArea = svgcanvas.append("g")
    .attr("id", "svgHistogramLayoutArea");


  var groupSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "groupSvgGroup");
  var groupLabelSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "groupLabelSvgGroup");
  var groupGnode = groupSvgGroup.selectAll("g.group");
  var groupLabels = groupLabelSvgGroup.selectAll(".groupLabel");
  
  var sessionSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "sessionSvgGroup");
  var sessionLabelSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "sessionLabelSvgGroup");
  var sessionGnode = sessionSvgGroup.selectAll("g.session");
  var sessionLabels = sessionLabelSvgGroup.selectAll(".sessionLabel");
  
  var nodeSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "nodeSvgGroup");
  var nodeLabelSvgGroup = svgHistogramLayoutArea.append("svg:g").attr("id", "nodeLabelSvgGroup");
  var node = nodeSvgGroup.selectAll("g.node");
  var nodeLabels = nodeSvgGroup.selectAll(".nodeLabel");

  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);


  function ageGroups(callback) {

    if (groups.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (groups.length > 100) {
      ageRate = adjustedAgeRateScale(groups.length - 100);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var group;

    var ageGroupsLength = groups.length - 1;
    var ageGroupsIndex = groups.length - 1;

    for (ageGroupsIndex = ageGroupsLength; ageGroupsIndex >= 0; ageGroupsIndex -= 1) {

      group = groups[ageGroupsIndex];

      age = group.age + (ageRate * (dateNow - group.ageUpdated));

      if (group.isDead) {
        deadGroupsHash[group.groupId] = 1;
      } else if (age >= groupMaxAge) {
        group.isDead = true;
        deadGroupsHash[group.groupId] = 1;
      } else {
        group.ageUpdated = dateNow;
        group.age = age;
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
    } else if (sessions.length > 100) {
      ageRate = adjustedAgeRateScale(sessions.length - 100);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var session;

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
        sessionDeleteQueue.push(session.sessionId);
        sessions.splice(ageSessionsIndex, 1);
        delete deadSessionsHash[session.sessionId];
        // console.log("XXX SESSION: " + session.sessionId);
      }
    }

    if (ageSessionsIndex < 0) {
      return (callback());
    }
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

  function ageNodes(callback) {

    var dateNow = moment().valueOf();

    if (nodes.length === 0) {
      ageRate = DEFAULT_AGE_RATE;
    } else if (nodes.length > 100) {
      ageRate = adjustedAgeRateScale(nodes.length - 100);
    } else {
      ageRate = DEFAULT_AGE_RATE;
    }

    var node;

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {

      node = nodes[ageNodesIndex];

      age = node.age + (ageRate * (dateNow - node.ageUpdated));

      if (node.isSessionNode) {
        node.ageUpdated = dateNow;
        node.age = age;
        if (age < newFlagRatio * nodeMaxAge) {
          node.newFlag = true;
        } else {
          node.newFlag = false;
        }
      } else if (self.removeDeadNodes && node.isDead) {
        deadNodesHash[node.nodeId] = 1;
      } else if (self.removeDeadNodes && (age >= nodeMaxAge)) {
        age = nodeMaxAge;
        node.isDead = true;
        deadNodesHash[node.nodeId] = 1;
      } else if ((nodes.length >= maxWords - 1) && (node.rank > maxWords)) {
        deadNodesHash[node.nodeId] = 1;
        // console.warn("XXX NODE " + node.nodeId);
      } else {
        node.ageUpdated = dateNow;
        node.age = Math.min(age, nodeMaxAge);
        if (age < newFlagRatio * nodeMaxAge) {
          node.newFlag = true;
        } else {
          node.newFlag = false;
        }
        // nodes[ageNodesIndex] = node;
      }
    }

    if (ageNodesIndex < 0) {
      return (callback());
    }
  }

  function processDeadNodesHash(callback) {

    if (Object.keys(deadNodesHash).length == 0) {
      // console.warn("NO DEAD NODES");
      return (callback());
    }
    // console.error("processDeadNodesHash\n" + jsonPrint(deadNodesHash));

    var ageNodesLength = nodes.length - 1;
    var ageNodesIndex = nodes.length - 1;
    var node;

    for (ageNodesIndex = ageNodesLength; ageNodesIndex >= 0; ageNodesIndex -= 1) {
      node = nodes[ageNodesIndex];
      if ((typeof node != 'undefined') && deadNodesHash[node.nodeId]) {
        nodeDeleteQueue.push(node.nodeId);
        nodes.splice(ageNodesIndex, 1);
        delete deadNodesHash[node.nodeId];
        self.deleteNode(node.nodeId);
        // console.log("XXX NODE: " + node.nodeId);
      } else if (typeof node == 'undefined') {
        nodes.splice(ageNodesIndex, 1);
      }
    }

    if (ageNodesIndex < 0) {
      return (callback());
    }
  }


  // ===================================================================

  function updateGroups(callback) {

    // console.log("updateSessions");

    groupGnode = groupGnode.data(groups, function(d) {
        return d.groupId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("wordChainIndex", function(d) {
        return d.wordChainIndex;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    groupGnode
      .enter()
      .append("svg:g")
      .attr("class", "group")
      .attr("id", function(d) {
        return d.groupId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("wordChainIndex", function(d) {
        return d.wordChainIndex;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    groupGnode
      .exit()
      .remove();

    return (callback(null, "updateGroups"));
  }

  function updateGroupWords(callback) {

    var groupWords = groupSvgGroup.selectAll("#group")
      .data(groups, function(d) {
        return d.nodeId;
      });

    groupWords
      .attr("class", function(d) {
        return d.newFlag ? "updateNew" : "update";
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .text(function(d) {
        return d.text;
      })
      .style("fill", function(d) {
        if (d.newFlag) {
          return "white";
        } else {
          // return d.interpolateColor(d.age/nodeMaxAge);
          return "red";
        }
      })
      .transition()
      .duration(defaultFadeDuration)
      .attr("x", xposition)
      .attr("y", yposition);

    groupWords
      .enter()
      .append("svg:text")
      .attr("id", "group")
      .attr("groupId", function(d) {
        return d.groupId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("class", "enter")
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        return d.text;
      })
      .style("fill", "FFFFFF")
      .style("fill-opacity", 1)
      .style("font-size", "2.2vmin")
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .transition()
      .duration(defaultFadeDuration)
      .style("fill", "#FF0000");

    groupWords
      .exit()
      .remove();

    return (callback(null, "updateGroupWords"));
  }

  function updateSessions(callback) {

    // console.log("updateSessions");

    sessionGnode = sessionGnode.data(sessions, function(d) {
        return d.sessionId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("wordChainIndex", function(d) {
        return d.wordChainIndex;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    sessionGnode
      .enter()
      .append("svg:g")
      .attr("class", "session")
      .attr("id", function(d) {
        return d.userId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("wordChainIndex", function(d) {
        return d.wordChainIndex;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    sessionGnode
      .exit()
      .remove();

    return (callback(null, "updateSessions"));
  }

  function updateSessionWords(callback) {

    var sessionWords = sessionSvgGroup.selectAll("#session")
      .data(sessions, function(d) {
        return d.userId;
      });

    sessionWords
      .attr("class", function(d) {
        return d.newFlag ? "updateNew" : "update";
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .text(function(d) {
        return d.text;
      })
      .style("fill", function(d) {
        if (d.newFlag) {
          return "white";
        }
        else {
          return d.interpolateColor(1.0);
        }
      })
      .style("fill-opacity", function(d) {
        if (self.removeDeadNodes) {
          return wordOpacityScale(d.age + 1);
        }
        else {
          return Math.max(wordOpacityScale(d.age + 1), minOpacity)
        }
      })
      .transition()
      .duration(defaultFadeDuration)
      .attr("x", xposition)
      .attr("y", yposition);

    sessionWords
      .enter()
      .append("svg:text")
      .attr("id", "session")
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("class", "enter")
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        return d.text;
      })
      .style("fill", "FFFFFF")
      .style("fill-opacity", 1)
      .style("font-size", "2.2vmin");

    sessionWords
      .exit()
      .remove();

    return (callback(null, "updateSessionWords"));
  }

  function updateNodes(callback) {

    // console.log("updateNodes");

    node = node.data(nodes, function(d) {
        return d.nodeId;
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        return d.y;
      })
      .attr("mentions", function(d) {
        return d.mentions;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
      });

    node
      .enter()
      .append("svg:g")
      .attr("class", "node")
      .attr("id", function(d) {
        return d.nodeId;
      })
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("sessionId", function(d) {
        return d.sessionId;
      })
      .attr("userId", function(d) {
        return d.userId;
      })
      .attr("x", xposition)
      .attr("y", yposition)
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("mentions", function(d) {
        return d.mentions;
      })
      .attr("lastSeen", function(d) {
        return d.lastSeen;
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
      .attr("class", function(d) {
        return d.newFlag ? "updateNew" : "update";
      })
      .attr("rank", function(d) {
        return d.rank;
      })
      .text(function(d) {
        return d.text;
      })
      .style("fill", function(d) {
        if (d.newFlag) {
          return "white";
        }
        else if (self.removeDeadNodes) {
          return d.interpolateColor(d.age/nodeMaxAge);
        }
        else {
          return d.interpolateColor(1e-6);
        }
      })
      .style("fill-opacity", function(d) {
        if (self.removeDeadNodes) {
          return wordOpacityScale(d.age + 1);
        } 
        else {
          return Math.max(wordOpacityScale(d.age + 1), minOpacity)
        }
      })
      .transition()
      .duration(defaultFadeDuration)
      .attr("x", xposition)
      .attr("y", yposition);

    nodeWords
      .enter()
      .append("svg:text")
      .attr("id", "word")
      .attr("nodeId", function(d) {
        return d.nodeId;
      })
      .attr("class", "enter")
      .attr("rank", function(d) {
        return d.rank;
      })
      .attr("x", xposition)
      .attr("y", yposition)
      .text(function(d) {
        return d.text;
      })
      .style("fill", "#FF0000")
      .style("fill-opacity", 1)
      .style("font-size", "2.2vmin")
      .on("mouseout", nodeMouseOut)
      .on("mouseover", nodeMouseOver)
      .transition()
      .duration(defaultFadeDuration)
      .style("fill", "#FF0000");

    nodeWords
      .exit()
      .attr("class", "exit")
      .remove();

    return (callback(null, "updateNodeWords"));
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

  function updateHistogramDisplay() {

    updateHistogramDisplayReady = false;

    async.series(
      [
        ageGroups,
        ageSessions,
        ageNodes,
        processDeadNodesHash,
        rankGroups,
        // rankSessions,
        rankNodes,
        updateGroups,
        updateGroupWords,
        updateSessions,
        // updateSessionWords,
        updateNodes,
        updateNodeWords,
      ],

      function(err, result) {
        if (err) {
          console.error("*** ERROR: updateHistogramDisplayReady *** \nERROR: " + err);
        }
        updateHistogramDisplayReady = true;
      }
    );
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

    var tooltipString = "<bold>" + nodeId + "</bold>" + "<br>MENTIONS: " + mentions + "<br>RANK: " + rank;

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

  this.addGroup = function(newGroup) {
    groups.push(newGroup);
  }

  this.addSession = function(newSession) {
    sessions.push(newSession);
  }

  this.addNode = function(newNode) {
    if (!newNode.isSession 
      && !newNode.isSessionNode 
      && !newNode.isGroup 
      && !newNode.isGroupNode 
      && ((nodes.length < maxWords - 1) || (newNode.rank < maxWords - 1))) {
      newNode.x = 0;
      nodeMouseOut.y = height;
      nodes.push(newNode);
      rankNodes(function() {
        if (nodes.length > maxWords) nodes.pop();
      });
    }
    updateRecentNodes(newNode);
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
        }
      }
  }

  this.addLink = function(newLink) {
  }

  this.deleteLink = function(delLink) {
  }

  // ===================================================================

  this.initD3timer = function() {
    d3.timer(function() {
      tickNumber++;
      dateNow = moment().valueOf();
      if (updateHistogramDisplayReady && !mouseMovingFlag) updateHistogramDisplay();
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

    svgHistogramLayoutAreaWidth = d3LayoutWidth * HISTOGRAM_LAYOUT_WIDTH_RATIO;
    svgHistogramLayoutAreaHeight = d3LayoutHeight * HISTOGRAM_LAYOUT_HEIGHT_RATIO;


    svgHistogramLayoutArea.attr("width", svgHistogramLayoutAreaWidth)
      .attr("height", svgHistogramLayoutAreaHeight);

    svgHistogramLayoutArea.attr("x", 0);
    svgHistogramLayoutArea.attr("y", 0);
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
      return marginLeftGroups;
    }
    if (d.isSession) {
      return marginLeftSessions;
    }

    if (typeof d.rank === 'undefined') {
      return marginLeftWords;
    }

    var value;
    var col = parseInt(d.rank / maxWordRows);

    value = marginLeftWords + (colSpacing * col);

    return value + "%";
  }

  var rows = maxWordRows;
  var cols = 5;

  function yposition(d, i) {

    var value;

    if (d.isSession) {

      if (typeof d.rank === 'undefined') {
        value = marginTopSessions + (3 * maxSessionRows);
        return value + "%";
      }

      value = marginTopSessions + (3 * (d.rank % maxSessionRows));
      return value + "%";
    }

    if (typeof d.rank === 'undefined') {
      value = marginTopWords + (3 * maxWordRows);
      return value + "%";
    }

    value = marginTopWords + (3 * (d.rank % maxWordRows));
    return value + "%";
  }


  var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);
}
