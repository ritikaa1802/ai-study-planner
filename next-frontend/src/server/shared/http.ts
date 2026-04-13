export type ServerContext = {
  params?: Record<string, string | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
  userId?: number;
  file?: {
    filename: string;
  };
};

export type ServerResult<T = any> = {
  status: number;
  body: T;
};

export const json = <T>(status: number, body: T): ServerResult<T> => ({
  status,
  body,
});
