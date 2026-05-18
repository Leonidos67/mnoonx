import type { LucideIcon } from 'lucide-react';
import {
  MessagesSquare,
  GraduationCap,
  Quote,
  CloudDownload,
  Megaphone,
  Calendar,
  LayoutGrid,
} from 'lucide-react';
import { COMMUNITY_APP_IDS, type CommunityAppId } from '../../../constants/communityApps';

export function dashboardAppLabel(appId: string): string {
  switch (appId) {
    case COMMUNITY_APP_IDS.CHAT:
      return 'Chat';
    case COMMUNITY_APP_IDS.COURSES:
      return 'Courses';
    case COMMUNITY_APP_IDS.CONTENT:
      return 'Content';
    case COMMUNITY_APP_IDS.FILES:
      return 'Files';
    case COMMUNITY_APP_IDS.ANNOUNCEMENTS:
      return 'Announcements';
    case COMMUNITY_APP_IDS.EVENTS:
      return 'Events';
    default:
      return appId;
  }
}

export function dashboardAppIcon(appId: string): LucideIcon {
  switch (appId as CommunityAppId) {
    case COMMUNITY_APP_IDS.CHAT:
      return MessagesSquare;
    case COMMUNITY_APP_IDS.COURSES:
      return GraduationCap;
    case COMMUNITY_APP_IDS.CONTENT:
      return Quote;
    case COMMUNITY_APP_IDS.FILES:
      return CloudDownload;
    case COMMUNITY_APP_IDS.ANNOUNCEMENTS:
      return Megaphone;
    case COMMUNITY_APP_IDS.EVENTS:
      return Calendar;
    default:
      return LayoutGrid;
  }
}
