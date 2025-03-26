import React, { useState, useEffect, useCallback } from "react";
import { IoMdClose } from "react-icons/io";
import Select from "react-select"; // Import react-select
import { Button, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons"; // Import Plus Icon
import axios from "axios";
import axiosInstance from "../services/axiosInstance";

function AddCategoryScreen({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for submit button
  const [categoryList, setCategoryList] = useState([]); // Holds the list of categories
  const [selectedCategory, setSelectedCategory] = useState(null); // Holds the selected category

  // List of basic Python data types as options

  // Handle form submit
  const handleSubmit = async () => {
    axiosInstance
      .post("/category/", {
        name: name,
        description: description,
      })
      .then((response) => {
        onClose();
      })
      .catch((error) => {
        console.error("Error adding attribute:", error);
      });
  };

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 w-full h-full z-10 flex justify-between items-center bg-slate-200 bg-opacity-50 gap-4">
      <div className="mx-auto bg-white shadow-md p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Category</h2>
          <IoMdClose className="cursor-pointer" onClick={onClose} />
        </div>

        <div className="space-y-4">
          {/* Attribute Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category's Name
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
              Category's Description
            </label>
            <Input
              type="text"
              className="bg-white text-black p-2 border border-black w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="primary"
              className="bg-black text-white rounded"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
              block
            >
              {loading ? "Adding..." : "Added"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCategoryScreen;
