<template>
  <div v-if="data" class="table-view">
    <div class="table-wrapper">
      <table class="table table-striped">
        <thead>
          <tr>
            <th
              v-for="(columnName, index) in header"
              :key="view+'h'+index"
            >{{getKeyName(columnName)}}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in data" :key="view+'r'+rowIndex">
            <td
              v-for="(item, itemKey) in row"
              :key="view+'r'+rowIndex+'i'+itemKey"
              :class="{'table-item-clickable': isItemClickable(itemKey)}"
              @click="onItemClick(itemKey, item)"
            >
              <Age v-if="itemKey === 'age'" :date="item" />
              <div v-else class="max-item-width">{{ item }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!--
        <div
            v-if="pagination"
            class="table-pagination"
        >
            <ButtonMore
                v-if="pageIndex===0"
                @click="onMoreClick"
            >
                More
            </ButtonMore>
            <Pagination
                v-else
                :nextPageAction="nextPageAction"
                :previousPageAction="previousPageAction"
            />
    </div>-->
  </div>
</template>

<script>
import TableView from './TableView.vue'
export default {
  extends: TableView,

  created() {
    this.componentType = 'list'
  },

  components: {},
  props: {
    data: {
      type: Array,
      required: true
    },

    pagination: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    // data() {
    //     let data = this.$store.getters[this.view + "/getPageList"];
    //     if(Array.isArray(data))
    //         return data;
    //     else
    //         return null;
    // },

    header() {
      let header = []
      if (this.data) for (let key in this.data[0]) header.push(key)
      return header
    }

    // pageIndex() {
    //     return this.$store.getters[this.view + '/getPageIndex'];
    // },

    // nextPageAction() {
    //     return this.view + '/fetchNextPage';
    // },

    // previousPageAction() {
    //     return this.view + '/fetchPreviousPage';
    // }
  },

  methods: {
    onMoreClick() {
      this.$store.dispatch(this.nextPageAction)
    }
  }
}
</script>

<style lang="scss" scoped>
.table-view {
  overflow: auto;
  .table-pagination {
    float: right;
  }
}
</style>