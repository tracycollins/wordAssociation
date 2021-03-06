'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

exports.uploadRequest = uploadRequest;

var _utils = require('./utils');

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

function uploadRequest(path, args, auth, host, accessToken, options) {
  if (auth !== 'user') {
    throw new Error('Unexpected auth type: ' + auth);
  }

  var contents = args.contents;
  delete args.contents;
  var fetchOptions = {
    body: contents,
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': (0, _utils.httpHeaderSafeJson)(args)
    }
  };

  if (options) {
    if (options.selectUser) {
      fetchOptions.headers['Dropbox-API-Select-User'] = options.selectUser;
    }

    if (options.selectAdmin) {
      fetchOptions.headers['Dropbox-API-Select-Admin'] = options.selectAdmin;
    }
  }

  return fetch((0, _utils.getBaseURL)(host) + path, fetchOptions).then(function (res) {
    return parseBodyToType(res);
  }).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
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

    return data;
  });
}