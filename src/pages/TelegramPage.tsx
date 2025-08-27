
import { useEffect, useState, useRef } from 'react';
import { FaTelegramPlane, FaUserShield } from 'react-icons/fa';
import { supabase } from '../supabaseClient.ts';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';

export default function TelegramPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [activeUser, setActiveUser] = useState<string>('');
  // show user list when the page loads (no active user selected)
  const [showUserModal, setShowUserModal] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Debug: log imported components to detect undefined imports causing invalid element type
  // eslint-disable-next-line no-console
  console.debug('UI imports:', { Card, Avatar, AvatarImage, AvatarFallback, Textarea, Button, FaTelegramPlane, FaUserShield, supabase });

  // Set your admin email here or get from config
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'khamoo@pony.com';
  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchMessages();
  }, []);

  // fetch unread counts for telegram per sender
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

  useEffect(() => {
    fetchUnreadCounts();
    const t = setInterval(fetchUnreadCounts, 15000);
    return () => clearInterval(t);
  }, []);

  // When admin selects a user, mark messages from that sender as read on the backend
  useEffect(() => {
    if (!activeUser) return;
    async function markRead() {
      try {
  await fetch(`${BACKEND}/telegram/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: activeUser }),
        });
        // refresh messages to reflect any changes
        fetchMessages();
  // refresh unread counts too
  fetchUnreadCounts();
      } catch (err) {
        console.error('Failed to mark messages read', err);
      }
    }
    markRead();
  }, [activeUser, BACKEND]);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pony_messages')
      .select('*')
      .eq('platform', 'telegram')
      // fetch oldest -> newest so newest appears at the bottom of the list
      .order('created_at', { ascending: true });
    if (error) console.error('Error fetching messages:', error);
    else setMessages(data || []);
    setLoading(false);
  }

  // scroll to bottom when messages change and an activeUser is selected
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [visibleTimestamps, setVisibleTimestamps] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!activeUser) return;
    // wait for DOM to render
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages, activeUser]);

  function toggleTimestamp(id: any) {
    const key = String(id);
    setVisibleTimestamps(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeUser) return;
  const response = await fetch(`${BACKEND}/telegram/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: activeUser,
        message: newMessage,
        platform: 'telegram',
        message_type: 'text',
      }),
    });
    const data = await response.json();
    if (!response.ok) console.error('Send failed:', data);
    setNewMessage('');
    fetchMessages();
  }

  function getUserDisplay(msg: any) {
    // Prefer first_name + last_name, then username, then sender
    if (msg.first_name && msg.last_name) return `${msg.first_name} ${msg.last_name}`;
    if (msg.username) return msg.username;
    return msg.sender;
  }

  // Get unique user IDs from messages (excluding admin)
  const userIds = Array.from(new Set(messages.filter(msg => msg.sender !== adminEmail).map(msg => msg.sender)));

  // Get metadata for each user
  const userMeta: Record<string, any> = {};
  messages.forEach(msg => {
    if (!userMeta[msg.sender]) userMeta[msg.sender] = msg;
  });

  // Get last message for each user
  const lastMessage: Record<string, any> = {};
  messages.forEach(msg => {
    if (msg.sender !== adminEmail && (!lastMessage[msg.sender] || new Date(msg.created_at) > new Date(lastMessage[msg.sender].created_at))) {
      lastMessage[msg.sender] = msg;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-blue-700">Telegram Chat</h1>
      <div className="w-full max-w-md sm:max-w-xl px-2 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-700">Users</h2>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            onClick={() => setShowUserModal(true)}
          >
            Open list
          </button>
        </div>
        {/* Inline user list when no active user selected */}
        {!activeUser && (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {userIds.length === 0 && (
              <div className="p-4 text-gray-500">No users yet</div>
            )}
            {userIds.map(uid => (
              <button
                key={uid}
                className={`w-full flex items-center gap-3 py-3 px-3 text-left hover:bg-blue-50 rounded transition ${activeUser === uid ? 'bg-blue-100' : ''}`}
                onClick={() => { setActiveUser(uid); setShowUserModal(false); }}
              >
                <Avatar>
                  <AvatarImage src={userMeta[uid]?.media_url || ''} alt={getUserDisplay(userMeta[uid] || { sender: uid })} />
                  <AvatarFallback>{(getUserDisplay(userMeta[uid] || { sender: uid }) || uid)[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{getUserDisplay(userMeta[uid] || { sender: uid })}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{lastMessage[uid]?.message || ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCounts[uid] > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-6 h-6 mr-2">{unreadCounts[uid]}</span>
                  )}
                  <FaTelegramPlane className="text-blue-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowUserModal(false)} />
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-2 p-4 z-10">
            <h2 className="text-lg font-bold mb-2 text-blue-700">Select User</h2>
            <div className="divide-y divide-gray-200">
        {userIds.map(uid => (
                <button
                  key={uid}
                  className={`w-full flex items-center gap-3 py-3 px-2 text-left hover:bg-blue-50 rounded transition ${activeUser === uid ? 'bg-blue-100' : ''}`}
          onClick={() => { setActiveUser(uid); setShowUserModal(false); }}
                >
                  <Avatar>
                    <AvatarImage src={userMeta[uid].media_url || ''} alt={getUserDisplay(userMeta[uid])} />
                    <AvatarFallback>{getUserDisplay(userMeta[uid])[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{getUserDisplay(userMeta[uid])}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[140px]">{lastMessage[uid]?.message || ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCounts[uid] > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-6 h-6 mr-2">{unreadCounts[uid]}</span>
                    )}
                    <span className="ml-2">
                      <FaTelegramPlane className="text-blue-500" title="Telegram" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-md sm:max-w-xl px-2">
        {/* Sticky header for selected user */}
        {activeUser && (
          <div className="w-full bg-white shadow sticky top-4 z-20 rounded p-3 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-600 mr-2" onClick={() => setActiveUser('')}>Back</button>
              <div className="font-semibold text-sm">{getUserDisplay(userMeta[activeUser] || { sender: activeUser })}</div>
            </div>
            <div className="text-xs text-gray-500">Telegram</div>
          </div>
        )}
        <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
          {!activeUser ? (
            <p className="text-gray-500">Select a user to view messages.</p>
          ) : loading ? (
            <p className="text-gray-500">Loading messages...</p>
          ) : (
            messages
              .filter(msg => (msg.sender === activeUser || (msg.sender === adminEmail && msg.recipient === activeUser)))
              .map((msg) => {
                const isAdmin = msg.sender === adminEmail;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <Card className={`p-2 sm:p-3 max-w-[80vw] sm:max-w-lg ${isAdmin ? 'bg-blue-100 text-blue-900 rounded-br-2xl rounded-tr-2xl ml-8 sm:ml-16' : 'bg-white text-gray-900 rounded-bl-2xl rounded-tl-2xl mr-8 sm:mr-16 border'} shadow`}>
                          <div className="mb-1 sm:mb-2 text-sm sm:text-base break-words max-w-full" onClick={() => toggleTimestamp(msg.id)}>
                            {msg.message}
                          </div>
                      {msg.media_url && (
                        <div className="mb-1 sm:mb-2">
                          {msg.message_type === 'image' ? (
                            <img src={msg.media_url} alt="media" className="max-w-[60vw] sm:max-w-xs max-h-32 sm:max-h-48 rounded" />
                          ) : (
                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs sm:text-sm">Download File</a>
                          )}
                        </div>
                      )}
                      {visibleTimestamps[String(msg.id)] && (
                        <small className="text-gray-400 text-xs sm:text-sm">{new Date(msg.created_at).toLocaleString()}</small>
                      )}
                    </Card>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>
        {activeUser && (
          <div className="flex gap-2 items-center pb-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="flex-1 text-sm sm:text-base px-2 py-1 sm:px-3 sm:py-2"
              rows={2}
              style={{ minHeight: '36px', maxHeight: '80px' }}
            />
            <Button onClick={sendMessage} className="bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-blue-700 transition text-sm sm:text-base">
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
