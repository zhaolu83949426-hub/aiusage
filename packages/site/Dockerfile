FROM node:20-slim AS builder

ARG BUILD_DATE

LABEL org.opencontainers.image.title="aiusage-site" \
      org.opencontainers.image.description="Official website and documentation for AIUsage — track AI coding assistant usage, token consumption, costs, and tool calls across Claude Code, Codex, Cursor, and more" \
      org.opencontainers.image.url="https://github.com/juliantanx/aiusage" \
      org.opencontainers.image.source="https://github.com/juliantanx/aiusage" \
      org.opencontainers.image.documentation="https://github.com/juliantanx/aiusage/tree/main/packages/site" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="juliantanx" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.authors="Julian <juliantanx@users.noreply.github.com>"

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/site/package.json packages/site/

RUN pnpm install --frozen-lockfile

COPY packages/core/ packages/core/
COPY packages/site/ packages/site/

RUN pnpm --filter @aiusage/core build && pnpm --filter @aiusage/site build

FROM nginx:alpine

LABEL org.opencontainers.image.title="aiusage-site" \
      org.opencontainers.image.description="Official website and documentation for AIUsage — track AI coding assistant usage, token consumption, costs, and tool calls across Claude Code, Codex, Cursor, and more" \
      org.opencontainers.image.url="https://github.com/juliantanx/aiusage" \
      org.opencontainers.image.source="https://github.com/juliantanx/aiusage" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="juliantanx"

COPY --from=builder /app/packages/site/build /usr/share/nginx/html

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/index.html $uri.html /404.html;
    }

    location ~* \.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
