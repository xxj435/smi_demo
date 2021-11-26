<template>
	<view class="content">

		<!-- 已分享 -->
		<view class="text-area" style="display: flex;flex-direction: column;" v-if="isFlag">
			<button@click="bindGetUserInfo">点击授权登录</button>
				<button>已分享</button>
				<view class="">
					{{userInfo.nickName}}
				</view>
				<button type="default" @click="onSendB">发送指令</button>
		</view>


		<!-- 未分享 -->
		<view class="text-area" style="display: flex;flex-direction: column;" v-else>
			<button@click="bindGetUserInfo">点击授权登录</button>
				<button open-type="share">分享</button>
				<view class="">
					服务器接收到的:{{socketMessage.data}}
					{{userInfo.nickName}}
				</view>
				<!-- A手动操作控制蓝牙 -->
				<button class='btn' @click='onConnect'>{{isConnected?'已连接':'连接蓝牙'}}</button>
				<button class='btn' @click='onGetuuid'>
					{{serviceId&&characteristicId?'已获取设备信息':'获取设备信息'}}
				</button>
				<button class='btn' @click='onSendCommand'>发送指令</button>
				<button class='btn' @click='onCloseConnect'>断开连接</button>
				        <button @tap="startRecord">录音</button>
		</view>
	</view>
</template>

<script>
	import {
		mapState
	} from 'vuex'
	export default {
		data() {
			return {
				identity: null, // 身份信息
				userInfo: null, // 用户信息
				userId: '',
				deviceId: "", //蓝牙设备id,
				isConnected: false, // 连接状态 默认为false
				serviceId: "", //特征值对应的服务uuid
				characteristicId: "", //蓝牙特征值的uuid
				service: "",
				characteristic: "",
			}
		},
		computed: {
			...mapState({
				isFlag: (state) => state.isFlag,
				socketMessage(state) {
					if(state.socketMessage){
						console.log(state.socketMessage);
						this.onSendCommand(state.socketMessage);
					}
						
					return state.socketMessage
				}
			})
		},
		onLoad(option) {
			
			console.log(this.$store.state.isFlag);
			if (option.userId) { // 有id则是分享出去了
				this.userId = option.userId;
				this.$store.commit('SET_ISFLAG', true);
				this.service = option.obj.service;
				this.serviceId = option.obj.serviceId;
				this.characteristic = option.obj.characteristic;
				this.characteristicId = option.obj.characteristicId;
				this.deviceId = option.obj.deviceId;
			}
			
			
		},
		onShareAppMessage(res) {
			let obj = {
				service: this.service,
				serviceId: this.serviceId,
				characteristic: this.characteristic,
				characteristicId: this.characteristicId,
				deviceId: this.deviceId
			}
			if (res.from === 'button') { // 来自页面内分享按钮
				console.log(res.target)
			}
			return {
				title: '分享一下',
				path: `/pages/index/index?userId=${this.identity.userId}&obj=${obj}`
			}
		},



		methods: {
			        startRecord() {
			uni.navigateTo({
			    url: '/pages/sing/sing'
			});
			        },
			
			bindGetUserInfo(e) {
				let _this = this
				uni.getUserProfile({ // 登录授权
					desc: 'weixin',
					success: res => {
						console.log(res);
						this.userInfo = res.userInfo; // 获取用户信息 
						this.$store.dispatch('SET_USER_INFO', res.userInfo); // 调用vuex存储
						uni.login({ // 获取code
							success(r) {
								console.log('获取code成功', r);
								uni.showToast({
									title: '获取code成功',
									icon: 'none',
									duration: 2000
								})
								uni.request({
									url: `http://192.168.0.64:8888/bluetoothApplets/user/login?code=${r.code}`,
									success(x) {
										console.log(x, '进入获取openid');
										if (x.data.code == 200) {
											_this.identity = x.data.data; // 拿到身份信息 openid
											_this.$store.dispatch('SET_IDENTITY', x.data.data)
											uni.request({
												url: "http://192.168.0.64:8888/bluetoothApplets/user/saveUserInfo",
												method: "post",
												data: {
													openId: _this.identity.openid,
													username: _this.userInfo.nickName,
													headPicture: _this.userInfo.avatarUrl,
													sex: _this.userInfo.gender,
													sharerId: _this.userId,
													id:_this.identity.userId
												},
												success(y) {
													console.log(y, '进入获取用户信息');
													if (y.data.code == 200) {
														_this.$store.dispatch('WEBSOCKET_INIT');
														uni.showToast({
															title: "登录成功",
															duration: 2000
														})
														// 已分享出去
														if (_this.isFlag) {
															// setInterval(() => {
															let param = {
																"fromId": _this.identity.userId, // 发送人
																"toId": _this.userId, // 接收人
																'message': `哈哈哈哈${new Date()}` // 信息
															}
															_this.$store.commit('WEBSOCKET_SEND', param)
															// }, 5000)
														}
													} else if (y.data.code == 150) { // 用户已占用
														uni.showToast({
															title: `${y.data.msg}`,
															icon: 'none',
															duration: 2000
														})
														// 打回首页
													}
												}
											})
										}
									}
								})
							},
							fail(e) {
								console.log('获取code失败', e)
							}
						})
					},
					fail: err => {
						console.log(err, '失败授权')
					}
				})
			},




			// 初始化蓝牙模块
			onConnect() {
				let that = this;
				uni.openBluetoothAdapter({
					success(res) {
						that.startBluetoothDevicesDiscovery(); // 调用查找设备
						uni.showLoading({
							title: '搜索中'
						})
					},
					fail(err) {
						uni.showToast({
							title: '请先开启蓝牙',
							icon: 'none',
							duration: 1000
						})
					}
				})
			},

			// 搜索周边蓝牙设备
			startBluetoothDevicesDiscovery() {
				var that = this;
				uni.startBluetoothDevicesDiscovery({
					success(res) {
						console.log("查找到的蓝牙设备", res);
						if (res.errCode == 0) { // 等于0为ok
							that.getConnect();
						}
					}
				})
			},

			// 获取在蓝牙模块生效期间所有已发现的蓝牙设备。包括已经和本机处于连接状态的设备。
			getConnect() {
				var that = this;
				var timer = setInterval(() => {
					uni.getBluetoothDevices({
						success(res) {
							console.log('已发现的蓝牙设备', res);
							for (var i = 0; i < res.devices.length; i++) {
								if (res.devices[i].name.indexOf("sakuraneko") != -1) { // 包含
									uni.hideLoading();
									uni.showLoading({
										title: '连接中'
									})
									clearInterval(timer); // 连接成功 清空定时器
									that.deviceId = res.devices[i].deviceId;
									console.log('设备号', that.deviceId);
									console.log('开始建立连接');

									// 连接低功耗蓝牙设备
									uni.createBLEConnection({
										deviceId: that.deviceId,
										timeout: 10000,
										success(res) {
											console.log('连接低功耗蓝牙', res);
											if (res.errCode == 0) { // 为0正常
												console.log('连接成功');
												that.isConnected = true;
												// 停止搜寻附件蓝牙设备
												uni.stopBluetoothDevicesDiscovery();

											} else {
												uni.showModal({
													title: '提示',
													content: '不能正常对蓝牙设备进行连接',
													showCancel: false
												})
											}
										},
										fail(err) {
											uni.hideLoading();
											if (res.errCode == 10012) {
												uni.showModal({
													title: '提示',
													content: '连接超时',
													showCancel: false
												})
											}
										},
										complete() {
											uni.hideLoading();
										}
									})
									break; // 连接成功 退出循环
								}
							}
						}
					})
				}, 3000);
				// 如果循环过长 未找到想要的设备 超过12秒则超时
				setTimeout(() => {
					if (!that.isConnected) { // 未连接
						clearInterval(timer); // 清空定时器
						uni.hideLoading();
						uni.showModal({
							title: '提示',
							content: '搜索蓝牙超时',
							showCancel: false
						})
					}
				}, 12000);
			},
			// 进制转化
			ab2hex(buffer) {
				var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function(bit) {
					return ('00' + bit.toString(16)).slice(-2)
				})
				return hexArr.join('');
			},

			// 发送指令
			onSendCommand(msg) {
				console.log(msg, '获取到的指令');
				var message;

					message = 'A1 08 01 00 00 00 64 1E 00 32 61 55'
				
				let that = this;
				// 一个马达震动指令
				let data = message.split(' ');
				var buf = new ArrayBuffer(data.length);
				let dataView = new DataView(buf);
				for (let i = 0; i < data.length; i++) {
					dataView.setUint8(i, '0x' + data[i]);
				}
				// 向低功耗蓝牙设备特征值中写入二进制数据
				uni.writeBLECharacteristicValue({
					deviceId: that.deviceId, // 设备id
					serviceId: that.serviceId,
					characteristicId: that.characteristicId,
					value: buf,
					success(res) {
						console.log(res, '发送指令成功');
						uni.showToast({
							title: "发送成功",
							icon: 'none'
						})
					},
					fail(res) {
						console.log('发送指令失败', res);
					}
				})
			},

			// 获取设备信息
			onGetuuid() {
				let that = this;
				if (that.isConnected) { // 连接成功
					uni.showLoading({
						title: '获取serviceId'
					})
					console.log('开始获取设备信息');

					// 获取蓝牙设备所有服务(service)
					uni.getBLEDeviceServices({
						deviceId: that.deviceId,
						success(getServicesRes) {
							console.log('设备信息', getServicesRes);
							that.services = getServicesRes.services;
							that.serviceId = getServicesRes.services[0].uuid;
							console.log(that.serviceId);
							uni.showLoading({
								title: '获取蓝牙特征值的uuid'
							})

							//获取蓝牙设备某个服务中所有特征值(characteristic)
							uni.getBLEDeviceCharacteristics({
								deviceId: that.deviceId,
								serviceId: that.serviceId,
								success(getCharactersRes) {
									console.log('获取所有特征值', getCharactersRes);
									that.characteristic = getCharactersRes.characteristics;
									that.characteristicId = getCharactersRes.characteristics[1].uuid;

									// 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值
									console.log(that.deviceId, that.serviceId, that.characteristicId)
									uni.notifyBLECharacteristicValueChange({
										state: true, // 启用notify
										deviceId: that.deviceId,
										serviceId: that.serviceId,
										characteristicId: that.characteristicId,
										success() {
											console.log('开始监听特征值');

											// 监听低功耗蓝牙设备的特征值变化事件
											uni.onBLECharacteristicValueChange(function(onNotityChangeRes) {
												console.log('监听到特征值更新', onNotityChangeRes);
												let characteristicValue = that.ab2hex(onNotityChangeRes.value);
												console.log("characteristicValue-16进制", characteristicValue);
												// 设备给你返回的
												uni.showModal({
													title: '监听到特征值更新',
													content: `更新后特征值${characteristicValue}`
												})
											})
										},
										fail(err) {
											console.warn("监听特征值失败");
										}
									})
								},
								fail(err) {
									console.warn("获取特征值信息失败", err);
								},
								complete(err) {
									console.log('获取服务信息完成', err);
									uni.hideLoading();
								}
							})
						},
						fail(err) {
							console.warn("获取服务信息失败", err);
						},
						complete(err) {
							uni.hideLoading();
						}
					})
				} else {
					uni.showToast({
						title: '请先连接蓝牙',
					})
				}
			},

			// 关闭连接
			onCloseConnect() {
				this.isConnected = false;
				uni.closeBLEConnection({
					deviceId: this.deviceId,
					success(res) {
						console.log('断开连接');
						uni.showToast({
							title: '成功断开连接'
						})
					}
				})
			},

			// B给A发送指令
			onSendB() {
				let param = {
					"fromId": this.identity.userId, // 发送人
					"toId": this.userId, // 接收人
					'message': `A1 08 01 00 00 00 64 1E 00 32 61 55` // 信息
				}
				this.$store.commit('WEBSOCKET_SEND', param)
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
