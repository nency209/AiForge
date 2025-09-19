
import React from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Sparkles, FileText } from "lucide-react";
import * as yup from "yup";
import { Button } from "@mui/material";

const ReviewResume = () => {
  const initialstate = {
    image: "",
    
  }
  const validationSchema = yup.object({
   iamge:yup.string().required("image is required"),
  });

  const handleSubmit = (values, { resetForm }) => {
    resetForm();
  };

  ;


  return (
    <div className="h-full overflow-y-auto p-6 flex items-start flex-wrap gap-4 text-primary">
    <Formik
        initialValues={initialstate}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form className="w-full max-w-lg p-4 bg-white rounded-lg border border-light">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 text-[#4A7AFF]" />
            <h1 className="text-xl font-semibold">Resume Review</h1>
          </div>
          <div className="my-4 font-medium">
            <label htmlFor="name">Upload Resume</label>
            <Field
              type="file"
              name="name"
              className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-light"
            
             
            />
            <ErrorMessage
              name="name"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>
         
          <br />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FileText className="w-5" /> Review Resume 
          </Button>
        </Form>
      </Formik>
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-light min-h-96 ">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <div className="text-sm flex flex-col items-center gap-5 text-primary">
            <FileText className="w-5 h-5 text-[#4A7AFF]" />
            <p>Enter a topic and click "Review Resume" to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewResume;
