import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { aiAPI, authAPI, conversationsAPI, customersAPI, tagsAPI, templatesAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import ConversationList from '../components/chat/ConversationList';
import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import CustomerInfoPanel from '../components/chat/CustomerInfoPanel';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const scrollRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [noteMode, setNoteMode] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [agents, setAgents] = useState([]);
  const [tags, setTags] = useState([]);
  const [typing, setTyping] = useState(false);
  const [intent, setIntent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesMeta, setMessagesMeta] = useState({ pages: 1 });
  const [templateModal, setTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ templateId: '', to: '' });
  const [templates, setTemplates] = useState([]);

  const latestCustomerMessage = useMemo(() => [...messages].reverse().find((item) => item.fromCustomer && !item.isNote), [messages]);

  const loadConversations = async () => {
    const response = await conversationsAPI.getAll({ status: filter, search, limit: 50 });
    const items = response.data.conversations || [];
    setConversations(items);
    if (id) {
      const found = items.find((item) => item._id === id);
      if (found) setActiveConversation(found);
    } else if (!activeConversation && items[0]) {
      setActiveConversation(items[0]);
      navigate(`/chat/${items[0]._id}`, { replace: true });
    }
  };

  const loadAuxiliary = async () => {
    try {
      const [tagsResponse, templatesResponse, usersResponse] = await Promise.allSettled([
        tagsAPI.getAll(),
        templatesAPI.getAll(),
        authAPI.getUsers()
      ]);
      if (tagsResponse.status === 'fulfilled') {
        setTags(tagsResponse.value.data.tags || []);
      }
      if (templatesResponse.status === 'fulfilled') {
        setTemplates(templatesResponse.value.data.templates || []);
      }
      if (usersResponse.status === 'fulfilled') {
        setAgents(usersResponse.value.data.users || []);
      }
    } catch {
      setAgents([]);
    }
  };

  const loadConversationDetails = async (conversationId, page = 1, append = false) => {
    const [conversationResponse, messagesResponse] = await Promise.all([
      conversationsAPI.getOne(conversationId),
      conversationsAPI.getMessages(conversationId, { page, includeNotes: true })
    ]);
    setActiveConversation(conversationResponse.data.conversation);
    setMessages((prev) => (append ? [...messagesResponse.data.messages, ...prev] : messagesResponse.data.messages));
    setMessagesPage(page);
    setMessagesMeta(messagesResponse.data.pagination);
  };

  useEffect(() => {
    loadConversations().catch(() => null);
  }, [filter, search]);

  useEffect(() => {
    loadAuxiliary().catch(() => null);
  }, []);

  useEffect(() => {
    if (!id) return;
    loadConversationDetails(id).catch(() => toast.error('Failed to load conversation'));
  }, [id]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || messagesPage !== 1) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, messagesPage]);

  useEffect(() => {
    if (!latestCustomerMessage) return;
    aiAPI.detectIntent({ message: latestCustomerMessage.content })
      .then((response) => setIntent(response.data.intent))
      .catch(() => setIntent('OTHER'));
    setSuggestionsLoading(true);
    aiAPI.suggestReply({ message: latestCustomerMessage.content, conversationId: activeConversation?._id })
      .then((response) => setSuggestions(response.data.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
  }, [latestCustomerMessage?.content, activeConversation?._id]);

  useEffect(() => {
    const socket = socketRef?.current;
    const conversationId = activeConversation?._id;
    if (!socket || !conversationId) return undefined;

    socket.emit('conversation:join', conversationId);

    const handleNewMessage = (message) => {
      if (String(message.conversation) === String(conversationId)) {
        setMessages((prev) => [...prev, message]);
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        });
      }
      loadConversations().catch(() => null);
    };

    const handleNewConversation = (conversation) => setConversations((prev) => [conversation, ...prev.filter((item) => item._id !== conversation._id)]);
    const handleUpdatedConversation = ({ conversationId: updatedId }) => {
      if (updatedId === conversationId) {
        loadConversationDetails(updatedId).catch(() => null);
      }
      loadConversations().catch(() => null);
    };
    const handleTyping = ({ conversationId: typingId, typing: isTyping }) => {
      if (typingId === conversationId) setTyping(isTyping);
    };
    const handleStatus = ({ messageId, status }) => setMessages((prev) => prev.map((item) => item._id === messageId ? { ...item, status } : item));
    const handleNotification = (notification) => toast(notification.message || 'New notification');

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:new', handleNewConversation);
    socket.on('conversation:updated', handleUpdatedConversation);
    socket.on('agent:typing', handleTyping);
    socket.on('message:status', handleStatus);
    socket.on('notification', handleNotification);

    return () => {
      socket.emit('conversation:leave', conversationId);
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:new', handleNewConversation);
      socket.off('conversation:updated', handleUpdatedConversation);
      socket.off('agent:typing', handleTyping);
      socket.off('message:status', handleStatus);
      socket.off('notification', handleNotification);
    };
  }, [socketRef, activeConversation?._id]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    navigate(`/chat/${conversation._id}`);
  };

  const handleSend = async () => {
    try {
      if (!activeConversation) return;
      if (noteMode) {
        await conversationsAPI.addNote(activeConversation._id, { content: messageInput });
      } else {
        await conversationsAPI.sendMessage(activeConversation._id, { content: messageInput, type: 'text' });
      }
      setMessageInput('');
      setNoteMode(false);
      await loadConversationDetails(activeConversation._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleAssign = async (agentId) => {
    if (!activeConversation) return;
    try {
      const response = await conversationsAPI.assign(activeConversation._id, { agentId: agentId || null });
      setActiveConversation(response.data.conversation);
      loadConversations().catch(() => null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign conversation');
    }
  };

  const handleResolve = async () => {
    if (!activeConversation) return;
    try {
      const response = await conversationsAPI.updateStatus(activeConversation._id, { status: 'resolved' });
      setActiveConversation(response.data.conversation);
      loadConversations().catch(() => null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSaveCustomer = async (payload) => {
    try {
      const response = await customersAPI.update(activeConversation.customer._id, payload);
      setActiveConversation((prev) => ({ ...prev, customer: response.data.customer }));
      loadConversations().catch(() => null);
      toast.success('Customer updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleAddTag = async (name) => {
    try {
      const response = await customersAPI.addTag(activeConversation.customer._id, { name });
      setActiveConversation((prev) => ({ ...prev, customer: response.data.customer }));
      const tagsResponse = await tagsAPI.getAll();
      setTags(tagsResponse.data.tags || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const response = await customersAPI.removeTag(activeConversation.customer._id, tagId);
      setActiveConversation((prev) => ({ ...prev, customer: response.data.customer }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove tag');
    }
  };

  const loadMoreMessages = async () => {
    if (!activeConversation || messagesPage >= (messagesMeta.pages || 1)) return;
    const nextPage = messagesPage + 1;
    try {
      await loadConversationDetails(activeConversation._id, nextPage, true);
    } catch {
      toast.error('Failed to load older messages');
    }
  };

  const sendTemplate = async () => {
    try {
      await templatesAPI.send(templateForm.templateId, { to: templateForm.to || activeConversation?.customer?.phone, phoneNumber: activeConversation?.phoneNumber?._id });
      setTemplateModal(false);
      setTemplateForm({ templateId: '', to: '' });
      toast.success('Template sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send template');
    }
  };

  return (
    <div className="grid h-full grid-cols-[320px_minmax(0,1fr)_320px]">
      <ConversationList conversations={conversations} activeId={activeConversation?._id} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onSelect={handleSelectConversation} />

      <div className="flex min-w-0 flex-col bg-[#0B141A]">
        {activeConversation ? (
          <>
            <ChatHeader conversation={activeConversation} agents={agents} onAssign={handleAssign} onResolve={handleResolve} />
            <div ref={scrollRef} onScroll={(event) => { if (event.currentTarget.scrollTop === 0) loadMoreMessages(); }} className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.08),_transparent_35%)] px-5 py-5">
              {messagesPage < (messagesMeta.pages || 1) && <button onClick={loadMoreMessages} className="mx-auto block rounded-full bg-white/5 px-4 py-2 text-xs text-gray-400">Load older messages</button>}
              {intent && latestCustomerMessage && (
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Intent: {intent}
                </div>
              )}
              {messages.map((message) => <MessageBubble key={message._id} message={message} />)}
              {typing && <div className="text-sm text-gray-500">Agent is typing…</div>}
            </div>
            <MessageInput
              value={messageInput}
              setValue={setMessageInput}
              onSend={handleSend}
              noteMode={noteMode}
              setNoteMode={setNoteMode}
              conversationId={activeConversation._id}
              socketRef={socketRef}
              suggestions={suggestions}
              suggestionsLoading={suggestionsLoading}
              onSuggestionClick={(suggestion) => setMessageInput(suggestion)}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">Select a conversation.</div>
        )}
      </div>

      <CustomerInfoPanel
        conversation={activeConversation}
        agents={agents}
        tags={tags}
        onSaveCustomer={handleSaveCustomer}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onAssign={handleAssign}
        onAddNote={() => { setNoteMode(true); setMessageInput(''); }}
        onOpenTemplate={() => setTemplateModal(true)}
      />

      <Modal open={templateModal} onClose={() => setTemplateModal(false)} title="Send Template">
        <div className="space-y-4">
          <select value={templateForm.templateId} onChange={(event) => setTemplateForm((prev) => ({ ...prev, templateId: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none">
            <option value="">Select template</option>
            {templates.map((template) => <option key={template._id} value={template._id}>{template.name}</option>)}
          </select>
          <input value={templateForm.to || activeConversation?.customer?.phone || ''} onChange={(event) => setTemplateForm((prev) => ({ ...prev, to: event.target.value }))} placeholder="Customer phone number" className="w-full rounded-xl border border-white/10 bg-[#0B141A] px-4 py-3 text-white outline-none" />
          {templateForm.templateId && <Badge color="blue">{templates.find((item) => item._id === templateForm.templateId)?.body}</Badge>}
          <button onClick={sendTemplate} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white">Send Template</button>
        </div>
      </Modal>
    </div>
  );
}
