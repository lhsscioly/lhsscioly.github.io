import { useState, useEffect } from "react";
import { useMatch } from "react-router-dom";

const TakeTest = ({ tests, user, users, teams }) => {
  const [test, setTest] = useState(null);
  const match = useMatch("/assigned/:id");
  const testId = match ? match.params.id : null;

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

  return (
    <div>
      <h2>School</h2>
      {test && <p>Taking test with ID: {test.id}</p>}
    </div>
  );
};

export default TakeTest;