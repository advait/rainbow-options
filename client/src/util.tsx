/**
 * If the condition is false, throw an Error with the given message.
 * @param condition
 * @param message
 */
import { OutlinedTextFieldProps, TextField } from "@material-ui/core";
import React, { useState } from "react";

export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export interface BlurInputProps extends OutlinedTextFieldProps {
  value: string;
  setValue: (t: string) => void;
}

/**
 * Temporarily holds onto input changes and only calls setValue when the
 * enter key is pressed or when the input is blurred.
 */
export function BlurInput(props: BlurInputProps) {
  const [tempValue, setTempValue] = useState(props.value);
  const onChange = (e: any) => setTempValue(e.target.value);
  const onKeyPress = (e: any) => {
    if (e.key === "Enter") {
      props.setValue(tempValue);
    }
  };
  const onBlur = () => props.setValue(tempValue);

  const childProps = {
    ...props,
    onChange,
    onKeyPress,
    onBlur,
    value: tempValue,
  };
  return <TextField {...childProps} />;
}
