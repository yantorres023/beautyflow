export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { ok: false };

export function errorState(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { ok: false, message, fieldErrors };
}

export function successState(message: string): ActionState {
  return { ok: true, message };
}
