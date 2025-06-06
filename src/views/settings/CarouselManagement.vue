<template>
  <div class="app-container carousel-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>轮播图管理</span>
          <el-button type="primary" :icon="Plus" @click="handleOpenAddDialog">添加轮播图</el-button>
        </div>
      </template>

      <el-form 
        label-position="left" 
        label-width="auto" 
        :model="{ carouselInterval }" 
        style="margin-bottom: 20px; padding: 15px; border: 1px solid #ebeef5; border-radius: 4px;"
        @submit.prevent="handleSaveInterval"
      >
        <el-row :gutter="20" align="middle">
          <el-col :span="12">
            <el-form-item label="全局轮播图切换时间 (毫秒)">
              <el-input-number v-model="carouselInterval" :min="1000" :step="500" controls-position="right" style="width: 200px;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-button type="success" @click="handleSaveInterval" :loading="intervalLoading">
              保存切换时间
            </el-button>
          </el-col>
        </el-row>
      </el-form>

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
              @change="(value: boolean) => handleStatusChange(row, value)"
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
  // Assuming backend returns a full relative path like /uploads/carousel/image.jpg
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('http')) {
    return imageUrl; 
  }
  // Fallback for safety, though the above should be the primary case.
  return `${(API_BASE_URL || '').replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
};

const fetchCarouselImages = async () => {
  loading.value = true;
  try {
    const res = await getAllCarouselImages();
    if (res.code === 200) {
      carouselImages.value = res.data.map((img: CarouselImage) => ({ ...img, is_active: !!img.is_active }));
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
    if (res.code === 200 && res.data) {
      carouselInterval.value = res.data.carouselInterval;
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
    const res = await updateCarouselImage(rowData.id, { is_active: newStatus });
    if (res.code === 200) {
      ElMessage.success('状态更新成功');
      // Optional: you can find and update the item in carouselImages.value locally
      // to avoid a full refetch, but refetching is safer.
      const index = carouselImages.value.findIndex(img => img.id === rowData.id);
      if (index !== -1) {
        carouselImages.value[index].is_active = newStatus;
      }
    } else {
      // Revert switch state on failure
      rowData.is_active = !newStatus;
      ElMessage.error(res.message || '状态更新失败');
    }
  } catch (error: any) {
    console.error(`Error updating status for image ${rowData.id}:`, error);
    // Revert switch state on failure
    rowData.is_active = !newStatus;
    ElMessage.error(error?.response?.data?.message || error.message || '状态更新失败');
  }
};

const handleSubmitForm = async () => {
  if (!imageFormRef.value) return;
  
  await imageFormRef.value.validate(async (valid) => {
    if (valid) {
      if (dialogMode.value === 'add' && !selectedFile.value) {
        ElMessage.warning('请选择要上传的图片文件。');
        return;
      }

      submitLoading.value = true;
      try {
        const formData = new FormData();
        
        // Append file only in add mode
        if (dialogMode.value === 'add' && selectedFile.value) {
          formData.append('imageFile', selectedFile.value);
        }

        // Append other fields, ensuring not to append null values
        if (currentImageForm.title) formData.append('title', currentImageForm.title);
        if (currentImageForm.link_url) formData.append('link_url', currentImageForm.link_url);
        formData.append('display_order', String(currentImageForm.display_order || 0));
        formData.append('is_active', String(!!currentImageForm.is_active));

        if (dialogMode.value === 'add') {
          const res = await addCarouselImage(formData);
          if (res.code === 201) {
            ElMessage.success('添加成功');
            dialogVisible.value = false;
            fetchCarouselImages(); // Refresh list
          } else {
            ElMessage.error(res.message || '添加失败');
          }
        } else if (currentImageForm.id) {
          // For edit, we don't send file, so we send a plain object, not FormData
          const updateData: CarouselImageData = {
            title: currentImageForm.title,
            link_url: currentImageForm.link_url,
            display_order: currentImageForm.display_order,
            is_active: currentImageForm.is_active,
          };
          const res = await updateCarouselImage(currentImageForm.id, updateData);
          if (res.code === 200) {
            ElMessage.success('更新成功');
            dialogVisible.value = false;
            fetchCarouselImages(); // Refresh list
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
    const res = await updateCarouselIntervalConfig({ carouselInterval: carouselInterval.value });
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>