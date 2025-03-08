import { UploadOutlined } from '@ant-design/icons';
import { Button, Col, Image, message, Row, Upload } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

const HomePage: React.FC = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [compressedImageUrl, setCompressedImageUrl] = useState<string>('');

  const handleUpload = async (file: File) => {
    try {
      const transport = new WebTransport(
        'https://your-webtransport-server.com/upload',
      );
      await transport.ready;

      const stream = await transport.createUnidirectionalStream();
      const writer = stream.getWriter();
      const reader = file.stream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }

      await writer.close();
      transport.close();

      message.success('图片上传成功！');

      // 假设服务器返回图片URL，这里仅作示例
      setUploadedImageUrl(URL.createObjectURL(file));

      // 模拟从服务器获取压缩后的图片
      setCompressedImageUrl(
        'https://your-webtransport-server.com/compressed-image-url',
      );
    } catch (error) {
      console.error('上传失败:', error);
      message.error('图片上传失败！');
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleUpload(file);
      return false; // 阻止默认上传行为
    },
    accept: 'image/*',
  };

  return (
    <div className={styles.container}>
      <Row gutter={16}>
        <Col span={12}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>上传图片</Button>
          </Upload>
          {uploadedImageUrl && (
            <div style={{ marginTop: 20 }}>
              <Image width={200} src={uploadedImageUrl} />
            </div>
          )}
        </Col>
        <Col span={12}>
          {compressedImageUrl && (
            <div style={{ marginTop: 20 }}>
              <Image width={200} src={compressedImageUrl} />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
