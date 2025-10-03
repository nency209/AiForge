import React, { useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Sparkles, Image } from "lucide-react";
import * as yup from "yup";
import { Button } from "@mui/material";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";


axios.defaults.baseURL = import.meta.env.VITE_BASE_URL||"http://localhost:8000";


const GenerateImage = () => {
  const initialstate = {
    name: "",
    ispublic: false,
  };
  const validationSchema = yup.object({
    name: yup.string().required("A description for your image is required."),
  });


   const handleSubmit = async (values) => {
    try {
      setloading(true);
      
      // The prompt is now correctly constructed to include the selected style.
      const prompt = `${values.name}, in a ${selectedstyle}`; 

      const { data } = await axios.post(
        "/api/ai/generate-image",
        // The payload now correctly sends the prompt and the 'ispublic' value.
        { prompt, ispublic: values.ispublic },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        // The component now expects 'imageUrl' from the backend.
        setImageUrl(data.imageUrl);
        toast.success("Image generated successfully!");
      } else {
        toast.error(data.message || "An unknown error occurred.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setloading(false);
      
    }
  };
  const ImageStyle = [
    "Realistic",
    "Ghibli style",
    "Anime style",
    "Cartoon style",
    "Fantasy style",
    "3D style",
    "Portrait style",
  ];

  const [selectedstyle, setselectedstyle] = useState("Realistic");
   const [loading, setloading] = useState(false);
    
    const [imageUrl, setImageUrl] = useState("");
    const { getToken } = useAuth();

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
            <h1 className="text-xl font-semibold">AI Image Generator</h1>
          </div>
          <div className="my-4 font-medium">
            <label htmlFor="name">Describe Your Image</label>
            {/* Using Formik's Field component for the textarea ensures proper state management. */}
            <Field
              as="textarea"
              name="name"
              rows={4}
              className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-light"
              placeholder="A majestic lion with a crown of stars, in a cosmic nebula..."
            />
            <ErrorMessage
              name="name"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>
          <label className="mt-6 font-medium">Image Style</label>
          <div className="mt-3 font-normal flex flex-wrap gap-3 sm:max-w-9/11">
            {ImageStyle.map((item, index) => (
              <span
                onClick={() => setselectedstyle(item)}
                key={index}
                className={`text-xs space-x-4 max-w-lg px-4 py-1 border rounded-full cursor-pointer ${
                  selectedstyle === item
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 border-gray-300"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="my-6 flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <Field
                as="input"
                type="checkbox"
                name="ispublic"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full transition-colors peer-checked:bg-green-500"></div>
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
            </label>
            <p>Make this image public</p>
          </div>
          <Button
            disabled={loading}
            type="submit"
            variant="contained"
            color="primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {loading ? (
              <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
            ) : (
              <Image className="w-5" />
            )}
            Generate Image
          </Button>
        </Form>
      </Formik>
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-light min-h-96 ">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

         {!imageUrl ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-primary">
              <Image className="w-5 h-5 text-[#4A7AFF]" />
              <p>Your generated image will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 h-full w-full flex justify-center items-center">
             <img src={imageUrl} alt="Generated by AI" className="rounded-lg max-w-full max-h-full object-contain" />
          </div>
        )}

        
      </div>
    </div>
  );
};

export default GenerateImage;
