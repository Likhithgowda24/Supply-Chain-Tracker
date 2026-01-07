import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface TransactionStep {
  step: number;
  status: "pending" | "processing" | "completed" | "error";
  message: string;
}

interface TransactionDialogProps {
  open: boolean;
  isProcessing: boolean;
  steps: TransactionStep[];
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  details?: Record<string, any>;
}

export function TransactionDialog({
  open,
  isProcessing,
  steps,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm & Pay",
  cancelText = "Cancel",
  details = {},
}: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Details */}
          {Object.keys(details).length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span className="font-semibold">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Processing Steps */}
          {isProcessing && steps.length > 0 && (
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.step} className="flex items-start gap-3">
                  <div className="mt-1">
                    {step.status === "processing" && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {step.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {step.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {step.status === "pending" && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {!isProcessing && (
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                {cancelText}
              </Button>
              <Button onClick={onConfirm} disabled={isProcessing}>
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {confirmText}
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-center">
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
