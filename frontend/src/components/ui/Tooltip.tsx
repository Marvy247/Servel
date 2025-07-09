import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  delay?: number;
  position?: TooltipPosition;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface TooltipContentProps {
  className?: string;
  position?: TooltipPosition;
  children: React.ReactNode;
}

const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });

const Tooltip: React.FC<TooltipProps> = ({
  children,
  delay = 300,
  position = 'top',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = React.useState(false);
  let timeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    if (!disabled) {
      timeout = setTimeout(() => setOpen(true), delay);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(timeout);
    setOpen(false);
  };

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={`relative inline-block ${className}`}
        role="tooltip"
        aria-haspopup="true"
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger: React.FC<React.PropsWithChildren<{ asChild?: boolean }>> = ({ children }) => {
  return <>{children}</>;
};

const TooltipContent: React.FC<TooltipContentProps> = ({
  children,
  className = '',
  position = 'top',
}) => {
  const { open } = React.useContext(TooltipContext);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full -translate-x-1/2 border-b-gray-800',
    left: 'left-full -translate-y-1/2 border-l-gray-800',
    right: 'right-full -translate-y-1/2 border-r-gray-800',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={`absolute z-50 min-w-max rounded-md bg-gray-800 px-3 py-2 text-sm text-white shadow-lg ${positionClasses[position]} ${className}`}
          role="tooltip"
        >
          {children}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
            style={{
              [position]: '-4px',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent };
export type { TooltipProps, TooltipContentProps };
