import { useEffect, useState } from 'react';

/** Platform public launch — 21 May 2026, 00:00:00 local time. */
export const PLATFORM_LAUNCH_AT = new Date(2026, 4, 21, 0, 0, 0, 0);

export interface UptimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getUptimeParts(from: Date, now: Date = new Date()): UptimeParts {
  const diffMs = Math.max(0, now.getTime() - from.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function usePlatformUptime(launchAt: Date = PLATFORM_LAUNCH_AT): UptimeParts {
  const [parts, setParts] = useState(() => getUptimeParts(launchAt));

  useEffect(() => {
    const tick = () => setParts(getUptimeParts(launchAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchAt]);

  return parts;
}
