import type { NextConfig } from "next";

/**
 * Dev 模式把 /api/* 反代到生产后端 zhongzhuantoken.com,
 * 这样本地 next dev 也能用真实的登录/价格/token API。
 * 生产由 nginx 反代,这里不生效。
 *
 * 注意:如果后端 Set-Cookie 带了 Domain=zhongzhuantoken.com 属性,
 * 浏览器会拒绝设给 localhost,登录态可能丢失。若发现登录不持久,
 * 需要在后端去掉 Domain 属性,或加 middleware 改写 Set-Cookie。
 */
const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const target =
      process.env.DEV_API_BASE?.replace(/\/$/, "") || "https://zhongzhuantoken.com";
    return [
      { source: "/api/:path*", destination: `${target}/api/:path*` },
    ];
  },
};

export default nextConfig;
