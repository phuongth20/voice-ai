// src/components/MessageList.jsx

import React, { useState, useRef, useEffect } from "react";
import PropTypes from 'prop-types';
import { Typography, Tooltip,Button } from 'antd';
import { UserOutlined, RobotOutlined } from "@ant-design/icons";
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; 

const { Text } = Typography;

const handleRecommendChange = (value) => {
  setSelectedRecommend(value);
};
const processContent = (content) => {
  const regex = /\*\*(.*?)\*\*\s*\(\*\*(.*?)\*\*\)/g;
  
  const replaced = content.replace(regex, (match, p1, p2) => {
    return `<span className="entity entity-${p2}">**${p1}**</span> (**${p2}**)`;
  });
  
  return replaced;
};

const MessageItem = ({ message }) => {
  const isUser = message.role === 'user';
  const [selectedRecommend, setSelectedRecommend] = useState(null);

  const formattedTimestampTooltip = message.timestamp
    ? moment(message.timestamp, "HH:mm").format("LLLL")
    : '';

  const processedContent = processContent(message.content);

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      <div style={{
        maxWidth: '70%',
        borderRadius: '20px',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        background: isUser ? '#1E90FF' : '#E0E0E0', 
        color: isUser ? '#FFFFFF' : '#000000',      
      }}>
        {/* Tiêu đề: Vai trò và thời gian */}
        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
          {isUser ? 'Bạn' : 'Trợ lý'}{' '}
          {message.timestamp && (
            <Tooltip title={formattedTimestampTooltip}>
              <span style={{ fontSize: '12px', color: '#E62968' }}>
                ({message.timestamp})
              </span>
            </Tooltip>
          )}
        </div>

        {/* Nội dung tin nhắn với định dạng Markdown và HTML */}
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{processedContent}</ReactMarkdown>
        </div>

        {/* Hiển thị file_content nếu có */}
        {message.file_content && (
          <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
            <Text strong>Nội dung tệp:</Text>
            <p style={{ fontStyle: "italic" }}>{message.file_content}</p>
          </div>
        )}

        {/* Hiển thị các liên kết file nếu có */}
        {message.summaryFileUrl && (
          <div style={{ marginTop: '8px' }}>
            <Text strong>File đính kèm:</Text>
            <a href={message.summaryFileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1E90FF' }}>
              Tải xuống
            </a>
          </div>
        )}

        {message.recommend && (
              <div style={{display:"block"}} className="recommend">
                {message.recommend.map((item, index) => (
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
    </div>
  );
};

MessageItem.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    file_content: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    summaryFileUrl: PropTypes.string,
    question_date: PropTypes.string,
    response_date: PropTypes.string,
    file_size_bytes: PropTypes.number,
    response_time_seconds: PropTypes.number,
    recommend: PropTypes.string
  }).isRequired,
};

const MessageList = ({ messages }) => (
  <div>
    {messages.map((msg, index) => (
      <MessageItem key={index} message={msg} />
    ))}
  </div>
);

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    summaryFileUrl: PropTypes.string,
    question_date: PropTypes.string,
    response_date: PropTypes.string,
    file_content: PropTypes.string,
    file_size_bytes: PropTypes.number,
    response_time_seconds: PropTypes.number,
    recommend: PropTypes.string
  })).isRequired,
};

export default MessageList;
