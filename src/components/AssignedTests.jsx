import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import answerService from "../services/answers";
import submissionService from "../services/submissions";

const AssignedTests = ({ tests, user, users, teams }) => {
  const [assigned, setAssigned] = useState([]);
  const [testStates, setTestStates] = useState({}); // Track which tests are started

  useEffect(() => {
    if (tests && user && users) {
      const currentUser = users.find((u) => u.id === user.id);
      const userTeamIds = currentUser?.teams?.map((t) => t.id) || [];
      console.log(userTeamIds);
      console.log(tests);

      const assignedTests = tests.filter((test) =>
        test.assignees.some((assignee) => {
          const assigneeId =
            typeof assignee === "object" ? assignee.id : assignee;
          const isAssigned = userTeamIds.includes(assigneeId);
          return isAssigned;
        }),
      );

      setAssigned(assignedTests);
    }
  }, [tests, user, users]);

  // Check if tests have been started (have answers)
  useEffect(() => {
    const checkTestStates = async () => {
      if (assigned.length > 0 && teams && user) {
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
          submissionService.setToken(userData.token);
        }

        const states = {};

        for (const test of assigned) {
          // Find user's team for this test
          const userTeam = teams.find(
            (team) =>
              team &&
              team.event === test.event &&
              team.students &&
              Array.isArray(team.students) &&
              team.students.some(
                (student) => student && student.id === user.id,
              ),
          );

          if (userTeam) {
            try {
              // First check if submitted
              const submissionCheck = await submissionService.checkSubmission(
                test.id,
                userTeam.id,
              );
              if (submissionCheck.submitted) {
                states[test.id] = "submitted";
              } else {
                // Check if started
                const existingAnswers = await answerService.getByTestAndTeam(
                  test.id,
                  userTeam.id,
                );
                states[test.id] = existingAnswers ? "started" : "not_started";
              }
            } catch (error) {
              // If we get 404, the test hasn't been started
              states[test.id] = "not_started";
            }
          } else {
            states[test.id] = "no_team";
          }
        }

        setTestStates(states);
      }
    };

    checkTestStates();
  }, [assigned, teams, user]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-medium text-orange-800 mb-4 text-left">
        Assigned Tests
      </h2>
      {assigned.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          You currently have no assigned tests.
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
                    {test.random
                      ? `Random Test - ${test.event}`
                      : `${test.school || ''} ${test.year || ''}`.trim() 
                        ? `${test.school || ''} ${test.year || ''}`.trim() + ` - ${test.event}`
                        : `Test - ${test.event}`}
                  </p>
                  {testStates[test.id] === "submitted" && (
                    <p className="text-xs text-green-600 font-medium">
                      Submitted
                    </p>
                  )}
                </div>
                {testStates[test.id] === "submitted" ? (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Completed
                  </span>
                ) : (
                  <Link
                    to={`/assigned/${test.id}`}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    {testStates[test.id] === "started"
                      ? "Continue Test"
                      : "Take Test"}{" "}
                    →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssignedTests;
