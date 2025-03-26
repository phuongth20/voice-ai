import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Select,
  Button,
  message,
  InputNumber,
  Spin,
  TimePicker,
} from "antd";
import axiosInstance from "../services/axiosInstance";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
const { Option } = Select;
dayjs.extend(customParseFormat);
function AddCronJobScreen({ onClose, setCronJobs }) {
  const [jobName, setJobName] = useState("");
  const [webCrawlId, setWebCrawlId] = useState("");
  const [intervalValue, setIntervalValue] = useState("");
  const [specificValue, setSpecificValue] = useState(null); 
  const [priority, setPriority] = useState(0);
  const [webCrawls, setWebCrawls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWebCrawls, setFetchingWebCrawls] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/web-crawl/")
      .then((response) => {
        setWebCrawls(response.data.data);
      })
      .catch((error) => {
        message.error("Error fetching web crawls");
        console.error("Error fetching web crawls:", error);
      })
      .finally(() => {
        setFetchingWebCrawls(false); 
      });
  }, []);

  const handleAddCronJob = () => {
    if (!jobName || !webCrawlId || (!intervalValue && !specificValue)) {
      message.error("Please fill in all required fields");
      return;
    }

    let cronSpecificTime = "";
    if (specificValue) {
      //create cron string use specificValue.hour() and specificValue.minute()
      cronSpecificTime = `${specificValue.minute()} ${specificValue.hour()} * * *`;
      console.log("cronSpecificTime", cronSpecificTime);
    }

    const cronJobData = {
      web_crawl_id: webCrawlId,
      job_name: jobName,
      interval_value: intervalValue || "", // Send only one value
      specific_value: cronSpecificTime || "",
      priority: priority,
      start_time: "2024-09-30T06:06:39.385Z", // Example start time
    };

    setLoading(true);

    axiosInstance
      .post("/cron_job/", cronJobData)
      .then((response) => {
        message.success("CronJob added successfully");
        setCronJobs((prev) => [...prev, response.data.data]);
        onClose();
      })
      .catch((error) => {
        message.error("Error adding cronjob");
        console.error("Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleIntervalChange = (e) => {
    setIntervalValue(e.target.value);
    if (e.target.value) {
      setSpecificValue(null); // Clear specific value when interval is set
    }
  };

  const handleSpecificTimeChange = (time) => {
    setSpecificValue(time);
    if (time) {
      setIntervalValue(""); // Clear interval when specific time is set
    }
  };

  return (
    <Modal
      visible={true}
      title="Add New CronJob"
      onCancel={onClose}
      footer={null}
    >
      <Spin spinning={fetchingWebCrawls}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Job Name */}
          <div>
            <label>Job Name</label>
            <Input
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="Enter job name"
            />
          </div>

          {/* Web Crawl */}
          <div>
            <label>Web Crawl</label>
            <Select
              value={webCrawlId}
              onChange={(value) => setWebCrawlId(value)}
              placeholder="Select a web crawl"
              loading={fetchingWebCrawls}
              style={{ width: "100%" }}
            >
              {webCrawls.map((crawl) => (
                <Option key={crawl.id} value={crawl.id}>
                  {crawl.url}
                </Option>
              ))}
            </Select>
          </div>

          {/* Interval Value */}
          <div>
            <label>Interval Value (every x minutes)</label>
            <Input
              value={intervalValue}
              onChange={handleIntervalChange}
              placeholder="Enter interval value"
              disabled={specificValue !== null} // Disable when specific time is set
            />
          </div>

          {/* Specific Value (Time Picker) */}
          <div>
            <label>Specific Time (every day at)</label>
            <TimePicker
              value={specificValue}
              onChange={handleSpecificTimeChange}
              defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
              format="HH:mm"
              placeholder="Select time"
              style={{ width: "100%" }}
              disabled={intervalValue !== ""} // Disable when interval value is set
            />
          </div>

          {/* Priority */}
          <div>
            <label>Priority</label>
            <InputNumber
              value={priority}
              min={0}
              onChange={(value) => setPriority(value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            onClick={handleAddCronJob}
            loading={loading}
            style={{ marginTop: "16px" }}
          >
            Add CronJob
          </Button>
        </div>
      </Spin>
    </Modal>
  );
}

export default AddCronJobScreen;
