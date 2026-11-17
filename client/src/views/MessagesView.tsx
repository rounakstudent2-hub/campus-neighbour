import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { Conversation, Message } from '../types';
import { Send, MessageSquare, ArrowLeft, Shield, CheckCheck, Clock } from 'lucide-react';

interface MessagesViewProps {
  initialConversationId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialConversationId,
  onNavigate
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.getConversations();
      if (res.success) {
        setConversations(res.conversations);
        if (res.conversations.length > 0) {
          if (initialConversationId) {
            const found = res.conversations.find((c: Conversation) => c.id === initialConversationId);
            setSelectedConv(found || res.conversations[0]);
          } else if (!selectedConv) {
            setSelectedConv(res.conversations[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await api.getConversationMessages(convId);
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      if (socket) {
        socket.emit('join_conversation', selectedConv.id);
      }
    }

    return () => {
      if (socket && selectedConv) {
        socket.emit('leave_conversation', selectedConv.id);
      }
    };
  }, [selectedConv, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (selectedConv && msg.conversation_id === selectedConv.id) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConversations();
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConv || isSending) return;

    const text = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    try {
      const res = await api.sendMessage({
        conversationId: selectedConv.id,
        messageText: text
      });
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
      setNewMessageText(text); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-sm">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
        {/* Left sidebar: Conversations list */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Direct Messages</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure in-app coordination between neighbors & students
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations yet. Messages appear once a task is applied to or assigned!
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-4 transition cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-emerald-50 border-r-4 border-emerald-600'
                        : 'hover:bg-slate-100 bg-white'
                    }`}
                  >
                    <img
                      src={conv.otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.name}`}
                      alt={conv.otherUser.name}
                      className="w-10 h-10 rounded-full bg-slate-200 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.otherUser.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 truncate mb-1">
                        Task: {conv.taskTitle}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessageText}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right chat window */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Header with task context */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedConv.otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConv.otherUser.name}`}
                  alt={selectedConv.otherUser.name}
                  className="w-9 h-9 rounded-full bg-slate-200 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{selectedConv.otherUser.name}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                      {selectedConv.otherUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <span>Task: <strong>{selectedConv.taskTitle}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">₹{selectedConv.taskBudget}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate(`task-detail-${selectedConv.taskId}`)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
              >
                View Task Page
              </button>
            </div>

            {/* Messages stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              <div className="text-center my-2">
                <span className="text-[11px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium inline-flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>Secure messaging enabled. Keep communications respectful and safety-oriented.</span>
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_name || 'Sender'}`}
                        alt=""
                        className="w-7 h-7 rounded-full bg-slate-200 object-cover flex-shrink-0"
                      />
                    )}
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-sm shadow-sm'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <div>{msg.message_text}</div>
                      <div
                        className={`text-[9px] mt-1 text-right flex items-center justify-end space-x-1 ${
                          isMe ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim() || isSending}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation on the left to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};
