import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/dashboard/index.vue'), meta: { title: '系统概览' } },
      { path: 'delivery-orders', name: 'DeliveryOrders', component: () => import('../views/delivery-order/index.vue'), meta: { title: '订单管理' } },
      { path: 'fleets', name: 'Fleets', component: () => import('../views/fleet/index.vue'), meta: { title: '车队管理' } },
      { path: 'vehicles', name: 'Vehicles', component: () => import('../views/vehicle/index.vue'), meta: { title: '车辆管理' } },
      { path: 'drivers', name: 'Drivers', component: () => import('../views/driver/index.vue'), meta: { title: '司机管理' } },
      { path: 'guiders', name: 'Guiders', component: () => import('../views/guider/index.vue'), meta: { title: '导游管理' } },
      { path: 'restaurants', name: 'Restaurants', component: () => import('../views/restaurant/index.vue'), meta: { title: '餐馆管理' } },
      { path: 'stores', name: 'Stores', component: () => import('../views/store/index.vue'), meta: { title: '购物店管理' } },
      { path: 'cities', name: 'Cities', component: () => import('../views/city/index.vue'), meta: { title: '城市管理' } },
      { path: 'system-management', name: 'SystemManagement', component: () => import('../views/system-management/index.vue'), meta: { title: '系统管理' } },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/exception/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
