export type SupportSlashCommand = {
  command: string;
  descriptionKey: string;
};

/** Keep in sync with server/services/supportBot.js SLASH_COMMANDS */
export const SUPPORT_SLASH_COMMANDS: SupportSlashCommand[] = [
  { command: '/start', descriptionKey: 'messenger.supportCommands.start' },
  { command: '/help', descriptionKey: 'messenger.supportCommands.help' },
  { command: '/menu', descriptionKey: 'messenger.supportCommands.menu' },
  { command: '/account', descriptionKey: 'messenger.supportCommands.account' },
  { command: '/communities', descriptionKey: 'messenger.supportCommands.communities' },
  { command: '/posts', descriptionKey: 'messenger.supportCommands.posts' },
  { command: '/messenger', descriptionKey: 'messenger.supportCommands.messenger' },
  { command: '/payments', descriptionKey: 'messenger.supportCommands.payments' },
  { command: '/bugs', descriptionKey: 'messenger.supportCommands.bugs' },
  { command: '/support', descriptionKey: 'messenger.supportCommands.support' },
  { command: '/human', descriptionKey: 'messenger.supportCommands.human' },
];

export function filterSupportSlashCommands(input: string): SupportSlashCommand[] {
  const raw = input.trim();
  if (!raw.startsWith('/')) return [];
  const q = raw.toLowerCase();
  return SUPPORT_SLASH_COMMANDS.filter((c) => c.command.startsWith(q));
}
