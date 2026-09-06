// components/SaveBillDialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SaveBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (label: string) => void;
}

export function SaveBillDialog({
  open,
  onOpenChange,
  onSave,
}: SaveBillDialogProps) {
  const [label, setLabel] = useState('');

  function handleSave() {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setLabel('');
    onOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to History</DialogTitle>
          <DialogDescription>
            Give this bill a name so you can find it later.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder='e.g. "Lunch at Warung Padang"'
          value={label}
          onChange={(e) => setLabel(e.target.value.slice(0, 80))}
          onKeyDown={handleKeyDown}
          maxLength={80}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
