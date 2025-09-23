import React,{ useState } from "react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { Sparkles, Eraser, UploadCloud, Image as ImageIcon } from "lucide-react";
import * as yup from "yup";
import { Button } from "@mui/material";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";


axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveBackground = () => {
  const [loading, setLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState(null); 
  const [processedImage, setProcessedImage] = useState(null); 
  const { getToken } = useAuth();

  const initialstate = {
    image: null, 
  };

  const validationSchema = yup.object({
    
    image: yup
      .mixed()
      .required("An image file is required.")
      .test(
        "fileType",
        "Unsupported file format. Please upload a JPG, PNG, or WEBP.",
        (value) =>
          value && ["image/jpeg", "image/png", "image/webp"].includes(value.type)
      ),
  });

  const handleSubmit = async (values, { resetForm }) => {
    setLoading(true);
    setProcessedImage(null); 

    // Use FormData to send the file to the backend
    const formData = new FormData();
    formData.append("image", values.image);

    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/ai/remove-img-background", // Correct API endpoint
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Header for file uploads
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setProcessedImage(data.imageUrl); 
        toast.success("Background removed successfully!");
      } else {
        toast.error(data.message || "Failed to remove background.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      resetForm();
      setOriginalImage(null); // Clear the preview
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
              <h1 className="text-xl font-semibold">Background Remover</h1>
            </div>

            <div className="my-4 font-medium">
              <label htmlFor="image">Upload Image</label>
              <div
                className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer
                  ${errors.image && touched.image ? 'border-red-500' : 'border-gray-300'}`}
              >
                <input
                  id="image"
                  type="file"
                  name="image"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files[0];
                    setFieldValue("image", file);
                    setOriginalImage(file ? URL.createObjectURL(file) : null);
                  }}
                />
                {!originalImage ? (
                  <label htmlFor="image" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-400">PNG, JPG, or WEBP</span>
                  </label>
                ) : (
                  <div className="flex justify-center">
                    <img src={originalImage} alt="Preview" className="max-h-32 rounded-md" />
                  </div>
                )}
              </div>
              <ErrorMessage
                name="image"
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
                <Eraser className="w-5" />
              )}
               Remove Background
            </Button>
          </Form>
        )}
      </Formik>

      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-light min-h-96">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Result</h1>
        </div>
        <div className="flex-1 flex justify-center items-center mt-4">
          {!processedImage && !loading && (
            <div className="text-sm flex flex-col items-center gap-5 text-primary text-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <p>Your image without a background will appear here.</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center gap-3">
                 <span className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"></span>
                 <p className="text-sm text-gray-500">Processing image...</p>
            </div>
          )}
          {processedImage && (
             <img src={processedImage} alt="Background removed" className="max-w-full max-h-full object-contain rounded-md" />
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveBackground;
