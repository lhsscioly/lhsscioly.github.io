import { useState } from "react";

const UserSettings = (props) => {
  const [newPass, setNewPass] = useState("");

  if (!props.user) {
    return;
  }

  const handleReset = async (event) => {
    event.preventDefault();
    await props.handleReset(newPass);
    setNewPass("");
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md space-y-6">
      <div>
        <p className="text-xl font-semibold text-orange-800 mb-2">
          {props.user.firstName} {props.user.lastName}&apos;s Settings
        </p>
      </div>

      <div>
        <p className="text-lg font-medium text-orange-700 mb-2">
          Password Reset
        </p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={({ target }) => setNewPass(target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
          >
            Reset
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={props.handleLogout}
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
};

export default UserSettings;
