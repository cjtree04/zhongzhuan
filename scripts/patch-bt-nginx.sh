#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# patch-bt-nginx.sh — 补丁宝塔(BT Panel)主 nginx 配置,把 443 SSL server 块
# 的 catch-all location / 替换为路径路由:/, /pricing, /docs, /_next, /favicon.ico
# 走 Next.js (:3100),其他保持走 New API (:3000)。
#
# 用途:之前 deploy-server.sh 只改了 /etc/nginx/conf.d/new-api.conf (port 80),
# 但宝塔在 /www/server/nginx/conf/nginx.conf 里直接写了 443 SSL server 块,
# 浏览器 HTTPS 流量走的是后者,我们要改的就是它。
# ─────────────────────────────────────────────────────────────────────────────

set -e
trap 'echo ""; echo "✗ 补丁脚本在第 $LINENO 行失败,退出"; exit 1' ERR

NGINX_CONF="/www/server/nginx/conf/nginx.conf"

if [ ! -f "$NGINX_CONF" ]; then
  echo "✗ 找不到 $NGINX_CONF — 这台机器可能没装宝塔"
  exit 1
fi

# 检查是不是已经打过补丁了(避免重复执行)
if grep -q "zhongzhuan_web_3100_patched" "$NGINX_CONF" 2>/dev/null; then
  echo "✓ 补丁已经打过了,跳过文件修改,直接测试 + reload"
else
  BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d-%H%M%S)"
  echo "✓ 备份原配置到 $BACKUP"
  cp "$NGINX_CONF" "$BACKUP"

  # 用 Python 做精确替换(sed 处理多行 nginx 块太脆弱)
  python3 << 'PYTHON_EOF'
import sys

NGINX_CONF = "/www/server/nginx/conf/nginx.conf"

with open(NGINX_CONF, "r") as f:
    content = f.read()

# 旧的 location /(原样,从 cat 出来的配置抠下来)
old_block = """        location /
        {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 600s;
            proxy_send_timeout 600s;
            send_timeout 600s;
        }"""

# 新的:把代理 header 上提到 server 级(所有 location 继承),
# 加 5 个 location 走 Next.js,catch-all 仍然走 New API
new_block = """        # zhongzhuan_web_3100_patched (marker, 不要删)
        # 通用代理 header,server 级,所有 location 继承
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        send_timeout 600s;

        # ── 自研前端 Next.js (:3100):营销层 ──
        location = / {
            proxy_pass http://127.0.0.1:3100;
        }
        location /pricing {
            proxy_pass http://127.0.0.1:3100;
        }
        location /docs {
            proxy_pass http://127.0.0.1:3100;
        }
        location /_next {
            proxy_pass http://127.0.0.1:3100;
        }
        location = /favicon.ico {
            proxy_pass http://127.0.0.1:3100;
        }

        # ── 其他全部 (/login /register /console /v1/* /api/* …) → New API (:3000) ──
        location / {
            proxy_pass http://127.0.0.1:3000;
        }"""

if old_block in content:
    new_content = content.replace(old_block, new_block, 1)
    with open(NGINX_CONF, "w") as f:
        f.write(new_content)
    print("✓ 已成功替换 443 SSL server 块的 location /")
    sys.exit(0)
else:
    print("✗ 没找到精确匹配的 location / 块")
    print("  可能 nginx.conf 格式有改动,需要手工修改。")
    print("  建议:把 /www/server/nginx/conf/nginx.conf 贴给 Claude")
    sys.exit(1)
PYTHON_EOF
fi

echo ""
echo "═══ 测试新 nginx 配置 ═══"
nginx -t

echo ""
echo "═══ Reload nginx ═══"
nginx -s reload
sleep 2

echo ""
echo "═══ 烟测(本机) ═══"
printf "  / via http :80  → HTTP %s\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: zhongzhuantoken.com" http://127.0.0.1/)"
printf "  /pricing :80    → HTTP %s\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: zhongzhuantoken.com" http://127.0.0.1/pricing)"
printf "  /login :80      → HTTP %s\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: zhongzhuantoken.com" http://127.0.0.1/login)"
printf "  / via https     → HTTP %s\n" \
  "$(curl -s -k -o /dev/null -w '%{http_code}' https://127.0.0.1/ -H "Host: zhongzhuantoken.com")"
printf "  /pricing https  → HTTP %s\n" \
  "$(curl -s -k -o /dev/null -w '%{http_code}' https://127.0.0.1/pricing -H "Host: zhongzhuantoken.com")"

echo ""
echo "═══ 响应头确认(应该看到 x-nextjs-*,不再有 x-new-api-version) ═══"
echo ""
echo "── HTTPS GET / ──"
curl -s -k -I https://127.0.0.1/ -H "Host: zhongzhuantoken.com" | grep -iE "(x-nextjs|x-new-api|x-powered|server)" | head -5

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ 补丁完成"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "现在浏览器强刷 https://zhongzhuantoken.com/  (Cmd+Shift+R)"
echo ""
echo "登录 New API 后台 → 系统设置 → 自定义首页 → 清空 + 保存(撤掉 iframe)"
echo ""
echo "如果出问题回滚:"
echo "  ls -t /www/server/nginx/conf/nginx.conf.bak.* | head -1 | xargs -I{} cp {} /www/server/nginx/conf/nginx.conf"
echo "  nginx -s reload"
