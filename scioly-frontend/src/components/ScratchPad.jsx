import { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Rnd } from "react-rnd";

const ScratchPad = ({
  visible,
  minimized,
  setMinimized,
  onClose,
  questionId,
  data,
  setData,
  layout,
  setLayout,
}) => {
  const canvasRef = useRef(null);
  const [eraseMode, setEraseMode] = useState(false);

  const { width, height, x, y } = layout;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (data[questionId]) {
      canvasRef.current.loadPaths(data[questionId]);
    } else {
      canvasRef.current.clearCanvas();
    }
  }, [questionId]);

  const toggleErase = () => {
    const next = !eraseMode;
    canvasRef.current.eraseMode(next);
    setEraseMode(next);
  };

  const handleClear = () => canvasRef.current.clearCanvas();
  const handleUndo = () => canvasRef.current.undo();

  const handleSave = async () => {
    const paths = await canvasRef.current.exportPaths();
    setData((prev) => ({ ...prev, [questionId]: paths }));
    console.log("Saved scratchpad for question", questionId);
  };

  const handleMinimize = async () => {
    await handleSave();
    setMinimized(true);
  };

  if (!visible) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-white border border-gray-300 px-4 py-2 rounded shadow-md flex items-center gap-4">
        <span className="text-sm text-orange-600 font-semibold">
          Scratch Pad
        </span>
        <button onClick={() => setMinimized(false)} className="text-blue-600">
          ˄ Expand
        </button>
        <button onClick={onClose} className="text-red-600">
          ✕
        </button>
      </div>
    );
  }

  return (
    <Rnd
      position={{ x, y }}
      size={{ width, height }}
      onResizeStop={(e, direction, ref) => {
        setLayout((prev) => ({
          ...prev,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        }));
      }}
      onDragStop={(e, d) => {
        setLayout((prev) => ({
          ...prev,
          x: d.x,
          y: d.y,
        }));
      }}
      minWidth={300}
      minHeight={300}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-50 fixed"
      style={{ overflow: "visible" }}
    >
      <div className="flex flex-col h-full bg-transparent border border-orange-300 rounded shadow-lg">
        <div className="flex justify-between items-center p-2 bg-orange-100 rounded-t-md drag-handle select-none">
          <span className="font-semibold text-orange-700">Scratch Pad</span>
          <div className="flex gap-4">
            <button className="font-bold text-orange-600 hover:text-orange-700" onClick={handleMinimize} title="Minimize">
              —
            </button>
            <button className="font-bold text-orange-600 hover:text-orange-700" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-transparent">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={2}
            strokeColor="#000"
            canvasColor="transparent"
            className="w-full h-full"
          />
        </div>

        <div className="p-2 flex flex-wrap gap-2 justify-between bg-white rounded-b-md">
          <button
            onClick={handleClear}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Clear
          </button>
          <button
            onClick={handleUndo}
            className="bg-gray-600 text-white px-3 py-1 rounded"
          >
            Undo
          </button>
          <button
            onClick={toggleErase}
            className={`px-3 py-1 rounded ${
              eraseMode ? "bg-yellow-600" : "bg-yellow-500"
            } text-white`}
          >
            {eraseMode ? "Eraser On" : "Eraser Off"}
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </Rnd>
  );
};

export default ScratchPad;
