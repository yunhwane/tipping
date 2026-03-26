"use client";

import { useRef, useCallback, useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { MarkdownContent } from "~/components/markdown-content";
import {
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  FileText,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { uploadImage } from "~/lib/supabase/storage";
import { useAuth } from "~/hooks/use-auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  label?: string;
  bucket?: "tips" | "projects";
}

type ToolbarAction = {
  icon: React.ReactNode;
  title: string;
  action: (
    text: string,
    selStart: number,
    selEnd: number,
  ) => { text: string; cursorStart: number; cursorEnd: number };
};

function wrapSelection(
  text: string,
  selStart: number,
  selEnd: number,
  before: string,
  after: string,
) {
  const selected = text.slice(selStart, selEnd);
  const newText =
    text.slice(0, selStart) + before + selected + after + text.slice(selEnd);
  return {
    text: newText,
    cursorStart: selStart + before.length,
    cursorEnd: selEnd + before.length,
  };
}

function insertAtCursor(
  text: string,
  selStart: number,
  insert: string,
  cursorOffset: number,
) {
  const newText = text.slice(0, selStart) + insert + text.slice(selStart);
  return {
    text: newText,
    cursorStart: selStart + cursorOffset,
    cursorEnd: selStart + cursorOffset,
  };
}

const toolbarActions: ToolbarAction[] = [
  {
    icon: <Bold className="h-3.5 w-3.5" />,
    title: "굵게 (Ctrl+B)",
    action: (text, s, e) =>
      s === e
        ? insertAtCursor(text, s, "**텍스트**", 2)
        : wrapSelection(text, s, e, "**", "**"),
  },
  {
    icon: <Italic className="h-3.5 w-3.5" />,
    title: "기울임 (Ctrl+I)",
    action: (text, s, e) =>
      s === e
        ? insertAtCursor(text, s, "*텍스트*", 1)
        : wrapSelection(text, s, e, "*", "*"),
  },
  {
    icon: <Code className="h-3.5 w-3.5" />,
    title: "코드",
    action: (text, s, e) => {
      const selected = text.slice(s, e);
      if (selected.includes("\n")) {
        return wrapSelection(text, s, e, "```\n", "\n```");
      }
      return s === e
        ? insertAtCursor(text, s, "`코드`", 1)
        : wrapSelection(text, s, e, "`", "`");
    },
  },
  {
    icon: <Link className="h-3.5 w-3.5" />,
    title: "링크",
    action: (text, s, e) => {
      if (s === e) {
        return insertAtCursor(text, s, "[링크 텍스트](url)", 1);
      }
      const selected = text.slice(s, e);
      const newText =
        text.slice(0, s) + `[${selected}](url)` + text.slice(e);
      return {
        text: newText,
        cursorStart: s + selected.length + 3,
        cursorEnd: s + selected.length + 6,
      };
    },
  },
  {
    icon: <List className="h-3.5 w-3.5" />,
    title: "목록",
    action: (text, s, _e) => insertAtCursor(text, s, "- ", 2),
  },
  {
    icon: <ListOrdered className="h-3.5 w-3.5" />,
    title: "번호 목록",
    action: (text, s, _e) => insertAtCursor(text, s, "1. ", 3),
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "마크다운으로 작성하세요...",
  rows = 18,
  required = false,
  label = "내용",
  bucket = "tips",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [activeTab, setActiveTab] = useState("write");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!user?.id) return;
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("이미지 파일만 업로드할 수 있습니다. (JPEG, PNG, GIF, WebP)");
        return;
      }
      if (file.size > MAX_SIZE) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      const textarea = textareaRef.current;
      const cursorPos = textarea?.selectionStart ?? value.length;
      const placeholder = `![업로드 중...]()`;

      // Insert placeholder at cursor
      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);
      onChange(before + placeholder + after);

      setIsUploading(true);
      try {
        const url = await uploadImage(bucket, user.id, file);
        onChange(valueRef.current.replace(placeholder, `![image](${url})`));
      } catch {
        onChange(valueRef.current.replace(placeholder, ""));
        alert("이미지 업로드에 실패했습니다.");
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id, value, onChange, bucket],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (imageFile) {
        e.preventDefault();
        void handleImageUpload(imageFile);
      }
    },
    [handleImageUpload],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) void handleImageUpload(file);
      }
    },
    [handleImageUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleImageUpload(file);
      e.target.value = "";
    },
    [handleImageUpload],
  );

  const handleToolbarAction = useCallback(
    (action: ToolbarAction["action"]) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;
      const result = action(value, selectionStart, selectionEnd);

      onChange(result.text);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(result.cursorStart, result.cursorEnd);
      });
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "b") {
          e.preventDefault();
          handleToolbarAction(toolbarActions[0]!.action);
        } else if (e.key === "i") {
          e.preventDefault();
          handleToolbarAction(toolbarActions[1]!.action);
        }
      }
    },
    [handleToolbarAction],
  );

  return (
    <div className="rounded-2xl border bg-card shadow-sm shadow-black/5 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {label}
          </label>
          <TabsList>
            <TabsTrigger value="write">작성</TabsTrigger>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
          </TabsList>
        </div>

        {/* 마크다운 툴바 — 작성 탭에서만 표시 */}
        {activeTab === "write" && (
          <div className="flex items-center gap-0.5 border-b px-5 py-1.5">
            {toolbarActions.map((item, i) => (
              <button
                key={i}
                type="button"
                title={item.title}
                onClick={() => handleToolbarAction(item.action)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.icon}
              </button>
            ))}
            <div className="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              title="이미지 업로드"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        <div className="p-5">
          <TabsContent value="write" className="mt-0">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onPaste={handlePaste}
              rows={rows}
              className="font-mono text-sm border-0 shadow-none focus-visible:ring-0 p-0 resize-none"
              required={required}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <div className="min-h-[400px]">
              {value ? (
                <MarkdownContent content={value} />
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                  <span className="text-sm text-muted-foreground">
                    미리보기할 내용이 없습니다
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
