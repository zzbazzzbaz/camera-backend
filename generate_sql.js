// 生成随机十六进制字符串
function generateHex(length) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// 生成随机API Key（包含大小写字母和数字）
function generateApiKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// 生成序列号
function generateSerialNumber(index) {
  const hex = generateHex(8).toUpperCase();
  return `CAM-20250108-${hex}`;
}

console.log('-- 设备');
console.log('INSERT INTO devices (device_id, serial_number, status, photo_count, created_at, updated_at) VALUES');

const deviceData = [];
for (let i = 0; i < 100; i++) {
  const deviceId = generateHex(32);
  const serialNumber = generateSerialNumber(i);
  deviceData.push({ deviceId, serialNumber });

  const comma = i < 99 ? ',' : ';';
  console.log(`    ('${deviceId}', '${serialNumber}', 1, 0, NOW(), NOW())${comma}`);
}

console.log('\n-- 序列号-API Key 对应关系');
console.log('INSERT INTO device_api_keys (credential_id, device_id, serial_number, api_key, created_at, updated_at) VALUES');

for (let i = 0; i < 100; i++) {
  const credentialId = generateHex(32);
  const apiKey = generateApiKey(32);
  const { deviceId, serialNumber } = deviceData[i];

  const comma = i < 99 ? ',' : ';';
  console.log(`    ('${credentialId}', '${deviceId}', '${serialNumber}', '${apiKey}', NOW(), NOW())${comma}`);
}