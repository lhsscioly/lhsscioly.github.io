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

  // Helper function to format cipher text with proper spacing using spans
  const formatCipherText = (text) => {
    // Check if this is a Baconian cipher by looking at the question text
    const questionText = question.question[0] || "";
    const isBaconian = questionText.toLowerCase().includes("baconian");

    if (isBaconian) {
      // For Baconian cipher, group into 5-letter chunks
      const cleanText = text.replace(/\s+/g, ""); // Remove existing spaces
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
      // For other ciphers, use word-based spacing
      return text
        .split(/\s+/) // Split by any whitespace into words
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
          {question.question.map((part, index) => (
            <p
              key={index}
              className={index > 0 ? "mt-8" : ""}
              style={
                index > 0 &&
                (question.event === "Codebusters" || event === "Codebusters")
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
              {index > 0 &&
              (question.event === "Codebusters" || event === "Codebusters")
                ? // Format cipher text with proper spacing for Codebusters
                  formatCipherText(part)
                : part}
            </p>
          ))}
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
