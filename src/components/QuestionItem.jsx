import { useState } from "react";

const QuestionItem = ({ q, index, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  // Ensure question is always an array
  const normalizedQ = {
    ...q,
    question: Array.isArray(q.question) ? q.question : [q.question],
  };
  const [editFields, setEditFields] = useState(normalizedQ);

  const handleSave = () => {
    setIsEditing(false);
    onEdit(index, editFields);
  };

  return (
    <div className="border border-orange-300 rounded-md p-4 bg-orange-50 shadow-sm">
      {isEditing ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-800 mb-2">
              Question
            </label>
            <div className="space-y-2">
              {editFields.question.map((part, partIndex) => (
                <div
                  key={partIndex}
                  className="flex gap-2 border border-gray-300 rounded-md p-2"
                >
                  <textarea
                    value={part}
                    onChange={(e) => {
                      const newQuestion = [...editFields.question];
                      newQuestion[partIndex] = e.target.value;
                      setEditFields({ ...editFields, question: newQuestion });
                    }}
                    placeholder={
                      partIndex === 0
                        ? "Question text..."
                        : "Additional part (e.g., cipher)..."
                    }
                    rows={3}
                    className="flex-1 px-3 py-2 focus:ring-orange-400 focus:ring-2"
                  />
                  {editFields.question.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newQuestion = editFields.question.filter(
                          (_, idx) => idx !== partIndex,
                        );
                        setEditFields({ ...editFields, question: newQuestion });
                      }}
                      className="text-red-500 font-bold text-2xl rounded-md hover:text-red-600 self-start"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setEditFields({
                    ...editFields,
                    question: [...editFields.question, ""],
                  });
                }}
                className="text-orange-600 hover:underline text-sm"
              >
                + Add Part
              </button>
              {editFields.question.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditFields({
                      ...editFields,
                      question: [editFields.question.join("\n\n")],
                    });
                  }}
                  className="ml-4 text-amber-600 hover:underline text-sm"
                >
                  Merge into Single Part
                </button>
              )}
              {editFields.question.length === 1 &&
                editFields.question[0].includes("\n") && (
                  <button
                    type="button"
                    onClick={() => {
                      const parts = editFields.question[0]
                        .split("\n\n")
                        .filter((part) => part.trim() !== "");
                      if (parts.length > 1) {
                        setEditFields({
                          ...editFields,
                          question: parts,
                        });
                      } else {
                        // If no double newlines found, try splitting by single newlines
                        const singleParts = editFields.question[0]
                          .split("\n")
                          .filter((part) => part.trim() !== "");
                        if (singleParts.length > 1) {
                          setEditFields({
                            ...editFields,
                            question: singleParts,
                          });
                        } else {
                          alert(
                            "No clear separation found. Use double line breaks or single line breaks to separate parts.",
                          );
                        }
                      }
                    }}
                    className="ml-4 text-blue-600 hover:underline text-sm"
                  >
                    Split into Parts
                  </button>
                )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Type
            </label>
            <select
              value={editFields.type}
              onChange={(e) =>
                setEditFields({ ...editFields, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2 appearance-none"
            >
              <option value="mcq">Multiple Choice</option>
              <option value="saq">Short Answer</option>
              <option value="leq">Long Answer</option>
            </select>
          </div>
          {editFields.type === "mcq" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-orange-800 mb-1">
                Choices
              </label>
              <div className="space-y-2">
                {editFields.choices.map((c, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between gap-3 px-4 py-2 bg-orange-100 rounded-md shadow-sm border border-orange-200"
                  >
                    <span className="text-orange-600 font-semibold">
                      {String.fromCharCode(65 + j)}.
                    </span>
                    <input
                      value={c}
                      onChange={(e) => {
                        const newChoices = [...editFields.choices];
                        newChoices[j] = e.target.value;
                        setEditFields({ ...editFields, choices: newChoices });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
                    />
                    <button
                      type="button"
                      className="text-orange-600 font-medium"
                      onClick={() => {
                        const newChoices = editFields.choices.filter(
                          (_, idx) => idx !== j,
                        );
                        setEditFields({ ...editFields, choices: newChoices });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 text-orange-600 hover:underline"
                onClick={() =>
                  setEditFields({
                    ...editFields,
                    choices: [...editFields.choices, ""],
                  })
                }
              >
                + Add Choice
              </button>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Answer (s)
            </label>
            {editFields.type === "leq" ? (
              <textarea
                value={editFields.answer}
                onChange={(e) =>
                  setEditFields({ ...editFields, answer: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
              />
            ) : (
              <input
                value={editFields.answer}
                onChange={(e) =>
                  setEditFields({ ...editFields, answer: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
              />
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Points
            </label>
            <input
              type="number"
              value={editFields.points}
              onChange={(e) =>
                setEditFields({ ...editFields, points: +e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-400 focus:ring-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Image
            </label>
            {editFields.selectedFile ? (
              <div className="mt-4 w-full">
                <div className="flex justify-between items-center pb-2">
                  <p className="text-sm text-orange-700 mb-1 font-medium">
                    Preview:
                  </p>
                  <button
                    className="text-orange-600 font-medium text-3xl hover:text-orange-700"
                    type="button"
                    onClick={() =>
                      setEditFields({ ...editFields, selectedFile: null })
                    }
                  >
                    ×
                  </button>
                </div>
                <img
                  src={URL.createObjectURL(editFields.selectedFile)}
                  alt="Preview"
                  className="w-full border border-orange-300 rounded-md shadow"
                />
              </div>
            ) : (
              <label
                htmlFor={`file-upload-${index}`}
                className="flex items-center justify-center px-4 py-3 bg-orange-100 border-2 border-dashed border-orange-300 rounded-md cursor-pointer hover:bg-orange-200 transition select-none"
              >
                <input
                  id={`file-upload-${index}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setEditFields({
                        ...editFields,
                        selectedFile: e.target.files[0],
                      });
                    }
                  }}
                />
                <span className="text-sm text-orange-700 font-medium">
                  Click to upload image
                </span>
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-orange-600 text-black px-4 py-1 rounded-md hover:bg-orange-700"
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            <div className="mb-2 font-medium text-orange-900">
              <span>Q{index + 1}: </span>
              {normalizedQ.question.map((part, partIndex) => (
                <span
                  key={partIndex}
                  className={partIndex > 0 ? "block mt-4" : "inline"}
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
          {q.type === "mcq" &&
            q.choices.map((c, i) => (
              <div
                key={`${c}-${i}`}
                className="flex items-center gap-2 px-4 py-2 mb-2 bg-orange-100 rounded-md shadow-sm border border-orange-200"
              >
                <span className="text-orange-600 font-semibold">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="text-gray-800">{c}</span>
              </div>
            ))}
          <div className="text-sm text-gray-700 my-3">
            Points: <span className="font-semibold">{q.points}</span>
          </div>
          <div className="text-sm text-gray-700">
            Answer (s): <span className="font-semibold">{q.answer}</span>
          </div>
          {q.selectedFile && (
            <div className="mt-4 w-full">
              <img
                src={URL.createObjectURL(q.selectedFile)}
                alt="Preview"
                className="w-full border border-orange-300 rounded-md shadow"
              />
            </div>
          )}
          <div className="flex justify-end py-2">
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded-md"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(index)}
                className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionItem;
