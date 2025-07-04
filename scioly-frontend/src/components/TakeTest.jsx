import { useEffect, useState, useRef } from "react";
import { useMatch } from "react-router-dom";

const TakeTest = ({ tests, user, teams }) => {
  const match = useMatch("/assigned/:id");
  const testId = match?.params?.id;

  const [test, setTest] = useState(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes in seconds
  const [answers, setAnswers] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (tests && testId) {
      const found = tests.find((t) => String(t.id) === testId);
      setTest(found || null);
    }
  }, [tests, testId]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (started && timeLeft === 0) {
      handleSubmit();
    }
    return () => clearTimeout(timerRef.current);
  }, [started, timeLeft]);

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleStart = () => {
    setStarted(true);
    setTimeLeft(50 * 60);
    console.log("Test started");
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = () => {
    setStarted(false);
    clearTimeout(timerRef.current);
    console.log("Submitting test...");
    console.log("Answers:", answers);
    // Placeholder for future backend integration
  };

  if (!user || !test) {
    return (
      <div className="text-center mt-10 text-orange-600 font-medium">
        Loading test...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-md shadow space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-orange-700">
          {test.school} Science Olympiad {test.year} - {test.event}
        </h2>
        {started && (
          <div className="text-orange-600 font-semibold text-xl">
            Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {!started ? (
        <div className="text-center">
          <button
            onClick={handleStart}
            className="bg-orange-500 text-white px-6 py-2 rounded shadow hover:bg-orange-600 transition"
          >
            Start Test
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-6">
            {test.questions?.map((q, idx) => (
              <div
                key={q.id || idx}
                className="border border-orange-300 rounded-md p-4 bg-orange-50 shadow-sm"
              >
                <div className="mb-2 font-medium text-orange-900">
                  Q{idx + 1}: {q.question}
                </div>

                {q.type === "mcq" ? (
                  q.choices.map((choice, j) => (
                    <label
                      key={j}
                      className="block bg-orange-100 border border-orange-200 rounded px-4 py-2 mb-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={choice}
                        checked={answers[q.id] === choice}
                        onChange={() => handleAnswerChange(q.id, choice)}
                        className="mr-2"
                      />
                      {String.fromCharCode(65 + j)}. {choice}
                    </label>
                  ))
                ) : (
                  <textarea
                    rows={3}
                    className="w-full border border-orange-300 rounded p-2"
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(q.id, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              Submit Test
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TakeTest;
