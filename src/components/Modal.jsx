import { useEffect } from "react";

// UI component for modal dialogs, such as for the AI test creation
const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-orange-700">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
