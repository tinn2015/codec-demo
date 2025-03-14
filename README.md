# 功能介绍

- 前端上传图片或者视频
- 启动 openresty 代理服务
- 接收上传文件，通过 lua 脚本直接进行业务处理
- 通过 ffmpeg 实现图片压缩

# 启动步骤

1. server 工作目录 /home/codec-demo
2. 工作目录结构

```
admin@sophon:/home/codec-demo$ ls
nginx  tmp  web

```

```
admin@sophon:/home/codec-demo/tmp$ ls
downloads  uploads


admin@sophon:/home/codec-demo/nginx$ ls
Dockerfile  README.md  ffmpeg  nginx.conf  script.lua

```

3. 启动方式

```
<!-- 启动 -->
sudo openresty -c /home/codec-demo/nginx/nginx.conf
<!-- 修改配置重启 -->
sudo openresty -s reload -c /home/codec-demo/nginx/nginx.conf

```

# 其他

openresty 方便直接调用 lua
安装 openresty

```
sudo apt-get update
sudo apt-get install openresty
```
