import { Component, Connection } from "@/app/page";
import { connectionStyles } from "@/data/connections";

export function loadCircuit(file: File): Promise<{
  components: Component[];
  connections: Connection[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return reject("File read error");
      const corruptedData = e.target.result as string;
      const cleanedData = corruptedData.replace(/(.)./g, "$1");
      const decodedData = atob(cleanedData);
      let parsedData;
      try {
        parsedData = JSON.parse(decodedData, (_, value) =>
          typeof value === "string" && value.startsWith("function")
            ? eval(value.replace("function", ""))
            : value
        );
      } catch {
        return reject("Invalid JSON data");
      }
      const idMap = new Map();

      parsedData.components.forEach((component: Component) => {
        idMap.set(component.id, crypto.randomUUID());
      });

      const newComponents = parsedData.components.map((component: Component) => ({
        ...component,
        id: idMap.get(component.id),
        x: component.x + 10,
        y: component.y + 10,
        state: Array.isArray(component.state) ? component.state : [],
      }));

      const newConnections = parsedData.connections.map(
        (connection: Connection) => ({
          ...connection,
          from: idMap.get(connection.from) || connection.from,
          to: idMap.get(connection.to) || connection.to,
          style: connectionStyles.map(e => e.value).includes(connection.style) ? connection.style : "curve",
        })
      );

      resolve({ components: newComponents, connections: newConnections });
    };
    reader.onerror = () => reject("File read error");
    reader.readAsText(file);
  });
}
