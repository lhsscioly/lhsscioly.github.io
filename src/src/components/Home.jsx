import { Link } from "react-router-dom";

const Home = ({ user }) => {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-24 text-center overflow-hidden">
      <div className="max-w-4xl animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-md">
          Welcome to Libertyville High School Science Olympiad
        </h1>
        <p className="text-lg sm:text-xl bg-white/20 text-orange-50 font-medium rounded-xl shadow-lg p-5 max-w-4xl mx-auto mb-15 backdrop-blur-md">
          Join the community, access events, practice tests, and excel in
          Science Olympiad!
        </p>
        <div className="mb-16 animate-fade-in-up animation-delay-200">
          {user ? (
            <Link
              to="/events"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-100 shadow-md transition duration-200"
            >
              Events & Resources
            </Link>
          ) : (
            <Link
              to="/signup"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-100 shadow-md transition duration-200"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl animate-fade-in-up animation-delay-400">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg text-center transform hover:scale-105 transition duration-300">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-orange-700 mb-2">
            Track Your Progress
          </h3>
          <p className="text-orange-600 text-sm sm:text-base">
            Monitor your performance and improve with feedback.
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg text-center transform hover:scale-105 transition duration-300">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-orange-700 mb-2">
            Practice Tests
          </h3>
          <p className="text-orange-600 text-sm sm:text-base">
            Access curated practice tests tailored for Science Olympiad events.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
