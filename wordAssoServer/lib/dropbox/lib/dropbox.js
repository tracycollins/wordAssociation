'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Dropbox = undefined;

var _createClass = function () {
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

var _routes = require('./routes');

var _dropboxBase = require('./dropbox-base');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
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
}
/**
 * @class Dropbox
 * @extends DropboxBase
 * @classdesc The Dropbox SDK class that provides methods to read, write and
 * create files or folders in a user's Dropbox.
 * @arg {Object} options
 * @arg {String} [options.accessToken] - An access token for making authenticated
 * requests.
 * @arg {String} [options.clientId] - The client id for your app. Used to create
 * authentication URL.
 * @arg {String} [options.selectUser] - Select user is only used by DropboxTeam.
 * It specifies which user the team access token should be acting as.
 */


var Dropbox = exports.Dropbox = function (_DropboxBase) {
  _inherits(Dropbox, _DropboxBase);

  function Dropbox(options) {
    _classCallCheck(this, Dropbox);

    var _this = _possibleConstructorReturn(this, (Dropbox.__proto__ || Object.getPrototypeOf(Dropbox)).call(this, options));

    Object.assign(_this, _routes.routes);
    return _this;
  }

  _createClass(Dropbox, [{
    key: 'filesGetSharedLinkFile',
    value: function filesGetSharedLinkFile(arg) {
      return this.request('sharing/get_shared_link_file', arg, 'api', 'download');
    }
  }]);

  return Dropbox;
}(_dropboxBase.DropboxBase);