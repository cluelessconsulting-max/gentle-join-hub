import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalOverlay = ({ open, onClose, children }: Props) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-foreground/65 z-[200] flex items-center justify-center backdrop-blur-sm p-5 transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background w-full max-w-[500px] max-h-[92vh] overflow-y-auto relative scrollbar-none animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-transparent border-none text-base cursor-pointer text-warm-grey hover:text-foreground transition-colors z-10 leading-none"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export default ModalOverlay;
