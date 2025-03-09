# 使用 OpenResty 官方镜像作为基础镜像
FROM openresty/openresty
# Start of Selection
RUN echo "当前系统信息:" && uname -a
# End of Selection

# 设置工作目录
WORKDIR /app

COPY ./sources.list /etc/apt/sources.list
# 安装必要的工具和依赖
RUN apt update
RUN apt install -y luarocks

# 安装 lua-resty-upload
RUN luarocks install lua-resty-upload

# 复制本地的 nginx.conf 和 script.lua 到容器中
COPY ./nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY ./script.lua /etc/nginx/script.lua

# 暴露端口
EXPOSE 8080

# 启动 OpenResty
CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
