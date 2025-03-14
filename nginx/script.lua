local upload = require "resty.upload"
local cjson = require "cjson"
local os = require "os"
-- local uuid = require "resty.uuid"
-- uuid.seed()

-- 配置参数
local UPLOAD_DIR = "/home/codec-demo/tmp/uploads/"
-- local PROCESS_SCRIPT = "/usr/local/bin/process.sh"
local MAX_FILE_SIZE = 500 * 1024 * 1024  -- 500MB
local EXPECTED_FIELD = "file"  -- 指定期望接收的字段名
local ip = ngx.var.server_addr
local DOWNLOAD_URL = "http://" .. ip .. ":8090/file/"
local DOWNLOAD_DIR = "/home/codec-demo/tmp/downloads/"
local REQUEST_START_TIME = ngx.req.start_time()
local compress_params = {}
local QUALITY_MARKS = {
  [0] = 3,
  [20] = 9,
  [40] = 15,
  [60] = 18,
  [80] = 30
}



local function file_exists(path)
    local f = io.open(path, "r")
    if f then
        f:close()
        return true
    end
    return false
end
-- 清理函数
local function cleanup(tmp_path)
    if tmp_path and file_exists(tmp_path) then
        os.remove(tmp_path)
        ngx.log(ngx.INFO, "Cleaned up temp file: ", tmp_path)
    end
end

-- 主逻辑
local content_type = ngx.req.get_headers()["Content-Type"]

if not content_type or not string.find(content_type:lower(), "multipart/form%-data") then
    ngx.log(ngx.ERR, "Invalid Content-Type: ", content_type)
    ngx.status = 400
    ngx.say(cjson.encode({
        code = 400,
        status = "error",
        message = "Content-Type must be multipart/form-data"
    }))
    ngx.exit(ngx.HTTP_BAD_REQUEST)
end

local form, err = upload:new(4096)
if not form then
    ngx.log(ngx.ERR, "Upload init failed: ", err)
    ngx.status = 500
    ngx.say(cjson.encode({
        code = 500,
        status = "error",
        message = "Upload initialization failed"
    }))
    ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
end

local file
local tmp_path
local file_size = 0
local found_file_field = false
local found_compress_params = false

-- 新增：解析Content-Disposition函数
local function parse_content_disposition(header_value)
    local params = {}
    for k, v in string.gmatch(header_value, '([^%s;]+)="([^"]*)"') do
        params[k:lower()] = v
    end
    return params
end

while true do
    local typ, res, err = form:read()
    -- ngx.log(ngx.ERR, "read: ", cjson.encode({typ, res}))
    if not typ then
        cleanup(tmp_path)
        ngx.log(ngx.ERR, "Form read error: ", err)
        ngx.status = 500
        ngx.say(cjson.encode({
            code = 500,
            status = "error",
            message = "File processing failed"
        }))
        ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
    end

    if typ == "header" then
        local key = res[1]:lower()
        local value = res[2]

        -- 只处理目标字段
        if key == "content-disposition" then
            local params = parse_content_disposition(value)
            ngx.log(ngx.ERR, "[请求参数params]", cjson.encode(params))
            if params.name == "compress_params" then
                -- compress_params = cjson.decode(params.value)
                -- ngx.log(ngx.ERR, "[压缩参数]", cjson.encode(compress_params))
                found_compress_params = true
            end
            -- 关键修改：检查字段名是否为file
            if params.name == EXPECTED_FIELD and params.filename then
                found_file_field = true
                -- 安全修改：仅使用UUID生成文件名
                tmp_path = UPLOAD_DIR .. params.filename
                ngx.log(ngx.ERR, "[tmp_path]", tmp_path)
                -- 确保目录存在
                os.execute("mkdir -p " .. UPLOAD_DIR)
                file = io.open(tmp_path, "w+b")
                if not file then
                    ngx.log(ngx.ERR, "Failed to open file: " .. tmp_path)
                end
                if not file then
                    cleanup(tmp_path)
                    ngx.log(ngx.ERR, "Failed to create temp file")
                    ngx.status = 500
                    ngx.say(cjson.encode({
                        code = 500,
                        status = "error",
                        message = "Server storage error"
                    }))
                    ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
                end
            end
        end
    elseif typ == "body" then
        if found_compress_params then
            ngx.log(ngx.ERR, "==获取参数==", res)  -- 直接记录原始字符串，确认数据正确性
            compress_params = cjson.decode(res)
            compress_params.quality = QUALITY_MARKS[compress_params.quality]
            ngx.log(ngx.ERR, "[压缩参数]", cjson.encode(compress_params))
            found_compress_params = false
        end
        if found_file_field and file then
            local bytes, write_err = file:write(res)
            if not bytes then
                cleanup(tmp_path)
                ngx.log(ngx.ERR, "File write failed: ", write_err)
                ngx.status = 500
                ngx.say(cjson.encode({
                    code = 500,
                    status = "error", 
                    message = "File save failed"
                }))
                ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
            end
            file_size = file_size + #res -- 使用#res获取字符串长度而不是bytes

            if file_size > MAX_FILE_SIZE then
                cleanup(tmp_path)
                ngx.log(ngx.ERR, "File size exceeded: ", file_size)
                ngx.status = 413
                ngx.say(cjson.encode({
                    code = 413,
                    status = "error",
                    message = "File size exceeds 10MB limit"
                }))
                ngx.exit(ngx.HTTP_REQUEST_ENTITY_TOO_LARGE)
            end
        end
    -- 新增：处理其他参数 compress_params
    elseif typ == "body" then
        -- if found_compress_params then
        --     ngx.log(ngx.ERR, "==获取参数==", res)  -- 直接记录原始字符串，确认数据正确性
        --     found_compress_params = false
        -- end
        -- -- 安全解析JSON
        -- local ok, param_data = pcall(cjson.decode, res)
        -- if not ok then
        --     ngx.log(ngx.ERR, "[错误] 解析compress_params失败: ", res)
        --     -- 可选：设置默认参数或终止请求
        --     return ngx.exit(ngx.HTTP_BAD_REQUEST)
        -- end
        
        -- -- 提取compress_params
        -- if param_data and param_data.compress_params then
        --     compress_params = param_data.compress_params
        --     ngx.log(ngx.ERR, "[压缩参数2]", cjson.encode(compress_params))
        -- else
        --     ngx.log(ngx.ERR, "[警告] compress_params字段未找到")
        -- end
    elseif typ == "part_end" then
        -- if found_compress_params then
        --     found_compress_params = false
        -- end
        if file then
            file:close()
            file = nil
            found_file_field = false
            found_compress_params = false
        end
    elseif typ == "eof" then
        break
    end
end

-- 新增：检查是否找到目标字段
if not tmp_path or not file_exists(tmp_path) then
    ngx.log(ngx.ERR, "Target file field not found or empty")
    ngx.status = 400
    ngx.say(cjson.encode({
        code = 400,
        status = "error",
        message = "Required file field '"..EXPECTED_FIELD.."' not found"
    }))
    ngx.exit(ngx.HTTP_BAD_REQUEST)
end
-- 检查目录是否存在（如果无法提前创建）
os.execute("mkdir -p " .. DOWNLOAD_DIR)
local filename = "compress." .. os.date("%Y%m%d%H%M%S") .. "." .. compress_params.outputFormat
local download_path = DOWNLOAD_DIR .. filename
-- local handle_start_time = os.clock() * 1000  -- 获取当前时间戳，单位为毫秒
-- ngx.log(ngx.ERR, "[ffmpeg Cmd ]", "time /home/codec-demo/nginx/ffmpeg -i " .. tmp_path .. " " .. download_path)  
-- local status, exitCode = os.execute("/usr/bin/time -v /home/codec-demo/nginx/ffmpeg -i " .. tmp_path .. " " .. download_path .. " 2>&1")
-- local end_time = os.clock() * 1000  -- 记录结束时间
-- local handle_time = end_time - handle_start_time  -- 计算消耗的时间
-- ngx.log(ngx.ERR, "[ffmpeg status]", status, "[exitCode]", exitCode, "[handle_time]", handle_time)

-- 通过 io.popen 执行命令并捕获标准错误输出（time -v 的结果输出到 stderr）
local cmd = "/usr/bin/time -v /home/codec-demo/nginx/ffmpeg -i " .. tmp_path .. " -q:v " .. compress_params.quality .. " " .. download_path .. " 2>&1"  -- 将 stderr 重定向到 stdout
ngx.log(ngx.ERR, "[ffmpeg Cmd]", cmd)
local handle = io.popen(cmd)  -- 注意：在 OpenResty 中需确认是否允许阻塞操作
local output = handle:read("*a")  -- 读取全部输出
local status, exitCode = handle:close()  -- 获取命令状态

-- 从输出中解析时间信息（示例解析 CPU 时间和挂钟时间）
local user_time = output:match("User time .seconds.: ([0-9.]+)")
local system_time = output:match("System time .seconds.: ([0-9.]+)")
local wall_clock = output:match("Elapsed .wall clock. time .h.mm.ss or m.ss.: ([0-9.:]+)")

ngx.log(ngx.ERR, 
  "[FFmpeg] Status: ", status, 
  " Exit: ", exitCode, 
  " User CPU: ", user_time, "s",
  " System CPU: ", system_time, "s",
  " Wall Clock: ", wall_clock
)


-- 获取压缩后文件的大小
local compressed_file = io.open(download_path, "r")
local compressed_file_size = 0
if compressed_file then
    -- 文件存在，获取文件大小
    compressed_file_size = compressed_file:seek("end")  -- 使用seek获取文件大小
    compressed_file:close()
    ngx.log(ngx.INFO, "文件存在，大小为: ", compressed_file_size, " 字节")
else
    -- 文件不存在
    ngx.log(ngx.ERR, "文件不存在")
end

if status == true then
    ngx.status = 200
    ngx.header.content_type = "application/json; charset=utf-8"
    ngx.say(cjson.encode({
        code = 200,
        status = "success",
        result = result,
        downloadurl = DOWNLOAD_URL .. filename,
        size = compressed_file_size,  -- 使用原始文件大小作为压缩后的文件大小
        starttime = REQUEST_START_TIME,
        handletime = user_time
    }))
    ngx.exit(ngx.HTTP_OK)
else
    ngx.status = 500
    ngx.header.content_type = "application/json; charset=utf-8"
    ngx.say(cjson.encode({
        code = 500,
        status = "error",
        message = "Failed to process video"
    }))
    ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
end


-- ngx.status = 200
-- ngx.header.content_type = "application/json; charset=utf-8"
-- ngx.say(cjson.encode({
--     code = 200,
--     status = "success",
--     result = result,
--     downloadurl = download_path
-- }))
-- ngx.exit(ngx.HTTP_OK)