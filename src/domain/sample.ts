import { createId } from '../lib/id';
import { createBasics, createBullet, createDesign } from './defaults';
import { SCHEMA_VERSION, type Resume } from './schema';

const b = (...lines: string[]) => lines.map((t) => createBullet(t));

/** Neutral, fictional sample shown to first-time visitors. */
export function createSampleResume(): Resume {
  const now = new Date().toISOString();
  const item = { visible: true };
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId('r_'),
    title: 'Sample — Software Engineer',
    createdAt: now,
    updatedAt: now,
    templateId: 'modern',
    design: createDesign(),
    basics: createBasics({
      name: 'Jordan Ellis',
      headline: 'Senior Software Engineer',
      tagline: 'Payments, platform and developer experience',
      email: 'jordan.ellis@example.com',
      phone: '+1 (555) 014-2290',
      location: 'Austin, TX',
      links: [
        { id: createId('l_'), label: 'LinkedIn', url: 'linkedin.com/in/jordan-ellis-example', icon: 'auto' },
        { id: createId('l_'), label: 'GitHub', url: 'github.com/jordan-ellis-example', icon: 'auto' },
        { id: createId('l_'), label: 'Portfolio', url: 'jordanellis.example.com', icon: 'auto' },
      ],
    }),
    sections: [
      {
        id: createId('s_'),
        kind: 'summary',
        title: 'Summary',
        visible: true,
        content:
          'Software engineer with 8 years of experience building reliable payment and platform services. Leads cross-functional projects from design to production, mentors engineers and cares about measurable outcomes: faster checkouts, fewer incidents and happier developers.',
      },
      {
        id: createId('s_'),
        kind: 'experience',
        title: 'Experience',
        visible: true,
        items: [
          {
            ...item,
            id: createId('i_'),
            role: 'Senior Software Engineer',
            organization: 'Northwind Payments',
            location: 'Austin, TX',
            url: '',
            start: '2021-03',
            end: '',
            current: true,
            bullets: b(
              'Led the redesign of the checkout API, cutting p95 latency by **42%** and lifting conversion by 3.1%.',
              'Introduced contract testing and canary releases, reducing payment incidents by 60% year over year.',
              'Mentored six engineers; two were promoted to senior within 18 months.',
            ),
          },
          {
            ...item,
            id: createId('i_'),
            role: 'Software Engineer',
            organization: 'Brightline Health',
            location: 'Remote',
            url: '',
            start: '2017-06',
            end: '2021-02',
            current: false,
            bullets: b(
              'Built a HIPAA-compliant scheduling service used by 1,200 clinics and 2M patients.',
              'Migrated a monolith to event-driven services on Kafka with zero downtime.',
              'Owned on-call runbooks and observability dashboards for the patient platform.',
            ),
          },
        ],
      },
      {
        id: createId('s_'),
        kind: 'projects',
        title: 'Projects',
        visible: true,
        items: [
          {
            ...item,
            id: createId('i_'),
            name: 'Ledgerline',
            subtitle: 'Open-source double-entry ledger',
            url: 'github.com/jordan-ellis-example/ledgerline',
            stack: 'Go, PostgreSQL, gRPC',
            start: '2023-01',
            end: '',
            current: true,
            bullets: b('Handles 5k writes/second with idempotent, auditable transactions; 1.4k GitHub stars.'),
          },
        ],
      },
      {
        id: createId('s_'),
        kind: 'skills',
        title: 'Skills',
        visible: true,
        items: [
          { ...item, id: createId('i_'), label: 'Languages', keywords: 'TypeScript, Go, Python, SQL' },
          { ...item, id: createId('i_'), label: 'Platform', keywords: 'Node.js, PostgreSQL, Kafka, Redis, AWS, Terraform' },
          { ...item, id: createId('i_'), label: 'Practices', keywords: 'System design, observability, CI/CD, mentoring' },
        ],
      },
      {
        id: createId('s_'),
        kind: 'education',
        title: 'Education',
        visible: true,
        items: [
          {
            ...item,
            id: createId('i_'),
            degree: 'B.S. Computer Science',
            institution: 'University of Texas at Austin',
            location: 'Austin, TX',
            score: '',
            start: '2013',
            end: '2017',
            current: false,
            bullets: [],
          },
        ],
      },
      {
        id: createId('s_'),
        kind: 'certifications',
        title: 'Certifications',
        visible: true,
        items: [
          { ...item, id: createId('i_'), name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2022-08', url: '' },
        ],
      },
    ],
  };
}
