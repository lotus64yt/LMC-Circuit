"use client";

import React, { useEffect, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Circle, Line, Path } from "react-konva";
import { FaCheck, FaPlay, FaPause, FaLightbulb, FaArrowRight } from 'react-icons/fa';
import { GiLogicGateAnd, GiLogicGateNand, GiLogicGateNor, GiLogicGateNot, GiLogicGateNxor, GiLogicGateOr, GiLogicGateXor } from "react-icons/gi";

type Component = {
  id: string;
  type: "AND" | "OR" | "NOT" | "Button" | "Lamp" | string;
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
  const [inputChanged, setInputChanged] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState<string | boolean | null>(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [editComponent, setEditComponent] = useState<Component | null>(null);

  const defaultGates = {
    AND: { type: "AND", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] && inputs[1]] },
    OR: { type: "OR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] || inputs[1]] },
    NOT: { type: "NOT", inputs: 1, outputs: 1, logic: (inputs: boolean[]) => [!inputs[0]] },
    XOR: { type: "XOR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] !== inputs[1]] },
    NAND: { type: "NAND", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [!(inputs[0] && inputs[1]) ? 1 : 0] },
    NOR: { type: "NOR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [!(inputs[0] || inputs[1])] },
    XNOR: { type: "XNOR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] === inputs[1]] },
    Button: {
      type: "Button", inputs: 0, outputs: 1, onClick: (component: Component) => {
        setComponents((prev) => prev.map((c) => c.id === component.id ? { ...c, state: !c.state } : c))
      }
    },
    Lamp: { type: "Lamp", inputs: 1, outputs: 0 },
  };

  useEffect(() => {
    if (!simulationRunning) return;

    const newComponents = components.map((comp) => {
      if (comp.logic || comp.type === "Button") {
        const inputs = connections
          .filter((conn) => conn.to === comp.id)
          .map((conn) => components.find((c) => c.id === conn.from)?.state || false);

        if (comp.logic) {
          comp.state = comp.logic(inputs)[0];
        } else if (comp.type === "Button") {
          comp.state = comp.state;
        }
        if (comp.state) {
          connections
            .filter((conn) => conn.from === comp.id)
            .forEach((conn) => {
              const to = components.find((c) => c.id === conn.to);
              if (to) {
                to.state = true;
              }
            });
        } else {
          connections
            .filter((conn) => conn.from === comp.id)
            .forEach((conn) => {
              const to = components.find((c) => c.id === conn.to);
              if (to) {
                to.state = false;
              }
            });
        }
      }

      return comp;
    });

    setComponents(newComponents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputChanged, simulationRunning]);

  const addComponent = (type: keyof typeof defaultGates) => {
    const baseX = 100;
    const baseY = 100;

    const isOccupied = components.some((comp) => comp.x === baseX && comp.y === baseY);

    const offset = isOccupied ? 20 * components.length : 0;

    const newComponent: Component = {
      id: crypto.randomUUID(),
      type: type as "AND" | "OR" | "NOT" | "Button" | "Lamp",
      inputs: defaultGates[type]?.inputs || 0,
      outputs: defaultGates[type]?.outputs || 0,
      x: baseX + offset,
      y: baseY + offset,
      state: type === "Button" ? false : undefined,
      ...(type in defaultGates && 'logic' in defaultGates[type] ? { logic: defaultGates[type]?.logic as (inputs: boolean[]) => boolean[] } : {}),
      ...(type in defaultGates && 'onClick' in defaultGates[type] ? { onClick: defaultGates[type]?.onClick as (component: Component) => void } : {}),
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
        onDragStart={() => {
          setIsDragging(comp.id);
        }}
        onDragEnd={(e) => {
          setIsDragging(false)
          setComponents((prev) =>
            prev.map((c) =>
              c.id === comp.id ? { ...c, x: e.target.x(), y: e.target.y() } : c
            )

          )
        }}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          setEditComponent(comp);
        }}
      >
        <Group
          onClick={() => {
            if (comp.onClick) {
              setInputChanged(!inputChanged);
              comp.onClick(comp);
            }
          }}
        >
          <Rect width={80} height={50} fill={comp.state ? "green" : "white"} stroke="black" strokeWidth={2} cornerRadius={8} />
          <Text text={comp.type} fontSize={16} fill="black" align="center" width={80} height={50} verticalAlign="middle" />
        </Group>
        {
          Array.from({ length: comp.inputs }).map((_, i) => (
            <Circle
              style={{ cursor: "pointer" }}
              key={`in-${comp.id}-${i}`}
              x={-10}
              y={(i + 1) * 15}
              radius={5}
              fill="blue"
              onClick={() => completeConnection(comp.id, i)}
              onMouseEnter={() => (document.body.style.cursor = "pointer")}
              onMouseLeave={() => (document.body.style.cursor = "default")}
            />
          ))
        }
        {
          Array.from({ length: comp.outputs }).map((_, i) => (
            <Circle
              key={`out-${comp.id}-${i}`}
              x={90}
              y={(i + 1) * 15}
              radius={5}
              fill="red"
              onClick={() => startConnection(comp.id, i)}
              onMouseEnter={() => (document.body.style.cursor = "pointer")}
              onMouseLeave={() => (document.body.style.cursor = "default")}
            />
          ))
        }

      </Group >
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

  const sideBarComponents = [
    { onClick: () => addComponent("AND"), icon: <GiLogicGateAnd />, title: "Porte AND", color: "bg-blue-600", type: "operator" },
    { onClick: () => addComponent("OR"), icon: <GiLogicGateOr />, title: "Porte OR", color: "bg-green-600", type: "operator" },
    { onClick: () => addComponent("NOT"), icon: <GiLogicGateNot />, title: "Porte NOT", color: "bg-red-600", type: "operator" },
    { onClick: () => addComponent("XOR"), icon: <GiLogicGateXor />, title: "Porte XOR", color: "bg-red-600", type: "operator" },
    { onClick: () => addComponent("NAND"), icon: <GiLogicGateNand />, title: "Porte NAND", color: "bg-red-600", type: "operator" },
    { onClick: () => addComponent("NOR"), icon: <GiLogicGateNor />, title: "Porte NOR", color: "bg-red-600", type: "operator" },
    { onClick: () => addComponent("XNOR"), icon: <GiLogicGateNxor />, title: "Porte XNOR", color: "bg-red-600", type: "operator" },
    { onClick: () => addComponent("Button"), icon: <FaCheck />, title: "Boutton", color: "bg-purple-600", type: "input" },
    { onClick: () => addComponent("Lamp"), icon: <FaLightbulb />, title: "Lampe de sortie", color: "bg-orange-600", type: "output" },

  ]

  const groupedComponents = sideBarComponents.reduce((acc, comp) => {
    if (!acc[comp.type as string]) acc[comp.type as string] = [];
    acc[comp.type as string].push(comp);
    return acc;
  }, {} as Record<string, typeof sideBarComponents>);

  const toggleSection = (type: string) => {
    setOpenSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="flex h-screen">
      <div
        className={`fixed top-0 left-0 h-full overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-80 shadow-lg backdrop-blur-md text-white flex flex-col items-center py-4 space-y-3 rounded-r-xl transition-all duration-300 ${expanded ? "w-56 px-4" : "w-20 px-3"
          }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <input
          type="text"
          placeholder="Rechercher"
          className="w-full p-2 bg-gray-800 text-white rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />


        {
          expanded ? (
            <div
              className="w-full h-full overflow-y-auto space-y-2"
            >
              {
                search.trim() ? (
                  sideBarComponents
                    .filter((e) => e.title.toLowerCase().includes(search.trim().toLowerCase()))
                    .map(({ onClick, icon, title, color }, index) => (
                      <button
                        key={index}
                        onClick={onClick}
                        className="flex items-center space-x-2 w-full rounded-lg transition-all duration-300 justify-start"
                        title={title}
                      >
                        <span className={`p-3 rounded-lg ${color} hover:brightness-110 focus:ring-2 focus:ring-white transition-all`}>
                          {icon}
                        </span>
                        {expanded && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">{title}</span>}
                      </button>
                    ))
                ) : (
                  Object.entries(groupedComponents).map(([type, items]) => (
                    <div key={type} className="w-full">
                      <button
                        onClick={() => toggleSection(type)}
                        className="flex items-center justify-between w-full p-2 bg-gray-800 rounded-lg text-left"
                      >
                        <span className="text-sm font-semibold">{type.toUpperCase()}</span>
                        <span className={`transition-transform ${openSections[type] ? "rotate-180" : ""}`}>▼</span>
                      </button>

                      <div
                        className={`transition-all duration-300 overflow-hidden ${openSections[type] ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                      >
                        {items.map(({ onClick, icon, title, color }, index) => (
                          <button
                            key={index}
                            onClick={onClick}
                            className="flex items-center space-x-2 w-full mt-2 rounded-lg transition-all duration-300 justify-start"
                            title={title}
                          >
                            <span className={`p-3 rounded-lg ${color} hover:brightness-110 focus:ring-2 focus:ring-white transition-all`}>
                              {icon}
                            </span>
                            {expanded && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">{title}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )
              }
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <FaArrowRight className="text-white" />
            </div>
          )
        }

        <button
          onClick={() => setSimulationRunning(!simulationRunning)}
          className="flex items-center space-x-2 w-full rounded-lg transition-all duration-300 justify-start"
          title={"Simulation"}
        >
          <span className={`p-3 rounded-lg bg-yellow-600 hover:brightness-110 focus:ring-2 focus:ring-white transition-all`}>
            {simulationRunning ? <FaPause /> : <FaPlay />}
          </span>
          {expanded && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">{"Simulation"}</span>}
        </button>
      </div>
      {editComponent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">

          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl w-[350px]">
            <h2 className="text-xl font-bold mb-4">{editComponent.type}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  placeholder="Nom du composant"
                  value={editComponent.type}
                  onChange={(e) =>
                    setEditComponent((prev) => prev ? { ...prev, type: e.target.value } : null)
                  }
                  className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">X</label>
                  <input
                    type="number"
                    min={0}
                    max={800}
                    value={editComponent.x}
                    onChange={(e) =>
                      setEditComponent((prev) => prev ? { ...prev, x: parseInt(e.target.value) } : null)
                    }
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Y</label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={editComponent.y}
                    onChange={(e) =>
                      setEditComponent((prev) => prev ? { ...prev, y: parseInt(e.target.value) } : null)
                    }
                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
            {/* {editComponent.onClick && (
              <button
                onClick={() => {
                  if (!editComponent.onClick) return
                  setInputChanged(!inputChanged);
                  editComponent?.onClick(editComponent);
                }}
                className="w-full p-2 mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition duration-200"
              >
                Toggle
              </button>
            )} */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  setComponents((prev) =>
                    prev.map((c) => (c.id === editComponent.id ? editComponent : c))
                  );
                  setEditComponent(null);
                }}
                className="flex-1 p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition duration-200 mx-1"
              >
                Save
              </button>
              <button
                onClick={() => setEditComponent(null)}
                className="flex-1 p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition duration-200 mx-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex-1 flex flex-col items-center gap-4 mt-auto mb-auto">
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
          <Layer>
            {isDragging && (
              <Group
                onMouseEnter={() => setIsOverTrash(true)}
                onMouseLeave={() => setIsOverTrash(false)}
                x={720}
                y={400}
                onMouseUp={() => {
                  setComponents((prev) => prev.filter((c) => c.id !== isDragging));
                  setIsOverTrash(false);
                }}
              >
                {/* Couvercle */}
                <Path
                  data="M10,5 H54 A3,3 0 0,1 57,8 V12 H7 V8 A3,3 0 0,1 10,5 Z"
                  fill="#333"
                  stroke="#222"
                  strokeWidth={2}
                  offsetX={isOverTrash ? -2 : 0}
                  rotation={isOverTrash ? -15 : 0} // Animation du couvercle
                  x={0}
                  y={isOverTrash ? -5 : 0} // Légère élévation
                  duration={300}
                />
                {/* Corps de la poubelle */}
                <Path
                  data="M15,15 H49 V65 A5,5 0 0,1 44,70 H20 A5,5 0 0,1 15,65 Z"
                  fill="#444"
                  stroke="#222"
                  strokeWidth={2}
                />
                {/* Lignes verticales */}
                <Path data="M20,18 V60" stroke="#222" strokeWidth={2} />
                <Path data="M30,18 V60" stroke="#222" strokeWidth={2} />
                <Path data="M40,18 V60" stroke="#222" strokeWidth={2} />
                <Path data="M50,18 V60" stroke="#222" strokeWidth={2} />
              </Group>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}