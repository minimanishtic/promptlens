import type { Metadata } from 'next'
import LegalPageShell from '@/components/LegalPageShell'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for PromptLens, operated by Konvert Media.',
  robots: { index: true, follow: true },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="space-y-4 text-zinc-300 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p className="text-sm text-zinc-500 -mt-4 mb-8">Last updated: March 2026</p>

      <Section title="Data We Collect">
        <p>Depending on how you use PromptLens, we may collect:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-zinc-200">Account data:</strong> email address and Google profile
            information when you authenticate via email/password or Google OAuth.
          </li>
          <li>
            <strong className="text-zinc-200">Library data:</strong> saved prompts, notes, tags, and
            collections you create in your account.
          </li>
          <li>
            <strong className="text-zinc-200">Search data:</strong> queries you submit to improve search
            quality and relevance.
          </li>
          <li>
            <strong className="text-zinc-200">Analytics:</strong> standard usage and performance data via
            Vercel Analytics.
          </li>
          <li>
            <strong className="text-zinc-200">Advertising measurement:</strong> data collected through
            Meta Pixel for advertising measurement and optimization, where implemented.
          </li>
        </ul>
      </Section>

      <Section title="How We Use Data">
        <p>We use this information to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, operate, and improve PromptLens.</li>
          <li>Improve search relevance and product experience.</li>
          <li>Personalize your library and saved content.</li>
          <li>Measure traffic and marketing effectiveness where applicable.</li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>
      </Section>

      <Section title="Cookies">
        <p>
          We use cookies and similar technologies including: Supabase authentication session cookies
          (required for login and session management), and Meta Pixel cookies where used (for
          advertising measurement). You can control cookies through your browser settings, though some
          features may not work without essential cookies.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <p>We rely on service providers that may process data on our behalf, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-zinc-200">Supabase</strong> — authentication and database (data may
            be processed in regions such as Singapore, per Supabase configuration).
          </li>
          <li>
            <strong className="text-zinc-200">Vercel</strong> — hosting and deployment.
          </li>
          <li>
            <strong className="text-zinc-200">Google</strong> — OAuth sign-in when you choose that
            option.
          </li>
          <li>
            <strong className="text-zinc-200">Meta</strong> — Pixel for advertising measurement, where
            enabled.
          </li>
        </ul>
      </Section>

      <Section title="Data Retention">
        <p>
          We retain account-related data until you request deletion of your account or we no longer need
          it for the purposes described here, subject to legal obligations.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Request a copy or export of your personal data.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Request removal of your images from the platform where applicable.</li>
        </ul>
        <p>
          Contact us at{' '}
          <a href="mailto:privacy@konvert.media" className="text-sky-400 hover:text-sky-300 underline">
            privacy@konvert.media
          </a>{' '}
          to exercise these rights.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          PromptLens is not intended for users under 13. We do not knowingly collect personal
          information from children under 13. If you believe we have collected such information, please
          contact us so we can delete it.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions, contact{' '}
          <a href="mailto:privacy@konvert.media" className="text-sky-400 hover:text-sky-300 underline">
            privacy@konvert.media
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  )
}
