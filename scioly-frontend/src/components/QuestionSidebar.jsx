const QuestionSidebar = ({
  questions,
  currentIdx,
  setCurrentIdx,
  bookmarked,
  answers,
}) => {
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
          } ${answers[q.id] ? "font-bold" : ""}`}
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
