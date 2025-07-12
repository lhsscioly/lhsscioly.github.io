import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import statisticsService from '../services/statistics';

const UserStatistics = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState(null);
  
  // Check if user came from /statistics page
  const [cameFromStatistics, setCameFromStatistics] = useState(false);
  
  useEffect(() => {
    // Check if the user came from the /statistics page using navigation state
    const stateFrom = location.state?.from;
    const cameFromStats = stateFrom === '/statistics';
    setCameFromStatistics(cameFromStats);
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          statisticsService.setToken(userData.token);
        }

        // Get the user ID - if no ID in params, use current user's ID
        let userId = id;

        if (userId) {
          const studentData = await statisticsService.getStudentStatistics(userId);
          setStudentStats(studentData);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.log(err.message)
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!studentStats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-800">No statistics found for this user.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 w-full mb-6 flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-orange-800">
            {`Statistics for ${studentStats.student.firstName} ${studentStats.student.lastName}`}
          </h1>
        </div>
        {user?.admin && cameFromStatistics ? (
          <div>
            <button
              onClick={() => navigate('/statistics')}
              className="px-4 py-2 text-md text-orange-500 font-bold rounded-lg hover:text-orange-600 hover:underline transition-colors"
            >
              All Statistics →
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => navigate('/review')}
              className="px-4 py-2 text-md text-orange-500 font-bold rounded-lg hover:text-orange-600 hover:underline transition-colors"
            >
              Review Tests →
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-orange-700 mb-2">Total Tests</h3>
          <p className="text-3xl font-bold text-orange-500">{studentStats.totalTests}</p>
        </div>
        
        {studentStats.bestPerformingEvent ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-2">Best Event</h3>
            <p className="text-xl font-bold text-orange-500">{studentStats.bestPerformingEvent.event}</p>
            <p className="text-sm font-semibold text-orange-700">{studentStats.bestPerformingEvent.averagePercentage}% average</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-orange-700 mb-2">Best Event</h3>
            <p className="text-xl font-bold text-orange-500">No data available</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-orange-700 mb-2">Events Participated</h3>
          <p className="text-3xl font-bold text-orange-500">{studentStats.eventStatistics.length}</p>
        </div>
      </div>

      {/* Event Statistics */}
      {studentStats.eventStatistics.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-8 pb-6">
          <div className="px-6 py-4 border-b border-orange-200">
            <h2 className="text-xl font-semibold text-orange-700">Performance by Event</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">Average Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">Most Recent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">Highest Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">Total Tests</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-200">
                {studentStats.eventStatistics.map((event) => (
                  <tr key={event.event}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-900">{event.event}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.averagePercentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.mostRecentScore}%</div>
                      <div className="text-xs text-gray-500">{event.mostRecentTest.teamName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.highestScore}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.totalTests}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* School Year Breakdown */}
      {studentStats.schoolYearStatistics.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-orange-200">
            <h2 className="text-xl font-semibold text-orange-700">Performance by School Year</h2>
          </div>
          <div className="p-6">
            {studentStats.schoolYearStatistics.map((yearData) => (
              <div key={yearData.schoolYear} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">
                  {yearData.schoolYear} ({yearData.totalTests} tests)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearData.events.map((event) => (
                    <div key={event.event} className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-medium text-orange-500">{event.event}</h4>
                      <p className="font-semibold text-sm text-orange-700">{event.averagePercentage}% average</p>
                      <p className="font-semibold text-xs text-orange-800">{event.tests} tests</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {studentStats.eventStatistics.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="font-bold text-orange-500">No test submissions found.</p>
          <p className="font-semibold text-sm text-gray-400 mt-2">Statistics will appear once you submit and get graded tests.</p>
        </div>
      )}

      {/* Bottom navigation button for admins */}
      {user?.admin && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => {
              if (cameFromStatistics) {
                navigate('/statistics');
              } else {
                navigate('/review');
              }
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          >
            {cameFromStatistics ? 'Back to All Statistics' : 'Back to Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserStatistics;
