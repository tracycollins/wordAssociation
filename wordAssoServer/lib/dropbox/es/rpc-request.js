import { Buffer } from 'buffer/';
import { getBaseURL } from './utils';

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

export function rpcRequest(path, body, auth, host, accessToken, options) {
  var fetchOptions = {
    method: 'POST',
    body: body ? JSON.stringify(body) : null
  };
  var headers = {};

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  var authHeader = '';

  switch (auth) {
    case 'app':
      if (!options.clientId || !options.clientSecret) {
        throw new Error('A client id and secret is required for this function');
      }

      authHeader = new Buffer(options.clientId + ':' + options.clientSecret).toString('base64');
      headers.Authorization = 'Basic ' + authHeader;
      break;

    case 'team':
    case 'user':
      headers.Authorization = 'Bearer ' + accessToken;
      break;

    case 'noauth':
      break;

    default:
      throw new Error('Unhandled auth type: ' + auth);
  }

  if (options) {
    if (options.selectUser) {
      headers['Dropbox-API-Select-User'] = options.selectUser;
    }

    if (options.selectAdmin) {
      headers['Dropbox-API-Select-Admin'] = options.selectAdmin;
    }
  }

  fetchOptions.headers = headers;
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