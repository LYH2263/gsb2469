<template>
  <div class="dashboard">
    <a-spin :loading="loading" style="width: 100%">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <template #title>
              <div class="stat-header">
                <icon-list style="color: var(--color-primary-light-4)" />
                <span>今日订单</span>
              </div>
            </template>
            <div class="stat-value">{{ stats.todayOrders }}</div>
            <div class="stat-footer">{{ todayOrdersDelta }}</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <template #title>
              <div class="stat-header">
                <icon-user style="color: var(--color-warning-light-4)" />
                <span>活跃司机</span>
              </div>
            </template>
            <div class="stat-value">{{ stats.activeDrivers }}</div>
            <div class="stat-footer">{{ activeDriversText }}</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <template #title>
              <div class="stat-header">
                <icon-location style="color: var(--color-success-light-4)" />
                <span>覆盖城市</span>
              </div>
            </template>
            <div class="stat-value">{{ stats.totalCities }}</div>
            <div class="stat-footer">{{ citiesText }}</div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <template #title>
              <div class="stat-header">
                <icon-check-circle-fill class="stat-icon" :style="{ color: '#00b42a' }" />
                <span>订单完成度</span>
              </div>
            </template>
            <div class="stat-value">{{ stats.completionRate }}%</div>
            <div class="stat-footer">{{ completionText }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 20px">
        <a-col :span="16">
          <a-card title="近七日订单趋势" :bordered="false">
            <div class="chart-placeholder">
              <div class="bar-chart">
                <div v-for="(item, index) in orderTrend" :key="index" class="bar-wrapper">
                  <div class="bar-value">{{ item.value }}</div>
                  <div class="bar" :style="{ height: getBarHeight(item.value) }">
                    <span class="bar-tooltip">{{ item.value }}</span>
                  </div>
                  <div class="bar-label">{{ item.label }}</div>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="资源概览" :bordered="false">
            <div class="resource-stats">
              <div v-for="(item, index) in resourceData" :key="index" class="resource-item">
                <div class="resource-info">
                  <span>{{ item.name }}</span>
                  <span>{{ item.value }}</span>
                </div>
                <a-progress :percent="item.percent" :show-text="false" :color="item.color" />
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../../api/request'

const loading = ref(false)
const stats = ref({
  todayOrders: 0,
  yesterdayOrders: 0,
  activeDrivers: 0,
  totalCities: 0,
  completionRate: '100.0',
  resourceStats: [],
  orderTrend: []
})

const fetchStats = async () => {
  loading.value = true
  try {
    const res = await request.get('/stats')
    if (res && typeof res === 'object') {
      stats.value = { ...stats.value, ...res }
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const orderTrend = computed(() => {
  return Array.isArray(stats.value.orderTrend) ? stats.value.orderTrend : []
})

const maxTrendValue = computed(() => {
  const trend = orderTrend.value
  const values = trend.map(t => t.value)
  return values.length ? Math.max(...values, 10) : 10
})

const getBarHeight = (value) => {
  return (value / maxTrendValue.value) * 310 + 'px'
}

const todayOrdersDelta = computed(() => {
  const current = Number(stats.value.todayOrders || 0)
  const previous = Number(stats.value.yesterdayOrders || 0)
  if (previous === 0) {
    return current > 0 ? '较昨日 新增' : '较昨日 无变化'
  }
  const diff = ((current - previous) / previous) * 100
  const sign = diff > 0 ? '+' : ''
  return `较昨日 ${sign}${diff.toFixed(1)}%`
})

const activeDriversText = computed(() => `当前在线 ${stats.value.activeDrivers} 人`)
const citiesText = computed(() => `覆盖 ${stats.value.totalCities} 城市`)
const completionText = computed(() => `有效订单占比 ${stats.value.completionRate}%`)

const resourceData = computed(() => {
  const colors = ['arcoblue', 'green', 'orange', 'red', 'purple', 'pink', 'cyan']
  const resStats = stats.value.resourceStats || []
  if (!Array.isArray(resStats)) return []
  
  const values = resStats.map(s => s.value)
  const max = Math.max(...values, 10)
  
  return resStats.map((item, index) => ({
    name: item.name,
    value: item.value,
    percent: item.value > 0 ? Math.min(item.value / max, 1) : 0,
    color: colors[index % colors.length]
  }))
})

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.stat-card {
  border-radius: 8px;
}
.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 12px 0;
  color: var(--color-text-1);
}
.stat-footer {
  font-size: 12px;
  color: var(--color-text-3);
}
.chart-placeholder {
  height: 380px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
}
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  height: 330px;
  width: 100%;
  padding: 0 20px;
}
.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.bar-value {
  font-size: 12px;
  color: var(--color-text-2);
  font-weight: 500;
}
.bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(180deg, var(--color-primary-light-1) 0%, var(--color-primary-light-4) 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
}
.bar:hover {
  filter: brightness(1.1);
}
.bar:hover .bar-tooltip {
  opacity: 1;
}
.bar-tooltip {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-5);
  color: var(--color-white);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.bar-label {
  font-size: 12px;
  color: var(--color-text-3);
}
.resource-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 5px 0;
}
.resource-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.resource-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-2);
}
</style>
