/*jslint node: true */


/* jshint undef: true, unused: true */
/* globals store, $, window, twttr, Element, document, moment */

function ControlPanel() {
  "use strict";

  // var DEFAULT_SOURCE = "http://localhost:9997";
  var DEFAULT_SOURCE = "https://word.threeceelabs.com";

  var parentWindow = window.opener;
  console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
  var self = this;

  var compactDateTimeFormat = "YYYYMMDD HHmmss";

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
  var controlTable;
  var controlTableHead;
  var controlTableBody;
  var controlSliderTable;

  // var twitterFeedDiv = d3.select("#twitterFeedDiv");
  var timelineDiv = document.getElementById("timelineDiv");

  var hashtagDiv =document.getElementById("hashtagDiv");

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

  twitterCategorySearchDiv.appendChild(nextMismatchedButton);

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

  twitterCategorySearchDiv.appendChild(nextUncategorizedButton);

  //--------------

  function followButtonHandler(e){
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

  twitterCategorySearchDiv.appendChild(followButton);

  //--------------

  function updateCategoryRadioButtons(category, callback){

    console.log("updateCategoryRadioButtons | " + category);

    if (category === undefined || !category) {
      category = "none";
    }

    var element;

    document.getElementById("categoryLeft").setAttribute("checked", false);
    document.getElementById("categoryRight").setAttribute("checked", false);
    document.getElementById("categoryNeutral").setAttribute("checked", false);
    document.getElementById("categoryPositive").setAttribute("checked", false);
    document.getElementById("categoryNegative").setAttribute("checked", false);
    document.getElementById("categoryNone").setAttribute("checked", true);

    switch(category) {
      case "left":
        element = document.getElementById("categoryLeft");
        element.checked = true;
        callback();
      break;
      case "right":
        element = document.getElementById("categoryRight");
        element.checked = true;
        callback();
      break;
      case "neutral":
        element = document.getElementById("categoryNeutral");
        element.checked = true;
        callback();
      break;
      case "positive":
        element = document.getElementById("categoryPositive");
        element.checked = true;
        callback();
      break;
      case "negative":
        element = document.getElementById("categoryNegative");
        element.checked = true;
        callback();
      break;
      case "-":
        element = document.getElementById("categoryNone");
        element.checked = true;
        callback();
      break;
      case "none":
        element = document.getElementById("categoryNone");
        element.checked = true;
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

      if (twttr) {
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

  function loadTwitterFeed(node) {

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
        });
      });
    }
  }

  var displayNodeTypeButtonsDiv = document.getElementById("displayNodeTypeButtonsDiv");

  function toggleButtonHandler(e){

    var currentButton = document.getElementById(e.target.id);

    const newValue = (currentButton.getAttribute("value") === "hide") ? "show" : "hide";

    currentButton.setAttribute("value", newValue);

    console.warn("DISPLAY NODE TYPE BUTTON"
     + " | ID: " + e.target.id
     + " | NODE TYPE: " + currentButton.getAttribute("nodeType")
     + " | VALUE: " + currentButton.value
    );

    switch (e.target.id){
      case "emoji":
        console.log("EMOJI: " + newValue);
        config.displayEnabled[currentButton.getAttribute("nodeType")] = newValue;
      break;
      case "user":
        console.log("USER: " + newValue);
        config.displayEnabled[currentButton.getAttribute("nodeType")] = newValue;
      break;
    }

    parentWindow.postMessage(
      {
        op: "DISPLAY_NODE_TYPE", 
        nodeType: currentButton.getAttribute("nodeType"), 
        value: currentButton.getAttribute("value")
      }, 
      DEFAULT_SOURCE
    );
  }

  function createDisplayNodeTypeButton(params, callback){

    var displayNodeTypeLabel = document.createElement("label");

    displayNodeTypeLabel.setAttribute("class", "displayNodeTypeLabel");
    displayNodeTypeLabel.innerHTML = params.label || params.nodeType.toUpperCase();

    const id = params.id || "displayNodeType_" + params.nodeType.toLowerCase();
    const nodeType = params.nodeType.toLowerCase();
    const value = params.value || "hide";

    var displayNodeType = document.createElement("INPUT");
    displayNodeType.setAttribute("class", "button");
    displayNodeType.setAttribute("type", "button");
    displayNodeType.setAttribute("nodeType", nodeType);
    displayNodeType.setAttribute("id", id);
    displayNodeType.setAttribute("value", value);
    displayNodeType.addEventListener("click", function(e){ toggleButtonHandler(e); }, false);
    displayNodeType.appendChild(displayNodeTypeLabel);

    displayNodeTypeButtonsDiv.appendChild(displayNodeType);

    if (callback !== undefined) { callback(); }
  }

  this.setDisplayNodeType = function(params, callback){

    const id = params.id || "displayNodeType_" + params.nodeType.toLowerCase();
    const value = params.value || "hide";

    console.log("SET DISPLAY NODE TYPE | " + params.nodeType + " | " + value);

    var displayNodeType = document.getElementById(id);
    displayNodeType.setAttribute("value", value);

    if (callback !== undefined) { callback(); }
  };

  createDisplayNodeTypeButton({nodeType: "emoji"});
  createDisplayNodeTypeButton({nodeType: "hashtag"});
  createDisplayNodeTypeButton({nodeType: "media"});
  createDisplayNodeTypeButton({nodeType: "place"});
  createDisplayNodeTypeButton({nodeType: "url"});
  createDisplayNodeTypeButton({nodeType: "user"});
  createDisplayNodeTypeButton({nodeType: "word"});

  var twitterCategoryButtonsDiv = document.getElementById("twitterCategoryButtonsDiv");

  function categoryButtonHandler(e){

    var currentButton = document.getElementById(e.target.id);
    currentButton.setAttribute("checked", true);
    var category = false;

    console.warn("CATEGORY BUTTON"
     + " | ID: " + e.target.id
     + "\n" + jsonPrint(e.target)
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

  var categoryLeftLabel = document.createElement("label");
  categoryLeftLabel.setAttribute("class", "categoryButtonLabel");
  categoryLeftLabel.innerHTML = "LEFT";

  var categoryLeft = document.createElement("INPUT");
  categoryLeft.setAttribute("class", "categoryButton");
  categoryLeft.setAttribute("type", "radio");
  categoryLeft.setAttribute("name", "category");
  categoryLeft.setAttribute("id", "categoryLeft");
  categoryLeft.setAttribute("value", "left");
  categoryLeft.setAttribute("checked", false);
  categoryLeft.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);
  categoryLeftLabel.appendChild(categoryLeft);

  var categoryNeutralLabel = document.createElement("label");
  categoryNeutralLabel.setAttribute("class", "categoryButtonLabel");
  categoryNeutralLabel.innerHTML = "NEUTRAL";

  var categoryNeutral = document.createElement("INPUT");
  categoryNeutral.setAttribute("class", "categoryButton");
  categoryNeutral.setAttribute("type", "radio");
  categoryNeutral.setAttribute("name", "category");
  categoryNeutral.setAttribute("id", "categoryNeutral");
  categoryNeutral.setAttribute("value", "neutral");
  categoryNeutral.setAttribute("checked", false);
  categoryNeutral.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);
  categoryNeutralLabel.appendChild(categoryNeutral);

  var categoryRightLabel = document.createElement("label");
  categoryRightLabel.setAttribute("class", "categoryButtonLabel");
  categoryRightLabel.innerHTML = "RIGHT";

  var categoryRight = document.createElement("INPUT");
  categoryRight.setAttribute("class", "categoryButton");
  categoryRight.setAttribute("type", "radio");
  categoryRight.setAttribute("name", "category");
  categoryRight.setAttribute("id", "categoryRight");
  categoryRight.setAttribute("value", "right");
  categoryRight.setAttribute("checked", false);
  categoryRight.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);
  categoryRightLabel.appendChild(categoryRight);

  var categoryPositiveLabel = document.createElement("label");
  categoryPositiveLabel.setAttribute("class", "categoryButtonLabel");
  categoryPositiveLabel.innerHTML = "POSITIVE";

  var categoryPositive = document.createElement("INPUT");
  categoryPositive.setAttribute("class", "categoryButton");
  categoryPositive.setAttribute("type", "radio");
  categoryPositive.setAttribute("name", "category");
  categoryPositive.setAttribute("id", "categoryPositive");
  categoryPositive.setAttribute("value", "positive");
  categoryPositive.setAttribute("checked", false);
  categoryPositive.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);
  categoryPositiveLabel.appendChild(categoryPositive);

  var categoryNegativeLabel = document.createElement("label");
  categoryNegativeLabel.setAttribute("class", "categoryButtonLabel");
  categoryNegativeLabel.innerHTML = "NEGATIVE";

  var categoryNegative = document.createElement("INPUT");
  categoryNegative.setAttribute("class", "categoryButton");
  categoryNegative.setAttribute("type", "radio");
  categoryNegative.setAttribute("name", "category");
  categoryNegative.setAttribute("id", "categoryNegative");
  categoryNegative.setAttribute("value", "negative");
  categoryNegative.setAttribute("checked", false);
  categoryNegative.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);
  categoryNegativeLabel.appendChild(categoryNegative);

  var categoryNoneLabel = document.createElement("label");
  categoryNoneLabel.setAttribute("class", "categoryButtonLabel");
  categoryNoneLabel.innerHTML = "NONE";

  var categoryNone = document.createElement("INPUT");
  categoryNone.setAttribute("class", "categoryButton");
  categoryNone.setAttribute("type", "radio");
  categoryNone.setAttribute("name", "category");
  categoryNone.setAttribute("id", "categoryNone");
  categoryNone.setAttribute("value", false);
  categoryNone.setAttribute("checked", false);
  categoryNone.addEventListener("click", function(e){ categoryButtonHandler(e); }, false);
  categoryNoneLabel.appendChild(categoryNone);

  twitterCategoryButtonsDiv.appendChild(categoryLeftLabel);
  twitterCategoryButtonsDiv.appendChild(categoryNeutralLabel);
  twitterCategoryButtonsDiv.appendChild(categoryRightLabel);
  twitterCategoryButtonsDiv.appendChild(categoryPositiveLabel);
  twitterCategoryButtonsDiv.appendChild(categoryNegativeLabel);
  twitterCategoryButtonsDiv.appendChild(categoryNoneLabel);


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
          Object.keys(cnf.displayNodeHashMap).forEach(function(nodeType){
            self.setDisplayNodeType({nodeType: nodeType, value: cnf.displayNodeHashMap[nodeType]});
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
        loadTwitterFeed(currentTwitterNode);
      break;

      case "SET_TWITTER_HASHTAG":
        currentTwitterNode = event.data.hashtag;
        console.debug("SET TWITTER HASHTAG\n" + jsonPrint(currentTwitterNode));
        loadTwitterFeed(currentTwitterNode);
      break;
    }
  }

  window.addEventListener("load", function() {
    console.warn("WINDOW LOAD");
  }, false);

  window.addEventListener("message", receiveMessage, false);

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
    } else {
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

          var buttonElement = document.createElement("BUTTON");
          buttonElement.className = content.class;
          buttonElement.setAttribute("id", content.id);
          buttonElement.setAttribute("mode", content.mode);
          buttonElement.addEventListener("click", function(e){ buttonHandler(e); }, false);
          buttonElement.innerHTML = content.text;
          td.appendChild(buttonElement);
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

  this.createControlPanel = function(callback) {

    var storedConfigName = "config_" + parentWindow.config.sessionViewType;

    console.debug("STORED CONFIG: " + storedConfigName);
    var storedConfig = store.get(storedConfigName);
    delete storedConfig.twitterUser.histograms;
    delete storedConfig.twitterUser.countHistory;
    delete storedConfig.twitterUser.status;

    if (storedConfig !== undefined) {
      var storedConfigArgs = Object.keys(storedConfig);

      storedConfigArgs.forEach(function(arg){
        config[arg] = storedConfig[arg];
        console.log("--> STORED CONFIG | " + arg + ": " + config[arg]);
      });
    }

    console.log("CREATE CONTROL PANEL" 
      + " | " + config.twitterUser.screenName
      + " | " + config.twitterUser.threeceeFollowing
    );

    dashboardMain = document.getElementById("dashboardMain");
    infoTable = document.getElementById("infoTable");
    userStatsTable = document.getElementById("userStatsTable");
    controlTable = document.getElementById("controlTable");
    controlTableHead = document.getElementById("controlTableHead");
    controlTableBody = document.getElementById("controlTableBody");
    controlSliderTable = document.getElementById("controlSliderTable");

    // var optionsHead = {
    //   headerFlag: true,
    //   textColor: "black",
    //   backgroundColor: "white"
    // };

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

    // console.log("config\n" + jsonPrint(config));

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
            setTimeout(function(){
              console.log("TX PARENT READY " + DEFAULT_SOURCE);
              parentWindow.postMessage({op:"READY"}, DEFAULT_SOURCE);
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