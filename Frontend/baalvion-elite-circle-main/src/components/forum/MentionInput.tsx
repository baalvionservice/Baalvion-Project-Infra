import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

type User = {
  id: string;
  username: string;
};

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
}

export const MentionInput = ({ 
  value, 
  onChange, 
  placeholder, 
  rows, 
  className,
  required 
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!mentionQuery) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", `${mentionQuery}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions((data?.length || 0) > 0);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [mentionQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionQuery("");
      setShowSuggestions(false);
    }
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const newText = 
      textBeforeCursor.slice(0, mentionStart) + 
      `@${username} ` + 
      textAfterCursor;

    onChange(newText);
    setShowSuggestions(false);
    setMentionQuery("");
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex].username);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
        required={required}
      />
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute bottom-full mb-2 w-64 max-h-48 overflow-auto z-50 shadow-lg">
          <div className="p-1">
            {suggestions.map((user, idx) => (
              <button
                key={user.id}
                onClick={() => insertMention(user.username)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors ${
                  idx === selectedIndex ? "bg-accent" : ""
                }`}
              >
                @{user.username}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
