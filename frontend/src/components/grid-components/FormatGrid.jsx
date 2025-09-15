import React from "react";
import { useGmail } from "../../contexts/GmailContext";

const FormatGrid = () => {
  const {
    fileName,
    setFileName,
    isLoading,
    setIsLoading,
    validationStatus,
    setValidationStatus,
    fileData,
    setFileData,
  } = useGmail();

  const validateFileFormat = (data) => {
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return false;
      if (parsed.length === 0) return false;
      for (let item of parsed) {
        if (typeof item !== "object" || item === null) return false;
        if (!item.hasOwnProperty("query") || typeof item.query !== "string")
          return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsLoading(true);
      setValidationStatus("");
      setFileData(null);

      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileContent = event.target.result;
          if (validateFileFormat(fileContent)) {
            setFileName(file.name);
            setValidationStatus("success");
            setFileData(JSON.parse(fileContent));
          } else {
            setValidationStatus("error");
            setFileName("");
            setFileData(null);
            alert(
              "Invalid file format! Please ensure your JSON file matches the required structure with an array of objects containing 'query' properties."
            );
            e.target.value = "";
          }
          setIsLoading(false);
        };
        reader.onerror = () => {
          setValidationStatus("error");
          setFileName("");
          setFileData(null);
          alert("Error reading file! Please make sure it's a valid JSON file.");
          setIsLoading(false);
          e.target.value = "";
        };
        reader.readAsText(file);
      } catch {
        setValidationStatus("error");
        setFileName("");
        setFileData(null);
        alert("Error reading file! Please make sure it's a valid JSON file.");
        setIsLoading(false);
        e.target.value = "";
      }
    } else {
      setFileName("");
      setValidationStatus("");
      setFileData(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 min-h-[40px] md:min-h-0">
      <h2 className="mb-2 text-black text-lg md:text-xl font-medium">
        Pass the query
      </h2>
      <div className="inline-block">
        <label className="relative cursor-pointer">
          <input
            type="file"
            onChange={handleFileChange}
            className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"
          />
          <span className="border border-gray-300 text-xs md:text-sm font-medium bg-gray-200 px-3 py-2 sm:px-4 sm:py-3 pr-8 text-gray-700 leading-tight rounded focus:outline-none focus:bg-white focus:border-gray-500 w-auto inline-block">
            {fileName ? fileName : "Choose file"}
          </span>
        </label>
      </div>
      <div className="mt-3 w-full max-w-md">
        <div className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs md:text-sm">
          <span>
            Format: <br />
            <span className="block mt-1">
              [&#123; query: "your+query+here" &#125;]
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormatGrid;
