<template>
    <el-row>
      <el-col :sm="12" :lg="6">
        <el-result
          icon="success"
          title="唱"
          sub-title="Please follow the instructions"
        >
          <template #extra>
            <el-button type="primary">Back</el-button>
          </template>
        </el-result>
      </el-col>
      <el-col :sm="12" :lg="6">
        <el-result
          icon="warning"
          title="跳"
          sub-title="Please follow the instructions"
        >
          <template #extra>
            <el-button type="primary">Back</el-button>
          </template>
        </el-result>
      </el-col>
      <el-col :sm="12" :lg="6">
        <el-result
          icon="error"
          title="RAP"
          sub-title="Please follow the instructions"
        >
          <template #extra>
            <el-button type="primary">Back</el-button>
          </template>
        </el-result>
      </el-col>
      <el-col :sm="12" :lg="6">
        <el-result icon="info" title="篮球">
          <template #sub-title>
            <p>Using slot as subtitle</p>
          </template>
          <template #extra>
            <el-button type="primary">Back</el-button>
          </template>
        </el-result>
      </el-col>
    </el-row>
  </template>
  