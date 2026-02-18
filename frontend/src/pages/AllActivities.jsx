import { useEffect, useState } from "react";
import api from "../services/api";

function AllActivities({ onBack }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/admin/activities/all")
      .then((res) => {
        setActivities(res.data);
      })
      .catch((err) => {
        console.error("Failed to load activities", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
      >
        ← Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold mb-6">
        All Activities
      </h2>

      {loading ? (
        <p className="text-slate-500">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p className="text-slate-500">
          No activities found.
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <p className="font-medium text-slate-800">
                {activity.message}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(
                  activity.createdAt
                ).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllActivities;
