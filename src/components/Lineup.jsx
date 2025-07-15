import { useState, useEffect } from "react";
import TeamAssignmentCell from "./TeamAssignmentCell";
import teamService from "../services/teams";

const Lineup = ({ user, users, events, teams, setTeams }) => {
  const [block1, setBlock1] = useState([]);
  const [block2, setBlock2] = useState([]);
  const [block3, setBlock3] = useState([]);
  const [block4, setBlock4] = useState([]);
  const [block5, setBlock5] = useState([]);
  const [selfSchedule, setSelfSchedule] = useState([]);

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    // Extract IDs if objects, otherwise use as-is
    const extractIds = (arr) =>
      arr.map((item) => (typeof item === "object" ? item.id : item));
    const sortedA = extractIds(a).sort();
    const sortedB = extractIds(b).sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  const onSave = async (eventName, assignments) => {
    const currVarsity = teams.find(
      (t) => t.event === eventName && t.name === "Varsity",
    );
    const currJuniorVarsity = teams.find(
      (t) => t.event === eventName && t.name === "JV",
    );
    const currJuniorVarsity2 = teams.find(
      (t) => t.event === eventName && t.name === "JV2",
    );

    try {
      if (assignments.orange.length > 0) {
        if (!currVarsity) {
          console.log("Creating new Varsity team for", eventName);
          const newTeam = await teamService.createTeam({
            event: eventName,
            name: "Varsity",
            students: assignments.orange.map((u) => u.id),
          });
          setTeams(teams.concat(newTeam));
        } else {
          if (
            !arraysEqual(
              currVarsity.students,
              assignments.orange.map((u) => u.id),
            )
          ) {
            console.log("Updating Varsity team for", eventName);
            const updatedTeam = await teamService.changeTeam(currVarsity.id, {
              students: assignments.orange.map((u) => u.id),
            });
            setTeams(
              teams.map((t) => (t.id === currVarsity.id ? updatedTeam : t)),
            );
          }
        }
      } else {
        if (currVarsity) {
          console.log("Deleting Varsity team for", eventName);
          const deletedTeam = await teamService.deleteTeam(currVarsity.id);
          if (deletedTeam) {
            setTeams(teams.filter((t) => t.id !== deletedTeam.id));
          }
        }
      }

      if (assignments.black.length > 0) {
        if (!currJuniorVarsity) {
          console.log("Creating new JV team for", eventName);
          const newTeam = await teamService.createTeam({
            event: eventName,
            name: "JV",
            students: assignments.black.map((u) => u.id),
          });
          setTeams(teams.concat(newTeam));
        } else {
          if (
            !arraysEqual(
              currJuniorVarsity.students,
              assignments.black.map((u) => u.id),
            )
          ) {
            console.log("Updating JV team for", eventName);
            const updatedTeam = await teamService.changeTeam(
              currJuniorVarsity.id,
              { students: assignments.black.map((u) => u.id) },
            );
            setTeams(
              teams.map((t) => (t.id === currJuniorVarsity.id ? updatedTeam : t)),
            );
          }
        }
      } else {
        if (currJuniorVarsity) {
          console.log("Deleting JV team for", eventName);
          const deletedTeam = await teamService.deleteTeam(
            currJuniorVarsity.id,
          );
          if (deletedTeam) {
            setTeams(teams.filter((t) => t.id !== deletedTeam.id));
          }
        }
      }

      if (assignments.white.length > 0) {
        if (!currJuniorVarsity2) {
          console.log("Creating new JV2 team for", eventName);
          const newTeam = await teamService.createTeam({
            event: eventName,
            name: "JV2",
            students: assignments.white.map((u) => u.id),
          });
          setTeams(teams.concat(newTeam));
        } else {
          if (
            !arraysEqual(
              currJuniorVarsity2.students,
              assignments.white.map((u) => u.id),
            )
          ) {
            console.log("Updating JV2 team for", eventName);
            const updatedTeam = await teamService.changeTeam(
              currJuniorVarsity2.id,
              { students: assignments.white.map((u) => u.id) },
            );
            setTeams(
              teams.map((t) =>
                t.id === currJuniorVarsity2.id ? updatedTeam : t,
              ),
            );
          }
        }
      } else {
        if (currJuniorVarsity2) {
          console.log("Deleting JV2 team for", eventName);
          const deletedTeam = await teamService.deleteTeam(
            currJuniorVarsity2.id,
          );
          if (deletedTeam) {
            setTeams(teams.filter((t) => t.id !== deletedTeam.id));
          }
        }
      }
      console.log("Team assignments saved successfully for", eventName);
    } catch (error) {
      console.error("Full error object:", error);
      if (error.response && error.response.data) {
        console.error(`API Error: ${error.response.data.error}`);
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.message) {
        console.error("Error message:", error.message);
      } else {
        console.error(
          "An unexpected error occurred while saving team assignments:",
          error,
        );
      }
      // Re-throw the error so it can be caught by the calling component
      throw error;
    }
  };

  useEffect(() => {
    if (events) {
      setBlock1(events.filter((e) => e.block === "1"));
      setBlock2(events.filter((e) => e.block === "2"));
      setBlock3(events.filter((e) => e.block === "3"));
      setBlock4(events.filter((e) => e.block === "4"));
      setBlock5(events.filter((e) => e.block === "5"));
      setSelfSchedule(events.filter((e) => e.block === ""));
    }
  }, [events]);

  const renderBlock = (title, data) => (
    <div key={title} className="bg-white shadow rounded-lg p-4 flex flex-col">
      <h3 className="text-lg font-semibold text-orange-700 mb-3 text-center border-b border-orange-200 pb-1">
        {title}
      </h3>
      <div className="space-y-3 min-h-[360px]">
        {data.map((event) => (
          <TeamAssignmentCell
            key={event.id}
            event={event}
            users={users}
            teams={teams.filter((t) => t.event === event.name)}
            user={user}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );

  if (!user) {
    return;
  }

  if (!users || !teams || !events) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 space-y-10">
      <h2 className="w-full text-center font-semibold text-2xl text-orange-800 mb-6 bg-white rounded-lg shadow-lg p-4">
        Team Lineup
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderBlock("Block 1", block1)}
        {renderBlock("Block 2", block2)}
        {renderBlock("Block 3", block3)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderBlock("Block 4", block4)}
        {renderBlock("Block 5", block5)}
        {renderBlock("Self Schedule", selfSchedule)}
      </div>
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h3 className="text-lg font-semibold text-orange-700 border-b border-orange-200 pb-2 mb-4 text-center">
          Events Per Student
        </h3>
        <div className="flex flex-wrap gap-3">
          {users
            .filter((u) => u.teams && u.teams.length > 0)
            .map((user) => (
              <div
                key={user.id}
                className="bg-orange-50 border border-orange-200 rounded-md px-3 py-2 text-sm text-orange-800 shadow-sm"
              >
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                : {user.teams.length}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Lineup;
