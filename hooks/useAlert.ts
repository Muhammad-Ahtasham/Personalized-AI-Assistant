import { useState, useCallback } from 'react';
import { AlertType } from '@/components/ui/Alert';

interface AlertState {
  type: AlertType;
  message: string;
  id: string;
}

export function useAlert() {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  const showAlert = useCallback((type: AlertType, message: string) => {
    const id = Date.now().toString();
    setAlerts((prev) => [...prev, { type, message, id }]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      showAlert('success', message);
    },
    [showAlert]
  );

  const showError = useCallback(
    (message: string) => {
      showAlert('error', message);
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string) => {
      showAlert('warning', message);
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message: string) => {
      showAlert('info', message);
    },
    [showAlert]
  );

  return {
    alerts,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissAlert,
  };
}
