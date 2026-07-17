import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export function MessageContent({ text }: { text: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:my-3 prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-pre:bg-[oklch(0.12_0.02_265)] prose-code:before:content-none prose-code:after:content-none prose-headings:tracking-tight prose-a:text-brand-glow">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
