import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Card, Col, Image, message, Row, Space, Upload } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';
const { Dragger } = Upload;

const HomePage: React.FC = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>('');

  // const handleUpload = async (file: File) => {
  //   try {
  //     const transport = new WebTransport(
  //       'https://your-webtransport-server.com/upload',
  //     );
  //     await transport.ready;

  //     const stream = await transport.createUnidirectionalStream();
  //     const writer = stream.getWriter();
  //     const reader = file.stream().getReader();

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;
  //       await writer.write(value);
  //     }

  //     await writer.close();
  //     transport.close();

  //     message.success('图片上传成功！');

  //     // 假设服务器返回图片URL，这里仅作示例
  //     setUploadedImageUrl(URL.createObjectURL(file));

  //     // 模拟从服务器获取压缩后的图片
  //     setCompressedImageUrl(
  //       'https://your-webtransport-server.com/compressed-image-url',
  //     );
  //   } catch (error) {
  //     console.error('上传失败:', error);
  //     message.error('图片上传失败！');
  //   }
  // };

  const props: UploadProps = {
    name: 'file',
    action: 'http://124.222.225.170:8080/upload',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  // const uploadProps = {
  //   beforeUpload: (file: File) => {
  //     handleUpload(file);
  //     return false; // 阻止默认上传行为
  //   },
  //   accept: 'image/*',
  // };

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
          <Card title="编码前">111</Card>
        </Col>
        <Col span={12}>
          {/* {compressedImageUrl && (
            <div style={{ marginTop: 20 }}>
              <Image width={200} src={compressedImageUrl} />
            </div>
          )} */}
          <Card title="编码后">111</Card>
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
