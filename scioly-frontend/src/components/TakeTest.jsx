import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useMatch } from "react-router-dom";
import QuestionSidebar from "./QuestionSidebar";
import QuestionView from "./QuestionView";
import { ReactSketchCanvas } from "react-sketch-canvas";

const TakeTest = ({ tests, user, teams }) => {
  const match = useMatch("/assigned/:id");
  const testId = match?.params?.id;

  const [test, setTest] = useState(null);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [showCanvas, setShowCanvas] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);

  // Save drawing paths here to preserve between toggles
  const [paths, setPaths] = useState([]);

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

  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (started && timeLeft === 0) {
      handleSubmit();
    }
    return () => clearTimeout(timerRef.current);
  }, [started, timeLeft]);

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
    if (showCanvas && canvasRef.current && paths.length > 0) {
      canvasRef.current.loadPaths(paths);
    }
  }, [showCanvas, paths]);

  useEffect(() => {
  if (testContainerRef.current) {
    testContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [started, currentIdx]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleBookmark = (qId) => {
    setBookmarked((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSubmit = () => {
    setStarted(false);
    clearTimeout(timerRef.current);
    console.log("Submitting answers...", answers);
  };

  const startTest = () => {
    setStarted(true);
    setTimeLeft(50 * 60);
    setShowCanvas(false);
    setEraseMode(false);
    scrollTo()
  };

  const toggleCanvas = () => {
    if (showCanvas) {
      if (canvasRef.current) {
        canvasRef.current.exportPaths().then((exportedPaths) => {
          setPaths(exportedPaths);
          setShowCanvas(false);
        });
      } else {
        setShowCanvas(false);
      }
    } else {
      setShowCanvas(true);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
    setPaths([]);
  };

  const toggleErase = () => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(!eraseMode);
      setEraseMode((prev) => !prev);
    }
  }

  if (!user || !test) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col justify-center items-center bg-white rounded-lg space-y-6 p-15">
        <h1 className="text-3xl font-bold text-orange-800">
          {test.school} {test.year} — {test.event} Practice Test
        </h1>
        <button
          onClick={startTest}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow-lg text-lg hover:bg-orange-600 transition"
          type="button"
        >
          Start Test
        </button>
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
              <h3 className="text-lg font-semibold text-orange-700 text-center">
                Questions
              </h3>
            </div>
            <QuestionSidebar
              questions={test.questions}
              currentIdx={currentIdx}
              setCurrentIdx={setCurrentIdx}
              bookmarked={bookmarked}
              answers={answers}
            />
          </div>

          <div
            ref={questionViewRef}
            className="flex-1 relative max-h-[500px] overflow-auto pr-2 scrollbar-hide"
            style={{ boxSizing: "border-box", padding: 0, margin: 0 }}
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
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: canvasSize.width,
                  height: canvasSize.height,
                  pointerEvents: "auto",
                  backgroundColor: "transparent",
                  zIndex: 50,
                  margin: 0,
                  padding: 0,
                  border: "none",
                }}
              >
                <ReactSketchCanvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  strokeWidth="2"
                  eraserWidth="30"
                  strokeColor="#000"
                  canvasColor="transparent"              
                  style={{
                    margin: 0,
                    padding: 0,
                    border: "none",
                    boxSizing: "border-box",
                    cursor: "crosshair",
                    touchAction: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    gap: 8,
                    zIndex: 100,
                    boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                  }}
                >
                  <button
                    onClick={toggleErase}
                    className={`px-3 py-1 rounded ${
                      !eraseMode ? "bg-orange-600 text-white" : "bg-gray-300"
                    }`}
                    type="button"
                  >
                    Pencil
                  </button>
                  <button
                    onClick={toggleErase}
                    className={`px-3 py-1 rounded ${
                      eraseMode ? "bg-orange-600 text-white" : "bg-gray-300"
                    }`}
                    type="button"
                  >
                    Eraser
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="px-3 py-1 rounded bg-red-500 text-white"
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    onClick={toggleCanvas}
                    className="px-3 py-1 rounded bg-gray-500 text-white"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={toggleCanvas}
              className="bg-amber-600 hover:bg-amber-700 text-white text-md px-4 py-2 rounded shadow"
              type="button"
            >
              {showCanvas ? "Hide Drawing" : "Show Drawing"}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-orange-600 text-white px-6 py-2 rounded shadow hover:bg-orange-700 transition"
            type="button"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
