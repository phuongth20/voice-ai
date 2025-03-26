// src/components/FileUpload.js
import React, { useState } from 'react';
import { Upload, Button, message, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const FileUpload = ({ setMessages }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState('');
  const [visible, setVisible] = useState(false);

  const handleChange = info => {
    let files = [...info.fileList];
    // Giới hạn số lượng tệp
    files = files.slice(-1);
    setFileList(files);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn tệp để tải lên.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj);

    setUploading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/summarize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.summary) {
        message.success('Tải lên và tóm tắt thành công!');
        // Thêm tóm tắt vào cuộc trò chuyện
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.data.summary, timestamp: new Date().toLocaleTimeString() }
        ]);
        setSummary(response.data.summary);
        setVisible(true);
      }
    } catch (error) {
      console.error(error);
      message.error('Đã có lỗi xảy ra khi tải lên tệp.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', marginTop: '24px' }}>
      <Upload
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
        beforeUpload={() => false} // Ngăn không tự động tải lên
        onChange={handleChange}
        fileList={fileList}
      >
        <Button icon={<UploadOutlined />}>Chọn Tệp</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: '16px' }}
      >
        Tải Lên và Tóm Tắt
      </Button>
      <Modal
        title="Tóm Tắt Nội Dung"
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <p>{summary}</p>
      </Modal>
    </div>
  );
};

export default FileUpload;
