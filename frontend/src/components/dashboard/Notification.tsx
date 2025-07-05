import React from 'react';

interface NotificationProps {
  message: string;
  type?: 'info' | 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'info', onClose }) => {
  const bgColor =
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg text-white ${bgColor} flex items-center space-x-4`}>
      <div className="flex-1">{message}</div>
      <button
        onClick={onClose}
        className="font-bold text-xl leading-none focus:outline-none"
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
};

export default Notification;
