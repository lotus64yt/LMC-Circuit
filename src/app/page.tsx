"use client";

import React, { useState } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";

type LogicGate = {
  id: string;
  type: "AND" | "OR" | "NOT";
  x: number;
  y: number;
};

export default function Page() {  
  const [gates, setGates] = useState<LogicGate[]>([]);

  const addGate = (type: LogicGate["type"]) => {
    const newGate: LogicGate = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 100,
    };
    setGates([...gates, newGate]);
  };

  const updateGatePosition = (id: string, x: number, y: number) => {
    setGates((prevGates) =>
      prevGates.map((gate) => (gate.id === id ? { ...gate, x, y } : gate))
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Boutons d'ajout */}
      <div className="flex gap-2">
        <button onClick={() => addGate("AND")} className="p-2 bg-blue-500 text-white rounded">
          Ajouter AND
        </button>
        <button onClick={() => addGate("OR")} className="p-2 bg-green-500 text-white rounded">
          Ajouter OR
        </button>
        <button onClick={() => addGate("NOT")} className="p-2 bg-red-500 text-white rounded">
          Ajouter NOT
        </button>
      </div>

      {/* Canvas du circuit */}
      <Stage width={800} height={500} className="border border-gray-300">
        <Layer>
          {gates.map((gate) => (
            <Group
              key={gate.id}
              draggable
              x={gate.x}
              y={gate.y}
              onDragEnd={(e) => updateGatePosition(gate.id, e.target.x(), e.target.y())}
            >
              <Rect width={60} height={40} fill="white" stroke="black" strokeWidth={2} cornerRadius={8} />
              <Text text={gate.type} fontSize={16} fill="black" align="center" width={60} height={40} verticalAlign="middle"/>
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};