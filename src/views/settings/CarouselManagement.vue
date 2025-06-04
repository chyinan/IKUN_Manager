<template>
  <div class="app-container carousel-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>轮播图管理</span>
          <el-button type="primary" :icon="Plus" @click="handleOpenAddDialog">添加轮播图</el-button>
        </div>
      </template>

      <el-table :data="carouselImages" v-loading="loading" style="width: 100%">
        <el-table-column label="预览" width="120">
          <template #default="{ row }">
            <el-image 
              style="width: 100px; height: 60px"
              :src="getImageFullUrl(row.image_url)" 
              :preview-src-list="[getImageFullUrl(row.image_url)]"
              fit="contain"
              lazy
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column label="跳转链接" width="250">
          <template #default="{ row }">
            <el-link :href="row.link_url" target="_blank" v-if="row.link_url">{{ row.link_url }}</el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="display_order" label="顺序" width="80" sortable />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch 
              v-model="row.is_active"
              :active-value="true" 
              :inactive-value="false"
              @change="(value) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
            <template #default="{row}">{{ formatDateTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleOpenEditDialog(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDeleteImage(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑轮播图弹窗 -->
    <el-dialog 
      :title="dialogMode === 'add' ? '添加轮播图' : '编辑轮播图'" 
      v-model="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCloseDialog"
    >
      <el-form :model="currentImageForm" :rules="formRules" ref="imageFormRef" label-width="100px">
        <el-form-item label="图片文件" prop="imageFile" v-if="dialogMode === 'add'">
          <el-upload
            ref="uploadRef"
            action="#" 
            :auto-upload="false"
            :limit="1"
            :on-exceed="handleUploadExceed"
            :on-change="handleUploadChange"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <template #trigger>
              <el-button type="primary">选择图片</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                仅支持jpg/png/gif/webp格式, 大小不超过5MB。
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="当前图片" v-if="dialogMode === 'edit' && currentImageForm.image_url">
           <el-image style="width: 200px; height: auto;" :src="getImageFullUrl(currentImageForm.image_url)" fit="contain"/>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="currentImageForm.title" placeholder="请输入图片标题" />
        </el-form-item>
        <el-form-item label="跳转链接" prop="link_url">
          <el-input v-model="currentImageForm.link_url" placeholder="请输入点击跳转的URL (可选)" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="display_order">
          <el-input-number v-model="currentImageForm.display_order" :min="0" />
        </el-form-item>
        <el-form-item label="是否激活" prop="is_active">
          <el-switch v-model="currentImageForm.is_active" :active-value="true" :inactive-value="false" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import {
  getAllCarouselImages,
  addCarouselImage,
  updateCarouselImage,
  deleteCarouselImage,
  type CarouselImage,
  type CarouselImageData
} from '@/api/carousel';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadInstance, type UploadProps, type UploadRawFile } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { formatDateTime } from '@/utils/date'; // 假设您有日期格式化工具

const loading = ref(false);
const submitLoading = ref(false);
const carouselImages = ref<CarouselImage[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const imageFormRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();
const selectedFile = ref<UploadRawFile | null>(null);

const API_BASE_URL = import.meta.env.VITE_APP_BASE_API || ''; // For constructing full image URLs if necessary

const defaultFormData: CarouselImageData = {
  title: '',
  link_url: '',
  display_order: 0,
  is_active: true,
  imageFile: undefined
};

const currentImageForm = reactive<CarouselImageData & { id?: number, image_url?: string }>({ ...defaultFormData });

const formRules = reactive<FormRules>({
  // imageFile: [{ required: true, message: '请上传图片文件', trigger: 'change' }], // Handled by selectedFile check for add mode
  title: [{ required: false, message: '请输入标题', trigger: 'blur' }],
  display_order: [{ type: 'number', message: '顺序必须是数字' }],
});

// 获取图片完整URL (根据后端返回的路径是否已包含/uploads/来决定是否拼接)
const getImageFullUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '';
  // 如果 imageUrl 已经是 /uploads/ 开头，或者是一个完整的URL，直接用
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('http')) {
    return imageUrl; 
  }
  // 默认情况下，如果 API_BASE_URL 设置了，并且它不是一个指向前端开发服务器的URL（例如，它指向后端API）
  // 且图片路径不是 /uploads/ 开头，可能需要拼接。
  // 但通常静态资源由后端express.static在/uploads路径提供，所以前端可以直接用 /uploads/ 开头的路径
  // 如果 VITE_APP_BASE_API 指向的是后端服务地址，如 http://localhost:3000
  // 并且图片URL是 uploads/carousel/image.jpg (没有前导斜杠)
  // 那么可以这样： return `${API_BASE_URL.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
  // 为了安全和通用，如果不是 /uploads/ 开头也不是完整URL，这里返回原始值，依赖于服务器配置的正确性
  // 或者，更常见的是，后端API直接返回 /uploads/carousel/image.jpg 这样的相对路径
  // 确保这里的逻辑与您的后端 API (carouselService.js 中的 UPLOADS_DIR 和返回的 image_url) 匹配
  // 假设后端 image_url 已经是 /uploads/carousel/imagename.ext
  return imageUrl; 
};

const fetchCarouselImages = async () => {
  loading.value = true;
  try {
    const res = await getAllCarouselImages();
    // 直接使用 res.data 作为 API 响应体 (AxiosResponse<ApiResponse<CarouselImage[]>>)
    if (res.code === 200) {
      // 后端返回的 is_active 可能是 0 或 1，转换为 boolean
      carouselImages.value = res.data.map(img => ({ ...img, is_active: !!img.is_active }));
    } else {
      ElMessage.error(res.message || '获取轮播图列表失败');
    }
  } catch (error: any) {
    console.error('Error fetching carousel images:', error);
    ElMessage.error(error?.response?.data?.message || error.message || '获取轮播图列表网络错误');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCarouselImages();
});

const resetForm = () => {
  selectedFile.value = null;
  Object.assign(currentImageForm, { ...defaultFormData, id: undefined, image_url: undefined });
  uploadRef.value?.clearFiles(); // 清空el-upload组件的文件列表
  imageFormRef.value?.resetFields(); // 重置表单校验状态
  imageFormRef.value?.clearValidate();
};

const handleOpenAddDialog = () => {
  resetForm();
  dialogMode.value = 'add';
  dialogVisible.value = true;
};

const handleOpenEditDialog = (rowData: CarouselImage) => {
  resetForm();
  dialogMode.value = 'edit';
  Object.assign(currentImageForm, { 
    ...rowData, 
    is_active: !!rowData.is_active // 确保是布尔值
  });
  dialogVisible.value = true;
};

const handleCloseDialog = () => {
  resetForm();
  dialogVisible.value = false;
};

const handleUploadChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw;
    // 强制更新表单项以触发校验（如果需要）
    // imageFormRef.value?.validateField('imageFile');
  }
};

const handleUploadExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('只能上传一个文件，请先移除已选文件');
};

const handleStatusChange = async (row: CarouselImage, newStatusValue: boolean | string | number) => {
  const newStatus = !!newStatusValue; // 确保是布尔值
  try {
    // 直接传递布尔值给API
    await updateCarouselImage(row.id, { is_active: newStatus });
    ElMessage.success('状态更新成功');
    // 更新本地数据，避免重新请求整个列表
    const index = carouselImages.value.findIndex(item => item.id === row.id);
    if (index !== -1) {
      carouselImages.value[index].is_active = newStatus;
    }
  } catch (error: any) {
    console.error('Error updating status:', error);
    ElMessage.error(error?.response?.data?.message || '状态更新失败');
    // 状态改回去，确保UI与实际状态一致
    const index = carouselImages.value.findIndex(item => item.id === row.id);
    if (index !== -1) {
       carouselImages.value[index].is_active = !newStatus; 
    }
  }
};

const handleSubmitForm = async () => {
  if (!imageFormRef.value) return;
  await imageFormRef.value.validate(async (valid) => {
    if (valid) {
      if (dialogMode.value === 'add' && !selectedFile.value) {
        ElMessage.error('请选择要上传的图片文件');
        return;
      }

      submitLoading.value = true;
      try {
        const formData = new FormData();
        
        // 为添加模式准备图片文件
        if (dialogMode.value === 'add' && selectedFile.value) {
          formData.append('imageFile', selectedFile.value);
        }

        // 添加其他表单数据
        // 确保只添加已定义的值，避免发送 "undefined" 字符串
        if (currentImageForm.title !== undefined) formData.append('title', currentImageForm.title);
        if (currentImageForm.link_url !== undefined) formData.append('link_url', currentImageForm.link_url || ''); // 发空字符串如果未定义
        if (currentImageForm.display_order !== undefined) formData.append('display_order', String(currentImageForm.display_order));
        formData.append('is_active', String(!!currentImageForm.is_active));

        if (dialogMode.value === 'add') {
          const res = await addCarouselImage(formData);
          if (res.code === 201) {
            ElMessage.success('添加成功');
            fetchCarouselImages(); // 重新加载列表
            dialogVisible.value = false;
          } else {
            ElMessage.error(res.message || '添加失败');
          }
        } else if (currentImageForm.id) {
          // 编辑模式下，我们只更新元数据。如果允许更换图片，则需要不同的API或逻辑
          const updateData: Partial<CarouselImageData> = {
            title: currentImageForm.title,
            link_url: currentImageForm.link_url || '',
            display_order: currentImageForm.display_order,
            is_active: !!currentImageForm.is_active,
          };
          const res = await updateCarouselImage(currentImageForm.id, updateData);
          if (res.code === 200) {
            ElMessage.success('更新成功');
            fetchCarouselImages(); // 重新加载列表
            dialogVisible.value = false;
          } else {
            ElMessage.error(res.message || '更新失败');
          }
        }
      } catch (error: any) {
        console.error('Error submitting form:', error);
        ElMessage.error(error?.response?.data?.message || error.message || '操作失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleDeleteImage = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除此轮播图吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    // 用户确认删除
    // loading.value = true; // 可以用表格的loading或单独的删除loading
    const res = await deleteCarouselImage(id);
    if (res.code === 200) { // 假设后端删除成功返回200
      ElMessage.success('删除成功');
      fetchCarouselImages(); // 重新加载列表
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error: any) {
    if (error === 'cancel' || (typeof error === 'string' && error.includes('cancel'))) {
      // 用户点击了取消，不做任何事
      ElMessage.info('取消删除');
      return;
    }
    console.error('Error deleting image:', error);
    ElMessage.error(error?.response?.data?.message || '删除操作失败');
  } finally {
    // loading.value = false;
  }
};

</script>

<style lang="scss" scoped>
.carousel-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .el-upload__tip {
    color: #909399;
    font-size: 12px;
    margin-top: 7px;
  }
}

</style> 