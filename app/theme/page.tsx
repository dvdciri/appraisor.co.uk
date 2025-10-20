import React from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-fg-muted tracking-wide uppercase">{title}</h3>
      <div className="bg-bg-elevated border border-border rounded-lg p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-bg-subtle border border-border rounded-md p-3 text-sm overflow-x-auto">
      <code className="text-fg-primary">{children}</code>
    </pre>
  );
}

export default function ThemePage() {
  return (
    <main className="min-h-screen w-full bg-bg-app text-fg-primary">
      <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">Nebula Theme Reference</h1>
          <p className="text-fg-muted text-lg">
            A comprehensive guide to using the Nebula dark theme across your application.
          </p>
        </header>

        {/* Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-bg-app border border-border rounded-md"></div>
              <div className="text-xs">
                <div className="font-mono">bg-app</div>
                <div className="text-fg-muted">Primary background</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-bg-elevated border border-border rounded-md"></div>
              <div className="text-xs">
                <div className="font-mono">bg-elevated</div>
                <div className="text-fg-muted">Cards, modals</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-bg-subtle border border-border rounded-md"></div>
              <div className="text-xs">
                <div className="font-mono">bg-subtle</div>
                <div className="text-fg-muted">Inputs, badges</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent border border-border rounded-md"></div>
              <div className="text-xs">
                <div className="font-mono">bg-accent</div>
                <div className="text-fg-muted">Primary actions</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-fg-muted">Headings</h4>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Heading 1</h1>
                <h2 className="text-xl font-semibold">Heading 2</h2>
                <h3 className="text-lg font-semibold">Heading 3</h3>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-fg-muted">Text Variants</h4>
              <div className="space-y-1">
                <p className="text-fg-primary">Primary text - main content</p>
                <p className="text-fg-muted">Muted text - secondary information</p>
                <a href="#" className="text-accent hover:underline">Accent link</a>
                <code className="bg-bg-subtle px-2 py-1 rounded text-sm">inline code</code>
              </div>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-md bg-accent text-accent-fg hover:opacity-90 focus:outline-none focus:shadow-focus">
                Primary
              </button>
              <button className="px-4 py-2 rounded-md border border-border hover:bg-bg-subtle focus:outline-none focus:shadow-focus">
                Outline
              </button>
              <button className="px-4 py-2 rounded-md hover:bg-bg-subtle/60 focus:outline-none focus:shadow-focus">
                Ghost
              </button>
              <button className="px-4 py-2 rounded-md bg-accent/40 text-accent-fg/50 cursor-not-allowed opacity-60" disabled>
                Disabled
              </button>
            </div>
            <CodeBlock>{`<button className="px-4 py-2 rounded-md bg-accent text-accent-fg hover:opacity-90 focus:outline-none focus:shadow-focus">
  Primary Button
</button>`}</CodeBlock>
          </div>
        </Section>

        {/* Form Elements */}
        <Section title="Form Elements">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Text Input</label>
                <input 
                  className="w-full bg-bg-subtle border border-border rounded-md px-3 py-2 focus:outline-none focus:shadow-focus" 
                  placeholder="Enter text..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select</label>
                <select className="w-full bg-bg-subtle border border-border rounded-md px-3 py-2 focus:outline-none focus:shadow-focus">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
            <CodeBlock>{`<input className="w-full bg-bg-subtle border border-border rounded-md px-3 py-2 focus:outline-none focus:shadow-focus" />`}</CodeBlock>
          </div>
        </Section>

        {/* Cards & Surfaces */}
        <Section title="Cards & Surfaces">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-bg-elevated p-4">
              <h4 className="font-semibold mb-2">Basic Card</h4>
              <p className="text-fg-muted text-sm">Card content goes here</p>
            </div>
            <div className="rounded-lg border border-border bg-gradient-to-br from-bg-subtle to-bg-elevated p-4">
              <h4 className="font-semibold mb-2">Gradient Card</h4>
              <p className="text-fg-muted text-sm">With subtle gradient background</p>
            </div>
          </div>
          <CodeBlock>{`<div className="rounded-lg border border-border bg-bg-elevated p-4">
  <h4 className="font-semibold mb-2">Card Title</h4>
  <p className="text-fg-muted text-sm">Card content</p>
</div>`}</CodeBlock>
        </Section>

        {/* Status Colors */}
        <Section title="Status Colors">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded bg-success/15 text-success border border-success/30 px-3 py-1 text-sm">
                Success
              </span>
              <span className="inline-flex items-center rounded bg-warning/15 text-warning border border-warning/30 px-3 py-1 text-sm">
                Warning
              </span>
              <span className="inline-flex items-center rounded bg-danger/15 text-danger border border-danger/30 px-3 py-1 text-sm">
                Error
              </span>
            </div>
            <CodeBlock>{`<span className="bg-success/15 text-success border border-success/30 px-3 py-1 rounded">
  Success Message
</span>`}</CodeBlock>
          </div>
        </Section>

        {/* Dialogs */}
        <Section title="Dialogs">
          <div className="space-y-4">
            <div className="relative rounded-lg border border-border bg-bg-elevated p-4">
              <p className="text-sm text-fg-muted mb-3">Modal (static preview)</p>
              {/* Overlay preview */}
              <div className="relative h-72 rounded-lg overflow-hidden border border-border">
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-xl border border-border bg-bg-subtle shadow-xl">
                    <div className="p-4 border-b border-border">
                      <h4 className="font-semibold">Delete item</h4>
                      <p className="text-sm text-fg-muted mt-1">This action cannot be undone.</p>
                    </div>
                    <div className="p-4 flex items-center justify-end gap-2">
                      <button className="px-3 py-2 rounded-md hover:bg-bg-elevated focus:outline-none focus:shadow-focus">Cancel</button>
                      <button className="px-3 py-2 rounded-md bg-danger text-fg-inverted hover:opacity-90 focus:outline-none focus:shadow-focus">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CodeBlock>{`<div className="fixed inset-0 bg-black/60" />
<div className="fixed inset-0 flex items-center justify-center p-4">
  <div className="w-full max-w-md rounded-xl border border-border bg-bg-subtle">
    <div className="p-4 border-b border-border">
      <h4 className="font-semibold">Dialog title</h4>
      <p className="text-sm text-fg-muted">Dialog description.</p>
    </div>
    <div className="p-4 flex justify-end gap-2">
      <button className="px-3 py-2 rounded-md hover:bg-bg-elevated">Cancel</button>
      <button className="px-3 py-2 rounded-md bg-accent text-accent-fg">Action</button>
    </div>
  </div>
</div>`}</CodeBlock>
          </div>
        </Section>

        {/* Status Bars */}
        <Section title="Status Bars">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="rounded-md border border-border bg-bg-elevated p-3">
                <div className="rounded-md border border-success/30 bg-success/15 text-sm px-3 py-2 text-success">
                  Deployed successfully. All systems operational.
                </div>
              </div>
              <div className="rounded-md border border-border bg-bg-elevated p-3">
                <div className="rounded-md border border-warning/30 bg-warning/15 text-sm px-3 py-2 text-warning">
                  Degraded performance detected. Investigating.
                </div>
              </div>
              <div className="rounded-md border border-border bg-bg-elevated p-3">
                <div className="rounded-md border border-danger/30 bg-danger/15 text-sm px-3 py-2 text-danger">
                  Outage in EU-West. Mitigation in progress.
                </div>
              </div>
              <div className="rounded-md border border-border bg-bg-elevated p-3">
                <div className="rounded-md border border-border bg-bg-subtle text-sm px-3 py-2 text-fg-primary">
                  Informational notice with neutral styling.
                </div>
              </div>
            </div>
            <CodeBlock>{`<div className="rounded-md border border-success/30 bg-success/15 text-sm px-3 py-2 text-success">
  Success status bar message
</div>`}</CodeBlock>
          </div>
        </Section>

        {/* Media List */}
        <Section title="List with Images">
          <div className="space-y-3">
            <div className="rounded-lg border border-border overflow-hidden">
              <ul className="divide-y divide-border/60">
                {[1,2,3].map((i) => (
                  <li key={i} className="flex items-center gap-4 p-3 hover:bg-bg-subtle/50">
                    <div className="h-12 w-12 rounded-md bg-gradient-to-br from-accent/30 to-bg-subtle border border-border flex items-center justify-center text-xs text-fg-muted">
                      {i}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">List item title {i}</p>
                      <p className="text-sm text-fg-muted truncate">Supporting description for the list item goes here.</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-md border border-border hover:bg-bg-elevated text-sm">Action</button>
                  </li>
                ))}
              </ul>
            </div>
            <CodeBlock>{`<li className=\"flex items-center gap-4 p-3 hover:bg-bg-subtle/50\">\n  <div className=\"h-12 w-12 rounded-md bg-gradient-to-br from-accent/30 to-bg-subtle border border-border\" />\n  <div className=\"min-w-0 flex-1\">\n    <p className=\"font-medium truncate\">Title</p>\n    <p className=\"text-sm text-fg-muted truncate\">Description</p>\n  </div>\n  <button className=\"px-3 py-1.5 rounded-md border border-border\">Action</button>\n</li>`}</CodeBlock>
          </div>
        </Section>

        {/* Tabs */}
        <Section title="Tabs">
          <div className="space-y-4">
            <div className="border-b border-border">
              <nav className="-mb-px flex gap-4" aria-label="Tabs">
                <a className="px-1 pb-2 text-sm font-medium border-b-2 border-accent text-fg-primary" href="#">Overview</a>
                <a className="px-1 pb-2 text-sm font-medium border-b-2 border-transparent text-fg-muted hover:text-fg-primary hover:border-border" href="#">Details</a>
                <a className="px-1 pb-2 text-sm font-medium border-b-2 border-transparent text-fg-muted hover:text-fg-primary hover:border-border" href="#">Activity</a>
              </nav>
            </div>
            <div className="rounded-lg border border-border bg-bg-elevated p-4">
              <p className="text-sm text-fg-muted">Tab content preview (static example).</p>
            </div>
            <CodeBlock>{`<nav className=\"-mb-px flex gap-4\">\n  <a className=\"px-1 pb-2 text-sm font-medium border-b-2 border-accent\">Active</a>\n  <a className=\"px-1 pb-2 text-sm font-medium border-b-2 border-transparent text-fg-muted hover:border-border\">Tab</a>\n</nav>`}</CodeBlock>
          </div>
        </Section>

        {/* Data Tables */}
        <Section title="Data Tables">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/60">
                  <td className="px-3 py-2">John Doe</td>
                  <td className="px-3 py-2"><span className="text-success">Active</span></td>
                  <td className="px-3 py-2 text-fg-muted">Admin</td>
                </tr>
                <tr className="border-t border-border/60">
                  <td className="px-3 py-2">Jane Smith</td>
                  <td className="px-3 py-2"><span className="text-warning">Pending</span></td>
                  <td className="px-3 py-2 text-fg-muted">User</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock>{`<table className="w-full text-sm">
  <thead className="bg-bg-subtle">
    <tr>
      <th className="text-left px-3 py-2 font-medium">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-t border-border/60">
      <td className="px-3 py-2">Content</td>
    </tr>
  </tbody>
</table>`}</CodeBlock>
        </Section>

        {/* Available Classes */}
        <Section title="Available Tailwind Classes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Backgrounds</h4>
              <ul className="space-y-1 text-sm font-mono">
                <li>bg-app</li>
                <li>bg-elevated</li>
                <li>bg-subtle</li>
                <li>bg-accent</li>
                <li>bg-muted</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Text Colors</h4>
              <ul className="space-y-1 text-sm font-mono">
                <li>text-fg-primary</li>
                <li>text-fg-muted</li>
                <li>text-fg-inverted</li>
                <li>text-accent</li>
                <li>text-accent-fg</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Borders & Focus</h4>
              <ul className="space-y-1 text-sm font-mono">
                <li>border-border</li>
                <li>ring-ring</li>
                <li>focus:shadow-focus</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Status Colors</h4>
              <ul className="space-y-1 text-sm font-mono">
                <li>text-success</li>
                <li>text-warning</li>
                <li>text-danger</li>
                <li>bg-success/15</li>
                <li>bg-warning/15</li>
                <li>bg-danger/15</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* CSS Variables */}
        <Section title="CSS Variables Reference">
          <div className="space-y-4">
            <p className="text-fg-muted text-sm">
              All theme colors are available as CSS variables for custom styling:
            </p>
            <CodeBlock>{`/* Available CSS Variables */
--bg-app: #0a0d12;
--bg-elevated: #111624;
--bg-subtle: #0d1220;
--fg-primary: #e8ecf7;
--fg-muted: #9aa6bf;
--fg-inverted: #0a0d12;
--border: #1a2440;
--ring: #22d3ee;
--accent: #8b5cf6;
--accent-foreground: #0a0d12;
--success: #34d399;
--warning: #fbbf24;
--danger: #f87171;
--muted: #0c1324;
--shadow-color: 0 10px 30px rgba(0, 0, 0, 0.45);`}</CodeBlock>
          </div>
        </Section>
      </div>
    </main>
  );
}
