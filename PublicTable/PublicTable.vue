<template>
  <section class="table-box">
    <el-table
      ref="tableNode"
      v-loading="isLoading"
      :data="data"
      fit
      stripe
      highlight-current-row
      :show-summary="showSummary"
      class="public-table"
      header-row-class-name="table-header"
      @row-click="(row, column, event) => $emit('row-click',row, column, event)"
      @selection-change="(selection) => $emit('selection-change',selection)"
      @sort-change="(sortInfo) => $emit('sort-change', sortInfo)"
      @select="(selection, row) => $emit('select', selection, row)"
      @select-all="(selection) => $emit('select-all', selection)"
    >
      <slot name="prepend" />
      <slot>
        <PublicTableItem
          v-for="(col, index) in cols"
          :key="index"
          :col="col"
          :col-min-width="colMinWidth"
        >
          <slot
            v-for="(_, name) in $slots"
            :slot="name"
            :name="name"
          />
          <template
            v-for="(_, name) in $scopedSlots"
            :slot="name"
            slot-scope="slotData"
          >
            <slot
              :name="name"
              v-bind="slotData"
            />
          </template>
        </PublicTableItem>
      </slot>
      <slot name="append" />
    </el-table>

    <el-pagination
      v-if="!!pageData.pageCount && isPagination"
      :hide-on-single-page="true"
      :current-page.sync="pageData.pageNum"
      :page-size="pageData.pageSize"
      :total="pageData.pageCount"
      background
      class="public-pagination"
      layout="prev, pager, next"
      @current-change="() => $emit('onQuery')"
      @prev-click="() => $emit('onPrev')"
      @next-click="() => $emit('onNext')"
    />

    <div
      v-else-if="pageData.hasNextPage && isPagination || pageData.hasPrevPage && isPagination"
      class="simple-pagination"
    >
      <el-button-group>
        <el-button
          type="primary"
          icon="el-icon-arrow-left"
          :disabled="!pageData.hasPrevPage || isLoading"
          @click="() => $emit('onPrev')"
        >
          上一页
        </el-button>
        <el-button
          type="text"
          class="page"
          disabled
        >
          {{ pageData.pageNum }}
        </el-button>
        <el-button
          type="primary"
          :disabled="!pageData.hasNextPage || isLoading"
          @click="() => $emit('onNext')"
        >
          下一页
          <i class="el-icon-arrow-right el-icon--right" />
        </el-button>
      </el-button-group>
    </div>
  </section>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { IPageData, ICol } from './PublicTable'
import PublicTableItem from './PublicTableItem.vue'

@Component({
  components: {
    PublicTableItem,
  },
})
export default class PublicTable extends Vue {
  /** table list 数据 */
  @Prop({ type: Array, default: () => [] }) data!: any[]
  /** table cols 数据 */
  @Prop({ type: Array, default: () => [] }) cols!: ICol[]
  /** 是否显示合计行 */
  @Prop({ type: Boolean, default: false }) showSummary!: boolean
  /** 是否加载中 */
  @Prop({ type: Boolean, default: false }) isLoading!: boolean
  /** 是否显示分页 */
  @Prop({ type: Boolean, default: true }) isPagination!: boolean
  /** col 最小宽度 */
  @Prop({ type: [String, Number], default: '100' }) colMinWidth!: string|number
  /** 分页数据 */
  @Prop({
    type: Object,
    default: () => {
      return {
        pageSize: 10,
        pageNum: 1,
        pageCount: 0,
        hasPrevPage: false,
        hasNextPage: false,
      }
    },
  })
  pageData!: IPageData
  public tableNode: any = {}
  public mounted() {
    this.$nextTick(() => {
      this.tableNode = this.$refs.tableNode
    })
  }
}

</script>

<style lang="scss" scpoed>
.public-table {
  width: 100%;
  .table-header th {
    background-color: #f2f2f2;
    font-size: 14px;
    color: #666666;
  }
  .cell-buttons {
    .btn {
      min-width: 50px;
      font-weight: bold;
    }
  }
  .load-more {
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999999;
  }
}
.public-pagination {
  text-align: right;
  padding: 20px 10px;
}
.simple-pagination {
  padding: 10px;
  vertical-align: middle;
  text-align: right;
  .page.el-button {
    width: 40px !important;
  }
}
.no-data{
  padding: 20px;
  font-size:16px;
  color:#999999;
  text-align: center;
}
.el-pagination.is-background .btn-prev, .el-pagination.is-background .btn-next, .el-pagination.is-background .el-pager li{
  background-color: #ffffff;
  font-size: 14px;
  color: rgba(0,0,0,0.65);
  border: 1px solid rgba(0,0,0,0.15);
}
.el-pagination.is-background .el-pager li:not(.disabled).active{
  background: linear-gradient(180deg, #57E099 0%, #57E099 0%, #2CBE60 100%);
  color: #FFFFFF;
  border: none;
}
.el-table__footer {
  tr {
    td{
      font-size: 14px;
      color: rgba(0,0,0,0.85);
      font-weight: 600;
    }
  }
}
</style>
