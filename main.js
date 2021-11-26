import Vue from 'vue'
import App from './App'
//导入vuex
import store from '@/store/index.js'
Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
	store,
    ...App
})
app.$mount()
