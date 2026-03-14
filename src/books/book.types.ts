export type Book = {
  id: number;
  title: string;
  author: string;
  genre: string;
  year: number;
  available: boolean;
  description: string | null;
  createdAt: string;
};

export type BookRow = {
  id: string;
  title: string;
  author: string;
  genre: string;
  year: number;
  available: boolean;
  description: string | null;
  created_at: string;
};

export type BookInput = {
  title: string;
  author: string;
  genre: string;
  year: number;
  available: boolean;
  description?: string | null;
};
