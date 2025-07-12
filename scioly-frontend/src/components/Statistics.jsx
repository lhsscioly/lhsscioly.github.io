import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import statisticsService from '../services/statistics';
import teamsService from '../services/teams';

const Statistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [yearUsers, setYearUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          statisticsService.setToken(userData.token);
          teamsService.setToken(userData.token);
        }

        // Fetch overall statistics and teams
        const [statsData, teamsData] = await Promise.all([
          statisticsService.getOverallStatistics(),
          teamsService.getAll()
        ]);
        
        setOverallStats(statsData);
        setTeams(teamsData);
        setSelectedSchoolYear(statsData.selectedSchoolYear || '');
        
        // Get users from the selected school year
        if (statsData.selectedSchoolYear) {
          updateYearUsers(teamsData, statsData.selectedSchoolYear);
        }
      } catch (err) {
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateYearUsers = (teamsData, schoolYear) => {
    // Get all unique users from teams in the selected school year
    const usersSet = new Set();
    const usersMap = new Map();
    
    teamsData
      .filter(team => team.schoolYear === schoolYear)
      .forEach(team => {
        team.students?.forEach(student => {
          if (!usersSet.has(student.id)) {
            usersSet.add(student.id);
            usersMap.set(student.id, {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              teams: []
            });
          }
          usersMap.get(student.id).teams.push(team.name);
        });
      });
    
    setYearUsers(Array.from(usersMap.values()));
  };

  const handleSchoolYearChange = async (schoolYear) => {
    try {
      setLoading(true);
      
      // Ensure token is set before making API calls
      const loggedUser = localStorage.getItem("loggedAppUser");
      if (loggedUser) {
        const userData = JSON.parse(loggedUser);
        statisticsService.setToken(userData.token);
      }
      
      const statsData = await statisticsService.getOverallStatistics(schoolYear);
      setOverallStats(statsData);
      setSelectedSchoolYear(schoolYear);
      updateYearUsers(teams, schoolYear);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    navigate(`/statistics/${userId}`, { state: { from: '/statistics' } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center bg-white rounded-lg p-6 justify-between mb-6">
        <h1 className="text-2xl font-semibold text-orange-800">Statistics Overview</h1>
        
        {/* School Year Selector */}
        {overallStats && overallStats.availableSchoolYears.length > 0 && (
          <div className="flex items-center space-x-3">
            <label htmlFor="schoolYear" className="text-sm font-medium text-orange-800">
              School Year:
            </label>
            <select
              id="schoolYear"
              value={selectedSchoolYear}
              onChange={(e) => handleSchoolYearChange(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {overallStats.availableSchoolYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Event Statistics */}
      {overallStats && overallStats.eventStatistics.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-8 pb-6">
          <div className="px-6 py-4 border-b border-orange-200">
            <h2 className="text-xl font-semibold text-orange-700">
              Performance by Event - {selectedSchoolYear}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Average Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Highest Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Lowest Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-500 uppercase tracking-wider">Submissions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-200">
                {overallStats.eventStatistics.map((event, index) => (
                  <tr key={event.event}>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-orange-900">{event.event}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.averagePercentage}%</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.highestScore}%</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.lowestScore}%</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.totalSubmissions}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Students from Selected Year */}
      {yearUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-orange-200">
            <h2 className="text-xl font-semibold text-orange-700">
              Students in {selectedSchoolYear}
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {yearUsers.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleUserSelect(student.id)}
                  className="text-left p-4 border border-orange-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <div className="text-sm text-orange-700">{student.firstName} {student.lastName}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {overallStats && overallStats.eventStatistics.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-orange-500">No statistics available for {selectedSchoolYear || 'the selected school year'}.</p>
          <p className="text-sm text-gray-900 mt-2">Statistics are only shown for graded submissions.</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;
