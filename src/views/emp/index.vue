<template>
  <div class="page-header">
    <h1 class="title">员工管理</h1>
    <el-button type="primary" style="float: right" @click="add(); resetForm(deptFormRef);">+ 新增</el-button>
  <br><br>
      <div class="button-container">

        <!-- 新增部门 / 修改部门对话框 -->
        <el-dialog v-model="dialogFormVisible" :title="formTitle" width="30%">
          <el-form :model="deptForm" :rules="rules" ref="deptFormRef">
        <el-form-item label="入职时间" label-width="80px" prop="time">
          <el-input v-model="deptForm.time" autocomplete="off" />
        </el-form-item>
        <el-form-item label="姓名" label-width="80px" prop="name">
          <el-input v-model="deptForm.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="住址" label-width="80px" prop="address">
          <el-input v-model="deptForm.address" autocomplete="off" />
        </el-form-item>
        </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </template>
  </el-dialog>
  </div>

  </div>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="time" label="入职时间" width="180" />
    <el-table-column prop="name" label="姓名" width="180" />
    <el-table-column prop="address" label="住址" />
  </el-table>
</template>


<script lang="ts" setup>
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {ref, onMounted} from 'vue'
import type {EmpModelArray,EmpModel} from '@/api/model/model'
import axios from 'axios'

// 定义员工数据列表
let tableData = ref<EmpModelArray>([])
let id1= ref<number>(0)

// 获取所有员工数据
const fetchData = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8080/api/yuangongData');
    tableData.value = response.data;
    console.log('GET 请求成功:', response);
  } catch (error) {
    console.error('GET 请求失败:', error);
  }
};

// 页面加载时执行数据获取
onMounted(fetchData);

// 新增员工相关状态
const dialogFormVisible = ref<boolean>(false) // 对话框显示状态
const deptForm = ref<EmpModel>({name: '',address:'',time:''}) // 表单数据
const formTitle = ref<string>('') // 对话框标题

// 表单校验规则定义
const deptFormRef = ref<FormInstance>()
const rules = ref<FormRules<EmpModel>>({
  name: [
    { required: true, message: '不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在2-10个字之间', trigger: 'blur' },
  ]
})

// 重置表单
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

// 新增员工按钮处理函数
const add = () => {
  formTitle.value = '新增员工'
  dialogFormVisible.value = true
  deptForm.value = {name: '',address:'',time:''}
}

// 保存员工数据
const save = async () => {
  const form = deptFormRef.value;
  if (!form) return;
  try {
    await form.validate();
    console.log('发送 POST 请求:', deptForm.value);
    try {
      const response = await axios.post('http://127.0.0.1:8080/api/addData2', deptForm.value);
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

// 删除员工数据
const deleteById =async (id:number) => {
  // 删除确认对话框
  ElMessageBox.confirm('您确认删除此员工吗? ', '确认删除').then(async () => {
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

<style scoped>
/* 标题样式 */
.title {
  font-size: 20px;
  font-weight: bold;
}

/* 按钮容器样式 */
.button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 50px;
}
</style>