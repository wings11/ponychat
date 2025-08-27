import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient.ts';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';

export default function ViberPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [activeUser, setActiveUser] = useState<string>('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'khamoo@pony.com';

  useEffect(() => { fetchMessages(); fetchUnreadCounts(); }, []);

  async function fetchUnreadCounts() {
    try {
      const res = await fetch(`${BACKEND}/viber/unread-count`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCounts(data.counts || {});
    } catch (err) { console.error(err); }
  }

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pony_messages')
      .select('*')
      .eq('platform', 'viber')
      .order('created_at', { ascending: true });
    if (error) console.error('Error fetching viber messages:', error);
    else setMessages(data || []);
    setLoading(false);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeUser) return;
    const res = await fetch(`${BACKEND}/viber/send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: activeUser, message: newMessage, message_type: 'text', adminEmail })
    });
    if (!res.ok) console.error('send failed');
    setNewMessage('');
    fetchMessages();
    fetchUnreadCounts();
  }

  const userIds = Array.from(new Set(messages.filter(m => m.sender !== adminEmail).map(m => m.platform_user_id || m.sender)));
  const userMeta: Record<string, any> = {};
  messages.forEach(m => { if (!userMeta[m.platform_user_id || m.sender]) userMeta[m.platform_user_id || m.sender] = m; });
  const lastMessage: Record<string, any> = {};
  messages.forEach(m => { const id = m.platform_user_id || m.sender; if (!lastMessage[id] || new Date(m.created_at) > new Date(lastMessage[id].created_at)) lastMessage[id] = m; });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!activeUser) return; setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); }, [messages, activeUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-purple-700">Viber Chat</h1>
      <div className="w-full max-w-md sm:max-w-xl px-2">
        {!activeUser && (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {userIds.length === 0 && <div className="p-4 text-gray-500">No users yet</div>}
            {userIds.map(uid => (
              <button key={uid} className="w-full flex items-center gap-3 py-3 px-3 text-left hover:bg-purple-50" onClick={() => setActiveUser(uid)}>
                <Avatar><AvatarImage src={userMeta[uid]?.media_url||''} /><AvatarFallback>{(userMeta[uid]?.name||uid)[0]}</AvatarFallback></Avatar>
                <div className="flex-1"><div className="font-semibold text-sm">{userMeta[uid]?.name || uid}</div><div className="text-xs text-gray-500 truncate">{lastMessage[uid]?.message||''}</div></div>
                {unreadCounts[uid] > 0 && <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-6 h-6">{unreadCounts[uid]}</span>}
              </button>
            ))}
          </div>
        )}

        {activeUser && (
          <>
            <div className="w-full bg-white shadow sticky top-4 z-20 rounded p-3 mb-3 flex items-center justify-between"><div className="flex items-center gap-3"><button className="text-sm text-gray-600 mr-2" onClick={() => setActiveUser('')}>Back</button><div className="font-semibold text-sm">{userMeta[activeUser]?.name || activeUser}</div></div><div className="text-xs text-gray-500">Viber</div></div>
            <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6">
              {loading ? <p className="text-gray-500">Loading messages...</p> : (
                messages.filter(m => (m.platform_user_id||m.sender) === activeUser).map(m => (
                  <Card key={m.id} className={`p-2 sm:p-3 ${m.sender===adminEmail ? 'ml-8 sm:ml-16 self-end bg-purple-100' : 'mr-8 sm:mr-16 bg-white border'}`}>
                    <div className="text-sm sm:text-base break-words">{m.message}</div>
                    {m.media_url && <div className="mt-2"><img src={m.media_url} className="max-w-xs max-h-48" alt="media"/></div>}
                    <small className="text-gray-400 text-xs sm:text-sm">{new Date(m.created_at).toLocaleString()}</small>
                  </Card>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 items-center pb-2">
              <Textarea placeholder="Type a message..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} className="flex-1" rows={2} />
              <Button onClick={sendMessage} className="bg-purple-600 text-white">Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// ...existing code above... (placeholder removed to avoid duplicate export)
