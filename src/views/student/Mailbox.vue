<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的信箱</span>
          <el-button type="primary" :icon="EditPen" @click="handleOpenNewThreadDialog">
            发起新建议
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="threadList" border stripe>
        <el-table-column prop="title" label="主题" min-width="250" />
        <el-table-column prop="status" label="状态" width="150" align="center">
          <template #default="{ row }">
            <el-badge :is-dot="row.unread_count > 0" class="status-badge">
              <el-tag :type="getStatusTagType(row.status)">
                {{ formatStatus(row.status) }}
              </el-tag>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column prop="last_reply_at" label="最后更新" width="180" align="center" />
        <el-table-column prop="created_at" label="发起时间" width="180" align="center" />

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetails(row)">
               <el-icon><ChatDotRound /></el-icon>
              查看/回复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Details/Reply Dialog -->
    <el-dialog
      v-model="detailsDialogVisible"
      :title="`对话详情: ${activeThread?.title}`"
      width="45%"
      @close="resetDetailsDialog"
      append-to-body
    >
      <div class="chat-history" ref="chatHistoryRef">
        <div v-for="message in messageList" :key="message.id" class="message-item" :class="{'is-self': message.sender_role === 'student'}">
          <el-avatar :size="40" :src="message.sender_avatar" class="avatar">
             <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <div class="message-content">
            <div class="sender-info">
              <span class="name">{{ message.sender_name }}</span>
              <span class="time">{{ message.created_at }}</span>
            </div>
            <div class="bubble">{{ message.content }}</div>
          </div>
        </div>
      </div>
      <el-form @submit.prevent="handleReplySubmit" class="reply-form">
        <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="在此输入回复内容..." :disabled="replying" />
        <div class="dialog-footer" style="text-align: right; margin-top: 15px;">
          <el-button @click="detailsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleReplySubmit" :loading="replying">发送回复</el-button>
        </div>
      </el-form>
    </el-dialog>

    <!-- New Thread Dialog -->
    <el-dialog
      v-model="newThreadDialogVisible"
      title="发起新建议"
      width="40%"
      @close="resetNewThreadDialog"
      append-to-body
    >
      <el-form :model="newThreadForm" ref="newThreadFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="newThreadForm.title" placeholder="请输入建议的标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="newThreadForm.content" type="textarea" :rows="6" placeholder="请详细描述您的建议或问题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newThreadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleNewThreadSubmit" :loading="creating">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from 'vue';
import { getStudentThreads, getMessages, createThread, postReply } from '@/api/mailbox';
import type { Thread, Message, CreateThreadData } from '@/api/mailbox';
import { ElMessage, ElNotification, FormInstance } from 'element-plus';
import { EditPen, ChatDotRound, UserFilled } from '@element-plus/icons-vue';

const loading = ref(true);
const threadList = ref<Thread[]>([]);
const detailsDialogVisible = ref(false);
const newThreadDialogVisible = ref(false);

const activeThread = ref<Thread | null>(null);
const messageList = ref<Message[]>([]);
const replyContent = ref('');
const replying = ref(false);
const creating = ref(false);

const newThreadFormRef = ref<FormInstance>();
const newThreadForm = reactive<CreateThreadData>({
  title: '',
  content: '',
});

const chatHistoryRef = ref<HTMLDivElement | null>(null);

const fetchThreads = async () => {
  loading.value = true;
  try {
    const { data } = await getStudentThreads();
    threadList.value = data;
  } catch (error) {
    ElMessage.error("获取消息列表失败");
  } finally {
    loading.value = false;
  }
};

const handleViewDetails = async (thread: Thread) => {
  activeThread.value = thread;
  detailsDialogVisible.value = true;
  try {
    const { data } = await getMessages(thread.id);
    messageList.value = data;
    scrollToBottom();
    // Refresh list to clear unread dot
    fetchThreads();
  } catch (error) {
    ElMessage.error("获取对话详情失败");
  }
};

const handleReplySubmit = async () => {
  if (!replyContent.value.trim() || !activeThread.value) {
    return;
  }
  replying.value = true;
  try {
    await postReply(activeThread.value.id, { content: replyContent.value });
    const { data } = await getMessages(activeThread.value.id);
    messageList.value = data;
    scrollToBottom();
    fetchThreads();
    replyContent.value = '';
  } catch (error) {
    ElMessage.error("回复失败");
  } finally {
    replying.value = false;
  }
};

const handleOpenNewThreadDialog = () => {
  newThreadDialogVisible.value = true;
};

const handleNewThreadSubmit = async () => {
  if (!newThreadForm.title.trim() || !newThreadForm.content.trim()) {
    ElMessage.warning('标题和内容均不能为空');
    return;
  }
  creating.value = true;
  try {
    await createThread(newThreadForm);
    ElNotification.success('您的建议已成功发送！');
    newThreadDialogVisible.value = false;
    fetchThreads();
  } catch (error) {
    ElMessage.error("发送失败，请稍后重试");
  } finally {
    creating.value = false;
  }
};

const resetDetailsDialog = () => {
  activeThread.value = null;
  messageList.value = [];
  replyContent.value = '';
};

const resetNewThreadDialog = () => {
  newThreadFormRef.value?.resetFields();
  newThreadForm.title = '';
  newThreadForm.content = '';
};

const scrollToBottom = () => {
    nextTick(() => {
        chatHistoryRef.value?.scrollTo({ top: chatHistoryRef.value.scrollHeight, behavior: 'smooth' });
    });
};

const getStatusTagType = (status: Thread['status']) => {
  switch (status) {
    case 'open': return 'primary';
    case 'replied_by_student': return 'warning';
    case 'replied_by_admin': return 'success';
    case 'closed': return 'info';
    default: return 'info';
  }
};

const formatStatus = (status: Thread['status']) => {
  switch (status) {
    case 'open': return '待回复';
    case 'replied_by_student': return '已追问';
    case 'replied_by_admin': return '老师已回复';
    case 'closed': return '已关闭';
    default: return '未知';
  }
};

onMounted(fetchThreads);
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-badge {
  margin-top: 10px;
}
.chat-history {
    height: 400px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #ebeef5;
    margin-bottom: 20px;
    border-radius: 4px;
    background-color: #f9f9f9;
}
.message-item {
    display: flex;
    margin-bottom: 15px;
}
.message-item .avatar {
    margin-right: 10px;
}
.message-content {
    display: flex;
    flex-direction: column;
}
.sender-info {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}
.sender-info .name {
    font-weight: bold;
    margin-right: 8px;
}
.sender-info .time {
    font-size: 12px;
    color: #999;
}
.bubble {
    background-color: #ffffff;
    padding: 10px 15px;
    border-radius: 15px;
    max-width: 100%;
    word-wrap: break-word;
    border: 1px solid #e5e5e5;
}
.message-item.is-self {
    flex-direction: row-reverse;
}
.message-item.is-self .avatar {
    margin-left: 10px;
    margin-right: 0;
}
.message-item.is-self .message-content {
    align-items: flex-end;
}
.message-item.is-self .bubble {
    background-color: #e1f3ff;
    border-color: #b3d8ff;
}
</style> 