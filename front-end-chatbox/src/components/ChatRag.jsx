import React, { useState } from "react";
import { Input, Button, Space, Typography, Card } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title } = Typography;

const ChatRag = () => {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hàm gửi tin nhắn
  const handleSendMessage = () => {
    if (!message) {
      return; // Nếu không có tin nhắn, không làm gì
    }

    setIsLoading(true);

    // Thêm tin nhắn của người dùng vào chat
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { sender: "User", text: message },
    ]);

    // Giả sử API trả lời với một phản hồi tự động
    setTimeout(() => {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { sender: "System", text: `Response: ${message}` },
      ]);
      setIsLoading(false);
    }, 1000); // Mô phỏng delay từ API
    setMessage(""); // Reset lại input
  };

  return (
    <div style={styles.container}>
      <Title level={2}>Chat Interface</Title>

      {/* Hiển thị các tin nhắn trong chat */}
      <div style={styles.chatContainer}>
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              backgroundColor: msg.sender === "User" ? "#d1e7fd" : "#f1f1f1",
            }}
          >
            <strong>{msg.sender}:</strong> <span>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Khung nhập tin nhắn */}
      <Space style={styles.inputContainer}>
        <TextArea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.textArea}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={isLoading}
          disabled={isLoading || !message}
          style={styles.sendButton}
        >
          Send
        </Button>
      </Space>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  chatContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  message: {
    padding: "8px 12px",
    margin: "8px 0",
    borderRadius: "4px",
    wordBreak: "break-word",
    maxWidth: "80%",
  },
  inputContainer: {
    display: "flex",
    justifyContent: "space-between",
  },
  textArea: {
    width: "80%",
    marginRight: "10px",
  },
  sendButton: {
    width: "18%",
    minWidth: "80px",
  },
};

export default ChatRag;
