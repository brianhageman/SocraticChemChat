
import React, { useEffect, useRef } from 'react';
import { Message as MessageType } from '../types';
import BotIcon from './icons/BotIcon';

interface MessageProps {
  message: MessageType;
  isStreaming: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const isUser = message.sender === 'user';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    // Always update the text content. For streaming messages, this shows the live text.
    // For finished messages, this resets the content before KaTeX runs.
    contentDiv.textContent = message.text;

    // If the message is not streaming, it's complete, and we can safely render math.
    // This runs for all past messages on any re-render, and for the last message
    // once `isStreaming` becomes false. KaTeX is idempotent, so this is safe.
    if (!isStreaming && typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(contentDiv, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
          // Trust the source content, needed for mhchem to work correctly
          // with commands like \ce.
          trust: true,
        });
      } catch (error)
        {
        console.error("KaTeX rendering failed:", error);
      }
    }
    // This effect should re-run whenever the message text updates (during streaming)
    // or when the streaming status changes (when the message is complete).
  }, [message.text, isStreaming]);

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
          <BotIcon className="w-6 h-6 text-cyan-400" />
        </div>
      )}
      <div
        className={`max-w-md lg:max-w-xl px-4 py-3 rounded-xl shadow-md break-words ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        <div ref={contentRef} className="whitespace-pre-wrap" />
      </div>
    </div>
  );
};

export default Message;
