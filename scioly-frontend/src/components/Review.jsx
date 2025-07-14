import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ReactSketchCanvas } from "react-sketch-canvas";
import QuestionSidebar from "./QuestionSidebar";
import submissionService from "../services/submissions";

const ReviewQuestionView = ({
  idx,
  question,
  userAnswer,
  isCorrect,
  isGraded,
  onSelfGrade,
  selfGradedScore,
  selfGradedComment,
  showCanvas = false,
  actualQuestionNumber,
  drawings = {},
  event,
}) => {
  const isMultipleChoice =
    question.type === "mcq" &&
    question.answer &&
    question.answer.includes(", ");
  const isSAQ = question.type === "saq";
  const isLEQ = question.type === "leq";

  // Helper function to format cipher text with proper spacing using spans
  const formatCipherText = (text) => {
    // Check if this is a Baconian cipher by looking at the question text
    const questionText = question.question[0] || "";
    const isBaconian = questionText.toLowerCase().includes("baconian");

    if (isBaconian) {
      // For Baconian cipher, group into 5-letter chunks
      const cleanText = text.replace(/\s+/g, ""); // Remove existing spaces
      const chunks = [];
      for (let i = 0; i < cleanText.length; i += 5) {
        chunks.push(cleanText.slice(i, i + 5));
      }
      return chunks.map((chunk, chunkIndex) => (
        <span key={chunkIndex} className="inline-block mr-4">
          {chunk}
        </span>
      ));
    } else {
      // For other ciphers, use word-based spacing
      return text
        .split(/\s+/) // Split by any whitespace into words
        .map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block mr-4">
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="inline-block mr-2">
                {char}
              </span>
            ))}
          </span>
        ));
    }
  };

  // Convert letter answers to actual choice content
  const correctAnswers =
    question.answer && question.choices
      ? isMultipleChoice
        ? question.answer.split(", ").map((letter) => {
            const letterTrimmed = letter.trim();
            const choiceIndex = letterTrimmed.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
            return question.choices[choiceIndex]?.trim() || letterTrimmed;
          })
        : (() => {
            const letterTrimmed = question.answer.trim();
            const choiceIndex = letterTrimmed.charCodeAt(0) - 65;
            const choice = question.choices[choiceIndex]?.trim();
            return choice ? [choice] : [letterTrimmed];
          })()
      : [];

  // Ensure userAnswers is always an array
  const userAnswers = Array.isArray(userAnswer)
    ? userAnswer.map((ua) => ua.toString().trim())
    : userAnswer
      ? [userAnswer.toString().trim()]
      : [];

  const getChoiceColor = (choice) => {
    const choiceTrimmed = choice.trim();
    const isUserChoice = userAnswers.some((ua) => ua.trim() === choiceTrimmed);
    const isCorrectChoice = correctAnswers.some(
      (ca) => ca.trim() === choiceTrimmed,
    );

    if (isCorrectChoice && isUserChoice) return "bg-green-200 border-green-400"; // Correct & selected
    if (isCorrectChoice) return "bg-green-100 border-green-300"; // Correct but not selected
    if (isUserChoice) return "bg-red-200 border-red-400"; // Wrong & selected
    return "bg-gray-100 border-gray-300"; // Not selected, not correct
  };

  return (
    <div className="relative padding-5">
      <div className="sticky top-0 bg-white z-40 flex justify-between items-center mb-2 pb-2 border-b border-orange-200">
        <h4 className="text-lg font-semibold text-orange-700">
          Question {actualQuestionNumber || idx + 1} ({question.points} pts)
        </h4>
        {question.type === "mcq" && (
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${
              isCorrect
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
          </span>
        )}
      </div>

      <div className="pt-2">
        <div className="mb-3 text-orange-900">
          {question.question.map((part, index) => (
            <p
              key={index}
              className={index > 0 ? "mt-8" : ""}
              style={
                index > 0 &&
                (question.event === "Codebusters" || event === "Codebusters")
                  ? {
                      lineHeight: "3",
                      letterSpacing: "0.1em",
                      backgroundColor: "#fef3c7",
                      padding: "8px",
                      borderRadius: "4px",
                    }
                  : {}
              }
            >
              {index > 0 &&
              (question.event === "Codebusters" || event === "Codebusters")
                ? // Format cipher text with proper spacing for Codebusters
                  formatCipherText(part)
                : part}
            </p>
          ))}
        </div>

        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Question Visual"
            className="mb-3 border rounded max-w-md"
          />
        )}

        {question.type === "mcq" && question.choices ? (
          <div className="space-y-2 mb-3">
            {question.choices.map((choice, choiceIdx) => {
              const choiceTrimmed = choice.trim();
              const isUserChoice = userAnswers.some(
                (ua) => ua.trim() === choiceTrimmed,
              );
              const isCorrectChoice = correctAnswers.some(
                (ca) => ca.trim() === choiceTrimmed,
              );

              return (
                <div
                  key={choiceIdx}
                  className={`border rounded px-4 py-2 ${getChoiceColor(choice)}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-medium flex-1">
                      {String.fromCharCode(65 + choiceIdx)}. {choice}
                    </span>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0 min-w-0">
                      {isUserChoice && (
                        <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
                          Your answer
                        </span>
                      )}
                      {isCorrectChoice && (
                        <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                          Correct answer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : isSAQ || isLEQ ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Answer:
              </label>
              <div className="w-full border border-gray-300 rounded p-2 bg-gray-50 min-h-[2.5rem]">
                {userAnswer || (
                  <em className="text-gray-500">No answer provided</em>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Answer:
              </label>
              <div className="w-full border border-green-300 rounded p-2 bg-green-50 min-h-[2.5rem]">
                {question.answer}
              </div>
            </div>

            {!isGraded && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h5 className="font-medium text-blue-800 mb-2">
                  Self-Grade This Question
                </h5>

                {/* Auto-score indicator */}
                {(!userAnswer || userAnswer.trim() === "") &&
                  (!drawings[question.id] ||
                    drawings[question.id].length === 0) &&
                  selfGradedScore === "0" && (
                    <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                      <span className="font-medium">Auto-scored:</span> This
                      question was automatically scored as 0 (no answer or
                      drawing provided).
                    </div>
                  )}

                {(!userAnswer || userAnswer.trim() === "") &&
                  (!drawings[question.id] ||
                    drawings[question.id].length === 0) &&
                  (!selfGradedScore || selfGradedScore === "") && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <span className="font-medium">Note:</span> This question
                      has no answer or drawing and will be auto-scored as 0 when
                      you finish grading.
                    </div>
                  )}

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Your Score (out of {question.points} points):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={question.points} // Ensure the score cannot exceed the total points
                      className="w-20 border border-blue-300 rounded px-2 py-1"
                      value={selfGradedScore || ""}
                      onChange={(e) => {
                        const value = Math.min(e.target.value, question.points); // Prevent exceeding max points
                        onSelfGrade(question.id, "score", value);
                      }}
                      placeholder={
                        !userAnswer || userAnswer.trim() === "" ? "0" : ""
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Comments (optional):
                    </label>
                    <textarea
                      rows={2}
                      className="w-full border border-blue-300 rounded px-2 py-1"
                      placeholder="Add comments about your answer..."
                      value={selfGradedComment || ""}
                      onChange={(e) =>
                        onSelfGrade(question.id, "comment", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {isGraded &&
              (selfGradedScore !== undefined || selfGradedComment) && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h5 className="font-medium text-gray-800 mb-2">
                    Your Self-Assessment
                  </h5>
                  <div className="space-y-1">
                    {selfGradedScore !== undefined && (
                      <p className="text-sm">
                        <span className="font-medium">Score:</span>{" "}
                        {selfGradedScore}/{question.points} points
                      </p>
                    )}
                    {selfGradedComment && (
                      <p className="text-sm">
                        <span className="font-medium">Comments:</span>{" "}
                        {selfGradedComment}
                      </p>
                    )}
                  </div>
                </div>
              )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Review = ({ user }) => {
  const { id: submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [submission, setSubmission] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [drawings, setDrawings] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [filter, setFilter] = useState("all"); // all, correct, incorrect, saq, leq
  const [selfGradedScores, setSelfGradedScores] = useState({});
  const [selfGradedComments, setSelfGradedComments] = useState({});
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);
  const [error, setError] = useState("");

  const questionViewRef = useRef(null);
  const reviewContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Check if user came from /review/all page
  const [cameFromAllReviews, setCameFromAllReviews] = useState(false);

  useEffect(() => {
    // Check if the user came from the /review/all page using navigation state
    const stateFrom = location.state?.from;
    const cameFromAll = stateFrom === "/review/all";
    setCameFromAllReviews(cameFromAll);
  }, [location]);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (submissionId) {
        // Ensure token is set before making API calls
        const loggedUser = localStorage.getItem("loggedAppUser");
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          submissionService.setToken(userData.token);
        }

        try {
          const submissionData = await submissionService.getById(submissionId);

          setSubmission(submissionData);
          setTest(submissionData.test);
          setAnswers(submissionData.answer?.answers || {});
          setDrawings(submissionData.answer?.drawings || {});

          // Load self-graded scores if available
          const selfGraded = submissionData.selfGradedScores || {};
          const scores = {};
          const comments = {};

          Object.entries(selfGraded).forEach(([questionId, data]) => {
            if (data.score !== undefined) scores[questionId] = data.score;
            if (data.comment) comments[questionId] = data.comment;
          });

          setSelfGradedScores(scores);
          setSelfGradedComments(comments);

          // Auto-score unanswered questions with no drawings as 0
          if (submissionData.test?.questions) {
            const autoScores = { ...scores };
            let hasAutoScores = false;

            submissionData.test.questions.forEach((question) => {
              if (question.type === "saq" || question.type === "leq") {
                const hasAnswer =
                  submissionData.answer?.answers?.[question.id] &&
                  submissionData.answer.answers[question.id].trim() !== "";
                const hasDrawing =
                  submissionData.answer?.drawings?.[question.id] &&
                  submissionData.answer.drawings[question.id].length > 0;
                const hasScore =
                  autoScores[question.id] !== undefined &&
                  autoScores[question.id] !== "";

                // If no answer AND no drawing AND no score, auto-score as 0
                if (!hasAnswer && !hasDrawing && !hasScore) {
                  autoScores[question.id] = "0";
                  hasAutoScores = true;
                }
              }
            });

            if (hasAutoScores) {
              setSelfGradedScores(autoScores);
            }
          }
        } catch (error) {
          console.error("Error fetching submission:", error);
          navigate("/review");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSubmission();
  }, [submissionId, navigate]);

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

  const calculateMCQScore = () => {
    // For graded submissions, use the stored backend scores
    if (
      submission?.graded &&
      submission?.totalScore !== undefined &&
      submission?.maxScore !== undefined
    ) {
      // Calculate SAQ/LEQ score from self-graded scores
      let saqLeqScore = 0;
      let saqLeqTotal = 0;

      if (test?.questions) {
        test.questions.forEach((question) => {
          if (question.type === "saq" || question.type === "leq") {
            saqLeqTotal += question.points || 1;
            const selfScore = selfGradedScores[question.id];
            if (selfScore !== undefined && selfScore !== "") {
              saqLeqScore += parseFloat(selfScore) || 0;
            }
          }
        });
      }

      // MCQ score is total score minus SAQ/LEQ score
      const mcqScore = Math.max(0, submission.totalScore - saqLeqScore);
      const mcqTotal = Math.max(0, submission.maxScore - saqLeqTotal);

      return { score: mcqScore, total: mcqTotal };
    }

    // For ungraded submissions, calculate in real-time with proper letter-to-content mapping
    if (!test?.questions) return { score: 0, total: 0 };

    const mcqQuestions = test.questions.filter((q) => q.type === "mcq");
    let correctCount = 0;
    let totalPoints = 0;

    mcqQuestions.forEach((question) => {
      totalPoints += question.points || 1;
      const userAnswer = answers[question.id];
      const correctAnswer = question.answer;

      if (!correctAnswer || !question.choices) return;

      // Convert letter answers to actual choice content
      const isMultipleChoice = correctAnswer.includes(", ");
      const correctChoices = isMultipleChoice
        ? correctAnswer.split(", ").map((letter) => {
            const letterTrimmed = letter.trim();
            const choiceIndex = letterTrimmed.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
            return question.choices[choiceIndex]?.trim() || letterTrimmed;
          })
        : (() => {
            const letterTrimmed = correctAnswer.trim();
            const choiceIndex = letterTrimmed.charCodeAt(0) - 65;
            const choice = question.choices[choiceIndex]?.trim();
            return choice ? [choice] : [letterTrimmed];
          })();

      const userAnswers = Array.isArray(userAnswer)
        ? userAnswer.map((a) => a.toString().trim()).sort()
        : userAnswer
          ? [userAnswer.toString().trim()]
          : [];

      if (isMultipleChoice) {
        // Multiple choice
        if (
          JSON.stringify(correctChoices.sort()) === JSON.stringify(userAnswers)
        ) {
          correctCount += question.points || 1;
        }
      } else {
        // Single choice
        if (userAnswers.length === 1 && userAnswers[0] === correctChoices[0]) {
          correctCount += question.points || 1;
        }
      }
    });

    return { score: correctCount, total: totalPoints };
  };

  const calculateTotalScore = () => {
    if (!test?.questions) return { score: 0, total: 0 };

    const mcqScore = calculateMCQScore();
    let saqLeqScore = 0;
    let saqLeqTotal = 0;

    test.questions.forEach((question) => {
      if (question.type === "saq" || question.type === "leq") {
        saqLeqTotal += question.points || 1;
        const selfScore = selfGradedScores[question.id];
        if (selfScore !== undefined) {
          saqLeqScore += parseFloat(selfScore) || 0;
        }
      }
    });

    return {
      score: mcqScore.score + saqLeqScore,
      total: mcqScore.total + saqLeqTotal,
      mcqScore: mcqScore.score,
      mcqTotal: mcqScore.total,
      saqLeqScore,
      saqLeqTotal,
    };
  };

  const getFilteredQuestions = (filterType = filter) => {
    if (!test?.questions) return [];

    return test.questions.filter((question) => {
      if (filterType === "all") return true;
      if (filterType === "saq") return question.type === "saq";
      if (filterType === "leq") return question.type === "leq";
      if (filterType === "unanswered") {
        if (question.type === "mcq") {
          // MCQ is unanswered if no choice is selected
          const userAnswer = answers[question.id];
          return (
            !userAnswer ||
            (Array.isArray(userAnswer) && userAnswer.length === 0)
          );
        } else if (question.type === "saq" || question.type === "leq") {
          // SAQ/LEQ is unanswered if no text answer AND no drawing
          const hasAnswer =
            answers[question.id] && answers[question.id].trim() !== "";
          const hasDrawing =
            drawings[question.id] && drawings[question.id].length > 0;
          return !hasAnswer && !hasDrawing;
        }
        return false;
      }
      if (filterType === "correct" || filterType === "incorrect") {
        if (question.type !== "mcq") return false;
        const isCorrect = checkMCQCorrect(question);
        return filterType === "correct" ? isCorrect : !isCorrect;
      }
      return true;
    });
  };

  const getAvailableFilters = () => {
    const allFilters = [
      "all",
      "correct",
      "incorrect",
      "unanswered",
      "saq",
      "leq",
    ];
    return allFilters.filter((filterOption) => {
      const questionsForFilter = getFilteredQuestions(filterOption);
      return questionsForFilter.length > 0;
    });
  };

  const checkMCQCorrect = (question) => {
    const userAnswer = answers[question.id];
    const correctAnswer = question.answer;

    if (!correctAnswer || !question.choices) return false;

    // Convert letter answers to actual choice content
    const isMultipleChoice = correctAnswer.includes(", ");
    const correctChoices = isMultipleChoice
      ? correctAnswer.split(", ").map((letter) => {
          const letterTrimmed = letter.trim();
          const choiceIndex = letterTrimmed.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
          return question.choices[choiceIndex]?.trim() || letterTrimmed;
        })
      : (() => {
          const letterTrimmed = correctAnswer.trim();
          const choiceIndex = letterTrimmed.charCodeAt(0) - 65;
          const choice = question.choices[choiceIndex]?.trim();
          return choice ? [choice] : [letterTrimmed];
        })();

    const userAnswers = Array.isArray(userAnswer)
      ? userAnswer.map((a) => a.toString().trim()).sort()
      : userAnswer
        ? [userAnswer.toString().trim()]
        : [];

    if (isMultipleChoice) {
      // Multiple choice - compare arrays
      return (
        JSON.stringify(correctChoices.sort()) === JSON.stringify(userAnswers)
      );
    } else {
      // Single choice - direct comparison
      return userAnswers.length === 1 && userAnswers[0] === correctChoices[0];
    }
  };

  const handleSelfGrade = (questionId, type, value) => {
    if (error) setError(""); // Clear error when user starts grading

    if (type === "score") {
      setSelfGradedScores((prev) => ({ ...prev, [questionId]: value }));
    } else if (type === "comment") {
      setSelfGradedComments((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const handleFinishGrading = async () => {
    setError("");

    // Auto-score unanswered questions with no drawings as 0
    const saqLeqQuestions = test.questions.filter(
      (q) => q.type === "saq" || q.type === "leq",
    );
    const updatedScores = { ...selfGradedScores };

    saqLeqQuestions.forEach((question) => {
      const hasAnswer =
        answers[question.id] && answers[question.id].trim() !== "";
      const hasDrawing =
        drawings[question.id] && drawings[question.id].length > 0;
      const hasScore =
        updatedScores[question.id] !== undefined &&
        updatedScores[question.id] !== "";

      // If no answer AND no drawing AND no score, auto-score as 0
      if (!hasAnswer && !hasDrawing && !hasScore) {
        updatedScores[question.id] = "0";
      }
    });

    setSelfGradedScores(updatedScores);

    // Validate that all remaining SAQ/LEQ questions have scores
    const missingScores = saqLeqQuestions.filter((q) => {
      const hasAnswer = answers[q.id] && answers[q.id].trim() !== "";
      const hasDrawing = drawings[q.id] && drawings[q.id].length > 0;
      const hasScore =
        updatedScores[q.id] !== undefined && updatedScores[q.id] !== "";

      // Only require scoring if there's an answer or drawing
      return (hasAnswer || hasDrawing) && !hasScore;
    });

    if (missingScores.length > 0) {
      setError(
        `Please provide scores for all answered SAQ/LEQ questions. Missing scores for ${missingScores.length} question(s).`,
      );
      return;
    }

    setIsSubmittingGrades(true);

    try {
      const selfGradedData = {};

      // Use updated scores for calculation
      const tempScores = updatedScores;
      let saqLeqScore = 0;
      let saqLeqTotal = 0;

      test.questions.forEach((question) => {
        if (question.type === "saq" || question.type === "leq") {
          saqLeqTotal += question.points || 1;
          const selfScore = tempScores[question.id];
          if (selfScore !== undefined && selfScore !== "") {
            saqLeqScore += parseFloat(selfScore) || 0;
            selfGradedData[question.id] = {
              score: parseFloat(selfScore) || 0,
              comment: selfGradedComments[question.id] || "",
            };
          }
        }
      });

      const mcqScore = calculateMCQScore();
      const totalScore = mcqScore.score + saqLeqScore;
      const maxScore = mcqScore.total + saqLeqTotal;

      await submissionService.update(submissionId, {
        selfGradedScores: selfGradedData,
        totalScore: totalScore,
        maxScore: maxScore,
        graded: true,
      });

      // Refresh submission data
      const updatedSubmission = await submissionService.getById(submissionId);
      setSubmission(updatedSubmission);
    } catch (error) {
      console.error("Error submitting grades:", error);
      setError("Failed to submit grades. Please try again.");
    } finally {
      setIsSubmittingGrades(false);
    }
  };

  const handleQuestionNavigation = (newIdx) => {
    setShowCanvas(false);
    setCurrentIdx(newIdx);

    // Scroll to top of question view
    if (questionViewRef.current) {
      questionViewRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Scroll the main container into view for better navigation experience
    if (reviewContainerRef.current) {
      reviewContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Also hide canvas when filter changes
  useEffect(() => {
    setShowCanvas(false);
  }, [filter]);

  // Auto-scroll to test container when component loads and data is ready
  useEffect(() => {
    if (!loading && submission && test && reviewContainerRef.current) {
      setTimeout(() => {
        reviewContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [loading, submission, test]);

  const toggleCanvas = () => {
    const qid = filteredQuestions[currentIdx]?.id;
    if (showCanvas) {
      setShowCanvas(false);
    } else {
      setShowCanvas(true);
      setTimeout(() => {
        if (canvasRef.current && qid) {
          const saved = drawings[qid];
          if (saved && saved.length > 0) {
            canvasRef.current.loadPaths(saved);
          } else {
            canvasRef.current.clearCanvas();
          }
        }
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission || !test) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Submission not found
          </h2>
          <button
            onClick={() => navigate("/review")}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            No questions found for this test
          </h2>
          <p className="text-gray-600 mt-2">The test data may be incomplete.</p>
          <button
            onClick={() => navigate("/review")}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  const filteredQuestions = getFilteredQuestions();
  const availableFilters = getAvailableFilters();
  const currentQuestion = filteredQuestions[currentIdx];
  const totalScores = calculateTotalScore();
  const mcqScores = calculateMCQScore();

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            No questions match the current filter
          </h2>
          <button
            onClick={() => setFilter("all")}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Show All Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={reviewContainerRef}
      className="w-full min-h-screen bg-transparent py-4 px-4"
    >
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md py-4 px-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-800">
            {test.random ? "Random Test" : `${test.school} ${test.year}`} —{" "}
            {test.event} Review
          </h2>
          <div className="text-right">
            {submission.graded ? (
              <div className="text-orange-600 font-semibold">
                <div>
                  Total Score: {totalScores.score}/{totalScores.total} (
                  {((totalScores.score / totalScores.total) * 100).toFixed(1)}%)
                </div>
                <div className="text-sm">
                  MCQ: {mcqScores.score}/{mcqScores.total} • FRQ:{" "}
                  {totalScores.saqLeqScore}/{totalScores.saqLeqTotal}
                </div>
              </div>
            ) : (
              <div className="text-orange-600 font-semibold">
                <div>
                  MCQ Score: {mcqScores.score}/{mcqScores.total}
                </div>
                <div className="text-sm text-orange-500">
                  Complete self-grading to see total score
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {availableFilters.map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => {
                setFilter(filterOption);
                setCurrentIdx(0); // Reset to first question when filter changes
                setShowCanvas(false); // Hide canvas when switching filters
              }}
              className={`px-3 py-1 rounded text-sm ${
                filter === filterOption
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {filterOption === "saq"
                ? "Short Answer"
                : filterOption === "leq"
                  ? "Long Answer"
                  : filterOption === "mcq"
                    ? "Multiple Choice"
                    : filterOption.charAt(0).toUpperCase() +
                      filterOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Self-grading controls */}
        {!submission.graded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-blue-800">
                  Self-Grading Required
                </h3>
                <p className="text-sm text-blue-600">
                  Grade your free response questions to complete your review.
                </p>
              </div>
              <button
                onClick={handleFinishGrading}
                disabled={isSubmittingGrades}
                className={`px-4 py-2 rounded font-medium ${
                  isSubmittingGrades
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                {isSubmittingGrades ? "Submitting..." : "Finish Grading"}
              </button>
            </div>
          </div>
        )}

        {/* Main Test View Container */}
        <div
          className={`flex space-x-4 ${submission.graded ? "h-[500px]" : "h-[400px]"}`}
        >
          {/* Question Sidebar */}
          <div className="w-64 h-full overflow-y-auto pr-2 scrollbar-hide bg-gray-100 rounded-lg">
            <div className="sticky top-0 bg-gray-100 z-10 pb-2 pt-3">
              <h3 className="text-lg font-semibold text-orange-700 text-center">
                Questions
              </h3>
            </div>
            <QuestionSidebar
              questions={filteredQuestions}
              currentIdx={currentIdx}
              setCurrentIdx={handleQuestionNavigation}
              bookmarked={[]}
              answers={answers}
              drawings={drawings}
            />
          </div>

          {/* Question View */}
          <div
            ref={questionViewRef}
            className="flex-1 relative h-full overflow-auto pr-2 scrollbar-hide"
          >
            <ReviewQuestionView
              idx={test.questions.findIndex((q) => q.id === currentQuestion.id)}
              question={currentQuestion}
              userAnswer={answers[currentQuestion.id]}
              isCorrect={
                currentQuestion.type === "mcq"
                  ? checkMCQCorrect(currentQuestion)
                  : null
              }
              isGraded={submission.graded}
              onSelfGrade={handleSelfGrade}
              selfGradedScore={selfGradedScores[currentQuestion.id]}
              selfGradedComment={selfGradedComments[currentQuestion.id]}
              showCanvas={showCanvas}
              actualQuestionNumber={
                test.questions.findIndex((q) => q.id === currentQuestion.id) + 1
              }
              drawings={drawings}
              event={test.event}
            />

            {/* Drawing Canvas (Read-only) */}
            {showCanvas && (
              <div
                className="absolute top-0 left-0 bg-transparent z-20 pointer-events-none"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                }}
              >
                <ReactSketchCanvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  strokeWidth="2"
                  strokeColor="#000"
                  canvasColor="transparent"
                  className="touch-none select-none"
                  style={{ border: "none", outline: "none" }}
                  readOnly={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center min-w-[120px]">
            {/* Only show drawing button if there's a drawing for current question */}
            {filteredQuestions[currentIdx] &&
              drawings[filteredQuestions[currentIdx].id] &&
              drawings[filteredQuestions[currentIdx].id].length > 0 && (
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
              )}
          </div>

          <div className="flex gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => handleQuestionNavigation(currentIdx - 1)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentIdx === filteredQuestions.length - 1}
              onClick={() => handleQuestionNavigation(currentIdx + 1)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => {
                if (user && user.admin && cameFromAllReviews) {
                  navigate("/review/all");
                } else {
                  navigate("/review");
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded shadow transition"
            >
              {user && user.admin && cameFromAllReviews
                ? "Back to All Reviews"
                : "Back to Reviews"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
