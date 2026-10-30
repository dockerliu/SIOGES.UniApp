import { useAuthStore } from '@/stores/auth'

export interface HealthResponse {
  status: string
  connected: boolean
  [key: string]: unknown
}

export function request<T>(path: string, method: UniApp.RequestOptions['method'] = 'GET', data?: UniApp.RequestOptions['data']): Promise<T> {
  const { baseUrl, token } = useAuthStore()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseUrl}${normalizedPath}`,
      method,
      data,
      timeout: 10000,
      header: token ? { Authorization: `Bearer ${token}` } : undefined,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data as T)
        else {
          const body = response.data as { detail?: unknown; error?: unknown } | null
          const message = typeof body?.detail === 'string'
            ? body.detail
            : typeof body?.error === 'string'
              ? body.error
              : `请求失败（HTTP ${response.statusCode}）`
          reject(new Error(message))
        }
      },
      fail: (error) => reject(new Error(error.errMsg || '无法连接中间件')),
    })
  })
}

export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}
