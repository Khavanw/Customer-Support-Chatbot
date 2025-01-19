import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';


// Các tốc độ typing phổ biến (đơn vị: milliseconds)
const TYPING_SPEEDS = {
  FAST: 10,    // Rất nhanh - phù hợp với tin nhắn ngắn
  NORMAL: 40,  // Tốc độ thông thường - cân bằng giữa đọc và chờ đợi
  SLOW: 80,    // Chậm - dễ theo dõi nhưng có thể gây sốt ruột
  VERY_SLOW: 100 // Rất chậm - chỉ phù hợp với mục đích demo
};

const TypeWriter = ({ content, speed = TYPING_SPEEDS.SLOW, onImageClick }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCaret, setShowCaret] = useState(true);

  // Cấu hình DOMPurify để cho phép các thuộc tính cần thiết
  const purifyConfig = {
    ADD_ATTR: ['onclick', 'target', 'class'],
    ADD_TAGS: ['img'],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'onclick']
  };

  const formattedContent = useMemo(() => {
    if (!content) return [];

    // Thêm handler cho các thẻ img
    let processedContent = content.replace(
      /<img([^>]*)>/g,
      (match, attributes) => {
        // Lấy src từ attributes
        const srcMatch = attributes.match(/src="([^"]*)"/);
        const src = srcMatch ? srcMatch[1] : '';
        
        return `<img${attributes} onclick="window.handleImageClick('${src}')" style="cursor: pointer;">`;
      }
    );

    const tokens = processedContent.split(/(<[^>]+>)/g).filter(Boolean);
    return tokens;
  }, [content]);

  useEffect(() => {
    const caretInterval = setInterval(() => {
      setShowCaret(prev => !prev);
    }, 300); // Nhấp nháy caret mỗi 0.5 giây

    return () => clearInterval(caretInterval);
  }, []);

  useEffect(() => {
    if (!formattedContent.length || currentIndex >= formattedContent.length) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedContent(prev => prev + formattedContent[currentIndex]);
      setCurrentIndex(currentIndex + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [formattedContent, currentIndex, speed]);

  // Sanitize với config đã định nghĩa
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(displayedContent, purifyConfig);
  }, [displayedContent]);

  // Thêm caret vào cuối nội dung hiển thị với kích thước và màu sắc mới
  const displayWithCaret = useMemo(() => {
    if (isTyping) {
      return `${displayedContent}<div class="caret" style="${showCaret ? 'opacity: 1;' : 'opacity: 0;'}">𒊹</div>`;
    }
    return displayedContent;
  }, [displayedContent, showCaret, isTyping]);
  

  return (
    <div className="flex flex-col">
      <div className="relative whitespace-normal transition-all duration-200 ease-in-out">
        <span dangerouslySetInnerHTML={{ __html: displayWithCaret }} />
      </div>
    </div>
  );
};

export default TypeWriter;
