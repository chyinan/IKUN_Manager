/**
 * API 配置文件
 */

import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'

// API服务器地址
// 注意: 这个 apiUrl 变量可能在某些地方被直接使用，但 axios 实例的 baseURL 已经覆盖了其作为默认前缀的作用。
// 如果项目中有直接使用 apiUrl 拼接的地方，需要单独检查。
export const apiUrl = 'http://localhost:8081/api'; 

// 超时设置（毫秒）
export const timeout = 5000;

// 导出默认配置
export default {
  apiUrl,
  timeout
};

// 定义配置项接口
interface RegexConfig {
  studentIdRegex: string;
  employeeIdRegex: string;
  logRetentionDays?: number;
}

/**
 * 获取正则表达式配置
 */
export const getRegexConfig = (): Promise<ApiResponse<RegexConfig>> => {
  return request.get<ApiResponse<RegexConfig>>('api/config/regex').then(response => response.data) // 添加 api/
    .catch(error => {
        console.error('[API config.ts] Error fetching regex config:', error);
        // 直接抛出错误，让上层调用者（如 store 的 fetchAndSetConfig）处理
        throw error;
    });
}

/**
 * 更新正则表达式配置
 * @param config 配置对象
 */
export const updateRegexConfig = (config: RegexConfig): Promise<ApiResponse<void>> => {
  return request.put<ApiResponse<void>>('api/config/regex', config).then(response => response.data) // 添加 api/
    .catch(error => {
      console.error('[API config.ts] Error updating regex config:', error);
      throw error;
    });
}

interface CarouselIntervalConfig {
  carouselInterval: number;
}

/**
 * 获取轮播图全局切换时间配置
 */
export const getCarouselIntervalConfig = (): Promise<ApiResponse<CarouselIntervalConfig>> => {
  return request.get<ApiResponse<any>>('api/config/carousel-interval').then(response => response.data) // 添加 api/
    .catch(error => {
      console.error('[API config.ts] Error fetching carousel interval config:', error);
      throw error;
    });
}

/**
 * 更新轮播图全局切换时间配置
 * @param interval 轮播图切换时间（毫秒）
 */
export const updateCarouselIntervalConfig = (interval: number): Promise<ApiResponse<void>> => {
  return request.put<ApiResponse<void>>(
    'api/config/carousel-interval', 
    JSON.stringify(interval), // 将数字转换为JSON字符串
    { headers: { 'Content-Type': 'application/json' } } // 显式设置Content-Type
  )
    .then(response => response.data)
    .catch(error => {
      console.error('[API config.ts] Error updating carousel interval config:', error);
      throw error;
    });
} 