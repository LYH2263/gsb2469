<template>
  <div class="page-container">
    <a-card title="车队管理">
      <div class="table-toolbar">
        <a-space>
          <a-input-search 
            v-model="searchKey" 
            placeholder="搜索车队名称/负责人..." 
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
            新增车队
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
        <template #status="{ record }">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status === 'active' ? '运营中' : '休整中' }}
          </a-tag>
        </template>
        <template #driverCount="{ record }">
          {{ record.drivers?.length || 0 }}
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
            <a-popconfirm content="确定删除该车队吗？" type="warning" @ok="handleDelete(record)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="modalVisible" :title="isEdit ? '编辑车队' : '新增车队'" :on-before-ok="handleModalOk">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-form-item field="name" label="车队名称" :rules="[{ required: true, message: '请输入车队名称' }]">
          <a-input v-model="form.name" placeholder="请输入车队名称" />
        </a-form-item>
        <a-form-item field="leader" label="车队负责人" :rules="[{ required: true, message: '请输入负责人' }]">
          <a-input v-model="form.leader" placeholder="请输入负责人姓名" />
        </a-form-item>
        <a-form-item field="contact" label="联系电话" :rules="[{ required: true, message: '请输入联系电话' }]">
          <a-input v-model="form.contact" placeholder="请输入联系电话" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-select v-model="form.status">
            <a-option value="active">运营中</a-option>
            <a-option value="inactive">休整中</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import request from '../../api/request'

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
  leader: '',
  contact: '',
  status: 'active'
})

const columns = [
  { title: '车队名称', dataIndex: 'name', width: 120 },
  { title: '负责人', dataIndex: 'leader', width: 100 },
  { title: '联系电话', dataIndex: 'contact', width: 140 },
  { title: '状态', slotName: 'status', width: 60 },
  { title: '司机数量', slotName: 'driverCount', width: 100 },
  { title: '创建时间', slotName: 'createdAt', width: 180 },
  { title: '操作', slotName: 'optional', width: 160, fixed: 'right' }
]

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

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/fleets', {
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
  
  const hasDrivers = tableData.value
    .filter(f => selectedKeys.value.includes(f.id))
    .some(f => f.drivers?.length > 0);

  const performDelete = async () => {
    try {
      await request.delete('/fleets/bulk', {
        data: { ids: selectedKeys.value }
      })
      Message.success('批量删除成功')
      selectedKeys.value = []
      fetchData()
    } catch (err) {
      Message.error('批量删除失败')
    }
  };

  if (hasDrivers) {
    Modal.confirm({
      title: '删除确认',
      content: '选中的部分车队下有关联的司机，删除后这些司机将不再属于任何车队。是否确认删除？',
      onOk: performDelete
    });
  } else {
    performDelete();
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentId.value = null
  Object.assign(form, { name: '', leader: '', contact: '', status: 'active' })
  modalVisible.value = true
}

const handleEdit = (record) => {
  isEdit.value = true
  currentId.value = record.id
  Object.assign(form, { 
    name: record.name,
    leader: record.leader,
    contact: record.contact,
    status: record.status
  })
  modalVisible.value = true
}

const handleDelete = async (record) => {
  const performDelete = async () => {
    try {
      await request.delete(`/fleets/${record.id}`)
      Message.success('删除成功')
      fetchData()
    } catch (err) {
      Message.error('删除失败')
    }
  };

  if (record.drivers?.length > 0) {
    Modal.confirm({
      title: '删除确认',
      content: `车队「${record.name}」下有关联的司机，删除后这些司机将不再属于任何车队。是否确认继续删除？`,
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
      await request.put(`/fleets/${currentId.value}`, form)
    } else {
      await request.post('/fleets', form)
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
.page-container {
  padding: 0;
}
.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
