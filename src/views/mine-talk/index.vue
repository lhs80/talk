<template>
  <common-header title="我的谈话" @back="close"/>
  <div class="mine-talk-wrapper">
    <el-form class="search-panel" :inline="true" :model="state.query">
      <el-form-item style="margin-bottom: 0" label="查询时间" prop="date">
        <el-date-picker v-model="state.query.date" type="daterange" range-separator="-" start-placeholder="开始日期"
                        end-placeholder="结束日期" value-format="YYYY-MM-DD"/>
      </el-form-item>
      <el-form-item style="margin-bottom: 0" label="" prop="keyWords">
        <el-input placeholder="请输入案号或参与人" v-model="state.query.searchString"/>
      </el-form-item>
      <el-form-item style="margin-bottom: 0">
        <el-button type="primary" @click="getMeetingList">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table class="table" :data="state.meetingList">
      <el-table-column label="案号" prop="meetingName" align="left">
        <template #default="scope">
          {{scope.row.meetingName}}
        </template>
      </el-table-column>
      <el-table-column label="参与人" prop="participants" align="left" :show-overflow-tooltip="true">
        <template #default="scope"> {{ scope.row.participants || "-" }}</template>
      </el-table-column>
      <el-table-column label="谈话开始时间" align="left">
        <template #default="scope">
          {{ scope.row.meetingStartTime?dayjs(scope.row.meetingStartTime).format("YYYY-MM-DD HH:mm"):'-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="left">
        <template #default="scope">
          <el-button class="btn-menu" size="small" @click="againTalk(scope.row, scope.row.meetingName, scope.row.id)">
            重签/补签
          </el-button>
          <el-button class="btn-menu" size="small" @click="goToNote(scope.row)"> 查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pages">
      <el-pagination
        small
        :total="state.total"
        :currentPage="state.query.pageIndex"
        :page-size="state.query.pageSize"
        layout="total,prev, pager, next,jumper"
        @current-change="changeCurrentPage"
        :background="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {getMeetingHistoryListApi} from "@/api/modules/mcs";
  import {dayjs} from 'element-plus'

  const router = useRouter();
  const state = reactive({
    query: {
      date: [],
      searchString: null,
      pageIndex: 1,
      pageSize: 10,
      meetingType: 1
    },
    total: 0,
    meetingList: [],
  });
  //谈话列表
  const getMeetingList = async () => {
    let {date, ...otherParams} = state.query;
    let params = {
      ...otherParams,
      meetingEndTime: date && date.length > 0 ? date[1] + " 23:59:59" : null,
      meetingStartTime: date && date.length > 0 ? date[0] + " 00:00:00" : null,
    };
    let response = await getMeetingHistoryListApi(params);
    if (response) {
      state.meetingList = response.data;
      state.total = response.total;
    }
  };
  //翻页
  const changeCurrentPage = (val) => {
    state.query.pageIndex = val;
    getMeetingList();
  };
  //关闭窗口
  const close = () => {
    router.replace("/main");
  };
  const againTalk = (row) => {
    router.push({
      path: "/order/again",
      query: {
        meetingId: row.id,
      },
    });
  };
  const goToNote = (row) => {
    router.push({
      path: "/material",
      query: {
        meetingId: row.id,
        type: "check", //查看
      },
    });
  };
  onActivated(() => {
    getMeetingList();
  });
  onMounted(() => {
    getMeetingList();
  });
  onBeforeRouteLeave((to, from, next) => {
    from.meta.keepAlive = to.path === "/material";
    next();
  });
</script>
<style lang="scss">
  .mine-talk-wrapper {
    width: 100%;
    height: calc(100% - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fafbfc;
    box-sizing: border-box;
    padding: 20px;

    .search-panel {
      width: 100%;
      padding: 15px;
      box-shadow: 0 0 4px 0 rgba(230, 230, 230, 0.5);
      border-radius: 6px;
      background: #fff;
      box-sizing: border-box;
    }

    .el-table {
      width: 100%;
      margin-top: 20px;

      th {
        background: #f2f2f2 !important;
        color: #333 !important;
        font-size: 14px;
      }

      .btn-menu {
        border: solid 1px #0486fe;
        color: #0486fe;
      }
    }

    .pages {
      width: 100%;
      padding: 2% 0 10px 0;
      display: flex;
      justify-content: end;
      background: white;
    }
  }
</style>
