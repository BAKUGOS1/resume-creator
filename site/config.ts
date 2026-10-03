/** Public site settings. Change `url` if the production domain changes. */
export const SITE = {
  url: 'https://atsresumecreator.vercel.app',
  name: 'Resume Creator',
  locale: 'en',
  author: { name: 'Mohit Kumar', url: 'https://mohitstack.vercel.app/', github: 'https://github.com/BAKUGOS1' },
  repo: 'https://github.com/BAKUGOS1/resume-creator',
} as const;

export const abs = (path: string) => `${SITE.url}${path}`;
