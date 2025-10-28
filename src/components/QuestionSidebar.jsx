// UI component that allows for easy question navigation in TakeTest view
const QuestionSidebar = ({
  questions,
  currentIdx,
  setCurrentIdx,
  bookmarked,
  answers,
  drawings = {},
}) => {
  const hasContent = (questionId) => {
    const hasAnswer = answers[questionId];
    const hasDrawing = drawings[questionId] && drawings[questionId].length > 0;
    return hasAnswer || hasDrawing;
  };

  return (
    <div className="p-3 space-y-2">
      {questions.map((q, idx) => (
        <button
          key={q.id || idx}
          onClick={() => setCurrentIdx(idx)}
          className={`w-full px-3 py-2 rounded text-left border text-sm ${
            idx === currentIdx
              ? "bg-orange-300 border-orange-600"
              : "bg-white border-orange-200"
          } ${hasContent(q.id) ? "font-bold" : ""}`}
        >
          Q{idx + 1}
          {bookmarked.includes(q.id) && (
            <span className="ml-2 text-yellow-700">★</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default QuestionSidebar;
