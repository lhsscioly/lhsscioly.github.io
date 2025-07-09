import { useState, useEffect } from "react";
import Home from "./components/Home";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Events from "./components/Events";
import Forgot from "./components/Forgot";
import CreateTest from "./components/CreateTest";
import TestBank from "./components/TestBank";
import Test from "./components/Test";
import RandomTest from "./components/RandomTest";
import Lineup from "./components/Lineup";
import AssignedTests from "./components/AssignedTests";
import TakeTest from "./components/TakeTest";
import UserSettings from "./components/UserSettings";
import ReviewTests from "./components/ReviewTests";
import Review from "./components/Review";
import Reset from "./components/Reset";
import Verify from "./components/Verify";
import NotFound from "./components/NotFound";
import userService from "./services/users";
import eventService from "./services/events";
import loginService from "./services/login";
import testService from "./services/tests";
import teamService from "./services/teams";
import questionService from "./services/questions";
import answerService from "./services/answers";
import submissionService from "./services/submissions";
import { Routes, Route, Link, useNavigate, Router } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [notif, setNotif] = useState(null);
  const [events, setEvents] = useState([]);
  const [tests, setTests] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedUser = localStorage.getItem("loggedAppUser");
    if (loggedUser) {
      const user = JSON.parse(loggedUser);
      setUser(user);
      userService.setToken(user.token);
      eventService.setToken(user.token);
      testService.setToken(user.token);
      questionService.setToken(user.token);
      teamService.setToken(user.token);
      answerService.setToken(user.token);
      submissionService.setToken(user.token);
    }
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await eventService.getAll();
        if (result) {
          setEvents(result);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const result = await testService.getAll();
        if (result) {
          setTests(result);
        }
      } catch (error) {
        console.error("Failed to fetch tests:", error);
      }
    };
    if (user && tests.length === 0) {
      fetchTests();
    }
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await userService.getAll();
        if (result) {
          setUsers(result);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    if (user) {
      fetchUsers();
    }
  }, [user, teams]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const result = await questionService.getAll();
        if (result) {
          setQuestions(result);
        }
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      }
    };
    if (user && questions.length === 0) {
      fetchQuestions();
    }
  }, [user]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const result = await teamService.getAll();
        if (result) {
          setTeams(result);
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      }
    };
    if (user && teams.length === 0) {
      fetchTeams();
    }
  }, [user]);

  const handleSignUp = async (credentials) => {
    try {
      const user = await userService.createUser(credentials);
      window.localStorage.setItem("loggedAppUser", JSON.stringify(user));
      setUser(user);
      userService.setToken(user.token);
      eventService.setToken(user.token);
      testService.setToken(user.token);
      questionService.setToken(user.token);
      teamService.setToken(user.token);
      answerService.setToken(user.token);
      submissionService.setToken(user.token);
      navigate("/");
      console.log("Sign Up");
      setNotif(
        "signed up successfully, please check your email to verify your email",
      );
      setTimeout(() => {
        setNotif(null);
      }, 5000);
      return true;
    } catch (error) {
      if (error.response.data.error) {
        if (error.response.data.error === "Invalid admin key") {
          setError("Invalid admin key!");
        } else if (
          error.response.data.error === "Path `password` is required"
        ) {
          setError("Password is required!");
        } else if (
          error.response.data.error.includes("Path `email` is required")
        ) {
          setError("Email is required!");
        } else if (
          error.response.data.error.includes("Path `firstName` is required")
        ) {
          setError("First name is required!");
        } else if (
          error.response.data.error.includes("Path `lastName` is required")
        ) {
          setError("Last name is required!");
        } else if (
          error.response.data.error ===
          "Path `password` is shorter than the minimum allowed length (8)"
        ) {
          setError("Password must be at least 8 characters!");
        } else if (
          error.response.data.error === "expected `email` to be unique"
        ) {
          setError("Email already taken");
        } else if (
          error.response.data.error === "expected `name` to be unique"
        ) {
          setError("Name already taken. Please add your middle name/initial to your first name");
        } else {
          console.log(error.response.data.error);
        }
      } else {
        console.log(error.message);
      }
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("loggedAppUser");
    setUser(null);
    userService.setToken("");
    eventService.setToken("");
    testService.setToken("");
    questionService.setToken("");
    teamService.setToken("");
    answerService.setToken("");
    submissionService.setToken("");
    navigate("/signin");
    setNotif("Logged out successfully");
    setTimeout(() => {
      setNotif(null);
    }, 5000);
  };

  const handleLogin = async (credentials) => {
    try {
      const user = await loginService.login(credentials);
      window.localStorage.setItem("loggedAppUser", JSON.stringify(user));
      setUser(user);
      userService.setToken(user.token);
      eventService.setToken(user.token);
      testService.setToken(user.token);
      questionService.setToken(user.token);
      teamService.setToken(user.token);
      answerService.setToken(user.token);
      submissionService.setToken(user.token);
      console.log("Sign In");
      navigate("/");
      setNotif("Logged in successfully");
      setTimeout(() => {
        setNotif(null);
      }, 5000);
      return true;
    } catch (error) {
      if (error.status === 401) {
        setError("Invalid username or password");
        setTimeout(() => {
          setError(null);
        }, 5000);
      } else if (error.status === 403) {
        setError("Cannot sign in. Please verify your account first!");
        setTimeout(() => {
          setError(null);
        }, 5000);
      }
    }
  };

  const handleReset = async (newPass) => {
    try {
      await userService.resetPass({ id: user.id, password: newPass });
      setNotif("Reset password successfully");
      setTimeout(() => {
        setNotif(null);
      }, 5000);
    } catch (error) {
      if (error.response.data.error) {
        if (error.response.data.error === "Path `password` is required") {
          setError("Password is required!");
        } else if (
          error.response.data.error ===
          "Path `password` is shorter than the minimum allowed length (8)"
        ) {
          setError("Password must be at least 8 characters!");
        } else if (error.status === 403) {
          setError("Unauthorized!");
        } else {
          console.log(error.response.data.error);
        }
      } else {
        console.log(error);
      }
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleForgot = async (email) => {
    try {
      await userService.forgot(email);
      setNotif("Check your email for the reset link!");
      setTimeout(() => {
        setNotif(null);
      }, 5000);
      return true;
    } catch (error) {
      if (error.status === 404) {
        setError("Email not found");
        setTimeout(() => {
          setError(null);
        }, 5000);
      } else {
        console.log(error);
      }
    }
  };

  const handleEmailReset = async (token, password) => {
    try {
      await userService.resetEmailPass(token, password);
      setNotif("Password reset successfully");
      setTimeout(() => {
        setNotif(null);
      }, 5000);
    } catch (error) {
      if (error.response.data.error) {
        if (error.response.data.error === "Path `password` is required") {
          setError("Password is required!");
        } else if (
          error.response.data.error ===
          "Path `password` is shorter than the minimum allowed length (8)"
        ) {
          setError("Password must be at least 8 characters!");
        } else if (error.response.data.error === "Invalid or expired token") {
          setError("Invalid or expired token!");
        } else {
          console.log(error.response.data.error);
        }
      } else {
        console.log(error.message);
      }
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-repeat-y bg-[url('/radiant-combined.svg')] bg-[length:100%]">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="/lville.png"
                  alt="Logo"
                  className="h-8 transition-transform duration-200 hover:scale-110"
                />
              </Link>
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-200 transition"
              >
                Home
              </Link>
              <Link
                to="/events"
                className="px-3 py-2 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-200 transition"
              >
                Events
              </Link>

              {user && (
                <div className="relative inline-block text-left group z-2">
                  <button className="text-sm font-medium text-orange-700 px-3 py-2 rounded-md hover:bg-orange-200 transition">
                    Meetings
                  </button>
                  <div
                    className="absolute left-0 top-full w-40 bg-orange-50 rounded-md shadow-lg 
                    invisible group-hover:visible transition duration-100 pointer-events-none group-hover:pointer-events-auto"
                  >
                    <ul className="py-1">
                      <li>
                        <Link
                          to="/lineup"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-200"
                        >
                          Lineup
                        </Link>
                      </li>
                      {users.find((u) => u.id === user.id)?.teams?.length >
                        0 && (
                        <li>
                          <Link
                            to="/assigned"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-200"
                          >
                            Assigned Tests
                          </Link>
                        </li>
                      )}
                      {users.find((u) => u.id === user.id)?.teams?.length >
                        0 && (
                        <li>
                          <Link
                            to="/review"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-200"
                          >
                            Review Tests
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {user && user.admin && (
                <div className="relative inline-block text-left group">
                  <button className="text-sm font-medium text-orange-700 px-3 py-2 rounded-md hover:bg-orange-200 transition">
                    Tests
                  </button>
                  <div
                    className="absolute left-0 top-full w-40 bg-orange-50 rounded-md shadow-lg 
                    invisible group-hover:visible transition duration-100 pointer-events-none group-hover:pointer-events-auto"
                  >
                    <ul className="py-1">
                      <li>
                        <Link
                          to="/tests"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-200"
                        >
                          Test Bank
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/tests/create"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-200"
                        >
                          Create Test
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/tests/random"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-200"
                        >
                          Create Random Test
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              {!user ? (
                <>
                  <Link
                    to="/signin"
                    className="px-3 py-2 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-200 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-2 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-200 transition"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/settings"
                    className="px-3 py-2 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-200 transition"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-orange-700 hover:bg-red-600 hover:text-white transition"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow pt-6 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div
              className="mb-4 rounded-md bg-red-100 border border-red-500 text-red-800 px-4 py-3 shadow-md"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {notif && (
            <div
              className="mb-4 rounded-md bg-green-100 border border-green-500 text-green-800 px-4 py-3 shadow-md"
              role="alert"
            >
              <strong className="font-bold">Notice: </strong>
              <span className="block sm:inline">{notif}</span>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route
              path="/signin"
              element={
                <SignIn handleSignIn={handleLogin} setError={setError} />
              }
            />
            <Route
              path="/signup"
              element={
                <SignUp handleSignUp={handleSignUp} setError={setError} />
              }
            />
            <Route
              path="/events"
              element={
                <Events user={user} events={events} setEvents={setEvents} />
              }
            />
            <Route
              path="/settings"
              element={
                <UserSettings
                  handleReset={handleReset}
                  user={user}
                  handleLogout={handleLogout}
                />
              }
            />
            <Route
              path="/forgot"
              element={<Forgot handleForgot={handleForgot} />}
            />
            <Route
              path="/reset"
              element={<Reset handleEmailReset={handleEmailReset} />}
            />
            <Route
              path="/verify"
              element={<Verify setError={setError} setNotif={setNotif} />}
            />
            <Route
              path="/tests"
              element={
                <TestBank
                  tests={tests}
                  events={events}
                  user={user}
                  teams={teams}
                  setTests={setTests}
                />
              }
            />
            <Route
              path="/tests/create"
              element={
                <CreateTest
                  setNotif={setNotif}
                  events={events}
                  tests={tests}
                  setTests={setTests}
                  setError={setError}
                  user={user}
                />
              }
            />
            <Route
              path="/tests/random"
              element={
                <RandomTest
                  tests={tests}
                  questions={questions}
                  user={user}
                  events={events}
                  setError={setError}
                  setNotif={setNotif}
                  teams={teams}
                  setTests={setTests}
                />
              }
            />
            <Route
              path="/tests/:id"
              element={
                <Test
                  tests={tests}
                  user={user}
                  teams={teams}
                  setError={setError}
                  setNotif={setNotif}
                  setTests={setTests}
                />
              }
            />
            <Route
              path="/lineup"
              element={
                <Lineup
                  setTeams={setTeams}
                  events={events}
                  users={users}
                  teams={teams}
                  user={user}
                />
              }
            />
            <Route
              path="/assigned"
              element={
                <AssignedTests
                  tests={tests}
                  user={user}
                  users={users}
                  teams={teams}
                />
              }
            />
            <Route
              path="/assigned/:id"
              element={
                <TakeTest
                  tests={tests}
                  user={user}
                  users={users}
                  teams={teams}
                  setNotif={setNotif}
                  setError={setError}
                  setTests={setTests}
                />
              }
            />
            <Route
              path="/review"
              element={
                <ReviewTests
                  user={user}
                  users={users}
                  teams={teams}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
            <Route
              path="/review/:id"
              element={
                <Review />
              }
            />
          </Routes>
        </div>
      </div>

      <footer className="bg-orange-100 text-orange-700 py-6 text-center text-sm">
        &copy; {new Date().getFullYear()} Libertyville High School Science
        Olympiad
      </footer>
    </div>
  );
}

export default App;
