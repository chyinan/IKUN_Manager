import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween' // 引入 isBetween 插件
dayjs.extend(isBetween) // 使用插件
import { useConfigStore } from '@/stores/config'; // Ensure this import is present

/**
 * 判断是否是外部链接
 * @param {string} path
 * @returns {boolean}
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 判断是否是有效的URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * 判断是否是小写字母
 * @param {string} str
 * @returns {boolean}
 */
export function isLowerCase(str: string): boolean {
  const reg = /^[a-z]+$/
  return reg.test(str)
}

/**
 * 判断是否是大写字母
 * @param {string} str
 * @returns {boolean}
 */
export function isUpperCase(str: string): boolean {
  const reg = /^[A-Z]+$/
  return reg.test(str)
}

/**
 * 判断是否是字母
 * @param {string} str
 * @returns {boolean}
 */
export function isAlphabets(str: string): boolean {
  const reg = /^[A-Za-z]+$/
  return reg.test(str)
}

/**
 * 判断是否是有效的邮箱
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 判断是否是有效的手机号
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 判断是否是有效的身份证号
 * @param {string} idCard
 * @returns {boolean}
 */
export function isValidIDCard(idCard: string): boolean {
  const idCardRegex = /(^\d{15}$)|(^\d{17}(\d|X|x)$)/;
  return idCardRegex.test(idCard);
}

// 非空校验
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

// 整数校验
export function isInteger(value: any): boolean {
  return Number.isInteger(Number(value));
}

// 正整数校验
export function isPositiveInteger(value: any): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

// 数字校验 (包括整数和小数)
export function isNumber(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// 学号校验 (使用配置的正则表达式)
export function isValidStudentId(studentId: string): boolean {
  const configStore = useConfigStore();
  if (!configStore.isLoaded) {
    console.warn('[validate] Config not loaded yet for student ID validation.');
    // 首次加载未完成时，暂时使用默认规则或返回true
    const fallbackRegex = /^S\d{8}$/;
    return fallbackRegex.test(studentId);
  }
  try {
    const regex = new RegExp(configStore.studentIdRegex);
    return regex.test(studentId);
  } catch (error) {
    console.error('[validate] Invalid student ID regex pattern from config:', configStore.studentIdRegex, error);
    return false; // 正则表达式无效，认为验证失败
  }
}

// 员工号校验 (使用配置的正则表达式)
export function isValidEmployeeId(employeeId: string): boolean {
  const configStore = useConfigStore();
  if (!configStore.isLoaded) {
    console.warn('[validate] Config not loaded yet for employee ID validation.');
    // 首次加载未完成时，暂时使用默认规则或返回true
    const fallbackRegex = /^E\d{5}$/;
    return fallbackRegex.test(employeeId);
  }
   try {
    const regex = new RegExp(configStore.employeeIdRegex);
    return regex.test(employeeId);
  } catch (error) {
    console.error('[validate] Invalid employee ID regex pattern from config:', configStore.employeeIdRegex, error);
    return false; // 正则表达式无效，认为验证失败
  }
}

/**
 * 校验密码强度
 * @param password 密码字符串
 * @returns 0: 无效, 1: 弱, 2: 中, 3: 强
 */
export function checkPasswordStrength(password: string): number {
  if (!password || password.length < 6) {
    return 0; // 长度不足，无效
  }
  let strength = 0;
  if (password.length >= 8) strength++; // 长度达标
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++; // 大小写字母
  if (/[0-9]/.test(password)) strength++; // 数字
  if (/[^a-zA-Z0-9]/.test(password)) strength++; // 特殊字符

  // 调整强度等级，例如最少需要两种组合才算中
  if (strength <= 1) return 1; // 弱
  if (strength <= 3) return 2; // 中
  return 3; // 强
}