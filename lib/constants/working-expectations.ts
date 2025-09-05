export const DEFAULT_WORKING_EXPECTATIONS = `**Working expectations (edit as needed)**

- **Acknowledgement:** Vendor will acknowledge within 1 business day.  
- **Draft ETA:** First draft due by [enter date].  
- **Final review buffer:** Keep 3 business days before your deadline.  
- **Corrections window:** Error corrections included for 14 days after delivery.  
- **Change requests:** Out-of-scope changes quoted and approved before work continues.  
- **Communication & files:** Use email or your secure portal for documents. Do not post SSNs, full DOBs, or unmasked IRS notices in chat.  
- **Availability:** Mon–Fri, 9–5 [timezone].  
- **Insurance:** [Yes/No] professional liability required.  
- **Change control:** If scope changes, vendor pauses and sends a revised quote and ETA.`;

export function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export function nextBusinessDay(date: Date): Date {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function suggestDraftEta(volume?: number): Date {
  const today = new Date();
  const minDays = 3;
  const weeks = volume && volume > 0 ? Math.ceil(volume / 10) : 1;
  const days = Math.max(minDays, weeks * 7);
  return nextBusinessDay(addBusinessDays(today, days));
}
