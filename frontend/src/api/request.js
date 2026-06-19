import axios from 'axios'
import { Message } from '@arco-design/web-vue'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  response => response.data,
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message

    // 登录接口的 401 错误不在这里处理，交给调用方处理
    if (error.config.url === '/login' && status === 401) {
      return Promise.reject(error)
    }

    // 其他接口的错误显示提示
    Message.error(message || '请求失败，请稍后重试')

    // 非登录接口的 401 错误，清除 token 并重定向
    if (status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default request
