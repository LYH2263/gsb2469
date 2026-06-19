<template>
  <div class="page-container">
    <a-card title="城市管理">
      <div class="table-toolbar">
        <a-space>
          <a-input-search 
            v-model="searchKey" 
            placeholder="搜索城市名称..." 
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
            新增城市
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
        <template #resourceCount="{ record }">
          <a-space>
            <a-tag size="small" color="blue">司机: {{ record.drivers?.length || 0 }}</a-tag>
            <a-tag size="small" color="orange">导游: {{ record.guiders?.length || 0 }}</a-tag>
            <a-tag size="small" color="green">商户: {{ (record.restaurants?.length || 0) + (record.stores?.length || 0) }}</a-tag>
          </a-space>
        </template>
        <template #createdAt="{ record }">
          {{ formatDate(record.createdAt) }}
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="handleEdit(record)">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-popconfirm content="确定删除该城市吗？" type="warning" @ok="handleDelete(record)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑城市' : '新增城市'" :on-before-ok="handleModalOk">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-form-item field="name" label="城市名称" :rules="[{ required: true, message: '请输入城市名称' }]">
          <a-input v-model="form.name" placeholder="请输入城市名称" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import request from '../../api/request'
import { Message, Modal } from '@arco-design/web-vue'

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
  name: ''
})

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

const columns = [
  { title: '名称', dataIndex: 'name', width: 150 },
  { title: '关联资源', slotName: 'resourceCount', width: 200 },
  { title: '创建时间', slotName: 'createdAt', width: 180 },
  { title: '操作', slotName: 'optional', width: 160, fixed: 'right' }
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/cities', {
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
  
  const hasResources = tableData.value
    .filter(c => selectedKeys.value.includes(c.id))
    .some(c => (c.drivers?.length || 0) + (c.guiders?.length || 0) + (c.restaurants?.length || 0) + (c.stores?.length || 0) > 0);

  const performDelete = async () => {
    try {
      await request.delete('/cities/bulk', {
        data: { ids: selectedKeys.value }
      })
      Message.success('批量删除成功')
      selectedKeys.value = []
      fetchData()
    } catch (err) {
      // 错误消息已由 request 拦截器显示，这里不再重复
    }
  };

  if (hasResources) {
    Modal.confirm({
      title: '删除确认',
      content: '选中的部分城市下有关联的司机、导游或商户，删除后这些资源将不再属于任何城市。是否确认删除？',
      onOk: performDelete
    });
  } else {
    performDelete();
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentId.value = null
  Object.assign(form, { name: '' })
  modalVisible.value = true
}

const handleEdit = (record) => {
  isEdit.value = true
  currentId.value = record.id
  Object.assign(form, { name: record.name })
  modalVisible.value = true
}

const handleDelete = async (record) => {
  const performDelete = async () => {
    try {
      await request.delete(`/cities/${record.id}`)
      Message.success('删除成功')
      fetchData()
    } catch (err) {
      // 错误消息已由 request 拦截器显示，这里不再重复
    }
  };

  const count = (record.drivers?.length || 0) + (record.guiders?.length || 0) + (record.restaurants?.length || 0) + (record.stores?.length || 0);
  if (count > 0) {
    Modal.confirm({
      title: '删除确认',
      content: `城市「${record.name}」下有关联的资源（司机/导游/商户），删除后这些资源将不再属于任何城市。是否确认删除？`,
      onOk: performDelete
    });
  } else {
    performDelete();
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
      await request.put(`/cities/${currentId.value}`, form)
    } else {
      await request.post('/cities', form)
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
