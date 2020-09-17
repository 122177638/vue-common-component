<template>
  <section class="table-box">
    <el-table
      ref="tableNode"
      v-loading="isLoading && (!isScroll || pageData.page == 1)"
      :data="renderData"
      v-bind="tableProps"
      class="public-table"
      @row-click="(row, column, event) => $emit('row-click', row, column, event)"
      @selection-change="selection => $emit('selection-change', selection)"
      @sort-change="sortInfo => $emit('sort-change', sortInfo)"
      @select="(selection, row) => $emit('select', selection, row)"
      @select-all="selection => $emit('select-all', selection)"
    >
      <slot name="prepend" />
      <el-table-column
        v-for="(col, index) in columns"
        :key="index"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :sortable="col.sortable"
        :min-width="col.minWidth || colMinWidth"
        align="center"
      >
        <slot :name="col.prop" :col="col" slot-scope="scope" :row="scope.row">
          <div v-if="col.type === 'dropdown'">
            <el-dropdown
              v-if="scope.row[`_${col.prop}`].options && scope.row[`_${col.prop}`].options.length"
              trigger="click"
              @command="onChooseOperate"
            >
              <el-button type="primary" size="small">
                {{ scope.row[`_${col.prop}`].label || '操作' }}
                <i class="el-icon-arrow-down el-icon--right" aria-hidden="true" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-for="(item, dIndex) in scope.row[`_${col.prop}`].options"
                  :key="dIndex"
                  :command="{ command: item, data: scope.row }"
                  :divided="item.divided"
                >
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <span v-else>-</span>
          </div>
          <div v-if="col.type === 'buttons'">
            <el-button
              :size="button.size"
              :class="button.class"
              v-for="(button, index) in scope.row[`_${col.prop}`].buttons"
              :key="index"
              :plain="button.plain"
              :type="button.type"
              :label="button.label"
              @click="button.handler && button.handler(scope.row)"
            >
              {{ button.label }}
            </el-button>
          </div>
          <el-switch
            v-else-if="col.type === 'switch'"
            v-model="scope.row[`_${col.prop}`].value"
            @change="scope.row[`_${col.prop}`].handler && scope.row[`_${col.prop}`].handler(scop.row)"
          />
          <el-tag
            v-else-if="col.type === 'tag'"
            :size="scope.row[`_${col.prop}`].size || 'small'"
            :effect="scope.row[`_${col.prop}`].effect"
            :hit="scope.row[`_${col.prop}`].hit"
            :type="scope.row[`_${col.prop}`].type"
            >{{ scope.row[`_${col.prop}`].value }}</el-tag
          >
          <a
            v-else-if="col.type === 'link' && scope.row[`_${col.prop}`].value"
            class="cell-link"
            :href="scope.row[`_${col.prop}`].value"
            target="_blank"
            >{{ scope.row[`_${col.prop}`].label }}</a
          >
          <span v-else-if="col.formatter" class="cell-span" :class="scope.row[`_${col.prop}`].class">{{
            scope.row[`_${col.prop}`].value
          }}</span>
          <span v-else class="cell-span">{{ scope.row[col.prop] }}</span>
        </slot>
      </el-table-column>
      <slot name="append" />
      <div slot="append" v-if="isScroll">
        <div class="load-more" v-if="pageData.hasNextPage && !isLoading">
          <span class="load-more-text" @click="() => $emit('on-next')">点击加载更多</span>
        </div>
        <div class="load-more" v-else-if="pageData.hasNextPage && isLoading && !!renderData.length">
          <span class="load-more-text"><i class="el-icon-loading" aria-hidden="true"></i>正在加载</span>
        </div>
        <div class="load-more" v-else-if="!isLoading && !!renderData.length">
          <span class="load-more-text">没有更多了</span>
        </div>
      </div>
    </el-table>
    <template v-if="!isScroll">
      <el-pagination
        v-if="isPagination && pageData.pageCount > 0"
        :hide-on-single-page="true"
        :current-page.sync="pageData.page"
        :page-size="pageData.pageSize"
        :page-count="pageData.pageCount"
        background
        class="public-pagination"
        layout="prev, pager, next"
        @current-change="() => $emit('on-query')"
        @prev-click="() => $emit('on-prev')"
        @next-click="() => $emit('on-next')"
      />

      <div v-else-if="isPagination && (pageData.hasNextPage || pageData.hasPrevPage)" class="simple-pagination">
        <el-button-group>
          <el-button
            type="primary"
            size="medium"
            icon="el-icon-arrow-left"
            :disabled="!pageData.hasPrevPage || isLoading"
            @click="() => $emit('on-prev')"
            >上一页</el-button
          >
          <el-button type="text" size="medium" class="page" disabled>{{ pageData.page }}</el-button>
          <el-button
            type="primary"
            size="medium"
            :disabled="!pageData.hasNextPage || isLoading"
            @click="() => $emit('on-next')"
          >
            下一页
            <i class="el-icon-arrow-right el-icon--right" aria-hidden="true" />
          </el-button>
        </el-button-group>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { IPageData, IColumnItem } from './PublicTable'

@Component
export default class PublicTable extends Vue {
  /** table list 数据 */
  @Prop({ type: Array, default: () => [] }) data!: any[]
  /** table cols 数据 */
  @Prop({ type: Array, default: () => [] }) columns!: IColumnItem[]
  /** 是否加载中 */
  @Prop({ type: Boolean, default: false }) isLoading!: boolean
  /** 是否显示分页 */
  @Prop({ type: Boolean, default: true }) isPagination!: boolean
  /** col 最小宽度 */
  @Prop({ type: [String, Number] }) colMinWidth!: string | number
  /** 是否上拉加载 与分页互斥 上拉加载优先级高 */
  @Prop({ type: Boolean, default: false }) isScroll!: boolean
  /** tableProps */
  @Prop({
    type: Object,
    default: () => ({
      border: true,
      'highlight-current-row': false,
      'header-row-class-name': 'table-header',
    }),
  })
  tableProps!: object

  /** 分页数据 */
  @Prop({
    type: Object,
    default: () => {
      return {
        pageSize: 10,
        page: 1,
        pageCount: 0,
        hasPrevPage: false,
        hasNextPage: false,
      }
    },
  })
  pageData!: IPageData
  protected renderData: any[] = []

  @Watch('data', { deep: true, immediate: true })
  private onDataChanged(data: any) {
    if (!data.length) {
      this.renderData = []
    } else {
      const renderData: any[] = this._deepClone(data)
      this.columns.forEach(col => {
        if (!col.formatter) return
        renderData.forEach((item: any) => {
          item[`_${col.prop}`] = col.formatter!(item[col.prop], item)
        })
      })
      this.renderData = renderData
    }
  }

  private tableNode: any = {}
  public mounted() {
    this.$nextTick(() => {
      this.tableNode = this.$refs.tableNode
    })
  }

  protected onChooseOperate(op: { command: any; data: any }) {
    op.command.handler && op.command.handler(op.data)
  }

  private _deepClone(data: any): any {
    const type = Object.prototype.toString.call(data)
    if (type === '[object Array]') {
      let result: any[] = []
      data.forEach((item: any) => result.push(this._deepClone(item)))
      return result
    } else if (type === '[object Object]') {
      let result: any = {}
      for (let key in data) {
        result[key] = this._deepClone(data[key])
      }
      return result
    } else {
      return data
    }
  }
}
</script>

<style lang="scss" scpoed>
.table-box {
  .public-table {
    width: 100%;
    .table-header th {
      background-color: #f2f2f2;
      font-size: 14px;
      color: #999999;
    }
    .load-more {
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #999999;
      .load-more-text {
        line-height: 30px;
        padding: 0 20px;
        cursor: pointer;
      }
    }
  }
  .public-pagination.el-pagination {
    text-align: right;
    padding: 10px;
  }
  .simple-pagination {
    padding: 10px;
    vertical-align: middle;
    text-align: right;
    .page.el-button {
      width: 40px !important;
    }
  }
}
</style>
