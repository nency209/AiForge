import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import WriteArticle from "./pages/WriteArticle";
import GenerateImage from "./pages/GenerateImage";
import ReviewResume from "./pages/ReviewResume";
import RemoveObject from "./pages/RemoveObject";
import RemoveBackground from "./pages/RemoveBackground";
import { BlogTitle } from "./pages/BlogTitle";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import Toaster from ''

const App = () => {
  // --- Start of Token Logging Code ---
  const { getToken } = useAuth();

  useEffect(() => {
    const logToken = async () => {
      try {
        const token = await getToken();
        console.log("--- CLERK SESSION TOKEN ---");
        console.log(token);
        console.log("--- COPY THE TOKEN ABOVE ---");
      } catch (error) {
        console.error("Failed to get token:", error);
      }
    };
    
    // Log the token whenever the component mounts
    logToken();
  }, [getToken]);
  // --- End of Token Logging Code ---

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="write-article" element={<WriteArticle />} />
          <Route path="generate-image" element={<GenerateImage />} />
          <Route path="review-resume" element={<ReviewResume />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="blog-title" element={<BlogTitle />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
