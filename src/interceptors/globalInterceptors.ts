import { NullResponseInterceptor } from "./null-response.interceptor";

export const globalInterceptors = [new NullResponseInterceptor()];
