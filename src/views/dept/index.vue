<script setup lang="ts">
import {ref, onMounted} from 'vue'
import type { DeptModelArray, DeptModel } from '@/api/model/model'
import {queryAllApi, addApi, queryInfoApi, deleteApi} from '@/api/dept'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import axios from 'axios';


//声明列表展示数据
let tableData = ref<DeptModelArray>([])
let id1= ref<number>(0)
// 定义 mock 数据
// const mockData = {
//   data: {
//     data: [
//       { id: 1, name: 'IT部门', updateTime: '2024-01-01' },
//       { id: 2, name: '采购部门', updateTime: '2024-01-01' },
//       { id: 3, name: '人事部门', updateTime: '2024-01-01' }
//     ]
//   }
// };

// // 使用 mock 数据代替 API 请求
// tableData.value = mockData.data.data;

// 发送 GET 请求
const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8080/api/data');
        tableData.value = response.data;
        console.log('GET 请求成功:', response);
      } catch (error) {
        console.error('GET 请求失败:', error);
      }
    };

    // 页面加载时获取数据
    onMounted(fetchData);
    
 // 发送 POST 请求
//  const sendData = async () => {
//   console.log('发送 POST 请求:', deptForm.value);
//       try {
//         const response = await axios.post('http://127.0.0.1:8080/api/addData', deptForm.value);
//         console.log('POST 请求成功:', response.data);
//       } catch (error) {
//         console.error('POST 请求失败:', error);
//       }
//     };


//新增部门
const dialogFormVisible = ref<boolean>(false) 
const deptForm = ref<DeptModel>({name: ''})
const formTitle = ref<string>('')

//定义表单校验规则
const deptFormRef = ref<FormInstance>()
const rules = ref<FormRules<DeptModel>>({
  name: [
    { required: true, message: '部门名称不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '部门名称长度在2-10个字之间', trigger: 'blur' },
  ]
})

//重置表单校验结果
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

//点击新增按钮触发的函数
const add = () => {
  formTitle.value = '新增部门'
  dialogFormVisible.value = true
  deptForm.value = {name: ''}
}

//点击保存按钮-发送异步请求
const save = async () => {
  const form = deptFormRef.value;
  if (!form) return;
  try {
    await form.validate();
    console.log('发送 POST 请求:', deptForm.value);
    if (id1.value!=0) {
      deptForm.value={"id":id1.value, "name":deptForm.value.name}
      id1.value = 0;
    }
      try {
        const response = await axios.post('http://127.0.0.1:8080/api/addData', deptForm.value);
        console.log('POST 请求成功:', response.data);
      } catch (error) {
        console.error('POST 请求失败:', error);
      }
    ElMessage.success('操作成功');
    dialogFormVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error('表单验证失败');
  }
};

//修改部门-查询回显
const update = async (id:number) => {
  formTitle.value = '修改部门'
  dialogFormVisible.value = true
  deptForm.value = {name: ''}
  id1.value = id;
  const result = await queryInfoApi(id)
  deptForm.value = result.data
}

//删除部门
const deleteById =async (id:number) => {
  //弹出确认框
  ElMessageBox.confirm('您确认删除此部门吗? ', '确认删除').then( async () => {
    try {
      const idMap={"id":id}
        const response = await axios.post('http://127.0.0.1:8080/api/delData', idMap);
        console.log('POST 请求成功:', response.data);
      } catch (error) {
        console.error('POST 请求失败:', error);
      }
      ElMessage.success('删除成功')
      fetchData();
  })
}
</script>

<template>
  <h1>部门管理</h1>
  <el-button type="primary" style="float: right" @click="add(); resetForm(deptFormRef);">+ 新增</el-button>
  <br><br>

  <!-- 部门数据表格 -->
  <el-table :data="tableData" border style="width: 100%">
    <el-table-column type="index" label="序号"  width="80"  align="center"/>
    <el-table-column prop="name" label="部门名称" width="250"  align="center"/>
    <el-table-column prop="updateTime" label="最后操作时间" width="300"  align="center"/>
    <el-table-column label="操作"  align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="update(scope.row.id); resetForm(deptFormRef);">修改</el-button>
        <el-button size="small" type="danger"  @click="deleteById(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 新增部门 / 修改部门对话框 -->
  <el-dialog v-model="dialogFormVisible" :title="formTitle" width="30%">
    <el-form :model="deptForm" :rules="rules" ref="deptFormRef">
      <el-form-item label="部门名称" label-width="80px" prop="name">
        <el-input v-model="deptForm.name" autocomplete="off" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>

</style>