/**
 * Prisma Client Singleton
 *
 * シングルトンパターンでPrismaClientを管理
 * 開発環境でのホットリロード時の接続数増加を防止
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient型をグローバルに宣言
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma Client インスタンス
 *
 * 開発環境: globalThisに保存してホットリロード時の再接続を防止
 * 本番環境: 新規インスタンスを作成
 */
const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

/**
 * Prisma Client インスタンス (シングルトン)
 */
export const prisma: PrismaClient =
  globalThis.prisma ?? prismaClientSingleton();

// 開発環境ではグローバルに保存
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * データベース接続を明示的に切断
 * テスト終了時やアプリケーション終了時に使用
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * データベース接続をテスト
 * ヘルスチェックエンドポイントなどで使用
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * トランザクション実行ヘルパー
 * 複数の操作をアトミックに実行
 */
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}

// デフォルトエクスポート
export default prisma;
