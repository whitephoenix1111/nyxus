// src/lib/json-db.ts — Thin wrapper đọc/ghi JSON file làm database
//
// Dùng cho môi trường dev/demo — đơn giản, không cần setup.
// Giới hạn cần biết:
//   - Single-process only: không có file locking, concurrent writes có thể corrupt data.
//   - Không atomic: nếu process crash giữa writeFile → file bị corrupt.
//   - Không scale: toàn bộ collection được load vào memory mỗi lần đọc.
// Khi chuyển sang production: thay readJSON/writeJSON bằng ORM/DB driver
// mà không cần đổi call site.
import fs from 'fs/promises';
import path from 'path';

// dataDir trỏ tới thư mục /data ở root project (cùng cấp với /src)
const dataDir = path.join(process.cwd(), 'data');

/**
 * Đọc toàn bộ nội dung một JSON file và parse thành kiểu T.
 * @param filename Tên file trong thư mục /data (VD: 'clients.json').
 */
export async function readJSON<T>(filename: string): Promise<T> {
  const filePath = path.join(dataDir, filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Ghi toàn bộ data vào JSON file, ghi đè nội dung cũ.
 * Dùng pretty-print (indent 2) để dễ đọc và diff trong git.
 * @param filename Tên file trong thư mục /data.
 * @param data     Dữ liệu cần ghi — thường là toàn bộ array sau khi mutate.
 */
export async function writeJSON<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
