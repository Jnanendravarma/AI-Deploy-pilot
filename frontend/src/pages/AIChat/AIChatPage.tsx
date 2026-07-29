import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';

import { aiApi } from '../../services/api';

export const AIChatPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const deploymentId = queryParams.get('deploymentId');

  const [messages, setMessages] = useState<{ author: 'user' | 'ai'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');

  const mutation = useMutation({
    mutationFn: (message: string) => aiApi.handleChat({ message, deploymentId: deploymentId || undefined }),
    onSuccess: (data) => {
      setMessages(prev => [...prev, { author: 'ai', text: data.data.response }]);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { author: 'user', text: inputValue }]);
    mutation.mutate(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
      {deploymentId && <p className="text-sm text-slate-500 mb-4">Chatting in context of deployment <span className="font-mono">{deploymentId}</span></p>}
      
      <Card className="flex-grow flex flex-col">
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-4 py-2 ${msg.author === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {mutation.isPending && <Loader>AI is thinking...</Loader>}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 flex gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask the AI a question..."
            className="flex-grow"
            disabled={mutation.isPending}
          />
          <Button type="submit" disabled={mutation.isPending}>Send</Button>
        </form>
      </Card>
    </div>
  );
};
