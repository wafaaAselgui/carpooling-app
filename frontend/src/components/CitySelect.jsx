import { useState, useRef, useEffect, useMemo } from "react";

export default function CitySelect({
  placeholder,
  groupedPlaces,
  value,
  onChange,
  disabledCity,
  dotColor,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Close dropdown when tapping outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Filter Moroccan cities by typed search
  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = {};

    Object.entries(groupedPlaces).forEach(([region, places]) => {
      const matched = places.filter(
        (p) => p.name.toLowerCase().includes(term) && p.name !== disabledCity
      );
      if (matched.length > 0) {
        result[region] = matched;
      }
    });

    return result;
  }, [groupedPlaces, searchTerm, disabledCity]);

  const handleSelect = (cityName) => {
    onChange(cityName);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className="position-relative w-100" ref={containerRef}>
      {/* Input / Display Trigger */}
      <div
        className="form-control d-flex align-items-center justify-content-between py-2 cursor-pointer"
        style={{
          minHeight: "42px",
          borderRadius: "var(--radius-sm, 8px)",
          borderColor: isOpen ? "var(--color-primary, #0b7f70)" : "var(--color-border-strong, #8795a1)",
          boxShadow: isOpen ? "0 0 0 3px rgba(11, 127, 112, 0.2)" : "none",
          paddingLeft: "28px",
          position: "relative",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Status Dot */}
        <span
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: dotColor,
            pointerEvents: "none",
          }}
        />

        {/* Selected City or Placeholder */}
        <span
          className="text-truncate fw-medium"
          style={{
            color: value ? "var(--color-text-main, #14213d)" : "var(--color-text-subtle, #66737f)",
            fontSize: "0.925rem",
          }}
        >
          {value || placeholder}
        </span>

        {/* Clear & Arrow Icons */}
        <div className="d-flex align-items-center gap-1 ms-2">
          {value && (
            <button
              type="button"
              className="btn btn-sm p-0 border-0 text-muted lh-1"
              style={{ fontSize: "14px" }}
              onClick={handleClear}
              title="Clear"
            >
              &times;
            </button>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease",
              color: "var(--color-text-muted)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu (Strictly Opens Downwards) */}
      {isOpen && (
        <div
          className="position-absolute bg-white border shadow-lg rounded-3 w-100"
          style={{
            top: "calc(100% + 4px)", // Always below the input
            left: 0,
            zIndex: 1060,
            maxHeight: "300px",
            overflowY: "auto",
            borderColor: "var(--color-border, #e3e8ec)",
          }}
        >
          {/* Real-time search filter input */}
          <div className="p-2 border-bottom sticky-top bg-white">
            <input
              type="text"
              autoFocus
              className="form-control form-control-sm"
              placeholder="Search city (e.g. Casablanca, Fes)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Quick Clear Option */}
          <div
            className="px-3 py-2 small fw-semibold text-muted border-bottom cursor-pointer text-hover-teal"
            style={{ backgroundColor: "var(--color-canvas, #f7f9fa)" }}
            onClick={() => handleSelect("")}
          >
            All Morocco (Clear)
          </div>

          {/* City List Grouped by Region */}
          {Object.keys(filteredGroups).length === 0 ? (
            <div className="p-3 text-center small text-muted">No cities match "{searchTerm}"</div>
          ) : (
            Object.entries(filteredGroups).map(([region, places]) => (
              <div key={region}>
                <div
                  className="px-3 py-1 small fw-bold text-uppercase"
                  style={{
                    fontSize: "0.72rem",
                    letterSpacing: "0.04em",
                    color: "var(--color-primary-text, #096556)",
                    backgroundColor: "var(--color-surface-tint, #e9f6f4)",
                  }}
                >
                  {region}
                </div>
                {places.map((place) => {
                  const isSelected = value === place.name;
                  return (
                    <div
                      key={place.name}
                      onClick={() => handleSelect(place.name)}
                      className="px-3 py-2 small cursor-pointer d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: isSelected ? "var(--color-primary, #0b7f70)" : "transparent",
                        color: isSelected ? "#ffffff" : "var(--color-text-main, #14213d)",
                        transition: "background-color 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-surface-tint, #e9f6f4)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span>{place.name}</span>
                      {isSelected && <span>&#10003;</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}