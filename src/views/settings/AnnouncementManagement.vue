<template>
  <div class="announcement-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知管理</span>
          <el-button type="primary" :icon="Plus" @click="handleOpenDialog()">发布新通知</el-button>
        </div>
      </template>

      <el-table :data="announcements" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="250"></el-table-column>
        <el-table-column prop="author_name" label="发布者" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_pinned" label="是否置顶" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_pinned ? 'danger' : 'info'" effect="plain">
              {{ row.is_pinned ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="published_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.published_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="最后更新" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleOpenDialog(row)">编辑</el-button>
            <el-popconfirm title="确定要删除此通知吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" link :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入通知标题"></el-input>
        </el-form-item>
        <el-form-item label="发布者" prop="author_name">
          <el-input v-model="form.author_name" placeholder="例如：教务处"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <!-- Rich Text Editor -->
           <div class="editor-container">
             <Toolbar
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                mode="default"
              />
              <Editor
                style="height: 400px; overflow-y: hidden;"
                v-model="form.content"
                :defaultConfig="editorConfig"
                mode="default"
                @onCreated="handleCreated"
              />
           </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="published">发布</el-radio>
            <el-radio value="draft">存为草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="置顶" prop="is_pinned">
          <el-switch v-model="form.is_pinned"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount } from 'vue';
import { ElMessage, ElPopconfirm } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import {
  getAllAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/api/announcement';
import type { AdminAnnouncement } from '@/api/announcement';
import { uploadFile } from '@/api/user';
import dayjs from 'dayjs';

// Import WangEditor
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IEditorConfig, IToolbarConfig } from '@wangeditor/editor';


// --- Table and Data ---
const loading = ref(true);
const announcements = ref<AdminAnnouncement[]>([]);

const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const res = await getAllAnnouncementsAdmin();
    if (res.code === 200) {
      announcements.value = res.data;
    } else {
      ElMessage.error(res.message || '获取通知列表失败');
    }
  } catch (e: any) {
    ElMessage.error(e.message || '获取通知列表时发生网络错误');
  } finally {
    loading.value = false;
  }
};

// --- Dialog and Form ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const form = ref({
  id: null as number | null,
  title: '',
  content: '',
  author_name: '教务处',
  status: 'published' as 'published' | 'draft',
  is_pinned: false,
});

const rules: FormRules = {
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
  author_name: [{ required: true, message: '发布者不能为空', trigger: 'blur' }],
};

const handleOpenDialog = (row?: AdminAnnouncement) => {
  if (row) {
    dialogTitle.value = '编辑通知';
    // Deep copy the row to the form to avoid reactive changes on the table
    form.value = { ...row, is_pinned: !!row.is_pinned };
  } else {
    dialogTitle.value = '发布新通知';
    form.value = {
      id: null,
      title: '',
      content: '',
      author_name: '教务处',
      status: 'published',
      is_pinned: false,
    };
  }
  dialogVisible.value = true;
  // Reset validation state
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const dataToSend = {
            ...form.value,
            is_pinned: form.value.is_pinned ? 1 : 0,
        };

        if (form.value.id) {
          // Update existing announcement
          const { id, ...updateData } = dataToSend; // Exclude id from the payload for update
          const res = await updateAnnouncement(form.value.id, updateData);
          if (res.code === 200) {
            ElMessage.success('更新成功');
          } else {
            ElMessage.error(res.message || '更新失败');
          }
        } else {
          // Create new announcement
          const { id, ...createData } = dataToSend; // Exclude id for creation
          const res = await createAnnouncement(createData);
          if (res.code === 201) {
            ElMessage.success('发布成功');
          } else {
            ElMessage.error(res.message || '发布失败');
          }
        }
        dialogVisible.value = false;
        fetchAnnouncements(); // Refresh table
      } catch (e: any) {
        ElMessage.error(e.message || '操作失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleDelete = async (id: number) => {
  try {
    const res = await deleteAnnouncement(id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      fetchAnnouncements(); // Refresh table
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败');
  }
};


// --- Rich Text Editor ---
const editorRef = shallowRef();
const toolbarConfig: Partial<IToolbarConfig> = {};

// Custom upload function for the editor
type InsertFnType = (url: string, alt: string, href: string) => void;
const customUpload = async (file: File, insertFn: InsertFnType) => {
  try {
    const res = await uploadFile(file); // Pass the File object directly
    if (res.code === 200 && res.data.filePath) {
      const fullUrl = res.data.filePath.startsWith('http') ? res.data.filePath : `/api${res.data.filePath}`;
      insertFn(fullUrl, file.name, fullUrl);
      ElMessage.success('图片上传成功');
    } else {
      ElMessage.error(res.message || '图片上传失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '图片上传时发生错误');
  }
};


const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload/image', // This is just a placeholder, customUpload will be used
      customUpload: customUpload,
    },
  },
};

const handleCreated = (editor: any) => {
  editorRef.value = editor;
};

onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (editor == null) return;
    editor.destroy();
});

const formatDate = (val: string | null) => {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
};

// --- Lifecycle ---
onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped lang="scss">
.announcement-management-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      font-weight: bold;
      font-size: 18px;
    }
  }
}

/* Define light-mode border for editor container, using Element Plus variables for consistency */
.editor-container {
  border: 1px solid var(--el-border-color);
  z-index: 100;
}

/* 
  The default wangeditor style has a border-bottom on the toolbar.
  We'll override it here to ensure it uses the Element variable for light mode.
  The dark mode override is in dark-overrides.css
*/
.w-e-toolbar {
  border-bottom: 1px solid var(--el-border-color) !important;
}
</style>