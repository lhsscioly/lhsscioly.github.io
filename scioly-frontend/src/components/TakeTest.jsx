import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useMatch, useNavigate, Link } from "react-router-dom";
import { ReactSketchCanvas } from "react-sketch-canvas";
import QuestionSidebar from "./QuestionSidebar";
import QuestionView from "./QuestionView";
import answerService from '../services/answers';
import submissionService from '../services/submissions';
import testService from '../services/tests';

// Helper function to determine if server value should be prioritized
const shouldPrioritizeServerValue = (currentValue, serverValue, timeSinceServerUpdate) => {
  // If server value is very recent (less than 1 second), prioritize it
  if (timeSinceServerUpdate < 1000) {
    return true;
  }
  
  // If both are empty or both are the same, no change needed
  if (currentValue === serverValue) {
    return false;
  }
  
  // Helper function to check if a value is "empty"
  const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return false; // Numbers are never considered empty
    if (typeof value === 'boolean') return false; // Booleans are never considered empty
    if (Array.isArray(value)) return value.length === 0;
    return false;
  };
  
  // If current is empty and server has content, use server
  if (isEmpty(currentValue) && !isEmpty(serverValue)) {
    return true;
  }
  
  // If server is empty and current has content, keep current
  if (isEmpty(serverValue) && !isEmpty(currentValue)) {
    return false;
  }
  
  // If both have content, prioritize server if it's recent (less than 1.5 seconds)
  if (timeSinceServerUpdate < 1500) {
    return true;
  }
  
  return false;
};

// Helper function to determine if server drawing should be prioritized
const shouldPrioritizeServerDrawing = (currentDrawing, serverDrawing, timeSinceServerUpdate) => {
  // If server drawing is very recent (less than 1 second), prioritize it
  if (timeSinceServerUpdate < 1000) {
    return true;
  }
  
  // If both are empty or both are the same, no change needed
  if (JSON.stringify(currentDrawing) === JSON.stringify(serverDrawing)) {
    return false;
  }
  
  // Helper function to check if a drawing is "empty"
  const isEmptyDrawing = (drawing) => {
    if (!drawing) return true;
    if (Array.isArray(drawing)) return drawing.length === 0;
    if (typeof drawing === 'object') return Object.keys(drawing).length === 0;
    return false;
  };
  
  // If current is empty and server has content, use server
  if (isEmptyDrawing(currentDrawing) && !isEmptyDrawing(serverDrawing)) {
    return true;
  }
  
  // If server is empty and current has content, keep current
  if (isEmptyDrawing(serverDrawing) && !isEmptyDrawing(currentDrawing)) {
    return false;
  }
  
  // If both have content, prioritize server if it's recent (less than 1.5 seconds)
  if (timeSinceServerUpdate < 1500) {
    return true;
  }
  
  return false;
};

const TakeTest = ({ tests, user, users, teams, setNotif, setError, setTests }) => {
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
  const [isLoading, setIsLoading] = useState(true); // Track if we're loading existing answers
  const [pendingSync, setPendingSync] = useState(null); // Track pending sync operations
  const [lastUserActivity, setLastUserActivity] = useState(0); // Track when user last made changes
  const [submitted, setSubmitted] = useState(false); // Track if test was successfully submitted

  const timerRef = useRef(null);
  const questionViewRef = useRef(null);
  const canvasRef = useRef(null);
  const testContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (tests && testId) {
      const found = tests.find((t) => String(t.id) === testId);
      setTest(found || null);
    }
  }, [tests, testId]);

  // Get user's team for this test
  useEffect(() => {
    if (user && test && teams && Array.isArray(teams)) {
      const userTeam = teams.find(team => 
        team && 
        team.event === test.event && 
        team.students && 
        Array.isArray(team.students) &&
        team.students.some(student => student && student.id === user.id)
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
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
          submissionService.setToken(userData.token);
        }
        
        try {
          // First check if test has already been submitted
          const submissionCheck = await submissionService.checkSubmission(testId, teamId);
          
          if (submissionCheck.submitted) {
            // Test already submitted, redirect back with error
            if (setError) {
              setError("This test has already been submitted.");
              setTimeout(() => setError(null), 5000);
            }
            navigate('/assigned');
            return;
          }
          
          // If not submitted, check for existing answers
          const existingAnswers = await answerService.getByTestAndTeam(testId, teamId);
          if (existingAnswers) {
            setAnswers(existingAnswers.answers || {});
            setDrawingByQuestionId(existingAnswers.drawings || {});
            setTimeLeft(existingAnswers.timeLeft || 50 * 60);
            setStarted(true); // Automatically start the test if answers exist
          }
        } catch (error) {
          console.log("No existing answers found, starting fresh");
        } finally {
          setIsLoading(false);
        }
      } else if (testId) {
        // If we have testId but no teamId, we still need to stop loading
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
      testContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [started, currentIdx]);

  // Sync specific answers when they change
  useEffect(() => {
    const syncSpecificAnswer = async () => {
      if (pendingSync && testId && teamId && started && !submitted) {
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
        }
        
        try {
          const response = await answerService.updateSpecific(testId, teamId, pendingSync);
          setPendingSync(null);
          // Update timeLeft from server response
          setTimeLeft(response.timeLeft);
        } catch (error) {
          console.error("Failed to sync specific answer:", error);
          // If the answer document doesn't exist, try to create it
          if (error.response?.status === 404) {
            try {
              await answerService.create({
                testId,
                teamId,
                answers: answers,
                drawings: drawingByQuestionId,
                timeLeft: 50 * 60
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
      const syncTimer = setTimeout(syncSpecificAnswer, 500); // Debounce for 0.5 seconds (reduced from 2 seconds)
      return () => clearTimeout(syncTimer);
    }
  }, [pendingSync, testId, teamId, started, answers, drawingByQuestionId, submitted]);

  // Sync from backend every 5 seconds to get updates from other users
  useEffect(() => {
    const syncFromBackend = async () => {
      if (testId && teamId && started && !submitted) {
        // Don't sync if user has been active in the last 1 second to avoid interrupting typing
        const timeSinceLastActivity = Date.now() - lastUserActivity;
        if (timeSinceLastActivity < 1000) {
          return;
        }
        
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          answerService.setToken(userData.token);
          submissionService.setToken(userData.token);
        }
        
        try {
          const response = await answerService.getByTestAndTeam(testId, teamId);
          if (response) {
            // Check if test has been submitted by checking submissions
            try {
              const submissionCheck = await submissionService.checkSubmission(testId, teamId);
              
              if (submissionCheck.submitted && !submitted) {
                // Another user submitted the test
                setSubmitted(true);
                setStarted(false);
                clearTimeout(timerRef.current);
                
                if (setNotif) {
                  setNotif("Test has been submitted by another team member!");
                  setTimeout(() => setNotif(null), 5000);
                }
                return; // Don't continue with regular sync
              }
            } catch (submissionError) {
              console.log("Could not check submission status:", submissionError);
            }
            
            // Smart merge based on timestamps and content
            const serverAnswers = response.answers || {};
            const serverDrawings = response.drawings || {};
            const serverAnswerTimestamps = response.answerTimestamps || {};
            const serverDrawingTimestamps = response.drawingTimestamps || {};
            
            // Update answers with smart merging
            setAnswers(prevAnswers => {
              const updatedAnswers = { ...prevAnswers };
              let hasChanges = false;
              
              for (const [questionId, serverAnswer] of Object.entries(serverAnswers)) {
                const currentAnswer = prevAnswers[questionId];
                const serverTimestamp = serverAnswerTimestamps[questionId] ? new Date(serverAnswerTimestamps[questionId]) : new Date(0);
                const timeSinceServerUpdate = Date.now() - serverTimestamp.getTime();
                
                // Don't overwrite if user has been active on this question in the last 2 seconds
                if (timeSinceServerUpdate < 2000 && currentAnswer !== serverAnswer) {
                  // Smart merge: prioritize non-empty content, then most recent
                  const shouldUseServer = shouldPrioritizeServerValue(currentAnswer, serverAnswer, timeSinceServerUpdate);
                  if (shouldUseServer) {
                    updatedAnswers[questionId] = serverAnswer;
                    hasChanges = true;
                  }
                } else if (currentAnswer !== serverAnswer && timeSinceServerUpdate >= 2000) {
                  // Use server value if it's older than 2 seconds (not actively being edited)
                  updatedAnswers[questionId] = serverAnswer;
                  hasChanges = true;
                }
              }
              
              return hasChanges ? updatedAnswers : prevAnswers;
            });
            
            // Update drawings with smart merging
            setDrawingByQuestionId(prevDrawings => {
              const updatedDrawings = { ...prevDrawings };
              let hasChanges = false;
              
              for (const [questionId, serverDrawing] of Object.entries(serverDrawings)) {
                const currentDrawing = prevDrawings[questionId];
                const serverTimestamp = serverDrawingTimestamps[questionId] ? new Date(serverDrawingTimestamps[questionId]) : new Date(0);
                const timeSinceServerUpdate = Date.now() - serverTimestamp.getTime();
                
                // Don't overwrite if user has been active on this question in the last 2 seconds
                if (timeSinceServerUpdate < 2000 && JSON.stringify(currentDrawing) !== JSON.stringify(serverDrawing)) {
                  // Smart merge: prioritize non-empty content, then most recent
                  const shouldUseServer = shouldPrioritizeServerDrawing(currentDrawing, serverDrawing, timeSinceServerUpdate);
                  if (shouldUseServer) {
                    updatedDrawings[questionId] = serverDrawing;
                    hasChanges = true;
                    
                    // Reload canvas if this is the current question
                    const currentQuestionId = test?.questions?.[currentIdx]?.id;
                    if (showCanvas && currentQuestionId === questionId && canvasRef.current) {
                      setTimeout(() => {
                        if (serverDrawing && serverDrawing.length > 0) {
                          canvasRef.current.loadPaths(serverDrawing);
                        } else {
                          canvasRef.current.clearCanvas();
                        }
                      }, 100);
                    }
                  }
                } else if (JSON.stringify(currentDrawing) !== JSON.stringify(serverDrawing) && timeSinceServerUpdate >= 2000) {
                  // Use server value if it's older than 2 seconds
                  updatedDrawings[questionId] = serverDrawing;
                  hasChanges = true;
                  
                  // Reload canvas if this is the current question
                  const currentQuestionId = test?.questions?.[currentIdx]?.id;
                  if (showCanvas && currentQuestionId === questionId && canvasRef.current) {
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
            
            // Always update time from server
            setTimeLeft(response.timeLeft);
          }
        } catch (error) {
          console.error("Failed to sync from backend:", error);
        }
      }
    };

    if (started && !submitted) {
      const interval = setInterval(syncFromBackend, 2000); // Sync every 2 seconds (reduced from 5 seconds)
      return () => clearInterval(interval);
    }
  }, [testId, teamId, started, showCanvas, currentIdx, test, lastUserActivity, submitted]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setLastUserActivity(Date.now());
    // Trigger sync for this specific answer
    setPendingSync({ questionId: qId, answer: value });
  };

  const toggleBookmark = (qId) => {
    setBookmarked((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const saveCurrentCanvas = async () => {
    if (showCanvas && canvasRef.current) {
      const paths = await canvasRef.current.exportPaths();
      const questionId = test.questions[currentIdx].id;
      setDrawingByQuestionId((prev) => ({
        ...prev,
        [questionId]: paths,
      }));
      setLastUserActivity(Date.now());
      // Trigger sync for this specific drawing
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
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    await saveCurrentCanvas();
    
    // Ensure token is set before making API calls
    const loggedUser = localStorage.getItem("loggedAppUser");
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      answerService.setToken(userData.token);
      submissionService.setToken(userData.token);
      testService.setToken(userData.token);
    }
    
    try {
      // Final sync of all answers before submission
      if (testId && teamId) {
        await answerService.update(testId, teamId, {
          answers,
          drawings: drawingByQuestionId,
          timeLeft
        });

        // Create submission
        await submissionService.create({
          testId,
          teamId,
          finalTimeLeft: timeLeft
        });

        // Remove team from test's assignees
        const currentTest = tests.find(t => String(t.id) === testId);
        if (currentTest) {
          const updatedAssignees = currentTest.assignees.filter(assigneeId => assigneeId !== teamId);
          await testService.updateTest(testId, { assignees: updatedAssignees });
          
          // Update local tests state
          if (setTests) {
            setTests(prevTests => 
              prevTests.map(t => 
                String(t.id) === testId 
                  ? { ...t, assignees: updatedAssignees }
                  : t
              )
            );
          }
        }

        setStarted(false);
        setSubmitted(true);
        clearTimeout(timerRef.current);
        
        // Show success notification
        if (setNotif) {
          setNotif("Test submitted successfully!");
          setTimeout(() => setNotif(null), 5000);
        }
        
        console.log("Test submitted successfully!");
      }
    } catch (error) {
      console.error("Failed to submit test:", error);
      
      // Show error notification
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
    
    // Ensure token is set before making API calls
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
          timeLeft: 50 * 60
        });
        // Set the time from the server response
        setTimeLeft(response.timeLeft);
      } catch (error) {
        // If answers already exist, that's fine
        if (error.response?.status !== 409) {
          console.error("Failed to create initial answers:", error);
        }
      }
    }
  };

  const toggleCanvas = async () => {
    const qid = test.questions[currentIdx].id;
    if (showCanvas) {
      if (canvasRef.current) {
        const paths = await canvasRef.current.exportPaths();
        setDrawingByQuestionId((prev) => ({ ...prev, [qid]: paths }));
        setLastUserActivity(Date.now());
        // Trigger sync for this specific drawing
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
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      const qid = test.questions[currentIdx].id;
      setDrawingByQuestionId((prev) => {
        const updated = { ...prev };
        delete updated[qid];
        return updated;
      });
      setLastUserActivity(Date.now());
      // Trigger sync to remove the drawing
      setPendingSync({ questionId: qid, drawing: null });
    }
  };

  const toggleErase = () => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(!eraseMode);
      setEraseMode((prev) => !prev);
    }
  };

  if (!user || !test || isLoading) {
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
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Test Submitted Successfully!</h1>
          <p className="text-gray-600">
            Your answers have been saved and submitted for grading.
          </p>

          <div className="pt-10">
            <Link to={`/review`} className="text-white bg-orange-500 font-semibold text-md py-3 px-4 rounded-lg hover:bg-orange-600">
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
          {test.random ? 'Random Test' : `${test.school} ${test.year}`} — {test.event} Practice Test
        </h1>
        {!teamId ? (
          <p className="text-red-600">You are not assigned to a team for this event.</p>
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

  const currentQuestion = test.questions[currentIdx];
  const currentQId = currentQuestion.id;

  return (
    <div ref={testContainerRef} className="w-full min-h-screen bg-transparent py-5 px-4">
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
              <h3 className="text-lg font-semibold text-orange-700 text-center">Questions</h3>
            </div>
            <QuestionSidebar
              questions={test.questions}
              currentIdx={currentIdx}
              setCurrentIdx={handleQuestionNavigation}
              bookmarked={bookmarked}
              answers={answers}
            />
          </div>

          <div
            ref={questionViewRef}
            className="flex-1 relative max-h-[500px] overflow-auto pr-2 scrollbar-hide"
          >
            <QuestionView
              idx={currentIdx}
              question={currentQuestion}
              answer={answers[currentQId]}
              onChange={handleAnswerChange}
              onBookmark={toggleBookmark}
              isBookmarked={bookmarked.includes(currentQId)}
            />

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
                showCanvas ? "px-3 py-1 bg-gray-500 hover:bg-gray-600" : "px-4 py-2 bg-amber-600 hover:bg-amber-700"
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
              disabled={currentIdx === test.questions.length - 1}
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
              {isSubmitting ? "Submitting..." : submitted ? "Submitted" : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
