import { useEffect, useState } from "react";

const UpdateMessage = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenUpdate = localStorage.getItem("updateMessageSeen");

        if (!hasSeenUpdate) {
            setIsVisible(true);
            localStorage.setItem("updateMessageSeen", "977bdf8");
        }
    }, []);

    return isVisible ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">

            <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl w-[550px]">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold mb-4">✨ What is new ?</h2>
                </div>
                <div className="space-y-3">
                    <p className="text-gray-300">
                        LMC Circuit has been improuved with new features and bug fixes.
                    </p>
                    <ul className="list-disc pl-5">
                        <li className="text-gray-300">- Changes : Better wires, full screen playgroud</li>
                        <li className="text-gray-300">- Fixes : Better performances, minors bug fixes</li>
                        <li className="text-gray-300">- Add : New components (ex: Transistor, 74LS00)</li>
                    </ul>
                </div>

                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="flex-1 p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition duration-200 mx-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default UpdateMessage;