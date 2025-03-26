import React, { useState, useEffect } from "react";
import { Row, Col, Select, DatePicker } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import axiosInstance from "../services/axiosInstance";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;

function StatisticsPage() {
  const [groupedData, setGroupedData] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // Fetch data using Axios
    Promise.all([
      axiosInstance.get("/web-page-content/"),
      axiosInstance.get("/web-crawl/"),
    ]).then(([responseContent, responseCrawl]) => {
      const rawContentData = responseContent.data.data;
      const crawlData = responseCrawl.data.data;

      const crawlIdToUrlMap = {};
      crawlData.forEach((item) => {
        crawlIdToUrlMap[item.id] = item.url;
      });

      const data = rawContentData.map((item) => {
        const contents = item.contents;
        const web_crawl_id = item.web_crawl_id;
        const baseUrl = crawlIdToUrlMap[web_crawl_id] || null;
        const timestamp = item.timestamp;

        return {
          ...contents,
          baseUrl: baseUrl,
          timestamp: timestamp,
        };
      });

      const groups = data.reduce((acc, item) => {
        const keys = Object.keys(item).sort().join("_");
        if (!acc[keys]) acc[keys] = [];
        acc[keys].push(item);
        return acc;
      }, {});

      setGroupedData(groups);
      setSelectedGroup(Object.keys(groups)[0]);
      setFilteredData(groups[Object.keys(groups)[0]] || []);
      setFilters(generateInitialFilters(groups[Object.keys(groups)[0]] || []));
    });
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const groupData = groupedData[selectedGroup];
      const filtered = groupData.filter((item) => {
        return Object.keys(filters).every((key) => {
          const filterValue = filters[key];
          if (!filterValue || filterValue === "all") return true;
          if (key === "timestamp" && filterValue.length === 2) {
            const itemDate = moment(item[key]);
            const startDate = moment(filterValue[0]);
            const endDate = moment(filterValue[1]);
            return itemDate.isBetween(startDate, endDate, "day", "[]");
          }
          const itemValue = String(item[key]).toLowerCase();
          return itemValue.includes(filterValue.toLowerCase());
        });
      });
      setFilteredData(filtered);
    }
  }, [filters, selectedGroup, groupedData]);

  const generateInitialFilters = (data) => {
    if (data.length === 0) return {};
    return Object.keys(data[0]).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
  };

  const handleGroupChange = (value) => {
    setSelectedGroup(value);
    setFilteredData(groupedData[value] || []);
    setFilters(generateInitialFilters(groupedData[value] || []));
  };

  const handleDateRangeChange = (dates, dateStrings) => {
    setFilters({ ...filters, timestamp: dateStrings });
  };

  const chartData = filteredData.map((item) => ({
    timestamp: moment(item.timestamp).format("YYYY-MM-DD"),
    price: item.price || 0,
    area: item.area || 0,
  }));

  return (
    <div className="h-screen">
      <h1 className="text-2xl font-bold py-2">Thống kê dữ liệu crawl</h1>
      <Select
        style={{ width: 200, marginBottom: 20 }}
        value={selectedGroup}
        onChange={handleGroupChange}
      >
        {Object.keys(groupedData).map((group) => (
          <Option key={group} value={group}>
            {group}
          </Option>
        ))}
      </Select>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={handleDateRangeChange}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <h2>Biểu đồ giá</h2>
          <BarChart
            width={500}
            height={300}
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="price" fill="#8884d8" />
          </BarChart>
        </Col>
        <Col span={12}>
          <h2>Biểu đồ diện tích</h2>
          <LineChart
            width={500}
            height={300}
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="area" stroke="#82ca9d" />
          </LineChart>
        </Col>
      </Row>
    </div>
  );
}

export default StatisticsPage;
