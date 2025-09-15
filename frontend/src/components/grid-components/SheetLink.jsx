import React from "react";
import { useGmail } from "../../contexts/GmailContext";

const SheetLink = () => {
  const { selectedDocs, fileData } = useGmail();
  const sheet = selectedDocs.sheet;

  if (!sheet || !sheet.id || !fileData) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 text-gray-800 min-h-48 md:min-h-0">
        Complete the previous processes.
      </div>
    );
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}`;

  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 min-h-[40px] md:min-h-0">
      <h4 className="text-lg md:text-xl font-medium text-black mb-2 text-center">
        Check your google sheet once, for correction prupose.
      </h4>
      <a
        href={sheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-2xl border border-black px-6 py-4 text-base font-medium font-inherit bg-transparent cursor-pointer transition-colors duration-250 text-black hover:border-gray-600"
      >
        Open "{sheet.name}"
      </a>
    </div>
  );
};

export default SheetLink;
