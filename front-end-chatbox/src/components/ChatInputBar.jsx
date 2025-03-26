import React, { useState } from "react";
import { PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import {
  Tooltip,
  Upload,
  Button,
  message as antMessage
} from "antd";
import PropTypes from "prop-types";

const ChatInputBar = ({ loading, onSendMessage }) => {
  const [messageText, setMessageText] = useState("");
  const [fileList, setFileList] = useState([]);

  // Hàm xử lý gửi tin nhắn
  const handleSend = () => {
    // Nếu không có message và không có file
    if (!messageText.trim() && fileList.length === 0) {
      antMessage.warning("Vui lòng chọn tệp hoặc nhập tin nhắn trước khi gửi.");
      return;
    }

    // Nếu có file mà message trống => gán message mặc định
    const file = fileList.length > 0 ? fileList[0].originFileObj : null;
    let finalText = messageText.trim();
    if (file && !finalText) {
      finalText = "Đã gửi 1 tệp";
    }

    // Gửi lên parent
    onSendMessage(finalText, file);

    // Reset
    setMessageText("");
    setFileList([]);
  };

  // Hàm xử lý file
  const handleFileChange = ({ fileList: newFileList }) => {
    // Giữ lại tối đa 1 file
    const lastFile = newFileList.slice(-1);
    setFileList(lastFile);

    // Mỗi lần người dùng chọn file, xóa message (nếu có)
    // Hoặc set sẵn "Đã gửi 1 tệp" ở đây (tuy nhiên ta đang set khi người dùng ấn Gửi)
    setMessageText("");
  };

  // Loại bỏ file
  const handleRemove = () => {
    setFileList([]);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#f5f5f5",
        border: "1px solid #d9d9d9",
        borderRadius: "24px",
        padding: "8px 16px",
        width: "100%"
      }}
    >
      {/* Nút đính kèm tệp */}
      <Tooltip title="Đính kèm tệp">
        <Upload
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          beforeUpload={() => false} // Ngăn chặn upload tự động
          onChange={handleFileChange}
          fileList={fileList}
          onRemove={handleRemove}
          maxCount={1}
        >
          <Button icon={<PaperClipOutlined />} disabled={loading} />
        </Upload>
      </Tooltip>

      {/* Nếu chưa có file => hiện ô nhập tin nhắn, nếu có file => ẩn nó */}
      {fileList.length === 0 ? (
        <input
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "14px"
          }}
          placeholder="Nhập tin nhắn..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      ) : (
        // Nếu đã chọn file => hiển thị thông tin tệp
        <div
          style={{
            flex: 1,
            color: "#999",
            fontStyle: "italic"
          }}
        >
          Đã chọn tệp: {fileList[0].name}
        </div>
      )}

      {/* Nút gửi tin nhắn */}
      <Tooltip title="Gửi">
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={loading}
        />
      </Tooltip>
    </div>
  );
};

ChatInputBar.propTypes = {
  loading: PropTypes.bool.isRequired,
  onSendMessage: PropTypes.func.isRequired
};

export default ChatInputBar;
