import React from "react";

const UploadModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl p-8 w-96 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Upload New Post</h2>
        <input type="file" className="block w-full mb-4" />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
