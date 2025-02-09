"use client";

import React, { useEffect, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Circle, Line } from "react-konva";
import { FaArrowRight, FaArrowLeft, FaCheck, FaExclamationCircle, FaPlay, FaPause, FaLightbulb } from 'react-icons/fa';

type Component = {
  id: string;
  type: "AND" | "OR" | "NOT" | "button" | "lamp";
  inputs: number;
  outputs: number;
  x: number;
  y: number;
  state?: boolean;
  logic?: (inputs: boolean[]) => boolean[];
  onClick?: (component: Component) => void;
};

type Connection = {
  from: string;
  to: string;
  fromOutput: number;
  toInput: number;
};

export default function Page() {
  const [tempConnection, setTempConnection] = useState<{ from: string; fromOutput: number } | null>(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [ inputChanged, setInputChanged ] = useState(false);

  const defaultGates = {
    AND: { type: "AND", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] && inputs[1]] },
    OR: { type: "OR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] || inputs[1]] },
    NOT: { type: "NOT", inputs: 1, outputs: 1, logic: (inputs: boolean[]) => [!inputs[0]] },
    button: {
      type: "button", inputs: 0, outputs: 1, onClick: (component: Component) => {
        console.log("Button clicked");
        setComponents((prev) => prev.map((c) => c.id === component.id ? { ...c, state: !c.state } : c))
      }
    },
    lamp: { type: "lamp", inputs: 1, outputs: 0 },
  };

  useEffect(() => {
    if (!simulationRunning) return;

    const newComponents = components.map((comp) => {
      if (comp.logic) {
        const inputs = connections
          .filter((conn) => conn.to === comp.id)
          .map((conn) => components.find((c) => c.id === conn.from)?.state || false);

        comp.state = comp.logic(inputs)[0]; // Assume logic returns a boolean value
      }
      return comp;
    });

    setComponents(newComponents);
  }, [inputChanged, simulationRunning]);

  const addComponent = (type: keyof typeof defaultGates | "button" | "lamp") => {
    const newComponent: Component = {
      id: crypto.randomUUID(),
      type: type as "AND" | "OR" | "NOT" | "button" | "lamp",
      inputs: defaultGates[type as keyof typeof defaultGates]?.inputs || 0,
      outputs: defaultGates[type as keyof typeof defaultGates]?.outputs || 0,
      x: 100,
      y: 100,
      state: type === "button" ? false : undefined,
      ...(type in defaultGates ? { logic: defaultGates[type as keyof typeof defaultGates]?.logic } : {}),
      ...(type in defaultGates ? { onClick: defaultGates[type as keyof typeof defaultGates]?.onClick } : {}),
    };
    setComponents([...components, newComponent]);
  };

  const renderComponent = (comp: Component) => {
    return (
      <Group
        key={comp.id}
        draggable
        x={comp.x}
        y={comp.y}
        onDragEnd={(e) =>
          setComponents((prev) =>
            prev.map((c) =>
              c.id === comp.id ? { ...c, x: e.target.x(), y: e.target.y() } : c
            )
          )
        }
      >
        <Group
          onClick={() => {
            if (comp.onClick) {
              console.log("Component clicked");
              setInputChanged(!inputChanged);
              comp.onClick(comp);
            }
          }}
        >
          <Rect width={80} height={50} fill={comp.state ? "green" : "white"} stroke="black" strokeWidth={2} cornerRadius={8} />
          <Text text={comp.type} fontSize={16} fill="black" align="center" width={80} height={50} verticalAlign="middle" />
        </Group>
        {Array.from({ length: comp.inputs }).map((_, i) => (
          <Circle
            key={`in-${comp.id}-${i}`}
            x={-10}
            y={(i + 1) * 15}
            radius={5}
            fill="blue"
            onClick={() => completeConnection(comp.id, i)}
          />
        ))}
        {Array.from({ length: comp.outputs }).map((_, i) => (
          <Circle
            key={`out-${comp.id}-${i}`}
            x={90}
            y={(i + 1) * 15}
            radius={5}
            fill="red"
            onClick={() => startConnection(comp.id, i)}
          />
        ))}
      </Group>
    );
  };

  const startConnection = (from: string, fromOutput: number) => {
    setTempConnection({ from, fromOutput });
  };

  const completeConnection = (to: string, toInput: number) => {
    if (tempConnection) {
      setConnections([...connections, { ...tempConnection, to, toInput }]);
      setTempConnection(null);
    } else {
      console.log("No temp connection");
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-16 bg-gray-900 bg-opacity-80 shadow-lg backdrop-blur-md text-white flex flex-col items-center py-4 space-y-3 rounded-xl">
        {[{ onClick: () => addComponent("AND"), icon: <FaArrowRight />, title: "Porte AND", color: "bg-blue-600" },
        { onClick: () => addComponent("OR"), icon: <FaArrowLeft />, title: "Porte OR", color: "bg-green-600" },
        { onClick: () => addComponent("NOT"), icon: <FaExclamationCircle />, title: "Porte NOT", color: "bg-red-600" },
        { onClick: () => addComponent("button"), icon: <FaCheck />, title: "Bouton poussoir", color: "bg-purple-600" },
        { onClick: () => addComponent("lamp"), icon: <FaLightbulb />, title: "Lampe de sortie", color: "bg-orange-600" },
        { onClick: () => setSimulationRunning(!simulationRunning), icon: simulationRunning ? <FaPause /> : <FaPlay />, title: "Simulation", color: "bg-yellow-600" }].map(({ onClick, icon, title, color }, index) => (
          <button
            key={index}
            onClick={onClick}
            className={`p-3 rounded-lg ${color} hover:brightness-110 focus:ring-2 focus:ring-white transition-all`}
            title={title}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center gap-4">
        <Stage width={800} height={500} className="border border-gray-300">
          <Layer>
            {components.map(renderComponent)}
            {connections.map((conn, index) => {
              const from = components.find((c) => c.id === conn.from);
              const to = components.find((c) => c.id === conn.to);
              if (!from || !to) return null;
              const fromX = from.x + 90;
              const fromY = from.y + (conn.fromOutput + 1) * 15;
              const toX = to.x - 10;
              const toY = to.y + (conn.toInput + 1) * 15;
              return <Line key={index} points={[fromX, fromY, toX, toY]} stroke={from.state ? "lime" : "white"} strokeWidth={2} />;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}