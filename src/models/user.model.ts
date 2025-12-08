import { User } from '@prisma/client'
import { prisma } from '../utils/prisma'

export type UserRow = User

export interface CreateUserParams {
  user_id: string
  openid: string
  union_id?: string | null
  nickname?: string | null
  avatar_url?: string | null
}

export const findUserById = async (userId: string): Promise<UserRow | null> => {
  return prisma.user.findUnique({ where: { user_id: userId } })
}

export const findUserByOpenId = async (openid: string): Promise<UserRow | null> => {
  return prisma.user.findUnique({ where: { openid } })
}

export const createUser = async (params: CreateUserParams): Promise<UserRow> => {
  const { user_id, openid, union_id = null, nickname = null, avatar_url = null } = params
  return prisma.user.create({
    data: { user_id, openid, union_id, nickname, avatar_url }
  })
}

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
