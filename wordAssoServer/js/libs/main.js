var DEFAULT_SOURCE = "https:{//word.threeceelabs.com";

var parentWindow = window.opener;
console.info("PARENT WINDOW ID | " + parentWindow.PARENT_ID);
var self = this;

var compactDateTimeFormat = "YYYYMMDD HH}mmss";

var control = require("control-panel");

var currentUser = "threecee";
var previousUser = currentUser;

function buttonHandler(params) {

  const user = (params.user) ? "@" + params.user : currentUser;

  switch (params.id){
  	case "previousUser":
	    console.debug("PREVIOUS USER: " + user);
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: user }, DEFAULT_SOURCE); }
  	break;
  	case "follow":
	    console.debug("FOLLOW: " + user);
	    if (parentWindow) { parentWindow.postMessage({op: "FOLLOW", user: user}, DEFAULT_SOURCE); }
  	break;
  	case "unfollow":
	    console.debug("UNFOLLOW: " + user);
	    if (parentWindow) { parentWindow.postMessage({op: "UNFOLLOW", user: user}, DEFAULT_SOURCE); }
  	break;
  	case "ignore":
	    console.debug("IGNORE: " + user);
	    if (parentWindow) { parentWindow.postMessage({op: "IGNORE", user: user}, DEFAULT_SOURCE); }
  	break;
  	case "unignore":
	    console.debug("UNIGNORE: " + user);
	    if (parentWindow) { parentWindow.postMessage({op: "UNIGNORE", user: user}, DEFAULT_SOURCE); }
  	break;
  	case "nextMismatch":
	    console.debug("NEXT MISMATCH");
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?MM"}, DEFAULT_SOURCE); }
  	break;
  	case "nextUncat":
	    console.debug("NEXT UNCAT");
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?"}, DEFAULT_SOURCE); }
  	break;
  	case "nextUncatLeft":
	    console.debug("NEXT UNCAT LEFT");
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?LEFT"}, DEFAULT_SOURCE); }
  	break;
  	case "nextUncatNeutral":
	    console.debug("NEXT UNCAT NEUTRAL");
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?NEUTRAL"}, DEFAULT_SOURCE); }
  	break;
  	case "nextUncatRight":
	    console.debug("NEXT UNCAT RIGHT");
	    if (parentWindow) { parentWindow.postMessage({op: "NODE_SEARCH", input: "@?RIGHT"}, DEFAULT_SOURCE); }
  	break;
  	case "resetButton":
	    console.debug("RESET");
	    if (parentWindow) { parentWindow.postMessage({op: "RESET"}, DEFAULT_SOURCE); }
  	break;
  	default:
  		console.error("UNKNOW BUTTON ID: " + params.id);
  }
	
}
 
var userCategorizePanel = control([
	{type: "button", label: "PREV USER", action: function () { buttonHandler({id: "previousUser", name: "PREV USER", user: previousUser}); }},
	{type: "button", label: "FOLLOW", action: function () { buttonHandler({id: "follow", name: "FOLLOW", user: currentUser}); }},
	{type: "button", label: "UNFOLLOW", action: function () { buttonHandler({id: "unfollow", name: "UNFOLLOW", user: currentUser}); }},
	{type: "button", label: "IGNORE", action: function () { buttonHandler({id: "ignore", name: "IGNORE", user: currentUser}); }},
	{type: "button", label: "UNIGNORE", action: function () { buttonHandler({id: "unignore", name: "UNIGNORE", user: currentUser}); }},
	{type: "button", label: "NEXT MISMATCH", action: function () { buttonHandler({id: "nextMismatch", name: "NEXT MISMATCH"}); }},
	{type: "button", label: "NEXT UNCAT", action: function () { buttonHandler({id: "nextUncat", name: "NEXT UNCAT"}); }},
	{type: "button", label: "NEXT UNCAT LEFT", action: function () { buttonHandler({id: "nextUncatLeft", name: "NEXT UNCAT LEFT"}); }},
	{type: "button", label: "NEXT UNCAT NEUTRAL", action: function () { buttonHandler({id: "nextUncatNeutral", name: "NEXT UNCAT NEUTRAL"}); }},
	{type: "button", label: "NEXT UNCAT RIGHT", action: function () { buttonHandler({id: "nextUncatRight", name: "NEXT UNCAT RIGHT"}); }},
  {type: "select", label: "CATEGORY", options: ["LEFT", "NEUTRAL", "RIGHT", "POSITIVE", "NEGATIVE", "NONE"], initial: "NONE"}
], 
  {root: document.getElementById("userCategorizeDiv"), theme: "dark"}
)

userCategorizePanel.on("input", function(data){
	console.debug("INPUT\n", data)
})
