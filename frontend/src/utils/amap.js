import request from '../api/request'
import AMapLoader from '@amap/amap-jsapi-loader'

let amapPromise = null

export function loadAMap() {
  if (amapPromise) return amapPromise

  amapPromise = new Promise((resolve, reject) => {
    request.get('/amap-config')
      .then(config => {
        const { key, securityJsCode } = config

        // 设置安全密钥 - 必须在 AMapLoader.load 之前设置
        window._AMapSecurityConfig = {
          securityJsCode: securityJsCode
        }

        // 不预加载插件，让 AMap.plugin 来加载
        AMapLoader.load({
          key: key,
          version: "2.0"
        })
        .then((AMap) => {
          resolve(AMap)
        })
        .catch((err) => {
          amapPromise = null
          reject(new Error('高德地图加载失败: ' + err.message))
        })
      })
      .catch(err => {
        amapPromise = null
        reject(err)
      })
  })

  return amapPromise
}
