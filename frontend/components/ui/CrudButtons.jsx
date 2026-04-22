"use client";

import React from "react";
import { Button } from "./Button";
import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from "./icons";

export function AddButton(props) {
  const { children, leftIcon, ...rest } = props;
  return (
    <Button variant="primary" leftIcon={leftIcon ?? <PlusIcon />} {...rest}>
      {children ?? "Add"}
    </Button>
  );
}

export function SubmitButton(props) {
  const { children, leftIcon, ...rest } = props;
  return (
    <Button
      variant="primary"
      type="submit"
      leftIcon={leftIcon ?? <CheckIcon />}
      {...rest}
    >
      {children ?? "Submit"}
    </Button>
  );
}

export function EditButton(props) {
  const { children, leftIcon, ...rest } = props;
  return (
    <Button variant="secondary" leftIcon={leftIcon ?? <EditIcon />} {...rest}>
      {children ?? "Edit"}
    </Button>
  );
}

export function DeleteButton(props) {
  const { children, leftIcon, ...rest } = props;
  return (
    <Button variant="danger" leftIcon={leftIcon ?? <TrashIcon />} {...rest}>
      {children ?? "Delete"}
    </Button>
  );
}

