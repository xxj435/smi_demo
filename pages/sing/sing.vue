<template>
	<view>
		<view @click="onClick">{{btlabel}}</view>
		<view>{{fenbei}}dB</view>
	</view>
</template>
<script>
	import Mp3 from 'js-mp3';
	export default {
		data() {
			return {
				btlabel: '开始测试',
				fenbei: 0,
				rec: null,
				options: {
					duration: 600000,
					sampleRate: 44100,
					numberOfChannels: 1,
					encodeBitRate: 192000,
					format: 'mp3', // 设定为Mp3格式
					frameSize: 1
				},
				timeID: -1
			}
		},
		onLoad() {
			var _this = this;
			_this.rec = uni.getRecorderManager();
			clearTimeout(_this.timeID);
			_this.timeID = setTimeout(function(){
				_this.debounce();
			}, 1000)

			_this.rec.onStop(function(res) {
				console.log('结束录音');
				_this.btlabel = '开始测试';
			})

			_this.rec.onStart(function() {
				console.log('开始录音');
				_this.btlabel = '停止测试';
				console.log(_this.btlabel);
			})


		},
		methods: {
			onClick(e) {
				if (this.btlabel == '开始测试') {
					this.rec.start(this.options);
				} else {
					this.rec.stop();
				}
			},
			debounce() {
				var _this = this;
			_this.rec.onFrameRecorded(function(res) {
				// console.log(res);
				if (res.isLastFrame) return;
				const {
					frameBuffer
				} = res
				var decoder = Mp3.newDecoder(frameBuffer)
				if (decoder != null) {
					var pcmArrayBuffer = decoder.decode()
					var pcmArr = new Int16Array(pcmArrayBuffer)
					var size = pcmArr.length

					var sum = 0;
					for (var i = 0; i < size; i++) {
						sum += Math.abs(pcmArr[i]);
					}
					var powerLevel = sum * 500.0 / (size * 16383);
					if (powerLevel >= 100) {
						powerLevel = 100
					}
					if (powerLevel <= 5) {
						powerLevel = 2
					}

					powerLevel = parseInt(powerLevel);
					var db = Math.floor(120 * (powerLevel / 100));
					powerLevel = Math.floor(-108 + 108 * 2 * (powerLevel / 100));
					if(db >= 40){
						console.log(db);
					}
					
				}
			})
			}
		},
	}
</script>
