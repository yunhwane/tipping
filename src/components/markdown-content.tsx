"use client";

import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: [
          "javascript",
          "typescript",
          "tsx",
          "jsx",
          "java",
          "python",
          "go",
          "rust",
          "html",
          "css",
          "json",
          "bash",
          "shell",
          "sql",
          "yaml",
          "markdown",
          "c",
          "cpp",
          "csharp",
          "kotlin",
          "swift",
          "ruby",
          "php",
          "dart",
          "dockerfile",
          "xml",
          "graphql",
        ],
      }),
    );
  }
  return highlighterPromise;
}

interface MarkdownContentProps {
  content: string;
}

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

// 코드 블록 존재 여부를 빠르게 판별
const HAS_CODE_BLOCK = /```\w/;

export function MarkdownContent({ content }: MarkdownContentProps) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    // 코드 블록이 있을 때만 Shiki 로드
    if (HAS_CODE_BLOCK.test(content)) {
      getHighlighter().then(setHighlighter);
    }
  }, [content]);

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:border prose-pre:bg-muted/50 prose-pre:p-0 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-img:rounded-lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className ?? "");
            const lang = match?.[1];
            const codeStr = String(children).replace(/\n$/, "");

            // Fenced code block (inside <pre>)
            if (lang && highlighter) {
              const html = highlighter.codeToHtml(codeStr, {
                lang,
                themes: { light: "github-light", dark: "github-dark" },
              });
              return (
                <div
                  className="shiki-wrapper"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }

            // Inline code or fallback before highlighter loads
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Override pre to avoid double wrapping when shiki renders
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
