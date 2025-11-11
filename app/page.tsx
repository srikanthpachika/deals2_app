import { prisma } from '@/lib/prisma';
import DealCard from '@/components/DealCard';
import AdSlot from '@/components/AdSlot';

export const revalidate = 60;

export default async function Home() {
  const deals = await prisma.deal.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take: 60, // list most recent; creation gate enforces <50/day
  });

  return (
    <div className="space-y-8">
      <AdSlot slot="1234567890" />
      <section className="grid gap-4">
        {deals.length === 0 ? <p>No deals yet. Check back soon!</p> : deals.map(d => (
          <DealCard key={d.id} deal={{...d, createdAt: d.createdAt.toISOString()}}/>
        ))}
      </section>
      <AdSlot slot="1234567890" />
    </div>
  );
}
