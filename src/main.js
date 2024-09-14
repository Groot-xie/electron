import Vue from 'vue'
import App from './App.vue'
import router from './router'
// pligins
import './plugins/Antd'

Vue.config.productionTip = false

Object.defineProperties(Vue.prototype, {
  nullToEmpty: {
    value: (value) => value ? value : ''
  }
})

export default new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
