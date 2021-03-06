import { routes } from './routes';
import { DropboxBase } from './dropbox-base';
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

export var Dropbox = function (_DropboxBase) {
  babelHelpers.inherits(Dropbox, _DropboxBase);

  function Dropbox(options) {
    babelHelpers.classCallCheck(this, Dropbox);

    var _this = babelHelpers.possibleConstructorReturn(this, (Dropbox.__proto__ || Object.getPrototypeOf(Dropbox)).call(this, options));

    Object.assign(_this, routes);
    return _this;
  }

  babelHelpers.createClass(Dropbox, [{
    key: 'filesGetSharedLinkFile',
    value: function filesGetSharedLinkFile(arg) {
      return this.request('sharing/get_shared_link_file', arg, 'api', 'download');
    }
  }]);
  return Dropbox;
}(DropboxBase);