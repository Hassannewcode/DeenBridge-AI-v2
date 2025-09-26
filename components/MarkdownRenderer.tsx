import React, { useMemo, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Make hljs globally available to TypeScript
declare const hljs: any;

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  
  useEffect(() => {
    // Configure marked once globally or on component mount
    marked.use({
      breaks: true,
      gfm: true,
      highlight: (code, lang) => {
        if (typeof hljs !== 'undefined') {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
        return code; // Fallback if hljs is not available
      },
    });
  }, []);
  
  const sanitizedHtml = useMemo(() => {
    const renderer = new marked.Renderer();
    // Make links open in a new tab securely
    renderer.link = (href, title, text) => {
        return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;
    };

    const rawHtml = marked.parse(content || '', { renderer }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default MarkdownRenderer;