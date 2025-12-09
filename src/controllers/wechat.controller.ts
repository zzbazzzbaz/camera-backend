import { Request, Response } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { ApiResponse, ErrorCode } from '../utils/response'
import { createUser, findUserByOpenId, updateUserProfile } from '../models/user.model'

interface WechatSessionResponse {
  openid?: string
  unionid?: string
  session_key?: string
  errcode?: number
  errmsg?: string
}

// POST /api/wechat/login - code换取openid，查找/创建用户并返回JWT
export const wechatLogin = async (req: Request, res: Response) => {
  const { code, nickname, avatar_url } = req.body || {}

  if (!code || typeof code !== 'string') {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'code不能为空')
  }

  const appid = process.env.WECHAT_APPID
  const secret = process.env.WECHAT_SECRET

  if (!appid || !secret) {
    return ApiResponse.error(res, ErrorCode.SERVER_ERROR, '微信配置缺失')
  }

  try {
    const wxResp = await axios.get<WechatSessionResponse>(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        params: {
          appid,
          secret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      }
    )

    // 打印微信接口返回的完整响应对象
    console.log('微信登录响应:', JSON.stringify(wxResp.data, null, 2))

    const wxData = wxResp.data

    if (wxData.errcode) {
      return ApiResponse.error(res, ErrorCode.BAD_REQUEST, wxData.errmsg || '微信登录失败')
    }

    if (!wxData.openid) {
      return ApiResponse.error(res, ErrorCode.BAD_REQUEST, '未获取到 openid')
    }

    let user = await findUserByOpenId(wxData.openid)

    if (!user) {
      const userId = uuidv4().replace(/-/g, '')
      user = await createUser({
        user_id: userId,
        openid: wxData.openid,
        union_id: wxData.unionid ?? null,
        nickname: nickname ?? null,
        avatar_url: avatar_url ?? null
      })
    } else if (nickname || avatar_url) {
      user = await updateUserProfile(
        user.user_id,
        nickname ?? user.nickname ?? null,
        avatar_url ?? user.avatar_url ?? null
      )
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return ApiResponse.error(res, ErrorCode.SERVER_ERROR, 'JWT 配置缺失')
    }

    const expiresInSeconds = 7 * 24 * 60 * 60 // 7天
    const token = jwt.sign({ userId: user.user_id }, jwtSecret, { expiresIn: expiresInSeconds })

    return ApiResponse.success(res, {
      token,
      expires_in: expiresInSeconds,
      user
    })
  } catch (error) {
    console.error('微信登录失败', error)
    return ApiResponse.error(res, ErrorCode.SERVER_ERROR, '微信登录失败')
  }
}
