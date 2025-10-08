import React, { useState } from "react";
import axios from "axios";

const ImageUpload = () => {
  const [image, setImage] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setImage(e.target.files[0]);

  const handleUpload = async () => {
    if (!image) return alert("Select an image!");

    setLoading(true);
    try {
      // Step 1: Upload image to server (or cloud)
      const formData = new FormData();
      formData.append("file", image);
      const uploadRes = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = uploadRes.data.url; // /upload route must return URL

      // Step 2: Send URL to AI tagging
      const tagRes = await axios.post("/api/auto-tag", { imageUrl });
      setTags(tagRes.data.tags);
    } catch (err) {
      console.error(err);
      alert("Error uploading or tagging image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>{loading ? "Processing..." : "Upload & Tag"}</button>
      {tags.length > 0 && (
        <div>
          <h3>Tags:</h3>
          <ul>
            {tags.map((tag, idx) => (
              <li key={idx}>{tag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
