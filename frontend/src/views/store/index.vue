<template>
  <div class="page-container">
    <a-card title="购物店管理">
      <div class="table-toolbar">
        <a-space>
          <a-input-search 
            v-model="searchKey" 
            placeholder="搜索购物店名称/地址..." 
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
            新增购物店
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
            <a-popconfirm content="确定删除该购物店吗？" type="warning" @ok="handleDelete(record.id)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:visible="modalVisible" title="购物店信息" :on-before-ok="handleModalOk">
      <a-form :model="form" ref="formRef" layout="vertical">
        <a-form-item field="name" label="名称" :rules="[{ required: true, message: '请输入名称' }]"><a-input v-model="form.name" /></a-form-item>
        <a-form-item field="cityId" label="城市" :rules="[{ required: true, message: '请选择城市' }]">
          <a-select v-model="form.cityId"><a-option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</a-option></a-select>
        </a-form-item>
        <a-form-item field="address" label="地址" :rules="[{ required: true, message: '请输入地址' }]"><a-input v-model="form.address" /></a-form-item>
        <a-form-item field="phone" label="电话" :rules="[{ validator: validatePhone }]"><a-input v-model="form.phone" placeholder="请输入电话" /></a-form-item>
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
const form = reactive({ name: '', cityId: '', address: '', phone: '' });
const columns = [
  { title: '名称', dataIndex: 'name', width: 150 },
  { title: '城市', slotName: 'city', width: 120 },
  { title: '地址', dataIndex: 'address', width: 250 },
  { title: '电话', dataIndex: 'phone', width: 150 },
  { title: '操作', slotName: 'optional', width: 160, fixed: 'right' }
];
const fetchData = async () => {
  loading.value = true
  try {
    const [res, c] = await Promise.all([
      request.get('/stores', { params: { search: searchKey.value, page: pagination.current, pageSize: pagination.pageSize } }), 
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
    await request.delete('/stores/bulk', {
      data: { ids: selectedKeys.value }
    })
    Message.success('批量删除成功')
    selectedKeys.value = []
    fetchData()
  } catch (err) {
    Message.error('批量删除失败')
  }
}
const handleAdd = () => { isEdit.value = false; currentId.value = null; Object.assign(form, { name: '', cityId: '', address: '', phone: '' }); modalVisible.value = true; }
const handleEdit = (r) => { 
  isEdit.value = true; 
  currentId.value = r.id; 
  const cityId = r.cityId ?? r.city?.id ?? '';
  Object.assign(form, { name: r.name, cityId, address: r.address, phone: r.phone }); 
  modalVisible.value = true; 
}
const handleDelete = async (id) => { 
  try {
    await request.delete(`/stores/${id}`); 
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
    if (isEdit.value) await request.put(`/stores/${currentId.value}`, form); 
    else await request.post('/stores', form); 
    Message.success('操作成功');
    fetchData(); 
    return true;
  } catch (e) {
    return false;
  } 
}
// 手机号/电话校验
const validatePhone = (value, callback) => {
  if (!value) return callback()
  // 支持手机号或固定电话
  const phoneRegex = /^1[3-9]\d{9}$/
  const telRegex = /^\d{3,4}-?\d{7,8}$/
  if (!phoneRegex.test(value) && !telRegex.test(value)) {
    callback('电话格式错误，请输入正确的手机号或固定电话')
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
