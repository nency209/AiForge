import React, { useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Sparkles,  Hash } from "lucide-react";
import * as yup from "yup";
import { Button } from "@mui/material";
  
export const BlogTitle = () => {
  const initialstate = {
    name: "",
  };
  const validationSchema = yup.object({
    name: yup.string().required("Blog title is required"),
  });

  const handleSubmit = (values, resetform) => {
    resetform();
  };

  const blogcategory = ['General','Technology','Business','Health','Lifestyle','Education','Travel','Food'
  ];

  const [selectedcategory, setselectedcategory] = useState('General');
  const [input, setinput] = useState("");
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
            <h1 className="text-xl font-semibold">AI Title Generator</h1>
          </div>
          <div className="my-4 font-medium">
            <label htmlFor="name">Keyword</label>
            <Field
              type="text"
              name="name"
              className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-light"
              placeholder="The future of artificial intelligence..."
              onChange={(e) => setinput(e.target.value)}
              value={input}
            />
            <ErrorMessage
              name="name"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>
          <label className="mt-6 font-medium">Category</label>
          <div className="mt-3 font-normal flex flex-wrap gap-3 sm:max-w-9/11">
            {blogcategory.map((item, index) => (
              <span
                onClick={() => setselectedcategory(item)}
                key={index}
                className={`text-xs space-x-4 max-w-lg px-4 py-1 border rounded-full cursor-pointer ${
                  selectedcategory == item
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 border-gray-300"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <br />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Hash className="w-5" /> Generate Title
          </Button>
        </Form>
      </Formik>
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-light min-h-96 ">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">AI Title Generator</h1>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <div className="text-sm flex flex-col items-center gap-5 text-primary">
            <Hash className="w-5 h-5 text-[#4A7AFF]" />
            <p>Enter a topic and click "Generate Title" to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
};

