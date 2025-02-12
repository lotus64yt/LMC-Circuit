"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Circle, Path } from "react-konva";
import { FaCheck, FaPlay, FaPause, FaLightbulb, FaArrowRight/*, FaPlus*/ } from 'react-icons/fa';
import { GiLogicGateAnd, GiLogicGateNand, GiLogicGateNor, GiLogicGateNot, GiLogicGateNxor, GiLogicGateOr, GiLogicGateXor } from "react-icons/gi";
import { SiCustomink } from "react-icons/si";
import { MdSwitchRight } from "react-icons/md";
import Konva from "konva";
import UpdateMessage from "@/component/UpdateMessage";
import { TbLogicBuffer } from "react-icons/tb";

type Component = {
  id: string;
  type: "AND" | "OR" | "NOT" | "Button" | "Lamp" | "Screen7Segment" | string;
  display?: (intpus: boolean[]) => React.ReactNode;
  inputs: number;
  outputs: number;
  x: number;
  y: number;
  state?: boolean;
  logic?: (inputs: boolean[]) => boolean[];
  onClick?: (component: Component) => void;
};

type tempComponent = {
  type: "AND" | "OR" | "NOT" | "Button" | "Lamp" | string;
  inputs: number;
  outputs: number;
  logic?: (inputs: boolean[]) => boolean[];
}

type Connection = {
  from: string;
  to: string;
  fromOutput: number;
  toInput: number;
};

export default function Page() {
  const [tempConnection, setTempConnection] = useState<{ from: string; fromOutput: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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
  const [customBlocks, setCustomBlocks] = useState<{ [key: string]: Component }>({});
  const [editCustomBlock, setEditCustomBlock] = useState<tempComponent | null>(null);
  const [trashPos, setTrashPos] = useState({
    x: typeof window !== "undefined" ? window.innerWidth - 100 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 120 : 0,
  });
  const stageRef = useRef<Konva.Stage>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateTrashPos = () => {
      setTrashPos({
        x: window.innerWidth - 100,
        y: window.innerHeight - 120,
      });
    };

    window.addEventListener("mousemove", () => {
      const pointer = stageRef.current?.getRelativePointerPosition();
      setMousePos({
        x: pointer?.x || 0,
        y: pointer?.y || 0
      });
    })
    window.addEventListener("resize", updateTrashPos);
    return () => window.removeEventListener("resize", updateTrashPos);
  }, []);

  const defaultGates = {
    AND: { type: "AND", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] && inputs[1]] },
    OR: { type: "OR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] || inputs[1]] },
    NOT: { type: "NOT", inputs: 1, outputs: 1, logic: (inputs: boolean[]) => [!inputs[0]] },
    XOR: { type: "XOR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] !== inputs[1]] },
    NAND: { type: "NAND", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [!(inputs[0] && inputs[1]) ? 1 : 0] },
    NOR: { type: "NOR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [!(inputs[0] || inputs[1])] },
    XNOR: { type: "XNOR", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] === inputs[1]] },
    TRANSISTOR: { type: "Transistor", inputs: 2, outputs: 1, logic: (inputs: boolean[]) => [inputs[0] && inputs[1] ? inputs[1] : false] },
    "74LS00": {
      type: "74LS00",
      inputs: 4,
      outputs: 2,
      logic: (inputs: boolean[]) => [
        inputs[0] && inputs[1],
        inputs[2] && inputs[3],
      ],
    },
    Button: {
      type: "Button", inputs: 0, outputs: 1, onClick: (component: Component) => {
        setComponents((prev) => prev.map((c) => c.id === component.id ? { ...c, state: !c.state } : c))
      }
    },
    Screen7Segment: {
      type: "7 Segment diplay", inputs: 8, outputs: 0, display: (inputs: boolean[]) => {
        const width = 80;
        const height = 138;
        const margin = 5;

        const segmentPositions = [
          { x: 15 + margin, y: 0, w: 50 - margin * 2, h: 12 },
          { x: 65, y: 6 + margin, w: 12, h: 55 - margin * 2 },
          { x: 65, y: 74 + margin, w: 12, h: 55 - margin * 2 },
          { x: 15 + margin, y: 126, w: 50 - margin * 2, h: 12 },
          { x: 3, y: 74 + margin, w: 12, h: 55 - margin * 2 },
          { x: 3, y: 6 + margin, w: 12, h: 55 - margin * 2 },
          { x: 15 + margin, y: 67, w: 50 - margin * 2, h: 12 },];

        return (
          <Group>
            <Rect
              width={width}
              height={height}
              fill="white"
              cornerRadius={12}
              strokeWidth={3}
              shadowBlur={10}
            />

            {segmentPositions.map(({ x, y, w, h }, index) => (
              <Rect
                key={index}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={inputs[index] ? "#ff3b3b" : "#222"}
                cornerRadius={4}
                shadowBlur={inputs[index] ? 8 : 0}
                shadowColor="red"
              />
            ))}

            <Circle
              x={72}
              y={130}
              radius={6}
              fill={inputs[7] ? "#ff3b3b" : "#222"}
              shadowBlur={inputs[7] ? 8 : 0}
              shadowColor="red"
            />
          </Group>
        )
      }
    },
    Lamp: { type: "Lamp", inputs: 1, outputs: 0 },
  };

  useEffect(() => {
    if (!simulationRunning) return;

    const newComponents = components.map((comp) => {
      if (comp.logic || comp.onClick) {
        const inputs = connections
          .filter((conn) => conn.to === comp.id)
          .map((conn) => components.find((c) => c.id === conn.from)?.state || false);

        if (comp.logic) {
          comp.state = comp.logic(inputs)[0];
        } else if (comp.onClick) {
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
    if (!stageRef || !stageRef.current) return;

    const stage = stageRef.current;
    const scale = stage.scaleX();
    const position = stage.position();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const baseX = (pointer.x - position.x) / scale;
    const baseY = (pointer.y - position.y) / scale;

    const isOccupied = components.some((comp) => comp.x === baseX && comp.y === baseY);
    const offset = isOccupied ? 20 * components.length : 0;

    const newComponent: Component = {
      id: crypto.randomUUID(),
      type: type as string,
      display: type in defaultGates && 'display' in defaultGates[type] ? defaultGates[type].display as (inputs: boolean[]) => React.ReactNode : undefined,
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

  const addCustomBlock = (type: string, inputs: number, outputs: number, logic: (inputs: boolean[]) => boolean[]) => {
    const baseX = 100;
    const baseY = 100;

    const isOccupied = components.some((comp) => comp.x === baseX && comp.y === baseY);

    const offset = isOccupied ? 20 * components.length : 0;

    const newComponent: Component = {
      id: crypto.randomUUID(),
      type: type,
      inputs: inputs,
      outputs: outputs,
      x: baseX + offset,
      y: baseY + offset,
      logic: logic,
    };

    setComponents([...components, newComponent]);
  };

  const renderComponent = (comp: Component) => {
    return (
      <Group
        key={comp.id}
        x={comp.x}
        y={comp.y}
        onContextMenu={(e) => {
          if (simulationRunning) return;
          e.evt.preventDefault();
          setEditComponent(comp);
        }}
        draggable={!simulationRunning}
        onDragMove={(e) => {
          if (simulationRunning) return;
          if (isDragging === comp.id) {
            setComponents((prev) =>
              prev.map((c) =>
                c.id === comp.id ? { ...c, x: e.target.x(), y: e.target.y() } : c
              )
            );
          }
        }}
        onDragStart={() => {
          if (simulationRunning) return;
          setIsDragging(comp.id);
        }}
        onDragEnd={() => {
          if (simulationRunning) return;
          setIsDragging(false)
        }}
      >
        <Group
          onClick={() => {
            if (comp.onClick && simulationRunning) {
              setInputChanged(!inputChanged);
              comp.onClick(comp);
            }
          }}
        >
          <Rect
            width={80}
            height={comp.inputs > 2 || comp.outputs > 2 ? 40 + 11 * (comp.inputs > comp.outputs ? comp.inputs : comp.outputs) : 50}
            fill={comp.state ? "green" : "white"}
            stroke="black"
            strokeWidth={2}
            cornerRadius={8}
          />
          {
            comp.display ? (
              comp.display([
                ...Array.from({ length: comp.inputs }).map((_, i) => connections.some((conn) => conn.to === comp.id && conn.toInput === i && components.find((c) => c.id === conn.from)?.state)),
              ])
            ) : (
              <Text text={comp.type} fontSize={16} fill="black" align="center" width={80} height={50} verticalAlign="middle" />
            )
          }

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
              onClick={() => {
                if (simulationRunning || !tempConnection) return;
                completeConnection(comp.id, i)
              }}
              onMouseUp={() => {
                if (simulationRunning || !tempConnection) return;
                completeConnection(comp.id, i)
              }}
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
              onMouseDown={(evt) => {
                evt.cancelBubble = true; // Empêche la propagation du clic au Group parent
                if (simulationRunning) return;
                startConnection(comp.id, i);
              }}
              onMouseEnter={() => (document.body.style.cursor = "pointer")}
              onMouseLeave={() => (document.body.style.cursor = "default")}
            />
          ))
        }

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

  const sideBarComponents = [
    { onClick: () => addComponent("AND"), icon: <GiLogicGateAnd />, title: "AND", color: "bg-blue-600", type: "Operators" },
    { onClick: () => addComponent("OR"), icon: <GiLogicGateOr />, title: "OR", color: "bg-green-600", type: "Operators" },
    { onClick: () => addComponent("NOT"), icon: <GiLogicGateNot />, title: "NOT", color: "bg-red-600", type: "Operators" },
    { onClick: () => addComponent("XOR"), icon: <GiLogicGateXor />, title: "XOR", color: "bg-red-600", type: "Operators" },
    { onClick: () => addComponent("NAND"), icon: <GiLogicGateNand />, title: "NAND", color: "bg-red-600", type: "Operators" },
    { onClick: () => addComponent("NOR"), icon: <GiLogicGateNor />, title: "NOR", color: "bg-red-600", type: "Operators" },
    { onClick: () => addComponent("XNOR"), icon: <GiLogicGateNxor />, title: "XNOR", color: "bg-red-600", type: "Operators" },
    { onClick: () => addComponent("TRANSISTOR"), icon: <MdSwitchRight />, title: "Transistor", color: "bg-lime-900", type: "Gates" },
    { onClick: () => addComponent("74LS00"), icon: <TbLogicBuffer />, title: "74LS00", color: "bg-blue-600", type: "Gates" },
    { onClick: () => addComponent("Button"), icon: <FaCheck />, title: "Button", color: "bg-purple-600", type: "Inputs" },
    { onClick: () => addComponent("Lamp"), icon: <FaLightbulb />, title: "Lamp", color: "bg-orange-600", type: "Outputs" },
    { onClick: () => addComponent("Screen7Segment"), icon: <FaLightbulb />, title: "7 Segments screen", color: "bg-orange-600", type: "Outputs" },
    ...Object.values(customBlocks).map((block) => ({
      onClick: () => {
        setComponents((prev) => [
          ...prev,
          {
            ...block,
            id: crypto.randomUUID(),
            x: 100,
            y: 100,
            logic: block.logic
          }
        ]);
      },
      icon: <SiCustomink />,
      title: block.type,
      color: "bg-purple-600",
      type: "custom",
    })),
  ]

  const groupedComponents = sideBarComponents.reduce((acc, comp) => {
    if (!acc[comp.type as string]) acc[comp.type as string] = [];
    acc[comp.type as string].push(comp);
    return acc;
  }, {} as Record<string, typeof sideBarComponents>);

  const toggleSection = (type: string) => {
    setOpenSections((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const deleteCustomBlock = (type: string) => {
    setCustomBlocks((prev) => {
      const newBlocks = { ...prev };
      delete newBlocks[type];
      return newBlocks;
    });
    setEditCustomBlock(null);
  }

  if (!isClient) {
    return (
      <div className="flex flex-col gap-7 w-screen items-center justify-center h-screen bg-gray-900">
        <h1 className="text-white text-6xl font-bold">LMC Circuit</h1>
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-dashed rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen">
      <div
        className={`fixed z-50 top-0 left-0 h-full overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-80 shadow-lg backdrop-blur-md text-white flex flex-col items-center py-4 space-y-3 rounded-r-xl transition-all duration-300 ${expanded ? "w-56 px-4" : "w-20 px-3"
          }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <input
          type="text"
          placeholder={"Search"}
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
                            onClick={() => {
                              onClick()
                            }}
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

        {/* <button
          onClick={() => {
            setEditCustomBlock({
              type: "Custom Block",
              inputs: 0,
              outputs: 0,
              logic: () => [false]
            })
          }}
          className="flex items-center space-x-2 w-full rounded-lg transition-all duration-300 justify-start"
          title={"Create Custom Block"}
        >
          <span className={`p-3 rounded-lg bg-green-600 hover:brightness-110 focus:ring-2 focus:ring-white transition-all`}>
            <FaPlus />
          </span>
          {expanded && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">{"Create Custom Block"}</span>}
        </button> */}

        <button
          onClick={() => setSimulationRunning(!simulationRunning)}
          className="flex items-center space-x-2 w-full rounded-lg transition-all duration-300 justify-start"
          title={"Start Simulation"}
        >
          <span className={`p-3 rounded-lg bg-yellow-600 hover:brightness-110 focus:ring-2 focus:ring-white transition-all`}>
            {simulationRunning ? <FaPause /> : <FaPlay />}
          </span>
          {expanded && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">{"Start Simulation"}</span>}
        </button>
      </div>
      {editCustomBlock && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">

          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl w-[550px]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">{editCustomBlock.type}</h2>
              <button
                onClick={() => {
                  deleteCustomBlock(editCustomBlock.type);
                  setEditComponent(null);
                }}
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition duration-200"
              >
                {"Delete"}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  placeholder="Component name"
                  value={editCustomBlock.type}
                  onChange={(e) => {
                    if (customBlocks[e.target.value]) {
                      document.getElementById("warning-customBlock-name")?.removeAttribute("hidden");
                      return;
                    } else {
                      document.getElementById("warning-customBlock-name")?.setAttribute("hidden", "true");
                    }
                    setEditCustomBlock((prev) => prev ? { ...prev, type: e.target.value } : null)
                  }}
                  className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400" hidden id={"warning-customBlock-name"}>The name must be unique</p>
              </div>



            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  setEditCustomBlock(null);
                  if (editCustomBlock.logic) {
                    addCustomBlock(editCustomBlock.type, editCustomBlock.inputs, editCustomBlock.outputs, editCustomBlock.logic);
                  }
                }}
                className="flex-1 p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition duration-200 mx-1"
              >
                Save
              </button>
              <button
                onClick={() => setEditCustomBlock(null)}
                className="flex-1 p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition duration-200 mx-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {editComponent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">

          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl w-[350px]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold mb-4">{editComponent.type}</h2>
              <button
                onClick={() => {
                  setComponents((prev) => prev.filter((c) => c.id !== editComponent.id));
                  setEditComponent(null);
                }}
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition duration-200"
              >
                Delete
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
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
      <UpdateMessage />

      <div className="relative z-0 flex-1 flex flex-col items-center gap-4 mt-auto mb-auto">
        <Stage
          ref={stageRef}
          className="bg-gray-700"
          width={window.innerWidth}
          height={window.innerHeight}
          id="stage-container"
          draggable
          onDragStart={() => {
            document.body.style.cursor = "move";
          }}
          onDragEnd={() => {
            document.body.style.cursor = "default";
          }}
        >
          <Layer>
            {components.map(renderComponent)}
            {tempConnection && (() => {
              const from = components.find((c) => c.id === tempConnection.from);
              if (!from) return null;

              const fromX = from.x + 90;
              const fromY = from.y + (tempConnection.fromOutput + 1) * 15;
              const toX = mousePos.x;
              const toY = mousePos.y;

              const controlX = (fromX + toX) / 2;
              const controlY = fromY;

              return (
                <Path
                  data={`M ${fromX},${fromY} Q ${controlX},${controlY} ${toX},${toY}`}
                  stroke={"gray"}
                  strokeWidth={2}
                  fill="transparent"
                />
              );
            })()
            }
            {connections.map((conn, index) => {
              const from = components.find((c) => c.id === conn.from);
              const to = components.find((c) => c.id === conn.to);
              if (!from || !to) return null;

              const fromX = from.x + 90;
              const fromY = from.y + (conn.fromOutput + 1) * 15;
              const toX = to.x - 10;
              const toY = to.y + (conn.toInput + 1) * 15;

              const controlX = (fromX + toX) / 2;
              const controlY = fromY;

              return (
                <Path
                  key={index}
                  data={`M ${fromX},${fromY} Q ${controlX},${controlY} ${toX},${toY}`}
                  stroke={from.state ? "lime" : "white"}
                  strokeWidth={2}
                  fill="transparent"
                />
              );
            })}
          </Layer>
        </Stage>
        {isDragging && (
          <div
            onMouseEnter={() => setIsOverTrash(true)}
            onMouseLeave={() => setIsOverTrash(false)}
            style={{
              position: "absolute",
              left: trashPos.x,
              top: trashPos.y,
              pointerEvents: "auto",
            }}
            onMouseUp={() => {
              setComponents((prev) => prev.filter((c) => c.id !== isDragging));
              setIsOverTrash(false);
            }}
          >
            <svg width="70" height="80" viewBox="0 0 70 80">
              <path
                d="M10,5 H54 A3,3 0 0,1 57,8 V12 H7 V8 A3,3 0 0,1 10,5 Z"
                fill={isOverTrash ? "#222" : "#333"}
                stroke="#222"
                strokeWidth="2"
              />
              <path
                d="M15,15 H49 V65 A5,5 0 0,1 44,70 H20 A5,5 0 0,1 15,65 Z"
                fill="#444"
                stroke="#222"
                strokeWidth="2"
              />
              <path d="M20,18 V60" stroke="#222" strokeWidth="2" />
              <path d="M30,18 V60" stroke="#222" strokeWidth="2" />
              <path d="M40,18 V60" stroke="#222" strokeWidth="2" />
              <path d="M50,18 V60" stroke="#222" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}