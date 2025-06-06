const TOKEN_KEY = 'token';

/**
 * 获取令牌
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 设置令牌
 * @param token 令牌
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 移除令牌
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
} 