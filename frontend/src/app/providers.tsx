import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectProvider } from '../context/ProjectContext';
import { ToastContainer } from '../components/ui/Toast';
import { AIAssistant } from '../components/AIAssistant';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000
    }
  }
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        {children}
        <ToastContainer />
        <AIAssistant />
      </ProjectProvider>
    </QueryClientProvider>
  );
};
