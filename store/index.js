import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		socketUrl: "ws://192.168.0.64:8888/bluetoothApplets/websocket",
		socketTask: null, // uni.connectSocket() 接口创建
		userInfo: null, // 用户信息
		identity: null, // 身份信息
		socketMessage: null, // 接收服务器主动的信息
		isFlag: false // 判断是否分享出去
	},
	/**
	 * A负责分享 监听B发送过来的消息对蓝牙发出指令
	 * B负责监听用户操作 给A发送消息 携带蓝牙指令
	 */
	mutations: {
		// 连接websocket
		WEBSOCKET_INIT(state) {
			let url = state.socketUrl + `/${state.identity.userId}`;
			state.socketTask = uni.connectSocket({
				url: url,
				success(data) {
					console.log("websocket连接成功", data)
				}
			});
			
			// 消息的发送和接收必须在正常连接, 才能发送或接收
			state.socketTask.onOpen(res => {
				console.log('连接打开');
			})

			// 服务器返回内容的监听
			state.socketTask.onMessage(msg => {
				console.log('收到服务器内容', msg.data);
				state.socketMessage = JSON.parse(msg.data);
				console.log(state.socketMessage)
			})

			// 关闭连接
			state.socketTask.onClose(() => {
				console.log('onClose');
				//一旦关闭连接
				this.commit('WEBSOCKET_INIT')
			})
			state.socketTask.onError(() => {
				console.log('onError')
			})

		},

		// 发送信息
		WEBSOCKET_SEND(state, p) {
			state.socketTask && state.socketTask.send && state.socketTask.send({
				data: JSON.stringify(p),
				success: (res) => {
					console.log('发送成功', res)
				}
			});
		},

		// 存储用户信息
		SET_USER_INFO(state, data) {
			state.userInfo = data; // 存入vuex
			uni.setStorageSync('userInfo', data); // 保存到本地
		},

		// 存储身份信息
		SET_USER_INFO(state, data) {
			state.identity = data; // 存入vuex
			uni.setStorageSync('identity', data); // 保存到本地
		},

		// 改变分享状态
		SET_ISFLAG(state, data) {
			state.isFlag = data;
		}
	},

	actions: {
		WEBSOCKET_INIT({
			commit
		}) {
			commit('WEBSOCKET_INIT')
		},
		SET_USER_INFO({
			commit
		}, info) {
			commit('SET_USER_INFO', info)
		},
		SET_IDENTITY({
			commit
		}, info) {
			commit('SET_USER_INFO', info)
		},

		WEBSOCKET_SEND({
			commit
		}, p) {
			commit('WEBSOCKET_SEND', p)
		}
	}
})

// 暴露
export default store;
