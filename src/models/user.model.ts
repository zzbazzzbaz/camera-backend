import { User } from '@prisma/client'
import { prisma } from '../utils/prisma'

/**
 * 用户模型 - 对应 users 表
 *
 * 表结构说明（参考 docs/05_数据库设计.md §2.1）：
 * - user_id: 主键，UUID格式
 * - openid: 微信用户唯一标识，有唯一索引 idx_openid
 * - union_id: 微信开放平台统一ID，可空
 * - nickname: 用户昵称，可空
 * - avatar_url: 用户头像URL，可空
 * - created_at: 创建时间，数据库自动维护
 * - updated_at: 更新时间，数据库自动维护
 *
 * 业务场景：
 * - 微信登录时通过 openid 查询或创建用户
 * - JWT Token 中存储 user_id 用于身份验证
 */
export type UserRow = User

/**
 * 创建用户参数接口
 */
export interface CreateUserParams {
  user_id: string // UUID格式的用户ID
  openid: string // 微信openid，必填
  union_id?: string | null // 微信unionid，可选
  nickname?: string | null // 用户昵称，可选
  avatar_url?: string | null // 头像URL，可选
}

/**
 * 根据用户ID查询用户
 * @param userId - 用户ID（主键）
 * @returns 用户记录或null
 */
export const findUserById = async (userId: string): Promise<UserRow | null> => {
  return prisma.user.findUnique({ where: { user_id: userId } })
}

/**
 * 根据微信openid查询用户
 * @param openid - 微信openid
 * @returns 用户记录或null
 * @description 利用 idx_openid 唯一索引，查询性能优化
 */
export const findUserByOpenId = async (openid: string): Promise<UserRow | null> => {
  return prisma.user.findUnique({ where: { openid } })
}

/**
 * 创建新用户
 * @param params - 用户创建参数
 * @returns 新创建的用户记录
 * @description
 * - 可空字段默认写入 NULL
 * - created_at/updated_at 由数据库默认值自动生成
 * - 用于微信登录时首次创建用户
 */
export const createUser = async (params: CreateUserParams): Promise<UserRow> => {
  const { user_id, openid, union_id = null, nickname = null, avatar_url = null } = params
  return prisma.user.create({
    data: { user_id, openid, union_id, nickname, avatar_url }
  })
}

/**
 * 更新用户基础信息
 * @param userId - 用户ID
 * @param nickname - 新昵称
 * @param avatarUrl - 新头像URL
 * @returns 更新后的用户记录
 * @description 用于用户修改个人资料场景
 */
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
