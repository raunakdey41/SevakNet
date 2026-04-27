import { useState, useCallback } from 'react';

export function useNotification() {
  const [notifications, setNotifications] = useState([]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const push = useCallback((message, options = {}) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type: options.type || 'info', ...options }]);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SevakNet', { body: message });
    }
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, options.duration || 4000);
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, push, dismiss, requestPermission };
}
