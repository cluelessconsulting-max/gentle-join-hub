import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  date: string;
  onRegister: () => void;
  onSignIn: () => void;
}

const EventAccessModal = ({ open, onClose, title, date, onRegister, onSignIn }: Props) => (
  <ModalOverlay open={open} onClose={onClose}>
    <div className="p-10 md:p-12">
      <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-4">Offlist Event</p>
      <h2 className="font-display text-[34px] font-light leading-tight mb-2.5">{title}</h2>
      <p className="text-[11px] text-warm-grey tracking-wide mb-10">{date}</p>
      <div className="h-px bg-border mb-9" />
      <div className="flex flex-col gap-3">
        <button
          onClick={() => { onClose(); setTimeout(onRegister, 120); }}
          className="w-full py-[17px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer transition-colors bg-primary text-primary-foreground border-none hover:bg-accent"
        >
          Register to Access
        </button>
        <button
          onClick={() => { onClose(); setTimeout(onSignIn, 120); }}
          className="w-full py-[17px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer transition-all bg-transparent text-foreground border border-foreground/20 hover:bg-foreground/[0.04] hover:border-foreground"
        >
          Sign In
        </button>
      </div>
      <p className="text-center text-[11px] text-warm-grey tracking-wide mt-5 leading-relaxed">
        Event details are available to Offlist members only.
      </p>
    </div>
  </ModalOverlay>
);

export default EventAccessModal;
