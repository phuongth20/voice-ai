import React, { useEffect, useState } from "react";
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
  Divider,
} from "antd";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
const { Title } = Typography;

const NerPage = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState(null);
  const [form] = Form.useForm();

  // State dành cho phân loại input (NER Process)
  const [inputText, setInputText] = useState("");
  const [nerResult, setNerResult] = useState(null); // Lưu kết quả NER
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [endCodeResult, setendCodeResult] = useState(null); // Lưu kết quả NER

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5001/key");
      setKeywords(
        Array.isArray(response.data.keywords) ? response.data.keywords : []
      );
    } catch (error) {
      console.error("Failed to fetch keywords", error);
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentKeyword(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (keyword) => {
    setCurrentKeyword(keyword);
    form.setFieldsValue(keyword);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5001/key/${id}`);
      message.success("Keyword deleted successfully");
      fetchKeywords();
    } catch (error) {
      message.error("Failed to delete keyword");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (currentKeyword) {
        await axios.put(
          `http://127.0.0.1:5001/key/${currentKeyword.id}`,
          values
        );
        message.success("Keyword updated successfully");
      } else {
        await axios.post("http://127.0.0.1:5001/key", values);
        message.success("Keyword created successfully");
      }
      fetchKeywords();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save keyword");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 20 },
    { title: "Entity", dataIndex: "entity", key: "entity", width: 20 },
    { title: "Type", dataIndex: "entity_type", key: "entity_type", width: 30 },
    {
      title: "Value",
      dataIndex: "encoded_value",
      key: "encoded_value",
      width: 30,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <>
          <Button onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
          <Button
            className="cancel-button"
            onClick={() => handleDelete(record.id)}
            style={{ marginRight: 8 }}
            danger
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const handleClassify = async () => {
    if (!inputText) {
      message.error("Please enter text to classify.");
      return;
    }
    setClassifyLoading(true);
    try {
      // Gửi văn bản đến backend để thực hiện NER và mã hóa
      const response = await axios.post("http://127.0.0.1:5001/ner-process", {
        text: inputText,
      });
      setNerResult(response.data);
    } catch (error) {
      message.error("Unable to classify text.");
    } finally {
      setClassifyLoading(false);
    }
  };

  const handleEncode = async () => {
    if (!inputText) {
      message.error("Please enter text to encode.");
      return;
    }
    setClassifyLoading(true);
    try {
      // Gửi văn bản đến backend để thực hiện NER và mã hóa
      const response = await axios.post("http://127.0.0.1:5001/encode-text", {
        text: inputText,
        ner_results :nerResult.data
      });
      setendCodeResult(response.data);
    } catch (error) {
      message.error("Unable to classify text.");
    } finally {
      setClassifyLoading(false);
    }
  };


  const processContent = (content) => {
    const regex = /\*\*(.*?)\*\*\s*\(\*\*(.*?)\*\*\)/g;

    const replaced = content.replace(regex, (match, p1, p2) => {
      return `<span className="entity entity-${p2}">**${p1}**</span> (**${p2}**)`;
    });

    return replaced;
  };

  return (
    <div
      className="h-screen"
      style={{ padding: 24, backgroundColor: "#f0f2f5", height: "auto" }}
    >
      <Spin spinning={loading || classifyLoading}>
        {/* Phần Quản lý keyword */}
        <Card
          style={{ marginBottom: 24 }}
          title="Keyword Management"
          bordered={false}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <Button
              className="record-button"
              type="primary"
              onClick={handleAdd}
            >
              Add keyword
            </Button>
          </div>
          <Table
            dataSource={keywords}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 7 }}
          />
        </Card>
        <Divider />

        {/* Phần NER Process */}
        <Card title="NER Process" bordered={false}>
          <div style={{ marginBottom: 16 }}>
            <Input.TextArea
              rows={4}
              placeholder="Enter text to classify..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          <div>
            <Button  className="record-button" type="primary" onClick={handleClassify} style={{marginRight: 20}}>
              Process NER
            </Button>
            <Button  className="record-button" type="primary" onClick={handleEncode}>
              Encode NER
            </Button>
          </div>
         
        </Card>
        <Card style={{ marginTop: 24 }} title="NER Response" bordered={false}>
          {nerResult && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#fafafa",
                borderRadius: 4,
              }}
            >
              <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {processContent(nerResult.data)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
         
        </Card>
        <Card style={{ marginTop: 24 }} title="NER Encode" bordered={false}>
        {endCodeResult && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#fafafa",
                borderRadius: 4,
              }}
            >
              <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {processContent(endCodeResult.encoded_text)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </Card>

        <Modal
          title={currentKeyword ? "Edit keyword" : "Add keyword"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => form.submit()}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="entity"
              label="Entity"
              rules={[{ required: true, message: "Entity is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="entity_type"
              label="Entity Type"
              rules={[{ required: true, message: "Entity Type is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="encoded_value"
              label="Encoded Value"
              rules={[{ required: true, message: "Encoded Value is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="status" label="Status" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Spin>
    </div>
  );
};

export default NerPage;
