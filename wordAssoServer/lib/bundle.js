(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw a.code = "MODULE_NOT_FOUND", a;
        }

        var p = n[i] = {
          exports: {}
        };
        e[i][0].call(p.exports, function (r) {
          var n = e[i][1][r];
          return o(n || r);
        }, p, p.exports, r, e, n, t);
      }

      return n[i].exports;
    }

    for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);

    return o;
  }

  return r;
})()({
  1: [function (require, module, exports) {
    window.ControlPanel = function ControlPanel() {
      "use strict";

      const ONE_SECOND = 1000;
      const ONE_MINUTE = 60 * ONE_SECOND;
      var DEFAULT_SOURCE = "https://word.threeceelabs.com"; // var DEFAULT_SOURCE = "http://localhost:9997";

      var parentWindow = window.opener;
      console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
      var self = this;

      var $ = require('jquery-browserify'); // var control = require("control-panel");


      var dat = require('dat.gui'); // var canvas = document.getElementById("guiCanvas");


      var guiDisplayHashMap = {};
      var guiUser;
      var guiDisplay;
      var displayData = document.getElementById('displayData');
      var displayConfig;
      var userData = document.getElementById('userData');
      var userText;
      var twitterFeedUser;
      var twitterFeedPreviousUser;
      var twitterFeedHashtag;
      var compactDateTimeFormat = "YYYYMMDD HHmmss";
      var timelineDiv = document.getElementById("timelineDiv");
      var hashtagDiv = document.getElementById("hashtagDiv");
      var nodeTypesSet = new Set();
      nodeTypesSet.add("emoji");
      nodeTypesSet.add("hashtag");
      nodeTypesSet.add("location");
      nodeTypesSet.add("media");
      nodeTypesSet.add("place");
      nodeTypesSet.add("url");
      nodeTypesSet.add("user");
      nodeTypesSet.add("word");
      var currentUser = "threecee";
      var previousUser = currentUser;
      var config = {};
      var currentTwitterNode;
      config = window.opener.config;
      const DEFAULT_MAX_NODES = 100;
      const DEFAULT_MAX_NODES_MIN = 10;
      const DEFAULT_MAX_NODES_MAX = 500;
      const DEFAULT_NODE_RADIUS_RATIO_MIN = 0.0020;
      const DEFAULT_NODE_RADIUS_RATIO_MIN_MIN = 0.0010;
      const DEFAULT_NODE_RADIUS_RATIO_MIN_MAX = 0.1;
      const DEFAULT_NODE_RADIUS_RATIO_MAX = 0.2;
      const DEFAULT_NODE_RADIUS_RATIO_MAX_MIN = 0.1;
      const DEFAULT_NODE_RADIUS_RATIO_MAX_MAX = 0.5;
      const DEFAULT_FONT_SIZE_RATIO_MIN = 0.050;
      const DEFAULT_FONT_SIZE_RATIO_MIN_MIN = 0.001;
      const DEFAULT_FONT_SIZE_RATIO_MIN_MAX = 0.100;
      const DEFAULT_FONT_SIZE_RATIO_MAX = 0.100;
      const DEFAULT_FONT_SIZE_RATIO_MAX_MIN = 0.050;
      const DEFAULT_FONT_SIZE_RATIO_MAX_MAX = 0.500;
      const DEFAULT_MAX_AGE = 30 * ONE_SECOND;
      const DEFAULT_MAX_AGE_MIN = ONE_SECOND;
      const DEFAULT_MAX_AGE_MAX = ONE_MINUTE;
      const DEFAULT_GRAVITY = 0.001;
      const DEFAULT_GRAVITY_MIN = -0.005;
      const DEFAULT_GRAVITY_MAX = 0.005;
      const DEFAULT_CHARGE = -50.0;
      const DEFAULT_CHARGE_MIN = -1000.0;
      const DEFAULT_CHARGE_MAX = 1000.0;
      const DEFAULT_VELOCITY_DECAY = 0.50;
      const DEFAULT_VELOCITY_DECAY_MIN = 0.0;
      const DEFAULT_VELOCITY_DECAY_MAX = 1.0;
      config.fontSizeRatioMin = config.fontSizeRatioMin || DEFAULT_FONT_SIZE_RATIO_MIN;
      config.fontSizeRatioMinMin = config.fontSizeRatioMinMin || DEFAULT_FONT_SIZE_RATIO_MIN_MIN;
      config.fontSizeRatioMinMax = config.fontSizeRatioMinMax || DEFAULT_FONT_SIZE_RATIO_MIN_MAX;
      config.fontSizeRatioMax = config.fontSizeRatioMax || DEFAULT_FONT_SIZE_RATIO_MAX;
      config.fontSizeRatioMaxMin = config.fontSizeRatioMaxMin || DEFAULT_FONT_SIZE_RATIO_MAX_MIN;
      config.fontSizeRatioMaxMax = config.fontSizeRatioMaxMax || DEFAULT_FONT_SIZE_RATIO_MAX_MAX;
      config.maxNodes = config.maxNodes || DEFAULT_MAX_NODES;
      config.maxNodesMin = config.maxNodesMin || DEFAULT_MAX_NODES_MIN;
      config.maxNodesMax = config.maxNodesMax || DEFAULT_MAX_NODES_MAX;
      config.nodeRadiusRatioMin = config.nodeRadiusRatioMin || DEFAULT_NODE_RADIUS_RATIO_MIN;
      config.nodeRadiusRatioMinMin = config.nodeRadiusRatioMinMin || DEFAULT_NODE_RADIUS_RATIO_MIN_MIN;
      config.nodeRadiusRatioMinMax = config.nodeRadiusRatioMinMax || DEFAULT_NODE_RADIUS_RATIO_MIN_MAX;
      config.nodeRadiusRatioMax = config.nodeRadiusRatioMax || DEFAULT_NODE_RADIUS_RATIO_MAX;
      config.nodeRadiusRatioMaxMin = config.nodeRadiusRatioMaxMin || DEFAULT_NODE_RADIUS_RATIO_MAX_MIN;
      config.nodeRadiusRatioMaxMax = config.nodeRadiusRatioMaxMax || DEFAULT_NODE_RADIUS_RATIO_MAX_MAX;
      config.maxAge = config.maxAge || DEFAULT_MAX_AGE;
      config.maxAgeMin = config.maxAgeMin || DEFAULT_MAX_AGE_MIN;
      config.maxAgeMax = config.maxAgeMax || DEFAULT_MAX_AGE_MAX;
      config.gravity = config.gravity || DEFAULT_GRAVITY;
      config.gravityMin = config.gravityMin || DEFAULT_GRAVITY_MIN;
      config.gravityMax = config.gravityMax || DEFAULT_GRAVITY_MAX;
      config.charge = config.charge || DEFAULT_CHARGE;
      config.chargeMin = config.chargeMin || DEFAULT_CHARGE_MIN;
      config.chargeMax = config.chargeMax || DEFAULT_CHARGE_MAX;
      config.velocityDecay = config.velocityDecay || DEFAULT_VELOCITY_DECAY;
      config.velocityDecayMin = config.velocityDecayMin || DEFAULT_VELOCITY_DECAY_MIN;
      config.velocityDecayMax = config.velocityDecayMax || DEFAULT_VELOCITY_DECAY_MAX;
      delete config.twitterUser.histograms;
      delete config.twitterUser.countHistory;
      delete config.twitterUser.status; // console.log("config\n" + jsonPrint(config));

      var statsObj = {};
      statsObj.socketId = "NOT SET";
      statsObj.user = {};
      statsObj.user.name = "---";
      statsObj.user.screenName = "@";
      statsObj.user.location = "---";
      statsObj.user.description = "---";
      statsObj.user.category = "---";
      statsObj.user.categoryAuto = "---";
      statsObj.user.followersCount = 0;
      statsObj.user.friendsCount = 0;
      statsObj.user.statusesCount = 0;
      statsObj.user.mentions = 0;
      statsObj.user.threeceeFollowing = "---";
      statsObj.user.ignored = "---";

      var UserText = function () {
        this.nextUncat = function () {
          console.debug("NEXT UNCAT");

          if (parentWindow) {
            parentWindow.postMessage({
              op: "NODE_SEARCH",
              input: "@?"
            }, DEFAULT_SOURCE);
          }
        };

        this.nodeId = statsObj.user.nodeId;
        this.screenName = statsObj.user.screenName;
        this.name = statsObj.user.name;
        this.location = statsObj.user.location;
        this.description = statsObj.user.description;
        this.category = statsObj.user.category;
        this.categoryAuto = statsObj.user.categoryAuto;
        this.location = statsObj.user.location;
        this.followersCount = statsObj.user.followersCount;
        this.friendsCount = statsObj.user.friendsCount;
        this.statusesCount = statsObj.user.statusesCount;
        this.mentions = statsObj.user.mentions;
        this.threeceeFollowing = statsObj.user.threeceeFollowing;
        this.ignored = statsObj.user.ignored;
        this.color = "#ffffff";
        this.fontSize = 16;
        this.border = false;
        this.fontFamily = "monospace";
      };

      var DisplayConfig = function () {
        this.maxNodes = config.maxNodes;
        this.maxAge = config.maxAge;
        this.gravity = config.gravity;
        this.charge = config.charge;
        this.nodeRadiusRatioMin = config.nodeRadiusRatioMin;
        this.nodeRadiusRatioMax = config.nodeRadiusRatioMax;
        this.fontSizeRatioMin = config.fontSizeRatioMin;
        this.fontSizeRatioMax = config.fontSizeRatioMax;
        this.velocityDecay = config.velocityDecay;
        this.fontSizeRatio = config.fontSizeRatio;
        this.transitionDuration = config.transitionDuration;
        this.color = "#ffffff";
        this.fontSize = 16;
        this.border = false;
        this.fontFamily = "monospace";
      };

      function jsonPrint(obj) {
        if (obj || obj === 0) {
          var jsonString = JSON.stringify(obj, null, 2);
          return jsonString;
        } else {
          return "UNDEFINED";
        }
      }

      var nodeSearchInput = document.createElement("input");
      var nodeSearchLabel = document.createElement("label");
      var nodeSearchValue = "";
      nodeSearchLabel.setAttribute("id", "nodeSearchLabel");
      nodeSearchLabel.innerHTML = "NODE SEARCH";

      function nodeSearchHandler(e) {
        if (e.keyCode === 13) {
          // 'ENTER' key
          parentWindow.postMessage({
            op: "NODE_SEARCH",
            input: nodeSearchInput.value
          }, DEFAULT_SOURCE);
        }
      }

      nodeSearchInput.setAttribute("class", "nodeSearch");
      nodeSearchInput.setAttribute("type", "text");
      nodeSearchInput.setAttribute("id", "nodeSearchInput");
      nodeSearchInput.setAttribute("name", "nodeSearch");
      nodeSearchInput.setAttribute("autofocus", true);
      nodeSearchInput.setAttribute("autocapitalize", "none");
      nodeSearchInput.setAttribute("value", nodeSearchValue);
      nodeSearchInput.addEventListener("keydown", function (e) {
        nodeSearchHandler(e);
      }, false);
      twitterCategorySearchDiv.appendChild(nodeSearchLabel);
      twitterCategorySearchDiv.appendChild(nodeSearchInput);

      Element.prototype.removeAll = function () {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }

        return this;
      };

      function updateCategoryRadioButtons(category, callback) {
        console.log("updateCategoryRadioButtons | " + category);

        if (category === undefined || !category) {
          category = "none";
        }

        callback(); // var element;
        // document.getElementById("categoryLeft").setAttribute("class", "radioUnchecked");
        // document.getElementById("categoryRight").setAttribute("class", "radioUnchecked");
        // document.getElementById("categoryNeutral").setAttribute("class", "radioUnchecked");
        // document.getElementById("categoryPositive").setAttribute("class", "radioUnchecked");
        // document.getElementById("categoryNegative").setAttribute("class", "radioUnchecked");
        // document.getElementById("categoryNone").setAttribute("class", "radioUnchecked");
        // switch(category) {
        //   case "left":
        //     element = document.getElementById("categoryLeft");
        //     element.className = "radioChecked";
        //     callback();
        //   break;
        //   case "right":
        //     element = document.getElementById("categoryRight");
        //     element.className = "radioChecked";
        //     callback();
        //   break;
        //   case "neutral":
        //     element = document.getElementById("categoryNeutral");
        //     element.className = "radioChecked";
        //     callback();
        //   break;
        //   case "positive":
        //     element = document.getElementById("categoryPositive");
        //     element.className = "radioChecked";
        //     callback();
        //   break;
        //   case "negative":
        //     element = document.getElementById("categoryNegative");
        //     element.className = "radioChecked";
        //     callback();
        //   break;
        //   case "none":
        //     element = document.getElementById("categoryNone");
        //     element.className = "radioChecked";
        //     callback();
        //   break;
        //   default:
        //     callback();
        // }
      }

      function shortCategory(c) {
        switch (c) {
          case "left":
            return "L";

          case "right":
            return "R";

          case "neutral":
            return "N";

          case "positive":
            return "+";

          case "negative":
            return "-";

          default:
            return "0";
        }
      }

      var nodeName;
      var category;
      var categoryAuto;

      function twitterWidgetsCreateTimeline(node, callback) {
        if (node.notFound !== undefined) {
          callback(null, null);
        } else {
          twitterFeedPreviousUser = node;
          nodeName = node.name !== undefined ? node.name : "---";
          category = node.category || "none";
          categoryAuto = node.categoryAuto || "none";
          statsObj.user.nodeId = node.nodeId;
          statsObj.user.name = nodeName;
          statsObj.user.screenName = node.screenName;
          statsObj.user.location = node.location;
          statsObj.user.description = node.description;
          statsObj.user.category = category;
          statsObj.user.categoryAuto = categoryAuto;
          statsObj.user.followersCount = node.followersCount;
          statsObj.user.friendsCount = node.friendsCount;
          statsObj.user.statusesCount = node.statusesCount;
          statsObj.user.ignored = node.ignored;
          statsObj.user.threeceeFollowing = node.threeceeFollowing;
          statsObj.user.mentions = node.mentions;
          userText.nodeId = statsObj.user.nodeId;
          userText.name = statsObj.user.name;
          userText.location = statsObj.user.location;
          userText.screenName = statsObj.user.screenName;
          userText.category = shortCategory(statsObj.user.category);
          userText.categoryAuto = shortCategory(statsObj.user.categoryAuto);
          userText.followersCount = statsObj.user.followersCount;
          userText.friendsCount = statsObj.user.friendsCount;
          userText.statusesCount = statsObj.user.statusesCount;
          userText.mentions = statsObj.user.mentions;
          userText.ignored = statsObj.user.ignored;
          userText.threeceeFollowing = statsObj.user.threeceeFollowing;
          userText.description = statsObj.user.description;

          if (twttr && twttr.widgets) {
            // twttr.widgets.createFollowButton(
            //   node.screenName,
            //   timelineDiv
            // );
            twttr.widgets.createTimeline({
              sourceType: "profile",
              screenName: node.screenName
            }, timelineDiv, {
              width: "400",
              height: "600"
            }).then(function (el) {
              callback(null, el);
            }).catch(function (err) {
              console.error("TWITTER CREATE TIMELINE ERROR: " + err);
              callback(err, null);
            });
          } else {
            callback(null, null);
          }
        }
      }

      function twitterHashtagSearch(node, callback) {
        var text = node.nodeId.toLowerCase();
        var hashtagText = document.createElement("TEXT");
        hashtagText.setAttribute("id", "hashtagText");
        hashtagText.setAttribute("class", "hashtagText");
        hashtagText.innerHTML = "<br><br>" + "#" + text + "<br><br>" + "C: M: " + node.category + "<br><br>";
        hashtagDiv.removeAll();
        timelineDiv.removeAll();
        hashtagDiv.appendChild(hashtagText);
        callback();
      }

      function loadTwitterFeed(node, callback) {
        if (!timelineDiv || !hashtagDiv || twttr === undefined) {
          console.error("loadTwitterFeed: timelineDiv OR hashtagDiv OR twttr UNDEFINED");
          return callback("loadTwitterFeed: timelineDiv OR hashtagDiv OR twttr UNDEFINED");
        }

        hashtagDiv.removeAll();
        timelineDiv.removeAll();

        if (node.nodeType === "user") {
          twitterFeedPreviousUser = twitterFeedUser;
          twitterFeedUser = node;
          console.debug("loadTwitterFeed" + " | TYPE: " + node.nodeType + " | NID: " + node.nodeId + " | @" + node.screenName + " | " + node.name + " | CR: " + node.createdAt + " | LS: " + node.lastSeen + " | CAT M: " + node.category + " | CAT A: " + node.categoryAuto + " | Ms: " + node.mentions + " | Ts: " + node.statusesCount + " | FRNDs: " + node.friendsCount + " | FLWRs: " + node.followersCount);
          updateCategoryRadioButtons(node.category, function () {
            twitterWidgetsCreateTimeline(node, function (err, el) {
              if (err) {
                console.error("LOAD TWITTER FEED ERROR: " + err);
                return callback(err);
              }

              var nsi = document.getElementById("nodeSearchInput");
              nsi.value = "@" + node.screenName;
              callback(null);
            });
          });
        } else if (node.nodeType === "hashtag") {
          twitterFeedHashtag = node;
          console.debug("loadTwitterFeed" + " | TYPE: " + node.nodeType + " | #: " + node.nodeId + " | CAT M: " + node.category + " | Ms: " + node.mentions);
          updateCategoryRadioButtons(node.category, function () {
            twitterHashtagSearch(node, function () {
              var nsi = document.getElementById("nodeSearchInput");
              nsi.value = "#" + node.nodeId;
              callback(null);
            });
          });
        } else {
          callback("ILLEGAL NODE TYPE: " + node.nodeType);
        }
      }

      this.setDisplayNodeType = function (params, callback) {};

      this.setMaxNodes = function (value) {};

      this.setNodeRadiusRatioMax = function (value) {};

      this.setNodeRadiusRatioMin = function (value) {};

      this.setNodeRadiusRatio = function (value) {};

      this.setVelocityDecay = function (value) {};

      this.setLinkStrength = function (value) {};

      this.setLinkDistance = function (value) {};

      this.setTransitionDuration = function (value) {};

      this.setGravity = function (value) {};

      this.setCharge = function (value) {};

      this.setMaxAge = function (value) {};

      this.setFontSizeRatioMin = function (value) {};

      this.setFontSizeRatioMax = function (value) {};

      this.setFontSizeRatio = function (value) {};

      function receiveMessage(event) {
        // Do we trust the sender of this message?
        if (event.origin !== DEFAULT_SOURCE) {
          if (event.origin === "https://platform.twitter.com") {
            if (event.data["twttr.button"] && event.data["twttr.button"]["method"] === "twttr.private.resizeButton") {
              return;
            } // console.log("TWITTER SOURCE: " + event.origin);

          } else {
            console.error("RX MESSAGE | NOT TRUSTED SOURCE" + " | ORIGIN: " + event.origin + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE);
            return;
          }
        }

        console.debug("RX MESSAGE | SOURCE" + " | ORIGIN: " + event.origin + " | PARENT WINDOW: " + parentWindow.PARENT_ID + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE);
        var op = event.data.op;
        var cnf;

        switch (op) {
          case "INIT":
            cnf = event.data.config;
            delete cnf.twitterUser.histograms;
            delete cnf.twitterUser.countHistory;
            delete cnf.twitterUser.status;
            console.debug("CONTROL PANEL INIT" // + "\n" + jsonPrint(cnf)
            );
            Object.keys(cnf).forEach(function (prop) {
              config[prop] = cnf[prop];
              console.info("CNF | " + prop + " | " + config[prop]);
            });
            self.setMaxNodes(cnf.defaultMaxNodesLimit);
            self.setTransitionDuration(cnf.defaultTransitionDuration);
            self.setLinkStrength(cnf.defaultLinkStrength);
            self.setLinkDistance(cnf.defaultLinkDistance);
            self.setGravity(cnf.defaultGravity);
            self.setCharge(cnf.defaultCharge);
            self.setNodeRadiusRatioMin(cnf.defaultNodeRadiusRatioMin);
            self.setNodeRadiusRatioMax(cnf.defaultNodeRadiusRatioMax);
            self.setVelocityDecay(cnf.defaultVelocityDecay);
            self.setMaxAge(cnf.defaultMaxAge);
            self.setFontSizeRatioMin(cnf.defaultFontSizeRatioMin);
            self.setFontSizeRatioMax(cnf.defaultFontSizeRatioMax);

            if (cnf.displayNodeHashMap !== undefined) {
              Object.keys(cnf.displayNodeHashMap).forEach(function (displayNodeType) {
                self.setDisplayNodeType({
                  displayNodeType: displayNodeType,
                  value: cnf.displayNodeHashMap[displayNodeType]
                }, function (err) {
                  if (err) {
                    delete cnf.displayNodeHashMap[displayNodeType];
                  }
                });
              });
            }

            parentWindow.postMessage({
              op: "NODE_SEARCH",
              input: "@threecee"
            }, DEFAULT_SOURCE);
            break;

          case "SET_TWITTER_USER":
            currentTwitterNode = event.data.user;
            console.debug("SET TWITTER USER" + " | " + currentTwitterNode.nodeId + " | @" + currentTwitterNode.screenName + " | CR: " + currentTwitterNode.createdAt + " | LS: " + currentTwitterNode.lastSeen + " | C: " + currentTwitterNode.category + " | CA: " + currentTwitterNode.categoryAuto // + jsonPrint(currentTwitterNode)
            );

            if (event.data.nodeSearch) {
              console.debug("NODE_SEARCH on SET_TWITTER_USER USER" + " | @" + currentTwitterNode.screenName);
              parentWindow.postMessage({
                op: "NODE_SEARCH",
                input: "@" + currentTwitterNode.screenName
              }, DEFAULT_SOURCE);
            }

            loadTwitterFeed(currentTwitterNode, function (err) {
              if (err) {
                setTimeout(function () {
                  loadTwitterFeed(currentTwitterNode, function (err2) {
                    if (err2) {
                      console.error("loadTwitterFeed SET_TWITTER_USER FAIL");
                    }
                  });
                }, 1000);
              }
            });
            break;

          case "SET_TWITTER_HASHTAG":
            currentTwitterNode = event.data.hashtag;
            console.debug("SET TWITTER HASHTAG\n" + jsonPrint(currentTwitterNode));
            loadTwitterFeed(currentTwitterNode, function (err) {
              if (err) {
                setTimeout(function () {
                  loadTwitterFeed(currentTwitterNode, function (err2) {
                    if (err2) {
                      console.error("loadTwitterFeed SET_TWITTER_HASHTAG FAIL");
                    }
                  });
                }, 1000);
              }
            });
            break;
        }
      } // function buttonHandler(params) {
      //   const user = (params.user) ? "@" + params.user : currentUser;
      //   switch (params.id){
      //   	case "previousUser":
      // 	    console.debug("PREVIOUS USER: " + user);
      // 	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: user }, DEFAULT_SOURCE); }
      //   	break;
      //   	case "follow":
      // 	    console.debug("FOLLOW: " + user);
      // 	    if (parentWindow) { parentWindow.postMessage({op: "FOLLOW", user: user}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "unfollow":
      // 	    console.debug("UNFOLLOW: " + user);
      // 	    if (parentWindow) { parentWindow.postMessage({op: "UNFOLLOW", user: user}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "ignore":
      // 	    console.debug("IGNORE: " + user);
      // 	    if (parentWindow) { parentWindow.postMessage({op: "IGNORE", user: user}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "unignore":
      // 	    console.debug("UNIGNORE: " + user);
      // 	    if (parentWindow) { parentWindow.postMessage({op: "UNIGNORE", user: user}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "nextMismatch":
      // 	    console.debug("NEXT MISMATCH");
      // 	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?MM"}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "nextUncat":
      // 	    console.debug("NEXT UNCAT");
      // 	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?"}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "nextUncatLeft":
      // 	    console.debug("NEXT UNCAT LEFT");
      // 	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?LEFT"}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "nextUncatNeutral":
      // 	    console.debug("NEXT UNCAT NEUTRAL");
      // 	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?NEUTRAL"}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "nextUncatRight":
      // 	    console.debug("NEXT UNCAT RIGHT");
      // 	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?RIGHT"}, DEFAULT_SOURCE); }
      //   	break;
      //   	case "resetButton":
      // 	    console.debug("RESET");
      // 	    if (parentWindow) { parentWindow.postMessage({op: "RESET"}, DEFAULT_SOURCE); }
      //   	break;
      //   	default:
      //   		console.error("UNKNOW BUTTON ID: " + params.id);
      //   }
      // }
      // var nodeDisplayPanel = control([
      // 	{type: "checkbox", label: "EMOJI", initial: false},
      // 	{type: "checkbox", label: "HASHTAG", initial: false},
      // 	{type: "checkbox", label: "LOCATION", initial: false},
      // 	{type: "checkbox", label: "MEDIA", initial: false},
      // 	{type: "checkbox", label: "PLACE", initial: false},
      // 	{type: "checkbox", label: "URL", initial: false},
      // 	{type: "checkbox", label: "USER", initial: false},
      // 	{type: "checkbox", label: "WORD", initial: false}
      // ], 
      //   {root: document.getElementById("nodeDisplayDiv"), theme: "dark"}
      // );
      // nodeDisplayPanel.on("input", function(data){
      // 	console.debug("NODE DISPLAY INPUT\n", data)
      // });
      // var userCategorizePanel = control([
      // 	{type: "button", label: "PREV USER", action: function () { buttonHandler({id: "previousUser", name: "PREV USER", user: previousUser}); }},
      // 	{type: "button", label: "FOLLOW", action: function () { buttonHandler({id: "follow", name: "FOLLOW", user: currentUser}); }},
      // 	{type: "button", label: "UNFOLLOW", action: function () { buttonHandler({id: "unfollow", name: "UNFOLLOW", user: currentUser}); }},
      // 	{type: "button", label: "IGNORE", action: function () { buttonHandler({id: "ignore", name: "IGNORE", user: currentUser}); }},
      // 	{type: "button", label: "UNIGNORE", action: function () { buttonHandler({id: "unignore", name: "UNIGNORE", user: currentUser}); }},
      // 	{type: "button", label: "NEXT MISMATCH", action: function () { buttonHandler({id: "nextMismatch", name: "NEXT MISMATCH"}); }},
      // 	{type: "button", label: "NEXT UNCAT", action: function () { buttonHandler({id: "nextUncat", name: "NEXT UNCAT"}); }},
      // 	{type: "button", label: "NEXT UNCAT LEFT", action: function () { buttonHandler({id: "nextUncatLeft", name: "NEXT UNCAT LEFT"}); }},
      // 	{type: "button", label: "NEXT UNCAT NEUTRAL", action: function () { buttonHandler({id: "nextUncatNeutral", name: "NEXT UNCAT NEUTRAL"}); }},
      // 	{type: "button", label: "NEXT UNCAT RIGHT", action: function () { buttonHandler({id: "nextUncatRight", name: "NEXT UNCAT RIGHT"}); }},
      //   {type: "select", label: "CATEGORY", options: ["LEFT", "NEUTRAL", "RIGHT", "POSITIVE", "NEGATIVE", "NONE"], initial: "NONE"}
      // ], 
      //   {root: document.getElementById("userCategorizeDiv"), theme: "dark"}
      // );
      // userCategorizePanel.on("input", function(data){
      // 	console.debug("USER CATEGORIZE INPUT\n", data)
      // });


      this.createControlPanel = function (callback) {
        if (callback) {
          callback();
        }
      };

      this.updateControlPanel = function (cfg, callback) {
        console.log("UPDATE CONTROL PANEL");

        if (callback) {
          callback();
        }
      }; // function setValue() {
      //   userData.innerHTML = userText.screenName;
      //   userData.style.color = userText.color;
      //   userData.style.fontSize = userText.fontSize+"px";
      //   userData.style.fontFamily = userText.fontFamily;
      //   if(userText.border) {
      //     userData.style.border = "solid 1px black";
      //     userData.style.padding = "10px";
      //   }
      //   else {
      //     userData.style.border = "none";
      //     userData.style.padding = "0px";
      //   }
      // }


      $(document).ready(function () {
        console.log("CONTROL PANEL DOCUMENT READY");
        console.log("CONTROL PANEL CONFIG" // + "\n" + jsonPrint(config)
        );
        self.createControlPanel(function () {
          setTimeout(function () {
            // KLUDGE to insure table is created before update
            userText = new UserText();
            guiUser = new dat.GUI();
            guiUser.width = 400;
            guiUser.add(userText, 'nextUncat');
            guiUser.add(userText, 'screenName').listen();
            guiUser.add(userText, 'name').listen();
            guiUser.add(userText, 'location').listen();
            guiUser.add(userText, 'ignored').listen();
            guiUser.add(userText, 'description').listen();
            guiUser.add(userText, 'category', ['L', 'N', 'R', '+', '-', '0']).listen();
            guiUser.add(userText, 'categoryAuto', ['L', 'N', 'R', '+', '-', '0']).listen();
            guiUser.add(userText, 'followersCount').listen();
            guiUser.add(userText, 'friendsCount').listen();
            guiUser.add(userText, 'statusesCount').listen();
            guiUser.add(userText, 'threeceeFollowing').listen();
            guiUser.addColor(userText, 'color');
            guiUser.add(userText, 'fontSize', 6, 48);
            guiUser.add(userText, 'border');
            guiUser.add(userText, 'fontFamily', ["sans-serif", "serif", "cursive", "monospace"]);
            displayConfig = new DisplayConfig();
            guiDisplay = new dat.GUI();
            guiDisplay.width = 400;
            guiDisplayHashMap['maxNodes'] = guiDisplay.add(displayConfig, 'maxNodes', config.maxNodesMin, config.maxNodesMax).listen();
            guiDisplayHashMap['nodeRadiusRatioMin'] = guiDisplay.add(displayConfig, 'nodeRadiusRatioMin', config.nodeRadiusRatioMinMin, config.nodeRadiusRatioMinMax).listen();
            guiDisplayHashMap['nodeRadiusRatioMax'] = guiDisplay.add(displayConfig, 'nodeRadiusRatioMax', config.nodeRadiusRatioMaxMin, config.nodeRadiusRatioMaxMax).listen();
            guiDisplayHashMap['fontSizeRatioMin'] = guiDisplay.add(displayConfig, 'fontSizeRatioMin', config.fontSizeRatioMinMin, config.fontSizeRatioMinMax).listen();
            guiDisplayHashMap['fontSizeRatioMax'] = guiDisplay.add(displayConfig, 'fontSizeRatioMax', config.fontSizeRatioMaxMin, config.fontSizeRatioMaxMax).listen();
            guiDisplayHashMap['maxAge'] = guiDisplay.add(displayConfig, 'maxAge', config.maxAgeMin, config.maxAgeMax).listen();
            guiDisplayHashMap['gravity'] = guiDisplay.add(displayConfig, 'gravity', config.gravityMin, config.gravityMax).listen();
            guiDisplayHashMap['charge'] = guiDisplay.add(displayConfig, 'charge', config.chargeMin, config.chargeMax).listen();
            guiDisplayHashMap['velocityDecay'] = guiDisplay.add(displayConfig, 'velocityDecay', config.velocityDecayMin, config.velocityDecayMax).listen();
            guiDisplay.addColor(displayConfig, 'color');
            guiDisplay.add(displayConfig, 'fontSize', 6, 48);
            guiDisplay.add(displayConfig, 'border');
            guiDisplay.add(displayConfig, 'fontFamily', ["sans-serif", "serif", "cursive", "monospace"]);
            guiDisplayHashMap['maxNodes'].onFinishChange(function (value) {
              console.debug("GUI DisplayConfig MAX NODES CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "maxNodes",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['fontSizeRatioMin'].onChange(function (value) {
              console.debug("GUI DisplayConfig NODE FONT SIZE RATIO MIN CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "fontSizeRatioMin",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['fontSizeRatioMax'].onChange(function (value) {
              console.debug("GUI DisplayConfig NODE FONT SIZE RATIO MAX CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "fontSizeRatioMax",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['nodeRadiusRatioMin'].onChange(function (value) {
              console.debug("GUI DisplayConfig NODE RADIUS RATIO MIN CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "nodeRadiusRatioMin",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['nodeRadiusRatioMax'].onChange(function (value) {
              console.debug("GUI DisplayConfig NODE RADIUS RATIO MAX CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "nodeRadiusRatioMax",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['maxAge'].onFinishChange(function (value) {
              console.debug("GUI DisplayConfig MAX AGE CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "maxAge",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['gravity'].onChange(function (value) {
              console.debug("GUI DisplayConfig GRAVITY CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "gravity",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['charge'].onChange(function (value) {
              console.debug("GUI DisplayConfig CHARGE CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "charge",
                value: value
              }, DEFAULT_SOURCE);
            });
            guiDisplayHashMap['velocityDecay'].onChange(function (value) {
              console.debug("GUI DisplayConfig VELOCITY DECAY CHANGE\n", value);
              parentWindow.postMessage({
                op: "UPDATE",
                id: "velocityDecay",
                value: value
              }, DEFAULT_SOURCE);
            });
            self.updateControlPanel(config, function () {
              if (parentWindow !== undefined) {
                window.addEventListener("message", receiveMessage, false);
                setTimeout(function () {
                  console.log("TX PARENT READY " + DEFAULT_SOURCE);
                  parentWindow.postMessage({
                    op: "READY"
                  }, DEFAULT_SOURCE);

                  if (!twttr || !twttr.widgets) {
                    var waitTwitterWidgetsInterval;
                    waitTwitterWidgetsInterval = setInterval(function () {
                      if (twttr && twttr.widgets) {
                        clearInterval(waitTwitterWidgetsInterval);
                        twttr.widgets.load();
                      }
                    }, 100);
                  } else {
                    twttr.widgets.load();
                  }
                }, 1000);
              } else {
                console.error("PARENT WINDOW UNDEFINED??");
              }
            });
          }, 2000);
        });
      });
    };
  }, {
    "dat.gui": 2,
    "jquery-browserify": 3
  }],
  2: [function (require, module, exports) {
    /**
     * dat-gui JavaScript Controller Library
     * http://code.google.com/p/dat-gui
     *
     * Copyright 2011 Data Arts Team, Google Creative Lab
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     */
    (function (global, factory) {
      typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.dat = {});
    })(this, function (exports) {
      'use strict';

      function ___$insertStyle(css) {
        if (!css) {
          return;
        }

        if (typeof window === 'undefined') {
          return;
        }

        var style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.innerHTML = css;
        document.head.appendChild(style);
        return css;
      }

      function colorToString(color, forceCSSHex) {
        var colorFormat = color.__state.conversionName.toString();

        var r = Math.round(color.r);
        var g = Math.round(color.g);
        var b = Math.round(color.b);
        var a = color.a;
        var h = Math.round(color.h);
        var s = color.s.toFixed(1);
        var v = color.v.toFixed(1);

        if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
          var str = color.hex.toString(16);

          while (str.length < 6) {
            str = '0' + str;
          }

          return '#' + str;
        } else if (colorFormat === 'CSS_RGB') {
          return 'rgb(' + r + ',' + g + ',' + b + ')';
        } else if (colorFormat === 'CSS_RGBA') {
          return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        } else if (colorFormat === 'HEX') {
          return '0x' + color.hex.toString(16);
        } else if (colorFormat === 'RGB_ARRAY') {
          return '[' + r + ',' + g + ',' + b + ']';
        } else if (colorFormat === 'RGBA_ARRAY') {
          return '[' + r + ',' + g + ',' + b + ',' + a + ']';
        } else if (colorFormat === 'RGB_OBJ') {
          return '{r:' + r + ',g:' + g + ',b:' + b + '}';
        } else if (colorFormat === 'RGBA_OBJ') {
          return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
        } else if (colorFormat === 'HSV_OBJ') {
          return '{h:' + h + ',s:' + s + ',v:' + v + '}';
        } else if (colorFormat === 'HSVA_OBJ') {
          return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
        }

        return 'unknown format';
      }

      var ARR_EACH = Array.prototype.forEach;
      var ARR_SLICE = Array.prototype.slice;
      var Common = {
        BREAK: {},
        extend: function extend(target) {
          this.each(ARR_SLICE.call(arguments, 1), function (obj) {
            var keys = this.isObject(obj) ? Object.keys(obj) : [];
            keys.forEach(function (key) {
              if (!this.isUndefined(obj[key])) {
                target[key] = obj[key];
              }
            }.bind(this));
          }, this);
          return target;
        },
        defaults: function defaults(target) {
          this.each(ARR_SLICE.call(arguments, 1), function (obj) {
            var keys = this.isObject(obj) ? Object.keys(obj) : [];
            keys.forEach(function (key) {
              if (this.isUndefined(target[key])) {
                target[key] = obj[key];
              }
            }.bind(this));
          }, this);
          return target;
        },
        compose: function compose() {
          var toCall = ARR_SLICE.call(arguments);
          return function () {
            var args = ARR_SLICE.call(arguments);

            for (var i = toCall.length - 1; i >= 0; i--) {
              args = [toCall[i].apply(this, args)];
            }

            return args[0];
          };
        },
        each: function each(obj, itr, scope) {
          if (!obj) {
            return;
          }

          if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
            obj.forEach(itr, scope);
          } else if (obj.length === obj.length + 0) {
            var key = void 0;
            var l = void 0;

            for (key = 0, l = obj.length; key < l; key++) {
              if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
                return;
              }
            }
          } else {
            for (var _key in obj) {
              if (itr.call(scope, obj[_key], _key) === this.BREAK) {
                return;
              }
            }
          }
        },
        defer: function defer(fnc) {
          setTimeout(fnc, 0);
        },
        debounce: function debounce(func, threshold, callImmediately) {
          var timeout = void 0;
          return function () {
            var obj = this;
            var args = arguments;

            function delayed() {
              timeout = null;
              if (!callImmediately) func.apply(obj, args);
            }

            var callNow = callImmediately || !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(delayed, threshold);

            if (callNow) {
              func.apply(obj, args);
            }
          };
        },
        toArray: function toArray(obj) {
          if (obj.toArray) return obj.toArray();
          return ARR_SLICE.call(obj);
        },
        isUndefined: function isUndefined(obj) {
          return obj === undefined;
        },
        isNull: function isNull(obj) {
          return obj === null;
        },
        isNaN: function (_isNaN) {
          function isNaN(_x) {
            return _isNaN.apply(this, arguments);
          }

          isNaN.toString = function () {
            return _isNaN.toString();
          };

          return isNaN;
        }(function (obj) {
          return isNaN(obj);
        }),
        isArray: Array.isArray || function (obj) {
          return obj.constructor === Array;
        },
        isObject: function isObject(obj) {
          return obj === Object(obj);
        },
        isNumber: function isNumber(obj) {
          return obj === obj + 0;
        },
        isString: function isString(obj) {
          return obj === obj + '';
        },
        isBoolean: function isBoolean(obj) {
          return obj === false || obj === true;
        },
        isFunction: function isFunction(obj) {
          return Object.prototype.toString.call(obj) === '[object Function]';
        }
      };
      var INTERPRETATIONS = [{
        litmus: Common.isString,
        conversions: {
          THREE_CHAR_HEX: {
            read: function read(original) {
              var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);

              if (test === null) {
                return false;
              }

              return {
                space: 'HEX',
                hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
              };
            },
            write: colorToString
          },
          SIX_CHAR_HEX: {
            read: function read(original) {
              var test = original.match(/^#([A-F0-9]{6})$/i);

              if (test === null) {
                return false;
              }

              return {
                space: 'HEX',
                hex: parseInt('0x' + test[1].toString(), 0)
              };
            },
            write: colorToString
          },
          CSS_RGB: {
            read: function read(original) {
              var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

              if (test === null) {
                return false;
              }

              return {
                space: 'RGB',
                r: parseFloat(test[1]),
                g: parseFloat(test[2]),
                b: parseFloat(test[3])
              };
            },
            write: colorToString
          },
          CSS_RGBA: {
            read: function read(original) {
              var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

              if (test === null) {
                return false;
              }

              return {
                space: 'RGB',
                r: parseFloat(test[1]),
                g: parseFloat(test[2]),
                b: parseFloat(test[3]),
                a: parseFloat(test[4])
              };
            },
            write: colorToString
          }
        }
      }, {
        litmus: Common.isNumber,
        conversions: {
          HEX: {
            read: function read(original) {
              return {
                space: 'HEX',
                hex: original,
                conversionName: 'HEX'
              };
            },
            write: function write(color) {
              return color.hex;
            }
          }
        }
      }, {
        litmus: Common.isArray,
        conversions: {
          RGB_ARRAY: {
            read: function read(original) {
              if (original.length !== 3) {
                return false;
              }

              return {
                space: 'RGB',
                r: original[0],
                g: original[1],
                b: original[2]
              };
            },
            write: function write(color) {
              return [color.r, color.g, color.b];
            }
          },
          RGBA_ARRAY: {
            read: function read(original) {
              if (original.length !== 4) return false;
              return {
                space: 'RGB',
                r: original[0],
                g: original[1],
                b: original[2],
                a: original[3]
              };
            },
            write: function write(color) {
              return [color.r, color.g, color.b, color.a];
            }
          }
        }
      }, {
        litmus: Common.isObject,
        conversions: {
          RGBA_OBJ: {
            read: function read(original) {
              if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
                return {
                  space: 'RGB',
                  r: original.r,
                  g: original.g,
                  b: original.b,
                  a: original.a
                };
              }

              return false;
            },
            write: function write(color) {
              return {
                r: color.r,
                g: color.g,
                b: color.b,
                a: color.a
              };
            }
          },
          RGB_OBJ: {
            read: function read(original) {
              if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
                return {
                  space: 'RGB',
                  r: original.r,
                  g: original.g,
                  b: original.b
                };
              }

              return false;
            },
            write: function write(color) {
              return {
                r: color.r,
                g: color.g,
                b: color.b
              };
            }
          },
          HSVA_OBJ: {
            read: function read(original) {
              if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
                return {
                  space: 'HSV',
                  h: original.h,
                  s: original.s,
                  v: original.v,
                  a: original.a
                };
              }

              return false;
            },
            write: function write(color) {
              return {
                h: color.h,
                s: color.s,
                v: color.v,
                a: color.a
              };
            }
          },
          HSV_OBJ: {
            read: function read(original) {
              if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
                return {
                  space: 'HSV',
                  h: original.h,
                  s: original.s,
                  v: original.v
                };
              }

              return false;
            },
            write: function write(color) {
              return {
                h: color.h,
                s: color.s,
                v: color.v
              };
            }
          }
        }
      }];
      var result = void 0;
      var toReturn = void 0;

      var interpret = function interpret() {
        toReturn = false;
        var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
        Common.each(INTERPRETATIONS, function (family) {
          if (family.litmus(original)) {
            Common.each(family.conversions, function (conversion, conversionName) {
              result = conversion.read(original);

              if (toReturn === false && result !== false) {
                toReturn = result;
                result.conversionName = conversionName;
                result.conversion = conversion;
                return Common.BREAK;
              }
            });
            return Common.BREAK;
          }
        });
        return toReturn;
      };

      var tmpComponent = void 0;
      var ColorMath = {
        hsv_to_rgb: function hsv_to_rgb(h, s, v) {
          var hi = Math.floor(h / 60) % 6;
          var f = h / 60 - Math.floor(h / 60);
          var p = v * (1.0 - s);
          var q = v * (1.0 - f * s);
          var t = v * (1.0 - (1.0 - f) * s);
          var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
          return {
            r: c[0] * 255,
            g: c[1] * 255,
            b: c[2] * 255
          };
        },
        rgb_to_hsv: function rgb_to_hsv(r, g, b) {
          var min = Math.min(r, g, b);
          var max = Math.max(r, g, b);
          var delta = max - min;
          var h = void 0;
          var s = void 0;

          if (max !== 0) {
            s = delta / max;
          } else {
            return {
              h: NaN,
              s: 0,
              v: 0
            };
          }

          if (r === max) {
            h = (g - b) / delta;
          } else if (g === max) {
            h = 2 + (b - r) / delta;
          } else {
            h = 4 + (r - g) / delta;
          }

          h /= 6;

          if (h < 0) {
            h += 1;
          }

          return {
            h: h * 360,
            s: s,
            v: max / 255
          };
        },
        rgb_to_hex: function rgb_to_hex(r, g, b) {
          var hex = this.hex_with_component(0, 2, r);
          hex = this.hex_with_component(hex, 1, g);
          hex = this.hex_with_component(hex, 0, b);
          return hex;
        },
        component_from_hex: function component_from_hex(hex, componentIndex) {
          return hex >> componentIndex * 8 & 0xFF;
        },
        hex_with_component: function hex_with_component(hex, componentIndex, value) {
          return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
        }
      };

      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

      var classCallCheck = function (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      };

      var createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      var get = function get(object, property, receiver) {
        if (object === null) object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);

        if (desc === undefined) {
          var parent = Object.getPrototypeOf(object);

          if (parent === null) {
            return undefined;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc) {
          return desc.value;
        } else {
          var getter = desc.get;

          if (getter === undefined) {
            return undefined;
          }

          return getter.call(receiver);
        }
      };

      var inherits = function (subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
          constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
      };

      var possibleConstructorReturn = function (self, call) {
        if (!self) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
      };

      var Color = function () {
        function Color() {
          classCallCheck(this, Color);
          this.__state = interpret.apply(this, arguments);

          if (this.__state === false) {
            throw new Error('Failed to interpret color arguments');
          }

          this.__state.a = this.__state.a || 1;
        }

        createClass(Color, [{
          key: 'toString',
          value: function toString() {
            return colorToString(this);
          }
        }, {
          key: 'toHexString',
          value: function toHexString() {
            return colorToString(this, true);
          }
        }, {
          key: 'toOriginal',
          value: function toOriginal() {
            return this.__state.conversion.write(this);
          }
        }]);
        return Color;
      }();

      function defineRGBComponent(target, component, componentHexIndex) {
        Object.defineProperty(target, component, {
          get: function get$$1() {
            if (this.__state.space === 'RGB') {
              return this.__state[component];
            }

            Color.recalculateRGB(this, component, componentHexIndex);
            return this.__state[component];
          },
          set: function set$$1(v) {
            if (this.__state.space !== 'RGB') {
              Color.recalculateRGB(this, component, componentHexIndex);
              this.__state.space = 'RGB';
            }

            this.__state[component] = v;
          }
        });
      }

      function defineHSVComponent(target, component) {
        Object.defineProperty(target, component, {
          get: function get$$1() {
            if (this.__state.space === 'HSV') {
              return this.__state[component];
            }

            Color.recalculateHSV(this);
            return this.__state[component];
          },
          set: function set$$1(v) {
            if (this.__state.space !== 'HSV') {
              Color.recalculateHSV(this);
              this.__state.space = 'HSV';
            }

            this.__state[component] = v;
          }
        });
      }

      Color.recalculateRGB = function (color, component, componentHexIndex) {
        if (color.__state.space === 'HEX') {
          color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
        } else if (color.__state.space === 'HSV') {
          Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
        } else {
          throw new Error('Corrupted color state');
        }
      };

      Color.recalculateHSV = function (color) {
        var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
        Common.extend(color.__state, {
          s: result.s,
          v: result.v
        });

        if (!Common.isNaN(result.h)) {
          color.__state.h = result.h;
        } else if (Common.isUndefined(color.__state.h)) {
          color.__state.h = 0;
        }
      };

      Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
      defineRGBComponent(Color.prototype, 'r', 2);
      defineRGBComponent(Color.prototype, 'g', 1);
      defineRGBComponent(Color.prototype, 'b', 0);
      defineHSVComponent(Color.prototype, 'h');
      defineHSVComponent(Color.prototype, 's');
      defineHSVComponent(Color.prototype, 'v');
      Object.defineProperty(Color.prototype, 'a', {
        get: function get$$1() {
          return this.__state.a;
        },
        set: function set$$1(v) {
          this.__state.a = v;
        }
      });
      Object.defineProperty(Color.prototype, 'hex', {
        get: function get$$1() {
          if (!this.__state.space !== 'HEX') {
            this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
          }

          return this.__state.hex;
        },
        set: function set$$1(v) {
          this.__state.space = 'HEX';
          this.__state.hex = v;
        }
      });

      var Controller = function () {
        function Controller(object, property) {
          classCallCheck(this, Controller);
          this.initialValue = object[property];
          this.domElement = document.createElement('div');
          this.object = object;
          this.property = property;
          this.__onChange = undefined;
          this.__onFinishChange = undefined;
        }

        createClass(Controller, [{
          key: 'onChange',
          value: function onChange(fnc) {
            this.__onChange = fnc;
            return this;
          }
        }, {
          key: 'onFinishChange',
          value: function onFinishChange(fnc) {
            this.__onFinishChange = fnc;
            return this;
          }
        }, {
          key: 'setValue',
          value: function setValue(newValue) {
            this.object[this.property] = newValue;

            if (this.__onChange) {
              this.__onChange.call(this, newValue);
            }

            this.updateDisplay();
            return this;
          }
        }, {
          key: 'getValue',
          value: function getValue() {
            return this.object[this.property];
          }
        }, {
          key: 'updateDisplay',
          value: function updateDisplay() {
            return this;
          }
        }, {
          key: 'isModified',
          value: function isModified() {
            return this.initialValue !== this.getValue();
          }
        }]);
        return Controller;
      }();

      var EVENT_MAP = {
        HTMLEvents: ['change'],
        MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
        KeyboardEvents: ['keydown']
      };
      var EVENT_MAP_INV = {};
      Common.each(EVENT_MAP, function (v, k) {
        Common.each(v, function (e) {
          EVENT_MAP_INV[e] = k;
        });
      });
      var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

      function cssValueToPixels(val) {
        if (val === '0' || Common.isUndefined(val)) {
          return 0;
        }

        var match = val.match(CSS_VALUE_PIXELS);

        if (!Common.isNull(match)) {
          return parseFloat(match[1]);
        }

        return 0;
      }

      var dom = {
        makeSelectable: function makeSelectable(elem, selectable) {
          if (elem === undefined || elem.style === undefined) return;
          elem.onselectstart = selectable ? function () {
            return false;
          } : function () {};
          elem.style.MozUserSelect = selectable ? 'auto' : 'none';
          elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
          elem.unselectable = selectable ? 'on' : 'off';
        },
        makeFullscreen: function makeFullscreen(elem, hor, vert) {
          var vertical = vert;
          var horizontal = hor;

          if (Common.isUndefined(horizontal)) {
            horizontal = true;
          }

          if (Common.isUndefined(vertical)) {
            vertical = true;
          }

          elem.style.position = 'absolute';

          if (horizontal) {
            elem.style.left = 0;
            elem.style.right = 0;
          }

          if (vertical) {
            elem.style.top = 0;
            elem.style.bottom = 0;
          }
        },
        fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
          var params = pars || {};
          var className = EVENT_MAP_INV[eventType];

          if (!className) {
            throw new Error('Event type ' + eventType + ' not supported.');
          }

          var evt = document.createEvent(className);

          switch (className) {
            case 'MouseEvents':
              {
                var clientX = params.x || params.clientX || 0;
                var clientY = params.y || params.clientY || 0;
                evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0, 0, clientX, clientY, false, false, false, false, 0, null);
                break;
              }

            case 'KeyboardEvents':
              {
                var init = evt.initKeyboardEvent || evt.initKeyEvent;
                Common.defaults(params, {
                  cancelable: true,
                  ctrlKey: false,
                  altKey: false,
                  shiftKey: false,
                  metaKey: false,
                  keyCode: undefined,
                  charCode: undefined
                });
                init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
                break;
              }

            default:
              {
                evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
                break;
              }
          }

          Common.defaults(evt, aux);
          elem.dispatchEvent(evt);
        },
        bind: function bind(elem, event, func, newBool) {
          var bool = newBool || false;

          if (elem.addEventListener) {
            elem.addEventListener(event, func, bool);
          } else if (elem.attachEvent) {
            elem.attachEvent('on' + event, func);
          }

          return dom;
        },
        unbind: function unbind(elem, event, func, newBool) {
          var bool = newBool || false;

          if (elem.removeEventListener) {
            elem.removeEventListener(event, func, bool);
          } else if (elem.detachEvent) {
            elem.detachEvent('on' + event, func);
          }

          return dom;
        },
        addClass: function addClass(elem, className) {
          if (elem.className === undefined) {
            elem.className = className;
          } else if (elem.className !== className) {
            var classes = elem.className.split(/ +/);

            if (classes.indexOf(className) === -1) {
              classes.push(className);
              elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
            }
          }

          return dom;
        },
        removeClass: function removeClass(elem, className) {
          if (className) {
            if (elem.className === className) {
              elem.removeAttribute('class');
            } else {
              var classes = elem.className.split(/ +/);
              var index = classes.indexOf(className);

              if (index !== -1) {
                classes.splice(index, 1);
                elem.className = classes.join(' ');
              }
            }
          } else {
            elem.className = undefined;
          }

          return dom;
        },
        hasClass: function hasClass(elem, className) {
          return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
        },
        getWidth: function getWidth(elem) {
          var style = getComputedStyle(elem);
          return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
        },
        getHeight: function getHeight(elem) {
          var style = getComputedStyle(elem);
          return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
        },
        getOffset: function getOffset(el) {
          var elem = el;
          var offset = {
            left: 0,
            top: 0
          };

          if (elem.offsetParent) {
            do {
              offset.left += elem.offsetLeft;
              offset.top += elem.offsetTop;
              elem = elem.offsetParent;
            } while (elem);
          }

          return offset;
        },
        isActive: function isActive(elem) {
          return elem === document.activeElement && (elem.type || elem.href);
        }
      };

      var BooleanController = function (_Controller) {
        inherits(BooleanController, _Controller);

        function BooleanController(object, property) {
          classCallCheck(this, BooleanController);

          var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));

          var _this = _this2;
          _this2.__prev = _this2.getValue();
          _this2.__checkbox = document.createElement('input');

          _this2.__checkbox.setAttribute('type', 'checkbox');

          function onChange() {
            _this.setValue(!_this.__prev);
          }

          dom.bind(_this2.__checkbox, 'change', onChange, false);

          _this2.domElement.appendChild(_this2.__checkbox);

          _this2.updateDisplay();

          return _this2;
        }

        createClass(BooleanController, [{
          key: 'setValue',
          value: function setValue(v) {
            var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);

            if (this.__onFinishChange) {
              this.__onFinishChange.call(this, this.getValue());
            }

            this.__prev = this.getValue();
            return toReturn;
          }
        }, {
          key: 'updateDisplay',
          value: function updateDisplay() {
            if (this.getValue() === true) {
              this.__checkbox.setAttribute('checked', 'checked');

              this.__checkbox.checked = true;
              this.__prev = true;
            } else {
              this.__checkbox.checked = false;
              this.__prev = false;
            }

            return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
          }
        }]);
        return BooleanController;
      }(Controller);

      var OptionController = function (_Controller) {
        inherits(OptionController, _Controller);

        function OptionController(object, property, opts) {
          classCallCheck(this, OptionController);

          var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));

          var options = opts;
          var _this = _this2;
          _this2.__select = document.createElement('select');

          if (Common.isArray(options)) {
            var map = {};
            Common.each(options, function (element) {
              map[element] = element;
            });
            options = map;
          }

          Common.each(options, function (value, key) {
            var opt = document.createElement('option');
            opt.innerHTML = key;
            opt.setAttribute('value', value);

            _this.__select.appendChild(opt);
          });

          _this2.updateDisplay();

          dom.bind(_this2.__select, 'change', function () {
            var desiredValue = this.options[this.selectedIndex].value;

            _this.setValue(desiredValue);
          });

          _this2.domElement.appendChild(_this2.__select);

          return _this2;
        }

        createClass(OptionController, [{
          key: 'setValue',
          value: function setValue(v) {
            var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);

            if (this.__onFinishChange) {
              this.__onFinishChange.call(this, this.getValue());
            }

            return toReturn;
          }
        }, {
          key: 'updateDisplay',
          value: function updateDisplay() {
            if (dom.isActive(this.__select)) return this;
            this.__select.value = this.getValue();
            return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
          }
        }]);
        return OptionController;
      }(Controller);

      var StringController = function (_Controller) {
        inherits(StringController, _Controller);

        function StringController(object, property) {
          classCallCheck(this, StringController);

          var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));

          var _this = _this2;

          function onChange() {
            _this.setValue(_this.__input.value);
          }

          function onBlur() {
            if (_this.__onFinishChange) {
              _this.__onFinishChange.call(_this, _this.getValue());
            }
          }

          _this2.__input = document.createElement('input');

          _this2.__input.setAttribute('type', 'text');

          dom.bind(_this2.__input, 'keyup', onChange);
          dom.bind(_this2.__input, 'change', onChange);
          dom.bind(_this2.__input, 'blur', onBlur);
          dom.bind(_this2.__input, 'keydown', function (e) {
            if (e.keyCode === 13) {
              this.blur();
            }
          });

          _this2.updateDisplay();

          _this2.domElement.appendChild(_this2.__input);

          return _this2;
        }

        createClass(StringController, [{
          key: 'updateDisplay',
          value: function updateDisplay() {
            if (!dom.isActive(this.__input)) {
              this.__input.value = this.getValue();
            }

            return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
          }
        }]);
        return StringController;
      }(Controller);

      function numDecimals(x) {
        var _x = x.toString();

        if (_x.indexOf('.') > -1) {
          return _x.length - _x.indexOf('.') - 1;
        }

        return 0;
      }

      var NumberController = function (_Controller) {
        inherits(NumberController, _Controller);

        function NumberController(object, property, params) {
          classCallCheck(this, NumberController);

          var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));

          var _params = params || {};

          _this.__min = _params.min;
          _this.__max = _params.max;
          _this.__step = _params.step;

          if (Common.isUndefined(_this.__step)) {
            if (_this.initialValue === 0) {
              _this.__impliedStep = 1;
            } else {
              _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
            }
          } else {
            _this.__impliedStep = _this.__step;
          }

          _this.__precision = numDecimals(_this.__impliedStep);
          return _this;
        }

        createClass(NumberController, [{
          key: 'setValue',
          value: function setValue(v) {
            var _v = v;

            if (this.__min !== undefined && _v < this.__min) {
              _v = this.__min;
            } else if (this.__max !== undefined && _v > this.__max) {
              _v = this.__max;
            }

            if (this.__step !== undefined && _v % this.__step !== 0) {
              _v = Math.round(_v / this.__step) * this.__step;
            }

            return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
          }
        }, {
          key: 'min',
          value: function min(minValue) {
            this.__min = minValue;
            return this;
          }
        }, {
          key: 'max',
          value: function max(maxValue) {
            this.__max = maxValue;
            return this;
          }
        }, {
          key: 'step',
          value: function step(stepValue) {
            this.__step = stepValue;
            this.__impliedStep = stepValue;
            this.__precision = numDecimals(stepValue);
            return this;
          }
        }]);
        return NumberController;
      }(Controller);

      function roundToDecimal(value, decimals) {
        var tenTo = Math.pow(10, decimals);
        return Math.round(value * tenTo) / tenTo;
      }

      var NumberControllerBox = function (_NumberController) {
        inherits(NumberControllerBox, _NumberController);

        function NumberControllerBox(object, property, params) {
          classCallCheck(this, NumberControllerBox);

          var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));

          _this2.__truncationSuspended = false;
          var _this = _this2;
          var prevY = void 0;

          function onChange() {
            var attempted = parseFloat(_this.__input.value);

            if (!Common.isNaN(attempted)) {
              _this.setValue(attempted);
            }
          }

          function onFinish() {
            if (_this.__onFinishChange) {
              _this.__onFinishChange.call(_this, _this.getValue());
            }
          }

          function onBlur() {
            onFinish();
          }

          function onMouseDrag(e) {
            var diff = prevY - e.clientY;

            _this.setValue(_this.getValue() + diff * _this.__impliedStep);

            prevY = e.clientY;
          }

          function onMouseUp() {
            dom.unbind(window, 'mousemove', onMouseDrag);
            dom.unbind(window, 'mouseup', onMouseUp);
            onFinish();
          }

          function onMouseDown(e) {
            dom.bind(window, 'mousemove', onMouseDrag);
            dom.bind(window, 'mouseup', onMouseUp);
            prevY = e.clientY;
          }

          _this2.__input = document.createElement('input');

          _this2.__input.setAttribute('type', 'text');

          dom.bind(_this2.__input, 'change', onChange);
          dom.bind(_this2.__input, 'blur', onBlur);
          dom.bind(_this2.__input, 'mousedown', onMouseDown);
          dom.bind(_this2.__input, 'keydown', function (e) {
            if (e.keyCode === 13) {
              _this.__truncationSuspended = true;
              this.blur();
              _this.__truncationSuspended = false;
              onFinish();
            }
          });

          _this2.updateDisplay();

          _this2.domElement.appendChild(_this2.__input);

          return _this2;
        }

        createClass(NumberControllerBox, [{
          key: 'updateDisplay',
          value: function updateDisplay() {
            this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
            return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
          }
        }]);
        return NumberControllerBox;
      }(NumberController);

      function map(v, i1, i2, o1, o2) {
        return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
      }

      var NumberControllerSlider = function (_NumberController) {
        inherits(NumberControllerSlider, _NumberController);

        function NumberControllerSlider(object, property, min, max, step) {
          classCallCheck(this, NumberControllerSlider);

          var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, {
            min: min,
            max: max,
            step: step
          }));

          var _this = _this2;
          _this2.__background = document.createElement('div');
          _this2.__foreground = document.createElement('div');
          dom.bind(_this2.__background, 'mousedown', onMouseDown);
          dom.bind(_this2.__background, 'touchstart', onTouchStart);
          dom.addClass(_this2.__background, 'slider');
          dom.addClass(_this2.__foreground, 'slider-fg');

          function onMouseDown(e) {
            document.activeElement.blur();
            dom.bind(window, 'mousemove', onMouseDrag);
            dom.bind(window, 'mouseup', onMouseUp);
            onMouseDrag(e);
          }

          function onMouseDrag(e) {
            e.preventDefault();

            var bgRect = _this.__background.getBoundingClientRect();

            _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));

            return false;
          }

          function onMouseUp() {
            dom.unbind(window, 'mousemove', onMouseDrag);
            dom.unbind(window, 'mouseup', onMouseUp);

            if (_this.__onFinishChange) {
              _this.__onFinishChange.call(_this, _this.getValue());
            }
          }

          function onTouchStart(e) {
            if (e.touches.length !== 1) {
              return;
            }

            dom.bind(window, 'touchmove', onTouchMove);
            dom.bind(window, 'touchend', onTouchEnd);
            onTouchMove(e);
          }

          function onTouchMove(e) {
            var clientX = e.touches[0].clientX;

            var bgRect = _this.__background.getBoundingClientRect();

            _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
          }

          function onTouchEnd() {
            dom.unbind(window, 'touchmove', onTouchMove);
            dom.unbind(window, 'touchend', onTouchEnd);

            if (_this.__onFinishChange) {
              _this.__onFinishChange.call(_this, _this.getValue());
            }
          }

          _this2.updateDisplay();

          _this2.__background.appendChild(_this2.__foreground);

          _this2.domElement.appendChild(_this2.__background);

          return _this2;
        }

        createClass(NumberControllerSlider, [{
          key: 'updateDisplay',
          value: function updateDisplay() {
            var pct = (this.getValue() - this.__min) / (this.__max - this.__min);

            this.__foreground.style.width = pct * 100 + '%';
            return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
          }
        }]);
        return NumberControllerSlider;
      }(NumberController);

      var FunctionController = function (_Controller) {
        inherits(FunctionController, _Controller);

        function FunctionController(object, property, text) {
          classCallCheck(this, FunctionController);

          var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));

          var _this = _this2;
          _this2.__button = document.createElement('div');
          _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
          dom.bind(_this2.__button, 'click', function (e) {
            e.preventDefault();

            _this.fire();

            return false;
          });
          dom.addClass(_this2.__button, 'button');

          _this2.domElement.appendChild(_this2.__button);

          return _this2;
        }

        createClass(FunctionController, [{
          key: 'fire',
          value: function fire() {
            if (this.__onChange) {
              this.__onChange.call(this);
            }

            this.getValue().call(this.object);

            if (this.__onFinishChange) {
              this.__onFinishChange.call(this, this.getValue());
            }
          }
        }]);
        return FunctionController;
      }(Controller);

      var ColorController = function (_Controller) {
        inherits(ColorController, _Controller);

        function ColorController(object, property) {
          classCallCheck(this, ColorController);

          var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));

          _this2.__color = new Color(_this2.getValue());
          _this2.__temp = new Color(0);
          var _this = _this2;
          _this2.domElement = document.createElement('div');
          dom.makeSelectable(_this2.domElement, false);
          _this2.__selector = document.createElement('div');
          _this2.__selector.className = 'selector';
          _this2.__saturation_field = document.createElement('div');
          _this2.__saturation_field.className = 'saturation-field';
          _this2.__field_knob = document.createElement('div');
          _this2.__field_knob.className = 'field-knob';
          _this2.__field_knob_border = '2px solid ';
          _this2.__hue_knob = document.createElement('div');
          _this2.__hue_knob.className = 'hue-knob';
          _this2.__hue_field = document.createElement('div');
          _this2.__hue_field.className = 'hue-field';
          _this2.__input = document.createElement('input');
          _this2.__input.type = 'text';
          _this2.__input_textShadow = '0 1px 1px ';
          dom.bind(_this2.__input, 'keydown', function (e) {
            if (e.keyCode === 13) {
              onBlur.call(this);
            }
          });
          dom.bind(_this2.__input, 'blur', onBlur);
          dom.bind(_this2.__selector, 'mousedown', function () {
            dom.addClass(this, 'drag').bind(window, 'mouseup', function () {
              dom.removeClass(_this.__selector, 'drag');
            });
          });
          dom.bind(_this2.__selector, 'touchstart', function () {
            dom.addClass(this, 'drag').bind(window, 'touchend', function () {
              dom.removeClass(_this.__selector, 'drag');
            });
          });
          var valueField = document.createElement('div');
          Common.extend(_this2.__selector.style, {
            width: '122px',
            height: '102px',
            padding: '3px',
            backgroundColor: '#222',
            boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
          });
          Common.extend(_this2.__field_knob.style, {
            position: 'absolute',
            width: '12px',
            height: '12px',
            border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
            boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
            borderRadius: '12px',
            zIndex: 1
          });
          Common.extend(_this2.__hue_knob.style, {
            position: 'absolute',
            width: '15px',
            height: '2px',
            borderRight: '4px solid #fff',
            zIndex: 1
          });
          Common.extend(_this2.__saturation_field.style, {
            width: '100px',
            height: '100px',
            border: '1px solid #555',
            marginRight: '3px',
            display: 'inline-block',
            cursor: 'pointer'
          });
          Common.extend(valueField.style, {
            width: '100%',
            height: '100%',
            background: 'none'
          });
          linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
          Common.extend(_this2.__hue_field.style, {
            width: '15px',
            height: '100px',
            border: '1px solid #555',
            cursor: 'ns-resize',
            position: 'absolute',
            top: '3px',
            right: '3px'
          });
          hueGradient(_this2.__hue_field);
          Common.extend(_this2.__input.style, {
            outline: 'none',
            textAlign: 'center',
            color: '#fff',
            border: 0,
            fontWeight: 'bold',
            textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
          });
          dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
          dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
          dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
          dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
          dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
          dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);

          function fieldDown(e) {
            setSV(e);
            dom.bind(window, 'mousemove', setSV);
            dom.bind(window, 'touchmove', setSV);
            dom.bind(window, 'mouseup', fieldUpSV);
            dom.bind(window, 'touchend', fieldUpSV);
          }

          function fieldDownH(e) {
            setH(e);
            dom.bind(window, 'mousemove', setH);
            dom.bind(window, 'touchmove', setH);
            dom.bind(window, 'mouseup', fieldUpH);
            dom.bind(window, 'touchend', fieldUpH);
          }

          function fieldUpSV() {
            dom.unbind(window, 'mousemove', setSV);
            dom.unbind(window, 'touchmove', setSV);
            dom.unbind(window, 'mouseup', fieldUpSV);
            dom.unbind(window, 'touchend', fieldUpSV);
            onFinish();
          }

          function fieldUpH() {
            dom.unbind(window, 'mousemove', setH);
            dom.unbind(window, 'touchmove', setH);
            dom.unbind(window, 'mouseup', fieldUpH);
            dom.unbind(window, 'touchend', fieldUpH);
            onFinish();
          }

          function onBlur() {
            var i = interpret(this.value);

            if (i !== false) {
              _this.__color.__state = i;

              _this.setValue(_this.__color.toOriginal());
            } else {
              this.value = _this.__color.toString();
            }
          }

          function onFinish() {
            if (_this.__onFinishChange) {
              _this.__onFinishChange.call(_this, _this.__color.toOriginal());
            }
          }

          _this2.__saturation_field.appendChild(valueField);

          _this2.__selector.appendChild(_this2.__field_knob);

          _this2.__selector.appendChild(_this2.__saturation_field);

          _this2.__selector.appendChild(_this2.__hue_field);

          _this2.__hue_field.appendChild(_this2.__hue_knob);

          _this2.domElement.appendChild(_this2.__input);

          _this2.domElement.appendChild(_this2.__selector);

          _this2.updateDisplay();

          function setSV(e) {
            if (e.type.indexOf('touch') === -1) {
              e.preventDefault();
            }

            var fieldRect = _this.__saturation_field.getBoundingClientRect();

            var _ref = e.touches && e.touches[0] || e,
                clientX = _ref.clientX,
                clientY = _ref.clientY;

            var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
            var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

            if (v > 1) {
              v = 1;
            } else if (v < 0) {
              v = 0;
            }

            if (s > 1) {
              s = 1;
            } else if (s < 0) {
              s = 0;
            }

            _this.__color.v = v;
            _this.__color.s = s;

            _this.setValue(_this.__color.toOriginal());

            return false;
          }

          function setH(e) {
            if (e.type.indexOf('touch') === -1) {
              e.preventDefault();
            }

            var fieldRect = _this.__hue_field.getBoundingClientRect();

            var _ref2 = e.touches && e.touches[0] || e,
                clientY = _ref2.clientY;

            var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

            if (h > 1) {
              h = 1;
            } else if (h < 0) {
              h = 0;
            }

            _this.__color.h = h * 360;

            _this.setValue(_this.__color.toOriginal());

            return false;
          }

          return _this2;
        }

        createClass(ColorController, [{
          key: 'updateDisplay',
          value: function updateDisplay() {
            var i = interpret(this.getValue());

            if (i !== false) {
              var mismatch = false;
              Common.each(Color.COMPONENTS, function (component) {
                if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
                  mismatch = true;
                  return {};
                }
              }, this);

              if (mismatch) {
                Common.extend(this.__color.__state, i);
              }
            }

            Common.extend(this.__temp.__state, this.__color.__state);
            this.__temp.a = 1;
            var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;

            var _flip = 255 - flip;

            Common.extend(this.__field_knob.style, {
              marginLeft: 100 * this.__color.s - 7 + 'px',
              marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
              backgroundColor: this.__temp.toHexString(),
              border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
            });
            this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
            this.__temp.s = 1;
            this.__temp.v = 1;
            linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
            this.__input.value = this.__color.toString();
            Common.extend(this.__input.style, {
              backgroundColor: this.__color.toHexString(),
              color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
              textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
            });
          }
        }]);
        return ColorController;
      }(Controller);

      var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

      function linearGradient(elem, x, a, b) {
        elem.style.background = '';
        Common.each(vendors, function (vendor) {
          elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
        });
      }

      function hueGradient(elem) {
        elem.style.background = '';
        elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
        elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
        elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
        elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
        elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
      }

      var css = {
        load: function load(url, indoc) {
          var doc = indoc || document;
          var link = doc.createElement('link');
          link.type = 'text/css';
          link.rel = 'stylesheet';
          link.href = url;
          doc.getElementsByTagName('head')[0].appendChild(link);
        },
        inject: function inject(cssContent, indoc) {
          var doc = indoc || document;
          var injected = document.createElement('style');
          injected.type = 'text/css';
          injected.innerHTML = cssContent;
          var head = doc.getElementsByTagName('head')[0];

          try {
            head.appendChild(injected);
          } catch (e) {}
        }
      };
      var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

      var ControllerFactory = function ControllerFactory(object, property) {
        var initialValue = object[property];

        if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
          return new OptionController(object, property, arguments[2]);
        }

        if (Common.isNumber(initialValue)) {
          if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
            if (Common.isNumber(arguments[4])) {
              return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
            }

            return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
          }

          if (Common.isNumber(arguments[4])) {
            return new NumberControllerBox(object, property, {
              min: arguments[2],
              max: arguments[3],
              step: arguments[4]
            });
          }

          return new NumberControllerBox(object, property, {
            min: arguments[2],
            max: arguments[3]
          });
        }

        if (Common.isString(initialValue)) {
          return new StringController(object, property);
        }

        if (Common.isFunction(initialValue)) {
          return new FunctionController(object, property, '');
        }

        if (Common.isBoolean(initialValue)) {
          return new BooleanController(object, property);
        }

        return null;
      };

      function requestAnimationFrame(callback) {
        setTimeout(callback, 1000 / 60);
      }

      var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame;

      var CenteredDiv = function () {
        function CenteredDiv() {
          classCallCheck(this, CenteredDiv);
          this.backgroundElement = document.createElement('div');
          Common.extend(this.backgroundElement.style, {
            backgroundColor: 'rgba(0,0,0,0.8)',
            top: 0,
            left: 0,
            display: 'none',
            zIndex: '1000',
            opacity: 0,
            WebkitTransition: 'opacity 0.2s linear',
            transition: 'opacity 0.2s linear'
          });
          dom.makeFullscreen(this.backgroundElement);
          this.backgroundElement.style.position = 'fixed';
          this.domElement = document.createElement('div');
          Common.extend(this.domElement.style, {
            position: 'fixed',
            display: 'none',
            zIndex: '1001',
            opacity: 0,
            WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
            transition: 'transform 0.2s ease-out, opacity 0.2s linear'
          });
          document.body.appendChild(this.backgroundElement);
          document.body.appendChild(this.domElement);

          var _this = this;

          dom.bind(this.backgroundElement, 'click', function () {
            _this.hide();
          });
        }

        createClass(CenteredDiv, [{
          key: 'show',
          value: function show() {
            var _this = this;

            this.backgroundElement.style.display = 'block';
            this.domElement.style.display = 'block';
            this.domElement.style.opacity = 0;
            this.domElement.style.webkitTransform = 'scale(1.1)';
            this.layout();
            Common.defer(function () {
              _this.backgroundElement.style.opacity = 1;
              _this.domElement.style.opacity = 1;
              _this.domElement.style.webkitTransform = 'scale(1)';
            });
          }
        }, {
          key: 'hide',
          value: function hide() {
            var _this = this;

            var hide = function hide() {
              _this.domElement.style.display = 'none';
              _this.backgroundElement.style.display = 'none';
              dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
              dom.unbind(_this.domElement, 'transitionend', hide);
              dom.unbind(_this.domElement, 'oTransitionEnd', hide);
            };

            dom.bind(this.domElement, 'webkitTransitionEnd', hide);
            dom.bind(this.domElement, 'transitionend', hide);
            dom.bind(this.domElement, 'oTransitionEnd', hide);
            this.backgroundElement.style.opacity = 0;
            this.domElement.style.opacity = 0;
            this.domElement.style.webkitTransform = 'scale(1.1)';
          }
        }, {
          key: 'layout',
          value: function layout() {
            this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
            this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
          }
        }]);
        return CenteredDiv;
      }();

      var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

      css.inject(styleSheet);
      var CSS_NAMESPACE = 'dg';
      var HIDE_KEY_CODE = 72;
      var CLOSE_BUTTON_HEIGHT = 20;
      var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

      var SUPPORTS_LOCAL_STORAGE = function () {
        try {
          return !!window.localStorage;
        } catch (e) {
          return false;
        }
      }();

      var SAVE_DIALOGUE = void 0;
      var autoPlaceVirgin = true;
      var autoPlaceContainer = void 0;
      var hide = false;
      var hideableGuis = [];

      var GUI = function GUI(pars) {
        var _this = this;

        var params = pars || {};
        this.domElement = document.createElement('div');
        this.__ul = document.createElement('ul');
        this.domElement.appendChild(this.__ul);
        dom.addClass(this.domElement, CSS_NAMESPACE);
        this.__folders = {};
        this.__controllers = [];
        this.__rememberedObjects = [];
        this.__rememberedObjectIndecesToControllers = [];
        this.__listening = [];
        params = Common.defaults(params, {
          closeOnTop: false,
          autoPlace: true,
          width: GUI.DEFAULT_WIDTH
        });
        params = Common.defaults(params, {
          resizable: params.autoPlace,
          hideable: params.autoPlace
        });

        if (!Common.isUndefined(params.load)) {
          if (params.preset) {
            params.load.preset = params.preset;
          }
        } else {
          params.load = {
            preset: DEFAULT_DEFAULT_PRESET_NAME
          };
        }

        if (Common.isUndefined(params.parent) && params.hideable) {
          hideableGuis.push(this);
        }

        params.resizable = Common.isUndefined(params.parent) && params.resizable;

        if (params.autoPlace && Common.isUndefined(params.scrollable)) {
          params.scrollable = true;
        }

        var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
        var saveToLocalStorage = void 0;
        var titleRow = void 0;
        Object.defineProperties(this, {
          parent: {
            get: function get$$1() {
              return params.parent;
            }
          },
          scrollable: {
            get: function get$$1() {
              return params.scrollable;
            }
          },
          autoPlace: {
            get: function get$$1() {
              return params.autoPlace;
            }
          },
          closeOnTop: {
            get: function get$$1() {
              return params.closeOnTop;
            }
          },
          preset: {
            get: function get$$1() {
              if (_this.parent) {
                return _this.getRoot().preset;
              }

              return params.load.preset;
            },
            set: function set$$1(v) {
              if (_this.parent) {
                _this.getRoot().preset = v;
              } else {
                params.load.preset = v;
              }

              setPresetSelectIndex(this);

              _this.revert();
            }
          },
          width: {
            get: function get$$1() {
              return params.width;
            },
            set: function set$$1(v) {
              params.width = v;
              setWidth(_this, v);
            }
          },
          name: {
            get: function get$$1() {
              return params.name;
            },
            set: function set$$1(v) {
              params.name = v;

              if (titleRow) {
                titleRow.innerHTML = params.name;
              }
            }
          },
          closed: {
            get: function get$$1() {
              return params.closed;
            },
            set: function set$$1(v) {
              params.closed = v;

              if (params.closed) {
                dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
              } else {
                dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
              }

              this.onResize();

              if (_this.__closeButton) {
                _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
              }
            }
          },
          load: {
            get: function get$$1() {
              return params.load;
            }
          },
          useLocalStorage: {
            get: function get$$1() {
              return useLocalStorage;
            },
            set: function set$$1(bool) {
              if (SUPPORTS_LOCAL_STORAGE) {
                useLocalStorage = bool;

                if (bool) {
                  dom.bind(window, 'unload', saveToLocalStorage);
                } else {
                  dom.unbind(window, 'unload', saveToLocalStorage);
                }

                localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
              }
            }
          }
        });

        if (Common.isUndefined(params.parent)) {
          this.closed = params.closed || false;
          dom.addClass(this.domElement, GUI.CLASS_MAIN);
          dom.makeSelectable(this.domElement, false);

          if (SUPPORTS_LOCAL_STORAGE) {
            if (useLocalStorage) {
              _this.useLocalStorage = true;
              var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

              if (savedGui) {
                params.load = JSON.parse(savedGui);
              }
            }
          }

          this.__closeButton = document.createElement('div');
          this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
          dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);

          if (params.closeOnTop) {
            dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
            this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
          } else {
            dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
            this.domElement.appendChild(this.__closeButton);
          }

          dom.bind(this.__closeButton, 'click', function () {
            _this.closed = !_this.closed;
          });
        } else {
          if (params.closed === undefined) {
            params.closed = true;
          }

          var titleRowName = document.createTextNode(params.name);
          dom.addClass(titleRowName, 'controller-name');
          titleRow = addRow(_this, titleRowName);

          var onClickTitle = function onClickTitle(e) {
            e.preventDefault();
            _this.closed = !_this.closed;
            return false;
          };

          dom.addClass(this.__ul, GUI.CLASS_CLOSED);
          dom.addClass(titleRow, 'title');
          dom.bind(titleRow, 'click', onClickTitle);

          if (!params.closed) {
            this.closed = false;
          }
        }

        if (params.autoPlace) {
          if (Common.isUndefined(params.parent)) {
            if (autoPlaceVirgin) {
              autoPlaceContainer = document.createElement('div');
              dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
              dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
              document.body.appendChild(autoPlaceContainer);
              autoPlaceVirgin = false;
            }

            autoPlaceContainer.appendChild(this.domElement);
            dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
          }

          if (!this.parent) {
            setWidth(_this, params.width);
          }
        }

        this.__resizeHandler = function () {
          _this.onResizeDebounced();
        };

        dom.bind(window, 'resize', this.__resizeHandler);
        dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
        dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
        dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
        this.onResize();

        if (params.resizable) {
          addResizeHandle(this);
        }

        saveToLocalStorage = function saveToLocalStorage() {
          if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
            localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
          }
        };

        this.saveToLocalStorageIfPossible = saveToLocalStorage;

        function resetWidth() {
          var root = _this.getRoot();

          root.width += 1;
          Common.defer(function () {
            root.width -= 1;
          });
        }

        if (!params.parent) {
          resetWidth();
        }
      };

      GUI.toggleHide = function () {
        hide = !hide;
        Common.each(hideableGuis, function (gui) {
          gui.domElement.style.display = hide ? 'none' : '';
        });
      };

      GUI.CLASS_AUTO_PLACE = 'a';
      GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
      GUI.CLASS_MAIN = 'main';
      GUI.CLASS_CONTROLLER_ROW = 'cr';
      GUI.CLASS_TOO_TALL = 'taller-than-window';
      GUI.CLASS_CLOSED = 'closed';
      GUI.CLASS_CLOSE_BUTTON = 'close-button';
      GUI.CLASS_CLOSE_TOP = 'close-top';
      GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
      GUI.CLASS_DRAG = 'drag';
      GUI.DEFAULT_WIDTH = 245;
      GUI.TEXT_CLOSED = 'Close Controls';
      GUI.TEXT_OPEN = 'Open Controls';

      GUI._keydownHandler = function (e) {
        if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
          GUI.toggleHide();
        }
      };

      dom.bind(window, 'keydown', GUI._keydownHandler, false);
      Common.extend(GUI.prototype, {
        add: function add(object, property) {
          return _add(this, object, property, {
            factoryArgs: Array.prototype.slice.call(arguments, 2)
          });
        },
        addColor: function addColor(object, property) {
          return _add(this, object, property, {
            color: true
          });
        },
        remove: function remove(controller) {
          this.__ul.removeChild(controller.__li);

          this.__controllers.splice(this.__controllers.indexOf(controller), 1);

          var _this = this;

          Common.defer(function () {
            _this.onResize();
          });
        },
        destroy: function destroy() {
          if (this.parent) {
            throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
          }

          if (this.autoPlace) {
            autoPlaceContainer.removeChild(this.domElement);
          }

          var _this = this;

          Common.each(this.__folders, function (subfolder) {
            _this.removeFolder(subfolder);
          });
          dom.unbind(window, 'keydown', GUI._keydownHandler, false);
          removeListeners(this);
        },
        addFolder: function addFolder(name) {
          if (this.__folders[name] !== undefined) {
            throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
          }

          var newGuiParams = {
            name: name,
            parent: this
          };
          newGuiParams.autoPlace = this.autoPlace;

          if (this.load && this.load.folders && this.load.folders[name]) {
            newGuiParams.closed = this.load.folders[name].closed;
            newGuiParams.load = this.load.folders[name];
          }

          var gui = new GUI(newGuiParams);
          this.__folders[name] = gui;
          var li = addRow(this, gui.domElement);
          dom.addClass(li, 'folder');
          return gui;
        },
        removeFolder: function removeFolder(folder) {
          this.__ul.removeChild(folder.domElement.parentElement);

          delete this.__folders[folder.name];

          if (this.load && this.load.folders && this.load.folders[folder.name]) {
            delete this.load.folders[folder.name];
          }

          removeListeners(folder);

          var _this = this;

          Common.each(folder.__folders, function (subfolder) {
            folder.removeFolder(subfolder);
          });
          Common.defer(function () {
            _this.onResize();
          });
        },
        open: function open() {
          this.closed = false;
        },
        close: function close() {
          this.closed = true;
        },
        hide: function hide() {
          this.domElement.style.display = 'none';
        },
        show: function show() {
          this.domElement.style.display = '';
        },
        onResize: function onResize() {
          var root = this.getRoot();

          if (root.scrollable) {
            var top = dom.getOffset(root.__ul).top;
            var h = 0;
            Common.each(root.__ul.childNodes, function (node) {
              if (!(root.autoPlace && node === root.__save_row)) {
                h += dom.getHeight(node);
              }
            });

            if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
              dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
              root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
            } else {
              dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
              root.__ul.style.height = 'auto';
            }
          }

          if (root.__resize_handle) {
            Common.defer(function () {
              root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
            });
          }

          if (root.__closeButton) {
            root.__closeButton.style.width = root.width + 'px';
          }
        },
        onResizeDebounced: Common.debounce(function () {
          this.onResize();
        }, 50),
        remember: function remember() {
          if (Common.isUndefined(SAVE_DIALOGUE)) {
            SAVE_DIALOGUE = new CenteredDiv();
            SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
          }

          if (this.parent) {
            throw new Error('You can only call remember on a top level GUI.');
          }

          var _this = this;

          Common.each(Array.prototype.slice.call(arguments), function (object) {
            if (_this.__rememberedObjects.length === 0) {
              addSaveMenu(_this);
            }

            if (_this.__rememberedObjects.indexOf(object) === -1) {
              _this.__rememberedObjects.push(object);
            }
          });

          if (this.autoPlace) {
            setWidth(this, this.width);
          }
        },
        getRoot: function getRoot() {
          var gui = this;

          while (gui.parent) {
            gui = gui.parent;
          }

          return gui;
        },
        getSaveObject: function getSaveObject() {
          var toReturn = this.load;
          toReturn.closed = this.closed;

          if (this.__rememberedObjects.length > 0) {
            toReturn.preset = this.preset;

            if (!toReturn.remembered) {
              toReturn.remembered = {};
            }

            toReturn.remembered[this.preset] = getCurrentPreset(this);
          }

          toReturn.folders = {};
          Common.each(this.__folders, function (element, key) {
            toReturn.folders[key] = element.getSaveObject();
          });
          return toReturn;
        },
        save: function save() {
          if (!this.load.remembered) {
            this.load.remembered = {};
          }

          this.load.remembered[this.preset] = getCurrentPreset(this);
          markPresetModified(this, false);
          this.saveToLocalStorageIfPossible();
        },
        saveAs: function saveAs(presetName) {
          if (!this.load.remembered) {
            this.load.remembered = {};
            this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
          }

          this.load.remembered[presetName] = getCurrentPreset(this);
          this.preset = presetName;
          addPresetOption(this, presetName, true);
          this.saveToLocalStorageIfPossible();
        },
        revert: function revert(gui) {
          Common.each(this.__controllers, function (controller) {
            if (!this.getRoot().load.remembered) {
              controller.setValue(controller.initialValue);
            } else {
              recallSavedValue(gui || this.getRoot(), controller);
            }

            if (controller.__onFinishChange) {
              controller.__onFinishChange.call(controller, controller.getValue());
            }
          }, this);
          Common.each(this.__folders, function (folder) {
            folder.revert(folder);
          });

          if (!gui) {
            markPresetModified(this.getRoot(), false);
          }
        },
        listen: function listen(controller) {
          var init = this.__listening.length === 0;

          this.__listening.push(controller);

          if (init) {
            updateDisplays(this.__listening);
          }
        },
        updateDisplay: function updateDisplay() {
          Common.each(this.__controllers, function (controller) {
            controller.updateDisplay();
          });
          Common.each(this.__folders, function (folder) {
            folder.updateDisplay();
          });
        }
      });

      function addRow(gui, newDom, liBefore) {
        var li = document.createElement('li');

        if (newDom) {
          li.appendChild(newDom);
        }

        if (liBefore) {
          gui.__ul.insertBefore(li, liBefore);
        } else {
          gui.__ul.appendChild(li);
        }

        gui.onResize();
        return li;
      }

      function removeListeners(gui) {
        dom.unbind(window, 'resize', gui.__resizeHandler);

        if (gui.saveToLocalStorageIfPossible) {
          dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
        }
      }

      function markPresetModified(gui, modified) {
        var opt = gui.__preset_select[gui.__preset_select.selectedIndex];

        if (modified) {
          opt.innerHTML = opt.value + '*';
        } else {
          opt.innerHTML = opt.value;
        }
      }

      function augmentController(gui, li, controller) {
        controller.__li = li;
        controller.__gui = gui;
        Common.extend(controller, {
          options: function options(_options) {
            if (arguments.length > 1) {
              var nextSibling = controller.__li.nextElementSibling;
              controller.remove();
              return _add(gui, controller.object, controller.property, {
                before: nextSibling,
                factoryArgs: [Common.toArray(arguments)]
              });
            }

            if (Common.isArray(_options) || Common.isObject(_options)) {
              var _nextSibling = controller.__li.nextElementSibling;
              controller.remove();
              return _add(gui, controller.object, controller.property, {
                before: _nextSibling,
                factoryArgs: [_options]
              });
            }
          },
          name: function name(_name) {
            controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
            return controller;
          },
          listen: function listen() {
            controller.__gui.listen(controller);

            return controller;
          },
          remove: function remove() {
            controller.__gui.remove(controller);

            return controller;
          }
        });

        if (controller instanceof NumberControllerSlider) {
          var box = new NumberControllerBox(controller.object, controller.property, {
            min: controller.__min,
            max: controller.__max,
            step: controller.__step
          });
          Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
            var pc = controller[method];
            var pb = box[method];

            controller[method] = box[method] = function () {
              var args = Array.prototype.slice.call(arguments);
              pb.apply(box, args);
              return pc.apply(controller, args);
            };
          });
          dom.addClass(li, 'has-slider');
          controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
        } else if (controller instanceof NumberControllerBox) {
          var r = function r(returned) {
            if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
              var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
              var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
              controller.remove();

              var newController = _add(gui, controller.object, controller.property, {
                before: controller.__li.nextElementSibling,
                factoryArgs: [controller.__min, controller.__max, controller.__step]
              });

              newController.name(oldName);
              if (wasListening) newController.listen();
              return newController;
            }

            return returned;
          };

          controller.min = Common.compose(r, controller.min);
          controller.max = Common.compose(r, controller.max);
        } else if (controller instanceof BooleanController) {
          dom.bind(li, 'click', function () {
            dom.fakeEvent(controller.__checkbox, 'click');
          });
          dom.bind(controller.__checkbox, 'click', function (e) {
            e.stopPropagation();
          });
        } else if (controller instanceof FunctionController) {
          dom.bind(li, 'click', function () {
            dom.fakeEvent(controller.__button, 'click');
          });
          dom.bind(li, 'mouseover', function () {
            dom.addClass(controller.__button, 'hover');
          });
          dom.bind(li, 'mouseout', function () {
            dom.removeClass(controller.__button, 'hover');
          });
        } else if (controller instanceof ColorController) {
          dom.addClass(li, 'color');
          controller.updateDisplay = Common.compose(function (val) {
            li.style.borderLeftColor = controller.__color.toString();
            return val;
          }, controller.updateDisplay);
          controller.updateDisplay();
        }

        controller.setValue = Common.compose(function (val) {
          if (gui.getRoot().__preset_select && controller.isModified()) {
            markPresetModified(gui.getRoot(), true);
          }

          return val;
        }, controller.setValue);
      }

      function recallSavedValue(gui, controller) {
        var root = gui.getRoot();

        var matchedIndex = root.__rememberedObjects.indexOf(controller.object);

        if (matchedIndex !== -1) {
          var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];

          if (controllerMap === undefined) {
            controllerMap = {};
            root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
          }

          controllerMap[controller.property] = controller;

          if (root.load && root.load.remembered) {
            var presetMap = root.load.remembered;
            var preset = void 0;

            if (presetMap[gui.preset]) {
              preset = presetMap[gui.preset];
            } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
              preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
            } else {
              return;
            }

            if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
              var value = preset[matchedIndex][controller.property];
              controller.initialValue = value;
              controller.setValue(value);
            }
          }
        }
      }

      function _add(gui, object, property, params) {
        if (object[property] === undefined) {
          throw new Error('Object "' + object + '" has no property "' + property + '"');
        }

        var controller = void 0;

        if (params.color) {
          controller = new ColorController(object, property);
        } else {
          var factoryArgs = [object, property].concat(params.factoryArgs);
          controller = ControllerFactory.apply(gui, factoryArgs);
        }

        if (params.before instanceof Controller) {
          params.before = params.before.__li;
        }

        recallSavedValue(gui, controller);
        dom.addClass(controller.domElement, 'c');
        var name = document.createElement('span');
        dom.addClass(name, 'property-name');
        name.innerHTML = controller.property;
        var container = document.createElement('div');
        container.appendChild(name);
        container.appendChild(controller.domElement);
        var li = addRow(gui, container, params.before);
        dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);

        if (controller instanceof ColorController) {
          dom.addClass(li, 'color');
        } else {
          dom.addClass(li, _typeof(controller.getValue()));
        }

        augmentController(gui, li, controller);

        gui.__controllers.push(controller);

        return controller;
      }

      function getLocalStorageHash(gui, key) {
        return document.location.href + '.' + key;
      }

      function addPresetOption(gui, name, setSelected) {
        var opt = document.createElement('option');
        opt.innerHTML = name;
        opt.value = name;

        gui.__preset_select.appendChild(opt);

        if (setSelected) {
          gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
        }
      }

      function showHideExplain(gui, explain) {
        explain.style.display = gui.useLocalStorage ? 'block' : 'none';
      }

      function addSaveMenu(gui) {
        var div = gui.__save_row = document.createElement('li');
        dom.addClass(gui.domElement, 'has-save');

        gui.__ul.insertBefore(div, gui.__ul.firstChild);

        dom.addClass(div, 'save-row');
        var gears = document.createElement('span');
        gears.innerHTML = '&nbsp;';
        dom.addClass(gears, 'button gears');
        var button = document.createElement('span');
        button.innerHTML = 'Save';
        dom.addClass(button, 'button');
        dom.addClass(button, 'save');
        var button2 = document.createElement('span');
        button2.innerHTML = 'New';
        dom.addClass(button2, 'button');
        dom.addClass(button2, 'save-as');
        var button3 = document.createElement('span');
        button3.innerHTML = 'Revert';
        dom.addClass(button3, 'button');
        dom.addClass(button3, 'revert');
        var select = gui.__preset_select = document.createElement('select');

        if (gui.load && gui.load.remembered) {
          Common.each(gui.load.remembered, function (value, key) {
            addPresetOption(gui, key, key === gui.preset);
          });
        } else {
          addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
        }

        dom.bind(select, 'change', function () {
          for (var index = 0; index < gui.__preset_select.length; index++) {
            gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
          }

          gui.preset = this.value;
        });
        div.appendChild(select);
        div.appendChild(gears);
        div.appendChild(button);
        div.appendChild(button2);
        div.appendChild(button3);

        if (SUPPORTS_LOCAL_STORAGE) {
          var explain = document.getElementById('dg-local-explain');
          var localStorageCheckBox = document.getElementById('dg-local-storage');
          var saveLocally = document.getElementById('dg-save-locally');
          saveLocally.style.display = 'block';

          if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
            localStorageCheckBox.setAttribute('checked', 'checked');
          }

          showHideExplain(gui, explain);
          dom.bind(localStorageCheckBox, 'change', function () {
            gui.useLocalStorage = !gui.useLocalStorage;
            showHideExplain(gui, explain);
          });
        }

        var newConstructorTextArea = document.getElementById('dg-new-constructor');
        dom.bind(newConstructorTextArea, 'keydown', function (e) {
          if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
            SAVE_DIALOGUE.hide();
          }
        });
        dom.bind(gears, 'click', function () {
          newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
          SAVE_DIALOGUE.show();
          newConstructorTextArea.focus();
          newConstructorTextArea.select();
        });
        dom.bind(button, 'click', function () {
          gui.save();
        });
        dom.bind(button2, 'click', function () {
          var presetName = prompt('Enter a new preset name.');

          if (presetName) {
            gui.saveAs(presetName);
          }
        });
        dom.bind(button3, 'click', function () {
          gui.revert();
        });
      }

      function addResizeHandle(gui) {
        var pmouseX = void 0;
        gui.__resize_handle = document.createElement('div');
        Common.extend(gui.__resize_handle.style, {
          width: '6px',
          marginLeft: '-3px',
          height: '200px',
          cursor: 'ew-resize',
          position: 'absolute'
        });

        function drag(e) {
          e.preventDefault();
          gui.width += pmouseX - e.clientX;
          gui.onResize();
          pmouseX = e.clientX;
          return false;
        }

        function dragStop() {
          dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
          dom.unbind(window, 'mousemove', drag);
          dom.unbind(window, 'mouseup', dragStop);
        }

        function dragStart(e) {
          e.preventDefault();
          pmouseX = e.clientX;
          dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
          dom.bind(window, 'mousemove', drag);
          dom.bind(window, 'mouseup', dragStop);
          return false;
        }

        dom.bind(gui.__resize_handle, 'mousedown', dragStart);
        dom.bind(gui.__closeButton, 'mousedown', dragStart);
        gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
      }

      function setWidth(gui, w) {
        gui.domElement.style.width = w + 'px';

        if (gui.__save_row && gui.autoPlace) {
          gui.__save_row.style.width = w + 'px';
        }

        if (gui.__closeButton) {
          gui.__closeButton.style.width = w + 'px';
        }
      }

      function getCurrentPreset(gui, useInitialValues) {
        var toReturn = {};
        Common.each(gui.__rememberedObjects, function (val, index) {
          var savedValues = {};
          var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
          Common.each(controllerMap, function (controller, property) {
            savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
          });
          toReturn[index] = savedValues;
        });
        return toReturn;
      }

      function setPresetSelectIndex(gui) {
        for (var index = 0; index < gui.__preset_select.length; index++) {
          if (gui.__preset_select[index].value === gui.preset) {
            gui.__preset_select.selectedIndex = index;
          }
        }
      }

      function updateDisplays(controllerArray) {
        if (controllerArray.length !== 0) {
          requestAnimationFrame$1.call(window, function () {
            updateDisplays(controllerArray);
          });
        }

        Common.each(controllerArray, function (c) {
          c.updateDisplay();
        });
      }

      var color = {
        Color: Color,
        math: ColorMath,
        interpret: interpret
      };
      var controllers = {
        Controller: Controller,
        BooleanController: BooleanController,
        OptionController: OptionController,
        StringController: StringController,
        NumberController: NumberController,
        NumberControllerBox: NumberControllerBox,
        NumberControllerSlider: NumberControllerSlider,
        FunctionController: FunctionController,
        ColorController: ColorController
      };
      var dom$1 = {
        dom: dom
      };
      var gui = {
        GUI: GUI
      };
      var GUI$1 = GUI;
      var index = {
        color: color,
        controllers: controllers,
        dom: dom$1,
        gui: gui,
        GUI: GUI$1
      };
      exports.color = color;
      exports.controllers = controllers;
      exports.dom = dom$1;
      exports.gui = gui;
      exports.GUI = GUI$1;
      exports['default'] = index;
      Object.defineProperty(exports, '__esModule', {
        value: true
      });
    });
  }, {}],
  3: [function (require, module, exports) {
    // Uses Node, AMD or browser globals to create a module.
    // If you want something that will work in other stricter CommonJS environments,
    // or if you need to create a circular dependency, see commonJsStrict.js
    // Defines a module "returnExports" that depends another module called "b".
    // Note that the name of the module is implied by the file name. It is best
    // if the file name and the exported global have matching names.
    // If the 'b' module also uses this type of boilerplate, then
    // in the browser, it will create a global .b that is used below.
    // If you do not want to support the browser global path, then you
    // can remove the `root` use and the passing `this` as the first arg to
    // the top function.
    (function (root, factory) {
      if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
      } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
      } else {
        // Browser globals
        root.returnExports = factory();
      }
    })(this, function () {
      /*!
      * jQuery JavaScript Library v1.8.1
      * http://jquery.com/
      *
      * Includes Sizzle.js
      * http://sizzlejs.com/
      *
      * Copyright 2012 jQuery Foundation and other contributors
      * Released under the MIT license
      * http://jquery.org/license
      *
      * Date: Thu Aug 30 2012 17:17:22 GMT-0400 (Eastern Daylight Time)
      */
      return function (window, undefined) {
        var // A central reference to the root jQuery(document)
        rootjQuery,
            // The deferred used on DOM ready
        readyList,
            // Use the correct document accordingly with window argument (sandbox)
        document = window.document,
            location = window.location,
            navigator = window.navigator,
            // Map over jQuery in case of overwrite
        _jQuery = window.jQuery,
            // Map over the $ in case of overwrite
        _$ = window.$,
            // Save a reference to some core methods
        core_push = Array.prototype.push,
            core_slice = Array.prototype.slice,
            core_indexOf = Array.prototype.indexOf,
            core_toString = Object.prototype.toString,
            core_hasOwn = Object.prototype.hasOwnProperty,
            core_trim = String.prototype.trim,
            // Define a local copy of jQuery
        jQuery = function (selector, context) {
          // The jQuery object is actually just the init constructor 'enhanced'
          return new jQuery.fn.init(selector, context, rootjQuery);
        },
            // Used for matching numbers
        core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,
            // Used for detecting and trimming whitespace
        core_rnotwhite = /\S/,
            core_rspace = /\s+/,
            // Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
        rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
            // A simple way to check for HTML strings
        // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
        rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,
            // Match a standalone tag
        rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
            // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,
            rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
            rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
            rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,
            // Matches dashed string for camelizing
        rmsPrefix = /^-ms-/,
            rdashAlpha = /-([\da-z])/gi,
            // Used by jQuery.camelCase as callback to replace()
        fcamelCase = function (all, letter) {
          return (letter + "").toUpperCase();
        },
            // The ready event handler and self cleanup method
        DOMContentLoaded = function () {
          if (document.addEventListener) {
            document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
            jQuery.ready();
          } else if (document.readyState === "complete") {
            // we're here because readyState === "complete" in oldIE
            // which is good enough for us to call the dom ready!
            document.detachEvent("onreadystatechange", DOMContentLoaded);
            jQuery.ready();
          }
        },
            // [[Class]] -> type pairs
        class2type = {};

        jQuery.fn = jQuery.prototype = {
          constructor: jQuery,
          init: function (selector, context, rootjQuery) {
            var match, elem, ret, doc; // Handle $(""), $(null), $(undefined), $(false)

            if (!selector) {
              return this;
            } // Handle $(DOMElement)


            if (selector.nodeType) {
              this.context = this[0] = selector;
              this.length = 1;
              return this;
            } // Handle HTML strings


            if (typeof selector === "string") {
              if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                // Assume that strings that start and end with <> are HTML and skip the regex check
                match = [null, selector, null];
              } else {
                match = rquickExpr.exec(selector);
              } // Match html or make sure no context is specified for #id


              if (match && (match[1] || !context)) {
                // HANDLE: $(html) -> $(array)
                if (match[1]) {
                  context = context instanceof jQuery ? context[0] : context;
                  doc = context && context.nodeType ? context.ownerDocument || context : document; // scripts is true for back-compat

                  selector = jQuery.parseHTML(match[1], doc, true);

                  if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                    this.attr.call(selector, context, true);
                  }

                  return jQuery.merge(this, selector); // HANDLE: $(#id)
                } else {
                  elem = document.getElementById(match[2]); // Check parentNode to catch when Blackberry 4.6 returns
                  // nodes that are no longer in the document #6963

                  if (elem && elem.parentNode) {
                    // Handle the case where IE and Opera return items
                    // by name instead of ID
                    if (elem.id !== match[2]) {
                      return rootjQuery.find(selector);
                    } // Otherwise, we inject the element directly into the jQuery object


                    this.length = 1;
                    this[0] = elem;
                  }

                  this.context = document;
                  this.selector = selector;
                  return this;
                } // HANDLE: $(expr, $(...))

              } else if (!context || context.jquery) {
                return (context || rootjQuery).find(selector); // HANDLE: $(expr, context)
                // (which is just equivalent to: $(context).find(expr)
              } else {
                return this.constructor(context).find(selector);
              } // HANDLE: $(function)
              // Shortcut for document ready

            } else if (jQuery.isFunction(selector)) {
              return rootjQuery.ready(selector);
            }

            if (selector.selector !== undefined) {
              this.selector = selector.selector;
              this.context = selector.context;
            }

            return jQuery.makeArray(selector, this);
          },
          // Start with an empty selector
          selector: "",
          // The current version of jQuery being used
          jquery: "1.8.1",
          // The default length of a jQuery object is 0
          length: 0,
          // The number of elements contained in the matched element set
          size: function () {
            return this.length;
          },
          toArray: function () {
            return core_slice.call(this);
          },
          // Get the Nth element in the matched element set OR
          // Get the whole matched element set as a clean array
          get: function (num) {
            return num == null ? // Return a 'clean' array
            this.toArray() : // Return just the object
            num < 0 ? this[this.length + num] : this[num];
          },
          // Take an array of elements and push it onto the stack
          // (returning the new matched element set)
          pushStack: function (elems, name, selector) {
            // Build a new jQuery matched element set
            var ret = jQuery.merge(this.constructor(), elems); // Add the old object onto the stack (as a reference)

            ret.prevObject = this;
            ret.context = this.context;

            if (name === "find") {
              ret.selector = this.selector + (this.selector ? " " : "") + selector;
            } else if (name) {
              ret.selector = this.selector + "." + name + "(" + selector + ")";
            } // Return the newly-formed element set


            return ret;
          },
          // Execute a callback for every element in the matched set.
          // (You can seed the arguments with an array of args, but this is
          // only used internally.)
          each: function (callback, args) {
            return jQuery.each(this, callback, args);
          },
          ready: function (fn) {
            // Add the callback
            jQuery.ready.promise().done(fn);
            return this;
          },
          eq: function (i) {
            i = +i;
            return i === -1 ? this.slice(i) : this.slice(i, i + 1);
          },
          first: function () {
            return this.eq(0);
          },
          last: function () {
            return this.eq(-1);
          },
          slice: function () {
            return this.pushStack(core_slice.apply(this, arguments), "slice", core_slice.call(arguments).join(","));
          },
          map: function (callback) {
            return this.pushStack(jQuery.map(this, function (elem, i) {
              return callback.call(elem, i, elem);
            }));
          },
          end: function () {
            return this.prevObject || this.constructor(null);
          },
          // For internal use only.
          // Behaves like an Array's method, not like a jQuery method.
          push: core_push,
          sort: [].sort,
          splice: [].splice
        }; // Give the init function the jQuery prototype for later instantiation

        jQuery.fn.init.prototype = jQuery.fn;

        jQuery.extend = jQuery.fn.extend = function () {
          var options,
              name,
              src,
              copy,
              copyIsArray,
              clone,
              target = arguments[0] || {},
              i = 1,
              length = arguments.length,
              deep = false; // Handle a deep copy situation

          if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {}; // skip the boolean and the target

            i = 2;
          } // Handle case when target is a string or something (possible in deep copy)


          if (typeof target !== "object" && !jQuery.isFunction(target)) {
            target = {};
          } // extend jQuery itself if only one argument is passed


          if (length === i) {
            target = this;
            --i;
          }

          for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {
              // Extend the base object
              for (name in options) {
                src = target[name];
                copy = options[name]; // Prevent never-ending loop

                if (target === copy) {
                  continue;
                } // Recurse if we're merging plain objects or arrays


                if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                  if (copyIsArray) {
                    copyIsArray = false;
                    clone = src && jQuery.isArray(src) ? src : [];
                  } else {
                    clone = src && jQuery.isPlainObject(src) ? src : {};
                  } // Never move original objects, clone them


                  target[name] = jQuery.extend(deep, clone, copy); // Don't bring in undefined values
                } else if (copy !== undefined) {
                  target[name] = copy;
                }
              }
            }
          } // Return the modified object


          return target;
        };

        jQuery.extend({
          noConflict: function (deep) {
            if (window.$ === jQuery) {
              window.$ = _$;
            }

            if (deep && window.jQuery === jQuery) {
              window.jQuery = _jQuery;
            }

            return jQuery;
          },
          // Is the DOM ready to be used? Set to true once it occurs.
          isReady: false,
          // A counter to track how many items to wait for before
          // the ready event fires. See #6781
          readyWait: 1,
          // Hold (or release) the ready event
          holdReady: function (hold) {
            if (hold) {
              jQuery.readyWait++;
            } else {
              jQuery.ready(true);
            }
          },
          // Handle when the DOM is ready
          ready: function (wait) {
            // Abort if there are pending holds or we're already ready
            if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
              return;
            } // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).


            if (!document.body) {
              return setTimeout(jQuery.ready, 1);
            } // Remember that the DOM is ready


            jQuery.isReady = true; // If a normal DOM Ready event fired, decrement, and wait if need be

            if (wait !== true && --jQuery.readyWait > 0) {
              return;
            } // If there are functions bound, to execute


            readyList.resolveWith(document, [jQuery]); // Trigger any bound ready events

            if (jQuery.fn.trigger) {
              jQuery(document).trigger("ready").off("ready");
            }
          },
          // See test/unit/core.js for details concerning isFunction.
          // Since version 1.3, DOM methods and functions like alert
          // aren't supported. They return false on IE (#2968).
          isFunction: function (obj) {
            return jQuery.type(obj) === "function";
          },
          isArray: Array.isArray || function (obj) {
            return jQuery.type(obj) === "array";
          },
          isWindow: function (obj) {
            return obj != null && obj == obj.window;
          },
          isNumeric: function (obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
          },
          type: function (obj) {
            return obj == null ? String(obj) : class2type[core_toString.call(obj)] || "object";
          },
          isPlainObject: function (obj) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if (!obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)) {
              return false;
            }

            try {
              // Not own constructor property must be Object
              if (obj.constructor && !core_hasOwn.call(obj, "constructor") && !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false;
              }
            } catch (e) {
              // IE8,9 Will throw exceptions on certain host objects #9897
              return false;
            } // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.


            var key;

            for (key in obj) {}

            return key === undefined || core_hasOwn.call(obj, key);
          },
          isEmptyObject: function (obj) {
            var name;

            for (name in obj) {
              return false;
            }

            return true;
          },
          error: function (msg) {
            throw new Error(msg);
          },
          // data: string of html
          // context (optional): If specified, the fragment will be created in this context, defaults to document
          // scripts (optional): If true, will include scripts passed in the html string
          parseHTML: function (data, context, scripts) {
            var parsed;

            if (!data || typeof data !== "string") {
              return null;
            }

            if (typeof context === "boolean") {
              scripts = context;
              context = 0;
            }

            context = context || document; // Single tag

            if (parsed = rsingleTag.exec(data)) {
              return [context.createElement(parsed[1])];
            }

            parsed = jQuery.buildFragment([data], context, scripts ? null : []);
            return jQuery.merge([], (parsed.cacheable ? jQuery.clone(parsed.fragment) : parsed.fragment).childNodes);
          },
          parseJSON: function (data) {
            if (!data || typeof data !== "string") {
              return null;
            } // Make sure leading/trailing whitespace is removed (IE can't handle it)


            data = jQuery.trim(data); // Attempt to parse using the native JSON parser first

            if (window.JSON && window.JSON.parse) {
              return window.JSON.parse(data);
            } // Make sure the incoming data is actual JSON
            // Logic borrowed from http://json.org/json2.js


            if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) {
              return new Function("return " + data)();
            }

            jQuery.error("Invalid JSON: " + data);
          },
          // Cross-browser xml parsing
          parseXML: function (data) {
            var xml, tmp;

            if (!data || typeof data !== "string") {
              return null;
            }

            try {
              if (window.DOMParser) {
                // Standard
                tmp = new DOMParser();
                xml = tmp.parseFromString(data, "text/xml");
              } else {
                // IE
                xml = new ActiveXObject("Microsoft.XMLDOM");
                xml.async = "false";
                xml.loadXML(data);
              }
            } catch (e) {
              xml = undefined;
            }

            if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
              jQuery.error("Invalid XML: " + data);
            }

            return xml;
          },
          noop: function () {},
          // Evaluates a script in a global context
          // Workarounds based on findings by Jim Driscoll
          // http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
          globalEval: function (data) {
            if (data && core_rnotwhite.test(data)) {
              // We use execScript on Internet Explorer
              // We use an anonymous function so that context is window
              // rather than jQuery in Firefox
              (window.execScript || function (data) {
                window["eval"].call(window, data);
              })(data);
            }
          },
          // Convert dashed to camelCase; used by the css and data modules
          // Microsoft forgot to hump their vendor prefix (#9572)
          camelCase: function (string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
          },
          nodeName: function (elem, name) {
            return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
          },
          // args is for internal usage only
          each: function (obj, callback, args) {
            var name,
                i = 0,
                length = obj.length,
                isObj = length === undefined || jQuery.isFunction(obj);

            if (args) {
              if (isObj) {
                for (name in obj) {
                  if (callback.apply(obj[name], args) === false) {
                    break;
                  }
                }
              } else {
                for (; i < length;) {
                  if (callback.apply(obj[i++], args) === false) {
                    break;
                  }
                }
              } // A special, fast, case for the most common use of each

            } else {
              if (isObj) {
                for (name in obj) {
                  if (callback.call(obj[name], name, obj[name]) === false) {
                    break;
                  }
                }
              } else {
                for (; i < length;) {
                  if (callback.call(obj[i], i, obj[i++]) === false) {
                    break;
                  }
                }
              }
            }

            return obj;
          },
          // Use native String.trim function wherever possible
          trim: core_trim && !core_trim.call("\uFEFF\xA0") ? function (text) {
            return text == null ? "" : core_trim.call(text);
          } : // Otherwise use our own trimming functionality
          function (text) {
            return text == null ? "" : text.toString().replace(rtrim, "");
          },
          // results is for internal usage only
          makeArray: function (arr, results) {
            var type,
                ret = results || [];

            if (arr != null) {
              // The window, strings (and functions) also have 'length'
              // Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
              type = jQuery.type(arr);

              if (arr.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow(arr)) {
                core_push.call(ret, arr);
              } else {
                jQuery.merge(ret, arr);
              }
            }

            return ret;
          },
          inArray: function (elem, arr, i) {
            var len;

            if (arr) {
              if (core_indexOf) {
                return core_indexOf.call(arr, elem, i);
              }

              len = arr.length;
              i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

              for (; i < len; i++) {
                // Skip accessing in sparse arrays
                if (i in arr && arr[i] === elem) {
                  return i;
                }
              }
            }

            return -1;
          },
          merge: function (first, second) {
            var l = second.length,
                i = first.length,
                j = 0;

            if (typeof l === "number") {
              for (; j < l; j++) {
                first[i++] = second[j];
              }
            } else {
              while (second[j] !== undefined) {
                first[i++] = second[j++];
              }
            }

            first.length = i;
            return first;
          },
          grep: function (elems, callback, inv) {
            var retVal,
                ret = [],
                i = 0,
                length = elems.length;
            inv = !!inv; // Go through the array, only saving the items
            // that pass the validator function

            for (; i < length; i++) {
              retVal = !!callback(elems[i], i);

              if (inv !== retVal) {
                ret.push(elems[i]);
              }
            }

            return ret;
          },
          // arg is for internal usage only
          map: function (elems, callback, arg) {
            var value,
                key,
                ret = [],
                i = 0,
                length = elems.length,
                // jquery objects are treated as arrays
            isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && (length > 0 && elems[0] && elems[length - 1] || length === 0 || jQuery.isArray(elems)); // Go through the array, translating each of the items to their

            if (isArray) {
              for (; i < length; i++) {
                value = callback(elems[i], i, arg);

                if (value != null) {
                  ret[ret.length] = value;
                }
              } // Go through every key on the object,

            } else {
              for (key in elems) {
                value = callback(elems[key], key, arg);

                if (value != null) {
                  ret[ret.length] = value;
                }
              }
            } // Flatten any nested arrays


            return ret.concat.apply([], ret);
          },
          // A global GUID counter for objects
          guid: 1,
          // Bind a function to a context, optionally partially applying any
          // arguments.
          proxy: function (fn, context) {
            var tmp, args, proxy;

            if (typeof context === "string") {
              tmp = fn[context];
              context = fn;
              fn = tmp;
            } // Quick check to determine if target is callable, in the spec
            // this throws a TypeError, but we will just return undefined.


            if (!jQuery.isFunction(fn)) {
              return undefined;
            } // Simulated bind


            args = core_slice.call(arguments, 2);

            proxy = function () {
              return fn.apply(context, args.concat(core_slice.call(arguments)));
            }; // Set the guid of unique handler to the same of original handler, so it can be removed


            proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;
            return proxy;
          },
          // Multifunctional method to get and set values of a collection
          // The value/s can optionally be executed if it's a function
          access: function (elems, fn, key, value, chainable, emptyGet, pass) {
            var exec,
                bulk = key == null,
                i = 0,
                length = elems.length; // Sets many values

            if (key && typeof key === "object") {
              for (i in key) {
                jQuery.access(elems, fn, i, key[i], 1, emptyGet, value);
              }

              chainable = 1; // Sets one value
            } else if (value !== undefined) {
              // Optionally, function values get executed if exec is true
              exec = pass === undefined && jQuery.isFunction(value);

              if (bulk) {
                // Bulk operations only iterate when executing function values
                if (exec) {
                  exec = fn;

                  fn = function (elem, key, value) {
                    return exec.call(jQuery(elem), value);
                  }; // Otherwise they run against the entire set

                } else {
                  fn.call(elems, value);
                  fn = null;
                }
              }

              if (fn) {
                for (; i < length; i++) {
                  fn(elems[i], key, exec ? value.call(elems[i], i, fn(elems[i], key)) : value, pass);
                }
              }

              chainable = 1;
            }

            return chainable ? elems : // Gets
            bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet;
          },
          now: function () {
            return new Date().getTime();
          }
        });

        jQuery.ready.promise = function (obj) {
          if (!readyList) {
            readyList = jQuery.Deferred(); // Catch cases where $(document).ready() is called after the browser event has already occurred.
            // we once tried to use readyState "interactive" here, but it caused issues like the one
            // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15

            if (document.readyState === "complete") {
              // Handle it asynchronously to allow scripts the opportunity to delay ready
              setTimeout(jQuery.ready, 1); // Standards-based browsers support DOMContentLoaded
            } else if (document.addEventListener) {
              // Use the handy event callback
              document.addEventListener("DOMContentLoaded", DOMContentLoaded, false); // A fallback to window.onload, that will always work

              window.addEventListener("load", jQuery.ready, false); // If IE event model is used
            } else {
              // Ensure firing before onload, maybe late but safe also for iframes
              document.attachEvent("onreadystatechange", DOMContentLoaded); // A fallback to window.onload, that will always work

              window.attachEvent("onload", jQuery.ready); // If IE and not a frame
              // continually check to see if the document is ready

              var top = false;

              try {
                top = window.frameElement == null && document.documentElement;
              } catch (e) {}

              if (top && top.doScroll) {
                (function doScrollCheck() {
                  if (!jQuery.isReady) {
                    try {
                      // Use the trick by Diego Perini
                      // http://javascript.nwbox.com/IEContentLoaded/
                      top.doScroll("left");
                    } catch (e) {
                      return setTimeout(doScrollCheck, 50);
                    } // and execute any waiting functions


                    jQuery.ready();
                  }
                })();
              }
            }
          }

          return readyList.promise(obj);
        }; // Populate the class2type map


        jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function (i, name) {
          class2type["[object " + name + "]"] = name.toLowerCase();
        }); // All jQuery objects should point back to these

        rootjQuery = jQuery(document); // String to Object options format cache

        var optionsCache = {}; // Convert String-formatted options into Object-formatted ones and store in cache

        function createOptions(options) {
          var object = optionsCache[options] = {};
          jQuery.each(options.split(core_rspace), function (_, flag) {
            object[flag] = true;
          });
          return object;
        }
        /*
         * Create a callback list using the following parameters:
         *
         *	options: an optional list of space-separated options that will change how
         *			the callback list behaves or a more traditional option object
         *
         * By default a callback list will act like an event callback list and can be
         * "fired" multiple times.
         *
         * Possible options:
         *
         *	once:			will ensure the callback list can only be fired once (like a Deferred)
         *
         *	memory:			will keep track of previous values and will call any callback added
         *					after the list has been fired right away with the latest "memorized"
         *					values (like a Deferred)
         *
         *	unique:			will ensure a callback can only be added once (no duplicate in the list)
         *
         *	stopOnFalse:	interrupt callings when a callback returns false
         *
         */


        jQuery.Callbacks = function (options) {
          // Convert options from String-formatted to Object-formatted if needed
          // (we check in cache first)
          options = typeof options === "string" ? optionsCache[options] || createOptions(options) : jQuery.extend({}, options);

          var // Last fire value (for non-forgettable lists)
          memory,
              // Flag to know if list was already fired
          fired,
              // Flag to know if list is currently firing
          firing,
              // First callback to fire (used internally by add and fireWith)
          firingStart,
              // End of the loop when firing
          firingLength,
              // Index of currently firing callback (modified by remove if needed)
          firingIndex,
              // Actual callback list
          list = [],
              // Stack of fire calls for repeatable lists
          stack = !options.once && [],
              // Fire callbacks
          fire = function (data) {
            memory = options.memory && data;
            fired = true;
            firingIndex = firingStart || 0;
            firingStart = 0;
            firingLength = list.length;
            firing = true;

            for (; list && firingIndex < firingLength; firingIndex++) {
              if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                memory = false; // To prevent further calls using add

                break;
              }
            }

            firing = false;

            if (list) {
              if (stack) {
                if (stack.length) {
                  fire(stack.shift());
                }
              } else if (memory) {
                list = [];
              } else {
                self.disable();
              }
            }
          },
              // Actual Callbacks object
          self = {
            // Add a callback or a collection of callbacks to the list
            add: function () {
              if (list) {
                // First, we save the current length
                var start = list.length;

                (function add(args) {
                  jQuery.each(args, function (_, arg) {
                    var type = jQuery.type(arg);

                    if (type === "function" && (!options.unique || !self.has(arg))) {
                      list.push(arg);
                    } else if (arg && arg.length && type !== "string") {
                      // Inspect recursively
                      add(arg);
                    }
                  });
                })(arguments); // Do we need to add the callbacks to the
                // current firing batch?


                if (firing) {
                  firingLength = list.length; // With memory, if we're not firing then
                  // we should call right away
                } else if (memory) {
                  firingStart = start;
                  fire(memory);
                }
              }

              return this;
            },
            // Remove a callback from the list
            remove: function () {
              if (list) {
                jQuery.each(arguments, function (_, arg) {
                  var index;

                  while ((index = jQuery.inArray(arg, list, index)) > -1) {
                    list.splice(index, 1); // Handle firing indexes

                    if (firing) {
                      if (index <= firingLength) {
                        firingLength--;
                      }

                      if (index <= firingIndex) {
                        firingIndex--;
                      }
                    }
                  }
                });
              }

              return this;
            },
            // Control if a given callback is in the list
            has: function (fn) {
              return jQuery.inArray(fn, list) > -1;
            },
            // Remove all callbacks from the list
            empty: function () {
              list = [];
              return this;
            },
            // Have the list do nothing anymore
            disable: function () {
              list = stack = memory = undefined;
              return this;
            },
            // Is it disabled?
            disabled: function () {
              return !list;
            },
            // Lock the list in its current state
            lock: function () {
              stack = undefined;

              if (!memory) {
                self.disable();
              }

              return this;
            },
            // Is it locked?
            locked: function () {
              return !stack;
            },
            // Call all callbacks with the given context and arguments
            fireWith: function (context, args) {
              args = args || [];
              args = [context, args.slice ? args.slice() : args];

              if (list && (!fired || stack)) {
                if (firing) {
                  stack.push(args);
                } else {
                  fire(args);
                }
              }

              return this;
            },
            // Call all the callbacks with the given arguments
            fire: function () {
              self.fireWith(this, arguments);
              return this;
            },
            // To know if the callbacks have already been called at least once
            fired: function () {
              return !!fired;
            }
          };

          return self;
        };

        jQuery.extend({
          Deferred: function (func) {
            var tuples = [// action, add listener, listener list, final state
            ["resolve", "done", jQuery.Callbacks("once memory"), "resolved"], ["reject", "fail", jQuery.Callbacks("once memory"), "rejected"], ["notify", "progress", jQuery.Callbacks("memory")]],
                state = "pending",
                promise = {
              state: function () {
                return state;
              },
              always: function () {
                deferred.done(arguments).fail(arguments);
                return this;
              },
              then: function ()
              /* fnDone, fnFail, fnProgress */
              {
                var fns = arguments;
                return jQuery.Deferred(function (newDefer) {
                  jQuery.each(tuples, function (i, tuple) {
                    var action = tuple[0],
                        fn = fns[i]; // deferred[ done | fail | progress ] for forwarding actions to newDefer

                    deferred[tuple[1]](jQuery.isFunction(fn) ? function () {
                      var returned = fn.apply(this, arguments);

                      if (returned && jQuery.isFunction(returned.promise)) {
                        returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);
                      } else {
                        newDefer[action + "With"](this === deferred ? newDefer : this, [returned]);
                      }
                    } : newDefer[action]);
                  });
                  fns = null;
                }).promise();
              },
              // Get a promise for this deferred
              // If obj is provided, the promise aspect is added to the object
              promise: function (obj) {
                return typeof obj === "object" ? jQuery.extend(obj, promise) : promise;
              }
            },
                deferred = {}; // Keep pipe for back-compat

            promise.pipe = promise.then; // Add list-specific methods

            jQuery.each(tuples, function (i, tuple) {
              var list = tuple[2],
                  stateString = tuple[3]; // promise[ done | fail | progress ] = list.add

              promise[tuple[1]] = list.add; // Handle state

              if (stateString) {
                list.add(function () {
                  // state = [ resolved | rejected ]
                  state = stateString; // [ reject_list | resolve_list ].disable; progress_list.lock
                }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
              } // deferred[ resolve | reject | notify ] = list.fire


              deferred[tuple[0]] = list.fire;
              deferred[tuple[0] + "With"] = list.fireWith;
            }); // Make the deferred a promise

            promise.promise(deferred); // Call given func if any

            if (func) {
              func.call(deferred, deferred);
            } // All done!


            return deferred;
          },
          // Deferred helper
          when: function (subordinate
          /* , ..., subordinateN */
          ) {
            var i = 0,
                resolveValues = core_slice.call(arguments),
                length = resolveValues.length,
                // the count of uncompleted subordinates
            remaining = length !== 1 || subordinate && jQuery.isFunction(subordinate.promise) ? length : 0,
                // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
            deferred = remaining === 1 ? subordinate : jQuery.Deferred(),
                // Update function for both resolve and progress values
            updateFunc = function (i, contexts, values) {
              return function (value) {
                contexts[i] = this;
                values[i] = arguments.length > 1 ? core_slice.call(arguments) : value;

                if (values === progressValues) {
                  deferred.notifyWith(contexts, values);
                } else if (! --remaining) {
                  deferred.resolveWith(contexts, values);
                }
              };
            },
                progressValues,
                progressContexts,
                resolveContexts; // add listeners to Deferred subordinates; treat others as resolved


            if (length > 1) {
              progressValues = new Array(length);
              progressContexts = new Array(length);
              resolveContexts = new Array(length);

              for (; i < length; i++) {
                if (resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)) {
                  resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues));
                } else {
                  --remaining;
                }
              }
            } // if we're not waiting on anything, resolve the master


            if (!remaining) {
              deferred.resolveWith(resolveContexts, resolveValues);
            }

            return deferred.promise();
          }
        });

        jQuery.support = function () {
          var support,
              all,
              a,
              select,
              opt,
              input,
              fragment,
              eventName,
              i,
              isSupported,
              clickFn,
              div = document.createElement("div"); // Preliminary tests

          div.setAttribute("className", "t");
          div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
          all = div.getElementsByTagName("*");
          a = div.getElementsByTagName("a")[0];
          a.style.cssText = "top:1px;float:left;opacity:.5"; // Can't get basic test support

          if (!all || !all.length || !a) {
            return {};
          } // First batch of supports tests


          select = document.createElement("select");
          opt = select.appendChild(document.createElement("option"));
          input = div.getElementsByTagName("input")[0];
          support = {
            // IE strips leading whitespace when .innerHTML is used
            leadingWhitespace: div.firstChild.nodeType === 3,
            // Make sure that tbody elements aren't automatically inserted
            // IE will insert them into empty tables
            tbody: !div.getElementsByTagName("tbody").length,
            // Make sure that link elements get serialized correctly by innerHTML
            // This requires a wrapper element in IE
            htmlSerialize: !!div.getElementsByTagName("link").length,
            // Get the style information from getAttribute
            // (IE uses .cssText instead)
            style: /top/.test(a.getAttribute("style")),
            // Make sure that URLs aren't manipulated
            // (IE normalizes it by default)
            hrefNormalized: a.getAttribute("href") === "/a",
            // Make sure that element opacity exists
            // (IE uses filter instead)
            // Use a regex to work around a WebKit issue. See #5145
            opacity: /^0.5/.test(a.style.opacity),
            // Verify style float existence
            // (IE uses styleFloat instead of cssFloat)
            cssFloat: !!a.style.cssFloat,
            // Make sure that if no value is specified for a checkbox
            // that it defaults to "on".
            // (WebKit defaults to "" instead)
            checkOn: input.value === "on",
            // Make sure that a selected-by-default option has a working selected property.
            // (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
            optSelected: opt.selected,
            // Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
            getSetAttribute: div.className !== "t",
            // Tests for enctype support on a form(#6743)
            enctype: !!document.createElement("form").enctype,
            // Makes sure cloning an html5 element does not cause problems
            // Where outerHTML is undefined, this still works
            html5Clone: document.createElement("nav").cloneNode(true).outerHTML !== "<:nav></:nav>",
            // jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
            boxModel: document.compatMode === "CSS1Compat",
            // Will be defined later
            submitBubbles: true,
            changeBubbles: true,
            focusinBubbles: false,
            deleteExpando: true,
            noCloneEvent: true,
            inlineBlockNeedsLayout: false,
            shrinkWrapBlocks: false,
            reliableMarginRight: true,
            boxSizingReliable: true,
            pixelPosition: false
          }; // Make sure checked status is properly cloned

          input.checked = true;
          support.noCloneChecked = input.cloneNode(true).checked; // Make sure that the options inside disabled selects aren't marked as disabled
          // (WebKit marks them as disabled)

          select.disabled = true;
          support.optDisabled = !opt.disabled; // Test to see if it's possible to delete an expando from an element
          // Fails in Internet Explorer

          try {
            delete div.test;
          } catch (e) {
            support.deleteExpando = false;
          }

          if (!div.addEventListener && div.attachEvent && div.fireEvent) {
            div.attachEvent("onclick", clickFn = function () {
              // Cloning a node shouldn't copy over any
              // bound event handlers (IE does this)
              support.noCloneEvent = false;
            });
            div.cloneNode(true).fireEvent("onclick");
            div.detachEvent("onclick", clickFn);
          } // Check if a radio maintains its value
          // after being appended to the DOM


          input = document.createElement("input");
          input.value = "t";
          input.setAttribute("type", "radio");
          support.radioValue = input.value === "t";
          input.setAttribute("checked", "checked"); // #11217 - WebKit loses check when the name is after the checked attribute

          input.setAttribute("name", "t");
          div.appendChild(input);
          fragment = document.createDocumentFragment();
          fragment.appendChild(div.lastChild); // WebKit doesn't clone checked state correctly in fragments

          support.checkClone = fragment.cloneNode(true).cloneNode(true).lastChild.checked; // Check if a disconnected checkbox will retain its checked
          // value of true after appended to the DOM (IE6/7)

          support.appendChecked = input.checked;
          fragment.removeChild(input);
          fragment.appendChild(div); // Technique from Juriy Zaytsev
          // http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
          // We only care about the case where non-standard event systems
          // are used, namely in IE. Short-circuiting here helps us to
          // avoid an eval call (in setAttribute) which can cause CSP
          // to go haywire. See: https://developer.mozilla.org/en/Security/CSP

          if (div.attachEvent) {
            for (i in {
              submit: true,
              change: true,
              focusin: true
            }) {
              eventName = "on" + i;
              isSupported = eventName in div;

              if (!isSupported) {
                div.setAttribute(eventName, "return;");
                isSupported = typeof div[eventName] === "function";
              }

              support[i + "Bubbles"] = isSupported;
            }
          } // Run tests that need a body at doc ready


          jQuery(function () {
            var container,
                div,
                tds,
                marginDiv,
                divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;",
                body = document.getElementsByTagName("body")[0];

            if (!body) {
              // Return for frameset docs that don't have a body
              return;
            }

            container = document.createElement("div");
            container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px";
            body.insertBefore(container, body.firstChild); // Construct the test element

            div = document.createElement("div");
            container.appendChild(div); // Check if table cells still have offsetWidth/Height when they are set
            // to display:none and there are still other visible table cells in a
            // table row; if so, offsetWidth/Height are not reliable for use when
            // determining if an element has been hidden directly using
            // display:none (it is still safe to use offsets if a parent element is
            // hidden; don safety goggles and see bug #4512 for more information).
            // (only IE 8 fails this test)

            div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
            tds = div.getElementsByTagName("td");
            tds[0].style.cssText = "padding:0;margin:0;border:0;display:none";
            isSupported = tds[0].offsetHeight === 0;
            tds[0].style.display = "";
            tds[1].style.display = "none"; // Check if empty table cells still have offsetWidth/Height
            // (IE <= 8 fail this test)

            support.reliableHiddenOffsets = isSupported && tds[0].offsetHeight === 0; // Check box-sizing and margin behavior

            div.innerHTML = "";
            div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
            support.boxSizing = div.offsetWidth === 4;
            support.doesNotIncludeMarginInBodyOffset = body.offsetTop !== 1; // NOTE: To any future maintainer, we've window.getComputedStyle
            // because jsdom on node.js will break without it.

            if (window.getComputedStyle) {
              support.pixelPosition = (window.getComputedStyle(div, null) || {}).top !== "1%";
              support.boxSizingReliable = (window.getComputedStyle(div, null) || {
                width: "4px"
              }).width === "4px"; // Check if div with explicit width and no margin-right incorrectly
              // gets computed margin-right based on width of container. For more
              // info see bug #3333
              // Fails in WebKit before Feb 2011 nightlies
              // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right

              marginDiv = document.createElement("div");
              marginDiv.style.cssText = div.style.cssText = divReset;
              marginDiv.style.marginRight = marginDiv.style.width = "0";
              div.style.width = "1px";
              div.appendChild(marginDiv);
              support.reliableMarginRight = !parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight);
            }

            if (typeof div.style.zoom !== "undefined") {
              // Check if natively block-level elements act like inline-block
              // elements when setting their display to 'inline' and giving
              // them layout
              // (IE < 8 does this)
              div.innerHTML = "";
              div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
              support.inlineBlockNeedsLayout = div.offsetWidth === 3; // Check if elements with layout shrink-wrap their children
              // (IE 6 does this)

              div.style.display = "block";
              div.style.overflow = "visible";
              div.innerHTML = "<div></div>";
              div.firstChild.style.width = "5px";
              support.shrinkWrapBlocks = div.offsetWidth !== 3;
              container.style.zoom = 1;
            } // Null elements to avoid leaks in IE


            body.removeChild(container);
            container = div = tds = marginDiv = null;
          }); // Null elements to avoid leaks in IE

          fragment.removeChild(div);
          all = a = select = opt = input = fragment = div = null;
          return support;
        }();

        var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
            rmultiDash = /([A-Z])/g;
        jQuery.extend({
          cache: {},
          deletedIds: [],
          // Please use with caution
          uuid: 0,
          // Unique for each copy of jQuery on the page
          // Non-digits removed to match rinlinejQuery
          expando: "jQuery" + (jQuery.fn.jquery + Math.random()).replace(/\D/g, ""),
          // The following elements throw uncatchable exceptions if you
          // attempt to add expando properties to them.
          noData: {
            "embed": true,
            // Ban all objects except for Flash (which handle expandos)
            "object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            "applet": true
          },
          hasData: function (elem) {
            elem = elem.nodeType ? jQuery.cache[elem[jQuery.expando]] : elem[jQuery.expando];
            return !!elem && !isEmptyDataObject(elem);
          },
          data: function (elem, name, data, pvt
          /* Internal Use Only */
          ) {
            if (!jQuery.acceptData(elem)) {
              return;
            }

            var thisCache,
                ret,
                internalKey = jQuery.expando,
                getByName = typeof name === "string",
                // We have to handle DOM nodes and JS objects differently because IE6-7
            // can't GC object references properly across the DOM-JS boundary
            isNode = elem.nodeType,
                // Only DOM nodes need the global jQuery cache; JS object data is
            // attached directly to the object so GC can occur automatically
            cache = isNode ? jQuery.cache : elem,
                // Only defining an ID for JS objects if its cache already exists allows
            // the code to shortcut on the same path as a DOM node with no cache
            id = isNode ? elem[internalKey] : elem[internalKey] && internalKey; // Avoid doing any more work than we need to when trying to get data on an
            // object that has no data at all

            if ((!id || !cache[id] || !pvt && !cache[id].data) && getByName && data === undefined) {
              return;
            }

            if (!id) {
              // Only DOM nodes need a new unique ID for each element since their data
              // ends up in the global cache
              if (isNode) {
                elem[internalKey] = id = jQuery.deletedIds.pop() || ++jQuery.uuid;
              } else {
                id = internalKey;
              }
            }

            if (!cache[id]) {
              cache[id] = {}; // Avoids exposing jQuery metadata on plain JS objects when the object
              // is serialized using JSON.stringify

              if (!isNode) {
                cache[id].toJSON = jQuery.noop;
              }
            } // An object can be passed to jQuery.data instead of a key/value pair; this gets
            // shallow copied over onto the existing cache


            if (typeof name === "object" || typeof name === "function") {
              if (pvt) {
                cache[id] = jQuery.extend(cache[id], name);
              } else {
                cache[id].data = jQuery.extend(cache[id].data, name);
              }
            }

            thisCache = cache[id]; // jQuery data() is stored in a separate object inside the object's internal data
            // cache in order to avoid key collisions between internal data and user-defined
            // data.

            if (!pvt) {
              if (!thisCache.data) {
                thisCache.data = {};
              }

              thisCache = thisCache.data;
            }

            if (data !== undefined) {
              thisCache[jQuery.camelCase(name)] = data;
            } // Check for both converted-to-camel and non-converted data property names
            // If a data property was specified


            if (getByName) {
              // First Try to find as-is property data
              ret = thisCache[name]; // Test for null|undefined property data

              if (ret == null) {
                // Try to find the camelCased property
                ret = thisCache[jQuery.camelCase(name)];
              }
            } else {
              ret = thisCache;
            }

            return ret;
          },
          removeData: function (elem, name, pvt
          /* Internal Use Only */
          ) {
            if (!jQuery.acceptData(elem)) {
              return;
            }

            var thisCache,
                i,
                l,
                isNode = elem.nodeType,
                // See jQuery.data for more information
            cache = isNode ? jQuery.cache : elem,
                id = isNode ? elem[jQuery.expando] : jQuery.expando; // If there is already no cache entry for this object, there is no
            // purpose in continuing

            if (!cache[id]) {
              return;
            }

            if (name) {
              thisCache = pvt ? cache[id] : cache[id].data;

              if (thisCache) {
                // Support array or space separated string names for data keys
                if (!jQuery.isArray(name)) {
                  // try the string as a key before any manipulation
                  if (name in thisCache) {
                    name = [name];
                  } else {
                    // split the camel cased version by spaces unless a key with the spaces exists
                    name = jQuery.camelCase(name);

                    if (name in thisCache) {
                      name = [name];
                    } else {
                      name = name.split(" ");
                    }
                  }
                }

                for (i = 0, l = name.length; i < l; i++) {
                  delete thisCache[name[i]];
                } // If there is no data left in the cache, we want to continue
                // and let the cache object itself get destroyed


                if (!(pvt ? isEmptyDataObject : jQuery.isEmptyObject)(thisCache)) {
                  return;
                }
              }
            } // See jQuery.data for more information


            if (!pvt) {
              delete cache[id].data; // Don't destroy the parent cache unless the internal data object
              // had been the only thing left in it

              if (!isEmptyDataObject(cache[id])) {
                return;
              }
            } // Destroy the cache


            if (isNode) {
              jQuery.cleanData([elem], true); // Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
            } else if (jQuery.support.deleteExpando || cache != cache.window) {
              delete cache[id]; // When all else fails, null
            } else {
              cache[id] = null;
            }
          },
          // For internal use only.
          _data: function (elem, name, data) {
            return jQuery.data(elem, name, data, true);
          },
          // A method for determining if a DOM node can handle the data expando
          acceptData: function (elem) {
            var noData = elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()]; // nodes accept data unless otherwise specified; rejection can be conditional

            return !noData || noData !== true && elem.getAttribute("classid") === noData;
          }
        });
        jQuery.fn.extend({
          data: function (key, value) {
            var parts,
                part,
                attr,
                name,
                l,
                elem = this[0],
                i = 0,
                data = null; // Gets all values

            if (key === undefined) {
              if (this.length) {
                data = jQuery.data(elem);

                if (elem.nodeType === 1 && !jQuery._data(elem, "parsedAttrs")) {
                  attr = elem.attributes;

                  for (l = attr.length; i < l; i++) {
                    name = attr[i].name;

                    if (name.indexOf("data-") === 0) {
                      name = jQuery.camelCase(name.substring(5));
                      dataAttr(elem, name, data[name]);
                    }
                  }

                  jQuery._data(elem, "parsedAttrs", true);
                }
              }

              return data;
            } // Sets multiple values


            if (typeof key === "object") {
              return this.each(function () {
                jQuery.data(this, key);
              });
            }

            parts = key.split(".", 2);
            parts[1] = parts[1] ? "." + parts[1] : "";
            part = parts[1] + "!";
            return jQuery.access(this, function (value) {
              if (value === undefined) {
                data = this.triggerHandler("getData" + part, [parts[0]]); // Try to fetch any internally stored data first

                if (data === undefined && elem) {
                  data = jQuery.data(elem, key);
                  data = dataAttr(elem, key, data);
                }

                return data === undefined && parts[1] ? this.data(parts[0]) : data;
              }

              parts[1] = value;
              this.each(function () {
                var self = jQuery(this);
                self.triggerHandler("setData" + part, parts);
                jQuery.data(this, key, value);
                self.triggerHandler("changeData" + part, parts);
              });
            }, null, value, arguments.length > 1, null, false);
          },
          removeData: function (key) {
            return this.each(function () {
              jQuery.removeData(this, key);
            });
          }
        });

        function dataAttr(elem, key, data) {
          // If nothing was found internally, try to fetch any
          // data from the HTML5 data-* attribute
          if (data === undefined && elem.nodeType === 1) {
            var name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();
            data = elem.getAttribute(name);

            if (typeof data === "string") {
              try {
                data = data === "true" ? true : data === "false" ? false : data === "null" ? null : // Only convert to a number if it doesn't change the string
                +data + "" === data ? +data : rbrace.test(data) ? jQuery.parseJSON(data) : data;
              } catch (e) {} // Make sure we set the data so it isn't changed later


              jQuery.data(elem, key, data);
            } else {
              data = undefined;
            }
          }

          return data;
        } // checks a cache object for emptiness


        function isEmptyDataObject(obj) {
          var name;

          for (name in obj) {
            // if the public data object is empty, the private is still empty
            if (name === "data" && jQuery.isEmptyObject(obj[name])) {
              continue;
            }

            if (name !== "toJSON") {
              return false;
            }
          }

          return true;
        }

        jQuery.extend({
          queue: function (elem, type, data) {
            var queue;

            if (elem) {
              type = (type || "fx") + "queue";
              queue = jQuery._data(elem, type); // Speed up dequeue by getting out quickly if this is just a lookup

              if (data) {
                if (!queue || jQuery.isArray(data)) {
                  queue = jQuery._data(elem, type, jQuery.makeArray(data));
                } else {
                  queue.push(data);
                }
              }

              return queue || [];
            }
          },
          dequeue: function (elem, type) {
            type = type || "fx";

            var queue = jQuery.queue(elem, type),
                startLength = queue.length,
                fn = queue.shift(),
                hooks = jQuery._queueHooks(elem, type),
                next = function () {
              jQuery.dequeue(elem, type);
            }; // If the fx queue is dequeued, always remove the progress sentinel


            if (fn === "inprogress") {
              fn = queue.shift();
              startLength--;
            }

            if (fn) {
              // Add a progress sentinel to prevent the fx queue from being
              // automatically dequeued
              if (type === "fx") {
                queue.unshift("inprogress");
              } // clear up the last queue stop function


              delete hooks.stop;
              fn.call(elem, next, hooks);
            }

            if (!startLength && hooks) {
              hooks.empty.fire();
            }
          },
          // not intended for public consumption - generates a queueHooks object, or returns the current one
          _queueHooks: function (elem, type) {
            var key = type + "queueHooks";
            return jQuery._data(elem, key) || jQuery._data(elem, key, {
              empty: jQuery.Callbacks("once memory").add(function () {
                jQuery.removeData(elem, type + "queue", true);
                jQuery.removeData(elem, key, true);
              })
            });
          }
        });
        jQuery.fn.extend({
          queue: function (type, data) {
            var setter = 2;

            if (typeof type !== "string") {
              data = type;
              type = "fx";
              setter--;
            }

            if (arguments.length < setter) {
              return jQuery.queue(this[0], type);
            }

            return data === undefined ? this : this.each(function () {
              var queue = jQuery.queue(this, type, data); // ensure a hooks for this queue

              jQuery._queueHooks(this, type);

              if (type === "fx" && queue[0] !== "inprogress") {
                jQuery.dequeue(this, type);
              }
            });
          },
          dequeue: function (type) {
            return this.each(function () {
              jQuery.dequeue(this, type);
            });
          },
          // Based off of the plugin by Clint Helfers, with permission.
          // http://blindsignals.com/index.php/2009/07/jquery-delay/
          delay: function (time, type) {
            time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
            type = type || "fx";
            return this.queue(type, function (next, hooks) {
              var timeout = setTimeout(next, time);

              hooks.stop = function () {
                clearTimeout(timeout);
              };
            });
          },
          clearQueue: function (type) {
            return this.queue(type || "fx", []);
          },
          // Get a promise resolved when queues of a certain type
          // are emptied (fx is the type by default)
          promise: function (type, obj) {
            var tmp,
                count = 1,
                defer = jQuery.Deferred(),
                elements = this,
                i = this.length,
                resolve = function () {
              if (! --count) {
                defer.resolveWith(elements, [elements]);
              }
            };

            if (typeof type !== "string") {
              obj = type;
              type = undefined;
            }

            type = type || "fx";

            while (i--) {
              tmp = jQuery._data(elements[i], type + "queueHooks");

              if (tmp && tmp.empty) {
                count++;
                tmp.empty.add(resolve);
              }
            }

            resolve();
            return defer.promise(obj);
          }
        });
        var nodeHook,
            boolHook,
            fixSpecified,
            rclass = /[\t\r\n]/g,
            rreturn = /\r/g,
            rtype = /^(?:button|input)$/i,
            rfocusable = /^(?:button|input|object|select|textarea)$/i,
            rclickable = /^a(?:rea|)$/i,
            rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
            getSetAttribute = jQuery.support.getSetAttribute;
        jQuery.fn.extend({
          attr: function (name, value) {
            return jQuery.access(this, jQuery.attr, name, value, arguments.length > 1);
          },
          removeAttr: function (name) {
            return this.each(function () {
              jQuery.removeAttr(this, name);
            });
          },
          prop: function (name, value) {
            return jQuery.access(this, jQuery.prop, name, value, arguments.length > 1);
          },
          removeProp: function (name) {
            name = jQuery.propFix[name] || name;
            return this.each(function () {
              // try/catch handles cases where IE balks (such as removing a property on window)
              try {
                this[name] = undefined;
                delete this[name];
              } catch (e) {}
            });
          },
          addClass: function (value) {
            var classNames, i, l, elem, setClass, c, cl;

            if (jQuery.isFunction(value)) {
              return this.each(function (j) {
                jQuery(this).addClass(value.call(this, j, this.className));
              });
            }

            if (value && typeof value === "string") {
              classNames = value.split(core_rspace);

              for (i = 0, l = this.length; i < l; i++) {
                elem = this[i];

                if (elem.nodeType === 1) {
                  if (!elem.className && classNames.length === 1) {
                    elem.className = value;
                  } else {
                    setClass = " " + elem.className + " ";

                    for (c = 0, cl = classNames.length; c < cl; c++) {
                      if (!~setClass.indexOf(" " + classNames[c] + " ")) {
                        setClass += classNames[c] + " ";
                      }
                    }

                    elem.className = jQuery.trim(setClass);
                  }
                }
              }
            }

            return this;
          },
          removeClass: function (value) {
            var removes, className, elem, c, cl, i, l;

            if (jQuery.isFunction(value)) {
              return this.each(function (j) {
                jQuery(this).removeClass(value.call(this, j, this.className));
              });
            }

            if (value && typeof value === "string" || value === undefined) {
              removes = (value || "").split(core_rspace);

              for (i = 0, l = this.length; i < l; i++) {
                elem = this[i];

                if (elem.nodeType === 1 && elem.className) {
                  className = (" " + elem.className + " ").replace(rclass, " "); // loop over each item in the removal list

                  for (c = 0, cl = removes.length; c < cl; c++) {
                    // Remove until there is nothing to remove,
                    while (className.indexOf(" " + removes[c] + " ") > -1) {
                      className = className.replace(" " + removes[c] + " ", " ");
                    }
                  }

                  elem.className = value ? jQuery.trim(className) : "";
                }
              }
            }

            return this;
          },
          toggleClass: function (value, stateVal) {
            var type = typeof value,
                isBool = typeof stateVal === "boolean";

            if (jQuery.isFunction(value)) {
              return this.each(function (i) {
                jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);
              });
            }

            return this.each(function () {
              if (type === "string") {
                // toggle individual class names
                var className,
                    i = 0,
                    self = jQuery(this),
                    state = stateVal,
                    classNames = value.split(core_rspace);

                while (className = classNames[i++]) {
                  // check each className given, space separated list
                  state = isBool ? state : !self.hasClass(className);
                  self[state ? "addClass" : "removeClass"](className);
                }
              } else if (type === "undefined" || type === "boolean") {
                if (this.className) {
                  // store className if set
                  jQuery._data(this, "__className__", this.className);
                } // toggle whole className


                this.className = this.className || value === false ? "" : jQuery._data(this, "__className__") || "";
              }
            });
          },
          hasClass: function (selector) {
            var className = " " + selector + " ",
                i = 0,
                l = this.length;

            for (; i < l; i++) {
              if (this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) > -1) {
                return true;
              }
            }

            return false;
          },
          val: function (value) {
            var hooks,
                ret,
                isFunction,
                elem = this[0];

            if (!arguments.length) {
              if (elem) {
                hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];

                if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
                  return ret;
                }

                ret = elem.value;
                return typeof ret === "string" ? // handle most common string cases
                ret.replace(rreturn, "") : // handle cases where value is null/undef or number
                ret == null ? "" : ret;
              }

              return;
            }

            isFunction = jQuery.isFunction(value);
            return this.each(function (i) {
              var val,
                  self = jQuery(this);

              if (this.nodeType !== 1) {
                return;
              }

              if (isFunction) {
                val = value.call(this, i, self.val());
              } else {
                val = value;
              } // Treat null/undefined as ""; convert numbers to string


              if (val == null) {
                val = "";
              } else if (typeof val === "number") {
                val += "";
              } else if (jQuery.isArray(val)) {
                val = jQuery.map(val, function (value) {
                  return value == null ? "" : value + "";
                });
              }

              hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()]; // If set returns undefined, fall back to normal setting

              if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
                this.value = val;
              }
            });
          }
        });
        jQuery.extend({
          valHooks: {
            option: {
              get: function (elem) {
                // attributes.value is undefined in Blackberry 4.7 but
                // uses .value. See #6932
                var val = elem.attributes.value;
                return !val || val.specified ? elem.value : elem.text;
              }
            },
            select: {
              get: function (elem) {
                var value,
                    i,
                    max,
                    option,
                    index = elem.selectedIndex,
                    values = [],
                    options = elem.options,
                    one = elem.type === "select-one"; // Nothing was selected

                if (index < 0) {
                  return null;
                } // Loop through all the selected options


                i = one ? index : 0;
                max = one ? index + 1 : options.length;

                for (; i < max; i++) {
                  option = options[i]; // Don't return options that are disabled or in a disabled optgroup

                  if (option.selected && (jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))) {
                    // Get the specific value for the option
                    value = jQuery(option).val(); // We don't need an array for one selects

                    if (one) {
                      return value;
                    } // Multi-Selects return an array


                    values.push(value);
                  }
                } // Fixes Bug #2551 -- select.val() broken in IE after form.reset()


                if (one && !values.length && options.length) {
                  return jQuery(options[index]).val();
                }

                return values;
              },
              set: function (elem, value) {
                var values = jQuery.makeArray(value);
                jQuery(elem).find("option").each(function () {
                  this.selected = jQuery.inArray(jQuery(this).val(), values) >= 0;
                });

                if (!values.length) {
                  elem.selectedIndex = -1;
                }

                return values;
              }
            }
          },
          // Unused in 1.8, left in so attrFn-stabbers won't die; remove in 1.9
          attrFn: {},
          attr: function (elem, name, value, pass) {
            var ret,
                hooks,
                notxml,
                nType = elem.nodeType; // don't get/set attributes on text, comment and attribute nodes

            if (!elem || nType === 3 || nType === 8 || nType === 2) {
              return;
            }

            if (pass && jQuery.isFunction(jQuery.fn[name])) {
              return jQuery(elem)[name](value);
            } // Fallback to prop when attributes are not supported


            if (typeof elem.getAttribute === "undefined") {
              return jQuery.prop(elem, name, value);
            }

            notxml = nType !== 1 || !jQuery.isXMLDoc(elem); // All attributes are lowercase
            // Grab necessary hook if one is defined

            if (notxml) {
              name = name.toLowerCase();
              hooks = jQuery.attrHooks[name] || (rboolean.test(name) ? boolHook : nodeHook);
            }

            if (value !== undefined) {
              if (value === null) {
                jQuery.removeAttr(elem, name);
                return;
              } else if (hooks && "set" in hooks && notxml && (ret = hooks.set(elem, value, name)) !== undefined) {
                return ret;
              } else {
                elem.setAttribute(name, "" + value);
                return value;
              }
            } else if (hooks && "get" in hooks && notxml && (ret = hooks.get(elem, name)) !== null) {
              return ret;
            } else {
              ret = elem.getAttribute(name); // Non-existent attributes return null, we normalize to undefined

              return ret === null ? undefined : ret;
            }
          },
          removeAttr: function (elem, value) {
            var propName,
                attrNames,
                name,
                isBool,
                i = 0;

            if (value && elem.nodeType === 1) {
              attrNames = value.split(core_rspace);

              for (; i < attrNames.length; i++) {
                name = attrNames[i];

                if (name) {
                  propName = jQuery.propFix[name] || name;
                  isBool = rboolean.test(name); // See #9699 for explanation of this approach (setting first, then removal)
                  // Do not do this for boolean attributes (see #10870)

                  if (!isBool) {
                    jQuery.attr(elem, name, "");
                  }

                  elem.removeAttribute(getSetAttribute ? name : propName); // Set corresponding property to false for boolean attributes

                  if (isBool && propName in elem) {
                    elem[propName] = false;
                  }
                }
              }
            }
          },
          attrHooks: {
            type: {
              set: function (elem, value) {
                // We can't allow the type property to be changed (since it causes problems in IE)
                if (rtype.test(elem.nodeName) && elem.parentNode) {
                  jQuery.error("type property can't be changed");
                } else if (!jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input")) {
                  // Setting the type on a radio button after the value resets the value in IE6-9
                  // Reset value to it's default in case type is set after value
                  // This is for element creation
                  var val = elem.value;
                  elem.setAttribute("type", value);

                  if (val) {
                    elem.value = val;
                  }

                  return value;
                }
              }
            },
            // Use the value property for back compat
            // Use the nodeHook for button elements in IE6/7 (#1954)
            value: {
              get: function (elem, name) {
                if (nodeHook && jQuery.nodeName(elem, "button")) {
                  return nodeHook.get(elem, name);
                }

                return name in elem ? elem.value : null;
              },
              set: function (elem, value, name) {
                if (nodeHook && jQuery.nodeName(elem, "button")) {
                  return nodeHook.set(elem, value, name);
                } // Does not return so that setAttribute is also used


                elem.value = value;
              }
            }
          },
          propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
          },
          prop: function (elem, name, value) {
            var ret,
                hooks,
                notxml,
                nType = elem.nodeType; // don't get/set properties on text, comment and attribute nodes

            if (!elem || nType === 3 || nType === 8 || nType === 2) {
              return;
            }

            notxml = nType !== 1 || !jQuery.isXMLDoc(elem);

            if (notxml) {
              // Fix name and attach hooks
              name = jQuery.propFix[name] || name;
              hooks = jQuery.propHooks[name];
            }

            if (value !== undefined) {
              if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
                return ret;
              } else {
                return elem[name] = value;
              }
            } else {
              if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
                return ret;
              } else {
                return elem[name];
              }
            }
          },
          propHooks: {
            tabIndex: {
              get: function (elem) {
                // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                var attributeNode = elem.getAttributeNode("tabindex");
                return attributeNode && attributeNode.specified ? parseInt(attributeNode.value, 10) : rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href ? 0 : undefined;
              }
            }
          }
        }); // Hook for boolean attributes

        boolHook = {
          get: function (elem, name) {
            // Align boolean attributes with corresponding properties
            // Fall back to attribute presence where some booleans are not supported
            var attrNode,
                property = jQuery.prop(elem, name);
            return property === true || typeof property !== "boolean" && (attrNode = elem.getAttributeNode(name)) && attrNode.nodeValue !== false ? name.toLowerCase() : undefined;
          },
          set: function (elem, value, name) {
            var propName;

            if (value === false) {
              // Remove boolean attributes when set to false
              jQuery.removeAttr(elem, name);
            } else {
              // value is true since we know at this point it's type boolean and not false
              // Set boolean attributes to the same name and set the DOM property
              propName = jQuery.propFix[name] || name;

              if (propName in elem) {
                // Only set the IDL specifically if it already exists on the element
                elem[propName] = true;
              }

              elem.setAttribute(name, name.toLowerCase());
            }

            return name;
          }
        }; // IE6/7 do not support getting/setting some attributes with get/setAttribute

        if (!getSetAttribute) {
          fixSpecified = {
            name: true,
            id: true,
            coords: true
          }; // Use this for any attribute in IE6/7
          // This fixes almost every IE6/7 issue

          nodeHook = jQuery.valHooks.button = {
            get: function (elem, name) {
              var ret;
              ret = elem.getAttributeNode(name);
              return ret && (fixSpecified[name] ? ret.value !== "" : ret.specified) ? ret.value : undefined;
            },
            set: function (elem, value, name) {
              // Set the existing or create a new attribute node
              var ret = elem.getAttributeNode(name);

              if (!ret) {
                ret = document.createAttribute(name);
                elem.setAttributeNode(ret);
              }

              return ret.value = value + "";
            }
          }; // Set width and height to auto instead of 0 on empty string( Bug #8150 )
          // This is for removals

          jQuery.each(["width", "height"], function (i, name) {
            jQuery.attrHooks[name] = jQuery.extend(jQuery.attrHooks[name], {
              set: function (elem, value) {
                if (value === "") {
                  elem.setAttribute(name, "auto");
                  return value;
                }
              }
            });
          }); // Set contenteditable to false on removals(#10429)
          // Setting to empty string throws an error as an invalid value

          jQuery.attrHooks.contenteditable = {
            get: nodeHook.get,
            set: function (elem, value, name) {
              if (value === "") {
                value = "false";
              }

              nodeHook.set(elem, value, name);
            }
          };
        } // Some attributes require a special call on IE


        if (!jQuery.support.hrefNormalized) {
          jQuery.each(["href", "src", "width", "height"], function (i, name) {
            jQuery.attrHooks[name] = jQuery.extend(jQuery.attrHooks[name], {
              get: function (elem) {
                var ret = elem.getAttribute(name, 2);
                return ret === null ? undefined : ret;
              }
            });
          });
        }

        if (!jQuery.support.style) {
          jQuery.attrHooks.style = {
            get: function (elem) {
              // Return undefined in the case of empty string
              // Normalize to lowercase since IE uppercases css property names
              return elem.style.cssText.toLowerCase() || undefined;
            },
            set: function (elem, value) {
              return elem.style.cssText = "" + value;
            }
          };
        } // Safari mis-reports the default selected property of an option
        // Accessing the parent's selectedIndex property fixes it


        if (!jQuery.support.optSelected) {
          jQuery.propHooks.selected = jQuery.extend(jQuery.propHooks.selected, {
            get: function (elem) {
              var parent = elem.parentNode;

              if (parent) {
                parent.selectedIndex; // Make sure that it also works with optgroups, see #5701

                if (parent.parentNode) {
                  parent.parentNode.selectedIndex;
                }
              }

              return null;
            }
          });
        } // IE6/7 call enctype encoding


        if (!jQuery.support.enctype) {
          jQuery.propFix.enctype = "encoding";
        } // Radios and checkboxes getter/setter


        if (!jQuery.support.checkOn) {
          jQuery.each(["radio", "checkbox"], function () {
            jQuery.valHooks[this] = {
              get: function (elem) {
                // Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
                return elem.getAttribute("value") === null ? "on" : elem.value;
              }
            };
          });
        }

        jQuery.each(["radio", "checkbox"], function () {
          jQuery.valHooks[this] = jQuery.extend(jQuery.valHooks[this], {
            set: function (elem, value) {
              if (jQuery.isArray(value)) {
                return elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0;
              }
            }
          });
        });

        var rformElems = /^(?:textarea|input|select)$/i,
            rtypenamespace = /^([^\.]*|)(?:\.(.+)|)$/,
            rhoverHack = /(?:^|\s)hover(\.\S+|)\b/,
            rkeyEvent = /^key/,
            rmouseEvent = /^(?:mouse|contextmenu)|click/,
            rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
            hoverHack = function (events) {
          return jQuery.event.special.hover ? events : events.replace(rhoverHack, "mouseenter$1 mouseleave$1");
        };
        /*
         * Helper functions for managing events -- not part of the public interface.
         * Props to Dean Edwards' addEvent library for many of the ideas.
         */


        jQuery.event = {
          add: function (elem, types, handler, data, selector) {
            var elemData, eventHandle, events, t, tns, type, namespaces, handleObj, handleObjIn, handlers, special; // Don't attach events to noData or text/comment nodes (allow plain objects tho)

            if (elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data(elem))) {
              return;
            } // Caller can pass in an object of custom data in lieu of the handler


            if (handler.handler) {
              handleObjIn = handler;
              handler = handleObjIn.handler;
              selector = handleObjIn.selector;
            } // Make sure that the handler has a unique ID, used to find/remove it later


            if (!handler.guid) {
              handler.guid = jQuery.guid++;
            } // Init the element's event structure and main handler, if this is the first


            events = elemData.events;

            if (!events) {
              elemData.events = events = {};
            }

            eventHandle = elemData.handle;

            if (!eventHandle) {
              elemData.handle = eventHandle = function (e) {
                // Discard the second event of a jQuery.event.trigger() and
                // when an event is called after a page has unloaded
                return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ? jQuery.event.dispatch.apply(eventHandle.elem, arguments) : undefined;
              }; // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events


              eventHandle.elem = elem;
            } // Handle multiple events separated by a space
            // jQuery(...).bind("mouseover mouseout", fn);


            types = jQuery.trim(hoverHack(types)).split(" ");

            for (t = 0; t < types.length; t++) {
              tns = rtypenamespace.exec(types[t]) || [];
              type = tns[1];
              namespaces = (tns[2] || "").split(".").sort(); // If event changes its type, use the special event handlers for the changed type

              special = jQuery.event.special[type] || {}; // If selector defined, determine special event api type, otherwise given type

              type = (selector ? special.delegateType : special.bindType) || type; // Update special based on newly reset type

              special = jQuery.event.special[type] || {}; // handleObj is passed to all event handlers

              handleObj = jQuery.extend({
                type: type,
                origType: tns[1],
                data: data,
                handler: handler,
                guid: handler.guid,
                selector: selector,
                namespace: namespaces.join(".")
              }, handleObjIn); // Init the event handler queue if we're the first

              handlers = events[type];

              if (!handlers) {
                handlers = events[type] = [];
                handlers.delegateCount = 0; // Only use addEventListener/attachEvent if the special events handler returns false

                if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                  // Bind the global event handler to the element
                  if (elem.addEventListener) {
                    elem.addEventListener(type, eventHandle, false);
                  } else if (elem.attachEvent) {
                    elem.attachEvent("on" + type, eventHandle);
                  }
                }
              }

              if (special.add) {
                special.add.call(elem, handleObj);

                if (!handleObj.handler.guid) {
                  handleObj.handler.guid = handler.guid;
                }
              } // Add to the element's handler list, delegates in front


              if (selector) {
                handlers.splice(handlers.delegateCount++, 0, handleObj);
              } else {
                handlers.push(handleObj);
              } // Keep track of which events have ever been used, for event optimization


              jQuery.event.global[type] = true;
            } // Nullify elem to prevent memory leaks in IE


            elem = null;
          },
          global: {},
          // Detach an event or set of events from an element
          remove: function (elem, types, handler, selector, mappedTypes) {
            var t,
                tns,
                type,
                origType,
                namespaces,
                origCount,
                j,
                events,
                special,
                eventType,
                handleObj,
                elemData = jQuery.hasData(elem) && jQuery._data(elem);

            if (!elemData || !(events = elemData.events)) {
              return;
            } // Once for each type.namespace in types; type may be omitted


            types = jQuery.trim(hoverHack(types || "")).split(" ");

            for (t = 0; t < types.length; t++) {
              tns = rtypenamespace.exec(types[t]) || [];
              type = origType = tns[1];
              namespaces = tns[2]; // Unbind all events (on this namespace, if provided) for the element

              if (!type) {
                for (type in events) {
                  jQuery.event.remove(elem, type + types[t], handler, selector, true);
                }

                continue;
              }

              special = jQuery.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              eventType = events[type] || [];
              origCount = eventType.length;
              namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null; // Remove matching events

              for (j = 0; j < eventType.length; j++) {
                handleObj = eventType[j];

                if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!namespaces || namespaces.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                  eventType.splice(j--, 1);

                  if (handleObj.selector) {
                    eventType.delegateCount--;
                  }

                  if (special.remove) {
                    special.remove.call(elem, handleObj);
                  }
                }
              } // Remove generic event handler if we removed something and no more handlers exist
              // (avoids potential for endless recursion during removal of special event handlers)


              if (eventType.length === 0 && origCount !== eventType.length) {
                if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                  jQuery.removeEvent(elem, type, elemData.handle);
                }

                delete events[type];
              }
            } // Remove the expando if it's no longer used


            if (jQuery.isEmptyObject(events)) {
              delete elemData.handle; // removeData also checks for emptiness and clears the expando if empty
              // so use it instead of delete

              jQuery.removeData(elem, "events", true);
            }
          },
          // Events that are safe to short-circuit if no handlers are attached.
          // Native DOM events should not be added, they may have inline handlers.
          customEvent: {
            "getData": true,
            "setData": true,
            "changeData": true
          },
          trigger: function (event, data, elem, onlyHandlers) {
            // Don't do events on text and comment nodes
            if (elem && (elem.nodeType === 3 || elem.nodeType === 8)) {
              return;
            } // Event object or event type


            var cache,
                exclusive,
                i,
                cur,
                old,
                ontype,
                special,
                handle,
                eventPath,
                bubbleType,
                type = event.type || event,
                namespaces = []; // focus/blur morphs to focusin/out; ensure we're not firing them right now

            if (rfocusMorph.test(type + jQuery.event.triggered)) {
              return;
            }

            if (type.indexOf("!") >= 0) {
              // Exclusive events trigger only for the exact event (no namespaces)
              type = type.slice(0, -1);
              exclusive = true;
            }

            if (type.indexOf(".") >= 0) {
              // Namespaced trigger; create a regexp to match event type in handle()
              namespaces = type.split(".");
              type = namespaces.shift();
              namespaces.sort();
            }

            if ((!elem || jQuery.event.customEvent[type]) && !jQuery.event.global[type]) {
              // No jQuery handlers for this event type, and it can't have inline handlers
              return;
            } // Caller can pass in an Event, Object, or just an event type string


            event = typeof event === "object" ? // jQuery.Event object
            event[jQuery.expando] ? event : // Object literal
            new jQuery.Event(type, event) : // Just the event type (string)
            new jQuery.Event(type);
            event.type = type;
            event.isTrigger = true;
            event.exclusive = exclusive;
            event.namespace = namespaces.join(".");
            event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            ontype = type.indexOf(":") < 0 ? "on" + type : ""; // Handle a global trigger

            if (!elem) {
              // TODO: Stop taunting the data cache; remove global events and always attach to document
              cache = jQuery.cache;

              for (i in cache) {
                if (cache[i].events && cache[i].events[type]) {
                  jQuery.event.trigger(event, data, cache[i].handle.elem, true);
                }
              }

              return;
            } // Clean up the event in case it is being reused


            event.result = undefined;

            if (!event.target) {
              event.target = elem;
            } // Clone any incoming data and prepend the event, creating the handler arg list


            data = data != null ? jQuery.makeArray(data) : [];
            data.unshift(event); // Allow special events to draw outside the lines

            special = jQuery.event.special[type] || {};

            if (special.trigger && special.trigger.apply(elem, data) === false) {
              return;
            } // Determine event propagation path in advance, per W3C events spec (#9951)
            // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)


            eventPath = [[elem, special.bindType || type]];

            if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
              bubbleType = special.delegateType || type;
              cur = rfocusMorph.test(bubbleType + type) ? elem : elem.parentNode;

              for (old = elem; cur; cur = cur.parentNode) {
                eventPath.push([cur, bubbleType]);
                old = cur;
              } // Only add window if we got to document (e.g., not plain obj or detached DOM)


              if (old === (elem.ownerDocument || document)) {
                eventPath.push([old.defaultView || old.parentWindow || window, bubbleType]);
              }
            } // Fire handlers on the event path


            for (i = 0; i < eventPath.length && !event.isPropagationStopped(); i++) {
              cur = eventPath[i][0];
              event.type = eventPath[i][1];
              handle = (jQuery._data(cur, "events") || {})[event.type] && jQuery._data(cur, "handle");

              if (handle) {
                handle.apply(cur, data);
              } // Note that this is a bare JS function and not a jQuery handler


              handle = ontype && cur[ontype];

              if (handle && jQuery.acceptData(cur) && handle.apply(cur, data) === false) {
                event.preventDefault();
              }
            }

            event.type = type; // If nobody prevented the default action, do it now

            if (!onlyHandlers && !event.isDefaultPrevented()) {
              if ((!special._default || special._default.apply(elem.ownerDocument, data) === false) && !(type === "click" && jQuery.nodeName(elem, "a")) && jQuery.acceptData(elem)) {
                // Call a native DOM method on the target with the same name name as the event.
                // Can't use an .isFunction() check here because IE6/7 fails that test.
                // Don't do default actions on window, that's where global variables be (#6170)
                // IE<9 dies on focus/blur to hidden element (#1486)
                if (ontype && elem[type] && (type !== "focus" && type !== "blur" || event.target.offsetWidth !== 0) && !jQuery.isWindow(elem)) {
                  // Don't re-trigger an onFOO event when we call its FOO() method
                  old = elem[ontype];

                  if (old) {
                    elem[ontype] = null;
                  } // Prevent re-triggering of the same event, since we already bubbled it above


                  jQuery.event.triggered = type;
                  elem[type]();
                  jQuery.event.triggered = undefined;

                  if (old) {
                    elem[ontype] = old;
                  }
                }
              }
            }

            return event.result;
          },
          dispatch: function (event) {
            // Make a writable jQuery.Event from the native event object
            event = jQuery.event.fix(event || window.event);
            var i,
                j,
                cur,
                ret,
                selMatch,
                matched,
                matches,
                handleObj,
                sel,
                related,
                handlers = (jQuery._data(this, "events") || {})[event.type] || [],
                delegateCount = handlers.delegateCount,
                args = [].slice.call(arguments),
                run_all = !event.exclusive && !event.namespace,
                special = jQuery.event.special[event.type] || {},
                handlerQueue = []; // Use the fix-ed jQuery.Event rather than the (read-only) native event

            args[0] = event;
            event.delegateTarget = this; // Call the preDispatch hook for the mapped type, and let it bail if desired

            if (special.preDispatch && special.preDispatch.call(this, event) === false) {
              return;
            } // Determine handlers that should run if there are delegated events
            // Avoid non-left-click bubbling in Firefox (#3861)


            if (delegateCount && !(event.button && event.type === "click")) {
              for (cur = event.target; cur != this; cur = cur.parentNode || this) {
                // Don't process clicks (ONLY) on disabled elements (#6911, #8165, #11382, #11764)
                if (cur.disabled !== true || event.type !== "click") {
                  selMatch = {};
                  matches = [];

                  for (i = 0; i < delegateCount; i++) {
                    handleObj = handlers[i];
                    sel = handleObj.selector;

                    if (selMatch[sel] === undefined) {
                      selMatch[sel] = jQuery(sel, this).index(cur) >= 0;
                    }

                    if (selMatch[sel]) {
                      matches.push(handleObj);
                    }
                  }

                  if (matches.length) {
                    handlerQueue.push({
                      elem: cur,
                      matches: matches
                    });
                  }
                }
              }
            } // Add the remaining (directly-bound) handlers


            if (handlers.length > delegateCount) {
              handlerQueue.push({
                elem: this,
                matches: handlers.slice(delegateCount)
              });
            } // Run delegates first; they may want to stop propagation beneath us


            for (i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++) {
              matched = handlerQueue[i];
              event.currentTarget = matched.elem;

              for (j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++) {
                handleObj = matched.matches[j]; // Triggered event must either 1) be non-exclusive and have no namespace, or
                // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).

                if (run_all || !event.namespace && !handleObj.namespace || event.namespace_re && event.namespace_re.test(handleObj.namespace)) {
                  event.data = handleObj.data;
                  event.handleObj = handleObj;
                  ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);

                  if (ret !== undefined) {
                    event.result = ret;

                    if (ret === false) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }
                }
              }
            } // Call the postDispatch hook for the mapped type


            if (special.postDispatch) {
              special.postDispatch.call(this, event);
            }

            return event.result;
          },
          // Includes some event props shared by KeyEvent and MouseEvent
          // *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
          props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
          fixHooks: {},
          keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function (event, original) {
              // Add which for key events
              if (event.which == null) {
                event.which = original.charCode != null ? original.charCode : original.keyCode;
              }

              return event;
            }
          },
          mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function (event, original) {
              var eventDoc,
                  doc,
                  body,
                  button = original.button,
                  fromElement = original.fromElement; // Calculate pageX/Y if missing and clientX/Y available

              if (event.pageX == null && original.clientX != null) {
                eventDoc = event.target.ownerDocument || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;
                event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
              } // Add relatedTarget, if necessary


              if (!event.relatedTarget && fromElement) {
                event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
              } // Add which for click: 1 === left; 2 === middle; 3 === right
              // Note: button is not normalized, so don't use it


              if (!event.which && button !== undefined) {
                event.which = button & 1 ? 1 : button & 2 ? 3 : button & 4 ? 2 : 0;
              }

              return event;
            }
          },
          fix: function (event) {
            if (event[jQuery.expando]) {
              return event;
            } // Create a writable copy of the event object and normalize some properties


            var i,
                prop,
                originalEvent = event,
                fixHook = jQuery.event.fixHooks[event.type] || {},
                copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;
            event = jQuery.Event(originalEvent);

            for (i = copy.length; i;) {
              prop = copy[--i];
              event[prop] = originalEvent[prop];
            } // Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)


            if (!event.target) {
              event.target = originalEvent.srcElement || document;
            } // Target should not be a text node (#504, Safari)


            if (event.target.nodeType === 3) {
              event.target = event.target.parentNode;
            } // For mouse/key events, metaKey==false if it's undefined (#3368, #11328; IE6/7/8)


            event.metaKey = !!event.metaKey;
            return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
          },
          special: {
            load: {
              // Prevent triggered image.load events from bubbling to window.load
              noBubble: true
            },
            focus: {
              delegateType: "focusin"
            },
            blur: {
              delegateType: "focusout"
            },
            beforeunload: {
              setup: function (data, namespaces, eventHandle) {
                // We only want to do this special case on windows
                if (jQuery.isWindow(this)) {
                  this.onbeforeunload = eventHandle;
                }
              },
              teardown: function (namespaces, eventHandle) {
                if (this.onbeforeunload === eventHandle) {
                  this.onbeforeunload = null;
                }
              }
            }
          },
          simulate: function (type, elem, event, bubble) {
            // Piggyback on a donor event to simulate a different one.
            // Fake originalEvent to avoid donor's stopPropagation, but if the
            // simulated event prevents default then we do the same on the donor.
            var e = jQuery.extend(new jQuery.Event(), event, {
              type: type,
              isSimulated: true,
              originalEvent: {}
            });

            if (bubble) {
              jQuery.event.trigger(e, null, elem);
            } else {
              jQuery.event.dispatch.call(elem, e);
            }

            if (e.isDefaultPrevented()) {
              event.preventDefault();
            }
          }
        }; // Some plugins are using, but it's undocumented/deprecated and will be removed.
        // The 1.7 special event interface should provide all the hooks needed now.

        jQuery.event.handle = jQuery.event.dispatch;
        jQuery.removeEvent = document.removeEventListener ? function (elem, type, handle) {
          if (elem.removeEventListener) {
            elem.removeEventListener(type, handle, false);
          }
        } : function (elem, type, handle) {
          var name = "on" + type;

          if (elem.detachEvent) {
            // #8545, #7054, preventing memory leaks for custom events in IE6-8 –
            // detachEvent needed property on element, by name of that event, to properly expose it to GC
            if (typeof elem[name] === "undefined") {
              elem[name] = null;
            }

            elem.detachEvent(name, handle);
          }
        };

        jQuery.Event = function (src, props) {
          // Allow instantiation without the 'new' keyword
          if (!(this instanceof jQuery.Event)) {
            return new jQuery.Event(src, props);
          } // Event object


          if (src && src.type) {
            this.originalEvent = src;
            this.type = src.type; // Events bubbling up the document may have been marked as prevented
            // by a handler lower down the tree; reflect the correct value.

            this.isDefaultPrevented = src.defaultPrevented || src.returnValue === false || src.getPreventDefault && src.getPreventDefault() ? returnTrue : returnFalse; // Event type
          } else {
            this.type = src;
          } // Put explicitly provided properties onto the event object


          if (props) {
            jQuery.extend(this, props);
          } // Create a timestamp if incoming event doesn't have one


          this.timeStamp = src && src.timeStamp || jQuery.now(); // Mark it as fixed

          this[jQuery.expando] = true;
        };

        function returnFalse() {
          return false;
        }

        function returnTrue() {
          return true;
        } // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
        // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html


        jQuery.Event.prototype = {
          preventDefault: function () {
            this.isDefaultPrevented = returnTrue;
            var e = this.originalEvent;

            if (!e) {
              return;
            } // if preventDefault exists run it on the original event


            if (e.preventDefault) {
              e.preventDefault(); // otherwise set the returnValue property of the original event to false (IE)
            } else {
              e.returnValue = false;
            }
          },
          stopPropagation: function () {
            this.isPropagationStopped = returnTrue;
            var e = this.originalEvent;

            if (!e) {
              return;
            } // if stopPropagation exists run it on the original event


            if (e.stopPropagation) {
              e.stopPropagation();
            } // otherwise set the cancelBubble property of the original event to true (IE)


            e.cancelBubble = true;
          },
          stopImmediatePropagation: function () {
            this.isImmediatePropagationStopped = returnTrue;
            this.stopPropagation();
          },
          isDefaultPrevented: returnFalse,
          isPropagationStopped: returnFalse,
          isImmediatePropagationStopped: returnFalse
        }; // Create mouseenter/leave events using mouseover/out and event-time checks

        jQuery.each({
          mouseenter: "mouseover",
          mouseleave: "mouseout"
        }, function (orig, fix) {
          jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function (event) {
              var ret,
                  target = this,
                  related = event.relatedTarget,
                  handleObj = event.handleObj,
                  selector = handleObj.selector; // For mousenter/leave call the handler if related is outside the target.
              // NB: No relatedTarget if the mouse left/entered the browser window

              if (!related || related !== target && !jQuery.contains(target, related)) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(this, arguments);
                event.type = fix;
              }

              return ret;
            }
          };
        }); // IE submit delegation

        if (!jQuery.support.submitBubbles) {
          jQuery.event.special.submit = {
            setup: function () {
              // Only need this for delegated form submit events
              if (jQuery.nodeName(this, "form")) {
                return false;
              } // Lazy-add a submit handler when a descendant form may potentially be submitted


              jQuery.event.add(this, "click._submit keypress._submit", function (e) {
                // Node name check avoids a VML-related crash in IE (#9807)
                var elem = e.target,
                    form = jQuery.nodeName(elem, "input") || jQuery.nodeName(elem, "button") ? elem.form : undefined;

                if (form && !jQuery._data(form, "_submit_attached")) {
                  jQuery.event.add(form, "submit._submit", function (event) {
                    event._submit_bubble = true;
                  });

                  jQuery._data(form, "_submit_attached", true);
                }
              }); // return undefined since we don't need an event listener
            },
            postDispatch: function (event) {
              // If form was submitted by the user, bubble the event up the tree
              if (event._submit_bubble) {
                delete event._submit_bubble;

                if (this.parentNode && !event.isTrigger) {
                  jQuery.event.simulate("submit", this.parentNode, event, true);
                }
              }
            },
            teardown: function () {
              // Only need this for delegated form submit events
              if (jQuery.nodeName(this, "form")) {
                return false;
              } // Remove delegated handlers; cleanData eventually reaps submit handlers attached above


              jQuery.event.remove(this, "._submit");
            }
          };
        } // IE change delegation and checkbox/radio fix


        if (!jQuery.support.changeBubbles) {
          jQuery.event.special.change = {
            setup: function () {
              if (rformElems.test(this.nodeName)) {
                // IE doesn't fire change on a check/radio until blur; trigger it on click
                // after a propertychange. Eat the blur-change in special.change.handle.
                // This still fires onchange a second time for check/radio after blur.
                if (this.type === "checkbox" || this.type === "radio") {
                  jQuery.event.add(this, "propertychange._change", function (event) {
                    if (event.originalEvent.propertyName === "checked") {
                      this._just_changed = true;
                    }
                  });
                  jQuery.event.add(this, "click._change", function (event) {
                    if (this._just_changed && !event.isTrigger) {
                      this._just_changed = false;
                    } // Allow triggered, simulated change events (#11500)


                    jQuery.event.simulate("change", this, event, true);
                  });
                }

                return false;
              } // Delegated event; lazy-add a change handler on descendant inputs


              jQuery.event.add(this, "beforeactivate._change", function (e) {
                var elem = e.target;

                if (rformElems.test(elem.nodeName) && !jQuery._data(elem, "_change_attached")) {
                  jQuery.event.add(elem, "change._change", function (event) {
                    if (this.parentNode && !event.isSimulated && !event.isTrigger) {
                      jQuery.event.simulate("change", this.parentNode, event, true);
                    }
                  });

                  jQuery._data(elem, "_change_attached", true);
                }
              });
            },
            handle: function (event) {
              var elem = event.target; // Swallow native change events from checkbox/radio, we already triggered them above

              if (this !== elem || event.isSimulated || event.isTrigger || elem.type !== "radio" && elem.type !== "checkbox") {
                return event.handleObj.handler.apply(this, arguments);
              }
            },
            teardown: function () {
              jQuery.event.remove(this, "._change");
              return !rformElems.test(this.nodeName);
            }
          };
        } // Create "bubbling" focus and blur events


        if (!jQuery.support.focusinBubbles) {
          jQuery.each({
            focus: "focusin",
            blur: "focusout"
          }, function (orig, fix) {
            // Attach a single capturing handler while someone wants focusin/focusout
            var attaches = 0,
                handler = function (event) {
              jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), true);
            };

            jQuery.event.special[fix] = {
              setup: function () {
                if (attaches++ === 0) {
                  document.addEventListener(orig, handler, true);
                }
              },
              teardown: function () {
                if (--attaches === 0) {
                  document.removeEventListener(orig, handler, true);
                }
              }
            };
          });
        }

        jQuery.fn.extend({
          on: function (types, selector, data, fn,
          /*INTERNAL*/
          one) {
            var origFn, type; // Types can be a map of types/handlers

            if (typeof types === "object") {
              // ( types-Object, selector, data )
              if (typeof selector !== "string") {
                // && selector != null
                // ( types-Object, data )
                data = data || selector;
                selector = undefined;
              }

              for (type in types) {
                this.on(type, selector, data, types[type], one);
              }

              return this;
            }

            if (data == null && fn == null) {
              // ( types, fn )
              fn = selector;
              data = selector = undefined;
            } else if (fn == null) {
              if (typeof selector === "string") {
                // ( types, selector, fn )
                fn = data;
                data = undefined;
              } else {
                // ( types, data, fn )
                fn = data;
                data = selector;
                selector = undefined;
              }
            }

            if (fn === false) {
              fn = returnFalse;
            } else if (!fn) {
              return this;
            }

            if (one === 1) {
              origFn = fn;

              fn = function (event) {
                // Can use an empty set, since event contains the info
                jQuery().off(event);
                return origFn.apply(this, arguments);
              }; // Use same guid so caller can remove using origFn


              fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
            }

            return this.each(function () {
              jQuery.event.add(this, types, fn, data, selector);
            });
          },
          one: function (types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1);
          },
          off: function (types, selector, fn) {
            var handleObj, type;

            if (types && types.preventDefault && types.handleObj) {
              // ( event )  dispatched jQuery.Event
              handleObj = types.handleObj;
              jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
              return this;
            }

            if (typeof types === "object") {
              // ( types-object [, selector] )
              for (type in types) {
                this.off(type, selector, types[type]);
              }

              return this;
            }

            if (selector === false || typeof selector === "function") {
              // ( types [, fn] )
              fn = selector;
              selector = undefined;
            }

            if (fn === false) {
              fn = returnFalse;
            }

            return this.each(function () {
              jQuery.event.remove(this, types, fn, selector);
            });
          },
          bind: function (types, data, fn) {
            return this.on(types, null, data, fn);
          },
          unbind: function (types, fn) {
            return this.off(types, null, fn);
          },
          live: function (types, data, fn) {
            jQuery(this.context).on(types, this.selector, data, fn);
            return this;
          },
          die: function (types, fn) {
            jQuery(this.context).off(types, this.selector || "**", fn);
            return this;
          },
          delegate: function (selector, types, data, fn) {
            return this.on(types, selector, data, fn);
          },
          undelegate: function (selector, types, fn) {
            // ( namespace ) or ( selector, types [, fn] )
            return arguments.length == 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
          },
          trigger: function (type, data) {
            return this.each(function () {
              jQuery.event.trigger(type, data, this);
            });
          },
          triggerHandler: function (type, data) {
            if (this[0]) {
              return jQuery.event.trigger(type, data, this[0], true);
            }
          },
          toggle: function (fn) {
            // Save reference to arguments for access in closure
            var args = arguments,
                guid = fn.guid || jQuery.guid++,
                i = 0,
                toggler = function (event) {
              // Figure out which function to execute
              var lastToggle = (jQuery._data(this, "lastToggle" + fn.guid) || 0) % i;

              jQuery._data(this, "lastToggle" + fn.guid, lastToggle + 1); // Make sure that clicks stop


              event.preventDefault(); // and execute the function

              return args[lastToggle].apply(this, arguments) || false;
            }; // link all the functions, so any of them can unbind this click handler


            toggler.guid = guid;

            while (i < args.length) {
              args[i++].guid = guid;
            }

            return this.click(toggler);
          },
          hover: function (fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
          }
        });
        jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "), function (i, name) {
          // Handle event binding
          jQuery.fn[name] = function (data, fn) {
            if (fn == null) {
              fn = data;
              data = null;
            }

            return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
          };

          if (rkeyEvent.test(name)) {
            jQuery.event.fixHooks[name] = jQuery.event.keyHooks;
          }

          if (rmouseEvent.test(name)) {
            jQuery.event.fixHooks[name] = jQuery.event.mouseHooks;
          }
        });
        /*!
         * Sizzle CSS Selector Engine
         *  Copyright 2012 jQuery Foundation and other contributors
         *  Released under the MIT license
         *  http://sizzlejs.com/
         */

        (function (window, undefined) {
          var dirruns,
              cachedruns,
              assertGetIdNotName,
              Expr,
              getText,
              isXML,
              contains,
              compile,
              sortOrder,
              hasDuplicate,
              baseHasDuplicate = true,
              strundefined = "undefined",
              expando = ("sizcache" + Math.random()).replace(".", ""),
              document = window.document,
              docElem = document.documentElement,
              done = 0,
              slice = [].slice,
              push = [].push,
              // Augment a function for special use by Sizzle
          markFunction = function (fn, value) {
            fn[expando] = value || true;
            return fn;
          },
              createCache = function () {
            var cache = {},
                keys = [];
            return markFunction(function (key, value) {
              // Only keep the most recent entries
              if (keys.push(key) > Expr.cacheLength) {
                delete cache[keys.shift()];
              }

              return cache[key] = value;
            }, cache);
          },
              classCache = createCache(),
              tokenCache = createCache(),
              compilerCache = createCache(),
              // Regex
          // Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
          whitespace = "[\\x20\\t\\r\\n\\f]",
              // http://www.w3.org/TR/css3-syntax/#characters
          characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",
              // Loosely modeled on CSS identifier characters
          // An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
          // Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
          identifier = characterEncoding.replace("w", "w#"),
              // Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
          operators = "([*^$|!~]?=)",
              attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace + "*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",
              // Prefer arguments not in parens/brackets,
          //   then attribute selectors and non-pseudos (denoted by :),
          //   then anything else
          // These preferences are here to reduce the number of selectors
          //   needing tokenize in the PSEUDO preFilter
          pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)",
              // For matchExpr.POS and matchExpr.needsContext
          pos = ":(nth|eq|gt|lt|first|last|even|odd)(?:\\(((?:-\\d)?\\d*)\\)|)(?=[^-]|$)",
              // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
          rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
              rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
              rcombinators = new RegExp("^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*"),
              rpseudo = new RegExp(pseudos),
              // Easily-parseable/retrievable ID or TAG or CLASS selectors
          rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,
              rnot = /^:not/,
              rsibling = /[\x20\t\r\n\f]*[+~]/,
              rendsWithNot = /:not\($/,
              rheader = /h\d/i,
              rinputs = /input|select|textarea|button/i,
              rbackslash = /\\(?!\\)/g,
              matchExpr = {
            "ID": new RegExp("^#(" + characterEncoding + ")"),
            "CLASS": new RegExp("^\\.(" + characterEncoding + ")"),
            "NAME": new RegExp("^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]"),
            "TAG": new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
            "ATTR": new RegExp("^" + attributes),
            "PSEUDO": new RegExp("^" + pseudos),
            "CHILD": new RegExp("^:(only|nth|last|first)-child(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
            "POS": new RegExp(pos, "ig"),
            // For use in libraries implementing .is()
            "needsContext": new RegExp("^" + whitespace + "*[>+~]|" + pos, "i")
          },
              // Support
          // Used for testing something on an element
          assert = function (fn) {
            var div = document.createElement("div");

            try {
              return fn(div);
            } catch (e) {
              return false;
            } finally {
              // release memory in IE
              div = null;
            }
          },
              // Check if getElementsByTagName("*") returns only elements
          assertTagNameNoComments = assert(function (div) {
            div.appendChild(document.createComment(""));
            return !div.getElementsByTagName("*").length;
          }),
              // Check if getAttribute returns normalized href attributes
          assertHrefNotNormalized = assert(function (div) {
            div.innerHTML = "<a href='#'></a>";
            return div.firstChild && typeof div.firstChild.getAttribute !== strundefined && div.firstChild.getAttribute("href") === "#";
          }),
              // Check if attributes should be retrieved by attribute nodes
          assertAttributes = assert(function (div) {
            div.innerHTML = "<select></select>";
            var type = typeof div.lastChild.getAttribute("multiple"); // IE8 returns a string for some attributes even when not present

            return type !== "boolean" && type !== "string";
          }),
              // Check if getElementsByClassName can be trusted
          assertUsableClassName = assert(function (div) {
            // Opera can't find a second classname (in 9.6)
            div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";

            if (!div.getElementsByClassName || !div.getElementsByClassName("e").length) {
              return false;
            } // Safari 3.2 caches class attributes and doesn't catch changes


            div.lastChild.className = "e";
            return div.getElementsByClassName("e").length === 2;
          }),
              // Check if getElementById returns elements by name
          // Check if getElementsByName privileges form controls or returns elements by ID
          assertUsableName = assert(function (div) {
            // Inject content
            div.id = expando + 0;
            div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
            docElem.insertBefore(div, docElem.firstChild); // Test

            var pass = document.getElementsByName && // buggy browsers will return fewer than the correct 2
            document.getElementsByName(expando).length === 2 + // buggy browsers will return more than the correct 0
            document.getElementsByName(expando + 0).length;
            assertGetIdNotName = !document.getElementById(expando); // Cleanup

            docElem.removeChild(div);
            return pass;
          }); // If slice is not available, provide a backup


          try {
            slice.call(docElem.childNodes, 0)[0].nodeType;
          } catch (e) {
            slice = function (i) {
              var elem,
                  results = [];

              for (; elem = this[i]; i++) {
                results.push(elem);
              }

              return results;
            };
          }

          function Sizzle(selector, context, results, seed) {
            results = results || [];
            context = context || document;
            var match,
                elem,
                xml,
                m,
                nodeType = context.nodeType;

            if (nodeType !== 1 && nodeType !== 9) {
              return [];
            }

            if (!selector || typeof selector !== "string") {
              return results;
            }

            xml = isXML(context);

            if (!xml && !seed) {
              if (match = rquickExpr.exec(selector)) {
                // Speed-up: Sizzle("#ID")
                if (m = match[1]) {
                  if (nodeType === 9) {
                    elem = context.getElementById(m); // Check parentNode to catch when Blackberry 4.6 returns
                    // nodes that are no longer in the document #6963

                    if (elem && elem.parentNode) {
                      // Handle the case where IE, Opera, and Webkit return items
                      // by name instead of ID
                      if (elem.id === m) {
                        results.push(elem);
                        return results;
                      }
                    } else {
                      return results;
                    }
                  } else {
                    // Context is not a document
                    if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) {
                      results.push(elem);
                      return results;
                    }
                  } // Speed-up: Sizzle("TAG")

                } else if (match[2]) {
                  push.apply(results, slice.call(context.getElementsByTagName(selector), 0));
                  return results; // Speed-up: Sizzle(".CLASS")
                } else if ((m = match[3]) && assertUsableClassName && context.getElementsByClassName) {
                  push.apply(results, slice.call(context.getElementsByClassName(m), 0));
                  return results;
                }
              }
            } // All others


            return select(selector, context, results, seed, xml);
          }

          Sizzle.matches = function (expr, elements) {
            return Sizzle(expr, null, null, elements);
          };

          Sizzle.matchesSelector = function (elem, expr) {
            return Sizzle(expr, null, null, [elem]).length > 0;
          }; // Returns a function to use in pseudos for input types


          function createInputPseudo(type) {
            return function (elem) {
              var name = elem.nodeName.toLowerCase();
              return name === "input" && elem.type === type;
            };
          } // Returns a function to use in pseudos for buttons


          function createButtonPseudo(type) {
            return function (elem) {
              var name = elem.nodeName.toLowerCase();
              return (name === "input" || name === "button") && elem.type === type;
            };
          }
          /**
           * Utility function for retrieving the text value of an array of DOM nodes
           * @param {Array|Element} elem
           */


          getText = Sizzle.getText = function (elem) {
            var node,
                ret = "",
                i = 0,
                nodeType = elem.nodeType;

            if (nodeType) {
              if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
                // Use textContent for elements
                // innerText usage removed for consistency of new lines (see #11153)
                if (typeof elem.textContent === "string") {
                  return elem.textContent;
                } else {
                  // Traverse its children
                  for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                    ret += getText(elem);
                  }
                }
              } else if (nodeType === 3 || nodeType === 4) {
                return elem.nodeValue;
              } // Do not include comment or processing instruction nodes

            } else {
              // If no nodeType, this is expected to be an array
              for (; node = elem[i]; i++) {
                // Do not traverse comment nodes
                ret += getText(node);
              }
            }

            return ret;
          };

          isXML = Sizzle.isXML = function isXML(elem) {
            // documentElement is verified for cases where it doesn't yet exist
            // (such as loading iframes in IE - #4833)
            var documentElement = elem && (elem.ownerDocument || elem).documentElement;
            return documentElement ? documentElement.nodeName !== "HTML" : false;
          }; // Element contains another


          contains = Sizzle.contains = docElem.contains ? function (a, b) {
            var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
            return a === bup || !!(bup && bup.nodeType === 1 && adown.contains && adown.contains(bup));
          } : docElem.compareDocumentPosition ? function (a, b) {
            return b && !!(a.compareDocumentPosition(b) & 16);
          } : function (a, b) {
            while (b = b.parentNode) {
              if (b === a) {
                return true;
              }
            }

            return false;
          };

          Sizzle.attr = function (elem, name) {
            var attr,
                xml = isXML(elem);

            if (!xml) {
              name = name.toLowerCase();
            }

            if (Expr.attrHandle[name]) {
              return Expr.attrHandle[name](elem);
            }

            if (assertAttributes || xml) {
              return elem.getAttribute(name);
            }

            attr = elem.getAttributeNode(name);
            return attr ? typeof elem[name] === "boolean" ? elem[name] ? name : null : attr.specified ? attr.value : null : null;
          };

          Expr = Sizzle.selectors = {
            // Can be adjusted by the user
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            order: new RegExp("ID|TAG" + (assertUsableName ? "|NAME" : "") + (assertUsableClassName ? "|CLASS" : "")),
            // IE6/7 return a modified href
            attrHandle: assertHrefNotNormalized ? {} : {
              "href": function (elem) {
                return elem.getAttribute("href", 2);
              },
              "type": function (elem) {
                return elem.getAttribute("type");
              }
            },
            find: {
              "ID": assertGetIdNotName ? function (id, context, xml) {
                if (typeof context.getElementById !== strundefined && !xml) {
                  var m = context.getElementById(id); // Check parentNode to catch when Blackberry 4.6 returns
                  // nodes that are no longer in the document #6963

                  return m && m.parentNode ? [m] : [];
                }
              } : function (id, context, xml) {
                if (typeof context.getElementById !== strundefined && !xml) {
                  var m = context.getElementById(id);
                  return m ? m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ? [m] : undefined : [];
                }
              },
              "TAG": assertTagNameNoComments ? function (tag, context) {
                if (typeof context.getElementsByTagName !== strundefined) {
                  return context.getElementsByTagName(tag);
                }
              } : function (tag, context) {
                var results = context.getElementsByTagName(tag); // Filter out possible comments

                if (tag === "*") {
                  var elem,
                      tmp = [],
                      i = 0;

                  for (; elem = results[i]; i++) {
                    if (elem.nodeType === 1) {
                      tmp.push(elem);
                    }
                  }

                  return tmp;
                }

                return results;
              },
              "NAME": function (tag, context) {
                if (typeof context.getElementsByName !== strundefined) {
                  return context.getElementsByName(name);
                }
              },
              "CLASS": function (className, context, xml) {
                if (typeof context.getElementsByClassName !== strundefined && !xml) {
                  return context.getElementsByClassName(className);
                }
              }
            },
            relative: {
              ">": {
                dir: "parentNode",
                first: true
              },
              " ": {
                dir: "parentNode"
              },
              "+": {
                dir: "previousSibling",
                first: true
              },
              "~": {
                dir: "previousSibling"
              }
            },
            preFilter: {
              "ATTR": function (match) {
                match[1] = match[1].replace(rbackslash, ""); // Move the given value to match[3] whether quoted or unquoted

                match[3] = (match[4] || match[5] || "").replace(rbackslash, "");

                if (match[2] === "~=") {
                  match[3] = " " + match[3] + " ";
                }

                return match.slice(0, 4);
              },
              "CHILD": function (match) {
                /* matches from matchExpr.CHILD
                	1 type (only|nth|...)
                	2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
                	3 xn-component of xn+y argument ([+-]?\d*n|)
                	4 sign of xn-component
                	5 x of xn-component
                	6 sign of y-component
                	7 y of y-component
                */
                match[1] = match[1].toLowerCase();

                if (match[1] === "nth") {
                  // nth-child requires argument
                  if (!match[2]) {
                    Sizzle.error(match[0]);
                  } // numeric x and y parameters for Expr.filter.CHILD
                  // remember that false/true cast respectively to 0/1


                  match[3] = +(match[3] ? match[4] + (match[5] || 1) : 2 * (match[2] === "even" || match[2] === "odd"));
                  match[4] = +(match[6] + match[7] || match[2] === "odd"); // other types prohibit arguments
                } else if (match[2]) {
                  Sizzle.error(match[0]);
                }

                return match;
              },
              "PSEUDO": function (match, context, xml) {
                var unquoted, excess;

                if (matchExpr["CHILD"].test(match[0])) {
                  return null;
                }

                if (match[3]) {
                  match[2] = match[3];
                } else if (unquoted = match[4]) {
                  // Only check arguments that contain a pseudo
                  if (rpseudo.test(unquoted) && ( // Get excess from tokenize (recursively)
                  excess = tokenize(unquoted, context, xml, true)) && ( // advance to the next closing parenthesis
                  excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                    // excess is a negative index
                    unquoted = unquoted.slice(0, excess);
                    match[0] = match[0].slice(0, excess);
                  }

                  match[2] = unquoted;
                } // Return only captures needed by the pseudo filter method (type and argument)


                return match.slice(0, 3);
              }
            },
            filter: {
              "ID": assertGetIdNotName ? function (id) {
                id = id.replace(rbackslash, "");
                return function (elem) {
                  return elem.getAttribute("id") === id;
                };
              } : function (id) {
                id = id.replace(rbackslash, "");
                return function (elem) {
                  var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
                  return node && node.value === id;
                };
              },
              "TAG": function (nodeName) {
                if (nodeName === "*") {
                  return function () {
                    return true;
                  };
                }

                nodeName = nodeName.replace(rbackslash, "").toLowerCase();
                return function (elem) {
                  return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                };
              },
              "CLASS": function (className) {
                var pattern = classCache[expando][className];

                if (!pattern) {
                  pattern = classCache(className, new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)"));
                }

                return function (elem) {
                  return pattern.test(elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "");
                };
              },
              "ATTR": function (name, operator, check) {
                if (!operator) {
                  return function (elem) {
                    return Sizzle.attr(elem, name) != null;
                  };
                }

                return function (elem) {
                  var result = Sizzle.attr(elem, name),
                      value = result + "";

                  if (result == null) {
                    return operator === "!=";
                  }

                  switch (operator) {
                    case "=":
                      return value === check;

                    case "!=":
                      return value !== check;

                    case "^=":
                      return check && value.indexOf(check) === 0;

                    case "*=":
                      return check && value.indexOf(check) > -1;

                    case "$=":
                      return check && value.substr(value.length - check.length) === check;

                    case "~=":
                      return (" " + value + " ").indexOf(check) > -1;

                    case "|=":
                      return value === check || value.substr(0, check.length + 1) === check + "-";
                  }
                };
              },
              "CHILD": function (type, argument, first, last) {
                if (type === "nth") {
                  var doneName = done++;
                  return function (elem) {
                    var parent,
                        diff,
                        count = 0,
                        node = elem;

                    if (first === 1 && last === 0) {
                      return true;
                    }

                    parent = elem.parentNode;

                    if (parent && (parent[expando] !== doneName || !elem.sizset)) {
                      for (node = parent.firstChild; node; node = node.nextSibling) {
                        if (node.nodeType === 1) {
                          node.sizset = ++count;

                          if (node === elem) {
                            break;
                          }
                        }
                      }

                      parent[expando] = doneName;
                    }

                    diff = elem.sizset - last;

                    if (first === 0) {
                      return diff === 0;
                    } else {
                      return diff % first === 0 && diff / first >= 0;
                    }
                  };
                }

                return function (elem) {
                  var node = elem;

                  switch (type) {
                    case "only":
                    case "first":
                      while (node = node.previousSibling) {
                        if (node.nodeType === 1) {
                          return false;
                        }
                      }

                      if (type === "first") {
                        return true;
                      }

                      node = elem;

                    /* falls through */

                    case "last":
                      while (node = node.nextSibling) {
                        if (node.nodeType === 1) {
                          return false;
                        }
                      }

                      return true;
                  }
                };
              },
              "PSEUDO": function (pseudo, argument, context, xml) {
                // pseudo-class names are case-insensitive
                // http://www.w3.org/TR/selectors/#pseudo-classes
                // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
                var args,
                    fn = Expr.pseudos[pseudo] || Expr.pseudos[pseudo.toLowerCase()];

                if (!fn) {
                  Sizzle.error("unsupported pseudo: " + pseudo);
                } // The user may use createPseudo to indicate that
                // arguments are needed to create the filter function
                // just as Sizzle does


                if (!fn[expando]) {
                  if (fn.length > 1) {
                    args = [pseudo, pseudo, "", argument];
                    return function (elem) {
                      return fn(elem, 0, args);
                    };
                  }

                  return fn;
                }

                return fn(argument, context, xml);
              }
            },
            pseudos: {
              "not": markFunction(function (selector, context, xml) {
                // Trim the selector passed to compile
                // to avoid treating leading and trailing
                // spaces as combinators
                var matcher = compile(selector.replace(rtrim, "$1"), context, xml);
                return function (elem) {
                  return !matcher(elem);
                };
              }),
              "enabled": function (elem) {
                return elem.disabled === false;
              },
              "disabled": function (elem) {
                return elem.disabled === true;
              },
              "checked": function (elem) {
                // In CSS3, :checked should return both checked and selected elements
                // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
                var nodeName = elem.nodeName.toLowerCase();
                return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
              },
              "selected": function (elem) {
                // Accessing this property makes selected-by-default
                // options in Safari work properly
                if (elem.parentNode) {
                  elem.parentNode.selectedIndex;
                }

                return elem.selected === true;
              },
              "parent": function (elem) {
                return !Expr.pseudos["empty"](elem);
              },
              "empty": function (elem) {
                // http://www.w3.org/TR/selectors/#empty-pseudo
                // :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
                //   not comment, processing instructions, or others
                // Thanks to Diego Perini for the nodeName shortcut
                //   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
                var nodeType;
                elem = elem.firstChild;

                while (elem) {
                  if (elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4) {
                    return false;
                  }

                  elem = elem.nextSibling;
                }

                return true;
              },
              "contains": markFunction(function (text) {
                return function (elem) {
                  return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
                };
              }),
              "has": markFunction(function (selector) {
                return function (elem) {
                  return Sizzle(selector, elem).length > 0;
                };
              }),
              "header": function (elem) {
                return rheader.test(elem.nodeName);
              },
              "text": function (elem) {
                var type, attr; // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
                // use getAttribute instead to test this case

                return elem.nodeName.toLowerCase() === "input" && (type = elem.type) === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === type);
              },
              // Input types
              "radio": createInputPseudo("radio"),
              "checkbox": createInputPseudo("checkbox"),
              "file": createInputPseudo("file"),
              "password": createInputPseudo("password"),
              "image": createInputPseudo("image"),
              "submit": createButtonPseudo("submit"),
              "reset": createButtonPseudo("reset"),
              "button": function (elem) {
                var name = elem.nodeName.toLowerCase();
                return name === "input" && elem.type === "button" || name === "button";
              },
              "input": function (elem) {
                return rinputs.test(elem.nodeName);
              },
              "focus": function (elem) {
                var doc = elem.ownerDocument;
                return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href);
              },
              "active": function (elem) {
                return elem === elem.ownerDocument.activeElement;
              }
            },
            setFilters: {
              "first": function (elements, argument, not) {
                return not ? elements.slice(1) : [elements[0]];
              },
              "last": function (elements, argument, not) {
                var elem = elements.pop();
                return not ? elements : [elem];
              },
              "even": function (elements, argument, not) {
                var results = [],
                    i = not ? 1 : 0,
                    len = elements.length;

                for (; i < len; i = i + 2) {
                  results.push(elements[i]);
                }

                return results;
              },
              "odd": function (elements, argument, not) {
                var results = [],
                    i = not ? 0 : 1,
                    len = elements.length;

                for (; i < len; i = i + 2) {
                  results.push(elements[i]);
                }

                return results;
              },
              "lt": function (elements, argument, not) {
                return not ? elements.slice(+argument) : elements.slice(0, +argument);
              },
              "gt": function (elements, argument, not) {
                return not ? elements.slice(0, +argument + 1) : elements.slice(+argument + 1);
              },
              "eq": function (elements, argument, not) {
                var elem = elements.splice(+argument, 1);
                return not ? elements : elem;
              }
            }
          };

          function siblingCheck(a, b, ret) {
            if (a === b) {
              return ret;
            }

            var cur = a.nextSibling;

            while (cur) {
              if (cur === b) {
                return -1;
              }

              cur = cur.nextSibling;
            }

            return 1;
          }

          sortOrder = docElem.compareDocumentPosition ? function (a, b) {
            if (a === b) {
              hasDuplicate = true;
              return 0;
            }

            return (!a.compareDocumentPosition || !b.compareDocumentPosition ? a.compareDocumentPosition : a.compareDocumentPosition(b) & 4) ? -1 : 1;
          } : function (a, b) {
            // The nodes are identical, we can exit early
            if (a === b) {
              hasDuplicate = true;
              return 0; // Fallback to using sourceIndex (in IE) if it's available on both nodes
            } else if (a.sourceIndex && b.sourceIndex) {
              return a.sourceIndex - b.sourceIndex;
            }

            var al,
                bl,
                ap = [],
                bp = [],
                aup = a.parentNode,
                bup = b.parentNode,
                cur = aup; // If the nodes are siblings (or identical) we can do a quick check

            if (aup === bup) {
              return siblingCheck(a, b); // If no parents were found then the nodes are disconnected
            } else if (!aup) {
              return -1;
            } else if (!bup) {
              return 1;
            } // Otherwise they're somewhere else in the tree so we need
            // to build up a full list of the parentNodes for comparison


            while (cur) {
              ap.unshift(cur);
              cur = cur.parentNode;
            }

            cur = bup;

            while (cur) {
              bp.unshift(cur);
              cur = cur.parentNode;
            }

            al = ap.length;
            bl = bp.length; // Start walking down the tree looking for a discrepancy

            for (var i = 0; i < al && i < bl; i++) {
              if (ap[i] !== bp[i]) {
                return siblingCheck(ap[i], bp[i]);
              }
            } // We ended someplace up the tree so do a sibling check


            return i === al ? siblingCheck(a, bp[i], -1) : siblingCheck(ap[i], b, 1);
          }; // Always assume the presence of duplicates if sort doesn't
          // pass them to our comparison function (as in Google Chrome).

          [0, 0].sort(sortOrder);
          baseHasDuplicate = !hasDuplicate; // Document sorting and removing duplicates

          Sizzle.uniqueSort = function (results) {
            var elem,
                i = 1;
            hasDuplicate = baseHasDuplicate;
            results.sort(sortOrder);

            if (hasDuplicate) {
              for (; elem = results[i]; i++) {
                if (elem === results[i - 1]) {
                  results.splice(i--, 1);
                }
              }
            }

            return results;
          };

          Sizzle.error = function (msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
          };

          function tokenize(selector, context, xml, parseOnly) {
            var matched,
                match,
                tokens,
                type,
                soFar,
                groups,
                group,
                i,
                preFilters,
                filters,
                checkContext = !xml && context !== document,
                // Token cache should maintain spaces
            key = (checkContext ? "<s>" : "") + selector.replace(rtrim, "$1<s>"),
                cached = tokenCache[expando][key];

            if (cached) {
              return parseOnly ? 0 : slice.call(cached, 0);
            }

            soFar = selector;
            groups = [];
            i = 0;
            preFilters = Expr.preFilter;
            filters = Expr.filter;

            while (soFar) {
              // Comma and first run
              if (!matched || (match = rcomma.exec(soFar))) {
                if (match) {
                  soFar = soFar.slice(match[0].length);
                  tokens.selector = group;
                }

                groups.push(tokens = []);
                group = ""; // Need to make sure we're within a narrower context if necessary
                // Adding a descendant combinator will generate what is needed

                if (checkContext) {
                  soFar = " " + soFar;
                }
              }

              matched = false; // Combinators

              if (match = rcombinators.exec(soFar)) {
                group += match[0];
                soFar = soFar.slice(match[0].length); // Cast descendant combinators to space

                matched = tokens.push({
                  part: match.pop().replace(rtrim, " "),
                  string: match[0],
                  captures: match
                });
              } // Filters


              for (type in filters) {
                if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match, context, xml)))) {
                  group += match[0];
                  soFar = soFar.slice(match[0].length);
                  matched = tokens.push({
                    part: type,
                    string: match.shift(),
                    captures: match
                  });
                }
              }

              if (!matched) {
                break;
              }
            } // Attach the full group as a selector


            if (group) {
              tokens.selector = group;
            } // Return the length of the invalid excess
            // if we're just parsing
            // Otherwise, throw an error or return tokens


            return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : // Cache the tokens
            slice.call(tokenCache(key, groups), 0);
          }

          function addCombinator(matcher, combinator, context, xml) {
            var dir = combinator.dir,
                doneName = done++;

            if (!matcher) {
              // If there is no matcher to check, check against the context
              matcher = function (elem) {
                return elem === context;
              };
            }

            return combinator.first ? function (elem) {
              while (elem = elem[dir]) {
                if (elem.nodeType === 1) {
                  return matcher(elem) && elem;
                }
              }
            } : xml ? function (elem) {
              while (elem = elem[dir]) {
                if (elem.nodeType === 1) {
                  if (matcher(elem)) {
                    return elem;
                  }
                }
              }
            } : function (elem) {
              var cache,
                  dirkey = doneName + "." + dirruns,
                  cachedkey = dirkey + "." + cachedruns;

              while (elem = elem[dir]) {
                if (elem.nodeType === 1) {
                  if ((cache = elem[expando]) === cachedkey) {
                    return elem.sizset;
                  } else if (typeof cache === "string" && cache.indexOf(dirkey) === 0) {
                    if (elem.sizset) {
                      return elem;
                    }
                  } else {
                    elem[expando] = cachedkey;

                    if (matcher(elem)) {
                      elem.sizset = true;
                      return elem;
                    }

                    elem.sizset = false;
                  }
                }
              }
            };
          }

          function addMatcher(higher, deeper) {
            return higher ? function (elem) {
              var result = deeper(elem);
              return result && higher(result === true ? elem : result);
            } : deeper;
          } // ["TAG", ">", "ID", " ", "CLASS"]


          function matcherFromTokens(tokens, context, xml) {
            var token,
                matcher,
                i = 0;

            for (; token = tokens[i]; i++) {
              if (Expr.relative[token.part]) {
                matcher = addCombinator(matcher, Expr.relative[token.part], context, xml);
              } else {
                matcher = addMatcher(matcher, Expr.filter[token.part].apply(null, token.captures.concat(context, xml)));
              }
            }

            return matcher;
          }

          function matcherFromGroupMatchers(matchers) {
            return function (elem) {
              var matcher,
                  j = 0;

              for (; matcher = matchers[j]; j++) {
                if (matcher(elem)) {
                  return true;
                }
              }

              return false;
            };
          }

          compile = Sizzle.compile = function (selector, context, xml) {
            var group,
                i,
                len,
                cached = compilerCache[expando][selector]; // Return a cached group function if already generated (context dependent)

            if (cached && cached.context === context) {
              return cached;
            } // Generate a function of recursive functions that can be used to check each element


            group = tokenize(selector, context, xml);

            for (i = 0, len = group.length; i < len; i++) {
              group[i] = matcherFromTokens(group[i], context, xml);
            } // Cache the compiled function


            cached = compilerCache(selector, matcherFromGroupMatchers(group));
            cached.context = context;
            cached.runs = cached.dirruns = 0;
            return cached;
          };

          function multipleContexts(selector, contexts, results, seed) {
            var i = 0,
                len = contexts.length;

            for (; i < len; i++) {
              Sizzle(selector, contexts[i], results, seed);
            }
          }

          function handlePOSGroup(selector, posfilter, argument, contexts, seed, not) {
            var results,
                fn = Expr.setFilters[posfilter.toLowerCase()];

            if (!fn) {
              Sizzle.error(posfilter);
            }

            if (selector || !(results = seed)) {
              multipleContexts(selector || "*", contexts, results = [], seed);
            }

            return results.length > 0 ? fn(results, argument, not) : [];
          }

          function handlePOS(groups, context, results, seed) {
            var group,
                part,
                j,
                groupLen,
                token,
                selector,
                anchor,
                elements,
                match,
                matched,
                lastIndex,
                currentContexts,
                not,
                i = 0,
                len = groups.length,
                rpos = matchExpr["POS"],
                // This is generated here in case matchExpr["POS"] is extended
            rposgroups = new RegExp("^" + rpos.source + "(?!" + whitespace + ")", "i"),
                // This is for making sure non-participating
            // matching groups are represented cross-browser (IE6-8)
            setUndefined = function () {
              var i = 1,
                  len = arguments.length - 2;

              for (; i < len; i++) {
                if (arguments[i] === undefined) {
                  match[i] = undefined;
                }
              }
            };

            for (; i < len; i++) {
              group = groups[i];
              part = "";
              elements = seed;

              for (j = 0, groupLen = group.length; j < groupLen; j++) {
                token = group[j];
                selector = token.string;

                if (token.part === "PSEUDO") {
                  // Reset regex index to 0
                  rpos.exec("");
                  anchor = 0;

                  while (match = rpos.exec(selector)) {
                    matched = true;
                    lastIndex = rpos.lastIndex = match.index + match[0].length;

                    if (lastIndex > anchor) {
                      part += selector.slice(anchor, match.index);
                      anchor = lastIndex;
                      currentContexts = [context];

                      if (rcombinators.test(part)) {
                        if (elements) {
                          currentContexts = elements;
                        }

                        elements = seed;
                      }

                      if (not = rendsWithNot.test(part)) {
                        part = part.slice(0, -5).replace(rcombinators, "$&*");
                        anchor++;
                      }

                      if (match.length > 1) {
                        match[0].replace(rposgroups, setUndefined);
                      }

                      elements = handlePOSGroup(part, match[1], match[2], currentContexts, elements, not);
                    }

                    part = "";
                  }
                }

                if (!matched) {
                  part += selector;
                }

                matched = false;
              }

              if (part) {
                if (rcombinators.test(part)) {
                  multipleContexts(part, elements || [context], results, seed);
                } else {
                  Sizzle(part, context, results, seed ? seed.concat(elements) : elements);
                }
              } else {
                push.apply(results, elements);
              }
            } // Do not sort if this is a single filter


            return len === 1 ? results : Sizzle.uniqueSort(results);
          }

          function select(selector, context, results, seed, xml) {
            // Remove excessive whitespace
            selector = selector.replace(rtrim, "$1");
            var elements,
                matcher,
                cached,
                elem,
                i,
                tokens,
                token,
                lastToken,
                findContext,
                type,
                match = tokenize(selector, context, xml),
                contextNodeType = context.nodeType; // POS handling

            if (matchExpr["POS"].test(selector)) {
              return handlePOS(match, context, results, seed);
            }

            if (seed) {
              elements = slice.call(seed, 0); // To maintain document order, only narrow the
              // set if there is one group
            } else if (match.length === 1) {
              // Take a shortcut and set the context if the root selector is an ID
              if ((tokens = slice.call(match[0], 0)).length > 2 && (token = tokens[0]).part === "ID" && contextNodeType === 9 && !xml && Expr.relative[tokens[1].part]) {
                context = Expr.find["ID"](token.captures[0].replace(rbackslash, ""), context, xml)[0];

                if (!context) {
                  return results;
                }

                selector = selector.slice(tokens.shift().string.length);
              }

              findContext = (match = rsibling.exec(tokens[0].string)) && !match.index && context.parentNode || context; // Reduce the set if possible

              lastToken = "";

              for (i = tokens.length - 1; i >= 0; i--) {
                token = tokens[i];
                type = token.part;
                lastToken = token.string + lastToken;

                if (Expr.relative[type]) {
                  break;
                }

                if (Expr.order.test(type)) {
                  elements = Expr.find[type](token.captures[0].replace(rbackslash, ""), findContext, xml);

                  if (elements == null) {
                    continue;
                  } else {
                    selector = selector.slice(0, selector.length - lastToken.length) + lastToken.replace(matchExpr[type], "");

                    if (!selector) {
                      push.apply(results, slice.call(elements, 0));
                    }

                    break;
                  }
                }
              }
            } // Only loop over the given elements once


            if (selector) {
              matcher = compile(selector, context, xml);
              dirruns = matcher.dirruns++;

              if (elements == null) {
                elements = Expr.find["TAG"]("*", rsibling.test(selector) && context.parentNode || context);
              }

              for (i = 0; elem = elements[i]; i++) {
                cachedruns = matcher.runs++;

                if (matcher(elem)) {
                  results.push(elem);
                }
              }
            }

            return results;
          }

          if (document.querySelectorAll) {
            (function () {
              var disconnectedMatch,
                  oldSelect = select,
                  rescape = /'|\\/g,
                  rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,
                  rbuggyQSA = [],
                  // matchesSelector(:active) reports false when true (IE9/Opera 11.5)
              // A support test would require too much code (would include document ready)
              // just skip matchesSelector for :active
              rbuggyMatches = [":active"],
                  matches = docElem.matchesSelector || docElem.mozMatchesSelector || docElem.webkitMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector; // Build QSA regex
              // Regex strategy adopted from Diego Perini

              assert(function (div) {
                // Select is set to empty string on purpose
                // This is to test IE's treatment of not explictly
                // setting a boolean content attribute,
                // since its presence should be enough
                // http://bugs.jquery.com/ticket/12359
                div.innerHTML = "<select><option selected=''></option></select>"; // IE8 - Some boolean attributes are not treated correctly

                if (!div.querySelectorAll("[selected]").length) {
                  rbuggyQSA.push("\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)");
                } // Webkit/Opera - :checked should return selected option elements
                // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
                // IE8 throws error here (do not put tests after this one)


                if (!div.querySelectorAll(":checked").length) {
                  rbuggyQSA.push(":checked");
                }
              });
              assert(function (div) {
                // Opera 10-12/IE9 - ^= $= *= and empty values
                // Should not select anything
                div.innerHTML = "<p test=''></p>";

                if (div.querySelectorAll("[test^='']").length) {
                  rbuggyQSA.push("[*^$]=" + whitespace + "*(?:\"\"|'')");
                } // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
                // IE8 throws error here (do not put tests after this one)


                div.innerHTML = "<input type='hidden'/>";

                if (!div.querySelectorAll(":enabled").length) {
                  rbuggyQSA.push(":enabled", ":disabled");
                }
              });
              rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));

              select = function (selector, context, results, seed, xml) {
                // Only use querySelectorAll when not filtering,
                // when this is not xml,
                // and when no QSA bugs apply
                if (!seed && !xml && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                  if (context.nodeType === 9) {
                    try {
                      push.apply(results, slice.call(context.querySelectorAll(selector), 0));
                      return results;
                    } catch (qsaError) {} // qSA works strangely on Element-rooted queries
                    // We can work around this by specifying an extra ID on the root
                    // and working up from there (Thanks to Andrew Dupont for the technique)
                    // IE 8 doesn't work on object elements

                  } else if (context.nodeType === 1 && context.nodeName.toLowerCase() !== "object") {
                    var groups,
                        i,
                        len,
                        old = context.getAttribute("id"),
                        nid = old || expando,
                        newContext = rsibling.test(selector) && context.parentNode || context;

                    if (old) {
                      nid = nid.replace(rescape, "\\$&");
                    } else {
                      context.setAttribute("id", nid);
                    }

                    groups = tokenize(selector, context, xml); // Trailing space is unnecessary
                    // There is always a context check

                    nid = "[id='" + nid + "']";

                    for (i = 0, len = groups.length; i < len; i++) {
                      groups[i] = nid + groups[i].selector;
                    }

                    try {
                      push.apply(results, slice.call(newContext.querySelectorAll(groups.join(",")), 0));
                      return results;
                    } catch (qsaError) {} finally {
                      if (!old) {
                        context.removeAttribute("id");
                      }
                    }
                  }
                }

                return oldSelect(selector, context, results, seed, xml);
              };

              if (matches) {
                assert(function (div) {
                  // Check to see if it's possible to do matchesSelector
                  // on a disconnected node (IE 9)
                  disconnectedMatch = matches.call(div, "div"); // This should fail with an exception
                  // Gecko does not error, returns false instead

                  try {
                    matches.call(div, "[test!='']:sizzle");
                    rbuggyMatches.push(matchExpr["PSEUDO"].source, matchExpr["POS"].source, "!=");
                  } catch (e) {}
                }); // rbuggyMatches always contains :active, so no need for a length check

                rbuggyMatches =
                /* rbuggyMatches.length && */
                new RegExp(rbuggyMatches.join("|"));

                Sizzle.matchesSelector = function (elem, expr) {
                  // Make sure that attribute selectors are quoted
                  expr = expr.replace(rattributeQuotes, "='$1']"); // rbuggyMatches always contains :active, so no need for an existence check

                  if (!isXML(elem) && !rbuggyMatches.test(expr) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
                    try {
                      var ret = matches.call(elem, expr); // IE 9's matchesSelector returns false on disconnected nodes

                      if (ret || disconnectedMatch || // As well, disconnected nodes are said to be in a document
                      // fragment in IE 9
                      elem.document && elem.document.nodeType !== 11) {
                        return ret;
                      }
                    } catch (e) {}
                  }

                  return Sizzle(expr, null, null, [elem]).length > 0;
                };
              }
            })();
          } // Deprecated


          Expr.setFilters["nth"] = Expr.setFilters["eq"]; // Back-compat

          Expr.filters = Expr.pseudos; // Override sizzle attribute retrieval

          Sizzle.attr = jQuery.attr;
          jQuery.find = Sizzle;
          jQuery.expr = Sizzle.selectors;
          jQuery.expr[":"] = jQuery.expr.pseudos;
          jQuery.unique = Sizzle.uniqueSort;
          jQuery.text = Sizzle.getText;
          jQuery.isXMLDoc = Sizzle.isXML;
          jQuery.contains = Sizzle.contains;
        })(window);

        var runtil = /Until$/,
            rparentsprev = /^(?:parents|prev(?:Until|All))/,
            isSimple = /^.[^:#\[\.,]*$/,
            rneedsContext = jQuery.expr.match.needsContext,
            // methods guaranteed to produce a unique set when starting from a unique set
        guaranteedUnique = {
          children: true,
          contents: true,
          next: true,
          prev: true
        };
        jQuery.fn.extend({
          find: function (selector) {
            var i,
                l,
                length,
                n,
                r,
                ret,
                self = this;

            if (typeof selector !== "string") {
              return jQuery(selector).filter(function () {
                for (i = 0, l = self.length; i < l; i++) {
                  if (jQuery.contains(self[i], this)) {
                    return true;
                  }
                }
              });
            }

            ret = this.pushStack("", "find", selector);

            for (i = 0, l = this.length; i < l; i++) {
              length = ret.length;
              jQuery.find(selector, this[i], ret);

              if (i > 0) {
                // Make sure that the results are unique
                for (n = length; n < ret.length; n++) {
                  for (r = 0; r < length; r++) {
                    if (ret[r] === ret[n]) {
                      ret.splice(n--, 1);
                      break;
                    }
                  }
                }
              }
            }

            return ret;
          },
          has: function (target) {
            var i,
                targets = jQuery(target, this),
                len = targets.length;
            return this.filter(function () {
              for (i = 0; i < len; i++) {
                if (jQuery.contains(this, targets[i])) {
                  return true;
                }
              }
            });
          },
          not: function (selector) {
            return this.pushStack(winnow(this, selector, false), "not", selector);
          },
          filter: function (selector) {
            return this.pushStack(winnow(this, selector, true), "filter", selector);
          },
          is: function (selector) {
            return !!selector && (typeof selector === "string" ? // If this is a positional/relative selector, check membership in the returned set
            // so $("p:first").is("p:last") won't return true for a doc with two "p".
            rneedsContext.test(selector) ? jQuery(selector, this.context).index(this[0]) >= 0 : jQuery.filter(selector, this).length > 0 : this.filter(selector).length > 0);
          },
          closest: function (selectors, context) {
            var cur,
                i = 0,
                l = this.length,
                ret = [],
                pos = rneedsContext.test(selectors) || typeof selectors !== "string" ? jQuery(selectors, context || this.context) : 0;

            for (; i < l; i++) {
              cur = this[i];

              while (cur && cur.ownerDocument && cur !== context && cur.nodeType !== 11) {
                if (pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors)) {
                  ret.push(cur);
                  break;
                }

                cur = cur.parentNode;
              }
            }

            ret = ret.length > 1 ? jQuery.unique(ret) : ret;
            return this.pushStack(ret, "closest", selectors);
          },
          // Determine the position of an element within
          // the matched set of elements
          index: function (elem) {
            // No argument, return index in parent
            if (!elem) {
              return this[0] && this[0].parentNode ? this.prevAll().length : -1;
            } // index in selector


            if (typeof elem === "string") {
              return jQuery.inArray(this[0], jQuery(elem));
            } // Locate the position of the desired element


            return jQuery.inArray( // If it receives a jQuery object, the first element is used
            elem.jquery ? elem[0] : elem, this);
          },
          add: function (selector, context) {
            var set = typeof selector === "string" ? jQuery(selector, context) : jQuery.makeArray(selector && selector.nodeType ? [selector] : selector),
                all = jQuery.merge(this.get(), set);
            return this.pushStack(isDisconnected(set[0]) || isDisconnected(all[0]) ? all : jQuery.unique(all));
          },
          addBack: function (selector) {
            return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
          }
        });
        jQuery.fn.andSelf = jQuery.fn.addBack; // A painfully simple check to see if an element is disconnected
        // from a document (should be improved, where feasible).

        function isDisconnected(node) {
          return !node || !node.parentNode || node.parentNode.nodeType === 11;
        }

        function sibling(cur, dir) {
          do {
            cur = cur[dir];
          } while (cur && cur.nodeType !== 1);

          return cur;
        }

        jQuery.each({
          parent: function (elem) {
            var parent = elem.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
          },
          parents: function (elem) {
            return jQuery.dir(elem, "parentNode");
          },
          parentsUntil: function (elem, i, until) {
            return jQuery.dir(elem, "parentNode", until);
          },
          next: function (elem) {
            return sibling(elem, "nextSibling");
          },
          prev: function (elem) {
            return sibling(elem, "previousSibling");
          },
          nextAll: function (elem) {
            return jQuery.dir(elem, "nextSibling");
          },
          prevAll: function (elem) {
            return jQuery.dir(elem, "previousSibling");
          },
          nextUntil: function (elem, i, until) {
            return jQuery.dir(elem, "nextSibling", until);
          },
          prevUntil: function (elem, i, until) {
            return jQuery.dir(elem, "previousSibling", until);
          },
          siblings: function (elem) {
            return jQuery.sibling((elem.parentNode || {}).firstChild, elem);
          },
          children: function (elem) {
            return jQuery.sibling(elem.firstChild);
          },
          contents: function (elem) {
            return jQuery.nodeName(elem, "iframe") ? elem.contentDocument || elem.contentWindow.document : jQuery.merge([], elem.childNodes);
          }
        }, function (name, fn) {
          jQuery.fn[name] = function (until, selector) {
            var ret = jQuery.map(this, fn, until);

            if (!runtil.test(name)) {
              selector = until;
            }

            if (selector && typeof selector === "string") {
              ret = jQuery.filter(selector, ret);
            }

            ret = this.length > 1 && !guaranteedUnique[name] ? jQuery.unique(ret) : ret;

            if (this.length > 1 && rparentsprev.test(name)) {
              ret = ret.reverse();
            }

            return this.pushStack(ret, name, core_slice.call(arguments).join(","));
          };
        });
        jQuery.extend({
          filter: function (expr, elems, not) {
            if (not) {
              expr = ":not(" + expr + ")";
            }

            return elems.length === 1 ? jQuery.find.matchesSelector(elems[0], expr) ? [elems[0]] : [] : jQuery.find.matches(expr, elems);
          },
          dir: function (elem, dir, until) {
            var matched = [],
                cur = elem[dir];

            while (cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery(cur).is(until))) {
              if (cur.nodeType === 1) {
                matched.push(cur);
              }

              cur = cur[dir];
            }

            return matched;
          },
          sibling: function (n, elem) {
            var r = [];

            for (; n; n = n.nextSibling) {
              if (n.nodeType === 1 && n !== elem) {
                r.push(n);
              }
            }

            return r;
          }
        }); // Implement the identical functionality for filter and not

        function winnow(elements, qualifier, keep) {
          // Can't pass null or undefined to indexOf in Firefox 4
          // Set to 0 to skip string check
          qualifier = qualifier || 0;

          if (jQuery.isFunction(qualifier)) {
            return jQuery.grep(elements, function (elem, i) {
              var retVal = !!qualifier.call(elem, i, elem);
              return retVal === keep;
            });
          } else if (qualifier.nodeType) {
            return jQuery.grep(elements, function (elem, i) {
              return elem === qualifier === keep;
            });
          } else if (typeof qualifier === "string") {
            var filtered = jQuery.grep(elements, function (elem) {
              return elem.nodeType === 1;
            });

            if (isSimple.test(qualifier)) {
              return jQuery.filter(qualifier, filtered, !keep);
            } else {
              qualifier = jQuery.filter(qualifier, filtered);
            }
          }

          return jQuery.grep(elements, function (elem, i) {
            return jQuery.inArray(elem, qualifier) >= 0 === keep;
          });
        }

        function createSafeFragment(document) {
          var list = nodeNames.split("|"),
              safeFrag = document.createDocumentFragment();

          if (safeFrag.createElement) {
            while (list.length) {
              safeFrag.createElement(list.pop());
            }
          }

          return safeFrag;
        }

        var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" + "header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
            rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
            rleadingWhitespace = /^\s+/,
            rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
            rtagName = /<([\w:]+)/,
            rtbody = /<tbody/i,
            rhtml = /<|&#?\w+;/,
            rnoInnerhtml = /<(?:script|style|link)/i,
            rnocache = /<(?:script|object|embed|option|style)/i,
            rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
            rcheckableType = /^(?:checkbox|radio)$/,
            // checked="checked" or checked
        rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
            rscriptType = /\/(java|ecma)script/i,
            rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,
            wrapMap = {
          option: [1, "<select multiple='multiple'>", "</select>"],
          legend: [1, "<fieldset>", "</fieldset>"],
          thead: [1, "<table>", "</table>"],
          tr: [2, "<table><tbody>", "</tbody></table>"],
          td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
          col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
          area: [1, "<map>", "</map>"],
          _default: [0, "", ""]
        },
            safeFragment = createSafeFragment(document),
            fragmentDiv = safeFragment.appendChild(document.createElement("div"));
        wrapMap.optgroup = wrapMap.option;
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td; // IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
        // unless wrapped in a div with non-breaking characters in front of it.

        if (!jQuery.support.htmlSerialize) {
          wrapMap._default = [1, "X<div>", "</div>"];
        }

        jQuery.fn.extend({
          text: function (value) {
            return jQuery.access(this, function (value) {
              return value === undefined ? jQuery.text(this) : this.empty().append((this[0] && this[0].ownerDocument || document).createTextNode(value));
            }, null, value, arguments.length);
          },
          wrapAll: function (html) {
            if (jQuery.isFunction(html)) {
              return this.each(function (i) {
                jQuery(this).wrapAll(html.call(this, i));
              });
            }

            if (this[0]) {
              // The elements to wrap the target around
              var wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);

              if (this[0].parentNode) {
                wrap.insertBefore(this[0]);
              }

              wrap.map(function () {
                var elem = this;

                while (elem.firstChild && elem.firstChild.nodeType === 1) {
                  elem = elem.firstChild;
                }

                return elem;
              }).append(this);
            }

            return this;
          },
          wrapInner: function (html) {
            if (jQuery.isFunction(html)) {
              return this.each(function (i) {
                jQuery(this).wrapInner(html.call(this, i));
              });
            }

            return this.each(function () {
              var self = jQuery(this),
                  contents = self.contents();

              if (contents.length) {
                contents.wrapAll(html);
              } else {
                self.append(html);
              }
            });
          },
          wrap: function (html) {
            var isFunction = jQuery.isFunction(html);
            return this.each(function (i) {
              jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
            });
          },
          unwrap: function () {
            return this.parent().each(function () {
              if (!jQuery.nodeName(this, "body")) {
                jQuery(this).replaceWith(this.childNodes);
              }
            }).end();
          },
          append: function () {
            return this.domManip(arguments, true, function (elem) {
              if (this.nodeType === 1 || this.nodeType === 11) {
                this.appendChild(elem);
              }
            });
          },
          prepend: function () {
            return this.domManip(arguments, true, function (elem) {
              if (this.nodeType === 1 || this.nodeType === 11) {
                this.insertBefore(elem, this.firstChild);
              }
            });
          },
          before: function () {
            if (!isDisconnected(this[0])) {
              return this.domManip(arguments, false, function (elem) {
                this.parentNode.insertBefore(elem, this);
              });
            }

            if (arguments.length) {
              var set = jQuery.clean(arguments);
              return this.pushStack(jQuery.merge(set, this), "before", this.selector);
            }
          },
          after: function () {
            if (!isDisconnected(this[0])) {
              return this.domManip(arguments, false, function (elem) {
                this.parentNode.insertBefore(elem, this.nextSibling);
              });
            }

            if (arguments.length) {
              var set = jQuery.clean(arguments);
              return this.pushStack(jQuery.merge(this, set), "after", this.selector);
            }
          },
          // keepData is for internal use only--do not document
          remove: function (selector, keepData) {
            var elem,
                i = 0;

            for (; (elem = this[i]) != null; i++) {
              if (!selector || jQuery.filter(selector, [elem]).length) {
                if (!keepData && elem.nodeType === 1) {
                  jQuery.cleanData(elem.getElementsByTagName("*"));
                  jQuery.cleanData([elem]);
                }

                if (elem.parentNode) {
                  elem.parentNode.removeChild(elem);
                }
              }
            }

            return this;
          },
          empty: function () {
            var elem,
                i = 0;

            for (; (elem = this[i]) != null; i++) {
              // Remove element nodes and prevent memory leaks
              if (elem.nodeType === 1) {
                jQuery.cleanData(elem.getElementsByTagName("*"));
              } // Remove any remaining nodes


              while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
              }
            }

            return this;
          },
          clone: function (dataAndEvents, deepDataAndEvents) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map(function () {
              return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
            });
          },
          html: function (value) {
            return jQuery.access(this, function (value) {
              var elem = this[0] || {},
                  i = 0,
                  l = this.length;

              if (value === undefined) {
                return elem.nodeType === 1 ? elem.innerHTML.replace(rinlinejQuery, "") : undefined;
              } // See if we can take a shortcut and just use innerHTML


              if (typeof value === "string" && !rnoInnerhtml.test(value) && (jQuery.support.htmlSerialize || !rnoshimcache.test(value)) && (jQuery.support.leadingWhitespace || !rleadingWhitespace.test(value)) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {
                value = value.replace(rxhtmlTag, "<$1></$2>");

                try {
                  for (; i < l; i++) {
                    // Remove element nodes and prevent memory leaks
                    elem = this[i] || {};

                    if (elem.nodeType === 1) {
                      jQuery.cleanData(elem.getElementsByTagName("*"));
                      elem.innerHTML = value;
                    }
                  }

                  elem = 0; // If using innerHTML throws an exception, use the fallback method
                } catch (e) {}
              }

              if (elem) {
                this.empty().append(value);
              }
            }, null, value, arguments.length);
          },
          replaceWith: function (value) {
            if (!isDisconnected(this[0])) {
              // Make sure that the elements are removed from the DOM before they are inserted
              // this can help fix replacing a parent with child elements
              if (jQuery.isFunction(value)) {
                return this.each(function (i) {
                  var self = jQuery(this),
                      old = self.html();
                  self.replaceWith(value.call(this, i, old));
                });
              }

              if (typeof value !== "string") {
                value = jQuery(value).detach();
              }

              return this.each(function () {
                var next = this.nextSibling,
                    parent = this.parentNode;
                jQuery(this).remove();

                if (next) {
                  jQuery(next).before(value);
                } else {
                  jQuery(parent).append(value);
                }
              });
            }

            return this.length ? this.pushStack(jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value) : this;
          },
          detach: function (selector) {
            return this.remove(selector, true);
          },
          domManip: function (args, table, callback) {
            // Flatten any nested arrays
            args = [].concat.apply([], args);
            var results,
                first,
                fragment,
                iNoClone,
                i = 0,
                value = args[0],
                scripts = [],
                l = this.length; // We can't cloneNode fragments that contain checked, in WebKit

            if (!jQuery.support.checkClone && l > 1 && typeof value === "string" && rchecked.test(value)) {
              return this.each(function () {
                jQuery(this).domManip(args, table, callback);
              });
            }

            if (jQuery.isFunction(value)) {
              return this.each(function (i) {
                var self = jQuery(this);
                args[0] = value.call(this, i, table ? self.html() : undefined);
                self.domManip(args, table, callback);
              });
            }

            if (this[0]) {
              results = jQuery.buildFragment(args, this, scripts);
              fragment = results.fragment;
              first = fragment.firstChild;

              if (fragment.childNodes.length === 1) {
                fragment = first;
              }

              if (first) {
                table = table && jQuery.nodeName(first, "tr"); // Use the original fragment for the last item instead of the first because it can end up
                // being emptied incorrectly in certain situations (#8070).
                // Fragments from the fragment cache must always be cloned and never used in place.

                for (iNoClone = results.cacheable || l - 1; i < l; i++) {
                  callback.call(table && jQuery.nodeName(this[i], "table") ? findOrAppend(this[i], "tbody") : this[i], i === iNoClone ? fragment : jQuery.clone(fragment, true, true));
                }
              } // Fix #11809: Avoid leaking memory


              fragment = first = null;

              if (scripts.length) {
                jQuery.each(scripts, function (i, elem) {
                  if (elem.src) {
                    if (jQuery.ajax) {
                      jQuery.ajax({
                        url: elem.src,
                        type: "GET",
                        dataType: "script",
                        async: false,
                        global: false,
                        "throws": true
                      });
                    } else {
                      jQuery.error("no ajax");
                    }
                  } else {
                    jQuery.globalEval((elem.text || elem.textContent || elem.innerHTML || "").replace(rcleanScript, ""));
                  }

                  if (elem.parentNode) {
                    elem.parentNode.removeChild(elem);
                  }
                });
              }
            }

            return this;
          }
        });

        function findOrAppend(elem, tag) {
          return elem.getElementsByTagName(tag)[0] || elem.appendChild(elem.ownerDocument.createElement(tag));
        }

        function cloneCopyEvent(src, dest) {
          if (dest.nodeType !== 1 || !jQuery.hasData(src)) {
            return;
          }

          var type,
              i,
              l,
              oldData = jQuery._data(src),
              curData = jQuery._data(dest, oldData),
              events = oldData.events;

          if (events) {
            delete curData.handle;
            curData.events = {};

            for (type in events) {
              for (i = 0, l = events[type].length; i < l; i++) {
                jQuery.event.add(dest, type, events[type][i]);
              }
            }
          } // make the cloned public data object a copy from the original


          if (curData.data) {
            curData.data = jQuery.extend({}, curData.data);
          }
        }

        function cloneFixAttributes(src, dest) {
          var nodeName; // We do not need to do anything for non-Elements

          if (dest.nodeType !== 1) {
            return;
          } // clearAttributes removes the attributes, which we don't want,
          // but also removes the attachEvent events, which we *do* want


          if (dest.clearAttributes) {
            dest.clearAttributes();
          } // mergeAttributes, in contrast, only merges back on the
          // original attributes, not the events


          if (dest.mergeAttributes) {
            dest.mergeAttributes(src);
          }

          nodeName = dest.nodeName.toLowerCase();

          if (nodeName === "object") {
            // IE6-10 improperly clones children of object elements using classid.
            // IE10 throws NoModificationAllowedError if parent is null, #12132.
            if (dest.parentNode) {
              dest.outerHTML = src.outerHTML;
            } // This path appears unavoidable for IE9. When cloning an object
            // element in IE9, the outerHTML strategy above is not sufficient.
            // If the src has innerHTML and the destination does not,
            // copy the src.innerHTML into the dest.innerHTML. #10324


            if (jQuery.support.html5Clone && src.innerHTML && !jQuery.trim(dest.innerHTML)) {
              dest.innerHTML = src.innerHTML;
            }
          } else if (nodeName === "input" && rcheckableType.test(src.type)) {
            // IE6-8 fails to persist the checked state of a cloned checkbox
            // or radio button. Worse, IE6-7 fail to give the cloned element
            // a checked appearance if the defaultChecked value isn't also set
            dest.defaultChecked = dest.checked = src.checked; // IE6-7 get confused and end up setting the value of a cloned
            // checkbox/radio button to an empty string instead of "on"

            if (dest.value !== src.value) {
              dest.value = src.value;
            } // IE6-8 fails to return the selected option to the default selected
            // state when cloning options

          } else if (nodeName === "option") {
            dest.selected = src.defaultSelected; // IE6-8 fails to set the defaultValue to the correct value when
            // cloning other types of input fields
          } else if (nodeName === "input" || nodeName === "textarea") {
            dest.defaultValue = src.defaultValue; // IE blanks contents when cloning scripts
          } else if (nodeName === "script" && dest.text !== src.text) {
            dest.text = src.text;
          } // Event data gets referenced instead of copied if the expando
          // gets copied too


          dest.removeAttribute(jQuery.expando);
        }

        jQuery.buildFragment = function (args, context, scripts) {
          var fragment,
              cacheable,
              cachehit,
              first = args[0]; // Set context from what may come in as undefined or a jQuery collection or a node
          // Updated to fix #12266 where accessing context[0] could throw an exception in IE9/10 &
          // also doubles as fix for #8950 where plain objects caused createDocumentFragment exception

          context = context || document;
          context = !context.nodeType && context[0] || context;
          context = context.ownerDocument || context; // Only cache "small" (1/2 KB) HTML strings that are associated with the main document
          // Cloning options loses the selected state, so don't cache them
          // IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
          // Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
          // Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501

          if (args.length === 1 && typeof first === "string" && first.length < 512 && context === document && first.charAt(0) === "<" && !rnocache.test(first) && (jQuery.support.checkClone || !rchecked.test(first)) && (jQuery.support.html5Clone || !rnoshimcache.test(first))) {
            // Mark cacheable and look for a hit
            cacheable = true;
            fragment = jQuery.fragments[first];
            cachehit = fragment !== undefined;
          }

          if (!fragment) {
            fragment = context.createDocumentFragment();
            jQuery.clean(args, context, fragment, scripts); // Update the cache, but only store false
            // unless this is a second parsing of the same content

            if (cacheable) {
              jQuery.fragments[first] = cachehit && fragment;
            }
          }

          return {
            fragment: fragment,
            cacheable: cacheable
          };
        };

        jQuery.fragments = {};
        jQuery.each({
          appendTo: "append",
          prependTo: "prepend",
          insertBefore: "before",
          insertAfter: "after",
          replaceAll: "replaceWith"
        }, function (name, original) {
          jQuery.fn[name] = function (selector) {
            var elems,
                i = 0,
                ret = [],
                insert = jQuery(selector),
                l = insert.length,
                parent = this.length === 1 && this[0].parentNode;

            if ((parent == null || parent && parent.nodeType === 11 && parent.childNodes.length === 1) && l === 1) {
              insert[original](this[0]);
              return this;
            } else {
              for (; i < l; i++) {
                elems = (i > 0 ? this.clone(true) : this).get();
                jQuery(insert[i])[original](elems);
                ret = ret.concat(elems);
              }

              return this.pushStack(ret, name, insert.selector);
            }
          };
        });

        function getAll(elem) {
          if (typeof elem.getElementsByTagName !== "undefined") {
            return elem.getElementsByTagName("*");
          } else if (typeof elem.querySelectorAll !== "undefined") {
            return elem.querySelectorAll("*");
          } else {
            return [];
          }
        } // Used in clean, fixes the defaultChecked property


        function fixDefaultChecked(elem) {
          if (rcheckableType.test(elem.type)) {
            elem.defaultChecked = elem.checked;
          }
        }

        jQuery.extend({
          clone: function (elem, dataAndEvents, deepDataAndEvents) {
            var srcElements, destElements, i, clone;

            if (jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test("<" + elem.nodeName + ">")) {
              clone = elem.cloneNode(true); // IE<=8 does not properly clone detached, unknown element nodes
            } else {
              fragmentDiv.innerHTML = elem.outerHTML;
              fragmentDiv.removeChild(clone = fragmentDiv.firstChild);
            }

            if ((!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
              // IE copies events bound via attachEvent when using cloneNode.
              // Calling detachEvent on the clone will also remove the events
              // from the original. In order to get around this, we use some
              // proprietary methods to clear the events. Thanks to MooTools
              // guys for this hotness.
              cloneFixAttributes(elem, clone); // Using Sizzle here is crazy slow, so we use getElementsByTagName instead

              srcElements = getAll(elem);
              destElements = getAll(clone); // Weird iteration because IE will replace the length property
              // with an element if you are cloning the body and one of the
              // elements on the page has a name or id of "length"

              for (i = 0; srcElements[i]; ++i) {
                // Ensure that the destination node is not null; Fixes #9587
                if (destElements[i]) {
                  cloneFixAttributes(srcElements[i], destElements[i]);
                }
              }
            } // Copy the events from the original to the clone


            if (dataAndEvents) {
              cloneCopyEvent(elem, clone);

              if (deepDataAndEvents) {
                srcElements = getAll(elem);
                destElements = getAll(clone);

                for (i = 0; srcElements[i]; ++i) {
                  cloneCopyEvent(srcElements[i], destElements[i]);
                }
              }
            }

            srcElements = destElements = null; // Return the cloned set

            return clone;
          },
          clean: function (elems, context, fragment, scripts) {
            var i,
                j,
                elem,
                tag,
                wrap,
                depth,
                div,
                hasBody,
                tbody,
                len,
                handleScript,
                jsTags,
                safe = context === document && safeFragment,
                ret = []; // Ensure that context is a document

            if (!context || typeof context.createDocumentFragment === "undefined") {
              context = document;
            } // Use the already-created safe fragment if context permits


            for (i = 0; (elem = elems[i]) != null; i++) {
              if (typeof elem === "number") {
                elem += "";
              }

              if (!elem) {
                continue;
              } // Convert html string into DOM nodes


              if (typeof elem === "string") {
                if (!rhtml.test(elem)) {
                  elem = context.createTextNode(elem);
                } else {
                  // Ensure a safe container in which to render the html
                  safe = safe || createSafeFragment(context);
                  div = context.createElement("div");
                  safe.appendChild(div); // Fix "XHTML"-style tags in all browsers

                  elem = elem.replace(rxhtmlTag, "<$1></$2>"); // Go to html and back, then peel off extra wrappers

                  tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                  wrap = wrapMap[tag] || wrapMap._default;
                  depth = wrap[0];
                  div.innerHTML = wrap[1] + elem + wrap[2]; // Move to the right depth

                  while (depth--) {
                    div = div.lastChild;
                  } // Remove IE's autoinserted <tbody> from table fragments


                  if (!jQuery.support.tbody) {
                    // String was a <table>, *may* have spurious <tbody>
                    hasBody = rtbody.test(elem);
                    tbody = tag === "table" && !hasBody ? div.firstChild && div.firstChild.childNodes : // String was a bare <thead> or <tfoot>
                    wrap[1] === "<table>" && !hasBody ? div.childNodes : [];

                    for (j = tbody.length - 1; j >= 0; --j) {
                      if (jQuery.nodeName(tbody[j], "tbody") && !tbody[j].childNodes.length) {
                        tbody[j].parentNode.removeChild(tbody[j]);
                      }
                    }
                  } // IE completely kills leading whitespace when innerHTML is used


                  if (!jQuery.support.leadingWhitespace && rleadingWhitespace.test(elem)) {
                    div.insertBefore(context.createTextNode(rleadingWhitespace.exec(elem)[0]), div.firstChild);
                  }

                  elem = div.childNodes; // Take out of fragment container (we need a fresh div each time)

                  div.parentNode.removeChild(div);
                }
              }

              if (elem.nodeType) {
                ret.push(elem);
              } else {
                jQuery.merge(ret, elem);
              }
            } // Fix #11356: Clear elements from safeFragment


            if (div) {
              elem = div = safe = null;
            } // Reset defaultChecked for any radios and checkboxes
            // about to be appended to the DOM in IE 6/7 (#8060)


            if (!jQuery.support.appendChecked) {
              for (i = 0; (elem = ret[i]) != null; i++) {
                if (jQuery.nodeName(elem, "input")) {
                  fixDefaultChecked(elem);
                } else if (typeof elem.getElementsByTagName !== "undefined") {
                  jQuery.grep(elem.getElementsByTagName("input"), fixDefaultChecked);
                }
              }
            } // Append elements to a provided document fragment


            if (fragment) {
              // Special handling of each script element
              handleScript = function (elem) {
                // Check if we consider it executable
                if (!elem.type || rscriptType.test(elem.type)) {
                  // Detach the script and store it in the scripts array (if provided) or the fragment
                  // Return truthy to indicate that it has been handled
                  return scripts ? scripts.push(elem.parentNode ? elem.parentNode.removeChild(elem) : elem) : fragment.appendChild(elem);
                }
              };

              for (i = 0; (elem = ret[i]) != null; i++) {
                // Check if we're done after handling an executable script
                if (!(jQuery.nodeName(elem, "script") && handleScript(elem))) {
                  // Append to fragment and handle embedded scripts
                  fragment.appendChild(elem);

                  if (typeof elem.getElementsByTagName !== "undefined") {
                    // handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
                    jsTags = jQuery.grep(jQuery.merge([], elem.getElementsByTagName("script")), handleScript); // Splice the scripts into ret after their former ancestor and advance our index beyond them

                    ret.splice.apply(ret, [i + 1, 0].concat(jsTags));
                    i += jsTags.length;
                  }
                }
              }
            }

            return ret;
          },
          cleanData: function (elems,
          /* internal */
          acceptData) {
            var data,
                id,
                elem,
                type,
                i = 0,
                internalKey = jQuery.expando,
                cache = jQuery.cache,
                deleteExpando = jQuery.support.deleteExpando,
                special = jQuery.event.special;

            for (; (elem = elems[i]) != null; i++) {
              if (acceptData || jQuery.acceptData(elem)) {
                id = elem[internalKey];
                data = id && cache[id];

                if (data) {
                  if (data.events) {
                    for (type in data.events) {
                      if (special[type]) {
                        jQuery.event.remove(elem, type); // This is a shortcut to avoid jQuery.event.remove's overhead
                      } else {
                        jQuery.removeEvent(elem, type, data.handle);
                      }
                    }
                  } // Remove cache only if it was not already removed by jQuery.event.remove


                  if (cache[id]) {
                    delete cache[id]; // IE does not allow us to delete expando properties from nodes,
                    // nor does it have a removeAttribute function on Document nodes;
                    // we must handle all of these cases

                    if (deleteExpando) {
                      delete elem[internalKey];
                    } else if (elem.removeAttribute) {
                      elem.removeAttribute(internalKey);
                    } else {
                      elem[internalKey] = null;
                    }

                    jQuery.deletedIds.push(id);
                  }
                }
              }
            }
          }
        }); // Limit scope pollution from any deprecated API

        (function () {
          var matched, browser; // Use of jQuery.browser is frowned upon.
          // More details: http://api.jquery.com/jQuery.browser
          // jQuery.uaMatch maintained for back-compat

          jQuery.uaMatch = function (ua) {
            ua = ua.toLowerCase();
            var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
            return {
              browser: match[1] || "",
              version: match[2] || "0"
            };
          };

          matched = jQuery.uaMatch(navigator.userAgent);
          browser = {};

          if (matched.browser) {
            browser[matched.browser] = true;
            browser.version = matched.version;
          } // Chrome is Webkit, but Webkit is also Safari.


          if (browser.chrome) {
            browser.webkit = true;
          } else if (browser.webkit) {
            browser.safari = true;
          }

          jQuery.browser = browser;

          jQuery.sub = function () {
            function jQuerySub(selector, context) {
              return new jQuerySub.fn.init(selector, context);
            }

            jQuery.extend(true, jQuerySub, this);
            jQuerySub.superclass = this;
            jQuerySub.fn = jQuerySub.prototype = this();
            jQuerySub.fn.constructor = jQuerySub;
            jQuerySub.sub = this.sub;

            jQuerySub.fn.init = function init(selector, context) {
              if (context && context instanceof jQuery && !(context instanceof jQuerySub)) {
                context = jQuerySub(context);
              }

              return jQuery.fn.init.call(this, selector, context, rootjQuerySub);
            };

            jQuerySub.fn.init.prototype = jQuerySub.fn;
            var rootjQuerySub = jQuerySub(document);
            return jQuerySub;
          };
        })();

        var curCSS,
            iframe,
            iframeDoc,
            ralpha = /alpha\([^)]*\)/i,
            ropacity = /opacity=([^)]*)/,
            rposition = /^(top|right|bottom|left)$/,
            // swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
        // see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
        rdisplayswap = /^(none|table(?!-c[ea]).+)/,
            rmargin = /^margin/,
            rnumsplit = new RegExp("^(" + core_pnum + ")(.*)$", "i"),
            rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i"),
            rrelNum = new RegExp("^([-+])=(" + core_pnum + ")", "i"),
            elemdisplay = {},
            cssShow = {
          position: "absolute",
          visibility: "hidden",
          display: "block"
        },
            cssNormalTransform = {
          letterSpacing: 0,
          fontWeight: 400
        },
            cssExpand = ["Top", "Right", "Bottom", "Left"],
            cssPrefixes = ["Webkit", "O", "Moz", "ms"],
            eventsToggle = jQuery.fn.toggle; // return a css property mapped to a potentially vendor prefixed property

        function vendorPropName(style, name) {
          // shortcut for names that are not vendor prefixed
          if (name in style) {
            return name;
          } // check for vendor prefixed names


          var capName = name.charAt(0).toUpperCase() + name.slice(1),
              origName = name,
              i = cssPrefixes.length;

          while (i--) {
            name = cssPrefixes[i] + capName;

            if (name in style) {
              return name;
            }
          }

          return origName;
        }

        function isHidden(elem, el) {
          elem = el || elem;
          return jQuery.css(elem, "display") === "none" || !jQuery.contains(elem.ownerDocument, elem);
        }

        function showHide(elements, show) {
          var elem,
              display,
              values = [],
              index = 0,
              length = elements.length;

          for (; index < length; index++) {
            elem = elements[index];

            if (!elem.style) {
              continue;
            }

            values[index] = jQuery._data(elem, "olddisplay");

            if (show) {
              // Reset the inline display of this element to learn if it is
              // being hidden by cascaded rules or not
              if (!values[index] && elem.style.display === "none") {
                elem.style.display = "";
              } // Set elements which have been overridden with display: none
              // in a stylesheet to whatever the default browser style is
              // for such an element


              if (elem.style.display === "" && isHidden(elem)) {
                values[index] = jQuery._data(elem, "olddisplay", css_defaultDisplay(elem.nodeName));
              }
            } else {
              display = curCSS(elem, "display");

              if (!values[index] && display !== "none") {
                jQuery._data(elem, "olddisplay", display);
              }
            }
          } // Set the display of most of the elements in a second loop
          // to avoid the constant reflow


          for (index = 0; index < length; index++) {
            elem = elements[index];

            if (!elem.style) {
              continue;
            }

            if (!show || elem.style.display === "none" || elem.style.display === "") {
              elem.style.display = show ? values[index] || "" : "none";
            }
          }

          return elements;
        }

        jQuery.fn.extend({
          css: function (name, value) {
            return jQuery.access(this, function (elem, name, value) {
              return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
            }, name, value, arguments.length > 1);
          },
          show: function () {
            return showHide(this, true);
          },
          hide: function () {
            return showHide(this);
          },
          toggle: function (state, fn2) {
            var bool = typeof state === "boolean";

            if (jQuery.isFunction(state) && jQuery.isFunction(fn2)) {
              return eventsToggle.apply(this, arguments);
            }

            return this.each(function () {
              if (bool ? state : isHidden(this)) {
                jQuery(this).show();
              } else {
                jQuery(this).hide();
              }
            });
          }
        });
        jQuery.extend({
          // Add in style property hooks for overriding the default
          // behavior of getting and setting a style property
          cssHooks: {
            opacity: {
              get: function (elem, computed) {
                if (computed) {
                  // We should always get a number back from opacity
                  var ret = curCSS(elem, "opacity");
                  return ret === "" ? "1" : ret;
                }
              }
            }
          },
          // Exclude the following css properties to add px
          cssNumber: {
            "fillOpacity": true,
            "fontWeight": true,
            "lineHeight": true,
            "opacity": true,
            "orphans": true,
            "widows": true,
            "zIndex": true,
            "zoom": true
          },
          // Add in properties whose names you wish to fix before
          // setting or getting the value
          cssProps: {
            // normalize float css property
            "float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
          },
          // Get and set the style property on a DOM Node
          style: function (elem, name, value, extra) {
            // Don't set styles on text and comment nodes
            if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
              return;
            } // Make sure that we're working with the right name


            var ret,
                type,
                hooks,
                origName = jQuery.camelCase(name),
                style = elem.style;
            name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName)); // gets hook for the prefixed version
            // followed by the unprefixed version

            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // Check if we're setting a value

            if (value !== undefined) {
              type = typeof value; // convert relative number strings (+= or -=) to relative numbers. #7345

              if (type === "string" && (ret = rrelNum.exec(value))) {
                value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name)); // Fixes bug #9237

                type = "number";
              } // Make sure that NaN and null values aren't set. See: #7116


              if (value == null || type === "number" && isNaN(value)) {
                return;
              } // If a number was passed in, add 'px' to the (except for certain CSS properties)


              if (type === "number" && !jQuery.cssNumber[origName]) {
                value += "px";
              } // If a hook was provided, use that value, otherwise just set the specified value


              if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
                // Wrapped to prevent IE from throwing errors when 'invalid' values are provided
                // Fixes bug #5509
                try {
                  style[name] = value;
                } catch (e) {}
              }
            } else {
              // If a hook was provided get the non-computed value from there
              if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
                return ret;
              } // Otherwise just get the value from the style object


              return style[name];
            }
          },
          css: function (elem, name, numeric, extra) {
            var val,
                num,
                hooks,
                origName = jQuery.camelCase(name); // Make sure that we're working with the right name

            name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName)); // gets hook for the prefixed version
            // followed by the unprefixed version

            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // If a hook was provided get the computed value from there

            if (hooks && "get" in hooks) {
              val = hooks.get(elem, true, extra);
            } // Otherwise, if a way to get the computed value exists, use that


            if (val === undefined) {
              val = curCSS(elem, name);
            } //convert "normal" to computed value


            if (val === "normal" && name in cssNormalTransform) {
              val = cssNormalTransform[name];
            } // Return, converting to number if forced or a qualifier was provided and val looks numeric


            if (numeric || extra !== undefined) {
              num = parseFloat(val);
              return numeric || jQuery.isNumeric(num) ? num || 0 : val;
            }

            return val;
          },
          // A method for quickly swapping in/out CSS properties to get correct calculations
          swap: function (elem, options, callback) {
            var ret,
                name,
                old = {}; // Remember the old values, and insert the new ones

            for (name in options) {
              old[name] = elem.style[name];
              elem.style[name] = options[name];
            }

            ret = callback.call(elem); // Revert the old values

            for (name in options) {
              elem.style[name] = old[name];
            }

            return ret;
          }
        }); // NOTE: To any future maintainer, we've window.getComputedStyle
        // because jsdom on node.js will break without it.

        if (window.getComputedStyle) {
          curCSS = function (elem, name) {
            var ret,
                width,
                minWidth,
                maxWidth,
                computed = window.getComputedStyle(elem, null),
                style = elem.style;

            if (computed) {
              ret = computed[name];

              if (ret === "" && !jQuery.contains(elem.ownerDocument, elem)) {
                ret = jQuery.style(elem, name);
              } // A tribute to the "awesome hack by Dean Edwards"
              // Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
              // Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
              // this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values


              if (rnumnonpx.test(ret) && rmargin.test(name)) {
                width = style.width;
                minWidth = style.minWidth;
                maxWidth = style.maxWidth;
                style.minWidth = style.maxWidth = style.width = ret;
                ret = computed.width;
                style.width = width;
                style.minWidth = minWidth;
                style.maxWidth = maxWidth;
              }
            }

            return ret;
          };
        } else if (document.documentElement.currentStyle) {
          curCSS = function (elem, name) {
            var left,
                rsLeft,
                ret = elem.currentStyle && elem.currentStyle[name],
                style = elem.style; // Avoid setting ret to empty string here
            // so we don't default to auto

            if (ret == null && style && style[name]) {
              ret = style[name];
            } // From the awesome hack by Dean Edwards
            // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
            // If we're not dealing with a regular pixel number
            // but a number that has a weird ending, we need to convert it to pixels
            // but not position css attributes, as those are proportional to the parent element instead
            // and we can't measure the parent instead because it might trigger a "stacking dolls" problem


            if (rnumnonpx.test(ret) && !rposition.test(name)) {
              // Remember the original values
              left = style.left;
              rsLeft = elem.runtimeStyle && elem.runtimeStyle.left; // Put in the new values to get a computed value out

              if (rsLeft) {
                elem.runtimeStyle.left = elem.currentStyle.left;
              }

              style.left = name === "fontSize" ? "1em" : ret;
              ret = style.pixelLeft + "px"; // Revert the changed values

              style.left = left;

              if (rsLeft) {
                elem.runtimeStyle.left = rsLeft;
              }
            }

            return ret === "" ? "auto" : ret;
          };
        }

        function setPositiveNumber(elem, value, subtract) {
          var matches = rnumsplit.exec(value);
          return matches ? Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") : value;
        }

        function augmentWidthOrHeight(elem, name, extra, isBorderBox) {
          var i = extra === (isBorderBox ? "border" : "content") ? // If we already have the right measurement, avoid augmentation
          4 : // Otherwise initialize for horizontal or vertical properties
          name === "width" ? 1 : 0,
              val = 0;

          for (; i < 4; i += 2) {
            // both box models exclude margin, so add it if we want it
            if (extra === "margin") {
              // we use jQuery.css instead of curCSS here
              // because of the reliableMarginRight CSS hook!
              val += jQuery.css(elem, extra + cssExpand[i], true);
            } // From this point on we use curCSS for maximum performance (relevant in animations)


            if (isBorderBox) {
              // border-box includes padding, so remove it if we want content
              if (extra === "content") {
                val -= parseFloat(curCSS(elem, "padding" + cssExpand[i])) || 0;
              } // at this point, extra isn't border nor margin, so remove border


              if (extra !== "margin") {
                val -= parseFloat(curCSS(elem, "border" + cssExpand[i] + "Width")) || 0;
              }
            } else {
              // at this point, extra isn't content, so add padding
              val += parseFloat(curCSS(elem, "padding" + cssExpand[i])) || 0; // at this point, extra isn't content nor padding, so add border

              if (extra !== "padding") {
                val += parseFloat(curCSS(elem, "border" + cssExpand[i] + "Width")) || 0;
              }
            }
          }

          return val;
        }

        function getWidthOrHeight(elem, name, extra) {
          // Start with offset property, which is equivalent to the border-box value
          var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
              valueIsBorderBox = true,
              isBorderBox = jQuery.support.boxSizing && jQuery.css(elem, "boxSizing") === "border-box"; // some non-html elements return undefined for offsetWidth, so check for null/undefined
          // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
          // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668

          if (val <= 0 || val == null) {
            // Fall back to computed then uncomputed css if necessary
            val = curCSS(elem, name);

            if (val < 0 || val == null) {
              val = elem.style[name];
            } // Computed unit is not pixels. Stop here and return.


            if (rnumnonpx.test(val)) {
              return val;
            } // we need the check for style in case a browser which returns unreliable values
            // for getComputedStyle silently falls back to the reliable elem.style


            valueIsBorderBox = isBorderBox && (jQuery.support.boxSizingReliable || val === elem.style[name]); // Normalize "", auto, and prepare for extra

            val = parseFloat(val) || 0;
          } // use the active box-sizing model to add/subtract irrelevant styles


          return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox) + "px";
        } // Try to determine the default display value of an element


        function css_defaultDisplay(nodeName) {
          if (elemdisplay[nodeName]) {
            return elemdisplay[nodeName];
          }

          var elem = jQuery("<" + nodeName + ">").appendTo(document.body),
              display = elem.css("display");
          elem.remove(); // If the simple way fails,
          // get element's real default display by attaching it to a temp iframe

          if (display === "none" || display === "") {
            // Use the already-created iframe if possible
            iframe = document.body.appendChild(iframe || jQuery.extend(document.createElement("iframe"), {
              frameBorder: 0,
              width: 0,
              height: 0
            })); // Create a cacheable copy of the iframe document on first call.
            // IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
            // document to it; WebKit & Firefox won't allow reusing the iframe document.

            if (!iframeDoc || !iframe.createElement) {
              iframeDoc = (iframe.contentWindow || iframe.contentDocument).document;
              iframeDoc.write("<!doctype html><html><body>");
              iframeDoc.close();
            }

            elem = iframeDoc.body.appendChild(iframeDoc.createElement(nodeName));
            display = curCSS(elem, "display");
            document.body.removeChild(iframe);
          } // Store the correct default display


          elemdisplay[nodeName] = display;
          return display;
        }

        jQuery.each(["height", "width"], function (i, name) {
          jQuery.cssHooks[name] = {
            get: function (elem, computed, extra) {
              if (computed) {
                // certain elements can have dimension info if we invisibly show them
                // however, it must have a current display style that would benefit from this
                if (elem.offsetWidth === 0 && rdisplayswap.test(curCSS(elem, "display"))) {
                  return jQuery.swap(elem, cssShow, function () {
                    return getWidthOrHeight(elem, name, extra);
                  });
                } else {
                  return getWidthOrHeight(elem, name, extra);
                }
              }
            },
            set: function (elem, value, extra) {
              return setPositiveNumber(elem, value, extra ? augmentWidthOrHeight(elem, name, extra, jQuery.support.boxSizing && jQuery.css(elem, "boxSizing") === "border-box") : 0);
            }
          };
        });

        if (!jQuery.support.opacity) {
          jQuery.cssHooks.opacity = {
            get: function (elem, computed) {
              // IE uses filters for opacity
              return ropacity.test((computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "") ? 0.01 * parseFloat(RegExp.$1) + "" : computed ? "1" : "";
            },
            set: function (elem, value) {
              var style = elem.style,
                  currentStyle = elem.currentStyle,
                  opacity = jQuery.isNumeric(value) ? "alpha(opacity=" + value * 100 + ")" : "",
                  filter = currentStyle && currentStyle.filter || style.filter || ""; // IE has trouble with opacity if it does not have layout
              // Force it by setting the zoom level

              style.zoom = 1; // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652

              if (value >= 1 && jQuery.trim(filter.replace(ralpha, "")) === "" && style.removeAttribute) {
                // Setting style.filter to null, "" & " " still leave "filter:" in the cssText
                // if "filter:" is present at all, clearType is disabled, we want to avoid this
                // style.removeAttribute is IE Only, but so apparently is this code path...
                style.removeAttribute("filter"); // if there there is no filter style applied in a css rule, we are done

                if (currentStyle && !currentStyle.filter) {
                  return;
                }
              } // otherwise, set new filter values


              style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : filter + " " + opacity;
            }
          };
        } // These hooks cannot be added until DOM ready because the support test
        // for it is not run until after DOM ready


        jQuery(function () {
          if (!jQuery.support.reliableMarginRight) {
            jQuery.cssHooks.marginRight = {
              get: function (elem, computed) {
                // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                // Work around by temporarily setting element display to inline-block
                return jQuery.swap(elem, {
                  "display": "inline-block"
                }, function () {
                  if (computed) {
                    return curCSS(elem, "marginRight");
                  }
                });
              }
            };
          } // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
          // getComputedStyle returns percent when specified for top/left/bottom/right
          // rather than make the css module depend on the offset module, we just check for it here


          if (!jQuery.support.pixelPosition && jQuery.fn.position) {
            jQuery.each(["top", "left"], function (i, prop) {
              jQuery.cssHooks[prop] = {
                get: function (elem, computed) {
                  if (computed) {
                    var ret = curCSS(elem, prop); // if curCSS returns percentage, fallback to offset

                    return rnumnonpx.test(ret) ? jQuery(elem).position()[prop] + "px" : ret;
                  }
                }
              };
            });
          }
        });

        if (jQuery.expr && jQuery.expr.filters) {
          jQuery.expr.filters.hidden = function (elem) {
            return elem.offsetWidth === 0 && elem.offsetHeight === 0 || !jQuery.support.reliableHiddenOffsets && (elem.style && elem.style.display || curCSS(elem, "display")) === "none";
          };

          jQuery.expr.filters.visible = function (elem) {
            return !jQuery.expr.filters.hidden(elem);
          };
        } // These hooks are used by animate to expand properties


        jQuery.each({
          margin: "",
          padding: "",
          border: "Width"
        }, function (prefix, suffix) {
          jQuery.cssHooks[prefix + suffix] = {
            expand: function (value) {
              var i,
                  // assumes a single number if not a string
              parts = typeof value === "string" ? value.split(" ") : [value],
                  expanded = {};

              for (i = 0; i < 4; i++) {
                expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
              }

              return expanded;
            }
          };

          if (!rmargin.test(prefix)) {
            jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
          }
        });
        var r20 = /%20/g,
            rbracket = /\[\]$/,
            rCRLF = /\r?\n/g,
            rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
            rselectTextarea = /^(?:select|textarea)/i;
        jQuery.fn.extend({
          serialize: function () {
            return jQuery.param(this.serializeArray());
          },
          serializeArray: function () {
            return this.map(function () {
              return this.elements ? jQuery.makeArray(this.elements) : this;
            }).filter(function () {
              return this.name && !this.disabled && (this.checked || rselectTextarea.test(this.nodeName) || rinput.test(this.type));
            }).map(function (i, elem) {
              var val = jQuery(this).val();
              return val == null ? null : jQuery.isArray(val) ? jQuery.map(val, function (val, i) {
                return {
                  name: elem.name,
                  value: val.replace(rCRLF, "\r\n")
                };
              }) : {
                name: elem.name,
                value: val.replace(rCRLF, "\r\n")
              };
            }).get();
          }
        }); //Serialize an array of form elements or a set of
        //key/values into a query string

        jQuery.param = function (a, traditional) {
          var prefix,
              s = [],
              add = function (key, value) {
            // If value is a function, invoke it and return its value
            value = jQuery.isFunction(value) ? value() : value == null ? "" : value;
            s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
          }; // Set traditional to true for jQuery <= 1.3.2 behavior.


          if (traditional === undefined) {
            traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
          } // If an array was passed in, assume that it is an array of form elements.


          if (jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
            // Serialize the form elements
            jQuery.each(a, function () {
              add(this.name, this.value);
            });
          } else {
            // If traditional, encode the "old" way (the way 1.3.2 or older
            // did it), otherwise encode params recursively.
            for (prefix in a) {
              buildParams(prefix, a[prefix], traditional, add);
            }
          } // Return the resulting serialization


          return s.join("&").replace(r20, "+");
        };

        function buildParams(prefix, obj, traditional, add) {
          var name;

          if (jQuery.isArray(obj)) {
            // Serialize array item.
            jQuery.each(obj, function (i, v) {
              if (traditional || rbracket.test(prefix)) {
                // Treat each array item as a scalar.
                add(prefix, v);
              } else {
                // If array item is non-scalar (array or object), encode its
                // numeric index to resolve deserialization ambiguity issues.
                // Note that rack (as of 1.0.0) can't currently deserialize
                // nested arrays properly, and attempting to do so may cause
                // a server error. Possible fixes are to modify rack's
                // deserialization algorithm or to provide an option or flag
                // to force array serialization to be shallow.
                buildParams(prefix + "[" + (typeof v === "object" ? i : "") + "]", v, traditional, add);
              }
            });
          } else if (!traditional && jQuery.type(obj) === "object") {
            // Serialize object item.
            for (name in obj) {
              buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
            }
          } else {
            // Serialize scalar item.
            add(prefix, obj);
          }
        }

        var // Document location
        ajaxLocation,
            // Document location segments
        ajaxLocParts,
            rhash = /#.*$/,
            rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
            // IE leaves an \r character at EOL
        // #7653, #8125, #8152: local protocol detection
        rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
            rnoContent = /^(?:GET|HEAD)$/,
            rprotocol = /^\/\//,
            rquery = /\?/,
            rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            rts = /([?&])_=[^&]*/,
            rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
            // Keep a copy of the old load method
        _load = jQuery.fn.load,

        /* Prefilters
         * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
         * 2) These are called:
         *    - BEFORE asking for a transport
         *    - AFTER param serialization (s.data is a string if s.processData is true)
         * 3) key is the dataType
         * 4) the catchall symbol "*" can be used
         * 5) execution will start with transport dataType and THEN continue down to "*" if needed
         */
        prefilters = {},

        /* Transports bindings
         * 1) key is the dataType
         * 2) the catchall symbol "*" can be used
         * 3) selection will start with transport dataType and THEN go to "*" if needed
         */
        transports = {},
            // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
        allTypes = ["*/"] + ["*"]; // #8138, IE may throw an exception when accessing
        // a field from window.location if document.domain has been set

        try {
          ajaxLocation = location.href;
        } catch (e) {
          // Use the href attribute of an A element
          // since IE will modify it given document.location
          ajaxLocation = document.createElement("a");
          ajaxLocation.href = "";
          ajaxLocation = ajaxLocation.href;
        } // Segment location into parts


        ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []; // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport

        function addToPrefiltersOrTransports(structure) {
          // dataTypeExpression is optional and defaults to "*"
          return function (dataTypeExpression, func) {
            if (typeof dataTypeExpression !== "string") {
              func = dataTypeExpression;
              dataTypeExpression = "*";
            }

            var dataType,
                list,
                placeBefore,
                dataTypes = dataTypeExpression.toLowerCase().split(core_rspace),
                i = 0,
                length = dataTypes.length;

            if (jQuery.isFunction(func)) {
              // For each dataType in the dataTypeExpression
              for (; i < length; i++) {
                dataType = dataTypes[i]; // We control if we're asked to add before
                // any existing element

                placeBefore = /^\+/.test(dataType);

                if (placeBefore) {
                  dataType = dataType.substr(1) || "*";
                }

                list = structure[dataType] = structure[dataType] || []; // then we add to the structure accordingly

                list[placeBefore ? "unshift" : "push"](func);
              }
            }
          };
        } // Base inspection function for prefilters and transports


        function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, dataType
        /* internal */
        , inspected
        /* internal */
        ) {
          dataType = dataType || options.dataTypes[0];
          inspected = inspected || {};
          inspected[dataType] = true;
          var selection,
              list = structure[dataType],
              i = 0,
              length = list ? list.length : 0,
              executeOnly = structure === prefilters;

          for (; i < length && (executeOnly || !selection); i++) {
            selection = list[i](options, originalOptions, jqXHR); // If we got redirected to another dataType
            // we try there if executing only and not done already

            if (typeof selection === "string") {
              if (!executeOnly || inspected[selection]) {
                selection = undefined;
              } else {
                options.dataTypes.unshift(selection);
                selection = inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, selection, inspected);
              }
            }
          } // If we're only executing or nothing was selected
          // we try the catchall dataType if not done already


          if ((executeOnly || !selection) && !inspected["*"]) {
            selection = inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, "*", inspected);
          } // unnecessary when only executing (prefilters)
          // but it'll be ignored by the caller in that case


          return selection;
        } // A special extend for ajax options
        // that takes "flat" options (not to be deep extended)
        // Fixes #9887


        function ajaxExtend(target, src) {
          var key,
              deep,
              flatOptions = jQuery.ajaxSettings.flatOptions || {};

          for (key in src) {
            if (src[key] !== undefined) {
              (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
            }
          }

          if (deep) {
            jQuery.extend(true, target, deep);
          }
        }

        jQuery.fn.load = function (url, params, callback) {
          if (typeof url !== "string" && _load) {
            return _load.apply(this, arguments);
          } // Don't do a request if no elements are being requested


          if (!this.length) {
            return this;
          }

          var selector,
              type,
              response,
              self = this,
              off = url.indexOf(" ");

          if (off >= 0) {
            selector = url.slice(off, url.length);
            url = url.slice(0, off);
          } // If it's a function


          if (jQuery.isFunction(params)) {
            // We assume that it's the callback
            callback = params;
            params = undefined; // Otherwise, build a param string
          } else if (params && typeof params === "object") {
            type = "POST";
          } // Request the remote document


          jQuery.ajax({
            url: url,
            // if "type" variable is undefined, then "GET" method will be used
            type: type,
            dataType: "html",
            data: params,
            complete: function (jqXHR, status) {
              if (callback) {
                self.each(callback, response || [jqXHR.responseText, status, jqXHR]);
              }
            }
          }).done(function (responseText) {
            // Save response for use in complete callback
            response = arguments; // See if a selector was specified

            self.html(selector ? // Create a dummy div to hold the results
            jQuery("<div>") // inject the contents of the document in, removing the scripts
            // to avoid any 'Permission Denied' errors in IE
            .append(responseText.replace(rscript, "")) // Locate the specified elements
            .find(selector) : // If not, just inject the full result
            responseText);
          });
          return this;
        }; // Attach a bunch of functions for handling common AJAX events


        jQuery.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function (i, o) {
          jQuery.fn[o] = function (f) {
            return this.on(o, f);
          };
        });
        jQuery.each(["get", "post"], function (i, method) {
          jQuery[method] = function (url, data, callback, type) {
            // shift arguments if data argument was omitted
            if (jQuery.isFunction(data)) {
              type = type || callback;
              callback = data;
              data = undefined;
            }

            return jQuery.ajax({
              type: method,
              url: url,
              data: data,
              success: callback,
              dataType: type
            });
          };
        });
        jQuery.extend({
          getScript: function (url, callback) {
            return jQuery.get(url, undefined, callback, "script");
          },
          getJSON: function (url, data, callback) {
            return jQuery.get(url, data, callback, "json");
          },
          // Creates a full fledged settings object into target
          // with both ajaxSettings and settings fields.
          // If target is omitted, writes into ajaxSettings.
          ajaxSetup: function (target, settings) {
            if (settings) {
              // Building a settings object
              ajaxExtend(target, jQuery.ajaxSettings);
            } else {
              // Extending ajaxSettings
              settings = target;
              target = jQuery.ajaxSettings;
            }

            ajaxExtend(target, settings);
            return target;
          },
          ajaxSettings: {
            url: ajaxLocation,
            isLocal: rlocalProtocol.test(ajaxLocParts[1]),
            global: true,
            type: "GET",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            processData: true,
            async: true,

            /*
            timeout: 0,
            data: null,
            dataType: null,
            username: null,
            password: null,
            cache: null,
            throws: false,
            traditional: false,
            headers: {},
            */
            accepts: {
              xml: "application/xml, text/xml",
              html: "text/html",
              text: "text/plain",
              json: "application/json, text/javascript",
              "*": allTypes
            },
            contents: {
              xml: /xml/,
              html: /html/,
              json: /json/
            },
            responseFields: {
              xml: "responseXML",
              text: "responseText"
            },
            // List of data converters
            // 1) key format is "source_type destination_type" (a single space in-between)
            // 2) the catchall symbol "*" can be used for source_type
            converters: {
              // Convert anything to text
              "* text": window.String,
              // Text to html (true = no transformation)
              "text html": true,
              // Evaluate text as a json expression
              "text json": jQuery.parseJSON,
              // Parse text as xml
              "text xml": jQuery.parseXML
            },
            // For options that shouldn't be deep extended:
            // you can add your own custom options here if
            // and when you create one that shouldn't be
            // deep extended (see ajaxExtend)
            flatOptions: {
              context: true,
              url: true
            }
          },
          ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
          ajaxTransport: addToPrefiltersOrTransports(transports),
          // Main method
          ajax: function (url, options) {
            // If url is an object, simulate pre-1.5 signature
            if (typeof url === "object") {
              options = url;
              url = undefined;
            } // Force options to be an object


            options = options || {};
            var // ifModified key
            ifModifiedKey,
                // Response headers
            responseHeadersString,
                responseHeaders,
                // transport
            transport,
                // timeout handle
            timeoutTimer,
                // Cross-domain detection vars
            parts,
                // To know if global events are to be dispatched
            fireGlobals,
                // Loop variable
            i,
                // Create the final options object
            s = jQuery.ajaxSetup({}, options),
                // Callbacks context
            callbackContext = s.context || s,
                // Context for global events
            // It's the callbackContext if one was provided in the options
            // and if it's a DOM node or a jQuery collection
            globalEventContext = callbackContext !== s && (callbackContext.nodeType || callbackContext instanceof jQuery) ? jQuery(callbackContext) : jQuery.event,
                // Deferreds
            deferred = jQuery.Deferred(),
                completeDeferred = jQuery.Callbacks("once memory"),
                // Status-dependent callbacks
            statusCode = s.statusCode || {},
                // Headers (they are sent all at once)
            requestHeaders = {},
                requestHeadersNames = {},
                // The jqXHR state
            state = 0,
                // Default abort message
            strAbort = "canceled",
                // Fake xhr
            jqXHR = {
              readyState: 0,
              // Caches the header
              setRequestHeader: function (name, value) {
                if (!state) {
                  var lname = name.toLowerCase();
                  name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;
                  requestHeaders[name] = value;
                }

                return this;
              },
              // Raw string
              getAllResponseHeaders: function () {
                return state === 2 ? responseHeadersString : null;
              },
              // Builds headers hashtable if needed
              getResponseHeader: function (key) {
                var match;

                if (state === 2) {
                  if (!responseHeaders) {
                    responseHeaders = {};

                    while (match = rheaders.exec(responseHeadersString)) {
                      responseHeaders[match[1].toLowerCase()] = match[2];
                    }
                  }

                  match = responseHeaders[key.toLowerCase()];
                }

                return match === undefined ? null : match;
              },
              // Overrides response content-type header
              overrideMimeType: function (type) {
                if (!state) {
                  s.mimeType = type;
                }

                return this;
              },
              // Cancel the request
              abort: function (statusText) {
                statusText = statusText || strAbort;

                if (transport) {
                  transport.abort(statusText);
                }

                done(0, statusText);
                return this;
              }
            }; // Callback for when everything is done
            // It is defined here because jslint complains if it is declared
            // at the end of the function (which would be more logical and readable)

            function done(status, nativeStatusText, responses, headers) {
              var isSuccess,
                  success,
                  error,
                  response,
                  modified,
                  statusText = nativeStatusText; // Called once

              if (state === 2) {
                return;
              } // State is "done" now


              state = 2; // Clear timeout if it exists

              if (timeoutTimer) {
                clearTimeout(timeoutTimer);
              } // Dereference transport for early garbage collection
              // (no matter how long the jqXHR object will be used)


              transport = undefined; // Cache response headers

              responseHeadersString = headers || ""; // Set readyState

              jqXHR.readyState = status > 0 ? 4 : 0; // Get response data

              if (responses) {
                response = ajaxHandleResponses(s, jqXHR, responses);
              } // If successful, handle type chaining


              if (status >= 200 && status < 300 || status === 304) {
                // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
                if (s.ifModified) {
                  modified = jqXHR.getResponseHeader("Last-Modified");

                  if (modified) {
                    jQuery.lastModified[ifModifiedKey] = modified;
                  }

                  modified = jqXHR.getResponseHeader("Etag");

                  if (modified) {
                    jQuery.etag[ifModifiedKey] = modified;
                  }
                } // If not modified


                if (status === 304) {
                  statusText = "notmodified";
                  isSuccess = true; // If we have data
                } else {
                  isSuccess = ajaxConvert(s, response);
                  statusText = isSuccess.state;
                  success = isSuccess.data;
                  error = isSuccess.error;
                  isSuccess = !error;
                }
              } else {
                // We extract error from statusText
                // then normalize statusText and status for non-aborts
                error = statusText;

                if (!statusText || status) {
                  statusText = "error";

                  if (status < 0) {
                    status = 0;
                  }
                }
              } // Set data for the fake xhr object


              jqXHR.status = status;
              jqXHR.statusText = "" + (nativeStatusText || statusText); // Success/Error

              if (isSuccess) {
                deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
              } else {
                deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
              } // Status-dependent callbacks


              jqXHR.statusCode(statusCode);
              statusCode = undefined;

              if (fireGlobals) {
                globalEventContext.trigger("ajax" + (isSuccess ? "Success" : "Error"), [jqXHR, s, isSuccess ? success : error]);
              } // Complete


              completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);

              if (fireGlobals) {
                globalEventContext.trigger("ajaxComplete", [jqXHR, s]); // Handle the global AJAX counter

                if (! --jQuery.active) {
                  jQuery.event.trigger("ajaxStop");
                }
              }
            } // Attach deferreds


            deferred.promise(jqXHR);
            jqXHR.success = jqXHR.done;
            jqXHR.error = jqXHR.fail;
            jqXHR.complete = completeDeferred.add; // Status-dependent callbacks

            jqXHR.statusCode = function (map) {
              if (map) {
                var tmp;

                if (state < 2) {
                  for (tmp in map) {
                    statusCode[tmp] = [statusCode[tmp], map[tmp]];
                  }
                } else {
                  tmp = map[jqXHR.status];
                  jqXHR.always(tmp);
                }
              }

              return this;
            }; // Remove hash character (#7531: and string promotion)
            // Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
            // We also use the url parameter if available


            s.url = ((url || s.url) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//"); // Extract dataTypes list

            s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().split(core_rspace); // Determine if a cross-domain request is in order

            if (s.crossDomain == null) {
              parts = rurl.exec(s.url.toLowerCase());
              s.crossDomain = !!(parts && (parts[1] != ajaxLocParts[1] || parts[2] != ajaxLocParts[2] || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))));
            } // Convert data if not already a string


            if (s.data && s.processData && typeof s.data !== "string") {
              s.data = jQuery.param(s.data, s.traditional);
            } // Apply prefilters


            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR); // If request was aborted inside a prefilter, stop there

            if (state === 2) {
              return jqXHR;
            } // We can fire global events as of now if asked to


            fireGlobals = s.global; // Uppercase the type

            s.type = s.type.toUpperCase(); // Determine if request has content

            s.hasContent = !rnoContent.test(s.type); // Watch for a new set of requests

            if (fireGlobals && jQuery.active++ === 0) {
              jQuery.event.trigger("ajaxStart");
            } // More options handling for requests with no content


            if (!s.hasContent) {
              // If data is available, append data to url
              if (s.data) {
                s.url += (rquery.test(s.url) ? "&" : "?") + s.data; // #9682: remove data so that it's not used in an eventual retry

                delete s.data;
              } // Get ifModifiedKey before adding the anti-cache parameter


              ifModifiedKey = s.url; // Add anti-cache in url if needed

              if (s.cache === false) {
                var ts = jQuery.now(),
                    // try replacing _= if it is there
                ret = s.url.replace(rts, "$1_=" + ts); // if nothing was replaced, add timestamp to the end

                s.url = ret + (ret === s.url ? (rquery.test(s.url) ? "&" : "?") + "_=" + ts : "");
              }
            } // Set the correct header, if data is being sent


            if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
              jqXHR.setRequestHeader("Content-Type", s.contentType);
            } // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.


            if (s.ifModified) {
              ifModifiedKey = ifModifiedKey || s.url;

              if (jQuery.lastModified[ifModifiedKey]) {
                jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[ifModifiedKey]);
              }

              if (jQuery.etag[ifModifiedKey]) {
                jqXHR.setRequestHeader("If-None-Match", jQuery.etag[ifModifiedKey]);
              }
            } // Set the Accepts header for the server, depending on the dataType


            jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]); // Check for headers option

            for (i in s.headers) {
              jqXHR.setRequestHeader(i, s.headers[i]);
            } // Allow custom headers/mimetypes and early abort


            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || state === 2)) {
              // Abort if not done already and return
              return jqXHR.abort();
            } // aborting is no longer a cancellation


            strAbort = "abort"; // Install callbacks on deferreds

            for (i in {
              success: 1,
              error: 1,
              complete: 1
            }) {
              jqXHR[i](s[i]);
            } // Get transport


            transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR); // If no transport, we auto-abort

            if (!transport) {
              done(-1, "No Transport");
            } else {
              jqXHR.readyState = 1; // Send global event

              if (fireGlobals) {
                globalEventContext.trigger("ajaxSend", [jqXHR, s]);
              } // Timeout


              if (s.async && s.timeout > 0) {
                timeoutTimer = setTimeout(function () {
                  jqXHR.abort("timeout");
                }, s.timeout);
              }

              try {
                state = 1;
                transport.send(requestHeaders, done);
              } catch (e) {
                // Propagate exception as error if not done
                if (state < 2) {
                  done(-1, e); // Simply rethrow otherwise
                } else {
                  throw e;
                }
              }
            }

            return jqXHR;
          },
          // Counter for holding the number of active queries
          active: 0,
          // Last-Modified header cache for next request
          lastModified: {},
          etag: {}
        });
        /* Handles responses to an ajax request:
         * - sets all responseXXX fields accordingly
         * - finds the right dataType (mediates between content-type and expected dataType)
         * - returns the corresponding response
         */

        function ajaxHandleResponses(s, jqXHR, responses) {
          var ct,
              type,
              finalDataType,
              firstDataType,
              contents = s.contents,
              dataTypes = s.dataTypes,
              responseFields = s.responseFields; // Fill responseXXX fields

          for (type in responseFields) {
            if (type in responses) {
              jqXHR[responseFields[type]] = responses[type];
            }
          } // Remove auto dataType and get content-type in the process


          while (dataTypes[0] === "*") {
            dataTypes.shift();

            if (ct === undefined) {
              ct = s.mimeType || jqXHR.getResponseHeader("content-type");
            }
          } // Check if we're dealing with a known content-type


          if (ct) {
            for (type in contents) {
              if (contents[type] && contents[type].test(ct)) {
                dataTypes.unshift(type);
                break;
              }
            }
          } // Check to see if we have a response for the expected dataType


          if (dataTypes[0] in responses) {
            finalDataType = dataTypes[0];
          } else {
            // Try convertible dataTypes
            for (type in responses) {
              if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                finalDataType = type;
                break;
              }

              if (!firstDataType) {
                firstDataType = type;
              }
            } // Or just use first one


            finalDataType = finalDataType || firstDataType;
          } // If we found a dataType
          // We add the dataType to the list if needed
          // and return the corresponding response


          if (finalDataType) {
            if (finalDataType !== dataTypes[0]) {
              dataTypes.unshift(finalDataType);
            }

            return responses[finalDataType];
          }
        } // Chain conversions given the request and the original response


        function ajaxConvert(s, response) {
          var conv,
              conv2,
              current,
              tmp,
              // Work with a copy of dataTypes in case we need to modify it for conversion
          dataTypes = s.dataTypes.slice(),
              prev = dataTypes[0],
              converters = {},
              i = 0; // Apply the dataFilter if provided

          if (s.dataFilter) {
            response = s.dataFilter(response, s.dataType);
          } // Create converters map with lowercased keys


          if (dataTypes[1]) {
            for (conv in s.converters) {
              converters[conv.toLowerCase()] = s.converters[conv];
            }
          } // Convert to each sequential dataType, tolerating list modification


          for (; current = dataTypes[++i];) {
            // There's only work to do if current dataType is non-auto
            if (current !== "*") {
              // Convert response if prev dataType is non-auto and differs from current
              if (prev !== "*" && prev !== current) {
                // Seek a direct converter
                conv = converters[prev + " " + current] || converters["* " + current]; // If none found, seek a pair

                if (!conv) {
                  for (conv2 in converters) {
                    // If conv2 outputs current
                    tmp = conv2.split(" ");

                    if (tmp[1] === current) {
                      // If prev can be converted to accepted input
                      conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];

                      if (conv) {
                        // Condense equivalence converters
                        if (conv === true) {
                          conv = converters[conv2]; // Otherwise, insert the intermediate dataType
                        } else if (converters[conv2] !== true) {
                          current = tmp[0];
                          dataTypes.splice(i--, 0, current);
                        }

                        break;
                      }
                    }
                  }
                } // Apply converter (if not an equivalence)


                if (conv !== true) {
                  // Unless errors are allowed to bubble, catch and return them
                  if (conv && s["throws"]) {
                    response = conv(response);
                  } else {
                    try {
                      response = conv(response);
                    } catch (e) {
                      return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                      };
                    }
                  }
                }
              } // Update prev for next iteration


              prev = current;
            }
          }

          return {
            state: "success",
            data: response
          };
        }

        var oldCallbacks = [],
            rquestion = /\?/,
            rjsonp = /(=)\?(?=&|$)|\?\?/,
            nonce = jQuery.now(); // Default jsonp settings

        jQuery.ajaxSetup({
          jsonp: "callback",
          jsonpCallback: function () {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
            this[callback] = true;
            return callback;
          }
        }); // Detect, normalize options and install callbacks for jsonp requests

        jQuery.ajaxPrefilter("json jsonp", function (s, originalSettings, jqXHR) {
          var callbackName,
              overwritten,
              responseContainer,
              data = s.data,
              url = s.url,
              hasCallback = s.jsonp !== false,
              replaceInUrl = hasCallback && rjsonp.test(url),
              replaceInData = hasCallback && !replaceInUrl && typeof data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(data); // Handle iff the expected data type is "jsonp" or we have a parameter to set

          if (s.dataTypes[0] === "jsonp" || replaceInUrl || replaceInData) {
            // Get callback name, remembering preexisting value associated with it
            callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
            overwritten = window[callbackName]; // Insert callback into url or form data

            if (replaceInUrl) {
              s.url = url.replace(rjsonp, "$1" + callbackName);
            } else if (replaceInData) {
              s.data = data.replace(rjsonp, "$1" + callbackName);
            } else if (hasCallback) {
              s.url += (rquestion.test(url) ? "&" : "?") + s.jsonp + "=" + callbackName;
            } // Use data converter to retrieve json after script execution


            s.converters["script json"] = function () {
              if (!responseContainer) {
                jQuery.error(callbackName + " was not called");
              }

              return responseContainer[0];
            }; // force json dataType


            s.dataTypes[0] = "json"; // Install callback

            window[callbackName] = function () {
              responseContainer = arguments;
            }; // Clean-up function (fires after converters)


            jqXHR.always(function () {
              // Restore preexisting value
              window[callbackName] = overwritten; // Save back as free

              if (s[callbackName]) {
                // make sure that re-using the options doesn't screw things around
                s.jsonpCallback = originalSettings.jsonpCallback; // save the callback name for future use

                oldCallbacks.push(callbackName);
              } // Call if it was a function and we have a response


              if (responseContainer && jQuery.isFunction(overwritten)) {
                overwritten(responseContainer[0]);
              }

              responseContainer = overwritten = undefined;
            }); // Delegate to script

            return "script";
          }
        }); // Install script dataType

        jQuery.ajaxSetup({
          accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
          },
          contents: {
            script: /javascript|ecmascript/
          },
          converters: {
            "text script": function (text) {
              jQuery.globalEval(text);
              return text;
            }
          }
        }); // Handle cache's special case and global

        jQuery.ajaxPrefilter("script", function (s) {
          if (s.cache === undefined) {
            s.cache = false;
          }

          if (s.crossDomain) {
            s.type = "GET";
            s.global = false;
          }
        }); // Bind script tag hack transport

        jQuery.ajaxTransport("script", function (s) {
          // This transport only deals with cross domain requests
          if (s.crossDomain) {
            var script,
                head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            return {
              send: function (_, callback) {
                script = document.createElement("script");
                script.async = "async";

                if (s.scriptCharset) {
                  script.charset = s.scriptCharset;
                }

                script.src = s.url; // Attach handlers for all browsers

                script.onload = script.onreadystatechange = function (_, isAbort) {
                  if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
                    // Handle memory leak in IE
                    script.onload = script.onreadystatechange = null; // Remove the script

                    if (head && script.parentNode) {
                      head.removeChild(script);
                    } // Dereference the script


                    script = undefined; // Callback if not abort

                    if (!isAbort) {
                      callback(200, "success");
                    }
                  }
                }; // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
                // This arises when a base node is used (#2709 and #4378).


                head.insertBefore(script, head.firstChild);
              },
              abort: function () {
                if (script) {
                  script.onload(0, 1);
                }
              }
            };
          }
        });
        var xhrCallbacks,
            // #5280: Internet Explorer will keep connections alive if we don't abort on unload
        xhrOnUnloadAbort = window.ActiveXObject ? function () {
          // Abort all pending requests
          for (var key in xhrCallbacks) {
            xhrCallbacks[key](0, 1);
          }
        } : false,
            xhrId = 0; // Functions to create xhrs

        function createStandardXHR() {
          try {
            return new window.XMLHttpRequest();
          } catch (e) {}
        }

        function createActiveXHR() {
          try {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
          } catch (e) {}
        } // Create the request object
        // (This is still attached to ajaxSettings for backward compatibility)


        jQuery.ajaxSettings.xhr = window.ActiveXObject ?
        /* Microsoft failed to properly
         * implement the XMLHttpRequest in IE7 (can't request local files),
         * so we use the ActiveXObject when it is available
         * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
         * we need a fallback.
         */
        function () {
          return !this.isLocal && createStandardXHR() || createActiveXHR();
        } : // For all other browsers, use the standard XMLHttpRequest object
        createStandardXHR; // Determine support properties

        (function (xhr) {
          jQuery.extend(jQuery.support, {
            ajax: !!xhr,
            cors: !!xhr && "withCredentials" in xhr
          });
        })(jQuery.ajaxSettings.xhr()); // Create transport if the browser can provide an xhr


        if (jQuery.support.ajax) {
          jQuery.ajaxTransport(function (s) {
            // Cross domain only allowed if supported through XMLHttpRequest
            if (!s.crossDomain || jQuery.support.cors) {
              var callback;
              return {
                send: function (headers, complete) {
                  // Get a new xhr
                  var handle,
                      i,
                      xhr = s.xhr(); // Open the socket
                  // Passing null username, generates a login popup on Opera (#2865)

                  if (s.username) {
                    xhr.open(s.type, s.url, s.async, s.username, s.password);
                  } else {
                    xhr.open(s.type, s.url, s.async);
                  } // Apply custom fields if provided


                  if (s.xhrFields) {
                    for (i in s.xhrFields) {
                      xhr[i] = s.xhrFields[i];
                    }
                  } // Override mime type if needed


                  if (s.mimeType && xhr.overrideMimeType) {
                    xhr.overrideMimeType(s.mimeType);
                  } // X-Requested-With header
                  // For cross-domain requests, seeing as conditions for a preflight are
                  // akin to a jigsaw puzzle, we simply never set it to be sure.
                  // (it can always be set on a per-request basis or even using ajaxSetup)
                  // For same-domain requests, won't change header if already provided.


                  if (!s.crossDomain && !headers["X-Requested-With"]) {
                    headers["X-Requested-With"] = "XMLHttpRequest";
                  } // Need an extra try/catch for cross domain requests in Firefox 3


                  try {
                    for (i in headers) {
                      xhr.setRequestHeader(i, headers[i]);
                    }
                  } catch (_) {} // Do send the request
                  // This may raise an exception which is actually
                  // handled in jQuery.ajax (so no try/catch here)


                  xhr.send(s.hasContent && s.data || null); // Listener

                  callback = function (_, isAbort) {
                    var status, statusText, responseHeaders, responses, xml; // Firefox throws exceptions when accessing properties
                    // of an xhr when a network error occurred
                    // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)

                    try {
                      // Was never called and is aborted or complete
                      if (callback && (isAbort || xhr.readyState === 4)) {
                        // Only called once
                        callback = undefined; // Do not keep as active anymore

                        if (handle) {
                          xhr.onreadystatechange = jQuery.noop;

                          if (xhrOnUnloadAbort) {
                            delete xhrCallbacks[handle];
                          }
                        } // If it's an abort


                        if (isAbort) {
                          // Abort it manually if needed
                          if (xhr.readyState !== 4) {
                            xhr.abort();
                          }
                        } else {
                          status = xhr.status;
                          responseHeaders = xhr.getAllResponseHeaders();
                          responses = {};
                          xml = xhr.responseXML; // Construct response list

                          if (xml && xml.documentElement
                          /* #4958 */
                          ) {
                              responses.xml = xml;
                            } // When requesting binary data, IE6-9 will throw an exception
                          // on any attempt to access responseText (#11426)


                          try {
                            responses.text = xhr.responseText;
                          } catch (_) {} // Firefox throws an exception when accessing
                          // statusText for faulty cross-domain requests


                          try {
                            statusText = xhr.statusText;
                          } catch (e) {
                            // We normalize with Webkit giving an empty statusText
                            statusText = "";
                          } // Filter status for non standard behaviors
                          // If the request is local and we have data: assume a success
                          // (success with no data won't get notified, that's the best we
                          // can do given current implementations)


                          if (!status && s.isLocal && !s.crossDomain) {
                            status = responses.text ? 200 : 404; // IE - #1450: sometimes returns 1223 when it should be 204
                          } else if (status === 1223) {
                            status = 204;
                          }
                        }
                      }
                    } catch (firefoxAccessException) {
                      if (!isAbort) {
                        complete(-1, firefoxAccessException);
                      }
                    } // Call complete if needed


                    if (responses) {
                      complete(status, statusText, responses, responseHeaders);
                    }
                  };

                  if (!s.async) {
                    // if we're in sync mode we fire the callback
                    callback();
                  } else if (xhr.readyState === 4) {
                    // (IE6 & IE7) if it's in cache and has been
                    // retrieved directly we need to fire the callback
                    setTimeout(callback, 0);
                  } else {
                    handle = ++xhrId;

                    if (xhrOnUnloadAbort) {
                      // Create the active xhrs callbacks list if needed
                      // and attach the unload handler
                      if (!xhrCallbacks) {
                        xhrCallbacks = {};
                        jQuery(window).unload(xhrOnUnloadAbort);
                      } // Add to list of active xhrs callbacks


                      xhrCallbacks[handle] = callback;
                    }

                    xhr.onreadystatechange = callback;
                  }
                },
                abort: function () {
                  if (callback) {
                    callback(0, 1);
                  }
                }
              };
            }
          });
        }

        var fxNow,
            timerId,
            rfxtypes = /^(?:toggle|show|hide)$/,
            rfxnum = new RegExp("^(?:([-+])=|)(" + core_pnum + ")([a-z%]*)$", "i"),
            rrun = /queueHooks$/,
            animationPrefilters = [defaultPrefilter],
            tweeners = {
          "*": [function (prop, value) {
            var end,
                unit,
                prevScale,
                tween = this.createTween(prop, value),
                parts = rfxnum.exec(value),
                target = tween.cur(),
                start = +target || 0,
                scale = 1;

            if (parts) {
              end = +parts[2];
              unit = parts[3] || (jQuery.cssNumber[prop] ? "" : "px"); // We need to compute starting value

              if (unit !== "px" && start) {
                // Iteratively approximate from a nonzero starting point
                // Prefer the current property, because this process will be trivial if it uses the same units
                // Fallback to end or a simple constant
                start = jQuery.css(tween.elem, prop, true) || end || 1;

                do {
                  // If previous iteration zeroed out, double until we get *something*
                  // Use a string for doubling factor so we don't accidentally see scale as unchanged below
                  prevScale = scale = scale || ".5"; // Adjust and apply

                  start = start / scale;
                  jQuery.style(tween.elem, prop, start + unit); // Update scale, tolerating zeroes from tween.cur()

                  scale = tween.cur() / target; // Stop looping if we've hit the mark or scale is unchanged
                } while (scale !== 1 && scale !== prevScale);
              }

              tween.unit = unit;
              tween.start = start; // If a +=/-= token was provided, we're doing a relative animation

              tween.end = parts[1] ? start + (parts[1] + 1) * end : end;
            }

            return tween;
          }]
        }; // Animations created synchronously will run synchronously

        function createFxNow() {
          setTimeout(function () {
            fxNow = undefined;
          }, 0);
          return fxNow = jQuery.now();
        }

        function createTweens(animation, props) {
          jQuery.each(props, function (prop, value) {
            var collection = (tweeners[prop] || []).concat(tweeners["*"]),
                index = 0,
                length = collection.length;

            for (; index < length; index++) {
              if (collection[index].call(animation, prop, value)) {
                // we're done with this property
                return;
              }
            }
          });
        }

        function Animation(elem, properties, options) {
          var result,
              index = 0,
              tweenerIndex = 0,
              length = animationPrefilters.length,
              deferred = jQuery.Deferred().always(function () {
            // don't match elem in the :animated selector
            delete tick.elem;
          }),
              tick = function () {
            var currentTime = fxNow || createFxNow(),
                remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
                percent = 1 - (remaining / animation.duration || 0),
                index = 0,
                length = animation.tweens.length;

            for (; index < length; index++) {
              animation.tweens[index].run(percent);
            }

            deferred.notifyWith(elem, [animation, percent, remaining]);

            if (percent < 1 && length) {
              return remaining;
            } else {
              deferred.resolveWith(elem, [animation]);
              return false;
            }
          },
              animation = deferred.promise({
            elem: elem,
            props: jQuery.extend({}, properties),
            opts: jQuery.extend(true, {
              specialEasing: {}
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function (prop, end, easing) {
              var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
              animation.tweens.push(tween);
              return tween;
            },
            stop: function (gotoEnd) {
              var index = 0,
                  // if we are going to the end, we want to run all the tweens
              // otherwise we skip this part
              length = gotoEnd ? animation.tweens.length : 0;

              for (; index < length; index++) {
                animation.tweens[index].run(1);
              } // resolve when we played the last frame
              // otherwise, reject


              if (gotoEnd) {
                deferred.resolveWith(elem, [animation, gotoEnd]);
              } else {
                deferred.rejectWith(elem, [animation, gotoEnd]);
              }

              return this;
            }
          }),
              props = animation.props;

          propFilter(props, animation.opts.specialEasing);

          for (; index < length; index++) {
            result = animationPrefilters[index].call(animation, elem, props, animation.opts);

            if (result) {
              return result;
            }
          }

          createTweens(animation, props);

          if (jQuery.isFunction(animation.opts.start)) {
            animation.opts.start.call(elem, animation);
          }

          jQuery.fx.timer(jQuery.extend(tick, {
            anim: animation,
            queue: animation.opts.queue,
            elem: elem
          })); // attach callbacks from options

          return animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
        }

        function propFilter(props, specialEasing) {
          var index, name, easing, value, hooks; // camelCase, specialEasing and expand cssHook pass

          for (index in props) {
            name = jQuery.camelCase(index);
            easing = specialEasing[name];
            value = props[index];

            if (jQuery.isArray(value)) {
              easing = value[1];
              value = props[index] = value[0];
            }

            if (index !== name) {
              props[name] = value;
              delete props[index];
            }

            hooks = jQuery.cssHooks[name];

            if (hooks && "expand" in hooks) {
              value = hooks.expand(value);
              delete props[name]; // not quite $.extend, this wont overwrite keys already present.
              // also - reusing 'index' from above because we have the correct "name"

              for (index in value) {
                if (!(index in props)) {
                  props[index] = value[index];
                  specialEasing[index] = easing;
                }
              }
            } else {
              specialEasing[name] = easing;
            }
          }
        }

        jQuery.Animation = jQuery.extend(Animation, {
          tweener: function (props, callback) {
            if (jQuery.isFunction(props)) {
              callback = props;
              props = ["*"];
            } else {
              props = props.split(" ");
            }

            var prop,
                index = 0,
                length = props.length;

            for (; index < length; index++) {
              prop = props[index];
              tweeners[prop] = tweeners[prop] || [];
              tweeners[prop].unshift(callback);
            }
          },
          prefilter: function (callback, prepend) {
            if (prepend) {
              animationPrefilters.unshift(callback);
            } else {
              animationPrefilters.push(callback);
            }
          }
        });

        function defaultPrefilter(elem, props, opts) {
          var index,
              prop,
              value,
              length,
              dataShow,
              tween,
              hooks,
              oldfire,
              anim = this,
              style = elem.style,
              orig = {},
              handled = [],
              hidden = elem.nodeType && isHidden(elem); // handle queue: false promises

          if (!opts.queue) {
            hooks = jQuery._queueHooks(elem, "fx");

            if (hooks.unqueued == null) {
              hooks.unqueued = 0;
              oldfire = hooks.empty.fire;

              hooks.empty.fire = function () {
                if (!hooks.unqueued) {
                  oldfire();
                }
              };
            }

            hooks.unqueued++;
            anim.always(function () {
              // doing this makes sure that the complete handler will be called
              // before this completes
              anim.always(function () {
                hooks.unqueued--;

                if (!jQuery.queue(elem, "fx").length) {
                  hooks.empty.fire();
                }
              });
            });
          } // height/width overflow pass


          if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
            // Make sure that nothing sneaks out
            // Record all 3 overflow attributes because IE does not
            // change the overflow attribute when overflowX and
            // overflowY are set to the same value
            opts.overflow = [style.overflow, style.overflowX, style.overflowY]; // Set display property to inline-block for height/width
            // animations on inline elements that are having width/height animated

            if (jQuery.css(elem, "display") === "inline" && jQuery.css(elem, "float") === "none") {
              // inline-level elements accept inline-block;
              // block-level elements need to be inline with layout
              if (!jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay(elem.nodeName) === "inline") {
                style.display = "inline-block";
              } else {
                style.zoom = 1;
              }
            }
          }

          if (opts.overflow) {
            style.overflow = "hidden";

            if (!jQuery.support.shrinkWrapBlocks) {
              anim.done(function () {
                style.overflow = opts.overflow[0];
                style.overflowX = opts.overflow[1];
                style.overflowY = opts.overflow[2];
              });
            }
          } // show/hide pass


          for (index in props) {
            value = props[index];

            if (rfxtypes.exec(value)) {
              delete props[index];

              if (value === (hidden ? "hide" : "show")) {
                continue;
              }

              handled.push(index);
            }
          }

          length = handled.length;

          if (length) {
            dataShow = jQuery._data(elem, "fxshow") || jQuery._data(elem, "fxshow", {});

            if (hidden) {
              jQuery(elem).show();
            } else {
              anim.done(function () {
                jQuery(elem).hide();
              });
            }

            anim.done(function () {
              var prop;
              jQuery.removeData(elem, "fxshow", true);

              for (prop in orig) {
                jQuery.style(elem, prop, orig[prop]);
              }
            });

            for (index = 0; index < length; index++) {
              prop = handled[index];
              tween = anim.createTween(prop, hidden ? dataShow[prop] : 0);
              orig[prop] = dataShow[prop] || jQuery.style(elem, prop);

              if (!(prop in dataShow)) {
                dataShow[prop] = tween.start;

                if (hidden) {
                  tween.end = tween.start;
                  tween.start = prop === "width" || prop === "height" ? 1 : 0;
                }
              }
            }
          }
        }

        function Tween(elem, options, prop, end, easing) {
          return new Tween.prototype.init(elem, options, prop, end, easing);
        }

        jQuery.Tween = Tween;
        Tween.prototype = {
          constructor: Tween,
          init: function (elem, options, prop, end, easing, unit) {
            this.elem = elem;
            this.prop = prop;
            this.easing = easing || "swing";
            this.options = options;
            this.start = this.now = this.cur();
            this.end = end;
            this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
          },
          cur: function () {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
          },
          run: function (percent) {
            var eased,
                hooks = Tween.propHooks[this.prop];

            if (this.options.duration) {
              this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);
            } else {
              this.pos = eased = percent;
            }

            this.now = (this.end - this.start) * eased + this.start;

            if (this.options.step) {
              this.options.step.call(this.elem, this.now, this);
            }

            if (hooks && hooks.set) {
              hooks.set(this);
            } else {
              Tween.propHooks._default.set(this);
            }

            return this;
          }
        };
        Tween.prototype.init.prototype = Tween.prototype;
        Tween.propHooks = {
          _default: {
            get: function (tween) {
              var result;

              if (tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)) {
                return tween.elem[tween.prop];
              } // passing any value as a 4th parameter to .css will automatically
              // attempt a parseFloat and fallback to a string if the parse fails
              // so, simple values such as "10px" are parsed to Float.
              // complex values such as "rotate(1rad)" are returned as is.


              result = jQuery.css(tween.elem, tween.prop, false, ""); // Empty strings, null, undefined and "auto" are converted to 0.

              return !result || result === "auto" ? 0 : result;
            },
            set: function (tween) {
              // use step hook for back compat - use cssHook if its there - use .style if its
              // available and use plain properties where available
              if (jQuery.fx.step[tween.prop]) {
                jQuery.fx.step[tween.prop](tween);
              } else if (tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
                jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
              } else {
                tween.elem[tween.prop] = tween.now;
              }
            }
          }
        }; // Remove in 2.0 - this supports IE8's panic based approach
        // to setting things on disconnected nodes

        Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
          set: function (tween) {
            if (tween.elem.nodeType && tween.elem.parentNode) {
              tween.elem[tween.prop] = tween.now;
            }
          }
        };
        jQuery.each(["toggle", "show", "hide"], function (i, name) {
          var cssFn = jQuery.fn[name];

          jQuery.fn[name] = function (speed, easing, callback) {
            return speed == null || typeof speed === "boolean" || // special check for .toggle( handler, handler, ... )
            !i && jQuery.isFunction(speed) && jQuery.isFunction(easing) ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
          };
        });
        jQuery.fn.extend({
          fadeTo: function (speed, to, easing, callback) {
            // show any hidden elements after setting opacity to 0
            return this.filter(isHidden).css("opacity", 0).show() // animate to the value specified
            .end().animate({
              opacity: to
            }, speed, easing, callback);
          },
          animate: function (prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop),
                optall = jQuery.speed(speed, easing, callback),
                doAnimation = function () {
              // Operate on a copy of prop so per-property easing won't be lost
              var anim = Animation(this, jQuery.extend({}, prop), optall); // Empty animations resolve immediately

              if (empty) {
                anim.stop(true);
              }
            };

            return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
          },
          stop: function (type, clearQueue, gotoEnd) {
            var stopQueue = function (hooks) {
              var stop = hooks.stop;
              delete hooks.stop;
              stop(gotoEnd);
            };

            if (typeof type !== "string") {
              gotoEnd = clearQueue;
              clearQueue = type;
              type = undefined;
            }

            if (clearQueue && type !== false) {
              this.queue(type || "fx", []);
            }

            return this.each(function () {
              var dequeue = true,
                  index = type != null && type + "queueHooks",
                  timers = jQuery.timers,
                  data = jQuery._data(this);

              if (index) {
                if (data[index] && data[index].stop) {
                  stopQueue(data[index]);
                }
              } else {
                for (index in data) {
                  if (data[index] && data[index].stop && rrun.test(index)) {
                    stopQueue(data[index]);
                  }
                }
              }

              for (index = timers.length; index--;) {
                if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                  timers[index].anim.stop(gotoEnd);
                  dequeue = false;
                  timers.splice(index, 1);
                }
              } // start the next in the queue if the last step wasn't forced
              // timers currently will call their complete callbacks, which will dequeue
              // but only if they were gotoEnd


              if (dequeue || !gotoEnd) {
                jQuery.dequeue(this, type);
              }
            });
          }
        }); // Generate parameters to create a standard animation

        function genFx(type, includeWidth) {
          var which,
              attrs = {
            height: type
          },
              i = 0; // if we include width, step value is 1 to do all cssExpand values,
          // if we don't include width, step value is 2 to skip over Left and Right

          includeWidth = includeWidth ? 1 : 0;

          for (; i < 4; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
          }

          if (includeWidth) {
            attrs.opacity = attrs.width = type;
          }

          return attrs;
        } // Generate shortcuts for custom animations


        jQuery.each({
          slideDown: genFx("show"),
          slideUp: genFx("hide"),
          slideToggle: genFx("toggle"),
          fadeIn: {
            opacity: "show"
          },
          fadeOut: {
            opacity: "hide"
          },
          fadeToggle: {
            opacity: "toggle"
          }
        }, function (name, props) {
          jQuery.fn[name] = function (speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
          };
        });

        jQuery.speed = function (speed, easing, fn) {
          var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
            complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
          };
          opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default; // normalize opt.queue - true/undefined/null -> "fx"

          if (opt.queue == null || opt.queue === true) {
            opt.queue = "fx";
          } // Queueing


          opt.old = opt.complete;

          opt.complete = function () {
            if (jQuery.isFunction(opt.old)) {
              opt.old.call(this);
            }

            if (opt.queue) {
              jQuery.dequeue(this, opt.queue);
            }
          };

          return opt;
        };

        jQuery.easing = {
          linear: function (p) {
            return p;
          },
          swing: function (p) {
            return 0.5 - Math.cos(p * Math.PI) / 2;
          }
        };
        jQuery.timers = [];
        jQuery.fx = Tween.prototype.init;

        jQuery.fx.tick = function () {
          var timer,
              timers = jQuery.timers,
              i = 0;

          for (; i < timers.length; i++) {
            timer = timers[i]; // Checks the timer has not already been removed

            if (!timer() && timers[i] === timer) {
              timers.splice(i--, 1);
            }
          }

          if (!timers.length) {
            jQuery.fx.stop();
          }
        };

        jQuery.fx.timer = function (timer) {
          if (timer() && jQuery.timers.push(timer) && !timerId) {
            timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval);
          }
        };

        jQuery.fx.interval = 13;

        jQuery.fx.stop = function () {
          clearInterval(timerId);
          timerId = null;
        };

        jQuery.fx.speeds = {
          slow: 600,
          fast: 200,
          // Default speed
          _default: 400
        }; // Back Compat <1.8 extension point

        jQuery.fx.step = {};

        if (jQuery.expr && jQuery.expr.filters) {
          jQuery.expr.filters.animated = function (elem) {
            return jQuery.grep(jQuery.timers, function (fn) {
              return elem === fn.elem;
            }).length;
          };
        }

        var rroot = /^(?:body|html)$/i;

        jQuery.fn.offset = function (options) {
          if (arguments.length) {
            return options === undefined ? this : this.each(function (i) {
              jQuery.offset.setOffset(this, options, i);
            });
          }

          var box,
              docElem,
              body,
              win,
              clientTop,
              clientLeft,
              scrollTop,
              scrollLeft,
              top,
              left,
              elem = this[0],
              doc = elem && elem.ownerDocument;

          if (!doc) {
            return;
          }

          if ((body = doc.body) === elem) {
            return jQuery.offset.bodyOffset(elem);
          }

          docElem = doc.documentElement; // Make sure we're not dealing with a disconnected DOM node

          if (!jQuery.contains(docElem, elem)) {
            return {
              top: 0,
              left: 0
            };
          }

          box = elem.getBoundingClientRect();
          win = getWindow(doc);
          clientTop = docElem.clientTop || body.clientTop || 0;
          clientLeft = docElem.clientLeft || body.clientLeft || 0;
          scrollTop = win.pageYOffset || docElem.scrollTop;
          scrollLeft = win.pageXOffset || docElem.scrollLeft;
          top = box.top + scrollTop - clientTop;
          left = box.left + scrollLeft - clientLeft;
          return {
            top: top,
            left: left
          };
        };

        jQuery.offset = {
          bodyOffset: function (body) {
            var top = body.offsetTop,
                left = body.offsetLeft;

            if (jQuery.support.doesNotIncludeMarginInBodyOffset) {
              top += parseFloat(jQuery.css(body, "marginTop")) || 0;
              left += parseFloat(jQuery.css(body, "marginLeft")) || 0;
            }

            return {
              top: top,
              left: left
            };
          },
          setOffset: function (elem, options, i) {
            var position = jQuery.css(elem, "position"); // set position first, in-case top/left are set even on static elem

            if (position === "static") {
              elem.style.position = "relative";
            }

            var curElem = jQuery(elem),
                curOffset = curElem.offset(),
                curCSSTop = jQuery.css(elem, "top"),
                curCSSLeft = jQuery.css(elem, "left"),
                calculatePosition = (position === "absolute" || position === "fixed") && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
                props = {},
                curPosition = {},
                curTop,
                curLeft; // need to be able to calculate position if either top or left is auto and position is either absolute or fixed

            if (calculatePosition) {
              curPosition = curElem.position();
              curTop = curPosition.top;
              curLeft = curPosition.left;
            } else {
              curTop = parseFloat(curCSSTop) || 0;
              curLeft = parseFloat(curCSSLeft) || 0;
            }

            if (jQuery.isFunction(options)) {
              options = options.call(elem, i, curOffset);
            }

            if (options.top != null) {
              props.top = options.top - curOffset.top + curTop;
            }

            if (options.left != null) {
              props.left = options.left - curOffset.left + curLeft;
            }

            if ("using" in options) {
              options.using.call(elem, props);
            } else {
              curElem.css(props);
            }
          }
        };
        jQuery.fn.extend({
          position: function () {
            if (!this[0]) {
              return;
            }

            var elem = this[0],
                // Get *real* offsetParent
            offsetParent = this.offsetParent(),
                // Get correct offsets
            offset = this.offset(),
                parentOffset = rroot.test(offsetParent[0].nodeName) ? {
              top: 0,
              left: 0
            } : offsetParent.offset(); // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0

            offset.top -= parseFloat(jQuery.css(elem, "marginTop")) || 0;
            offset.left -= parseFloat(jQuery.css(elem, "marginLeft")) || 0; // Add offsetParent borders

            parentOffset.top += parseFloat(jQuery.css(offsetParent[0], "borderTopWidth")) || 0;
            parentOffset.left += parseFloat(jQuery.css(offsetParent[0], "borderLeftWidth")) || 0; // Subtract the two offsets

            return {
              top: offset.top - parentOffset.top,
              left: offset.left - parentOffset.left
            };
          },
          offsetParent: function () {
            return this.map(function () {
              var offsetParent = this.offsetParent || document.body;

              while (offsetParent && !rroot.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent;
              }

              return offsetParent || document.body;
            });
          }
        }); // Create scrollLeft and scrollTop methods

        jQuery.each({
          scrollLeft: "pageXOffset",
          scrollTop: "pageYOffset"
        }, function (method, prop) {
          var top = /Y/.test(prop);

          jQuery.fn[method] = function (val) {
            return jQuery.access(this, function (elem, method, val) {
              var win = getWindow(elem);

              if (val === undefined) {
                return win ? prop in win ? win[prop] : win.document.documentElement[method] : elem[method];
              }

              if (win) {
                win.scrollTo(!top ? val : jQuery(win).scrollLeft(), top ? val : jQuery(win).scrollTop());
              } else {
                elem[method] = val;
              }
            }, method, val, arguments.length, null);
          };
        });

        function getWindow(elem) {
          return jQuery.isWindow(elem) ? elem : elem.nodeType === 9 ? elem.defaultView || elem.parentWindow : false;
        } // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods


        jQuery.each({
          Height: "height",
          Width: "width"
        }, function (name, type) {
          jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
          }, function (defaultExtra, funcName) {
            // margin is only for outerHeight, outerWidth
            jQuery.fn[funcName] = function (margin, value) {
              var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"),
                  extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
              return jQuery.access(this, function (elem, type, value) {
                var doc;

                if (jQuery.isWindow(elem)) {
                  // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
                  // isn't a whole lot we can do. See pull request at this URL for discussion:
                  // https://github.com/jquery/jquery/pull/764
                  return elem.document.documentElement["client" + name];
                } // Get document width or height


                if (elem.nodeType === 9) {
                  doc = elem.documentElement; // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
                  // unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.

                  return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);
                }

                return value === undefined ? // Get width or height on the element, requesting but not forcing parseFloat
                jQuery.css(elem, type, value, extra) : // Set width or height on the element
                jQuery.style(elem, type, value, extra);
              }, type, chainable ? margin : undefined, chainable, null);
            };
          });
        }); // Expose jQuery to the global object

        window.jQuery = window.$ = jQuery; // Expose jQuery as an AMD module, but only for AMD loaders that
        // understand the issues with loading multiple versions of jQuery
        // in a page that all might call define(). The loader will indicate
        // they have special allowances for multiple jQuery versions by
        // specifying define.amd.jQuery = true. Register as a named module,
        // since jQuery can be concatenated with other files that may use define,
        // but not use a proper concatenation script that understands anonymous
        // AMD modules. A named AMD is safest and most robust way to register.
        // Lowercase jquery is used because AMD module names are derived from
        // file names, and jQuery is normally delivered in a lowercase file name.
        // Do this after creating the global so that if an AMD module wants to call
        // noConflict to hide this version of jQuery, it will work.

        if (typeof define === "function" && define.amd && define.amd.jQuery) {
          define("jquery", [], function () {
            return jQuery;
          });
        }

        return jQuery;
      }(window);
    });
  }, {}]
}, {}, [1]);