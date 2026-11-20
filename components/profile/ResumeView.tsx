import type { GeneratedResume } from "@/lib/resume";

/** Clean, print-friendly resume layout (used by members and admins). */
export function ResumeView({ r }: { r: GeneratedResume }) {
  return (
    <article className="bg-white rounded-[16px] border border-ecrn-line p-6 sm:p-10 text-ecrn-ink print:border-0 print:p-0">
      <header className="border-b border-ecrn-line pb-4">
        <h1 className="font-display text-[30px] font-semibold tracking-tight">{r.name}</h1>
        <p className="text-[15px] font-medium text-ecrn-green-text">{r.headline}</p>
        <p className="mt-1 text-[13px] text-ecrn-secondary">{r.contact.join("  ·  ")}</p>
      </header>
      {r.summary && <p className="mt-4 text-[14.5px] leading-[22px]">{r.summary}</p>}
      {r.experience.length > 0 && (
        <Section title="Experience">
          {r.experience.map((e, i) => (
            <div key={i} className="mt-3 first:mt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-semibold">
                  {e.title}
                  {e.company && <span className="font-normal text-ecrn-secondary"> · {e.company}</span>}
                </h3>
                <span className="text-[12.5px] text-ecrn-secondary">{e.years}</span>
              </div>
              {e.bullets.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-[14px] leading-[21px] space-y-0.5">
                  {e.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}
      {r.education.length > 0 && <Section title="Education"><List items={r.education} /></Section>}
      {r.certifications.length > 0 && <Section title="Licenses & certifications"><List items={r.certifications} /></Section>}
      {r.skills.length > 0 && (
        <Section title="Skills">
          <p className="text-[14px]">{r.skills.join(" · ")}</p>
        </Section>
      )}
      {r.references.length > 0 && <Section title="References"><List items={r.references} /></Section>}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="t-eyebrow mb-2">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="text-[14px] leading-[21px] space-y-0.5">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}
