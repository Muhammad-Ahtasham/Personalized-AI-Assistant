"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote,
  Code
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertText = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      handleInput();
    }
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    title, 
    isActive = false 
  }: { 
    icon: any; 
    onClick: () => void; 
    title: string; 
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-muted transition-colors ${
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
        <ToolbarButton
          icon={Bold}
          onClick={() => execCommand('bold')}
          title="Bold"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => execCommand('italic')}
          title="Italic"
        />
        <ToolbarButton
          icon={Underline}
          onClick={() => execCommand('underline')}
          title="Underline"
        />
        
        <div className="w-px h-6 bg-border mx-2"></div>
        
        <ToolbarButton
          icon={Heading1}
          onClick={() => execCommand('formatBlock', '<h1>')}
          title="Heading 1"
        />
        <ToolbarButton
          icon={Heading2}
          onClick={() => execCommand('formatBlock', '<h2>')}
          title="Heading 2"
        />
        
        <div className="w-px h-6 bg-border mx-2"></div>
        
        <ToolbarButton
          icon={List}
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        />
        
        <div className="w-px h-6 bg-border mx-2"></div>
        
        <ToolbarButton
          icon={Quote}
          onClick={() => execCommand('formatBlock', '<blockquote>')}
          title="Quote"
        />
        <ToolbarButton
          icon={Code}
          onClick={() => insertText('`code`')}
          title="Code"
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-64 p-4 focus:outline-none ${
          isFocused ? 'bg-background' : 'bg-background'
        }`}
        style={{ 
          minHeight: '16rem',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
} 