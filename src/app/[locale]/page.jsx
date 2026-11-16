import Home from '../page';
import { staticPageMetadata } from '@/lib/pageMetadata';
import { getActivePackages, getSettings } from '@/lib/serverApi';
import { findDiscoveryPack, toDiscoveryPackProps } from '@/lib/discoveryPack';
import { getFranceShippingThresholds } from '@/lib/shippingThresholds';

export const generateMetadata = staticPageMetadata('home', '/', { absoluteTitle: true });

export default async function HomePage({ params }) {
  const { locale } = await params;
  const [packages, settings] = await Promise.all([
    getActivePackages().catch(() => []),
    getSettings().catch(() => null),
  ]);

  return (
    <Home
      discoveryPack={toDiscoveryPackProps(findDiscoveryPack(packages), locale)}
      relayFreeShipping={getFranceShippingThresholds(settings).relayFree}
    />
  );
}
