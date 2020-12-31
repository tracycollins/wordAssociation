// const EventEmitter = require("eventemitter3");
import {EventEmitter} from '/node_modules/eventemitter3'

class SessionViewEmitter extends EventEmitter {}
const sessionViewEmitter = new SessionViewEmitter();

const SessionView = function (config) {
  const self = this;
  this.appname = config.settings.app_name || "DEFAULT_APP_NAME";
  console.log("SESSION VIEW | APP NAME: " + this.appname);
  EventEmitter.call(this);

  self.emit("ready", self.appname);
};

util.inherits(SessionView, EventEmitter);

export default SessionView;
