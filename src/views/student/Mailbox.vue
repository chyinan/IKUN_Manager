<template>
  <div class="mailbox-container">
    <el-card shadow="never">
      <div v-if="!selectedThreadId" class="thread-list-view">
        <div class="list-header">
          <h2>我的信箱</h2>
          <el-button type="primary" :icon="Edit" @click="openNewThreadDialog">发起新对话</el-button>
        </div>
        <el-table :data="threads" v-loading="loading" empty-text="您还没有任何对话记录">
          <el-table-column prop="title" label="主题" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'closed' ? 'info' : (row.last_replier_role === 'admin' ? 'success' : 'warning')">
                {{ row.last_replier_role === 'admin' ? '已回复' : '待回复' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_replier_name" label="最新回复" width="150" />
          <el-table-column prop="update_time" label="更新时间" width="180">
             <template #default="{ row }">
              {{ formatTime(row.update_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link @click="selectThread(row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="thread-detail-view">
        <el-page-header @back="selectedThreadId = null" :content="selectedThread?.title || '对话详情'" />
        <div class="messages-area" ref="messagesAreaRef">
          <div v-for="message in messages" :key="message.id" class="message" :class="{ 'my-message': message.sender_user_id === userStore.userInfo?.id }">
            <el-avatar :src="message.sender_avatar" :icon="UserFilled" size="small" />
            <div class="message-content">
              <div class="message-sender">{{ message.sender_name }} <span class="message-time">{{ formatTime(message.create_time) }}</span></div>
              <div class="message-bubble" v-html="message.content"></div>
            </div>
          </div>
        </div>
        <div class="reply-area">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="4"
            placeholder="在此输入您的回复..."
            :disabled="replying"
          />
          <el-button type="primary" @click="sendReply" :loading="replying" style="margin-top: 10px;">发送回复</el-button>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="newThreadDialogVisible" title="发起新对话" width="50%">
      <el-form :model="newThreadForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="newThreadForm.title" placeholder="请输入对话标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newThreadForm.content" type="textarea" :rows="6" placeholder="请输入您想咨询或建议的内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newThreadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewThread" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { getStudentThreads, getMessagesInThread, createThread, replyToThread, type MailboxThread, type Message } from '@/api/mailbox';
import { ElMessage } from 'element-plus';
import { Edit, UserFilled } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const userStore = useUserStore();
const loading = ref(false);
const threads = ref<MailboxThread[]>([]);
const selectedThreadId = ref<number | null>(null);
const selectedThread = ref<MailboxThread | null>(null);

const messages = ref<Message[]>([]);
const messagesAreaRef = ref<HTMLElement | null>(null);

const newThreadDialogVisible = ref(false);
const submitting = ref(false);
const newThreadForm = reactive({
  title: '',
  content: '',
});

const replyContent = ref('');
const replying = ref(false);

const formatTime = (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss');

const fetchThreads = async () => {
  loading.value = true;
  try {
    const res = await getStudentThreads();
    if (res.code === 200) {
      threads.value = res.data;
    } else {
      ElMessage.error(res.message || '获取对话列表失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，无法获取对话列表');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const selectThread = async (threadId: number) => {
  selectedThreadId.value = threadId;
  selectedThread.value = threads.value.find(t => t.id === threadId) || null;
  loading.value = true;
  try {
    const res = await getMessagesInThread(threadId);
    if (res.code === 200) {
      messages.value = res.data;
      await nextTick();
      if (messagesAreaRef.value) {
        messagesAreaRef.value.scrollTop = messagesAreaRef.value.scrollHeight;
      }
    } else {
      ElMessage.error(res.message || '获取对话详情失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，无法获取对话详情');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openNewThreadDialog = () => {
  newThreadForm.title = '';
  newThreadForm.content = '';
  newThreadDialogVisible.value = true;
};

const submitNewThread = async () => {
  if (!newThreadForm.title.trim() || !newThreadForm.content.trim()) {
    ElMessage.warning('标题和内容不能为空');
    return;
  }
  submitting.value = true;
  try {
    const res = await createThread(newThreadForm.title, newThreadForm.content);
    if (res.code === 201) {
      ElMessage.success('发起成功');
      newThreadDialogVisible.value = false;
      await fetchThreads();
      selectThread(res.data.id);
    } else {
      ElMessage.error(res.message || '发起新对话失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，无法发起新对话');
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

const sendReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('回复内容不能为空');
    return;
  }
  if (!selectedThreadId.value) return;

  replying.value = true;
  try {
    const res = await replyToThread(selectedThreadId.value, replyContent.value);
    if (res.code === 201) {
      replyContent.value = '';
      messages.value.push(res.data);
       await nextTick();
      if (messagesAreaRef.value) {
        messagesAreaRef.value.scrollTop = messagesAreaRef.value.scrollHeight;
      }
      // Refresh thread list in background to update status
      fetchThreads();
    } else {
      ElMessage.error(res.message || '回复失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，无法发送回复');
    console.error(error);
  } finally {
    replying.value = false;
  }
};

onMounted(fetchThreads);
</script>

<style scoped lang="scss">
.mailbox-container {
  padding: 20px;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.thread-detail-view {
  .el-page-header {
    margin-bottom: 20px;
  }
  .messages-area {
    height: 400px;
    overflow-y: auto;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 20px;
    background-color: #f5f7fa;

    .message {
      display: flex;
      margin-bottom: 15px;

      .message-content {
        margin-left: 10px;
        .message-sender {
          font-size: 12px;
          color: #909399;
          margin-bottom: 5px;
          .message-time {
            margin-left: 8px;
          }
        }
        .message-bubble {
          background-color: #ffffff;
          padding: 10px 15px;
          border-radius: 15px;
          display: inline-block;
          max-width: 100%;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }

      &.my-message {
        flex-direction: row-reverse;
        .message-content {
          margin-left: 0;
          margin-right: 10px;
          text-align: right;
           .message-bubble {
             background-color: #a0cfff;
             text-align: left;
           }
        }
      }
    }
  }
}
</style> 