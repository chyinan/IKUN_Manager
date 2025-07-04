// src/api/subject.ts
import request from '@/utils/request';
import type { ApiResponse } from '@/types/response';
import type { SubjectInfo } from '@/types/subject';

/**
 * 获取所有科目的列表
 */
export const getSubjectList = (): Promise<ApiResponse<SubjectInfo[]>> => {
  return request({
    url: '/api/subject/list', // 确保路径正确
    method: 'get',
  });
};

/**
 * 添加新科目
 * @param data - 科目信息 { subject_name: string, subject_code?: string }
 */
export const addSubject = (data: { subject_name: string; subject_code?: string }): Promise<ApiResponse<SubjectInfo>> => {
  return request({
    url: '/api/subject/add', // 确保路径正确
    method: 'post',
    data,
  });
};

/**
 * 更新科目信息
 * @param id - 科目ID
 * @param data - 需要更新的科目信息
 */
export const updateSubject = (id: number, data: { subject_name: string; subject_code?: string }): Promise<ApiResponse<SubjectInfo>> => {
  return request({
    url: `/api/subject/update/${id}`, // 确保路径正确
    method: 'put',
    data,
  });
};

/**
 * 删除科目
 * @param id - 科目ID
 */
export const deleteSubject = (id: number): Promise<ApiResponse<null>> => {
  return request({
    url: `/api/subject/delete/${id}`, // 确保路径正确
    method: 'delete',
  });
};
