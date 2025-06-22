import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container mx-auto px-6 py-24 max-w-5xl flex flex-col justify-center items-center text-center min-h-screen">
      <h2 className="text-5xl font-extrabold text-white mb-6">
        Welcome to Libertyville High School Science Olympiad
      </h2>
      <p className="text-lg text-orange-100 mb-10 max-w-xl">
        Join the community, access events, practice tests, and excel in Science
        Olympiad!
      </p>
      <div className="space-x-6">
        <Link
          to="/signup"
          className="bg-orange-500 text-white px-10 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition shadow-md"
        >
          Get Started
        </Link>
      </div>

      <section
        id="features"
        className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl w-full"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="mb-4 text-orange-600 text-5xl">🎯</div>
          <h3 className="text-2xl font-bold mb-2 text-orange-700">
            Track Your Progress
          </h3>
          <p className="text-orange-600">
            Monitor your performance and improve with feedback.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="mb-4 text-orange-600 text-5xl">📚</div>
          <h3 className="text-2xl font-bold mb-2 text-orange-700">
            Practice Tests
          </h3>
          <p className="text-orange-600">
            Access curated practice tests tailored for Science Olympiad events.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
