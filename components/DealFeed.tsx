"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import DealCard, { DealProps } from "@/components/DealCard";

const DEFAULT_BATCH = 48;

function formatMinutes(value: number): string {
  if (!Number.isFinite(value)) return "10";
  if (value <= 1) return "1";
  return String(Math.round(value));
}

export default function DealFeed({
  deals,
  batchSize = DEFAULT_BATCH,
  cadenceMinutes = 10,
}: {
  deals: DealProps[];
  batchSize?: number;
  cadenceMinutes?: number;
}) {
  const [visible, setVisible] = useState(batchSize);
  const [lastVisit, setLastVisit] = useState<number | null>(null);

  useEffect(() => {
    const stored = Number(localStorage.getItem("d2p-last-visit") || "");
    if (Number.isFinite(stored) && stored > 0) {
      setLastVisit(stored);
    }
    localStorage.setItem("d2p-last-visit", String(Date.now()));
  }, []);

  const visibleDeals = deals.slice(0, visible);
  const hasMore = visible < deals.length;

  const firstNewIndex = useMemo(() => {
    if (!lastVisit) return -1;
    return deals.findIndex((deal) => {
      const timestamp = Date.parse(deal.createdAt);
      return Number.isFinite(timestamp) && timestamp > lastVisit;
    });
  }, [deals, lastVisit]);

  const feedItems = useMemo(() => {
    return visibleDeals.flatMap((deal, index) => {
      const items: ReactNode[] = [];
      if (index === firstNewIndex) {
        items.push(
          <div key={`marker-${deal.id}`} className="feed-marker">
            New since your last visit
          </div>
        );
      }
      items.push(
        <DealCard key={deal.id} deal={deal} index={index} variant="compact" />
      );
      if ((index + 1) % batchSize === 0 && index !== visibleDeals.length - 1) {
        items.push(
          <div key={`checkpoint-${index}`} className="feed-checkpoint">
            Checkpoint: {index + 1} verified drops viewed
          </div>
        );
      }
      return items;
    });
  }, [visibleDeals, firstNewIndex, batchSize]);

  return (
    <div className="feed-stack">
      <div className="deal-grid deal-grid--featured">{feedItems}</div>
      <div className="feed-stop">
        {hasMore ? (
          <>
            <p className="feed-stop__title">More verified drops ahead</p>
            <p className="feed-stop__subtitle">
              Load the next batch of {batchSize} deals when you&apos;re ready.
            </p>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() =>
                setVisible((count) => Math.min(count + batchSize, deals.length))
              }
            >
              Load next {batchSize}
            </button>
          </>
        ) : (
          <>
            <p className="feed-stop__title">You&apos;re caught up.</p>
            <p className="feed-stop__subtitle">
              Next update in ~{formatMinutes(cadenceMinutes)} min. Want a reminder?
            </p>
            <a className="btn btn--soft" href="#newsletter-email">
              Get deal alerts
            </a>
          </>
        )}
      </div>
    </div>
  );
}
