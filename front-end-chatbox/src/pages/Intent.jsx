import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Spin,
  Typography,
  Card,
  List,
  Divider,
} from "antd";
import axios from "axios";

const { Title } = Typography;

const IntentPage = () => {
  const [intents, setIntents] = useState([]);
  const [subIntents, setSubIntents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubIntentModalVisible, setIsSubIntentModalVisible] = useState(false);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [currentSubIntent, setCurrentSubIntent] = useState(null);
  const [form] = Form.useForm();
  const [subIntentForm] = Form.useForm();

  // State cho phân loại input
  const [inputText, setInputText] = useState("");
  const [classificationResult, setClassificationResult] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);

  // State cho khung chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [recommendationButtons, setRecommendationButtons] = useState([]);

  useEffect(() => {
    fetchIntents();
    fetchSubIntents();
  }, []);

  const fetchIntents = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/intents");
      setIntents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch intents", error);
      setIntents([]);
      message.error("Không thể tải danh sách intents");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubIntents = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/sub-intents");
      setSubIntents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch sub-intents", error);
      setSubIntents([]);
      message.error("Không thể tải danh sách sub-intents");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntent = () => {
    setCurrentIntent(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditIntent = (intent) => {
    setCurrentIntent(intent);
    form.setFieldsValue(intent);
    setIsModalVisible(true);
  };

  const handleDeleteIntent = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/intents/${id}`);
      message.success("Intent đã được xóa thành công");
      fetchIntents();
    } catch (error) {
      message.error("Xóa intent thất bại");
    }
  };

  const handleSubmitIntent = async (values) => {
    try {
      if (currentIntent) {
        await axios.put(`http://127.0.0.1:5000/intents/${currentIntent.id}`, values);
        message.success("Intent đã được cập nhật thành công");
      } else {
        await axios.post("http://127.0.0.1:5000/intents", values);
        message.success("Intent đã được tạo thành công");
      }
      fetchIntents();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Lưu intent thất bại");
    }
  };

  const handleAddSubIntent = (intent) => {
    setCurrentIntent(intent);
    setCurrentSubIntent(null);
    subIntentForm.resetFields();
    setIsSubIntentModalVisible(true);
  };

  const handleEditSubIntent = (subIntent) => {
    setCurrentSubIntent(subIntent);
    subIntentForm.setFieldsValue(subIntent);
    setIsSubIntentModalVisible(true);
  };

  const handleDeleteSubIntent = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/sub-intent/${id}`);
      message.success("Sub-Intent đã được xóa thành công");
      fetchSubIntents();
    } catch (error) {
      message.error("Xóa sub-intent thất bại");
    }
  };

  const handleSubmitSubIntent = async (values) => {
    try {
      if (currentSubIntent) {
        await axios.put(`http://127.0.0.1:5000/sub-intent/${currentSubIntent.id}`, values);
        message.success("Sub-Intent đã được cập nhật thành công");
      } else {
        await axios.post(`http://127.0.0.1:5000/${currentIntent.id}/sub-intent`, values);
        message.success("Sub-Intent đã được tạo thành công");
      }
      fetchSubIntents();
      setIsSubIntentModalVisible(false);
    } catch (error) {
      message.error("Lưu sub-intent thất bại");
    }
  };
  

  const handleSendMessage = async () => {
    if (!chatInput.trim()) {
      message.error("Vui lòng nhập nội dung tin nhắn!");
      return;
    }
    
    const userMessage = { sender: "user", text: chatInput, timestamp: new Date().toLocaleTimeString() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    
    try {
      const response = await axios.post("http://127.0.0.1:5000/predict-intent", { text: chatInput });
      const result = response.data;
      
      // Gửi tin nhắn hệ thống phản hồi lỗi
      let systemMessageText = result.response;
      const systemMessage = {
        sender: "system",
        text: systemMessageText,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      // Kiểm tra nếu response là 'Rất tiếc tôi không hiểu ý bạn muốn gì!'
      if (result.response === "Rất tiếc tôi không hiểu ý bạn muốn gì!") {
        setChatMessages((prev) => [...prev, systemMessage]);
  
        // Thêm gợi ý nếu có
        if (result.recommendations && result.recommendations.length > 0) {
          const suggestionMessage = {
            sender: "system",
            text: "Tôi không hiểu rõ yêu cầu của bạn. Bạn có thể chọn một trong những gợi ý dưới đây:",
            timestamp: new Date().toLocaleTimeString(),
          };
          setChatMessages((prev) => [...prev, suggestionMessage]);
  
          // Thêm các nút bấm vào giao diện
          setRecommendationButtons(result.recommendations);
        }
      } else {
        setChatMessages((prev) => [...prev, systemMessage]);
      }
      
    } catch (error) {
      const errorMessage = { sender: "system", text: "Có lỗi xảy ra, vui lòng thử lại!", timestamp: new Date().toLocaleTimeString() };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
      setChatInput("");
    }
  };
  
  const handleRecommendationClick = async (recommendation) => {
    setChatLoading(true);
  
    try {
      // Gửi yêu cầu tới API với gợi ý đã chọn
      const response = await axios.post("http://127.0.0.1:5000/predict-intent", { text: recommendation });
      const result = response.data;
  
      // Tạo tin nhắn phản hồi hệ thống sau khi chọn gợi ý
      const systemMessage = {
        sender: "system",
        text: result.response,
        timestamp: new Date().toLocaleTimeString(),
      };
  
      // Cập nhật tin nhắn với phản hồi của hệ thống
      setChatMessages((prev) => [...prev, systemMessage]);
  
    } catch (error) {
      const errorMessage = { sender: "system", text: "Có lỗi xảy ra, vui lòng thử lại!", timestamp: new Date().toLocaleTimeString() };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };
  

  const intentColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 20 },
    { title: "Label", dataIndex: "label", key: "label", width: 20 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (status ? "Active" : "Inactive"),
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <>
          <Button onClick={() => handleEditIntent(record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
          <Button onClick={() => handleDeleteIntent(record.id)} style={{ marginRight: 8 }} danger>
            Delete
          </Button>
          <Button onClick={() => handleAddSubIntent(record)}>Add Sub</Button>
        </>
      ),
    },
  ];

  const subIntentColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 20 },
    { title: "Label", dataIndex: "label", key: "label", width: 20 },
    { title: "Group", dataIndex: "group_label", key: "group_label", width: 120 },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <>
          <Button onClick={() => handleEditSubIntent(record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
          <Button onClick={() => handleDeleteSubIntent(record.id)} danger>
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Spin spinning={loading || classifyLoading}>
        {/* Phần Quản lý Intent */}
        <Card style={{ marginBottom: 24 }} title="Intent Management" bordered={false}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Button type="primary" onClick={handleAddIntent}>
              Add Intent
            </Button>
          </div>
          <Table
            dataSource={intents}
            columns={intentColumns}
            rowKey="id"
            pagination={{ pageSize: 7 }}
          />
        </Card>

        {/* Phần Quản lý Sub-Intent */}
        <Card style={{ marginBottom: 24 }} title="Sub-Intent Management" bordered={false}>
          <Table
            dataSource={subIntents}
            columns={subIntentColumns}
            rowKey="id"
            pagination={{ pageSize: 7 }}
          />
        </Card>
        <Divider />

      {/* Khung Chat */}
      <Card title="Chat">
        <div style={{ height: "300px", overflowY: "auto", backgroundColor: "#fafafa", padding: 8 }}>
          <List
            dataSource={chatMessages}
            renderItem={(msg) => (
              <List.Item style={{ justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: msg.sender === "user" ? "#1890ff" : "#e6e6e6",
                    color: msg.sender === "user" ? "#fff" : "#000",
                  }}
                >
                  <p>{msg.text}</p>
                  <span style={{ fontSize: "0.8em" }}>{msg.timestamp}</span>
                </div>
              </List.Item>
              
            )}
          />
          <div ref={chatEndRef} />
                  
        {/* Nút gợi ý */}
        {recommendationButtons.length > 0 && (
          <div style={{ marginTop: 0 }}>
            {recommendationButtons.map((recommendation, index) => (
              <Button 
                key={index} 
                style={{ marginTop: 2 }} 
                onClick={() => handleRecommendationClick(recommendation)}
              >
                {recommendation}
              </Button>
            ))}
          </div>
        )}
        </div>
        <div style={{ display: "flex", marginTop: 16 }}>
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            onPressEnter={handleSendMessage}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button type="primary" onClick={handleSendMessage}>
            Gửi
          </Button>
        </div>
      </Card>

        {/* Modal cho Intent */}
        <Modal
          title={currentIntent ? "Edit Intent" : "Add Intent"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => form.submit()}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmitIntent}>
            <Form.Item
              name="label"
              label="Label"
              rules={[{ required: true, message: "Label is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="status" label="Status" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal cho Sub-Intent */}
        <Modal
          title={currentSubIntent ? "Edit Sub-Intent" : "Add Sub-Intent"}
          open={isSubIntentModalVisible}
          onCancel={() => setIsSubIntentModalVisible(false)}
          onOk={() => subIntentForm.submit()}
        >
          <Form form={subIntentForm} layout="vertical" onFinish={handleSubmitSubIntent}>
            <Form.Item
              name="label"
              label="Label"
              rules={[{ required: true, message: "Label is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="document"
              label="Document"
              rules={[{ required: true, message: "Document is required" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </Spin>
    </div>
  );
};

export default IntentPage;