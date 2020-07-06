<template>
  <el-table-column
    v-if="col.type !== 'custom'"
    :prop="col.prop"
    :label="col.label"
    :width="col.width"
    :sortable="col.sortable"
    :min-width="col.minWidth || colMinWidth"
    align="center"
  >
    <template v-if="col.children">
      <PublicTableItem
        v-for="(deepCol, index) in col.children"
        :key="index"
        :col="deepCol"
        :col-min-width="colMinWidth"
      >
        <slot
          slot-scope="props"
          :name="deepCol.prop"
          :row="props.row"
          :index="props.index"
        />
      </PublicTableItem>
    </template>
  </el-table-column>
  <el-table-column
    v-else
    :label="col.label"
    :width="col.width"
    :min-width="col.minWidth || colMinWidth"
    :sortable="col.sortable"
    :prop="col.prop"
    align="center"
  >
    <slot
      v-if="col.children"
      slot="header"
      slot-scope="props"
      :name="col.prop"
      :index="props.$index"
    />
    <template v-else>
      {{ col.label }}
    </template>
    <slot
      slot-scope="props"
      :name="col.prop"
      :row="props.row"
      :index="props.$index"
    />
    <template v-if="col.children">
      <PublicTableItem
        v-for="(deepCol, index) in col.children"
        :key="index"
        :col="deepCol"
        :col-min-width="colMinWidth"
      >
        <slot
          slot-scope="props"
          :name="deepCol.prop"
          :row="props.row"
          :index="props.index"
        />
      </PublicTableItem>
    </template>
  </el-table-column>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { ICol } from './PublicTable'
@Component({
  name: 'PublicTableItem',
})
export default class PublicTableItem extends Vue {
  @Prop({ type: Object }) col!: ICol
  /** col 最小宽度 */
  @Prop({ type: [String, Number], default: '100' }) colMinWidth!: string | number
}
</script>

<style>
</style>
