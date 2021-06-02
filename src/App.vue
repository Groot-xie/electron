<template>
  <div id="app">
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <router-view/>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  created() {
    ipcRenderer.on('router', (event, routerName) => {
      if (this.$route.name === routerName) return
      this.$router.push({
        name: routerName
      })
    })
  }
}
</script>

<style>
#app {
  height: 100%;
  overflow: hidden;
}

</style>
