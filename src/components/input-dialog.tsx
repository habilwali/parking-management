"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InputDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number";
  defaultValue?: string | number;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  validate?: (value: string) => string | null;
};

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  type = "text",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  validate,
}: InputDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset when dialog opens or closes
  useEffect(() => {
    if (open) {
      setValue(defaultValue.toString());
      setError(null);
    } else {
      setValue("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = () => {
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    onConfirm(value);
    onOpenChange(false);
    setValue("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {label}
            </label>
            <Input
              type={type}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
              placeholder={placeholder}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

