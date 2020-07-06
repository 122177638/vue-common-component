<template>
  <section class="query-box">
    <el-form
      ref="form"
      class="query-form"
      :label-width="labelWidth"
      :model="_queryParams"
    >
      <slot name="prepend" />
      <template v-for="(item, index) in itemsSync">
        <!-- date 选择框 -->
        <el-form-item
          v-if="item.type === 'date'"
          :key="index"
          class="query-form-item"
          :style="`width:${item.width && item.width + 'px' || _getDateFormItemAutoConfig(item).width || 'auto'}`"
          :label="item.label"
        >
          <el-date-picker
            v-model="_queryParams[item.key]"
            :type="item.dateType || 'date'"
            :value-format="item.valueFormat || _getDateFormItemAutoConfig(item).valueFormat || 'yyyy-MM-dd'"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            :range-separator="item.rangeSeparator || '至'"
            :start-placeholder="item.startPlaceholder || '开始日期'"
            :end-placeholder="item.endPlaceholder || '结束日期'"
            :default-time="item.defaultTime"
            :picker-options="item.pickerOptions"
            style="width: 100%"
            @change="(...args) => handleChange(item.key, ...args)"
          />
        </el-form-item>

        <!-- select 选择框 -->
        <el-form-item
          v-if="item.type === 'select'"
          :key="index"
          class="query-form-item"
          :style="`width:${item.width ? item.width+ 'px' : 'auto'}`"
          :label="item.label"
        >
          <el-select
            v-model="_queryParams[item.key]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            class="query-select"
            style="width:100%"
            @change="(...args) => handleChange(item.key, ...args)"
          >
            <el-option
              v-for="opt in item.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <!-- dropdown 选择框 -->
        <el-form-item
          v-if="item.type === 'dropdown'"
          :key="index"
          class="query-form-item"
          :label="item.label"
        >
          <el-dropdown
            class="query-dropdown"
            @command="(...args) => handleCommand(item.key, ...args)"
          >
            <span class="el-dropdown-link">
              <span>{{ _queryParams[item.key] }}</span> <i class="el-icon-arrow-down el-icon--right" />
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="o in item.options"
                :key="o.value"
                :command="o.value"
              >
                {{ o.value }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-form-item>

        <!-- input 输入框 -->
        <el-form-item
          v-if="item.type === 'input'"
          :key="index"
          :style="`width:${item.width ? item.width+ 'px' : 'auto'}`"
          class="query-form-item"
          :label="item.label"
        >
          <el-input
            v-model="_queryParams[item.key]"
            type="text"
            style="width: 100%"
            :clearable="item.clearable === undefined ? true : item.clearable"
            :placeholder="item.placeholder"
            @change="(...args) => handleChange(item.key, ...args)"
          />
        </el-form-item>
      </template>
      <slot />
      <!-- 按钮集合 可slot追加 -->
      <el-form-item
        v-if="_showSearch || _showDownload || $slots.button"
        class="query-form-item btn-box"
      >
        <el-button
          v-if="_showSearch"
          type="primary"
          icon="el-icon-search"
          @click="onQuery"
        >
          搜索
        </el-button>
        <el-button
          v-if="_showDownload"
          icon="el-icon-download"
          @click="() => $emit('onDownload')"
        >
          下载
        </el-button>
        <slot name="button" />
      </el-form-item>
      <slot
        name="append"
        class="query-form-item"
      />
    </el-form>
  </section>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { IFormItem, IOption, TDateType } from './PublicQuery'

const VALUE_CACHE_MAP: any = {}

@Component({
  components: {},
})
export default class PublicQuery extends Vue {
  @Prop({ type: Array }) items!: IFormItem[]
  @Prop({ type: Object }) value!: any
  /** 开启下载按钮 */
  @Prop({ type: [Boolean, Function], default: false }) showDownload!: Boolean | Function
  @Prop({ type: [Boolean, Function], default: true }) showSearch!: Boolean | Function
  @Prop({ type: String }) labelWidth?: string
  /** 是否初始化完成 */
  private isInited: boolean = false
  private get _queryParams() {
    return this.value
  }
  private set _queryParams(val) {
    this.$emit('input', val)
  }
  /** 是否显示下载 */
  private get _showDownload() {
    return typeof this.showDownload === 'function' ? this.showDownload() : this.showDownload
  }
  /** 是否显示搜索 */
  private get _showSearch() {
    return typeof this.showSearch === 'function' ? this.showSearch() : this.showSearch
  }

  private get itemsSync() {
    const items = this._clone(this.items)
    const promiseMap = new Map()
    items.forEach((formItem: IFormItem) => {
      if (formItem.request) {
        if (Object.prototype.toString.call(formItem.request) === '[object Promise]') {
          const fid = this._getFid(8)
          promiseMap.set(fid, formItem.request)
          ;(formItem._fid as string) = fid
        } else {
          console.error(`${formItem.label}参数"request"仅支持Promise`)
        }
      }
      const defaultValue = this._queryParams[formItem.key]
      const cacheValue = formItem.cacheKey && VALUE_CACHE_MAP[formItem.cacheKey!]
      if (!defaultValue && cacheValue !== undefined) {
        this._queryParams[formItem.key] = cacheValue
      }
    })
    /** 确保异步任务全部完成后执行 initChange */
    Promise.all([...promiseMap.values()]).then(payload => {
      Array.from(promiseMap.keys()).map((fid: string, index: number) => {
        items.forEach((formItem: IFormItem) => {
          if (formItem._fid === fid) {
            const options = (formItem.requested
              ? formItem.requested(payload[index], formItem)
              : payload[index]) as IOption[]
            if (formItem.type === 'select' || formItem.type === 'dropdown') {
              this.$set(formItem, 'options', options)
              const defaultValue = this._queryParams[formItem.key]
              if (defaultValue && !options.some(o => o.value === defaultValue)) {
                this._queryParams[formItem.key] = undefined
              }
              if (!defaultValue && options.length > 0) {
                const cacheValue = VALUE_CACHE_MAP[formItem.cacheKey!]
                if (cacheValue && options.some(o => o.value === cacheValue)) {
                  this._queryParams[formItem.key] = cacheValue
                } else if (formItem.autoSelect) {
                  this._queryParams[formItem.key] = options[0].value || ''
                  if (formItem.cacheKey) VALUE_CACHE_MAP[formItem.cacheKey] = this._queryParams[formItem.key]
                }
              }
            } else if (formItem.type === 'input') {
              const defaultValue = this._queryParams[formItem.key]
              const cacheValue = formItem.cacheKey && VALUE_CACHE_MAP[formItem.cacheKey!]
              if (!defaultValue && cacheValue !== undefined) {
                this._queryParams[formItem.key] = cacheValue
              }
            }
          }
        })
      })
      /** 异步回调 可做为queryForm初始化完成事件 */
      if (!this.isInited) {
        this.isInited = true
        this.$emit('initChange', items)
      }
    })
    return items
  }

  private handleChange(key: string, value: any) {
    this.cacheSelection(key, value)
    this.$emit('change')
  }

  private handleCommand(key: string, command: any) {
    this._queryParams[key] = command
    this.cacheSelection(key, command)
    this.$emit('change')
  }

  private onQuery() {
    this.$emit('change', { isUseCache: false })
  }

  private cacheSelection(key: string, value: any) {
    const formItem = this.items.find(item => item.key === key)
    if (formItem && formItem.cacheKey) {
      VALUE_CACHE_MAP[formItem.cacheKey] = value
    }
  }
  private _getDateFormItemAutoConfig(item: IFormItem) {
    const dateType = item.dateType || 'date'
    let dateConfig: any = {
      datetime: {
        width: '200px',
        valueFormat: 'yyyy-MM-dd HH:mm:ss',
      },
      datetimerange: {
        width: '400px',
        valueFormat: 'yyyy-MM-dd HH:mm:ss',
      },
      date: {
        width: '180px',
        valueFormat: 'yyyy-MM-dd',
      },
      daterange: {
        width: '260px',
        valueFormat: 'yyyy-MM-dd',
      },
      monthrange: {
        width: '260px',
        valueFormat: 'yyyy-MM-dd',
      },
    }
    return dateConfig[dateType as TDateType] || {}
  }

  private _getFid(length: any) {
    return Number(
      Math.random()
        .toString()
        .substr(3, length) + Date.now(),
    ).toString(36)
  }

  private _clone(target: any) {
    let result: any
    const toString = Object.prototype.toString
    if (toString.call(target) === '[object Array]') {
      result = []
      for (let i = 0; i < target.length; i++) {
        this.$set(result, i, target[i])
      }
    } else if (toString.call(target) === '[object Object]') {
      result = {}
      for (let key in target) {
        this.$set(result, key, target[key])
      }
    } else if (toString.call(target) === '[object RegExp]') {
      result = target
    }
    return result
  }
}
</script>

<style lang="scss" scpoed>
@import "src/styles/variables.scss";

.query-box {
  .query-form-item {
    margin: 0 20px 22px 0;
    width: 160px;
    display: inline-block;
    &.btn-box {
      width: auto;
    }
    .el-range-separator{
      width: auto
    }
  }
  .el-dropdown-link {
    cursor: pointer;
    > span {
      display: inline-block;
      text-align: center;
      min-width: 40px;
    }
  }
  .el-icon-arrow-down {
    // font-size: 12px;
    font-weight: bold;
  }
}
</style>
