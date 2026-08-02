// components/CopyButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CopyButtonProps {
  text: string;
  label?: string;
  disabled?: boolean;
}

export function CopyButton({ text, label = 'Copy', disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  }

  return (
    <Button onClick={handleCopy} disabled={disabled} className="w-full">
      {copied ? '✓ Copied!' : failed ? 'Copy failed' : label}
    </Button>
  );
}
