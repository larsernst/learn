"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";

export interface MarkdownProps {
  source: string;
  className?: string;
}

export function Markdown({ source, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeKatex, rehypeHighlight]}
        components={{
          // Inline-Code: styled ohne Block-Overhead
          code({ node, className: cls, children, ...props }) {
            // node ist optional in V9, aber immer true für code (inline).
            const isInline = !className;
            if (isInline) {
              return (
                <code className="md-inline-code" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cls} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
