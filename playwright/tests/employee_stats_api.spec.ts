import { test, expect } from '@playwright/test';

test.describe('Employee Stats API Test', () => {
  test('should successfully fetch employee stats after login', async ({ page }) => {
    // 导航到登录页面
    await page.goto('http://localhost:5173/login');

    // 填写用户名和密码
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456'); // Replace with actual admin password

    // 监听登录请求并捕获响应
    const [loginResponse] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/auth/login') && response.status() === 200),
      page.click('button:has-text("登录")')
    ]);

    expect(loginResponse.ok()).toBeTruthy();
    const loginResponseBody = await loginResponse.json();
    console.log('Login API Response:', loginResponseBody);

    // 提取 accessToken
    const accessToken = loginResponseBody.data.accessToken;
    expect(accessToken).toBeTruthy();
    console.log('Extracted Access Token:', accessToken);

    // 现在使用提取的 accessToken 调用 /api/employee/stats 接口
    // Playwright 通常在同一个上下文（page）中自动携带认证信息，但为了明确测试API调用，我们也可以模拟请求
    const statsResponse = await page.request.get('http://localhost:8081/api/employee/stats', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // 打印并断言响应状态和数据
    const statsResponseBody = await statsResponse.json();
    console.log('Employee Stats API Response:', statsResponseBody);

    expect(statsResponse.ok()).toBeTruthy(); // 期望状态码是 2xx
    expect(statsResponseBody.code).toBe(200); // 期望业务状态码是 200
    expect(statsResponseBody.data).toBeDefined(); // 期望有数据返回
    expect(statsResponseBody.data.total).toBeDefined();
    expect(statsResponseBody.data.deptCount).toBeDefined();
    // 可以添加更多关于数据内容的断言
  });
}); 