
import React, { useState } from "react";
import { ErrorMessage, Form, Formik } from "formik";
import { Sparkles, FileText, UploadCloud } from "lucide-react";
import * as yup from "yup";
import { Button } from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import Markdown from 'react-markdown';
import { useAuth } from "@clerk/clerk-react";

const ReviewResume = () => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [fileName, setFileName] = useState("");
  const { getToken } = useAuth();

  const initialstate = {
    resume: null, // Initial state for the file
  };

  const validationSchema = yup.object({
    // Correctly validate the file input
    resume: yup
      .mixed()
      .required("A resume file (PDF) is required.")
      .test(
        "fileType",
        "Unsupported file format. Please upload a PDF.",
        (value) => value && value.type === "application/pdf"
      ),
  });

  const handleSubmit = async (values, { resetForm }) => {
    setLoading(true);
    setAnalysisResult(""); // Clear previous results

    // Use FormData to correctly handle file uploads
    const formData = new FormData();
    formData.append("resume", values.resume);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/ai/review-resume", // The API endpoint for resume review
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Header required for file uploads
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setAnalysisResult(data.content);
        toast.success("Resume reviewed successfully!");
      } else {
        toast.error(data.message || "Failed to review the resume.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      resetForm();
      setFileName(""); // Clear the displayed file name
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 flex items-start flex-wrap gap-4 text-primary">
      <Formik
        initialValues={initialstate}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, errors, touched }) => (
          <Form className="w-full max-w-lg p-4 bg-white rounded-lg border border-light">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 text-[#4A7AFF]" />
              <h1 className="text-xl font-semibold">AI Resume Review</h1>
            </div>

            <div className="my-4 font-medium">
              <label htmlFor="resume">Upload Your Resume (PDF only)</label>
              <div
                className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer
                  ${errors.resume && touched.resume ? 'border-red-500' : 'border-gray-300'}`}
              >
                <input
                  id="resume"
                  type="file"
                  name="resume"
                  accept=".pdf" 
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files[0];
                    setFieldValue("resume", file);
                    setFileName(file ? file.name : "");
                  }}
                />
                 <label htmlFor="resume" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-gray-400" />
                    {fileName ? (
                        <span className="text-sm text-green-600 mt-2">{fileName}</span>
                    ) : (
                        <>
                         <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                         <span className="text-xs text-gray-400">PDF up to 5MB</span>
                        </>
                    )}
                 </label>
              </div>
              <ErrorMessage
                name="resume"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {loading ? (
                <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
              ) : (
                <FileText className="w-5" />
              )}
               Review Resume 
            </Button>
          </Form>
        )}
      </Formik>

      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-light min-h-96">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>
        <div className="flex-1 mt-4 overflow-y-auto">
          {!analysisResult && !loading && (
            <div className="flex h-full justify-center items-center">
                <div className="text-sm flex flex-col items-center gap-5 text-primary text-center">
                <FileText className="w-8 h-8 text-gray-400" />
                <p>Your resume analysis will appear here.</p>
                </div>
            </div>
          )}
          {loading && (
            <div className="flex h-full justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                    <span className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"></span>
                    <p className="text-sm text-gray-500">Analyzing your resume...</p>
                </div>
            </div>
          )}
          {analysisResult && (
            <div className="prose prose-sm max-w-none">
                <Markdown>{analysisResult}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewResume;
