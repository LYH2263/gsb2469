<template>
  <div class="page-container">
    <a-card title="车辆管理">
      <div class="table-toolbar">
        <a-space>
          <a-input-search 
            v-model="searchKey" 
            placeholder="搜索车辆名称/平台名称..." 
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
            新增车辆
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
        :scroll="{ x: 800 }"
        :pagination="pagination"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #optional="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="handleEdit(record)">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-popconfirm content="确定删除该车辆吗？" type="warning" @ok="handleDelete(record.id)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑车辆' : '新增车辆'" :on-before-ok="handleModalOk">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-form-item field="name" label="名称" :rules="[{ required: true, message: '请输入名称' }]">
          <a-input v-model="form.name" />
        </a-form-item>
        <a-form-item field="carPlatformName" label="平台车名" :rules="[{ required: true, message: '请输入平台车名' }]">
          <a-input v-model="form.carPlatformName" />
        </a-form-item>
        <a-form-item field="carPlatformId" label="平台车ID" :rules="[{ required: true, message: '请输入平台车ID' }]">
          <a-input v-model="form.carPlatformId" />
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
  carPlatformName: '',
  carPlatformId: ''
})

const columns = [
  { title: '名称', dataIndex: 'name', width: 150 },
  { title: '平台名称', dataIndex: 'carPlatformName', width: 150 },
  { title: '平台ID', dataIndex: 'carPlatformId', width: 150 },
  { title: '操作', slotName: 'optional', width: 160, fixed: 'right' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/vehicles', {
      params: {
        search: searchKey.value,
        page: pagination.current,
        pageSize: pagination.pageSize
      }
    })
    const list = Array.isArray(res) ? res : (res?.list || res?.data || []);
    tableData.value = list;
    pagination.total = Array.isArray(res) ? res.length : (res?.total || res?.list?.length || res?.data?.length || 0);
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
    await request.delete('/vehicles/bulk', {
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
  Object.assign(form, { name: '', carPlatformName: '', carPlatformId: '' })
  modalVisible.value = true
}

const handleEdit = (record) => {
  isEdit.value = true
  currentId.value = record.id
  Object.assign(form, { 
    name: record.name, 
    carPlatformName: record.carPlatformName, 
    carPlatformId: record.carPlatformId 
  })
  modalVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/vehicles/${id}`)
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
      await request.put(`/vehicles/${currentId.value}`, form)
    } else {
      await request.post('/vehicles', form)
    }
    Message.success('操作成功')
    fetchData()
    return true
  } catch (err) {
    return false
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
