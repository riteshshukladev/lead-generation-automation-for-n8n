import React, { useState, useRef } from "react";
import { useGmail } from "../../contexts/GmailContext";

const MailFormatGrid = () => {
  const [showModal, setShowModal] = useState(false);
  const [mailType, setMailType] = useState("");
  const [draggedName, setDraggedName] = useState(false);
  const textareaRef = useRef(null);

  const {
    dynamicMail,
    setDynamicMail,
    staticMail,
    setStaticMail,
    subject,
    setSubject,
    senderEmail,
    setSenderEmail,
    status,
  } = useGmail();

  const openModal = (type) => {
    setMailType(type);
    setShowModal(true);
    setDraggedName(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setMailType("");
    setDraggedName(false);
  };

  const handleSave = () => {
    // Save logic here
    console.log(
      `Saved ${mailType} mail:`,
      mailType === "dynamic" ? dynamicMail : staticMail
    );
    closeModal();
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", "{name}");
    setDraggedName(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData("text/plain");

    if (droppedText === "{name}" && textareaRef.current) {
      const textarea = textareaRef.current;

      // Focus the textarea and use document.caretPositionFromPoint if available
      textarea.focus();

      // Try to use caretPositionFromPoint for precise positioning
      let insertPosition = textarea.selectionStart; // fallback position

      if (document.caretPositionFromPoint) {
        const caret = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (caret && caret.offsetNode && caret.offsetNode.nodeValue) {
          // This works for some browsers but not in textarea
        }
      }

      // Alternative approach: calculate position based on click coordinates
      const rect = textarea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Simulate a click at the drop position to set cursor
      const clickEvent = new MouseEvent("mousedown", {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true,
      });
      textarea.dispatchEvent(clickEvent);

      // Small delay to allow cursor positioning
      setTimeout(() => {
        const cursorPosition = textarea.selectionStart;
        const newText =
          dynamicMail.substring(0, cursorPosition) +
          "{name}" +
          dynamicMail.substring(cursorPosition);
        setDynamicMail(newText);

        // Set cursor position after the inserted text
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(cursorPosition + 6, cursorPosition + 6);
        }, 0);
      }, 10);
    }
    setDraggedName(false);
  };

  const handleTextareaClick = (e) => {
    // Update cursor position for potential name insertion
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 min-h-48 md:min-h-0 gap-6">
      <h4 className="mb-2 text-black text-lg md:text-xl font-medium text-center">
        Set the template for the named emails and org emails.
      </h4>
      <div className="flex gap-8">
        <button
          className="border border-blue-500 rounded-lg px-6 py-4 bg-blue-100 text-blue-900 font-medium hover:bg-blue-200 transition-colors"
          onClick={() => openModal("dynamic")}
        >
          Dynamic Mail Format
        </button>
        <button
          className="border border-gray-500 rounded-lg px-6 py-4 bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition-colors"
          onClick={() => openModal("static")}
        >
          Static Mail Format
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {mailType === "dynamic"
                ? "Edit Dynamic Mail Format"
                : "Edit Static Mail Format"}
            </h3>

            {/* Subject and Sender Email fields */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="w-full border border-black text-black rounded p-2 mb-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender's Email
              </label>
              <div className="w-full border rounded p-2 border-black text-black bg-gray-100 cursor-not-allowed">
                {status.userEmail || "No account connected"}
              </div>
            </div>

            {mailType === "dynamic" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-gray-600">
                    Drag this to position:
                  </span>
                  <div
                    draggable
                    onDragStart={handleDragStart}
                    className="inline-block px-3 py-1 bg-blue-100 border border-blue-300 rounded cursor-move text-blue-800 font-mono text-sm hover:bg-blue-200 transition-colors"
                  >
                    {"{name}"}
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  className={`w-full h-40 border rounded p-3 text-black resize-none transition-colors ${
                    draggedName
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300"
                  }`}
                  value={dynamicMail}
                  onChange={(e) => setDynamicMail(e.target.value)}
                  onClick={handleTextareaClick}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  placeholder="Drag the {name} tag above to any position in your email template..."
                />

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  💡 Tip: Drag the blue {"{name}"} tag into the email content
                  where you want the recipient's name to appear.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  className="w-full h-40 border border-gray-300 text-black rounded p-3 resize-none"
                  value={staticMail}
                  onChange={(e) => setStaticMail(e.target.value)}
                  placeholder="Enter your static email template here..."
                />

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  📝 This template will be sent as-is to all recipients.
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                onClick={closeModal}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={handleSave}
                type="button"
              >
                Save Format
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailFormatGrid;
