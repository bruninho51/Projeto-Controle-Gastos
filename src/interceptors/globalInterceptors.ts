import { NullResponseInterceptor } from "./null-response.interceptor";
import { UserContextInterceptor } from "../logging/user-context.interceptor";

export const globalInterceptors = [
  new UserContextInterceptor(),
  new NullResponseInterceptor(),
];
