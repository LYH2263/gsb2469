<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <icon-dashboard :style="{ fontSize: '48px', color: 'var(--color-primary-light-4)' }" />
        <h1>旅运管理系统</h1>
        <p>现代化的物流与旅游资源管理平台</p>
      </div>
      <a-form :model="form" @submit="handleSubmit" layout="vertical">
        <a-form-item field="username" label="用户名" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model="form.username" placeholder="请输入用户名">
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model="form.password" placeholder="请输入密码">
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" long>登录</a-button>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import request from '../../api/request'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const handleSubmit = async ({ values, errors }) => {
  if (errors) {
    Message.error('请检查输入信息')
    return
  }
  loading.value = true
  try {
    const res = await request.post('/login', values)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    Message.success('登录成功')
    router.push('/')
  } catch (err) {
    Message.error(err.response?.data?.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-fill-1);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: var(--color-bg-2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.login-header {
  text-align: center;
  margin-bottom: 40px;
}
.login-header h1 {
  margin: 16px 0 8px;
  font-size: 28px;
  color: var(--color-text-1);
}
.login-header p {
  color: var(--color-text-3);
}
</style>
