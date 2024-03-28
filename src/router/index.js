import Vue from 'vue'
import VueRouter from 'vue-router'
import AuthoritySql from '../views/AuthoritySql.vue'
import Test from '@/views/Test.vue'
import GenerateLanguage from '@/views/GenerateLanguage.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'AuthoritySql',
    component: AuthoritySql
  },
  {
    path: '/test',
    name: 'test',
    component: Test
  },
  {
    path: '/generate-language',
    name: 'GenerateLanguage',
    component: GenerateLanguage
  },
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
