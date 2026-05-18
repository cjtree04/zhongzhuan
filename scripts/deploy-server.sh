#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# zhongzhuantoken.com — 服务器一键部署脚本
# 适配:OpenCloudOS 9.x / CentOS 9 / RHEL 9 / Rocky Linux 9
# 用途:
#   - 装 Node 20 + pm2
#   - clone https://github.com/cjtree04/zhongzhuan.git 到 /var/www/zhongzhuantoken-web
#   - npm install + build
#   - pm2 在 3100 端口启动 Next.js
#   - 改 /etc/nginx/conf.d/new-api.conf:把 / /pricing /docs 路由到自研前端,
#     其它路径继续走 New API (Docker localhost:3000)
#   - 自动 reload nginx + 烟测
#
# 用法:
#   curl -sL https://raw.githubusercontent.com/cjtree04/zhongzhuan/main/scripts/deploy-server.sh -o /tmp/deploy.sh
#   bash /tmp/deploy.sh
#
# 失败安全:任何一步出错就退出脚本(不影响 ssh 会话);nginx 改动前自动备份。
# ──────────────────────────────────────────────────────────────────────────────

set -e
trap 'echo ""; echo "✗ 脚本在第 $LINENO 行失败,退出。"; exit 1' ERR

APP_DIR="/var/www/zhongzhuantoken-web"
APP_PORT="3100"
NEW_API_PORT="3000"
NGINX_CONF="/etc/nginx/conf.d/new-api.conf"
REPO="https://github.com/cjtree04/zhongzhuan.git"
SERVER_NAME="zhongzhuantoken.com"

step() {
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════════════════════"
}

# ─── 1/9 装 Node 20 ──────────────────────────────────────────────────────────
step "[1/9] 装 Node 20"
if command -v node >/dev/null 2>&1; then
  echo "Node 已装: $(node -v)"
else
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
  echo "✓ Node $(node -v)"
fi

# 切到 npmmirror(国内加速,可选但建议)
npm config set registry https://registry.npmmirror.com
echo "✓ npm registry: $(npm config get registry)"

# ─── 2/9 装 pm2 ──────────────────────────────────────────────────────────────
step "[2/9] 装 pm2"
if command -v pm2 >/dev/null 2>&1; then
  echo "pm2 已装: $(pm2 -v)"
else
  npm install -g pm2
  echo "✓ pm2 $(pm2 -v)"
fi

# ─── 3/9 拉代码 ──────────────────────────────────────────────────────────────
step "[3/9] 拉前端代码到 $APP_DIR"
mkdir -p "$(dirname $APP_DIR)"
if [ -d "$APP_DIR/.git" ]; then
  echo "已有代码,执行 git pull..."
  cd "$APP_DIR"
  git pull --ff-only
else
  rm -rf "$APP_DIR"
  git clone --depth=1 "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
echo "✓ 代码就绪 @ $APP_DIR (commit: $(git rev-parse --short HEAD))"

# ─── 4/9 装依赖 ──────────────────────────────────────────────────────────────
step "[4/9] 装 npm 依赖(用 npmmirror 加速,1-3 分钟)"
npm install --no-audit --no-fund
echo "✓ 依赖装好"

# ─── 5/9 Production build ────────────────────────────────────────────────────
step "[5/9] Production build(2-3 分钟)"
NODE_OPTIONS=--max-old-space-size=2048 npm run build
echo "✓ build 完成"

# ─── 6/9 pm2 启动 ────────────────────────────────────────────────────────────
step "[6/9] pm2 启动 Next.js 在端口 $APP_PORT"
pm2 delete zhongzhuan-web 2>/dev/null || true
cd "$APP_DIR"
PORT=$APP_PORT pm2 start npm --name zhongzhuan-web -- run start
pm2 save
echo "✓ pm2 启动完成"

# ─── 7/9 烟测端口 ────────────────────────────────────────────────────────────
step "[7/9] 等 5 秒后测试 Next.js 端口 $APP_PORT"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$APP_PORT/)
echo "Next.js on $APP_PORT: HTTP $HTTP_CODE"
if [ "$HTTP_CODE" != "200" ]; then
  echo ""
  echo "✗ Next.js 不响应 200。pm2 日志如下:"
  pm2 logs zhongzhuan-web --lines 30 --nostream
  exit 1
fi
echo "✓ Next.js 正常"

# ─── 8/9 改 nginx 配置(先备份) ─────────────────────────────────────────────
step "[8/9] 改 nginx 配置(先备份)"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="${NGINX_CONF}.bak.${TS}"
cp "$NGINX_CONF" "$BACKUP"
echo "✓ 旧配置已备份: $BACKUP"

cat > "$NGINX_CONF" << 'NGINX_EOF'
upstream new_api_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream zhongzhuan_web {
    server 127.0.0.1:3100;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name zhongzhuantoken.com;

    client_max_body_size 100m;

    # 通用代理 header
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

    # ── 自研前端:营销层 ──
    location = / {
        proxy_pass http://zhongzhuan_web;
    }
    location /pricing {
        proxy_pass http://zhongzhuan_web;
    }
    location /docs {
        proxy_pass http://zhongzhuan_web;
    }
    location /_next {
        proxy_pass http://zhongzhuan_web;
    }
    location = /favicon.ico {
        proxy_pass http://zhongzhuan_web;
    }

    # ── 其他全部:New API (Docker localhost:3000) ──
    # /login /register /console /v1/* /api/* /admin /token /topup /log 等
    location / {
        proxy_pass http://new_api_backend;
    }
}
NGINX_EOF

echo ""
echo "测试新 nginx 配置..."
if ! nginx -t 2>&1 | tail -5; then
  echo ""
  echo "✗ nginx 配置测试失败,恢复备份..."
  cp "$BACKUP" "$NGINX_CONF"
  exit 1
fi
echo "✓ nginx 配置 OK"

# ─── 9/9 Reload nginx + 烟测 ─────────────────────────────────────────────────
step "[9/9] Reload nginx + 烟测"
nginx -s reload || systemctl reload nginx
sleep 2

echo ""
echo "Internal 烟测(本机 127.0.0.1):"
printf "  /        → HTTP %s  (期望 200,内容来自 Next.js)\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SERVER_NAME" http://127.0.0.1/)"
printf "  /pricing → HTTP %s  (期望 200,Next.js)\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SERVER_NAME" http://127.0.0.1/pricing)"
printf "  /docs    → HTTP %s  (期望 200,Next.js)\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SERVER_NAME" http://127.0.0.1/docs)"
printf "  /login   → HTTP %s  (期望 200/302,New API)\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SERVER_NAME" http://127.0.0.1/login)"
printf "  /v1/models → HTTP %s  (期望 401,New API 鉴权拒绝即正常)\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SERVER_NAME" http://127.0.0.1/v1/models)"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ 部署完成"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "现在做最后两件事:"
echo ""
echo "1. 浏览器打开 https://zhongzhuantoken.com/  (强制刷新 Cmd+Shift+R)"
echo "   - / 应该是新首页"
echo "   - /pricing 应该是新价格表"
echo "   - /docs 应该是新接入文档"
echo "   - /login 应该跳 New API 登录页"
echo ""
echo "2. 登录 New API 后台 → 系统设置 → 自定义首页"
echo "   把'首页内容'那个 Vercel URL 删掉 + 保存"
echo "   (现在 / 已经是真实路由了,不再需要 iframe)"
echo ""
echo "Next.js 进程管理常用命令:"
echo "  pm2 status                  - 查看进程"
echo "  pm2 logs zhongzhuan-web     - 查看日志"
echo "  pm2 restart zhongzhuan-web  - 重启"
echo ""
echo "未来更新前端代码:"
echo "  cd $APP_DIR"
echo "  git pull"
echo "  npm install"
echo "  npm run build"
echo "  pm2 restart zhongzhuan-web"
echo ""
echo "回滚:cp $BACKUP $NGINX_CONF && nginx -s reload"
