// src/components/ExportSummary.js
import React, { useState } from 'react';
import { Select, Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const ExportSummary = ({ summary }) => {
  const [format, setFormat] = useState('txt');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!summary.trim()) {
      message.warning('Không có tóm tắt để xuất bản.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/export',
        { summary, format },
        { responseType: 'blob' }
      );

      // Tạo URL để tải xuống tệp
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `summary.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      message.success('Xuất bản thành công!');
    } catch (error) {
      console.error(error);
      message.error('Đã có lỗi xảy ra khi xuất bản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', marginTop: '24px' }}>
      <Select value={format} onChange={value => setFormat(value)} style={{ width: '200px' }}>
        <Option value="txt">TXT</Option>
        <Option value="pdf">PDF</Option>
        <Option value="docx">DOCX</Option>
      </Select>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={handleExport}
        loading={loading}
        style={{ marginLeft: '16px' }}
      >
        Xuất Bản Tóm Tắt
      </Button>
    </div>
  );
};

export default ExportSummary;
