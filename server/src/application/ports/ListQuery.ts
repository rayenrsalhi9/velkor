export interface ListQuery {
  q?: string | undefined;
  order: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
