"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Check, CheckCheck, MessageSquare } from 'lucide-react';

type Message = {
  id: string;
  sender: 'me' | 'other';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
};

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'other', text: 'Hello! Are you available for a home visit tomorrow?', timestamp: '10:00 AM', status: 'read' },
  { id: '2', sender: 'me', text: 'Hi! Yes, I have a slot at 2:00 PM. Would that work for you?', timestamp: '10:05 AM', status: 'read' },
  { id: '3', sender: 'other', text: 'That works perfectly. What are your rates?', timestamp: '10:12 AM', status: 'read' },
];

export default function ChatInbox() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000);
    const incomingTimer = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'other',
          text: 'Great, see you then!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        },
      ]);
    }, 5000);
    return () => { clearTimeout(timer); clearTimeout(incomingTimer); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessages([...messages, newMessage]);
    setInputValue('');
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'delivered' } : m)));
    }, 1000);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'read' } : m)));
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 64px - 64px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Chat Inbox</h1>
            <p className="text-sm text-slate-400">Communicate with your customers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-sm text-slate-400">{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-3 bg-slate-900/60 shrink-0">
          <div className="w-10 h-10 bg-emerald-900/50 border border-emerald-700 rounded-full flex items-center justify-center text-emerald-400">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">John Doe</h2>
            <p className="text-xs text-slate-500">Customer • Active now</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'me'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
                <div className={`text-[10px] mt-1 flex items-center gap-1 ${msg.sender === 'me' ? 'text-emerald-200 justify-end' : 'text-slate-400'}`}>
                  {msg.timestamp}
                  {msg.sender === 'me' && (
                    <span className="ml-1">
                      {msg.status === 'sent' && <Check size={12} />}
                      {msg.status === 'delivered' && <CheckCheck size={12} className="text-emerald-300" />}
                      {msg.status === 'read' && <CheckCheck size={12} className="text-white" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/40 shrink-0">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !inputValue.trim()}
              className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
