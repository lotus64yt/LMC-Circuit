import { Component, Connection } from "@/app/page";
import { loadCircuit } from "@/utils/loadCircuit";
import Konva from "konva";
import { useRef, useState } from "react";

const MenuBar = ({
  options: {
    components,
    setComponents,
    connections,
    setConnections,
    outputs,
    setOutputs,
    stageRef,
  },
}: {
  options: {
    components: Component[];
    setComponents: (components: Component[]) => void;
    connections: Connection[];
    setConnections: (connections: Connection[]) => void;
    outputs: {
      show: boolean;
      data: {
        time: number;
        inputs: {
          type: string;
          state: boolean;
        }[];
        outputs: {
          type: string;
          state: boolean;
        }[];
      }[];
    };
    setOutputs: (outputs: {
      show: boolean;
      data: {
        time: number;
        inputs: {
          type: string;
          state: boolean;
        }[];
        outputs: {
          type: string;
          state: boolean;
        }[];
      }[];
    }) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
  };
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleFileImport = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target.files?.[0];
    if (!file) return;

    const circuit = await loadCircuit(file);
    setComponents([...components, ...circuit.components]);
    setConnections([...connections, ...circuit.connections]);
  };

  const menus = [
    {
      name: "File",
      options: [
        {
          label: "New",
          onClick: () => (setComponents([]), setConnections([])),
        },
        { label: "Import", onClick: () => fileInputRef.current?.click() },
        {
          label: "Save",
          onClick: () => {
            const data = JSON.stringify(
              { components, connections },
              (key, value) =>
                typeof value === "function"
                  ? `function${value.toString()}`
                  : value
            );
            const encodedData = btoa(data);
            const corruptedData = encodedData
              .split("")
              .map((char, i) => char + (i % 2 === 0 ? "0" : "1"))
              .join("");
            const blob = new Blob([corruptedData], {
              type: "application/octet-stream",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "circuit.lmccircuit";
            link.click();
          },
        },
      ],
    },
    {
      name: "View",
      options: [
        {
          label: "Zoom In",
          onClick: () =>
            stageRef.current?.scale({
              x: stageRef.current.scaleX() * 1.1,
              y: stageRef.current.scaleY() * 1.1,
            }),
        },
        {
          label: "Zoom Out",
          onClick: () =>
            stageRef.current?.scale({
              x: stageRef.current.scaleX() / 1.1,
              y: stageRef.current.scaleY() / 1.1,
            }),
        },
        {
          label: "Reset Zoom",
          onClick: () => stageRef.current?.scale({ x: 1, y: 1 }),
        },
      ],
    },
    {
      name: "Analysis",
      options: [
        {
          label: "Show Outputs",
          onClick: () => setOutputs({ ...outputs, show: true }),
        },
      ],
    },
    {
      name: "Help",
      options: [
        {
          label: "GitHub",
          onClick: () =>
            window.open("https://github.com/lotus64yt/LMC-Circuit"),
        },
        {
          label: "Report Issue",
          onClick: () =>
            window.open("https://github.com/lotus64yt/LMC-Circuit/issues/new"),
        },
        {
          label: "Read DataSheet",
          onClick: () => {
            window.open("https://github.com/lotus64yt/LMC-Circuit/wiki");
          },
        },
      ],
    },
    {
      name: "Presets",
      options: [
        {
          label: "Basic",
          onClick: async () => {
            const blob = await fetch("/presets/basic.lmccircuit").then((res) => res.blob());
            const file = new File([blob], "basic.lmccircuit", { type: blob.type });
            const circuit = await loadCircuit(file);
            setComponents([...components, ...circuit.components]);
            setConnections([...connections, ...circuit.connections]);
          }
        }, {
          label: "4 Bit to 7 Segment Decoder",
          onClick: async () => {
            const blob = await fetch("/presets/4bit_decoder.lmccircuit").then((res) => res.blob());
            const file = new File([blob], "4bit_decoder.lmccircuit", { type: blob.type });
            const circuit = await loadCircuit(file);
            setComponents([...components, ...circuit.components]);
            setConnections([...connections, ...circuit.connections]);
          }
        }
      ]
    }
  ];

  return (
    <div
      className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-lg text-white flex px-6 shadow-xl rounded-b-lg transition-all duration-300"
      onMouseEnter={() => setOpenMenu(null)}
      onMouseLeave={() => {
        setOpenMenu(null);
      }}
    >
      {menus.map((menu) => (
        <div
          key={menu.name}
          className="relative mx-3"
          onMouseEnter={() => setOpenMenu(menu.name)}
        >
          <div
            onMouseEnter={() => setOpenMenu(menu.name)}
            className="px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-700 cursor-pointer"
          >
            <p onMouseEnter={() => setOpenMenu(menu.name)}>{menu.name}</p>
            {openMenu === menu.name ? (
              <div
                className={`absolute left-0 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden transition-opacity duration-200 ease-in-out ${
                  openMenu === menu.name
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {menu.options.map((option, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-all duration-200 ease-in-out"
                    onClick={option.onClick}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
      <input
        type="file"
        ref={fileInputRef}
        accept=".lmccircuit"
        className="hidden"
        onChange={handleFileImport}
      />
    </div>
  );
};

export default MenuBar;
