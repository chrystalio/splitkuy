import { useBillContext } from '@/components/BillContext';

export function useBill() {
  const { bill, dispatch, summaries, saveToHistory } = useBillContext();
  return { bill, dispatch, summaries, saveToHistory };
}
