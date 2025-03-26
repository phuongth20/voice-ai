import React, { useState, useEffect } from "react";
import { Table, Button, Select, Popconfirm, message, Spin } from "antd";
import {
  DeleteOutlined,
  AppstoreAddOutlined,
  FolderAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import AddAttributeScreen from "../components/AddAttributeScreen"; // Popup để thêm thuộc tính
import AddCategoryScreen from "../components/AddCategoryScreen"; // Popup để thêm category
import axiosInstance from "../services/axiosInstance";
import { FloatButton } from "antd";

const { Option } = Select;

function AttributeScreen() {
  const [attributeDataSources, setAttributeDataSources] = useState([]);
  const [filteredAttributes, setFilteredAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddAttributePopup, setShowAddAttributePopup] = useState(false);
  const [showAddCategoryPopup, setShowAddCategoryPopup] = useState(false);

  // Fetch data for attributes and categories
  useEffect(() => {
    setLoading(true);

    axiosInstance
      .get("/attribute")
      .then((response) => {
        setAttributeDataSources(response.data.data);
        setFilteredAttributes(response.data.data); // Initialize filtered attributes
        setLoading(false);
      })
      .catch(() => {
        console.error("Error fetching attribute data sources");
      });

    axiosInstance
      .get("/category/")
      .then((response) => {
        setCategoryList(response.data.data);
      })
      .catch(() => {
        console.error("Error fetching categories");
      });
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    if (value) {
      const filtered = attributeDataSources.filter(
        (attribute) => attribute.category_id === value
      );
      setFilteredAttributes(filtered);
    } else {
      setFilteredAttributes(attributeDataSources); // Show all if no category is selected
    }
  };

  const onDeleteAttribute = (id) => {
    setLoading(true);
    axiosInstance
      .delete(`/attribute/attributes/${id}`)
      .then(() => {
        message.success("Attribute deleted successfully");
        setAttributeDataSources((prevData) =>
          prevData.filter((item) => item.id !== id)
        );
        setFilteredAttributes((prevData) =>
          prevData.filter((item) => item.id !== id)
        );
      })
      .catch(() => {
        message.error(`Error deleting attribute ${id}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Ensure filteredAttributes is updated when attributeDataSources changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = attributeDataSources.filter(
        (attribute) => attribute.category_id === selectedCategory
      );
      setFilteredAttributes(filtered);
    } else {
      setFilteredAttributes(attributeDataSources); // Show all if no category is selected
    }
  }, [attributeDataSources, selectedCategory]);

  const attributeColumns = [
    {
      title: "Attribute Name",
      dataIndex: "name",
      key: "attribute_name",
    },
    {
      title: "Attribute Type",
      dataIndex: "type",
      key: "attribute_value",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this attribute?"
          onConfirm={() => onDeleteAttribute(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="h-screen">
      <Spin spinning={loading}>
        <div className="mb-4">
          <label>Chọn Danh Mục: </label>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            placeholder="Chọn một danh mục"
            style={{ width: 200 }}
          >
            <Option value={null}>Tất cả</Option>
            {categoryList.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </div>

        <h1 className="text-2xl font-bold mb-4">Danh sách thuộc tính</h1>
        <Table
          columns={attributeColumns}
          dataSource={filteredAttributes}
          bordered
          pagination={{ pageSize: 7 }}
          size="small"
        />

        {/* Floating Buttons for adding Attribute and Category */}
        <FloatButton.Group
          trigger="hover"
          type="primary"
          style={{ right: 64 }}
          icon={<PlusOutlined />}
        >
          <FloatButton
            icon={<AppstoreAddOutlined />}
            tooltip={<span>Add Attribute</span>}
            onClick={() => setShowAddAttributePopup(true)}
          />
          <FloatButton
            icon={<FolderAddOutlined />}
            tooltip={<span>Add Category</span>}
            onClick={() => setShowAddCategoryPopup(true)}
          />
        </FloatButton.Group>

        {showAddAttributePopup && (
          <AddAttributeScreen
            onClose={() => setShowAddAttributePopup(false)}
            setAttributeDataSources={setAttributeDataSources}
          />
        )}
        {showAddCategoryPopup && (
          <AddCategoryScreen onClose={() => setShowAddCategoryPopup(false)} />
        )}
      </Spin>
    </div>
  );
}

export default AttributeScreen;
