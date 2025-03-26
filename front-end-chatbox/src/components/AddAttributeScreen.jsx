import React, { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import Select from "react-select"; // Import react-select
import { Button, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons"; // Import Plus Icon
import axiosInstance from "../services/axiosInstance";

function AddAttributeScreen({ onClose, setAttributeDataSources }) {
  const [name, setName] = useState("");
  const [type, setType] = useState(null);
  const [listItems, setListItems] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState("");

  const typeOptions = [
    { value: "str", label: "String (str)" },
    { value: "int", label: "Integer (int)" },
    { value: "float", label: "Float (float)" },
    { value: "bool", label: "Boolean (bool)" },
    { value: "date", label: "Date (date)" },
    { value: "list", label: "List (list)" },
    { value: "json", label: "Json (json)" },

  ];

  useEffect(() => {
    axiosInstance
      .get("/category/")
      .then((response) => {
        const categories = response.data.data.map((category) => ({
          value: category.id,
          label: category.name,
        }));
        setCategoryList(categories);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }

    setLoading(true);

    const payload = {
      name: name,
      type: type === "list" ? JSON.stringify(listItems) : type,
      description: description,
      category_id: selectedCategory.value,
    };

    try {
      const response = await axiosInstance.post("/attribute/", payload);
      const newAttribute = response.data.data;

      // Update the attribute data sources in parent component
      setAttributeDataSources((prevData) => [...prevData, newAttribute]);

      // Optionally close the popup
      onClose();
    } catch (error) {
      console.error("Error adding attribute:", error);
    } finally {
      setLoading(false);
    }
  };

  const addListItem = () => {
    setListItems([...listItems, ""]);
  };

  const handleListItemChange = (value, index) => {
    const newListItems = [...listItems];
    newListItems[index] = value;
    setListItems(newListItems);
  };

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 w-full h-full z-10 flex justify-between items-center bg-slate-200 bg-opacity-50 gap-4">
      <div className="mx-auto bg-white shadow-md p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Attribute</h2>
          <IoMdClose className="cursor-pointer" onClick={onClose} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attribute's Name
            </label>
            <Input
              type="text"
              className="bg-white text-black p-2 border border-black w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Category
            </label>
            <Select
              options={categoryList}
              onChange={setSelectedCategory}
              value={selectedCategory}
              placeholder="Choose a category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Type
            </label>
            <Select
              options={typeOptions}
              onChange={(selectedOption) => setType(selectedOption.value)}
              value={typeOptions.find((option) => option.value === type)}
              placeholder="Choose a data type"
            />
          </div>

          {type === "list" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                List Items
              </label>
              {listItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder={`List item ${index + 1}`}
                    value={item}
                    onChange={(e) =>
                      handleListItemChange(e.target.value, index)
                    }
                    className="bg-white text-black p-2 border border-black w-full"
                  />
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addListItem}
                block
              >
                Add another item
              </Button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <Input.TextArea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter attribute description"
              className="bg-white text-black p-2 border border-black w-full"
            />
          </div>

          <div>
            <Button
              type="primary"
              className="bg-black text-white rounded"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
              block
            >
              {loading ? "Adding..." : "Add Attribute"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddAttributeScreen;
