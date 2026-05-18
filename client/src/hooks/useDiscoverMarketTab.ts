import { useLocation, useSearchParams } from 'react-router-dom';

export function useDiscoverMarketTab(): boolean {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  return pathname === '/discover' && searchParams.get('tab') === 'market';
}
