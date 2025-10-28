import { useState } from "react";
import { Link } from "react-router-dom";

// UI component to sign in to your account
const SignIn = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (event) => {
    event.preventDefault();
    const result = await props.handleSignIn({ email, password });
    if (result) {
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center text-orange-800">
        Sign in to LHS Scioly
      </h2>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Email Address
          </label>
          <input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
        >
          Sign In
        </button>
        <button
          type="button"
          className="w-full text-left text-orange-600 hover:underline mt-2"
        >
          <Link to="/signup">Don't have an account? Sign Up</Link>
        </button>
        <button
          type="button"
          className="w-full text-left text-orange-600 hover:underline"
        >
          <Link to="/forgot">Forgot password?</Link>
        </button>
      </form>
    </div>
  );
};

export default SignIn;
