// 返回东八区当前时间（UTC+8），用于写库和返回时间字段
export const nowCST = (): Date => {
  const offsetMs = 8 * 60 * 60 * 1000
  return new Date(Date.now() + offsetMs)
}
