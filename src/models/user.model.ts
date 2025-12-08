import { User } from '@prisma/client'
import { prisma } from '../utils/prisma'

// users 表（docs/05_数据库设计.md §2.1）：user_id 作为 PK，openid 唯一，union_id/nickname/avatar_url 可空，时间戳由数据库默认值维护
export type UserRow = User

export interface CreateUserParams {
  user_id: string
  openid: string
  union_id?: string | null
  nickname?: string | null
  avatar_url?: string | null
}

// 主键查用户
export const findUserById = async (userId: string): Promise<UserRow | null> => {
  return prisma.user.findUnique({ where: { user_id: userId } })
}

// openid 查用户（利用 idx_openid 唯一索引）
export const findUserByOpenId = async (openid: string): Promise<UserRow | null> => {
  return prisma.user.findUnique({ where: { openid } })
}

// 创建用户，表定义的可空字段默认写入 NULL，时间字段由数据库默认值生成
export const createUser = async (params: CreateUserParams): Promise<UserRow> => {
  const { user_id, openid, union_id = null, nickname = null, avatar_url = null } = params
  return prisma.user.create({
    data: { user_id, openid, union_id, nickname, avatar_url }
  })
}

// 更新用户基础信息
export const updateUserProfile = async (
  userId: string,
  nickname: string | null,
  avatarUrl: string | null
): Promise<UserRow> => {
  return prisma.user.update({
    where: { user_id: userId },
    data: { nickname, avatar_url: avatarUrl }
  })
}
