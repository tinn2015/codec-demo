# 使用 OpenResty 官方镜像作为基础镜像
FROM openresty/openresty

# 设置工作目录
WORKDIR /home

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
# daemon off 表示让 OpenResty 在前台运行,而不是作为守护进程在后台运行
# 这对于 Docker 容器来说是必要的,因为容器需要保持前台进程运行
# 如果在后台运行,容器会认为进程已结束而退出
CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
