import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'

interface UploadResponseData {
  url: string; // 上传成功后的文件访问URL
  fileName: string; // 文件名
  // 其他可能的文件信息
}

/**
 * 通用文件上传函数
 * @param file 要上传的文件对象
 * @param moduleName 可选，指定文件所属的模块，用于后端存储分类 (例如: 'avatars', 'assignment_attachments')
 * @returns Promise<ApiResponse<UploadResponseData>> 包含文件URL等信息
 */
export const uploadFile = (file: File, moduleName?: string): Promise<ApiResponse<UploadResponseData>> => {
  console.log(`调用 uploadFile API, 文件: ${file.name}, 模块: ${moduleName || '通用'}`)
  const formData = new FormData()
  formData.append('file', file)
  if (moduleName) {
    formData.append('moduleName', moduleName)
  }

  return request.post<ApiResponse<UploadResponseData>>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 文件上传可能需要较长时间，设置超时时间
  })
    .catch(error => {
      console.error('uploadFile API 异常:', error)
      if (error.response && error.response.data) {
        // 如果后端返回了具体的错误信息，抛出它
        throw error.response.data
      }
      throw error // 否则抛出原始错误
    })
} 