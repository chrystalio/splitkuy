import { BillApp } from '@/components/BillApp';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <BillApp />
    </ErrorBoundary>
  );
}
