import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Forgot = (props) => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleForgot = async (event) => {
    event.preventDefault();
    const res = await props.handleForgot(email);
    if (res) {
      setEmail("");
      navigate("/signin");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center text-orange-800">
        Forgot Password
      </h2>
      <form onSubmit={handleForgot} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Email Address
          </label>
          <input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
        >
          Reset Password
        </button>
        <button
          type="button"
          className="w-full text-left text-orange-600 hover:underline"
        >
          <Link to="/signin">Cancel</Link>
        </button>
      </form>
    </div>
  );
};

export default Forgot;
