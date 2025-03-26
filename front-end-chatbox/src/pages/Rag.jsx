import React, { useState } from "react";
import { Input, Button, Space, message, Typography, Card, Table,Tooltip } from "antd";
import { SendOutlined } from "@ant-design/icons";
import axios from "axios";
const { TextArea } = Input;
const { Title } = Typography;

const RagPage = () => {
  const [path, setPath] = useState("");
  const [queryResponse, setQueryResponse] = useState([]);
  const [embedding, setEmbedding] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractSuccess, setIsExtractSuccess] = useState(false); // Trạng thái kiểm tra khi extract thành công
  const [documentIds, setDocumentIds] = useState([]); // Lưu trữ danh sách document ids
  const [showChat, setShowChat] = useState(false); // Trạng thái kiểm tra hiển thị khung chat
  const [userMessage, setUserMessage] = useState(""); // Trạng thái lưu trữ tin nhắn người dùng nhập vào
  const [response, setResponse] = useState(null); // Lưu trữ câu trả lời và tài liệu tìm được từ API

  // Gửi path và gọi API
  const handleSend = async () => {
    if (!path) {
      message.warning("Vui lòng nhập path!");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5001/extract_folder", { path });
      if (response.data && response.data.data) {
        setQueryResponse(response.data.data); // Lưu dữ liệu trả về vào state
        setDocumentIds(response.data.data.map((item) => item.id)); // Lưu danh sách document ids
        setIsExtractSuccess(true); // Đánh dấu extract thành công
      } else {
        setQueryResponse([]); // Xử lý trường hợp không có dữ liệu
        message.error("Không có dữ liệu trả về từ API.");
      }
    } catch (error) {
      setIsExtractSuccess(false); // Đánh dấu nếu có lỗi khi extract
      setQueryResponse([]);
      message.error("Không thể gửi dữ liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Chuyển đổi query thành embedding
  const handleConvertToEmbedding = async () => {
    if (!documentIds.length) {
      message.warning("Chưa có document ID. Vui lòng gửi path trước.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5002/process_embeddings", {
        document_ids: documentIds, // Truyền danh sách document ids
      });
      setEmbedding(response.data.embedding); // Giả sử API trả embedding      
      // Sau khi process embeddings thành công, ẩn bảng và hiển thị phần chat
      setShowChat(true);
    } catch (error) {
      message.error("Không thể chuyển đổi thành embedding.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi tin nhắn chat và nhận câu trả lời
  // Cắt chuỗi text chỉ lấy tối đa 20 từ
  const truncateText = (text) => {
    const words = text.split(' ');
    return words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');
  };

  // Cấu hình cột cho bảng
  const columns = [
    { title: "Id", dataIndex: "id", key: "id" },
    { title: "Page", dataIndex: ["metadata", "page"], key: "page" },  // Truy cập page từ metadata
    { title: "Source", dataIndex: ["metadata", "source"], key: "source" },  // Truy cập source từ metadata
    { 
      title: "Text", 
      dataIndex: "text", 
      key: "text",
      render: (text) => truncateText(text)  // Sử dụng hàm truncateText để cắt text
    },
  ];
  const handleChat = async () => {
    if (userMessage.trim()) {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { sender: "User", text: userMessage },
      ]);
      setUserMessage(""); // Clear input after sending message
      // Gửi tin nhắn đến API chat và nhận phản hồi
      try {
        const response = await axios.post("http://127.0.0.1:5003/retrieve", {
          message: userMessage,
        });
        const { answer, document_search } = response.data;
        setResponse({ answer, document_search }); // Cập nhật câu trả lời và tài liệu tìm được
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { sender: "System", text: answer },
        ]);
      } catch (error) {
        message.error("Lỗi khi gửi tin nhắn.");
      }
    }
  };

  return (
    <div className="h-screen" style={{ padding: "20px",height: "800px" }}>
      <Title level={2} style={{ textAlign: "center" }}>RAG Interface</Title>

      {/* Path Input and Send Button */}
      {!showChat && !embedding && (
        <div  style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="Nhập path folder..."
            style={{ width: "300px" }}
          />
          <Button
            className="record-button"
            type="primary"
            onClick={handleSend}
            loading={isLoading}
            icon={<SendOutlined />}
            style={{ width: "100px" }}
            disabled={isExtractSuccess} // Disable after embedding
          >
            Send
          </Button>
        </div>
      )}

      {/* Query Response - Table */}
      {queryResponse.length > 0 && !showChat && !embedding && (
        <Card title="Query Response" style={{ marginBottom: "20px" }}>
          <Table 
            dataSource={queryResponse} 
            columns={columns} 
            rowKey={(record) => record.metadata.source + record.metadata.page} 
          />
        </Card>
      )}

      {/* Convert to Embedding Button */}
      {isExtractSuccess && !showChat && !embedding && (
        <Button
          className="record-button"
          type="primary"
          onClick={handleConvertToEmbedding}
          loading={isLoading}
          style={{ marginBottom: "20px", width: "200px", marginLeft: "auto", marginRight: "auto" }}
        >
          Convert to Embedding
        </Button>
      )}

      {/* Embedding */}
      {embedding && (
        <Card title="Embedding" style={{ marginBottom: "20px" }}>
          <pre>{JSON.stringify(embedding, null, 2)}</pre>
        </Card>
      )}

      {/* Chat Section */}
      {showChat && (
        <div style={{ marginBottom: "20px" }}>
          <TextArea
            rows={4}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Gửi tin nhắn..."
            style={{ width: "100%" }}
          />
          <Button
            type="primary"
            onClick={handleChat}
            style={{ marginTop: "10px", width: "100%" }}
            disabled={!userMessage.trim()}
            icon={<SendOutlined />}

          >
            Send Chat
          </Button>
        </div>
      )}

      {/* Display Chat Messages */}
      <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px" }}>
        {chatMessages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px", backgroundColor: msg.sender === "User" ? "#f0f0f0" : "#e0f7fa", padding: "10px", borderRadius: "8px" }}>
            <strong>{msg.sender}:</strong>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Display Answer and Documents */}
      {response && (
        <div style={{ marginTop: "20px" }}>
          <Card title="Document Search" style={{ marginTop: "10px" }}>
            <ul>
              {response.document_search.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RagPage;
