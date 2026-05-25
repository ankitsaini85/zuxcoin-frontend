import { useCallback, useEffect, useRef, useState } from "react";

// Debounce hook for delayed search
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Search suggestions component
export const SearchSuggestions = ({
  suggestions = [],
  loading = false,
  isOpen = false,
  onSelect = () => {},
  highlightText = "",
}) => {
  if (!isOpen || (!suggestions.length && !loading)) return null;

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.split(regex).map((part, idx) => (
      <span
        key={idx}
        className={regex.test(part) ? "search-suggestion-highlight" : ""}
      >
        {part}
      </span>
    ));
  };

  return (
    <div className="search-suggestions">
      {loading && (
        <div className="search-suggestion-item search-suggestion-loading">
          Loading suggestions...
        </div>
      )}
      {!loading && suggestions.length === 0 && (
        <div className="search-suggestion-item search-suggestion-empty">
          No results found
        </div>
      )}
      {!loading &&
        suggestions.map((suggestion) => (
          <div
            key={suggestion._id}
            className="search-suggestion-item"
            onClick={() => onSelect(suggestion)}
          >
            <div className="search-suggestion-content">
              <div className="search-suggestion-name">
                {highlightMatch(suggestion.name || "Unnamed", highlightText)}
              </div>
              <div className="search-suggestion-meta">
                {suggestion.email && (
                  <span className="search-suggestion-email">
                    {highlightMatch(suggestion.email, highlightText)}
                  </span>
                )}
                {suggestion.referralCode && (
                  <span className="search-suggestion-code">
                    {highlightMatch(suggestion.referralCode, highlightText)}
                  </span>
                )}
              </div>
            </div>
            <div className={`search-suggestion-status ${suggestion.isActivated ? "active" : "inactive"}`}>
              {suggestion.isActivated ? "●" : "○"}
            </div>
          </div>
        ))}
    </div>
  );
};

export default SearchSuggestions;
