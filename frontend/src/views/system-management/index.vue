<template>
  <div class="system-management">
    <a-typography-title :heading="5" style="margin-top: 0; margin-bottom: 20px;">
      系统管理
    </a-typography-title>
    
    <a-card :bordered="false" class="page-card">
      <a-tabs default-active-key="1" type="rounded" size="large">
        <a-tab-pane key="1">
          <template #title>
            <icon-user /> 用户管理
          </template>
          <div class="tab-content">
            <div class="table-header">
              <a-input-search v-model="searchKey" placeholder="搜索用户名" style="width: 240px" allow-clear @search="fetchData" @clear="fetchData" />
              <a-button type="primary" @click="handleAddUser">
                <template #icon><icon-plus /></template>
                添加用户
              </a-button>
            </div>
            <a-table row-key="id" :data="tableData" :columns="columns" :loading="loading" :pagination="true" :stripe="true" :hoverable="true" :scroll="{ x: 1000 }">
              <template #createdAt="{ record }">
                {{ formatDate(record.createdAt) }}
              </template>
              <template #updatedAt="{ record }">
                {{ formatDate(record.updatedAt) }}
              </template>
              <template #actions="{ record }">
                <a-space>
                  <a-button type="text" size="small" @click="handleEditUser(record)">
                    <template #icon><icon-edit /></template>
                    编辑
                  </a-button>
                  <a-popconfirm v-if="record.username !== 'admin'" content="确定删除该用户吗？" type="warning" @ok="handleDeleteUser(record.id)">
                    <a-button type="text" size="small" status="danger">
                      <template #icon><icon-delete /></template>
                      删除
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        <a-tab-pane key="2">
          <template #title>
            <icon-info-circle /> 系统信息
          </template>
          <div class="tab-content">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-descriptions :data="systemInfo" title="基础信息" :column="1" bordered />
              </a-col>
              <a-col :span="12">
                <a-descriptions :data="runtimeInfo" title="运行环境" :column="1" bordered />
              </a-col>
            </a-row>
            <div class="info-footer">
              <a-alert type="info" show-icon>
                系统当前运行状态良好，所有核心服务均在线。
              </a-alert>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑用户' : '添加用户'" :on-before-ok="handleModalOk">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-form-item field="username" label="用户名" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model="form.username" :disabled="isEdit" />
        </a-form-item>
        <a-form-item field="password" label="密码" :rules="passwordRules">
          <a-input-password v-model="form.password" :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import request from '../../api/request'

const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')

const columns = [
  { title: '用户名', dataIndex: 'username', width: 180 },
  { title: '创建时间', slotName: 'createdAt', width: 200 },
  { title: '更新时间', slotName: 'updatedAt', width: 200 },
  { title: '操作', slotName: 'actions', width: 160, fixed: 'right' }
]

const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref('')
const form = reactive({
  username: '',
  password: ''
})

const passwordRules = computed(() => {
  return isEdit.value ? [] : [{ required: true, message: '请输入密码' }]
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/users', { params: { search: searchKey.value } })
    tableData.value = Array.isArray(res) ? res : (res?.list || res?.data || [])
  } catch (err) {
    Message.error('获取用户失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleAddUser = () => {
  isEdit.value = false
  currentId.value = ''
  Object.assign(form, {
    username: '',
    password: ''
  })
  modalVisible.value = true
}

const handleEditUser = (record) => {
  isEdit.value = true
  currentId.value = record.id
  Object.assign(form, {
    username: record.username,
    password: ''
  })
  modalVisible.value = true
}

const handleDeleteUser = async (id) => {
  try {
    await request.delete(`/users/${id}`)
    Message.success('删除成功')
    fetchData()
  } catch (err) {
    Message.error('删除失败')
  }
}

const handleModalOk = async () => {
  const res = await formRef.value.validate()
  if (res) {
    Message.error('请填写必填项')
    return false
  }
  
  const payload = { username: form.username, password: form.password }
  if (isEdit.value && !payload.password) delete payload.password
  try {
    if (isEdit.value) {
      await request.put(`/users/${currentId.value}`, payload)
    } else {
      await request.post('/users', payload)
    }
    Message.success('操作成功')
    fetchData()
    return true
  } catch (err) {
    Message.error('操作失败')
    return false
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const systemInfo = ref([])
const runtimeInfo = ref([])

const fetchSystemInfo = async () => {
  try {
    const res = await request.get('/system-info')
    systemInfo.value = Array.isArray(res?.systemInfo) ? res.systemInfo : []
    runtimeInfo.value = Array.isArray(res?.runtimeInfo) ? res.runtimeInfo : []
  } catch (err) {
    systemInfo.value = []
    runtimeInfo.value = []
  }
}

onMounted(() => {
  fetchData()
  fetchSystemInfo()
})
</script>

<style scoped>
.system-management {
  padding: 0;
}
.page-card {
  border-radius: 12px;
}
.tab-content {
  padding: 20px 0;
}
.table-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-footer {
  margin-top: 32px;
}
:deep(.arco-descriptions-title) {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}
</style>
