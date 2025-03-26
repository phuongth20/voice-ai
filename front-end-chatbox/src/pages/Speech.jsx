import React, { useState, useRef, useEffect } from "react";
import {
  Typography,
  Button,
  Space,
  message,
  Switch,
  Select,
  Steps,
  Collapse,
} from "antd";
import {
  AudioOutlined,
  PauseOutlined,
  ReloadOutlined,
  SoundOutlined,
  StopOutlined,
  SolutionOutlined,
  LoadingOutlined,
  SmileOutlined,
} from "@ant-design/icons";

import axios from "axios";

const { Text } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;

const SpeechToTextPage = () => {
  const [micStatus, setMicStatus] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [intent, setIntent] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [recommend, setRecommend] = useState([]);
  const [selectedRecommend, setSelectedRecommend] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAudio, setAiAudio] = useState("");
  const [processingTime, setProcessingTime] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const audioIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const [isStatus, setIsStatus] = useState(false);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [audioURL, setAudioURL] = useState("");

  const [stepsStatus, setStepsStatus] = useState({
    "Tiền xử lý": "wait",
    "Speech to text": "wait",
    "Phân loại ý định": "wait",
    "Tạo phản hồi": "wait",
  });

  const aiTextWords = aiResponse ? aiResponse.split(" ") : [];

  const updateStepsStatus = (newStatus) => {
    setStepsStatus((prevStatus) => ({
      ...prevStatus,
      ...newStatus,
    }));
  };

  const getStepStatus = (status) => {
    if (status === "wait") return "wait";
    if (status === "process") return "process";
    if (status === "finish") return "finish";
    if (status.startsWith("Lỗi")) return "error";
    return "wait";
  };

  const getCurrentStep = () => {
    const steps = [
      "Tiền xử lý",
      "Speech to text",
      "Phân loại ý định",
      "Tạo phản hồi",
    ];

    for (let i = 0; i < steps.length; i++) {
      const status = stepsStatus[steps[i]];
      if (status === "process") {
        return i;
      }
      if (status === "error") {
        return i;
      }
    }

    return steps.length;
  };

  const trackStatus = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/process-status"
        );
        if (response.status === 200) {
          const statusData = response.data.status;
          console.log("Status Data:", statusData);
          updateStepsStatus(statusData);

          if (statusData["Tạo phản hồi"] === "finish") {
            console.log("Processing finished.");
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          const errorStep = Object.keys(statusData).find(
            (step) => statusData[step] && statusData[step].startsWith("Lỗi")
          );
          if (errorStep) {
            console.log(`Error in step: ${errorStep}`);
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            message.error(`Có lỗi xảy ra: ${statusData[errorStep]}`);
          }
        } else {
          console.log("Unexpected response status:", response.status);
        }
      } catch (error) {
        console.log("Error during fetching status:", error);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        message.error("Không thể lấy trạng thái xử lý.");
        console.error("Error fetching status:", error);
      }
    }, 5000);
  };

  const playAiAudio = () => {
    if (aiAudio) {
      const audio = new Audio(`http://127.0.0.1:5000/ai-audio/${aiAudio}`);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      setCurrentWordIndex(0);

      const updateText = () => {
        if (audio.duration) {
          const progress = (audio.currentTime / audio.duration) * 100;
          setAudioProgress(progress);

          const currentWordIdx = Math.floor(
            (audio.currentTime / audio.duration) * aiTextWords.length
          );

          if (currentWordIdx < aiTextWords.length) {
            setCurrentText(aiTextWords.slice(0, currentWordIdx + 1).join(" "));
            setCurrentWordIndex(currentWordIdx);
          }
        }
      };

      const interval = setInterval(() => {
        updateText();
        if (audio.currentTime >= audio.duration) {
          clearInterval(interval);
          audioIntervalRef.current = null;
        }
      }, 50);

      audioIntervalRef.current = interval;

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      });
    }
  };
  const pauseAiAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  // Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunks, {
          type: mediaRecorderRef.current.mimeType,
        });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setMicStatus(true);
      message.success("Bắt đầu ghi âm!");
    } catch (error) {
      message.error(
        "Microphone không khả dụng. Vui lòng kiểm tra kết nối và quyền."
      );
      setMicStatus(false);
      console.error("Error accessing microphone:", error);
    }
  };

  // Dừng ghi âm
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setMicStatus(false);
      message.info("Đã dừng ghi âm.");
    }
  };

  // Xử lý thay đổi của Switch
  const handleSwitchChange = (checked) => {
    if (checked) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Xử lý khi người dùng chọn một đề xuất
  const handleRecommendChange = (value) => {
    setSelectedRecommend(value);
  };

  // Gửi file audio lên backend
  const handleConfirm = async () => {
    if (!audioBlob) {
      message.warning("Vui lòng ghi âm trước khi xác nhận!");
      return;
    }

    setIsLoading(true);
    setIsStatus(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    trackStatus();
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/upload-audio",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setTranscript(response.data.transcribed_text);
      setAiResponse(response.data.ai_response);
      setIntent(response.data.intent);
      setConfidence(response.data.confidence);
      setRecommend(response.data.recommend);
      setAiAudio(response.data.ai_audio);
      setProcessingTime(response.data.processing_time_seconds);

      console.log("Response from server:", response);

      message.success("Xử lý âm thanh thành công!");
    } catch (error) {
      message.error("Không thể xử lý âm thanh. Vui lòng thử lại.");
      console.error("Error uploading audio:", error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const resetRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTranscript("");
    setAiResponse("");
    setIntent("");
    setConfidence(0);
    setAudioURL("");
    setAudioBlob(null);
    setRecommend([]);
    setSelectedRecommend(null);
    setMicStatus(false);
    setAudioProgress(0);
    setCurrentText("");
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setProcessingTime(0);
    setIsStatus(false);
    setStepsStatus({
      "Tiền xử lý": "wait",
      "Speech to text": "wait",
      "Phân loại ý định": "wait",
      "Tạo phản hồi": "wait",
    });
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, []);
  const stepsItems = Object.keys(stepsStatus).map((step, index) => {
    let icon;
    let color;

    switch (stepsStatus[step]) {
      case "process":
        icon = <LoadingOutlined spin />;
        color = "#1890ff";
        break;
      case "finish":
        icon = <SmileOutlined />;
        color = "#002395";
        break;
      case "wait":
      default:
        icon = <SolutionOutlined />;
        color = "#d9d9d9";
        break;
    }

    return {
      title: step,
      status: getStepStatus(stepsStatus[step]),
      icon: React.cloneElement(icon, { style: { color: color } }),
      description: stepsStatus[step].startsWith("Lỗi")
        ? stepsStatus[step]
        : null,
    };
  });

  return (
    <div style={styles.container}>
      <div className="speechTitle">
        <Typography.Title level={2} style={styles.title}>
          Speech to Text
        </Typography.Title>
      </div>

      <div style={styles.controls}>
        <div>
          <Typography.Text className="speech-sub-title">
            Microphone:
            <Switch
              checked={micStatus}
              onChange={handleSwitchChange}
              checkedChildren="On"
              unCheckedChildren="Off"
              style={{ marginLeft: "10px" }}
            />
          </Typography.Text>
          <Space style={{ marginLeft: "20px" }}>
            <Button
              shape="circle"
              icon={<AudioOutlined />}
              size="large"
              className="record-button"
              onClick={startRecording}
              disabled={micStatus}
            />
            <Button
              shape="circle"
              icon={<PauseOutlined />}
              size="large"
              className="stop-button"
              onClick={stopRecording}
              disabled={!micStatus}
            />
            <Button
              shape="circle"
              icon={<ReloadOutlined />}
              size="large"
              className="reset-button"
              onClick={resetRecording}
            />
          </Space>
        </div>
      </div>

      {audioURL && (
        <div style={styles.audioPreview}>
          <Typography.Text style={styles.audioText}>
            Audio Preview:
          </Typography.Text>
          <audio src={audioURL} controls style={styles.audioPlayer} />
        </div>
      )}

      <div style={styles.results}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Typography.Text
            className="speech-sub-title"
            style={{ fontSize: "16px", fontWeight: "bold" }}
          >
            Transcribed Text:
          </Typography.Text>

          <Typography.Text>
            <b className="speech-sub-title">Classification confidence:</b>{" "}
            {(confidence * 100).toFixed(1)}%
          </Typography.Text>
        </div>
        <div className="transcript-text" style={styles.textArea1}>
          {isLoading
            ? "Processing audio..."
            : transcript || "Transcript will appear here..."}
        </div>

        <div style={styles.textArea1}>
          <Typography.Text strong>
            AI Response:
            <Button
              style={{
                marginRight: "10px",
                marginLeft: "10px",
                width: "35px",
              }}
              shape="circle"
              icon={<SoundOutlined />}
              size="large"
              className="record-button"
              onClick={playAiAudio}
              disabled={isPlaying}
            />
            {isPlaying && (
              <Button
                shape="circle"
                icon={<StopOutlined />}
                size="large"
                className="stop-button"
                onClick={pauseAiAudio}
                disabled={!isPlaying}
              />
            )}
          </Typography.Text>
          <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {currentText
              ? (() => {
                  const sentences = currentText.split(/(?<!\.\.)\.(?!\.)/);
                  return sentences.map((sentence, index) => (
                    <React.Fragment key={index}>
                      {sentence.trim()}.{index < sentences.length - 1 && <br />}
                    </React.Fragment>
                  ));
                })()
              : "AI Response will appear here..."}
          </div>
        </div>

        <div className="speech-intent" style={{ marginTop: "10px" }}>
          <div>
            <Typography.Text className="speech-sub-title">
              Recommend:
            </Typography.Text>
            {recommend.length > 0 && (
              <div className="recommend">
                {recommend.map((item, index) => (
                  <Button
                    className="recommend-content"
                    key={index}
                    onClick={() => {
                      message.info(`Bạn đã chọn: ${item}`);
                      setSelectedRecommend(item);
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Typography.Text className="speech-sub-title">
              Time:
              <Typography.Text> {processingTime.toFixed(1)}s</Typography.Text>
            </Typography.Text>
          </div>
        </div>
      </div>
      {isStatus && (
        <div style={styles.stepsContainer}>
          <Collapse>
            <Panel
              header={
                <span style={styles.collapseHeader}>Xem các bước xử lý</span>
              }
              key="1"
            >
              <Steps items={stepsItems} />
            </Panel>
          </Collapse>
        </div>
      )}

      <div style={styles.footer}>
        <Button className="cancel-button" onClick={resetRecording}>
          Cancel
        </Button>
        <Button
          className="confirm-button"
          type="primary"
          style={{ backgroundColor: "#002395", color: "#fff", border: "none" }}
          onClick={handleConfirm}
          loading={isLoading}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    margin: "0 auto",
    borderRadius: "8px",
    background: "#dee6eb",
    color: "#002395",
    maxWidth: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#002395",
    fontSize: "30px",
    textTransform: "uppercase",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: "20px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    background: "#f9f9f9",
    padding: "10px 17px 10px 20px",
    borderRadius: "8px",
    textTransform: "uppercase",
  },
  stepsContainer: {
    margin: "20px 0",
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  textArea1: {
    marginTop: "10px",
    marginBottom: "10px",
    fontSize: "14px",
    background: "#fff",
    color: "rgb(53 53 53)",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #d9d9d9",
    overflowY: "auto",
    minHeight: "100px",
  },
  results: {
    marginBottom: "20px",
    color: "#002395",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
  },
  audioPreview: {
    marginBottom: "20px",
    width: "100%",
  },
  audioText: {
    color: "#002395",
    marginLeft: "20px",
  },
  audioPlayer: {
    width: "100%",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  aiResponseText: {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
  collapseHeader: {
    fontSize: "14px",
    color: "#002395",
    fontWeight: "500",
  },
};

export default SpeechToTextPage;
