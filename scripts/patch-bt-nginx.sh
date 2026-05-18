#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# patch-bt-nginx.sh (v2) — 把宝塔 /www/server/nginx/conf/nginx.conf 里
# 443 SSL server 块的 catch-all location / 替换为路径路由:
#
#   /, /pricing, /docs, /_next, /favicon.ico, /login, /register → Next.js (:3100)
#   其他全部(/console, /v1/*, /api/*, /token, /topup, /log, ...) → New API (:3000)
#
# 脚本是幂等的:可重复跑。
#   - 第一次跑:匹配原始 New API block,替换为 v2
#   - 升级:匹配 v1 输出,替换为 v2
#   - 已是 v2:跳过,只 reload
# ─────────────────────────────────────────────────────────────────────────────

set -e
trap 'echo ""; echo "✗ 补丁脚本在第 $LINENO 行失败,退出"; exit 1' ERR

NGINX_CONF="/www/server/nginx/conf/nginx.conf"
V2_MARKER="zhongzhuan_web_v2_login_register"

if [ ! -f "$NGINX_CONF" ]; then
  echo "✗ 找不到 $NGINX_CONF — 这台机器可能没装宝塔"
  exit 1
fi

if grep -q "$V2_MARKER" "$NGINX_CONF" 2>/dev/null; then
  echo "✓ 已是 v2 状态,跳过文件修改,直接 reload"
else
  BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d-%H%M%S)"
  echo "✓ 备份原配置到 $BACKUP"
  cp "$NGINX_CONF" "$BACKUP"

  python3 << 'PYTHON_EOF'
import sys

NGINX_CONF = "/www/server/nginx/conf/nginx.conf"

with open(NGINX_CONF, "r") as f:
    content = f.read()

# ─── v0:原始 New API block(若机器从未应用过我们的 patch) ───
original_block = """        location /
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

# ─── v1:已应用过 v1 patch(没有 login/register 路由) ───
v1_block = """        # zhongzhuan_web_3100_patched (marker, 不要删)
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

# ─── v2:加 /login /register 路由 ───
v2_block = """        # zhongzhuan_web_v2_login_register (marker, 不要删)
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

        # ── 自研前端 Next.js (:3100):营销层 + 认证层 ──
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
        location = /login {
            proxy_pass http://127.0.0.1:3100;
        }
        location = /register {
            proxy_pass http://127.0.0.1:3100;
        }

        # ── 其他全部 (/console /v1/* /api/* /token /topup …) → New API (:3000) ──
        location / {
            proxy_pass http://127.0.0.1:3000;
        }"""

if v1_block in content:
    new_content = content.replace(v1_block, v2_block, 1)
    print("✓ 检测到 v1 patch,升级到 v2(加 /login /register)")
elif original_block in content:
    new_content = content.replace(original_block, v2_block, 1)
    print("✓ 检测到原始 New API block,直接应用 v2")
else:
    print("✗ 没找到匹配的块格式(v0 或 v1)")
    print("  可能 nginx.conf 被手工改过。请把内容贴给 Claude 让它给特定的 patch")
    sys.exit(1)

with open(NGINX_CONF, "w") as f:
    f.write(new_content)
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
echo "═══ 烟测(本机,验证路由分配) ═══"
test_route() {
  local path="$1"
  local expect="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: zhongzhuantoken.com" "http://127.0.0.1$path")
  printf "  %-20s → HTTP %s  (期望 %s)\n" "$path" "$code" "$expect"
}
test_route "/"           "200(Next.js)"
test_route "/pricing"    "200(Next.js)"
test_route "/docs"       "200(Next.js)"
test_route "/login"      "200(Next.js)"
test_route "/register"   "200(Next.js)"
test_route "/console"    "200/302(New API)"
test_route "/v1/models"  "401(New API)"

echo ""
echo "═══ 头部确认 (/login 应该来自 Next.js) ═══"
curl -s -I -H "Host: zhongzhuantoken.com" http://127.0.0.1/login | grep -iE "(x-nextjs|x-new-api|server)" | head -3

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ v2 补丁完成 — /login /register 现在走自研 Next.js"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "浏览器强刷:"
echo "  https://zhongzhuantoken.com/login    — 应该是新登录页"
echo "  https://zhongzhuantoken.com/register — 应该是新注册页"
echo ""
echo "回滚到上一版:"
echo "  ls -t /www/server/nginx/conf/nginx.conf.bak.* | head -1 | xargs -I{} cp {} /www/server/nginx/conf/nginx.conf"
echo "  nginx -s reload"
