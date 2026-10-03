import { CircleAlertIcon, CircleCheckIcon, LightbulbIcon, TriangleAlertIcon } from '../../components/ui/icons';
import { scoreIssues, type Issue, type Severity } from '../../domain/checks';
import { cn } from '../../lib/cn';
import { requestFocus } from '../../store/ui';

const GROUPS: { severity: Severity; title: string; icon: typeof CircleAlertIcon; tone: string }[] = [
  { severity: 'error', title: 'Fix before sending', icon: CircleAlertIcon, tone: 'text-danger' },
  { severity: 'warning', title: 'Should fix', icon: TriangleAlertIcon, tone: 'text-warning' },
  { severity: 'tip', title: 'Suggestions', icon: LightbulbIcon, tone: 'text-info' },
];

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const tone = score >= 85 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`Résumé health score ${score} out of 100`}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 34 34)"
      />
      <text x="34" y="39" textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--fg)">
        {score}
      </text>
    </svg>
  );
}

export function ChecksPanel({ issues, onJump }: { issues: Issue[]; onJump: () => void }) {
  const score = scoreIssues(issues);
  const counts = { error: 0, warning: 0, tip: 0 };
  issues.forEach((i) => counts[i.severity]++);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
        <ScoreRing score={score} />
        <div>
          <p className="text-[15px] font-semibold">{score >= 85 ? 'Ready to send' : score >= 60 ? 'Almost there' : 'Needs work'}</p>
          <p className="text-[13px] text-muted">
            {counts.error} to fix · {counts.warning} to review · {counts.tip} suggestions
          </p>
        </div>
      </div>

      {issues.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-success-soft p-4 text-success">
          <CircleCheckIcon size={20} />
          <p className="text-[13.5px]">No issues found. Your résumé is complete and ATS-friendly.</p>
        </div>
      )}

      {GROUPS.map(({ severity, title, icon: Icon, tone }) => {
        const list = issues.filter((i) => i.severity === severity);
        if (!list.length) return null;
        return (
          <section key={severity} aria-labelledby={`issues-${severity}`} className="flex flex-col gap-2">
            <h3 id={`issues-${severity}`} className="flex items-center gap-2 text-[13px] font-semibold text-muted uppercase tracking-wide">
              <Icon size={15} className={tone} /> {title}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {list.map((issue) => (
                <li key={issue.id}>
                  {issue.field ? (
                    <button
                      type="button"
                      onClick={() => {
                        onJump();
                        requestFocus(issue.field!, issue.sectionId);
                      }}
                      className="flex w-full items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-[13.5px] hover:border-line-strong hover:bg-surface-2"
                    >
                      <span className="flex-1">{issue.message}</span>
                      <span className={cn('shrink-0 text-[12.5px] font-medium text-brand')}>Fix</span>
                    </button>
                  ) : (
                    <p className="rounded-lg border border-line bg-surface px-3 py-2.5 text-[13.5px]">{issue.message}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
