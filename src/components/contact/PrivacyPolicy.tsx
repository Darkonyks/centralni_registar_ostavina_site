import { Fragment } from 'react';

import { PRIVACY_POLICY_VERSION } from '../../../shared/consent';
import { CONTACT_EMAIL } from '../../config/site';
import { PRIVACY_POLICY } from '../../data/privacy';

/** Kontakt email u tekstu postaje mailto link. */
function withEmailLinks(text: string) {
  const parts = text.split(CONTACT_EMAIL);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 && (
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-brand-800 underline underline-offset-2"
        >
          {CONTACT_EMAIL}
        </a>
      )}
    </Fragment>
  ));
}

interface PrivacyPolicyProps {
  headingId: string;
}

/** Pun tekst politike privatnosti (u kontakt formi, iznad polja za saglasnost). */
export function PrivacyPolicy({ headingId }: PrivacyPolicyProps) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
      <div>
        <h4 id={headingId} className="text-base font-semibold text-slate-900">
          {PRIVACY_POLICY.title}
        </h4>
        <p className="text-xs text-slate-500">
          Važi od {PRIVACY_POLICY.effectiveDate} · verzija {PRIVACY_POLICY_VERSION}
        </p>
      </div>
      {PRIVACY_POLICY.intro.map((text) => (
        <p key={text}>{withEmailLinks(text)}</p>
      ))}
      {PRIVACY_POLICY.sections.map((section) => (
        <section key={section.heading} className="space-y-1.5">
          <h5 className="font-semibold text-slate-900">{section.heading}</h5>
          {section.paragraphs?.map((text) => (
            <p key={text}>{withEmailLinks(text)}</p>
          ))}
          {section.items && (
            <ul className="list-disc space-y-1 pl-5">
              {section.items.map((text) => (
                <li key={text}>{withEmailLinks(text)}</li>
              ))}
            </ul>
          )}
          {section.after?.map((text) => (
            <p key={text}>{withEmailLinks(text)}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
