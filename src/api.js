import defaultConfigs from './defaults'
import get from 'lodash/get'
import has from 'lodash/has'
import { buildUrl, mergeConfigs } from './utils'


class API {
  constructor(configs) {
    this.defaults = mergeConfigs(configs, defaultConfigs)
  }

  request(configs) {
    let {
      baseURL,
      endpoint,
      params,
      paramsSerializer,
      method,
      headers,
      body,
      credentials,
      cache,
      mode,
      signal,
      isMultipartFormData,
      interceptors,
      prepareBody,
    } = mergeConfigs(configs, this.defaults)
    const resource = buildUrl(baseURL, endpoint, params, paramsSerializer)
    const _headers = new Headers({
      ...this.defaults.headers,
      ...headers,
    })
    const _isMultipartFormData = isMultipartFormData(body)
    if(_isMultipartFormData) {
      _headers.set('Content-Type', 'multipart/form-data')
    }

    body = method === 'GET' ? undefined : prepareBody(Object.assign({}, body), _isMultipartFormData)
    const options = {
      method,
      headers: _headers,
      body,
      signal,
      cache,
      credentials,
      mode,
    }
    return interceptors.request.run({ url: resource, ...options })
      .catch(error => {
        return interceptors.request.err({ data: { url: resource, ...options }, error })
      })
      .then(({ url, ...opts }) => {
        const request = new Request(url, opts)
        return fetch(request)
      })
      .then(response => {
        return handleResponseCallback(response)
      })
      .then(data => {
        if(get(data, 'response.ok')) {
          return data
        }
        return Promise.reject(data)
      })
      .then(data => {
        return interceptors.response.run(data)
      })
      .catch(err => {
        if(get(err, 'code') === 20) {
          return Promise.reject(err)
        }
        return interceptors.response.err(err)
      })
  }

  get(endpoint, params = {}) {
    return this.request(makeParams(endpoint, params, 'GET'))
  }

  post(endpoint, body = {}, params = {}) {
    return this.request(makeBodyParams(endpoint, body, params, 'POST'))
  }

  put(endpoint, body = {}, params = {}) {
    return this.request(makeBodyParams(endpoint, body, params, 'PUT'))
  }

  patch(endpoint, body = {}, params = {}) {
    return this.request(makeBodyParams(endpoint, body, params, 'PATCH'))
  }

  options(endpoint, params = {}) {
    return this.request(makeParams(endpoint, params, 'OPTIONS'))
  }

  delete(endpoint, params = {}) {
    return this.request(makeParams(endpoint, params, 'DELETE'))
  }
}


function checkUrl(url, params = {}) {
  if(!url) {
    throw new Error(`endpoint is required but got: ${url}`)
  }
  if(typeof url === 'object' && !has(url, 'endpoint')) {
    throw new Error(`endpoint is required but got: ${url.endpoint}`)
  }
  if(typeof url === 'string' && !has(params, 'endpoint')) {
    throw new Error(`endpoint is required but got: ${params.endpoint}`)
  }
}

function makeParams(url, params = {}, method) {
  checkUrl(url, params)
  if(typeof url === 'string') {
    return { ...(params || {}), endpoint: url, method }
  }
  return { ...(url || {}), method }
}

function makeBodyParams(url, body = {}, params = {}, method) {
  checkUrl(url, params)
  if(typeof url === 'string') {
    return { ...(params || {}), endpoint: url, body, method }
  }
  return { ...(url || {}), body, method }
}

export default function createInstance(configs) {
  return new API(configs)
}

function handleResponseCallback(response) {
  if(response && response.headers && response.headers.get && (response.headers.get('Content-Type') || '').includes('application/json')) {
    return response.json().then(data => ({ data, response }))
  }
  return { response }
}
