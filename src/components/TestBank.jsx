import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// UI component for displaying all available tests

const TestBank = (props) => {
  const [tests, setTests] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Gathers all tests according to relevant selected filters
  useEffect(() => {
    const filtered = props.tests.filter(
      (t) =>
        !t.random &&
        t.event.includes(eventFilter) &&
        t.school.includes(schoolFilter) &&
        t.year.toString().includes(yearFilter),
    );
    setTests(filtered);
  }, [eventFilter, schoolFilter, yearFilter, props.tests]);

  const resetFilters = () => {
    setEventFilter("");
    setSchoolFilter("");
    setYearFilter("");
  };

  if (!props.user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white border border-orange-200 rounded-md p-6 shadow-md">
        <h2 className="text-2xl font-medium text-orange-800 mb-6">Test Bank</h2>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-orange-800">
              Event
            </label>
            <select
              value={eventFilter}
              onChange={({ target }) => setEventFilter(target.value)}
              className="p-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
            >
              <option key="all" value="">
                All
              </option>
              {props.events.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-orange-800">
              School
            </label>
            <select
              value={schoolFilter}
              onChange={({ target }) => setSchoolFilter(target.value)}
              className="p-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
            >
              <option key="all" value="">
                All
              </option>
              {[...new Set(tests.map((t) => t.school))].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-orange-800">
              Year
            </label>
            <select
              value={yearFilter}
              onChange={({ target }) => setYearFilter(target.value)}
              className="p-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
            >
              <option key="all" value="">
                All
              </option>
              {[...new Set(tests.map((t) => t.year))].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="bg-orange-200 hover:bg-orange-300 text-orange-900 font-medium px-4 py-2 rounded-md transition w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* List of tests */}
        
        {tests.length > 0 ? (
          <div className="flex flex-col space-y-3">
            {tests.map((t) => (
              <Link to={`/tests/${t.id}`} key={t.id}>
                <div className="flex justify-between items-center border border-orange-200 border-2 rounded-lg p-4 hover:bg-orange-100 transition">
                  <div>
                    <p className="text-base font-semibold text-orange-800">
                      {t.school} {t.year}
                    </p>
                    <p className="text-sm text-orange-700">{t.event}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-orange-700 mb-3 italic">No tests found.</p>
            <Link
              to="/tests/create"
              className="inline-block bg-orange-200 text-orange-800 font-medium px-4 py-2 rounded-md hover:bg-orange-300 transition"
            >
              Add a Test
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestBank;
