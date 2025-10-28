import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import submissionService from "../services/submissions";
import testService from "../services/tests";

// UI component showing all tests taken by students to admins
const AllTests = ({ user }) => {
  if (!user) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user.admin) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-medium text-red-800 mb-4 text-center">
          Access Denied
        </h2>
        <p className="text-center text-gray-600">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }
  
  return <AllTestsContent user={user} />;
};

const AllTestsContent = ({ user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [schoolYearFilter, setSchoolYearFilter] = useState("all");
  const [availableSchoolYears, setAvailableSchoolYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // The following blocks of code fetch all test data with relevant school years and filters
  useEffect(() => {
    const fetchAllData = async () => {
      const loggedUser = localStorage.getItem("loggedAppUser");
      if (loggedUser) {
        const userData = JSON.parse(loggedUser);
        submissionService.setToken(userData.token);
        testService.setToken(userData.token);
      }

      try {
        const [allSubmissions, allTests] = await Promise.all([
          submissionService.getAll(),
          testService.getAll(),
        ]);

        setSubmissions(allSubmissions);
        setTests(allTests);

        const years = [
          ...new Set(
            allSubmissions.map((sub) => sub.schoolYear).filter(Boolean),
          ),
        ].sort((a, b) => {
          const yearA = parseInt(a.split("-")[0]);
          const yearB = parseInt(b.split("-")[0]);
          return yearB - yearA;
        });
        setAvailableSchoolYears(years);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getFilteredSubmissions = () => {
    return submissions.filter((submission) => {
      if (filter === "graded" && !submission.graded) return false;
      if (filter === "ungraded" && submission.graded) return false;

      if (schoolYearFilter !== "all") {
        const submissionYear = submission.schoolYear;
        if (submissionYear !== schoolYearFilter) return false;
      }

      // Various different search terms, unlike filters in other components
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const testName =
          `${submission.test?.school || ""} ${submission.test?.year || ""} ${submission.test?.event || ""}`.toLowerCase();
        const teamName = submission.team?.name?.toLowerCase() || "";

        // Get students in multiple ways in case teams were deleted
        let studentNames = "";

        let students = submission.team?.students;

        if (!students || (Array.isArray(students) && students.length === 0)) {
          students = submission.users;
        }

        if (students && Array.isArray(students)) {
          studentNames = students
            .filter(
              (student) =>
                student &&
                typeof student === "object" &&
                student.firstName &&
                student.lastName,
            )
            .map((student) => `${student.firstName} ${student.lastName}`.trim())
            .join(" ")
            .toLowerCase();
        }

        if (
          !testName.includes(search) &&
          !teamName.includes(search) &&
          !studentNames.includes(search)
        ) {
          return false;
        }
      }

      return true;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssignedTests = () => {
    return tests.filter((test) => test.assignees && test.assignees.length > 0);
  };

  const getSubmissionStats = () => {
    const filtered = getFilteredSubmissions();
    const graded = filtered.filter((s) => s.graded).length;
    const ungraded = filtered.filter((s) => !s.graded).length;
    return { total: filtered.length, graded, ungraded };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredSubmissions = getFilteredSubmissions();
  const stats = getSubmissionStats();

  // Divided into ungraded, graded, and submitted tests
  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md space-y-8">
      <h2 className="text-2xl font-medium text-orange-800 mb-4 text-left">
        All Test Submissions
      </h2>

      <div className="bg-orange-50 p-4 rounded-lg space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-orange-700">
              Status:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-orange-400 focus:ring-2 appearance-none"
            >
              <option value="all">All Tests</option>
              <option value="graded">Graded Only</option>
              <option value="ungraded">Ungraded Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-orange-700">
              School Year:
            </label>
            <select
              value={schoolYearFilter}
              onChange={(e) => setSchoolYearFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-orange-400 focus:ring-2 appearance-none"
            >
              <option value="all">All Years</option>
              {availableSchoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-orange-700">
              Search:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Test, event, team, or student name..."
              className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-orange-400 focus:ring-2"
            />
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          No test submissions found.
        </p>
      ) : filteredSubmissions.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          No submissions match your filters. Try adjusting your search criteria.
        </p>
      ) : (
        <>
          <div>
            <h3 className="text-xl font-medium text-green-700 mb-4 text-left border-b border-green-200 pb-2">
              Graded Tests ({filteredSubmissions.filter((s) => s.graded).length}
              )
            </h3>
            {filteredSubmissions.filter((s) => s.graded).length === 0 ? (
              <p className="text-gray-500 italic pl-4">
                No graded tests match your filters.
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredSubmissions
                  .filter((s) => s.graded)
                  .map((submission) => (
                    <li
                      key={submission.id}
                      className="bg-green-50 border border-green-200 rounded-md px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="text-sm text-green-700 font-semibold">
                            {submission.test?.random
                              ? `Random Test - ${submission.test?.event}`
                              : `${submission.test?.school || ''} ${submission.test?.year || ''}`.trim() 
                                ? `${submission.test?.school || ''} ${submission.test?.year || ''}`.trim() + ` - ${submission.test?.event}`
                                : `Test - ${submission.test?.event}`}
                          </p>
                          <p className="text-xs text-green-600">
                            Team: {submission.team?.name} • Score:{" "}
                            {submission.totalScore}/{submission.maxScore} (
                            {(
                              (submission.totalScore / submission.maxScore) *
                              100
                            ).toFixed(1)}
                            %)
                          </p>
                          <p className="text-xs text-gray-500">
                            Students:{" "}
                            {(() => {
                              let students = null;

                              if (submission.team?.students) {
                                students = submission.team.students;
                              } else if (submission.users) {
                                students = submission.users;
                              }

                              if (
                                !students ||
                                !Array.isArray(students) ||
                                students.length === 0
                              ) {
                                return "No students found";
                              }

                              const names = students
                                .filter(
                                  (student) =>
                                    student &&
                                    typeof student === "object" &&
                                    student.firstName &&
                                    student.lastName,
                                )
                                .map((student) =>
                                  `${student.firstName} ${student.lastName}`.trim(),
                                );

                              return names.length > 0
                                ? names.join(", ")
                                : "No students with names found";
                            })()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted:{" "}
                            {formatDate(
                              submission.submittedAt || submission.createdAt,
                            )}
                          </p>
                        </div>
                        <Link
                          to={`/review/${submission.id}`}
                          state={{ from: "/review/all" }}
                          className="text-sm text-green-600 hover:underline font-medium"
                        >
                          View Results →
                        </Link>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-xl font-medium text-orange-700 mb-4 text-left border-b border-orange-200 pb-2">
              Ungraded Tests (
              {filteredSubmissions.filter((s) => !s.graded).length})
            </h3>
            {filteredSubmissions.filter((s) => !s.graded).length === 0 ? (
              <p className="text-gray-500 italic pl-4">
                No ungraded tests match your filters.
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredSubmissions
                  .filter((s) => !s.graded)
                  .map((submission) => (
                    <li
                      key={submission.id}
                      className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="text-sm text-orange-700 font-semibold">
                            {submission.test?.random
                              ? `Random Test - ${submission.test?.event}`
                              : `${submission.test?.school || ''} ${submission.test?.year || ''}`.trim() 
                                ? `${submission.test?.school || ''} ${submission.test?.year || ''}`.trim() + ` - ${submission.test?.event}`
                                : `Test - ${submission.test?.event}`}
                          </p>
                          <p className="text-xs text-orange-600">
                            Team: {submission.team?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Students:{" "}
                            {(() => {
                              let students = null;

                              if (submission.team?.students) {
                                students = submission.team.students;
                              } else if (submission.users) {
                                students = submission.users;
                              }

                              if (
                                !students ||
                                !Array.isArray(students) ||
                                students.length === 0
                              ) {
                                return "No students found";
                              }

                              const names = students
                                .filter(
                                  (student) =>
                                    student &&
                                    typeof student === "object" &&
                                    student.firstName &&
                                    student.lastName,
                                )
                                .map((student) =>
                                  `${student.firstName} ${student.lastName}`.trim(),
                                );

                              return names.length > 0
                                ? names.join(", ")
                                : "No students with names found";
                            })()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted:{" "}
                            {formatDate(
                              submission.submittedAt || submission.createdAt,
                            )}
                          </p>
                        </div>
                        <Link
                          to={`/review/${submission.id}`}
                          state={{ from: "/review/all" }}
                          className="text-sm text-orange-600 hover:underline font-medium"
                        >
                          Grade Test →
                        </Link>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-xl font-medium text-red-700 mb-4 text-left border-b border-red-200 pb-2">
              Assigned Tests ({getAssignedTests().length})
            </h3>
            {getAssignedTests().length === 0 ? (
              <p className="text-gray-500 italic pl-4">
                No tests have been assigned to teams.
              </p>
            ) : (
              <ul className="space-y-3">
                {getAssignedTests().map((test) => (
                  <li
                    key={test.id}
                    className="bg-red-50 border border-red-200 rounded-md px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm text-red-700 font-semibold">
                        {test.random
                          ? `Random Test - ${test.event}`
                          : `${test.school || ''} ${test.year || ''}`.trim() 
                            ? `${test.school || ''} ${test.year || ''}`.trim() + ` - ${test.event}`
                            : `Test - ${test.event}`}
                      </p>
                      <p className="text-xs text-red-600">
                        Assigned to {test.assignees.length} team(s):{" "}
                        {test.assignees && test.assignees.length > 0
                          ? test.assignees
                              .map((team) => team.name || team)
                              .join(", ")
                          : "No teams"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AllTests;
