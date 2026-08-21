import ReactMarkdown from "react-markdown";

/**
 * Renders case-study markdown (Problem / Process / Solution / Results)
 * with typography matching the Serb design system.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="max-w-prose space-y-3 text-pretty leading-relaxed text-surface-200 break-words [overflow-wrap:anywhere]">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-accent-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 pl-5 marker:text-accent-500">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-medium text-surface-0">{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-accent-500 underline underline-offset-2 transition-colors hover:text-accent-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          h3: ({ children }) => (
            <h3 className="pt-2 text-display-3 font-medium tracking-tight text-surface-0">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-500 pl-4 text-surface-300">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-surface-800 px-1.5 py-0.5 font-mono text-[0.85em] text-accent-400">
              {children}
            </code>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}