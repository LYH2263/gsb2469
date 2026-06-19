<template>
  <div class="page-container">
    <a-card title="司机管理">
      <div class="table-toolbar">
        <a-space>
          <a-input-search 
            v-model="searchKey" 
            placeholder="搜索司机名称/手机号..." 
            style="width: 240px" 
            @search="handleSearch"
            @clear="handleSearch"
            allow-clear
          />
          <a-popconfirm content="确定要批量删除选中的项吗？" type="warning" @ok="handleBatchDelete">
            <a-button type="primary" status="danger" :disabled="!selectedKeys.length">
              <template #icon><icon-delete /></template>
            </a-button>
          </a-popconfirm>
        </a-space>
        <div class="toolbar-right">
          <a-button type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>
            新增司机
          </a-button>
        </div>
      </div>
      <a-table 
        v-model:selected-keys="selectedKeys"
        row-key="id"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        :data="tableData" 
        :loading="loading" 
        :columns="columns" 
        :stripe="true" 
        :hoverable="true" 
        :scroll="{ x: 1000 }"
        :pagination="pagination"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #city="{ record }">
          {{ record.city?.name }}
        </template>
        <template #fleet="{ record }">
          {{ record.fleet?.name || '-' }}
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="handleEdit(record)">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-popconfirm content="确定删除该司机吗？" type="warning" @ok="handleDelete(record.id)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑司机' : '新增司机'" :on-before-ok="handleModalOk">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-form-item field="name" label="名称" :rules="[{ required: true, message: '请输入名称' }]">
          <a-input v-model="form.name" />
        </a-form-item>
        <a-form-item field="cityId" label="关联城市" :rules="[{ required: true, message: '请选择城市' }]">
          <a-select v-model="form.cityId" placeholder="请选择城市">
            <a-option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="fleetId" label="关联车队">
          <a-select v-model="form.fleetId" placeholder="请选择车队" allow-clear>
            <a-option v-for="fleet in fleets" :key="fleet.id" :value="fleet.id">{{ fleet.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="phone" label="手机号" :rules="[{ validator: validatePhone }]">
          <a-input v-model="form.phone" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item field="email" label="邮箱" :rules="[{ required: true, message: '请输入邮箱' }, { validator: validateEmail }]">
          <a-input v-model="form.email" placeholder="请输入邮箱" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import request from '../../api/request'
import { Message } from '@arco-design/web-vue'

const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')
const selectedKeys = ref([])
const cities = ref([])
const fleets = ref([])
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showJumper: false,
  showPageSize: true
})

const form = reactive({
  name: '',
  cityId: '',
  fleetId: '',
  phone: '',
  email: ''
})

const columns = [
  { title: '名称', dataIndex: 'name', width: 100 },
  { title: '城市', slotName: 'city', width: 100 },
  { title: '车队', slotName: 'fleet', width: 100 },
  { title: '手机号', dataIndex: 'phone', width: 120 },
  { title: '邮箱', dataIndex: 'email', width: 150 },
  { title: '操作', slotName: 'optional', width: 160, fixed: 'right' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const [dRes, cRes, fRes] = await Promise.all([
      request.get('/drivers', {
        params: {
          search: searchKey.value,
          page: pagination.current,
          pageSize: pagination.pageSize
        }
      }),
      request.get('/cities'),
      request.get('/fleets')
    ])
    const list = Array.isArray(dRes) ? dRes : (dRes?.list || dRes?.data || []);
    tableData.value = list;
    pagination.total = Array.isArray(dRes) ? dRes.length : (dRes?.total || dRes?.list?.length || dRes?.data?.length || 0);
    const cityList = Array.isArray(cRes) ? cRes : (cRes?.list || cRes?.data || []);
    cities.value = cityList;
    const fleetList = Array.isArray(fRes) ? fRes : (fRes?.list || fRes?.data || []);
    fleets.value = fleetList;
  } catch (err) {
    console.error(err)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchData()
}

const onPageChange = (current) => {
  pagination.current = current
  fetchData()
}

const onPageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.current = 1
  fetchData()
}

const handleBatchDelete = async () => {
  if (selectedKeys.value.length === 0) return
  try {
    await request.delete('/drivers/bulk', {
      data: { ids: selectedKeys.value }
    })
    Message.success('批量删除成功')
    selectedKeys.value = []
    fetchData()
  } catch (err) {
    Message.error('批量删除失败')
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentId.value = null
  Object.assign(form, { name: '', cityId: '', fleetId: '', phone: '', email: '' })
  modalVisible.value = true
}

const handleEdit = (record) => {
  isEdit.value = true
  currentId.value = record.id
  const cityId = record.cityId ?? record.city?.id ?? ''
  const fleetId = record.fleetId ?? record.fleet?.id ?? ''
  Object.assign(form, { 
    name: record.name, 
    cityId, 
    fleetId, 
    phone: record.phone, 
    email: record.email
  })
  modalVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/drivers/${id}`)
    Message.success('删除成功')
    fetchData()
  } catch (err) {
    Message.error('删除失败')
  }
}

const handleModalOk = async () => {
  const errors = await formRef.value.validate()
  if (errors) {
    Message.error('请填写必填项')
    return false
  }
  
  try {
    if (isEdit.value) {
      await request.put(`/drivers/${currentId.value}`, form)
    } else {
      await request.post('/drivers', form)
    }
    Message.success('操作成功')
    fetchData()
    return true
  } catch (err) {
    return false
  }
}

// 手机号校验
const validatePhone = (value, callback) => {
  if (!value) return callback()
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(value)) {
    callback('手机号格式错误，请输入正确的11位手机号')
  } else {
    callback()
  }
}

// 邮箱校验
const validateEmail = (value, callback) => {
  if (!value) return callback()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    callback('邮箱格式错误，请输入正确的邮箱地址')
  } else {
    callback()
  }
}

onMounted(fetchData)
</script>

<style scoped>
.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
