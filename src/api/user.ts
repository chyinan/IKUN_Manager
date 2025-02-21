import request from '@/utils/request'

// 修改密码API
export const updatePassword = (data: {
  username: string
  oldPassword: string
  newPassword: string
}) => {
  return request({
    url: '/user/updatePassword',
    method: 'post',
    data
  })
}