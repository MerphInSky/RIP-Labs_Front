import type { FormEvent } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./ComponentFilterBar.css";

interface ComponentFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export default function ComponentFilterBar({ query, onQueryChange, onSearch }: ComponentFilterBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="component-filter-bar">
      <Form onSubmit={handleSubmit} className="search-form component-filter-bar__form">
        <Form.Control
          type="text"
          name="query"
          className="search-input"
          placeholder="Поиск компонентов..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <Button type="submit" className="search-btn">
          Найти
        </Button>
      </Form>
    </div>
  );
}
