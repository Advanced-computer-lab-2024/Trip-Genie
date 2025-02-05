import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const FileViewer = ({ filename }) => {
  const [error, setError] = useState(null);

  const fetchFile = async () => {
    try {
      const token = Cookies.get("jwt");
      setError(null); // Clear previous errors
      const response = await axios.get(
        `http://localhost:4000/admin/files/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // Important for binary data
        }
      );

      // Create a URL for the fetched file blob
      const blobUrl = URL.createObjectURL(response.data);

      // Open the file in a new tab
      window.open(blobUrl, "_blank");
    } catch (err) {
      setError("Failed to fetch the file");
      console.error(err);
    }
  };

  return (
    <div className="mt-20">
      <button onClick={fetchFile}>View File</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default FileViewer;
