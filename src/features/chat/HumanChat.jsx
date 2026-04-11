import { useState, useEffect } from 'react';
import { Headset, PaperPlaneRight, UserCircle, SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const HumanChat = () => {
  const { user } = useAuthStore();
  const myRole = user?.role?.toLowerCase() || 'user';
  
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    fetchContacts();

    // Setup WebSocket for Real-Time Messaging
    if (!user?.id) return;
    
    let ws = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let retryTimeout = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted || retryCount >= MAX_RETRIES) return;

      // Automatically convert current HTTP BaseUrl to WSS
      const httpUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const wsUrl = httpUrl.replace(/^http/, 'ws') + `/api/chat-live/ws/${user.id}`;
      
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        retryCount = 0; // Reset retry count on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);
          if (incoming.event === "new_message") {
            const newMsg = incoming.data;
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        } catch(e) { console.error("WS Parse error", e); }
      };

      ws.onerror = () => {
        // Silently handle — onclose will fire next
      };

      ws.onclose = () => {
        if (!isMounted) return;
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, retryCount) * 1000;
          retryTimeout = setTimeout(connect, delay);
        } else {
          console.warn('WebSocket: Endpoint chat-live tidak tersedia. Fitur real-time dinonaktifkan.');
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (ws) {
        // Hanya tutup jika OPEN (1) atau CONNECTING (0)
        // Hindari menutup jika sudah CLOSING (2) atau CLOSED (3)
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      // Endpoint belum siap, error akan ditangkap catch
      const res = await api.get('/api/chat-live/contacts');
      setContacts(res.data?.data || res.data || []);
    } catch (err) {
      console.warn("Backend chat-live contacts belum siap. Menggunakan Dummy Data.");
      if (myRole === 'user') {
        setContacts([
          { id: 2, username: "admin_jabar", role: "admin", name: "Admin Jawa Barat" }
        ]);
      } else {
        setContacts([
          { id: 1, username: "OrbitaniCorp", role: "superadmin" },
          { id: 3, username: "petani_01", role: "user", name: "Pak Tani" },
          { id: 4, username: "demo_guest", role: "user" }
        ]);
      }
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchMessages = async (contactId, silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await api.get(`/api/chat-live/messages/${contactId}`);
      setMessages(res.data?.data || res.data || []);
    } catch (err) {
      if (!silent) console.warn("Backend messages belum siap. Menggunakan Dummy Data.");
      setMessages([
        { id: 101, sender_id: contactId, receiver_id: user.id, message_text: "Halo, ada yang bisa saya bantu terkait lahan Anda?", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 102, sender_id: user.id, receiver_id: contactId, message_text: "Iya admin, indikator nitrogen saya terus menurun walau sudah dipupuk.", timestamp: new Date(Date.now() - 3500000).toISOString() }
      ]);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;
    
    const payload = {
      receiver_id: selectedContact.id,
      message_text: inputText.trim()
    };
    
    // UI Optimistic Update
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: selectedContact.id,
      message_text: inputText.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      await api.post('/api/chat-live/messages', payload);
    } catch (err) {
      toast.error("Gagal mengirim pesan. Backend /api/chat-live/messages belum siap.");
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] p-4 lg:p-6 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Left Pane - Contact List */}
      <div className="w-full md:w-80 lg:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="p-5 border-b border-gray-100 bg-primary/5">
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Headset size={24} weight="duotone" />
            Pusat Bantuan
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {myRole === 'user' ? 'Hubungi admin untuk bantuan teknis.' : 'Saluran komunikasi ke User dan Superadmin.'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingContacts ? (
            <div className="flex justify-center p-8"><SpinnerGap size={24} className="animate-spin text-primary" /></div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-gray-400 p-8 text-sm">Tidak ada kontak tersedia.</p>
          ) : (
            <div className="space-y-1">
              {contacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedContact?.id === c.id ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <UserCircle size={40} weight="fill" className={selectedContact?.id === c.id ? 'text-white' : 'text-gray-400'} />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.name || c.username}</p>
                    <p className={`text-xs uppercase font-bold ${selectedContact?.id === c.id ? 'text-primary-light text-green-200' : 'text-accent'}`}>{c.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Chat Room */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        {!selectedContact ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <Headset size={64} weight="duotone" className="mb-4 opacity-50" />
            <p className="text-lg">Pilih kontak untuk mulai mengobrol</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white z-10 shadow-sm">
              <UserCircle size={40} weight="fill" className="text-primary" />
              <div>
                <h3 className="font-bold text-gray-800">{selectedContact.name || selectedContact.username}</h3>
                <p className="text-xs text-primary font-bold uppercase">{selectedContact.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {isLoadingMessages ? (
                 <div className="flex justify-center p-8"><SpinnerGap size={24} className="animate-spin text-primary" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 p-8 text-sm">Belum ada riwayat percakapan.</p>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3.5 rounded-2xl ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'}`}>
                        <p className="text-sm leading-relaxed">{m.message_text}</p>
                        <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ketik pesan Anda..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-primary text-white p-3.5 rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default HumanChat;
