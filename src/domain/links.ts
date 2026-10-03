/**
 * Recognises what a contact link points to, so it can be shown as "GitHub"
 * with a matching icon instead of the raw address.
 */
import { displayUrl, isValidEmail } from '../lib/url';
import type { Link, LinkIcon, LinkStyle } from './schema';

export interface LinkKind {
  /** Display name used when the link has no label of its own. */
  name: string;
  icon: LinkIcon;
}

const SITES: [RegExp, string, LinkIcon][] = [
  [/(^|\.)linkedin\.com$/, 'LinkedIn', 'profile'],
  [/(^|\.)github\.com$/, 'GitHub', 'repo'],
  [/(^|\.)gitlab\.com$/, 'GitLab', 'repo'],
  [/(^|\.)bitbucket\.org$/, 'Bitbucket', 'repo'],
  [/(^|\.)github\.io$/, 'Portfolio', 'briefcase'],
  [/(^|\.)stackoverflow\.com$/, 'Stack Overflow', 'code'],
  [/(^|\.)leetcode\.com$/, 'LeetCode', 'code'],
  [/(^|\.)hackerrank\.com$/, 'HackerRank', 'code'],
  [/(^|\.)kaggle\.com$/, 'Kaggle', 'code'],
  [/(^|\.)codepen\.io$/, 'CodePen', 'code'],
  [/(^|\.)npmjs\.com$/, 'npm', 'code'],
  [/(^|\.)huggingface\.co$/, 'Hugging Face', 'code'],
  [/(^|\.)dribbble\.com$/, 'Dribbble', 'image'],
  [/(^|\.)behance\.net$/, 'Behance', 'image'],
  [/(^|\.)artstation\.com$/, 'ArtStation', 'image'],
  [/(^|\.)figma\.com$/, 'Figma', 'image'],
  [/(^|\.)instagram\.com$/, 'Instagram', 'image'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube', 'play'],
  [/(^|\.)vimeo\.com$/, 'Vimeo', 'play'],
  [/(^|\.)(twitter\.com|x\.com)$/, 'X', 'chat'],
  [/(^|\.)bsky\.app$/, 'Bluesky', 'chat'],
  [/(^|\.)threads\.net$/, 'Threads', 'chat'],
  [/(^|\.)medium\.com$/, 'Medium', 'pen'],
  [/(^|\.)substack\.com$/, 'Substack', 'pen'],
  [/(^|\.)dev\.to$/, 'DEV', 'pen'],
  [/(^|\.)hashnode\.(dev|com)$/, 'Hashnode', 'pen'],
  [/(^|\.)scholar\.google\.[a-z.]+$/, 'Google Scholar', 'book'],
  [/(^|\.)orcid\.org$/, 'ORCID', 'book'],
  [/(^|\.)researchgate\.net$/, 'ResearchGate', 'book'],
  [/(^|\.)arxiv\.org$/, 'arXiv', 'book'],
  [/(^|\.)calendly\.com$/, 'Calendly', 'calendar'],
  [/(^|\.)(open\.spotify\.com|podcasts\.apple\.com)$/, 'Podcast', 'mic'],
  [/(^|\.)(unsplash\.com|500px\.com|flickr\.com)$/, 'Photography', 'camera'],
];

/** Words in a label that say more than the address does ("Portfolio", "Blog"). */
const LABEL_ICONS: [RegExp, LinkIcon][] = [
  [/portfolio|work|case stud/i, 'briefcase'],
  [/blog|writing|articles|newsletter/i, 'pen'],
  [/linkedin|profile/i, 'profile'],
  [/github|gitlab|repo|source/i, 'repo'],
  [/code|leetcode|kaggle/i, 'code'],
  [/design|dribbble|behance|gallery|photo/i, 'image'],
  [/video|youtube|talk|demo/i, 'play'],
  [/publication|paper|research|scholar/i, 'book'],
  [/email|mail/i, 'mail'],
];

function host(url: string): string {
  return displayUrl(url).split(/[/?#]/)[0]!.toLowerCase();
}

/** What a URL points to; unknown sites are a "Website" with a globe. */
export function detectLink(url: string, label = ''): LinkKind {
  const value = url.trim();
  if (/^mailto:/i.test(value) || isValidEmail(value)) return { name: 'Email', icon: 'mail' };
  if (/^tel:/i.test(value)) return { name: 'Phone', icon: 'phone' };
  const h = host(value);
  for (const [re, name, icon] of SITES) if (re.test(h)) return { name, icon };
  const byLabel = LABEL_ICONS.find(([re]) => re.test(label));
  if (byLabel) return { name: 'Website', icon: byLabel[1] };
  if (/(^|[./])blog([./]|$)/.test(displayUrl(value).toLowerCase())) return { name: 'Blog', icon: 'pen' };
  return { name: 'Website', icon: 'globe' };
}

/** The icon actually drawn: the user's choice, or the detected one. */
export function linkIcon(link: Link): LinkIcon {
  return link.icon === 'auto' || link.icon === 'custom' ? detectLink(link.url, link.label).icon : link.icon;
}

/** The uploaded icon, when the link uses one. */
export const linkImage = (link: Link): string | undefined => (link.icon === 'custom' ? link.iconImage : undefined);

/** The text shown for a link in a given style. */
export function linkText(link: Link, style: LinkStyle): string {
  if (style === 'url') return displayUrl(link.url);
  const label = link.label.trim();
  if (label) return label;
  const kind = detectLink(link.url);
  // Unknown sites read better as their domain than as a vague "Website".
  return kind.name === 'Website' ? host(link.url) || 'Website' : kind.name;
}

export const LINK_STYLE_LABELS: Record<LinkStyle, string> = {
  url: 'Address',
  text: 'Text',
  'icon-text': 'Icon + text',
  icon: 'Icon',
};
