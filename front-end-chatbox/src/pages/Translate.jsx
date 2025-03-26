import React, { useState, useEffect } from 'react';
import { Select, Input, Button, Space, Divider, Card, Typography } from 'antd';
import { AudioOutlined, SwapOutlined, StopOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css'; // Import Ant Design styles

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

function TranslatePage() {
  const [recording, setRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false); // Trạng thái loading khi dịch
  const [inputText, setInputText] = useState(''); // Input text (Vietnamese)
  const [translatedText, setTranslatedText] = useState(''); // Translated text
  const [sourceLang, setSourceLang] = useState('vi'); // Source language
  const [targetLang, setTargetLang] = useState('en'); // Target language
  const [audioUrl, setAudioUrl] = useState(''); // URL for TTS audio
  const [recorder, setRecorder] = useState(null); // Lưu trữ MediaRecorder

  // Start recording
  const startRecording = async () => {
    setRecording(true);
    setInputText('');
    setTranslatedText('');
    setAudioUrl('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Sử dụng WebM format
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm'); // Đặt tên file với đuôi .webm
        formData.append(
          'src_lang',
          sourceLang === 'vi' ? 'vie_Latn' : sourceLang === 'en' ? 'eng_Latn' : 'fra_Latn'
        );
        formData.append(
          'tgt_lang',
          targetLang === 'vi' ? 'vie_Latn' : targetLang === 'en' ? 'eng_Latn' : 'fra_Latn'
        );

        try {
          const response = await fetch('http://localhost:5000/process', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (data.error) {
            alert(data.error);
          } else {
            setInputText(data.input_text);
            setTranslatedText(data.translated_text);
            setAudioUrl('http://localhost:5000/tts_output');
          }
        } catch (error) {
          alert('Lỗi: ' + error.message);
        }
        setRecording(false);
        setRecorder(null); // Reset recorder
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder); // Lưu recorder vào state
    } catch (error) {
      alert('Lỗi truy cập micro: ' + error.message);
      setRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recorder && recording) {
      recorder.stop();
      setRecording(false);
    }
  };

  // Swap languages
  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setAudioUrl('');
  };

  // Handle text translation
  const handleTextTranslate = async () => {
    if (!inputText) {
      alert('Vui lòng nhập văn bản để dịch');
      return;
    }

    setIsTranslating(true); // Bật trạng thái loading
    setTranslatedText(''); // Xóa bản dịch cũ
    setAudioUrl(''); // Xóa audio cũ

    const formData = new FormData();
    formData.append('text', inputText);
    formData.append(
      'src_lang',
      sourceLang === 'vi' ? 'vie_Latn' : sourceLang === 'en' ? 'eng_Latn' : 'fra_Latn'
    );
    formData.append(
      'tgt_lang',
      targetLang === 'vi' ? 'vie_Latn' : targetLang === 'en' ? 'eng_Latn' : 'fra_Latn'
    );

    try {
      const response = await fetch('http://localhost:5000/translate-text', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setTranslatedText(data.translated_text);
        setAudioUrl('http://localhost:5000/tts_output');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setIsTranslating(false); // Tắt trạng thái loading
    }
  };

  return (
    <div className="translate-page">
      <div className="container">
        {/* Header */}
        <Title level={3} style={{ textAlign: 'center', marginBottom: '20px', color: '#1a1a1a' }}>
          Dịch Ngôn Ngữ
        </Title>

        {/* Language Selector */}
        <div className="lang-selector">
          <Select
            value={sourceLang}
            onChange={(value) => setSourceLang(value)}
            style={{ width: 150 }}
            size="large"
            className="custom-select"
          >
            <Option value="vi">Tiếng Việt</Option>
            <Option value="en">Tiếng Anh</Option>
            <Option value="fr">Tiếng Pháp</Option>
          </Select>

          <Button
            type="default"
            icon={<SwapOutlined />}
            onClick={swapLanguages}
            size="large"
            className="swap-btn"
          />

          <Select
            value={targetLang}
            onChange={(value) => setTargetLang(value)}
            style={{ width: 150 }}
            size="large"
            className="custom-select"
          >
            <Option value="en">Tiếng Anh</Option>
            <Option value="fr">Tiếng Pháp</Option>
            <Option value="vi">Tiếng Việt</Option>
          </Select>
        </div>

        {/* Text Containers */}
        <div className="text-container">
          {/* Input Text Box */}
          <Card className="text-card" title="Nhập Văn Bản">
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập, nói hoặc chụp ảnh"
              rows={6}
              className="custom-textarea"
            />
            <Space style={{ marginTop: '10px' }}>
              <Button
                icon={<AudioOutlined />}
                onClick={startRecording}
                disabled={recording}
                size="large"
                className="mic-btn"
              >
                Ghi Âm
              </Button>
              {recording && (
                <Button
                  icon={<StopOutlined />}
                  onClick={stopRecording}
                  size="large"
                  danger
                  className="stop-btn"
                >
                  Dừng Ghi Âm
                </Button>
              )}
              <Button
                type="primary"
                onClick={handleTextTranslate}
                size="large"
                className="translate-btn"
                loading={isTranslating}
                disabled={isTranslating}
              >
                {isTranslating ? 'Đang Dịch...' : 'Dịch'}
              </Button>
            </Space>
          </Card>

          {/* Output Text Box */}
          <Card className="text-card" title="Bản Dịch">
            <TextArea
              value={translatedText}
              readOnly
              placeholder="Bản dịch sẽ xuất hiện ở đây"
              rows={6}
              className="custom-textarea output-textarea"
            />
            {audioUrl && (
              <audio
                controls
                src={audioUrl}
                style={{ width: '100%', marginTop: '10px' }}
                className="audio-player"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TranslatePage;