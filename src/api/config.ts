/**
 * API 配置文件
 */

import request from '@/utils/request'

// API服务器地址
export const apiUrl = 'http://localhost:3000/api';

// 超时设置（毫秒）
export const timeout = 5000;

// 导出默认配置
export default {
  apiUrl,
  timeout
};

// 获取正则表达式配置
export function getRegexConfig() {
  return request({
    url: '/config/regex',
    method: 'get'
  })
}

// 更新正则表达式配置
export function updateRegexConfig(data: { studentIdRegex: string, employeeIdRegex: string }) {
  return request({
    url: '/config/regex',
    method: 'put',
    data
  })
} 