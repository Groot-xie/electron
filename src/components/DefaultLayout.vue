<template>
  <div class="default-layout">
    <div class="layout-title" :style="`--justifyContent: ${titleJustifyContent}`">
      <slot name="title"></slot>
    </div>

    <div class="layout-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    titleJustifyContent: {
      default: 'flex-end',
    }
  }
}
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.layout-title {
  display: flex;
  align-items: center;
  justify-content: var(--justifyContent);
  padding: 0 20px;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid rgb(231, 234, 236);
}
.layout-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>