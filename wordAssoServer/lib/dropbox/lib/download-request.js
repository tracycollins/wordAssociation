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

exports.downloadRequest = downloadRequest;

var _utils = require('./utils');

function getDataFromConsumer(res) {
  if (!res.ok) {
    return res.text();
  }

  return (0, _utils.isWindowOrWorker)() ? res.blob() : res.buffer();
}

function responseHandler(res, data) {
  if (!res.ok) {
    // eslint-disable-next-line no-throw-literal
    throw {
      error: data,
      response: res,
      status: res.status
    };
  }

  var result = JSON.parse(res.headers.get('dropbox-api-result'));

  if ((0, _utils.isWindowOrWorker)()) {
    result.fileBlob = data;
  } else {
    result.fileBinary = data.toString();
  }

  return result;
}

function downloadRequest(path, args, auth, host, accessToken, options) {
  if (auth !== 'user') {
    throw new Error('Unexpected auth type: ' + auth);
  }

  var fetchOptions = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
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
    return getDataFromConsumer(res).then(function (data) {
      return [res, data];
    });
  }).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        res = _ref2[0],
        data = _ref2[1];

    return responseHandler(res, data);
  });
}