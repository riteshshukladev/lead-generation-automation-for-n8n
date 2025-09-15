import React, { useEffect, useState } from "react";
import { useGmail } from "../../contexts/GmailContext";
import { gmailService } from "../../services/gmailService";

const FileSelectDropDown = ({ userId }) => {
  const {
    selectedDocs,
    AccessToken,
    setAccessToken,
    setSelectedDocs,
    status,
    driveFiles,
    setDriveFiles,
    sheetFiles,
    setSheetFiles,
    sheetNames,
    setSheetNames,
  } = useGmail();

  const [loadingDrive, setLoadingDrive] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingSheetNames, setLoadingSheetNames] = useState(false);

  useEffect(() => {
    if (status?.connected && userId) {
      setLoadingDrive(true);
      gmailService
        .getDriveFiles(userId)
        .then((res) => {
          console.log("Drive files:", res.files);
          setDriveFiles(res.files || []);
          setAccessToken(res.access_token);
        })
        .catch((err) => {
          setDriveFiles([]);
          console.error("Failed to fetch Drive files:", err);
        })
        .finally(() => {
          setLoadingDrive(false);
        });

      setLoadingSheets(true);
      gmailService
        .getSheets(userId)
        .then((res) => {
          console.log("Sheet files:", res.files);
          setSheetFiles(res.files || []);
          setAccessToken(res.access_token);
        })
        .catch((err) => {
          setSheetFiles([]);
          console.error("Failed to fetch Google Sheets:", err);
        })
        .finally(() => {
          setLoadingSheets(false);
        });
    }
  }, [
    status?.connected,
    userId,
    driveFiles.length,
    sheetFiles.length,
    setDriveFiles,
    setSheetFiles,
  ]);

  // After selecting a sheet
  useEffect(() => {
    if (selectedDocs.sheet?.id && AccessToken) {
      setLoadingSheetNames(true);
      gmailService
        .fetchSheetNames(selectedDocs.sheet.id, AccessToken)
        .then((names) => {
          console.log("Sheet names:", names);
          setSheetNames(names);
        })
        .catch((err) => console.error("Failed to fetch sheet names:", err))
        .finally(() => {
          setLoadingSheetNames(false);
        });
    }
  }, [selectedDocs.sheet?.id, AccessToken]);

  const handleDriveChange = (e) => {
    const fileId = e.target.value;
    const file = driveFiles.find((f) => f.id === fileId);
    setSelectedDocs((prev) => ({
      ...prev,
      drive: file ? { id: file.id, name: file.name } : "",
    }));
  };

  const handleSheetChange = (e) => {
    const fileId = e.target.value;
    const file = sheetFiles.find((f) => f.id === fileId);
    setSelectedDocs((prev) => ({
      ...prev,
      sheet: file ? { id: file.id, name: file.name } : "",
      sheetTab: "", // Reset sheet tab when changing sheet
    }));
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full">
      {/* Drive File Dropdown */}
      <div className="relative">
        <select
          className="appearance-none bg-gray-200 border border-gray-300 rounded px-3 py-2 sm:px-4 sm:py-3 pr-8 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 min-w-[200px] cursor-pointer max-w-[200px]"
          value={selectedDocs.drive?.id || ""}
          onChange={handleDriveChange}
          disabled={loadingDrive || !driveFiles.length}
        >
          <option value="">
            {loadingDrive ? "Loading..." : "Select drive file"}
          </option>
          {driveFiles.map((file) => (
            <option key={file.id} value={file.id}>
              {file.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      
      {/* Sheet File Dropdown */}
      <div className="relative">
        <select
          className="appearance-none bg-gray-200 border border-gray-300 rounded px-3 py-2 sm:px-4 sm:py-3 pr-8 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 min-w-[200px] cursor-pointer max-w-[200px]"
          value={selectedDocs.sheet?.id || ""}
          onChange={handleSheetChange}
          disabled={loadingSheets || !sheetFiles.length}
        >
          <option value="">
            {loadingSheets ? "Loading..." : "Select sheet"}
          </option>
          {sheetFiles.map((file) => (
            <option key={file.id} value={file.id}>
              {file.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      
      {/* Sheet Tab Dropdown */}
      <div className="relative">
        <select
          className="appearance-none bg-green-100 border border-green-300 rounded px-3 py-2 sm:px-4 sm:py-3 pr-8 text-green-700 leading-tight focus:outline-none focus:bg-white focus:border-green-500 min-w-[200px] cursor-pointer max-w-[200px]"
          value={selectedDocs.sheetTab || ""}
          onChange={(e) =>
            setSelectedDocs((prev) => ({
              ...prev,
              sheetTab: e.target.value,
            }))
          }
          disabled={!selectedDocs.sheet?.id || loadingSheetNames}
        >
          <option value="">
            {loadingSheetNames ? "Loading..." : "Choose sheet tab"}
          </option>
          {sheetNames.map((tabName) => (
            <option key={tabName} value={tabName}>
              {tabName}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-700">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default FileSelectDropDown;