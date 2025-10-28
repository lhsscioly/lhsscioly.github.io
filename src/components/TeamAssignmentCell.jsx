import { useState, useEffect } from "react";

// UI component for each event's teams in a lineup

const TeamAssignmentCell = ({ event, users, teams, onSave, user }) => {

  const [assignments, setAssignments] = useState({
    orange: [],
    black: [],
    white: [],
  });

  // Holds history of assignments in case user cancels edits
  const [originalAssignments, setOriginalAssignments] = useState({
    orange: [],
    black: [],
    white: [],
  });

  const [inputs, setInputs] = useState({
    orange: "",
    black: "",
    white: "",
  });

  const [showWhite, setShowWhite] = useState(false);
  const [originalShowWhite, setOriginalShowWhite] = useState(false);
  const [editing, setEditing] = useState(false);

  // Get current teams
  useEffect(() => {
    const grouped = {
      orange: [],
      black: [],
      white: [],
    };
    grouped.orange = teams.find((t) => t.name === "Varsity")?.students || [];
    grouped.black = teams.find((t) => t.name === "JV")?.students || [];
    grouped.white = teams.find((t) => t.name === "JV2")?.students || [];

    setAssignments({ ...grouped });
    setOriginalAssignments({ ...grouped });
    const whiteVisible = grouped.white.length > 0;
    setShowWhite(whiteVisible);
    setOriginalShowWhite(whiteVisible);
  }, [teams]);

  // Handles adding user to a team
  // Has a convenient system where only part of the name is needed.
  const handleAdd = (teamType) => {
    const name = inputs[teamType].trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.firstName.toLowerCase().includes(name) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(name),
    );

    if (user && !assignments[teamType].some((u) => u.id === user.id)) {
      setAssignments((prev) => ({
        ...prev,
        [teamType]: [...prev[teamType], user],
      }));
      setInputs((prev) => ({ ...prev, [teamType]: "" }));
    }
  };

  const handleDelete = (teamType, userId) => {
    setAssignments((prev) => ({
      ...prev,
      [teamType]: prev[teamType].filter((u) => u.id !== userId),
    }));
  };

  // Team assignments for JV and Varsity teams, with optional JV2 team
  const renderTeamBlock = (teamType, label, bgColor, textColor) => (
    <div className="w-full">
      <div
        className={`text-[10px] font-bold py-1 px-1 rounded-t text-center ${bgColor} ${textColor}`}
      >
        {label}
      </div>
      <div
        className="bg-white border border-gray-200 rounded-b px-1 py-1 space-y-1 min-h-[40px]"
        onClick={() =>
          editing &&
          document.getElementById(`${event.id}-${teamType}-input`)?.focus()
        }
      >
        {assignments[teamType].map((u) => (
          <div
            key={u.id}
            className="flex justify-between items-center text-[10px] bg-orange-50 px-1 py-[2px] rounded"
          >
            <span className="truncate">
              {u.firstName} {u.lastName}
            </span>
            {editing && (
              <button
                className="text-gray-400 hover:text-red-500 ml-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(teamType, u.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {editing && (
          <input
            id={`${event.id}-${teamType}-input`}
            value={inputs[teamType]}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, [teamType]: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && handleAdd(teamType)}
            placeholder="Enter name and press enter"
            className="w-full mt-1 px-1 py-[2px] text-[10px] border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="border border-orange-200 rounded p-2 bg-orange-50 shadow-sm text-xs">
      <h4 className="font-semibold text-orange-700 text-center mb-2 truncate">
        {event.name}
      </h4>

      <div className="flex gap-2 justify-center">
        {renderTeamBlock("orange", "Varsity", "bg-orange-600", "text-white")}
        {renderTeamBlock("black", "JV", "bg-black", "text-white")}
        {showWhite && renderTeamBlock("white", "JV2", "bg-white", "text-black")}
      </div>

      {user?.admin && editing && (
        <div className="text-center mt-2">
          {showWhite ? (
            <button
              className="text-[10px] text-red-500 hover:underline"
              onClick={() => {
                setAssignments((prev) => ({ ...prev, white: [] }));
                setShowWhite(false);
              }}
            >
              Remove JV2
            </button>
          ) : (
            <button
              className="text-orange-600 text-[10px] hover:underline"
              onClick={() => setShowWhite(true)}
            >
              + Add JV2
            </button>
          )}
        </div>
      )}

      <div className="text-center mt-3 space-x-2">
        {user?.admin && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition"
          >
            Edit
          </button>
        )}
        {user?.admin && editing && (
          <>
            <button
              onClick={() => {
                console.log("Saving assignment for", event.name, assignments);
                setOriginalAssignments(assignments);
                setOriginalShowWhite(showWhite);
                setEditing(false);
                onSave(event.name, assignments);
              }}
              className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setAssignments(originalAssignments);
                setShowWhite(originalShowWhite);
                setInputs({ orange: "", black: "", white: "" });
                setEditing(false);
              }}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamAssignmentCell;
