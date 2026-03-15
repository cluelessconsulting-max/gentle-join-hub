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
    <AlertDialogContent className="bg-[#0f0f1a] border-[#1e1e2e] text-slate-200">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-slate-50">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-slate-400">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="bg-[#1a1a2e] border-[#2a2a3e] text-slate-300 hover:bg-[#2a2a3e] hover:text-slate-100">Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={variant === "destructive" ? "bg-red-600 text-white hover:bg-red-500" : "bg-purple-600 text-white hover:bg-purple-500"}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
