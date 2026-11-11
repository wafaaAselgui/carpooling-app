import { useState } from "react";
import { Row, Col, Form, Card, Button, Collapse, Badge } from "react-bootstrap";
import CitySelect from "./CitySelect";

export default function SearchFilters({
  groupedPlaces,
  selectedDepCity,
  setSelectedDepCity,
  selectedDestCity,
  setSelectedDestCity,
  filters,
  setFilters,
  onReset,
}) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filters.date, filters.seats, filters.max_price].filter(Boolean).length;

  const handleSwapCities = () => {
    const temp = selectedDepCity;
    setSelectedDepCity(selectedDestCity);
    setSelectedDestCity(temp);
  };

  return (
    <Card className="mb-3 shadow-sm border-0" style={{ borderRadius: "var(--radius-md)" }}>
      <Card.Body className="p-2 p-md-3">
        {/* Core Route Bar: Origin, Swap, Destination, Filter Toggle */}
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2">
          
          {/* Departure City */}
          <div className="flex-grow-1">
            <CitySelect
              placeholder="Origin (All Morocco)"
              groupedPlaces={groupedPlaces}
              value={selectedDepCity}
              onChange={setSelectedDepCity}
              disabledCity={selectedDestCity}
              dotColor="var(--color-primary)"
            />
          </div>

          {/* Swap Button (Horizontal on Desktop, Vertical on Mobile) */}
          <div className="d-flex justify-content-center">
            <Button
              type="button"
              variant="light"
              size="sm"
              onClick={handleSwapCities}
              disabled={!selectedDepCity && !selectedDestCity}
              className="border p-2 rounded-circle d-flex align-items-center justify-content-center shadow-none"
              style={{ width: "36px", height: "36px" }}
              title="Swap Origin and Destination"
            >
              {/* Desktop horizontal icon */}
              <svg
                className="d-none d-md-block"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4" />
              </svg>

              {/* Mobile vertical icon */}
              <svg
                className="d-block d-md-none"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </Button>
          </div>

          {/* Destination City */}
          <div className="flex-grow-1">
            <CitySelect
              placeholder="Destination (All Morocco)"
              groupedPlaces={groupedPlaces}
              value={selectedDestCity}
              onChange={setSelectedDestCity}
              disabledCity={selectedDepCity}
              dotColor="var(--color-danger)"
            />
          </div>

          {/* Secondary Filters Toggle */}
          <div className="d-flex gap-2">
            <Button
              type="button"
              variant={showFilters || activeFilterCount > 0 ? "outline-primary" : "outline-secondary"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="py-2 px-3 d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 flex-md-grow-0 fw-medium"
              style={{ whiteSpace: "nowrap" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge bg="primary" pill className="ms-1" style={{ fontSize: "10px" }}>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Clear All Button */}
            {(selectedDepCity || selectedDestCity || activeFilterCount > 0) && (
              <Button
                type="button"
                variant="light"
                size="sm"
                onClick={onReset}
                className="text-muted border px-2 d-flex align-items-center"
                title="Clear all"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Secondary Filter Tray */}
        <Collapse in={showFilters}>
          <div className="pt-3 mt-2 border-top">
            <Row className="g-2 g-md-3">
              <Col xs={6} md={4}>
                <Form.Label className="small fw-semibold text-muted mb-1">Date</Form.Label>
                <Form.Control
                  size="sm"
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
              </Col>

              <Col xs={6} md={4}>
                <Form.Label className="small fw-semibold text-muted mb-1">Seats</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.seats}
                  onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
                >
                  <option value="">Any</option>
                  <option value="1">1 seat</option>
                  <option value="2">2 seats</option>
                  <option value="3">3+ seats</option>
                </Form.Select>
              </Col>

              <Col xs={12} md={4}>
                <Form.Label className="small fw-semibold text-muted mb-1">
                  Max Price {filters.max_price ? `(${filters.max_price} MAD)` : "(MAD)"}
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  min="0"
                  placeholder="e.g. 120"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                />
              </Col>
            </Row>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
}