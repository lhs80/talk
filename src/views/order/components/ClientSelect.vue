<template>
  <el-select
    style="width: 100%"
    v-bind="$attrs"
    clearable
    filterable
    remote
    :reserve-keyword="false"
    :multiple="multiple"
    :placeholder="placeholder"
    :remote-method="(query) => getUserByFuzzyName(query)"
    value-key="id"
  >
    <el-option-group v-for="group in state.personList" :key="group.depId" :label="group.depName">
      <el-option v-for="item in group.child" :key="item.id" :label="item.userName" :value="item"/>
    </el-option-group>
  </el-select>
</template>

<script setup lang="ts">
  import {getUserByFuzzyNameApi} from "@/api/modules/pbs";
  import {getToken} from "@/utils/auth";

  const props = defineProps({
    placeholder: {
      type: String,
      default: "请输入",
    },
    multiple: {
      type: Boolean,
      default: true,
    },
    initData: {
      type: Object,
      default: null
    }
  });
  const state = reactive({
    personList: [],
  });
  //模糊搜索用户
  const getUserByFuzzyName = async (queryString = "") => {
    console.log("getUserByFuzzyName");
    // if (queryString !== "") {
    let params = {
      searchValue: queryString,
      pageNo: 1,
      pageSize: 1000,
      unitId:getToken()?.unitId
    };
    let response = await getUserByFuzzyNameApi(params);
    if (response.success) {
      state.personList = memberGroup(response.data);
    }
    // }
  };
  //将人员按部门进行分组
  const memberGroup = (array) => {
    //定义一个空数组
    let newArr = [];
    //通过forEach循环数组
    array.forEach((item, i) => {
      let index = -1;
      //然后在跑到这里筛选 根据不同的joinRole放置不同的数组
      let isExists = newArr.some((newItem, j) => {
        if (item["depId"] === newItem["depId"]) {
          index = j;
          return true;
        }
      });
      //代码是先跑这里的if条件判读
      if (!isExists) {
        newArr.push({
          depId: item.depId,
          depName: item.depName,
          child: [item],
        });
      } else {
        newArr[index].child.push(item);
      }
    });
    return newArr;
  };
  watch(() => props.initData, () => {
    let initData=props.initData;
    if (!Array.isArray(initData)) {
      initData=[initData]
    }
    initData.map(item=>{
      state.personList.push({
        depId: item?.depId,
        depName: item?.depName,
        child: [item]
      });
    })
  });
</script>
