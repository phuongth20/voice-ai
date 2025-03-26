import React, { useState, useEffect } from "react";
import { Space, Table, Spin, message, Button, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { FloatButton } from "antd"; // Thêm FloatButton vào đây
import axiosInstance from "../services/axiosInstance";
import AddCronJobScreen from "../components/AddCronJobScreen"; // Tạo component AddCronJobScreen để thêm cronjob mới

function Cron() {
  const [cronJobs, setCronJobs] = useState([]);
  const [webCrawls, setWebCrawls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCronJobPopup, setShowAddCronJobPopup] = useState(false); // Thêm state để hiển thị popup thêm cronjob mới
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    // Fetch cron jobs
    setLoading(true);
    axiosInstance
      .get("/cron_job/")
      .then((response) => {
        setCronJobs(response.data.data);
      })
      .catch((error) => {
        message.error("Error fetching cron jobs");
        console.error("Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch web crawls
    axiosInstance
      .get("/web-crawl/")
      .then((response) => {
        setWebCrawls(response.data.data);
      })
      .catch((error) => {
        message.error("Error fetching web crawls");
        console.error("Error:", error);
      });
  }, []);

  const onDelete = (id) => {
    setLoading(true);
    axiosInstance
      .delete(`/cron_job/${id}`)
      .then(() => {
        message.success("Deleted successfully");
        setCronJobs((prevData) => prevData.filter((item) => item.id !== id));
      })
      .catch((error) => {
        message.error(`Error deleting cron job ${id}`);
        console.error("Error while deleting:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onEdit = (record) => {
    setEditData(record);
    setShowEditPopup(true);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Job Name",
      dataIndex: "job_name",
      key: "job_name",
    },
    {
      title: "Web Crawl",
      dataIndex: "web_crawl_id",
      key: "web_crawl_id",
      render: (webCrawlId) => {
        const webCrawl = webCrawls.find((wc) => wc.id === webCrawlId);
        return webCrawl ? webCrawl.url : "Unknown";
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure to delete this cron job?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-screen">
      <Spin spinning={loading}>
        <h1 className="text-2xl font-bold">CronJob Management</h1>
        <Table columns={columns} dataSource={cronJobs} />

        {/* Floating Button to Add CronJob */}
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          style={{ right: 24, bottom: 24 }}
          tooltip={<span>Add CronJob</span>}
          onClick={() => setShowAddCronJobPopup(true)}
        />

        {/* Popup to Add CronJob */}
        {showAddCronJobPopup && (
          <AddCronJobScreen
            onClose={() => setShowAddCronJobPopup(false)}
            setCronJobs={setCronJobs}
          />
        )}
      </Spin>
    </div>
  );
}

export default Cron;
