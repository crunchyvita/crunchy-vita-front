import Home from '../page';
import { staticPageMetadata } from '@/lib/pageMetadata';

export const generateMetadata = staticPageMetadata('home', '/', { absoluteTitle: true });

export default Home;
