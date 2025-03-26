import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Upload,
  Card,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const MetadataPage = () => {
  // State lưu trữ file_id và fileName
  const [idFile, setIdFile] = useState("");
  const [fileName, setFileName] = useState("");

  const [metadataCustom, setMetadataCustom] = useState({});
  const [metadataDefault, setMetadataDefault] = useState({});
  const [loading, setLoading] = useState(false);

  // State cho Modal, currentProp dùng chung cho cả default và custom
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProp, setCurrentProp] = useState(null); // Nếu null thì là thêm mới
  const [currentEditingType, setCurrentEditingType] = useState(null); // "custom" hoặc "default"
  const [form] = Form.useForm();

  // Xử lý upload file để lấy metadata
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/read_metadata",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMetadataCustom(response.data.metadata_custom || {});
      setMetadataDefault(response.data.metadata_default || {});
      setIdFile(response.data.file_id);
      setFileName(response.data.filename);
      message.success("Metadata loaded successfully");
    } catch (error) {
      message.error("Failed to load metadata");
    } finally {
      setLoading(false);
    }
    // Ngăn hành vi upload mặc định của antd
    return false;
  };

  // ============ Các hàm xử lý cho Custom Metadata ============
  const handleAddCustom = () => {
    setCurrentProp(null);
    setCurrentEditingType("custom");
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditCustom = (key, prop) => {
    setCurrentProp({ key, ...prop });
    setCurrentEditingType("custom");
    form.setFieldsValue({ ...prop });
    setModalVisible(true);
  };



  // ============ Các hàm xử lý cho Default Metadata ============
  const handleAddDefault = () => {
    setCurrentProp(null);
    setCurrentEditingType("default");
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditDefault = (key, prop) => {
    setCurrentProp({ key, ...prop });
    setCurrentEditingType("default");
    form.setFieldsValue({ ...prop });
    setModalVisible(true);
  };

  const handleDeleteDefault = (key) => {
    Modal.confirm({
      title: "Are you sure you want to delete this property?",
      onOk: () => {
        const newMetadata = { ...metadataDefault };
        delete newMetadata[key];
        setMetadataDefault(newMetadata);
        message.success("Property deleted successfully");
      },
    });
  };

  // Khi submit modal:
  // Nếu là custom property, gọi API add_custom_properties ngay với payload gồm { file_id, custom_properties }
  const handleModalSubmit = async (values) => {
    if (currentEditingType === "custom") {
      const newMetadata = { ...metadataCustom };
      const key = currentProp ? currentProp.key : values.Name;
      // Giả sử tất cả custom property là kiểu string
      newMetadata[key] = { Name: values.Name, Value: values.Value, Type: "str" };

      if (!idFile) {
        message.error("No file to update. Please upload a file first.");
        return;
      }
      setLoading(true);
      try {
        const payload = {
          file_id: idFile,
          custom_properties: newMetadata,
        };
        const response = await axios.post(
          "http://127.0.0.1:5000/api/add_custom_properties",
          payload
        );
        setMetadataCustom(response.data.metadata_custom || {});
        setMetadataDefault(response.data.metadata_default || {});
        message.success("Custom property added successfully");
      } catch (error) {
        message.error("Failed to add custom property");
      } finally {
        setLoading(false);
      }
    } else if (currentEditingType === "default") {
      const newMetadata = { ...metadataDefault };
      const key = currentProp ? currentProp.key : values.Name;
      newMetadata[key] = { ...values };
      setMetadataDefault(newMetadata);
      message.success("Default property saved locally. Click 'Update Default Metadata' to push changes.");
    }
    setModalVisible(false);
  };

  // Hàm gọi API cập nhật metadata mặc định (nếu cần)
  const handleUpdateDefault = async () => {
    if (!idFile) {
      message.error("No file to update. Please upload a file first.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        file_id: idFile,
        metadata_default: metadataDefault,
      };
      const response = await axios.post(
        "http://127.0.0.1:5000/api/update_metadata_default",
        payload
      );
      // Sau khi cập nhật, nhận lại metadata mới từ backend
      setMetadataDefault(response.data.metadata_default || {});
      setMetadataCustom(response.data.metadata_custom || {});
      message.success("Default metadata updated successfully");
    } catch (error) {
      message.error("Failed to update default metadata");
    } finally {
      setLoading(false);
    }
  };


    // ============ Các hàm xử lý cho Custom Metadata ============

    const handleDeleteCustom = (key) => {
      Modal.confirm({
        title: "Are you sure you want to delete this property?",
        onOk: async () => {
          setLoading(true);
          try {
            const response = await axios.post(
              "http://127.0.0.1:5000/api/delete_custom_properties",
              {
                file_id: idFile,
                custom_properties: [key],
              }
            );
            // Cập nhật metadata sau khi xóa
            setMetadataCustom(response.data.metadata_custom || {});
            setMetadataDefault(response.data.metadata_default || {});
            message.success("Property deleted successfully");
          } catch (error) {
            message.error("Failed to delete property");
          } finally {
            setLoading(false);
          }
        },
      });
    };

  // Chuyển object metadata thành mảng dữ liệu cho Table
  const customDataSource = Object.keys(metadataCustom).map((key) => ({
    key,
    ...metadataCustom[key],
  }));

  const defaultDataSource = Object.keys(metadataDefault).map((key) => ({
    key,
    ...metadataDefault[key],
  }));

  // Định nghĩa cột cho bảng Custom Metadata (có hành động)
  const customColumns = [
    { title: "Name", dataIndex: "Name", key: "Name" },
    { title: "Type", dataIndex: "Type", key: "Type" },
    { title: "Value", dataIndex: "Value", key: "Value" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button onClick={() => handleEditCustom(record.key, record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
          <Button onClick={() => handleDeleteCustom(record.key)} danger>
            Delete
          </Button>
        </>
      ),
    },
  ];

  // Định nghĩa cột cho bảng Default Metadata (có hành động)
  const defaultColumns = [
    { title: "Name", dataIndex: "Name", key: "Name" },
    { title: "Type", dataIndex: "Type", key: "Type" },
    { title: "Value", dataIndex: "Value", key: "Value" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button onClick={() => handleEditDefault(record.key, record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      {/* Upload Metadata */}
      <Card title="Metadata Loader" bordered={false} style={{ marginBottom: 24 }}>
        <Upload beforeUpload={handleFileUpload} maxCount={1} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Upload Metadata File</Button>
        </Upload>
      </Card>

      {/* Default Metadata với nút Update bên cạnh tiêu đề */}
      <Card
        title="Default Metadata"
        extra={
          <Button type="primary" onClick={handleUpdateDefault}>
            Update Default Metadata
          </Button>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        <Table dataSource={defaultDataSource} columns={defaultColumns} rowKey="key" pagination={false} loading={loading} />
      </Card>

      {/* Custom Metadata với nút Add và Update bên cạnh tiêu đề */}
      <Card
        title="Custom Metadata"
        extra={
          <>
            <Button type="primary" onClick={handleAddCustom} style={{ marginRight: 8 }}>
              Add Custom Property
            </Button>
            {/* Nếu muốn cập nhật toàn bộ custom properties từ state thông qua 1 nút riêng thì có thể bổ sung */}
          </>
        }
        bordered={false}
      >
        <Table dataSource={customDataSource} columns={customColumns} rowKey="key" pagination={false} loading={loading} />
      </Card>

      {/* Modal dùng chung cho cả Default và Custom */}
      <Modal
        title={
          currentProp
            ? `Edit ${currentEditingType === "custom" ? "Custom" : "Default"} Property`
            : `Add ${currentEditingType === "custom" ? "Custom" : "Default"} Property`
        }
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item name="Name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="Value" label="Value" rules={[{ required: true, message: "Value is required" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MetadataPage;
