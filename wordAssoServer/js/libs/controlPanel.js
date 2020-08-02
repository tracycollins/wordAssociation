function ControlPanel() {
  "use strict";

  const ONE_SECOND = 1000;
  const ONE_MINUTE = 60*ONE_SECOND;
  const ONE_HOUR = 60*ONE_MINUTE;
  const ONE_DAY = 24*ONE_HOUR;

  const compactDateTimeFormat = "YYYYMMDD HHmmss";

  const PRODUCTION_SOURCE = "https://word.threeceelabs.com";
  const LOCAL_SOURCE = "http://localhost:9997";

  const DEFAULT_SOURCE = REPLACE_SOURCE;

  const DEFAULT_TWITTER_IMAGE = "https://word.threeceelabs.com/public/assets/images/twitterEgg.png";

	var parentWindow = window.opener;
	console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
	var self = this;

  var statsPanel;

  var displayControlHashMap = {};

  var displayControl;

  var twitterControl;

  var twitterEntity;

	var twitterTimeLine;

  var currentUser = "threecee";

  const defaultTwitterFeedUser = {};
  defaultTwitterFeedUser.ageDays = 0;
  defaultTwitterFeedUser.category = "---";
  defaultTwitterFeedUser.categoryAuto = "---";
  defaultTwitterFeedUser.description = "---";
  defaultTwitterFeedUser.followersCount = 0;
  defaultTwitterFeedUser.following = false;
  defaultTwitterFeedUser.friendsCount = 0;
  defaultTwitterFeedUser.ignored = false;
  defaultTwitterFeedUser.isBot = false;
  defaultTwitterFeedUser.location = "---";
  defaultTwitterFeedUser.mentions = 0;
  defaultTwitterFeedUser.name = "---";
  defaultTwitterFeedUser.nodeId = "---";
  defaultTwitterFeedUser.profileImageUrl = "";
  defaultTwitterFeedUser.screenName = "@";
  defaultTwitterFeedUser.statusesCount = 0;
  defaultTwitterFeedUser.tweetsPerDay = 0;
  defaultTwitterFeedUser.userId = "---";

  var twitterFeedUser = Object.assign({}, defaultTwitterFeedUser);

  let statsObj = {};

  statsObj.bestNetwork = {};
  statsObj.bestNetwork.networkId = false;
  statsObj.bestNetwork.succesRate = false;
  statsObj.bestNetwork.overallMatchRate = false;
  statsObj.bestNetwork.inputsId = false;

  statsObj.socketId = "NOT SET";

  statsObj.uncategorized = {};
  statsObj.uncategorized.all = 0;
  statsObj.uncategorized.left = 0;
  statsObj.uncategorized.right = 0;
  statsObj.uncategorized.neutral = 0;

  statsObj.categorized = {};
  statsObj.categorized.all = 0;
  statsObj.categorized.left = 0;
  statsObj.categorized.right = 0;
  statsObj.categorized.neutral = 0;

  statsObj.mismatched = 0;

  statsObj.user = {};
  statsObj.user = defaultTwitterFeedUser;


  var twitterFeedPreviousUser = false;
  const twitterFeedPreviousUserArray = [];
  const twitterFeedPreviousUserMap = {};
  var twitterFeedHashtag = {};
  var twitterFeedPreviousHashtag = {};
  var loadingTwitterFeedFlag = false;

  var nodeTypesSet = new Set();
  nodeTypesSet.add("emoji");
  nodeTypesSet.add("hashtag");
  nodeTypesSet.add("location");
  nodeTypesSet.add("media");
  nodeTypesSet.add("place");
  nodeTypesSet.add("url");
  nodeTypesSet.add("user");
  nodeTypesSet.add("word");

  var config = {};
  var currentTwitterNode;

  config = window.opener.config;

  const DEFAULT_RANGE_STEPS = 1000;

  config.defaultRangeSteps = DEFAULT_RANGE_STEPS;

  const DEFAULT_MAX_NODES = 50;
  const DEFAULT_MAX_NODES_MIN = 10;
  const DEFAULT_MAX_NODES_MAX = 500;

  const DEFAULT_NODE_RADIUS_RATIO_MIN = 0.0020;
  const DEFAULT_NODE_RADIUS_RATIO_MIN_MIN = 0.0;
  const DEFAULT_NODE_RADIUS_RATIO_MIN_MAX = 0.1;

  const DEFAULT_NODE_RADIUS_RATIO_MAX = 0.2;
  const DEFAULT_NODE_RADIUS_RATIO_MAX_MIN = 0.1;
  const DEFAULT_NODE_RADIUS_RATIO_MAX_MAX = 0.5;

  const DEFAULT_FONT_SIZE_RATIO_MIN = 0.050;
  const DEFAULT_FONT_SIZE_RATIO_MIN_MIN = 0.0;
  const DEFAULT_FONT_SIZE_RATIO_MIN_MAX = 0.100;

  const DEFAULT_FONT_SIZE_RATIO_MAX = 0.100	;
  const DEFAULT_FONT_SIZE_RATIO_MAX_MIN = 0.0;
  const DEFAULT_FONT_SIZE_RATIO_MAX_MAX = 0.250;

  const DEFAULT_MAX_AGE = 15*ONE_SECOND;
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

  config.range = {};

  const rangeInputs =[
    "charge",
    "fontSizeRatioMax",
    "fontSizeRatioMin",
    "gravity", 
    "maxAge",
    "maxNodes", 
    "nodeRadiusRatioMax",
    "nodeRadiusRatioMin", 
    "velocityDecay"
  ];

  rangeInputs.forEach(function(rangeInput){
    config.range[rangeInput] = {};
    config.range[rangeInput].name = rangeInput;
    config.range[rangeInput].default = eval("DEFAULT_" + changeCase.constantCase(rangeInput));
    config.range[rangeInput].min = eval("DEFAULT_" + changeCase.constantCase(rangeInput) + "_MIN");
    config.range[rangeInput].max = eval("DEFAULT_" + changeCase.constantCase(rangeInput) + "_MAX");
  });

  console.log("CONFIG RANGE INPUTS\n", config.range);

  delete config.twitterUser.histograms;
  delete config.twitterUser.countHistory;
  delete config.twitterUser.status;

  var eventDetected = false;

  var categories = [
  	"left",
  	"neutral",
  	"right",
  	"positive",
  	"negative",
  	"none",
  ];

  var palette = {
    "black": "#000000",
    "white": "#FFFFFF",
    "lightgray": "#AAAAAA",
    "gray": "#888888",
    "mediumgray": "#536870",
    "darkgray": "#475B62",
    "darkblue": "#0A2933",
    "darkerblue": "#042029",
    "lightblue": "#A6E0FF",
    "paleryellow": "#FCF4DC",
    "paleyellow": "#EAE3CB",
    "yellow": "#A57706",
    "lightyellow": "#F2EC8F",
    "darkyellow": "#846608",
    "orange": "#BD3613",
    "red": "#D11C24",
    "pink": "#C61C6F",
    "purple": "#595AB7",
    "blue": "#4808FF",
    "green": "#00E540",
    "darkergreen": "#008200",
    // "lightgreen": "#35A296",
    "lightgreen": "#70E684",
    "yellowgreen": "#738A05"
  };

  function getTimeStamp(inputTime) {

    let currentTimeStamp;

    if (inputTime === undefined) {
      currentTimeStamp = moment().format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else if (moment.isMoment(inputTime)) {
      currentTimeStamp = moment(inputTime).format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else if (moment(new Date(inputTime)).isValid()) {
      currentTimeStamp = moment(new Date(inputTime)).format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else if (moment(parseInt(inputTime)).isValid()) {
      currentTimeStamp = moment(parseInt(inputTime)).format(compactDateTimeFormat);
      return currentTimeStamp;
    }
    else {
      console.log(chalkAlert("WAS | *** getTimeStamp INVALID DATE: " + inputTime));
      return null;
    }
  }

  var nextMismatchHandler = function(op){
    // need to debounce button click
    if (eventDetected) {
      return;
    }
    eventDetected = true;

    var searchFilter = "@?mm";

    console.debug("BUTTON: NEXT MISMATCH | searchFilter: " + searchFilter);

    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: searchFilter}, DEFAULT_SOURCE); }

    setTimeout(function(){
      eventDetected = false;
    }, 100);

  };

  var nextUncatHandler = function(op){
    // need to debounce button click
    if (eventDetected) {
      return;
    }
    eventDetected = true;

    var searchFilter = "@?";

    switch (op){
      case "NEXT UNCAT ALL":
        searchFilter += "all"; 
        break;
      case "NEXT UNCAT LEFT":
        searchFilter += "left"; 
        break;
      case "NEXT UNCAT RIGHT":
        searchFilter += "right"; 
        break;
      case "NEXT UNCAT NEUTRAL":
        searchFilter += "neutral"; 
        break;
      default:
    }

    console.debug("BUTTON: " + op + " | searchFilter: " + searchFilter);

    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: searchFilter}, DEFAULT_SOURCE); }

    setTimeout(function(){
      eventDetected = false;
    }, 100);
  };

  var previousUserHandler = function(op){

    if (eventDetected) {
      return;
    }
    eventDetected = true;

    if (parentWindow && !loadingTwitterFeedFlag && twitterFeedPreviousUserArray.length > 0) {
      const prevUserNodeId = twitterFeedPreviousUserArray.pop();
      const prevUserObj = twitterFeedPreviousUserMap[prevUserNodeId];
      const prevUserScreenname = "@" + prevUserObj.screenName;
      parentWindow.postMessage({op: "NODE_SEARCH", input: prevUserScreenname}, DEFAULT_SOURCE);
      twitterFeedPreviousUserMap[prevUserNodeId] = null;
    }

    setTimeout(function(){
      eventDetected = false;
    }, 100);
  };

  var ignoreHandler = function(op){

    if (eventDetected) {
      return;
    }
    eventDetected = true;

    if (parentWindow && !loadingTwitterFeedFlag) { 
      parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE); 
    }

    setTimeout(function(){
      eventDetected = false;
    }, 100);
  };

  var catVerifiedHandler = function(op){

    if (eventDetected) {
      return;
    }
    eventDetected = true;
    if (parentWindow && !loadingTwitterFeedFlag) { 
      parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE);
    }

    setTimeout(function(){
      eventDetected = false;
    }, 100);

  };

  function jsonPrint(obj) {
    if ((obj) || (obj === 0)) {
      var jsonString = JSON.stringify(obj, null, 2);
      return jsonString;
    } else {
      return "UNDEFINED";
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

  var nodeName;
  var categoryVerified;
  var category;
  var categoryAuto;

  function twitterWidgetsCreateTimeline(node, callback){

    if (node.notFound !== undefined) {
      callback(null, null);
    }
    else {

      nodeName = (node.name !== undefined) ? node.name : "---";

      categoryVerified = node.categoryVerified || false;
      category = node.category || "none";
      categoryAuto = node.categoryAuto || "none";

      statsObj.user.userId = node.userId;
      statsObj.user.nodeId = node.nodeId;
      statsObj.user.name = nodeName;
      statsObj.user.screenName = node.screenName;
      statsObj.user.location = node.location;
      statsObj.user.description = node.description;
      statsObj.user.categoryVerified = categoryVerified;
      statsObj.user.category = category;
      statsObj.user.categoryAuto = categoryAuto;
      statsObj.user.followersCount = node.followersCount;
      statsObj.user.friendsCount = node.friendsCount;
      statsObj.user.statusesCount = node.statusesCount;
      statsObj.user.ignored = node.ignored;
      statsObj.user.following = node.following;
      statsObj.user.isBot = node.isBot;
      statsObj.user.mentions = node.mentions;

      if (twttr && twttr.widgets) {

        // twitterTimeLineDiv.removeAll();

        // twttr.widgets.createTimeline(
        //   { sourceType: "profile", screenName: node.screenName},
        //   twitterTimeLineDiv,
        //   { height: 800 }
        //   // { width: "400", height: "600"}
        // )
        // .then(function (el) {
          callback(null, el);
        // })
        // .catch(function(err){
        //   console.error("TWITTER CREATE TIMELINE ERROR: " + err);
        //   callback(err, null);
        // });
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

    callback();
  }

  var prevNode = {};
  prevNode.nodeId = false;

  var twitterFeedNodeType = "user";

  function loadTwitterFeed(node, callback) {

    // if (!twitterTimeLineDiv || (twttr === undefined)) { 
    if (twttr === undefined) { 
      console.error("loadTwitterFeed: twitterTimeLineDiv OR twttr UNDEFINED");
      return callback("loadTwitterFeed: twitterTimeLineDiv OR twttr UNDEFINED");
    }

    loadingTwitterFeedFlag = true;

    twitterFeedNodeType = node.nodeType;

    node.categoryAuto = node.categoryAuto || "none";

    if (node.nodeType === "user"){

    }
    else if (node.nodeType === "hashtag"){

    }
    else {
      loadingTwitterFeedFlag = false;
      callback("ILLEGAL NODE TYPE: " + node.nodeType);
    }
  }

  this.setDisplayNodeType = function(params, callback){};

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

  function updateCategoryStats(stats){

    if (stats && stats.user && stats.user.uncategorized) {
      return;
    }
    else{
      return;
    }
  }

  function receiveMessage(event){
    // Do we trust the sender of this message?
    if (event.origin !== DEFAULT_SOURCE){
      if (event.origin === "https://platform.twitter.com") {
        if (event.data["twttr.button"] 
          && (event.data["twttr.button"]["method"] === "twttr.private.resizeButton")){
          return;
        }
      }
      else {
        console.error("RX MESSAGE | NOT TRUSTED SOURCE"
          + " | ORIGIN: " + event.origin 
          + " | DEFAULT_SOURCE: " + DEFAULT_SOURCE
        );
        return;
      }
    }

    if (event.data.op === undefined){
      return;
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

        console.debug("CONTROL PANEL INIT"
        	// + "\n" + jsonPrint(cnf)
        );

        Object.keys(cnf).forEach(function(prop){
          config[prop] = cnf[prop];
          console.info("CNF | " + prop 
            + " | " + config[prop]
          );
        });

        self.setMaxNodes(cnf.defaultMaxNodes);
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

      case "STATS":
        if (event.data.stats) {
          // console.debug("SET STATS" 
          //   + "\nSTATS\n" + jsonPrint(event.data.stats)
          // );
          for(const key of Object.keys(event.data.stats)){
            if (event.data.stats[key]) { statsObj[key] = event.data.stats[key]; }
          }

          if (statsObj.bestNetwork && statsObj.bestNetwork.networkId) {
            statsPanel.setValue("NETWORK", statsObj.bestNetwork.networkId);
          }

          if (statsObj.bestNetwork && statsObj.bestNetwork.inputsId) {
            statsPanel.setValue("INPUTS ID", statsObj.bestNetwork.inputsId);
          }

          updateCategoryStats(event.data.stats);
        }
      break;

      case "TWITTER_USER_NOT_FOUND":
        console.debug("SET TWITTER USER | USER NOT FOUND" 
          + " | " + event.data.searchNode
          + "\nSTATS\n" + jsonPrint(event.data.stats)
        );

        updateCategoryStats(event.data.stats);
      break;
      
      case "SET_TWITTER_USER":

        if (event.data.node.notFound) {

          console.debug("SET TWITTER USER | USER NOT FOUND" 
            + " | " + event.data.searchNode
            + "\nSTATS\n" + jsonPrint(event.data.stats)
          );

          updateCategoryStats(event.data.stats);

          break;
        }

        currentTwitterNode = event.data.node;

        if (!currentTwitterNode.profileImageUrl || (currentTwitterNode.profileImageUrl === undefined)){
          currentTwitterNode.profileImageUrl = DEFAULT_TWITTER_IMAGE;
        }

        console.debug("SET TWITTER USER" 
          + " | " + currentTwitterNode.nodeId
          + " | IG: " + currentTwitterNode.ignored
          + " | BOT: " + currentTwitterNode.isBot
          + " | FLWG: " + currentTwitterNode.following
          + " | @" + currentTwitterNode.screenName
          + " | CR: " + currentTwitterNode.createdAt
          + " | LS: " + currentTwitterNode.lastSeen
          + " | CV: " + currentTwitterNode.categoryVerified
          + " | C: " + currentTwitterNode.category
          + " | CA: " + currentTwitterNode.categoryAuto
			    + "\n profileImageUrl: " + currentTwitterNode.profileImageUrl
        );

        updateCategoryStats(event.data.stats);

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
                if (err2) { 
                  console.error("loadTwitterFeed SET_TWITTER_USER FAIL", err2);
                }
              });
            }, 1000);
          }
        });
      break;

      case "SET_TWITTER_HASHTAG":

        currentTwitterNode = event.data.node;

        console.debug("SET TWITTER HASHTAG" 
          + " | #" + currentTwitterNode.nodeId
          + " | CR: " + currentTwitterNode.createdAt
          + " | LS: " + currentTwitterNode.lastSeen
          + " | C: " + currentTwitterNode.category
          + " | CA: " + currentTwitterNode.categoryAuto
        );

        console.debug("SET TWITTER HASHTAG\nstats\n" + jsonPrint(event.data.stats));

        loadTwitterFeed(currentTwitterNode, function(err){
          if (err) {
            console.error("loadTwitterFeed SET_TWITTER_HASHTAG FAIL: " + err);
            setTimeout(function(){
              loadTwitterFeed(currentTwitterNode, function(err2){
                if (err2) { console.error("loadTwitterFeed SET_TWITTER_HASHTAG FAIL: " + err2); }
              });
            }, 1000);
          }
        });
      break;

      default:
        console.error("*** ERROR | UNKNOWN MESSAGE OP" 
          + " | OP: " + op
          + "\nDATA\n" + jsonPrint(event.data)
        );
    }
  }

  this.createControlPanel = function(callback) {
    if (callback) { callback(); }
  };

  this.updateControlPanel = function (cfg, callback) {
    console.log("UPDATE CONTROL PANEL");
    if (callback) { callback(); }
  };


  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG");

    self.createControlPanel(function(){


    });
  });
}