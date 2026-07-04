import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const { 
    chats, 
    setCurrentChatId, 
    createNewChat, 
    askAI, 
    settings,
    updateApiKeys
  } = useApp();

  // Sync active route chatId with global context
  useEffect(() => {
    setCurrentChatId(chatId || null);
  }, [chatId, setCurrentChatId]);

  const activeChat = chats.find(c => c.id === chatId);
  const messages = activeChat ? activeChat.messages : [];

  const handleSendMessage = (text, file = null, webSearch = false) => {
    const trimmed = text.trim();
    
    // Smart auto-detect keys pasted in the chat
    if (trimmed.startsWith('hf_') && trimmed.length > 20) {
      updateApiKeys({
        ...settings.apiKeys,
        huggingface: trimmed
      });
      alert('🔑 Smart Detect: I have automatically saved this Hugging Face Token to your API Credentials Settings!');
      return;
    }
    if (trimmed.startsWith('sk-proj-') && trimmed.length > 30) {
      updateApiKeys({
        ...settings.apiKeys,
        openai: trimmed
      });
      alert('🔑 Smart Detect: I have automatically saved this OpenAI API Key to your API Credentials Settings!');
      return;
    }

    let targetChatId = chatId;

    // Create session if starting on empty workspace
    if (!targetChatId) {
      targetChatId = createNewChat(null);
      navigate(`/chat/${targetChatId}`, { replace: true });
    }

    // Query active model completions directly
    askAI(targetChatId, text, settings.defaultProvider, settings.defaultModel, file, webSearch);
  };

  const handleSuggestionClick = (promptText) => {
    handleSendMessage(promptText);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100% - 56px)', overflow: 'hidden' }}>
      {/* Scrollable message timeline */}
      <ChatWindow 
        messages={messages} 
        onSelectSuggestion={handleSuggestionClick} 
      />

      {/* Floating pill chat input */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        defaultProvider={settings.defaultProvider}
        defaultModel={settings.defaultModel}
      />
    </div>
  );
}

export default ChatPage;
