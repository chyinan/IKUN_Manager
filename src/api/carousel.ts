import request from '@/utils/request';
import type { ApiResponse } from '@/types/common';

// 定义轮播图项的接口
export interface CarouselImage {
  id: number;
  imageUrl: string;
  title?: string | null;
  linkUrl?: string | null;
  displayOrder: number;
  isActive: boolean | number; // boolean for frontend, number (0 or 1) for backend sometimes
  createdAt?: string;
  updatedAt?: string;
}

// 定义上传/更新时可能用到的数据结构 (不含id，因为新增时没有，更新时通过URL传递)
export interface CarouselImageData {
  title?: string | null;
  linkUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean | number;
  imageFile?: File; // For new uploads
}

/**
 * 获取所有轮播图 (供管理后台使用)
 */
export function getAllCarouselImages(): Promise<ApiResponse<CarouselImage[]>> {
  return request.get<ApiResponse<CarouselImage[]>>('api/carousel/all');
}

/**
 * 获取公开的、激活的轮播图 (供学生门户等前端使用)
 */
export function getActiveCarouselImages(): Promise<ApiResponse<CarouselImage[]>> {
  return request.get<ApiResponse<CarouselImage[]>>('api/carousel');
}

/**
 * 添加新的轮播图
 * @param data FormData 包含 imageFile 和其他可选字段 (title, link_url, display_order, is_active)
 */
export function addCarouselImage(data: FormData): Promise<ApiResponse<CarouselImage>> {
  return request.post<ApiResponse<CarouselImage>>('api/carousel/add', data);
}

/**
 * 更新轮播图信息
 * @param id 轮播图ID
 * @param data 更新的数据，可以包含 title, link_url, display_order, is_active
 */
export function updateCarouselImage(id: number, data: Partial<CarouselImageData>): Promise<ApiResponse<CarouselImage>> {
  return request.put<ApiResponse<CarouselImage>>(`api/carousel/${id}`, data);
}

/**
 * 删除轮播图
 * @param id 轮播图ID
 */
export function deleteCarouselImage(id: number): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>(`api/carousel/delete/${id}`);
}

/**
 * 更新轮播图顺序
 * @param orderData 包含顺序更新信息的数组，例如 [{ id: 1, display_order: 0 }, { id: 2, display_order: 1 }]
 */
export function updateCarouselOrder(orderData: Array<{ id: number; display_order: number }>): Promise<ApiResponse<void>> {
  return request.post<ApiResponse<void>>('api/carousel/order', { order: orderData });
}