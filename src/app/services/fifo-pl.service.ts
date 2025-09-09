import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionDto, TxnType } from '../models/transaction';

export interface DashboardSummary {
  totalPnl: number;
  totalTransactions: number;
  totalProducts: number;
  profitableProducts: number;
  pnlByProduct: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class FifoPlService {
  private apiUrl = 'http://localhost:22064/api/FifoPl'; // My .NET Core API endpoint

  constructor(private http: HttpClient) { }

  getAllTransactions(): Observable<TransactionDto[]> {
    return this.http.get<TransactionDto[]>(this.apiUrl);
  }

  addTransaction(transaction: TransactionDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(this.apiUrl, transaction);
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard-summary`);
  }
}