import { UPLOAD, DOWNLOAD, RPC } from './constants';
import { downloadRequest } from './download-request';
import { uploadRequest } from './upload-request';
import { rpcRequest } from './rpc-request';
/* eslint-disable */
// Polyfill object.assign for legacy browsers
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

if (typeof Object.assign !== 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';

      var output;
      var index;
      var source;
      var nextKey;

      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      output = Object(target);

      for (index = 1; index < arguments.length; index++) {
        source = arguments[index];

        if (source !== undefined && source !== null) {
          for (nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }

      return output;
    };
  })();
} // Polyfill Array.includes for legacy browsers
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
// https://tc39.github.io/ecma262/#sec-array.prototype.includes


if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function value(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      } // 1. Let O be ? ToObject(this value).


      var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

      var len = o.length >>> 0; // 3. If len is 0, return false.

      if (len === 0) {
        return false;
      } // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)


      var n = fromIndex | 0; // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.

      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y);
      } // 7. Repeat, while k < len


      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        } // c. Increase k by 1.


        k++;
      } // 8. Return false


      return false;
    }
  });
}
/* eslint-enable */

/**
 * @private
 * @class DropboxBase
 * @classdesc The main Dropbox SDK class. This contains the methods that are
 * shared between Dropbox and DropboxTeam classes. It is marked as private so
 * that it doesn't show up in the docs because it is never used directly.
 * @arg {Object} options
 * @arg {String} [options.accessToken] - An access token for making authenticated
 * requests.
 * @arg {String} [options.clientId] - The client id for your app. Used to create
 * authentication URL.
 * @arg {String} [options.clientSecret] - The client secret for your app.
 * @arg {Number} [options.selectUser] - User that the team access token would like
 * to act as.
 * @arg {String} [options.selectAdmin] - Team admin that the team access token would like
 * to act as.
 */


function parseBodyToType(res) {
  var clone = res.clone();
  return new Promise(function (resolve) {
    res.json().then(function (data) {
      return resolve(data);
    }).catch(function () {
      return clone.text().then(function (data) {
        return resolve(data);
      });
    });
  }).then(function (data) {
    return [res, data];
  });
}

export var DropboxBase = function () {
  function DropboxBase(options) {
    babelHelpers.classCallCheck(this, DropboxBase);
    options = options || {};
    this.accessToken = options.accessToken;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.selectUser = options.selectUser;
    this.selectAdmin = options.selectAdmin;
  }
  /**
   * Set the access token used to authenticate requests to the API.
   * @arg {String} accessToken - An access token
   * @returns {undefined}
   */


  babelHelpers.createClass(DropboxBase, [{
    key: 'setAccessToken',
    value: function setAccessToken(accessToken) {
      this.accessToken = accessToken;
    }
    /**
     * Get the access token
     * @returns {String} Access token
     */

  }, {
    key: 'getAccessToken',
    value: function getAccessToken() {
      return this.accessToken;
    }
    /**
     * Set the client id, which is used to help gain an access token.
     * @arg {String} clientId - Your apps client id
     * @returns {undefined}
     */

  }, {
    key: 'setClientId',
    value: function setClientId(clientId) {
      this.clientId = clientId;
    }
    /**
     * Get the client id
     * @returns {String} Client id
     */

  }, {
    key: 'getClientId',
    value: function getClientId() {
      return this.clientId;
    }
    /**
     * Set the client secret
     * @arg {String} clientId - Your apps client secret
     * @returns {undefined}
     */

  }, {
    key: 'setClientSecret',
    value: function setClientSecret(clientSecret) {
      this.clientSecret = clientSecret;
    }
    /**
     * Get the client secret
     * @returns {String} Client secret
     */

  }, {
    key: 'getClientSecret',
    value: function getClientSecret() {
      return this.clientSecret;
    }
    /**
     * Get a URL that can be used to authenticate users for the Dropbox API.
     * @arg {String} redirectUri - A URL to redirect the user to after
     * authenticating. This must be added to your app through the admin interface.
     * @arg {String} [state] - State that will be returned in the redirect URL to help
     * prevent cross site scripting attacks.
     * @arg {String} [authType] - auth type, defaults to 'token', other option is 'code'
     * @returns {String} Url to send user to for Dropbox API authentication
     */

  }, {
    key: 'getAuthenticationUrl',
    value: function getAuthenticationUrl(redirectUri, state) {
      var authType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'token';
      var clientId = this.getClientId();
      var baseUrl = 'https://www.dropbox.com/oauth2/authorize';

      if (!clientId) {
        throw new Error('A client id is required. You can set the client id using .setClientId().');
      }

      if (authType !== 'code' && !redirectUri) {
        throw new Error('A redirect uri is required.');
      }

      if (!['code', 'token'].includes(authType)) {
        throw new Error('Authorization type must be code or token');
      }

      var authUrl = void 0;

      if (authType === 'code') {
        authUrl = baseUrl + '?response_type=code&client_id=' + clientId;
      } else {
        authUrl = baseUrl + '?response_type=token&client_id=' + clientId;
      }

      if (redirectUri) {
        authUrl += '&redirect_uri=' + redirectUri;
      }

      if (state) {
        authUrl += '&state=' + state;
      }

      return authUrl;
    }
    /**
     * Get an OAuth2 access token from an OAuth2 Code.
     * @arg {String} redirectUri - A URL to redirect the user to after
     * authenticating. This must be added to your app through the admin interface.
     * @arg {String} code - An OAuth2 code.
    */

  }, {
    key: 'getAccessTokenFromCode',
    value: function getAccessTokenFromCode(redirectUri, code) {
      var clientId = this.getClientId();
      var clientSecret = this.getClientSecret();

      if (!clientId) {
        throw new Error('A client id is required. You can set the client id using .setClientId().');
      }

      if (!clientSecret) {
        throw new Error('A client secret is required. You can set the client id using .setClientSecret().');
      }

      var path = 'https://api.dropboxapi.com/oauth2/token?code=' + code + '&grant_type=authorization_code&redirect_uri=' + redirectUri + '&client_id=' + clientId + '&client_secret=' + clientSecret;
      var fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };
      return fetch(path, fetchOptions).then(function (res) {
        return parseBodyToType(res);
      }).then(function (_ref) {
        var _ref2 = babelHelpers.slicedToArray(_ref, 2),
            res = _ref2[0],
            data = _ref2[1]; // maintaining existing API for error codes not equal to 200 range


        if (!res.ok) {
          // eslint-disable-next-line no-throw-literal
          throw {
            error: data,
            response: res,
            status: res.status
          };
        }

        return data.access_token;
      });
    }
    /**
     * Called when the authentication succeed
     * @callback successCallback
     * @param {string} access_token The application's access token
     */

    /**
     * Called when the authentication failed.
     * @callback errorCallback
     */

    /**
     * An authentication process that works with cordova applications.
     * @param {successCallback} successCallback
     * @param {errorCallback} errorCallback
     */

  }, {
    key: 'authenticateWithCordova',
    value: function authenticateWithCordova(successCallback, errorCallback) {
      var redirectUrl = 'https://www.dropbox.com/1/oauth2/redirect_receiver';
      var url = this.getAuthenticationUrl(redirectUrl);
      var removed = false;
      var browser = window.open(url, '_blank');

      function onLoadError() {
        // Try to avoid a browser crash on browser.close().
        window.setTimeout(function () {
          browser.close();
        }, 10);
        errorCallback();
      }

      function onLoadStop(event) {
        var errorLabel = '&error=';
        var errorIndex = event.url.indexOf(errorLabel);

        if (errorIndex > -1) {
          // Try to avoid a browser crash on browser.close().
          window.setTimeout(function () {
            browser.close();
          }, 10);
          errorCallback();
        } else {
          var tokenLabel = '#access_token=';
          var tokenIndex = event.url.indexOf(tokenLabel);
          var tokenTypeIndex = event.url.indexOf('&token_type=');

          if (tokenIndex > -1) {
            tokenIndex += tokenLabel.length; // Try to avoid a browser crash on browser.close().

            window.setTimeout(function () {
              browser.close();
            }, 10);
            var accessToken = event.url.substring(tokenIndex, tokenTypeIndex);
            successCallback(accessToken);
          }
        }
      }

      function onExit() {
        if (removed) {
          return;
        }

        browser.removeEventListener('loaderror', onLoadError);
        browser.removeEventListener('loadstop', onLoadStop);
        browser.removeEventListener('exit', onExit);
        removed = true;
      }

      browser.addEventListener('loaderror', onLoadError);
      browser.addEventListener('loadstop', onLoadStop);
      browser.addEventListener('exit', onExit);
    }
  }, {
    key: 'request',
    value: function request(path, args, auth, host, style) {
      var request = null;

      switch (style) {
        case RPC:
          request = this.getRpcRequest();
          break;

        case DOWNLOAD:
          request = this.getDownloadRequest();
          break;

        case UPLOAD:
          request = this.getUploadRequest();
          break;

        default:
          throw new Error('Invalid request style: ' + style);
      }

      var options = {
        selectUser: this.selectUser,
        selectAdmin: this.selectAdmin,
        clientId: this.getClientId(),
        clientSecret: this.getClientSecret()
      };
      return request(path, args, auth, host, this.getAccessToken(), options);
    }
  }, {
    key: 'setRpcRequest',
    value: function setRpcRequest(newRpcRequest) {
      this.rpcRequest = newRpcRequest;
    }
  }, {
    key: 'getRpcRequest',
    value: function getRpcRequest() {
      if (this.rpcRequest === undefined) {
        this.rpcRequest = rpcRequest;
      }

      return this.rpcRequest;
    }
  }, {
    key: 'setDownloadRequest',
    value: function setDownloadRequest(newDownloadRequest) {
      this.downloadRequest = newDownloadRequest;
    }
  }, {
    key: 'getDownloadRequest',
    value: function getDownloadRequest() {
      if (this.downloadRequest === undefined) {
        this.downloadRequest = downloadRequest;
      }

      return this.downloadRequest;
    }
  }, {
    key: 'setUploadRequest',
    value: function setUploadRequest(newUploadRequest) {
      this.uploadRequest = newUploadRequest;
    }
  }, {
    key: 'getUploadRequest',
    value: function getUploadRequest() {
      if (this.uploadRequest === undefined) {
        this.uploadRequest = uploadRequest;
      }

      return this.uploadRequest;
    }
  }]);
  return DropboxBase;
}();