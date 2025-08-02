import request from '@/utils/request';
import type { ApiResponse } from '@/types/common';

interface UploadResponseData {
  url: string; // 上传成功后的文件访问URL
  fileName: string; // 文件名
  // 其他可能的文件信息
}

/**
 * 通用文件上传函数
 * @param file 要上传的文件对象
 * @param module 业务模块目录，例如 "avatars", "assignments"
 * @returns 返回上传成功后的文件访问URL
 */
export const uploadFile = (file: File, module: string): Promise<ApiResponse<UploadResponseData>> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('module', module);

  console.log(`调用 uploadFile API, 文件: [${file.name}], 模块: ${module}`);

  return request.post<ApiResponse<UploadResponseData>>('/api/upload/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}; 