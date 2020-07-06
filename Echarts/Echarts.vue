<template>
  <div
    ref="myCanvas"
    class="canvas-box"
    style="width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
  />
</template>

<script lang="ts">

// 根据type动态引入echarts依赖
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import echarts from 'echarts'
const defaultOption = {
  title: {
    text: '标题',
    left: 'center',
    top: 15,
  },
  legend: {
    bottom: 20,
    right: 40,
    left: 40,
  },
  series: [{
    type: 'pie',
    radius: ['35%', '50%'],
    center: ['50%', '45%'],
    selectedMode: 'single',
    data: [{
      value: 1548,
      name: '幽州',
    },
    {
      value: 535,
      name: '荆州',
    },
    {
      value: 510,
      name: '兖州',
    },
    {
      value: 634,
      name: '益州',
    },
    {
      value: 735,
      name: '西凉',
    },
    ],
    itemStyle: {
      emphasis: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    },
  }],
}
@Component
export default class Echarts extends Vue {
  @Prop({ type: Object, default: defaultOption }) private value!: Object;
  @Prop({ type: String, default: 'pie' }) private type!: String;
  @Prop({ type: Boolean, default: true }) private isShowLoading!: Boolean;
  private myCharts:any;

  get options() {
    return this.value
  }
  set options(val) {
    this.$emit('input', val)
  }

  private mounted() {
    this.echartsInit()
  }

  // echarts初始化
  private echartsInit() {
    // 初始化echarts
    this.myCharts = echarts.init(this.$refs.myCanvas as any)
    this.isShowLoading && this.showLoading()
    // 设置options
    this.myCharts.setOption(this.options)
    this.$nextTick(() => {
      this.myCharts.hideLoading()
    })
  }

  private showLoading() {
    this.myCharts.showLoading({
      text: '加载中...',
      maskColor: 'rgba(255, 255, 255, 0.8)',
      color: '#FFC042',
      textColor: '#282828',
      zlevel: 0,
    })
  }

  private hideLoading() {
    this.myCharts.hideLoading()
  }

  // 数据更新
  @Watch('options')
  private optionsUpdate(nowval: object) {
    this.myCharts.clear()
    this.isShowLoading && this.showLoading()
    this.myCharts.setOption({ ...nowval }) // 赋值变化值
    this.isShowLoading && this.hideLoading() // 隐藏loading
  }
}
</script>

<style></style>
