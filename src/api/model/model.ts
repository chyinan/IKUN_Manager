// 统一接口响应模型
export interface ResultModel {
  code: number, // 状态码
  msg: string,  // 消息
  data: any     // 数据
}

// 分页查询结果模型
export interface PageModel {
  total: number,  // 总记录数
  rows: any[]     // 数据行
}

//统一响应结果接口
export interface PageResultModel {
  code: number,
  msg: string,
  data: PageModel
}

//分页参数接口
export interface PaginationParam {
  currentPage: number,
  pageSize: number,
  total: number
}



// ----------------------- 部门数据相关接口及类型 ---------------------
// 部门相关模型
export interface DeptModel {
  id?: number,
  name: string,        // 部门名称
  updateTime?: string  // 更新时间
}

//部门数据数组
export type DeptModelArray = DeptModel[]


// --------------------- 员工数据相关接口及类型 ---------------------
//员工搜索条件接口
export interface SearchEmpModel {
  name: string, //姓名
  gender: string, //性别
  begin: string, //开始时间
  end: string, //结束时间
  date: string[] //时间范围
}

//员工工作经历数据接口
export interface EmpExprModel {
  id?: number,
  empId?: number,
  exprDate: string[], //时间范围
  begin: string,
  end: string,
  company: string,
  job: string
}

// 员工相关模型
export interface EmpModel {
  id?: number,
  name: string,      // 员工姓名 
  address: string,   // 地址
  time: string       // 入职时间
}

//员工数据数组
export type EmpModelArray = EmpModel[]


//-------------------------------- 登录 ---------------
//登录表单信息
export interface LoginEmp {
  username?: string,
  password?: string
}

//登录成功返回信息
export interface LoginInfo {
  id?: number,
  name?: string,
  username?: string,
  token?: string
}

//--------------------- 日志 ------------------------
export interface LogModel {
  id?: number,
  operateEmpId: number,
  operateTime: string,
  className: string,
  methodName: string,
  methodParams: string,
  returnValue: string,
  costTime: number,
  operateEmpName: string
}


//日志数据数组
export type LogModelArray = LogModel[]



//-- --------------------------------- 班级管理相关接口 ---------------------------
//班级搜索条件接口
export interface SearchClazzModel {
  name: string, //姓名
  begin: string, //开始时间
  end: string, //结束时间
  date: string[] //时间范围
}

//班级数据接口
export interface ClazzModel {
  id: string,
  name: string,
  room: string,
  beginDate: string,
  endDate: string,
  subject: string, 
  masterId: string,
  masterName?: string
}

//班级数据数组
export type ClazzModelArray = ClazzModel[]


//-- --------------------------------- 学生管理相关接口 ---------------------------
//学生搜索条件接口
export interface SearchStuModel {
  clazzId: string, //班级
  degree: string, //学历
  name: string //姓名
}

//学生数据接口
export interface StuModel {
  id?: string,
  name: string,
  no: string,
  gender: string,
  phone: string,
  idCard: string,
  isCollege: string,
  address: string,
  degree: string,
  graduationDate: string,
  clazzId: string,
  violationCount?: number,
  violationScore?: number
  clazzName?: string
}

//学生数据数组
export type StuModelArray = StuModel[]

