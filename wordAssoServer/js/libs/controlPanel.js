/*jslint node: true */
/* jshint undef: true, unused: true */
/* globals store, $, window, twttr, Element, document, async, moment */

function ControlPanel() {
  "use strict";

  // var DEFAULT_SOURCE = "http://localhost:9997";
  var DEFAULT_SOURCE = "https://word.threeceelabs.com";

  var parentWindow = window.opener;
  console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
  var self = this;

  var compactDateTimeFormat = "YYYYMMDD HHmmss";

  var timelineDiv = document.getElementById("timelineDiv");
  var hashtagDiv =document.getElementById("hashtagDiv");

  var nodeTypesSet = new Set();
  nodeTypesSet.add("emoji");
  nodeTypesSet.add("hashtag");
  nodeTypesSet.add("place");
  nodeTypesSet.add("media");
  nodeTypesSet.add("url");
  nodeTypesSet.add("user");
  nodeTypesSet.add("word");

  var twitterFeedUser;
  var twitterFeedHashtag;

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
    }
  }

  var twitterCategorySearchDiv = document.getElementById("twitterCategorySearchDiv");
  var twitterUserButtonsDiv = document.getElementById("twitterUserButtonsDiv");

  var nodeSearchInput = document.createElement("input");
  var nodeSearchLabel = document.createElement("label");
  var nodeSearchValue = "";

  nodeSearchLabel.setAttribute("id", "nodeSearchLabel");
  nodeSearchLabel.innerHTML = "NODE SEARCH";

  function nodeSearchHandler(e) {
    if (e.keyCode === 13) { // 'ENTER' key
      parentWindow.postMessage({op: "NODE_SEARCH", input: nodeSearchInput.value}, DEFAULT_SOURCE);
    }
  }

  nodeSearchInput.setAttribute("class", "nodeSearch");
  nodeSearchInput.setAttribute("type", "text");
  nodeSearchInput.setAttribute("id", "nodeSearchInput");
  nodeSearchInput.setAttribute("name", "nodeSearch");
  nodeSearchInput.setAttribute("autofocus", true);
  nodeSearchInput.setAttribute("autocapitalize", "none");
  nodeSearchInput.setAttribute("value", nodeSearchValue);
  nodeSearchInput.addEventListener("keydown", function(e){ nodeSearchHandler(e); }, false);

  twitterCategorySearchDiv.appendChild(nodeSearchLabel);
  twitterCategorySearchDiv.appendChild(nodeSearchInput);


  var config = {};
  var currentTwitterNode;

  config = window.opener.config;
  delete config.twitterUser.histograms;
  delete config.twitterUser.countHistory;
  delete config.twitterUser.status;

  console.log("config\n" + jsonPrint(config));

  var statsObj = {};
  statsObj.socketId = "NOT SET";
  statsObj.user = {};
  statsObj.user.name = "---";
  statsObj.user.screenName = "@";
  statsObj.user.category = "---";
  statsObj.user.categoryAuto = "---";
  statsObj.user.followersCount = 0;
  statsObj.user.friendsCount = 0;
  statsObj.user.statusesCount = 0;
  statsObj.user.mentions = 0;
  statsObj.user.threeceeFollowing = "---";

  var controlIdHash = {};

  var dashboardMain;
  var infoTable;
  var userStatsTable;

  var categoryTable;

  var controlTable;
  var controlTableHead;
  var controlTableBody;

  var displayControlTable;

  var controlSliderTable;

  //--------------

  function nextMismatchedButtonHandler(e){

    console.warn("NEXT MISMATCHED BUTTON"
     + " | ID: " + e.target.id
     + "\n" + jsonPrint(e.target)
    );

    parentWindow.postMessage({op: "NODE_SEARCH", input: "@?MM"}, DEFAULT_SOURCE);
  }

  var nextMismatchedButton = document.createElement("button");
  nextMismatchedButton.setAttribute("class", "button");
  nextMismatchedButton.setAttribute("id", "nextMismatchedButton");
  nextMismatchedButton.innerHTML = "NEXT MISMATCH";
  nextMismatchedButton.addEventListener(
    "click", 
    function(e){ nextMismatchedButtonHandler(e); }, 
    false
  );

  twitterUserButtonsDiv.appendChild(nextMismatchedButton);

  //--------------

  function nextUncategorizedButtonHandler(e){

    console.warn("NEXT UNCATEGORIZED BUTTON"
      + " | ID: " + e.target.id
    );

    parentWindow.postMessage({op: "NODE_SEARCH", input: "@?"}, DEFAULT_SOURCE);
  }

  var nextUncategorizedButton = document.createElement("button");
  nextUncategorizedButton.setAttribute("class", "button");
  nextUncategorizedButton.setAttribute("id", "nextUncategorizedButton");
  nextUncategorizedButton.innerHTML = "NEXT UNCAT";
  nextUncategorizedButton.addEventListener(
    "click", 
    function(e){ nextUncategorizedButtonHandler(e); }, 
    false
  );

  twitterUserButtonsDiv.appendChild(nextUncategorizedButton);

  //--------------

  function followButtonHandler(e){
    if (!twitterFeedUser) { 
      console.error("followButtonHandler: twitterFeedUser UNDEFINED");
      return;
    }
    console.warn("FOLLOW BUTTON | ID: " + e.target.id + " | USER: @" + twitterFeedUser.screenName);
    parentWindow.postMessage({op: "FOLLOW", user: twitterFeedUser}, DEFAULT_SOURCE);
  }

  var followButton = document.createElement("button");
  followButton.setAttribute("class", "button");
  followButton.setAttribute("id", "followButton");
  followButton.innerHTML = "FOLLOW";
  followButton.addEventListener(
    "click", 
    function(e){ followButtonHandler(e); }, 
    false
  );

  twitterUserButtonsDiv.appendChild(followButton);

  //--------------

  function ignoreButtonHandler(e){
    console.warn("IGNORE BUTTON | ID: " + e.target.id + " | USER: @" + twitterFeedUser.screenName);
    parentWindow.postMessage({op: "IGNORE", user: twitterFeedUser}, DEFAULT_SOURCE);
  }

  var ignoreButton = document.createElement("button");
  ignoreButton.setAttribute("class", "button");
  ignoreButton.setAttribute("id", "ignoreButton");
  ignoreButton.innerHTML = "IGNORE";
  ignoreButton.addEventListener(
    "click", 
    function(e){ ignoreButtonHandler(e); }, 
    false
  );

  twitterUserButtonsDiv.appendChild(ignoreButton);

  //--------------

  function unignoreButtonHandler(e){
    console.warn("UNIGNORE BUTTON | ID: " + e.target.id + " | USER: @" + twitterFeedUser.screenName);
    parentWindow.postMessage({op: "UNIGNORE", user: twitterFeedUser}, DEFAULT_SOURCE);
  }

  var unignoreButton = document.createElement("button");
  unignoreButton.setAttribute("class", "button");
  unignoreButton.setAttribute("id", "ignoreButton");
  unignoreButton.innerHTML = "IGNORE";
  unignoreButton.addEventListener(
    "click", 
    function(e){ unignoreButtonHandler(e); }, 
    false
  );

  twitterUserButtonsDiv.appendChild(unignoreButton);

  //--------------

  function unfollowButtonHandler(e){
    console.warn("UNFOLLOW BUTTON | ID: " + e.target.id + " | USER: @" + twitterFeedUser.screenName);
    parentWindow.postMessage({op: "UNFOLLOW", user: twitterFeedUser}, DEFAULT_SOURCE);
  }

  var unfollowButton = document.createElement("button");
  unfollowButton.setAttribute("class", "button");
  unfollowButton.setAttribute("id", "unfollowButton");
  unfollowButton.innerHTML = "UNFOLLOW";
  unfollowButton.addEventListener(
    "click", 
    function(e){ unfollowButtonHandler(e); }, 
    false
  );

  twitterUserButtonsDiv.appendChild(unfollowButton);

  //--------------

  function updateCategoryRadioButtons(category, callback){

    console.log("updateCategoryRadioButtons | " + category);

    if (category === undefined || !category) {
      category = "none";
    }

    var element;

    document.getElementById("categoryLeft").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryRight").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryNeutral").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryPositive").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryNegative").setAttribute("class", "radioUnchecked");
    document.getElementById("categoryNone").setAttribute("class", "radioUnchecked");

    switch(category) {
      case "left":
        element = document.getElementById("categoryLeft");
        element.className = "radioChecked";
        callback();
      break;
      case "right":
        element = document.getElementById("categoryRight");
        element.className = "radioChecked";
        callback();
      break;
      case "neutral":
        element = document.getElementById("categoryNeutral");
        element.className = "radioChecked";
        callback();
      break;
      case "positive":
        element = document.getElementById("categoryPositive");
        element.className = "radioChecked";
        callback();
      break;
      case "negative":
        element = document.getElementById("categoryNegative");
        element.className = "radioChecked";
        callback();
      break;
      case "none":
        element = document.getElementById("categoryNone");
        element.className = "radioChecked";
        callback();
      break;
      default:
        callback();
    }
  }

  function shortCategory(c) {
    switch (c) {
      case "left": return "L"; 
      case "right": return "R"; 
      case "neutral": return "N"; 
      case "positive": return "+"; 
      case "negative": return "-";
      default: return "0";
    }
  }

  function twitterWidgetsCreateTimeline(node, callback){

    if (node.notFound !== undefined) {
      callback(null, null);
    }
    else {

      var screenName = node.screenName;
      var name = (node.name !== undefined) ? node.name : "---";
      // var followersMentions = node.followersCount + node.mentions;

      var category = node.category || "none";
      var categoryAuto = node.categoryAuto || "none";

      document.getElementById("userScreenNameText").innerHTML = "<h4>@" + node.screenName + "</h4>";
      document.getElementById("userNameText").innerHTML = "<h4>" + name + "</h4>";
      document.getElementById("userIdText").innerHTML = node.nodeId;
      document.getElementById("userCreatedAtText").innerHTML = moment(node.createdAt).format(compactDateTimeFormat);
      document.getElementById("userLastSeenText").innerHTML = moment(node.lastSeen).format(compactDateTimeFormat);
      document.getElementById("userCategoryText").innerHTML = "M: " + shortCategory(category) + " | A: " + shortCategory(categoryAuto);
      document.getElementById("userFollowersCountText").innerHTML = node.followersCount;
      document.getElementById("userFriendsCountText").innerHTML = node.friendsCount;
      document.getElementById("userStatusesCountText").innerHTML = node.statusesCount;
      document.getElementById("userMentionsText").innerHTML = node.mentions;
      document.getElementById("user3cFollowingText").innerHTML = node.threeceeFollowing;
      document.getElementById("userDescriptionText").innerHTML = node.description;

      statsObj.user.nodeId = node.nodeId;
      statsObj.user.name = name;
      statsObj.user.screenName = node.screenName;
      statsObj.user.category = category;
      statsObj.user.categoryAuto = categoryAuto;
      statsObj.user.followersCount = node.followersCount;
      statsObj.user.friendsCount = node.friendsCount;
      statsObj.user.statusesCount = node.statusesCount;
      statsObj.user.threeceeFollowing = node.threeceeFollowing;
      statsObj.user.mentions = node.mentions;
      statsObj.user.description = node.description;

      if (twttr && twttr.widgets) {
        twttr.widgets.createFollowButton(
          screenName,
          timelineDiv
        );

        twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: screenName},
          timelineDiv,
          { width: "400", height: "600"}
        )
        .then(function (el) {
          callback(null, el);
        })
        .catch(function(err){
          console.error("TWITTER WIDGET ERROR: " + err);
          callback(err, null);
        });
      }
      else {
        callback(null, null);
      }
    }
  }

  function twitterHashtagSearch(node, callback){

    var text = node.nodeId.toLowerCase();
    var hashtagText = document.createElement("TEXT");

    hashtagText.setAttribute("id", "hashtagText");
    hashtagText.setAttribute("class", "hashtagText");
    hashtagText.innerHTML = "<br><br>" 
      + "#" + text
      + "<br><br>"
      + "C: M: " + node.category
      + "<br><br>";

    hashtagDiv.removeAll();
    timelineDiv.removeAll();
    hashtagDiv.appendChild(hashtagText);

    callback();
  }

  Element.prototype.removeAll = function () {
    while (this.firstChild) { this.removeChild(this.firstChild); }
    return this;
  };

  function loadTwitterFeed(node, callback) {

    if (!timelineDiv || !hashtagDiv || (twttr === undefined)) { 
      console.error("loadTwitterFeed: timelineDiv OR hashtagDiv OR twttr UNDEFINED");
      return callback("loadTwitterFeed: timelineDiv OR hashtagDiv OR twttr UNDEFINED");
    }

    hashtagDiv.removeAll();
    timelineDiv.removeAll();

    if (node.nodeType === "user"){

      twitterFeedUser = node;

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | NID: " + node.nodeId
        + " | @" + node.screenName
        + " | " + node.name
        + " | CR: " + node.createdAt
        + " | LS: " + node.lastSeen
        + " | CAT M: " + node.category
        + " | CAT A: " + node.categoryAuto
        + " | Ms: " + node.mentions
        + " | Ts: " + node.statusesCount
        + " | FRNDs: " + node.friendsCount
        + " | FLWRs: " + node.followersCount
      );

      updateCategoryRadioButtons(node.category, function(){

        twitterWidgetsCreateTimeline(node, function(){
          var nsi =document.getElementById("nodeSearchInput");
          nsi.value = "@" + node.screenName;
          callback(null);
        });

      });
    }
    else if (node.nodeType === "hashtag"){

      twitterFeedHashtag = node;

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | #: " + node.nodeId
        + " | CAT M: " + node.category
        + " | Ms: " + node.mentions
      );

      updateCategoryRadioButtons(node.category, function(){
        twitterHashtagSearch(node, function(){
          var nsi =document.getElementById("nodeSearchInput");
          nsi.value = "#" + node.nodeId;
          callback(null);
        });
      });
    }
    else {
      callback("ILLEGAL NODE TYPE: " + node.nodeType);
    }
  }

  var toggleDisplayNodeTypeButtonHandler = function (e){

    var currentButton = document.getElementById(e.target.id);

    const newValue = (currentButton.getAttribute("value") === "hide") ? "show" : "hide";

    currentButton.setAttribute("value", newValue);

    if (newValue === "show") { 
      currentButton.style.color = "green";
      currentButton.style.border = "2px solid green";
    }
    else {
      currentButton.style.color = "#888888";
      currentButton.style.border = "1px solid white";
    }

    console.warn("DISPLAY NODE TYPE BUTTON"
     + " | ID: " + e.target.id
     + " | NODE TYPE: " + currentButton.getAttribute("displayNodeType")
     + " | VALUE: " + currentButton.value
    );

    config.displayNodeHashMap[currentButton.getAttribute("displayNodeType")] = newValue;

    parentWindow.postMessage(
      {
        op: "DISPLAY_NODE_TYPE", 
        displayNodeType: currentButton.getAttribute("displayNodeType"), 
        value: currentButton.getAttribute("value")
      }, 
      DEFAULT_SOURCE
    );
  };

  this.setDisplayNodeType = function(params, callback){

    if (!nodeTypesSet.has(params.displayNodeType)) {
      console.error("UNKNOWN NODE TYPE: " + params.displayNodeType);
      return callback("UNKNOWN NODE TYPE: " + params.displayNodeType);
    }

    const id = params.id || "displayNodeType_" + params.displayNodeType.toLowerCase();
    const value = params.value || "hide";

    console.log("SET DISPLAY NODE TYPE | " + params.displayNodeType + " | " + value);

    var displayNodeType = document.getElementById(id);
    displayNodeType.setAttribute("value", value);

    if (callback !== undefined) { callback(); }
  };

  function categoryButtonHandler(e){

    var currentButton = document.getElementById(e.target.id);
    currentButton.setAttribute("checked", true);
    var category = false;

    console.warn("CATEGORY BUTTON"
     + " | ID: " + e.target.id
     // + "\n" + jsonPrint(e.target)
    );

    switch (e.target.id){
      case "categoryLeft":
        console.log("LEFT | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        category = "left";
      break;
      case "categoryRight":
        console.log("RIGHT | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        category = "right";
      break;
      case "categoryNeutral":
        console.log("NEUTRAL | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        category = "neutral";
      break;
      case "categoryPositive":
        console.log("POSITIVE | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        category = "positive";
      break;
      case "categoryNegative":
        console.log("NEGATIVE | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        category = "negative";
      break;
      case "categoryNone":
        console.log("NONE | " + currentTwitterNode.nodeType + " | " + currentTwitterNode.nodeId);
        category = false;
      break;
    }

    const catNode = {
      nodeId: currentTwitterNode.nodeId,
      nodeType: currentTwitterNode.nodeType,
      screenName: currentTwitterNode.screenName,
      category: currentTwitterNode.category,
      categoryAuto: currentTwitterNode.categoryAuto,
    };

    parentWindow.postMessage({op: "CATEGORIZE", node: catNode, category: category}, DEFAULT_SOURCE);
  }

  this.setNodeRadiusMaxRatioSliderValue = function (value) {
    if (!document.getElementById("nodeRadiusMaxRatioSlider")) { return; }
    console.log("setNodeRadiusMaxRatioSliderValue: " + value);
    document.getElementById("nodeRadiusMaxRatioSlider").value = (value * document.getElementById("nodeRadiusMaxRatioSlider").getAttribute("multiplier"));
    document.getElementById("nodeRadiusMaxRatioSliderText").innerHTML = value.toFixed(3);
  };

  this.setNodeRadiusMinRatioSliderValue = function (value) {
    if (!document.getElementById("nodeRadiusMinRatioSlider")) { return; }
    console.log("setNodeRadiusMinRatioSliderValue: " + value);
    document.getElementById("nodeRadiusMinRatioSlider").value = (value * document.getElementById("nodeRadiusMinRatioSlider").getAttribute("multiplier"));
    document.getElementById("nodeRadiusMinRatioSliderText").innerHTML = value.toFixed(3);
  };

  this.setVelocityDecaySliderValue = function (value) {
    if (!document.getElementById("velocityDecaySlider")) { return; }
    console.log("setVelocityDecaySliderValue: " + value);
    document.getElementById("velocityDecaySlider").value = (value * document.getElementById("velocityDecaySlider").getAttribute("multiplier"));
    document.getElementById("velocityDecaySliderText").innerHTML = value.toFixed(3);
  };

  this.setLinkStrengthSliderValue = function (value) {
    if (!document.getElementById("linkStrengthSlider")) { return; }
    console.log("setLinkStrengthSliderValue: " + value);
    document.getElementById("linkStrengthSlider").value = (value * document.getElementById("linkStrengthSlider").getAttribute("multiplier"));
    document.getElementById("linkStrengthSliderText").innerHTML = value.toFixed(3);
  };

  this.setLinkDistanceSliderValue = function (value) {
    if (!document.getElementById("linkDistanceSlider")) { return; }
    console.log("setLinkDistanceSliderValue: " + value);
    document.getElementById("linkDistanceSlider").value = (value * document.getElementById("linkDistanceSlider").getAttribute("multiplier"));
    document.getElementById("linkDistanceSliderText").innerHTML = value.toFixed(3);
  };

  this.setTransitionDurationSliderValue = function (value) {
    if (!document.getElementById("transitionDurationSlider")) { return; }
    console.log("setTransitionDurationSliderValue: " + value);
    document.getElementById("transitionDurationSlider").value = (value* document.getElementById("transitionDurationSlider").getAttribute("multiplier"));
    document.getElementById("transitionDurationSliderText").innerHTML = value.toFixed(3);
  };

  this.setGravitySliderValue = function (value) {
    if (!document.getElementById("gravitySlider")) { return; }
    console.log("setGravitySliderValue: " + value);
    document.getElementById("gravitySlider").value = (value* document.getElementById("gravitySlider").getAttribute("multiplier"));
    document.getElementById("gravitySliderText").innerHTML = value.toFixed(5);
  };

  this.setChargeSliderValue = function (value) {
    if (!document.getElementById("chargeSlider")) { return; }
    console.log("setChargeSliderValue: " + value);
    document.getElementById("chargeSlider").value = value;
    document.getElementById("chargeSliderText").innerHTML = value;
  };

  this.setMaxAgeSliderValue = function (value) {
    if (!document.getElementById("maxAgeSlider")) { return; }
    console.log("setMaxAgeSliderValue: " + value);
    document.getElementById("maxAgeSlider").value = value;
    document.getElementById("maxAgeSliderText").innerHTML = value;
  };

  this.setFontSizeMinRatioSliderValue = function (value) {
    if (!document.getElementById("fontSizeMinRatioSlider")) { return; }
    console.log("setFontSizeMinRatioSliderValue: " + value);
    document.getElementById("fontSizeMinRatioSlider").value = (value * document.getElementById("fontSizeMinRatioSlider").getAttribute("multiplier"));
    var valuePercent = 100*value;
    document.getElementById("fontSizeMinRatioSliderText").innerHTML = valuePercent.toFixed(1) + "% H";
  };

  this.setFontSizeMaxRatioSliderValue = function (value) {
    if (!document.getElementById("fontSizeMaxRatioSlider")) { return; }
    console.log("setFontSizeMaxRatioSliderValue: " + value);
    document.getElementById("fontSizeMaxRatioSlider").value = (value * document.getElementById("fontSizeMaxRatioSlider").getAttribute("multiplier"));
    var valuePercent = 100*value;
    document.getElementById("fontSizeMaxRatioSliderText").innerHTML = valuePercent.toFixed(1) + "% H";
  };

  function receiveMessage(event){
    // Do we trust the sender of this message?
    if (event.origin !== DEFAULT_SOURCE){
      if (event.origin === "https://platform.twitter.com") {
        if (event.data["twttr.button"] 
          && (event.data["twttr.button"]["method"] === "twttr.private.resizeButton")){
          return;
        }
        // console.log("TWITTER SOURCE: " + event.origin);
      }
      else {
        console.error("RX MESSAGE | NOT TRUSTED SOURCE"
          + " | ORIGIN: " + event.origin 
          + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
        );
        return;
      }
    }

    console.debug("RX MESSAGE | SOURCE"
      + " | ORIGIN: " + event.origin 
      + " | PARENT WINDOW: " + parentWindow.PARENT_ID
      + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
    );

    var op = event.data.op;
    var cnf;

    switch (op) {

      case "INIT":

        cnf = event.data.config;
        delete cnf.twitterUser.histograms;
        delete cnf.twitterUser.countHistory;
        delete cnf.twitterUser.status;

        console.debug("CONTROL PANEL INIT\n" + jsonPrint(cnf));

        Object.keys(cnf).forEach(function(prop){
          config[prop] = cnf[prop];
          console.info("CNF | " + prop 
            + " | " + config[prop]
          );
        });

        self.setTransitionDurationSliderValue(cnf.defaultTransitionDuration);
        self.setLinkStrengthSliderValue(cnf.defaultLinkStrength);
        self.setLinkDistanceSliderValue(cnf.defaultLinkDistance);
        self.setGravitySliderValue(cnf.defaultGravity);
        self.setChargeSliderValue(cnf.defaultCharge);
        self.setNodeRadiusMinRatioSliderValue(cnf.defaultNodeRadiusMinRatio);
        self.setNodeRadiusMaxRatioSliderValue(cnf.defaultNodeRadiusMaxRatio);
        self.setVelocityDecaySliderValue(cnf.defaultVelocityDecay);
        self.setMaxAgeSliderValue(cnf.defaultMaxAge);
        self.setFontSizeMinRatioSliderValue(cnf.defaultFontSizeMinRatio);
        self.setFontSizeMaxRatioSliderValue(cnf.defaultFontSizeMaxRatio);

        if (cnf.displayNodeHashMap !== undefined) {
          Object.keys(cnf.displayNodeHashMap).forEach(function(displayNodeType){
            self.setDisplayNodeType({displayNodeType: displayNodeType, value: cnf.displayNodeHashMap[displayNodeType]}, function(err){
              if (err) {
                delete cnf.displayNodeHashMap[displayNodeType];
              }
            });
          });
        }

        parentWindow.postMessage({op: "NODE_SEARCH", input: "@threecee"}, DEFAULT_SOURCE);

      break;

      case "SET_TWITTER_USER":
        currentTwitterNode = event.data.user;
        console.debug("SET TWITTER USER" 
          + " | " + currentTwitterNode.nodeId
          + " | @" + currentTwitterNode.screenName
          + " | CR: " + currentTwitterNode.createdAt
          + " | LS: " + currentTwitterNode.lastSeen
          + " | C: " + currentTwitterNode.category
          + " | CA: " + currentTwitterNode.categoryAuto
          // + jsonPrint(currentTwitterNode)
        );
        if (event.data.nodeSearch) {
          console.debug("NODE_SEARCH on SET_TWITTER_USER USER" 
            + " | @" + currentTwitterNode.screenName
          );
          parentWindow.postMessage({op: "NODE_SEARCH", input: "@" + currentTwitterNode.screenName}, DEFAULT_SOURCE);
        }
        loadTwitterFeed(currentTwitterNode, function(err){
          if (err) {
            setTimeout(function(){
              loadTwitterFeed(currentTwitterNode, function(err2){
                if (err2) { console.error("loadTwitterFeed SET_TWITTER_USER FAIL"); }
              });
            }, 1000);
          }
        });
      break;

      case "SET_TWITTER_HASHTAG":
        currentTwitterNode = event.data.hashtag;
        console.debug("SET TWITTER HASHTAG\n" + jsonPrint(currentTwitterNode));
        loadTwitterFeed(currentTwitterNode, function(err){
          if (err) {
            setTimeout(function(){
              loadTwitterFeed(currentTwitterNode, function(err2){
                if (err2) { console.error("loadTwitterFeed SET_TWITTER_HASHTAG FAIL"); }
              });
            }, 1000);
          }
        });
      break;
    }
  }

  window.addEventListener("load", function() {
    console.warn("WINDOW LOAD");
  }, false);

  // window.addEventListener("message", receiveMessage, false);

  window.onbeforeunload = function() {
    parentWindow.postMessage({op:"CLOSE"}, DEFAULT_SOURCE);
  };

  function buttonHandler(e) {

    var currentButton = document.getElementById(e.target.id);

    console.warn("BUTTON"
     + " | ID: " + e.target.id
     + "\n HASH\n" + jsonPrint(controlIdHash[e.target.id])
     + "\n" + jsonPrint(e.target)
    );

    if (!currentButton){
      console.error("UNKNOWN BUTTON\n" + jsonPrint(e));
    }
    else if (controlIdHash[currentButton.id] === undefined) {
      console.error("UNKNOWN BUTTON NOT IN HASH\n" + jsonPrint(e));
    }
    else {
      var buttonConfig = controlIdHash[currentButton.id];
      console.log("BUTTON " + currentButton.id 
        + " : " + buttonConfig.mode
      );

      parentWindow.postMessage({op: buttonConfig.mode, id: currentButton.id}, DEFAULT_SOURCE);

      if (currentButton.id === "resetButton"){
        console.warn("RESET");
        self.setLinkStrengthSliderValue(parentWindow.DEFAULT_LINK_STRENGTH);
        self.setLinkDistanceSliderValue(parentWindow.DEFAULT_LINK_DISTANCE);
        self.setTransitionDurationSliderValue(parentWindow.DEFAULT_TRANSITION_DURATION);
        self.setGravitySliderValue(parentWindow.DEFAULT_GRAVITY);
        self.setChargeSliderValue(parentWindow.DEFAULT_CHARGE);
        self.setNodeRadiusMinRatioSliderValue(parentWindow.DEFAULT_NODE_RADIUS_MIN_RATIO);
        self.setNodeRadiusMaxRatioSliderValue(parentWindow.DEFAULT_NODE_RADIUS_MAX_RATIO);
        self.setVelocityDecaySliderValue(parentWindow.DEFAULT_VELOCITY_DECAY);
        self.setMaxAgeSliderValue(parentWindow.DEFAULT_MAX_AGE);
        self.setFontSizeMinRatioSliderValue(parentWindow.DEFAULT_FONT_SIZE_MIN_RATIO);
        self.setFontSizeMaxRatioSliderValue(parentWindow.DEFAULT_FONT_SIZE_MAX_RATIO);
      }
    }
  }

  function sliderHandler(e) {

    console.log("sliderHandler: " + e.target.id);
    var currentSlider = document.getElementById(e.target.id);
    currentSlider.multiplier = currentSlider.getAttribute("multiplier");

    var valMultRatio = currentSlider.value/currentSlider.multiplier;

    console.log("SLIDER " + currentSlider.id 
      + " | V: " + currentSlider.value 
      + " | M: " + currentSlider.multiplier 
      + " | VMR: " + valMultRatio.toFixed(3)
    );

    var currentSliderTextId = currentSlider.id + "Text";

    var v;
    switch (currentSlider.id) {
      case "nodeRadiusMinRatioSlider":
      case "nodeRadiusMaxRatioSlider":
        v = currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(3);
      break;
      case "fontSizeMinRatioSlider":
      case "fontSizeMaxRatioSlider":
        v = 100*currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(1) + " % H";
      break;
      case "gravitySlider":
        v = currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(5);
        console.log("gravitySlider: " + v);
      break;
      default:
        v = currentSlider.value/currentSlider.multiplier;
        document.getElementById(currentSliderTextId).innerHTML = v.toFixed(5);
        console.log("default slider: " + v);
    }

    parentWindow.postMessage({op:"UPDATE", id: currentSlider.id, value: (currentSlider.value/currentSlider.multiplier)}, DEFAULT_SOURCE);
  }

  window.addEventListener("input", function (e) {
    // console.log("keyup event detected! coming from this element:", e.target);
    switch (e.target.className) {
      case "slider":
        sliderHandler(e);
      break;
      default:
    }
  }, false);

  this.tableCreateRow = function (parentTable, options, cells) {

    var tr = parentTable.insertRow();
    var tdTextColor = options.textColor;
    var tdBgColor = options.backgroundColor || "white";

    var bHandler = buttonHandler;

    if (options.trClass) {
      tr.className = options.trClass;
    }

    if (options.headerFlag) {
      cells.forEach(function(content) {
        var th = tr.insertCell();
        th.appendChild(parentTable.parentNode.createTextNode(content));
        th.style.color = tdTextColor;
        th.style.backgroundColor = tdBgColor;
      });
    }
    else {
      cells.forEach(function(content) {

        var td = tr.insertCell();

        if (content.type === undefined) {

          td.appendChild(document.createTextNode(content));
          td.style.color = tdTextColor;
          td.style.backgroundColor = tdBgColor;
        } 
        else if (content.type === "TEXT") {

          td.className = content.class;
          td.setAttribute("id", content.id);
          td.style.color = tdTextColor;
          td.style.margin = "5px";
          td.style.padding = "5px";
          td.style.backgroundColor = tdBgColor;
          td.innerHTML = content.text;
          td.style.border = options.border || "none";
        } 
        else if (content.type === "BUTTON") {

          if (content.buttonHandler !== undefined) { bHandler = content.buttonHandler; }

          var buttonElement = document.createElement("BUTTON");
          buttonElement.className = content.class;
          buttonElement.setAttribute("id", content.id);
          if (content.displayNodeType !== undefined) { buttonElement.setAttribute("displayNodeType", content.displayNodeType); }
          buttonElement.setAttribute("mode", content.mode);
          buttonElement.addEventListener("click", function(e){ bHandler(e); }, false);
          buttonElement.innerHTML = content.text;
          td.appendChild(buttonElement);
          controlIdHash[content.id] = content;
        } 
        else if (content.type === "RADIO") {

          if (content.buttonHandler !== undefined) { bHandler = content.buttonHandler; }

          var radioButtonElement = document.createElement("BUTTON");
          radioButtonElement.className = content.class;
          radioButtonElement.type = "radio";
          radioButtonElement.setAttribute("name", content.name);
          radioButtonElement.setAttribute("id", content.id);
          radioButtonElement.setAttribute("value", content.value);
          radioButtonElement.setAttribute("checked", content.checked);
          radioButtonElement.addEventListener("click", function(e){ bHandler(e); }, false);
          radioButtonElement.innerHTML = content.text;

          td.appendChild(radioButtonElement);

          controlIdHash[content.id] = content;
        } 
        else if (content.type === "SLIDER") {

          var step = 1/content.multiplier;
          var sliderElement = document.createElement("INPUT");
          sliderElement.type = "range";
          sliderElement.className = content.class;
          sliderElement.setAttribute("id", content.id);
          sliderElement.setAttribute("min", content.min);
          sliderElement.setAttribute("max", content.max);
          sliderElement.setAttribute("multiplier", content.multiplier);
          sliderElement.setAttribute("step", step);
          sliderElement.value = content.value;
          td.appendChild(sliderElement);
          controlIdHash[content.id] = content;
        }
      });
    }
  };

  this.loadStoredConfig = function(callback) {

    var storedConfigName = "config_" + parentWindow.config.sessionViewType;

    console.debug("STORED CONFIG: " + storedConfigName);

    var storedConfig = store.get(storedConfigName);

    if (storedConfig !== undefined) {
      var storedConfigArgs = Object.keys(storedConfig);

      async.each(storedConfigArgs, function(arg, cb){

        config[arg] = storedConfig[arg];

        console.log("--> STORED CONFIG | " + arg + ": " + config[arg]);

        cb();

      }, function(){

        if (!config.twitterUser || !config.twitterUser.screenName) {
          console.warn("UNDEFINED config.twitterUser: " + jsonPrint(config.twitterUser));
          config.twitterUser = {};
          config.twitterUser.screenName = "threecee";
        }

        delete storedConfig.twitterUser.histograms;
        delete storedConfig.twitterUser.countHistory;
        delete storedConfig.twitterUser.status;

        console.log("CREATE CONTROL PANEL" 
          + " | " + config.twitterUser.screenName
          + " | " + config.twitterUser.threeceeFollowing
        );

        callback();

      });
    }
    else {

      console.warn("NO STORED CONFIGURATION");

      callback();
    }

  };

  this.createControlPanel = function(callback) {


    dashboardMain = document.getElementById("dashboardMain");
    infoTable = document.getElementById("infoTable");
    userStatsTable = document.getElementById("userStatsTable");
    controlTable = document.getElementById("controlTable");
    categoryTable = document.getElementById("categoryTable");
    displayControlTable = document.getElementById("displayControlTable");
    controlTableHead = document.getElementById("controlTableHead");
    controlTableBody = document.getElementById("controlTableBody");
    controlSliderTable = document.getElementById("controlSliderTable");

    var optionsBody = {
      headerFlag: false,
      textColor: "black",
      backgroundColor: "white"
    };

    var optionsUserStatsBody = {
      headerFlag: false,
      textColor: "black",
      backgroundColor: "white",
      border: "1x solid #aaaaaa"
    };

    var categoryLeftButton = {
      type: "RADIO",
      mode: "RADIO",
      name: "categoryRadio",
      id: "categoryLeft",
      class: "button",
      buttonHandler: categoryButtonHandler,
      value: "left",
      checked: false,
      text: "LEFT"
    };

    var categoryRightButton = {
      type: "RADIO",
      mode: "RADIO",
      name: "categoryRadio",
      id: "categoryRight",
      class: "button",
      buttonHandler: categoryButtonHandler,
      value: "right",
      checked: false,
      text: "RIGHT"
    };

    var categoryNeutralButton = {
      type: "RADIO",
      mode: "RADIO",
      name: "categoryRadio",
      id: "categoryNeutral",
      class: "button",
      buttonHandler: categoryButtonHandler,
      value: "neutral",
      checked: false,
      text: "NEUTRAL"
    };

    var categoryPositiveButton = {
      type: "RADIO",
      mode: "RADIO",
      name: "categoryRadio",
      id: "categoryPositive",
      class: "button",
      buttonHandler: categoryButtonHandler,
      value: "positive",
      checked: false,
      text: "POSITIVE"
    };

    var categoryNegativeButton = {
      type: "RADIO",
      mode: "RADIO",
      name: "categoryRadio",
      id: "categoryNegative",
      class: "button",
      buttonHandler: categoryButtonHandler,
      value: "negative",
      checked: false,
      text: "NEGATIVE"
    };

    var categoryNoneButton = {
      type: "RADIO",
      mode: "RADIO",
      name: "categoryRadio",
      id: "categoryNone",
      class: "button",
      buttonHandler: categoryButtonHandler,
      value: "none",
      checked: false,
      text: "NONE"
    };

    var resetButton = {
      type: "BUTTON",
      mode: "MOMENT",
      id: "resetButton",
      class: "button",
      text: "RESET"
    };

    var blahButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "blahToggleButton",
      class: "button",
      text: "BLAH"
    };

    var fullscreenButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "fullscreenToggleButton",
      class: "button",
      text: "FULLSCREEN"
    };

    var pauseButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "pauseToggleButton",
      class: "button",
      text: "PAUSE"
    };

    var statsButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "statsToggleButton",
      class: "button",
      text: "STATS"
    };

    var testModeButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "testModeToggleButton",
      class: "button",
      text: "TEST"
    };

    var antonymButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "antonymToggleButton",
      class: "button",
      text: "ANT"
    };

    var disableLinksButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "disableLinksToggleButton",
      class: "button",
      text: "LINKS"
    };

    var removeDeadNodeButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "removeDeadNodeToogleButton",
      class: "button",
      text: "DEAD"
    };

    var nodeCreateButton = {
      type: "BUTTON",
      mode: "MOMENT",
      id: "nodeCreateButton",
      class: "button",
      text: "NODE"
    };

    var showEmojiButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_emoji",
      displayNodeType: "emoji",
      class: "button",
      text: "EMOJI",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var showHashtagsButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_hashtag",
      displayNodeType: "hashtag",
      class: "button",
      text: "HASHTAGS",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var showMediaButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_media",
      displayNodeType: "media",
      class: "button",
      text: "MEDIA",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var showPlacesButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_place",
      displayNodeType: "place",
      class: "button",
      text: "PLACES",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var showUsersButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_user",
      displayNodeType: "user",
      class: "button",
      text: "USERS",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var showUrlsButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_url",
      displayNodeType: "url",
      class: "button",
      text: "URLS",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var showWordsButton = {
      type: "BUTTON",
      mode: "TOGGLE",
      id: "displayNodeType_word",
      displayNodeType: "word",
      class: "button",
      text: "WORDS",
      buttonHandler: toggleDisplayNodeTypeButtonHandler
    };

    var maxAgeSlider = {
      type: "SLIDER",
      id: "maxAgeSlider",
      class: "slider",
      min: 500,
      max: 120000,
      value: config.defaultMaxAge,
      multiplier: 1.0
    };

    var maxAgeSliderText = {
      type: "TEXT",
      id: "maxAgeSliderText",
      class: "sliderText",
      text: maxAgeSlider.value + " ms"
    };

    var fontSizeMinRatioSlider = {
      type: "SLIDER",
      id: "fontSizeMinRatioSlider",
      class: "slider",
      min: 0,
      max: 100,
      value: config.defaultFontSizeMinRatio * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var fontSizeMinRatioSliderText = {
      type: "TEXT",
      id: "fontSizeMinRatioSliderText",
      class: "sliderText",
      text: fontSizeMinRatioSlider.value + fontSizeMinRatioSlider.multiplier
    };

    var fontSizeMaxRatioSlider = {
      type: "SLIDER",
      id: "fontSizeMaxRatioSlider",
      class: "slider",
      min: 0,
      max: 100,
      value: config.defaultFontSizeMaxRatio * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var fontSizeMaxRatioSliderText = {
      type: "TEXT",
      id: "fontSizeMaxRatioSliderText",
      class: "sliderText",
      text: fontSizeMaxRatioSlider.value + fontSizeMaxRatioSlider.multiplier
    };

    var transitionDurationSlider = {
      type: "SLIDER",
      id: "transitionDurationSlider",
      class: "slider",
      min: 0,
      max: 100,
      value: config.defaultTransitionDuration,
      multiplier: 1.0
    };

    var transitionDurationSliderText = {
      type: "TEXT",
      id: "transitionDurationSliderText",
      class: "sliderText",
      text: (transitionDurationSlider.value * transitionDurationSlider.multiplier)
    };

    var chargeSlider = {
      type: "SLIDER",
      id: "chargeSlider",
      class: "slider",
      min: -1000,
      max: 1000,
      value: config.defaultCharge,
      multiplier: 1.0
    };

    var chargeSliderText = {
      type: "TEXT",
      id: "chargeSliderText",
      class: "sliderText",
      text: (chargeSlider.value * chargeSlider.multiplier)
    };

    var gravitySlider = {
      type: "SLIDER",
      id: "gravitySlider",
      class: "slider",
      min: 0.0,
      max: 20.0,
      value: config.defaultGravity * config.defaultMultiplier,
      // value: config.defaultGravity,
      // multiplier: 100.0
      multiplier: config.defaultMultiplier
    };

    var gravitySliderText = {
      type: "TEXT",
      id: "gravitySliderText",
      class: "sliderText",
      text: (gravitySlider.value * gravitySlider.multiplier)
    };

    var nodeRadiusMaxRatioSlider = {
      type: "SLIDER",
      id: "nodeRadiusMaxRatioSlider",
      class: "slider",
      min: 5.0,
      max: 500.0,
      value: config.defaultNodeRadiusMaxRatio * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var nodeRadiusMaxRatioSliderText = {
      type: "TEXT",
      id: "nodeRadiusMaxRatioSliderText",
      class: "sliderText",
      text: (nodeRadiusMaxRatioSlider.value * nodeRadiusMaxRatioSlider.multiplier)
    };

    var nodeRadiusMinRatioSlider = {
      type: "SLIDER",
      id: "nodeRadiusMinRatioSlider",
      class: "slider",
      min: 0.1,
      max: 20.0,
      value: config.defaultNodeRadiusMinRatio * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var nodeRadiusMinRatioSliderText = {
      type: "TEXT",
      id: "nodeRadiusMinRatioSliderText",
      class: "sliderText",
      text: (nodeRadiusMinRatioSlider.value * nodeRadiusMinRatioSlider.multiplier)
    };

    var velocityDecaySlider = {
      type: "SLIDER",
      id: "velocityDecaySlider",
      class: "slider",
      min: 0.0,
      max: 1000.0,
      value: config.defaultVelocityDecay * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var velocityDecaySliderText = {
      type: "TEXT",
      id: "velocityDecaySliderText",
      class: "sliderText",
      text: (velocityDecaySlider.value * velocityDecaySlider.multiplier)
    };

    var linkStrengthSlider = {
      type: "SLIDER",
      id: "linkStrengthSlider",
      class: "slider",
      min: 0.0,
      max: 1000,
      value: config.defaultLinkStrength * config.defaultMultiplier,
      multiplier: config.defaultMultiplier
    };

    var linkStrengthSliderText = {
      type: "TEXT",
      id: "linkStrengthSliderText",
      class: "sliderText",
      text: (linkStrengthSlider.value * linkStrengthSlider.multiplier)
    };

    var linkDistanceSlider = {
      type: "SLIDER",
      id: "linkDistanceSlider",
      class: "slider",
      min: 0.0,
      max: 100,
      value: config.defaultLinkDistance,
      multiplier: 1.0
    };

    var linkDistanceSliderText = {
      type: "TEXT",
      id: "linkDistanceSliderText",
      class: "sliderText",
      text: (linkDistanceSlider.value * linkDistanceSlider.multiplier)
    };

    var status = {
      type: "TEXT",
      id: "statusSessionId",
      class: "statusText",
      text: "SESSION ID: " + statsObj.socketId
    };

    var userScreenNameText = {
      type: "TEXT",
      id: "userScreenNameText",
      class: "userStatusText",
      text: "@" + statsObj.user.screenName
    };

    var userNameText = {
      type: "TEXT",
      id: "userNameText",
      class: "userStatusText",
      text: statsObj.user.name
    };

    var userCreatedAtText = {};
    userCreatedAtText.type = "TEXT";
    userCreatedAtText.id = "userCreatedAtText";
    userCreatedAtText.class = "userStatusText";
    userCreatedAtText.text = statsObj.user.createdAt;

    var userCreatedAtLabel = {};
    userCreatedAtLabel.type = "TEXT";
    userCreatedAtLabel.id = "userCreatedAtLabel";
    userCreatedAtLabel.class = "userStatusText";
    userCreatedAtLabel.text = "CREATED";

    var userLastSeenText = {};
    userLastSeenText.type = "TEXT";
    userLastSeenText.id = "userLastSeenText";
    userLastSeenText.class = "userStatusText";
    userLastSeenText.text = statsObj.user.lastSeen;

    var userLastSeenLabel = {};
    userLastSeenLabel.type = "TEXT";
    userLastSeenLabel.id = "userLastSeenLabel";
    userLastSeenLabel.class = "userStatusText";
    userLastSeenLabel.text = "LAST SEEN";

    var userIdText = {};
    userIdText.type = "TEXT";
    userIdText.id = "userIdText";
    userIdText.class = "userStatusText";
    userIdText.text = statsObj.user.nodeId;

    var userIdLabel = {};
    userIdLabel.type = "TEXT";
    userIdLabel.id = "userIdLabel";
    userIdLabel.class = "userStatusText";
    userIdLabel.text = "ID";

    var userDescriptionText = {};
    userDescriptionText.type = "TEXT";
    userDescriptionText.id = "userDescriptionText";
    userDescriptionText.class = "userStatusText";
    userDescriptionText.text = statsObj.user.description;

    var userDescriptionLabel = {};
    userDescriptionLabel.type = "TEXT";
    userDescriptionLabel.id = "userDescriptionLabel";
    userDescriptionLabel.class = "userStatusText";
    userDescriptionLabel.text = "DESCRIPTION";

    var userFollowersCountText = {};
    userFollowersCountText.type = "TEXT";
    userFollowersCountText.id = "userFollowersCountText";
    userFollowersCountText.class = "userStatusText";
    userFollowersCountText.text = statsObj.user.followersCount;

    var userFollowersCountLabel = {};
    userFollowersCountLabel.type = "TEXT";
    userFollowersCountLabel.id = "userFollowersCountLabel";
    userFollowersCountLabel.class = "userStatusText";
    userFollowersCountLabel.text = "FOLLOWERS";


    var userFriendsCountText = {
      type: "TEXT",
      id: "userFriendsCountText",
      class: "userStatusText",
      text: statsObj.user.friendsCount
    };

    var userFriendsCountLabel = {};
    userFriendsCountLabel.type = "TEXT";
    userFriendsCountLabel.id = "userFriendsCountLabel";
    userFriendsCountLabel.class = "userStatusText";
    userFriendsCountLabel.text = "FRIENDS";

    var userMentionsText = {
      type: "TEXT",
      id: "userMentionsText",
      class: "userStatusText",
      text: statsObj.user.mentions
    };

    var userMentionsLabel = {};
    userMentionsLabel.type = "TEXT";
    userMentionsLabel.id = "userMentionsLabel";
    userMentionsLabel.class = "userStatusText";
    userMentionsLabel.text = "MENTIONS";

    var userStatusesCountText = {
      type: "TEXT",
      id: "userStatusesCountText",
      class: "userStatusText",
      text: statsObj.user.statusesCount
    };

    var userStatusesCountLabel = {};
    userStatusesCountLabel.type = "TEXT";
    userStatusesCountLabel.id = "userStatusesCountLabel";
    userStatusesCountLabel.class = "userStatusText";
    userStatusesCountLabel.text = "TWEETS";

    var user3cFollowingText = {
      type: "TEXT",
      id: "user3cFollowingText",
      class: "userStatusText",
      text: statsObj.user.threeceeFollowing
    };

    var user3cFollowingLabel = {};
    user3cFollowingLabel.type = "TEXT";
    user3cFollowingLabel.id = "user3cFollowingLabel";
    user3cFollowingLabel.class = "userStatusText";
    user3cFollowingLabel.text = "3C FOLLOW";

    var userCategoryText = {
      type: "TEXT",
      id: "userCategoryText",
      class: "userStatusText",
      text: "M: " + statsObj.user.category + " | A: " + statsObj.user.categoryAuto
    };

    var userCategoryLabel = {};
    userCategoryLabel.type = "TEXT";
    userCategoryLabel.id = "userCategoryLabel";
    userCategoryLabel.class = "userStatusText";
    userCategoryLabel.text = "CATEGORY";

    switch (config.sessionViewType) {

      case "force":
      case "flow":
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            pauseButton, 
            statsButton, 
            testModeButton, 
            nodeCreateButton, 
            removeDeadNodeButton, 
            disableLinksButton,
            blahButton,
            antonymButton,
            fullscreenButton
          ]);
        self.tableCreateRow(controlTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MIN", fontSizeMinRatioSlider, fontSizeMinRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MAX", fontSizeMaxRatioSlider, fontSizeMaxRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["CHARGE", chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["GRAVITY", gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["RADIUS MIN", nodeRadiusMinRatioSlider, nodeRadiusMinRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["RADIUS MAX", nodeRadiusMaxRatioSlider, nodeRadiusMaxRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["VEL DECAY", velocityDecaySlider, velocityDecaySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["LINK STRENGTH", linkStrengthSlider, linkStrengthSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["LINK DISTANCE", linkDistanceSlider, linkDistanceSliderText]);
        if (callback) { callback(dashboardMain); }
        break;
      case "treepack":
        self.tableCreateRow(controlTable, optionsBody, [resetButton, pauseButton, statsButton, fullscreenButton]);
        self.tableCreateRow(
          categoryTable, 
          optionsBody, 
          [
            categoryLeftButton, 
            categoryNeutralButton, 
            categoryRightButton, 
            categoryPositiveButton, 
            categoryNegativeButton,
            categoryNoneButton
          ]
        );
        self.tableCreateRow(displayControlTable, optionsBody, 
          [
            showEmojiButton,
            showHashtagsButton,
            showMediaButton,
            showPlacesButton,
            showUrlsButton,
            showUsersButton,
            showWordsButton
          ]
        );
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userScreenNameText, userNameText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userIdLabel, userIdText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userCreatedAtLabel, userCreatedAtText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userLastSeenLabel, userLastSeenText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userDescriptionLabel, userDescriptionText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userCategoryLabel, userCategoryText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userFollowersCountLabel, userFollowersCountText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userFriendsCountLabel, userFriendsCountText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userMentionsLabel, userMentionsText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [userStatusesCountLabel, userStatusesCountText]);
        self.tableCreateRow(userStatsTable, optionsUserStatsBody, [user3cFollowingLabel, user3cFollowingText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MIN", fontSizeMinRatioSlider, fontSizeMinRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["FONT MAX", fontSizeMaxRatioSlider, fontSizeMaxRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["TRANSITION", transitionDurationSlider, transitionDurationSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["CHARGE", chargeSlider, chargeSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["GRAVITY", gravitySlider, gravitySliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["RADIUS MIN", nodeRadiusMinRatioSlider, nodeRadiusMinRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["RADIUS MAX", nodeRadiusMaxRatioSlider, nodeRadiusMaxRatioSliderText]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["VEL DECAY", velocityDecaySlider, velocityDecaySliderText]);
        if (callback) { callback(dashboardMain); }
        break;

      case "ticker":
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, 
            testModeButton, 
            nodeCreateButton, 
            removeDeadNodeButton, 
            disableLinksButton, 
            antonymButton
          ]
        );
        self.tableCreateRow(controlTable, optionsBody, [resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        if (callback) { callback(dashboardMain); }
        break;

      case "histogram":
        self.tableCreateRow(controlTable, optionsBody, 
          [
            blahButton,
            resetButton,
            fullscreenButton, 
            pauseButton, 
            statsButton, 
            removeDeadNodeButton,
            testModeButton, 
            antonymButton
          ]
        );
        // self.tableCreateRow(controlSliderTable, optionsBody, [blahButton, resetButton]);
        self.tableCreateRow(controlSliderTable, optionsBody, ["MAX AGE", maxAgeSlider, maxAgeSliderText]);
        if (callback) { callback(dashboardMain); }

        break;

      default:
        self.tableCreateRow(controlTable, optionsBody, [status]);
        self.tableCreateRow(controlTable, 
          optionsBody, 
          [
            fullscreenButton, 
            pauseButton, 
            statsButton, testModeButton, resetButton, nodeCreateButton, removeDeadNodeButton]);
        if (callback) { callback(dashboardMain); }
    }
  };

  this.updateControlPanel = function (config, callback) {

    console.log("UPDATE CONTROL PANEL");

    if (controlIdHash.blahToggleButton) {
      if (config.blahMode) {
        document.getElementById("blahToggleButton").style.color = "red";
        document.getElementById("blahToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("blahToggleButton").style.color = "#888888";
        document.getElementById("blahToggleButton").style.border = "1px solid white";
      }
    }

    if (controlIdHash.antonymToggleButton) {
      if (config.antonymFlag) {
        document.getElementById("antonymToggleButton").style.color = "red";
        document.getElementById("antonymToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("antonymToggleButton").style.color = "#888888";
        document.getElementById("antonymToggleButton").style.border = "1px solid white";
      }
    }

    if (config.pauseFlag) {
      document.getElementById("pauseToggleButton").style.color = "red";
      document.getElementById("pauseToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("pauseToggleButton").style.color = "#888888";
      document.getElementById("pauseToggleButton").style.border = "1px solid white";
    }

    if (config.showStatsFlag) {
      document.getElementById("statsToggleButton").style.color = "red";
      document.getElementById("statsToggleButton").style.border = "2px solid red";
    } else {
      document.getElementById("statsToggleButton").style.color = "#888888";
      document.getElementById("statsToggleButton").style.border = "1px solid white";
    }

    if ((config.sessionViewType === "force") || (config.sessionViewType === "flow")){  
      if (config.disableLinks) {
        document.getElementById("disableLinksToggleButton").style.color = "red";
        document.getElementById("disableLinksToggleButton").style.border = "2px solid red";
      } else {
        document.getElementById("disableLinksToggleButton").style.color = "#888888";
        document.getElementById("disableLinksToggleButton").style.border = "1px solid white";
      }
    }

    if (callback) { callback(); }
  };

  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG\n" + jsonPrint(config) );

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update
        self.updateControlPanel(config, function(){
          if (parentWindow !== undefined) {
            window.addEventListener("message", receiveMessage, false);

            setTimeout(function(){

              console.log("TX PARENT READY " + DEFAULT_SOURCE);

              parentWindow.postMessage({op:"READY"}, DEFAULT_SOURCE);

              if (!twttr || !twttr.widgets) {

                var waitTwitterWidgetsInterval;

                waitTwitterWidgetsInterval = setInterval(function(){

                  if (twttr && twttr.widgets){
                    clearInterval(waitTwitterWidgetsInterval);
                    twttr.widgets.load();              
                  }

                }, 100);

              }
              else {
                twttr.widgets.load();              
              }
            }, 1000);

          }
          else {
            console.error("PARENT WINDOW UNDEFINED??");
          }
        });
      }, 2000);

    });
  });
}