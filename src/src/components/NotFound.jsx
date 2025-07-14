import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[60vh] bg-white max-w-md mx-auto p-8 shadow-lg rounded-lg">
      <h1 className="text-6xl font-bold text-orange-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2 text-orange-800">
        Page Not Found
      </h2>
      <p className="text-orange-700 mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-orange-200 text-orange-800 rounded hover:bg-orange-300 transition"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
