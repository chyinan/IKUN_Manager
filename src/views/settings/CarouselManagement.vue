<template>
  <div class="app-container carousel-management">
    <!-- 头部操作区 -->
    <div class="operation-header">
      <div class="interval-setting-section">
        <span class="interval-label">全局轮播图切换时间 (毫秒)：</span>
        <el-input-number 
          v-model="carouselInterval" 
          :min="1000" 
          :step="500" 
          controls-position="right" 
          style="width: 180px; margin-left: 10px;"
        />
        <el-button 
          type="success" 
          @click="handleSaveInterval" 
          :loading="intervalLoading"
          size="default"
          style="margin-left: 10px;"
        >
          保存切换时间
        </el-button>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleOpenAddDialog">添加轮播图</el-button>
    </div>

    <!-- 轮播图数据表格 -->
    <el-table 
      :data="carouselImages" 
      v-loading="loading" 
      stripe
      border
      highlight-current-row
      class="carousel-table"
    >
      <el-table-column label="预览" width="120">
        <template #default="{ row }">
          <div class="preview-image-wrapper">
            <el-image 
              style="width: 100px; height: 60px"
              :src="getImageFullUrl(row.imageUrl)" 
              :preview-src-list="[getImageFullUrl(row.imageUrl)]"
              fit="contain"
              lazy
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150">
        <template #default="{ row }">
          <span>{{ row.title || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="跳转链接" min-width="200">
        <template #default="{ row }">
          <el-link :href="row.linkUrl" target="_blank" v-if="row.linkUrl">{{ row.linkUrl }}</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="displayOrder" label="顺序" width="80" sortable />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch 
            v-model="row.isActive"
            :active-value="true" 
            :inactive-value="false"
            @change="(value: boolean) => handleStatusChange(row, value)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{row}">
            {{ console.log('row.updatedAt:', row.updatedAt) }}
            {{ formatDateTime(row.updatedAt) }}
          </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="{ row }">
          <el-button type="primary" link :icon="Edit" @click="handleOpenEditDialog(row)">编辑</el-button>
          <el-button type="danger" link :icon="Delete" @click="handleDeleteImage(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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
        <el-form-item label="当前图片" v-if="dialogMode === 'edit' && currentImageForm.imageUrl">
           <el-image style="width: 200px; height: auto;" :src="getImageFullUrl(currentImageForm.imageUrl)" fit="contain"/>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="currentImageForm.title" placeholder="请输入图片标题" />
        </el-form-item>
        <el-form-item label="跳转链接" prop="linkUrl">
          <el-input v-model="currentImageForm.linkUrl" placeholder="请输入点击跳转的URL (可选)" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="displayOrder">
          <el-input-number v-model="currentImageForm.displayOrder" :min="0" />
        </el-form-item>
        <el-form-item label="是否激活" prop="isActive">
          <el-switch v-model="currentImageForm.isActive" :active-value="true" :inactive-value="false" />
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
import { getCarouselIntervalConfig, updateCarouselIntervalConfig } from '@/api/config';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadInstance, type UploadProps, type UploadRawFile, genFileId } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { formatDateTime } from '@/utils/date'; // 假设您有日期格式化工具

const loading = ref(false);
const submitLoading = ref(false);
const intervalLoading = ref(false);
const carouselInterval = ref(5000);
const carouselImages = ref<CarouselImage[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const imageFormRef = ref<FormInstance>();
const uploadRef = ref<UploadInstance>();
const selectedFile = ref<UploadRawFile | null>(null);

const API_BASE_URL = import.meta.env.VITE_APP_BASE_API || '';

const defaultFormData: CarouselImageData = {
  title: '',
  linkUrl: '',
  displayOrder: 0,
  isActive: true,
  imageFile: undefined
};

const currentImageForm = reactive<CarouselImageData & { id?: number, imageUrl?: string }>({ ...defaultFormData });

const formRules = reactive<FormRules>({
  // imageFile: [{ required: true, message: '请上传图片文件', trigger: 'change' }], // Handled by selectedFile check for add mode
  title: [{ required: false, message: '请输入标题', trigger: 'blur' }],
  displayOrder: [{ type: 'number', message: '顺序必须是数字' }],
});

// 获取图片完整URL
const getImageFullUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '';

  // 如果已经是完整的HTTP/HTTPS URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log(`getImageFullUrl: Already full URL: ${imageUrl}`);
    return imageUrl;
  }

  // 获取服务器基础URL，移除 '/api' 部分
  const serverBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
  console.log(`getImageFullUrl: serverBaseUrl: ${serverBaseUrl}`);

  // 如果后端返回的路径已经包含了 /uploads/，则直接拼接服务器基础URL
  if (imageUrl.startsWith('/uploads/')) {
    const fullUrl = `${serverBaseUrl}${imageUrl}`;
    console.log(`getImageFullUrl: /uploads/ path, full URL: ${fullUrl}`);
    return fullUrl;
  }

  // 否则，假定是相对于 uploads 目录的路径（如 'carousel/image.jpg'），需要加上 /uploads/
  const fullUrl = `${serverBaseUrl}/uploads/${imageUrl.replace(/^\//, '')}`; // 确保不出现双斜杠
  console.log(`getImageFullUrl: relative path, full URL: ${fullUrl}`);
  return fullUrl;
};

const fetchCarouselImages = async () => {
  loading.value = true;
  try {
    const res = await getAllCarouselImages();
    if (res.code === 200) {
      carouselImages.value = res.data.map((img: CarouselImage) => ({ ...img, isActive: !!img.isActive }));
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

const fetchCarouselInterval = async () => {
  intervalLoading.value = true;
  try {
    const res = await getCarouselIntervalConfig();
    if (res.code === 200 && res.data !== null && res.data !== undefined) {
      if (typeof res.data === 'number') {
        carouselInterval.value = res.data;
      } else if (typeof res.data === 'object' && 'carouselInterval' in res.data) {
        carouselInterval.value = (res.data as any).carouselInterval;
      }
    } else {
      ElMessage.error(res.message || '获取轮播图切换时间失败');
    }
  } catch (error: any) {
    console.error('Error fetching carousel interval:', error);
    ElMessage.error(error?.response?.data?.message || error.message || '获取轮播图切换时间网络错误');
  } finally {
    intervalLoading.value = false;
  }
};

onMounted(() => {
  fetchCarouselImages();
  fetchCarouselInterval();
});

const resetForm = () => {
  selectedFile.value = null;
  Object.assign(currentImageForm, { ...defaultFormData, id: undefined, imageUrl: undefined });
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
    isActive: !!rowData.isActive // 确保是布尔值
  });
  dialogVisible.value = true;
};

const handleCloseDialog = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleUploadChange: UploadProps['onChange'] = (uploadFile) => {
  selectedFile.value = uploadFile.raw || null;
};

const handleUploadExceed: UploadProps['onExceed'] = (files) => {
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value?.clearFiles();
  uploadRef.value?.handleStart(file); // This will trigger onChange
};

const handleStatusChange = async (rowData: CarouselImage, newStatus: boolean) => {
  try {
    const res = await updateCarouselImage(rowData.id, { isActive: newStatus });
    if (res.code === 200) {
      ElMessage.success('状态更新成功');
      // Optional: you can find and update the item in carouselImages.value locally
      // to avoid a full refetch, but refetching is safer.
      const index = carouselImages.value.findIndex(img => img.id === rowData.id);
      if (index !== -1) {
        carouselImages.value[index].isActive = newStatus;
      }
    } else {
      // Revert switch state on failure
      rowData.isActive = !newStatus;
      ElMessage.error(res.message || '状态更新失败');
    }
  } catch (error: any) {
    console.error(`Error updating status for image ${rowData.id}:`, error);
    // Revert switch state on failure
    rowData.isActive = !newStatus;
    ElMessage.error(error?.response?.data?.message || error.message || '状态更新失败');
  }
};

const handleSubmitForm = async () => {
  if (!imageFormRef.value) return;

  try {
    await imageFormRef.value.validate();
    submitLoading.value = true;

    if (dialogMode.value === 'add') {
      if (!selectedFile.value) {
        ElMessage.error('请选择图片文件进行上传');
        submitLoading.value = false;
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile.value);
      // Append other fields, ensuring not to append null values
      if (currentImageForm.title) formData.append('title', currentImageForm.title);
      if (currentImageForm.linkUrl) formData.append('linkUrl', currentImageForm.linkUrl);
      formData.append('displayOrder', String(currentImageForm.displayOrder || 0));
      formData.append('isActive', String(!!currentImageForm.isActive));

      const res = await addCarouselImage(formData);
      if (res.code === 200) {
        ElMessage.success('轮播图添加成功！');
        dialogVisible.value = false;
        fetchCarouselImages(); // Refresh list
      } else {
        ElMessage.error(res.message || '添加轮播图失败');
      }
    } else {
      // Edit mode
      if (!currentImageForm.id) {
        ElMessage.error('轮播图ID缺失，无法更新。');
        submitLoading.value = false;
        return;
      }

      const updateData: CarouselImageData = {
        title: currentImageForm.title,
        linkUrl: currentImageForm.linkUrl,
        displayOrder: currentImageForm.displayOrder,
        isActive: currentImageForm.isActive,
      };
      console.log('Sending updateData:', updateData);

      const res = await updateCarouselImage(currentImageForm.id, updateData);
      if (res.code === 200) {
        ElMessage.success('轮播图更新成功！');
        dialogVisible.value = false;
        fetchCarouselImages(); // Refresh list
      } else {
        ElMessage.error(res.message || '更新轮播图失败');
      }
    }
  } catch (error: any) {
    console.error('Error submitting form:', error);
    ElMessage.error(error?.response?.data?.message || error.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
};

const handleDeleteImage = (id: number) => {
  ElMessageBox.confirm('确定要删除这个轮播图吗？此操作不可逆。', '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteCarouselImage(id);
      ElMessage.success('删除成功');
      fetchCarouselImages(); // Refresh list
    } catch (error: any) {
      console.error(`Error deleting image ${id}:`, error);
      ElMessage.error(error?.response?.data?.message || error.message || '删除失败');
    }
  }).catch(() => {
    // User clicked cancel
  });
};

const handleSaveInterval = async () => {
  intervalLoading.value = true;
  try {
    const res = await updateCarouselIntervalConfig(carouselInterval.value);
    if (res.code === 200) {
      ElMessage.success('切换时间保存成功！');
    } else {
      ElMessage.error(res.message || '更新轮播图切换时间失败');
    }
  } catch (error: any) {
    console.error('Error saving carousel interval:', error);
    ElMessage.error(error?.response?.data?.message || error.message || '保存失败');
  } finally {
    intervalLoading.value = false;
  }
};

</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px 20px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.interval-setting-section {
  display: flex;
  align-items: center;
}

.interval-label {
  margin-right: 10px;
  color: var(--el-text-color-primary);
}

.carousel-table {
  width: 100%;
  margin-bottom: 20px;
}

.preview-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>