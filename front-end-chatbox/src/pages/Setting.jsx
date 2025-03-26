import React, { useState, useEffect } from "react";
import {
  Space,
  Table,
  Spin,
  message,
  Button,
  Popconfirm,
  FloatButton,
} from "antd";
import {
  PlusOutlined,
  VerticalAlignBottomOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  StopOutlined, // Import the Stop icon
} from "@ant-design/icons";

import AddWebScreen from "../components/AddWebScreen";
import EditWebScreen from "../components/EditWebScreen";
import axiosInstance from "../services/axiosInstance";

function Setting() {
  const [dataSources, setDataSources] = useState([]);
  const [loadingRows, setLoadingRows] = useState({}); // Object to track loading state per row
  const [editData, setEditData] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [nextId, setNextId] = useState(0); // Khởi tạo ID tự động

  // Fetch websites and set the next ID
  useEffect(() => {
    axiosInstance
      .get("/web-crawl")
      .then((response) => {
        const data = response.data.data.map((item, index) => ({
          ...item,
          key: index + 1,
        }));
        setDataSources(data);
        setNextId(data.length); // Khởi tạo nextId dựa trên số lượng website hiện có
      })
      .catch(() => {
        console.error("Error fetching data sources");
      });
  }, []);

  // Helper function to update loading state for a specific row
  const setRowLoading = (id, isLoading) => {
    setLoadingRows((prev) => ({ ...prev, [id]: isLoading }));
  };

  // Check if any crawl is in progress
  const isAnyCrawlInProgress = Object.values(loadingRows).some(
    (isLoading) => isLoading
  );

  // Crawl all websites
  const onCrawl = () => {
    const newLoadingRows = dataSources.reduce((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {});
    setLoadingRows(newLoadingRows); // Set all rows to loading

    axiosInstance
      .get("/auth/test_crawl")
      .then(() => {
        message.success("Crawling completed successfully");
      })
      .catch(() => {
        message.error("Error while crawling");
      })
      .finally(() => {
        setLoadingRows({}); // Reset loading state for all rows
      });
  };

  // Crawl one website
  const onCrawlOne = (id) => {
    setRowLoading(id, true); // Set loading state for the specific row
    axiosInstance
      .get(`/auth/test_crawl_one/${id}`)
      .then(() => {
        message.success("Crawling completed successfully");
      })
      .catch(() => {
        message.error(`Error while crawling ${id}`);
      })
      .finally(() => {
        setRowLoading(id, false); // Reset loading state for the specific row
      });
  };

  // Stop crawling action
  const onStopCrawl = () => {
    axiosInstance
      .get("/auth/testStop")
      .then(() => {
        message.success("Crawl stopped successfully");
      })
      .catch(() => {
        message.error("Error stopping the crawl");
      });
  };

  // Delete website
  const onDelete = (id) => {
    setRowLoading(id, true);
    axiosInstance
      .delete(`/web-crawl/${id}`)
      .then(() => {
        message.success("Deleted successfully");
        setDataSources((prevData) => prevData.filter((item) => item.id !== id));
      })
      .catch(() => {
        message.error(`Error deleting ${id}`);
      })
      .finally(() => {
        setRowLoading(id, false);
      });
  };

  // Delete page content
  const onDeleteContent = (id) => {
    setRowLoading(id, true);
    axiosInstance
      .delete(`/web-crawl/${id}/content`)
      .then(() => {
        message.success("Page content deleted successfully");
      })
      .catch(() => {
        message.error(`Error deleting page content for ${id}`);
      })
      .finally(() => {
        setRowLoading(id, false);
      });
  };

  // Edit website
  const onEdit = (record) => {
    setEditData(record);
    setShowEditPopup(true);
  };

  // Status change
  const onStatusChange = (record) => {
    const newStatus = record.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setRowLoading(record.id, true);
    axiosInstance
      .put(`/web-crawl/${record.id}`, {
        status: newStatus,
        link_selector: record.link_selector,
        url: record.url,
        threads: record.threads,
      })
      .then(() => {
        message.success(`Status updated to ${newStatus}`);
        setDataSources((prevData) =>
          prevData.map((item) =>
            item.id === record.id ? { ...item, status: newStatus } : item
          )
        );
      })
      .catch(() => {
        message.error(`Error updating status for ${record.id}`);
      })
      .finally(() => {
        setRowLoading(record.id, false);
      });
  };

  // Columns for websites table
  const columns = [
    {
      title: "ID",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "Website",
      dataIndex: "url",
      key: "url",
      render: (text) => <a>{text}</a>,
    },
    {
      title: "Link selector",
      dataIndex: "link_selector",
      key: "linkselector",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (text, record) => (
        <Button
          type="link"
          style={{
            color: text === "ACTIVE" ? "green" : "red",
            fontWeight: "bold",
          }}
          onClick={() => onStatusChange(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          {loadingRows[record.id] ? (
            <Spin size="small" />
          ) : (
            <>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => onCrawlOne(record.id)}
              />
              <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
              <Popconfirm
                title="Are you sure to delete this website?"
                onConfirm={() => onDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
              <Popconfirm
                title="Are you sure to delete this page content?"
                onConfirm={() => onDeleteContent(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<FileTextOutlined />} danger>
                  Delete Content
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <FloatButton
        type="primary"
        icon={<PlusOutlined />}
        tooltip={<span>Add Web Crawl</span>}
        onClick={() => setShowUpdatePopup(true)}
        style={{ right: 84 }}
      />
      <FloatButton
        icon={<VerticalAlignBottomOutlined />}
        type="primary"
        style={{ right: 24 }}
        tooltip={<span>Start Crawl</span>}
        onClick={onCrawl}
      />
      {/* Conditionally render the Stop Crawl button */}
      {isAnyCrawlInProgress && (
        <FloatButton
          icon={<StopOutlined />} // Stop icon
          type="primary"
          style={{ right: 144 }} // Position it between Add and Start
          tooltip={<span>Stop Crawl</span>}
          onClick={onStopCrawl} // Call the stop crawl function
        />
      )}
      <div className="flex gap-4 h-full">
        <div className="w-full">
          <h1 className="text-2xl font-bold mb-4">Danh sách Website</h1>
          <Table
            columns={columns}
            dataSource={dataSources}
            bordered
            size="small"
          />
          {showUpdatePopup && (
            <AddWebScreen
              onClose={() => setShowUpdatePopup(false)}
              setDataSources={setDataSources}
              nextId={nextId} // Truyền nextId
              setNextId={setNextId} // Truyền setNextId
            />
          )}
        </div>
      </div>
      {showEditPopup && (
        <EditWebScreen
          onClose={() => setShowEditPopup(false)}
          editData={editData}
          setDataSources={setDataSources}
        />
      )}
    </div>
  );
}

export default Setting;
