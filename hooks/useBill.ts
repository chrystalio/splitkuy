import { useBillContext } from '@/components/BillContext';

export function useBill() {
  const { bill, dispatch, summaries } = useBillContext();
  return { bill, dispatch, summaries };
}
