import { getBaseURL, httpHeaderSafeJson } from './utils';

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

export function uploadRequest(path, args, auth, host, accessToken, options) {
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
      'Dropbox-API-Arg': httpHeaderSafeJson(args)
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

  return fetch(getBaseURL(host) + path, fetchOptions).then(function (res) {
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

    return data;
  });
}