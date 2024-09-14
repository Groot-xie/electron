import Vue from 'vue'
import App from './App.vue'
import router from './router'
// pligins
import './plugins/Antd'

Vue.config.productionTip = false

Object.defineProperties(Vue.prototype, {
  strOrEmptyStr: {
    /**
     * @example '翻译'
     * @example ''
     */
    value: (value) => value ? `'${value}'` : `''`
  },
  strOrNull: {
    /**
     * @example '内容'
     * @example null
     */
    value(value) {
      return value ? `'${value}'` : 'null'
    },
  }
})

export default new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
