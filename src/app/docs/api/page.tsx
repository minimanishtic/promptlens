import Link from 'next/link'
import { NavAuthButton } from '@/components/UserMenu'
import MobileNav from '@/components/MobileNav'
import { MODELS } from '@/lib/prompt-formatters'

export const metadata = {
  title: 'API Documentation — Promere',
  description: 'REST API for semantic prompt search, image reverse-engineering, and multi-model prompt formatting.',
}

const TIERS = [
  { name: 'Free', search: 20, reverse: 5, format: 20 },
]

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <DocsNav />

      <div className="max-w-screen-xl mx-auto px-4 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <Sidebar />

        <main className="min-w-0 space-y-12">
          <header>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Promere API</h1>
            <p className="text-zinc-400 max-w-2xl">
              REST endpoints for semantic prompt search, image reverse-engineering,
              and multi-model prompt formatting. Authenticate with a Bearer key from
              the <Link href="/dashboard" className="text-sky-400 hover:underline">dashboard</Link>.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono">
              https://promere.app/api/v1
            </div>
          </header>

          <Section id="authentication" title="Authentication">
            <p className="text-sm text-zinc-300 mb-4">
              All authenticated endpoints expect a Bearer token in the{' '}
              <code className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200">Authorization</code> header.
              Get a key from the <Link href="/dashboard" className="text-sky-400 hover:underline">dashboard</Link> —
              it&apos;s shown once at creation and never again.
            </p>
            <CodeBlock language="bash">{`curl https://promere.app/api/v1/search \\
  -H "Authorization: Bearer pk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "neon-lit alley at midnight", "limit": 5}'`}</CodeBlock>
            <p className="text-xs text-zinc-500 mt-3">
              Keys start with <code className="font-mono">pk_</code>. Treat them like passwords —
              never commit them to source control or expose them in client-side code.
            </p>
          </Section>

          <Section id="rate-limits" title="Rate Limits">
            <p className="text-sm text-zinc-300 mb-4">
              Limits are per-endpoint, per-key, per UTC day. The response includes:
            </p>
            <ul className="text-sm text-zinc-300 space-y-1 mb-4 list-disc pl-5">
              <li><code className="font-mono text-xs">X-RateLimit-Limit</code> — your daily cap</li>
              <li><code className="font-mono text-xs">X-RateLimit-Remaining</code> — calls left today</li>
              <li><code className="font-mono text-xs">X-RateLimit-Reset</code> — ISO timestamp of the next reset (midnight UTC)</li>
            </ul>
            <Table
              headers={['Tier', '/search', '/reverse', '/format']}
              rows={TIERS.map((t) => [t.name, String(t.search), String(t.reverse), String(t.format)])}
            />
            <p className="text-xs text-zinc-500 mt-3">
              When exceeded, the API returns <code className="font-mono">429 rate_limit_exceeded</code>.
            </p>
          </Section>

          <Section id="errors" title="Error Format">
            <p className="text-sm text-zinc-300 mb-4">
              All errors return a consistent JSON shape:
            </p>
            <CodeBlock language="json">{`{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Daily search limit exceeded. Used 20/20. Resets at midnight UTC.",
    "limit": 20,
    "remaining": 0,
    "reset_at": "2026-05-12T00:00:00.000Z"
  }
}`}</CodeBlock>
            <Table
              headers={['Status', 'Code', 'Meaning']}
              rows={[
                ['400', 'bad_request', 'Missing or invalid parameters'],
                ['401', 'unauthorized', 'Missing, invalid, or revoked API key'],
                ['404', 'not_found', 'Resource (e.g. prompt id) does not exist'],
                ['405', 'method_not_allowed', 'Wrong HTTP verb for this endpoint'],
                ['429', 'rate_limit_exceeded', 'Daily quota hit — wait until reset'],
                ['500', 'internal_error', 'Unexpected server error — retry'],
                ['502', 'analysis_failed', 'Upstream model call failed (reverse)'],
                ['503', 'internal_error', 'Service not configured / unavailable'],
              ]}
            />
          </Section>

          <Section id="endpoint-search" title="POST /api/v1/search">
            <p className="text-sm text-zinc-300 mb-4">
              Semantic search across the Promere prompt library. Returns prompts ranked by similarity.
            </p>
            <SubHeading>Parameters</SubHeading>
            <Table
              headers={['Field', 'Type', 'Required', 'Description']}
              rows={[
                ['query', 'string', 'yes', 'Natural-language search query'],
                ['limit', 'number', 'no', '1–40, default 10'],
                ['filters.category', 'string', 'no', 'Filter by primary category'],
                ['filters.model', 'string', 'no', 'Filter by source model name'],
              ]}
            />
            <SubHeading>Example request</SubHeading>
            <CodeBlock language="bash">{`curl -X POST https://promere.app/api/v1/search \\
  -H "Authorization: Bearer pk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "cinematic portrait in rain",
    "limit": 5,
    "filters": { "category": "Portrait & Headshot" }
  }'`}</CodeBlock>
            <SubHeading>Example response</SubHeading>
            <CodeBlock language="json">{`{
  "results": [
    {
      "id": "abc123",
      "prompt": "A portrait of a woman in heavy rain...",
      "model": "flux",
      "similarity": 0.82,
      "metadata": {
        "primary_category": "Portrait & Headshot",
        "sub_category": "Editorial",
        "visual_style": "cinematic",
        "lighting": "low-key, rim",
        "mood": "introspective"
      }
    }
  ],
  "total": 1,
  "query": "cinematic portrait in rain"
}`}</CodeBlock>
          </Section>

          <Section id="endpoint-reverse" title="POST /api/v1/reverse">
            <p className="text-sm text-zinc-300 mb-4">
              Analyze an image and reverse-engineer it into a structured 8-element prompt recipe.
              Send as <code className="font-mono text-xs">multipart/form-data</code> with an{' '}
              <code className="font-mono text-xs">image</code> field. Max 10MB, JPEG/PNG/WebP.
            </p>
            <SubHeading>Parameters</SubHeading>
            <Table
              headers={['Field', 'Type', 'Required', 'Description']}
              rows={[
                ['image', 'file', 'yes', 'JPEG, PNG, or WebP. Max 10MB.'],
              ]}
            />
            <SubHeading>Example request</SubHeading>
            <CodeBlock language="bash">{`curl -X POST https://promere.app/api/v1/reverse \\
  -H "Authorization: Bearer pk_your_key_here" \\
  -F "image=@/path/to/photo.jpg"`}</CodeBlock>
            <SubHeading>Example response</SubHeading>
            <CodeBlock language="json">{`{
  "elements": {
    "subject": "A woman in her late twenties wearing a wet trench coat...",
    "action_pose": "Standing still, looking up into the rain...",
    "setting": "A narrow Tokyo alleyway at night...",
    "lighting": "Low-key with strong rim light from a neon sign...",
    "composition": "Medium close-up, 85mm equivalent, shallow DOF...",
    "style": "Cinematic photorealism with film grain...",
    "mood": "Melancholic and quietly resolute",
    "technical": "Shot on Sony A7IV, 85mm f/1.4, ISO 1600"
  },
  "negative_prompt": "blurry, overexposed, distorted, watermark",
  "category": "Portrait & Headshot",
  "color_palette": ["#1a1f3a", "#d94e6e", "#f4c542", "#2c3e50", "#0a0a0f"]
}`}</CodeBlock>
          </Section>

          <Section id="endpoint-format" title="POST /api/v1/format">
            <p className="text-sm text-zinc-300 mb-4">
              Format an 8-element recipe into a model-specific prompt string. Pair with{' '}
              <code className="font-mono text-xs">/api/v1/reverse</code> to retarget any image at any supported model.
            </p>
            <SubHeading>Parameters</SubHeading>
            <Table
              headers={['Field', 'Type', 'Required', 'Description']}
              rows={[
                ['model', 'string', 'yes', 'Model id (see /api/v1/models)'],
                ['elements', 'object', 'yes', '8 string fields: subject, action_pose, setting, lighting, composition, style, mood, technical'],
                ['negative_prompt', 'string', 'no', 'Echoed back when model supports it'],
              ]}
            />
            <SubHeading>Example request</SubHeading>
            <CodeBlock language="bash">{`curl -X POST https://promere.app/api/v1/format \\
  -H "Authorization: Bearer pk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "midjourney",
    "elements": {
      "subject": "A woman in a trench coat",
      "action_pose": "Looking up into the rain",
      "setting": "Tokyo alley at night",
      "lighting": "Neon rim light, low-key",
      "composition": "Medium close-up, shallow DOF",
      "style": "Cinematic photorealism",
      "mood": "Melancholic",
      "technical": "85mm f/1.4"
    }
  }'`}</CodeBlock>
            <SubHeading>Example response</SubHeading>
            <CodeBlock language="json">{`{
  "formatted_prompt": "A woman in a trench coat, Looking up into the rain, Tokyo alley at night, Neon rim light, Cinematic photorealism, Melancholic --ar 16:9 --v 7 --s 500",
  "negative_prompt": null,
  "model": "midjourney",
  "model_info": {
    "name": "Midjourney",
    "family": "Midjourney",
    "prompt_style": "Short phrases + parameter flags",
    "ideal_length": "20–60 words",
    "supports_negative": true
  }
}`}</CodeBlock>
          </Section>

          <Section id="endpoint-models" title="GET /api/v1/models">
            <p className="text-sm text-zinc-300 mb-4">
              List all supported model IDs and their prompt-style metadata. <span className="text-zinc-500">Public — no auth required.</span>
            </p>
            <SubHeading>Example request</SubHeading>
            <CodeBlock language="bash">{`curl https://promere.app/api/v1/models`}</CodeBlock>
            <SubHeading>Currently supported</SubHeading>
            <Table
              headers={['id', 'Name', 'Family', 'Supports negative']}
              rows={MODELS.map((m) => [m.id, m.name, m.family, m.supportsNegative ? 'yes' : 'no'])}
            />
          </Section>

          <Section id="endpoint-prompts" title="GET /api/v1/prompts/{id}">
            <p className="text-sm text-zinc-300 mb-4">
              Fetch a single prompt by its <code className="font-mono text-xs">job_set_id</code>.
            </p>
            <SubHeading>Example request</SubHeading>
            <CodeBlock language="bash">{`curl https://promere.app/api/v1/prompts/abc123 \\
  -H "Authorization: Bearer pk_your_key_here"`}</CodeBlock>
            <SubHeading>Example response</SubHeading>
            <CodeBlock language="json">{`{
  "id": "abc123",
  "prompt": "A portrait of a woman in heavy rain...",
  "model": "flux",
  "thumbnail_url": "https://...",
  "dimensions": { "width": 1024, "height": 1024, "aspect_ratio": "1:1" },
  "metadata": {
    "primary_category": "Portrait & Headshot",
    "visual_style": "cinematic",
    "lighting": "low-key, rim",
    "mood": "introspective",
    "composition": "medium close-up",
    "camera_simulation": "85mm f/1.4"
  },
  "views": 1234
}`}</CodeBlock>
          </Section>

          <Section id="cors" title="CORS">
            <p className="text-sm text-zinc-300">
              All <code className="font-mono text-xs">/api/v1/*</code> routes respond to OPTIONS preflight and include:
            </p>
            <CodeBlock language="http">{`Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type`}</CodeBlock>
          </Section>
        </main>
      </div>
    </div>
  )
}

function DocsNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="text-lg font-bold text-white shrink-0">
          Pro<span className="text-sky-400">mere</span>
        </Link>
        <span className="text-zinc-700 hidden sm:block">|</span>
        <nav className="hidden sm:flex items-center gap-4 text-sm text-zinc-400 flex-1">
          <Link href="/browse"    className="hover:text-white transition-colors">Browse</Link>
          <Link href="/glossary"  className="hover:text-white transition-colors">Glossary</Link>
          <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
          <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
          <Link href="/docs/api"  className="text-white font-medium">API Docs</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <NavAuthButton />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

function Sidebar() {
  const items: Array<{ id: string; label: string }> = [
    { id: 'authentication', label: 'Authentication' },
    { id: 'rate-limits', label: 'Rate Limits' },
    { id: 'errors', label: 'Error Format' },
    { id: 'endpoint-search', label: 'POST /search' },
    { id: 'endpoint-reverse', label: 'POST /reverse' },
    { id: 'endpoint-format', label: 'POST /format' },
    { id: 'endpoint-models', label: 'GET /models' },
    { id: 'endpoint-prompts', label: 'GET /prompts/{id}' },
    { id: 'cors', label: 'CORS' },
  ]
  return (
    <aside className="hidden lg:block sticky top-20 self-start">
      <nav className="text-sm space-y-1">
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="block px-2 py-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            {i.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      {children}
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mt-5 mb-2">
      {children}
    </h3>
  )
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  return (
    <pre className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs font-mono text-zinc-200 overflow-x-auto">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">{language}</div>
      <code className="block whitespace-pre">{children}</code>
    </pre>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-zinc-300 align-top">
                  {cell.startsWith('/') || cell.match(/^[a-z_]+$/) ? (
                    <code className="font-mono text-xs text-zinc-200">{cell}</code>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
