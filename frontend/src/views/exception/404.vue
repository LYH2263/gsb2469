<template>
  <div class="exception-container">
    <a-result status="404" subtitle="抱歉，您访问的页面不存在。">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="$router.push({ name: 'Dashboard' })">回到首页</a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>

<style scoped>
.exception-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-2);
}
</style>
