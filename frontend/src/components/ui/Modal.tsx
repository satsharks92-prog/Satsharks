import { ReactNode } from "react";
import { Icon } from "../common/Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, icon, children, maxWidth = "max-w-lg" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className={`bg-surface-container-lowest border border-outline-variant/65 rounded-2xl shadow-xl w-full ${maxWidth} p-6 relative flex flex-col my-8`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <Icon name="close" className="text-2xl" />
        </button>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          {icon && <Icon name={icon} className="text-primary" />}
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
