import robot_img from "../assets/logo.png";
import { useState, useRef, useEffect } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-regular-svg-icons";
import './Chatbot.css';
import TypeWriter from './TypeWriter';

const LoadingSpinner = ({ showTimer, timeOfRequest }) => (
  <div className="flex flex-col items-center gap-2">
    <ScaleLoader
      color="#000000"
      loading={true}
      height={10}
      width={10}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
    {showTimer && (
      <p className="text-xs font-medium">{timeOfRequest + "/60s"}</p>
    )}
  </div>
);

function ChatBot(props) {
  const messagesEndRef = useRef(null);
  const [timeOfRequest, SetTimeOfRequest] = useState(0);
  const [promptInput, SetPromptInput] = useState("");
  const [chatHistory, SetChatHistory] = useState([]);
  const [isLoading, SetIsLoad] = useState(false);
  const [isGen, SetIsGen] = useState(false);
  const [sourceData, SetSourceData] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const welcomeMessageParts = [
      "Xin chào! 👋 Tôi là ASC Chatbot - trợ lý thông minh luôn sẵn sàng hỗ trợ hướng dẫn và giải đáp thắc mắc của bạn một cách hiệu quả nhất! 😊<br><br>",
      "• Bạn đang cần hỗ trợ thông tin gì?<br><br>", 
      "• Hãy cho tôi biết, tôi sẽ nhanh chóng hướng dẫn và giải đáp thắc mắc của bạn một cách hiệu quả nhất! 😊"
  ].map(msg => msg.trim());

  const commonQuestions = [
    "Hướng dẫn thanh toán học phí trực tuyến trên app ONEUNI?",
    "Hướng dẫn thanh toán học phí trực tuyến trên WEBSITE?",
    "Hướng dẫn cấu hình phiếu thu?",
    "Hướng dẫn cấu hình kỳ thu?", 
    "Hướng dẫn định nghĩa loại khoản thu?",
    "Hướng dẫn định nghĩa tên khoản thu cố định?",
    "Hướng dẫn định nghĩa tên khoản thu dịch vụ?",
    "Hướng dẫn định nghĩa loại khoản chi?",
    "Hướng dẫn định nghĩa tên chính sách miễn giảm, khoản chi tiền?",
    "Hướng dẫn chọn khoản thu đổ công nợ?",
    "Hướng dẫn đổ công nợ cho học sinh?",
    "Hướng dẫn quản lý danh sách học sinh được miễn giảm?",
    "Hướng dẫn thiết lập nghĩ lễ?",
    "Hướng dẫn đổ công nợ học phí và các khoản thu khác cho học sinh?",
    "Hướng dẫn đăng ký Tiền ăn cho học sinh?",
    "Hướng dẫn chấm hoàn phí?",
    "Hướng dẫn in phiếu báo công nợ?",
    "Hướng dẫn tạo phòng ban?",
    "Hướng dẫn tạo thông tin kế toán?",
    "Hướng dẫn tạo nhóm quyền?",
    "Hướng dẫn phân quyền nhân sự?",
    "Hướng dẫn thu học của học sinh?",
    "Hướng dẫn xem lịch sử thu tiền của học sinh?",
    "Hướng dẫn xem danh sách các phiếu thu đã thu trong ngày?",
    "Hướng dẫn in phiếu thu?",
    "Hướng dẫn gạch nợ nhanh?"
  ];

  const [dataChat, SetDataChat] = useState([
    [
      "start",
      [
        welcomeMessageParts.join('\n\n'),
        null,
      ],
    ],
  ]);

  const [selectedImage, setSelectedImage] = useState(null);

  const [fullChatHistory, setFullChatHistory] = useState([]);

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const messageRefs = useRef({});

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleChatHistoryClick = (index) => {
    const selectedChat = fullChatHistory[index];
    if (selectedChat) {
      SetIsGen(false);
      SetIsLoad(false);
      setWelcomeIndex(welcomeMessageParts.length - 1);
      
      const messageIndex = dataChat.findIndex(message => 
        message[1][0] === selectedChat.messages[0][1][0]
      );

      if (messageIndex !== -1) {
        const messageElement = messageRefs.current[messageIndex];
        if (messageElement) {
          messageElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
          
          messageElement.classList.add('highlight-message');
          setTimeout(() => {
            messageElement.classList.remove('highlight-message');
          }, 1500);
        }
      }
    }
  };

  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    
    const chatIndex = fullChatHistory.findIndex(chat => chat.id === id);
    
    const newFullHistory = fullChatHistory.filter(chat => chat.id !== id);
    setFullChatHistory(newFullHistory);
    
    const newChatHistory = chatHistory.filter((_, index) => index !== chatIndex);
    SetChatHistory(newChatHistory);
  
    if (newFullHistory.length === 0) {
      resetChat();
    }
  };

  useEffect(() => {
    ScrollToEndChat();
  }, [isLoading]);

  useEffect(() => {
    if (fullChatHistory.length === 0) {
      SetChatHistory([]);
      resetChat();
    }
  }, [fullChatHistory]);

  useEffect(() => {
    const interval = setInterval(() => {
      SetTimeOfRequest((prevTime) => {
        return prevTime + 1;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isGen && dataChat.length === 1 && !fullChatHistory.length) {
      const timer = setInterval(() => {
        setWelcomeIndex(prev => {
          if (prev >= welcomeMessageParts.length - 1) {
            clearInterval(timer);
            SetIsGen(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isGen, dataChat.length, fullChatHistory.length]);

  function ScrollToEndChat() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      console.warn("messagesEndRef.current is null");
    }
  }

  const onChangeHandler = (event) => {
    SetPromptInput(event.target.value);
  };

  async function SendMessageChat() {
    if (promptInput !== "" && !isLoading) {
      try {
        SetIsLoad(true);
        setLoadingIndex(0);
        SetTimeOfRequest(0);
        const currentPrompt = promptInput;
        SetPromptInput("");
        
        const chatId = Date.now().toString();
        
        const userMessage = ["end", [currentPrompt, sourceData]];
        
        SetDataChat(prev => [
          ...prev, 
          userMessage,
          ["start", ["", sourceData]]
        ]);

        const response = await fetch("http://localhost:5000/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question: currentPrompt
          })
        });

        if (!response.ok) {
          throw new Error(`Server trả về lỗi: ${response.status}`);
        }

        const data = await response.json(); 
        if (data.stream) {
          try {
            let parsedAnswer;
            
            let fullContent = data.stream.map(chunk => chunk.content).join('');
            
            if (fullContent.includes('```json')) {
              const jsonMatch = fullContent.match(/```json\n([\s\S]*?)```/);
              if (jsonMatch) {
                parsedAnswer = JSON.parse(jsonMatch[1]);
              }
            } else {
              const validChunks = data.stream
                .map(chunk => chunk.content)
                .filter(content => content !== '```');
                
              parsedAnswer = validChunks.reduce((acc, content) => {
                try {
                  const obj = JSON.parse(content);
                  return { ...acc, ...obj };
                } catch (e) {
                  return acc;
                }
              }, {});
            }

            if (parsedAnswer) {
              const formattedResponse = formatResponse(parsedAnswer);
              
              SetDataChat(prev => {
                const newDataChat = [...prev];
                const lastMessage = newDataChat[newDataChat.length - 1];
                if (lastMessage[0] === "start") {
                  lastMessage[1][0] = formattedResponse;
                }
                return newDataChat;
              });

              setFullChatHistory(prev => [
                ...prev,
                {
                  id: chatId,
                  timestamp: new Date().toISOString(),
                  question: currentPrompt,
                  answer: formattedResponse,
                  messages: [
                    userMessage,
                    ["start", [formattedResponse, sourceData]]
                  ]
                }
              ]);
            }

          } catch (e) {
            console.error("Error processing response:", e);
            throw new Error("Không thể xử lý phản hồi từ server");
          }
        }

      } catch (error) {
        SetDataChat(prev => {
          const newDataChat = [...prev];
          const lastMessage = newDataChat[newDataChat.length - 1];
          if (lastMessage[0] === "start") {
            lastMessage[1][0] = `
              <div class="error-message bg-red-50 p-4 rounded-lg">
                <p class="text-red-600 font-medium">Đã xảy ra lỗi: ${error.message}</p>
                <p class="text-gray-600 text-sm mt-2">
                  Vui lòng thử lại sau hoặc liên hệ hỗ trợ kỹ thuật nếu lỗi vẫn tiếp tục.
                </p>
              </div>`;
          }
          return newDataChat;
        });

      } finally {
        SetIsLoad(false);
        SetIsGen(false);
        ScrollToEndChat();
      }
    }
  }

  function formatResponse(parsedAnswer) {
    let imagesHtml = '';
    if (parsedAnswer.images && parsedAnswer.images.url) {
      if (Array.isArray(parsedAnswer.images.url)) {
        imagesHtml = `
          <div class="images-container flex flex-col gap-6 my-4">
            ${parsedAnswer.images.url.map((url, index) => `
              <div class="image-wrapper flex flex-col items-center">
                <img 
                  src="${url}" 
                  alt="${parsedAnswer.caption?.[index] || ''}"
                  class="response-image w-full hover:opacity-80 transition-opacity h-[300px] object-contain rounded-lg shadow-md cursor-zoom-in" 
                />
                ${parsedAnswer.caption?.[index] ? `
                  <div class="image-caption text-center text-sm text-gray-600 mt-2 font-medium">
                    ${parsedAnswer.caption[index]}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      } else if (typeof parsedAnswer.images.url === 'string') {
        imagesHtml = `
          <div class="images-container flex flex-col gap-6 my-4">
            <div class="image-wrapper flex flex-col items-center">
              <img 
                src="${parsedAnswer.images.url}" 
                alt="${parsedAnswer.caption || ''}"
                class="response-image w-full hover:opacity-80 transition-opacity h-[300px] object-contain rounded-lg shadow-md cursor-zoom-in" 
              />
              ${parsedAnswer.caption ? `
                <div class="image-caption text-center text-sm text-gray-600 mt-2 font-medium">
                  ${parsedAnswer.caption}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    // Xử lý steps array với Markdown và YouTube links
    const stepsHtml = Array.isArray(parsedAnswer.steps) ? parsedAnswer.steps
      .map((step) => {
        const stepWithYouTube = step.replace(
          /https:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)(?:&\S*)?/g,
          (match, videoId) => `
            <div class="youtube-preview mt-2 mb-4">
              <a href="${match}" target="_blank" class="block relative">
                <img 
                  src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
                  alt="YouTube Preview"
                  class="w-full rounded-lg shadow-md hover:opacity-90 transition-opacity"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          `
        );

        const stepWithIcons = stepWithYouTube.replace(
          /(https:\/\/storage\.googleapis\.com\/ascchatbot\/icons\/[\w-]+\.png)/g,
          '<img src="$1" alt="Icon" class="inline-icon h-4 w-4 mx-1 align-text-bottom" />'
        );

        const stepWithBold = stepWithIcons.replace(
          /\*\*([^*]+)\*\*/g,
          '<strong class="font-medium">$1</strong>'
        );

        return `<div class="step-item mb-3">${stepWithBold}</div>`;
      }).join('') : '';

    let notesHtml = '';
    if (parsedAnswer.notes) {
      if (Array.isArray(parsedAnswer.notes) && parsedAnswer.notes.length > 0) {
        notesHtml = `
          <div class="notes">
            <span class="note-label"><strong>Lưu ý:</strong></span> 
            <span class="note-content">
              ${parsedAnswer.notes.map(note => 
                note.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              ).join('')}
            </span>
          </div>
        `;
      } else if (typeof parsedAnswer.notes === 'string') {
        notesHtml = `
          <div class="notes">
            <span class="note-label"><strong>Lưu ý:</strong></span> 
            <span class="note-content">
              ${parsedAnswer.notes.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}
            </span>
          </div>
        `;
      }
    }

    let sourceHtml = '';
    if (parsedAnswer.source) {
      if (typeof parsedAnswer.source === 'string') {
        sourceHtml = `
          <div class="source">
            <p class="text-sm text-gray-600 mb-1">Đây là trang web chính thức của ASC:</p>
            <a href="${parsedAnswer.source}" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
              ${parsedAnswer.source}
            </a>
          </div>
        `;
      } else if (typeof parsedAnswer.source === 'object') {
        sourceHtml = `
          <div class="source">
            ${parsedAnswer.source.description ? `${parsedAnswer.source.description} ` : ''}
            ${parsedAnswer.source.url ? `
              <a href="${parsedAnswer.source.url}" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                ${parsedAnswer.source.url}
              </a>
            ` : ''}
          </div>
        `;
      }
    }

    // Format description với các icon và styling
    let descriptionHtml = '';
    if (parsedAnswer.description) {
      descriptionHtml = parsedAnswer.description
        .replace(
          /(https:\/\/storage\.googleapis\.com\/ascchatbot\/icons\/[\w-]+\.png)/g,
          '<img src="$1" alt="Icon" class="inline-icon h-4 w-4 mx-1 align-text-bottom" />'
        )
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\s\*\s/g, ' • ');
    }

    return `
      <div class="chat-message">
        <div class="greeting mb-2 text-gray-800">
          ${parsedAnswer.greeting || ''}
        </div>
        
        <div class="description mb-4 text-gray-700 leading-relaxed">
          ${descriptionHtml}
        </div>
        
        ${stepsHtml ? `
          <div class="steps">
            ${stepsHtml}
          </div>
        ` : ''}
        
        ${notesHtml}
        
        ${imagesHtml}

        ${sourceHtml}
        
        <div class="closing">
          ${parsedAnswer.friendly_closing || ''}
        </div>
      </div>
    `;
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      console.log("Enter key pressed, sending message");
      SendMessageChat();
    }
  };

  const [reference, SetReference] = useState({
    title: "",
    source: "",
    url: "",
    text: ``,
  });

  console.log("Current state:", {
    promptInput,
    chatHistory,
    isLoading,
    isGen,
    dataChat,
    reference,
    timeOfRequest
  });

  // Thêm window.handleImageClick để có thể gọi từ innerHTML
  useEffect(() => {
    window.handleImageClick = handleImageClick;
    return () => {
      delete window.handleImageClick;
    };
  }, []);

  // Thêm hàm resetChat
  const resetChat = () => {
    setWelcomeIndex(0);
    SetDataChat([
      [
        "start",
        [
          welcomeMessageParts.join('\n\n'),
          null,
        ],
      ],
    ]);
    
    // Kích hoạt animation typing chỉ khi không có lịch sử
    if (!fullChatHistory.length) {
      SetIsGen(true);
    }
    
    // Reset input và loading states
    SetPromptInput("");
    SetIsLoad(false);
    SetTimeOfRequest(0);
    
    // Scroll về đầu chat
    setTimeout(ScrollToEndChat, 100);
  };

  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Thêm style cho highlight effect
  const highlightStyle = `
    .highlight-message {
      animation: highlightPulse 1.5s ease-out;
    }

    @keyframes highlightPulse {
      0% {
        background-color: rgba(59, 130, 246, 0.2);
        transform: scale(1.02);
      }
      100% {
        background-color: transparent;
        transform: scale(1);
      }
    }
  `;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-100 h-[85vh] ">
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] left-3 mt-2 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content rounded-2xl mt-3 overflow-y-auto overflow-x-hidden scroll-y-auto max-h-[80vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">

          {/* Single sidebar content container */}
          <ul className="menu text-sm w-full flex flex-col">
            <button 
              onClick={resetChat}
              className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors overflow-hidden"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path 
                  d="M12 4L12 20M4 12L20 12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                New Chat
              </span>
            </button>

            <div className="mt-4 w-full">
              <h2 className="font-bold mb-2 truncate bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)] ">
                Lịch sử trò chuyện
              </h2>
              {fullChatHistory.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">
                  Hiện chưa có cuộc hội thoại nào
                </p>
              ) : (
                fullChatHistory.map((chat, i) => (
                  <li 
                    key={chat.id}
                    onClick={() => handleChatHistoryClick(i)}
                    className="chat-history-item cursor-pointer hover:bg-gray-100 transition-colors relative group p-2 w-full rounded-lg"
                  >
                    <div className="flex items-center gap-2 pr-16 w-full overflow-hidden">
                      <FontAwesomeIcon icon={faMessage} className="flex-shrink-0 text-blue-500" />
                      <span className="truncate text-gray-700 hover:text-gray-900">
                        {chat.question.length < 20 
                          ? chat.question 
                          : chat.question.slice(0, 20) + "..."}
                      </span>
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))
              )}
            </div>
          </ul>
        </div>
      </div>
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] mt-2 right-3 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content 
        rounded-2xl mt-3  overflow-auto scroll-y-auto max-h-[80vh]
        scrollbar-thin scrollbar-thumb-gray-300 
          scrollbar-thumb-rounded-full scrollbar-track-rounded-full
        ">
          {/* Sidebar content here */}
          <ul className="menu text-sm">
            <h2 className="font-bold mb-2 bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)] ">
              Những câu hỏi phổ biến
            </h2>

            {commonQuestions.map((mess, i) => (
              <li key={i} onClick={() => {
                console.log("Common question selected:", mess);
                SetPromptInput(mess);
              }}>
                <p className="max-w-64">
                  <FontAwesomeIcon icon={faMessage} />
                  {mess}
                  {/* {mess.length < 20 ? mess : mess.slice(0, 20) + "..."} */}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={"flex justify-center h-[80vh]"}>
        {/* Put this part before </body> tag */}
        <input type="checkbox" id="my_modal_6" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{reference.title}</h3>{" "}
            <p className="font-normal text-sm">Nguồn: {reference.source}</p>
            <p className="py-4 text-sm">
              {reference.text.slice(0, 700) + "..."}
            </p>
            <p className="link link-primary truncate">
              <a href={reference.url} target="_blank">
                {reference.url}
              </a>
            </p>
            <div className="modal-action">
              <label htmlFor="my_modal_6" className="btn btn-error">
                ĐÓNG
              </label>
            </div>
          </div>
        </div>

        <div
          id="chat-area"
          className="
          mt-5 text-sm 
          scrollbar-thin scrollbar-thumb-gray-300 bg-white  
          scrollbar-thumb-rounded-full scrollbar-track-rounded-full
          rounded-3xl border-2 md:w-[60%] md:p-3 p-1  w-full overflow-auto scroll-y-auto h-[90%] "
        >
          {dataChat.map((dataMessages, i) => (
            <div 
              key={i} 
              ref={el => messageRefs.current[i] = el}
              className={`chat ${
                dataMessages[0] === "start" ? "chat-start" : "chat-end"
              } ${
                dataMessages[0] === "start" ? "drop-shadow-md" : ""
              }`}
            >
              {dataMessages[0] === "start" && (
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full border-2 border-blue-500">
                    <img className="scale-120" src={robot_img} alt="Robot avatar" />
                  </div>
                </div>
              )}
              <div className={`chat-bubble ${dataMessages[0] === "start" ? "chat-bubble-info" : "chat-bubble-primary bg-gradient-to-r from-purple-500 to-blue-500 text-white"}`}>
                <div className="type-animation-content inline-block max-w-full break-words">
                  {dataMessages[1][0] ? (
                    <TypeWriter 
                      content={dataMessages[1][0]} 
                      speed={80}
                      instant={dataMessages[0] === "end"}
                    />
                  ) : (
                    <LoadingSpinner showTimer={isLoading} timeOfRequest={timeOfRequest} />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          <div className="absolute bottom-[0.2rem] md:w-[50%] grid ">
            <input
              type="text"
              placeholder="Nhập câu hỏi tại đây..."
              className="mr-1 shadow-xl border-2 focus:outline-none px-2 rounded-2xl input-primary col-start-1 md:col-end-12 col-end-11 "
              onChange={onChangeHandler}
              onKeyDown={handleKeyDown}
              disabled={isGen}
              value={promptInput}
            />

            <button
              disabled={isGen}
              onClick={() => SendMessageChat()}
              className={
                " drop-shadow-md md:col-start-12 rounded-2xl col-start-11 col-end-12 md:col-end-13 btn btn-active btn-primary btn-square bg-gradient-to-tl from-transparent via-blue-600 to-indigo-500"
              }
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                color="white"
                height="15px"
                width="15px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
            <p className=" text-xs col-start-1 col-end-12 text-justify p-1">
              <b>Lưu ý: </b>Mô hình có thể đưa ra câu trả lời không chính xác ở
              một số trường hợp, vì vậy hãy luôn kiểm chứng thông tin bạn nhé!
            </p>
          </div>
        </div>
      </div>

      {/* Modal hiển thị hình ảnh phóng to */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-[90vw] max-h-[90vh] animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={selectedImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-xl"
            />
            <button 
              className="absolute -top-4 -right-4 text-white bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default ChatBot;