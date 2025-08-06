import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type Message } from './types';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { createChat } from './services/geminiService';
import type { Chat } from '@google/genai';
import BotIcon from './components/icons/BotIcon';

const App: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const initStarted = useRef(false);

  const initializeChat = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const chatSession = createChat();
      setChat(chatSession);

      const responseStream = await chatSession.sendMessageStream({ message: "Introduce yourself." });
      
      let aiResponse = '';
      const aiMessageId = Date.now().toString();

      setMessages([{ id: aiMessageId, text: '', sender: 'ai' }]);
      
      for await (const chunk of responseStream) {
        aiResponse += chunk.text;
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {...m, text: aiResponse} : m));
      }
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes('RESOURCE_EXHAUSTED')) {
        setError('API rate limit exceeded. Please wait a moment and refresh the page.');
      } else {
        setError('Failed to initialize chat. Please check your API key and network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // This check prevents the effect from running twice in React.StrictMode,
    // which was causing the rate-limiting error.
    if (!initStarted.current) {
      initStarted.current = true;
      initializeChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!chat) return;

    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const responseStream = await chat.sendMessageStream({ message: text });
      
      let aiResponse = '';
      const aiMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);
      
      for await (const chunk of responseStream) {
        aiResponse += chunk.text;
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {...m, text: aiResponse} : m));
      }

    } catch (e: any) {
      console.error(e);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (e?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment before sending another message.';
      }
      setError(errorMessage);
      // No longer adding a redundant error message to the chat history.
      // The error banner below the input is sufficient.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="flex items-center p-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg z-10">
        <BotIcon className="w-8 h-8 text-cyan-400 mr-3"/>
        <h1 className="text-xl font-bold text-gray-100">Chem Socrates</h1>
      </header>
      
      <main className="flex-grow flex flex-col min-h-0">
        <ChatWindow messages={messages} isLoading={isLoading && messages.length > 0} />
        {error && !isLoading && (
          <div className="px-4 pb-2 text-center text-red-400">
            <p>{error}</p>
          </div>
        )}
        <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;
