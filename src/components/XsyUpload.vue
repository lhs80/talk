<template>
  <div @click="handleClick">
    <template v-if="props.drag">
      <div
        class="xsy-upload-dragger"
        @drop.prevent="onDrop"
        @dragover.prevent="onDragover"
        @dragleave.prevent="dragover = false"
      >
        <slot/>
      </div>
    </template>
    <template v-else>
      <slot/>
    </template>
    <slot name="tip"></slot>
    <ul class="el-upload-list" v-if="props.showFileList">
      <li class="el-upload-list__item" v-for="file in uploadFileList">
        <el-icon class="el-icon--document">
          <Document/>
        </el-icon>
        <span class="el-upload-list__item-file-name">{{file.name}}</span>
        <el-icon class="el-icon--close" @click.stop="handleRemove(file)">
          <Close/>
        </el-icon>
      </li>
    </ul>
    <input ref="inputFileRef" class="file" type="file" :multiple="props.multiple" :accept="props.accept"
           @change="handleFile">
  </div>
</template>

<script setup lang="ts">
  import {Document, Close} from '@element-plus/icons-vue'

  const inputFileRef = ref(null);
  const props = defineProps({
    drag: {
      type: Boolean,
      default: false
    },
    fileList: {
      type: Array,
      default: []
    },
    showFileList: {
      type: Boolean,
      default: true
    },
    multiple: {
      type: Boolean,
      default: false
    },
    accept: {
      type: String,
      default: ''
    },
    onChange: {
      type: Function,
      default: () => {
      }
    },
    onRemove: {
      type: Function,
      default: () => {
      }
    },
    beforeUpload: {
      type: Boolean,
      default: false
    }
  });
  const uploadFileList = ref([]);
  const dragover = ref(false);
  const handleClick = () => {
    inputFileRef.value.click();
  };
  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    if (!files) return;
    console.log("用户选择了文件：", files);
    uploadFiles(files)
  };
  const onDrop = (e) => {
    // dragover.value = false;
    e.stopPropagation();
    const files = Array.from(e.dataTransfer!.files);
    console.log("用户拖入了文件：", files);
    uploadFiles(files);
  };
  const onDragover = (e) => {
    // if (!disabled.value) dragover.value = true
  };
  const uploadFiles = (files) => {
    if (files.length === 0) return;
    const {multiple} = props;
    if (!multiple) {
      files = files.slice(0, 1)
    }
    uploadFileList.value = [...uploadFileList.value, ...files];
    for (const file of files) {
      let handResult = true;
      if (props.beforeUpload instanceof Function)
        handResult = props.beforeUpload(file);
      if (handResult) {
        props.onChange(file, files);
      }
    }
  };

  const handleRemove = (file) => {
    const fileIndex = uploadFileList.value.findIndex(item => {
      return item.name === file.name
    });
    uploadFileList.value.splice(fileIndex, 1);
    props.onRemove(file, uploadFileList)
  };

  const clearFiles = () => {
    uploadFileList.value = [];
  };
  defineExpose({
    clearFiles
  });
</script>

<style lang="less" scoped>
  .file {
    display: none;
  }

  .xsy-upload-dragger {
    padding: 40px;
    background-color: transparent;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    box-sizing: border-box;
    text-align: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .el-upload-list__item {
    display: flex;
    width: 100%;
    align-items: center;

    .el-upload-list__item-file-name {
      display: inline-block;
      margin-left: 5px;
      width: 80%;
    }
  }
</style>
