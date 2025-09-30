import React, { useEffect, useState } from "react";
import { Gem, Sparkles } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";


const Protect = ({ children, fallback }) => {
  // Mocking a non-premium user for demonstrationa
  const hasPremiumPlan = false;
  return hasPremiumPlan ? <>{children}</> : <>{fallback}</>;
};

const Creationitem = ({ item }) => {
    const isImage = item.type === 'image';
    return (
        <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold capitalize text-gray-800">{item.type || 'Creation'}</p>
                    <p className="text-sm text-gray-600 truncate max-w-md">{item.prompt || 'No prompt provided.'}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="mt-3">
                {isImage ? (
                    <img src={item.content} alt={item.prompt} className="rounded-md max-h-48 w-auto object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x200/cccccc/ffffff?text=Image+Error'; }}/>
                ) : (
                    <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md line-clamp-3">{item.content || 'No content.'}</p>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

const Dashboard = () => {
  // Initialize state with an empty array to prevent errors
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken: fetchToken } = useAuth();

  const getDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/ai/get-user-creations", {
        headers: {
          Authorization: `Bearer ${await fetchToken()}`,
        },
      });

      if (data.success) {
       
        setCreations(data.creations || []);
      } else {
        toast.error(data.message || "Failed to fetch creations.");
        setCreations([]); 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not fetch data.");
      console.error("Error fetching dashboard data:", error);
      setCreations([]); // Critical: Ensure creations is an array even on network/server error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-50">
      <div className="flex justify-start gap-4 flex-wrap">
        {/* Total Creations Card */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-light shadow-sm">
          <div className="text-primary">
            <p className="text-md text-gray-600">Total Creations</p>
            {/* This line is now safe because `creations` is always an array */}
            <h2 className="text-2xl font-semibold text-gray-800">
              {loading ? "..." : creations.length}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Active plan card */}
        <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-light shadow-sm">
          <div className="text-primary">
            <p className="text-md text-gray-600">Active Plan</p>
            <h2 className="text-2xl font-semibold text-gray-800">
              <Protect fallback="Free">
                Premium
              </Protect>
            </h2>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#9E53EE] to-[#FF61C5] text-white flex justify-center items-center shadow-lg">
            <Gem className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-4 font-semibold text-xl text-gray-700">Recent Creations</p>
        {loading ? (
            <div className="text-center p-10">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-500">Loading creations...</p>
            </div>
        ) : creations.length > 0 ? (
            <div className="space-y-4">
                {/* This map call is also safe now */}
                {creations.map((item) => <Creationitem key={item.id} item={item} />)}
            </div>
        ) : (
            <div className="text-center p-10 bg-white rounded-lg border border-dashed">
                <p className="text-gray-500">No creations yet. Start creating something amazing!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
