import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'

interface UploadResponseData {
  url: string; // 上传成功后的文件访问URL
  fileName: string; // 文件名
  // 其他可能的文件信息
}

/**
 * 获取系统配置
 */
export function getConfig() {
    return request({
        url: '/config/get',
        method: 'get'
    });
}

/**
 * 保存系统配置
 * @param data 
 */
export function saveConfig(data: any) {
    return request({
        url: '/config/save',
        method: 'post',
        data
    })
}

/**
 * 通用文件上传函数
 * @param file 要上传的文件对象
 * @param module 业务模块目录，例如 "avatars", "assignments"
 * @returns 返回上传成功后的文件访问URL
 */
export async function uploadFile(file: File, module: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('module', module);

  console.log(`调用 uploadFile API, 文件: [${file.name}], 模块: ${module}`);

  // 注意：直接返回 response.data，即URL字符串
  const response = await request<any>({ // 返回类型暂时用any，因为request工具的定义问题
    url: '/api/upload/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data; // 直接返回URL字符串
} 