/**
 * Extra icon re-exports — CRA's TypeScript types for @animateicons omit some
 * icons that exist at runtime. Importing via this JS bridge keeps webpack happy.
 */
export {
  DownloadIcon,
  ScanIcon,
  ScanQrCodeIcon,
  ShareIcon,
} from '@animateicons/react/lucide';
