import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  message,
  Row,
  Space,
  Spin,
  Upload,
} from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

const HomePage: React.FC = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [compressing, setCompressing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const props: UploadProps = {
    name: 'file',
    action: 'http://124.222.225.170:8080/upload',
    headers: {
      // authorization: 'authorization-text',
    },
    data: {
      // 添加额外的上传参数
      file_name: fileName,
    },
    onChange(info) {
      if (info.file.status === 'uploading') {
        console.log('上传进度', info.file.percent);
      }
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
        setCompressing(false);
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

      // 上传前的校验
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过 10MB!');
        return false;
      }
      setCompressing(true);
      return true;
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Image width={32} src={require('../../assets/logo.png')} />
          <div className={styles.title}>Faster Codec</div>
        </Space>
      </div>
      <Space align="start" className={styles.mt20}>
        <Upload {...props}>
          <Button
            size="large"
            color="cyan"
            variant="solid"
            icon={<UploadOutlined />}
          >
            上传图片
          </Button>
        </Upload>
        <Button size="large" color="cyan" variant="solid">
          上传视频
        </Button>
      </Space>
      <Row className={styles.mt20} gutter={20}>
        <Col span={12}>
          <Card title="编码前">
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
          <Card title="编码后">
            {compressing ? (
              <Spin tip="编码中...">
                <Alert
                  message="高效的压缩算法"
                  description="自研算法，压缩率高达90%"
                />
              </Spin>
            ) : (
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
      </Row>
      <Row className={styles.mt20}>
        <Col span={24}>
          {/* {compressedImageUrl && (
            <div style={{ marginTop: 20 }}>
              <Image width={200} src={compressedImageUrl} />
            </div>
          )} */}
          <Card title="编码详情">111</Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
