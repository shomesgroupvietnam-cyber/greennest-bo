export type EntityId = string;

export type TimestampFields = {
  createdAt: string;
  updatedAt: string;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
};
