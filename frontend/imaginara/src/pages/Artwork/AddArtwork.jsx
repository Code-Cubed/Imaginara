// AddArtwork.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftBar from '../../components/leftBar/LeftBar';
import './AddArtwork.css';
import TopBar from '../../components/topBar/topBar';
const AddArtwork = ({ onLogout }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    mediaType: 'image',
    file: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'Art',
    'Photography',
    'Writing',
    'Performance',
    'Digital Art',
    'Sculpture',
    'Music',
    'Dance',
    'Other'
  ];

  const mediaTypes = [
    { value: 'image', label: 'Image', accept: 'image/*' },
    { value: 'video', label: 'Video', accept: 'video/*' },
    { value: 'audio', label: 'Audio', accept: 'audio/*' },
    { value: 'document', label: 'Document', accept: '.pdf,.doc,.docx' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }

      setFormData({ ...formData, file });
      setError('');

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.title || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('tags', formData.tags);
    submitData.append('mediaType', formData.mediaType);
    submitData.append('file', formData.file);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/artworks', {
        method: 'POST',
        body: submitData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: '',
        mediaType: 'image',
        file: null
      });
      setPreview(null);
      setSuccess('Artwork uploaded successfully!');
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to upload artwork');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="page-container">
      <LeftBar onLogout={onLogout} />
      
      <div className="main-content">
        <TopBar />
        <div className="upload-container">
          <div className="upload-header">
            <h1 className="upload-title">Upload Artwork</h1>
            <p className="upload-subtitle">Share your creative work with the community</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="upload-form">
            {/* Media Type Selection */}
            <div className="form-group">
              <label className="form-label">
                Media Type <span className="required">*</span>
              </label>
              <div className="media-type-grid">
                {mediaTypes.map((type) => (
                  <label key={type.value} className="media-type-option">
                    <input
                      type="radio"
                      name="mediaType"
                      value={type.value}
                      checked={formData.mediaType === type.value}
                      onChange={handleInputChange}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="form-group">
              <label className="form-label">
                Upload File <span className="required">*</span>
              </label>
              <div className="file-upload-area">
                {preview ? (
                  <div className="preview-container">
                    {formData.mediaType === 'image' && (
                      <img src={preview} alt="Preview" className="preview-image" />
                    )}
                    {formData.mediaType === 'video' && (
                      <video src={preview} controls className="preview-video" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, file: null });
                        setPreview(null);
                      }}
                      className="remove-file-btn"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="file-upload-label">
                    <div className="upload-icon">📤</div>
                    <p className="upload-text">Click to upload or drag and drop</p>
                    <p className="upload-subtext">Maximum file size: 50MB</p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept={mediaTypes.find(t => t.value === formData.mediaType)?.accept}
                      className="file-input"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter artwork title"
                required
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
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
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Describe your artwork..."
                rows={4}
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., abstract, colorful, nature"
              />
            </div>

            {/* Submit Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Uploading...' : 'Upload Artwork'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddArtwork;