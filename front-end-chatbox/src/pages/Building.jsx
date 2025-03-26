import React, { useState, useEffect } from "react";
import { Table, Select, Input, Row, Col, DatePicker } from "antd";
import axiosInstance from "../services/axiosInstance";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;

function DynamicTables() {
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

  const generateColumns = (data) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((key) => {
      if (key === "price") {
        return {
          title: "Giá",
          dataIndex: key,
          key: key,
          render: (value) =>
            value > 1000000
              ? new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(value)
              : 0,
        };
      } else if (key === "area") {
        return {
          title: "Diện tích",
          dataIndex: key,
          key: key,
          render: (value) => `${value} m²`,
        };
      } else if (key === "baseUrl") {
        return {
          title: "Base URL",
          dataIndex: "baseUrl",
          key: "baseUrl",
          render: (value) => {
            const url = new URL(value);
            return (
              <a href={value} target="_blank" rel="noopener noreferrer">
                {url.origin}
              </a>
            );
          },
        };
      } else if (key === "timestamp") {
        return {
          title: "Timestamp",
          dataIndex: key,
          key: key,
          render: (value) => moment(value).format("YYYY-MM-DD HH:mm:ss"),
        };
      }
      //else if key=Url đổi thành thẻ a
      else if (key === "url")
        return {
          title: "URL",
          dataIndex: key,
          key: key,
          render: (value) => (
            <a href={value} target="_blank" rel="noopener noreferrer">
              {value}
            </a>
          ),
        };
      else {
        return {
          title: key.charAt(0).toUpperCase() + key.slice(1),
          dataIndex: key,
          key: key,
        };
      }
    });
  };

  const handleGroupChange = (value) => {
    setSelectedGroup(value);
    setFilteredData(groupedData[value] || []);
    setFilters(generateInitialFilters(groupedData[value] || []));
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (dates, dateStrings) => {
    setFilters({ ...filters, timestamp: dateStrings });
  };

  return (
    <div className="min-h-screen">
      <h3>{`Nhóm thuộc tính`}</h3>
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
        {Object.keys(filters).map((key) =>
          key !== "timestamp" ? (
            <Col key={key}>
              <div>
                <h3>{`Lọc theo ${key}`}</h3> {/* Add title for each filter */}
                {key === "baseUrl" ? (
                  <Select
                    style={{ width: 200 }}
                    value={filters[key] || "all"}
                    onChange={(value) => handleFilterChange(key, value)}
                    placeholder={`Lọc theo ${key}`}
                    showSearch
                    optionFilterProp="children" // Ensures that users can search/filter options
                    filterOption={(input, option) =>
                      option?.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    <Option value="all">All</Option>
                    {Array.from(
                      new Set(filteredData.map((item) => item[key]))
                    ).map((url) => (
                      <Option key={url} value={url}>
                        {url}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    placeholder={`Lọc theo ${key}`}
                    value={filters[key]}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                  />
                )}
              </div>
            </Col>
          ) : (
            <Col key={key}>
              <div>
                <h3>Lọc theo ngày</h3> {/* Title for date range filter */}
                <RangePicker
                  placeholder={["Từ ngày", "Đến ngày"]}
                  onChange={handleDateRangeChange}
                />
              </div>
            </Col>
          )
        )}
      </Row>
      <h1 className="text-2xl font-bold py-2">Danh sách dữ liệu crawl được</h1>
      {selectedGroup && (
        <Table
          columns={generateColumns(filteredData)}
          dataSource={filteredData}
          rowKey={(record, index) => index}
          pagination={{ pageSize: 5 }}
          bordered
          size="small"
        />
      )}
    </div>
  );
}

export default DynamicTables;
