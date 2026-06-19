<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<script setup>
import { onMounted } from 'vue';
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn';

onMounted(() => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.setAttribute('arco-theme', 'dark');
  } else {
    document.body.removeAttribute('arco-theme');
  }
});
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
