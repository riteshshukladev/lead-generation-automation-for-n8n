import React from "react";
import { useGmail } from "../../contexts/GmailContext";

const SmsResult = () => {
  const { emailSendingResponse } = useGmail();

  if (!emailSendingResponse || Object.keys(emailSendingResponse).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 text-gray-800 min-h-48 md:min-h-0">
        Excute the email sending
      </div>
    );
  }

  const { type } = emailSendingResponse;

  if (type === "success") {
    const { sent = 0, unsent = 0, total = 0 } = emailSendingResponse;
    return (
      <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 text-gray-800 min-h-48 md:min-h-0 w-full">
        <h4 className="text-lg font-medium text-black mb-2">
          Email send summary
        </h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div className="font-mono text-bg-success text-base font-medium">
            Sent:{" "}
            <span className="font-mono text-bg-success text-base font-medium">
              {sent}
            </span>
          </div>
          <div className="font-mono text-bg-error text-base font-medium">
            Unsent:{" "}
            <span className="font-mono text-bg-error text-base font-medium">
              {unsent}
            </span>
          </div>
          <div className="font-mono text-black text-base font-medium">
            Total:{" "}
            <span className="font-mono text-black text-base font-medium">
              {total}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // error or other response types
  return (
    <div className="flex flex-col items-center justify-center border-2 border-red-300 p-4 text-red-800 min-h-48 md:min-h-0">
      <h4 className="text-sm font-medium mb-2">Email sending result</h4>
      <div className="font-mono text-bg-error text-base font-medium">
        {emailSendingResponse.error || JSON.stringify(emailSendingResponse)}
      </div>
    </div>
  );
};

export default SmsResult;
