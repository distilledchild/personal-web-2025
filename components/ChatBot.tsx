import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Users } from 'lucide-react';
import { ChatMessage } from '../types';
import { io, Socket } from 'socket.io-client';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Socket State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Initialize Socket connection
  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io('http://localhost:3001');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        // Join queue immediately upon connection
        newSocket.emit('join_queue');
      });

      newSocket.on('queue_status', (data: { position: number }) => {
        setQueuePosition(data.position);
        setIsChatActive(false);
      });

      newSocket.on('chat_started', (data: { position: number }) => {
        setIsChatActive(true);
        setQueuePosition(null);
        setMessages([{ role: 'model', text: 'You are now connected with the researcher. How can I help you?' }]);
      });

      newSocket.on('receive_message', (data: { text: string, sender: string }) => {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
        setIsLoading(false);
      });

      newSocket.on('chat_ended', (data: { reason: string }) => {
        setIsChatActive(false);
        setQueuePosition(null);
        setMessages(prev => [...prev, { role: 'model', text: 'Chat ended. Refresh to join the queue again.' }]);
        newSocket.disconnect();
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || !socket || !isChatActive) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);

    socket.emit('send_message', { text: input });

    setInput('');
    // setIsLoading(true); // Optional: show loading state while waiting for reply? 
    // Real-time chat usually doesn't show "loading" for every message sent, but maybe "typing..."
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-96 transition-all duration-300">
          <div className="bg-pastel-purple px-4 py-3 flex justify-between items-center border-b border-purple-100">
            <h3 className="font-semibold text-pastel-darkPurple flex items-center gap-2">
              Research Assistant
              {queuePosition !== null && (
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full text-purple-700">
                  Queue: {queuePosition}
                </span>
              )}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-purple-800 hover:text-purple-600">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {/* Queue Status Display */}
            {!isChatActive && queuePosition !== null && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                <Users size={32} className="text-purple-300" />
                <p className="text-center text-sm">
                  {queuePosition === 1
                    ? "1 person ahead of you."
                    : `${queuePosition} people ahead of you.`}
                </p>
                <p className="text-xs text-slate-400">Waiting for agent...</p>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                    ? 'bg-pastel-blue text-blue-900 rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isChatActive ? "Type a message..." : "Waiting for connection..."}
              disabled={!isChatActive}
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!isChatActive || !input.trim()}
              className="bg-pastel-purple text-pastel-darkPurple p-2 rounded-xl hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white text-slate-800 p-4 rounded-full shadow-lg hover:shadow-xl border border-slate-100 transition-all duration-300 hover:scale-105 group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="text-pastel-darkPurple" />}
      </button>
    </div>
  );
};