import React from "react";

// Same cipher management as in Review
const getAristocratType = (questionText) => {
  const lower = questionText.toLowerCase();
  if (!lower.includes("aristocrat")) return null;
  if (lower.includes("k3")) return "K3";
  if (lower.includes("k2")) return "K2";
  if (lower.includes("k1")) return "K1";
  return "A";
}

const getLetterFrequencies = (ciphertext) => {
  const freq = {};
  for (let i = 0; i < 26; i++) freq[String.fromCharCode(65 + i)] = 0;
  for (const char of ciphertext.toUpperCase()) {
    if (freq.hasOwnProperty(char)) freq[char]++;
  }
  return freq;
}

const AristocratFrequencyTable = ({ type, ciphertext }) => {
  const freq = getLetterFrequencies(ciphertext);
  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const frequencies = letters.map(l => freq[l] === 0 ? "" : freq[l]);

  let rowLabels = ["Letter", "Replacement", "Frequency"];
  let row1 = letters;
  let row2 = Array(26).fill("");
  let row3 = frequencies;
  let showLetterRow = false;

  if (type === "K1") {
    rowLabels = ["K1", "Replacement", "Frequency"];
    row1 = letters;
    row2 = Array(26).fill("");
    row3 = frequencies;
    showLetterRow = false;
  } else if (type === "K2") {
    rowLabels = ["Replacement", "K2", "Frequency"];
    row1 = Array(26).fill("");
    row2 = letters;
    row3 = frequencies;
    showLetterRow = false;
  } else if (type === "K3") {
    rowLabels = ["K3", "Replacement", "Frequency"];
    row1 = letters;
    row2 = Array(26).fill("");
    row3 = frequencies;
    showLetterRow = false;
  } else if (type === "A") {
    rowLabels = ["Letter", "Replacement", "Frequency"];
    row1 = letters;
    row2 = Array(26).fill("");
    row3 = frequencies;
    showLetterRow = false;
  }

  return (
    <div style={{ marginTop: "1em", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <table
        style={{
          borderCollapse: "collapse",
          textAlign: "center",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          minWidth: "fit-content"
        }}
      >
        <thead>
          {showLetterRow && (
            <tr>
              <th style={{ border: "1px solid #bbb", background: "#fef3c7", padding: "2px 8px", fontSize: "0.85em" }}></th>
              {letters.map((cell, i) => (
                <th key={i} style={{ border: "1px solid #bbb", background: "#fef3c7", padding: "2px 8px", fontSize: "0.85em" }}>{cell}</th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          <tr>
            <th style={{ border: "1px solid #bbb", background: "#fef3c7", padding: "2px 8px", fontSize: "0.85em" }}>{rowLabels[0]}</th>
            {row1.map((cell, i) => (
              <td key={i} style={{ border: "1px solid #bbb", padding: "2px 8px", fontSize: "0.85em" }}>{cell}</td>
            ))}
          </tr>
          <tr>
            <th style={{ border: "1px solid #bbb", background: "#fef3c7", padding: "2px 8px", fontSize: "0.85em" }}>{rowLabels[1]}</th>
            {row2.map((cell, i) => (
              <td key={i} style={{ border: "1px solid #bbb", padding: "2px 8px", fontSize: "0.85em" }}>{cell}</td>
            ))}
          </tr>
          <tr>
            <th style={{ border: "1px solid #bbb", background: "#fef3c7", padding: "2px 8px", fontSize: "0.85em" }}>{rowLabels[2]}</th>
            {row3.map((cell, i) => (
              <td key={i} style={{ border: "1px solid #bbb", padding: "2px 8px", fontSize: "0.85em" }}>{cell}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const QuestionView = ({
  idx,
  question,
  answer,
  onChange,
  onBookmark,
  isBookmarked,
  event,
}) => {
  const isMultipleChoice =
    question.type === "mcq" && question.answer.includes(", ");
  const isSAQ = question.type === "saq";

  const formatCipherText = (text) => {
    const questionText = question.question[0] || "";
    const isBaconian = questionText.toLowerCase().includes("baconian");

    if (isBaconian) {
      const cleanText = text.replace(/\s+/g, "");
      const chunks = [];
      for (let i = 0; i < cleanText.length; i += 5) {
        chunks.push(cleanText.slice(i, i + 5));
      }
      return chunks.map((chunk, chunkIndex) => (
        <span key={chunkIndex} className="inline-block mr-4">
          {chunk}
        </span>
      ));
    } else {
      return text
        .split(/\s+/)
        .map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block mr-4">
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="inline-block mr-2">
                {char}
              </span>
            ))}
          </span>
        ));
    }
  };

  // Special handling for questions with checkboxes
  
  const handleCheckboxChange = (choice) => {
    const prev = Array.isArray(answer) ? answer : [];
    const updated = prev.includes(choice)
      ? prev.filter((c) => c !== choice)
      : [...prev, choice];
    onChange(question.id, updated);
  };

  return (
    <div className="relative">
      <div className="sticky top-0 bg-white z-40 flex justify-between items-center mb-3 pb-2 border-b border-orange-200">
        <h4 className="text-lg font-semibold text-orange-700">
          Question {idx + 1}
        </h4>
        <button
          onClick={() => onBookmark(question.id)}
          className="text-yellow-600 hover:text-yellow-700"
        >
          {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
      </div>

      <div className="pt-2">
        <div className="mb-4 text-orange-900">
          {question.question.map((part, index) => {
            const questionText = question.question[0] || "";
            const aristocratType = getAristocratType(questionText);
            const isCodebusters = question.event === "Codebusters" || event === "Codebusters";
            const isAristocrat = aristocratType && isCodebusters && index > 0;
            return (
              <React.Fragment key={index}>
                <p
                  className={index > 0 ? "mt-8" : ""}
                  style={
                    index > 0 && isCodebusters
                      ? {
                          lineHeight: "3",
                          letterSpacing: "0.1em",
                          backgroundColor: "#fef3c7",
                          padding: "8px",
                          borderRadius: "4px",
                        }
                      : {}
                  }
                >
                  {index > 0 && isCodebusters
                    ? formatCipherText(part)
                    : part}
                </p>
                {isAristocrat && (
                  <AristocratFrequencyTable type={aristocratType} ciphertext={part} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Question Visual"
            className="mb-4 border rounded max-w-md"
          />
        )}

        {question.type === "mcq" && question.choices ? (
          question.choices.map((choice, idx) => (
            <label
              key={idx}
              className="block bg-orange-100 border border-orange-200 rounded px-4 py-2 mb-2 cursor-pointer"
            >
              <input
                type={isMultipleChoice ? "checkbox" : "radio"}
                name={`q-${question.id}`}
                value={choice}
                checked={
                  isMultipleChoice
                    ? (answer || []).includes(choice)
                    : answer === choice
                }
                onChange={() =>
                  isMultipleChoice
                    ? handleCheckboxChange(choice)
                    : onChange(question.id, choice)
                }
                className="mr-2"
              />
              {String.fromCharCode(65 + idx)}. {choice}
            </label>
          ))
        ) : isSAQ ? (
          <input
            type="text"
            className="w-full border border-orange-300 rounded p-2"
            placeholder="Short answer..."
            value={answer || ""}
            onChange={(e) => onChange(question.id, e.target.value)}
          />
        ) : (
          <textarea
            rows={4}
            className="w-full border border-orange-300 rounded p-2"
            placeholder="Type your answer..."
            value={answer || ""}
            onChange={(e) => onChange(question.id, e.target.value)}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionView;
