import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AssignedTests = ({ tests, user, users }) => {
  const [assigned, setAssigned] = useState([]);

  useEffect(() => {
    if (tests && user && users) {
      const currentUser = users.find((u) => u.id === user.id);
      const userTeamIds = currentUser?.teams?.map((t) => t.id) || [];
      console.log(userTeamIds);
      console.log(tests);

      const assignedTests = tests.filter((test) =>
        test.assignees?.some((assignee) => userTeamIds.includes(assignee)),
      );

      setAssigned(assignedTests);
    }
  }, [tests, user, users]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-medium text-orange-800 mb-4 text-left">
        Assigned Tests
      </h2>
      {assigned.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          You don’t have any assigned tests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {assigned.map((test) => (
            <li
              key={test.id}
              className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <p className="text-sm text-orange-700 font-semibold">
                    {test.school} {test.year} - {test.event}
                  </p>
                </div>
                <Link
                  to={`/assigned/${test.id}`}
                  className="text-sm text-orange-600 hover:underline"
                >
                  Take Test →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssignedTests;
