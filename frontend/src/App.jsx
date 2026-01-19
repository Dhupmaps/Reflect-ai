import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles, Moon, Sun, PanelRightOpen, FileText, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import ResultCard from './components/ResultCard';
import StatusBadge from './components/StatusBadge';
import './App.css';

const AppContent = () => {
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [chats, setChats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Initial Load
  useEffect(() => {
    fetchChats().then(fetchedChats => {
      if (fetchedChats && fetchedChats.length > 0) {
        // Optional: load most recent
      } else {
        createNewChat();
      }
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentStep]);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/api/chats');
      setChats(res.data);
      return res.data;
    } catch (err) {
      console.error("Error fetching chats", err);
      return [];
    }
  };

  const createNewChat = async () => {
    try {
      const res = await axios.post('/api/chats', { title: 'New Chat' });
      setChatId(res.data.id);
      setMessages([]);
      setCurrentStep(null);
      fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  const loadChat = async (id) => {
    try {
      setChatId(id);
      const res = await axios.get(`/api/chats/${id}`);

      if (!res.data || !Array.isArray(res.data)) {
        setMessages([]);
        return;
      }

      // Parse rich content if present
      const formattedMessages = res.data.map(msg => {
        if (msg.sender === 'ai') {
          try {
            // Check if content is already an object (axios might auto-parse) or string
            let parsed = typeof msg.content === 'object' ? msg.content : JSON.parse(msg.content);

            // Handle Double-encoded JSON (common in legacy)
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch { /* keep as string */ }
            }

            // Check if it's our rich structure
            if (parsed && (parsed.draft || parsed.final_1 || parsed.critique)) {
              return {
                ...msg,
                draft: parsed.draft,
                critique: parsed.critique,
                final_1: parsed.final_1,
                final_2: parsed.final_2,
                isLoading: false
              };
            }
            // Handle legacy JSON (option_1 only)
            if (parsed && parsed.option_1) {
              return { ...msg, final_1: parsed.option_1, final_2: parsed.option_2 };
            }
          } catch (e) {
            // Plain text or error, keep as is
          }
        }
        return msg;
      });

      setMessages(formattedMessages);
      setCurrentStep(null);
    } catch (err) {
      console.error("Error loading chat:", err);
      // Fallback to empty context to prevent white screen
      setMessages([]);
    }
  };

  const deleteChat = async (id) => {
    try {
      await axios.delete(`/api/chats/${id}`);
      await fetchChats();
      if (chatId === id) {
        createNewChat();
      }
    } catch (err) {
      console.error("Error deleting chat", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    processStream(chatId, userMsg);
  };

  const handleRegenerate = async (msgId) => {
    if (isLoading) return;
    // Ideally we should find the last user message context, but for simplified regeneration
    // we will just re-trigger the process with the last user message in the history.
    // This is a "retry" behavior.
    const lastUserMsg = messages.filter(m => m.sender === 'user').pop();
    if (!lastUserMsg) return;

    processStream(chatId, lastUserMsg.content);
  };

  const processStream = async (activeId, questionContent) => {
    setIsLoading(true);

    // Optimistic update for new messages
    if (questionContent !== messages[messages.length - 1]?.content) {
      const tempUserMsg = { sender: 'user', content: questionContent, id: Date.now() };
      setMessages(prev => [...prev, tempUserMsg]);
    }

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: activeId, question: questionContent })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Container for responses
      let aiResponseContainer = {
        sender: 'ai',
        isLoading: true,
        draft: '',
        critique: '',
        final_1: '',
        final_2: '',
        status: 'Drafting',
        id: Date.now() + 1
      };

      setMessages(prev => [...prev, aiResponseContainer]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'title_update') {
              fetchChats();
            } else if (data.type === 'status') {
              setCurrentStep(data.status);
              aiResponseContainer.status = data.status;
            } else if (data.type === 'draft') {
              aiResponseContainer.draft = data.content;
            } else if (data.type === 'critique') {
              aiResponseContainer.critique = data.content;
            } else if (data.type === 'final') {
              aiResponseContainer.final_1 = data.content;
              aiResponseContainer.final_2 = data.content_2;
            } else if (data.type === 'course_completed') {
              aiResponseContainer.isLoading = false;
              setCurrentStep('Completed');
            }

            // Update state
            setMessages(prev => {
              const newMsgs = [...prev];
              // Find the last message which is our AI container and update it
              const lastIdx = newMsgs.length - 1;
              if (newMsgs[lastIdx].sender === 'ai') {
                newMsgs[lastIdx] = { ...aiResponseContainer };
              }
              return newMsgs;
            });
          } catch (e) {
            console.error('Error parsing stream:', e);
          }
        }
      }
    } catch (error) {
      console.error("Streaming error", error);
    } finally {
      setIsLoading(false);
      // Refresh chat to ensure persistence consistency
      loadChat(activeId);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="app-container">
      <div className="main-content">
        {/* New Header */}
        <header className="main-header">
          <div className="header-brand">
            <Bot size={24} className="brand-icon" />
            <h1>Reflect AI</h1>
          </div>
          {!sidebarOpen && (
            <button className="open-sidebar-btn" onClick={toggleSidebar} title="Open History">
              <PanelRightOpen size={20} />
            </button>
          )}
        </header>

        <div className="chat-scroll-area">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <h1>Reflect AI</h1>
              <p>Ask a complex question and watch the agent think, critique, and refine its answer.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`message-group ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                  <div className="message-header">
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    <span>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                  </div>

                  {msg.sender === 'user' ? (
                    <div className="message-bubble">{msg.content}</div>
                  ) : (
                    <div className="ai-response-container">
                      {/* Status Badge */}
                      {(msg.isLoading || (index === messages.length - 1 && currentStep)) && (
                        <div className="status-indicator">
                          <StatusBadge step={msg.isLoading ? (currentStep || 'drafting') : 'completed'} />
                        </div>
                      )}

                      {/* Steps: Draft, Critique, Final */}
                      {msg.draft && (
                        <ResultCard title="Draft" content={msg.draft} status="drafting" icon={FileText} />
                      )}

                      {msg.critique && (
                        <ResultCard title="Critique" content={msg.critique} status="critiquing" icon={MessageSquare} />
                      )}

                      {/* Final Dual Answer */}
                      {(msg.final_1 || msg.final_2) && (
                        <ResultCard
                          title="Refined Answer"
                          content={msg.final_1}
                          content2={msg.final_2}
                          isRefinement={true}
                          status="refining"
                          icon={Sparkles}
                          onRegenerate={() => handleRegenerate(messages[index - 1]?.content)} // Pass previous user msg
                        />
                      )}

                      {/* Fallback */}
                      {!msg.draft && !msg.critique && !msg.final_1 && !msg.final_2 && msg.content && (
                        <div className="message-bubble">
                          <ReactMarkdown>
                            {(() => {
                              try {
                                const parsed = JSON.parse(msg.content);
                                if (parsed.option_1) return parsed.option_1;
                                return msg.content;
                              } catch {
                                return msg.content;
                              }
                            })()}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              disabled={isLoading}
            />
            <button className="send-btn" onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? <Sparkles size={20} className="spin-animation" /> : <Send size={20} />}
            </button>
          </div>

          <div className="theme-toggle-slider">
            <span className={theme === 'light' ? 'active' : ''}>LIGHT</span>
            <div className="toggle-track" onClick={toggleTheme}>
              <div className={`toggle-thumb ${theme === 'dark' ? 'dark' : 'light'}`}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </div>
            </div>
            <span className={theme === 'dark' ? 'active' : ''}>DARK</span>
          </div>
        </div>
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        createNewChat={createNewChat}
        chats={chats}
        activeChatId={chatId}
        loadChat={loadChat}
        deleteChat={deleteChat}
      />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;