import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../Context/ThemeContext";
import axios from "axios";

const AddArtwork = ({ onLogout }) => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    mediaType: "image",
    file: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Art",
    "Photography",
    "Writing",
    "Performance",
    "Digital Art",
    "Sculpture",
    "Music",
    "Dance",
    "Other",
  ];

  const mediaTypes = [
    { value: "image", label: "Image", accept: "image/*" },
    { value: "video", label: "Video", accept: "video/*" },
    { value: "audio", label: "Audio", accept: "audio/*" },
    { value: "document", label: "Document", accept: ".pdf,.doc,.docx" },
  ];

  // 🔹 Handle input
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "radio") {
      setFormData({ ...formData, mediaType: value, file: null });
      setPreview(null);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 🔹 Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setFormData({ ...formData, file });
    setError("");

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // 🔹 AI Tag Generator
  const handleGenerateTags = async () => {
    if (!formData.file) {
      setError("Please upload an image first.");
      return;
    }

    setTagLoading(true);
    setError("");
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("image", formData.file);

      const res = await axios.post("http://localhost:8000/api/ai/generate-tags", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const generatedTags = res.data.tags.join(", ");
      setFormData((prev) => ({ ...prev, tags: generatedTags }));
    } catch (err) {
      console.error(err);
      setError("Failed to generate AI tags");
    } finally {
      setTagLoading(false);
    }
  };

  // 🔹 Submit Artwork
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return setError("Please select a file to upload");
    if (!formData.title || !formData.category)
      return setError("Please fill in all required fields");

    setLoading(true);
    setError("");
    setSuccess("");

    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("category", formData.category);
    submitData.append("tags", formData.tags);
    submitData.append("mediaType", formData.mediaType);
    submitData.append("file", formData.file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/artworks", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      setFormData({
        title: "",
        description: "",
        category: "",
        tags: "",
        mediaType: "image",
        file: null,
      });
      setPreview(null);
      setSuccess("Artwork uploaded successfully!");

      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      setError(err.message || "Failed to upload artwork");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-theme={theme} className="min-h-screen flex flex-col items-center py-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Upload Artwork</h1>
          <p className="text-base text-gray-500">Share your creative work with the community</p>
        </div>

        {error && (
          <div className="mb-4 text-red-700 border border-red-300 rounded px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-700 border border-green-300 rounded px-4 py-2 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Type */}
          <div>
            <label className="block font-medium mb-2">
              Media Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {mediaTypes.map((type) => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mediaType"
                    value={type.value}
                    checked={formData.mediaType === type.value}
                    onChange={handleInputChange}
                    className="form-radio accent-indigo-500"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block font-medium mb-2">
              Upload File <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col items-center">
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  {formData.mediaType === "image" && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-48 h-48 object-contain rounded shadow"
                    />
                  )}
                  {formData.mediaType === "video" && (
                    <video src={preview} controls className="w-48 h-48 rounded shadow" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, file: null });
                      setPreview(null);
                    }}
                    className="text-xs text-red-500 hover:underline mt-1"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer w-full">
                  <div className="text-3xl mb-2">📤</div>
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mb-2">Maximum file size: 50MB</p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={mediaTypes.find((t) => t.value === formData.mediaType)?.accept}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter artwork title"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Describe your artwork..."
              rows={4}
            />
          </div>

          {/* Tags + AI Button */}
          <div>
            <label className="block font-medium mb-2">Tags (comma-separated)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g., abstract, colorful, nature"
              />
              <button
                type="button"
                onClick={handleGenerateTags}
                disabled={tagLoading || !formData.file}
                className="px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition disabled:opacity-60"
              >
                {tagLoading ? "Generating..." : "✨ AI Generate"}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded text-white font-semibold bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Upload Artwork"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddArtwork;
