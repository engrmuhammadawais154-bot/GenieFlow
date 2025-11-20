import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Transaction } from "@/types";

export interface FinancialReport {
  transactions: Transaction[];
  period: { start: Date; end: Date };
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export class PDFService {
  static async generateFinancialReport(report: FinancialReport): Promise<void> {
    const html = this.createReportHTML(report);
    
    try {
      const { uri } = await Print.printToFileAsync({ html });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Financial Report",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    }
  }
  
  private static createReportHTML(report: FinancialReport): string {
    const { transactions, period, totalIncome, totalExpenses, balance } = report;
    
    const groupedByCategory = this.groupTransactionsByCategory(transactions);
    const categoryBreakdown = this.createCategoryBreakdown(groupedByCategory);
    const monthlyData = this.getMonthlyData(transactions);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #0F172A;
      line-height: 1.6;
    }
    
    .header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #8B5CF6;
    }
    
    h1 {
      font-size: 32px;
      color: #8B5CF6;
      margin-bottom: 10px;
    }
    
    .period {
      color: #64748B;
      font-size: 14px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .summary-card {
      background: #F8FAFC;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #8B5CF6;
    }
    
    .summary-card.income {
      border-left-color: #10B981;
    }
    
    .summary-card.expense {
      border-left-color: #EF4444;
    }
    
    .summary-label {
      font-size: 12px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .summary-value {
      font-size: 28px;
      font-weight: bold;
    }
    
    .summary-value.positive {
      color: #10B981;
    }
    
    .summary-value.negative {
      color: #EF4444;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #0F172A;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    thead {
      background: #F8FAFC;
    }
    
    th {
      text-align: left;
      padding: 12px;
      font-size: 12px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #E2E8F0;
    }
    
    .amount {
      font-weight: 600;
      text-align: right;
    }
    
    .income-amount {
      color: #10B981;
    }
    
    .expense-amount {
      color: #EF4444;
    }
    
    .category-breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .category-item {
      background: #F8FAFC;
      padding: 15px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .category-name {
      font-weight: 500;
    }
    
    .category-amount {
      font-weight: 600;
      font-size: 16px;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
      text-align: center;
      color: #64748B;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Financial Report</h1>
    <div class="period">
      ${this.formatDate(period.start)} - ${this.formatDate(period.end)}
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-card income">
      <div class="summary-label">Total Income</div>
      <div class="summary-value positive">$${totalIncome.toFixed(2)}</div>
    </div>
    <div class="summary-card expense">
      <div class="summary-label">Total Expenses</div>
      <div class="summary-value negative">$${totalExpenses.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Net Balance</div>
      <div class="summary-value ${balance >= 0 ? 'positive' : 'negative'}">
        $${balance.toFixed(2)}
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2>Category Breakdown</h2>
    ${categoryBreakdown}
  </div>
  
  <div class="section">
    <h2>Recent Transactions</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${transactions
          .slice(0, 50)
          .map(
            (t) => `
          <tr>
            <td>${this.formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td class="amount ${t.type === 'income' ? 'income-amount' : 'expense-amount'}">
              ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    ${transactions.length > 50 ? `<p><em>Showing 50 of ${transactions.length} transactions</em></p>` : ""}
  </div>
  
  <div class="section">
    <h2>Monthly Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Income</th>
          <th>Expenses</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>
        ${monthlyData
          .map(
            (m) => `
          <tr>
            <td>${m.month}</td>
            <td class="amount income-amount">$${m.income.toFixed(2)}</td>
            <td class="amount expense-amount">$${m.expenses.toFixed(2)}</td>
            <td class="amount ${m.net >= 0 ? 'income-amount' : 'expense-amount'}">
              $${m.net.toFixed(2)}
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>AI Assistant Financial Report</p>
  </div>
</body>
</html>
    `;
  }
  
  private static groupTransactionsByCategory(
    transactions: Transaction[]
  ): Map<string, { total: number; count: number; type: "income" | "expense" }> {
    const groups = new Map<string, { total: number; count: number; type: "income" | "expense" }>();
    
    for (const transaction of transactions) {
      const existing = groups.get(transaction.category);
      if (existing) {
        existing.total += transaction.amount;
        existing.count += 1;
      } else {
        groups.set(transaction.category, {
          total: transaction.amount,
          count: 1,
          type: transaction.type,
        });
      }
    }
    
    return groups;
  }
  
  private static createCategoryBreakdown(
    groups: Map<string, { total: number; count: number; type: "income" | "expense" }>
  ): string {
    const income: Array<[string, number]> = [];
    const expenses: Array<[string, number]> = [];
    
    for (const [category, data] of groups) {
      if (data.type === "income") {
        income.push([category, data.total]);
      } else {
        expenses.push([category, data.total]);
      }
    }
    
    income.sort((a, b) => b[1] - a[1]);
    expenses.sort((a, b) => b[1] - a[1]);
    
    const incomeHTML = income.length > 0
      ? `
        <h3 style="font-size: 16px; margin-bottom: 10px; color: #10B981;">Income Sources</h3>
        <div class="category-breakdown">
          ${income
            .map(
              ([cat, amount]) => `
            <div class="category-item">
              <span class="category-name">${cat}</span>
              <span class="category-amount income-amount">$${amount.toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      `
      : "";
    
    const expensesHTML = expenses.length > 0
      ? `
        <h3 style="font-size: 16px; margin-bottom: 10px; color: #EF4444;">Expense Categories</h3>
        <div class="category-breakdown">
          ${expenses
            .map(
              ([cat, amount]) => `
            <div class="category-item">
              <span class="category-name">${cat}</span>
              <span class="category-amount expense-amount">$${amount.toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      `
      : "";
    
    return incomeHTML + expensesHTML;
  }
  
  private static getMonthlyData(
    transactions: Transaction[]
  ): Array<{ month: string; income: number; expenses: number; net: number }> {
    const monthlyMap = new Map<
      string,
      { income: number; expenses: number }
    >();
    
    for (const transaction of transactions) {
      const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, "0")}`;
      
      const existing = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (transaction.type === "income") {
        existing.income += transaction.amount;
      } else {
        existing.expenses += transaction.amount;
      }
      
      monthlyMap.set(monthKey, existing);
    }
    
    const months = Array.from(monthlyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
      .map(([key, data]) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses,
        };
      });
    
    return months;
  }
  
  private static formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
