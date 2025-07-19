import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const SignUp = (props) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate("");

  const handleSignUp = async (event) => {
    event.preventDefault();

    // Email domain validation
    const allowedDomains = ["d128.org", "lhswildcats.org"];
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
      props.setError("Email must be a d128.org or lhswildcats.org address");
      setTimeout(() => {
        props.setError(null);
      }, 3000);
      return;
    }

    if (password !== confirmPassword) {
      props.setError("passwords do not match");
      setTimeout(() => {
        props.setError(null);
      }, 3000);
      return;
    }

    const result = await props.handleSignUp({
      email,
      firstName,
      lastName,
      password,
      adminKey,
    });
    if (result) {
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirmPassword("");
      setAdminKey("");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center text-orange-800">
        Sign up for LHS Scioly
      </h2>
      <form onSubmit={handleSignUp} className="space-y-4">
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
            First Name
          </label>
          <input
            value={firstName}
            onChange={({ target }) => setFirstName(target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Last Name
          </label>
          <input
            value={lastName}
            onChange={({ target }) => setLastName(target.value)}
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
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={({ target }) => setConfirmPassword(target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {admin ? (
          <div className="space-y-2">
            <label className="block mb-1 font-medium text-gray-800">
              Admin Key
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={({ target }) => setAdminKey(target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={() => setAdmin(false)}
              className="text-orange-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setAdmin(true)}
              className="text-orange-600 hover:underline"
            >
              I am a Coach or Captain
            </button>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
        >
          Sign Up
        </button>

        <button
          type="button"
          className="w-full text-left text-orange-600 hover:underline"
        >
          Already have an account? <Link to="/signin">Sign In</Link>
        </button>
      </form>
    </div>
  );
};

export default SignUp;
