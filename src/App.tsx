
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { platforms } from './platforms';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { FaTelegramPlane, FaFacebookF, FaCommentDots } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { Link } from 'react-router-dom';
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';

type Message = {
  id: string;
  platform: keyof typeof platforms;
  sender: string;
  message: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  nickname?: string;
  media_url?: string;
  message_type?: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [platform, setPlatform] = useState<keyof typeof platforms>('telegram');
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    fetchMessages();
  fetchUnreadCounts();
  const t = setInterval(fetchUnreadCounts, 15000);
  return () => clearInterval(t);
  }, []);

  async function fetchMessages() {
    setLoading(true);
    // Replace with your Supabase table name and query
    const { data, error } = await supabase
      .from('pony_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching messages:', error);
    else setMessages(data || []);
    const res = await fetch(`${BACKEND}/telegram/unread-count`);
  }

  async function fetchUnreadCounts() {
    try {
  const res = await fetch(`${BACKEND}/telegram/unread-count`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCounts(data.counts || {});
    } catch (err) {
      console.error('Failed to fetch unread counts', err);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !recipient) return;
    // Replace with your backend endpoint
  const response = await fetch(`${BACKEND}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient,
        message: newMessage,
        platform,
      }),
    });
    const data = await response.json();
    if (!response.ok) console.error('Send failed:', data);
    setNewMessage('');
  }

  function getUserDisplay(msg: Message) {
    const pf = platforms[msg.platform];
    if (!pf) return msg.sender;
    // Telegram: first_name last_name (@username)
    if (msg.platform === 'telegram') {
      return `${msg.first_name || ''} ${msg.last_name || ''}${msg.username ? ` (@${msg.username})` : ''}`.trim();
    }
    // Facebook: name
    if (msg.platform === 'facebook') {
      return msg.name || msg.sender;
    }
    // Viber: name
    if (msg.platform === 'viber') {
      return msg.name || msg.sender;
    }
    // TikTok: nickname
    if (msg.platform === 'tiktok') {
      return msg.nickname || msg.sender;
    }
    return msg.sender;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Pony Chat Admin</h1>
      <p className="text-sm text-gray-500 mb-4">Select a platform to manage chats</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-md px-4">
        <Link to="/facebook" className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:scale-105 transition border border-gray-200">
          <FaFacebookF className="text-indigo-600 size-6" />
          <span className="font-semibold">Facebook</span>
        </Link>
        <Link to="/telegram" className="relative flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:scale-105 transition border border-gray-200">
          <FaTelegramPlane className="text-blue-500 size-6" />
          <span className="font-semibold">Telegram</span>
          {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-6 h-6">
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Link>
  {/* Viber removed — kept for future integration */}
        <Link to="/tiktok" className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:scale-105 transition border border-gray-200">
          <SiTiktok className="text-pink-600 size-6" />
          <span className="font-semibold">TikTok</span>
        </Link>
      </div>
    </div>
  );
}

