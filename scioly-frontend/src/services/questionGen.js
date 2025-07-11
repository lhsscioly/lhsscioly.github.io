import { createPartFromUri, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const query = `
    # The following files given to you are a science olympiad invitational test and the answer/solutions.
    # Take all the questions and return them in an array of question JSON objects.
    # Each question object should have the following details: 
    {
      type,
      question,
      points,
      choices,
      answer,
      group,
    }

    # Go through the pdf, and identify the type of each question.
    # The type can be either mcq, saq, or leq, NOTHING ELSE!! 
    # mcq: multiple choice, saq: short answer (so one word, objective answers), leq: (longer answers where you have to explain or show your work)
    # If it's a matching question, the questions should be mcqs and just make as many questions as there are things to match
    # And the things to match are the choices
    # If it's a question where you have a few items/facts with letters, and each following question requires you to pull from that answer bank, then make the question an mcq, with the answer bank as choices, and each question as its own question.
    # Choices can be null if the question is not multiple choice
    # The question attribute is the question itself, so for example "What is blah". The question is an array, but unless for Codebusters, it is just an array with one string, which is the question itself.
    # The points are the points assigned to the question. Some tests will have this and others won't.
    # For tests that don't assign points, assign 1 point to each mcq and saq, and 5 for each leq.
    # For choices, don't label A, B, C (I'll do that myself). Choices is an array of strings, where the strings are the choices themselves without any other attachments.
    # For answers look at the answers pdf. For mcqs, the answer is the choice letter, so A, B, C, D, etc. If the test has the choices labeled differently still use A, B, C, and consecutive letters as the answer
    # If for mcqs the test answer refers to the actual answer, change it so the test answer is the correct letter instead. So for example if the test choices were labeled 1 through 10, and the answer was 1, your answer will be A.
    # Just to reiterate, the answer to mcqs will always be the correct LETTER choice and nothing else!
    # For questions that ask to order something, make that an mcq as well. For the choices, include the correct answer, and make up other orders of that order.
    # Make true-false questions mcqs with true and false as the two choices. 
    # The answer to an mcq should always be an option letter so even though the options for true and false are true or false, the answer will either be A or B
    # If a question is in a set, and there is context given pertaining to all questions in the beginning, then put that context in the question string of each question
    # If a question is in a set where they all refer to the same image, then you should also give a group attribute in the question object with a unique identifer for all questions in that group
    # The group attribute is optional, and ONLY for questions who have the same image used. So ONLY give and it and DEFINITELY give it when you have that situation where a bunch of questions use the same image, chart, drawing, etc 
    # Do not describe images for the test taker! 
    # For saqs, simply write down the one word or short phrase answer
    # If there are multiple answers for mcqs and saqs separate them with a comma and a space.
    # For leqs, put whatever the answer key for that test has in the answer, as a string, including directions to grade the problem if there are those.
    # Do not care about any images in the test. I will handle those later.
    # Only send the valid JSON array and no other words, because your response has to be JSON parsable
    # To reiterate, send an array of objects that have the property, type, which is either mcq, saq, or leq, question, which is an array of strings, points, which is a number, choices, which is an array of strings (only if the q is multiple choice), and answer, which is either a singuler string or a string with comma separated values
    # In the case you are not given an answers pdf, or the answer might be unclear, you may generate the answer to the best of your knowledge. Ensure that none of the answers are anything such as "this will be determined later." For those type of "lab-based" questions, provide a range if you can from the best of your knowledge. 
    # ONLY GENERATE AN ANSWER WHEN IT IS CLEARLY NOT CLEAR OR NOT PRESENT. OTHERWISE DO NOT INTERFERE!
    # Do NOT generate your own questions!!
    # Make sure to return a **complete and valid JSON array**.
    # Your response should start with a left bracket [ and end with a right bracket ].
    # Once you end your triple quotes STOP!
    # Every question should stand on its own without other questions. So if any question refers to a previous question, ensure that the relevant context is in this question without needing the previous question. Some questions might refer to other questions. Our numbering and structure is different, so ensure that the question is self-contained, with relevant context from that other question given in this question without reference to the other question. 
    # DO NOT REVEAL ANSWERS IN THE QUESTION!!
    # Do not have wording such as "previous question" or "next question" because the order might change, so make the question so it can stand without having done other questions.
    # If you have an leq, then you can put all the parts that depend on each other as one question
    # If you have mcqs or saqs that refer to other questions, put that relevant information in the current question so it stands alone.
    # DO NOT PUT CHOICES IN THE QUESTION!! If you have choices, no matter how the test pdf has it, make the question an mcq and put choices as strings in an array
    # IF AND ONLY IF the test is Codebusters (it says on top of the pdf), then all questions should be an leq! 
    # IF AND ONLY IF THE test is Codebusters, the questions attribute is NOT a string, but an Array of strings. In the first index goes the question, and in the second index goes the cipher. Make sure to use spaces properly as it is in the test.
    # IF AND ONLY IF the test is Codebusters, then make sure that if a question is a special bonus question you add special bonus to it, and if the question has points listed, put those points in the points attribute.
    # IF AND ONLY IF the test is Codebusters, ensure that the question that might say (decode this) is separated from the cipher (the actual words) through new lines and such. Clearly separate the question from the cipher as two elements of an array in the questions attribute! 
    # IF AND ONLY IF the test is Codebusters (it says on top of the pdf), the answer should be the solution to the cipher, with proper spaces. Do not add newlines or anything like that to the answer key. That should just be the simple answer.
    # FINAL INSTRUCTION: Your response must be *only* a valid JSON array, starting with '[' and ending with ']'. No explanations, no formatting, no extra text.
`;

async function uploadPDF(filePDF) {
  const file = await ai.files.upload({
    file: filePDF,
    config: {
      displayName: filePDF.name,
    },
  });

  let getFile = await ai.files.get({ name: file.name });
  while (getFile.state === "PROCESSING") {
    getFile = await ai.files.get({ name: file.name });
    console.log(`current file status: ${getFile.state}`);
    console.log("File is still processing, retrying in 5 seconds");

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }
  if (file.state === "FAILED") {
    throw new Error("File processing failed.");
  }

  return file;
}

async function createQuestions(questionPDF, answerPDF) {
  const content = [query];

  let file1 = await uploadPDF(questionPDF);
  if (file1.uri && file1.mimeType) {
    const fileContent = createPartFromUri(file1.uri, file1.mimeType);
    content.push(fileContent);
  }

  let file2 = await uploadPDF(answerPDF);

  if (file2.uri && file2.mimeType) {
    const fileContent = createPartFromUri(file2.uri, file2.mimeType);
    content.push(fileContent);
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: content,
  });

  console.log(response.text);
  return response.text;
}

export default { createQuestions };
