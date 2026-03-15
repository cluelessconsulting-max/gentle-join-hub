import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
}

const ConfirmDialog = ({ open, onConfirm, onCancel, title, description, confirmLabel = "Continue", variant = "default" }: Props) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <AlertDialogContent className="bg-background border-border text-foreground">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-foreground font-display">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="bg-secondary border-border text-foreground/70 hover:bg-foreground/5 hover:text-foreground">Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={variant === "destructive" ? "bg-red-700 text-white hover:bg-red-600" : "bg-primary text-primary-foreground hover:bg-accent"}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
