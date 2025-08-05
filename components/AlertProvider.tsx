"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useAlert } from '@/hooks/useAlert';
import Alert from '@/components/ui/Alert';

interface AlertContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const { alerts, showSuccess, showError, showWarning, showInfo, dismissAlert } = useAlert();

  return (
    <AlertContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Render alerts */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        {alerts.map((alert) => (
          <div key={alert.id} className="pointer-events-auto">
            <Alert
              type={alert.type}
              message={alert.message}
              onDismiss={() => dismissAlert(alert.id)}
              autoDismiss={true}
              dismissDelay={3000}
            />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
} 