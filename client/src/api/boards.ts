import axios from 'axios';
import { getStoredToken } from './auth';
import type { Board, BoardListResponse } from '../types';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BASE_URL = `${API_URL}/api/boards`;
function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchBoards(): Promise<Board[]> {
  const res = await axios.get<BoardListResponse>(BASE_URL, { headers: authHeaders() });
  return res.data.boards;
}

export async function createBoard(name: string): Promise<Board> {
  const res = await axios.post<{ board: Board }>(BASE_URL, { name }, { headers: authHeaders() });
  return res.data.board;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await axios.delete(`${BASE_URL}/${boardId}`, { headers: authHeaders() });
}
