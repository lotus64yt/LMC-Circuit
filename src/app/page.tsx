"use client";

import React, { useState } from "react";
import { Stage, Layer, Rect, Text, Group, Circle, Line } from "react-konva";

// Définition d'un module logique générique
type LogicGate = {
  id: string;
  name: string;
  inputs: number;
  outputs: number;
  x: number;
  y: number;
  logic: (inputs: boolean[]) => boolean[];
};

// Définition d'une connexion entre modules
type Connection = {
  fromGate: string;
  fromOutput: number;
  toGate: string;
  toInput: number;
};

// Liste des modules logiques pré-définis
const defaultGates = {
  AND: {
    name: "AND",
    inputs: 2,
    outputs: 1,
    logic: (inputs: boolean[]) => [inputs[0] && inputs[1]],
  },
  OR: {
    name: "OR",
    inputs: 2,
    outputs: 1,
    logic: (inputs: boolean[]) => [inputs[0] || inputs[1]],
  },
  NOT: {
    name: "NOT",
    inputs: 1,
    outputs: 1,
    logic: (inputs: boolean[]) => [!inputs[0]],
  },
};

export default function Page() {
  const [gates, setGates] = useState<LogicGate[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [tempConnection, setTempConnection] = useState<{ fromGate: string; fromOutput: number; x: number; y: number } | null>(null);

  const addGate = (type: keyof typeof defaultGates) => {
    const newGate: LogicGate = {
      id: crypto.randomUUID(),
      ...defaultGates[type],
      x: 100,
      y: 100,
    };
    setGates([...gates, newGate]);
  };

  const GRID_SIZE = 10;
  const updateGatePosition = (id: string, x: number, y: number) => {
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    setGates((prevGates) =>
      prevGates.map((gate) => (gate.id === id ? { ...gate, x: snappedX, y: snappedY } : gate))
    );
  };

  const startConnection = (fromGate: string, fromOutput: number, x: number, y: number) => {
    setTempConnection({ fromGate, fromOutput, x, y });
  };

  const completeConnection = (toGate: string, toInput: number) => {
    if (tempConnection) {
      setConnections([...connections, { ...tempConnection, toGate, toInput }]);
      setTempConnection(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
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

      <Stage width={800} height={500} className="border border-gray-300">
        <Layer>
          {/* Dessin des connexions */}
          {connections.map((conn, index) => {
            const fromGate = gates.find((g) => g.id === conn.fromGate);
            const toGate = gates.find((g) => g.id === conn.toGate);
            if (!fromGate || !toGate) return null;
            const fromX = fromGate.x + 90;
            const fromY = fromGate.y + (conn.fromOutput + 1) * 15;
            const toX = toGate.x - 10;
            const toY = toGate.y + (conn.toInput + 1) * 15;
            return <Line key={index} points={[fromX, fromY, toX, toY]} stroke="white" strokeWidth={2} />;
          })}

          {gates.map((gate) => (
            <Group
              key={gate.id}
              draggable
              x={gate.x}
              y={gate.y}
              onDragEnd={(e) => updateGatePosition(gate.id, e.target.x(), e.target.y())}
            >
              <Rect width={80} height={50} fill="white" stroke="black" strokeWidth={2} cornerRadius={8} />
              <Text text={gate.name} fontSize={16} fill="black" align="center" width={80} height={50} verticalAlign="middle" />

              {/* Entrées */}
              {Array.from({ length: gate.inputs }).map((_, i) => (
                <Circle
                  key={`in-${gate.id}-${i}`}
                  x={-10}
                  y={(i + 1) * 15}
                  radius={5}
                  fill="blue"
                  onClick={() => completeConnection(gate.id, i)}
                />
              ))}

              {/* Sorties */}
              {Array.from({ length: gate.outputs }).map((_, i) => (
                <Circle
                  key={`out-${gate.id}-${i}`}
                  x={90}
                  y={(i + 1) * 15}
                  radius={5}
                  fill="red"
                  onClick={() => startConnection(gate.id, i, gate.x + 90, gate.y + (i + 1) * 15)}
                />
              ))}
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}