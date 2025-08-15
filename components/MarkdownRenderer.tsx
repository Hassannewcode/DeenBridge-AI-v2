import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
}

// Configure marked
marked.use({
  breaks: true, // render single line breaks as <br>
  gfm: true, // use GitHub Flavored Markdown
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
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
