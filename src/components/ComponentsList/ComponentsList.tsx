import type { ComponentJSON } from "../../modules/componentsApi";
import ComponentCard from "../ComponentCard/ComponentCard";
import "./ComponentsList.css";

export default function ComponentsList({ components }: { components: ComponentJSON[] }) {
  return (
    <div className="container">
      {components.map((component) => (
        <ComponentCard key={component.component_id} component={component} />
      ))}
    </div>
  );
}
