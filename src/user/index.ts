import { Attributes } from 'onecore';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  status?: boolean;
  createdDate?: string;
}
export function toString2(v: any): string {
  return v.toISOString();
}
export const userModel: Attributes = {
  id: {
    key: true,
    length: 11,
  },
  username: {
    length: 10,
    required: true,
  },
  email: {
    length: 31,
  },
  phone: {
    length: 20,
  },
  status: {
    length: 5,
    type: 'boolean',
  },
  createdDate: {
    length: 10,
    type: 'date',
    column: 'createddate',
    getString: toString2
  },
};
