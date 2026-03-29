import type { Metadata } from 'next'
import LegalPageShell from '@/components/LegalPageShell'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Promere, operated by Konvert Media.',
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

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p className="text-sm text-zinc-500 -mt-4 mb-8">Last updated: March 2026</p>

      <Section title="Service Description">
        <p>
          Promere is a free prompt intelligence tool for AI image generation, operated by Konvert
          Media. The service helps you browse, search, and understand prompts and settings associated
          with publicly indexed images.
        </p>
      </Section>

      <Section title="User Accounts">
        <p>
          You may sign in using email and password or Google OAuth. You are responsible for keeping
          your credentials secure and for all activity under your account. Notify us promptly if you
          suspect unauthorized access.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Scrape, crawl, or systematically harvest Promere content without our written permission.</li>
          <li>Redistribute prompts or other content commercially without proper attribution where required.</li>
          <li>Use automated tools to access the service in a way that overloads or interferes with Promere.</li>
        </ul>
      </Section>

      <Section title="Intellectual Property">
        <p>
          Community images and prompts belong to their original creators or rights holders. Promere
          provides indexing, search, and classification only and does not claim ownership of
          third-party content. Images and other materials created by Konvert Media for Promere are
          owned by Konvert Media unless otherwise stated.
        </p>
      </Section>

      <Section title="Content Removal">
        <p>
          Creators may request removal of their images using the removal link on applicable image
          detail pages or by emailing{' '}
          <a href="mailto:content@konvert.media" className="text-sky-400 hover:text-sky-300 underline">
            content@konvert.media
          </a>
          . We will review good-faith requests in line with our policies and applicable law.
        </p>
      </Section>

      <Section title="Disclaimer">
        <p>
          Promere is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We do not warrant
          that prompt text, classifications, or search results are accurate, complete, or fit for any
          particular purpose. You use the service at your own risk.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Konvert Media and its affiliates will not be liable
          for any indirect, incidental, special, consequential, or punitive damages, or any loss of
          profits, data, or goodwill, arising from your use of Promere. Our total liability for any
          claim relating to the service is limited to the greater of (a) the amount you paid us for the
          service in the twelve months before the claim (if any) or (b) one hundred U.S. dollars
          (US$100), except where such limitations are prohibited by law.
        </p>
      </Section>

      <Section title="Changes to Terms">
        <p>
          We may update these Terms from time to time. We will post the revised Terms on this page and
          update the &ldquo;Last updated&rdquo; date. Continued use of Promere after changes take
          effect constitutes your acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For legal inquiries, contact{' '}
          <a href="mailto:legal@konvert.media" className="text-sky-400 hover:text-sky-300 underline">
            legal@konvert.media
          </a>
          .
        </p>
      </Section>
    </LegalPageShell>
  )
}
