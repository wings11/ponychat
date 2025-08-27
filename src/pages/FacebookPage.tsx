import React, { useEffect, useState, useRef } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
// Card removed - not used by new compact message UI
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';

interface Message {
  id?: string;
  sender?: string;
  platform_user_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  media_url?: string;
  message?: string;
  created_at?: string;
}

export default function FacebookPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedMsgs, setExpandedMsgs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [activeUser, setActiveUser] = useState<string>('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'khamoo@pony.com';

  function parseDateSafe(d?: string) {
    try {
      return d ? new Date(d) : new Date(0);
    } catch { return new Date(0); }
  }

  const fetchUnreadCounts = React.useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/facebook/unread-count`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCounts(data.counts || {});
    } catch (err) { console.error(err); }
  }, [BACKEND]);

  const fetchMessages = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pony_messages')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: true });
  if (error) console.error('Error fetching facebook messages:', error);
  else setMessages((data as Message[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); fetchUnreadCounts(); }, [fetchMessages, fetchUnreadCounts]);

  async function sendMessage() {
    if (!newMessage.trim() || !activeUser) return;
    const res = await fetch(`${BACKEND}/facebook/send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: activeUser, message: newMessage, message_type: 'text', adminEmail })
    });
    if (!res.ok) console.error('send failed');
    setNewMessage('');
    fetchMessages();
    fetchUnreadCounts();
  }

  const userIds = Array.from(new Set(messages.filter(m => m.sender !== adminEmail).map(m => (m.platform_user_id || m.sender) as string))).filter(Boolean) as string[];
  const userMeta: Record<string, Message> = {};
  // prefer entries that contain name/profile_pic when building user metadata
  messages.forEach(m => {
    const id = (m.platform_user_id || m.sender) as string | undefined;
    if (!id) return;
    const existing = userMeta[id];
    // prefer rows that have explicit name or profile_pic
    if (!existing) userMeta[id] = m;
    else {
      const curHas = !!(m.name || m.profile_pic);
      const exHas = !!(existing.name || existing.profile_pic);
      if (curHas && !exHas) userMeta[id] = m;
      // if both have, prefer the newest (safe date compare)
      if (curHas && exHas && parseDateSafe(m.created_at) > parseDateSafe(existing.created_at)) userMeta[id] = m;
    }
  });
  const lastMessage: Record<string, Message> = {};
  messages.forEach(m => {
    const id = (m.platform_user_id || m.sender) as string | undefined;
    if (!id) return;
    if (!lastMessage[id] || parseDateSafe(m.created_at) > parseDateSafe(lastMessage[id].created_at)) lastMessage[id] = m;
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!activeUser) return; setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); }, [messages, activeUser]);

  function toggleMsgExpand(id: string) {
    setExpandedMsgs(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-blue-800">Facebook Messenger</h1>
      <div className="w-full max-w-md sm:max-w-xl px-2">
        {!activeUser && (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {userIds.length === 0 && <div className="p-4 text-gray-500">No users yet</div>}
            {userIds.map(uid => (
                <button key={uid} className="w-full flex items-center gap-3 py-3 px-3 text-left hover:bg-blue-50" onClick={() => setActiveUser(uid)}>
                <Avatar>
                  <AvatarImage src={userMeta[uid]?.profile_pic || userMeta[uid]?.media_url || ''} />
                  <AvatarFallback>{(userMeta[uid]?.name||uid)[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1"><div className="font-semibold text-sm">{userMeta[uid]?.name || uid}</div><div className="text-xs text-gray-500 truncate">{lastMessage[uid]?.message||''}</div></div>
                {unreadCounts[uid] > 0 && <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-6 h-6">{unreadCounts[uid]}</span>}
              </button>
            ))}
          </div>
        )}

        {activeUser && (
          <>
            <div className="w-full bg-white shadow sticky top-4 z-20 rounded p-3 mb-3 flex items-center justify-between"><div className="flex items-center gap-3"><button className="text-sm text-gray-600 mr-2" onClick={() => setActiveUser('')}>Back</button><div className="font-semibold text-sm">{userMeta[activeUser]?.name || activeUser}</div></div><div className="text-xs text-gray-500">Facebook</div></div>
            <div className="mb-4 sm:mb-6">
              {loading ? <p className="text-gray-500">Loading messages...</p> : (
                <div className="flex flex-col gap-2">
                  {messages.filter(m => (m.platform_user_id||m.sender) === activeUser).map(m => {
                    const isAdmin = m.sender === adminEmail;
                    const id = m.id || `${m.created_at}-${Math.random()}`;
                    const isExpanded = !!expandedMsgs[id];
                    return (
                      <div key={id} className={`flex items-end ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        {!isAdmin && (
                          <div className="mr-2 flex-shrink-0">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={userMeta[activeUser]?.profile_pic || userMeta[activeUser]?.media_url || ''} />
                              <AvatarFallback>{(userMeta[activeUser]?.name||activeUser)[0]}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleMsgExpand(id)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleMsgExpand(id); }}
                          className={`max-w-[72%] break-words transform transition-all duration-150 ease-out select-auto ${isAdmin ? 'ml-6' : ''}`}
                        >
                          <div className={`rounded-xl shadow-sm px-3 py-2 ${isAdmin ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-900 rounded-bl-none'}`}>
                            <div className="text-sm sm:text-sm leading-snug">{m.message}</div>
                            {m.media_url && <div className="mt-2"><img src={m.media_url} className="w-full max-w-xs rounded-md" alt="media"/></div>}
                          </div>

                          {/* timestamp - only visible when message is expanded */}
                          {isExpanded && (
                            <div className={`mt-1 text-[11px] text-gray-400 ${isAdmin ? 'text-right' : 'text-left'}`}>
                              {new Date(m.created_at).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">A</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 items-center pb-2">
              <Textarea placeholder="Type a message..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} className="flex-1" rows={2} />
              <Button onClick={sendMessage} className="bg-blue-600 text-white">Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
