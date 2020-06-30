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

  var dashboardMainDiv = document.getElementById('dashboardMainDiv');

  var statsPanel;
  var statsPanelDiv = document.createElement("div");
  statsPanelDiv.id = "statsPanelDiv";

  var displayControlHashMap = {};

  var displayControl;
  var displayControlDiv = document.createElement("div");
  displayControlDiv.id = "displayControlDiv";

  var twitterControl;
  var twitterControlDiv = document.createElement("div");
  twitterControlDiv.id = "twitterControlDiv";

  var twitterEntity;
  var twitterEntityDiv = document.createElement("div");
  twitterEntityDiv.id = "twitterEntityDiv";

	var twitterTimeLine;
	var twitterTimeLineDiv = document.createElement("div");
	twitterTimeLineDiv.id = "twitterTimeLineDiv";
  twitterTimeLineDiv.style.overflow = "auto";


	var entityCategorizeDiv = document.getElementById("entityCategorizeDiv");

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

    document.getElementById(op).style.background='#0000ff';

    console.debug("BUTTON: NEXT MISMATCH | searchFilter: " + searchFilter);

    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: searchFilter}, DEFAULT_SOURCE); }

    setTimeout(function(){
      eventDetected = false;
      document.getElementById(op).style.background='#ffffff';
    }, 100);
  };

  var nextUncatHandler = function(op){
    // need to debounce button click
    if (eventDetected) {
      return;
    }
    eventDetected = true;

    var searchFilter = "@?";

    document.getElementById(op).style.background='#0000ff';

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
      document.getElementById(op).style.background='#ffffff';
    }, 100);
  };

  var previousUserHandler = function(op){

    if (eventDetected) {
      return;
    }
    eventDetected = true;

    document.getElementById(op).style.background='#0000ff';
    if (parentWindow && !loadingTwitterFeedFlag && twitterFeedPreviousUserArray.length > 0) {
      const prevUserNodeId = twitterFeedPreviousUserArray.pop();
      const prevUserObj = twitterFeedPreviousUserMap[prevUserNodeId];
      const prevUserScreenname = "@" + prevUserObj.screenName;
      parentWindow.postMessage({op: "NODE_SEARCH", input: prevUserScreenname}, DEFAULT_SOURCE);
      twitterFeedPreviousUserMap[prevUserNodeId] = null;
    }

    setTimeout(function(){
      eventDetected = false;
      document.getElementById(op).style.background='#ffffff';
    }, 100);
  };

  var ignoreHandler = function(op){

    if (eventDetected) {
      return;
    }
    eventDetected = true;

    document.getElementById(op).style.background='#0000ff';
    if (parentWindow && !loadingTwitterFeedFlag) { parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE); }

    setTimeout(function(){
      eventDetected = false;
      document.getElementById(op).style.background='#ffffff';
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

  Element.prototype.removeAll = function () {
    while (this.firstChild) { this.removeChild(this.firstChild); }
    return this;
  };

  function updateCategoryRadioButtons(category, callback){

    console.log("updateCategoryRadioButtons | " + category);

    if (category === undefined || !category) {
      category = "none";
    }

	  setChecked(category);

    callback();
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

        twitterTimeLineDiv.removeAll();

        twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: node.screenName},
          twitterTimeLineDiv,
          { height: 800 }
          // { width: "400", height: "600"}
        )
        .then(function (el) {
          callback(null, el);
        })
        .catch(function(err){
          console.error("TWITTER CREATE TIMELINE ERROR: " + err);
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

    twitterTimeLineDiv.removeAll();

    callback();
  }

  function updateStatsPanel(stats, callback){
    if (!statsPanelDiv) { 
      console.error("updateStatsPanel: statsPanelDiv UNDEFINED");
      return callback("updateStatsPanel: statsPanelDiv UNDEFINED");
    }

    callback();
  }

  var prevNode = {};
  prevNode.nodeId = false;

  var twitterFeedNodeType = "user";

  function loadTwitterFeed(node, callback) {

    if (!twitterTimeLineDiv || (twttr === undefined)) { 
      console.error("loadTwitterFeed: twitterTimeLineDiv OR twttr UNDEFINED");
      return callback("loadTwitterFeed: twitterTimeLineDiv OR twttr UNDEFINED");
    }

    loadingTwitterFeedFlag = true;

    twitterFeedNodeType = node.nodeType;

    node.categoryAuto = node.categoryAuto || "none";

    if (node.nodeType === "user"){

      if (prevNode.nodeId && (node.nodeId !== prevNode.nodeId) && !twitterFeedPreviousUserArray.includes(prevNode.nodeId)){
        twitterFeedPreviousUserArray.push(prevNode.nodeId);
        twitterFeedPreviousUserMap[prevNode.nodeId] = node;
      }
      if (prevNode.nodeId !== node.nodeId){
        prevNode = node;
      }

      twitterFeedUser = Object.assign({}, defaultTwitterFeedUser, node);

      twitterEntity.setValue("NODE ID", twitterFeedUser.nodeId);
    	twitterEntity.setValue("NAME", twitterFeedUser.name);
      twitterEntity.setValue("SCREENNAME", "@"+twitterFeedUser.screenName);
      twitterEntity.setValue("CREATED", getTimeStamp(twitterFeedUser.createdAt));
      twitterEntity.setValue("LAST SEEN", getTimeStamp(twitterFeedUser.lastSeen));
      twitterEntity.setValue("HASHTAG", "");
      twitterEntity.setValue("FOLLOWERS", twitterFeedUser.followersCount);
      twitterEntity.setValue("FRIENDS", twitterFeedUser.friendsCount);
      twitterEntity.setValue("LOCATION", twitterFeedUser.location);
      twitterEntity.setValue("DESCRIPTION", twitterFeedUser.description);

      if (!twitterFeedUser.profileImageUrl || (twitterFeedUser.profileImageUrl === undefined)){
        twitterFeedUser.profileImageUrl = DEFAULT_TWITTER_IMAGE;
      }
      twitterEntity.setValue("PROFILE IMAGE", twitterFeedUser.profileImageUrl.replace("_normal", ""));

      if (!twitterFeedUser.bannerImageUrl || (twitterFeedUser.bannerImageUrl === undefined)) {
        twitterFeedUser.bannerImageUrl = DEFAULT_TWITTER_IMAGE;
      }
      twitterEntity.setValue("BANNER IMAGE", twitterFeedUser.bannerImageUrl.replace("_normal", ""));

      // const ageMs = moment().diff(node.createdAt);
      // const tweetsPerDay = ONE_DAY * (node.statusesCount/ageMs);

      twitterTimeLine.setValue("AGE", node.ageDays.toFixed(3));
      twitterTimeLine.setValue("TWEETS", node.statusesCount);
      twitterTimeLine.setValue("TWEETS PER DAY", node.tweetsPerDay.toFixed(3));
      twitterTimeLine.setValue("MENTIONS", node.mentions);
      twitterTimeLine.setValue("RATE", node.rate);
      twitterTimeLine.setValue("RATE MAX", node.rateMax);

      const categoryVerified = node.categoryVerified || false;
      const isBot = node.isBot || false;
      const following = node.following || false;
      const ignored = node.ignored || false;
      const categoryAuto = node.categoryAuto.toUpperCase() || "NONE";

      twitterControl.setValue("CAT VERIFIED", categoryVerified);
      twitterControl.setValue("BOT", isBot);
      twitterControl.setValue("FOLLOWING", following);
      twitterControl.setValue("IGNORED", ignored);
			twitterControl.setValue("CATEGORY AUTO", categoryAuto);

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | NID: " + node.nodeId
        + " | IG: " + node.ignored
        + " | BOT: " + node.isBot
        + " | FLWG: " + node.following
        + " | @" + node.screenName
        + " | " + node.name
        + " | CR: " + node.createdAt
        + " | LS: " + node.lastSeen
        + " | CV: " + node.categoryVerified
        + " | C: " + node.category
        + " | CA: " + node.categoryAuto
        + " | Ms: " + node.mentions
        + " | Ts: " + node.statusesCount
        + " | FRNDs: " + node.friendsCount
        + " | FLWRs: " + node.followersCount
      );

      updateCategoryRadioButtons(node.category, function(){

        twitterWidgetsCreateTimeline(node, function(err, el){

          loadingTwitterFeedFlag = false;

          if (err){
            console.error("LOAD TWITTER FEED ERROR: " + err);
            return callback(err);
          }

          callback();
        });

      });
    }
    else if (node.nodeType === "hashtag"){

      twitterFeedHashtag = node;
      twitterFeedPreviousHashtag = twitterFeedHashtag;

      twitterEntity.setValue("NODE ID", node.nodeId);
      twitterEntity.setValue("NAME", "");
      twitterEntity.setValue("SCREENNAME", "");
      twitterEntity.setValue("HASHTAG", "#" + node.nodeId);
      twitterEntity.setValue("FOLLOWERS", "");
      twitterEntity.setValue("FRIENDS", "");
      twitterEntity.setValue("LOCATION", "");
      twitterEntity.setValue("PROFILE IMAGE", DEFAULT_TWITTER_IMAGE);
      twitterEntity.setValue("BANNER IMAGE", DEFAULT_TWITTER_IMAGE);
      twitterEntity.setValue("DESCRIPTION", "");

      twitterTimeLine.setValue("TWEETS", "");
      twitterTimeLine.setValue("MENTIONS", node.mentions);
      twitterTimeLine.setValue("RATE", node.rate);
      twitterTimeLine.setValue("RATE MAX", node.rateMax);

      twitterControl.setValue("CATEGORY AUTO", node.categoryAuto.toUpperCase() || "NONE");

      console.debug("loadTwitterFeed"
        + " | TYPE: " + node.nodeType
        + " | #" + node.nodeId
        + " | CAT M: " + node.category
        + " | Ms: " + node.mentions
      );

      updateCategoryRadioButtons(node.category, function(){
        twitterHashtagSearch(node, function(){
          loadingTwitterFeedFlag = false;
          callback();
        });
      });
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
    
      statsObj.manual = {};
      statsObj.manual = stats.user.manual;
      statsObj.auto = stats.user.auto;

      if (statsObj.manual) {
        statsPanel.setValue("MANUAL LEFT", statsObj.manual.left);
        statsPanel.setValue("MANUAL RGHT", statsObj.manual.right);
        statsPanel.setValue("MANUAL NEUT", statsObj.manual.neutral);
      }

      statsObj.uncategorized = {};
      statsObj.uncategorized = stats.user.uncategorized;
      statsObj.mismatched = stats.user.mismatched;

      console.debug("updateCategoryStats | SET TWITTER USER\nstats" + jsonPrint(stats));

      ["left", "right", "neutral", "all"].forEach(function(cat){
        if (stats.user.uncategorized[cat] !== undefined) {
          const currentButton = document.getElementById("NEXT UNCAT " + cat.toUpperCase());
          currentButton.value = stats.user.uncategorized[cat].toString() + " | NEXT UNCAT " + cat.toUpperCase();
          console.debug("NEXT UNCAT " + cat.toUpperCase() + " | value: " + currentButton.value); 
        }
      });

      if (stats.user.mismatched !== undefined) {
        const currentButton = document.getElementById("NEXT MISMATCH");
        currentButton.value = stats.user.mismatched.toString() + " | NEXT MISMATCH";
        console.debug("NEXT UNCAT MISMATCH | value: " + currentButton.value); 
      }
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

	var radioUserCategoryDiv = document.createElement("div");
	radioUserCategoryDiv.id = "radioUserCategoryDiv";
  radioUserCategoryDiv.setAttribute("class", "radioCheckbox");
  radioUserCategoryDiv.style.fontSize = "16px";

	["left", "neutral", "right", "positive", "negative", "none"].forEach(function(category){

		var categoryLabel = document.createElement("label");
		categoryLabel.setAttribute("class", "categoryButtonLabel");
		categoryLabel.setAttribute("id", "categoryLabel_" + shortCategory(category));
    categoryLabel.style.fontSize = "16px";
    categoryLabel.style.padding = "5px";
		categoryLabel.innerHTML = shortCategory(category);

		var categoryButton = document.createElement("input");
		categoryButton.id = "category_" + category; 
		categoryButton.setAttribute("type", "checkbox");
		categoryButton.name = category; 
    categoryButton.style.webkitAppearance = "none";
    categoryButton.style.backgroundColor = "lightgray";
    categoryButton.style.boxSizing = "border-box";
    categoryButton.style.width = "16px";
    categoryButton.style.height = "16px";

		categoryLabel.appendChild(categoryButton);
		radioUserCategoryDiv.appendChild(categoryLabel);
	});

	radioUserCategoryDiv.onclick = function(e){
		console.log("radioUserCategoryDiv BUTTON: ", e.srcElement.id);
		catRadioButtonHandler(e);
	}

	function setChecked( categorySet ){

		var categorySetButtonId = "category_" + categorySet;

		var cbxs = radioUserCategoryDiv.getElementsByTagName('input'), i=cbxs.length;

		while(i--) {

		  if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id === categorySetButtonId) {
				cbxs[i].checked = true;
        cbxs[i].style.backgroundColor = "blue";
        if (twitterFeedNodeType === "user") { twitterFeedUser.category = cbxs[i].name; }
        if (twitterFeedNodeType === "hashtag") { twitterFeedHashtag.category = cbxs[i].name; }
		  }
		  if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id !== categorySetButtonId) {
				cbxs[i].checked = false;
        cbxs[i].style.backgroundColor = "lightgray";
		  }

		}
	}

  function computeRangeStep(params){
    return Math.abs((params.max-params.min)/config.defaultRangeSteps);
  }

  function catRadioButtonHandler(e){

		e = e || event;

		var cb = e.srcElement || e.target;

		if (cb.type !== 'checkbox') {return true;}

		console.log("CAT BUTTON: ", cb.id);

		var cbxs = radioUserCategoryDiv.getElementsByTagName('input');
		var i = cbxs.length;

		while(i--) {
			if (cbxs[i].type && cbxs[i].type == 'checkbox' && cbxs[i].id !== cb.id) {
				cbxs[i].checked = false;
        cbxs[i].style.backgroundColor = "lightgray";
			}
		}
    
		cb.checked = true;
    cb.style.backgroundColor = "blue";

    if (!loadingTwitterFeedFlag){

      currentTwitterNode.category = cb.name;

      if (twitterFeedNodeType === "user"){
        twitterFeedUser.category = cb.name;
        console.debug("CATEGORIZE | @" + currentTwitterNode.screenName + " | CAT: " + cb.name);
      }
      
      if (twitterFeedNodeType === "hashtag"){
        twitterFeedHashtag.category = cb.name;
        console.debug("CATEGORIZE | #" + currentTwitterNode.nodeId + " | CAT: " + cb.name);
      }
      
      parentWindow.postMessage({op: "CATEGORIZE", node: currentTwitterNode, category: cb.name}, DEFAULT_SOURCE);
    }
  }

  function createRangeInput(params){

    console.log("createRangeInput\n", params);

    let configObj = config.range[params.name];

    configObj.title = changeCase.sentenceCase(configObj.name).toUpperCase();
    configObj.step = configObj.step || computeRangeStep({ max: configObj.max, min: configObj.min });

    console.log("configObj\n", configObj);

    displayControl.addRange(
      configObj.title, 
      configObj.min, 
      configObj.max, 
      configObj.default, 
      configObj.step, 
      function(value){
        console.debug(configObj.name + ": " + value);
        parentWindow.postMessage({op: "UPDATE", id: configObj.name, value: value}, DEFAULT_SOURCE);
      }
    );

    return;
  }

  $( document ).ready(function() {

    console.log( "CONTROL PANEL DOCUMENT READY" );
    console.log( "CONTROL PANEL CONFIG");

    var positionX = 0;
    var subPanelWidth = 320;

    self.createControlPanel(function(){

      setTimeout(function() {  // KLUDGE to insure table is created before update

        QuickSettings.useExtStyleSheet();

        // TWITTER ENTITY ==================================

        twitterEntity = QuickSettings.create(positionX, 0, "ENTITY", entityCategorizeDiv);

        positionX += subPanelWidth;

        twitterEntity.setWidth(subPanelWidth);

        const nodeId = (twitterFeedUser) ? twitterFeedUser.nodeId : "";
        twitterEntity.addText("NODE ID", nodeId);

        const name = (twitterFeedUser) ? twitterFeedUser.name : "";
        twitterEntity.addText("NAME", name);

        const screenName = (twitterFeedUser) ? "@"+twitterFeedUser.screenName : "@";
        twitterEntity.addText("SCREENNAME", screenName);

        const createdAt = (twitterFeedUser) ? twitterFeedUser.createdAt : "";
        const ageMs = (twitterFeedUser) ? moment().diff(createdAt) : 0;
        twitterEntity.addText("CREATED", getTimeStamp(createdAt));

        const lastSeen = (twitterFeedUser) ? twitterFeedUser.lastSeen : "";
        twitterEntity.addText("LAST SEEN", getTimeStamp(lastSeen));

        twitterEntity.addButton("USER SEARCH", function(data){
          console.debug("NODE SEARCH: ", twitterEntity.getValue("SCREENNAME"));
          let input = twitterEntity.getValue("SCREENNAME").replace(/\s/g, "");
          if (!input.startsWith("@")) { input = "@" + input; }
          parentWindow.postMessage({op: "NODE_SEARCH", input: input}, DEFAULT_SOURCE);  
        });

        const hashtag = (twitterFeedHashtag) ? "#"+twitterFeedHashtag.nodeId : "#";
        twitterEntity.addText("HASHTAG", hashtag);

				twitterEntity.addButton("HASHTAG SEARCH", function(data){
					console.debug("NODE SEARCH: ", twitterEntity.getValue("HASHTAG"));
          let input = twitterEntity.getValue("HASHTAG");
          if (!input.startsWith("#")) { input = "#" + input; }
		      parentWindow.postMessage({op: "NODE_SEARCH", input: input}, DEFAULT_SOURCE);
				});

        twitterEntity.addNumber("FOLLOWERS", twitterFeedUser.followersCount);

        if (twitterFeedUser.followersCount > 5000) {
          document.getElementById("FOLLOWERS").style.background='#004400';
        }

        twitterEntity.addNumber("FRIENDS", twitterFeedUser.friendsCount);

        const location = (twitterFeedUser) ? twitterFeedUser.location : "";
        twitterEntity.addText("LOCATION", location);

				const description = (twitterFeedUser) ? twitterFeedUser.description : "";
				twitterEntity.addTextArea("DESCRIPTION", description);

        if (twitterFeedUser) {
          var profileImageUrl = twitterFeedUser.profileImageUrl.replace("http:", "https:");
          profileImageUrl = twitterFeedUser.profileImageUrl.replace("_normal", "");
          twitterEntity.addImage("PROFILE IMAGE", profileImageUrl);
        }
        else {
          twitterEntity.addImage("PROFILE IMAGE", DEFAULT_TWITTER_IMAGE);
        }

        if (twitterFeedUser && twitterFeedUser.bannerImageUrl) {
          var bannerImageUrl = twitterFeedUser.bannerImageUrl.replace("http:", "https:");
          bannerImageUrl = twitterFeedUser.bannerImageUrl.replace("_normal", "");
          twitterEntity.addImage("BANNER IMAGE", bannerImageUrl);
        }
        else {
          twitterEntity.addImage("BANNER IMAGE", DEFAULT_TWITTER_IMAGE);
        }


        // TWITTER USER TIMELINE ==================================

				twitterTimeLine = QuickSettings.create(positionX, 	0, "TIMELINE", entityCategorizeDiv);

        positionX += subPanelWidth;

				twitterTimeLine.setWidth(subPanelWidth);

        twitterTimeLine.addNumber("AGE", twitterFeedUser.ageDays.toFixed(3));
        twitterTimeLine.addNumber("TWEETS", twitterFeedUser.statusesCount);
        twitterTimeLine.addNumber("TWEETS PER DAY", twitterFeedUser.tweetsPerDay.toFixed(3));
        twitterTimeLine.addNumber("MENTIONS", twitterFeedUser.mentions);
        twitterTimeLine.addNumber("RATE", twitterFeedUser.rate);
        twitterTimeLine.addNumber("RATE MAX", twitterFeedUser.rateMax);
        twitterTimeLine.addElement("TIMELINE", twitterTimeLineDiv);	

        twitterEntity.setGlobalChangeHandler(function(data){
        });

        // TWITTER USER CONTROL ==================================

        twitterControl = QuickSettings.create(positionX, 0, "CONTROL", entityCategorizeDiv);
        positionX += subPanelWidth;

        twitterControl.setWidth(subPanelWidth);

        let isBot = false;
        if (twitterFeedUser && twitterFeedUser.isBot !== undefined) {
          isBot = twitterFeedUser.isBot;
        }

        twitterControl.addBoolean("BOT", isBot, function(data){
          console.debug("USER BOT | " + twitterEntity.getValue("SCREENNAME") + " | BOT: " + data);
          const op = (data) ? "BOT" : "UNBOT";
          if (!loadingTwitterFeedFlag){
            parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE);
          }
        });

        let following = false;
        if (twitterFeedUser && twitterFeedUser.following !== undefined) {
          following = twitterFeedUser.following;
        }

        twitterControl.addBoolean("FOLLOWING", following, function(data){
          console.debug("USER FOLLOWING | " + twitterEntity.getValue("SCREENNAME") + " | FOLLOWING: " + data);
          const op = (data) ? "FOLLOW" : "UNFOLLOW";
          if (!loadingTwitterFeedFlag){
            parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE);
          }
        });

        let ignored = false;
        if (twitterFeedUser && twitterFeedUser.ignored !== undefined) {
          ignored = twitterFeedUser.ignored;
        }

        twitterControl.addBoolean("IGNORED", ignored, function(data){
          // console.debug("USER IGNORED | " + twitterEntity.getValue("SCREENNAME") + " | IGNORED: " + data);
          console.debug("NODE IGNORED | " + twitterEntity.getValue("SCREENNAME") + " | IGNORED: " + data);
          const op = (data) ? "IGNORE" : "UNIGNORE";
          if (!loadingTwitterFeedFlag){
            parentWindow.postMessage({op: op, user: twitterFeedUser}, DEFAULT_SOURCE);
          }
        });

        let categoryVerified = false;
        if (twitterFeedUser && twitterFeedUser.categoryVerified !== undefined) {
          categoryVerified = twitterFeedUser.categoryVerified;
        }

        twitterControl.addBoolean("CAT VERIFIED", categoryVerified, function(data){

          console.debug("USER VERIFIED | " + twitterEntity.getValue("SCREENNAME")
            + " | categoryVerified: " + data
            + " | category: " + twitterFeedUser.category
          );

          const op = (data) ? "CAT VERIFIED" : "CAT UNVERIFIED";
          catVerifiedHandler(op);
        });

        twitterFeedUser.categoryAuto = twitterFeedUser.categoryAuto || "none";
        const categoryAuto = (twitterFeedUser) ? twitterFeedUser.categoryAuto.toUpperCase() : "";
        twitterControl.addText("CATEGORY AUTO", categoryAuto.toUpperCase());

        twitterControl.addElement("CATEGORY MAN", radioUserCategoryDiv);

        twitterControl.addButton("CAT VERIFY", function(){
          document.getElementById("CAT VERIFY").style.background='#0000ff';

          console.debug("USER VERIFIED | " + twitterEntity.getValue("SCREENNAME")
            + " | categoryVerified: true"
            + " | category: " + twitterFeedUser.category
          );

          catVerifiedHandler("CAT VERIFIED");
          setTimeout(function(){
            document.getElementById("CAT VERIFY").style.background='#ffffff';
          }, 100);
        });

        twitterControl.addButton("PREV USER", function(){
          previousUserHandler("PREV USER");
        });
        twitterControl.addButton("IGNORE", function(){
          ignoreHandler("IGNORE");
        });
        twitterControl.addButton("NEXT UNCAT ALL", function(){
          nextUncatHandler("NEXT UNCAT ALL");
        });
        twitterControl.addButton("NEXT UNCAT LEFT", function(){
          nextUncatHandler("NEXT UNCAT LEFT");
        });
        twitterControl.addButton("NEXT UNCAT NEUTRAL", function(){
          nextUncatHandler("NEXT UNCAT NEUTRAL");
        });
        twitterControl.addButton("NEXT UNCAT RIGHT", function(){
          nextUncatHandler("NEXT UNCAT RIGHT");
        });
        twitterControl.addButton("NEXT MISMATCH", function(){
          nextMismatchHandler("NEXT MISMATCH");
        });
        twitterControl.addButton("UNIGNORE", function(){
          ignoreHandler("UNIGNORE");
        });

        // STATS ==================================

        statsPanel = QuickSettings.create(positionX, 0, "STATS", entityCategorizeDiv);
        positionX += subPanelWidth;

        statsPanel.setWidth(subPanelWidth);
        statsPanel.addText("NETWORK", statsObj.bestNetwork.networkId);

        statsPanel.addText("INPUTS ID", statsObj.bestNetwork.inputsId);

        statsPanel.addText("MANUAL LEFT", "");
        statsPanel.addText("MANUAL RGHT", "");
        statsPanel.addText("MANUAL NEUT", "");

        // DISPLAY ==================================

        displayControl = QuickSettings.create(positionX, 0, "DISPLAY", entityCategorizeDiv);
        positionX += subPanelWidth;

        displayControl.setWidth(subPanelWidth);

        rangeInputs.forEach(function(rangeInput){
          createRangeInput({name: rangeInput});
        });


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
                    twttr.widgets.load(twitterTimeLineDiv);              

                    parentWindow.postMessage({op: "NODE_SEARCH", input: "@threecee"}, DEFAULT_SOURCE);
                  }

                }, 1000);

              }
              else {
                twttr.widgets.load(twitterTimeLineDiv);              
                parentWindow.postMessage({op: "NODE_SEARCH", input: "@threecee"}, DEFAULT_SOURCE);
              }
            }, 2000);

          }
          else {
            console.error("PARENT WINDOW UNDEFINED??");
          }

        });
      }, 2000);

    });
  });
}