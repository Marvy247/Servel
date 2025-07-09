import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 5000,
  action,
}) => {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    const baseStyles = 'shadow-lg rounded-lg border p-4 pr-8 max-w-md';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      default: // info
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    const iconClass = 'w-5 h-5';
    switch (type) {
      case 'success':
        return <CheckCircle2 className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      default: // info
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed top-4 right-4 z-50 ${getStyles()}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className="mt-2 text-xs font-semibold underline hover:no-underline focus:outline-none"
              >
                {action.label}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-1 hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;