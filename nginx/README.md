```
   docker run --name my-nginx -p 8080:80 -v $(pwd):/usr/share/nginx/html:ro -d nginx
```

# openresty

```
docker run  -p 8080:8080  -v ./nginx.conf:/usr/local/openresty/nginx/conf/nginx.conf -v ./script.lua:/etc/nginx/script.lua openresty/openresty

```

# 安装 lua-resty-upload 依赖

```
apt-get update
apt-get install -y luarocks
```

## 安装 lua-resty-upload

```
luarocks install lua-resty-upload
```
