import React, { useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface RichTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  minLength?: number;
  showCharCount?: boolean;
}

const RichTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 6,
  className,
  minLength,
  showCharCount = false,
}: RichTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Split selected text into lines and add bullets
    const lines = selectedText.split('\n');
    const bulletedLines = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
    
    const newText = value.substring(0, start) + bulletedLines + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const insertNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Split selected text into lines and add numbers
    const lines = selectedText.split('\n');
    const numberedLines = lines.map((line, index) => line.trim() ? `${index + 1}. ${line.trim()}` : line).join('\n');
    
    const newText = value.substring(0, start) + numberedLines + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const plainText = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');

    // Always prefer plain text to preserve original spacing and line breaks.
    // Only fall back to HTML conversion when there's no plain text available.
    if (plainText) {
      e.preventDefault();

      // Enrich plain text with markdown markers from HTML if available
      let textToInsert = plainText;

      if (html) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const convertToText = (element: Element | ChildNode): string => {
            let result = '';
            element.childNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                result += node.textContent;
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                const tag = el.tagName.toLowerCase();

                if (tag === 'strong' || tag === 'b') {
                  result += `**${convertToText(el)}**`;
                } else if (tag === 'em' || tag === 'i') {
                  result += `*${convertToText(el)}*`;
                } else if (tag === 'li') {
                  const parent = el.parentElement;
                  if (parent?.tagName.toLowerCase() === 'ol') {
                    const idx = Array.from(parent.children).indexOf(el) + 1;
                    result += `${idx}. ${convertToText(el)}\n`;
                  } else {
                    result += `• ${convertToText(el)}\n`;
                  }
                } else if (tag === 'br') {
                  result += '\n';
                } else if (tag === 'p' || tag === 'div' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
                  const inner = convertToText(el);
                  result += inner + '\n\n';
                } else if (tag === 'ul' || tag === 'ol') {
                  result += convertToText(el) + '\n';
                } else {
                  result += convertToText(el);
                }
              }
            });
            return result;
          };

          const richConverted = convertToText(doc.body)
            .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
            .trim();

          // Only use HTML-converted version if it contains markdown markers
          // that the plain text doesn't have; otherwise keep plain text as-is
          const hasMarkdown = /\*\*.+?\*\*|\*.+?\*|^• |^\d+\. /m.test(richConverted);
          if (hasMarkdown) {
            textToInsert = richConverted;
          }
        } catch {
          // Conversion failed, stick with plain text
        }
      }

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = value.substring(0, start) + textToInsert + value.substring(end);
        onChange(newText);

        setTimeout(() => {
          textarea.focus();
          const newCursor = start + textToInsert.length;
          textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
      }
      return;
    }
    // No plain text available — let browser default handle it
  };

  const isValidLength = !minLength || value.length >= minLength;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 p-1 border rounded-t-md bg-muted/30 border-b-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => wrapSelection('**', '**')}
          title="Bold (select text first)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => wrapSelection('*', '*')}
          title="Italic (select text first)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertBulletList}
          title="Bullet list (select lines)"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={insertNumberedList}
          title="Numbered list (select lines)"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground ml-auto mr-2">
          Select text, then click to format
        </span>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "rounded-t-none -mt-2",
          minLength && value.length > 0 && !isValidLength && "border-destructive",
          className
        )}
      />
      {showCharCount && minLength && (
        <p className={cn(
          "text-xs",
          !isValidLength ? "text-destructive" : "text-muted-foreground"
        )}>
          {value.length}/{minLength} characters
        </p>
      )}
    </div>
  );
};

export default RichTextarea;
