# 使用 OpenResty 官方镜像作为基础镜像
FROM openresty/openresty:alpine

# 设置工作目录
WORKDIR /app

# 安装必要的工具和依赖
RUN apk add --no-cache \
    build-base \
    curl \
    git \
    luarocks

# 安装 lua-resty-upload
RUN luarocks install lua-resty-upload

# 复制本地的 nginx.conf 和 script.lua 到容器中
COPY ./nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY ./script.lua /etc/nginx/script.lua

# 暴露端口
EXPOSE 8080

# 启动 OpenResty
CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
