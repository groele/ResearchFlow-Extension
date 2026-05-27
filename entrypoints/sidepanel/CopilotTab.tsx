import React, { useState, useRef, useEffect } from 'react';
import { aiCopilot, type ChatMessage } from '../../src/core/ai';
import { useLang } from '../../src/i18n';
import { Button } from '../../src/ui/components/primitives/Button';
import { useToast } from '../../src/ui/components/primitives/Toast';
import { Sparkles, Bot, Send, X } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface CopilotTabProps {
  metaTitle: string;
  metaAbstract: string;
}

export function CopilotTab({ metaTitle, metaAbstract }: CopilotTabProps) {
  const { t } = useLang();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: t('sidepanel.copilotHello') }
  ]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [showRebuttalInput, setShowRebuttalInput] = useState(false);
  const [rebuttalComment, setRebuttalComment] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleChatSend = async (override?: string) => {
    const prompt = override || chatInput.trim();
    if (!prompt) return;
    if (!override) setChatInput('');
    const userMsg: Message = { id: crypto.randomUUID(), sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    const newUserMsg: ChatMessage = { role: 'user', content: prompt };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    setIsChatSending(true);
    const aiId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: aiId, sender: 'ai', text: t('sidepanel.thinking') }]);
    try {
      const systemMsg: ChatMessage = { role: 'system', content: 'You are a helpful academic AI research assistant.' };
      const res = await aiCopilot.generateChatCompletion([systemMsg, ...updatedHistory]);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: res } : m));
      setChatHistory(prev => [...prev, { role: 'assistant', content: res }]);
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: `Error: ${err.message}` } : m));
    } finally { setIsChatSending(false); }
  };

  const handleAiSummarize = async () => {
    if (!metaAbstract.trim()) { toast('warning', t('sidepanel.abstract') + ' required'); return; }
    setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'user', text: `Summarize: "${metaTitle}"` }]);
    setIsChatSending(true);
    const aiId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: aiId, sender: 'ai', text: t('sidepanel.processing') }]);
    try {
      const s = await aiCopilot.summarizePaper(metaTitle, metaAbstract);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: s } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: `Error: ${err.message}` } : m));
    } finally { setIsChatSending(false); }
  };

  const handleAiRebuttal = async (comment?: string) => {
    if (!metaAbstract.trim()) { toast('warning', t('sidepanel.abstract') + ' required'); return; }
    const actualComment = comment || rebuttalComment.trim();
    if (!actualComment) {
      setShowRebuttalInput(true);
      return;
    }
    setShowRebuttalInput(false);
    setRebuttalComment('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'user', text: `Rebuttal for: "${actualComment}"` }]);
    setIsChatSending(true);
    const aiId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: aiId, sender: 'ai', text: t('sidepanel.drafting') }]);
    try {
      const r = await aiCopilot.generateReviewResponse(actualComment, 'Use experimental proofs.', metaAbstract);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: r } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: `Error: ${err.message}` } : m));
    } finally { setIsChatSending(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex gap-2 mb-3 shrink-0">
        <Button variant="ghost" size="xs" className="flex-1" onClick={handleAiSummarize} leftIcon={<Sparkles size={11} />}>{t('sidepanel.summarize')}</Button>
        <Button variant="ghost" size="xs" className="flex-1" onClick={() => setShowRebuttalInput(!showRebuttalInput)} leftIcon={<Bot size={11} />}>{t('sidepanel.rebuttal')}</Button>
      </div>
      {showRebuttalInput && (
        <div className="flex gap-2 mb-3 shrink-0">
          <input
            type="text"
            placeholder={t('sidepanel.reviewerComment')}
            value={rebuttalComment}
            onChange={(e) => setRebuttalComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAiRebuttal(); }}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-primary-500 focus:outline-none rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 transition"
            autoFocus
          />
          <Button variant="primary" size="xs" onClick={() => handleAiRebuttal()} disabled={!rebuttalComment.trim()}>Go</Button>
          <Button variant="ghost" size="xs" onClick={() => { setShowRebuttalInput(false); setRebuttalComment(''); }} leftIcon={<X size={12} />} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800/50 rounded-lg p-3 flex flex-col gap-3 min-h-0">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col max-w-[85%] rounded-lg p-2.5 text-xs leading-relaxed ${
            m.sender === 'user' ? 'bg-primary-600 text-white self-end rounded-br-none' : 'bg-slate-900 border border-slate-800 text-slate-200 self-start rounded-bl-none'
          }`}>
            <div className="whitespace-pre-wrap break-words">{m.text}</div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      <div className="flex gap-2 mt-3 shrink-0">
        <input
          type="text"
          placeholder={t('sidepanel.askQuestion')}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleChatSend(); }}
          disabled={isChatSending}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-primary-500 focus:outline-none rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 transition"
        />
        <Button variant="primary" size="icon" onClick={() => handleChatSend()} disabled={isChatSending || !chatInput.trim()} isLoading={isChatSending}>
          {!isChatSending && <Send size={14} />}
        </Button>
      </div>
    </div>
  );
}
