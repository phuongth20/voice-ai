import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Spin,
  Upload,
  Modal,
  Radio,
  Form,
  message,
  Select,
  Image,
  Collapse,
} from "antd";
import {
  UploadOutlined,
  ScanOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import axiosInstance from "../services/axiosInstance"; 

const { Dragger } = Upload;
const { Option } = Select;
const { Panel } = Collapse;

const ScanPage = () => {
  const [ocrResults, setOcrResults] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [showOcrForm, setShowOcrForm] = useState(false);
  const [ocrType, setOcrType] = useState("tesseract"); 
  const [categoryList, setCategoryList] = useState([]); 
  const [sampleDataList, setSampleDataList] = useState([]); 
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); 
  const [selectedSampleId, setSelectedSampleId] = useState(null); 
  const [fileList, setFileList] = useState([]); 
  const [stats, setStats] = useState({
    above85: 0,
    between70And85: 0,
    below70: 0,
  });
  const [processedImages, setProcessedImages] = useState([]); 

  useEffect(() => {
    axiosInstance
      .get(`/category`)
      .then((response) => {
        setCategoryList(response.data.data); 
      })
      .catch((error) => {
        console.error("Error fetching category data:", error);
      });
  }, []);

  useEffect(() => {
    return () => {
      fileList.forEach((fileObj) => URL.revokeObjectURL(fileObj.url));
    };
  }, [fileList]);

  const calculateStats = (results) => {
    let above85 = 0;
    let between70And85 = 0;
    let below70 = 0;

    results.forEach((result) => {
      result.data.forEach((field) => {
        const { reliability } = field;
        if (reliability >= 85) {
          above85++;
        } else if (reliability >= 70 && reliability < 85) {
          between70And85++;
        } else if (reliability < 70) {
          below70++;
        }
      });
    });

    setStats({ above85, between70And85, below70 });
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    axiosInstance
      .get(`/category/${categoryId}/sample`)
      .then((response) => {
        const samples = response.data.data.map((sample) => ({
          id: sample.id,
          name: sample.name,
        }));
        setSampleDataList(samples);
      })
      .catch((error) => {
        console.error("Error fetching sample data:", error);
      });
  };

  const handleScan = async () => {
    if (fileList.length === 0) {
      message.error("Vui lòng tải lên ít nhất một file ảnh!");
      return;
    }


    setShowOcrForm(false);
    setLoading(true);

    try {
      const formData = new FormData();
      fileList.forEach((fileObj) => {
        formData.append("images", fileObj.file); 
      });
      formData.append("ocrType", ocrType);
      formData.append("sampleId", selectedSampleId);

      const response = await axiosInstance.post(
        `/auth/test-ocr/${selectedCategoryId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Kiểm tra cấu trúc dữ liệu trả về
      if (!response.data || !response.data.data) {
        throw new Error("Dữ liệu trả về từ server không hợp lệ.");
      }

      const { data } = response.data;
      console.log("OCR response data:", data);

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu OCR không phải là một mảng.");
      }

      if (data.length !== fileList.length) {
        console.warn(
          `Số lượng kết quả OCR (${data.length}) không khớp với số lượng file đã tải lên (${fileList.length}).`
        );
      }

      const processedResults = data.map((item, idx) => {
        if (!item.data || !Array.isArray(item.data.extracted_data)) {
          console.warn(
            `Item at index ${idx} thiếu 'extracted_data' hoặc không phải là một mảng:`,
            item
          );
          return {
            filename: item.filename || `Image ${idx + 1}`,
            url: fileList[idx]?.url || null,
            data: [],
          };
        }

        const dynamicResults = item.data.extracted_data.flatMap((field) => {
          if (Array.isArray(field.fieldValue)) {
            return field.fieldValue.map((subItem, index) => ({
              fieldName: `${field.fieldName} [${index + 1}]`,
              fieldValue: JSON.stringify(subItem),
              reliability: field.reliability,
              accuracy: field.accuracy,
            }));
          } else {
            return {
              fieldName: field.fieldName,
              fieldValue: field.fieldValue,
              reliability: Math.max(field.reliability, 0),
              accuracy: Math.max(field.accuracy, 0), 
            };
          }
        });

        return {
          filename: item.filename,
          url: fileList[idx]?.url || null, 
          data: dynamicResults,
          processedImage: item.data.processed_image || "",
        };
      });

      setOcrResults(processedResults);
      calculateStats(processedResults);
      setProcessedImages(
        processedResults.map((result) => result.processedImage)
      );
    } catch (error) {
      console.error("Error scanning image:", error);
      message.error(`Đã có lỗi xảy ra khi xử lý OCR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: "images", 
    multiple: true,
    beforeUpload: (file) => {
      const url = URL.createObjectURL(file);
      setFileList((prevList) => [...prevList, { file, url, uid: file.uid }]);
      return false; 
    },
    onRemove: (file) => {
      const fileObj = fileList.find((f) => f.file.uid === file.uid);
      if (fileObj) {
        URL.revokeObjectURL(fileObj.url); 
        setFileList((prevList) =>
          prevList.filter((f) => f.file.uid !== file.uid)
        );
      }
    },
    showUploadList: {
      showRemoveIcon: true,
    },
    listType: "picture",
    fileList: fileList.map((fileObj) => ({
      uid: fileObj.uid,
      name: fileObj.file.name,
      status: "done",
      url: fileObj.url,
    })),
  };

  const columns = [
    {
      title: "Tên trường",
      dataIndex: "fieldName",
      key: "fieldName",
    },
    {
      title: "Giá trị",
      dataIndex: "fieldValue",
      key: "fieldValue",
      render: (fieldValue) => {
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          let parsedValue;
          try {
            parsedValue = JSON.parse(fieldValue);
          } catch (e) {
            console.error("Error parsing fieldValue as JSON:", e);
            return <span>{fieldValue}</span>;
          }

          if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
            return <span>{fieldValue}</span>;
          }

          const dynamicColumns = Object.keys(parsedValue[0]).map((key) => ({
            title: key,
            dataIndex: key,
            key: key,
          }));

          return (
            <Table
              columns={dynamicColumns} 
              dataSource={parsedValue}
              pagination={false}
              rowKey={(record, index) => index} 
              bordered
            />
          );
        }

        try {
          const parsedValue = JSON.parse(fieldValue);
          return <pre>{JSON.stringify(parsedValue, null, 2)}</pre>; 
        } catch (e) {
          return <span>{fieldValue}</span>;
        }
      },
    },
    {
      title: "Độ chính xác (%)",
      dataIndex: "reliability",
      key: "reliability",
      render: (reliability) => `${reliability}%`,
    },
    // {
    //   title: "Độ chính xác (%)",
    //   dataIndex: "accuracy",
    //   key: "accuracy",
    //   render: (accuracy) => `${accuracy}`,
    // },
  ];

  return (
    <div className="h-screen" style={{ padding: "20px" }}>
      <Modal
        title="Upload ảnh để quét OCR"
        visible={showOcrForm}
        onCancel={() => setShowOcrForm(false)}
        footer={[
          <Button className="cancel-button" key="back" onClick={() => setShowOcrForm(false)}>
            Hủy bỏ
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleScan}
            disabled={fileList.length === 0 || !selectedCategoryId}
          >
            Quét OCR
          </Button>,
        ]}
      >
        <Form layout="vertical">
          {/* Chọn category */}
          <Form.Item label="Chọn danh mục (Category)" required>
            <Select
              placeholder="Chọn danh mục"
              onChange={handleCategoryChange}
              value={selectedCategoryId}
            >
              {categoryList.length > 0 ? (
                categoryList.map((category) => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))
              ) : (
                <Option disabled>Không có danh mục</Option>
              )}
            </Select>
          </Form.Item>

          

          <Form.Item label="Chọn loại OCR" required>
            <Radio.Group
              value={ocrType}
              onChange={(e) => setOcrType(e.target.value)}
            >
              <Radio value="tesseract">Tesseract</Radio>
              <Radio value="easy">EasyOCR</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Upload Image */}
          <Form.Item label="Tải lên hình ảnh" required>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Kéo hoặc chọn ảnh để quét OCR</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Spin spinning={loading} tip="Đang quét...">
        {/* Hiển thị loading khi OCR đang xử lý */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="mb-4 ocr-label">
            <label style={{ fontSize: "20px" }}>Kết quả trích xuất</label>
          </div>
          <Button
            className="record-button"
            type="primary"
            icon={<ScanOutlined />}
            onClick={() => setShowOcrForm(true)}
            style={{ marginBottom: 20 }}
          >
            Quét OCR
          </Button>
        </div>
        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #d9d9d9",
            borderRadius: "8px",
            backgroundColor: "#f5f5f5",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Thống kê độ tin cậy:
          </p>
          <p style={{ margin: "5px 0", color: "#52c41a" }}>
            Số lượng dòng có mức độ tin cậy trên 85%:{" "}
            <strong>{stats.above85}</strong>
          </p>
          <p style={{ margin: "5px 0", color: "#faad14" }}>
            Số lượng dòng có mức độ tin cậy từ 70% đến 85%:{" "}
            <strong>{stats.between70And85}</strong>
          </p>
          <p style={{ margin: "5px 0", color: "#ff4d4f" }}>
            Số lượng dòng có mức độ tin cậy dưới 70%:{" "}
            <strong>{stats.below70}</strong>
          </p>
        </div>

        {ocrResults.length > 0 ? (
          <Collapse accordion>
            {ocrResults.map((result, index) => (
              <Panel header={result.filename} key={index}>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    marginBottom: "20px",
                  }}
                >
                  {/* Hiển thị ảnh */}
                  <div
                    style={{ flex: "1", padding: "10px", textAlign: "center" }}
                  >
                    <Image
                      width="100%"
                      src={result.url}
                      alt={`Ảnh đã quét ${index + 1}`}
                      style={{ marginBottom: "20px" }}
                      fallback="https://via.placeholder.com/150"
                    />

                    <div
                      style={{
                        flex: "1",
                        padding: "10px",
                        textAlign: "center",
                      }}
                    >
                      <h3>Ảnh Sau Xử Lý</h3>
                      {processedImages[index] ? (
                        <Image
                          width="100%"
                          src={`data:image/jpeg;base64,${processedImages[index]}`}
                          alt={`Ảnh đã xử lý OCR ${index + 1}`}
                          style={{
                            border: "2px solid #ccc",
                            marginBottom: "20px",
                          }}
                          fallback="https://via.placeholder.com/150"
                        />
                      ) : (
                        <p>Không có ảnh sau xử lý</p>
                      )}
                    </div>
                  </div>

                  {/* Hiển thị bảng kết quả OCR */}
                  <div
                    style={{ flex: "1", padding: "10px", overflowY: "auto" }}
                  >
                    {result.data.length > 0 ? (
                      <Table
                        columns={columns}
                        dataSource={result.data}
                        rowKey={(record) => record.fieldName + Math.random()} // Đảm bảo unique key
                        pagination={false}
                        bordered
                        style={{ minHeight: "200px" }}
                      />
                    ) : (
                      <p>Không có dữ liệu OCR cho ảnh này.</p>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </Collapse>
        ) : fileList.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p>Không có dữ liệu OCR</p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <Collapse accordion>
              {fileList.map((fileObj, index) => (
                <Panel header={fileObj.file.name} key={index}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Image
                      width={200}
                      src={fileObj.url}
                      alt={`Ảnh tải lên ${index + 1}`}
                      style={{ marginRight: "20px" }}
                      fallback="https://via.placeholder.com/150"
                    />
                    <Button
                      type="danger"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        URL.revokeObjectURL(fileObj.url);
                        setFileList((prevList) =>
                          prevList.filter(
                            (f) => f.file.uid !== fileObj.file.uid
                          )
                        );
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                </Panel>
              ))}
            </Collapse>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default ScanPage;
