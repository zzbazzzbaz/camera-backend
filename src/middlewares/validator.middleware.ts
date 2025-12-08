import { Request, Response, NextFunction } from 'express'
import { ApiResponse, ErrorCode } from '../utils/response'

type PayloadSource = 'body' | 'query' | 'params'

export interface FieldRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean'
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)

// 简单参数校验：必填 + 基础类型校验（可选 number 自动转换）
export const validateFields =
  (rules: FieldRule[], source: PayloadSource = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const payloadSource = (
      req as Request & Record<PayloadSource, Record<string, unknown> | undefined>
    )[source]
    const payload = payloadSource ?? {}

    const missingFields = rules
      .filter(rule => rule.required !== false)
      .filter(rule => isEmpty(payload[rule.field]))
      .map(rule => rule.field)

    if (missingFields.length > 0) {
      return ApiResponse.error(
        res,
        ErrorCode.BAD_REQUEST,
        `缺少必填参数: ${missingFields.join(', ')}`
      )
    }

    for (const rule of rules) {
      const value = payload[rule.field]
      if (isEmpty(value) || !rule.type) continue

      if (rule.type === 'number' && typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value)
        if (!Number.isNaN(parsed)) {
          payload[rule.field] = parsed
          continue
        }
      }

      if (typeof value !== rule.type) {
        return ApiResponse.error(
          res,
          ErrorCode.BAD_REQUEST,
          `参数类型错误: ${rule.field} 应为 ${rule.type}`
        )
      }
    }

    next()
  }
