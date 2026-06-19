<template>
  <div class="page-container">
    <a-card title="导游管理">
      <div class="table-toolbar">
        <a-space>
          <a-input-search 
            v-model="searchKey" 
            placeholder="搜索导游名称/手机号..." 
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
            新增导游
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
          {{ record.city?.name || '-' }}
        </template>
        <template #optional="{ record }">
          <a-space>
            <a-button type="text" size="small" @click="handleEdit(record)">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-popconfirm content="确定删除该导游吗？" type="warning" @ok="handleDelete(record.id)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:visible="modalVisible" title="导游信息" :on-before-ok="handleModalOk" width="700px">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="name" label="名称" :rules="[{ required: true, message: '请输入名称' }]"><a-input v-model="form.name" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="enName" label="英文名称"><a-input v-model="form.enName" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="cityId" label="城市" :rules="[{ required: true, message: '请选择城市' }]">
              <a-select v-model="form.cityId">
                <a-option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="phone" label="手机号" :rules="[{ validator: validatePhone }]"><a-input v-model="form.phone" placeholder="请输入手机号" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="email" label="邮箱" :rules="[{ required: true, message: '请输入邮箱' }, { validator: validateEmail }]"><a-input v-model="form.email" placeholder="请输入邮箱" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="language" label="语言" :rules="[{ required: true, message: '请输入语言' }]"><a-input v-model="form.language" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="guideLicense" label="导游证"><a-input v-model="form.guideLicense" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="bankName" label="银行名称"><a-input v-model="form.bankName" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="bankAccountName" label="开户名"><a-input v-model="form.bankAccountName" /></a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="bankAccount" label="银行账号"><a-input v-model="form.bankAccount" /></a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item field="password" label="密码" :rules="[{ required: !isEdit, message: '请输入密码' }]">
              <a-input-password v-model="form.password" :placeholder="isEdit ? '留空不修改' : ''" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive } from 'vue'
import request from '../../api/request'
import { Message } from '@arco-design/web-vue'

const loading = ref(false); const tableData = ref([]); const searchKey = ref(''); const selectedKeys = ref([]); const cities = ref([]); const modalVisible = ref(false); const isEdit = ref(false); const formRef = ref(null); const currentId = ref(null);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: true, showJumper: false, showPageSize: true });
const form = reactive({ name: '', enName: '', cityId: '', phone: '', email: '', language: '', guideLicense: '', bankName: '', bankAccountName: '', bankAccount: '', password: '' });
const columns = [
  { title: '名称', dataIndex: 'name', width: 120 },
  { title: '城市', slotName: 'city', width: 120 },
  { title: '邮箱', dataIndex: 'email', width: 200 },
  { title: '语言', dataIndex: 'language', width: 120 },
  { title: '操作', slotName: 'optional', width: 160, fixed: 'right' }
];
const fetchData = async () => {
  loading.value = true
  try {
    const [res, c] = await Promise.all([
      request.get('/guiders', { params: { search: searchKey.value, page: pagination.current, pageSize: pagination.pageSize } }), 
      request.get('/cities')
    ])
    const list = Array.isArray(res) ? res : (res?.list || res?.data || []);
    tableData.value = list;
    pagination.total = Array.isArray(res) ? res.length : (res?.total || res?.list?.length || res?.data?.length || 0);
    const cityList = Array.isArray(c) ? c : (c?.list || c?.data || []);
    cities.value = cityList
  } catch (err) {
    console.error(err)
    tableData.value = []
  } finally {
    loading.value = false
  }
}
const handleSearch = () => { pagination.current = 1; fetchData(); }
const onPageChange = (current) => { pagination.current = current; fetchData(); }
const onPageSizeChange = (pageSize) => { pagination.pageSize = pageSize; pagination.current = 1; fetchData(); }
const handleBatchDelete = async () => {
  if (selectedKeys.value.length === 0) return
  try {
    await request.delete('/guiders/bulk', {
      data: { ids: selectedKeys.value }
    })
    Message.success('批量删除成功')
    selectedKeys.value = []
    fetchData()
  } catch (err) {
    Message.error('批量删除失败')
  }
}
const handleAdd = () => { isEdit.value = false; currentId.value = null; Object.keys(form).forEach(k => form[k] = ''); modalVisible.value = true; }
const handleEdit = (r) => { 
  isEdit.value = true; 
  currentId.value = r.id; 
  const cityId = r.cityId ?? r.city?.id ?? '';
  Object.assign(form, { 
    name: r.name, 
    enName: r.enName, 
    cityId, 
    phone: r.phone, 
    email: r.email, 
    language: r.language, 
    guideLicense: r.guideLicense, 
    bankName: r.bankName, 
    bankAccountName: r.bankAccountName, 
    bankAccount: r.bankAccount, 
    password: '' 
  }); 
  modalVisible.value = true; 
}
const handleDelete = async (id) => { 
  try {
    await request.delete(`/guiders/${id}`); 
    Message.success('删除成功'); 
    fetchData(); 
  } catch (e) {
    Message.error('删除失败');
  }
}
const handleModalOk = async () => { 
  const errors = await formRef.value.validate(); 
  if (errors) {
    Message.error('请填写必填项');
    return false;
  }
  try { 
    const p = { ...form }; 
    if (isEdit.value && !p.password) delete p.password; 
    if (isEdit.value) await request.put(`/guiders/${currentId.value}`, p); 
    else await request.post('/guiders', p); 
    Message.success('成功'); 
    fetchData(); 
    return true;
  } catch (e) {
    return false;
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
