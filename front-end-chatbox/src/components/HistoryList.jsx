// src/components/HistoryList.jsx

import React, { useEffect, useState } from "react";
import { List, Button, Spin, message as antdMessage, Modal, Input } from "antd";
import axios from "axios";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types'; 
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; 

const HistoryList = ({ onSelectHistory }) => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingHistory, setCreatingHistory] = useState(false);
  const [newHistoryName, setNewHistoryName] = useState("");
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    // Khởi tạo kết nối Socket.IO khi component được mount
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    // Lắng nghe sự kiện nhận danh sách lịch sử trò chuyện
    newSocket.on("histories", (data) => {
      if (data && data.histories) {
        setHistories(data.histories);
      }
      setLoading(false);
    });

    // Lắng nghe sự kiện lỗi
    newSocket.on("error", (error) => {
      console.error(error);
      antdMessage.error("Đã có lỗi xảy ra.");
      setLoading(false);
    });

    // Lắng nghe sự kiện khi tạo lịch sử thành công
    newSocket.on("history_inserted", (data) => {
      const { history_id } = data;
      setHistories((prev) => [...prev, { id: history_id, name: newHistoryName, date: new Date() }]);
      antdMessage.success("Tạo phiên trò chuyện mới thành công.");
      setCreatingHistory(false);
      setNewHistoryName("");
      onSelectHistory(history_id);
    });

    // Gửi sự kiện để lấy danh sách lịch sử trò chuyện
    fetchHistories(newSocket);

    // Dọn dẹp kết nối khi component unmount
    return () => {
      newSocket.disconnect();
    };
  }, [newHistoryName, onSelectHistory]);

  const fetchHistories = (currentSocket) => {
    setLoading(true);
    currentSocket.emit("get_histories");
  };

  const createNewHistory = () => {
    setCreatingHistory(true);
  };

  const handleCreateHistory = () => {
    if (!newHistoryName.trim()) {
      antdMessage.warning("Tên phiên trò chuyện không được để trống.");
      return;
    }
    // Gửi sự kiện để tạo phiên trò chuyện mới
    socket.emit("insert_history", { history_name: newHistoryName.trim() });
  };

  const handleCancelCreateHistory = () => {
    setCreatingHistory(false);
    setNewHistoryName("");
  };

  return (
    <div className="sider-llm" style={{ padding: "16px" }}>
      <div className="title-history">
      <div  >
         <span>Lịch sử</span>
      </div>
      <div style={{ display: "flex", justifyContent: "end", marginBottom: "16px" }}>
        <div
          className="btn-llm"
          onClick={createNewHistory}
        >
          <PlusOutlined />
        </div>
        <div
          className="btn-llm"
          onClick={fetchHistories}
        >
          <ReloadOutlined />
        </div>
      </div>
      </div>

      {loading ? (
        <Spin />
      ) : (
        <List
          className="list-history"
          itemLayout="horizontal"
          dataSource={histories}
          locale={{ emptyText: "Không có phiên trò chuyện nào." }}
          renderItem={(item) => (
            <List.Item
              style={{ padding: "8px 0"}}
              onClick={() => onSelectHistory(item.id)}
            >
              <List.Item.Meta
                
                title={item.name}
                description={new Date(item.date).toLocaleString()}
              />
            </List.Item>
          )}
        />
      )}
      <Modal
        title="Tạo Phiên Trò Chuyện Mới"
        visible={creatingHistory}
        onOk={handleCreateHistory}
        onCancel={handleCancelCreateHistory}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Input
          placeholder="Tên phiên trò chuyện"
          value={newHistoryName}
          onChange={(e) => setNewHistoryName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

HistoryList.propTypes = {
  onSelectHistory: PropTypes.func.isRequired,
};

export default HistoryList;
