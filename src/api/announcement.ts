import request from '@/utils/request';
import type { ApiResponse } from '@/types/common';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  is_pinned: number; // 0 or 1
  published_at: string; // Formatted date string e.g., '2024-05-20 10:00'
}

/**
 * Get the list of published announcements for the student portal.
 * @param params - Optional parameters like pagination.
 * @returns A promise with the list of announcements.
 */
export function getAnnouncements(params?: any): Promise<ApiResponse<Announcement[]>> {
  return request({
    url: '/announcements',
    method: 'get',
    params,
  });
}

// --- Admin Functions ---

export interface AdminAnnouncement extends Announcement {
  status: 'published' | 'draft';
  updated_at: string;
}

/**
 * [Admin] Get all announcements (including drafts).
 * @returns A promise with all announcements.
 */
export function getAllAnnouncementsAdmin(): Promise<ApiResponse<AdminAnnouncement[]>> {
  return request({
    url: '/announcements/all',
    method: 'get',
  });
}

/**
 * [Admin] Create a new announcement.
 * @param data - The announcement data to create.
 * @returns A promise with the created announcement.
 */
export function createAnnouncement(data: Partial<AdminAnnouncement>): Promise<ApiResponse<Announcement>> {
  return request({
    url: '/announcements',
    method: 'post',
    data,
  });
}

/**
 * [Admin] Update an existing announcement.
 * @param id - The ID of the announcement to update.
 * @param data - The new data for the announcement.
 * @returns A promise with the updated announcement.
 */
export function updateAnnouncement(id: number, data: Partial<AdminAnnouncement>): Promise<ApiResponse<Announcement>> {
  return request({
    url: `/announcements/${id}`,
    method: 'put',
    data,
  });
}

/**
 * [Admin] Delete an announcement.
 * @param id - The ID of the announcement to delete.
 * @returns A promise.
 */
export function deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
  return request({
    url: `/announcements/${id}`,
    method: 'delete',
  });
} 