local cjson = require "cjson"
local io = require "io"
local os = require "os"
 
-- 获取上传的文件
local file_meta = ngx.req.get_posted_file("file")
if not file_meta then
    ngx.status = ngx.HTTP_BAD_REQUEST
    ngx.say("No file uploaded")
    return
end
 
-- 将文件保存到临时目录
local tmp_path = ngx.var.tmpdir .. "/" .. file_meta.filename
local tmp_file = io.open(tmp_path, "wb")
if not tmp_file then
    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
    ngx.say("Failed to open temp file")
    return
end
tmp_file:write(file_meta.body_data)
tmp_file:close()
 
-- 调用本地程序处理文件
local command = "path/to/your/executable " .. tmp_path
local handle = io.popen(command)
local output = handle:read("*all")
handle:close()
 
-- 删除临时文件
os.remove(tmp_path)
 
-- 返回处理结果
ngx.status = ngx.HTTP_OK
ngx.header.content_type = "application/json"
ngx.say(cjson.encode({status = "success", output = output}))
