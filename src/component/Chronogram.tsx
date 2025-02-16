import React from 'react';

interface ChronogramData {
  time: number;
  inputs: SignalData[];
  outputs: SignalData[];
}

interface SignalData {
  type: string;
  state: boolean;
}

interface ChronogramProps {
  data: ChronogramData[];
}

const Chronogram: React.FC<ChronogramProps> = ({ data }) => {
  if (!data.length) return null;

  const numberOfInputs = data[0].inputs.length;
  const numberOfOutputs = data[0].outputs.length;
  const totalSignals = numberOfInputs + numberOfOutputs;

  return (
    <div className="w-full max-w-6xl p-4">
      {/* Labels column */}
      <div className="flex">
        <div className="w-24 flex flex-col gap-6 pr-2">
          {data[0].inputs.map((_, idx) => (
            <div key={`input-label-${idx}`} className="h-6 flex items-center justify-end font-mono">
              {_.type}
            </div>
          ))}
          {data[0].outputs.map((_, idx) => (
            <div key={`output-label-${idx}`} className="h-6 flex items-center justify-end font-mono">
              {_.type}
            </div>
          ))}
        </div>

        {/* Signals grid */}
        <div className="flex-1">
          <div className="flex flex-col gap-6">
            {Array.from({ length: totalSignals }).map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex h-6">
                {data.map((entry, colIndex) => {
                  const isInput = rowIndex < numberOfInputs;
                  const value = isInput
                    ? entry.inputs[rowIndex].state
                    : entry.outputs[rowIndex - numberOfInputs].state;

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="flex-1 min-w-8 border-r border-gray-300 flex items-center justify-center font-mono text-blue-500"
                    >
                      {value ? '1' : '0'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Time markers */}
          {/* <div className="flex mt-2 border-t border-gray-300">
            {data.map((entry, idx) => (
              <div key={`time-${idx}`} className="flex-1 min-w-8 text-center text-sm font-mono">
                {entry.time}
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Chronogram;