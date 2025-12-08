import OSS from 'ali-oss'

let cachedClient: OSS | null = null

const getClient = (): OSS => {
  if (cachedClient) return cachedClient

  const { OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_ENDPOINT } =
    process.env

  if (!OSS_REGION || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET) {
    throw new Error('OSS 配置缺失')
  }

  cachedClient = new OSS({
    region: OSS_REGION,
    accessKeyId: OSS_ACCESS_KEY_ID,
    accessKeySecret: OSS_ACCESS_KEY_SECRET,
    bucket: OSS_BUCKET,
    endpoint: OSS_ENDPOINT
  })

  return cachedClient
}

export const putObject = async (key: string, content: Buffer, mime?: string) => {
  const client = getClient()
  await client.put(key, content, {
    headers: mime ? { 'Content-Type': mime } : undefined
  })
}

export const signUrl = (key: string, expires = 600): string => {
  const client = getClient()
  return client.signatureUrl(key, { expires })
}
