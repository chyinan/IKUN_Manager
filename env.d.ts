/// <reference types="vite/client" />
declare module 'element-plus/dist/locale/zh-cn.mjs'

// Add the following namespace declaration
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}