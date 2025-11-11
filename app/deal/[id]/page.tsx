import { prisma } from '@/lib/prisma';
import AdSlot from '@/components/AdSlot';

export default async function DealPage({ params }: { params: { id: string } }) {
  const deal = await prisma.deal.findUnique({ where: { id: Number(params.id) } });
  if (!deal) return <div className="py-16">Deal not found.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{deal.title}</h1>
      {deal.image ? <img src={deal.image} alt={deal.title} className="rounded-xl"/> : null}
      <p className="opacity-80">{deal.description}</p>
      <div className="flex gap-4 text-sm">
        {deal.price ? <span>💸 {deal.price}</span> : null}
        {deal.source ? <span>🏷️ {deal.source}</span> : null}
      </div>
      <a href={deal.url} target="_blank" className="inline-block underline">Go to deal</a>
      <AdSlot slot="1234567890" />
    </div>
  );
}
