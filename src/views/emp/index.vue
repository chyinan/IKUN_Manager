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

let tableData = ref<EmpModelArray>([])
  let id1= ref<number>(0)

// 发送 GET 请求
const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8080/api/yuangongData');
        tableData.value = response.data;
        console.log('GET 请求成功:', response);
      } catch (error) {
        console.error('GET 请求失败:', error);
      }
    };

// 页面加载时获取数据
onMounted(fetchData);

// const tableData = [
//   {
//     入职时间: '2016-05-03',
//     姓名: 'Mr.Xiong',
//     住址: '翻斗花园2栋2单元',

//   },
//   {
//     入职时间: '2016-05-02',
//     姓名: 'Mr.Zhao',
//     住址: '坤坤老家',
//   },
//   {
//     入职时间: '2016-05-04',
//     姓名: 'Mr.Zeng',
//     住址: 'No. 189, Grove St, Los Angeles',
//   },
//   {
//     入职时间: '2016-05-01',
//     姓名: 'Mr.Chen',
//     住址: 'Man!What can I say?',
//   },
//   {
//     入职时间: '2016-05-01',
//     姓名: 'Mr.Yin',
//     住址: 'Earth',
//   },
// ]



//新增部门
const dialogFormVisible = ref<boolean>(false) 
const deptForm = ref<EmpModel>({name: '',address:'',time:''})
const formTitle = ref<string>('')

//定义表单校验规则
const deptFormRef = ref<FormInstance>()
const rules = ref<FormRules<EmpModel>>({
  name: [
    { required: true, message: '不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在2-10个字之间', trigger: 'blur' },
  ]
})


//重置表单校验结果
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

//点击新增按钮触发的函数
const add = () => {
  formTitle.value = '新增员工'
  dialogFormVisible.value = true
  deptForm.value = {name: '',address:'',time:''}
}

//点击保存按钮-发送异步请求
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
  })//点击新增按钮触发的函数
}

</script>

<style scoped>
.title {
  font-size: 20px;
  font-weight: bold;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 50px;
}
</style>