import { CheckCircle2, Download, Info } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface InstallAppActionProps {
  compact?: boolean;
  showFallback?: boolean;
  className?: string;
}

export function InstallAppAction({
  compact = false,
  showFallback = false,
  className,
}: InstallAppActionProps) {
  const { isReady, canInstall, isInstalled, install } = usePwaInstall();
  const [message, setMessage] = useState<string | null>(null);

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setMessage('Install requested. MathVenture will be available from your device apps.');
    } else if (outcome === 'dismissed') {
      setMessage('Installation was dismissed. You can use your browser menu to install MathVenture.');
    }
  };

  if (isInstalled) {
    if (!showFallback) {
      return null;
    }

    return (
      <p className="flex min-w-0 items-start gap-2 text-sm font-bold text-emerald-800" aria-live="polite">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>MathVenture is installed on this device.</span>
      </p>
    );
  }

  if (canInstall) {
    if (compact) {
      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={className}
          onClick={() => void handleInstall()}
        >
          <Download aria-hidden="true" />
          <span>Install MathVenture</span>
        </Button>
      );
    }

    return (
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={className}
          onClick={() => void handleInstall()}
        >
          <Download aria-hidden="true" />
          <span>Install MathVenture</span>
        </Button>
        {message && <span className="text-sm font-bold text-muted-foreground" aria-live="polite">{message}</span>}
      </div>
    );
  }

  if (compact || !showFallback || !isReady) {
    return null;
  }

  return (
    <p className="flex min-w-0 items-start gap-2 text-sm font-semibold leading-6 text-muted-foreground" aria-live="polite">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <span>{message ?? 'Open your browser menu and choose Install MathVenture or Add to Home Screen.'}</span>
    </p>
  );
}
