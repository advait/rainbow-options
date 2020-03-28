/**
 * If the condition is false, throw an Error with the given message.
 * @param condition
 * @param message
 */
export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
