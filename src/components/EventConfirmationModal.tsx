import ModalOverlay from "./ModalOverlay";

interface Props {
  open: boolean;
  onClose: () => void;
  eventName: string;
  status: string;
}

const EventConfirmationModal = ({ open, onClose, eventName, status }: Props) => (
  <ModalOverlay open={open} onClose={onClose}>
    <div className="p-10 md:p-14 text-center">
      <div className="font-display text-[56px] text-accent mb-8 leading-none">◆</div>
      <p className="text-[10px] tracking-[0.24em] uppercase text-accent mb-5">
        {status === "waitlist" ? "Waitlist" : "Request Submitted"}
      </p>
      <h2 className="font-display text-[32px] font-light leading-tight mb-4">
        {status === "waitlist" ? "You're on the waitlist." : "Request Submitted — Pending"}
      </h2>
      <p className="text-[13px] text-warm-grey leading-relaxed tracking-wide mb-3">
        {status === "waitlist"
          ? `${eventName} is currently full. We'll notify you if a spot opens up.`
          : `Your request for ${eventName} has been submitted. You will be notified once it's been reviewed.`}
      </p>
      {status !== "waitlist" && (
        <p className="text-[12px] text-foreground/50 leading-relaxed tracking-wide">
          No tickets are required if you come with Offlist.
        </p>
      )}
      <div className="h-px bg-border my-8" />
      <p className="text-[11px] text-warm-grey tracking-wide leading-relaxed">
        Follow us on{" "}
        <a
          href="https://www.instagram.com/offlist.network/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline hover:text-accent transition-colors"
        >
          Instagram
        </a>{" "}
        and{" "}
        <a
          href="https://www.tiktok.com/@off.list.network"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline hover:text-accent transition-colors"
        >
          TikTok
        </a>{" "}
        to stay updated with the latest events.
      </p>
      <button
        onClick={onClose}
        className="mt-9 w-full py-[17px] font-body text-[11px] tracking-wide-lg uppercase cursor-pointer transition-colors bg-primary text-primary-foreground border-none hover:bg-accent"
      >
        Close
      </button>
    </div>
  </ModalOverlay>
);

export default EventConfirmationModal;
