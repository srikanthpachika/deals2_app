import Image from 'next/image';
import Link from 'next/link';

export interface DealProps {
  id: number;
  title: string;
  url: string;
  image?: string | null;
  price?: string | null;
  source?: string | null;
  description?: string | null;
  createdAt: string;
}

export default function DealCard({ deal }: { deal: DealProps }) {
  return (
    <article className="border rounded-2xl p-4 flex gap-4 items-start">
      {deal.image ? (
        <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100">
          <Image src={deal.image} alt={deal.title} fill sizes="112px" />
        </div>
      ) : null}
      <div className="flex-1">
        <h3 className="font-semibold text-lg leading-snug">
          <Link href={`/deal/${deal.id}`} className="hover:underline">{deal.title}</Link>
        </h3>
        <p className="text-sm opacity-80 mt-1">{deal.description?.slice(0, 160)}</p>
        <div className="text-sm mt-2 flex gap-3 opacity-80">
          {deal.price ? <span>💸 {deal.price}</span> : null}
          {deal.source ? <span>🏷️ {deal.source}</span> : null}
          <a href={deal.url} target="_blank" rel="noopener noreferrer" className="underline">View deal</a>
        </div>
      </div>
    </article>
  );
}
