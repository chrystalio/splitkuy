import { useBillContext } from '@/components/BillContext';

export function useBill() {
  const { bill, dispatch, summaries, saveToHistory, historyVersion } = useBillContext();
  return { bill, dispatch, summaries, saveToHistory, historyVersion };
}
