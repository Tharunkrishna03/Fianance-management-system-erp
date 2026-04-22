"use client";

import { toast } from "react-toastify";

const SUCCESS_AUTO_CLOSE = 2200;
const ERROR_AUTO_CLOSE = 3200;
const INFO_AUTO_CLOSE = 1800;

function resolveMessage(message, payload, fallback) {
  if (typeof message === "function") {
    return message(payload);
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (message !== undefined && message !== null && message !== "") {
    return String(message);
  }

  return fallback;
}

function getAutoClose(type, autoClose, duration) {
  if (autoClose !== undefined) {
    return autoClose;
  }

  if (duration !== undefined) {
    return duration;
  }

  if (type === "error") {
    return ERROR_AUTO_CLOSE;
  }

  if (type === "info" || type === "warning") {
    return INFO_AUTO_CLOSE;
  }

  return SUCCESS_AUTO_CLOSE;
}

function openToast(type, message, options = {}) {
  const { autoClose, duration, ...rest } = options;
  const toastOptions = {
    ...rest,
    autoClose: getAutoClose(type, autoClose, duration),
  };

  if (type === "success") {
    return toast.success(message, toastOptions);
  }

  if (type === "error") {
    return toast.error(message, toastOptions);
  }

  if (type === "info") {
    return toast.info(message, toastOptions);
  }

  if (type === "warning") {
    return toast.warning(message, toastOptions);
  }

  return toast(message, toastOptions);
}

export function getNotifier() {
  return { toast };
}

export const notify = {
  success(message, options = {}) {
    return openToast("success", message, options);
  },

  error(message, options = {}) {
    return openToast("error", message, options);
  },

  info(message, options = {}) {
    return openToast("info", message, options);
  },

  warning(message, options = {}) {
    return openToast("warning", message, options);
  },

  action(message, options = {}) {
    const { type = "info", ...rest } = options;
    return openToast(type, message, {
      autoClose: INFO_AUTO_CLOSE,
      ...rest,
    });
  },

  loading(message, options = {}) {
    const { autoClose, duration, ...rest } = options;
    return toast.loading(message, {
      autoClose: autoClose ?? duration ?? false,
      closeOnClick: false,
      draggable: false,
      ...rest,
    });
  },

  update(id, options = {}) {
    const {
      render = "",
      type = "default",
      autoClose,
      duration,
      ...rest
    } = options;

    if (!id) {
      return openToast(type, render, { autoClose, duration, ...rest });
    }

    return toast.update(id, {
      render,
      type,
      isLoading: false,
      autoClose: getAutoClose(type, autoClose, duration),
      ...rest,
    });
  },

  dismiss(id) {
    return toast.dismiss(id);
  },

  async promise(task, options = {}) {
    const {
      loading = "Working...",
      success = "Done.",
      error = "Something went wrong.",
      loadingOptions = {},
      successOptions = {},
      errorOptions = {},
    } = options;

    const toastId = this.loading(
      resolveMessage(loading, undefined, "Working..."),
      loadingOptions,
    );

    try {
      const result = await (typeof task === "function" ? task() : task);

      this.update(toastId, {
        render: resolveMessage(success, result, "Done."),
        type: "success",
        ...successOptions,
      });

      return result;
    } catch (reason) {
      this.update(toastId, {
        render: resolveMessage(
          error,
          reason,
          reason?.message || "Something went wrong.",
        ),
        type: "error",
        ...errorOptions,
      });

      throw reason;
    }
  },
};
