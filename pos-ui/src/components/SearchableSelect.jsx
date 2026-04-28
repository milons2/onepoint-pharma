import { useState } from "react";
import { Search } from "lucide-react";
import "../styles/searchable-select.css";

function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  maxVisible = 5
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  const rowHeight = 42; // px per option
  const maxHeight = maxVisible * rowHeight;

  return (
    <div className="searchable-select">
      <label>{label}</label>

      <div
        className="select-box"
        onClick={() => setOpen(prev => !prev)}
      >
        {options.find(o => o.id == value)?.name || placeholder}
      </div>

      {open && (
        <div className="dropdown">
          {/* SEARCH INPUT */}
          <div className="search-input-wrapper">
            <Search size={14} className="search-inside" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* OPTIONS */}
          <div
            className="options"
            style={{ maxHeight }}
          >
            {filtered.length === 0 && (
              <div className="no-result">No result found</div>
            )}

            {filtered.map(opt => (
              <div
                key={opt.id}
                className="option"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {opt.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
