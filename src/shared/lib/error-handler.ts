/**
 * Error Handler Utility
 *
 * Provides safe error handling with sanitization for production use
 */

// Environment detection
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/**
 * Sanitize error message for user display
 * Removes sensitive information like file paths, API keys, etc.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message;

    // Remove file paths
    message = message.replace(/[A-Za-z]:\\[^\s]+/g, '[path]');
    message = message.replace(/\/[^\s]+\/[^\s]+/g, '[path]');

    // Remove potential API keys (patterns like app-xxx, sk-xxx)
    message = message.replace(/\b(app|sk|api)-[a-zA-Z0-9]{10,}/g, '[api-key]');

    // Remove URLs with potential sensitive params
    message = message.replace(/https?:\/\/[^\s]+/g, '[url]');

    return message;
  }

  if (typeof error === 'string') {
    return sanitizeErrorMessage(new Error(error));
  }

  return 'An unexpected error occurred';
}

/**
 * Safe error logging
 * Only logs detailed errors in development mode
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const sanitizedMessage = sanitizeErrorMessage(error);

  if (isDevelopment) {
    // In development, log full error details
    console.error(`[${timestamp}] [${context}]`, error);
  } else {
    // In production, log only sanitized message
    console.error(`[${timestamp}] [${context}] ${sanitizedMessage}`);
  }
}

/**
 * Safe error for user display
 * Returns a user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  const errorMessages: Record<string, string> = {
    'NetworkError': 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    'TimeoutError': 'リクエストがタイムアウトしました。後でもう一度お試しください。',
    'AbortError': '操作がキャンセルされました。',
    'QuotaExceededError': 'ストレージ容量が不足しています。',
    'InvalidStateError': '無効な状態です。ページを再読み込みしてください。',
  };

  if (error instanceof Error) {
    // Check for known error types
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.name === key || error.message.includes(key)) {
        return message;
      }
    }

    // API related errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'APIキーが無効または期限切れです。設定を確認してください。';
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'アクセスが拒否されました。権限を確認してください。';
    }
    if (error.message.includes('404')) {
      return 'リソースが見つかりませんでした。';
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return 'リクエスト制限に達しました。しばらく待ってからお試しください。';
    }
    if (error.message.includes('500') || error.message.includes('Internal')) {
      return 'サーバーエラーが発生しました。後でもう一度お試しください。';
    }

    // Encryption errors
    if (error.message.includes('decrypt') || error.message.includes('OperationError')) {
      return '復号化に失敗しました。パスワードを確認してください。';
    }
  }

  return sanitizeErrorMessage(error);
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(context, error);
      throw error;
    }
  };
}

/**
 * Security warning levels
 */
export type WarningLevel = 'info' | 'warning' | 'critical';

export interface SecurityWarning {
  level: WarningLevel;
  title: string;
  message: string;
  action?: string;
}

/**
 * Get security warnings based on current settings
 */
export function getSecurityWarnings(settings: {
  securityMode?: string;
}): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];

  if (settings.securityMode === 'PLAINTEXT') {
    warnings.push({
      level: 'critical',
      title: 'APIキーが暗号化されていません',
      message: 'APIキーが平文で保存されています。これはセキュリティリスクです。',
      action: '設定画面でセキュリティモードを変更してください。',
    });
  }

  return warnings;
}
