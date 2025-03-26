import React, { useState, useEffect } from "react";
import { Button, message, Checkbox, Table, Spin } from "antd"; // Import Ant Design components
import axiosInstance from "../services/axiosInstance";
import { IoMdClose } from "react-icons/io";

function EditWebScreen({ onClose, editData, setDataSources }) {
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState([]); // Selected attributes
  const [allAttributes, setAllAttributes] = useState([]); // All attributes available for selection
  const [fetchingAttributes, setFetchingAttributes] = useState(true); // Loading state for fetching attributes

  // Fetch current attributes for the web crawl and all available attributes
  useEffect(() => {
    // Fetch selected attributes for the web crawl
    axiosInstance
      .get(`/web-crawl/${editData.id}/attribute`)
      .then((response) => {
        const data = response.data.data;
        const selectedOptions = data.map((attribute) => attribute.id);
        setSelectedAttributes(selectedOptions);
      })
      .catch((error) => {
        console.error("Error fetching selected attributes:", error);
      });

    // Fetch all available attributes
    axiosInstance
      .get("/attribute")
      .then((response) => {
        const data = response.data.data;
        setAllAttributes(data);
      })
      .catch((error) => {
        console.error("Error fetching all attributes:", error);
      })
      .finally(() => {
        setFetchingAttributes(false);
      });
  }, [editData.id]);

  // Handle checkbox change for each attribute
  const handleCheckboxChange = (attributeId) => {
    setSelectedAttributes((prevSelected) =>
      prevSelected.includes(attributeId)
        ? prevSelected.filter((id) => id !== attributeId)
        : [...prevSelected, attributeId]
    );
  };

  // Handle submit to update attributes
  const handleEdit = async () => {
    setLoading(true);

    try {
      // Step 1: Delete existing attributes for this web crawl
      await axiosInstance.delete(`/web-crawl/${editData.id}/attribute`);

      // Step 2: Assign new selected attributes
      const attributePromises = selectedAttributes.map(async (attributeId) => {
        const attributePayload = {
          web_crawl_id: editData.id,
          attribute_id: attributeId,
        };
        return axiosInstance.post(
          "/attribute/web-crawl-attributes",
          attributePayload
        );
      });

      await Promise.all(attributePromises);

      // Step 3: Update the data sources list and close the popup
      setDataSources((prevData) =>
        prevData.map((data) =>
          data.id === editData.id
            ? {
                ...data,
              }
            : data
        )
      );

      message.success("Attributes updated successfully.");
      onClose();
    } catch (error) {
      console.error("Error updating attributes:", error);
      message.error("Failed to update attributes.");
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "Attribute Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Select",
      key: "select",
      render: (text, record) => (
        <Checkbox
          checked={selectedAttributes.includes(record.id)}
          onChange={() => handleCheckboxChange(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 w-full h-full z-10 flex justify-center items-center bg-slate-200 bg-opacity-50 gap-4">
      <div className="mx-auto bg-white shadow-md p-8 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Website</h2>
          <IoMdClose className="cursor-pointer" onClick={() => onClose()} />
        </div>

        <div className="space-y-4">
          {/* Attribute Selection Table */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Attributes
            </label>
            {fetchingAttributes ? (
              <Spin /> // Add loading spinner
            ) : (
              <Table
                dataSource={allAttributes}
                columns={columns}
                rowKey="id"
                pagination={false} // Disable pagination if needed
                scroll={{ y: 240 }} // Set the scroll height for the table
              />
            )}
          </div>

          <div className="mt-4">
            <Button
              type="primary"
              className="bg-black text-white rounded"
              onClick={handleEdit}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditWebScreen;
