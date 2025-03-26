import React, { useState, useEffect, useCallback } from "react";
import { IoMdClose } from "react-icons/io";
import { Radio, Button, Spin } from "antd";
import Select from "react-select";
import axiosInstance from "../services/axiosInstance";

function AddWebScreen({ onClose, setDataSources, nextId, setNextId }) {
  const [url, setUrl] = useState("");
  const [link, setLink] = useState("");
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState(1);
  const [atributes, setAtributes] = useState([]);
  const [selectedAtributes, setSelectedAtributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAtributes, setFetchingAtributes] = useState(true);

  const onChangeRadio = (e) => {
    setMode(e.target.value);
  };

  // Fetch attributes from API
  useEffect(() => {
    setFetchingAtributes(true);
    axiosInstance
      .get("/attribute")
      .then((response) => {
        const data = response.data.data;
        const options = data.map((atribute) => ({
          value: atribute.id,
          label: atribute.name,
          id: atribute.id,
        }));
        setAtributes(options);
      })
      .catch((error) => {
        console.error("Error fetching attributes:", error);
      })
      .finally(() => {
        setFetchingAtributes(false);
      });
  }, []);

  // Handle attribute selection
  const handleSelectChange = useCallback((selectedOptions) => {
    setSelectedAtributes(selectedOptions);
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(async () => {
    setLoading(true);

    try {
      const webCrawlPayload = {
        url,
        link_selector: link,
        description: "string",
        threads: 5,
        card_information: "string",
        priority: "string",
      };

      const webCrawlResponse = await axiosInstance.post(
        "/web-crawl/",
        webCrawlPayload
      );

      if (webCrawlResponse.data.status_code === 201) {
        setDataSources((prevData) => [
          ...prevData,
          {
            key: nextId,
            url: webCrawlPayload.url,
            link_selector: webCrawlPayload.link_selector,
            status: "ACTIVE",
          },
        ]);

        setNextId(nextId + 1);

        onClose();
      } else {
        console.error(
          "Failed to create web crawl task:",
          webCrawlResponse.data.message
        );
      }
    } catch (error) {
      console.error("Error while updating data source:", error);
    } finally {
      setLoading(false);
    }
  }, [
    url,
    link,
    selectedAtributes,
    nextId,
    setDataSources,
    setNextId,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-200 bg-opacity-50">
      <div className="bg-white shadow-lg p-6 w-full max-w-lg rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Add Data Source</h2>
          <IoMdClose className="text-2xl cursor-pointer" onClick={onClose} />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mode
            </label>
            <Radio.Group onChange={onChangeRadio} value={mode} className="mt-2">
              <Radio value={1}>AI</Radio>
              <Radio value={2}>Manual</Radio>
            </Radio.Group>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              type="text"
              className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" // Điều chỉnh lại lớp CSS
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Link
            </label>
            <input
              type="text"
              className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" // Điều chỉnh lại lớp CSS
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Active
            </label>
            <input
              type="checkbox"
              className="rounded-md border-gray-300 focus:ring-indigo-500"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          </div>

          <div>
            <Button
              type="primary"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              onClick={handleSubmit}
              loading={loading}
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWebScreen;
