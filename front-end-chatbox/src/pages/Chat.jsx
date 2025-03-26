import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Spin,
  message as antdMessage,
  Button,
  Dropdown,
  Menu,
} from "antd";
import ChatInputBar from "../components/ChatInputBar";
import MessageList from "../components/MessageList";
import HistoryList from "../components/HistoryList";
import { DownOutlined } from "@ant-design/icons";
import moment from "moment";
import axios from "axios";
import { io } from "socket.io-client";

const { Sider, Content } = Layout;
const SOCKET_SERVER_URL = "http://localhost:5000"; 

const ChatPage = () => {
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef(null);
  const socketRef = useRef(null);
  
    useEffect(() => {
      // Khởi tạo kết nối Socket.IO khi component được mount
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ["websocket"],
      });
  
      socketRef.current.on("connect", () => {
        console.log("Đã kết nối với Socket.IO server");
        antdMessage.success("Đã kết nối với server.");
      });
  
      socketRef.current.on("disconnect", () => {
        console.log("Đã ngắt kết nối với Socket.IO server");
        antdMessage.warning("Đã ngắt kết nối với server.");
      });
  
      socketRef.current.on("chat_response", (data) => {

        const assistantMessage = {
          role: "assistant",
          content: data.summary,
          timestamp: moment().format("HH:mm"),
          response_date: data.response_date,
          summaryFileUrl: data.summaryFileUrl || null,
          recommend: data.recommend
        };
        setMessages((prev) => [...prev, assistantMessage]);
  
        if (messageEndRef.current) {
          messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        setLoading(false)
      });


      socketRef.current.on("history_inserted", (data) => {
        const { history_id } = data;
        setSelectedHistory(history_id);
        // Ta fetch để lấy conversation (vì ban đầu rỗng)
        fetchConversation(history_id);
      
        // Thêm 1 useEffect hoặc logic chờ fetch xong, nếu fetch trả về rỗng => hiển thị chào mừng
        antdMessage.success("Tạo phiên trò chuyện mới thành công.");
      });
      
  
      socketRef.current.on("export_ready", (data) => {
        const { file_url } = data;
        window.open(file_url, "_blank");
        antdMessage.success("Xuất trò chuyện thành công.");
      });
  
    socketRef.current.on("conversation", (data) => {
      const { conversation } = data;
    
      console.log("Conversation data:", data);
      if (conversation && Array.isArray(conversation)) {
        // Nếu rỗng, set tin nhắn chào mừng rồi return luôn
        if (conversation.length === 0) {
          setMessages([
            {
              role: "assistant",
              content: "Chào bạn! Tôi có thể hỗ trợ gì cho bạn hôm nay?",
              timestamp: moment().format("HH:mm"),
            },
          ]);
          setLoading(false);
          return; // <-- Kết thúc sớm, không chạy tiếp
        }
      }

      if (conversation && Array.isArray(conversation)) {
        const combinedMessages = [];
    
        conversation.forEach((item) => {
          if (item.question) {
            const userMsg = {
              role: "user",
              content: item.question,
              timestamp: item.question_date
                ? moment(item.question_date).format("HH:mm")
                : "",
            };
            combinedMessages.push(userMsg);
            console.log("Processed user message:", userMsg);
          }
    
          if (item.response) {
            let assistantContent = item.response;
            let role = "assistant";
    
            const assistantMsg = {
              role: role,
              content: assistantContent,
              timestamp: item.response_date
                ? moment(item.response_date).format("HH:mm")
                : "",
              file_content: item.file_content || null,
              response_date: item.response_date || null,
              summaryFileUrl: item.summaryFileUrl || null,
            };
            combinedMessages.push(assistantMsg);
            console.log("Processed assistant message:", assistantMsg);
          }
        });
    
        setMessages(combinedMessages);
      }
      setLoading(false);
    });
  
      socketRef.current.on("error", (error) => {
        console.error(error);
        antdMessage.error("Đã có lỗi xảy ra.");
        setLoading(false);
      });
  
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }, []);
    const fetchConversation = (historyId) => {
      if (!historyId) return;
      setLoading(true);
      setMessages([]);
  
      socketRef.current.emit("get_conversation", { history_id: historyId });
    };
  
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);



  const onCreateHistory = () => {
    setIsModalVisible(true);
  };

  const onSelectHistory = (historyId) => {
    setSelectedHistory(historyId);
    fetchConversation(historyId);
  };


  const handleCancel = () => {
    setIsModalVisible(false);
    setNewHistoryName("");
  };

  const onSendMessage = (text, file) => {
    if (!selectedHistory) {
      antdMessage.warning("Vui lòng chọn một phiên trò chuyện trước.");
      return;
    }
    if (!text.trim() && !file) {
      antdMessage.warning("Vui lòng nhập tin nhắn hoặc đính kèm tệp.");
      return;
    }
    setLoading(true);

    // Tạo đối tượng tin nhắn của người dùng
    const userMessage = {
      role: "user",
      content: text,
      timestamp: moment().format("HH:mm"),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Tạo đối tượng dữ liệu để gửi
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Tách lấy phần base64 
        const base64Data = event.target.result.split(",")[1];
        const fileData = {
          filename: file.name,
          data: base64Data, 
        };
  
        // Gửi lên server qua socket:
        socketRef.current.emit("chat", {
          message: text,
          history_id: selectedHistory,
          file: fileData,
        });

        console.log(fileData)
      };
      reader.readAsDataURL(file);
    } else {
      // Không có file => chỉ gửi message
      socketRef.current.emit("chat", {
        message: text,
        history_id: selectedHistory,
        file: null,
      });
    }
  };

  const exportConversation = async (format) => {
    if (!selectedHistory) {
      antdMessage.warning("Vui lòng chọn một phiên trò chuyện trước.");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/export",
        { type: "conversation", history_id: selectedHistory, format: format },
        { responseType: "blob" }
      );

      if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `conversation_history.${format === "json" ? "json" : format}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        antdMessage.success(
          `Xuất trò chuyện thành công dưới dạng ${format.toUpperCase()}.`
        );
      } else {
        antdMessage.error("Đã có lỗi xảy ra khi xuất trò chuyện.");
      }
    } catch (error) {
      console.error("Error exporting conversation:", error);
      antdMessage.error("Đã có lỗi xảy ra khi xuất trò chuyện.");
    }
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="json" onClick={() => exportConversation("json")}>
        JSON
      </Menu.Item>
      <Menu.Item key="txt" onClick={() => exportConversation("txt")}>
        TXT
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Khu vực chat */}
      <Layout>
        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "24px",
            overflowY: 'auto'
          }}
        >
          {/* Vùng tin nhắn */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "16px",
            }}
          >
            {/* {loading ? (
              <Spin tip="Đang tải..." />
            ) : ( */}
              <MessageList messages={messages} />
            {/* )} */}
            <div ref={messageEndRef} /> 
          </div>

          {/* Thanh nhập tin nhắn nằm trong khung chat, luôn ở cuối */}
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ChatInputBar onSendMessage={onSendMessage} loading={loading} />
              {/* <Dropdown overlay={exportMenu}>
                <Button>
                  Xuất Trò Chuyện <DownOutlined />
                </Button>
              </Dropdown> */}
            </div>
          </div>
        </Content>
      </Layout>
      {/* Sidebar */}
      <div>
      <Sider
        width={300}
        style={{
          background: "#f5f5f5",
          borderRight: "1px solid #d9d9d9",
          overflowY: "auto",
          padding:"25px 20px 20px 0px"
        }}
      >
        <HistoryList
          onSelectHistory={onSelectHistory}
          onCreateHistory={onCreateHistory}
        />
      </Sider>
      </div>

    </Layout>
  );
};

export default ChatPage;
