import request from '@/utils/request'
import type { AxiosPromise } from 'axios'

// 定义轮播图项的接口
export interface CarouselImage {
  id: number
  imageUrl: string
  title?: string | null
  linkUrl?: string | null
  displayOrder: number
  isActive: boolean | number // boolean for frontend, number (0 or 1) for backend sometimes
  createdAt?: string
  updatedAt?: string
}

// 定义获取所有轮播图 (供管理后台使用) 的响应数据接口
interface CarouselListResponse {
  code: number
  data: CarouselImage[]
  message: string
}

// 定义获取单个轮播图的响应数据接口
interface CarouselDetailResponse {
  code: number
  data: CarouselImage
  message: string
}

// 定义上传/更新时可能用到的数据结构 (不含id，因为新增时没有，更新时通过URL传递)
export interface CarouselImageData {
  title?: string | null
  linkUrl?: string | null
  displayOrder?: number
  isActive?: boolean | number
  imageFile?: File // For new uploads
}

/**
 * 获取所有轮播图 (供管理后台使用)
 * @returns Promise<CarouselListResponse>
 */
export function getAllCarouselImages(): Promise<CarouselListResponse> {
  return request({
    url: 'api/carousel/all', // Added api/
    method: 'get'
  })
}

/**
 * 获取公开的、激活的轮播图 (供学生门户等前端使用)
 * @returns Promise<CarouselListResponse>
 */
export function getActiveCarouselImages(): Promise<CarouselListResponse> {
  return request({
    url: 'api/carousel', // Added api/
    method: 'get'
  })
}

/**
 * 添加新的轮播图
 * @param data FormData 包含 imageFile 和其他可选字段 (title, link_url, display_order, is_active)
 * @returns Promise<CarouselDetailResponse>
 */
export function addCarouselImage(data: FormData): Promise<CarouselDetailResponse> {
  return request({
    url: 'api/carousel/add', // Changed to include /add
    method: 'post',
    data,
  })
}

/**
 * 更新轮播图信息
 * @param id 轮播图ID
 * @param data 更新的数据，可以包含 title, link_url, display_order, is_active
 * @returns Promise<CarouselDetailResponse>
 */
export function updateCarouselImage(id: number, data: Partial<CarouselImageData>): Promise<CarouselDetailResponse> {
  return request({
    url: `api/carousel/${id}`, // Added api/
    method: 'put',
    data
  })
}

/**
 * 删除轮播图
 * @param id 轮播图ID
 * @returns Promise<any>
 */
export function deleteCarouselImage(id: number): Promise<any> {
  return request({
    url: `api/carousel/delete/${id}`, // Changed to include /delete
    method: 'delete'
  })
}

/**
 * 更新轮播图顺序
 * @param orderData 包含顺序更新信息的数组，例如 [{ id: 1, display_order: 0 }, { id: 2, display_order: 1 }]
 * @returns Promise<any>
 */
export function updateCarouselOrder(orderData: Array<{ id: number; display_order: number }>): Promise<any> {
  return request({
    url: 'api/carousel/order', // Added api/
    method: 'post',
    data: {
      order: orderData // 后端期望 { order: [...] }
    }
  })
}