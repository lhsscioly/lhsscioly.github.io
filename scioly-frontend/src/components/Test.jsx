import { Link, useNavigate, useMatch } from "react-router-dom";
import { useState, useEffect } from "react";
import testService from "../services/tests";

const Test = ({ tests, user, teams, setError, setNotif, setTests }) => {
  const [test, setTest] = useState(null);
  const match = useMatch("/tests/:id");
  const navigate = useNavigate();

  useEffect(() => {
    if (match && tests) {
      const found = tests.find((t) => String(t.id) === match.params.id);
      setTest(found || null);
    }
  }, [match, tests]);

  if (!user) {
    return;
  }

  if (!tests || !match) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!test) {
    if (!tests.map((t) => t.id).includes(match.params.id.toString())) {
      return (
        <div className="text-center max-w-4xl mx-auto bg-white rounded-lg px-2 py-5 mt-10 font-medium text-orange-600">
          Test not found.
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleAssign = async () => {
    if (!user || !test) return;
    if (!teams || teams.length === 0) {
      setError("No teams available to assign this test.");
      setTimeout(() => {
        setError(null);
      }, 5000);
      return;
    }

    let savedTest;
    try {
      savedTest = await testService.updateTest(test.id, {
        assignees: teams.filter((t) => t.event === test.event).map((t) => t.id),
      });
      if (savedTest) {
        setTests(tests.map((t) => (t.id === test.id ? savedTest : t)));
        setNotif("Test assigned successfully!");
        setTimeout(() => {
          setNotif(null);
        }, 5000);
        navigate("/tests");
      }
    } catch (error) {
      console.error("Error assigning test:", error);
      if (error.response && error.response.status === 409) {
        setError(error.response.data.error);
      } else {
        setError("Failed to assign test. Please try again.");
      }
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-md shadow">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Link
            to="/tests"
            className="text-sm sm:text-base text-orange-600 font-semibold hover:text-orange-700 hover:underline transition"
          >
            ← Return to Test Bank
          </Link>
          <button
            onClick={handleAssign}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded shadow transition"
          >
            Assign
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-orange-700">
            {test.school} Science Olympiad {test.year}
          </h2>
          <h3 className="text-lg font-medium text-gray-700 mt-1">
            {test.event}
          </h3>
        </div>
      </div>

      <ul className="space-y-6 mt-8">
        {test.questions && test.questions.length > 0 ? (
          test.questions.map((q, i) => (
            <li
              key={i}
              className="border border-orange-300 rounded-md p-4 bg-orange-50 shadow-sm"
            >
              <div className="mb-3 font-medium text-orange-900">
                Q{i + 1}: {q.question}
              </div>

              {q.type === "mcq" &&
                q.choices?.map((choice, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2 px-4 py-2 mb-2 bg-orange-100 rounded-md shadow-sm border border-orange-200"
                  >
                    <span className="text-orange-600 font-semibold">
                      {String.fromCharCode(65 + j)}.
                    </span>
                    <span className="text-gray-800">{choice}</span>
                  </div>
                ))}

              <div className="text-sm text-gray-700 my-3">
                Points: <span className="font-semibold">{q.points}</span>
              </div>
              <div className="text-sm text-gray-700">
                Answer: <span className="font-semibold">{q.answer}</span>
              </div>

              {q.imageUrl && (
                <div className="mt-4 w-full flex justify-center">
                  <img
                    src={q.imageUrl}
                    alt="Attached"
                    className="max-w-lg border border-orange-300 rounded-md shadow"
                  />
                </div>
              )}
            </li>
          ))
        ) : (
          <div className="text-center italic text-orange-500">
            No questions available for this test.
          </div>
        )}
      </ul>
    </div>
  );
};

export default Test;
