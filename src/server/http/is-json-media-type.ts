import {
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  HTTP_SYNTAX,
} from '@/lib/http/constants'

const { CONTENT_TYPE } = HTTP_HEADERS
const { JSON: JSON_CONTENT_TYPE } = HTTP_CONTENT_TYPE
const { CONTENT_TYPE_PARAMETER_SEPARATOR } = HTTP_SYNTAX

export const isJsonMediaType = (request: Request): boolean =>
  request.headers
    .get(CONTENT_TYPE)
    ?.split(CONTENT_TYPE_PARAMETER_SEPARATOR)[0]
    .trim()
    .toLowerCase() === JSON_CONTENT_TYPE
