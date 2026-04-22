"use client";

import { ToastContainer } from "react-toastify";

export default function ToastProvider() {
  return (
    <ToastContainer
      autoClose={2600}
      closeButton
      closeOnClick
      draggable
      hideProgressBar={false}
      limit={4}
      newestOnTop
      pauseOnFocusLoss={false}
      position="top-right"
      theme="colored"
    />
  );
}
