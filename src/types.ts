/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VisitorRecord {
  id: string;
  name: string;
  firstVisit: number; // Unix timestamp ms
  lastVisit: number;  // Unix timestamp ms
  visitCount: number;
  platform?: string;
}

export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type ThemeMode = 'dark' | 'light';

export type OperatorType = '+' | '-' | '×' | '÷' | null;

export interface CalculatorMemory {
  display: string;
  previousValue: number | null;
  operator: OperatorType;
  waitingForOperand: boolean;
  formula: string;
  lastActionWasEquals: boolean;
  repeatOperand?: number;
  repeatOperator?: OperatorType;
}

export interface AdminUser {
  email: string;
  displayName: string;
  role: string;
  token: string;
}
