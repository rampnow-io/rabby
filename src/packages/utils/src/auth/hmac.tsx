import axios, { InternalAxiosRequestConfig } from "axios"
import CryptoJS from "crypto-js"

export interface GetRampnowHmacHeadersProps {
  secret: string
  method: string
  path: string
  body?: string
  apiKey?: string
}

export function getRampnowHmacHeaders(props: GetRampnowHmacHeadersProps) {
  const timestamp = Math.floor(Date.now() / 1000) // unix
  const payload = `${timestamp}${props.method}${props.path}${props.body ?? ""}`
  const signature = CryptoJS.enc.Hex.stringify(
    CryptoJS.HmacSHA256(payload, props.secret),
  )

  let headers = {
    "X-RAMPNOW-SIGN": signature,
    "X-RAMPNOW-TIMESTAMP": String(timestamp),
    "X-RAMPNOW-API-KEY": props.apiKey,
  }

  if (props.apiKey) {
    headers["X-RAMPNOW-API-KEY"] = props.apiKey
  }

  return headers
}

/**
 * Create an Axios request interceptor that adds Rampnow HMAC headers.
 * Usage: `axios.interceptors.request.use(createRampnowHmacAxiosInterceptor(secret, apiKey))`
 */
export function createRampnowHmacAxiosInterceptor(
  secret: string,
  apiKey?: string,
) {
  return (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? "GET").toString().toUpperCase()

    let path = config.url ?? ""
    try {
      const url = new URL(path, config.baseURL || "http://localhost")
      path = url.pathname + url.search
    } catch {
      // If URL parsing fails, use the path as-is (likely already a relative path)
    }

    let body: string | undefined
    if (config.data) {
      body =
        typeof config.data === "string"
          ? config.data
          : JSON.stringify(config.data)
    }

    const headers = getRampnowHmacHeaders({
      secret,
      method,
      path,
      body,
      apiKey,
    })

    Object.assign(config.headers, headers)

    return config
  }
}

export function createHmacClient(secret: string, apiKey?: string) {
  const client = axios.create()
  client.interceptors.request.use(
    createRampnowHmacAxiosInterceptor(secret, apiKey),
  )

  return client
}
