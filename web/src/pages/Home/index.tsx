import {
  ArrowUpOutlined,
  CheckCircleTwoTone,
  FieldTimeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  ConfigProvider,
  Form,
  Image,
  message,
  Row,
  Select,
  Slider,
  Space,
  Statistic,
  Upload,
} from 'antd';
import React, { useMemo, useState } from 'react';
import { Ripple } from 'react-spinners-css';
import styles from './index.less';

const HomePage: React.FC = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>('');
  const [compressing, setCompressing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [compressingParams, setCompressParams] = useState<any>({
    quality: 20,
    quality_label: '高画质',
    dither: false,
    outputFormat: 'jpeg',
  });

  const [fileInfo, setFileInfo] = useState<any>({
    originalSize: 0,
    compressedSize: 0,
    compressionRatio: 0,
    handleTime: 0,
    uploadStartTime: 0,
    uploadEndTime: 0,
    originalResolution: '0x0',
  });
  const compressingParamsTitle = useMemo(() => {
    return `（当前压缩参数： ${compressingParams.quality_label} ${
      compressingParams.dither ? '抖动' : '不抖动'
    } ${compressingParams.outputFormat}）`;
  }, [compressingParams]);
  const props: UploadProps = {
    name: 'file',
    // action: 'http://124.222.225.170:8080/upload',
    action: `${
      window.location.hostname === 'localhost'
        ? 'http://172.25.16.0:8090/upload'
        : window.location.origin
    }/upload`,
    headers: {
      // authorization: 'authorization-text',
    },
    data: {
      // 添加额外的上传参数
      file_name: fileName,
      compress_params: JSON.stringify(compressingParams),
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        console.log('上传进度', info.file.percent);
        setFileInfo({
          ...fileInfo,
          originalSize: info.file.size,
        });
      }
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        console.log('上传成功', info);
        setCompressing(false);
        setCompressedImageUrl(info.file.response.downloadurl);
        // 创建一个Image对象来获取图片的宽高
        const img = new window.Image();
        img.src = uploadedImageUrl; // 设置图片源以触发onload事件
        console.log('图片previewUrl', uploadedImageUrl);
        img.onload = () => {
          console.log('图片宽高', img.width, img.height);
          setFileInfo({
            ...fileInfo,
            compressedSize: info.file.response.size,
            compressionRatio:
              (1 - info.file.response.size / fileInfo.originalSize) * 100,
            handleTime: info.file.response.handletime,
            uploadTime:
              new Date().getTime() -
              fileInfo.uploadStartTime -
              info.file.response.handletime * 1000,
            originalResolution: img.width + 'x' + img.height,
          });
        };
        console.log('压缩后', info, fileInfo);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload: (file) => {
      console.log('上传前的校验', file);
      setFileName(file.name);
      // 生成预览图片URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedImageUrl(previewUrl);
      setCompressedImageUrl('');

      setFileInfo({
        ...fileInfo,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        handleTime: 0,
        uploadStartTime: new Date().getTime(),
        uploadEndTime: 0,
        uploadTime: 0,
        originalResolution: '0x0', // 获取宽高
      });
      // 上传前的校验
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      // const isLt10M = file.size / 1024 / 1024 < 10;
      // if (!isLt10M) {
      //   message.error('图片大小不能超过 10MB!');
      //   return false;
      // }
      setCompressing(true);

      return true;
    },
  };
  type FieldType = {
    quality?: number;
    dither?: boolean;
    outputFormat?: string;
  };
  const marks: Record<string, any> = {
    0: {
      tooltip: '极高画质',
      label: '极高画质',
      value: 3,
    },
    20: {
      tooltip: '高画质',
      label: '高画质',
      value: 9,
    },
    40: {
      tooltip: '中等画质',
      label: '中等画质',
      value: 15,
    },
    60: {
      tooltip: '一般画质',
      label: '一般画质',
      value: 18,
    },
    80: {
      tooltip: '低画质',
      label: '低画质',
      value: 30,
    },
  };
  const onFinish = (values: any) => {
    console.log(values);
  };
  const bytesToMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  return (
    <ConfigProvider
      theme={{
        components: {
          Collapse: {
            headerBg: '#ffffff',
          },
        },
      }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <Space>
            <Image width={20} src={require('../../assets/logo.png')} />
            <div className={styles.title}>Faster Codec</div>
          </Space>
        </div>
        <Collapse defaultActiveKey={['1']} className={styles.mt20}>
          <Collapse.Panel
            header="压缩参数设置"
            key="1"
            style={{ color: '#ffffff', fontWeight: 'bold' }}
          >
            <Form
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ maxWidth: 600 }}
              // initialValues={{ remember: true }}
              onFinish={onFinish}
              // onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item<FieldType> label="压缩品质" name="quality">
                <Slider
                  marks={marks}
                  defaultValue={20}
                  step={null} // 禁止随意拖动
                  max={80}
                  min={0}
                  onChange={(value: number) => {
                    console.log(value, marks[value]);
                    setCompressParams({
                      ...compressingParams,
                      quality: value,
                      quality_label: marks[value]['label'],
                    });
                  }}
                />
              </Form.Item>

              <Form.Item<FieldType> label="是否抖动" name="dither">
                <Checkbox
                  onChange={(e) => {
                    setCompressParams({
                      ...compressingParams,
                      dither: e.target.checked,
                    });
                  }}
                >
                  开启抖动
                </Checkbox>
              </Form.Item>

              <Form.Item<FieldType> label="输出格式" name="outputFormat">
                <Select
                  defaultValue="jpeg"
                  style={{ width: 120 }}
                  onChange={(value) => {
                    setCompressParams({
                      ...compressingParams,
                      outputFormat: value,
                    });
                  }}
                  options={[
                    { value: 'jpeg', label: 'jpeg' },
                    { value: 'webp', label: 'webp' },
                    { value: 'png', label: 'png' },
                  ]}
                />
              </Form.Item>
            </Form>
          </Collapse.Panel>
        </Collapse>
        <Space align="start" className={styles.mt20}>
          <Upload {...props} showUploadList={false}>
            <Button
              size="large"
              color="cyan"
              variant="solid"
              disabled={compressing}
              icon={<UploadOutlined />}
            >
              上传图片
            </Button>
          </Upload>
          <Button size="large" color="cyan" variant="solid" disabled={true}>
            上传视频
          </Button>
        </Space>
        <Row className={styles.mt20} gutter={20}>
          <Col span={12}>
            <Card title="压缩前">
              {uploadedImageUrl && (
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={uploadedImageUrl}
                    alt={fileName}
                    style={{ maxHeight: 500 }}
                  />
                </div>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="压缩后">
              {compressing ? (
                <div
                  style={{ textAlign: 'center' }}
                  className={styles.compressing}
                >
                  <Image
                    src={uploadedImageUrl}
                    alt={fileName}
                    style={{ maxHeight: 500, opacity: 0.3 }}
                  />
                  <Ripple color="#00474f" className={styles.loading} />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {compressedImageUrl && (
                    <Image
                      src={compressedImageUrl}
                      alt={fileName}
                      style={{ maxHeight: 500 }}
                    />
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>
        <Row className={styles.mt20}>
          <Col span={24}>
            {/* {compressedImageUrl && (
            <div style={{ marginTop: 20 }}>
              <Image width={200} src={compressedImageUrl} />
            </div>
          )} */}
            <Card title={'压缩详情 ' + compressingParamsTitle}>
              <div>
                <Space size={40}>
                  <span>
                    <Statistic
                      title="图片分辨率:"
                      value={fileInfo.originalResolution}
                      precision={2}
                      valueStyle={{ color: '#13c2c2' }}
                      prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                    />
                  </span>
                  <span>
                    <Statistic
                      title="原始大小:"
                      value={bytesToMB(fileInfo.originalSize)}
                      precision={2}
                      valueStyle={{ color: '#13c2c2' }}
                      prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                    />
                  </span>
                  <span>
                    <Statistic
                      title="压缩后大小："
                      value={bytesToMB(fileInfo.compressedSize)}
                      precision={2}
                      valueStyle={{ color: '#13c2c2' }}
                      prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                    />
                  </span>
                  <span>
                    <Statistic
                      title="压缩率:"
                      value={fileInfo.compressionRatio.toFixed(2)}
                      precision={2}
                      valueStyle={{ color: '#cf1322' }}
                      prefix={<ArrowUpOutlined />}
                      suffix="%"
                    />
                  </span>
                  <span>
                    <Statistic
                      title="压缩处理时间:"
                      value={fileInfo.handleTime}
                      precision={2}
                      valueStyle={{ color: '#13c2c2' }}
                      prefix={
                        <FieldTimeOutlined style={{ color: '#52c41a' }} />
                      }
                      suffix="秒"
                    />
                  </span>
                  <span>
                    <Statistic
                      title="图片上传时间:"
                      value={fileInfo.uploadTime}
                      precision={2}
                      valueStyle={{ color: '#13c2c2' }}
                      prefix={
                        <FieldTimeOutlined style={{ color: '#52c41a' }} />
                      }
                      suffix="毫秒"
                    />
                  </span>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default HomePage;
