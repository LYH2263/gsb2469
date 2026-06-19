<template>
  <a-layout class="layout-container">
    <a-layout-sider
      breakpoint="lg"
      :width="220"
      collapsible
      :collapsed="collapsed"
      @collapse="onCollapse"
    >
      <div class="logo">
        <icon-dashboard :style="{ fontSize: '32px', color: 'var(--color-primary-light-4)' }" />
        <span v-if="!collapsed" class="logo-text">旅运管理系统</span>
      </div>
      <a-menu
        :selected-keys="selectedKeys"
        :auto-open-selected="true"
        @menu-item-click="onClickMenuItem"
      >
        <a-menu-item key="Dashboard">
          系统概览
        </a-menu-item>
        <a-menu-item key="DeliveryOrders">
          订单管理
        </a-menu-item>
        <a-menu-item key="Fleets">
          车队管理
        </a-menu-item>
        <a-menu-item key="Vehicles">
          车辆管理
        </a-menu-item>
        <a-menu-item key="Drivers">
          司机管理
        </a-menu-item>
        <a-menu-item key="Guiders">
          导游管理
        </a-menu-item>
        <a-menu-item key="Restaurants">
          餐馆管理
        </a-menu-item>
        <a-menu-item key="Stores">
          购物店管理
        </a-menu-item>
        <a-menu-item key="ScenicSpots">
          景点管理
        </a-menu-item>
        <a-menu-item key="Cities">
          城市管理
        </a-menu-item>
        <a-menu-item key="SystemManagement">
          系统管理
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout class="main-layout" :style="mainLayoutStyle">
      <a-layout-header class="header">
        <div class="header-left">
          <a-button type="text" @click="onCollapse(!collapsed)">
            <icon-menu-unfold v-if="collapsed" />
            <icon-menu-fold v-else />
          </a-button>
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item>
              <icon-home />
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.name !== 'Dashboard'">{{ route.meta.title }}</a-breadcrumb-item>
            <a-breadcrumb-item v-else>首页</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-button type="text" @click="toggleTheme" class="theme-btn">
            <template #icon>
              <icon-moon-fill v-if="isDark" />
              <icon-sun-fill v-else />
            </template>
          </a-button>
          <a-dropdown @select="handleUserSelect">
            <a-avatar :size="32" style="cursor: pointer; background-color: var(--color-primary-light-4)">{{ displayName }}</a-avatar>
            <template #content>
              <a-doption value="logout">
                <template #icon><icon-export /></template>
                退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const isDark = ref(localStorage.getItem('theme') === 'dark')

const selectedKeys = computed(() => (route.name ? [route.name] : []))
const mainLayoutStyle = computed(() => ({
  marginLeft: collapsed.value ? '64px' : '220px',
  width: collapsed.value ? 'calc(100vw - 64px)' : 'calc(100vw - 220px)'
}))
const displayName = computed(() => {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return '用户'
    const parsed = JSON.parse(raw)
    return parsed?.username || '用户'
  } catch (error) {
    return '用户'
  }
})

const onCollapse = (val) => {
  collapsed.value = val
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.body.setAttribute('arco-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
    localStorage.setItem('theme', 'light')
  }
}

// 初始化主题
if (isDark.value) {
  document.body.setAttribute('arco-theme', 'dark')
}

const onClickMenuItem = (key) => {
  router.push({ name: key })
}

const handleUserSelect = (val) => {
  if (val === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* 确保右侧布局独立滚动 */
:deep(.arco-layout) {
  overflow: hidden;
}

:deep(.arco-layout-sider) {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.main-layout {
  transition: all 0.3s;
}
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.3s;
}
.logo-text {
  color: var(--color-text-1);
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}
.header {
  height: 64px;
  background: var(--color-bg-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.breadcrumb {
  margin-left: 8px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 20px;
}
.theme-btn {
  font-size: 18px;
  color: var(--color-text-2);
}
.content {
  padding: 28px;
  background: linear-gradient(180deg, var(--color-fill-2), var(--color-fill-1));
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.3s;
  height: calc(100vh - 64px);
  box-sizing: border-box;
}

/* Hide scrollbar but allow scrolling */
.content::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
