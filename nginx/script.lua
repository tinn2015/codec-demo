local upload = require "resty.upload"
local cjson = require "cjson"
local os = require "os"
-- local uuid = require "resty.uuid"
-- uuid.seed()

-- 配置参数
local UPLOAD_DIR = "/tmp/uploads/"
-- local PROCESS_SCRIPT = "/usr/local/bin/process.sh"
local MAX_FILE_SIZE = 10 * 1024 * 1024  -- 10MB
local EXPECTED_FIELD = "file"  -- 指定期望接收的字段名
local DOWNLOAD_URL = "http://124.222.225.170:8080/file"


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
            -- if params.name == "filename" then
        end

    elseif typ == "body" then
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

    elseif typ == "part_end" then
        if file then
            file:close()
            file = nil
            found_file_field = false
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

-- 调用处理脚本（添加超时保护）
-- local cmd = PROCESS_SCRIPT .. " " .. ngx.quote_sql_str(tmp_path)
-- local handle, err = io.popen(cmd, "r")
-- if not handle then
--     cleanup(tmp_path)
--     ngx.log(ngx.ERR, "Script execute failed: ", err)
--     ngx.status = 500
--     ngx.say(cjson.encode({
--         code = 500,
--         status = "error",
--         message = "Processing service unavailable"
--     }))
--     ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
-- end

-- local result = handle:read("*a")
-- local success, exit_code = handle:close()

-- cleanup(tmp_path)

-- if exit_code ~= 0 then
--     ngx.log(ngx.ERR, "Process failed (code ", exit_code, "): ", result)
--     ngx.status = 500
--     ngx.say(cjson.encode({
--         code = 500,
--         status = "error",
--         message = "File processing failed",
--         -- detail = result:sub(1, 200)  -- 限制返回长度
--     }))
--     ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
-- end

ngx.status = 200
ngx.header.content_type = "application/json; charset=utf-8"
ngx.say(cjson.encode({
    code = 200,
    status = "success",
    result = result,
    downloadurl = DOWNLOAD_URL .. tmp_path
}))
ngx.exit(ngx.HTTP_OK)