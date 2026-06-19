<template>
  <div class="page-container">
    <a-card :bordered="false" class="card-area">
      <template #title>
        <div class="card-title">订单管理</div>
      </template>
      
      <!-- 搜索与操作栏 -->
      <div class="table-toolbar">
        <a-space>
          <a-input-search
            v-model="searchKey"
            placeholder="搜索乘客、平台或引用ID"
            style="width: 280px"
            allow-clear
            @search="handleSearch"
            @clear="handleSearch"
          />
          <a-popconfirm content="确定要删除选中的订单吗？" type="warning" @ok="handleBatchDelete">
            <a-button type="primary" status="danger" :disabled="!selectedKeys.length">
              <template #icon><icon-delete /></template>
              批量删除
            </a-button>
          </a-popconfirm>
        </a-space>
        <div class="toolbar-right">
          <a-button type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>
            新增订单
          </a-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <a-table
        row-key="id"
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        v-model:selected-keys="selectedKeys"
        :row-selection="{ type: 'checkbox', showCheckedAll: true }"
        :bordered="true"
        :stripe="true"
        children-column-name="disabledChildren"
        @page-change="onPageChange"
      >
        <template #status="{ record }">
          <a-tag v-if="record" :color="statusMap[record.status]?.color || 'arcoblue'">
            {{ statusMap[record.status]?.label || record.status }}
          </a-tag>
        </template>
        <template #actions="{ record }">
          <a-space v-if="record">
            <a-button type="text" size="small" @click="handleEdit(record)">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-popconfirm content="确定删除该订单吗？" type="warning" @ok="handleDelete(record.id)">
              <a-button type="text" status="danger" size="small">
                <template #icon><icon-delete /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑订单' : '新增订单'"
      width="850px"
      @before-ok="handleModalOk"
      @close="handleModalCancel"
    >
      <a-form :model="form" ref="formRef" layout="vertical" auto-label-width>
        <a-tabs v-model:active-key="activeTab">
          <a-tab-pane key="1" title="基础信息">
            <a-grid :cols="24" :col-gap="16">
              <a-grid-item :span="12">
                <a-form-item field="platformName" label="平台名称" :rules="[{ required: true, message: '请输入平台名称' }]">
                  <a-input v-model="form.platformName" placeholder="例如: 携程, 飞猪, 线下" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="orderRef" label="平台订单ID" :rules="[{ required: true, message: '请输入平台订单ID' }]">
                  <a-input v-model="form.orderRef" placeholder="请输入外部引用ID" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="status" label="订单状态" :rules="[{ required: true, message: '请选择状态' }]">
                  <a-select v-model="form.status">
                    <a-option v-for="(val, key) in statusMap" :key="key" :value="key">{{ val.label }}</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="departureTime" label="预定出发时间" :rules="[{ required: true, message: '请选择出发时间' }]">
                  <a-date-picker v-model="form.departureTime" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="fromAddress" label="出发地址" :rules="[{ required: true, message: '请输入出发地址' }]">
                  <a-input v-model="form.fromAddress" placeholder="详细出发地址">
                    <template #suffix>
                      <a-tooltip content="在地图上标注位置">
                        <icon-location :style="{ cursor: 'pointer', color: form.startLocation.lat ? 'var(--color-primary-light-4)' : 'inherit' }" @click="openMapPicker('start')" />
                      </a-tooltip>
                    </template>
                  </a-input>
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="toAddress" label="到达地址" :rules="[{ required: true, message: '请输入到达地址' }]">
                  <a-input v-model="form.toAddress" placeholder="详细到达地址">
                    <template #suffix>
                      <a-tooltip content="在地图上标注位置">
                        <icon-location :style="{ cursor: 'pointer', color: form.endLocation.lat ? 'var(--color-primary-light-4)' : 'inherit' }" @click="openMapPicker('end')" />
                      </a-tooltip>
                    </template>
                  </a-input>
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="24">
                <a-form-item field="airport" label="机场/航班信息">
                  <a-input v-model="form.airport" placeholder="航班号或机场航站楼信息" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="bookingType" label="预约类型">
                  <a-select v-model="form.bookingType" allow-clear placeholder="选择预约类型">
                    <a-option value="接机">接机</a-option>
                    <a-option value="送机">送机</a-option>
                    <a-option value="市内用车">市内用车</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
            </a-grid>
          </a-tab-pane>
          
          <a-tab-pane key="2" title="乘客与车辆">
            <a-grid :cols="24" :col-gap="16">
              <a-grid-item :span="12">
                <a-form-item field="passengerName" label="乘客姓名">
                  <a-input v-model="form.passengerName" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="passengerTelno" label="联系电话" :rules="[{ validator: validatePhone }]">
                  <a-input v-model="form.passengerTelno" placeholder="请输入联系电话" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="6">
                <a-form-item field="pax" label="总人数" :rules="[{ required: true, message: '必填' }]">
                  <a-input-number v-model="form.pax" :min="1" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="6">
                <a-form-item field="adults" label="成人" :rules="[{ required: true, message: '必填' }]">
                  <a-input-number v-model="form.adults" :min="1" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="6">
                <a-form-item field="children" label="儿童">
                  <a-input-number v-model="form.children" :min="0" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="6">
                <a-form-item field="infants" label="婴儿">
                  <a-input-number v-model="form.infants" :min="0" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="vehicleType" label="预定车型">
                  <a-input v-model="form.vehicleType" placeholder="如: 7座商务车" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="nonVehicle" label="车辆数量" :rules="[{ required: true, message: '必填' }]">
                  <a-input-number v-model="form.nonVehicle" :min="1" />
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="vehicleId" label="指派车辆">
                  <a-select v-model="form.vehicleId" allow-clear placeholder="选择执行车辆">
                    <a-option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.name }}</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="driverId" label="指派司机">
                  <a-select v-model="form.driverId" allow-clear placeholder="选择执行司机">
                    <a-option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="12">
                <a-form-item field="guiderId" label="指派导游">
                  <a-select v-model="form.guiderId" allow-clear placeholder="选择导游">
                    <a-option v-for="g in guiders" :key="g.id" :value="g.id">{{ g.name }}</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
            </a-grid>
          </a-tab-pane>
        </a-tabs>
      </a-form>
    </a-modal>

    <!-- 高德地图位置选择器 -->
    <a-modal
      v-model:visible="mapModalVisible"
      :title="mapPickerTitle"
      width="800px"
      @ok="handleMapPickerOk"
    >
      <div class="amap-wrapper">
        <div id="amap-container" class="amap-container"></div>
        <div class="amap-search-box">
          <a-input-group>
            <a-input id="amap-search-input" v-model="mapSearchKeyword" placeholder="搜索地点..." allow-clear @press-enter="handleMapSearch" />
            <a-button type="primary" @click="handleMapSearch">搜索</a-button>
          </a-input-group>
        </div>
      </div>
      <template #footer>
        <div class="map-footer">
          <div class="map-coords-info">
            当前选中坐标：
            <span v-if="tempCoords.lat">经度: {{ tempCoords.lng.toFixed(6) }}, 纬度: {{ tempCoords.lat.toFixed(6) }}</span>
            <span v-else>请在地图上点击选择位置</span>
          </div>
          <div class="map-buttons">
            <a-button @click="mapModalVisible = false">取消</a-button>
            <a-button type="primary" @click="handleMapPickerOk">确定</a-button>
          </div>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { Message } from '@arco-design/web-vue';
import request from '../../api/request';
import { loadAMap } from '../../utils/amap';

// 状态配置
const statusMap = {
  'Pending': { label: '待处理', color: 'orange' },
  'Confirmed': { label: '已确认', color: 'blue' },
  'Completed': { label: '已完成', color: 'green' },
  'Cancelled': { label: '已取消', color: 'gray' }
};

// 响应式状态
const loading = ref(false);
const tableData = ref([]);
const searchKey = ref('');
const selectedKeys = ref([]);
const vehicles = ref([]);
const drivers = ref([]);
const guiders = ref([]);
const modalVisible = ref(false);
const isEdit = ref(false);
const currentId = ref(null);
const formRef = ref(null);
const activeTab = ref('1');

// 高德地图相关
let map = null;
let marker = null;
let autoComplete = null;
let placeSearch = null;
let geocoder = null;
const mapServiceReady = ref(false);
const mapServiceLoading = ref(false);
const pendingSearch = ref('');
const mapModalVisible = ref(false);
const mapPickerTitle = ref('');
const activeMapField = ref('start'); // 'start' or 'end'
const tempCoords = reactive({ lat: 0, lng: 0 });
const tempAddress = ref('');
const mapSearchKeyword = ref('');

const initAMap = async () => {
  if (typeof window.AMap === 'undefined') {
    try {
      await loadAMap();
    } catch (err) {
      Message.error('高德地图脚本加载失败，请检查 API Key 配置');
      return;
    }
  }

  if (map) {
    // 如果地图已初始化但插件服务未就绪，尝试重新初始化插件
    if (!mapServiceReady.value && window.AMap) {
      await loadPlugins();
    }
    return;
  }

  map = new window.AMap.Map('amap-container', {
    zoom: 11,
    center: [116.397428, 39.90923], // 默认中心点：北京
  });

  // 点击地图选点
  map.on('click', (e) => {
    const { lng, lat } = e.lnglat;
    setMapMarker(lng, lat);
    if (geocoder) {
      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result?.regeocode?.formattedAddress) {
          tempAddress.value = result.regeocode.formattedAddress;
        }
      });
    }
  });

  await loadPlugins();
};

const loadPlugins = async () => {
  if (mapServiceReady.value || mapServiceLoading.value || !window.AMap) return;

  mapServiceLoading.value = true;
  try {
    // 首先检查插件是否已存在（可能通过 AMapLoader 预加载）
    // JSAPI 2.0 中 Autocomplete 变成了 AutoComplete
    if (window.AMap.AutoComplete && window.AMap.PlaceSearch && window.AMap.Geocoder) {
      // 插件已加载
    } else {
      // 需要加载插件
      await new Promise((resolve, reject) => {
        // 设置超时
        const timeout = setTimeout(() => {
          reject(new Error('Plugin load timeout'));
        }, 10000);

        // JSAPI 2.0: AMap.Autocomplete -> AMap.AutoComplete
        window.AMap.plugin(['AMap.AutoComplete', 'AMap.PlaceSearch', 'AMap.Geocoder'], () => {
          clearTimeout(timeout);

          // 再次检查插件是否加载成功
          const checkPlugins = () => {
            const autocompleteLoaded = !!window.AMap.AutoComplete;
            const placeSearchLoaded = !!window.AMap.PlaceSearch;
            const geocoderLoaded = !!window.AMap.Geocoder;

            if (autocompleteLoaded && placeSearchLoaded && geocoderLoaded) {
              resolve();
            } else {
              // 插件未加载成功，可能是 Key 问题
              reject(new Error('Plugins not loaded properly - check Key and Security Code'));
            }
          };

          // 稍微延迟一下再检查，确保插件已挂载
          setTimeout(checkPlugins, 100);
        });
      });
    }

    const wrapper = document.getElementById('amap-search-input');
    const inputEl = wrapper ? (wrapper.tagName === 'INPUT' ? wrapper : wrapper.querySelector('input')) : null;
    
    // JSAPI 2.0: AMap.Autocomplete -> AMap.AutoComplete
    autoComplete = new window.AMap.AutoComplete(inputEl ? { input: inputEl } : {});
    placeSearch = new window.AMap.PlaceSearch({
      map: map,
      citylimit: false,
      pageSize: 10
    });
    geocoder = new window.AMap.Geocoder({});
    mapServiceReady.value = true;

    autoComplete.on('select', (e) => {
      if (e.poi && e.poi.location) {
        const { lng, lat } = e.poi.location;
        map.setCenter([lng, lat]);
        map.setZoom(15);
        setMapMarker(lng, lat);
        tempAddress.value = e.poi.name;
      } else if (e.poi && e.poi.name) {
        handleMapSearch(e.poi.name);
      }
    });

    if (pendingSearch.value) {
      const keyword = pendingSearch.value;
      pendingSearch.value = '';
      handleMapSearch(keyword);
    }
  } catch (err) {
    console.error('高德地图插件初始化失败:', err);
    const currentHost = window.location.host;
    Message.error(`地图插件加载失败，请检查 Key 和安全密钥配置，当前域名：${currentHost}`);
  } finally {
    mapServiceLoading.value = false;
  }
};

const pickBestPoi = (pois, keyword) => {
  const key = (keyword || '').replace(/\s+/g, '');
  const match = pois.find(poi => {
    const text = `${poi.name || ''}${poi.address || ''}${poi.pname || ''}${poi.cityname || ''}`.replace(/\s+/g, '');
    return key && text.includes(key);
  });
  return match || pois[0];
};

const detectCityFromKeyword = (keyword) => {
  const cityList = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安', '南京', '武汉',
    '天津', '苏州', '长沙', '郑州', '青岛', '宁波', '厦门', '福州', '昆明', '合肥',
    '济南', '大连', '沈阳', '哈尔滨', '长春', '南昌', '南宁', '贵阳', '兰州', '乌鲁木齐',
    '海口', '太原', '石家庄'
  ];
  return cityList.find(city => keyword.includes(city)) || '';
};

const handleMapSearch = (keyword) => {
  const searchVal = typeof keyword === 'string' ? keyword : mapSearchKeyword.value;
  if (!searchVal) return;
  if (!placeSearch) {
    pendingSearch.value = searchVal;
    initAMap();
    if (!mapServiceLoading.value) {
      Message.info('搜索服务初始化中，请稍后重试');
    }
    return;
  }
  
  const city = detectCityFromKeyword(searchVal);
  if (city) {
    placeSearch.setCity(city);
    autoComplete?.setCity?.(city);
  } else {
    placeSearch.setCity('');
    autoComplete?.setCity?.('');
  }
  
  placeSearch.search(searchVal, (status, result) => {
    if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
      const poi = pickBestPoi(result.poiList.pois, searchVal);
      const { lng, lat } = poi.location;
      map.setCenter([lng, lat]);
      map.setZoom(15);
      setMapMarker(lng, lat);
      tempAddress.value = poi.name;
    } else {
      Message.warning('未找到相关位置');
    }
  });
};

const setMapMarker = (lng, lat) => {
  tempCoords.lng = lng;
  tempCoords.lat = lat;

  if (marker) {
    marker.setPosition([lng, lat]);
  } else {
    marker = new window.AMap.Marker({
      position: [lng, lat],
      map: map
    });
  }
};

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showJumper: false,
  showPageSize: true
});

// 表格列定义
const columns = [
  { title: '平台', dataIndex: 'platformName', width: 120, ellipsis: true, tooltip: true },
  { title: '出发地', dataIndex: 'fromAddress', width: 180, ellipsis: true, tooltip: true },
  { title: '目的地', dataIndex: 'toAddress', width: 180, ellipsis: true, tooltip: true },
   { title: '状态', slotName: 'status', width: 100, align: 'center' },
  { title: '出发时间', dataIndex: 'departureTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 160, fixed: 'right', align: 'center' }
];

// 表单数据初始状态
const initialForm = {
  platformName: '',
  orderRef: '',
  status: 'Pending',
  passengerName: '',
  passengerTelno: '',
  pax: 1,
  adults: 1,
  children: 0,
  infants: 0,
  nonVehicle: 1,
  vehicleType: '',
  fromAddress: '',
  toAddress: '',
  departureTime: '',
  vehicleId: null,
  driverId: null,
  guiderId: null,
  airport: '',
  bookingType: '',
  startLocation: { lat: 0, lng: 0 },
  endLocation: { lat: 0, lng: 0 }
};

const form = reactive({ ...initialForm });

// 数据获取
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await request.get('/delivery-orders', {
      params: {
        search: searchKey.value,
        page: pagination.current,
        pageSize: pagination.pageSize
      }
    });
    
    // 适配后端返回格式，确保 tableData 始终为数组
    const list = Array.isArray(res)
      ? res
      : (Array.isArray(res?.list) ? res.list : (Array.isArray(res?.data) ? res.data : []));
    tableData.value = list.map(item => {
      const newItem = { ...item };
      // 存储原始 children 字段以防万一，并彻底删除 children 键以防止被 Arco Table 误认为树形结构
      newItem._childrenCount = item.children;
      delete newItem.children;
      return newItem;
    });
    pagination.total = Array.isArray(res) ? res.length : (res?.total || res?.list?.length || res?.data?.length || 0);

  } catch (err) {
    Message.error('获取数据失败');
    tableData.value = []; // 发生错误时清空数据，防止 iterable 错误
  } finally {
    loading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    const [vRes, dRes, gRes] = await Promise.all([
      request.get('/vehicles'),
      request.get('/drivers'),
      request.get('/guiders')
    ]);
    vehicles.value = Array.isArray(vRes) ? vRes : (vRes?.list || []);
    drivers.value = Array.isArray(dRes) ? dRes : (dRes?.list || []);
    guiders.value = Array.isArray(gRes) ? gRes : (gRes?.list || []);
  } catch (err) {
    Message.error('获取选项数据失败');
  }
};

// 事件处理
const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

const onPageChange = (current) => {
  pagination.current = current;
  fetchData();
};

const handleAdd = () => {
  isEdit.value = false;
  currentId.value = null;
  activeTab.value = '1';
  Object.assign(form, initialForm);
  modalVisible.value = true;
};

const handleEdit = (record) => {
  isEdit.value = true;
  currentId.value = record.id;
  activeTab.value = '1';
  
  // 填充表单，处理嵌套对象或空值
  Object.keys(initialForm).forEach(key => {
    if (key === 'vehicleId') {
      form[key] = record.vehicleId || record.vehicle?.id || null;
    } else if (key === 'driverId') {
      form[key] = record.driverId || record.driver?.id || null;
    } else if (key === 'children') {
      // 从隐藏字段恢复 children 值
      form[key] = record._childrenCount ?? initialForm[key];
    } else if (key === 'guiderId') {
      form[key] = record.guiderId || record.guider?.id || null;
    } else if (key === 'startLocation' || key === 'endLocation') {
      form[key] = record[key] ? { ...record[key] } : { ...initialForm[key] };
    } else {
      form[key] = record[key] ?? initialForm[key];
    }
  });
  
  modalVisible.value = true;
};

const handleDelete = async (id) => {
  try {
    await request.delete(`/delivery-orders/${id}`);
    Message.success('删除成功');
    fetchData();
  } catch (err) {
    Message.error('删除失败');
  }
};

const handleBatchDelete = async () => {
  if (!selectedKeys.value.length) return;
  try {
    await request.delete('/delivery-orders/bulk', {
      data: { ids: selectedKeys.value }
    });
    Message.success('批量删除成功');
    selectedKeys.value = [];
    fetchData();
  } catch (err) {
    Message.error('批量删除失败');
  }
};

// 地图选择器相关逻辑
const openMapPicker = (type) => {
  activeMapField.value = type;
  mapPickerTitle.value = type === 'start' ? '选择起始位置' : '选择结束位置';
  
  const currentCoords = type === 'start' ? form.startLocation : form.endLocation;
  if (currentCoords.lat && currentCoords.lng) {
    tempCoords.lat = currentCoords.lat;
    tempCoords.lng = currentCoords.lng;
  } else {
    tempCoords.lat = 0;
    tempCoords.lng = 0;
  }
  
  tempAddress.value = ''; // 重置临时地址
  const currentAddress = type === 'start' ? form.fromAddress : form.toAddress;
  mapSearchKeyword.value = currentAddress || '';

  mapModalVisible.value = true;

  // 确保地图容器加载后再初始化
  nextTick(async () => {
    if (!map) {
      await initAMap();
    }
    if (map) {
      map.resize();
    }

    // 如果已有坐标，定位并标记
    if (tempCoords.lat && tempCoords.lng) {
      map.setCenter([tempCoords.lng, tempCoords.lat]);
      map.setZoom(15);
      setMapMarker(tempCoords.lng, tempCoords.lat);
    } else if (map) {
      // 否则清空标记并重置中心
      if (marker) {
        marker.setMap(null);
        marker = null;
      }
      map.setCenter([116.397428, 39.90923]);
      map.setZoom(11);
    }

    // 如果有搜索关键词，自动执行搜索以定位到对应位置
    if (mapSearchKeyword.value && placeSearch) {
      setTimeout(() => {
        handleMapSearch(mapSearchKeyword.value);
      }, 500); // 延迟一下确保插件完全就绪
    }
  });
};

const handleMapPickerOk = () => {
  if (activeMapField.value === 'start') {
    form.startLocation.lat = tempCoords.lat;
    form.startLocation.lng = tempCoords.lng;
    // 如果有搜索到的地址名称，回填到主表单
    if (tempAddress.value) {
      form.fromAddress = tempAddress.value;
    }
  } else {
    form.endLocation.lat = tempCoords.lat;
    form.endLocation.lng = tempCoords.lng;
    // 如果有搜索到的地址名称，回填到主表单
    if (tempAddress.value) {
      form.toAddress = tempAddress.value;
    }
  }
  mapModalVisible.value = false;
  Message.success('位置与地址已更新');
};

const handleModalOk = async () => {
  const errors = await formRef.value.validate();
  if (errors) {
    Message.error('请检查表单必填项');
    // 自动切换到包含错误字段的第一个标签页
    const errorFields = Object.keys(errors);
    const tab1Fields = ['platformName', 'orderRef', 'status', 'departureTime', 'fromAddress', 'toAddress'];
    if (errorFields.some(field => tab1Fields.includes(field))) {
      activeTab.value = '1';
    } else {
      activeTab.value = '2';
    }
    return false;
  }

  try {
    if (isEdit.value) {
      await request.put(`/delivery-orders/${currentId.value}`, form);
      Message.success('更新成功');
    } else {
      await request.post('/delivery-orders', form);
      Message.success('创建成功');
    }
    fetchData();
    return true;
  } catch (err) {
    return false;
  }
};

const handleModalCancel = () => {
  formRef.value?.resetFields();
};

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

onMounted(() => {
  fetchData();
  fetchOptions();
});
</script>

<style scoped>
.page-container {
  padding: 16px;
}

.card-area {
  border-radius: 4px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.arco-table-container) {
  border-radius: 4px;
}

.amap-wrapper {
  width: 100%;
  height: 500px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.amap-container {
  flex: 1;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
}

.amap-search-box {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  width: 300px;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.amap-info {
  position: absolute;
  bottom: 40px; /* 避开高德地图 Logo 和版权信息 */
  left: 16px;
  z-index: 10;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-size: 13px;
  color: #4e5969;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e6eb;
}

/* 地图弹窗底部样式 */
.map-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.map-coords-info {
  font-size: 14px;
  color: #4e5969;
}

.map-buttons {
  display: flex;
  gap: 8px;
}
</style>

<style>
/* 修正高德地图搜索建议列表在弹窗下方的层级问题 */
.amap-sug-result {
  z-index: 2500 !important;
  visibility: visible !important;
}

/* 隐藏高德地图 Logo 和版权信息 */
.amap-container .amap-logo,
.amap-container .amap-copyright {
  display: none !important;
}
</style>
