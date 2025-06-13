/**
 * API 配置文件
 */

import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'

// API服务器地址
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
  return request.get<ApiResponse<RegexConfig>>('/config/regex')
    .catch(error => {
        console.error('[API config.ts] Error fetching regex config:', error);
        // 返回一个符合类型的错误响应，而不是抛出，避免上层调用中断
        return Promise.resolve({
            code: error.response?.status || 500,
            message: error.message || '获取配置失败',
            data: {
                studentIdRegex: '',
                employeeIdRegex: '',
                logRetentionDays: 0
            }
        });
    });
}

/**
 * 更新正则表达式配置
 * @param config 配置对象
 */
export const updateRegexConfig = (config: RegexConfig): Promise<ApiResponse<void>> => {
  return request.put<ApiResponse<void>>('/config/regex', config)
    .catch(error => {
      console.error('[API config.ts] Error updating regex config:', error);
      // 返回符合类型的错误响应
      return Promise.resolve({
        code: error.response?.status || 500,
        message: error.message || '更新配置失败',
        data: undefined
      });
    });
}

interface CarouselIntervalConfig {
  carouselInterval: number;
}

/**
 * 获取轮播图全局切换时间配置
 */
export const getCarouselIntervalConfig = (): Promise<ApiResponse<CarouselIntervalConfig>> => {
  return request.get<ApiResponse<CarouselIntervalConfig>>('/config/carousel-interval')
    .catch(error => {
      console.error('[API config.ts] Error fetching carousel interval config:', error);
      return Promise.resolve({
        code: error.response?.status || 500,
        message: error.message || '获取轮播图切换时间失败',
        data: { carouselInterval: 5000 } // Default to 5000ms on error
      });
    });
}

/**
 * 更新轮播图全局切换时间配置
 * @param config 包含 carouselInterval 的配置对象
 */
export const updateCarouselIntervalConfig = (config: CarouselIntervalConfig): Promise<ApiResponse<void>> => {
  return request.put<ApiResponse<void>>('/config/carousel-interval', config)
    .catch(error => {
      console.error('[API config.ts] Error updating carousel interval config:', error);
      return Promise.resolve({
        code: error.response?.status || 500,
        message: error.message || '更新轮播图切换时间失败',
        data: undefined
      });
    });
} 