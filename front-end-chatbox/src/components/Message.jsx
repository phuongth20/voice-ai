const MessageItem = ({ message }) => {
  const isUser = message.role === 'user';
  let displayContent = message.content;

  if (!isUser) { // Nếu là trợ lý
    try {
      // Phân tích chuỗi JSON
      const parsedContent = JSON.parse(message.content);
      
      let extractedContent = parsedContent.content || "";

      extractedContent = extractDesiredContent(extractedContent);

      if (typeof extractedContent === "string" && extractedContent.includes("\\u")) {
        extractedContent = decodeUnicode(extractedContent);
      }

      displayContent = extractedContent;
    } catch (error) {
      console.error("Error parsing message content:", error);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      <div
        style={{
          maxWidth: '70%',
          borderRadius: '20px',
          padding: '12px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          background: isUser ? '#1890ff' : '#f0f2f5',
          color: isUser ? '#fff' : '#000',
        }}
      >
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>
          {isUser ? 'Bạn' : 'Trợ lý'} - {message.timestamp}
        </div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
          <ReactMarkdown>{displayContent}</ReactMarkdown>
        </div>
        {message.summaryFileUrl && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = message.summaryFileUrl;
                link.setAttribute('download', 'summary_result.txt');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Tải Tóm Tắt
            </button>
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
    timestamp: PropTypes.string.isRequired,
    summaryFileUrl: PropTypes.string,
  }).isRequired,
};
