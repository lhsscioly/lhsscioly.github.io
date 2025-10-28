import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// UI component to reset password from email link
const Reset = (props) => {
  const [newPass, setNewPass] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return;
  }

  const handleEmailReset = (event) => {
    event.preventDefault();
    const res = props.handleEmailReset(token, newPass);
    if (res) {
      setNewPass("");
      navigate("/signin");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md space-y-6">
      <div>
        <p className="text-xl font-semibold text-orange-800 text-center">
          Reset Your Password
        </p>
      </div>
      <div>
        <form onSubmit={handleEmailReset} className="space-y-4">
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
    </div>
  );
};

export default Reset;
