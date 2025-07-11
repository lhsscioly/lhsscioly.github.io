import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import submissionService from "../services/submissions";
import statisticsService from "../services/statistics";

const ReviewTests = ({ user, users, teams }) => {
  const [submissions, setSubmissions] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (user && users && teams) {
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          submissionService.setToken(userData.token);
          statisticsService.setToken(userData.token);
        }

        try {
          const currentUser = users.find((u) => u.id === user.id);
          const userTeams = currentUser?.teams || [];
          const currentTeamIds = userTeams.map(team => team.id);

          // Get submissions for all user's current teams
          const allSubmissions = [];
          for (const team of userTeams) {
            try {
              const teamSubmissions = await submissionService.getByTeam(team.id);
              allSubmissions.push(...teamSubmissions);
            } catch (error) {
              console.log(`No submissions found for team ${team.id}`);
            }
          }

          // Get all historical submissions for this user (across all teams, including deleted ones)
          console.log("Attempting to fetch user submissions for user:", user.id);
          const allUserSubmissions = await statisticsService.getUserSubmissions(user.id);
          console.log("User submissions response:", allUserSubmissions);
          
          // Filter out current team submissions from historical submissions
          const currentSubmissionIds = new Set(allSubmissions.map(s => s.id));
          const historicalSubmissions = allUserSubmissions.filter(
            s => !currentSubmissionIds.has(s.id)
          );

          setSubmissions(allSubmissions);
          setUserSubmissions(historicalSubmissions);
        } catch (error) {
          console.error("Error fetching submissions:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, users, teams]);

  // Separate graded and ungraded submissions
  const gradedSubmissions = submissions.filter(submission => submission.graded);
  const ungradedSubmissions = submissions.filter(submission => !submission.graded);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md space-y-8">
      <h2 className="text-2xl font-medium text-orange-800 mb-4 text-left">
        Review Tests
      </h2>

      {submissions.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          You haven't submitted any tests yet.
        </p>
      ) : (
        <>
          {/* Graded Submissions Section */}
          <div>
            <h3 className="text-xl font-medium text-green-700 mb-4 text-left border-b border-green-200 pb-2">
              Graded Tests ({gradedSubmissions.length})
            </h3>
            {gradedSubmissions.length === 0 ? (
              <p className="text-gray-500 italic pl-4">No graded tests yet.</p>
            ) : (
              <ul className="space-y-3">
                {gradedSubmissions.map((submission) => (
                  <li
                    key={submission.id}
                    className="bg-green-50 border border-green-200 rounded-md px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-green-700 font-semibold">
                          {submission.test?.random
                            ? `Random Test - ${submission.test?.event}`
                            : `${submission.test?.school} ${submission.test?.year} - ${submission.test?.event}`}
                        </p>
                        <p className="text-xs text-green-600">
                          Team: {submission.team?.name} • Score: {submission.totalScore}/{submission.maxScore}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/review/${submission.id}`}
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

          {/* Ungraded Submissions Section */}
          <div>
            <h3 className="text-xl font-medium text-orange-700 mb-4 text-left border-b border-orange-200 pb-2">
              Pending Grading ({ungradedSubmissions.length})
            </h3>
            {ungradedSubmissions.length === 0 ? (
              <p className="text-gray-500 italic pl-4">No tests pending grading.</p>
            ) : (
              <ul className="space-y-3">
                {ungradedSubmissions.map((submission) => (
                  <li
                    key={submission.id}
                    className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-orange-700 font-semibold">
                          {submission.test?.random
                            ? `Random Test - ${submission.test?.event}`
                            : `${submission.test?.school} ${submission.test?.year} - ${submission.test?.event}`}
                        </p>
                        <p className="text-xs text-orange-600">
                          Team: {submission.team?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/review/${submission.id}`}
                        className="text-sm text-orange-600 hover:underline font-medium"
                      >
                        View Submission →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Historical Submissions Section (from previous teams) */}
          {userSubmissions.length > 0 && (
            <div>
              <h3 className="text-xl font-medium text-blue-700 mb-4 text-left border-b border-blue-200 pb-2">
                Historical Tests ({userSubmissions.length})
              </h3>
              <p className="text-sm text-gray-600 mb-4 italic">
                Tests you took in previous teams or school years
              </p>
              <ul className="space-y-3">
                {userSubmissions.map((submission) => (
                  <li
                    key={submission.id}
                    className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-sm text-blue-700 font-semibold">
                          {submission.test?.random
                            ? `Random Test - ${submission.test?.event}`
                            : `${submission.test?.school} ${submission.test?.year} - ${submission.test?.event}`}
                        </p>
                        <p className="text-xs text-blue-600">
                          Team: {submission.team?.name} • School Year: {submission.schoolYear}
                          {submission.graded && (
                            <span> • Score: {submission.totalScore}/{submission.maxScore}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/review/${submission.id}`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        View Submission →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewTests;