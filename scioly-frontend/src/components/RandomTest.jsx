import { useState } from "react";
import testService from "../services/tests";

const RandomTest = (props) => {
  const [event, setEvent] = useState("");
  const [questions, setQuestions] = useState([]);
  const [numMCQ, setNumMCQ] = useState("20");
  const [numSAQ, setNumSAQ] = useState("20");
  const [numLEQ, setNumLEQ] = useState("10");

  if (!props.user) return null;

  if (!props.questions || props.questions.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const create = async () => {
    if (!event) {
      props.setError("Please select an event.");
      setTimeout(() => props.setError(null), 5000);
      return;
    }

    if (numMCQ.length === 0 || numSAQ.length === 0 || numLEQ.length === 0) {
      props.setError("Please enter valid numbers for question counts.");
      setTimeout(() => props.setError(null), 5000);
      return;
    }

    if (
      isNaN(Number(numMCQ)) ||
      isNaN(Number(numSAQ)) ||
      isNaN(Number(numLEQ))
    ) {
      props.setError("Please enter valid numbers for question counts.");
      setTimeout(() => props.setError(null), 5000);
      return;
    }

    try {
      const mcqQuestions = props.questions.filter(
        (q) => q.event === event && q.type === "mcq",
      );
      const shortAnswerQuestions = props.questions.filter(
        (q) => q.event === event && q.type === "saq",
      );
      const leqQuestions = props.questions.filter(
        (q) => q.event === event && q.type === "leq",
      );

      const selected = [
        ...mcqQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, Number(numMCQ)),
        ...shortAnswerQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, Number(numSAQ)),
        ...leqQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, Number(numLEQ)),
      ];

      setQuestions(selected);
    } catch (error) {
      console.error("Error creating test:", error);
    }
  };

  const handleAssign = async () => {
    if (questions.length === 0) {
      props.setError("No questions generated to assign.");
      setTimeout(() => {
        props.setError(null);
      }, 5000);
      return;
    }

    const testObject = {
      event,
      random: true,
      questions: questions.map((q) => q.id),
    };

    try {
      if (!props.teams || props.teams.length === 0) {
        props.setError("No teams available to assign this test.");
        setTimeout(() => {
          props.setError(null);
        }, 5000);
        return;
      }
      const createdTest = await testService.createTest(testObject);
      if (createdTest) {
        const savedTest = await testService.updateTest(createdTest.id, {
          assignees: teams
            .filter((t) => t.event === test.event)
            .map((t) => t.id),
        });
        props.setNotif("Test assigned successfully!");
        setTimeout(() => {
          props.setNotif(null);
        }, 5000);
        props.setTests(tests.concat(savedTest));
      }
      setQuestions([]);
    } catch (error) {
      console.error("Error assigning test:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-semibold text-orange-800">
        Create Random Practice Test
      </h2>

      <div className="grid-cols-2 gap-4">
        <label className="text-sm font-medium text-orange-700">Event</label>
        <select
          value={event}
          onChange={({ target }) => setEvent(target.value)}
          className="w-full px-4 py-2 mt-2 mb-4 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select Event</option>
          {props.events.map((event) => (
            <option key={event.name} value={event.name}>
              {event.name}
            </option>
          ))}
        </select>

        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-orange-700">
              # of MCQs
            </label>
            <input
              type="number"
              min="0"
              value={numMCQ}
              onChange={(e) => setNumMCQ(e.target.value)}
              className="px-3 py-2 border border-orange-300 rounded-md"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-orange-700">
              # of SAQs
            </label>
            <input
              type="number"
              min="0"
              value={numSAQ}
              onChange={(e) => setNumSAQ(e.target.value)}
              className="px-3 py-2 border border-orange-300 rounded-md"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-orange-700">
              # of LEQs
            </label>
            <input
              type="number"
              min="0"
              value={numLEQ}
              onChange={(e) => setNumLEQ(e.target.value)}
              className="px-3 py-2 border border-orange-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={create}
          className="bg-orange-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-700 transition"
        >
          Generate
        </button>
      </div>

      {questions.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-orange-700">
              Generated Questions
            </h3>
            <button
              onClick={handleAssign}
              className="bg-amber-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-amber-700 transition"
            >
              Assign Test
            </button>
          </div>
          <ul className="space-y-3 mb-6">
            {questions.map((question, index) => (
              <li
                key={index}
                className="bg-orange-50 border border-orange-200 rounded-md p-4 text-gray-800 shadow-sm"
              >
                Q{index + 1}: {question.question}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RandomTest;
