"use client";

import { useEffect } from "react";
import type { Bill } from "@/lib/types";
import { useAdmin } from "./Store";
import { Receipt, parseFormat } from "./receipt";

/** Print an existing bill straight away on the paper chosen in Settings (3 inch roll unless changed) — no questions asked. */
export default function PrintModal({ bill, onClose }: { bill: Bill | null; onClose: () => void }) {
  const { s, print } = useAdmin();
  useEffect(() => {
    if (!bill) return;
    print(<Receipt b={bill} shop={s.settings.shopName} details={s.settings} fmt={parseFormat(s.settings.printFormat)} showLoyalty={s.loyaltyEarn.display.receiptSummary} />);
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill]);
  return null;
}
