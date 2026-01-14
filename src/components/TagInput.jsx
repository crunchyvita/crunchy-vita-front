"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { productAPI } from "@/lib/api";

export default function TagInput({ value = [], onChange, placeholder = "Type and press Enter to add tags" }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Search tags when input changes (searches across ALL products - public/shared tags)
  useEffect(() => {
    let isCancelled = false;

    const searchTags = async () => {
      try {
        // Search tags from all products (public/shared tags)
        const res = await productAPI.searchTags(inputValue);
        
        // Don't update state if component unmounted or input changed
        if (isCancelled) return;
        
        // Handle both response formats: {success: true, data: []} or just data array
        const tags = res?.data || (Array.isArray(res) ? res : []);
        // Ensure tags is an array
        const tagsArray = Array.isArray(tags) ? tags : [];
        // Filter out tags that are already selected (case-insensitive)
        const filteredTags = tagsArray.filter(tag => 
          tag && typeof tag === 'string' && tag.trim() &&
          !value.some(selectedTag => selectedTag.toLowerCase() === tag.toLowerCase())
        );
        
        if (!isCancelled) {
          setSuggestions(filteredTags);
        }
      } catch (err) {
        // Silently handle errors - don't break the UI
        // User can still create new tags by pressing Enter
        if (!isCancelled) {
          // Only log errors that aren't network-related or 404s
          if (err?.status !== 404 && !err?.message?.includes('Network error')) {
            console.error("Failed to search tags:", err);
          }
          setSuggestions([]);
        }
      }
    };

    // Debounce search - wait 300ms after user stops typing
    const timeoutId = setTimeout(searchTags, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [inputValue, value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    // Check if tag already exists (case-insensitive)
    const tagExists = value.some(
      existingTag => existingTag.toLowerCase() === trimmedTag.toLowerCase()
    );

    if (!tagExists) {
      onChange([...value, trimmedTag]);
    }

    setInputValue("");
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (indexToRemove) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        // Select highlighted suggestion
        addTag(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        // Add new tag from input
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value.length - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
  };

  return (
    <div className="relative space-y-3" ref={containerRef}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-white/20 rounded p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={16} />
            </button>
          </span>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={value.length === 0 ? "Start typing..." : "Add another tag..."}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-5 py-3.5 text-sm font-bold text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-emerald-500 outline-none transition-all"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && (inputValue.trim() || suggestions.length > 0) && (
          <div className="absolute z-50 mt-3 w-full rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {suggestions.length > 0 ? (
              <ul className="py-2">
                {suggestions.map((tag, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSuggestionClick(tag)}
                    className={`cursor-pointer px-5 py-3 text-sm font-bold ${
                      idx === highlightedIndex
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-900 hover:bg-emerald-50 hover:text-emerald-700"
                    } transition-colors`}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            ) : inputValue.trim() ? (
              <div className="px-5 py-3 text-sm font-medium text-slate-900">
                Press Enter to create &quot;{inputValue.trim()}&quot;
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
        Type to search existing tags or create new ones. Press Enter to add.
      </p>
    </div>
  );
}
