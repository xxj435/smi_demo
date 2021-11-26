<template>
	<view class="record-container">
		<button @click='start'>开始录音</button>
		<button @click='play'>播放录音</button>
		<button @click='stop'>停止录音</button>
	</view>
</template>

<script>
	import Mp3 from 'js-mp3'
	const recorderManager = uni.getRecorderManager()
	var voice = "";


	export default {
		data() {
			return {
				text: "uni-app",

				voicePath: "",

				isRecord: false, // 记录状态,录音中或者是未开始

				intervalTime: 0,

				timer: null
			};
		},

		onLoad() {
			console.log(Mp3);

		},

		computed: {
			intIntervalTime() {
				// 用于显示整数的秒数
				return Math.round(this.intervalTime);
			}
		},

		methods: {
			play() {
				uni.playVoice({
					filePath: voice
				})
			},
			start() {
				uni.startRecord({
					success: function(e) {
						voice = e.tempFilePath
					}
				})
				// recorderManager.onStart(() => {
				// 	console.log('recorder start')
				// })
				
				
				const options = {
					duration: 30000,
					sampleRate: 44100,
					numberOfChannels: 1,
					encodeBitRate: 64000,
					format: 'mp3',
					frameSize: 1
				}
				
				recorderManager.start(options)
				
						recorderManager.onFrameRecorded((res) => {
							console.log(res);
								const {
									frameBuffer
								} = res
								var decoder = Mp3.newDecoder(frameBuffer)
								if (decoder != null) {
									var pcmArrayBuffer = decoder.decode();
									var pcmArr = new Int16Array(pcmArrayBuffer);
									var size = pcmArr.length
									
									var sum = 0;
									for(var i = 0; i < size;i++){
										sum += Math.abs(pcmArr[i]);
									}
									
								}
							})
			},
			stop() {
				uni.stopRecord();
			}
		}
	};
</script>
