<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生信箱管理</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="threadList" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="主题" min-width="250" />
        <el-table-column prop="student_name" label="学生" width="150" align="center" />
        <el-table-column prop="status" label="状态" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
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
      
      <!-- Add pagination controls if needed in the future -->

    </el-card>

    <!-- Details/Reply Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="`对话详情: ${activeThread?.title}`"
      width="45%"
      @close="resetDialog"
      append-to-body
    >
      <div v-if="activeThread">
        <!-- Status Changer -->
        <div class="status-changer">
            <span>处理状态:</span>
            <el-select 
              v-model="activeThread.status" 
              placeholder="更新状态" 
              @change="handleStatusChange"
              style="margin-left: 10px;"
            >
                <el-option label="待处理" value="open"></el-option>
                <el-option label="受理中" value="in_progress"></el-option>
                <el-option label="已回复" value="replied"></el-option>
                <el-option label="已解决" value="resolved"></el-option>
                <el-option label="已拒绝" value="rejected"></el-option>
            </el-select>
        </div>

        <!-- Chat History -->
        <div class="chat-history" ref="chatHistoryRef">
            <div v-for="message in messageList" :key="message.id" class="message-item" :class="{'is-self': message.sender_role === 'admin'}">
                <el-avatar :size="40" :src="message.sender_avatar || defaultAvatar" class="avatar">
                    <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <div class="message-content">
                    <div class="message-header">
                        <span class="sender-info">
                            <span class="role-tag">{{ message.sender_role === 'student' ? '学生' : '管理员' }}</span>
                            <span class="sender">{{ message.sender_name }}</span>
                        </span>
                        <span class="time">{{ formatDateTime(message.create_time) }}</span>
                    </div>
                    <div class="bubble">{{ message.content }}</div>
                </div>
            </div>
        </div>
        
        <!-- Reply Form -->
        <div class="reply-form-container">
          <el-form @submit.prevent="handleReplySubmit" class="reply-form">
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="4"
                placeholder="在此输入回复内容..."
                :disabled="replying"
                class="reply-textarea"
              />
              <div class="dialog-footer">
                  <el-button @click="dialogVisible = false">取消</el-button>
                  <el-button type="primary" @click="handleReplySubmit" :loading="replying">
                      发送回复
                  </el-button>
              </div>
          </el-form>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { getAdminThreads, getMessagesInThread, replyToThread, updateThreadStatus } from '@/api/mailbox';
import type { MailboxThread, Message, ThreadStatus } from '@/api/mailbox';
import { ElMessage, ElNotification } from 'element-plus';
import { ChatDotRound, UserFilled } from '@element-plus/icons-vue';
import { formatDateTime } from '@/utils/date';
import defaultAvatar from '@/assets/default-avatar.png';

const loading = ref(true);
const threadList = ref<MailboxThread[]>([]);
const dialogVisible = ref(false);
const activeThread = ref<MailboxThread | null>(null);
const messageList = ref<Message[]>([]);
const replyContent = ref('');
const replying = ref(false);
const chatHistoryRef = ref<HTMLDivElement | null>(null);

const fetchThreads = async () => {
  loading.value = true;
  try {
    const { data } = await getAdminThreads();
    threadList.value = data;
  } catch (error) {
    console.error("Failed to fetch threads:", error);
    ElMessage.error("获取信箱列表失败");
  } finally {
    loading.value = false;
  }
};

const handleViewDetails = async (thread: MailboxThread) => {
  activeThread.value = thread;
  dialogVisible.value = true;
  try {
    const { data } = await getMessagesInThread(thread.id);
    messageList.value = data;
    scrollToBottom();
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    ElMessage.error("获取对话详情失败");
  }
};

const handleStatusChange = async (newStatus: ThreadStatus) => {
  if (!activeThread.value) return;
  try {
    await updateThreadStatus(activeThread.value.id, newStatus);
    ElNotification.success(`状态已更新为: ${formatStatus(newStatus)}`);
    // Refresh the main list to show the new status tag
    fetchThreads();
  } catch (error) {
    console.error("Failed to update status:", error);
    ElMessage.error("状态更新失败");
    // Revert the change in the UI on failure
    const originalThread = threadList.value.find(t => t.id === activeThread.value!.id);
    if (originalThread) {
        activeThread.value.status = originalThread.status;
    }
  }
};

const handleReplySubmit = async () => {
  if (!replyContent.value.trim() || !activeThread.value) {
    ElMessage.warning('回复内容不能为空');
    return;
  }
  replying.value = true;
  try {
    await replyToThread(activeThread.value.id, replyContent.value);
    ElNotification.success('回复发送成功');
    const { data } = await getMessagesInThread(activeThread.value.id);
    messageList.value = data;
    scrollToBottom();
    fetchThreads();
    replyContent.value = '';
  } catch (error) {
    console.error("Failed to post reply:", error);
    ElMessage.error("回复失败");
  } finally {
    replying.value = false;
  }
};

const resetDialog = () => {
  activeThread.value = null;
  messageList.value = [];
  replyContent.value = '';
};

const scrollToBottom = () => {
    nextTick(() => {
        const chatHistory = chatHistoryRef.value;
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    });
};

const getStatusTagType = (status: MailboxThread['status']) => {
  switch (status) {
    case 'open':
      return 'danger';
    case 'in_progress':
      return 'primary';
    case 'replied':
      return 'success';
    case 'resolved':
      return 'info';
    case 'rejected':
        return 'warning';
    default:
      return 'info';
  }
};

const formatStatus = (status: MailboxThread['status']) => {
  switch (status) {
    case 'open':
      return '待处理';
    case 'in_progress':
        return '受理中';
    case 'replied':
        return '已回复';
    case 'resolved':
      return '已解决';
    case 'rejected':
        return '已拒绝';
    default:
      return '未知';
  }
};

onMounted(() => {
  fetchThreads();
});
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.status-changer {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f4f4f5; /* Light mode background */
}

.chat-history {
  height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 20px;
  background-color: #fafafa;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
}

.message-item.is-self {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 10px;
}

.message-content {
  display: flex;
  flex-direction: column;
}

.message-item.is-self .message-content {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 5px;
}

.sender-info {
  font-size: 12px;
  color: #888;
}

.role-tag {
  font-weight: bold;
  margin-right: 5px;
}

.sender {
  font-weight: bold;
  margin-right: 10px;
}

.time {
  font-size: 12px;
  color: #aaa;
}

.bubble {
  padding: 10px 15px;
  border-radius: 15px;
  max-width: 400px;
  word-wrap: break-word;
  background-color: #ffffff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  color: #333;
}

.message-item.is-self .bubble {
  background-color: #dcf8c6;
}

.reply-form-container {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.dialog-footer {
  text-align: right;
  margin-top: 15px;
}
</style> 