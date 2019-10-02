import QueryParams from './queryParams'
import { hasFile, finalResponseIterceptor } from './utils'
import prepareBody from './prepareBody'
import Interceptor from './Interceptor'

const QS = new QueryParams()

export default {
  baseURL: '',
  headers: {},
  cache: 'default',
  credentials: 'same-origin',
  mode: undefined,
  paramsSerializer: QS.buildQueryParams,
  isMultipartFormData: hasFile,
  interceptors: {
    response: new Interceptor(finalResponseIterceptor),
    request: new Interceptor(),
  },
  prepareBody,
}
