import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useMatch, useNavigate, Link } from "react-router-dom";
import { ReactSketchCanvas } from "react-sketch-canvas";
import QuestionSidebar from "./QuestionSidebar";
import QuestionView from "./QuestionView";
import answerService from "../services/answers";
import submissionService from "../services/submissions";
import testService from "../services/tests";

// There is purposefully a lot of redundancy in this file to ensure the process of syncing is smooth.
// Merging logic and debouncing is sometimes similar, but helps mimic the real-time features of web-sockets

// Determines whether the centralized test answers should be prioritized
const shouldPrioritizeServerValue = (
  currentValue,
  serverValue,
  timeSinceServerUpdate,
) => {
  if (timeSinceServerUpdate < 1000) {
    return true;
  }

  if (currentValue === serverValue) {
    return false;
  }


  // Helper and evaluator to prioritize non empty values over empty ones
  // Checks for recencies since users might delete values for some questions

  const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (typeof value === "number") return false;
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  };

  if (isEmpty(currentValue) && !isEmpty(serverValue)) {
    return true;
  }

  if (isEmpty(serverValue) && !isEmpty(currentValue)) {
    return false;
  }

  if (timeSinceServerUpdate < 1500) {
    return true;
  }

  return false;
};

// Helps prioritize centralized drawing data, similar to values like above
const shouldPrioritizeServerDrawing = (
  currentDrawing,
  serverDrawing,
  timeSinceServerUpdate,
) => {
  if (timeSinceServerUpdate < 1000) {
    return true;
  }

  if (JSON.stringify(currentDrawing) === JSON.stringify(serverDrawing)) {
    return false;
  }

  const isEmptyDrawing = (drawing) => {
    if (!drawing) return true;
    if (Array.isArray(drawing)) return drawing.length === 0;
    if (typeof drawing === "object") return Object.keys(drawing).length === 0;
    return false;
  };

  if (isEmptyDrawing(currentDrawing) && !isEmptyDrawing(serverDrawing)) {
    return true;
  }

  if (isEmptyDrawing(serverDrawing) && !isEmptyDrawing(currentDrawing)) {
    return false;
  }

  if (timeSinceServerUpdate < 1500) {
    return true;
  }

  return false;
};

// UI component to take the 
const TakeTest = ({
  tests = [],
  user,
  users,
  teams = [],
  setNotif,
  setError,
  setTests,
}) => {
  const match = useMatch("/assigned/:id");
  const testId = match?.params?.id;
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [showCanvas, setShowCanvas] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [drawingByQuestionId, setDrawingByQuestionId] = useState({});
  const [teamId, setTeamId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSync, setPendingSync] = useState(null);
  const [lastUserActivity, setLastUserActivity] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Use of ref here to prevent re-rendering on every time tick and question change
  const timerRef = useRef(null);
  const questionViewRef = useRef(null);
  const canvasRef = useRef(null);
  const testContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Get the specific test and verify the correct user is taking the test
  useEffect(() => {
    if (tests && Array.isArray(tests) && testId) {
      const found = tests.find((t) => String(t.id) === testId);
      setTest(found || null);
    }
  }, [tests, testId]);

  useEffect(() => {
    if (user && test && teams && Array.isArray(teams)) {
      const userTeam = teams.find(
        (team) =>
          team &&
          team.event === test.event &&
          team.students &&
          Array.isArray(team.students) &&
          team.students.some((student) => student && student.id === user.id),
      );
      if (userTeam) {
        setTeamId(userTeam.id);
      }
    }
  }, [user, test, teams]);

  // Load existing answers when test and team are available
  useEffect(() => {
    const loadExistingAnswers = async () => {
      if (testId && teamId) {
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
          submissionService.setToken(userData.token);
        }

        try {
          const submissionCheck = await submissionService.checkSubmission(
            testId,
            teamId,
          );

          if (submissionCheck.submitted) {
            if (setError) {
              setError("This test has already been submitted.");
              setTimeout(() => setError(null), 5000);
            }
            navigate("/assigned");
            return;
          }

          const existingAnswers = await answerService.getByTestAndTeam(
            testId,
            teamId,
          );
          if (existingAnswers) {
            setAnswers(existingAnswers.answers || {});
            setDrawingByQuestionId(existingAnswers.drawings || {});
            setTimeLeft(existingAnswers.timeLeft || 50 * 60);
            setStarted(true);
          }
        } catch (error) {
          console.log("No existing answers found, starting fresh");
        } finally {
          setIsLoading(false);
        }
      } else if (testId) {
        setIsLoading(false);
      }
    };
    loadExistingAnswers();
  }, [testId, teamId, navigate, setError]);

  useEffect(() => {
    if (started && timeLeft > 0 && !submitted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((t) => Math.max(0, t - 1));
      }, 1000);
    } else if (started && timeLeft === 0 && !submitted) {
      handleSubmit();
    }
    return () => clearTimeout(timerRef.current);
  }, [started, timeLeft, submitted]);

  useLayoutEffect(() => {
    function updateSize() {
      if (questionViewRef.current) {
        const rect = questionViewRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [showCanvas, currentIdx]);

  useEffect(() => {
    if (testContainerRef.current) {
      testContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [started, currentIdx]);

  // Handles syncing of test answers, using the helper functions above
  useEffect(() => {
    const syncSpecificAnswer = async () => {
      if (pendingSync && testId && teamId && started && !submitted) {
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
        }

        try {
          const response = await answerService.updateSpecific(
            testId,
            teamId,
            pendingSync,
          );
          setPendingSync(null);
          setTimeLeft(response.timeLeft);
        } catch (error) {
          console.error("Failed to sync specific answer:", error);
          if (error.response?.status === 404) {
            try {
              await answerService.create({
                testId,
                teamId,
                answers: answers,
                drawings: drawingByQuestionId,
                timeLeft: 50 * 60,
              });
              setPendingSync(null);
            } catch (createError) {
              console.error("Failed to create answer document:", createError);
            }
          }
        }
      }
    };

    if (pendingSync && !submitted) {
      const syncTimer = setTimeout(syncSpecificAnswer, 500); // The debouncing I mentioned
      return () => clearTimeout(syncTimer);
    }
  }, [
    pendingSync,
    testId,
    teamId,
    started,
    answers,
    drawingByQuestionId,
    submitted,
  ]);

  // Gets actual data from backend to sync
  useEffect(() => {
    const syncFromBackend = async () => {
      if (testId && teamId && started && !submitted) {
        // Further debouncing to avoid overwriting active user edits
        const timeSinceLastActivity = Date.now() - lastUserActivity;
        if (timeSinceLastActivity < 1000) {
          return;
        }

        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
          submissionService.setToken(userData.token);
        }

        try {
          const response = await answerService.getByTestAndTeam(testId, teamId);
          if (response) {
            try {
              const submissionCheck = await submissionService.checkSubmission(
                testId,
                teamId,
              );

              // Checking for other teammates submitting the test
              if (submissionCheck.submitted && !submitted) {
                setSubmitted(true);
                setStarted(false);
                clearTimeout(timerRef.current);

                if (setNotif) {
                  setNotif("Test has been submitted by another team member!");
                  setTimeout(() => setNotif(null), 5000);
                }
                return;
              }
            } catch (submissionError) {
              console.log(
                "Could not check submission status:",
                submissionError,
              );
            }

            const serverAnswers = response.answers || {};
            const serverDrawings = response.drawings || {};
            const serverAnswerTimestamps = response.answerTimestamps || {};
            const serverDrawingTimestamps = response.drawingTimestamps || {};

            // Updates answers using the merging above
            setAnswers((prevAnswers) => {
              const updatedAnswers = { ...prevAnswers };
              let hasChanges = false;

              for (const [questionId, serverAnswer] of Object.entries(
                serverAnswers,
              )) {
                const currentAnswer = prevAnswers[questionId];
                const serverTimestamp = serverAnswerTimestamps[questionId]
                  ? new Date(serverAnswerTimestamps[questionId])
                  : new Date(0);
                const timeSinceServerUpdate =
                  Date.now() - serverTimestamp.getTime();

                if (
                  timeSinceServerUpdate < 2000 &&
                  currentAnswer !== serverAnswer
                ) {
                  const shouldUseServer = shouldPrioritizeServerValue(
                    currentAnswer,
                    serverAnswer,
                    timeSinceServerUpdate,
                  );
                  if (shouldUseServer) {
                    updatedAnswers[questionId] = serverAnswer;
                    hasChanges = true;
                  }
                } else if (
                  currentAnswer !== serverAnswer &&
                  timeSinceServerUpdate >= 2000
                ) {
                  updatedAnswers[questionId] = serverAnswer;
                  hasChanges = true;
                }
              }

              return hasChanges ? updatedAnswers : prevAnswers;
            });

            // Update drawings with similar merging techniques
            setDrawingByQuestionId((prevDrawings) => {
              const updatedDrawings = { ...prevDrawings };
              let hasChanges = false;

              for (const [questionId, serverDrawing] of Object.entries(
                serverDrawings,
              )) {
                const currentDrawing = prevDrawings[questionId];
                const serverTimestamp = serverDrawingTimestamps[questionId]
                  ? new Date(serverDrawingTimestamps[questionId])
                  : new Date(0);
                const timeSinceServerUpdate =
                  Date.now() - serverTimestamp.getTime();

                if (
                  timeSinceServerUpdate < 2000 &&
                  JSON.stringify(currentDrawing) !==
                    JSON.stringify(serverDrawing)
                ) {
                  const shouldUseServer = shouldPrioritizeServerDrawing(
                    currentDrawing,
                    serverDrawing,
                    timeSinceServerUpdate,
                  );
                  if (shouldUseServer) {
                    updatedDrawings[questionId] = serverDrawing;
                    hasChanges = true;

                    // Need to reload canvas updates for current question
                    const currentQuestionId = test?.questions?.[currentIdx]?.id;
                    if (
                      showCanvas &&
                      currentQuestionId === questionId &&
                      canvasRef.current
                    ) {
                      setTimeout(() => {
                        if (serverDrawing && serverDrawing.length > 0) {
                          canvasRef.current.loadPaths(serverDrawing);
                        } else {
                          canvasRef.current.clearCanvas();
                        }
                      }, 100);
                    }
                  }
                } else if (
                  JSON.stringify(currentDrawing) !==
                    JSON.stringify(serverDrawing) &&
                  timeSinceServerUpdate >= 2000
                ) {
                  updatedDrawings[questionId] = serverDrawing;
                  hasChanges = true;

                  const currentQuestionId = test?.questions?.[currentIdx]?.id;
                  if (
                    showCanvas &&
                    currentQuestionId === questionId &&
                    canvasRef.current
                  ) {
                    setTimeout(() => {
                      if (serverDrawing && serverDrawing.length > 0) {
                        canvasRef.current.loadPaths(serverDrawing);
                      } else {
                        canvasRef.current.clearCanvas();
                      }
                    }, 100);
                  }
                }
              }
              return hasChanges ? updatedDrawings : prevDrawings;
            });

            setTimeLeft(response.timeLeft);
          }
        } catch (error) {
          console.error("Failed to sync from backend:", error);
        }
      }
    };

    if (started && !submitted) {
      const interval = setInterval(syncFromBackend, 2000);
      return () => clearInterval(interval);
    }
  }, [
    testId,
    teamId,
    started,
    showCanvas,
    currentIdx,
    test,
    lastUserActivity,
    submitted,
  ]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setLastUserActivity(Date.now());
    setPendingSync({ questionId: qId, answer: value });
  };

  const toggleBookmark = (qId) => {
    setBookmarked((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId],
    );
  };

  const saveCurrentCanvas = async () => {
    if (showCanvas && canvasRef.current && test?.questions?.[currentIdx]) {
      const paths = await canvasRef.current.exportPaths();
      const questionId = test.questions[currentIdx].id;
      setDrawingByQuestionId((prev) => ({
        ...prev,
        [questionId]: paths,
      }));
      setLastUserActivity(Date.now());
      setPendingSync({ questionId, drawing: paths });
    }
  };

  const handleQuestionNavigation = async (newIdx) => {
    await saveCurrentCanvas();
    setShowCanvas(false);
    setCurrentIdx(newIdx);
  };

  const goToNext = async () => {
    await saveCurrentCanvas();
    setShowCanvas(false);
    setCurrentIdx((i) => i + 1);
  };

  const goToPrev = async () => {
    await saveCurrentCanvas();
    setShowCanvas(false);
    setCurrentIdx((i) => i - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    await saveCurrentCanvas();

    const loggedUser = localStorage.getItem("loggedAppUser");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      answerService.setToken(userData.token);
      submissionService.setToken(userData.token);
      testService.setToken(userData.token);
    }

    try {
      if (testId && teamId) {
        // Final sync before submission
        await answerService.update(testId, teamId, {
          answers,
          drawings: drawingByQuestionId,
          timeLeft,
        });

        await submissionService.create({
          testId,
          teamId,
          finalTimeLeft: timeLeft,
        });

        // Remove team from current assignees as test is done
        const currentTest = Array.isArray(tests)
          ? tests.find((t) => String(t.id) === testId)
          : null;
        if (currentTest && Array.isArray(currentTest.assignees)) {
          const updatedAssignees = currentTest.assignees.filter((assignee) => {
            const assigneeId =
              typeof assignee === "object" ? assignee.id : assignee;
            return assigneeId !== teamId;
          });

          const assigneeIds = updatedAssignees.map((assignee) =>
            typeof assignee === "object" ? assignee.id : assignee,
          );

          await testService.updateTest(testId, { assignees: assigneeIds });

          // Update local states
          if (setTests) {
            setTests((prevTests) => {
              if (!Array.isArray(prevTests)) {
                console.warn("prevTests is not an array:", prevTests);
                return prevTests;
              }
              return prevTests.map((t) =>
                String(t.id) === testId
                  ? { ...t, assignees: updatedAssignees }
                  : t,
              );
            });
          }
        }

        setStarted(false);
        setSubmitted(true);
        clearTimeout(timerRef.current);

        if (setNotif) {
          setNotif("Test submitted successfully!");
          setTimeout(() => setNotif(null), 5000);
        }

        console.log("Test submitted successfully!");
      }
    } catch (error) {
      console.error("Failed to submit test:", error);

      if (setError) {
        setError("Failed to submit test. Please try again.");
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTest = async () => {
    setStarted(true);
    setShowCanvas(false);
    setEraseMode(false);

    const loggedUser = localStorage.getItem("loggedAppUser");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      answerService.setToken(userData.token);
      testService.setToken(userData.token);
    }

    // Create initial answers document
    if (testId && teamId) {
      try {
        const response = await answerService.create({
          testId,
          teamId,
          answers: {},
          drawings: {},
          timeLeft: 50 * 60,
        });
        setTimeLeft(response.timeLeft);
      } catch (error) {
        if (error.response?.status !== 409) {
          console.error("Failed to create initial answers:", error);
        }
      }
    }
  };

  const toggleCanvas = async () => {
    if (!test?.questions?.[currentIdx]) return;

    const qid = test.questions[currentIdx].id;
    if (showCanvas) {
      if (canvasRef.current) {
        const paths = await canvasRef.current.exportPaths();
        setDrawingByQuestionId((prev) => ({ ...prev, [qid]: paths }));
        setLastUserActivity(Date.now());
        setPendingSync({ questionId: qid, drawing: paths });
      }
      setShowCanvas(false);
    } else {
      setShowCanvas(true);
      setTimeout(() => {
        if (canvasRef.current) {
          const saved = drawingByQuestionId[qid];
          if (saved) {
            canvasRef.current.loadPaths(saved);
          } else {
            canvasRef.current.clearCanvas();
          }
        }
      }, 100);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current && test?.questions?.[currentIdx]) {
      canvasRef.current.clearCanvas();
      const qid = test.questions[currentIdx].id;
      setDrawingByQuestionId((prev) => {
        const updated = { ...prev };
        delete updated[qid];
        return updated;
      });
      setLastUserActivity(Date.now());
      setPendingSync({ questionId: qid, drawing: null });
    }
  };

  const toggleErase = () => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(!eraseMode);
      setEraseMode((prev) => !prev);
    }
  };

  if (
    !user ||
    !test ||
    !test.questions ||
    !Array.isArray(test.questions) ||
    isLoading ||
    !Array.isArray(tests)
  ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col justify-center items-center p-20 bg-white space-y-10 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Test Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Your answers have been saved and submitted for grading.
          </p>

          <div className="pt-10">
            <Link
              to={`/review`}
              className="text-white bg-orange-500 font-semibold text-md py-3 px-4 rounded-lg hover:bg-orange-600"
            >
              Review Test
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col justify-center items-center p-20 bg-white space-y-10 rounded-lg">
        <h1 className="text-3xl font-bold text-orange-800">
          {test.random ? "Random Test" : `${test.school || ''} ${test.year || ''}`.trim() || "Test"} —{" "}
          {test.event} Practice Test
        </h1>
        {!teamId ? (
          <p className="text-red-600">
            You are not assigned to a team for this event.
          </p>
        ) : (
          <button
            onClick={startTest}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow-lg text-lg hover:bg-orange-600 transition"
          >
            Start Test
          </button>
        )}
      </div>
    );
  }

  const currentQuestion = test.questions?.[currentIdx];
  const currentQId = currentQuestion?.id;

  const questionsLength = test.questions?.length || 0;
  if (currentIdx >= questionsLength && questionsLength > 0) {
    setCurrentIdx(questionsLength - 1);
    return null;
  }

  return (
    <div
      ref={testContainerRef}
      className="w-full min-h-screen bg-transparent py-5 px-4"
    >
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md py-6 px-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-800">
            {test.school} {test.year} — {test.event}
          </h2>
          <div className="text-orange-600 font-semibold text-lg">
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-64 h-[500px] overflow-y-auto pr-2 scrollbar-hide bg-gray-100 rounded-lg">
            <div className="sticky top-0 bg-gray-100 z-10 pb-2 pt-3">
              <h3 className="text-lg font-semibold text-orange-700 text-center">
                Questions
              </h3>
            </div>
            <QuestionSidebar
              questions={test.questions || []}
              currentIdx={currentIdx}
              setCurrentIdx={handleQuestionNavigation}
              bookmarked={bookmarked}
              answers={answers}
              drawings={drawingByQuestionId}
            />
          </div>

          <div
            ref={questionViewRef}
            className="flex-1 relative max-h-[500px] overflow-auto pr-2 scrollbar-hide"
          >
            {currentQuestion ? (
              <QuestionView
                idx={currentIdx}
                question={currentQuestion}
                answer={answers[currentQId]}
                onChange={handleAnswerChange}
                onBookmark={toggleBookmark}
                isBookmarked={bookmarked.includes(currentQId)}
                event={test.event}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                Question not found
              </div>
            )}

            {showCanvas && (
              <div
                className="absolute top-0 left-0 bg-transparent z-30"
                style={{ width: canvasSize.width, height: canvasSize.height }}
              >
                <ReactSketchCanvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  strokeWidth="2"
                  eraserWidth="30"
                  strokeColor="#000"
                  canvasColor="transparent"
                  className="touch-none select-none"
                  style={{ border: "none", outline: "none" }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            {showCanvas && (
              <>
                <button
                  onClick={toggleErase}
                  className={`px-3 py-1 rounded ${
                    !eraseMode ? "bg-orange-600 text-white" : "bg-gray-300"
                  }`}
                >
                  Pencil
                </button>
                <button
                  onClick={toggleErase}
                  className={`px-3 py-1 rounded ${
                    eraseMode ? "bg-orange-600 text-white" : "bg-gray-300"
                  }`}
                >
                  Eraser
                </button>
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1 rounded bg-red-500 text-white"
                >
                  Clear
                </button>
              </>
            )}
            <button
              onClick={toggleCanvas}
              className={`rounded shadow text-white ${
                showCanvas
                  ? "px-3 py-1 bg-gray-500 hover:bg-gray-600"
                  : "px-4 py-2 bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {showCanvas ? "Hide Drawing" : "Show Drawing"}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={goToPrev}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentIdx === (test.questions?.length - 1 || 0)}
              onClick={goToNext}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitted}
              className={`px-6 py-2 rounded shadow transition ${
                isSubmitting || submitted
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              } text-white`}
            >
              {isSubmitting
                ? "Submitting..."
                : submitted
                  ? "Submitted"
                  : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
