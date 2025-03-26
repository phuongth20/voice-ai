import React, { useState } from "react";
import { Radio, Button, Upload, Form, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OCRForm = () => {
  const [ocrType, setOcrType] = useState("tesseract"); // Mặc định là Tesseract
  const [file, setFile] = useState(null);
  const navigate = useNavigate(); // Sử dụng useNavigate để điều hướng

  // Xử lý khi upload file
  const handleFileUpload = (info) => {
    setFile(info.file.originFileObj); // Lưu file để gửi tới API
  };

  // Xử lý khi bấm Process OCR
  const handleProcessOCR = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("image", file); // Thêm file ảnh
      formData.append("ocrType", ocrType); // Thêm loại OCR mà người dùng chọn

      setLoading(true); // Hiển thị trạng thái loading (nếu cần)

      try {
        // Gửi yêu cầu tới API OCR
        const response = await axios.post('http://localhost:9000/auth/test-ocr', formData);

        // Lấy kết quả OCR từ API
        const ocrResults = response.data.data;

        // Điều hướng tới trang scan và truyền dữ liệu OCR qua state
        navigate("/scan", { state: { ocrResults } });
      } catch (error) {
        message.error("Có lỗi xảy ra khi xử lý OCR.");
      } finally {
        setLoading(false); // Tắt trạng thái loading sau khi xử lý xong
      }
    } else {
      message.error("Vui lòng tải lên file để xử lý OCR.");
    }
  };

  return (
    <div className="ocr-modal">
      <div className="ocr-title">Chọn loại OCR</div>

      <Form layout="vertical">
        <Form.Item label="Chọn loại OCR" className="ocr-form-item">
          <Radio.Group
            value={ocrType}
            onChange={(e) => setOcrType(e.target.value)}
            className="input-icon"
          >
            <Radio value="easy">EasyOCR</Radio>
            <Radio value="tesseract">Tesseract</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Tải lên hình ảnh" className="ocr-form-item upload-section">
          <Upload
            name="file"
            beforeUpload={() => false}
            onChange={handleFileUpload}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>

        <Form.Item className="process-button">
          <Button
            type="primary"
            onClick={handleProcessOCR}
            disabled={!file} 
          >
            Process OCR
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default OCRForm;
