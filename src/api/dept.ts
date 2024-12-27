import request from "@/utils/request"
import type { DeptModel, ResultModel } from "./model/model"

//列表查询
export const queryAllApi = () => request.get<any, ResultModel>('/depts')

//添加部门
export const addApi = (dept:DeptModel) => request.post<any, ResultModel>('/depts', dept)

//根据ID查询
export const queryInfoApi = (id:number) => request.get(`/depts/${id}`)

//修改部门
export const updateApi = (dept:DeptModel) => request.put<any, ResultModel>('/depts', dept)

//删除部门
export const deleteApi = (id:number) => request.delete<any, ResultModel>(`/depts?id=${id}`)