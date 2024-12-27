// 部门相关的API接口封装
import request from "@/utils/request"
import type { DeptModel, ResultModel } from "./model/model"

// 获取所有部门列表
export const queryAllApi = () => request.get<any, ResultModel>('/depts')

// 添加新部门
export const addApi = (dept:DeptModel) => request.post<any, ResultModel>('/depts', dept)

// 根据ID查询部门信息
export const queryInfoApi = (id:number) => request.get(`/depts/${id}`)

// 更新部门信息
export const updateApi = (dept:DeptModel) => request.put<any, ResultModel>('/depts', dept)

// 删除指定部门
export const deleteApi = (id:number) => request.delete<any, ResultModel>(`/depts?id=${id}`)